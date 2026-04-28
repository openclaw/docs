---
read_when:
    - 在任意渠道中处理表情回应
    - 了解不同平台上的表情符号反应有何差异
summary: 所有受支持渠道中的回应工具语义
title: 表情回应
x-i18n:
    generated_at: "2026-04-28T12:06:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

智能体可以使用带有 `react` 操作的 `message`
工具在消息上添加和移除表情回应。表情回应行为会因渠道和传输协议而异。

## 工作原理

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 添加表情回应时必须提供 `emoji`。
- 将 `emoji` 设为空字符串（`""`）可移除机器人的表情回应。
- 设置 `remove: true` 可移除指定表情（需要非空的 `emoji`）。

## 渠道行为

<AccordionGroup>
  <Accordion title="Discord 和 Slack">
    - 空的 `emoji` 会移除机器人在该消息上的所有表情回应。
    - `remove: true` 只会移除指定表情。

  </Accordion>

  <Accordion title="Google Chat">
    - 空的 `emoji` 会移除应用在该消息上的表情回应。
    - `remove: true` 只会移除指定表情。

  </Accordion>

  <Accordion title="Telegram">
    - 空的 `emoji` 会移除机器人的表情回应。
    - `remove: true` 也会移除表情回应，但工具校验仍要求提供非空的 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空的 `emoji` 会移除机器人表情回应。
    - `remove: true` 会在内部映射为空表情（工具调用中仍要求提供 `emoji`）。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 要求提供非空的 `emoji`。
    - `remove: true` 会移除该指定表情回应。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用带有 `add`、`remove` 和 `list` 操作的 `feishu_reaction` 工具。
    - 添加/移除需要 `emoji_type`；移除还需要 `reaction_id`。

  </Accordion>

  <Accordion title="Signal">
    - 入站表情回应通知由 `channels.signal.reactionNotifications` 控制：`"off"` 会禁用通知，`"own"`（默认）会在用户对机器人消息添加表情回应时发出事件，`"all"` 会为所有表情回应发出事件。

  </Accordion>
</AccordionGroup>

## 表情回应级别

每个渠道的 `reactionLevel` 配置控制智能体使用表情回应的广泛程度。取值通常为 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram reactionLevel](/zh-CN/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/zh-CN/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

在各个渠道上设置 `reactionLevel`，以调整智能体在每个平台上对消息进行表情回应的积极程度。

## 相关内容

- [Agent 发送](/zh-CN/tools/agent-send) — 包含 `react` 的 `message` 工具
- [渠道](/zh-CN/channels) — 特定渠道的配置
