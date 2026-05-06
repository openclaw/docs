---
read_when:
    - 針對 WhatsApp 群組進行設定
    - 變更 WhatsApp 啟用模式 (`mention` 與 `always`)
    - 調整 WhatsApp 群組工作階段金鑰或待處理訊息上下文
sidebarTitle: WhatsApp groups
summary: WhatsApp 群組訊息處理 — 啟用、允許清單、工作階段與情境注入
title: WhatsApp 群組訊息
x-i18n:
    generated_at: "2026-05-06T09:02:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 489f04ea9f4d0954f77eee4590d609383d5dc987eaaea5eb121b454620a2d0fe
    source_path: channels/group-messages.md
    workflow: 16
---

如需跨頻道群組模型（Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo），請參閱 [群組](/zh-TW/channels/groups)。本頁說明該模型之上的 WhatsApp 專屬行為：啟用、群組允許清單、每個群組的工作階段金鑰，以及待處理訊息的脈絡注入。

目標：讓 OpenClaw 留在 WhatsApp 群組中，只在被 ping 時喚醒，並將該執行緒與個人私訊工作階段分開。

<Note>
`agents.list[].groupChat.mentionPatterns` 也由 Telegram、Discord、Slack 和 iMessage 使用。對於多代理設定，請按代理設定，或使用 `messages.groupChat.mentionPatterns` 作為全域備援。
</Note>

## 行為

- 啟用模式：`mention`（預設）或 `always`。`mention` 需要一次 ping（透過 `mentionedJids` 的真實 WhatsApp @提及、安全的規則運算式模式，或文字中任何位置的機器人 E.164）。`always` 會在每則訊息喚醒代理，但只有在能提供有意義的價值時才應回覆；否則會傳回完全相同的靜默權杖 `NO_REPLY` / `no_reply`。預設值可在設定（`channels.whatsapp.groups`）中設定，並可透過 `/activation` 依群組覆寫。設定 `channels.whatsapp.groups` 時，它也會作為群組允許清單（包含 `"*"` 以允許所有群組）。
- 群組政策：`channels.whatsapp.groupPolicy` 控制是否接受群組訊息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（備援：明確的 `channels.whatsapp.allowFrom`）。預設為 `allowlist`（在你加入寄件者前會封鎖）。
- 每個群組的工作階段：工作階段金鑰看起來像 `agent:<agentId>:whatsapp:group:<jid>`，因此像 `/verbose on`、`/trace on` 或 `/think high`（作為獨立訊息傳送）這類命令會限定於該群組；個人私訊狀態不會受影響。群組執行緒會略過 Heartbeat。
- 脈絡注入：**僅待處理**的群組訊息（預設 50 則）若_未_觸發一次執行，會以 `[Chat messages since your last reply - for context]` 作為前綴，觸發行則放在 `[Current message - respond to this]` 之下。已在工作階段中的訊息不會重新注入。
- 寄件者顯示：每個群組批次現在都會以 `[from: Sender Name (+E164)]` 結尾，讓 Pi 知道是誰在說話。
- 限時/僅檢視一次：我們會先解開這些內容再擷取文字/提及，因此其中的 ping 仍會觸發。
- 群組系統提示：在群組工作階段的第一輪（以及每次 `/activation` 變更模式時），我們會將一小段說明注入系統提示，例如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` 如果無法取得中繼資料，我們仍會告知代理這是群組聊天。

## 設定範例（WhatsApp）

將 `groupChat` 區塊加入 `~/.openclaw/openclaw.json`，讓顯示名稱 ping 即使在 WhatsApp 從文字本文中移除視覺上的 `@` 時仍可運作：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

注意：

- 規則運算式不區分大小寫，並使用與其他設定規則運算式介面相同的安全規則運算式護欄；無效模式和不安全的巢狀重複會被忽略。
- 當有人點選聯絡人時，WhatsApp 仍會透過 `mentionedJids` 傳送標準提及，因此很少需要號碼備援，但它是一個實用的安全網。

### 啟用命令（僅擁有者）

使用群組聊天命令：

- `/activation mention`
- `/activation always`

只有擁有者號碼（來自 `channels.whatsapp.allowFrom`，或未設定時使用機器人自己的 E.164）可以變更此設定。在群組中將 `/status` 作為獨立訊息傳送，以查看目前的啟用模式。

## 使用方式

1. 將你的 WhatsApp 帳號（執行 OpenClaw 的帳號）加入群組。
2. 說 `@openclaw …`（或包含號碼）。除非你設定 `groupPolicy: "open"`，否則只有允許清單中的寄件者可以觸發它。
3. 代理提示會包含最近的群組脈絡，以及結尾的 `[from: …]` 標記，讓它可以回覆正確的人。
4. 工作階段層級指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）只會套用到該群組的工作階段；請將它們作為獨立訊息傳送，讓系統能註冊。你的個人私訊工作階段會保持獨立。

## 測試 / 驗證

- 手動煙霧測試：
  - 在群組中傳送 `@openclaw` ping，並確認回覆有提及寄件者名稱。
  - 傳送第二次 ping，並確認包含歷史區塊，然後在下一輪清除。
- 檢查 Gateway 記錄（使用 `--verbose` 執行），查看顯示 `from: <groupJid>` 和 `[from: …]` 後綴的 `inbound web message` 項目。

## 已知考量

- 群組會刻意略過 Heartbeat，以避免吵雜的廣播。
- 回聲抑制會使用合併後的批次字串；如果你在沒有提及的情況下傳送兩次相同文字，只有第一次會取得回應。
- 工作階段儲存項目會在工作階段儲存（預設為 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）中顯示為 `agent:<agentId>:whatsapp:group:<jid>`；缺少項目只表示該群組尚未觸發執行。
- 群組中的輸入指示器會遵循 `agents.defaults.typingMode`。當可見回覆使用預設的僅訊息工具模式時，輸入預設會立即開始，因此即使未發布自動最終回覆，群組成員也能看到代理正在工作。明確的輸入模式設定仍會優先。

## 相關

- [群組](/zh-TW/channels/groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [廣播群組](/zh-TW/channels/broadcast-groups)
