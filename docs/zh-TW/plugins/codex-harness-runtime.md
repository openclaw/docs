---
read_when:
    - 你需要 Codex 測試框架執行階段支援合約
    - 您正在偵錯原生 Codex 工具、鉤子、壓縮或意見回饋上傳
    - 你正在變更 OpenClaw 與 Codex 控制框架回合中的外掛行為
summary: Codex 執行環境的執行時期邊界、掛鉤、工具、權限與診斷功能
title: Codex 測試框架執行階段
x-i18n:
    generated_at: "2026-07-11T21:31:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex 控制框架回合的執行階段契約。關於設定與路由，請參閱
[Codex 控制框架](/zh-TW/plugins/codex-harness)。關於設定欄位，請參閱
[Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)。

## 概覽

Codex 負責原生模型迴圈、原生執行緒續接、原生工具延續，以及原生壓縮。OpenClaw 負責頻道路由、工作階段檔案、可見訊息傳遞、OpenClaw 動態工具、核准、媒體傳遞，以及該邊界周圍的逐字稿鏡像。

提示詞路由依循所選的執行階段，而不只是提供者字串。原生 Codex 回合會取得 Codex app-server 開發者指示；明確的 OpenClaw 相容性路由即使使用 Codex 形式的 OpenAI 驗證或傳輸方式，仍會保留一般的 OpenClaw 系統提示詞。

OpenClaw 啟動及續接原生 Codex 執行緒時，會停用 Codex 的內建人格（`personality: "none"`），使工作區人格檔案與 OpenClaw 代理程式身分保持權威性。除此之外，原生 Codex 仍會保留由 Codex 管理的基礎／模型指示及專案文件載入。輕量級 OpenClaw 執行（例如排程）仍會停用專案文件載入。

OpenClaw 開發者指示涵蓋 OpenClaw 執行階段相關事項：來源頻道傳遞、OpenClaw 動態工具、ACP 委派、配接器情境，以及目前代理程式工作區的設定檔案。Skills 目錄與經工具路由的 `MEMORY.md` 指標，會投射為限於該回合的協作開發者指示。記憶工具無法使用時，使用中的 `BOOTSTRAP.md` 內容與完整的 `MEMORY.md` 會改以純文字回合輸入情境提供。

多數 OpenClaw 動態工具使用可搜尋的 `openclaw` 命名空間。標記為 `catalogMode: "direct-only"` 的工具使用 `openclaw_direct`；Codex 會將其保持為模型可直接看到的 `DirectModelOnly`，而不會將其暴露給巢狀的程式碼模式執行。

## 執行緒繫結與模型變更

當 OpenClaw 工作階段連接至現有的 Codex 執行緒時，下一個回合會將目前選取的模型、核准原則、沙箱、核准審查者及服務層級重新傳送至 app-server。從 `openai/gpt-5.5` 切換至 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex 使用新選取的模型繼續執行。

受監督的繫結是例外。OpenClaw 模型選擇器會保持鎖定，且續接時會省略模型與提供者覆寫，使 Codex 還原標準執行緒中保存的模型與提供者。另一個原生 Codex 控制端可以變更這組保存的配對，而初始快照可能會產生 Codex 一般的模型差異警告；外層 OpenClaw 模型與後援鏈絕不會取代其中任一項。

## 監督與安全續接

Codex 監督是同一個 `codex` 外掛中需選擇啟用的功能。它透過獨立連線探索原生執行緒，且只將未封存的工作階段投射至閘道目錄。若未明確設定 `appServer` 連線，該連線會使用受管理的使用者家目錄標準輸入輸出，而一般控制框架仍限定於代理程式範圍。列出項目與讀取中繼資料均為被動操作：它們不會續接執行緒、不會讓 OpenClaw 訂閱其即時事件，也不會回應其核准要求。

對於閘道電腦上已儲存或閒置的工作階段，**Continue as branch** 會建立一般且模型鎖定的聊天，並鏡像有界的使用者與助理歷程，直到來源最後一個已保存的終止回合。第一個一般聊天回合會安裝真正的核准處理常式，並使用臨時原生分支固定快照，而不覆寫模型或提供者。Codex App Server 使用目前的原生設定並傳回所選配對；若該模型與來源最後記錄的模型不同，便會發出一般警告。在同一個監督連線上，OpenClaw 會依該標準 `appServer` 來源的工作目錄及執行階段原則啟動 Codex 控制框架執行緒，初次啟動時精確使用傳回的模型與提供者、注入有界的可見歷程，並封存臨時分支。來源永遠不會被續接。標準執行緒具備完整的 OpenClaw 控制框架工具介面；來源中的推理、工具呼叫及工具結果不會複製至其中。私有連線範圍會在待處理及已提交的繫結狀態中持續存在，因此後續每個回合都會留在該連線上，並使用原生驗證與提供者設定。若監督遭停用，或繫結／連線發生偏移，系統會以關閉方式失敗，而不會切換至一般的代理程式家目錄控制框架。

原始命令列介面或 VS Code 來源仍可出現在兩個目錄中。標準分支是原生 Codex 執行緒，但其來源種類為 `appServer`；原生用戶端可能會篩除該來源種類，因此不保證它會出現在 Codex Desktop 中。

使用中的來源無法啟動新分支或封存；現有的受監督聊天仍可開啟。`notLoaded` 表示活動狀態未知，而非閒置；只有在明確確認沒有其他執行者，並重新讀取程序本機狀態後，OpenClaw 才允許封存本機的 `idle` 或 `notLoaded` 資料列。Codex 會在單一 App Server 程序內依序執行執行緒異動，但不提供跨程序的獨占執行者或核准擁有者租約，因此該讀取操作無法證明其他程序未使用此執行緒。對於精確目標，或 Codex 分頁式後代查詢傳回的任何未封存衍生後代，OpenClaw 會封鎖已知的使用中繫結擁有者。列舉錯誤、循環及安全限制耗盡時，系統會以關閉方式失敗。原生封存仍可能與另一個程序中的新回合發生競爭，因此確認範圍包含未知用戶端，以及狀態讀取與封存之間的空窗期。受監督且模型鎖定的聊天在保護原生繫結期間無法刪除。

配對節點目錄在初始版本中只提供中繼資料。目前的節點叫用邊界採用請求／回應模式，無法承載真正 Codex 控制框架繫結所需的長時間回合事件、核准要求或串流輸出。因此，即使資料列處於閒置狀態，遠端 **Continue** 與 **Archive** 仍不可用。

關於操作人員設定及可見的 Control UI 行為，請參閱 [Codex 監督](/zh-TW/plugins/codex-supervision)。

## 可見回覆與心跳偵測

透過 Codex 控制框架進行的直接／來源聊天回合，預設會將最終助理回覆自動傳遞至內部 WebChat 介面，與 Pi 控制框架契約一致：代理程式正常回覆，而 OpenClaw 會將最終文字張貼至來源對話。設定 `messages.visibleReplies: "message_tool"` 可讓最終助理文字保持非公開，除非代理程式呼叫 `message(action="send")`。

Codex 心跳偵測回合預設會在可搜尋的 OpenClaw 工具目錄中取得 `heartbeat_respond`，讓代理程式記錄此次喚醒應保持安靜或發出通知。心跳偵測主動性指引會作為限定於心跳偵測回合的 Codex 協作模式開發者指示傳送；一般聊天回合則維持 Codex 預設模式。當 `HEARTBEAT.md` 非空白時，心跳偵測指示會引導 Codex 讀取該檔案，而非將其內容直接內嵌。

## 鉤子邊界

| 層級                                  | 擁有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 外掛鉤子                     | OpenClaw                 | 維持 OpenClaw 與 Codex 控制框架之間的產品／外掛相容性。              |
| Codex app-server 擴充中介軟體         | OpenClaw 隨附外掛        | 圍繞 OpenClaw 動態工具提供每回合的配接器行為。                        |
| Codex 原生鉤子                        | Codex                    | 由 Codex 設定控制的低階 Codex 生命週期與原生工具原則。               |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由外掛行為。對於原生工具與權限橋接，OpenClaw 會為每個執行緒注入 `PreToolUse`、`PostToolUse`、`PermissionRequest` 及 `Stop` 的 Codex 設定。

啟用 Codex app-server 核准時（`approvalPolicy` 不為 `"never"`），預設注入的原生鉤子設定會省略 `PermissionRequest`，使 Codex 的 app-server 審查者與 OpenClaw 核准橋接在審查後處理實際的權限提升。若仍要強制使用相容性轉送，請將 `permission_request` 加入 `nativeHookRelay.events`。其他 Codex 鉤子（例如 `SessionStart` 與 `UserPromptSubmit`）仍屬 Codex 層級控制；在 v1 契約中，它們不會公開為 OpenClaw 外掛鉤子。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求呼叫後執行工具，因此外掛與中介軟體行為會在控制框架配接器中執行。對於 Codex 原生工具，Codex 擁有標準工具記錄；OpenClaw 可以鏡像所選事件，但除非 Codex 透過 app-server 或原生鉤子回呼公開該功能，否則無法改寫原生執行緒。

Codex app-server 報告模式的 `PreToolUse` 事件會將外掛核准延後至相符的 app-server 核准。若 OpenClaw `before_tool_call` 鉤子傳回 `requireApproval`，而原生承載資料將 `openclaw_approval_mode` 設為 `"report"`，原生鉤子轉送會記錄外掛核准要求，且不傳回原生決策。Codex 稍後為同一次工具使用傳送 app-server 核准要求時，OpenClaw 會開啟外掛核准提示，並將決策映射回 Codex。Codex `PermissionRequest` 事件是獨立的核准路徑；設定使用該橋接時，仍可透過 OpenClaw 核准進行路由。

Codex app-server 項目通知也會為原生 `PostToolUse` 轉送尚未涵蓋的原生工具完成事件，提供非同步 `after_tool_call` 觀察。這些內容僅供遙測／相容性用途；無法封鎖、延遲或修改原生工具呼叫。

壓縮與 LLM 生命週期投射來自 Codex app-server 通知及 OpenClaw 配接器狀態，而非原生 Codex 鉤子命令。`before_compaction`、`after_compaction`、`llm_input` 及 `llm_output` 是配接器層級的觀察，而不是逐位元組擷取 Codex 的內部請求或壓縮承載資料。

Codex 原生 `hook/started` 與 `hook/completed` app-server 通知會投射為 `codex_app_server.hook` 代理程式事件，以供軌跡記錄與偵錯。它們不會叫用 OpenClaw 外掛鉤子。

## V1 支援契約

Codex 執行階段 v1 支援：

| 介面                                          | 支援狀態                                                                         | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 執行的 OpenAI 模型迴圈             | 支援                                                                             | Codex app-server 負責 OpenAI 輪次、原生執行緒續接及原生工具接續執行。                                                                                                                                                                                                                                                                                                                                                                                                                     |
| OpenClaw 頻道路由與傳遞                       | 支援                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 及其他頻道均位於模型執行階段之外。                                                                                                                                                                                                                                                                                                                                                                                                           |
| OpenClaw 動態工具                             | 支援                                                                             | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 會留在執行路徑中。                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 提示詞與情境外掛                              | 支援                                                                             | OpenClaw 將 OpenClaw 專屬提示詞／情境投射至 Codex 輪次，同時讓 Codex 所擁有的基礎提示詞、模型提示詞及已設定的專案文件提示詞留在原生 Codex 路徑中。OpenClaw 會停用原生執行緒的 Codex 內建人格，讓代理程式工作區的人格檔案維持權威來源。原生 Codex 開發者指示僅接受明確限定於 `codex_app_server` 的命令指引；舊版全域命令提示仍適用於非 Codex 提示詞介面。 |
| 情境引擎生命週期                              | 支援                                                                             | 組裝、擷取及輪次後維護會在 Codex 輪次前後執行。情境引擎不會取代原生 Codex 壓縮。                                                                                                                                                                                                                                                                                                                                                                                                           |
| 動態工具鉤子                                  | 支援                                                                             | `before_tool_call`、`after_tool_call` 及工具結果中介軟體會在 OpenClaw 所擁有的動態工具前後執行。                                                                                                                                                                                                                                                                                                                                                                                           |
| 生命週期鉤子                                  | 支援作為轉接器觀測事件                                                           | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 及 `after_compaction` 會以真實的 Codex 模式承載資料觸發。                                                                                                                                                                                                                                                                                                                                                                      |
| 最終答案修訂閘門                              | 透過原生鉤子轉送提供支援                                                         | Codex `Stop` 會轉送至 `before_agent_finalize`；`revise` 會要求 Codex 在完成最終處理前再執行一次模型輪次。                                                                                                                                                                                                                                                                                                                                                                                   |
| 原生殼層、修補及 MCP 封鎖或觀測               | 透過原生鉤子轉送提供支援                                                         | Codex `PreToolUse` 與 `PostToolUse` 會針對已提交的原生工具介面進行轉送，包括 Codex app-server `0.142.0` 或更新版本上的 MCP 承載資料。支援封鎖，但不支援改寫引數。                                                                                                                                                                                                                                                                                                                           |
| 原生權限政策                                  | 透過 Codex app-server 核准及相容性原生鉤子轉送提供支援                           | Codex 審查後，Codex app-server 的核准請求會經由 OpenClaw 路由。原生核准模式必須選擇啟用 `PermissionRequest` 原生鉤子轉送，因為 Codex 會在守護程式審查前發出該事件。                                                                                                                                                                                                                                                                                                                            |
| App-server 軌跡擷取                           | 支援                                                                             | OpenClaw 會記錄其傳送給 app-server 的請求，以及從 app-server 收到的通知。                                                                                                                                                                                                                                                                                                                                                                                                                 |

Codex 執行階段 v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                        | 未來方向                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 原生工具引數修改                                    | Codex 原生工具執行前鉤子可以封鎖，但 OpenClaw 不會改寫 Codex 原生工具引數。                                                                     | 需要 Codex 鉤子／結構描述支援替換工具輸入。                                                |
| 可編輯的 Codex 原生逐字記錄歷史                     | Codex 擁有標準原生執行緒歷史。OpenClaw 擁有其鏡像並可投射未來情境，但不應修改未受支援的內部資料。                                                 | 若需要對原生執行緒進行精細修改，請新增明確的 Codex app-server API。                        |
| Codex 原生工具記錄的 `tool_result_persist`          | 該鉤子會轉換 OpenClaw 所擁有的逐字記錄寫入內容，而非 Codex 原生工具記錄。                                                                        | 可以鏡像轉換後的記錄，但標準記錄的改寫需要 Codex 支援。                                    |
| 豐富的原生壓縮中繼資料                              | OpenClaw 可以要求原生壓縮，但不會收到穩定的保留／捨棄清單、權杖差異、完成摘要或摘要承載資料。                                                     | 需要更豐富的 Codex 壓縮事件。                                                              |
| 壓縮介入                                            | OpenClaw 不允許外掛或情境引擎否決、改寫或取代原生 Codex 壓縮。                                                                                   | 若外掛需要否決或改寫原生壓縮，請新增 Codex 壓縮前／後鉤子。                                |
| 逐位元組的模型 API 請求擷取                         | OpenClaw 可以擷取 app-server 請求與通知，但 Codex 核心會在內部建構最終的 OpenAI API 請求。                                                       | 需要 Codex 模型請求追蹤事件或偵錯 API。                                                    |

## 原生權限與 MCP 誘導請求

針對 `PermissionRequest`，只有在政策作出決定時，OpenClaw 才會傳回明確的允許或拒絕
決定。沒有決定的結果並不等同允許：Codex
會將其視為鉤子未作決定，並轉入自身的守護程式或使用者
核准路徑。

Codex app-server 核准模式預設會略過此原生鉤子。除非
在 `nativeHookRelay.events` 中明確加入 `permission_request`，或由相容性執行階段安裝該鉤子，
否則均適用此規則。

當操作人員針對 Codex 原生權限請求選擇 `allow-always` 時，
OpenClaw 會在有限的工作階段時間範圍內記住該提供者／工作階段／工具輸入／cwd
指紋的精確組合。刻意將記住的決定限制為僅精確相符：命令、引數、工具承載資料或
cwd 如有變更，就會建立新的核准請求。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准誘導請求會經由 OpenClaw 的外掛核准
流程路由。Codex
`request_user_input` 提示會傳回原始聊天，而下一則排入佇列的後續訊息會回覆該原生伺服器請求，
不會被引導為額外情境。其他 MCP 誘導請求會以封閉方式失敗。

如需了解承載這些提示的一般外掛核准流程，請參閱
[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)。

## 佇列引導

執行中的佇列引導會對應至 Codex app-server `turn/steer`。使用預設的
`messages.queue.mode: "steer"` 時，OpenClaw 會在已設定的靜默時間範圍內批次彙整引導模式的聊天
訊息，並依抵達順序將其作為單一 `turn/steer`
請求傳送。

Codex 審查與手動壓縮回合可能會拒絕同一回合的引導。在此情況下，OpenClaw 會等待進行中的執行完成，再開始處理提示。若訊息預設應進入佇列而非用於引導，請使用 `/queue followup` 或 `/queue collect`。請參閱[引導佇列](/zh-TW/concepts/queue-steering)。

## Codex 意見回饋上傳

在原生 Codex 控制框架上，當工作階段的 `/diagnostics [note]` 獲得核准時，OpenClaw 也會針對相關 Codex 執行緒呼叫 Codex app-server 的 `feedback/upload`，其中包括每個列出執行緒的日誌，以及可用時由其衍生的 Codex 子執行緒日誌。

上傳會透過 Codex 的一般意見回饋路徑傳送至 OpenAI 伺服器。如果該 app-server 已停用 Codex 意見回饋，此命令會傳回 app-server 錯誤。完成的診斷回覆會列出已傳送執行緒的頻道、OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機 `codex resume <thread-id>` 命令。

如果您拒絕或忽略核准要求，OpenClaw 不會顯示這些 Codex ID，也不會傳送 Codex 意見回饋。此上傳不會取代本機閘道診斷匯出。關於核准、隱私權、本機套件組合及群組聊天行為，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

只有當您想要針對目前附加的執行緒上傳 Codex 意見回饋，而不需要完整的閘道診斷套件組合時，才使用 `/codex diagnostics [note]`。

## 壓縮與逐字稿鏡像

當選取的模型使用 Codex 控制框架時，原生執行緒壓縮由 Codex app-server 負責。OpenClaw 不會對 Codex 回合執行預檢壓縮、不會以內容引擎壓縮取代 Codex 壓縮，也不會在無法啟動原生壓縮時改用 OpenClaw 或公開的 OpenAI 摘要功能。OpenClaw 會保留逐字稿鏡像，以供頻道記錄、搜尋、`/new`、`/reset`，以及日後切換模型或控制框架時使用。

明確的壓縮要求（例如 `/compact` 或由外掛要求的手動壓縮操作）會使用 `thread/compact/start` 啟動原生 Codex 壓縮。OpenClaw 會讓要求與共用用戶端租約保持開啟，直到 Codex 發出相符的 `contextCompaction` 完成項目，然後將壓縮回合回報為已完成。如果該終止回合超過已設定的壓縮逾時時間，OpenClaw 會要求中斷原生回合。租約與每個執行緒的壓縮柵欄會持續保持鎖定，直到 Codex 回報終止狀態或確認中斷 RPC。如果 Codex 未在中斷寬限期內確認，OpenClaw 會先停用連線，再釋放柵欄。遠端連線也會解除相符的執行緒繫結，避免後續工作與未確認的遠端回合重疊。已停用連線上的其他回合會失敗，並可使用新的用戶端重試。用戶端關閉、要求取消或壓縮回合失敗，都會傳回失敗的操作。因內容壓力而自動壓縮是 Codex 的職責；OpenClaw 只會針對手動要求的觸發條件啟動原生壓縮。

當內容引擎要求進行 Codex 執行緒啟動投影時，OpenClaw 會將工具呼叫名稱與 ID、輸入結構，以及經過遮蔽的工具結果內容投影至新的 Codex 執行緒。它不會將原始工具呼叫引數值複製至該投影。

此鏡像包含使用者提示、助理最終文字，以及 app-server 發出時的輕量 Codex 推理或計畫記錄。OpenClaw 會記錄原生壓縮的開始與終止狀態，但不會公開人類可讀的壓縮摘要，也不會提供可稽核的清單來顯示 Codex 在壓縮後保留了哪些項目。

由於 Codex 擁有標準的原生執行緒，`tool_result_persist` 不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 寫入由 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

## 媒體與傳遞

OpenClaw 仍負責媒體傳遞與媒體供應商選擇。圖片、影片、音樂、PDF、TTS 與媒體理解功能會使用相符的供應商／模型設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文字、圖片、影片、音樂、TTS、核准要求與訊息工具輸出，仍會透過一般 OpenClaw 傳遞路徑處理；媒體生成不需要舊版執行階段。當 Codex 發出含有 `savedPath` 的原生圖片生成項目時，即使 Codex 回合沒有助理文字，OpenClaw 仍會透過一般回覆媒體路徑轉送該確切檔案。

## 相關內容

- [Codex 控制框架](/zh-TW/plugins/codex-harness)
- [Codex 控制框架參考資料](/zh-TW/plugins/codex-harness-reference)
- [Codex 監督](/zh-TW/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [外掛掛鉤](/zh-TW/plugins/hooks)
- [代理程式控制框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [軌跡匯出](/zh-TW/tools/trajectory)
