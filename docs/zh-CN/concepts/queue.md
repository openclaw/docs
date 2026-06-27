---
read_when:
    - 更改自动回复执行或并发设置
    - 解释 /queue 模式或消息引导行为
summary: 自动回复队列模式、默认值和按会话覆盖
title: 命令队列
x-i18n:
    generated_at: "2026-06-27T01:53:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

我们通过一个很小的进程内队列串行化入站自动回复运行（所有渠道），防止多个智能体运行相互冲突，同时仍允许跨会话安全并行。

## 原因

- 自动回复运行可能成本很高（LLM 调用），并且在多个入站消息接近同时到达时可能冲突。
- 串行化可避免争用共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的可能性。

## 工作方式

- 支持分通道的 FIFO 队列会按可配置的并发上限清空每个通道（未配置通道默认为 1；主通道默认为 4，子智能体默认为 8）。
- `runEmbeddedAgent` 按**会话键**（通道 `session:<key>`）入队，以保证每个会话只有一个活跃运行。
- 每个会话运行随后会排入**全局通道**（默认为 `main`），因此总体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队的运行在启动前等待超过约 2 秒，会发出一条简短通知。
- 输入状态指示器仍会在入队时立即触发（如果渠道支持），因此等待轮到自己时用户体验保持不变。

## 默认值

未设置时，所有入站渠道表面都使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

同轮次 Steering 是默认行为。运行中途到达的提示会在该运行可以接受 Steering 时注入到活跃运行时中，因此不会启动第二个会话运行。如果活跃运行无法接受 Steering，OpenClaw 会等待活跃运行完成后再启动该提示。

## 队列模式

`/queue` 控制当某个会话已经有活跃运行时，普通入站消息的处理方式：

- `steer`：将消息注入活跃运行时。OpenClaw 会在**当前助手轮次完成其工具调用执行之后**、下一次 LLM 调用之前，交付所有待处理的 Steering 消息；Codex app-server 会收到一个批处理的 `turn/steer`。如果该运行未在主动流式传输，或 Steering 不可用，OpenClaw 会等到活跃运行结束后再启动该提示。
- `followup`：不进行 Steering。将每条消息排队，在当前运行结束后的后续智能体轮次中处理。
- `collect`：不进行 Steering。在静默窗口之后，将排队消息合并为**单个**后续轮次。如果消息面向不同渠道/线程，则会分别清空以保留路由。
- `interrupt`：中止该会话的活跃运行，然后运行最新消息。

有关运行时特定的时序和依赖行为，请参阅
[Steering queue](/zh-CN/concepts/queue-steering)。有关显式 `/steer <message>` 命令，请参阅 [Steer](/zh-CN/tools/steer)。

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

选项应用于排队交付。`debounceMs` 还会设置 `steer` 模式下的 Codex Steering 静默窗口：

- `debounceMs`：清空排队后续消息或 collect 批次前的静默窗口；在 Codex `steer` 模式下，是发送批处理 `turn/steer` 前的静默窗口。裸数字表示毫秒；`/queue` 选项接受单位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每个会话的最大排队消息数。低于 `1` 的值会被忽略。
- `drop: "summarize"`：默认值。按需丢弃最旧的排队条目，保留紧凑摘要，并将其作为合成后续提示注入。
- `drop: "old"`：按需丢弃最旧的排队条目，不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## Steering 和流式传输

当渠道流式传输为 `partial` 或 `block` 时，在活跃运行到达运行时边界期间，Steering 可能看起来像几条较短的可见回复：

- `partial`：预览可能会提前结束，然后在 Steering 被接受后开始新的预览。
- `block`：草稿大小的分块可能产生相同的顺序外观。
- 如果没有流式传输，当运行时无法接受同轮次 Steering 时，Steering 会回退为在活跃运行结束后的后续轮次。

`steer` 不会中止正在执行的工具。当最新消息应中止当前运行时，请使用 `/queue interrupt`。

## 优先级

对于模式选择，OpenClaw 按以下顺序解析：

1. 内联或已存储的每会话 `/queue` 覆盖。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认 `steer`。

对于选项，内联或已存储的 `/queue` 选项优先于配置。然后依次应用渠道特定 debounce（`messages.queue.debounceMsByChannel`）、插件 debounce 默认值、全局 `messages.queue` 选项和内置默认值。`cap` 和 `drop` 是全局/会话选项，而不是按渠道配置键。

## 每会话覆盖

- 将 `/queue <steer|followup|collect|interrupt>` 作为独立命令发送，以存储当前会话的队列模式。
- 选项可以组合使用：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 范围和保证

- 适用于所有使用 Gateway 网关回复流水线的入站渠道中的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认通道（`main`）在进程范围内用于入站 + 主 Heartbeat；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行。
- 可能存在其他通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），这样后台作业可以并行运行，而不会阻塞入站回复。隔离的 cron 智能体轮次在其内部智能体执行使用 `cron-nested` 时会占用一个 `cron` 槽位；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流会保留自身的通道行为。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)跟踪。
- 每会话通道保证同一时间只有一个智能体运行会触及给定会话。
- 无外部依赖或后台工作线程；纯 TypeScript + promise。

## 故障排除

- 如果命令看起来卡住，请启用详细日志，并查找 "queued for ...ms" 行来确认队列正在清空。
- 如果需要队列深度，请启用详细日志并观察队列时序行。
- Codex app-server 运行在接受轮次后如果停止发出进度，会被 Codex 适配器中断，以便释放活跃会话通道，而不是等待外层运行超时。
- 启用诊断时，超过 `diagnostics.stuckSessionWarnMs` 仍处于 `processing` 且未观察到回复、工具、状态、分块或 ACP 进度的会话，会按当前活动分类。活跃工作会记录为 `session.long_running`；有所有者的静默模型调用也会保持 `session.long_running`，直到 `diagnostics.stuckSessionAbortMs`，因此较慢或非流式传输的提供商不会过早报告为停滞。没有近期进度的活跃工作会记录为 `session.stalled`；有所有者的模型调用会在达到或超过中止阈值时切换为 `session.stalled`，而无所有者的过期模型/工具活动不会被隐藏为长时间运行。`session.stuck` 专用于可恢复的过期会话记账，包括带有过期无所有者模型/工具活动的空闲排队会话，并且只有该路径可以释放受影响的会话通道，使排队工作继续清空。重复的 `session.stuck` 诊断会在会话保持不变时退避。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [Steer](/zh-CN/tools/steer)
- [重试策略](/zh-CN/concepts/retry)
