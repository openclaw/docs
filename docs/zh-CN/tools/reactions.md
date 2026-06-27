---
read_when:
    - 在任何渠道中处理回应
    - 了解表情符号回应在不同平台上的差异
summary: 所有受支持渠道中的 Reaction 工具语义
title: 反应
x-i18n:
    generated_at: "2026-06-27T03:31:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

智能体可以使用带有 `react` 操作的 `message` 工具在消息上添加和移除表情反应。反应行为因渠道和传输协议而异。

## 工作方式

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 添加反应时必须提供 `emoji`。
- 将 `emoji` 设为空字符串（`""`）可移除机器人的反应。
- 设置 `remove: true` 可移除特定表情（需要非空 `emoji`）。
- 在支持状态反应的渠道上，反应中的 `trackToolCalls: true` 会让运行时在同一轮次内，将该已反应消息用于后续工具进度反应。

## 渠道行为

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 空 `emoji` 会移除机器人在该消息上的所有反应。
    - `remove: true` 只会移除指定表情。

  </Accordion>

  <Accordion title="Google Chat">
    - 空 `emoji` 会移除应用在该消息上的反应。
    - `remove: true` 只会移除指定表情。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - 仅支持添加反应：必须提供 `emoji`，且不能为空。
    - 暂不支持移除反应；带有 `remove: true`（或空 `emoji`）的调用会被拒绝，并返回清晰错误，而不是静默执行空操作。
    - 要求 Talk 机器人注册 `reaction` 功能（参见 [Nextcloud Talk 渠道文档](/zh-CN/channels/nextcloud-talk)）。

  </Accordion>

  <Accordion title="Telegram">
    - 空 `emoji` 会移除机器人的反应。
    - `remove: true` 也会移除反应，但工具校验仍要求提供非空 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空 `emoji` 会移除机器人反应。
    - `remove: true` 会在内部映射为空表情（工具调用中仍需要 `emoji`）。
    - WhatsApp 每条消息只有一个机器人反应槽；状态反应更新会替换该槽，而不是堆叠多个表情。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 要求非空 `emoji`。
    - `remove: true` 会移除该特定表情反应。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用 `feishu_reaction` 工具，并配合 `add`、`remove` 和 `list` 操作。
    - 添加/移除需要 `emoji_type`；移除还需要 `reaction_id`。

  </Accordion>

  <Accordion title="Signal">
    - 入站反应通知由 `channels.signal.reactionNotifications` 控制：`"off"` 会禁用它们，`"own"`（默认）会在用户对机器人消息作出反应时发出事件，`"all"` 会为所有反应发出事件。

  </Accordion>

  <Accordion title="iMessage">
    - 出站反应是 iMessage tapback（`love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`）。
    - 入站 tapback 通知由 `channels.imessage.reactionNotifications` 控制：`"off"` 会禁用它们，`"own"`（默认）会在用户对机器人编写的消息作出反应时发出事件，`"all"` 会为授权发送者的所有 tapback 发出事件。

  </Accordion>
</AccordionGroup>

## 反应级别

按渠道配置的 `reactionLevel` 控制智能体使用反应的广泛程度。取值通常是 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram reactionLevel](/zh-CN/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/zh-CN/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

在各个渠道上设置 `reactionLevel`，以调整智能体在每个平台上对消息作出反应的活跃程度。

## 相关

- [Agent Send](/zh-CN/tools/agent-send) — 包含 `react` 的 `message` 工具
- [渠道](/zh-CN/channels) — 渠道专属配置
