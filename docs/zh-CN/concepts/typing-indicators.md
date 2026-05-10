---
read_when:
    - 更改输入状态指示器行为或默认值
summary: OpenClaw 何时显示正在输入指示器以及如何调优
title: 输入状态指示器
x-i18n:
    generated_at: "2026-05-10T19:31:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

运行处于活动状态时，会向聊天渠道发送输入指示器。使用
`agents.defaults.typingMode` 控制输入状态**何时**开始，使用 `typingIntervalSeconds`
控制它**多久**刷新一次。

## 默认值

当 `agents.defaults.typingMode` **未设置**时，OpenClaw 会保持旧版行为：

- **直接聊天**：模型循环一开始，输入状态就会立即开始。
- **带有提及的群聊**：输入状态会立即开始。
- **不带提及的群聊**：只有在消息文本开始流式传输时，输入状态才会开始。
- **Heartbeat 运行**：如果解析出的 Heartbeat 目标是支持输入状态的聊天，且输入状态未被禁用，则输入状态会在 Heartbeat 运行开始时启动。

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` - 永不显示输入指示器。
- `instant` - **模型循环一开始**就开始输入状态，即使该运行之后只返回静默回复 token。
- `thinking` - 在**第一个推理增量**时开始输入状态（该运行需要
  `reasoningLevel: "stream"`）。
- `message` - 在**第一个非静默文本增量**时开始输入状态（忽略
  `NO_REPLY` 静默 token）。

“触发早晚”的顺序：
`never` → `message` → `thinking` → `instant`

## 配置

设置智能体级别默认值：

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

按会话覆盖模式或节奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 说明

- 当整个载荷正好是静默 token（例如 `NO_REPLY` / `no_reply`，大小写不敏感匹配）时，`message` 模式不会为仅静默回复显示输入状态。
- `thinking` 只有在运行流式传输推理（`reasoningLevel: "stream"`）时才会触发。
  如果模型没有发出推理增量，输入状态就不会开始。
- Heartbeat 输入状态是针对解析出的投递目标的存活信号。它会在 Heartbeat 运行开始时启动，而不是遵循 `message` 或 `thinking`
  的流式传输时机。设置 `typingMode: "never"` 可将其禁用。
- 当 `target: "none"`、目标无法解析、该 Heartbeat 的聊天投递被禁用，或渠道不支持输入状态时，Heartbeat 不会显示输入状态。
- `typingIntervalSeconds` 控制的是**刷新节奏**，不是开始时间。
  默认值为 6 秒。

## 相关

<CardGroup cols={2}>
  <Card title="Presence" href="/zh-CN/concepts/presence" icon="signal">
    Gateway 网关 如何跟踪已连接的客户端，并在 macOS Instances 标签页中显示它们。
  </Card>
  <Card title="Streaming and chunking" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输行为、分块边界，以及特定于渠道的投递。
  </Card>
</CardGroup>
