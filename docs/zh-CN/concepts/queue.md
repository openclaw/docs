---
read_when:
    - 更改自动回复的执行方式或并发行为
    - 说明 `/queue` 模式或消息引导行为
summary: 自动回复队列模式、默认值和按会话覆盖设置
title: 命令队列
x-i18n:
    generated_at: "2026-07-11T20:29:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw 通过一个轻量的进程内队列串行处理入站自动回复运行（所有渠道），防止多个智能体运行发生冲突，同时仍允许不同会话之间安全并行。

## 原因

- 自动回复运行的开销可能很高（LLM 调用），而且当多条入站消息在短时间内到达时可能发生冲突。
- 串行处理可避免争用共享资源（会话文件、日志、CLI 标准输入），并降低触发上游速率限制的概率。

## 工作原理

- 感知通道的 FIFO 队列会在可配置的并发上限下排空每个通道（未配置通道的默认值为 1；`main` 默认为 4，`subagent` 默认为 8）。
- `runEmbeddedAgent` 按**会话键**加入队列（通道为 `session:<key>`），确保每个会话同时只有一个活跃运行。
- 随后，每个会话运行都会进入一个**全局通道**（默认为 `main`），因此整体并行度受 `agents.defaults.maxConcurrent` 限制。
- 启用详细日志后，如果排队的运行在开始前等待超过约 2 秒，就会发出简短通知。
- 入队时仍会立即触发输入状态指示器（如果渠道支持），因此运行等待轮到自己时，用户体验保持不变。

## 默认值

未设置时，所有入站渠道界面均使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

默认使用同轮引导。运行期间到达的提示词会在运行可接受引导时注入活跃运行时，因此不会启动第二个会话运行。如果活跃运行无法接受引导，OpenClaw 会等待活跃运行结束后再启动该提示词。

## 队列模式

当会话已有活跃运行时，`/queue` 控制普通入站消息的处理方式：

- `steer`：将消息注入活跃运行时。OpenClaw 会在**当前助手轮次执行完其工具调用之后**、下一次 LLM 调用之前，传递所有待处理的引导消息；Codex app-server 会收到一个批量的 `turn/steer`。如果运行未在主动流式传输，或引导不可用，OpenClaw 会等待活跃运行结束后再启动该提示词。
- `followup`：不进行引导。在当前运行结束后，将每条消息加入队列，供后续智能体轮次处理。
- `collect`：不进行引导。在静默窗口结束后，将排队的消息合并到**单个**后续轮次中。如果消息发往不同的渠道或话题串，则会分别排空，以保留路由。
- `interrupt`：中止该会话的活跃运行，然后运行最新消息。

有关特定运行时的时序和依赖行为，请参阅 [Steering queue](/zh-CN/concepts/queue-steering)。有关显式的 `/steer <message>` 命令，请参阅 [Steer](/zh-CN/tools/steer)。

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

这些选项应用于排队传递。在 `steer` 模式下，`debounceMs` 还会设置 Codex 引导的静默窗口：

- `debounceMs`：排空排队的后续消息或收集批次之前的静默窗口；在 Codex 的 `steer` 模式下，是发送批量 `turn/steer` 之前的静默窗口。裸数字表示毫秒；`/queue` 选项接受单位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每个会话最多排队的消息数。小于 `1` 的值会被忽略。
- `drop: "summarize"`（默认）：根据需要丢弃最早的排队条目，保留精简摘要，并将其作为合成的后续提示词注入。
- `drop: "old"`：根据需要丢弃最早的排队条目，但不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 引导和流式传输

当渠道流式传输模式为 `partial` 或 `block` 时，在活跃运行到达运行时边界的过程中，引导看起来可能像多条简短的可见回复：

- `partial`：预览可能提前结束，接受引导后再开始新的预览。
- `block`：草稿大小的分块可能产生相同的顺序显示效果。
- 不使用流式传输时，如果运行时无法接受同轮引导，引导会回退为活跃运行结束后的后续轮次。

`steer` 不会中止正在执行的工具。当最新消息应中止当前运行时，请使用 `/queue interrupt`。

## 优先级

选择模式时，OpenClaw 按以下顺序解析：

1. 内联或已存储的每会话 `/queue` 覆盖设置。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认的 `steer`。

对于选项，内联或已存储的 `/queue` 选项优先于配置。然后依次应用渠道特定的防抖设置（`messages.queue.debounceMsByChannel`）、插件防抖默认值、全局 `messages.queue` 选项和内置默认值。`cap` 和 `drop` 是全局或会话选项，不是按渠道配置的键。

## 每会话覆盖设置

- 将 `/queue <steer|followup|collect|interrupt>` 作为独立命令发送，可存储当前会话的队列模式。
- 可以组合选项：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 会清除会话覆盖设置。

## 排队轮次取消

当提示词位于后续或收集队列中时（例如，在另一个轮次处于活跃状态时，TUI 或网页聊天发送了 `chat.send`），Gateway 网关会为该客户端的 `runId` 保留一个**由 Gateway 网关拥有的取消标识**，直至排队内容开始运行或被丢弃。该标识会跟随被合并到溢出摘要中的内容。

- 使用特定 `runId` 的 `chat.abort` 可在该轮次仍处于排队状态时将其取消，前提是请求者已获得授权（所有权规则与活跃运行相同）。
- 对会话使用不带 `runId` 的 `chat.abort` 时，会**先取消已获授权的排队轮次**，然后中止已获授权的活跃运行。此顺序可防止队列排空操作将任务提升到一个仅停止了一半的会话中。
- 对于多所有者会话，不经逐请求者检查就清空整个会话队列并不是停止路径。
- 排队等待不会在 `sessions.list` 中被呈现为活跃智能体运行，也不具有活跃运行的超时语义；只有活跃阶段具有这些语义。

客户端（包括 TUI）会转发运行期间到达的提示词，并让 Gateway 网关应用队列模式。Esc/`/stop` 使用会话范围的中止操作，因此即使本地句柄丢失，也不会留下仍在排队且随后运行的提示词。

## 范围和保证

- 适用于使用 Gateway 网关回复管道的所有入站渠道中的自动回复智能体运行（WhatsApp 网页版、Telegram、Slack、Discord、Signal、iMessage、网页聊天等）。
- 默认通道（`main`）在整个进程内供入站任务和主 Heartbeat 共用；设置 `agents.defaults.maxConcurrent` 可允许多个会话并行运行。
- 还可能存在其他通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），使后台作业能够并行运行而不阻塞入站回复。隔离的定时任务智能体轮次会占用一个 `cron` 槽位，而其内部智能体执行使用 `cron-nested`；两者都使用 `cron.maxConcurrentRuns`。共享的非定时任务 `nested` 流程保留各自的通道行为。这些分离运行会被跟踪为[后台任务](/zh-CN/automation/tasks)。
- 每会话通道可确保同一时间只有一个智能体运行接触指定会话。
- 无外部依赖项或后台工作线程；仅使用 TypeScript 和 Promise。

## 故障排查

- 如果命令似乎卡住，请启用详细日志并查找 `"queued for ...ms"` 行，以确认队列正在排空。
- 如果 Codex app-server 运行接受了轮次但随后停止发出进度，Codex 适配器会将其中断，使活跃会话通道能够释放，而不必等待外层运行超时。
- 启用诊断后，如果会话保持 `processing` 状态超过 `diagnostics.stuckSessionWarnMs`，且未观察到回复、工具、状态、分块或 ACP 进度，则会根据当前活动进行分类：
  - 存在近期进度的活跃工作会记录为 `session.long_running`。由所有者持有但静默的模型调用也会保持 `session.long_running`，直至达到 `diagnostics.stuckSessionAbortMs`，从而避免过早将缓慢或非流式提供商报告为停滞。
  - 没有近期进度的活跃工作会记录为 `session.stalled`；由所有者持有的模型调用、被阻塞的工具调用和停滞的嵌入式运行会在达到或超过中止阈值时切换为 `session.stalled`。没有所有者的陈旧模型或工具活动不会被隐藏为长时间运行。
  - `session.stuck` 专用于可恢复的陈旧会话记录状态，包括具有陈旧且无所有者的模型或工具活动的空闲排队会话。
  - `session.stuck` 始终会触发恢复，以释放受影响的会话通道。超过 `diagnostics.stuckSessionAbortMs` 的 `session.stalled` 分类（被阻塞的工具调用、停滞的模型调用或停滞的嵌入式运行）也可触发主动中止恢复，因此两种分类都可以解除队列阻塞，并非只有 `session.stuck` 可以。
  - 当会话保持不变时，重复出现的 `session.stuck` 和 `session.long_running` 警告日志行会进行指数退避；无论该退避如何，每次 Heartbeat 轮询仍会执行恢复尝试。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [Steer](/zh-CN/tools/steer)
- [重试策略](/zh-CN/concepts/retry)
