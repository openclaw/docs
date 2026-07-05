---
read_when:
    - 你使用的是舊的 BlueBubbles 頻道，且需要移轉到 iMessage
    - 您正在選擇受支援的 OpenClaw iMessage 設定方式
    - 你需要一段關於移除 BlueBubbles 的簡短說明
summary: OpenClaw 已移除 BlueBubbles 支援。新的與已遷移的 iMessage 設定請使用內建的 iMessage 外掛搭配 imsg。
title: BlueBubbles 移除與 imsg iMessage 路徑
x-i18n:
    generated_at: "2026-07-05T11:00:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# BlueBubbles 移除與 imsg iMessage 路徑

OpenClaw 不再隨附 BlueBubbles 頻道。iMessage 支援透過內建的 `imessage` 外掛執行：閘道會在本機或透過 SSH 包裝器，將 [`imsg`](https://github.com/steipete/imsg) 作為子程序啟動，並透過 stdin/stdout 使用 JSON-RPC 通訊。沒有伺服器，沒有網路鉤子，沒有連接埠。

如果你的設定仍包含 `channels.bluebubbles`，請將它遷移到 `channels.imessage`。舊版 `/channels/bluebubbles` 文件 URL 會重新導向到 [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)，其中有完整的設定轉換表與切換檢查清單。

## 變更內容

- 支援的 iMessage 路徑沒有 BlueBubbles HTTP 伺服器、網路鉤子路由、REST 密碼或 BlueBubbles 外掛執行階段。
- OpenClaw 會在已登入 Messages.app 的 Mac 上，透過 `imsg` 讀取並監看訊息。
- 基本的傳送、接收、歷史記錄與媒體會使用一般的 `imsg` 介面與 macOS 權限。
- 進階動作（串接回覆、tapback、編輯、取消傳送、效果、已讀回條、輸入指示器、群組管理）需要私有 API 橋接：執行 `imsg launch`，這需要停用 SIP。
- Linux 和 Windows 閘道仍可使用 iMessage，做法是將 `channels.imessage.cliPath` 指向在已登入的 Mac 上執行 `imsg` 的 SSH 包裝器。

## 要做什麼

1. 在 Messages Mac 上安裝並驗證 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. 將完整磁碟存取權與自動化權限授予執行 `imsg` 和 OpenClaw 的程序情境。

3. 轉換舊設定：

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. 重新啟動閘道並驗證：

   ```bash
   openclaw channels status --probe
   ```

5. 在刪除舊的 BlueBubbles 伺服器之前，測試 DM、群組、附件，以及你依賴的任何私有 API 動作。

## 遷移注意事項

- `channels.bluebubbles.serverUrl` 和 `channels.bluebubbles.password` 沒有對應的 iMessage 設定；沒有需要連線或驗證的伺服器。
- `allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit` 和 `actions.*` 在 `channels.imessage` 下會保留其含義。
- `channels.imessage.includeAttachments` 預設仍為關閉。如果你預期傳入的照片、語音備忘錄、影片或檔案會送達代理，請明確設定它。
- 使用 `groupPolicy: "allowlist"` 時，請複製舊的 `groups` 區塊，包括任何 `"*"` 萬用字元項目。群組寄件者允許清單與群組登錄表是分開的閘門；含有項目但沒有相符 `chat_id`（或沒有 `"*"`）的 `groups` 區塊，會在執行階段丟棄訊息，而空的 `groups` 區塊會記錄啟動警告，即使寄件者篩選仍會讓訊息通過。
- 含有 `match.channel: "bluebubbles"` 的 ACP 繫結必須改為 `"imessage"`。
- 舊的 BlueBubbles 工作階段金鑰不會變成 iMessage 工作階段金鑰。配對核准會依寄件者 handle 作為鍵，因此複製的 `allowFrom` 項目會繼續運作，但 BlueBubbles 工作階段金鑰下的對話歷史記錄不會移轉。

## 另請參閱

- [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)
- [iMessage](/zh-TW/channels/imessage)
- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
