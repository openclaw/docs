---
read_when:
    - 你想了解智能体有哪些会话工具
    - 你想配置跨会话访问或子智能体生成
    - 你想检查已生成的子智能体状态
summary: 用于跨会话状态、回忆、消息传递和子智能体编排的 Agent 工具
title: 会话工具
x-i18n:
    generated_at: "2026-07-04T20:24:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 为智能体提供工具，用于跨会话工作、检查状态，以及
编排子智能体。

## 可用工具

| 工具               | 作用                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出会话，并支持可选过滤器（种类、标签、智能体、归档、预览）  |
| `sessions_history` | 读取特定会话的转录                                   |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待                       |
| `sessions_spawn`   | 为后台工作生成一个隔离的子智能体会话                     |
| `sessions_yield`   | 结束当前轮次并等待后续子智能体结果               |
| `subagents`        | 列出此会话生成的子智能体状态                              |
| `session_status`   | 显示一个 `/status` 风格的卡片，并可选择设置每会话模型覆盖 |

这些工具仍受活动工具配置文件和允许/拒绝
策略约束。`tools.profile: "coding"` 包含完整的会话编排
工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。
`tools.profile: "messaging"` 包含跨会话消息工具
（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但
不包含子智能体生成。若要保留消息配置文件并仍然
允许原生委派，请添加：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

组、提供商、沙箱和按智能体配置的策略仍可在配置文件阶段之后
移除这些工具。请从受影响的会话使用 `/tools` 检查
有效工具列表。

## 列出和读取会话

`sessions_list` 返回会话及其键、agentId、种类、渠道、模型、
令牌计数和时间戳。可按种类（`main`、`group`、`cron`、`hook`、
`node`）、精确 `label`、精确 `agentId`、搜索文本或最近活跃程度
（`activeMinutes`）过滤。默认返回活跃会话；传入 `archived: true`
可检查已归档会话。行中包含其置顶和归档状态。当
你需要类似邮箱的分诊时，它还可以请求一个
按可见性范围派生的标题、最后一条消息预览片段，或每行有界的最近
消息。派生标题和预览只会为调用方在配置的会话工具可见性策略下
已经可见的会话生成，因此无关会话会保持隐藏。当可见性受限时，
`sessions_list` 会返回可选的 `visibility` 元数据，显示有效模式以及结果
可能受范围限制的警告。

`sessions_history` 获取特定会话的对话转录。
默认情况下会排除工具结果；传入 `includeTools: true` 可查看它们。
使用 `limit` 获取最新的有界尾部。当你需要分页元数据时传入
`offset: 0`，然后传入返回的 `nextOffset` 值，向后翻页浏览更早的
OpenClaw 转录窗口，而无需读取原始转录文件。
显式偏移页面不会合并外部 CLI 回退导入；当你需要合并后的显示历史时，
请使用默认的最新尾部视图。
返回的视图有意保持有界并经过安全过滤：

- 助手文本会在召回前规范化：
  - thinking 标签会被剥离
  - `<relevant-memories>` / `<relevant_memories>` 脚手架块会被剥离
  - 纯文本工具调用 XML 负载块，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>` 会被剥离，包括从未正常闭合的截断
    负载
  - 降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、
    `[Tool Result ...]` 和 `[Historical context ...]` 会被剥离
  - 泄漏的模型控制令牌，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` 令牌，以及全角 `<｜...｜>` 变体会被剥离
  - 格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>` 会被剥离
- 类似凭证/令牌的文本会在返回前被遮盖
- 长文本块会被截断
- 非常大的历史记录可能会丢弃较旧的行，或用
  `[sessions_history omitted: message too large]` 替换过大的行
- 该工具会报告摘要标志，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted`、`bytes`，以及分页元数据

这两个工具都接受 **会话键**（如 `"main"`）或先前列表调用中的 **会话 ID**。

如果你需要逐字节完全一致的转录，请检查磁盘上的转录文件，
而不是把 `sessions_history` 当作原始转储。

## 发送跨会话消息

`sessions_send` 向另一个会话递送消息，并可选择等待
响应：

- **发送后不等待：** 设置 `timeoutSeconds: 0` 以入队并
  立即返回。
- **等待回复：** 设置超时并内联获取响应。

线程范围的聊天会话，例如以 `:thread:<id>` 结尾的 Slack 或 Discord 键，
不是有效的 `sessions_send` 目标。请使用父渠道
会话键进行智能体间协调，这样工具路由的消息就不会出现在
面向真人的活动线程中。

消息和 A2A 后续回复会在接收提示词
（`[Inter-session message ... isUser=false]`）和转录来源中标记为会话间数据。
接收智能体应将它们视为工具路由的数据，而不是
最终用户直接编写的指令。

目标响应后，OpenClaw 可以运行一个 **回传回复循环**，让
智能体交替发送消息（最多 `session.agentToAgent.maxPingPongTurns`，范围
0-20，默认 5）。目标智能体可以回复
`REPLY_SKIP` 以提前停止。

## 状态和编排辅助工具

`session_status` 是当前会话或另一个可见会话的轻量级 `/status`
等效工具。它报告用量、时间、模型/运行时状态，以及存在时的
关联后台任务上下文。与 `/status` 一样，它可以从最新转录用量条目回填
稀疏的令牌/缓存计数器，并且
`model=default` 会清除每会话覆盖。调用方的当前会话请使用
`sessionKey="current"`；`openclaw-tui` 等可见客户端标签
不是会话键。

当路由元数据可用时，`session_status` 还会包含一个可见的
`Route context` JSON 块和匹配的结构化 `details` 字段。这些
字段用于区分会话键和当前正在处理实时运行的路由：

- `origin` 是会话创建的位置；若较旧状态缺少存储的来源元数据，则为从
  可递送会话键前缀推断出的提供商。
- `active` 是当前实时运行路由。它只会针对现在正在处理的实时或
  当前会话报告。
- `deliveryContext` 是存储在会话上的持久递送路由，
  即使活动表面不同，OpenClaw 之后也可以复用它进行递送。

`sessions_yield` 会有意结束当前轮次，以便下一条消息可以成为
你正在等待的后续事件。在生成子智能体后，如果你希望完成结果作为
下一条消息到达，而不是构建轮询循环，请使用它。

`subagents` 是用于已生成 OpenClaw
子智能体的可见性辅助工具。它支持 `action: "list"` 来检查活跃/最近运行。

## 生成子智能体

`sessions_spawn` 默认会为后台任务创建一个隔离会话。
它始终是非阻塞的，会立即返回 `runId` 和
`childSessionKey`。原生子智能体运行会在子会话的第一条可见
`[Subagent Task]` 消息中接收被委派的任务，而系统
提示词只携带子智能体运行时规则和路由上下文。

关键选项：

- `runtime: "subagent"`（默认）或用于外部 harness 智能体的 `"acp"`。
- 子会话的 `model` 和 `thinking` 覆盖。
- `thread: true` 将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 在子会话上强制执行沙箱隔离。
- 当子会话需要当前请求方转录时，原生子智能体使用 `context: "fork"`；
  省略它或使用 `context: "isolated"` 可获得干净的子会话。
  线程绑定的原生子智能体默认使用 `context: "fork"`，除非
  `threadBindings.defaultSpawnContext` 另有设置。

默认叶子子智能体不会获得会话工具。当
`maxSpawnDepth >= 2` 时，深度为 1 的编排型子智能体还会收到
`sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们
可以管理自己的子级。叶子运行仍然不会获得递归
编排工具。

完成后，一个公告步骤会将结果发布到请求方的渠道。
完成递送会在可用时保留绑定的线程/主题路由，并且如果
完成来源只标识一个渠道，OpenClaw 仍可以复用
请求方会话存储的路由（`lastChannel` / `lastTo`）进行直接
递送。

有关 ACP 特定行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 可见性

会话工具会限定范围，以限制智能体可见内容：

| 级别   | 范围                                    |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话                 |
| `tree`  | 当前会话 + 生成的子智能体     |
| `agent` | 此智能体的所有会话              |
| `all`   | 所有会话（如已配置，则可跨智能体） |

默认值为 `tree`。无论配置如何，沙箱隔离的会话都会被限制为
`tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session) -- 路由、生命周期、维护
- [ACP 智能体](/zh-CN/tools/acp-agents) -- 外部 harness 生成
- [多智能体](/zh-CN/concepts/multi-agent) -- 多智能体架构
- [Gateway 网关配置](/zh-CN/gateway/configuration) -- 会话工具配置旋钮

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
