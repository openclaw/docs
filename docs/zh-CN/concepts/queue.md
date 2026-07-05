---
read_when:
    - 更改自动回复执行或并发
    - 解释 /queue 模式或消息引导行为
summary: 自动回复队列模式、默认值和按会话覆盖
title: 命令队列
x-i18n:
    generated_at: "2026-07-05T11:13:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw 通过一个很小的进程内队列串行化入站自动回复运行（所有渠道），以防止多个智能体运行发生冲突，同时仍允许跨会话的安全并行。

## 原因

- 自动回复运行可能开销很高（LLM 调用），并且当多条入站消息几乎同时到达时可能发生冲突。
- 串行化可避免争抢共享资源（会话文件、日志、CLI stdin），并降低触发上游速率限制的概率。

## 工作原理

- 一个感知 lane 的 FIFO 队列会按可配置的并发上限排空每个 lane（未配置 lane 的默认值为 1；`main` 默认为 4，`subagent` 默认为 8）。
- `runEmbeddedAgent` 按**会话键**（lane `session:<key>`）入队，以保证每个会话最多只有一个活动运行。
- 随后，每个会话运行会被排入一个**全局 lane**（默认是 `main`），因此总体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志时，如果排队的运行在开始前等待超过约 2 秒，会发出一条简短通知。
- 输入指示器仍会在入队时立即触发（当渠道支持时），因此在运行等待轮到自己时，用户体验保持不变。

## 默认值

未设置时，所有入站渠道表面都使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

默认使用同轮次 steering。运行中途到达的提示会在运行可接受 steering 时注入活动运行时，因此不会启动第二个会话运行。如果活动运行无法接受 steering，OpenClaw 会等待活动运行结束后再启动该提示。

## 队列模式

`/queue` 控制当一个会话已有活动运行时，普通入站消息的处理方式：

- `steer`：将消息注入活动运行时。OpenClaw 会在**当前助手轮次完成其工具调用执行后**、下一次 LLM 调用之前，投递所有待处理的 steering 消息；Codex app-server 会收到一个批处理的 `turn/steer`。如果运行没有在主动流式传输，或 steering 不可用，OpenClaw 会等到活动运行结束后再启动该提示。
- `followup`：不执行 steer。将每条消息排队，等当前运行结束后作为后续智能体轮次处理。
- `collect`：不执行 steer。在静默窗口之后，将排队消息合并为**单个**后续轮次。如果消息目标是不同渠道/线程，它们会单独排空，以保留路由。
- `interrupt`：中止该会话的活动运行，然后运行最新消息。

有关特定运行时的时序和依赖行为，请参阅 [Steering queue](/zh-CN/concepts/queue-steering)。有关显式 `/steer <message>` 命令，请参阅 [Steer](/zh-CN/tools/steer)。

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

选项应用于排队投递。`debounceMs` 也会在 `steer` 模式下设置 Codex steering 静默窗口：

- `debounceMs`：排空排队的后续消息或 collect 批次前的静默窗口；在 Codex `steer` 模式下，是发送批处理 `turn/steer` 前的静默窗口。裸数字表示毫秒；`/queue` 选项接受单位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每个会话的最大排队消息数。低于 `1` 的值会被忽略。
- `drop: "summarize"`（默认）：按需丢弃最旧的排队条目，保留紧凑摘要，并将它们作为合成后续提示注入。
- `drop: "old"`：按需丢弃最旧的排队条目，不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## Steer 和流式传输

当渠道流式传输为 `partial` 或 `block` 时，steering 可能在活动运行到达运行时边界时表现为几条较短的可见回复：

- `partial`：预览可能会提前完成，然后在 steering 被接受后开始新的预览。
- `block`：草稿大小的块可能产生相同的顺序外观。
- 没有流式传输时，如果运行时无法接受同轮次 steering，steering 会在活动运行结束后回退为后续轮次。

`steer` 不会中止正在执行的工具。若最新消息应中止当前运行，请使用 `/queue interrupt`。

## 优先级

对于模式选择，OpenClaw 按以下顺序解析：

1. 内联或已存储的按会话 `/queue` 覆盖。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认 `steer`。

对于选项，内联或已存储的 `/queue` 选项优先于配置。然后按顺序应用渠道特定 debounce（`messages.queue.debounceMsByChannel`）、插件 debounce 默认值、全局 `messages.queue` 选项和内置默认值。`cap` 和 `drop` 是全局/会话选项，不是按渠道配置键。

## 按会话覆盖

- 将 `/queue <steer|followup|collect|interrupt>` 作为独立命令发送，以存储当前会话的队列模式。
- 选项可以组合：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖。

## 排队轮次取消

当提示位于 followup/collect 队列中时（例如 TUI 或
webchat `chat.send` 在另一个轮次活动时到达），Gateway 网关会为该客户端 `runId`
保留一个 **Gateway 网关拥有的取消身份**，直到排队内容运行或被丢弃。该身份会跟随折叠进
溢出摘要的内容。

- 带有特定 `runId` 的 `chat.abort` 会在该轮次仍在
  排队时取消它，前提是请求方已获授权（与活动运行相同的所有权规则）。
- 会话级、无 `runId` 的 `chat.abort` 会**先取消已授权的排队轮次**，
  然后再中止已授权的活动运行。该顺序可防止队列排空将工作提升到一个半停止的会话中。
- 对于多所有者会话，不带按请求方检查地清空整个会话队列
  不是停止路径。
- 排队等待不会被投影为 `sessions.list` 的活动智能体运行，
  也不拥有活动运行的超时语义；只有活动阶段才拥有。

客户端（包括 TUI）会转发运行中提示，并让 Gateway 网关应用
队列模式。Esc/`/stop` 使用会话范围的中止，因此丢失的本地句柄
不会留下仍在排队的提示继续运行。

## 范围和保证

- 适用于使用 Gateway 网关回复管线的所有入站渠道上的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）对入站 + 主 Heartbeat 在进程范围内生效；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行。
- 可能存在额外的 lane（例如 `cron`、`cron-nested`、`nested`、`subagent`），以便后台作业可并行运行而不阻塞入站回复。隔离的 cron 智能体轮次在其内部智能体执行使用 `cron-nested` 时持有一个 `cron` 槽位；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流程保留其自身的 lane 行为。这些分离运行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。
- 按会话 lane 保证一次只有一个智能体运行触及给定会话。
- 无外部依赖或后台工作线程；纯 TypeScript + promises。

## 故障排查

- 如果命令看起来卡住，请启用详细日志并查找 "queued for ...ms" 行，以确认队列正在排空。
- 接受轮次后停止发出进度的 Codex app-server 运行会被 Codex 适配器中断，这样活动会话 lane 可以释放，而不是等待外层运行超时。
- 启用诊断时，在超过 `diagnostics.stuckSessionWarnMs` 后仍保持 `processing`，且未观察到回复、工具、状态、块或 ACP 进度的会话，会按当前活动分类：
  - 具有近期进度日志的活动工作会被归类为 `session.long_running`。拥有所有者的静默模型调用也会保持为 `session.long_running`，直到 `diagnostics.stuckSessionAbortMs`，以免过早将缓慢或非流式提供商报告为停滞。
  - 没有近期进度日志的活动工作会被归类为 `session.stalled`；拥有所有者的模型调用、阻塞的工具调用和停滞的嵌入式运行会在达到或超过中止阈值时切换为 `session.stalled`。没有所有者的陈旧模型/工具活动不会被隐藏为长时间运行。
  - `session.stuck` 保留给可恢复的陈旧会话簿记，包括带有陈旧无所有者模型/工具活动的空闲排队会话。
  - `session.stuck` 总是会触发可释放受影响会话 lane 的恢复。超过 `diagnostics.stuckSessionAbortMs` 的 `session.stalled` 分类（阻塞的工具调用、停滞的模型调用或停滞的嵌入式运行）也可以触发活动中止恢复，因此这两种分类都可以解除队列卡住，不只是 `session.stuck`。
  - 重复的 `session.stuck` 和 `session.long_running` 警告日志行会在会话保持不变时进行指数退避；无论该退避如何，恢复尝试仍会在每个 Heartbeat tick 上运行。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [Steer](/zh-CN/tools/steer)
- [重试策略](/zh-CN/concepts/retry)
