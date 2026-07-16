---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿事件或工作階段資料列欄位
    - 你正在變更自動壓縮行為，或新增「壓縮前」整理作業
    - 你想要實作記憶清空或靜默系統回合
summary: 深入探討：工作階段儲存區與對話記錄、生命週期，以及（自動）壓縮的內部機制
title: 工作階段管理深入解析
x-i18n:
    generated_at: "2026-07-16T12:01:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

單一 **閘道程序**會端對端管理工作階段狀態。使用者介面（macOS App、網頁控制介面、終端介面）會向閘道查詢工作階段清單和權杖數量。在遠端模式下，工作階段檔案位於遠端主機，因此檢查本機 Mac 上的檔案不會反映閘道實際使用的內容。

請先參閱概觀文件：[工作階段管理](/zh-TW/concepts/session)、[壓縮](/zh-TW/concepts/compaction)、[記憶概觀](/zh-TW/concepts/memory)、[記憶搜尋](/zh-TW/concepts/memory-search)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[逐字稿清理](/zh-TW/reference/transcript-hygiene)；完整設定參考請見[代理程式設定](/zh-TW/gateway/config-agents)。

## 兩個持久化層

1. **工作階段資料列（每個代理程式各自使用 SQLite）** - 鍵值對應 `sessionKey -> SessionEntry`。由閘道管理的可變執行階段狀態。追蹤中繼資料：目前工作階段 ID、上次活動、切換設定、權杖計數器。
2. **逐字稿事件（每個代理程式各自使用 SQLite）** - 僅附加、樹狀結構（項目包含 `id` + `parentId`）。儲存對話、工具呼叫和壓縮摘要；為未來輪次重建模型上下文。壓縮檢查點是壓縮後後繼逐字稿上的中繼資料，新壓縮不會再寫入第二份 `.checkpoint.*.jsonl`。

較舊的安裝可能仍在代理程式的 `sessions/`
目錄下保有 `sessions.json` 檔案。請將這些檔案視為舊版工作階段資料列的遷移輸入，或明確的
離線維護目標。閘道啟動和 `openclaw doctor --fix` 會自動將
使用中的舊版資料列及逐字稿歷程匯入每個代理程式各自的 SQLite 儲存區。
需要明確檢查或驗證證據時，請執行 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`，再依照 [Doctor 遷移
順序](/zh-TW/cli/doctor#session-sqlite-migration)操作。如果舊版逐字稿
成品封存後遷移失敗，請使用該順序中的 Doctor 復原模式。
復原會使用遷移資訊清單，只還原受影響的已封存支援
成品，並在要求時準備經過清理的 GitHub 問題報告，且不會
讓使用中的執行階段再次讀取 JSONL 檔案。

除非介面需要任意歷史存取，否則閘道歷程讀取器會避免將整份逐字稿具現化。第一頁歷程、內嵌聊天歷程、重新啟動復原，以及權杖／用量檢查，都使用從 SQLite 進行的有界尾端讀取。完整逐字稿掃描會透過非同步逐字稿索引進行，並由並行讀取器共用。

## 磁碟位置

每個代理程式在閘道主機上的位置（透過 `src/config/sessions.ts` 解析）：

- 執行階段工作階段資料列儲存區：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 執行階段逐字稿資料列：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 舊版／封存逐字稿成品：`~/.openclaw/agents/<agentId>/sessions/`
- 舊版資料列遷移輸入：`~/.openclaw/agents/<agentId>/sessions/sessions.json`

## 儲存區維護與磁碟控制

`session.maintenance` 控制 SQLite 工作階段資料列、SQLite 逐字稿資料列、封存成品和軌跡附屬檔案的自動維護：

| 鍵                      | 預設值                | 備註                                                                                        |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | 或 `"warn"`（僅報告，不變更）                                                      |
| `pruneAfter`            | `"30d"`               | 過期項目的存留時間上限                                                                      |
| `maxEntries`            | `500`                 | 工作階段項目數量上限                                                                        |
| `resetArchiveRetention` | 保留（無存留時間上限） | `*.reset.*`/`*.deleted.*` 逐字稿封存的存留時間上限；設定持續時間即會啟用刪除 |
| `maxDiskBytes`          | `2gb`                 | 每個代理程式的工作階段磁碟預算；`false` 會停用                                            |
| `highWaterBytes`        | `maxDiskBytes` 的 80% | 預算清理後的目標用量                                                                  |

封存的逐字稿預設會保留，並在執行階段支援時使用 zstd（`*.jsonl.<reason>.<timestamp>.zst`）壓縮，因此刪除或重設工作階段絕不會在未提示的情況下丟棄對話歷程。磁碟預算會先淘汰最舊的封存，再處理使用中的工作階段。

對 `maxDiskBytes` 進行主動 SQLite 強制限制時，會測量每個工作階段的工作階段資料列 JSON 加上逐字稿事件 JSON 位元組數；舊版離線維護的強制限制則測量所選工作階段目錄中的檔案。

閘道模型執行探查工作階段（符合 `agent:*:explicit:model-run-<uuid>` 的鍵）具有獨立且固定的 `24h` 保留期限。此修剪由壓力觸發：只會在達到工作階段項目維護／上限壓力時執行，且只會在全域過期項目清理／上限步驟之前執行。其他明確建立的工作階段不使用此保留期限。

磁碟預算清理（`mode: "enforce"`）的強制執行順序：

1. 先移除最舊的封存逐字稿成品、無主舊版成品或無主軌跡成品。
2. 若仍高於目標值，則淘汰最舊的工作階段項目及其逐字稿資料列或軌跡成品。
3. 重複執行，直到用量小於或等於 `highWaterBytes`。

`mode: "warn"` 會報告可能的淘汰項目，但不會變更儲存區或檔案。

視需要執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

維護會保留耐久的外部對話指標，例如群組工作階段和限定執行緒範圍的聊天工作階段；但合成的執行階段項目（排程、鉤子、心跳偵測、ACP、子代理程式）一旦超過設定的存留時間、數量或磁碟預算，仍可能遭到移除。隔離的排程執行使用獨立的 `cron.sessionRetention` 控制，與模型執行探查的保留期限無關。

一般閘道寫入會經過工作階段存取器，由其透過執行階段寫入器路徑，依序處理每個代理程式的 SQLite 變更。執行階段程式碼應優先使用 `src/config/sessions/session-accessor.ts` 中的存取器輔助函式；舊版 `sessions.json` 輔助函式是遷移和離線維護工具。閘道可連線時，非試執行的 `openclaw sessions cleanup` 和 `openclaw agents delete` 會將儲存區變更委派給閘道，使清理加入同一個寫入器佇列；`--store <path>` 是針對所選舊版儲存區的明確離線修復路徑，且一律在本機執行（`--dry-run` 亦同）。`maxEntries` 清理會針對生產規模的儲存區分批執行，因此儲存區可能短暫超過設定上限，直到下一次高水位清理將其重寫至上限以下。讀取操作在閘道啟動期間絕不會修剪項目或套用上限，只有寫入操作或 `openclaw sessions cleanup --enforce` 會這麼做；後者也會立即套用上限，並且即使未設定磁碟預算，也會修剪未被參照的舊版逐字稿、檢查點和軌跡成品。

OpenClaw 不再於閘道寫入期間自動建立 `sessions.json.bak.*` 輪替備份。目前的結構描述會拒絕舊版 `session.maintenance.rotateBytes` 鍵，而 `openclaw doctor --fix` 會從舊設定中移除該鍵。

逐字稿變更會針對 SQLite 逐字稿目標使用工作階段寫入佇列：

| 設定                                 | 預設值    | 環境變數覆寫                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` 是鎖定等待在放棄前，經過多久會顯示工作階段忙碌錯誤；只有在速度較慢的機器上，合法的準備、清理、壓縮或逐字稿鏡像工作競爭時間更長時，才應提高此值。`staleMs` 是現有鎖定可被視為過期並回收的時間。`maxHoldMs` 是程序內監控程式的釋放門檻。

### 切換至 SQLite 後降級

執行較舊的檔案式 OpenClaw 版本前，請先還原已封存的舊版逐字稿成品：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

遷移會保留舊版 `sessions.json` 檔案，以供支援與
復原使用，但匯入 SQLite 的使用中逐字稿 JSONL 檔案會
重新命名至 `session-sqlite-import-archive/`。較舊的檔案式執行階段會依循
`sessions.json` 中的 `sessionFile` 路徑，因此啟動前需要還原這些成品。
還原會使用遷移資訊清單，僅移動有記錄且原始路徑不存在的封存
成品，並將 SQLite 資料庫保留原位，以供日後向前復原。

切換至 SQLite 後建立的工作階段僅存在於 SQLite 中，不會出現在
較舊的檔案式執行階段中。如果降級後再次升級，請重新執行 Doctor
檢查和驗證順序，讓 OpenClaw 能在匯入前驗證已還原的舊版
成品。

## 排程工作階段與執行記錄

隔離的排程執行會建立自己的工作階段項目／逐字稿，並具有專用的保留期限：

- `cron.sessionRetention`（預設為 `"24h"`）會從儲存區修剪舊的隔離排程執行工作階段；`false` 會停用。
- 執行歷程會保留每個排程工作中最新的 2000 筆終止資料列。遺失的資料列仍保有其 24 小時清理期限。

當排程強制建立新的隔離執行工作階段時，會先清理先前的 `cron:<jobId>` 工作階段項目，再寫入新資料列：它會保留安全的偏好設定（思考／快速／詳細／推理設定、標籤、顯示名稱），以及使用者明確選取的模型／驗證覆寫，但會捨棄周遭對話上下文（頻道／群組路由、傳送／佇列政策、權限提升、來源、ACP 執行階段繫結），確保全新的隔離執行不會從較舊的執行繼承過期的傳遞設定或執行階段權限。

## 工作階段鍵（`sessionKey`）

`sessionKey` 會識別你所在的對話分組（路由 + 隔離）。標準規則：[/concepts/session](/zh-TW/concepts/session)。

| 模式                         | 範例                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| 主要／直接聊天（每個代理程式） | `agent:<agentId>:<mainKey>`（預設為 `main`）                |
| 群組                         | `agent:<agentId>:<channel>:group:<id>`                      |
| 房間／頻道（Discord/Slack）   | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| 排程                         | `cron:<job.id>`                                             |
| 網路鉤子                     | `hook:<uuid>`（除非遭到覆寫）                           |

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（延續對話的 SQLite 逐字稿識別資訊）。決策邏輯位於 `src/auto-reply/reply/session.ts` 的 `initSessionState()` 中。

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- **每日重設**（預設為閘道主機當地時間凌晨 4:00）會在越過重設邊界後的下一則訊息建立新的 `sessionId`。
- **閒置到期**（`session.reset.idleMinutes`，或舊版 `session.idleMinutes`）會在閒置時段過後有訊息送達時建立新的 `sessionId`。若同時設定每日重設與閒置到期，會以先到期者為準。
- **控制介面重新連線續接**會在閘道收到操作員介面用戶端傳來相符的 `sessionId` 時，保留目前可見的工作階段，供重新連線後的一次傳送使用。這是一次性訊號；一般過時的傳送仍會建立新的 `sessionId`。
- **系統事件**（心跳偵測、排程喚醒、執行通知、閘道簿記）可能會變更工作階段資料列，但絕不會延長每日／閒置重設的新鮮度。重設輪替會在建立全新提示詞之前，捨棄前一個工作階段中排入佇列的系統事件通知。
- **父系分支政策**在建立討論串或子代理分支時，會使用 OpenClaw 的作用中分支。若該分支過大（超過固定的內部上限，目前為 100K 個權杖），OpenClaw 會讓子項目以隔離的上下文啟動，而不是失敗或繼承無法使用的歷史記錄。大小判定為自動進行且無法設定；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。
- **操作員分支**：`sessions.create { parentSessionKey, fork: true }` 會建立新的工作階段，其文字記錄從父工作階段的目前狀態分支出去（使用與產生子代理相同的分支機制，包括上述大小上限）。若父工作階段有執行中的作業，系統會拒絕建立分支；除非明確傳入模型，否則會繼承父工作階段的模型選擇，並以全新的權杖計數器將子工作階段標記為 `forkedFromParent`。

## 工作階段儲存區結構描述

執行階段儲存區會在各代理的 SQLite 中保存 `SessionEntry` 值。值的型別是 `src/config/sessions.ts` 中的 `SessionEntry`。主要欄位如下（並非完整清單）：

- `sessionId`：目前用來定址 SQLite 文字記錄資料列的文字記錄 ID
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳記；每日重設的新鮮度會使用此值。舊版資料列可能會從 JSONL 工作階段標頭衍生此值。
- `lastInteractionAt`：最後一次真實使用者／頻道互動的時間戳記；閒置重設的新鮮度會使用此值，因此心跳偵測、排程和執行事件不會讓工作階段持續存活。缺少此欄位的舊版資料列會退回使用復原的工作階段開始時間。
- `updatedAt`：上次變更儲存區資料列的時間戳記，用於列出／修剪／簿記，而不是每日／閒置新鮮度的依據。
- `archivedAt`：選用的封存時間戳記。已封存的工作階段會連同完整文字記錄保留在儲存區中，並從一般作用中清單排除。
- `pinnedAt`：選用的釘選時間戳記。作用中且已釘選的工作階段會排在未釘選工作階段之前；封存工作階段會清除其釘選狀態。
- Codex 討論串互通：兩個欄位都遵循 Codex 的討論串管理形式——線路上的 `archived`/`pinned` 布林值一律從時間戳記衍生，並由伺服器端加註，與 Codex `threads.archived_at` 語意及 camelCase 序列化一致。OpenClaw 時間戳記使用 Epoch 毫秒，而 Codex 使用 Epoch 秒，因此橋接器會在 `codex` 外掛接合處進行轉換。Codex 目前尚無釘選 API（只有 `thread/archive`/`thread/unarchive`）；在 API 出現前，釘選狀態會保留在 OpenClaw 端，屆時相符的形式可讓已繫結工作階段以機械式方式來回同步釘選狀態。
- Codex 監督只會列出未封存的原生討論串。閘道本機的 `idle` 或 `notLoaded` 活動狀態不明討論串，只有在操作員明確確認沒有其他 Codex 程序擁有該討論串後，才能透過原生 `thread/archive` 封存；外掛會先重新讀取程序本機狀態，之後該討論串便會從目錄中消失。該次讀取無法證明另一個 App Server 程序未在使用此討論串。OpenClaw 會拒絕封存作用中及錯誤資料列，而配對節點封存功能在節點橋接器能夠擁有完整的串流討論串生命週期前都無法使用。在原生 Codex 用戶端中取消封存後，該討論串便可再次顯示。
- `lastReadAt` / `markedUnreadAt`：由 `sessions.patch { unread }` 在伺服器端加註的讀取狀態時間戳記——`unread: false` 會記錄一次讀取（設定 `lastReadAt`，清除 `markedUnreadAt`）；`unread: true` 會將工作階段標記為未讀，直到下一次讀取。工作階段資料列會公開衍生的 `unread` 布林值：明確標記為未讀，或讀取時間早於最新活動。從未標記為已讀的工作階段會維持 `unread: false`，因此現有安裝不會在升級時全部亮起。
- `lastActivityAt`：最後一次已完成且視為值得標記未讀之活動的代理執行時間戳記（使用者、頻道及排程執行）。心跳偵測與內部事件回合，以及中繼資料修補，都不會更新此值；`updatedAt` 不是活動訊號。
- `sessionFile`：為了遷移／封存相容性而保留的舊版標記；作用中的執行階段使用 SQLite 身分
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群組／頻道標籤中繼資料
- 切換設定：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（每個工作階段的覆寫值）
- 模型選擇：`providerOverride`、`modelOverride`、`authProfileOverride`
- 權杖計數器（盡力而為／取決於供應商）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段索引鍵完成自動壓縮的次數
- `memoryFlushAt` / `memoryFlushCompactionCount`：上次壓縮前記憶體排清的時間戳記與壓縮次數

閘道是權威來源：工作階段執行時，它可能會重寫或重新載入項目。對於舊版檔案式安裝，請使用
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` 進行遷移，而不要編輯
`sessions.json` 並期待執行階段繼續讀取該檔案。

## 文字記錄事件結構

文字記錄由 OpenClaw 工作階段存取器管理，並透過以身分為基礎的輔助函式公開給執行階段程式碼。事件串流僅能附加：

- 第一個項目：工作階段標頭——`type: "session"`、`id`、`cwd`、`timestamp`，選用的 `parentSession`。
- 接著：含有 `id` + `parentId` 的項目（樹狀結構）。

值得注意的項目型別：

- `message`：使用者／助理／toolResult 訊息
- `custom_message`：由擴充功能注入且_會_進入模型上下文的訊息（當 `display: true` 時會在終端介面中呈現，當 `display: false` 時會完全隱藏）
- `custom`：_不會_進入模型上下文的擴充功能狀態（用於跨重新載入持續保存擴充功能狀態）
- `compaction`：含有 `firstKeptEntryId` 和 `tokensBefore` 的持續保存壓縮摘要
- `branch_summary`：瀏覽樹狀分支時持續保存的摘要

OpenClaw 刻意不會「修正」文字記錄；閘道使用 `SessionManager` 讀寫這些記錄。

## 上下文視窗與追蹤權杖

這是兩個不同的概念：

1. **模型上下文視窗**：每個模型的硬性上限（模型可見的權杖）。此值來自模型目錄，並可透過設定覆寫。
2. **工作階段儲存區計數器**：寫入工作階段資料列的滾動統計資料（用於 `/status` 和儀表板）。`contextTokens` 是執行階段估計／報告值——請勿將其視為嚴格保證。

更多限制資訊：[/reference/token-use](/zh-TW/reference/token-use)。

## 壓縮：其作用

壓縮會將較舊的對話摘要成文字記錄中持續保存的 `compaction` 項目，並完整保留近期訊息。壓縮後，後續回合會看到壓縮摘要，以及 `firstKeptEntryId` 之後的訊息。壓縮是**持續保存的**，不同於工作階段修剪——請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

壓縮後重新注入 AGENTS.md 區段需透過 `agents.defaults.compaction.postCompactionSections` 選擇啟用；未設定或設為 `[]` 時，OpenClaw 不會在壓縮摘要上方附加 AGENTS.md 摘錄。

### 區塊邊界與工具配對

將較長的文字記錄分割為壓縮區塊時，OpenClaw 會將助理工具呼叫與相符的 `toolResult` 項目保持配對：

- 若依權杖占比分割會落在工具呼叫與其結果之間，OpenClaw 會將邊界移到助理工具呼叫訊息，而不會拆散這一對。
- 若尾端工具結果區塊原本會使區塊超出目標，OpenClaw 會保留該待處理工具區塊，並讓尚未摘要的尾端保持完整。
- 已中止／錯誤的工具呼叫區塊不會讓待處理分割持續開啟。

## 自動壓縮的觸發時機

內嵌 OpenClaw 代理有兩個觸發條件：

1. **溢位復原**：模型傳回上下文溢位錯誤（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`，以及其他供應商形式的變體）——先壓縮，再重試。當供應商回報嘗試使用的權杖數時，OpenClaw 會將觀察到的計數轉送給溢位復原壓縮；若供應商確認溢位，但未公開可剖析的計數，OpenClaw 會向壓縮引擎與診斷功能傳入剛好略超預算的合成計數。若溢位復原仍失敗，OpenClaw 會顯示明確指引，並保留目前的工作階段對應關係，而不是無提示地輪替為新的工作階段 ID——請重試訊息、執行 `/compact`，或執行 `/new`。
2. **閾值維護**：成功完成一個回合後，當 `contextTokens > contextWindow - reserveTokens` 時觸發，其中 `contextWindow` 是模型的上下文視窗，而 `reserveTokens` 是為提示詞及模型下一次輸出保留的餘裕。

這兩個觸發條件之外另有兩項防護：

- **預檢本機壓縮**：設定 `agents.defaults.compaction.maxActiveTranscriptBytes`（位元組數或如 `"20mb"` 的字串），即可在作用中文字記錄達到該大小後、開啟下一次執行前觸發本機壓縮。這是針對本機重新開啟成本的大小防護，而非原始封存——一般的語意壓縮仍會執行，且需要 `truncateAfterCompaction`，才能讓壓縮摘要成為新的後繼文字記錄。
- **回合中預檢**：設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（預設為 `false`）以新增工具迴圈防護。附加工具結果後、下一次模型呼叫前，OpenClaw 會使用與回合開始時相同的預檢預算邏輯估算提示詞壓力。若上下文已無法容納，該防護不會就地壓縮——它會引發結構化的回合中預檢訊號、停止目前的提示詞提交，並讓外層執行迴圈使用現有復原路徑（在足夠的情況下截斷過大的工具結果，否則觸發已設定的壓縮模式並重試）。可搭配 `default` 和 `safeguard` 壓縮模式使用，包括由供應商支援的防護壓縮。此功能獨立於 `maxActiveTranscriptBytes`：位元組大小防護會在回合開啟前執行，而回合中預檢則稍後在附加新工具結果後執行。

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

OpenClaw 也會對嵌入式執行強制設定安全下限：如果 `compaction.reserveTokens` 低於 `reserveTokensFloor`（預設為 `20000`），OpenClaw 會將其提高。設定 `agents.defaults.compaction.reserveTokensFloor: 0` 可停用此下限。當已知目前模型的上下文視窗時，下限與最終生效的保留量都會受到限制，確保保留量不會占用整個提示預算。這可避免上下文較小的模型（例如 16K-token 的本機模型）從第一個 token 起就進入壓縮；若上下文視窗未知，已設定及目前的保留預算則不受限制。為何需要下限：在壓縮無可避免之前，為多輪「內務處理」（例如下述的記憶體寫入）保留足夠的餘裕。實作：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`，由嵌入式執行器的輪次與壓縮設定路徑呼叫。

手動 `/compact` 會遵循明確指定的 `agents.defaults.compaction.keepRecentTokens`，並保留執行階段的近期尾端截斷點。若未明確指定保留預算，手動壓縮會成為硬性檢查點，且重建後的上下文會從新摘要開始。

啟用 `truncateAfterCompaction` 時，OpenClaw 會在壓縮後將目前逐字稿輪替為壓縮後的後繼逐字稿。分支／還原檢查點動作會使用該壓縮後的後繼逐字稿；舊版的壓縮前檢查點檔案在仍被參照時依然可讀取。

## 可插拔的壓縮提供者

外掛透過外掛 API 上的 `registerCompactionProvider()` 註冊壓縮提供者。當 `agents.defaults.compaction.provider` 設為已註冊的提供者 ID 時，防護擴充功能會將摘要工作委派給該提供者，而非使用內建的 `summarizeInStages` 管線。

- `provider`：已註冊壓縮提供者外掛的 ID。若要使用預設的 LLM 摘要，請勿設定。設定 `provider` 會強制使用 `mode: "safeguard"`。
- 提供者會收到與內建路徑相同的壓縮指示及識別碼保留原則，且在提供者輸出後，防護機制仍會保留近期輪次與分割輪次的後綴上下文。
- 內建防護摘要會以新訊息重新提煉先前摘要，而非逐字保留完整的舊摘要。
- 防護模式預設會啟用摘要品質稽核；設定 `qualityGuard.enabled: false` 可略過輸出格式錯誤時重試的行為。
- 如果提供者失敗或傳回空白結果，OpenClaw 會自動改用內建 LLM 摘要。呼叫端明確觸發的中止／逾時訊號會重新擲出而不會被忽略，因此一律會遵循取消要求。

來源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 使用者可見介面

- 任何聊天工作階段中的 `/status`
- `openclaw status`（命令列介面）
- `openclaw sessions` / `openclaw sessions --json`
- 閘道記錄（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細模式：`🧹 Auto-compaction complete` 加上壓縮次數

## 靜默內務處理（`NO_REPLY`）

OpenClaw 支援背景工作的「靜默」輪次，使用者不應看到其中間輸出。

- 助理以完全相符的靜默 token `NO_REPLY` / `no_reply` 作為輸出開頭，表示「不要向使用者傳送回覆」。OpenClaw 會在傳送層移除／抑制此內容。
- 完全相符的靜默 token 抑制不區分大小寫：當整個承載內容只有靜默 token 時，`NO_REPLY` 和 `no_reply` 都會被視為相符。
- 自 `2026.1.10` 起，當部分區塊以 `NO_REPLY` 開頭時，OpenClaw 也會抑制草稿／輸入中串流，因此靜默作業不會在輪次進行期間洩漏部分輸出。
- 這僅適用於真正的背景／不傳送輪次，並非處理一般可採取行動之使用者要求的捷徑。

## 壓縮前記憶體寫入

在自動壓縮發生前，OpenClaw 可以執行一次靜默的代理式輪次，將持久狀態寫入磁碟（例如代理工作區中的 `memory/YYYY-MM-DD.md`），以免壓縮抹除關鍵上下文。它會監控工作階段的上下文使用量；一旦超過低於壓縮門檻的軟性門檻，就會使用完全相符的靜默 token `NO_REPLY` / `no_reply` 傳送靜默的「立即寫入記憶」指示，因此使用者不會看到任何內容。

設定（`agents.defaults.compaction.memoryFlush`），完整參考資料請見 [/gateway/config-agents](/zh-TW/gateway/config-agents#agentsdefaultscompaction)：

| 鍵                          | 預設值           | 備註                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未設定           | 僅用於寫入輪次的精確提供者／模型覆寫，例如 `ollama/qwen3:8b`                                                   |
| `softThresholdTokens`       | `4000`           | 低於壓縮門檻並觸發寫入的差距                                                                               |
| `forceFlushTranscriptBytes` | 未設定（已停用） | 即使 token 計數器已過時，當逐字稿檔案達到此位元組大小（或 `"2mb"` 之類的字串）時仍強制寫入一次；`0` 會停用 |
| `prompt`                    | 內建             | 寫入輪次的使用者訊息                                                                                                        |
| `systemPrompt`              | 內建             | 為寫入輪次附加的額外系統提示                                                                                        |

備註：

- 預設提示／系統提示包含 `NO_REPLY` 提示，以抑制傳送。
- 設定 `model` 時，寫入輪次會使用該模型，而不會繼承目前工作階段的備援鏈，因此僅限本機的內務處理失敗時，不會在未告知的情況下改用付費的對話模型。
- 每個壓縮週期只會執行一次寫入（在工作階段資料列中追蹤）。
- 寫入僅適用於嵌入式 OpenClaw 工作階段；命令列介面後端與心跳偵測輪次會略過。
- 當工作階段工作區為唯讀時（`workspaceAccess: "ro"` 或 `"none"`），會略過寫入。
- 工作區檔案配置與寫入模式請參閱[記憶體](/zh-TW/concepts/memory)。

OpenClaw 在擴充功能 API 中公開 `session_before_compact` 掛鉤，但上述寫入邏輯位於閘道端（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），而非該掛鉤上。

## 疑難排解檢查清單

- **工作階段金鑰錯誤？** 請先參閱[/concepts/session](/zh-TW/concepts/session)，並確認 `/status` 中的 `sessionKey`。
- **儲存區與逐字稿不一致？** 請根據 `openclaw status` 確認閘道主機與儲存區路徑。
- **頻繁壓縮？** 請檢查模型的上下文視窗（過小會強制頻繁壓縮）、`reserveTokens`（相對於模型視窗過高會導致提早壓縮），以及工具結果膨脹（請調整工作階段修剪）。
- **在小型本機模型上，每個提示似乎都會溢位？** 請確認提供者回報正確的模型上下文視窗。OpenClaw 只有在知道該視窗時，才能限制生效的保留量。
- **靜默輪次發生洩漏？** 請確認回覆以完全相符的靜默 token `NO_REPLY` 開頭（不區分大小寫），且使用的建置版本包含串流抑制修正（`2026.1.10`+）。

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [上下文引擎](/zh-TW/concepts/context-engine)
- [代理設定參考資料](/zh-TW/gateway/config-agents)
