---
read_when:
    - 您需要代理迴圈或生命週期事件的精確逐步說明
    - 你正在變更工作階段佇列、逐字稿寫入，或工作階段寫入鎖定行為
summary: 代理迴圈生命週期、串流與等待語意
title: 代理程式迴圈
x-i18n:
    generated_at: "2026-06-27T19:09:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

代理式迴圈是代理程式完整的「真實」執行：接收 → 脈絡組裝 → 模型推論 →
工具執行 → 串流回覆 → 持久化。它是將訊息轉化為動作與最終回覆的權威路徑，
同時保持工作階段狀態一致。

在 OpenClaw 中，迴圈是每個工作階段單一、序列化的執行，會在模型思考、
呼叫工具和串流輸出時發出生命週期與串流事件。本文說明這個真實迴圈如何端到端接線。

## 進入點

- 閘道 RPC：`agent` 和 `agent.wait`。
- 命令列介面：`agent` 命令。

## 運作方式（高階）

1. `agent` RPC 會驗證參數、解析工作階段（sessionKey/sessionId）、持久化工作階段中繼資料，並立即回傳 `{ runId, acceptedAt }`。
2. `agentCommand` 執行代理程式：
   - 解析模型 + thinking/verbose/trace 預設值
   - 載入 Skills 快照
   - 呼叫 `runEmbeddedAgent`（OpenClaw 代理程式執行階段）
   - 如果嵌入式迴圈沒有發出生命週期結束/錯誤，則發出 **lifecycle end/error**
3. `runEmbeddedAgent`：
   - 透過每工作階段 + 全域佇列序列化執行
   - 解析模型 + 驗證設定檔並建置 OpenClaw 工作階段
   - 訂閱執行階段事件並串流 assistant/tool 差異
   - 強制執行逾時 -> 若超過則中止執行
   - 對於 Codex app-server 回合，在終端事件前若已接受的回合停止產生 app-server 進度，則中止該回合
   - 回傳酬載 + 使用量中繼資料
4. `subscribeEmbeddedAgentSession` 將代理程式執行階段事件橋接到 OpenClaw `agent` 串流：
   - 工具事件 => `stream: "tool"`
   - 助理差異 => `stream: "assistant"`
   - 生命週期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 回傳 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 佇列 + 並行

- 執行會依工作階段鍵（工作階段通道）序列化，並可選擇透過全域通道處理。
- 這可防止工具/工作階段競爭，並保持工作階段歷史一致。
- 訊息通道可以選擇佇列模式（steer/followup/collect/interrupt），這些模式會匯入此通道系統。
  請參閱[命令佇列](/zh-TW/concepts/queue)。
- 逐字稿寫入也受到工作階段檔案上的工作階段寫入鎖保護。此鎖是
  可感知程序且基於檔案，因此能捕捉繞過程序內佇列或來自
  另一個程序的寫入者。工作階段逐字稿寫入者最多會等待 `session.writeLock.acquireTimeoutMs`
  後才將工作階段回報為忙碌；預設值為 `60000` 毫秒。
- 工作階段寫入鎖預設不可重入。如果輔助程式刻意巢狀取得
  同一把鎖，同時保留單一邏輯寫入者，必須使用
  `allowReentrant: true` 明確選擇加入。

## 工作階段 + 工作區準備

- 工作區會被解析並建立；沙箱化執行可能會重新導向到沙箱工作區根目錄。
- Skills 會被載入（或從快照重用），並注入到環境與提示中。
- Bootstrap/脈絡檔案會被解析並注入到系統提示報告中。
- 會取得工作階段寫入鎖；`SessionManager` 會在串流前開啟並準備。任何
  後續的逐字稿重寫、壓縮或截斷路徑，在開啟或
  變更逐字稿檔案前，都必須取得同一把鎖。

## 提示組裝 + 系統提示

- 系統提示由 OpenClaw 的基礎提示、Skills 提示、bootstrap 脈絡，以及每次執行覆寫建置而成。
- 會強制套用模型特定限制與壓縮保留 token。
- 請參閱[系統提示](/zh-TW/concepts/system-prompt)，了解模型會看到什麼。

## 鉤子點（你可以攔截的位置）

OpenClaw 有兩套鉤子系統：

- **內部鉤子**（閘道鉤子）：用於命令與生命週期事件的事件驅動腳本。
- **外掛鉤子**：代理程式/工具生命週期與閘道管線內的擴充點。

### 內部鉤子（閘道鉤子）

- **`agent:bootstrap`**：在系統提示定稿前建置 bootstrap 檔案時執行。
  可用於新增/移除 bootstrap 脈絡檔案。
- **命令鉤子**：`/new`、`/reset`、`/stop` 和其他命令事件（請參閱鉤子文件）。

請參閱[鉤子](/zh-TW/automation/hooks)以取得設定與範例。

### 外掛鉤子（代理程式 + 閘道生命週期）

這些會在代理程式迴圈或閘道管線內執行：

- **`before_model_resolve`**：在工作階段前執行（沒有 `messages`），用於在模型解析前確定性覆寫提供者/模型。
- **`before_prompt_build`**：在工作階段載入後執行（有 `messages`），用於在提交提示前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。將 `prependContext` 用於每回合動態文字，並將系統脈絡欄位用於應位於系統提示空間中的穩定指引。
- **`before_agent_start`**：舊版相容鉤子，可能在任一階段執行；偏好使用上方明確鉤子。
- **`before_agent_reply`**：在內嵌動作之後、LLM 呼叫之前執行，讓外掛宣告接手該回合並回傳合成回覆，或完全靜音該回合。
- **`agent_end`**：完成後檢查最終訊息清單與執行中繼資料。
- **`before_compaction` / `after_compaction`**：觀察或註記壓縮週期。
- **`before_tool_call` / `after_tool_call`**：攔截工具參數/結果。
- **`before_install`**：在操作員安裝政策執行後、且外掛鉤子已載入目前 OpenClaw 程序時，檢查暫存的 skill 或外掛安裝素材。
- **`tool_result_persist`**：在工具結果寫入 OpenClaw 擁有的工作階段逐字稿前，同步轉換工具結果。
- **`message_received` / `message_sending` / `message_sent`**：傳入 + 傳出訊息鉤子。
- **`session_start` / `session_end`**：工作階段生命週期邊界。
- **`gateway_start` / `gateway_stop`**：閘道生命週期事件。

傳出/工具防護的鉤子決策規則：

- `before_tool_call`：`{ block: true }` 是終端決策，會停止較低優先順序的處理器。
- `before_tool_call`：`{ block: false }` 是無操作，且不會清除先前的封鎖。
- `before_install`：`{ block: true }` 是終端決策，會停止較低優先順序的處理器。
- `before_install`：`{ block: false }` 是無操作，且不會清除先前的封鎖。
- 對於必須涵蓋命令列介面安裝與更新路徑、由操作員擁有的安裝允許/封鎖決策，請使用 `security.installPolicy`，而不是 `before_install`。
- `message_sending`：`{ cancel: true }` 是終端決策，會停止較低優先順序的處理器。
- `message_sending`：`{ cancel: false }` 是無操作，且不會清除先前的取消。

請參閱[外掛鉤子](/zh-TW/plugins/hooks)以取得鉤子 API 與註冊詳細資料。

Harness 可能會以不同方式適配這些鉤子。Codex app-server harness 會將
OpenClaw 外掛鉤子保留作為文件化鏡像
表面的相容性契約，而 Codex 原生鉤子仍是另一個較低階的 Codex 機制。

## 串流 + 部分回覆

- 助理差異會從代理程式執行階段串流，並作為 `assistant` 事件發出。
- 區塊串流可以在 `text_end` 或 `message_end` 發出部分回覆。
- 推理串流可以作為獨立串流發出，或作為區塊回覆發出。
- 請參閱[串流](/zh-TW/concepts/streaming)，了解分塊與區塊回覆行為。

## 工具執行 + 訊息工具

- 工具開始/更新/結束事件會在 `tool` 串流上發出。
- 工具結果在記錄/發出前，會針對大小與圖片酬載進行清理。
- 訊息工具傳送會被追蹤，以抑制重複的助理確認。

## 回覆塑形 + 抑制

- 最終酬載由以下內容組裝：
  - 助理文字（以及選用推理）
  - 內嵌工具摘要（verbose + allowed 時）
  - 模型錯誤時的助理錯誤文字
- 精確的靜音 token `NO_REPLY` / `no_reply` 會從傳出
  酬載中濾除。
- 訊息工具重複項會從最終酬載清單中移除。
- 如果沒有剩餘可算繪酬載且工具發生錯誤，會發出備用工具錯誤回覆
  （除非訊息工具已傳送使用者可見的回覆）。

## 壓縮 + 重試

- 自動壓縮會發出 `compaction` 串流事件，並可觸發重試。
- 重試時，記憶體內緩衝區與工具摘要會重設，以避免重複輸出。
- 請參閱[壓縮](/zh-TW/concepts/compaction)以了解壓縮管線。

## 事件串流（目前）

- `lifecycle`：由 `subscribeEmbeddedAgentSession` 發出（也會由 `agentCommand` 作為備用發出）
- `assistant`：來自代理程式執行階段的串流差異
- `tool`：來自代理程式執行階段的串流工具事件

## 聊天通道處理

- 助理差異會被緩衝成聊天 `delta` 訊息。
- 聊天 `final` 會在 **lifecycle end/error** 時發出。

## 逾時

- `agent.wait` 預設值：30 秒（僅等待）。`timeoutMs` 參數可覆寫。
- 代理程式執行階段：`agents.defaults.timeoutSeconds` 預設為 172800 秒（48 小時）；由 `runEmbeddedAgent` 中止計時器強制執行。
- 排程執行階段：隔離代理程式回合的 `timeoutSeconds` 由排程擁有。排程器會在執行開始時啟動該計時器，在設定的截止時間中止底層執行，然後執行有界清理，再記錄逾時，避免過期的子工作階段讓通道卡住。
- 工作階段存活診斷：啟用診斷時，`diagnostics.stuckSessionWarnMs` 會分類長時間處於 `processing`、且沒有觀察到回覆、工具、狀態、區塊或 ACP 進度的工作階段。作用中的嵌入式執行、模型呼叫與工具呼叫會回報為 `session.long_running`；受擁有的靜默模型呼叫也會維持 `session.long_running`，直到 `diagnostics.stuckSessionAbortMs`，因此緩慢或非串流提供者不會太早被回報為停滯。沒有近期進度的作用中工作會回報為 `session.stalled`；受擁有的模型呼叫會在達到或超過中止閾值時切換為 `session.stalled`，而無擁有者的過期模型/工具活動不會被隱藏為長時間執行。`session.stuck` 保留給可復原的過期工作階段簿記，包括具有過期無擁有者模型/工具活動的閒置佇列工作階段。過期工作階段簿記會在復原閘門通過後立即釋放受影響的工作階段通道；停滯的嵌入式執行只會在 `diagnostics.stuckSessionAbortMs`（預設：至少 5 分鐘且為警告閾值的 3 倍）後中止並排空，因此佇列工作可以恢復，而不會切斷只是緩慢的執行。復原會發出結構化的 requested/completed 結果，且只有在同一個處理 generation 仍是目前狀態時，診斷狀態才會標記為閒置。重複的 `session.stuck` 診斷會在工作階段保持不變時退避。
- 模型閒置逾時：當回應區塊在閒置視窗前未抵達時，OpenClaw 會中止模型請求。`models.providers.<id>.timeoutSeconds` 會為緩慢的本機/自架提供者延長此閒置看門狗，但它仍受任何較低的 `agents.defaults.timeoutSeconds` 或執行特定逾時限制，因為那些控制整個代理程式執行。否則，OpenClaw 會在設定時使用 `agents.defaults.timeoutSeconds`，預設上限為 120 秒。排程觸發且沒有明確模型或代理程式逾時的雲端模型執行，使用相同的預設閒置看門狗；若有明確排程執行逾時，雲端模型串流停滯上限為 60 秒，使設定的模型備援能在外層排程截止時間前執行。排程觸發的本機或自架模型執行會停用隱含看門狗，除非設定了明確逾時；明確的排程執行逾時仍是本機/自架提供者的閒置視窗，因此緩慢的本機提供者應設定 `models.providers.<id>.timeoutSeconds`。
- 提供者 HTTP 請求逾時：`models.providers.<id>.timeoutSeconds` 會套用於該提供者的模型 HTTP fetch，包括連線、標頭、本文、SDK 請求逾時、總體受防護 fetch 中止處理，以及模型串流閒置看門狗。對於 Ollama 這類緩慢的本機/自架提供者，請先使用此設定，再提高整個代理程式執行階段逾時；當模型請求需要執行更久時，請保持代理程式/執行階段逾時至少同樣高。

## 可能提早結束的位置

- 代理逾時（中止）
- AbortSignal（取消）
- 閘道中斷連線或 RPC 逾時
- `agent.wait` 逾時（僅等待，不會停止代理）

## 相關

- [工具](/zh-TW/tools) — 可用的代理工具
- [鉤子](/zh-TW/automation/hooks) — 由代理生命週期事件觸發的事件驅動指令碼
- [壓縮](/zh-TW/concepts/compaction) — 長對話如何被摘要
- [執行核准](/zh-TW/tools/exec-approvals) — shell 命令的核准關卡
- [思考](/zh-TW/tools/thinking) — 思考／推理等級設定
