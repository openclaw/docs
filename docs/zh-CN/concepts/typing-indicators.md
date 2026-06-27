---
read_when:
    - 更改输入指示器行为或默认值
summary: OpenClaw 何时显示输入状态指示器以及如何调优它们
title: 输入状态指示器
x-i18n:
    generated_at: "2026-06-27T01:55:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

输入状态指示会在运行处于活动状态时发送到聊天渠道。使用
`agents.defaults.typingMode` 控制输入状态**何时**开始，使用 `typingIntervalSeconds`
控制它**多久**刷新一次。

## 默认值

当 `agents.defaults.typingMode` **未设置**时，OpenClaw 会保留旧版行为：

- **私聊**：模型循环开始后，输入状态会立即开始。
- **带提及的群聊**：输入状态会立即开始。
- **不带提及的群聊**：当已接纳的运行出现
  用户可见活动时，输入状态会开始，例如 harness 执行活动或消息文本。
- **Heartbeat 运行**：如果解析出的 Heartbeat 目标是支持输入状态的聊天，并且输入状态未禁用，
  则输入状态会在 Heartbeat 运行开始时启动。

## 模式

将 `agents.defaults.typingMode` 设置为以下值之一：

- `never` - 永不显示输入状态指示。
- `instant` - **模型循环一开始**就开始输入状态，即使该运行
  之后只返回静默回复令牌。
- `thinking` - 在**第一个推理增量**时，或在轮次被接受后出现活跃
  harness 执行时开始输入状态。
- `message` - 在**第一个用户可见的回复活动**时开始输入状态，例如
  活跃 harness 执行或非静默文本增量。像 `NO_REPLY` 这样的静默回复令牌
  不会计为文本活动。

“触发早晚”的顺序：
`never` → `message`/`thinking` → `instant`

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

- `message` 模式不会由静默回复令牌启动，但活跃执行
  仍然可以在任何助手文本可用之前显示输入状态。
- `thinking` 仍会响应流式推理（`reasoningLevel: "stream"`），
  并且也可以在推理增量到达前由活跃执行启动。
- Heartbeat 输入状态是解析后的投递目标的存活信号。它
  会在 Heartbeat 运行开始时启动，而不是遵循 `message` 或 `thinking`
  的流时间。设置 `typingMode: "never"` 可将其禁用。
- 当 `target: "none"`、目标无法解析、该 Heartbeat 的聊天投递被禁用，
  或渠道不支持输入状态时，Heartbeat 不会显示输入状态。
- `typingIntervalSeconds` 控制**刷新节奏**，而不是开始时间。
  默认值为 6 秒。

## 相关

<CardGroup cols={2}>
  <Card title="Presence" href="/zh-CN/concepts/presence" icon="signal">
    Gateway 网关如何跟踪已连接客户端，并在 macOS Instances 标签页中展示它们。
  </Card>
  <Card title="Streaming and chunking" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输行为、分块边界以及特定于渠道的投递。
  </Card>
</CardGroup>
