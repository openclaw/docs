---
read_when:
    - 專門設定 WhatsApp 群組
    - 變更 WhatsApp 啟用模式（`mention` 與 `always`）
    - 調整 WhatsApp 群組工作階段金鑰或待處理訊息的上下文
sidebarTitle: WhatsApp groups
summary: WhatsApp 群組訊息處理 — 啟用、允許清單、工作階段與情境注入
title: WhatsApp 群組訊息
x-i18n:
    generated_at: "2026-07-22T10:25:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7325dd3ae64d7abca8c1de0504f294ae280394fa5dd336d2532c5eaefcb03828
    source_path: channels/group-messages.md
    workflow: 16
---

就跨頻道群組模型（Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp、Zalo）而言，請參閱[群組](/zh-TW/channels/groups)。本頁說明此模型之上的 WhatsApp 特有行為：啟用方式、群組允許清單、各群組工作階段金鑰，以及待處理訊息的情境注入。

目標：讓 OpenClaw 留在 WhatsApp 群組中，僅在被點名時喚醒，並讓該對話串與個人私訊工作階段分開。

<Note>
`agents.entries.*.groupChat.mentionPatterns` 與其他頻道共用相同的提及閘控。若是多代理程式設定，請為每個代理程式分別設定，或使用 `messages.groupChat.mentionPatterns` 作為全域備援。若兩者皆未設定，系統會根據代理程式身分的名稱／表情符號衍生比對模式。
</Note>

## 行為

- 啟用模式：`mention`（預設）或 `always`。`mention` 需要有人點名：真正的 WhatsApp @提及（`mentionedJids`）、已設定的規則運算式模式、文字中任何位置出現機器人的 E.164 號碼，或引用回覆機器人的其中一則訊息（共用號碼的自己與自己聊天設定除外）。`always` 會在每則訊息送達時喚醒代理程式，但注入的群組提示會要求它僅在能提供價值時回覆，否則傳回完全相同的靜默權杖 `NO_REPLY`（不區分大小寫）。預設值來自設定（`channels.whatsapp.groups` `requireMention`），並可透過 `/activation` 為各群組覆寫。
- 群組允許清單：設定 `channels.whatsapp.groups` 後，只允許清單中的群組 JID（加入 `"*"` 即可允許全部）；未列出的群組訊息會被捨棄，並在記錄中留下提示。
- 群組政策：`channels.whatsapp.groupPolicy` 控制是否接受群組訊息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（備援：明確設定的 `channels.whatsapp.allowFrom`）。預設為 `allowlist`（在加入傳送者前皆會封鎖）。
- 各群組工作階段：工作階段金鑰的格式類似 `agent:<agentId>:whatsapp:group:<jid>`（非預設帳號會附加 `:thread:whatsapp-account-<accountId>`），因此 `/verbose on`、`/trace on` 或 `/think high` 等指令（以獨立訊息傳送）僅作用於該群組；個人私訊狀態不受影響。
- 情境注入：**僅限待處理**且_未_觸發執行的群組訊息（預設 50 則）會加上 `[Chat messages since your last reply - for context]` 前綴，觸發訊息所在行則位於 `[Current message - respond to this]` 下。執行後會清除待處理視窗；已存在於工作階段中的訊息不會再次注入。
- 傳送者歸屬：每一行群組訊息都會在訊息信封中包含傳送者標籤，例如 `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`；傳送者身分、群組主旨及成員資訊也會一併放入不受信任的對話中繼資料區塊。
- 限時／僅能檢視一次：系統會先解除包裝再擷取文字／提及，因此其中的點名仍可觸發。
- 群組系統提示：群組工作階段的第一輪（以及 `/activation` 變更模式後的任何一輪）會將啟用指引注入系統提示（`Activation: trigger-only ...` 或 `Activation: always-on ...`，另加「針對特定傳送者回覆」）。系統一律會包含持續性的群組聊天傳遞指引（「你正在 WhatsApp 群組聊天中……」）。

## 設定範例（WhatsApp）

即使 WhatsApp 從文字本文移除顯示用的 `@`，仍可讓顯示名稱點名正常運作：

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
    entries: {
      main: {
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    },
  },
}
```

注意事項：

- 規則運算式不區分大小寫，並採用與其他設定規則運算式介面相同的安全防護；無效模式及不安全的巢狀重複會被忽略。
- 當有人輕觸聯絡人時，WhatsApp 仍會透過 `mentionedJids` 傳送標準提及，因此很少需要使用號碼備援，但它仍是實用的安全網。
- 待處理情境視窗的解析順序為 `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50。

### 啟用命令（僅限擁有者）

使用群組聊天命令：

- `/activation mention`
- `/activation always`

只有擁有者號碼（來自 `channels.whatsapp.allowFrom`；若未設定，則使用機器人自己的 E.164 號碼）可以變更此設定；其他人傳送的 `/activation` 會被忽略，且僅儲存為情境。在群組中將 `/status` 作為獨立訊息傳送，即可查看目前的啟用模式。

## 使用方式

1. 將你的 WhatsApp 帳號（執行 OpenClaw 的帳號）加入群組。
2. 傳送 `@openclaw ...`（或包含該號碼）。除非設定 `groupPolicy: "open"`，否則只有允許清單中的傳送者可以觸發。
3. 代理程式提示會包含待處理的群組情境及帶有傳送者標籤的訊息行，讓代理程式能針對正確的人回覆。
4. 工作階段指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）僅套用至該群組的工作階段；請將它們作為獨立訊息傳送，使其生效。你的個人私訊工作階段會保持獨立。

## 測試／驗證

- 手動冒煙測試：
  - 在群組中傳送 `@openclaw` 點名，並確認回覆有提及傳送者名稱。
  - 再次點名，確認其中包含歷史記錄區塊，然後驗證該區塊在下一輪已清除。
- 檢查閘道記錄（使用 `--verbose` 執行），尋找顯示 `from: <groupJid>` 及帶有傳送者標籤本文的 `inbound web message` 項目。

## 已知注意事項

- 心跳偵測會在代理程式的主要工作階段中執行；群組工作階段絕不會執行心跳偵測。
- 回音抑制功能會為各工作階段記住合併後的提示（歷史記錄＋目前訊息），避免機器人自己已傳遞的訊息再次觸發；完全相同的重複批次可能會被視為回音而略過。
- 工作階段儲存區項目會以 `agent:<agentId>:whatsapp:group:<jid>` 的形式出現在各代理程式的 SQLite 工作階段儲存區中；若項目不存在，只代表該群組尚未觸發過執行。
- 輸入中指示器遵循 `agents.entries.*.typingMode`／`agents.defaults.typingMode`。當可見回覆選擇僅限訊息工具模式時，預設會立即開始顯示輸入中狀態，因此即使未張貼自動最終回覆，群組成員仍能看見代理程式正在處理。明確的輸入模式設定仍具有優先權。

## 相關內容

- [群組](/zh-TW/channels/groups)
- [頻道路由](/zh-TW/channels/channel-routing)
- [廣播群組](/zh-TW/channels/broadcast-groups)
