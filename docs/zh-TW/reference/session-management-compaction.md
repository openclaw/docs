---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿 JSONL 或 sessions.json 欄位
    - 你正在變更自動 Compaction 行為，或新增「Compaction 前」清理作業
    - 你想要實作記憶清除或靜默系統回合
summary: 深入探討：工作階段儲存區 + 逐字記錄、生命週期，以及（自動）Compaction 內部機制
title: 工作階段管理深入解析
x-i18n:
    generated_at: "2026-05-02T02:59:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: efd2fb5157a98cb406c5210d813fa600259dfc559350010a9c070075ac6b28ed
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 端對端管理這些區域的工作階段：

- **工作階段路由**（傳入訊息如何對應到 `sessionKey`）
- **工作階段儲存區**（`sessions.json`）及其追蹤內容
- **逐字稿持久化**（`*.jsonl`）及其結構
- **逐字稿衛生**（執行前針對特定提供者的修正）
- **情境限制**（情境視窗與追蹤的 token）
- **Compaction**（手動與自動 Compaction）以及在何處掛接 Compaction 前置工作
- **靜默內務處理**（不應產生使用者可見輸出的記憶體寫入）

如果你想先查看較高層級的概覽，請從這裡開始：

- [工作階段管理](/zh-TW/concepts/session)
- [Compaction](/zh-TW/concepts/compaction)
- [記憶體概覽](/zh-TW/concepts/memory)
- [記憶體搜尋](/zh-TW/concepts/memory-search)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [逐字稿衛生](/zh-TW/reference/transcript-hygiene)

---

## 真相來源：Gateway

OpenClaw 的設計以單一擁有工作階段狀態的 **Gateway 程序**為核心。

- UI（macOS 應用程式、網頁 Control UI、TUI）應向 Gateway 查詢工作階段清單與 token 計數。
- 在遠端模式中，工作階段檔案位於遠端主機；「檢查你的本機 Mac 檔案」不會反映 Gateway 實際使用的內容。

---

## 兩個持久化層

OpenClaw 會在兩個層中持久化工作階段：

1. **工作階段儲存區（`sessions.json`）**
   - 鍵值對映：`sessionKey -> SessionEntry`
   - 小型、可變、可安全編輯（或刪除項目）
   - 追蹤工作階段中繼資料（目前工作階段 ID、最後活動、切換狀態、token 計數器等）

2. **逐字稿（`<sessionId>.jsonl`）**
   - 具有樹狀結構的僅附加逐字稿（項目包含 `id` + `parentId`）
   - 儲存實際對話、工具呼叫、Compaction 摘要
   - 用於為未來回合重建模型情境
   - 一旦作用中的逐字稿超過檢查點大小上限，就會略過大型 Compaction 前除錯檢查點，以避免產生第二份巨大的 `.checkpoint.*.jsonl` 複本。

---

## 磁碟位置

每個代理，在 Gateway 主機上：

- 儲存區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 逐字稿：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 透過 `src/config/sessions.ts` 解析這些位置。

---

## 儲存區維護與磁碟控制

工作階段持久化具備自動維護控制（`session.maintenance`），涵蓋 `sessions.json`、逐字稿產物與軌跡 sidecar：

- `mode`：`warn`（預設）或 `enforce`
- `pruneAfter`：過期項目的年齡截止值（預設 `30d`）
- `maxEntries`：`sessions.json` 中的項目上限（預設 `500`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 逐字稿封存的保留期（預設：與 `pruneAfter` 相同；`false` 會停用清理）
- `maxDiskBytes`：選用的工作階段目錄預算
- `highWaterBytes`：清理後的選用目標（預設為 `maxDiskBytes` 的 `80%`）

一般 Gateway 寫入會針對生產規模上限批次處理 `maxEntries` 清理，因此儲存區可能會短暫超過設定上限，直到下一次高水位清理將其重寫回上限以下。工作階段儲存區讀取不會在 Gateway 啟動期間修剪或限制項目；請使用寫入或 `openclaw sessions cleanup --enforce` 進行清理。`openclaw sessions cleanup --enforce` 仍會立即套用已設定的上限。

OpenClaw 在 Gateway 寫入期間不再建立自動 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，且 `openclaw doctor --fix` 會從舊設定中移除它。

磁碟預算清理的執行順序（`mode: "enforce"`）：

1. 先移除最舊的封存、孤立逐字稿或孤立軌跡產物。
2. 如果仍高於目標，逐出最舊的工作階段項目及其逐字稿/軌跡檔案。
3. 持續進行，直到使用量等於或低於 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 會回報可能逐出的項目，但不會修改儲存區/檔案。

視需要執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 工作階段與執行記錄

隔離的 cron 執行也會建立工作階段項目/逐字稿，且有專用的保留控制：

- `cron.sessionRetention`（預設 `24h`）會從工作階段儲存區修剪舊的隔離 cron 執行工作階段（`false` 會停用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 檔案（預設：`2_000_000` 位元組與 `2000` 行）。

當 cron 強制建立新的隔離執行工作階段時，會在寫入新列之前清理先前的 `cron:<jobId>` 工作階段項目。它會保留安全偏好設定，例如 thinking/fast/verbose 設定、標籤，以及使用者明確選取的模型/驗證覆寫。它會丟棄周遭對話情境，例如頻道/群組路由、傳送或佇列策略、提升權限、來源，以及 ACP 執行期繫結，讓新的隔離執行不會從舊執行繼承過期的傳遞或執行期權限。

---

## 工作階段鍵（`sessionKey`）

`sessionKey` 會識別你所在的_對話分區_（路由 + 隔離）。

常見模式：

- 主要/直接聊天（每個代理）：`agent:<agentId>:<mainKey>`（預設 `main`）
- 群組：`agent:<agentId>:<channel>:group:<id>`
- 房間/頻道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆寫）

標準規則記錄於 [/concepts/session](/zh-TW/concepts/session)。

---

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（延續對話的逐字稿檔案）。

經驗法則：

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為 Gateway 主機本地時間上午 4:00）會在跨過重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes` 或舊版 `session.idleMinutes`）會在閒置視窗後有訊息抵達時建立新的 `sessionId`。當每日與閒置都已設定時，先到期者優先。
- **系統事件**（Heartbeat、cron 喚醒、exec 通知、Gateway 簿記）可能會修改工作階段列，但不會延展每日/閒置重設的新鮮度。重設輪替會在建立新的提示前，丟棄先前工作階段的已佇列系統事件通知。
- **執行緒父系分支保護**（`session.parentForkMaxTokens`，預設 `100000`）會在父工作階段已過大時略過父逐字稿分支；新執行緒會從全新狀態開始。設為 `0` 可停用。

實作細節：決策發生在 `src/auto-reply/reply/session.ts` 的 `initSessionState()`。

---

## 工作階段儲存區結構描述（`sessions.json`）

儲存區的值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。

關鍵欄位（非完整清單）：

- `sessionId`：目前逐字稿 ID（除非設定了 `sessionFile`，否則檔名會由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設新鮮度使用此欄位。舊版列可從 JSONL 工作階段標頭衍生它。
- `lastInteractionAt`：最後一次真實使用者/頻道互動時間戳；閒置重設新鮮度使用此欄位，因此 Heartbeat、cron 與 exec 事件不會讓工作階段保持存活。沒有此欄位的舊版列，會退回使用復原的工作階段開始時間來判定閒置新鮮度。
- `updatedAt`：最後一次儲存區列修改時間戳，用於清單、修剪與簿記。它不是每日/閒置重設新鮮度的權威來源。
- `sessionFile`：選用的明確逐字稿路徑覆寫
- `chatType`：`direct | group | room`（協助 UI 與傳送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：群組/頻道標籤的中繼資料
- 切換項：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每個工作階段的覆寫）
- 模型選擇：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 計數器（盡力而為/取決於提供者）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵完成自動 Compaction 的次數
- `memoryFlushAt`：最後一次 Compaction 前記憶體 flush 的時間戳
- `memoryFlushCompactionCount`：上次 flush 執行時的 Compaction 計數

儲存區可安全編輯，但 Gateway 才是權威：它可能會在工作階段執行時重寫或重新補水項目。

---

## 逐字稿結構（`*.jsonl`）

逐字稿由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

檔案是 JSONL：

- 第一行：工作階段標頭（`type: "session"`，包含 `id`、`cwd`、`timestamp`、選用的 `parentSession`）
- 接著：包含 `id` + `parentId` 的工作階段項目（樹狀結構）

值得注意的項目型別：

- `message`：使用者/助理/工具結果訊息
- `custom_message`：由延伸功能注入、_會_進入模型情境的訊息（可從 UI 隱藏）
- `custom`：_不會_進入模型情境的延伸功能狀態
- `compaction`：已持久化的 Compaction 摘要，包含 `firstKeptEntryId` 與 `tokensBefore`
- `branch_summary`：導覽樹狀分支時持久化的摘要

OpenClaw 刻意**不會**「修正」逐字稿；Gateway 會使用 `SessionManager` 讀寫它們。

---

## 情境視窗與追蹤的 token

有兩個不同概念很重要：

1. **模型情境視窗**：每個模型的硬性上限（模型可見的 token）
2. **工作階段儲存區計數器**：寫入 `sessions.json` 的滾動統計資料（用於 /status 與儀表板）

如果你正在調整限制：

- 情境視窗來自模型目錄（且可透過設定覆寫）。
- 儲存區中的 `contextTokens` 是執行期估計/回報值；不要將其視為嚴格保證。

更多資訊請參閱 [/token-use](/zh-TW/reference/token-use)。

---

## Compaction：它是什麼

Compaction 會將較舊的對話摘要成逐字稿中持久化的 `compaction` 項目，並保留近期訊息不變。

Compaction 後，未來回合會看到：

- Compaction 摘要
- `firstKeptEntryId` 之後的訊息

Compaction 是**持久化的**（不同於工作階段修剪）。請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

## Compaction 區塊邊界與工具配對

當 OpenClaw 將長逐字稿拆分成 Compaction 區塊時，會讓助理工具呼叫與其對應的 `toolResult` 項目保持配對。

- 如果 token 占比拆分點落在工具呼叫與其結果之間，OpenClaw 會將邊界移到助理工具呼叫訊息，而不是拆開該配對。
- 如果尾端的工具結果區塊原本會讓區塊超過目標，OpenClaw 會保留該待處理工具區塊，並保持未摘要的尾端完整。
- 已中止/錯誤的工具呼叫區塊不會維持待處理拆分開啟。

---

## 自動 Compaction 發生時機（Pi 執行期）

在嵌入式 Pi 代理中，自動 Compaction 會在兩種情況觸發：

1. **溢位復原**：模型回傳情境溢位錯誤
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及類似的提供者形式變體）→ compact → retry。
2. **閾值維護**：成功完成一回合後，當：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的情境視窗
- `reserveTokens` 是保留給提示與下一次模型輸出的餘裕

這些是 Pi 執行期語意（OpenClaw 會消費事件，但由 Pi 決定何時執行 Compaction）。

OpenClaw 也可以在開啟下一次執行前觸發預檢本機 Compaction，前提是已設定 `agents.defaults.compaction.maxActiveTranscriptBytes`，且作用中逐字稿檔案達到該大小。這是針對本機重新開啟成本的檔案大小保護，而不是原始封存：OpenClaw 仍會執行一般語意 Compaction，且它需要 `truncateAfterCompaction`，如此壓縮後的摘要才能成為新的後繼逐字稿。

對於嵌入式 Pi 執行，`agents.defaults.compaction.midTurnPrecheck.enabled: true`
會加入一個選擇啟用的工具迴圈防護。工具結果附加後、下一次模型呼叫前，
OpenClaw 會使用與回合開始時相同的預檢預算邏輯估算提示壓力。如果上下文
已無法容納，防護不會在 Pi 的 `transformContext` hook 內執行 Compaction。
它會引發結構化的回合中預檢訊號、停止目前的提示提交，並讓外層執行迴圈
使用既有復原路徑：在足夠時截斷過大的工具結果，或觸發已設定的 Compaction
模式並重試。此選項預設停用，並同時支援 `default` 與 `safeguard`
Compaction 模式，包括由供應商支援的 safeguard Compaction。
這與 `maxActiveTranscriptBytes` 無關：位元組大小防護會在回合開始前執行，
而回合中預檢會在新的工具結果已附加後，於嵌入式 Pi 工具迴圈稍後執行。

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
- 預設下限是 `20000` 個權杖。
- 設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用此下限。
- 如果它已經更高，OpenClaw 會保持不變。
- 手動 `/compact` 會遵循明確的 `agents.defaults.compaction.keepRecentTokens`
  並保留 Pi 的近期尾端切點。若沒有明確的保留預算，
  手動 Compaction 仍會是硬性檢查點，重建後的上下文會從
  新摘要開始。
- 設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`，即可在新的工具結果後、
  下一次模型呼叫前執行可選的工具迴圈預檢。這只是一個觸發器；
  摘要產生仍會使用已設定的 Compaction 路徑。它與
  `maxActiveTranscriptBytes` 無關，後者是回合開始時的作用中逐字稿位元組大小防護。
- 將 `agents.defaults.compaction.maxActiveTranscriptBytes` 設為位元組值或
  字串（例如 `"20mb"`），即可在作用中逐字稿變大時，於回合前執行本機 Compaction。
  此防護只有在 `truncateAfterCompaction` 也啟用時才會作用。保留未設定或設為 `0`
  可停用。
- 啟用 `agents.defaults.compaction.truncateAfterCompaction` 時，
  OpenClaw 會在 Compaction 後將作用中逐字稿輪替到壓縮後的後繼 JSONL。
  舊的完整逐字稿會保留封存，並從 Compaction 檢查點連結，而不是在原處重寫。

原因：在 Compaction 變得不可避免之前，為多回合「內務處理」（例如記憶寫入）保留足夠餘裕。

實作：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 呼叫）。

---

## 可插拔的 Compaction 供應商

Plugin 可透過 Plugin API 上的 `registerCompactionProvider()` 註冊 Compaction 供應商。當 `agents.defaults.compaction.provider` 設為已註冊的供應商 id 時，safeguard Plugin 會將摘要委派給該供應商，而不是內建的 `summarizeInStages` 管線。

- `provider`：已註冊 Compaction 供應商 Plugin 的 id。保持未設定會使用預設 LLM 摘要。
- 設定 `provider` 會強制使用 `mode: "safeguard"`。
- 供應商會收到與內建路徑相同的 Compaction 指令與識別碼保留政策。
- safeguard 仍會在供應商輸出後保留近期回合與分割回合的後綴上下文。
- 內建 safeguard 摘要會使用新訊息重新萃煉先前摘要，
  而不是逐字保留完整的先前摘要。
- safeguard 模式預設啟用摘要品質稽核；設定
  `qualityGuard.enabled: false` 可略過格式錯誤輸出時重試的行為。
- 如果供應商失敗或傳回空結果，OpenClaw 會自動回退到內建 LLM 摘要。
- 中止/逾時訊號會被重新拋出（不會被吞掉），以尊重呼叫端取消。

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

OpenClaw 支援背景任務的「靜默」回合，這類任務不應讓使用者看到中間輸出。

慣例：

- 助理以精確的靜默權杖 `NO_REPLY` /
  `no_reply` 開始輸出，用來表示「不要向使用者傳遞回覆」。
- OpenClaw 會在傳遞層移除/抑制它。
- 精確靜默權杖抑制不區分大小寫，因此當整個承載內容只有靜默權杖時，
  `NO_REPLY` 與 `no_reply` 都會被視為符合。
- 這僅適用於真正的背景/不傳遞回合；它不是一般可執行使用者請求的捷徑。

自 `2026.1.10` 起，當部分區塊以 `NO_REPLY` 開頭時，OpenClaw 也會抑制
**草稿/輸入中串流**，因此靜默操作不會在回合中洩漏部分輸出。

---

## Compaction 前的「記憶清空」（已實作）

目標：在自動 Compaction 發生前，執行一個靜默的代理式回合，將持久
狀態寫入磁碟（例如代理工作區中的 `memory/YYYY-MM-DD.md`），讓 Compaction 無法
抹除關鍵上下文。

OpenClaw 使用 **預閾值清空** 方法：

1. 監控工作階段上下文使用量。
2. 當它跨過「軟閾值」（低於 Pi 的 Compaction 閾值）時，對代理執行一個靜默的
   「立即寫入記憶」指令。
3. 使用精確的靜默權杖 `NO_REPLY` / `no_reply`，讓使用者看不到
   任何內容。

設定（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（預設：`true`）
- `model`（可選的精確供應商/模型覆寫，用於清空回合，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（預設：`4000`）
- `prompt`（清空回合的使用者訊息）
- `systemPrompt`（附加於清空回合的額外系統提示）

注意事項：

- 預設提示/系統提示包含 `NO_REPLY` 提示，以抑制
  傳遞。
- 設定 `model` 時，清空回合會使用該模型，而不繼承
  作用中工作階段的回退鏈，因此僅限本機的內務處理不會悄悄
  回退到付費對話模型。
- 清空會在每個 Compaction 週期執行一次（追蹤於 `sessions.json`）。
- 清空只會針對嵌入式 Pi 工作階段執行（CLI 後端會略過）。
- 當工作階段工作區是唯讀時（`workspaceAccess: "ro"` 或 `"none"`），會略過清空。
- 請參閱 [Memory](/zh-TW/concepts/memory) 了解工作區檔案配置與寫入模式。

Pi 也在 Plugin API 中公開 `session_before_compact` hook，但 OpenClaw 的
清空邏輯目前位於 Gateway 端。

---

## 疑難排解檢查清單

- 工作階段金鑰錯誤？從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- 儲存區與逐字稿不一致？從 `openclaw status` 確認 Gateway 主機與儲存區路徑。
- Compaction 垃圾訊息？檢查：
  - 模型上下文視窗（太小）
  - Compaction 設定（`reserveTokens` 對模型視窗而言太高，可能導致更早 Compaction）
  - 工具結果膨脹：啟用/調整工作階段修剪
- 靜默回合外洩？確認回覆以 `NO_REPLY` 開頭（不區分大小寫的精確權杖），且你使用的建置包含串流抑制修正。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [上下文引擎](/zh-TW/concepts/context-engine)
