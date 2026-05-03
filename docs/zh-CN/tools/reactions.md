---
read_when:
    - 在任意渠道中处理表情回应
    - 了解表情符号回应在不同平台之间的差异
summary: 所有支持渠道中的回应工具语义
title: 表情回应
x-i18n:
    generated_at: "2026-05-03T16:48:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

智能体可以使用带有 `react` 动作的 `message`
工具，在消息上添加和移除表情反应。反应行为因渠道和传输方式而异。

## 工作原理

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 添加反应时必须提供 `emoji`。
- 将 `emoji` 设置为空字符串（`""`）可移除 bot 的反应。
- 设置 `remove: true` 可移除特定表情（需要非空的 `emoji`）。
- 在支持状态反应的渠道上，反应中的 `trackToolCalls: true` 可让运行时在同一轮中将该已反应的消息用于后续工具进度反应。

## 渠道行为

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 空的 `emoji` 会移除消息上 bot 的所有反应。
    - `remove: true` 只会移除指定的表情。

  </Accordion>

  <Accordion title="Google Chat">
    - 空的 `emoji` 会移除应用在消息上的反应。
    - `remove: true` 只会移除指定的表情。

  </Accordion>

  <Accordion title="Telegram">
    - 空的 `emoji` 会移除 bot 的反应。
    - `remove: true` 也会移除反应，但工具校验仍需要非空的 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空的 `emoji` 会移除 bot 反应。
    - `remove: true` 会在内部映射为空表情（工具调用中仍需要 `emoji`）。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 需要非空的 `emoji`。
    - `remove: true` 会移除该特定表情反应。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用带有 `add`、`remove` 和 `list` 动作的 `feishu_reaction` 工具。
    - 添加/移除需要 `emoji_type`；移除还需要 `reaction_id`。

  </Accordion>

  <Accordion title="Signal">
    - 入站反应通知由 `channels.signal.reactionNotifications` 控制：`"off"` 会禁用它们，`"own"`（默认）会在用户对 bot 消息作出反应时发出事件，`"all"` 会为所有反应发出事件。

  </Accordion>
</AccordionGroup>

## 反应级别

按渠道配置的 `reactionLevel` 会控制智能体使用反应的范围。值通常是 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram reactionLevel](/zh-CN/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/zh-CN/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

在各个渠道上设置 `reactionLevel`，以调节智能体在每个平台上对消息作出反应的活跃程度。

## 相关内容

- [Agent Send](/zh-CN/tools/agent-send) — 包含 `react` 的 `message` 工具
- [渠道](/zh-CN/channels) — 特定于渠道的配置
