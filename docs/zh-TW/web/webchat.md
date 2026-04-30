---
read_when:
    - 偵錯或設定 WebChat 存取權
summary: 用於聊天介面的迴送 WebChat 靜態主機與 Gateway WS 用法
title: 網頁聊天
x-i18n:
    generated_at: "2026-04-30T03:50:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

狀態：macOS/iOS SwiftUI 聊天 UI 會直接與 Gateway WebSocket 通訊。

## 這是什麼

- Gateway 的原生聊天 UI（沒有嵌入式瀏覽器，也沒有本機靜態伺服器）。
- 使用與其他頻道相同的工作階段和路由規則。
- 決定性路由：回覆一律回到 WebChat。

## 快速開始

1. 啟動 Gateway。
2. 開啟 WebChat UI（macOS/iOS 應用程式）或控制 UI 聊天分頁。
3. 確認已設定有效的 Gateway 驗證路徑（預設為 shared-secret，
   即使在 loopback 上也是如此）。

## 運作方式（行為）

- UI 連線到 Gateway WebSocket，並使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 為了穩定性而有界限：Gateway 可能會截斷過長的文字欄位、省略大量中繼資料，並以 `[chat.history omitted: message too large]` 取代過大的項目。
- 對於現代 append-only 工作階段檔案，`chat.history` 會遵循作用中的逐字稿分支，因此已放棄的重寫分支和已被取代的提示副本不會呈現在 WebChat 中。
- 控制 UI 會在產生新的 `chat.send` 執行 id 之前，合併同一工作階段、訊息和附件的重複進行中提交；Gateway 仍會對重複使用相同冪等性金鑰的重複要求進行去重。
- `chat.history` 也會經過顯示正規化：僅執行階段使用的 OpenClaw 內容、
  傳入信封包裝器、內嵌傳遞指令標籤
  例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、純文字 tool-call XML
  承載（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`，以及截斷的 tool-call 區塊），以及
  外洩的 ASCII/全形模型控制權杖都會從可見文字中移除，
  而整段可見文字只有精確靜默
  權杖 `NO_REPLY` / `no_reply` 的 assistant 項目會被省略。
- 帶有 reasoning 旗標的回覆承載（`isReasoning: true`）會從 WebChat assistant 內容、逐字稿重播文字和音訊內容區塊中排除，因此僅供思考的承載不會顯示為可見的 assistant 訊息或可播放音訊。
- `chat.inject` 會將 assistant 備註直接附加到逐字稿，並廣播到 UI（不會執行 agent）。
- 已中止的執行可以讓部分 assistant 輸出保留在 UI 中可見。
- 當有緩衝輸出存在時，Gateway 會將已中止的部分 assistant 文字持久化到逐字稿歷史記錄，並以中止中繼資料標記這些項目。
- 歷史記錄一律從 Gateway 擷取（不進行本機檔案監看）。
- 如果無法連線到 Gateway，WebChat 會是唯讀。

## 控制 UI agent 工具面板

- 控制 UI `/agents` 工具面板有兩個獨立檢視：
  - **目前可用** 使用 `tools.effective(sessionKey=...)`，並顯示目前
    工作階段在執行階段實際可以使用的內容，包括核心、Plugin 和頻道擁有的工具。
  - **工具設定** 使用 `tools.catalog`，並專注於設定檔、覆寫和
    目錄語意。
- 執行階段可用性以工作階段為範圍。在同一個 agent 上切換工作階段可能會變更
  **目前可用** 清單。
- 設定編輯器不代表執行階段可用性；有效存取仍會遵循原則
  優先順序（`allow`/`deny`、每個 agent 以及提供者/頻道覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 對 Gateway WebSocket 建立隧道。
- 你不需要執行獨立的 WebChat 伺服器。

## 設定參考（WebChat）

完整設定：[設定](/zh-TW/gateway/configuration)

WebChat 選項：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 回應中文字欄位的最大字元數。當逐字稿項目超過此限制時，Gateway 會截斷過長的文字欄位，並可能以佔位符取代過大的訊息。用戶端也可以傳送每次要求的 `maxChars`，以覆寫單次 `chat.history` 呼叫的此預設值。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機/連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器控制 UI 聊天分頁可以使用 Tailscale
  Serve 身分標頭。
- `gateway.auth.mode: "trusted-proxy"`：供位於具身分感知能力的**非 loopback** Proxy 來源後方之瀏覽器用戶端使用的反向 Proxy 驗證（請參閱 [Trusted Proxy Auth](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端 Gateway 目標。
- `session.*`：工作階段儲存與主要金鑰預設值。

## 相關

- [控制 UI](/zh-TW/web/control-ui)
- [儀表板](/zh-TW/web/dashboard)
