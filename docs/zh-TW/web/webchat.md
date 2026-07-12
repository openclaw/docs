---
read_when:
    - 偵錯或設定 WebChat 存取權限
summary: 用於聊天 UI 的迴路位址 WebChat 靜態主機與閘道 WebSocket 使用方式
title: WebChat
x-i18n:
    generated_at: "2026-07-12T14:53:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

狀態：macOS/iOS SwiftUI 聊天使用者介面直接與閘道 WebSocket 通訊。沒有嵌入式瀏覽器，也沒有本機靜態伺服器。

## 這是什麼

- 閘道的原生聊天使用者介面。
- 使用與其他頻道相同的工作階段和路由規則。
- 決定性路由：回覆一律傳回 WebChat。
- 歷史記錄一律從閘道擷取（不監看本機檔案）。如果無法連線至閘道，WebChat 會處於唯讀狀態。

## 快速開始

1. 啟動閘道。
2. 開啟 WebChat 使用者介面（macOS/iOS 應用程式）或控制介面的聊天分頁。
3. 確認已設定有效的閘道驗證路徑（預設使用共用密鑰，即使在回送介面上也是如此）。

## 運作方式

- 使用者介面會連線至閘道 WebSocket，並使用 `chat.history`、`chat.send`、`chat.inject` 和 `chat.message.get` RPC 方法。
- 為確保穩定性，`chat.history` 設有界限：閘道可能截斷過長的文字欄位、省略龐大的中繼資料，並將過大的項目替換為 `[chat.history omitted: message too large]`。API 用戶端可隨每個要求傳送 `maxChars`，以針對單次呼叫覆寫預設限制。
- 當可見的助理訊息在 `chat.history` 中遭到截斷時，控制介面可以開啟側邊閱讀器，並透過 `chat.message.get` 視需要擷取完整且經顯示正規化的項目，而不增加預設歷史記錄承載內容。`chat.message.get` 使用與 `chat.history` 相同的逐字稿分支和顯示規則，但會透過 `messageId` 鎖定單一項目；若已無法傳回完整內容，則會如實傳回無法使用的原因。
- 對於僅附加的工作階段檔案，`chat.history` 會遵循作用中的逐字稿分支，因此 WebChat 不會呈現已放棄的重寫分支和已被取代的提示詞副本。
- 壓縮項目會呈現為「已壓縮的歷史記錄」分隔線，並說明壓縮後的逐字稿會保留為檢查點，同時提供開啟工作階段檢查點的動作（可建立分支或還原，視權限是否允許）。
- 控制介面會記住 `chat.history` 傳回的後端閘道 `sessionId`，並在後續的 `chat.send` 呼叫中包含該值，因此重新連線和重新整理頁面後會繼續使用同一個已儲存的對話，除非使用者開始或重設工作階段。
- `chat.send` 接受等冪鍵（控制介面使用執行 ID）；閘道會將重複使用相同鍵的重複要求去重，因此針對相同工作階段／訊息／附件重試或重複提交進行中的要求時，不會建立第二次執行。
- 工作區啟動檔案和待處理的 `BOOTSTRAP.md` 指示會透過代理程式系統提示詞的 `# Project Context` 區段提供，而不會複製到 WebChat 使用者訊息中。如果啟動內容遭到截斷，系統提示詞會改為取得簡短的「啟動內容通知」；詳細計數和設定調整項則留在診斷介面上。
- `chat.history` 的顯示正規化會移除：僅供執行階段使用的 OpenClaw 上下文、傳入封裝包裝、例如 `[[reply_to_current]]`、`[[reply_to:<id>]]` 和 `[[audio_as_voice]]` 的行內傳遞指示標籤、純文字工具呼叫 XML 承載內容（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包括遭截斷的區塊），以及洩漏的 ASCII／全形模型控制權杖。若助理項目的全部可見文字只有靜默權杖 `NO_REPLY`（不區分大小寫），則會省略該項目。
- 標記為推理的回覆承載內容（`isReasoning: true`）會從 WebChat 助理內容、逐字稿重播文字和音訊內容區塊中排除，因此僅含思考內容的承載內容不會顯示為可見的助理訊息或可播放的音訊。
- `chat.inject` 會直接將助理備註附加至逐字稿，並廣播至使用者介面（不執行代理程式）。
- 已中止的執行可讓部分助理輸出繼續顯示在使用者介面中。若存在已緩衝的輸出，閘道會將該部分文字保存至逐字稿歷史記錄，並以中止中繼資料標記該項目。

### 逐字稿與傳遞模型

WebChat 有兩條獨立的資料路徑：

- SQLite 逐字稿資料列是持久的模型／執行階段逐字稿。對於一般代理程式執行，嵌入式 OpenClaw 執行階段會透過工作階段存取器保存模型可見的 `user`、`assistant` 和 `toolResult` 訊息。WebChat 不會將任意的傳遞、狀態或輔助文字寫入該逐字稿。
- 閘道 `ReplyPayload` 事件是即時傳遞投影：針對 WebChat／頻道顯示、區塊串流、指示標籤、媒體嵌入、TTS／音訊旗標和使用者介面備援行為進行正規化。這些事件本身並非標準工作階段記錄。
- 需要透過 `tools.message` 顯示回覆的測試框架，仍會使用 WebChat 作為目前執行的內部來源回覆接收端。從該作用中 WebChat 執行發出的無目標 `message.send` 會投影至同一個聊天，並鏡像至工作階段逐字稿；WebChat 不會成為可重複使用的對外頻道，也絕不會繼承 `lastChannel`。
- 只有當閘道在一般嵌入式代理程式回合以外擁有顯示訊息時，WebChat 才會注入助理逐字稿項目：`chat.inject`、非代理程式命令回覆、已中止的部分輸出，以及由 WebChat 管理的媒體逐字稿補充內容。
- 如果即時助理文字在執行期間出現，但在重新載入歷史記錄後消失，請依序檢查：SQLite 逐字稿是否包含助理文字、`chat.history` 顯示投影是否將其移除，接著檢查控制介面的樂觀尾端合併是否以持久化快照取代了本機傳遞狀態。

一般代理程式執行的最終回答應具有持久性，因為嵌入式執行階段會寫入助理 `message_end`。任何將已傳遞的最終承載內容鏡像至逐字稿的備援機制，都必須先避免重複嵌入式執行階段已寫入的助理回合。

## 控制介面代理程式工具面板

- 控制介面的 `/agents` 工具面板包含由 `tools.effective(sessionKey=...)` 支援的「目前可用」檢視：這是由伺服器衍生的目前工作階段工具清單唯讀投影，包含核心、外掛、頻道擁有，以及已探索到的 MCP 伺服器工具。
- 另一個設定編輯檢視（由 `tools.catalog` 支援）涵蓋設定檔、每個代理程式的覆寫，以及目錄語意。
- 執行階段可用性以工作階段為範圍。在同一代理程式上切換工作階段可能會變更「目前可用」清單。如果已設定的 MCP 伺服器自上次探索後尚未連線或已發生變更，面板會顯示通知，而不會從讀取路徑默默啟動 MCP 傳輸。
- 設定編輯器不代表執行階段可用性；有效存取權仍遵循原則優先順序（`allow`／`deny`、每個代理程式及提供者／頻道的覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 建立閘道 WebSocket 通道。
- 你不需要執行獨立的 WebChat 伺服器。

## 設定參考（WebChat）

完整設定：[設定](/zh-TW/gateway/configuration)

WebChat 沒有持久化設定區段。閘道使用內建的 `chat.history` 顯示限制；API 用戶端可隨要求傳送 `maxChars`，針對單次呼叫覆寫該限制。舊版 `channels.webchat` 和 `gateway.webchat` 設定已淘汰；請執行 `openclaw doctor --fix` 將其移除。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機／連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共用密鑰 WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器控制介面的聊天分頁可使用 Tailscale
  Serve 身分識別標頭。
- `gateway.auth.mode: "trusted-proxy"`：供位於可感知身分識別的**非回送** Proxy 來源後方之瀏覽器用戶端使用的反向 Proxy 驗證（請參閱[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端閘道目標。
- `session.*`：工作階段儲存空間和主要金鑰預設值。

## 相關內容

- [控制介面](/zh-TW/web/control-ui)
- [儀表板](/zh-TW/web/dashboard)
