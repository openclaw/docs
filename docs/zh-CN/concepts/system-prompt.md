---
read_when:
    - 编辑系统提示词文本、工具列表或时间/Heartbeat 部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含什么，以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-05-02T22:39:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 会为每次智能体运行构建自定义系统提示。该提示**由 OpenClaw 拥有**，不使用 pi-coding-agent 默认提示。

该提示由 OpenClaw 组装，并注入每次智能体运行。

提供商插件可以贡献具备缓存感知能力的提示指导，而无需替换
完整的 OpenClaw 所有提示。提供商运行时可以：

- 替换一小组具名核心段落（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示缓存边界上方注入**稳定前缀**
- 在提示缓存边界下方注入**动态后缀**

将提供商所有的贡献用于针对特定模型族的调优。保留旧版
`before_prompt_build` 提示变更机制，用于兼容性或真正全局的提示
变更，而不是常规提供商行为。

OpenAI GPT-5 系列叠加层会保持核心执行规则精简，并添加
针对模型的指导，涵盖角色锁定、简洁输出、工具纪律、
并行查找、交付物覆盖、验证、缺失上下文以及
终端工具卫生。

## 结构

该提示有意保持紧凑，并使用固定段落：

- **工具使用**：结构化工具事实来源提醒，以及运行时工具使用指导。
- **执行倾向**：紧凑的跟进指导：对可执行请求在当前回合内行动，
  持续推进直到完成或受阻，从弱工具结果中恢复，实时检查可变状态，
  并在最终回复前进行验证。
- **安全**：简短护栏提醒，避免寻求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载 skill 指令。
- **OpenClaw 自更新**：如何使用 `config.schema.lookup` 安全检查配置，
  使用 `config.patch` 修补配置，使用 `config.apply` 替换完整
  配置，并且仅在用户明确请求时运行 `update.run`。仅所有者可用的
  `gateway` 工具也会拒绝重写
  `tools.exec.ask` / `tools.exec.security`，包括会规范化为这些受保护 exec 路径的旧版
  `tools.bash.*` 别名。
- **Agent 工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时阅读它们。
- **工作区文件（已注入）**：表示启动文件包含在下方。
- **沙箱**（启用时）：表示沙箱隔离运行时、沙箱路径，以及是否可用提权 exec。
- **当前日期和时间**：用户本地时间、时区和时间格式。
- **回复标签**：支持的提供商可用的可选回复标签语法。
- **Heartbeat**：当默认智能体启用 heartbeat 时的 heartbeat 提示和确认行为。
- **运行时**：主机、操作系统、node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **推理**：当前可见性级别 + /reasoning 切换提示。

OpenClaw 会把大型稳定内容（包括**项目上下文**）保留在
内部提示缓存边界上方。易变的渠道/会话段落，例如
Control UI 嵌入指导、**消息传递**、**语音**、**群聊上下文**、
**回应**、**Heartbeats** 和**运行时**，会追加在该边界下方，
以便带有前缀缓存的本地后端可以在不同渠道回合之间复用稳定的工作区前缀。
同样，当已接受的 schema 已经携带当前渠道名称这类运行时细节时，
工具描述也应避免嵌入它们。

工具使用段落还包含长时间运行工作的运行时指导：

- 对未来的后续跟进（`check back later`、提醒、重复工作）使用 cron，
  而不是 `exec` sleep 循环、`yieldMs` 延迟技巧或反复的 `process`
  轮询
- 仅对现在启动并在后台持续运行的命令使用 `exec` / `process`
- 当启用自动完成唤醒时，只启动一次命令，并在其输出内容或失败时依赖
  基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是
  基于推送的，并会自动向请求方通告
- 不要在循环中轮询 `subagents list` / `sessions_list` 只为等待完成

当实验性 `update_plan` 工具启用时，工具使用段落还会告诉
模型仅在非平凡的多步骤工作中使用它，始终只保留一个
`in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示中的安全护栏是建议性的。它们指导模型行为，但不强制执行策略。请使用工具策略、exec 审批、沙箱隔离和渠道 allowlist 进行硬性强制；操作员可以按设计禁用这些机制。

在带有原生审批卡片/按钮的渠道中，运行时提示现在会告诉
智能体优先依赖该原生审批 UI。只有当工具结果表示聊天审批不可用，
或手动审批是唯一路径时，才应包含手动 `/approve` 命令。

## 提示模式

OpenClaw 可以为子智能体渲染更小的系统提示。运行时会为每次运行设置
`promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上面的所有段落。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw
  自更新**、**模型别名**、**用户身份**、**回复标签**、
  **消息传递**、**静默回复**和 **Heartbeats**。工具使用、**安全**、
  工作区、沙箱、当前日期和时间（已知时）、运行时以及注入的
  上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示会标记为**子智能体
上下文**，而不是**群聊上下文**。

对于渠道自动回复运行，当直接/群聊上下文已经包含解析后的
会话特定 `NO_REPLY` 行为时，OpenClaw 可以省略通用的**静默回复**
段落。这样可以避免在全局系统提示和渠道上下文中重复说明 token 机制。

## 提示快照

OpenClaw 在
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保留提交的 Codex 运行时 happy path 提示快照。它们会渲染
选定的 app-server 线程/回合参数，以及为 Telegram 直聊、Discord 群组和 heartbeat 回合重建的模型绑定提示层栈。该栈
包含一个固定的 Codex `gpt-5.5` 模型提示 fixture，该 fixture 根据 Codex 的
模型目录/缓存形态生成，还包含 Codex happy-path 权限开发者文本、
OpenClaw 开发者指令、用户回合输入，以及对动态
工具规范的引用。

使用 `pnpm prompt:snapshots:sync-codex-model` 刷新固定的 Codex 模型提示 fixture。默认情况下，该脚本会先查找
Codex 的运行时缓存 `$CODEX_HOME/models_cache.json`，然后查找
`~/.codex/models_cache.json`，最后才回退到维护者 Codex
checkout 约定路径 `~/code/codex/codex-rs/models-manager/models.json`。如果
这些来源都不存在，该命令会退出且不更改已提交的
fixture。传入 `--catalog <path>` 可从指定的 `models_cache.json`
或 `models.json` 文件刷新。

这些快照仍然不是逐字节的原始 OpenAI 请求捕获。Codex
可以在 OpenClaw 发送线程和回合参数之后，在 Codex 运行时内部添加运行时所有的工作区上下文，例如 `AGENTS.md`、环境
上下文、记忆、应用/插件指令，以及未来的协作模式
指令。

使用 `pnpm prompt:snapshots:gen` 重新生成它们，并使用
`pnpm prompt:snapshots:check` 验证漂移。CI 会在额外的
边界分片中运行漂移检查，以便提示变更和快照更新保持附着在同一个
PR 上。

## 工作区启动注入

启动文件会被裁剪并追加到**项目上下文**下方，让模型无需显式读取即可看到身份和个人资料上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新工作区）
- 存在时的 `MEMORY.md`

除非适用特定文件门控，否则所有这些文件都会在每个回合**注入上下文窗口**。
当默认智能体禁用 heartbeats，或
`agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，正常运行会省略 `HEARTBEAT.md`。请保持注入的
文件简洁，尤其是 `MEMORY.md`，它可能会随时间增长，并导致
上下文使用量意外升高和更频繁的压缩。

当会话在原生 Codex harness 上运行时，Codex 会通过自己的
项目文档发现机制加载 `AGENTS.md`。OpenClaw 仍然会解析其余
启动文件并将它们作为 Codex 配置指令转发，因此 `SOUL.md`、
`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和
`MEMORY.md` 会保持相同的工作区上下文角色，而不会重复
`AGENTS.md`。

<Note>
`memory/*.md` 每日文件**不是**正常启动项目上下文的一部分。在普通回合中，它们通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取它们，否则它们不会计入上下文窗口。裸 `/new` 和 `/reset` 回合是例外：运行时可以为该第一个回合前置最近的每日记忆，作为一次性启动上下文块。
</Note>

大型文件会带标记截断。每个文件的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（默认：12000）。跨文件注入的启动
内容总量上限由 `agents.defaults.bootstrapTotalMaxChars`
控制（默认：60000）。缺失文件会注入简短的缺失文件标记。发生截断时，
OpenClaw 可以在项目上下文中注入警告块；通过
`agents.defaults.bootstrapPromptTruncationWarning` 控制它（`off`、`once`、`always`；
默认：`once`）。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他启动文件
会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截这一步，以变更或替换
注入的启动文件（例如将 `SOUL.md` 替换为另一种 persona）。

如果你想让智能体听起来不那么通用，请从
[SOUL.md 个性指南](/zh-CN/concepts/soul) 开始。

要检查每个注入文件贡献了多少内容（原始与注入、截断，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见[上下文](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示会包含专门的**当前日期和时间**段落。为了保持提示缓存稳定，它现在只包含
**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，使用 `session_status`；Status 卡片
包含时间戳行。同一个工具还可以选择设置每会话模型
覆盖（`model=default` 会清除它）。

配置项：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为细节见[日期和时间](/zh-CN/date-time)。

## Skills

当存在符合条件的 Skills 时，OpenClaw 会注入紧凑的**可用 Skills 列表**
（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。该
提示会指示模型使用 `read` 加载列出位置（工作区、托管或内置）中的 SKILL.md。
如果没有符合条件的 Skills，则省略 Skills 段落。

条件包括 skill 元数据门控、运行时环境/配置检查，
以及在配置了 `agents.defaults.skills` 或
`agents.list[].skills` 时生效的智能体 skill allowlist。

插件内置的 Skills 只有在其所属插件启用时才符合条件。
这允许工具插件公开更深入的操作指南，而无需将所有
指导直接嵌入每个工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这可以让基础提示保持较小，同时仍然支持有针对性的 Skills 使用。

Skills 列表预算由 Skills 子系统拥有：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 每智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用有界运行时摘录使用不同的表面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分将 Skills 的大小控制与运行时读取/注入的大小控制分开，例如 `memory_get`、实时工具结果以及压缩后的 AGENTS.md 刷新。

## 文档

系统提示词包含一个 **文档** 部分。当本地文档可用时，它会指向本地 OpenClaw 文档目录（Git 检出中的 `docs/`，或内置 npm 包文档）。如果本地文档不可用，它会回退到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一部分还包含 OpenClaw 源码位置。Git 检出会暴露本地源码根目录，以便智能体可以直接检查代码。包安装会包含 GitHub 源码 URL，并告诉智能体在文档不完整或过时时去那里查看源码。该提示词还会注明公共文档镜像、社区 Discord 和用于发现 Skills 的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。它会告诉模型，涉及 OpenClaw 行为、命令、配置或架构时应先查阅文档，并在可行时自行运行 `openclaw status`（只有在缺少访问权限时才询问用户）。对于配置，它会特别引导智能体使用 `gateway` 工具操作 `config.schema.lookup` 获取精确到字段级别的文档和约束，然后再查看 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 获取更广泛的指导。

## 相关内容

- [Agent 运行时](/zh-CN/concepts/agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
