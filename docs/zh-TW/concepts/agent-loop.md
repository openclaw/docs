---
read_when:
    - 你需要代理程式迴圈或生命週期事件的精確逐步說明
    - 你正在變更工作階段佇列、文字記錄寫入，或工作階段寫入鎖定行為
summary: 代理程式迴圈生命週期、串流與等待語義
title: 代理程式迴圈
x-i18n:
    generated_at: "2026-07-06T21:48:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd171ab1f8defa4c3e65305786fb247bb37379471876f29da52a46ade9fa2699
    source_path: concepts/agent-loop.md
    workflow: 16
---

代理迴圈是每個工作階段序列化的執行流程，會將訊息轉換為
動作與回覆：接收、脈絡組裝、模型推論、工具
執行、串流、持久化。

## 進入點

- 閘道 RPC：`agent` 和 `agent.wait`。
- 命令列介面：`openclaw agent`。

## 執行順序

1. `agent` RPC 會驗證參數、解析工作階段（`sessionKey`/`sessionId`）、持久化工作階段中繼資料，並立即回傳 `{ runId, acceptedAt }`。
2. `agentCommand` 會執行該輪對話：解析模型 + thinking/verbose/trace 預設值、載入 Skills 快照、呼叫 `runEmbeddedAgent`，如果嵌入式迴圈尚未發出 **生命週期結束/錯誤**，則發出後援的 **生命週期結束/錯誤**。
3. `runEmbeddedAgent`：透過每工作階段和全域佇列序列化執行、解析模型 + 驗證設定檔、建構 OpenClaw 工作階段、訂閱執行階段事件、串流助理/工具增量、強制執行執行逾時（到期時中止），並回傳承載資料與用量中繼資料。對於 Codex app-server 輪次，它也會中止已接受但在終端事件前停止產生 app-server 進度的輪次。
4. `subscribeEmbeddedAgentSession` 會將執行階段事件橋接到 `agent` 串流：工具事件到 `stream: "tool"`、助理增量到 `stream: "assistant"`、生命週期事件到 `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）。
5. `agent.wait`（`waitForAgentRun`）會等待某個 `runId` 上的 **生命週期結束/錯誤**，並回傳 `{ status: ok|error|timeout, startedAt, endedAt, error? }`。

## 佇列與並行

執行會依工作階段鍵（工作階段通道）序列化，並可選擇通過全域通道，防止工具/工作階段競態。訊息通道會選擇佇列模式（steer/followup/collect/interrupt），並饋入此通道系統；請參閱[命令佇列](/zh-TW/concepts/queue)。

轉錄寫入也會受到工作階段檔案上的工作階段寫入鎖保護。該鎖具備程序感知能力並以檔案為基礎，因此能捕捉繞過程序內佇列或來自其他程序的寫入者。寫入者最多會等待 `session.writeLock.acquireTimeoutMs`（預設 `60000` 毫秒；環境變數覆寫 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`），之後才會回報工作階段忙碌。

工作階段寫入鎖預設不可重入。若某個輔助工具刻意巢狀取得同一把鎖，同時保留一個邏輯寫入者，必須使用 `allowReentrant: true` 選擇加入。

## 工作階段與工作區準備

- 工作區會被解析並建立；沙盒化執行可能會重新導向到沙盒工作區根目錄。
- Skills 會被載入（或從快照重用），並注入到環境與提示中。
- Bootstrap/脈絡檔案會被解析並注入到系統提示中。
- 在串流開始之前，會取得工作階段寫入鎖，並開啟與準備 `SessionManager`。任何後續的轉錄重寫、壓縮或截斷路徑，都必須在開啟或變更轉錄檔案之前取得同一把鎖。

## 提示組裝

系統提示會由 OpenClaw 的基礎提示、Skills 提示、bootstrap 脈絡與每次執行覆寫建構而成。會強制套用模型特定限制與壓縮保留 token。請參閱[系統提示](/zh-TW/concepts/system-prompt)，了解模型會看到的內容。

## Hook

OpenClaw 有兩套 hook 系統：

- **內部 hook**（閘道 hook）：用於命令與生命週期事件的事件驅動指令碼。
- **外掛 hook**：代理/工具生命週期與閘道管線內的擴充點。

### 內部 hook（閘道 hook）

- **`agent:bootstrap`**：在系統提示最終確定前建構 bootstrap 檔案時執行。可用它新增或移除 bootstrap 脈絡檔案。
- **命令 hook**：`/new`、`/reset`、`/stop` 和其他命令事件（請參閱 Hook 文件）。

設定與範例請參閱 [Hook](/zh-TW/automation/hooks)。

### 外掛 hook

這些會在代理迴圈或閘道管線內執行：

| Hook                                                    | 執行時機                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | 工作階段前（沒有 `messages`），用於在解析前確定性地覆寫提供者/模型。                                                                                                                                                                                                                      |
| `before_prompt_build`                                   | 工作階段載入後（含 `messages`），用於在提交前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。將 `prependContext` 用於每輪動態文字，並將系統脈絡欄位用於屬於系統提示空間的穩定指引。 |
| `before_agent_start`                                    | 舊版相容性 hook，可能在任一階段執行；建議使用上方明確的 hook。                                                                                                                                                                                                                             |
| `before_agent_reply`                                    | 行內動作後、LLM 呼叫前。允許外掛接手該輪對話，並回傳合成回覆或完全靜默。                                                                                                                                                                                                                   |
| `agent_end`                                             | 完成後，帶有最終訊息清單與執行中繼資料。                                                                                                                                                                                                                                                    |
| `before_compaction` / `after_compaction`                | 觀察或註解壓縮週期。                                                                                                                                                                                                                                                                        |
| `before_tool_call` / `after_tool_call`                  | 攔截工具參數/結果。                                                                                                                                                                                                                                                                         |
| `before_install`                                        | 操作者安裝政策執行後，於暫存的 skill/外掛安裝材料上執行，前提是外掛 hook 已載入目前程序。                                                                                                                                                                                                 |
| `tool_result_persist`                                   | 在工具結果寫入 OpenClaw 擁有的工作階段轉錄前，同步轉換工具結果。                                                                                                                                                                                                                            |
| `message_received` / `message_sending` / `message_sent` | 傳入與傳出訊息 hook。                                                                                                                                                                                                                                                                        |
| `session_start` / `session_end`                         | 工作階段生命週期邊界。                                                                                                                                                                                                                                                                      |
| `gateway_start` / `gateway_stop`                        | 閘道生命週期事件。                                                                                                                                                                                                                                                                          |

傳出/工具防護的 hook 決策規則：

- `before_tool_call`：`{ block: true }` 是終端狀態，會停止較低優先級的處理常式。`{ block: false }` 是無操作，不會清除先前的封鎖。
- `before_install`：語意與上述相同，包含終端/無操作行為。若操作者擁有的安裝允許/封鎖決策必須涵蓋命令列介面安裝與更新路徑，請使用 `security.installPolicy`，而不是 `before_install`。
- `message_sending`：`{ cancel: true }` 是終端狀態，會停止較低優先級的處理常式。`{ cancel: false }` 是無操作，不會清除先前的取消。

Hook API 與註冊細節請參閱[外掛 hook](/zh-TW/plugins/hooks)。

測試框架可以調整這些 hook。Codex app-server 測試框架會將 OpenClaw 外掛 hook 保留為已記錄鏡像表面的相容性合約；Codex 原生 hook 是另一個較低階的 Codex 機制。

## 串流

- 助理增量會從代理執行階段以 `assistant` 事件串流。
- 區塊串流可在 `text_end` 或 `message_end` 發出部分回覆。
- 推理串流可以是獨立串流或區塊回覆。
- 分塊與區塊回覆行為請參閱[串流](/zh-TW/concepts/streaming)。

## 工具執行

- 工具開始/更新/結束事件會發出到 `tool` 串流。
- 工具結果在記錄/發出前，會針對大小與圖片承載資料進行清理。
- 訊息工具傳送會被追蹤，以抑制重複的助理確認。

## 回覆塑形

最終承載資料會由助理文字（加上選用推理）、行內工具摘要（在 verbose 且允許時）以及模型錯誤時的助理錯誤文字組裝而成。

- 精確的靜默 token `NO_REPLY` 會從傳出承載資料中過濾。
- 訊息工具重複項會從最終承載資料清單中移除。
- 如果沒有可呈現的承載資料留下，且工具發生錯誤，除非訊息工具已傳送使用者可見的回覆，否則會發出後援工具錯誤回覆。

## 壓縮與重試

自動壓縮會發出 `compaction` 串流事件，並可觸發重試。重試時，記憶體內緩衝區與工具摘要會重設，以避免重複輸出。請參閱[壓縮](/zh-TW/concepts/compaction)。

## 事件串流

- `lifecycle`：由 `subscribeEmbeddedAgentSession` 發出（也會由 `agentCommand` 作為後援發出）。
- `assistant`：來自代理執行階段的串流增量。
- `tool`：來自代理執行階段的串流工具事件。

閘道會將生命週期與工具開始/終端事件投影到有界、
僅含中繼資料的[稽核分類帳](/cli/audit)。此投影會記錄來源與
結果代碼，而不會將提示、訊息、工具引數、工具結果
或原始錯誤從轉錄/執行階段路徑複製出去。

## 聊天通道處理

助理增量會緩衝成聊天 `delta` 訊息。聊天 `final` 會在 **生命週期結束/錯誤** 時發出。

## 逾時

| 逾時                                             | 預設值                                                      | 備註                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                                         | 僅等待；`timeoutMs` 參數會覆寫。它不會停止底層執行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 代理執行階段 (`agents.defaults.timeoutSeconds`) | 172800s (48h)                                               | 由 `runEmbeddedAgent` 的中止計時器強制執行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 排程隔離代理回合                                | 由排程擁有                                                  | 排程器會在執行開始時啟動自己的計時器，在設定的期限中止執行，然後先執行有界限的清理再記錄逾時，確保過期的子工作階段不會讓通道卡住。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 模型閒置逾時                                    | `agents.defaults.timeoutSeconds`，預設上限為 120s           | OpenClaw 會在閒置視窗內沒有回應區塊抵達時中止模型請求。`models.providers.<id>.timeoutSeconds` 會延長此閒置看門狗，供較慢的本機/自行託管提供者使用，但仍會受到任何較低的 `agents.defaults.timeoutSeconds` 或執行專屬逾時限制，因為那些設定會控管整個代理執行。沒有明確模型/代理逾時的排程觸發雲端模型執行會使用相同預設值；若有明確的排程執行逾時，雲端模型串流停滯會以 60s 為上限，讓設定好的模型後援仍可在外層排程期限前執行。排程觸發的本機/自行託管模型執行會停用隱含看門狗，除非已設定明確逾時；請為較慢的本機提供者設定 `models.providers.<id>.timeoutSeconds`。 |
| 提供者 HTTP 請求逾時                            | `models.providers.<id>.timeoutSeconds`                      | 涵蓋連線、標頭、主體、SDK 請求逾時、guarded-fetch 中止處理，以及該提供者的模型串流閒置看門狗。請先用於較慢的本機/自行託管提供者（例如 Ollama），再提高整個代理執行階段逾時；當模型請求需要執行更久時，請讓代理/執行階段逾時至少同樣長。                                                                                                                                                                                                                                                                                                                                                                                                      |

### 卡住工作階段診斷

啟用診斷後，`diagnostics.stuckSessionWarnMs`（預設 `120000` ms）會將長時間處於 `processing`、且沒有觀察到回覆、工具、狀態、區塊或 ACP 進度的工作階段分類：

- 作用中的嵌入式執行、模型呼叫和工具呼叫會回報為 `session.long_running`。有擁有者的靜默模型呼叫會維持 `session.long_running`，直到 `diagnostics.stuckSessionAbortMs`，避免過早將較慢或非串流的提供者標記為停滯。
- 作用中但最近沒有進度的工作會回報為 `session.stalled`。有擁有者的模型呼叫會在達到或超過中止閾值時切換為 `session.stalled`；無擁有者的過期模型/工具活動不會被隱藏為長時間執行。
- `session.stuck` 保留給可復原的過期工作階段簿記，包括具有過期無擁有者模型/工具活動的閒置佇列工作階段。

`diagnostics.stuckSessionAbortMs` 預設至少為 5 分鐘且為警告閾值的 3 倍。過期工作階段簿記會在復原閘門通過後立即釋放受影響的工作階段通道；停滯的嵌入式執行只會在中止閾值後進行中止排空，因此佇列工作可恢復，而不會切斷只是較慢的執行。復原會發出結構化的 requested/completed 結果；只有在同一個 processing 世代仍為目前狀態時，診斷狀態才會標記為閒置；當工作階段維持不變時，重複的 `session.stuck` 診斷會退避。

## 哪些情況會提前結束

- 代理逾時（中止）
- AbortSignal（取消）
- 閘道中斷連線或 RPC 逾時
- `agent.wait` 逾時（僅等待，不會停止代理）

## 相關

- [工具](/zh-TW/tools) - 可用的代理工具
- [Hooks](/zh-TW/automation/hooks) - 由代理生命週期事件觸發的事件驅動指令碼
- [壓縮](/zh-TW/concepts/compaction) - 長對話如何被摘要
- [執行核准](/zh-TW/tools/exec-approvals) - shell 命令的核准閘門
- [思考](/zh-TW/tools/thinking) - 思考/推理等級設定
