---
read_when:
    - 專門設定 WhatsApp 群組
    - 變更 WhatsApp 啟用模式 (`mention` 與 `always`)
    - 調整 WhatsApp 群組工作階段金鑰或待處理訊息上下文
sidebarTitle: WhatsApp groups
summary: WhatsApp 群組訊息處理 — 啟用、允許清單、工作階段與上下文注入
title: WhatsApp 群組訊息
x-i18n:
    generated_at: "2026-05-06T02:44:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fa520f0722d804bba253c9ad72d821234d4a27801badb0d7d4c2ca3ea51bec9
    source_path: channels/group-messages.md
    workflow: 16
---

對於跨頻道群組模型（Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo），請參閱 [群組](/zh-TW/channels/groups)。本頁說明在該模型之上的 WhatsApp 專屬行為：啟用、群組允許清單、每個群組的工作階段金鑰，以及待處理訊息的情境注入。

目標：讓 OpenClaw 留在 WhatsApp 群組中，只在被 ping 時喚醒，並將該對話串與個人私訊工作階段分開。

<Note>
`agents.list[].groupChat.mentionPatterns` 也會由 Telegram、Discord、Slack 和 iMessage 使用。若是多代理設定，請按代理設定，或使用 `messages.groupChat.mentionPatterns` 作為全域後備。
</Note>

## 行為

- 啟用模式：`mention`（預設）或 `always`。`mention` 需要 ping（透過 `mentionedJids` 的真實 WhatsApp @ 提及、安全的 regex 模式，或文字中任意位置的機器人 E.164）。`always` 會在每則訊息喚醒代理，但只有在能提供有意義價值時才應回覆；否則會傳回精確的靜默權杖 `NO_REPLY` / `no_reply`。預設值可在設定（`channels.whatsapp.groups`）中設定，並可透過 `/activation` 依群組覆寫。設定 `channels.whatsapp.groups` 時，它也會作為群組允許清單（包含 `"*"` 以允許全部）。
- 群組政策：`channels.whatsapp.groupPolicy` 控制是否接受群組訊息（`open|disabled|allowlist`）。`allowlist` 會使用 `channels.whatsapp.groupAllowFrom`（後備：明確的 `channels.whatsapp.allowFrom`）。預設為 `allowlist`（在你新增傳送者之前會封鎖）。
- 每個群組的工作階段：工作階段金鑰看起來像 `agent:<agentId>:whatsapp:group:<jid>`，因此像 `/verbose on`、`/trace on` 或 `/think high` 這類指令（以獨立訊息傳送）會限定於該群組；個人私訊狀態不受影響。群組對話串會略過 Heartbeat。
- 情境注入：**僅待處理**的群組訊息（預設 50 則）中，_沒有_觸發執行的訊息會加上 `[Chat messages since your last reply - for context]` 前綴，而觸發行會放在 `[Current message - respond to this]` 下方。已在工作階段中的訊息不會再次注入。
- 傳送者呈現：每個群組批次現在都會以 `[from: Sender Name (+E164)]` 結尾，讓 Pi 知道誰正在說話。
- 臨時/檢視一次：我們會先展開這些內容再擷取文字/提及，因此其中的 ping 仍會觸發。
- 群組系統提示：在群組工作階段的第一輪（以及每當 `/activation` 變更模式時），我們會把一段簡短說明注入系統提示，例如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 如果無法取得中繼資料，我們仍會告訴代理這是群組聊天。

## 設定範例（WhatsApp）

在 `~/.openclaw/openclaw.json` 加入 `groupChat` 區塊，讓顯示名稱 ping 即使在 WhatsApp 從文字本文中移除可見的 `@` 時也能運作：

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

- regex 不分大小寫，並使用與其他設定 regex 表面相同的安全 regex 防護；無效模式與不安全的巢狀重複會被忽略。
- 當有人點選聯絡人時，WhatsApp 仍會透過 `mentionedJids` 傳送標準提及，因此數字後備很少需要，但它是有用的安全網。

### 啟用指令（僅限擁有者）

使用群組聊天指令：

- `/activation mention`
- `/activation always`

只有擁有者號碼（來自 `channels.whatsapp.allowFrom`，或未設定時機器人自己的 E.164）可以變更此設定。在群組中以獨立訊息傳送 `/status`，即可查看目前的啟用模式。

## 使用方式

1. 將你的 WhatsApp 帳號（執行 OpenClaw 的那個帳號）加入群組。
2. 說 `@openclaw …`（或包含號碼）。除非你設定 `groupPolicy: "open"`，否則只有允許清單中的傳送者可以觸發它。
3. 代理提示會包含近期群組情境加上尾端的 `[from: …]` 標記，讓它能對正確的人回應。
4. 工作階段層級指示（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）只會套用到該群組的工作階段；請將它們作為獨立訊息傳送，讓系統能註冊。你的個人私訊工作階段仍保持獨立。

## 測試 / 驗證

- 手動煙霧測試：
  - 在群組中傳送 `@openclaw` ping，並確認回覆有提到傳送者名稱。
  - 傳送第二次 ping，並驗證歷程區塊已包含其中，且在下一輪後清除。
- 檢查 Gateway 記錄（使用 `--verbose` 執行），查看顯示 `from: <groupJid>` 和 `[from: …]` 後綴的 `inbound web message` 項目。

## 已知注意事項

- 群組會刻意略過 Heartbeat，以避免嘈雜的廣播。
- 回音抑制使用合併後的批次字串；如果你在沒有提及的情況下連續兩次傳送相同文字，只有第一次會收到回應。
- 工作階段儲存項目會在工作階段儲存區中顯示為 `agent:<agentId>:whatsapp:group:<jid>`（預設為 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少項目只表示該群組尚未觸發執行。
- 群組中的輸入指示器遵循 `agents.defaults.typingMode`。當可見回覆使用預設的僅訊息工具模式時，輸入預設會立即開始，讓群組成員即使沒有發布自動最終回覆，也能看到代理正在工作。明確的輸入模式設定仍然優先。

## 相關

- [群組](/zh-TW/channels/groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [廣播群組](/zh-TW/channels/broadcast-groups)
