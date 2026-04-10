---
read_when:
    - 在任何渠道中处理反应
    - 了解表情符号反应在不同平台上的差异
summary: 所有受支持渠道中的反应工具语义
title: 反应
x-i18n:
    generated_at: "2026-04-10T20:41:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfac31b7f0effc89cc696e3cf34cd89503ccdbb28996723945025e4b6e159986
    source_path: tools/reactions.md
    workflow: 15
---

# 反应

智能体可以使用带有 `react` 操作的 `message`
工具，在消息上添加和移除表情符号反应。反应行为因渠道而异。

## 工作方式

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 添加反应时，必须提供 `emoji`。
- 将 `emoji` 设为空字符串（`""`）可移除机器人在该消息上的反应。
- 将 `remove: true` 设为移除特定表情（需要非空的 `emoji`）。

## 渠道行为

<AccordionGroup>
  <Accordion title="Discord 和 Slack">
    - 空的 `emoji` 会移除机器人在该消息上的所有反应。
    - `remove: true` 只会移除指定的表情。
  </Accordion>

  <Accordion title="Google Chat">
    - 空的 `emoji` 会移除应用在该消息上的反应。
    - `remove: true` 只会移除指定的表情。
  </Accordion>

  <Accordion title="Telegram">
    - 空的 `emoji` 会移除机器人的反应。
    - `remove: true` 也会移除反应，但为了通过工具校验，仍然需要提供非空的 `emoji`。
  </Accordion>

  <Accordion title="WhatsApp">
    - 空的 `emoji` 会移除机器人的反应。
    - `remove: true` 会在内部映射为空 `emoji`（但在工具调用中仍然需要 `emoji`）。
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 需要非空的 `emoji`。
    - `remove: true` 会移除该特定表情反应。
  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用 `feishu_reaction` 工具，并采用 `add`、`remove` 和 `list` 操作。
    - 添加/移除需要 `emoji_type`；移除还需要 `reaction_id`。
  </Accordion>

  <Accordion title="Signal">
    - 入站反应通知由 `channels.signal.reactionNotifications` 控制：`"off"` 会禁用它们，`"own"`（默认）会在用户对机器人消息作出反应时发出事件，而 `"all"` 会为所有反应发出事件。
  </Accordion>
</AccordionGroup>

## 反应级别

每个渠道的 `reactionLevel` 配置控制智能体使用反应的范围。常见取值为 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram 反应级别](/zh-CN/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp 反应级别](/zh-CN/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

在各个单独渠道上设置 `reactionLevel`，以调整智能体在每个平台上对消息作出反应的积极程度。

## 相关内容

- [智能体发送](/zh-CN/tools/agent-send) — 包含 `react` 的 `message` 工具
- [渠道](/zh-CN/channels) — 各渠道专属配置
