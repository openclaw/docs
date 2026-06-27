---
read_when:
    - 在智能体已在运行时使用 /steer 或 /tell
    - 比较 /steer 与 /queue 模式
    - 决定是 Steer 当前运行还是 ACP 会话
sidebarTitle: Steer
summary: 在不更改队列模式的情况下 Steer 活跃运行
title: Steer
x-i18n:
    generated_at: "2026-06-27T03:33:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` 首先会尝试向已经活跃的运行发送指引。它用于“在这次运行仍在工作时调整它”的场景。如果当前运行时无法接受引导，OpenClaw 会改为将消息作为普通提示发送，而不是丢弃它。

## 当前会话

使用顶层 `/steer` 定位当前会话的活跃运行：

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

行为：

- 仅定位当前会话的活跃运行。
- 独立于会话的 `/queue` 模式工作。
- 当会话空闲或活跃运行无法接受引导时，会用同一条消息开始一个普通轮次。
- 使用活跃运行时的引导路径，因此模型会在下一个受支持的运行时边界看到该指引。

## Steer 与队列

`/queue steer` 会让普通传入消息在运行处于活跃状态时到达后尝试引导活跃运行。`/steer <message>` 是一个显式命令，它会尝试在下一个受支持的运行时边界将该命令的消息注入活跃运行，而不管已存储的 `/queue` 设置如何。当该注入不可用时，命令前缀会被移除，`<message>` 会继续作为普通提示。

用法：

- 当你想立即指引活跃运行时，使用 `/steer <message>`。
- 当你希望未来的普通消息默认引导活跃运行时，使用 `/queue steer`。
- 当未来的普通消息应等待之后的轮次，而不是引导活跃运行时，使用 `/queue collect` 或 `/queue followup`。
- 当最新消息应替换活跃运行，而不是引导它时，使用 `/queue interrupt`。

有关队列模式和引导边界，请参阅[命令队列](/zh-CN/concepts/queue)和
[Steering queue](/zh-CN/concepts/queue-steering)。

## 子智能体

顶层 `/steer` 定位当前会话的活跃运行。子智能体会回报给其父会话/请求者会话；`/subagents` 仅用于可见性。

## ACP 会话

当目标是 ACP harness 会话时，使用 `/acp steer`：

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

有关 ACP 会话选择和运行时行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 相关

- [斜杠命令](/zh-CN/tools/slash-commands)
- [命令队列](/zh-CN/concepts/queue)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [子智能体](/zh-CN/tools/subagents)
