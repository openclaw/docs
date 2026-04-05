---
read_when:
    - 编辑系统提示文本、工具列表或时间/heartbeat 部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示包含什么内容，以及它是如何组装的
title: 系统提示
x-i18n:
    generated_at: "2026-04-05T08:22:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86b2fa496b183b64e86e6ddc493e4653ff8c9727d813fe33c8f8320184d022f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# 系统提示

OpenClaw 会为每次智能体运行构建一个自定义系统提示。该提示**由 OpenClaw 拥有**，不使用 pi-coding-agent 的默认提示。

该提示由 OpenClaw 组装，并注入到每次智能体运行中。

## 结构

该提示被有意保持紧凑，并使用固定章节：

- **工具**：当前工具列表 + 简短说明。
- **安全**：简短的护栏提醒，避免权力寻求行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载 skill 说明。
- **OpenClaw 自更新**：如何使用
  `config.schema.lookup` 安全地检查配置，使用 `config.patch` 修补配置，使用 `config.apply` 替换完整配置，以及仅在用户明确请求时运行 `update.run`。
  仅限所有者的 `gateway` 工具也会拒绝重写
  `tools.exec.ask` / `tools.exec.security`，包括会规范化到这些受保护 exec 路径的旧版 `tools.bash.*`
  别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时阅读它们。
- **工作区文件（已注入）**：表示下方包含引导文件。
- **沙箱**（启用时）：说明沙箱隔离运行时、沙箱路径，以及是否可用提权 exec。
- **当前日期与时间**：用户本地时间、时区和时间格式。
- **回复标签**：适用于受支持提供商的可选回复标签语法。
- **Heartbeats**：heartbeat 提示和确认行为。
- **运行时**：主机、操作系统、node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **推理**：当前可见性级别 + `/reasoning` 切换提示。

“工具”章节还包含针对长时间运行工作的运行时指导：

- 对于未来跟进（`check back later`、提醒、周期性工作），使用 cron
  而不是 `exec` sleep 循环、`yieldMs` 延迟技巧或重复 `process`
  轮询
- `exec` / `process` 只用于那些立即启动并继续在后台运行的命令
- 当启用了自动完成唤醒时，只启动一次命令，并依赖
  在其输出内容或失败时触发的基于推送的唤醒路径
- 当你需要检查一个正在运行的命令时，使用 `process` 查看日志、状态、输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成基于推送，并会自动向请求方发出通知
- 不要仅仅为了等待完成而在循环中轮询 `subagents list` / `sessions_list`

系统提示中的安全护栏是建议性的。它们指导模型行为，但不强制执行策略。若要实现硬性强制，请使用工具策略、exec 审批、沙箱隔离和渠道允许列表；而且运营者可以有意禁用这些机制。

在具有原生审批卡片/按钮的渠道上，运行时提示现在会告诉
智能体优先依赖该原生审批 UI。只有当工具结果显示聊天审批不可用或
手动审批是唯一途径时，它才应包含手动
`/approve` 命令。

## 提示模式

OpenClaw 可以为子智能体渲染更小的系统提示。运行时会为每次运行设置一个
`promptMode`（不是面向用户的配置）：

- `full`（默认）：包含以上所有章节。
- `minimal`：用于子智能体；省略 **Skills**、**记忆回忆**、**OpenClaw
  自更新**、**模型别名**、**用户身份**、**回复标签**、
  **消息传递**、**静默回复** 和 **Heartbeats**。工具、**安全**、
  工作区、沙箱、当前日期与时间（已知时）、运行时和已注入
  上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示会标记为 **子智能体
上下文**，而不是 **群聊上下文**。

## 工作区引导注入

引导文件会被裁剪并附加在 **项目上下文** 下，这样模型无需显式读取即可看到身份和资料上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅适用于全新的工作区）
- 如果存在则为 `MEMORY.md`，否则使用小写回退 `memory.md`

所有这些文件都会在每一轮**注入到上下文窗口中**，这
意味着它们会消耗 token。请保持其简洁——尤其是 `MEMORY.md`，它可能
随着时间增长，导致上下文使用量意外升高以及更频繁的
压缩。

> **注意：** `memory/*.md` 每日文件**不会**自动注入。它们
> 仅在需要时通过 `memory_search` 和 `memory_get` 工具访问，因此
> 除非模型显式读取它们，否则不会计入上下文窗口。

大文件会以带标记的方式截断。每个文件的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（默认：20000）。跨文件注入的引导内容总量
受 `agents.defaults.bootstrapTotalMaxChars` 限制
（默认：150000）。缺失文件会注入一个简短的缺失文件标记。发生截断时，
OpenClaw 可以在项目上下文中注入警告块；通过
`agents.defaults.bootstrapPromptTruncationWarning` 控制（`off`、`once`、`always`；
默认：`once`）。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件
会被过滤掉，以保持子智能体上下文较小）。

内部 hooks 可以通过 `agent:bootstrap` 拦截此步骤，以修改或替换
注入的引导文件（例如将 `SOUL.md` 替换为替代人格）。

如果你想让智能体听起来不那么通用，请从
[SOUL.md 人格指南](/concepts/soul) 开始。

如需检查每个注入文件贡献了多少内容（原始内容与注入内容、截断情况，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见 [上下文](/concepts/context)。

## 时间处理

当已知用户时区时，系统提示会包含一个专门的**当前日期与时间**部分。为了保持提示缓存稳定，它现在只包含
**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，请使用 `session_status`；状态卡
包含一行时间戳。该工具也可以选择设置每会话模型
覆盖（`model=default` 会清除它）。

使用以下配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为细节参见 [日期与时间](/date-time)。

## Skills

当存在符合条件的 Skills 时，OpenClaw 会注入一个紧凑的**可用 Skills 列表**
（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。该
提示会指示模型使用 `read` 加载所列位置（工作区、托管或内置）的 SKILL.md。如果没有符合条件的 Skills，则省略
Skills 章节。

符合条件包括 skill 元数据门控、运行时环境/配置检查，
以及在配置了 `agents.defaults.skills` 或
`agents.list[].skills` 时生效的智能体 Skills 允许列表。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这使基础提示保持精简，同时仍能启用有针对性的 skill 使用。

## 文档

在可用时，系统提示会包含一个**文档**章节，指向
本地 OpenClaw 文档目录（仓库工作区中的 `docs/` 或内置 npm
包文档），并同时说明公共镜像、源仓库、社区 Discord，以及用于
发现 Skills 的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。提示会指示模型优先查阅本地文档
以了解 OpenClaw 的行为、命令、配置或架构，并在可能时自行运行
`openclaw status`（仅在缺少访问权限时询问用户）。
