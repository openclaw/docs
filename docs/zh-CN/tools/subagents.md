---
read_when:
    - 你希望通过智能体进行后台/并行工作
    - 你正在更改 `sessions_spawn` 或子智能体工具策略
    - 你正在实现或排查受线程绑定的子智能体会话
summary: 子智能体：启动隔离的智能体运行，并将结果通知回请求者聊天界面
title: 子智能体
x-i18n:
    generated_at: "2026-04-26T00:04:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 190f2dd3b5465fc2f9026769a60d03862fc2dbadb1cb66bf1fe846a7148e1f3f
    source_path: tools/subagents.md
    workflow: 15
---

子智能体是从现有智能体运行中派生出的后台智能体运行。它们在自己的会话（`agent:<agentId>:subagent:<uuid>`）中运行，并在完成后将结果**通知**回请求者聊天渠道。每次子智能体运行都会被跟踪为一个[后台任务](/zh-CN/automation/tasks)。

## 斜杠命令

使用 `/subagents` 来查看或控制**当前会话**的子智能体运行：

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

`/subagents info` 会显示运行元数据（Status、时间戳、会话 id、转录路径、清理信息）。
使用 `sessions_history` 获取有边界且经过安全过滤的回顾视图；当你需要原始完整转录时，请检查磁盘上的转录路径。

### 启动行为

`/subagents spawn` 会以用户命令而非内部中继的方式启动一个后台子智能体，并在运行结束时向请求者聊天发送一条最终完成更新。

- 启动命令是非阻塞的；它会立即返回一个运行 id。
- 完成时，子智能体会向请求者聊天渠道通知一条摘要/结果消息。
- 完成采用基于推送的方式。启动后，不要仅仅为了等待其完成而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在调试或干预时按需查看 Status。
- 完成时，OpenClaw 会尽最大努力在通知清理流程继续之前，关闭该子智能体会话打开并被跟踪的浏览器标签页/进程。
- 对于手动启动，投递具有弹性：
  - OpenClaw 会先尝试使用稳定的幂等键进行直接 `agent` 投递。
  - 如果直接投递失败，则回退到队列路由。
  - 如果队列路由仍不可用，则在最终放弃前，通知会以较短的指数退避方式重试。
- 完成投递会保留已解析的请求者路由：
  - 可用时，线程绑定或会话绑定的完成路由优先生效
  - 如果完成来源只提供渠道，OpenClaw 会从请求者会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）中补全缺失的 target/account，以便直接投递仍能工作
- 向请求者会话移交完成结果时，使用的是运行时生成的内部上下文（不是用户编写的文本），其中包括：
  - `Result`（最新可见的 `assistant` 回复文本；否则为已清理的最新 tool/toolResult 文本；终态失败运行不会复用已捕获的回复文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 紧凑的运行时/token 统计信息
  - 一条投递说明，告诉请求者智能体用正常的助手语气重写，而不是转发原始内部元数据
- `--model` 和 `--thinking` 会覆盖该次特定运行的默认值。
- 完成后，使用 `info`/`log` 查看详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
- 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode 或显式的 Codex ACP/acpx），当工具声明该运行时可用时，请使用带有 `runtime: "acp"` 的 `sessions_spawn`，并参见 [ACP 智能体](/zh-CN/tools/acp-agents)，尤其是在排查完成投递或智能体到智能体循环时的 [ACP 投递模型](/zh-CN/tools/acp-agents#delivery-model)。当启用 `codex` 插件时，Codex 聊天/线程控制应优先使用 `/codex ...` 而不是 ACP，除非用户明确要求 ACP/acpx。OpenClaw 会在 ACP 已启用、请求者不在沙箱中且已加载如 `acpx` 之类的后端插件之前隐藏 `runtime: "acp"`。`runtime: "acp"` 需要一个外部 ACP harness id，或一个带有 `runtime.type="acp"` 的 `agents.list[]` 条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认的子智能体运行时。

主要目标：

- 将“研究 / 长任务 / 慢工具”工作并行化，而不会阻塞主运行。
- 默认保持子智能体隔离（会话分离 + 可选沙箱隔离）。
- 让工具表面难以误用：默认情况下，子智能体**不会**获得会话工具。
- 支持可配置的嵌套深度，以实现编排器模式。

成本说明：默认情况下，每个子智能体都有其**自己的**上下文和 token 用量。对于高负载或重复性任务，请为子智能体设置更便宜的模型，并让主智能体保留使用质量更高的模型。你可以通过 `agents.defaults.subagents.model` 或按智能体覆盖来配置这一点。当子级确实需要请求者当前的转录时，智能体可以在该次启动时请求 `context: "fork"`。

## 上下文模式

原生子智能体默认以隔离方式启动，除非调用方明确要求 fork 当前转录。

| 模式 | 何时使用 | 行为 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新的研究、独立实现、慢工具工作，或任何可以在任务文本中简要说明的内容 | 创建一个干净的子级转录。这是默认方式，并能保持较低的 token 用量。 |
| `fork` | 工作依赖当前对话、先前工具结果，或请求者转录中已有的细微指令 | 在子级启动前，将请求者转录分支到子级会话中。 |

谨慎使用 `fork`。它适用于对上下文敏感的委派，而不是用来替代编写清晰的任务提示。

## 工具

使用 `sessions_spawn`：

- 启动一个子智能体运行（`deliver: false`，全局 lane：`subagent`）
- 然后执行一个通知步骤，并将通知回复发布到请求者聊天渠道
- 默认模型：继承调用方，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式指定的 `sessions_spawn.model` 仍然优先生效。
- 默认 thinking：继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式指定的 `sessions_spawn.thinking` 仍然优先生效。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

工具参数：

- `task`（必需）
- `label?`（可选）
- `agentId?`（可选；如被允许，可在另一个智能体 id 下启动）
- `runtime?`（`subagent|acp`，默认 `subagent`；`acp` 仅用于外部 ACP harness，例如 `claude`、`gemini`、`opencode`，或显式请求的 Codex ACP/acpx，或者用于 `agents.list[]` 中 `runtime.type` 为 `acp` 的条目）
- `model?`（可选；覆盖子智能体模型；无效值会被跳过，子智能体将使用默认模型运行，并在工具结果中附带警告）
- `thinking?`（可选；覆盖子智能体运行的 thinking 级别）
- `runTimeoutSeconds?`（在已设置时默认取 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`；设置后，子智能体运行会在 N 秒后中止）
- `thread?`（默认 `false`；当为 `true` 时，请求为该子智能体会话启用渠道线程绑定）
- `mode?`（`run|session`）
  - 默认是 `run`
  - 如果 `thread: true` 且省略 `mode`，默认变为 `session`
  - `mode: "session"` 需要 `thread: true`
- `cleanup?`（`delete|keep`，默认 `keep`）
- `sandbox?`（`inherit|require`，默认 `inherit`；`require` 会在目标子级运行时未处于沙箱隔离时拒绝启动）
- `context?`（`isolated|fork`，默认 `isolated`；仅适用于原生子智能体）
  - `isolated` 会创建一个干净的子级转录，并且是默认方式。
  - `fork` 会将请求者当前转录分支到子级会话中，使子级以相同的对话上下文启动。
  - 仅当子级需要当前转录时才使用 `fork`。对于有范围的工作，可省略 `context`。
- `sessions_spawn` **不**接受渠道投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。对于投递，请从已启动的运行中使用 `message`/`sessions_send`。

## 线程绑定会话

当某个渠道启用了线程绑定时，子智能体可以持续绑定到某个线程，因此该线程中的后续用户消息会继续路由到同一个子智能体会话。

### 支持线程的渠道

- Discord（当前唯一支持的渠道）：支持持久的线程绑定子智能体会话（`sessions_spawn` 配合 `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用带有 `thread: true` 的 `sessions_spawn` 启动（也可选择 `mode: "session"`）。
2. OpenClaw 会在当前活跃渠道中创建一个线程，或将线程绑定到该会话目标。
3. 该线程中的回复和后续消息会路由到绑定的会话。
4. 使用 `/session idle` 查看/更新不活动自动取消聚焦设置，并使用 `/session max-age` 控制硬性时长上限。
5. 使用 `/unfocus` 手动解除绑定。

手动控制：

- `/focus <target>` 将当前线程（或创建一个线程）绑定到某个子智能体/会话目标。
- `/unfocus` 移除当前已绑定线程的绑定关系。
- `/agents` 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅对已聚焦的绑定线程有效。

配置开关：

- 全局默认值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- 渠道覆盖和启动时自动绑定键是适配器特定的。请参见上方的**支持线程的渠道**。

当前适配器详细信息请参见 [Configuration Reference](/zh-CN/gateway/configuration-reference) 和 [斜杠命令](/zh-CN/tools/slash-commands)。

允许列表：

- `agents.list[].subagents.allowAgents`：可通过 `agentId` 作为目标的智能体 id 列表（`["*"]` 表示允许任意）。默认：仅请求者智能体。
- `agents.defaults.subagents.allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体允许列表。
- 沙箱继承保护：如果请求者会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些将以非沙箱方式运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：当为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。默认：false。

发现：

- 使用 `agents_list` 查看当前哪些智能体 id 被允许用于 `sessions_spawn`。响应中包含每个已列出智能体的生效模型和嵌入式运行时元数据，以便调用方区分 PI、Codex app-server 以及其他已配置的原生运行时。

自动归档：

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 指定时间后自动归档（默认：60）。
- 归档使用 `sessions.delete`，并将转录重命名为 `*.deleted.<timestamp>`（位于同一文件夹）。
- `cleanup: "delete"` 会在通知后立即归档（仍会通过重命名保留转录）。
- 自动归档尽力而为；如果 Gateway 网关重启，待处理计时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会保留，直到自动归档发生。
- 自动归档对深度 1 和深度 2 会话同样适用。
- 浏览器清理与归档清理是分开的：当运行完成时，即使保留了转录/会话记录，也会尽最大努力关闭被跟踪的浏览器标签页/进程。

## 嵌套子智能体

默认情况下，子智能体不能再启动自己的子智能体（`maxSpawnDepth: 1`）。你可以通过设置 `maxSpawnDepth: 2` 启用一层嵌套，从而支持**编排器模式**：主智能体 → 编排器子智能体 → 工作子子智能体。

### 如何启用

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体启动子级（默认：1）
        maxChildrenPerAgent: 5, // 每个智能体会话的最大活动子级数（默认：5）
        maxConcurrent: 8, // 全局并发 lane 上限（默认：8）
        runTimeoutSeconds: 900, // `sessions_spawn` 在省略时的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形态 | 角色 | 可以启动？ |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体 | 始终可以 |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（当允许深度 2 时为编排器） | 仅当 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作单元） | 永远不可以 |

### 通知链

结果会沿链路向上返回：

1. 深度 2 工作单元完成 → 通知其父级（深度 1 编排器）
2. 深度 1 编排器收到通知，综合结果，完成 → 通知主智能体
3. 主智能体收到通知并将结果投递给用户

每一层只会看到其直接子级发来的通知。

操作指南：

- 子级工作启动一次后，等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。
- `sessions_list` 和 `/subagents list` 会让子会话关系聚焦于实时工作：存活的子级会持续关联，已结束的子级会在最近的一个短时间窗口内保持可见，而仅存储中的陈旧子级链接会在其新鲜度窗口过后被忽略。这可以防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后“复活”幽灵子级。
- 如果某个子级完成事件在你已发送最终答案后才到达，正确的后续处理是精确的静默 token `NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制范围会在启动时写入会话元数据。这可以防止扁平化或恢复后的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）**：获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话/系统工具仍然被拒绝。
- **深度 1（叶子节点，当 `maxSpawnDepth == 1` 时）**：没有会话工具（当前默认行为）。
- **深度 2（叶子工作单元）**：没有会话工具 —— 在深度 2 始终拒绝 `sessions_spawn`。不能再启动更多子级。

### 每个智能体的启动上限

每个智能体会话（任意深度）同时最多只能有 `maxChildrenPerAgent`（默认：5）个活动子级。这可以防止单个编排器出现失控的扇出。

### 级联停止

停止深度 1 编排器时，会自动停止其所有深度 2 子级：

- 在主聊天中发送 `/stop` 会停止所有深度 1 智能体，并级联停止其深度 2 子级。
- `/subagents kill <id>` 会停止指定的子智能体，并级联停止其子级。
- `/subagents kill all` 会停止该请求者的所有子智能体，并进行级联停止。

## 认证

子智能体认证按**智能体 id** 解析，而不是按会话类型：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 认证存储从该智能体的 `agentDir` 加载。
- 主智能体的认证配置文件会作为**回退**合并进来；发生冲突时，智能体配置文件会覆盖主配置文件。

注意：该合并是追加式的，因此主配置文件始终可作为回退使用。当前尚不支持真正按智能体完全隔离的认证。

## 通知

子智能体通过通知步骤回报结果：

- 通知步骤在子智能体会话内部运行（而不是在请求者会话中）。
- 如果子智能体回复内容精确为 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的助手文本是精确的静默 token `NO_REPLY` / `no_reply`，即使之前存在可见进度，也会抑制通知输出。
- 否则，投递取决于请求者深度：
  - 顶层请求者会话使用带外部投递的后续 `agent` 调用（`deliver=true`）
  - 嵌套的请求者子智能体会话会收到内部后续注入（`deliver=false`），以便编排器在会话内综合子级结果
  - 如果嵌套的请求者子智能体会话已不存在，OpenClaw 会在可能时回退到该会话的请求者
- 对于顶层请求者会话，完成模式的直接投递会先解析任何已绑定的会话/线程路由和 hook 覆盖，然后从请求者会话存储的路由中补全缺失的渠道目标字段。这样即使完成来源只标识了渠道，也能确保完成消息投递到正确的聊天/话题中。
- 在构建嵌套完成结果时，子级完成聚合限定在当前请求者运行范围内，从而防止先前运行中陈旧的子级输出泄漏到当前通知中。
- 通知回复会在渠道适配器可用时保留线程/话题路由。
- 通知上下文会被规范化为稳定的内部事件块：
  - 来源（`subagent` 或 `cron`）
  - 子级会话 key/id
  - 通知类型 + 任务标签
  - 从运行时结果派生的 Status 行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最新可见助手文本中选择的结果内容；否则使用已清理的最新 tool/toolResult 文本；终态失败运行会报告失败 Status，而不会重放已捕获的回复文本
  - 一条后续指令，说明何时回复、何时保持静默
- `Status` 不是从模型输出推断的；它来自运行时结果信号。
- 超时时，如果子级只执行到了工具调用阶段，通知可以将这段历史压缩为简短的部分进度摘要，而不是重放原始工具输出。

通知负载末尾都会包含一行统计信息（即使被包装）：

- 运行时长（例如 `runtime 5m12s`）
- Token 用量（输入/输出/总计）
- 当配置了模型定价时的预估成本（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId` 和转录路径（这样主智能体可以通过 `sessions_history` 获取历史，或在磁盘上检查文件）
- 内部元数据仅用于编排；面向用户的回复应以正常助手语气重写。

`sessions_history` 是更安全的编排路径：

- 助手回顾会先被规范化：
  - 去除 thinking 标签
  - 去除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 去除纯文本工具调用 XML 负载块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括那些未正常闭合的截断负载
  - 去除降级后的工具调用/结果脚手架和历史上下文标记
  - 去除泄漏的模型控制 token，例如 `<|assistant|>`、其他 ASCII `<|...|>` token，以及全角 `<｜...｜>` 变体
  - 去除格式错误的 MiniMax 工具调用 XML
- 类似凭证/token 的文本会被脱敏
- 长内容块可能会被截断
- 非常大的历史可能会丢弃较旧的行，或将过大的某一行替换为 `[sessions_history omitted: message too large]`
- 当你需要完整逐字节转录时，回退方案是在磁盘上检查原始转录

## 工具策略（子智能体工具）

子智能体首先沿用父级或目标智能体相同的配置文件和工具策略流水线。之后，OpenClaw 会应用子智能体限制层。

在没有限制性 `tools.profile` 的情况下，子智能体会获得**除会话工具**和系统工具之外的**所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 仍然是一个有边界、已清理的回顾视图；它不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子级。

通过配置覆盖：

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
        // 如果设置 allow，则变为仅 allow 模式（deny 仍然优先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最终的仅 allow 过滤器。它可以收窄已经解析出的工具集，但不能把已被 `tools.profile` 移除的工具重新加回来。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。要让 coding 配置文件的子智能体使用浏览器自动化，请在配置文件阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当只有某一个智能体需要浏览器自动化时，使用按智能体配置的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用一个专用的进程内队列 lane：

- lane 名称：`subagent`
- 并发数：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 存活性与恢复

OpenClaw 不会将缺少 `endedAt` 视为子智能体仍然存活的永久性证据。超过陈旧运行窗口的未结束运行，将不再在 `/subagents list`、Status 摘要、后代完成门控以及每会话并发检查中计为活动/待处理。

Gateway 网关重启后，陈旧的未结束恢复运行会被清理，除非其子会话被标记为 `abortedLastRun: true`。这些因重启而中止的子会话仍可通过子智能体孤儿恢复流程恢复，该流程会在清除中止标记之前发送一条合成恢复消息。

如果子智能体启动因 Gateway 网关 `PAIRING_REQUIRED` / `scope-upgrade` 失败，请在编辑配对状态之前先检查 RPC 调用方。内部 `sessions_spawn` 协调应通过直接 loopback 共享 token/password 认证，以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 连接；该路径不依赖 CLI 的已配对设备 scope 基线。远程调用方、显式 `deviceIdentity`、显式设备 token 路径以及 browser/node 客户端仍需要正常的设备批准才能进行 scope 升级。

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止由其启动的所有活动子智能体运行，同时级联到嵌套子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联停止其子级。

## 限制

- 子智能体通知是**尽力而为**的。如果 Gateway 网关重启，待处理的“通知回传”工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；请将 `maxConcurrent` 视为一个安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md` + `TOOLS.md`（不包括 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。对于大多数使用场景，推荐使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活动子级数量（默认：5，范围：1–20）。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
- [智能体发送](/zh-CN/tools/agent-send)
