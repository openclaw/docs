---
read_when:
    - 你希望通过智能体进行后台/并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查线程绑定的子智能体会话
summary: 子智能体：启动隔离的智能体运行，并将结果回传到请求者聊天中
title: 子智能体
x-i18n:
    generated_at: "2026-04-21T19:01:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# 子智能体

子智能体是从现有智能体运行中派生出来的后台智能体运行。它们在各自独立的会话中运行（`agent:<agentId>:subagent:<uuid>`），并且在完成后，会将结果**回传**到请求者聊天渠道。每个子智能体运行都会作为一个[后台任务](/zh-CN/automation/tasks)进行跟踪。

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

这些命令适用于支持持久线程绑定的渠道。参见下方的**支持线程的渠道**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 会显示运行元数据（状态、时间戳、会话 id、转录路径、清理）。
使用 `sessions_history` 获取有边界且经过安全过滤的回溯视图；当你需要原始完整转录时，请查看磁盘上的转录路径。

### 启动行为

`/subagents spawn` 会以用户命令而不是内部中继的方式启动一个后台子智能体，并且在运行完成时，会向请求者聊天发送一条最终完成更新。

- 启动命令是非阻塞的；它会立即返回一个运行 id。
- 完成时，子智能体会向请求者聊天渠道回传一条摘要/结果消息。
- 完成通知基于推送。一旦启动，不要为了等待其完成而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在调试或干预时才按需查看状态。
- 完成时，OpenClaw 会尽力在回传清理流程继续之前，关闭该子智能体会话所打开并被跟踪的浏览器标签页/进程。
- 对于手动启动，投递具有韧性：
  - OpenClaw 会先尝试使用稳定的幂等键直接投递到 `agent`
  - 如果直接投递失败，则回退到队列路由
  - 如果队列路由仍不可用，则在最终放弃前，使用短时指数退避重试回传
- 完成投递会保留已解析的请求者路由：
  - 在线程绑定或会话绑定的完成路由可用时，优先使用它们
  - 如果完成来源仅提供一个渠道，OpenClaw 会从请求者会话已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）中补齐缺失的 target/account，以便直接投递仍然可用
- 向请求者会话移交完成信息时，会使用运行时生成的内部上下文（不是用户编写的文本），其中包括：
  - `Result`（最新可见的 `assistant` 回复文本；否则为已清理的最新 `tool/toolResult` 文本；终态失败运行不会复用已捕获的回复文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 精简的运行时/令牌统计
  - 一条投递指令，告知请求者智能体用正常的 assistant 语气重写内容（而不是转发原始内部元数据）
- `--model` 和 `--thinking` 会覆盖该次运行的默认值。
- 完成后，使用 `info`/`log` 查看详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久线程绑定会话，请使用 `sessions_spawn`，并设置 `thread: true` 和 `mode: "session"`。
- 对于 ACP harness 会话（Codex、Claude Code、Gemini CLI），请使用 `sessions_spawn` 并设置 `runtime: "acp"`，参见 [ACP Agents](/zh-CN/tools/acp-agents)。

主要目标：

- 并行处理“研究 / 长任务 / 慢工具”类工作，而不阻塞主运行。
- 默认保持子智能体隔离（会话隔离 + 可选沙箱隔离）。
- 让工具表面不易被误用：默认情况下，子智能体**不会**获得会话工具。
- 支持可配置的嵌套深度，以实现编排器模式。

成本说明：每个子智能体都有其**自己的**上下文和令牌使用量。对于高负载或重复性任务，请为子智能体设置更便宜的模型，同时让你的主智能体保留在更高质量的模型上。
你可以通过 `agents.defaults.subagents.model` 或按智能体覆盖来进行配置。

## 工具

使用 `sessions_spawn`：

- 启动一个子智能体运行（`deliver: false`，全局 lane：`subagent`）
- 然后执行回传步骤，并将回传回复发布到请求者聊天渠道
- 默认模型：继承调用方，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式指定的 `sessions_spawn.model` 仍然优先。
- 默认 thinking：继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式指定的 `sessions_spawn.thinking` 仍然优先。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（不超时）。

工具参数：

- `task`（必填）
- `label?`（可选）
- `agentId?`（可选；如果允许，可在另一个智能体 id 下启动）
- `model?`（可选；覆盖子智能体模型；无效值会被跳过，子智能体会使用默认模型运行，并在工具结果中给出警告）
- `thinking?`（可选；覆盖子智能体运行的 thinking 级别）
- `runTimeoutSeconds?`（默认在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`；设置后，子智能体运行会在 N 秒后中止）
- `thread?`（默认 `false`；当为 `true` 时，请求为该子智能体会话启用渠道线程绑定）
- `mode?`（`run|session`）
  - 默认是 `run`
  - 如果 `thread: true` 且省略 `mode`，默认变为 `session`
  - `mode: "session"` 要求 `thread: true`
- `cleanup?`（`delete|keep`，默认 `keep`）
- `sandbox?`（`inherit|require`，默认 `inherit`；`require` 会在目标子运行时未启用沙箱时拒绝启动）
- `sessions_spawn` **不接受**渠道投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。对于投递，请从派生出的运行中使用 `message`/`sessions_send`。

## 线程绑定会话

在线程绑定已为某个渠道启用时，子智能体可以保持绑定到一个线程，因此该线程中的后续用户消息会继续路由到同一个子智能体会话。

### 支持线程的渠道

- Discord（当前唯一支持的渠道）：支持持久线程绑定的子智能体会话（`sessions_spawn` 配合 `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用 `sessions_spawn` 启动，并设置 `thread: true`（可选同时设置 `mode: "session"`）。
2. OpenClaw 会在当前活跃渠道中创建一个线程，或将一个线程绑定到该会话目标。
3. 该线程中的回复和后续消息会路由到绑定的会话。
4. 使用 `/session idle` 查看/更新因不活跃而自动取消焦点的设置，使用 `/session max-age` 控制硬性上限。
5. 使用 `/unfocus` 手动解除绑定。

手动控制：

- `/focus <target>` 将当前线程（或新建一个线程）绑定到某个子智能体/会话目标。
- `/unfocus` 移除当前已绑定线程的绑定关系。
- `/agents` 列出活跃运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅适用于已聚焦的绑定线程。

配置开关：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- 渠道覆盖和启动时自动绑定的键为适配器专用。参见上方的**支持线程的渠道**。

当前适配器详情参见 [Configuration Reference](/zh-CN/gateway/configuration-reference) 和 [Slash commands](/zh-CN/tools/slash-commands)。

允许列表：

- `agents.list[].subagents.allowAgents`：可通过 `agentId` 指定的智能体 id 列表（`["*"]` 表示允许任意智能体）。默认值：仅允许请求者智能体。
- `agents.defaults.subagents.allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体允许列表。
- 沙箱继承保护：如果请求者会话处于沙箱中，`sessions_spawn` 会拒绝那些将在非沙箱中运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：当为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。默认值：false。

发现：

- 使用 `agents_list` 查看当前哪些智能体 id 允许用于 `sessions_spawn`。

自动归档：

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 之后自动归档（默认：60）。
- 归档使用 `sessions.delete`，并将转录重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在回传后立即归档（仍会通过重命名保留转录）。
- 自动归档采用尽力而为的方式；如果 Gateway 网关重启，待处理的定时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会保留，直到自动归档发生。
- 自动归档同样适用于 depth-1 和 depth-2 会话。
- 浏览器清理与归档清理是分开的：当运行结束时，即使转录/会话记录被保留，被跟踪的浏览器标签页/进程也会尽力关闭。

## 嵌套子智能体

默认情况下，子智能体不能再启动自己的子智能体（`maxSpawnDepth: 1`）。你可以通过设置 `maxSpawnDepth: 2` 来启用一层嵌套，这样就允许**编排器模式**：主智能体 → 编排器子智能体 → 工作子子智能体。

### 如何启用

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体启动子级（默认：1）
        maxChildrenPerAgent: 5, // 每个智能体会话的最大活跃子级数（默认：5）
        maxConcurrent: 8, // 全局并发 lane 上限（默认：8）
        runTimeoutSeconds: 900, // `sessions_spawn` 省略时的默认超时（0 = 不超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形态                                 | 角色                                         | 可以启动子级？               |
| ----- | ------------------------------------------ | -------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                          | 主智能体                                     | 始终可以                     |
| 1     | `agent:<id>:subagent:<uuid>`               | 子智能体（在允许 depth 2 时可作为编排器）    | 仅当 `maxSpawnDepth >= 2` 时 |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作节点）                   | 永远不可以                   |

### 回传链

结果会沿链路逐级返回：

1. depth-2 工作节点完成 → 向其父级（depth-1 编排器）回传
2. depth-1 编排器接收回传、综合结果、完成 → 向主智能体回传
3. 主智能体接收回传并将其投递给用户

每一层只能看到其直接子级的回传。

操作指南：

- 子任务启动一次后就等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。
- 如果在你已经发送最终答案之后，某个子级完成事件才到达，正确的后续操作是输出精确的静默令牌 `NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制范围会在启动时写入会话元数据。这样可以防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **Depth 1（编排器，当 `maxSpawnDepth >= 2` 时）**：获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话/系统工具仍然被拒绝。
- **Depth 1（叶子节点，当 `maxSpawnDepth == 1` 时）**：没有会话工具（当前默认行为）。
- **Depth 2（叶子工作节点）**：没有会话工具 —— 在 depth 2 下始终拒绝 `sessions_spawn`。不能继续启动更多子级。

### 每个智能体的启动上限

每个智能体会话（任意深度）同一时间最多只能有 `maxChildrenPerAgent`（默认：5）个活跃子级。这可以防止单个编排器发生失控式扇出。

### 级联停止

停止一个 depth-1 编排器会自动停止它的所有 depth-2 子级：

- 在主聊天中执行 `/stop` 会停止所有 depth-1 智能体，并级联停止它们的 depth-2 子级。
- `/subagents kill <id>` 会停止指定的子智能体，并级联停止其子级。
- `/subagents kill all` 会停止该请求者的所有子智能体，并执行级联停止。

## 认证

子智能体认证按**智能体 id**解析，而不是按会话类型：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 认证存储从该智能体的 `agentDir` 加载。
- 主智能体的认证配置文件会作为**回退**合并进来；若发生冲突，智能体配置文件会覆盖主配置文件。

注意：这种合并是增量式的，因此主配置文件始终可作为回退使用。当前尚不支持每个智能体完全隔离的认证。

## 回传

子智能体通过一个回传步骤进行结果上报：

- 回传步骤在子智能体会话内部运行（不是在请求者会话中）。
- 如果子智能体的回复精确等于 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的 assistant 文本是精确的静默令牌 `NO_REPLY` / `no_reply`，即使此前存在可见进度，也会抑制回传输出。
- 否则，投递方式取决于请求者深度：
  - 顶层请求者会话使用带外部投递的后续 `agent` 调用（`deliver=true`）
  - 嵌套的请求者子智能体会话接收一次内部后续注入（`deliver=false`），以便编排器在会话内综合子级结果
  - 如果某个嵌套的请求者子智能体会话已经不存在，OpenClaw 会在可用时回退到该会话的请求者
- 对于顶层请求者会话，完成模式下的直接投递会先解析任何已绑定的会话/线程路由和 hook 覆盖，然后从请求者会话存储的路由中补齐缺失的渠道目标字段。这样即使完成来源只标识了渠道，也能把完成消息发送到正确的聊天/话题中。
- 在构建嵌套完成结果时，子级完成聚合会限定在当前请求者运行范围内，从而防止先前运行中遗留的子级输出泄漏到当前回传中。
- 在渠道适配器可用时，回传回复会保留线程/话题路由。
- 回传上下文会规范化为稳定的内部事件块：
  - 来源（`subagent` 或 `cron`）
  - 子级会话 key/id
  - 回传类型 + 任务标签
  - 从运行时结果推导出的状态行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最新可见 assistant 文本中选取的结果内容；否则使用经过清理的最新 `tool/toolResult` 文本；终态失败运行会报告失败状态，而不会重放已捕获的回复文本
  - 一条后续指令，说明何时应回复、何时应保持静默
- `Status` 不是从模型输出推断的；它来自运行时结果信号。
- 超时时，如果子级只执行到了工具调用阶段，回传可以将这段历史折叠为简短的部分进展摘要，而不是重放原始工具输出。

回传负载在末尾包含一行统计信息（即使被包装也是如此）：

- 运行时长（例如 `runtime 5m12s`）
- 令牌使用量（输入/输出/总计）
- 如果已配置模型定价（`models.providers.*.models[].cost`），则包含估算成本
- `sessionKey`、`sessionId` 和转录路径（这样主智能体就可以通过 `sessions_history` 获取历史记录，或直接检查磁盘上的文件）
- 内部元数据仅用于编排；面向用户的回复应使用正常 assistant 语气重新表述。

`sessions_history` 是更安全的编排路径：

- assistant 回溯会先进行规范化：
  - 去除 thinking 标签
  - 去除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 去除纯文本工具调用 XML 负载块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括那些从未正常闭合的截断负载
  - 去除降级后的工具调用/结果脚手架和历史上下文标记
  - 去除泄漏的模型控制令牌，例如 `<|assistant|>`、其他 ASCII `<|...|>` 令牌，以及全角变体 `<｜...｜>`
  - 去除格式错误的 MiniMax 工具调用 XML
- 类凭证/令牌的文本会被脱敏
- 长内容块可能会被截断
- 非常大的历史记录可能会丢弃较旧的行，或用 `[sessions_history omitted: message too large]` 替换过大的行
- 当你需要完整逐字节转录时，回退方案是直接检查磁盘上的原始转录文件

## 工具策略（子智能体工具）

默认情况下，子智能体获得**除会话工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 仍然是一个有边界、经过清理的回溯视图；它不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，depth-1 编排器子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子级。

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
        // 如果设置了 allow，则变为仅允许 allow 中的工具（deny 仍然优先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 并发

子智能体使用专用的进程内队列 lane：

- lane 名称：`subagent`
- 并发数：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止所有由其启动的活跃子智能体运行，同时级联停止嵌套子级。
- `/subagents kill <id>` 会停止指定的子智能体，并级联停止其子级。

## 限制

- 子智能体回传是**尽力而为**的。如果 Gateway 网关重启，待处理的“回传结果”工作会丢失。
- 子智能体仍然共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只会注入 `AGENTS.md` + `TOOLS.md`（不会注入 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数场景建议使用 depth 2。
- `maxChildrenPerAgent` 限制每个会话的活跃子级数量（默认：5，范围：1–20）。
