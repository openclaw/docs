---
read_when:
    - 你想通过智能体执行后台或并行工作
    - 你正在更改 sessions_spawn 或子智能体工具策略
    - 你正在实现或排查线程绑定的子智能体会话
sidebarTitle: Sub-agents
summary: 启动隔离的后台智能体运行，并将结果通知回请求者聊天
title: 子智能体
x-i18n:
    generated_at: "2026-06-28T00:13:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

子智能体是从现有智能体运行中生成的后台智能体运行。
它们在自己的会话（`agent:<agentId>:subagent:<uuid>`）中运行，
完成后会将结果**通知**回请求者聊天
渠道。每个子智能体运行都会作为
[后台任务](/zh-CN/automation/tasks)进行跟踪。

主要目标：

- 并行处理“研究 / 长任务 / 慢工具”工作，而不阻塞主运行。
- 默认保持子智能体隔离（会话隔离 + 可选的沙箱隔离）。
- 让工具表面难以误用：子智能体默认**不会**获得会话工具。
- 支持可配置的嵌套深度，以适配编排器模式。

<Note>
**成本说明：**默认情况下，每个子智能体都有自己的上下文和 token 使用量。
对于繁重或重复的任务，请为子智能体设置更便宜的模型，
并让你的主智能体继续使用质量更高的模型。可通过
`agents.defaults.subagents.model` 或按智能体覆盖项配置。当子级
    确实需要请求者当前转录时，智能体可以在那一次生成中请求
    `context: "fork"`。绑定到线程的子智能体会话默认
    使用 `context: "fork"`，因为它们会把当前对话分支到一个
    后续线程中。
</Note>

## 斜杠命令

使用 `/subagents` 检查**当前会话**的子智能体运行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 会显示运行元数据（状态、时间戳、会话 ID、
转录路径、清理）。使用 `sessions_history` 获取有边界且经过
安全过滤的回忆视图；当你需要原始完整转录时，请检查磁盘上的转录路径。

### 线程绑定控制

这些命令适用于支持持久线程绑定的渠道。
请参阅下方的[支持线程的渠道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成行为

智能体使用 `sessions_spawn` 启动后台子智能体。子智能体完成结果
会作为内部父会话事件返回；父级/请求者智能体决定
是否需要面向用户的更新。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` 是非阻塞的；它会立即返回运行 ID。
    - 完成时，子智能体会向父级/请求者会话回报。
    - 需要子级结果的智能体轮次应在生成所需工作后调用 `sessions_yield`。这会结束当前轮次，并让完成事件作为下一条模型可见消息到达。
    - 完成是基于推送的。生成后，不要为了等待它完成而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在按需调试可见性时检查状态。
    - 子级输出是供请求者智能体综合的报告/证据。它不是用户编写的指令文本，不能覆盖系统、开发者或用户策略。
    - 完成时，在通知清理流程继续之前，OpenClaw 会尽力关闭由该子智能体会话打开并被跟踪的浏览器标签页/进程。

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw 通过带有稳定幂等键的 `agent` 轮次将完成结果交回请求者会话。
    - 如果请求者运行仍处于活动状态，OpenClaw 会先尝试唤醒/Steer 该运行，而不是启动第二条可见回复路径。
    - 如果无法唤醒活动请求者，OpenClaw 会回退到使用相同完成上下文的请求者智能体交接，而不是丢弃通知。
    - 即使父级决定不需要可见的用户更新，成功的父级交接也会完成子智能体交付。
    - 原生子智能体不会获得消息工具。它们会向父级/请求者智能体返回普通 assistant 文本；人类可见回复由父级/请求者智能体的正常交付策略负责。
    - 如果无法使用直接交接，则回退到队列路由。
    - 如果队列路由仍不可用，通知会以短暂的指数退避重试，然后才最终放弃。
    - 完成交付会保留已解析的请求者路由：绑定到线程或绑定到对话的完成路由可用时优先；如果完成来源只提供渠道，OpenClaw 会从请求者会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）补全缺失的目标/账号，使直接交付仍能工作。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    传递给请求者会话的完成交接是运行时生成的
    内部上下文（不是用户编写的文本），并包含：

    - `Result` — 子级最新可见的 `assistant` 回复文本。Tool/toolResult 输出不会提升为子级结果。终端失败的运行不会复用捕获的回复文本。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精简的运行时/token 统计信息。
    - 一条审查指令，要求请求者智能体验证结果，然后再决定原始任务是否完成。
    - 后续指导，要求请求者智能体在子级结果留下更多操作时继续任务或记录后续事项。
    - 一条用于没有更多操作路径的最终更新指令，以正常 assistant 语气编写，不转发原始内部元数据。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` 和 `--thinking` 会覆盖该特定运行的默认值。
    - 使用 `info`/`log` 在完成后检查详情和输出。
    - 对于持久的线程绑定会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 如果请求者渠道不支持线程绑定，请使用 `mode: "run"`，而不是重试不可能的线程绑定组合。
    - 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode，或显式 Codex ACP/acpx），当工具声明该运行时时，请使用带有 `runtime: "acp"` 的 `sessions_spawn`。调试完成结果或智能体到智能体循环时，请参阅 [ACP 交付模型](/zh-CN/tools/acp-agents#delivery-model)。启用 `codex` 插件时，Codex 聊天/线程控制应优先使用 `/codex ...`，除非用户明确要求 ACP/acpx。
    - OpenClaw 会隐藏 `runtime: "acp"`，直到 ACP 已启用、请求者未被沙箱隔离，并且已加载诸如 `acpx` 的后端插件。`runtime: "acp"` 需要外部 ACP harness ID，或带有 `runtime.type="acp"` 的 `agents.list[]` 条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认子智能体运行时。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子智能体默认以隔离方式启动，除非调用方明确要求 fork
当前转录。

| 模式       | 何时使用                                                                                                                         | 行为                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新研究、独立实现、慢工具工作，或任何可在任务文本中简要说明的事项                           | 创建干净的子级转录。这是默认值，并会降低 token 使用量。  |
| `fork`     | 依赖当前对话、先前工具结果，或请求者转录中已有细微指令的工作 | 在子级启动前，将请求者转录分支到子级会话。 |

请谨慎使用 `fork`。它用于上下文敏感的委派，而不是
取代编写清晰任务提示。

## 工具：`sessions_spawn`

在全局 `subagent` 通道上以 `deliver: false` 启动子智能体运行，
然后运行通知步骤，并将通知回复发布到请求者
聊天渠道。

可用性取决于调用方的有效工具策略。`coding` 和
`full` 配置文件默认公开 `sessions_spawn`。`messaging` 配置文件
不公开；对于应委派工作的智能体，请添加 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`，或使用 `tools.profile: "coding"`。
渠道/群组、提供商、沙箱，以及按智能体配置的允许/拒绝策略仍可
在配置文件阶段之后移除该工具。请从同一
会话使用 `/tools` 确认有效工具列表。

**默认值：**

- **模型：**原生子智能体继承调用方，除非你设置 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）。ACP runtime 生成在存在已配置子智能体模型时使用同一模型；否则 ACP harness 保留自己的默认值。显式的 `sessions_spawn.model` 仍然优先。
- **Thinking：**原生子智能体继承调用方，除非你设置 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）。ACP runtime 生成还会为所选模型应用 `agents.defaults.models["provider/model"].params.thinking`。显式的 `sessions_spawn.thinking` 仍然优先。
- **运行超时：**设置后，OpenClaw 使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。`sessions_spawn` 不接受按调用覆盖的超时。
- **任务交付：**原生子智能体会在它们第一条可见的 `[Subagent Task]` 消息中接收委派任务。子智能体系统提示携带运行时规则和路由上下文，而不是任务的隐藏副本。

已接受的原生子智能体生成会在
工具结果中包含已解析的子级模型元数据：`resolvedModel` 包含已应用的模型引用，
`resolvedProvider` 在引用带有提供商前缀时包含该前缀。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 仅控制提示指导；它不会更改工具策略或强制委派。

- `suggest`（默认）：保留标准提示建议，对更大或更慢的工作使用子智能体。
- `prefer`：告知主智能体保持响应，并通过 `sessions_spawn` 委派任何比直接回复更复杂的事项。

按智能体覆盖使用 `agents.list[].subagents.delegationMode`。

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### 工具参数

<ParamField path="task" type="string" required>
  子智能体的任务描述。
</ParamField>
<ParamField path="taskName" type="string">
  可选的稳定句柄，用于在后续状态输出中标识特定子项。必须匹配 `[a-z][a-z0-9_-]{0,63}`，且不能是 `last` 或 `all` 等保留目标。
</ParamField>
<ParamField path="label" type="string">
  可选的人类可读标签。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允许时，在另一个已配置智能体 ID 下生成。
</ParamField>
<ParamField path="cwd" type="string">
  子运行的可选任务工作目录。原生子智能体仍从目标智能体工作区加载引导文件；`cwd` 只改变运行时工具和 CLI harness 执行委派工作的目录。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅用于外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或显式请求的 Codex ACP/acpx），以及 `runtime.type` 为 `acp` 的 `agents.list[]` 条目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  仅 ACP。`runtime: "acp"` 时恢复现有 ACP harness 会话；对原生子智能体生成会被忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  仅 ACP。`runtime: "acp"` 时将 ACP 运行输出流式传输到父会话；原生子智能体生成时省略。
</ParamField>
<ParamField path="model" type="string">
  覆盖子智能体模型。无效值会被跳过，子智能体会使用默认模型运行，并在工具结果中给出警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子智能体运行的思考级别。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  当为 `true` 时，为此子智能体会话请求频道线程绑定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认会变为 `session`。`mode: "session"` 需要 `thread: true`。
  如果请求方频道不支持线程绑定，请改用 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 会在宣布后立即归档（仍通过重命名保留 transcript）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  除非目标子运行时已沙箱隔离，否则 `require` 会拒绝生成。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 会将请求方的当前 transcript 分支到子会话。仅原生子智能体。线程绑定生成默认使用 `fork`；非线程生成默认使用 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受频道投递参数（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子智能体会将
其最新助手轮次报告回请求方；外部投递仍由
父/请求方智能体负责。
</Warning>

### 任务名称和目标定位

`taskName` 是面向模型的编排句柄，不是会话键。
当协调器之后可能需要检查该子项时，可用它提供稳定子项名称，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目标解析接受精确的 `taskName` 匹配和无歧义的
前缀。匹配范围限定在编号 `/subagents` 目标所使用的同一活跃/近期目标窗口内，
因此已完成的过期子项不会让复用的句柄产生歧义。如果两个活跃或近期子项共享同一个
`taskName`，目标就是有歧义的；请改用列表索引、会话键或
运行 ID。

保留目标 `last` 和 `all` 不是有效的 `taskName` 值，
因为它们已经具有控制含义。

## 工具：`sessions_yield`

结束当前模型轮次并等待运行时事件，主要是
子智能体完成事件，作为下一条消息到达。在生成必需的子项工作后，
如果请求方必须等这些完成结果到达才能产出最终
答案，请使用它。

`sessions_yield` 是等待原语。不要用对 `subagents`、`sessions_list`、`sessions_history` 的轮询
循环、shell `sleep` 或进程轮询来替代它，仅仅为了检测子项完成。

仅当会话的有效工具列表包含 `sessions_yield` 时才使用它。
一些最小或自定义工具配置可能会暴露 `sessions_spawn` 和
`subagents`，但不暴露 `sessions_yield`；这种情况下，不要为了等待完成而发明
轮询循环。

当存在活跃子项时，OpenClaw 会将一个紧凑的运行时生成
`Active Subagents` prompt 块注入普通轮次，使请求方无需轮询即可看到
当前子会话、运行 ID、状态、标签、任务和
`taskName` 别名。该块中的任务和标签字段会作为数据被引用，
而不是指令，因为它们可能来自用户/模型提供的生成参数。

## 工具：`subagents`

列出请求方会话拥有的已生成子智能体运行。其作用域限定为
当前请求方；子项只能看到自己控制的子项。

使用 `subagents` 进行按需状态查看和调试。使用 `sessions_yield`
等待完成事件。

## 线程绑定会话

当某个频道启用线程绑定时，子智能体可以持续绑定到某个线程，
这样该线程中的后续用户消息会继续路由到同一个
子智能体会话。

### 支持线程的频道

任何带有会话绑定适配器的频道都可以支持持久
线程绑定子智能体会话（带 `thread: true` 的 `sessions_spawn`）。
内置适配器目前包括 Discord 线程、Matrix 线程、
Telegram 论坛主题，以及 Feishu 的当前对话绑定。
使用各频道的 `threadBindings` 配置键来启用、
设置超时和 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="生成">
    带 `thread: true` 的 `sessions_spawn`（并可选带 `mode: "session"`）。
  </Step>
  <Step title="绑定">
    OpenClaw 会在活跃频道中为该会话目标创建或绑定一个线程。
  </Step>
  <Step title="路由后续消息">
    该线程中的回复和后续消息会路由到绑定的会话。
  </Step>
  <Step title="检查超时">
    使用 `/session idle` 检查/更新不活跃自动取消聚焦，并
    使用 `/session max-age` 控制硬上限。
  </Step>
  <Step title="分离">
    使用 `/unfocus` 手动分离。
  </Step>
</Steps>

### 手动控制

| 命令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 将当前线程（或创建一个线程）绑定到子智能体/会话目标 |
| `/unfocus`         | 移除当前已绑定线程的绑定                       |
| `/agents`          | 列出活跃运行和绑定状态（`thread:<id>` 或 `unbound`）       |
| `/session idle`    | 检查/更新空闲自动取消聚焦（仅限已聚焦的绑定线程）         |
| `/session max-age` | 检查/更新硬上限（仅限已聚焦的绑定线程）                  |

### 配置开关

- **全局默认值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **频道覆盖和生成自动绑定键** 特定于适配器。请参见上方的[支持线程的频道](#thread-supporting-channels)。

请参见[配置参考](/zh-CN/gateway/configuration-reference)和
[斜杠命令](/zh-CN/tools/slash-commands)了解当前适配器详情。

### 允许列表

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可通过显式 `agentId` 作为目标的已配置智能体 ID 列表（`["*"]` 允许任何已配置目标）。默认值：仅请求方智能体。如果你设置了列表，并且仍希望请求方通过 `agentId` 生成自己，请将请求方 ID 包含在列表中。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求方智能体未设置自己的 `subagents.allowAgents` 时使用的默认已配置目标智能体允许列表。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。按智能体覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway 网关 `agent` 宣布投递尝试的每次调用超时。值为正整数毫秒，并会被限制在平台安全的定时器最大值内。瞬时重试可能让总宣布等待时间长于一个已配置超时。
</ParamField>

如果请求方会话已沙箱隔离，`sessions_spawn` 会拒绝
会以非沙箱隔离方式运行的目标。

### 设备发现

使用 `agents_list` 查看哪些智能体 ID 当前允许用于
`sessions_spawn`。响应包含每个列出智能体的有效
模型和嵌入式运行时元数据，因此调用方可以区分 OpenClaw、Codex
应用服务器和其他已配置的原生运行时。

`allowAgents` 条目必须指向 `agents.list[]` 中已配置的智能体 ID。
`["*"]` 表示任何已配置目标智能体加上请求方。如果某个智能体配置
已删除但其 ID 仍保留在 `allowAgents` 中，`sessions_spawn` 会拒绝该 ID，
且 `agents_list` 会省略它。运行 `openclaw doctor --fix` 清理过期
允许列表条目，或在目标应继续可生成并继承默认值时添加一个最小 `agents.list[]` 条目。

### 自动归档

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认 `60`）。
- 归档使用 `sessions.delete`，并将 transcript 重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在宣布后立即归档（仍通过重命名保留 transcript）。
- 自动归档是尽力而为；如果 Gateway 网关重启，挂起的定时器会丢失。
- 已配置的运行超时**不会**自动归档；它们只会停止运行。会话会保留到自动归档。
- 自动归档同样适用于深度 1 和深度 2 会话。
- 浏览器清理与归档清理是分开的：运行结束时会尽力关闭被跟踪的浏览器标签页/进程，即使 transcript/会话记录被保留也是如此。

## 嵌套子智能体

默认情况下，子智能体不能生成自己的子智能体
（`maxSpawnDepth: 1`）。设置 `maxSpawnDepth: 2` 可启用一级
嵌套，即**编排器模式**：主 → 编排器子智能体 →
工作子子智能体。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形状                            | 角色                                          | 可生成？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体                                    | 始终                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（允许深度 2 时为编排器） | 仅当 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶工作项）                   | 从不                        |

### 宣布链

结果沿链路向上流动：

1. 深度 2 worker 完成 → 向其父级（深度 1 编排器）发送公告。
2. 深度 1 编排器接收公告，汇总结果，完成 → 向主智能体发送公告。
3. 主智能体接收公告并交付给用户。

每一层只会看到来自其直接子级的公告。

<Note>
**操作指引：**只启动一次子任务，然后等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。`sessions_list` 和 `/subagents list` 会让子会话关系聚焦在实时工作上：实时子项保持附加，已结束子项会在较短的最近窗口内保持可见，而过期的仅存储子项链接会在其新鲜度窗口后被忽略。这样可防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后复活幽灵子项。如果子项完成事件在你已发送最终答案后到达，正确的后续响应是精确的静默 token `NO_REPLY` / `no_reply`。
</Note>

### 按深度划分的工具策略

- 角色和控制范围会在 spawn 时写入会话元数据。这可防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）：**获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便它可以 spawn 子项并检查它们的状态。其他会话/系统工具仍被拒绝。
- **深度 1（叶子，当 `maxSpawnDepth == 1` 时）：**没有会话工具（当前默认行为）。
- **深度 2（叶子 worker）：**没有会话工具，`sessions_spawn` 在深度 2 始终被拒绝。不能继续 spawn 子项。

### 每个智能体的 spawn 限制

每个智能体会话（任意深度）同一时间最多可以有 `maxChildrenPerAgent`（默认 `5`）个活跃子项。这可防止单个编排器产生失控的扇出。

### 级联停止

停止深度 1 编排器会自动停止其所有深度 2 子项：

- 主聊天中的 `/stop` 会停止所有深度 1 智能体，并级联到它们的深度 2 子项。

## 认证

子智能体认证按**智能体 id**解析，而不是按会话类型解析：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 认证存储从该智能体的 `agentDir` 加载。
- 主智能体的认证配置会作为**回退**合并进来；发生冲突时，智能体配置会覆盖主配置。

合并是增量式的，因此主配置始终可作为回退使用。尚不支持每个智能体完全隔离的认证。

## 公告

子智能体通过公告步骤回报：

- 公告步骤在子智能体会话内运行（不是请求方会话）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的 assistant 文本是精确的静默 token `NO_REPLY` / `no_reply`，即使此前存在可见进度，也会抑制公告输出。

交付取决于请求方深度：

- 顶层请求方会话使用带外部交付的后续 `agent` 调用（`deliver=true`）。
- 嵌套请求方子智能体会话会接收内部后续注入（`deliver=false`），以便编排器可以在会话内汇总子项结果。
- 如果嵌套请求方子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求方。

对于顶层请求方会话，完成模式的直接交付会先解析任何绑定的对话/线程路由和钩子覆盖，然后从请求方会话存储的路由补齐缺失的频道目标字段。这样即使完成来源只标识了频道，也能将完成内容保留在正确的聊天/主题中。

构建嵌套完成发现时，子项完成聚合会限定在当前请求方运行范围内，防止旧的先前运行子项输出泄漏到当前公告中。当频道适配器提供线程/主题路由时，公告回复会保留该路由。

### 公告上下文

公告上下文会规范化为稳定的内部事件块：

| 字段 | 来源 |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 来源 | `subagent` 或 `cron` |
| 会话 id | 子会话键/id |
| 类型 | 公告类型 + 任务标签 |
| 状态 | 从运行时结果派生（`success`、`error`、`timeout` 或 `unknown`），**不是**从模型文本推断 |
| 结果内容 | 子项最新的可见 assistant 文本 |
| 后续 | 描述何时回复与何时保持静默的指令 |

终止失败的运行会报告失败状态，而不会重放捕获的回复文本。工具/toolResult 输出不会提升为子项结果文本。

### 统计行

公告载荷会在末尾包含统计行（即使被包装）：

- 运行时长（例如 `runtime 5m12s`）。
- Token 使用量（输入/输出/总计）。
- 配置模型定价时的估算成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和转录路径，以便主智能体可通过 `sessions_history` 获取历史记录，或检查磁盘上的文件。

内部元数据仅用于编排；面向用户的回复应使用正常 assistant 语气重写。

### 为什么优先使用 `sessions_history`

`sessions_history` 是更安全的编排路径：

- Assistant 回忆会先规范化：移除 thinking 标签；移除 `<relevant-memories>` / `<relevant_memories>` 脚手架；移除纯文本工具调用 XML 载荷块（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括从未干净闭合的截断载荷；移除降级的工具调用/结果脚手架和历史上下文标记；移除泄漏的模型控制 token（`<|assistant|>`、其他 ASCII `<|...|>`、全角 `<｜...｜>`）；移除格式错误的 MiniMax 工具调用 XML。
- 类凭证/token 文本会被遮盖。
- 长块可能被截断。
- 非常大的历史记录可能会丢弃较旧行，或用 `[sessions_history omitted: message too large]` 替换过大的行。
- 当存在 `nextOffset` 时，用它向后翻页查看更旧的转录窗口。
- 当你需要完整的逐字节转录时，原始磁盘转录检查是回退方案。

## 工具策略

子智能体首先使用与父级或目标智能体相同的配置和工具策略流水线。之后，OpenClaw 会应用子智能体限制层。

如果没有限制性的 `tools.profile`，子智能体会获得**除消息工具、会话工具和系统工具以外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` 在这里同样仍是有界且经过清理的回忆视图，不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子智能体还会收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们管理自己的子项。

### 通过配置覆盖

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以收窄已经解析出的工具集，但不能**加回**被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。若要让 coding-profile 子智能体使用浏览器自动化，请在 profile 阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当只有一个智能体应获得浏览器自动化时，使用每智能体配置 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用专用的进程内队列通道：

- **通道名称：**`subagent`
- **并发数：**`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 存活性和恢复

OpenClaw 不会把缺少 `endedAt` 视为子智能体仍然存活的永久证明。早于过期运行窗口的未结束运行，在 `/subagents list`、状态摘要、后代完成门控和每会话并发检查中不再计为活跃/待处理。

Gateway 网关重启后，过期的未结束恢复运行会被剪除，除非其子会话标记为 `abortedLastRun: true`。这些因重启而中止的子会话仍可通过子智能体孤儿恢复流程恢复，该流程会在清除中止标记前发送一条合成恢复消息。

自动重启恢复按每个子会话设有边界。如果同一个子智能体子项在快速重新卡住窗口内被反复接受进行孤儿恢复，OpenClaw 会在该会话上持久化恢复墓碑，并在后续重启时停止自动恢复它。运行 `openclaw tasks maintenance --apply` 以协调任务记录，或运行 `openclaw doctor --fix` 以清除墓碑会话上的过期中止恢复标志。

<Note>
如果子智能体 spawn 因 Gateway 网关 `PAIRING_REQUIRED` / `scope-upgrade` 失败，请先检查 RPC 调用方，再编辑配对状态。当调用方已经在 Gateway 网关请求上下文内运行时，内部 `sessions_spawn` 协调会在进程内分发，因此不会打开 loopback WebSocket，也不依赖 CLI 的已配对设备 scope 基线。Gateway 网关进程外的调用方仍会使用 WebSocket 回退，以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 通过直接 loopback 共享 token/密码认证进行连接。远程调用方、显式 `deviceIdentity`、显式设备 token 路径以及 browser/node 客户端仍需要正常的设备批准来完成 scope 升级。
</Note>

## 停止

- 在请求方聊天中发送 `/stop` 会中止请求方会话，并停止从该会话 spawn 的任何活跃子智能体运行，同时级联到嵌套子项。

## 限制

- 子智能体公告是**尽力而为**的。如果 Gateway 网关重启，待处理的“回传公告”工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md` 和 `TOOLS.md`（不注入 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子智能体遵循相同边界：`TOOLS.md` 保留在继承的 Codex 线程指令中，而仅限父级的人设、身份和用户文件会作为轮次范围协作指令注入，这样子项不会克隆它们。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。对于大多数用例，建议使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活跃子项数（默认 `5`，范围 `1–20`）。

## 相关

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [Agent 发送](/zh-CN/tools/agent-send)
- [后台任务](/zh-CN/automation/tasks)
- [多 Agent 沙盒工具](/zh-CN/tools/multi-agent-sandbox-tools)
