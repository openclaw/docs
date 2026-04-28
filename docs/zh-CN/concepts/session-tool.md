---
read_when:
    - 你想了解智能体有哪些会话工具
    - 你想配置跨会话访问或子智能体生成
    - 你想查看状态或控制已启动的子智能体
summary: 用于跨会话状态、召回、消息传递和子智能体编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-04-28T19:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 为智能体提供工具，用于跨会话工作、检查 Status，并
编排子智能体。

## 可用工具

| 工具               | 作用                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出会话，可选筛选条件包括类型、标签、智能体、最近活动、预览                |
| `sessions_history` | 读取特定会话的转录记录                                                      |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待                                          |
| `sessions_spawn`   | 生成一个隔离的子智能体会话用于后台工作                                      |
| `sessions_yield`   | 结束当前轮次并等待后续子智能体结果                                          |
| `subagents`        | 列出、引导或终止此会话生成的子智能体                                        |
| `session_status`   | 显示类似 `/status` 的卡片，并可选择设置每会话模型覆盖项                     |

这些工具仍受当前工具 profile 和允许/拒绝策略约束。`tools.profile: "coding"` 包含完整的会话编排
工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。
`tools.profile: "messaging"` 包含跨会话消息工具
（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但
不包含子智能体生成。若要保留 messaging profile，同时仍允许原生委托，请添加：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

组、提供商、沙箱和每智能体策略仍可在 profile 阶段之后移除这些工具。
在受影响的会话中使用 `/tools` 检查实际生效的工具列表。

## 列出和读取会话

`sessions_list` 返回会话及其 key、agentId、类型、渠道、模型、
token 计数和时间戳。可按类型（`main`、`group`、`cron`、`hook`、
`node`）、精确 `label`、精确 `agentId`、搜索文本或最近活动
（`activeMinutes`）筛选。当你需要类似邮箱的分诊时，它还可以请求
可见性范围内派生的标题、最后一条消息预览片段，或每一行上有界的
近期消息。派生标题和预览只会为调用方在已配置的会话工具可见性策略下
已经可见的会话生成，因此无关会话会保持隐藏。

`sessions_history` 获取特定会话的对话转录记录。
默认情况下，工具结果会被排除——传入 `includeTools: true` 可查看它们。
返回视图是刻意有界且经过安全过滤的：

- 助手文本会在召回前标准化：
  - thinking 标签会被移除
  - `<relevant-memories>` / `<relevant_memories>` 脚手架块会被移除
  - 纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>` 会被移除，包括从未正常闭合的截断
    载荷
  - 降级的工具调用/结果脚手架，例如 `[Tool Call: ...]`、
    `[Tool Result ...]` 和 `[Historical context ...]` 会被移除
  - 泄漏的模型控制 token，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` token，以及全角 `<｜...｜>` 变体会被移除
  - 格式异常的 MiniMax 工具调用 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>` 会被移除
- 类似凭证/token 的文本会在返回前被遮盖
- 长文本块会被截断
- 非常大的历史记录可能会丢弃较旧的行，或将超大的行替换为
  `[sessions_history omitted: message too large]`
- 该工具会报告摘要标志，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted` 和 `bytes`

两个工具都接受 **会话 key**（如 `"main"`）或上一次列表调用中的 **会话 ID**。

如果你需要逐字节完全一致的转录记录，请检查磁盘上的转录文件，
而不是把 `sessions_history` 当作原始转储。

## 发送跨会话消息

`sessions_send` 会向另一个会话投递消息，并可选择等待响应：

- **发送后不等待：** 设置 `timeoutSeconds: 0`，入队后立即返回。
- **等待回复：** 设置超时时间，并以内联方式获取响应。

消息和 A2A 后续回复会在接收方提示词中标记为会话间数据
（`[Inter-session message ... isUser=false]`），并记录在转录来源中。
接收智能体应将其视为由工具路由的数据，而不是最终用户直接撰写的指令。

目标响应后，OpenClaw 可以运行 **回复回传循环**，让智能体交替发送消息
（最多 5 轮）。目标智能体可以回复 `REPLY_SKIP` 以提前停止。

## Status 与编排辅助工具

`session_status` 是当前会话或另一个可见会话的轻量级 `/status` 等效工具。
它会报告使用情况、时间、模型/运行时状态，以及存在时的关联后台任务上下文。
与 `/status` 一样，它可以从最新的转录用量条目回填稀疏的 token/cache 计数器，并且
`model=default` 会清除每会话覆盖项。调用方当前会话请使用
`sessionKey="current"`；可见客户端标签（如 `openclaw-tui`）不是会话 key。

`sessions_yield` 会有意结束当前轮次，以便下一条消息可以是你正在等待的
后续事件。在生成子智能体后，如果你希望完成结果作为下一条消息到达，
而不是构建轮询循环，请使用它。

`subagents` 是用于已生成 OpenClaw 子智能体的控制平面辅助工具。
它支持：

- `action: "list"` 用于检查活跃/近期运行
- `action: "steer"` 用于向正在运行的子会话发送后续指导
- `action: "kill"` 用于停止一个子会话或 `all`

## 生成子智能体

`sessions_spawn` 默认会为后台任务创建一个隔离会话。
它始终是非阻塞的——会立即返回 `runId` 和
`childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"`，用于外部 harness 智能体。
- 子会话的 `model` 和 `thinking` 覆盖项。
- `thread: true`，将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"`，对子会话强制执行沙箱隔离。
- `context: "fork"`，用于在子会话需要当前请求方转录记录时的原生子智能体；
  省略它或使用 `context: "isolated"` 可获得干净的子会话。

默认叶子子智能体不会获得会话工具。当
`maxSpawnDepth >= 2` 时，深度为 1 的编排型子智能体会额外获得
`sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，
以便它们管理自己的子会话。叶子运行仍不会获得递归编排工具。

完成后，公告步骤会将结果发布到请求方的渠道。
完成交付会在可用时保留绑定的线程/主题路由，并且如果完成来源只标识了一个渠道，
OpenClaw 仍可以复用请求方会话存储的路由（`lastChannel` / `lastTo`）进行直接交付。

关于 ACP 专属行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 可见性

会话工具会按范围限制智能体可见的内容：

| 级别    | 范围                                     |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话                               |
| `tree`  | 当前会话 + 已生成的子智能体              |
| `agent` | 此智能体的所有会话                       |
| `all`   | 所有会话（如已配置，则跨智能体）         |

默认值为 `tree`。无论配置如何，沙箱隔离的会话都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session)——路由、生命周期、维护
- [ACP 智能体](/zh-CN/tools/acp-agents)——外部 harness 生成
- [多智能体](/zh-CN/concepts/multi-agent)——多智能体架构
- [Gateway 网关配置](/zh-CN/gateway/configuration)——会话工具配置旋钮

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话剪枝](/zh-CN/concepts/session-pruning)
