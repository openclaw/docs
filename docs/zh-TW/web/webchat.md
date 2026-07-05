---
read_when:
    - 偵錯或設定 WebChat 存取權
summary: Loopback WebChat 靜態主機與聊天 UI 的閘道 WS 用法
title: WebChat
x-i18n:
    generated_at: "2026-07-05T11:54:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d01c8e4f6962a836e9c7337bcb9ce03b90cace69e079a2c84c38108afe7c017
    source_path: web/webchat.md
    workflow: 16
---

狀態：macOS/iOS SwiftUI 聊天 UI 會直接與閘道 WebSocket 通訊。沒有嵌入式瀏覽器，也沒有本機靜態伺服器。

## 這是什麼

- 閘道的原生聊天 UI。
- 使用與其他通道相同的工作階段與路由規則。
- 確定性路由：回覆一律回到 WebChat。
- 歷史記錄一律從閘道擷取（不監看本機檔案）。如果無法連線到閘道，WebChat 會是唯讀狀態。

## 快速開始

1. 啟動閘道。
2. 開啟 WebChat UI（macOS/iOS 應用程式）或控制 UI 的聊天分頁。
3. 確認已設定有效的閘道驗證路徑（預設為共享密鑰，即使在回環上也是如此）。

## 運作方式

- UI 會連線到閘道 WebSocket，並使用 `chat.history`、`chat.send`、`chat.inject` 和 `chat.message.get` RPC 方法。
- `chat.history` 會為了穩定性而設有界限：閘道可能會截斷長文字欄位、省略大型中繼資料，並以 `[chat.history omitted: message too large]` 取代過大的項目。API 用戶端可以傳送每個請求專用的 `maxChars`，以覆寫單次呼叫的預設限制。
- 當可見的助理訊息在 `chat.history` 中遭截斷時，控制 UI 可以開啟側邊閱讀器，並透過 `chat.message.get` 按需擷取完整且已顯示正規化的項目，而不增加預設歷史記錄負載。`chat.message.get` 使用與 `chat.history` 相同的逐字稿分支和顯示規則，但會以 `messageId` 鎖定單一項目，並在無法再傳回完整內容時回傳誠實的不可用原因。
- `chat.history` 會針對僅附加工作階段檔案遵循作用中的逐字稿分支，因此廢棄的重寫分支和已被取代的提示副本不會在 WebChat 中呈現。
- 壓縮項目會呈現為「已壓縮的歷史記錄」分隔線，說明已壓縮的逐字稿會保留為檢查點，並提供開啟工作階段檢查點的操作（在權限允許時可分支或還原）。
- 控制 UI 會記住 `chat.history` 傳回的後端閘道 `sessionId`，並在後續 `chat.send` 呼叫中包含它，因此重新連線和頁面重新整理會延續同一個已儲存的對話，除非使用者開始或重設工作階段。
- `chat.send` 會接收冪等鍵（控制 UI 使用執行 ID）；閘道會對重複使用相同鍵的重複請求去重，因此同一個工作階段/訊息/附件的重試或重複進行中提交，不會建立第二次執行。
- 工作區啟動檔案和待處理的 `BOOTSTRAP.md` 指令會透過代理系統提示的 `# Project Context` 區段提供，而不是複製到 WebChat 使用者訊息中。如果啟動內容遭截斷，系統提示會改為取得簡短的「啟動內容通知」；詳細計數和設定旋鈕會保留在診斷介面上。
- `chat.history` 的顯示正規化會移除：僅供執行階段使用的 OpenClaw 內容、傳入信封包裝、內嵌傳遞指令標籤（例如 `[[reply_to_current]]`、`[[reply_to:<id>]]` 和 `[[audio_as_voice]]`）、純文字工具呼叫 XML 負載（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包含遭截斷的區塊），以及外洩的 ASCII/全形模型控制權杖。整段可見文字僅為靜默權杖 `NO_REPLY`（不區分大小寫）的助理項目會被省略。
- 標記為推理的回覆負載（`isReasoning: true`）會從 WebChat 助理內容、逐字稿重播文字和音訊內容區塊中排除，因此僅思考用途的負載不會浮現為可見的助理訊息或可播放音訊。
- `chat.inject` 會直接將助理備註附加到逐字稿，並廣播到 UI（不執行代理）。
- 已中止的執行可以讓部分助理輸出在 UI 中保持可見。當存在已緩衝輸出時，閘道會將該部分文字持久化到逐字稿歷史記錄中，並以中止中繼資料標記該項目。

### 逐字稿與傳遞模型

WebChat 有兩條不同的資料路徑：

- 工作階段 JSONL 檔案是持久的模型/執行階段逐字稿。對於一般代理執行，嵌入式 OpenClaw 執行階段會透過其工作階段管理器持久化模型可見的 `user`、`assistant` 和 `toolResult` 訊息。WebChat 不會將任意傳遞、狀態或輔助文字寫入該逐字稿。
- 閘道 `ReplyPayload` 事件是即時傳遞投影：針對 WebChat/通道顯示、區塊串流、指令標籤、媒體嵌入、TTS/音訊旗標和 UI 備援行為進行正規化。它們本身不是標準工作階段記錄。
- 需要透過 `tools.message` 取得可見回覆的測試工具，仍會使用 WebChat 作為目前執行的內部來源回覆接收端。來自該作用中 WebChat 執行且沒有目標的 `message.send`，會投影到同一個聊天並鏡像到工作階段逐字稿；WebChat 不會成為可重複使用的外送通道，也絕不會繼承 `lastChannel`。
- WebChat 只會在閘道擁有一般嵌入式代理回合之外顯示的訊息時，注入助理逐字稿項目：`chat.inject`、非代理命令回覆、已中止的部分輸出，以及 WebChat 管理的媒體逐字稿補充內容。
- 如果即時助理文字在執行期間出現，但在重新載入歷史記錄後消失，請依序檢查：原始 JSONL 是否包含助理文字、`chat.history` 顯示投影是否移除了它，然後是控制 UI 的樂觀尾端合併是否以持久化快照取代了本機傳遞狀態。

一般代理執行的最終答案應該是持久的，因為嵌入式執行階段會寫入助理 `message_end`。任何將已傳遞最終負載鏡像到逐字稿的備援，都必須先避免重複寫入嵌入式執行階段已經寫入的助理回合。

## 控制 UI 代理工具面板

- 控制 UI `/agents` 工具面板有一個由 `tools.effective(sessionKey=...)` 支援的「目前可用」檢視：這是由伺服器衍生、唯讀的目前工作階段工具清單投影，包含核心、外掛、通道擁有，以及已探索到的 MCP 伺服器工具。
- 另一個設定編輯檢視（由 `tools.catalog` 支援）涵蓋設定檔、每個代理的覆寫，以及目錄語意。
- 執行階段可用性以工作階段為範圍。在同一個代理上切換工作階段，可能會變更「目前可用」清單。如果已設定的 MCP 伺服器自上次探索以來尚未連線或變更，面板會顯示通知，而不是從讀取路徑靜默啟動 MCP 傳輸。
- 設定編輯器不代表執行階段可用；有效存取仍遵循政策優先順序（`allow`/`deny`、每個代理和提供者/通道覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 隧穿閘道 WebSocket。
- 你不需要執行獨立的 WebChat 伺服器。

## 設定參考（WebChat）

完整設定：[設定](/zh-TW/gateway/configuration)

WebChat 沒有持久化設定區段。閘道使用內建的 `chat.history` 顯示限制；API 用戶端可以傳送每個請求專用的 `maxChars`，以針對單次呼叫覆寫限制。舊版 `channels.webchat` 和 `gateway.webchat` 設定已退役；執行 `openclaw doctor --fix` 以移除它。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機/連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密鑰 WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器控制 UI 聊天分頁可以使用 Tailscale
  Serve 身分標頭。
- `gateway.auth.mode: "trusted-proxy"`：適用於位於具身分感知能力的**非回環**代理來源後方之瀏覽器用戶端的反向代理驗證（請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端閘道目標。
- `session.*`：工作階段儲存與主要金鑰預設值。

## 相關

- [控制 UI](/zh-TW/web/control-ui)
- [儀表板](/zh-TW/web/dashboard)
