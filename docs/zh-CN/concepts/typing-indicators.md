---
read_when:
    - 更改输入状态指示器行为或默认值
summary: OpenClaw 何时显示输入指示器以及如何调优它们
title: 输入状态
x-i18n:
    generated_at: "2026-07-05T11:16:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1be9429a6a5be0dd754e6a088f3afe3681def05be68db3e62c3a2a3ac4b4463
    source_path: concepts/typing-indicators.md
    workflow: 16
---

正在运行时，输入指示器会发送到聊天渠道。使用 `agents.defaults.typingMode` 控制输入何时开始，使用 `typingIntervalSeconds` 控制刷新频率（keepalive 节奏，默认 6 秒）。

## 默认值

当 `agents.defaults.typingMode` **未设置**时：

- **直接聊天**：模型循环开始后，立即开始输入。
- **带提及的群聊**：立即开始输入。
- **不带提及的群聊**：当已准入的运行出现用户可见活动时开始输入，例如 harness 执行活动或消息文本。
- **Heartbeat 运行**：如果解析后的 Heartbeat 目标是支持输入指示器的聊天，且未禁用输入指示器，则在 Heartbeat 运行开始时开始输入。

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` - 永远不显示输入指示器。
- `instant` - **模型循环一开始**就开始输入，即使该运行之后只返回静默回复令牌。
- `thinking` - 在**第一个推理增量**时开始输入，或在轮次被接受后的活跃 harness 执行时开始输入。
- `message` - 在**第一个用户可见的回复活动**时开始输入，例如活跃 harness 执行或非静默文本增量。像 `NO_REPLY` 这样的静默回复令牌不计为文本活动。

“触发早晚”的顺序：`never` -> `message`/`thinking` -> `instant`。

## 配置

设置 Agent 级默认值：

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

## 注意事项

- `message` 模式不会从静默回复令牌开始，但活跃执行仍可能在任何 assistant 文本可用前显示输入状态。
- `thinking` 仍会响应流式推理（`reasoningLevel: "stream"`），也可以在推理增量到达前由活跃执行启动。
- Heartbeat 输入指示器是解析后的投递目标的存活信号。它在 Heartbeat 运行开始时启动，而不是遵循 `message` 或 `thinking` 的流式时序。设置 `typingMode: "never"` 可禁用它。
- 当 Heartbeat 目标为 `"none"`、无法解析目标、Heartbeat 的聊天投递被禁用，或渠道不支持输入指示器时，Heartbeat 不会显示输入状态。
- `typingIntervalSeconds` 控制的是**刷新节奏**，不是开始时间。默认值：6 秒。

## 相关

<CardGroup cols={2}>
  <Card title="在线状态" href="/zh-CN/concepts/presence" icon="signal">
    Gateway 网关如何跟踪已连接的客户端，并在 macOS Instances 标签页中显示它们。
  </Card>
  <Card title="流式传输和分块" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输行为、分块边界，以及特定渠道的投递。
  </Card>
</CardGroup>
