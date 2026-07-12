---
read_when:
    - 你希望通过智能体执行后台或并行工作
    - 你正在更改 sessions_spawn 或子智能体工具策略
    - 你正在实现或排查绑定到线程的子智能体会话
sidebarTitle: Sub-agents
summary: 启动隔离的后台智能体运行，并将结果通告回请求者聊天会话
title: 子智能体
x-i18n:
    generated_at: "2026-07-11T21:01:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

子智能体是从现有智能体运行中生成的后台智能体运行。
每个子智能体都在自己的会话（`agent:<agentId>:subagent:<uuid>`）中运行，
并在完成后将结果**通告**回请求者的聊天渠道。
每次子智能体运行都会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

目标：

- 并行处理研究、长时间任务和缓慢的工具工作，而不阻塞主运行。
- 默认保持子智能体隔离（会话分离，可选沙箱隔离）。
- 让工具范围不易被误用：子智能体默认**不会**获得会话或消息工具。
- 支持可配置的嵌套深度，以实现编排器模式。

<Note>
**成本说明：**默认情况下，每个子智能体都有自己的上下文和 token 用量。
对于繁重或重复的任务，可通过
`agents.defaults.subagents.model` 或按智能体覆盖，为子智能体设置更便宜的模型，
同时让主智能体继续使用质量更高的模型。当子智能体确实需要请求者的当前对话记录时，
请使用 `context: "fork"` 生成它。绑定到线程的子智能体会话默认使用
`context: "fork"`，因为它们会将当前对话分支到一个后续线程中。
</Note>

## 斜杠命令

`/subagents` 可检查**当前会话**的子智能体运行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 显示运行元数据（状态、时间戳、会话 ID、
对话记录路径、清理情况）。`/subagents log` 输出某次运行最近的聊天轮次；
添加 `tools` token 可包含工具调用/结果消息（默认省略）。
在智能体轮次中，使用 `sessions_history` 获取有范围限制且经过安全过滤的回溯视图；
也可以检查磁盘上的对话记录路径，以查看原始的完整对话记录。

### 线程绑定控制

这些命令适用于支持持久线程绑定的渠道。请参阅下方的
[支持线程的渠道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成行为

智能体使用 `sessions_spawn` 工具启动后台子智能体。
完成结果会作为父会话的内部事件返回；父智能体/请求者智能体决定是否需要面向用户的更新。

<AccordionGroup>
  <Accordion title="非阻塞、基于推送的完成机制">
    - `sessions_spawn` 是非阻塞的；它会立即返回运行 ID。
    - 子智能体完成后，会向父会话/请求者会话报告。
    - 需要子智能体结果的智能体轮次，应在生成所需工作后调用 `sessions_yield`。这会结束当前轮次，让完成事件作为下一条模型可见消息到达。
    - 完成通知采用推送机制。生成后，**不要**为了等待完成而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在调试时按需检查状态。
    - 子智能体输出是供请求者智能体综合处理的报告/证据。它不是用户编写的指令文本，不能覆盖系统、开发者或用户策略。
    - 完成后，在通告清理流程继续之前，OpenClaw 会尽力关闭该子智能体会话打开并受跟踪的浏览器标签页/进程。

  </Accordion>
  <Accordion title="完成结果交付">
    - OpenClaw 通过带有稳定幂等键的 `agent` 轮次，将完成结果交还给请求者会话。
    - 如果请求者运行仍处于活跃状态，OpenClaw 会先尝试唤醒/引导该运行，而不是启动第二条可见回复路径。
    - 如果无法唤醒活跃的请求者，OpenClaw 会退回到带有相同完成上下文的请求者智能体移交，而不会丢弃通告。
    - 即使父智能体决定不需要向用户显示更新，成功的父级移交也会完成子智能体结果的交付。
    - 原生子智能体不会获得消息工具。它们会向父智能体/请求者智能体返回纯助手文本；面向用户的回复仍由父智能体/请求者智能体的常规交付策略负责。
    - 如果无法直接移交，则交付会先退回到队列路由，然后在最终放弃前，对通告进行短暂的指数退避重试。
    - 交付会保留已解析的请求者路由：如果可用，绑定到线程或绑定到对话的完成路由优先。如果完成来源仅提供渠道，OpenClaw 会从请求者会话已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）中补全缺失的目标/账号，使直接交付仍能正常工作。

  </Accordion>
  <Accordion title="完成结果移交元数据">
    向请求者会话进行的完成结果移交，是由运行时生成的内部上下文
    （不是用户编写的文本），其中包括：

    - `Result` — 子智能体最新的可见 `assistant` 回复文本。工具/toolResult 输出不会被提升为子智能体结果。以失败告终的运行不会重复使用已捕获的回复文本。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精简的运行时/token 统计信息。
    - 一条审查指令，要求请求者智能体先验证结果，再判断原始任务是否完成。
    - 一条后续指导，要求请求者智能体在子智能体结果仍需进一步操作时继续任务或记录后续工作。
    - 一条适用于无需更多操作路径的最终更新指令，使用正常的助手语气编写，不转发原始内部元数据。

  </Accordion>
  <Accordion title="模式和 ACP 运行时">
    - `--model` 和 `--thinking` 会覆盖该次特定运行的默认值。
    - 完成后使用 `info`/`log` 检查详细信息和输出。
    - 对于持久的线程绑定会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 如果请求者渠道不支持线程绑定，请使用 `mode: "run"`，不要重试不可能实现的线程绑定组合。
    - 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode 或显式 Codex ACP/acpx），当工具声明支持该运行时时，请使用带有 `runtime: "acp"` 的 `sessions_spawn`。调试完成结果或智能体间循环时，请参阅 [ACP 交付模型](/zh-CN/tools/acp-agents#delivery-model)。启用 `codex` 插件后，除非用户明确要求 ACP/acpx，否则 Codex 聊天/线程控制应优先使用 `/codex ...`，而不是 ACP。
    - 在启用 ACP、请求者未处于沙箱隔离状态且已加载 `acpx` 等后端插件之前，OpenClaw 会隐藏 `runtime: "acp"`。`runtime: "acp"` 需要外部 ACP harness ID，或带有 `runtime.type="acp"` 的 `agents.list[]` 条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认子智能体运行时。

  </Accordion>
</AccordionGroup>

## 上下文模式

除非调用者明确要求派生当前对话记录，否则原生子智能体会以隔离方式启动。

| 模式       | 使用场景                                                                                                                         | 行为                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、独立实现、缓慢的工具工作，或任何可以在任务文本中清楚说明的工作                           | 创建干净的子智能体对话记录。这是默认值，可减少 token 用量。  |
| `fork`     | 依赖当前对话、先前工具结果，或请求者对话记录中已有细致指令的工作 | 在子智能体启动前，将请求者对话记录分支到子会话中。 |

请谨慎使用 `fork`。它用于对上下文敏感的委派，不能替代清晰的任务提示词。

## 工具：`sessions_spawn`

在全局 `subagent` 通道上使用 `deliver: false` 启动子智能体运行，
然后执行通告步骤，并将通告回复发送到请求者聊天渠道。

可用性取决于调用者的有效工具策略。内置的
`coding` 配置包含 `sessions_spawn`；`messaging` 和 `minimal`
不包含。`full` 允许所有工具。对于使用较窄配置但仍应能够委派工作的智能体，
请添加 `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`，或使用 `tools.profile: "coding"`。
渠道/群组、提供商、沙箱和按智能体设置的允许/拒绝策略，
仍可在配置阶段之后移除该工具。请在同一会话中使用 `/tools`
确认有效工具列表。

**默认值：**

- **模型：**除非设置 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`），否则原生子智能体会继承调用者。存在已配置的子智能体模型时，ACP 运行时生成也会使用该模型；否则 ACP harness 会保留自身默认值。显式的 `sessions_spawn.model` 始终优先。
- **思考：**除非设置 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`），否则原生子智能体会继承调用者。ACP 运行时生成还会为所选模型应用 `agents.defaults.models["provider/model"].params.thinking`。显式的 `sessions_spawn.thinking` 始终优先。
- **运行超时：**设置后，OpenClaw 会使用 `agents.defaults.subagents.runTimeoutSeconds`；否则退回到 `0`（不超时）。`sessions_spawn` 不接受按调用设置的超时覆盖。
- **任务交付：**原生子智能体会在其第一条可见的 `[Subagent Task]` 消息中收到委派任务。子智能体系统提示词包含运行时规则和路由上下文，不包含任务的隐藏副本。

已接受的原生子智能体生成会在工具结果中包含解析后的子智能体模型元数据：
`resolvedModel` 包含已应用的模型引用；
当引用含有提供商前缀时，`resolvedProvider` 包含该前缀。

### 委派提示词模式

`agents.defaults.subagents.delegationMode` 仅控制提示词指导；它不会更改工具策略，也不会强制执行委派。

- `suggest`（默认）：保留标准提示，建议对规模较大或耗时较长的工作使用子智能体。
- `prefer`：要求主智能体保持响应，并通过 `sessions_spawn` 委派任何比直接回复更复杂的工作。

按智能体覆盖：`agents.list[].subagents.delegationMode`。

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
  可选的稳定标识，用于在后续状态输出中识别特定子项。必须匹配 `[a-z][a-z0-9_-]{0,63}`，且不能是 `last` 或 `all` 等保留目标。
</ParamField>
<ParamField path="label" type="string">
  可选的易读标签。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允许的情况下，使用另一个已配置的智能体 ID 生成。
</ParamField>
<ParamField path="cwd" type="string">
  子运行的可选任务工作目录。原生子智能体仍从目标 Agent 工作区加载引导文件；`cwd` 仅更改运行时工具和 CLI harness 执行委派工作的目录。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅用于外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或明确请求的 Codex ACP/acpx），以及 `runtime.type` 为 `acp` 的 `agents.list[]` 条目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  仅限 ACP。当 `runtime: "acp"` 时恢复现有 ACP harness 会话；原生子智能体生成会忽略此字段。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  仅限 ACP。当 `runtime: "acp"` 时，将 ACP 运行输出流式传输到父会话；原生子智能体生成时请省略。
</ParamField>
<ParamField path="model" type="string">
  覆盖子智能体模型。无效值会被跳过，子智能体将使用默认模型运行，并在工具结果中发出警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子智能体运行的思考级别。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  当为 `true` 时，请求为此子智能体会话绑定渠道话题串。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认值将变为 `session`。`mode: "session"` 要求 `thread: true`。
  如果请求方渠道不支持话题串绑定，请改用 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 会在通知后立即归档会话（仍通过重命名保留记录）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  除非目标子运行时已进行沙箱隔离，否则 `require` 会拒绝生成。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 将请求方的当前记录分支到子会话中。仅限原生子智能体。绑定话题串的生成默认使用 `fork`；不绑定话题串的生成默认使用 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受渠道投递参数（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子智能体会将
其最新的助手轮次报告给请求方；外部投递仍由
父智能体/请求方智能体负责。
</Warning>

### 任务名称和目标指定

`taskName` 是供模型编排使用的标识，而不是会话键。
当协调智能体可能需要稍后检查某个子项时，可将其用于稳定的子项名称，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目标解析接受与 `taskName` 完全匹配的值以及无歧义的
前缀。匹配范围与编号 `/subagents` 目标所使用的同一活动/近期目标窗口一致，
因此已过期的已完成子项不会让复用的标识产生歧义。如果两个活动或近期子项使用相同的
`taskName`，目标会产生歧义；请改用列表索引、会话键或
运行 ID。

保留目标 `last` 和 `all` 不能用作 `taskName` 值，
因为它们已有控制含义。

## 工具：`sessions_yield`

结束当前模型轮次并等待运行时事件（主要是
子智能体完成事件）作为下一条消息到达。当已生成必需的子项工作，且请求方必须等待这些工作完成
才能给出最终答案时，请使用此工具。

`sessions_yield` 是等待原语。不要用对 `subagents`、`sessions_list`、
`sessions_history` 的轮询循环、shell `sleep` 或进程轮询来替代它，
只为检测子项是否完成。

仅当会话的有效工具列表包含 `sessions_yield` 时才使用它。
某些精简或自定义工具配置可能会公开 `sessions_spawn` 和
`subagents`，但不公开 `sessions_yield`；在这种情况下，不要虚构
轮询循环来等待完成。

存在活动子项时，OpenClaw 会在常规轮次中注入一个由运行时生成的精简
`Active Subagents` 提示块，让请求方无需轮询即可查看
当前子会话、运行 ID、状态、标签、任务和
`taskName` 别名。该块中的任务和标签字段会作为数据加引号，而不是作为指令，
因为它们可能来自用户/模型提供的生成参数。

## 工具：`subagents`

列出请求方会话拥有的已生成子智能体运行。其范围限定为
当前请求方；子项只能看到自己控制的子项。

使用 `subagents` 按需查看状态和调试。使用 `sessions_yield`
等待完成事件。

## 绑定话题串的会话

为渠道启用话题串绑定后，子智能体可持续绑定到
某个话题串，使该话题串中的后续用户消息继续路由到
同一子智能体会话。

### 支持话题串的渠道

当渠道注册了对话绑定适配器时，它就支持持久的、绑定话题串的子智能体会话
（使用 `thread: true` 的 `sessions_spawn`）。提供此支持的内置渠道包括：**Discord**、
**iMessage**、**Matrix** 和 **Telegram**。Discord 和 Matrix 默认创建
子话题串；Telegram 和 iMessage 默认绑定
当前对话。使用各渠道的 `threadBindings` 配置键控制
启用、超时和 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="生成">
    使用带有 `thread: true` 的 `sessions_spawn`（并可选择添加 `mode: "session"`）。
  </Step>
  <Step title="绑定">
    OpenClaw 在活动渠道中创建话题串，或将一个话题串绑定到该会话目标。
  </Step>
  <Step title="路由后续消息">
    该话题串中的回复和后续消息会路由到已绑定的会话。
  </Step>
  <Step title="检查超时">
    使用 `/session idle` 检查/更新因不活动而自动取消聚焦的设置，并使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="解除绑定">
    使用 `/unfocus` 手动解除绑定。
  </Step>
</Steps>

### 手动控制

| 命令               | 效果                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 将当前话题串（或新建一个话题串）绑定到子智能体/会话目标                                   |
| `/unfocus`         | 移除当前已绑定话题串的绑定                                                                 |
| `/agents`          | 列出活动运行和绑定状态（`binding:<id>`、`unbound` 或 `bindings unavailable`）             |
| `/session idle`    | 检查/更新空闲时自动取消聚焦的设置（仅限已聚焦且已绑定的话题串）                            |
| `/session max-age` | 检查/更新硬性上限（仅限已聚焦且已绑定的话题串）                                            |

### 配置开关

- **全局默认值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **渠道覆盖和生成时自动绑定的键**因适配器而异。请参阅上方的[支持话题串的渠道](#thread-supporting-channels)。

有关当前适配器的详细信息，请参阅[配置参考](/zh-CN/gateway/configuration-reference)和
[斜杠命令](/zh-CN/tools/slash-commands)。

### 允许列表

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可通过显式 `agentId` 指定为目标的已配置智能体 ID 列表（`["*"]` 允许使用任何已配置目标）。默认值：仅请求方智能体。如果设置了列表，但仍希望请求方通过 `agentId` 生成自身，请在列表中包含请求方 ID。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求方智能体未设置自己的 `subagents.allowAgents` 时使用的默认已配置目标智能体允许列表。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。按智能体覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway 网关 `agent` 通知投递尝试的单次调用超时时间。值必须为正整数毫秒，并会限制在平台安全的计时器最大值以内。临时重试可能使通知的总等待时间超过单个已配置超时时间。
</ParamField>

如果请求方会话已进行沙箱隔离，`sessions_spawn` 会拒绝
将在非沙箱环境中运行的目标。

### 设备发现

使用 `agents_list` 查看当前允许用于
`sessions_spawn` 的智能体 ID。响应包含每个所列智能体的有效
模型和嵌入式运行时元数据，让调用方能够区分 OpenClaw、Codex
app-server 和其他已配置的原生运行时。

`allowAgents` 条目必须指向 `agents.list[]` 中已配置的智能体 ID。
`["*"]` 表示任何已配置的目标智能体以及请求方。如果某项智能体配置
已删除，但其 ID 仍保留在 `allowAgents` 中，`sessions_spawn` 会拒绝该 ID，
且 `agents_list` 会将其省略。运行 `openclaw doctor --fix` 可清理过期的
允许列表条目；如果目标应继续可被生成并继承默认值，则添加一个最简的
`agents.list[]` 条目。

### 自动归档

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认值为 `60`）。
- 归档使用 `sessions.delete`，并将记录重命名为 `*.deleted.<timestamp>`（位于同一文件夹）。
- `cleanup: "delete"` 会在通知后立即归档（仍通过重命名保留记录）。
- 自动归档采用尽力而为方式；如果 Gateway 网关重启，待处理的计时器会丢失。
- 已配置的运行超时**不会**自动归档；它们只会停止运行。会话会保留到自动归档时。
- 自动归档同样适用于深度 1 和深度 2 的会话。
- 浏览器清理与归档清理相互独立：运行结束时会尽力关闭受跟踪的浏览器标签页/进程，即使记录/会话条目仍被保留。

## 嵌套子智能体

默认情况下，子智能体不能生成自己的子智能体
（`maxSpawnDepth: 1`）。设置 `maxSpawnDepth: 2` 可启用一层
嵌套——即**编排智能体模式**：主智能体 → 编排子智能体 →
工作子子智能体。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体生成子项（默认值：1，范围 1-5）
        maxChildrenPerAgent: 5, // 每个智能体会话的最大活动子项数（默认值：5，范围 1-20）
        maxConcurrent: 8, // 全局并发通道上限（默认值：8）
        runTimeoutSeconds: 900, // sessions_spawn 的默认超时时间（0 = 不超时）
        announceTimeoutMs: 120000, // 单次调用的 Gateway 网关通知超时时间
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键格式                                   | 角色                                            | 能否派生？                     |
| ---- | -------------------------------------------- | ----------------------------------------------- | ------------------------------ |
| 0    | `agent:<id>:main`                            | 主智能体                                        | 始终可以                       |
| 1    | `agent:<id>:subagent:<uuid>`                 | 子智能体（允许深度 2 时为编排器）               | 仅当 `maxSpawnDepth >= 2`      |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 次级子智能体（叶子工作智能体）                  | 绝不可以                       |

### 通知链

结果沿链向上回传：

1. 深度 2 工作智能体完成 → 通知其父级（深度 1 编排器）。
2. 深度 1 编排器收到通知、综合结果并完成 → 通知主智能体。
3. 主智能体收到通知并将结果交付给用户。

每一层只能看到其直接子级的通知。

<Note>
**操作指南：**只启动一次子级工作，然后等待完成事件，不要围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` 休眠命令构建轮询循环。`sessions_list` 和 `/subagents list` 会让子会话关系聚焦于仍在进行的工作——活动子级保持关联，已结束的子级会在近期窗口中短暂可见，而仅存在于存储中的过期子级链接会在超过新鲜度窗口后被忽略。这可以防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后恢复幽灵子级。如果子级完成事件在你已经发送最终答复后才到达，正确的后续响应是完全一致的静默令牌 `NO_REPLY` / `no_reply`。
</Note>

### 按深度划分的工具策略

- 角色和控制范围会在派生时写入会话元数据。这样可以避免扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）：**获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便派生子级并检查其状态。其他会话/系统工具仍被拒绝。
- **深度 1（叶子，当 `maxSpawnDepth == 1` 时）：**没有会话工具（当前默认行为）。
- **深度 2（叶子工作智能体）：**没有会话工具——深度 2 始终拒绝 `sessions_spawn`。无法进一步派生子级。

### 每个智能体的派生限制

每个智能体会话（无论深度）同时最多可以有 `maxChildrenPerAgent` 个活动子级（默认值为 `5`）。这可以防止单个编排器出现失控的扇出。

### 级联停止

停止深度 1 编排器会自动停止其所有深度 2 子级：

- 在主聊天中发送 `/stop` 会停止所有深度 1 智能体，并级联停止其深度 2 子级。

## 身份验证

子智能体身份验证根据**智能体 ID** 解析，而不是根据会话类型：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 身份验证存储从该智能体的 `agentDir` 加载。
- 主智能体的身份验证配置文件会作为**回退项**合并；发生冲突时，智能体配置文件会覆盖主智能体配置文件。

该合并为增量合并，因此主智能体配置文件始终可作为回退项使用。目前尚不支持每个智能体完全隔离的身份验证。

## 通知

子智能体通过通知步骤回传结果：

- 通知步骤在子智能体会话内运行（而不是请求方会话）。
- 如果子智能体恰好回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的助手文本是完全一致的静默令牌 `NO_REPLY` / `no_reply`，即使之前存在可见进度，也会抑制通知输出。

交付方式取决于请求方深度：

- 顶层请求方会话使用启用外部交付的后续 `agent` 调用（`deliver=true`）。
- 嵌套请求方子智能体会话接收内部后续注入（`deliver=false`），以便编排器在会话内综合子级结果。
- 如果嵌套请求方子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求方。

对于顶层请求方会话，完成模式的直接交付会先解析任何绑定的对话/话题串路由和钩子覆盖项，然后从请求方会话存储的路由中补全缺失的渠道目标字段。这样，即使完成来源只标识了渠道，也能将完成结果发送到正确的聊天/主题。

构建嵌套完成发现时，子级完成聚合仅限于当前请求方运行，防止之前运行中过期的子级输出泄漏到当前通知中。渠道适配器可用时，通知回复会保留话题串/主题路由。

### 通知上下文

通知上下文会规范化为稳定的内部事件块：

| 字段     | 来源                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------- |
| 来源     | `subagent` 或 `cron`                                                                                      |
| 会话 ID  | 子会话键/ID                                                                                               |
| 类型     | 通知类型 + 任务标签                                                                                       |
| 状态     | 根据运行时结果派生（`ok`、`error`、`timeout` 或 `unknown`）——**不会**根据模型文本推断                     |
| 结果内容 | 子级最新的可见助手文本                                                                                    |
| 后续操作 | 说明何时回复、何时保持静默的指令                                                                          |

运行失败并终止时会报告失败状态，而不会重放捕获的回复文本。工具/工具结果输出不会被提升为子级结果文本。

### 统计行

通知载荷末尾包含统计行（即使经过包装）：

- 运行时长（例如 `runtime 5m12s`）。
- 令牌用量（输入/输出/总计）。
- 配置模型定价时的预估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和转录路径，以便主智能体通过 `sessions_history` 获取历史记录或检查磁盘上的文件。

内部元数据仅用于编排；面向用户的回复应以正常的助手语气重写。

### 为何优先使用 `sessions_history`

在智能体轮次内读取子级转录时，`sessions_history` 是更安全的编排路径：

- 即使通用日志脱敏已禁用，也会对类似凭据/令牌的文本进行脱敏。
- 截断长文本块（每块 4000 个字符），并丢弃思考签名、推理重放载荷和内联图像数据。
- 强制执行 80 KB 响应上限；过大的行会替换为 `[sessions_history omitted: message too large]`。
- 如果存在 `nextOffset`，请用它向后翻页，查看更早的转录窗口。
- `sessions_history` **不会**从消息文本中移除推理标签、`<relevant-memories>` 脚手架或工具调用 XML——它返回接近原始转录格式的结构化内容块，只进行了脱敏和大小限制。`/subagents log` 会应用更严格的文本清理器（移除推理标签、记忆脚手架和工具调用 XML），因为它渲染的是纯聊天行而不是结构化块。
- 当你需要完整且逐字节一致的转录时，可以回退到检查磁盘上的原始转录。

## 工具策略

子智能体首先使用与父智能体或目标智能体相同的配置文件和工具策略管线。随后，OpenClaw 会应用子智能体限制层。

无论深度或角色如何，子智能体始终无法使用 `gateway`、`agents_list`、`session_status` 和 `cron`（这些是系统级/交互式工具，或应由主智能体协调的工具）。叶子子智能体（默认的深度 1 行为，以及所有深度 2 智能体）还无法使用 `subagents`、`sessions_list`、`sessions_history` 和 `sessions_spawn`。子智能体永远不会获得 `message` 工具——该工具在派生时就被禁用，并非由此拒绝列表过滤——而 `sessions_send` 仍被拒绝，因此子智能体只能通过通知链通信。

此处的 `sessions_history` 仍是有界且经过清理的回忆视图，并非原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子智能体还会获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子级。

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
        // 拒绝规则优先
        deny: ["gateway", "cron"],
        // 如果设置了 allow，它将变为仅允许列表（拒绝规则仍然优先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以缩小已经解析的工具集，但无法**重新添加**被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。要让使用编码配置文件的子智能体使用浏览器自动化，请在配置文件阶段添加浏览器：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当只有一个智能体需要获得浏览器自动化能力时，使用每智能体配置 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用专用的进程内队列通道：

- **通道名称：**`subagent`
- **并发数：**`agents.defaults.subagents.maxConcurrent`（默认值为 `8`）

## 存活性与恢复

OpenClaw 不会将缺少 `endedAt` 视为子智能体仍然存活的永久证据。早于过期运行窗口的未结束运行（2 小时，或配置的运行超时时间加上一小段宽限期，取两者中较长者）在 `/subagents list`、状态摘要、后代完成门控和每会话并发检查中不再计为活动/待处理状态。

Gateway 网关重启后，过期且未结束的已恢复运行会被清理，除非其子会话被标记为 `abortedLastRun: true`。因重启而中止的运行会继续注册到子智能体孤儿恢复流程：过期运行不会恢复，而是直接结束；新鲜的子会话则会在清除中止标记之前收到一条合成的恢复消息。

自动重启恢复会按每个子会话进行限制。如果同一子智能体子级在快速再次卡死窗口内反复被接受进行孤儿恢复，OpenClaw 会在该会话中持久化恢复墓碑，并在后续重启时停止自动恢复它。运行 `openclaw tasks maintenance --apply` 以协调任务记录，或运行 `openclaw doctor --fix` 以清除已设墓碑会话上过期的中止恢复标志。

<Note>
如果派生子智能体时因 Gateway 网关的 `PAIRING_REQUIRED` / `scope-upgrade` 而失败，请先检查 RPC 调用方，再编辑配对状态。当调用方已在 Gateway 网关请求上下文中运行时，内部 `sessions_spawn` 协调会在进程内分派，因此不会打开回环 WebSocket，也不依赖 CLI 的已配对设备权限范围基线。Gateway 网关进程外部的调用方仍会使用 WebSocket 回退，以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 通过直接回环共享令牌/密码身份验证进行连接。远程调用方、显式 `deviceIdentity`、显式设备令牌路径以及浏览器/节点客户端仍需通过正常设备审批才能升级权限范围。
</Note>

## 停止

- 在请求方聊天中发送 `/stop` 会中止请求方会话，并停止由其派生的所有活动子智能体运行，同时级联停止嵌套子级。

## 限制

- 子智能体通知采用**尽力而为**机制。如果 Gateway 网关重启，待处理的“通知返回”工作将会丢失。
- 子智能体仍共享同一个 Gateway 网关进程的资源；应将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文仅注入 `AGENTS.md` 和 `TOOLS.md`（不注入 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子智能体遵循相同的边界：`TOOLS.md` 保留在继承的 Codex 线程指令中，而仅供父智能体使用的角色设定、身份和用户文件则作为仅限当前轮次的协作指令注入，因此子智能体不会复制这些文件。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1-5）。对于大多数用例，建议使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活跃子智能体数量（默认值为 `5`，范围为 `1-20`）。

## 相关内容

- [会话工具和状态变更](/zh-CN/concepts/session-tool)
- [ACP 智能体](/zh-CN/tools/acp-agents)
- [Agent 发送](/zh-CN/tools/agent-send)
- [后台任务](/zh-CN/automation/tasks)
- [多 Agent 沙盒工具](/zh-CN/tools/multi-agent-sandbox-tools)
