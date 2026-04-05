---
read_when:
    - 修改自动回复执行或并发行为
summary: 用于串行化入站自动回复运行的命令队列设计
title: 命令队列
x-i18n:
    generated_at: "2026-04-05T08:21:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36e1d004e9a2c21ad1470517a249285216114dd4cf876681cc860e992c73914f
    source_path: concepts/queue.md
    workflow: 15
---

# 命令队列（2026-01-16）

我们通过一个极小的进程内队列将入站自动回复运行（所有渠道）串行化，以防止多个智能体运行发生碰撞，同时仍允许跨会话的安全并行。

## 为什么

- 自动回复运行可能开销很大（LLM 调用），并且当多条入站消息在短时间内到达时可能发生冲突。
- 串行化可以避免争用共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的可能性。

## 工作原理

- 具备通道感知能力的 FIFO 队列会按每个通道进行排空，并使用可配置的并发上限（未配置通道默认值为 1；main 默认为 4，subagent 默认为 8）。
- `runEmbeddedPiAgent` 会按**会话键**入队（通道 `session:<key>`），以确保每个会话任意时刻只有一个活动运行。
- 然后，每个会话运行还会被加入一个**全局通道**（默认是 `main`），这样总体并行度就受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队的运行在开始前等待超过约 2 秒，会发出一条简短通知。
- 输入中指示器仍会在入队时立即触发（如果该渠道支持），因此虽然需要排队等待，但用户体验不会改变。

## 队列模式（按渠道）

入站消息可以转向当前运行、等待后续轮次，或两者兼有：

- `steer`：立即注入当前运行（在下一个工具边界之后取消待处理工具调用）。如果当前不在流式传输，则回退为 followup。
- `followup`：在当前运行结束后，为下一次智能体轮次加入队列。
- `collect`：将所有排队消息合并为**单个**后续轮次（默认）。如果消息面向不同渠道/线程，则会分别排空，以保留路由。
- `steer-backlog`（也叫 `steer+backlog`）：立即 steer，**同时**保留该消息用于后续轮次。
- `interrupt`（旧版）：中止该会话的活动运行，然后运行最新消息。
- `queue`（旧别名）：与 `steer` 相同。

Steer-backlog 表示在 steer 运行之后，你可能还会收到一条 followup 回复，因此在流式界面上看起来可能像重复内容。如果你希望每条入站消息只得到一个回复，优先使用 `collect`/`steer`。
发送独立命令 `/queue collect`（按会话生效），或设置 `messages.queue.byChannel.discord: "collect"`。

默认值（配置未设置时）：

- 所有表面 → `collect`

通过 `messages.queue` 进行全局或按渠道配置：

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

- `debounceMs`：在启动后续轮次前等待安静期（防止出现“继续、继续”）。
- `cap`：每个会话允许排队的最大消息数。
- `drop`：溢出策略（`old`、`new`、`summarize`）。

Summarize 会保留一份被丢弃消息的简短项目符号列表，并将其作为合成的后续提示注入。
默认值：`debounceMs: 1000`、`cap: 20`、`drop: summarize`。

## 按会话覆盖

- 发送独立命令 `/queue <mode>` 可为当前会话存储该模式。
- 可组合选项：`/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除该会话覆盖。

## 范围和保证

- 适用于所有使用 Gateway 网关回复管道的入站渠道中的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认通道（`main`）是进程范围的，用于入站消息 + main 心跳；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行。
- 还可能存在其他通道（例如 `cron`、`subagent`），以便后台任务并行运行，而不会阻塞入站回复。这些分离运行会作为[后台任务](/automation/tasks)进行跟踪。
- 按会话通道可保证任意时刻只有一个智能体运行会访问某个给定会话。
- 无外部依赖，也无后台工作线程；纯 TypeScript + promises。

## 故障排除

- 如果命令看起来卡住了，请启用详细日志，并查找 “queued for …ms” 行，以确认队列正在排空。
- 如果你需要查看队列深度，请启用详细日志并观察队列时间相关行。
