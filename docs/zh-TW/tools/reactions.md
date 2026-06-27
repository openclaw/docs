---
read_when:
    - 在任何頻道中使用反應
    - 了解表情符號回應在各平台之間的差異
summary: 所有支援通道的反應工具語意
title: 回應
x-i18n:
    generated_at: "2026-06-27T20:09:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

代理程式可以使用帶有 `react` 動作的 `message`
工具，在訊息上新增與移除表情符號反應。反應行為會依通道和傳輸方式而有所不同。

## 運作方式

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 新增反應時需要 `emoji`。
- 將 `emoji` 設為空字串 (`""`) 可移除機器人的反應。
- 設定 `remove: true` 可移除特定表情符號（需要非空的 `emoji`）。
- 在支援狀態反應的通道上，反應中的 `trackToolCalls: true` 可讓執行階段在同一輪中，使用該已反應的訊息來顯示後續工具進度反應。

## 通道行為

<AccordionGroup>
  <Accordion title="Discord 與 Slack">
    - 空的 `emoji` 會移除機器人在該訊息上的所有反應。
    - `remove: true` 只會移除指定的表情符號。

  </Accordion>

  <Accordion title="Google Chat">
    - 空的 `emoji` 會移除應用程式在該訊息上的反應。
    - `remove: true` 只會移除指定的表情符號。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - 僅能新增反應：`emoji` 為必填且不可為空。
    - 尚不支援移除反應；帶有 `remove: true`（或空 `emoji`）的呼叫會以明確錯誤拒絕，而不是靜默地不執行任何操作。
    - 需要將 Talk 機器人註冊為具備 `reaction` 功能（請參閱 [Nextcloud Talk 通道文件](/zh-TW/channels/nextcloud-talk)）。

  </Accordion>

  <Accordion title="Telegram">
    - 空的 `emoji` 會移除機器人的反應。
    - `remove: true` 也會移除反應，但工具驗證仍需要非空的 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空的 `emoji` 會移除機器人反應。
    - `remove: true` 會在內部對應到空表情符號（工具呼叫中仍需要 `emoji`）。
    - WhatsApp 每則訊息只有一個機器人反應槽；狀態反應更新會取代該槽，而不是堆疊多個表情符號。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 需要非空的 `emoji`。
    - `remove: true` 會移除該特定表情符號反應。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用帶有 `add`、`remove` 和 `list` 動作的 `feishu_reaction` 工具。
    - 新增/移除需要 `emoji_type`；移除也需要 `reaction_id`。

  </Accordion>

  <Accordion title="Signal">
    - 傳入反應通知由 `channels.signal.reactionNotifications` 控制：`"off"` 會停用通知，`"own"`（預設）會在使用者對機器人訊息做出反應時發出事件，而 `"all"` 會對所有反應發出事件。

  </Accordion>

  <Accordion title="iMessage">
    - 傳出反應是 iMessage tapback（`love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`）。
    - 傳入 tapback 通知由 `channels.imessage.reactionNotifications` 控制：`"off"` 會停用通知，`"own"`（預設）會在使用者對機器人撰寫的訊息做出反應時發出事件，而 `"all"` 會對授權寄件者的所有 tapback 發出事件。

  </Accordion>
</AccordionGroup>

## 反應等級

每個通道的 `reactionLevel` 設定會控制代理程式使用反應的範圍。值通常是 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram reactionLevel](/zh-TW/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/zh-TW/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

在個別通道上設定 `reactionLevel`，以調整代理程式在各平台上對訊息做出反應的活躍程度。

## 相關

- [代理程式傳送](/zh-TW/tools/agent-send) — 包含 `react` 的 `message` 工具
- [通道](/zh-TW/channels) — 通道專屬設定
