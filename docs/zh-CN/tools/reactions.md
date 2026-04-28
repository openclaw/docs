---
read_when:
- 处理任意渠道中的表情回应功能
- 了解各平台上的 emoji 表情回应有何不同
summary: 所有支持渠道中的表情回应工具语义
title: 表情回应
x-i18n:
  generated_at: '2026-04-28T05:40:00Z'
  refreshed_at: '2026-04-28T05:40:00Z'
  model: gpt-5.5
  provider: openai
  source_hash: 99de929eef4f73a853e67986541ecc05504723d7ed1c6d00965f76b40f2d3055
  source_path: tools/reactions.md
  workflow: 15
---

智能体可以使用带有 `react` 动作的 `message`
工具，在消息上添加或移除 emoji 表情回应。不同渠道中的表情回应行为有所不同。

## 工作原理

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 添加表情回应时，`emoji` 是必需的。
- 将 `emoji` 设为空字符串（`""`）可移除机器人的表情回应。
- 设置 `remove: true` 可移除某个特定 emoji（要求 `emoji` 为非空）。

## 渠道行为

<AccordionGroup>
  <Accordion title="Discord 和 Slack">
    - 空 `emoji` 会移除机器人在该消息上的所有表情回应。
    - `remove: true` 只会移除指定的 emoji。
  </Accordion>

  <Accordion title="Google Chat">
    - 空 `emoji` 会移除应用在该消息上的表情回应。
    - `remove: true` 只会移除指定的 emoji。
  </Accordion>

  <Accordion title="Telegram">
    - 空 `emoji` 会移除机器人的表情回应。
    - `remove: true` 也会移除表情回应，但为了通过工具校验，仍然要求提供非空 `emoji`。
  </Accordion>

  <Accordion title="WhatsApp">
    - 空 `emoji` 会移除机器人的表情回应。
    - `remove: true` 会在内部映射为空 emoji（但工具调用中仍然要求提供 `emoji`）。
  </Accordion>

  <Accordion title="Zalo Personal（zalouser）">
    - 要求 `emoji` 非空。
    - `remove: true` 会移除该特定 emoji 表情回应。
  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用 `feishu_reaction` 工具，并配合 `add`、`remove` 和 `list` 动作。
    - 添加/移除都要求 `emoji_type`；移除还要求提供 `reaction_id`。
  </Accordion>

  <Accordion title="Signal">
    - 入站表情回应通知由 `channels.signal.reactionNotifications` 控制：`"off"` 会禁用它们，`"own"`（默认）会在用户对机器人消息做出回应时发出事件，而 `"all"` 会为所有表情回应发出事件。
  </Accordion>
</AccordionGroup>

## 表情回应级别

按渠道的 `reactionLevel` 配置控制智能体使用表情回应的广泛程度。常见值通常为 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram reactionLevel](/zh-CN/channels/telegram#reaction-notifications) —— `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/zh-CN/channels/whatsapp#reaction-level) —— `channels.whatsapp.reactionLevel`

在各个单独渠道上设置 `reactionLevel`，可微调智能体在不同平台上主动使用表情回应的程度。

## 相关内容

- [智能体发送](/zh-CN/tools/agent-send) —— 包含 `react` 的 `message` 工具
- [渠道](/zh-CN/channels) —— 渠道专用配置
