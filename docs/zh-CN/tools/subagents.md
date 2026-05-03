---
read_when:
    - 你想通过智能体执行后台或并行工作
    - 你正在更改 sessions_spawn 或子智能体工具策略
    - 你正在实现或排查线程绑定的子智能体会话
sidebarTitle: Sub-agents
summary: 启动隔离的后台智能体运行，并将结果回告到请求者聊天
title: 子智能体
x-i18n:
    generated_at: "2026-05-03T21:42:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09370a96c3af4752a774aba5db62e38b0afd78bc5e105597d977cb130597daf
    source_path: tools/subagents.md
    workflow: 16
---

子智能体是从现有智能体运行中生成的后台智能体运行。
它们在自己的会话（`agent:<agentId>:subagent:<uuid>`）中运行，
完成后会将结果**告知**回请求方聊天
渠道。每次子智能体运行都会作为
[后台任务](/zh-CN/automation/tasks)进行跟踪。

主要目标：

- 并行处理“研究 / 长任务 / 慢工具”工作，而不阻塞主运行。
- 默认保持子智能体隔离（会话分离 + 可选沙箱隔离）。
- 让工具表面难以误用：子智能体默认**不会**获得会话工具。
- 支持可配置的嵌套深度，用于编排器模式。

<Note>
**成本注意事项：**默认情况下，每个子智能体都有自己的上下文和 token 用量。
对于繁重或重复的任务，请为子智能体设置更便宜的模型，
并让你的主智能体使用质量更高的模型。通过
`agents.defaults.subagents.model` 或按智能体覆盖项进行配置。当子级
    确实需要请求方的当前转录时，智能体可以在该次生成中请求
    `context: "fork"`。线程绑定的子智能体会话默认使用
    `context: "fork"`，因为它们会将当前对话分支到一个
    后续线程。
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

使用顶层 `/steer <message>` 来引导当前请求方会话的活跃运行。当目标是子运行时，使用 `/subagents steer <id|#> <message>`。

`/subagents info` 显示运行元数据（状态、时间戳、会话 id、
转录路径、清理）。使用 `sessions_history` 获取有界、
经过安全过滤的回忆视图；当你需要原始完整转录时，
检查磁盘上的转录路径。

### 线程绑定控制

这些命令适用于支持持久线程绑定的渠道。
请参见下方的[支持线程的渠道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成行为

`/subagents spawn` 作为用户命令（不是内部中继）启动一个后台子智能体，
并在运行完成时向请求方聊天发送一条最终完成更新。

<AccordionGroup>
  <Accordion title="非阻塞、基于推送的完成">
    - 生成命令是非阻塞的；它会立即返回一个运行 id。
    - 完成时，子智能体会向请求方聊天渠道告知一条摘要/结果消息。
    - 完成是基于推送的。生成后，**不要**为了等待它结束而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在调试或干预时按需检查状态。
    - 完成时，OpenClaw 会尽力关闭该子智能体会话打开并跟踪的浏览器标签页/进程，然后继续执行告知清理流程。

  </Accordion>
  <Accordion title="手动生成交付韧性">
    - OpenClaw 首先尝试使用稳定幂等键进行直接 `agent` 交付。
    - 如果直接交付失败，它会回退到队列路由。
    - 如果队列路由仍然不可用，告知会先用短指数退避重试，然后才最终放弃。
    - 完成交付会保留已解析的请求方路由：可用时，线程绑定或对话绑定的完成路由优先；如果完成来源只提供渠道，OpenClaw 会从请求方会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）补齐缺失的目标/账户，这样直接交付仍可工作。

  </Accordion>
  <Accordion title="完成交接元数据">
    发送给请求方会话的完成交接是运行时生成的
    内部上下文（不是用户撰写的文本），包含：

    - `Result` — 最新可见的 `assistant` 回复文本；否则为经过清理的最新工具/toolResult 文本。终止失败的运行不会复用已捕获的回复文本。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 紧凑的运行时/token 统计信息。
    - 一条交付指令，告诉请求方智能体用普通助手语气重写（而不是转发原始内部元数据）。

  </Accordion>
  <Accordion title="模式和 ACP 运行时">
    - `--model` 和 `--thinking` 会覆盖该特定运行的默认值。
    - 使用 `info`/`log` 在完成后检查详情和输出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久线程绑定会话，请使用 `sessions_spawn`，并设置 `thread: true` 和 `mode: "session"`。
    - 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode，或显式的 Codex ACP/acpx），当工具声明该运行时时，使用 `sessions_spawn` 并设置 `runtime: "acp"`。调试完成或智能体到智能体循环时，请参见 [ACP 交付模型](/zh-CN/tools/acp-agents#delivery-model)。启用 `codex` 插件时，除非用户明确要求 ACP/acpx，否则 Codex 聊天/线程控制应优先使用 `/codex ...` 而不是 ACP。
    - 在 ACP 启用、请求方未被沙箱隔离，并且已加载 `acpx` 等后端插件之前，OpenClaw 会隐藏 `runtime: "acp"`。`runtime: "acp"` 需要一个外部 ACP harness id，或者一个 `runtime.type="acp"` 的 `agents.list[]` 条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认子智能体运行时。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子智能体会以隔离状态启动，除非调用方明确要求 fork
当前转录。

| 模式       | 使用场景                                                                                                                         | 行为                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、独立实现、慢工具工作，或任何可以在任务文本中简要说明的事项                           | 创建干净的子转录。这是默认值，并且会降低 token 用量。  |
| `fork`     | 依赖当前对话、先前工具结果，或请求方转录中已有细微指令的工作 | 在子级启动前，将请求方转录分支到子会话中。 |

谨慎使用 `fork`。它用于上下文敏感的委派，
而不是替代清晰任务提示的方式。

## 工具：`sessions_spawn`

在全局 `subagent` lane 上以 `deliver: false` 启动子智能体运行，
随后运行告知步骤，并将告知回复发布到请求方
聊天渠道。

可用性取决于调用方的有效工具策略。`coding` 和
`full` 配置文件默认公开 `sessions_spawn`。`messaging` 配置文件
不会公开；对于应委派工作的智能体，请添加 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`，或使用 `tools.profile: "coding"`。
渠道/群组、提供商、沙箱，以及按智能体允许/拒绝策略仍可
在配置文件阶段后移除该工具。从同一个
会话使用 `/tools` 来确认有效工具列表。

**默认值：**

- **模型：**继承调用方，除非你设置 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式的 `sessions_spawn.model` 仍然优先。
- **Thinking：**继承调用方，除非你设置 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式的 `sessions_spawn.thinking` 仍然优先。
- **运行超时：**如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

### 工具参数

<ParamField path="task" type="string" required>
  子智能体的任务描述。
</ParamField>
<ParamField path="label" type="string">
  可选的人类可读标签。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允许时，在另一个智能体 id 下生成。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅用于外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或明确请求的 Codex ACP/acpx），以及 `runtime.type` 为 `acp` 的 `agents.list[]` 条目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  仅限 ACP。`runtime: "acp"` 时恢复现有 ACP harness 会话；对原生子智能体生成会被忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  仅限 ACP。`runtime: "acp"` 时将 ACP 运行输出流式传输到父会话；原生子智能体生成时省略。
</ParamField>
<ParamField path="model" type="string">
  覆盖子智能体模型。无效值会被跳过，子智能体将使用默认模型运行，并在工具结果中给出警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子智能体运行的 thinking 级别。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  设置时默认使用 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`。设置后，子智能体运行会在 N 秒后中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  当为 `true` 时，为该子智能体会话请求渠道线程绑定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认值变为 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 会在告知后立即归档（仍通过重命名保留转录）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 会拒绝生成，除非目标子运行时已被沙箱隔离。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 会将请求方的当前转录分支到子会话。仅限原生子智能体。线程绑定生成默认使用 `fork`；非线程生成默认使用 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受渠道交付参数（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。交付时，请从生成的运行使用
`message`/`sessions_send`。
</Warning>

## 线程绑定会话

为某个渠道启用线程绑定后，子智能体可以持续绑定到
某个线程，使该线程中的后续用户消息继续路由到
同一个子智能体会话。

### 支持线程的渠道

**Discord** 目前是唯一受支持的渠道。它支持
持久线程绑定子智能体会话（`sessions_spawn` 并设置
`thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`），以及适配器键
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours` 和
`channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="生成">
    使用 `sessions_spawn` 并设置 `thread: true`（以及可选的 `mode: "session"`）。
  </Step>
  <Step title="绑定">
    OpenClaw 在活跃渠道中创建一个线程，或将线程绑定到该会话目标。
  </Step>
  <Step title="路由后续消息">
    该线程中的回复和后续消息会路由到绑定的会话。
  </Step>
  <Step title="检查超时">
    使用 `/session idle` 检查/更新非活动自动取消聚焦，并
    使用 `/session max-age` 控制硬上限。
  </Step>
  <Step title="分离">
    使用 `/unfocus` 手动分离。
  </Step>
</Steps>

### 手动控制

| 命令               | 效果                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | 将当前线程（或创建一个线程）绑定到子智能体/会话目标                  |
| `/unfocus`         | 移除当前已绑定线程的绑定                                             |
| `/agents`          | 列出活跃运行和绑定状态（`thread:<id>` 或 `unbound`）                 |
| `/session idle`    | 查看/更新空闲自动取消聚焦（仅限已聚焦的绑定线程）                   |
| `/session max-age` | 查看/更新硬性上限（仅限已聚焦的绑定线程）                           |

### 配置开关

- **全局默认值：**`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **渠道覆盖和生成时自动绑定键**特定于适配器。参见上方的[支持线程的渠道](#thread-supporting-channels)。

有关当前适配器的详细信息，请参见[配置参考](/zh-CN/gateway/configuration-reference)和
[斜杠命令](/zh-CN/tools/slash-commands)。

### 允许列表

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可通过显式 `agentId` 指定为目标的智能体 ID 列表（`["*"]` 允许任意智能体）。默认值：仅请求方智能体。如果你设置了列表，并且仍希望请求方通过 `agentId` 生成自身，请将请求方 ID 包含在列表中。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求方智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体允许列表。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置档案）。单智能体覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果请求方会话处于沙箱隔离状态，`sessions_spawn` 会拒绝那些将以非沙箱隔离方式运行的目标。

### 设备发现

使用 `agents_list` 查看当前允许 `sessions_spawn` 指向哪些智能体 ID。响应包含每个列出智能体的有效模型和嵌入式运行时元数据，因此调用方可以区分 Pi、Codex 应用服务器以及其他已配置的原生运行时。

### 自动归档

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认 `60`）。
- 归档使用 `sessions.delete`，并将转录重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在 announce 后立即归档（仍通过重命名保留转录）。
- 自动归档是尽力而为；如果 Gateway 网关重启，挂起的计时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会一直保留到自动归档。
- 自动归档同样适用于深度 1 和深度 2 会话。
- 浏览器清理与归档清理分开：即使保留转录/会话记录，也会在运行结束时尽力关闭已跟踪的浏览器标签页/进程。

## 嵌套子智能体

默认情况下，子智能体不能生成自己的子智能体（`maxSpawnDepth: 1`）。设置 `maxSpawnDepth: 2` 可启用一层嵌套，即**编排器模式**：主智能体 → 编排器子智能体 → 工作子子智能体。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形态                                   | 角色                                          | 能否生成？                   |
| ---- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0    | `agent:<id>:main`                            | 主智能体                                      | 始终可以                     |
| 1    | `agent:<id>:subagent:<uuid>`                 | 子智能体（允许深度 2 时为编排器）             | 仅当 `maxSpawnDepth >= 2`    |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作者）                      | 永远不能                     |

### Announce 链

结果沿链向上流动：

1. 深度 2 工作者完成 → announce 给其父级（深度 1 编排器）。
2. 深度 1 编排器接收 announce，综合结果并完成 → announce 给主智能体。
3. 主智能体接收 announce 并交付给用户。

每一级只能看到其直接子级发来的 announce。

<Note>
**操作指南：**启动一次子任务，然后等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` 睡眠命令构建轮询循环。`sessions_list` 和 `/subagents list` 让子会话关系专注于实时工作：实时子级保持附加，已结束子级会在短暂的近期窗口中保持可见，而陈旧的仅存储子级链接会在其新鲜度窗口后被忽略。这可以防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后重新唤起幽灵子级。如果子级完成事件在你已经发送最终回答后到达，正确的后续响应是精确的静默令牌 `NO_REPLY` / `no_reply`。
</Note>

### 按深度划分的工具策略

- 角色和控制范围会在生成时写入会话元数据。这可以防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）：**获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话/系统工具仍被拒绝。
- **深度 1（叶子，当 `maxSpawnDepth == 1` 时）：**没有会话工具（当前默认行为）。
- **深度 2（叶子工作者）：**没有会话工具，`sessions_spawn` 在深度 2 始终被拒绝。不能继续生成子级。

### 单智能体生成限制

每个智能体会话（任意深度）同一时间最多可以有 `maxChildrenPerAgent` 个活跃子级（默认 `5`）。这可以防止单个编排器失控扇出。

### 级联停止

停止深度 1 编排器会自动停止其所有深度 2 子级：

- 主聊天中的 `/stop` 会停止所有深度 1 智能体，并级联到它们的深度 2 子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联到其子级。
- `/subagents kill all` 会停止请求方的所有子智能体并级联。

## 认证

子智能体认证按**智能体 ID**解析，而不是按会话类型解析：

- 子智能体会话键是 `agent:<agentId>:subagent:<uuid>`。
- 认证存储从该智能体的 `agentDir` 加载。
- 主智能体的认证配置档案会作为**回退**合并进来；发生冲突时，智能体配置档案会覆盖主配置档案。

合并是追加式的，因此主配置档案始终可作为回退使用。尚不支持每个智能体完全隔离的认证。

## Announce

子智能体通过 announce 步骤回报：

- announce 步骤在子智能体会话内运行（不是请求方会话）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新助手文本是精确的静默令牌 `NO_REPLY` / `no_reply`，即使之前存在可见进度，announce 输出也会被抑制。

交付取决于请求方深度：

- 顶层请求方会话使用带外部交付的后续 `agent` 调用（`deliver=true`）。
- 嵌套请求方子智能体会话接收内部后续注入（`deliver=false`），以便编排器在会话内综合子级结果。
- 如果嵌套请求方子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求方。

对于顶层请求方会话，完成模式的直接交付会先解析任何已绑定的对话/线程路由和钩子覆盖，然后从请求方会话的已存储路由中填充缺失的渠道目标字段。这样即使完成来源只标识了渠道，也能让完成内容进入正确的聊天/话题。

构建嵌套完成 findings 时，子级完成聚合会限定在当前请求方运行范围内，防止陈旧的上一次运行子级输出泄漏到当前 announce 中。当渠道适配器可用时，announce 回复会保留线程/话题路由。

### Announce 上下文

Announce 上下文会规范化为稳定的内部事件块：

| 字段         | 来源                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| 来源         | `subagent` 或 `cron`                                                                                          |
| 会话 ID      | 子会话键/ID                                                                                                   |
| 类型         | Announce 类型 + 任务标签                                                                                      |
| Status       | 从运行时结果派生（`success`、`error`、`timeout` 或 `unknown`），**不是**从模型文本推断                       |
| 结果内容     | 最新可见助手文本；否则为经过净化的最新工具/toolResult 文本                                                   |
| 后续         | 描述何时回复与何时保持静默的指令                                                                              |

终端失败运行会报告失败状态，而不会重放捕获的回复文本。超时时，如果子级只执行到了工具调用，announce 可以将该历史折叠成简短的部分进度摘要，而不是重放原始工具输出。

### 统计行

Announce 载荷会在末尾包含统计行（即使被换行包裹）：

- 运行时长（例如 `runtime 5m12s`）。
- 令牌使用量（输入/输出/总计）。
- 配置了模型定价时的估算成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和转录路径，以便主智能体可以通过 `sessions_history` 获取历史记录，或检查磁盘上的文件。

内部元数据仅用于编排；面向用户的回复应改写为正常的助手语气。

### 为什么优先使用 `sessions_history`

`sessions_history` 是更安全的编排路径：

- 助手回忆会先被规范化：移除 thinking 标签；移除 `<relevant-memories>` / `<relevant_memories>` 脚手架；移除纯文本工具调用 XML 载荷块（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括从未正常闭合的截断载荷；移除降级的工具调用/结果脚手架和历史上下文标记；移除泄漏的模型控制令牌（`<|assistant|>`、其他 ASCII `<|...|>`、全角 `<｜...｜>`）；移除格式错误的 MiniMax 工具调用 XML。
- 凭证/类似令牌的文本会被遮盖。
- 长块可能会被截断。
- 非常大的历史记录可能会丢弃较旧行，或用 `[sessions_history omitted: message too large]` 替换过大的行。
- 当你需要完整逐字节转录时，原始磁盘转录检查是回退方案。

## 工具策略

子智能体首先使用与父智能体或目标智能体相同的配置档案和工具策略流水线。之后，OpenClaw 会应用子智能体限制层。

在没有限制性 `tools.profile` 的情况下，子智能体会获得**除会话工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 仍是有界且经过净化的回忆视图，不是原始转录转储。

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以收窄已经解析出的工具集，但不能**加回**已被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。若要让 coding-profile 子智能体使用浏览器自动化，请在 profile 阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当只有一个智能体应获得浏览器自动化能力时，使用每智能体的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用专用的进程内队列通道：

- **通道名称：** `subagent`
- **并发数：** `agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 存活性与恢复

OpenClaw 不会把缺少 `endedAt` 视为子智能体仍然存活的永久证明。早于 stale-run 窗口且未结束的运行，在 `/subagents list`、Status 摘要、后代完成门控以及每会话并发检查中不再计为 active/pending。

Gateway 网关重启后，过期且未结束的已恢复运行会被清理，除非其子会话标记为 `abortedLastRun: true`。这些因重启而中止的子会话仍可通过子智能体孤儿恢复流程恢复，该流程会先发送一条合成的恢复消息，然后清除中止标记。

自动重启恢复按子会话设有边界。如果同一个子智能体子会话在 rapid re-wedge 窗口内反复被接受用于孤儿恢复，OpenClaw 会在该会话上持久化一个恢复墓碑，并在后续重启时停止自动恢复它。运行 `openclaw tasks maintenance --apply` 来协调任务记录，或运行 `openclaw doctor --fix` 来清除墓碑会话上的过期中止恢复标志。

<Note>
如果子智能体生成失败并出现 Gateway 网关 `PAIRING_REQUIRED` / `scope-upgrade`，请先检查 RPC 调用方，再编辑配对状态。内部 `sessions_spawn` 协调应通过 direct loopback 共享令牌/密码认证，以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 连接；该路径不依赖 CLI 的已配对设备 scope 基线。远程调用方、显式 `deviceIdentity`、显式设备令牌路径以及 browser/node 客户端仍需要正常设备批准才能进行 scope 升级。
</Note>

## 停止

- 在请求方聊天中发送 `/stop` 会中止请求方会话，并停止从该会话生成的任何活跃子智能体运行，同时级联到嵌套子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联到其子级。

## 限制

- 子智能体通知是**尽力而为**。如果 Gateway 网关重启，待处理的 “announce back” 工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md` + `TOOLS.md`（不含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数用例建议使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活跃子级数量（默认 `5`，范围 `1–20`）。

## 相关

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [智能体发送](/zh-CN/tools/agent-send)
- [后台任务](/zh-CN/automation/tasks)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
