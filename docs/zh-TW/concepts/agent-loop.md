---
read_when:
    - 你需要代理迴圈或生命週期事件的精確逐步說明
    - 你正在變更工作階段佇列、逐字稿寫入或工作階段寫入鎖定行為
summary: 代理迴圈生命週期、串流與等待語意
title: 代理迴圈
x-i18n:
    generated_at: "2026-07-05T11:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0c8c8c31ae3f821b4186f6353e2e844e12e188f142fdf4ee3cd217050c315c
    source_path: concepts/agent-loop.md
    workflow: 16
---

代理程式迴圈是序列化的、逐工作階段執行流程，會將訊息轉換成
動作與回覆：接收、脈絡組裝、模型推論、工具
執行、串流、持久化。

## 進入點

- 閘道 RPC：`agent` 和 `agent.wait`。
- 命令列介面：`openclaw agent`。

## 執行順序

1. `agent` RPC 會驗證參數、解析工作階段（`sessionKey`/`sessionId`）、持久化工作階段中繼資料，並立即回傳 `{ runId, acceptedAt }`。
2. `agentCommand` 會執行該輪對話：解析模型 + thinking/verbose/trace 預設值、載入 Skills 快照、呼叫 `runEmbeddedAgent`，並在嵌入式迴圈尚未發出時發出後援的**生命週期結束/錯誤**。
3. `runEmbeddedAgent`：透過逐工作階段與全域佇列序列化執行、解析模型 + 驗證設定檔、建構 OpenClaw 工作階段、訂閱執行階段事件、串流助理/工具增量、強制執行執行逾時（到期時中止），並回傳承載資料與用量中繼資料。對於 Codex app-server 對話輪次，它也會中止在終端事件前停止產生 app-server 進度的已接受輪次。
4. `subscribeEmbeddedAgentSession` 會將執行階段事件橋接到 `agent` 串流：工具事件到 `stream: "tool"`、助理增量到 `stream: "assistant"`、生命週期事件到 `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）。
5. `agent.wait`（`waitForAgentRun`）會等待某個 `runId` 的**生命週期結束/錯誤**，並回傳 `{ status: ok|error|timeout, startedAt, endedAt, error? }`。

## 佇列與並行

執行會依工作階段金鑰（工作階段通道）序列化，並可選擇再透過全域通道，避免工具/工作階段競爭。訊息通道會選擇佇列模式（steer/followup/collect/interrupt）以饋入此通道系統；請參閱[命令佇列](/zh-TW/concepts/queue)。

逐字稿寫入另由工作階段檔案上的工作階段寫入鎖保護。此鎖感知程序且以檔案為基礎，因此能捕捉繞過程序內佇列或來自另一個程序的寫入者。寫入者最多等待 `session.writeLock.acquireTimeoutMs`（預設 `60000` 毫秒；環境變數覆寫 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`），之後才回報工作階段忙碌。

工作階段寫入鎖預設不可重入。有意在保留一個邏輯寫入者的同時巢狀取得同一把鎖的輔助函式，必須透過 `allowReentrant: true` 選擇加入。

## 工作階段與工作區準備

- 工作區會被解析並建立；沙盒化執行可能會重新導向到沙盒工作區根目錄。
- Skills 會被載入（或從快照重用）並注入環境與提示。
- Bootstrap/脈絡檔案會被解析並注入系統提示。
- 串流開始前會取得工作階段寫入鎖，並開啟和準備 `SessionManager`。任何後續的逐字稿重寫、壓縮或截斷路徑，都必須先取得同一把鎖，才能開啟或變更逐字稿檔案。

## 提示組裝

系統提示會由 OpenClaw 的基礎提示、Skills 提示、bootstrap 脈絡，以及逐執行覆寫組成。會強制執行模型特定限制與壓縮保留 token。模型會看到什麼，請參閱[系統提示](/zh-TW/concepts/system-prompt)。

## Hook

OpenClaw 有兩套 hook 系統：

- **內部 hook**（閘道 hook）：用於命令與生命週期事件的事件驅動指令碼。
- **外掛 hook**：代理程式/工具生命週期與閘道管線內的擴充點。

### 內部 hook（閘道 hook）

- **`agent:bootstrap`**：在系統提示定稿前建構 bootstrap 檔案時執行。用它新增或移除 bootstrap 脈絡檔案。
- **命令 hook**：`/new`、`/reset`、`/stop` 和其他命令事件（請參閱 Hooks 文件）。

請參閱 [Hooks](/zh-TW/automation/hooks) 了解設定與範例。

### 外掛 hook

這些會在代理程式迴圈或閘道管線內執行：

| Hook                                                    | 執行                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | 工作階段前（沒有 `messages`），用於在解析前以確定性方式覆寫供應商/模型。                                                                                                                                                                                                |
| `before_prompt_build`                                   | 工作階段載入後（含 `messages`），用於在提交前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。將 `prependContext` 用於逐輪動態文字，並將系統脈絡欄位用於屬於系統提示空間的穩定指引。 |
| `before_agent_start`                                    | 舊版相容性 hook，可能在任一階段執行；建議使用上方明確的 hook。                                                                                                                                                                                                    |
| `before_agent_reply`                                    | 在行內動作之後、LLM 呼叫之前。讓外掛接管該輪對話並回傳合成回覆，或完全靜默。                                                                                                                                                                |
| `agent_end`                                             | 完成後，帶有最終訊息清單與執行中繼資料。                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | 觀察或註記壓縮週期。                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | 攔截工具參數/結果。                                                                                                                                                                                                                                                              |
| `before_install`                                        | 在操作員安裝政策執行後，對已暫存的 skill/外掛安裝材料執行，前提是外掛 hook 已載入目前程序。                                                                                                                                                           |
| `tool_result_persist`                                   | 在工具結果寫入 OpenClaw 擁有的工作階段逐字稿前，同步轉換工具結果。                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | 傳入與傳出訊息 hook。                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | 工作階段生命週期邊界。                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | 閘道生命週期事件。                                                                                                                                                                                                                                                                   |

傳出/工具守衛的 hook 決策規則：

- `before_tool_call`：`{ block: true }` 是終止性，且會停止較低優先順序的處理常式。`{ block: false }` 是無操作，且不會清除先前的封鎖。
- `before_install`：與上方相同的終止性/無操作語意。對於必須涵蓋命令列介面安裝與更新路徑、由操作員擁有的安裝允許/封鎖決策，請使用 `security.installPolicy`，而不是 `before_install`。
- `message_sending`：`{ cancel: true }` 是終止性，且會停止較低優先順序的處理常式。`{ cancel: false }` 是無操作，且不會清除先前的取消。

請參閱[外掛 hook](/zh-TW/plugins/hooks) 了解 hook API 與註冊細節。

測試框架可以調整這些 hook。Codex app-server 測試框架會將 OpenClaw 外掛 hook 保持為已記錄鏡像表面的相容性合約；Codex 原生 hook 則是另一個較低層級的 Codex 機制。

## 串流

- 助理增量會從代理程式執行階段以 `assistant` 事件串流。
- 區塊串流可在 `text_end` 或 `message_end` 發出部分回覆。
- 推理串流可以是獨立串流或區塊回覆。
- 請參閱[串流](/zh-TW/concepts/streaming)了解分塊與區塊回覆行為。

## 工具執行

- 工具開始/更新/結束事件會在 `tool` 串流發出。
- 工具結果在記錄/發出前，會針對大小與圖片承載資料清理。
- 訊息工具傳送會被追蹤，以抑制重複的助理確認。

## 回覆塑形

最終承載資料由助理文字（加上選用推理）、行內工具摘要（verbose 且允許時），以及模型錯誤時的助理錯誤文字組裝而成。

- 精確的靜默 token `NO_REPLY` 會從傳出承載資料中過濾。
- 訊息工具重複項會從最終承載資料清單中移除。
- 如果沒有剩餘可呈現的承載資料且工具發生錯誤，則會發出後援工具錯誤回覆，除非訊息工具已傳送使用者可見的回覆。

## 壓縮與重試

自動壓縮會發出 `compaction` 串流事件，並可觸發重試。重試時，記憶體內緩衝區和工具摘要會重設，以避免重複輸出。請參閱[壓縮](/zh-TW/concepts/compaction)。

## 事件串流

- `lifecycle`：由 `subscribeEmbeddedAgentSession` 發出（並由 `agentCommand` 作為後援發出）。
- `assistant`：來自代理程式執行階段的串流增量。
- `tool`：來自代理程式執行階段的串流工具事件。

## 聊天通道處理

助理增量會緩衝成聊天 `delta` 訊息。聊天 `final` 會在**生命週期結束/錯誤**時發出。

## 逾時

| 逾時                                             | 預設值                                                      | 備註                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                                         | 僅等待；`timeoutMs` 參數會覆寫。這不會停止底層執行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 代理執行階段（`agents.defaults.timeoutSeconds`） | 172800s（48h）                                              | 由 `runEmbeddedAgent` 的中止計時器強制執行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 排程隔離的代理回合                               | 由排程擁有                                                  | 排程器會在執行開始時啟動自己的計時器，在設定的截止時間中止執行，接著在記錄逾時之前執行有界限的清理，因此過期的子工作階段無法讓通道持續卡住。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 模型閒置逾時                                     | `agents.defaults.timeoutSeconds`，預設上限為 120s           | 當閒置時間窗內沒有回應區塊到達時，OpenClaw 會中止模型請求。`models.providers.<id>.timeoutSeconds` 會延長此閒置看門狗，以支援較慢的本機/自行託管提供者，但仍受任何較低的 `agents.defaults.timeoutSeconds` 或執行特定逾時限制，因為那些設定會控管整個代理執行。沒有明確模型/代理逾時的排程觸發雲端模型執行會使用相同預設值；若設定了明確的排程執行逾時，雲端模型串流停滯會以 60s 為上限，讓設定的模型後援仍可在外層排程截止時間前執行。排程觸發的本機/自行託管模型執行會停用隱含看門狗，除非已設定明確逾時；請為較慢的本機提供者設定 `models.providers.<id>.timeoutSeconds`。 |
| 提供者 HTTP 請求逾時                             | `models.providers.<id>.timeoutSeconds`                      | 涵蓋連線、標頭、本文、SDK 請求逾時、受防護擷取的中止處理，以及該提供者的模型串流閒置看門狗。請先將它用於較慢的本機/自行託管提供者（例如 Ollama），再提高整個代理執行階段逾時；當模型請求需要執行更久時，請讓代理/執行階段逾時至少同樣長。                                                                                                                                                                                                                                                                                                                                                                                                                 |

### 卡住的工作階段診斷

啟用診斷後，`diagnostics.stuckSessionWarnMs`（預設 `120000` ms）會分類長時間處於 `processing` 且沒有觀察到回覆、工具、狀態、區塊或 ACP 進度的工作階段：

- 作用中的嵌入式執行、模型呼叫和工具呼叫會回報為 `session.long_running`。有擁有者的靜默模型呼叫會維持 `session.long_running` 直到 `diagnostics.stuckSessionAbortMs`，因此較慢或非串流的提供者不會太早被標記為停滯。
- 作用中但最近沒有進度的工作會回報為 `session.stalled`。有擁有者的模型呼叫會在達到或超過中止閾值時切換為 `session.stalled`；無擁有者的過期模型/工具活動不會被隱藏為長時間執行。
- `session.stuck` 保留給可復原的過期工作階段簿記，包括有過期無擁有者模型/工具活動的閒置佇列工作階段。

`diagnostics.stuckSessionAbortMs` 預設至少為 5 分鐘，且為警告閾值的 3 倍。過期工作階段簿記會在復原門檻通過後立即釋放受影響的工作階段通道；停滯的嵌入式執行只會在中止閾值後進行中止排空，因此佇列中的工作會繼續，而不會切斷僅是較慢的執行。復原會發出結構化的已請求/已完成結果；只有在同一個處理世代仍是目前狀態時，診斷狀態才會標記為閒置，而重複的 `session.stuck` 診斷會在工作階段保持不變時退避。

## 哪些情況會提前結束

- 代理逾時（中止）
- AbortSignal（取消）
- 閘道中斷連線或 RPC 逾時
- `agent.wait` 逾時（僅等待，不會停止代理）

## 相關

- [工具](/zh-TW/tools) - 可用的代理工具
- [鉤子](/zh-TW/automation/hooks) - 由代理生命週期事件觸發的事件驅動指令碼
- [壓縮](/zh-TW/concepts/compaction) - 長對話如何被摘要
- [執行核准](/zh-TW/tools/exec-approvals) - shell 命令的核准門檻
- [思考](/zh-TW/tools/thinking) - 思考/推理層級設定
