---
read_when:
    - 编辑系统提示词文本、工具列表或时间/Heartbeat 部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含什么以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-05-04T00:38:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 会为每次 agent 运行构建自定义系统提示词。该提示词由 **OpenClaw 所有**，不使用 pi-coding-agent 的默认提示词。

提示词由 OpenClaw 组装，并注入到每次 agent 运行中。

提供商插件可以贡献支持缓存的提示词指导，而无需替换
完整的 OpenClaw 所有提示词。提供商运行时可以：

- 替换一小组具名核心区段（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示词缓存边界上方注入**稳定前缀**
- 在提示词缓存边界下方注入**动态后缀**

使用提供商所有的贡献来进行模型家族特定调优。保留旧版
`before_prompt_build` 提示词变更，用于兼容性或真正全局的提示词
变更，而不是常规提供商行为。

OpenAI GPT-5 家族覆盖层会让核心执行规则保持精简，并添加
针对模型的指导，涵盖 persona 锁定、简洁输出、工具纪律、
并行查找、交付物覆盖、验证、缺失上下文，以及
终端工具卫生。

## 结构

提示词有意保持紧凑，并使用固定区段：

- **工具使用**：结构化工具事实来源提醒，加上运行时工具使用指导。
- **执行倾向**：紧凑的跟进指导：对可执行请求在当前轮次内行动，
  持续推进直到完成或受阻，从较弱的工具结果中恢复，实时检查可变状态，
  并在最终回复前验证。
- **安全**：简短的护栏提醒，避免寻求权力的行为或绕过监督。
- **Skills**（可用时）：告知模型如何按需加载 skill 指令。
- **OpenClaw 自更新**：如何用
  `config.schema.lookup` 安全检查配置，用 `config.patch` 修补配置，
  用 `config.apply` 替换完整配置，并且仅在用户明确请求时运行
  `update.run`。仅限所有者使用的 `gateway` 工具也会拒绝重写
  `tools.exec.ask` / `tools.exec.security`，包括会规范化到这些受保护
  exec 路径的旧版 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包），以及何时读取它们。
- **工作区文件（已注入）**：表示 bootstrap 文件已包含在下方。
- **沙箱**（启用时）：表示沙箱隔离运行时、沙箱路径，以及是否可用提权 exec。
- **当前日期和时间**：用户本地时间、时区和时间格式。
- **回复标签**：受支持提供商的可选回复标签语法。
- **Heartbeats**：当默认 agent 启用 heartbeats 时的 heartbeat 提示词和 ack 行为。
- **运行时**：主机、操作系统、node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **推理**：当前可见性级别 + /reasoning 切换提示。

OpenClaw 会将大型稳定内容（包括**项目上下文**）放在
内部提示词缓存边界上方。易变的渠道/会话区段，例如
Control UI 嵌入指导、**消息**、**语音**、**群聊上下文**、
**回应**、**Heartbeats** 和 **运行时**，会追加到该边界下方，
这样带前缀缓存的本地后端就能在不同渠道轮次之间复用稳定的工作区前缀。
同样，当已接受的 schema 已携带当前渠道名称这类运行时细节时，
工具描述应避免嵌入这些名称。

工具使用区段还包含长期运行工作的运行时指导：

- 对未来跟进（`check back later`、提醒、重复性工作）使用 cron，
  而不是 `exec` sleep 循环、`yieldMs` 延迟技巧，或重复 `process`
  轮询
- 仅对立即开始并在后台持续运行的命令使用 `exec` / `process`
- 当启用自动完成唤醒时，只启动一次命令，并在它输出内容或失败时依赖
  基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、
  输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；sub-agent 完成是
  基于推送的，并会自动向请求者回报
- 不要循环轮询 `subagents list` / `sessions_list`，只为了等待完成

当启用实验性 `update_plan` 工具时，工具使用还会告知模型：
仅将它用于非平凡的多步骤工作，始终只保留一个
`in_progress` 步骤，并避免每次更新后重复整个计划。

系统提示词中的安全护栏是建议性的。它们会指导模型行为，但不强制执行策略。请使用工具策略、exec 审批、沙箱隔离和渠道 allowlist 来进行硬性执行；操作员可以按设计禁用这些机制。

在带原生审批卡片/按钮的渠道上，运行时提示词现在会告诉
agent 优先依赖该原生审批 UI。只有在工具结果表示聊天审批不可用，
或手动审批是唯一路径时，才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为 sub-agent 渲染更小的系统提示词。运行时会为每次运行设置
`promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上方所有区段。
- `minimal`：用于 sub-agent；省略 **Skills**、**记忆召回**、**OpenClaw
  自更新**、**模型别名**、**用户身份**、**回复标签**、
  **消息**、**静默回复**和 **Heartbeats**。工具使用、**安全**、
  工作区、沙箱、当前日期和时间（已知时）、运行时以及注入的上下文
  仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为 **Subagent
Context**，而不是 **Group Chat Context**。

对于渠道自动回复运行，当直接/群聊上下文已经包含解析后的
会话特定 `NO_REPLY` 行为时，OpenClaw 可以省略通用的**静默回复**
区段。这样可以避免在全局系统提示词和渠道上下文中重复 token 机制。

## 提示词快照

OpenClaw 会在
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保留已提交的
Codex 运行时 happy path 提示词快照。它们会渲染选定的 app-server 线程/轮次参数，
以及重构出的模型绑定提示词层栈，覆盖 Telegram 直接聊天、Discord 群组和 heartbeat 轮次。
该栈包含固定的 Codex `gpt-5.5` 模型提示词 fixture（根据 Codex 的
模型目录/缓存形态生成）、Codex happy-path 权限 developer 文本、
OpenClaw developer 指令、当 OpenClaw 提供时的轮次作用域协作模式指令、
用户轮次输入，以及对动态工具规范的引用。

使用 `pnpm prompt:snapshots:sync-codex-model` 刷新固定的 Codex 模型提示词 fixture。
默认情况下，该脚本会先查找 Codex 在 `$CODEX_HOME/models_cache.json` 的运行时缓存，
再查找 `~/.codex/models_cache.json`，最后才回退到维护者 Codex checkout 约定路径
`~/code/codex/codex-rs/models-manager/models.json`。如果这些来源都不存在，
该命令会退出且不更改已提交的 fixture。传入 `--catalog <path>` 可从指定的
`models_cache.json` 或 `models.json` 文件刷新。

这些快照仍然不是逐字节的原始 OpenAI 请求捕获。OpenClaw 发送线程和轮次参数后，
Codex 可以在 Codex 运行时内部添加运行时所有的工作区上下文，例如
`AGENTS.md`、环境上下文、记忆、应用/插件指令，以及内置的 Default
协作模式指令。

使用 `pnpm prompt:snapshots:gen` 重新生成它们，并用
`pnpm prompt:snapshots:check` 验证漂移。CI 会在附加的
边界分片中运行漂移检查，以便提示词变更和快照更新保持附着在同一个
PR 上。

## 工作区 bootstrap 注入

Bootstrap 文件会被裁剪并追加到**项目上下文**下，因此模型无需显式读取就能看到身份和 profile 上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅限全新工作区）
- `MEMORY.md`（存在时）

除非适用文件特定 gate，否则这些文件都会在每个轮次中**注入到上下文窗口**。
当默认 agent 禁用 heartbeats，或
`agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，
常规运行会省略 `HEARTBEAT.md`。请保持注入文件简洁，尤其是 `MEMORY.md`，
它可能随时间增长，并导致上下文使用量意外偏高、压缩更频繁。

当会话运行在原生 Codex harness 上时，Codex 会通过自己的项目文档发现机制加载
`AGENTS.md`。OpenClaw 仍会解析其余 bootstrap 文件，并将它们作为 Codex 配置指令转发，
因此 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md` 和 `MEMORY.md` 会保持相同的工作区上下文角色，
且不会重复 `AGENTS.md`。

<Note>
`memory/*.md` 每日文件**不是**常规 bootstrap 项目上下文的一部分。在普通轮次中，它们通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型明确读取它们，否则不会占用上下文窗口。裸 `/new` 和 `/reset` 轮次是例外：运行时可以把最近的每日记忆作为一次性启动上下文块前置到该首个轮次中。
</Note>

大型文件会用标记截断。每个文件的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（默认值：12000）。跨文件注入的 bootstrap
内容总量由 `agents.defaults.bootstrapTotalMaxChars` 限制
（默认值：60000）。缺失文件会注入一个简短的缺失文件标记。发生截断时，
OpenClaw 可以注入简洁的系统提示词警告通知；使用
`agents.defaults.bootstrapPromptTruncationWarning` 控制它（`off`、`once`、`always`；
默认值：`once`）。详细的原始/注入计数保留在 `/context`、`/status`、Doctor 和日志等诊断信息中。

Sub-agent 会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他 bootstrap 文件会被过滤掉，
以保持 sub-agent 上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截这一步，以变更或替换
已注入的 bootstrap 文件（例如将 `SOUL.md` 替换为备用 persona）。

如果你想让 agent 听起来不那么通用，请从
[SOUL.md 个性指南](/zh-CN/concepts/soul)开始。

要检查每个注入文件贡献了多少内容（原始 vs 注入、截断，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见 [上下文](/zh-CN/concepts/context)。

## 时间处理

当用户时区已知时，系统提示词会包含专用的**当前日期和时间**区段。
为了让提示词缓存保持稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当 agent 需要当前时间时，使用 `session_status`；状态卡片包含时间戳行。
同一个工具也可以选择设置按会话生效的模型覆盖（`model=default` 会清除它）。

配置项：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

完整行为详情见[日期和时间](/zh-CN/date-time)。

## Skills

当存在符合条件的 Skills 时，OpenClaw 会注入一个紧凑的**可用 Skills 列表**
（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。
提示词会指示模型使用 `read` 加载列出位置处的 SKILL.md
（工作区、托管或内置）。如果没有符合条件的 Skills，则省略
Skills 区段。

符合条件包括 skill 元数据 gate、运行时环境/配置检查，以及在配置了
`agents.defaults.skills` 或 `agents.list[].skills` 时生效的 agent skill allowlist。

插件内置 Skills 只有在其所属插件启用时才符合条件。
这让工具插件能够暴露更深入的操作指南，而无需把所有这些指导直接嵌入到每个工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这能让基础提示词保持较小，同时仍然支持有针对性的 skill 使用。

Skills 列表预算由 Skills 子系统所有：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 每智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用另一个接口：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分将 Skills 大小控制与运行时读取/注入大小控制分开，例如 `memory_get`、实时工具结果，以及压缩后的 AGENTS.md 刷新。

## 文档

系统提示包含一个 **文档** 部分。可用本地文档时，它会指向本地 OpenClaw 文档目录（Git checkout 中的 `docs/`，或内置 npm 包文档）。如果本地文档不可用，它会回退到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一部分还包含 OpenClaw 源码位置。Git checkout 会暴露本地源码根目录，让智能体可以直接检查代码。包安装会包含 GitHub 源码 URL，并告诉智能体在文档不完整或过期时到那里查看源码。该提示还会注明公共文档镜像、社区 Discord，以及用于发现 Skills 的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。它会告诉模型，对于 OpenClaw 行为、命令、配置或架构，应先查阅文档，并在可行时自行运行 `openclaw status`（只有在缺少访问权限时才询问用户）。对于配置，它会特别指引智能体先使用 `gateway` 工具操作 `config.schema.lookup` 获取精确的字段级文档和约束，再参考 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 获取更广泛的指引。

## 相关

- [智能体运行时](/zh-CN/concepts/agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
