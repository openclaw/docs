---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿 JSONL，或 sessions.json 欄位
    - 你正在變更自動壓縮行為，或新增「壓縮前」的維護整理
    - 你想實作記憶清除或靜默系統回合
summary: 深入探討：工作階段儲存區與逐字稿、生命週期，以及（自動）壓縮內部機制
title: 工作階段管理深入解析
x-i18n:
    generated_at: "2026-06-27T20:01:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 會在這些區域端到端管理工作階段：

- **工作階段路由**（傳入訊息如何對應到 `sessionKey`）
- **工作階段儲存區**（`sessions.json`）及其追蹤內容
- **轉錄保存**（`*.jsonl`）及其結構
- **轉錄衛生**（執行前的供應商專屬修正）
- **上下文限制**（上下文視窗與已追蹤權杖）
- **壓縮**（手動與自動壓縮）以及掛接壓縮前工作的地方
- **靜默內務整理**（不應產生使用者可見輸出的記憶寫入）

如果你想先閱讀較高階的概覽，請從這裡開始：

- [工作階段管理](/zh-TW/concepts/session)
- [壓縮](/zh-TW/concepts/compaction)
- [記憶概覽](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [轉錄衛生](/zh-TW/reference/transcript-hygiene)

---

## 真實來源：閘道

OpenClaw 的設計以單一擁有工作階段狀態的**閘道程序**為中心。

- UI（macOS app、網頁 Control UI、終端介面）應向閘道查詢工作階段清單與權杖計數。
- 在遠端模式中，工作階段檔案位於遠端主機；「檢查你的本機 Mac 檔案」不會反映閘道正在使用的內容。

---

## 兩個持久化層

OpenClaw 會在兩個層中持久化工作階段：

1. **工作階段儲存區（`sessions.json`）**
   - 鍵/值對映：`sessionKey -> SessionEntry`
   - 小型、可變、可安全編輯（或刪除項目）
   - 追蹤工作階段中繼資料（目前工作階段 ID、上次活動、切換設定、權杖計數器等）

2. **轉錄（`<sessionId>.jsonl`）**
   - 具有樹狀結構的僅附加轉錄（項目有 `id` + `parentId`）
   - 儲存實際對話 + 工具呼叫 + 壓縮摘要
   - 用於重建未來回合的模型上下文
   - 壓縮檢查點是壓縮後後繼轉錄上的中繼資料。新的壓縮不會寫入第二份 `.checkpoint.*.jsonl` 副本。

除非介面明確需要任意歷史存取，否則閘道歷史讀取器應避免將整個轉錄具體化。第一頁歷史、嵌入式聊天歷史、重新啟動復原，以及權杖/用量檢查都使用有界尾端讀取。完整轉錄掃描會透過非同步轉錄索引進行；該索引依檔案路徑加上 `mtimeMs`/`size` 快取，並在並行讀取器之間共用。

---

## 磁碟位置

每個 agent 在閘道主機上：

- 儲存區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 轉錄：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 會透過 `src/config/sessions.ts` 解析這些位置。

---

## 儲存區維護與磁碟控制

工作階段持久化對 `sessions.json`、轉錄成品與軌跡 sidecar 有自動維護控制（`session.maintenance`）：

- `mode`：`enforce`（預設）或 `warn`
- `pruneAfter`：過期項目年齡截止（預設 `30d`）
- `maxEntries`：限制 `sessions.json` 中的項目數（預設 `500`）
- 短生命週期的閘道模型執行探測保留固定為 `24h`，但它受壓力門檻控制：只有在達到工作階段項目維護/上限壓力時，才會移除過期的嚴格探測列。這只套用於符合 `agent:*:explicit:model-run-<uuid>` 的嚴格明確探測鍵，並在全域過期項目清理/限制執行時先於其執行。
- `resetArchiveRetention`：`*.reset.<timestamp>` 轉錄封存的保留期（預設：與 `pruneAfter` 相同；`false` 停用清理）
- `maxDiskBytes`：選用的工作階段目錄預算
- `highWaterBytes`：清理後的選用目標（預設為 `maxDiskBytes` 的 `80%`）

一般閘道寫入會透過每個儲存區的工作階段寫入器流動，該寫入器會序列化程序內變更，而不取得執行階段檔案鎖。熱路徑修補輔助工具會在持有該寫入器槽位時借用已驗證的可變快取，因此大型 `sessions.json` 檔案不會為每次中繼資料更新而被複製或重新讀取。執行階段程式碼應優先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`；直接儲存整個儲存區是相容性與離線維護工具。當閘道可連線時，非 dry-run 的 `openclaw sessions cleanup` 和 `openclaw agents delete` 會將儲存區變更委派給閘道，讓清理加入相同寫入器佇列；`--store <path>` 是直接檔案維護的明確離線修復路徑。對正式環境規模的上限，`maxEntries` 清理仍會批次處理，因此儲存區可能會短暫超過設定的上限，直到下一次高水位清理將其重寫回上限以下。工作階段儲存區讀取不會在閘道啟動期間修剪或限制項目；請使用寫入或 `openclaw sessions cleanup --enforce` 進行清理。即使未設定磁碟預算，`openclaw sessions cleanup --enforce` 仍會立即套用設定的上限，並修剪舊的未參照轉錄、檢查點與軌跡成品。

維護會保留持久的外部對話指標，例如群組工作階段和執行緒範圍的聊天工作階段，但 cron、hook、心跳偵測、ACP 和子 agent 的合成執行階段項目，在超過設定的年齡、數量或磁碟預算時仍可被移除。閘道模型執行探測工作階段只有在其鍵完全符合 `agent:*:explicit:model-run-<uuid>` 時，才使用獨立的 `24h` 模型執行保留期；其他明確工作階段不屬於該保留期。模型執行清理只在工作階段項目上限壓力下套用。隔離的 cron 執行會保留自己的 `cron.sessionRetention` 控制，獨立於模型執行探測保留期。

OpenClaw 不再於閘道寫入期間建立自動 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，且 `openclaw doctor --fix` 會從較舊設定中移除它。

轉錄變更會在轉錄檔上使用工作階段寫入鎖。鎖取得最多等待 `session.writeLock.acquireTimeoutMs`，之後會顯示工作階段忙碌錯誤；預設為 `60000` ms。只有在合法的準備、清理、壓縮或轉錄鏡像工作在較慢機器上競爭更久時，才提高此值。`session.writeLock.staleMs` 控制現有鎖何時可被回收為過期；預設為 `1800000` ms。`session.writeLock.maxHoldMs` 控制程序內 watchdog 釋放門檻；預設為 `300000` ms。緊急環境變數覆寫為 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`、`OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` 和 `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。

磁碟預算清理的強制順序（`mode: "enforce"`）：

1. 先移除最舊的已封存、孤立轉錄或孤立軌跡成品。
2. 如果仍高於目標，逐出最舊的工作階段項目及其轉錄/軌跡檔案。
3. 持續進行，直到用量等於或低於 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 會報告潛在逐出，但不會變更儲存區/檔案。

依需求執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 工作階段與執行記錄

隔離的 cron 執行也會建立工作階段項目/轉錄，且它們有專用保留控制：

- `cron.sessionRetention`（預設 `24h`）會從工作階段儲存區修剪舊的隔離 cron 執行工作階段（`false` 停用）。
- `cron.runLog.keepLines` 會針對每個 cron 工作修剪保留的 SQLite 執行歷史列（預設：`2000`）。`cron.runLog.maxBytes` 仍可被較舊的檔案後端執行記錄接受。

當 cron 強制建立新的隔離執行工作階段時，它會在寫入新列前清理上一個 `cron:<jobId>` 工作階段項目。它會帶入安全的偏好設定，例如 thinking/fast/verbose 設定、標籤，以及明確的使用者選擇模型/auth 覆寫。它會捨棄周圍對話上下文，例如 channel/group 路由、傳送或佇列政策、提升權限、來源，以及 ACP 執行階段繫結，讓新的隔離執行無法從較舊執行繼承過期的傳遞或執行階段權限。

---

## 工作階段鍵（`sessionKey`）

`sessionKey` 會識別你所在的_對話桶_（路由 + 隔離）。

常見模式：

- 主要/直接聊天（每個 agent）：`agent:<agentId>:<mainKey>`（預設 `main`）
- 群組：`agent:<agentId>:<channel>:group:<id>`
- 房間/頻道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- 網路鉤子：`hook:<uuid>`（除非被覆寫）

標準規則記錄於 [/concepts/session](/zh-TW/concepts/session)。

---

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（繼續對話的轉錄檔）。

經驗法則：

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為閘道主機本地時間上午 4:00）會在重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes` 或舊版 `session.idleMinutes`）會在閒置視窗後有訊息抵達時建立新的 `sessionId`。當每日 + 閒置都已設定時，先到期者優先。
- **Control UI 重新連線續接**可在閘道從操作員 UI 用戶端收到相符 `sessionId` 時，為一次重新連線傳送保留目前可見的工作階段。一般過期傳送仍會建立新的 `sessionId`。
- **系統事件**（心跳偵測、cron 喚醒、exec 通知、閘道簿記）可能會變更工作階段列，但不會延長每日/閒置重設的新鮮度。重設輪替會在建立新提示前丟棄前一個工作階段的已排隊系統事件通知。
- **父項分支政策**會在建立執行緒或子 agent fork 時使用 OpenClaw 的作用中分支。如果該分支太大，OpenClaw 會以隔離上下文啟動子項，而不是失敗或繼承不可用的歷史。大小政策是自動的；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。

實作細節：決策發生於 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 工作階段儲存區結構描述（`sessions.json`）

儲存區的值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。

重要欄位（非完整清單）：

- `sessionId`：目前轉錄 ID（除非設定 `sessionFile`，否則檔名會由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設新鮮度使用此欄位。舊版列可能會從 JSONL 工作階段標頭衍生它。
- `lastInteractionAt`：上次真實使用者/channel 互動時間戳；閒置重設新鮮度使用此欄位，因此心跳偵測、cron 和 exec 事件不會讓工作階段維持存活。沒有此欄位的舊版列會退回到復原的工作階段開始時間，用於閒置新鮮度。
- `updatedAt`：上次儲存區列變更時間戳，用於列出、修剪與簿記。它不是每日/閒置重設新鮮度的權威來源。
- `sessionFile`：選用的明確轉錄路徑覆寫
- `chatType`：`direct | group | room`（協助 UI 與傳送政策）
- `provider`、`subject`、`room`、`space`、`displayName`：群組/channel 標籤的中繼資料
- 切換設定：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每個工作階段覆寫）
- 模型選擇：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- 權杖計數器（盡力而為 / 取決於供應商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵完成自動壓縮的次數
- `memoryFlushAt`：上次壓縮前記憶 flush 的時間戳
- `memoryFlushCompactionCount`：上次 flush 執行時的壓縮計數

儲存區可安全編輯，但閘道才是權威：工作階段執行時，它可能會重寫或重新補水項目。

---

## 轉錄結構（`*.jsonl`）

轉錄由 `openclaw/plugin-sdk/agent-sessions` 的 `SessionManager` 管理。

檔案為 JSONL：

- 第一行：工作階段標頭（`type: "session"`，包含 `id`、`cwd`、`timestamp`、選用 `parentSession`）
- 接著：具有 `id` + `parentId` 的工作階段項目（樹狀）

值得注意的項目型別：

- `message`：user/assistant/toolResult 訊息
- `custom_message`：由擴充功能注入、_會_進入模型情境的訊息（可從 UI 隱藏）
- `custom`：_不會_進入模型情境的擴充功能狀態
- `compaction`：包含 `firstKeptEntryId` 和 `tokensBefore` 的持久化壓縮摘要
- `branch_summary`：瀏覽樹狀分支時持久化的摘要

OpenClaw 刻意**不會**「修補」逐字稿；閘道會使用 `SessionManager` 讀寫它們。

---

## 情境視窗與追蹤 Token

有兩個不同概念很重要：

1. **模型情境視窗**：每個模型的硬性上限（模型可見的 Token）
2. **工作階段儲存計數器**：寫入 `sessions.json` 的滾動統計資料（用於 /status 和儀表板）

如果你正在調整限制：

- 情境視窗來自模型目錄（也可透過設定覆寫）。
- 儲存中的 `contextTokens` 是執行階段估算/回報值；不要把它視為嚴格保證。

更多資訊請參閱 [/token-use](/zh-TW/reference/token-use)。

---

## 壓縮：它是什麼

壓縮會將較舊的對話摘要成逐字稿中持久化的 `compaction` 項目，並保留近期訊息不變。

壓縮後，未來回合會看到：

- 壓縮摘要
- `firstKeptEntryId` 之後的訊息

壓縮後重新注入 AGENTS.md 區段可透過
`agents.defaults.compaction.postCompactionSections` 選擇啟用；未設定或為 `[]` 時，
OpenClaw 不會在壓縮摘要之上附加 AGENTS.md 摘錄。

壓縮是**持久化**的（不同於工作階段修剪）。請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

## 壓縮區塊邊界與工具配對

當 OpenClaw 將長逐字稿切分成壓縮區塊時，會讓
assistant 工具呼叫與其對應的 `toolResult` 項目保持配對。

- 如果按 Token 佔比切分的位置落在工具呼叫與其結果之間，OpenClaw
  會將邊界移到 assistant 工具呼叫訊息，而不是拆開這組配對。
- 如果尾端的工具結果區塊原本會讓區塊超出目標，OpenClaw 會保留該待處理工具區塊，並讓未摘要的尾端保持完整。
- 已中止/錯誤的工具呼叫區塊不會讓待處理切分維持開啟。

---

## 自動壓縮何時發生（OpenClaw 執行階段）

在嵌入式 OpenClaw 代理中，自動壓縮會在兩種情況下觸發：

1. **溢位復原**：模型回傳情境溢位錯誤
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`，以及類似的提供者格式變體) → 壓縮 → 重試。
   當提供者回報嘗試的 Token 數時，OpenClaw 會將該觀測到的數量轉送到溢位復原壓縮。如果提供者確認溢位但未公開可剖析的數量，OpenClaw 會將最低程度超出預算的合成數量傳給壓縮引擎與診斷。
   如果溢位復原仍然失敗，OpenClaw 會向使用者顯示明確指引，並保留目前工作階段對應，而不是默默將工作階段金鑰輪替到新的工作階段 ID。下一步由操作員控制：
   重試該訊息、執行 `/compact`，或在偏好新工作階段時執行 `/new`。
2. **閾值維護**：成功回合之後，當：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的情境視窗
- `reserveTokens` 是為提示 + 下一次模型輸出保留的餘裕

這些是 OpenClaw 執行階段語意。

OpenClaw 也可以在開啟下一次執行前觸發預檢本機壓縮，條件是設定了 `agents.defaults.compaction.maxActiveTranscriptBytes`，且作用中逐字稿檔案達到該大小。這是針對本機重新開啟成本的檔案大小保護，不是原始封存：OpenClaw 仍會執行一般語意壓縮，且需要 `truncateAfterCompaction`，讓壓縮摘要可成為新的後繼逐字稿。

對於嵌入式 OpenClaw 執行，`agents.defaults.compaction.midTurnPrecheck.enabled: true`
會加入一個可選啟用的工具迴圈保護。在附加工具結果後、下一次模型呼叫前，OpenClaw 會使用與回合開始時相同的預檢預算邏輯估算提示壓力。如果情境已不再容納得下，該保護不會在 OpenClaw 執行階段的 `transformContext` hook 中壓縮。它會引發結構化的回合中預檢訊號，停止目前提示提交，並讓外層執行迴圈使用現有復原路徑：在足夠時截斷過大的工具結果，或觸發已設定的壓縮模式並重試。此選項預設停用，並可搭配 `default` 和 `safeguard` 壓縮模式使用，包括由提供者支援的 safeguard 壓縮。
這與 `maxActiveTranscriptBytes` 無關：位元組大小保護會在回合開啟前執行，而回合中預檢會在嵌入式 OpenClaw 工具迴圈稍後、附加新的工具結果後執行。

---

## 壓縮設定（`reserveTokens`, `keepRecentTokens`）

OpenClaw 執行階段的壓縮設定位於代理設定中：

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

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 會將它提高。
- 預設下限是 `20000` 個 Token。
- 設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用下限。
- 如果它已經更高，OpenClaw 會保持不變。
- 手動 `/compact` 會遵守明確的 `agents.defaults.compaction.keepRecentTokens`
  並保留 OpenClaw 執行階段的近期尾端切點。沒有明確保留預算時，
  手動壓縮仍是硬性檢查點，重建後的情境會從新摘要開始。
- 設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`，可在新的工具結果之後、下一次模型呼叫之前執行選用的工具迴圈預檢。這只是一個觸發器；摘要產生仍會使用已設定的壓縮路徑。它與 `maxActiveTranscriptBytes` 無關，後者是回合開始時作用中逐字稿的位元組大小保護。
- 將 `agents.defaults.compaction.maxActiveTranscriptBytes` 設為位元組值或
  例如 `"20mb"` 的字串，可在作用中逐字稿變大時於回合前執行本機壓縮。此保護只有在也啟用
  `truncateAfterCompaction` 時才會生效。保持未設定或設為 `0` 可停用。
- 啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，
  OpenClaw 會在壓縮後將作用中逐字稿輪替為壓縮後的後繼 JSONL。
  分支/還原檢查點動作會使用該壓縮後的後繼；舊版壓縮前檢查點檔案在被參照時仍可讀取。

原因：在壓縮變得不可避免之前，為多回合「內務處理」（例如記憶寫入）留下足夠餘裕。

實作：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`
（由嵌入式執行器回合與壓縮設定路徑呼叫）。

---

## 可插拔的壓縮提供者

外掛可以透過外掛 API 上的 `registerCompactionProvider()` 註冊壓縮提供者。當 `agents.defaults.compaction.provider` 設為已註冊的提供者 ID 時，safeguard 擴充功能會將摘要委派給該提供者，而不是內建的 `summarizeInStages` 管線。

- `provider`：已註冊壓縮提供者外掛的 ID。未設定時使用預設 LLM 摘要。
- 設定 `provider` 會強制 `mode: "safeguard"`。
- 提供者會收到與內建路徑相同的壓縮指示與識別符保留政策。
- safeguard 在提供者輸出後仍會保留近期回合與拆分回合的尾端情境。
- 內建 safeguard 摘要會用新訊息重新萃取先前摘要，而不是逐字保留完整的先前摘要。
- Safeguard 模式預設啟用摘要品質稽核；設定
  `qualityGuard.enabled: false` 可略過輸出格式錯誤時重試的行為。
- 如果提供者失敗或回傳空結果，OpenClaw 會自動退回內建 LLM 摘要。
- 中止/逾時訊號會重新拋出（不會被吞掉），以遵守呼叫端取消。

來源：`src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`。

---

## 使用者可見介面

你可以透過以下方式觀察壓縮與工作階段狀態：

- `/status`（在任何聊天工作階段中）
- `openclaw status`（命令列介面）
- `openclaw sessions` / `sessions --json`
- 閘道日誌（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細模式：`🧹 Auto-compaction complete` + 壓縮次數

---

## 靜默內務處理（`NO_REPLY`）

OpenClaw 支援用於背景工作的「靜默」回合，使用者不應看到中間輸出。

慣例：

- assistant 以精確的靜默 Token `NO_REPLY` /
  `no_reply` 開始其輸出，用來表示「不要向使用者交付回覆」。
- OpenClaw 會在交付層剝除/抑制它。
- 精確靜默 Token 抑制不分大小寫，因此當整個承載內容只有該靜默 Token 時，`NO_REPLY` 和
  `no_reply` 都算。
- 這只用於真正的背景/不交付回合；它不是一般可操作使用者請求的捷徑。

截至 `2026.1.10`，當部分區塊以 `NO_REPLY` 開頭時，OpenClaw 也會抑制**草稿/輸入串流**，因此靜默操作不會在回合中途洩漏部分輸出。

---

## 壓縮前「記憶清空」（已實作）

目標：在自動壓縮發生前，執行一個靜默代理式回合，將持久狀態寫入磁碟（例如代理工作區中的 `memory/YYYY-MM-DD.md`），讓壓縮無法抹除關鍵情境。

OpenClaw 使用**預閾值清空**方法：

1. 監控工作階段情境使用量。
2. 當它跨越「軟閾值」（低於 OpenClaw 執行階段的壓縮閾值）時，向代理執行靜默的「立即寫入記憶」指令。
3. 使用精確的靜默 Token `NO_REPLY` / `no_reply`，讓使用者看不到任何內容。

設定（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（預設：`true`）
- `model`（選用的精確提供者/模型覆寫，用於清空回合，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（預設：`4000`）
- `prompt`（清空回合的使用者訊息）
- `systemPrompt`（附加到清空回合的額外系統提示）

注意：

- 預設提示/系統提示包含 `NO_REPLY` 提示，用於抑制交付。
- 設定 `model` 時，清空回合會使用該模型，而不繼承作用中工作階段的備援鏈，因此只在本機進行的內務處理不會默默退回到付費對話模型。
- 每個壓縮週期只會執行一次清空（追蹤於 `sessions.json`）。
- 清空只會針對嵌入式 OpenClaw 工作階段執行（命令列介面後端會略過）。
- 當工作階段工作區為唯讀（`workspaceAccess: "ro"` 或 `"none"`）時，會略過清空。
- 請參閱 [記憶](/zh-TW/concepts/memory) 了解工作區檔案配置與寫入模式。

OpenClaw 也在擴充功能 API 中公開 `session_before_compact` hook，但 OpenClaw 的清空邏輯目前位於閘道端。

---

## 疑難排解檢查清單

- 工作階段金鑰錯了嗎？從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- 儲存與逐字稿不一致？從 `openclaw status` 確認閘道主機與儲存路徑。
- 壓縮過於頻繁？檢查：
  - 模型情境視窗（太小）
  - 壓縮設定（`reserveTokens` 對模型視窗而言太高，可能造成更早壓縮）
  - 工具結果膨脹：啟用/調整工作階段修剪
- 靜默回合外洩？確認回覆以 `NO_REPLY` 開頭（不分大小寫的精確 Token），且你使用的是包含串流抑制修正的建置版本。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [情境引擎](/zh-TW/concepts/context-engine)
