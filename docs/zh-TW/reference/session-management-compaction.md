---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿 JSONL 或 sessions.json 欄位
    - 你正在變更自動 Compaction 行為，或新增「Compaction 前」整理作業
    - 你想要實作記憶清除或靜默系統輪次
summary: 深入探討：工作階段儲存區 + 對話記錄、生命週期，以及（自動）Compaction 內部機制
title: 工作階段管理深入探討
x-i18n:
    generated_at: "2026-05-06T02:57:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 在以下領域端對端管理工作階段：

- **工作階段路由**（傳入訊息如何對應到 `sessionKey`）
- **工作階段儲存區**（`sessions.json`）及其追蹤內容
- **對話記錄持久化**（`*.jsonl`）及其結構
- **對話記錄衛生**（執行前的供應商特定修正）
- **上下文限制**（上下文視窗與追蹤的 token）
- **Compaction**（手動與自動 Compaction）以及要在哪裡掛接 Compaction 前工作
- **靜默內務處理**（不應產生使用者可見輸出的記憶體寫入）

如果你想先看較高層級的概覽，請從這裡開始：

- [工作階段管理](/zh-TW/concepts/session)
- [Compaction](/zh-TW/concepts/compaction)
- [記憶體概覽](/zh-TW/concepts/memory)
- [記憶體搜尋](/zh-TW/concepts/memory-search)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [對話記錄衛生](/zh-TW/reference/transcript-hygiene)

---

## 真實來源：Gateway

OpenClaw 是圍繞單一擁有工作階段狀態的 **Gateway 程序**設計的。

- UI（macOS app、網頁 Control UI、TUI）應向 Gateway 查詢工作階段清單和 token 數。
- 在遠端模式中，工作階段檔案位於遠端主機上；「檢查你的本機 Mac 檔案」不會反映 Gateway 正在使用的內容。

---

## 兩個持久化層

OpenClaw 以兩層持久化工作階段：

1. **工作階段儲存區（`sessions.json`）**
   - 鍵值對映：`sessionKey -> SessionEntry`
   - 小型、可變、可安全編輯（或刪除項目）
   - 追蹤工作階段中繼資料（目前工作階段 id、上次活動、切換項、token 計數器等）

2. **對話記錄（`<sessionId>.jsonl`）**
   - 僅附加的樹狀結構對話記錄（項目具有 `id` + `parentId`）
   - 儲存實際對話 + 工具呼叫 + Compaction 摘要
   - 用於為未來回合重建模型上下文
   - 一旦作用中的對話記錄超過檢查點大小上限，就會略過大型 Compaction 前除錯檢查點，避免產生第二份巨大的 `.checkpoint.*.jsonl` 複本。

Gateway 歷史讀取器應避免實體化整份對話記錄，除非該介面明確需要任意歷史存取。第一頁歷史、嵌入式聊天記錄、重新啟動復原，以及 token/用量檢查都使用有界尾端讀取。完整對話記錄掃描會透過非同步對話記錄索引執行，該索引依檔案路徑加上 `mtimeMs`/`size` 快取，並在並行讀取器之間共用。

---

## 磁碟位置

在 Gateway 主機上，每個 agent：

- 儲存區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 對話記錄：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 會透過 `src/config/sessions.ts` 解析這些路徑。

---

## 儲存區維護與磁碟控制

工作階段持久化針對 `sessions.json`、對話記錄成品，以及 trajectory sidecar 具有自動維護控制（`session.maintenance`）：

- `mode`：`warn`（預設）或 `enforce`
- `pruneAfter`：過期項目的年齡截止值（預設 `30d`）
- `maxEntries`：`sessions.json` 中的項目上限（預設 `500`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 對話記錄封存的保留期限（預設：與 `pruneAfter` 相同；`false` 會停用清理）
- `maxDiskBytes`：選用的工作階段目錄預算
- `highWaterBytes`：清理後的選用目標（預設為 `maxDiskBytes` 的 `80%`）

一般 Gateway 寫入會流經每個儲存區的工作階段寫入器，該寫入器會序列化程序內突變，而不取得執行階段檔案鎖。熱路徑修補輔助程式會在持有該寫入器槽位時借用已驗證的可變快取，因此大型 `sessions.json` 檔案不會為每次中繼資料更新而被複製或重新讀取。執行階段程式碼應優先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`；直接儲存整個儲存區是相容性和離線維護工具。當 Gateway 可連線時，非 dry-run 的 `openclaw sessions cleanup` 和 `openclaw agents delete` 會將儲存區突變委派給 Gateway，讓清理加入同一個寫入器佇列；`--store <path>` 是直接檔案維護的明確離線修復路徑。`maxEntries` 清理對生產規模上限仍會批次處理，因此儲存區可能會短暫超過設定的上限，直到下一次高水位清理將其重寫回上限以下。工作階段儲存區讀取不會在 Gateway 啟動期間修剪或限制項目；請使用寫入或 `openclaw sessions cleanup --enforce` 進行清理。即使未設定磁碟預算，`openclaw sessions cleanup --enforce` 仍會立即套用設定的上限，並修剪舊的未參照對話記錄、檢查點和 trajectory 成品。

維護會保留持久的外部對話指標，例如群組工作階段和以執行緒為範圍的聊天工作階段，但 cron、hook、Heartbeat、ACP 和 sub-agent 的合成執行階段項目在超過設定的年齡、數量或磁碟預算時仍可被移除。

OpenClaw 不再於 Gateway 寫入期間建立自動 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，`openclaw doctor --fix` 會將其從較舊的設定中移除。

對話記錄突變會在對話記錄檔案上使用工作階段寫入鎖。鎖取得會等待最多 `session.writeLock.acquireTimeoutMs`，之後才顯示工作階段忙碌錯誤；預設值為 `60000` 毫秒。只有在慢速機器上合法的準備、清理、Compaction 或對話記錄鏡像工作競爭時間更長時，才提高此值。過期鎖偵測和最大持有時間警告仍是獨立政策。

磁碟預算清理的執行順序（`mode: "enforce"`）：

1. 先移除最舊的已封存、孤立對話記錄或孤立 trajectory 成品。
2. 如果仍高於目標，逐出最舊的工作階段項目及其對話記錄/trajectory 檔案。
3. 持續進行，直到用量等於或低於 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 會報告潛在逐出項目，但不會突變儲存區/檔案。

按需執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 工作階段和執行記錄

隔離的 cron 執行也會建立工作階段項目/對話記錄，且它們有專用的保留控制：

- `cron.sessionRetention`（預設 `24h`）會從工作階段儲存區修剪舊的隔離 cron 執行工作階段（`false` 會停用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 檔案（預設：`2_000_000` 位元組和 `2000` 行）。

當 cron 強制建立新的隔離執行工作階段時，它會在寫入新列之前清理先前的 `cron:<jobId>` 工作階段項目。它會攜帶安全偏好設定，例如 thinking/fast/verbose 設定、標籤，以及明確的使用者選取模型/auth 覆寫。它會捨棄周遭對話上下文，例如 channel/group 路由、傳送或佇列政策、提權、來源，以及 ACP 執行階段繫結，讓全新的隔離執行無法從舊執行繼承過期的傳遞或執行階段權限。

---

## 工作階段鍵（`sessionKey`）

`sessionKey` 會識別你所在的_對話桶_（路由 + 隔離）。

常見模式：

- 主要/直接聊天（每個 agent）：`agent:<agentId>:<mainKey>`（預設 `main`）
- 群組：`agent:<agentId>:<channel>:group:<id>`
- 房間/channel（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆寫）

標準規則記錄在 [/concepts/session](/zh-TW/concepts/session)。

---

## 工作階段 id（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（持續對話的對話記錄檔案）。

經驗法則：

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為 Gateway 主機本地時間上午 4:00）會在重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes` 或舊版 `session.idleMinutes`）會在閒置視窗後有訊息抵達時建立新的 `sessionId`。若同時設定每日與閒置，先到期者優先。
- **系統事件**（Heartbeat、cron 喚醒、exec 通知、Gateway 簿記）可能會突變工作階段列，但不會延長每日/閒置重設的新鮮度。重設輪轉會在建立新提示前，丟棄前一個工作階段的佇列中系統事件通知。
- **父層 fork 政策**會在建立執行緒或 subagent fork 時使用 PI 的作用中分支。如果該分支太大，OpenClaw 會以隔離上下文啟動子項，而不是失敗或繼承無法使用的歷史。大小調整政策是自動的；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。

實作細節：此決策發生於 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 工作階段儲存區 schema（`sessions.json`）

儲存區的值型別是在 `src/config/sessions.ts` 中的 `SessionEntry`。

關鍵欄位（未盡列）：

- `sessionId`：目前的對話記錄 id（除非設定 `sessionFile`，否則檔名會從此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設新鮮度使用此值。舊版列可能會從 JSONL 工作階段標頭衍生此值。
- `lastInteractionAt`：上次真實使用者/channel 互動時間戳；閒置重設新鮮度使用此值，因此 Heartbeat、cron 和 exec 事件不會讓工作階段保持存活。沒有此欄位的舊版列會退回使用復原的工作階段開始時間作為閒置新鮮度。
- `updatedAt`：上次儲存區列突變時間戳，用於列出、修剪和簿記。它不是每日/閒置重設新鮮度的權威依據。
- `sessionFile`：選用的明確對話記錄路徑覆寫
- `chatType`：`direct | group | room`（協助 UI 和傳送政策）
- `provider`、`subject`、`room`、`space`、`displayName`：用於群組/channel 標籤的中繼資料
- 切換項：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每個工作階段覆寫）
- 模型選擇：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 計數器（盡力而為 / 供應商相依）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵完成自動 Compaction 的次數
- `memoryFlushAt`：上次 Compaction 前記憶體 flush 的時間戳
- `memoryFlushCompactionCount`：上次 flush 執行時的 Compaction 計數

儲存區可安全編輯，但 Gateway 是權威：它可能會在工作階段執行時重寫或重新水合項目。

---

## 對話記錄結構（`*.jsonl`）

對話記錄由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

檔案是 JSONL：

- 第一行：工作階段標頭（`type: "session"`，包含 `id`、`cwd`、`timestamp`、選用的 `parentSession`）
- 接著：具有 `id` + `parentId` 的工作階段項目（樹狀結構）

值得注意的項目型別：

- `message`：user/assistant/toolResult 訊息
- `custom_message`：extension 注入且_會_進入模型上下文的訊息（可從 UI 隱藏）
- `custom`：_不會_進入模型上下文的 extension 狀態
- `compaction`：持久化的 Compaction 摘要，含有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：瀏覽樹狀分支時持久化的摘要

OpenClaw 刻意**不會**「修正」對話記錄；Gateway 使用 `SessionManager` 來讀寫它們。

---

## 上下文視窗與追蹤的 token

有兩個不同概念很重要：

1. **模型上下文視窗**：每個模型的硬性上限（模型可見的 token）
2. **工作階段儲存區計數器**：寫入 `sessions.json` 的滾動統計資料（用於 /status 和儀表板）

如果你正在調校限制：

- 上下文視窗來自模型目錄（且可透過設定覆寫）。
- 儲存區中的 `contextTokens` 是執行階段估算/報告值；不要將其視為嚴格保證。

更多資訊請參閱 [/token-use](/zh-TW/reference/token-use)。

---

## Compaction：它是什麼

Compaction 會將較舊的對話摘要成對話記錄中持久化的 `compaction` 項目，並保留最近訊息不變。

Compaction 之後，未來回合會看到：

- Compaction 摘要
- `firstKeptEntryId` 之後的訊息

Compaction 是**持久的**（不同於 session pruning）。請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

## Compaction 區塊邊界與工具配對

當 OpenClaw 將一段很長的轉錄拆成 Compaction 區塊時，會讓
助理工具呼叫與其對應的 `toolResult` 項目保持配對。

- 如果 token 佔比分割點落在工具呼叫與其結果之間，OpenClaw
  會將邊界移到助理工具呼叫訊息，而不是拆開這一對。
- 如果尾端的工具結果區塊原本會讓區塊超過目標大小，
  OpenClaw 會保留該待處理工具區塊，並讓未摘要的尾端維持完整。
- 已中止/錯誤的工具呼叫區塊不會讓待處理分割保持開啟。

---

## 自動 Compaction 發生時機（Pi runtime）

在嵌入式 Pi agent 中，自動 Compaction 會在兩種情況下觸發：

1. **溢出復原**：模型回傳內容溢出錯誤
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`，以及類似的供應商形式變體) → compact → retry。
2. **門檻維護**：在成功完成一輪後，當：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的內容視窗
- `reserveTokens` 是為提示 + 下一次模型輸出保留的餘裕

這些是 Pi runtime 語意（OpenClaw 會消費事件，但由 Pi 決定何時 compact）。

OpenClaw 也可以在開啟下一次執行前觸發預檢本機 Compaction，條件是已設定
`agents.defaults.compaction.maxActiveTranscriptBytes`，且作用中的轉錄檔案達到該大小。
這是針對本機重新開啟成本的檔案大小防護，不是原始歸檔：OpenClaw 仍會執行一般語意
Compaction，且需要 `truncateAfterCompaction`，讓 compact 後的摘要可以成為新的後繼轉錄。

對於嵌入式 Pi 執行，`agents.defaults.compaction.midTurnPrecheck.enabled: true`
會加入可選的工具迴圈防護。當工具結果附加後、下一次模型呼叫前，OpenClaw 會使用與回合開始時相同的預檢
預算邏輯估算提示壓力。如果內容已無法容納，防護不會在 Pi 的 `transformContext` hook 內 compact。
它會發出結構化的回合中預檢訊號，停止目前的提示提交，並讓外層執行迴圈使用既有復原路徑：
在足夠時截斷過大的工具結果，或觸發已設定的 Compaction 模式並重試。此選項預設停用，並可搭配
`default` 與 `safeguard` Compaction 模式運作，包括由供應商支援的 safeguard Compaction。
這與 `maxActiveTranscriptBytes` 獨立：位元組大小防護會在回合開啟前執行，而回合中預檢會在嵌入式 Pi 工具
迴圈稍後、附加新的工具結果後執行。

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

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 會將其調高。
- 預設下限是 `20000` tokens。
- 設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用下限。
- 如果它已經更高，OpenClaw 會保持不變。
- 手動 `/compact` 會遵循明確的 `agents.defaults.compaction.keepRecentTokens`
  並保留 Pi 的近期尾端切點。若沒有明確保留預算，
  手動 Compaction 仍會是硬檢查點，重建的內容會從
  新摘要開始。
- 設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true` 可在新的工具結果後、下一次模型
  呼叫前執行可選工具迴圈預檢。這只是一個觸發器；摘要產生仍使用已設定的
  Compaction 路徑。它與 `maxActiveTranscriptBytes` 獨立，後者是
  回合開始時的作用中轉錄位元組大小防護。
- 將 `agents.defaults.compaction.maxActiveTranscriptBytes` 設為位元組值或
  `"20mb"` 這類字串，可在作用中轉錄變大時、回合開始前執行本機 Compaction。此防護只有在同時啟用
  `truncateAfterCompaction` 時才會生效。保持未設定或設為 `0` 可
  停用。
- 啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，
  OpenClaw 會在 Compaction 後將作用中轉錄輪替為 compact 後的後繼 JSONL。
  舊的完整轉錄會保留為封存，並從 Compaction 檢查點連結，
  而不是就地重寫。

原因：在 Compaction 變得無法避免前，為多回合「內務處理」（例如記憶寫入）留下足夠餘裕。

實作：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 呼叫）。

---

## 可插拔 Compaction 供應商

Plugin 可以透過 Plugin API 上的 `registerCompactionProvider()` 註冊 Compaction 供應商。當 `agents.defaults.compaction.provider` 設為已註冊的供應商 id 時，safeguard Plugin 會將摘要委派給該供應商，而不是使用內建的 `summarizeInStages` 管線。

- `provider`：已註冊 Compaction 供應商 Plugin 的 id。保持未設定則使用預設 LLM 摘要。
- 設定 `provider` 會強制使用 `mode: "safeguard"`。
- 供應商會收到與內建路徑相同的 Compaction 指示與識別碼保留政策。
- safeguard 仍會在供應商輸出後保留近期回合與分割回合的後綴內容。
- 內建 safeguard 摘要會用新訊息重新萃煉先前摘要，
  而不是逐字保留完整的先前摘要。
- safeguard 模式預設啟用摘要品質稽核；設定
  `qualityGuard.enabled: false` 可略過格式不正確輸出時重試的行為。
- 如果供應商失敗或回傳空結果，OpenClaw 會自動退回內建 LLM 摘要。
- 中止/逾時訊號會重新拋出（不會被吞掉），以尊重呼叫端取消。

來源：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 使用者可見介面

你可以透過以下方式觀察 Compaction 與 session 狀態：

- `/status`（在任何聊天 session 中）
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- 詳細模式：`🧹 Auto-compaction complete` + Compaction 次數

---

## 靜默內務處理（`NO_REPLY`）

OpenClaw 支援背景工作的「靜默」回合，讓使用者不會看到中間輸出。

慣例：

- 助理以確切的靜默 token `NO_REPLY` /
  `no_reply` 開始輸出，表示「不要向使用者傳送回覆」。
- OpenClaw 會在傳遞層移除/抑制它。
- 確切靜默 token 抑制不區分大小寫，因此當整個 payload 只是靜默 token 時，`NO_REPLY` 和
  `no_reply` 都算數。
- 這只適用於真正背景/不傳遞的回合；它不是一般可執行使用者請求的捷徑。

自 `2026.1.10` 起，當部分區塊以 `NO_REPLY` 開頭時，OpenClaw 也會抑制**草稿/輸入中串流**，
因此靜默操作不會在回合中途洩漏部分輸出。

---

## Compaction 前「記憶刷新」（已實作）

目標：在自動 Compaction 發生前，執行一個靜默 agentic 回合，將持久狀態寫入磁碟
（例如 agent 工作區中的 `memory/YYYY-MM-DD.md`），讓 Compaction 無法
抹除關鍵內容。

OpenClaw 使用**預門檻刷新**方法：

1. 監控 session 內容使用量。
2. 當它跨過「軟門檻」（低於 Pi 的 Compaction 門檻）時，對 agent 執行靜默
   「立即寫入記憶」指令。
3. 使用確切的靜默 token `NO_REPLY` / `no_reply`，讓使用者看不到
   任何內容。

設定（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（預設：`true`）
- `model`（可選的精確供應商/模型覆寫，用於刷新回合，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（預設：`4000`）
- `prompt`（刷新回合的使用者訊息）
- `systemPrompt`（附加於刷新回合的額外系統提示）

注意事項：

- 預設提示/系統提示包含 `NO_REPLY` 提示，以抑制
  傳遞。
- 設定 `model` 時，刷新回合會使用該模型，而不繼承
  作用中 session 的後援鏈，因此僅本機的內務處理不會靜默
  後援到付費對話模型。
- 刷新會在每個 Compaction 週期執行一次（在 `sessions.json` 中追蹤）。
- 刷新只會針對嵌入式 Pi sessions 執行（CLI 後端會略過）。
- 當 session 工作區為唯讀（`workspaceAccess: "ro"` 或 `"none"`）時，會略過刷新。
- 請參閱 [記憶](/zh-TW/concepts/memory) 了解工作區檔案配置與寫入模式。

Pi 也在 Plugin API 中公開 `session_before_compact` hook，但 OpenClaw 的
刷新邏輯目前位於 Gateway 端。

---

## 疑難排解檢查清單

- Session key 錯誤？從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- 儲存區與轉錄不相符？從 `openclaw status` 確認 Gateway 主機與儲存區路徑。
- Compaction 洗版？檢查：
  - 模型內容視窗（太小）
  - Compaction 設定（`reserveTokens` 對模型視窗而言太高，可能導致更早 Compaction）
  - 工具結果膨脹：啟用/調整 session pruning
- 靜默回合外洩？確認回覆以 `NO_REPLY` 開頭（不區分大小寫的確切 token），且你使用的是包含串流抑制修正的建置版本。

## 相關

- [Session 管理](/zh-TW/concepts/session)
- [Session pruning](/zh-TW/concepts/session-pruning)
- [內容引擎](/zh-TW/concepts/context-engine)
