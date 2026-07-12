---
read_when:
    - 你先前使用舊版 BlueBubbles 頻道，現在需要移轉至 iMessage
    - 您正在選擇受支援的 OpenClaw iMessage 設定方式
    - 你需要一段關於移除 BlueBubbles 的簡短說明
summary: BlueBubbles 支援已從 OpenClaw 移除。新的及遷移後的 iMessage 設定，請使用搭配 imsg 的內建 iMessage 外掛。
title: 移除 BlueBubbles 與 imsg iMessage 路徑
x-i18n:
    generated_at: "2026-07-11T21:05:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# 移除 BlueBubbles 與 imsg iMessage 路徑

OpenClaw 不再隨附 BlueBubbles 頻道。iMessage 支援透過內建的 `imessage` 外掛運作：閘道會在本機或透過 SSH 包裝程式產生 [`imsg`](https://github.com/steipete/imsg) 子程序，並透過標準輸入／標準輸出以 JSON-RPC 通訊。沒有伺服器、沒有網路鉤子，也沒有連接埠。

如果你的設定仍包含 `channels.bluebubbles`，請將其遷移至 `channels.imessage`。舊版 `/channels/bluebubbles` 文件網址會重新導向至[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)，其中包含完整的設定轉換表與切換檢查清單。

## 變更內容

- 支援的 iMessage 路徑不包含 BlueBubbles HTTP 伺服器、網路鉤子路由、REST 密碼或 BlueBubbles 外掛執行環境。
- OpenClaw 會在已登入 Messages.app 的 Mac 上，透過 `imsg` 讀取並監看「訊息」。
- 基本的傳送、接收、歷史記錄和媒體功能會使用一般的 `imsg` 介面與 macOS 權限。
- 進階操作（討論串回覆、點按回應、編輯、收回、特效、已讀回條、輸入中指示器、群組管理）需要私有 API 橋接器：執行 `imsg launch`，這需要停用 SIP。
- Linux 和 Windows 閘道仍可使用 iMessage，只要將 `channels.imessage.cliPath` 指向會在已登入的 Mac 上執行 `imsg` 的 SSH 包裝程式即可。

## 操作步驟

1. 在執行「訊息」的 Mac 上安裝並驗證 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. 為執行 `imsg` 和 OpenClaw 的程序環境授予「完整磁碟存取」與「自動化」權限。

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

5. 刪除舊的 BlueBubbles 伺服器前，請測試私訊、群組、附件，以及你所依賴的所有私有 API 操作。

## 遷移注意事項

- `channels.bluebubbles.serverUrl` 和 `channels.bluebubbles.password` 在 iMessage 中沒有對應項目；因為不存在需要連線或驗證的伺服器。
- `allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit` 和 `actions.*` 在 `channels.imessage` 下維持原有含義。
- `channels.imessage.includeAttachments` 預設仍為停用。如果你希望代理程式接收傳入的照片、語音備忘錄、影片或檔案，請明確啟用此設定。
- 使用 `groupPolicy: "allowlist"` 時，請複製舊的 `groups` 區塊，包括任何 `"*"` 萬用字元項目。群組傳送者允許清單與群組登錄是不同的關卡；如果 `groups` 區塊包含項目，但沒有相符的 `chat_id`（或沒有 `"*"`），執行階段會捨棄該訊息；而空白的 `groups` 區塊會記錄啟動警告，即使傳送者篩選仍允許訊息通過。
- `match.channel: "bluebubbles"` 的 ACP 綁定必須改為 `"imessage"`。
- 舊的 BlueBubbles 工作階段金鑰不會轉換成 iMessage 工作階段金鑰。配對核准會依傳送者控制代碼建立索引，因此複製的 `allowFrom` 項目仍可正常運作，但 BlueBubbles 工作階段金鑰下的對話歷史記錄不會移轉。

## 另請參閱

- [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)
- [iMessage](/zh-TW/channels/imessage)
- [設定參考資料－iMessage](/zh-TW/gateway/config-channels#imessage)
