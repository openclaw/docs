---
read_when:
    - 更改自动回复的执行方式或并发设置
    - 解释 /queue 模式或消息引导行为
summary: 自动回复队列模式、默认值和按会话覆盖设置
title: 命令队列
x-i18n:
    generated_at: "2026-04-29T21:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59d14a2b8e1b8d5bc1433c0f052869efed42912c9b85cdd79e518633d9919729
    source_path: concepts/queue.md
    workflow: 16
---

我们通过一个很小的进程内队列来串行化入站自动回复运行（所有渠道），防止多个智能体运行相互冲突，同时仍允许跨会话的安全并行。

## 原因

- 自动回复运行可能开销很高（LLM 调用），并且当多条入站消息短时间内到达时可能发生冲突。
- 串行化可以避免争抢共享资源（会话文件、日志、CLI 标准输入），并降低触发上游速率限制的概率。

## 工作方式

- 感知 lane 的 FIFO 队列按可配置的并发上限排空每个 lane（未配置的 lane 默认为 1；main 默认为 4，subagent 为 8）。
- `runEmbeddedPiAgent` 按**会话键**（lane `session:<key>`）入队，以保证每个会话只有一个活跃运行。
- 每个会话运行随后会被排入一个**全局 lane**（默认是 `main`），因此整体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果已排队的运行在启动前等待超过约 2 秒，会发出一条简短提示。
- 输入状态指示器仍会在入队时立即触发（渠道支持时），因此用户体验在等待轮次时不会改变。

## 默认值

未设置时，所有入站渠道界面使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是默认值，因为它可以让活跃模型轮次保持响应，而无需启动第二个会话运行。如果当前运行不能接受 steering，OpenClaw 会回退到 followup 队列条目。

## 队列模式

入站消息可以 steer 当前运行、等待后续轮次，或两者都做：

- `steer`：向活跃 Pi 运行排入一条 steering 消息。Pi 会在**当前助手轮次完成执行其工具调用之后**、下一次 LLM 调用之前递送它。如果运行没有处于活跃流式传输状态，或 steering 不可用，OpenClaw 会回退到 followup 队列条目。
- `followup`：在当前运行结束后，为后续智能体轮次将每条消息入队。
- `collect`：在静默窗口后，将已排队的消息合并为**单个** followup 轮次。如果消息面向不同渠道/线程，它们会分别排空以保留路由。
- `steer-backlog`（也称为 `steer+backlog`）：现在 steer，**并且**为 followup 轮次保留同一条消息。
- `interrupt`（旧版）：中止该会话的活跃运行，然后运行最新消息。
- `queue`（旧版别名）：与 `steer` 相同。

Steer-backlog 意味着你可能会在 steered 运行之后得到 followup 响应，因此流式传输界面看起来可能像重复响应。如果你希望每条入站消息只有一个响应，请优先使用 `collect`/`steer`。

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

选项适用于 `followup`、`collect` 和 `steer-backlog`（以及 `steer` 回退到 followup 时）：

- `debounceMs`：排空已排队 followup 前的静默窗口。裸数字表示毫秒；`/queue` 选项接受单位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每个会话的最大排队消息数。小于 `1` 的值会被忽略。
- `drop: "summarize"`：默认值。按需丢弃最旧的队列条目，保留紧凑摘要，并将它们作为合成 followup 提示注入。
- `drop: "old"`：按需丢弃最旧的队列条目，不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 优先级

对于模式选择，OpenClaw 按以下顺序解析：

1. 内联或已存储的每会话 `/queue` 覆盖。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认 `steer`。

对于选项，内联或已存储的 `/queue` 选项优先于配置。然后会应用渠道特定 debounce（`messages.queue.debounceMsByChannel`）、插件 debounce 默认值、全局 `messages.queue` 选项以及内置默认值。`cap` 和 `drop` 是全局/会话选项，不是按渠道配置键。

## 每会话覆盖

- 发送 `/queue <mode>` 作为独立命令，为当前会话存储模式。
- 选项可以组合：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 范围和保证

- 适用于所有使用 Gateway 网关回复管线的入站渠道上的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）在入站 + main heartbeats 中是进程范围的；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行运行。
- 可能存在其他 lane（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此后台作业可以并行运行，而不会阻塞入站回复。隔离的 cron 智能体轮次会在其内部智能体执行使用 `cron-nested` 时持有一个 `cron` slot；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流程保留自身的 lane 行为。这些分离的运行会作为[后台任务](/zh-CN/automation/tasks)被跟踪。
- 每会话 lane 保证同一时间只有一个智能体运行会触碰给定会话。
- 没有外部依赖或后台 worker 线程；纯 TypeScript + promises。

## 故障排除

- 如果命令看起来卡住，请启用详细日志，并查找“queued for …ms”行，以确认队列正在排空。
- 如果你需要队列深度，请启用详细日志并观察队列计时行。
- 启用诊断时，超过 `diagnostics.stuckSessionWarnMs` 后仍保持 `processing` 的会话会记录 stuck-session 警告。默认情况下，活跃 embedded 运行、活跃回复操作和活跃 lane 任务仍仅发出警告；如果启动时的过期 bookkeeping 没有活跃会话工作，可以释放受影响的会话 lane，使已排队工作继续排空。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [重试策略](/zh-CN/concepts/retry)
