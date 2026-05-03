---
read_when:
    - 说明当智能体正在使用工具时 Steer 的行为
    - 更改活跃运行队列行为或运行时操控集成
    - 比较 `steer`、`queue`、`collect` 和 `followup` 模式
summary: 主动运行引导如何在运行时边界对消息排队
title: Steering queue
x-i18n:
    generated_at: "2026-05-03T22:25:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

当会话运行已在流式传输时又收到一条消息，OpenClaw 可以将该消息发送到活动运行时，而不是为同一会话启动另一次运行。公开模式与运行时无关；Pi 和原生 Codex app-server harness 会以不同方式实现交付细节。

## 运行时边界

引导不会中断已经在运行的工具调用。Pi 会在模型边界检查排队的引导消息：

1. 助手请求工具调用。
2. Pi 执行当前助手消息的工具调用批次。
3. Pi 发出回合结束事件。
4. Pi 清空排队的引导消息。
5. Pi 在下一次 LLM 调用之前，将这些消息追加为用户消息。

这会让工具结果与请求它们的助手消息保持配对，然后让下一次模型调用看到最新的用户输入。

原生 Codex app-server harness 暴露的是 `turn/steer`，而不是 Pi 的内部 Steering queue。OpenClaw 会在那里适配相同模式：

- `steer` 会在配置的静默窗口内批量收集排队消息，然后按到达顺序，用所有已收集的用户输入发送单个 `turn/steer` 请求。
- `queue` 通过发送单独的 `turn/steer` 请求来保持旧版序列化形态。
- `followup`、`collect`、`steer-backlog` 和 `interrupt` 仍然是 OpenClaw 围绕活动 Codex 回合拥有的队列行为。

Codex 审查和手动压缩回合会拒绝同回合引导。当运行时无法接受引导时，OpenClaw 会在该模式允许的情况下回退到跟进队列。

本页说明普通入站消息的队列模式引导。对于显式的 `/steer <message>` 命令，请参阅 [Steer](/zh-CN/tools/steer)。

## 模式

| 模式            | 活动运行行为                                                                                                          | 后续跟进行为                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | 在下一个运行时边界一起注入所有排队的引导消息。这是默认值。                             | 仅当引导不可用时回退到跟进。                           |
| `queue`         | 旧版逐条引导。Pi 在每个模型边界注入一条排队消息；Codex 发送单独的 `turn/steer` 请求。 | 仅当引导不可用时回退到跟进。                           |
| `steer-backlog` | 与 `steer` 相同的活动运行引导行为。                                                                                | 也会为稍后的跟进回合保留同一条消息。                              |
| `followup`      | 不引导当前运行。                                                                                              | 稍后运行排队消息。                                                         |
| `collect`       | 不引导当前运行。                                                                                              | 在防抖窗口之后，将兼容的排队消息合并为一个稍后的回合。 |
| `interrupt`     | 中止活动运行，然后启动最新消息。                                                                       | 无。                                                                               |

## 突发示例

如果四个用户在智能体执行工具调用时发送消息：

- `steer`：活动运行时会在下一次模型决策之前，按到达顺序接收全部四条消息。Pi 会在下一个模型边界清空它们；Codex 会以一个批量 `turn/steer` 接收它们。
- `queue`：旧版序列化引导。Pi 每次注入一条排队消息；Codex 接收单独的 `turn/steer` 请求。
- `collect`：OpenClaw 等待活动运行结束，然后在防抖窗口之后，用兼容的排队消息创建一个跟进回合。

## 范围

引导始终以当前活动会话运行为目标。它不会创建新会话、改变活动运行的工具策略，也不会按发送者拆分消息。在多用户渠道中，入站提示已经包含发送者和路由上下文，因此下一次模型调用可以看到每条消息是谁发送的。

当你希望 OpenClaw 构建一个稍后的跟进回合，并且该回合可以合并兼容消息且保留跟进队列丢弃策略时，请使用 `collect`。只有在需要较旧的逐条引导行为时，才使用 `queue`。

## 防抖

`messages.queue.debounceMs` 适用于跟进交付，包括 `collect`、`followup`、`steer-backlog`，以及活动运行引导不可用时的 `steer` 回退。对于 Pi，活动 `steer` 本身不使用防抖计时器，因为 Pi 会自然地批量收集消息直到下一个模型边界。对于原生 Codex harness，OpenClaw 会把相同的防抖值用作发送批量 `turn/steer` 之前的静默窗口。

## 相关

- [命令队列](/zh-CN/concepts/queue)
- [Steer](/zh-CN/tools/steer)
- [消息](/zh-CN/concepts/messages)
- [Agent loop](/zh-CN/concepts/agent-loop)
