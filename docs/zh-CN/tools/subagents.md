---
read_when:
    - 你希望通过智能体进行后台/并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查线程绑定的子智能体会话
summary: 子智能体：生成独立的智能体运行，并将结果回报给请求者聊天界面
title: 子智能体
x-i18n:
    generated_at: "2026-04-25T04:42:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e73ae032cb4de08a69069db6384280582b7eec27c033075d8124c97aa9b2447
    source_path: tools/subagents.md
    workflow: 15
---

子智能体是从现有智能体运行中生成的后台智能体运行。它们在各自独立的会话中运行（`agent:<agentId>:subagent:<uuid>`），并在完成时，将其结果**通报**回请求者聊天渠道。每个子智能体运行都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

## 斜杠命令

使用 `/subagents` 来检查或控制**当前会话**的子智能体运行：

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

线程绑定控制：

这些命令适用于支持持久线程绑定的渠道。请参见下面的**支持线程的渠道**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 会显示运行元数据（状态、时间戳、会话 id、转录路径、清理情况）。
使用 `sessions_history` 获取一个有边界且经过安全过滤的回顾视图；当你需要原始完整转录时，请检查磁盘上的转录路径。

### 生成行为

`/subagents spawn` 作为用户命令启动一个后台子智能体，而不是内部中继；当运行完成时，它会向请求者聊天发送一条最终完成更新。

- 生成命令是非阻塞的；它会立即返回一个运行 id。
- 完成时，子智能体会向请求者聊天渠道通报一条摘要/结果消息。
- 完成通知采用推送方式。生成后，不要仅为了等待其完成而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在调试或干预时按需检查状态。
- 完成时，OpenClaw 会尽力在通报清理流程继续之前，关闭该子智能体会话打开并被跟踪的浏览器标签页/进程。
- 对于手动生成，投递具有弹性：
  - OpenClaw 会先使用稳定的幂等键尝试直接 `agent` 投递。
  - 如果直接投递失败，则回退到队列路由。
  - 如果队列路由仍不可用，则在最终放弃前，使用短时指数退避重试通报。
- 完成投递会保留已解析的请求者路由：
  - 在线程绑定或会话绑定的完成路由可用时，优先使用它们
  - 如果完成来源只提供一个渠道，OpenClaw 会从请求者会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）中补齐缺失的 target/account，以便直接投递仍然可用
- 向请求者会话交接完成结果时，使用的是运行时生成的内部上下文（不是用户编写的文本），其中包括：
  - `Result`（最新可见的 `assistant` 回复文本；否则为已清理的最新 `tool`/`toolResult` 文本；终止且失败的运行不会复用已捕获的回复文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 紧凑的运行时/Token 统计信息
  - 一条投递说明，告知请求者智能体用正常的助手语气重写（而不是转发原始内部元数据）
- `--model` 和 `--thinking` 会覆盖该特定运行的默认值。
- 完成后，使用 `info`/`log` 检查详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
- 对于 ACP harness 会话（Codex、Claude Code、Gemini CLI），请使用带有 `runtime: "acp"` 的 `sessions_spawn`，并参见 [ACP Agents](/zh-CN/tools/acp-agents)，尤其是在调试完成通知或智能体到智能体循环时的 [ACP 投递模型](/zh-CN/tools/acp-agents#delivery-model)。

主要目标：

- 并行处理“研究 / 长任务 / 慢工具”工作，而不会阻塞主运行。
- 默认保持子智能体隔离（会话隔离 + 可选沙箱隔离）。
- 让工具接口难以被误用：子智能体默认**不会**获得会话工具。
- 支持可配置的嵌套深度，以实现编排器模式。

成本说明：默认情况下，每个子智能体都有其**自己的**上下文和 Token 用量。对于高负载或重复性任务，请为子智能体设置更便宜的模型，并让你的主智能体保持使用更高质量的模型。你可以通过 `agents.defaults.subagents.model` 或按智能体覆盖进行配置。当子级确实需要请求者当前的转录内容时，智能体可以在该次生成中请求 `context: "fork"`。

## 上下文模式

原生子智能体默认以隔离方式启动，除非调用方明确要求分叉当前转录。

| 模式       | 何时使用                                                                 | 行为                                                                            |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `isolated` | 全新的研究、独立实现、慢工具工作，或任何可以在任务文本中简要说明的内容   | 创建一个干净的子级转录。这是默认值，并且可保持较低的 Token 使用量。             |
| `fork`     | 依赖当前对话、先前工具结果，或请求者转录中已有的细致说明的工作           | 在子级启动前，将请求者转录分支到子会话中。                                      |

请谨慎使用 `fork`。它适用于对上下文敏感的委派，而不是替代清晰任务提示的写法。

## 工具

使用 `sessions_spawn`：

- 启动一个子智能体运行（`deliver: false`，全局 lane：`subagent`）
- 然后执行通报步骤，并将通报回复发布到请求者聊天渠道
- 默认模型：继承调用方，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式设置的 `sessions_spawn.model` 仍然优先。
- 默认 thinking：继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式设置的 `sessions_spawn.thinking` 仍然优先。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退为 `0`（无超时）。

工具参数：

- `task`（必需）
- `label?`（可选）
- `agentId?`（可选；如果允许，可在另一个智能体 id 下生成）
- `model?`（可选；覆盖子智能体模型；无效值会被跳过，子智能体将使用默认模型运行，并在工具结果中给出警告）
- `thinking?`（可选；覆盖子智能体运行的 thinking 级别）
- `runTimeoutSeconds?`（默认为已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`；设置后，子智能体运行会在 N 秒后中止）
- `thread?`（默认为 `false`；当为 `true` 时，请求为该子智能体会话启用渠道线程绑定）
- `mode?`（`run|session`）
  - 默认是 `run`
  - 如果 `thread: true` 且省略 `mode`，默认值变为 `session`
  - `mode: "session"` 要求 `thread: true`
- `cleanup?`（`delete|keep`，默认为 `keep`）
- `sandbox?`（`inherit|require`，默认为 `inherit`；`require` 会在目标子级运行时未启用沙箱隔离时拒绝生成）
- `context?`（`isolated|fork`，默认为 `isolated`；仅限原生子智能体）
  - `isolated` 会创建一个干净的子级转录，并且是默认值。
  - `fork` 会将请求者当前的转录分支到子会话中，使子级以相同的对话上下文启动。
  - 仅当子级需要当前转录时才使用 `fork`。对于范围明确的工作，请省略 `context`。
- `sessions_spawn` **不**接受渠道投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需投递，请从生成的运行中使用 `message`/`sessions_send`。

## 线程绑定会话

当某个渠道启用了线程绑定时，子智能体可以保持绑定到一个线程，从而使该线程中的后续用户消息持续路由到同一个子智能体会话。

### 支持线程的渠道

- Discord（当前唯一支持的渠道）：支持持久的线程绑定子智能体会话（`sessions_spawn` 配合 `thread: true`），手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用带有 `thread: true` 的 `sessions_spawn` 进行生成（并可选使用 `mode: "session"`）。
2. OpenClaw 在当前活动渠道中创建一个线程，或将一个线程绑定到该会话目标。
3. 该线程中的回复和后续消息会路由到绑定的会话。
4. 使用 `/session idle` 检查/更新不活动自动取消聚焦，并使用 `/session max-age` 控制硬性上限。
5. 使用 `/unfocus` 手动解除绑定。

手动控制：

- `/focus <target>` 将当前线程（或创建一个线程）绑定到某个子智能体/会话目标。
- `/unfocus` 移除当前已绑定线程的绑定。
- `/agents` 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅适用于已聚焦的绑定线程。

配置开关：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- 渠道覆盖和生成自动绑定键是适配器特定的。请参见上面的**支持线程的渠道**。

当前适配器详情请参见[配置参考](/zh-CN/gateway/configuration-reference)和[斜杠命令](/zh-CN/tools/slash-commands)。

允许列表：

- `agents.list[].subagents.allowAgents`：可通过 `agentId` 定向的智能体 id 列表（`["*"]` 表示允许任意）。默认值：仅请求者智能体。
- `agents.defaults.subagents.allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时，使用的默认目标智能体允许列表。
- 沙箱继承保护：如果请求者会话是沙箱隔离的，`sessions_spawn` 会拒绝那些会以非沙箱方式运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：当为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。默认值：false。

发现：

- 使用 `agents_list` 查看当前哪些智能体 id 被允许用于 `sessions_spawn`。

自动归档：

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认值：60）。
- 归档使用 `sessions.delete`，并将转录重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在通报后立即归档（仍会通过重命名保留转录）。
- 自动归档是尽力而为的；如果 Gateway 网关重启，待处理计时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会保留直到自动归档。
- 自动归档同样适用于深度 1 和深度 2 的会话。
- 浏览器清理与归档清理是分开的：当运行结束时，即使保留了转录/会话记录，被跟踪的浏览器标签页/进程也会尽力关闭。

## 嵌套子智能体

默认情况下，子智能体不能生成它们自己的子智能体（`maxSpawnDepth: 1`）。你可以通过设置 `maxSpawnDepth: 2` 来启用一级嵌套，这允许**编排器模式**：主智能体 → 编排器子智能体 → 工作子-子智能体。

### 如何启用

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体生成子级（默认值：1）
        maxChildrenPerAgent: 5, // 每个智能体会话的最大活动子级数（默认值：5）
        maxConcurrent: 8, // 全局并发 lane 上限（默认值：8）
        runTimeoutSeconds: 900, // 省略时 sessions_spawn 的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形状                                   | 角色                                          | 可以生成子级？                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ------------------------------ |
| 0     | `agent:<id>:main`                            | 主智能体                                      | 始终可以                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（当允许深度 2 时为编排器）           | 仅当 `maxSpawnDepth >= 2` 时   |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子-子智能体（叶子工作者）                     | 永不                           |

### 通报链

结果会沿链路向上返回：

1. 深度 2 工作者完成 → 向其父级（深度 1 编排器）通报
2. 深度 1 编排器接收通报、综合结果、完成 → 向主智能体通报
3. 主智能体接收通报并投递给用户

每一层只能看到其直接子级的通报。

操作指导：

- 启动一次子级工作后，等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。
- `sessions_list` 和 `/subagents list` 会将子会话关系聚焦在实时工作上：活动中的子级保持附着，已结束的子级会在一个短暂的最近窗口内保持可见，而仅存储中的陈旧子级链接会在其新鲜度窗口过后被忽略。这可以防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后“复活”幽灵子级。
- 如果某个子级完成事件在你已经发送最终答案之后才到达，正确的后续操作是精确的静默令牌 `NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制范围会在生成时写入会话元数据。这可以防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）**：获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话/系统工具仍然被拒绝。
- **深度 1（叶子节点，当 `maxSpawnDepth == 1` 时）**：没有会话工具（当前默认行为）。
- **深度 2（叶子工作者）**：没有会话工具 —— 在深度 2 时，`sessions_spawn` 始终被拒绝。不能再生成更多子级。

### 按智能体划分的生成限制

每个智能体会话（任意深度）同时最多只能拥有 `maxChildrenPerAgent`（默认值：5）个活动子级。这可以防止单个编排器失控式扇出。

### 级联停止

停止一个深度 1 编排器会自动停止其所有深度 2 子级：

- 在主聊天中使用 `/stop` 会停止所有深度 1 智能体，并级联到它们的深度 2 子级。
- `/subagents kill <id>` 会停止指定的子智能体，并级联到其子级。
- `/subagents kill all` 会停止该请求者的所有子智能体，并执行级联停止。

## 认证

子智能体认证按**智能体 id**解析，而不是按会话类型：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 认证存储从该智能体的 `agentDir` 加载。
- 主智能体的认证配置文件会作为**回退**合并进来；发生冲突时，智能体配置文件优先于主配置文件。

注意：该合并是追加式的，因此主配置文件始终可作为回退使用。尚不支持每个智能体完全隔离的认证。

## 通报

子智能体通过通报步骤回报结果：

- 通报步骤在子智能体会话内部运行（而不是请求者会话）。
- 如果子智能体的回复严格等于 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的助手文本是精确的静默令牌 `NO_REPLY` / `no_reply`，即使之前存在可见进度，也会抑制通报输出。
- 否则，投递方式取决于请求者深度：
  - 顶层请求者会话使用带外部投递（`deliver=true`）的后续 `agent` 调用
  - 嵌套的请求者子智能体会话接收内部后续注入（`deliver=false`），以便编排器可以在会话内综合子级结果
  - 如果某个嵌套的请求者子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求者
- 对于顶层请求者会话，完成模式的直接投递会先解析任何已绑定的会话/线程路由和 hook 覆盖，然后从请求者会话的已存储路由中补齐缺失的渠道目标字段。这可以确保即使完成来源只标识了渠道，完成通知仍会到达正确的聊天/主题。
- 在构建嵌套完成结果时，子级完成聚合被限定在当前请求者运行范围内，以防止陈旧的先前运行子级输出泄露到当前通报中。
- 当渠道适配器可用时，通报回复会保留线程/主题路由。
- 通报上下文会被规范化为一个稳定的内部事件块：
  - 来源（`subagent` 或 `cron`）
  - 子级会话键/id
  - 通报类型 + 任务标签
  - 从运行时结果派生的状态行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最新可见助手文本中选取的结果内容；否则使用经过清理的最新 `tool`/`toolResult` 文本；终止且失败的运行会报告失败状态，而不会重放已捕获的回复文本
  - 一条后续说明，描述何时回复、何时保持静默
- `Status` 不是从模型输出推断的；它来自运行时结果信号。
- 超时时，如果子级只执行到了工具调用，通报可以将该历史压缩为简短的部分进度摘要，而不是重放原始工具输出。

通报负载在末尾包含一行统计信息（即使已包装也是如此）：

- 运行时长（例如 `runtime 5m12s`）
- Token 用量（输入/输出/总计）
- 估算成本（当已配置模型定价 `models.providers.*.models[].cost` 时）
- `sessionKey`、`sessionId` 和转录路径（这样主智能体可以通过 `sessions_history` 获取历史记录，或在磁盘上检查文件）
- 内部元数据仅用于编排；面向用户的回复应以正常助手语气重写。

`sessions_history` 是更安全的编排路径：

- 助手回顾会先进行规范化：
  - 移除 thinking 标签
  - 移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 移除纯文本工具调用 XML 负载块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括那些从未正常闭合的截断负载
  - 移除降级的工具调用/结果脚手架和历史上下文标记
  - 移除泄露的模型控制令牌，例如 `<|assistant|>`、其他 ASCII `<|...|>` 令牌，以及全角 `<｜...｜>` 变体
  - 移除格式错误的 MiniMax 工具调用 XML
- 类似凭证/Token 的文本会被打码
- 长内容块可能会被截断
- 非常大的历史记录可能会丢弃较旧的行，或将超大的行替换为 `[sessions_history omitted: message too large]`
- 当你需要逐字节完整转录时，回退方式是在磁盘上检查原始转录

## 工具策略（子智能体工具）

默认情况下，子智能体会获得**除会话工具**和系统工具之外的**所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 仍然是一个有边界、经过清理的回顾视图；它不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 的编排器子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子级。

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
        // deny 优先
        deny: ["gateway", "cron"],
        // 如果设置 allow，则变为仅允许 allow 中的工具（deny 仍优先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 并发

子智能体使用专用的进程内队列 lane：

- Lane 名称：`subagent`
- 并发数：`agents.defaults.subagents.maxConcurrent`（默认值 `8`）

## 存活性与恢复

OpenClaw 不会将缺少 `endedAt` 永久视为某个子智能体仍然存活的证明。超过陈旧运行窗口、且未结束的运行，将不再在 `/subagents list`、状态摘要、后代完成门控以及按会话的并发检查中计为活动/待处理。

在 Gateway 网关重启后，陈旧的未结束恢复运行会被修剪，除非其子会话被标记为 `abortedLastRun: true`。这些因重启而中止的子会话仍可通过子智能体孤儿恢复流程恢复，该流程会在清除中止标记之前发送一条合成的恢复消息。

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止从中生成的所有活动子智能体运行，同时级联到嵌套子级。
- `/subagents kill <id>` 会停止指定的子智能体，并级联到其子级。

## 限制

- 子智能体通报是**尽力而为**的。如果 Gateway 网关重启，待处理的“回传通报”工作将丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为一个安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文仅注入 `AGENTS.md` + `TOOLS.md`（不包含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。对于大多数使用场景，建议使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活动子级数（默认值：5，范围：1–20）。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [智能体发送](/zh-CN/tools/agent-send)
