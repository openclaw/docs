---
read_when:
    - 编辑系统提示词文本、工具列表或时间/Heartbeat 部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含什么以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-05-10T19:32:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 会为每次智能体运行构建自定义系统提示词。该提示词**由 OpenClaw 所有**，不会使用 pi-coding-agent 默认提示词。

提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提示词组装有三层：

- `buildAgentSystemPrompt` 根据显式输入渲染提示词。它应该
  保持为纯渲染器，不应直接读取全局配置。
- `resolveAgentSystemPromptConfig` 为特定智能体解析由配置支持的提示词开关，例如
  所有者显示、TTS 提示、模型别名、记忆引用模式，以及子智能体
  委派模式。
- 运行时适配器（嵌入式、CLI、命令/导出预览、压缩）收集
  实时事实，例如工具、沙箱状态、渠道能力、上下文文件，
  以及提供商提示词贡献，然后调用已配置的提示词门面。

这样可以让导出/调试提示词表面与实时运行保持一致，而不会
把每个运行时特定细节都塞进一个单体构建器。

提供商插件可以贡献感知缓存的提示词指导，而无需替换
完整的 OpenClaw 所有提示词。提供商运行时可以：

- 替换少量具名核心章节（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示词缓存边界上方注入一个**稳定前缀**
- 在提示词缓存边界下方注入一个**动态后缀**

将提供商所有的贡献用于模型家族特定调优。保留旧版
`before_prompt_build` 提示词变更用于兼容性或真正全局的提示词
变更，而不是普通提供商行为。

OpenAI GPT-5 家族叠加层会让核心执行规则保持较小，并添加
模型特定指导，覆盖人格锁定、简洁输出、工具纪律、
并行查找、交付物覆盖、验证、缺失上下文，以及
终端工具卫生。

## 结构

该提示词有意保持紧凑，并使用固定章节：

- **工具**：结构化工具事实来源提醒，以及运行时工具使用指导。
- **执行倾向**：紧凑的跟进指导：对可执行请求在当前轮次中行动，
  持续推进直到完成或受阻，从较弱的工具结果中恢复，
  实时检查可变状态，并在最终回复前验证。
- **安全**：简短的护栏提醒，避免寻求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载技能说明。
- **OpenClaw 控制**：告诉模型在配置/重启工作中优先使用 `gateway` 工具，
  并避免编造 CLI 命令。
- **OpenClaw 自更新**：如何用 `config.schema.lookup` 安全检查配置，
  用 `config.patch` 修补配置，使用 `config.apply` 替换完整配置，
  并且仅在用户明确请求时运行 `update.run`。仅所有者可用的
  `gateway` 工具也会拒绝重写 `tools.exec.ask` / `tools.exec.security`，
  包括会规范化到这些受保护执行路径的旧版 `tools.bash.*`
  别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档/source 的本地路径，以及何时读取它们。
- **工作区文件（已注入）**：表示启动文件已包含在下方。
- **沙箱**（启用时）：表示沙箱隔离运行时、沙箱路径，以及是否可用提权执行。
- **当前日期和时间**：仅时区（缓存稳定；实时钟来自 `session_status`）。
- **助手输出指令**：紧凑的附件、语音备注和回复标签语法。
- **Heartbeat**：当默认智能体启用 Heartbeat 时的 Heartbeat 提示词和确认行为。
- **运行时**：主机、操作系统、Node、模型、仓库根目录（检测到时）、思考等级（一行）。
- **推理**：当前可见性等级 + /reasoning 切换提示。

OpenClaw 会把大型稳定内容（包括**项目上下文**）放在
内部提示词缓存边界上方。易变的渠道/会话章节，例如
控制 UI 嵌入指导、**消息**、**语音**、**群聊上下文**、
**回应**、**Heartbeat** 和**运行时**，会追加到该边界下方，
这样带前缀缓存的本地后端可以在不同渠道轮次之间复用稳定的工作区前缀。
同样，当接受的 schema 已经携带该运行时细节时，工具描述也应避免嵌入当前
渠道名称。

工具章节还包含面向长时间运行工作的运行时指导：

- 对未来跟进（`check back later`、提醒、周期性工作）使用 cron，
  而不是 `exec` 睡眠循环、`yieldMs` 延迟技巧，或重复的 `process`
  轮询
- `exec` / `process` 仅用于现在启动并继续在后台运行的命令
- 当启用自动完成唤醒时，只启动一次命令，并在它输出内容或失败时依赖
  基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是
  基于推送的，并会自动向请求者回报
- 不要为了等待完成而循环轮询 `subagents list` / `sessions_list`

`agents.defaults.subagents.delegationMode` 可以增强此指导。
默认的 `suggest` 模式保留基线提示。`prefer` 会添加一个专门的
**子智能体委派**章节，告诉主智能体充当响应迅速的
协调者，并将任何比直接回复更复杂的事项通过 `sessions_spawn`
推送出去。这只是提示词层面的；工具策略仍控制
`sessions_spawn` 是否可用。

当启用实验性的 `update_plan` 工具时，工具章节还会告诉
模型只在非平凡的多步骤工作中使用它，始终保持恰好一个
`in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示词中的安全护栏是建议性的。它们指导模型行为，但不强制执行策略。使用工具策略、执行审批、沙箱隔离和渠道 allowlist 进行硬性强制；运营者可以按设计禁用这些机制。

在带原生审批卡片/按钮的渠道上，运行时提示词现在会告诉
智能体优先依赖该原生审批 UI。只有当工具结果表示聊天审批不可用，
或手动审批是唯一路径时，才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置
`promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上面的所有章节。
- `minimal`：用于子智能体；省略**记忆召回**、**OpenClaw
  自更新**、**模型别名**、**用户身份**、**助手输出指令**、
  **消息**、**静默回复**和 **Heartbeat**。工具、**安全**、
  提供时的 **Skills**、工作区、沙箱、当前日期和时间（已知时）、
  运行时，以及注入的上下文仍可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为**子智能体
上下文**，而不是**群聊上下文**。

对于渠道自动回复运行，当直接/群聊上下文已经包含解析后的
会话特定 `NO_REPLY` 行为时，OpenClaw 可以省略通用的**静默回复**
章节。这样可以避免在全局系统提示词和渠道上下文中重复 token 机制。

## 提示词快照

OpenClaw 将 Codex runtime 正常路径的已提交提示词快照保存在
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下。它们会渲染
选定的应用服务器线程/轮次参数，以及为 Telegram 私信、Discord 群组和 Heartbeat 轮次
重建的模型绑定提示词层栈。该栈包含一个固定的 Codex `gpt-5.5`
模型提示词夹具，它由 Codex 的模型目录/缓存形状生成，还包含
Codex 正常路径权限开发者文本、OpenClaw 开发者说明、
当 OpenClaw 提供时的轮次范围协作模式说明、用户轮次输入，
以及对动态工具规格的引用。

使用 `pnpm prompt:snapshots:sync-codex-model` 刷新固定的 Codex 模型提示词夹具。
默认情况下，该脚本会先查找 `$CODEX_HOME/models_cache.json` 中的
Codex 运行时缓存，然后查找 `~/.codex/models_cache.json`，
最后才回退到维护者 Codex checkout 约定路径
`~/code/codex/codex-rs/models-manager/models.json`。如果这些来源都不存在，
命令会退出且不更改已提交夹具。传入 `--catalog <path>` 可从特定的
`models_cache.json` 或 `models.json` 文件刷新。

这些快照仍然不是逐字节的原始 OpenAI 请求捕获。Codex
可以在 OpenClaw 发送线程和轮次参数后，在 Codex runtime 内添加
运行时所有的工作区上下文，例如 `AGENTS.md`、环境上下文、
记忆、应用/插件说明，以及内置的 Default
协作模式说明。

用 `pnpm prompt:snapshots:gen` 重新生成它们，并用
`pnpm prompt:snapshots:check` 验证漂移。CI 会在额外的
边界分片中运行漂移检查，以便提示词变更和快照更新保持附着在同一个
PR 上。

## 工作区启动注入

启动文件会被裁剪并追加到**项目上下文**下方，这样模型无需显式读取也能看到身份和画像上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新工作区中）
- `MEMORY.md`（存在时）

除非某个文件有特定门控，否则这些文件都会在每个轮次中**注入到上下文窗口**。
当默认智能体禁用 Heartbeat，或
`agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，
`HEARTBEAT.md` 会在普通运行中省略。保持注入文件简洁，
尤其是 `MEMORY.md`。`MEMORY.md` 旨在保持为一份
经过整理的长期摘要；详细日常笔记应放在 `memory/*.md` 中，
由 `memory_search` 和 `memory_get` 按需检索。过大的
`MEMORY.md` 文件会增加提示词用量，并且由于下面的启动文件限制，
可能只会被部分注入。

当会话运行在原生 Codex harness 上时，Codex 会通过自己的项目文档发现
加载 `AGENTS.md`。OpenClaw 仍会解析剩余启动文件，并将它们作为 Codex
配置说明转发，因此 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、
`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md` 会继续保持相同的工作区上下文
角色，而不会重复 `AGENTS.md`。

<Note>
`memory/*.md` 日常文件**不是**普通启动项目上下文的一部分。在常规轮次中，它们会通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取它们，否则不会占用上下文窗口。裸 `/new` 和 `/reset` 轮次是例外：运行时可以为第一个轮次把最近的日常记忆作为一次性启动上下文块前置。
</Note>

大文件会带标记截断。每个文件的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（默认：12000）。跨文件注入的启动
内容总量受 `agents.defaults.bootstrapTotalMaxChars` 限制
（默认：60000）。缺失文件会注入简短的缺失文件标记。发生截断时，
OpenClaw 可以注入一条简洁的系统提示词警告通知；通过
`agents.defaults.bootstrapPromptTruncationWarning` 控制它（`off`、`once`、`always`；
默认：`once`）。详细的原始/注入计数会保留在诊断中，例如
`/context`、`/status`、Doctor 和日志。

对于记忆文件，截断并不是数据丢失：文件在磁盘上保持完整，
但在模型直接读取或搜索记忆之前，只能看到缩短后的注入副本。
如果 `MEMORY.md` 反复被截断，请将其提炼为更短的持久摘要，
并把详细历史移入 `memory/*.md`，或有意提高启动限制。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他启动文件
会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截这一步，以变更或替换
注入的启动文件（例如将 `SOUL.md` 换成备用人格）。

如果你想让智能体听起来不那么泛泛，先阅读
[SOUL.md 人格指南](/zh-CN/concepts/soul)。

要检查每个注入文件的贡献量（原始与注入、截断，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。请参阅[上下文](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示词会包含一个专用的 **Current Date & Time** 部分。为了保持提示词缓存稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，使用 `session_status`；状态卡片包含时间戳行。同一个工具还可以选择设置按会话生效的模型覆盖（`model=default` 会清除它）。

配置项：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

完整行为详情请参阅[日期和时间](/zh-CN/date-time)。

## Skills

当存在符合条件的 Skills 时，OpenClaw 会注入一个紧凑的**可用 Skills 列表**
（`formatSkillsForPrompt`），其中包含每个 Skill 的**文件路径**。提示词会指示模型使用 `read` 加载列出位置中的 SKILL.md（工作区、托管或内置）。如果没有符合条件的 Skills，则省略 Skills 部分。

符合条件包括 Skill 元数据门控、运行时环境/配置检查，以及在配置了 `agents.defaults.skills` 或 `agents.list[].skills` 时生效的智能体 Skill 允许列表。

插件内置的 Skills 只有在其所属插件启用时才符合条件。这允许工具插件公开更深入的操作指南，而无需把所有这些指南直接嵌入每个工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这样可以保持基础提示词较小，同时仍然支持有针对性的 Skill 使用。

Skills 列表预算由 Skills 子系统负责：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 按智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用有界运行时摘录使用另一个配置面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分让 Skills 大小控制与运行时读取/注入大小控制分离，例如 `memory_get`、实时工具结果和压缩后的 AGENTS.md 刷新。

## 文档

系统提示词包含一个**文档**部分。当本地文档可用时，它会指向本地 OpenClaw 文档目录（Git checkout 中的 `docs/`，或内置 npm 包文档）。如果本地文档不可用，它会回退到
[https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一部分还包含 OpenClaw 源码位置。Git checkout 会公开本地源码根目录，使智能体可以直接检查代码。包安装会包含 GitHub 源码 URL，并告诉智能体在文档不完整或过期时去那里查看源码。提示词还会提到公共文档镜像、社区 Discord 和用于发现 Skills 的 ClawHub
([https://clawhub.ai](https://clawhub.ai))。它会告诉模型，对于 OpenClaw 行为、命令、配置或架构，优先查阅文档，并在可行时自行运行 `openclaw status`（只有在缺少访问权限时才询问用户）。对于配置，它会专门指引智能体使用 `gateway` 工具操作
`config.schema.lookup` 获取精确到字段级别的文档和约束，然后再查阅
`docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md`
获取更广泛的指南。

## 相关

- [智能体运行时](/zh-CN/concepts/agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
