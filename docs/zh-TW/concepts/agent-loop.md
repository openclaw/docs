---
read_when:
    - 您需要代理迴圈或生命週期事件的精確逐步解說
    - 你正在變更工作階段佇列處理、逐字稿寫入或工作階段寫入鎖定行為
summary: 代理迴圈生命週期、串流與等待語意
title: 代理迴圈
x-i18n:
    generated_at: "2026-05-02T20:45:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

代理迴圈是代理完整的「真實」執行：接收 → 語境組裝 → 模型推論 →
工具執行 → 串流回覆 → 持久化。這是權威路徑，會將一則訊息
轉換成動作與最終回覆，同時維持工作階段狀態一致。

在 OpenClaw 中，迴圈是每個工作階段一次單一且序列化的執行，會在模型思考、
呼叫工具並串流輸出時發出生命週期與串流事件。本文件說明這個真實迴圈如何
端到端串接。

## 進入點

- Gateway RPC：`agent` 與 `agent.wait`。
- CLI：`agent` 命令。

## 運作方式（高階）

1. `agent` RPC 會驗證參數、解析工作階段（sessionKey/sessionId）、持久化工作階段中繼資料，並立即回傳 `{ runId, acceptedAt }`。
2. `agentCommand` 執行代理：
   - 解析模型 + thinking/verbose/trace 預設值
   - 載入 Skills 快照
   - 呼叫 `runEmbeddedPiAgent`（pi-agent-core 執行階段）
   - 若嵌入式迴圈未發出 **生命週期 end/error**，則補發
3. `runEmbeddedPiAgent`：
   - 透過每工作階段 + 全域佇列將執行序列化
   - 解析模型 + 驗證設定檔，並建立 pi 工作階段
   - 訂閱 pi 事件並串流 assistant/tool deltas
   - 強制執行逾時 -> 若超過則中止執行
   - 對於 Codex app-server 回合，若已接受的回合在終端事件前停止產生 app-server 進度，則中止該回合
   - 回傳 payload 與使用量中繼資料
4. `subscribeEmbeddedPiSession` 會將 pi-agent-core 事件橋接到 OpenClaw `agent` 串流：
   - 工具事件 => `stream: "tool"`
   - 助理 delta => `stream: "assistant"`
   - 生命週期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **生命週期 end/error**
   - 回傳 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 佇列 + 並行

- 執行會依每個工作階段鍵（工作階段通道）序列化，並可選擇再經過全域通道。
- 這可避免工具/工作階段競態，並保持工作階段歷史一致。
- 訊息通道可選擇佇列模式（collect/steer/followup），以送入此通道系統。
  請參閱 [命令佇列](/zh-TW/concepts/queue)。
- 轉錄寫入也會受到工作階段檔案上的工作階段寫入鎖保護。該鎖具備
  程序感知能力且以檔案為基礎，因此可捕捉繞過程序內佇列或來自
  另一個程序的寫入者。工作階段轉錄寫入者最多會等待 `session.writeLock.acquireTimeoutMs`
  後才將工作階段回報為忙碌；預設值為 `60000` ms。
- 工作階段寫入鎖預設不可重入。若 helper 有意在保留同一個邏輯寫入者的情況下
  巢狀取得同一把鎖，必須以
  `allowReentrant: true` 明確選擇加入。

## 工作階段 + 工作區準備

- 會解析並建立工作區；沙盒化執行可能會重新導向到沙盒工作區根目錄。
- Skills 會載入（或從快照重用），並注入 env 與提示。
- Bootstrap/語境檔案會被解析並注入系統提示報告。
- 會取得工作階段寫入鎖；`SessionManager` 會在串流前開啟並準備。任何
  後續的轉錄重寫、Compaction 或截斷路徑，都必須先取得同一把鎖，才能開啟或
  修改轉錄檔案。

## 提示組裝 + 系統提示

- 系統提示由 OpenClaw 的基礎提示、Skills 提示、bootstrap 語境與每次執行覆寫組成。
- 會強制套用模型特定限制與 Compaction 保留 token。
- 請參閱[系統提示](/zh-TW/concepts/system-prompt)，了解模型會看到的內容。

## Hook 點（可攔截的位置）

OpenClaw 有兩套 hook 系統：

- **內部 hooks**（Gateway hooks）：用於命令與生命週期事件的事件驅動腳本。
- **Plugin hooks**：代理/工具生命週期與 Gateway 管線內的擴充點。

### 內部 hooks（Gateway hooks）

- **`agent:bootstrap`**：在系統提示定稿前建置 bootstrap 檔案時執行。
  使用此 hook 新增/移除 bootstrap 語境檔案。
- **命令 hooks**：`/new`、`/reset`、`/stop`，以及其他命令事件（請參閱 Hooks 文件）。

請參閱 [Hooks](/zh-TW/automation/hooks) 以取得設定與範例。

### Plugin hooks（代理 + Gateway 生命週期）

這些會在代理迴圈或 Gateway 管線內執行：

- **`before_model_resolve`**：在工作階段前執行（沒有 `messages`），用於在模型解析前以確定性方式覆寫 provider/model。
- **`before_prompt_build`**：在工作階段載入後執行（含 `messages`），用於在提交提示前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。將 `prependContext` 用於每回合動態文字，並將 system-context 欄位用於應位於系統提示空間中的穩定指引。
- **`before_agent_start`**：舊版相容性 hook，可能在任一階段執行；優先使用上方明確 hooks。
- **`before_agent_reply`**：在 inline actions 之後、LLM 呼叫之前執行，讓 Plugin 接管該回合並回傳合成回覆，或完全靜默該回合。
- **`agent_end`**：在完成後檢查最終訊息清單與執行中繼資料。
- **`before_compaction` / `after_compaction`**：觀察或註記 Compaction 週期。
- **`before_tool_call` / `after_tool_call`**：攔截工具參數/結果。
- **`before_install`**：檢查內建掃描結果，並可選擇封鎖 skill 或 Plugin 安裝。
- **`tool_result_persist`**：在工具結果寫入 OpenClaw 擁有的工作階段轉錄前，同步轉換工具結果。
- **`message_received` / `message_sending` / `message_sent`**：傳入 + 傳出訊息 hooks。
- **`session_start` / `session_end`**：工作階段生命週期邊界。
- **`gateway_start` / `gateway_stop`**：Gateway 生命週期事件。

傳出/工具防護的 hook 決策規則：

- `before_tool_call`：`{ block: true }` 是終止性決策，會停止較低優先序的處理器。
- `before_tool_call`：`{ block: false }` 是無操作，不會清除先前的封鎖。
- `before_install`：`{ block: true }` 是終止性決策，會停止較低優先序的處理器。
- `before_install`：`{ block: false }` 是無操作，不會清除先前的封鎖。
- `message_sending`：`{ cancel: true }` 是終止性決策，會停止較低優先序的處理器。
- `message_sending`：`{ cancel: false }` 是無操作，不會清除先前的取消。

請參閱 [Plugin hooks](/zh-TW/plugins/hooks) 以取得 hook API 與註冊細節。

Harnesses 可能會以不同方式調整這些 hooks。Codex app-server harness 會保留
OpenClaw Plugin hooks 作為已文件化鏡像介面的相容性合約，
而 Codex native hooks 仍是另一個較低階的 Codex 機制。

## 串流 + 部分回覆

- 助理 delta 會從 pi-agent-core 串流，並作為 `assistant` 事件發出。
- 區塊串流可在 `text_end` 或 `message_end` 發出部分回覆。
- 推理串流可作為獨立串流或區塊回覆發出。
- 請參閱[串流](/zh-TW/concepts/streaming)，了解分塊與區塊回覆行為。

## 工具執行 + 訊息工具

- 工具 start/update/end 事件會在 `tool` 串流上發出。
- 工具結果在記錄/發出前，會針對大小與圖片 payload 進行清理。
- 會追蹤訊息工具傳送，以抑制重複的助理確認。

## 回覆塑形 + 抑制

- 最終 payload 由以下內容組成：
  - 助理文字（以及選用推理）
  - inline 工具摘要（在 verbose + allowed 時）
  - 模型錯誤時的助理錯誤文字
- 精確的靜默 token `NO_REPLY` / `no_reply` 會從傳出
  payload 中過濾。
- 訊息工具重複項會從最終 payload 清單中移除。
- 若沒有剩餘可呈現的 payload 且工具發生錯誤，會發出備援工具錯誤回覆
  （除非訊息工具已傳送使用者可見的回覆）。

## Compaction + 重試

- 自動 Compaction 會發出 `compaction` 串流事件，並可觸發重試。
- 重試時，記憶體內緩衝區與工具摘要會重設，以避免重複輸出。
- 請參閱 [Compaction](/zh-TW/concepts/compaction) 以了解 Compaction 管線。

## 事件串流（目前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 發出（並由 `agentCommand` 作為備援發出）
- `assistant`：來自 pi-agent-core 的串流 delta
- `tool`：來自 pi-agent-core 的串流工具事件

## 聊天通道處理

- 助理 delta 會被緩衝成聊天 `delta` 訊息。
- 聊天 `final` 會在 **生命週期 end/error** 時發出。

## 逾時

- `agent.wait` 預設值：30s（僅等待）。`timeoutMs` 參數可覆寫。
- 代理執行階段：`agents.defaults.timeoutSeconds` 預設 172800s（48 小時）；由 `runEmbeddedPiAgent` 中止計時器強制執行。
- Cron 執行階段：隔離代理回合的 `timeoutSeconds` 由 cron 擁有。排程器會在執行開始時計時，到達設定期限時中止底層執行，然後在記錄逾時前執行有界清理，避免陳舊的子工作階段讓通道卡住。
- 工作階段存活診斷：啟用診斷時，`diagnostics.stuckSessionWarnMs` 會分類長時間處於 `processing`、且未觀察到任何回覆、工具、狀態、區塊或 ACP 進度的工作階段。作用中的嵌入式執行、模型呼叫與工具呼叫會回報為 `session.long_running`；有作用中工作但近期無進度會回報為 `session.stalled`；`session.stuck` 保留給沒有作用中工作的陳舊工作階段簿記，且只有該路徑會釋放受影響的工作階段通道，讓已排隊的啟動工作可以排出。重複的 `session.stuck` 診斷會在工作階段維持不變時退避。
- 模型閒置逾時：若在閒置視窗前沒有回應區塊抵達，OpenClaw 會中止模型請求。`models.providers.<id>.timeoutSeconds` 會為較慢的本機/自架 provider 延長此閒置 watchdog；否則 OpenClaw 會在設定時使用 `agents.defaults.timeoutSeconds`，預設上限為 120s。沒有明確模型或代理逾時的 Cron 觸發執行會停用閒置 watchdog，並依賴 cron 外層逾時。
- Provider HTTP 請求逾時：`models.providers.<id>.timeoutSeconds` 會套用至該 provider 的模型 HTTP fetch，包括 connect、headers、body、SDK 請求逾時、整體 guarded-fetch 中止處理，以及模型串流閒置 watchdog。對於 Ollama 等較慢的本機/自架 provider，請先使用此設定，再提高整體代理執行階段逾時。

## 可能提前結束的位置

- 代理逾時（中止）
- AbortSignal（取消）
- Gateway 中斷連線或 RPC 逾時
- `agent.wait` 逾時（僅等待，不會停止代理）

## 相關

- [工具](/zh-TW/tools) — 可用的代理工具
- [Hooks](/zh-TW/automation/hooks) — 由代理生命週期事件觸發的事件驅動腳本
- [Compaction](/zh-TW/concepts/compaction) — 長對話如何被摘要
- [執行核准](/zh-TW/tools/exec-approvals) — shell 命令的核准閘門
- [思考](/zh-TW/tools/thinking) — 思考/推理層級設定
