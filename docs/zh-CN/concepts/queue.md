---
read_when:
    - 更改自动回复执行或并发设置
    - 说明 /queue 模式或消息导向行为
summary: 自动回复队列模式、默认值和按会话覆盖设置
title: 命令队列
x-i18n:
    generated_at: "2026-05-01T23:18:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3b24643eea9c8f374b041b251675a1a3c6567306dca07001b4ba82d20391eb1
    source_path: concepts/queue.md
    workflow: 16
---

我们通过一个极小的进程内队列，序列化入站自动回复运行（所有渠道），防止多个智能体运行相互冲突，同时仍允许跨会话的安全并行。

## 原因

- 自动回复运行可能很昂贵（LLM 调用），并且当多条入站消息接近同时到达时可能发生冲突。
- 序列化可避免争抢共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的概率。

## 工作原理

- 感知 lane 的 FIFO 队列会按可配置的并发上限排空每个 lane（未配置的 lane 默认值为 1；main 默认值为 4，subagent 为 8）。
- `runEmbeddedPiAgent` 按**会话键**（lane `session:<key>`）入队，以保证每个会话同一时间只有一个活跃运行。
- 随后，每个会话运行会被排入**全局 lane**（默认是 `main`），因此总体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队运行在开始前等待超过约 2 秒，会发出一条简短通知。
- 输入指示器仍会在入队时立即触发（如果渠道支持），因此在等待轮到自己时，用户体验保持不变。

## 默认值

未设置时，所有入站渠道表面使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是默认值，因为它能让活跃模型回合保持响应，而无需启动第二个会话运行。它会排空下一次模型边界之前到达的所有 steering 消息。如果当前运行无法接受 steering，OpenClaw 会回退到后续队列条目。

## 队列模式

入站消息可以 steer 当前运行、等待后续回合，或两者兼有：

- `steer`：将 steering 消息排入活跃运行时。Pi 会在**当前 assistant 回合执行完其工具调用之后**、下一次 LLM 调用之前交付所有待处理的 steering 消息；Codex app-server 会收到一个批处理的 `turn/steer`。如果该运行未处于活跃流式传输状态，或 steering 不可用，OpenClaw 会回退到后续队列条目。
- `queue`（旧版）：旧的一次一条 steering。Pi 会在每个模型边界交付一条排队的 steering 消息；Codex app-server 会收到单独的 `turn/steer` 请求。除非你需要之前的序列化行为，否则优先使用 `steer`。
- `followup`：将每条消息入队，在当前运行结束后交给稍后的智能体回合。
- `collect`：在静默窗口之后，将排队消息合并成**单个**后续回合。如果消息目标是不同渠道/线程，它们会单独排空以保留路由。
- `steer-backlog`（又称 `steer+backlog`）：现在 steer，**并且**为后续回合保留同一条消息。
- `interrupt`（旧版）：中止该会话的活跃运行，然后运行最新消息。

Steer-backlog 意味着你可能会在 steered 运行之后收到后续响应，因此流式传输表面可能看起来像重复响应。如果你希望每条入站消息只有一个响应，请优先使用 `collect`/`steer`。

有关运行时特定的时序和依赖行为，请参阅
[Steering queue](/zh-CN/concepts/queue-steering)。

通过 `messages.queue` 进行全局或按渠道配置：

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
- `cap`：每个会话的最大排队消息数。低于 `1` 的值会被忽略。
- `drop: "summarize"`：默认值。按需丢弃最旧的队列条目，保留紧凑摘要，并将它们作为合成 followup 提示注入。
- `drop: "old"`：按需丢弃最旧的队列条目，不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 优先级

对于模式选择，OpenClaw 按以下顺序解析：

1. 内联或已存储的按会话 `/queue` 覆盖。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认 `steer`。

对于选项，内联或已存储的 `/queue` 选项优先于配置。随后应用渠道特定 debounce（`messages.queue.debounceMsByChannel`）、插件 debounce 默认值、全局 `messages.queue` 选项以及内置默认值。`cap` 和 `drop` 是全局/会话选项，不是按渠道配置键。

## 按会话覆盖

- 将 `/queue <mode>` 作为独立命令发送，以存储当前会话的模式。
- 选项可以组合：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 范围和保证

- 适用于所有使用 Gateway 网关回复流水线的入站渠道上的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）在进程范围内适用于入站 + main Heartbeat；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行。
- 可能存在额外 lane（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此后台作业可以并行运行，而不会阻塞入站回复。隔离的 cron 智能体回合会占用一个 `cron` slot，而其内部智能体执行使用 `cron-nested`；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流程保持自己的 lane 行为。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。
- 按会话 lane 保证同一时间只有一个智能体运行会触碰给定会话。
- 没有外部依赖或后台 worker 线程；纯 TypeScript + promises。

## 故障排除

- 如果命令看起来卡住，请启用详细日志，并查找 “queued for …ms” 行来确认队列正在排空。
- 如果你需要队列深度，请启用详细日志并观察队列时序行。
- Codex app-server 运行如果接受了一个回合后停止发出进度，会被 Codex 适配器中断，这样活跃会话 lane 可以释放，而不是等待外层运行超时。
- 启用诊断时，超过 `diagnostics.stuckSessionWarnMs` 仍保持 `processing` 的会话会按当前活动分类。活跃工作记录为 `session.long_running`；没有近期进度的活跃工作记录为 `session.stalled`；`session.stuck` 保留给没有活跃工作的陈旧会话簿记，并且只有该路径可以释放受影响的会话 lane，让排队工作继续排空。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [重试策略](/zh-CN/concepts/retry)
