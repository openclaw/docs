---
read_when:
    - 在任意渠道中处理表情回应
    - 了解不同平台上的表情回应有何差异
summary: 所有受支持渠道的表情回应工具语义
title: 表情回应
x-i18n:
    generated_at: "2026-07-11T21:02:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

智能体通过 `message` 工具的 `react` 操作添加和移除表情回应。具体行为因渠道而异。

## 工作原理

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 添加表情回应时必须提供 `emoji`。
- 在支持此功能的渠道上，将 `emoji` 设为空字符串（`""`）可移除 Bot 的表情回应。
- 设置 `remove: true` 可移除某个特定表情（要求 `emoji` 非空）。
- 在支持状态表情回应的渠道上，对某个表情回应设置 `trackToolCalls: true`，可让运行时在同一轮次的后续工具进度表情回应中复用该消息。

## 渠道行为

<AccordionGroup>
  <Accordion title="Discord 和 Slack">
    - 空的 `emoji` 会移除该消息上 Bot 的所有表情回应。
    - `remove: true` 仅移除指定的表情。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - 仅支持添加表情回应：必须提供 `emoji`，且不能为空。
    - 移除表情回应尚未接入删除调用；`remove: true` 会返回明确错误，而不会静默地不执行任何操作。
    - 要求注册 Talk Bot 时启用 `reaction` 功能（参阅 [Nextcloud Talk 渠道文档](/zh-CN/channels/nextcloud-talk)）。

  </Accordion>

  <Accordion title="Telegram">
    - 空的 `emoji` 会移除 Bot 的表情回应。
    - `remove: true` 也会移除表情回应，但工具验证仍要求提供非空的 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空的 `emoji` 会移除 Bot 的表情回应。
    - `remove: true` 会在内部映射为空表情（工具调用中仍必须提供 `emoji`）。
    - WhatsApp 的每条消息只有一个 Bot 表情回应位；发送新表情回应会替换原有回应，而不会叠加多个表情。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 添加和移除操作都要求 `emoji` 非空。
    - `remove: true` 会移除该特定表情回应。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 与其他渠道一样使用 `react` 操作（通过消息表情回应 ID 添加、移除和列出），而不是使用单独的工具。
    - 添加时要求 `emoji` 非空（映射为 Feishu `emoji_type`，例如 `SMILE`、`THUMBSUP`、`HEART`）。
    - `remove: true` 要求 `emoji` 非空，并移除与该表情类型匹配的 Bot 自有表情回应。
    - 空的 `emoji` 与 `clearAll: true` 搭配使用时，会移除该消息上 Bot 的所有表情回应。

  </Accordion>

  <Accordion title="Signal">
    - 入站表情回应通知由 `channels.signal.reactionNotifications` 控制：`"off"` 会禁用通知；`"own"`（默认值）会在用户对 Bot 消息作出表情回应时发出事件；`"all"` 会为所有表情回应发出事件；`"allowlist"` 仅为 `channels.signal.reactionAllowlist` 中发送者的表情回应发出事件。

  </Accordion>

  <Accordion title="iMessage">
    - 出站表情回应是 iMessage 的点回功能（`love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`）；要添加表情回应，`emoji` 必须映射到其中一种类型。
    - 使用 `remove: true` 时，如果未提供可识别的点回类型，则移除所有点回类型；如果提供了可识别的类型，则仅移除该类型。

  </Accordion>
</AccordionGroup>

## 表情回应级别

各渠道的 `reactionLevel` 会限制智能体发送自身表情回应的频率。可选值：`off`、`ack`、`minimal` 或 `extensive`。

- [Telegram 表情回应通知](/zh-CN/channels/telegram#feature-reference) - `channels.telegram.reactionLevel`（默认值为 `minimal`）
- [WhatsApp 表情回应级别](/zh-CN/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel`（默认值为 `minimal`）
- [Signal 表情回应](/zh-CN/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel`（默认值为 `minimal`）

## 相关内容

- [Agent 发送](/zh-CN/tools/agent-send) - 包含 `react` 的 `message` 工具
- [渠道](/zh-CN/channels) - 渠道专属配置
