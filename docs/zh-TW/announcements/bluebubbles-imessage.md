---
read_when:
    - 你使用了舊的 BlueBubbles 通道，且需要移轉到 iMessage
    - 您正在選擇受支援的 OpenClaw iMessage 設定方式
    - 你需要一段關於移除 BlueBubbles 的簡短說明
summary: OpenClaw 已移除 BlueBubbles 支援。針對全新和已遷移的 iMessage 設定，請使用隨附的 iMessage Plugin 搭配 imsg。
title: BlueBubbles 的移除與 imsg iMessage 路徑
x-i18n:
    generated_at: "2026-05-11T20:20:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# 移除 BlueBubbles 與 imsg iMessage 路徑

OpenClaw 不再隨附 BlueBubbles 通道。iMessage 支援現在透過隨附的 `imessage` Plugin 執行，該 Plugin 會在本機或透過 SSH 包裝器啟動 [`imsg`](https://github.com/steipete/imsg)，並透過 stdin/stdout 使用 JSON-RPC 通訊。

如果你的設定仍包含 `channels.bluebubbles`，請將它遷移到 `channels.imessage`。舊版 `/channels/bluebubbles` 文件 URL 會重新導向至 [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)，其中包含完整的設定轉換表與切換檢查清單。

## 變更內容

- 在受支援的 OpenClaw iMessage 路徑中，沒有 BlueBubbles HTTP 伺服器、Webhook 路由、REST 密碼，或 BlueBubbles Plugin 執行階段。
- OpenClaw 會在已登入 Messages.app 的 Mac 上，透過 `imsg` 讀取並監看 Messages。
- 基本的傳送、接收、歷史記錄與媒體會使用一般的 `imsg` 介面與 macOS 權限。
- 串接回覆、tapback、編輯、收回、效果、已讀回條、輸入中指示器與群組管理等進階動作，需要使用具備私有 API 橋接器的 `imsg launch`。
- Linux 與 Windows Gateway 仍可透過將 `channels.imessage.cliPath` 設為在已登入 Mac 上執行 `imsg` 的 SSH 包裝器來使用 iMessage。

## 要做什麼

1. 在 Messages Mac 上安裝並驗證 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. 將 Full Disk Access 與 Automation 權限授予執行 `imsg` 與 OpenClaw 的程序環境。

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

4. 重新啟動 Gateway 並驗證：

   ```bash
   openclaw channels status --probe
   ```

5. 在刪除舊的 BlueBubbles 伺服器之前，測試 DM、群組、附件，以及你依賴的任何私有 API 動作。

## 遷移注意事項

- `channels.bluebubbles.serverUrl` 和 `channels.bluebubbles.password` 沒有對應的 iMessage 等價項目。
- `channels.bluebubbles.allowFrom`、`groupAllowFrom`、`groups`、`includeAttachments`、附件根目錄、媒體大小限制、分塊處理與動作切換都有 iMessage 等價項目。
- `channels.imessage.includeAttachments` 預設仍為關閉。如果你預期傳入的照片、語音備忘錄、影片或檔案會送達代理程式，請明確設定它。
- 使用 `groupPolicy: "allowlist"` 時，請複製舊的 `groups` 區塊，包括任何 `"*"` 萬用字元項目。群組傳送者允許清單與群組登錄檔是分開的閘門。
- 符合 `channel: "bluebubbles"` 的 ACP 綁定必須改為 `channel: "imessage"`。
- 舊的 BlueBubbles 工作階段金鑰不會變成 iMessage 工作階段金鑰。配對核准會依 handle 延續，但 BlueBubbles 工作階段金鑰下的對話歷史不會延續。

## 另請參閱

- [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)
- [iMessage](/zh-TW/channels/imessage)
- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
