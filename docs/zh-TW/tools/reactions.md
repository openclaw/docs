---
read_when:
    - 在任何頻道中使用表情回應
    - 瞭解表情符號回應在不同平台上的差異
summary: 所有支援頻道中的回應工具語意
title: 表情回應
x-i18n:
    generated_at: "2026-07-12T14:52:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

代理程式使用 `message` 工具的 `react` 動作新增及移除表情符號回應。行為會因頻道而異。

## 運作方式

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 新增回應時，必須提供 `emoji`。
- 將 `emoji` 設為空字串 (`""`)，即可在支援此功能的頻道上移除機器人的回應。
- 設定 `remove: true` 可移除一個特定表情符號（`emoji` 不得為空）。
- 在支援狀態回應的頻道中，對回應設定 `trackToolCalls: true`，可讓執行階段在同一輪後續的工具進度回應中，重複使用該則已加上回應的訊息。

## 頻道行為

<AccordionGroup>
  <Accordion title="Discord 和 Slack">
    - 空白的 `emoji` 會移除機器人在該訊息上的所有回應。
    - `remove: true` 只會移除指定的表情符號。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - 僅支援新增回應：必須提供 `emoji`，且不得為空。
    - 移除回應目前尚未連接至刪除呼叫；`remove: true` 會傳回明確錯誤，而不會無聲地略過操作。
    - Talk 機器人必須註冊 `reaction` 功能（請參閱 [Nextcloud Talk 頻道文件](/zh-TW/channels/nextcloud-talk)）。

  </Accordion>

  <Accordion title="Telegram">
    - 空白的 `emoji` 會移除機器人的回應。
    - `remove: true` 也會移除回應，但工具驗證仍要求提供非空白的 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空白的 `emoji` 會移除機器人回應。
    - `remove: true` 會在內部對應至空白表情符號（工具呼叫中仍必須提供 `emoji`）。
    - WhatsApp 的每則訊息只有一個機器人回應欄位；傳送新回應時會取代原有回應，而不會堆疊多個表情符號。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 新增和移除時都必須提供非空白的 `emoji`。
    - `remove: true` 會移除該特定表情符號回應。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用與其他頻道相同的 `react` 動作（透過訊息回應 ID 新增、移除及列出），而非獨立工具。
    - 新增時必須提供非空白的 `emoji`（會對應至 Feishu 的 `emoji_type`，例如 `SMILE`、`THUMBSUP`、`HEART`）。
    - `remove: true` 必須搭配非空白的 `emoji`，並會移除符合該表情符號類型、由機器人自身新增的回應。
    - 空白的 `emoji` 搭配 `clearAll: true`，會移除機器人在該訊息上的所有回應。

  </Accordion>

  <Accordion title="Signal">
    - 傳入回應通知由 `channels.signal.reactionNotifications` 控制：`"off"` 會停用通知；`"own"`（預設值）會在使用者對機器人訊息做出回應時發出事件；`"all"` 會針對所有回應發出事件；`"allowlist"` 則只會針對 `channels.signal.reactionAllowlist` 中的傳送者發出事件。

  </Accordion>

  <Accordion title="iMessage">
    - 傳出回應使用 iMessage 點按回應（`love`、`like`、`dislike`、`laugh`、`emphasize` 及 `question`）；若要新增回應，`emoji` 必須能對應至其中一種類型。
    - 若 `remove: true` 未搭配可辨識的點按回應類型，會移除所有點按回應類型；若搭配可辨識的類型，則只會移除該類型。

  </Accordion>
</AccordionGroup>

## 回應層級

各頻道的 `reactionLevel` 會限制代理程式傳送自身回應的頻率。可用值：`off`、`ack`、`minimal` 或 `extensive`。

- [Telegram 回應通知](/zh-TW/channels/telegram#feature-reference) - `channels.telegram.reactionLevel`（預設為 `minimal`）
- [WhatsApp 回應層級](/zh-TW/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel`（預設為 `minimal`）
- [Signal 回應](/zh-TW/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel`（預設為 `minimal`）

## 相關內容

- [代理程式傳送](/zh-TW/tools/agent-send) - 包含 `react` 的 `message` 工具
- [頻道](/zh-TW/channels) - 各頻道專屬設定
