---
read_when:
    - 你需要代理迴圈或生命週期事件的精確逐步說明
    - 你正在變更工作階段佇列處理、對話紀錄寫入，或工作階段寫入鎖定行為
summary: 代理程式迴圈生命週期、串流與等待語意
title: 代理迴圈
x-i18n:
    generated_at: "2026-04-30T18:38:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

代理式迴圈是代理的完整「真實」執行流程：接收 → 組裝內容脈絡 → 模型推論 →
工具執行 → 串流回覆 → 持久化。這是將訊息轉換為動作與最終回覆的權威路徑，
同時保持工作階段狀態一致。

在 OpenClaw 中，迴圈是每個工作階段一次單一、序列化的執行，會在模型思考、呼叫工具
並串流輸出時發出生命週期與串流事件。本文件說明這個真實迴圈如何從端到端串接。

## 進入點

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 指令。

## 運作方式（高層次）

1. `agent` RPC 會驗證參數、解析工作階段（sessionKey/sessionId）、持久化工作階段中繼資料，並立即回傳 `{ runId, acceptedAt }`。
2. `agentCommand` 會執行代理：
   - 解析模型 + thinking/verbose/trace 預設值
   - 載入 Skills 快照
   - 呼叫 `runEmbeddedPiAgent`（pi-agent-core 執行階段）
   - 如果嵌入式迴圈沒有發出生命週期結束/錯誤，則發出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 透過每個工作階段 + 全域佇列序列化執行
   - 解析模型 + 驗證設定檔，並建立 Pi 工作階段
   - 訂閱 Pi 事件，並串流 assistant/tool 增量
   - 強制執行逾時 -> 若超過時間則中止執行
   - 針對 Codex app-server 回合，在終端事件前，如果已接受的回合停止產生 app-server 進度，則中止該回合
   - 回傳 payload + 使用量中繼資料
4. `subscribeEmbeddedPiSession` 會將 pi-agent-core 事件橋接到 OpenClaw `agent` 串流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命週期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 回傳 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 佇列 + 並行

- 執行會依工作階段鍵（工作階段通道）序列化，並可選擇透過全域通道序列化。
- 這可防止工具/工作階段競態，並保持工作階段歷史一致。
- 訊息通道可以選擇佇列模式（collect/steer/followup），並將其送入此通道系統。
  請參閱[指令佇列](/zh-TW/concepts/queue)。
- Transcript 寫入也受到工作階段檔案上的工作階段寫入鎖保護。該鎖具備
  程序感知能力且以檔案為基礎，因此能捕捉繞過程序內佇列或來自
  其他程序的寫入者。
- 工作階段寫入鎖預設不可重入。如果輔助工具刻意巢狀取得
  同一把鎖，同時保留一個邏輯寫入者，則必須使用
  `allowReentrant: true` 明確選擇加入。

## 工作階段 + 工作區準備

- 會解析並建立工作區；沙盒化執行可能會重新導向到沙盒工作區根目錄。
- 會載入 Skills（或重用快照），並注入 env 與提示詞。
- 會解析 bootstrap/context 檔案，並注入系統提示詞報告。
- 會取得工作階段寫入鎖；`SessionManager` 會在串流前開啟並準備完成。任何
  後續的 transcript 重寫、Compaction 或截斷路徑，都必須在開啟或
  修改 transcript 檔案前取得同一把鎖。

## 提示詞組裝 + 系統提示詞

- 系統提示詞由 OpenClaw 的基礎提示詞、Skills 提示詞、bootstrap 內容脈絡，以及每次執行的覆寫組成。
- 會強制執行模型特定限制與 Compaction 保留 token。
- 請參閱[系統提示詞](/zh-TW/concepts/system-prompt)，了解模型會看到的內容。

## Hook 點（你可以攔截的位置）

OpenClaw 有兩套 Hook 系統：

- **內部 Hook**（Gateway Hook）：針對指令與生命週期事件的事件驅動腳本。
- **Plugin Hook**：代理/工具生命週期與 gateway 管線中的擴充點。

### 內部 Hook（Gateway Hook）

- **`agent:bootstrap`**：在系統提示詞完成前，建置 bootstrap 檔案時執行。
  使用此 Hook 來新增/移除 bootstrap 內容脈絡檔案。
- **指令 Hook**：`/new`、`/reset`、`/stop`，以及其他指令事件（請參閱 Hook 文件）。

請參閱 [Hook](/zh-TW/automation/hooks) 了解設定與範例。

### Plugin Hook（代理 + gateway 生命週期）

這些 Hook 會在代理迴圈或 gateway 管線內執行：

- **`before_model_resolve`**：在工作階段前執行（沒有 `messages`），用於在模型解析前確定性地覆寫供應商/模型。
- **`before_prompt_build`**：在工作階段載入後執行（含 `messages`），用於在提交提示詞前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。將 `prependContext` 用於每回合動態文字，並將 system-context 欄位用於應位於系統提示詞空間中的穩定指引。
- **`before_agent_start`**：舊版相容性 Hook，可能在任一階段執行；建議使用上方明確的 Hook。
- **`before_agent_reply`**：在 inline 動作之後、LLM 呼叫之前執行，讓 Plugin 接管該回合並回傳合成回覆，或完全靜音該回合。
- **`agent_end`**：在完成後檢查最終訊息清單與執行中繼資料。
- **`before_compaction` / `after_compaction`**：觀察或標註 Compaction 週期。
- **`before_tool_call` / `after_tool_call`**：攔截工具參數/結果。
- **`before_install`**：檢查內建掃描發現項目，並可選擇封鎖 skill 或 Plugin 安裝。
- **`tool_result_persist`**：在工具結果寫入 OpenClaw 所有的工作階段 transcript 前，同步轉換工具結果。
- **`message_received` / `message_sending` / `message_sent`**：輸入 + 輸出訊息 Hook。
- **`session_start` / `session_end`**：工作階段生命週期邊界。
- **`gateway_start` / `gateway_stop`**：gateway 生命週期事件。

輸出/工具防護的 Hook 決策規則：

- `before_tool_call`：`{ block: true }` 是終端決策，會停止較低優先權的處理器。
- `before_tool_call`：`{ block: false }` 是無操作，不會清除先前的封鎖。
- `before_install`：`{ block: true }` 是終端決策，會停止較低優先權的處理器。
- `before_install`：`{ block: false }` 是無操作，不會清除先前的封鎖。
- `message_sending`：`{ cancel: true }` 是終端決策，會停止較低優先權的處理器。
- `message_sending`：`{ cancel: false }` 是無操作，不會清除先前的取消。

請參閱 [Plugin Hook](/zh-TW/plugins/hooks)，了解 Hook API 與註冊細節。

Harness 可能會以不同方式調整這些 Hook。Codex app-server harness 會保留
OpenClaw Plugin Hook，作為已記載映射介面的相容性合約，
而 Codex 原生 Hook 仍是獨立的較低層級 Codex 機制。

## 串流 + 部分回覆

- Assistant 增量會從 pi-agent-core 串流，並作為 `assistant` 事件發出。
- 區塊串流可在 `text_end` 或 `message_end` 發出部分回覆。
- 推理串流可作為獨立串流或區塊回覆發出。
- 請參閱[串流](/zh-TW/concepts/streaming)，了解分塊與區塊回覆行為。

## 工具執行 + 訊息工具

- 工具 start/update/end 事件會在 `tool` 串流上發出。
- 工具結果會在記錄/發出前，針對大小與圖片 payload 進行清理。
- 訊息工具傳送會被追蹤，以抑制重複的 assistant 確認。

## 回覆塑形 + 抑制

- 最終 payload 會由以下內容組裝：
  - assistant 文字（以及可選的推理）
  - inline 工具摘要（當 verbose + 允許時）
  - 模型發生錯誤時的 assistant 錯誤文字
- 精確的靜默 token `NO_REPLY` / `no_reply` 會從輸出
  payload 中濾除。
- 訊息工具重複項會從最終 payload 清單中移除。
- 如果沒有剩餘可算繪的 payload，且工具發生錯誤，則會發出備援工具錯誤回覆
  （除非訊息工具已經傳送使用者可見的回覆）。

## Compaction + 重試

- 自動 Compaction 會發出 `compaction` 串流事件，並可觸發重試。
- 重試時，記憶體內緩衝區與工具摘要會重設，以避免重複輸出。
- 請參閱 [Compaction](/zh-TW/concepts/compaction)，了解 Compaction 管線。

## 事件串流（目前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 發出（並由 `agentCommand` 作為備援發出）
- `assistant`：來自 pi-agent-core 的串流增量
- `tool`：來自 pi-agent-core 的串流工具事件

## 聊天通道處理

- Assistant 增量會緩衝成聊天 `delta` 訊息。
- 聊天 `final` 會在 **lifecycle end/error** 時發出。

## 逾時

- `agent.wait` 預設值：30 秒（僅等待）。`timeoutMs` 參數可覆寫。
- 代理執行階段：`agents.defaults.timeoutSeconds` 預設值為 172800 秒（48 小時）；由 `runEmbeddedPiAgent` 中止計時器強制執行。
- Cron 執行階段：隔離的代理回合 `timeoutSeconds` 由 cron 擁有。排程器會在執行開始時計時，在設定的期限中止底層執行，接著在記錄逾時前執行有界清理，避免過期的子工作階段讓通道卡住。
- 卡住工作階段復原：啟用診斷時，`diagnostics.stuckSessionWarnMs` 會偵測長時間處於 `processing` 的工作階段。作用中的嵌入式執行、作用中的回覆操作，以及作用中的工作階段通道任務預設仍僅發出警告；如果診斷顯示該工作階段沒有作用中的工作，watchdog 會釋放受影響的工作階段通道，讓佇列中的啟動工作可以清空。
- 模型閒置逾時：當閒置視窗前沒有回應區塊抵達時，OpenClaw 會中止模型請求。`models.providers.<id>.timeoutSeconds` 會為緩慢的本機/自架供應商延長此閒置 watchdog；否則 OpenClaw 會在已設定時使用 `agents.defaults.timeoutSeconds`，預設上限為 120 秒。沒有明確模型或代理逾時的 Cron 觸發執行會停用閒置 watchdog，並依賴 cron 外層逾時。
- 供應商 HTTP 請求逾時：`models.providers.<id>.timeoutSeconds` 會套用至該供應商的模型 HTTP fetch，包括連線、標頭、本文、SDK 請求逾時、完整 guarded-fetch 中止處理，以及模型串流閒置 watchdog。對於 Ollama 等緩慢的本機/自架供應商，請先使用此設定，再提高整個代理執行階段逾時。

## 可能提早結束的位置

- 代理逾時（中止）
- AbortSignal（取消）
- Gateway 斷線或 RPC 逾時
- `agent.wait` 逾時（僅等待，不會停止代理）

## 相關

- [工具](/zh-TW/tools) — 可用的代理工具
- [Hook](/zh-TW/automation/hooks) — 由代理生命週期事件觸發的事件驅動腳本
- [Compaction](/zh-TW/concepts/compaction) — 長對話如何摘要
- [Exec Approvals](/zh-TW/tools/exec-approvals) — shell 指令的核准閘門
- [Thinking](/zh-TW/tools/thinking) — thinking/reasoning 層級設定
