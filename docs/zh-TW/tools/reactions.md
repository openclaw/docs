---
read_when:
    - 任何頻道中的回應處理
    - 了解表情符號回應在各平台間有何差異
summary: 所有支援通道的反應工具語義
title: 回應
x-i18n:
    generated_at: "2026-07-05T11:51:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bcffae5deb5525b7f38fe827cce7ab46b66f238512d063c4cda651378efd8a67
    source_path: tools/reactions.md
    workflow: 16
---

代理會使用 `message` 工具的 `react`
動作新增和移除 emoji 反應。行為會因頻道而異。

## 運作方式

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 新增反應時必須提供 `emoji`。
- 在支援的頻道上，將 `emoji` 設為空字串（`""`）可移除 Bot 的反應。
- 設定 `remove: true` 可移除一個特定 emoji（需要非空的
  `emoji`）。
- 在有狀態反應的頻道上，反應中的 `trackToolCalls: true` 會讓
  runtime 在同一回合後續工具進度反應中重複使用該已反應的訊息。

## 頻道行為

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 空的 `emoji` 會移除該訊息上 Bot 的所有反應。
    - `remove: true` 只會移除指定的 emoji。

  </Accordion>

  <Accordion title="Google Chat">
    - 空的 `emoji`（或 `remove: true`）會移除該訊息上 Bot 自己的反應；若已設定 `emoji`，則篩選為該 `emoji`。
    - `remove: true` 只會移除指定的 emoji。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - 僅限新增反應：必須提供 `emoji`，且不得為空。
    - 反應移除尚未接上刪除呼叫；`remove: true` 會以明確錯誤拒絕，而不是靜默地不執行任何動作。
    - 需要 Talk Bot 註冊 `reaction` 功能（請參閱 [Nextcloud Talk 頻道文件](/zh-TW/channels/nextcloud-talk)）。

  </Accordion>

  <Accordion title="Telegram">
    - 空的 `emoji` 會移除 Bot 的反應。
    - `remove: true` 也會移除反應，但為了工具驗證仍需要非空的 `emoji`。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空的 `emoji` 會移除 Bot 反應。
    - `remove: true` 會在內部對應為空 emoji（工具呼叫中仍需要 `emoji`）。
    - WhatsApp 每則訊息有一個 Bot 反應槽；傳送新的反應會取代它，而不是堆疊多個 emoji。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 新增和移除都需要非空的 `emoji`。
    - `remove: true` 會移除該特定 emoji 反應。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用與其他頻道相同的 `react` 動作（透過訊息反應 ID 新增/移除/列出），而不是另一個工具。
    - 新增需要非空的 `emoji`（對應到 Feishu `emoji_type`，例如 `SMILE`、`THUMBSUP`、`HEART`）。
    - `remove: true` 需要非空的 `emoji`，並移除符合該 emoji 類型的 Bot 自己的反應。
    - 空的 `emoji` 搭配 `clearAll: true` 會移除該訊息上 Bot 的所有反應。

  </Accordion>

  <Accordion title="Signal">
    - 入站反應通知由 `channels.signal.reactionNotifications` 控制：`"off"` 會停用；`"own"`（預設）會在使用者對 Bot 訊息作出反應時發出事件；`"all"` 會對所有反應發出事件；`"allowlist"` 只會針對 `channels.signal.reactionAllowlist` 中的傳送者發出事件。

  </Accordion>

  <Accordion title="iMessage">
    - 出站反應是 iMessage tapback（`love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`）；`emoji` 必須對應到其中一種，才能新增反應。
    - 沒有可辨識 tapback 種類的 `remove: true` 會移除所有 tapback 種類；有可辨識種類時，則只移除該一種。

  </Accordion>
</AccordionGroup>

## 反應等級

各頻道的 `reactionLevel` 會限制代理傳送自己反應的頻率。值：`off`、`ack`、`minimal` 或 `extensive`。

- [Telegram 反應通知](/zh-TW/channels/telegram#feature-reference) - `channels.telegram.reactionLevel`（預設 `minimal`）
- [WhatsApp 反應等級](/zh-TW/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel`（預設 `minimal`）
- [Signal 反應](/zh-TW/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel`（預設 `minimal`）

## 相關

- [代理傳送](/zh-TW/tools/agent-send) - 包含 `react` 的 `message` 工具
- [頻道](/zh-TW/channels) - 頻道特定設定
