---
read_when:
    - 你希望通过智能体执行后台或并行工作
    - 你正在更改 sessions_spawn 或子智能体工具策略
    - 你正在实现或排查绑定到线程的子智能体会话
sidebarTitle: Sub-agents
summary: 生成隔离的后台智能体运行，并将结果通知回请求者聊天
title: 子智能体
x-i18n:
    generated_at: "2026-07-05T11:46:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 937ff806dc0dc5f5de5e80b03835131d66c37762cd2be215b17d622720183379
    source_path: tools/subagents.md
    workflow: 16
---

子智能体是从现有智能体运行中生成的后台智能体运行。
每个子智能体都在自己的会话（`agent:<agentId>:subagent:<uuid>`）中运行，
完成后会将结果**告知**请求方聊天渠道。
每次子智能体运行都会作为[后台任务](/zh-CN/automation/tasks)被跟踪。

目标：

- 并行处理研究、长任务和缓慢的工具工作，而不阻塞主运行。
- 默认保持子智能体隔离（会话分离，可选沙箱隔离）。
- 让工具表面难以被误用：子智能体默认**不会**获得会话或消息工具。
- 支持可配置的嵌套深度，以适配编排器模式。

<Note>
**成本注意事项：**默认情况下，每个子智能体都有自己的上下文和 token 用量。
对于繁重或重复的任务，可以通过 `agents.defaults.subagents.model`
或按智能体覆盖项，为子智能体设置更便宜的模型，同时让主智能体使用更高质量的模型。
当子智能体确实需要请求方当前转录时，使用 `context: "fork"` 生成它。
绑定到线程的子智能体会话默认使用 `context: "fork"`，
因为它们会把当前对话分支到一个后续线程中。
</Note>

## 斜杠命令

`/subagents` 会检查**当前会话**的子智能体运行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 显示运行元数据（状态、时间戳、会话 ID、
转录路径、清理）。`/subagents log` 会打印某次运行最近的聊天轮次；
添加 `tools` token 可包含工具调用/结果消息（默认省略）。
在智能体轮次中，可使用 `sessions_history` 获取有界且经过安全过滤的回忆视图，
或检查磁盘上的转录路径以查看原始完整转录。

### 线程绑定控制

这些命令适用于具有持久线程绑定的渠道。见下方
[支持线程的渠道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成行为

智能体使用 `sessions_spawn` 工具启动后台子智能体。
完成结果会作为内部父会话事件返回；父/请求方智能体决定是否需要面向用户的更新。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` 是非阻塞的；它会立即返回运行 ID。
    - 完成时，子智能体会向父/请求方会话回报。
    - 需要子结果的智能体轮次应在生成所需工作后调用 `sessions_yield`。这会结束当前轮次，并让完成事件作为下一条模型可见消息到达。
    - 完成是推送式的。生成后，不要为了等待它结束而循环轮询 `/subagents list`、`sessions_list` 或 `sessions_history`；仅在调试时按需检查状态。
    - 子输出是供请求方智能体综合的报告/证据。它不是用户编写的指令文本，不能覆盖 system、developer 或 user 策略。
    - 完成时，OpenClaw 会尽力关闭该子智能体会话打开且被跟踪的浏览器标签页/进程，然后继续告知清理流程。

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw 会通过带有稳定幂等键的 `agent` 轮次，将完成结果交还给请求方会话。
    - 如果请求方运行仍处于活跃状态，OpenClaw 会先尝试唤醒/Steer 该运行，而不是启动第二条可见回复路径。
    - 如果无法唤醒活跃请求方，OpenClaw 会回退到带相同完成上下文的请求方智能体交接，而不是丢弃告知。
    - 即使父智能体决定不需要可见的用户更新，成功的父交接也会完成子智能体交付。
    - 原生子智能体不会获得消息工具。它们会向父/请求方智能体返回普通 assistant 文本；人类可见回复仍由父/请求方智能体的常规交付策略负责。
    - 如果无法使用直接交接，交付会回退到队列路由，然后在最终放弃前对告知进行短暂的指数退避重试。
    - 交付会保留已解析的请求方路由：当可用时，绑定到线程或绑定到对话的完成路由优先。如果完成来源只提供渠道，OpenClaw 会从请求方会话的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）填补缺失的目标/账号，因此直接交付仍可工作。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    交给请求方会话的完成交接是运行时生成的内部上下文
    （不是用户编写的文本），并包含：

    - `Result` — 子智能体最新的可见 `assistant` 回复文本。工具/toolResult 输出不会被提升为子结果。终端失败运行不会复用捕获的回复文本。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 紧凑的运行时/token 统计。
    - 一条审查指令，要求请求方智能体验证结果，然后再决定原始任务是否完成。
    - 后续指导，要求请求方智能体在子结果留下更多操作时继续任务或记录后续事项。
    - 面向无更多操作路径的最终更新指令，使用正常 assistant 语气编写，不转发原始内部元数据。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` 和 `--thinking` 会覆盖该特定运行的默认值。
    - 使用 `info`/`log` 在完成后检查详细信息和输出。
    - 对于持久绑定到线程的会话，使用带 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 如果请求方渠道不支持线程绑定，请使用 `mode: "run"`，而不是重试不可能成功的线程绑定组合。
    - 对于 ACP harness 会话（Claude Code、Gemini CLI、OpenCode，或显式 Codex ACP/acpx），当工具声明该运行时时，使用带 `runtime: "acp"` 的 `sessions_spawn`。调试完成结果或智能体到智能体循环时，见 [ACP 交付模型](/zh-CN/tools/acp-agents#delivery-model)。启用 `codex` 插件时，除非用户明确要求 ACP/acpx，否则 Codex 聊天/线程控制应优先使用 `/codex ...` 而不是 ACP。
    - OpenClaw 会隐藏 `runtime: "acp"`，直到 ACP 已启用、请求方未被沙箱隔离，并且已加载诸如 `acpx` 之类的后端插件。`runtime: "acp"` 需要外部 ACP harness ID，或带有 `runtime.type="acp"` 的 `agents.list[]` 条目；对于来自 `agents_list` 的普通 OpenClaw 配置智能体，请使用默认子智能体运行时。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子智能体默认隔离启动，除非调用方明确要求 fork
当前转录。

| 模式       | 使用场景                                                                                                                         | 行为                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、独立实现、缓慢工具工作，或任何可以在任务文本中简要说明的内容                           | 创建干净的子转录。这是默认值，并可降低 token 使用量。  |
| `fork`     | 依赖当前对话、先前工具结果，或请求方转录中已有细微指令的工作 | 在子智能体启动前，将请求方转录分支到子会话中。 |

谨慎使用 `fork`。它用于对上下文敏感的委派，
不能替代编写清晰的任务提示。

## 工具：`sessions_spawn`

在全局 `subagent` 通道上以 `deliver: false` 启动子智能体运行，
然后运行告知步骤，并将告知回复发布到请求方聊天渠道。

可用性取决于调用方的有效工具策略。内置
`coding` 配置文件包含 `sessions_spawn`；`messaging` 和 `minimal`
不包含。`full` 允许所有工具。对于配置文件更窄但仍应委派工作的
智能体，请添加 `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`，或使用 `tools.profile: "coding"`。
渠道/群组、提供商、沙箱以及按智能体配置的允许/拒绝策略，
仍可能在配置文件阶段之后移除该工具。请从同一会话使用 `/tools`
确认有效工具列表。

**默认值：**

- **模型：**原生子智能体会继承调用方，除非你设置了 `agents.defaults.subagents.model`（或按智能体设置 `agents.list[].subagents.model`）。ACP 运行时生成在存在配置的子智能体模型时使用相同模型；否则 ACP harness 会保留自己的默认值。显式的 `sessions_spawn.model` 仍然优先。
- **Thinking：**原生子智能体会继承调用方，除非你设置了 `agents.defaults.subagents.thinking`（或按智能体设置 `agents.list[].subagents.thinking`）。ACP 运行时生成还会为所选模型应用 `agents.defaults.models["provider/model"].params.thinking`。显式的 `sessions_spawn.thinking` 仍然优先。
- **运行超时：**设置后，OpenClaw 会使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。`sessions_spawn` 不接受按调用的超时覆盖。
- **任务交付：**原生子智能体会在第一条可见的 `[Subagent Task]` 消息中收到被委派的任务。子智能体 system prompt 携带运行时规则和路由上下文，而不是任务的隐藏副本。

已接受的原生子智能体生成会在工具结果中包含已解析的子模型元数据：
`resolvedModel` 包含已应用的模型引用，
`resolvedProvider` 在引用带前缀时包含提供商前缀。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示指导；它不会改变工具策略或强制委派。

- `suggest`（默认）：保留标准提示，建议对较大或较慢的工作使用子智能体。
- `prefer`：告诉主智能体保持响应，并通过 `sessions_spawn` 委派比直接回复更复杂的任何事项。

按智能体覆盖：`agents.list[].subagents.delegationMode`。

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
  可选的稳定标识，用于在后续状态输出中识别特定子项。必须匹配 `[a-z][a-z0-9_-]{0,63}`，且不能是 `last` 或 `all` 等保留目标。
</ParamField>
<ParamField path="label" type="string">
  可选的人类可读标签。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允许时，在另一个已配置的智能体 id 下生成。
</ParamField>
<ParamField path="cwd" type="string">
  子运行的可选任务工作目录。原生子智能体仍会从目标智能体工作区加载引导文件；`cwd` 只会更改运行时工具和 CLI harness 执行委派工作的目录。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅用于外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或显式请求的 Codex ACP/acpx），以及 `runtime.type` 为 `acp` 的 `agents.list[]` 条目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  仅 ACP。`runtime: "acp"` 时恢复现有 ACP harness 会话；对原生子智能体生成会被忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  仅 ACP。`runtime: "acp"` 时将 ACP 运行输出流式传输到父会话；原生子智能体生成时省略。
</ParamField>
<ParamField path="model" type="string">
  覆盖子智能体模型。无效值会被跳过，子智能体会使用默认模型运行，并在工具结果中给出警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子智能体运行的思考级别。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  当为 `true` 时，为此子智能体会话请求渠道线程绑定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认值变为 `session`。`mode: "session"` 要求 `thread: true`。
  如果请求方渠道无法使用线程绑定，请改用 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 会在公告后立即归档会话（仍通过重命名保留转录记录）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 会拒绝生成，除非目标子运行时处于沙箱隔离状态。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 会将请求方的当前转录记录分支到子会话。仅原生子智能体。线程绑定生成默认使用 `fork`；非线程生成默认使用 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受渠道投递参数（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子智能体会将
其最新的助手轮次回报给请求方；外部投递仍由父/请求方智能体负责。
</Warning>

### 任务名称和目标定位

`taskName` 是面向模型的编排标识，不是会话键。
当协调器后续可能需要检查该子项时，可使用它来提供稳定的子项名称，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目标解析接受精确的 `taskName` 匹配和无歧义前缀。
匹配范围限定在编号 `/subagents` 目标使用的同一个活跃/近期目标窗口内，
因此已完成的过期子项不会让复用的标识变得有歧义。如果两个活跃或近期子项共享同一个
`taskName`，则目标有歧义；请改用列表索引、会话键或
运行 id。

保留目标 `last` 和 `all` 不是有效的 `taskName` 值，
因为它们已有控制含义。

## 工具：`sessions_yield`

结束当前模型轮次并等待运行时事件，主要是
子智能体完成事件，作为下一条消息到达。当请求方在这些完成事件到达之前无法生成最终
答案时，请在生成必需的子项工作后使用它。

`sessions_yield` 是等待原语。不要仅为检测子项完成而用
对 `subagents`、`sessions_list`、`sessions_history` 的轮询循环、shell
`sleep` 或进程轮询来替代它。

仅当会话的有效工具列表包含 `sessions_yield` 时才使用它。
某些最小化或自定义工具配置文件可能会暴露 `sessions_spawn` 和
`subagents`，但不暴露 `sessions_yield`；在这种情况下，不要为了等待完成而发明
轮询循环。

当存在活跃子项时，OpenClaw 会将一个紧凑的运行时生成
`Active Subagents` 提示块注入普通轮次，让请求方无需轮询即可看到
当前子会话、运行 id、状态、标签、任务和
`taskName` 别名。该块中的任务和标签字段会作为数据加引号，而不是作为指令，
因为它们可能源自用户/模型提供的生成参数。

## 工具：`subagents`

列出请求方会话拥有的已生成子智能体运行。其范围限定为
当前请求方；子项只能看到自己控制的子项。

使用 `subagents` 进行按需状态查看和调试。使用 `sessions_yield` 来
等待完成事件。

## 线程绑定会话

当某个渠道启用线程绑定时，子智能体可以保持绑定到
某个线程，以便该线程中的后续用户消息继续路由到
同一个子智能体会话。

### 支持线程的渠道

当渠道注册了会话绑定适配器时，它支持持久线程绑定的子智能体会话
（带有 `thread: true` 的 `sessions_spawn`）。具备该支持的内置渠道：**Discord**、
**iMessage**、**Matrix** 和 **Telegram**。Discord 和 Matrix 默认会
创建子线程；Telegram 和 iMessage 默认会绑定
当前会话。使用每个渠道的 `threadBindings` 配置键来控制
启用、超时和 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="生成">
    使用带有 `thread: true` 的 `sessions_spawn`（也可选择 `mode: "session"`）。
  </Step>
  <Step title="绑定">
    OpenClaw 在活跃渠道中为该会话目标创建或绑定线程。
  </Step>
  <Step title="路由后续消息">
    该线程中的回复和后续消息会路由到已绑定会话。
  </Step>
  <Step title="检查超时">
    使用 `/session idle` 检查/更新不活跃自动取消聚焦，并使用
    `/session max-age` 控制硬上限。
  </Step>
  <Step title="分离">
    使用 `/unfocus` 手动分离。
  </Step>
</Steps>

### 手动控制

| 命令               | 效果                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 将当前线程（或创建一个线程）绑定到子智能体/会话目标                                      |
| `/unfocus`         | 移除当前已绑定线程的绑定                                                                  |
| `/agents`          | 列出活跃运行和绑定状态（`binding:<id>`、`unbound` 或 `bindings unavailable`）             |
| `/session idle`    | 检查/更新空闲自动取消聚焦（仅限已聚焦的绑定线程）                                        |
| `/session max-age` | 检查/更新硬上限（仅限已聚焦的绑定线程）                                                  |

### 配置开关

- **全局默认值：**`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **渠道覆盖和生成自动绑定键**因适配器而异。请参阅上方的[支持线程的渠道](#thread-supporting-channels)。

请参阅[配置参考](/zh-CN/gateway/configuration-reference)和
[Slash commands](/zh-CN/tools/slash-commands)了解当前适配器详情。

### 允许列表

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可通过显式 `agentId` 定位的已配置智能体 id 列表（`["*"]` 允许任何已配置目标）。默认值：仅请求方智能体。如果你设置了列表，并且仍希望请求方通过 `agentId` 生成自身，请将请求方 id 包含在列表中。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求方智能体未设置自己的 `subagents.allowAgents` 时使用的默认已配置目标智能体允许列表。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件）。按智能体覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway 网关 `agent` 公告投递尝试的每次调用超时。值为正整数毫秒，并会被限制在平台安全计时器最大值以内。瞬时重试可能让总公告等待时间长于一次配置超时。
</ParamField>

如果请求方会话处于沙箱隔离状态，`sessions_spawn` 会拒绝
将以非沙箱隔离方式运行的目标。

### 设备发现

使用 `agents_list` 查看当前允许用于
`sessions_spawn` 的智能体 id。响应包含每个列出智能体的有效
模型和嵌入式运行时元数据，因此调用方可以区分 OpenClaw、Codex
应用服务器以及其他已配置的原生运行时。

`allowAgents` 条目必须指向 `agents.list[]` 中已配置的智能体 id。
`["*"]` 表示任何已配置目标智能体加上请求方。如果某个智能体配置
已删除，但其 id 仍留在 `allowAgents` 中，`sessions_spawn` 会拒绝该 id，
并且 `agents_list` 会省略它。运行 `openclaw doctor --fix` 清理过期
允许列表条目，或在目标应在继承默认值的同时仍可被生成时添加一个最小
`agents.list[]` 条目。

### 自动归档

- 子智能体会话会在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认 `60`）。
- 归档使用 `sessions.delete`，并将转录记录重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 会在公告后立即归档（仍通过重命名保留转录记录）。
- 自动归档是尽力而为；如果 Gateway 网关重启，待处理计时器会丢失。
- 已配置的运行超时**不会**自动归档；它们只会停止运行。会话会保留到自动归档。
- 自动归档同样适用于深度 1 和深度 2 会话。
- 浏览器清理与归档清理分开：被跟踪的浏览器标签页/进程会在运行完成时尽力关闭，即使转录记录/会话记录被保留。

## 嵌套子智能体

默认情况下，子智能体不能生成自己的子智能体
（`maxSpawnDepth: 1`）。设置 `maxSpawnDepth: 2` 可启用一级
嵌套，即**编排器模式**：主项 → 编排器子智能体 →
工作子智能体的子智能体。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子智能体生成子项（默认值：1，范围 1-5）
        maxChildrenPerAgent: 5, // 每个智能体会话的最大活跃子项数（默认值：5，范围 1-20）
        maxConcurrent: 8, // 全局并发通道上限（默认值：8）
        runTimeoutSeconds: 900, // sessions_spawn 的默认超时（0 = 无超时）
        announceTimeoutMs: 120000, // 每次调用的 Gateway 网关公告超时
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形态                                 | 角色                                                | 可生成？                         |
| ----- | -------------------------------------------- | --------------------------------------------------- | -------------------------------- |
| 0     | `agent:<id>:main`                            | 主智能体                                            | 始终                             |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子智能体（允许深度 2 时为编排器）                   | 仅当 `maxSpawnDepth >= 2`        |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子级子智能体（叶工作器）                            | 从不                             |

### 宣告链

结果会沿链路向上回传：

1. 深度 2 工作器完成 → 向其父级（深度 1 编排器）宣告。
2. 深度 1 编排器接收宣告、合成结果、完成 → 向主智能体宣告。
3. 主智能体接收宣告并交付给用户。

每一层只能看到其直接子级的宣告。

<Note>
**操作指导：**启动子级工作一次，然后等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` 睡眠命令构建轮询循环。`sessions_list` 和 `/subagents list` 会让子会话关系聚焦于实时工作：实时子级保持附加，已结束子级会在较短的近期窗口内保持可见，而陈旧的仅存储子级链接会在其新鲜度窗口后被忽略。这会防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后复活幽灵子级。如果你已发送最终答复后才收到子级完成事件，正确的后续处理是精确的静默令牌 `NO_REPLY` / `no_reply`。
</Note>

### 按深度划分的工具策略

- 角色和控制范围会在生成时写入会话元数据。这样可以防止扁平或恢复的会话键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2` 时）：**获得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便它可以生成子级并检查其状态。其他会话/系统工具仍被拒绝。
- **深度 1（叶级，当 `maxSpawnDepth == 1` 时）：**没有会话工具（当前默认行为）。
- **深度 2（叶工作器）：**没有会话工具，`sessions_spawn` 在深度 2 始终被拒绝。不能继续生成子级。

### 每个智能体的生成限制

每个智能体会话（任意深度）同一时间最多可以有 `maxChildrenPerAgent`（默认 `5`）个活跃子级。这可以防止单个编排器出现失控扇出。

### 级联停止

停止深度 1 编排器会自动停止其所有深度 2 子级：

- 主聊天中的 `/stop` 会停止所有深度 1 智能体，并级联到它们的深度 2 子级。

## 身份验证

子智能体身份验证按 **agent id** 解析，而不是按会话类型解析：

- 子智能体会话键为 `agent:<agentId>:subagent:<uuid>`。
- 凭证存储从该智能体的 `agentDir` 加载。
- 主智能体的身份验证配置文件会作为**回退**合并进来；冲突时智能体配置文件覆盖主配置文件。

该合并是增量式的，因此主配置文件始终可作为回退使用。尚不支持每个智能体完全隔离的身份验证。

## 宣告

子智能体通过宣告步骤回报：

- 宣告步骤在子智能体会话内运行（不是请求者会话）。
- 如果子智能体精确回复 `ANNOUNCE_SKIP`，则不会发布任何内容。
- 如果最新助手文本是精确的静默令牌 `NO_REPLY` / `no_reply`，即使此前存在可见进度，也会抑制宣告输出。

交付取决于请求者深度：

- 顶层请求者会话使用带外部交付的后续 `agent` 调用（`deliver=true`）。
- 嵌套请求者子智能体会话会接收内部后续注入（`deliver=false`），以便编排器在会话内合成子级结果。
- 如果嵌套请求者子智能体会话已不存在，OpenClaw 会在可用时回退到该会话的请求者。

对于顶层请求者会话，完成模式的直接交付会先解析任何绑定的对话/线程路由和钩子覆盖，然后从请求者会话存储的路由中填充缺失的渠道目标字段。这样即使完成来源只标识了渠道，也能让完成消息留在正确的聊天/主题中。

在构建嵌套完成发现时，子级完成聚合会限定在当前请求者运行范围内，防止陈旧的先前运行子级输出泄漏到当前宣告中。当渠道适配器可用时，宣告回复会保留线程/主题路由。

### 宣告上下文

宣告上下文会规范化为稳定的内部事件块：

| 字段           | 来源                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| 来源           | `subagent` 或 `cron`                                                                                      |
| 会话 ID        | 子会话键/ID                                                                                               |
| 类型           | 宣告类型 + 任务标签                                                                                       |
| 状态           | 从运行时结果派生（`ok`、`error`、`timeout` 或 `unknown`）— **不是**从模型文本推断 |
| 结果内容       | 来自子级的最新可见助手文本                                                                                |
| 后续处理       | 描述何时回复与何时保持静默的指令                                                                          |

终端失败运行会报告失败状态，而不会重放捕获的回复文本。工具/工具结果输出不会提升为子级结果文本。

### 统计行

宣告载荷会在末尾包含统计行（即使被包装）：

- 运行时（例如 `runtime 5m12s`）。
- 令牌用量（输入/输出/总计）。
- 配置了模型价格时的预估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和转录路径，以便主智能体可以通过 `sessions_history` 获取历史记录，或检查磁盘上的文件。

内部元数据仅用于编排；面向用户的回复应改写为普通助手语气。

### 为什么优先使用 `sessions_history`

`sessions_history` 是在智能体轮次内读取子级转录时更安全的编排路径：

- 即使通用日志脱敏已禁用，也会遮盖类似凭证/令牌的文本。
- 截断长文本块（每块 4000 个字符），并丢弃思维签名、推理重放载荷和内联图像数据。
- 强制执行 80 KB 响应上限；过大的行会替换为 `[sessions_history omitted: message too large]`。
- 当存在 `nextOffset` 时，使用它向后分页查看更早的转录窗口。
- `sessions_history` **不会**从消息文本中剥离推理标签、`<relevant-memories>` 脚手架或工具调用 XML，而是返回接近原始转录形态的结构化内容块，只是经过脱敏并限制大小。`/subagents log` 会应用更重的散文清理器（剥离推理标签、记忆脚手架和工具调用 XML），因为它渲染的是普通聊天行，而不是结构化块。
- 当你需要完整逐字节转录时，原始磁盘转录检查是回退方案。

## 工具策略

子智能体首先使用与父级或目标智能体相同的配置文件和工具策略管线。之后，OpenClaw 应用子智能体限制层。

无论深度或角色如何，子智能体始终失去 `gateway`、`agents_list`、`session_status` 和 `cron`（系统级/交互式工具，或应由主智能体协调的工具）。叶级子智能体（默认深度 1 行为，以及始终在深度 2）还会失去 `subagents`、`sessions_list`、`sessions_history` 和 `sessions_spawn`。子智能体永远不会获得 `message` 工具，它在生成时被禁用，而不是由此拒绝列表过滤；`sessions_send` 也保持拒绝，因此子智能体只能通过宣告链通信。

`sessions_history` 在这里也仍是有界、经过清理的回忆视图，并不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子智能体还会收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们管理自己的子级。

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

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以收窄已解析的工具集，但不能**加回**被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。要让 coding 配置文件的子智能体使用浏览器自动化，请在配置文件阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当只有一个智能体应获得浏览器自动化时，使用每智能体的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子智能体使用专用的进程内队列通道：

- **通道名称：**`subagent`
- **并发数：**`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 活性和恢复

OpenClaw 不会把缺少 `endedAt` 视为子智能体仍然存活的永久证明。早于陈旧运行窗口（2 小时，或配置的运行超时加一小段宽限期，两者取较长者）的未结束运行，在 `/subagents list`、状态摘要、后代完成门控和每会话并发检查中不再计为活跃/待处理。

Gateway 网关重启后，陈旧的未结束恢复运行会被修剪，除非其子会话标记为 `abortedLastRun: true`。这些重启中止的子会话仍可通过子智能体孤儿恢复流程恢复，该流程会在清除中止标记之前发送一条合成恢复消息。

自动重启恢复按每个子会话设有边界。如果同一个子智能体子级在快速重新卡住窗口内被反复接受为孤儿恢复，OpenClaw 会在该会话上持久化一个恢复墓碑，并在后续重启时停止自动恢复它。运行 `openclaw tasks maintenance --apply` 来协调任务记录，或运行 `openclaw doctor --fix` 来清除带墓碑会话上的陈旧中止恢复标志。

<Note>
如果子智能体生成因 Gateway 网关 `PAIRING_REQUIRED` / `scope-upgrade` 失败，请在编辑配对状态前检查 RPC 调用者。当调用者已经在 Gateway 网关请求上下文内运行时，内部 `sessions_spawn` 协调会在进程内分派，因此不会打开 loopback WebSocket，也不依赖 CLI 的已配对设备权限范围基线。Gateway 网关进程外部的调用者仍使用 WebSocket 回退，以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 通过直接 loopback 共享令牌/密码身份验证。远程调用者、显式 `deviceIdentity`、显式设备令牌路径以及浏览器/Node 客户端仍需要正常设备批准来进行权限范围升级。
</Note>

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话，并停止从该会话生成的任何活跃子智能体运行，同时级联到嵌套子级。

## 限制

- 子智能体公告是**尽力而为**。如果 Gateway 网关重启，待处理的“回传公告”工作会丢失。
- 子智能体仍共享同一个 Gateway 网关进程资源；将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md` 和 `TOOLS.md`（不注入 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子智能体遵循相同边界：`TOOLS.md` 保留在继承的 Codex 线程指令中，而仅限父级的角色、身份和用户文件会作为轮次级协作指令注入，因此子级不会克隆它们。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1-5）。大多数用例建议使用深度 2。
- `maxChildrenPerAgent` 限制每个会话的活跃子级数量（默认值 `5`，范围 `1-20`）。

## 相关

- [ACP 智能体](/zh-CN/tools/acp-agents)
- [智能体发送](/zh-CN/tools/agent-send)
- [后台任务](/zh-CN/automation/tasks)
- [多 Agent 沙盒工具](/zh-CN/tools/multi-agent-sandbox-tools)
