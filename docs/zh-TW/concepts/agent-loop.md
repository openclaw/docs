---
read_when:
    - 你需要代理程式迴圈或生命週期事件的精確逐步說明
    - 你正在變更工作階段佇列、逐字稿寫入，或工作階段寫入鎖定行為
summary: 代理迴圈生命週期、串流與等待語意
title: 代理迴圈
x-i18n:
    generated_at: "2026-05-05T06:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

代理式迴圈是代理的一次完整「真實」執行：接收 → 上下文組裝 → 模型推論 →
工具執行 → 串流回覆 → 持久化。它是將一則訊息轉換為動作與最終回覆的權威路徑，
同時保持工作階段狀態一致。

在 OpenClaw 中，一個迴圈是每個工作階段單一且序列化的執行，會在模型思考、呼叫工具
並串流輸出時發出生命週期與串流事件。本文件說明這個真實迴圈如何端到端接線。

## 進入點

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 運作方式（高階）

1. `agent` RPC 會驗證參數、解析工作階段（sessionKey/sessionId）、持久化工作階段中繼資料，並立即回傳 `{ runId, acceptedAt }`。
2. `agentCommand` 執行代理：
   - 解析模型 + thinking/verbose/trace 預設值
   - 載入 Skills 快照
   - 呼叫 `runEmbeddedPiAgent`（pi-agent-core runtime）
   - 如果內嵌迴圈沒有發出 **lifecycle end/error**，則發出它
3. `runEmbeddedPiAgent`：
   - 透過每工作階段 + 全域佇列序列化執行
   - 解析模型 + 驗證設定檔，並建立 Pi 工作階段
   - 訂閱 Pi 事件並串流 assistant/tool delta
   - 強制逾時 -> 若超過則中止執行
   - 對於 Codex app-server 回合，中止已接受但在終止事件前停止產生 app-server 進度的回合
   - 回傳 payload + 使用量中繼資料
4. `subscribeEmbeddedPiSession` 將 pi-agent-core 事件橋接到 OpenClaw `agent` 串流：
   - 工具事件 => `stream: "tool"`
   - assistant delta => `stream: "assistant"`
   - 生命週期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 回傳 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 佇列 + 並行

- 執行會依工作階段鍵（工作階段通道）序列化，並可選擇透過全域通道。
- 這會防止工具/工作階段競態，並保持工作階段歷史一致。
- 訊息通道可以選擇佇列模式（collect/steer/followup），並送入這個通道系統。
  請參閱[命令佇列](/zh-TW/concepts/queue)。
- 逐字稿寫入也會受到工作階段檔案上的工作階段寫入鎖保護。此鎖具備程序感知且以檔案為基礎，
  因此能捕捉繞過程序內佇列或來自其他程序的寫入者。工作階段逐字稿寫入者最多會等待
  `session.writeLock.acquireTimeoutMs`，之後才回報工作階段忙碌；預設值為 `60000` ms。
- 工作階段寫入鎖預設不可重入。如果輔助程式刻意在保留同一個邏輯寫入者的同時巢狀取得同一把鎖，
  它必須透過 `allowReentrant: true` 明確選擇加入。

## 工作階段 + 工作區準備

- 工作區會被解析並建立；沙盒化執行可能會重新導向到沙盒工作區根目錄。
- Skills 會被載入（或從快照重用），並注入 env 和提示中。
- Bootstrap/上下文檔案會被解析並注入系統提示報告中。
- 會取得工作階段寫入鎖；`SessionManager` 會在串流前開啟並準備好。任何後續的逐字稿重寫、
  Compaction 或截斷路徑，都必須在開啟或變更逐字稿檔案前取得同一把鎖。

## 提示組裝 + 系統提示

- 系統提示會由 OpenClaw 的基礎提示、Skills 提示、bootstrap 上下文與每次執行覆寫組成。
- 會強制套用模型特定限制與 Compaction 保留 token。
- 請參閱[系統提示](/zh-TW/concepts/system-prompt)，了解模型會看到什麼。

## 鉤子點（可攔截的位置）

OpenClaw 有兩套鉤子系統：

- **內部鉤子**（Gateway 鉤子）：由命令與生命週期事件驅動的指令碼。
- **Plugin 鉤子**：代理/工具生命週期與 gateway 管線中的擴充點。

### 內部鉤子（Gateway 鉤子）

- **`agent:bootstrap`**：在系統提示完成前建立 bootstrap 檔案時執行。
  使用它來新增/移除 bootstrap 上下文檔案。
- **命令鉤子**：`/new`、`/reset`、`/stop` 與其他命令事件（請參閱鉤子文件）。

請參閱[鉤子](/zh-TW/automation/hooks)取得設定與範例。

### Plugin 鉤子（代理 + gateway 生命週期）

這些會在代理迴圈或 gateway 管線內執行：

- **`before_model_resolve`**：在工作階段前執行（沒有 `messages`），用於在模型解析前以決定性方式覆寫 provider/model。
- **`before_prompt_build`**：在工作階段載入後執行（含 `messages`），用於在提交提示前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。將 `prependContext` 用於每回合動態文字，並將系統上下文字段用於應放在系統提示空間中的穩定指引。
- **`before_agent_start`**：舊版相容鉤子，可能在任一階段執行；優先使用上方的明確鉤子。
- **`before_agent_reply`**：在行內動作之後、LLM 呼叫之前執行，讓 Plugin 可接管該回合並回傳合成回覆，或完全靜默該回合。
- **`agent_end`**：完成後檢查最終訊息清單與執行中繼資料。
- **`before_compaction` / `after_compaction`**：觀察或標註 Compaction 週期。
- **`before_tool_call` / `after_tool_call`**：攔截工具參數/結果。
- **`before_install`**：檢查內建掃描發現，並可選擇阻擋 Skill 或 Plugin 安裝。
- **`tool_result_persist`**：在工具結果寫入 OpenClaw 擁有的工作階段逐字稿前同步轉換它們。
- **`message_received` / `message_sending` / `message_sent`**：傳入 + 傳出訊息鉤子。
- **`session_start` / `session_end`**：工作階段生命週期邊界。
- **`gateway_start` / `gateway_stop`**：gateway 生命週期事件。

傳出/工具防護的鉤子決策規則：

- `before_tool_call`：`{ block: true }` 是終止性的，並會停止較低優先順序的處理器。
- `before_tool_call`：`{ block: false }` 是無操作，且不會清除先前的阻擋。
- `before_install`：`{ block: true }` 是終止性的，並會停止較低優先順序的處理器。
- `before_install`：`{ block: false }` 是無操作，且不會清除先前的阻擋。
- `message_sending`：`{ cancel: true }` 是終止性的，並會停止較低優先順序的處理器。
- `message_sending`：`{ cancel: false }` 是無操作，且不會清除先前的取消。

請參閱 [Plugin 鉤子](/zh-TW/plugins/hooks)取得鉤子 API 與註冊細節。

Harness 可能會以不同方式調整這些鉤子。Codex app-server harness 會將
OpenClaw Plugin 鉤子保留為已記錄鏡像介面的相容性契約，而 Codex 原生鉤子仍是另一個較低階的 Codex 機制。

## 串流 + 部分回覆

- Assistant delta 會從 pi-agent-core 串流，並以 `assistant` 事件發出。
- 區塊串流可以在 `text_end` 或 `message_end` 發出部分回覆。
- 推理串流可以作為獨立串流或區塊回覆發出。
- 請參閱[串流](/zh-TW/concepts/streaming)，了解分塊與區塊回覆行為。

## 工具執行 + 訊息工具

- 工具開始/更新/結束事件會在 `tool` 串流上發出。
- 工具結果在記錄/發出前會針對大小與圖片 payload 進行清理。
- 訊息工具傳送會被追蹤，以抑制重複的 assistant 確認。

## 回覆塑形 + 抑制

- 最終 payload 會由以下內容組裝：
  - assistant 文字（以及選用推理）
  - 行內工具摘要（當 verbose + 允許時）
  - 模型錯誤時的 assistant 錯誤文字
- 精確的靜默 token `NO_REPLY` / `no_reply` 會從傳出
  payload 中過濾。
- 訊息工具重複項會從最終 payload 清單中移除。
- 如果沒有剩餘可呈現的 payload 且工具發生錯誤，則會發出備援工具錯誤回覆
  （除非訊息工具已傳送使用者可見的回覆）。

## Compaction + 重試

- 自動 Compaction 會發出 `compaction` 串流事件，並可觸發重試。
- 重試時，記憶體中的緩衝區與工具摘要會重設，以避免重複輸出。
- 請參閱 [Compaction](/zh-TW/concepts/compaction) 了解 Compaction 管線。

## 事件串流（目前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 發出（並由 `agentCommand` 作為備援發出）
- `assistant`：來自 pi-agent-core 的串流 delta
- `tool`：來自 pi-agent-core 的串流工具事件

## 聊天通道處理

- Assistant delta 會被緩衝為聊天 `delta` 訊息。
- 聊天 `final` 會在 **lifecycle end/error** 時發出。

## 逾時

- `agent.wait` 預設值：30 秒（僅等待）。`timeoutMs` 參數會覆寫。
- 代理執行階段：`agents.defaults.timeoutSeconds` 預設 172800 秒（48 小時）；由 `runEmbeddedPiAgent` 中止計時器強制執行。
- Cron 執行階段：隔離代理回合的 `timeoutSeconds` 由 cron 擁有。排程器會在執行開始時計啟該計時器，在設定的期限中止底層執行，接著在記錄逾時前執行有界清理，避免過期的子工作階段使通道卡住。
- 工作階段存活診斷：啟用診斷時，`diagnostics.stuckSessionWarnMs` 會分類沒有觀察到回覆、工具、狀態、區塊或 ACP 進度的長時間 `processing` 工作階段。作用中的內嵌執行、模型呼叫與工具呼叫會回報為 `session.long_running`；作用中但最近沒有進度的工作會回報為 `session.stalled`；`session.stuck` 保留給沒有作用中工作的過期工作階段簿記。過期工作階段簿記會立即釋放受影響的工作階段通道；停滯的內嵌執行只有在 `diagnostics.stuckSessionAbortMs`（預設：至少 10 分鐘且為警告閾值的 5 倍）之後才會中止並排空，讓排隊工作可以恢復，而不會切斷只是較慢的執行。復原會發出結構化的 requested/completed 結果，且只有在相同 processing 世代仍為目前世代時，才會將診斷狀態標記為閒置。重複的 `session.stuck` 診斷會在工作階段維持不變時退避。
- 模型閒置逾時：當回應 chunk 未在閒置視窗內抵達時，OpenClaw 會中止模型請求。`models.providers.<id>.timeoutSeconds` 會為緩慢的本機/自架 provider 延長這個閒置 watchdog；否則 OpenClaw 會在設定時使用 `agents.defaults.timeoutSeconds`，預設上限為 120 秒。未明確設定模型或代理逾時的 Cron 觸發執行會停用閒置 watchdog，並依賴 cron 外層逾時。
- Provider HTTP 請求逾時：`models.providers.<id>.timeoutSeconds` 會套用到該 provider 的模型 HTTP fetch，包括 connect、headers、body、SDK 請求逾時、總 guarded-fetch 中止處理，以及模型串流閒置 watchdog。請先將它用於 Ollama 等緩慢的本機/自架 provider，再提高整個代理執行階段逾時。

## 可能提前結束的位置

- 代理逾時（中止）
- AbortSignal（取消）
- Gateway 中斷連線或 RPC 逾時
- `agent.wait` 逾時（僅等待，不會停止代理）

## 相關

- [工具](/zh-TW/tools) — 可用的代理工具
- [鉤子](/zh-TW/automation/hooks) — 由代理生命週期事件觸發的事件驅動指令碼
- [Compaction](/zh-TW/concepts/compaction) — 長對話如何被摘要
- [Exec Approvals](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [Thinking](/zh-TW/tools/thinking) — 思考/推理層級設定
