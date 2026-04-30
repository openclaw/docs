---
read_when:
    - 在任何通道中處理表情回應
    - 了解表情符號反應在不同平台之間的差異
summary: 所有支援通道的反應工具語意
title: 回應
x-i18n:
    generated_at: "2026-04-30T03:47:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

代理程式可以使用 `message` 工具搭配 `react` 動作，在訊息上新增與移除表情符號反應。反應行為會依頻道與傳輸方式而異。

## 運作方式

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 新增反應時必須提供 `emoji`。
- 將 `emoji` 設為空字串 (`""`) 以移除機器人的反應。
- 設定 `remove: true` 以移除特定表情符號（需要非空的 `emoji`）。

## 頻道行為

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 空的 `emoji` 會移除訊息上機器人的所有反應。
    - `remove: true` 只會移除指定的表情符號。

  </Accordion>

  <Accordion title="Google Chat">
    - 空的 `emoji` 會移除訊息上應用程式的反應。
    - `remove: true` 只會移除指定的表情符號。

  </Accordion>

  <Accordion title="Telegram">
    - 空的 `emoji` 會移除機器人的反應。
    - `remove: true` 也會移除反應，但工具驗證仍需要非空的 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空的 `emoji` 會移除機器人反應。
    - `remove: true` 會在內部對應為空表情符號（工具呼叫中仍需要 `emoji`）。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 需要非空的 `emoji`。
    - `remove: true` 會移除該特定表情符號反應。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用 `feishu_reaction` 工具，搭配 `add`、`remove` 和 `list` 動作。
    - 新增/移除需要 `emoji_type`；移除還需要 `reaction_id`。

  </Accordion>

  <Accordion title="Signal">
    - 傳入反應通知由 `channels.signal.reactionNotifications` 控制：`"off"` 會停用通知，`"own"`（預設）會在使用者對機器人訊息做出反應時發出事件，而 `"all"` 會針對所有反應發出事件。

  </Accordion>
</AccordionGroup>

## 反應層級

各頻道的 `reactionLevel` 設定會控制代理程式使用反應的廣泛程度。值通常為 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram reactionLevel](/zh-TW/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/zh-TW/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

在個別頻道上設定 `reactionLevel`，以調整代理程式在各平台上對訊息做出反應的活躍程度。

## 相關

- [代理程式傳送](/zh-TW/tools/agent-send) — 包含 `react` 的 `message` 工具
- [頻道](/zh-TW/channels) — 頻道專屬設定
