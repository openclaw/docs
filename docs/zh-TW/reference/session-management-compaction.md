---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿 JSONL 或 sessions.json 欄位
    - 你正在變更自動 Compaction 行為，或新增「Compaction 前」維護作業
    - 你想要實作記憶清除或靜默系統輪次
summary: 深入探討：工作階段儲存區與對話紀錄、生命週期，以及（自動）Compaction 內部機制
title: 工作階段管理深入解析
x-i18n:
    generated_at: "2026-05-11T20:35:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 會在下列領域端到端管理工作階段：

- **工作階段路由**（傳入訊息如何對應到 `sessionKey`）
- **工作階段儲存區**（`sessions.json`）以及其追蹤內容
- **轉錄紀錄持久化**（`*.jsonl`）及其結構
- **轉錄紀錄衛生**（執行前的供應商特定修正）
- **情境限制**（情境視窗與已追蹤權杖）
- **Compaction**（手動與自動 Compaction）以及要在哪裡掛接 Compaction 前工作
- **靜默內務處理**（不應產生使用者可見輸出的記憶寫入）

如果你想先閱讀較高層次的概觀，請從這些開始：

- [工作階段管理](/zh-TW/concepts/session)
- [Compaction](/zh-TW/concepts/compaction)
- [記憶概觀](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [轉錄紀錄衛生](/zh-TW/reference/transcript-hygiene)

---

## 真實來源：Gateway

OpenClaw 的設計以單一擁有工作階段狀態的 **Gateway 程序**為核心。

- UI（macOS 應用程式、網頁 Control UI、TUI）應向 Gateway 查詢工作階段清單和權杖數。
- 在遠端模式中，工作階段檔案位於遠端主機；「檢查你的本機 Mac 檔案」不會反映 Gateway 正在使用的內容。

---

## 兩個持久化層

OpenClaw 會在兩個層中持久化工作階段：

1. **工作階段儲存區（`sessions.json`）**
   - 鍵/值映射：`sessionKey -> SessionEntry`
   - 小型、可變、可安全編輯（或刪除項目）
   - 追蹤工作階段中繼資料（目前工作階段 ID、最後活動、切換設定、權杖計數器等）

2. **轉錄紀錄（`<sessionId>.jsonl`）**
   - 具有樹狀結構的僅附加轉錄紀錄（項目有 `id` + `parentId`）
   - 儲存實際對話 + 工具呼叫 + Compaction 摘要
   - 用於重建未來回合的模型情境
   - 一旦作用中轉錄紀錄超過檢查點大小上限，就會略過大型 Compaction 前除錯檢查點，避免再產生第二個巨大的 `.checkpoint.*.jsonl` 副本。

Gateway 歷史讀取器應避免具體化整份轉錄紀錄，除非該介面明確需要任意歷史存取。第一頁歷史、嵌入式聊天記錄、重新啟動復原，以及權杖/用量檢查都使用有界尾端讀取。完整轉錄紀錄掃描會通過非同步轉錄紀錄索引；該索引以檔案路徑加上 `mtimeMs`/`size` 快取，並在並行讀取器之間共用。

---

## 磁碟位置

在 Gateway 主機上，依每個代理程式：

- 儲存區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 轉錄紀錄：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 會透過 `src/config/sessions.ts` 解析這些路徑。

---

## 儲存區維護和磁碟控制

工作階段持久化具備自動維護控制項（`session.maintenance`），適用於 `sessions.json`、轉錄紀錄成品和軌跡附屬檔：

- `mode`：`warn`（預設）或 `enforce`
- `pruneAfter`：過期項目年齡截止值（預設 `30d`）
- `maxEntries`：`sessions.json` 中的項目上限（預設 `500`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 轉錄紀錄封存的保留期限（預設：與 `pruneAfter` 相同；`false` 會停用清理）
- `maxDiskBytes`：選用的工作階段目錄預算
- `highWaterBytes`：清理後的選用目標（預設為 `maxDiskBytes` 的 `80%`）

一般 Gateway 寫入會通過每個儲存區的工作階段寫入器，在不取得執行階段檔案鎖的情況下序列化程序內變更。熱路徑修補輔助程式會在持有該寫入器槽位時借用已驗證的可變快取，因此大型 `sessions.json` 檔案不會為每次中繼資料更新而被複製或重新讀取。執行階段程式碼應優先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`；直接儲存整個儲存區是相容性和離線維護工具。當 Gateway 可連線時，非 dry-run 的 `openclaw sessions cleanup` 和 `openclaw agents delete` 會將儲存區變更委派給 Gateway，使清理加入同一個寫入器佇列；`--store <path>` 是用於直接檔案維護的明確離線修復路徑。`maxEntries` 清理對生產規模上限仍會批次處理，因此儲存區可能會短暫超過設定的上限，直到下一次高水位清理將其重寫回較低值。Gateway 啟動期間，工作階段儲存區讀取不會修剪或限制項目數；請使用寫入或 `openclaw sessions cleanup --enforce` 進行清理。即使未設定磁碟預算，`openclaw sessions cleanup --enforce` 仍會立即套用設定的上限，並修剪舊的未參照轉錄紀錄、檢查點和軌跡成品。

維護會保留耐久的外部對話指標，例如群組工作階段和執行緒範圍聊天工作階段，但 Cron、hook、Heartbeat、ACP 和子代理程式的合成執行階段項目，在超過設定的年齡、數量或磁碟預算時仍可被移除。

OpenClaw 不再於 Gateway 寫入期間建立自動 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，且 `openclaw doctor --fix` 會將它從較舊設定中移除。

轉錄紀錄變更會在轉錄紀錄檔案上使用工作階段寫入鎖。鎖取得最多等待 `session.writeLock.acquireTimeoutMs`，之後才浮現工作階段忙碌錯誤；預設值為 `60000` ms。只有在合法的準備、清理、Compaction 或轉錄紀錄鏡像工作在較慢機器上競爭更久時才提高此值。過期鎖偵測和最大持有警告仍是獨立政策。

磁碟預算清理的強制執行順序（`mode: "enforce"`）：

1. 先移除最舊的已封存、孤立轉錄紀錄或孤立軌跡成品。
2. 如果仍高於目標，逐出最舊的工作階段項目及其轉錄紀錄/軌跡檔案。
3. 持續進行，直到用量等於或低於 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 會回報可能的逐出，但不會變更儲存區/檔案。

視需要執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 工作階段和執行記錄

隔離的 Cron 執行也會建立工作階段項目/轉錄紀錄，且它們有專用的保留控制項：

- `cron.sessionRetention`（預設 `24h`）會從工作階段儲存區修剪舊的隔離 Cron 執行工作階段（`false` 會停用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 檔案（預設：`2_000_000` 位元組和 `2000` 行）。

當 Cron 強制建立新的隔離執行工作階段時，會在寫入新列前清理先前的 `cron:<jobId>` 工作階段項目。它會帶入安全偏好設定，例如思考/快速/詳細設定、標籤，以及使用者明確選取的模型/驗證覆寫。它會捨棄環境對話情境，例如頻道/群組路由、傳送或佇列政策、提升權限、來源，以及 ACP 執行階段繫結，讓全新的隔離執行不會從較舊執行繼承過期的傳遞或執行階段權限。

---

## 工作階段鍵（`sessionKey`）

`sessionKey` 會識別你所在的_對話桶_（路由 + 隔離）。

常見模式：

- 主要/直接聊天（依代理程式）：`agent:<agentId>:<mainKey>`（預設 `main`）
- 群組：`agent:<agentId>:<channel>:group:<id>`
- 房間/頻道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆寫）

標準規則記載於 [/concepts/session](/zh-TW/concepts/session)。

---

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（延續對話的轉錄紀錄檔案）。

經驗法則：

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為 Gateway 主機本機時間凌晨 4:00）會在重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes` 或舊版 `session.idleMinutes`）會在閒置時間窗後收到訊息時建立新的 `sessionId`。當每日和閒置兩者都已設定時，先到期者生效。
- **系統事件**（Heartbeat、Cron 喚醒、exec 通知、Gateway 簿記）可能會變更工作階段列，但不會延長每日/閒置重設新鮮度。重設輪替會在建立全新提示前，捨棄上一個工作階段的已佇列系統事件通知。
- **父分支分叉政策**在建立執行緒或子代理程式分叉時使用 Pi 的作用中分支。如果該分支過大，OpenClaw 會以隔離情境啟動子項，而不是失敗或繼承無法使用的歷史。大小政策是自動的；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。

實作細節：決策發生在 `src/auto-reply/reply/session.ts` 的 `initSessionState()` 中。

---

## 工作階段儲存區結構描述（`sessions.json`）

儲存區的值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。

主要欄位（並非完整清單）：

- `sessionId`：目前的轉錄紀錄 ID（除非已設定 `sessionFile`，否則檔名由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設新鮮度使用此欄位。舊版列可能會從 JSONL 工作階段標頭衍生它。
- `lastInteractionAt`：最後一次真實使用者/頻道互動時間戳；閒置重設新鮮度使用此欄位，因此 Heartbeat、Cron 和 exec 事件不會讓工作階段保持存活。沒有此欄位的舊版列會回退到復原的工作階段開始時間，以用於閒置新鮮度。
- `updatedAt`：最後一次儲存區列變更時間戳，用於列出、修剪和簿記。它不是每日/閒置重設新鮮度的權威來源。
- `sessionFile`：選用的明確轉錄紀錄路徑覆寫
- `chatType`：`direct | group | room`（協助 UI 和傳送政策）
- `provider`、`subject`、`room`、`space`、`displayName`：群組/頻道標籤中繼資料
- 切換設定：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每個工作階段的覆寫）
- 模型選擇：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- 權杖計數器（盡力而為/取決於供應商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵的自動 Compaction 完成次數
- `memoryFlushAt`：上次 Compaction 前記憶排清的時間戳
- `memoryFlushCompactionCount`：上次排清執行時的 Compaction 計數

儲存區可安全編輯，但 Gateway 是權威來源：它可能會在工作階段執行時重寫或重新補水項目。

---

## 轉錄紀錄結構（`*.jsonl`）

轉錄紀錄由 `@earendil-works/pi-coding-agent` 的 `SessionManager` 管理。

檔案是 JSONL：

- 第一行：工作階段標頭（`type: "session"`，包含 `id`、`cwd`、`timestamp`、選用的 `parentSession`）
- 接著是：具有 `id` + `parentId` 的工作階段項目（樹狀）

值得注意的項目型別：

- `message`：使用者/助理/toolResult 訊息
- `custom_message`：由擴充功能注入、_會_進入模型情境的訊息（可從 UI 隱藏）
- `custom`：_不會_進入模型情境的擴充功能狀態
- `compaction`：持久化的 Compaction 摘要，含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：瀏覽樹狀分支時持久化的摘要

OpenClaw 有意**不會**「修正」轉錄紀錄；Gateway 使用 `SessionManager` 讀寫它們。

---

## 情境視窗與已追蹤權杖

有兩個不同概念很重要：

1. **模型情境視窗**：每個模型的硬性上限（模型可見的權杖）
2. **工作階段儲存區計數器**：寫入 `sessions.json` 的滾動統計資料（用於 /status 和儀表板）

如果你正在調整限制：

- 情境視窗來自模型目錄（並可透過設定覆寫）。
- 儲存區中的 `contextTokens` 是執行階段估計/回報值；不要將其視為嚴格保證。

更多資訊請參閱 [/token-use](/zh-TW/reference/token-use)。

---

## Compaction：它是什麼

Compaction 會將較舊的對話摘要成轉錄紀錄中持久化的 `compaction` 項目，並保持近期訊息完整。

Compaction 之後，未來回合會看到：

- Compaction 摘要
- `firstKeptEntryId` 之後的訊息

Compaction 是**持久的**（不同於工作階段修剪）。請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

## Compaction 區塊邊界與工具配對

當 OpenClaw 將長對話記錄分割成 Compaction 區塊時，會讓
assistant 工具呼叫與其對應的 `toolResult` 項目保持配對。

- 如果依 token 比例切分的落點位於工具呼叫與其結果之間，OpenClaw
  會將邊界移到 assistant 工具呼叫訊息，而不是拆開這一對。
- 如果尾端的工具結果區塊原本會讓區塊超出目標大小，OpenClaw
  會保留該待處理工具區塊，並讓未摘要的尾端保持完整。
- 已中止/錯誤的工具呼叫區塊不會讓待處理切分保持開啟。

---

## 自動 Compaction 何時發生（Pi runtime）

在嵌入式 Pi agent 中，自動 Compaction 會在兩種情況觸發：

1. **溢位復原**：模型傳回脈絡溢位錯誤
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`，以及類似的 provider 形式變體) → compact → retry。
2. **閾值維護**：在成功完成一輪之後，當：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的脈絡視窗
- `reserveTokens` 是為提示 + 下一次模型輸出保留的餘裕

這些是 Pi runtime 語意（OpenClaw 會消費事件，但由 Pi 決定何時執行 Compaction）。

OpenClaw 也可以在開啟下一次執行前觸發預檢本機 Compaction，
條件是已設定 `agents.defaults.compaction.maxActiveTranscriptBytes`，且
作用中對話記錄檔達到該大小。這是用於降低本機重新開啟成本的檔案大小防護，
不是原始封存：OpenClaw 仍會執行一般語意 Compaction，
且需要 `truncateAfterCompaction`，讓壓縮後的摘要能成為新的後繼對話記錄。

對於嵌入式 Pi 執行，`agents.defaults.compaction.midTurnPrecheck.enabled: true`
會加入一個選擇啟用的工具迴圈防護。在工具結果附加之後、下一次模型呼叫之前，
OpenClaw 會使用與輪次開始時相同的預檢預算邏輯來估算提示壓力。
如果脈絡已無法容納，該防護不會在 Pi 的 `transformContext` hook 內執行 Compaction。
它會提出結構化的輪次中預檢訊號、停止目前的提示提交，並讓外層執行迴圈使用既有的復原路徑：
在足夠時截斷過大的工具結果，或觸發已設定的 Compaction 模式並重試。
此選項預設停用，並可搭配 `default` 與 `safeguard`
Compaction 模式使用，包括 provider 支援的 safeguard Compaction。
這與 `maxActiveTranscriptBytes` 無關：位元組大小防護會在輪次開啟前執行，
而輪次中預檢會在較晚的嵌入式 Pi 工具迴圈中、於新工具結果附加之後執行。

---

## Compaction 設定（`reserveTokens`, `keepRecentTokens`）

Pi 的 Compaction 設定位於 Pi settings：

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
- 預設下限為 `20000` token。
- 設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用下限。
- 如果它已經更高，OpenClaw 會保持不變。
- 手動 `/compact` 會遵守明確的 `agents.defaults.compaction.keepRecentTokens`
  並保留 Pi 的近期尾端切點。若沒有明確的保留預算，
  手動 Compaction 仍會是硬性檢查點，重建後的脈絡會從
  新摘要開始。
- 設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`，可在新工具結果之後、
  下一次模型呼叫之前執行選用的工具迴圈預檢。這只是觸發器；
  摘要產生仍會使用已設定的 Compaction 路徑。它與 `maxActiveTranscriptBytes` 無關，
  後者是輪次開始時的作用中對話記錄位元組大小防護。
- 將 `agents.defaults.compaction.maxActiveTranscriptBytes` 設為位元組值或
  字串，例如 `"20mb"`，即可在作用中對話記錄變大時，於輪次開始前執行本機 Compaction。
  這個防護只有在也啟用 `truncateAfterCompaction` 時才會生效。
  不設定或設為 `0` 可停用。
- 啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，
  OpenClaw 會在 Compaction 後，將作用中對話記錄輪替為壓縮後的後繼 JSONL。
  舊的完整對話記錄會保留封存，並從 Compaction 檢查點連結，
  而不是就地重寫。

原因：在 Compaction 變得不可避免之前，為多輪「內務處理」（例如記憶體寫入）保留足夠餘裕。

實作：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 呼叫）。

---

## 可插拔 Compaction provider

Plugin 可以透過 plugin API 上的 `registerCompactionProvider()` 註冊 Compaction provider。當 `agents.defaults.compaction.provider` 設為已註冊的 provider id 時，safeguard extension 會將摘要委派給該 provider，而不是使用內建的 `summarizeInStages` pipeline。

- `provider`：已註冊 Compaction provider plugin 的 id。不設定則使用預設 LLM 摘要。
- 設定 `provider` 會強制 `mode: "safeguard"`。
- Provider 會收到與內建路徑相同的 Compaction 指令與識別碼保留政策。
- safeguard 仍會在 provider 輸出後保留近期輪次與分割輪次的後綴脈絡。
- 內建 safeguard 摘要會以新訊息重新萃煉先前摘要，
  而不是逐字保留完整的先前摘要。
- Safeguard 模式預設啟用摘要品質稽核；設定
  `qualityGuard.enabled: false` 可略過輸出格式不正確時重試的行為。
- 如果 provider 失敗或傳回空結果，OpenClaw 會自動退回使用內建 LLM 摘要。
- 中止/逾時訊號會重新拋出（不會吞掉），以尊重呼叫端取消。

來源：`src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 使用者可見介面

你可以透過下列方式觀察 Compaction 與工作階段狀態：

- `/status`（在任何聊天工作階段中）
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway 記錄（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細模式：`🧹 Auto-compaction complete` + Compaction 次數

---

## 靜默內務處理（`NO_REPLY`）

OpenClaw 支援背景任務的「靜默」輪次，使用者不應看到中間輸出。

慣例：

- assistant 會以精確的靜默 token `NO_REPLY` /
  `no_reply` 開始其輸出，用來表示「不要向使用者傳遞回覆」。
- OpenClaw 會在傳遞層移除/抑制這個內容。
- 精確靜默 token 抑制不區分大小寫，因此當整個 payload 只有該靜默 token 時，
  `NO_REPLY` 和 `no_reply` 都算。
- 這僅適用於真正的背景/不傳遞輪次；它不是一般可執行使用者請求的捷徑。

自 `2026.1.10` 起，當部分區塊以 `NO_REPLY` 開頭時，
OpenClaw 也會抑制**草稿/輸入中串流**，因此靜默作業不會在輪次中洩漏部分輸出。

---

## Compaction 前的「記憶體 flush」（已實作）

目標：在自動 Compaction 發生前，執行一個靜默 agentic 輪次，將持久狀態寫入磁碟
（例如 agent 工作區中的 `memory/YYYY-MM-DD.md`），讓 Compaction 無法
抹除關鍵脈絡。

OpenClaw 使用**預閾值 flush**方法：

1. 監控工作階段脈絡用量。
2. 當它跨過「軟閾值」（低於 Pi 的 Compaction 閾值）時，向 agent 執行靜默的
   「立即寫入記憶體」指令。
3. 使用精確的靜默 token `NO_REPLY` / `no_reply`，讓使用者看不到
   任何內容。

設定（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（預設：`true`）
- `model`（選用的精確 provider/model 覆寫，用於 flush 輪次，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（預設：`4000`）
- `prompt`（flush 輪次的使用者訊息）
- `systemPrompt`（為 flush 輪次附加的額外 system prompt）

注意事項：

- 預設 prompt/system prompt 包含 `NO_REPLY` 提示，以抑制
  傳遞。
- 設定 `model` 時，flush 輪次會使用該模型，而不繼承
  作用中工作階段 fallback chain，因此本機專用內務處理不會靜默
  fallback 到付費對話模型。
- flush 每個 Compaction 週期執行一次（追蹤於 `sessions.json`）。
- flush 只會針對嵌入式 Pi 工作階段執行（CLI backend 會略過）。
- 當工作階段工作區為唯讀時（`workspaceAccess: "ro"` 或 `"none"`），會略過 flush。
- 請參閱 [Memory](/zh-TW/concepts/memory)，了解工作區檔案配置與寫入模式。

Pi 也在 extension API 中公開 `session_before_compact` hook，但 OpenClaw 的
flush 邏輯目前位於 Gateway 端。

---

## 疑難排解檢查清單

- 工作階段 key 錯誤？從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- Store 與對話記錄不一致？從 `openclaw status` 確認 Gateway host 與 store path。
- Compaction 過於頻繁？檢查：
  - 模型脈絡視窗（太小）
  - Compaction 設定（`reserveTokens` 對模型視窗而言太高，可能導致更早 Compaction）
  - 工具結果膨脹：啟用/調整工作階段修剪
- 靜默輪次外洩？確認回覆以 `NO_REPLY` 開頭（不區分大小寫的精確 token），且你使用的是包含串流抑制修正的建置版本。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [脈絡引擎](/zh-TW/concepts/context-engine)
