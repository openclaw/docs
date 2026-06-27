---
read_when:
    - 你想通过智能体进行后台或并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查绑定到线程的子智能体会话
sidebarTitle: Sub-agents
summary: 生成隔离的后台智能体运行，并将结果通知回请求者聊天
title: 子智能体
x-i18n:
    generated_at: "2026-06-27T03:33:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

子智能体是在现有智能体运行中派生出的后台智能体运行。
它们在自己的会话（`agent:<agentId>:subagent:<uuid>`）中运行，并且在完成后会将结果**通告**回请求方聊天
渠道。每个子智能体运行都会被跟踪为一个
[后台任务](/zh-CN/automation/tasks)。

主要目标：

- 并行处理“研究 / 长任务 / 慢速工具”工作，而不阻塞主运行。
- 默认保持子智能体隔离（会话分离 + 可选沙箱隔离）。
- 让工具表面难以误用：子智能体默认不会获得会话工具。
- 支持可配置的嵌套深度，以适配编排器模式。

<Note>
**成本说明：**默认情况下，每个子智能体都有自己的上下文和 token 使用量。对于繁重或重复的任务，请为子智能体设置更便宜的模型，并让你的主智能体使用更高质量的模型。可通过
`agents.defaults.subagents.model` 或按智能体覆盖进行配置。当子智能体确实需要请求方的当前转录记录时，智能体可以在那一次派生中请求
    `context: "fork"`。绑定到线程的子智能体会话默认使用
    `context: "fork"`，因为它们会将当前对话分支到一个后续线程中。
</Note>

## 斜杠命令

使用 `/subagents` 检查**当前会话**的子智能体运行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 会显示运行元数据（状态、时间戳、会话 ID、转录路径、清理）。使用 `sessions_history` 获取有界且经过安全过滤的回忆视图；当你需要原始完整转录时，请检查磁盘上的转录路径。

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

### 派生行为

智能体使用 `sessions_spawn` 启动后台子智能体。子智能体完成结果会作为内部父会话事件返回；父/请求方智能体会决定是否需要面向用户的更新。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` 是非阻塞的；它会立即返回运行 ID。
    - 完成时，子智能体会向父/请求方会话回报。
    - 需要子结果的智能体轮次应在派生所需工作后调用 `sessions_yield`。这会结束当前轮次，并让完成事件作为下一条模型可见消息到达。
    - 完成采用推送方式。派生后，不要为了等待其完成而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在调试可见性需要时按需检查状态。
    - 子输出是供请求方智能体综合的报告/证据。它不是用户编写的指令文本，不能覆盖系统、开发者或用户策略。
    - 完成时，OpenClaw 会尽力关闭该子智能体会话打开的已跟踪浏览器标签页/进程，然后再继续通告清理流程。

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw 通过带有稳定幂等键的 `agent` 轮次，将完成结果交还给请求方会话。
    - 如果请求方运行仍处于活动状态，OpenClaw 会先尝试唤醒/Steer 该运行，而不是启动第二条可见回复路径。
    - 如果无法唤醒活动请求方，OpenClaw 会回退到使用相同完成上下文的请求方智能体交接，而不是丢弃通告。
    - 即使父智能体认为不需要可见的用户更新，成功的父交接也会完成子智能体交付。
    - 原生子智能体不会获得消息工具。它们会向父/请求方智能体返回普通 assistant 文本；人类可见回复由父/请求方智能体的常规交付策略负责。
    - 如果无法使用直接交接，则会回退到队列路由。
    - 如果队列路由仍不可用，通告会使用短暂指数退避重试，然后最终放弃。
    - 完成交付会保留已解析的请求方路由：可用时优先使用绑定到线程或绑定到对话的完成路由；如果完成来源只提供渠道，OpenClaw 会从请求方会话已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）填充缺失的目标/账号，以便直接交付仍能工作。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    给请求方会话的完成交接是运行时生成的内部上下文（不是用户编写的文本），并包含：

    - `Result` — 子智能体最新可见的 `assistant` 回复文本。工具/toolResult 输出不会提升为子结果。终端失败运行不会复用捕获的回复文本。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 紧凑的运行时/token 统计。
    - 一条评审指令，要求请求方智能体验证结果，然后再决定原始任务是否完成。
    - 后续指导，告知请求方智能体在子结果仍留下更多操作时继续任务或记录后续事项。
    - 针对无需更多操作路径的最终更新指令，使用普通 assistant 语气编写，不转发原始内部元数据。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` 和 `--thinking` 会覆盖该特定运行的默认值。
    - 使用 `info`/`log` 在完成后检查详情和输出。
    - 对于持久的绑定到线程的会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 如果请求方渠道不支持线程绑定，请使用 `mode: "run"`，而不是重试不可能的绑定到线程的组合。
    - 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode，或显式 Codex ACP/acpx），当工具声明该运行时时，请使用带有 `runtime: "acp"` 的 `sessions_spawn`。调试完成结果或智能体到智能体循环时，请参阅 [ACP 交付模型](/zh-CN/tools/acp-agents#delivery-model)。启用 `codex` 插件时，Codex 聊天/线程控制应优先使用 `/codex ...`，除非用户明确要求 ACP/acpx。
    - OpenClaw 会隐藏 `runtime: "acp"`，直到启用 ACP、请求方未被沙箱隔离，并且加载了诸如 `acpx` 的后端插件。`runtime: "acp"` 需要一个外部 ACP harness ID，或一个带有 `runtime.type="acp"` 的 `agents.list[]` 条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认子智能体运行时。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子智能体会以隔离方式启动，除非调用方明确要求 fork 当前转录记录。

| 模式       | 使用场景                                                                                                                         | 行为                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、独立实现、慢速工具工作，或任何可以在任务文本中简要说明的内容                           | 创建干净的子转录记录。这是默认值，并会降低 token 使用量。  |
| `fork`     | 依赖当前对话、先前工具结果，或请求方转录记录中已有细致指令的工作 | 在子智能体启动前，将请求方转录记录分支到子会话中。 |

请谨慎使用 `fork`。它用于上下文敏感的委派，而不是编写清晰任务提示的替代品。

## 工具：`sessions_spawn`

在全局 `subagent` 通道上以 `deliver: false` 启动子智能体运行，然后运行通告步骤，并将通告回复发布到请求方聊天
渠道。

可用性取决于调用方的有效工具策略。`coding` 和
`full` 配置默认公开 `sessions_spawn`。`messaging` 配置不公开；对于应委派工作的智能体，请添加 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`，或使用 `tools.profile: "coding"`。
渠道/群组、提供商、沙箱，以及按智能体允许/拒绝策略，仍可能在配置阶段之后移除该工具。请在同一会话中使用 `/tools` 确认有效工具列表。

**默认值：**

- **模型：**原生子智能体会继承调用方，除非你设置 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）。ACP 运行时派生会在存在已配置子智能体模型时使用同一模型；否则 ACP harness 保留自己的默认值。显式的 `sessions_spawn.model` 仍优先。
- **Thinking：**原生子智能体会继承调用方，除非你设置 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）。ACP 运行时派生也会为所选模型应用 `agents.defaults.models["provider/model"].params.thinking`。显式的 `sessions_spawn.thinking` 仍优先。
- **运行超时：**设置后，OpenClaw 会使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。`sessions_spawn` 不接受按调用的超时覆盖。
- **任务交付：**原生子智能体会在其第一条可见 `[Subagent Task]` 消息中接收委派任务。子智能体系统提示承载运行时规则和路由上下文，而不是任务的隐藏副本。

已接受的原生子智能体派生会在工具结果中包含已解析的子模型元数据：`resolvedModel` 包含应用后的模型引用，`resolvedProvider` 在引用带有前缀时包含提供商前缀。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示指导；它不会更改工具策略，也不会强制委派。

- `suggest`（默认）：保留标准提示，提醒对较大或较慢的工作使用子智能体。
- `prefer`：告诉主智能体保持响应，并通过 `sessions_spawn` 委派比直接回复更复杂的任何内容。

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
  可选的稳定句柄，用于在后续状态输出中识别特定子项。必须匹配 `[a-z][a-z0-9_-]{0,63}`，且不能是 `last` 或 `all` 等保留目标。
</ParamField>
<ParamField path="label" type="string">
  可选的人类可读标签。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允许时，在另一个已配置的智能体 id 下生成。
</ParamField>
<ParamField path="cwd" type="string">
  子运行的可选任务工作目录。原生子智能体仍会从目标 Agent 工作区加载引导文件；`cwd` 只改变运行时工具和 CLI harness 执行委派工作的地点。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅用于外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或明确请求的 Codex ACP/acpx），以及 `runtime.type` 为 `acp` 的 `agents.list[]` 条目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  仅 ACP。`runtime: "acp"` 时恢复现有 ACP harness 会话；对原生子智能体生成会被忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  仅 ACP。`runtime: "acp"` 时将 ACP 运行输出流式传输到父会话；原生子智能体生成时省略。
</ParamField>
<ParamField path="model" type="string">
  覆盖子智能体模型。无效值会被跳过，子智能体会在默认模型上运行，并在工具结果中给出警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子智能体运行的思考级别。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  为 `true` 时，请求为此子智能体会话绑定渠道线程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认值变为 `session`。`mode: "session"` 要求 `thread: true`。
  如果请求方渠道无法使用线程绑定，请改用 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 会在公告后立即归档（仍通过重命名保留 transcript）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  除非目标子运行时已沙箱隔离，否则 `require` 会拒绝生成。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 会将请求方当前 transcript 分支到子会话。仅限原生子智能体。线程绑定的生成默认使用 `fork`；非线程生成默认使用 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受渠道投递参数（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子智能体会将
其最新的 assistant 轮次报告回请求方；外部投递仍由父/请求方智能体负责。
</Warning>

### 任务名称和目标定位

`taskName` 是面向模型的编排句柄，不是会话键。
当协调器之后可能需要检查该子项时，可将它用于稳定子项名称，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目标解析接受精确的 `taskName` 匹配和无歧义的前缀。
匹配范围限定在编号 `/subagents` 目标使用的同一活动/近期目标窗口内，
因此陈旧的已完成子项不会让复用的句柄产生歧义。如果两个活动或近期子项共享同一个
`taskName`，目标就是有歧义的；请改用列表索引、会话键或运行 id。

保留目标 `last` 和 `all` 不是有效的 `taskName` 值，
因为它们已经具有控制含义。

## 工具：`sessions_yield`

结束当前模型轮次并等待运行时事件，主要是子智能体完成事件，
作为下一条消息到达。当请求方必须等这些完成事件到达后才能生成最终
答案时，请在生成所需子工作后使用它。

`sessions_yield` 是等待原语。不要为了检测子项完成而用轮询
`subagents`、`sessions_list`、`sessions_history`、shell
`sleep` 或进程轮询来替代它。

仅当会话的有效工具列表包含 `sessions_yield` 时才使用它。
某些最小或自定义工具配置文件可能会暴露 `sessions_spawn` 和
`subagents`，但不暴露 `sessions_yield`；在这种情况下，不要为了等待完成
而发明轮询循环。

存在活动子项时，OpenClaw 会把一个紧凑的、由运行时生成的
`Active Subagents` prompt 块注入普通轮次中，以便请求方无需轮询即可看到
当前子会话、运行 id、状态、标签、任务和
`taskName` 别名。该块中的任务和标签字段会作为数据加引号，而不是指令，
因为它们可能来自用户/模型提供的生成参数。

## 工具：`subagents`

列出归请求方会话拥有的已生成子智能体运行。它限定在当前请求方范围内；
子项只能看到自己控制的子项。

使用 `subagents` 进行按需状态查看和调试。使用 `sessions_yield`
等待完成事件。

## 线程绑定会话

当某个渠道启用线程绑定时，子智能体可以保持绑定到一个线程，
这样该线程中的后续用户消息会继续路由到同一个子智能体会话。

### 支持线程的渠道

任何带有会话绑定适配器的渠道都可以支持持久的线程绑定子智能体会话
（带 `thread: true` 的 `sessions_spawn`）。
内置适配器目前包括 Discord 线程、Matrix 线程、
Telegram 论坛主题，以及 Feishu 的当前会话绑定。
使用每个渠道的 `threadBindings` 配置键来启用、
设置超时和 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="生成">
    使用带 `thread: true`（可选 `mode: "session"`）的 `sessions_spawn`。
  </Step>
  <Step title="绑定">
    OpenClaw 会在活动渠道中为该会话目标创建或绑定一个线程。
  </Step>
  <Step title="路由后续消息">
    该线程中的回复和后续消息会路由到已绑定的会话。
  </Step>
  <Step title="检查超时">
    使用 `/session idle` 检查/更新不活动自动取消聚焦，并使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="分离">
    使用 `/unfocus` 手动分离。
  </Step>
</Steps>

### 手动控制

| 命令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 将当前线程（或创建一个线程）绑定到子智能体/会话目标                  |
| `/unfocus`         | 移除当前已绑定线程的绑定                                              |
| `/agents`          | 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）                 |
| `/session idle`    | 检查/更新空闲自动取消聚焦（仅限已聚焦的绑定线程）                    |
| `/session max-age` | 检查/更新硬性上限（仅限已聚焦的绑定线程）                            |

### 配置开关

- **全局默认：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **渠道覆盖和生成自动绑定键** 是适配器特定的。请参见上方的 [支持线程的渠道](#thread-supporting-channels)。

有关当前适配器详情，请参见 [配置参考](/zh-CN/gateway/configuration-reference) 和
[斜杠命令](/zh-CN/tools/slash-commands)。

### 允许列表

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可通过显式 `agentId` 定位的已配置智能体 id 列表（`["*"]` 允许任何已配置目标）。默认值：仅请求方智能体。如果你设置了列表，并且仍希望请求方通过 `agentId` 生成自身，请将请求方 id 包含在列表中。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求方智能体未设置自己的 `subagents.allowAgents` 时使用的默认已配置目标智能体允许列表。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。按智能体覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway 网关 `agent` 公告投递尝试的单次调用超时。值为正整数毫秒，并会被限制到平台安全的计时器最大值。瞬时重试可能会让总公告等待时间长于一个已配置超时。
</ParamField>

如果请求方会话已沙箱隔离，`sessions_spawn` 会拒绝会以非沙箱方式运行的目标。

### 设备发现

使用 `agents_list` 查看当前允许用于 `sessions_spawn` 的智能体 id。
响应包含每个列出智能体的有效模型和嵌入式运行时元数据，以便调用方区分 OpenClaw、Codex
app-server 和其他已配置的原生运行时。

`allowAgents` 条目必须指向 `agents.list[]` 中已配置的智能体 id。
`["*"]` 表示任何已配置目标智能体加上请求方。如果某个智能体配置
已被删除，但其 id 仍保留在 `allowAgents` 中，`sessions_spawn` 会拒绝该 id，
且 `agents_list` 会省略它。运行 `openclaw doctor --fix` 清理陈旧的
允许列表条目，或者在目标应保持可生成并继承默认值时添加一个最小的 `agents.list[]` 条目。

### 自动归档

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认 `60`）。
- 归档使用 `sessions.delete`，并将 transcript 重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在公告后立即归档（仍通过重命名保留 transcript）。
- 自动归档是尽力而为；如果 Gateway 网关重启，待处理计时器会丢失。
- 已配置的运行超时**不会**自动归档；它们只会停止运行。会话会保留到自动归档。
- 自动归档同样适用于深度 1 和深度 2 会话。
- 浏览器清理与归档清理分开：运行结束时会尽力关闭被跟踪的浏览器标签页/进程，即使 transcript/会话记录被保留。

## 嵌套子智能体

默认情况下，子智能体不能生成自己的子智能体
（`maxSpawnDepth: 1`）。设置 `maxSpawnDepth: 2` 可启用一层
嵌套，即**编排器模式**：主智能体 → 编排器子智能体 →
工作子子智能体。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体生成子项（默认：1）
        maxChildrenPerAgent: 5, // 每个智能体会话的最大活动子项数（默认：5）
        maxConcurrent: 8, // 全局并发通道上限（默认：8）
        runTimeoutSeconds: 900, // sessions_spawn 的默认超时（0 = 无超时）
        announceTimeoutMs: 120000, // 单次调用 Gateway 网关公告超时
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形状                                   | 角色                                          | 可以生成？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体                                      | 始终可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（深度 2 允许时为编排器）             | 仅当 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作项）                      | 永不                         |

### 公告链

结果沿链向上流动：

1. 深度 2 worker 完成 → 向其父级（深度 1 编排器）发送通告。
2. 深度 1 编排器收到通告，汇总结果，完成 → 向主流程发送通告。
3. 主智能体收到通告并交付给用户。

每一层只能看到其直接子级的通告。

<Note>
**操作指导：**只启动一次子级工作并等待完成
事件，而不是围绕 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。
`sessions_list` 和 `/subagents list` 会让子会话关系
聚焦于实时工作——实时子级保持附加，已结束子级会在短暂的最近窗口内
保持可见，过期的仅存储子级链接会在其新鲜度窗口后被
忽略。这可以防止旧的 `spawnedBy` /
`parentSessionKey` 元数据在重启后复活幽灵子级。
如果子级完成事件在你已经发送最终答案后到达，
正确的后续响应是精确的静默 token
`NO_REPLY` / `no_reply`。
</Note>

### 按深度划分的工具策略

- 角色和控制范围会在生成时写入会话元数据。这可以防止扁平或恢复的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）：**获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，因此它可以生成子级并检查其状态。其他会话/系统工具仍被拒绝。
- **深度 1（叶子，当 `maxSpawnDepth == 1` 时）：**没有会话工具（当前默认行为）。
- **深度 2（叶子 worker）：**没有会话工具——`sessions_spawn` 在深度 2 始终被拒绝。不能继续生成子级。

### 每个智能体的生成限制

每个智能体会话（任意深度）同一时间最多可以有 `maxChildrenPerAgent`
（默认 `5`）个活跃子级。这可以防止单个编排器出现失控的扇出。

### 级联停止

停止深度 1 编排器会自动停止其所有深度 2
子级：

- 主聊天中的 `/stop` 会停止所有深度 1 智能体，并级联到它们的深度 2 子级。

## 身份验证

子智能体身份验证按 **智能体 id** 解析，而不是按会话类型解析：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 身份验证存储从该智能体的 `agentDir` 加载。
- 主智能体的身份验证配置文件会作为**后备**合并进来；发生冲突时，智能体配置文件会覆盖主配置文件。

合并是增量式的，因此主配置文件始终可作为
后备使用。尚不支持每个智能体完全隔离的身份验证。

## 通告

子智能体通过通告步骤回报：

- 通告步骤在子智能体会话中运行（不是请求方会话）。
- 如果子智能体回复精确的 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的助手文本是精确的静默 token `NO_REPLY` / `no_reply`，即使之前存在可见进度，通告输出也会被抑制。

交付取决于请求方深度：

- 顶层请求方会话使用带外部交付的后续 `agent` 调用（`deliver=true`）。
- 嵌套请求方子智能体会话会收到内部后续注入（`deliver=false`），以便编排器可以在会话内汇总子级结果。
- 如果嵌套请求方子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求方。

对于顶层请求方会话，完成模式直接交付会先
解析任何绑定的对话/线程路由和钩子覆盖，然后从请求方会话的已存储路由中
填充缺失的频道目标字段。
这可以让完成结果留在正确的聊天/主题中，即使完成
来源只标识了频道。

构建嵌套完成发现时，子级完成聚合会限定在当前请求方运行范围内，
防止过期的先前运行子级
输出泄漏到当前通告中。通告回复会在频道适配器上可用时
保留线程/主题路由。

### 通告上下文

通告上下文会规范化为稳定的内部事件块：

| 字段          | 来源                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 来源         | `subagent` 或 `cron`                                                                                          |
| 会话 id    | 子级会话键/id                                                                                          |
| 类型           | 通告类型 + 任务标签                                                                                    |
| 状态         | 从运行时结果派生（`success`、`error`、`timeout` 或 `unknown`）——**不是**从模型文本推断 |
| 结果内容 | 子级的最新可见助手文本                                                                  |
| 后续操作      | 描述何时回复以及何时保持静默的指令                                                           |

终端失败运行会报告失败状态，而不会重放捕获的
回复文本。工具/toolResult 输出不会提升为子级结果文本。

### 统计行

通告载荷会在末尾包含一行统计信息（即使被包裹也是如此）：

- 运行时（例如 `runtime 5m12s`）。
- token 用量（输入/输出/总计）。
- 当配置了模型价格（`models.providers.*.models[].cost`）时的预估成本。
- `sessionKey`、`sessionId` 和 transcript 路径，以便主智能体可以通过 `sessions_history` 获取历史记录，或检查磁盘上的文件。

内部元数据仅用于编排；面向用户的回复
应改写为正常的助手语气。

### 为什么优先使用 `sessions_history`

`sessions_history` 是更安全的编排路径：

- 助手召回会先被规范化：移除思考标签；移除 `<relevant-memories>` / `<relevant_memories>` 脚手架；移除纯文本工具调用 XML 载荷块（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括从未正常闭合的截断载荷；移除降级后的工具调用/结果脚手架和历史上下文标记；移除泄漏的模型控制令牌（`<|assistant|>`、其他 ASCII `<|...|>`、全角 `<｜...｜>`）；移除格式错误的 MiniMax 工具调用 XML。
- 类似凭证/令牌的文本会被脱敏。
- 长块可以被截断。
- 非常大的历史记录可以丢弃较旧的行，或用 `[sessions_history omitted: message too large]` 替换过大的行。
- 当你需要完整的逐字节转录时，回退方案是检查磁盘上的原始转录。

## 工具策略

子智能体首先使用与父级或目标智能体相同的配置文件和工具策略流水线。
之后，OpenClaw 会应用子智能体限制层。

在没有限制性 `tools.profile` 的情况下，子智能体会获得**除消息工具、会话工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

这里的 `sessions_history` 仍然是有边界、经过净化的召回视图，
不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度为 1 的编排器子智能体还会
收到 `sessions_spawn`、`subagents`、`sessions_list` 和
`sessions_history`，以便它们管理自己的子级。

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

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以收窄
已经解析出的工具集，但不能**重新添加**被 `tools.profile` 移除的工具。
例如，`tools.profile: "coding"` 包含
`web_search`/`web_fetch`，但不包含 `browser` 工具。若要让
coding 配置文件的子智能体使用浏览器自动化，请在配置文件阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当只有一个智能体应获得浏览器自动化时，使用按智能体配置的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用专用的进程内队列通道：

- **通道名称：** `subagent`
- **并发数：** `agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 活性与恢复

OpenClaw 不会把缺少 `endedAt` 视为子智能体仍然存活的永久证明。
超过陈旧运行窗口的未结束运行，在 `/subagents list`、状态摘要、
后代完成门控和按会话并发检查中不再计为 active/pending。

Gateway 网关重启后，陈旧的未结束已恢复运行会被修剪，除非
其子会话被标记为 `abortedLastRun: true`。这些
重启中止的子会话仍可通过子智能体孤儿恢复流程恢复，该流程会发送一条合成的恢复消息，
然后清除中止标记。

自动重启恢复按每个子会话设有边界。如果同一个
子智能体子级在快速重复卡死窗口内反复被接受进行孤儿恢复，
OpenClaw 会在该会话上持久化恢复墓碑，并在后续重启时停止自动恢复它。运行
`openclaw tasks maintenance --apply` 来协调任务记录，或运行
`openclaw doctor --fix` 来清除
带墓碑会话上的陈旧中止恢复标志。

<Note>
如果子智能体生成因 Gateway 网关 `PAIRING_REQUIRED` /
`scope-upgrade` 失败，请在编辑配对状态前检查 RPC 调用方。
当调用方已经在 Gateway 网关请求上下文中运行时，内部 `sessions_spawn` 协调会在进程内分派，
因此它不会打开 local loopback WebSocket，也不依赖 CLI 的已配对设备作用域基线。
Gateway 网关进程外部的调用方仍会使用 WebSocket
回退，以 `client.id: "gateway-client"` 和 `client.mode: "backend"`
通过直接 local loopback 共享令牌/密码认证。远程调用方、显式
`deviceIdentity`、显式设备令牌路径以及浏览器/node 客户端
仍然需要正常的设备审批才能进行作用域升级。
</Note>

## 停止

- 在请求方聊天中发送 `/stop` 会中止请求方会话，并停止从中生成的所有活跃子智能体运行，级联到嵌套子级。

## 限制

- 子智能体公告是**尽力而为**。如果 Gateway 网关重启，待处理的“回传公告”工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md` 和 `TOOLS.md`（不注入 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子智能体遵循相同边界：`TOOLS.md` 保留在继承的 Codex 线程指令中，而仅父级使用的角色、身份和用户文件会作为轮次作用域的协作指令注入，这样子级不会克隆它们。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数用例推荐使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活跃子级数量（默认 `5`，范围 `1–20`）。

## 相关

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [Agent 发送](/zh-CN/tools/agent-send)
- [后台任务](/zh-CN/automation/tasks)
- [多 Agent 沙盒工具](/zh-CN/tools/multi-agent-sandbox-tools)
