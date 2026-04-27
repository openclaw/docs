---
read_when:
    - 你想了解智能体拥有哪些会话工具
    - 你想配置跨会话访问或生成子智能体
    - 你想检查状态或控制已生成的子智能体
summary: 用于跨会话状态、记忆、消息传递和子智能体编排的 Agent 工具
title: 会话工具
x-i18n:
    generated_at: "2026-04-27T13:49:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c42436ed7123cee35f397d672db1c2e0963cd1299e36d6fff41a56b880149b
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw 为智能体提供了可跨会话工作、检查状态并编排子智能体的工具。

## 可用工具

| 工具 | 作用 |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出会话，并支持可选筛选条件（种类、标签、智能体、最近活动时间、预览） |
| `sessions_history` | 读取特定会话的转录记录 |
| `sessions_send`    | 向另一个会话发送消息，并可选择等待回复 |
| `sessions_spawn`   | 为后台工作生成一个隔离的子智能体会话 |
| `sessions_yield`   | 结束当前回合，并等待后续的子智能体结果 |
| `subagents`        | 列出、引导或终止此会话生成的子智能体 |
| `session_status`   | 显示一个类似 `/status` 的状态卡片，并可选择为每个会话设置模型覆盖 |

这些工具仍受当前工具配置文件以及 allow/deny 策略的约束。`tools.profile: "coding"` 包含完整的会话编排工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨会话消息传递工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子智能体生成功能。若要保留 messaging 配置文件并仍允许原生委派，请添加：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

组、提供商、沙箱和每个智能体的策略仍可在配置文件阶段之后移除这些工具。使用受影响会话中的 `/tools` 检查实际生效的工具列表。

## 列出并读取会话

`sessions_list` 返回会话及其 key、agentId、kind、channel、model、token 计数和时间戳。你可以按种类（`main`、`group`、`cron`、`hook`、`node`）、精确 `label`、精确 `agentId`、搜索文本或最近活动时间（`activeMinutes`）进行筛选。当你需要类似邮箱的分诊方式时，它还可以请求返回一个基于可见性范围生成的派生标题、最后一条消息的预览片段，或每行限定数量的最近消息。派生标题和预览只会为调用方在已配置的会话工具可见性策略下本就可见的会话生成，因此不相关的会话会保持隐藏。

`sessions_history` 获取特定会话的对话转录记录。默认情况下，工具结果会被排除——传入 `includeTools: true` 可查看它们。返回的视图会被有意限制并经过安全过滤：

- assistant 文本在回忆前会进行规范化处理：
  - 会移除 thinking 标签
  - 会移除 `<relevant-memories>` / `<relevant_memories>` 脚手架块
  - 会移除纯文本工具调用 XML 载荷块，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，也包括那些未能正常闭合的截断载荷
  - 会移除降级后的工具调用/结果脚手架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 会移除泄露的模型控制 token，例如 `<|assistant|>`、其他 ASCII `<|...|>` token 以及全角 `<｜...｜>` 变体
  - 会移除格式错误的 MiniMax 工具调用 XML，例如 `<invoke ...>` / `</minimax:tool_call>`
- 返回前会对类似凭证/token 的文本进行脱敏
- 长文本块会被截断
- 超大历史记录可能会丢弃较旧的行，或用 `[sessions_history omitted: message too large]` 替换过大的行
- 该工具会报告摘要标志，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted` 和 `bytes`

这两个工具都接受 **session key**（如 `"main"`）或来自先前列表调用的 **session ID**。

如果你需要精确到字节、完全一致的转录记录，请直接检查磁盘上的转录文件，而不要把 `sessions_history` 当作原始转储。

## 发送跨会话消息

`sessions_send` 会将消息投递到另一个会话，并可选择等待响应：

- **发后即忘：** 设置 `timeoutSeconds: 0` 以加入队列并立即返回。
- **等待回复：** 设置超时时间，并以内联方式获取响应。

目标响应后，OpenClaw 可以运行一个**回传循环**，让多个智能体交替发送消息（最多 5 个回合）。目标智能体可以回复 `REPLY_SKIP` 以提前停止。

## 状态与编排辅助工具

`session_status` 是适用于当前会话或另一个可见会话的轻量级 `/status` 等效工具。它会报告使用情况、时间、模型/运行时状态，以及存在时关联的后台任务上下文。与 `/status` 一样，它可以从最新的转录 usage 条目中回填稀疏的 token/缓存计数，而 `model=default` 会清除每会话覆盖。对调用方当前会话请使用 `sessionKey="current"`；像 `openclaw-tui` 这样的可见客户端标签不是 session key。

`sessions_yield` 会有意结束当前回合，以便你正在等待的后续事件能作为下一条消息到达。在生成子智能体后，如果你希望完成结果以下一条消息的形式到达，而不是构建轮询循环，就使用它。

`subagents` 是针对已生成 OpenClaw 子智能体的控制平面辅助工具。它支持：

- `action: "list"` 用于检查活跃/最近运行
- `action: "steer"` 用于向正在运行的子智能体发送后续指导
- `action: "kill"` 用于停止一个子智能体或 `all`

## 生成子智能体

`sessions_spawn` 默认会为后台任务创建一个隔离的会话。它始终是非阻塞的——会立即返回 `runId` 和 `childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"`，用于外部 harness 智能体。
- 为子会话设置 `model` 和 `thinking` 覆盖。
- `thread: true` 用于将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 用于对该子会话强制启用沙箱隔离。
- `context: "fork"` 适用于当子智能体需要当前请求者转录记录时的原生子智能体；如需一个干净的子会话，可省略该项或使用 `context: "isolated"`。

默认的叶子子智能体不会获得会话工具。当 `maxSpawnDepth >= 2` 时，深度为 1 的编排型子智能体还会额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们管理自己的子智能体。叶子运行仍不会获得递归编排工具。

完成后，公告步骤会将结果发布到请求者的渠道。完成投递会在可用时保留绑定的线程/主题路由；如果完成来源仅标识了一个渠道，OpenClaw 仍可复用请求者会话中存储的路由（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 特定行为，请参见 [ACP Agents](/zh-CN/tools/acp-agents)。

## 可见性

会话工具带有作用域限制，以限制智能体可以看到的内容：

| 级别 | 范围 |
| ------- | ---------------------------------------- |
| `self`  | 仅当前会话 |
| `tree`  | 当前会话 + 已生成的子智能体 |
| `agent` | 此智能体的所有会话 |
| `all`   | 所有会话（若已配置，也包括跨智能体） |

默认值为 `tree`。无论配置如何，沙箱隔离会话都会被限制为 `tree`。

## 延伸阅读

- [Session Management](/zh-CN/concepts/session) —— 路由、生命周期、维护
- [ACP Agents](/zh-CN/tools/acp-agents) —— 外部 harness 生成
- [Multi-agent](/zh-CN/concepts/multi-agent) —— 多智能体架构
- [Gateway Configuration](/zh-CN/gateway/configuration) —— 会话工具配置项

## 相关内容

- [Session management](/zh-CN/concepts/session)
- [Session pruning](/zh-CN/concepts/session-pruning)
