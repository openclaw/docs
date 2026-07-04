---
read_when:
    - 你需要 Codex harness 執行階段支援合約
    - 你正在除錯原生 Codex 工具、鉤子、壓縮或意見回饋上傳
    - 你正在變更 OpenClaw 與 Codex 測試框架回合中的外掛行為
summary: Codex harness 的執行階段邊界、hooks、工具、權限與診斷
title: Codex 測試框架執行階段
x-i18n:
    generated_at: "2026-07-04T20:25:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

本頁記錄 Codex harness 回合的執行階段合約。若要設定與
路由，請從 [Codex harness](/zh-TW/plugins/codex-harness) 開始。若要查看設定欄位，
請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 概觀

Codex 模式並不是在底層換用不同模型呼叫的 OpenClaw。Codex 擁有更多
原生模型迴圈，而 OpenClaw 會圍繞該邊界調整其外掛、工具、工作階段與
診斷介面。

OpenClaw 仍然擁有頻道路由、工作階段檔案、可見訊息傳遞、
OpenClaw 動態工具、核准、媒體傳遞，以及逐字稿鏡像。
Codex 擁有標準原生執行緒、原生模型迴圈、原生工具
延續，以及原生壓縮。

提示路由會依照所選執行階段，而不只是提供者字串。
原生 Codex 回合會收到 Codex app-server 開發者指示，而
明確的 OpenClaw 相容性路由會保留一般 OpenClaw 系統提示，即使
它使用 Codex 風格的 OpenAI 驗證或傳輸。

原生 Codex 會根據作用中的 Codex 執行緒設定，保留 Codex 擁有的基礎/模型指示與專案文件行為。OpenClaw 會在停用 Codex 內建人格的情況下啟動並繼續原生
Codex 執行緒，使工作區人格檔案與 OpenClaw 代理身分保持權威。
輕量 OpenClaw 執行仍會保留其既有的專案文件抑制。OpenClaw
開發者指示涵蓋 OpenClaw 執行階段關注事項，例如來源頻道
傳遞、OpenClaw 動態工具、ACP 委派、配接器情境，以及
作用中代理工作區設定檔案。OpenClaw Skills 目錄與工具路由的
`MEMORY.md` 指標會投射為原生 Codex 的回合範圍協作開發者
指示。作用中的 `BOOTSTRAP.md` 內容與完整
`MEMORY.md` 後援注入仍會使用回合輸入參照情境。

## 執行緒繫結與模型變更

當 OpenClaw 工作階段附加到既有 Codex 執行緒時，下一個回合
會再次將目前選取的 OpenAI 模型、核准政策、沙箱與服務
層級傳送到 app-server。從 `openai/gpt-5.5` 切換到
`openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex 使用
新選取的模型繼續。

## 可見回覆與心跳偵測

當直接/來源聊天回合透過 Codex harness 執行時，可見回覆
預設為內部 WebChat 介面的自動最終助理傳遞。
這會讓 Codex 與 Pi harness 提示合約一致：代理正常回覆，
而 OpenClaw 會將最終文字發佈到來源對話。當直接/來源聊天應
刻意將最終助理文字保持私密，除非代理呼叫
`message(action="send")` 時，請設定
`messages.visibleReplies: "message_tool"`。

Codex 心跳偵測回合預設也會在可搜尋的 OpenClaw
工具目錄中取得 `heartbeat_respond`，因此代理可以記錄這次喚醒
應保持安靜或通知，而無需在最終文字中編碼該控制流程。

心跳偵測專用的主動性指引會在心跳偵測回合本身，以 Codex 協作模式
開發者指示傳送。一般聊天回合會還原 Codex 預設模式，而不是在其正常
執行階段提示中攜帶心跳偵測理念。當存在非空的 `HEARTBEAT.md` 時，
心跳偵測協作模式指示會將 Codex 指向該檔案，而不是內嵌其內容。

## Hook 邊界

Codex harness 有三個 hook 層：

| 層級                                  | 擁有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 外掛 hook                    | OpenClaw                 | 跨 OpenClaw 與 Codex harness 的產品/外掛相容性。                    |
| Codex app-server 擴充 middleware      | OpenClaw bundled plugins | 圍繞 OpenClaw 動態工具的每回合配接器行為。                          |
| Codex 原生 hook                       | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。                |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由
OpenClaw 外掛行為。對於支援的原生工具與權限橋接，
OpenClaw 會為 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop` 注入每執行緒 Codex 設定。

啟用 Codex app-server 核准時，也就是 `approvalPolicy` 不是
`"never"` 時，預設注入的原生 hook 設定會省略 `PermissionRequest`，讓
Codex 的 app-server 審查者與 OpenClaw 的核准橋接在審查後處理實際
升級。操作員可在需要相容性轉送時，明確將 `permission_request` 新增到
`nativeHookRelay.events`。

其他 Codex hook，例如 `SessionStart` 和 `UserPromptSubmit`，仍然是
Codex 層級控制。它們不會在 v1 合約中公開為 OpenClaw 外掛 hook。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求呼叫後執行該工具，
因此 OpenClaw 會在 harness 配接器中觸發其擁有的外掛與 middleware 行為。
對於 Codex 原生工具，Codex 擁有標準工具記錄。
OpenClaw 可以鏡像選取的事件，但除非 Codex 透過 app-server 或原生 hook
回呼公開該操作，否則它無法重寫原生 Codex 執行緒。

Codex app-server report-mode `PreToolUse` 事件會將外掛核准請求延後到相符的 app-server 核准。如果 OpenClaw `before_tool_call` hook
在原生承載設定報告核准模式（`openclaw_approval_mode` 為 `"report"`）時
回傳 `requireApproval`，原生 hook 轉送會記錄外掛核准需求，且不回傳原生決策。
當 Codex 針對同一工具使用傳送 app-server 核准請求時，OpenClaw 會開啟外掛
核准提示，並將決策對應回 Codex。Codex `PermissionRequest`
事件是另一條核准路徑，且當執行階段設定為該橋接時，仍可透過 OpenClaw
核准路由。

Codex app-server 項目通知也會為尚未由原生 `PostToolUse` 轉送涵蓋的
原生工具完成提供非同步 `after_tool_call` 觀察。這些觀察僅用於遙測與外掛
相容性；它們無法封鎖、延遲或變更原生工具呼叫。

壓縮與 LLM 生命週期投射來自 Codex app-server
通知與 OpenClaw 配接器狀態，而不是原生 Codex hook 命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是配接器層級觀察，而不是 Codex 內部請求或壓縮承載
的逐位元組擷取。

Codex 原生 `hook/started` 與 `hook/completed` app-server 通知會
投射為 `codex_app_server.hook` 代理事件，用於軌跡與偵錯。
它們不會叫用 OpenClaw 外掛 hook。

## V1 支援合約

Codex runtime v1 支援：

| 介面 | 支援狀態 | 原因 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈 | 支援 | Codex 應用程式伺服器擁有 OpenAI 回合、原生執行緒續接，以及原生工具接續。 |
| OpenClaw 頻道路由與傳遞 | 支援 | Telegram、Discord、Slack、WhatsApp、iMessage 和其他頻道都維持在模型執行階段之外。 |
| OpenClaw 動態工具 | 支援 | Codex 會要求 OpenClaw 執行這些工具，因此 OpenClaw 會留在執行路徑中。 |
| 提示與脈絡外掛 | 支援 | OpenClaw 會將 OpenClaw 特定的提示/脈絡投射到 Codex 回合中，同時讓 Codex 擁有的基礎、模型與已設定專案文件提示留在原生 Codex 路徑。OpenClaw 會停用原生執行緒的 Codex 內建人格，讓代理工作區人格檔案維持權威性。原生 Codex 開發者指示只接受明確限定於 `codex_app_server` 的命令指引；舊版全域命令提示仍保留給非 Codex 提示介面。 |
| 脈絡引擎生命週期 | 支援 | 組裝、擷取與回合後維護會圍繞 Codex 回合執行。脈絡引擎不會取代原生 Codex 壓縮。 |
| 動態工具鉤子 | 支援 | `before_tool_call`、`after_tool_call` 與工具結果中介軟體會圍繞 OpenClaw 擁有的動態工具執行。 |
| 生命週期鉤子 | 作為配接器觀察支援 | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 與 `after_compaction` 會以真實的 Codex 模式承載資料觸發。 |
| 最終答案修訂閘門 | 透過原生鉤子轉送支援 | Codex `Stop` 會轉送至 `before_agent_finalize`；`revise` 會要求 Codex 在最終化之前再進行一次模型處理。 |
| 原生 shell、修補與 MCP 封鎖或觀察 | 透過原生鉤子轉送支援 | Codex `PreToolUse` 與 `PostToolUse` 會針對已提交的原生工具介面轉送，包括 Codex 應用程式伺服器 `0.125.0` 或更新版本上的 MCP 承載資料。支援封鎖；不支援引數重寫。 |
| 原生權限政策 | 透過 Codex 應用程式伺服器核准與相容性原生鉤子轉送支援 | Codex 應用程式伺服器核准要求會在 Codex 審查後透過 OpenClaw 路由。`PermissionRequest` 原生鉤子轉送對原生核准模式採選用制，因為 Codex 會在 guardian 審查之前發出它。 |
| 應用程式伺服器軌跡擷取 | 支援 | OpenClaw 會記錄它傳送給應用程式伺服器的要求，以及它收到的應用程式伺服器通知。 |

Codex 執行階段 v1 不支援：

| 介面 | V1 邊界 | 未來路徑 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更 | Codex 原生工具前鉤子可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。 | 需要 Codex 鉤子/結構描述支援替換工具輸入。 |
| 可編輯的 Codex 原生逐字稿歷史 | Codex 擁有權威的原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來脈絡，但不應變更不受支援的內部項目。 | 如果需要原生執行緒手術，請加入明確的 Codex 應用程式伺服器 API。 |
| Codex 原生工具記錄的 `tool_result_persist` | 該鉤子會轉換 OpenClaw 擁有的逐字稿寫入，而非 Codex 原生工具記錄。 | 可以鏡像已轉換的記錄，但權威重寫需要 Codex 支援。 |
| 豐富的原生壓縮中繼資料 | OpenClaw 可以要求原生壓縮，但不會收到穩定的保留/捨棄清單、權杖差異、完成摘要或摘要承載資料。 | 需要更豐富的 Codex 壓縮事件。 |
| 壓縮介入 | OpenClaw 不允許外掛或脈絡引擎否決、重寫或取代原生 Codex 壓縮。 | 如果外掛需要否決或重寫原生壓縮，請加入 Codex 壓縮前/後鉤子。 |
| 位元組完全相符的模型 API 要求擷取 | OpenClaw 可以擷取應用程式伺服器要求與通知，但 Codex 核心會在內部建構最終的 OpenAI API 要求。 | 需要 Codex 模型要求追蹤事件或除錯 API。 |

## 原生權限與 MCP 誘導

對於 `PermissionRequest`，OpenClaw 只有在政策決定時才會回傳明確的允許或拒絕決策。無決策結果不是允許。Codex 會將其視為沒有鉤子決策，並落入自己的 guardian 或使用者核准路徑。

Codex 應用程式伺服器核准模式預設會省略此原生鉤子。當 `permission_request` 明確包含在 `nativeHookRelay.events` 中，或相容性執行階段安裝它時，會套用此行為。

當操作者為 Codex 原生權限要求選擇 `allow-always` 時，OpenClaw 會在有界工作階段時間窗內記住該精確的提供者/工作階段/工具輸入/cwd 指紋。記住的決策刻意僅限精確相符：變更命令、引數、工具承載資料或 cwd 都會產生新的核准。

當 Codex 將 `_meta.codex_approval_kind` 標示為 `"mcp_tool_call"` 時，Codex MCP 工具核准誘導會透過 OpenClaw 的外掛核准流程路由。Codex `request_user_input` 提示會傳回原始聊天，而下一則排入佇列的後續訊息會回答該原生伺服器要求，而不是被導向為額外脈絡。其他 MCP 誘導要求會以關閉方式失敗。

如需承載這些提示的一般外掛核准流程，請參閱[外掛權限要求](/zh-TW/plugins/plugin-permission-requests)。

## 佇列導向

主動執行佇列導向會對應到 Codex 應用程式伺服器 `turn/steer`。使用預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的安靜時間窗內批次處理導向模式聊天訊息，並依到達順序將其作為一個 `turn/steer` 要求傳送。

Codex 審查與手動壓縮回合可能會拒絕同一回合的導向。在這種
情況下，OpenClaw 會等待作用中的執行完成後，再開始提示。
當訊息預設應排入佇列而不是進行導向時，請使用 `/queue followup` 或 `/queue collect`。
請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

## Codex 意見回饋上傳

當使用原生 Codex
harness 的工作階段核准 `/diagnostics [note]` 時，OpenClaw 也會針對相關的
Codex 執行緒呼叫 Codex app-server `feedback/upload`。該上傳會要求 app-server 在可用時，為每個列出的執行緒
與衍生的 Codex 子執行緒包含記錄檔。

上傳會透過 Codex 的正常意見回饋路徑傳送到 OpenAI 伺服器。如果該 app-server 中停用了 Codex
意見回饋，該命令會回傳 app-server
錯誤。完成的診斷回覆會列出已傳送執行緒的頻道、OpenClaw 工作階段 ID、
Codex 執行緒 ID，以及本機 `codex resume <thread-id>` 命令。

如果你拒絕或忽略核准，OpenClaw 不會列印那些 Codex ID，也不會傳送 Codex 意見回饋。上傳不會取代本機 Gateway
診斷匯出。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)，了解核准、隱私、本機套件，以及群組聊天行為。

只有在你特別想為目前附加的執行緒上傳 Codex
意見回饋，而不需要完整 Gateway
診斷套件時，才使用 `/codex diagnostics [note]`。

## 壓縮與逐字稿鏡像

當所選模型使用 Codex harness 時，原生執行緒壓縮屬於 Codex app-server。OpenClaw 不會為 Codex 回合執行預檢壓縮，
不會以 context-engine 壓縮取代 Codex 壓縮，也不會在無法啟動原生 Codex
壓縮時，退回 OpenClaw 或公開 OpenAI 摘要。OpenClaw 會保留逐字稿鏡像，用於頻道
歷史記錄、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。

明確的壓縮要求，例如 `/compact` 或外掛要求的手動
compact 操作，會使用 `thread/compact/start` 啟動原生 Codex 壓縮。
OpenClaw 會保持該要求與共享用戶端租約開啟，直到 Codex 發出相符的
`contextCompaction` 完成項目，接著回報壓縮回合已完成。如果該終止回合超過設定的壓縮逾時，
OpenClaw 會要求原生回合中斷。租約與每執行緒壓縮圍欄會持續保留，直到 Codex 回報終止狀態或確認中斷 RPC。
如果 Codex 未在中斷寬限期內確認，OpenClaw 會先汰換連線，再釋放圍欄。遠端連線也會分離相符的執行緒繫結，使後續工作無法與未確認的遠端
回合重疊。已汰換連線上的其他回合會失敗，並可在新的用戶端上重試。
用戶端關閉、要求取消，或壓縮回合失敗都會回傳失敗的操作。

當 context engine 要求 Codex 執行緒啟動投影時，OpenClaw
會將工具呼叫名稱與 ID、輸入形狀，以及已遮蔽的工具結果內容
投影到新的 Codex 執行緒中。它不會將原始工具呼叫引數值複製到
該投影中。

鏡像會包含使用者提示、最終助理文字，以及 app-server 發出時的輕量 Codex
推理或計畫記錄。OpenClaw 會記錄原生壓縮開始與終止狀態，但不會公開
人類可讀的壓縮摘要，或 Codex 在壓縮後保留哪些項目的可稽核清單。

由於 Codex 擁有標準的原生執行緒，`tool_result_persist` 目前不會
重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 正在寫入 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

## 媒體與傳遞

OpenClaw 會繼續擁有媒體傳遞與媒體提供者選擇。圖片、
影片、音樂、PDF、TTS 與媒體理解會使用相符的提供者/模型
設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、
`pdfModel` 和 `messages.tts`。

文字、圖片、影片、音樂、TTS、核准，以及訊息工具輸出會繼續
透過一般 OpenClaw 傳遞路徑。媒體產生不需要舊版 runtime。
當 Codex 發出帶有 `savedPath` 的原生圖片產生項目時，即使 Codex
回合沒有助理文字，OpenClaw 也會透過一般回覆媒體路徑轉送該確切檔案。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [外掛 hooks](/zh-TW/plugins/hooks)
- [代理 harness 外掛](/zh-TW/plugins/sdk-agent-harness)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [軌跡匯出](/zh-TW/tools/trajectory)
