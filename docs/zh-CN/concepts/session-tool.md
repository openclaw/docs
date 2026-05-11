---
read_when:
    - 你想了解智能体有哪些会话工具
    - 你想配置跨会话访问或子智能体生成
    - 你想检查状态或控制已生成的子智能体
summary: 用于跨会话状态、记忆检索、消息传递和子智能体编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-05-11T20:27:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e91f1f956ff882cabf7df51bd8c08836398decfb185c56c42db4052f24b3f716
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 为智能体提供工具，用于跨会话工作、检查状态，以及
编排子智能体。

## 可用工具

| 工具               | 作用                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出会话，并支持可选过滤器（kind、label、agent、recency、preview）  |
| `sessions_history` | 读取特定会话的转录记录                                   |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待                       |
| `sessions_spawn`   | 为后台工作生成一个隔离的子智能体会话                     |
| `sessions_yield`   | 结束当前轮次并等待后续子智能体结果               |
| `subagents`        | 列出、Steer 或终止为此会话生成的子智能体                    |
| `session_status`   | 显示一个类似 `/status` 的卡片，并可选择设置每会话模型覆盖 |

这些工具仍受当前工具配置和允许/拒绝策略约束。`tools.profile: "coding"` 包含完整的会话编排
集合，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。
`tools.profile: "messaging"` 包含跨会话消息工具
（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但
不包含子智能体生成。要保留消息配置并仍然
允许原生委派，请添加：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

组、提供商、沙箱和每智能体策略仍可在配置阶段之后移除这些工具。
从受影响的会话使用 `/tools` 来检查
实际工具列表。

## 列出和读取会话

`sessions_list` 返回会话及其 key、agentId、kind、channel、model、
令牌计数和时间戳。可按 kind（`main`、`group`、`cron`、`hook`、
`node`）、精确 `label`、精确 `agentId`、搜索文本或新近程度
（`activeMinutes`）过滤。当你需要邮箱式分流时，它还可以为每一行请求
可见性作用域内的派生标题、最后一条消息预览片段，或有界的
近期消息。派生标题和预览只会针对调用方在已配置的会话工具
可见性策略下已经可见的会话生成，因此无关会话会保持隐藏。

`sessions_history` 获取特定会话的对话转录记录。
默认情况下会排除工具结果；传入 `includeTools: true` 可查看它们。
返回的视图会有意保持有界并经过安全过滤：

- assistant 文本会在召回前标准化：
  - thinking 标签会被剥离
  - `<relevant-memories>` / `<relevant_memories>` 脚手架块会被剥离
  - 纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>` 会被剥离，包括从未干净闭合的
    截断载荷
  - 降级的工具调用/结果脚手架，例如 `[Tool Call: ...]`、
    `[Tool Result ...]` 和 `[Historical context ...]` 会被剥离
  - 泄漏的模型控制令牌，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` 令牌，以及全角 `<｜...｜>` 变体会被剥离
  - 格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>` 会被剥离
- 类似凭证/令牌的文本会在返回前被遮盖
- 长文本块会被截断
- 非常大的历史记录可能会丢弃较旧的行，或将过大的行替换为
  `[sessions_history omitted: message too large]`
- 该工具会报告摘要标志，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted` 和 `bytes`

这两个工具都接受 **会话 key**（例如 `"main"`）或来自先前列表调用的
**会话 ID**。

如果你需要逐字节完全一致的转录记录，请检查磁盘上的转录文件，
而不是把 `sessions_history` 当作原始转储。

## 发送跨会话消息

`sessions_send` 将消息投递到另一个会话，并可选择等待
响应：

- **发送后即忘：** 设置 `timeoutSeconds: 0` 以入队并
  立即返回。
- **等待回复：** 设置超时时间并以内联方式获取响应。

线程作用域的聊天会话，例如以 `:thread:<id>` 结尾的 Slack 或 Discord key，
不是有效的 `sessions_send` 目标。请使用父渠道
会话 key 进行智能体间协调，这样通过工具路由的消息就不会出现在
面向真人的活跃线程内。

消息和 A2A 后续回复会在接收提示（`[Inter-session message ... isUser=false]`）
和转录来源中标记为会话间数据。接收智能体应将它们视为通过工具路由的数据，
而不是直接由最终用户编写的指令。

目标响应后，OpenClaw 可以运行一个 **回传循环**，其中
智能体交替发送消息（最多 `session.agentToAgent.maxPingPongTurns`，范围
0-20，默认 5）。目标智能体可以回复
`REPLY_SKIP` 以提前停止。

## 状态和编排辅助工具

`session_status` 是当前会话或另一个可见会话的轻量级 `/status` 等效工具。
它会报告用量、时间、模型/运行时状态，以及在存在时报告
关联的后台任务上下文。和 `/status` 一样，它可以从最新的转录用量条目回填
稀疏的令牌/缓存计数，并且
`model=default` 会清除每会话覆盖。对调用方的当前会话使用 `sessionKey="current"`；
可见的客户端标签（例如 `openclaw-tui`）不是会话 key。

`sessions_yield` 会有意结束当前轮次，以便下一条消息可以是
你正在等待的后续事件。在生成子智能体后，如果你希望完成结果作为下一条消息到达，
而不是构建轮询循环，请使用它。

`subagents` 是用于已生成 OpenClaw 子智能体的控制平面辅助工具。
它支持：

- `action: "list"` 用于检查活跃/近期运行
- `action: "steer"` 用于向正在运行的子级发送后续指引
- `action: "kill"` 用于停止一个子级或 `all`

## 生成子智能体

默认情况下，`sessions_spawn` 会为后台任务创建隔离会话。
它始终非阻塞，会立即返回 `runId` 和
`childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"` 用于外部 harness 智能体。
- 子会话的 `model` 和 `thinking` 覆盖。
- `thread: true` 将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 对子级强制执行沙箱隔离。
- 当子级需要当前请求方转录记录时，对原生子智能体使用 `context: "fork"`；
  省略它或使用 `context: "isolated"` 可获得干净的子级。
  线程绑定的原生子智能体默认使用 `context: "fork"`，除非
  `threadBindings.defaultSpawnContext` 另有指定。

默认叶子子智能体不会获得会话工具。当
`maxSpawnDepth >= 2` 时，深度为 1 的编排器子智能体还会收到
`sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，使它们
能够管理自己的子级。叶子运行仍不会获得递归
编排工具。

完成后，公告步骤会将结果发布到请求方的渠道。
完成投递会在可用时保留绑定的线程/主题路由；如果
完成来源只识别到一个渠道，OpenClaw 仍可复用
请求方会话存储的路由（`lastChannel` / `lastTo`）进行直接
投递。

有关 ACP 特定行为，请参阅 [ACP Agents](/zh-CN/tools/acp-agents)。

## 可见性

会话工具会受作用域限制，以限定智能体可见的内容：

| 级别   | 作用域                                    |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话                 |
| `tree`  | 当前会话 + 已生成的子智能体     |
| `agent` | 此智能体的所有会话              |
| `all`   | 所有会话（如已配置，可跨智能体） |

默认值为 `tree`。沙箱隔离会话无论配置如何都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session) -- 路由、生命周期、维护
- [ACP Agents](/zh-CN/tools/acp-agents) -- 外部 harness 生成
- [多 Agent](/zh-CN/concepts/multi-agent) -- 多智能体架构
- [Gateway 网关配置](/zh-CN/gateway/configuration) -- 会话工具配置旋钮

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
