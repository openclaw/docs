---
read_when:
    - 專門設定 WhatsApp 群組
    - 變更 WhatsApp 啟用模式（`mention` 與 `always`）
    - 調整 WhatsApp 群組工作階段金鑰或待處理訊息情境
sidebarTitle: WhatsApp groups
summary: WhatsApp 群組訊息處理 — 啟用、允許清單、工作階段與脈絡注入
title: WhatsApp 群組訊息
x-i18n:
    generated_at: "2026-06-27T18:55:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

針對跨頻道群組模型（Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo），請參閱[群組](/zh-TW/channels/groups)。本頁涵蓋該模型之上的 WhatsApp 專屬行為：啟用、群組允許清單、每個群組的工作階段金鑰，以及待處理訊息的情境注入。

目標：讓 OpenClaw 位於 WhatsApp 群組中，只在被提及時喚醒，並讓該對話串與個人私訊工作階段分開。

<Note>
`agents.list[].groupChat.mentionPatterns` 也由 Telegram、Discord、Slack 和 iMessage 使用。若是多代理設定，請為每個代理設定，或使用 `messages.groupChat.mentionPatterns` 作為全域備援。
</Note>

## 行為

- 啟用模式：`mention`（預設）或 `always`。`mention` 需要一次提及（透過 `mentionedJids` 的真實 WhatsApp @ 提及、安全的正規表示式模式，或機器人的 E.164 出現在文字中的任何位置）。`always` 會在每則訊息喚醒代理，但它應只在能提供有意義價值時回覆；否則會回傳精確的靜默權杖 `NO_REPLY` / `no_reply`。預設值可在設定（`channels.whatsapp.groups`）中設定，並可透過 `/activation` 針對每個群組覆寫。設定 `channels.whatsapp.groups` 時，它也會作為群組允許清單（包含 `"*"` 以允許全部）。
- 群組政策：`channels.whatsapp.groupPolicy` 控制是否接受群組訊息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（備援：明確的 `channels.whatsapp.allowFrom`）。預設為 `allowlist`（封鎖，直到你新增寄件者）。
- 每個群組的工作階段：工作階段金鑰格式為 `agent:<agentId>:whatsapp:group:<jid>`，因此像 `/verbose on`、`/trace on` 或 `/think high`（作為獨立訊息傳送）等命令會限定於該群組；個人私訊狀態不受影響。群組對話串會略過心跳偵測。
- 情境注入：**僅限待處理**的群組訊息（預設 50 則）若_未_觸發執行，會加上 `[Chat messages since your last reply - for context]` 前置標記，觸發行則位於 `[Current message - respond to this]` 下。已在工作階段中的訊息不會重新注入。
- 顯示寄件者：每個群組批次現在都會以 `[from: Sender Name (+E164)]` 結尾，讓 OpenClaw 知道誰正在發言。
- 暫時性／閱後即焚：我們會先解開這些訊息再擷取文字／提及，因此其中的提及仍會觸發。
- 群組系統提示：在群組工作階段的第一輪（以及每次 `/activation` 變更模式時），我們會將簡短說明注入系統提示，例如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` 如果無法取得中繼資料，我們仍會告訴代理這是群組聊天。

## 設定範例（WhatsApp）

將 `groupChat` 區塊新增到 `~/.openclaw/openclaw.json`，讓顯示名稱提及即使在 WhatsApp 從文字本文移除視覺上的 `@` 時仍能運作：

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

- 正規表示式不區分大小寫，並使用與其他設定正規表示式介面相同的安全正規表示式防護；無效模式和不安全的巢狀重複會被忽略。
- 當有人點選聯絡人時，WhatsApp 仍會透過 `mentionedJids` 傳送標準提及，因此數字備援很少需要，但它是有用的安全網。

### 啟用命令（僅限擁有者）

使用群組聊天命令：

- `/activation mention`
- `/activation always`

只有擁有者號碼（來自 `channels.whatsapp.allowFrom`，或未設定時使用機器人自己的 E.164）可以變更此設定。在群組中將 `/status` 作為獨立訊息傳送，即可查看目前的啟用模式。

## 使用方式

1. 將你的 WhatsApp 帳號（執行 OpenClaw 的那個帳號）加入群組。
2. 說 `@openclaw …`（或包含號碼）。除非你設定 `groupPolicy: "open"`，否則只有允許清單中的寄件者可以觸發它。
3. 代理提示會包含最近的群組情境，加上尾端的 `[from: …]` 標記，讓它能對正確的人回應。
4. 工作階段層級指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）只會套用到該群組的工作階段；請將它們作為獨立訊息傳送，讓它們能被登錄。你的個人私訊工作階段仍保持獨立。

## 測試／驗證

- 手動煙霧測試：
  - 在群組中傳送 `@openclaw` 提及，並確認回覆引用了寄件者名稱。
  - 傳送第二次提及，並驗證歷史區塊已包含，且會在下一輪清除。
- 檢查閘道日誌（使用 `--verbose` 執行），查看顯示 `from: <groupJid>` 和 `[from: …]` 後綴的 `inbound web message` 項目。

## 已知考量

- 群組會刻意略過心跳偵測，以避免嘈雜的廣播。
- 回音抑制使用合併後的批次字串；如果你傳送兩次相同文字且沒有提及，只有第一次會取得回應。
- 工作階段儲存項目會以 `agent:<agentId>:whatsapp:group:<jid>` 出現在工作階段儲存中（預設為 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少項目只表示該群組尚未觸發執行。
- 群組中的輸入指示器會遵循 `agents.defaults.typingMode`。當可見回覆選擇使用僅訊息工具模式時，預設會立即開始顯示輸入中，讓群組成員即使沒有發出自動最終回覆，也能看到代理正在工作。明確的輸入模式設定仍會優先。

## 相關

- [群組](/zh-TW/channels/groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [廣播群組](/zh-TW/channels/broadcast-groups)
