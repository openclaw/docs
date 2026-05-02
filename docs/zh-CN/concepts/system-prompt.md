---
read_when:
    - 编辑系统提示文本、工具列表或时间/Heartbeat 部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含什么以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-05-02T16:04:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 会为每次智能体运行构建自定义系统提示词。该提示词由 **OpenClaw 所有**，不会使用 pi-coding-agent 默认提示词。

提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以贡献缓存感知的提示词指导，而无需替换
完整的 OpenClaw 所有提示词。提供商运行时可以：

- 替换一小组命名的核心区段（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示词缓存边界上方注入一个**稳定前缀**
- 在提示词缓存边界下方注入一个**动态后缀**

将提供商所有的贡献用于特定模型家族的调优。保留旧版
`before_prompt_build` 提示词变更，用于兼容性或真正全局的提示词
更改，而不是常规提供商行为。

OpenAI GPT-5 家族覆盖层会让核心执行规则保持小巧，并添加
针对模型的指导，涵盖人设锁定、简洁输出、工具纪律、
并行查找、交付物覆盖、验证、缺失上下文和
终端工具卫生。

## 结构

提示词有意保持紧凑，并使用固定区段：

- **工具使用**：结构化工具真实来源提醒，以及运行时工具使用指导。
- **执行倾向**：紧凑的跟进指导：对可执行请求在本轮中行动，
  持续进行直到完成或受阻，从薄弱的工具结果中恢复，
  实时检查可变状态，并在最终回复前验证。
- **安全**：简短的护栏提醒，避免追求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载 Skills 指令。
- **OpenClaw 自更新**：如何使用
  `config.schema.lookup` 安全检查配置，使用 `config.patch` 修补配置，
  使用 `config.apply` 替换完整配置，并且只在用户明确请求时运行
  `update.run`。仅所有者可用的 `gateway` 工具也会拒绝重写
  `tools.exec.ask` / `tools.exec.security`，包括会规范化到这些受保护 exec 路径的旧版
  `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm package），以及何时阅读它们。
- **工作区文件（已注入）**：表示 bootstrap 文件包含在下方。
- **沙箱**（启用时）：表示沙箱隔离运行时、沙箱路径，以及是否可用提权 exec。
- **当前日期和时间**：用户本地时间、时区和时间格式。
- **回复标签**：受支持提供商的可选回复标签语法。
- **Heartbeats**：默认智能体启用 Heartbeats 时的 Heartbeat 提示词和确认行为。
- **运行时**：主机、OS、node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **推理**：当前可见性级别 + /reasoning 切换提示。

OpenClaw 会将大型稳定内容（包括**项目上下文**）保留在
内部提示词缓存边界之上。易变的渠道/会话区段，例如
Control UI 嵌入指导、**消息传递**、**语音**、**群聊上下文**、
**回应**、**Heartbeats** 和**运行时**，会追加到该边界下方，
这样带前缀缓存的本地后端就能在不同渠道轮次之间复用稳定的工作区前缀。
同样，工具描述也应避免嵌入当前渠道名称，前提是已接受的 schema
已经携带该运行时细节。

工具使用区段还包含面向长时间运行工作的运行时指导：

- 对未来跟进使用 cron（`check back later`、提醒、周期性工作），
  而不是 `exec` sleep 循环、`yieldMs` 延迟技巧，或重复的 `process`
  轮询
- 仅将 `exec` / `process` 用于现在开始并在后台继续运行的命令
- 启用自动完成唤醒时，只启动命令一次，并在其输出或失败时依赖
  基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是
  基于推送的，并会自动向请求者通告
- 不要在循环中轮询 `subagents list` / `sessions_list`，只是为了等待
  完成

启用实验性 `update_plan` 工具时，工具使用区段还会告诉
模型只在非简单的多步骤工作中使用它，始终只保留一个
`in_progress` 步骤，并避免每次更新后重复整个计划。

系统提示词中的安全护栏是建议性的。它们指导模型行为，但不强制执行策略。使用工具策略、exec 审批、沙箱隔离和渠道 allowlist 进行硬性执行；操作员可以按设计禁用这些机制。

在带有原生审批卡片/按钮的渠道上，运行时提示词现在会告诉
智能体优先依赖该原生审批 UI。只有当工具结果表示聊天审批不可用，
或手动审批是唯一路径时，才应包含手动
`/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置
`promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上面的所有区段。
- `minimal`：用于子智能体；省略 **Skills**、**记忆召回**、**OpenClaw
  自更新**、**模型别名**、**用户身份**、**回复标签**、
  **消息传递**、**静默回复** 和 **Heartbeats**。工具使用、**安全**、
  工作区、沙箱、当前日期和时间（已知时）、运行时以及注入的
  上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为**子智能体
上下文**，而不是**群聊上下文**。

对于渠道自动回复运行，当直接/群聊上下文已经包含解析后的
特定会话 `NO_REPLY` 行为时，OpenClaw 可以省略通用的**静默回复**
区段。这样可避免在全局系统提示词和渠道上下文中同时重复令牌机制。

## 提示词快照

OpenClaw 在 `test/fixtures/agents/prompt-snapshots/happy-path/` 下保留
已提交的 Codex/message-tool 运行时 happy-path 提示词快照。它们会渲染
OpenClaw 所有的 Codex app-server 开发者指令、选定的线程
开始/恢复参数、轮次用户输入，以及 Telegram 直聊、
Discord 群组和 Heartbeat 轮次的动态工具规格。隐藏的基础 Codex 系统提示词和
轮次范围的 Codex 协作模式指令由 Codex 运行时所有，
不会由 OpenClaw 渲染。

使用 `pnpm prompt:snapshots:gen` 重新生成它们，并使用
`pnpm prompt:snapshots:check` 验证漂移。

## 工作区 bootstrap 注入

Bootstrap 文件会被裁剪并追加到**项目上下文**下，使模型无需显式读取即可看到身份和档案上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅限全新工作区）
- 存在时的 `MEMORY.md`

除非适用特定文件门控，否则所有这些文件都会在每一轮被**注入上下文窗口**。
当默认智能体禁用 Heartbeats，或
`agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，
`HEARTBEAT.md` 会在常规运行中省略。保持注入文件简洁，尤其是
`MEMORY.md`，它可能随时间增长，导致上下文使用量意外升高并更频繁压缩。

<Note>
`memory/*.md` 每日文件**不是**常规 bootstrap 项目上下文的一部分。在普通轮次中，它们会通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取它们，否则不会计入上下文窗口。裸 `/new` 和 `/reset` 轮次是例外：运行时可以为该第一轮前置近期每日记忆，作为一次性启动上下文块。
</Note>

大型文件会用标记截断。每个文件的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（默认：12000）。跨文件的注入 bootstrap
内容总量由 `agents.defaults.bootstrapTotalMaxChars` 封顶
（默认：60000）。缺失文件会注入简短的缺失文件标记。发生截断时，
OpenClaw 可以在项目上下文中注入警告块；使用
`agents.defaults.bootstrapPromptTruncationWarning` 控制它（`off`、`once`、`always`；
默认：`once`）。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他 bootstrap 文件
会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截这一步，以变更或替换
注入的 bootstrap 文件（例如将 `SOUL.md` 替换为另一种人设）。

如果你想让智能体听起来不那么泛泛，可以从
[SOUL.md 人格指南](/zh-CN/concepts/soul)开始。

要检查每个注入文件贡献了多少内容（原始 vs 已注入、截断，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见[上下文](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示词会包含专门的**当前日期和时间**区段。
为了保持提示词缓存稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，使用 `session_status`；状态卡片
会包含时间戳行。同一工具还可以选择设置每会话模型
覆盖（`model=default` 会清除它）。

使用以下项配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

参见[日期和时间](/zh-CN/date-time)了解完整行为细节。

## Skills

当存在符合条件的 Skills 时，OpenClaw 会注入紧凑的**可用 Skills 列表**
（`formatSkillsForPrompt`），其中包含每个 Skill 的**文件路径**。
提示词会指示模型使用 `read` 加载所列位置（工作区、托管或内置）中的 SKILL.md。
如果没有符合条件的 Skills，则会省略 Skills 区段。

符合条件包括 Skill 元数据门控、运行时环境/配置检查，
以及在配置了 `agents.defaults.skills` 或
`agents.list[].skills` 时的有效智能体 Skill allowlist。

插件内置的 Skills 只有在其所属插件启用时才符合条件。
这让工具插件可以公开更深入的操作指南，而无需将所有
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

这会保持基础提示词小巧，同时仍支持有针对性的 Skills 使用。

Skills 列表预算由 Skills 子系统所有：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 每智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用不同的表面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分让 Skills 大小控制与运行时读取/注入大小控制保持分离，
例如 `memory_get`、实时工具结果，以及压缩后的 AGENTS.md 刷新。

## 文档

系统提示词包含一个**文档**区段。当本地文档可用时，它会
指向本地 OpenClaw 文档目录（Git checkout 中的 `docs/`，或内置 npm
package 文档）。如果本地文档不可用，则回退到
[https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一区段还包含 OpenClaw 源码位置。Git checkout 会暴露本地
源码根目录，让智能体可以直接检查代码。Package 安装会包含 GitHub
源码 URL，并告诉智能体在文档不完整或过时时去那里查看源码。
提示词还会提到公开文档镜像、社区 Discord，以及用于 Skills 发现的 ClawHub
（[https://clawhub.ai](https://clawhub.ai)）。它告诉模型，针对 OpenClaw 行为、命令、配置或架构，
应先查阅文档，并在可能时自行运行 `openclaw status`（仅在缺少访问权限时询问用户）。
对于配置，它会特别指向 `gateway` 工具动作
`config.schema.lookup`，用于精确的字段级文档和约束，然后指向
`docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md`
以获取更广泛的指导。

## 相关

- [Agent 运行时](/zh-CN/concepts/agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
