---
read_when:
    - 你想通过智能体执行后台或并行工作
    - 你正在更改 sessions_spawn 或子智能体工具策略
    - 你正在实现或排查线程绑定的子智能体会话
sidebarTitle: Sub-agents
summary: 生成隔离的后台智能体运行，并将结果回报到请求者聊天
title: 子智能体
x-i18n:
    generated_at: "2026-05-11T20:35:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

子智能体是从现有智能体运行中生成的后台智能体运行。
它们在自己的会话（`agent:<agentId>:subagent:<uuid>`）中运行，
完成后会将结果**通知**回请求者的聊天
渠道。每个子智能体运行都会作为一个
[后台任务](/zh-CN/automation/tasks)进行跟踪。

主要目标：

- 并行处理“研究 / 长任务 / 慢工具”工作，而不阻塞主运行。
- 默认保持子智能体隔离（会话隔离 + 可选沙箱隔离）。
- 让工具表面难以被误用：子智能体默认**不会**获得会话工具。
- 支持可配置的嵌套深度，以适配编排器模式。

<Note>
**成本说明：**默认情况下，每个子智能体都有自己的上下文和 token 使用量。
对于繁重或重复的任务，请为子智能体设置更便宜的模型，
并让主智能体使用质量更高的模型。可通过
`agents.defaults.subagents.model` 或每个智能体的覆盖项进行配置。当子智能体
确实需要请求者当前的转录记录时，智能体可以在那次生成时请求
`context: "fork"`。绑定到线程的子智能体会话默认使用
`context: "fork"`，因为它们会将当前对话分支到一个
后续线程中。
</Note>

## 斜杠命令

使用 `/subagents` 检查或控制**当前
会话**的子智能体运行：

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

使用顶层 [`/steer <message>`](/zh-CN/tools/steer) 来操控当前请求者会话的活动运行。当目标是子运行时，使用 `/subagents steer <id|#> <message>`。

`/subagents info` 会显示运行元数据（状态、时间戳、会话 ID、
转录记录路径、清理）。使用 `sessions_history` 获取有界且经过安全过滤的回忆视图；
当你需要原始完整转录记录时，请检查磁盘上的转录记录路径。

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

`/subagents spawn` 会以用户命令（而不是内部中继）的形式启动后台子智能体，
并在运行完成时向请求者聊天发送一次最终完成更新。

<AccordionGroup>
  <Accordion title="非阻塞、基于推送的完成">
    - 生成命令是非阻塞的；它会立即返回一个运行 ID。
    - 完成时，子智能体会向请求者聊天渠道通知一条摘要/结果消息。
    - 需要子结果的智能体轮次，应在生成所需工作后调用 `sessions_yield`。这会结束当前轮次，并让完成事件作为下一条模型可见消息到达。
    - 完成是基于推送的。一旦生成，**不要**在循环中轮询 `/subagents list`、`sessions_list` 或 `sessions_history`，只为等待其完成；仅在调试或干预需要时按需检查状态。
    - 子输出是供请求者智能体综合的报告/证据。它不是用户撰写的指令文本，不能覆盖系统、开发者或用户策略。
    - 完成时，OpenClaw 会尽力关闭由该子智能体会话打开并受跟踪的浏览器标签页/进程，然后继续通知清理流程。

  </Accordion>
  <Accordion title="手动生成的交付弹性">
    - OpenClaw 会通过带有稳定幂等键的 `agent` 轮次，将完成结果交还给请求者会话。
    - 如果请求者运行仍处于活动状态，OpenClaw 会先尝试唤醒/操控该运行，而不是启动第二条可见回复路径。
    - 如果请求者智能体的完成交接失败或没有产生可见输出，OpenClaw 会将交付视为失败，并回退到队列路由/重试。它不会将子结果直接原样发送到外部聊天。
    - 如果无法使用直接交接，则回退到队列路由。
    - 如果队列路由仍然不可用，通知会以短暂的指数退避重试，然后才最终放弃。
    - 完成交付会保留解析后的请求者路由：当可用时，绑定到线程或绑定到对话的完成路由优先；如果完成来源只提供渠道，OpenClaw 会从请求者会话解析后的路由（`lastChannel` / `lastTo` / `lastAccountId`）填充缺失的目标/账号，以便直接交付仍然可用。

  </Accordion>
  <Accordion title="完成交接元数据">
    给请求者会话的完成交接是运行时生成的
    内部上下文（不是用户撰写的文本），并包含：

    - `Result` — 最新可见的 `assistant` 回复文本，否则为经过净化的最新工具/toolResult 文本。终止且失败的运行不会复用捕获到的回复文本。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 紧凑的运行时/token 统计信息。
    - 一条交付指令，要求请求者智能体以正常 assistant 口吻重写（而不是转发原始内部元数据）。

  </Accordion>
  <Accordion title="模式和 ACP 运行时">
    - `--model` 和 `--thinking` 会覆盖该特定运行的默认值。
    - 使用 `info`/`log` 在完成后检查详情和输出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode，或显式 Codex ACP/acpx），当工具声明该运行时时，请使用带有 `runtime: "acp"` 的 `sessions_spawn`。调试完成或智能体到智能体循环时，请参阅 [ACP 交付模型](/zh-CN/tools/acp-agents#delivery-model)。启用 `codex` 插件时，除非用户明确要求 ACP/acpx，否则 Codex 聊天/线程控制应优先使用 `/codex ...`，而不是 ACP。
    - OpenClaw 会隐藏 `runtime: "acp"`，直到 ACP 已启用、请求者未被沙箱隔离，并且已加载如 `acpx` 这样的后端插件。`runtime: "acp"` 需要一个外部 ACP harness ID，或一个带有 `runtime.type="acp"` 的 `agents.list[]` 条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认子智能体运行时。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子智能体默认以隔离方式启动，除非调用方明确要求 fork
当前转录记录。

| 模式       | 使用场景                                                                                                                         | 行为                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、独立实现、慢工具工作，或任何可以在任务文本中简要说明的事项                           | 创建一个干净的子转录记录。这是默认行为，可降低 token 使用量。  |
| `fork`     | 依赖当前对话、先前工具结果，或请求者转录记录中已有的细微指令的工作 | 在子智能体启动前，将请求者转录记录分支到子会话中。 |

请谨慎使用 `fork`。它用于上下文敏感的委派，
不能替代清晰的任务提示词。

## 工具：`sessions_spawn`

在全局 `subagent` 通道上以 `deliver: false` 启动一个子智能体运行，
然后运行一个通知步骤，并将通知回复发布到请求者
聊天渠道。

可用性取决于调用方的有效工具策略。`coding` 和
`full` 配置文件默认公开 `sessions_spawn`。`messaging` 配置文件
不会公开；请添加 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`，或对应该委派工作的智能体使用 `tools.profile: "coding"`。
渠道/群组、提供商、沙箱，以及每个智能体的允许/拒绝策略，
仍然可以在配置文件阶段之后移除该工具。请在同一
会话中使用 `/tools` 确认有效工具列表。

**默认值：**

- **模型：**继承调用方，除非你设置了 `agents.defaults.subagents.model`（或每个智能体的 `agents.list[].subagents.model`）；显式的 `sessions_spawn.model` 仍然优先。
- **Thinking：**继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或每个智能体的 `agents.list[].subagents.thinking`）；显式的 `sessions_spawn.thinking` 仍然优先。
- **运行超时：**如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示词指导；它不会改变工具策略，也不会强制委派。

- `suggest`（默认）：保留标准提示，建议对更大或更慢的工作使用子智能体。
- `prefer`：告诉主智能体保持响应，并通过 `sessions_spawn` 委派任何比直接回复更复杂的事项。

每个智能体的覆盖项使用 `agents.list[].subagents.delegationMode`。

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
  可选的稳定句柄，用于后续 `subagents` 定向。必须匹配 `[a-z][a-z0-9_]{0,63}`，且不能是 `last` 或 `all` 等保留目标。当协调器可能需要在生成多个子项后引导、终止或识别特定子项时，优先使用它。
</ParamField>
<ParamField path="label" type="string">
  可选的人类可读标签。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允许时，在另一个智能体 ID 下生成。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅用于外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或明确请求的 Codex ACP/acpx），以及 `runtime.type` 为 `acp` 的 `agents.list[]` 条目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  仅 ACP。在 `runtime: "acp"` 时恢复现有 ACP harness 会话；对原生子智能体生成会被忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  仅 ACP。在 `runtime: "acp"` 时将 ACP 运行输出流式传输到父会话；原生子智能体生成时省略。
</ParamField>
<ParamField path="model" type="string">
  覆盖子智能体模型。无效值会被跳过，子智能体将使用默认模型运行，并在工具结果中给出警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子智能体运行的思考级别。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  设置后默认为 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`。设置后，子智能体运行会在 N 秒后中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  当为 `true` 时，为此子智能体会话请求频道线程绑定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认值会变为 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 会在公告后立即归档（仍会通过重命名保留转录记录）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 会拒绝生成，除非目标子运行时处于沙箱隔离状态。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 会将请求者的当前转录记录分支到子会话中。仅原生子智能体。线程绑定生成默认为 `fork`；非线程生成默认为 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受频道投递参数（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需投递，请从生成的运行中使用
`message`/`sessions_send`。
</Warning>

### 任务名称和定向

`taskName` 是用于编排的面向模型句柄，不是会话键。
当协调器可能需要稍后引导或终止该子项时，可将其用于稳定的子项名称，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目标解析接受精确的 `taskName` 匹配和无歧义的前缀。
匹配范围限定在与编号 `/subagents` 目标相同的活动/近期目标窗口内，因此过时的已完成子项不会让复用的句柄变得有歧义。如果两个活动或近期子项共享同一个
`taskName`，该目标就有歧义；请改用列表索引、会话键或运行 ID。

保留目标 `last` 和 `all` 不是有效的 `taskName` 值，
因为它们已经具有控制含义。

## 工具：`sessions_yield`

结束当前模型轮次并等待运行时事件，主要是子智能体完成事件，以便它们作为下一条消息到达。当请求者必须等到这些完成事件到达后才能生成最终回答时，在生成必需的子项工作后使用它。

`sessions_yield` 是等待原语。不要仅为检测子项完成而用对 `subagents`、`sessions_list`、`sessions_history` 的轮询循环、shell
`sleep` 或进程轮询来替代它。

只有在会话的有效工具列表包含 `sessions_yield` 时才使用它。某些极简或自定义工具配置可能会暴露 `sessions_spawn` 和
`subagents`，但不暴露 `sessions_yield`；在这种情况下，不要为了等待完成而发明轮询循环。

当存在活动子项时，OpenClaw 会在正常轮次中注入一个紧凑的运行时生成
`Active Subagents` 提示块，让请求者无需轮询即可看到当前子会话、运行 ID、状态、标签、任务和
`taskName` 别名。该块中的任务和标签字段会作为数据而非指令被引用，因为它们可能来自用户/模型提供的生成参数。

## 工具：`subagents`

列出、引导或终止请求者会话拥有的已生成子智能体运行。
它的作用域限定为当前请求者；子项只能查看/控制自己控制的子项。

将 `subagents` 用于按需状态、调试、引导或终止。
使用 `sessions_yield` 等待完成事件。

## 线程绑定会话

当某个频道启用线程绑定时，子智能体可以保持绑定到某个线程，使该线程中的后续用户消息继续路由到同一个子智能体会话。

### 支持线程的频道

**Discord** 目前是唯一支持的频道。它支持持久线程绑定子智能体会话（带
`thread: true` 的 `sessions_spawn`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`），以及适配器键
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours` 和
`channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="生成">
    带 `thread: true` 的 `sessions_spawn`（也可选择带 `mode: "session"`）。
  </Step>
  <Step title="绑定">
    OpenClaw 会在活动频道中创建线程，或将线程绑定到该会话目标。
  </Step>
  <Step title="路由后续消息">
    该线程中的回复和后续消息会路由到已绑定会话。
  </Step>
  <Step title="检查超时">
    使用 `/session idle` 检查/更新非活动自动取消聚焦，并使用
    `/session max-age` 控制硬上限。
  </Step>
  <Step title="分离">
    使用 `/unfocus` 手动分离。
  </Step>
</Steps>

### 手动控制

| 命令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 将当前线程（或新建线程）绑定到子智能体/会话目标                      |
| `/unfocus`         | 移除当前已绑定线程的绑定                                              |
| `/agents`          | 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）                  |
| `/session idle`    | 检查/更新空闲自动取消聚焦（仅限已聚焦的已绑定线程）                  |
| `/session max-age` | 检查/更新硬上限（仅限已聚焦的已绑定线程）                            |

### 配置开关

- **全局默认值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **频道覆盖和生成自动绑定键**是适配器特定的。见上方[支持线程的频道](#thread-supporting-channels)。

有关当前适配器详情，请参阅[配置参考](/zh-CN/gateway/configuration-reference)和
[斜杠命令](/zh-CN/tools/slash-commands)。

### 允许列表

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可通过显式 `agentId` 定向的智能体 ID 列表（`["*"]` 允许任意智能体）。默认值：仅请求者智能体。如果你设置了列表，并且仍希望请求者使用 `agentId` 生成自身，请在列表中包含请求者 ID。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求者智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体允许列表。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。按智能体覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway 网关 `agent` 公告投递尝试的单次调用超时。值为正整数毫秒，并会钳制到平台安全的定时器最大值。瞬时重试可能会让总公告等待时间长于一个配置的超时。
</ParamField>

如果请求者会话处于沙箱隔离状态，`sessions_spawn` 会拒绝会以非沙箱隔离方式运行的目标。

### 设备发现

使用 `agents_list` 查看当前允许用于 `sessions_spawn` 的智能体 ID。响应包含每个列出智能体的有效模型和嵌入式运行时元数据，以便调用方区分 PI、Codex 应用服务器以及其他已配置的原生运行时。

### 自动归档

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认 `60`）。
- 归档使用 `sessions.delete`，并将转录记录重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在公告后立即归档（仍会通过重命名保留转录记录）。
- 自动归档是尽力而为；如果 Gateway 网关重启，待处理定时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会保留到自动归档。
- 自动归档同样适用于深度 1 和深度 2 的会话。
- 浏览器清理独立于归档清理：运行结束时，会尽力关闭被跟踪的浏览器标签页/进程，即使转录记录/会话记录被保留。

## 嵌套子智能体

默认情况下，子智能体不能生成自己的子智能体
（`maxSpawnDepth: 1`）。设置 `maxSpawnDepth: 2` 可启用一级嵌套，即**编排器模式**：主智能体 → 编排器子智能体 →
工作子-子智能体。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形状                                   | 角色                                          | 可生成？                     |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体                                      | 始终                         |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（允许深度 2 时为编排器）            | 仅当 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子-子智能体（叶子工作项）                    | 从不                         |

### 公告链

结果会沿链路向上返回：

1. 深度 2 工作项完成 → 向其父项（深度 1 编排器）公告。
2. 深度 1 编排器收到公告，合成结果并完成 → 向主智能体公告。
3. 主智能体收到公告并投递给用户。

每一级只能看到来自其直接子项的公告。

<Note>
**操作指导：**只启动一次子任务，并等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。`sessions_list` 和 `/subagents list` 让子会话关系专注于实时工作：实时子会话保持附加，已结束的子会话会在短暂的最近窗口内保持可见，过时的仅存储子链接会在其新鲜度窗口后被忽略。这可以防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后重新唤起幽灵子会话。如果子会话完成事件在你已经发送最终答案后到达，正确的后续响应是精确的静默令牌 `NO_REPLY` / `no_reply`。
</Note>

### 按深度划分的工具策略

- 角色和控制范围会在生成时写入会话元数据。这可以避免扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）：**获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理它的子会话。其他会话/系统工具仍被拒绝。
- **深度 1（叶节点，当 `maxSpawnDepth == 1` 时）：**没有会话工具（当前默认行为）。
- **深度 2（叶工作器）：**没有会话工具，`sessions_spawn` 在深度 2 始终被拒绝。不能再生成更多子会话。

### 每个智能体的生成限制

每个智能体会话（任意深度）同一时间最多可以有 `maxChildrenPerAgent`（默认 `5`）个活跃子会话。这可以防止单个编排器失控式扇出。

### 级联停止

停止深度 1 编排器会自动停止其所有深度 2 子会话：

- 主聊天中的 `/stop` 会停止所有深度 1 智能体，并级联停止它们的深度 2 子会话。
- `/subagents kill <id>` 会停止特定子智能体，并级联停止它的子会话。
- `/subagents kill all` 会停止请求者的所有子智能体，并执行级联停止。

## 身份验证

子智能体身份验证按 **智能体 ID** 解析，而不是按会话类型解析：

- 子智能体会话键是 `agent:<agentId>:subagent:<uuid>`。
- 身份验证存储从该智能体的 `agentDir` 加载。
- 主智能体的身份验证配置会作为**后备**合并进来；发生冲突时，智能体配置会覆盖主配置。

合并是增量式的，因此主配置始终可作为后备使用。尚不支持每个智能体完全隔离的身份验证。

## 公告

子智能体通过公告步骤回报：

- 公告步骤在子智能体会话内部运行（不是请求者会话）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新助手文本是精确的静默令牌 `NO_REPLY` / `no_reply`，即使之前存在可见进度，也会抑制公告输出。

投递取决于请求者深度：

- 顶层请求者会话使用带外部投递的后续 `agent` 调用（`deliver=true`）。
- 嵌套请求者子智能体会话会收到内部后续注入（`deliver=false`），这样编排器可以在会话内合成子结果。
- 如果嵌套请求者子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求者。

对于顶层请求者会话，完成模式的直接投递会先解析任何已绑定的对话/线程路由和钩子覆盖，然后从请求者会话存储的路由中填补缺失的渠道目标字段。这样即使完成来源只标识渠道，完成结果也会保持在正确的聊天/主题上。

构建嵌套完成发现时，子完成聚合会限定在当前请求者运行范围内，防止旧的先前运行子输出泄漏到当前公告中。当渠道适配器上可用时，公告回复会保留线程/主题路由。

### 公告上下文

公告上下文会规范化为稳定的内部事件块：

| 字段           | 来源                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 来源           | `subagent` 或 `cron`                                                                                          |
| 会话 ID        | 子会话键/ID                                                                                                   |
| 类型           | 公告类型 + 任务标签                                                                                           |
| Status         | 从运行时结果派生（`success`、`error`、`timeout` 或 `unknown`），**不是**从模型文本推断                         |
| 结果内容       | 最新可见助手文本，否则为清理后的最新工具/toolResult 文本                                                      |
| 跟进           | 描述何时回复、何时保持静默的指令                                                                              |

终止失败的运行会报告失败 Status，而不会重放捕获的回复文本。超时时，如果子会话只执行到工具调用，公告可以将该历史折叠为简短的部分进度摘要，而不是重放原始工具输出。

### 统计行

公告载荷末尾会包含统计行（即使被包装）：

- 运行时间（例如 `runtime 5m12s`）。
- Token 用量（输入/输出/总计）。
- 配置了模型定价时的估算成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和转录路径，这样主智能体可以通过 `sessions_history` 获取历史，或检查磁盘上的文件。

内部元数据仅用于编排；面向用户的回复应改写为正常的助手语气。

### 为什么优先使用 `sessions_history`

`sessions_history` 是更安全的编排路径：

- 助手回忆会先被规范化：移除思考标签；移除 `<relevant-memories>` / `<relevant_memories>` 脚手架；移除纯文本工具调用 XML 载荷块（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括从未干净闭合的截断载荷；移除降级的工具调用/结果脚手架和历史上下文标记；移除泄漏的模型控制令牌（`<|assistant|>`、其他 ASCII `<|...|>`、全角 `<｜...｜>`）；移除畸形的 MiniMax 工具调用 XML。
- 类似凭据/token 的文本会被打码。
- 长块可以被截断。
- 极大的历史可以丢弃较旧行，或用 `[sessions_history omitted: message too large]` 替换过大的行。
- 当你需要完整的逐字节转录时，原始磁盘转录检查是后备方案。

## 工具策略

子智能体首先使用与父智能体或目标智能体相同的配置文件和工具策略管线。之后，OpenClaw 会应用子智能体限制层。

在没有限制性 `tools.profile` 的情况下，子智能体会获得**除会话工具**和系统工具之外的所有工具：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` 在这里仍然是有界且经过清理的回忆视图，并非原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子智能体还会收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理它们的子会话。

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

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以收窄已经解析出的工具集，但不能**加回**被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。要让 coding-profile 子智能体使用浏览器自动化，请在配置文件阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当只有一个智能体应获得浏览器自动化时，使用逐智能体的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用专用的进程内队列通道：

- **通道名称：**`subagent`
- **并发数：**`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 存活性与恢复

OpenClaw 不会将缺少 `endedAt` 视为子智能体仍然存活的永久证明。超过陈旧运行窗口的未结束运行，在 `/subagents list`、Status 摘要、后代完成门控和逐会话并发检查中不再计为活跃/待处理。

Gateway 网关重启后，陈旧的未结束恢复运行会被剪除，除非其子会话被标记为 `abortedLastRun: true`。这些因重启中止的子会话仍可通过子智能体孤儿恢复流程恢复，该流程会在清除中止标记前发送一条合成恢复消息。

自动重启恢复按每个子会话设有边界。如果同一个子智能体子会话在快速重新卡住窗口内反复被接受进行孤儿恢复，OpenClaw 会在该会话上持久化一个恢复墓碑，并在后续重启时停止自动恢复它。运行 `openclaw tasks maintenance --apply` 来协调任务记录，或运行 `openclaw doctor --fix` 来清除带墓碑会话上的陈旧中止恢复标志。

<Note>
如果子智能体生成因 Gateway 网关 `PAIRING_REQUIRED` / `scope-upgrade` 失败，请先检查 RPC 调用方，再编辑配对状态。内部 `sessions_spawn` 协调应通过直连 loopback 共享 token/密码身份验证，以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 连接；该路径不依赖 CLI 的已配对设备范围基线。远程调用方、显式 `deviceIdentity`、显式设备 token 路径以及 browser/node 客户端仍需要正常设备批准才能进行范围升级。
</Note>

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止从它生成的所有活跃子智能体运行，同时级联到嵌套子会话。
- `/subagents kill <id>` 会停止特定子智能体，并级联停止它的子会话。

## 限制

- 子智能体公告是**尽力而为**的。如果 Gateway 网关重启，待处理的“公告回传”工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md`、`TOOLS.md`、`SOUL.md`、`IDENTITY.md` 和 `USER.md`（不注入 `MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度是 5（`maxSpawnDepth` 范围：1–5）。大多数用例推荐深度 2。
- `maxChildrenPerAgent` 限制每个会话的活跃子会话数量（默认 `5`，范围 `1–20`）。

## 相关

- [ACP Agents](/zh-CN/tools/acp-agents)
- [Agent send](/zh-CN/tools/agent-send)
- [后台任务](/zh-CN/automation/tasks)
- [多 Agent 沙盒工具](/zh-CN/tools/multi-agent-sandbox-tools)
