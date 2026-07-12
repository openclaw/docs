---
read_when:
    - 你想了解智能体有哪些会话工具
    - 你想要配置跨会话访问或子智能体生成
    - 你想要检查已启动的子智能体状态
summary: 用于跨会话状态、回忆、消息传递和子智能体编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-07-12T14:27:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6b584912c012b632d001e7f77dc704b8b11ab2e897ed62238675026078039819
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 为智能体提供跨会话工作、检查状态和编排子智能体的工具。

## 可用工具

| 工具               | 功能                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 使用可选筛选条件（类型、标签、智能体、归档、预览）列出会话  |
| `sessions_history` | 读取特定会话的对话记录                                   |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待                       |
| `sessions_spawn`   | 为后台工作生成隔离的子智能体会话                     |
| `sessions_yield`   | 结束当前轮次并等待后续子智能体结果               |
| `subagents`        | 列出此会话已生成的子智能体状态                              |
| `session_status`   | 显示 `/status` 样式的卡片，并可选择设置每会话模型覆盖 |

这些工具仍受当前工具配置文件和允许/拒绝策略的约束。`tools.profile: "coding"` 包含完整的会话编排工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨会话消息工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子智能体生成工具。要保留消息配置文件并仍允许原生委派，请添加：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群组、提供商、沙箱和按智能体配置的策略仍可在配置文件阶段之后移除这些工具。在受影响的会话中使用 `/tools` 检查实际生效的工具列表。

## 列出和读取会话

`sessions_list` 返回会话及其键、agentId、类型、渠道、模型、token 数量和时间戳。可按 `kinds`（数组；接受的值：`main`、`group`、`cron`、`hook`、`node`、`other`）、精确的 `label`、精确的 `agentId`、`search` 文本或最近活跃时间（`activeMinutes`）进行筛选。默认返回活跃会话；传入 `archived: true` 可改为检查已归档会话。各行包含 `pinned` 和 `archived` 状态。需要进行邮箱式分类时，可设置 `includeDerivedTitles`、`includeLastMessage` 或 `messageLimit`（上限为 20），以获取受可见性范围限制的派生标题、最后一条消息的预览片段，或每行中数量有限的近期消息。只有调用方根据已配置的会话工具可见性策略本来就能看到的会话，才会生成派生标题和预览，因此无关会话仍保持隐藏。可见性受限时，`sessions_list` 会返回可选的 `visibility` 元数据，显示实际生效的模式，并警告结果可能受到范围限制。

`sessions_history` 获取特定会话的对话记录。默认不包含工具结果；传入 `includeTools: true` 可查看它们。使用 `limit` 获取最新且数量受限的末尾记录。需要分页元数据时，传入 `offset: 0`，然后使用返回的 `nextOffset` 值向后翻页浏览更早的 OpenClaw 对话记录窗口，而无需读取原始对话记录文件。显式指定偏移量的分页不会合并外部 CLI 回退导入内容；需要这种合并后的显示历史时，请使用默认的最新末尾视图（不指定 `offset`）。

返回的视图会有意限制大小并进行安全过滤：

- 助手文本会在召回前进行规范化：
  - 移除思考标签
  - 移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 移除纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括始终未正确闭合的截断载荷
  - 移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 移除泄漏的模型控制 token，例如 `<|assistant|>`、其他 ASCII `<|...|>` token 以及全角 `<｜...｜>` 变体
  - 移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` / `</minimax:tool_call>`
- 返回前会遮盖类似凭据/token 的文本
- 长文本块会被截断
- 超大历史记录可能会丢弃较早的行，或用 `[sessions_history omitted: message too large]` 替换过大的行
- 该工具会报告 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted`、`bytes` 等摘要标志以及分页元数据

这两个工具都接受**会话键**（例如 `"main"`）或先前列表调用返回的**会话 ID**。

如果需要精确的原始对话记录，请检查范围受限的 SQLite 对话记录行，不要将 `sessions_history` 视为未经过滤的转储。

## 发送跨会话消息

`sessions_send` 将消息发送到另一个会话，并可选择等待响应：

- **发送后不等待：**将 `timeoutSeconds: 0` 设置为入队后立即返回。
- **等待回复：**设置超时时间并以内联方式获取响应。

线程范围的聊天会话（例如键以 `:thread:<id>` 结尾）不能作为有效的 `sessions_send` 目标。使用父渠道会话键进行智能体间协调，以免通过工具路由的消息出现在活跃的面向用户线程中。

消息和 A2A 后续回复会在接收方提示词（`[Inter-session message ... isUser=false]`）以及对话记录来源信息中标记为会话间数据。接收智能体应将其视为通过工具路由的数据，而不是最终用户直接编写的指令。

目标响应后，OpenClaw 可以运行一个**回传循环**，让智能体交替发送消息（最多 `session.agentToAgent.maxPingPongTurns` 次，范围为 0-20，默认值为 5）。目标智能体可以回复 `REPLY_SKIP` 以提前停止。

## 状态和编排辅助工具

`session_status` 是用于当前会话或另一个可见会话的轻量级 `/status` 等效工具。它会报告使用量、时间、模型/运行时状态，以及存在时关联的后台任务上下文。与 `/status` 一样，它可以从最新的对话记录用量条目中回填缺失的 token/缓存计数器，并且 `model=default` 会清除每会话覆盖。对调用方当前会话使用 `sessionKey="current"`；`openclaw-tui` 等可见客户端标签不是会话键。

路由元数据可用时，`session_status` 还会包含可见的 `Route context` JSON 块和对应的结构化 `details` 字段。这些字段用于区分会话键和当前处理实时运行的路由：

- `origin` 是创建会话的位置；对于缺少已存储来源元数据的旧状态，则是从可投递会话键前缀推断出的提供商。
- `active` 是当前实时运行路由。仅对当前正在处理的实时会话或当前会话报告。
- `deliveryContext` 是存储在会话中的持久化投递路由，即使活跃界面不同，OpenClaw 也可将其用于后续投递。

## 会话状态更改

OpenClaw 为部分会话状态更改保留尽力而为的信号日志：发送到子会话的直接人工消息、子任务运行完成或失败、子项创建、目标更改和压缩。已取消和超时的子任务运行会记录为失败，并在事件载荷中保留具体结果（`cancelled`、`timeout` 或 `error`）。日志包含元数据和单行摘要，绝不包含消息内容。其 `stateVersion` 是会话信号日志的头部版本，而不是事务性变更数据捕获版本；会话存储变更和信号追加使用不同的存储，因此追加失败会被记录，但不会导致发起该操作的轮次失败。

`sessions_list` 会在存在已记录更改的行中包含 `stateVersion`。`session_status` 始终在结构化详细信息中返回 `stateVersion`。传入 `changesSince: <previousStateVersion>` 可获取该版本之后最多 200 个保留事件；此读取操作不会确认或推进父级通知游标。结果为 `historyGap: true` 表示请求的版本早于保留的历史记录，因此应刷新整个会话状态，而不是将响应视为精确增量。

当另一个参与者向被监视的子项发送直接人工轮次或更改其目标时，父级会收到系统通知，要求其使用最后看到的版本调用 `session_status`。主会话父级会被主动唤醒。嵌套子智能体父级会在下一轮收到通知，因为 Heartbeat 路由无法直接以其队列为目标。普通子任务运行完成的投递仍由完成公告负责。

历史记录最多保留 30 天和 50,000 行，而每会话头部版本在修剪后仍保持单调递增。通知投递使用 Gateway 网关的内存系统事件队列，并假设一个 Gateway 网关进程负责共享状态数据库的投递。多个 Gateway 网关仍共享持久化日志和 `changesSince` 对账界面，但 v1 不会跨进程推送通知。父级通知要求使用包含智能体限定信息的父会话键；在 `session.scope="global"` 下，共享的 `global` 键在不同智能体之间存在歧义，因此这些父级可使用持久化日志和 `changesSince`，但在 v1 中不会收到主动通知。

`sessions_yield` 会有意结束当前轮次，使下一条消息成为你正在等待的后续事件。当你生成子智能体后，希望完成结果作为下一条消息到达而不是构建轮询循环时，请使用此工具。

`subagents` 是用于已生成 OpenClaw 子智能体的可见性辅助工具。它支持使用 `action: "list"` 检查活跃/近期运行。

## 生成子智能体

`sessions_spawn` 默认会为后台任务创建隔离会话。它始终是非阻塞的；会立即返回 `runId` 和 `childSessionKey`。原生子智能体运行会在子会话的第一条可见 `[Subagent Task]` 消息中收到委派任务，而系统提示词仅包含子智能体运行时规则和路由上下文。

关键选项：

- `runtime: "subagent"`（默认）或用于外部 harness 智能体的 `"acp"`。
- 子会话的 `model` 和 `thinking` 覆盖。
- 使用 `thread: true` 将生成操作绑定到聊天线程（Discord、Slack 等）。
- 使用 `sandbox: "require"` 强制对子项启用沙箱隔离。
- 当子项需要当前请求方的对话记录时，对原生子智能体使用 `context: "fork"`；如需干净的子项，则省略该选项或使用 `context: "isolated"`。`context: "fork"` 仅适用于 `runtime: "subagent"`。除非 `threadBindings.defaultSpawnContext` 另有指定，否则绑定线程的原生子智能体默认使用 `context: "fork"`。

默认叶级子智能体不会获得会话工具。当 `maxSpawnDepth >= 2` 时，深度为 1 的编排子智能体还会获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理自己的子项。叶级运行仍不会获得递归编排工具。

完成后，公告步骤会将结果发布到请求方的渠道。在可用时，完成投递会保留已绑定的线程/主题路由；如果完成来源仅标识了渠道，OpenClaw 仍可复用请求方会话中存储的路由（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 特有的行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 可见性

会话工具受范围限制，以约束智能体可以看到的内容：

| 级别   | 范围                                    |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话                 |
| `tree`  | 当前会话 + 已生成的子智能体     |
| `agent` | 此智能体的所有会话              |
| `all`   | 所有会话（如已配置，可跨智能体） |

默认值为 `tree`。无论配置如何，沙箱隔离的会话都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session)：路由、生命周期、维护
- [子智能体](/zh-CN/tools/subagents)：子会话生命周期和交付
- [ACP 智能体](/zh-CN/tools/acp-agents)：外部 harness 生成
- [多 Agent](/zh-CN/concepts/multi-agent)：多 Agent 架构
- [Gateway 配置](/zh-CN/gateway/configuration)：会话工具配置选项

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话清理](/zh-CN/concepts/session-pruning)
