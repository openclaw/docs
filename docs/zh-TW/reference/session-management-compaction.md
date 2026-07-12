---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿事件或工作階段資料列欄位
    - 你正在變更自動壓縮行為，或新增「壓縮前」整理作業
    - 你想要實作記憶體清理或靜默系統回合
summary: 深入解析：工作階段儲存區與對話記錄、生命週期，以及（自動）壓縮的內部機制
title: 工作階段管理深入解析
x-i18n:
    generated_at: "2026-07-12T14:49:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2f06b50dcece64a92c2b35a468910b2069622d14649ab24052a5a7956f9d41d1
    source_path: reference/session-management-compaction.md
    workflow: 16
---

單一 **閘道程序** 端對端擁有工作階段狀態。使用者介面（macOS 應用程式、網頁控制介面、終端介面）會向閘道查詢工作階段清單與權杖數量。在遠端模式下，工作階段檔案位於遠端主機，因此檢查本機 Mac 上的檔案無法反映閘道實際使用的內容。

請先參閱概覽文件：[工作階段管理](/zh-TW/concepts/session)、[壓縮](/zh-TW/concepts/compaction)、[記憶概覽](/zh-TW/concepts/memory)、[記憶搜尋](/zh-TW/concepts/memory-search)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[逐字稿衛生管理](/zh-TW/reference/transcript-hygiene)，完整設定參考請見[代理程式設定](/zh-TW/gateway/config-agents)。

## 兩個持久化層

1. **工作階段資料列（每個代理程式各自的 SQLite）** - 鍵值對應 `sessionKey -> SessionEntry`。由閘道擁有的可變執行階段狀態。追蹤中繼資料：目前的工作階段 ID、最近活動、切換設定、權杖計數器。
2. **逐字稿事件（每個代理程式各自的 SQLite）** - 僅附加、樹狀結構（項目具有 `id` + `parentId`）。儲存對話、工具呼叫與壓縮摘要；為未來的輪次重建模型上下文。壓縮檢查點是已壓縮後繼逐字稿上的中繼資料，新一次壓縮不會寫入第二份 `.checkpoint.*.jsonl` 副本。

較舊的安裝版本可能仍在代理程式的 `sessions/`
目錄下保有 `sessions.json` 檔案。請將這些檔案視為舊版工作階段資料列移轉輸入，或明確的
離線維護目標。閘道啟動與 `openclaw doctor --fix` 會自動將
使用中的舊版資料列與逐字稿歷史匯入每個代理程式各自的 SQLite 儲存區。
需要明確的檢查或驗證證據時，請執行 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`，然後遵循[診斷工具移轉
程序](/zh-TW/cli/doctor#session-sqlite-migration)。如果舊版逐字稿
成品封存後移轉失敗，請使用該程序中的診斷工具復原模式。
復原會使用移轉資訊清單，僅還原受影響且已封存的支援
成品，並在要求時準備經清理的 GitHub 問題回報，且不會
讓使用中的執行階段再次讀取 JSONL 檔案。

除非介面需要任意歷史存取，否則閘道歷史讀取器會避免具現化整份逐字稿。第一頁歷史、內嵌聊天記錄、重新啟動復原，以及權杖／用量檢查，都會從 SQLite 使用有界的尾端讀取。完整逐字稿掃描會透過非同步逐字稿索引進行，並由並行讀取器共用。

## 磁碟位置

每個代理程式在閘道主機上的位置（透過 `src/config/sessions.ts` 解析）：

- 執行階段工作階段資料列儲存區：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 執行階段逐字稿資料列：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 舊版／封存逐字稿成品：`~/.openclaw/agents/<agentId>/sessions/`
- 舊版資料列移轉輸入：`~/.openclaw/agents/<agentId>/sessions/sessions.json`

## 儲存區維護與磁碟控制

`session.maintenance` 控制 SQLite 工作階段資料列、SQLite 逐字稿資料列、封存成品與軌跡附屬檔案的自動維護：

| 鍵                      | 預設值                | 備註                                                                                         |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | 或 `"warn"`（僅回報，不進行變更）                                                            |
| `pruneAfter`            | `"30d"`               | 過期項目的存留時間上限                                                                       |
| `maxEntries`            | `500`                 | 工作階段項目上限                                                                             |
| `resetArchiveRetention` | 保留（無存留時間上限） | `*.reset.*`／`*.deleted.*` 逐字稿封存的存留時間上限；設定持續時間即表示選擇啟用刪除            |
| `maxDiskBytes`          | `2gb`                 | 每個代理程式的工作階段磁碟配額；`false` 表示停用                                              |
| `highWaterBytes`        | `maxDiskBytes` 的 80% | 配額清理後的目標                                                                             |

封存的逐字稿預設會保留，並在執行階段支援時使用 zstd 壓縮（`*.jsonl.<reason>.<timestamp>.zst`），因此刪除或重設工作階段絕不會在未告知的情況下捨棄對話歷史。磁碟配額會先逐出最舊的封存，再處理使用中的工作階段。

SQLite 對 `maxDiskBytes` 的主動強制執行會測量每個工作階段的工作階段資料列 JSON 加上逐字稿事件 JSON 位元組數；舊版離線維護強制執行則會測量所選工作階段目錄中的檔案。

閘道模型執行探測工作階段（符合 `agent:*:explicit:model-run-<uuid>` 的鍵）採用獨立且固定的 `24h` 保留期限。此修剪由壓力條件觸發：只會在達到工作階段項目維護／上限壓力時執行，且只會在全域過期項目清理／上限步驟之前執行。其他明確工作階段不使用此保留期限。

磁碟配額清理的強制執行順序（`mode: "enforce"`）：

1. 先移除最舊的封存逐字稿成品、孤立的舊版成品或孤立的軌跡成品。
2. 如果仍高於目標，逐出最舊的工作階段項目及其逐字稿資料列或軌跡成品。
3. 重複執行，直到用量等於或低於 `highWaterBytes`。

`mode: "warn"` 會回報可能的逐出項目，但不會變更儲存區或檔案。

依需求執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

維護會保留群組工作階段和限定執行緒範圍的聊天工作階段等持久外部對話指標，但合成的執行階段項目（排程、鉤子、心跳偵測、ACP、子代理程式）一旦超出設定的存留時間、數量或磁碟配額，仍可移除。隔離的排程執行使用獨立的 `cron.sessionRetention` 控制，與模型執行探測的保留期限無關。

一般閘道寫入會經過工作階段存取器，由其透過執行階段寫入器路徑，依代理程式序列化 SQLite 變更。執行階段程式碼應優先使用 `src/config/sessions/session-accessor.ts` 中的存取器輔助函式；舊版 `sessions.json` 輔助函式是移轉與離線維護工具。當閘道可連線時，非試執行的 `openclaw sessions cleanup` 和 `openclaw agents delete` 會將儲存區變更委派給閘道，讓清理加入相同的寫入器佇列；`--store <path>` 是針對所選舊版儲存區的明確離線修復路徑，並且一律維持在本機執行（`--dry-run` 也是如此）。針對正式環境規模的儲存區，`maxEntries` 清理會分批進行，因此儲存區可能會短暫超過設定的上限，直到下一次高水位清理將其重寫至上限以下。閘道啟動期間的讀取絕不會修剪項目或套用上限，只有寫入或 `openclaw sessions cleanup --enforce` 才會執行；後者也會立即套用上限，並且即使未設定磁碟配額，也會修剪未被參照的舊版逐字稿、檢查點與軌跡成品。

OpenClaw 在閘道寫入期間不再自動建立 `sessions.json.bak.*` 輪替備份。舊版的 `session.maintenance.rotateBytes` 鍵會被忽略，而 `openclaw doctor --fix` 會從舊設定中移除該鍵。

逐字稿變更會對 SQLite 逐字稿目標使用工作階段寫入佇列：

| 設定                                 | 預設值    | 環境變數覆寫                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` 是鎖定等待多久後會顯示工作階段忙碌錯誤並放棄；只有在較慢機器上，正當的準備、清理、壓縮或逐字稿鏡像作業競爭鎖定的時間更長時，才應提高此值。`staleMs` 是現有鎖定可被視為過期並回收的時間。`maxHoldMs` 是處理程序內看門狗的釋放門檻。

### 切換至 SQLite 後降級

執行較舊、以檔案為基礎的 OpenClaw 版本前，請先還原已封存的舊版逐字稿成品：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

移轉會保留舊版 `sessions.json` 檔案以供支援和
復原，但匯入 SQLite 的使用中逐字稿 JSONL 檔案會
重新命名並移入 `session-sqlite-import-archive/`。較舊、以檔案為基礎的執行階段會遵循
`sessions.json` 中的 `sessionFile` 路徑，因此啟動前
必須先還原這些成品。還原會使用移轉資訊清單，僅移動已記錄且
原始路徑不存在的封存成品，並保留 SQLite 資料庫，
以供日後升級復原。

切換至 SQLite 後建立的工作階段僅存在於 SQLite 中，不會顯示在
較舊、以檔案為基礎的執行階段。如果你在降級後再次升級，請再次執行診斷工具的
檢查與驗證程序，讓 OpenClaw 能在匯入前驗證已還原的舊版
成品。

## 排程工作階段與執行記錄

隔離的排程執行會建立自己的工作階段項目／逐字稿，並使用專用的保留設定：

- `cron.sessionRetention`（預設 `"24h"`）會從儲存區修剪舊的隔離排程執行工作階段；`false` 表示停用。
- `cron.runLog.keepLines` 會依每個排程工作修剪保留的 SQLite 執行歷史資料列（預設 `2000`）。`cron.runLog.maxBytes` 僅為了與較舊、以檔案為基礎的執行記錄相容而接受。

當排程強制建立新的隔離執行工作階段時，會先清理先前的 `cron:<jobId>` 工作階段項目，再寫入新資料列：它會沿用安全的偏好設定（思考／快速／詳細／推理設定、標籤、顯示名稱）和使用者明確選取的模型／驗證覆寫，但會捨棄環境對話上下文（頻道／群組路由、傳送／佇列原則、權限提升、來源、ACP 執行階段繫結），使全新的隔離執行無法繼承舊執行中過時的傳遞或執行階段權限。

## 工作階段鍵（`sessionKey`）

`sessionKey` 用於識別你所在的對話區段（路由 + 隔離）。標準規則：[/concepts/session](/zh-TW/concepts/session)。

| 模式                         | 範例                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| 主要／直接聊天（每個代理程式） | `agent:<agentId>:<mainKey>`（預設 `main`）                  |
| 群組                         | `agent:<agentId>:<channel>:group:<id>`                      |
| 房間／頻道（Discord／Slack） | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| 排程                         | `cron:<job.id>`                                             |
| 網路鉤子                     | `hook:<uuid>`（除非被覆寫）                                 |

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（延續對話的 SQLite 逐字稿身分）。決策邏輯位於 `src/auto-reply/reply/session.ts` 的 `initSessionState()` 中。

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為閘道主機當地時間上午 4:00）會在跨過重設界線後收到下一則訊息時建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes`，或舊版 `session.idleMinutes`）會在閒置時段過後收到訊息時建立新的 `sessionId`。若同時設定每日重設與閒置到期，則以先到期者為準。
- **控制介面重新連線續接**會在閘道從操作員介面用戶端收到相符的 `sessionId` 時，保留目前可見的工作階段，供重新連線後傳送一次訊息。這是一次性訊號；一般的過期傳送仍會建立新的 `sessionId`。
- **系統事件**（心跳偵測、排程喚醒、執行通知、閘道簿記）可能會變更工作階段資料列，但絕不會延長每日／閒置重設的新鮮度。重設切換會在建立全新提示詞之前，捨棄先前工作階段中排入佇列的系統事件通知。
- **父項分支政策**會在建立討論串或子代理分支時使用 OpenClaw 的作用中分支。如果該分支過大（超過固定的內部上限，目前為 100K 個 token），OpenClaw 會以隔離的上下文啟動子項，而不是失敗或繼承無法使用的歷程記錄。大小判定會自動進行且不可設定；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。
- **操作員分支**：`sessions.create { parentSessionKey, fork: true }` 會建立新的工作階段，其逐字記錄從父項目前的狀態分支（使用與產生子代理時相同的分支機制，包括上述大小上限）。父項有作用中執行時會拒絕建立分支；除非明確傳入模型選擇，否則會繼承父項的模型選擇；並以全新的 token 計數器將子項標記為 `forkedFromParent`。

## 工作階段儲存區結構描述

執行階段儲存區會將 `SessionEntry` 值保存在各代理的 SQLite 中。值型別為 `src/config/sessions.ts` 中的 `SessionEntry`。主要欄位（非完整清單）：

- `sessionId`：目前用來定址 SQLite 逐字記錄資料列的逐字記錄 ID
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳記；每日重設的新鮮度會使用此欄位。舊版資料列可能會從 JSONL 工作階段標頭推導此值。
- `lastInteractionAt`：最後一次真正的使用者／頻道互動時間戳記；閒置重設的新鮮度會使用此欄位，因此心跳偵測、排程及執行事件不會讓工作階段持續存活。缺少此欄位的舊版資料列會改用復原出的工作階段開始時間。
- `updatedAt`：儲存區資料列最後變更的時間戳記，用於列出／修剪／簿記，而不是每日／閒置新鮮度的權威依據。
- `archivedAt`：選用的封存時間戳記。封存的工作階段會連同完整逐字記錄保留在儲存區中，並從一般的作用中清單中排除。
- `pinnedAt`：選用的釘選時間戳記。作用中且已釘選的工作階段會排在未釘選的工作階段之前；封存工作階段時會清除其釘選狀態。
- Codex 討論串互通性：兩個欄位都遵循 Codex 的討論串管理形式——線路上的 `archived`／`pinned` 布林值一律從時間戳記推導並由伺服器端加註，符合 Codex 的 `threads.archived_at` 語意及 camelCase 序列化。OpenClaw 時間戳記使用紀元毫秒，而 Codex 使用紀元秒，因此橋接器會在 `codex` 外掛接合處進行轉換。Codex 尚無釘選 API（僅有 `thread/archive`／`thread/unarchive`）；在該 API 出現之前，釘選狀態會保留在 OpenClaw 端，屆時相符的形式即可讓已繫結的工作階段以機械化方式往返同步釘選狀態。
- Codex 監督只會列出未封存的原生討論串。只有在操作員明確確認沒有其他 Codex 程序擁有該討論串後，才能透過原生 `thread/archive` 封存閘道本機中活動狀態不明的 `idle` 或 `notLoaded` 討論串；外掛會先重新讀取程序本機狀態，之後該討論串便會從目錄中消失。該次讀取無法證明另一個 App Server 程序未使用該討論串。OpenClaw 會拒絕封存作用中及錯誤資料列，而且在節點橋接器能夠擁有完整的串流討論串生命週期之前，無法使用配對節點封存。在原生 Codex 用戶端中取消封存後，該討論串即可再次出現。
- `lastReadAt`／`markedUnreadAt`：由 `sessions.patch { unread }` 在伺服器端加註的閱讀狀態時間戳記——`unread: false` 會記錄為已讀（設定 `lastReadAt`、清除 `markedUnreadAt`）；`unread: true` 會將工作階段標記為未讀，直到下一次讀取為止。工作階段資料列會公開推導出的 `unread` 布林值：明確標記為未讀，或讀取時間早於最近活動。從未標記為已讀的工作階段會維持 `unread: false`，因此現有安裝在升級後不會突然亮起未讀提示。
- `lastActivityAt`：最後一次已完成且應計為未讀活動的代理執行時間戳記（使用者、頻道及排程執行）。心跳偵測與內部事件回合，以及中繼資料修補，都不會更新此欄位；`updatedAt` 不是活動訊號。
- `sessionFile`：為遷移／封存相容性保留的舊版標記；作用中執行階段使用 SQLite 身分
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群組／頻道標示中繼資料
- 切換設定：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（各工作階段覆寫）
- 模型選擇：`providerOverride`、`modelOverride`、`authProfileOverride`
- Token 計數器（盡力而為／依供應商而異）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段索引鍵完成自動壓縮的次數
- `memoryFlushAt`／`memoryFlushCompactionCount`：上次壓縮前記憶體排清的時間戳記與壓縮次數

閘道是權威來源：工作階段執行期間，它可能會重寫或重新載入項目。對於舊版檔案型安裝，請使用
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` 進行遷移，而不是
編輯 `sessions.json` 並期望執行階段繼續讀取該檔案。

## 逐字記錄事件結構

逐字記錄由 OpenClaw 工作階段存取器管理，並透過以身分為基礎的輔助函式提供給執行階段程式碼。事件串流只能附加：

- 第一個項目：工作階段標頭——`type: "session"`、`id`、`cwd`、`timestamp`、選用的 `parentSession`。
- 接著：具有 `id` + `parentId` 的項目（樹狀結構）。

重要項目型別：

- `message`：使用者／助理／toolResult 訊息
- `custom_message`：由擴充功能注入，且_會_進入模型上下文的訊息（當 `display: true` 時會顯示於終端介面，當 `display: false` 時會完全隱藏）
- `custom`：_不會_進入模型上下文的擴充功能狀態（用於在重新載入之間持續保存擴充功能狀態）
- `compaction`：持續保存的壓縮摘要，包含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：瀏覽樹狀分支時持續保存的摘要

OpenClaw 刻意不會「修正」逐字記錄；閘道使用 `SessionManager` 讀寫逐字記錄。

## 上下文視窗與追蹤的 token

這是兩個不同的概念：

1. **模型上下文視窗**：各模型的硬性上限（模型可見的 token）。此值來自模型目錄，並可透過設定覆寫。
2. **工作階段儲存區計數器**：寫入工作階段資料列的滾動統計資料（供 `/status` 和儀表板使用）。`contextTokens` 是執行階段估算／報告值——請勿將其視為嚴格保證。

如需進一步瞭解限制，請參閱：[/reference/token-use](/zh-TW/reference/token-use)。

## 壓縮：其作用

壓縮會將較舊的對話摘要成逐字記錄中持續保存的 `compaction` 項目，並完整保留近期訊息。壓縮後，未來的回合會看到壓縮摘要，以及 `firstKeptEntryId` 之後的訊息。壓縮具有**持續性**，與工作階段修剪不同——請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

壓縮後是否重新注入 AGENTS.md 區段，可透過 `agents.defaults.compaction.postCompactionSections` 選擇啟用；若未設定或為 `[]`，OpenClaw 不會在壓縮摘要之外附加 AGENTS.md 摘錄。

### 區塊界線與工具配對

將很長的逐字記錄分割成壓縮區塊時，OpenClaw 會讓助理工具呼叫與相符的 `toolResult` 項目保持配對：

- 如果依 token 比例分割的位置會落在工具呼叫與其結果之間，OpenClaw 會將界線移至助理的工具呼叫訊息，而不是拆散該配對。
- 如果尾端的工具結果區塊會使區塊超出目標，OpenClaw 會保留該待處理工具區塊，並讓未摘要的尾端保持完整。
- 已中止／錯誤的工具呼叫區塊不會使待處理分割保持開啟。

## 自動壓縮的發生時機

內嵌 OpenClaw 代理有兩個觸發條件：

1. **溢位復原**：模型傳回上下文溢位錯誤（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`，以及其他依供應商形式而異的變體）——先壓縮，再重試。當供應商回報嘗試使用的 token 數量時，OpenClaw 會將觀察到的數量轉送給溢位復原壓縮；如果供應商確認溢位但未公開可剖析的數量，OpenClaw 會將略微超出預算的合成數量傳遞給壓縮引擎和診斷。如果溢位復原仍失敗，OpenClaw 會顯示明確指引，並保留目前的工作階段對應關係，而不是在無提示的情況下切換至新的工作階段 ID——請重試該訊息、執行 `/compact`，或執行 `/new`。
2. **臨界值維護**：成功完成回合後，當 `contextTokens > contextWindow - reserveTokens` 時觸發，其中 `contextWindow` 是模型的上下文視窗，`reserveTokens` 是為提示詞與下一次模型輸出保留的緩衝空間。

另有兩項防護會在這兩個觸發條件之外執行：

- **預檢本機壓縮**：設定 `agents.defaults.compaction.maxActiveTranscriptBytes`（位元組，或如 `"20mb"` 的字串），即可在作用中逐字記錄達到該大小後、開啟下一次執行之前觸發本機壓縮。這是針對本機重新開啟成本的大小防護，而不是原始封存——一般的語意壓縮仍會執行，且需要 `truncateAfterCompaction`，以便讓壓縮摘要成為新的後續逐字記錄。
- **回合中預先檢查**：設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（預設為 `false`），以新增工具迴圈防護。附加工具結果後、下一次呼叫模型之前，OpenClaw 會使用與回合開始時相同的預檢預算邏輯來估算提示詞壓力。若上下文已無法容納，該防護不會在行內進行壓縮——它會發出結構化的回合中預先檢查訊號、停止目前的提示詞提交，並讓外層執行迴圈使用現有的復原路徑（若截斷過大的工具結果已足夠，便進行截斷；否則觸發已設定的壓縮模式並重試）。同時支援 `default` 和 `safeguard` 壓縮模式，包括由供應商支援的 safeguard 壓縮。此功能與 `maxActiveTranscriptBytes` 無關：位元組大小防護會在回合開啟前執行，而回合中預先檢查則會在之後、附加新的工具結果後執行。

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

OpenClaw 也會對嵌入式執行強制設定安全下限：如果 `compaction.reserveTokens` 低於 `reserveTokensFloor`（預設為 `20000`），OpenClaw 會將其提高。將 `agents.defaults.compaction.reserveTokensFloor: 0` 設為停用此下限。當已知使用中模型的上下文視窗時，下限與最終的實際保留量都會受到上限限制，因此保留量不會耗盡整個提示詞預算。這可避免上下文較小的模型（例如具有 16K 個權杖的本機模型）從第一個權杖開始就進入壓縮；如果上下文視窗未知，設定的保留預算與目前的保留預算都不設上限。為什麼需要下限：在壓縮變得無可避免之前，為多輪「內務處理」（例如下文的記憶體清理）保留足夠的餘裕。實作方式：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`，由嵌入式執行器的輪次與壓縮設定路徑呼叫。

手動 `/compact` 會遵循明確設定的 `agents.defaults.compaction.keepRecentTokens`，並保留執行階段最近尾端的切分點。如果未明確設定保留預算，手動壓縮會成為硬性檢查點，而重建的上下文會從新摘要開始。

啟用 `truncateAfterCompaction` 時，OpenClaw 會在壓縮後將使用中的逐字記錄輪替為壓縮後的後繼記錄。分支／還原檢查點動作會使用該壓縮後的後繼記錄；舊版的壓縮前檢查點檔案在仍被參照時依然可讀。

## 可插拔的壓縮提供者

外掛會透過外掛 API 上的 `registerCompactionProvider()` 註冊壓縮提供者。當 `agents.defaults.compaction.provider` 設為已註冊的提供者 ID 時，防護擴充功能會將摘要工作委派給該提供者，而不使用內建的 `summarizeInStages` 管線。

- `provider`：已註冊壓縮提供者外掛的 id。若要使用預設的 LLM 摘要功能，請勿設定。設定 `provider` 會強制使用 `mode: "safeguard"`。
- 提供者會收到與內建路徑相同的壓縮指示和識別碼保留政策；在提供者輸出後，安全防護仍會保留近期輪次及分割輪次的後綴上下文。
- 內建安全防護摘要會使用新訊息重新提煉先前的摘要，而不是逐字保留完整的舊摘要。
- 安全防護模式預設啟用摘要品質稽核；設定 `qualityGuard.enabled: false` 可略過輸出格式錯誤時的重試行為。
- 如果提供者失敗或傳回空白結果，OpenClaw 會自動退回使用內建 LLM 摘要功能。呼叫端明確觸發的中止／逾時訊號會重新擲出，而不會被忽略，因此一定會遵循取消要求。

來源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 使用者可見介面

- 任何聊天工作階段中的 `/status`
- `openclaw status`（命令列介面）
- `openclaw sessions` / `openclaw sessions --json`
- 閘道日誌（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細模式：`🧹 Auto-compaction complete` 加上壓縮次數

## 靜默背景維護（`NO_REPLY`）

OpenClaw 支援背景工作使用的「靜默」輪次，讓使用者不會看到中間輸出。

- 助理會以完全一致的靜默權杖 `NO_REPLY` / `no_reply` 開始輸出，表示「不要向使用者傳送回覆」。OpenClaw 會在傳送層移除／抑制此內容。
- 完全一致的靜默權杖抑制不區分大小寫：當整個承載內容只有靜默權杖時，`NO_REPLY` 和 `no_reply` 都會生效。
- 自 `2026.1.10` 起，若部分區塊以 `NO_REPLY` 開頭，OpenClaw 也會抑制草稿／輸入中串流，因此靜默操作不會在回合進行途中洩漏部分輸出。
- 這僅適用於真正的背景／不傳送回合，不能用來規避一般需要採取行動的使用者要求。

## 壓縮前記憶清理

在自動壓縮發生前，OpenClaw 可以執行一個靜默的代理式回合，將持久狀態寫入磁碟（例如代理工作區中的 `memory/YYYY-MM-DD.md`），避免壓縮清除關鍵脈絡。它會監控工作階段脈絡用量；一旦用量超過低於壓縮臨界值的軟性臨界值，就會使用完全一致的靜默權杖 `NO_REPLY` / `no_reply` 傳送一則靜默的「立即寫入記憶」指令，因此使用者不會看到任何內容。

設定（`agents.defaults.compaction.memoryFlush`），完整參考請見 [/gateway/config-agents](/zh-TW/gateway/config-agents#agentsdefaultscompaction)：

| 鍵                          | 預設值           | 備註                                                                                                                                 |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                   | `true`           |                                                                                                                                      |
| `model`                     | 未設定           | 僅針對清理回合覆寫確切的供應商／模型，例如 `ollama/qwen3:8b`                                                                        |
| `softThresholdTokens`       | `4000`           | 與壓縮臨界值之間的差距，達到此差距時會觸發清理                                                                                       |
| `forceFlushTranscriptBytes` | 未設定（停用）   | 當逐字記錄檔達到此位元組大小（或如 `"2mb"` 的字串）時強制清理，即使權杖計數器已過時；`0` 表示停用                                        |
| `prompt`                    | 內建             | 清理回合的使用者訊息                                                                                                                 |
| `systemPrompt`              | 內建             | 附加至清理回合的額外系統提示                                                                                                         |

備註：

- 預設提示／系統提示包含 `NO_REPLY` 提示，以抑制傳送。
- 設定 `model` 後，清理回合會使用該模型，而不繼承目前工作階段的備援鏈，因此僅限本機的維護作業失敗時，不會在未告知的情況下改用付費的對話模型。
- 每個壓縮週期只會執行一次清理（在工作階段資料列中追蹤）。
- 清理僅會針對內嵌的 OpenClaw 工作階段執行；命令列介面後端和心跳偵測回合會略過。
- 當工作階段工作區為唯讀時（`workspaceAccess: "ro"` 或 `"none"`），會略過清理。
- 工作區檔案配置和寫入模式請見[記憶](/zh-TW/concepts/memory)。

OpenClaw 在擴充功能 API 中公開 `session_before_compact` 鉤子，但上述清理邏輯位於閘道端（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），而非該鉤子中。

## 疑難排解檢查清單

- **工作階段金鑰錯誤？** 請先參閱 [/concepts/session](/zh-TW/concepts/session)，並確認 `/status` 中的 `sessionKey`。
- **儲存區與逐字記錄不相符？** 請透過 `openclaw status` 確認閘道主機和儲存區路徑。
- **頻繁壓縮？** 請檢查模型的脈絡視窗（過小會迫使系統頻繁壓縮）、`reserveTokens`（相對於模型視窗過高會導致提早壓縮），以及工具結果膨脹（調整工作階段修剪）。
- **在小型本機模型上，每個提示似乎都會溢位？** 請確認供應商回報正確的模型脈絡視窗。只有在得知該視窗大小時，OpenClaw 才能限制有效的保留量。
- **靜默回合發生洩漏？** 請確認回覆以完全一致的靜默權杖 `NO_REPLY` 開頭（不區分大小寫），並且你使用的是包含串流抑制修正的組建（`2026.1.10`+）。

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [脈絡引擎](/zh-TW/concepts/context-engine)
- [代理設定參考](/zh-TW/gateway/config-agents)
