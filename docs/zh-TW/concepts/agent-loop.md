---
read_when:
    - 你需要代理迴圈或生命週期事件的精確逐步說明
    - 你正在變更工作階段佇列處理、逐字稿寫入或工作階段寫入鎖定行為
summary: 代理迴圈生命週期、串流和等待語義
title: 代理迴圈
x-i18n:
    generated_at: "2026-05-02T02:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Agentic loop 是 agent 完整的「真實」執行流程：接收 → 組裝上下文 → 模型推論 →
工具執行 → 串流回覆 → 持久化。它是將訊息轉換為動作與最終回覆的權威路徑，同時保持工作階段狀態一致。

在 OpenClaw 中，loop 是每個工作階段單一、序列化的執行，會在模型思考、呼叫工具與串流輸出時發出生命週期與串流事件。本文說明這個真實 loop 如何端對端串接。

## 進入點

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 指令。

## 運作方式（高階）

1. `agent` RPC 會驗證參數、解析工作階段（sessionKey/sessionId）、持久化工作階段中繼資料，並立即回傳 `{ runId, acceptedAt }`。
2. `agentCommand` 執行 agent：
   - 解析模型 + thinking/verbose/trace 預設值
   - 載入 skills snapshot
   - 呼叫 `runEmbeddedPiAgent`（pi-agent-core runtime）
   - 如果嵌入式 loop 沒有發出結束事件，則發出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 透過每工作階段 + 全域佇列序列化執行
   - 解析模型 + auth profile，並建立 pi 工作階段
   - 訂閱 pi 事件，並串流 assistant/tool deltas
   - 強制逾時 -> 若超過時間則中止執行
   - 對於 Codex app-server 回合，若已接受的回合在終端事件前停止產生 app-server 進度，則中止該回合
   - 回傳 payloads + usage metadata
4. `subscribeEmbeddedPiSession` 將 pi-agent-core 事件橋接到 OpenClaw `agent` 串流：
   - 工具事件 => `stream: "tool"`
   - assistant deltas => `stream: "assistant"`
   - 生命週期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 回傳 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 佇列 + 並行

- 執行會依工作階段金鑰（工作階段 lane）序列化，並可選擇經過全域 lane。
- 這可防止工具/工作階段競爭，並保持工作階段歷史一致。
- 訊息通道可以選擇佇列模式（collect/steer/followup），送入此 lane 系統。
  請參閱 [指令佇列](/zh-TW/concepts/queue)。
- Transcript 寫入也受工作階段檔案上的工作階段寫入鎖保護。該鎖具備程序感知且以檔案為基礎，因此可捕捉繞過程序內佇列或來自另一個程序的寫入者。
- 工作階段寫入鎖預設不可重入。如果 helper 有意在保留單一邏輯寫入者的情況下巢狀取得同一個鎖，必須透過 `allowReentrant: true` 明確選用。

## 工作階段 + 工作區準備

- 解析並建立工作區；沙盒化執行可能會重新導向到沙盒工作區根目錄。
- 載入 Skills（或從 snapshot 重用），並注入 env 與 prompt。
- 解析 bootstrap/context 檔案，並注入 system prompt report。
- 取得工作階段寫入鎖；在串流前開啟並準備 `SessionManager`。任何後續 transcript rewrite、Compaction 或截斷路徑，在開啟或變更 transcript 檔案前都必須取得同一個鎖。

## Prompt 組裝 + system prompt

- System prompt 由 OpenClaw 的基礎 prompt、skills prompt、bootstrap context 與每次執行的覆寫組成。
- 會強制執行模型特定限制與 Compaction 保留 token。
- 請參閱 [System prompt](/zh-TW/concepts/system-prompt) 了解模型會看到的內容。

## 鉤子點（你可以攔截的位置）

OpenClaw 有兩套鉤子系統：

- **內部鉤子**（Gateway 鉤子）：針對指令與生命週期事件的事件驅動腳本。
- **Plugin 鉤子**：agent/tool 生命週期與 gateway pipeline 內的擴充點。

### 內部鉤子（Gateway 鉤子）

- **`agent:bootstrap`**：在 system prompt 完成前，建置 bootstrap 檔案時執行。
  使用這個鉤子新增/移除 bootstrap context 檔案。
- **指令鉤子**：`/new`、`/reset`、`/stop` 與其他指令事件（請參閱 Hooks 文件）。

設定與範例請參閱 [Hooks](/zh-TW/automation/hooks)。

### Plugin 鉤子（agent + gateway 生命週期）

這些會在 agent loop 或 gateway pipeline 內執行：

- **`before_model_resolve`**：在工作階段前執行（沒有 `messages`），用於在模型解析前確定性覆寫 provider/model。
- **`before_prompt_build`**：在工作階段載入後執行（有 `messages`），用於在提交 prompt 前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。對每回合動態文字使用 `prependContext`，對應該位於 system prompt 空間中的穩定指引使用 system-context 欄位。
- **`before_agent_start`**：舊版相容鉤子，可能在任一階段執行；請優先使用上方明確鉤子。
- **`before_agent_reply`**：在 inline actions 之後、LLM 呼叫之前執行，讓 Plugin 接管該回合並回傳合成回覆，或完全靜默該回合。
- **`agent_end`**：在完成後檢查最終訊息清單與執行中繼資料。
- **`before_compaction` / `after_compaction`**：觀察或註解 Compaction 週期。
- **`before_tool_call` / `after_tool_call`**：攔截工具參數/結果。
- **`before_install`**：檢查內建掃描結果，並可選擇性封鎖 skill 或 Plugin 安裝。
- **`tool_result_persist`**：在工具結果寫入 OpenClaw 擁有的工作階段 transcript 前，同步轉換工具結果。
- **`message_received` / `message_sending` / `message_sent`**：傳入 + 傳出訊息鉤子。
- **`session_start` / `session_end`**：工作階段生命週期邊界。
- **`gateway_start` / `gateway_stop`**：gateway 生命週期事件。

傳出/工具守衛的鉤子決策規則：

- `before_tool_call`：`{ block: true }` 是終端決策，並會停止較低優先順序的處理器。
- `before_tool_call`：`{ block: false }` 是 no-op，不會清除先前的封鎖。
- `before_install`：`{ block: true }` 是終端決策，並會停止較低優先順序的處理器。
- `before_install`：`{ block: false }` 是 no-op，不會清除先前的封鎖。
- `message_sending`：`{ cancel: true }` 是終端決策，並會停止較低優先順序的處理器。
- `message_sending`：`{ cancel: false }` 是 no-op，不會清除先前的取消。

鉤子 API 與註冊細節請參閱 [Plugin hooks](/zh-TW/plugins/hooks)。

Harness 可能以不同方式適配這些鉤子。Codex app-server harness 會保留
OpenClaw Plugin 鉤子，作為文件化鏡像介面的相容性合約，
而 Codex 原生鉤子仍是另一個較低階的 Codex 機制。

## 串流 + 部分回覆

- Assistant deltas 會從 pi-agent-core 串流，並以 `assistant` 事件發出。
- Block streaming 可以在 `text_end` 或 `message_end` 發出部分回覆。
- Reasoning streaming 可以作為獨立串流或 block 回覆發出。
- 請參閱 [Streaming](/zh-TW/concepts/streaming) 了解 chunking 與 block reply 行為。

## 工具執行 + 訊息工具

- 工具 start/update/end 事件會在 `tool` 串流上發出。
- 工具結果在記錄/發出前，會先針對大小與圖片 payloads 進行清理。
- 訊息工具傳送會被追蹤，以抑制重複的 assistant 確認。

## 回覆塑形 + 抑制

- 最終 payloads 由以下內容組裝：
  - assistant 文字（以及選用的 reasoning）
  - inline 工具摘要（verbose + 允許時）
  - 模型發生錯誤時的 assistant error 文字
- 精確靜默 token `NO_REPLY` / `no_reply` 會從傳出
  payloads 中過濾。
- 訊息工具重複項會從最終 payload 清單中移除。
- 如果沒有剩餘可 render 的 payloads，且工具發生錯誤，則會發出 fallback 工具錯誤回覆
  （除非訊息工具已經傳送使用者可見的回覆）。

## Compaction + 重試

- Auto-compaction 會發出 `compaction` 串流事件，並可能觸發重試。
- 重試時，記憶體內 buffer 與工具摘要會重設，以避免重複輸出。
- Compaction pipeline 請參閱 [Compaction](/zh-TW/concepts/compaction)。

## 事件串流（今日）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 發出（並由 `agentCommand` 作為 fallback 發出）
- `assistant`：來自 pi-agent-core 的串流 deltas
- `tool`：來自 pi-agent-core 的串流工具事件

## 聊天通道處理

- Assistant deltas 會被緩衝到聊天 `delta` 訊息中。
- 聊天 `final` 會在 **lifecycle end/error** 時發出。

## 逾時

- `agent.wait` 預設值：30s（僅等待）。`timeoutMs` 參數可覆寫。
- Agent runtime：`agents.defaults.timeoutSeconds` 預設 172800s（48 小時）；在 `runEmbeddedPiAgent` abort timer 中強制執行。
- Cron runtime：隔離的 agent-turn `timeoutSeconds` 由 cron 擁有。排程器會在執行開始時啟動該 timer，在設定的期限中止底層執行，然後在記錄逾時前執行有界清理，避免過期的 child session 讓 lane 卡住。
- 工作階段存活性診斷：啟用診斷時，`diagnostics.stuckSessionWarnMs` 會分類長時間處於 `processing` 且未觀察到任何 reply、tool、status、block 或 ACP 進度的工作階段。作用中的嵌入式執行、模型呼叫與工具呼叫會回報為 `session.long_running`；沒有近期進度的作用中工作會回報為 `session.stalled`；`session.stuck` 保留給沒有作用中工作的過期工作階段簿記，且只有該路徑會釋放受影響的工作階段 lane，讓已排隊的 startup work 能夠排出。重複的 `session.stuck` 診斷會在工作階段保持不變時退避。
- 模型 idle timeout：如果在 idle window 前沒有回應 chunks 抵達，OpenClaw 會中止模型請求。`models.providers.<id>.timeoutSeconds` 會為緩慢的 local/self-hosted providers 延長此 idle watchdog；否則 OpenClaw 會在已設定時使用 `agents.defaults.timeoutSeconds`，預設上限為 120s。沒有明確模型或 agent 逾時的 Cron 觸發執行會停用 idle watchdog，並仰賴 cron 外層逾時。
- Provider HTTP request timeout：`models.providers.<id>.timeoutSeconds` 適用於該 provider 的模型 HTTP fetches，包括連線、headers、body、SDK request timeout、總 guarded-fetch abort handling，以及模型串流 idle watchdog。對於 Ollama 等緩慢的 local/self-hosted providers，請先使用這個設定，再提高整個 agent runtime timeout。

## 可能提早結束的位置

- Agent 逾時（abort）
- AbortSignal（cancel）
- Gateway 中斷連線或 RPC 逾時
- `agent.wait` 逾時（僅等待，不會停止 agent）

## 相關

- [Tools](/zh-TW/tools) — 可用的 agent 工具
- [Hooks](/zh-TW/automation/hooks) — 由 agent 生命週期事件觸發的事件驅動腳本
- [Compaction](/zh-TW/concepts/compaction) — 長對話如何被摘要
- [Exec Approvals](/zh-TW/tools/exec-approvals) — shell 指令的核准閘門
- [Thinking](/zh-TW/tools/thinking) — thinking/reasoning 層級設定
