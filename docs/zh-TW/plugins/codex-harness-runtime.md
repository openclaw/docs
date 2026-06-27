---
read_when:
    - 你需要 Codex 執行框架的執行階段支援合約
    - 你正在偵錯原生 Codex 工具、鉤子、壓縮或意見回饋上傳
    - 你正在變更 OpenClaw 與 Codex harness 回合中的外掛行為
summary: Codex harness 的執行階段邊界、hook、工具、權限與診斷
title: Codex harness 執行階段
x-i18n:
    generated_at: "2026-06-27T19:35:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

本頁記錄 Codex 執行框架回合的執行階段合約。如需設定與路由，請先參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。如需設定欄位，請參閱 [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)。

## 概觀

Codex 模式並不是在底層換成不同模型呼叫的 OpenClaw。Codex 擁有更多原生模型迴圈，而 OpenClaw 會圍繞該邊界調整其外掛、工具、工作階段與診斷介面。

OpenClaw 仍然擁有頻道路由、工作階段檔案、可見訊息傳遞、OpenClaw 動態工具、核准、媒體傳遞，以及逐字稿鏡像。Codex 擁有標準原生執行緒、原生模型迴圈、原生工具延續，以及原生壓縮。

提示路由會依照選取的執行階段，而不只是供應商字串。原生 Codex 回合會收到 Codex app-server 開發者指示，而明確的 OpenClaw 相容性路由會保留一般 OpenClaw 系統提示，即使它使用 Codex 風格的 OpenAI 驗證或傳輸。

原生 Codex 會依照目前 Codex 執行緒設定，保留 Codex 所擁有的基礎／模型指示與專案文件行為。OpenClaw 會在停用 Codex 內建人格的狀態下啟動並恢復原生 Codex 執行緒，讓工作區人格檔案與 OpenClaw 代理身分維持權威性。輕量 OpenClaw 執行仍會保留其既有的專案文件抑制。OpenClaw 開發者指示涵蓋 OpenClaw 執行階段關注事項，例如來源頻道傳遞、OpenClaw 動態工具、ACP 委派、配接器情境，以及作用中代理工作區設定檔。OpenClaw skill 目錄與經工具路由的 `MEMORY.md` 指標，會投射為原生 Codex 的回合範圍協作開發者指示。作用中的 `BOOTSTRAP.md` 內容與完整 `MEMORY.md` 備援注入仍會使用回合輸入參考情境。

## 執行緒繫結與模型變更

當 OpenClaw 工作階段附加到既有 Codex 執行緒時，下一個回合會再次將目前選取的 OpenAI 模型、核准政策、沙箱與服務層級傳送給 app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex 使用新選取的模型繼續。

## 可見回覆與心跳偵測

當直接／來源聊天回合透過 Codex 執行框架執行時，內部 WebChat 介面的可見回覆預設為自動傳遞最終助理回覆。這會讓 Codex 與 Pi 執行框架提示合約保持一致：代理正常回覆，而 OpenClaw 會將最終文字張貼到來源對話。當直接／來源聊天應刻意讓最終助理文字保持私密，除非代理呼叫 `message(action="send")` 時，請設定 `messages.visibleReplies: "message_tool"`。

Codex 心跳偵測回合預設也會在可搜尋的 OpenClaw 工具目錄中取得 `heartbeat_respond`，因此代理可以記錄這次喚醒應保持安靜或發出通知，而不必在最終文字中編碼該控制流程。

心跳偵測專用的主動性指引會在心跳偵測回合本身，以 Codex 協作模式開發者指示傳送。一般聊天回合會還原 Codex 預設模式，而不會在其一般執行階段提示中攜帶心跳偵測理念。當存在非空的 `HEARTBEAT.md` 時，心跳偵測協作模式指示會指向該檔案，而不是內嵌其內容。

## Hook 邊界

Codex 執行框架有三個 hook 層：

| 層                                    | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 外掛 hook                    | OpenClaw                 | OpenClaw 與 Codex 執行框架之間的產品／外掛相容性。                 |
| Codex app-server 擴充中介軟體         | OpenClaw bundled plugins | 圍繞 OpenClaw 動態工具的逐回合配接器行為。                         |
| Codex 原生 hook                       | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。               |

OpenClaw 不使用專案或全域 Codex `hooks.json` 檔案來路由 OpenClaw 外掛行為。針對支援的原生工具與權限橋接，OpenClaw 會為 `PreToolUse`、`PostToolUse`、`PermissionRequest` 與 `Stop` 注入逐執行緒 Codex 設定。

啟用 Codex app-server 核准時，也就是 `approvalPolicy` 不是 `"never"`，預設注入的原生 hook 設定會省略 `PermissionRequest`，讓 Codex 的 app-server 審查者與 OpenClaw 的核准橋接在審查後處理真正的升級。當操作員需要相容性轉送時，可以明確將 `permission_request` 加入 `nativeHookRelay.events`。

其他 Codex hook，例如 `SessionStart` 與 `UserPromptSubmit`，仍然是 Codex 層級控制。它們不會在 v1 合約中公開為 OpenClaw 外掛 hook。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求呼叫後執行該工具，因此 OpenClaw 會在執行框架配接器中觸發它所擁有的外掛與中介軟體行為。對於 Codex 原生工具，Codex 擁有標準工具記錄。OpenClaw 可以鏡像選定事件，但除非 Codex 透過 app-server 或原生 hook 回呼公開該操作，否則 OpenClaw 無法重寫原生 Codex 執行緒。

Codex app-server 報告模式 `PreToolUse` 事件會將外掛核准請求延後到相符的 app-server 核准。如果 OpenClaw `before_tool_call` hook 在原生承載設定報告核准模式（`openclaw_approval_mode` 為 `"report"`）時回傳 `requireApproval`，原生 hook 轉送會記錄外掛核准要求，且不回傳原生決策。當 Codex 為同一工具使用傳送 app-server 核准請求時，OpenClaw 會開啟外掛核准提示，並將決策映射回 Codex。Codex `PermissionRequest` 事件是獨立的核准路徑，當執行階段設定為使用該橋接時，仍可透過 OpenClaw 核准路由。

Codex app-server 項目通知也會為尚未由原生 `PostToolUse` 轉送涵蓋的原生工具完成，提供非同步 `after_tool_call` 觀察。這些觀察僅用於遙測與外掛相容性；它們無法阻擋、延遲或變更原生工具呼叫。

壓縮與 LLM 生命週期投射來自 Codex app-server 通知與 OpenClaw 配接器狀態，而不是原生 Codex hook 命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 與 `llm_output` 事件是配接器層級觀察，而不是逐位元組擷取 Codex 的內部請求或壓縮承載。

Codex 原生 `hook/started` 與 `hook/completed` app-server 通知會投射為 `codex_app_server.hook` 代理事件，用於軌跡與偵錯。它們不會叫用 OpenClaw 外掛 hook。

## V1 支援合約

Codex 執行階段 v1 支援：

| 介面                                          | 支援                                                                             | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈                 | 支援                                                                             | Codex app-server 擁有 OpenAI 回合、原生執行緒恢復，以及原生工具延續。                                                                                                                                                                                                                                                                                                                                                                                                              |
| OpenClaw 頻道路由與傳遞                      | 支援                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 和其他頻道都保持在模型執行階段之外。                                                                                                                                                                                                                                                                                                                                                                                                  |
| OpenClaw 動態工具                            | 支援                                                                             | Codex 會要求 OpenClaw 執行這些工具，因此 OpenClaw 會留在執行路徑中。                                                                                                                                                                                                                                                                                                                                                                                                               |
| 提示與內容外掛                               | 支援                                                                             | OpenClaw 會將 OpenClaw 專屬的提示/內容投射到 Codex 回合中，同時把 Codex 擁有的基礎、模型和已設定專案文件提示留在原生 Codex 路徑。OpenClaw 會停用 Codex 對原生執行緒的內建人格，讓代理工作區人格檔案保持權威性。原生 Codex 開發者指令只接受明確限定在 `codex_app_server` 範圍內的命令指引；舊版全域命令提示仍保留給非 Codex 提示介面。 |
| 內容引擎生命週期                             | 支援                                                                             | 組裝、擷取和回合後維護會圍繞 Codex 回合執行。內容引擎不會取代原生 Codex 壓縮。                                                                                                                                                                                                                                                                                                                                                                                                     |
| 動態工具鉤子                                 | 支援                                                                             | `before_tool_call`、`after_tool_call` 和工具結果中介軟體會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                                                                                                                                                                                                                                                                                                       |
| 生命週期鉤子                                 | 以配接器觀察支援                                                                 | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以真實的 Codex 模式酬載觸發。                                                                                                                                                                                                                                                                                                                                                                    |
| 最終答案修訂閘門                             | 透過原生鉤子轉送支援                                                             | Codex `Stop` 會轉送到 `before_agent_finalize`；`revise` 會要求 Codex 在最終化之前再執行一次模型傳遞。                                                                                                                                                                                                                                                                                                                                                                               |
| 原生 shell、patch 和 MCP 封鎖或觀察          | 透過原生鉤子轉送支援                                                             | Codex `PreToolUse` 和 `PostToolUse` 會針對已提交的原生工具介面轉送，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 酬載。支援封鎖；不支援改寫引數。                                                                                                                                                                                                                                                                                                                            |
| 原生權限政策                                 | 透過 Codex app-server 核准和相容性原生鉤子轉送支援                               | Codex app-server 核准請求會在 Codex 審查後經由 OpenClaw 路由。`PermissionRequest` 原生鉤子轉送對原生核准模式採選擇加入，因為 Codex 會在守護程式審查前發出它。                                                                                                                                                                                                                                                                                                                      |
| App-server 軌跡擷取                          | 支援                                                                             | OpenClaw 會記錄它傳送給 app-server 的請求，以及它收到的 app-server 通知。                                                                                                                                                                                                                                                                                                                                                                                                          |

Codex 執行階段 v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                         | 未來路徑                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生工具前置鉤子可以封鎖，但 OpenClaw 不會改寫 Codex 原生工具引數。                                                                      | 需要 Codex 鉤子/結構描述支援替換工具輸入。                                                |
| 可編輯的 Codex 原生逐字稿歷史                       | Codex 擁有權威的原生執行緒歷史。OpenClaw 擁有鏡像並可投射未來內容，但不應變更未支援的內部結構。                                               | 如果需要原生執行緒手術，請加入明確的 Codex app-server API。                              |
| Codex 原生工具記錄的 `tool_result_persist`          | 該鉤子會轉換 OpenClaw 擁有的逐字稿寫入，而不是 Codex 原生工具記錄。                                                                            | 可鏡像轉換後的記錄，但權威改寫需要 Codex 支援。                                          |
| 豐富的原生壓縮中繼資料                              | OpenClaw 可以要求原生壓縮，但不會收到穩定的保留/捨棄清單、權杖差異、完成摘要或摘要酬載。                                                      | 需要更豐富的 Codex 壓縮事件。                                                            |
| 壓縮介入                                            | OpenClaw 不允許外掛或內容引擎否決、改寫或取代原生 Codex 壓縮。                                                                                 | 如果外掛需要否決或改寫原生壓縮，請加入 Codex 壓縮前/後鉤子。                            |
| 逐位元組模型 API 請求擷取                           | OpenClaw 可以擷取 app-server 請求和通知，但 Codex 核心會在內部建構最終 OpenAI API 請求。                                                       | 需要 Codex 模型請求追蹤事件或偵錯 API。                                                  |

## 原生權限與 MCP 徵詢

對於 `PermissionRequest`，OpenClaw 只會在政策做出決定時回傳明確的允許或拒絕決定。沒有決定的結果不是允許。Codex 會將它視為沒有鉤子決定，並落入自己的守護程式或使用者核准路徑。

Codex app-server 核准模式預設會省略這個原生鉤子。當 `permission_request` 明確包含在 `nativeHookRelay.events` 中，或相容性執行階段安裝它時，會套用此行為。

當操作員針對 Codex 原生權限請求選擇 `allow-always` 時，OpenClaw 會在受限的工作階段視窗內記住該精確的供應商/工作階段/工具輸入/cwd 指紋。記住的決定刻意只採精確比對：已變更的命令、引數、工具酬載或 cwd 都會建立新的核准。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准徵詢會透過 OpenClaw 的外掛核准流程路由。Codex `request_user_input` 提示會傳回原始聊天，而下一則排入佇列的後續訊息會回答該原生伺服器請求，而不是被導向為額外內容。其他 MCP 徵詢請求會失敗關閉。

如需承載這些提示的一般外掛核准流程，請參閱[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)。

## 佇列導向

作用中執行佇列導向會對應到 Codex app-server `turn/steer`。使用預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在已設定的靜默視窗內批次處理導向模式聊天訊息，並依抵達順序作為一個 `turn/steer` 請求傳送。

Codex 審查和手動壓縮回合可能會拒絕同回合導向。在這種
情況下，OpenClaw 會等待作用中的執行完成，再開始處理提示。
當訊息預設應排入佇列而不是導向時，請使用 `/queue followup` 或 `/queue collect`。
請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

## Codex 意見回饋上傳

當使用原生 Codex 執行框架的工作階段核准 `/diagnostics [note]` 時，OpenClaw
也會針對相關 Codex thread 呼叫 Codex app-server `feedback/upload`。此上傳會要求
app-server 在可用時，為每個列出的 thread 和衍生的 Codex 子 thread 納入日誌。

上傳會透過 Codex 正常的意見回饋路徑送往 OpenAI 伺服器。如果該 app-server
停用了 Codex 意見回饋，命令會返回 app-server 錯誤。完成的診斷回覆會列出已傳送的 thread
所屬的通道、OpenClaw 工作階段 ID、Codex thread ID，以及本機 `codex resume <thread-id>` 命令。

如果你拒絕或忽略核准，OpenClaw 不會列印那些 Codex ID，也不會傳送 Codex 意見回饋。
此上傳不會取代本機閘道診斷匯出。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)，了解
核准、隱私、本機套件和群組聊天行為。

只有在你明確想為目前附加的 thread 上傳 Codex 意見回饋，而不需要完整閘道診斷套件時，
才使用 `/codex diagnostics [note]`。

## 壓縮和逐字稿鏡像

當所選模型使用 Codex 執行框架時，原生 thread 壓縮由 Codex app-server 負責。
OpenClaw 不會為 Codex 回合執行預檢壓縮，不會以 context-engine 壓縮取代 Codex 壓縮，
也不會在原生 Codex 壓縮無法啟動時，回退到 OpenClaw 或公開 OpenAI 摘要。
OpenClaw 會保留逐字稿鏡像，用於通道歷史記錄、搜尋、`/new`、`/reset`，以及未來切換模型或執行框架。

明確的壓縮請求，例如 `/compact` 或外掛要求的手動壓縮操作，會透過 `thread/compact/start`
啟動原生 Codex 壓縮。OpenClaw 會在啟動該原生操作後返回。它不會等待完成、強加另外的
OpenClaw 逾時、重新啟動共用的 Codex app-server，或將該操作記錄為由 OpenClaw 完成的壓縮。

當 context engine 要求 Codex thread-bootstrap 投影時，OpenClaw 會將工具呼叫名稱與 ID、輸入形狀，
以及已遮蔽的工具結果內容投影到新的 Codex thread。它不會把原始工具呼叫引數值複製到該投影中。

鏡像會包含使用者提示、最終助理文字，以及 app-server 發出時的輕量 Codex 推理或計畫記錄。
目前，OpenClaw 只有在它請求壓縮時，才記錄明確的原生壓縮開始訊號。它不會公開
人類可讀的壓縮摘要，也不會公開可稽核的清單來說明 Codex 在壓縮後保留了哪些項目。

因為 Codex 擁有正式的原生 thread，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。
它只會在 OpenClaw 寫入由 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

## 媒體與傳遞

OpenClaw 會繼續負責媒體傳遞和媒體提供者選擇。圖片、影片、音樂、PDF、TTS 和媒體理解會使用相符的提供者/模型設定，
例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文字、圖片、影片、音樂、TTS、核准和訊息工具輸出會繼續透過正常的 OpenClaw 傳遞路徑。
媒體生成不需要舊版執行階段。
當 Codex 發出帶有 `savedPath` 的原生圖片生成項目時，即使 Codex 回合沒有助理文字，OpenClaw
也會透過正常的回覆媒體路徑轉送該確切檔案。

## 相關

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [外掛鉤子](/zh-TW/plugins/hooks)
- [代理執行框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [軌跡匯出](/zh-TW/tools/trajectory)
