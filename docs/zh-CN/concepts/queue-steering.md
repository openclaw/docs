---
read_when:
    - 说明智能体使用工具时 Steer 的行为方式
    - 更改活动运行队列行为或运行时 Steering 集成
    - 比较 Steering 与 followup、collect 和 interrupt 队列模式
summary: 活跃运行中的 Steering queue 如何在运行时边界将消息排队
title: Steering queue
x-i18n:
    generated_at: "2026-07-11T20:28:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

当会话运行已在流式输出时收到普通提示，并且队列模式为 `steer`（默认模式，无需配置），OpenClaw 会尝试将该提示发送到活动运行时。OpenClaw 与原生 Codex app-server harness 的具体交付方式不同。

本页介绍 `steer` 模式下普通入站消息的队列模式 Steering。在 `followup` 或 `collect` 模式下，普通消息会跳过此路径，等待活动运行结束。有关显式的 `/steer <message>` 命令，请参阅 [Steer](/zh-CN/tools/steer)。

## 运行时边界

Steering 不会中断已在运行的工具调用。OpenClaw 会在模型边界检查排队的 Steering 消息：

1. 助手请求调用工具。
2. OpenClaw 执行当前助手消息中的工具调用批次。
3. OpenClaw 发出轮次结束事件。
4. OpenClaw 取出所有排队的 Steering 消息。
5. OpenClaw 在下一次调用 LLM 前，将这些消息追加为用户消息。

这样可以让工具结果与请求这些结果的助手消息保持配对，然后让下一次模型调用看到最新的用户输入。

原生 Codex app-server harness 提供 `turn/steer`，而非 OpenClaw 运行时的内部 Steering queue。OpenClaw 会在配置的静默窗口内批量收集排队的提示，然后按照到达顺序，将收集到的所有用户输入通过单个 `turn/steer` 请求发送。

Codex 审查和手动压缩轮次会拒绝同一轮次中的 Steering。当运行时无法在 `steer` 模式下接受 Steering 时，OpenClaw 会等待活动运行结束，再开始处理该提示。

## 模式

| 模式        | 活动运行期间的行为                                    | 后续行为                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | 在可行时将提示 Steering 到活动运行时。 | 如果 Steering 不可用，则等待活动运行结束。                      |
| `followup`  | 不执行 Steering。                                        | 活动运行结束后再运行排队的消息。                               |
| `collect`   | 不执行 Steering。                                        | 在防抖窗口结束后，将兼容的排队消息合并为后续的一个轮次。 |
| `interrupt` | 中止活动运行，而不是对其执行 Steering。          | 中止后开始处理最新消息。                                           |

## 突发消息示例

如果智能体正在执行工具调用时，有四名用户发送消息：

- 在默认行为下，活动运行时会在下一次模型决策前，按照到达顺序接收全部四条消息。OpenClaw 会在下一个模型边界取出这些消息；Codex 则通过一个批量的 `turn/steer` 接收这些消息。
- 使用 `/queue collect` 时，OpenClaw 不会执行 Steering。它会等待活动运行结束，然后在防抖窗口结束后，用兼容的排队消息创建一个后续轮次。
- 使用 `/queue interrupt` 时，OpenClaw 会中止活动运行并开始处理最新消息，而不是执行 Steering。

## 范围

Steering 始终以当前活动会话运行作为目标。它不会创建新会话、改变活动运行的工具策略，也不会按发送者拆分消息。在多用户渠道中，入站提示已包含发送者和路由上下文，因此下一次模型调用可以看到每条消息的发送者。

如果你希望消息默认排队，而不是 Steering 到活动运行，请使用 `followup` 或 `collect`。如果最新提示应该替换活动运行，请使用 `interrupt`。

## 防抖

`messages.queue.debounceMs` 适用于排队的 `followup` 和 `collect` 交付。在使用原生 Codex harness 的 `steer` 模式下，它还会设置发送批量 `turn/steer` 前的静默窗口。对于 OpenClaw，活动 Steering 本身不使用防抖计时器，因为 OpenClaw 会自然地批量收集消息，直至下一个模型边界。

## 相关内容

- [命令队列](/zh-CN/concepts/queue)
- [Steer](/zh-CN/tools/steer)
- [消息](/zh-CN/concepts/messages)
- [Agent loop](/zh-CN/concepts/agent-loop)
