---
read_when:
    - 你想了解智能体拥有哪些会话工具
    - 你想配置跨会话访问或子智能体生成
    - 你想要检查已启动的子智能体状态
summary: 用于跨会话状态、回忆、消息传递和子智能体编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-07-12T21:23:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 为智能体提供跨会话工作、检查状态和编排子智能体的工具。

## 可用工具

| 工具               | 功能                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 使用可选筛选条件（类型、标签、智能体、归档、预览）列出会话  |
| `sessions_history` | 读取特定会话的对话记录                                   |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待响应                       |
| `sessions_spawn`   | 创建隔离的子智能体会话以执行后台工作                     |
| `sessions_yield`   | 结束当前轮次并等待后续子智能体结果               |
| `subagents`        | 列出此会话所创建子智能体的状态                              |
| `session_status`   | 显示 `/status` 风格的卡片，并可选择设置每会话模型覆盖 |

这些工具仍受当前工具配置文件和允许/拒绝策略的约束。`tools.profile: "coding"` 包含完整的会话编排工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨会话消息工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子智能体创建功能。若要保留消息配置文件，同时仍允许原生委派，请添加：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

组、提供商、沙箱和每智能体策略仍可在配置文件阶段之后移除这些工具。在受影响的会话中使用 `/tools` 检查实际生效的工具列表。

## 列出和读取会话

`sessions_list` 返回会话及其键、agentId、类型、渠道、模型、Token 计数和时间戳。可按 `kinds`（数组；接受的值：`main`、`group`、`cron`、`hook`、`node`、`other`）、精确的 `label`、精确的 `agentId`、`search` 文本或最近活跃时间（`activeMinutes`）筛选。默认返回活跃会话；若要检查已归档会话，请传入 `archived: true`。每行包含 `pinned` 和 `archived` 状态。需要进行邮箱式分类时，可设置 `includeDerivedTitles`、`includeLastMessage` 或 `messageLimit`（上限为 20），以获得受可见性范围限制的派生标题、最后一条消息的预览片段或每行数量受限的近期消息。仅会为调用方在已配置的会话工具可见性策略下已能看到的会话生成派生标题和预览，因此不相关的会话仍会隐藏。可见性受限时，`sessions_list` 会返回可选的 `visibility` 元数据，其中显示实际生效的模式，并警告结果可能受范围限制。

`sessions_history` 获取特定会话的对话记录。默认排除工具结果；传入 `includeTools: true` 可查看工具结果。使用 `limit` 获取数量受限的最新末尾记录。需要分页元数据时，请传入 `offset: 0`，然后传入返回的 `nextOffset` 值，在不读取原始对话记录文件的情况下，向后翻阅更早的 OpenClaw 对话记录窗口。显式偏移分页不会合并外部 CLI 回退导入；需要该合并显示历史记录时，请使用默认的最新末尾视图（不传 `offset`）。

返回的视图会有意限制大小并进行安全过滤：

- 助手文本在召回前会进行规范化：
  - 移除思考标签
  - 移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 移除纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括从未正确闭合的截断载荷
  - 移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 移除泄漏的模型控制 Token，例如 `<|assistant|>`、其他 ASCII `<|...|>` Token 和全角 `<｜...｜>` 变体
  - 移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` / `</minimax:tool_call>`
- 类似凭据/Token 的文本会在返回前被遮盖
- 长文本块会被截断
- 非常大的历史记录可能会丢弃较早的行，或将过大的行替换为 `[sessions_history omitted: message too large]`
- 该工具会报告摘要标志，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted`、`bytes` 和分页元数据

这两个工具都接受**会话键**（例如 `"main"`）或此前列表调用返回的**会话 ID**。

如果需要完全准确的原始对话记录，请检查限定范围内的 SQLite 对话记录行，不要将 `sessions_history` 视为未经筛选的转储。

## 发送跨会话消息

`sessions_send` 会将消息发送到另一个会话，并可选择等待响应：

- **发送后不等待：**将 `timeoutSeconds: 0` 设置为入队后立即返回。
- **等待回复：**设置超时时间，并以内联方式获取响应。

线程范围的聊天会话（例如键以 `:thread:<id>` 结尾的会话）不能作为 `sessions_send` 的目标。请使用父渠道会话键进行智能体间协调，以免工具路由的消息出现在活跃的面向用户线程中。

消息和 A2A 后续回复会在接收方提示词（`[Inter-session message ... isUser=false]`）及对话记录来源信息中标记为会话间数据。接收智能体应将其视为工具路由的数据，而不是最终用户直接发出的指令。

目标响应后，OpenClaw 可以运行**回复循环**，由智能体交替发送消息（最多 `session.agentToAgent.maxPingPongTurns` 轮，范围为 0-20，默认为 5）。目标智能体可以回复 `REPLY_SKIP` 以提前停止。

传入 `watch: true` 还可将发送方注册为目标的状态变更观察者：当其他参与者随后向目标发送直接人工消息或更改其目标时，发送方会收到一条系统通知，指向 `session_status` 的 `changesSince`。注册会在成功发送后进行，以实际接收消息的会话为目标，并从其当前状态版本开始，因此只有后续更改才会产生通知。注册成功时，结果会报告 `watched: true`。请参阅[会话状态感知](/concepts/session-state)。

## 状态和编排辅助工具

`session_status` 是用于当前会话或其他可见会话的轻量级 `/status` 等效工具。它会报告用量、时间、模型/运行时状态，以及存在时关联的后台任务上下文。与 `/status` 类似，它可以根据最新对话记录用量条目回填缺失的 Token/缓存计数器，而 `model=default` 会清除每会话覆盖。使用 `sessionKey="current"` 指定调用方的当前会话；`openclaw-tui` 等可见客户端标签不是会话键。

当路由元数据可用时，`session_status` 还会包含一个可见的 `Route context` JSON 块及对应的结构化 `details` 字段。这些字段用于区分会话键与当前正在处理实时运行的路由：

- `origin` 表示会话的创建位置；如果较旧状态缺少已存储的来源元数据，则为从可投递会话键前缀推断出的提供商。
- `active` 是当前实时运行路由。仅对当前正在处理的实时会话或当前会话报告。
- `deliveryContext` 是存储在会话中的持久化投递路由，即使当前界面不同，OpenClaw 仍可将其复用于后续投递。

## 会话状态变更

OpenClaw 会持久记录重要会话状态变更的信号日志（发往受观察会话的直接人工消息、子运行结果、目标变更、压缩）。`sessions_list` 行和 `session_status` 会公开会话的 `stateVersion`，而 `session_status` 接受 `changesSince: <version>`，以返回该版本之后的类型化事件；如果请求的版本早于保留的历史记录，则会通过 `historyGap` 精确发出信号。当其他参与者更改受观察会话时，观察者（自动注册的创建方父会话，或通过 `sessions_send watch: true` 显式注册者）会收到一条合并后的状态过期通知。

有关完整模型，请参阅[会话状态感知](/concepts/session-state)：事件类型、观察者注册、防骚扰通知协议、协调流程和当前限制。

`sessions_yield` 会有意结束当前轮次，使下一条消息可以是你正在等待的后续事件。创建子智能体后，如果希望完成结果作为下一条消息到达，而不是构建轮询循环，请使用它。

`subagents` 是用于查看已创建 OpenClaw 子智能体的可见性辅助工具。它支持使用 `action: "list"` 检查活跃/近期运行。

## 创建子智能体

`sessions_spawn` 默认会为后台任务创建隔离的会话。它始终是非阻塞的；会立即返回 `runId` 和 `childSessionKey`。原生子智能体运行会在子会话第一条可见的 `[Subagent Task]` 消息中接收委派任务，而系统提示词仅包含子智能体运行时规则和路由上下文。

主要选项：

- `runtime: "subagent"`（默认）或用于外部 harness 智能体的 `"acp"`。
- 子会话的 `model` 和 `thinking` 覆盖。
- `thread: true`，将创建操作绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"`，强制对子会话启用沙箱隔离。
- 当原生子智能体需要当前请求方的对话记录时，使用 `context: "fork"`；若需要干净的子会话，请省略该选项或使用 `context: "isolated"`。`context: "fork"` 仅对 `runtime: "subagent"` 有效。除非 `threadBindings.defaultSpawnContext` 另有规定，否则绑定线程的原生子智能体默认为 `context: "fork"`。

默认的叶级子智能体无法使用会话工具。当 `maxSpawnDepth >= 2` 时，深度为 1 的编排型子智能体还会获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理自己的子智能体。叶级运行仍无法使用递归编排工具。

完成后，通知步骤会将结果发布到请求方的渠道。完成结果投递会在可用时保留已绑定的线程/主题路由；如果完成来源仅标识了渠道，OpenClaw 仍可复用请求方会话存储的路由（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 特定行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 可见性

会话工具的范围受到限制，以控制智能体可见的内容：

| 级别   | 范围                                    |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话                 |
| `tree`  | 当前会话 + 已创建的子智能体     |
| `agent` | 此智能体的所有会话              |
| `all`   | 所有会话（如已配置，则包括跨智能体会话） |

默认值为 `tree`。无论配置如何，沙箱隔离会话都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session)：路由、生命周期、维护
- [子智能体](/zh-CN/tools/subagents)：子会话生命周期和投递
- [ACP 智能体](/zh-CN/tools/acp-agents)：创建外部 harness
- [多智能体](/zh-CN/concepts/multi-agent)：多智能体架构
- [Gateway 配置](/zh-CN/gateway/configuration)：会话工具配置选项

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话清理](/zh-CN/concepts/session-pruning)
