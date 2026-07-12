---
read_when:
    - 你希望智能体能察觉人类或其他智能体是否在其不知情的情况下更改了会话
    - 你正在调试状态变更通知、监视游标或 `session_status` 的 `changesSince`。
    - 你想了解父智能体如何与子会话保持同步
sidebarTitle: Session state awareness
summary: 持久会话状态信号日志：状态版本、监视器、陈旧状态通知与协调一致
title: 会话状态感知
x-i18n:
    generated_at: "2026-07-12T21:23:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06ec310fc482ce658eb37628ac33c4224349846d1ffd6e8edeac01bc84e56341
    source_path: concepts/session-state.md
    workflow: 16
---

当多个会话处理同一问题时——例如管理者将任务委派给子会话、人类直接进入工作会话，或两个智能体通过 [`sessions_send`](/zh-CN/concepts/session-tool) 协调——每个会话都会基于其他会话建立一些假设。一旦有另一个参与者介入，这些假设就会过时。会话状态感知机制会检测这种介入，向受影响的会话通知一次，并为其提供一种低成本的方式，以便在采取行动前了解最新情况。

三个部分协同工作：

1. **持久信号日志**记录每个会话中选定的状态变化。
2. **监视器**为每个目标维护游标，并接收一条合并后的状态过时通知。
3. **协调同步**通过带有 `changesSince` 的 `session_status` 拉取精确增量。

## 信号日志

当受监视会话发生实质性变化时，OpenClaw 会向共享状态数据库（`session_state_events`）追加一个类型化事件。事件包含元数据和单行摘要——绝不包含消息内容。

| 类型                   | 记录时机                                                 | 通知监视器       |
| ---------------------- | -------------------------------------------------------- | ---------------- |
| `human_direct_message` | 人类直接向受监视会话发送一个轮次                         | 是               |
| `goal_changed`         | 创建、更新或清除会话的目标状态                           | 是               |
| `child_spawned`        | 创建子智能体或 ACP 子会话                                | 否（初始化游标） |
| `run_completed`        | 子会话运行成功结束                                       | 否（仅记录日志） |
| `run_failed`           | 子会话运行失败、超时或被取消                             | 否（仅记录日志） |
| `compacted`            | 会话历史记录被压缩                                       | 否（仅记录日志） |

每个事件都会标明其参与者（`human`、`agent` 或 `system`）。被取消和超时的子会话运行会被记录为失败，并在事件载荷中保留精确结果（`cancelled`、`timeout` 或 `error`）。

会话的**状态版本**就是其日志中的最高序列号，它记录在一个持久的会话级头部中，并在日志修剪后继续保留。当会话已记录变更时，`sessions_list` 行会包含 `stateVersion`；`session_status` 始终会报告该值。

仅记录日志的类型用于协调同步历史，而非通知：常规的子会话运行完成消息仍由[子智能体通知](/zh-CN/tools/subagents)负责，信号日志绝不会重复发送这类消息。

## 监视器

监视器是指持有目标游标（`session_watch_cursors`）的会话。游标来自两个来源：

- **隐式（衍生边）。** 当一个会话创建子智能体或 ACP 子会话时，父会话的游标会自动初始化为子会话创建时的版本。父会话无需手动订阅。
- **显式（`sessions_send watch: true`）。** 任何协调者都可以监视并非由其创建的目标：在 `sessions_send` 中传入 `watch: true`，发送成功分派后，发送方就会注册为实际接收消息的会话的监视器。注册从目标当前的状态版本开始——先前的历史记录绝不会产生通知。设置该参数后，工具结果会报告 `watched: true|false`。

监视器标识必须是包含智能体限定信息的会话键。在 `session.scope="global"` 下，共享的 `global` 键在不同智能体之间存在歧义，因此此类会话可以使用持久日志和 `changesSince`，但不会收到主动通知。

监视关系会自动清理：游标行随信号日志的保留期过期，在监视器会话重置时移除，并会在任一会话被删除时一并删除。v1 中没有取消监视的操作。

## 通知：只有一条，不会重复

当可触发通知的事件到达，并且监视器的游标落后时，监视器会在下一轮收到一条系统通知：

```
会话 "agent:main:subagent:child" 已发生变更（其他参与者）。请在操作前协调同步：session_status sessionKey "agent:main:subagent:child" changesSince 12。
```

主会话监视器还会通过 Heartbeat 唤醒立即唤醒；嵌套的子智能体监视器则会在下一轮收到通知。

该协议专门采用了防骚扰设计：

- **每个监视器/目标对最多保留一条待处理通知。** 待处理期间，通知文本在字节层面保持稳定，系统事件队列会据此去重，因此即使同一目标快速发生二十次变化，监视器的提示词中仍只会出现一行通知。
- **冻结水位线。** 通知排队时，游标会冻结其已通知位置。后续实质性事件只会推进实质性水位线，不会再次发送通知。
- **出队时确认，仅在期间发生新变化时重新开启。** 当监视器的轮次消费该通知时，游标会向前推进。如果从通知入队到出队期间又有实质性事件到达，则会针对剩余变化仅开启一条新通知。
- **自我抑制。** 监视器绝不会收到由其自身引发的事件通知。
- **重启恢复。** 待处理通知位于内存队列中；Gateway 网关重启后，启动扫描会根据持久游标重新生成这些通知。

## 协调同步

通知会明确告诉监视器应该做什么。带有 `changesSince: <version>` 的 `session_status` 会返回该版本之后的类型化事件（最多 200 个），且不会推进任何游标：

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "人类通过 telegram 发送消息"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "目标已更新" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` 表示请求的版本早于当前保留的历史记录——此时应刷新完整的会话状态（`sessions_history`、`session_status`），而不是将响应视为精确增量。间隙信号是精确的：它来自会话级修剪水位线，而不是根据序列号运算推断得出。

## 存储和限制

历史记录存储在共享状态数据库中，最多保留 30 天和 50,000 行；修剪后，每个会话的头部仍保持单调递增。记录采用尽力而为模式——追加失败会被写入日志，但绝不会导致发起该事件的轮次失败——因此 `stateVersion` 是信号日志头部，而不是事务性变更数据捕获版本。

当前限制：

- 通知传递假定由单个 Gateway 网关进程拥有共享状态数据库。多个 Gateway 网关可以共享持久日志和 `changesSince`，但 v1 不会跨进程推送通知。
- 压缩事件覆盖嵌入式运行时的压缩所有者；仅由原生 harness 执行的压缩尚未被完整记录。
- 取消结果的载荷详情目前由 ACP 子会话运行生成；原生子智能体取消会表现为通用失败。

## 相关内容

- [会话工具](/zh-CN/concepts/session-tool)——`sessions_send`、`session_status`、`sessions_list`
- [子智能体](/zh-CN/tools/subagents)——衍生边和完成通知
- [Heartbeat](/zh-CN/gateway/heartbeat)——排队通知如何唤醒主会话
- [会话管理](/zh-CN/concepts/session)——会话键、作用域和生命周期
