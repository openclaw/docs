---
read_when:
    - 你想通过智能体进行后台或并行工作
    - 你正在更改 sessions_spawn 或子智能体工具策略
    - 你正在实现线程绑定的子智能体会话，或对其进行故障排除
sidebarTitle: Sub-agents
summary: 启动隔离的后台智能体运行任务，并将结果回报到请求者聊天中
title: 子智能体
x-i18n:
    generated_at: "2026-05-04T05:37:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

子智能体是从现有智能体运行中生成的后台智能体运行。
它们在自己的会话（`agent:<agentId>:subagent:<uuid>`）中运行，并且
在完成时将其结果**通告**回请求方聊天
渠道。每个子智能体运行都会作为
[后台任务](/zh-CN/automation/tasks) 跟踪。

主要目标：

- 并行处理“研究 / 长任务 / 慢工具”工作，而不会阻塞主运行。
- 默认保持子智能体隔离（会话分离 + 可选沙箱隔离）。
- 让工具面难以被误用：子智能体默认**不会**获得会话工具。
- 支持为编排器模式配置嵌套深度。

<Note>
**成本说明：**默认情况下，每个子智能体都有自己的上下文和 token 用量。
对于繁重或重复的任务，请为子智能体设置更便宜的模型，
并让你的主智能体使用更高质量的模型。可通过
`agents.defaults.subagents.model` 或按智能体覆盖进行配置。当子级
确实需要请求方的当前转录时，智能体可以在那一次生成中请求
`context: "fork"`。线程绑定的子智能体会话默认使用
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

使用顶层 [`/steer <message>`](/zh-CN/tools/steer) 来 Steer 当前请求方会话的活动运行。当目标是子运行时，使用 `/subagents steer <id|#> <message>`。

`/subagents info` 会显示运行元数据（Status、时间戳、会话 ID、
转录路径、清理）。使用 `sessions_history` 获取有界的、
经过安全过滤的回忆视图；当你需要原始完整转录时，请检查磁盘上的转录路径。

### 线程绑定控制

这些命令适用于支持持久线程绑定的渠道。
请参阅下面的[支持线程的渠道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成行为

`/subagents spawn` 会以用户命令（而不是内部中继）的形式启动一个后台子智能体，
并在运行完成时向请求方聊天发送一条最终完成更新。

<AccordionGroup>
  <Accordion title="非阻塞、基于推送的完成">
    - 生成命令是非阻塞的；它会立即返回一个运行 ID。
    - 完成时，子智能体会向请求方聊天渠道通告一条摘要/结果消息。
    - 完成是基于推送的。生成后，不要为了等待它完成而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在调试或干预需要时按需检查 Status。
    - 完成时，OpenClaw 会尽力关闭该子智能体会话打开并被跟踪的浏览器标签页/进程，然后通告清理流程继续。

  </Accordion>
  <Accordion title="手动生成的投递韧性">
    - OpenClaw 会先尝试使用稳定的幂等键进行直接 `agent` 投递。
    - 如果请求方智能体的完成轮次失败、没有产生可见输出，或者返回了已捕获子级结果的明显不完整前缀，OpenClaw 会回退为从已捕获的子级结果直接投递完成内容。
    - 如果无法使用直接投递，它会回退为队列路由。
    - 如果队列路由仍然不可用，则通告会使用短暂的指数退避重试，然后才最终放弃。
    - 完成投递会保留已解析的请求方路由：线程绑定或对话绑定的完成路由可用时优先；如果完成来源只提供了渠道，OpenClaw 会从请求方会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）补齐缺失的目标/账户，从而让直接投递仍可工作。

  </Accordion>
  <Accordion title="完成移交元数据">
    交给请求方会话的完成移交是运行时生成的
    内部上下文（不是用户编写的文本），并包含：

    - `Result` — 最新可见的 `assistant` 回复文本，否则是经过清理的最新 tool/toolResult 文本。终止失败的运行不会复用已捕获的回复文本。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 紧凑的运行时/token 统计信息。
    - 一条投递指令，要求请求方智能体用正常的助手语气重写（而不是转发原始内部元数据）。

  </Accordion>
  <Accordion title="模式和 ACP 运行时">
    - `--model` 和 `--thinking` 会覆盖该特定运行的默认值。
    - 使用 `info`/`log` 在完成后检查详情和输出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久线程绑定会话，请使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode，或显式的 Codex ACP/acpx），当工具通告该运行时时，请使用带有 `runtime: "acp"` 的 `sessions_spawn`。调试完成或智能体间循环时，请参阅 [ACP 投递模型](/zh-CN/tools/acp-agents#delivery-model)。当启用 `codex` 插件时，除非用户明确要求 ACP/acpx，否则 Codex 聊天/线程控制应优先使用 `/codex ...` 而不是 ACP。
    - OpenClaw 会隐藏 `runtime: "acp"`，直到 ACP 已启用、请求方未被沙箱隔离，并且已加载 `acpx` 等后端插件。`runtime: "acp"` 需要外部 ACP harness ID，或一个 `runtime.type="acp"` 的 `agents.list[]` 条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认子智能体运行时。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子智能体会以隔离方式启动，除非调用方明确要求 fork
当前转录。

| 模式       | 使用时机                                                                                                                         | 行为                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、独立实现、慢工具工作，或任何可以在任务文本中简要说明的内容                           | 创建干净的子级转录。这是默认值，并且会降低 token 用量。  |
| `fork`     | 依赖当前对话、先前工具结果，或请求方转录中已有细微指令的工作 | 在子级启动前，将请求方转录分支到子级会话。 |

谨慎使用 `fork`。它用于对上下文敏感的委派，
不能替代编写清晰的任务提示。

## 工具：`sessions_spawn`

在全局 `subagent` 通道上以 `deliver: false` 启动子智能体运行，
然后运行通告步骤，并将通告回复发布到请求方
聊天渠道。

可用性取决于调用方的有效工具策略。`coding` 和
`full` 配置文件默认公开 `sessions_spawn`。`messaging` 配置文件
不公开；对于应委派工作的智能体，请添加 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` 或使用 `tools.profile: "coding"`。
渠道/组、提供商、沙箱，以及按智能体的允许/拒绝策略仍可
在配置文件阶段后移除该工具。请在同一
会话中使用 `/tools` 确认有效工具列表。

**默认值：**

- **模型：**继承调用方，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）；显式的 `sessions_spawn.model` 仍然优先。
- **Thinking：**继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）；显式的 `sessions_spawn.thinking` 仍然优先。
- **运行超时：**如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 会在已设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

### 工具参数

<ParamField path="task" type="string" required>
  子智能体的任务描述。
</ParamField>
<ParamField path="label" type="string">
  可选的人类可读标签。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允许时，在另一个智能体 ID 下生成。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅用于外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或显式请求的 Codex ACP/acpx），以及 `runtime.type` 为 `acp` 的 `agents.list[]` 条目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  仅 ACP。当 `runtime: "acp"` 时恢复现有 ACP harness 会话；原生子智能体生成会忽略此项。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  仅 ACP。当 `runtime: "acp"` 时，将 ACP 运行输出流式传输到父会话；原生子智能体生成请省略。
</ParamField>
<ParamField path="model" type="string">
  覆盖子智能体模型。无效值会被跳过，子智能体会在默认模型上运行，并在工具结果中给出警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子智能体运行的 thinking 级别。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  已设置时默认为 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`。设置后，子智能体运行会在 N 秒后中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  当为 `true` 时，为此子智能体会话请求渠道线程绑定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认会变为 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 会在通告后立即归档（仍会通过重命名保留转录）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 会拒绝生成，除非目标子级运行时已被沙箱隔离。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 会将请求方的当前转录分支到子级会话。仅限原生子智能体。线程绑定生成默认为 `fork`；非线程生成默认为 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受渠道投递参数（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。对于投递，请从已生成的运行使用
`message`/`sessions_send`。
</Warning>

## 线程绑定会话

当渠道启用线程绑定时，子智能体可以保持绑定到
一个线程，因此该线程中的后续用户消息会继续路由到
同一个子智能体会话。

### 支持线程的渠道

**Discord** 目前是唯一受支持的渠道。它支持
持久线程绑定的子智能体会话（带有
`thread: true` 的 `sessions_spawn`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`），以及适配器键
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours` 和
`channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="Spawn">
    使用 `thread: true`（以及可选的 `mode: "session"`）调用 `sessions_spawn`。
  </Step>
  <Step title="Bind">
    OpenClaw 会在活动渠道中为该会话目标创建或绑定一个线程。
  </Step>
  <Step title="Route follow-ups">
    该线程中的回复和后续消息会路由到已绑定的会话。
  </Step>
  <Step title="Inspect timeouts">
    使用 `/session idle` 检查/更新非活动自动取消聚焦，并使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="Detach">
    使用 `/unfocus` 手动分离。
  </Step>
</Steps>

### 手动控制

| 命令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 将当前线程（或创建一个线程）绑定到子智能体/会话目标                   |
| `/unfocus`         | 移除当前已绑定线程的绑定                                               |
| `/agents`          | 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）                  |
| `/session idle`    | 检查/更新空闲自动取消聚焦（仅限已聚焦的绑定线程）                    |
| `/session max-age` | 检查/更新硬性上限（仅限已聚焦的绑定线程）                            |

### 配置开关

- **全局默认值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **渠道覆盖和生成自动绑定键**因适配器而异。参见上方的[支持线程的渠道](#thread-supporting-channels)。

有关当前适配器详情，请参见[配置参考](/zh-CN/gateway/configuration-reference)和
[斜杠命令](/zh-CN/tools/slash-commands)。

### 允许列表

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可通过显式 `agentId` 作为目标的智能体 ID 列表（`["*"]` 允许任意目标）。默认值：仅请求方智能体。如果你设置了列表，并且仍希望请求方使用 `agentId` 生成自身，请将请求方 ID 包含在列表中。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求方智能体未设置自己的 `subagents.allowAgents` 时使用的默认目标智能体允许列表。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。按智能体覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果请求方会话是沙箱隔离的，`sessions_spawn` 会拒绝会以非沙箱方式运行的目标。

### 设备发现

使用 `agents_list` 查看当前允许用于 `sessions_spawn` 的智能体 ID。响应包含每个列出智能体的有效模型和嵌入式运行时元数据，因此调用方可以区分 Pi、Codex 应用服务器以及其他已配置的原生运行时。

### 自动归档

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认 `60`）。
- 归档使用 `sessions.delete`，并将转录记录重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在公告后立即归档（仍会通过重命名保留转录记录）。
- 自动归档是尽力而为；如果 Gateway 网关重启，待处理计时器会丢失。
- `runTimeoutSeconds` **不会**自动归档；它只会停止运行。会话会一直保留到自动归档。
- 自动归档同样适用于深度 1 和深度 2 会话。
- 浏览器清理与归档清理是分开的：当运行结束时，会尽力关闭已跟踪的浏览器标签页/进程，即使转录记录/会话记录被保留。

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

| 深度 | 会话键形态                                   | 角色                                      | 可以生成？                    |
| ---- | -------------------------------------------- | ----------------------------------------- | ----------------------------- |
| 0    | `agent:<id>:main`                            | 主智能体                                  | 始终可以                      |
| 1    | `agent:<id>:subagent:<uuid>`                 | 子智能体（允许深度 2 时为编排器）         | 仅当 `maxSpawnDepth >= 2`     |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子智能体（叶子工作者）                  | 永不可以                      |

### 公告链

结果会沿链路向上流动：

1. 深度 2 工作者完成 → 向其父级（深度 1 编排器）公告。
2. 深度 1 编排器接收公告，综合结果，完成 → 向主智能体公告。
3. 主智能体接收公告并交付给用户。

每一级只会看到其直接子级的公告。

<Note>
**操作指南：**启动一次子任务工作，然后等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` 睡眠命令构建轮询循环。`sessions_list` 和 `/subagents list` 会让子会话关系专注于实时工作：实时子级保持附加，已结束子级会在短暂的最近窗口内保持可见，过期的仅存储子级链接会在其新鲜度窗口之后被忽略。这可以防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后重新唤起幽灵子级。如果子级完成事件在你已经发送最终答案后到达，正确的后续回复是精确的静默令牌 `NO_REPLY` / `no_reply`。
</Note>

### 按深度划分的工具策略

- 角色和控制范围会在生成时写入会话元数据。这可以防止扁平或恢复的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）：**获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子级。其他会话/系统工具仍会被拒绝。
- **深度 1（叶子，当 `maxSpawnDepth == 1` 时）：**没有会话工具（当前默认行为）。
- **深度 2（叶子工作者）：**没有会话工具；`sessions_spawn` 在深度 2 始终被拒绝。不能继续生成子级。

### 按智能体生成限制

每个智能体会话（任意深度）同一时间最多可以有 `maxChildrenPerAgent`（默认 `5`）个活动子级。这可以防止单个编排器不受控地扇出。

### 级联停止

停止深度 1 编排器会自动停止其所有深度 2 子级：

- 主聊天中的 `/stop` 会停止所有深度 1 智能体，并级联到它们的深度 2 子级。
- `/subagents kill <id>` 会停止特定子智能体，并级联到其子级。
- `/subagents kill all` 会停止请求方的所有子智能体并级联。

## 身份验证

子智能体身份验证按**智能体 ID**解析，而不是按会话类型解析：

- 子智能体会话键是 `agent:<agentId>:subagent:<uuid>`。
- 身份验证存储会从该智能体的 `agentDir` 加载。
- 主智能体的身份验证配置文件会作为**回退**合并；发生冲突时，智能体配置文件会覆盖主配置文件。

合并是增量式的，因此主配置文件始终可作为回退使用。尚不支持每个智能体完全隔离的身份验证。

## 公告

子智能体通过公告步骤回报：

- 公告步骤在子智能体会话内运行（不是请求方会话）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新的助手文本是精确的静默令牌 `NO_REPLY` / `no_reply`，即使之前存在可见进度，也会抑制公告输出。

交付取决于请求方深度：

- 顶层请求方会话使用带外部交付的后续 `agent` 调用（`deliver=true`）。
- 嵌套请求方子智能体会话接收内部后续注入（`deliver=false`），以便编排器在会话内综合子级结果。
- 如果嵌套请求方子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求方。

对于顶层请求方会话，完成模式的直接交付会先解析任何已绑定的对话/线程路由和钩子覆盖，然后从请求方会话存储的路由中填充缺失的渠道目标字段。即使完成来源只标识渠道，这也能将完成结果保持在正确的聊天/主题中。

构建嵌套完成发现时，子级完成聚合仅限于当前请求方运行，防止旧的先前运行子级输出泄漏到当前公告中。当渠道适配器可用线程/主题路由时，公告回复会保留这些路由。

### 公告上下文

公告上下文会标准化为稳定的内部事件块：

| 字段     | 来源                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------- |
| 来源     | `subagent` 或 `cron`                                                                                      |
| 会话 ID  | 子会话键/ID                                                                                               |
| 类型     | 公告类型 + 任务标签                                                                                       |
| Status   | 从运行时结果派生（`success`、`error`、`timeout` 或 `unknown`），**不是**从模型文本推断                  |
| 结果内容 | 最新可见的助手文本，否则为经过清理的最新工具/toolResult 文本                                             |
| 后续     | 描述何时回复与何时保持静默的指令                                                                         |

终端失败运行会报告失败状态，而不会重放捕获的回复文本。超时时，如果子级只完成了工具调用，公告可以将该历史折叠为简短的部分进度摘要，而不是重放原始工具输出。

### 统计行

公告载荷在末尾包含统计行（即使被换行包裹）：

- 运行时（例如 `runtime 5m12s`）。
- 令牌用量（输入/输出/总计）。
- 配置模型定价时的预估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和转录记录路径，以便主智能体可以通过 `sessions_history` 获取历史，或检查磁盘上的文件。

内部元数据仅用于编排；面向用户的回复应改写为普通助手语气。

### 为什么优先使用 `sessions_history`

`sessions_history` 是更安全的编排路径：

- 助手回忆会先标准化：剥离思考标签；剥离 `<relevant-memories>` / `<relevant_memories>` 脚手架；剥离纯文本工具调用 XML 载荷块（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括从未干净关闭的截断载荷；剥离降级的工具调用/结果脚手架和历史上下文标记；剥离泄漏的模型控制令牌（`<|assistant|>`、其他 ASCII `<|...|>`、全角 `<｜...｜>`）；剥离格式错误的 MiniMax 工具调用 XML。
- 类似凭证/令牌的文本会被遮盖。
- 长块可能会被截断。
- 非常大的历史可能会丢弃较旧的行，或用 `[sessions_history omitted: message too large]` 替换过大的行。
- 当你需要完整逐字节转录记录时，原始磁盘转录记录检查是回退方案。

## 工具策略

子智能体首先使用与父智能体或目标智能体相同的 profile 和工具策略管线。之后，OpenClaw 会应用子智能体限制层。

如果没有限制性的 `tools.profile`，子智能体会获得**除会话工具**和系统工具之外的所有工具：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

这里的 `sessions_history` 也仍然是有界且经过清理的回忆视图，不是原始 transcript dump。

当 `maxSpawnDepth >= 2` 时，深度为 1 的编排子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，这样它们就可以管理自己的子级。

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

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以收窄已经解析出的工具集合，但不能**加回**被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。要让 coding-profile 子智能体使用浏览器自动化，请在 profile 阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当只有一个智能体需要获得浏览器自动化时，使用按智能体配置的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用专用的进程内队列通道：

- **通道名称：** `subagent`
- **并发数：** `agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 活跃性和恢复

OpenClaw 不会把缺少 `endedAt` 当作子智能体仍然存活的永久证明。超过过期运行窗口的未结束运行，不再在 `/subagents list`、状态摘要、后代完成门控和按会话并发检查中计为 active/pending。

Gateway 网关重启后，过期的未结束恢复运行会被清理，除非它们的子会话被标记为 `abortedLastRun: true`。这些因重启而中止的子会话仍然可以通过子智能体孤儿恢复流程恢复，该流程会先发送一条合成 resume 消息，然后清除中止标记。

自动重启恢复按每个子会话设有边界。如果同一个子智能体子级在快速重新卡住窗口内反复被接受进行孤儿恢复，OpenClaw 会在该会话上持久化一个恢复 tombstone，并在后续重启时停止自动恢复它。运行 `openclaw tasks maintenance --apply` 来协调任务记录，或运行 `openclaw doctor --fix` 来清除 tombstone 会话上的过期中止恢复标志。

<Note>
如果子智能体 spawn 因 Gateway 网关 `PAIRING_REQUIRED` / `scope-upgrade` 失败，请先检查 RPC 调用方，再编辑配对状态。内部 `sessions_spawn` 协调应通过直接 loopback 共享令牌/密码认证，以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 连接；该路径不依赖 CLI 的已配对设备 scope baseline。远程调用方、显式 `deviceIdentity`、显式设备令牌路径以及 browser/node 客户端，在 scope 升级时仍然需要常规设备批准。
</Note>

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止由它 spawn 的任何活跃子智能体运行，同时级联到嵌套子级。
- `/subagents kill <id>` 会停止指定子智能体，并级联到其子级。

## 限制

- 子智能体公告是**尽力而为**的。如果 Gateway 网关重启，待处理的“announce back”工作会丢失。
- 子智能体仍然共享同一个 Gateway 网关进程资源；请把 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md` + `TOOLS.md`（不包括 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数用例建议使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活跃子级数量（默认 `5`，范围 `1–20`）。

## 相关

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [智能体发送](/zh-CN/tools/agent-send)
- [后台任务](/zh-CN/automation/tasks)
- [多智能体沙箱工具](/zh-CN/tools/multi-agent-sandbox-tools)
