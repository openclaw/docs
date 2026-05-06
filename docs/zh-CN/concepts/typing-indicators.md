---
read_when:
    - 更改输入状态指示器行为或默认值
summary: OpenClaw 何时显示输入状态指示，以及如何调整它们
title: 正在输入提示
x-i18n:
    generated_at: "2026-05-06T01:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

运行处于活动状态时，会向聊天渠道发送输入状态指示器。使用
`agents.defaults.typingMode` 控制输入状态**何时**开始，使用 `typingIntervalSeconds`
控制它**多久**刷新一次。

## 默认值

当 `agents.defaults.typingMode` **未设置**时，OpenClaw 会保留旧版行为：

- **直接聊天**：模型循环开始后，输入状态会立即开始。
- **带提及的群聊**：输入状态会立即开始。
- **不带提及的群聊**：只有消息文本开始流式传输时，输入状态才会开始。
- **Heartbeat 运行**：如果解析出的 Heartbeat 目标是支持输入状态的聊天，且输入状态未被禁用，则输入状态会在 Heartbeat 运行开始时启动。

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` - 从不显示输入状态指示器。
- `instant` - **模型循环一开始**就开始显示输入状态，即使该运行稍后只返回静默回复标记。
- `thinking` - 在**第一个推理增量**时开始显示输入状态（该运行需要
  `reasoningLevel: "stream"`）。
- `message` - 在**第一个非静默文本增量**时开始显示输入状态（会忽略
  `NO_REPLY` 静默标记）。

“触发早晚”的顺序：
`never` → `message` → `thinking` → `instant`

## 配置

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

你可以按会话覆盖模式或节奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事项

- 当整个载荷是精确的静默标记（例如 `NO_REPLY` / `no_reply`，按大小写不敏感匹配）时，`message` 模式不会为仅静默回复显示输入状态。
- `thinking` 只有在运行流式传输推理（`reasoningLevel: "stream"`）时才会触发。
  如果模型不发出推理增量，输入状态不会开始。
- Heartbeat 输入状态是解析出的投递目标的活跃信号。它会在 Heartbeat 运行开始时启动，而不是跟随 `message` 或 `thinking` 的流式时序。设置 `typingMode: "never"` 可禁用它。
- 当 `target: "none"`、目标无法解析、该 Heartbeat 的聊天投递被禁用，或渠道不支持输入状态时，Heartbeat 不会显示输入状态。
- `typingIntervalSeconds` 控制的是**刷新节奏**，不是开始时间。
  默认值为 6 秒。

## 相关内容

<CardGroup cols={2}>
  <Card title="在线状态" href="/zh-CN/concepts/presence" icon="signal">
    Gateway 网关如何跟踪已连接的客户端，并在 macOS Instances 标签页中显示它们。
  </Card>
  <Card title="流式传输和分块" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输行为、分块边界以及特定于渠道的投递。
  </Card>
</CardGroup>
