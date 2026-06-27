---
read_when:
    - 你想了解智能体有哪些会话工具
    - 你想配置跨会话访问或子智能体创建
    - 你想检查已生成的子智能体状态
summary: 用于跨会话状态、回忆、消息传递和子智能体编排的 Agent 工具
title: 会话工具
x-i18n:
    generated_at: "2026-06-27T01:53:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 为智能体提供工具，用于跨会话工作、检查状态，并编排子智能体。

## 可用工具

| 工具               | 作用                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出会话，并支持可选过滤器（类型、标签、智能体、最近活动、预览）  |
| `sessions_history` | 读取特定会话的转录                                   |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待                       |
| `sessions_spawn`   | 为后台工作生成一个隔离的子智能体会话                     |
| `sessions_yield`   | 结束当前轮次，并等待后续子智能体结果               |
| `subagents`        | 列出此会话生成的子智能体状态                              |
| `session_status`   | 显示类似 `/status` 的卡片，并可选择设置按会话的模型覆盖 |

这些工具仍受当前工具配置档和允许/拒绝策略约束。`tools.profile: "coding"` 包含完整的会话编排工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨会话消息工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子智能体生成。若要保留消息配置档并仍允许原生委派，请添加：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

组、提供商、沙箱和按智能体策略在配置档阶段之后仍可移除这些工具。请在受影响的会话中使用 `/tools` 检查实际工具列表。

## 列出和读取会话

`sessions_list` 返回会话及其 key、agentId、kind、channel、model、token 数和时间戳。可按类型（`main`、`group`、`cron`、`hook`、`node`）、精确 `label`、精确 `agentId`、搜索文本或最近活动（`activeMinutes`）过滤。当你需要类似邮箱的分诊时，它还可以为每行请求按可见性范围派生的标题、最后一条消息预览片段，或有界的近期消息。派生标题和预览只会为调用者在已配置的会话工具可见性策略下已经可见的会话生成，因此无关会话会保持隐藏。当可见性受限时，`sessions_list` 会返回可选的 `visibility` 元数据，显示实际模式以及结果可能受范围限制的警告。

`sessions_history` 获取特定会话的对话转录。默认情况下会排除工具结果；传入 `includeTools: true` 可查看它们。返回视图会有意进行边界限制和安全过滤：

- 回忆前会规范化 assistant 文本：
  - 移除 thinking 标签
  - 移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 移除纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括从未干净闭合的截断载荷
  - 移除降级的工具调用/结果脚手架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 移除泄露的模型控制 token，例如 `<|assistant|>`、其他 ASCII `<|...|>` token，以及全角 `<｜...｜>` 变体
  - 移除畸形的 MiniMax 工具调用 XML，例如 `<invoke ...>` / `</minimax:tool_call>`
- 返回前会遮盖类似凭证/token 的文本
- 会截断较长的文本块
- 非常大的历史记录可能会丢弃较旧行，或用 `[sessions_history omitted: message too large]` 替换过大的行
- 工具会报告摘要标志，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted` 和 `bytes`

这两个工具都接受 **会话 key**（例如 `"main"`）或上一次列表调用中的 **会话 ID**。

如果你需要逐字节完全一致的转录，请检查磁盘上的转录文件，而不是把 `sessions_history` 当作原始转储。

## 发送跨会话消息

`sessions_send` 会向另一个会话传递消息，并可选择等待响应：

- **发送后不等待：** 设置 `timeoutSeconds: 0` 以入队并立即返回。
- **等待回复：** 设置超时，并以内联方式获取响应。

线程范围的聊天会话，例如以 `:thread:<id>` 结尾的 Slack 或 Discord key，不是有效的 `sessions_send` 目标。请使用父渠道会话 key 进行智能体间协作，以免工具路由的消息出现在面向真人的活跃线程中。

消息和 A2A 后续回复会在接收方提示词（`[Inter-session message ... isUser=false]`）和转录来源中标记为会话间数据。接收方智能体应将其视为工具路由的数据，而不是最终用户直接撰写的指令。

目标响应后，OpenClaw 可以运行一个 **回传回复循环**，让智能体交替发送消息（最多 `session.agentToAgent.maxPingPongTurns`，范围 0-20，默认 5）。目标智能体可以回复 `REPLY_SKIP` 来提前停止。

## 状态和编排辅助工具

`session_status` 是当前会话或另一个可见会话的轻量级 `/status` 等价工具。它会报告用量、时间、模型/运行时状态，以及存在时的已链接后台任务上下文。与 `/status` 类似，它可以从最新转录用量条目回填稀疏的 token/cache 计数器，并且 `model=default` 会清除按会话覆盖。请对调用者当前会话使用 `sessionKey="current"`；可见的客户端标签（例如 `openclaw-tui`）不是会话 key。

当路由元数据可用时，`session_status` 还会包含一个可见的 `Route context` JSON 块，以及匹配的结构化 `details` 字段。这些字段用于区分会话 key 和当前处理实时运行的路由：

- `origin` 是会话创建位置；如果较旧状态缺少已存储的 origin 元数据，则为根据可投递会话 key 前缀推断出的提供商。
- `active` 是当前实时运行路由。它只会针对正在处理的实时或当前会话报告。
- `deliveryContext` 是存储在会话上的持久投递路由，即使活跃表面不同，OpenClaw 也可以复用它进行后续投递。

`sessions_yield` 会有意结束当前轮次，使下一条消息可以成为你正在等待的后续事件。在生成子智能体后，如果你希望完成结果作为下一条消息到达，而不是构建轮询循环，请使用它。

`subagents` 是用于已生成 OpenClaw 子智能体的可见性辅助工具。它支持 `action: "list"` 来检查活跃/近期运行。

## 生成子智能体

`sessions_spawn` 默认会为后台任务创建一个隔离会话。它始终是非阻塞的，会立即返回 `runId` 和 `childSessionKey`。原生子智能体运行会在子会话第一条可见的 `[Subagent Task]` 消息中收到委派任务，而 system prompt 只携带子智能体运行时规则和路由上下文。

关键选项：

- `runtime: "subagent"`（默认）或用于外部 harness 智能体的 `"acp"`。
- 子会话的 `model` 和 `thinking` 覆盖。
- `thread: true` 将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 对子会话强制启用沙箱隔离。
- 当子会话需要当前请求者转录时，原生子智能体使用 `context: "fork"`；若要干净的子会话，请省略它或使用 `context: "isolated"`。绑定线程的原生子智能体默认使用 `context: "fork"`，除非 `threadBindings.defaultSpawnContext` 另有指定。

默认叶子子智能体不会获得会话工具。当 `maxSpawnDepth >= 2` 时，深度为 1 的编排器子智能体还会收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们管理自己的子项。叶子运行仍不会获得递归编排工具。

完成后，公告步骤会将结果发布到请求者的渠道。完成投递会在可用时保留已绑定的线程/主题路由；如果完成来源只标识一个渠道，OpenClaw 仍可复用请求者会话存储的路由（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 特定行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 可见性

会话工具受到范围限制，以限制智能体可见内容：

| 级别   | 范围                                    |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话                 |
| `tree`  | 当前会话 + 已生成的子智能体     |
| `agent` | 此智能体的所有会话              |
| `all`   | 所有会话（若已配置，则跨智能体） |

默认值为 `tree`。无论配置如何，沙箱隔离会话都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session) -- 路由、生命周期、维护
- [ACP 智能体](/zh-CN/tools/acp-agents) -- 外部 harness 生成
- [多 Agent](/zh-CN/concepts/multi-agent) -- 多 Agent 架构
- [Gateway 网关配置](/zh-CN/gateway/configuration) -- 会话工具配置旋钮

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
