---
read_when:
    - 變更群組訊息規則或提及
summary: WhatsApp 群組訊息處理的行為與設定（mentionPatterns 會跨各介面共用）
title: 群組訊息
x-i18n:
    generated_at: "2026-04-30T02:46:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

目標：讓 Clawd 待在 WhatsApp 群組中，只在被 ping 時喚醒，並將該討論串與個人 DM 工作階段分開。

<Note>
`agents.list[].groupChat.mentionPatterns` 也會由 Telegram、Discord、Slack 和 iMessage 使用。本文件聚焦於 WhatsApp 專屬行為。對於多代理設定，請為每個代理設定 `agents.list[].groupChat.mentionPatterns`，或使用 `messages.groupChat.mentionPatterns` 作為全域後援。
</Note>

## 目前實作（2025-12-03）

- 啟用模式：`mention`（預設）或 `always`。`mention` 需要 ping（透過 `mentionedJids` 的真實 WhatsApp @提及、安全的 regex 模式，或文字中任何位置的機器人 E.164）。`always` 會在每則訊息喚醒代理，但只有在能提供有意義價值時才應回覆；否則會回傳精確的靜默權杖 `NO_REPLY` / `no_reply`。預設值可在設定（`channels.whatsapp.groups`）中設定，並可透過 `/activation` 針對每個群組覆寫。設定 `channels.whatsapp.groups` 時，它也會作為群組允許清單（包含 `"*"` 以允許全部）。
- 群組政策：`channels.whatsapp.groupPolicy` 控制是否接受群組訊息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（後援：明確的 `channels.whatsapp.allowFrom`）。預設為 `allowlist`（在你加入寄件者前會封鎖）。
- 每群組工作階段：工作階段鍵看起來像 `agent:<agentId>:whatsapp:group:<jid>`，因此像 `/verbose on`、`/trace on` 或 `/think high` 這類命令（以獨立訊息傳送）會限定於該群組；個人 DM 狀態不受影響。群組討論串會略過 Heartbeat。
- 脈絡注入：**僅待處理**的群組訊息（預設 50 則）若_未_觸發執行，會加上 `[Chat messages since your last reply - for context]` 前綴，觸發行則放在 `[Current message - respond to this]` 之下。已在工作階段中的訊息不會重新注入。
- 寄件者呈現：每個群組批次現在都會以 `[from: Sender Name (+E164)]` 結尾，讓 Pi 知道誰正在說話。
- 臨時／僅檢視一次：我們會先展開這些訊息再擷取文字／提及，因此其中的 ping 仍會觸發。
- 群組系統提示：在群組工作階段的第一輪（以及每次 `/activation` 變更模式時），我們會向系統提示注入一段簡短說明，例如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 如果無法取得中繼資料，我們仍會告知代理這是群組聊天。

## 設定範例（WhatsApp）

將 `groupChat` 區塊加入 `~/.openclaw/openclaw.json`，如此即使 WhatsApp 從文字本文中移除視覺上的 `@`，顯示名稱 ping 仍可運作：

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

注意事項：

- regex 不區分大小寫，並使用與其他設定 regex 介面相同的 safe-regex 防護措施；無效模式和不安全的巢狀重複會被忽略。
- 當有人點選聯絡人時，WhatsApp 仍會透過 `mentionedJids` 傳送標準提及，因此很少需要號碼後援，但它是有用的安全網。

### 啟用命令（僅限擁有者）

使用群組聊天命令：

- `/activation mention`
- `/activation always`

只有擁有者號碼（來自 `channels.whatsapp.allowFrom`，或未設定時為機器人自己的 E.164）可以變更此設定。在群組中以獨立訊息傳送 `/status`，即可查看目前的啟用模式。

## 使用方式

1. 將你的 WhatsApp 帳號（執行 OpenClaw 的那個）加入群組。
2. 說 `@openclaw …`（或包含該號碼）。除非你設定 `groupPolicy: "open"`，否則只有允許清單中的寄件者可以觸發它。
3. 代理提示會包含最近的群組脈絡，加上尾隨的 `[from: …]` 標記，讓它能對正確的人回應。
4. 工作階段層級指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）只會套用到該群組的工作階段；請將它們作為獨立訊息傳送，讓它們能被註冊。你的個人 DM 工作階段會保持獨立。

## 測試／驗證

- 手動煙霧測試：
  - 在群組中傳送 `@openclaw` ping，並確認回覆引用了寄件者名稱。
  - 傳送第二次 ping，並確認歷史區塊已包含其中，且在下一輪被清除。
- 檢查 Gateway 記錄（使用 `--verbose` 執行），查看顯示 `from: <groupJid>` 和 `[from: …]` 後綴的 `inbound web message` 項目。

## 已知考量

- 群組會刻意略過 Heartbeat，以避免吵雜的廣播。
- 回音抑制使用合併後的批次字串；如果你傳送兩次相同文字且沒有提及，只有第一次會收到回覆。
- 工作階段儲存項目會在工作階段儲存中顯示為 `agent:<agentId>:whatsapp:group:<jid>`（預設為 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少項目只代表該群組尚未觸發執行。
- 群組中的輸入指示器遵循 `agents.defaults.typingMode`。當可見回覆使用預設的僅訊息工具模式時，預設會立即開始輸入，因此即使沒有發佈自動最終回覆，群組成員也能看到代理正在工作。明確的輸入模式設定仍會優先。

## 相關

- [群組](/zh-TW/channels/groups)
- [通道路由](/zh-TW/channels/channel-routing)
- [廣播群組](/zh-TW/channels/broadcast-groups)
