---
read_when:
    - 將 OpenClaw 執行階段資料、快取、文字記錄、任務狀態或暫存檔案移入 SQLite
    - 設計從舊版 JSON 或 JSONL 檔案進行的 doctor 遷移
    - 變更備份、還原、VFS 或 worker 儲存行為
    - 移除工作階段鎖定、修剪、截斷或 JSON 相容性路徑
summary: 將 SQLite 作為主要持久狀態與快取層，同時保留設定檔後端的遷移計畫
title: 資料庫優先的狀態重構
x-i18n:
    generated_at: "2026-06-27T19:59:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# 資料庫優先狀態重構

## 決策

使用兩層 SQLite 配置：

- 全域資料庫：`~/.openclaw/state/openclaw.sqlite`
- 代理程式資料庫：每個代理程式各有一個 SQLite 資料庫，用於代理程式擁有的工作區、
  transcript、VFS、artifact，以及大型的每代理程式 runtime 狀態
- 設定維持以檔案作為後端：`openclaw.json` 仍位於
  資料庫之外。Runtime auth profiles 移至 SQLite；外部 provider 或命令列介面
  credential files 仍由 owner 管理，位於 OpenClaw 的資料庫之外。

全域資料庫是控制平面資料庫。它擁有 agent discovery、
shared 閘道 state、pairing、device/節點 state、task 與 flow ledgers、外掛
state、scheduler runtime state、backup metadata，以及 migration state。

代理程式資料庫是資料平面資料庫。它擁有代理程式的 session
metadata、transcript event stream、VFS workspace 或 scratch namespace、tool
artifacts、run artifacts，以及可搜尋/可索引的 agent-local cache data。

這提供一個持久的全域視圖，同時不強迫大型代理程式工作區、
transcripts 和 binary scratch data 進入 shared 閘道 write lane。

## 硬性契約

此遷移只有一個 canonical runtime shape：

- Session rows 只持久化 session metadata。它們不得持久化
  `transcriptLocator`、transcript file paths、sibling JSONL paths、lock paths、
  pruning metadata，或 file-era compatibility pointers。
- Transcript identity 永遠是 SQLite identity：`{agentId, sessionId}`，再加上
  protocol 需要時的 optional topic metadata。
- `sqlite-transcript://...` 不是 runtime 或 protocol identity。新程式碼不得
  derive、persist、pass、parse 或 migrate transcript locators。Runtime 和
  tests 不應包含 pseudo-locators；docs 只能提及此字串以禁止它。
- Legacy `sessions.json`、transcript JSONL、`.jsonl.lock`、pruning、truncation，
  以及舊的 session-path logic 只屬於 doctor migration/import path。
- Legacy session config aliases 只屬於 doctor migration。Runtime 不會
  解讀 `session.idleMinutes`、`session.resetByType.dm`，或針對另一個 configured agent 的
  cross-agent `agent:main:*` main-session aliases。
- Session routing identity 是 typed relational state。Hot runtime 和 UI paths
  應讀取 `sessions.session_scope`、`sessions.account_id`、
  `sessions.primary_conversation_id`、`conversations` 和
  `session_conversations`；它們不得 parse `session_key`，也不得從
  `session_entries.entry_json` 挖掘 provider identity，除非是在刪除舊 call sites
  期間作為 compatibility shadow。
- Channel-level direct-message markers，例如 `dm` 與 `direct`，是 routing
  vocabulary，不是 transcript locators 或 file-store compatibility handles。
- Legacy hook handler config 只屬於 doctor warning/migration surfaces。
  Runtime 不得載入 `hooks.internal.handlers`；hooks 只透過 discovered
  hook directories 和 `HOOK.md` metadata 執行。
- Runtime startup、hot reply paths、壓縮、reset、recovery、diagnostics、
  TTS、memory hooks、subagents、外掛 command routing、protocol boundaries，以及
  hooks 都必須在 runtime 中傳遞 `{agentId, sessionId}`。
- Tests 應透過 `{agentId, sessionId}` seed 並 assert SQLite transcript rows。
  只證明 JSONL path forwarding、caller-supplied locator preservation，或
  transcript-file compatibility 的 tests 應被刪除，除非它們涵蓋 doctor import、
  non-session support/debug materialization，或 protocol shape。
- `runEmbeddedPiAgent(...)`、prepared worker runs，以及 inner embedded
  attempt 不得接受 transcript locators。它們以 `{agentId, sessionId}` 開啟 SQLite transcript
  manager，並將該 manager 傳給 internalized
  PI-compatible agent session，避免 stale callers 讓 runner 寫入
  JSON/JSONL transcripts。
- Runner diagnostics 必須將 runtime/cache/payload trace records 儲存在 SQLite。
  Runtime diagnostics 不得暴露 JSONL file override knobs 或 generic
  transcript JSONL export helpers；user-facing exports 可以從 database rows
  materialize explicit artifacts，而不把 file names 回灌到 runtime。
- Raw stream logging 使用 `OPENCLAW_RAW_STREAM=1` 加上 SQLite diagnostics rows。
  舊 pi-mono 的 `PI_RAW_STREAM`、`PI_RAW_STREAM_PATH` 和
  `raw-openai-completions.jsonl` file logger contract 不屬於 OpenClaw
  runtime 或 tests。
- QMD memory indexing 不得將 SQLite transcripts export 成 markdown files。
  QMD 只索引 configured memory files；session transcript search 維持以
  SQLite 作為後端。
- QMD SDK subpath 對新程式碼僅限 QMD 使用。SQLite session transcript
  indexing helpers 位於 `memory-core-host-engine-session-transcripts`；任何
  QMD re-export 只屬 compatibility，不得由 runtime code 使用。
- 內建 memory indexes 位於 owning agent database。Runtime config 和
  resolved runtime contracts 不得暴露 `memorySearch.store.path`；doctor
  會刪除該 legacy config key，而目前程式碼會在內部傳遞代理程式的
  `databasePath`。

實作工作應持續刪除程式碼，直到這些陳述在 doctor/import/export/debug
boundaries 之外皆無例外地成立。

## 目標狀態與進度

### 硬性目標

- 一個全域 SQLite 資料庫擁有控制平面狀態：
  `state/openclaw.sqlite`。
- 一個每代理程式 SQLite 資料庫擁有資料平面狀態：
  `agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定維持以檔案作為後端。`openclaw.json` 不屬於此資料庫
  重構。
- Legacy files 只作為 doctor migration inputs。
- Runtime 永不將 session 或 transcript JSONL 作為 active state 寫入或讀取。

### 目標狀態

- `not-started`：file-era runtime code 仍在寫入 active state。
- `migrating`：doctor/import code 可以將 file data 移入 SQLite。
- `dual-read`：temporary bridge 會同時讀取 SQLite 和 legacy files。此狀態
  在此重構中被禁止，除非明確記錄為
  doctor-only。
- `sqlite-runtime`：runtime 只讀寫 SQLite。
- `clean`：legacy runtime APIs 和 tests 已移除，且 guard 防止
  regressions。
- `done`：docs、tests、backup、doctor migration，以及 changed checks 證明
  clean state。

### 目前狀態

- Sessions：runtime 為 `clean`。Session rows 位於 per-agent database，
  runtime APIs 使用 `{agentId, sessionId}` 或 `{agentId, sessionKey}`，且
  `sessions.json` 是 doctor-only legacy input。
- Transcripts：runtime 為 `clean`。Transcript events、identities、snapshots，
  以及 trajectory runtime events 位於 per-agent database。Runtime 不再
  接受 transcript locators 或 JSONL transcript paths。
- PI embedded runner：`clean`。Embedded PI runs、prepared workers、壓縮，
  以及 retry loops 使用 SQLite session scope，並拒絕 stale transcript handles。
- 排程：runtime 為 `clean`。Runtime 使用 `cron_jobs` 和 `cron_run_logs`；
  runtime tests 使用 SQLite `storeKey` 命名，file-era cron paths 只保留在
  doctor legacy migration tests。
- Task registry：`clean`。Task 和任務流程 runtime rows 位於
  `state/openclaw.sqlite`；未發布的 sidecar SQLite importers 已刪除。
- 外掛 state：`clean`。外掛 state/blob rows 位於 shared global
  database；舊的 plugin-state sidecar SQLite helpers 已被 guard。
- Memory：內建 memory 和 session transcript indexing 為 `sqlite-runtime`。
  Memory index tables 位於 per-agent database，外掛 memory state 使用
  shared plugin-state rows，legacy memory files 則是 doctor migration inputs
  或 user workspace content。
- Backup：`sqlite-runtime`。Backup stages compact SQLite snapshots，省略 live
  WAL/SHM sidecars，驗證 SQLite integrity，並在
  global database 中記錄 backup runs。
- Doctor migration：`migrating`，刻意如此。Doctor 會 import legacy JSON、
  JSONL 和 retired sidecar stores 到 SQLite，記錄 migration runs/sources，
  並移除 successful sources。
- E2E scripts：runtime coverage 為 `clean`。Docker MCP seeding 會寫入 SQLite
  rows。runtime-context Docker script 只在 doctor migration seed 內建立 legacy JSONL，
  並明確命名 legacy session index path。

### 剩餘工作

- [x] 重新命名 cron runtime-test store variables，避免使用 `storePath`，除非
      它們是 doctor legacy inputs。
      檔案：`src/cron/service.test-harness.ts`、
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`、
      `src/cron/service/timer.regression.test.ts`、
      `src/cron/service/ops.test.ts`、`src/cron/service/store.test.ts`、
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`、
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`、
      `src/cron/store.test.ts`。
      證明：`pnpm check:database-first-legacy-stores`；`rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`。
- [x] 移除或重新命名 obsolete file-era export test mocks。
      檔案：`src/auto-reply/reply/commands-export-test-mocks.ts`。
      證明：`rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`。
- [x] 讓 Docker runtime-context legacy JSONL seed 明顯成為 doctor-only。
      檔案：`scripts/e2e/session-runtime-context-docker-client.ts`。
      證明：`rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` 只顯示
      `seedBrokenLegacySessionForDoctorMigration`。
- [x] 在任何 schema change 後保持 Kysely generated types 對齊。
      檔案：`src/state/openclaw-state-schema.sql`、
      `src/state/openclaw-agent-schema.sql`、
      `src/state/*generated*`。
      證明：本次沒有 schema change；`pnpm db:kysely:check`；
      `pnpm lint:kysely`。
- [x] 重新執行 touched stores、commands 和 scripts 的 focused tests。
      證明：`pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`；`git diff --check`。
- [x] 在宣告 `done` 前，執行 changed gate 或 remote broad proof。
      證明：`pnpm check:changed --timed -- <changed extension paths>` 在
      Hetzner Crabbox run `run_3f1cabf6b25c` 通過，期間包含臨時 Node 24/pnpm setup，以及
      針對 synced no-`.git` workspace 的 explicit path routing。

### 不要回歸

- 沒有 transcript locators。
- 沒有 active session files。
- 沒有假的 JSONL test fixtures，doctor legacy migration tests 除外。
- 在預期使用 Kysely 的地方不得有 raw SQLite access。
- 不新增 legacy DB migrations。此 layout 尚未發布；除非有強烈理由，
  schema version 維持在 `1`。

## 程式碼閱讀假設

沒有後續 product decisions 會阻擋此計畫。實作應在以下假設下
進行：

- 直接使用 `node:sqlite`，並要求此儲存路徑使用 Node 22+ 執行階段。
- 只保留一個一般設定檔。不要在此重構中將設定、外掛
  manifest 或 Git 工作區移入 SQLite。
- 不需要執行階段相容性檔案。舊版 JSON 與 JSONL 檔案僅作為
  遷移輸入。分支本機的 SQLite sidecar 從未出貨，會直接刪除而非匯入。
- `openclaw doctor --fix` 負責舊版檔案到資料庫的遷移步驟。
  執行階段啟動與 `openclaw migrate` 不應承載舊版 OpenClaw
  資料庫升級路徑。
- 憑證相容性遵循相同規則：執行階段憑證存放於
  SQLite。舊的 `auth-profiles.json`、每個 agent 的 `auth.json`，以及共用的
  `credentials/oauth.json` 檔案都是 doctor 遷移輸入，匯入後移除。
- 產生的模型目錄狀態以資料庫支援。執行階段程式碼不得寫入
  `agents/<agentId>/agent/models.json`；現有 `models.json` 檔案是舊版
  doctor 輸入，匯入 `agent_model_catalogs` 後移除。
- 執行階段不得遷移、正規化或橋接 transcript locator。作用中的
  transcript 身分是 SQLite 中的 `{agentId, sessionId}`。檔案路徑僅是
  舊版 doctor 輸入，且 `sqlite-transcript://...` 必須從執行階段、protocol、hook
  與外掛介面消失，而不是被視為邊界 handle。
- 執行階段 SQLite transcript 讀取不會執行舊 JSONL entry-shape 遷移，也不會
  為相容性重寫整份 transcript。舊版 entry 正規化保留在明確的 doctor/import
  工具中。Doctor 會在插入 SQLite 列之前正規化舊版 JSONL transcript
  檔案；目前的執行階段列已經以目前的 transcript schema 寫入。
  trajectory/session 匯出會原樣讀取這些列，且不得在匯出時執行舊版遷移。
- 舊版 transcript JSONL 解析/遷移 helper 僅供 doctor 使用。執行階段
  transcript 格式程式碼只建構目前的 SQLite transcript context；doctor
  會在插入列之前負責舊 JSONL entry 升級。
- 舊的執行階段擁有的 JSONL transcript streaming helper 已刪除。Doctor
  匯入程式碼負責明確的舊版檔案讀取；執行階段 session history 讀取
  SQLite 列。
- Codex app-server bindings 在 Codex plugin-state namespace 中使用 OpenClaw
  `sessionId` 作為標準 key。`sessionKey` 是 routing/display 的 metadata，
  不得取代 durable session id 或復活 transcript-file identity。
- Context engine 會直接接收目前的執行階段 contract。Registry
  不得用 retry shim 包裝 engine 並刪除 `sessionKey`、
  `transcriptScope` 或 `prompt`；無法接受目前 database-first params 的 engine
  應明確失敗，而不是被橋接。
- 備份輸出應維持為單一封存檔。資料庫內容應以精簡的 SQLite snapshot
  進入該封存，而不是 raw live WAL sidecar。
- Transcript search 很有用，但不是第一版 database-first 切換的必要項目。
  設計 schema 時應讓 FTS 可在之後加入。
- Worker execution 應在資料庫邊界穩定前，透過 settings 保持實驗性。

## 程式碼閱讀發現

目前分支已經超過 proof-of-concept 階段。共用
資料庫已存在，Node `node:sqlite` 已透過小型執行階段 helper 接上，而
過去的 store 現在會寫入 `state/openclaw.sqlite` 或擁有者的
`openclaw-agent.sqlite` 資料庫。

剩餘工作不是選擇 SQLite；而是保持新邊界乾淨，
並刪除任何仍看起來像舊檔案世界的相容性形狀介面：

- Session `storePath` 不再是執行階段身分、測試 fixture shape，或
  狀態 payload 欄位。執行階段與 bridge 測試不再包含
  `storePath` contract name；doctor/migration 程式碼負責該舊版詞彙。
- Session 寫入不再經過舊的 in-process `store-writer.ts`
  queue。SQLite patch 寫入改用衝突偵測與 bounded retry。
- 舊版路徑 discovery 仍有有效的遷移用途，但執行階段程式碼應
  停止將 `sessions.json` 與 transcript JSONL 檔案視為可能的寫入
  目標。
- Agent 擁有的 table 位於每個 agent 的 SQLite 資料庫。Global DB 保留
  registry/control-plane 列；transcript 身分是每個 agent transcript 列中的
  `{agentId, sessionId}`。執行階段程式碼不得保存 transcript 檔案路徑或遷移
  transcript locator。
- Doctor 已經匯入數個舊版檔案。清理工作是將它變成 doctor 呼叫的
  單一明確遷移實作，並提供持久的遷移報告。

沒有額外產品問題阻礙實作。

## 目前程式碼形狀

此分支已經有真正的共用 SQLite 基礎：

- 執行階段最低版本現在是節點 22+：`package.json`、命令列介面執行階段防護、安裝程式預設值、macOS 執行階段定位器、CI，以及公開安裝文件都已一致。舊的節點 22 相容性路線已移除。
- `src/state/openclaw-state-db.ts` 會開啟 `openclaw.sqlite`、設定 WAL、`synchronous=NORMAL`、`busy_timeout=30000`、`foreign_keys=ON`，並套用由 `src/state/openclaw-state-schema.sql` 衍生的產生式結構描述模組。
- Kysely 資料表型別與執行階段結構描述模組，都是從以已提交 `.sql` 檔案建立的一次性 SQLite 資料庫產生；執行階段程式碼不再為全域、每代理或 Proxy 擷取資料庫保留複製貼上的結構描述字串。
- 執行階段儲存區會從這些產生式 Kysely `DB` 介面衍生選取與插入的資料列型別，而不是手動影射 SQLite 資料列形狀。原始 SQL 仍限制於結構描述套用、pragma，以及僅限遷移使用的 DDL。
- SQLite 結構描述已收斂為 `user_version = 1`，因為此資料庫配置尚未出貨。執行階段開啟器只會建立目前結構描述；檔案到資料庫匯入仍留在 doctor 程式碼中，而分支本地資料庫升級輔助工具已刪除。
- 在所有權邊界為典範的位置，會強制執行關聯式所有權：來源遷移資料列會從 `migration_runs` 串聯，任務傳遞狀態會從 `task_runs` 串聯，逐字稿身分資料列會從逐字稿事件串聯。
- 目前的共享資料表包含 `agent_databases`、`auth_profile_stores`、`auth_profile_state`、`plugin_state_entries`、`plugin_blob_entries`、`media_blobs`、`skill_uploads`、`capture_sessions`、`capture_events`、`capture_blobs`、`sandbox_registry_entries`、`cron_run_logs`、`cron_jobs`、`commitments`、`delivery_queue_entries`、`model_capability_cache`、`workspace_setup_state`、`native_hook_relay_bridges`、`current_conversation_bindings`、`plugin_binding_approvals`、`tui_last_sessions`、`acp_sessions`、`acp_replay_sessions`、`acp_replay_events`、`task_runs`、`task_delivery_state`、`flow_runs`、`subagent_runs`、`migration_runs` 和 `backup_runs`。
- 任意外掛擁有的狀態不會取得主機擁有的型別化資料表。已安裝外掛會使用 `plugin_state_entries` 儲存版本化 JSON 酬載，並使用 `plugin_blob_entries` 儲存位元組，具備命名空間/鍵所有權、TTL 清理、備份與外掛遷移紀錄。當主機擁有查詢合約時，主機擁有的外掛協調狀態仍可使用型別化資料表，例如 `plugin_binding_approvals`。
- 外掛遷移是在外掛擁有的命名空間上進行的資料遷移，而不是主機結構描述遷移。外掛可以透過遷移提供者遷移自己的版本化狀態/blob 項目，而主機會在一般遷移分類帳中記錄來源/執行狀態。新的外掛安裝不需要變更 `openclaw-state-schema.sql`，除非主機本身要取得新的跨外掛合約所有權。
- `src/state/openclaw-agent-db.ts` 會開啟 `agents/<agentId>/agent/openclaw-agent.sqlite`，在全域資料庫中註冊該資料庫，並擁有代理本地的工作階段、逐字稿、VFS、成品、快取與記憶索引資料表。共享執行階段探索現在會讀取產生式型別化的 `agent_databases` 登錄，而不是在每個呼叫位置重新實作該查詢。
- 全域與每代理資料庫都會記錄一筆 `schema_meta` 資料列，其中包含資料庫角色、結構描述版本、時間戳，以及代理資料庫的代理 ID。配置仍維持在 `user_version = 1`，因為此 SQLite 結構描述尚未出貨。
- 每代理工作階段身分現在有一個典範的 `sessions` 根資料表，以 `session_id` 作為鍵，並將 `session_key`、`session_scope`、`account_id`、`primary_conversation_id`、時間戳、顯示欄位、模型中繼資料、harness ID，以及父項/衍生連結作為可查詢欄位。`session_routes` 是從 `session_key` 到目前 `session_id` 的唯一作用中路由索引，因此路由鍵可以移動到新的持久工作階段，而不會讓熱讀取必須在重複的 `sessions.session_key` 資料列之間選擇。舊的 `session_entries.entry_json` 相容性形狀酬載會透過外鍵掛在持久 `session_id` 根之下；它不再是工作階段唯一的結構描述層級表示。
- 每代理外部對話身分也已關聯化：`conversations` 會儲存正規化的提供者/帳號/對話身分，而 `session_conversations` 會將一個 OpenClaw 工作階段連結到一個或多個外部對話。這涵蓋共享主 DM 工作階段，在該情境中，多個對等方可刻意映射到同一個工作階段，而不必在 `session_key` 中造假。SQLite 也會為自然提供者身分強制唯一性，因此相同的通道/帳號/種類/對等方/討論串 tuple 無法分叉到不同的對話 ID。共享主直接對等方會以 `participant` 角色連結，因此一個 OpenClaw 工作階段可以代表多個外部 DM 對等方，而不會把較舊的對等方降級成模糊的相關資料列。`sessions.primary_conversation_id` 仍指向目前的型別化傳遞目標。封閉的路由/狀態欄位會以 SQLite `CHECK` 約束強制執行，而不是只依賴 TypeScript union。
  執行階段工作階段投影會在套用型別化工作階段/對話欄位前，從 `session_entries.entry_json` 清除相容性路由影子，因此過時的 JSON 酬載無法復活傳遞目標。
  子代理公告路由同樣需要型別化 SQLite 傳遞內容；它不再退回使用相容性 `SessionEntry` 路由欄位。
  閘道 `chat.send` 明確傳遞繼承會讀取型別化 SQLite 傳遞內容，而不是 `origin`/`last*` 相容性欄位。
  `tools.effective` 同樣會從型別化 SQLite 傳遞/路由資料列衍生提供者/帳號/討論串內容，而不是過時的 `last*` 工作階段項目影子。
  系統事件提示內容會從型別化傳遞欄位重建 channel/to/account/thread 欄位，而不是從 `origin` 影子重建。
  共享的 `deliveryContextFromSession` 輔助工具與工作階段到對話映射器現在完全忽略 `SessionEntry.origin`；只有型別化傳遞欄位與關聯式對話資料列能建立熱路由身分。
  執行階段工作階段項目正規化會在持久化或投影 `entry_json` 前移除 `origin`，而傳入中繼資料會寫入型別化 channel/chat 欄位與關聯式對話資料列，而不是建立新的 origin 影子。
- 逐字稿事件、逐字稿快照與 trajectory 執行階段事件現在會參照典範的每代理 `sessions` 根，並在刪除工作階段時串聯。逐字稿身分/冪等性資料列會繼續從精確的逐字稿事件資料列串聯。
- 記憶核心索引現在使用明確的代理資料庫資料表 `memory_index_meta`、`memory_index_sources`、`memory_index_chunks` 和 `memory_embedding_cache`，並由 `memory_index_state` 追蹤修訂變更。選用的 FTS/向量側索引命名為 `memory_index_chunks_fts` 和 `memory_index_chunks_vec`，而不是通用的 `meta`、`files`、`chunks`、`chunks_fts` 或 `chunks_vec` 資料表。典範名稱會保留目前的路徑/來源資料列形狀與序列化嵌入相容性。這些資料表是衍生/搜尋快取，不是典範逐字稿儲存；它們可從記憶工作區檔案與已設定來源刪除並重建。
  開啟已出貨的通用名稱記憶索引時，會將其中繼資料、來源、區塊與嵌入快取遷移到典範資料表；衍生的 FTS/向量資料表會以其典範名稱重建。
- 子代理執行復原狀態現在位於型別化共享 `subagent_runs` 資料列中，並為子項、要求者與控制器工作階段鍵建立索引。舊的 `subagents/runs.json` 檔案僅作為 doctor 遷移輸入。
- 目前對話繫結現在位於型別化共享 `current_conversation_bindings` 資料列中，以正規化對話 ID 作為鍵，並將目標代理/工作階段欄位、對話種類、狀態、到期時間與中繼資料儲存為關聯式欄位，而不是重複的不透明繫結紀錄。持久繫結鍵包含正規化對話種類，因此 direct/group/channel 參照不會碰撞，而 SQLite 會拒絕無效的繫結種類/狀態值。舊的 `bindings/current-conversations.json` 檔案僅作為 doctor 遷移輸入。
- 傳遞佇列復原現在會在重播 JSON 上覆疊通道、目標、帳號、工作階段、重試、錯誤、平台傳送與復原狀態的型別化佇列欄位。`entry_json` 會保留重播酬載、hook 與格式化酬載，但型別化欄位才是熱佇列路由/狀態的權威來源。
- 終端介面上一個工作階段復原指標現在位於型別化共享 `tui_last_sessions` 資料列中，以雜湊後的終端介面連線/工作階段範圍作為鍵。舊的終端介面 JSON 檔案僅作為 doctor 遷移輸入。
- 預設 TTS 偏好設定現在位於共享外掛狀態 SQLite 資料列中，鍵位於 `speech-core` 外掛之下。舊的 `settings/tts.json` 檔案僅作為 doctor 遷移輸入；執行階段不再讀取或寫入 TTS 偏好設定 JSON 檔案，而舊版路徑解析器位於 doctor 遷移模組中。
- 祕密目標中繼資料現在談的是儲存區，而不是假裝每個認證目標都是設定檔。`openclaw.json` 仍是設定儲存區；auth-profile 目標會使用型別化 SQLite `auth_profile_stores` 資料列，並將提供者形狀的認證保留為 JSON 酬載。
- 祕密稽核不再掃描已退役的每代理 `auth.json` 檔案。Doctor 負責警告、匯入與移除該舊版檔案。
- 舊版 auth profile 路徑輔助工具現在位於 doctor 舊版程式碼中。核心 auth profile 路徑輔助工具會公開 SQLite auth-store 身分與顯示位置，而不是 `auth-profiles.json` 或 `auth-state.json` 執行階段路徑。
- 子代理執行復原與 OpenRouter 模型能力快取執行階段模組現在會將 SQLite 快照讀寫器與僅限 doctor 使用的舊版 JSON 匯入輔助工具分開。OpenRouter 能力使用 `provider_id = "openrouter"` 之下的型別化通用 `model_capability_cache` 資料列，而不是一個不透明快取 blob 或提供者專用主機資料表。子代理執行 `taskName` 會儲存在型別化 `subagent_runs.task_name` 欄位中；`payload_json` 副本是重播/偵錯資料，不是熱顯示或查找欄位的來源。
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` 會在代理資料庫 `vfs_entries` 資料表上實作 SQLite VFS。目錄讀取、遞迴匯出、刪除與重新命名會使用已建立索引的 `(namespace, path)` 前綴範圍，而不是掃描整個命名空間或依賴 `LIKE` 路徑比對。
- `src/agents/runtime-worker.entry.ts` 會為 worker 建立每次執行的 SQLite VFS、工具成品、執行成品與範圍化快取儲存區。
- 工作區啟動完成標記現在位於型別化共享 `workspace_setup_state` 資料列中，以解析後的工作區路徑作為鍵，而不是 `.openclaw/workspace-state.json`；執行階段不再讀取或重寫舊版工作區標記，輔助 API 也不再傳遞假的 `.openclaw/setup-state` 路徑，只為了衍生儲存身分。
- Exec 核准現在位於型別化共享 SQLite `exec_approvals_config` singleton 資料列中。Doctor 會匯入舊版 `~/.openclaw/exec-approvals.json`；執行階段寫入不再建立、重寫或回報該檔案作為其作用中儲存位置。macOS companion 會讀寫相同的 `state/openclaw.sqlite` 資料表資料列；它只在磁碟上保留 Unix prompt socket，因為那是 IPC，而不是持久執行階段狀態。
- 裝置身分、裝置驗證與啟動執行階段模組現在會將 SQLite 快照讀寫器與僅限 doctor 使用的舊版 JSON 匯入輔助工具分開。裝置身分使用型別化 `device_identities` 資料列，裝置驗證權杖使用型別化 `device_auth_tokens` 資料列。裝置驗證寫入會依裝置/角色協調資料列，而不是截斷權杖資料表，且執行階段不再透過舊的整體儲存區 adapter 路由單一權杖更新。舊版
  第 1 版 JSON 承載資料只作為 doctor 匯入/匯出形狀存在。
- GitHub Copilot 權杖交換快取使用共享 SQLite 外掛狀態資料表，
  位於 `github-copilot/token-cache/default`。這是供應商擁有的快取狀態，
  因此刻意不新增主機結構描述資料表。
- GitHub Copilot 壓縮不再寫入 `openclaw-compaction-*.json`
  工作區附屬檔案。該 harness 會針對受追蹤的 SDK 工作階段呼叫 SDK 歷史壓縮 RPC，
  而 OpenClaw 會將持久的工作階段/逐字稿狀態保存在 SQLite 中，
  而不是相容性標記檔。
- 共享 Swift 執行階段（`OpenClawKit`）對裝置身分與裝置驗證使用相同的
  `state/openclaw.sqlite` 資料列。macOS app
  helper 會匯入共享 SQLite helper，而不是擁有第二條 JSON 或
  SQLite 路徑。殘留的舊版 `identity/device.json` 會阻止身分建立，
  直到 doctor 將其匯入 SQLite，這與 TypeScript 和 Android
  啟動閘門一致。
- Android 裝置身分使用相同的 TypeScript 相容金鑰材料，
  儲存在具型別的 `state/openclaw.sqlite#table/device_identities` 資料列中。它絕不
  讀取或寫入 `openclaw/identity/device.json`；殘留的舊版檔案會阻止
  啟動，直到 doctor 將其匯入 SQLite。
- Android 快取的裝置驗證權杖也使用具型別的
  `state/openclaw.sqlite#table/device_auth_tokens` 資料列，並與 TypeScript 和 Swift
  共享相同的第 1 版權杖語意。執行階段不再讀取 `SecurePrefs`
  `gateway.deviceToken*` 相容性鍵；這些只屬於遷移/doctor
  邏輯。
- Android 通知最近套件歷史使用具型別的
  `android_notification_recent_packages` 資料列。執行階段不再遷移或
  讀取舊的 SharedPreferences CSV 鍵。
- 當舊版 `identity/device.json`
  存在、SQLite 身分資料列無效，或無法開啟 SQLite 身分
  儲存區時，裝置身分建立會以失敗關閉。doctor 會先匯入並移除該檔案，
  因此執行階段啟動無法在遷移前靜默輪替配對身分。
- 裝置身分選取是 SQLite 資料列鍵，而不是 JSON 檔案定位器。測試
  和閘道 helper 會傳入明確的身分鍵；只有 doctor 遷移和
  失敗關閉啟動閘門知道已退役的 `identity/device.json` 檔名。
- 工作階段重設相容性現在位於 doctor 設定遷移中：
  `session.idleMinutes` 會移至 `session.reset.idleMinutes`，
  `session.resetByType.dm` 會移至 `session.resetByType.direct`，而
  執行階段重設原則只讀取標準重設鍵。
- 舊版設定相容性現在位於 `src/commands/doctor/` 下。一般
  `readConfigFileSnapshot()` 驗證不會匯入 doctor 舊版偵測器
  或標註舊版問題；`runDoctorConfigPreflight()` 會為
  doctor 修復/報告新增這些問題。doctor 設定流程會匯入
  `src/commands/doctor/legacy-config.ts`，而舊的 OAuth profile-id 修復位於
  `src/commands/doctor/legacy/oauth-profile-ids.ts` 下。
- 非 doctor 命令不會自動執行舊版設定修復。例如，
  `openclaw update --channel` 現在會因無效舊版設定而失敗，並要求
  使用者執行 doctor，而不是靜默匯入 doctor 遷移程式碼。
- Web push、APNs、Voice Wake、更新檢查和設定健康狀態現在使用具型別的共享 SQLite
  資料表來儲存訂閱、VAPID 金鑰、節點註冊、觸發資料列、
  路由資料列、更新通知狀態和設定健康項目，而不是
  整個不透明 JSON blob。Web push 和 APNs 快照寫入現在會依主鍵協調
  訂閱/註冊，而不是清空其資料表；
  設定健康狀態也會依設定路徑執行相同處理。
  其執行階段模組會將 SQLite 快照讀取器/寫入器與
  僅供 doctor 使用的舊版 JSON 匯入 helper 分開。
- 節點主機設定現在使用共享 SQLite 資料庫中的具型別 singleton 資料列；
  doctor 會在一般執行階段使用前匯入舊的 `node.json` 檔案。
- 裝置/節點配對、頻道配對、頻道 allowlist 和 bootstrap 狀態
  現在使用具型別 SQLite 資料列，而不是整個不透明 JSON blob。外掛繫結
  核准和排程作業狀態遵循相同拆分：執行階段模組公開
  SQLite 支援的操作和中立快照 helper，而配對/bootstrap
  加上外掛繫結核准快照寫入會依主鍵協調資料列，
  而不是截斷資料表；doctor 則透過
  `src/commands/doctor/legacy/*` 模組匯入/移除舊的 JSON 檔案。
- 已安裝外掛記錄現在位於 SQLite 已安裝外掛索引中。
  執行階段設定讀取/寫入不再遷移或保留舊的
  `plugins.installs` authored-config 資料；doctor 會在一般執行階段使用前
  將該舊版設定形狀匯入 SQLite。
- QQ Bot 認證復原快照現在位於 SQLite 外掛狀態中的
  `qqbot/credential-backups`。執行階段不再寫入
  `qqbot/data/credential-backup*.json`；doctor 會與其他 QQ Bot 狀態輸入一起
  匯入並移除這些舊版備份檔案。
- 閘道重新載入規劃會在內部 `installedPluginIndex.installRecords.*` diff 命名空間下
  比較 SQLite 已安裝外掛索引快照。執行階段
  重新載入決策不再將這些資料列包裝成假的 `plugins.installs` 設定
  物件。
- Matrix 命名帳戶認證升級不再於執行階段
  讀取時發生。當可以解析單一/預設 Matrix 帳戶時，
  doctor 會負責舊的頂層 `credentials/matrix/credentials.json`
  重新命名。
- 核心配對和排程執行階段模組不再匯出舊版 JSON 路徑
  建構器。doctor 擁有的舊版模組會建構 `pending.json`、`paired.json`、
  `bootstrap.json` 和 `cron/jobs.json` 來源路徑，僅用於匯入測試和
  遷移。舊版排程作業形狀正規化和排程執行記錄匯入
  位於 `src/commands/doctor/legacy/cron*.ts` 下。
- `src/commands/doctor/legacy/runtime-state.ts` 會從 doctor 將舊版 JSON 狀態
  檔案（包括節點主機設定）匯入 SQLite。新的舊版檔案
  匯入器會保留在 `src/commands/doctor/legacy/` 下。
- `src/commands/doctor/state-migrations.ts` 會將舊版 `sessions.json` 和
  `*.jsonl` 逐字稿直接匯入 SQLite，並移除成功處理的來源。它
  不再透過 `agents/<agentId>/sessions/*.jsonl`
  暫存根目錄舊版逐字稿，也不會在匯入前建立標準 JSONL 目標。
- 狀態完整性 doctor 檢查不再掃描舊版工作階段目錄或
  提供孤立 JSONL 刪除。舊版逐字稿檔案僅作為遷移輸入，
  而遷移步驟負責匯入和來源移除。
- 舊版 sandbox registry 匯入位於
  `src/commands/doctor/legacy/sandbox-registry.ts`；作用中的 sandbox registry
  讀取和寫入仍僅使用 SQLite。
- 舊版工作階段逐字稿健康狀態/匯入修復位於
  `src/commands/doctor/legacy/session-transcript-health.ts`；執行階段命令
  模組不再攜帶 JSONL 逐字稿剖析或 active-branch 修復程式碼。

已完成的整併/刪除重點：

- 外掛狀態現在使用共用的 `state/openclaw.sqlite` 資料庫。舊的
  分支本機 `plugin-state/state.sqlite` sidecar 匯入器已移除，因為該
  SQLite 版面配置從未發布。探測/測試輔助工具會回報共用的
  `databasePath`，而不是公開外掛狀態專用的 SQLite 路徑。
- 任務和任務流程執行階段資料表現在位於共用的
  `state/openclaw.sqlite` 資料庫，而不是 `tasks/runs.sqlite` 和
  `tasks/flows/registry.sqlite`；舊的 sidecar 匯入器也因為同樣的未發布版面配置原因而移除。
- `src/config/sessions/store.ts` 不再需要 `storePath` 來處理傳入
  中繼資料、路由更新或 updated-at 讀取。命令持久化、命令列介面
  工作階段清理、子代理深度、驗證覆寫和轉錄工作階段
  身分會使用代理/工作階段資料列 API。寫入會以 SQLite 資料列修補套用，
  並搭配樂觀衝突重試。
- 工作階段目標解析現在公開每個代理的資料庫目標，而不是舊版
  `sessions.json` 路徑。共用閘道、ACP 中繼資料、doctor 路由修復和
  `openclaw sessions` 會列舉 `agent_databases` 加上已設定的代理。
- 閘道工作階段路由現在使用 `resolveGatewaySessionDatabaseTarget`；回傳的
  目標帶有 `databasePath` 和候選 SQLite 資料列鍵，而不是舊版工作階段儲存檔案路徑。
- 頻道工作階段執行階段型別現在會為 updated-at 讀取、傳入中繼資料和
  last-route 更新公開 `{agentId, sessionKey}`。舊的
  `saveSessionStore(storePath, store)` 相容型別已移除。
- 外掛執行階段、擴充 API 和 `config/sessions` barrel 表面現在會引導
  外掛程式碼使用 SQLite 支援的工作階段資料列輔助工具。根程式庫相容性
  匯出 (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) 會保留為
  現有消費者的已棄用 shim。舊的
  `resolveLegacySessionStorePath` 輔助工具已移除；舊版 `sessions.json` 路徑
  建構現在只在遷移和測試 fixture 中本機使用。
- `src/config/sessions/session-entries.sqlite.ts` 現在會將標準工作階段
  項目儲存在每個代理的資料庫，並支援資料列層級讀取/upsert/delete 修補。
  執行階段 upsert/patch/delete 不再掃描大小寫變體或修剪舊版別名鍵；
  doctor 擁有標準化。獨立 JSON 匯入輔助工具已移除，遷移會合併 upsert
  較新的資料列，而不是取代整個工作階段資料表。公開 read/list/load 輔助工具
  會從具型別的 `sessions` 和 `conversations` 資料列投影熱門工作階段中繼資料；
  `entry_json` 是相容性/偵錯陰影，可能過時或無效，但不會遺失具型別的
  工作階段身分或傳遞脈絡。
- `src/config/sessions/delivery-info.ts` 現在會從具型別的每代理
  `sessions` + `conversations` + `session_conversations` 資料列解析傳遞脈絡。
  它不再從 `session_entries.entry_json` 重建執行階段傳遞身分；
  缺少具型別的對話資料列是 doctor 遷移/修復問題，而不是執行階段 fallback。
- 已儲存工作階段重設決策現在優先使用具型別的 `sessions.session_scope`、
  `sessions.chat_type` 和 `sessions.channel` 中繼資料。`sessionKey` 解析
  僅保留用於命令目標上的明確 thread/topic 後綴；群組與直接重設分類
  不再來自鍵形狀。
- 工作階段清單/狀態顯示分類現在使用具型別的聊天中繼資料和
  閘道工作階段種類。它不再將 `session_key` 內的 `:group:` 或 `:channel:`
  子字串視為持久的群組/直接真相。
- 靜默回覆政策選擇現在只使用明確的對話型別或表面中繼資料。
  它不再從 `session_key` 子字串猜測直接/群組政策。
- 工作階段顯示模型解析現在會從 SQLite 工作階段資料庫目標接收代理 id，
  而不是從 `session_key` 拆分出來。
- 代理對代理公告目標補水現在只使用具型別的 `sessions.list`
  `deliveryContext`。它不再從舊版 `origin`、鏡像 `last*` 欄位或
  `session_key` 形狀復原頻道/帳戶/thread 路由。
- `sessions_send` thread 目標拒絕現在讀取具型別的 SQLite 路由
  中繼資料。它不再透過從目標鍵解析 thread 後綴來拒絕或接受目標。
- 群組範圍工具政策驗證現在會讀取目前或已產生工作階段的具型別 SQLite
  對話路由。它不再透過解碼 `sessionKey` 信任群組/頻道身分；當沒有具型別
  工作階段資料列為呼叫端提供的群組 id 背書時，這些 id 會被丟棄。
- 頻道模型覆寫比對現在使用明確的群組和父對話中繼資料。它不再從
  `parentSessionKey` 解碼父對話 id。
- 已儲存模型覆寫繼承現在需要來自具型別工作階段脈絡的明確父工作階段鍵。
  它不再從 `sessionKey` 中的 `:thread:` 或 `:topic:` 後綴衍生父覆寫。
- 舊的工作階段 thread-info wrapper 和已載入外掛 thread parser 已移除；
  沒有執行階段程式碼會匯入 `config/sessions/thread-info`。
- 頻道對話輔助工具不再公開完整工作階段鍵解析橋接。核心仍會透過
  `resolveSessionConversation(...)` 正規化提供者擁有的原始對話 id，
  但不會從 `sessionKey` 重建路由事實。
- 完成傳遞、傳送政策和任務維護不再從 `session_key` 形狀衍生聊天型別。
  舊的聊天型別鍵 parser 已刪除；這些路徑需要具型別的工作階段中繼資料、
  具型別的傳遞脈絡或明確的傳遞目標詞彙。
- 工作階段清單/狀態、診斷、核准帳戶綁定、終端介面心跳偵測
  篩選和用量摘要不再挖掘 `SessionEntry.origin` 來取得
  提供者/帳戶/thread/顯示路由。剩餘的執行階段 `origin` 讀取只屬於
  非工作階段概念或目前回合傳遞物件。
- 核准要求原生對話查詢現在會讀取具型別的每代理工作階段路由資料列。
  它不再從 `sessionKey` 解析頻道/群組/thread 對話身分；缺少具型別
  中繼資料是遷移/修復問題。
- 閘道工作階段 changed/chat/session 事件 payload 不再回顯
  `SessionEntry.origin` 或 `last*` 路由陰影；用戶端會接收具型別的
  `channel`、`chatType` 和 `deliveryContext`。
- 心跳偵測傳遞解析現在可以直接接收具型別的 SQLite
  `deliveryContext`，且心跳偵測執行階段會傳遞每個代理的
  工作階段傳遞資料列，而不是依賴相容性 `session_entries`
  陰影取得目前路由。
- 排程隔離代理傳遞目標解析也會先從具型別的每代理工作階段傳遞資料列
  補水目前路由，再 fallback 到相容性項目 payload。
- 子代理公告 origin 解析現在會透過 `loadRequesterSessionEntry`
  串接具型別的請求者工作階段傳遞脈絡，並優先使用該資料列，而不是
  相容性 `last*`/`deliveryContext` 陰影。
- 傳入工作階段中繼資料更新現在會先與具型別的每代理傳遞資料列合併；
  舊的 `SessionEntry` 傳遞欄位只有在沒有具型別對話資料列時才是 fallback。
- 重新啟動/更新傳遞擷取現在會讓具型別 SQLite 傳遞 `threadId`
  優先於從 `sessionKey` 解析出的 topic/thread 片段；解析只作為舊版
  thread 形狀鍵的 fallback。
- Hook 代理脈絡頻道 id 現在優先使用具型別的 SQLite 對話身分，
  然後是明確的訊息中繼資料。它們不再從 `sessionKey` 解析
  提供者/群組/頻道片段。
- 閘道 `chat.send` 外部路由繼承現在會讀取具型別的 SQLite 工作階段
  路由中繼資料，而不是從 `sessionKey` 片段推斷頻道/直接/群組範圍。
  頻道範圍工作階段只有在具型別工作階段頻道和聊天型別符合已儲存的
  傳遞脈絡時才會繼承；shared-main 工作階段保留其更嚴格的
  命令列介面/no-client-metadata 規則。
- 重新啟動 sentinel 喚醒和接續路由現在會先讀取具型別 SQLite
  傳遞/路由資料列，再佇列心跳偵測喚醒或已路由代理回合接續。
  它不再從工作階段項目 JSON 陰影重建傳遞脈絡。
- 閘道 `tools.effective` 脈絡解析現在會讀取具型別 SQLite
  傳遞/路由資料列，以取得提供者、帳戶、目標、thread 和回覆模式輸入。
  它不再從過時的 `session_entries.entry_json` origin 陰影復原這些熱門路由欄位。
- 即時語音諮詢路由現在會從具型別的每代理 SQLite 工作階段資料列解析
  父項/通話傳遞。它在選擇嵌入式代理訊息路由時，不再 fallback 到相容性
  `SessionEntry.deliveryContext` 陰影。
- ACP 產生心跳偵測 relay 和父串流路由現在會從具型別 SQLite 工作階段資料列
  讀取父項傳遞。它們不再從相容性工作階段項目陰影重建父項傳遞脈絡。
- 工作階段傳遞路由保留現在遵循具型別的聊天中繼資料和持久化傳遞欄位。
  它不再從 `sessionKey` 擷取頻道提示、direct/main 標記或 thread 形狀；
  內部 webchat 路由只有在 SQLite 已經有該工作階段的具型別/持久化傳遞身分時，
  才會繼承外部目標。
- 通用工作階段傳遞擷取現在只讀取精確的具型別 SQLite 工作階段傳遞資料列。
  它不再解析 thread/topic 後綴，也不會從 thread 形狀鍵 fallback 到基礎工作階段鍵。
- 回覆分派、重新啟動 sentinel 復原和即時語音諮詢路由現在會使用精確的
  具型別 SQLite 工作階段/對話資料列進行 thread 路由。它們不再透過解析
  thread 形狀工作階段鍵來復原 thread id 或基礎工作階段傳遞脈絡。
- 嵌入式 PI 歷史限制現在使用具型別的 SQLite 工作階段路由投影
  (`sessions` + 主要 `conversations`) 取得提供者、聊天型別和對等身分。
  它不再從 `sessionKey` 解析提供者、DM、群組或 thread 形狀。
- 排程工具傳遞推斷現在只使用明確傳遞或目前的具型別傳遞脈絡。
  它不再從 `agentSessionKey` 解碼頻道、對等、帳戶或 thread 目標。
- 執行階段工作階段資料列不再帶有舊的 `lastProvider` 路由別名。
  輔助工具和測試會使用具型別的 `lastChannel` 和 `deliveryContext` 欄位；
  doctor 遷移是唯一應該轉譯較舊路由別名或持久化 `origin` 陰影的地方。
- 轉錄事件、VFS 資料列和工具成品資料列現在會寫入每個代理的資料庫。
  未發布的全域轉錄檔案對應資料表已移除；doctor 會改在持久遷移資料列中
  記錄舊版來源路徑。
- 執行階段轉錄查詢不再掃描 JSONL 位元組偏移，也不探測舊版轉錄檔案。
  閘道 chat/media/history 路徑會從 SQLite 讀取轉錄資料列；工作階段 JSONL
  現在只是不屬於執行階段狀態或匯出格式的舊版 doctor 輸入。
- 轉錄父項和分支關係會使用 SQLite 轉錄標頭中的結構化
  `parentTranscriptScope: {agentId, sessionId}` 中繼資料，而不是類似路徑的
  `agent-db:...transcript_events...` locator 字串。
- 轉錄管理員合約不再公開隱含持久化的 `create(cwd)` 或
  `continueRecent(cwd)` 建構子。持久化轉錄管理員會使用明確的
  `{agentId, sessionId}` 範圍開啟；只有記憶體內管理員會為測試和純轉錄轉換保持無範圍。
- 執行階段轉錄儲存 API 會解析 SQLite 範圍，而不是檔案系統路徑。
  舊的 `resolve...ForPath` 輔助工具和未使用的 `transcriptPath` 寫入選項
  已從執行階段呼叫端移除。
- 執行階段工作階段解析現在使用 `{agentId, sessionId}`，且不得為外部邊界衍生
  `sqlite-transcript://<agent>/<session>` 字串。舊版絕對 JSONL 路徑只作為
  doctor 遷移輸入。
- 原生 hook relay direct-bridge 記錄現在位於以 relay id 為鍵的具型別共用
  `native_hook_relay_bridges` 資料列中。執行階段不再為這些短暫 bridge
  記錄寫入 `/tmp` JSON registry 或不透明的通用記錄。
- `runEmbeddedPiAgent(...)` 不再有 transcript-locator 參數。
  已準備的 worker 描述元也會省略逐字稿定位器。執行階段工作階段
  狀態與已排入佇列的後續執行會攜帶 `{agentId, sessionId}`，而不是
  衍生的逐字稿控制代碼。
- 內嵌壓縮現在會從 `agentId` 和 `sessionId` 取得 SQLite 範圍。
  壓縮 hook、context-engine 呼叫、命令列介面委派，以及協定回覆
  不得接收衍生的 `sqlite-transcript://...` 控制代碼。匯出/偵錯程式碼
  可以從資料列具體化明確的使用者成品，但不會提供通用的
  工作階段 JSONL 匯出路徑，也不會將檔案名稱回傳到執行階段
  身分。
- `/export-session` 會從 SQLite 讀取逐字稿資料列，並只寫入要求的
  獨立 HTML 檢視。內嵌檢視器不再從這些資料列重建或下載
  工作階段 JSONL。
- Context-engine 委派不再解析逐字稿定位器來還原 agent 身分。
  已準備的執行階段脈絡會將解析後的 `agentId` 帶入內建壓縮配接器。
- 逐字稿重寫與即時工具結果截斷現在會依 `{agentId, sessionId}`
  讀取並持久化逐字稿狀態，而且不會為逐字稿更新事件酬載衍生
  暫時定位器。
- 逐字稿狀態輔助介面不再有基於定位器的
  `readTranscriptState`、`replaceTranscriptStateEvents` 或
  `persistTranscriptStateMutation` 變體。執行階段呼叫端必須使用
  `{agentId, sessionId}` API。Doctor 匯入會依明確檔案路徑讀取
  舊版檔案並寫入 SQLite 資料列；它不會遷移定位器字串。
- 執行階段工作階段管理器合約不再公開 `open(locator)`、
  `forkFrom(locator)` 或 `setTranscriptLocator(...)`。持久化工作階段
  管理器只會依 `{agentId, sessionId}` 開啟；清單/分叉輔助工具
  位於以資料列為導向的工作階段與檢查點 API，而不是逐字稿管理器
  facade。
- 閘道逐字稿讀取器 API 以範圍優先。它們接受
  `{agentId, sessionId}`，且不接受可能意外變成執行階段身分的
  位置式逐字稿定位器。主動逐字稿定位器解析已移除；舊版來源路徑
  只由 doctor 匯入程式碼讀取。
- 逐字稿更新事件也以範圍優先。`emitSessionTranscriptUpdate`
  不再接受裸定位器字串，且監聽器會依 `{agentId, sessionId}`
  路由，不會解析控制代碼。
- 閘道工作階段訊息廣播會從 agent/工作階段範圍解析工作階段鍵，
  而不是從逐字稿定位器解析。舊的逐字稿定位器到工作階段
  鍵解析器/快取已移除。
- 閘道工作階段歷史 SSE 會依 agent/工作階段範圍篩選即時更新。
  它不再正規化逐字稿定位器候選、realpath 或檔案形狀的
  逐字稿身分，來決定串流是否應收到更新。
- 工作階段生命週期 hook 不再於 `session_end` 衍生或公開
  逐字稿定位器。Hook 消費者會取得 `sessionId`、`sessionKey`、
  下一個工作階段 id，以及 agent 脈絡；逐字稿檔案不是生命週期
  合約的一部分。
- 重設 hook 也不再衍生或公開逐字稿定位器。`before_reset` 酬載會攜帶
  復原的 SQLite 訊息加上重設原因，而工作階段身分會留在 hook 脈絡中。
- Agent harness 重設不再接受逐字稿定位器。重設分派會依
  `sessionId`/`sessionKey` 加上原因設定範圍。
- Agent extension 工作階段型別不再公開 `transcriptLocator`；extension
  應使用工作階段脈絡和執行階段 API，而不是存取檔案形狀的
  逐字稿身分。
- 外掛壓縮 hook 不再公開逐字稿定位器。Hook 脈絡已攜帶工作階段身分，
  而逐字稿讀取必須透過具備 SQLite 範圍感知的 API，而不是
  檔案形狀控制代碼。
- `before_agent_finalize` hook 不再公開 `transcriptPath`，包括
  原生 hook relay 酬載。Finalization hook 只使用工作階段脈絡。
- 閘道重設回應不再在回傳項目上合成逐字稿定位器。重設會建立
  SQLite 逐字稿資料列、回傳乾淨的工作階段項目，並將逐字稿存取
  留給具備範圍感知的讀取器。
- 內嵌執行與壓縮結果不再為工作階段計算公開逐字稿定位器。
  自動壓縮只會更新作用中的 `sessionId`、壓縮計數器，以及 token
  中繼資料。
- 內嵌嘗試結果不再回傳 `transcriptLocatorUsed`，而 context-engine
  `compact()` 結果也不再回傳逐字稿定位器。執行階段重試迴圈只接受
  後繼 `sessionId`。
- Delivery-mirror 逐字稿附加結果不再回傳逐字稿定位器。呼叫端會取得
  已附加的 `messageId`；逐字稿更新訊號會使用 SQLite 範圍。
- 父工作階段分叉輔助工具只會回傳分叉後的 `sessionId`。Subagent
  準備會將子 agent/工作階段範圍傳給引擎。
- 命令列介面 runner 參數與歷史重新植入不再接受逐字稿定位器。
  命令列介面歷史讀取會從 `{agentId,
sessionId}` 和工作階段鍵脈絡解析 SQLite 逐字稿範圍。
- 命令列介面與內嵌 runner 測試 fixture 現在會依工作階段 id 植入
  並讀取 SQLite 逐字稿資料列，而不是假裝作用中工作階段是
  `*.jsonl` 檔案，或透過執行階段參數傳遞 `sqlite-transcript://...`
  字串。
- 工作階段工具結果 guard 事件會從已知工作階段範圍發出，即使
  記憶體內管理器沒有衍生定位器。其測試不再偽造作用中的
  `/tmp/*.jsonl` 逐字稿檔案。
- BTW 與壓縮檢查點輔助工具現在會依 SQLite 範圍讀取並分叉逐字稿
  資料列。檢查點中繼資料現在只儲存工作階段 id 與 leaf/entry id；
  衍生定位器不再寫入檢查點酬載。
- 閘道逐字稿鍵查詢會在協定邊界使用 SQLite 逐字稿範圍，且不再
  對逐字稿檔名執行 realpath 或 stat。
- 自動壓縮逐字稿輪替會直接透過 SQLite 逐字稿儲存區寫入後繼
  逐字稿資料列。工作階段資料列只保留後繼工作階段身分，而不是
  持久 JSONL 路徑或持久化定位器。
- 內嵌 context-engine 壓縮會使用 SQLite 命名的逐字稿輪替輔助工具。
  輪替測試不再建構 JSONL 後繼路徑，或將作用中工作階段建模為檔案。
- 受管理的外送圖片保留會從 SQLite 逐字稿統計資料鍵控其
  逐字稿訊息快取，而不是使用檔案系統 stat 呼叫。
- 執行階段工作階段鎖與獨立舊版 `.jsonl.lock` doctor
  路徑已移除。
- Microsoft Teams 執行階段 barrel 與公開外掛 SDK 不再重新匯出
  舊的檔案鎖輔助工具；持久外掛狀態路徑以 SQLite 為後端。
- 工作階段年齡/數量修剪與明確工作階段清理已移除。
  Doctor 擁有舊版匯入；過時工作階段會被明確重設或刪除。
- Doctor 完整性檢查不再將舊版 JSONL 檔案計為 SQLite 工作階段資料列的
  有效作用中逐字稿。作用中逐字稿健康狀態僅限 SQLite；
  舊版 JSONL 檔案會回報為遷移/孤立清理輸入。
- Doctor 不再將 `agents/<agent>/sessions/` 視為必要的執行階段
  狀態。它只會在該目錄已存在時掃描，作為舊版匯入或孤立清理輸入。
- 閘道 `sessions.resolve`、工作階段 patch/reset/compact 路徑、subagent
  生成、快速中止、ACP 中繼資料、心跳偵測隔離工作階段，以及終端介面
  patching，不再將遷移或修剪舊版工作階段鍵作為正常執行階段工作的
  副作用。
- 命令列介面命令工作階段解析現在會回傳擁有者 `agentId`，而不是
  `storePath`，且不再於正常 `--to` 或 `--session-id` 解析期間複製
  舊版主工作階段資料列。舊版主資料列正規化只屬於 doctor。
- 執行階段 subagent 深度解析不再讀取 `sessions.json` 或 JSON5
  工作階段儲存。它會依 agent id 讀取 SQLite `session_entries`，
  而舊版深度/工作階段中繼資料只能透過 doctor 匯入路徑進入。
- Auth profile 工作階段覆寫會透過直接 `{agentId, sessionKey}` 資料列
  upsert 持久化，而不是惰性載入檔案形狀的工作階段儲存執行階段。
- 自動回覆詳細閘控與工作階段更新輔助工具現在會依工作階段身分
  讀取/upsert SQLite 工作階段資料列，且不再需要舊版儲存路徑
  才能觸碰持久化資料列狀態。
- 命令執行工作階段中繼資料輔助工具現在使用以 entry 為導向的名稱
  與模組路徑；舊的 `session-store` 命令輔助介面已移除。
- Bootstrap header 植入與手動壓縮邊界強化現在會直接變更 SQLite
  逐字稿資料列。執行階段呼叫端會傳遞工作階段身分，而不是可寫入的
  `.jsonl` 路徑。
- 靜默工作階段輪替重播會依 `{agentId, sessionId}` 從 SQLite
  逐字稿資料列複製最近的使用者/assistant 回合。它不再接受來源或目標
  逐字稿定位器。
- 全新的執行階段工作階段資料列不再儲存逐字稿定位器。呼叫端會直接使用
  `{agentId, sessionId}`；匯出/偵錯命令在具體化資料列時可以選擇
  輸出檔名。
- 啟動新的持久化逐字稿工作階段現在一律依範圍開啟 SQLite 資料列。
  工作階段管理器不再重用先前檔案時代的逐字稿路徑或定位器作為
  新工作階段的身分。
- 持久化逐字稿工作階段使用明確的
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API。
  舊的靜態 `SessionManager.create/openForSession/list/forkFromSession`
  facade 已移除，因此測試與執行階段程式碼不會意外重建檔案時代的
  工作階段探索。
- 外掛執行階段不再公開 `api.runtime.agent.session.resolveTranscriptLocatorPath`；
  外掛程式碼會使用 SQLite 資料列輔助工具與範圍值。
- 公開的 `session-store-runtime` SDK 介面現在只匯出工作階段資料列
  與逐字稿資料列輔助工具。聚焦的 SQLite schema/path/transaction
  輔助工具位於 `sqlite-runtime`；原始 open/close/reset 輔助工具
  仍僅供第一方測試在本機使用。
- 舊版 `.jsonl` trajectory/checkpoint 檔名分類器現在位於 doctor
  舊版工作階段檔案模組。核心工作階段驗證不再匯入檔案成品輔助工具
  來決定正常 SQLite 工作階段 id。
- 主動記憶阻塞 subagent 執行會使用 SQLite 逐字稿資料列，而不是在
  外掛狀態下建立暫時或持久化的 `session.jsonl` 檔案。舊的
  `transcriptDir` 選項已移除。
- 一次性 slug 產生與 Crestodian planner 執行會使用 SQLite 逐字稿資料列，
  而不是建立暫時的 `session.jsonl` 檔案。
- `llm-task` 輔助工具執行與隱藏 commitment 擷取也會使用 SQLite
  逐字稿資料列，因此這些僅模型用的輔助工作階段不再建立暫時
  JSON/JSONL 逐字稿檔案。
- `TranscriptSessionManager` 現在只是已開啟的 SQLite 逐字稿範圍。
  執行階段程式碼會使用 `openTranscriptSessionManagerForSession({agentId,
sessionId})` 開啟它；create、branch、continue、list 和 fork 流程
  位於其擁有的 SQLite 資料列輔助工具中，而不是靜態管理器 facade。
  Doctor/匯入/偵錯程式碼會在執行階段工作階段管理器之外處理明確的
  舊版來源檔案。
- 過時的 `SessionManager.newSession()` 與
  `SessionManager.createBranchedSession()` facade 方法已移除。新的
  工作階段與逐字稿子代會由其擁有的 SQLite 工作流程建立，而不是將
  已開啟的管理器變更為不同的持久化工作階段。
- 父逐字稿分叉決策與分叉建立不再接受 `storePath` 或 `sessionsDir`；
  它們使用 `{agentId, sessionId}` SQLite 逐字稿範圍，而不是保留的
  檔案系統路徑中繼資料。
- Memory-host 不再匯出 no-op 工作階段目錄逐字稿分類輔助工具；逐字稿
  篩選現在會在 entry 建構期間從 SQLite 資料列中繼資料衍生。
- Memory-host 與 QMD 工作階段匯出測試使用 SQLite 逐字稿範圍。
  舊的 `agents/<agentId>/sessions/*.jsonl` 路徑只會在測試刻意證明
  doctor/匯入/匯出相容性時涵蓋。
- QA-lab 原始工作階段檢查現在會透過閘道使用 `sessions.list`
  不再讀取 `agents/qa/sessions/sessions.json`；MSteams 回饋
  會直接附加到 SQLite transcripts，而不會捏造 JSONL 路徑。
- 共用傳入 channel turns 現在攜帶 `{agentId, sessionKey}`，而不是
  舊版 `storePath`。LINE、WhatsApp、Slack、Discord、Telegram、Matrix、Signal、
  iMessage、BlueBubbles、Feishu、Google Chat、IRC、Nextcloud Talk、Zalo、
  Zalo Personal、QA Channel、Microsoft Teams、Mattermost、Synology Chat、Tlon、
  Twitch 和 QQ Bot recording paths 現在會讀取 updated-at metadata，並透過 SQLite identity
  記錄傳入 session rows。
- Transcript locator persistence 已從 active session rows 移除。
  `resolveSessionTranscriptTarget` 會回傳 `agentId`、`sessionId`，以及選用的
  topic metadata；doctor 是唯一會匯入舊版 transcript file
  names 的程式碼。
- Runtime transcript headers 從 SQLite version `1` 開始。舊 JSONL V1/V2/V3
  shape upgrades 只存在於 doctor import，並會在儲存 rows 前，將匯入的 headers 正規化為
  目前的 SQLite transcript version。
- database-first guard 現在禁止 `SessionManager.listAll` 和
  `SessionManager.forkFromSession`；session listing 與 fork/restore workflows
  必須維持在 row/scoped SQLite APIs 上。
- 該 guard 也會禁止 doctor/import code 以外的舊版 transcript JSONL parse/active-branch repair helper
  names，因此 runtime 無法長出第二條舊版
  transcript migration path。
- Embedded PI runs 會拒絕傳入的 transcript handles。它們會在 worker launch 前以及
  attempt 接觸 transcript state 前，再次使用 SQLite
  `{agentId, sessionId}` identity。過時的 `/tmp/*.jsonl` input 無法選取
  runtime write target。
- Cache trace、Anthropic payload、raw stream 和 diagnostics timeline records
  現在會寫入 typed SQLite `diagnostic_events` rows。閘道 stability bundles
  現在會寫入 typed SQLite `diagnostic_stability_bundles` rows。舊的
  `diagnostics.cacheTrace.filePath`、`OPENCLAW_CACHE_TRACE_FILE`、
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` 和
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL override paths 已移除，而且
  一般 stability capture 不再寫入 `logs/stability/*.json` files。
- 排程 persistence 現在會協調 SQLite `cron_jobs` rows，而不是
  每次儲存時刪除並重新插入整個 job table。外掛 target
  writebacks 會直接更新相符的 cron rows，並將 runtime cron state 保持在
  同一個 state-database transaction 中。
- 排程 runtime callers 現在使用穩定的 SQLite cron store key。舊版
  `cron.store` paths 只作為 doctor import inputs；production gateway、task
  maintenance、status、run-log 和 Telegram target writeback paths 使用
  `resolveCronStoreKey`，且不再 path-normalize 該 key。排程 status 現在
  回報 `storeKey`，而不是舊的 file-shaped `storePath` field。
- 排程 runtime load 和 scheduling 不再正規化舊版 persisted job
  shapes，例如 `jobId`、`schedule.cron`、numeric `atMs`、string booleans，或
  缺少 `sessionTarget`。Doctor legacy import 會在 rows
  插入 SQLite 前負責這些 repairs。
- ACP spawn 不再解析或保存 transcript JSONL file paths。Spawn
  和 thread-bind setup 會直接保存 SQLite session row，並保留
  session id 作為 retained transcript identity。
- ACP session metadata APIs 現在依 `agentId` 讀取/list/upsert SQLite rows，
  且不再將 `storePath` 作為 ACP session entry contract 的一部分公開。
- Session usage accounting 和 gateway usage aggregation 現在只依
  `{agentId, sessionId}` 解析 transcripts。cost/usage cache 和 discovered-session
  summaries 不再合成或回傳 transcript locator strings。
- Gateway chat append、abort-partial persistence、`/sessions.send` 和
  webchat media transcript writes 會直接透過 SQLite transcript
  scope 附加。gateway transcript-injection helper 不再接受
  `transcriptLocator` parameter。
- SQLite transcript discovery 現在只列出 transcript scopes 和 stats：
  `{agentId, sessionId, updatedAt, eventCount}`。已死亡的
  `listSqliteSessionTranscriptLocators` compatibility helper 和 per-row
  `locator` field 已移除。
- Transcript repair runtime 現在只公開
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`。舊的
  locator-based repair helper 已刪除；doctor/debug code 會讀取明確的
  source file paths，且永遠不會遷移 locator strings。
- ACP replay ledger runtime 現在將 per-session replay rows 儲存在共用
  SQLite state database，而不是 `acp/event-ledger.json`；doctor 會匯入並
  移除舊版 file。
- Gateway transcript reader helpers 現在位於
  `src/gateway/session-transcript-readers.ts`，而不是舊的
  `session-utils.fs` module name。fallback retry history check 會以
  SQLite transcript content 命名，而不是舊的 file-helper surface。
- Gateway injected-chat 和壓縮 helpers 現在透過 internal helper APIs
  傳遞 SQLite transcript scope，而不是將值命名為 transcript paths 或
  source files。
- Bootstrap continuation detection 現在透過
  `hasCompletedBootstrapTranscriptTurn` 檢查 SQLite transcript rows；它不再公開 file-shaped
  helper name。
- Embedded-runner tests 現在使用 SQLite transcript identity，而且開啟新的
  transcript manager 一律需要明確的 `sessionId`。
- Memory indexing helpers 現在從頭到尾使用 SQLite transcript terminology：
  host exports `listSessionTranscriptScopesForAgent` 和
  `sessionTranscriptKeyForScope`，targeted sync queues `sessionTranscripts`，
  public session-search hits expose opaque `transcript:<agent>:<session>` paths，
  而 internal DB source key 是 `source_kind='sessions'` 下的
  `session:<session>`，而不是假的 file path。
- 通用外掛 SDK persistent-dedupe helper 不再公開 file-shaped
  options。Callers 提供 SQLite scope keys，且 durable dedupe rows 存放在
  shared plugin state。
- Microsoft Teams SSO tokens 已從 locked JSON files 移至 SQLite plugin
  state。Doctor 會匯入 `msteams-sso-tokens.json`，從 payloads 重建 canonical SSO token
  keys，並移除 source file。Delegated OAuth tokens 保持在既有的 private credential-file boundary。
- Matrix sync cache state 已從 `bot-storage.json` 移至 SQLite plugin
  state。Doctor 會匯入舊版 raw 或 wrapped sync payloads，並移除
  source file。Active Matrix 和 QA Matrix clients 會傳遞 SQLite sync-store root
  directory，而不是假的 `sync-store.json` 或 `bot-storage.json` path。
- Matrix legacy crypto migration status 已從
  `legacy-crypto-migration.json` 移至 SQLite plugin state。Doctor 會匯入
  舊 status file；Matrix SDK IndexedDB snapshots 已從
  `crypto-idb-snapshot.json` 移至 SQLite plugin blobs。Matrix recovery keys 和
  credentials 是 SQLite plugin-state rows；它們的舊 JSON files 只作為 doctor
  migration inputs。
- Memory Wiki activity logs 現在使用 SQLite plugin state，而不是
  `.openclaw-wiki/log.jsonl`。Memory Wiki migration provider 會匯入舊的
  JSONL logs；wiki markdown 和 user vault content 仍作為 workspace content
  由檔案支撐。
- Memory Wiki 不再建立 `.openclaw-wiki/state.json` 或未使用的
  `.openclaw-wiki/locks` directory。如果較舊的 vault 仍有這些已退役的
  plugin metadata files，migration provider 會移除它們。
- Crestodian audit entries 現在使用 core SQLite plugin state，而不是
  `audit/crestodian.jsonl`。Doctor 會匯入舊版 JSONL audit log，並在
  成功匯入後移除它。
- Config write/observe audit entries 現在使用 core SQLite plugin state，
  而不是 `logs/config-audit.jsonl`。Doctor 會匯入舊版 JSONL audit log，並在
  成功匯入後移除它。
- macOS companion 在編輯 `openclaw.json` 時，不再寫入 app-local
  `logs/config-audit.jsonl` 或 `logs/config-health.json` sidecars。config
  file 仍由檔案支撐，recovery snapshots 保持在 config file 旁邊，
  而 durable config audit/health state 屬於閘道 SQLite store。
- Crestodian rescue pending approvals 現在使用 core SQLite plugin state，
  而不是 `crestodian/rescue-pending/*.json`。Doctor 會匯入舊版 pending approval
  files，並在成功匯入後移除它們。
- Phone Control temporary arm state 現在使用 SQLite plugin state，而不是
  `plugins/phone-control/armed.json`。Doctor 會將舊版 armed-state
  file 匯入 `phone-control/arm-state` namespace，並移除該 file。
- Doctor 不再原地修復 JSONL transcripts 或建立 backup JSONL
  files。它會將 active branch 匯入 SQLite，並移除舊版 source。
- Session-memory hook transcript lookup 使用 `{agentId, sessionId}` scope-only
  SQLite reads。其 helper 不再接受或衍生 transcript locators、
  legacy file reads，或 file-rewrite options。
- Codex app-server conversation bindings 現在依 OpenClaw session key 或明確的
  `{agentId, sessionId}` scope 作為 SQLite plugin state 的 key。它們不得
  保留 transcript-path fallback bindings。
- Codex app-server mirrored-history reads 只使用 SQLite transcript scope；
  它們不得從 transcript file paths 復原 identity。
- Role-ordering 和壓縮 reset paths 不再 unlink 舊 transcript
  files；reset 只會輪替 SQLite session row 和 transcript identity。
- Gateway reset 和 checkpoint responses 會回傳乾淨的 session rows 加上 session
  ids。它們不再為 clients 合成 SQLite transcript locators。
- Memory-core 夢境整理不再透過探測缺失的
  JSONL files 來 pruning session rows。Subagent cleanup 會經由 session runtime API，而不是
  filesystem existence checks。其 transcript-ingestion tests 會直接 seed SQLite rows，
  而不是建立 `agents/<id>/sessions` fixtures 或 locator
  placeholders。
- Memory transcript indexing 可將 `transcript:<agentId>:<sessionId>` 作為
  citation/read helpers 的 virtual search-hit path 公開。durable index source 是
  relational（`source_kind='sessions'`、`source_key='session:<sessionId>'`、
  `session_id=<sessionId>`），因此該值不是 runtime transcript locator、
  不是 filesystem path，且絕不可傳回 session runtime APIs。
- Gateway doctor memory status 會從 SQLite plugin-state rows 讀取 short-term recall 和 phase-signal counts，
  而不是 `memory/.dreams/*.json`；命令列介面和
  doctor output 現在會將該 storage 標示為 SQLite store，而不是 path。
- Memory-core runtime、命令列介面 status、Gateway doctor methods 和外掛 SDK
  facades 不再 audit 或 archive 舊版 `.dreams/session-corpus` files。
  這些 files 只作為 migration inputs；doctor 會將它們匯入 SQLite，並在
  驗證後刪除 source。Active session-ingestion evidence rows
  現在使用 virtual SQLite path `memory/session-ingestion/<day>.txt`；runtime
  永遠不會寫入或從 `.dreams/session-corpus` 衍生 state。
- Memory-core public artifacts 會將 SQLite host events 公開為 virtual JSON
  artifact `memory/events/memory-host-events.json`；它們不再重用
  舊版 `.dreams/events.jsonl` source path。
- Sandbox container/browser registries 現在使用共用的
  `sandbox_registry_entries` SQLite table，並具有 typed session、image、timestamp、
  backend/config 和 browser port columns。Doctor 會匯入舊版 monolithic 和
  sharded JSON registry files，並移除成功匯入的 sources。Runtime reads 使用
  typed row columns 作為 truth source；`entry_json` 只是 replay/debug
  copy。
- Commitments 現在使用 typed shared `commitments` table，而不是
  whole-store JSON blob。Snapshot saves 會依 commitment id upsert，且只刪除
  缺失的 rows，而不是清空並重新插入 table。Runtime 會從 typed scope、
  delivery-window、status、attempt 和 text columns 載入
  commitments；`record_json` 只是 replay/debug copy。Doctor 會匯入舊版
  `commitments.json`，並在成功匯入後移除它。
- Cron job definitions、schedule state 和 run history 不再有 runtime
  JSON writers 或 readers。Runtime 使用 `cron_jobs` rows，並帶有 typed schedule、
  承載資料、遞送、失敗警示、工作階段、狀態和執行階段狀態欄位，以及具型別的
  `cron_run_logs` 中繼資料，用於狀態、診斷摘要、遞送狀態/錯誤、
  工作階段/執行、模型和權杖總計。`job_json` 只是一份重播/除錯副本；`state_json` 保留尚未有熱查詢欄位的巢狀
  執行階段診斷，而執行階段會從具型別欄位重新補水熱狀態欄位。Doctor 會匯入
  舊版 `jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案，並移除
  已匯入的來源。外掛目標回寫會更新相符的 `cron_jobs`
  列，而不是載入並取代整個排程儲存區。
- 閘道啟動會忽略執行階段投影中的舊版 `notify: true` 標記。
  當 `cron.webhook` 有效時，Doctor 會將它們轉譯為明確的 SQLite 遞送；
  未設定時會移除無作用的標記；設定的網路鉤子無效時則會保留它們並提出警告。
- 對外和工作階段遞送佇列現在會將佇列狀態、項目種類、
  工作階段鍵、通道、目標、帳號 ID、重試次數、上次嘗試/錯誤、
  復原狀態和平台傳送標記，作為具型別欄位儲存在共享的
  `delivery_queue_entries` 資料表。執行階段復原會從
  具型別欄位讀取這些熱欄位，而重試/復原變更會直接更新這些欄位，
  不會重寫重播 JSON。完整 JSON 承載資料僅保留為
  訊息本文和其他冷重播資料的重播/除錯 blob。
- 受管理的對外圖片記錄現在使用具型別的共享
  `managed_outgoing_image_records` 列，媒體位元組仍儲存在
  `media_blobs`。JSON 記錄僅保留為重播/除錯副本。
- Discord 模型選擇器偏好設定、命令部署雜湊和討論串繫結
  現在使用共享 SQLite 外掛狀態。它們的舊版 JSON 匯入計畫位於
  Discord 外掛設定/Doctor 遷移介面，而不是核心遷移程式碼。
- 外掛舊版匯入偵測器使用 Doctor 命名的模組，例如
  `doctor-legacy-state.ts` 或 `doctor-state-imports.ts`；一般通道執行階段
  模組不得匯入舊版 JSON 偵測器。
- BlueBubbles 追補游標和入站去重標記現在使用共享 SQLite
  外掛狀態。它們的舊版 JSON 匯入計畫位於 BlueBubbles 外掛
  設定/Doctor 遷移介面，而不是核心遷移程式碼。
- Telegram 更新偏移、貼圖快取列、已傳送訊息快取列、
  主題名稱快取列和討論串繫結現在使用共享 SQLite 外掛
  狀態。它們的舊版 JSON 匯入計畫位於 Telegram 外掛
  設定/Doctor 遷移介面，而不是核心遷移程式碼。
- iMessage 追補游標、回覆短 ID 對應和已傳送回音去重列
  現在使用共享 SQLite 外掛狀態。舊的 `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl` 和 `imessage/sent-echoes.jsonl` 檔案
  僅作為 Doctor 輸入。
- Feishu 訊息去重列現在使用共享 SQLite 外掛狀態，而不是
  `feishu/dedup/*.json` 檔案。其舊版 JSON 匯入計畫位於 Feishu
  外掛設定/Doctor 遷移介面，而不是核心遷移程式碼。
- Microsoft Teams 對話、投票、待處理上傳緩衝區和意見回饋
  學習現在使用共享 SQLite 外掛狀態/blob 資料表。待處理上傳
  路徑使用 `plugin_blob_entries`，因此媒體緩衝區會儲存為 SQLite BLOB，
  而不是 base64 JSON。執行階段輔助工具名稱現在使用 SQLite/狀態命名，
  而不是 `*-fs` 檔案儲存命名，且舊的 `storePath` shim 已從這些儲存區移除。
  其舊版 JSON 匯入計畫位於 Microsoft Teams
  外掛設定/Doctor 遷移介面。
- Zalo 託管的對外媒體現在使用共享 SQLite `plugin_blob_entries`，
  而不是 `openclaw-zalo-outbound-media` JSON/bin 暫存 sidecar。
- 差異檢視器 HTML 和中繼資料現在使用共享 SQLite `plugin_blob_entries`，
  而不是 `meta.json`/`viewer.html` 暫存檔案。已渲染的 PNG/PDF 輸出仍保留為
  暫存具現化，因為通道遞送仍需要檔案路徑。
- Canvas 受管理文件現在使用共享 SQLite `plugin_blob_entries`，
  而不是預設的 `state/canvas/documents` 目錄。Canvas 主機會直接提供這些
  blob；只有明確的 `host.root` 操作者內容，或下游媒體讀取器
  需要路徑時的暫時具現化，才會建立本機檔案。
- 檔案傳輸稽核決策現在使用共享 SQLite `plugin_state_entries`，
  而不是無界限的 `audit/file-transfer.jsonl` 執行階段日誌。Doctor
  會將舊版 JSONL 稽核檔案匯入外掛狀態，並在乾淨匯入後移除來源。
- ACPX 程序租約和閘道執行個體身分現在使用共享 SQLite 外掛
  狀態。Doctor 會將舊版 `gateway-instance-id` 檔案匯入外掛狀態，
  並移除來源。
- ACPX 產生的包裝指令碼和隔離的 Codex 主目錄是 OpenClaw 暫存根目錄下的
  暫時具現化，而不是持久的 OpenClaw 狀態。持久的 ACPX 執行階段記錄是
  SQLite 租約和閘道執行個體列；舊的 ACPX `stateDir` 設定介面已移除，
  因為不再有執行階段狀態寫入該處。
- 閘道媒體附件現在使用共享的 `media_blobs` SQLite 資料表作為
  標準位元組儲存區。傳回給通道和沙箱相容性介面的本機路徑是資料庫列的
  暫存具現化，而不是持久媒體儲存區。執行階段媒體允許清單不再包含舊版
  `$OPENCLAW_STATE_DIR/media` 或設定目錄 `media` 根目錄；這些目錄僅作為
  Doctor 匯入來源。
- Shell 補全不再寫入 `$OPENCLAW_STATE_DIR/completions/*` 快取
  檔案。安裝、Doctor、更新和發行煙霧測試路徑會使用產生的
  補全輸出或設定檔 sourcing，而不是持久補全快取
  檔案。
- 閘道技能上傳暫存現在使用共享的 `skill_uploads` 列。上傳
  中繼資料、冪等鍵和封存位元組位於 SQLite；安裝器只會在安裝
  執行期間收到暫時具現化的封存路徑。
- 子代理程式內嵌附件不再具現化於工作區
  `.openclaw/attachments/*` 下。spawn 路徑會準備 SQLite VFS 種子項目，
  內嵌執行會將這些項目植入每個代理程式的執行階段暫存命名空間，
  而磁碟後端工具會為附件路徑疊加該 SQLite 暫存區。舊的子代理程式執行
  attachment-dir 登錄欄位和清理鉤子已移除。
- 命令列介面圖片補水不再維護穩定的 `openclaw-cli-images` 快取
  檔案。外部命令列介面後端仍會接收檔案路徑，但這些路徑是每次執行的
  暫存具現化，並附有清理。
- 快取追蹤診斷、Anthropic 承載資料診斷、原始模型串流
  診斷、診斷時間軸事件和閘道穩定性套件現在會寫入 SQLite 列，
  而不是 `logs/*.jsonl` 或
  `logs/stability/*.json` 檔案。
  執行階段路徑覆寫旗標和環境變數已移除；匯出/除錯
  命令可以從資料庫列明確具現化檔案。
- macOS companion 不再有滾動式 `diagnostics.jsonl` writer。App
  日誌會寫入 unified logging，而持久閘道診斷仍由 SQLite 支援。
- macOS port-guardian 記錄清單現在使用具型別的共享 SQLite
  `macos_port_guardian_records` 列，而不是 Application Support JSON 檔案
  或不透明的單例 blob。
- 閘道單例鎖現在使用 `gateway_locks` 範圍下具型別的共享 SQLite
  `state_leases` 列，而不是暫存目錄鎖定檔。Fly 和 OAuth
  疑難排解文件現在指向 SQLite 租約/auth refresh lock，而不是過時的
  檔案鎖清理。
- 閘道重新啟動 sentinel 狀態現在使用具型別的共享 SQLite
  `gateway_restart_sentinel` 列，而不是 `restart-sentinel.json`；執行階段
  會從具型別欄位讀取 sentinel 種類、狀態、路由、訊息、延續和統計資料。
  `payload_json` 只是一份重播/除錯副本。執行階段程式碼會直接清除
  SQLite 列，且不再攜帶檔案清理管線。
- 閘道重新啟動意圖和 supervisor handoff 狀態現在使用具型別的共享
  SQLite `gateway_restart_intent` 和 `gateway_restart_handoff` 列，而不是
  `gateway-restart-intent.json` 和
  `gateway-supervisor-restart-handoff.json` sidecar。
- 閘道單例協調現在使用 `gateway_locks` 下具型別的 `state_leases` 列，
  而不是寫入 `gateway.<hash>.lock` 檔案。租約列擁有鎖定擁有者、
  到期時間、心跳偵測和除錯承載資料；SQLite 擁有原子取得/釋放邊界。
  已淘汰的檔案鎖目錄選項已移除；測試會直接使用 SQLite 列身分。
- 舊的未參照排程使用量報告輔助工具已刪除；它曾掃描 `cron/runs/*.jsonl`
  檔案。排程執行歷史報告應讀取具型別的
  `cron_run_logs` SQLite 列。
- 主要工作階段重新啟動復原現在會透過 SQLite `agent_databases`
  登錄探索候選代理程式，而不是掃描 `agents/*/sessions`
  目錄。
- Gemini 工作階段損毀復原現在只刪除 SQLite 工作階段列；
  它不再需要舊版 `storePath` 門檻，也不再嘗試取消連結衍生的
  transcript JSONL 路徑。
- 路徑覆寫處理現在會將字面 `undefined`/`null` 環境
  值視為未設定，避免測試或 shell handoff 期間意外產生 repo-root
  `undefined/state/*.sqlite` 資料庫。
- 設定健康指紋現在使用具型別的共享 SQLite `config_health_entries`
  列，而不是 `logs/config-health.json`，使一般設定檔成為唯一的非憑證
  設定文件。macOS companion 只保留程序本機健康狀態，且不會重新建立舊的
  JSON sidecar。
- Auth profile 執行階段不再匯入或寫入憑證 JSON 檔案。
  標準憑證儲存區是 SQLite；`auth-profiles.json`、每個代理程式的
  `auth.json` 和共享的 `credentials/oauth.json` 是 Doctor 遷移輸入，
  匯入後會移除。
- Auth profile 儲存/狀態測試現在會直接斷言具型別 SQLite auth 資料表，
  且只會將舊版 auth-profile 檔名用於 Doctor 遷移輸入。
- `openclaw secrets apply` 只會清理設定檔、env 檔案和 SQLite
  auth-profile 儲存區。它不再攜帶會編輯已淘汰每個代理程式
  `auth.json` 的相容性邏輯；Doctor 負責匯入並刪除該檔案。
- Hermes secret 遷移計畫和套用會將已匯入的 API-key profile 直接寫入
  SQLite auth-profile 儲存區。它不再將 `auth-profiles.json` 作為中繼目標
  來寫入或驗證。
- 面向使用者的 auth 文件現在描述
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`，而不是
  要求使用者檢查或複製 `auth-profiles.json`；舊版 OAuth/auth JSON
  名稱只會作為 Doctor 匯入輸入留在文件中。
- 核心狀態路徑輔助工具不再公開已淘汰的 `credentials/oauth.json`
  檔案。舊版檔名只在 Doctor auth 匯入路徑本機使用。
- 安裝、安全性、入門、模型 auth 和 SecretRef 文件現在描述
  SQLite auth-profile 列和整體狀態備份/遷移，而不是
  每個代理程式 auth-profile JSON 檔案。
- PI 模型探索現在會將標準憑證傳入記憶體中的
  `pi-coding-agent` auth 儲存區。探索期間不再建立、清理或寫入
  每個代理程式的 `auth.json`。
- Voice Wake 觸發器和路由設定現在使用具型別的共享 SQLite 資料表，
  而不是 `settings/voicewake.json`、`settings/voicewake-routing.json` 或
  不透明的通用列；Doctor 會匯入舊版 JSON 檔案，並在成功遷移後移除它們。
- 更新檢查狀態現在使用具型別的共享 `update_check_state` 列，而不是
  `update-check.json` 或不透明的通用 blob；Doctor 會匯入
  舊版 JSON 檔案，並在成功遷移後移除它。
- 設定健康狀態現在使用具型別的共享 `config_health_entries` 列，
  而不是 `logs/config-health.json` 或不透明的通用 blob；Doctor
  會匯入舊版 JSON 檔案，並在成功遷移後移除它。
- 外掛對話繫結核准現在使用具型別的
  `plugin_binding_approvals` 列，而不是不透明的共享 SQLite 狀態或
  `plugin-binding-approvals.json`；舊版檔案是 doctor 遷移輸入。
- 通用目前對話繫結現在會儲存具型別的
  `current_conversation_bindings` 資料列，而不是重寫
  `bindings/current-conversations.json`；doctor 會匯入舊版 JSON 檔案，並在成功遷移後
  移除它。
- Memory Wiki 匯入來源同步帳本現在會依每個 vault/source key 儲存一列 SQLite 外掛狀態，
  而不是重寫 `.openclaw-wiki/source-sync.json`；
  遷移提供者會匯入並移除舊版 JSON 帳本。
- Memory Wiki ChatGPT 匯入執行記錄現在會依每個 vault/run id 儲存一列 SQLite 外掛狀態，
  而不是寫入 `.openclaw-wiki/import-runs/*.json`。
  回復快照仍會保留為明確的 vault 檔案，直到匯入執行快照
  封存移至 blob 儲存空間。
- Memory Wiki 編譯摘要現在會儲存 SQLite 外掛 blob 資料列，而不是
  寫入 `.openclaw-wiki/cache/agent-digest.json` 和
  `.openclaw-wiki/cache/claims.jsonl`。遷移提供者會匯入舊快取
  檔案，並在快取目錄變空時移除該目錄。
- ClawHub skill 安裝追蹤現在會依每個
  workspace/skill 儲存一列 SQLite 外掛狀態，而不是在執行階段寫入或讀取
  `.clawhub/lock.json` 和
  `.clawhub/origin.json` sidecar。執行階段程式碼會使用受追蹤安裝
  狀態物件，而不是檔案形狀的 lockfile/origin 抽象。Doctor
  會從已設定的代理工作區匯入舊版 sidecar，並在乾淨匯入後移除它們。
- 已安裝外掛索引現在會讀寫具型別的共用 SQLite
  `installed_plugin_index` 單例資料列，而不是 `plugins/installs.json`；舊版
  JSON 檔案只作為 doctor 遷移輸入，並會在匯入後移除。
- 舊版 `plugins/installs.json` 路徑輔助工具現在位於 doctor 舊版
  程式碼中。執行階段外掛索引模組只公開 SQLite 後端的持久化
  選項，而不是 JSON 檔案路徑。
- Gateway 重新啟動哨兵、重新啟動意圖與 supervisor handoff 狀態現在使用
  具型別的共用 SQLite 資料列（`gateway_restart_sentinel`、
  `gateway_restart_intent` 和 `gateway_restart_handoff`），而不是通用
  不透明 blob。執行階段重新啟動程式碼沒有檔案形狀的 sentinel/intent/handoff
  合約。
- Matrix 同步快取、儲存中繼資料、執行緒繫結、傳入去重標記、
  啟動驗證冷卻狀態、SDK IndexedDB 加密快照、
  憑證與復原金鑰現在使用共用 SQLite 外掛 state/blob
  資料表。執行階段路徑結構不再公開 `storage-meta.json` 中繼資料
  路徑；該檔名只作為舊版遷移輸入。它們的舊版 JSON 匯入
  計畫位於 Matrix 外掛設定/doctor 遷移介面。
- Matrix 啟動不再掃描、回報或完成舊版 Matrix 檔案
  狀態。Matrix 檔案偵測、舊版加密快照建立、room-key
  還原遷移狀態、匯入與來源移除都由 doctor 擁有。
- Matrix 執行階段遷移 barrel 已移除。舊版 state/crypto 偵測
  與變更輔助工具由 Matrix doctor 直接匯入，而不是成為
  執行階段 API 介面的一部分。
- Matrix 遷移快照重用標記現在位於 SQLite 外掛狀態中，
  而不是 `matrix/migration-snapshot.json`；doctor 仍可重用同一份
  已驗證的遷移前封存，而不需寫入 sidecar 狀態檔。
- Nostr bus 游標與個人檔案發布狀態現在使用共用 SQLite 外掛
  狀態。它們的舊版 JSON 匯入計畫位於 Nostr 外掛設定/doctor
  遷移介面。
- 主動記憶工作階段切換現在使用共用 SQLite 外掛狀態，而不是
  `session-toggles.json`；重新開啟記憶時會刪除該資料列，而不是
  重寫 JSON 物件。
- Skill Workshop 提案與審查計數器現在使用共用 SQLite 外掛
  狀態，而不是每個工作區的 `skill-workshop/<workspace>.json` 儲存。每個
  提案都是 `skill-workshop/proposals` 下的獨立資料列，審查
  計數器則是 `skill-workshop/reviews` 下的獨立資料列。
- Skill Workshop 審查者子代理執行現在使用執行階段工作階段文字記錄
  解析器，而不是建立 `skill-workshop/<sessionId>.json` sidecar 工作階段
  路徑。
- ACPX 程序租約現在使用 `acpx/process-leases` 下的共用 SQLite 外掛狀態，
  而不是整檔式 `process-leases.json` 登錄。
  每個租約都儲存為自己的資料列，在沒有執行階段 JSON 重寫路徑的情況下
  保留啟動時清除過期程序的能力。
- ACPX 包裝腳本和隔離的 Codex home 會在
  OpenClaw 暫存根目錄中產生。它們會視需要重新建立，且不是備份或
  遷移輸入。
- 子代理執行登錄持久化使用具型別的共用 `subagent_runs` 資料列。舊的
  `subagents/runs.json` 路徑現在只作為 doctor 遷移輸入，且
  執行階段輔助工具名稱不再將狀態層描述為磁碟後端。
  執行階段測試不再建立無效或空的 `runs.json` fixture 來證明
  登錄行為；它們會直接植入/讀取 SQLite 資料列。
- 備份會先暫存狀態目錄再封存、複製非資料庫檔案、
  使用 `VACUUM INTO` 快照 `*.sqlite` 資料庫、省略即時 WAL/SHM
  sidecar、在封存清單中記錄快照中繼資料，並在 SQLite 中連同封存清單記錄
  已完成的備份執行。`openclaw backup
create` 預設會驗證寫入的封存；`--no-verify` 是
  明確的快速路徑。
- `openclaw backup restore` 會在解壓縮前驗證封存、重用
  驗證器的正規化清單，並將已驗證的清單資產還原到其
  記錄的來源路徑。它需要 `--yes` 才會寫入，並支援 `--dry-run`
  產生還原計畫。
- 舊的備份 volatile-path 篩選器已刪除。備份不再需要
  用於舊版工作階段或排程 JSON/JSONL 檔案的即時 tar 略過清單，因為 SQLite
  快照會在建立封存前先暫存。
- 一般設定與 onboarding 工作區準備不再建立
  `agents/<agentId>/sessions/` 目錄。它們只建立 config/workspace；
  SQLite 工作階段資料列與文字記錄資料列會在需要時於
  每個代理的資料庫中建立。
- 安全性權限修復現在以全域與每個代理的 SQLite
  資料庫以及 WAL/SHM sidecar 為目標，而不是 `sessions.json` 和文字記錄
  JSONL 檔案。
- 沙箱登錄執行階段名稱現在會直接描述 SQLite 登錄種類，
  而不是把舊版 JSON 登錄術語帶入作用中的儲存。
- `openclaw reset --scope config+creds+sessions` 會移除每個代理的
  `openclaw-agent.sqlite` 資料庫以及 WAL/SHM sidecar，而不只是舊版
  `sessions/` 目錄。
- Gateway 彙總工作階段輔助工具現在使用以項目為導向的名稱：
  `loadCombinedSessionEntriesForGateway` 會傳回 `{ databasePath, entries }`。
  舊的 combined-store 命名已從執行階段呼叫端移除。
- Docker MCP 頻道植入現在會將主要工作階段資料列與文字記錄
  事件寫入每個代理的 SQLite 資料庫，而不是建立
  `sessions.json` 和 JSONL 文字記錄。
- 內建 session-memory hook 現在會依 `{agentId, sessionId}` 從
  SQLite 解析前一個工作階段脈絡。它不再掃描、儲存或合成
  文字記錄路徑或 `workspace/sessions` 目錄。
- 內建 command-logger hook 現在會將命令稽核資料列寫入共用
  SQLite `command_log_entries` 資料表，而不是附加到
  `logs/commands.log`。
- 頻道配對允許清單現在只在執行階段和外掛 SDK 中公開 SQLite 後端的讀寫輔助工具。
  舊的 `*-allowFrom.json` 路徑解析器和
  檔案讀取器只存在於 doctor 舊版匯入程式碼下。
- `migration_runs` 會以狀態、時間戳記與 JSON 報告記錄舊版狀態遷移執行。
- `migration_sources` 會記錄每個匯入的舊版檔案來源，包含雜湊、大小、
  記錄數、目標資料表、執行 id、狀態與來源移除狀態。
- `backup_runs` 會記錄備份封存路徑、狀態與 JSON 清單。
- 全域 schema 不保留未使用的 `agents` 登錄資料表。代理
  資料庫探索是正式的 `agent_databases` 登錄，直到執行階段
  有真正的代理記錄擁有者。
- 產生的模型 catalog config 會儲存在具型別的全域 SQLite
  `agent_model_catalogs` 資料列中，並以代理目錄作為鍵。執行階段呼叫端使用
  `ensureOpenClawModelCatalog`；執行階段程式碼中沒有 `models.json` 相容性 API。
  實作會寫入 SQLite，且嵌入式 PI 登錄會從該儲存的 payload
  補水，而不建立 `models.json` 檔案。
- QMD 工作階段文字記錄 Markdown 匯出和 `memory.qmd.sessions` config 已
  移除。沒有 QMD 文字記錄集合、沒有 `qmd/sessions*` 執行階段
  路徑，也沒有檔案後端的工作階段記憶橋接。
- memory-core 執行階段會從
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` 匯入 SQLite 文字記錄索引輔助工具，
  而不是 QMD SDK 子路徑。QMD 子路徑只為
  外部呼叫端保留相容性重新匯出，直到主要 SDK 清理可以移除它。
- QMD 自己的 `index.sqlite` 現在是由主要 SQLite `plugin_blob_entries` 資料表支援的暫存
  執行階段具體化。執行階段不再建立持久的
  `~/.openclaw/agents/<agentId>/qmd` sidecar。
- 選用的 `memory-lancedb` 外掛不再建立
  `~/.openclaw/memory/lancedb` 作為隱含的 OpenClaw 受管理儲存。它是
  外部 LanceDB 後端，並會保持停用，直到操作員設定明確的
  `dbPath`。
- `check:database-first-legacy-stores` 會讓新的執行階段來源失敗，只要它把
  舊版儲存名稱與寫入式檔案系統 API 配對。它也會讓重新引入已退役文字記錄橋接標記
  `transcriptLocator` 或 `sqlite-transcript://...` 的執行階段來源失敗。遷移、doctor、匯入
  和明確的非工作階段匯出程式碼仍允許。較廣泛的舊版合約
  名稱，例如 `sessionFile`、`storePath` 和舊的 `SessionManager` 檔案時代
  facade 仍有目前擁有者，且需要另外的遷移防護工作
  才能成為必要的預檢查。該防護現在也涵蓋
  執行階段 `cache/*.json` 儲存、通用
  `thread-bindings.json` sidecar、排程 state/run-log JSON、config health JSON、
  restart 和 lock sidecar、Voice Wake 設定、外掛繫結核准、
  已安裝外掛索引 JSON、File Transfer 稽核 JSONL、Memory Wiki 活動
  記錄、舊的內建 `command-logger` 文字記錄，以及 pi-mono raw-stream JSONL
  診斷旋鈕。它也禁止舊的根層級 doctor 舊版模組名稱，使
  相容性程式碼保持在 `src/commands/doctor/` 下。Android debug handler
  也會使用 logcat/in-memory 輸出，而不是暫存 `camera_debug.log` 或
  `debug_logs.txt` 快取檔案。

## 目標結構描述形狀

保持結構描述明確。主機擁有的運行時狀態使用型別化資料表。外掛擁有的
不透明狀態使用 `plugin_state_entries` / `plugin_blob_entries`；沒有通用的
主機 `kv` 資料表。

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
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

代理資料庫：

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
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

未來搜尋可以新增 FTS 資料表，而不需變更標準事件資料表：

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

大型值應使用 `blob` 欄位，而不是 JSON 字串編碼。保留
`value_json` 給必須能用一般 SQLite 工具檢視的小型結構化資料。

`agent_databases` 是此分支的標準登錄。不要新增
`agents` 資料表，直到真正的代理記錄擁有者存在；代理設定仍保留在
`openclaw.json`。

## Doctor 遷移形狀

Doctor 應呼叫一個明確的遷移步驟，該步驟可回報且可安全重新執行：

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` 會在一般設定預檢之後叫用狀態遷移實作，並在匯入前建立已驗證的備份。運行時
啟動和 `openclaw migrate` 不得匯入舊版 OpenClaw 狀態檔案。

遷移屬性：

- 一次遷移流程會探索所有舊版檔案來源，並在變更任何內容前產生計畫。
- Doctor 會在匯入舊版檔案前建立已驗證的遷移前備份封存。
- 匯入具備冪等性，並以來源路徑、mtime、大小、雜湊和目標
  資料表作為鍵。
- 成功的來源檔案會在目標資料庫提交後移除或封存。
- 匯入失敗會保持來源不變，並在
  `migration_runs` 中記錄警告。
- 遷移存在之後，運行時程式碼只讀取 SQLite。
- 不需要降級或匯出至運行時檔案的路徑。

## 遷移清單

將這些移入全域資料庫：

- 工作登錄檔執行階段寫入現在使用共用資料庫；未發布的
  `tasks/runs.sqlite` 附屬匯入器已刪除。快照儲存會依工作
  ID upsert，且只刪除缺少的工作/遞送列。
- Task Flow 執行階段寫入現在使用共用資料庫；未發布的
  `tasks/flows/registry.sqlite` 附屬匯入器已刪除。快照儲存會
  依流程 ID upsert，且只刪除缺少的流程列。
- 外掛狀態執行階段寫入現在使用共用資料庫；未發布的
  `plugin-state/state.sqlite` 附屬匯入器已刪除。
- 內建記憶搜尋不再預設使用 `memory/<agentId>.sqlite`；其
  索引資料表位於所屬的代理資料庫中，且明確的
  `memorySearch.store.path` 附屬 opt-in 已退役到 doctor 設定
  遷移。
- 內建記憶重新索引只會重設代理資料庫中由記憶擁有的資料表。
  它不得取代整個 SQLite 檔案，因為同一個資料庫也擁有
  工作階段、逐字稿、VFS 列、成品和執行階段快取。
- 來自單體與分片 JSON 的沙盒容器/瀏覽器登錄檔。執行階段
  寫入現在使用共用資料庫；仍保留舊版 JSON 匯入。
- 排程工作定義、排程狀態和執行歷史現在使用共用 SQLite；
  doctor 會匯入/移除舊版 `jobs.json`、`jobs-state.json` 和
  `cron/runs/*.jsonl` 檔案
- 裝置身分/驗證、推送、更新檢查、承諾、OpenRouter 模型
  快取、已安裝外掛索引和 app-server 繫結
- 裝置/節點配對和啟動記錄現在使用型別化 SQLite 資料表
- 裝置配對通知訂閱者和已遞送請求標記現在使用共用 SQLite
  外掛狀態資料表，而不是 `device-pair-notify.json`。
- 語音通話記錄現在使用 `voice-call` / `calls` 命名空間下的
  共用 SQLite 外掛狀態資料表，而不是 `calls.jsonl`；外掛命令列介面
  會 tail 並摘要由 SQLite 支援的通話歷史。
- QQ Bot 閘道工作階段、已知使用者記錄和 ref-index 引用快取現在使用
  `qqbot` 命名空間（`sessions`、`known-users`、
  `ref-index`）下的 SQLite 外掛狀態，而不是 `session-*.json`、
  `known-users.json` 和 `ref-index.jsonl`；QQ Bot doctor/setup
  遷移會匯入並移除舊版檔案。
- Discord 模型選擇器偏好設定、命令部署雜湊和執行緒繫結
  現在使用 `discord` 命名空間
  （`model-picker-preferences`、`command-deploy-hashes`、`thread-bindings`）
  下的 SQLite 外掛狀態，而不是 `model-picker-preferences.json`、
  `command-deploy-cache.json` 和
  `thread-bindings.json`；Discord doctor/setup 遷移會匯入並
  移除舊版檔案。
- BlueBubbles catchup 游標和入站去重標記現在使用 `bluebubbles`
  命名空間（`catchup-cursors`、`inbound-dedupe`）下的 SQLite 外掛
  狀態，而不是 `bluebubbles/catchup/*.json` 和
  `bluebubbles/inbound-dedupe/*.json`；BlueBubbles doctor/setup 遷移
  會匯入並移除舊版檔案。
- Telegram 更新 offset、貼圖快取項目、回覆鏈訊息快取
  項目、已傳送訊息快取項目、主題名稱快取項目和執行緒
  繫結現在使用 `telegram` 命名空間
  （`update-offsets`、`sticker-cache`、`message-cache`、`sent-messages`、
  `topic-names`、`thread-bindings`）下的 SQLite 外掛狀態，
  而不是 `update-offset-*.json`、
  `sticker-cache.json`、`*.telegram-messages.json`、
  `*.telegram-sent-messages.json`、`*.telegram-topic-names.json` 和
  `thread-bindings-*.json`；Telegram doctor/setup 遷移會匯入並
  移除舊版檔案。
- iMessage catchup 游標、回覆 short-id 對應和 sent-echo 去重列
  現在使用 `imessage` 命名空間（`catchup-cursors`、
  `reply-cache`、`sent-echoes`）下的 SQLite 外掛狀態，而不是
  `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl` 和 `imessage/sent-echoes.jsonl`；iMessage
  doctor/setup 遷移會匯入並移除舊版檔案。
- Microsoft Teams 對話、投票、SSO 權杖和回饋學習現在
  使用 SQLite 外掛狀態命名空間（`conversations`、`polls`、`sso-tokens`、
  `feedback-learnings`），而不是 `msteams-conversations.json`、
  `msteams-polls.json`、`msteams-sso-tokens.json` 和 `*.learnings.json`；Microsoft Teams
  doctor/setup 遷移會匯入並封存舊版檔案。
  待處理上傳是短期 SQLite 快取，舊的 JSON 快取檔案不會
  遷移。
- Matrix 同步快取、儲存中繼資料、執行緒繫結、入站去重標記、
  啟動驗證 cooldown 狀態、認證、復原金鑰和 SDK
  IndexedDB 加密快照現在使用 `matrix` 下的 SQLite 外掛狀態/blob
  命名空間（`sync-store`、`storage-meta`、`thread-bindings`、`inbound-dedupe`、
  `startup-verification`、`credentials`、`recovery-key`、`idb-snapshots`），
  而不是 `bot-storage.json`、`storage-meta.json`、`thread-bindings.json`、
  `inbound-dedupe.json`、`startup-verification.json`、`credentials.json`、
  `recovery-key.json` 和 `crypto-idb-snapshot.json`；Matrix doctor/setup
  遷移會從帳號範圍的 Matrix 儲存根目錄匯入並移除這些舊版檔案。
- Nostr 匯流排游標和個人檔案發布狀態現在使用 `nostr` 命名空間
  （`bus-state`、`profile-state`）下的 SQLite 外掛狀態，而不是
  `bus-state-*.json` 和 `profile-state-*.json`；Nostr doctor/setup
  遷移會匯入並移除舊版檔案。
- 主動記憶工作階段切換現在使用
  `active-memory/session-toggles` 下的 SQLite 外掛狀態，而不是 `session-toggles.json`。
- Skill Workshop 提案佇列和審查計數器現在使用
  `skill-workshop/proposals` 和 `skill-workshop/reviews` 下的 SQLite 外掛狀態，而不是
  每個工作區的 `skill-workshop/<workspace>.json` 檔案。
- 外送遞送和工作階段遞送佇列現在共用全域 SQLite
  `delivery_queue_entries` 資料表，並使用不同的佇列名稱
  （`outbound-delivery`、`session-delivery`），而不是持久化的
  `delivery-queue/*.json`、`delivery-queue/failed/*.json` 和
  `session-delivery-queue/*.json` 檔案。doctor legacy-state 步驟會匯入
  待處理和失敗列、移除過時的已遞送標記，並在匯入後刪除舊的
  JSON 檔案。熱路由和重試欄位是型別化欄位；JSON payload 只保留用於
  replay/debug。
- ACPX 程序 lease 現在使用 `acpx/process-leases` 下的 SQLite 外掛狀態，
  而不是 `process-leases.json`。
- 備份和遷移執行中繼資料

將這些移入代理資料庫：

- 代理工作階段根目錄和相容性形狀的 session-entry payload。執行階段寫入已完成：
  熱工作階段中繼資料可在 `sessions` 中查詢，而
  舊版形狀的完整 `SessionEntry` payload 仍保留在 `session_entries`。
- 代理逐字稿事件。執行階段寫入已完成。
- 壓縮檢查點和逐字稿快照。執行階段寫入已完成：
  檢查點逐字稿副本是 SQLite 逐字稿列，檢查點
  中繼資料記錄在 `transcript_snapshots`。閘道檢查點 helper
  現在將這些值命名為逐字稿快照，而不是來源檔案。
- 代理 VFS scratch/workspace 命名空間。執行階段 VFS 寫入已完成。
- 子代理附件 payload。執行階段寫入已完成：它們是 SQLite VFS
  seed 項目，絕不會是持久化工作區檔案。
- 工具成品。執行階段寫入已完成。
- 執行成品。透過每個代理的
  `run_artifacts` 資料表完成 worker 執行階段寫入。
- 代理本機執行階段快取。透過每個代理的
  `cache_entries` 資料表完成 worker 執行階段範圍快取寫入。閘道範圍的模型快取
  會留在全域資料庫中，除非它們變成代理特定。
- ACP 父串流日誌。執行階段寫入已完成。
- ACP replay ledger 工作階段。透過
  `acp_replay_sessions` 和 `acp_replay_events` 完成執行階段寫入；舊版 `acp/event-ledger.json`
  只保留作為 doctor 輸入。
- ACP 工作階段中繼資料。透過 `acp_sessions` 完成執行階段寫入；`sessions.json` 中的舊版
  `entry.acp` 區塊僅作為 doctor 遷移輸入。
- 當 trajectory 附屬檔不是明確匯出檔案時。執行階段
  寫入已完成：trajectory 擷取會寫入代理資料庫 `trajectory_runtime_events`
  列，並將執行範圍的成品鏡像到 SQLite。舊版附屬檔只作為 doctor
  匯入輸入；匯出可具現化新的 JSONL 支援套件輸出，
  但不會在執行階段讀取或遷移舊的 trajectory/逐字稿附屬檔。
  執行階段 trajectory 擷取會暴露 SQLite 範圍；JSONL 路徑 helper
  隔離於匯出/debug 支援，且不會從執行階段模組重新匯出。
  embedded-runner trajectory 中繼資料會記錄 `{agentId, sessionId, sessionKey}`
  身分，而不是持久化逐字稿 locator。

這些目前仍保留檔案支援：

- `openclaw.json`
- provider 或命令列介面認證檔案
- 外掛/package manifests
- 選擇磁碟模式時的使用者工作區和 Git 儲存庫
- 供操作員 tail 的日誌，除非特定日誌介面已被移動

## 遷移計畫

### 階段 0：凍結邊界

在移動更多列之前，明確定義持久狀態邊界：

- 將 `migration_runs` 資料表新增到全域資料庫。
  已針對 legacy-state 遷移執行報告完成。
- 新增單一由 doctor 擁有的狀態遷移服務，用於 file-to-database 匯入。
  已完成：`openclaw doctor --fix` 使用 legacy-state 遷移實作。
- 讓 `plan` 成為唯讀，並讓 `apply` 建立備份、匯入、驗證，
  然後刪除或隔離舊檔案。
  已完成：doctor 會建立已驗證的遷移前備份，將備份路徑
  傳入 `migration_runs`，並重用匯入器/移除路徑。
- 新增靜態禁止規則，讓新的執行階段程式碼無法寫入舊版狀態檔，同時
  遷移程式碼和測試仍可 seed/read 它們。
  已針對目前已遷移的舊版儲存完成；該 guard 也會掃描巢狀
  測試中被禁止的執行階段逐字稿 locator contract。

### 階段 1：完成全域控制平面

將共用協調狀態保留在 `state/openclaw.sqlite`：

- 代理和代理資料庫登錄檔
- 工作和 Task Flow ledger
- 外掛狀態
- 沙盒容器/瀏覽器登錄檔
- Cron/scheduler 執行歷史
- 配對、裝置、推送、更新檢查、終端介面、OpenRouter/模型快取和其他
  小型閘道範圍執行階段狀態
- 備份和遷移中繼資料
- 閘道媒體附件位元組。執行階段寫入已完成；直接檔案路徑
  是為了與頻道傳送器和沙盒 staging 相容而產生的暫時具現化。
  執行階段 allowlist 接受 SQLite 具現化路徑，而不是舊版
  狀態/設定媒體根目錄。doctor 會將舊版媒體檔案匯入
  `media_blobs`，並在列寫入成功後移除來源檔案。
- Debug proxy 擷取工作階段、事件和 payload blob。已完成：擷取存在
  共用狀態資料庫中，並透過共用狀態資料庫 bootstrap、schema、
  WAL 和 busy-timeout 設定開啟。Payload 位元組會以 gzip 壓縮在
  `capture_blobs.data` 中；沒有 debug proxy 執行階段附屬資料庫覆寫、
  blob 目錄，或僅限 proxy-capture 的產生式 schema/codegen target。
  Doctor/startup 遷移會匯入已發布的 `debug-proxy/capture.sqlite` 列
  和被引用的 payload blob，包括作用中的舊版資料庫/blob 環境
  覆寫，然後封存這些來源，同時保留 CA 憑證。

此階段也會從這些子系統刪除重複的附屬 opener、權限 helper、WAL
設定、檔案系統 pruning 和相容性 writer。

### 階段 2：引入每代理資料庫

為每個代理建立一個資料庫，並從全域資料庫註冊它：

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

全域 `agent_databases` 列會儲存路徑、schema 版本、last-seen
時間戳，以及基本大小/完整性中繼資料。執行階段程式碼會向登錄檔要求
代理資料庫，而不是直接推導檔案路徑。

代理資料庫擁有：

- `sessions` 作為標準工作階段根，`session_entries` 作為附加到該根的
  相容形狀酬載資料表，而 `session_routes` 作為唯一作用中的 `session_key` 查找
- `conversations` 與 `session_conversations` 作為附加到工作階段的正規化提供者
  路由身分
- `transcript_events`
- 對話紀錄快照與壓縮檢查點。執行階段寫入已完成。
- `vfs_entries`
- `tool_artifacts` 與執行成品
- 代理程式本機執行階段/快取資料列。工作者範圍快取已完成。
- ACP 父串流事件
- 軌跡執行階段事件，當它們不是明確的匯出成品時

### 第 3 階段：取代工作階段儲存區 API

執行階段已完成。檔案形狀的工作階段儲存區介面不是作用中的
執行階段合約：

- 執行階段不再呼叫 `loadSessionStore(storePath)`，也不再將 `storePath` 視為
  工作階段身分。
- 執行階段資料列操作為 `getSessionEntry`、`upsertSessionEntry`、
  `patchSessionEntry`、`deleteSessionEntry` 與 `listSessionEntries`。
- 整個儲存區重寫輔助工具、檔案寫入器、佇列測試、別名修剪，以及
  舊版鍵刪除參數都已從執行階段移除。
- 已淘汰的根套件相容性匯出仍會將標準
  `sessions.json` 路徑適配到 SQLite 資料列 API。
- `sessions.json` 剖析只保留在 doctor 遷移/匯入程式碼與
  doctor 測試中。
- 執行階段生命週期備援會讀取 SQLite 對話紀錄標頭，而不是先讀取 JSONL
  第一行。

持續刪除任何重新引入檔案鎖參數、
修剪/截斷作為檔案維護用語、儲存區路徑身分，或唯一斷言為 JSON 持久化的測試。

### 第 4 階段：移動對話紀錄、ACP 串流、軌跡與 VFS

讓每個代理程式資料串流都原生使用資料庫：

- 對話紀錄附加寫入會透過一個 SQLite 交易完成，該交易會確保
  工作階段標頭、檢查訊息冪等性、選取父尾端、插入
  `transcript_events`，並在 `transcript_event_identities` 中記錄可查詢的
  身分中繼資料。直接對話紀錄訊息附加與一般持久化
  `TranscriptSessionManager` 附加已完成；明確分支操作會保留其明確父項選擇，
  且仍會寫入 SQLite 資料列，而不推導任何檔案定位器。
- ACP 父串流記錄會成為資料列，而不是 `.acp-stream.jsonl` 檔案。已完成。
- ACP 衍生設定不再持久化對話紀錄 JSONL 路徑。已完成。
- 執行階段軌跡擷取會直接寫入事件資料列/成品。明確的
  支援/匯出命令仍可產生支援包 JSONL 成品作為匯出格式，但工作階段匯出不會重新建立工作階段 JSONL。已完成。
- 磁碟工作區在設定為磁碟模式時會保留在磁碟上。
- VFS 暫存與實驗性純 VFS 工作區模式會使用代理程式 DB。

遷移會一次性匯入舊 JSONL 檔案，在
`migration_runs` 中記錄計數/雜湊，並在完整性檢查後移除已匯入檔案。

### 第 5 階段：備份、還原、清理與驗證

備份仍維持單一封存檔：

- 對每個全域與代理程式資料庫建立檢查點。
- 使用 SQLite 備份語意或 `VACUUM INTO` 對每個 DB 建立快照。
- 封存壓縮後的 DB 快照、設定、外部憑證與要求的
  工作區匯出。
- 省略原始即時 `*.sqlite-wal` 與 `*.sqlite-shm` 檔案。
- 透過開啟每個 DB 快照並執行 `PRAGMA integrity_check` 進行驗證。
  `openclaw backup create` 預設會執行此封存驗證；
  `--no-verify` 只會略過寫入後的封存階段，而不是快照
  建立完整性檢查。
- 還原會將快照複製回其目標路徑。此分支會將
  尚未發布的 SQLite 版面配置重設為 `user_version = 1`；未來已發布的結構描述變更
  可在需要時加入明確遷移。

### 第 6 階段：工作者執行階段

在資料庫拆分落地時，保持工作者模式為實驗性：

- 工作者會收到代理程式 ID、執行 ID、檔案系統模式與 DB 登錄身分。
- 每個工作者會開啟自己的 SQLite 連線。
- 父項保留通道傳遞、核准、設定與取消權限。
- 先從每個作用中執行一個工作者開始；只有在生命週期與 DB
  連線所有權穩定後才加入集區。

### 第 7 階段：刪除舊世界

執行階段工作階段管理已完成。舊世界只允許作為明確的
doctor 輸入或支援/匯出輸出：

- 沒有執行階段 `sessions.json`、對話紀錄 JSONL、沙箱登錄 JSON、任務
  附屬 SQLite，或外掛狀態附屬 SQLite 寫入。
- 沒有 JSON/工作階段檔案修剪、檔案對話紀錄截斷、工作階段檔案鎖，
  或鎖形狀工作階段測試。
- 沒有目的在於讓舊工作階段檔案保持最新的執行階段相容性匯出。
- 明確支援匯出仍是使用者要求的封存/具體化
  格式，且不得將檔案名稱回饋到執行階段身分。

## 備份與還原

備份應該是一個封存檔，但資料庫擷取應該
原生使用 SQLite：

1. 停止長時間執行的寫入活動，或進入短暫的備份屏障。
2. 對每個全域與代理程式資料庫執行檢查點。
3. 使用 SQLite 備份語意或 `VACUUM INTO`，將每個資料庫快照到
   暫存備份目錄。
4. 封存壓縮後的資料庫快照、設定檔、憑證目錄、
   選取的工作區與清單。
5. 透過開啟每個包含的 SQLite 快照並執行
   `PRAGMA integrity_check` 來驗證封存。
   `openclaw backup create` 預設會執行此操作；`--no-verify` 只用於
   有意略過寫入後的封存階段。

不要依賴原始即時 `*.sqlite`、`*.sqlite-wal` 與 `*.sqlite-shm` 複本作為
主要備份格式。封存清單應記錄資料庫角色、
代理程式 ID、結構描述版本、來源路徑、快照路徑、位元組大小與完整性
狀態。

還原應從封存快照重建全域資料庫與代理程式資料庫檔案。
由於 SQLite 版面配置尚未發布，此重構只保留第 1 版結構描述加上 doctor
檔案到資料庫匯入。還原命令會先驗證封存，然後從已驗證的解壓酬載
取代每個清單資產。

## 執行階段重構計畫

1. 新增資料庫登錄 API。
   - 解析全域 DB 與各代理程式 DB 路徑。
   - 將尚未發布的結構描述保持在 `user_version = 1`；在已發布的結構描述需要前，
     不要加入結構描述遷移執行器程式碼。
   - 新增測試、備份與 doctor 使用的關閉/檢查點/完整性輔助工具。

2. 收斂附屬 SQLite 儲存區。
   - 將外掛狀態資料表移入全域資料庫。執行階段
     寫入已完成；尚未發布的舊版附屬匯入器已刪除。
   - 將任務登錄資料表移入全域資料庫。執行階段
     寫入已完成；尚未發布的舊版附屬匯入器已刪除。
   - 將 Task Flow 資料表移入全域資料庫。執行階段寫入已完成；
     尚未發布的舊版附屬匯入器已刪除。
   - 將內建記憶體搜尋資料表移入每個代理程式資料庫。已完成；明確的
     自訂 `memorySearch.store.path` 現在會由 doctor 設定遷移移除。
     完整重新索引會只針對記憶體資料表原地執行；舊的整檔
     交換路徑與附屬索引交換輔助工具已刪除。
   - 從這些子系統中刪除重複的資料庫開啟器、WAL 設定、權限輔助工具與
     關閉路徑。

3. 將代理程式擁有的資料表移入各代理程式資料庫。
   - 透過全域資料庫登錄依需求建立代理程式 DB。已完成。
   - 將執行階段工作階段項目、對話紀錄事件、VFS 資料列與工具
     成品移至代理程式 DB。已完成。
   - 不要遷移分支本機共享 DB 工作階段項目、對話紀錄事件、
     VFS 資料列或工具成品；該版面配置從未發布。只在 doctor 中保留舊版
     檔案到資料庫匯入。

4. 取代工作階段儲存區 API。
   - 移除 `storePath` 作為執行階段身分。執行階段已完成，並由
     `check:database-first-legacy-stores` 保護：工作階段中繼資料、路由更新、
     命令持久化、命令列介面工作階段清理、Feishu 推理預覽、
     對話紀錄狀態持久化、子代理程式深度、驗證設定檔工作階段
     覆寫、父項分叉邏輯與 QA 實驗室檢查，現在都會從標準代理程式/工作階段鍵解析
     資料庫。
     閘道/終端介面/UI/macOS 工作階段清單回應現在會公開 `databasePath`
     而不是舊版 `path`；macOS 偵錯介面會將各代理程式資料庫
     顯示為唯讀狀態，而不是寫入 `session.store` 設定。
     `/status`、聊天驅動軌跡匯出與命令列介面相依性代理不再
     傳播舊版儲存區路徑；對話紀錄使用量備援會依代理程式/工作階段身分讀取
     SQLite。執行階段與橋接測試不再公開
     `storePath`；doctor/遷移輸入擁有該舊版欄位名稱。
     閘道組合工作階段載入不再針對
     非樣板化 `session.store` 值有特殊執行階段分支；它會彙總各代理程式 SQLite 資料列。
     舊版工作階段鎖 doctor 路徑及其 `.jsonl.lock` 清理輔助工具
     已移除；SQLite 現在是工作階段並行邊界。
     熱門執行階段呼叫站台使用資料列導向的輔助工具名稱，例如
     `resolveSessionRowEntry`；舊的 `resolveSessionStoreEntry` 相容性
     別名已從執行階段與外掛 SDK 匯出中移除。

- 使用 `{ agentId, sessionKey }` 資料列操作。
  已完成：`getSessionEntry`、`upsertSessionEntry`、`deleteSessionEntry`、
  `patchSessionEntry` 與 `listSessionEntries` 是 SQLite 優先 API，不
  需要工作階段儲存區路徑。狀態摘要、本機代理程式狀態、健康狀態，
  以及 `openclaw sessions` 清單命令現在會直接讀取各代理程式資料列，
  並顯示各代理程式 SQLite 資料庫路徑，而不是 `sessions.json` 路徑。
- 以 `upsertSessionEntry`、`deleteSessionEntry`、`listSessionEntries`
  與 SQL 清理查詢取代整個儲存區刪除/插入。
  執行階段已完成：熱門路徑現在使用資料列 API 與衝突重試的資料列修補；
  剩餘的整個儲存區匯入/取代輔助工具僅限於遷移匯入
  程式碼與 SQLite 後端測試。
  - 刪除 `store-writer.ts` 與寫入器佇列測試。已完成。
  - 從工作階段資料列 upsert/patch 中刪除執行階段舊版鍵修剪與別名刪除參數。已完成。

5. 刪除執行階段 JSON 登錄行為。
   - 讓沙箱登錄讀取與寫入僅使用 SQLite。已完成。
   - 只從遷移步驟匯入單體與分片 JSON。已完成。
   - 移除分片登錄鎖與 JSON 寫入。已完成。

- 如果形狀仍是熱路徑操作狀態，保留一個型別化登錄資料表，而不是將登錄資料列儲存為通用
  不透明 JSON。已完成。

6. 刪除檔案鎖形狀的工作階段變更。
   - 執行階段鎖建立與執行階段鎖 API 已完成。
   - 獨立的舊版 `.jsonl.lock` doctor 清理路徑已移除。
   - `session.writeLock` 是由 doctor 遷移的舊版設定，而不是型別化執行階段
     設定。
   - 狀態完整性不再有單獨的孤立對話紀錄檔案修剪
     路徑；doctor 遷移會在單一位置匯入/移除舊版 JSONL 來源。
   - 閘道單例協調會在
     `gateway_locks` 底下使用型別化 SQLite `state_leases` 資料列，且不再公開檔案鎖目錄介面。
   - 通用外掛 SDK 去重持久化不再使用檔案鎖或 JSON
     檔案；它會寫入共享 SQLite 外掛狀態資料列。已完成。
   - QMD 嵌入協調會使用 SQLite 狀態租約，而不是
     `qmd/embed.lock`。已完成。

7. 讓工作者具備資料庫感知能力。
   - 工作者會開啟自己的 SQLite 連線。
   - 父項擁有傳遞、通道回呼與設定。
   - 工作者會收到代理程式 ID、執行 ID、檔案系統模式與 DB 登錄
     身分，而不是即時控制代碼。
   - `vfs-only` 保持實驗性，並使用代理程式資料庫作為其儲存
     根。
   - 先保持每個作用中執行一個工作者。集區可以等到 DB 連線
     生命週期與取消行為穩定後再處理。

8. 備份整合。
   - 教導備份透過 SQLite backup 或 `VACUUM INTO` 對全域與 agent 資料庫建立快照。已針對 state asset 下探索到的 `*.sqlite` 檔案完成。
   - 新增 SQLite 完整性與 schema 版本的備份驗證。已針對備份建立與預設封存驗證完整性檢查完成。
   - 在 SQLite 中記錄備份執行中繼資料。已透過共用的 `backup_runs` 資料表完成，包含封存路徑、狀態與 manifest JSON。
   - 新增從已驗證封存快照還原。已完成：`openclaw backup
restore` 會在解壓前驗證、使用驗證器的正規化 manifest、支援 `--dry-run`，並要求在取代已記錄來源路徑前提供 `--yes`。
   - 僅在要求時才包含 VFS/workspace 匯出；不要將 session 內部資料匯出為 JSON 或 JSONL。

9. 刪除過時的測試與程式碼。已針對已知執行階段 session 表面完成。

- 移除斷言執行階段會建立 `sessions.json` 或 transcript JSONL 檔案的測試。已針對 core session store、chat、閘道 transcript 事件、preview、lifecycle、command session-entry updates、auto-reply reset/trace，以及 memory-core dreaming fixtures、approval target routing、session transcript repair、security permission repair、trajectory export 和 session export 完成。
  Active-memory transcript 測試現在會斷言 SQLite scopes，且不會建立暫存或持久化 JSONL 檔案。
  舊的 heartbeat transcript-pruning regression 已移除，因為執行階段不再截斷 JSONL transcripts。
  Agent session-list tool 測試不再將 legacy `sessions.json` 路徑建模為閘道回應形狀；app/UI/macOS 測試使用 `databasePath`。
  `/status` transcript-usage 測試現在直接植入 SQLite transcript rows，而不是寫入 JSONL 檔案。
  閘道 session lifecycle 測試現在直接使用 SQLite transcript seeding helpers；舊的單行 session-file fixture 形狀已從 reset 與 delete 覆蓋範圍中移除。
  `sessions.delete` 不再回傳 file-era `archived: []` 欄位；刪除只報告 row mutation 結果。舊的 `deleteTranscript` 選項也已移除：刪除 session 會移除 canonical `sessions` root，並讓 SQLite cascade session 擁有的 transcript、snapshot 與 trajectory rows，因此沒有呼叫端能留下 transcript orphan 或忘記 cleanup branch。
  Context-engine trajectory capture 測試現在會從隔離的 agent database 讀取 `trajectory_runtime_events` rows，而不是讀取 `session.trajectory.jsonl`。
  Docker MCP channel seed scripts 現在直接植入 SQLite rows。直接寫入 `sessions.json` 僅限於 doctor fixtures。
  Tool Search Gateway E2E 會從 SQLite transcript rows 讀取 tool-call evidence，而不是掃描 `agents/<agentId>/sessions/*.jsonl` 檔案。
  Memory-core host events 與 session-corpus scratch rows 現在存放在共用 SQLite plugin-state；`events.jsonl` 與 `session-corpus/*.txt` 僅作為 legacy doctor migration inputs。Active rows 使用 `memory/session-ingestion/` virtual paths，而不是 `.dreams/session-corpus`。舊的 memory-core dreaming repair module 及其命令列介面/閘道測試已移除，因為執行階段不再擁有該 corpus 的 file archive repair。Memory-core bridge/public-artifact 測試不再顯示 `.dreams/events.jsonl`；它們使用 SQLite-backed virtual JSON artifact name。
  Public SDK/Codex testing docs 現在說明 SQLite session state，而非 session files，且 channel-turn 範例不再揭露 `storePath` argument。
  Matrix sync state 現在直接使用 SQLite plugin-state store。Active client/runtime contracts 傳入 account storage root，而不是 `bot-storage.json` 路徑，且 doctor 會在刪除來源前將 legacy `bot-storage.json` 匯入 SQLite。QA Matrix restart/destructive scenarios 現在直接 mutate SQLite sync row，而不是建立或刪除假的 `bot-storage.json` 檔案，且 E2EE substrate 傳入 sync-store root，而不是假的 `sync-store.json` 路徑。
  Matrix storage-root selection 不再依 legacy sync/thread JSON 檔案為 roots 評分；它使用 durable root metadata 加上真正的 crypto state。
  Runtime SQLite session backend test suite 不再偽造 `sessions.json`；legacy source fixtures 現在位於匯入它們的 doctor tests。
  閘道 session 測試不再暴露 `createSessionStoreDir` helper 或未使用的 temp session-store path setup；fixture dirs 是明確的，且 direct row setup 使用 SQLite session-row naming。
  Doctor-only JSON5 session-store parser coverage 已從 infra tests 移至 doctor migration tests，因此 runtime test suites 不再擁有 legacy session-file parsing。
  Microsoft Teams runtime SSO/pending-upload 測試不再攜帶 JSON sidecar fixtures 或 parsers；legacy SSO token parsing 僅存在於外掛 migration module。Telegram 測試不再植入假的 `/tmp/*.json` store paths；它們會直接重設 SQLite-backed message cache。泛用 OpenClaw test-state helper 不再暴露 legacy `auth-profiles.json` writer；doctor auth migration tests 在本地擁有該 fixture。
  Runtime tests for 終端介面 last-session pointers、exec approvals、active-memory toggles、Matrix dedupe/startup verification、Memory Wiki source sync、current-conversation bindings、onboarding auth 和 Hermes secret imports 不再製造舊 sidecar files 或斷言舊檔名不存在。它們透過 SQLite rows 與 public store APIs 證明行為；doctor/migration tests 是唯一應該出現 legacy source filenames 的地方。
  Runtime tests for device/node pairing、channel allowFrom、restart intents、restart handoff、session delivery queue entries、config health、iMessage caches、排程 jobs、PI transcript headers、subagent registries 和 managed image attachments 也不再建立已退役的 JSON/JSONL 檔案，只為證明它們被忽略或不存在。
  PI overflow recovery 不再有 SessionManager rewrite/truncation fallback：tool-result truncation 與 context-engine transcript rewrites 會 mutate SQLite transcript rows，然後從資料庫 refresh active prompt state。
  Persisted SessionManager message appends delegate 給 atomic SQLite transcript append helper，用於 parent selection 與 idempotency。一般 metadata/custom entry appends 也會在 SQLite 內選擇 current parent，因此 stale manager instances 不會復活 pre-SQLite parent-chain races。
  Synthetic PI tail cleanup for mid-turn prechecks 與 `sessions_yield` 現在直接 trim SQLite transcript state；舊的 SessionManager tail-removal bridge 及其測試已刪除。
  Compaction checkpoint capture 也只從 SQLite 建立快照；呼叫端不再傳入 live SessionManager 作為 alternate transcript source。
- 保留僅為 migration 而植入 legacy files 的測試。
- active runtime surfaces 的 JSON-file proof 已由 SQL row proof 取代。

- 新增 runtime 對 legacy session/cache JSON paths 寫入的 static bans。
  已針對 repo guard 完成。

10. 讓 migration report 可稽核。
    - 在 SQLite 中記錄 migration runs，包含 started/finished timestamps、source paths、source hashes、counts、warnings 與 backup path。
      已完成：legacy-state migration executions 現在會持久化 `migration_runs` report，包含 source path/table inventory、source file SHA-256、sizes、record counts、warnings 與 backup path。
      已完成：legacy-state migration executions 也會持久化 `migration_sources` rows，用於 source-level audit 與未來 skip/backfill decisions。
    - 讓 apply 具備 idempotent。Partial import 後重新執行時，應該 skip already imported source，或依 stable key merge。
      已完成：session indexes、transcripts、delivery queues、plugin state、task ledgers 與 agent-owned global SQLite rows 會透過 stable keys 或 upsert/replace semantics 匯入，因此 reruns 會 merge 而不 duplicated durable rows。
    - 失敗的 imports 必須將原始 source file 保留在原處。
      已完成：失敗的 transcript imports 現在會將原始 JSONL source 留在偵測到的路徑，且 `migration_sources` 會將 source 記錄為 `warning`，並帶有 `removed_source=0`，供下一次 doctor run 使用。

## 效能規則

- 每個 thread/process 一個 connection 可以；不要跨 workers 共用 handles。
- 使用 WAL、`foreign_keys=ON`、30 秒 busy timeout，以及短的 `BEGIN IMMEDIATE` write transactions。
- 保持 write transaction helpers 為同步，除非/直到 async transaction API 加入明確 mutex/backpressure semantics。
- 保持 parent delivery writes 小且 transactional。
- 避免 whole-store rewrites；使用 row-level upsert/delete。
- 在移動 hot code 前，為 list-by-agent、list-by-session、updated-at、run id 與 expiration paths 新增 indexes。
- 將大型 artifacts、media 與 vectors 儲存為 BLOBs 或 chunked BLOB rows，而不是 base64 或 numeric-array JSON。
- 保持 opaque plugin-state entries 小且有範圍。
- 新增 TTL/expiration 的 SQL cleanup，而不是 filesystem pruning。
  已針對 database-owned runtime stores 完成：media、plugin state、plugin blobs、persistent dedupe 與 agent cache 都透過 SQLite rows expire。剩餘 filesystem cleanup 僅限於 temporary materializations 或 explicit removal commands。

## 靜態禁令

新增一個 repo check，若有新的 runtime writes 寫入 legacy state paths 則失敗：

- `sessions.json`
- `*.trajectory.jsonl`，除了實體化的支援套件輸出
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
- Matrix `credentials*.json` 和 `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
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
- 臨時的 `openclaw-state.sqlite` 執行階段附屬檔案
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
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- 瀏覽器設定檔裝飾 `.openclaw-profile-decorated`
- `SessionManager.open(...)` 以檔案為後端的工作階段開啟器
- `SessionManager.listAll(...)` 和 `TranscriptSessionManager.listAll(...)`
  轉錄清單 Facade
- `SessionManager.forkFromSession(...)` 和
  `TranscriptSessionManager.forkFromSession(...)` 轉錄分支 Facade
- `SessionManager.newSession(...)` 和 `TranscriptSessionManager.newSession(...)`
  可變工作階段替換 Facade
- `SessionManager.createBranchedSession(...)` 和
  `TranscriptSessionManager.createBranchedSession(...)` 分支工作階段 Facade

這項禁令應允許測試建立舊版 fixture，並允許遷移程式碼
讀取、匯入、移除舊版檔案來源。未發布的 SQLite 附屬檔案仍維持禁用，
且不取得 doctor 匯入允許。

## 完成準則

- 執行階段資料和快取寫入全域或代理程式 SQLite 資料庫。
- 執行階段不再寫入工作階段索引、轉錄 JSONL、沙箱登錄
  JSON、任務附屬 SQLite，或 plugin-state 附屬 SQLite。未發布的任務
  和 plugin-state 附屬 SQLite 匯入器已刪除。
- 舊版檔案匯入僅限 doctor。
- 備份會產生一個封存檔，其中包含精簡的 SQLite 快照和完整性證明。
- 代理程式工作者可以使用磁碟、VFS 暫存區，或實驗性僅 VFS
  儲存來執行。
- 設定和明確的憑證檔案仍是唯一預期的持久性
  非資料庫控制檔案。
- 儲存庫檢查會防止重新引入舊版執行階段檔案儲存。
