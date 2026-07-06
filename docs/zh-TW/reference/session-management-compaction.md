---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿 JSONL，或 `sessions.json` 欄位
    - 你正在變更自動壓縮行為，或新增「預先壓縮」清理工作
    - 你想要實作記憶清除或靜默系統回合
summary: 深入探討：工作階段儲存區與逐字稿、生命週期，以及（自動）壓縮內部機制
title: 工作階段管理深入探討
x-i18n:
    generated_at: "2026-07-06T10:52:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb7ac88649e24472bdb00e0f6739dc7885cd713c1497b8be966d2b9dfe1cf1e
    source_path: reference/session-management-compaction.md
    workflow: 16
---

單一**閘道程序**擁有端對端的工作階段狀態。UI（macOS 應用程式、網頁 Control UI、終端介面）會向閘道查詢工作階段清單和權杖數量。在遠端模式中，工作階段檔案位於遠端主機上，因此檢查本機 Mac 的檔案不會反映閘道實際使用的內容。

請先閱讀概觀文件：[工作階段管理](/zh-TW/concepts/session)、[壓縮](/zh-TW/concepts/compaction)、[記憶概觀](/zh-TW/concepts/memory)、[記憶搜尋](/zh-TW/concepts/memory-search)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[轉錄衛生](/zh-TW/reference/transcript-hygiene)，完整設定參考請見[代理程式設定](/zh-TW/gateway/config-agents)。

## 兩個持久化層

1. **工作階段儲存區 (`sessions.json`)** - 鍵/值對應 `sessionKey -> SessionEntry`。小型、可變，可安全編輯或刪除項目。追蹤中繼資料：目前工作階段 ID、最後活動時間、切換項、權杖計數器。
2. **轉錄 (`<sessionId>.jsonl`)** - 僅附加、樹狀結構（項目有 `id` + `parentId`）。儲存對話、工具呼叫和壓縮摘要；為未來回合重建模型上下文。壓縮檢查點是壓縮後繼轉錄上的中繼資料 - 新的壓縮不會寫入第二份 `.checkpoint.*.jsonl` 複本。

閘道歷史讀取器會避免具體化整個轉錄，除非該介面需要任意歷史存取。第一頁歷史、嵌入式聊天歷史、重新啟動復原，以及權杖/用量檢查都使用有界限的尾端讀取。完整轉錄掃描會透過非同步轉錄索引，依檔案路徑加上 `mtimeMs`/`size` 快取，並在並行讀取器之間共享。

## 磁碟位置

每個代理程式在閘道主機上（透過 `src/config/sessions.ts` 解析）：

- 儲存區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 轉錄：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

## 儲存區維護和磁碟控制

`session.maintenance` 控制 `sessions.json`、轉錄成品和軌跡旁支檔案的自動維護：

| 鍵                     | 預設值               | 備註                                                                             |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | 或 `"warn"`（僅回報，不變更）                                            |
| `pruneAfter`            | `"30d"`               | 過時項目的年齡截止                                                            |
| `maxEntries`            | `500`                 | `sessions.json` 中項目的上限                                                 |
| `resetArchiveRetention` | 與 `pruneAfter` 相同  | `*.reset.<timestamp>` 轉錄封存的保留期；`false` 會停用清理 |
| `maxDiskBytes`          | 未設定                 | 選用的工作階段目錄預算                                                |
| `highWaterBytes`        | `maxDiskBytes` 的 80% | 預算清理後的目標                                                       |

閘道模型執行探測工作階段（符合 `agent:*:explicit:model-run-<uuid>` 的鍵）會取得獨立且固定的 `24h` 保留期。此修剪受壓力閘控：只有在達到工作階段項目維護/上限壓力時才會執行，且只會在全域過時項目清理/上限步驟之前執行。其他明確工作階段不使用此保留期。

磁碟預算清理的強制執行順序（`mode: "enforce"`）：

1. 先移除最舊的封存、孤立轉錄或孤立軌跡成品。
2. 如果仍高於目標，逐出最舊的工作階段項目及其轉錄/軌跡檔案。
3. 重複直到用量等於或低於 `highWaterBytes`。

`mode: "warn"` 會回報可能的逐出項目，而不變更儲存區或檔案。

依需求執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

維護會保留持久的外部對話指標，例如群組工作階段和執行緒範圍的聊天工作階段，但合成執行階段項目（排程、掛鉤、心跳偵測、ACP、子代理程式）在超過設定的年齡、數量或磁碟預算後仍可能被移除。隔離的排程執行會使用獨立的 `cron.sessionRetention` 控制，與模型執行探測保留期無關。

一般閘道寫入會透過每個儲存區的工作階段寫入器流動，該寫入器會序列化程序內變更，而不取得執行階段檔案鎖定。熱路徑修補輔助工具會在持有該寫入器槽位時借用已驗證的可變快取，因此大型 `sessions.json` 檔案不會因每次中繼資料更新而被複製或重新讀取。在執行階段程式碼中，優先使用 `updateSessionStore(...)` / `updateSessionStoreEntry(...)`；直接儲存整個儲存區是為了相容性和離線維護工具。當閘道可達時，非 dry-run 的 `openclaw sessions cleanup` 和 `openclaw agents delete` 會將儲存區變更委派給閘道，讓清理加入相同的寫入器佇列；`--store <path>` 是直接檔案維護的明確離線修復路徑，且一律保持本機執行（`--dry-run` 也是如此）。`maxEntries` 清理會針對生產規模的儲存區分批執行，因此儲存區可能會在下一次高水位清理將其重寫降低之前，短暫超過設定上限。讀取在閘道啟動期間絕不會修剪或限制項目 - 只有寫入或 `openclaw sessions cleanup --enforce` 會這麼做，而後者也會立即套用上限，並且即使未設定磁碟預算，也會修剪舊的未參照轉錄、檢查點和軌跡成品。

OpenClaw 不再於閘道寫入期間建立自動的 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，且 `openclaw doctor --fix` 會將其從較舊設定中移除。

轉錄變更會在轉錄檔案上使用工作階段寫入鎖定：

| 設定                              | 預設值   | 環境覆寫                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` 是放棄之前，鎖定等待浮現忙碌工作階段錯誤的時間長度；只有在合法的準備、清理、壓縮或轉錄鏡像工作會在較慢機器上競爭更久時才提高它。`staleMs` 是現有鎖定可被回收為過期的時間。`maxHoldMs` 是程序內看門狗釋放閾值。

## 排程工作階段和執行記錄

隔離的排程執行會建立自己的工作階段項目/轉錄，並具有專用保留期：

- `cron.sessionRetention`（預設 `"24h"`）會從儲存區修剪舊的隔離排程執行工作階段；`false` 會停用。
- `cron.runLog.keepLines` 會依每個排程工作修剪保留的 SQLite 執行歷史資料列（預設 `2000`）。`cron.runLog.maxBytes` 僅為了相容於較舊的檔案式執行記錄而接受。

當排程強制建立新的隔離執行工作階段時，它會在寫入新資料列之前清理先前的 `cron:<jobId>` 工作階段項目：它會帶入安全偏好設定（thinking/fast/verbose/reasoning 設定、標籤、顯示名稱）和明確由使用者選取的模型/驗證覆寫，但會丟棄環境對話上下文（頻道/群組路由、傳送/佇列政策、提升權限、來源、ACP 執行階段繫結），因此新的隔離執行無法從較舊執行繼承過時的傳遞或執行階段權限。

## 工作階段鍵（`sessionKey`）

`sessionKey` 識別你所在的對話桶（路由 + 隔離）。典範規則：[/concepts/session](/zh-TW/concepts/session)。

| 模式                      | 範例                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| 主要/直接聊天（每個代理程式） | `agent:<agentId>:<mainKey>`（預設 `main`）                |
| 群組                        | `agent:<agentId>:<channel>:group:<id>`                      |
| 房間/頻道（Discord/Slack） | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| 排程                         | `cron:<job.id>`                                             |
| 網路鉤子                      | `hook:<uuid>`（除非被覆寫）                           |

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（延續對話的轉錄檔案）。決策邏輯位於 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為閘道主機本地時間上午 4:00）會在重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes`，或舊版 `session.idleMinutes`）會在閒置時段後收到訊息時建立新的 `sessionId`。如果同時設定每日和閒置，先到期者勝出。
- **Control UI 重新連線續接**會在閘道從操作員 UI 用戶端收到相符的 `sessionId` 時，為一次重新連線傳送保留目前可見的工作階段。這是一次性訊號；一般過時傳送仍會建立新的 `sessionId`。
- **系統事件**（心跳偵測、排程喚醒、exec 通知、閘道記帳）可能會變更工作階段資料列，但絕不會延長每日/閒置重設的新鮮度。重設輪替會在建置新提示之前，丟棄上一個工作階段已排隊的系統事件通知。
- **父分支分岔政策**在建立執行緒或子代理程式分岔時使用 OpenClaw 的作用中分支。如果該分支太大（超過固定內部上限，目前為 100K 權杖），OpenClaw 會以隔離上下文啟動子項，而不是失敗或繼承無法使用的歷史。大小判定是自動的且不可設定；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。

## 工作階段儲存區結構描述（`sessions.json`）

值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。主要欄位（非完整清單）：

- `sessionId`：目前的轉錄稿 id（除非設定了 `sessionFile`，否則檔名會由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設新鮮度會使用它。舊版列可能會從 JSONL 工作階段標頭衍生此值。
- `lastInteractionAt`：最後一次真實使用者/頻道互動時間戳；閒置重設新鮮度會使用它，因此心跳偵測、排程和 exec 事件不會讓工作階段保持存活。沒有此欄位的舊版列會退回使用復原出的工作階段開始時間。
- `updatedAt`：最後一次儲存列變更時間戳，用於列出/修剪/簿記，而不是每日/閒置新鮮度的權威來源。
- `archivedAt`：選用的封存時間戳。已封存工作階段會保留在儲存區中，轉錄稿保持完整，並會從一般作用中清單排除。
- `pinnedAt`：選用的釘選時間戳。作用中的已釘選工作階段會排在未釘選工作階段之前；封存工作階段會清除其釘選。
- Codex 執行緒互通：兩個欄位都遵循 Codex 執行緒管理形狀；線路上的 `archived`/`pinned` 布林值一律從時間戳衍生，並在伺服器端加戳，符合 Codex `threads.archived_at` 語意和 camelCase 序列化。OpenClaw 時間戳是 epoch 毫秒，而 Codex 使用 epoch 秒，因此橋接會在 codex 外掛邊界轉換。Codex 目前尚無釘選 API（只有 `thread/archive`/`thread/unarchive`）；釘選狀態會保留在 OpenClaw 端，直到該 API 存在，屆時相符的形狀可讓繫結工作階段以機械方式來回傳遞釘選狀態。
- `sessionFile`：選用的明確轉錄稿路徑覆寫
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群組/頻道標籤中繼資料
- 切換項：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（每個工作階段覆寫）
- 模型選擇：`providerOverride`、`modelOverride`、`authProfileOverride`
- Token 計數器（盡力而為/依供應商而定）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵已完成自動壓縮的次數
- `memoryFlushAt` / `memoryFlushCompactionCount`：上次壓縮前記憶體清出作業的時間戳與壓縮次數

儲存區可以安全編輯，但閘道才是權威來源：工作階段執行時，它可能會重寫或重新補水項目。

## 轉錄稿結構（`*.jsonl`）

轉錄稿由 `SessionManager`（`openclaw/plugin-sdk/agent-sessions`）管理。檔案是 JSONL：

- 第一行：工作階段標頭 - `type: "session"`、`id`、`cwd`、`timestamp`、選用的 `parentSession`。
- 接著：含有 `id` + `parentId` 的項目（樹狀結構）。

值得注意的項目類型：

- `message`：使用者/助理/toolResult 訊息
- `custom_message`：外掛注入的訊息，_會_ 進入模型上下文（當 `display: true` 時在終端介面中呈現，當 `display: false` 時完全隱藏）
- `custom`：_不會_ 進入模型上下文的外掛狀態（用於跨重新載入持久保存外掛狀態）
- `compaction`：持久保存的壓縮摘要，含有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：瀏覽樹狀分支時持久保存的摘要

OpenClaw 刻意不會「修補」轉錄稿；閘道使用 `SessionManager` 讀寫它們。

## 上下文視窗與追蹤的 token

兩個不同概念：

1. **模型上下文視窗**：每個模型的硬性上限（模型可見的 token）。來自模型目錄，並可透過設定覆寫。
2. **工作階段儲存區計數器**：寫入 `sessions.json` 的滾動統計（用於 `/status` 和儀表板）。`contextTokens` 是執行階段估算/報告值，不要將它視為嚴格保證。

更多限制資訊：[/reference/token-use](/zh-TW/reference/token-use)。

## 壓縮：它是什麼

壓縮會將較舊的對話摘要成轉錄稿中持久保存的 `compaction` 項目，並保留最近訊息不變。壓縮後，未來回合會看到壓縮摘要，以及 `firstKeptEntryId` 之後的訊息。壓縮是**持久的**，不同於工作階段修剪；請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

壓縮後重新注入 AGENTS.md 區段是透過 `agents.defaults.compaction.postCompactionSections` 選擇啟用；未設定或為 `[]` 時，OpenClaw 不會在壓縮摘要之上附加 AGENTS.md 摘錄。

### 區塊邊界與工具配對

將長轉錄稿切分為壓縮區塊時，OpenClaw 會讓助理工具呼叫與其相符的 `toolResult` 項目保持配對：

- 如果 token 份額切分點會落在工具呼叫和其結果之間，OpenClaw 會將邊界移到助理工具呼叫訊息，而不是分離該配對。
- 如果尾端工具結果區塊原本會讓區塊超過目標，OpenClaw 會保留該待處理工具區塊，並讓未摘要的尾端保持完整。
- 已中止/錯誤的工具呼叫區塊不會讓待處理切分保持開啟。

## 自動壓縮何時發生

內嵌 OpenClaw agent 中有兩個觸發條件：

1. **溢位復原**：模型傳回上下文溢位錯誤（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`，以及其他供應商形狀的變體）- 壓縮，然後重試。當供應商回報嘗試的 token 數時，OpenClaw 會將該觀察到的數量轉送至溢位復原壓縮；如果供應商確認溢位但未暴露可解析的數量，OpenClaw 會將略微超出預算的合成數量傳給壓縮引擎和診斷。如果溢位復原仍失敗，OpenClaw 會顯示明確指引，並保留目前工作階段對應，而不是默默輪替到新的工作階段 id；請重試訊息、執行 `/compact`，或執行 `/new`。
2. **閾值維護**：成功回合後，當 `contextTokens > contextWindow - reserveTokens`，其中 `contextWindow` 是模型的上下文視窗，而 `reserveTokens` 是為提示加上下一個模型輸出保留的餘裕。

這兩個觸發條件之外，還會執行兩個額外防護：

- **預檢本機壓縮**：設定 `agents.defaults.compaction.maxActiveTranscriptBytes`（位元組或像 `"20mb"` 這樣的字串），在作用中轉錄稿檔案達到該大小後、開啟下一次執行前觸發本機壓縮。這是針對本機重新開啟成本的檔案大小防護，不是原始封存；一般語意壓縮仍會執行，且它需要 `truncateAfterCompaction`，讓壓縮後摘要成為新的後繼轉錄稿。
- **回合中預檢**：設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（預設 `false`）以加入工具迴圈防護。工具結果附加後、下一次模型呼叫前，OpenClaw 會使用與回合開始時相同的預檢預算邏輯來估算提示壓力。如果上下文不再容納得下，防護不會內聯壓縮，而是引發結構化的回合中預檢訊號，停止目前提示提交，並讓外層執行迴圈使用既有復原路徑（當那已足夠時截斷過大的工具結果，或觸發已設定的壓縮模式並重試）。可與 `default` 和 `safeguard` 壓縮模式搭配運作，包括供應商支援的 safeguard 壓縮。獨立於 `maxActiveTranscriptBytes`：位元組大小防護會在回合開啟前執行，回合中預檢則稍後在新工具結果附加後執行。

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

OpenClaw 也會針對內嵌執行強制執行安全下限：如果 `compaction.reserveTokens` 低於 `reserveTokensFloor`（預設 `20000`），OpenClaw 會將它提高。設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用下限。當作用中模型上下文視窗已知時，下限和最終有效保留量都會設上限，避免保留量吃掉整個提示預算。這可避免小上下文模型（例如 16K-token 本機模型）從第一個 token 就進入壓縮；若沒有已知上下文視窗，已設定和目前保留預算會維持不設上限。為何需要下限：在壓縮變得不可避免之前，為多回合「內務處理」（例如下方的記憶體清出）留下足夠餘裕。實作：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`，由內嵌執行器回合和壓縮設定路徑呼叫。

手動 `/compact` 會遵守明確的 `agents.defaults.compaction.keepRecentTokens`，並保留執行階段的最近尾端切點。若沒有明確保留預算，手動壓縮就是硬性檢查點，重建後的上下文會從新摘要開始。

啟用 `truncateAfterCompaction` 時，OpenClaw 會在壓縮後將作用中轉錄稿輪替為壓縮後的後繼 JSONL。分支/還原檢查點動作會使用該壓縮後後繼；舊版壓縮前檢查點檔案在被參照時仍可讀取。

## 可插拔壓縮供應商

外掛會透過外掛 API 上的 `registerCompactionProvider()` 註冊壓縮供應商。當 `agents.defaults.compaction.provider` 設為已註冊的供應商 id 時，safeguard 擴充會將摘要委派給該供應商，而不是內建的 `summarizeInStages` 管線。

- `provider`：已註冊壓縮供應商外掛的 id。未設定時使用預設 LLM 摘要。設定 `provider` 會強制 `mode: "safeguard"`。
- 供應商會收到與內建路徑相同的壓縮指示和識別碼保留政策，且 safeguard 仍會在供應商輸出後保留最近回合和切分回合的後綴上下文。
- 內建 safeguard 摘要會用新訊息重新蒸餾先前摘要，而不是逐字保留完整的上一份摘要。
- Safeguard 模式預設會啟用摘要品質稽核；設定 `qualityGuard.enabled: false` 可略過輸出格式錯誤時重試的行為。
- 如果供應商失敗或傳回空結果，OpenClaw 會自動退回使用內建 LLM 摘要。呼叫端明確觸發的中止/逾時訊號會重新拋出，而不是被吞掉，因此取消一律會受到尊重。

來源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 使用者可見表面

- 任何聊天工作階段中的 `/status`
- `openclaw status`（命令列介面）
- `openclaw sessions` / `openclaw sessions --json`
- 閘道記錄（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細模式：`🧹 Auto-compaction complete` 加上壓縮次數

## 靜默內務處理（`NO_REPLY`）

OpenClaw 支援背景工作的「靜默」回合，使用者不應看到中間輸出。

- 助理會以精確靜默 token `NO_REPLY` / `no_reply` 開始其輸出，表示「不要向使用者送出回覆」。OpenClaw 會在傳遞層剝除/抑制它。
- 精確靜默 token 抑制不區分大小寫：當整個承載只是靜默 token 時，`NO_REPLY` 和 `no_reply` 都會計入。
- 自 `2026.1.10` 起，當部分區塊以 `NO_REPLY` 開頭時，OpenClaw 也會抑制草稿/輸入中串流，因此靜默作業不會在回合中途洩漏部分輸出。
- 這只適用於真正的背景/不傳遞回合，不是一般可執行使用者請求的捷徑。

## 壓縮前記憶體清出

自動壓縮發生前，OpenClaw 可以執行一個靜默 agentic 回合，將持久狀態寫入磁碟（例如 agent 工作區中的 `memory/YYYY-MM-DD.md`），讓壓縮無法抹除關鍵上下文。它會監控工作階段上下文用量，一旦跨過低於壓縮閾值的軟性閾值，就使用精確靜默 token `NO_REPLY` / `no_reply` 傳送靜默「立即寫入記憶體」指令，因此使用者不會看到任何內容。

設定（`agents.defaults.compaction.memoryFlush`），完整參考見 [/gateway/config-agents](/zh-TW/gateway/config-agents#agentsdefaultscompaction)：

| 鍵                          | 預設值           | 備註                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未設定           | 僅用於寫入回合的精確 provider/model 覆寫，例如 `ollama/qwen3:8b`                                                                       |
| `softThresholdTokens`       | `4000`           | 低於壓縮閾值並會觸發寫入的間距                                                                                                        |
| `forceFlushTranscriptBytes` | 未設定（已停用） | 一旦逐字稿檔案達到此位元組大小（或像 `"2mb"` 這樣的字串），即使 token 計數器已過期也強制寫入；`0` 會停用 |
| `prompt`                    | 內建             | 寫入回合的使用者訊息                                                                                                                  |
| `systemPrompt`              | 內建             | 附加到寫入回合的額外系統提示                                                                                                          |

備註：

- 預設提示/系統提示包含 `NO_REPLY` 提示，用來抑制傳遞。
- 設定 `model` 時，寫入回合會使用該模型，而不會繼承作用中工作階段的後備鏈，因此僅限本機的內務處理不會在失敗時默默後備到付費對話模型。
- 每個壓縮週期只會執行一次寫入（在 `sessions.json` 中追蹤）。
- 寫入只會針對嵌入式 OpenClaw 工作階段執行；命令列介面後端和心跳偵測回合會略過。
- 當工作階段工作區為唯讀（`workspaceAccess: "ro"` 或 `"none"`）時，會略過寫入。
- 請參閱 [記憶](/zh-TW/concepts/memory)，了解工作區檔案配置和寫入模式。

OpenClaw 在擴充 API 中公開 `session_before_compact` hook，但上述寫入邏輯位於閘道端（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），而不是該 hook 上。

## 疑難排解檢查清單

- **工作階段鍵錯誤？** 從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- **儲存區與逐字稿不一致？** 從 `openclaw status` 確認閘道主機和儲存區路徑。
- **壓縮洗版？** 檢查模型的上下文視窗（太小會迫使頻繁壓縮）、`reserveTokens`（相對於模型視窗太高會導致較早壓縮），以及工具結果膨脹（調整工作階段修剪）。
- **在小型本機模型上，每個提示似乎都會溢出？** 確認提供者回報正確的模型上下文視窗。OpenClaw 只有在知道該視窗時，才能限制有效保留量。
- **靜默回合外洩？** 確認回覆以精確的靜默 token `NO_REPLY` 開頭（不區分大小寫），且你使用的組建包含串流抑制修正（`2026.1.10`+）。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [上下文引擎](/zh-TW/concepts/context-engine)
- [Agent 設定參考](/zh-TW/gateway/config-agents)
