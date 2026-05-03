---
read_when:
    - 在任何頻道中處理回應
    - 了解表情符號回應在不同平台上的差異
summary: 所有支援頻道中的反應工具語意
title: 表情回應
x-i18n:
    generated_at: "2026-05-03T21:44:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

代理程式可以使用 `message` 工具搭配 `react` 動作，在訊息上新增和移除表情符號反應。反應行為會依頻道和傳輸方式而異。

## 運作方式

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 新增反應時必須提供 `emoji`。
- 將 `emoji` 設為空字串 (`""`) 可移除機器人的反應。
- 設定 `remove: true` 可移除特定表情符號（需要非空的 `emoji`）。
- 在支援狀態反應的頻道上，反應中的 `trackToolCalls: true` 讓執行階段在同一回合中，使用該已反應的訊息來顯示後續工具進度反應。

## 頻道行為

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 空的 `emoji` 會移除機器人在該訊息上的所有反應。
    - `remove: true` 只會移除指定的表情符號。

  </Accordion>

  <Accordion title="Google Chat">
    - 空的 `emoji` 會移除應用程式在該訊息上的反應。
    - `remove: true` 只會移除指定的表情符號。

  </Accordion>

  <Accordion title="Telegram">
    - 空的 `emoji` 會移除機器人的反應。
    - `remove: true` 也會移除反應，但工具驗證仍需要非空的 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空的 `emoji` 會移除機器人反應。
    - `remove: true` 會在內部對應到空表情符號（工具呼叫中仍需要 `emoji`）。

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

每個頻道的 `reactionLevel` 設定會控制代理程式使用反應的廣泛程度。值通常是 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram reactionLevel](/zh-TW/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/zh-TW/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

在個別頻道上設定 `reactionLevel`，以調整代理程式在各平台上對訊息做出反應的活躍程度。

## 相關內容

- [Agent Send](/zh-TW/tools/agent-send) — 包含 `react` 的 `message` 工具
- [Channels](/zh-TW/channels) — 頻道特定設定
