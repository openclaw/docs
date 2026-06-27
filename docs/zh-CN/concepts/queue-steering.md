---
read_when:
    - 解释 Steer 在智能体使用工具时的行为
    - 更改活动运行队列行为或运行时 Steering 集成
    - 比较引导与 followup、collect 和 interrupt 队列模式
summary: 活跃运行引导如何在运行时边界对消息排队
title: Steering queue
x-i18n:
    generated_at: "2026-06-27T01:53:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

当普通提示到达时，如果某个会话运行已经在流式传输，OpenClaw
默认会在队列模式为 `steer` 时尝试将该提示发送到活跃运行时中。
该默认行为不需要配置项，也不需要队列指令。OpenClaw 和原生 Codex app-server harness
以不同方式实现投递细节。

## 运行时边界

引导不会中断已经在运行的工具调用。OpenClaw 会在模型边界检查
排队的引导消息：

1. 助手请求工具调用。
2. OpenClaw 执行当前助手消息的工具调用批次。
3. OpenClaw 发出轮次结束事件。
4. OpenClaw 排空排队的引导消息。
5. OpenClaw 在下一次 LLM 调用之前，将这些消息追加为用户消息。

这样可以让工具结果与请求它们的助手消息保持配对，
然后让下一次模型调用看到最新的用户输入。

原生 Codex app-server harness 暴露 `turn/steer`，而不是 OpenClaw 运行时的
内部引导队列。OpenClaw 会在配置的静默窗口内批处理排队的提示，
然后发送一个 `turn/steer` 请求，其中包含按到达顺序收集的所有用户
输入。

Codex 审查和手动压缩轮次会拒绝同轮次引导。当某个运行时无法在
`steer` 模式下接受引导时，OpenClaw 会等待活跃运行完成，然后再启动该提示。

本页说明队列模式为 `steer` 时，普通入站消息的队列模式引导。如果模式
为 `followup` 或 `collect`，普通消息不会进入此引导路径；它们会等待
活跃运行完成。对于显式的 `/steer <message>` 命令，请参阅 [Steer](/zh-CN/tools/steer)。

## 模式

| 模式        | 活跃运行行为                                    | 后续行为                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | 在可行时将提示引导到活跃运行时中。 | 如果引导不可用，则等待活跃运行完成。                      |
| `followup`  | 不引导。                                        | 在活跃运行结束后，稍后运行排队的消息。                               |
| `collect`   | 不引导。                                        | 在防抖窗口后，将兼容的排队消息合并到一个后续轮次中。 |
| `interrupt` | 中止活跃运行，而不是引导它。          | 中止后启动最新消息。                                           |

## 突发示例

如果四个用户在智能体执行工具调用时发送消息：

- 使用默认行为时，活跃运行时会在下一次模型决策之前，按
  到达顺序接收全部四条消息。OpenClaw 会在下一个模型边界排空它们；
  Codex 会以一个批处理的 `turn/steer` 接收它们。
- 使用 `/queue collect` 时，OpenClaw 不会引导。它会等待活跃运行
  结束，然后在防抖窗口后，用兼容的排队消息创建一个 followup 轮次。
- 使用 `/queue interrupt` 时，OpenClaw 会中止活跃运行，并启动最新
  消息，而不是进行引导。

## 范围

引导始终以当前活跃会话运行为目标。它不会创建新的
会话，不会更改活跃运行的工具策略，也不会按发送者拆分消息。在
多用户渠道中，入站提示已经包含发送者和路由上下文，因此
下一次模型调用可以看到每条消息是谁发送的。

当你希望消息默认排队，而不是引导活跃运行时，请使用 `followup` 或
`collect`。当最新提示应替换活跃运行时，请使用 `interrupt`。

## 防抖

`messages.queue.debounceMs` 适用于排队的 `followup` 和 `collect` 投递。
在使用原生 Codex harness 的 `steer` 模式下，它还会设置发送批处理
`turn/steer` 之前的静默窗口。对于 OpenClaw，活跃引导本身不使用
防抖计时器，因为 OpenClaw 会自然地批处理消息，直到下一个模型
边界。

## 相关内容

- [命令队列](/zh-CN/concepts/queue)
- [Steer](/zh-CN/tools/steer)
- [消息](/zh-CN/concepts/messages)
- [Agent loop](/zh-CN/concepts/agent-loop)
