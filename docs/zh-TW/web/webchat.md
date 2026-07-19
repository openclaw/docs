---
read_when:
    - 偵錯或設定 WebChat 存取權限
summary: 供聊天 UI 使用的迴路位址 WebChat 靜態主機與閘道 WebSocket 用法
title: 網頁聊天
x-i18n:
    generated_at: "2026-07-19T14:09:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05309caff8e3fe5d14627ea9bc50667c5154a2f493ef4fd1e813d9d9bf82fbc4
    source_path: web/webchat.md
    workflow: 16
---

狀態：macOS/iOS SwiftUI 聊天介面直接與閘道 WebSocket 通訊。沒有內嵌瀏覽器，也沒有本機靜態伺服器。

## 這是什麼

- 閘道的原生聊天介面。
- 使用與其他頻道相同的工作階段和路由規則。
- 確定性路由：回覆一律傳回 WebChat。
- 歷史記錄一律從閘道擷取（不監看本機檔案）。如果無法連線至閘道，WebChat 會是唯讀狀態。

## 快速開始

1. 啟動閘道。
2. 開啟 WebChat 介面（macOS/iOS 應用程式）或控制介面的聊天分頁。
3. 確認已設定有效的閘道驗證路徑（預設使用共享密鑰，即使在回送介面上也是如此）。

## 運作方式

- 介面會連線至閘道 WebSocket，並使用 `chat.history`、`chat.send`、`chat.inject` 和 `chat.message.get` RPC 方法。
- `chat.history` 會受到限制以維持穩定性：閘道可能會截斷過長的文字欄位、省略大量中繼資料，並以 `[chat.history omitted: message too large]` 取代過大的項目。API 用戶端可傳送每次要求專用的 `maxChars`，以針對單次呼叫覆寫預設限制。
- 當 `chat.history` 中顯示的助理訊息遭到截斷時，控制介面可以開啟側邊閱讀器，並視需要透過 `chat.message.get` 擷取經完整顯示正規化的項目，而不增加預設的歷史記錄承載內容。`chat.message.get` 使用與 `chat.history` 相同的逐字稿分支和顯示規則，但會依 `messageId` 鎖定單一項目；當完整內容已無法傳回時，會如實傳回無法使用的原因。
- `chat.history` 會追蹤僅附加工作階段檔案的有效逐字稿分支，因此已放棄的重寫分支和已被取代的提示副本不會呈現在 WebChat 中。
- 壓縮項目會呈現為「已壓縮的歷史記錄」分隔線，說明壓縮後的逐字稿會保留為檢查點，並提供開啟工作階段檢查點的操作（權限允許時可建立分支或還原）。
- 控制介面會記住 `chat.history` 傳回的底層閘道 `sessionId`，並在後續的 `chat.send` 呼叫中包含該值，因此除非你啟動或重設工作階段，否則重新連線和重新整理頁面後仍會繼續同一個已儲存的對話。
- `chat.send` 接受等冪性金鑰（控制介面使用執行 ID）；閘道會對重複使用相同金鑰的要求進行去重，因此針對相同工作階段／訊息／附件重試或重複提交進行中的要求，不會建立第二次執行。
- 回覆特定訊息（按一下滑鼠右鍵 → Reply）時，會在 `chat.send` 上將目標的逐字稿 ID 以 `replyToId` 傳送。閘道會從工作階段歷史記錄中解析該訊息，並填入 Discord 回覆所使用的相同頻道無關回覆情境中繼資料：代理程式會看到 `has_reply_context`，以及包含傳送者標籤和本文、不受信任的「目前使用者訊息的回覆目標」區塊。（依照直接 WebChat 工作階段現有的位元組穩定提示政策，WebChat 提示會繼續隱藏 `reply_to_id` 等易變動的對話 ID。）沒有持久化逐字稿 ID 的回覆目標（例如待傳送的訊息）會改為在訊息本文中使用行內引文。
- 工作區啟動檔案和待處理的 `BOOTSTRAP.md` 指示會透過代理程式系統提示的 `# Project Context` 區段提供，而不會複製到 WebChat 使用者訊息中。如果啟動內容遭到截斷，系統提示會改為取得簡短的「啟動情境通知」；詳細計數和設定選項則保留在診斷介面上。
- `chat.history` 的顯示正規化會移除：僅供執行階段使用的 OpenClaw 情境、傳入封套包裝、`[[reply_to_current]]`、`[[reply_to:<id>]]` 和 `[[audio_as_voice]]` 等行內傳遞指示標籤、純文字工具呼叫 XML 承載內容（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包括截斷的區塊），以及洩漏的 ASCII／全形模型控制權杖。整段可見文字僅包含靜默權杖 `NO_REPLY`（不區分大小寫）的助理項目會被省略。
- 標示為推理的回覆承載內容（`isReasoning: true`）會從 WebChat 助理內容、逐字稿重播文字和音訊內容區塊中排除，因此僅含思考內容的承載內容不會顯示為可見的助理訊息或可播放的音訊。
- `chat.inject` 會將助理備註直接附加至逐字稿，並廣播至介面（不執行代理程式）。
- 已中止的執行可讓部分助理輸出繼續顯示在介面中。當存在已緩衝的輸出時，閘道會將該部分文字持久化至逐字稿歷史記錄，並以中止中繼資料標記該項目。

### 逐字稿與傳遞模型

WebChat 有兩條獨立的資料路徑：

- SQLite 逐字稿資料列是持久的模型／執行階段逐字稿。對於一般代理程式執行，內嵌的 OpenClaw 執行階段會透過工作階段存取器持久化模型可見的 `user`、`assistant` 和 `toolResult` 訊息。WebChat 不會將任意傳遞、狀態或輔助文字寫入該逐字稿。
- 閘道 `ReplyPayload` 事件是即時傳遞投影：針對 WebChat／頻道顯示、區塊串流、指示標籤、媒體內嵌、TTS／音訊旗標和介面後援行為進行正規化。這些事件本身不是標準工作階段記錄。
- 需要透過 `tools.message` 顯示回覆的測試框架，仍會使用 WebChat 作為目前執行的內部來源回覆接收端。來自該有效 WebChat 執行且沒有目標的 `message.send` 會投影至同一個聊天，並鏡像至工作階段逐字稿；WebChat 不會成為可重複使用的外寄頻道，也絕不會繼承 `lastChannel`。
- 只有當閘道擁有一般內嵌代理程式回合以外所顯示的訊息時，WebChat 才會插入助理逐字稿項目：`chat.inject`、非代理程式命令回覆、已中止的部分輸出，以及 WebChat 管理的媒體逐字稿補充內容。
- 如果執行期間顯示即時助理文字，但重新載入歷史記錄後消失，請依序檢查：SQLite 逐字稿是否包含助理文字、`chat.history` 顯示投影是否將其移除，接著檢查控制介面的樂觀尾端合併是否以持久化快照取代本機傳遞狀態。

一般代理程式執行的最終答案應可持久保存，因為內嵌執行階段會寫入助理 `message_end`。任何將已傳遞最終承載內容鏡像至逐字稿的後援機制，都必須先避免重複內嵌執行階段已寫入的助理回合。

## 控制介面代理程式工具面板

- 控制介面的 `/agents` 工具面板具有由 `tools.effective(sessionKey=...)` 支援的「目前可用」檢視：這是由伺服器衍生、唯讀的目前工作階段工具清單投影，其中包含核心、外掛、頻道擁有，以及已探索到的 MCP 伺服器工具。
- 另一個設定編輯檢視（由 `tools.catalog` 支援）涵蓋設定檔、每個代理程式的覆寫，以及目錄語意。
- 執行階段可用性以工作階段為範圍。在同一個代理程式上切換工作階段可能會變更「目前可用」清單。如果已設定的 MCP 伺服器自上次探索後尚未連線或已有變更，面板會顯示通知，而不會從讀取路徑悄悄啟動 MCP 傳輸。
- 設定編輯器不代表執行階段可用性；有效存取權仍遵循政策優先順序（`allow`/`deny`、每個代理程式及提供者／頻道覆寫）。

## 遠端使用

- 遠端模式會透過 SSH/Tailscale 建立閘道 WebSocket 通道。
- 你不需要執行個別的 WebChat 伺服器。

## 設定參考（WebChat）

完整設定：[設定](/zh-TW/gateway/configuration)

WebChat 沒有持久化設定區段。閘道使用內建的 `chat.history` 顯示限制；API 用戶端可傳送每次要求專用的 `maxChars`，針對單次呼叫覆寫該限制。舊版 `channels.webchat` 和 `gateway.webchat` 設定已淘汰；請執行 `openclaw doctor --fix` 將其移除。

相關全域選項：

- `gateway.port`、`gateway.bind`：WebSocket 主機／連接埠。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密鑰 WebSocket 驗證。
- `gateway.auth.allowTailscale`：啟用時，瀏覽器控制介面的聊天分頁可以使用 Tailscale
  Serve 身分識別標頭。
- `gateway.auth.mode: "trusted-proxy"`：供身分識別感知的**非回送** Proxy 來源後方瀏覽器用戶端使用的反向 Proxy 驗證（請參閱[受信任的 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：遠端閘道目標。
- `session.*`：工作階段儲存空間與主要金鑰預設值。

## 相關內容

- [控制介面](/zh-TW/web/control-ui)
- [儀表板](/zh-TW/web/dashboard)
