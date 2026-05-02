---
read_when:
    - 偵錯或設定 WebChat 存取權
summary: Loopback WebChat 靜態託管與聊天 UI 的 Gateway WS 使用方式
title: 網頁聊天
x-i18n:
    generated_at: "2026-05-02T21:07:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

狀態：macOS/iOS SwiftUI 聊天 UI 會直接與 Gateway WebSocket 通訊。

## 這是什麼

- Gateway 的原生聊天 UI（沒有嵌入式瀏覽器，也沒有本機靜態伺服器）。
- 使用與其他頻道相同的工作階段與路由規則。
- 確定性路由：回覆一律回到 WebChat。

## 快速開始

1. 啟動 Gateway。
2. 開啟 WebChat UI（macOS/iOS 應用程式）或 Control UI 聊天分頁。
3. 確認已設定有效的 Gateway 驗證路徑（預設為 shared-secret，
   即使在 loopback 上也是如此）。

## 運作方式（行為）

- UI 會連線到 Gateway WebSocket，並使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 會為了穩定性受到限制：Gateway 可能會截斷過長文字欄位、省略大型中繼資料，並以 `[chat.history omitted: message too large]` 取代過大的項目。
- 對於現代 append-only 工作階段檔案，`chat.history` 會遵循作用中的逐字稿分支，因此被放棄的重寫分支與已被取代的提示副本不會在 WebChat 中呈現。
- Control UI 會記住 `chat.history` 回傳的後端 Gateway `sessionId`，並在後續 `chat.send` 呼叫中包含它，因此重新連線與頁面重新整理會繼續同一個已儲存的對話，除非使用者開始或重設工作階段。
- Control UI 會在產生新的 `chat.send` 執行 ID 之前，合併同一工作階段、訊息與附件的重複進行中提交；Gateway 仍會對重用相同冪等性金鑰的重複請求進行去重。
- `chat.history` 也會進行顯示正規化：只在執行階段使用的 OpenClaw 上下文、
  inbound envelope 包裝器、行內傳遞指示標籤
  例如 `[[reply_to_*]]` 與 `[[audio_as_voice]]`、純文字 tool-call XML
  payload（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`，以及被截斷的 tool-call 區塊），以及
  洩漏的 ASCII/全形模型控制 token 都會從可見文字中移除，
  並且會省略整段可見文字只有精確靜默
  token `NO_REPLY` / `no_reply` 的 assistant 項目。
- 標記為推理的回覆 payload（`isReasoning: true`）會從 WebChat assistant 內容、逐字稿重播文字與音訊內容區塊中排除，因此僅供思考用的 payload 不會顯示為可見的 assistant 訊息或可播放音訊。
- `chat.inject` 會直接將 assistant 備註附加到逐字稿，並廣播給 UI（沒有代理執行）。
- 已中止的執行可在 UI 中保留部分 assistant 輸出。
- 當存在已緩衝輸出時，Gateway 會將已中止的部分 assistant 文字保存到逐字稿歷史，並以中止中繼資料標記這些項目。
- 歷史一律從 Gateway 擷取（不監看本機檔案）。
- 如果無法連上 Gateway，WebChat 會是唯讀。

## Control UI 代理工具面板

- Control UI `/agents` 工具面板有兩個獨立檢視：
  - **Available Right Now** 使用 `tools.effective(sessionKey=...)`，並顯示目前
    工作階段在執行階段實際可用的內容，包括核心、Plugin 與頻道擁有的工具。
  - **Tool Configuration** 使用 `tools.catalog`，並保持聚焦於設定檔、覆寫與
    目錄語意。
- 執行階段可用性是以工作階段為範圍。在同一個代理上切換工作階段可能會改變
  **Available Right Now** 清單。
- 設定編輯器不代表執行階段可用；有效存取權仍會遵循原則
  優先順序（`allow`/`deny`、每個代理與 provider/channel 覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 將 Gateway WebSocket 建立隧道。
- 你不需要執行獨立的 WebChat 伺服器。

## 設定參考（WebChat）

完整設定：[設定](/zh-TW/gateway/configuration)

WebChat 選項：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 回應中文字欄位的最大字元數。當逐字稿項目超過此限制時，Gateway 會截斷過長文字欄位，並可能以佔位符取代過大的訊息。用戶端也可以傳送每個請求的 `maxChars`，以針對單一 `chat.history` 呼叫覆寫此預設值。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機/連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器 Control UI 聊天分頁可使用 Tailscale
  Serve 身分標頭。
- `gateway.auth.mode: "trusted-proxy"`：供位於具身分感知能力的 **non-loopback** 代理來源後方瀏覽器用戶端使用的反向代理驗證（請參閱 [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端 Gateway 目標。
- `session.*`：工作階段儲存與主要金鑰預設值。

## 相關

- [Control UI](/zh-TW/web/control-ui)
- [Dashboard](/zh-TW/web/dashboard)
