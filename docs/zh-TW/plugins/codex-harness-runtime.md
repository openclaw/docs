---
read_when:
    - 你需要 Codex 框架執行階段支援契約
    - 你正在偵錯 Codex 原生工具、掛鉤、壓縮或意見回饋上傳
    - 你正在變更 OpenClaw 與 Codex 測試框架回合中的外掛行為
summary: Codex 執行框架的執行階段邊界、掛鉤、工具、權限與診斷
title: Codex 控制框架執行環境
x-i18n:
    generated_at: "2026-07-19T13:56:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 516d70dee056657a06206c7ca4215f3776ccd2b027a136b5cc8fea3b11c1cd0b
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex 控制流程回合的執行階段合約。如需設定與路由資訊，請參閱
[Codex 控制流程](/zh-TW/plugins/codex-harness)。如需設定欄位資訊，請參閱
[Codex 控制流程參考](/zh-TW/plugins/codex-harness-reference)。

## 概覽

Codex 負責原生模型迴圈、原生執行緒續接、原生工具接續，以及原生壓縮。OpenClaw 負責頻道路由、工作階段檔案、可見訊息傳遞、OpenClaw 動態工具、核准、媒體傳遞，以及該邊界周圍的逐字稿鏡像。

提示詞路由遵循所選的執行階段，而不只是提供者字串。原生 Codex 回合會取得 Codex app-server 開發者指示；明確的 OpenClaw 相容性路由則會保留一般的 OpenClaw 系統提示詞，即使它使用 Codex 風格的 OpenAI 驗證或傳輸方式也一樣。

OpenClaw 啟動及續接原生 Codex 執行緒時，會停用 Codex 的內建
個性設定 (`personality: "none"`)，讓工作區個性檔案與 OpenClaw 代理程式身分保持權威地位。除此之外，原生 Codex 仍會保留由 Codex 管理的基礎／模型指示與專案文件載入。輕量型 OpenClaw 執行（例如排程）仍會抑制專案文件載入。

OpenClaw 開發者指示涵蓋 OpenClaw 執行階段相關事項：來源頻道傳遞、OpenClaw 動態工具、ACP 委派、轉接器內容，以及使用中代理程式工作區的設定檔。Skills 目錄與工具路由的
`MEMORY.md` 指標會投射為回合範圍的協作開發者指示。當記憶工具無法使用時，使用中的 `BOOTSTRAP.md` 內容與完整的 `MEMORY.md` 會改以純文字回合輸入內容提供。

大多數 OpenClaw 動態工具使用可搜尋的 `openclaw` 命名空間。標記為 `catalogMode: "direct-only"` 的工具使用 `openclaw_direct`，Codex 會將其直接維持為模型可見的 `DirectModelOnly`，而不會向巢狀 Code Mode 執行公開。

## 執行緒繫結與模型變更

當 OpenClaw 工作階段附加至現有 Codex 執行緒時，下一個回合會將目前選取的模型、核准原則、沙箱、核准審查者及服務層級重新傳送至 app-server。從
`openai/gpt-5.5` 切換至 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex 使用新選取的模型繼續執行。

受監督的繫結是例外。OpenClaw 模型選擇器會保持鎖定，且續接時會省略模型與提供者覆寫，讓 Codex 還原標準執行緒中持久保存的模型與提供者。另一個原生 Codex 控制項可變更該持久保存的組合，而初始快照可能會產生 Codex 一般的模型差異警告；外層的 OpenClaw 模型與備援鏈絕不會取代其中任一項。

## 監督與安全接續

Codex 監督是同一個 `codex` 外掛的選用功能。它會透過獨立連線探索原生執行緒，並僅將未封存的工作階段投射至閘道目錄。若未明確指定 `appServer` 連線設定，該連線會使用受管理的使用者家目錄 stdio，而一般控制流程仍限定於代理程式範圍。清單與中繼資料讀取是被動操作：不會續接執行緒、不會讓 OpenClaw 訂閱其即時事件，也不會回應其核准要求。

對於閘道電腦上已儲存或閒置的工作階段，**以分支形式繼續**會建立一般且模型鎖定的聊天，並從來源鏡像有界限的使用者與助理歷程，直到來源最後一個已持久保存的終止回合。第一個一般聊天回合會安裝真正的核准處理常式，並使用暫時的原生分支來固定快照，而不覆寫模型或提供者。Codex App Server 會使用其目前的原生設定並傳回所選組合；若該模型與來源最後記錄的模型不同，便會發出一般警告。在同一個監督連線上，OpenClaw 會在來源的 cwd 與執行階段原則下啟動標準
`appServer` 來源 Codex 控制流程執行緒，初始啟動時使用的模型與提供者會與傳回值完全一致，接著注入有界限的可見歷程，並封存暫時分支。來源絕不會被續接。標準執行緒具有完整的 OpenClaw 控制流程工具介面；來源中的推理、工具呼叫及工具結果不會複製到其中。私人連線範圍會跨越待處理及已提交的繫結狀態而持續存在，因此後續每個回合都會留在該連線上，並使用原生驗證與提供者設定。若監督已停用，或繫結／連線發生偏移，系統會採取封閉式失敗，而不會切換至一般的代理程式家目錄控制流程。

原始的命令列介面、VS Code、Atlas 或 ChatGPT 來源仍可同時出現在兩個目錄中。標準分支是原生 Codex 執行緒，但其來源種類為
`appServer`；原生用戶端可能會篩除此來源種類，因此不保證它會出現在 Codex Desktop 中。

使用中的來源無法啟動新分支或被封存；現有的受監督聊天仍可開啟。`notLoaded` 表示活動狀態未知，而非閒置；只有在明確確認沒有其他執行者，且重新讀取程序本機狀態後，OpenClaw 才允許封存本機 `idle` 或 `notLoaded` 資料列。Codex 會在單一 App Server 程序內序列化執行緒異動，但不提供跨程序的專屬執行者或核准擁有者租約，因此該讀取無法證明另一個程序未使用該執行緒。對於完全相同的目標，或 Codex 分頁後代查詢傳回的任何未封存衍生後代，OpenClaw 會阻擋已知為使用中的繫結擁有者。列舉錯誤、循環及安全限制耗盡均會採取封閉式失敗。原生封存仍可能與另一個程序中的新回合發生競態，因此確認範圍涵蓋未知用戶端，以及狀態讀取與封存之間的空窗期。受監督且模型鎖定的聊天在保護原生繫結期間無法刪除。

在初始版本中，配對節點目錄仍僅提供中繼資料。目前的節點叫用邊界採用要求／回應模式，無法承載真正 Codex 控制流程繫結所需的長時間回合事件、核准要求或串流輸出。因此，即使資料列處於閒置狀態，遠端**繼續**與**封存**仍無法使用。

如需操作者設定與可見的 Control UI 行為，請參閱 [Codex 監督](/zh-TW/plugins/codex-supervision)。

## 可見回覆與心跳偵測

透過 Codex 控制流程進行的直接／來源聊天回合，預設會自動將助理的最終回覆傳遞至內部 WebChat 介面，與 Pi 控制流程合約一致：代理程式會正常回覆，而 OpenClaw 會將最終文字發布至來源對話。設定 `messages.visibleReplies: "message_tool"`，可讓助理的最終文字保持私密，除非代理程式呼叫 `message(action="send")`。

Codex 心跳偵測回合預設會在可搜尋的 OpenClaw 工具目錄中取得 `heartbeat_respond`，讓代理程式能記錄此次喚醒應保持安靜還是發出通知。心跳偵測主動性指引會以限定於該心跳偵測回合的 Codex 協作模式開發者指示傳送；一般聊天回合則維持 Codex Default 模式。當 `HEARTBEAT.md` 不為空時，心跳偵測指示會將 Codex 指向該檔案，而不是內嵌其內容。

## 掛鉤邊界

| 層級                                  | 擁有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 外掛掛鉤                     | OpenClaw                 | 在 OpenClaw 與 Codex 控制流程之間提供產品／外掛相容性。              |
| Codex app-server 擴充中介軟體         | OpenClaw 內建外掛        | OpenClaw 動態工具周圍的每回合轉接器行為。                            |
| Codex 原生掛鉤                        | Codex                    | 來自 Codex 設定的底層 Codex 生命週期與原生工具原則。                 |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由外掛行為。對於原生工具與權限橋接，OpenClaw 會為 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入每執行緒 Codex 設定。

啟用 Codex app-server 核准時（`approvalPolicy` 不是
`"never"`），預設注入的原生掛鉤設定會省略 `PermissionRequest`，讓 Codex 的 app-server 審查者與 OpenClaw 核准橋接在審查後處理實際的權限提升。若仍要強制使用相容性轉送，請將 `permission_request` 新增至
`nativeHookRelay.events`。其他 Codex 掛鉤（例如 `SessionStart` 與 `UserPromptSubmit`）仍屬於 Codex 層級的控制項；在 v1 合約中，它們不會以 OpenClaw 外掛掛鉤的形式公開。

對於 OpenClaw 動態工具，Codex 要求呼叫後，OpenClaw 才會執行該工具，因此外掛與中介軟體行為會在控制流程轉接器中執行。對於 Codex 原生工具，Codex 擁有標準工具記錄；OpenClaw 可以鏡像所選事件，但除非 Codex 透過 app-server 或原生掛鉤回呼公開該能力，否則無法重寫原生執行緒。

Codex app-server 報告模式的 `PreToolUse` 事件會將外掛核准延後至相符的 app-server 核准。如果 OpenClaw `before_tool_call` 掛鉤傳回
`requireApproval`，而原生承載內容設定了 `openclaw_approval_mode:
"report"`，原生掛鉤轉送會記錄外掛核准要求，且不傳回原生決策。之後 Codex 針對同一工具使用傳送 app-server 核准要求時，OpenClaw 會開啟外掛核准提示，並將決策映射回 Codex。Codex `PermissionRequest` 事件是獨立的核准路徑，若已設定使用該橋接，仍可透過 OpenClaw 核准路由。

Codex app-server 項目通知也會針對原生
`PostToolUse` 轉送尚未涵蓋的原生工具完成事件，提供非同步 `after_tool_call` 觀察。這些僅供遙測／相容性用途；無法阻擋、延遲或修改原生工具呼叫。

壓縮與 LLM 生命週期投射來自 Codex app-server 通知與 OpenClaw 轉接器狀態，而非原生 Codex 掛鉤命令。
`before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 是轉接器層級的觀察，而不是逐位元組擷取 Codex 的內部要求或壓縮承載內容。

Codex 原生 `hook/started` 與 `hook/completed` app-server 通知會投射為 `codex_app_server.hook` 代理程式事件，以供軌跡分析與偵錯。它們不會叫用 OpenClaw 外掛掛鉤。

## V1 支援合約

Codex 執行階段 v1 支援：

| 介面                                          | 支援情況                                                                         | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 執行 OpenAI 模型迴圈               | 支援                                                                             | Codex app-server 負責 OpenAI 輪次、原生執行緒續接及原生工具接續執行。                                                                                                                                                                                                                                                                                                                                                                                                                |
| OpenClaw 頻道路由與傳遞                       | 支援                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 及其他頻道皆位於模型執行階段之外。                                                                                                                                                                                                                                                                                                                                                                                                       |
| OpenClaw 動態工具                             | 支援                                                                             | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 會保留在執行路徑中。                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 提示詞與情境外掛                              | 支援                                                                             | OpenClaw 將 OpenClaw 專屬的提示詞／情境投射至 Codex 輪次，同時將 Codex 所擁有的基礎提示詞、模型提示詞及已設定的專案文件提示詞留在原生 Codex 路徑中。OpenClaw 會針對原生執行緒停用 Codex 的內建人格，讓代理程式工作區的人格檔案維持最高效力。原生 Codex 開發者指示僅接受明確限定於 `codex_app_server` 的命令指引；舊版全域命令提示仍保留供非 Codex 提示詞介面使用。 |
| 情境引擎生命週期                              | 支援                                                                             | 組裝、擷取及輪次後維護會在 Codex 輪次前後執行。情境引擎不會取代原生 Codex 壓縮。                                                                                                                                                                                                                                                                                                                                                                                                       |
| 動態工具掛鉤                                  | 支援                                                                             | `before_tool_call`、`after_tool_call` 及工具結果中介軟體會在 OpenClaw 所擁有的動態工具前後執行。                                                                                                                                                                                                                                                                                                                                                                                     |
| 生命週期掛鉤                                  | 支援作為轉接器觀測                                                              | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 及 `after_compaction` 會使用如實反映 Codex 模式的承載資料觸發。                                                                                                                                                                                                                                                                                                                                           |
| 最終答案修訂閘門                              | 透過原生掛鉤轉送支援                                                             | Codex `Stop` 會轉送至 `before_agent_finalize`；`revise` 會在完成前要求 Codex 再執行一次模型輪次。                                                                                                                                                                                                                                                                                                                                                                     |
| 原生 shell、修補及 MCP 的封鎖或觀測           | 透過原生掛鉤轉送支援                                                             | Codex `PreToolUse` 與 `PostToolUse` 會針對已提交的原生工具介面轉送，包括 Codex app-server `0.142.0` 或更新版本上的 MCP 承載資料。支援封鎖，但不支援改寫引數。                                                                                                                                                                                                                                                                                                          |
| 原生權限原則                                  | 透過 Codex app-server 核准及相容性原生掛鉤轉送支援                               | Codex app-server 核准要求會在 Codex 審查後透過 OpenClaw 路由。由於 Codex 會在守護程式審查前發出 `PermissionRequest`，因此原生核准模式須選擇啟用其原生掛鉤轉送。                                                                                                                                                                                                                                                                                                                            |
| App-server 軌跡擷取                           | 支援                                                                             | OpenClaw 會記錄傳送至 app-server 的要求，以及從 app-server 收到的通知。                                                                                                                                                                                                                                                                                                                                                                                                              |

Codex 執行階段 v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                        | 未來方向                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生工具前掛鉤可以封鎖，但 OpenClaw 不會改寫 Codex 原生工具引數。                                                                        | 需要 Codex 掛鉤／結構描述支援替換工具輸入。                                               |
| 可編輯的 Codex 原生轉錄紀錄歷程                     | Codex 擁有標準原生執行緒歷程。OpenClaw 擁有其鏡像並可投射未來情境，但不應修改未受支援的內部資料。                                               | 若需要對原生執行緒進行手術式修改，請新增明確的 Codex app-server API。                     |
| Codex 原生工具記錄的 `tool_result_persist`             | 該掛鉤會轉換由 OpenClaw 擁有的轉錄紀錄寫入內容，而非 Codex 原生工具記錄。                                                                       | 可以鏡像轉換後的記錄，但標準改寫需要 Codex 支援。                                         |
| 豐富的原生壓縮中繼資料                              | OpenClaw 可以要求原生壓縮，但不會收到穩定的保留／捨棄清單、權杖差異、完成摘要或摘要承載資料。                                                   | 需要更豐富的 Codex 壓縮事件。                                                             |
| 壓縮介入                                            | OpenClaw 不允許外掛或情境引擎否決、改寫或取代原生 Codex 壓縮。                                                                                 | 若外掛需要否決或改寫原生壓縮，請新增 Codex 壓縮前／後掛鉤。                               |
| 逐位元組的模型 API 要求擷取                         | OpenClaw 可以擷取 app-server 要求及通知，但 Codex 核心會在內部建構最終的 OpenAI API 要求。                                                      | 需要 Codex 模型要求追蹤事件或偵錯 API。                                                   |

## 原生權限與 MCP 資訊請求

針對 `PermissionRequest`，OpenClaw 僅會在原則做出判定時傳回明確的允許或拒絕決定。無決定結果並不表示允許：Codex 會將其視為掛鉤未做決定，並轉而使用自身的守護程式或使用者核准路徑。

Codex app-server 核准模式預設會省略此原生掛鉤。除非 `permission_request` 明確包含在 `nativeHookRelay.events` 中，或有相容性執行階段安裝此掛鉤，否則一律如此。

當操作者為 Codex 原生權限要求選擇 `allow-always` 時，OpenClaw 會在有限的工作階段時窗內記住該組完全相同的提供者／工作階段／工具輸入／cwd 指紋。此記憶決定刻意僅限完全相符：命令、引數、工具承載資料或 cwd 只要有任何變更，就會產生新的核准要求。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准資訊請求會透過 OpenClaw 的外掛核准流程路由。Codex `request_user_input` 會為原始工作階段註冊與提供者無關的閘道問題。Control UI 會顯示閘道問題卡片；若只有一個非機密選項，且頻道支援，則會使用具型別的頻道按鈕。按鈕點選、Control UI 回答及佇列中下一則純文字回覆，都會先解析同一筆閘道記錄，之後 OpenClaw 才會傳回 app-server 答案。Codex 自動解析及嘗試中止會限制等待時間並取消該記錄。機密問題全程僅使用附帶警告的文字回覆路徑。其他 MCP 資訊請求會以拒絕方式關閉。

如需瞭解承載這些提示的一般外掛核准流程，請參閱[外掛權限要求](/zh-TW/plugins/plugin-permission-requests)。

## 佇列導引

執行中佇列導向會對應至 Codex app-server `turn/steer`。使用預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的靜默時間範圍內，將導向模式的聊天訊息分批彙整，並依抵達順序將其作為單一 `turn/steer` 要求傳送。

Codex 審查與手動壓縮回合可能會拒絕同回合導向。在這種情況下，OpenClaw 會等待執行中的作業完成，再開始處理提示。若訊息預設應加入佇列而非進行導向，請使用 `/queue followup` 或 `/queue collect`。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

## Codex 意見回饋上傳

在原生 Codex 工具框架中，當工作階段的 `/diagnostics [note]` 獲得核准時，OpenClaw 也會針對相關 Codex 執行緒呼叫 Codex app-server `feedback/upload`，其中包括每個列出執行緒的日誌，以及可用時衍生的 Codex 子執行緒。

上傳會透過 Codex 的一般意見回饋路徑傳送至 OpenAI 伺服器。若該 app-server 已停用 Codex 意見回饋，此命令會傳回 app-server 錯誤。完成後的診斷回覆會列出已傳送執行緒的頻道、OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機 `codex resume <thread-id>` 命令。

若你拒絕或忽略核准要求，OpenClaw 不會顯示這些 Codex ID，也不會傳送 Codex 意見回饋。此上傳不會取代本機閘道診斷匯出。如需瞭解核准、隱私、本機套件組合與群組聊天行為，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

只有在你想要為目前附加的執行緒上傳 Codex 意見回饋，而不需要完整的閘道診斷套件組合時，才使用 `/codex diagnostics [note]`。

## 壓縮與對話記錄鏡像

當所選模型使用 Codex 工具框架時，原生執行緒壓縮由 Codex app-server 負責。OpenClaw 不會對 Codex 回合執行預檢壓縮、不會以情境引擎壓縮取代 Codex 壓縮，也不會在無法啟動原生壓縮時，改用 OpenClaw 或公開的 OpenAI 摘要功能。OpenClaw 會保留對話記錄鏡像，以供頻道歷史記錄、搜尋、`/new`、`/reset`，以及未來切換模型或工具框架時使用。

明確的壓縮要求（例如 `/compact` 或外掛要求的手動壓縮作業）會使用 `thread/compact/start` 啟動原生 Codex 壓縮。OpenClaw 會讓要求與共用用戶端租用保持開啟，直到 Codex 發出相符的 `contextCompaction` 完成項目，然後將壓縮回合回報為已完成。若該終止回合超過設定的壓縮逾時時間，OpenClaw 會要求原生回合中斷。租用與各執行緒的壓縮柵欄會持續保持，直到 Codex 回報終止狀態或確認中斷 RPC。若 Codex 未在中斷寬限期內確認，OpenClaw 會先汰除連線，再釋放柵欄。遠端連線也會解除相符的執行緒繫結，避免後續工作與尚未確認的遠端回合重疊。已汰除連線上的其他回合會失敗，並可透過新的用戶端重試。用戶端關閉、要求取消或壓縮回合失敗時，會傳回失敗的作業。由情境壓力自動觸發的壓縮是 Codex 的工作；OpenClaw 只會針對手動要求的觸發條件啟動原生壓縮。

當情境引擎要求 Codex 執行緒啟動投影時，OpenClaw 會將工具呼叫名稱與 ID、輸入結構，以及經遮蔽的工具結果內容投影至新的 Codex 執行緒。它不會將原始工具呼叫引數值複製至該投影。

鏡像包含使用者提示、助理最終文字，以及 app-server 發出時的精簡 Codex 推理或計畫記錄。OpenClaw 會記錄原生壓縮的開始與終止狀態，但不會公開人類可讀的壓縮摘要，也不會提供可稽核的清單，列出 Codex 在壓縮後保留了哪些項目。

由於 Codex 擁有標準的原生執行緒，`tool_result_persist` 不會重寫 Codex 原生工具結果記錄。它只適用於 OpenClaw 寫入由 OpenClaw 擁有的工作階段對話記錄工具結果時。

## 媒體與傳遞

OpenClaw 仍負責媒體傳遞與媒體供應商選擇。圖片、影片、音樂、PDF、TTS 與媒體理解功能會使用相符的供應商／模型設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 與 `messages.tts`。

文字、圖片、影片、音樂、TTS、核准要求與傳訊工具輸出，仍會透過一般 OpenClaw 傳遞路徑處理；媒體生成不需要舊版執行階段。當 Codex 發出帶有 `savedPath` 的原生圖片生成項目時，即使 Codex 回合沒有助理文字，OpenClaw 仍會透過一般回覆媒體路徑轉送該確切檔案。

## 相關內容

- [Codex 工具框架](/zh-TW/plugins/codex-harness)
- [Codex 工具框架參考資料](/zh-TW/plugins/codex-harness-reference)
- [Codex 監督](/zh-TW/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [外掛掛鉤](/zh-TW/plugins/hooks)
- [代理程式工具框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [軌跡匯出](/zh-TW/tools/trajectory)
