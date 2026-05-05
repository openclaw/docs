---
read_when:
    - 您需要偵錯工作階段 ID、逐字稿 JSONL 或 sessions.json 欄位
    - 你正在變更自動 Compaction 行為，或加入「Compaction 前」整理作業
    - 你想實作記憶清除或靜默系統回合
summary: 深入探討：工作階段儲存區 + 逐字稿、生命週期，以及（自動）Compaction 內部機制
title: 工作階段管理深入解析
x-i18n:
    generated_at: "2026-05-05T08:26:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 會在以下領域端對端管理工作階段：

- **工作階段路由**（傳入訊息如何對應到 `sessionKey`）
- **工作階段儲存區**（`sessions.json`）及其追蹤內容
- **轉錄持久化**（`*.jsonl`）及其結構
- **轉錄整理**（執行前的供應商特定修正）
- **內容限制**（內容視窗與已追蹤權杖）
- **Compaction**（手動與自動 Compaction）以及要在哪裡掛接 Compaction 前工作
- **靜默內務處理**（不應產生使用者可見輸出的記憶寫入）

如果你想先看較高層次的概觀，請從這裡開始：

- [工作階段管理](/zh-TW/concepts/session)
- [Compaction](/zh-TW/concepts/compaction)
- [記憶概觀](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [轉錄整理](/zh-TW/reference/transcript-hygiene)

---

## 真實來源：Gateway

OpenClaw 的設計以單一擁有工作階段狀態的 **Gateway 程序**為核心。

- UI（macOS 應用程式、網頁控制 UI、TUI）應向 Gateway 查詢工作階段清單與權杖計數。
- 在遠端模式中，工作階段檔案位於遠端主機；「檢查你的本機 Mac 檔案」不會反映 Gateway 正在使用的內容。

---

## 兩個持久化層

OpenClaw 會在兩個層中持久化工作階段：

1. **工作階段儲存區（`sessions.json`）**
   - 鍵/值對應：`sessionKey -> SessionEntry`
   - 小型、可變、可安全編輯（或刪除項目）
   - 追蹤工作階段中繼資料（目前工作階段 ID、最後活動、切換項、權杖計數器等）

2. **轉錄（`<sessionId>.jsonl`）**
   - 具有樹狀結構的僅附加轉錄（項目有 `id` + `parentId`）
   - 儲存實際對話 + 工具呼叫 + Compaction 摘要
   - 用於重建未來回合的模型內容
   - 一旦作用中的轉錄超過檢查點大小上限，就會略過大型 Compaction 前偵錯檢查點，避免產生第二份巨大的 `.checkpoint.*.jsonl` 複本。

Gateway 歷史讀取器應避免具體化整個轉錄，除非該介面明確需要任意歷史存取。第一頁歷史、嵌入式聊天歷史、重新啟動復原，以及權杖/使用量檢查都使用有界尾端讀取。完整轉錄掃描會透過非同步轉錄索引進行，該索引會依檔案路徑加上 `mtimeMs`/`size` 快取，並在並行讀取器之間共享。

---

## 磁碟位置

每個代理程式在 Gateway 主機上：

- 儲存區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 轉錄：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 會透過 `src/config/sessions.ts` 解析這些位置。

---

## 儲存區維護與磁碟控制

工作階段持久化有自動維護控制（`session.maintenance`），用於 `sessions.json`、轉錄成品與軌跡附屬檔：

- `mode`：`warn`（預設）或 `enforce`
- `pruneAfter`：過時項目的年齡截止值（預設 `30d`）
- `maxEntries`：限制 `sessions.json` 中的項目數（預設 `500`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 轉錄封存的保留期限（預設：與 `pruneAfter` 相同；`false` 會停用清理）
- `maxDiskBytes`：選用的工作階段目錄預算
- `highWaterBytes`：清理後的選用目標（預設為 `maxDiskBytes` 的 `80%`）

一般 Gateway 寫入會流經每個儲存區的工作階段寫入器，在不取得執行階段檔案鎖的情況下序列化程序內變更。熱路徑修補協助工具會在持有該寫入器槽位時借用已驗證的可變快取，因此大型 `sessions.json` 檔案不會為每次中繼資料更新而被複製或重新讀取。執行階段程式碼應優先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`；直接儲存整個儲存區屬於相容性與離線維護工具。當 Gateway 可連線時，非試跑的 `openclaw sessions cleanup` 與 `openclaw agents delete` 會將儲存區變更委派給 Gateway，讓清理加入同一個寫入器佇列；`--store <path>` 是用於直接檔案維護的明確離線修復路徑。`maxEntries` 清理對生產規模上限仍會分批處理，因此儲存區可能會在下一次高水位清理將其改寫回上限以下之前，短暫超過已設定的上限。工作階段儲存區讀取不會在 Gateway 啟動期間修剪或限制項目；請使用寫入或 `openclaw sessions cleanup --enforce` 進行清理。即使未設定磁碟預算，`openclaw sessions cleanup --enforce` 仍會立即套用已設定的上限，並修剪舊的未引用轉錄、檢查點與軌跡成品。

維護會保留耐久的外部對話指標，例如群組工作階段與執行緒範圍聊天工作階段，但 Cron、hooks、Heartbeat、ACP 與子代理程式的合成執行階段項目，在超過已設定的年齡、數量或磁碟預算時仍可被移除。

OpenClaw 不再於 Gateway 寫入期間建立自動 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，且 `openclaw doctor --fix` 會將它從較舊設定中移除。

轉錄變更會在轉錄檔上使用工作階段寫入鎖。鎖定取得最多會等待 `session.writeLock.acquireTimeoutMs`，之後才浮現工作階段忙碌錯誤；預設值為 `60000` 毫秒。只有在慢速機器上，合法的準備、清理、Compaction 或轉錄鏡像工作競爭更久時，才提高此值。過時鎖偵測與最大持有警告仍是獨立政策。

磁碟預算清理的強制執行順序（`mode: "enforce"`）：

1. 先移除最舊的已封存、孤立轉錄或孤立軌跡成品。
2. 如果仍高於目標，逐出最舊的工作階段項目及其轉錄/軌跡檔案。
3. 持續進行，直到用量等於或低於 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 會回報可能的逐出，但不會變更儲存區/檔案。

依需求執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 工作階段與執行記錄

隔離的 Cron 執行也會建立工作階段項目/轉錄，並且有專用的保留控制：

- `cron.sessionRetention`（預設 `24h`）會從工作階段儲存區修剪舊的隔離 Cron 執行工作階段（`false` 會停用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 檔案（預設：`2_000_000` 位元組與 `2000` 行）。

當 Cron 強制建立新的隔離執行工作階段時，它會先清理先前的 `cron:<jobId>` 工作階段項目，再寫入新的列。它會帶入安全偏好，例如思考/快速/詳細設定、標籤，以及使用者明確選取的模型/驗證覆寫。它會捨棄環境對話內容，例如頻道/群組路由、傳送或佇列政策、提升權限、來源，以及 ACP 執行階段繫結，因此新的隔離執行無法從較舊的執行繼承過時的傳遞或執行階段權限。

---

## 工作階段鍵（`sessionKey`）

`sessionKey` 識別你所在的_對話桶_（路由 + 隔離）。

常見模式：

- 主要/直接聊天（每個代理程式）：`agent:<agentId>:<mainKey>`（預設 `main`）
- 群組：`agent:<agentId>:<channel>:group:<id>`
- 房間/頻道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆寫）

標準規則記錄在 [/concepts/session](/zh-TW/concepts/session)。

---

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（延續對話的轉錄檔）。

經驗法則：

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為 Gateway 主機當地時間上午 4:00）會在重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置過期**（`session.reset.idleMinutes` 或舊版 `session.idleMinutes`）會在閒置視窗後有訊息到達時建立新的 `sessionId`。當每日與閒置兩者都已設定時，以先過期者為準。
- **系統事件**（Heartbeat、Cron 喚醒、exec 通知、Gateway 簿記）可能會變更工作階段列，但不會延長每日/閒置重設的新鮮度。重設輪替會在建立新提示前，捨棄上一個工作階段的已排隊系統事件通知。
- **父分支分岔政策**會在建立執行緒或子代理程式分岔時使用 Pi 的作用中分支。如果該分支過大，OpenClaw 會以隔離內容啟動子項，而不是失敗或繼承無法使用的歷史。大小調整政策是自動的；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。

實作細節：決策發生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 工作階段儲存區結構描述（`sessions.json`）

儲存區的值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。

主要欄位（非完整清單）：

- `sessionId`：目前轉錄 ID（除非已設定 `sessionFile`，否則檔名由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設新鮮度會使用此值。舊版列可能會從 JSONL 工作階段標頭衍生它。
- `lastInteractionAt`：最後一次真實使用者/頻道互動時間戳；閒置重設新鮮度會使用此值，因此 Heartbeat、Cron 與 exec 事件不會讓工作階段保持存活。沒有此欄位的舊版列會退回使用復原的工作階段開始時間作為閒置新鮮度。
- `updatedAt`：最後一次儲存區列變更時間戳，用於列出、修剪與簿記。它不是每日/閒置重設新鮮度的權威來源。
- `sessionFile`：選用的明確轉錄路徑覆寫
- `chatType`：`direct | group | room`（協助 UI 與傳送政策）
- `provider`、`subject`、`room`、`space`、`displayName`：用於群組/頻道標示的中繼資料
- 切換項：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每個工作階段的覆寫）
- 模型選取：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- 權杖計數器（盡力而為 / 取決於供應商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵完成自動 Compaction 的次數
- `memoryFlushAt`：上一次 Compaction 前記憶排清的時間戳
- `memoryFlushCompactionCount`：上一次排清執行時的 Compaction 計數

儲存區可安全編輯，但 Gateway 是權威來源：它可能會在工作階段執行時改寫或重新補水項目。

---

## 轉錄結構（`*.jsonl`）

轉錄由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

檔案是 JSONL：

- 第一行：工作階段標頭（`type: "session"`，包含 `id`、`cwd`、`timestamp`、選用的 `parentSession`）
- 接著：具有 `id` + `parentId` 的工作階段項目（樹狀結構）

值得注意的項目型別：

- `message`：使用者/助理/工具結果訊息
- `custom_message`：由延伸功能注入、_會_進入模型內容的訊息（可從 UI 隱藏）
- `custom`：_不會_進入模型內容的延伸功能狀態
- `compaction`：持久化的 Compaction 摘要，包含 `firstKeptEntryId` 與 `tokensBefore`
- `branch_summary`：導覽樹狀分支時持久化的摘要

OpenClaw 刻意**不會**「修正」轉錄；Gateway 使用 `SessionManager` 讀寫它們。

---

## 內容視窗與已追蹤權杖

有兩個不同概念很重要：

1. **模型內容視窗**：每個模型的硬性上限（模型可見的權杖）
2. **工作階段儲存區計數器**：寫入 `sessions.json` 的滾動統計（用於 /status 與儀表板）

如果你正在調整限制：

- 內容視窗來自模型目錄（並可透過設定覆寫）。
- 儲存區中的 `contextTokens` 是執行階段估計/回報值；不要把它視為嚴格保證。

更多資訊請參閱 [/token-use](/zh-TW/reference/token-use)。

---

## Compaction：它是什麼

Compaction 會將較舊的對話摘要成轉錄中持久化的 `compaction` 項目，並保留最近訊息完整。

Compaction 後，未來回合會看到：

- Compaction 摘要
- `firstKeptEntryId` 之後的訊息

Compaction 是**持久的**（不同於工作階段修剪）。請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

## Compaction 區塊邊界與工具配對

當 OpenClaw 將很長的逐字稿拆成 Compaction 區塊時，會讓助理工具呼叫與其對應的 `toolResult` 項目保持配對。

- 如果依 Token 比例切分的邊界落在工具呼叫與其結果之間，OpenClaw 會將邊界移到助理工具呼叫訊息，而不是拆開這一對。
- 如果尾端的工具結果區塊原本會讓區塊超過目標，OpenClaw 會保留該待處理工具區塊，並保持未摘要的尾端完整。
- 已中止／錯誤的工具呼叫區塊不會讓待處理切分保持開啟。

---

## 自動 Compaction 何時發生（Pi 執行階段）

在嵌入式 Pi 代理程式中，自動 Compaction 會在兩種情況下觸發：

1. **溢出復原**：模型傳回內容溢出錯誤（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及類似的供應商格式變體）→ compact → retry。
2. **閾值維護**：成功完成一回合後，當：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的內容視窗
- `reserveTokens` 是為提示 + 下一次模型輸出保留的餘裕

這些是 Pi 執行階段語意（OpenClaw 會消費事件，但由 Pi 決定何時進行 Compaction）。

當設定了 `agents.defaults.compaction.maxActiveTranscriptBytes`，且作用中的逐字稿檔案達到該大小時，OpenClaw 也可以在開啟下一次執行前觸發預檢本機 Compaction。這是用於降低本機重新開啟成本的檔案大小保護，而不是原始封存：OpenClaw 仍會執行一般的語意 Compaction，且它需要 `truncateAfterCompaction`，讓壓縮後的摘要能成為新的後繼逐字稿。

對於嵌入式 Pi 執行，`agents.defaults.compaction.midTurnPrecheck.enabled: true` 會加入一個可選用的工具迴圈保護。在附加工具結果之後、下一次模型呼叫之前，OpenClaw 會使用與回合開始時相同的預檢預算邏輯來估算提示壓力。如果內容已無法容納，該保護不會在 Pi 的 `transformContext` hook 內進行 Compaction。它會引發結構化的回合中預檢訊號，停止目前的提示提交，並讓外層執行迴圈使用既有復原路徑：在足夠時截斷過大的工具結果，或觸發已設定的 Compaction 模式並重試。此選項預設停用，並可搭配 `default` 與 `safeguard` Compaction 模式使用，包括由供應商支援的 safeguard Compaction。
這與 `maxActiveTranscriptBytes` 無關：位元組大小保護會在回合開啟前執行，而回合中預檢會在稍後的嵌入式 Pi 工具迴圈中，在新的工具結果附加後執行。

---

## Compaction 設定（`reserveTokens`、`keepRecentTokens`）

Pi 的 Compaction 設定位於 Pi 設定中：

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
- 手動 `/compact` 會遵循明確的 `agents.defaults.compaction.keepRecentTokens`，並保留 Pi 的近期尾端切分點。沒有明確保留預算時，手動 Compaction 仍是硬性檢查點，重建後的內容會從新摘要開始。
- 設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`，即可在新的工具結果之後、下一次模型呼叫之前執行選用的工具迴圈預檢。這只是觸發器；摘要產生仍使用已設定的 Compaction 路徑。它與 `maxActiveTranscriptBytes` 無關，後者是回合開始時的作用中逐字稿位元組大小保護。
- 將 `agents.defaults.compaction.maxActiveTranscriptBytes` 設定為位元組值或像 `"20mb"` 這樣的字串，即可在作用中逐字稿變大時於回合前執行本機 Compaction。此保護只有在同時啟用 `truncateAfterCompaction` 時才會生效。保持未設定或設為 `0` 可停用。
- 啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，OpenClaw 會在 Compaction 後將作用中的逐字稿輪替為壓縮後的後繼 JSONL。舊的完整逐字稿會保持封存，並從 Compaction 檢查點連結，而不是原地重寫。

原因：在 Compaction 變得無可避免之前，為多回合的「內務處理」（例如記憶寫入）留下足夠餘裕。

實作：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`（由 `src/agents/pi-embedded-runner.ts` 呼叫）。

---

## 可插拔的 Compaction 供應商

Plugin 可以透過 Plugin API 上的 `registerCompactionProvider()` 註冊 Compaction 供應商。當 `agents.defaults.compaction.provider` 設為已註冊的供應商識別碼時，safeguard Plugin 會將摘要工作委派給該供應商，而不是內建的 `summarizeInStages` 管線。

- `provider`：已註冊 Compaction 供應商 Plugin 的識別碼。保留未設定會使用預設的 LLM 摘要。
- 設定 `provider` 會強制 `mode: "safeguard"`。
- 供應商會收到與內建路徑相同的 Compaction 指示與識別碼保留政策。
- 在供應商輸出之後，safeguard 仍會保留近期回合與切分回合的尾端內容。
- 內建 safeguard 摘要會用新訊息重新萃煉先前摘要，而不是逐字保留完整的上一份摘要。
- safeguard 模式預設會啟用摘要品質稽核；設定 `qualityGuard.enabled: false` 可略過輸出格式異常時重試的行為。
- 如果供應商失敗或傳回空結果，OpenClaw 會自動退回內建 LLM 摘要。
- 中止／逾時訊號會重新拋出（不會被吞掉），以尊重呼叫端取消。

來源：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 使用者可見介面

你可以透過下列方式觀察 Compaction 與工作階段狀態：

- `/status`（在任何聊天工作階段中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 詳細模式：`🧹 Auto-compaction complete` + Compaction 次數

---

## 靜默內務處理（`NO_REPLY`）

OpenClaw 支援用於背景工作的「靜默」回合，使用者不應看到中間輸出。

慣例：

- 助理以精確的靜默 Token `NO_REPLY` / `no_reply` 開始其輸出，表示「不要向使用者遞送回覆」。
- OpenClaw 會在遞送層移除／抑制這項內容。
- 精確靜默 Token 抑制不區分大小寫，因此當整個承載內容只有靜默 Token 時，`NO_REPLY` 和 `no_reply` 都算數。
- 這僅用於真正背景／不遞送的回合；它不是一般可執行使用者請求的捷徑。

自 `2026.1.10` 起，當部分區塊以 `NO_REPLY` 開頭時，OpenClaw 也會抑制**草稿／輸入中串流**，因此靜默操作不會在回合中途洩漏部分輸出。

---

## Compaction 前的「記憶清空」（已實作）

目標：在自動 Compaction 發生之前，執行一個靜默的代理式回合，將持久狀態寫入磁碟（例如代理程式工作區中的 `memory/YYYY-MM-DD.md`），讓 Compaction 無法抹除關鍵內容。

OpenClaw 使用**閾值前清空**方法：

1. 監控工作階段內容使用量。
2. 當它跨過「軟閾值」（低於 Pi 的 Compaction 閾值）時，對代理程式執行一個靜默的「立即寫入記憶」指令。
3. 使用精確的靜默 Token `NO_REPLY` / `no_reply`，讓使用者看不到任何內容。

設定（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（預設：`true`）
- `model`（選用的精確供應商／模型覆寫，用於清空回合，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（預設：`4000`）
- `prompt`（清空回合的使用者訊息）
- `systemPrompt`（附加於清空回合的額外系統提示）

注意事項：

- 預設提示／系統提示包含 `NO_REPLY` 提示，用於抑制遞送。
- 設定 `model` 時，清空回合會使用該模型，而不繼承作用中工作階段的後援鏈，因此僅限本機的內務處理不會靜默退回到付費對話模型。
- 清空會在每個 Compaction 週期執行一次（追蹤於 `sessions.json`）。
- 清空僅會針對嵌入式 Pi 工作階段執行（CLI 後端會略過）。
- 當工作階段工作區為唯讀（`workspaceAccess: "ro"` 或 `"none"`）時，會略過清空。
- 請參閱 [記憶](/zh-TW/concepts/memory)，了解工作區檔案配置與寫入模式。

Pi 也在 Plugin API 中公開 `session_before_compact` hook，但 OpenClaw 的清空邏輯目前位於 Gateway 端。

---

## 疑難排解檢查清單

- 工作階段金鑰錯誤？從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- 儲存區與逐字稿不相符？從 `openclaw status` 確認 Gateway 主機與儲存區路徑。
- Compaction 過於頻繁？檢查：
  - 模型內容視窗（太小）
  - Compaction 設定（`reserveTokens` 對模型視窗而言過高，可能導致更早 Compaction）
  - 工具結果膨脹：啟用／調整工作階段修剪
- 靜默回合洩漏？確認回覆以 `NO_REPLY` 開頭（不區分大小寫的精確 Token），且你使用的是包含串流抑制修正的建置版本。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [內容引擎](/zh-TW/concepts/context-engine)
