---
read_when:
    - 修改输入中指示器行为或默认值
summary: OpenClaw 何时显示输入中指示器，以及如何调节它们
title: 输入中指示器
x-i18n:
    generated_at: "2026-04-05T08:22:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28c8c395a135fc0745181aab66a93582177e6acd0b3496debcbb98159a4f11dc
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# 输入中指示器

当某次运行处于活动状态时，会向聊天渠道发送输入中指示器。使用
`agents.defaults.typingMode` 控制**何时**开始显示输入中，使用 `typingIntervalSeconds`
控制**多久**刷新一次。

## 默认值

当 `agents.defaults.typingMode` **未设置**时，OpenClaw 会保持旧版行为：

- **私聊**：模型循环一开始就立即显示输入中。
- **带提及的群聊**：立即显示输入中。
- **不带提及的群聊**：只有在消息文本开始流式传输时才显示输入中。
- **Heartbeat 运行**：禁用输入中。

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` — 从不显示输入中指示器。
- `instant` — **只要模型循环开始**就立即显示输入中，即使该次运行
  后续只返回静默回复 token。
- `thinking` — 在**第一个推理增量**到来时开始显示输入中（要求
  此次运行的 `reasoningLevel: "stream"`）。
- `message` — 在**第一个非静默文本增量**到来时开始显示输入中（忽略
  `NO_REPLY` 静默 token）。

按“触发有多早”的顺序排列：
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

你也可以按会话覆盖模式或频率：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 说明

- 在 `message` 模式下，如果整个
  负载恰好就是静默 token（例如 `NO_REPLY` / `no_reply`，
  不区分大小写匹配），则不会显示输入中。
- `thinking` 仅在该次运行流式输出推理时才会触发（`reasoningLevel: "stream"`）。
  如果模型没有发出推理增量，就不会开始显示输入中。
- Heartbeat 永远不会显示输入中，无论使用哪种模式。
- `typingIntervalSeconds` 控制的是**刷新频率**，而不是开始时间。
  默认值为 6 秒。
