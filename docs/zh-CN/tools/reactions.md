---
read_when:
    - 处理任何渠道中的表情回应
    - 了解不同平台上的表情回应有何差异
summary: 所有支持渠道中的表情回应工具语义
title: 表情回应
x-i18n:
    generated_at: "2026-07-05T11:46:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bcffae5deb5525b7f38fe827cce7ab46b66f238512d063c4cda651378efd8a67
    source_path: tools/reactions.md
    workflow: 16
---

智能体使用 `message` 工具的 `react`
操作添加和移除 emoji 表情回应。行为因渠道而异。

## 工作方式

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 添加表情回应时需要 `emoji`。
- 将 `emoji` 设为空字符串（`""`），可在支持的渠道上移除 Bot 在该消息上的表情回应。
- 设置 `remove: true` 可移除一个特定 emoji（需要非空
  `emoji`）。
- 在带有状态表情回应的渠道上，对某个表情回应设置 `trackToolCalls: true`，可让运行时在同一轮次中复用该已回应的消息，用于后续工具进度表情回应。

## 渠道行为

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 空 `emoji` 会移除 Bot 在该消息上的所有表情回应。
    - `remove: true` 只会移除指定的 emoji。

  </Accordion>

  <Accordion title="Google Chat">
    - 空 `emoji`（或 `remove: true`）会移除 Bot 自己在该消息上的表情回应；设置 `emoji` 时会按它过滤。
    - `remove: true` 只会移除指定的 emoji。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - 仅支持添加表情回应：`emoji` 是必需的，且必须为非空。
    - 表情回应移除尚未接入删除调用；`remove: true` 会被显式错误拒绝，而不是静默无操作。
    - 需要注册了 `reaction` 功能的 Talk Bot（见 [Nextcloud Talk 渠道文档](/zh-CN/channels/nextcloud-talk)）。

  </Accordion>

  <Accordion title="Telegram">
    - 空 `emoji` 会移除 Bot 的表情回应。
    - `remove: true` 也会移除表情回应，但工具验证仍要求非空 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空 `emoji` 会移除 Bot 表情回应。
    - `remove: true` 会在内部映射为空 emoji（工具调用中仍需要 `emoji`）。
    - WhatsApp 每条消息只有一个 Bot 表情回应槽；发送新的表情回应会替换它，而不是叠加多个 emoji。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 添加和移除都需要非空 `emoji`。
    - `remove: true` 会移除该特定 emoji 表情回应。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用与其他渠道相同的 `react` 操作（通过消息表情回应 ID 添加、移除、列出），而不是单独的工具。
    - 添加时需要非空 `emoji`（映射到 Feishu `emoji_type`，例如 `SMILE`、`THUMBSUP`、`HEART`）。
    - `remove: true` 需要非空 `emoji`，并移除 Bot 自己与该 emoji 类型匹配的表情回应。
    - 带有 `clearAll: true` 的空 `emoji` 会移除 Bot 在该消息上的所有表情回应。

  </Accordion>

  <Accordion title="Signal">
    - 入站表情回应通知由 `channels.signal.reactionNotifications` 控制：`"off"` 会禁用它们，`"own"`（默认）会在用户回应 Bot 消息时发出事件，`"all"` 会为所有表情回应发出事件，`"allowlist"` 只会为 `channels.signal.reactionAllowlist` 中发送者的表情回应发出事件。

  </Accordion>

  <Accordion title="iMessage">
    - 出站表情回应是 iMessage tapback（`love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`）；`emoji` 必须映射到其中一种类型才能添加表情回应。
    - 没有可识别 tapback 类型的 `remove: true` 会移除所有 tapback 类型；带有可识别类型时，只会移除那一种。

  </Accordion>
</AccordionGroup>

## 表情回应级别

按渠道配置的 `reactionLevel` 会限制智能体发送自己表情回应的频率。取值：`off`、`ack`、`minimal` 或 `extensive`。

- [Telegram 表情回应通知](/zh-CN/channels/telegram#feature-reference) - `channels.telegram.reactionLevel`（默认 `minimal`）
- [WhatsApp 表情回应级别](/zh-CN/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel`（默认 `minimal`）
- [Signal 表情回应](/zh-CN/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel`（默认 `minimal`）

## 相关

- [Agent Send](/zh-CN/tools/agent-send) - 包含 `react` 的 `message` 工具
- [渠道](/zh-CN/channels) - 渠道专属配置
