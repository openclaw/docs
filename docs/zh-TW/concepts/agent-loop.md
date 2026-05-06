---
read_when:
    - 你需要代理程式迴圈或生命週期事件的精確逐步指南
    - 你正在變更工作階段佇列處理、對話記錄寫入或工作階段寫入鎖定行為
summary: 代理迴圈生命週期、串流與等待語意
title: 代理迴圈
x-i18n:
    generated_at: "2026-05-06T09:05:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

代理式迴圈是代理程式完整的「真實」執行流程：接收 → 上下文組裝 → 模型推論 →
工具執行 → 串流回覆 → 持久化。它是權威路徑，會將訊息轉換為動作與最終回覆，同時維持工作階段狀態一致。

在 OpenClaw 中，迴圈是每個工作階段單一且序列化的執行流程，會在模型思考、呼叫工具並串流輸出時發出生命週期與串流事件。本文件說明這個真實迴圈如何端對端接線。

## 進入點

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 運作方式（高階）

1. `agent` RPC 會驗證參數、解析工作階段（sessionKey/sessionId）、持久化工作階段中繼資料，並立即回傳 `{ runId, acceptedAt }`。
2. `agentCommand` 會執行代理程式：
   - 解析模型 + thinking/verbose/trace 預設值
   - 載入 Skills 快照
   - 呼叫 `runEmbeddedPiAgent`（pi-agent-core 執行階段）
   - 如果嵌入式迴圈未發出生命週期 end/error，則發出 **生命週期 end/error**
3. `runEmbeddedPiAgent`：
   - 透過每工作階段 + 全域佇列序列化執行
   - 解析模型 + 驗證設定檔，並建立 Pi 工作階段
   - 訂閱 Pi 事件，並串流 assistant/tool 增量
   - 強制逾時 -> 若超過則中止執行
   - 對於 Codex app-server 輪次，在終端事件前，如果已接受的輪次停止產生 app-server 進度，則將其中止
   - 回傳承載資料 + 使用量中繼資料
4. `subscribeEmbeddedPiSession` 會將 pi-agent-core 事件橋接到 OpenClaw `agent` 串流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命週期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **生命週期 end/error**
   - 回傳 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 佇列 + 並行

- 執行會依工作階段鍵（工作階段通道）序列化，也可選擇通過全域通道。
- 這可避免工具/工作階段競態，並保持工作階段歷程一致。
- 訊息通道可以選擇佇列模式（collect/steer/followup），並將其送入這套通道系統。
  請參閱[命令佇列](/zh-TW/concepts/queue)。
- 轉錄寫入也受到工作階段檔案上的工作階段寫入鎖保護。此鎖具有程序感知能力且以檔案為基礎，因此能捕捉繞過程序內佇列或來自其他程序的寫入者。工作階段轉錄寫入者最多會等待 `session.writeLock.acquireTimeoutMs`，之後才回報工作階段忙碌；預設值為 `60000` 毫秒。
- 工作階段寫入鎖預設不可重入。如果輔助程式在保留單一邏輯寫入者的同時，有意巢狀取得同一把鎖，必須以 `allowReentrant: true` 明確選擇啟用。

## 工作階段 + 工作區準備

- 會解析並建立工作區；沙盒化執行可能會重新導向到沙盒工作區根目錄。
- Skills 會被載入（或從快照重用），並注入環境與提示中。
- 會解析啟動/上下文檔案，並注入系統提示報告。
- 會取得工作階段寫入鎖；`SessionManager` 會在串流前開啟並準備完成。任何後續的轉錄重寫、Compaction 或截斷路徑，都必須先取得同一把鎖，才能開啟或變更轉錄檔案。

## 提示組裝 + 系統提示

- 系統提示由 OpenClaw 的基礎提示、Skills 提示、啟動上下文與每次執行覆寫組成。
- 會強制套用模型特定限制與 Compaction 保留權杖。
- 請參閱[系統提示](/zh-TW/concepts/system-prompt)，了解模型會看到什麼。

## 掛鉤點（你可以攔截的位置）

OpenClaw 有兩套掛鉤系統：

- **內部掛鉤**（Gateway 掛鉤）：用於命令與生命週期事件的事件驅動指令碼。
- **Plugin 掛鉤**：代理程式/工具生命週期與 Gateway 管線內的擴充點。

### 內部掛鉤（Gateway 掛鉤）

- **`agent:bootstrap`**：在系統提示最終確定前建置啟動檔案時執行。
  使用它新增/移除啟動上下文檔案。
- **命令掛鉤**：`/new`、`/reset`、`/stop` 與其他命令事件（請參閱掛鉤文件）。

請參閱[掛鉤](/zh-TW/automation/hooks)以取得設定與範例。

### Plugin 掛鉤（代理程式 + Gateway 生命週期）

這些會在代理程式迴圈或 Gateway 管線內執行：

- **`before_model_resolve`**：在工作階段前執行（沒有 `messages`），用於在模型解析前以確定性方式覆寫提供者/模型。
- **`before_prompt_build`**：在工作階段載入後執行（含 `messages`），用於在提交提示前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。將 `prependContext` 用於每輪動態文字，並將系統上下文字段用於應位於系統提示空間中的穩定指引。
- **`before_agent_start`**：舊版相容性掛鉤，可能在任一階段執行；建議使用上方的明確掛鉤。
- **`before_agent_reply`**：在內嵌動作後、LLM 呼叫前執行，讓 Plugin 宣告接手該輪並回傳合成回覆，或完全靜默該輪。
- **`agent_end`**：完成後檢查最終訊息清單與執行中繼資料。
- **`before_compaction` / `after_compaction`**：觀察或註解 Compaction 週期。
- **`before_tool_call` / `after_tool_call`**：攔截工具參數/結果。
- **`before_install`**：檢查內建掃描發現，並可選擇阻擋 Skills 或 Plugin 安裝。
- **`tool_result_persist`**：在工具結果寫入 OpenClaw 擁有的工作階段轉錄前，同步轉換工具結果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站訊息掛鉤。
- **`session_start` / `session_end`**：工作階段生命週期邊界。
- **`gateway_start` / `gateway_stop`**：Gateway 生命週期事件。

出站/工具防護的掛鉤決策規則：

- `before_tool_call`：`{ block: true }` 是終端決策，並會停止較低優先順序的處理常式。
- `before_tool_call`：`{ block: false }` 是無操作，且不會清除先前的阻擋。
- `before_install`：`{ block: true }` 是終端決策，並會停止較低優先順序的處理常式。
- `before_install`：`{ block: false }` 是無操作，且不會清除先前的阻擋。
- `message_sending`：`{ cancel: true }` 是終端決策，並會停止較低優先順序的處理常式。
- `message_sending`：`{ cancel: false }` 是無操作，且不會清除先前的取消。

請參閱 [Plugin 掛鉤](/zh-TW/plugins/hooks)，了解掛鉤 API 與註冊細節。

測試框架可能會以不同方式調整這些掛鉤。Codex app-server 測試框架會保留 OpenClaw Plugin 掛鉤，作為已文件化鏡像介面的相容性契約，而 Codex 原生掛鉤仍是另一套較低階的 Codex 機制。

## 串流 + 部分回覆

- Assistant 增量會從 pi-agent-core 串流，並以 `assistant` 事件發出。
- 區塊串流可以在 `text_end` 或 `message_end` 發出部分回覆。
- 推理串流可以作為獨立串流發出，或作為區塊回覆發出。
- 請參閱[串流](/zh-TW/concepts/streaming)以了解分塊與區塊回覆行為。

## 工具執行 + 訊息工具

- 工具 start/update/end 事件會在 `tool` 串流上發出。
- 工具結果在記錄/發出前，會先針對大小與圖片承載資料進行清理。
- 會追蹤訊息工具傳送，以抑制重複的 assistant 確認。

## 回覆塑形 + 抑制

- 最終承載資料由以下內容組裝：
  - assistant 文字（以及選用推理）
  - 內嵌工具摘要（當 verbose + 允許時）
  - 模型出錯時的 assistant 錯誤文字
- 精確的靜默權杖 `NO_REPLY` / `no_reply` 會從出站承載資料中過濾。
- 訊息工具重複項會從最終承載資料清單中移除。
- 如果沒有剩餘可轉譯的承載資料，且工具發生錯誤，會發出備援工具錯誤回覆
  （除非訊息工具已送出使用者可見的回覆）。

## Compaction + 重試

- 自動 Compaction 會發出 `compaction` 串流事件，並可觸發重試。
- 重試時，會重設記憶體內緩衝區與工具摘要，以避免重複輸出。
- 請參閱 [Compaction](/zh-TW/concepts/compaction) 了解 Compaction 管線。

## 事件串流（目前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 發出（也可由 `agentCommand` 作為備援發出）
- `assistant`：來自 pi-agent-core 的串流增量
- `tool`：來自 pi-agent-core 的串流工具事件

## 聊天通道處理

- Assistant 增量會緩衝為聊天 `delta` 訊息。
- 聊天 `final` 會在 **生命週期 end/error** 時發出。

## 逾時

- `agent.wait` 預設值：30 秒（僅等待）。`timeoutMs` 參數可覆寫。
- 代理程式執行階段：`agents.defaults.timeoutSeconds` 預設 172800 秒（48 小時）；由 `runEmbeddedPiAgent` 中止計時器強制執行。
- Cron 執行階段：隔離代理程式輪次的 `timeoutSeconds` 由 cron 擁有。排程器會在執行開始時啟動該計時器，在設定的截止時間中止底層執行，然後在記錄逾時前執行有界清理，避免過期的子工作階段讓通道卡住。
- 工作階段存活診斷：啟用診斷時，`diagnostics.stuckSessionWarnMs` 會分類長時間處於 `processing`、且沒有觀察到回覆、工具、狀態、區塊或 ACP 進度的工作階段。作用中的嵌入式執行、模型呼叫與工具呼叫會回報為 `session.long_running`；作用中工作但近期無進度會回報為 `session.stalled`；`session.stuck` 保留給沒有作用中工作的過期工作階段簿記。過期工作階段簿記會立即釋放受影響的工作階段通道；停滯的嵌入式執行只會在 `diagnostics.stuckSessionAbortMs` 後中止並排空（預設：至少 10 分鐘且為警告閾值的 5 倍），使排隊工作能恢復，而不會切斷只是較慢的執行。復原會發出結構化的 requested/completed 結果，而且只有在同一個 processing 世代仍為目前狀態時，診斷狀態才會標記為閒置。重複的 `session.stuck` 診斷會在工作階段保持不變時退避。
- 模型閒置逾時：當回應區塊未在閒置視窗前抵達時，OpenClaw 會中止模型請求。`models.providers.<id>.timeoutSeconds` 會延長慢速本機/自架提供者的這個閒置監看器；否則 OpenClaw 會在已設定時使用 `agents.defaults.timeoutSeconds`，預設上限為 120 秒。沒有明確模型或代理程式逾時的 Cron 觸發執行會停用閒置監看器，並依賴 cron 外層逾時。
- 提供者 HTTP 請求逾時：`models.providers.<id>.timeoutSeconds` 適用於該提供者的模型 HTTP 擷取，包括連線、標頭、本文、SDK 請求逾時、整體受防護擷取中止處理，以及模型串流閒置監看器。對 Ollama 等慢速本機/自架提供者，請在提高整個代理程式執行階段逾時前使用此設定。

## 可能提早結束的位置

- 代理程式逾時（中止）
- AbortSignal（取消）
- Gateway 中斷連線或 RPC 逾時
- `agent.wait` 逾時（僅等待，不會停止代理程式）

## 相關

- [工具](/zh-TW/tools) — 可用的代理程式工具
- [掛鉤](/zh-TW/automation/hooks) — 由代理程式生命週期事件觸發的事件驅動指令碼
- [Compaction](/zh-TW/concepts/compaction) — 長對話如何摘要
- [執行核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [Thinking](/zh-TW/tools/thinking) — 思考/推理等級設定
