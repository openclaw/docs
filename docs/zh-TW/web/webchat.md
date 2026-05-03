---
read_when:
    - 偵錯或設定 WebChat 存取權
summary: Loopback WebChat 靜態主機與聊天 UI 的 Gateway WS 使用方式
title: 網頁聊天
x-i18n:
    generated_at: "2026-05-03T21:44:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

狀態：macOS/iOS SwiftUI 聊天 UI 會直接與 Gateway WebSocket 通訊。

## 它是什麼

- Gateway 的原生聊天 UI（沒有嵌入式瀏覽器，也沒有本機靜態伺服器）。
- 使用與其他通道相同的工作階段與路由規則。
- 決定性路由：回覆一律回到 WebChat。

## 快速開始

1. 啟動 Gateway。
2. 開啟 WebChat UI（macOS/iOS 應用程式）或 Control UI 聊天分頁。
3. 確認已設定有效的 Gateway 驗證路徑（預設為共享密鑰，
   即使在 loopback 上也是如此）。

## 運作方式（行為）

- UI 會連線至 Gateway WebSocket，並使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 為了穩定性而有界限：Gateway 可能會截斷很長的文字欄位、省略大型中繼資料，並以 `[chat.history omitted: message too large]` 取代過大的項目。
- `chat.history` 會針對現代僅附加工作階段檔案遵循作用中的逐字稿分支，因此已放棄的重寫分支和已被取代的提示副本不會在 WebChat 中呈現。
- Compaction 項目會呈現為明確的已壓縮歷史分隔線。該分隔線會說明較早的回合已保留在檢查點中，並連結到工作階段檢查點控制項，操作員可在權限允許時從那裡分支或還原 Compaction 前的檢視。
- Control UI 會記住 `chat.history` 傳回的後端 Gateway `sessionId`，並在後續 `chat.send` 呼叫中包含它，因此重新連線和頁面重新整理會繼續相同的已儲存對話，除非使用者啟動或重設工作階段。
- Control UI 會在產生新的 `chat.send` 執行 ID 前，合併同一工作階段、訊息和附件的重複進行中提交；Gateway 仍會對重複使用相同冪等性金鑰的重複請求進行去重。
- `chat.history` 也會進行顯示正規化：僅限執行階段的 OpenClaw 上下文、
  傳入封套包裝、內嵌傳遞指令標籤
  例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、純文字工具呼叫 XML
  酬載（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊），以及
  外洩的 ASCII/全形模型控制權杖，都會從可見文字中移除，
  而整段可見文字僅為精確靜默
  權杖 `NO_REPLY` / `no_reply` 的助理項目會被省略。
- 帶有推理標記的回覆酬載（`isReasoning: true`）會從 WebChat 助理內容、逐字稿重播文字和音訊內容區塊中排除，因此僅供思考的酬載不會顯示為可見的助理訊息或可播放音訊。
- `chat.inject` 會將助理備註直接附加到逐字稿，並廣播到 UI（不執行代理）。
- 已中止的執行可讓部分助理輸出持續顯示在 UI 中。
- 當存在已緩衝輸出時，Gateway 會將已中止的部分助理文字持久化到逐字稿歷史中，並以中止中繼資料標記這些項目。
- 歷史一律從 Gateway 擷取（不監看本機檔案）。
- 如果無法連線到 Gateway，WebChat 會是唯讀。

## Control UI 代理工具面板

- Control UI `/agents` 工具面板有兩個獨立檢視：
  - **目前可用** 使用 `tools.effective(sessionKey=...)`，並顯示目前
    工作階段在執行階段實際可使用的內容，包括核心、Plugin 和通道擁有的工具。
  - **工具設定** 使用 `tools.catalog`，並持續專注於設定檔、覆寫和
    目錄語意。
- 執行階段可用性以工作階段為範圍。在同一代理上切換工作階段可能會變更
  **目前可用** 清單。
- 設定編輯器不代表執行階段可用性；有效存取仍遵循政策
  優先順序（`allow`/`deny`、每代理與供應商/通道覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 對 Gateway WebSocket 建立隧道。
- 你不需要執行獨立的 WebChat 伺服器。

## 設定參考（WebChat）

完整設定：[設定](/zh-TW/gateway/configuration)

WebChat 選項：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 回應中文字欄位的最大字元數。當逐字稿項目超過此限制時，Gateway 會截斷很長的文字欄位，並可能以預留位置取代過大的訊息。用戶端也可以傳送每次請求的 `maxChars`，針對單一 `chat.history` 呼叫覆寫此預設值。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機/連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密鑰 WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器 Control UI 聊天分頁可以使用 Tailscale
  Serve 身分標頭。
- `gateway.auth.mode: "trusted-proxy"`：供位於具身分感知能力的**非 loopback** Proxy 來源後方之瀏覽器用戶端使用的反向 Proxy 驗證（請參閱 [可信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端 Gateway 目標。
- `session.*`：工作階段儲存與主要金鑰預設值。

## 相關

- [Control UI](/zh-TW/web/control-ui)
- [儀表板](/zh-TW/web/dashboard)
