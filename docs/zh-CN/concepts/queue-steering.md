---
read_when:
    - 说明 Steer 在智能体使用工具时的行为
    - 更改活动运行队列行为或运行时 Steering 集成
    - 比较 steering 与 followup、collect 和 interrupt 队列模式
summary: 活动运行转向如何在运行时边界将消息入队
title: Steering queue
x-i18n:
    generated_at: "2026-07-05T11:15:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

当会话运行已经在流式传输时收到普通提示，并且队列模式为 `steer`（默认值，无需配置）时，OpenClaw 会尝试将该提示发送到活动运行时中。OpenClaw 和原生 Codex app-server harness 以不同方式实现投递细节。

本页介绍 `steer` 模式下普通入站消息的队列模式 Steer 处理。在 `followup` 或 `collect` 模式下，普通消息会跳过此路径，并等待活动运行完成。有关显式 `/steer <message>` 命令，请参阅 [Steer](/zh-CN/tools/steer)。

## 运行时边界

Steer 不会中断已经在运行的工具调用。OpenClaw 会在模型边界检查排队的 Steer 消息：

1. 助手请求工具调用。
2. OpenClaw 执行当前助手消息的工具调用批次。
3. OpenClaw 发出轮次结束事件。
4. OpenClaw 清空排队的 Steer 消息。
5. OpenClaw 在下一次 LLM 调用之前，将这些消息追加为用户消息。

这会让工具结果与请求它们的助手消息保持配对，然后让下一次模型调用看到最新的用户输入。

原生 Codex app-server harness 暴露的是 `turn/steer`，而不是 OpenClaw 运行时的内部 Steer 队列。OpenClaw 会在配置的静默窗口内批处理排队提示，然后发送一个 `turn/steer` 请求，其中包含按到达顺序收集的所有用户输入。

Codex review 和手动压缩轮次会拒绝同一轮次的 Steer。当运行时在 `steer` 模式下无法接受 Steer 时，OpenClaw 会等待活动运行完成，然后再启动该提示。

## 模式

| 模式        | 活动运行行为                                    | 后续行为                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | 在可行时将提示 Steer 到活动运行时中。 | 如果 Steer 不可用，则等待活动运行完成。                      |
| `followup`  | 不执行 Steer。                                        | 在活动运行结束后稍后运行排队消息。                               |
| `collect`   | 不执行 Steer。                                        | 在防抖窗口之后，将兼容的排队消息合并到一个后续轮次中。 |
| `interrupt` | 中止活动运行，而不是对其执行 Steer。          | 中止后启动最新消息。                                           |

## 突发示例

如果四个用户在 agent 执行工具调用时发送消息：

- 使用默认行为时，活动运行时会在下一次模型决策之前按到达顺序收到全部四条消息。OpenClaw 会在下一个模型边界清空它们；Codex 会以一个批处理的 `turn/steer` 接收它们。
- 使用 `/queue collect` 时，OpenClaw 不会执行 Steer。它会等待活动运行结束，然后在防抖窗口之后，使用兼容的排队消息创建一个 followup 轮次。
- 使用 `/queue interrupt` 时，OpenClaw 会中止活动运行，并启动最新消息，而不是执行 Steer。

## 范围

Steer 始终以当前活动会话运行作为目标。它不会创建新会话、改变活动运行的工具策略，或按发送者拆分消息。在多用户渠道中，入站提示已经包含发送者和路由上下文，因此下一次模型调用可以看到每条消息是谁发送的。

当你希望消息默认排队而不是 Steer 到活动运行时，请使用 `followup` 或 `collect`。当最新提示应替换活动运行时，请使用 `interrupt`。

## 防抖

`messages.queue.debounceMs` 适用于排队的 `followup` 和 `collect` 投递。在使用原生 Codex harness 的 `steer` 模式下，它还会设置发送批处理 `turn/steer` 之前的静默窗口。对于 OpenClaw，活动 Steer 本身不使用防抖计时器，因为 OpenClaw 会自然地批处理消息，直到下一个模型边界。

## 相关

- [命令队列](/zh-CN/concepts/queue)
- [Steer](/zh-CN/tools/steer)
- [消息](/zh-CN/concepts/messages)
- [Agent loop](/zh-CN/concepts/agent-loop)
