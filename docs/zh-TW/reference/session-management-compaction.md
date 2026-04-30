---
read_when:
    - 你需要偵錯工作階段 ID、transcript JSONL 或 sessions.json 欄位
    - 你正在變更自動 Compaction 行為，或新增「預先 Compaction」清理作業
    - 你想實作記憶清除或靜默系統回合
summary: 深入解析：工作階段儲存區 + 對話記錄、生命週期與（自動）Compaction 內部機制
title: 工作階段管理深入探討
x-i18n:
    generated_at: "2026-04-30T16:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 會在以下領域端對端管理工作階段：

- **工作階段路由**（傳入訊息如何對應到 `sessionKey`）
- **工作階段儲存區**（`sessions.json`）及其追蹤內容
- **轉錄稿持久化**（`*.jsonl`）及其結構
- **轉錄稿衛生處理**（執行前的供應商特定修正）
- **上下文限制**（上下文視窗與追蹤的權杖）
- **Compaction**（手動與自動 Compaction）以及在哪裡掛接 Compaction 前作業
- **靜默內務處理**（不應產生使用者可見輸出的記憶體寫入）

如果你想先閱讀較高層次的概觀，請從這裡開始：

- [工作階段管理](/zh-TW/concepts/session)
- [Compaction](/zh-TW/concepts/compaction)
- [記憶體概觀](/zh-TW/concepts/memory)
- [記憶體搜尋](/zh-TW/concepts/memory-search)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [轉錄稿衛生處理](/zh-TW/reference/transcript-hygiene)

---

## 真實來源：Gateway

OpenClaw 圍繞單一擁有工作階段狀態的 **Gateway 程序**設計。

- 使用者介面（macOS 應用程式、網頁控制介面、TUI）應向 Gateway 查詢工作階段清單與權杖計數。
- 在遠端模式中，工作階段檔案位於遠端主機；「檢查你的本機 Mac 檔案」不會反映 Gateway 實際使用的內容。

---

## 兩個持久化層

OpenClaw 會在兩層中持久化工作階段：

1. **工作階段儲存區（`sessions.json`）**
   - 鍵值對應：`sessionKey -> SessionEntry`
   - 小型、可變、可安全編輯（或刪除項目）
   - 追蹤工作階段中繼資料（目前工作階段 ID、最後活動時間、切換項、權杖計數器等）

2. **轉錄稿（`<sessionId>.jsonl`）**
   - 具有樹狀結構的僅附加轉錄稿（項目具有 `id` + `parentId`）
   - 儲存實際對話 + 工具呼叫 + Compaction 摘要
   - 用於在未來回合重建模型上下文
   - 一旦作用中轉錄稿超過檢查點大小上限，就會略過大型 Compaction 前除錯檢查點，避免再建立第二份巨大的 `.checkpoint.*.jsonl` 複本。

---

## 磁碟位置

在 Gateway 主機上，依代理程式區分：

- 儲存區：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 轉錄稿：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主題工作階段：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 透過 `src/config/sessions.ts` 解析這些路徑。

---

## 儲存區維護與磁碟控制

工作階段持久化具備自動維護控制（`session.maintenance`），適用於 `sessions.json`、轉錄稿成品與軌跡附屬檔：

- `mode`：`warn`（預設）或 `enforce`
- `pruneAfter`：陳舊項目年齡截點（預設 `30d`）
- `maxEntries`：限制 `sessions.json` 中的項目數（預設 `500`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 轉錄稿封存的保留時間（預設：與 `pruneAfter` 相同；`false` 會停用清理）
- `maxDiskBytes`：選用的工作階段目錄預算
- `highWaterBytes`：清理後的選用目標（預設為 `maxDiskBytes` 的 `80%`）

一般 Gateway 寫入會針對生產規模上限批次處理 `maxEntries` 清理，因此在下一次高水位清理將儲存區重新寫回上限之前，儲存區可能會短暫超過設定的上限。`openclaw sessions cleanup --enforce` 仍會立即套用已設定的上限。

OpenClaw 不再於 Gateway 寫入期間自動建立 `sessions.json.bak.*` 輪替備份。舊版 `session.maintenance.rotateBytes` 鍵會被忽略，`openclaw doctor --fix` 會將其從較舊設定中移除。

磁碟預算清理的執行順序（`mode: "enforce"`）：

1. 先移除最舊的封存、孤立轉錄稿或孤立軌跡成品。
2. 如果仍高於目標，淘汰最舊的工作階段項目及其轉錄稿/軌跡檔案。
3. 持續進行直到用量等於或低於 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 會回報可能的淘汰項目，但不會變更儲存區/檔案。

視需要執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 工作階段與執行記錄

隔離的 Cron 執行也會建立工作階段項目/轉錄稿，並且有專用的保留控制：

- `cron.sessionRetention`（預設 `24h`）會從工作階段儲存區修剪舊的隔離 Cron 執行工作階段（`false` 會停用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 會修剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 檔案（預設：`2_000_000` 位元組與 `2000` 行）。

當 Cron 強制建立新的隔離執行工作階段時，會在寫入新列之前清理先前的 `cron:<jobId>` 工作階段項目。它會帶入安全的偏好設定，例如思考/快速/詳細設定、標籤，以及使用者明確選取的模型/驗證覆寫。它會捨棄環境對話上下文，例如頻道/群組路由、傳送或佇列策略、提權、來源，以及 ACP 執行階段繫結，讓全新的隔離執行不會從較舊執行繼承過期的傳遞或執行階段權限。

---

## 工作階段鍵（`sessionKey`）

`sessionKey` 會識別你所在的_對話容器_（路由 + 隔離）。

常見模式：

- 主要/直接聊天（依代理程式）：`agent:<agentId>:<mainKey>`（預設 `main`）
- 群組：`agent:<agentId>:<channel>:group:<id>`
- 房間/頻道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆寫）

標準規則記錄於 [/concepts/session](/zh-TW/concepts/session)。

---

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（延續對話的轉錄稿檔案）。

經驗法則：

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為 Gateway 主機本地時間上午 4:00）會在越過重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes` 或舊版 `session.idleMinutes`）會在閒置視窗後有訊息抵達時建立新的 `sessionId`。當每日與閒置兩者皆已設定時，以先到期者為準。
- **系統事件**（Heartbeat、Cron 喚醒、exec 通知、Gateway 簿記）可能會變更工作階段列，但不會延長每日/閒置重設的新鮮度。重設輪替會在建立全新提示前，捨棄上一個工作階段的已佇列系統事件通知。
- **執行緒父項分叉防護**（`session.parentForkMaxTokens`，預設 `100000`）會在父工作階段已經過大時略過父轉錄稿分叉；新執行緒會全新開始。設為 `0` 可停用。

實作細節：決策發生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 工作階段儲存區結構描述（`sessions.json`）

儲存區的值型別是 `src/config/sessions.ts` 中的 `SessionEntry`。

主要欄位（非完整清單）：

- `sessionId`：目前轉錄稿 ID（除非已設定 `sessionFile`，否則檔名會由此衍生）
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳；每日重設新鮮度會使用此值。舊版列可能會從 JSONL 工作階段標頭衍生此值。
- `lastInteractionAt`：最後一次真實使用者/頻道互動時間戳；閒置重設新鮮度會使用此值，因此 Heartbeat、Cron 與 exec 事件不會讓工作階段保持存活。沒有此欄位的舊版列會退回使用復原出的工作階段開始時間作為閒置新鮮度。
- `updatedAt`：最後一次儲存區列變更時間戳，用於列出、修剪與簿記。它不是每日/閒置重設新鮮度的依據。
- `sessionFile`：選用的明確轉錄稿路徑覆寫
- `chatType`：`direct | group | room`（協助使用者介面與傳送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：群組/頻道標籤中繼資料
- 切換項：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每工作階段覆寫）
- 模型選擇：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- 權杖計數器（最佳努力 / 依供應商而定）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段鍵完成自動 Compaction 的次數
- `memoryFlushAt`：上一次 Compaction 前記憶體排清的時間戳
- `memoryFlushCompactionCount`：上一次排清執行時的 Compaction 計數

儲存區可以安全編輯，但 Gateway 才是權威：它可能會在工作階段執行時重寫或重新補水項目。

---

## 轉錄稿結構（`*.jsonl`）

轉錄稿由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

檔案是 JSONL：

- 第一行：工作階段標頭（`type: "session"`，包含 `id`、`cwd`、`timestamp`、選用的 `parentSession`）
- 接著：具有 `id` + `parentId` 的工作階段項目（樹狀）

值得注意的項目型別：

- `message`：使用者/助理/toolResult 訊息
- `custom_message`：擴充功能注入、_會_進入模型上下文的訊息（可從使用者介面隱藏）
- `custom`：_不會_進入模型上下文的擴充功能狀態
- `compaction`：持久化的 Compaction 摘要，包含 `firstKeptEntryId` 與 `tokensBefore`
- `branch_summary`：瀏覽樹狀分支時持久化的摘要

OpenClaw 刻意**不會**「修正」轉錄稿；Gateway 使用 `SessionManager` 讀寫它們。

---

## 上下文視窗與追蹤的權杖

有兩個不同概念很重要：

1. **模型上下文視窗**：每個模型的硬性上限（模型可見的權杖）
2. **工作階段儲存區計數器**：寫入 `sessions.json` 的滾動統計（用於 /status 與儀表板）

如果你正在調整限制：

- 上下文視窗來自模型目錄（且可透過設定覆寫）。
- 儲存區中的 `contextTokens` 是執行階段估算/回報值；不要把它視為嚴格保證。

更多資訊請見 [/token-use](/zh-TW/reference/token-use)。

---

## Compaction：它是什麼

Compaction 會將較舊對話摘要成轉錄稿中持久化的 `compaction` 項目，並保留近期訊息不變。

Compaction 之後，未來回合會看到：

- Compaction 摘要
- `firstKeptEntryId` 之後的訊息

Compaction 是**持久化**的（不同於工作階段修剪）。請見 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

## Compaction 區塊邊界與工具配對

當 OpenClaw 將長轉錄稿拆分成 Compaction 區塊時，會讓助理工具呼叫與其對應的 `toolResult` 項目保持配對。

- 如果依權杖占比的切分點落在工具呼叫與其結果之間，OpenClaw 會將邊界移到助理工具呼叫訊息，而不是拆開這一對。
- 如果尾端工具結果區塊原本會讓區塊超過目標，OpenClaw 會保留該待處理工具區塊，並保持未摘要的尾端不變。
- 已中止/錯誤的工具呼叫區塊不會讓待處理切分保持開啟。

---

## 自動 Compaction 何時發生（Pi 執行階段）

在嵌入式 Pi 代理程式中，自動 Compaction 會在兩種情況下觸發：

1. **溢位復原**：模型傳回上下文溢位錯誤（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及類似供應商形式的變體）→ compact → retry。
2. **閾值維護**：成功完成一回合後，當：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文視窗
- `reserveTokens` 是為提示 + 下一次模型輸出預留的餘裕

這些是 Pi 執行階段語意（OpenClaw 會消費事件，但由 Pi 決定何時進行 Compaction）。

當 `agents.defaults.compaction.maxActiveTranscriptBytes` 已設定，且作用中轉錄稿檔案達到該大小時，OpenClaw 也可以在開啟下一次執行前觸發預檢本機 Compaction。這是針對本機重新開啟成本的檔案大小防護，而不是原始封存：OpenClaw 仍會執行一般語意 Compaction，並且它需要 `truncateAfterCompaction`，讓壓縮摘要能成為新的後繼轉錄稿。

針對嵌入式 Pi 執行，`agents.defaults.compaction.midTurnPrecheck.enabled: true`
會加入一個可選用的工具迴圈防護機制。在附加工具結果後、下一次
模型呼叫前，OpenClaw 會使用與回合開始時相同的預檢預算邏輯來估算
提示壓力。如果內容已無法容納，該防護機制不會在 Pi 的 `transformContext`
hook 內執行 compact。它會發出結構化的回合中預檢訊號、停止目前的提示提交，
並讓外層執行迴圈使用既有的復原路徑：在足夠時截斷過大的工具結果，
或觸發已設定的 Compaction 模式並重試。此選項預設停用，並可搭配
`default` 與 `safeguard` 兩種 Compaction 模式使用，包括由 provider 支援的
safeguard Compaction。
這與 `maxActiveTranscriptBytes` 無關：位元組大小防護會在回合開始前執行，
而回合中預檢則是在新的工具結果被附加後，於嵌入式 Pi 工具迴圈中稍後執行。

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

OpenClaw 也會針對嵌入式執行強制套用安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 會將它調高。
- 預設下限是 `20000` tokens。
- 設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用下限。
- 如果它已經更高，OpenClaw 會維持不變。
- 手動 `/compact` 會遵循明確的 `agents.defaults.compaction.keepRecentTokens`
  並保留 Pi 的近期尾端切點。若未明確設定保留預算，
  手動 Compaction 仍會是硬檢查點，且重建後的內容會從
  新摘要開始。
- 設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`，可在新的工具結果後、
  下一次模型呼叫前執行可選用的工具迴圈預檢。這只是一個觸發條件；
  摘要產生仍會使用已設定的 Compaction 路徑。它與 `maxActiveTranscriptBytes`
  無關，後者是回合開始時的作用中逐字稿位元組大小防護。
- 將 `agents.defaults.compaction.maxActiveTranscriptBytes` 設為位元組值或
  例如 `"20mb"` 的字串，可在作用中逐字稿變大時，於回合開始前執行本機
  Compaction。此防護僅在 `truncateAfterCompaction` 也啟用時才會作用。
  保持未設定或設為 `0` 即可停用。
- 當 `agents.defaults.compaction.truncateAfterCompaction` 啟用時，
  OpenClaw 會在 Compaction 後，將作用中逐字稿輪替到 compact 後的後續 JSONL。
  舊的完整逐字稿會保留封存，並從 Compaction 檢查點連結，
  而不是在原處被重寫。

原因：在 Compaction 變得不可避免之前，為多回合「內務處理」（例如記憶寫入）保留足夠餘裕。

實作：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 呼叫）。

---

## 可插拔的 Compaction provider

Plugin 可透過 Plugin API 上的 `registerCompactionProvider()` 註冊 Compaction provider。當 `agents.defaults.compaction.provider` 設為已註冊的 provider id 時，safeguard Plugin 會將摘要委派給該 provider，而不是使用內建的 `summarizeInStages` pipeline。

- `provider`：已註冊 Compaction provider Plugin 的 id。保持未設定則使用預設 LLM 摘要。
- 設定 `provider` 會強制使用 `mode: "safeguard"`。
- provider 會收到與內建路徑相同的 Compaction 指示和識別碼保留政策。
- safeguard 在 provider 輸出後，仍會保留近期回合與分割回合的尾端內容。
- 內建 safeguard 摘要會用新訊息重新萃取先前摘要，
  而不是逐字保留完整的前一份摘要。
- safeguard 模式預設啟用摘要品質稽核；設定
  `qualityGuard.enabled: false` 可略過輸出格式不正確時重試的行為。
- 如果 provider 失敗或回傳空結果，OpenClaw 會自動退回使用內建 LLM 摘要。
- 中止／逾時訊號會重新拋出（不會被吞掉），以尊重呼叫端取消。

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

OpenClaw 支援背景工作使用的「靜默」回合，使用者不應看到中間輸出。

慣例：

- assistant 以精確的靜默 token `NO_REPLY` /
  `no_reply` 開始其輸出，表示「不要將回覆傳遞給使用者」。
- OpenClaw 會在傳遞層剝除／抑制它。
- 精確靜默 token 抑制不區分大小寫，因此當整個 payload 只有靜默 token 時，
  `NO_REPLY` 與 `no_reply` 都會算數。
- 這僅適用於真正的背景／不傳遞回合；它不是一般可執行使用者請求的捷徑。

自 `2026.1.10` 起，當部分 chunk 以 `NO_REPLY` 開頭時，OpenClaw 也會抑制
**草稿／輸入中串流**，因此靜默操作不會在回合中洩漏部分輸出。

---

## Compaction 前「記憶 flush」（已實作）

目標：在自動 Compaction 發生前，執行一個靜默 agentic 回合，將持久狀態
寫入磁碟（例如 agent 工作區中的 `memory/YYYY-MM-DD.md`），讓 Compaction 不會
抹除關鍵內容。

OpenClaw 使用 **預閾值 flush** 方法：

1. 監控工作階段內容使用量。
2. 當它跨過「軟閾值」（低於 Pi 的 Compaction 閾值）時，對 agent 執行靜默的
   「立即寫入記憶」指令。
3. 使用精確的靜默 token `NO_REPLY` / `no_reply`，讓使用者不會看到
   任何內容。

設定（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（預設：`true`）
- `model`（可選的精確 provider/model flush 回合覆寫，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（預設：`4000`）
- `prompt`（flush 回合的使用者訊息）
- `systemPrompt`（為 flush 回合附加的額外系統提示）

注意：

- 預設提示／系統提示包含 `NO_REPLY` 提示，以抑制
  傳遞。
- 設定 `model` 時，flush 回合會使用該模型，而不繼承
  作用中工作階段的 fallback 鏈，因此僅限本機的內務處理不會靜默地
  fallback 到付費對話模型。
- 每個 Compaction 週期只會執行一次 flush（在 `sessions.json` 中追蹤）。
- flush 僅會針對嵌入式 Pi 工作階段執行（CLI 後端會略過）。
- 當工作階段工作區為唯讀時（`workspaceAccess: "ro"` 或 `"none"`），會略過 flush。
- 請參閱 [記憶](/zh-TW/concepts/memory) 了解工作區檔案配置與寫入模式。

Pi 也在 Plugin API 中公開了 `session_before_compact` hook，但 OpenClaw 的
flush 邏輯目前位於 Gateway 端。

---

## 疑難排解檢查清單

- 工作階段 key 錯誤？從 [/concepts/session](/zh-TW/concepts/session) 開始，並確認 `/status` 中的 `sessionKey`。
- 儲存區與逐字稿不一致？從 `openclaw status` 確認 Gateway 主機與儲存區路徑。
- Compaction 過於頻繁？檢查：
  - 模型內容視窗（太小）
  - Compaction 設定（`reserveTokens` 對模型視窗而言過高，可能導致更早 Compaction）
  - 工具結果膨脹：啟用／調整工作階段修剪
- 靜默回合外洩？確認回覆以 `NO_REPLY` 開頭（不區分大小寫的精確 token），且你使用的 build 包含串流抑制修正。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [內容引擎](/zh-TW/concepts/context-engine)
