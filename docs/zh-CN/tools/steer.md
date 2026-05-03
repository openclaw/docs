---
read_when:
    - 在智能体已运行时使用 /steer 或 /tell
    - 比较 /steer 和 /queue steer
    - 决定是 Steer 当前运行、子智能体，还是 ACP 会话
sidebarTitle: Steer
summary: 在不更改队列模式的情况下 Steer 活跃运行
title: Steer
x-i18n:
    generated_at: "2026-05-03T22:25:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer` 会向已经处于活跃状态的运行发送指导。它用于“在这次运行仍在工作时调整它”的场景，而不是用于开始新的轮次。

## 当前会话

使用顶层 `/steer` 来定位当前会话的活跃运行：

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

行为：

- 仅定位当前会话的活跃运行。
- 独立于会话的 `/queue` 模式工作。
- 当会话空闲时，不会开始新的运行。
- 当没有可供 Steer 的活跃运行时，会回复警告。
- 使用活跃运行时的 Steering 路径，因此模型会在下一个受支持的运行时边界看到这条指导。

## Steer 与队列

`/queue steer` 会更改普通入站消息在运行活跃时到达的行为方式。`/steer <message>` 是一个显式命令，会尝试在下一个受支持的运行时边界将该命令的消息注入活跃运行，不受已存储的 `/queue` 设置影响。

用法：

- 当你想立即指导活跃运行时，使用 `/steer <message>`。
- 当你希望之后的普通消息默认对活跃运行执行 Steer 时，使用 `/queue steer`。
- 当新消息应该等待后续轮次，而不是对活跃运行执行 Steer 时，使用 `/queue collect` 或 `/queue followup`。

关于队列模式和回退行为，请参阅[命令队列](/zh-CN/concepts/queue)和
[Steering queue](/zh-CN/concepts/queue-steering)。

## 子智能体

当目标是子运行时，使用 `/subagents steer`：

```text
/subagents steer 2 focus only on the API surface
```

顶层 `/steer` 不会通过 ID 或列表索引选择子智能体。它始终定位当前会话的活跃运行。关于子智能体 ID、标签和控制命令，请参阅[子智能体](/zh-CN/tools/subagents)。

## ACP 会话

当目标是 ACP harness 会话时，使用 `/acp steer`：

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

关于 ACP 会话选择和运行时行为，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 相关

- [斜杠命令](/zh-CN/tools/slash-commands)
- [命令队列](/zh-CN/concepts/queue)
- [Steering queue](/zh-CN/concepts/queue-steering)
- [子智能体](/zh-CN/tools/subagents)
