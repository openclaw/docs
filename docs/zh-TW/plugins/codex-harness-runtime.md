---
read_when:
    - 你需要 Codex 測試框架執行階段支援合約
    - 你正在偵錯原生 Codex 工具、掛鉤、壓縮或意見回饋上傳
    - 你正在變更 OpenClaw 與 Codex 測試框架回合中的外掛行為
summary: Codex 控制框架的執行階段邊界、掛鉤、工具、權限與診斷
title: Codex 測試框架執行環境
x-i18n:
    generated_at: "2026-07-22T10:42:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 609852353d2b4da69095d80380f2ca98edf54bc15161968879829883ec3d627c
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex 操作框架回合的執行階段契約。如需設定與路由資訊，請參閱
[Codex 操作框架](/zh-TW/plugins/codex-harness)。如需設定欄位資訊，請參閱
[Codex 操作框架參考](/zh-TW/plugins/codex-harness-reference)。

## 概觀

Codex 負責原生模型迴圈、原生執行緒續接、原生工具接續，以及原生壓縮。OpenClaw 負責頻道路由、工作階段檔案、可見訊息傳遞、OpenClaw 動態工具、核准、媒體傳遞，以及該邊界周圍的對話記錄鏡像。

提示路由依循所選的執行階段，而不只是提供者字串。原生 Codex 回合會取得 Codex app-server 開發者指示；明確的 OpenClaw 相容性路由則會保留一般 OpenClaw 系統提示，即使它使用 Codex 風格的 OpenAI 驗證或傳輸方式亦然。

OpenClaw 啟動及續接原生 Codex 執行緒時，會停用 Codex 的內建
personality（`personality: "none"`），使工作區 personality 檔案
和 OpenClaw 代理程式身分維持權威來源。除此之外，原生 Codex 仍保留 Codex 所管理的基礎／模型指示與專案文件載入。輕量型
OpenClaw 執行（例如排程）仍會抑制專案文件載入。

OpenClaw 開發者指示涵蓋 OpenClaw 執行階段相關事項：來源頻道
傳遞、OpenClaw 動態工具、ACP 委派、配接器情境，以及
作用中代理程式工作區設定檔。Skills 目錄與由工具路由的
`MEMORY.md` 指標，會投影為回合範圍的協作開發者
指示。當記憶工具無法使用時，作用中的 `BOOTSTRAP.md` 內容
與完整的 `MEMORY.md` 會改為一般回合輸入情境。

大多數 OpenClaw 動態工具使用可搜尋的 `openclaw` 命名空間。標記為
`catalogMode: "direct-only"` 的工具使用 `openclaw_direct`，Codex 會將其
作為 `DirectModelOnly` 直接保持為模型可見，而非公開給巢狀的
Code Mode 執行。

## 執行緒繫結與模型變更

當 OpenClaw 工作階段附加至現有 Codex 執行緒時，下一個
回合會將目前選取的模型、核准政策、沙箱、
核准審查者及服務層級重新傳送給 app-server。從
`openai/gpt-5.5` 切換至 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex
使用新選取的模型繼續執行。

受監督的繫結是例外。OpenClaw 模型選擇器會保持鎖定，
且續接時會省略模型與提供者覆寫，使 Codex 還原標準
執行緒所保存的模型與提供者。獨立的原生 Codex 控制項可以
變更該組已保存的配對，而初始快照可能會產生 Codex 一般的
模型差異警告；外層 OpenClaw 模型與備援鏈絕不會
取代其中任一者。

## 監督與安全接續

Codex 監督是同一個 `codex` 外掛的選用功能。它會透過
獨立連線探索原生執行緒，並僅將未封存的
工作階段投影至閘道目錄。若未明確設定 `appServer` 連線
設定，該連線會使用受管理的使用者家目錄 stdio，而一般
操作框架仍維持代理程式範圍。清單與中繼資料讀取是被動的：它們不會
續接執行緒、不會讓 OpenClaw 訂閱其即時事件，也不會回應其
核准要求。

對於閘道電腦上已儲存或閒置的工作階段，**以分支繼續**
會建立一般且模型鎖定的聊天，並鏡像有界的使用者與助理
歷程，直至來源最後一個已保存的終止回合。第一個一般
聊天回合會安裝真正的核准處理常式，並使用暫時的原生分支
固定快照，而不覆寫模型或提供者。Codex App Server 會使用
目前的原生設定並傳回選取的配對；若該模型與來源最後記錄的模型不同，
它會發出一般警告。在同一個監督連線上，OpenClaw 會在來源的
cwd 與執行階段政策下，啟動標準的
`appServer` 來源 Codex 操作框架執行緒，該初始啟動會完全使用
傳回的模型與提供者、注入有界的可見歷程，並封存暫時分支。來源絕不會
被續接。標準執行緒具備完整的 OpenClaw 操作框架工具介面；
來源中的推理、工具呼叫與工具結果不會複製至其中。
私人連線範圍會在待處理與已提交的繫結狀態中持續存在，因此
之後每個回合都會保留在該連線上，並使用原生驗證與提供者
設定。停用監督或發生繫結／連線偏移時會採取封閉式失敗，
而不會切換至一般代理程式家目錄操作框架。

原始的命令列介面、VS Code、Atlas 或 ChatGPT 來源仍符合兩種
目錄的資格。標準分支是原生 Codex 執行緒，但其來源種類為
`appServer`；原生用戶端可能會篩除此來源種類，因此不保證它會顯示在
Codex Desktop 中。

作用中的來源無法啟動新分支或被封存；現有的受監督
聊天仍可開啟。`notLoaded` 表示活動狀態不明，而非閒置；
OpenClaw 僅會在明確確認沒有其他執行器，且重新讀取處理程序本機狀態後，
才允許封存本機 `idle` 或 `notLoaded` 資料列。Codex
會在單一 App Server 處理程序內序列化執行緒變更，但不提供
跨處理程序的專屬執行器或核准擁有者租約，因此該讀取無法
證明其他處理程序未使用此執行緒。對於完全相符的目標，或 Codex
分頁後代查詢傳回的任何未封存衍生後代，OpenClaw 會封鎖已知
作用中的繫結擁有者。列舉錯誤、循環及
安全限制耗盡都會採取封閉式失敗。原生封存仍可能與另一個處理程序中的
新回合發生競爭，因此確認會涵蓋未知用戶端，以及
狀態讀取與封存之間的空檔。受監督且模型鎖定的聊天在
保護原生繫結期間無法刪除。

配對節點目錄在初始版本中僅提供中繼資料。目前的
節點呼叫邊界採用要求／回應模式，無法承載真正 Codex 操作框架
繫結所需的長期回合事件、核准要求或串流輸出。
因此，即使資料列處於閒置狀態，遠端 **繼續** 與 **封存** 仍不可用。

如需操作者設定與可見的 Control UI 行為，請參閱
[Codex 監督](/zh-TW/plugins/codex-supervision)。

## 可見回覆與心跳偵測

透過 Codex 操作框架進行的直接／來源聊天回合，預設會為內部 WebChat
介面自動傳遞助理的最終回覆，與 Pi 操作框架
契約一致：代理程式會正常回覆，而 OpenClaw 會將最終文字發布至
來源對話。設定 `messages.visibleReplies: "message_tool"`，除非代理程式呼叫
`message(action="send")`，否則最終助理文字會保持私密。

Codex 心跳偵測回合預設會在可搜尋的 OpenClaw 工具
目錄中取得 `heartbeat_respond`，讓代理程式能記錄這次喚醒應保持安靜
或發出通知。心跳偵測主動性指引會以 Codex 協作模式
開發者指示的形式傳送，且範圍僅限該心跳偵測回合；一般聊天回合則維持
Codex Default 模式。當 `HEARTBEAT.md` 非空白時，心跳偵測
指示會引導 Codex 讀取該檔案，而非內嵌其內容。

## 鉤子邊界

| 層級                                  | 擁有者                   | 用途                                                              |
| ------------------------------------- | ------------------------ | ----------------------------------------------------------------- |
| OpenClaw 外掛鉤子                     | OpenClaw                 | 維持 OpenClaw 與 Codex 操作框架之間的產品／外掛相容性。           |
| Codex app-server 擴充中介軟體         | OpenClaw 內建外掛        | 圍繞 OpenClaw 動態工具的逐回合配接器行為。                         |
| Codex 原生鉤子                        | Codex                    | 由 Codex 設定控制的低階 Codex 生命週期與原生工具政策。             |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由
外掛行為。對於原生工具與權限橋接，OpenClaw 會針對
`PreToolUse`、`PostToolUse`、`PermissionRequest`
及 `Stop` 注入逐執行緒 Codex 設定。

啟用 Codex app-server 核准時（`approvalPolicy` 不是
`"never"`），預設注入的原生鉤子設定會省略 `PermissionRequest`，
讓 Codex 的 app-server 審查者與 OpenClaw 的核准橋接在審查後處理真正的
權限提升。將 `permission_request` 新增至
`nativeHookRelay.events`，即可強制使用相容性轉送。其他 Codex
鉤子（例如 `SessionStart` 和 `UserPromptSubmit`）仍屬 Codex 層級
控制項；在 v1 契約中，它們不會公開為 OpenClaw 外掛鉤子。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求
呼叫後執行工具，因此外掛與中介軟體行為會在操作框架配接器中執行。對於
Codex 原生工具，Codex 擁有標準工具記錄；OpenClaw 可以鏡像
選定的事件，但除非 Codex 透過 app-server 或原生鉤子回呼公開該功能，
否則無法改寫原生執行緒。

Codex app-server 報告模式的 `PreToolUse` 事件會將外掛核准延後至
相符的 app-server 核准。若 OpenClaw `before_tool_call` 鉤子傳回
`requireApproval`，同時原生承載資料設定 `openclaw_approval_mode:
"report"`，原生鉤子轉送會記錄外掛核准需求，且
不傳回原生決策。當 Codex 稍後針對相同工具使用傳送 app-server 核准
要求時，OpenClaw 會開啟外掛核准提示，並
將決策映射回 Codex。Codex `PermissionRequest` 事件是
獨立的核准路徑，設定使用該橋接時，仍可透過 OpenClaw 核准進行路由。

Codex app-server 項目通知也會針對原生
`PostToolUse` 轉送尚未涵蓋的原生工具完成事件，提供非同步 `after_tool_call`
觀察。這些僅用於遙測／相容性；無法
封鎖、延遲或變更原生工具呼叫。

壓縮與 LLM 生命週期投影來自 Codex app-server
通知和 OpenClaw 配接器狀態，而非原生 Codex 鉤子命令。
`before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 是
配接器層級的觀察，而不是 Codex 內部
要求或壓縮承載資料的逐位元組擷取。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知會
投影為 `codex_app_server.hook` 代理程式事件，用於軌跡與
偵錯。它們不會叫用 OpenClaw 外掛鉤子。

## V1 支援契約

Codex 執行階段 v1 支援：

| 介面                                          | 支援情況                                                                         | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 執行的 OpenAI 模型迴圈             | 支援                                                                             | Codex app-server 負責 OpenAI 輪次、原生執行緒續接及原生工具接續。                                                                                                                                                                                                                                                                                                                                                                                          |
| OpenClaw 頻道路由與傳遞                       | 支援                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 及其他頻道都位於模型執行階段之外。                                                                                                                                                                                                                                                                                                                                                                                    |
| OpenClaw 動態工具                             | 支援                                                                             | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 會持續參與執行流程。                                                                                                                                                                                                                                                                                                                                                                                                |
| 提示詞與上下文外掛                            | 支援                                                                             | OpenClaw 將 OpenClaw 專屬的提示詞／上下文投射至 Codex 輪次，同時讓 Codex 所擁有的基礎提示詞、模型提示詞及已設定的專案文件提示詞保留在原生 Codex 路徑中。OpenClaw 會停用原生執行緒中的 Codex 內建人格，使代理程式工作區的人格檔案維持權威性。原生 Codex 開發者指示僅接受明確限定於 `codex_app_server` 的命令指引；舊版全域命令提示仍保留供非 Codex 提示詞介面使用。 |
| 上下文引擎生命週期                            | 支援                                                                             | 組裝、擷取及輪次後維護會圍繞 Codex 輪次執行。上下文引擎不會取代原生 Codex 壓縮。                                                                                                                                                                                                                                                                                                                                                        |
| 動態工具掛鉤                                  | 支援                                                                             | `before_tool_call`、`after_tool_call` 及工具結果中介軟體會圍繞 OpenClaw 所擁有的動態工具執行。                                                                                                                                                                                                                                                                                                                                                                          |
| 生命週期掛鉤                                  | 支援作為轉接器觀測                                                             | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 及 `after_compaction` 會以如實反映 Codex 模式的承載資料觸發。                                                                                                                                                                                                                                                                                                                                                           |
| 最終答案修訂閘門                              | 透過原生掛鉤轉送提供支援                                                         | Codex `Stop` 會轉送至 `before_agent_finalize`；`revise` 會要求 Codex 在最終定稿前再執行一次模型處理。                                                                                                                                                                                                                                                                                                                                                                |
| 原生 shell、修補及 MCP 封鎖或觀測             | 透過原生掛鉤轉送提供支援                                                         | Codex `PreToolUse` 及 `PostToolUse` 會針對已提交的原生工具介面轉送，包括 Codex app-server `0.142.0` 或更新版本上的 MCP 承載資料。支援封鎖，但不支援改寫引數。                                                                                                                                                                                                                                                                               |
| 原生權限原則                                  | 透過 Codex app-server 核准及相容性原生掛鉤轉送提供支援                           | Codex app-server 核准要求會在 Codex 審查後透過 OpenClaw 路由。由於 Codex 會在防護機制審查前發出 `PermissionRequest`，因此原生核准模式必須選擇加入其原生掛鉤轉送。                                                                                                                                                                                                                                                                          |
| App-server 軌跡擷取                           | 支援                                                                             | OpenClaw 會記錄其傳送至 app-server 的要求，以及從 app-server 收到的通知。                                                                                                                                                                                                                                                                                                                                                                                    |

Codex 執行階段 v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                        | 未來方向                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生工具前掛鉤可進行封鎖，但 OpenClaw 不會改寫 Codex 原生工具的引數。                                                                    | 需要 Codex 掛鉤／結構描述支援替換工具輸入。                                               |
| 可編輯的 Codex 原生文字記錄歷程                     | Codex 擁有標準原生執行緒歷程。OpenClaw 擁有鏡像並可投射未來上下文，但不應變更不受支援的內部結構。                                               | 若需要對原生執行緒進行修改，請新增明確的 Codex app-server API。                           |
| 用於 Codex 原生工具記錄的 `tool_result_persist`        | 該掛鉤會轉換 OpenClaw 所擁有的文字記錄寫入內容，而非 Codex 原生工具記錄。                                                                      | 可鏡像已轉換的記錄，但標準記錄改寫需要 Codex 支援。                                       |
| 豐富的原生壓縮中繼資料                              | OpenClaw 可要求原生壓縮，但不會收到穩定的保留／捨棄清單、權杖差異、完成摘要或摘要承載資料。                                                    | 需要更豐富的 Codex 壓縮事件。                                                             |
| 壓縮介入                                            | OpenClaw 不允許外掛或上下文引擎否決、改寫或取代原生 Codex 壓縮。                                                                               | 若外掛需要否決或改寫原生壓縮，請新增 Codex 壓縮前／後掛鉤。                               |
| 逐位元組擷取模型 API 要求                           | OpenClaw 可擷取 app-server 要求及通知，但 Codex 核心會在內部建立最終的 OpenAI API 要求。                                                        | 需要 Codex 模型要求追蹤事件或偵錯 API。                                                   |

## 原生權限與 MCP 資訊請求

對於 `PermissionRequest`，只有在原則作出決定時，OpenClaw 才會傳回明確的允許或拒絕
決定。無決定的結果並不代表允許：Codex
會將其視為掛鉤未作出決定，並轉而採用其本身的防護機制或使用者
核准路徑。

Codex app-server 核准模式預設會省略此原生掛鉤。除非在
`nativeHookRelay.events` 中明確包含 `permission_request`，或由相容性執行階段安裝該掛鉤，
否則皆適用此行為。

當操作員針對 Codex 原生權限
要求選擇 `allow-always` 時，OpenClaw 會在有界的工作階段時間範圍內，記住該次確切的提供者／工作階段／工具輸入／cwd
指紋。記住的決定刻意僅適用於完全相符的情況：若命令、引數、工具承載資料或
cwd 發生變更，便會建立新的核准要求。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准資訊請求會透過 OpenClaw 的外掛核准
流程路由。Codex
`request_user_input` 會為來源工作階段登錄一個與提供者無關的閘道問題。Control UI 會顯示閘道問題卡片；若只有一個非機密選項，且頻道支援，則會使用具型別的頻道按鈕。
按鈕點選、Control UI 回答及下一則排入佇列的純文字回覆，都會先解析同一筆閘道記錄，OpenClaw 隨後才會傳回 app-server 答案。
Codex 自動解析及嘗試中止會限制等待時間並取消該記錄。
機密問題會完全保留在附帶警告的文字回覆路徑上。其他 MCP
資訊請求會以封閉方式失敗。

如需瞭解承載這些提示的一般外掛核准流程，請參閱
[外掛權限要求](/zh-TW/plugins/plugin-permission-requests)。

## 佇列導引

執行中佇列導向會對應至 Codex app-server `turn/steer`。使用預設的
`messages.queue.mode: "steer"` 時，OpenClaw 會在設定的靜默時間範圍內批次處理導向模式的聊天
訊息，並依抵達順序將它們作為一個 `turn/steer`
請求傳送。

Codex 審查和手動壓縮回合可能拒絕同一回合的導向。在
這種情況下，OpenClaw 會等待執行中的作業完成，再開始處理
提示。若訊息預設應進入佇列而非導向，請使用 `/queue followup` 或 `/queue collect`。
請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

## Codex 意見回饋上傳

在原生 Codex
操作環境中，當工作階段的 `/diagnostics [note]` 獲得核准時，OpenClaw 也會針對相關的
Codex 執行緒呼叫 Codex app-server `feedback/upload`，包括每個列出的執行緒記錄，以及可用時所產生的 Codex
子執行緒。

上傳會透過 Codex 的一般意見回饋路徑傳送至 OpenAI 伺服器。如果
該 app-server 已停用 Codex 意見回饋，此命令會傳回
app-server 錯誤。完成的診斷回覆會列出已傳送執行緒的頻道、
OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機 `codex resume <thread-id>`
命令。

如果你拒絕或忽略核准要求，OpenClaw 不會顯示這些 Codex ID，
也不會傳送 Codex 意見回饋。此上傳不會取代本機
閘道診斷匯出。關於核准、隱私權、本機套件組合和群組聊天行為，
請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

只有在你想為目前附加的執行緒上傳 Codex 意見回饋，
而不需要完整的閘道診斷套件組合時，才使用 `/codex diagnostics [note]`。

## 壓縮與逐字稿鏡像

當所選模型使用 Codex 操作環境時，原生執行緒壓縮
由 Codex app-server 負責。OpenClaw 不會為 Codex 回合執行預檢壓縮、
以內容引擎壓縮取代 Codex 壓縮，或在無法啟動原生壓縮時，
改用 OpenClaw 或公開的 OpenAI 摘要功能。OpenClaw 會保留逐字稿鏡像，
供頻道歷程記錄、搜尋、`/new`、`/reset`，
以及日後切換模型或操作環境使用。

明確的壓縮請求（例如 `/compact` 或外掛要求的手動
壓縮作業）會使用 `thread/compact/start` 啟動原生 Codex 壓縮。
OpenClaw 會保持請求和共用用戶端租約開啟，直到 Codex 發出相符的
`contextCompaction` 完成項目，接著才會回報壓縮
回合已完成。如果該終止回合超過設定的壓縮
逾時時間，OpenClaw 會請求原生回合中斷。租約和每個執行緒的
壓縮柵欄會持續保留，直到 Codex 回報終止狀態或確認
中斷 RPC。如果 Codex 未在中斷寬限
期內確認，OpenClaw 會先停用連線，再釋放柵欄。遠端
連線也會解除相符的執行緒繫結，使後續工作無法
與未確認的遠端回合重疊。已停用連線上的其他回合會
失敗，並可在新的用戶端上重試。用戶端關閉、請求取消或
壓縮回合失敗都會傳回失敗的作業。自動內容壓力
壓縮是 Codex 的工作；OpenClaw 只會針對手動
要求的觸發條件啟動原生壓縮。

當內容引擎要求 Codex 執行緒啟動投影時，OpenClaw
會將工具呼叫名稱與 ID、輸入形狀，以及經遮蔽的工具結果
內容投影至新的 Codex 執行緒。它不會將原始工具呼叫引數
值複製到該投影中。

此鏡像包含使用者提示、助理最終文字，以及 app-server 發出時的精簡
Codex 推理或計畫記錄。OpenClaw
會記錄原生壓縮的開始和終止狀態，但不會
公開人類可讀的壓縮摘要，也不會提供可稽核的清單來列出
Codex 在壓縮後保留了哪些項目。

由於 Codex 擁有標準的原生執行緒，`tool_result_persist` 不會
改寫 Codex 原生工具結果記錄。它只會在 OpenClaw
寫入由 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

## 媒體與傳遞

OpenClaw 會繼續負責媒體傳遞和媒體供應商選擇。圖片、
影片、音樂、PDF、TTS 和媒體理解會使用相符的供應商／模型
設定，例如 `agents.defaults.mediaModels.image`、
`agents.defaults.mediaModels.video`、`pdfModel` 和 `tts`。

文字、圖片、影片、音樂、TTS、核准和訊息工具輸出會繼續
透過一般的 OpenClaw 傳遞路徑處理；媒體生成不需要
舊版執行階段。當 Codex 發出帶有
`savedPath` 的原生圖片生成項目時，即使 Codex 回合沒有助理文字，OpenClaw 也會透過一般的回覆媒體
路徑轉送該確切檔案。

## 相關內容

- [Codex 操作環境](/zh-TW/plugins/codex-harness)
- [Codex 操作環境參考](/zh-TW/plugins/codex-harness-reference)
- [Codex 監督](/zh-TW/plugins/codex-supervision)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [外掛掛鉤](/zh-TW/plugins/hooks)
- [代理程式操作環境外掛](/zh-TW/plugins/sdk-agent-harness)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [軌跡匯出](/zh-TW/tools/trajectory)
