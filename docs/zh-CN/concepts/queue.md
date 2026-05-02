---
read_when:
    - 更改自动回复的执行或并发设置
    - 解释 /queue 模式或消息引导行为
summary: 自动回复队列的模式、默认值和按会话覆盖设置
title: 命令队列
x-i18n:
    generated_at: "2026-05-01T23:59:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

我们通过一个小型进程内队列串行化入站自动回复运行（所有渠道），防止多个智能体运行相互冲突，同时仍允许跨会话的安全并行。

## 原因

- 自动回复运行可能成本较高（LLM 调用），并且当多个入站消息接近同时到达时可能发生冲突。
- 串行化可避免争用共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的概率。

## 工作原理

- 一个感知执行通道的 FIFO 队列按可配置的并发上限清空每个执行通道（未配置执行通道默认为 1；main 默认为 4，subagent 默认为 8）。
- `runEmbeddedPiAgent` 按**会话键**（执行通道 `session:<key>`）入队，以保证每个会话一次只有一个活动运行。
- 然后每个会话运行会排入一个**全局执行通道**（默认 `main`），因此整体并行度由 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队运行在启动前等待超过约 2 秒，会发出一条简短通知。
- 输入指示器仍会在入队时立即触发（如果渠道支持），因此等待轮到自己时，用户体验保持不变。

## 默认值

未设置时，所有入站渠道表面使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是默认值，因为它能让活动模型轮次保持响应，而不会启动第二个会话运行。它会清空下一次模型边界之前到达的所有 steering 消息。如果当前运行无法接受 steering，OpenClaw 会回退到一个 followup 队列条目。

## 队列模式

入站消息可以 steer 当前运行、等待 followup 轮次，或两者兼有：

- `steer`：将 steering 消息排入活动运行时。Pi 会在**当前助手轮次完成其工具调用执行之后**、下一次 LLM 调用之前，投递所有待处理的 steering 消息；Codex app-server 接收一个批处理的 `turn/steer`。如果运行并未主动流式传输或 steering 不可用，OpenClaw 会回退到一个 followup 队列条目。
- `queue`（旧版）：旧的一次一个 steering。Pi 会在每个模型边界投递一条已排队的 steering 消息；Codex app-server 接收单独的 `turn/steer` 请求。除非你需要以前的串行化行为，否则优先使用 `steer`。
- `followup`：将每条消息排入队列，在当前运行结束后供后续智能体轮次使用。
- `collect`：在静默窗口之后，将已排队消息合并为**单个** followup 轮次。如果消息面向不同渠道/线程，则它们会分别清空以保留路由。
- `steer-backlog`（又名 `steer+backlog`）：现在 steer，**并且**保留同一条消息供 followup 轮次使用。
- `interrupt`（旧版）：中止该会话的活动运行，然后运行最新消息。

Steer-backlog 意味着你可能会在 steered 运行之后获得 followup 响应，因此流式传输表面可能看起来像重复响应。如果你希望每条入站消息只产生一个响应，请优先使用 `collect`/`steer`。

有关特定运行时的时序和依赖行为，请参阅
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

- `debounceMs`：清空已排队 followup 之前的静默窗口。裸数字表示毫秒；`/queue` 选项接受单位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每个会话最多排队的消息数。低于 `1` 的值会被忽略。
- `drop: "summarize"`：默认值。按需丢弃最旧的队列条目，保留紧凑摘要，并将它们作为合成 followup 提示词注入。
- `drop: "old"`：按需丢弃最旧的队列条目，不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 优先级

对于模式选择，OpenClaw 按以下顺序解析：

1. 内联或已存储的每会话 `/queue` 覆盖。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认 `steer`。

对于选项，内联或已存储的 `/queue` 选项优先于配置。然后依次应用特定渠道 debounce（`messages.queue.debounceMsByChannel`）、插件 debounce 默认值、全局 `messages.queue` 选项和内置默认值。`cap` 和 `drop` 是全局/会话选项，不是按渠道配置键。

## 每会话覆盖

- 发送独立命令 `/queue <mode>`，为当前会话存储模式。
- 可以组合选项：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 范围和保证

- 适用于使用 Gateway 网关回复流水线的所有入站渠道上的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认执行通道（`main`）在进程范围内用于入站 + main Heartbeat；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行运行。
- 可能存在其他执行通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），这样后台作业可以并行运行而不阻塞入站回复。隔离的 cron 智能体轮次会占用一个 `cron` 槽位，而其内部智能体执行使用 `cron-nested`；二者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流程保留自己的执行通道行为。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。
- 每会话执行通道保证一次只有一个智能体运行会触碰给定会话。
- 无外部依赖或后台工作线程；纯 TypeScript + promises。

## 故障排除

- 如果命令似乎卡住，请启用详细日志并查找 “queued for …ms” 行，以确认队列正在清空。
- 如果你需要队列深度，请启用详细日志并观察队列时序行。
- 如果 Codex app-server 运行接受一个轮次后停止发出进度，Codex 适配器会中断它，这样活动会话执行通道可以释放，而不是等待外层运行超时。
- 启用诊断时，如果会话在超过 `diagnostics.stuckSessionWarnMs` 后仍处于 `processing`，且未观察到回复、工具、Status、block 或 ACP 进度，会按当前活动进行分类。活动工作记录为 `session.long_running`；活动工作但最近没有进度记录为 `session.stalled`；`session.stuck` 保留给没有活动工作的陈旧会话簿记，并且只有该路径可以释放受影响的会话执行通道，使已排队工作得以清空。当会话保持不变时，重复的 `session.stuck` 诊断会退避。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [重试策略](/zh-CN/concepts/retry)
