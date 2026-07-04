---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿 JSONL，或 sessions.json 欄位
    - 你正在變更自動壓縮行為或新增「壓縮前」維護作業
    - 你想實作記憶清空或靜默系統回合
summary: 深入探討：工作階段儲存區與文字記錄、生命週期，以及（自動）壓縮內部機制
title: 工作階段管理深入探討
x-i18n:
    generated_at: "2026-07-04T20:25:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 會在這些領域端對端管理工作階段：

- **工作階段路由**（傳入訊息如何對應到 `sessionKey`）
- **工作階段儲存區**（`sessions.json`）及其追蹤內容
- **逐字稿持久化**（`*.jsonl`）及其結構
- **逐字稿衛生處理**（執行前的供應商特定修正）
- **上下文限制**（上下文視窗與已追蹤權杖）
- **壓縮**（手動與自動壓縮）以及要在哪裡掛接壓縮前工作
- **靜默整理**（不應產生使用者可見輸出的記憶寫入）

如果你想先看較高層次的概覽，請從這裡開始：

- [工作階段管理](/zh-TW/concepts/session)
- [壓縮](/zh-TW/concepts/compaction)
- [記憶概覽](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [逐字稿衛生處理](/zh-TW/reference/transcript-hygiene)

---

## 真實來源：閘道

OpenClaw 是圍繞單一擁有工作階段狀態的**閘道程序**設計的。

- UI（macOS app、網頁 Control UI、終端介面）應向閘道查詢工作階段清單與權杖數量。
- 在遠端模式中，工作階段檔案位於遠端主機；「檢查你的本機 Mac 檔案」不會反映閘道正在使用的內容。

---

## 兩個持久化層

OpenClaw 會在兩個層級持久化工作階段：

1. **工作階段儲存區（`sessions.json`）**
   - 鍵/值對應：`sessionKey -> SessionEntry`
   - 小型、可變、可安全編輯（或刪除項目）
   - 追蹤工作階段中繼資料（目前工作階段 ID、最後活動時間、切換設定、權杖計數器等）

2. **逐字稿（`<sessionId>.jsonl`）**
   - 具樹狀結構的僅附加逐字稿（項目具有 `id` + `parentId`）
   - 儲存實際對話 + 工具呼叫 + 壓縮摘要
   - 用於重建未來回合的模型上下文
   - 壓縮檢查點是壓縮後後繼逐字稿上的中繼資料。新的壓縮不會寫入第二份 `.checkpoint.*.jsonl` 複本。

除非介面明確需要任意歷史存取，閘道歷史讀取器應避免將整個逐字稿實體化。第一頁歷史、嵌入式聊天歷史、重新啟動復原，以及權杖/用量檢查，都使用有界的尾端讀取。完整逐字稿掃描會透過非同步逐字稿索引進行；該索引依檔案路徑加上 `mtimeMs`/`size` 快取，並在並行讀取器之間共享。

---

## 磁碟位置

每個代理在閘道主機上的位置：

- 儲存區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 逐字稿：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 會透過 `src/config/sessions.ts` 解析這些位置。

---

## 儲存區維護與磁碟控制

工作階段持久化具有自動維護控制（`session.maintenance`），用於 `sessions.json`、逐字稿成品與軌跡 sidecar：

- `mode`：`enforce`（預設）或 `warn`
- `pruneAfter`：過期項目的年齡截止值（預設 `30d`）
- `maxEntries`：`sessions.json` 中的項目上限（預設 `500`）
- 短生命週期的閘道模型執行探測保留時間固定為 `24h`，但它受壓力門檻控制：只有在達到工作階段項目維護/上限壓力時，才會移除過期的嚴格探測資料列。這只適用於符合 `agent:*:explicit:model-run-<uuid>` 的嚴格明確探測鍵，並且在執行時會先於全域過期項目清理/封頂執行。
- `resetArchiveRetention`：`*.reset.<timestamp>` 逐字稿封存的保留時間（預設：與 `pruneAfter` 相同；`false` 停用清理）
- `maxDiskBytes`：可選的工作階段目錄預算
- `highWaterBytes`：清理後的可選目標（預設為 `maxDiskBytes` 的 `80%`）

一般閘道寫入會透過每個儲存區的工作階段寫入器流動，該寫入器會序列化程序內突變，而不取得執行時檔案鎖。熱路徑修補輔助程式會在持有該寫入器槽位時借用已驗證的可變快取，因此大型 `sessions.json` 檔案不會為每次中繼資料更新而被複製或重新讀取。執行時程式碼應優先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`；直接儲存整個儲存區是相容性與離線維護工具。當閘道可連線時，非 dry-run 的 `openclaw sessions cleanup` 和 `openclaw agents delete` 會將儲存區突變委派給閘道，讓清理加入同一個寫入器佇列；`--store <path>` 是直接檔案維護的明確離線修復路徑。`maxEntries` 清理仍會針對生產規模上限分批執行，因此儲存區可能會短暫超過設定上限，直到下一次高水位清理將其重寫降回上限。工作階段儲存區讀取不會在閘道啟動期間修剪或封頂項目；請使用寫入或 `openclaw sessions cleanup --enforce` 進行清理。即使未設定磁碟預算，`openclaw sessions cleanup --enforce` 仍會立即套用設定的上限，並修剪舊的未參照逐字稿、檢查點與軌跡成品。

維護會保留持久的外部對話指標，例如群組工作階段與執行緒範圍聊天工作階段，但排程、hooks、心跳偵測、ACP 與子代理的合成執行時項目，在超過設定的年齡、數量或磁碟預算時仍可能被移除。閘道模型執行探測工作階段只有在其鍵完全符合 `agent:*:explicit:model-run-<uuid>` 時，才會使用獨立的 `24h` 模型執行保留時間；其他明確工作階段不屬於該保留機制。模型執行清理只會在工作階段項目上限壓力下套用。隔離的排程執行會保留自己的 `cron.sessionRetention` 控制，獨立於模型執行探測保留時間。

OpenClaw 不再於閘道寫入期間建立自動 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，且 `openclaw doctor --fix` 會從較舊設定中移除它。

逐字稿突變會在逐字稿檔案上使用工作階段寫入鎖。鎖取得會等待最多 `session.writeLock.acquireTimeoutMs`，再顯示工作階段忙碌錯誤；預設值為 `60000` ms。只有當合法的準備、清理、壓縮或逐字稿鏡像工作在較慢機器上競爭更久時，才提高此值。`session.writeLock.staleMs` 控制現有鎖何時可被回收為過期；預設值為 `1800000` ms。`session.writeLock.maxHoldMs` 控制程序內 watchdog 釋放閾值；預設值為 `300000` ms。緊急 env 覆寫為 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`、`OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` 和 `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。

磁碟預算清理的強制順序（`mode: "enforce"`）：

1. 先移除最舊的已封存、孤立逐字稿或孤立軌跡成品。
2. 如果仍高於目標，逐出最舊的工作階段項目及其逐字稿/軌跡檔案。
3. 持續進行，直到用量等於或低於 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 會回報可能的逐出項目，但不會突變儲存區/檔案。

按需執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## 排程工作階段與執行記錄

隔離的排程執行也會建立工作階段項目/逐字稿，且它們具有專用保留控制：

- `cron.sessionRetention`（預設 `24h`）會從工作階段儲存區修剪舊的隔離排程執行工作階段（`false` 停用）。
- `cron.runLog.keepLines` 會修剪每個排程工作的已保留 SQLite 執行歷史資料列（預設：`2000`）。`cron.runLog.maxBytes` 仍接受用於較舊的檔案式執行記錄。

當排程強制建立新的隔離執行工作階段時，會在寫入新資料列前清理先前的 `cron:<jobId>` 工作階段項目。它會帶入安全偏好設定，例如 thinking/fast/verbose 設定、標籤，以及使用者明確選取的模型/驗證覆寫。它會捨棄環境對話上下文，例如頻道/群組路由、傳送或佇列政策、提權、來源，以及 ACP 執行時繫結，讓新的隔離執行無法從較舊執行繼承過期的傳遞或執行時權限。

---

## 工作階段鍵（`sessionKey`）

`sessionKey` 會識別你所在的_對話桶_（路由 + 隔離）。

常見模式：

- 主要/直接聊天（每個代理）：`agent:<agentId>:<mainKey>`（預設 `main`）
- 群組：`agent:<agentId>:<channel>:group:<id>`
- 房間/頻道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- 排程：`cron:<job.id>`
- 網路鉤子：`hook:<uuid>`（除非被覆寫）

標準規則記錄於 [/concepts/session](/zh-TW/concepts/session)。

---

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 會指向目前的 `sessionId`（繼續對話的逐字稿檔案）。

經驗法則：

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為閘道主機本機時間上午 4:00）會在跨過重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes` 或舊版 `session.idleMinutes`）會在閒置視窗後收到訊息時建立新的 `sessionId`。當每日 + 閒置都已設定時，先到期者生效。
- **Control UI 重新連線續接**可以在閘道從操作員 UI 用戶端收到相符 `sessionId` 時，為一次重新連線傳送保留目前可見的工作階段。一般過期傳送仍會建立新的 `sessionId`。
- **系統事件**（心跳偵測、排程喚醒、exec 通知、閘道簿記）可能會突變工作階段資料列，但不會延長每日/閒置重設新鮮度。重設 rollover 會在建立新提示前捨棄前一個工作階段的已排隊系統事件通知。
- **父層分叉政策**會在建立執行緒或子代理分叉時使用 OpenClaw 的作用中分支。如果該分支太大，OpenClaw 會以隔離上下文啟動子項，而不是失敗或繼承無法使用的歷史。大小政策是自動的；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。

實作細節：決策發生在 `src/auto-reply/reply/session.ts` 的 `initSessionState()` 中。

---

## 工作階段儲存區結構描述（`sessions.json`）

儲存區的值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。

關鍵欄位（非完整清單）：

- `sessionId`：目前的逐字稿 ID（除非設定 `sessionFile`，否則檔名會由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設
  鮮度會使用此值。舊版資料列可能會從 JSONL 工作階段標頭衍生它。
- `lastInteractionAt`：最後一次真實使用者／頻道互動時間戳；閒置重設
  鮮度會使用此值，因此心跳偵測、排程和 exec 事件不會讓工作階段
  保持存活。沒有此欄位的舊版資料列會回退到復原出的工作階段開始
  時間，用於閒置鮮度。
- `updatedAt`：最後一次儲存資料列變更時間戳，用於列表、修剪和
  簿記。它不是每日／閒置重設鮮度的權威來源。
- `archivedAt`：選用的封存時間戳。已封存的工作階段會留在儲存區中，
  逐字稿保持完整，並會從一般作用中列表中排除。
- `pinnedAt`：選用的釘選時間戳。作用中的已釘選工作階段會排在
  未釘選工作階段之前；封存工作階段會清除其釘選。
- Codex 執行緒互通性：兩個欄位都遵循 Codex 執行緒管理形狀 —
  線路上的 `archived`/`pinned` 布林值一律由時間戳衍生，並在伺服器端加蓋時間戳，
  符合 Codex `threads.archived_at`
  語意與 camelCase 序列化。OpenClaw 時間戳是 epoch
  毫秒，而 Codex 使用 epoch 秒，因此橋接會在 codex
  外掛邊界轉換。Codex 尚無釘選 API（僅有 `thread/archive`/`thread/unarchive`）；
  釘選狀態會留在 OpenClaw 端，直到對應 API 出現；屆時相同形狀可讓繫結的工作階段以機械方式往返同步釘選狀態。
- `sessionFile`：選用的明確逐字稿路徑覆寫
- `chatType`：`direct | group | room`（協助 UI 和傳送政策）
- `provider`、`subject`、`room`、`space`、`displayName`：群組／頻道標籤的中繼資料
- 切換項：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每個工作階段的覆寫）
- 模型選擇：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 計數器（盡力而為／取決於供應商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵完成自動壓縮的次數
- `memoryFlushAt`：上次壓縮前記憶體清除的時間戳
- `memoryFlushCompactionCount`：上次清除執行時的壓縮計數

儲存區可以安全編輯，但閘道是權威來源：它可能會在工作階段執行時重寫或重新補水項目。

---

## 逐字稿結構（`*.jsonl`）

逐字稿由 `openclaw/plugin-sdk/agent-sessions` 的 `SessionManager` 管理。

檔案是 JSONL：

- 第一行：工作階段標頭（`type: "session"`，包含 `id`、`cwd`、`timestamp`、選用的 `parentSession`）
- 接著：含有 `id` + `parentId`（樹狀結構）的工作階段項目

值得注意的項目類型：

- `message`：使用者／助理／toolResult 訊息
- `custom_message`：由 extension 注入、會進入模型上下文的訊息（可從 UI 隱藏）
- `custom`：不會進入模型上下文的 extension 狀態
- `compaction`：持久化的壓縮摘要，含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：瀏覽樹狀分支時持久化的摘要

OpenClaw 有意不會「修補」逐字稿；閘道使用 `SessionManager` 讀寫它們。

---

## 上下文視窗與追蹤的 Token

有兩個不同概念很重要：

1. **模型上下文視窗**：每個模型的硬性上限（模型可見的 token）
2. **工作階段儲存區計數器**：寫入 `sessions.json` 的滾動統計（供 /status 和儀表板使用）

如果你正在調整限制：

- 上下文視窗來自模型目錄（也可透過設定覆寫）。
- 儲存區中的 `contextTokens` 是執行期估算／回報值；不要把它視為嚴格保證。

更多資訊請參閱 [/token-use](/zh-TW/reference/token-use)。

---

## 壓縮：它是什麼

壓縮會將較舊的對話摘要成逐字稿中的持久化 `compaction` 項目，並保留近期訊息完整。

壓縮後，未來回合會看到：

- 壓縮摘要
- `firstKeptEntryId` 之後的訊息

壓縮後重新注入 AGENTS.md 章節可透過
`agents.defaults.compaction.postCompactionSections` 選擇啟用；未設定或為 `[]` 時，
OpenClaw 不會在壓縮摘要之上附加 AGENTS.md 摘錄。

壓縮是**持久化**的（不同於工作階段修剪）。請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

## 壓縮區塊邊界與工具配對

當 OpenClaw 將長逐字稿拆分成壓縮區塊時，它會讓
助理工具呼叫與其相符的 `toolResult` 項目保持配對。

- 如果按 token 佔比拆分的位置落在工具呼叫與其結果之間，OpenClaw
  會將邊界移到助理工具呼叫訊息，而不是拆開
  這一對。
- 如果尾端工具結果區塊原本會讓區塊超過目標，
  OpenClaw 會保留該待處理工具區塊，並讓未摘要尾段
  保持完整。
- 已中止／錯誤的工具呼叫區塊不會讓待處理拆分保持開啟。

---

## 自動壓縮發生時機（OpenClaw 執行期）

在嵌入式 OpenClaw 代理中，自動壓縮會在兩種情況觸發：

1. **溢位復原**：模型回傳上下文溢位錯誤
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及類似的供應商形狀變體）→ 壓縮 → 重試。
   當供應商回報嘗試的 token 數時，OpenClaw 會將該
   觀察到的計數轉送給溢位復原壓縮。如果供應商確認
   溢位但未公開可解析的計數，OpenClaw 會將一個略微
   超出預算的合成計數傳給壓縮引擎和診斷。
   如果溢位復原仍然失敗，OpenClaw 會向
   使用者顯示明確指引，並保留目前的工作階段對應，而不是靜默地將
   工作階段鍵輪替為新的工作階段 ID。下一步由操作員控制：
   重試訊息、執行 `/compact`，或在偏好新工作階段時執行 `/new`。
2. **閾值維護**：成功完成一個回合後，當：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文視窗
- `reserveTokens` 是為提示 + 下一次模型輸出保留的餘裕

這些是 OpenClaw 執行期語意。

OpenClaw 也可以在開啟下一次
執行前觸發預檢本機壓縮，條件是設定了 `agents.defaults.compaction.maxActiveTranscriptBytes`，且
作用中逐字稿檔案達到該大小。這是針對本機
重新開啟成本的檔案大小防護，不是原始封存：OpenClaw 仍會執行一般語意壓縮，
且它需要 `truncateAfterCompaction`，以便壓縮後摘要可成為
新的後繼逐字稿。

對於嵌入式 OpenClaw 執行，`agents.defaults.compaction.midTurnPrecheck.enabled: true`
會新增一個選用啟用的工具迴圈防護。在工具結果附加後、下一次
模型呼叫前，OpenClaw 會使用與回合開始時相同的預檢
預算邏輯估算提示壓力。如果上下文已不再容納得下，該防護
不會在 OpenClaw 執行期的 `transformContext` hook 內壓縮。它會引發結構化的
回合中預檢訊號，停止目前的提示提交，並讓
外層執行迴圈使用既有復原路徑：在足夠時截斷過大的工具結果，
或觸發已設定的壓縮模式並重試。此
選項預設停用，並可搭配 `default` 與 `safeguard`
壓縮模式使用，包括由供應商支援的 safeguard 壓縮。
這獨立於 `maxActiveTranscriptBytes`：位元組大小防護會在
回合開啟前執行，而回合中預檢則在嵌入式 OpenClaw 工具
迴圈稍後、於新工具結果附加後執行。

---

## 壓縮設定（`reserveTokens`、`keepRecentTokens`）

OpenClaw 執行期的壓縮設定位於代理設定中：

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw 也會對嵌入式執行強制套用安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 會提高它。
- 預設下限是 `20000` token。
- 將 `agents.defaults.compaction.reserveTokensFloor: 0` 設為停用下限。
- 如果它已經更高，OpenClaw 會保持不變。
- 手動 `/compact` 會遵守明確的 `agents.defaults.compaction.keepRecentTokens`
  並保留 OpenClaw 執行期的近期尾端切點。沒有明確保留預算時，
  手動壓縮仍是硬性檢查點，重建的上下文會從
  新摘要開始。
- 將 `agents.defaults.compaction.midTurnPrecheck.enabled: true` 設定為在新工具結果後、下一次模型
  呼叫前執行
  選用工具迴圈預檢。這只是觸發器；摘要產生仍使用已設定的
  壓縮路徑。它獨立於 `maxActiveTranscriptBytes`，後者是
  回合開始時的作用中逐字稿位元組大小防護。
- 將 `agents.defaults.compaction.maxActiveTranscriptBytes` 設為位元組值或
  像 `"20mb"` 這樣的字串，以便在作用中
  逐字稿變大時於回合前執行本機壓縮。只有在
  `truncateAfterCompaction` 也啟用時，此防護才會生效。保持未設定或設為 `0` 以
  停用。
- 當 `agents.defaults.compaction.truncateAfterCompaction` 啟用時，
  OpenClaw 會在壓縮後將作用中逐字稿輪替為壓縮後的後繼 JSONL。
  分支／還原檢查點動作會使用該壓縮後的後繼檔；
  舊版壓縮前檢查點檔案在被參照時仍可讀取。

原因：在壓縮變得不可避免前，為多回合「家務整理」（如記憶寫入）留下足夠餘裕。

實作：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`
（從嵌入式執行器回合與壓縮設定路徑呼叫）。

---

## 可插拔壓縮供應商

外掛可以透過外掛 API 上的 `registerCompactionProvider()` 註冊壓縮供應商。當 `agents.defaults.compaction.provider` 設為已註冊的供應商 ID 時，safeguard extension 會將摘要委派給該供應商，而不是內建的 `summarizeInStages` 管線。

- `provider`：已註冊壓縮供應商外掛的 ID。保持未設定則使用預設 LLM 摘要。
- 設定 `provider` 會強制 `mode: "safeguard"`。
- 供應商會收到與內建路徑相同的壓縮指示和識別碼保留政策。
- safeguard 仍會在供應商輸出後保留近期回合與拆分回合的後綴上下文。
- 內建 safeguard 摘要會用新訊息重新萃煉先前摘要，
  而不是逐字保留完整的先前摘要。
- safeguard 模式預設啟用摘要品質稽核；設定
  `qualityGuard.enabled: false` 可略過輸出格式錯誤時重試的行為。
- 如果供應商失敗或回傳空結果，OpenClaw 會自動回退到內建 LLM 摘要。
- 中止／逾時訊號會重新拋出（不會吞掉），以尊重呼叫端取消。

來源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

---

## 使用者可見介面

你可以透過以下方式觀察壓縮和工作階段狀態：

- `/status`（在任何聊天工作階段中）
- `openclaw status`（命令列介面）
- `openclaw sessions` / `sessions --json`
- 閘道記錄（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細模式：`🧹 Auto-compaction complete` + 壓縮計數

---

## 靜默家務處理（`NO_REPLY`）

OpenClaw 支援背景工作用的「靜默」回合，此時使用者不應看到中間輸出。

慣例：

- 助理會以精確的靜默權杖 `NO_REPLY` /
  `no_reply` 開始輸出，表示「不要向使用者傳遞回覆」。
- OpenClaw 會在傳遞層將其移除/抑制。
- 精確靜默權杖抑制不區分大小寫，因此當整個承載內容只有靜默權杖時，`NO_REPLY` 和
  `no_reply` 都算數。
- 這僅適用於真正的背景/不傳遞回合；它不是一般可執行使用者請求的捷徑。

自 `2026.1.10` 起，當部分區塊以 `NO_REPLY` 開頭時，OpenClaw 也會抑制**草稿/輸入中串流**，因此靜默操作不會在回合中途洩漏部分輸出。

---

## 壓縮前「記憶寫出」（已實作）

目標：在自動壓縮發生前，執行一個靜默的代理式回合，將持久狀態寫入磁碟（例如代理工作區中的 `memory/YYYY-MM-DD.md`），讓壓縮無法抹除關鍵上下文。

OpenClaw 使用**預先閾值寫出**方法：

1. 監控工作階段上下文使用量。
2. 當它跨過「軟閾值」（低於 OpenClaw 執行階段的壓縮閾值）時，對代理執行一個靜默的「立即寫入記憶」指令。
3. 使用精確靜默權杖 `NO_REPLY` / `no_reply`，讓使用者不會看到任何內容。

設定（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（預設：`true`）
- `model`（可選的精確供應商/模型覆寫，用於寫出回合，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（預設：`4000`）
- `prompt`（寫出回合的使用者訊息）
- `systemPrompt`（附加到寫出回合的額外系統提示）

注意事項：

- 預設提示/系統提示包含 `NO_REPLY` 提示，用於抑制傳遞。
- 設定 `model` 時，寫出回合會使用該模型，而不會繼承作用中工作階段的備援鏈，因此僅限本機的內務處理不會靜默退回到付費對話模型。
- 每個壓縮週期只會執行一次寫出（在 `sessions.json` 中追蹤）。
- 寫出只會在嵌入式 OpenClaw 工作階段中執行（命令列介面後端會略過）。
- 當工作階段工作區為唯讀時（`workspaceAccess: "ro"` 或 `"none"`），會略過寫出。
- 請參閱[記憶](/zh-TW/concepts/memory)，了解工作區檔案版面配置與寫入模式。

OpenClaw 也在擴充 API 中公開 `session_before_compact` 鉤子，但 OpenClaw 的寫出邏輯目前位於閘道端。

---

## 疑難排解檢查清單

- 工作階段金鑰錯誤？從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- 儲存區與逐字稿不一致？從 `openclaw status` 確認閘道主機與儲存區路徑。
- 壓縮洗版？檢查：
  - 模型上下文視窗（太小）
  - 壓縮設定（`reserveTokens` 對模型視窗而言太高，可能導致更早壓縮）
  - 工具結果膨脹：啟用/調整工作階段修剪
- 靜默回合洩漏？確認回覆以 `NO_REPLY` 開頭（不區分大小寫的精確權杖），且你使用的建置包含串流抑制修正。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [上下文引擎](/zh-TW/concepts/context-engine)
