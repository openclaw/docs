---
read_when:
    - 你需要 Codex harness 執行階段支援合約
    - 您正在偵錯原生 Codex 工具、鉤子、Compaction 或意見回饋上傳
    - 你正在變更跨 PI 與 Codex harness 回合的 Plugin 行為
summary: Codex 執行框架的執行階段邊界、鉤子、工具、權限與診斷
title: Codex 執行框架執行階段
x-i18n:
    generated_at: "2026-05-10T19:42:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

此頁記錄 Codex harness 回合的 runtime contract。若要設定和路由，請從 [Codex harness](/zh-TW/plugins/codex-harness) 開始。若要了解設定欄位，請參閱 [Codex harness reference](/zh-TW/plugins/codex-harness-reference)。

## 概觀

Codex 模式並不是底層換成不同模型呼叫的 PI。Codex 擁有更多原生模型迴圈，而 OpenClaw 會圍繞該邊界調整其 Plugin、工具、工作階段與診斷介面。

OpenClaw 仍然負責頻道路由、工作階段檔案、可見訊息傳遞、OpenClaw 動態工具、核准、媒體傳遞，以及逐字稿鏡像。Codex 負責權威的原生對話串、原生模型迴圈、原生工具接續，以及原生 Compaction。

## 對話串綁定和模型變更

當 OpenClaw 工作階段附加到現有 Codex 對話串時，下一個回合會再次將目前選取的 OpenAI 模型、核准政策、沙箱和服務層級傳送到 app-server。從 `openai/gpt-5.5` 切換到 `openai/gpt-5.2` 會保留對話串綁定，但要求 Codex 使用新選取的模型繼續。

## 可見回覆和 Heartbeat

當來源聊天回合透過 Codex harness 執行時，如果部署尚未明確設定 `messages.visibleReplies`，可見回覆預設會使用 OpenClaw `message` 工具。代理仍可私下完成其 Codex 回合；只有在呼叫 `message(action="send")` 時才會發佈到頻道。設定 `messages.visibleReplies: "automatic"` 可讓直接聊天的最終回覆維持在舊版自動傳遞路徑上。

Codex Heartbeat 回合預設也會在可搜尋的 OpenClaw 工具目錄中取得 `heartbeat_respond`，因此代理可以記錄這次喚醒應保持安靜或發出通知，而不必在最終文字中編碼該控制流程。

Heartbeat 專用的主動性指引會在 Heartbeat 回合本身作為 Codex 協作模式開發者指令傳送。一般聊天回合會恢復 Codex Default 模式，而不是在其一般 runtime prompt 中帶入 Heartbeat 理念。

## Hook 邊界

Codex harness 有三個 hook 層：

| 層級                                  | 擁有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hooks                 | OpenClaw                 | 跨 PI 和 Codex harness 的產品/Plugin 相容性。                       |
| Codex app-server 擴充 middleware      | OpenClaw bundled plugins | 圍繞 OpenClaw 動態工具的每回合轉接器行為。                          |
| Codex 原生 hooks                      | Codex                    | 來自 Codex 設定的低階 Codex 生命週期與原生工具政策。                |

OpenClaw 不使用專案或全域 Codex `hooks.json` 檔案來路由 OpenClaw Plugin 行為。對於支援的原生工具和權限橋接，OpenClaw 會為 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入每個對話串的 Codex 設定。

當 Codex app-server 核准已啟用，也就是 `approvalPolicy` 不是 `"never"` 時，預設注入的原生 hook 設定會省略 `PermissionRequest`，因此 Codex 的 app-server 審查器和 OpenClaw 的核准橋接會在審查後處理真正的升級。操作員需要相容性轉送時，可以明確將 `permission_request` 加入 `nativeHookRelay.events`。

其他 Codex hooks，例如 `SessionStart` 和 `UserPromptSubmit`，仍然是 Codex 層級的控制。它們不會在 v1 contract 中作為 OpenClaw Plugin hooks 暴露。

對於 OpenClaw 動態工具，OpenClaw 會在 Codex 要求呼叫後執行工具，因此 OpenClaw 會在 harness 轉接器中觸發其擁有的 Plugin 和 middleware 行為。對於 Codex 原生工具，Codex 擁有權威工具記錄。OpenClaw 可以鏡像選定事件，但除非 Codex 透過 app-server 或原生 hook 回呼暴露該操作，否則 OpenClaw 無法改寫原生 Codex 對話串。

Compaction 和 LLM 生命週期投影來自 Codex app-server 通知與 OpenClaw 轉接器狀態，而不是原生 Codex hook 指令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是轉接器層級的觀察結果，不是 Codex 內部請求或 Compaction payload 的逐位元組擷取。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知會投影為 `codex_app_server.hook` 代理事件，用於軌跡和偵錯。它們不會叫用 OpenClaw Plugin hooks。

## V1 支援 contract

Codex runtime v1 支援：

| 介面                                          | 支援                                                                             | 原因                                                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 透過 Codex 的 OpenAI 模型迴圈                 | 支援                                                                             | Codex app-server 擁有 OpenAI 回合、原生對話串恢復，以及原生工具接續。                                                                                                                                     |
| OpenClaw 頻道路由和傳遞                      | 支援                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 和其他頻道保留在模型 runtime 之外。                                                                                                                          |
| OpenClaw 動態工具                            | 支援                                                                             | Codex 要求 OpenClaw 執行這些工具，因此 OpenClaw 仍在執行路徑中。                                                                                                                                          |
| Prompt 和 context plugins                     | 支援                                                                             | OpenClaw 在啟動或恢復對話串前建立 prompt overlays，並將 context 投影到 Codex 回合中。                                                                                                                      |
| Context engine 生命週期                      | 支援                                                                             | 組裝、擷取、回合後維護，以及 context-engine Compaction 協調會為 Codex 回合執行。                                                                                                                          |
| 動態工具 hooks                               | 支援                                                                             | `before_tool_call`、`after_tool_call` 和 tool-result middleware 會圍繞 OpenClaw 擁有的動態工具執行。                                                                                                       |
| 生命週期 hooks                               | 作為轉接器觀察結果支援                                                          | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 會以真實的 Codex 模式 payload 觸發。                                                                                     |
| 最終答案修訂閘門                             | 透過原生 hook 轉送支援                                                          | Codex `Stop` 會轉送到 `before_agent_finalize`；`revise` 會要求 Codex 在最終化前再執行一次模型 pass。                                                                                                       |
| 原生 shell、patch 和 MCP 封鎖或觀察           | 透過原生 hook 轉送支援                                                          | Codex `PreToolUse` 和 `PostToolUse` 會針對已承諾的原生工具介面轉送，包括 Codex app-server `0.125.0` 或更新版本上的 MCP payload。支援封鎖；不支援引數改寫。                                                |
| 原生權限政策                                 | 透過 Codex app-server 核准和相容性原生 hook 轉送支援                             | Codex app-server 核准要求會在 Codex 審查後透過 OpenClaw 路由。`PermissionRequest` 原生 hook 轉送對原生核准模式為 opt-in，因為 Codex 會在 guardian 審查前發出它。                                          |
| App-server 軌跡擷取                           | 支援                                                                             | OpenClaw 會記錄傳送到 app-server 的請求，以及收到的 app-server 通知。                                                                                                                                     |

Codex runtime v1 不支援：

| 介面                                                | V1 邊界                                                                                                                                        | 未來路徑                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具引數變更                                    | Codex 原生 pre-tool hooks 可以封鎖，但 OpenClaw 不會改寫 Codex 原生工具引數。                                                                 | 需要 Codex hook/schema 支援替換工具輸入。                                                 |
| 可編輯的 Codex 原生逐字稿歷史                       | Codex 擁有權威原生對話串歷史。OpenClaw 擁有鏡像並可投影未來 context，但不應變更未支援的內部。                                                 | 若需要原生對話串手術，加入明確的 Codex app-server API。                                  |
| Codex 原生工具記錄的 `tool_result_persist`          | 該 hook 轉換 OpenClaw 擁有的逐字稿寫入，而不是 Codex 原生工具記錄。                                                                            | 可以鏡像轉換後的記錄，但權威改寫需要 Codex 支援。                                        |
| 豐富的原生 Compaction metadata                       | OpenClaw 觀察 Compaction 開始和完成，但不會收到穩定的保留/丟棄清單、token delta 或 summary payload。                                           | 需要更豐富的 Codex Compaction 事件。                                                      |
| Compaction 介入                                     | 目前 OpenClaw Compaction hooks 在 Codex 模式中是通知層級。                                                                                     | 如果 plugins 需要否決或改寫原生 Compaction，加入 Codex pre/post Compaction hooks。        |
| 逐位元組模型 API 請求擷取                           | OpenClaw 可以擷取 app-server 請求和通知，但 Codex core 會在內部建立最終 OpenAI API 請求。                                                     | 需要 Codex model-request tracing 事件或 debug API。                                      |

## 原生權限和 MCP elicitations

對於 `PermissionRequest`，OpenClaw 只會在政策決定時傳回明確的允許或拒絕決策。沒有決策的結果不是允許。Codex 會將它視為沒有 hook 決策，並落入自己的 guardian 或使用者核准路徑。

Codex app-server 核准模式預設會省略此原生 hook。當 `permission_request` 明確包含在 `nativeHookRelay.events` 中，或相容性 runtime 安裝它時，此行為適用。

當操作員針對 Codex 原生權限請求選擇 `allow-always` 時，
OpenClaw 會在有界的工作階段視窗內，記住該確切的 provider/session/tool input/cwd 指紋。記住的決策刻意只採完全相符：
變更的命令、引數、工具酬載或 cwd 都會建立新的
核准。

當 Codex 將 `_meta.codex_approval_kind` 標示為
`"mcp_tool_call"` 時，Codex MCP 工具核准引導會透過 OpenClaw 的 Plugin
核准流程路由。Codex `request_user_input` 提示會傳回
原始聊天，而下一則排入佇列的後續訊息會回答該原生
伺服器請求，而不是被導向為額外內容。其他 MCP 引導
請求會封閉失敗。

## 佇列導向

作用中執行的佇列導向會對應到 Codex 應用程式伺服器 `turn/steer`。使用
預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的靜默視窗內批次處理排入佇列的聊天訊息，並依
抵達順序以單一 `turn/steer` 請求傳送。舊版 `queue` 模式會傳送個別的 `turn/steer` 請求。

Codex 審查和手動 Compaction 回合可能會拒絕同回合導向。在這種
情況下，當所選模式允許後援時，OpenClaw 會使用後續佇列。
請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

## Codex 意見回饋上傳

當使用原生 Codex harness 的工作階段核准 `/diagnostics [note]` 時，OpenClaw 也會針對相關的 Codex 執行緒呼叫 Codex 應用程式伺服器 `feedback/upload`。上傳會要求應用程式伺服器在可用時包含每個列出執行緒及衍生 Codex 子執行緒的記錄。

上傳會透過 Codex 的一般意見回饋路徑傳送到 OpenAI 伺服器。如果該應用程式伺服器停用 Codex
意見回饋，此命令會傳回應用程式伺服器
錯誤。完成的診斷回覆會列出已傳送執行緒的頻道、OpenClaw 工作階段 ID、
Codex 執行緒 ID，以及本機 `codex resume <thread-id>` 命令。

如果你拒絕或忽略核准，OpenClaw 不會列印那些 Codex ID，且
不會傳送 Codex 意見回饋。此上傳不會取代本機 Gateway
診斷匯出。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)，了解
核准、隱私、本機套件和群組聊天行為。

只有當你特別想要針對目前附加的執行緒進行 Codex
意見回饋上傳，而不需要完整 Gateway
診斷套件時，才使用 `/codex diagnostics [note]`。

## Compaction 和逐字稿鏡像

當所選模型使用 Codex harness 時，原生執行緒 Compaction 會
委派給 Codex 應用程式伺服器。OpenClaw 會保留逐字稿鏡像，用於頻道
歷程、搜尋、`/new`、`/reset`，以及未來的模型或 harness 切換。

鏡像包含使用者提示、最終助理文字，以及應用程式伺服器發出時的輕量 Codex
推理或計畫記錄。目前，OpenClaw 只
記錄原生 Compaction 開始和完成訊號。它尚未公開
可供人閱讀的 Compaction 摘要，或 Codex
在 Compaction 後保留哪些項目的可稽核清單。

由於 Codex 擁有權威的原生執行緒，`tool_result_persist` 目前不會
重寫 Codex 原生工具結果記錄。它只會在
OpenClaw 正在寫入由 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

## 媒體和傳遞

OpenClaw 會繼續擁有媒體傳遞和媒體提供者選擇。圖片、
影片、音樂、PDF、TTS 和媒體理解會使用相符的提供者/模型
設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、
`pdfModel` 和 `messages.tts`。

文字、圖片、影片、音樂、TTS、核准和訊息工具輸出會繼續
透過一般 OpenClaw 傳遞路徑。媒體生成不需要 PI。
當 Codex 發出帶有 `savedPath` 的原生圖片生成項目時，OpenClaw
會透過一般回覆媒體路徑轉送該確切檔案，即使 Codex
回合沒有助理文字也是如此。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [原生 Codex plugins](/zh-TW/plugins/codex-native-plugins)
- [Plugin 鉤子](/zh-TW/plugins/hooks)
- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [軌跡匯出](/zh-TW/tools/trajectory)
