---
read_when:
    - 你希望通过智能体进行后台 / 并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查绑定到线程的子智能体会话
summary: 子智能体：启动隔离的智能体运行，并将结果回报到请求者聊天中
title: 子智能体
x-i18n:
    generated_at: "2026-04-22T00:33:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# 子智能体

子智能体是从现有智能体运行中派生出来的后台智能体运行。它们在各自独立的会话中运行（`agent:<agentId>:subagent:<uuid>`），并在完成后将其结果**回报**到请求者聊天渠道。每个子智能体运行都会被跟踪为一个[后台任务](/zh-CN/automation/tasks)。

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

这些命令适用于支持持久线程绑定的渠道。请参见下方的**支持线程的渠道**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 会显示运行元数据（状态、时间戳、会话 id、transcript 路径、清理情况）。
使用 `sessions_history` 获取有边界、经过安全过滤的回顾视图；当你需要原始完整 transcript 时，请检查磁盘上的 transcript 路径。

### 启动行为

`/subagents spawn` 会以用户命令而非内部中继的方式启动一个后台子智能体，并在运行结束时向请求者聊天发送一条最终完成更新。

- 启动命令是非阻塞的；它会立即返回一个运行 id。
- 完成后，子智能体会将摘要 / 结果消息回报到请求者聊天渠道。
- 完成采用推送模式。启动后，不要只是为了等待它结束而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在调试或干预时按需检查状态。
- 完成时，OpenClaw 会尽力关闭该子智能体会话打开的已跟踪浏览器标签页 / 进程，然后再继续执行回报清理流程。
- 对于手动启动，投递具备弹性：
  - OpenClaw 会先尝试使用稳定的幂等键进行直接 `agent` 投递。
  - 如果直接投递失败，则回退到队列路由。
  - 如果队列路由仍不可用，则会在最终放弃前使用短暂的指数退避重试回报。
- 完成投递会保留已解析的请求者路由：
  - 如果可用，优先使用线程绑定或会话绑定的完成路由
  - 如果完成来源仅提供渠道，OpenClaw 会从请求者会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）补齐缺失的 target / account，以便直接投递仍然可用
- 向请求者会话交接完成信息时，使用的是运行时生成的内部上下文（不是用户编写的文本），其中包括：
  - `Result`（最新可见的 `assistant` 回复文本；否则为经过净化的最新 tool / toolResult 文本；终态失败的运行不会复用已捕获的回复文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 紧凑的运行时 / token 统计信息
  - 一条投递说明，指示请求者智能体用正常的助手语气重写（而不是转发原始内部元数据）
- `--model` 和 `--thinking` 会覆盖该次运行的默认值。
- 完成后，使用 `info` / `log` 查看详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久线程绑定会话，请使用 `sessions_spawn`，并设置 `thread: true` 与 `mode: "session"`。
- 对于 ACP harness 会话（Codex、Claude Code、Gemini CLI），请使用 `sessions_spawn` 并设置 `runtime: "acp"`，并参见 [ACP Agents](/zh-CN/tools/acp-agents)，尤其是在调试完成投递或智能体到智能体循环时的 [ACP delivery model](/zh-CN/tools/acp-agents#delivery-model)。

主要目标：

- 将“研究 / 长任务 / 慢工具”工作并行化，而不阻塞主运行。
- 默认保持子智能体隔离（会话隔离 + 可选沙箱隔离）。
- 让工具面尽可能不易被误用：子智能体默认**不会**获得 session 工具。
- 支持可配置的嵌套深度，以实现编排器模式。

成本说明：每个子智能体都有其**自己的**上下文和 token 用量。对于高负载或重复性任务，建议为子智能体设置更便宜的模型，同时让主智能体使用质量更高的模型。
你可以通过 `agents.defaults.subagents.model` 或按智能体覆盖来配置这一点。

## 工具

使用 `sessions_spawn`：

- 启动一个子智能体运行（`deliver: false`，全局 lane：`subagent`）
- 然后执行一个回报步骤，并将回报回复发布到请求者聊天渠道
- 默认模型：继承调用者，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式设置的 `sessions_spawn.model` 仍然优先。
- 默认 thinking：继承调用者，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式设置的 `sessions_spawn.thinking` 仍然优先。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

工具参数：

- `task`（必填）
- `label?`（可选）
- `agentId?`（可选；如果允许，可在另一个智能体 id 下启动）
- `model?`（可选；覆盖子智能体模型；无效值会被跳过，子智能体将使用默认模型运行，并在工具结果中给出警告）
- `thinking?`（可选；覆盖子智能体运行的 thinking 级别）
- `runTimeoutSeconds?`（设置时默认取 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`；设置后，子智能体运行会在 N 秒后中止）
- `thread?`（默认为 `false`；为 `true` 时，请求为该子智能体会话启用渠道线程绑定）
- `mode?`（`run|session`）
  - 默认为 `run`
  - 如果 `thread: true` 且省略 `mode`，默认变为 `session`
  - `mode: "session"` 要求 `thread: true`
- `cleanup?`（`delete|keep`，默认 `keep`）
- `sandbox?`（`inherit|require`，默认 `inherit`；`require` 会在目标子运行时未启用沙箱时拒绝启动）
- `sessions_spawn` **不**接受渠道投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需投递，请在已启动的运行中使用 `message` / `sessions_send`。

## 线程绑定会话

启用线程绑定后，子智能体可以保持绑定到某个线程，因此该线程中的后续用户消息会持续路由到同一个子智能体会话。

### 支持线程的渠道

- Discord（当前唯一支持的渠道）：支持持久线程绑定的子智能体会话（`sessions_spawn` 配合 `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用 `sessions_spawn` 启动，并设置 `thread: true`（可选设置 `mode: "session"`）。
2. OpenClaw 在当前活跃渠道中创建线程，或将线程绑定到该会话目标。
3. 该线程中的回复和后续消息会路由到已绑定的会话。
4. 使用 `/session idle` 查看 / 更新因不活跃而自动取消聚焦的设置，使用 `/session max-age` 控制硬性时长上限。
5. 使用 `/unfocus` 手动解除绑定。

手动控制：

- `/focus <target>` 将当前线程（或新建一个线程）绑定到某个子智能体 / 会话目标。
- `/unfocus` 移除当前已绑定线程的绑定关系。
- `/agents` 列出活跃运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅适用于已聚焦的绑定线程。

配置开关：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- 渠道覆盖和启动时自动绑定键是特定于适配器的。请参见上方的**支持线程的渠道**。

当前适配器详情请参见 [Configuration Reference](/zh-CN/gateway/configuration-reference) 和 [Slash commands](/zh-CN/tools/slash-commands)。

允许列表：

- `agents.list[].subagents.allowAgents`：可通过 `agentId` 指定的智能体 id 列表（`["*"]` 表示允许任意值）。默认：仅请求者智能体。
- `agents.defaults.subagents.allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体允许列表。
- 沙箱继承保护：如果请求者会话处于沙箱中，`sessions_spawn` 会拒绝那些会在非沙箱环境中运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择 profile）。默认：false。

发现：

- 使用 `agents_list` 查看当前哪些智能体 id 被允许用于 `sessions_spawn`。

自动归档：

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认：60）。
- 归档使用 `sessions.delete`，并将 transcript 重命名为 `*.deleted.<timestamp>`（同一文件夹内）。
- `cleanup: "delete"` 会在回报后立即归档（仍会通过重命名保留 transcript）。
- 自动归档是尽力而为；如果 Gateway 网关重启，待处理计时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会保留到自动归档执行。
- 自动归档同样适用于深度 1 和深度 2 的会话。
- 浏览器清理与归档清理彼此独立：当运行结束时，即使 transcript / 会话记录被保留，也会尽力关闭已跟踪的浏览器标签页 / 进程。

## 嵌套子智能体

默认情况下，子智能体不能再启动自己的子智能体（`maxSpawnDepth: 1`）。你可以通过设置 `maxSpawnDepth: 2` 启用一层嵌套，这样就允许使用**编排器模式**：主智能体 → 编排器子智能体 → 工作型子子智能体。

### 启用方式

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体启动子级（默认：1）
        maxChildrenPerAgent: 5, // 每个智能体会话允许的最大活跃子级数（默认：5）
        maxConcurrent: 8, // 全局并发 lane 上限（默认：8）
        runTimeoutSeconds: 900, // 省略时 sessions_spawn 的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形态 | 角色 | 可否启动子级？ |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体 | 始终可以 |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（当允许深度 2 时可作为编排器） | 仅当 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作节点） | 永不可以 |

### 回报链

结果会沿链路逐级返回：

1. 深度 2 工作节点完成 → 向其父级（深度 1 编排器）回报
2. 深度 1 编排器收到回报，综合结果后完成 → 向主智能体回报
3. 主智能体收到回报并将结果投递给用户

每一层只会看到其直接子级的回报。

操作建议：

- 启动子级工作一次后，等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。
- 如果子级完成事件在你已经发送最终答案之后才到达，正确的后续处理是精确输出静默令牌 `NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制范围会在启动时写入会话元数据。这样可以防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）**：获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他 session / system 工具仍然被拒绝。
- **深度 1（叶子节点，当 `maxSpawnDepth == 1` 时）**：没有 session 工具（当前默认行为）。
- **深度 2（叶子工作节点）**：没有 session 工具——在深度 2 时，`sessions_spawn` 始终被拒绝。不能继续启动更多子级。

### 每个智能体的启动上限

每个智能体会话（任意深度）同一时间最多只能有 `maxChildrenPerAgent`（默认：5）个活跃子级。这样可以防止单个编排器出现失控式扇出。

### 级联停止

停止一个深度 1 编排器会自动停止其所有深度 2 子级：

- 在主聊天中使用 `/stop` 会停止所有深度 1 智能体，并级联停止它们的深度 2 子级。
- `/subagents kill <id>` 会停止某个特定子智能体，并级联停止其子级。
- `/subagents kill all` 会停止该请求者的所有子智能体，并级联停止。

## 凭证

子智能体凭证按**智能体 id**解析，而不是按会话类型解析：

- 子智能体会话键是 `agent:<agentId>:subagent:<uuid>`。
- 凭证存储会从该智能体的 `agentDir` 加载。
- 主智能体的凭证配置会作为**后备**合并进来；发生冲突时，智能体配置优先于主配置。

注意：这种合并是增量式的，因此主配置始终可作为后备使用。目前尚不支持每个智能体完全隔离的凭证。

## 回报

子智能体通过回报步骤进行结果返回：

- 回报步骤在子智能体会话内部运行（而不是在请求者会话中）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的 assistant 文本是精确的静默令牌 `NO_REPLY` / `no_reply`，即使之前存在可见进度，也会抑制回报输出。
- 否则，投递方式取决于请求者深度：
  - 顶层请求者会话使用带外部投递的后续 `agent` 调用（`deliver=true`）
  - 嵌套请求者子智能体会话接收内部后续注入（`deliver=false`），以便编排器在会话内综合子级结果
  - 如果某个嵌套请求者子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求者
- 对于顶层请求者会话，完成模式的直接投递会先解析任何已绑定的会话 / 线程路由和 hook 覆盖，然后从请求者会话存储的路由中补齐缺失的渠道目标字段。这样即使完成来源只标识了渠道，也能确保完成消息投递到正确的聊天 / 主题。
- 在构建嵌套完成结果时，子级完成聚合被限定在当前请求者运行范围内，防止之前运行中陈旧的子级输出泄露到当前回报中。
- 在渠道适配器可用时，回报回复会保留线程 / 主题路由。
- 回报上下文会被规范化为稳定的内部事件块：
  - 来源（`subagent` 或 `cron`）
  - 子会话键 / id
  - 回报类型 + 任务标签
  - 根据运行时结果派生的状态行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最新可见 assistant 文本中选择的结果内容；否则使用经过净化的最新 tool / toolResult 文本；处于终态失败的运行会报告失败状态，而不会重放已捕获的回复文本
  - 一条后续说明，描述何时应回复、何时应保持静默
- `Status` 不是从模型输出推断出来的；它来自运行时结果信号。
- 超时时，如果子级只执行到了工具调用阶段，回报可以将这段历史折叠为简短的部分进度摘要，而不是重放原始工具输出。

回报负载在末尾包含一行统计信息（即使被包裹时也是如此）：

- 运行时长（例如 `runtime 5m12s`）
- Token 使用量（输入 / 输出 / 总计）
- 当配置了模型定价时的预估成本（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId` 和 transcript 路径（这样主智能体就可以通过 `sessions_history` 获取历史记录，或直接检查磁盘上的文件）
- 内部元数据仅用于编排；面向用户的回复应以正常的助手语气重写。

`sessions_history` 是更安全的编排路径：

- assistant 回顾会先被规范化：
  - 去除 thinking 标签
  - 去除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 去除纯文本工具调用 XML 负载块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括那些从未正常闭合的截断负载
  - 去除降级后的工具调用 / 结果脚手架以及历史上下文标记
  - 去除泄露的模型控制令牌，例如 `<|assistant|>`、其他 ASCII `<|...|>` 令牌，以及全角变体 `<｜...｜>`
  - 去除格式错误的 MiniMax 工具调用 XML
- 类似凭证 / token 的文本会被脱敏
- 长内容块可能会被截断
- 非常大的历史记录可能会丢弃较旧的行，或将超大的单行替换为 `[sessions_history omitted: message too large]`
- 当你需要完整、逐字节的 transcript 时，回退方案是直接检查磁盘上的原始 transcript

## 工具策略（子智能体工具）

默认情况下，子智能体会获得**除 session 工具和 system 工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 也仍然是有边界、经过净化的回顾视图；它不是原始 transcript 转储。

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
        // deny 优先
        deny: ["gateway", "cron"],
        // 如果设置了 allow，则变为仅允许 allow 中的内容（deny 仍然优先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 并发

子智能体使用专用的进程内队列 lane：

- Lane 名称：`subagent`
- 并发数：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止由其启动的所有活跃子智能体运行，同时级联到嵌套子级。
- `/subagents kill <id>` 会停止某个特定子智能体，并级联到其子级。

## 限制

- 子智能体回报属于**尽力而为**。如果 Gateway 网关重启，待处理的“回报给请求者”工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为一个安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md` + `TOOLS.md`（不包含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。对于大多数使用场景，推荐使用深度 2。
- `maxChildrenPerAgent` 会限制每个会话的活跃子级数量（默认：5，范围：1–20）。
