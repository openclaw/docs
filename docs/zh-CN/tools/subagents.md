---
read_when:
    - 你想通过智能体进行后台/并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查线程绑定的子智能体会话
summary: 子智能体：生成隔离的智能体运行，并将结果回报到请求者聊天中
title: 子智能体
x-i18n:
    generated_at: "2026-04-25T04:18:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5884e3729fb9a752b979e581d23c785921a039052478d05129c035a139e647e
    source_path: tools/subagents.md
    workflow: 15
---

子智能体是从现有智能体运行中生成的后台智能体运行。它们在自己的会话中运行（`agent:<agentId>:subagent:<uuid>`），并且在完成时，会将其结果**回报**到请求者聊天渠道。每个子智能体运行都会被跟踪为一个[后台任务](/zh-CN/automation/tasks)。

## 斜杠命令

使用 `/subagents` 可检查或控制**当前会话**的子智能体运行：

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

线程绑定控制：

这些命令适用于支持持久线程绑定的渠道。请参阅下方的**支持线程的渠道**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 会显示运行元数据（状态、时间戳、会话 id、转录路径、清理）。
使用 `sessions_history` 可获取有边界且经过安全过滤的回顾视图；当你需要原始完整转录时，请检查磁盘上的
转录路径。

### 生成行为

`/subagents spawn` 会以用户命令而非内部中继的方式启动一个后台子智能体，并在运行结束时向请求者聊天发送一条最终完成更新。

- 生成命令是非阻塞的；它会立即返回一个运行 id。
- 完成时，子智能体会将一条摘要/结果消息回报到请求者聊天渠道。
- 完成传递基于推送。生成后，不要仅为了等待其完成而循环轮询 `/subagents list`、
  `sessions_list` 或 `sessions_history`；仅在调试或干预时按需检查状态。
- 完成时，OpenClaw 会尽最大努力在回报清理流程继续前，关闭该子智能体会话打开并被跟踪的浏览器标签页/进程。
- 对于手动生成，传递具有弹性：
  - OpenClaw 会先使用稳定的幂等键尝试直接 `agent` 传递。
  - 如果直接传递失败，则回退到队列路由。
  - 如果队列路由仍不可用，则回报会通过短时间指数退避重试，之后才最终放弃。
- 完成传递会保留已解析的请求者路由：
  - 可用时，线程绑定或会话绑定的完成路由优先
  - 如果完成来源仅提供一个渠道，OpenClaw 会从请求者会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）中补齐缺失的 target/account，以便直接传递仍然可用
- 向请求者会话交接完成结果时，会使用运行时生成的内部上下文（不是用户撰写的文本），其中包括：
  - `Result`（最新可见的 `assistant` 回复文本；否则为经过清理的最新 `tool`/`toolResult` 文本；终态失败的运行不会重用已捕获的回复文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 紧凑的运行时/令牌统计
  - 一条传递指令，告诉请求者智能体以正常 assistant 语气重写（而不是转发原始内部元数据）
- `--model` 和 `--thinking` 会覆盖该特定运行的默认值。
- 完成后，使用 `info`/`log` 查看详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定会话，请使用 `sessions_spawn` 并设置 `thread: true` 和 `mode: "session"`。
- 对于 ACP harness 会话（Codex、Claude Code、Gemini CLI），请使用 `sessions_spawn` 并设置 `runtime: "acp"`，并参阅 [ACP Agents](/zh-CN/tools/acp-agents)，尤其是在调试完成传递或智能体到智能体循环时，参阅 [ACP delivery model](/zh-CN/tools/acp-agents#delivery-model)。

主要目标：

- 并行处理“研究 / 长任务 / 慢工具”工作，而不阻塞主运行。
- 默认保持子智能体隔离（会话分离 + 可选沙箱隔离）。
- 保持工具表面不易被误用：默认情况下，子智能体**不会**获得 session 工具。
- 支持可配置的嵌套深度，以实现编排器模式。

成本说明：默认情况下，每个子智能体都有其**自己的**上下文和令牌使用量。对于高成本或
重复性任务，请为子智能体设置更便宜的模型，并让你的主智能体继续使用质量更高的模型。你可以通过 `agents.defaults.subagents.model` 或按智能体
覆盖来配置这一点。当子级确实需要请求者当前转录时，智能体可以在该次生成时请求
`context: "fork"`。

## 上下文模式

除非调用方明确请求分叉当前
转录，否则原生子智能体会以隔离方式启动。

| 模式       | 适用场景                                                                                                                         | 行为                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、独立实现、慢工具工作，或任何可以在任务文本中简要说明的内容                           | 创建一个干净的子级转录。这是默认值，并可保持较低的令牌使用量。  |
| `fork`     | 依赖当前对话、先前工具结果，或请求者转录中已存在的细致指令的工作 | 在子级启动前，将请求者转录分支到子级会话中。 |

请谨慎使用 `fork`。它用于对上下文敏感的委派，而不是
替代编写清晰的任务提示。

## 工具

使用 `sessions_spawn`：

- 启动一个子智能体运行（`deliver: false`，全局并发通道：`subagent`）
- 然后执行一个回报步骤，并将回报回复发布到请求者聊天渠道
- 默认模型：继承调用方，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式的 `sessions_spawn.model` 仍然优先。
- 默认 thinking：继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式的 `sessions_spawn.thinking` 仍然优先。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

工具参数：

- `task`（必填）
- `label?`（可选）
- `agentId?`（可选；如果允许，可在另一个智能体 id 下生成）
- `model?`（可选；覆盖子智能体模型；无效值会被跳过，子智能体将使用默认模型运行，并在工具结果中给出警告）
- `thinking?`（可选；覆盖子智能体运行的 thinking 级别）
- `runTimeoutSeconds?`（已设置时默认为 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`；设置后，子智能体运行会在 N 秒后中止）
- `thread?`（默认为 `false`；为 `true` 时，请求为该子智能体会话启用渠道线程绑定）
- `mode?`（`run|session`）
  - 默认值为 `run`
  - 如果 `thread: true` 且省略 `mode`，默认值变为 `session`
  - `mode: "session"` 要求 `thread: true`
- `cleanup?`（`delete|keep`，默认为 `keep`）
- `sandbox?`（`inherit|require`，默认为 `inherit`；`require` 会在目标子级运行时未处于沙箱隔离时拒绝生成）
- `context?`（`isolated|fork`，默认为 `isolated`；仅适用于原生子智能体）
  - `isolated` 会创建一个干净的子级转录，这是默认值。
  - `fork` 会将请求者当前转录分支到子级会话中，使子级以相同的对话上下文开始。
  - 仅当子级需要当前转录时才使用 `fork`。对于范围明确的工作，请省略 `context`。
- `sessions_spawn` **不**接受渠道传递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。对于传递，请从已生成的运行中使用 `message`/`sessions_send`。

## 线程绑定会话

当某个渠道启用了线程绑定时，子智能体可以持续绑定到一个线程，以便该线程中的后续用户消息继续路由到同一个子智能体会话。

### 支持线程的渠道

- Discord（当前唯一支持的渠道）：支持持久的线程绑定子智能体会话（`sessions_spawn` 且 `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用 `sessions_spawn` 并设置 `thread: true`（以及可选的 `mode: "session"`）进行生成。
2. OpenClaw 在当前渠道中创建线程或将线程绑定到该会话目标。
3. 该线程中的回复和后续消息会路由到绑定的会话。
4. 使用 `/session idle` 检查/更新无活动自动取消焦点设置，并使用 `/session max-age` 控制硬性上限。
5. 使用 `/unfocus` 手动解除绑定。

手动控制：

- `/focus <target>` 将当前线程（或创建一个线程）绑定到子智能体/会话目标。
- `/unfocus` 移除当前已绑定线程的绑定。
- `/agents` 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅适用于已聚焦的绑定线程。

配置开关：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- 渠道覆盖和生成自动绑定键是适配器特定的。请参阅上方的**支持线程的渠道**。

有关当前适配器详细信息，请参阅[配置参考](/zh-CN/gateway/configuration-reference)和[斜杠命令](/zh-CN/tools/slash-commands)。

允许列表：

- `agents.list[].subagents.allowAgents`：可通过 `agentId` 定位的智能体 id 列表（`["*"]` 表示允许任意）。默认值：仅请求者智能体。
- `agents.defaults.subagents.allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体允许列表。
- 沙箱继承保护：如果请求者会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些将以非沙箱隔离方式运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式配置文件选择）。默认值：false。

发现：

- 使用 `agents_list` 查看当前哪些智能体 id 允许用于 `sessions_spawn`。

自动归档：

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 之后自动归档（默认值：60）。
- 归档使用 `sessions.delete`，并将转录重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在回报后立即归档（仍会通过重命名保留转录）。
- 自动归档采用尽力而为策略；如果 Gateway 网关重启，待处理计时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会一直保留，直到自动归档。
- 自动归档同样适用于深度 1 和深度 2 的会话。
- 浏览器清理与归档清理是分开的：运行结束时，会尽最大努力关闭已跟踪的浏览器标签页/进程，即使保留了转录/会话记录也是如此。

## 嵌套子智能体

默认情况下，子智能体不能生成它们自己的子智能体（`maxSpawnDepth: 1`）。你可以通过设置 `maxSpawnDepth: 2` 启用一级嵌套，这允许使用**编排器模式**：主智能体 → 编排器子智能体 → 工作子子智能体。

### 如何启用

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体生成子级（默认值：1）
        maxChildrenPerAgent: 5, // 每个智能体会话的最大活动子级数量（默认值：5）
        maxConcurrent: 8, // 全局并发通道上限（默认值：8）
        runTimeoutSeconds: 900, // 省略时 sessions_spawn 的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形状                            | 角色                                          | 可继续生成？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体                                    | 始终可以                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（在允许深度 2 时为编排器） | 仅当 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作节点）                   | 永不可以                        |

### 回报链

结果会沿链路逐级返回：

1. 深度 2 工作节点完成 → 向其父级（深度 1 编排器）回报
2. 深度 1 编排器收到回报，综合结果，完成 → 向主智能体回报
3. 主智能体收到回报并传递给用户

每一层只能看到其直接子级的回报。

操作指南：

- 启动一次子级工作后，等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或
  `exec` sleep 命令构建轮询循环。
- 如果某个子级完成事件在你已经发送最终答案之后才到达，
  正确的后续处理是精确的静默令牌 `NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制范围会在生成时写入会话元数据。这样可以防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）**：获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他 session/system 工具仍然被拒绝。
- **深度 1（叶子节点，当 `maxSpawnDepth == 1` 时）**：没有 session 工具（当前默认行为）。
- **深度 2（叶子工作节点）**：没有 session 工具 —— 在深度 2，`sessions_spawn` 始终被拒绝。不能继续生成更多子级。

### 每个智能体的生成上限

每个智能体会话（任意深度）在同一时间最多只能有 `maxChildrenPerAgent`（默认值：5）个活动子级。这可以防止单个编排器失控式扩散。

### 级联停止

停止一个深度 1 编排器会自动停止其所有深度 2 子级：

- 在主聊天中使用 `/stop` 会停止所有深度 1 智能体，并级联停止它们的深度 2 子级。
- `/subagents kill <id>` 会停止某个特定子智能体，并级联停止其子级。
- `/subagents kill all` 会停止该请求者的所有子智能体，并级联停止。

## 身份验证

子智能体身份验证按**智能体 id**解析，而不是按会话类型：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 身份验证存储从该智能体的 `agentDir` 加载。
- 主智能体的身份验证配置文件会作为**回退**合并进来；发生冲突时，智能体配置文件会覆盖主配置文件。

注意：该合并是增量式的，因此主配置文件始终可作为回退使用。每个智能体完全隔离的身份验证目前尚不支持。

## 回报

子智能体通过一个回报步骤进行报告：

- 回报步骤在子智能体会话内部运行（而不是请求者会话）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新 assistant 文本是精确的静默令牌 `NO_REPLY` / `no_reply`，
  即使之前存在可见进度，也会抑制回报输出。
- 否则，传递取决于请求者深度：
  - 顶层请求者会话使用带外部传递（`deliver=true`）的后续 `agent` 调用
  - 嵌套的请求者子智能体会话接收内部后续注入（`deliver=false`），以便编排器在会话内综合子级结果
  - 如果嵌套的请求者子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求者
- 对于顶层请求者会话，完成模式的直接传递会首先解析任何已绑定的会话/线程路由和 hook 覆盖，然后从请求者会话存储的路由中补齐缺失的渠道目标字段。这样即使完成来源仅标识了渠道，也能将完成结果保留在正确的聊天/主题中。
- 在构建嵌套完成结果时，子级完成聚合会限定在当前请求者运行范围内，从而防止之前运行的过期子级输出泄漏到当前回报中。
- 在渠道适配器可用时，回报回复会保留线程/主题路由。
- 回报上下文会被规范化为一个稳定的内部事件块：
  - 来源（`subagent` 或 `cron`）
  - 子级会话键/id
  - 回报类型 + 任务标签
  - 从运行时结果派生的状态行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最新可见 assistant 文本中选取的结果内容；否则为清理后的最新 `tool`/`toolResult` 文本；终态失败的运行会报告失败状态，而不会重放已捕获的回复文本
  - 一条后续指令，用于描述何时回复、何时保持静默
- `Status` 不是从模型输出推断的；它来自运行时结果信号。
- 超时时，如果子级仅执行到了工具调用，回报可以将该历史压缩为简短的部分进度摘要，而不是重放原始工具输出。

回报负载在末尾包含一行统计信息（即使已包装）：

- 运行时长（例如 `runtime 5m12s`）
- 令牌使用量（输入/输出/总计）
- 当配置了模型定价时的预估成本（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId` 和转录路径（这样主智能体可以通过 `sessions_history` 获取历史记录，或在磁盘上检查该文件）
- 内部元数据仅用于编排；面向用户的回复应以正常 assistant 语气重写。

`sessions_history` 是更安全的编排路径：

- assistant 回顾会先进行规范化：
  - 删除 thinking 标签
  - 删除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 删除纯文本工具调用 XML 负载块，如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>`，包括那些从未正常闭合的截断
    负载
  - 删除降级的工具调用/结果脚手架和历史上下文标记
  - 删除泄露的模型控制令牌，如 `<|assistant|>`、其他 ASCII
    `<|...|>` 令牌，以及全角 `<｜...｜>` 变体
  - 删除格式错误的 MiniMax 工具调用 XML
- 类似凭证/令牌的文本会被脱敏
- 长内容块可能会被截断
- 对于非常大的历史记录，可能会丢弃较早的行，或将超大的某一行替换为
  `[sessions_history omitted: message too large]`
- 当你需要完整逐字节转录时，可回退到检查磁盘上的原始转录文件

## 工具策略（子智能体工具）

默认情况下，子智能体获得**除 session 工具**和 system 工具外的**所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 仍然是有边界、经过清理的回顾视图；它不是
原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子级。

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
        // 如果设置了 allow，则变为仅允许 allow 中的工具（deny 仍优先生效）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 并发

子智能体使用专用的进程内队列通道：

- 通道名称：`subagent`
- 并发数：`agents.defaults.subagents.maxConcurrent`（默认值 `8`）

## 存活性与恢复

OpenClaw 不会将缺少 `endedAt` 永久视为子智能体
仍然存活的证明。超过陈旧运行时间窗口、但未结束的运行将不再计入
`/subagents list`、状态摘要、后代完成门控以及按会话并发检查中的
活动/待处理运行。

在 Gateway 网关重启后，陈旧且未结束的已恢复运行会被清理，除非其
子级会话被标记为 `abortedLastRun: true`。这些因重启而中止的子级
会话仍可通过子智能体孤儿恢复流程进行恢复，该流程会先发送一条合成恢复消息，
然后再清除该中止标记。

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止从其生成的任何活动子智能体运行，同时级联停止嵌套子级。
- `/subagents kill <id>` 会停止某个特定子智能体，并级联停止其子级。

## 限制

- 子智能体回报是**尽力而为**的。如果 Gateway 网关重启，待处理的“回报结果”工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文仅注入 `AGENTS.md` + `TOOLS.md`（不包括 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。对于大多数使用场景，推荐使用深度 2。
- `maxChildrenPerAgent` 会限制每个会话的活动子级数量（默认值：5，范围：1–20）。

## 相关内容

- [ACP agents](/zh-CN/tools/acp-agents)
- [Multi-agent sandbox tools](/zh-CN/tools/multi-agent-sandbox-tools)
- [Agent send](/zh-CN/tools/agent-send)
