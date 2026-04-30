---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿 JSONL 或 sessions.json 欄位
    - 你正在變更自動 Compaction 行為，或新增「Compaction 前」維護作業
    - 您想實作記憶清除或靜默系統回合
summary: 深入探討：工作階段儲存區 + 對話記錄、生命週期與 (自動)Compaction 內部機制
title: 工作階段管理深入解析
x-i18n:
    generated_at: "2026-04-30T03:37:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 會在以下領域端對端管理工作階段：

- **工作階段路由**（傳入訊息如何對應到 `sessionKey`）
- **工作階段儲存區**（`sessions.json`）及其追蹤內容
- **逐字稿持久化**（`*.jsonl`）及其結構
- **逐字稿衛生處理**（執行前的提供者特定修正）
- **上下文限制**（上下文視窗與已追蹤權杖）
- **Compaction**（手動與自動 Compaction）以及在哪裡掛接 Compaction 前工作
- **靜默維護**（不應產生使用者可見輸出的記憶體寫入）

如果你想先看較高階的概覽，請從這裡開始：

- [工作階段管理](/zh-TW/concepts/session)
- [Compaction](/zh-TW/concepts/compaction)
- [記憶體概覽](/zh-TW/concepts/memory)
- [記憶體搜尋](/zh-TW/concepts/memory-search)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [逐字稿衛生處理](/zh-TW/reference/transcript-hygiene)

---

## 真實來源：Gateway

OpenClaw 的設計以單一擁有工作階段狀態的 **Gateway 程序**為核心。

- UI（macOS 應用程式、網頁控制 UI、TUI）應查詢 Gateway 以取得工作階段清單和權杖計數。
- 在遠端模式中，工作階段檔案位於遠端主機；「檢查本機 Mac 檔案」不會反映 Gateway 正在使用的內容。

---

## 兩個持久化層

OpenClaw 會在兩個層中持久化工作階段：

1. **工作階段儲存區（`sessions.json`）**
   - 鍵/值對應：`sessionKey -> SessionEntry`
   - 小型、可變、可安全編輯（或刪除項目）
   - 追蹤工作階段中繼資料（目前工作階段 ID、最後活動、切換設定、權杖計數器等）

2. **逐字稿（`<sessionId>.jsonl`）**
   - 具樹狀結構的僅附加逐字稿（項目有 `id` + `parentId`）
   - 儲存實際對話 + 工具呼叫 + Compaction 摘要
   - 用於為未來回合重建模型上下文
   - 一旦作用中逐字稿超過檢查點大小上限，就會略過大型 Compaction 前除錯檢查點，避免再產生第二份巨大的 `.checkpoint.*.jsonl` 複本。

---

## 磁碟位置

每個代理在 Gateway 主機上：

- 儲存區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 逐字稿：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 會透過 `src/config/sessions.ts` 解析這些位置。

---

## 儲存區維護和磁碟控制

工作階段持久化針對 `sessions.json`、逐字稿成品和軌跡旁支檔案提供自動維護控制（`session.maintenance`）：

- `mode`：`warn`（預設）或 `enforce`
- `pruneAfter`：過期項目年齡截止值（預設 `30d`）
- `maxEntries`：`sessions.json` 中的項目上限（預設 `500`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 逐字稿封存的保留期（預設：與 `pruneAfter` 相同；`false` 會停用清理）
- `maxDiskBytes`：可選的工作階段目錄預算
- `highWaterBytes`：清理後的可選目標（預設為 `maxDiskBytes` 的 `80%`）

一般 Gateway 寫入會針對生產規模上限批次處理 `maxEntries` 清理，因此儲存區可能會短暫超過已設定的上限，直到下一次高水位清理將其重寫回上限內。`openclaw sessions cleanup --enforce` 仍會立即套用已設定的上限。

OpenClaw 不再於 Gateway 寫入期間建立自動 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，且 `openclaw doctor --fix` 會將其從較舊設定中移除。

磁碟預算清理的執行順序（`mode: "enforce"`）：

1. 先移除最舊的已封存、孤立逐字稿或孤立軌跡成品。
2. 如果仍高於目標，逐出最舊的工作階段項目及其逐字稿/軌跡檔案。
3. 持續處理直到用量等於或低於 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 會報告可能的逐出項目，但不會變更儲存區/檔案。

隨需執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 工作階段與執行記錄

隔離的 Cron 執行也會建立工作階段項目/逐字稿，且有專用的保留控制：

- `cron.sessionRetention`（預設 `24h`）會從工作階段儲存區修剪舊的隔離 Cron 執行工作階段（`false` 會停用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 檔案（預設：`2_000_000` 位元組和 `2000` 行）。

當 Cron 強制建立新的隔離執行工作階段時，它會在寫入新列之前清理前一個 `cron:<jobId>` 工作階段項目。它會帶入安全偏好設定，例如思考/快速/詳細設定、標籤，以及使用者明確選取的模型/驗證覆寫。它會捨棄環境對話上下文，例如頻道/群組路由、傳送或佇列原則、提權、來源和 ACP 執行階段繫結，因此新的隔離執行無法從舊執行繼承過期的傳遞或執行階段權限。

---

## 工作階段鍵（`sessionKey`）

`sessionKey` 會識別你位於_哪個對話桶_（路由 + 隔離）。

常見模式：

- 主要/直接聊天（每個代理）：`agent:<agentId>:<mainKey>`（預設 `main`）
- 群組：`agent:<agentId>:<channel>:group:<id>`
- 房間/頻道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆寫）

標準規則記錄在 [/concepts/session](/zh-TW/concepts/session)。

---

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（會延續對話的逐字稿檔案）。

經驗法則：

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為 Gateway 主機本機時間上午 4:00）會在跨過重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes` 或舊版 `session.idleMinutes`）會在閒置視窗後有訊息抵達時建立新的 `sessionId`。同時設定每日與閒置時，先到期者生效。
- **系統事件**（Heartbeat、Cron 喚醒、執行通知、Gateway 簿記）可能會變更工作階段列，但不會延長每日/閒置重設的新鮮度。重設輪替會在建立新提示前捨棄前一個工作階段的佇列中系統事件通知。
- **執行緒父項分叉保護**（`session.parentForkMaxTokens`，預設 `100000`）會在父工作階段已經過大時略過父逐字稿分叉；新執行緒會重新開始。設定為 `0` 可停用。

實作細節：決策發生在 `src/auto-reply/reply/session.ts` 的 `initSessionState()`。

---

## 工作階段儲存區結構描述（`sessions.json`）

儲存區的值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。

主要欄位（非完整清單）：

- `sessionId`：目前逐字稿 ID（除非設定了 `sessionFile`，否則檔名會由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設新鮮度使用此欄位。舊版列可能會從 JSONL 工作階段標頭衍生它。
- `lastInteractionAt`：最後一次真實使用者/頻道互動時間戳；閒置重設新鮮度使用此欄位，因此 Heartbeat、Cron 和執行事件不會讓工作階段保持存活。沒有此欄位的舊版列會退回使用復原的工作階段開始時間作為閒置新鮮度。
- `updatedAt`：最後一次儲存區列變更時間戳，用於清單、修剪和簿記。它不是每日/閒置重設新鮮度的權威依據。
- `sessionFile`：可選的明確逐字稿路徑覆寫
- `chatType`：`direct | group | room`（協助 UI 和傳送原則）
- `provider`、`subject`、`room`、`space`、`displayName`：群組/頻道標籤的中繼資料
- 切換設定：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每個工作階段的覆寫）
- 模型選擇：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- 權杖計數器（盡力而為 / 依提供者而定）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵完成自動 Compaction 的次數
- `memoryFlushAt`：最後一次 Compaction 前記憶體排清的時間戳
- `memoryFlushCompactionCount`：最後一次排清執行時的 Compaction 計數

儲存區可以安全編輯，但 Gateway 才是權威：它可能會在工作階段執行時重寫或重新補水項目。

---

## 逐字稿結構（`*.jsonl`）

逐字稿由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

檔案是 JSONL：

- 第一行：工作階段標頭（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可選的 `parentSession`）
- 接著：帶有 `id` + `parentId` 的工作階段項目（樹狀）

值得注意的項目型別：

- `message`：使用者/助理/工具結果訊息
- `custom_message`：由擴充注入且_會_進入模型上下文的訊息（可在 UI 中隱藏）
- `custom`：_不會_進入模型上下文的擴充狀態
- `compaction`：持久化的 Compaction 摘要，帶有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：瀏覽樹狀分支時持久化的摘要

OpenClaw 有意**不會**「修正」逐字稿；Gateway 會使用 `SessionManager` 讀寫它們。

---

## 上下文視窗與已追蹤權杖

有兩個不同概念很重要：

1. **模型上下文視窗**：每個模型的硬性上限（模型可見的權杖）
2. **工作階段儲存區計數器**：寫入 `sessions.json` 的滾動統計（用於 /status 和儀表板）

如果你正在調整限制：

- 上下文視窗來自模型目錄（且可透過設定覆寫）。
- 儲存區中的 `contextTokens` 是執行階段估算/報告值；不要把它視為嚴格保證。

更多資訊請參閱 [/token-use](/zh-TW/reference/token-use)。

---

## Compaction：它是什麼

Compaction 會將較舊對話摘要成逐字稿中持久化的 `compaction` 項目，並保留近期訊息不變。

Compaction 後，未來回合會看到：

- Compaction 摘要
- `firstKeptEntryId` 之後的訊息

Compaction 是**持久的**（不同於工作階段修剪）。請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

## Compaction 區塊邊界和工具配對

當 OpenClaw 將長逐字稿拆分成 Compaction 區塊時，它會讓助理工具呼叫與其相符的 `toolResult` 項目保持配對。

- 如果權杖占比拆分落在工具呼叫與其結果之間，OpenClaw 會將邊界移到助理工具呼叫訊息，而不是分開該配對。
- 如果尾端工具結果區塊原本會讓區塊超過目標，OpenClaw 會保留該待處理工具區塊，並保持未摘要尾端完整。
- 已中止/錯誤的工具呼叫區塊不會讓待處理拆分保持開啟。

---

## 自動 Compaction 發生時機（Pi 執行階段）

在嵌入式 Pi 代理中，自動 Compaction 會在兩種情況觸發：

1. **溢位復原**：模型回傳上下文溢位錯誤
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及類似的提供者形式變體）→ compact → retry。
2. **閾值維護**：在成功回合後，當：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文視窗
- `reserveTokens` 是為提示 + 下一次模型輸出保留的餘裕

這些是 Pi 執行階段語意（OpenClaw 會消耗事件，但由 Pi 決定何時 Compaction）。

當設定了 `agents.defaults.compaction.maxActiveTranscriptBytes` 且作用中逐字稿檔案達到該大小時，OpenClaw 也可以在開啟下一次執行前觸發預檢本機 Compaction。這是針對本機重新開啟成本的檔案大小保護，而不是原始封存：OpenClaw 仍會執行一般語意 Compaction，且它需要 `truncateAfterCompaction`，讓已 Compaction 的摘要可成為新的後繼逐字稿。

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

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 會將其提高。
- 預設下限是 `20000` 個 token。
- 設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用此下限。
- 如果它已經更高，OpenClaw 會保持不變。
- 手動 `/compact` 會遵循明確的 `agents.defaults.compaction.keepRecentTokens`
  並保留 Pi 的近期尾端切點。若沒有明確的保留預算，
  手動 Compaction 仍會是硬性檢查點，重建後的上下文會從
  新摘要開始。
- 將 `agents.defaults.compaction.maxActiveTranscriptBytes` 設為位元組值或
  字串，例如 `"20mb"`，即可在作用中的逐字稿變大時於回合前執行本機 Compaction。
  這個防護只有在也啟用
  `truncateAfterCompaction` 時才會生效。保持未設定或設為 `0` 即可
  停用。
- 啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，
  OpenClaw 會在 Compaction 後將作用中的逐字稿輪替為壓縮後的後續 JSONL。
  舊的完整逐字稿會保留封存，並從
  Compaction 檢查點連結，而不是就地重寫。

原因：在 Compaction 變得不可避免之前，為多回合「內務處理」（例如記憶寫入）保留足夠餘裕。

實作：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 呼叫）。

---

## 可插拔的 Compaction 提供者

Plugin 可以透過 Plugin API 上的 `registerCompactionProvider()` 註冊 Compaction 提供者。當 `agents.defaults.compaction.provider` 設為已註冊的提供者 ID 時，防護擴充會將摘要委派給該提供者，而不是使用內建的 `summarizeInStages` 管線。

- `provider`：已註冊 Compaction 提供者 Plugin 的 ID。保持未設定即可使用預設 LLM 摘要。
- 設定 `provider` 會強制 `mode: "safeguard"`。
- 提供者會收到與內建路徑相同的 Compaction 指示與識別碼保留政策。
- 防護在提供者輸出後仍會保留近期回合與分割回合的後綴上下文。
- 內建防護摘要會使用新訊息重新萃取既有摘要，
  而不是逐字保留完整的先前摘要。
- 防護模式預設會啟用摘要品質稽核；設定
  `qualityGuard.enabled: false` 可略過輸出格式錯誤時重試的行為。
- 如果提供者失敗或傳回空結果，OpenClaw 會自動退回使用內建 LLM 摘要。
- Abort/timeout 訊號會被重新擲出（不會被吞掉），以尊重呼叫端取消。

來源：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 使用者可見介面

你可以透過以下方式觀察 Compaction 與工作階段狀態：

- `/status`（在任何聊天工作階段中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 詳細模式：`🧹 Auto-compaction complete` + Compaction 次數

---

## 靜默內務處理（`NO_REPLY`）

OpenClaw 支援用於背景工作的「靜默」回合，使用者不應看到中間輸出。

慣例：

- 助理會以精確的靜默 token `NO_REPLY` /
  `no_reply` 開始輸出，以表示「不要向使用者送出回覆」。
- OpenClaw 會在遞送層移除/抑制這段內容。
- 精確靜默 token 抑制不區分大小寫，因此當整個承載內容只有靜默 token 時，
  `NO_REPLY` 和 `no_reply` 都算。
- 這只適用於真正背景/不遞送的回合；它不是一般可執行使用者請求的捷徑。

自 `2026.1.10` 起，當
部分區塊以 `NO_REPLY` 開頭時，OpenClaw 也會抑制**草稿/輸入中串流**，
因此靜默操作不會在回合中途外洩部分輸出。

---

## Compaction 前「記憶清空」（已實作）

目標：在自動 Compaction 發生前，執行一個靜默的代理式回合，將持久
狀態寫入磁碟（例如代理工作區中的 `memory/YYYY-MM-DD.md`），讓 Compaction 無法
抹除關鍵上下文。

OpenClaw 使用**預先閾值清空**方法：

1. 監控工作階段上下文用量。
2. 當它跨過「軟性閾值」（低於 Pi 的 Compaction 閾值）時，向代理執行靜默的
   「立即寫入記憶」指令。
3. 使用精確的靜默 token `NO_REPLY` / `no_reply`，讓使用者
   看不到任何內容。

設定（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（預設：`true`）
- `model`（可選的精確提供者/模型覆寫，用於清空回合，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（預設：`4000`）
- `prompt`（清空回合的使用者訊息）
- `systemPrompt`（附加到清空回合的額外系統提示）

注意：

- 預設提示/系統提示包含 `NO_REPLY` 提示，以抑制
  遞送。
- 設定 `model` 時，清空回合會使用該模型，而不繼承
  作用中工作階段的後備鏈，因此僅限本機的內務處理不會靜默地
  退回使用付費對話模型。
- 每個 Compaction 週期只會執行一次清空（追蹤於 `sessions.json`）。
- 清空只會針對嵌入式 Pi 工作階段執行（CLI 後端會略過）。
- 當工作階段工作區是唯讀時（`workspaceAccess: "ro"` 或 `"none"`），會略過清空。
- 請參閱 [Memory](/zh-TW/concepts/memory) 了解工作區檔案配置與寫入模式。

Pi 也會在擴充 API 中公開 `session_before_compact` hook，但 OpenClaw 的
清空邏輯目前位於 Gateway 端。

---

## 疑難排解檢查清單

- 工作階段金鑰錯誤？從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- 儲存區與逐字稿不相符？從 `openclaw status` 確認 Gateway 主機與儲存區路徑。
- Compaction 垃圾訊息過多？檢查：
  - 模型上下文視窗（太小）
  - Compaction 設定（`reserveTokens` 對模型視窗而言過高，可能導致更早 Compaction）
  - 工具結果膨脹：啟用/調整工作階段修剪
- 靜默回合外洩？確認回覆以 `NO_REPLY` 開頭（不區分大小寫的精確 token），並且你使用的建置包含串流抑制修正。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [上下文引擎](/zh-TW/concepts/context-engine)
