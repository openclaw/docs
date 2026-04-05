---
read_when:
    - 在任意渠道中处理反应功能时
    - 了解不同平台上的表情反应有何差异
summary: 所有受支持渠道中的反应工具语义
title: 反应
x-i18n:
    generated_at: "2026-04-05T10:12:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af2951eee32e73adb982dbdf39b32e4065993454e9cce2ad23b27565cab4f84
    source_path: tools/reactions.md
    workflow: 15
---

# 反应

智能体可以使用带有 `react` 操作的 `message`
工具，在消息上添加和移除表情反应。反应行为因渠道而异。

## 工作方式

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 添加反应时，`emoji` 是必填项。
- 将 `emoji` 设为空字符串（`""`）可移除机器人的反应。
- 将 `remove: true` 设为移除指定表情（要求 `emoji` 为非空）。

## 渠道行为

<AccordionGroup>
  <Accordion title="Discord 和 Slack">
    - 空的 `emoji` 会移除该消息上机器人添加的所有反应。
    - `remove: true` 只移除指定表情。
  </Accordion>

  <Accordion title="Google Chat">
    - 空的 `emoji` 会移除该消息上应用添加的反应。
    - `remove: true` 只移除指定表情。
  </Accordion>

  <Accordion title="Telegram">
    - 空的 `emoji` 会移除机器人的反应。
    - `remove: true` 也会移除反应，但出于工具校验要求，仍然需要提供非空 `emoji`。
  </Accordion>

  <Accordion title="WhatsApp">
    - 空的 `emoji` 会移除机器人反应。
    - `remove: true` 会在内部映射为空 `emoji`（但在工具调用中仍然需要提供 `emoji`）。
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 需要非空 `emoji`。
    - `remove: true` 会移除该特定表情反应。
  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用带有 `add`、`remove` 和 `list` 操作的 `feishu_reaction` 工具。
    - 添加/移除需要 `emoji_type`；移除还需要 `reaction_id`。
  </Accordion>

  <Accordion title="Signal">
    - 入站反应通知由 `channels.signal.reactionNotifications` 控制：`"off"` 会禁用它们，`"own"`（默认）会在用户对机器人消息作出反应时发出事件，而 `"all"` 会为所有反应发出事件。
  </Accordion>
</AccordionGroup>

## 反应级别

每个渠道的 `reactionLevel` 配置用于控制智能体使用反应的广泛程度。常见取值为 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram reactionLevel](/zh-CN/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/zh-CN/channels/whatsapp#reactions) — `channels.whatsapp.reactionLevel`

在各个单独渠道上设置 `reactionLevel`，即可调整智能体在每个平台上对消息作出反应的活跃程度。

## 相关内容

- [Agent Send](/zh-CN/tools/agent-send) — 包含 `react` 的 `message` 工具
- [Channels](/zh-CN/channels) — 渠道特定配置
