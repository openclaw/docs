---
read_when:
    - 偵錯或設定 WebChat 存取權
summary: 用於聊天 UI 的 Loopback WebChat 靜態主機與閘道 WS 用法
title: 網頁聊天
x-i18n:
    generated_at: "2026-06-27T20:12:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

狀態：macOS/iOS SwiftUI 聊天 UI 會直接與閘道 WebSocket 通訊。

## 這是什麼

- 閘道的原生聊天 UI（沒有嵌入式瀏覽器，也沒有本機靜態伺服器）。
- 使用與其他通道相同的工作階段與路由規則。
- 決定性路由：回覆一律回到 WebChat。

## 快速開始

1. 啟動閘道。
2. 開啟 WebChat UI（macOS/iOS 應用程式）或 Control UI 聊天分頁。
3. 確認已設定有效的閘道驗證路徑（預設為 shared-secret，
   即使在迴路上也是如此）。

## 運作方式（行為）

- UI 會連線到閘道 WebSocket，並使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 會為了穩定性而設限：閘道可能會截斷過長的文字欄位、省略較重的中繼資料，並以 `[chat.history omitted: message too large]` 取代過大的項目。
- 當可見的助理訊息在 `chat.history` 中遭到截斷時，Control UI 可以開啟側邊閱讀器，並透過 `chat.message.get` 按需擷取完整的顯示正規化項目，而不增加預設歷史承載量。
- 對於現代附加式工作階段檔案，`chat.history` 會遵循作用中的逐字稿分支，因此遭放棄的重寫分支和已被取代的提示詞副本不會在 WebChat 中呈現。
- 壓縮項目會呈現為明確的已壓縮歷史分隔線。該分隔線會說明已壓縮逐字稿會保留為檢查點，並連結到 Sessions 檢查點控制項；在權限允許時，操作員可從該壓縮檢視建立分支或還原。
- Control UI 會記住 `chat.history` 傳回的後端閘道 `sessionId`，並在後續 `chat.send` 呼叫中包含它，因此重新連線與頁面重新整理會繼續相同的已儲存對話，除非使用者開始或重設工作階段。
- Control UI 會先合併同一工作階段、訊息和附件的重複進行中提交，再產生新的 `chat.send` 執行 ID；閘道仍會對重複使用相同冪等鍵的重複請求進行去重。
- 工作區啟動檔案與待處理的 `BOOTSTRAP.md` 指示會透過代理系統提示詞的專案脈絡提供，而不是複製到 WebChat 使用者訊息中。Bootstrap 截斷只會加入簡潔的系統提示詞復原通知；詳細計數與組態調節項會保留在診斷介面上。
- `chat.history` 也會進行顯示正規化：僅限執行階段的 OpenClaw 脈絡、
  傳入信封包裝、內嵌傳遞指示標籤
  例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、純文字工具呼叫 XML
  承載（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`，以及遭截斷的工具呼叫區塊），以及
  洩漏的 ASCII/全形模型控制權杖都會從可見文字中移除，
  而整段可見文字僅為精確靜默
  權杖 `NO_REPLY` / `no_reply` 的助理項目會被省略。
- 標記為推理的回覆承載（`isReasoning: true`）會從 WebChat 助理內容、逐字稿重播文字和音訊內容區塊中排除，因此僅供思考的承載不會顯示為可見的助理訊息或可播放音訊。
- `chat.inject` 會直接將助理註記附加到逐字稿，並廣播到 UI（不執行代理）。
- 已中止的執行可以讓部分助理輸出保持在 UI 中可見。
- 當存在已緩衝輸出時，閘道會將已中止的部分助理文字持久化到逐字稿歷史中，並以中止中繼資料標記這些項目。
- 歷史一律從閘道擷取（不監看本機檔案）。
- 如果無法連線到閘道，WebChat 會變成唯讀。

### 逐字稿與傳遞模型

WebChat 有兩條分開的資料路徑：

- 工作階段 JSONL 檔案是持久的模型/執行階段逐字稿。對於一般代理執行，嵌入式 OpenClaw 執行階段會透過其工作階段管理器持久化模型可見的 `user`、`assistant` 和 `toolResult` 訊息。WebChat 不會將任意傳遞、狀態或輔助文字寫入該逐字稿。
- 閘道 `ReplyPayload` 事件是即時傳遞投影。它們可以針對 WebChat/通道顯示、區塊串流、指示標籤、媒體嵌入、TTS/音訊旗標和 UI 後援行為進行正規化。它們本身不是標準工作階段記錄。
- 需要透過 `tools.message` 顯示回覆的測試架構，仍會使用 WebChat 作為目前執行的內部來源回覆接收端。來自該作用中 WebChat 執行的無目標 `message.send` 會投影到同一聊天，並鏡像到工作階段逐字稿；WebChat 不會變成可重複使用的輸出通道，也永遠不會繼承 `lastChannel`。
- WebChat 只會在閘道擁有一般嵌入式代理回合之外顯示的訊息時，注入助理逐字稿項目：`chat.inject`、非代理命令回覆、已中止的部分輸出，以及 WebChat 管理的媒體逐字稿補充內容。
- `chat.history` 會讀取已儲存的工作階段逐字稿，並套用 WebChat 顯示投影。如果即時助理文字在執行期間出現，但在重新載入歷史後消失，請先檢查原始 JSONL 是否包含該助理文字，再檢查 `chat.history` 投影是否將其移除，然後檢查 Control UI 的樂觀尾端合併是否以持久化快照取代了本機傳遞狀態。
- `chat.message.get` 使用與 `chat.history` 相同的逐字稿分支和顯示投影規則，包括作用中代理範圍限定，但會以 `messageId` 鎖定一個逐字稿項目，並在完整內容無法再傳回時回傳真實的不可用原因。

一般代理執行的最終答案應該是持久的，因為嵌入式執行階段會寫入助理 `message_end`。任何將已傳遞最終承載鏡像到逐字稿的後援，都必須先避免重複寫入嵌入式執行階段已經寫入的助理回合。

## Control UI 代理工具面板

- Control UI `/agents` 工具面板有兩個分開的檢視：
  - **目前可用** 使用 `tools.effective(sessionKey=...)`，並顯示目前工作階段清單的伺服器衍生
    唯讀投影，包括核心、外掛、通道擁有、
    以及已發現的 MCP 伺服器工具。
  - **工具組態** 使用 `tools.catalog`，並持續聚焦於設定檔、覆寫和
    目錄語意。
- 執行階段可用性以工作階段為範圍。在同一代理上切換工作階段可能會改變
  **目前可用** 清單。如果已設定的 MCP 伺服器尚未連線，或自上次發現後已變更，
  面板會顯示通知，而不是從讀取路徑默默啟動 MCP 傳輸。
- 組態編輯器不代表執行階段可用性；有效存取仍遵循政策
  優先順序（`allow`/`deny`、個別代理與供應商/通道覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 通道化閘道 WebSocket。
- 你不需要執行獨立的 WebChat 伺服器。

## 組態參考（WebChat）

完整組態：[組態](/zh-TW/gateway/configuration)

WebChat 沒有持久化的組態區段。閘道會使用內建的 `chat.history` 顯示限制；API 用戶端可以傳送每次請求的 `maxChars`，以覆寫單一 `chat.history` 呼叫。舊版 `channels.webchat` 和 `gateway.webchat` 組態已停用；請執行 `openclaw doctor --fix` 將其移除。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機/連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器 Control UI 聊天分頁可以使用 Tailscale
  Serve 身分標頭。
- `gateway.auth.mode: "trusted-proxy"`：供位於具身分感知的**非迴路**代理來源後方的瀏覽器用戶端使用的反向代理驗證（請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端閘道目標。
- `session.*`：工作階段儲存與主要鍵預設值。

## 相關

- [Control UI](/zh-TW/web/control-ui)
- [儀表板](/zh-TW/web/dashboard)
