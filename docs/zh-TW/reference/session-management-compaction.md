---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿 JSONL 或 sessions.json 欄位
    - 你正在變更自動壓縮行為，或新增「預先壓縮」清理工作
    - 你想實作記憶清除或靜默系統回合
summary: 深入探討：工作階段儲存區與逐字稿、生命週期，以及（自動）壓縮內部機制
title: 工作階段管理深入解析
x-i18n:
    generated_at: "2026-07-05T11:41:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ec602a2d21f32a058500fe6d25f91c06e53582c4e028042d331a6c96355fcb
    source_path: reference/session-management-compaction.md
    workflow: 16
---

單一**閘道程序**端對端擁有工作階段狀態。UI（macOS app、網頁控制 UI、終端介面）會向閘道查詢工作階段清單與權杖數。在遠端模式中，工作階段檔案位於遠端主機上，因此檢查你本機 Mac 的檔案不會反映閘道正在使用的內容。

請先閱讀概觀文件：[工作階段管理](/zh-TW/concepts/session)、[壓縮](/zh-TW/concepts/compaction)、[記憶概觀](/zh-TW/concepts/memory)、[記憶搜尋](/zh-TW/concepts/memory-search)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[轉錄衛生](/zh-TW/reference/transcript-hygiene)，完整設定參考請見[代理程式設定](/zh-TW/gateway/config-agents)。

## 兩個持久化層

1. **工作階段存放區 (`sessions.json`)** - 鍵/值對應表 `sessionKey -> SessionEntry`。小型、可變、可安全編輯或刪除項目。追蹤中繼資料：目前工作階段 ID、最後活動時間、切換設定、權杖計數器。
2. **轉錄 (`<sessionId>.jsonl`)** - 僅追加、樹狀結構（項目具有 `id` + `parentId`）。儲存對話、工具呼叫與壓縮摘要；為未來回合重建模型上下文。壓縮檢查點是壓縮後繼轉錄上的中繼資料 - 新的壓縮不會寫入第二份 `.checkpoint.*.jsonl` 複本。

閘道歷史讀取器會避免具體化整份轉錄，除非該介面需要任意歷史存取。第一頁歷史、嵌入式聊天歷史、重新啟動復原，以及權杖/用量檢查都使用有界尾端讀取。完整轉錄掃描會經由非同步轉錄索引，依檔案路徑加上 `mtimeMs`/`size` 快取，並在並行讀取器之間共用。

## 磁碟位置

每個代理程式在閘道主機上（透過 `src/config/sessions.ts` 解析）：

- 存放區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 轉錄：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

## 存放區維護與磁碟控制

`session.maintenance` 控制 `sessions.json`、轉錄成品與軌跡 sidecar 的自動維護：

| 鍵                      | 預設值                | 備註                                                                              |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | 或 `"warn"`（僅回報，不變更）                                                     |
| `pruneAfter`            | `"30d"`               | 過期項目年齡截止點                                                                |
| `maxEntries`            | `500`                 | `sessions.json` 中的項目上限                                                      |
| `resetArchiveRetention` | 與 `pruneAfter` 相同  | `*.reset.<timestamp>` 轉錄封存的保留期；`false` 會停用清理                        |
| `maxDiskBytes`          | 未設定                | 選用的工作階段目錄預算                                                            |
| `highWaterBytes`        | `maxDiskBytes` 的 80% | 預算清理後的目標                                                                  |

閘道模型執行探測工作階段（符合 `agent:*:explicit:model-run-<uuid>` 的鍵）有獨立、固定的 `24h` 保留期。此修剪受壓力門檻控制：只有在達到工作階段項目維護/上限壓力時才會執行，且只會在全域過期項目清理/上限步驟之前執行。其他明確工作階段不使用此保留期。

磁碟預算清理的強制執行順序（`mode: "enforce"`）：

1. 先移除最舊的已封存、孤立轉錄或孤立軌跡成品。
2. 若仍高於目標，逐出最舊的工作階段項目及其轉錄/軌跡檔案。
3. 重複直到用量等於或低於 `highWaterBytes`。

`mode: "warn"` 會回報可能逐出的項目，但不會變更存放區或檔案。

隨需執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

維護會保留耐久的外部對話指標，例如群組工作階段與執行緒範圍聊天工作階段，但合成執行階段項目（排程、hooks、心跳偵測、ACP、子代理程式）一旦超過設定的年齡、數量或磁碟預算，仍可能被移除。隔離的排程執行使用獨立的 `cron.sessionRetention` 控制，與模型執行探測保留期無關。

一般閘道寫入會流經每個存放區的工作階段寫入器，該寫入器會序列化程序內變更，而不取得執行階段檔案鎖。熱門路徑修補輔助工具會在持有該寫入器槽位時借用已驗證的可變快取，因此大型 `sessions.json` 檔案不會因每次中繼資料更新而被複製或重新讀取。在執行階段程式碼中偏好使用 `updateSessionStore(...)` / `updateSessionStoreEntry(...)`；直接儲存整個存放區是為了相容性與離線維護工具。當閘道可連線時，非空跑的 `openclaw sessions cleanup` 與 `openclaw agents delete` 會將存放區變更委派給閘道，讓清理加入同一個寫入器佇列；`--store <path>` 是直接檔案維護的明確離線修復路徑，且一律維持本機處理（`--dry-run` 也是如此）。`maxEntries` 清理會針對生產規模存放區分批執行，因此存放區可能會短暫超過設定上限，直到下一次高水位清理將其重寫降下來。讀取在閘道啟動期間絕不修剪項目或套用上限 - 只有寫入或 `openclaw sessions cleanup --enforce` 會這麼做，而後者也會立即套用上限，並在未設定磁碟預算時仍修剪舊的未參照轉錄、檢查點與軌跡成品。

OpenClaw 不再於閘道寫入期間建立自動 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，且 `openclaw doctor --fix` 會從較舊設定中移除它。

轉錄變更會在轉錄檔案上使用工作階段寫入鎖：

| 設定                                 | 預設值    | 環境變數覆寫                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` 是鎖等待在放棄前顯示工作階段忙碌錯誤的時長；只有在合法準備、清理、壓縮或轉錄鏡像工作於慢速機器上競爭更久時才提高它。`staleMs` 是既有鎖可被回收為過期的時間。`maxHoldMs` 是程序內看門狗釋放閾值。

## 排程工作階段與執行記錄

隔離的排程執行會建立自己的工作階段項目/轉錄，並有專用保留期：

- `cron.sessionRetention`（預設 `"24h"`）會從存放區修剪舊的隔離排程執行工作階段；`false` 會停用。
- `cron.runLog.keepLines` 會依每個排程作業修剪保留的 SQLite 執行歷史列（預設 `2000`）。`cron.runLog.maxBytes` 只為了與較舊的檔案式執行記錄相容而接受。

當排程強制建立新的隔離執行工作階段時，它會在寫入新列之前清理先前的 `cron:<jobId>` 工作階段項目：它會攜帶安全偏好設定（思考/快速/詳細/推理設定、標籤、顯示名稱）以及明確由使用者選取的模型/驗證覆寫，但會捨棄環境對話上下文（頻道/群組路由、傳送/佇列政策、提升、來源、ACP 執行階段繫結），因此全新的隔離執行不會從較舊執行繼承過期的傳遞或執行階段權限。

## 工作階段鍵（`sessionKey`）

`sessionKey` 會識別你所在的對話桶（路由 + 隔離）。標準規則：[/concepts/session](/zh-TW/concepts/session)。

| 模式                         | 範例                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| 主要/直接聊天（每個代理程式） | `agent:<agentId>:<mainKey>`（預設 `main`）                  |
| 群組                         | `agent:<agentId>:<channel>:group:<id>`                      |
| 房間/頻道（Discord/Slack）   | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| 排程                         | `cron:<job.id>`                                             |
| 網路鉤子                     | `hook:<uuid>`（除非被覆寫）                                |

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 指向目前的 `sessionId`（延續對話的轉錄檔）。決策邏輯位於 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為閘道主機本機時間上午 4:00）會在重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes`，或舊版 `session.idleMinutes`）會在閒置視窗後收到訊息時建立新的 `sessionId`。若每日與閒置都已設定，先到期者生效。
- **控制 UI 重新連線續用**會在閘道從操作員 UI 用戶端收到相符的 `sessionId` 時，為一次重新連線傳送保留目前可見的工作階段。這是一次性訊號；一般過期傳送仍會建立新的 `sessionId`。
- **系統事件**（心跳偵測、排程喚醒、exec 通知、閘道簿記）可能會變更工作階段列，但絕不延長每日/閒置重設的新鮮度。重設輪替會在建立新提示前丟棄前一個工作階段已排入佇列的系統事件通知。
- **父分支分叉政策**在建立執行緒或子代理程式分叉時使用 OpenClaw 的作用中分支。如果該分支太大（超過固定內部上限，目前為 100K 權杖），OpenClaw 會以隔離上下文啟動子項，而不是失敗或繼承無法使用的歷史。大小判定是自動且不可設定的；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。

## 工作階段存放區結構描述（`sessions.json`）

值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。關鍵欄位（非完整清單）：

- `sessionId`：目前的逐字稿 id（除非已設定 `sessionFile`，否則檔名會由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設新鮮度會使用此值。舊版資料列可能會從 JSONL 工作階段標頭衍生此值。
- `lastInteractionAt`：最後一次真實使用者/頻道互動時間戳；閒置重設新鮮度會使用此值，因此心跳偵測、排程和 exec 事件不會讓工作階段持續存活。沒有此欄位的舊版資料列會回退到復原出的工作階段開始時間。
- `updatedAt`：最後一次儲存資料列變更時間戳，用於列出/修剪/簿記 - 不是每日/閒置新鮮度的權威來源。
- `archivedAt`：選用的封存時間戳。已封存的工作階段會保留在儲存區中，逐字稿保持完整，並從一般作用中清單排除。
- `pinnedAt`：選用的釘選時間戳。作用中且已釘選的工作階段會排序在未釘選工作階段之前；封存工作階段會清除其釘選。
- Codex 執行緒互通：兩個欄位都遵循 Codex 執行緒管理形狀 - 線路上的 `archived`/`pinned` 布林值一律由時間戳衍生並在伺服器端加戳，符合 Codex `threads.archived_at` 語意和 camelCase 序列化。OpenClaw 時間戳是 epoch 毫秒，而 Codex 使用 epoch 秒，因此橋接會在 codex 外掛邊界轉換。Codex 目前還沒有釘選 API（只有 `thread/archive`/`thread/unarchive`）；釘選狀態會保留在 OpenClaw 端，直到相關 API 存在，屆時相符的形狀可讓繫結的工作階段以機械方式來回傳遞釘選狀態。
- `sessionFile`：選用的明確逐字稿路徑覆寫
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群組/頻道標籤中繼資料
- 切換項：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（每個工作階段覆寫）
- 模型選擇：`providerOverride`、`modelOverride`、`authProfileOverride`
- Token 計數器（盡力而為/取決於提供者）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵完成自動壓縮的次數
- `memoryFlushAt` / `memoryFlushCompactionCount`：上次壓縮前記憶體清除的時間戳與壓縮計數

儲存區可以安全編輯，但閘道才是權威來源：它可能會在工作階段執行時重寫或重新補水項目。

## 逐字稿結構（`*.jsonl`）

逐字稿由 `SessionManager`（`openclaw/plugin-sdk/agent-sessions`）管理。檔案是 JSONL：

- 第一行：工作階段標頭 - `type: "session"`、`id`、`cwd`、`timestamp`、選用的 `parentSession`。
- 接著：含 `id` + `parentId` 的項目（樹狀結構）。

值得注意的項目類型：

- `message`：使用者/助理/toolResult 訊息
- `custom_message`：由擴充功能注入、會進入模型脈絡的訊息（`display: true` 時會在終端介面中呈現，`display: false` 時完全隱藏）
- `custom`：不會進入模型脈絡的擴充功能狀態（用於跨重新載入持久化擴充功能狀態）
- `compaction`：持久化的壓縮摘要，含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：導覽樹狀分支時持久化的摘要

OpenClaw 有意不「修正」逐字稿；閘道使用 `SessionManager` 讀寫逐字稿。

## 脈絡視窗與追蹤 Token

兩個不同概念：

1. **模型脈絡視窗**：每個模型的硬性上限（模型可見的 token）。來自模型目錄，且可透過設定覆寫。
2. **工作階段儲存區計數器**：寫入 `sessions.json` 的滾動統計資料（用於 `/status` 和儀表板）。`contextTokens` 是執行階段估算/報告值 - 不要把它視為嚴格保證。

更多限制資訊：[/reference/token-use](/zh-TW/reference/token-use)。

## 壓縮：它是什麼

壓縮會將較舊的對話摘要成逐字稿中持久化的 `compaction` 項目，並保留近期訊息不變。壓縮後，後續回合會看到壓縮摘要加上 `firstKeptEntryId` 之後的訊息。壓縮是**持久化**的，不同於工作階段修剪 - 請見 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

壓縮後重新注入 AGENTS.md 區段是透過 `agents.defaults.compaction.postCompactionSections` 選擇加入；未設定或為 `[]` 時，OpenClaw 不會在壓縮摘要上附加 AGENTS.md 摘錄。

### 分塊邊界與工具配對

將長逐字稿切分成壓縮分塊時，OpenClaw 會讓助理工具呼叫與其相符的 `toolResult` 項目保持配對：

- 如果 token 份額切分點會落在工具呼叫與其結果之間，OpenClaw 會將邊界移到助理工具呼叫訊息，而不是拆開配對。
- 如果尾端工具結果區塊原本會讓分塊超過目標，OpenClaw 會保留該待處理工具區塊，並讓未摘要的尾端保持完整。
- 已中止/錯誤的工具呼叫區塊不會保持待處理切分開啟。

## 自動壓縮何時發生

嵌入式 OpenClaw 代理程式中有兩個觸發條件：

1. **溢位復原**：模型傳回脈絡溢位錯誤（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`，以及其他提供者形狀的變體）- 先壓縮，再重試。當提供者回報嘗試的 token 數時，OpenClaw 會把觀察到的數值轉交給溢位復原壓縮；如果提供者確認溢位但未公開可剖析的數值，OpenClaw 會把最低限度超出預算的合成數值傳給壓縮引擎和診斷。若溢位復原仍失敗，OpenClaw 會顯示明確指引並保留目前工作階段對應，而不是靜默輪替到新的工作階段 id - 請重試訊息、執行 `/compact`，或執行 `/new`。
2. **閾值維護**：成功完成一個回合後，當 `contextTokens > contextWindow - reserveTokens` 時，其中 `contextWindow` 是模型的脈絡視窗，`reserveTokens` 是為提示加上下一次模型輸出保留的餘裕。

另外兩個防護會在這兩個觸發條件之外執行：

- **預檢本機壓縮**：設定 `agents.defaults.compaction.maxActiveTranscriptBytes`（位元組，或像 `"20mb"` 的字串），在作用中逐字稿檔案達到該大小時，在開啟下一次執行前觸發本機壓縮。這是針對本機重新開啟成本的檔案大小防護，不是原始封存 - 一般語意壓縮仍會執行，且需要 `truncateAfterCompaction`，讓壓縮後摘要成為新的後繼逐字稿。
- **回合中預檢**：設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（預設為 `false`）以加入工具迴圈防護。在附加工具結果之後、下一次模型呼叫之前，OpenClaw 會使用與回合開始時相同的預檢預算邏輯估算提示壓力。如果脈絡已無法容納，防護不會內聯壓縮 - 它會發出結構化的回合中預檢訊號、停止目前提示提交，並讓外層執行迴圈使用既有復原路徑（當截斷過大的工具結果就足夠時執行截斷，或觸發已設定的壓縮模式並重試）。適用於 `default` 和 `safeguard` 壓縮模式，包括由提供者支援的 safeguard 壓縮。獨立於 `maxActiveTranscriptBytes`：位元組大小防護會在回合開啟前執行，回合中預檢則稍後在附加新工具結果後執行。

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

OpenClaw 也會針對嵌入式執行強制安全下限：如果 `compaction.reserveTokens` 低於 `reserveTokensFloor`（預設 `20000`），OpenClaw 會將它提高；如果已經更高，則保持不變。設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用下限。下限本身會自動封頂到模型脈絡視窗的安全比例，因此小脈絡模型（例如 16K-token 本機模型）不會被剝奪提示預算 - 若沒有該封頂，預設 20000-token 下限可能超過整個視窗，讓每個提示都進入溢位壓縮迴圈。為什麼需要下限：在壓縮變得不可避免之前，為多回合「內務處理」（例如下方的記憶體清除）留下足夠餘裕。實作：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`，由嵌入式執行器回合和壓縮設定路徑呼叫。

手動 `/compact` 會遵循明確的 `agents.defaults.compaction.keepRecentTokens`，並保留執行階段的近期尾端切點。若沒有明確保留預算，手動壓縮就是硬性檢查點，重建後的脈絡會從新摘要開始。

啟用 `truncateAfterCompaction` 時，OpenClaw 會在壓縮後將作用中逐字稿輪替成壓縮後的後繼 JSONL。分支/還原檢查點動作會使用該壓縮後後繼；舊版壓縮前檢查點檔案在被參照時仍可讀取。

## 可插拔壓縮提供者

外掛透過外掛 API 上的 `registerCompactionProvider()` 註冊壓縮提供者。當 `agents.defaults.compaction.provider` 設為已註冊的提供者 id 時，safeguard 擴充功能會將摘要委派給該提供者，而不是內建的 `summarizeInStages` 管線。

- `provider`：已註冊壓縮提供者外掛的 id。未設定則使用預設 LLM 摘要。設定 `provider` 會強制 `mode: "safeguard"`。
- 提供者會接收與內建路徑相同的壓縮指令和識別碼保留政策，且 safeguard 仍會在提供者輸出後保留近期回合和分割回合後綴脈絡。
- 內建 safeguard 摘要會用新訊息重新萃取先前摘要，而不是逐字保留完整的先前摘要。
- Safeguard 模式預設會啟用摘要品質稽核；設定 `qualityGuard.enabled: false` 可略過格式錯誤輸出時重試的行為。
- 如果提供者失敗或傳回空結果，OpenClaw 會自動回退到內建 LLM 摘要。呼叫端明確觸發的中止/逾時訊號會重新拋出，而不會被吞掉，因此取消一律會受到尊重。

來源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 使用者可見介面

- 任何聊天工作階段中的 `/status`
- `openclaw status`（命令列介面）
- `openclaw sessions` / `openclaw sessions --json`
- 閘道記錄（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細模式：`🧹 Auto-compaction complete` 加上壓縮計數

## 靜默內務處理（`NO_REPLY`）

OpenClaw 支援背景任務的「靜默」回合，使用者不應看到中間輸出。

- 助理以精確靜默 token `NO_REPLY` / `no_reply` 開始其輸出，表示「不要向使用者傳遞回覆」。OpenClaw 會在傳遞層移除/抑制此內容。
- 精確靜默 token 抑制不區分大小寫：當整個承載內容只有靜默 token 時，`NO_REPLY` 和 `no_reply` 都算數。
- 自 `2026.1.10` 起，OpenClaw 也會在部分區塊以 `NO_REPLY` 開頭時抑制草稿/輸入串流，因此靜默作業不會在回合中途洩漏部分輸出。
- 這只適用於真正的背景/不傳遞回合 - 不是一般可執行使用者請求的捷徑。

## 壓縮前記憶體清除

自動壓縮發生前，OpenClaw 可以執行一個靜默的代理式回合，將持久狀態寫入磁碟（例如代理程式工作區中的 `memory/YYYY-MM-DD.md`），讓壓縮無法抹除關鍵脈絡。它會監控工作階段脈絡使用量，一旦跨過低於壓縮閾值的軟性閾值，就會使用精確靜默 token `NO_REPLY` / `no_reply` 傳送靜默「立即寫入記憶」指令，讓使用者看不到任何內容。

Config (`agents.defaults.compaction.memoryFlush`)，完整參考位於 [/gateway/config-agents](/zh-TW/gateway/config-agents#agentsdefaultscompaction)：

| 鍵                          | 預設值           | 備註                                                                                                                                      |
| --------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                           |
| `model`                     | 未設定           | 僅用於清理回合的確切提供者/模型覆寫，例如 `ollama/qwen3:8b`                                                                               |
| `softThresholdTokens`       | `4000`           | 低於壓縮閾值且會觸發清理的差距                                                                                                           |
| `forceFlushTranscriptBytes` | 未設定（停用）   | 一旦逐字稿檔案達到此位元組大小（或像 `"2mb"` 這樣的字串）就強制清理，即使 token 計數器已過期；`0` 會停用                                |
| `prompt`                    | 內建             | 清理回合的使用者訊息                                                                                                                      |
| `systemPrompt`              | 內建             | 為清理回合附加的額外系統提示                                                                                                              |

備註：

- 預設提示/系統提示包含 `NO_REPLY` 提示，用於抑制傳送。
- 設定 `model` 時，清理回合會使用該模型，而不繼承作用中工作階段的後援鏈，因此僅限本機的內務處理不會在失敗時無聲地退回到付費對話模型。
- 每個壓縮週期只會執行一次清理（在 `sessions.json` 中追蹤）。
- 清理只會針對嵌入式 OpenClaw 工作階段執行；命令列介面後端和心跳偵測回合會略過它。
- 當工作階段工作區為唯讀（`workspaceAccess: "ro"` 或 `"none"`）時，會略過清理。
- 請參閱 [記憶](/zh-TW/concepts/memory) 以了解工作區檔案配置和寫入模式。

OpenClaw 在擴充功能 API 中公開 `session_before_compact` 鉤子，但上述清理邏輯位於閘道端（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），而不是位於該鉤子上。

## 疑難排解檢查清單

- **工作階段鍵錯誤？** 從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- **儲存區與逐字稿不相符？** 從 `openclaw status` 確認閘道主機和儲存區路徑。
- **壓縮過於頻繁？** 檢查模型的上下文視窗（太小會強制頻繁壓縮）、`reserveTokens`（相對於模型視窗太高會導致更早壓縮），以及工具結果膨脹（調整工作階段修剪）。
- **在小型本機模型上，每個提示似乎都會溢位？** `reserveTokensFloor` 預設值（20000）會自動限制為上下文視窗的安全比例，但若明確設定的 `reserveTokens` 高於視窗本身，則不會被限制 - 請降低它或取消設定。
- **靜默回合外洩？** 確認回覆以確切的靜默 token `NO_REPLY` 開頭（不區分大小寫），且你使用的建置包含串流抑制修正（`2026.1.10`+）。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [上下文引擎](/zh-TW/concepts/context-engine)
- [代理程式設定參考](/zh-TW/gateway/config-agents)
