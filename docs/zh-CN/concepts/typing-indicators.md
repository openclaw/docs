---
read_when:
    - 更改正在输入指示器的行为或默认设置
summary: OpenClaw 何时显示正在输入指示器以及如何调整它们
title: 输入状态指示器
x-i18n:
    generated_at: "2026-07-12T14:27:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

运行处于活动状态时，会向聊天渠道发送“正在输入”指示。使用 `agents.defaults.typingMode` 控制**何时**开始显示正在输入状态，使用 `typingIntervalSeconds` 控制其**多久**刷新一次（保活频率，默认为 6 秒）。

## 默认值

当 `agents.defaults.typingMode` **未设置**时：

- **直接聊天**：模型循环开始后立即显示正在输入状态。
- **带提及的群聊**：立即显示正在输入状态。
- **不带提及的群聊**：当已准入的运行出现用户可见活动时开始显示正在输入状态，例如 harness 执行活动或消息文本。
- **Heartbeat 运行**：Heartbeat 运行开始时显示正在输入状态，前提是解析后的 Heartbeat 目标是支持正在输入状态的聊天，并且该状态未被禁用。

## 模式

将 `agents.defaults.typingMode` 设置为以下值之一：

- `never` - 永不显示正在输入指示。
- `instant` - **模型循环一开始**就显示正在输入状态，即使该运行随后仅返回静默回复令牌。
- `thinking` - 在出现**第一个推理增量**时开始显示正在输入状态，或在轮次被接受后进行活跃的 harness 执行时开始显示。
- `message` - 在出现**第一个用户可见的回复活动**时开始显示正在输入状态，例如活跃的 harness 执行或非静默文本增量。`NO_REPLY` 等静默回复令牌不计为文本活动。

按“触发早晚”排序：`never` -> `message`/`thinking` -> `instant`。

## 配置

设置智能体级默认值：

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

按会话覆盖模式或频率：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事项

- `message` 模式不会因静默回复令牌而启动，但在任何助手文本可用之前，活跃的执行仍可能显示正在输入状态。
- `thinking` 仍会响应流式推理（`reasoningLevel: "stream"`），也可以在推理增量到达之前因活跃的执行而启动。
- Heartbeat 的正在输入状态是解析后的投递目标的活跃性信号。它在 Heartbeat 运行开始时启动，而不是遵循 `message` 或 `thinking` 的流式时序。设置 `typingMode: "never"` 可将其禁用。
- 当 Heartbeat 目标为 `"none"`、目标无法解析、Heartbeat 的聊天投递已禁用，或渠道不支持正在输入状态时，Heartbeat 不会显示正在输入状态。
- `typingIntervalSeconds` 控制**刷新频率**，而非开始时间。默认值：6 秒。

## 相关内容

<CardGroup cols={2}>
  <Card title="在线状态" href="/zh-CN/concepts/presence" icon="signal">
    Gateway 网关如何跟踪已连接的客户端，以用于 Control UI 的 Devices 页面和 macOS Instances 标签页。
  </Card>
  <Card title="流式传输和分块" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输行为、分块边界和渠道特定的投递方式。
  </Card>
</CardGroup>
