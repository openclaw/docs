---
read_when:
    - 你想通过智能体进行后台或并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查线程绑定的子智能体会话
sidebarTitle: Sub-agents
summary: 启动隔离的后台智能体运行，并将结果回传到请求者聊天中
title: 子智能体
x-i18n:
    generated_at: "2026-04-27T13:49:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a23dc45659647062725e6959247299546ebf1027525dc21587012cd7f23e1f
    source_path: tools/subagents.md
    workflow: 15
---

子智能体是从现有智能体运行中派生出来的后台智能体运行。  
它们在各自独立的会话中运行（`agent:<agentId>:subagent:<uuid>`），并且在完成后，会将结果**通知**回请求者聊天渠道。每个子智能体运行都会被跟踪为一个[后台任务](/zh-CN/automation/tasks)。

主要目标：

- 在不阻塞主运行的情况下，并行处理“研究 / 长任务 / 慢工具”类工作。
- 默认保持子智能体隔离（会话分离 + 可选沙箱隔离）。
- 让工具使用面尽量不易被误用：子智能体默认**不会**获得会话工具。
- 支持可配置的嵌套深度，以适配编排器模式。

<Note>
**成本说明：** 默认情况下，每个子智能体都有自己的上下文和 token 使用量。对于高负载或重复性任务，建议为子智能体设置更便宜的模型，同时让主智能体继续使用质量更高的模型。可通过 `agents.defaults.subagents.model` 或按智能体覆盖来配置。若子智能体确实需要请求者当前的对话记录，智能体可以在该次派生时请求 `context: "fork"`。
</Note>

## 斜杠命令

使用 `/subagents` 查看或控制**当前会话**的子智能体运行：

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` 会显示运行元数据（状态、时间戳、会话 id、转录路径、清理情况）。使用 `sessions_history` 获取有边界且经过安全过滤的回溯视图；当你需要原始完整转录时，请检查磁盘上的转录路径。

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

`/subagents spawn` 会以用户命令（而非内部中继）的方式启动一个后台子智能体，并在运行完成后，将一条最终完成更新发送回请求者聊天。

<AccordionGroup>
  <Accordion title="非阻塞、基于推送的完成通知">
    - 派生命令是非阻塞的；它会立即返回一个运行 id。
    - 完成后，子智能体会将摘要/结果消息通知回请求者聊天渠道。
    - 完成通知是基于推送的。一旦派生完成，**不要**仅为了等待其结束而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在调试或干预时按需查看状态。
    - 完成时，OpenClaw 会尽最大努力关闭该子智能体会话所打开并被跟踪的浏览器标签页/进程，然后再继续执行通知清理流程。
  </Accordion>
  <Accordion title="手动派生的交付弹性">
    - OpenClaw 会先使用稳定的幂等键尝试直接 `agent` 投递。
    - 若直接投递失败，则回退到队列路由。
    - 若队列路由仍不可用，则会在最终放弃前，使用短周期指数退避重试通知。
    - 完成交付会保留已解析的请求者路由：若可用，线程绑定或会话绑定的完成路由优先生效；如果完成来源仅提供渠道，OpenClaw 会从请求者会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）中补齐缺失的 target/account，从而仍可进行直接投递。
  </Accordion>
  <Accordion title="完成交接元数据">
    交回请求者会话的完成交接数据是运行时生成的内部上下文（不是用户编写的文本），其中包括：

    - `Result` —— 最新可见的 `assistant` 回复文本；若没有，则使用经过清理的最新 `tool`/`toolResult` 文本。终态失败的运行不会复用已捕获的回复文本。
    - `Status` —— `completed successfully` / `failed` / `timed out` / `unknown`。
    - 紧凑的运行时/token 统计信息。
    - 一条交付指令，告诉请求者智能体要用正常的助手口吻重写，而不是转发原始内部元数据。

  </Accordion>
  <Accordion title="模式与 ACP 运行时">
    - `--model` 和 `--thinking` 会覆盖该次运行的默认值。
    - 使用 `info`/`log` 可在完成后查看详细信息和输出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定会话，请使用 `sessions_spawn`，并设置 `thread: true` 和 `mode: "session"`。
    - 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode，或显式的 Codex ACP/acpx），当工具声明该运行时时，请使用 `sessions_spawn` 并设置 `runtime: "acp"`。在调试完成通知或智能体间循环时，请参阅 [ACP 交付模型](/zh-CN/tools/acp-agents#delivery-model)。当启用 `codex` 插件时，Codex 聊天/线程控制应优先使用 `/codex ...`，除非用户明确要求 ACP/acpx。
    - 只有在 ACP 已启用、请求者未处于沙箱中，且已加载 `acpx` 这类后端插件时，OpenClaw 才会显示 `runtime: "acp"`。`runtime: "acp"` 需要一个外部 ACP harness id，或一个带有 `runtime.type="acp"` 的 `agents.list[]` 条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认的子智能体运行时。
  </Accordion>
</AccordionGroup>

## 上下文模式

原生子智能体默认以隔离方式启动，除非调用方明确要求 fork 当前对话记录。

| 模式       | 适用场景 | 行为 |
| ---------- | -------- | ---- |
| `isolated` | 全新研究、独立实现、慢工具工作，或任何可以通过任务文本简要说明的工作 | 创建一个干净的子级转录。这是默认值，并且能将 token 使用量保持得更低。 |
| `fork`     | 工作依赖当前对话、先前工具结果，或请求者转录中已有的细致指令 | 在子级启动前，将请求者转录分支到子会话中。 |

请谨慎使用 `fork`。它用于对上下文敏感的委派，而不是替代清晰的任务提示编写。

## 工具：`sessions_spawn`

在全局 `subagent` 通道上以 `deliver: false` 启动一个子智能体运行，然后执行通知步骤，并将通知回复发布到请求者聊天渠道。

其可用性取决于调用方的有效工具策略。`coding` 和 `full` 配置文件默认暴露 `sessions_spawn`。`messaging` 配置文件则不会；请添加 `tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]`，或者为需要委派工作的智能体使用 `tools.profile: "coding"`。渠道/分组、提供商、沙箱隔离以及按智能体设置的允许/拒绝策略，仍然可以在配置文件阶段之后移除此工具。可在同一会话中使用 `/tools` 来确认实际生效的工具列表。

**默认值：**

- **模型：** 继承调用方，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式设置的 `sessions_spawn.model` 仍然优先生效。
- **Thinking：** 继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式设置的 `sessions_spawn.thinking` 仍然优先生效。
- **运行超时：** 如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退为 `0`（无超时）。

### 工具参数

<ParamField path="task" type="string" required>
  子智能体的任务描述。
</ParamField>
<ParamField path="label" type="string">
  可选的人类可读标签。
</ParamField>
<ParamField path="agentId" type="string">
  当 `subagents.allowAgents` 允许时，可在另一个智能体 id 下派生。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅用于外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或显式请求的 Codex ACP/acpx），以及那些 `runtime.type` 为 `acp` 的 `agents.list[]` 条目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  仅限 ACP。当 `runtime: "acp"` 时恢复一个现有 ACP harness 会话；对于原生子智能体派生会忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  仅限 ACP。当 `runtime: "acp"` 时，将 ACP 运行输出流式传输到父会话；对于原生子智能体派生请省略。
</ParamField>
<ParamField path="model" type="string">
  覆盖子智能体模型。无效值会被跳过，子智能体将使用默认模型运行，并在工具结果中附带警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子智能体运行的 thinking 级别。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  默认在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`。设置后，子智能体运行会在 N 秒后中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  当为 `true` 时，会为该子智能体会话请求渠道线程绑定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认值会变为 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 会在通知后立即归档（仍会通过重命名保留转录）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 会在目标子级运行时未启用沙箱隔离时拒绝派生。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 会将请求者当前转录分支到子会话中。仅适用于原生子智能体。只有在子级需要当前转录时才应使用 `fork`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受渠道交付参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需交付，请从派生运行中使用 `message`/`sessions_send`。
</Warning>

## 线程绑定会话

当某个渠道启用了线程绑定时，子智能体可以持续绑定到一个线程，这样该线程中的后续用户消息就会持续路由到同一个子智能体会话。

### 支持线程的渠道

目前只有 **Discord** 支持。它支持持久的线程绑定子智能体会话（`sessions_spawn` 配合 `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键  
`channels.discord.threadBindings.enabled`、  
`channels.discord.threadBindings.idleHours`、  
`channels.discord.threadBindings.maxAgeHours` 和  
`channels.discord.threadBindings.spawnSubagentSessions`。

### 快速流程

<Steps>
  <Step title="派生">
    使用 `sessions_spawn` 并设置 `thread: true`（可选再加上 `mode: "session"`）。
  </Step>
  <Step title="绑定">
    OpenClaw 会在当前渠道中创建一个线程，或将某个线程绑定到该会话目标。
  </Step>
  <Step title="路由后续消息">
    该线程中的回复和后续消息会被路由到绑定的会话。
  </Step>
  <Step title="检查超时">
    使用 `/session idle` 查看/更新非活动自动取消聚焦设置，并使用 `/session max-age` 控制硬性时长上限。
  </Step>
  <Step title="解除绑定">
    使用 `/unfocus` 手动解除绑定。
  </Step>
</Steps>

### 手动控制

| 命令 | 效果 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 将当前线程绑定到某个子智能体/会话目标（或创建一个线程） |
| `/unfocus`         | 移除当前已绑定线程的绑定 |
| `/agents`          | 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`） |
| `/session idle`    | 查看/更新空闲自动取消聚焦设置（仅适用于已聚焦的绑定线程） |
| `/session max-age` | 查看/更新硬性时长上限（仅适用于已聚焦的绑定线程） |

### 配置开关

- **全局默认值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **渠道覆盖和派生自动绑定键** 为适配器专属。请参阅上方的[支持线程的渠道](#thread-supporting-channels)。

当前适配器的详细信息请参阅[配置参考](/zh-CN/gateway/configuration-reference)和[斜杠命令](/zh-CN/tools/slash-commands)。

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可通过 `agentId` 定位的智能体 id 列表（`["*"]` 表示允许任意智能体）。默认值：仅请求者智能体。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求者智能体未设置自己的 `subagents.allowAgents` 时，使用的默认目标智能体 Allowlist。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置）。按智能体覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果请求者会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些将在非沙箱环境下运行的目标。

### 发现

使用 `agents_list` 查看当前哪些智能体 id 被允许用于 `sessions_spawn`。响应中包含每个列出智能体的有效模型和嵌入式运行时元数据，以便调用方区分 PI、Codex app-server 以及其他已配置的原生运行时。

### 自动归档

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes`（默认 `60`）之后自动归档。
- 归档使用 `sessions.delete`，并将转录重命名为 `*.deleted.<timestamp>`（同一文件夹内）。
- `cleanup: "delete"` 会在通知后立即归档（仍通过重命名保留转录）。
- 自动归档采用尽力而为策略；如果 Gateway 网关重启，待处理定时器会丢失。
- `runTimeoutSeconds` **不会**触发自动归档；它只会停止运行。会话会保留，直到自动归档执行。
- 自动归档同样适用于深度 1 和深度 2 的会话。
- 浏览器清理与归档清理分开：即使保留转录/会话记录，在运行完成时，已跟踪的浏览器标签页/进程也会尽力关闭。

## 嵌套子智能体

默认情况下，子智能体不能再派生自己的子智能体（`maxSpawnDepth: 1`）。设置 `maxSpawnDepth: 2` 可启用一层嵌套——即**编排器模式**：主智能体 → 编排子智能体 → 工作子子智能体。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体派生子级（默认：1）
        maxChildrenPerAgent: 5, // 每个智能体会话最多活动子级数量（默认：5）
        maxConcurrent: 8, // 全局并发通道上限（默认：8）
        runTimeoutSeconds: 900, // 省略时 sessions_spawn 的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形态 | 角色 | 可以派生？ |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体 | 始终可以 |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（当允许深度 2 时可作为编排器） | 仅当 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作节点） | 永不允许 |

### 通知链

结果会沿链路向上返回：

1. 深度 2 的工作节点完成 → 通知其父级（深度 1 编排器）。
2. 深度 1 编排器收到通知，综合结果并完成 → 通知主智能体。
3. 主智能体收到通知并交付给用户。

每一层只会看到其直接子级发来的通知。

<Note>
**操作指引：** 启动子级工作一次后，等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。`sessions_list` 和 `/subagents list` 会将子会话关系聚焦在实时工作上——活动子级保持附着，已结束子级在短暂的最近窗口内仍然可见，而仅存在于存储中的陈旧子级链接会在其新鲜度窗口后被忽略。这可以防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后重新唤起幽灵子级。如果某个子级完成事件在你已经发送最终回答之后才到达，正确的后续操作是精确的静默 token `NO_REPLY` / `no_reply`。
</Note>

### 按深度划分的工具策略

- 角色和控制范围会在派生时写入会话元数据。这样可以避免扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）：** 获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话/系统工具仍然被拒绝。
- **深度 1（叶子节点，当 `maxSpawnDepth == 1` 时）：** 没有会话工具（当前默认行为）。
- **深度 2（叶子工作节点）：** 没有会话工具——在深度 2 时始终拒绝 `sessions_spawn`。不能继续派生更深层子级。

### 按智能体划分的派生数量限制

每个智能体会话（任意深度）同时最多只能有 `maxChildrenPerAgent` 个活动子级（默认 `5`）。这可防止单个编排器失控式扇出。

### 级联停止

停止一个深度 1 编排器会自动停止其所有深度 2 子级：

- 在主聊天中使用 `/stop` 会停止所有深度 1 智能体，并级联停止它们的深度 2 子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联停止其子级。
- `/subagents kill all` 会停止请求者的所有子智能体，并执行级联停止。

## 身份验证

子智能体认证按**智能体 id** 解析，而不是按会话类型解析：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 认证存储从该智能体的 `agentDir` 加载。
- 主智能体的认证配置文件会作为**回退项**合并进来；若发生冲突，智能体配置文件会覆盖主配置文件。

这种合并是增量式的，因此主配置文件始终可作为回退项使用。当前尚不支持按智能体完全隔离的认证。

## 通知

子智能体通过通知步骤回报结果：

- 通知步骤在子智能体会话内部运行（而不是在请求者会话中）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的 assistant 文本是精确的静默 token `NO_REPLY` / `no_reply`，则即使之前存在可见进度，也会抑制通知输出。

交付方式取决于请求者深度：

- 顶层请求者会话使用带外部交付的后续 `agent` 调用（`deliver=true`）。
- 嵌套请求者子智能体会话接收内部后续注入（`deliver=false`），以便编排器能在会话内综合子级结果。
- 如果嵌套请求者子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求者。

对于顶层请求者会话，完成模式下的直接交付会先解析任意已绑定的会话/线程路由和 hook 覆盖，然后用请求者会话已存储的路由信息补齐缺失的渠道目标字段。这样即使完成来源只标识了渠道，也能将完成通知保持在正确的聊天/话题中。

在构建嵌套完成结果时，子级完成聚合会限定在当前请求者运行范围内，防止过往运行中陈旧的子级输出泄漏到当前通知中。通知回复在渠道适配器可用时会保留线程/话题路由。

### 通知上下文

通知上下文会被规范化为稳定的内部事件块：

| 字段 | 来源 |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` 或 `cron` |
| Session ids    | 子级会话键/id |
| Type           | 通知类型 + 任务标签 |
| Status         | 从运行时结果派生（`success`、`error`、`timeout` 或 `unknown`）——**不是**从模型文本推断 |
| Result content | 最新可见 assistant 文本；若没有，则使用经清理的最新 `tool`/`toolResult` 文本 |
| Follow-up      | 描述何时应回复、何时保持静默的指令 |

终态失败的运行会报告失败状态，而不会重放已捕获的回复文本。超时时，如果子级仅执行到了工具调用阶段，通知可以将该历史压缩成简短的部分进度摘要，而不是重放原始工具输出。

### 统计行

通知负载在末尾包含一行统计信息（即使被包裹也会包含）：

- 运行时长（例如 `runtime 5m12s`）。
- Token 使用量（输入/输出/总量）。
- 若已配置模型定价，则包含预估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和转录路径，以便主智能体通过 `sessions_history` 获取历史记录，或在磁盘上检查文件。

内部元数据仅用于编排；面向用户的回复应以正常助手口吻重写。

### 为什么优先使用 `sessions_history`

`sessions_history` 是更安全的编排路径：

- 会先规范化 assistant 回溯：剥离 thinking 标签；剥离 `<relevant-memories>` / `<relevant_memories>` 脚手架；剥离纯文本工具调用 XML 负载块（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括那些未能正常闭合的截断负载；剥离已降级的工具调用/结果脚手架和历史上下文标记；剥离泄露的模型控制 token（`<|assistant|>`、其他 ASCII `<|...|>`、全角 `<｜...｜>`）；剥离格式错误的 MiniMax 工具调用 XML。
- 类似凭证/token 的文本会被脱敏。
- 长内容块可能会被截断。
- 非常大的历史记录可能会丢弃较早的行，或将超大单行替换为 `[sessions_history omitted: message too large]`。
- 当你需要完整逐字节转录时，回退方案是直接检查磁盘上的原始转录。

## 工具策略

子智能体首先沿用父智能体或目标智能体相同的配置文件和工具策略流水线。之后，OpenClaw 会应用子智能体限制层。

在没有限制性 `tools.profile` 的情况下，子智能体会获得**除会话工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

此处的 `sessions_history` 仍然是一个有边界、经过清理的回溯视图——它不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 的编排子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子级。

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
        // deny 优先生效
        deny: ["gateway", "cron"],
        // 如果设置了 allow，它就会变成仅允许列表（deny 仍然优先生效）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以收窄已经解析出的工具集，但不能**重新加入**已被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。若要让 coding 配置文件下的子智能体使用浏览器自动化，请在配置文件阶段加入 `browser`：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

如果只希望某一个智能体获得浏览器自动化，请使用按智能体配置的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用专用的进程内队列通道：

- **通道名称：** `subagent`
- **并发数：** `agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 存活性与恢复

OpenClaw 不会将缺少 `endedAt` 视为子智能体仍然存活的永久性证据。早于陈旧运行窗口、且未结束的运行，在 `/subagents list`、状态摘要、后代完成门控以及按会话统计的并发检查中，将不再计入活动/待处理状态。

在 Gateway 网关重启后，陈旧且未结束的已恢复运行会被清理，除非其子会话被标记为 `abortedLastRun: true`。这些因重启而中止的子会话仍可通过子智能体孤儿恢复流程进行恢复，该流程会先发送一条合成的恢复消息，然后再清除中止标记。

<Note>
如果子智能体派生因 Gateway 网关 `PAIRING_REQUIRED` / `scope-upgrade` 失败，在编辑配对状态前，请先检查 RPC 调用方。内部 `sessions_spawn` 协调应通过直接 loopback shared-token/password 身份验证，使用 `client.id: "gateway-client"` 和 `client.mode: "backend"` 进行连接；该路径不依赖 CLI 的已配对设备作用域基线。远程调用方、显式 `deviceIdentity`、显式设备 token 路径以及浏览器/node 客户端，仍然需要正常的设备批准才能完成作用域升级。
</Note>

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止由其派生的所有活动子智能体运行，同时级联到嵌套子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联停止其子级。

## 限制

- 子智能体通知回传是**尽力而为**的。如果 Gateway 网关重启，待处理的“通知回传”工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只会注入 `AGENTS.md` + `TOOLS.md`（不包括 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数用例建议使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活动子级数量（默认 `5`，范围 `1–20`）。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [Agent send](/zh-CN/tools/agent-send)
- [后台任务](/zh-CN/automation/tasks)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
