---
read_when:
    - 你想通过智能体进行后台/并行工作时
    - 你正在更改 `sessions_spawn` 或 sub-agent 工具策略时
    - 你正在实现或排查绑定到线程的 subagent 会话时
summary: Sub-agents：生成隔离的智能体运行，并将结果回报到请求者聊天
title: Sub-Agents
x-i18n:
    generated_at: "2026-04-05T10:13:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9df7cc35a3069ce4eb9c92a95df3ce5365a00a3fae92ff73def75461b58fec3f
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-agents

Sub-agents 是从现有智能体运行中生成的后台智能体运行。它们在自己的会话中运行（`agent:<agentId>:subagent:<uuid>`），并在完成后**将**其结果**回报**到请求者聊天渠道。每个 sub-agent 运行都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

## 斜杠命令

使用 `/subagents` 检查或控制**当前会话**的 sub-agent 运行：

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

线程绑定控制：

这些命令适用于支持持久线程绑定的渠道。参见下方的**支持线程的渠道**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 会显示运行元数据（状态、时间戳、会话 id、转录路径、清理信息）。
使用 `sessions_history` 获取一个有界、经过安全过滤的回忆视图；当你需要原始完整转录时，
请检查磁盘上的转录路径。

### 生成行为

`/subagents spawn` 会以用户命令而非内部中继的方式启动一个后台 sub-agent，并在运行完成时向请求者聊天发送一条最终完成更新。

- spawn 命令是非阻塞的；它会立即返回一个运行 id。
- 完成时，sub-agent 会向请求者聊天渠道回报一条摘要/结果消息。
- 完成通知是基于推送的。生成后，不要只是为了等待其完成而循环轮询 `/subagents list`、
  `sessions_list` 或 `sessions_history`；仅在按需调试或干预时检查状态。
- 完成时，OpenClaw 会尽力关闭该 sub-agent 会话所打开并被跟踪的 browser 标签页/进程，然后再继续回报清理流程。
- 对于手动生成，投递具备弹性：
  - OpenClaw 会先使用稳定的幂等键尝试直接 `agent` 投递。
  - 如果直接投递失败，则回退到队列路由。
  - 如果队列路由仍不可用，则会在最终放弃前以短暂的指数退避重试该回报。
- 完成投递会保留解析后的请求者路由：
  - 如可用，则优先使用线程绑定或会话绑定的完成路由
  - 如果完成来源仅提供渠道，OpenClaw 会从请求者会话已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）中补齐缺失的目标/账号，这样直接投递仍可生效
- 向请求者会话进行的完成交接是运行时生成的内部上下文（不是用户编写的文本），其中包括：
  - `Result`（最新可见的 `assistant` 回复文本；否则为经过净化的最新 tool/toolResult 文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 精简的运行时/token 统计信息
  - 一条投递指令，告诉请求者智能体以正常助手语气改写，而不是转发原始内部元数据
- `--model` 和 `--thinking` 会覆盖该次运行的默认值。
- 使用 `info`/`log` 可在完成后检查详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
- 对于 ACP harness 会话（Codex、Claude Code、Gemini CLI），请使用带有 `runtime: "acp"` 的 `sessions_spawn`，并参见 [ACP Agents](/tools/acp-agents)。

主要目标：

- 将“研究 / 长任务 / 慢工具”类工作并行化，而不阻塞主运行。
- 默认保持 sub-agents 隔离（会话隔离 + 可选沙箱隔离）。
- 让工具表面难以被误用：默认情况下，sub-agents **不会**获得会话工具。
- 支持为编排器模式配置可嵌套深度。

成本说明：每个 sub-agent 都有其**自己的**上下文和 token 用量。对于繁重或重复性
任务，请为 sub-agents 设置一个更便宜的模型，并让主智能体保留较高质量模型。
你可以通过 `agents.defaults.subagents.model` 或按智能体覆盖来配置。

## 工具

使用 `sessions_spawn`：

- 启动一个 sub-agent 运行（`deliver: false`，全局 lane：`subagent`）
- 然后运行一个回报步骤，并将回报回复发布到请求者聊天渠道
- 默认模型：继承调用者，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式的 `sessions_spawn.model` 仍然优先生效。
- 默认 thinking：继承调用者，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式的 `sessions_spawn.thinking` 仍然优先生效。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退为 `0`（无超时）。

工具参数：

- `task`（必需）
- `label?`（可选）
- `agentId?`（可选；如果允许，则在另一个智能体 id 下生成）
- `model?`（可选；覆盖 sub-agent 模型；无效值会被跳过，sub-agent 会使用默认模型运行，并在工具结果中附带警告）
- `thinking?`（可选；覆盖 sub-agent 运行的 thinking 级别）
- `runTimeoutSeconds?`（设置时默认使用 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`；设置后，sub-agent 运行会在 N 秒后中止）
- `thread?`（默认 `false`；为 `true` 时，会为该 sub-agent 会话请求渠道线程绑定）
- `mode?`（`run|session`）
  - 默认为 `run`
  - 如果 `thread: true` 且省略 `mode`，默认值会变为 `session`
  - `mode: "session"` 要求 `thread: true`
- `cleanup?`（`delete|keep`，默认 `keep`）
- `sandbox?`（`inherit|require`，默认 `inherit`；`require` 会在目标子运行时不是沙箱时拒绝生成）
- `sessions_spawn` **不**接受渠道投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需投递，请在生成出的运行中使用 `message`/`sessions_send`。

## 线程绑定会话

当某个渠道启用了线程绑定时，sub-agent 可以保持绑定到某个线程，因此该线程中的后续用户消息会继续路由到同一个 sub-agent 会话。

### 支持线程的渠道

- Discord（当前唯一支持的渠道）：支持持久的线程绑定 subagent 会话（`sessions_spawn` 配合 `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用 `sessions_spawn` 并设置 `thread: true`（以及可选的 `mode: "session"`）来生成。
2. OpenClaw 会在当前活动渠道中为该会话目标创建或绑定一个线程。
3. 该线程中的回复和后续消息会路由到绑定的会话。
4. 使用 `/session idle` 检查/更新非活动自动取消聚焦设置，使用 `/session max-age` 控制硬上限。
5. 使用 `/unfocus` 手动解除绑定。

手动控制：

- `/focus <target>` 将当前线程（或创建一个线程）绑定到某个 sub-agent/会话目标。
- `/unfocus` 移除当前已绑定线程的绑定关系。
- `/agents` 会列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅适用于已聚焦的绑定线程。

配置开关：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- 渠道覆盖和 spawn 自动绑定键是适配器特定的。参见上方的**支持线程的渠道**。

当前适配器详情请参见 [Configuration Reference](/zh-CN/gateway/configuration-reference) 和 [斜杠命令](/zh-CN/tools/slash-commands)。

Allowlist：

- `agents.list[].subagents.allowAgents`：可通过 `agentId` 定向的智能体 id 列表（`["*"]` 表示允许任意）。默认：仅允许请求者智能体。
- `agents.defaults.subagents.allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体 allowlist。
- 沙箱继承保护：如果请求者会话处于沙箱中，`sessions_spawn` 会拒绝那些会以非沙箱方式运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：为 true 时，会阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式 profile 选择）。默认：false。

发现：

- 使用 `agents_list` 查看当前哪些智能体 id 被允许用于 `sessions_spawn`。

自动归档：

- Sub-agent 会话会在 `agents.defaults.subagents.archiveAfterMinutes` 之后自动归档（默认：60）。
- 归档使用 `sessions.delete`，并将转录重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在回报后立即归档（仍会通过重命名保留转录）。
- 自动归档是尽力而为；如果 gateway 重启，待处理定时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会保留直到自动归档。
- 自动归档对 depth-1 和 depth-2 会话同样适用。
- Browser 清理与归档清理分离：运行结束时，即使保留转录/会话记录，也会尽力关闭已跟踪的 browser 标签页/进程。

## 嵌套 Sub-Agents

默认情况下，sub-agents 不能生成它们自己的 sub-agents（`maxSpawnDepth: 1`）。你可以通过设置 `maxSpawnDepth: 2` 来启用一层嵌套，从而允许**编排器模式**：主智能体 → 编排 sub-agent → 工作 sub-sub-agents。

### 如何启用

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许 sub-agents 生成子级（默认：1）
        maxChildrenPerAgent: 5, // 每个智能体会话的活动子级上限（默认：5）
        maxConcurrent: 8, // 全局并发 lane 上限（默认：8）
        runTimeoutSeconds: 900, // 省略时 sessions_spawn 的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形状                                 | 角色                                    | 可以生成？                  |
| ----- | ------------------------------------------ | --------------------------------------- | --------------------------- |
| 0     | `agent:<id>:main`                          | 主智能体                                 | 始终可以                    |
| 1     | `agent:<id>:subagent:<uuid>`               | Sub-agent（在允许 depth 2 时为编排器）   | 仅当 `maxSpawnDepth >= 2`   |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent（叶子工作者）              | 永远不可以                  |

### 回报链

结果会沿链路向上流动：

1. 深度 2 的 worker 完成 → 向其父级（深度 1 编排器）回报
2. 深度 1 编排器接收回报、综合结果、完成 → 向主级回报
3. 主智能体接收回报并向用户投递

每一层只能看到其直接子级的回报。

运维指导：

- 让子级工作启动一次，然后等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或
  `exec` sleep 命令构建轮询循环。
- 如果子级完成事件在你已经发出最终答案之后才到达，
  正确的后续处理是精确的静默令牌 `NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制范围会在生成时写入会话元数据。这可以防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）**：获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话/系统工具仍被拒绝。
- **深度 1（叶子，当 `maxSpawnDepth == 1` 时）**：没有会话工具（当前默认行为）。
- **深度 2（叶子工作者）**：没有会话工具 —— 在深度 2 时始终拒绝 `sessions_spawn`。不能进一步生成子级。

### 每个智能体的生成上限

每个智能体会话（任何深度）同时最多只能有 `maxChildrenPerAgent`（默认：5）个活动子级。这可以防止单个编排器失控式扇出。

### 级联停止

停止一个深度 1 编排器会自动停止其所有深度 2 子级：

- 在主聊天中发送 `/stop` 会停止所有深度 1 智能体，并级联停止它们的深度 2 子级。
- `/subagents kill <id>` 会停止某个特定 sub-agent，并级联停止其子级。
- `/subagents kill all` 会停止该请求者的所有 sub-agents，并进行级联。

## 认证

Sub-agent 认证按**智能体 id**解析，而不是按会话类型：

- Sub-agent 会话键是 `agent:<agentId>:subagent:<uuid>`。
- 认证存储从该智能体的 `agentDir` 加载。
- 主智能体的认证配置文件会作为**回退**合并进来；若发生冲突，则智能体配置文件覆盖主配置文件。

注意：这种合并是增量式的，因此主配置文件始终可作为回退项。当前尚不支持每个智能体完全隔离的认证。

## 回报

Sub-agents 通过回报步骤进行结果上报：

- 回报步骤在 sub-agent 会话内部运行（而不是在请求者会话中）。
- 如果 sub-agent 精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的助手文本是精确的静默令牌 `NO_REPLY` / `no_reply`，
  即使之前存在可见的进度，回报输出也会被抑制。
- 否则投递取决于请求者深度：
  - 顶层请求者会话使用一个带外部投递的后续 `agent` 调用（`deliver=true`）
  - 嵌套的请求者 subagent 会话会接收一个内部后续注入（`deliver=false`），以便编排器在会话内综合子级结果
  - 如果某个嵌套的请求者 subagent 会话已不存在，OpenClaw 会在可能时回退到该会话的请求者
- 对于顶层请求者会话，完成模式的直接投递会首先解析任何绑定的会话/线程路由和 hook 覆盖值，然后从请求者会话已存储的路由中补齐缺失的渠道目标字段。这样即使完成来源仅标识了渠道，也能将完成消息保留在正确的聊天/主题中。
- 在构建嵌套完成发现结果时，子级完成聚合会限定在当前请求者运行范围内，从而防止先前运行中陈旧的子级输出泄露到当前回报中。
- 在渠道适配器可用时，回报回复会保留线程/主题路由。
- 回报上下文会被规范化为稳定的内部事件块：
  - source（`subagent` 或 `cron`）
  - 子会话键/id
  - 回报类型 + 任务标签
  - 从运行时结果推导的状态行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最新可见助手文本中选取的结果内容；否则为经过净化的最新 tool/toolResult 文本
  - 一条后续指令，说明何时回复、何时保持静默
- `Status` 不是从模型输出推断的；它来自运行时结果信号。
- 超时时，如果子级只执行到了工具调用阶段，回报可以将那段历史折叠为简短的部分进度摘要，而不是重放原始工具输出。

回报载荷在末尾包含一行统计信息（即使被包装）：

- 运行时（例如 `runtime 5m12s`）
- Token 用量（input/output/total）
- 当配置了模型定价时的估算成本（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId` 和转录路径（这样主智能体可以通过 `sessions_history` 获取历史，或在磁盘上检查文件）
- 内部元数据仅用于编排；面向用户的回复应以正常助手语气改写。

`sessions_history` 是更安全的编排路径：

- 会先对 assistant 回忆进行规范化：
  - 移除 thinking 标签
  - 移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 移除纯文本工具调用 XML 载荷块，如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>`，包括那些从未正常闭合的截断载荷
  - 移除已降级的工具调用/结果脚手架和历史上下文标记
  - 移除泄露的模型控制令牌，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` 令牌，以及全角 `<｜...｜>` 变体
  - 移除格式错误的 MiniMax 工具调用 XML
- 类似凭证/token 的文本会被脱敏
- 长块可能会被截断
- 非常大的历史可能会丢弃较早的行，或者用
  `[sessions_history omitted: message too large]`
  替换一个过大的行
- 当你需要完整逐字节转录时，回退方案是在磁盘上检查原始转录

## 工具策略（sub-agent 工具）

默认情况下，sub-agents 获得**除会话工具**和系统工具之外的**所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 仍然是一个有界、经过净化的回忆视图；它
不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 的编排型 sub-agents 还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子级。

可通过配置覆盖：

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
        // 如果设置 allow，则变为仅 allow 模式（deny 仍然优先生效）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 并发

Sub-agents 使用一个专用的进程内队列 lane：

- Lane 名称：`subagent`
- 并发数：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止由其生成的任何活动 sub-agent 运行，同时级联到嵌套子级。
- `/subagents kill <id>` 会停止某个特定 sub-agent，并级联到其子级。

## 限制

- Sub-agent 回报是**尽力而为**的。如果 gateway 重启，待处理的“回报给上游”工作会丢失。
- Sub-agents 仍共享同一个 gateway 进程资源；请将 `maxConcurrent` 视为一个安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- Sub-agent 上下文只会注入 `AGENTS.md` + `TOOLS.md`（不包括 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数使用场景推荐深度 2。
- `maxChildrenPerAgent` 限制每个会话的活动子级数量（默认：5，范围：1–20）。
