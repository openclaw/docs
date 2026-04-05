---
read_when:
    - 你想了解智能体拥有哪些会话工具
    - 你想配置跨会话访问或子智能体启动
    - 你想检查状态或控制已启动的子智能体
summary: 用于跨会话状态、召回、消息传递和子智能体编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-04-05T08:22:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fab7cbf9d1a5cccaf316b69fefe212bbf9370876c8b92e988d3175f5545a4d
    source_path: concepts/session-tool.md
    workflow: 15
---

# 会话工具

OpenClaw 为智能体提供了跨会话工作、检查状态和编排子智能体的工具。

## 可用工具

| 工具               | 作用                                               |
| ------------------ | -------------------------------------------------- |
| `sessions_list`    | 列出会话，并支持可选过滤器（类型、最近活跃时间）   |
| `sessions_history` | 读取特定会话的转录内容                             |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待                 |
| `sessions_spawn`   | 为后台任务启动一个隔离的子智能体会话               |
| `sessions_yield`   | 结束当前轮次，并等待后续子智能体结果               |
| `subagents`        | 列出、引导或终止此会话已启动的子智能体             |
| `session_status`   | 显示类似 `/status` 的卡片，并可选择设置按会话模型覆盖 |

## 列出和读取会话

`sessions_list` 会返回会话及其键、类型、渠道、模型、token
计数和时间戳。可按类型（`main`、`group`、`cron`、`hook`、
`node`）或最近活跃时间（`activeMinutes`）过滤。

`sessions_history` 会获取特定会话的对话转录。
默认情况下，不包含工具结果 —— 传入 `includeTools: true` 可查看它们。
返回的视图会刻意做边界限制和安全过滤：

- 助手文本在召回前会被规范化：
  - 会移除 thinking 标签
  - 会移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 会移除纯文本工具调用 XML 负载块，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>`，包括那些从未正确闭合的截断负载
  - 会移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、
    `[Tool Result ...]` 和 `[Historical context ...]`
  - 会移除泄露的模型控制 token，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` token，以及全角 `<｜...｜>` 变体
  - 会移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>`
- 类似凭证/token 的文本会在返回前被脱敏
- 长文本块会被截断
- 超大历史可能会丢弃较早的行，或用
  `[sessions_history omitted: message too large]` 替换过大的行
- 该工具会报告摘要标记，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted` 和 `bytes`

这两个工具都接受**会话键**（例如 `"main"`）或先前列表调用返回的**会话 ID**。

如果你需要精确到逐字节一致的转录内容，请直接检查磁盘上的转录文件，而不要将 `sessions_history` 视为原始转储。

## 发送跨会话消息

`sessions_send` 会将消息发送到另一个会话，并可选择等待回复：

- **发后即忘：** 设置 `timeoutSeconds: 0` 以加入队列并立即返回。
- **等待回复：** 设置超时，并以内联方式获取回复。

目标回复后，OpenClaw 可以运行一个**回复回环**，让智能体交替发送消息（最多 5 轮）。目标智能体可回复 `REPLY_SKIP` 以提前停止。

## 状态和编排辅助工具

`session_status` 是面向当前或其他可见会话的轻量级 `/status` 等价工具。它会报告使用量、时间、模型/运行时状态，以及存在时关联的后台任务上下文。与 `/status` 一样，它可以从最新转录 usage 条目中回填稀疏的 token/缓存计数，而 `model=default` 会清除按会话覆盖。

`sessions_yield` 会有意结束当前轮次，以便你正在等待的后续事件成为下一条消息。在启动子智能体后，如果你希望完成结果以下一条消息的形式到达，而不是构建轮询循环，请使用它。

`subagents` 是针对已启动 OpenClaw 子智能体的控制平面辅助工具。它支持：

- `action: "list"`：检查当前活动/最近运行
- `action: "steer"`：向正在运行的子项发送后续指导
- `action: "kill"`：停止单个子项或 `all`

## 启动子智能体

`sessions_spawn` 会为后台任务创建一个隔离会话。它始终是非阻塞的 —— 会立即返回 `runId` 和 `childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"`，用于外部 harness 智能体。
- 子会话的 `model` 和 `thinking` 覆盖。
- `thread: true` 可将启动绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 可强制对子会话启用沙箱隔离。

默认的叶子子智能体不会获得会话工具。当
`maxSpawnDepth >= 2` 时，深度为 1 的编排子智能体还会额外获得
`sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，
从而可以管理它们自己的子项。叶子运行仍然不会获得递归编排工具。

完成后，公告步骤会将结果发布到请求者的渠道。完成结果投递会在可用时保留已绑定的线程/主题路由；如果完成来源只标识了某个渠道，OpenClaw 仍可复用请求者会话已存储的路由（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 特定行为，请参见 [ACP Agents](/tools/acp-agents)。

## 可见性

会话工具按范围限定，以限制智能体可见内容：

| 级别    | 范围                         |
| ------- | ---------------------------- |
| `self`  | 仅当前会话                   |
| `tree`  | 当前会话 + 已启动的子智能体  |
| `agent` | 该智能体的所有会话           |
| `all`   | 所有会话（若已配置则跨智能体） |

默认值为 `tree`。无论配置如何，沙箱隔离会话都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/concepts/session) -- 路由、生命周期、维护
- [ACP Agents](/tools/acp-agents) -- 外部 harness 启动
- [多智能体](/concepts/multi-agent) -- 多智能体架构
- [Gateway 网关配置](/gateway/configuration) -- 会话工具配置调节项
