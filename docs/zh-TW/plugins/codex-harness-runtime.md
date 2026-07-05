---
read_when:
    - 你需要 Codex harness 執行階段支援合約
    - 您正在偵錯原生 Codex 工具、掛鉤、壓縮或意見回饋上傳
    - 你正在變更 OpenClaw 與 Codex 測試框架回合中的外掛行為
summary: Codex 測試框架的執行階段邊界、鉤子、工具、權限與診斷
title: Codex 測試框架執行階段
x-i18n:
    generated_at: "2026-07-05T11:30:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bcf458cfae804655e4544682ff7c12643bccf298b868d918b7c115ae5d075eae
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex harness 回合的執行階段契約。如需設定與路由，請參閱
[Codex harness](/zh-TW/plugins/codex-harness)。如需設定欄位，請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference)。

## 概觀

Codex 擁有原生模型迴圈、原生執行緒恢復、原生工具
延續，以及原生壓縮。OpenClaw 擁有頻道路由、工作階段
檔案、可見訊息傳遞、OpenClaw 動態工具、核准、媒體
傳遞，以及該邊界周圍的轉錄鏡像。

提示路由遵循所選執行階段，而不只是提供者字串。原生
Codex 回合會取得 Codex app-server 開發者指示；明確的
OpenClaw 相容性路由會保留一般 OpenClaw 系統提示，即使
它使用 Codex 風格的 OpenAI 驗證或傳輸。

OpenClaw 會在停用 Codex 內建人格（`personality: "none"`）的情況下啟動並恢復原生 Codex 執行緒，讓工作區人格檔案
與 OpenClaw 代理身分維持權威。原生 Codex 仍會保留 Codex 擁有的
基礎/模型指示與專案文件載入。輕量級
OpenClaw 執行（例如排程）仍會抑制專案文件載入。

OpenClaw 開發者指示涵蓋 OpenClaw 執行階段關注事項：來源頻道
傳遞、OpenClaw 動態工具、ACP 委派、配接器內容，以及
作用中代理工作區設定檔。Skill 目錄與透過工具路由的
`MEMORY.md` 指標會投射為回合範圍的協作開發者
指示。當記憶工具不可用時，作用中 `BOOTSTRAP.md` 內容
與完整 `MEMORY.md` 會改為回退到純回合輸入內容脈絡。

## 執行緒繫結與模型變更

當 OpenClaw 工作階段附加到現有 Codex 執行緒時，下一個
回合會將目前選取的模型、核准政策、沙箱、
核准審閱者，以及服務層級重新傳送給 app-server。從
`openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留執行緒繫結，但要求 Codex
使用新選取的模型繼續。

## 可見回覆與心跳偵測

透過 Codex harness 的直接/來源聊天回合，預設會對內部 WebChat 介面
自動傳遞最終助理回覆，符合 Pi harness
契約：代理會正常回覆，OpenClaw 會將最終文字張貼到
來源對話。設定 `messages.visibleReplies: "message_tool"` 可讓
最終助理文字保持私密，除非代理呼叫 `message(action="send")`。

Codex 心跳偵測回合預設會在可搜尋的 OpenClaw 工具
目錄中取得 `heartbeat_respond`，讓代理可以記錄這次喚醒應保持安靜
或通知。心跳偵測主動性指引會作為限定於心跳偵測回合的
Codex 協作模式開發者指示傳送；一般聊天回合則維持
Codex 預設模式。當 `HEARTBEAT.md` 非空時，心跳偵測
指示會將 Codex 指向該檔案，而不是內嵌其內容。

## Hook 邊界

| 層級                                  | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 外掛 hook                    | OpenClaw                 | OpenClaw 與 Codex harness 之間的產品/外掛相容性。                   |
| Codex app-server 擴充中介軟體         | OpenClaw 綁定外掛        | OpenClaw 動態工具周圍的每回合配接器行為。                           |
| Codex 原生 hook                       | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。                |

OpenClaw 不會使用專案或全域 Codex `hooks.json` 檔案來路由
外掛行為。針對原生工具與權限橋接，OpenClaw 會為 `PreToolUse`、`PostToolUse`、`PermissionRequest`
與 `Stop` 注入每執行緒 Codex 設定。

當 Codex app-server 核准已啟用（`approvalPolicy` 不是
`"never"`）時，預設注入的原生 hook 設定會省略 `PermissionRequest`，
讓 Codex 的 app-server 審閱者與 OpenClaw 的核准橋接在審閱後處理真正的
升級請求。將 `permission_request` 新增到
`nativeHookRelay.events` 可強制使用相容性中繼。其他 Codex
hook（例如 `SessionStart` 與 `UserPromptSubmit`）仍是 Codex 層級
控制；它們不會在 v1 契約中公開為 OpenClaw 外掛 hook。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求
呼叫後執行該工具，因此外掛與中介軟體行為會在 harness 配接器中執行。對於
Codex 原生工具，Codex 擁有標準工具記錄；OpenClaw 可以鏡像
選取的事件，但除非 Codex 透過 app-server 或原生 hook 回呼公開該能力，
否則無法重寫原生執行緒。

Codex app-server 報告模式 `PreToolUse` 事件會將外掛核准延後至
對應的 app-server 核准。如果 OpenClaw `before_tool_call` hook 回傳
`requireApproval`，同時原生酬載設定 `openclaw_approval_mode:
"report"`，原生 hook 中繼會記錄外掛核准要求，且
不回傳原生決策。當 Codex 稍後針對相同工具使用送出 app-server 核准
請求時，OpenClaw 會開啟外掛核准提示，並
將決策映射回 Codex。Codex `PermissionRequest` 事件是
獨立的核准路徑，且在設定該橋接時仍可透過 OpenClaw 核准路由。

Codex app-server 項目通知也會為未被原生
`PostToolUse` 中繼涵蓋的原生工具完成提供非同步 `after_tool_call`
觀察。這些僅用於遙測/相容性；它們無法
阻擋、延遲或修改原生工具呼叫。

壓縮與 LLM 生命週期投射來自 Codex app-server
通知與 OpenClaw 配接器狀態，而非原生 Codex hook 命令。
`before_compaction`、`after_compaction`、`llm_input` 與 `llm_output` 是
配接器層級觀察，而不是 Codex 內部
請求或壓縮酬載的逐位元組擷取。

Codex 原生 `hook/started` 與 `hook/completed` app-server 通知會
投射為 `codex_app_server.hook` 代理事件，用於軌跡與
偵錯。它們不會呼叫 OpenClaw 外掛 hook。

## V1 支援契約

Codex 執行階段 v1 支援：

| 介面                                          | 支援                                                                             | 原因                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈                 | 支援                                                                             | Codex app-server 擁有 OpenAI 回合、原生對話串續接，以及原生工具續行。                                                                                                                                                                                                                                                                                                                                                                                                              |
| OpenClaw 通道路由和傳遞                       | 支援                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 和其他通道留在模型執行階段之外。                                                                                                                                                                                                                                                                                                                                                                                                      |
| OpenClaw 動態工具                             | 支援                                                                             | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 會留在執行路徑中。                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 提示詞和上下文外掛                            | 支援                                                                             | OpenClaw 會將 OpenClaw 專屬提示詞/上下文投射到 Codex 回合，同時將 Codex 擁有的基礎提示詞、模型提示詞，以及已設定的專案文件提示詞留在原生 Codex 路徑中。OpenClaw 會停用原生對話串的 Codex 內建個性，讓代理工作區個性檔案保持權威性。原生 Codex 開發者指示只接受明確限定於 `codex_app_server` 範圍的命令指引；舊版全域命令提示仍保留給非 Codex 提示詞介面。 |
| 上下文引擎生命週期                            | 支援                                                                             | 組裝、擷取和回合後維護會圍繞 Codex 回合執行。上下文引擎不會取代原生 Codex 壓縮。                                                                                                                                                                                                                                                                                                                                                                                                    |
| 動態工具掛鉤                                  | 支援                                                                             | `before_tool_call`、`after_tool_call` 和工具結果中介軟體會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                                                                                                                                                                                                                                                                                                       |
| 生命週期掛鉤                                  | 支援作為配接器觀察                                                               | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以真實的 Codex 模式酬載觸發。                                                                                                                                                                                                                                                                                                                                                                   |
| 最終答案修訂閘門                              | 透過原生掛鉤中繼支援                                                             | Codex `Stop` 會中繼到 `before_agent_finalize`；`revise` 會要求 Codex 在最終定稿前再執行一次模型傳遞。                                                                                                                                                                                                                                                                                                                                                                               |
| 原生 Shell、修補和 MCP 封鎖或觀察             | 透過原生掛鉤中繼支援                                                             | Codex `PreToolUse` 和 `PostToolUse` 會針對已提交的原生工具介面中繼，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 酬載。支援封鎖；不支援引數重寫。                                                                                                                                                                                                                                                                                                                           |
| 原生權限政策                                  | 透過 Codex app-server 核准和相容性原生掛鉤中繼支援                               | Codex app-server 核准請求會在 Codex 審查後透過 OpenClaw 路由。`PermissionRequest` 原生掛鉤中繼對原生核准模式是選擇性啟用，因為 Codex 會在 guardian 審查前發出它。                                                                                                                                                                                                                                                                                                                |
| App-server 軌跡擷取                           | 支援                                                                             | OpenClaw 會記錄傳送給 app-server 的請求，以及收到的 app-server 通知。                                                                                                                                                                                                                                                                                                                                                                                                              |

Codex 執行階段 v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                         | 未來路徑                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生前置工具掛鉤可以封鎖，但 OpenClaw 不會重寫 Codex 原生工具引數。                                                                      | 需要 Codex 掛鉤/結構描述支援替換工具輸入。                                                |
| 可編輯的 Codex 原生逐字稿歷史                       | Codex 擁有標準原生對話串歷史。OpenClaw 擁有鏡像並可投射未來上下文，但不應變更不支援的內部結構。                                                | 如果需要原生對話串手術，請新增明確的 Codex app-server API。                               |
| Codex 原生工具記錄的 `tool_result_persist`          | 該掛鉤會轉換 OpenClaw 擁有的逐字稿寫入，而不是 Codex 原生工具記錄。                                                                            | 可以鏡像已轉換的記錄，但標準重寫需要 Codex 支援。                                         |
| 豐富的原生壓縮中繼資料                              | OpenClaw 可以請求原生壓縮，但不會收到穩定的保留/丟棄清單、權杖差異、完成摘要或摘要酬載。                                                      | 需要更豐富的 Codex 壓縮事件。                                                             |
| 壓縮干預                                            | OpenClaw 不允許外掛或上下文引擎否決、重寫或替換原生 Codex 壓縮。                                                                               | 如果外掛需要否決或重寫原生壓縮，請新增 Codex 壓縮前/後掛鉤。                              |
| 逐位元組一致的模型 API 請求擷取                     | OpenClaw 可以擷取 app-server 請求和通知，但 Codex 核心會在內部建構最終 OpenAI API 請求。                                                       | 需要 Codex 模型請求追蹤事件或偵錯 API。                                                   |

## 原生權限和 MCP 誘發請求

對於 `PermissionRequest`，OpenClaw 只會在政策做出決定時回傳明確允許或拒絕的
決策。無決策結果不是允許：Codex 會將其視為沒有掛鉤決策，並落入自己的 guardian 或使用者
核准路徑。

Codex app-server 核准模式預設會省略此原生掛鉤。除非 `permission_request` 明確包含在
`nativeHookRelay.events` 中，或相容性執行階段安裝了它，否則皆適用此行為。

當操作員為 Codex 原生權限請求選擇 `allow-always` 時，OpenClaw 會在有界工作階段視窗內
記住該精確的 provider/session/tool input/cwd 指紋。記住的決策刻意只做精確比對：
命令、引數、工具酬載或 cwd 的變更都會產生新的核准。

當 Codex 將 `_meta.codex_approval_kind` 標示為 `"mcp_tool_call"` 時，Codex MCP 工具核准
誘發請求會透過 OpenClaw 的外掛核准流程路由。Codex `request_user_input` 提示會送回原始
聊天，而下一則排入佇列的後續訊息會回答該原生伺服器請求，而不是被導向為額外上下文。
其他 MCP 誘發請求會封閉失敗。

如需承載這些提示的一般外掛核准流程，請參閱
[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)。

## 佇列導向

主動執行佇列導向會映射到 Codex app-server `turn/steer`。使用預設
`messages.queue.mode: "steer"` 時，OpenClaw 會在設定的靜默視窗內批次處理導向模式聊天
訊息，並依抵達順序將它們作為一個 `turn/steer` 請求傳送。

Codex 審查和手動壓縮回合可能會拒絕同一回合的導引。在
這種情況下，OpenClaw 會等候作用中的執行完成後再啟動
提示。當訊息預設應排入佇列而不是導引時，請使用 `/queue followup` 或 `/queue collect`。請參閱[導引佇列](/zh-TW/concepts/queue-steering)。

## Codex 意見回饋上傳

當原生 Codex 執行框架上的工作階段核准 `/diagnostics [note]` 時，OpenClaw 也會針對相關
Codex 執行緒呼叫 Codex 應用程式伺服器的 `feedback/upload`，包括每個列出執行緒的記錄，以及可用時產生的 Codex
子執行緒。

上傳會透過 Codex 的一般意見回饋路徑傳送到 OpenAI 伺服器。如果
該應用程式伺服器停用了 Codex 意見回饋，該命令會回傳
應用程式伺服器錯誤。完成的診斷回覆會列出已傳送執行緒的頻道、
OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機 `codex resume <thread-id>`
命令。

如果你拒絕或忽略核准，OpenClaw 不會印出那些 Codex ID，
也不會傳送 Codex 意見回饋。上傳不會取代本機
閘道診斷匯出。關於核准、隱私、本機套件和群組聊天行為，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

只有在你想要針對目前附加的執行緒進行 Codex 意見回饋上傳，
且不需要完整閘道診斷套件時，才使用 `/codex diagnostics [note]`。

## 壓縮與逐字稿鏡像

當選取的模型使用 Codex 執行框架時，原生執行緒壓縮
屬於 Codex 應用程式伺服器。OpenClaw 不會為
Codex 回合執行預檢壓縮、不會以情境引擎壓縮取代 Codex 壓縮，也不會在無法啟動原生壓縮時
退回使用 OpenClaw 或公開 OpenAI 摘要。OpenClaw 會保留逐字稿鏡像，用於頻道歷史、搜尋、
`/new`、`/reset`，以及未來的模型或執行框架切換。

明確的壓縮要求，例如 `/compact` 或外掛要求的手動
壓縮操作，會使用 `thread/compact/start` 啟動原生 Codex 壓縮。
OpenClaw 會保持該要求和共享用戶端租約開啟，直到 Codex 發出
相符的 `contextCompaction` 完成項目，接著將該壓縮
回合回報為已完成。如果該終端回合超過設定的壓縮
逾時，OpenClaw 會要求原生回合中斷。租約和每個執行緒的
壓縮柵欄會持續保留，直到 Codex 回報終端狀態或確認
中斷 RPC。如果 Codex 未在中斷寬限
期間內確認，OpenClaw 會在釋放柵欄前淘汰連線。遠端
連線也會卸離相符的執行緒繫結，讓後續工作無法
與未確認的遠端回合重疊。已淘汰連線上的其他回合會失敗，
並可在新的用戶端上重試。用戶端關閉、要求取消或
壓縮回合失敗，都會回傳失敗的操作。自動情境壓力
壓縮是 Codex 的工作；OpenClaw 只會針對手動
要求的觸發啟動原生壓縮。

當情境引擎要求 Codex 執行緒啟動投影時，OpenClaw
會將工具呼叫名稱和 ID、輸入形狀，以及已遮蔽的工具結果
內容投影到新的 Codex 執行緒中。它不會將原始工具呼叫引數
值複製到該投影中。

鏡像包含使用者提示、最終助理文字，以及應用程式伺服器發出時的輕量
Codex 推理或計畫記錄。OpenClaw
會記錄原生壓縮啟動和終端狀態，但不會
公開人類可讀的壓縮摘要，或 Codex 在壓縮後保留哪些
項目的可稽核清單。

因為 Codex 擁有標準原生執行緒，`tool_result_persist` 不會
重寫 Codex 原生工具結果記錄。它只會在 OpenClaw
寫入由 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

## 媒體與傳遞

OpenClaw 會繼續擁有媒體傳遞和媒體提供者選取。圖片、
影片、音樂、PDF、TTS 和媒體理解會使用相符的提供者/模型
設定，例如 `agents.defaults.imageGenerationModel`、
`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文字、圖片、影片、音樂、TTS、核准和訊息工具輸出會繼續
透過一般 OpenClaw 傳遞路徑；媒體生成不需要
舊版執行階段。當 Codex 發出含有
`savedPath` 的原生圖片生成項目時，即使 Codex 回合沒有助理文字，OpenClaw 也會透過一般回覆媒體
路徑轉送該確切檔案。

## 相關

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)
- [原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)
- [外掛鉤子](/zh-TW/plugins/hooks)
- [代理執行框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [軌跡匯出](/zh-TW/tools/trajectory)
