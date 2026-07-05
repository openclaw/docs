---
read_when:
    - 特別設定 WhatsApp 群組
    - 變更 WhatsApp 啟用模式（`mention` 與 `always`）
    - 調整 WhatsApp 群組工作階段金鑰或待處理訊息情境
sidebarTitle: WhatsApp groups
summary: WhatsApp 群組訊息處理 — 啟用、允許清單、工作階段與脈絡注入
title: WhatsApp 群組訊息
x-i18n:
    generated_at: "2026-07-05T11:01:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdc16719e33ed5532e9bc11b195fa1b2d79910ae476d8201adcc9507bbfa1b29
    source_path: channels/group-messages.md
    workflow: 16
---

對於跨頻道群組模型（Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp、Zalo），請參閱 [群組](/zh-TW/channels/groups)。本頁說明該模型之上的 WhatsApp 專屬行為：啟用、群組允許清單、每個群組的工作階段金鑰，以及待處理訊息的脈絡注入。

目標：讓 OpenClaw 留在 WhatsApp 群組中，只在被呼叫時醒來，並讓該對話串與個人私訊工作階段分開。

<Note>
`agents.list[].groupChat.mentionPatterns` 會與其他頻道的提及閘控共用。若是多代理設定，請按代理設定，或使用 `messages.groupChat.mentionPatterns` 作為全域備援。兩者都未設定時，模式會從代理身分名稱/表情符號衍生。
</Note>

## 行為

- 啟用模式：`mention`（預設）或 `always`。`mention` 需要呼叫：真正的 WhatsApp @提及（`mentionedJids`）、已設定的 regex 模式、文字中任何位置出現機器人的 E.164 數字，或引用回覆機器人的其中一則訊息（共用號碼自聊設定除外）。`always` 會在每則訊息喚醒代理，但注入的群組提示會告訴它只有在能增加價值時才回覆，否則回傳完全相同的靜默 token `NO_REPLY`（不區分大小寫）。預設值來自設定（`channels.whatsapp.groups` `requireMention`），並可透過 `/activation` 按群組覆寫。
- 群組允許清單：設定 `channels.whatsapp.groups` 時，只允許列出的群組 JID（包含 `"*"` 可允許所有群組）；未列出的群組訊息會被捨棄，並留下日誌提示。
- 群組政策：`channels.whatsapp.groupPolicy` 控制是否接受群組訊息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（備援：明確的 `channels.whatsapp.allowFrom`）。預設為 `allowlist`（在你新增寄件者之前會封鎖）。
- 每個群組的工作階段：工作階段金鑰看起來像 `agent:<agentId>:whatsapp:group:<jid>`（非預設帳號會附加 `:thread:whatsapp-account-<accountId>`），因此像 `/verbose on`、`/trace on` 或 `/think high`（以獨立訊息傳送）的指令只會作用於該群組；個人私訊狀態不受影響。
- 脈絡注入：**僅待處理**且_未_觸發執行的群組訊息（預設 50 則）會加上前綴，放在 `[自你上次回覆以來的聊天訊息 - 作為脈絡]` 下方，而觸發行會放在 `[目前訊息 - 回應這則]` 下方。待處理視窗會在執行後清除；已在工作階段中的訊息不會重新注入。
- 寄件者歸因：每一行群組訊息都會在訊息封套內帶有寄件者標籤，例如 `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`，而寄件者身分以及群組主旨/成員會一起放在不受信任的對話中繼資料區塊中。
- 暫時性/檢視一次：包裝會先解除再擷取文字/提及，因此其中的呼叫仍會觸發。
- 群組系統提示：群組工作階段的第一輪（以及 `/activation` 變更模式後的任何一輪）會將啟用指引注入系統提示（`Activation: trigger-only ...` 或 `Activation: always-on ...`，加上「指定回應特定寄件者」）。持久的群組聊天投遞指引（「你正在 WhatsApp 群組聊天中...」）一律包含。

## 設定範例（WhatsApp）

即使 WhatsApp 從文字本文移除可視的 `@`，也讓顯示名稱呼叫可運作：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // pending group context window (default 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

注意：

- regex 不區分大小寫，並使用與其他設定 regex 表面相同的安全 regex 護欄；無效模式與不安全的巢狀重複會被忽略。
- 當有人點選聯絡人時，WhatsApp 仍會透過 `mentionedJids` 傳送標準提及，因此號碼備援很少需要，但它是有用的安全網。
- 待處理脈絡視窗解析順序為 `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50。

### 啟用命令（僅限擁有者）

使用群組聊天命令：

- `/activation mention`
- `/activation always`

只有擁有者號碼（來自 `channels.whatsapp.allowFrom`，或未設定時使用機器人自己的 E.164）可以變更此設定；其他人的 `/activation` 會被忽略，且只會儲存為脈絡。在群組中以獨立訊息傳送 `/status` 可查看目前的啟用模式。

## 使用方式

1. 將你的 WhatsApp 帳號（執行 OpenClaw 的帳號）加入群組。
2. 說 `@openclaw ...`（或包含號碼）。除非你設定 `groupPolicy: "open"`，否則只有列入允許清單的寄件者可以觸發它。
3. 代理提示會包含待處理群組脈絡與帶有寄件者標籤的行，因此它可以指定回應正確的人。
4. 工作階段指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）只會套用到該群組的工作階段；請以獨立訊息傳送，讓它們被登記。你的個人私訊工作階段會保持獨立。

## 測試 / 驗證

- 手動煙霧測試：
  - 在群組中傳送 `@openclaw` 呼叫，並確認回覆有提及寄件者名稱。
  - 傳送第二次呼叫，確認包含歷史記錄區塊，然後在下一輪被清除。
- 檢查閘道日誌（使用 `--verbose` 執行），尋找顯示 `from: <groupJid>` 和帶有寄件者標籤本文的 `inbound web message` 項目。

## 已知考量

- 心跳偵測會在代理的主要工作階段中執行；群組工作階段永遠不會收到心跳偵測執行。
- 回聲抑制會按工作階段記住合併提示（歷史記錄 + 目前訊息），因此機器人自己已投遞的訊息不會再次觸發；完全相同的重複批次可能會被視為回聲而略過。
- 工作階段儲存項目會在工作階段儲存區中顯示為 `agent:<agentId>:whatsapp:group:<jid>`（預設為 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少項目只表示該群組尚未觸發執行。
- 輸入指示器遵循 `session.typingMode` / `agents.defaults.typingMode`。當可見回覆選擇使用僅訊息工具模式時，預設會立即開始輸入，因此即使沒有自動發布最終回覆，群組成員也能看到代理正在工作。明確的輸入模式設定仍然優先。

## 相關

- [群組](/zh-TW/channels/groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [廣播群組](/zh-TW/channels/broadcast-groups)
