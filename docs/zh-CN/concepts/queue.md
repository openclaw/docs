---
read_when:
    - 更改自动回复执行或并发设置
    - 说明 /queue 模式或消息导向行为
summary: 自动回复队列模式、默认值和按会话覆盖
title: 命令队列
x-i18n:
    generated_at: "2026-04-30T00:29:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

我们通过一个很小的进程内队列串行化入站自动回复运行（所有渠道），以防多个 agent 运行相互冲突，同时仍允许跨会话的安全并行。

## 为什么

- 自动回复运行可能很昂贵（LLM 调用），并且在多条入站消息接近同时到达时可能发生冲突。
- 串行化可以避免竞争共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的概率。

## 工作原理

- 一个感知 lane 的 FIFO 队列会按可配置的并发上限排空每个 lane（未配置 lane 默认 1；main 默认 4，subagent 默认 8）。
- `runEmbeddedPiAgent` 按**会话键**（lane `session:<key>`）入队，保证每个会话同时只有一个活跃运行。
- 每个会话运行随后会被排入一个**全局 lane**（默认 `main`），因此总体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果已排队的运行在开始前等待超过约 2 秒，会发出一条简短提示。
- 输入状态指示器仍会在入队时立即触发（如果渠道支持），因此在等待轮到我们期间，用户体验保持不变。

## 默认值

未设置时，所有入站渠道表面都使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是默认值，因为它能让活跃模型轮次保持响应，而不启动第二个会话运行。它会排空在下一个模型边界之前到达的所有 steering 消息。如果当前运行无法接受 steering，OpenClaw 会回退到一个 followup 队列条目。

## 队列模式

入站消息可以 steer 当前运行、等待 followup 轮次，或两者都做：

- `steer`：将 steering 消息排入活跃运行时。Pi 会在**当前助手轮次完成其工具调用执行后**、下一次 LLM 调用前交付所有待处理的 steering 消息；Codex app-server 会接收一个批量的 `turn/steer`。如果运行未处于活跃流式传输状态，或 steering 不可用，OpenClaw 会回退到一个 followup 队列条目。
- `queue`（旧版）：旧的一次一个 steering。Pi 会在每个模型边界交付一条已排队的 steering 消息；Codex app-server 会接收单独的 `turn/steer` 请求。除非你需要之前的串行化行为，否则优先使用 `steer`。
- `followup`：将每条消息入队，以便在当前运行结束后的后续 agent 轮次中处理。
- `collect`：在安静窗口之后，将已排队的消息合并为**单个** followup 轮次。如果消息目标是不同渠道/线程，它们会分别排空以保留路由。
- `steer-backlog`（又名 `steer+backlog`）：现在 steer，**并且**保留同一条消息用于 followup 轮次。
- `interrupt`（旧版）：中止该会话的活跃运行，然后运行最新消息。

Steer-backlog 意味着你可能会在 steered 运行之后得到 followup 响应，因此流式传输表面看起来可能像重复。若你希望每条入站消息只得到一个响应，请优先使用 `collect`/`steer`。

有关特定运行时的时序和依赖行为，请参见
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

- `debounceMs`：排空已排队 followup 前的安静窗口。裸数字表示毫秒；`/queue` 选项接受单位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每个会话的最大排队消息数。低于 `1` 的值会被忽略。
- `drop: "summarize"`：默认值。按需丢弃最旧的队列条目，保留紧凑摘要，并将其作为合成 followup prompt 注入。
- `drop: "old"`：按需丢弃最旧的队列条目，不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 优先级

对于模式选择，OpenClaw 按以下顺序解析：

1. 内联或已存储的每会话 `/queue` 覆盖。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认 `steer`。

对于选项，内联或已存储的 `/queue` 选项优先于配置。然后依次应用渠道特定 debounce（`messages.queue.debounceMsByChannel`）、插件 debounce 默认值、全局 `messages.queue` 选项以及内置默认值。`cap` 和 `drop` 是全局/会话选项，不是按渠道的配置键。

## 每会话覆盖

- 发送 `/queue <mode>` 作为独立命令，以存储当前会话的模式。
- 选项可以组合：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 范围和保证

- 适用于所有使用 Gateway 网关回复管线的入站渠道中的自动回复 agent 运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）对入站 + 主 Heartbeat 是进程级的；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行运行。
- 可能存在额外 lane（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此后台作业可以并行运行，而不会阻塞入站回复。隔离的 cron agent 轮次会持有一个 `cron` 槽位，而其内部 agent 执行使用 `cron-nested`；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流程会保持自身的 lane 行为。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)被跟踪。
- 每会话 lane 保证同一时间只有一个 agent 运行会触碰给定会话。
- 无外部依赖或后台 worker 线程；纯 TypeScript + promises。

## 故障排除

- 如果命令看起来卡住，请启用详细日志并查找 “queued for …ms” 行，以确认队列正在排空。
- 如果你需要队列深度，请启用详细日志并观察队列时序行。
- 启用诊断后，在超过 `diagnostics.stuckSessionWarnMs` 后仍停留在 `processing` 的会话会记录一条 stuck-session 警告。活跃的嵌入式运行、活跃的回复操作以及活跃的 lane 任务默认仍仅发出警告；没有活跃会话工作的过期启动簿记可以释放受影响的会话 lane，使已排队工作得以排空。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [重试策略](/zh-CN/concepts/retry)
