---
read_when:
    - 您需要 agent 迴圈或生命週期事件的精確逐步解說
    - 你正在變更工作階段佇列、逐字稿寫入或工作階段寫入鎖定行為
summary: 代理程式迴圈生命週期、串流與等待語意
title: 代理程式迴圈
x-i18n:
    generated_at: "2026-04-30T02:57:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

代理式迴圈是代理的完整「真實」執行流程：接收 → 組裝脈絡 → 模型推論 →
工具執行 → 串流回覆 → 持久化。它是將訊息轉換成動作與最終回覆的權威路徑，
同時保持工作階段狀態一致。

在 OpenClaw 中，迴圈是每個工作階段一次單一、序列化的執行，會在模型思考、
呼叫工具並串流輸出時發出生命週期與串流事件。本文件說明這個真實迴圈如何
端到端串接。

## 進入點

- Gateway RPC：`agent` 與 `agent.wait`。
- CLI：`agent` 指令。

## 運作方式（高階）

1. `agent` RPC 會驗證參數、解析工作階段（sessionKey/sessionId）、持久化工作階段中繼資料，並立即回傳 `{ runId, acceptedAt }`。
2. `agentCommand` 執行代理：
   - 解析模型 + thinking/verbose/trace 預設值
   - 載入 Skills 快照
   - 呼叫 `runEmbeddedPiAgent`（pi-agent-core 執行階段）
   - 如果內嵌迴圈未發出生命週期結束/錯誤，則發出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 透過每工作階段 + 全域佇列序列化執行
   - 解析模型 + 驗證設定檔並建立 pi 工作階段
   - 訂閱 pi 事件並串流 assistant/tool 增量
   - 強制執行逾時 -> 若超過則中止執行
   - 回傳 payload + 用量中繼資料
4. `subscribeEmbeddedPiSession` 將 pi-agent-core 事件橋接到 OpenClaw `agent` 串流：
   - 工具事件 => `stream: "tool"`
   - 助理增量 => `stream: "assistant"`
   - 生命週期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 回傳 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 佇列 + 並行

- 執行會依工作階段金鑰（工作階段通道）序列化，並可選擇經由全域通道。
- 這可防止工具/工作階段競態，並保持工作階段歷史一致。
- 訊息通道可以選擇佇列模式（collect/steer/followup），以輸入這套通道系統。
  請參閱[指令佇列](/zh-TW/concepts/queue)。
- 轉錄寫入也會受到工作階段檔案上的工作階段寫入鎖保護。該鎖具有程序感知能力且以檔案為基礎，
  因此能捕捉到繞過程序內佇列或來自其他程序的寫入者。
- 工作階段寫入鎖預設不可重入。如果某個輔助程式刻意在保留單一邏輯寫入者的同時，
  巢狀取得相同鎖，則必須以 `allowReentrant: true` 明確選擇加入。

## 工作階段 + 工作區準備

- 工作區會被解析並建立；沙盒化執行可能會重新導向到沙盒工作區根目錄。
- Skills 會被載入（或從快照重用），並注入到環境與提示中。
- Bootstrap/脈絡檔案會被解析，並注入到系統提示報告中。
- 會取得工作階段寫入鎖；`SessionManager` 會在串流前開啟並準備好。任何
  後續轉錄重寫、Compaction 或截斷路徑，都必須在開啟或變更轉錄檔前取得相同鎖。

## 提示組裝 + 系統提示

- 系統提示會由 OpenClaw 的基礎提示、Skills 提示、bootstrap 脈絡與每次執行覆寫建立。
- 會強制套用模型特定限制與 Compaction 保留 token。
- 請參閱[系統提示](/zh-TW/concepts/system-prompt)，了解模型會看到什麼。

## 掛鉤點（可攔截的位置）

OpenClaw 有兩套掛鉤系統：

- **內部掛鉤**（Gateway 掛鉤）：用於指令與生命週期事件的事件驅動腳本。
- **Plugin 掛鉤**：代理/工具生命週期與 Gateway 管線內的擴充點。

### 內部掛鉤（Gateway 掛鉤）

- **`agent:bootstrap`**：在系統提示完成前，建立 bootstrap 檔案時執行。
  使用這個掛鉤新增/移除 bootstrap 脈絡檔案。
- **指令掛鉤**：`/new`、`/reset`、`/stop`，以及其他指令事件（請參閱 Hooks 文件）。

請參閱[掛鉤](/zh-TW/automation/hooks)取得設定與範例。

### Plugin 掛鉤（代理 + Gateway 生命週期）

這些掛鉤會在代理迴圈或 Gateway 管線內執行：

- **`before_model_resolve`**：在工作階段前執行（沒有 `messages`），以便在模型解析前以決定性方式覆寫供應商/模型。
- **`before_prompt_build`**：在工作階段載入後執行（含 `messages`），以便在提交提示前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。將 `prependContext` 用於每回合動態文字，將系統脈絡欄位用於應位於系統提示空間中的穩定指引。
- **`before_agent_start`**：舊版相容掛鉤，可能在任一階段執行；建議使用上方明確的掛鉤。
- **`before_agent_reply`**：在行內動作之後、LLM 呼叫之前執行，讓 Plugin 可接管該回合並回傳合成回覆，或完全靜默該回合。
- **`agent_end`**：在完成後檢查最終訊息清單與執行中繼資料。
- **`before_compaction` / `after_compaction`**：觀察或註記 Compaction 週期。
- **`before_tool_call` / `after_tool_call`**：攔截工具參數/結果。
- **`before_install`**：檢查內建掃描發現項目，並可選擇封鎖 Skill 或 Plugin 安裝。
- **`tool_result_persist`**：在工具結果寫入 OpenClaw 擁有的工作階段轉錄前，同步轉換工具結果。
- **`message_received` / `message_sending` / `message_sent`**：傳入 + 傳出訊息掛鉤。
- **`session_start` / `session_end`**：工作階段生命週期邊界。
- **`gateway_start` / `gateway_stop`**：Gateway 生命週期事件。

傳出/工具防護的掛鉤決策規則：

- `before_tool_call`：`{ block: true }` 是終止性決策，會停止較低優先順序的處理常式。
- `before_tool_call`：`{ block: false }` 是無操作，且不會清除先前的封鎖。
- `before_install`：`{ block: true }` 是終止性決策，會停止較低優先順序的處理常式。
- `before_install`：`{ block: false }` 是無操作，且不會清除先前的封鎖。
- `message_sending`：`{ cancel: true }` 是終止性決策，會停止較低優先順序的處理常式。
- `message_sending`：`{ cancel: false }` 是無操作，且不會清除先前的取消。

請參閱 [Plugin 掛鉤](/zh-TW/plugins/hooks)取得掛鉤 API 與註冊詳細資訊。

測試框架可能會以不同方式調整這些掛鉤。Codex app-server 測試框架會將
OpenClaw Plugin 掛鉤作為文件化鏡像介面的相容性合約，而 Codex 原生掛鉤仍是
另一套較低階的 Codex 機制。

## 串流 + 部分回覆

- 助理增量會從 pi-agent-core 串流，並作為 `assistant` 事件發出。
- 區塊串流可在 `text_end` 或 `message_end` 發出部分回覆。
- 推理串流可作為獨立串流或區塊回覆發出。
- 請參閱[串流](/zh-TW/concepts/streaming)，了解分塊與區塊回覆行為。

## 工具執行 + 訊息工具

- 工具 start/update/end 事件會在 `tool` 串流上發出。
- 工具結果會在記錄/發出前，依大小與圖片 payload 進行清理。
- 會追蹤訊息工具傳送，以抑制重複的助理確認。

## 回覆塑形 + 抑制

- 最終 payload 由以下內容組裝：
  - 助理文字（以及可選的推理）
  - 行內工具摘要（當 verbose + 允許時）
  - 模型出錯時的助理錯誤文字
- 精確靜默 token `NO_REPLY` / `no_reply` 會從傳出
  payload 中過濾。
- 訊息工具重複項會從最終 payload 清單中移除。
- 如果沒有剩餘可渲染的 payload 且工具出錯，則會發出備援工具錯誤回覆
  （除非訊息工具已經傳送使用者可見的回覆）。

## Compaction + 重試

- 自動 Compaction 會發出 `compaction` 串流事件，且可觸發重試。
- 重試時，記憶體內緩衝區與工具摘要會重設，以避免重複輸出。
- 請參閱 [Compaction](/zh-TW/concepts/compaction) 了解 Compaction 管線。

## 事件串流（目前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 發出（並由 `agentCommand` 作為備援發出）
- `assistant`：來自 pi-agent-core 的串流增量
- `tool`：來自 pi-agent-core 的串流工具事件

## 聊天通道處理

- 助理增量會緩衝成聊天 `delta` 訊息。
- 聊天 `final` 會在 **lifecycle end/error** 時發出。

## 逾時

- `agent.wait` 預設：30 秒（僅等待）。`timeoutMs` 參數可覆寫。
- 代理執行階段：`agents.defaults.timeoutSeconds` 預設為 172800 秒（48 小時）；由 `runEmbeddedPiAgent` 中止計時器強制執行。
- Cron 執行階段：隔離的代理回合 `timeoutSeconds` 由 cron 擁有。排程器在執行開始時啟動該計時器，在設定的期限中止底層執行，接著執行有界清理，再記錄逾時，避免過時的子工作階段讓通道卡住。
- 卡住工作階段復原：啟用診斷後，`diagnostics.stuckSessionWarnMs` 會偵測長時間 `processing` 的工作階段。作用中的內嵌執行、作用中的回覆操作，以及作用中的工作階段通道任務，預設只會警告；如果診斷顯示該工作階段沒有作用中的工作，監視器會釋放受影響的工作階段通道，讓已排入佇列的啟動工作可以清空。
- 模型閒置逾時：當閒置視窗內沒有回應區塊抵達時，OpenClaw 會中止模型請求。`models.providers.<id>.timeoutSeconds` 會為較慢的本機/自架供應商延長這個閒置監視器；否則 OpenClaw 會在已設定時使用 `agents.defaults.timeoutSeconds`，預設上限為 120 秒。沒有明確模型或代理逾時的 Cron 觸發執行會停用閒置監視器，並依賴 cron 外層逾時。
- 供應商 HTTP 請求逾時：`models.providers.<id>.timeoutSeconds` 會套用到該供應商的模型 HTTP 擷取，包括連線、標頭、本文、SDK 請求逾時、總體受防護 fetch 中止處理，以及模型串流閒置監視器。對於 Ollama 這類較慢的本機/自架供應商，請先使用此設定，再提高整個代理執行階段逾時。

## 可能提早結束的位置

- 代理逾時（中止）
- AbortSignal（取消）
- Gateway 中斷連線或 RPC 逾時
- `agent.wait` 逾時（僅等待，不會停止代理）

## 相關

- [工具](/zh-TW/tools) — 可用的代理工具
- [掛鉤](/zh-TW/automation/hooks) — 由代理生命週期事件觸發的事件驅動腳本
- [Compaction](/zh-TW/concepts/compaction) — 長對話如何被摘要
- [Exec 核准](/zh-TW/tools/exec-approvals) — shell 指令的核准閘門
- [Thinking](/zh-TW/tools/thinking) — thinking/reasoning 層級設定
