---
read_when:
    - 偵錯或設定 WebChat 存取權
summary: 回送 WebChat 靜態主機與聊天介面的 Gateway WS 使用方式
title: 網頁聊天
x-i18n:
    generated_at: "2026-05-02T23:39:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

狀態：macOS/iOS SwiftUI 聊天 UI 會直接與 Gateway WebSocket 通訊。

## 這是什麼

- Gateway 的原生聊天 UI（沒有嵌入式瀏覽器，也沒有本機靜態伺服器）。
- 使用與其他通道相同的工作階段和路由規則。
- 確定性路由：回覆一律送回 WebChat。

## 快速開始

1. 啟動 Gateway。
2. 開啟 WebChat UI（macOS/iOS app）或 Control UI 聊天分頁。
3. 確認已設定有效的 Gateway 驗證路徑（預設為共享密鑰，
   即使在 loopback 上也是如此）。

## 運作方式（行為）

- UI 會連線到 Gateway WebSocket，並使用 `chat.history`、`chat.send`、`chat.inject` 和 `chat.transcribeAudio`。
- `chat.history` 會受限以維持穩定性：Gateway 可能會截斷過長的文字欄位、省略大型中繼資料，並以 `[chat.history omitted: message too large]` 取代過大的項目。
- 對於現代僅附加的工作階段檔案，`chat.history` 會沿用作用中的逐字稿分支，因此遭放棄的重寫分支和已被取代的提示副本不會在 WebChat 中呈現。
- Control UI 會記住 `chat.history` 回傳的後端 Gateway `sessionId`，並在後續 `chat.send` 呼叫中包含它，因此重新連線和頁面重新整理會延續相同的已儲存對話，除非使用者啟動或重設工作階段。
- 在產生新的 `chat.send` 執行 id 之前，Control UI 會合併同一工作階段、訊息和附件的重複進行中提交；Gateway 仍會對重複使用相同冪等鍵的重複請求進行去重。
- `chat.history` 也會進行顯示正規化：僅執行期使用的 OpenClaw 情境、
  傳入信封包裝器、內嵌遞送指令標籤
  例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、純文字工具呼叫 XML
  payload（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊），以及
  洩漏出的 ASCII/全形模型控制 token 都會從可見文字中移除，
  且整段可見文字只有精確靜默 token `NO_REPLY` / `no_reply` 的 assistant 項目會被省略。
- 標記為 reasoning 的回覆 payload（`isReasoning: true`）會從 WebChat assistant 內容、逐字稿重播文字和音訊內容區塊中排除，因此僅供思考的 payload 不會顯示為可見的 assistant 訊息或可播放音訊。
- `chat.transcribeAudio` 為 Control UI 聊天撰寫器提供伺服器端聽寫功能。瀏覽器會錄製麥克風音訊、以 base64 傳送到 Gateway，然後 Gateway 執行已設定的 `tools.media.audio` 管線。回傳的逐字稿會插入草稿；在使用者送出前不會啟動任何 agent 執行。
- `chat.inject` 會直接將 assistant 註記附加到逐字稿，並將它廣播到 UI（不會執行 agent）。
- 已中止的執行可以讓部分 assistant 輸出持續顯示在 UI 中。
- 當存在已緩衝輸出時，Gateway 會將已中止的部分 assistant 文字保存到逐字稿歷史中，並以中止中繼資料標記這些項目。
- 歷史一律從 Gateway 擷取（不會監看本機檔案）。
- 如果無法連上 Gateway，WebChat 會是唯讀狀態。

## Control UI agent 工具面板

- Control UI `/agents` 工具面板有兩個獨立檢視：
  - **目前可用** 使用 `tools.effective(sessionKey=...)`，並顯示目前
    工作階段在執行期實際可使用的內容，包括核心、plugin 和通道擁有的工具。
  - **工具設定** 使用 `tools.catalog`，並聚焦於設定檔、覆寫和
    目錄語意。
- 執行期可用性以工作階段為範圍。在同一個 agent 上切換工作階段可能會改變
  **目前可用** 清單。
- 設定編輯器不代表執行期可用性；有效存取仍會遵循政策
  優先順序（`allow`/`deny`、每個 agent 以及 provider/channel 覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 將 Gateway WebSocket 建立 tunnel。
- 你不需要執行獨立的 WebChat 伺服器。

## 設定參考（WebChat）

完整設定：[設定](/zh-TW/gateway/configuration)

WebChat 選項：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 回應中文字欄位的最大字元數。當逐字稿項目超過此限制時，Gateway 會截斷過長的文字欄位，並可能以預留位置取代過大的訊息。用戶端也可以傳送每次請求的 `maxChars`，以便在單次 `chat.history` 呼叫中覆寫此預設值。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機/連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密鑰 WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器 Control UI 聊天分頁可以使用 Tailscale
  Serve 身分標頭。
- `gateway.auth.mode: "trusted-proxy"`：供位於具身分感知能力的 **非 loopback** proxy 來源後方瀏覽器用戶端使用的反向 proxy 驗證（請參閱[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端 Gateway 目標。
- `session.*`：工作階段儲存和主要鍵預設值。

## 相關

- [Control UI](/zh-TW/web/control-ui)
- [Dashboard](/zh-TW/web/dashboard)
