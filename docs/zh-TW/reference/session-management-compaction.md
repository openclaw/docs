---
read_when:
    - 你需要偵錯工作階段 ID、逐字稿事件或工作階段資料列欄位
    - 你正在變更自動壓縮行為，或新增「壓縮前」整理作業
    - 你想要實作記憶清除或靜默系統輪次
summary: 深入解析：工作階段儲存區與逐字記錄、生命週期，以及（自動）壓縮的內部機制
title: 工作階段管理深入解析
x-i18n:
    generated_at: "2026-07-20T00:58:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ce3f4d5bc40f454f98950ec88230ad5caadb224e25c779f26a7b87f3349de47b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

單一 **閘道程序**端對端擁有工作階段狀態。UI（macOS 應用程式、網頁控制 UI、終端介面）會向閘道查詢工作階段清單與 token 數量。在遠端模式下，工作階段檔案位於遠端主機，因此檢查本機 Mac 的檔案不會反映閘道實際使用的內容。

請先參閱概覽文件：[工作階段管理](/zh-TW/concepts/session)、[壓縮](/zh-TW/concepts/compaction)、[記憶概覽](/zh-TW/concepts/memory)、[記憶搜尋](/zh-TW/concepts/memory-search)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[逐字稿清理](/zh-TW/reference/transcript-hygiene)；完整設定參考請見[代理程式設定](/zh-TW/gateway/config-agents)。

## 兩個持久化層

1. **工作階段資料列（每個代理程式各自使用 SQLite）** - 鍵/值對應表 `sessionKey -> SessionEntry`。由閘道擁有的可變執行階段狀態。追蹤中繼資料：目前工作階段 ID、上次活動時間、切換設定、token 計數器。
2. **逐字稿事件（每個代理程式各自使用 SQLite）** - 僅可附加、採樹狀結構（項目具有 `id` + `parentId`）。儲存對話、工具呼叫與壓縮摘要；為後續輪次重建模型上下文。壓縮檢查點是壓縮後後繼逐字稿上的中繼資料，新一輪壓縮不會再寫入第二份 `.checkpoint.*.jsonl`。

較舊的安裝可能仍在代理程式的 `sessions/`
目錄下保有 `sessions.json` 檔案。請將這些檔案視為舊版工作階段資料列遷移輸入，或明確指定的
離線維護目標。閘道啟動與 `openclaw doctor --fix` 會自動將
使用中的舊版資料列與逐字稿歷程匯入每個代理程式的 SQLite 儲存區。
需要明確檢查或驗證證據時，請執行 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`，然後依照
[Doctor 遷移程序](/zh-TW/cli/doctor#session-sqlite-migration)操作。如果舊版逐字稿
成品封存後遷移失敗，請使用該程序中的 Doctor 復原模式。
復原會使用遷移資訊清單，僅還原受影響的已封存支援
成品，在要求時準備經過清理的 GitHub 問題報告，且不會
讓使用中的執行階段再次讀取 JSONL 檔案。

除非介面需要任意歷史存取，否則閘道歷程讀取器會避免將整份逐字稿載入記憶體。第一頁歷程、內嵌聊天歷程、重新啟動復原，以及 token／用量檢查，都會從 SQLite 進行有界尾端讀取。完整逐字稿掃描會透過非同步逐字稿索引執行，並由並行讀取器共用。

## 磁碟位置

每個代理程式在閘道主機上的位置（透過 `src/config/sessions.ts` 解析）：

- 執行階段工作階段資料列儲存區：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 執行階段逐字稿資料列：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 舊版／封存逐字稿成品：`~/.openclaw/agents/<agentId>/sessions/`
- 舊版資料列遷移輸入：`~/.openclaw/agents/<agentId>/sessions/sessions.json`

## 儲存區維護與磁碟控制

`session.maintenance` 控制 SQLite 工作階段資料列、SQLite 逐字稿資料列、封存成品及軌跡附屬檔案的自動維護：

| 鍵                      | 預設值                | 備註                                                                                         |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | 或 `"warn"`（僅回報，不變更）                                                      |
| `pruneAfter`            | `"30d"`               | 過時項目的存留時間上限                                                                      |
| `maxEntries`            | `500`                 | 工作階段項目上限                                                                            |
| `resetArchiveRetention` | 保留（無存留時間上限） | `*.reset.*`/`*.deleted.*` 逐字稿封存的存留時間上限；設定持續時間即會啟用刪除 |
| `maxDiskBytes`          | `10gb`                | 每個代理程式的工作階段磁碟預算；`false` 會停用                                            |
| `highWaterBytes`        | `maxDiskBytes` 的 80% | 預算清理後的目標                                                                             |

重設會推進使用中的 `sessionKey -> sessionId` 對應，但保留先前的 SQLite 工作階段、逐字稿、軌跡及搜尋資料列。該歷程仍可使用相同的工作階段鍵搜尋；一般項目與工作階段清單只會顯示新的使用中對應。保留的重設歷程受磁碟預算限制，而非 `resetArchiveRetention`；後者只會淘汰封存成品。明確刪除則不同：它會先寫入並驗證壓縮的逐字稿封存檔（可使用 zstd 時為 `*.jsonl.deleted.<timestamp>.zst`），再移除已刪除工作階段的資料列。

`maxDiskBytes` 強制執行會使用實體位元組：每個代理程式的 SQLite 主檔、其 `-wal` 檔案，以及代理程式工作階段目錄中納入計算的檔案。它絕不估算資料列 JSON 大小，也不會從該總量中減去邏輯資料列大小。

閘道模型執行探測工作階段（鍵符合 `agent:*:explicit:model-run-<uuid>`）具有獨立且固定的 `24h` 保留期。此修剪由壓力觸發：僅在工作階段項目維護／上限壓力達到時執行，且只會在全域過時項目清理／上限步驟之前執行。其他明確建立的工作階段不使用此保留期。

當合併實體用量超過 `maxDiskBytes` 時，`mode: "enforce"` 會先回收可設定檢查點的資料庫空間，接著移除最舊的已保留重設／刪除封存。如果用量仍高於 `highWaterBytes`，它會依 `sessions.updated_at` 由舊到新巡覽歷史 SQLite 工作階段。所謂歷史工作階段，是指其工作階段 ID 未被使用中的工作階段項目、路由目標或已准入／執行中的作業參照。對每個清理目標，清理程序會寫入、執行 fsync，並讀回壓縮封存檔，之後寫入交易才會移除工作階段資料列及其逐字稿、軌跡、使用中狀態、索引與 FTS 投影。這也包括含有軌跡事件但沒有逐字稿事件的工作階段。清理程序會在刪除時重新檢查路由、項目及准入參照，在處理每個封存檔或工作階段清理目標後重新測量實體用量，並於 `highWaterBytes` 停止。

已提交的寫入與刪除會先進入 WAL。清理程序會為其設定檢查點，使 WAL 能立即縮小，接著使用增量 vacuum 從主檔歸還符合條件的尾端可用頁面；尚不可回收的頁面會留在主檔，因此在下一次實體測量中仍會被計入。`mode: "warn"` 會回報目前的實體超額量，而不設定檢查點、不寫入封存檔，也不刪除資料列。

依需求執行維護：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

維護會保留群組工作階段和以對話串為範圍的聊天工作階段等持久外部對話指標，但合成的執行階段項目（排程、鉤子、心跳偵測、ACP、子代理程式）在超過設定的時間、數量或磁碟預算後仍可移除。隔離的排程執行使用獨立的 `cron.sessionRetention` 控制項，與模型執行探測保留期無關。

一般閘道寫入會經過工作階段存取器，透過執行階段寫入器路徑序列化每個代理程式的 SQLite 變更。執行階段程式碼應優先使用 `src/config/sessions/session-accessor.ts` 中的存取器輔助函式；舊版 `sessions.json` 輔助函式是遷移與離線維護工具。可連線至閘道時，非試執行的 `openclaw sessions cleanup` 與 `openclaw agents delete` 會將儲存區變更委派給閘道，讓清理加入相同的寫入器佇列；`--store <path>` 是所選舊版儲存區的明確離線修復路徑，且一律在本機執行（`--dry-run` 也是如此）。`maxEntries` 清理會針對正式環境規模的儲存區分批執行，因此儲存區可能短暫超過設定的上限，直到下次高水位清理將其重寫至上限以下。閘道啟動期間，讀取絕不會修剪項目或套用上限，只有寫入或 `openclaw sessions cleanup --enforce` 才會這麼做；後者也會立即套用上限，並修剪未被參照的舊版逐字稿、檢查點與軌跡成品，即使未設定磁碟預算亦然。

OpenClaw 在閘道寫入期間不再自動建立 `sessions.json.bak.*` 輪替備份。目前的結構描述會拒絕舊版 `session.maintenance.rotateBytes` 鍵，而 `openclaw doctor --fix` 會將其從較舊的設定中移除。

逐字稿變更會對 SQLite 逐字稿目標使用工作階段寫入佇列：

工作階段寫入鎖使用固定的正式環境預設值。對應的
`OPENCLAW_SESSION_WRITE_LOCK_*` 環境變數仍可用於
程序層級診斷與緊急覆寫。

### 切換至 SQLite 後降級

執行較舊的檔案式 OpenClaw 版本前，請還原已封存的舊版逐字稿成品：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

遷移會保留舊版 `sessions.json` 檔案，以供支援與
回復使用，但已匯入 SQLite 的使用中逐字稿 JSONL 檔案會
重新命名至 `session-sqlite-import-archive/`。較舊的檔案式執行階段會依循
`sessions.json` 中的 `sessionFile` 路徑，因此必須在啟動前還原這些成品。
還原會使用遷移資訊清單，僅移動原始路徑已不存在且有記錄的封存
成品，並保留 SQLite 資料庫以供後續復原。

切換至 SQLite 後建立的工作階段僅存在於 SQLite，不會顯示在
較舊的檔案式執行階段中。如果降級後再次升級，請重新執行 Doctor
檢查與驗證程序，讓 OpenClaw 能在匯入前驗證已還原的舊版
成品。

## 排程工作階段與執行記錄

隔離的排程執行會建立自己的工作階段項目／逐字稿，並使用專屬保留設定：

- `cron.sessionRetention`（預設為 `"24h"`）會從儲存區修剪舊的隔離排程執行工作階段；`false` 會停用此功能。
- 執行歷程會為每個排程工作保留最新的 2000 個終止資料列。遺失的資料列仍保有 24 小時的清理期限。

當排程強制建立新的隔離執行工作階段時，會先清理先前的 `cron:<jobId>` 工作階段項目，再寫入新資料列：它會沿用安全的偏好設定（思考／快速／詳細／推理設定、標籤、顯示名稱）以及使用者明確選取的模型／驗證覆寫，但會捨棄環境對話上下文（頻道／群組路由、傳送／佇列原則、權限提升、來源、ACP 執行階段繫結），以免全新的隔離執行繼承舊執行中過時的傳遞或執行階段權限。

## 工作階段鍵（`sessionKey`）

`sessionKey` 用來識別你所在的對話容器（路由 + 隔離）。標準規則：[/concepts/session](/zh-TW/concepts/session)。

| 模式                         | 範例                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| 主要／直接聊天（每個代理程式） | `agent:<agentId>:<mainKey>`（預設為 `main`）                |
| 群組                         | `agent:<agentId>:<channel>:group:<id>`                      |
| 房間／頻道（Discord/Slack）  | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| 排程                         | `cron:<job.id>`                                             |
| 網路鉤子                     | `hook:<uuid>`（除非遭覆寫）                           |

## 工作階段 ID（`sessionId`）

每個 `sessionKey` 都指向目前的 `sessionId`（延續對話的 SQLite 逐字稿識別資訊）。決策邏輯位於 `src/auto-reply/reply/session.ts` 的 `initSessionState()` 中。

- **重設**（`/new`、`/reset`）會為該 `sessionKey` 建立新的 `sessionId`。
- 預設為**不自動重設**。目前的 `sessionId` 會繼續使用，而壓縮會將作用中模型的上下文維持在限制範圍內。
- **每日重設**（`session.reset.mode: "daily"`）會在超過已設定的本機小時界線（`session.reset.atHour`，預設為 `4`）後收到下一則訊息時，建立新的 `sessionId`。
- **閒置到期**（使用 `session.reset.mode: "idle"` 搭配 `session.reset.idleMinutes`，或舊版 `session.idleMinutes`）會在閒置時段結束後收到訊息時，建立新的 `sessionId`。若同時設定每日與閒置到期，會以先到期者為準。
- **控制介面重新連線續接**會在閘道從操作員介面用戶端收到相符的 `sessionId` 時，為重新連線後傳送的一則訊息保留目前可見的工作階段。這是一次性訊號；一般的過期傳送仍會建立新的 `sessionId`。
- **系統事件**（心跳偵測、排程喚醒、執行通知、閘道簿記）可能會變更工作階段資料列，但絕不會延長每日／閒置重設的新鮮度。重設輪替會在建立全新提示詞前，捨棄前一個工作階段佇列中的系統事件通知。
- **父項分支政策**在建立討論串或子代理分支時，會使用 OpenClaw 的作用中分支。若該分支過大（超過固定的內部上限，目前為 100K 個權杖），OpenClaw 會改以隔離的上下文啟動子項，而不會失敗或繼承無法使用的歷史記錄。大小評估會自動進行且無法設定；舊版 `session.parentForkMaxTokens` 設定會由 `openclaw doctor --fix` 移除。
- **操作員分支**：`sessions.create { parentSessionKey, fork: true }` 會建立新的工作階段，其文字記錄從父項的目前狀態分支而出（使用與產生子代理相同的分支機制，包括上述大小上限）。父項有作用中的執行時會拒絕建立分支；除非明確傳入模型選擇，否則會繼承父項的模型選擇，並以全新的權杖計數器將子項標示為 `forkedFromParent`。

## 工作階段儲存區結構描述

執行階段儲存區會將 `SessionEntry` 值保存在各代理的 SQLite 中。值類型是在 `src/config/sessions.ts` 中定義的 `SessionEntry`。主要欄位（非完整清單）：

- `sessionId`：用於定址 SQLite 文字記錄資料列的目前文字記錄 ID
- `sessionStartedAt`：目前 `sessionId` 的開始時間戳記；每日重設的新鮮度會使用此值。舊版資料列可從 JSONL 工作階段標頭推導此值。
- `lastInteractionAt`：上次真實使用者／頻道互動的時間戳記；閒置重設的新鮮度會使用此值，因此心跳偵測、排程和執行事件不會讓工作階段持續有效。沒有此欄位的舊版資料列會改用復原的工作階段開始時間。
- `updatedAt`：上次變更儲存區資料列的時間戳記，用於列出／清除／簿記，而非每日／閒置新鮮度的依據。
- `archivedAt`：選用的封存時間戳記。已封存的工作階段會連同完整文字記錄保留在儲存區中，且不會出現在一般的作用中清單內。
- `pinnedAt`：選用的釘選時間戳記。作用中的已釘選工作階段會排在未釘選工作階段之前；封存工作階段會清除其釘選狀態。
- Codex 討論串互通：兩個欄位都遵循 Codex 的討論串管理格式——線路上的 `archived`/`pinned` 布林值一律從時間戳記推導，並由伺服器端加上，符合 Codex `threads.archived_at` 語意與 camelCase 序列化。OpenClaw 時間戳記使用 Epoch 毫秒，而 Codex 使用 Epoch 秒，因此橋接器會在 `codex` 外掛接合處進行轉換。Codex 尚無釘選 API（僅有 `thread/archive`/`thread/unarchive`）；在 API 出現前，釘選狀態會留在 OpenClaw 端，屆時相符的格式可讓繫結的工作階段以機械化方式來回傳遞釘選狀態。
- Codex 監督功能只會列出未封存的原生討論串。對於閘道本機狀態為 `idle` 或 `notLoaded`、活動狀態不明的討論串，只有在操作員明確確認沒有其他 Codex 程序擁有該討論串後，才能透過原生 `thread/archive` 封存；外掛會先重新讀取程序本機狀態，之後該討論串便會從目錄中消失。這項讀取無法證明另一個 App Server 程序並未使用該討論串。OpenClaw 會拒絕封存作用中與錯誤資料列；在節點橋接器能擁有完整的串流討論串生命週期前，無法使用配對節點封存。在原生 Codex 用戶端中取消封存後，討論串便符合再次出現的資格。
- `lastReadAt` / `markedUnreadAt`：由 `sessions.patch { unread }` 在伺服器端加上的讀取狀態時間戳記——`unread: false` 會記錄已讀（設定 `lastReadAt`、清除 `markedUnreadAt`）；`unread: true` 會將工作階段標示為未讀，直到下次讀取為止。工作階段資料列會公開衍生的 `unread` 布林值：已明確標示為未讀，或讀取時間早於最新活動。從未標示為已讀的工作階段會維持 `unread: false`，因此現有安裝不會在升級時全部亮起。
- `lastActivityAt`：上次完成且應視為未讀活動之代理執行的時間戳記（使用者、頻道和排程執行）。心跳偵測和內部事件回合，以及中繼資料修補，都不會更新此值；`updatedAt` 並非活動訊號。
- `sessionFile`：為移轉／封存相容性保留的舊版標記；作用中執行階段使用 SQLite 身分識別
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群組／頻道標籤中繼資料
- 切換項目：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（各工作階段覆寫）
- 模型選擇：`providerOverride`、`modelOverride`、`authProfileOverride`
- 權杖計數器（盡力而為／依提供者而定）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此工作階段索引鍵完成自動壓縮的次數
- `memoryFlushAt` / `memoryFlushCompactionCount`：上次壓縮前記憶體清除的時間戳記與壓縮次數

閘道是權威來源：工作階段執行時，它可能會重寫或重新載入項目。對於使用舊版檔案型後端的安裝，請使用
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` 進行移轉，而不要編輯
`sessions.json` 並預期執行階段會繼續讀取該檔案。

## 文字記錄事件結構

文字記錄由 OpenClaw 工作階段存取器管理，並透過以身分識別為基礎的輔助函式提供給執行階段程式碼。事件串流僅能附加：

- 第一個項目：工作階段標頭——`type: "session"`、`id`、`cwd`、`timestamp`，以及選用的 `parentSession`。
- 接著是：包含 `id` + `parentId` 的項目（樹狀結構）。

重要項目類型：

- `message`：使用者／助理／toolResult 訊息
- `custom_message`：由擴充功能注入且_會_進入模型上下文的訊息（在 `display: true` 時顯示於終端介面中，在 `display: false` 時則完全隱藏）
- `custom`：_不會_進入模型上下文的擴充功能狀態（用於在重新載入之間保存擴充功能狀態）
- `compaction`：包含 `firstKeptEntryId` 和 `tokensBefore` 的持久化壓縮摘要
- `branch_summary`：瀏覽樹狀分支時保存的摘要

OpenClaw 刻意不會“修正”文字記錄；閘道使用 `SessionManager` 讀寫文字記錄。

## 上下文視窗與追蹤的權杖

這是兩個不同的概念：

1. **模型上下文視窗**：各模型的硬性上限（模型可見的權杖）。此值來自模型目錄，並可透過設定覆寫。
2. **工作階段儲存區計數器**：寫入工作階段資料列的滾動統計資料（供 `/status` 和儀表板使用）。`contextTokens` 是執行階段估算／報告值——請勿將其視為嚴格保證。

如需進一步瞭解限制，請參閱：[/reference/token-use](/zh-TW/reference/token-use)。

## 壓縮：其作用

壓縮會將較舊的對話摘要為文字記錄中持久化的 `compaction` 項目，並保留近期訊息。壓縮後，未來的回合會看到壓縮摘要，以及 `firstKeptEntryId` 之後的訊息。壓縮具有**持久性**，不同於工作階段修剪——請參閱 [/concepts/session-pruning](/zh-TW/concepts/session-pruning)。

內嵌式 OpenClaw 壓縮預設會繼承工作階段的思考層級。設定 `agents.defaults.compaction.thinkingLevel` 可讓摘要呼叫使用不同層級；執行階段會根據各個實際的壓縮模型或備援模型限制該層級。原生 Codex App Server 壓縮會自行控制其壓縮要求，且無法接受各次壓縮專用的思考覆寫，因此 OpenClaw 會發出警告，並將該設定交由 Codex 處理。

透過 `agents.defaults.compaction.postCompactionSections` 可選擇在壓縮後重新注入 AGENTS.md 區段；若未設定或為 `[]`，OpenClaw 不會在壓縮摘要之後附加 AGENTS.md 摘錄。

### 區塊邊界與工具配對

將長篇文字記錄分割為壓縮區塊時，OpenClaw 會讓助理工具呼叫與其相符的 `toolResult` 項目保持配對：

- 若依權杖占比分割的位置落在工具呼叫與其結果之間，OpenClaw 會將邊界移至助理工具呼叫訊息，而不會拆開兩者。
- 若尾端的工具結果區塊原本會使區塊超過目標大小，OpenClaw 會保留該待處理工具區塊，並讓尚未摘要的尾端維持完整。
- 已中止／錯誤的工具呼叫區塊不會讓待處理的分割持續開啟。

## 自動壓縮的觸發時機

內嵌式 OpenClaw 代理中有兩個觸發條件：

1. **溢位復原**：模型傳回上下文溢位錯誤（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`，以及其他提供者格式的變體）——先壓縮，再重試。當提供者回報嘗試使用的權杖數時，OpenClaw 會將觀察到的數量轉送至溢位復原壓縮；若提供者確認發生溢位，卻未公開可剖析的數量，OpenClaw 會將僅略高於預算的合成數量傳給壓縮引擎與診斷功能。若溢位復原仍失敗，OpenClaw 會顯示明確指引並保留目前的工作階段對應，而不會無提示地輪替為新的工作階段 ID——請重試訊息、執行 `/compact`，或執行 `/new`。
2. **臨界值維護**：成功完成回合後，當目前上下文超過模型視窗減去 OpenClaw 為提示詞和下一次模型輸出預留的內建空間時。

除了這兩個觸發條件外，還會執行兩項額外的防護檢查：

- **執行前本機壓縮**：設定 `agents.defaults.compaction.maxActiveTranscriptBytes`（位元組數，或類似 `"20mb"` 的字串），讓作用中的逐字記錄達到該大小後，在開啟下一次執行前觸發本機壓縮。這是針對本機重新開啟成本的大小防護機制，而非原始封存；一般的語意壓縮仍會執行，且需要 `truncateAfterCompaction`，才能讓壓縮後的摘要成為新的後繼逐字記錄。
- **回合中預先檢查**：設定 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（預設為 `false`）以新增工具迴圈防護機制。附加工具結果後、下次呼叫模型前，OpenClaw 會使用與回合開始時相同的執行前預算邏輯來估算提示詞壓力。如果上下文已無法容納，防護機制不會就地壓縮，而是發出結構化的回合中預先檢查訊號、停止目前的提示詞提交，並讓外層執行迴圈使用既有的復原路徑（若截斷過大的工具結果即可解決，便進行截斷；否則觸發已設定的壓縮模式並重試）。這適用於 `default` 和 `safeguard` 兩種壓縮模式，包括由供應商支援的防護壓縮。此機制獨立於 `maxActiveTranscriptBytes`：位元組大小防護會在回合開啟前執行，回合中預先檢查則會在之後附加新工具結果後執行。

## 壓縮設定

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw 會對嵌入式執行強制套用內建保留額度，並依作用中模型的上下文視窗設定上限，使其無法耗盡整個提示詞預算。如此可避免上下文較小的本機模型從第一個權杖起就進入壓縮，同時保留足夠空間進行多回合的內務處理，例如記憶體排清。

手動 `/compact` 會遵循明確指定的 `agents.defaults.compaction.keepRecentTokens`，並保留執行階段的近期尾端切分點。若未明確指定保留預算，手動壓縮會成為硬性檢查點，重建的上下文將從新摘要開始。

啟用 `truncateAfterCompaction` 時，OpenClaw 會在壓縮後將作用中的逐字記錄輪替為壓縮後的後繼逐字記錄。分支／還原檢查點動作會使用該壓縮後的後繼逐字記錄；只要仍被參照，舊版的壓縮前檢查點檔案仍可讀取。

## 可插拔壓縮供應商

外掛透過外掛 API 上的 `registerCompactionProvider()` 註冊壓縮供應商。當 `agents.defaults.compaction.provider` 設為已註冊的供應商 ID 時，防護擴充功能會將摘要工作委派給該供應商，而非使用內建的 `summarizeInStages` 流水線。

- `provider`：已註冊壓縮供應商外掛的 ID。保持未設定即可使用預設的 LLM 摘要。設定 `provider` 會強制使用 `mode: "safeguard"`。
- 供應商會收到與內建路徑相同的壓縮指示及識別碼保留政策，而防護機制仍會在供應商輸出後保留近期回合及分割回合的後綴上下文。
- 內建防護摘要會將先前摘要與新訊息重新提煉，而非逐字保留完整的先前摘要。
- 防護模式預設會啟用摘要品質稽核；設定 `qualityGuard.enabled: false` 可略過格式錯誤輸出時的重試行為。
- 如果供應商失敗或傳回空白結果，OpenClaw 會自動退回使用內建 LLM 摘要。呼叫端明確觸發的中止／逾時訊號會重新擲出，而不會被忽略，因此一律會遵循取消操作。

來源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 使用者可見介面

- 任何聊天工作階段中的 `/status`
- `openclaw status`（命令列介面）
- `openclaw sessions`／`openclaw sessions --json`
- 閘道記錄（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 詳細模式：`🧹 Auto-compaction complete` 加上壓縮次數

## 靜默內務處理（`NO_REPLY`）

OpenClaw 支援用於背景工作的「靜默」回合，讓使用者看不到中間輸出。

- 助理以完全相符的靜默權杖 `NO_REPLY`／`no_reply` 開始輸出，表示「不要向使用者傳送回覆」。OpenClaw 會在傳送層將其移除／抑制。
- 完全相符的靜默權杖抑制不區分大小寫：當整個承載內容只有靜默權杖時，`NO_REPLY` 和 `no_reply` 都會被視為符合。
- 自 `2026.1.10` 起，若部分區塊以 `NO_REPLY` 開頭，OpenClaw 也會抑制草稿／輸入狀態串流，避免靜默作業在回合中途洩漏部分輸出。
- 這只適用於真正的背景／不傳送回合，不能作為處理一般可執行使用者要求的捷徑。

## 壓縮前記憶體排清

在自動壓縮發生前，OpenClaw 可以執行一個靜默代理式回合，將持久狀態寫入磁碟（例如代理工作區中的 `memory/YYYY-MM-DD.md`），避免壓縮抹除關鍵上下文。它會監控工作階段上下文用量；當用量超過低於壓縮臨界值的軟性臨界值時，便使用完全相符的靜默權杖 `NO_REPLY`／`no_reply` 傳送靜默的「立即寫入記憶」指示，讓使用者看不到任何內容。

設定（`agents.defaults.compaction.memoryFlush`），完整參考資料位於 [/gateway/config-agents](/zh-TW/gateway/config-agents#agentsdefaultscompaction)：

| 鍵                          | 預設值           | 備註                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未設定           | 僅供排清回合使用的明確供應商／模型覆寫，例如 `ollama/qwen3:8b`                                                   |
| `softThresholdTokens`       | `4000`           | 低於壓縮臨界值多少時觸發排清                                                                                                          |
| `forceFlushTranscriptBytes` | 未設定（停用）   | 逐字記錄檔案達到此位元組大小（或類似 `"2mb"` 的字串）時強制排清，即使權杖計數器已過時亦同；`0` 會停用 |
| `prompt`                    | 內建             | 排清回合的使用者訊息                                                                                                                   |
| `systemPrompt`              | 內建             | 為排清回合附加的額外系統提示詞                                                                                                         |

備註：

- 預設提示詞／系統提示詞包含 `NO_REPLY` 提示，以抑制傳送。
- 設定 `model` 時，排清回合會使用該模型，且不會繼承作用中工作階段的備援鏈，因此僅限本機的內務處理在失敗時，不會悄悄退回使用付費的對話模型。
- 每個壓縮週期只會執行一次排清（記錄於工作階段資料列中）。
- 排清僅會針對嵌入式 OpenClaw 工作階段執行；命令列介面後端與心跳偵測回合會略過。
- 工作階段工作區為唯讀（`workspaceAccess: "ro"` 或 `"none"`）時，會略過排清。
- 工作區檔案配置與寫入模式請參閱[記憶體](/zh-TW/concepts/memory)。

OpenClaw 在擴充功能 API 中公開 `session_before_compact` 掛鉤，但上述排清邏輯位於閘道端（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），而非該掛鉤中。

## 疑難排解檢查清單

- **工作階段索引鍵錯誤？**請先參閱[/concepts/session](/zh-TW/concepts/session)，並確認 `/status` 中的 `sessionKey`。
- **儲存區與逐字記錄不相符？**請確認閘道主機，以及 `openclaw status` 顯示的儲存區路徑。
- **頻繁壓縮？**請檢查模型的上下文視窗（太小會強制頻繁壓縮）與工具結果膨脹情況（調整工作階段修剪設定）。
- **使用小型本機模型時，每個提示詞似乎都會溢位？**請確認供應商回報了正確的模型上下文視窗。OpenClaw 只有在得知該視窗大小時，才能限制有效保留額度。
- **靜默回合洩漏？**請確認回覆以完全相符的靜默權杖 `NO_REPLY` 開頭（不區分大小寫），且你使用的版本包含串流抑制修正（`2026.1.10`+）。

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
- [上下文引擎](/zh-TW/concepts/context-engine)
- [代理設定參考](/zh-TW/gateway/config-agents)
