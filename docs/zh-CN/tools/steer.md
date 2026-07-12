---
read_when:
    - 在智能体已运行时使用 /steer 或 /tell
    - 比较 /steer 与 /queue 模式
    - 决定是引导当前运行还是 ACP 会话
sidebarTitle: Steer
summary: 在不更改队列模式的情况下 Steer 活跃运行
title: Steer
x-i18n:
    generated_at: "2026-07-11T21:02:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` 会先尝试向已处于活动状态的运行发送指导。它适用于“在这次运行仍在工作时调整它”的场景。如果当前运行时无法接受 Steer，OpenClaw 会将该消息作为普通提示发送，而不会丢弃它。

## 当前会话

使用顶层 `/steer` 定位当前会话的活动运行：

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

行为：

- 仅定位当前会话的活动运行。
- 独立于会话的 `/queue` 模式工作。
- 当会话空闲或活动运行无法接受 Steer 时，使用同一条消息开始普通轮次。
- 使用活动运行时的 Steering queue 路径，因此模型会在下一个受支持的运行时边界看到该指导。

## Steer 与队列

`/queue steer` 会让运行处于活动状态时到达的普通入站消息尝试 Steer 活动运行。`/steer <message>` 是一个显式命令，无论已存储的 `/queue` 设置如何，都会尝试在下一个受支持的运行时边界将该命令的消息注入活动运行。如果无法执行该注入，命令前缀会被移除，`<message>` 将作为普通提示继续处理。

用法：

- 如果要立即指导活动运行，请使用 `/steer <message>`。
- 如果希望未来的普通消息默认 Steer 活动运行，请使用 `/queue steer`。
- 如果未来的普通消息应等待后续轮次，而不是 Steer 活动运行，请使用 `/queue collect` 或 `/queue followup`。
- 如果最新消息应替换活动运行，而不是 Steer 它，请使用 `/queue interrupt`。

有关队列模式和 Steering queue 边界，请参阅[命令队列](/zh-CN/concepts/queue)和 [Steering queue](/zh-CN/concepts/queue-steering)。

## 子智能体

顶层 `/steer` 定位当前会话的活动运行。子智能体会向其父会话或请求方会话报告；`/subagents` 仅用于查看状态。

## ACP 会话

当目标是 ACP harness 会话时，请使用 `/acp steer`：

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

有关 ACP 会话选择和运行时行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 相关内容

- [斜杠命令](/zh-CN/tools/slash-commands)
- [命令队列](/zh-CN/concepts/queue)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [子智能体](/zh-CN/tools/subagents)
