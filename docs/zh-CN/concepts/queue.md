---
read_when:
    - 更改自动回复执行方式或并发设置
    - 说明 /queue 模式或消息引导行为
summary: 自动回复队列模式、默认值和按会话覆盖项
title: 命令队列
x-i18n:
    generated_at: "2026-05-03T22:25:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

我们将入站自动回复运行（所有渠道）通过一个很小的进程内队列串行化，防止多个智能体运行互相冲突，同时仍允许跨会话的安全并行。

## 原因

- 自动回复运行可能很昂贵（LLM 调用），并且当多条入站消息几乎同时到达时可能会冲突。
- 串行化可避免争用共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的概率。

## 工作原理

- 一个感知 lane 的 FIFO 队列会按可配置的并发上限排空每个 lane（未配置 lane 默认值为 1；main 默认值为 4，subagent 为 8）。
- `runEmbeddedPiAgent` 按**会话键**（lane `session:<key>`）入队，以保证每个会话同时只有一个活跃运行。
- 然后每个会话运行都会被排入一个**全局 lane**（默认为 `main`），因此整体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队的运行在启动前等待超过约 2 秒，会发出一条简短通知。
- 输入指示器仍会在入队时立即触发（如果渠道支持），因此等待轮到自己时，用户体验不会改变。

## 默认值

未设置时，所有入站渠道界面使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是默认值，因为它能让活跃模型轮次保持响应，而不会
启动第二个会话运行。它会排空在下一个模型边界之前到达的所有 steering 消息。
如果当前运行无法接受 steering，OpenClaw 会回退到一个 followup 队列条目。

## 队列模式

入站消息可以 steer 当前运行、等待后续轮次，或两者兼做：

- `steer`：将 steering 消息排入活跃运行时。Pi 会在**当前助手轮次完成其工具调用执行之后**、下一次 LLM 调用之前，交付所有待处理的 steering 消息；Codex app-server 会收到一个批处理的 `turn/steer`。如果运行没有处于活跃流式传输状态，或 steering 不可用，OpenClaw 会回退到一个 followup 队列条目。
- `queue`（旧版）：旧的一次一个 steering。Pi 会在每个模型边界交付一条排队的 steering 消息；Codex app-server 会收到单独的 `turn/steer` 请求。除非你需要之前的串行化行为，否则优先使用 `steer`。
- `followup`：在当前运行结束后，将每条消息入队给稍后的智能体轮次。
- `collect`：在安静窗口之后，将排队的消息合并成**单个** followup 轮次。如果消息面向不同渠道/线程，则会分别排空，以保留路由。
- `steer-backlog`（也称为 `steer+backlog`）：现在 steer，**并且**保留同一条消息用于 followup 轮次。
- `interrupt`（旧版）：中止该会话的活跃运行，然后运行最新消息。

Steer-backlog 意味着你可能会在 steered 运行之后得到一个 followup 响应，因此
流式传输界面可能看起来像重复响应。如果你希望每条入站消息只得到
一个响应，请优先使用 `collect`/`steer`。

有关特定运行时的时序和依赖行为，请参阅
[Steering queue](/zh-CN/concepts/queue-steering)。有关显式 `/steer <message>`
命令，请参阅 [Steer](/zh-CN/tools/steer)。

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

- `debounceMs`：排空已排队 followup 之前的安静窗口。裸数字表示毫秒；`/queue` 选项接受单位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每个会话的最大排队消息数。低于 `1` 的值会被忽略。
- `drop: "summarize"`：默认值。按需丢弃最旧的队列条目，保留紧凑摘要，并将它们作为合成 followup prompt 注入。
- `drop: "old"`：按需丢弃最旧的队列条目，不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 优先级

对于模式选择，OpenClaw 按以下顺序解析：

1. 内联或已存储的每会话 `/queue` 覆盖。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认 `steer`。

对于选项，内联或已存储的 `/queue` 选项优先于配置。然后会依次应用
渠道特定 debounce（`messages.queue.debounceMsByChannel`）、插件
debounce 默认值、全局 `messages.queue` 选项和内置默认值。
`cap` 和 `drop` 是全局/会话选项，而不是按渠道配置的
键名。

## 每会话覆盖

- 发送 `/queue <mode>` 作为独立命令，以存储当前会话的模式。
- 选项可以组合：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 适用范围和保证

- 适用于所有使用 Gateway 网关回复流水线的入站渠道上的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）在进程范围内供入站 + main heartbeats 使用；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行。
- 可能存在其他 lane（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此后台作业可以并行运行而不阻塞入站回复。隔离的 cron 智能体轮次会持有一个 `cron` slot，而其内部智能体执行使用 `cron-nested`；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流程保持自己的 lane 行为。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。
- 每会话 lane 保证同一时间只有一个智能体运行会触碰给定会话。
- 无外部依赖或后台 worker 线程；纯 TypeScript + Promise。

## 故障排除

- 如果命令看起来卡住，请启用详细日志，并查找 “queued for …ms” 行来确认队列正在排空。
- 如果你需要队列深度，请启用详细日志并观察队列时序行。
- Codex app-server 在接受一个轮次后如果停止发出进度，会由 Codex adapter 中断，因此活跃会话 lane 可以释放，而不是等待外层运行超时。
- 启用诊断后，超过 `diagnostics.stuckSessionWarnMs` 仍停留在 `processing`，且没有观察到回复、工具、Status、block 或 ACP 进度的会话，会按当前活动分类。有活跃工作会记录为 `session.long_running`；有活跃工作但近期无进度会记录为 `session.stalled`；`session.stuck` 仅用于没有活跃工作的过期会话簿记，并且只有该路径可以释放受影响的会话 lane，使排队工作继续排空。当会话保持不变时，重复的 `session.stuck` 诊断会退避。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [Steer](/zh-CN/tools/steer)
- [重试策略](/zh-CN/concepts/retry)
