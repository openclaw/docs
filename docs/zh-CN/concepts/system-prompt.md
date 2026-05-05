---
read_when:
    - 编辑系统提示词文本、工具列表或时间/Heartbeat 部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示包含什么以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-05-05T16:51:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 会为每次智能体运行构建自定义系统提示词。该提示词由 **OpenClaw 所有**，并不使用 pi-coding-agent 默认提示词。

提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以贡献支持缓存感知的提示词指导，而无需替换完整的 OpenClaw 所有提示词。提供商运行时可以：

- 替换一小组具名核心段落（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在提示词缓存边界之上注入一个**稳定前缀**
- 在提示词缓存边界之下注入一个**动态后缀**

使用提供商所有的贡献来做模型系列特定调优。保留旧版 `before_prompt_build` 提示词变更用于兼容性或真正全局的提示词更改，而不是常规提供商行为。

OpenAI GPT-5 系列覆盖层会让核心执行规则保持小巧，并为人格锁定、简洁输出、工具纪律、并行查找、交付物覆盖、验证、缺失上下文和终端工具卫生添加模型特定指导。

## 结构

提示词有意保持紧凑，并使用固定段落：

- **工具**：结构化工具真实来源提醒，加上运行时工具使用指导。
- **执行倾向**：紧凑的跟进指导：对可执行请求在当前轮次内行动，继续直到完成或受阻，从较弱的工具结果中恢复，实时检查可变状态，并在最终回复前验证。
- **安全**：简短的护栏提醒，避免追求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载技能说明。
- **OpenClaw 自更新**：如何用 `config.schema.lookup` 安全检查配置，用 `config.patch` 修补配置，用 `config.apply` 替换完整配置，并且只在用户明确请求时运行 `update.run`。仅限所有者使用的 `gateway` 工具也会拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括会规范化为这些受保护 exec 路径的旧版 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时读取。
- **工作区文件（已注入）**：表示引导文件已包含在下方。
- **沙箱**（启用时）：表示沙箱隔离的运行时、沙箱路径，以及是否可用提权 exec。
- **当前日期和时间**：仅时区（缓存稳定；实时钟表来自 `session_status`）。
- **回复标签**：受支持提供商的可选回复标签语法。
- **Heartbeat**：当默认智能体启用 heartbeat 时的 heartbeat 提示词和确认行为。
- **运行时**：主机、OS、node、模型、仓库根目录（检测到时）、思考等级（一行）。
- **推理**：当前可见性等级 + /reasoning 切换提示。

OpenClaw 会把大型稳定内容（包括**项目上下文**）放在内部提示词缓存边界之上。易变的渠道/会话段落，例如 Control UI 嵌入指导、**消息传递**、**语音**、**群聊上下文**、**反应**、**Heartbeat** 和**运行时**，会追加到该边界之下，以便带有前缀缓存的本地后端可以在不同渠道轮次之间复用稳定的工作区前缀。工具描述同样应避免嵌入当前渠道名称，因为已接受的 schema 已经携带该运行时细节。

工具段落还包含针对长时间运行工作的运行时指导：

- 对未来跟进（`check back later`、提醒、周期性工作）使用 cron，而不是 `exec` 睡眠循环、`yieldMs` 延迟技巧或重复的 `process` 轮询
- 仅对现在启动并继续在后台运行的命令使用 `exec` / `process`
- 当启用自动完成唤醒时，只启动一次命令，并依赖在其输出或失败时触发的推送式唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是推送式的，并会自动向请求者公告
- 不要为了等待完成而循环轮询 `subagents list` / `sessions_list`

当启用实验性 `update_plan` 工具时，工具段落还会告诉模型仅将其用于非平凡的多步骤工作，保持恰好一个 `in_progress` 步骤，并避免每次更新后重复整个计划。

系统提示词中的安全护栏是建议性的。它们指导模型行为，但不强制执行策略。使用工具策略、exec 批准、沙箱隔离和渠道允许列表进行硬性执行；操作员可以按设计禁用这些机制。

在带有原生批准卡片/按钮的渠道上，运行时提示词现在会告诉智能体优先依赖该原生批准 UI。只有当工具结果说明聊天批准不可用，或手动批准是唯一路径时，才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置一个 `promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上面的所有段落。
- `minimal`：用于子智能体；省略 **Skills**、**记忆召回**、**OpenClaw 自更新**、**模型别名**、**用户身份**、**回复标签**、**消息传递**、**静默回复** 和 **Heartbeat**。工具、**安全**、工作区、沙箱、当前日期和时间（已知时）、运行时以及注入的上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为**子智能体上下文**，而不是**群聊上下文**。

对于渠道自动回复运行，当直接/群聊上下文已包含已解析的会话特定 `NO_REPLY` 行为时，OpenClaw 可以省略通用的**静默回复**段落。这避免在全局系统提示词和渠道上下文中重复令牌机制。

## 提示词快照

OpenClaw 会在 `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保留已提交的 Codex 运行时 happy path 提示词快照。它们会渲染选定的应用服务器线程/轮次参数，以及为 Telegram 直接消息、Discord 群组和 heartbeat 轮次重建的模型绑定提示词层栈。该栈包括一个固定的 Codex `gpt-5.5` 模型提示词夹具，它由 Codex 的模型目录/缓存形状生成；Codex happy path 权限 developer 文本；OpenClaw developer 指令；当 OpenClaw 提供时的轮次范围协作模式指令；用户轮次输入；以及对动态工具规格的引用。

使用 `pnpm prompt:snapshots:sync-codex-model` 刷新固定的 Codex 模型提示词夹具。默认情况下，该脚本会先查找 Codex 在 `$CODEX_HOME/models_cache.json` 的运行时缓存，然后查找 `~/.codex/models_cache.json`，最后才回退到维护者 Codex checkout 约定路径 `~/code/codex/codex-rs/models-manager/models.json`。如果这些来源都不存在，该命令会退出且不更改已提交的夹具。传入 `--catalog <path>` 可以从特定的 `models_cache.json` 或 `models.json` 文件刷新。

这些快照仍然不是逐字节的原始 OpenAI 请求捕获。Codex 可以在 OpenClaw 发送线程和轮次参数后，在 Codex 运行时内部添加运行时所有的工作区上下文，例如 `AGENTS.md`、环境上下文、记忆、应用/插件说明，以及内置的 Default 协作模式指令。

使用 `pnpm prompt:snapshots:gen` 重新生成它们，并用 `pnpm prompt:snapshots:check` 验证漂移。CI 会在额外的 boundary shard 中运行漂移检查，让提示词更改和快照更新保持附着在同一个 PR 上。

## 工作区引导注入

引导文件会被裁剪并追加到**项目上下文**下，以便模型无需显式读取即可看到身份和资料上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅限全新工作区）
- 存在时的 `MEMORY.md`

除非适用文件特定 gate，否则所有这些文件都会在每一轮被**注入到上下文窗口**中。当默认智能体禁用 heartbeat，或 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，正常运行会省略 `HEARTBEAT.md`。保持注入文件简洁，尤其是 `MEMORY.md`，它可能随时间增长，并导致意外偏高的上下文使用量和更频繁的压缩。

当会话运行在原生 Codex harness 上时，Codex 会通过自己的项目文档发现加载 `AGENTS.md`。OpenClaw 仍会解析剩余引导文件并将它们作为 Codex 配置指令转发，因此 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md` 会保持相同的工作区上下文角色，而不会重复 `AGENTS.md`。

<Note>
`memory/*.md` 每日文件**不是**常规引导项目上下文的一部分。在普通轮次中，它们会按需通过 `memory_search` 和 `memory_get` 工具访问，因此除非模型显式读取它们，否则它们不会计入上下文窗口。裸 `/new` 和 `/reset` 轮次是例外：运行时可以把最近的每日记忆作为一次性的启动上下文块前置到第一个轮次中。
</Note>

大型文件会用标记截断。每个文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（默认：12000）。跨文件注入的引导内容总量由 `agents.defaults.bootstrapTotalMaxChars` 封顶（默认：60000）。缺失文件会注入一个简短的缺失文件标记。当发生截断时，OpenClaw 可以注入一条简洁的系统提示词警告通知；通过 `agents.defaults.bootstrapPromptTruncationWarning` 控制此行为（`off`、`once`、`always`；默认：`once`）。详细的原始/注入计数会保留在 `/context`、`/status`、Doctor 和日志等诊断信息中。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截此步骤，以变更或替换注入的引导文件（例如将 `SOUL.md` 换成另一个人格）。

如果你想让智能体听起来不那么泛泛，可以从 [SOUL.md 人格指南](/zh-CN/concepts/soul) 开始。

要检查每个注入文件贡献了多少内容（原始与注入、截断，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见 [上下文](/zh-CN/concepts/context)。

## 时间处理

当用户时区已知时，系统提示词会包含专门的**当前日期和时间**段落。为了保持提示词缓存稳定，它现在只包含**时区**（没有动态时钟或时间格式）。

当智能体需要当前时间时，使用 `session_status`；状态卡片包含时间戳行。同一个工具也可以选择性地设置每会话模型覆盖（`model=default` 会清除它）。

配置项：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为详情见 [日期和时间](/zh-CN/date-time)。

## Skills

当存在符合条件的技能时，OpenClaw 会注入紧凑的**可用技能列表**（`formatSkillsForPrompt`），其中包含每个技能的**文件路径**。提示词会指示模型使用 `read` 加载列出位置（工作区、托管或内置）中的 SKILL.md。如果没有符合条件的技能，则省略 Skills 段落。

符合条件的判断包括技能元数据 gate、运行时环境/配置检查，以及配置了 `agents.defaults.skills` 或 `agents.list[].skills` 时的有效智能体技能允许列表。

插件内置技能只有在其所属插件启用时才符合条件。这让工具插件可以暴露更深入的操作指南，而无需把所有这些指导直接嵌入到每个工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这会让基础提示词保持较小，同时仍然支持有针对性的技能使用。

Skills 列表预算由 Skills 子系统负责：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 按智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用不同的配置面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分会将 Skills 大小控制与运行时读取/注入大小控制分离，例如 `memory_get`、实时工具结果，以及压缩后的 AGENTS.md 刷新。

## 文档

系统提示包含一个 **文档** 部分。本地文档可用时，它会指向本地 OpenClaw 文档目录（Git 检出中的 `docs/` 或内置 npm 包文档）。如果本地文档不可用，它会回退到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一部分还包含 OpenClaw 源码位置。Git 检出会暴露本地源码根目录，让智能体可以直接检查代码。包安装会包含 GitHub 源码 URL，并告知智能体在文档不完整或过时时去那里查看源码。该提示还会说明公共文档镜像、社区 Discord 和用于发现 Skills 的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。它会告诉模型先查阅文档来了解 OpenClaw 的行为、命令、配置或架构，并在可能时自行运行 `openclaw status`（仅在缺少访问权限时询问用户）。对于配置，它会专门指引智能体使用 `gateway` 工具操作 `config.schema.lookup` 来获取准确的字段级文档和约束，然后再查看 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 以获取更广泛的指南。

## 相关

- [智能体运行时](/zh-CN/concepts/agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
