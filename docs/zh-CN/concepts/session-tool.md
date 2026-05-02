---
read_when:
    - 你想了解智能体拥有哪些会话工具
    - 你想配置跨会话访问或子智能体生成
    - 你想查看状态或控制已生成的子智能体
summary: 用于跨会话状态、记忆检索、消息传递和子智能体编排的智能体工具
title: 会话工具
x-i18n:
    generated_at: "2026-05-02T05:00:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9343d42319492ac4531edd6e6c217eae13e9c5f7b8a3fc25a345395d9f57246
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 为智能体提供工具，用于跨会话协作、检查 Status，并编排子智能体。

## 可用工具

| 工具               | 作用                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 使用可选过滤条件（类型、标签、智能体、最近活跃度、预览）列出会话  |
| `sessions_history` | 读取特定会话的转录                                   |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待                       |
| `sessions_spawn`   | 生成一个隔离的子智能体会话来执行后台工作                     |
| `sessions_yield`   | 结束当前轮次并等待后续子智能体结果               |
| `subagents`        | 列出、引导或终止此会话生成的子智能体                    |
| `session_status`   | 显示类似 `/status` 的卡片，并可选择设置每个会话的模型覆盖 |

这些工具仍然受当前工具配置档案以及允许/拒绝策略约束。`tools.profile: "coding"` 包含完整的会话编排工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨会话消息工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子智能体生成。若要保留消息配置档案并仍允许原生委派，请添加：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

组、提供商、沙箱以及每个智能体的策略仍可在配置档案阶段之后移除这些工具。请在受影响的会话中使用 `/tools` 检查实际工具列表。

## 列出和读取会话

`sessions_list` 返回会话及其键、agentId、类型、渠道、模型、令牌计数和时间戳。可按类型（`main`、`group`、`cron`、`hook`、`node`）、精确 `label`、精确 `agentId`、搜索文本或最近活跃度（`activeMinutes`）过滤。当你需要类似邮箱的分诊时，它还可以为每一行请求基于可见性范围派生的标题、最后一条消息预览片段，或有界的近期消息。派生标题和预览只会为调用方在已配置会话工具可见性策略下已经可见的会话生成，因此无关会话会保持隐藏。

`sessions_history` 获取特定会话的对话转录。默认情况下会排除工具结果；传入 `includeTools: true` 可查看它们。返回视图会被刻意限制范围并进行安全过滤：

- 智能体文本会在召回前规范化：
  - 移除思考标签
  - 移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 移除纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括从未正常闭合的截断载荷
  - 移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 移除泄漏的模型控制令牌，例如 `<|assistant|>`、其他 ASCII `<|...|>` 令牌，以及全角 `<｜...｜>` 变体
  - 移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` / `</minimax:tool_call>`
- 类似凭证/令牌的文本会在返回前被遮盖
- 长文本块会被截断
- 非常大的历史记录可能会丢弃较旧行，或用 `[sessions_history omitted: message too large]` 替换过大的行
- 该工具会报告摘要标志，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted` 和 `bytes`

两个工具都接受**会话键**（如 `"main"`）或来自先前列表调用的**会话 ID**。

如果你需要逐字节完全一致的转录，请检查磁盘上的转录文件，而不要把 `sessions_history` 当作原始转储。

## 发送跨会话消息

`sessions_send` 将消息投递到另一个会话，并可选择等待响应：

- **发送后不等待：** 将 `timeoutSeconds: 0` 设为入队后立即返回。
- **等待回复：** 设置超时并以内联方式获取响应。

线程范围的聊天会话，例如以 `:thread:<id>` 结尾的 Slack 或 Discord 键，不是有效的 `sessions_send` 目标。请使用父渠道会话键进行智能体间协调，使工具路由的消息不会出现在面向真人的活跃线程中。

消息和 A2A 后续回复会在接收提示（`[Inter-session message ... isUser=false]`）和转录来源中标记为会话间数据。接收智能体应将其视为工具路由的数据，而不是由最终用户直接编写的指令。

目标响应后，OpenClaw 可以运行**回传循环**，让智能体轮流发送消息（最多 5 轮）。目标智能体可以回复 `REPLY_SKIP` 来提前停止。

## Status 和编排辅助工具

`session_status` 是当前会话或另一个可见会话的轻量级 `/status` 等效工具。它报告使用量、时间、模型/运行时状态，以及存在时的已关联后台任务上下文。与 `/status` 一样，它可以从最新的转录使用量条目回填稀疏的令牌/缓存计数，并且 `model=default` 会清除每个会话的覆盖。使用 `sessionKey="current"` 表示调用方当前会话；可见的客户端标签如 `openclaw-tui` 不是会话键。

`sessions_yield` 会有意结束当前轮次，以便下一条消息可以是你正在等待的后续事件。在生成子智能体后，如果你希望完成结果作为下一条消息到达，而不是构建轮询循环，请使用它。

`subagents` 是用于已生成 OpenClaw 子智能体的控制面辅助工具。它支持：

- `action: "list"` 检查活跃/近期运行
- `action: "steer"` 向正在运行的子项发送后续指导
- `action: "kill"` 停止一个子项或 `all`

## 生成子智能体

`sessions_spawn` 默认会为后台任务创建一个隔离会话。它始终非阻塞，会立即返回 `runId` 和 `childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"`，用于外部 harness 智能体。
- 子会话的 `model` 和 `thinking` 覆盖。
- `thread: true` 将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 对子项强制沙箱隔离。
- 当子项需要当前请求方转录时，原生子智能体可使用 `context: "fork"`；省略它或使用 `context: "isolated"` 可获得干净的子项。

默认叶子子智能体不会获得会话工具。当 `maxSpawnDepth >= 2` 时，深度为 1 的编排器子智能体还会收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理自己的子项。叶子运行仍然不会获得递归编排工具。

完成后，公告步骤会将结果发布到请求方的渠道。完成投递会在可用时保留绑定的线程/主题路由；如果完成来源只标识一个渠道，OpenClaw 仍可复用请求方会话已存储的路由（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 特定行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 可见性

会话工具会被限定范围，以限制智能体可以看到的内容：

| 级别   | 范围                                    |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话                 |
| `tree`  | 当前会话 + 生成的子智能体     |
| `agent` | 此智能体的所有会话              |
| `all`   | 所有会话（如果已配置，则跨智能体） |

默认值为 `tree`。沙箱隔离会话无论配置如何都会被限制为 `tree`。

## 延伸阅读

- [会话管理](/zh-CN/concepts/session) -- 路由、生命周期、维护
- [ACP 智能体](/zh-CN/tools/acp-agents) -- 外部 harness 生成
- [多智能体](/zh-CN/concepts/multi-agent) -- 多智能体架构
- [Gateway 网关配置](/zh-CN/gateway/configuration) -- 会话工具配置旋钮

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
