---
read_when:
    - 你想了解智能体拥有哪些会话工具
    - 你想配置跨会话访问或生成子智能体
    - 你想检查状态或控制已生成的子智能体
summary: 用于跨会话状态、回忆、消息传递和子智能体编排的 Agent 工具
title: 会话工具
x-i18n:
    generated_at: "2026-04-27T09:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18fabe50b05eade5314e664f5afd5a212eabc837f36ab7c6c5bed5199d9e0860
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw 为智能体提供了可跨会话工作、检查状态并编排子智能体的工具。

## 可用工具

| 工具 | 作用 |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出会话，并支持可选筛选条件（种类、标签、智能体、最近活动时间、预览） |
| `sessions_history` | 读取特定会话的转录记录 |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待 |
| `sessions_spawn`   | 为后台工作生成一个隔离的子智能体会话 |
| `sessions_yield`   | 结束当前轮次，并等待后续的子智能体结果 |
| `subagents`        | 列出、引导或终止此会话生成的子智能体 |
| `session_status`   | 显示一个类似 `/status` 的卡片，并可选择为每个会话设置模型覆盖 |

## 列出和读取会话

`sessions_list` 会返回会话及其 key、agentId、kind、channel、model、token 计数和时间戳。你可以按种类（`main`、`group`、`cron`、`hook`、`node`）、精确 `label`、精确 `agentId`、搜索文本或最近活动时间（`activeMinutes`）进行筛选。当你需要类似邮箱的分诊视图时，它还可以为每一行请求一个基于可见性范围派生的标题、最后一条消息的预览片段，或有限数量的最近消息。派生标题和预览仅对调用方在已配置会话工具可见性策略下本就可见的会话生成，因此不相关的会话会保持隐藏。

`sessions_history` 获取特定会话的对话转录记录。默认情况下，不包含工具结果——传入 `includeTools: true` 可查看它们。返回的视图是有意限制并经过安全过滤的：

- 在回忆前会规范化 assistant 文本：
  - 会移除 thinking 标签
  - 会移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 会移除纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括那些未能正常闭合的截断载荷
  - 会移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 会移除泄漏的模型控制 token，例如 `<|assistant|>`、其他 ASCII `<|...|>` token，以及全角 `<｜...｜>` 变体
  - 会移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` / `</minimax:tool_call>`
- 在返回前会对类似凭证/token 的文本进行脱敏
- 长文本块会被截断
- 对于非常大的历史记录，可能会丢弃较旧的行，或用 `[sessions_history omitted: message too large]` 替换超大的行
- 该工具会报告摘要标记，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted` 和 `bytes`

这两个工具都接受**会话 key**（如 `"main"`）或之前 list 调用返回的**会话 ID**。

如果你需要精确到字节完全一致的转录记录，请直接检查磁盘上的转录文件，而不要将 `sessions_history` 当作原始转储。

## 发送跨会话消息

`sessions_send` 将消息发送到另一个会话，并可选择等待响应：

- **发送后不等待：** 设置 `timeoutSeconds: 0` 以加入队列并立即返回。
- **等待回复：** 设置超时时间，并内联获取响应。

目标会话响应后，OpenClaw 可以运行一个**回传循环**，让智能体交替发送消息（最多 5 轮）。目标智能体可回复 `REPLY_SKIP` 以提前停止。

## 状态与编排辅助工具

`session_status` 是适用于当前会话或另一个可见会话的轻量级 `/status` 等效工具。它会报告使用情况、时间、模型/运行时状态，以及存在时所关联的后台任务上下文。与 `/status` 一样，它可以用最新转录中的 usage 条目回填稀疏的 token/cache 计数器，而 `model=default` 会清除每会话覆盖。对调用方当前会话使用 `sessionKey="current"`；像 `openclaw-tui` 这样的可见客户端标签并不是会话 key。

`sessions_yield` 会有意结束当前轮次，以便你等待的后续事件能作为下一条消息到达。在生成子智能体后，当你希望完成结果作为下一条消息到达，而不是构建轮询循环时，请使用它。

`subagents` 是针对已生成 OpenClaw 子智能体的控制平面辅助工具。它支持：

- `action: "list"` 以检查活动/最近运行
- `action: "steer"` 以向正在运行的子会话发送后续引导
- `action: "kill"` 以停止一个子会话或 `all`

## 生成子智能体

`sessions_spawn` 默认会为后台任务创建一个隔离的会话。它始终是非阻塞的——会立即返回 `runId` 和 `childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"`，用于外部 harness 智能体。
- 子会话的 `model` 和 `thinking` 覆盖。
- `thread: true` 用于将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 用于对子会话强制启用沙箱隔离。
- `context: "fork"` 适用于子会话需要当前请求者转录记录的原生子智能体；省略它或使用 `context: "isolated"` 则创建一个干净的子会话。

默认的叶子子智能体不会获得会话工具。当 `maxSpawnDepth >= 2` 时，深度为 1 的编排型子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们管理自己的子会话。叶子运行仍然不会获得递归编排工具。

完成后，公告步骤会将结果发布到请求者的渠道。完成交付会在可用时保留已绑定的线程/主题路由；如果完成来源仅标识了一个渠道，OpenClaw 仍可复用请求者会话存储的路由（`lastChannel` / `lastTo`）来直接交付。

有关 ACP 特定行为，请参阅 [ACP Agents](/zh-CN/tools/acp-agents)。

## 可见性

会话工具按作用范围进行限制，以控制智能体可以看到什么：

| 级别 | 范围 |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话 |
| `tree`  | 当前会话 + 已生成的子智能体 |
| `agent` | 此智能体的所有会话 |
| `all`   | 所有会话（如果已配置，则包括跨智能体） |

默认值为 `tree`。沙箱隔离会话无论配置如何都会被限制为 `tree`。

## 延伸阅读

- [Session Management](/zh-CN/concepts/session) —— 路由、生命周期、维护
- [ACP Agents](/zh-CN/tools/acp-agents) —— 外部 harness 生成
- [Multi-agent](/zh-CN/concepts/multi-agent) —— 多智能体架构
- [Gateway Configuration](/zh-CN/gateway/configuration) —— 会话工具配置选项

## 相关内容

- [Session management](/zh-CN/concepts/session)
- [Session pruning](/zh-CN/concepts/session-pruning)
