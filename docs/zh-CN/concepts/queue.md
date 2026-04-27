---
read_when:
    - 更改自动回复执行或并发性
summary: 将入站自动回复运行串行化的命令队列设计
title: 命令队列
x-i18n:
    generated_at: "2026-04-27T08:36:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90824e592379b46b568b9f7ab017c2d68bf9b741349fe88f63e358a4c8754751
    source_path: concepts/queue.md
    workflow: 15
---

我们通过一个小型进程内队列，将入站自动回复运行（所有渠道）串行化，以防止多个智能体运行发生冲突，同时仍允许会话之间进行安全并行。

## 原因

- 自动回复运行可能开销较大（LLM 调用），并且当多条入站消息在相近时间到达时，运行之间可能发生冲突。
- 串行化可以避免争用共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的可能性。

## 工作方式

- 一个按 lane 感知的 FIFO 队列会按每个 lane 进行排空，并带有可配置的并发上限（未配置 lane 默认值为 1；`main` 默认为 4，`subagent` 默认为 8）。
- `runEmbeddedPiAgent` 会按 **session key** 入队（lane `session:<key>`），以确保每个会话同一时间只有一个活动运行。
- 随后，每个会话运行会被排入一个**全局 lane**（默认为 `main`），因此整体并行度会受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队运行在开始前等待超过约 2 秒，队列会输出一条简短提示。
- 输入指示器在入队时仍会立即触发（若该渠道支持），因此等待期间用户体验不会改变。

## 队列模式（按渠道）

入站消息可以引导当前运行、等待后续轮次，或同时执行两者：

- `steer`：立即注入当前运行（在下一个工具边界之后取消待处理的工具调用）。如果当前未处于流式传输，则回退为 followup。
- `followup`：在当前运行结束后，为下一个智能体轮次入队。
- `collect`：将所有已排队消息合并为**单个**后续轮次（默认）。如果消息目标是不同渠道/线程，则会分别排空以保留路由。
- `steer-backlog`（也叫 `steer+backlog`）：立即 steer，**并且**为后续轮次保留该消息。
- `interrupt`（旧版）：中止该会话的当前活动运行，然后运行最新消息。
- `queue`（旧版别名）：与 `steer` 相同。

Steer-backlog 意味着在 steered 运行之后，你可能还会收到一条 followup 响应，因此流式界面看起来可能像是重复回复。如果你希望每条入站消息只得到一个响应，优先使用 `collect`/`steer`。
将 `/queue collect` 作为独立命令发送（按会话生效），或设置 `messages.queue.byChannel.discord: "collect"`。

默认值（配置中未设置时）：

- 所有界面 → `collect`

可通过 `messages.queue` 全局配置或按渠道配置：

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 队列选项

这些选项适用于 `followup`、`collect` 和 `steer-backlog`（也适用于回退为 followup 的 `steer`）：

- `debounceMs`：在启动后续轮次之前等待静默期（防止出现“continue, continue”）。
- `cap`：每个会话允许排队的最大消息数。
- `drop`：溢出策略（`old`、`new`、`summarize`）。

Summarize 会保留一份简短的已丢弃消息项目符号列表，并将其作为合成的 followup 提示注入。
默认值：`debounceMs: 1000`、`cap: 20`、`drop: summarize`。

## 按会话覆盖

- 将 `/queue <mode>` 作为独立命令发送，以为当前会话存储该模式。
- 选项可组合使用：`/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除该会话的覆盖设置。

## 范围与保证

- 适用于所有使用 Gateway 网关回复流水线的入站渠道中的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）是入站回复与主心跳共享的进程级 lane；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行。
- 还可以存在其他 lane（例如 `cron`、`nested`、`subagent`），这样后台任务就可以并行运行，而不会阻塞入站回复。隔离的 cron 智能体轮次会占用一个 `cron` 槽位，而其内部智能体执行会使用 `nested`；两者都使用 `cron.maxConcurrentRuns`。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。
- 按会话 lane 可保证同一时间只有一个智能体运行会触及特定会话。
- 无需外部依赖或后台工作线程；纯 TypeScript + promises。

## 故障排除

- 如果命令似乎卡住了，请启用详细日志，并查找“queued for …ms”行，以确认队列正在排空。
- 如果你需要查看队列深度，请启用详细日志并关注队列计时相关日志行。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [重试策略](/zh-CN/concepts/retry)
