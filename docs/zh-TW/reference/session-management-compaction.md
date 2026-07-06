---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿 JSONL 或 sessions.json 欄位
    - 你正在變更自動壓縮行為，或新增「壓縮前」的整理工作
    - 你想實作記憶清除或靜默系統回合
summary: 深入探討：工作階段儲存區與逐字稿、生命週期，以及（自動）壓縮內部機制
title: 工作階段管理深入探討
x-i18n:
    generated_at: "2026-07-06T21:51:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84b374402af261ed6d479dac85d44656cb83e52bba04d66153f3d66a608232ec
    source_path: reference/session-management-compaction.md
    workflow: 16
---

單一**閘道程序**端到端擁有工作階段狀態。UI（macOS app、網頁 Control UI、終端介面）會向閘道查詢工作階段清單與權杖計數。在遠端模式中，工作階段檔案位於遠端主機上，因此檢查本機 Mac 的檔案不會反映閘道實際使用的內容。

請先閱讀概覽文件：[工作階段管理](/zh-TW/concepts/session)、[壓縮](/zh-TW/concepts/compaction)、[記憶概覽](/zh-TW/concepts/memory)、[記憶搜尋](/zh-TW/concepts/memory-search)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[轉錄衛生](/zh-TW/reference/transcript-hygiene)，完整設定參考見 [代理設定](/zh-TW/gateway/config-agents)。

## 兩個持久化層

1. **工作階段存放區 (`sessions.json`)** - 鍵/值映射 `sessionKey -> SessionEntry`。小型、可變、可安全編輯或刪除項目。追蹤中繼資料：目前工作階段 id、上次活動、切換狀態、權杖計數器。
2. **轉錄 (`<sessionId>.jsonl`)** - 僅附加、樹狀結構（項目有 `id` + `parentId`）。儲存對話、工具呼叫與壓縮摘要；為未來輪次重建模型上下文。壓縮檢查點是壓縮後繼轉錄上的中繼資料 - 新的壓縮不會寫入第二份 `.checkpoint.*.jsonl` 副本。

閘道歷史讀取器會避免具現化整個轉錄，除非介面需要任意歷史存取。第一頁歷史、嵌入式聊天歷史、重新啟動復原，以及權杖/用量檢查會使用有界尾端讀取。完整轉錄掃描會經由非同步轉錄索引，依檔案路徑加上 `mtimeMs`/`size` 快取，並在並行讀取器之間共用。

## 磁碟位置

每個代理在閘道主機上（透過 `src/config/sessions.ts` 解析）：

- 存放區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 轉錄：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

## 存放區維護與磁碟控制

`session.maintenance` 控制 `sessions.json`、轉錄成品與軌跡 sidecar 的自動維護：

| 鍵                    | 預設值                | 備註                                                                             |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | 或 `"warn"`（僅回報，不變更）                                            |
| `pruneAfter`            | `"30d"`               | 過期項目年齡截止                                                            |
| `maxEntries`            | `500`                 | `sessions.json` 中的項目上限                                                 |
| `resetArchiveRetention` | 與 `pruneAfter` 相同  | `*.reset.<timestamp>` 轉錄封存的保留期；`false` 會停用清理 |
| `maxDiskBytes`          | 未設定                 | 選用的工作階段目錄預算                                                |
| `highWaterBytes`        | `maxDiskBytes` 的 80% | 預算清理後的目標                                                       |

閘道模型執行探測工作階段（符合 `agent:*:explicit:model-run-<uuid>` 的鍵）有獨立、固定的 `24h` 保留期。此修剪受壓力閘控：只有在達到工作階段項目維護/上限壓力時才會執行，且只會在全域過期項目清理/上限步驟之前執行。其他 explicit 工作階段不使用此保留期。

磁碟預算清理的強制執行順序（`mode: "enforce"`）：

1. 先移除最舊的封存、孤立轉錄或孤立軌跡成品。
2. 如果仍高於目標，逐出最舊的工作階段項目及其轉錄/軌跡檔案。
3. 重複直到用量等於或低於 `highWaterBytes`。

`mode: "warn"` 會回報潛在逐出項目，而不變更存放區或檔案。

隨選執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

維護會保留持久的外部對話指標，例如群組工作階段與執行緒範圍的聊天工作階段，但合成的執行階段項目（排程、hooks、心跳偵測、ACP、子代理）在超過設定的年齡、數量或磁碟預算後仍可被移除。隔離的排程執行會使用獨立的 `cron.sessionRetention` 控制，不受模型執行探測保留期影響。

一般閘道寫入會透過每個存放區的工作階段寫入器進行，該寫入器會序列化程序內變更，而不取得執行階段檔案鎖。熱路徑修補 helper 會在持有該寫入器槽位時借用已驗證的可變快取，因此大型 `sessions.json` 檔案不會為每次中繼資料更新都被複製或重新讀取。在執行階段程式碼中偏好使用 `updateSessionStore(...)` / `updateSessionStoreEntry(...)`；直接儲存整個存放區是為相容性與離線維護工具保留。當閘道可連線時，非 dry-run 的 `openclaw sessions cleanup` 與 `openclaw agents delete` 會將存放區變更委派給閘道，使清理加入同一個寫入器佇列；`--store <path>` 是直接檔案維護的明確離線修復路徑，且一律保持在本機（`--dry-run` 亦同）。`maxEntries` 清理會針對生產規模存放區批次處理，因此存放區可能短暫超過設定上限，直到下一次 high-water 清理將其重寫降低。讀取在閘道啟動期間絕不會修剪或限制項目 - 只有寫入或 `openclaw sessions cleanup --enforce` 會這麼做，後者也會立即套用上限，並修剪舊的未參照轉錄、檢查點與軌跡成品，即使未設定磁碟預算也一樣。

OpenClaw 不再於閘道寫入期間建立自動 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，且 `openclaw doctor --fix` 會從較舊設定中移除它。

轉錄變更會在轉錄檔案上使用工作階段寫入鎖：

| 設定                              | 預設值   | 環境覆寫                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` 是鎖等待在放棄前浮現忙碌工作階段錯誤的時間；只有在合法的準備、清理、壓縮或轉錄鏡像工作在慢速機器上競爭更久時才提高它。`staleMs` 是既有鎖可被視為過期並回收的時間。`maxHoldMs` 是程序內看門狗釋放門檻。

## 排程工作階段與執行記錄

隔離的排程執行會建立自己的工作階段項目/轉錄，並有專用保留期：

- `cron.sessionRetention`（預設 `"24h"`）會從存放區修剪舊的隔離排程執行工作階段；`false` 會停用。
- `cron.runLog.keepLines` 會依每個排程工作修剪保留的 SQLite 執行歷史列（預設 `2000`）。`cron.runLog.maxBytes` 只為了相容較舊的檔案式執行記錄而接受。

當排程強制建立新的隔離執行工作階段時，它會在寫入新列前清理前一個 `cron:<jobId>` 工作階段項目：它會帶入安全偏好設定（thinking/fast/verbose/reasoning 設定、標籤、顯示名稱）以及使用者明確選取的模型/auth 覆寫，但會丟棄環境對話上下文（channel/group 路由、send/queue 政策、elevation、origin、ACP 執行階段繫結），使新的隔離執行無法從較舊執行繼承過期的遞送或執行階段權限。

## 工作階段鍵 (`sessionKey`)

`sessionKey` 會識別你所在的對話 bucket（路由 + 隔離）。標準規則：[/concepts/session](/zh-TW/concepts/session)。

| 模式                      | 範例                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| 主要/直接聊天（每個代理） | `agent:<agentId>:<mainKey>`（預設 `main`）                |
| 群組                        | `agent:<agentId>:<channel>:group:<id>`                      |
| 房間/頻道（Discord/Slack） | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| 排程                         | `cron:<job.id>`                                             |
| 網路鉤子                      | `hook:<uuid>`（除非被覆寫）                           |

## 工作階段 id (`sessionId`)

每個 `sessionKey` 都指向目前的 `sessionId`（繼續對話的轉錄檔案）。決策邏輯位於 `src/auto-reply/reply/session.ts` 的 `initSessionState()`。

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為閘道主機本地時間上午 4:00）會在重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes`，或舊版 `session.idleMinutes`）會在閒置視窗後有訊息抵達時建立新的 `sessionId`。如果每日與閒置都已設定，先到期者優先。
- **Control UI 重新連線續接**會在閘道從操作員 UI 用戶端收到相符的 `sessionId` 時，為一次重新連線傳送保留目前可見的工作階段。這是一次性訊號；一般過期傳送仍會建立新的 `sessionId`。
- **系統事件**（心跳偵測、排程喚醒、exec 通知、閘道簿記）可能會變更工作階段列，但絕不延長每日/閒置重設新鮮度。重設輪替會在建立新 prompt 前，丟棄前一工作階段排隊中的系統事件通知。
- **父層 fork 政策**在建立執行緒或子代理 fork 時會使用 OpenClaw 的作用中分支。如果該分支太大（超過固定內部上限，目前為 100K 權杖），OpenClaw 會以隔離上下文啟動子項，而不是失敗或繼承不可用的歷史。大小評估是自動且不可設定；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。
- **操作員 fork**：`sessions.create { parentSessionKey, fork: true }` 會建立新的工作階段，其轉錄會從父層目前狀態分支（與子代理生成相同的 fork 機制，包括上述大小上限）。當父層有作用中執行時會拒絕 fork；除非明確傳入模型選擇，否則會繼承父層的模型選擇，並以新的權杖計數器將子項標記為 `forkedFromParent`。

## 工作階段存放區結構描述 (`sessions.json`)

值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。主要欄位（非詳盡）：

- `sessionId`：目前的逐字稿 ID（除非設定 `sessionFile`，否則檔名會由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設的新鮮度會使用此值。舊版資料列可能會從 JSONL 工作階段標頭衍生此值。
- `lastInteractionAt`：最後一次真實使用者/頻道互動的時間戳；閒置重設的新鮮度會使用此值，因此心跳偵測、排程和 exec 事件不會讓工作階段保持存活。沒有此欄位的舊版資料列會退回使用復原出的工作階段開始時間。
- `updatedAt`：最後一次儲存資料列變更的時間戳，用於列表/修剪/簿記 - 不是每日/閒置新鮮度的權威來源。
- `archivedAt`：選用的封存時間戳。已封存的工作階段會保留在儲存區中，逐字稿維持完整，並會從一般作用中列表排除。
- `pinnedAt`：選用的釘選時間戳。作用中的已釘選工作階段會排序在未釘選工作階段之前；封存工作階段會清除其釘選。
- Codex 執行緒互通：兩個欄位都遵循 Codex 執行緒管理形狀 - 線路上的 `archived`/`pinned` 布林值一律由時間戳衍生並在伺服器端蓋章，符合 Codex `threads.archived_at` 語意與 camelCase 序列化。OpenClaw 時間戳是 epoch 毫秒，而 Codex 使用 epoch 秒，因此橋接會在 codex 外掛邊界進行轉換。Codex 尚無釘選 API（只有 `thread/archive`/`thread/unarchive`）；在其出現之前，釘選狀態會留在 OpenClaw 端，屆時相符的形狀可讓繫結工作階段以機械方式來回傳遞釘選狀態。
- `lastReadAt` / `markedUnreadAt`：由 `sessions.patch { unread }` 在伺服器端蓋章的讀取狀態時間戳 - `unread: false` 會記錄已讀（設定 `lastReadAt`，清除 `markedUnreadAt`）；`unread: true` 會將工作階段標記為未讀，直到下一次讀取。工作階段資料列會公開衍生出的 `unread` 布林值：明確標記為未讀，或在最新活動之前已讀。從未標記為已讀的工作階段會維持 `unread: false`，因此既有安裝不會在升級時亮起。
- `lastActivityAt`：最後一次已完成代理執行且算作值得標記未讀活動的時間戳（使用者、頻道和排程執行）。心跳偵測與內部事件回合，以及中繼資料修補，不會更新此值；`updatedAt` 不是活動訊號。
- `sessionFile`：選用的明確逐字稿路徑覆寫
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群組/頻道標籤中繼資料
- 切換項：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（每個工作階段的覆寫）
- 模型選擇：`providerOverride`、`modelOverride`、`authProfileOverride`
- Token 計數器（盡力而為/取決於提供者）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵的自動壓縮完成次數
- `memoryFlushAt` / `memoryFlushCompactionCount`：上次壓縮前記憶體清除的時間戳與壓縮次數

儲存區可以安全編輯，但閘道才是權威來源：它可能會在工作階段執行時重寫或重新補水項目。

## 逐字稿結構（`*.jsonl`）

逐字稿由 `SessionManager`（`openclaw/plugin-sdk/agent-sessions`）管理。檔案是 JSONL：

- 第一行：工作階段標頭 - `type: "session"`、`id`、`cwd`、`timestamp`、選用的 `parentSession`。
- 然後：含有 `id` + `parentId`（樹狀結構）的項目。

值得注意的項目類型：

- `message`：使用者/助理/toolResult 訊息
- `custom_message`：由擴充功能注入、_會_進入模型脈絡的訊息（當 `display: true` 時在終端介面中呈現，當 `display: false` 時完全隱藏）
- `custom`：_不會_進入模型脈絡的擴充功能狀態（用於在重新載入之間持久保存擴充功能狀態）
- `compaction`：持久保存的壓縮摘要，含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：導覽樹狀分支時持久保存的摘要

OpenClaw 刻意不「修補」逐字稿；閘道使用 `SessionManager` 讀寫它們。

## 脈絡視窗與追蹤的 token

兩個不同概念：

1. **模型脈絡視窗**：每個模型的硬性上限（模型可見的 token）。來自模型型錄，並可透過設定覆寫。
2. **工作階段儲存計數器**：寫入 `sessions.json` 的滾動統計（用於 `/status` 和儀表板）。`contextTokens` 是執行階段估計/回報值 - 不要將它視為嚴格保證。

更多限制資訊：[/reference/token-use](/zh-TW/reference/token-use)。

## 壓縮：它是什麼

壓縮會將較舊的對話摘要成逐字稿中持久保存的 `compaction` 項目，並保持最近訊息完整。壓縮後，未來回合會看到壓縮摘要加上 `firstKeptEntryId` 之後的訊息。壓縮是**持久的**，不同於工作階段修剪 - 請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

壓縮後重新注入 AGENTS.md 章節是透過 `agents.defaults.compaction.postCompactionSections` 選擇啟用；未設定或為 `[]` 時，OpenClaw 不會在壓縮摘要之上附加 AGENTS.md 摘錄。

### 區塊邊界與工具配對

將長逐字稿拆分成壓縮區塊時，OpenClaw 會讓助理工具呼叫與其相符的 `toolResult` 項目保持配對：

- 如果依 token 佔比切分會落在工具呼叫與其結果之間，OpenClaw 會將邊界移到助理工具呼叫訊息，而不是分開這組配對。
- 如果尾端工具結果區塊原本會讓區塊超過目標，OpenClaw 會保留該待處理工具區塊，並保持未摘要的尾端完整。
- 已中止/錯誤的工具呼叫區塊不會讓待處理切分保持開啟。

## 自動壓縮何時發生

內嵌 OpenClaw 代理有兩個觸發條件：

1. **溢位復原**：模型回傳脈絡溢位錯誤（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`，以及其他提供者形狀的變體）- 先壓縮，然後重試。當提供者回報嘗試的 token 數時，OpenClaw 會將觀察到的計數轉送到溢位復原壓縮；如果提供者確認溢位但未公開可剖析的計數，OpenClaw 會將最低限度超出預算的合成計數傳給壓縮引擎和診斷。如果溢位復原仍然失敗，OpenClaw 會顯示明確指引並保留目前工作階段對應，而不是靜默輪替到新的工作階段 ID - 請重試訊息、執行 `/compact`，或執行 `/new`。
2. **閾值維護**：成功回合後，當 `contextTokens > contextWindow - reserveTokens`，其中 `contextWindow` 是模型的脈絡視窗，`reserveTokens` 是為提示加上下一次模型輸出保留的餘裕。

另外兩個防護會在這兩個觸發條件之外執行：

- **預檢本機壓縮**：設定 `agents.defaults.compaction.maxActiveTranscriptBytes`（位元組或像 `"20mb"` 這樣的字串），以在作用中逐字稿檔案達到該大小後、開啟下一次執行前觸發本機壓縮。這是針對本機重新開啟成本的檔案大小防護，不是原始封存 - 一般語意壓縮仍會執行，且它需要 `truncateAfterCompaction`，讓壓縮後的摘要成為新的後繼逐字稿。
- **回合中預檢**：設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（預設 `false`）以新增工具迴圈防護。工具結果附加後、下一次模型呼叫之前，OpenClaw 會使用與回合開始時相同的預檢預算邏輯來估算提示壓力。如果脈絡不再容納，防護不會內聯壓縮 - 它會引發結構化的回合中預檢訊號、停止目前提示提交，並讓外層執行迴圈使用既有復原路徑（在足夠時截斷過大的工具結果，或觸發設定的壓縮模式並重試）。可與 `default` 和 `safeguard` 壓縮模式搭配使用，包括提供者支援的 safeguard 壓縮。獨立於 `maxActiveTranscriptBytes`：位元組大小防護會在回合開啟前執行，回合中預檢則稍後執行，在新的工具結果附加之後。

## 壓縮設定

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw 也會針對內嵌執行強制執行安全下限：如果 `compaction.reserveTokens` 低於 `reserveTokensFloor`（預設 `20000`），OpenClaw 會將它提高。設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用下限。當作用中模型脈絡視窗已知時，下限與最終有效保留量都會被封頂，使保留量無法耗盡整個提示預算。這可避免小脈絡模型（例如 16K-token 本機模型）從第一個 token 就進入壓縮；若脈絡視窗未知，已設定與目前的保留預算會維持不封頂。為何需要下限：在壓縮變得不可避免之前，為多回合「例行維護」（例如下方的記憶體清除）留下足夠餘裕。實作：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`，由內嵌執行器回合與壓縮設定路徑呼叫。

手動 `/compact` 會遵循明確的 `agents.defaults.compaction.keepRecentTokens`，並保留執行階段的最近尾端切點。若沒有明確保留預算，手動壓縮就是硬性檢查點，重建後的脈絡會從新摘要開始。

啟用 `truncateAfterCompaction` 時，OpenClaw 會在壓縮後將作用中逐字稿輪替為壓縮後的後繼 JSONL。分支/還原檢查點動作會使用該壓縮後的後繼；舊版壓縮前檢查點檔案在被參照時仍可讀取。

## 可插拔壓縮提供者

外掛會透過外掛 API 上的 `registerCompactionProvider()` 註冊壓縮提供者。當 `agents.defaults.compaction.provider` 設為已註冊的提供者 ID 時，safeguard 擴充功能會將摘要委派給該提供者，而不是內建的 `summarizeInStages` 管線。

- `provider`：已註冊壓縮提供者外掛的 ID。未設定時使用預設 LLM 摘要。設定 `provider` 會強制 `mode: "safeguard"`。
- 提供者會收到與內建路徑相同的壓縮指示和識別碼保留政策，且 safeguard 在提供者輸出後仍會保留最近回合和切分回合的後綴脈絡。
- 內建 safeguard 摘要會用新訊息重新萃取先前摘要，而不是逐字保留完整的先前摘要。
- Safeguard 模式預設會啟用摘要品質稽核；設定 `qualityGuard.enabled: false` 可略過格式錯誤輸出時重試的行為。
- 如果提供者失敗或回傳空結果，OpenClaw 會自動退回使用內建 LLM 摘要。由呼叫端明確觸發的中止/逾時訊號會重新拋出，而不會被吞掉，因此取消一律會被尊重。

來源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 使用者可見介面

- 任何聊天工作階段中的 `/status`
- `openclaw status`（命令列介面）
- `openclaw sessions` / `openclaw sessions --json`
- 閘道記錄（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細模式：`🧹 Auto-compaction complete` 加上壓縮次數

## 靜默例行維護（`NO_REPLY`）

OpenClaw 支援用於背景工作的「靜默」回合，使用者不應看到中間輸出。

- 助理在輸出開頭使用精確的靜默權杖 `NO_REPLY` / `no_reply`，表示「不要向使用者送出回覆」。OpenClaw 會在傳遞層剝除/抑制這個權杖。
- 精確靜默權杖抑制不區分大小寫：當整個承載內容只有靜默權杖時，`NO_REPLY` 和 `no_reply` 都會計入。
- 自 `2026.1.10` 起，當部分區塊以 `NO_REPLY` 開頭時，OpenClaw 也會抑制草稿/輸入中串流，因此靜默操作不會在回合中途洩漏部分輸出。
- 這僅用於真正的背景/不傳遞回合，不是一般可執行使用者請求的捷徑。

## 壓縮前記憶排清

在自動壓縮發生前，OpenClaw 可以執行一個靜默的代理式回合，將持久狀態寫入磁碟（例如代理工作區中的 `memory/YYYY-MM-DD.md`），因此壓縮不會抹除關鍵脈絡。它會監控工作階段脈絡使用量，一旦跨過低於壓縮閾值的軟閾值，就會使用精確靜默權杖 `NO_REPLY` / `no_reply` 傳送靜默的「立即寫入記憶」指示，讓使用者看不到任何內容。

設定（`agents.defaults.compaction.memoryFlush`），完整參考位於 [/gateway/config-agents](/zh-TW/gateway/config-agents#agentsdefaultscompaction)：

| 鍵                          | 預設             | 備註                                                                                                                                     |
| --------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                          |
| `model`                     | 未設定           | 僅用於排清回合的精確提供者/模型覆寫，例如 `ollama/qwen3:8b`                                                                              |
| `softThresholdTokens`       | `4000`           | 低於壓縮閾值且會觸發排清的間距                                                                                                           |
| `forceFlushTranscriptBytes` | 未設定（已停用） | 當逐字稿檔案達到此位元組大小（或像 `"2mb"` 這樣的字串）時強制排清，即使權杖計數器已過時；`0` 會停用                                        |
| `prompt`                    | 內建             | 排清回合的使用者訊息                                                                                                                     |
| `systemPrompt`              | 內建             | 針對排清回合附加的額外系統提示                                                                                                           |

備註：

- 預設提示/系統提示包含 `NO_REPLY` 提示，以抑制傳遞。
- 設定 `model` 時，排清回合會使用該模型，而不繼承作用中工作階段的備援鏈，因此僅限本機的內務處理不會在失敗時靜默退回到付費對話模型。
- 每個壓縮週期只會執行一次排清（在 `sessions.json` 中追蹤）。
- 排清僅針對嵌入式 OpenClaw 工作階段執行；命令列介面後端和心跳偵測回合會略過它。
- 當工作階段工作區為唯讀（`workspaceAccess: "ro"` 或 `"none"`）時，會略過排清。
- 請參閱[記憶](/zh-TW/concepts/memory)，了解工作區檔案版面配置與寫入模式。

OpenClaw 在擴充 API 中公開 `session_before_compact` 鉤子，但上述排清邏輯位於閘道端（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），而不是該鉤子上。

## 疑難排解檢查清單

- **工作階段鍵錯誤？** 從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- **儲存區與逐字稿不一致？** 從 `openclaw status` 確認閘道主機和儲存區路徑。
- **壓縮洗版？** 檢查模型的脈絡視窗（太小會迫使頻繁壓縮）、`reserveTokens`（對模型視窗而言太高會導致較早壓縮），以及工具結果膨脹（調整工作階段修剪）。
- **每個提示在小型本機模型上似乎都溢位？** 確認提供者回報正確的模型脈絡視窗。只有在已知該視窗時，OpenClaw 才能限制有效保留量。
- **靜默回合洩漏？** 確認回覆以精確靜默權杖 `NO_REPLY` 開頭（不區分大小寫），且你使用的建置包含串流抑制修正（`2026.1.10` 以上）。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [脈絡引擎](/zh-TW/concepts/context-engine)
- [代理設定參考](/zh-TW/gateway/config-agents)
