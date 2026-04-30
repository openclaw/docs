---
read_when:
    - 说明在智能体使用工具时 steer 的行为
    - 更改 active-run 队列行为或运行时调控集成
    - 比较 steer、queue、collect 和 followup 模式
summary: 活跃运行引导如何在运行时边界将消息加入队列
title: Steering queue
x-i18n:
    generated_at: "2026-04-30T00:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

当会话运行已经在流式传输时收到消息，OpenClaw 可以将该消息发送到活跃运行时，而不是为同一个会话启动另一次运行。公开模式与运行时无关；Pi 和原生 Codex app-server harness 以不同方式实现传递细节。

## 运行时边界

引导不会中断已经在运行的工具调用。Pi 会在模型边界检查排队的引导消息：

1. 助手请求工具调用。
2. Pi 执行当前助手消息的工具调用批次。
3. Pi 发出轮次结束事件。
4. Pi 清空排队的引导消息。
5. Pi 在下一次 LLM 调用之前，将这些消息追加为用户消息。

这会让工具结果与请求它们的助手消息保持配对，然后让下一次模型调用看到最新的用户输入。

原生 Codex app-server harness 暴露 `turn/steer`，而不是 Pi 的内部 Steering queue。OpenClaw 在其中适配相同模式：

- `steer` 会在配置的静默窗口内批处理排队消息，然后发送一个 `turn/steer` 请求，其中包含按到达顺序收集的所有用户输入。
- `queue` 通过发送单独的 `turn/steer` 请求来保持旧版串行形态。
- `followup`、`collect`、`steer-backlog` 和 `interrupt` 保持为 OpenClaw 围绕活跃 Codex 轮次拥有的队列行为。

Codex 审查和手动压缩轮次会拒绝同轮次引导。当某个运行时无法接受引导时，在该模式允许的情况下，OpenClaw 会回退到后续队列。

## 模式

| 模式 | 活跃运行行为 | 后续行为 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer` | 在下一个运行时边界一起注入所有排队的引导消息。这是默认值。 | 仅在引导不可用时回退到后续。 |
| `queue` | 旧版逐条引导。Pi 在每个模型边界注入一条排队消息；Codex 发送单独的 `turn/steer` 请求。 | 仅在引导不可用时回退到后续。 |
| `steer-backlog` | 与 `steer` 相同的活跃运行引导行为。 | 还会为后续轮次保留同一条消息。 |
| `followup` | 不引导当前运行。 | 稍后运行排队消息。 |
| `collect` | 不引导当前运行。 | 在防抖窗口之后，将兼容的排队消息合并到一个稍后的轮次中。 |
| `interrupt` | 中止活跃运行，然后启动最新消息。 | 无。 |

## 突发示例

如果四个用户在智能体执行工具调用时发送消息：

- `steer`：活跃运行时会在下一次模型决策之前，按到达顺序接收全部四条消息。Pi 会在下一个模型边界清空它们；Codex 会以一个批处理的 `turn/steer` 接收它们。
- `queue`：旧版串行引导。Pi 一次注入一条排队消息；Codex 接收单独的 `turn/steer` 请求。
- `collect`：OpenClaw 等待活跃运行结束，然后在防抖窗口之后，使用兼容的排队消息创建一个后续轮次。

## 范围

引导始终以当前活跃会话运行为目标。它不会创建新会话、更改活跃运行的工具策略，或按发送者拆分消息。在多用户渠道中，入站提示已经包含发送者和路由上下文，因此下一次模型调用可以看到每条消息是谁发送的。

当你希望 OpenClaw 构建一个稍后的后续轮次，并且该轮次可以合并兼容消息并保留后续队列丢弃策略时，请使用 `collect`。仅当你需要较旧的逐条引导行为时，才使用 `queue`。

## 防抖

`messages.queue.debounceMs` 适用于后续传递，包括 `collect`、`followup`、`steer-backlog`，以及活跃运行引导不可用时的 `steer` 回退。对于 Pi，活跃 `steer` 本身不使用防抖计时器，因为 Pi 会自然地批处理消息，直到下一个模型边界。对于原生 Codex harness，OpenClaw 会使用同一个防抖值作为发送批处理 `turn/steer` 之前的静默窗口。

## 相关内容

- [命令队列](/zh-CN/concepts/queue)
- [消息](/zh-CN/concepts/messages)
- [Agent loop](/zh-CN/concepts/agent-loop)
