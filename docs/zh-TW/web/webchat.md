---
read_when:
    - 偵錯或設定 WebChat 存取
summary: 聊天 UI 的迴路網頁聊天靜態託管與 Gateway WS 使用方式
title: 網頁聊天
x-i18n:
    generated_at: "2026-05-04T02:47:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

狀態：macOS/iOS SwiftUI 聊天 UI 會直接與 Gateway WebSocket 通訊。

## 這是什麼

- 適用於 Gateway 的原生聊天 UI（沒有嵌入式瀏覽器，也沒有本機靜態伺服器）。
- 使用與其他通道相同的工作階段與路由規則。
- 決定性路由：回覆一律傳回 WebChat。

## 快速開始

1. 啟動 Gateway。
2. 開啟 WebChat UI（macOS/iOS app）或 Control UI 聊天分頁。
3. 確認已設定有效的 Gateway 驗證路徑（預設為 shared-secret，
   即使在 loopback 上也是如此）。

## 運作方式（行為）

- UI 連線到 Gateway WebSocket，並使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 會受到限制以維持穩定性：Gateway 可能會截斷過長的文字欄位、省略龐大的中繼資料，並以 `[chat.history omitted: message too large]` 取代過大的項目。
- 對於現代的僅附加工作階段檔案，`chat.history` 會遵循作用中的逐字稿分支，因此已放棄的重寫分支和被取代的提示副本不會在 WebChat 中呈現。
- Compaction 項目會呈現為明確的已壓縮歷史分隔線。分隔線會說明較早的回合已保存在檢查點中，並連結到 Sessions 檢查點控制項；在權限允許時，操作人員可以在那裡建立分支或還原 Compaction 前的檢視。
- Control UI 會記住 `chat.history` 傳回的後端 Gateway `sessionId`，並在後續的 `chat.send` 呼叫中包含它，因此重新連線與頁面重新整理會繼續同一個已儲存的對話，除非使用者開始或重設工作階段。
- Control UI 會在產生新的 `chat.send` 執行 ID 前，合併同一個工作階段、訊息與附件的重複進行中提交；Gateway 仍會對重複使用相同冪等鍵的重複請求進行去重。
- 工作區啟動檔案與待處理的 `BOOTSTRAP.md` 指示會透過代理系統提示的 Project Context 提供，而不是複製到 WebChat 使用者訊息中。Bootstrap 截斷只會加入簡潔的系統提示復原通知；詳細計數與設定旋鈕會保留在診斷介面上。
- `chat.history` 也會進行顯示正規化：僅執行期的 OpenClaw 內容、
  傳入信封包裝、內嵌傳遞指令標籤
  例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、純文字工具呼叫 XML
  承載（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊），以及
  洩漏的 ASCII/全形模型控制權杖，都會從可見文字中移除，
  而整個可見文字僅為精確靜默
  權杖 `NO_REPLY` / `no_reply` 的 assistant 項目會被省略。
- 標記為推理的回覆承載（`isReasoning: true`）會從 WebChat assistant 內容、逐字稿重播文字與音訊內容區塊中排除，因此僅思考用的承載不會顯示為可見的 assistant 訊息或可播放音訊。
- `chat.inject` 會將 assistant 備註直接附加到逐字稿，並廣播給 UI（不執行代理）。
- 中止的執行可以讓部分 assistant 輸出持續顯示在 UI 中。
- 當存在已緩衝輸出時，Gateway 會將中止的部分 assistant 文字持久化到逐字稿歷史中，並以中止中繼資料標記這些項目。
- 歷史一律從 Gateway 擷取（不監看本機檔案）。
- 如果無法連上 Gateway，WebChat 會是唯讀狀態。

### 逐字稿與傳遞模型

WebChat 有兩條獨立的資料路徑：

- 工作階段 JSONL 檔案是持久化的模型/執行期逐字稿。對於一般代理執行，Pi 會透過其工作階段管理器持久化模型可見的 `user`、`assistant` 和 `toolResult` 訊息。WebChat 不會將任意傳遞、狀態或輔助文字寫入該逐字稿。
- Gateway `ReplyPayload` 事件是即時傳遞投影。它們可以針對 WebChat/通道顯示、區塊串流、指令標籤、媒體嵌入、TTS/音訊旗標與 UI 備援行為進行正規化。它們本身並不是權威的工作階段記錄。
- WebChat 只會在 Gateway 擁有一般 Pi assistant 回合之外顯示的訊息時，注入 assistant 逐字稿項目：`chat.inject`、非代理命令回覆、中止的部分輸出，以及 WebChat 管理的媒體逐字稿補充內容。
- `chat.history` 會讀取已儲存的工作階段逐字稿，並套用 WebChat 顯示投影。如果即時 assistant 文字在執行期間出現，但在重新載入歷史後消失，請先檢查原始 JSONL 是否包含該 assistant 文字，接著檢查 `chat.history` 投影是否將其移除，再檢查 Control UI 樂觀尾端合併是否以持久化快照取代了本機傳遞狀態。

一般代理執行的最終答案應該是持久化的，因為 Pi 會寫入 assistant `message_end`。任何將已傳遞最終承載鏡像到逐字稿中的備援，都必須先避免重複建立 Pi 已經寫入的 assistant 回合。

## Control UI 代理工具面板

- Control UI `/agents` 工具面板有兩個獨立檢視：
  - **目前可用** 使用 `tools.effective(sessionKey=...)`，並顯示目前
    工作階段在執行期實際可用的內容，包括核心、Plugin 與通道擁有的工具。
  - **工具設定** 使用 `tools.catalog`，並聚焦於設定檔、覆寫與
    目錄語意。
- 執行期可用性以工作階段為範圍。在同一個代理上切換工作階段，可能會變更
  **目前可用** 清單。
- 設定編輯器不代表執行期可用；有效存取仍會遵循原則
  優先順序（`allow`/`deny`、每代理與提供者/通道覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 建立 Gateway WebSocket 通道。
- 你不需要執行獨立的 WebChat 伺服器。

## 設定參考（WebChat）

完整設定：[設定](/zh-TW/gateway/configuration)

WebChat 選項：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 回應中文字欄位的最大字元數。當逐字稿項目超過此限制時，Gateway 會截斷過長的文字欄位，並可能以預留位置取代過大的訊息。用戶端也可以傳送單次請求的 `maxChars`，以覆寫單次 `chat.history` 呼叫的此預設值。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機/連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器 Control UI 聊天分頁可以使用 Tailscale
  Serve 身分標頭。
- `gateway.auth.mode: "trusted-proxy"`：供位於具身分感知能力的**非 loopback** 代理來源後方的瀏覽器用戶端使用的反向代理驗證（請參閱 [Trusted Proxy Auth](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端 Gateway 目標。
- `session.*`：工作階段儲存與主要金鑰預設值。

## 相關

- [Control UI](/zh-TW/web/control-ui)
- [Dashboard](/zh-TW/web/dashboard)
