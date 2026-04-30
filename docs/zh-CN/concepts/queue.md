---
read_when:
    - 更改自动回复执行或并发
    - 解释 /queue 模式或消息引导行为
summary: 自动回复队列模式、默认值和按会话覆盖设置
title: 命令队列
x-i18n:
    generated_at: "2026-04-30T18:26:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

我们通过一个极小的进程内队列串行化入站自动回复运行（所有渠道），以防止多个智能体运行相互冲突，同时仍允许跨会话安全并行。

## 原因

- 自动回复运行可能开销较高（LLM 调用），并且当多条入站消息接近同时到达时可能发生冲突。
- 串行化可避免争用共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的概率。

## 工作方式

- 一个感知 lane 的 FIFO 队列会按可配置的并发上限排空每个 lane（未配置的 lane 默认值为 1；main 默认值为 4，subagent 默认值为 8）。
- `runEmbeddedPiAgent` 按 **会话键**（lane `session:<key>`）入队，以保证每个会话同一时间只有一个活动运行。
- 然后，每个会话运行都会被排入一个 **全局 lane**（默认 `main`），使整体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队的运行在开始前等待超过约 2 秒，会发出一条简短通知。
- 输入指示器仍会在入队时立即触发（如果渠道支持），因此用户体验在等待轮到我们时保持不变。

## 默认值

未设置时，所有入站渠道界面使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是默认值，因为它能保持活动模型轮次响应迅速，而无需
启动第二个会话运行。它会排空在下一个模型边界之前到达的所有 Steering 消息。如果当前运行无法接受 steering，
OpenClaw 会回退到一个 followup 队列条目。

## 队列模式

入站消息可以 steer 当前运行、等待 followup 轮次，或两者都做：

- `steer`：将 Steering 消息排入活动运行时。Pi 会在 **当前 assistant 轮次执行完其工具调用之后**、下一次 LLM 调用之前，交付所有待处理的 Steering 消息；Codex app-server 会接收一个批量的 `turn/steer`。如果该运行未处于活动流式传输状态，或 steering 不可用，OpenClaw 会回退到一个 followup 队列条目。
- `queue`（旧版）：旧的一次一条 steering。Pi 会在每个模型边界交付一条排队的 Steering 消息；Codex app-server 会接收单独的 `turn/steer` 请求。除非你需要以前的串行化行为，否则优先使用 `steer`。
- `followup`：在当前运行结束后，将每条消息入队，供后续智能体轮次处理。
- `collect`：在静默窗口之后，将排队的消息合并为 **单个** followup 轮次。如果消息面向不同渠道/线程，它们会单独排空以保留路由。
- `steer-backlog`（也称为 `steer+backlog`）：立即 steer，**并且** 保留同一条消息用于 followup 轮次。
- `interrupt`（旧版）：中止该会话的活动运行，然后运行最新消息。

Steer-backlog 表示你可能会在被 steered 的运行之后得到一个 followup 响应，因此
流式传输界面可能看起来像重复响应。如果你希望每条入站消息只有
一个响应，请优先使用 `collect`/`steer`。

有关特定运行时的时序和依赖行为，请参阅
[Steering queue](/zh-CN/concepts/queue-steering)。

通过 `messages.queue` 进行全局配置或按渠道配置：

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 队列选项

选项适用于 `followup`、`collect` 和 `steer-backlog`（也适用于 steering 回退到 followup 时的 `steer` 或旧版 `queue`）：

- `debounceMs`：排空排队 followup 之前的静默窗口。裸数字表示毫秒；`/queue` 选项接受单位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每个会话最多排队的消息数。低于 `1` 的值会被忽略。
- `drop: "summarize"`：默认值。按需丢弃最旧的排队条目，保留紧凑摘要，并将其作为合成 followup prompt 注入。
- `drop: "old"`：按需丢弃最旧的排队条目，不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 优先级

对于模式选择，OpenClaw 的解析顺序为：

1. 内联或已存储的按会话 `/queue` 覆盖。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认 `steer`。

对于选项，内联或已存储的 `/queue` 选项优先于配置。然后依次应用
渠道特定 debounce（`messages.queue.debounceMsByChannel`）、插件
debounce 默认值、全局 `messages.queue` 选项以及内置默认值。`cap` 和 `drop` 是全局/会话选项，而不是按渠道的配置
键名。

## 按会话覆盖

- 将 `/queue <mode>` 作为独立命令发送，以存储当前会话的模式。
- 选项可以组合使用：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 范围与保证

- 适用于所有使用 Gateway 网关回复管线的入站渠道中的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）在进程范围内用于入站 + 主 Heartbeat；设置 `agents.defaults.maxConcurrent` 以允许多个会话并行。
- 可能存在其他 lane（例如 `cron`、`cron-nested`、`nested`、`subagent`），以便后台作业可以并行运行，而不会阻塞入站回复。隔离的 cron 智能体轮次在其内部智能体执行使用 `cron-nested` 时会占用一个 `cron` slot；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流程会保留自身的 lane 行为。这些分离运行会作为 [后台任务](/zh-CN/automation/tasks) 跟踪。
- 按会话 lane 保证同一时间只有一个智能体运行会触及给定会话。
- 无外部依赖或后台 worker 线程；纯 TypeScript + promises。

## 故障排除

- 如果命令似乎卡住，请启用详细日志并查找 “queued for …ms” 行，以确认队列正在排空。
- 如果你需要队列深度，请启用详细日志并观察队列时序行。
- Codex app-server 中接受一个轮次后停止发出进度的运行，会由 Codex adapter 中断，以便活动会话 lane 可以释放，而不是等待外层运行超时。
- 启用诊断时，保持 `processing` 超过 `diagnostics.stuckSessionWarnMs` 的会话会记录卡住会话警告。默认情况下，活动嵌入式运行、活动回复操作和活动 lane 任务仍仅发出警告；如果陈旧的启动记账没有活动会话工作，则可以释放受影响的会话 lane，使排队工作得以排空。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [重试策略](/zh-CN/concepts/retry)
