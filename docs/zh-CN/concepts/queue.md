---
read_when:
    - 更改自动回复执行或并发设置
summary: 序列化入站自动回复运行的命令队列设计
title: 命令队列
x-i18n:
    generated_at: "2026-04-28T19:41:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ed2bd9fad7f35f124b99c570703ddd075c742391061a977323c28feaf3ab508
    source_path: concepts/queue.md
    workflow: 16
---

我们通过一个很小的进程内队列，对入站自动回复运行（所有渠道）进行序列化，防止多个智能体运行相互冲突，同时仍允许在不同会话之间进行安全并行。

## 原因

- 自动回复运行可能很昂贵（LLM 调用），并且当多个入站消息几乎同时到达时可能发生冲突。
- 序列化可避免竞争共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的概率。

## 工作原理

- 一个感知通道的 FIFO 队列会按通道排空，并带有可配置的并发上限（未配置通道默认 1；main 默认 4，subagent 默认 8）。
- `runEmbeddedPiAgent` 按**会话键**（通道 `session:<key>`）入队，以保证每个会话同一时间只有一个活跃运行。
- 然后，每个会话运行会被排入一个**全局通道**（默认 `main`），因此整体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队运行在启动前等待超过约 2s，会发出一条简短通知。
- 输入中指示器仍会在入队时立即触发（如果渠道支持），因此在等待轮到我们期间，用户体验保持不变。

## 队列模式（按渠道）

入站消息可以引导当前运行、等待后续轮次，或两者都做：

- `steer`：立即注入当前运行（在下一个工具边界后取消待处理的工具调用）。如果不是流式传输，则回退到 followup。
- `followup`：在当前运行结束后，为下一次智能体轮次入队。
- `collect`：将所有排队消息合并为**单个**后续轮次（默认）。如果消息目标是不同渠道/线程，则会单独排空以保留路由。
- `steer-backlog`（也称为 `steer+backlog`）：现在引导，**同时**保留消息用于后续轮次。
- `interrupt`（旧版）：中止该会话中的活跃运行，然后运行最新消息。
- `queue`（旧版别名）：与 `steer` 相同。

Steer-backlog 表示你可能会在被引导的运行之后获得一个后续响应，因此
流式传输界面可能看起来像重复响应。如果你想要
每条入站消息对应一个响应，请优先使用 `collect`/`steer`。
发送 `/queue collect` 作为独立命令（按会话），或设置 `messages.queue.byChannel.discord: "collect"`。

默认值（配置中未设置时）：

- 所有界面 → `collect`

通过 `messages.queue` 进行全局配置或按渠道配置：

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

选项适用于 `followup`、`collect` 和 `steer-backlog`（也适用于回退到 followup 的 `steer`）：

- `debounceMs`：等待安静后再启动后续轮次（防止“继续，继续”）。
- `cap`：每个会话的最大排队消息数。
- `drop`：溢出策略（`old`、`new`、`summarize`）。

Summarize 会保留一份被丢弃消息的简短项目符号列表，并将其作为合成后续提示注入。
默认值：`debounceMs: 1000`、`cap: 20`、`drop: summarize`。

## 按会话覆盖

- 发送 `/queue <mode>` 作为独立命令，以保存当前会话的模式。
- 选项可以组合：`/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 范围和保证

- 适用于所有使用 Gateway 网关回复管线的入站渠道上的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认通道（`main`）对于入站 + 主心跳在整个进程内生效；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行。
- 可能存在其他通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此后台任务可以并行运行，而不会阻塞入站回复。隔离的 cron 智能体轮次会占用一个 `cron` 槽位，而其内部智能体执行使用 `cron-nested`；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流程保留自身的通道行为。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。
- 按会话通道保证同一时间只有一个智能体运行会触碰给定会话。
- 没有外部依赖或后台工作线程；纯 TypeScript + promises。

## 故障排除

- 如果命令看起来卡住，请启用详细日志，并查找“queued for …ms”行以确认队列正在排空。
- 如果你需要队列深度，请启用详细日志并观察队列计时行。
- 启用诊断时，超过 `diagnostics.stuckSessionWarnMs` 仍停留在 `processing` 的会话会记录卡住会话警告。默认情况下，活跃的嵌入式运行、活跃的回复操作和活跃的通道任务只会发出警告；没有活跃会话工作的陈旧启动记账可以释放受影响的会话通道，使排队工作继续排空。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [重试策略](/zh-CN/concepts/retry)
