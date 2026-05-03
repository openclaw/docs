---
read_when:
    - 偵錯或設定 WebChat 存取權
summary: 聊天 UI 的迴路 WebChat 靜態主機與 Gateway WS 使用方式
title: 網頁聊天
x-i18n:
    generated_at: "2026-05-03T02:46:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
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
2. 開啟 WebChat UI（macOS/iOS 應用程式）或 Control UI 的聊天分頁。
3. 確保已設定有效的 Gateway 驗證路徑（預設為共享密鑰，
   即使在 loopback 上也是如此）。

## 運作方式（行為）

- UI 會連線到 Gateway WebSocket，並使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 會為了穩定性而設有界限：Gateway 可能會截斷很長的文字欄位、省略大量中繼資料，並將過大的項目替換為 `[chat.history omitted: message too large]`。
- 對於現代僅附加的工作階段檔案，`chat.history` 會跟隨作用中的 transcript 分支，因此已放棄的重寫分支和被取代的提示副本不會在 WebChat 中呈現。
- Control UI 會記住 `chat.history` 傳回的底層 Gateway `sessionId`，並在後續 `chat.send` 呼叫中帶上它，因此重新連線和重新整理頁面會繼續同一個已儲存的對話，除非使用者開始或重設工作階段。
- Control UI 會在產生新的 `chat.send` 執行 ID 之前，合併同一工作階段、訊息和附件的重複進行中提交；Gateway 仍會去重使用相同冪等性金鑰的重複請求。
- `chat.history` 也會進行顯示正規化：僅限執行階段的 OpenClaw 上下文、
  傳入封套包裝、內嵌傳遞指令標籤
  例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、純文字工具呼叫 XML
  酬載（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊），以及
  外洩的 ASCII/全形模型控制權杖，都會從可見文字中移除，
  而整個可見文字只有精確靜默權杖
  `NO_REPLY` / `no_reply` 的 assistant 項目會被省略。
- 標記為推理的回覆酬載（`isReasoning: true`）會從 WebChat assistant 內容、transcript 重播文字和音訊內容區塊中排除，因此僅思考用的酬載不會顯示為可見的 assistant 訊息或可播放音訊。
- `chat.inject` 會直接將 assistant 備註附加到 transcript，並廣播到 UI（不執行 agent）。
- 已中止的執行可以在 UI 中保留可見的部分 assistant 輸出。
- 當存在已緩衝的輸出時，Gateway 會將已中止的部分 assistant 文字持久化到 transcript 歷史記錄中，並以中止中繼資料標記這些項目。
- 歷史記錄一律從 Gateway 擷取（不監看本機檔案）。
- 如果無法連上 Gateway，WebChat 會是唯讀狀態。

## Control UI agents 工具面板

- Control UI `/agents` 工具面板有兩個獨立檢視：
  - **目前可用** 使用 `tools.effective(sessionKey=...)`，並顯示目前
    工作階段在執行階段實際可用的內容，包括 core、Plugin 和頻道擁有的工具。
  - **工具設定** 使用 `tools.catalog`，並專注於設定檔、覆寫和
    catalog 語意。
- 執行階段可用性以工作階段為範圍。在同一個 agent 上切換工作階段可能會改變
  **目前可用** 清單。
- 設定編輯器不代表執行階段可用性；有效存取仍遵循政策
  優先順序（`allow`/`deny`、每個 agent 和 provider/channel 覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 隧道傳送 Gateway WebSocket。
- 你不需要執行另一個 WebChat 伺服器。

## 設定參考（WebChat）

完整設定：[設定](/zh-TW/gateway/configuration)

WebChat 選項：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 回應中文字欄位的最大字元數。當 transcript 項目超過此限制時，Gateway 會截斷很長的文字欄位，並可能將過大的訊息替換為預留位置。用戶端也可以傳送每次請求的 `maxChars`，以針對單次 `chat.history` 呼叫覆寫此預設值。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機/連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密鑰 WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器 Control UI 聊天分頁可以使用 Tailscale
  Serve 身分標頭。
- `gateway.auth.mode: "trusted-proxy"`：身分感知 **非 loopback** proxy 來源後方瀏覽器用戶端的反向 proxy 驗證（請參閱 [Trusted Proxy Auth](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端 Gateway 目標。
- `session.*`：工作階段儲存和主要金鑰預設值。

## 相關

- [Control UI](/zh-TW/web/control-ui)
- [Dashboard](/zh-TW/web/dashboard)
