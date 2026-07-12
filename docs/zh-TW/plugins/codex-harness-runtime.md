---
read_when:
    - 你需要 Codex 執行框架的執行階段支援契約
    - 你正在偵錯原生 Codex 工具、掛鉤、壓縮或意見回饋上傳
    - 你正在變更 OpenClaw 與 Codex 執行框架回合中的外掛行為
summary: Codex 控制框架的執行階段邊界、掛鉤、工具、權限與診斷
title: Codex 控制框架執行階段
x-i18n:
    generated_at: "2026-07-12T14:39:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex 控制框架回合的執行階段合約。如需設定與路由資訊，請參閱
[Codex 控制框架](/zh-TW/plugins/codex-harness)。如需設定欄位資訊，請參閱
[Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)。

## 概觀

Codex 負責原生模型迴圈、原生對話串續接、原生工具接續，以及原生壓縮。OpenClaw 負責頻道路由、工作階段檔案、可見訊息傳遞、OpenClaw 動態工具、核准、媒體傳遞，以及該邊界周圍的逐字稿鏡像。

提示詞路由依循所選的執行階段，而不只是提供者字串。原生 Codex 回合會取得 Codex app-server 開發者指示；明確的 OpenClaw 相容性路由即使使用 Codex 形式的 OpenAI 驗證或傳輸方式，仍會保留一般的 OpenClaw 系統提示詞。

OpenClaw 啟動及續接原生 Codex 對話串時，會停用 Codex 的內建個性（`personality: "none"`），讓工作區個性檔案和 OpenClaw 代理程式身分維持權威性。除此之外，原生 Codex 仍會保留由 Codex 管理的基礎／模型指示及專案文件載入。輕量型 OpenClaw 執行（例如排程）仍會抑制專案文件載入。

OpenClaw 開發者指示涵蓋 OpenClaw 執行階段相關事項：來源頻道傳遞、OpenClaw 動態工具、ACP 委派、介面卡情境，以及作用中代理程式工作區的設定檔。Skill 目錄及透過工具路由的 `MEMORY.md` 指標會投射為回合範圍的協作開發者指示。當記憶工具無法使用時，作用中的 `BOOTSTRAP.md` 內容與完整的 `MEMORY.md` 會改以純文字回合輸入情境提供。

大多數 OpenClaw 動態工具使用可搜尋的 `openclaw` 命名空間。標示為 `catalogMode: "direct-only"` 的工具使用 `openclaw_direct`，Codex 會將其以 `DirectModelOnly` 形式直接保持為模型可見，而不會將其開放給巢狀的 Code Mode 執行。

## 對話串繫結與模型變更

當 OpenClaw 工作階段附加至現有的 Codex 對話串時，下一個回合會將目前選取的模型、核准政策、沙箱、核准審查者及服務層級重新傳送至 app-server。從 `openai/gpt-5.5` 切換至 `openai/gpt-5.2` 會保留對話串繫結，但要求 Codex 使用新選取的模型繼續執行。

受監督的繫結是例外。OpenClaw 模型選擇器會保持鎖定，續接時會省略模型與提供者覆寫，讓 Codex 還原標準對話串中持久儲存的模型與提供者。另一個原生 Codex 控制項可以變更這組持久儲存的配對，而初始快照可能會產生 Codex 一般的模型差異警告；外層的 OpenClaw 模型與備援鏈絕不會替代其中任何一項。

## 監督與安全接續

Codex 監督是同一個 `codex` 外掛的選用功能。它透過獨立連線探索原生對話串，並僅將未封存的工作階段投射至閘道目錄。若未明確設定 `appServer` 連線，該連線會使用受管理的使用者主目錄 stdio，而一般控制框架仍維持代理程式範圍。清單與中繼資料讀取屬於被動操作：不會續接對話串、不會讓 OpenClaw 訂閱其即時事件，也不會回應其核准要求。

對於閘道電腦上已儲存或閒置的工作階段，**以分支繼續**會建立一般且模型鎖定的聊天，並鏡像有界限的使用者與助理歷程，直到來源中最後一個已持久儲存的終止回合。第一個一般聊天回合會安裝實際的核准處理常式，並使用暫時的原生分支來固定快照，而不覆寫模型或提供者。Codex App Server 會使用目前的原生設定並傳回選取的配對；如果該模型與來源最後記錄的模型不同，就會發出一般警告。在同一個監督連線上，OpenClaw 會依據其 cwd 與執行階段政策，啟動以 `appServer` 為來源的標準 Codex 控制框架對話串，並在該次初始啟動中完全使用傳回的模型與提供者、注入有界限的可見歷程，然後封存暫時分支。來源絕不會被續接。標準對話串具有完整的 OpenClaw 控制框架工具介面；來源中的推理、工具呼叫和工具結果不會複製到其中。私人連線範圍會在待處理與已提交的繫結狀態中持續存在，因此後續每個回合都會使用該連線及其原生驗證與提供者設定。監督遭停用或繫結／連線發生偏移時，系統會採取失敗關閉，而不會切換至一般的代理程式主目錄控制框架。

原始命令列介面或 VS Code 來源仍可出現在兩個目錄中。標準分支是原生 Codex 對話串，但其來源種類為 `appServer`；原生用戶端可能會篩除此來源種類，因此不保證它會出現在 Codex Desktop 中。

作用中的來源無法啟動新分支或封存；現有的受監督聊天仍可開啟。`notLoaded` 表示活動狀態不明，而非閒置；只有在明確確認沒有其他執行器，並重新讀取處理程序本機狀態後，OpenClaw 才允許封存本機的 `idle` 或 `notLoaded` 資料列。Codex 會在單一 App Server 處理程序內序列化對話串異動，但不提供跨處理程序的獨占執行器或核准擁有者租約，因此該讀取作業無法證明其他處理程序未使用該對話串。OpenClaw 會封鎖由 Codex 分頁式後代查詢所傳回、確切目標或任何未封存且已衍生後代的已知作用中繫結擁有者。列舉錯誤、循環及耗盡安全限制時，都會採取失敗關閉。原生封存仍可能與另一個處理程序中的新回合發生競爭，因此確認範圍涵蓋未知用戶端，以及狀態讀取與封存之間的時間差。受監督且模型鎖定的聊天在保護原生繫結期間無法刪除。

配對節點目錄在初始版本中僅保留中繼資料。目前的
節點叫用邊界採用請求／回應模式，無法承載真正的 Codex 控制框架
繫結所需的長時間回合事件、核准請求或串流輸出。因此，即使
該列處於閒置狀態，遠端 **繼續** 和 **封存** 仍無法使用。

如需操作員設定及可見的 Control UI 行為，請參閱 [Codex 監督](/zh-TW/plugins/codex-supervision)。

## 可見回覆與心跳偵測

透過 Codex 控制框架進行的直接／來源聊天回合，預設會自動將最終
助理回覆傳送至內部 WebChat 介面，這與 Pi 控制框架合約一致：
代理程式會正常回覆，而 OpenClaw 會將最終文字發布至來源對話。
將 `messages.visibleReplies: "message_tool"` 設定為僅在代理程式呼叫
`message(action="send")` 時才傳送，否則最終助理文字會保持私密。

Codex 心跳偵測回合預設會在可搜尋的 OpenClaw 工具目錄中取得
`heartbeat_respond`，讓代理程式可以記錄此次喚醒應保持靜默或發出通知。
心跳偵測的主動性指引會以 Codex 協作模式的開發者指示傳送，且僅限於
該心跳偵測回合；一般聊天回合則維持 Codex Default 模式。當
`HEARTBEAT.md` 非空時，心跳偵測指示會引導 Codex 讀取該檔案，而不是
直接內嵌其內容。

## 鉤子邊界

| 層級                                  | 擁有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 外掛鉤子                     | OpenClaw                 | 維持 OpenClaw 與 Codex 控制框架之間的產品／外掛相容性。              |
| Codex app-server 擴充中介軟體         | OpenClaw 內建外掛        | 圍繞 OpenClaw 動態工具提供每回合的轉接器行為。                       |
| Codex 原生鉤子                        | Codex                    | 由 Codex 設定控制的低階 Codex 生命週期與原生工具政策。               |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由
外掛行為。針對原生工具與權限橋接，OpenClaw 會為每個執行緒注入
`PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop`
的 Codex 設定。

啟用 Codex app-server 核准時（`approvalPolicy` 不是
`"never"`），預設注入的原生鉤子設定會省略 `PermissionRequest`，
讓 Codex 的 app-server 審查器與 OpenClaw 的核准橋接在審查後處理
實際的權限提升。若仍要強制使用相容性轉送，請將 `permission_request`
加入 `nativeHookRelay.events`。其他 Codex 鉤子（例如 `SessionStart`
和 `UserPromptSubmit`）仍屬於 Codex 層級的控制項；在 v1 合約中，
它們不會公開為 OpenClaw 外掛鉤子。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求呼叫後執行工具，
因此外掛與中介軟體行為會在控制框架轉接器中執行。對於 Codex 原生工具，
Codex 擁有標準工具記錄；OpenClaw 可以鏡像所選事件，但除非 Codex
透過 app-server 或原生鉤子回呼公開該能力，否則 OpenClaw 無法改寫
原生執行緒。

Codex app-server 報告模式的 `PreToolUse` 事件會將外掛核准延後至
相符的 app-server 核准。如果 OpenClaw `before_tool_call` 鉤子傳回
`requireApproval`，而原生承載資料設定了 `openclaw_approval_mode:
"report"`，原生鉤子轉送會記錄外掛核准要求，且不傳回原生決策。
當 Codex 之後針對同一次工具使用傳送 app-server 核准請求時，
OpenClaw 會開啟外掛核准提示，並將決策對應回 Codex。Codex
`PermissionRequest` 事件是獨立的核准路徑，若已為該橋接完成設定，
仍可透過 OpenClaw 核准進行路由。

Codex app-server 項目通知也會針對原生 `PostToolUse` 轉送尚未涵蓋的
原生工具完成事件，提供非同步 `after_tool_call` 觀察。這些僅用於
遙測／相容性；它們無法封鎖、延遲或修改原生工具呼叫。

壓縮和 LLM 生命週期投影來自 Codex app-server 通知與 OpenClaw
轉接器狀態，而非原生 Codex 鉤子命令。`before_compaction`、
`after_compaction`、`llm_input` 和 `llm_output` 是轉接器層級的觀察，
並非逐位元組擷取 Codex 的內部請求或壓縮承載資料。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知會投影為
`codex_app_server.hook` 代理程式事件，以供軌跡記錄與偵錯使用。
它們不會叫用 OpenClaw 外掛鉤子。

## V1 支援合約

Codex 執行階段 v1 支援：

| 介面                                          | 支援情況                                                                         | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈                 | 支援                                                                             | Codex app-server 負責 OpenAI 輪次、原生對話串恢復，以及原生工具接續執行。                                                                                                                                                                                                                                                                                                                                                                                                           |
| OpenClaw 頻道路由與傳遞                       | 支援                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 和其他頻道都位於模型執行階段之外。                                                                                                                                                                                                                                                                                                                                                                                                      |
| OpenClaw 動態工具                             | 支援                                                                             | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 會持續位於執行路徑中。                                                                                                                                                                                                                                                                                                                                                                                                              |
| 提示詞與上下文外掛                            | 支援                                                                             | OpenClaw 會將 OpenClaw 專屬提示詞／上下文投射至 Codex 輪次，同時讓 Codex 所擁有的基礎提示詞、模型提示詞，以及已設定的專案文件提示詞保留在原生 Codex 路徑中。OpenClaw 會為原生對話串停用 Codex 的內建人格，讓代理程式工作區的人格檔案維持權威性。原生 Codex 開發者指示僅接受明確限定於 `codex_app_server` 的命令指引；舊版全域命令提示則保留給非 Codex 提示詞介面。 |
| 上下文引擎生命週期                            | 支援                                                                             | 組裝、擷取及輪次後維護會在 Codex 輪次前後執行。上下文引擎不會取代原生 Codex 壓縮。                                                                                                                                                                                                                                                                                                                                                                                                   |
| 動態工具鉤子                                  | 支援                                                                             | `before_tool_call`、`after_tool_call` 和工具結果中介軟體會在 OpenClaw 所擁有的動態工具前後執行。                                                                                                                                                                                                                                                                                                                                                                                     |
| 生命週期鉤子                                  | 支援作為轉接器觀察事件                                                           | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以如實反映 Codex 模式的承載資料觸發。                                                                                                                                                                                                                                                                                                                                                              |
| 最終答案修訂閘門                              | 透過原生鉤子轉送支援                                                             | Codex `Stop` 會轉送至 `before_agent_finalize`；`revise` 會要求 Codex 在定稿前再執行一次模型處理。                                                                                                                                                                                                                                                                                                                                                                                     |
| 原生 shell、修補程式與 MCP 的封鎖或觀察       | 透過原生鉤子轉送支援                                                             | Codex `PreToolUse` 和 `PostToolUse` 會針對已提交的原生工具介面進行轉送，包括 Codex app-server `0.142.0` 或更新版本上的 MCP 承載資料。支援封鎖，但不支援重寫引數。                                                                                                                                                                                                                                                                                                                         |
| 原生權限原則                                  | 透過 Codex app-server 核准與相容性原生鉤子轉送支援                               | Codex app-server 核准請求會在 Codex 審查後透過 OpenClaw 路由。由於 Codex 會在防護機制審查前發出 `PermissionRequest`，因此在原生核准模式下，原生鉤子轉送需選擇啟用。                                                                                                                                                                                                                                                                                                                       |
| App-server 軌跡擷取                           | 支援                                                                             | OpenClaw 會記錄其傳送至 app-server 的請求，以及從 app-server 收到的通知。                                                                                                                                                                                                                                                                                                                                                                                                           |

Codex 執行階段 v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                               | 未來方向                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生工具前鉤子可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。                                                                               | 需要 Codex 鉤子／結構描述支援替換工具輸入。                                               |
| 可編輯的 Codex 原生對話記錄歷程                     | Codex 擁有規範的原生對話串歷程。OpenClaw 擁有鏡像，並可投射未來上下文，但不應修改不受支援的內部資料。                                                 | 若需要對原生對話串進行修改，請新增明確的 Codex app-server API。                           |
| Codex 原生工具記錄的 `tool_result_persist`          | 該鉤子會轉換由 OpenClaw 寫入的對話記錄，而非 Codex 原生工具記錄。                                                                                     | 可以鏡像轉換後的記錄，但規範記錄的重寫需要 Codex 支援。                                   |
| 豐富的原生壓縮中繼資料                              | OpenClaw 可以請求原生壓縮，但不會收到穩定的保留／捨棄清單、權杖差異、完成摘要或摘要承載資料。                                                        | 需要更豐富的 Codex 壓縮事件。                                                             |
| 壓縮介入                                            | OpenClaw 不允許外掛或上下文引擎否決、重寫或取代原生 Codex 壓縮。                                                                                     | 若外掛需要否決或重寫原生壓縮，請新增 Codex 壓縮前／後鉤子。                               |
| 逐位元組的模型 API 請求擷取                         | OpenClaw 可以擷取 app-server 請求與通知，但 Codex 核心會在內部建構最終的 OpenAI API 請求。                                                           | 需要 Codex 模型請求追蹤事件或偵錯 API。                                                   |

## 原生權限與 MCP 引導請求

對於 `PermissionRequest`，只有在原則做出決定時，OpenClaw 才會傳回明確的允許或拒絕
決定。沒有決定並不代表允許：Codex 會將其視為鉤子未做決定，並接續使用自身的防護機制或使用者
核准路徑。

Codex app-server 核准模式預設會省略此原生鉤子。除非在
`nativeHookRelay.events` 中明確納入 `permission_request`，或由相容性執行階段安裝該鉤子，
否則皆適用此行為。

當操作者為 Codex 原生權限請求選擇 `allow-always` 時，OpenClaw 會在有限的工作階段期間內，
記住該確切的提供者／工作階段／工具輸入／cwd 指紋。記住的決定刻意僅適用於完全相符的情況：
命令、引數、工具承載資料或 cwd 若有變更，都會產生新的核准請求。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准引導請求
會透過 OpenClaw 的外掛核准流程路由。Codex `request_user_input` 提示會傳回原始聊天，
而下一則排入佇列的後續訊息會用於回答該原生伺服器請求，而不會被導向為額外上下文。其他 MCP
引導請求一律採取封閉式失敗。

如需瞭解承載這些提示的一般外掛核准流程，請參閱
[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)。

## 佇列導向

執行中的佇列導向會對應至 Codex app-server `turn/steer`。使用預設的
`messages.queue.mode: "steer"` 時，OpenClaw 會在已設定的靜默時間範圍內，批次處理導向模式的聊天
訊息，並依抵達順序將其作為單一 `turn/steer` 請求傳送。

Codex 審查與手動壓縮回合可能會拒絕同一回合的引導。在
這種情況下，OpenClaw 會等候作用中的執行完成後，再開始處理
提示。若訊息預設應排入佇列而非進行引導，請使用 `/queue followup` 或 `/queue collect`。
請參閱[引導佇列](/zh-TW/concepts/queue-steering)。

## Codex 意見回饋上傳

當原生 Codex 控制框架上的工作階段核准執行 `/diagnostics [note]` 時，
OpenClaw 也會針對相關的 Codex 討論串呼叫 Codex app-server 的
`feedback/upload`，其中包括每個列出之討論串的日誌，以及可用時所衍生
Codex 子討論串的日誌。

上傳會透過 Codex 的一般意見回饋路徑傳送至 OpenAI 伺服器。如果
該 app-server 已停用 Codex 意見回饋，此命令會傳回
app-server 錯誤。完成後的診斷回覆會列出已傳送討論串的頻道、
OpenClaw 工作階段 ID、Codex 討論串 ID，以及本機 `codex resume <thread-id>`
命令。

如果你拒絕或忽略核准，OpenClaw 不會顯示這些 Codex ID，
也不會傳送 Codex 意見回饋。此上傳不會取代本機
閘道診斷匯出。如需了解核准、隱私、本機套件及群組聊天行為，
請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

只有當你想針對目前附加的討論串上傳 Codex 意見回饋，
而不需要完整的閘道診斷套件時，才使用 `/codex diagnostics [note]`。

## 壓縮與逐字稿鏡像

當選取的模型使用 Codex 控制框架時，原生討論串壓縮
由 Codex app-server 負責。OpenClaw 不會對 Codex 回合執行預檢壓縮、
以情境引擎壓縮取代 Codex 壓縮，或在無法啟動原生壓縮時，
改用 OpenClaw 或公開的 OpenAI 摘要功能。OpenClaw 會保留逐字稿鏡像，
供頻道歷史記錄、搜尋、`/new`、`/reset`，以及日後切換模型或控制框架使用。

明確的壓縮要求（例如 `/compact` 或由外掛要求的手動
壓縮作業）會使用 `thread/compact/start` 啟動原生 Codex 壓縮。
OpenClaw 會保持要求與共用用戶端租約開啟，直到 Codex 發出
相符的 `contextCompaction` 完成項目，接著將壓縮
回合回報為已完成。如果該終止回合超過設定的壓縮
逾時時間，OpenClaw 會要求中斷原生回合。租約及各討論串的
壓縮柵欄會持續保留，直到 Codex 回報終止狀態或確認
中斷 RPC 為止。如果 Codex 未在中斷寬限
期間內確認，OpenClaw 會先汰除連線，再釋放柵欄。遠端
連線也會解除相符的討論串繫結，避免後續工作
與尚未確認的遠端回合重疊。已汰除連線上的其他回合會失敗，
並可在新的用戶端上重試。用戶端關閉、要求取消或
壓縮回合失敗，都會傳回失敗的作業。因情境壓力而進行的自動
壓縮是 Codex 的工作；OpenClaw 只會針對手動要求的
觸發條件啟動原生壓縮。

當情境引擎要求 Codex 討論串啟動投影時，OpenClaw
會將工具呼叫名稱與 ID、輸入形狀，以及經過遮蔽的工具結果
內容投影至新的 Codex 討論串。它不會將原始工具呼叫引數
值複製到該投影中。

鏡像包括使用者提示、助理最終文字，以及 app-server 發出時的
輕量 Codex 推理或計畫記錄。OpenClaw
會記錄原生壓縮的開始與終止狀態，但不會
公開人類可讀的壓縮摘要，或 Codex 在壓縮後保留哪些
項目的可稽核清單。

由於 Codex 擁有標準的原生討論串，`tool_result_persist` 不會
重寫 Codex 原生工具結果記錄。它只會在 OpenClaw
寫入由 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

## 媒體與傳遞

OpenClaw 會繼續負責媒體傳遞及媒體供應商選擇。圖片、
影片、音樂、PDF、TTS 與媒體理解會使用相符的供應商／模型
設定，例如 `agents.defaults.imageGenerationModel`、
`videoGenerationModel`、`pdfModel` 及 `messages.tts`。

文字、圖片、影片、音樂、TTS、核准及傳訊工具輸出會繼續
透過一般 OpenClaw 傳遞路徑處理；媒體生成不需要
舊版執行階段。當 Codex 發出具有
`savedPath` 的原生圖片生成項目時，即使 Codex 回合沒有助理文字，
OpenClaw 仍會透過一般回覆媒體路徑轉送該確切檔案。

## 相關內容

- [Codex 控制框架](/zh-TW/plugins/codex-harness)
- [Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 監督](/zh-TW/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [外掛掛鉤](/zh-TW/plugins/hooks)
- [代理程式控制框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [軌跡匯出](/zh-TW/tools/trajectory)
