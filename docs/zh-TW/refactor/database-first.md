---
read_when:
    - 將 OpenClaw 執行階段資料、快取、逐字稿、任務狀態或暫存檔案移至 SQLite
    - 從舊版 JSON 或 JSONL 檔案設計 doctor 遷移機制
    - 變更備份、還原、VFS 或工作程序儲存行為
    - 移除工作階段鎖定、修剪、截斷或 JSON 相容性路徑
summary: 將 SQLite 設為主要持久狀態與快取層，同時維持設定由檔案支援的遷移計畫
title: 資料庫優先的狀態重構
x-i18n:
    generated_at: "2026-07-14T14:06:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 006d0c07d9960018f7ed47888776be022ab851b813166e90e28a81c0196ffc9f
    source_path: refactor/database-first.md
    workflow: 16
---

# 資料庫優先狀態重構

## 決策

使用兩層 SQLite 配置：

- 全域資料庫：`~/.openclaw/state/openclaw.sqlite`
- 代理程式資料庫：每個代理程式各有一個 SQLite 資料庫，用於代理程式所擁有的工作區、
  逐字記錄、VFS、成品，以及大型的每代理程式執行階段狀態
- 設定維持以檔案為後端：`openclaw.json` 仍位於
  資料庫之外。執行階段驗證設定檔移至 SQLite；外部供應商或命令列介面
  認證資訊檔案仍由其擁有者在 OpenClaw 資料庫之外管理。

全域資料庫是控制平面資料庫。它負責代理程式探索、
共用閘道狀態、配對、裝置／節點狀態、任務與流程帳冊、外掛
狀態、排程器執行階段狀態、備份中繼資料，以及遷移狀態。

代理程式資料庫是資料平面資料庫。它負責代理程式的工作階段
中繼資料、逐字記錄事件串流、VFS 工作區或暫存命名空間、工具
成品、執行成品，以及可搜尋／可建立索引的代理程式本機快取資料。

如此可提供單一持久的全域檢視，而不必強制將大型代理程式工作區、
逐字記錄和二進位暫存資料放入共用閘道寫入通道。

## 強制契約

此遷移只有一種標準執行階段形態：

- 工作階段資料列僅持久化工作階段中繼資料。它們不得持久化
  `transcriptLocator`、逐字記錄檔案路徑、同層 JSONL 路徑、鎖定路徑、
  修剪中繼資料，或檔案時代的相容性指標。
- 逐字記錄識別一律使用 SQLite 識別：`{agentId, sessionId}`，並在
  通訊協定需要時加上選用的主題中繼資料。
- `sqlite-transcript://...` 不是執行階段或通訊協定識別。新程式碼不得
  衍生、持久化、傳遞、剖析或遷移逐字記錄定位器。執行階段與
  測試完全不應包含偽定位器；文件只能為了禁止該字串而提及它。
- 舊版 `sessions.json`、逐字記錄 JSONL、`.jsonl.lock`、修剪、截斷，
  以及舊工作階段路徑邏輯，只能存在於 doctor 遷移／匯入路徑。
- 舊版工作階段設定別名只能存在於 doctor 遷移。執行階段不會
  解讀 `session.idleMinutes`、`session.resetByType.dm`，也不會為另一個已設定的代理程式解讀
  跨代理程式的 `agent:main:*` 主要工作階段別名。
- 工作階段路由識別是具型別的關聯狀態。高頻執行階段與 UI 路徑
  應讀取 `sessions.session_scope`、`sessions.account_id`、
  `sessions.primary_conversation_id`、`conversations` 和
  `session_conversations`；它們不得剖析 `session_key`，也不得從
  `session_entries.entry_json` 挖掘供應商識別，但在刪除舊呼叫端期間作為相容性
  影子資料者除外。
- 通道層級的直接訊息標記（例如 `dm` 與 `direct`）是路由
  詞彙，而非逐字記錄定位器或檔案儲存相容性控制代碼。
- 舊版鉤子處理常式設定只能存在於 doctor 警告／遷移介面。
  執行階段不得載入 `hooks.internal.handlers`；鉤子只能透過探索到的
  鉤子目錄和 `HOOK.md` 中繼資料執行。
- 執行階段啟動、高頻回覆路徑、壓縮、重設、復原、診斷、
  TTS、記憶鉤子、子代理程式、外掛命令路由、通訊協定邊界，以及
  鉤子，都必須在執行階段中傳遞 `{agentId, sessionId}`。
- 測試應透過 `{agentId, sessionId}`
  植入並判定 SQLite 逐字記錄資料列。若測試只證明 JSONL 路徑轉送、
  保留呼叫端提供的定位器，或逐字記錄檔案相容性，則應予刪除；
  涵蓋 doctor 匯入、非工作階段支援／偵錯具現化或通訊協定形態者除外。
- `runEmbeddedPiAgent(...)`、準備完成的工作程式執行，以及內層嵌入式
  嘗試都不得接受逐字記錄定位器。它們透過 `{agentId, sessionId}`
  開啟 SQLite 逐字記錄管理器，並將該管理器傳給內部化的
  PI 相容代理程式工作階段，因此過時的呼叫端無法讓執行器寫入
  JSON／JSONL 逐字記錄。
- 執行器診斷必須將執行階段／快取／承載資料追蹤記錄儲存在 SQLite。
  執行階段診斷不得公開 JSONL 檔案覆寫旋鈕或通用的
  逐字記錄 JSONL 匯出輔助函式；面向使用者的匯出可從資料庫資料列具現化明確的
  成品，而不將檔案名稱傳回執行階段。
- 原始串流記錄使用 `OPENCLAW_RAW_STREAM=1` 加上 SQLite 診斷資料列。
  舊版 pi-mono 的 `PI_RAW_STREAM`、`PI_RAW_STREAM_PATH` 和
  `raw-openai-completions.jsonl` 檔案記錄器契約，不屬於 OpenClaw
  執行階段或測試。
- QMD 記憶索引不得將 SQLite 逐字記錄匯出至 Markdown 檔案。
  QMD 僅為已設定的記憶檔案建立索引；工作階段逐字記錄搜尋仍以
  SQLite 為後端。
- 對於新程式碼，QMD SDK 子路徑僅供 QMD 使用。SQLite 工作階段逐字記錄
  索引輔助函式位於 `memory-core-host-engine-session-transcripts`；任何
  QMD 再匯出僅供相容性使用，執行階段程式碼不得使用。
- 內建記憶索引位於其所屬的代理程式資料庫。執行階段設定與
  已解析的執行階段契約不得公開 `memorySearch.store.path`；doctor
  會刪除該舊版設定鍵，而目前程式碼會在內部傳遞代理程式
  `databasePath`。

實作工作應持續刪除程式碼，直到這些陳述在
doctor／匯入／匯出／偵錯邊界之外皆無例外地成立。

## 目標狀態與進度

### 強制目標

- 由一個全域 SQLite 資料庫負責控制平面狀態：
  `state/openclaw.sqlite`。
- 由每個代理程式各自的一個 SQLite 資料庫負責資料平面狀態：
  `agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定維持以檔案為後端。`openclaw.json` 不屬於此資料庫
  重構範圍。
- 舊版檔案只能作為 doctor 遷移輸入。
- 執行階段絕不會將工作階段或逐字記錄 JSONL 作為有效狀態進行讀寫。

### 目標狀態

- `not-started`：檔案時代的執行階段程式碼仍會寫入有效狀態。
- `migrating`：doctor／匯入程式碼可將檔案資料移至 SQLite。
- `dual-read`：暫時性橋接會同時讀取 SQLite 與舊版檔案。此重構
  禁止使用此狀態，除非明確記載為僅供 doctor 使用。
- `sqlite-runtime`：執行階段僅讀寫 SQLite。
- `clean`：舊版執行階段 API 與測試已移除，且防護機制可防止
  回歸。
- `done`：文件、測試、備份、doctor 遷移和變更檢查可證明
  狀態已清理完成。

### 目前狀態

- 工作階段：執行階段為 `clean`。工作階段資料列位於每代理程式資料庫，
  執行階段 API 使用 `{agentId, sessionId}` 或 `{agentId, sessionKey}`，而
  `sessions.json` 僅是 doctor 的舊版輸入。
- 逐字記錄：執行階段為 `clean`。逐字記錄事件、識別、快照
  和軌跡執行階段事件位於每代理程式資料庫。執行階段不再
  接受逐字記錄定位器或 JSONL 逐字記錄路徑。
- PI 嵌入式執行器：`clean`。嵌入式 PI 執行、準備完成的工作程式、壓縮
  和重試迴圈使用 SQLite 工作階段範圍，並拒絕過時的逐字記錄控制代碼。
- 排程：執行階段為 `clean`。執行階段使用 `cron_jobs` 和排程所擁有的 `task_runs`；
  執行階段測試使用 SQLite `storeKey` 命名，而檔案時代的排程路徑僅保留於
  doctor 舊版遷移測試。
- 任務登錄：`clean`。任務與 Task Flow 執行階段資料列位於
  `state/openclaw.sqlite`；未發布的附屬 SQLite 匯入器已刪除。
- 外掛狀態：`clean`。外掛狀態／Blob 資料列位於共用全域
  資料庫；已有防護機制防止使用舊外掛狀態附屬 SQLite 輔助函式。
- 記憶：內建記憶與工作階段逐字記錄索引為 `sqlite-runtime`。
  記憶索引資料表位於每代理程式資料庫，外掛記憶狀態使用
  共用外掛狀態資料列，而舊版記憶檔案是 doctor 遷移輸入
  或使用者工作區內容。
- 備份：`sqlite-runtime`。備份會暫存壓縮後的 SQLite 快照、省略即時
  WAL／SHM 附屬檔案、驗證 SQLite 完整性，並在
  全域資料庫中記錄備份執行。
- Doctor 遷移：刻意為 `migrating`。Doctor 會將舊版 JSON、
  JSONL 和已淘汰的附屬儲存匯入 SQLite、記錄遷移執行／來源，
  並移除成功匯入的來源。
- E2E 指令碼：執行階段涵蓋範圍為 `clean`。Docker MCP 植入會寫入 SQLite
  資料列。執行階段情境 Docker 指令碼僅在
  doctor 遷移植入資料中建立舊版 JSONL，並明確命名舊版工作階段索引路徑。

### 剩餘工作

- [x] 重新命名排程執行階段測試的儲存變數，使其不再使用 `storePath`，除非
      它們是 doctor 舊版輸入。
      檔案：`src/cron/service.test-harness.ts`、
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`、
      `src/cron/service/timer.regression.test.ts`、
      `src/cron/service/ops.test.ts`、`src/cron/service/store.test.ts`、
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`、
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`、
      `src/cron/store.test.ts`。
      證明：`pnpm check:database-first-legacy-stores`；`rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`。
- [x] 移除或重新命名過時的檔案時代匯出測試模擬。
      檔案：`src/auto-reply/reply/commands-export-test-mocks.ts`。
      證明：`rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`。
- [x] 讓 Docker 執行階段情境中的舊版 JSONL 植入明確顯示為僅供 doctor 使用。
      檔案：`scripts/e2e/session-runtime-context-docker-client.ts`。
      證明：`rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` 僅顯示
      `seedBrokenLegacySessionForDoctorMigration`。
- [x] 在任何結構描述變更後，維持 Kysely 產生的型別一致。
      檔案：`src/state/openclaw-state-schema.sql`、
      `src/state/openclaw-agent-schema.sql`、
      `src/state/*generated*`。
      證明：此輪沒有結構描述變更；`pnpm db:kysely:check`；
      `pnpm lint:kysely`。
- [x] 重新執行針對已修改儲存、命令與指令碼的聚焦測試。
      證明：`pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`；`git diff --check`。
- [x] 在宣告 `done` 前，執行變更閘門或遠端廣泛證明。
      證明：`pnpm check:changed --timed -- <changed extension paths>` 已在
      Hetzner Crabbox 執行 `run_3f1cabf6b25c` 中通過；該執行使用臨時 Node 24／pnpm 設定，以及
      為同步後不含 `.git` 的工作區設定的明確路徑路由。

### 不得回歸

- 不得有逐字記錄定位器。
- 不得有有效的工作階段檔案。
- 除 doctor 舊版遷移測試外，不得有虛假的 JSONL 測試固定資料。
- 預期使用 Kysely 之處不得直接存取 SQLite。
- 不得新增檔案時代的資料庫遷移。全域結構描述版本維持在 `1`。
  已發布的每代理程式版本 `1` 結構描述有一個範圍受限的執行階段遷移，可遷移至
  版本 `2`，以提供穩定的記憶來源識別。

## 程式碼閱讀假設

沒有任何後續產品決策會阻礙此計畫。實作應依照
下列假設進行：

- 直接使用 `node:sqlite`，並要求此儲存路徑使用可安全重設 WAL 的 Node 執行環境
  （22.22.3+、24.15+ 或 25.9+）。
- 僅保留一個一般設定檔。此重構不得將設定、外掛
  資訊清單或 Git 工作區移入 SQLite。
- 不需要執行環境相容性檔案。舊版 JSON 與 JSONL 檔案僅作為
  遷移輸入。分支本機的 SQLite 附屬檔案從未發布，因此直接刪除，
  而不匯入。
- `openclaw doctor --fix` 負責將舊版檔案遷移至資料庫。執行環境
  啟動僅負責已發布 SQLite 結構描述版本之間的有限升級；
  不得匯入檔案時代的狀態。
- 認證資訊相容性遵循相同規則：執行環境認證資訊存放於
  SQLite。舊版 `auth-profiles.json`、每個代理程式的 `auth.json`，以及共用的
  `credentials/oauth.json` 檔案皆為 doctor 遷移輸入，並在
  匯入後移除。
- 產生的模型目錄狀態由資料庫支援。執行環境程式碼不得寫入
  `agents/<agentId>/agent/models.json`；現有的 `models.json` 檔案是舊版
  doctor 輸入，匯入 `agent_model_catalogs` 後即移除。
- 執行環境不得遷移、正規化或橋接逐字稿定位器。有效的
  逐字稿識別資訊是 SQLite 中的 `{agentId, sessionId}`。檔案路徑
  僅為舊版 doctor 輸入，而 `sqlite-transcript://...` 必須從
  執行環境、協定、鉤子及外掛介面中消失，不得將其視為
  邊界控制代碼。
- 執行環境讀取 SQLite 逐字稿時，不會執行舊版 JSONL 項目格式遷移，
  也不會為了相容性而重寫整份逐字稿。舊版項目正規化僅保留於
  明確的 doctor／匯入工具中。Doctor 會先正規化舊版 JSONL 逐字稿
  檔案，再插入 SQLite 資料列；目前的執行環境資料列
  已使用現行逐字稿結構描述寫入。軌跡／工作階段匯出
  會依原樣讀取這些資料列，且不得在匯出時執行舊版遷移。
- 舊版逐字稿 JSONL 解析／遷移輔助函式僅供 doctor 使用。執行環境
  逐字稿格式程式碼只會建構目前的 SQLite 逐字稿內容；doctor
  負責在插入資料列前升級舊版 JSONL 項目。
- 舊有由執行環境負責的 JSONL 逐字稿串流輔助函式已刪除。Doctor
  匯入程式碼負責明確讀取舊版檔案；執行環境工作階段歷程則讀取
  SQLite 資料列。
- Codex 應用程式伺服器繫結使用 OpenClaw `sessionId` 作為 Codex
  外掛狀態命名空間中的標準鍵。`sessionKey` 是用於
  路由／顯示的中繼資料，不得取代持久工作階段 ID，亦不得恢復
  逐字稿檔案識別資訊。
- 內容引擎會直接接收目前的執行環境合約。登錄檔
  不得以會刪除 `sessionKey`、
  `transcriptScope` 或 `prompt` 的重試相容層包裝引擎；無法接受目前
  資料庫優先參數的引擎應明確失敗，而非透過橋接運作。
- 備份輸出應維持為單一封存檔。資料庫內容應以
  精簡的 SQLite 快照形式加入該封存檔，而非未處理的即時 WAL 附屬檔案。
- 逐字稿搜尋很實用，但首次資料庫優先改版不強制要求。
  結構描述設計應讓日後可加入 FTS。
- 在資料庫邊界穩定之前，背景工作執行應繼續透過設定維持實驗性功能。

## 程式碼閱讀結果

目前分支已超越概念驗證階段。共用
資料庫已存在，Node `node:sqlite` 已透過小型執行環境輔助函式接通，而
原有儲存區現已寫入 `state/openclaw.sqlite` 或其所屬的
`openclaw-agent.sqlite` 資料庫。

剩餘工作並非選擇 SQLite，而是保持新邊界簡潔，
並刪除所有仍類似舊檔案世界的相容性介面：

- 工作階段 `storePath` 不再是執行環境識別資訊、測試固定資料格式或
  狀態承載資料欄位。執行環境與橋接測試已不再包含
  `storePath` 合約名稱；該舊版詞彙由 doctor／遷移程式碼負責。
- 工作階段寫入不再經過舊有的程序內 `store-writer.ts`
  佇列。SQLite 修補寫入會先在交易外完成準備，再使用短暫的
  同步驗證／套用交易，並明確偵測衝突。
- 舊版路徑探索仍有有效的遷移用途，但執行環境程式碼應
  停止將 `sessions.json` 與逐字稿 JSONL 檔案視為可能的寫入
  目標。
- 代理程式所屬的資料表存放於每個代理程式各自的 SQLite 資料庫中。全域資料庫保留
  登錄檔／控制平面資料列；逐字稿識別資訊是每個代理程式逐字稿資料列中的
  `{agentId, sessionId}`。執行環境程式碼不得保存逐字稿檔案
  路徑或遷移逐字稿定位器。
- Doctor 已匯入多個舊版檔案。清理工作的目標是將其整理為
  單一明確的遷移實作，由 doctor 呼叫，並產生持久的
  遷移報告。

沒有其他產品問題會阻礙實作。

## 目前的程式碼結構

此分支已有真正的共用 SQLite 基礎：

- 執行環境的最低版本現在要求採用可安全重設 WAL 的 Node 建置版本：22.22.3+、
  24.15+ 或 25.9+。`package.json`、命令列介面執行環境防護、安裝程式預設值、
  macOS 執行環境定位器、CI 與公開安裝文件現在全都一致。
- `src/state/openclaw-state-db.ts` 會開啟 `openclaw.sqlite`、設定 WAL、
  `synchronous=NORMAL`、`busy_timeout=30000`、`foreign_keys=ON`，並套用
  衍生自 `src/state/openclaw-state-schema.sql`
  的產生式結構描述模組。
- Kysely 資料表型別與執行環境結構描述模組，是從使用已提交的 `.sql` 檔案建立的
  可拋棄式 SQLite 資料庫產生；全域、各代理程式或代理擷取資料庫的執行環境程式碼
  不再保留複製貼上的結構描述字串。
- 執行環境儲存區會從那些產生的 Kysely `DB` 介面衍生所選取及插入的資料列型別，
  而非手動另行定義 SQLite 資料列形狀。原始 SQL 仍僅限用於套用結構描述、
  pragma 與僅供遷移使用的 DDL。
- 全域 SQLite 結構描述仍為 `user_version = 1`。各代理程式結構描述
  的版本為 `2`；其開啟器會以不可分割的方式，將已發布版本 `1`
  的記憶來源鍵遷移為穩定的整數識別碼。檔案至資料庫的匯入
  仍保留在 doctor 程式碼中。
- 在擁有權邊界具權威性的地方會強制執行關聯式擁有權：
  來源遷移資料列會從 `migration_runs` 串聯刪除、任務傳遞狀態
  會從 `task_runs` 串聯刪除，而逐字稿識別資料列則會從
  逐字稿事件串聯刪除。
- 目前的共用資料表包括 `agent_databases`、
  `auth_profile_stores`、`auth_profile_state`、
  `plugin_state_entries`、`plugin_blob_entries`、`media_blobs`、
  `skill_uploads`、`capture_sessions`、`capture_events`、`capture_blobs`、
  `sandbox_registry_entries`、`cron_jobs`、`commitments`、
  `delivery_queue_entries`、`model_capability_cache`、
  `workspace_setup_state`、`native_hook_relay_bridges`、
  `current_conversation_bindings`、`plugin_binding_approvals`、
  `tui_last_sessions`、`acp_sessions`、`acp_replay_sessions`、
  `acp_replay_events`、`task_runs`、`task_delivery_state`、`flow_runs`、
  `subagent_runs`、`migration_runs` 與 `backup_runs`。
- 任意由外掛擁有的狀態不會取得由主機擁有的具型別資料表。已安裝的
  外掛會使用 `plugin_state_entries` 儲存具版本的 JSON 承載資料，並使用
  `plugin_blob_entries` 儲存位元組，同時具備命名空間／鍵擁有權、TTL 清理、
  備份與外掛遷移記錄。當主機擁有查詢合約時，由主機擁有的外掛協調狀態
  仍可使用具型別資料表，例如
  `plugin_binding_approvals`。
- 外掛遷移是針對外掛擁有命名空間的資料遷移，而非主機
  結構描述遷移。外掛可以透過遷移提供者遷移自己具版本的狀態／Blob 項目，
  而主機則會在一般遷移帳本中記錄來源／執行狀態。新安裝外掛
  不需要變更 `openclaw-state-schema.sql`，除非主機本身要接管
  新的跨外掛合約。
- `src/state/openclaw-agent-db.ts` 會開啟
  `agents/<agentId>/agent/openclaw-agent.sqlite`、在全域資料庫中註冊該資料庫，並擁有代理程式本機的工作階段、
  逐字稿、VFS、成品、快取與記憶索引資料表。共用執行環境探索現在會讀取具產生型別的
  `agent_databases` 登錄，而不再於每個呼叫位置重新實作該查詢。
- 全域與各代理程式資料庫會記錄一筆 `schema_meta` 資料列，其中包含資料庫角色、
  結構描述版本、時間戳記，以及代理程式資料庫的代理程式 ID。全域資料庫
  仍為 `user_version = 1`；各代理程式資料庫在有限範圍的
  記憶來源識別碼遷移後使用版本 `2`。
- 各代理程式工作階段識別現在具有權威性的 `sessions` 根資料表，並以
  `session_id` 為鍵，其中 `session_key`、`session_scope`、`account_id`、
  `primary_conversation_id`、時間戳記、顯示欄位、模型中繼資料、
  測試框架 ID，以及父項／衍生連結皆為可查詢欄位。`session_routes`
  是從 `session_key` 指向目前
  `session_id` 的唯一作用中路由索引，因此路由鍵可移至新的持久工作階段，
  而不會讓熱路徑讀取必須在重複的 `sessions.session_key` 資料列之間選擇。舊的
  `session_entries.entry_json` 相容性形狀承載資料會透過外部索引鍵附掛於
  持久的 `session_id` 根；它不再是工作階段唯一的
  結構描述層級表示方式。
- 各代理程式的外部對話識別也採用關聯式結構：
  `conversations` 儲存正規化的提供者／帳號／對話識別，而
  `session_conversations` 則將一個 OpenClaw 工作階段連結至一個或多個外部
  對話。這涵蓋共用主要私訊工作階段，其中多個對等端可刻意對應到同一工作階段，
  而不必在 `session_key` 中提供不實資訊。SQLite 也會
  強制自然提供者識別的唯一性，因此相同的
  頻道／帳號／種類／對等端／討論串元組無法分岔至不同的對話 ID。
  共用主要直接對等端會以 `participant` 角色連結，因此一個
  OpenClaw 工作階段可代表多個外部私訊對等端，而不會將
  較舊的對等端降級為含糊的相關資料列。`sessions.primary_conversation_id` 仍
  指向目前具型別的傳遞目標。已關閉的路由／狀態欄位
  會透過 SQLite `CHECK` 約束強制執行，而非僅依賴
  TypeScript 聯集型別。
  執行環境工作階段投影會先清除
  `session_entries.entry_json` 中的相容性路由影子，再套用具型別的工作階段／對話
  欄位，因此過時的 JSON 承載資料無法重新啟用傳遞目標。
  子代理程式公告路由同樣要求具型別的 SQLite 傳遞內容；
  不再退回相容性 `SessionEntry` 路由欄位。
  閘道 `chat.send` 的明確傳遞繼承會讀取具型別的 SQLite
  傳遞內容，而非 `origin`/`last*` 相容性欄位。
  `tools.effective` 同樣會從具型別的 SQLite 傳遞／路由資料列衍生提供者／帳號／討論串內容，
  而非過時的 `last*` 工作階段項目影子。
  系統事件提示內容會從具型別的傳遞欄位重建頻道／收件者／帳號／討論串欄位，
  而非使用 `origin` 影子。
  共用的 `deliveryContextFromSession` 輔助函式與工作階段至對話
  對應器現在完全忽略 `SessionEntry.origin`；只有具型別的傳遞欄位
  與關聯式對話資料列可以建立熱路徑路由識別。
  執行環境工作階段項目正規化會先移除 `origin`，再持久化或
  投影 `entry_json`；輸入中繼資料會寫入具型別的頻道／聊天
  欄位與關聯式對話資料列，而非建立新的來源
  影子。
- 逐字稿事件、逐字稿快照與軌跡執行環境事件現在
  會參照權威性的各代理程式 `sessions` 根，並在刪除工作階段時串聯刪除。
  逐字稿識別／等冪性資料列會繼續從確切的逐字稿事件資料列
  串聯刪除。
- 記憶體核心索引現在使用明確的代理程式資料庫資料表
  `memory_index_meta`、`memory_index_sources`、`memory_index_chunks` 與
  `memory_embedding_cache`，並由 `memory_index_state` 追蹤修訂變更。
  選用的 FTS／向量側邊索引命名為 `memory_index_chunks_fts` 與
  `memory_index_chunks_vec`，而非一般性的 `meta`、`files`、`chunks`、
  `chunks_fts` 或 `chunks_vec` 資料表。權威性名稱會保留目前的
  路徑／來源資料列形狀與序列化嵌入相容性。這些資料表是
  衍生／搜尋快取，而非權威性的逐字稿儲存區；它們可以刪除，
  並從記憶工作區檔案與已設定的來源重建。
  開啟使用一般性名稱的已發布記憶索引時，會將其中繼資料、來源、
  區塊與嵌入快取遷移至權威性資料表；衍生的 FTS／向量
  資料表會以其權威性名稱重建。
- 子代理程式執行復原狀態現在位於具型別的共用 `subagent_runs` 資料列中，
  並針對子項、要求者與控制器工作階段鍵建立索引。舊的
  `subagents/runs.json` 檔案僅作為 doctor 遷移輸入。
- 目前的對話繫結現在位於具型別的共用
  `current_conversation_bindings` 資料列中，以正規化的對話 ID 為鍵，並將
  目標代理程式／工作階段欄位、對話種類、狀態、到期時間與中繼資料
  儲存為關聯式欄位，而非重複的不透明繫結記錄。
  持久繫結鍵包含正規化的對話種類，因此
  直接／群組／頻道參照不會發生衝突，且 SQLite 會拒絕無效的繫結
  種類／狀態值。舊的
  `bindings/current-conversations.json` 檔案僅作為 doctor 遷移輸入。
- 傳遞佇列復原現在會在重播 JSON 上覆疊頻道、目標、
  帳號、工作階段、重試、錯誤、平台傳送與復原狀態的具型別佇列欄位。
  `entry_json` 會保留重播承載資料、掛鉤與格式化
  承載資料，但具型別欄位是熱路徑佇列路由／狀態的權威來源。
- 終端介面上次工作階段還原指標現在位於具型別的共用
  `tui_last_sessions` 資料列中，以雜湊後的終端介面連線／工作階段範圍為鍵。
  舊的終端介面 JSON 檔案僅作為 doctor 遷移輸入。
- 預設 TTS 偏好設定現在位於共用外掛狀態 SQLite 資料列中，並以
  `speech-core` 外掛為鍵。舊的 `settings/tts.json` 檔案僅作為 doctor 遷移
  輸入；執行環境不再讀取或寫入 TTS 偏好設定 JSON 檔案，而
  舊版路徑解析器位於 doctor 遷移模組中。
- 祕密目標中繼資料現在描述的是儲存區，而非假裝每個
  認證資訊目標都是設定檔。`openclaw.json` 仍為設定儲存區；
  驗證設定檔目標使用具型別的 SQLite `auth_profile_stores` 資料列，並將
  依提供者形狀組織的認證資訊保留為 JSON 承載資料。
- 祕密稽核不再掃描已淘汰的各代理程式 `auth.json` 檔案。doctor 負責
  對該舊版檔案發出警告、將其匯入並移除。
- 舊版驗證設定檔路徑輔助函式現在位於 doctor 舊版程式碼中。核心驗證
  設定檔路徑輔助函式會公開 SQLite 驗證儲存區識別與顯示位置，
  而非 `auth-profiles.json` 或 `auth-state.json` 執行環境路徑。
- 子代理程式執行復原與 OpenRouter 模型功能快取執行環境模組
  現在會將 SQLite 快照讀取器／寫入器與僅供 doctor 使用的舊版 JSON
  匯入輔助函式分開。OpenRouter 功能使用 `provider_id = "openrouter"` 下具型別的一般性
  `model_capability_cache` 資料列，而非
  單一不透明快取 Blob 或提供者專用的主機資料表。子代理程式執行
  `taskName` 會儲存在具型別的 `subagent_runs.task_name` 欄位中；
  `payload_json` 副本是重播／偵錯資料，而非熱路徑顯示或
  查詢欄位的來源。
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` 會在代理程式資料庫
  `vfs_entries` 資料表之上實作 SQLite VFS。目錄讀取、遞迴
  匯出、刪除與重新命名會使用具索引的 `(namespace, path)` 前綴範圍，
  而非掃描整個命名空間或依賴 `LIKE` 路徑比對。
- `src/agents/runtime-worker.entry.ts` 會為工作程式建立各執行作業的 SQLite VFS、工具成品、
  執行成品與範圍限定快取儲存區。
- 工作區啟動完成標記現在位於具型別的共用
  `workspace_setup_state` 資料列中，以解析後的工作區路徑為鍵，而非
  `.openclaw/workspace-state.json`；執行環境不再讀取或重寫
  舊版工作區標記，輔助 API 也不再僅為衍生儲存識別而傳遞虛構的
  `.openclaw/setup-state` 路徑。
- Exec 核准現在位於具型別的共用 SQLite `exec_approvals_config`
  單例資料列中。doctor 會匯入舊版 `~/.openclaw/exec-approvals.json`；
  執行環境寫入不再建立、重寫該檔案，也不再將其回報為作用中
  儲存位置。macOS 隨附應用程式會讀寫相同的
  `state/openclaw.sqlite` 資料表資料列；它只會將 Unix 提示通訊端保留在磁碟上，
  因為那是 IPC，而非持久的執行環境狀態。
- 裝置身分、裝置驗證與啟動執行階段模組現在會將其
  SQLite 快照讀取器／寫入器與僅供 doctor 使用的舊版 JSON 匯入
  輔助程式分開。裝置身分使用具型別的 `device_identities` 資料列，而裝置驗證
  權杖則使用具型別的 `device_auth_tokens` 資料列。裝置驗證寫入會依
  裝置／角色協調資料列，而不是截斷權杖資料表，且執行階段不再
  透過舊有的整體儲存區介面卡處理單一權杖更新。舊版
  第 1 版 JSON 承載資料僅作為 doctor 匯入／匯出的資料形態存在。
- GitHub Copilot 權杖交換快取使用共用的 SQLite 外掛狀態資料表，
  位於 `github-copilot/token-cache/default` 下。這是由供應商擁有的快取狀態，
  因此刻意不新增主機結構描述資料表。
- GitHub Copilot 壓縮不再寫入 `openclaw-compaction-*.json`
  工作區附屬檔案。測試框架會針對追蹤中的 SDK 工作階段呼叫 SDK 歷程壓縮 RPC，
  而 OpenClaw 會將持久工作階段／逐字記錄狀態保存在
  SQLite 中，而不是相容性標記檔案。
- 共用 Swift 執行階段（`OpenClawKit`）使用相同的
  `state/openclaw.sqlite` 資料列來儲存裝置身分與裝置驗證。macOS 應用程式
  輔助程式會匯入共用 SQLite 輔助程式，而不再自行維護第二條 JSON 或
  SQLite 路徑。若殘留舊版 `identity/device.json`，將阻止建立身分，
  直到 doctor 將其匯入 SQLite，與 TypeScript 和 Android 的
  啟動閘門一致。
- Android 裝置身分使用相同且與 TypeScript 相容的金鑰資料，
  並儲存在具型別的 `state/openclaw.sqlite#table/device_identities` 資料列中。它絕不
  讀取或寫入 `openclaw/identity/device.json`；若殘留舊版檔案，將阻止
  啟動，直到 doctor 將其匯入 SQLite。
- Android 快取的裝置驗證權杖也使用具型別的
  `state/openclaw.sqlite#table/device_auth_tokens` 資料列，並與 TypeScript 和 Swift 共用相同的
  第 1 版權杖語意。執行階段不再讀取 `SecurePrefs`
  `gateway.deviceToken*` 相容性鍵；這些鍵僅屬於移轉／doctor
  邏輯。
- Android 通知的近期套件歷程使用具型別的
  `android_notification_recent_packages` 資料列。執行階段不再移轉或
  讀取舊有的 SharedPreferences CSV 鍵。
- 當舊版 `identity/device.json` 存在、SQLite 身分資料列無效，
  或無法開啟 SQLite 身分儲存區時，裝置身分建立會採取封閉式失敗。
  doctor 會先匯入並移除該檔案，因此執行階段
  啟動無法在移轉前悄悄輪替配對身分。
- 裝置身分選取使用 SQLite 資料列鍵，而非 JSON 檔案定位器。測試
  與閘道輔助程式會傳入明確的身分鍵；只有 doctor 移轉與
  封閉式失敗啟動閘門知道已淘汰的 `identity/device.json` 檔名。
- 工作階段重設相容性現在位於 doctor 設定移轉中：
  `session.idleMinutes` 會移至 `session.reset.idleMinutes`，
  `session.resetByType.dm` 會移至 `session.resetByType.direct`，而
  執行階段重設政策只會讀取標準重設鍵。
- 舊版設定相容性現在位於 `src/commands/doctor/` 下。一般
  `readConfigFileSnapshot()` 驗證不會匯入 doctor 舊版偵測器，
  也不會標註舊版問題；`runDoctorConfigPreflight()` 會加入這些問題，以供
  doctor 修復／報告。doctor 設定流程會匯入
  `src/commands/doctor/legacy-config.ts`，而舊有 OAuth 設定檔 ID 修復則位於
  `src/commands/doctor/legacy/oauth-profile-ids.ts` 下。
- 非 doctor 命令不會自動執行舊版設定修復。例如，
  `openclaw update --channel` 現在遇到無效的舊版設定時會失敗，並要求
  使用者執行 doctor，而不是悄悄匯入 doctor 移轉程式碼。
- 網頁推播、APNs、語音喚醒、更新檢查與設定健康狀態現在使用具型別的共用 SQLite
  資料表，儲存訂閱、VAPID 金鑰、節點註冊、觸發條件資料列、
  路由資料列、更新通知狀態與設定健康項目，而非
  整體不透明的 JSON Blob。網頁推播與 APNs 快照寫入現在會依主鍵
  協調訂閱／註冊，而不是清除其資料表；
  設定健康狀態也會依設定路徑進行相同處理。
  其執行階段模組會將 SQLite 快照讀取器／寫入器與
  僅供 doctor 使用的舊版 JSON 匯入輔助程式分開。
- 節點主機設定現在使用共用 SQLite 資料庫中的具型別單例資料列；
  doctor 會在一般執行階段使用前匯入舊有的 `node.json` 檔案。
- 裝置／節點配對、頻道配對、頻道允許清單與啟動狀態
  現在使用具型別的 SQLite 資料列，而非整體不透明的 JSON Blob。外掛繫結
  核准與排程工作狀態也採用相同的分離方式：執行階段模組公開
  由 SQLite 支援的操作與中性的快照輔助程式，且配對／啟動
  以及外掛繫結核准快照寫入會依主鍵協調資料列，
  而不是截斷資料表；doctor 則透過
  `src/commands/doctor/legacy/*` 模組匯入／移除舊有 JSON 檔案。
- 已安裝的外掛記錄現在存放於 SQLite 已安裝外掛索引中。
  執行階段設定讀取／寫入不再移轉或保留舊有的
  `plugins.installs` 編寫設定資料；doctor 會在一般執行階段使用前，
  將該舊版設定形態匯入 SQLite。
- QQ Bot 認證資訊復原快照現在存放於 SQLite 外掛狀態的
  `qqbot/credential-backups` 下。執行階段不再寫入
  `qqbot/data/credential-backup*.json`；QQ Bot doctor 合約會從作用中的狀態目錄匯入並
  封存這些舊版備份檔案。
- 閘道重新載入規劃會在內部 `installedPluginIndex.installRecords.*`
  差異命名空間下，比較 SQLite 已安裝外掛索引快照。執行階段
  重新載入決策不再將這些資料列包裝成虛假的 `plugins.installs` 設定
  物件。
- Matrix 具名帳號的認證資訊升級不再於執行階段
  讀取時進行。當可解析出單一／預設 Matrix 帳號時，doctor 會負責
  舊有頂層 `credentials/matrix/credentials.json` 的重新命名。
- 核心配對與排程執行階段模組不再使用舊版 JSON 路徑建構器。
  已棄用的配對路徑 SDK 輔助程式僅保留供移轉相容性使用；
  doctor 狀態移轉會負責其檔案讀取與匯入。由 doctor 擁有的舊版
  模組僅為匯入測試與移轉建構 `pending.json`、`paired.json`、`bootstrap.json` 與
  `cron/jobs.json` 來源路徑。舊版排程
  工作形態正規化與 JSONL 歷程匯入位於
  `src/commands/doctor/cron/` 下；舊版 SQLite 歷程最終處理會在
  狀態資料庫開啟時執行。
- `src/commands/doctor/legacy/runtime-state.ts` 會從 doctor 將舊版 JSON 狀態
  檔案（包括節點主機設定）匯入 SQLite。新的舊版檔案
  匯入器會保留在 `src/commands/doctor/legacy/` 下。
- `src/commands/doctor/state-migrations.ts` 會將舊版 `sessions.json` 與
  `*.jsonl` 逐字記錄直接匯入 SQLite，並移除成功匯入的來源。它
  不再透過 `agents/<agentId>/sessions/*.jsonl` 暫存根目錄舊版逐字記錄，
  也不會在匯入前建立標準 JSONL 目標。
- 狀態完整性 doctor 檢查不再掃描舊版工作階段目錄，
  也不再提供刪除孤立 JSONL 的選項。舊版逐字記錄檔案僅作為移轉輸入，
  且由移轉步驟負責匯入及移除來源。
- 舊版沙箱登錄匯入位於
  `src/commands/doctor/legacy/sandbox-registry.ts` 下；作用中的沙箱登錄
  讀取與寫入仍僅使用 SQLite。
- 舊版工作階段逐字記錄健康檢查／匯入修復位於
  `src/commands/doctor/legacy/session-transcript-health.ts` 下；執行階段命令
  模組不再包含 JSONL 逐字記錄剖析或作用中分支修復程式碼。

已完成的整併／刪除重點：

- 外掛狀態現在使用共用的 `state/openclaw.sqlite` 資料庫。舊的
  分支本機 `plugin-state/state.sqlite` 側載檔匯入器已移除，因為
  該 SQLite 配置從未發布。探查／測試輔助程式會回報共用的
  `databasePath`，而非公開外掛狀態專用的 SQLite 路徑。
- 任務與 Task Flow 執行階段資料表現在位於共用的
  `state/openclaw.sqlite` 資料庫，而非 `tasks/runs.sqlite` 和
  `tasks/flows/registry.sqlite`；舊的側載檔匯入器也因相同的未發布配置原因而移除。
- `src/config/sessions/store.ts` 不再需要 `storePath` 來處理輸入
  中繼資料、路由更新或 updated-at 讀取。命令持久化、命令列介面
  工作階段清理、子代理程式深度、驗證覆寫和逐字稿工作階段
  身分識別皆使用代理程式／工作階段資料列 API。寫入會以 SQLite 資料列修補套用，
  並在樂觀並行衝突時重試。
- 工作階段目標解析現在公開每個代理程式的資料庫目標，而非舊版
  `sessions.json` 路徑。共用閘道、ACP 中繼資料、doctor 路由修復和
  `openclaw sessions` 會列舉 `agent_databases` 及已設定的代理程式。
- 閘道工作階段路由現在使用 `resolveGatewaySessionDatabaseTarget`；傳回的
  目標會攜帶 `databasePath` 和候選 SQLite 資料列鍵，而非
  舊版工作階段存放區檔案路徑。
- 頻道工作階段執行階段型別現在會公開 `{agentId, sessionKey}`，以供
  updated-at 讀取、輸入中繼資料和最後路由更新使用。舊的
  `saveSessionStore(storePath, store)` 相容性型別已移除。
- 外掛執行階段、擴充功能 API 和外掛 SDK 工作階段介面現在會公開
  以 SQLite 為後端的工作階段資料列輔助程式，而非作用中工作階段的整體存放區／檔案
  相容性輔助程式。根程式庫相容性匯出僅在外掛 SDK 之外保留，
  供舊版內部和遷移呼叫端使用。舊的
  `resolveLegacySessionStorePath` 輔助程式已移除；舊版 `sessions.json` 路徑
  建構現在僅存在於遷移和測試固定資料中。
- `src/config/sessions/session-entries.sqlite.ts` 現在會將標準工作階段
  項目儲存在每個代理程式的資料庫中，並支援資料列層級的讀取／向上插入／刪除修補。
  執行階段的向上插入／修補／刪除不再掃描大小寫變體或
  清除舊版別名鍵；標準化由 doctor 負責。獨立的
  JSON 匯入輔助程式已移除，遷移會向上插入合併較新的資料列，
  而非取代整個工作階段資料表。公開的讀取／列出／載入輔助程式會從具型別的
  `sessions` 和 `conversations` 資料列投影常用工作階段中繼資料；
  `entry_json` 是相容性／偵錯影子，可以過時或無效，
  而不會遺失具型別的工作階段身分或傳遞內容。
- `src/config/sessions/delivery-info.ts` 現在會從
  具型別的每代理程式 `sessions` + `conversations` + `session_conversations` 資料列解析傳遞內容。
  它不再從 `session_entries.entry_json` 重建執行階段傳遞身分；
  缺少具型別的對話資料列屬於 doctor 遷移／修復問題，
  而非執行階段備援。
- 已儲存工作階段的重設決策現在優先使用具型別的 `sessions.session_scope`、
  `sessions.chat_type` 和 `sessions.channel` 中繼資料。`sessionKey` 剖析
  僅保留給命令目標上的明確討論串／主題後綴；群組與
  直接重設分類不再取決於鍵的形狀。
- 工作階段清單／狀態顯示分類現在使用具型別的聊天中繼資料和
  閘道工作階段種類。它不再將 `session_key` 內的 `:group:` 或
  `:channel:` 子字串視為持久的群組／直接通訊事實。
- 靜默回覆政策選擇現在僅使用明確的對話類型或介面
  中繼資料。它不再根據 `session_key` 子字串猜測直接／群組政策。
- 工作階段顯示模型解析現在會從 SQLite
  工作階段資料庫目標取得代理程式 ID，而非從 `session_key` 拆解取得。
- 代理程式間的宣告目標補全現在僅使用具型別的 `sessions.list`
  `deliveryContext`。它不再從舊版 `origin`、鏡像的
  `last*` 欄位或 `session_key` 形狀復原頻道／帳號／討論串路由。
- `sessions_send` 討論串目標拒絕現在會讀取具型別的 SQLite 路由
  中繼資料。它不再藉由從目標鍵剖析討論串後綴來拒絕或接受目標。
- 群組範圍工具政策驗證現在會讀取目前或衍生工作階段的
  具型別 SQLite 對話路由。它不再透過解碼 `sessionKey`
  來信任群組／頻道身分；若沒有具型別的工作階段資料列擔保，
  呼叫端提供的群組 ID 將被捨棄。
- 頻道模型覆寫比對現在使用明確的群組和父層
  對話中繼資料。它不再從 `parentSessionKey` 解碼父層對話 ID。
- 已儲存模型覆寫的繼承現在需要具型別工作階段內容提供明確的父工作階段鍵。
  它不再從 `sessionKey` 中的 `:thread:` 或
  `:topic:` 後綴衍生父層覆寫。
- 舊的工作階段討論串資訊包裝函式和已載入外掛討論串剖析器已移除；
  執行階段程式碼不再匯入 `config/sessions/thread-info`。
- 頻道對話輔助程式不再公開完整工作階段鍵的剖析
  橋接。核心仍會透過 `resolveSessionConversation(...)` 標準化提供者所擁有的原始對話 ID，
  但不會從 `sessionKey` 重建路由事實。
- 完成傳遞、傳送政策和任務維護不再從 `session_key`
  的形狀衍生聊天類型。舊的聊天類型鍵剖析器已刪除；
  這些路徑需要具型別的工作階段中繼資料、具型別的傳遞內容，
  或明確的傳遞目標詞彙。
- 工作階段清單／狀態、診斷、核准帳號繫結、終端介面心跳偵測
  篩選和用量摘要不再從 `SessionEntry.origin` 挖掘
  提供者／帳號／討論串／顯示路由。剩餘的執行階段
  `origin` 讀取僅涉及非工作階段概念或目前回合的傳遞物件。
- 核准要求的原生對話查詢現在會讀取具型別的每代理程式工作階段
  路由資料列。它不再從 `sessionKey` 剖析頻道／群組／討論串對話身分；
  缺少具型別的中繼資料屬於遷移／修復問題。
- 閘道工作階段變更／聊天／工作階段事件承載資料不再回送
  `SessionEntry.origin` 或 `last*` 路由影子；用戶端會收到具型別的
  `channel`、`chatType` 和 `deliveryContext`。
- 心跳偵測傳遞解析現在可直接接收具型別的 SQLite
  `deliveryContext`，且心跳偵測執行階段會傳遞每代理程式的
  工作階段傳遞資料列，而非依賴相容性 `session_entries`
  影子取得目前路由。
- 排程隔離代理程式的傳遞目標解析也會先從具型別的
  每代理程式工作階段傳遞資料列補全目前路由，之後才以
  相容性項目承載資料作為備援。
- 子代理程式宣告來源解析現在會透過 `loadRequesterSessionEntry`
  傳遞具型別的要求者工作階段傳遞內容，並優先使用該資料列，
  而非相容性 `last*`/`deliveryContext` 影子。
- 輸入工作階段中繼資料更新現在會先與具型別的每代理程式
  傳遞資料列合併；僅在不存在具型別對話資料列時，舊的
  `SessionEntry` 傳遞欄位才會作為備援。
- 重新啟動／更新傳遞擷取現在會讓具型別的 SQLite 傳遞
  `threadId` 優先於從 `sessionKey` 剖析出的主題／討論串片段；
  剖析僅作為舊版討論串形狀鍵的備援。
- 鉤子代理程式內容的頻道 ID 現在優先使用具型別的 SQLite 對話身分，
  其次才是明確的訊息中繼資料。它們不再從 `sessionKey`
  剖析提供者／群組／頻道片段。
- 閘道 `chat.send` 外部路由繼承現在會讀取具型別的 SQLite 工作階段
  路由中繼資料，而非從 `sessionKey` 片段推斷頻道／直接／群組範圍。
  僅當具型別的工作階段頻道和聊天類型與已儲存的傳遞內容相符時，
  頻道範圍工作階段才會繼承；共用主要工作階段維持更嚴格的
  命令列介面／無用戶端中繼資料規則。
- 重新啟動哨兵的喚醒和接續路由現在會先讀取具型別的 SQLite
  傳遞／路由資料列，再將心跳偵測喚醒或經路由的代理程式回合
  接續項目排入佇列。它不再從工作階段項目 JSON 影子重建傳遞內容。
- 閘道 `tools.effective` 內容解析現在會讀取具型別的 SQLite
  傳遞／路由資料列，以取得提供者、帳號、目標、討論串和回覆模式
  輸入。它不再從過時的 `session_entries.entry_json` 來源影子復原這些常用路由欄位。
- 即時語音諮詢路由現在會從具型別的每代理程式 SQLite 工作階段資料列
  解析父層／通話傳遞。在選擇內嵌代理程式訊息路由時，
  它不再以相容性 `SessionEntry.deliveryContext` 影子作為備援。
- ACP 衍生心跳偵測轉送和父層串流路由現在會從具型別的
  SQLite 工作階段資料列讀取父層傳遞。它們不再從相容性工作階段項目影子
  重建父層傳遞內容。
- 工作階段傳遞路由保留現在遵循具型別的聊天中繼資料和
  持久化傳遞欄位。它不再從 `sessionKey` 擷取頻道提示、直接／主要
  標記或討論串形狀；僅當 SQLite 已具有該工作階段的具型別／持久化
  傳遞身分時，內部網頁聊天路由才會繼承外部目標。
- 通用工作階段傳遞擷取現在只讀取完全相符的具型別 SQLite
  工作階段傳遞資料列。它不再剖析討論串／主題後綴，也不再從
  討論串形狀鍵退回基礎工作階段鍵。
- 回覆分派、重新啟動哨兵復原和即時語音諮詢路由
  現在會使用完全相符的具型別 SQLite 工作階段／對話資料列進行討論串路由。
  它們不再透過剖析討論串形狀的工作階段鍵，復原討論串 ID 或
  基礎工作階段傳遞內容。
- 內嵌 PI 歷程限制現在會使用具型別的 SQLite 工作階段路由
  投影（`sessions` + 主要 `conversations`），取得提供者、聊天類型
  和對等端身分。它不再從 `sessionKey` 剖析提供者、私訊、群組或討論串形狀。
- 排程工具傳遞推斷現在僅使用明確傳遞或目前具型別的
  傳遞內容。它不再從 `agentSessionKey` 解碼頻道、對等端、帳號或討論串目標。
- 執行階段工作階段資料列不再攜帶舊的 `lastProvider` 路由別名。
  輔助程式和測試使用具型別的 `lastChannel` 和 `deliveryContext` 欄位；
  doctor 遷移是唯一應轉換舊版路由別名或持久化
  `origin` 影子的地方。
- 逐字稿事件、VFS 資料列和工具成品資料列現在會寫入每代理程式
  資料庫。未發布的全域逐字稿檔案對應資料表已移除；doctor
  改為在持久遷移資料列中記錄舊版來源路徑。
- 執行階段逐字稿查詢不再掃描 JSONL 位元組位移或探查舊版
  逐字稿檔案。閘道聊天／媒體／歷程路徑會從 SQLite 讀取逐字稿資料列；
  工作階段 JSONL 現在僅是舊版 doctor 輸入，而非執行階段狀態
  或匯出格式。
- 逐字稿父層和分支關係使用 SQLite 逐字稿
  標頭中的結構化 `parentTranscriptScope: {agentId, sessionId}` 中繼資料，
  而非路徑形式的 `agent-db:...transcript_events...` 定位器字串。
- 逐字稿管理器合約不再公開隱含的持久化
  `create(cwd)` 或 `continueRecent(cwd)` 建構函式。持久化逐字稿
  管理器會以明確的 `{agentId, sessionId}` 範圍開啟；僅
  記憶體內管理器在測試與純逐字稿轉換中仍不受範圍限制。
- 執行階段逐字稿儲存區 API 會解析 SQLite 範圍，而非檔案系統路徑。舊的 `resolve...ForPath` 輔助函式與未使用的 `transcriptPath` 寫入選項，已從執行階段呼叫端移除。
- 執行階段工作階段解析現在使用 `{agentId, sessionId}`，且不得為外部邊界衍生 `sqlite-transcript://<agent>/<session>` 字串。舊版絕對 JSONL 路徑僅能作為 doctor 遷移輸入。
- 原生鉤子轉送的直接橋接記錄現在存放於具型別的共用 `native_hook_relay_bridges` 資料列中，並以轉送 ID 作為鍵。對於這些短期橋接記錄，執行階段不再寫入 `/tmp` JSON 登錄或不透明的泛用記錄。
- `runEmbeddedPiAgent(...)` 不再有逐字稿定位器參數。預備好的工作程式描述元也會省略逐字稿定位器。執行階段工作階段狀態與排入佇列的後續執行會攜帶 `{agentId, sessionId}`，而非衍生的逐字稿控制代碼。
- 內嵌壓縮現在會從 `agentId` 與 `sessionId` 取得 SQLite 範圍。壓縮鉤子、內容引擎呼叫、命令列介面委派及通訊協定回覆不得接收衍生的 `sqlite-transcript://...` 控制代碼。匯出／偵錯程式碼可以從資料列具體化明確的使用者成品，但不會提供泛用的工作階段 JSONL 匯出路徑，也不會將檔名送回執行階段身分識別。
- `/export-session` 會從 SQLite 讀取逐字稿資料列，且僅寫入所要求的獨立 HTML 檢視。內嵌檢視器不再從這些資料列重建或下載工作階段 JSONL。
- 內容引擎委派不再剖析逐字稿定位器以復原代理程式身分。預備好的執行階段內容會將已解析的 `agentId` 傳遞至內建壓縮配接器。
- 逐字稿重寫與即時工具結果截斷現在會依 `{agentId, sessionId}` 讀取並保存逐字稿狀態，且不會為逐字稿更新事件承載資料衍生暫時定位器。
- 逐字稿狀態輔助函式介面不再有以定位器為基礎的 `readTranscriptState`、`replaceTranscriptStateEvents` 或 `persistTranscriptStateMutation` 變體。執行階段呼叫端必須使用 `{agentId, sessionId}` API。Doctor 匯入會依明確檔案路徑讀取舊版檔案並寫入 SQLite 資料列；它不會遷移定位器字串。
- 執行階段工作階段管理器合約不再公開 `open(locator)`、`forkFrom(locator)` 或 `setTranscriptLocator(...)`。持久化工作階段管理器僅能依 `{agentId, sessionId}` 開啟；列出／分支輔助函式位於以資料列為導向的工作階段與檢查點 API，而非逐字稿管理器外觀。
- 閘道逐字稿讀取器 API 以範圍為優先。它們接受 `{agentId, sessionId}`，且不接受可能意外成為執行階段身分的定位逐字稿定位器。作用中的逐字稿定位器剖析已移除；舊版來源路徑僅由 doctor 匯入程式碼讀取。
- 逐字稿更新事件也以範圍為優先。`emitSessionTranscriptUpdate` 不再接受單獨的定位器字串，而接聽程式會依 `{agentId, sessionId}` 路由，無須剖析控制代碼。
- 閘道工作階段訊息廣播會從代理程式／工作階段範圍解析工作階段金鑰，而非從逐字稿定位器解析。舊的逐字稿定位器轉工作階段金鑰解析器／快取已移除。
- 閘道工作階段歷程 SSE 會依代理程式／工作階段範圍篩選即時更新。它不再將逐字稿定位器候選項、實際路徑或檔案形式的逐字稿身分正規化，以判斷串流是否應接收更新。
- 工作階段生命週期鉤子不再於 `session_end` 衍生或公開逐字稿定位器。鉤子使用端會取得 `sessionId`、`sessionKey`、下一個工作階段 ID 與代理程式內容；逐字稿檔案不屬於生命週期合約。
- 重設鉤子也不再衍生或公開逐字稿定位器。`before_reset` 承載資料會攜帶已復原的 SQLite 訊息與重設原因，而工作階段身分則保留於鉤子內容中。
- 代理程式測試框架重設不再接受逐字稿定位器。重設分派的範圍由 `sessionId`/`sessionKey` 加上原因界定。
- 代理程式擴充功能的工作階段型別不再公開 `transcriptLocator`；擴充功能應使用工作階段內容與執行階段 API，而非直接存取檔案形式的逐字稿身分。
- 外掛壓縮鉤子不再公開逐字稿定位器。鉤子內容已攜帶工作階段身分，逐字稿讀取必須透過可感知 SQLite 範圍的 API，而非檔案形式的控制代碼。
- `before_agent_finalize` 鉤子不再公開 `transcriptPath`，包括原生鉤子轉送承載資料。完成鉤子僅使用工作階段內容。
- 閘道重設回應不再於傳回的項目上合成逐字稿定位器。重設會建立 SQLite 逐字稿資料列、傳回乾淨的工作階段項目，並將逐字稿存取交由可感知範圍的讀取器處理。
- 內嵌執行與壓縮結果不再公開供工作階段計量使用的逐字稿定位器。自動壓縮只會更新作用中的 `sessionId`、壓縮計數器與權杖中繼資料。
- 內嵌嘗試結果不再傳回 `transcriptLocatorUsed`，且內容引擎 `compact()` 結果不再傳回逐字稿定位器。執行階段重試迴圈僅接受後繼 `sessionId`。
- 傳遞鏡像逐字稿附加結果不再傳回逐字稿定位器。呼叫端會取得已附加的 `messageId`；逐字稿更新訊號使用 SQLite 範圍。
- 父工作階段分支輔助函式僅傳回分支後的 `sessionId`。子代理程式準備程序會將子代理程式／工作階段範圍傳遞給引擎。
- 命令列介面執行器參數與歷程重新植入不再接受逐字稿定位器。命令列介面歷程讀取會從 `{agentId,
sessionId}` 與工作階段金鑰內容解析 SQLite 逐字稿範圍。
- 命令列介面與內嵌執行器測試固定資料現在會依工作階段 ID 植入及讀取 SQLite 逐字稿資料列，而不再假裝作用中工作階段是 `*.jsonl` 檔案，或透過執行階段參數傳遞 `sqlite-transcript://...` 字串。
- 工作階段工具結果防護事件會從已知工作階段範圍發出，即使記憶體內管理器沒有衍生的定位器。其測試不再偽造作用中的 `/tmp/*.jsonl` 逐字稿檔案。
- BTW 與壓縮檢查點輔助函式現在會依 SQLite 範圍讀取及分支逐字稿資料列。檢查點中繼資料現在僅儲存工作階段 ID 與葉節點／項目 ID；衍生定位器不再寫入檢查點承載資料。
- 閘道逐字稿金鑰查詢會在通訊協定邊界使用 SQLite 逐字稿範圍，且不再對逐字稿檔名執行實際路徑解析或狀態查詢。
- 自動壓縮逐字稿輪替會直接透過 SQLite 逐字稿儲存區寫入後繼逐字稿資料列。工作階段資料列只保留後繼工作階段身分，不保留持久的 JSONL 路徑或已保存的定位器。
- 內嵌內容引擎壓縮使用以 SQLite 命名的逐字稿輪替輔助函式。輪替測試不再建構 JSONL 後繼路徑，或將作用中工作階段建模為檔案。
- 受管理的傳出圖片保留機制會從 SQLite 逐字稿統計資料產生逐字稿訊息快取金鑰，而非呼叫檔案系統狀態查詢。
- 執行階段工作階段鎖定與獨立的舊版 `.jsonl.lock` doctor 路徑已移除。
- Microsoft Teams 執行階段匯出介面與公用外掛 SDK 不再重新匯出舊的檔案鎖定輔助函式；持久的外掛狀態路徑由 SQLite 支援。
- 工作階段年齡／數量修剪與明確的工作階段清理已移除。Doctor 負責舊版匯入；過時的工作階段會被明確重設或刪除。
- Doctor 完整性檢查不再將舊版 JSONL 檔案視為 SQLite 工作階段資料列的有效作用中逐字稿。作用中逐字稿健全狀態僅以 SQLite 為準；舊版 JSONL 檔案會回報為遷移／孤立項目清理輸入。
- Doctor 不再將 `agents/<agent>/sessions/` 視為必要的執行階段狀態。只有在該目錄已存在時，才會將其掃描為舊版匯入或孤立項目清理輸入。
- 閘道 `sessions.resolve`、工作階段修補／重設／壓縮路徑、子代理程式產生、快速中止、ACP 中繼資料、與心跳偵測隔離的工作階段，以及終端介面修補，不再於一般執行階段工作中順帶遷移或修剪舊版工作階段金鑰。
- 命令列介面命令的工作階段解析現在會傳回所屬的 `agentId`，而非 `storePath`；在一般 `--to` 或 `--session-id` 解析期間，它也不再複製舊版主要工作階段資料列。舊版主要資料列正規化僅由 doctor 負責。
- 執行階段子代理程式深度解析不再讀取 `sessions.json` 或 JSON5 工作階段儲存區。它會依代理程式 ID 讀取 SQLite `session_entries`，而舊版深度／工作階段中繼資料只能透過 doctor 匯入路徑進入。
- 驗證設定檔工作階段覆寫會透過直接 `{agentId, sessionKey}` 資料列 upsert 保存，而非延遲載入檔案形式的工作階段儲存區執行階段。
- 自動回覆詳細輸出閘控與工作階段更新輔助函式現在會依工作階段身分讀取／upsert SQLite 工作階段資料列，且在操作持久化資料列狀態前不再需要舊版儲存區路徑。
- 命令執行工作階段中繼資料輔助函式現在使用以項目為導向的名稱與模組路徑；舊的 `session-store` 命令輔助函式介面已移除。
- 啟動標頭植入與手動壓縮邊界強化現在會直接變更 SQLite 逐字稿資料列。執行階段呼叫端會傳遞工作階段身分，而非可寫入的 `.jsonl` 路徑。
- 靜默工作階段輪替重播會依 `{agentId, sessionId}` 從 SQLite 逐字稿資料列複製近期的使用者／助理回合。它不再接受來源或目標逐字稿定位器。
- 全新的執行階段工作階段資料列不再儲存逐字稿定位器。呼叫端直接使用 `{agentId, sessionId}`；匯出／偵錯命令在具體化資料列時可以選擇輸出檔名。
- 現在啟動新的持久化逐字稿工作階段時，一律依範圍開啟 SQLite 資料列。工作階段管理器不再重複使用先前檔案時代的逐字稿路徑或定位器，作為新工作階段的身分。
- 持久化逐字稿工作階段使用明確的 `openTranscriptSessionManagerForSession({agentId, sessionId})` API。舊的靜態 `SessionManager.create/openForSession/list/forkFromSession` 外觀已移除，因此測試與執行階段程式碼不會意外重新建立檔案時代的工作階段探索。
- 外掛執行階段不再公開 `api.runtime.agent.session.resolveTranscriptLocatorPath`；外掛程式碼會使用 SQLite 資料列輔助函式與範圍值。
- 公用 `session-store-runtime` SDK 介面現在僅匯出工作階段資料列與逐字稿資料列輔助函式。專用的 SQLite 結構描述／路徑／交易輔助函式位於 `sqlite-runtime`；原始開啟／關閉／重設輔助函式仍僅供第一方測試在本機使用。
- 舊版 `.jsonl` 軌跡／檢查點檔名分類器現在位於 doctor 舊版工作階段檔案模組中。核心工作階段驗證不再匯入檔案成品輔助函式，以判定一般 SQLite 工作階段 ID。
- 主動記憶阻塞式子代理程式執行會使用 SQLite 逐字稿資料列，而非在外掛狀態下建立暫時或持久化的 `session.jsonl` 檔案。舊的 `transcriptDir` 選項已移除。
- 一次性 slug 產生與 Crestodian 規劃器執行會使用 SQLite 逐字稿資料列，而非建立暫時的 `session.jsonl` 檔案。
- `llm-task` 輔助程式執行與隱藏承諾擷取也使用 SQLite
  逐字稿資料列，因此這些僅供模型使用的輔助工作階段不再建立
  暫存 JSON/JSONL 逐字稿檔案。
- `TranscriptSessionManager` 現在只是一個已開啟的 SQLite 逐字稿範圍。
  執行階段程式碼使用 `openTranscriptSessionManagerForSession({agentId,
sessionId})` 開啟它；建立、分支、繼續、列出及分叉流程位於其
  所屬的 SQLite 資料列輔助程式中，而非靜態管理員外觀。
  Doctor／匯入／偵錯程式碼會在執行階段工作階段管理員之外處理明確的舊版來源檔案。
- 過時的 `SessionManager.newSession()` 與
  `SessionManager.createBranchedSession()` 外觀方法已移除。新的
  工作階段與逐字稿衍生項目由其所屬的 SQLite
  工作流程建立，而非將已開啟的管理員變更為不同的
  持久化工作階段。
- 父逐字稿分叉決策與分叉建立不再接受
  `storePath` 或 `sessionsDir`；它們改用 `{agentId, sessionId}` SQLite
  逐字稿範圍，而非保留的檔案系統路徑中繼資料。
- 記憶體主機不再匯出無操作的工作階段目錄逐字稿
  分類輔助程式；逐字稿篩選現在會在建構項目期間從 SQLite 資料列
  中繼資料衍生。
- 記憶體主機與 QMD 工作階段匯出測試使用 SQLite 逐字稿範圍。舊的
  `agents/<agentId>/sessions/*.jsonl` 路徑僅在測試刻意驗證
  Doctor／匯入／匯出相容性時才繼續涵蓋。
- QA 實驗室的原始工作階段檢查現在透過閘道使用 `sessions.list`，
  而非讀取 `agents/qa/sessions/sessions.json`；MS Teams 意見回饋會
  直接附加至 SQLite 逐字稿，而不會虛構 JSONL 路徑。
- 共用的傳入頻道回合現在攜帶 `{agentId, sessionKey}`，而非
  舊版 `storePath`。LINE、WhatsApp、Slack、Discord、Telegram、Matrix、Signal、
  iMessage、BlueBubbles、Feishu、Google Chat、IRC、Nextcloud Talk、Zalo、
  Zalo Personal、QA Channel、Microsoft Teams、Mattermost、Synology Chat、Tlon、
  Twitch 與 QQ Bot 的記錄路徑現在會讀取更新時間中繼資料，並透過 SQLite
  身分識別記錄傳入工作階段資料列。
- 逐字稿定位器的持久化已從作用中工作階段資料列移除。
  `resolveSessionTranscriptTarget` 會傳回 `agentId`、`sessionId` 以及選用的
  主題中繼資料；只有 Doctor 程式碼會匯入舊版逐字稿檔名。
- 執行階段逐字稿標頭從 SQLite 版本 `1` 開始。舊版 JSONL V1/V2/V3
  結構的升級僅存在於 Doctor 匯入中，並會在儲存資料列前，將匯入的標頭
  正規化為目前的 SQLite 逐字稿版本。
- 資料庫優先防護現在禁止 `SessionManager.listAll` 與
  `SessionManager.forkFromSession`；工作階段列出及分叉／還原工作流程
  必須維持使用資料列／範圍式 SQLite API。
- 此防護也禁止在 Doctor／匯入程式碼之外使用舊版逐字稿 JSONL 剖析／作用中分支修復輔助程式
  名稱，因此執行階段無法衍生出第二條舊版
  逐字稿遷移路徑。
- 嵌入式 PI 執行會拒絕傳入的逐字稿控制代碼。它們會在工作程序啟動前，以及再次於
  該次嘗試接觸逐字稿狀態前，使用 SQLite
  `{agentId, sessionId}` 身分識別。過時的 `/tmp/*.jsonl` 輸入無法選取
  執行階段寫入目標。
- 快取追蹤、Anthropic 承載資料、原始串流及診斷時間軸記錄
  現在會寫入具型別的 SQLite `diagnostic_events` 資料列。閘道穩定性套件
  現在會寫入具型別的 SQLite `diagnostic_stability_bundles` 資料列。舊的
  `diagnostics.cacheTrace.filePath`、`OPENCLAW_CACHE_TRACE_FILE`、
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` 與
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL 覆寫路徑已移除，且
  一般穩定性擷取不再寫入 `logs/stability/*.json` 檔案。
- 排程持久化現在會協調 SQLite `cron_jobs` 資料列，而非
  每次儲存時刪除並重新插入整個工作資料表。外掛目標
  回寫會直接更新相符的排程資料列，並讓執行階段排程狀態
  維持在同一個狀態資料庫交易中。
- 排程執行階段呼叫端現在使用穩定的 SQLite 排程儲存區鍵。舊版
  `cron.store` 路徑僅作為 Doctor 匯入輸入；正式環境閘道、工作
  維護、狀態、執行歷程與 Telegram 目標回寫路徑使用
  `resolveCronStoreKey`，且不再對鍵進行路徑正規化。排程狀態現在
  回報 `storeKey`，而非舊的檔案型 `storePath` 欄位。
- 排程執行階段載入與排程不再正規化舊版持久化工作
  結構，例如 `jobId`、`schedule.cron`、數值型 `atMs`、字串布林值或
  缺少 `sessionTarget`。Doctor 舊版匯入會在將資料列
  插入 SQLite 前負責這些修復。
- ACP 衍生不再解析或持久化逐字稿 JSONL 檔案路徑。衍生
  與執行緒繫結設定會直接持久化 SQLite 工作階段資料列，並保留
  工作階段 ID 作為逐字稿身分識別。
- ACP 工作階段中繼資料 API 現在會依 `agentId` 讀取／列出／更新插入 SQLite 資料列，
  且不再將 `storePath` 公開為 ACP 工作階段項目合約的一部分。
- 工作階段用量計算與閘道用量彙總現在僅依
  `{agentId, sessionId}` 解析逐字稿。成本／用量快取與探索到的工作階段
  摘要不再合成或傳回逐字稿定位器字串。
- 閘道聊天附加、中止部分持久化、`/sessions.send` 及
  網頁聊天媒體逐字稿寫入，現在會直接透過 SQLite 逐字稿
  範圍附加。閘道逐字稿注入輔助程式不再接受
  `transcriptLocator` 參數。
- SQLite 逐字稿探索現在只列出逐字稿範圍與統計資料：
  `{agentId, sessionId, updatedAt, eventCount}`。已無作用的
  `listSqliteSessionTranscriptLocators` 相容性輔助程式與每資料列
  `locator` 欄位均已移除。
- 逐字稿修復執行階段現在只公開
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`。舊的
  定位器式修復輔助程式已刪除；Doctor／偵錯程式碼會讀取明確的
  來源檔案路徑，且絕不遷移定位器字串。
- ACP 重播分類帳執行階段現在會將各工作階段的重播資料列儲存在共用
  SQLite 狀態資料庫中，而非 `acp/event-ledger.json`；Doctor 會匯入並
  移除舊版檔案。
- 閘道逐字稿讀取器輔助程式現在位於
  `src/gateway/session-transcript-readers.ts`，而非舊的
  `session-utils.fs` 模組名稱。備援重試歷程檢查的命名現在依據
  SQLite 逐字稿內容，而非舊的檔案輔助程式介面。
- 閘道注入聊天與壓縮輔助程式現在會透過內部輔助程式 API
  傳遞 SQLite 逐字稿範圍，而非將值命名為逐字稿路徑或
  來源檔案。
- 啟動程序接續偵測現在會透過
  `hasCompletedBootstrapTranscriptTurn` 檢查 SQLite 逐字稿資料列；它不再公開檔案型
  輔助程式名稱。
- 嵌入式執行器測試現在使用 SQLite 逐字稿身分識別，且開啟新的
  逐字稿管理員一律需要明確的 `sessionId`。
- 記憶索引輔助程式現在全程使用 SQLite 逐字稿術語：
  主機會匯出 `listSessionTranscriptScopesForAgent` 與
  `sessionTranscriptKeyForScope`，目標同步會將 `sessionTranscripts` 排入佇列，
  公開工作階段搜尋命中結果會公開不透明的 `transcript:<agent>:<session>` 路徑，
  而內部資料庫來源鍵為 `source_kind='sessions'` 下的
  `session:<session>`，而非虛構的檔案路徑。
- 通用外掛 SDK 持久化去重輔助程式不再公開檔案型
  選項。呼叫端會提供 SQLite 範圍鍵，而持久去重資料列會存在
  共用外掛狀態中。
- Microsoft Teams SSO 權杖已從鎖定的 JSON 檔案移至 SQLite 外掛
  狀態。Doctor 會匯入 `msteams-sso-tokens.json`、從承載資料重建標準 SSO 權杖
  鍵，並移除來源檔案。委派的 OAuth 權杖仍
  維持在其現有的私密認證資訊檔案邊界。
- Matrix 同步快取狀態已從 `bot-storage.json` 移至 SQLite 外掛
  狀態。Doctor 會匯入舊版原始或包裝的同步承載資料，並移除
  來源檔案。作用中的 Matrix 與 QA Matrix 用戶端會傳入 SQLite 同步儲存區根
  目錄，而非虛構的 `sync-store.json` 或 `bot-storage.json` 路徑。
- Matrix 舊版加密遷移狀態已從
  `legacy-crypto-migration.json` 移至 SQLite 外掛狀態。Doctor 會匯入
  舊的狀態檔案；Matrix SDK IndexedDB 快照已從
  `crypto-idb-snapshot.json` 移至 SQLite 外掛二進位大型物件。Matrix 復原金鑰與
  認證資訊為 SQLite 外掛狀態資料列；其舊 JSON 檔案僅作為 Doctor
  遷移輸入。
- Memory Wiki 活動記錄現在使用 SQLite 外掛狀態，而非
  `.openclaw-wiki/log.jsonl`。Memory Wiki 遷移提供者會匯入舊的
  JSONL 記錄；Wiki Markdown 與使用者保存庫內容仍以檔案形式
  儲存為工作區內容。
- Memory Wiki 不再建立 `.openclaw-wiki/state.json` 或未使用的
  `.openclaw-wiki/locks` 目錄。如果舊保存庫仍有這些已淘汰的
  外掛中繼資料檔案，遷移提供者會將其移除。
- Crestodian 稽核項目現在使用核心 SQLite 外掛狀態，而非
  `audit/crestodian.jsonl`。Doctor 會匯入舊版 JSONL 稽核記錄，並在
  成功匯入後將其移除。
- 設定寫入／觀察稽核項目現在使用核心 SQLite 外掛狀態，而非
  `logs/config-audit.jsonl`。Doctor 會匯入舊版 JSONL 稽核記錄，並在
  成功匯入後將其移除。
- macOS 輔助應用程式在編輯 `openclaw.json` 時，不再寫入應用程式本機的
  `logs/config-audit.jsonl` 或
  `logs/config-health.json` 側存檔。設定
  檔案仍以檔案形式儲存，復原快照仍放在設定檔案旁，
  而持久設定稽核／健康狀態則屬於閘道 SQLite 儲存區。
- Crestodian 救援待核准項目現在使用核心 SQLite 外掛狀態，而非
  `crestodian/rescue-pending/*.json`。Doctor 會匯入舊版待核准
  檔案，並在成功匯入後將其移除。
- Phone Control 暫時啟用狀態現在使用 SQLite 外掛狀態，而非
  `plugins/phone-control/armed.json`。Doctor 會將舊版已啟用狀態
  檔案匯入 `phone-control/arm-state` 命名空間，並移除該檔案。
- Doctor 不再就地修復 JSONL 逐字稿，也不再建立備份 JSONL
  檔案。它會將作用中分支匯入 SQLite，並移除舊版來源。
- 工作階段記憶掛鉤的逐字稿查詢使用 `{agentId, sessionId}` 僅限範圍的
  SQLite 讀取。其輔助程式不再接受或衍生逐字稿定位器、
  舊版檔案讀取或檔案重寫選項。
- Codex 應用程式伺服器對話繫結現在會依
  OpenClaw 工作階段鍵或明確的 `{agentId, sessionId}` 範圍，設定 SQLite 外掛狀態的鍵。它們不得
  保留逐字稿路徑備援繫結。
- Codex 應用程式伺服器的鏡像歷程讀取僅使用 SQLite 逐字稿範圍；
  它們不得從逐字稿檔案路徑復原身分識別。
- 角色排序與壓縮重設路徑不再取消連結舊的逐字稿
  檔案；重設只會輪替 SQLite 工作階段資料列與逐字稿身分識別。
- 閘道重設與檢查點回應會傳回乾淨的工作階段資料列及工作階段
  ID。它們不再為用戶端合成 SQLite 逐字稿定位器。
- 記憶體核心的夢境整理不再透過探查缺少的
  JSONL 檔案來清除工作階段資料列。子代理清理會透過工作階段執行階段 API 進行，而非
  檔案系統存在性檢查。其逐字稿擷取測試會直接植入 SQLite 資料列，
  而非建立 `agents/<id>/sessions` 測試資料或定位器
  預留位置。
- 記憶逐字稿索引可將 `transcript:<agentId>:<sessionId>` 公開為
  引用／讀取輔助程式的虛擬搜尋命中路徑。持久索引來源是
  關聯式的（`source_kind='sessions'`、`source_key='session:<sessionId>'`、
  `session_id=<sessionId>`），因此該值並非執行階段逐字稿定位器，
  不是檔案系統路徑，且絕不可傳回工作階段執行階段 API。
- 閘道 doctor 記憶體狀態會從 SQLite 外掛狀態資料列讀取短期回憶與階段訊號計數，而不是從 `memory/.dreams/*.json` 讀取；命令列介面與 doctor 輸出現在將該儲存空間標示為 SQLite 儲存區，而非路徑。
- Memory-core 執行階段、命令列介面狀態、閘道 doctor 方法與外掛 SDK
  外觀介面不再稽核或封存舊版 `.dreams/session-corpus` 檔案。
  這些檔案僅作為遷移輸入；doctor 會將其匯入 SQLite，並在驗證後
  刪除來源。作用中工作階段擷取證據資料列現在使用虛擬 SQLite 路徑
  `memory/session-ingestion/<day>.txt`；執行階段
  絕不會寫入 `.dreams/session-corpus`，也不會從中衍生狀態。
- Memory-core 公開成品會將 SQLite 主機事件公開為虛擬 JSON
  成品 `memory/events/memory-host-events.json`；不再重複使用
  舊版 `.dreams/events.jsonl` 來源路徑。
- 沙箱容器／瀏覽器登錄現在使用共用的
  `sandbox_registry_entries` SQLite 資料表，其中包含具型別的工作階段、映像、時間戳記、
  後端／設定與瀏覽器連接埠欄位。Doctor 會匯入舊版單體與
  分片 JSON 登錄檔案，並移除成功匯入的來源。執行階段讀取會以
  具型別的資料列欄位作為真實資料來源；`entry_json` 僅是重播／偵錯
  副本。
- 承諾事項現在使用具型別的共用 `commitments` 資料表，而非
  整個儲存區的 JSON Blob。儲存快照時會依承諾事項 ID 執行 upsert，且僅刪除
  缺少的資料列，而非清空並重新插入整個資料表。執行階段會從具型別的範圍、傳遞時段、
  狀態、嘗試次數與文字欄位載入承諾事項；`record_json` 僅是重播／偵錯副本。Doctor 會匯入舊版
  `commitments.json`，並在成功匯入後移除它。
- 排程工作定義、排程狀態與執行歷程不再有執行階段
  JSON 寫入器或讀取器。執行階段使用 `cron_jobs` 資料列，其中包含具型別的排程、
  承載資料、傳遞、失敗警示、工作階段、狀態與執行階段狀態欄位，另加
  排程自有的 `task_runs` 詳細資訊，用於診斷、傳遞、工作階段／執行、模型
  與權杖總計。`job_json` 僅是重播／偵錯副本；`state_json` 會保留尚無熱門查詢欄位的巢狀
  執行階段診斷資訊，而執行階段會從具型別欄位重新補水熱門狀態欄位。Doctor 會匯入
  舊版 `jobs.json`、`jobs-state.json` 與 `runs/*.jsonl` 檔案，並移除
  已匯入的來源。外掛目標回寫會更新相符的 `cron_jobs`
  資料列，而非載入並取代整個排程儲存區。
- 閘道啟動時會忽略執行階段投影中的舊版 `notify: true` 標記。
  當 `cron.webhook` 有效時，Doctor 會將其轉換為明確的 SQLite 傳遞；若未設定則移除
  無作用的標記；若所設定的網路鉤子無效，則保留標記並發出警告。
- 對外傳遞與工作階段傳遞佇列現在會將佇列狀態、項目種類、
  工作階段金鑰、頻道、目標、帳戶 ID、重試次數、上次嘗試／錯誤、
  復原狀態與平台傳送標記，儲存為共用
  `delivery_queue_entries` 資料表中的具型別欄位。執行階段復原會從
  具型別欄位讀取這些熱門欄位，而重試／復原異動會直接更新這些欄位，
  不會重寫重播 JSON。完整 JSON 承載資料僅保留作為
  訊息本文與其他冷門重播資料的重播／偵錯 Blob。
- 受管理的傳出圖片記錄現在使用具型別的共用
  `managed_outgoing_image_records` 資料列，媒體位元組仍儲存在
  `media_blobs` 中。JSON 記錄僅保留作為重播／偵錯副本。
- Discord 模型選擇器偏好設定、命令部署雜湊與討論串繫結
  現在使用共用 SQLite 外掛狀態。其舊版 JSON 匯入計畫位於
  Discord 外掛設定／doctor 遷移介面，而非核心遷移程式碼。
- 外掛舊版匯入偵測器使用 doctor 命名的模組，例如
  `doctor-legacy-state.ts` 或 `doctor-state-imports.ts`；一般頻道執行階段
  模組不得匯入舊版 JSON 偵測器。
- BlueBubbles 追補游標與傳入去重標記現在使用共用 SQLite
  外掛狀態。其舊版 JSON 匯入計畫位於 BlueBubbles 外掛
  設定／doctor 遷移介面，而非核心遷移程式碼。
- Telegram 更新偏移量、貼圖快取資料列、已傳送訊息快取資料列、
  主題名稱快取資料列與討論串繫結現在使用共用 SQLite 外掛
  狀態。其舊版 JSON 匯入計畫位於 Telegram 外掛
  設定／doctor 遷移介面，而非核心遷移程式碼。
- iMessage 追補游標、回覆短 ID 對應與已傳送回聲去重資料列
  現在使用共用 SQLite 外掛狀態。舊版 `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl` 與 `imessage/sent-echoes.jsonl` 檔案
  僅作為 doctor 輸入。
- Feishu 訊息去重資料列現在使用核心可宣告式去重
  （共用 SQLite 外掛狀態中的 `feishu.dedup.*` 命名空間），而非
  `feishu/dedup/*.json` 檔案或已淘汰的手工 `dedup.*` 儲存區；不進行舊版匯入，因為重播防護快取會在升級後重建。
- Microsoft Teams 對話、投票、待處理上傳緩衝區與意見回饋
  學習資料現在使用共用 SQLite 外掛狀態／Blob 資料表。待處理上傳
  路徑使用 `plugin_blob_entries`，因此媒體緩衝區會儲存為 SQLite BLOB，
  而非 base64 JSON。執行階段輔助程式名稱現在使用 SQLite／狀態命名，
  而非 `*-fs` 檔案儲存區命名，且舊版 `storePath` 墊片已從
  這些儲存區移除。其舊版 JSON 匯入計畫位於 Microsoft Teams
  外掛設定／doctor 遷移介面。
- Zalo 託管的傳出媒體現在使用共用 SQLite `plugin_blob_entries`，
  而非 `openclaw-zalo-outbound-media` JSON／bin 暫存附屬檔案。
- 差異檢視器 HTML 與中繼資料現在使用共用 SQLite `plugin_blob_entries`，
  而非 `meta.json`／`viewer.html` 暫存檔案。轉譯後的 PNG／PDF 輸出仍為
  暫時實體化檔案，因為頻道傳遞仍需要檔案路徑。
- Canvas 受管理文件現在使用共用 SQLite `plugin_blob_entries`，
  而非預設的 `state/canvas/documents` 目錄。Canvas 主機會直接提供這些
  Blob；僅針對明確的 `host.root` 操作者內容，或下游媒體讀取器
  需要路徑時的暫時實體化，才會建立本機檔案。
- 檔案傳輸稽核決策現在使用共用 SQLite `plugin_state_entries`，
  而非無界限的 `audit/file-transfer.jsonl` 執行階段記錄。Doctor
  會將舊版 JSONL 稽核檔案匯入外掛狀態，並在順利匯入後移除來源。
- ACPX 處理程序租約與閘道執行個體身分現在使用共用 SQLite 外掛
  狀態。Doctor 會將舊版 `gateway-instance-id` 檔案匯入外掛狀態，
  並移除來源。
- ACPX 產生的包裝函式指令碼與隔離的 Codex 主目錄，是位於 OpenClaw 暫存根目錄下的暫時
  實體化內容，而非持久的 OpenClaw 狀態。持久的 ACPX 執行階段記錄是 SQLite 租約與閘道執行個體資料列；
  舊版 ACPX `stateDir` 設定介面已移除，因為執行階段狀態
  已不再寫入該處。
- 閘道媒體附件現在使用共用 `media_blobs` SQLite 資料表作為
  正規位元組儲存區。傳回頻道與沙箱相容介面的本機路徑，
  是資料庫資料列的暫時實體化，而非
  持久媒體儲存區。執行階段媒體允許清單不再包含舊版
  `$OPENCLAW_STATE_DIR/media` 或設定目錄 `media` 根目錄；這些目錄
  僅作為 doctor 匯入來源。
- Shell 自動補全不再寫入 `$OPENCLAW_STATE_DIR/completions/*` 快取
  檔案。安裝、doctor、更新與發行煙霧測試路徑會使用產生的
  自動補全輸出或設定檔載入，而非持久自動補全快取
  檔案。
- 閘道 Skill 上傳暫存現在使用共用 `skill_uploads` 資料列。上傳
  中繼資料、冪等性金鑰與封存位元組存放於 SQLite；安裝程式
  僅會在安裝執行期間收到暫時實體化的封存路徑。
- 子代理程式行內附件不再實體化於工作區
  `.openclaw/attachments/*` 下。建立路徑會準備 SQLite VFS 種子項目，
  行內執行會將這些項目植入各代理程式的執行階段暫存命名空間，
  而磁碟型工具會將該 SQLite 暫存區疊加至附件路徑。舊版子代理程式執行附件目錄登錄欄位與清理掛鉤已移除。
- 命令列介面圖片補水不再維護穩定的 `openclaw-cli-images` 快取
  檔案。外部命令列介面後端仍會收到檔案路徑，但這些路徑是
  每次執行的暫時實體化內容，並附帶清理作業。
- 快取追蹤診斷、Anthropic 承載資料診斷、原始模型串流
  診斷、診斷時間軸事件與閘道穩定性套件，現在會寫入 SQLite 資料列，而非
  `logs/*.jsonl` 或 `logs/stability/*.json` 檔案。
  執行階段路徑覆寫旗標與環境變數已移除；匯出／偵錯
  命令可以明確地從資料庫資料列實體化檔案。
- macOS 伴隨應用程式不再具有輪替式 `diagnostics.jsonl` 寫入器。應用程式
  記錄會寫入統一記錄系統，而持久的閘道診斷仍由 SQLite 支援。
- macOS 連接埠守護程式記錄清單現在使用具型別的共用 SQLite
  `macos_port_guardian_records` 資料列，而非 Application Support JSON 檔案
  或不透明的單例 Blob。
- 閘道單例鎖現在使用 `gateway_locks` 範圍下具型別的共用 SQLite `state_leases` 資料列，
  而非暫存目錄鎖定檔案。Fly 與 OAuth 疑難排解文件現在指向 SQLite 租約／驗證重新整理鎖，
  而非過時的檔案鎖清理。
- 閘道重新啟動哨兵狀態現在使用具型別的共用 SQLite
  `gateway_restart_sentinel` 資料列，而非 `restart-sentinel.json`；執行階段
  會從具型別欄位讀取哨兵種類、狀態、路由、訊息、接續內容與統計資料。
  `payload_json` 僅是重播／偵錯副本。執行階段程式碼會直接清除
  SQLite 資料列，且不再保留檔案清理管線。
- 閘道重新啟動意圖與監督程式交接狀態現在使用具型別的共用
  SQLite `gateway_restart_intent` 與 `gateway_restart_handoff` 資料列，而非
  `gateway-restart-intent.json` 與
  `gateway-supervisor-restart-handoff.json` 附屬檔案。
- 閘道單例協調現在使用 `gateway_locks` 下具型別的 `state_leases` 資料列，
  而非寫入 `gateway.<hash>.lock` 檔案。租約資料列擁有鎖定擁有者、到期時間、心跳偵測與偵錯承載資料；
  SQLite 負責不可分割的取得／釋放邊界。已淘汰的檔案鎖目錄選項已移除；
  測試會直接使用 SQLite 資料列身分。
- 掃描 `cron/runs/*.jsonl`
  檔案的舊版未引用排程用量報告輔助程式已刪除。排程執行歷程報告會讀取排程自有的 `task_runs` 資料列。
- 主要工作階段重新啟動復原現在會透過 SQLite
  `agent_databases` 登錄尋找候選代理程式，而非掃描 `agents/*/sessions`
  目錄。
- Gemini 工作階段損毀復原現在僅刪除 SQLite 工作階段資料列；
  不再需要舊版 `storePath` 閘門，也不會嘗試取消連結衍生的
  逐字稿 JSONL 路徑。
- 路徑覆寫處理現在會將字面值 `undefined`／`null` 環境
  值視為未設定，防止測試或 Shell 交接期間意外在儲存庫根目錄建立 `undefined/state/*.sqlite`
  資料庫。
- 設定健全狀態指紋現在使用具型別的共用 SQLite `config_health_entries`
  資料列，而非 `logs/config-health.json`，使一般設定檔維持為
  唯一非認證資訊的設定文件。macOS 伴隨應用程式僅保留
  處理程序本機健全狀態，不會重新建立舊版 JSON 附屬檔案。
- 認證設定檔執行階段不再匯入或寫入認證資訊 JSON 檔案。
  標準認證資訊儲存區為 SQLite；`auth-profiles.json`、每個代理程式的
  `auth.json`，以及共用的 `credentials/oauth.json` 是 doctor 遷移輸入，
  匯入後會予以移除。
- 認證設定檔儲存／狀態測試現在會直接對具型別的 SQLite 認證資料表進行判定，
  且只將舊版認證設定檔檔名用於 doctor 遷移輸入。
- `openclaw secrets apply` 只會清除設定檔、環境變數檔案及 SQLite
  認證設定檔儲存區。它不再包含編輯已淘汰之每個代理程式
  `auth.json` 的相容性邏輯；該檔案的匯入與刪除由 doctor 負責。
- Hermes 密鑰遷移會規劃匯入的 API 金鑰設定檔，並將其直接套用至
  SQLite 認證設定檔儲存區。它不再將 `auth-profiles.json`
  寫入或驗證為中繼目標。
- 面向使用者的認證文件現在說明
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`，不再要求使用者檢查或複製
  `auth-profiles.json`；舊版 OAuth／認證 JSON 名稱只會記載為 doctor 匯入輸入。
- 核心狀態路徑輔助函式不再公開已淘汰的 `credentials/oauth.json`
  檔案。舊版檔名僅存在於 doctor 認證匯入路徑中。
- 安裝、安全性、初始設定、模型認證及 SecretRef 文件現在說明
  SQLite 認證設定檔資料列及完整狀態備份／遷移，而非
  每個代理程式的認證設定檔 JSON 檔案。
- PI 模型探索現在會將標準認證資訊傳入記憶體內的
  `pi-coding-agent` 認證儲存區。探索期間不再建立、清除或寫入
  每個代理程式的 `auth.json`。
- 語音喚醒觸發及路由設定現在使用具型別的共用 SQLite 資料表，
  而非 `settings/voicewake.json`、`settings/voicewake-routing.json` 或
  不透明的通用資料列；doctor 會匯入舊版 JSON 檔案，並在遷移成功後將其移除。
- 更新檢查狀態現在使用具型別的共用 `update_check_state` 資料列，
  而非 `update-check.json` 或不透明的通用 Blob；doctor 會匯入
  舊版 JSON 檔案，並在遷移成功後將其移除。
- 設定健康狀態現在使用具型別的共用 `config_health_entries` 資料列，
  而非 `logs/config-health.json` 或不透明的通用 Blob；doctor
  會匯入舊版 JSON 檔案，並在遷移成功後將其移除。
- 外掛對話繫結核准現在使用具型別的
  `plugin_binding_approvals` 資料列，而非不透明的共用 SQLite 狀態或
  `plugin-binding-approvals.json`；舊版檔案是 doctor 遷移輸入。
- 通用目前對話繫結現在會儲存具型別的
  `current_conversation_bindings` 資料列，而非重寫
  `bindings/current-conversations.json`；doctor 會匯入舊版 JSON 檔案，
  並在遷移成功後將其移除。
- Memory Wiki 匯入來源同步帳本現在會為每個保存庫／來源金鑰儲存一筆 SQLite 外掛狀態資料列，
  而非重寫 `.openclaw-wiki/source-sync.json`；
  遷移提供者會匯入並移除舊版 JSON 帳本。
- Memory Wiki ChatGPT 匯入執行記錄現在會為每個保存庫／執行 ID 儲存一筆 SQLite 外掛狀態資料列，
  而非寫入 `.openclaw-wiki/import-runs/*.json`。
  在匯入執行快照封存移至 Blob 儲存區之前，復原快照仍會保留為明確的保存庫檔案。
- Memory Wiki 編譯摘要現在會儲存 SQLite 外掛 Blob 資料列，
  而非寫入 `.openclaw-wiki/cache/agent-digest.json` 和
  `.openclaw-wiki/cache/claims.jsonl`。遷移提供者會匯入舊快取檔案，
  並在快取目錄變空時將其移除。
- ClawHub Skill 安裝追蹤現在會為每個工作區／Skill 儲存一筆 SQLite 外掛狀態資料列，
  而非在執行階段寫入或讀取 `.clawhub/lock.json` 和
  `.clawhub/origin.json` 附屬檔案。執行階段程式碼使用追蹤安裝
  狀態物件，而非檔案形態的鎖定檔／來源抽象。doctor
  會從已設定的代理程式工作區匯入舊版附屬檔案，並在完整匯入後將其移除。
- 已安裝外掛索引現在會讀寫具型別的共用 SQLite
  `installed_plugin_index` 單例資料列，而非 `plugins/installs.json`；
  舊版 JSON 檔案只會作為 doctor 遷移輸入，並在匯入後移除。
- 舊版 `plugins/installs.json` 路徑輔助函式現在位於 doctor 舊版
  程式碼中。執行階段外掛索引模組只會公開由 SQLite 支援的持久化
  選項，而非 JSON 檔案路徑。
- 閘道重新啟動哨兵、重新啟動意圖及監督程式交接狀態現在使用
  具型別的共用 SQLite 資料列（`gateway_restart_sentinel`、
  `gateway_restart_intent` 和 `gateway_restart_handoff`），而非通用的
  不透明 Blob。執行階段重新啟動程式碼不再具有檔案形態的哨兵／意圖／交接
  契約。
- Matrix 同步快取、儲存中繼資料、討論串繫結、輸入去重標記、
  啟動驗證冷卻狀態、SDK IndexedDB 加密快照、
  認證資訊及復原金鑰現在使用共用 SQLite 外掛狀態／Blob
  資料表。執行階段路徑結構不再公開 `storage-meta.json` 中繼資料
  路徑；該檔名只會作為舊版遷移輸入。其舊版 JSON 匯入
  計畫位於 Matrix 外掛設定／doctor 遷移介面中。輸入
  去重標記使用核心可宣告去重機制（共用狀態資料庫中的 `matrix.inbound-dedupe.*`
  命名空間）；Matrix doctor 狀態遷移只會匯入一次
  已淘汰的每個根目錄 `inbound-dedupe` 資料列及 `inbound-dedupe.json`，
  此後執行階段只會讀取可宣告去重儲存區。
- Matrix 啟動不再掃描、回報或完成舊版 Matrix 檔案
  狀態。Matrix 檔案偵測、舊版加密快照建立、房間金鑰
  還原遷移狀態、匯入及來源移除全都由 doctor 負責。
- Matrix 執行階段遷移匯出模組已移除。舊版狀態／加密偵測
  與變更輔助函式由 Matrix doctor 直接匯入，不再屬於
  執行階段 API 介面。
- Matrix 遷移快照重複使用標記現在位於 SQLite 外掛狀態中，
  而非 `matrix/migration-snapshot.json`；doctor 仍可重複使用相同的
  已驗證遷移前封存檔，而無須寫入附屬狀態檔案。
- Nostr 匯流排游標及設定檔發布狀態現在使用共用 SQLite 外掛
  狀態。其舊版 JSON 匯入計畫位於 Nostr 外掛設定／doctor
  遷移介面中。
- 主動記憶工作階段切換現在使用共用 SQLite 外掛狀態，
  而非 `session-toggles.json`；重新開啟記憶功能時會刪除該資料列，而非
  重寫 JSON 物件。
- Skill Workshop 提案與審查計數器現在使用共用 SQLite 外掛
  狀態，而非每個工作區的 `skill-workshop/<workspace>.json` 儲存區。每個
  提案都是 `skill-workshop/proposals` 下的獨立資料列，而審查
  計數器則是 `skill-workshop/reviews` 下的獨立資料列。
- Skill Workshop 審查者子代理程式執行現在使用執行階段工作階段逐字稿
  解析器，而非建立 `skill-workshop/<sessionId>.json` 附屬工作階段
  路徑。
- ACPX 程序租約現在使用 `acpx/process-leases` 下的共用 SQLite 外掛狀態，
  而非整個檔案形式的 `process-leases.json` 登錄。
  每筆租約會儲存為獨立資料列，在不使用執行階段 JSON 重寫路徑的情況下，
  保留啟動時清除過期程序的功能。
- ACPX 包裝函式指令碼及隔離的 Codex 主目錄會在
  OpenClaw 暫存根目錄中產生。它們會視需要重新建立，且不是備份或
  遷移輸入。
- 子代理程式執行登錄持久化使用具型別的共用 `subagent_runs` 資料列。舊
  `subagents/runs.json` 路徑現在只會作為 doctor 遷移輸入，而
  執行階段輔助函式名稱不再將狀態層描述為磁碟支援。
  執行階段測試不再建立無效或空白的 `runs.json` 測試資料來驗證
  登錄行為；它們會直接植入／讀取 SQLite 資料列。
- 備份會在封存前暫存狀態目錄、複製非資料庫檔案、
  使用 `VACUUM INTO` 建立資料庫快照、省略即時 WAL／SHM 附屬檔案、
  在封存資訊清單中記錄快照中繼資料，並將
  已完成的備份執行及封存資訊清單記錄於 SQLite。`openclaw backup
create` 預設會驗證已寫入的封存檔；`--no-verify` 是
  明確的快速路徑。
- `openclaw backup restore` 會在解壓縮前驗證封存檔、重複使用
  驗證器的標準化資訊清單，並將已驗證的資訊清單資產還原至其
  記錄的來源路徑。寫入時必須使用 `--yes`，並支援以 `--dry-run`
  取得還原計畫。
- 舊版備份揮發性路徑篩選器已刪除。備份不再需要
  即時 tar 略過清單來處理舊版工作階段或排程 JSON／JSONL 檔案，因為 SQLite
  快照會在建立封存檔前完成暫存。
- 一般設定及初始設定工作區準備不再建立
  `agents/<agentId>/sessions/` 目錄。它們只會建立設定／工作區；
  SQLite 工作階段資料列及逐字稿資料列會視需要在
  每個代理程式的資料庫中建立。
- 安全性權限修復現在以全域及每個代理程式的 SQLite
  資料庫與 WAL／SHM 附屬檔案為目標，而非 `sessions.json` 和逐字稿
  JSONL 檔案。
- 沙箱登錄執行階段名稱現在會直接描述 SQLite 登錄類型，
  不再讓使用中的儲存區沿用舊版 JSON 登錄術語。
- `openclaw reset --scope config+creds+sessions` 會移除每個代理程式的
  `openclaw-agent.sqlite` 資料庫及 WAL／SHM 附屬檔案，而非只移除舊版
  `sessions/` 目錄。
- 閘道彙總工作階段輔助函式現在使用以項目為導向的名稱：
  `loadCombinedSessionEntriesForGateway` 會傳回 `{ databasePath, entries }`。
  舊版合併儲存區命名已從執行階段呼叫端移除。
- Docker MCP 頻道植入現在會將主要工作階段資料列及逐字稿
  事件寫入每個代理程式的 SQLite 資料庫，而非建立
  `sessions.json` 及 JSONL 逐字稿。
- 內建的工作階段記憶掛鉤現在會依據 `{agentId, sessionId}`
  從 SQLite 解析上一個工作階段的內容。它不再掃描、儲存或合成
  逐字稿路徑或 `workspace/sessions` 目錄。
- 內建的命令記錄器掛鉤現在會將命令稽核資料列寫入共用
  SQLite `command_log_entries` 資料表，而非附加至
  `logs/commands.log`。
- 頻道配對允許清單現在只會在執行階段公開由 SQLite 支援的讀寫輔助函式。
  已淘汰的外掛 SDK 路徑解析器仍會保留以維持遷移
  相容性；檔案讀取器只存在於 doctor 狀態遷移程式碼中。
- `migration_runs` 會記錄舊版狀態遷移的執行狀態、
  時間戳記及 JSON 報告。
- `migration_sources` 會記錄每個匯入的舊版檔案來源，包括雜湊、大小、
  記錄數、目標資料表、執行 ID、狀態及來源移除狀態。
- `backup_runs` 會記錄備份封存路徑、狀態及 JSON 資訊清單。
- 全域結構描述不會保留未使用的 `agents` 登錄資料表。在執行階段
  擁有實際的代理程式記錄負責者之前，代理程式資料庫探索是標準的
  `agent_databases` 登錄。
- 產生的模型目錄設定會儲存於具型別的全域 SQLite
  `agent_model_catalogs` 資料列，並以代理程式目錄為索引鍵。執行階段呼叫端使用
  `ensureOpenClawModelCatalog`；執行階段程式碼中沒有 `models.json` 相容性 API。
  實作會寫入 SQLite，並使用該儲存的承載資料載入內嵌 PI 登錄，
  而不建立 `models.json` 檔案。
- QMD 工作階段逐字稿 Markdown 匯出及 `memory.qmd.sessions` 設定已
  移除。不再有 QMD 逐字稿集合、不再有 `qmd/sessions*` 執行階段
  路徑，也不再有檔案支援的工作階段記憶橋接器。
- Memory-core 執行階段會從
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` 匯入 SQLite 逐字稿索引輔助函式，而非
  QMD SDK 子路徑。QMD 子路徑只保留相容性重新匯出，供
  外部呼叫端，直到 SDK 的重大清理能將其移除。
- QMD 自身的 `index.sqlite` 現在是由主要 SQLite `plugin_blob_entries` 資料表支援的暫時執行階段具現化。
  執行階段不再建立持久的 `~/.openclaw/agents/<agentId>/qmd` 附屬檔案。
- 選用的 `memory-lancedb` 外掛不再建立
  `~/.openclaw/memory/lancedb` 作為由 OpenClaw 隱含管理的儲存區。它是
  外部 LanceDB 後端，且在操作員設定明確的 `dbPath` 前會保持停用。
- `check:database-first-legacy-stores` 會使將舊版儲存區名稱與
  寫入型檔案系統 API 配對的新執行階段原始碼無法通過。它也會使重新引入已淘汰逐字稿橋接標記
  `transcriptLocator` 或 `sqlite-transcript://...` 的執行階段
  原始碼無法通過。遷移、doctor、匯入及明確的非工作階段匯出程式碼仍獲允許。
  `sessionFile`、`storePath` 等更廣泛的舊版契約名稱，以及舊 `SessionManager` 檔案時代
  外觀介面目前仍有負責的擁有者，需要另行進行遷移防護工作，
  才能將它們納入必要的預檢。此防護現在也涵蓋
  執行階段 `cache/*.json` 儲存區、通用
  `thread-bindings.json` 附屬檔案、排程狀態／執行記錄 JSON、設定健康狀態 JSON、
  重新啟動與鎖定附屬檔案、Voice Wake 設定、外掛繫結核准、
  已安裝外掛索引 JSON、File Transfer 稽核 JSONL、Memory Wiki 活動
  記錄、舊版內建 `command-logger` 文字記錄，以及 pi-mono 原始串流 JSONL
  診斷控制項。它也會禁止舊版根層級 doctor 舊版模組名稱，使
  相容性程式碼維持在 `src/commands/doctor/` 下。Android 偵錯處理常式
  也會使用 logcat／記憶體內輸出，而非暫存 `camera_debug.log` 或
  `debug_logs.txt` 快取檔案。

## 目標結構形態

保持結構明確。由主機擁有的執行階段狀態使用具型別的資料表。由外掛擁有的
不透明狀態使用 `plugin_state_entries` / `plugin_blob_entries`；不存在
通用的主機 `kv` 資料表。

全域資料庫：

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

代理程式資料庫：

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(id, path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

`memory_index_sources.id` 是穩定的整數主鍵；`(path, source)` 仍維持唯一性。

未來可新增 FTS 資料表以支援搜尋，而不必變更標準事件資料表：

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

大型值應使用 `blob` 欄位，而非編碼為 JSON 字串。將
`value_json` 保留給必須能以一般 SQLite 工具檢查的小型結構化資料。

`agent_databases` 是此分支的標準登錄檔。在真正的代理程式記錄擁有者出現之前，請勿新增
`agents` 資料表；代理程式設定仍保留於
`openclaw.json`。

## Doctor 遷移形態

Doctor 應呼叫單一明確、可產生報告且可安全地
重新執行的遷移步驟：

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` 會在一般設定預先檢查後叫用狀態遷移實作，
並在匯入前建立已驗證的備份。執行階段啟動程序與 `openclaw migrate` 絕不可匯入舊版 OpenClaw 狀態檔案。

遷移屬性：

- 單次遷移會先探索所有舊版檔案來源並產生計畫，
  之後才變更任何內容。
- Doctor 會在匯入舊版檔案前建立已驗證的遷移前備份封存檔。
- 匯入作業具有冪等性，並以來源路徑、mtime、大小、雜湊與目標
  資料表作為鍵值。
- 目標資料庫提交後，成功匯入的來源檔案會被移除或封存。
- 匯入失敗時會保留來源不變，並在
  `migration_runs` 中記錄警告。
- 遷移功能存在後，執行階段程式碼僅讀取 SQLite。
- 不需要降級或匯出至執行階段檔案的路徑。

## 遷移清冊

將以下項目移至全域資料庫：

- 任務登錄的執行階段寫入現在使用共用資料庫；尚未發布的
  `tasks/runs.sqlite` 側載匯入器已刪除。快照儲存會依任務
  id 執行 upsert，且僅刪除缺少的任務／遞送資料列。
- Task Flow 執行階段寫入現在使用共用資料庫；尚未發布的
  `tasks/flows/registry.sqlite` 側載匯入器已刪除。快照儲存
  會依流程 id 執行 upsert，且僅刪除缺少的流程資料列。
- 外掛狀態的執行階段寫入現在使用共用資料庫；尚未發布的
  `plugin-state/state.sqlite` 側載匯入器已刪除。
- 內建記憶搜尋不再預設使用 `memory/<agentId>.sqlite`；其
  索引資料表位於所屬的代理程式資料庫中，而明確選擇使用
  `memorySearch.store.path` 側載的功能已移至 doctor 設定
  遷移。
- 內建記憶重新索引只會重設代理程式資料庫中由記憶功能擁有的資料表。
  它不得取代整個 SQLite 檔案，因為同一個資料庫也包含
  工作階段、逐字稿、VFS 資料列、成品和執行階段快取。
- 從單體和分片 JSON 遷移沙箱容器／瀏覽器登錄。執行階段
  寫入現在使用共用資料庫；仍保留舊版 JSON 匯入。
- 排程工作定義、排程狀態和執行記錄現在使用共用 SQLite；
  doctor 會匯入／移除舊版 `jobs.json`、`jobs-state.json` 和
  `cron/runs/*.jsonl` 檔案
- 裝置身分／驗證、推播、更新檢查、承諾、OpenRouter 模型
  快取、已安裝外掛索引和應用程式伺服器繫結
- 裝置／節點配對和啟動程序記錄現在使用具型別的 SQLite 資料表
- 裝置配對通知訂閱者和已遞送請求標記現在使用
  共用 SQLite 外掛狀態資料表，而非 `device-pair-notify.json`。
- 語音通話記錄現在使用 `voice-call`／`calls`
  命名空間下的共用 SQLite 外掛狀態資料表，而非 `calls.jsonl`；外掛命令列介面
  會追蹤並彙整由 SQLite 支援的通話記錄。
- QQ Bot 閘道工作階段、已知使用者記錄和參照索引引用快取現在使用
  `qqbot` 命名空間（`gateway-sessions`、
  `known-users`、`ref-index`）下的 SQLite 外掛狀態，而非 `session-*.json`、`known-users.json`
  和 `ref-index.jsonl`。這些舊版檔案屬於快取，不會遷移。
- Discord 模型選擇器偏好設定、命令部署雜湊和討論串繫結
  現在使用 `discord` 命名空間
  （`model-picker-preferences`、`command-deploy-hashes`、`thread-bindings`）
  下的 SQLite 外掛狀態，而非 `model-picker-preferences.json`、`command-deploy-cache.json` 和
  `thread-bindings.json`；Discord doctor／設定遷移會匯入並
  移除舊版檔案。
- BlueBubbles 追趕游標和輸入去重標記現在使用
  `bluebubbles` 命名空間（`catchup-cursors`、`inbound-dedupe`）
  下的 SQLite 外掛狀態，而非 `bluebubbles/catchup/*.json` 和
  `bluebubbles/inbound-dedupe/*.json`；BlueBubbles doctor／設定遷移
  會匯入並移除舊版檔案。
- Telegram 更新偏移量、貼圖快取項目、回覆鏈訊息快取
  項目、已傳送訊息快取項目、主題名稱快取項目和討論串
  繫結現在使用 `telegram` 命名空間
  （`update-offsets`、`sticker-cache`、`message-cache`、`sent-messages`、
  `topic-names`、`thread-bindings`）下的 SQLite 外掛狀態，而非 `update-offset-*.json`、
  `sticker-cache.json`、`*.telegram-messages.json`、
  `*.telegram-sent-messages.json`、`*.telegram-topic-names.json` 和
  `thread-bindings-*.json`；Telegram doctor／設定遷移會匯入並
  移除舊版檔案。
- iMessage 追趕游標、回覆短 id 對應和已傳送回聲去重資料列
  現在使用 `imessage` 命名空間（`catchup-cursors`、
  `reply-cache`、`sent-echoes`）下的 SQLite 外掛狀態，而非 `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl` 和 `imessage/sent-echoes.jsonl`；iMessage
  doctor／設定遷移會匯入並移除舊版檔案。
- Microsoft Teams 交談、投票、SSO 權杖和意見回饋學習資料現在
  使用 SQLite 外掛狀態命名空間（`conversations`、`polls`、`sso-tokens`、
  `feedback-learnings`），而非 `msteams-conversations.json`、
  `msteams-polls.json`、`msteams-sso-tokens.json` 和 `*.learnings.json`；Microsoft Teams
  doctor／設定遷移會匯入並封存舊版檔案。
  待處理上傳是短期 SQLite 快取，舊的 JSON 快取檔案
  不會遷移。
- Matrix 同步快取、儲存中繼資料、討論串繫結、輸入去重標記、
  啟動驗證冷卻狀態、認證資訊、復原金鑰和 SDK
  IndexedDB 加密快照現在使用 `matrix`
  下的 SQLite 外掛狀態／Blob 命名空間（`sync-store`、`storage-meta`、`thread-bindings`、
  透過核心可宣告去重的 `matrix.inbound-dedupe.*`、
  `startup-verification`、`credentials`、`recovery-key`、`idb-snapshots`），
  而非 `bot-storage.json`、`storage-meta.json`、`thread-bindings.json`、
  `inbound-dedupe.json`、`startup-verification.json`、`credentials.json`、
  `recovery-key.json` 和 `crypto-idb-snapshot.json`；Matrix doctor／設定
  遷移會從帳號範圍的 Matrix 儲存根目錄匯入並移除這些舊版檔案
  （以及已停用的每根目錄 `inbound-dedupe` SQLite 資料列）。
- Nostr 匯流排游標和設定檔發布狀態現在使用
  `nostr` 命名空間（`bus-state`、`profile-state`）下的 SQLite 外掛狀態，而非
  `bus-state-*.json` 和 `profile-state-*.json`；Nostr doctor／設定
  遷移會匯入並移除舊版檔案。
- 主動記憶工作階段切換狀態現在使用
  `active-memory/session-toggles` 下的 SQLite 外掛狀態，而非 `session-toggles.json`。
- Skill Workshop 提案佇列和審查計數器現在使用
  `skill-workshop/proposals` 和 `skill-workshop/reviews` 下的 SQLite 外掛狀態，而非
  每個工作區的 `skill-workshop/<workspace>.json` 檔案。
- 輸出遞送和工作階段遞送佇列現在共用全域 SQLite
  `delivery_queue_entries` 資料表，並使用不同的佇列名稱
  （`outbound-delivery`、`session-delivery`），而非持久的
  `delivery-queue/*.json`、`delivery-queue/failed/*.json` 和
  `session-delivery-queue/*.json` 檔案。doctor 的舊版狀態步驟會匯入
  待處理和失敗的資料列、移除過期的已遞送標記，並在匯入後刪除舊
  JSON 檔案。熱路由和重試欄位是具型別的資料欄；僅為重播／偵錯
  保留 JSON 承載內容。
- ACPX 程序租約現在使用 `acpx/process-leases`
  下的 SQLite 外掛狀態，而非 `process-leases.json`。
- 備份和遷移執行中繼資料

將以下項目移入代理程式資料庫：

- 代理程式工作階段根目錄和相容形狀的工作階段項目承載內容。執行階段
  寫入已完成：熱門工作階段中繼資料可在 `sessions` 中查詢，而
  舊版形狀的完整 `SessionEntry` 承載內容仍位於 `session_entries` 中。
- 代理程式逐字稿事件。執行階段寫入已完成。
- 壓縮檢查點和逐字稿快照。執行階段寫入已完成：
  檢查點逐字稿副本是 SQLite 逐字稿資料列，而檢查點
  中繼資料記錄於 `transcript_snapshots`。閘道檢查點輔助函式
  現在將這些值稱為逐字稿快照，而非來源檔案。
- 代理程式 VFS 暫存／工作區命名空間。執行階段 VFS 寫入已完成。
- 子代理程式附件承載內容。執行階段寫入已完成：它們是 SQLite VFS
  種子項目，絕不會是持久工作區檔案。
- 工具成品。執行階段寫入已完成。
- 執行成品。工作處理器透過每個代理程式的
  `run_artifacts` 資料表進行執行階段寫入，現已完成。
- 代理程式本機執行階段快取。工作處理器透過
  每個代理程式的 `cache_entries` 資料表進行範圍快取寫入，現已完成。閘道層級的模型快取
  會留在全域資料庫中，除非它們變成代理程式專屬。
- ACP 父串流日誌。執行階段寫入已完成。
- ACP 重播帳本工作階段。透過
  `acp_replay_sessions` 和 `acp_replay_events` 進行執行階段寫入，現已完成；舊版 `acp/event-ledger.json`
  僅保留作為 doctor 輸入。
- ACP 工作階段中繼資料。透過 `acp_sessions` 進行執行階段寫入，現已完成；`sessions.json`
  中的舊版 `entry.acp` 區塊僅作為 doctor 遷移輸入。
- 非明確匯出檔案的軌跡側載檔案。執行階段
  寫入已完成：軌跡擷取會寫入代理程式資料庫的 `trajectory_runtime_events`
  資料列，並將執行範圍的成品鏡像至 SQLite。舊版側載檔案僅作為 doctor
  匯入輸入；匯出可以具體化新的 JSONL 支援套件輸出，
  但不會在執行階段讀取或遷移舊的軌跡／逐字稿側載檔案。
  執行階段軌跡擷取會公開 SQLite 範圍；JSONL 路徑輔助函式
  僅限匯出／偵錯支援使用，且不會從執行階段模組重新匯出。
  內嵌執行器軌跡中繼資料會記錄 `{agentId, sessionId, sessionKey}`
  身分，而非持久保存逐字稿定位器。

目前仍將以下項目保留為檔案支援：

- `openclaw.json`
- 提供者或命令列介面的認證資訊檔案
- 外掛／套件資訊清單
- 選取磁碟模式時的使用者工作區和 Git 儲存庫
- 供操作人員追蹤的日誌，除非特定日誌介面已遷移

## 遷移計畫

### 階段 0：凍結邊界

在移動更多資料列之前，明確定義持久狀態邊界：

- 在全域資料庫中新增 `migration_runs` 資料表。
  舊版狀態遷移執行報告已完成。
- 新增單一由 doctor 擁有的狀態遷移服務，用於從檔案匯入資料庫。
  已完成：`openclaw doctor --fix` 使用舊版狀態遷移實作。
- 將 `plan` 設為唯讀，並讓 `apply` 建立備份、匯入、驗證，
  然後刪除或隔離舊檔案。
  已完成：doctor 會建立經驗證的遷移前備份、將備份路徑
  傳入 `migration_runs`，並重複使用匯入器／移除路徑。
- 新增靜態禁令，使新的執行階段程式碼無法寫入舊版狀態檔案，
  同時遷移程式碼和測試仍可植入／讀取這些檔案。
  目前已遷移的舊版儲存區已完成；此防護也會掃描巢狀
  測試，找出禁止的執行階段逐字稿定位器合約。

### 階段 1：完成全域控制平面

將共用協調狀態保留在 `state/openclaw.sqlite` 中：

- 代理程式和代理程式資料庫登錄
- 任務和 Task Flow 帳本
- 外掛狀態
- 沙箱容器／瀏覽器登錄
- 排程／排程器執行記錄
- 配對、裝置、推播、更新檢查、終端介面、OpenRouter／模型快取和其他
  小型閘道範圍執行階段狀態
- 備份和遷移中繼資料
- 閘道媒體附件位元組。執行階段寫入已完成；直接檔案路徑
  是為了與頻道傳送器和沙箱暫存相容而建立的暫時具體化檔案。執行階段允許清單接受
  SQLite 具體化路徑，而非舊版狀態／設定媒體根目錄。doctor 會將舊版媒體檔案匯入
  `media_blobs`，並在成功寫入資料列後移除來源檔案。
- 偵錯 Proxy 擷取工作階段、事件和承載內容 Blob。已完成：擷取資料位於
  共用狀態資料庫中，並透過共用狀態資料庫的啟動程序、結構描述、
  WAL 和忙碌逾時設定開啟。承載內容位元組會在
  `capture_blobs.data` 中以 gzip 壓縮；不存在偵錯 Proxy 執行階段側載資料庫覆寫、
  Blob 目錄或僅供 Proxy 擷取使用的產生式結構描述／程式碼產生目標。
  doctor／啟動遷移會匯入已發布的 `debug-proxy/capture.sqlite` 資料列
  和參照的承載內容 Blob，包括作用中的舊版資料庫／Blob 環境
  覆寫，接著封存這些來源，同時保留 CA 憑證不變。

此階段也會從這些子系統中刪除重複的側載檔案開啟器、權限輔助函式、WAL
設定、檔案系統修剪，以及相容性寫入器。

### 階段 2：導入每個代理程式各自的資料庫

為每個代理程式建立一個資料庫，並從全域資料庫註冊：

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

全域 `agent_databases` 資料列會儲存路徑、結構描述版本、上次出現
時間戳記，以及基本的大小／完整性中繼資料。執行階段程式碼會向登錄查詢
代理程式資料庫，而不是直接推導檔案路徑。

代理程式資料庫負責：

- `sessions` 作為標準工作階段根，其中 `session_entries` 是附加至該根的
  相容性形狀承載資料表，而
  `session_routes` 則是唯一的作用中 `session_key` 查詢
- `conversations` 與 `session_conversations`，作為附加至工作階段的正規化提供者
  路由識別資訊
- `transcript_events`
- 逐字記錄快照與壓縮檢查點。執行階段寫入已完成。
- `vfs_entries`
- `tool_artifacts` 與執行成品
- 代理程式本機的執行階段／快取資料列。工作程式範圍快取已完成。
- ACP 父串流事件
- 不屬於明確匯出成品時的軌跡執行階段事件

### 階段 3：取代工作階段儲存區 API

執行階段部分已完成。檔案形狀的工作階段儲存區介面已不再是作用中的
執行階段合約：

- 執行階段不再呼叫 `loadSessionStore(storePath)`，也不再將 `storePath` 視為
  工作階段識別資訊。
- 執行階段資料列操作為 `getSessionEntry`、`upsertSessionEntry`、
  `patchSessionEntry`、`deleteSessionEntry` 與 `listSessionEntries`。
- 整體儲存區重寫輔助函式、檔案寫入器、佇列測試、別名修剪，以及
  舊版金鑰刪除參數，皆已從執行階段移除。
- 已淘汰的根套件相容性匯出仍會將標準
  `sessions.json` 路徑調適至 SQLite 資料列 API。
- `sessions.json` 剖析僅保留在 doctor 遷移／匯入程式碼與
  doctor 測試中。
- 執行階段生命週期備援會讀取 SQLite 逐字記錄標頭，而非 JSONL 第一
  行。

持續刪除任何重新引入檔案鎖定參數、
將修剪／截斷描述為檔案維護的詞彙、儲存區路徑識別資訊，或唯一斷言為
JSON 持久化的測試。

### 階段 4：移動逐字記錄、ACP 串流、軌跡與 VFS

讓每個代理程式資料串流都以資料庫為原生基礎：

- 逐字記錄附加寫入會透過單一 SQLite 交易完成；該交易會確保
  工作階段標頭存在、檢查訊息冪等性、選取父尾端、插入
  `transcript_events`，並在
  `transcript_event_identities` 中記錄可查詢的識別中繼資料。直接附加逐字記錄訊息與
  一般持久化 `TranscriptSessionManager` 附加已完成；明確的分支
  操作會保留其明確的父項選擇，且仍會寫入 SQLite 資料列，
  不會推導任何檔案定位器。
- ACP 父串流記錄會成為資料列，而非 `.acp-stream.jsonl` 檔案。已完成。
- ACP 衍生設定不再持久化逐字記錄 JSONL 路徑。已完成。
- 執行階段軌跡擷取會直接寫入事件資料列／成品。明確的
  支援／匯出命令仍可產生支援套件 JSONL 成品作為
  匯出格式，但工作階段匯出不會重新建立工作階段 JSONL。已完成。
- 設定為磁碟模式時，磁碟工作區會保留在磁碟上。
- VFS 暫存區與實驗性的僅限 VFS 工作區模式會使用代理程式資料庫。

遷移會匯入舊 JSONL 檔案一次，在
`migration_runs` 中記錄計數／雜湊，並在完整性檢查後移除已匯入的檔案。

### 階段 5：備份、還原、Vacuum 與驗證

備份仍維持為單一封存檔案：

- 為每個全域與代理程式資料庫建立檢查點。
- 使用 SQLite 備份語意或 `VACUUM INTO` 建立各資料庫快照。
- 封存精簡的資料庫快照、設定、外部認證資訊，以及要求的
  工作區匯出。
- 省略原始即時 `*.sqlite-wal` 與 `*.sqlite-shm` 檔案。
- 開啟每個資料庫快照並執行 `PRAGMA integrity_check` 以進行驗證。
  `openclaw backup create` 預設會執行此封存驗證；
  `--no-verify` 只會略過寫入後的封存檢查，不會略過快照
  建立完整性檢查。
- 還原會將快照複製回其目標路徑。還原後的全域資料庫使用
  版本 `1`；還原後的每代理程式資料庫使用版本 `2`，版本 `1` 的快照
  會在開啟時以不可分割方式升級。

### 階段 6：工作程式執行階段

在資料庫拆分落地期間，讓工作程式模式維持實驗性：

- 工作程式會收到代理程式 ID、執行 ID、檔案系統模式與資料庫登錄識別資訊。
- 每個工作程式都會開啟自己的 SQLite 連線。
- 父項保留通道傳遞、核准、設定與取消權限。
- 先從每個作用中執行使用一個工作程式開始；僅在生命週期與資料庫
  連線擁有權穩定後才加入集區。

### 階段 7：刪除舊世界

執行階段工作階段管理已完成。舊世界僅允許作為明確的
doctor 輸入或支援／匯出輸出：

- 執行階段不會寫入 `sessions.json`、逐字記錄 JSONL、沙箱登錄 JSON、任務
  側載 SQLite，或外掛狀態側載 SQLite。
- 不進行 JSON／工作階段檔案修剪、檔案逐字記錄截斷、工作階段檔案鎖定，
  或鎖定形狀的工作階段測試。
- 不保留用途為維持舊工作階段檔案最新狀態的執行階段相容性匯出。
- 明確的支援匯出仍是由使用者要求的封存／具現化
  格式，且不得將檔名回饋至執行階段識別資訊。

## 備份與還原

備份應為單一封存檔案，但資料庫擷取應以
SQLite 原生方式進行：

1. 停止長時間執行的寫入活動，或進入短暫的備份屏障。
2. 為每個全域與代理程式資料庫執行檢查點。
3. 使用 `VACUUM INTO` 將資料庫快照建立至暫存備份目錄。
   需要擁有者定義之 SQLite 功能的外掛結構描述會採取封閉失敗，
   直到擁有者提供安全的快照合約。
4. 封存資料庫快照、設定檔、認證資訊目錄、選取的
   工作區與資訊清單。
5. 驗證每個 SQLite 快照的檔案形狀，接著開啟標準 OpenClaw
   資料庫，並執行 `PRAGMA integrity_check` 與角色驗證。專用
   外掛結構描述會維持不透明，除非其擁有者提供驗證器。
   `openclaw backup create` 預設會執行此作業；`--no-verify` 僅供
   刻意略過寫入後封存檢查時使用。

請勿依賴原始即時 `*.sqlite`、`*.sqlite-wal` 與 `*.sqlite-shm` 副本作為
主要備份格式。封存資訊清單應記錄資料庫角色、
代理程式 ID、結構描述版本、來源路徑、快照路徑、位元組大小與完整性
狀態。

還原應從封存快照重建全域資料庫與代理程式資料庫檔案。
全域結構描述維持版本 `1`；每代理程式版本 `1`
快照會接受有界限的執行階段升級至版本 `2`。doctor 仍是
檔案轉資料庫匯入的唯一擁有者。還原命令會先驗證
封存檔案，接著使用已驗證的解壓縮承載資料取代每個資訊清單資產。

## 執行階段重構計畫

1. 新增資料庫登錄 API。
   - 解析全域資料庫與每代理程式資料庫路徑。
   - 將全域結構描述維持在 `user_version = 1`。每代理程式資料庫使用版本 `2`，
     並從已發布版本 `1` 的記憶體來源形狀進行一次不可分割的遷移。
   - 新增供測試、備份與 doctor 使用的關閉／檢查點／完整性輔助函式。

2. 整併側載 SQLite 儲存區。
   - 將外掛狀態資料表移至全域資料庫。執行階段
     寫入已完成；未發布的舊版側載匯入器已刪除。
   - 將任務登錄資料表移至全域資料庫。執行階段
     寫入已完成；未發布的舊版側載匯入器已刪除。
   - 將 Task Flow 資料表移至全域資料庫。執行階段寫入已完成；
     未發布的舊版側載匯入器已刪除。
   - 將內建記憶搜尋資料表移至每個代理程式資料庫。已完成；明確的自訂
     `memorySearch.store.path` 現在會由 doctor 設定遷移移除。
     完整重新建立索引僅會對記憶體資料表原地執行；舊的整體檔案
     交換路徑與側載索引交換輔助函式已刪除。
   - 從這些子系統中刪除重複的資料庫開啟器、WAL 設定、權限輔助函式與
     關閉路徑。

3. 將代理程式擁有的資料表移至每代理程式資料庫。
   - 透過全域資料庫登錄依需求建立代理程式資料庫。已完成。
   - 將執行階段工作階段項目、逐字記錄事件、VFS 資料列與工具
     成品移至代理程式資料庫。已完成。
   - 不要遷移分支本機的共用資料庫工作階段項目、逐字記錄事件、
     VFS 資料列或工具成品；該配置從未發布。僅在 doctor 中保留舊版
     檔案轉資料庫匯入。

4. 取代工作階段儲存區 API。
   - 移除作為執行階段識別資訊的 `storePath`。執行階段部分已完成，並由
     `check:database-first-legacy-stores` 防護：工作階段中繼資料、路由更新、
     命令持久化、命令列介面工作階段清理、Feishu 推理預覽、
     逐字記錄狀態持久化、子代理程式深度、驗證設定檔工作階段
     覆寫、父項分叉邏輯，以及 QA 實驗室檢查，現在都會從
     標準代理程式／工作階段金鑰解析資料庫。
     閘道／終端介面／UI／macOS 工作階段清單回應現在會公開 `databasePath`，
     而非舊版 `path`；macOS 偵錯介面會將每代理程式資料庫顯示
     為唯讀狀態，而非寫入 `session.store` 設定。
     `/status`、聊天驅動的軌跡匯出，以及命令列介面相依性代理不再
     傳播舊版儲存區路徑；逐字記錄使用量備援會依代理程式／工作階段識別資訊
     讀取 SQLite。執行階段與橋接測試不再公開
     `storePath`；doctor／遷移輸入負責該舊版欄位名稱。
     閘道合併工作階段載入不再針對
     非範本化 `session.store` 值提供特殊的執行階段分支；它會彙總每代理程式 SQLite 資料列。
     舊版工作階段鎖定 doctor 通道及其 `.jsonl.lock` 清理輔助函式
     已移除；SQLite 現在是工作階段並行處理的邊界。
     熱點執行階段呼叫位置會使用以資料列為導向的輔助函式名稱，例如
     `resolveSessionRowEntry`；舊的 `resolveSessionStoreEntry` 相容性
     別名已從執行階段與外掛 SDK 匯出中移除。

- 使用 `{ agentId, sessionKey }` 資料列操作。
  已完成：`getSessionEntry`、`upsertSessionEntry`、`deleteSessionEntry`、
  `patchSessionEntry` 與 `listSessionEntries` 是 SQLite 優先的 API，
  不需要工作階段儲存區路徑。狀態摘要、本機代理程式狀態、健康狀態，
  以及 `openclaw sessions` 清單命令現在會直接讀取每代理程式資料列，
  並顯示每代理程式 SQLite 資料庫路徑，而非 `sessions.json` 路徑。
- 以 `upsertSessionEntry`、
  `deleteSessionEntry`、`listSessionEntries` 與 SQL 清理查詢取代整體儲存區刪除／插入。
  執行階段部分已完成：熱點路徑現在會使用資料列 API 與具衝突重試的資料列修補；
  剩餘的整體儲存區匯入／取代輔助函式僅限用於遷移匯入
  程式碼與 SQLite 後端測試。
  - 刪除 `store-writer.ts` 與寫入器佇列測試。已完成。
  - 從工作階段資料列新增或更新／修補中刪除執行階段舊版金鑰修剪與別名刪除參數。
    已完成。

5. 刪除執行階段 JSON 登錄行為。
   - 讓沙箱登錄的讀寫僅使用 SQLite。已完成。
   - 僅從遷移步驟匯入單體式與分片 JSON。已完成。
   - 移除分片登錄鎖定與 JSON 寫入。已完成。

- 如果其形態仍是熱路徑操作狀態，請保留單一具型別的登錄資料表，而不是將登錄資料列儲存為通用的
  不透明 JSON。已完成。

6. 刪除檔案鎖定形態的工作階段變更。
   - 執行階段鎖定建立與執行階段鎖定 API 已完成。
   - 已移除獨立的舊版 `.jsonl.lock` doctor 清理管道。
   - `session.writeLock` 是由 doctor 遷移的舊版設定，不是具型別的執行階段
     設定。
   - 狀態完整性不再有獨立的孤立轉錄檔案修剪
     路徑；doctor 遷移會在單一位置匯入／移除舊版 JSONL 來源。
   - 閘道單例協調會在 `gateway_locks` 下使用具型別的 SQLite `state_leases` 資料列，
     且不再公開檔案鎖定目錄接縫。
   - 通用外掛 SDK 的去重持久化不再使用檔案鎖定或 JSON
     檔案；它會寫入共用的 SQLite 外掛狀態資料列。已完成。
   - QMD 嵌入協調使用 SQLite 狀態租約，而不是
     `qmd/embed.lock`。已完成。

7. 讓工作程序具備資料庫感知能力。
   - 工作程序各自開啟自己的 SQLite 連線。
   - 父程序擁有遞送、頻道回呼與設定。
   - 工作程序接收代理程式 ID、執行 ID、檔案系統模式及資料庫登錄
     身分，而不是即時控制代碼。
   - `vfs-only` 維持實驗性質，並使用代理程式資料庫作為其儲存
     根目錄。
   - 一開始每個作用中執行保留一個工作程序。等資料庫連線
     生命週期和取消行為變得穩定無趣後，再考慮集區化。

8. 備份整合。
   - 讓備份使用 `VACUUM INTO` 建立全域、代理程式及外掛資料庫的快照。狀態資產下已探索到的 `*.sqlite` 檔案已完成；
     需要無法取得之擁有者能力的外掛結構描述會以關閉方式失敗。
   - 新增標準 SQLite 完整性與結構描述身分的備份驗證，
     並針對專用外掛快照新增通用檔案形態驗證。備份建立與預設封存驗證已完成。
   - 在 SQLite 中記錄備份執行中繼資料。已透過共用的 `backup_runs`
     資料表完成，其中包含封存路徑、狀態與資訊清單 JSON。
   - 新增從已驗證封存快照還原的功能。已完成：`openclaw backup
restore` 會在解壓縮前驗證、使用驗證器正規化後的
     資訊清單、支援 `--dry-run`，並要求提供 `--yes`，才會取代
     已記錄的來源路徑。
   - 僅在要求時包含 VFS／工作區匯出；不要將工作階段
     內部資料匯出為 JSON 或 JSONL。

9. 刪除過時的測試與程式碼。已完成已知的執行階段工作階段介面。

- 移除斷言執行階段會建立 `sessions.json` 或轉錄
  JSONL 檔案的測試。核心工作階段儲存區、聊天、閘道轉錄事件、
  預覽、生命週期、命令工作階段項目更新、自動回覆重設／追蹤，以及
  memory-core 夢境整理固定裝置、核准目標路由、工作階段轉錄
  修復、安全性權限修復、軌跡匯出與工作階段匯出均已完成。
  主動記憶轉錄測試現在會斷言 SQLite 範圍，且不會建立暫存或
  持久化的 JSONL 檔案。
  舊的心跳偵測轉錄修剪迴歸測試已移除，因為
  執行階段不再截短 JSONL 轉錄。
  代理程式工作階段清單工具測試不再將舊版 `sessions.json` 路徑
  模擬為閘道回應形態；應用程式／UI／macOS 測試使用 `databasePath`。
  `/status` 轉錄使用情況測試現在會直接植入 SQLite 轉錄資料列，
  而不是寫入 JSONL 檔案。
  閘道工作階段生命週期測試現在會直接使用 SQLite 轉錄植入輔助程式；
  舊的單行工作階段檔案固定裝置形態已從重設與刪除涵蓋範圍中移除。
  `sessions.delete` 不再傳回檔案時代的 `archived: []` 欄位；刪除
  僅回報資料列變更結果。舊的 `deleteTranscript` 選項也已
  移除：刪除工作階段會移除標準 `sessions` 根目錄，並讓
  SQLite 串聯刪除工作階段所擁有的轉錄、快照及軌跡資料列，因此沒有
  呼叫端能留下轉錄孤立項目或遺漏清理分支。
  內容引擎軌跡擷取測試現在會從隔離的代理程式資料庫讀取 `trajectory_runtime_events`
  資料列，而不是讀取
  `session.trajectory.jsonl`。
  Docker MCP 頻道植入指令碼現在會直接植入 SQLite 資料列。直接
  寫入 `sessions.json` 僅限於 doctor 固定裝置。
  Tool Search Gateway 端對端測試會從 SQLite 轉錄資料列讀取工具呼叫證據，
  而不是掃描 `agents/<agentId>/sessions/*.jsonl` 檔案。
  Memory-core 主機事件與工作階段語料庫暫存資料列現在存放於共用的
  SQLite 外掛狀態中；`events.jsonl` 與 `session-corpus/*.txt` 僅為舊版
  doctor 遷移輸入。作用中資料列使用 `memory/session-ingestion/`
  虛擬路徑，而不是 `.dreams/session-corpus`。舊的 memory-core 夢境整理
  修復模組及其命令列介面／閘道測試已移除，因為執行階段不再
  負責該語料庫的檔案封存修復。Memory-core
  橋接／公開成品測試不再顯示 `.dreams/events.jsonl`；它們
  使用 SQLite 支援的虛擬 JSON 成品名稱。
  公開 SDK／Codex 測試文件現在會說 SQLite 工作階段狀態，而不是工作階段
  檔案；頻道回合範例也不再公開 `storePath` 引數。
  Matrix 同步狀態現在直接使用 SQLite 外掛狀態儲存區。作用中的
  用戶端／執行階段合約會傳遞帳戶儲存根目錄，而不是 `bot-storage.json`
  路徑；doctor 會先將舊版 `bot-storage.json` 匯入 SQLite，再刪除
  來源。QA Matrix 重新啟動／破壞性情境現在會直接變更 SQLite 同步
  資料列，而不是建立或刪除假的 `bot-storage.json` 檔案；且
  E2EE 基礎層會傳遞同步儲存區根目錄，而不是假的
  `sync-store.json` 路徑。
  Matrix 儲存根目錄選擇不再依舊版同步／執行緒 JSON
  檔案為根目錄評分；它會使用耐久根目錄中繼資料與實際加密狀態。
  執行階段 SQLite 工作階段後端測試套件不再虛構
  `sessions.json`；舊版來源固定裝置現在存放於會匯入它們的 doctor
  測試中。
  閘道工作階段測試不再公開 `createSessionStoreDir` 輔助程式或
  未使用的暫存工作階段儲存區路徑設定；固定裝置目錄皆為明確指定，而直接
  資料列設定會使用 SQLite 工作階段資料列命名。
  僅供 doctor 使用的 JSON5 工作階段儲存區剖析器涵蓋範圍已從基礎架構測試移至
  doctor 遷移測試，因此執行階段測試套件不再負責舊版
  工作階段檔案剖析。
  Microsoft Teams 執行階段 SSO／待上傳測試不再攜帶 JSON 附屬
  固定裝置或剖析器；舊版 SSO 權杖剖析僅存在於外掛
  遷移模組中。Telegram 測試不再植入假的 `/tmp/*.json` 儲存區
  路徑；它們會直接重設 SQLite 支援的訊息快取。通用
  OpenClaw 測試狀態輔助程式不再公開舊版 `auth-profiles.json`
  寫入器；doctor 驗證遷移測試會在本機擁有該固定裝置。
  終端介面最後工作階段指標、執行核准、主動記憶
  切換、Matrix 去重／啟動驗證、Memory Wiki 來源同步、
  目前對話繫結、上線驗證及 Hermes 密鑰匯入的執行階段測試，不再
  製造舊的附屬檔案，也不再斷言舊檔名不存在。它們會
  透過 SQLite 資料列與公開儲存區 API 證明行為；只有 doctor／遷移
  測試應使用舊版來源檔名。
  裝置／節點配對、頻道 allowFrom、重新啟動意圖、
  重新啟動交接、工作階段遞送佇列項目、設定健全狀況、iMessage
  快取、排程工作、PI 轉錄標頭、子代理程式登錄及受管理
  圖片附件的執行階段測試，也不再為了證明已退役的 JSON／JSONL 檔案
  會被忽略或不存在而建立這些檔案。
  PI 溢位復原不再有 SessionManager 重寫／截短
  後援：工具結果截短與內容引擎轉錄重寫會變更
  SQLite 轉錄資料列，然後從資料庫重新整理作用中的提示狀態。
  持久化的 SessionManager 訊息附加會委派給不可部分完成的 SQLite
  轉錄附加輔助程式，以處理父項選取與等冪性。一般
  中繼資料／自訂項目附加也會在 SQLite 內選取目前父項，因此
  過時的管理員執行個體不會讓 SQLite 前的父鏈競爭重新出現。
  用於回合中途預檢與 `sessions_yield` 的合成 PI 尾端清理現在會
  直接修剪 SQLite 轉錄狀態；舊的 SessionManager 尾端移除
  橋接及其測試均已刪除。
  壓縮檢查點擷取也僅從 SQLite 建立快照；呼叫端不再
  傳遞即時 SessionManager 作為替代轉錄來源。
- 僅保留為遷移植入舊版檔案的測試。
- 作用中執行階段介面的 JSON 檔案證明已改為 SQL 資料列證明。

- 新增執行階段寫入舊版工作階段／快取 JSON 路徑的靜態禁令。
  儲存庫防護已完成。

10. 讓遷移報告可稽核。
    - 在 SQLite 中記錄遷移執行，包括開始／完成時間戳記、來源
      路徑、來源雜湊、計數、警告與備份路徑。
      已完成：舊版狀態遷移執行現在會持久化一份 `migration_runs`
      報告，其中包含來源路徑／資料表清單、來源檔案 SHA-256、大小、
      記錄計數、警告及備份路徑。
      已完成：舊版狀態遷移執行也會持久化 `migration_sources`
      資料列，以供來源層級稽核及未來的略過／回填決策使用。
    - 讓套用具備等冪性。在部分匯入後重新執行時，應略過
      已匯入的來源，或依穩定鍵合併。
      已完成：工作階段索引、轉錄、遞送佇列、外掛狀態、工作
      帳本及代理程式擁有的全域 SQLite 資料列，會透過穩定鍵或
      upsert／取代語意匯入，因此重新執行會合併而不重複耐久
      資料列。
    - 匯入失敗時，必須將原始來源檔案保留在原位。
      已完成：轉錄匯入失敗時，現在會將原始 JSONL 來源留在
      偵測到的路徑，而 `migration_sources` 會將來源記錄為
      `warning`，並附上 `removed_source=0`，供下一次 doctor 執行使用。

## 效能規則

- 每個執行緒／程序使用一個連線即可；不要跨工作程序共用
  控制代碼。
- 使用 WAL、`foreign_keys=ON`、5 秒忙碌逾時，以及短暫的 `BEGIN IMMEDIATE`
  寫入交易。不要在 SQLite 的單次忙碌等待之上疊加同步鎖定重試。
- 除非／直到非同步交易 API 新增明確的互斥鎖／背壓語意，否則
  寫入交易輔助程式應保持同步。
- 讓父程序遞送寫入維持小型且具交易性。
- 避免重寫整個儲存區；使用資料列層級的 upsert／刪除。
- 在移動熱路徑程式碼前，為依代理程式列出、依工作階段列出、更新時間、執行 ID 及
  到期路徑新增索引。
- 將大型成品、媒體及向量儲存為 BLOB 或分塊 BLOB 資料列，而不是
  base64 或數值陣列 JSON。
- 讓不透明的外掛狀態項目維持小型且限定範圍。
- 新增用於 TTL／到期的 SQL 清理，而不是檔案系統修剪。
  資料庫擁有的執行階段儲存區已完成：媒體、外掛狀態、外掛 BLOB、
  持久化去重及代理程式快取皆透過 SQLite 資料列到期。剩餘的
  檔案系統清理僅限於暫時具現化或明確的移除命令。

## 靜態禁令

新增儲存庫檢查，使針對舊版狀態路徑的新執行階段寫入失敗：

- `sessions.json`
- `*.trajectory.jsonl`，但已具體化的支援套件輸出除外
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` 執行階段快取檔案
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` 與 `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json` / `devices/paired.json` / `devices/bootstrap.json`
  （已於 2026.7 淘汰：執行階段儲存區為共用狀態資料庫中的 `device_pairing_*` /
  `device_bootstrap_tokens`；配對記錄會在
  閘道啟動時匯入，暫時性的待處理／啟動程序資料列則會遭到捨棄）
- `nodes/pending.json` / `nodes/paired.json`（已於 2026.7 淘汰：在閘道啟動時合併至配對裝置記錄）
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- 記憶核心 `.dreams/events.jsonl`
- 記憶核心 `.dreams/session-corpus/`
- 記憶核心 `.dreams/daily-ingestion.json`
- 記憶核心 `.dreams/session-ingestion.json`
- 記憶核心 `.dreams/short-term-recall.json`
- 記憶核心 `.dreams/phase-signals.json`
- 記憶核心 `.dreams/short-term-promotion.lock`
- Skill 工作坊 `skill-workshop/<workspace>.json`
- Skill 工作坊 `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQ Bot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- 沙箱登錄分片 JSON 檔案
- 原生掛鉤轉送 `/tmp` 橋接 JSON 檔案
- `plugin-state/state.sqlite`
- 臨時 `openclaw-state.sqlite` 執行階段附屬檔案
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- 記憶 Wiki `.openclaw-wiki/log.jsonl`
- 記憶 Wiki `.openclaw-wiki/state.json`
- 記憶 Wiki `.openclaw-wiki/locks/`
- 記憶 Wiki `.openclaw-wiki/source-sync.json`
- 記憶 Wiki `.openclaw-wiki/import-runs/*.json`
- 記憶 Wiki `.openclaw-wiki/cache/agent-digest.json`
- 記憶 Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- 瀏覽器設定檔裝飾 `.openclaw-profile-decorated`
- `SessionManager.open(...)` 檔案支援的工作階段開啟器
- `SessionManager.listAll(...)` 與 `TranscriptSessionManager.listAll(...)`
  逐字記錄清單介面
- `SessionManager.forkFromSession(...)` 與
  `TranscriptSessionManager.forkFromSession(...)` 逐字記錄分叉介面
- `SessionManager.newSession(...)` 與 `TranscriptSessionManager.newSession(...)`
  可變工作階段替換介面
- `SessionManager.createBranchedSession(...)` 與
  `TranscriptSessionManager.createBranchedSession(...)` 分支工作階段介面

此禁令應允許測試建立舊版固定資料，並允許遷移程式碼
讀取／匯入／移除舊版檔案來源。尚未發布的 SQLite 附屬檔案仍維持禁用，
也不會獲得 doctor 匯入許可。

## 完成條件

- 執行階段資料與快取會寫入全域或代理程式 SQLite 資料庫。
- 執行階段不再寫入工作階段索引、逐字記錄 JSONL、沙箱登錄
  JSON、任務附屬 SQLite 或外掛狀態附屬 SQLite。尚未發布的任務
  與外掛狀態附屬 SQLite 匯入器會遭到刪除。
- 舊版檔案匯入僅限 doctor 執行。
- 備份會產生單一封存檔，其中包含精簡的 SQLite 快照與完整性證明。
- 代理程式工作執行緒可搭配磁碟、VFS 暫存區或實驗性的純 VFS
  儲存空間執行。
- 設定與明確的認證資訊檔案仍是唯一預期持續存在的
  非資料庫控制檔案。
- 儲存庫檢查可防止重新引入舊版執行階段檔案儲存區。
