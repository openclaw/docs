---
read_when:
    - 將 OpenClaw 執行階段資料、快取、逐字稿、任務狀態或暫存檔案移至 SQLite
    - 設計從舊版 JSON 或 JSONL 檔案進行的 doctor 遷移
    - 變更備份、還原、VFS 或 worker 儲存行為
    - 移除工作階段鎖定、修剪、截斷或 JSON 相容性路徑
summary: 將 SQLite 作為主要持久狀態與快取層，同時保留設定檔支援的遷移計畫
title: 資料庫優先的狀態重構
x-i18n:
    generated_at: "2026-07-01T20:11:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# 資料庫優先狀態重構

## 決策

使用兩層 SQLite 佈局：

- 全域資料庫：`~/.openclaw/state/openclaw.sqlite`
- 代理資料庫：每個代理各有一個 SQLite 資料庫，用於代理擁有的工作區、
  轉錄、VFS、成品，以及大型的每代理執行階段狀態
- 設定維持以檔案支援：`openclaw.json` 仍位於
  資料庫之外。執行階段驗證設定檔移至 SQLite；外部供應商或命令列介面
  憑證檔案仍由擁有者管理，位於 OpenClaw 資料庫之外。

全域資料庫是控制平面資料庫。它擁有代理探索、
共用閘道狀態、配對、裝置/節點狀態、任務與流程帳本、外掛
狀態、排程執行階段狀態、備份中繼資料，以及遷移狀態。

代理資料庫是資料平面資料庫。它擁有代理的工作階段
中繼資料、轉錄事件串流、VFS 工作區或暫存命名空間、工具
成品、執行成品，以及可搜尋/可索引的代理本機快取資料。

這提供一個持久的全域檢視，同時不會強迫大型代理工作區、
轉錄與二進位暫存資料進入共用閘道寫入通道。

## 強制合約

此遷移只有一個標準執行階段形態：

- 工作階段資料列只持久化工作階段中繼資料。它們不得持久化
  `transcriptLocator`、轉錄檔案路徑、同層 JSONL 路徑、鎖定路徑、
  修剪中繼資料，或檔案時代的相容性指標。
- 轉錄身分一律是 SQLite 身分：`{agentId, sessionId}` 加上
  協定需要時的選用主題中繼資料。
- `sqlite-transcript://...` 不是執行階段或協定身分。新程式碼不得
  衍生、持久化、傳遞、解析或遷移轉錄定位器。執行階段與
  測試完全不應包含偽定位器；文件只能提及該字串以禁止使用它。
- 舊版 `sessions.json`、轉錄 JSONL、`.jsonl.lock`、修剪、截斷，
  以及舊工作階段路徑邏輯，只屬於 doctor 遷移/匯入路徑。
- 舊版工作階段設定別名只屬於 doctor 遷移。執行階段不會
  解讀 `session.idleMinutes`、`session.resetByType.dm`，或
  另一個已設定代理的跨代理 `agent:main:*` 主工作階段別名。
- 工作階段路由身分是具型別的關聯狀態。熱執行階段與 UI 路徑
  應讀取 `sessions.session_scope`、`sessions.account_id`、
  `sessions.primary_conversation_id`、`conversations`，以及
  `session_conversations`；它們不得解析 `session_key`，或從
  `session_entries.entry_json` 挖掘供應商身分，除非是在刪除舊呼叫點期間
  作為相容性影子。
- 頻道層級的直接訊息標記，例如 `dm` 與 `direct`，是路由
  詞彙，不是轉錄定位器或檔案儲存相容性控制代碼。
- 舊版鉤子處理器設定只屬於 doctor 警告/遷移表面。
  執行階段不得載入 `hooks.internal.handlers`；鉤子只透過已探索的
  鉤子目錄與 `HOOK.md` 中繼資料執行。
- 執行階段啟動、熱回覆路徑、壓縮、重設、復原、診斷、
  TTS、記憶鉤子、子代理、外掛命令路由、協定邊界，以及
  鉤子都必須在執行階段中傳遞 `{agentId, sessionId}`。
- 測試應透過 `{agentId, sessionId}` 植入並斷言 SQLite 轉錄資料列。
  只證明 JSONL 路徑轉送、保留呼叫端提供的定位器，或轉錄檔案相容性的測試
  應刪除，除非它們涵蓋 doctor 匯入、非工作階段支援/偵錯
  具體化，或協定形態。
- `runEmbeddedPiAgent(...)`、已準備的 worker 執行，以及內部嵌入式
  嘗試不得接受轉錄定位器。它們依 `{agentId, sessionId}` 開啟 SQLite 轉錄
  管理器，並將該管理器傳給內部化的 PI 相容代理工作階段，
  因此過時呼叫端無法讓 runner 寫入 JSON/JSONL 轉錄。
- Runner 診斷必須在 SQLite 中儲存執行階段/快取/承載追蹤記錄。
  執行階段診斷不得暴露 JSONL 檔案覆寫旋鈕或通用
  轉錄 JSONL 匯出輔助工具；面向使用者的匯出可以從資料庫資料列具體化明確
  成品，而不將檔名回饋到執行階段。
- 原始串流記錄使用 `OPENCLAW_RAW_STREAM=1` 加上 SQLite 診斷資料列。
  舊 pi-mono 的 `PI_RAW_STREAM`、`PI_RAW_STREAM_PATH`，以及
  `raw-openai-completions.jsonl` 檔案記錄器合約，不屬於 OpenClaw
  執行階段或測試。
- QMD 記憶索引不得將 SQLite 轉錄匯出為 markdown 檔案。
  QMD 只索引已設定的記憶檔案；工作階段轉錄搜尋維持
  由 SQLite 支援。
- 對新程式碼而言，QMD SDK 子路徑僅供 QMD 使用。SQLite 工作階段轉錄
  索引輔助工具位於 `memory-core-host-engine-session-transcripts`；任何
  QMD 重新匯出都只是相容性用途，執行階段程式碼不得使用。
- 內建記憶索引位於擁有它們的代理資料庫中。執行階段設定與
  已解析的執行階段合約不得暴露 `memorySearch.store.path`；doctor
  會刪除該舊版設定鍵，而目前程式碼會在內部傳遞代理
  `databasePath`。

實作工作應持續刪除程式碼，直到這些陳述在 doctor/匯入/匯出/偵錯邊界之外
都無例外成立。

## 目標狀態與進度

### 強制目標

- 一個全域 SQLite 資料庫擁有控制平面狀態：
  `state/openclaw.sqlite`。
- 一個每代理 SQLite 資料庫擁有資料平面狀態：
  `agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定維持以檔案支援。`openclaw.json` 不屬於此資料庫
  重構。
- 舊版檔案僅作為 doctor 遷移輸入。
- 執行階段絕不將工作階段或轉錄 JSONL 作為作用中狀態來寫入或讀取。

### 目標狀態

- `not-started`：檔案時代執行階段程式碼仍寫入作用中狀態。
- `migrating`：doctor/匯入程式碼可以將檔案資料移入 SQLite。
- `dual-read`：暫時橋接同時讀取 SQLite 與舊版檔案。此狀態
  對此重構而言是被禁止的，除非明確記錄為
  僅限 doctor。
- `sqlite-runtime`：執行階段只讀寫 SQLite。
- `clean`：舊版執行階段 API 與測試已移除，且防護會防止
  迴歸。
- `done`：文件、測試、備份、doctor 遷移，以及 changed 檢查證明
  乾淨狀態。

### 目前狀態

- 工作階段：執行階段為 `clean`。工作階段資料列位於每代理資料庫，
  執行階段 API 使用 `{agentId, sessionId}` 或 `{agentId, sessionKey}`，而
  `sessions.json` 是僅限 doctor 的舊版輸入。
- 轉錄：執行階段為 `clean`。轉錄事件、身分、快照，
  以及軌跡執行階段事件位於每代理資料庫。執行階段不再
  接受轉錄定位器或 JSONL 轉錄路徑。
- PI 嵌入式 runner：`clean`。嵌入式 PI 執行、已準備的 workers、壓縮，
  以及重試迴圈使用 SQLite 工作階段範圍，並拒絕過時轉錄控制代碼。
- 排程：執行階段為 `clean`。執行階段使用 `cron_jobs` 與 `cron_run_logs`；
  執行階段測試使用 SQLite `storeKey` 命名，而檔案時代的排程路徑只保留在
  doctor 舊版遷移測試中。
- 任務登錄：`clean`。任務與任務流程執行階段資料列位於
  `state/openclaw.sqlite`；未出貨的 sidecar SQLite 匯入器已刪除。
- 外掛狀態：`clean`。外掛狀態/blob 資料列位於共用全域
  資料庫；舊外掛狀態 sidecar SQLite 輔助工具已受到防護。
- 記憶：內建記憶與工作階段轉錄索引為 `sqlite-runtime`。
  記憶索引資料表位於每代理資料庫，外掛記憶狀態使用
  共用外掛狀態資料列，而舊版記憶檔案是 doctor 遷移輸入
  或使用者工作區內容。
- 備份：`sqlite-runtime`。備份階段會壓縮 SQLite 快照，省略即時
  WAL/SHM sidecars，驗證 SQLite 完整性，並在
  全域資料庫中記錄備份執行。
- Doctor 遷移：`migrating`，這是有意的。Doctor 會將舊版 JSON、
  JSONL，以及已退役的 sidecar 儲存匯入 SQLite，記錄遷移執行/來源，
  並移除成功的來源。
- E2E 指令碼：執行階段涵蓋為 `clean`。Docker MCP 植入會寫入 SQLite
  資料列。runtime-context Docker 指令碼只在
  doctor 遷移種子內建立舊版 JSONL，並明確命名舊版工作階段索引路徑。

### 剩餘工作

- [x] 將排程執行階段測試儲存變數從 `storePath` 重新命名，除非
      它們是 doctor 舊版輸入。
      檔案：`src/cron/service.test-harness.ts`、
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`、
      `src/cron/service/timer.regression.test.ts`、
      `src/cron/service/ops.test.ts`、`src/cron/service/store.test.ts`、
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`、
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`、
      `src/cron/store.test.ts`。
      證明：`pnpm check:database-first-legacy-stores`；`rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`。
- [x] 移除或重新命名過時的檔案時代匯出測試 mock。
      檔案：`src/auto-reply/reply/commands-export-test-mocks.ts`。
      證明：`rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`。
- [x] 讓 Docker runtime-context 舊版 JSONL 種子明顯僅供 doctor 使用。
      檔案：`scripts/e2e/session-runtime-context-docker-client.ts`。
      證明：`rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` 只顯示
      `seedBrokenLegacySessionForDoctorMigration`。
- [x] 在任何 schema 變更後保持 Kysely 產生的型別一致。
      檔案：`src/state/openclaw-state-schema.sql`、
      `src/state/openclaw-agent-schema.sql`、
      `src/state/*generated*`。
      證明：此次沒有 schema 變更；`pnpm db:kysely:check`；
      `pnpm lint:kysely`。
- [x] 重新執行已觸及儲存、命令與指令碼的聚焦測試。
      證明：`pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`；`git diff --check`。
- [x] 在宣告 `done` 前，執行 changed gate 或遠端廣泛證明。
      證明：`pnpm check:changed --timed -- <changed extension paths>` 已在
      Hetzner Crabbox 執行 `run_3f1cabf6b25c` 通過，該執行包含臨時 Node 24/pnpm 設定，以及
      對已同步、無 `.git` 工作區的明確路徑路由。

### 不要迴歸

- 不要有轉錄定位器。
- 不要有作用中工作階段檔案。
- 不要有假的 JSONL 測試 fixture，doctor 舊版遷移測試除外。
- 在預期使用 Kysely 的地方，不要有原始 SQLite 存取。
- 不要新增舊版 DB 遷移。此佈局尚未出貨；除非有強力理由，否則保持 schema 版本
  為 `1`。

## 程式碼閱讀假設

沒有後續產品決策會阻擋此計畫。實作應
在以下假設下進行：

- 直接使用 `node:sqlite`，並要求此儲存路徑使用 Node 22+ 執行階段。
- 只保留一個一般設定檔。在此重構中，不要將設定、外掛 manifest 或 Git 工作區移入 SQLite。
- 不需要執行階段相容性檔案。舊版 JSON 和 JSONL 檔案只作為遷移輸入。分支本機的 SQLite sidecar 從未發布，因此刪除而不是匯入。
- `openclaw doctor --fix` 負責舊版檔案到資料庫的遷移步驟。執行階段啟動和 `openclaw migrate` 不應承載舊版 OpenClaw 資料庫升級路徑。
- 憑證相容性遵循相同規則：執行階段憑證存放在 SQLite。舊的 `auth-profiles.json`、每個 agent 的 `auth.json`，以及共享的 `credentials/oauth.json` 檔案是 doctor 遷移輸入，匯入後移除。
- 產生的模型目錄狀態由資料庫支援。執行階段程式碼不得寫入 `agents/<agentId>/agent/models.json`；現有的 `models.json` 檔案是舊版 doctor 輸入，匯入 `agent_model_catalogs` 後移除。
- 執行階段不得遷移、正規化或橋接 transcript locator。作用中的 transcript 身分在 SQLite 中是 `{agentId, sessionId}`。檔案路徑只作為舊版 doctor 輸入，且 `sqlite-transcript://...` 必須從執行階段、通訊協定、hook 和外掛介面中消失，而不是被視為邊界 handle。
- 執行階段 SQLite transcript 讀取不會執行舊 JSONL entry 形狀遷移，也不會為了相容性重寫整份 transcript。舊版 entry 正規化保留在明確的 doctor/import 工具中。Doctor 會在插入 SQLite row 之前正規化舊版 JSONL transcript 檔案；目前的執行階段 row 已經以目前的 transcript schema 寫入。Trajectory/session 匯出會原樣讀取這些 row，且不得在匯出時執行舊版遷移。
- 舊版 transcript JSONL 解析/遷移 helper 僅限 doctor 使用。執行階段 transcript 格式程式碼只建構目前的 SQLite transcript context；doctor 負責在插入 row 前升級舊 JSONL entry。
- 舊的執行階段擁有的 JSONL transcript 串流 helper 已刪除。Doctor 匯入程式碼負責明確的舊版檔案讀取；執行階段 session history 讀取 SQLite row。
- Codex app-server 綁定使用 OpenClaw `sessionId` 作為 Codex 外掛狀態 namespace 中的標準 key。`sessionKey` 是用於路由/顯示的中繼資料，不得取代持久 session id，也不得復活 transcript-file 身分。
- Context engine 會直接接收目前的執行階段合約。Registry 不得以會刪除 `sessionKey`、`transcriptScope` 或 `prompt` 的重試 shim 包裝 engine；無法接受目前 database-first 參數的 engine 應明確失敗，而不是被橋接。
- 備份輸出應維持為一個封存檔。資料庫內容應以精簡 SQLite snapshot 形式進入該封存檔，而不是原始 live WAL sidecar。
- Transcript 搜尋很有用，但不是第一個 database-first 階段的必要項目。設計 schema 時應讓 FTS 稍後能加入。
- Worker 執行應在資料庫邊界穩定前，繼續透過設定保留在實驗性狀態。

## 程式碼閱讀發現

目前分支已經超越 proof-of-concept 階段。共享資料庫已存在，Node `node:sqlite` 已透過小型執行階段 helper 串接，先前的 store 現在會寫入 `state/openclaw.sqlite` 或所屬的 `openclaw-agent.sqlite` 資料庫。

剩餘工作不是選擇 SQLite，而是保持新邊界乾淨，並刪除任何仍然看起來像舊檔案世界的相容性形狀介面：

- Session `storePath` 不再是執行階段身分、測試 fixture 形狀或狀態 payload 欄位。執行階段和 bridge 測試不再包含 `storePath` 合約名稱；doctor/migration 程式碼負責該舊版詞彙。
- Session 寫入不再經過舊的 in-process `store-writer.ts` queue。SQLite patch 寫入改用衝突偵測和有界重試。
- 舊版路徑探索仍有有效的遷移用途，但執行階段程式碼應停止將 `sessions.json` 和 transcript JSONL 檔案視為可能的寫入目標。
- Agent 擁有的 table 位於每個 agent 的 SQLite 資料庫中。全域 DB 保留 registry/control-plane row；transcript 身分是每個 agent transcript row 中的 `{agentId, sessionId}`。執行階段程式碼不得持久化 transcript 檔案路徑或遷移 transcript locator。
- Doctor 已經匯入數個舊版檔案。清理工作是將其變成 doctor 呼叫的單一明確遷移實作，並產生持久的遷移報告。

沒有其他產品問題阻礙實作。

## 目前程式碼形狀

此分支已經有真正的共享 SQLite 基礎：

- 執行階段下限現在是節點 22+：`package.json`、命令列介面執行階段防護、安裝程式預設值、macOS 執行階段定位器、CI 和公開安裝文件全都一致。舊的節點 22 相容性通道已移除。
- `src/state/openclaw-state-db.ts` 會開啟 `openclaw.sqlite`、設定 WAL、
  `synchronous=NORMAL`、`busy_timeout=30000`、`foreign_keys=ON`，並套用衍生自
  `src/state/openclaw-state-schema.sql` 的產生結構描述模組。
- Kysely 資料表型別和執行階段結構描述模組，是從已提交 `.sql` 檔案建立的一次性 SQLite 資料庫產生；執行階段程式碼不再為全域、每代理或 Proxy 擷取資料庫保留複製貼上的結構描述字串。
- 執行階段儲存區會從這些產生的 Kysely `DB` 介面衍生選取與插入的資料列型別，而不是手動影子化 SQLite 資料列形狀。原始 SQL 仍然僅限於套用結構描述、pragma 和僅供遷移使用的 DDL。
- SQLite 結構描述已收斂為 `user_version = 1`，因為這個資料庫配置尚未出貨。執行階段開啟器只會建立目前的結構描述；檔案到資料庫匯入仍留在 doctor 程式碼中，分支本地的資料庫升級輔助工具已刪除。
- 在擁有權邊界為標準的位置會強制執行關聯式擁有權：來源遷移資料列會從 `migration_runs` 串聯，任務傳遞狀態會從 `task_runs` 串聯，文字記錄身分資料列會從文字記錄事件串聯。
- 目前的共享資料表包含 `agent_databases`、
  `auth_profile_stores`、`auth_profile_state`、
  `plugin_state_entries`、`plugin_blob_entries`、`media_blobs`、
  `skill_uploads`、`capture_sessions`、`capture_events`、`capture_blobs`、
  `sandbox_registry_entries`、`cron_run_logs`、`cron_jobs`、`commitments`、
  `delivery_queue_entries`、`model_capability_cache`、
  `workspace_setup_state`、`native_hook_relay_bridges`、
  `current_conversation_bindings`、`plugin_binding_approvals`、
  `tui_last_sessions`、`acp_sessions`、`acp_replay_sessions`、
  `acp_replay_events`、`task_runs`、`task_delivery_state`、`flow_runs`、
  `subagent_runs`、`migration_runs` 和 `backup_runs`。
- 任意由外掛擁有的狀態不會取得由主機擁有的型別化資料表。已安裝外掛會使用 `plugin_state_entries` 存放版本化 JSON 承載，並使用 `plugin_blob_entries` 存放位元組，具備命名空間/鍵擁有權、TTL 清理、備份和外掛遷移記錄。當主機擁有查詢合約時，由主機擁有的外掛編排狀態仍可有型別化資料表，例如 `plugin_binding_approvals`。
- 外掛遷移是在外掛擁有的命名空間上執行的資料遷移，而不是主機結構描述遷移。外掛可以透過遷移提供者遷移自己的版本化狀態/blob 項目，主機則在一般遷移帳本中記錄來源/執行狀態。除非主機本身要取得新的跨外掛合約擁有權，新的外掛安裝不需要變更 `openclaw-state-schema.sql`。
- `src/state/openclaw-agent-db.ts` 會開啟
  `agents/<agentId>/agent/openclaw-agent.sqlite`，在全域資料庫中註冊該資料庫，並擁有代理本地的工作階段、文字記錄、VFS、成品、快取和記憶索引資料表。共享執行階段探索現在會讀取產生型別的 `agent_databases` 登錄，而不是在每個呼叫站台重新實作該查詢。
- 全域和每代理資料庫會記錄一筆 `schema_meta` 資料列，其中包含資料庫角色、結構描述版本、時間戳記，以及代理資料庫的代理 id。配置仍維持在 `user_version = 1`，因為這個 SQLite 結構描述尚未出貨。
- 每代理工作階段身分現在有一個標準 `sessions` 根資料表，以 `session_id` 為鍵，並將 `session_key`、`session_scope`、`account_id`、
  `primary_conversation_id`、時間戳記、顯示欄位、模型中繼資料、harness id，以及父/衍生連結作為可查詢欄位。`session_routes` 是從 `session_key` 到目前
  `session_id` 的唯一作用中路由索引，因此路由鍵可以移至新的持久工作階段，而不會讓熱讀取在重複的 `sessions.session_key` 資料列之間選擇。舊的
  `session_entries.entry_json` 相容性形狀承載會透過外鍵掛在持久的
  `session_id` 根上；它不再是工作階段唯一的結構描述層級表示。
- 每代理外部對話身分也採用關聯式：
  `conversations` 會儲存正規化的提供者/帳號/對話身分，而
  `session_conversations` 會將一個 OpenClaw 工作階段連結到一個或多個外部對話。這涵蓋共享主 DM 工作階段，其中多個對等方可以有意對應到同一個工作階段，而不必在 `session_key` 中說謊。SQLite 也會強制自然提供者身分的唯一性，因此相同的 channel/account/kind/peer/thread 元組不能分叉成不同的對話 id。
  共享主直接對等方會以 `participant` 角色連結，因此一個 OpenClaw 工作階段可以代表多個外部 DM 對等方，而不會把較舊的對等方降級成模糊的相關資料列。`sessions.primary_conversation_id` 仍指向目前的型別化傳遞目標。封閉的路由/狀態欄位會以 SQLite `CHECK` 約束強制執行，而不是只仰賴 TypeScript 聯集。
  執行階段工作階段投影會先從 `session_entries.entry_json` 清除相容性路由影子，再套用型別化工作階段/對話欄位，因此過時的 JSON 承載無法復活傳遞目標。
  子代理公告路由同樣需要型別化 SQLite 傳遞內容；它不再回退到相容性 `SessionEntry` 路由欄位。
  閘道 `chat.send` 明確傳遞繼承會讀取型別化 SQLite 傳遞內容，而不是 `origin`/`last*` 相容性欄位。
  `tools.effective` 同樣會從型別化 SQLite 傳遞/路由資料列衍生提供者/帳號/thread 內容，而不是過時的 `last*` 工作階段項目影子。
  系統事件提示內容會從型別化傳遞欄位重建 channel/to/account/thread 欄位，而不是從 `origin` 影子重建。
  共享的 `deliveryContextFromSession` 輔助工具和工作階段到對話對應器現在會完全忽略 `SessionEntry.origin`；只有型別化傳遞欄位和關聯式對話資料列可以建立熱路由身分。
  執行階段工作階段項目正規化會在持久化或投影 `entry_json` 之前移除 `origin`，而傳入中繼資料會寫入型別化 channel/chat 欄位加上關聯式對話資料列，而不是建立新的 origin 影子。
- 文字記錄事件、文字記錄快照和軌跡執行階段事件現在會參照標準每代理 `sessions` 根，並在工作階段刪除時串聯。文字記錄身分/冪等性資料列會繼續從確切的文字記錄事件資料列串聯。
- 記憶核心索引現在使用明確的代理資料庫資料表
  `memory_index_meta`、`memory_index_sources`、`memory_index_chunks` 和
  `memory_embedding_cache`，並由 `memory_index_state` 追蹤修訂變更。
  選用的 FTS/vector 側邊索引命名為 `memory_index_chunks_fts` 和
  `memory_index_chunks_vec`，而不是通用的 `meta`、`files`、`chunks`、
  `chunks_fts` 或 `chunks_vec` 資料表。標準名稱保留目前的路徑/來源資料列形狀和序列化 embedding 相容性。這些資料表是衍生/搜尋快取，不是標準文字記錄儲存；它們可以從記憶工作區檔案和已設定來源刪除並重建。
  開啟已出貨的通用名稱記憶索引時，會將其中繼資料、來源、chunk 和 embedding 快取遷移到標準資料表；衍生的 FTS/vector 資料表會以其標準名稱重建。
- 子代理執行復原狀態現在位於型別化共享 `subagent_runs` 資料列中，並有已索引的子、請求者和控制器工作階段鍵。舊的
  `subagents/runs.json` 檔案僅作為 doctor 遷移輸入。
- 目前對話繫結現在位於型別化共享
  `current_conversation_bindings` 資料列中，以正規化對話 id 為鍵，並將目標代理/工作階段欄位、對話種類、狀態、到期時間和中繼資料儲存為關聯式欄位，而不是重複的不透明繫結記錄。
  持久繫結鍵包含正規化對話種類，因此直接/群組/channel 參照不會碰撞，且 SQLite 會拒絕無效的繫結種類/狀態值。舊的
  `bindings/current-conversations.json` 檔案僅作為 doctor 遷移輸入。
- 傳遞佇列復原現在會在 replay JSON 上覆加 channel、目標、帳號、工作階段、重試、錯誤、平台傳送和復原狀態的型別化佇列欄位。`entry_json` 保留 replay 承載、hook 和格式化承載，但型別化欄位是熱佇列路由/狀態的權威來源。
- 終端介面最後工作階段還原指標現在位於型別化共享
  `tui_last_sessions` 資料列中，以雜湊後的終端介面連線/工作階段範圍為鍵。
  舊的終端介面 JSON 檔案僅作為 doctor 遷移輸入。
- 預設 TTS 偏好設定現在位於共享外掛狀態 SQLite 資料列中，鍵位於
  `speech-core` 外掛底下。舊的 `settings/tts.json` 檔案僅作為 doctor 遷移輸入；執行階段不再讀取或寫入 TTS 偏好設定 JSON 檔案，舊版路徑解析器位於 doctor 遷移模組。
- 秘密目標中繼資料現在會談論儲存區，而不是假裝每個憑證目標都是設定檔。`openclaw.json` 仍是設定儲存區；auth-profile 目標使用型別化 SQLite `auth_profile_stores` 資料列，並將提供者形狀的憑證保留為 JSON 承載。
- 秘密稽核不再掃描已退役的每代理 `auth.json` 檔案。Doctor 負責警告、匯入和移除該舊版檔案。
- 舊版 auth profile 路徑輔助工具現在位於 doctor 舊版程式碼中。核心 auth profile 路徑輔助工具會公開 SQLite auth-store 身分和顯示位置，而不是 `auth-profiles.json` 或 `auth-state.json` 執行階段路徑。
- 子代理執行復原和 OpenRouter 模型能力快取執行階段模組現在會將 SQLite 快照讀取器/寫入器與僅供 doctor 使用的舊版 JSON 匯入輔助工具分開。OpenRouter 能力會使用 `provider_id = "openrouter"` 底下的型別化通用
  `model_capability_cache` 資料列，而不是單一不透明快取 blob 或提供者特定的主機資料表。子代理執行
  `taskName` 會儲存在型別化 `subagent_runs.task_name` 欄位中；
  `payload_json` 副本是 replay/debug 資料，不是熱顯示或查詢欄位的來源。
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` 會在代理資料庫
  `vfs_entries` 資料表上實作 SQLite VFS。目錄讀取、遞迴匯出、刪除和重新命名會使用已索引的 `(namespace, path)` 前綴範圍，而不是掃描整個命名空間或仰賴 `LIKE` 路徑比對。
- `src/agents/runtime-worker.entry.ts` 會為 worker 建立每次執行的 SQLite VFS、工具成品、執行成品和範圍化快取儲存區。
- 工作區啟動完成標記現在位於型別化共享
  `workspace_setup_state` 資料列中，以解析後的工作區路徑為鍵，而不是
  `.openclaw/workspace-state.json`；執行階段不再讀取或重寫舊版工作區標記，輔助 API 也不再傳遞假的 `.openclaw/setup-state` 路徑只為了衍生儲存身分。
- Exec 核准現在位於型別化共享 SQLite `exec_approvals_config`
  單例資料列中。Doctor 會匯入舊版 `~/.openclaw/exec-approvals.json`；
  執行階段寫入不再建立、重寫或回報該檔案作為其作用中儲存位置。macOS companion 會讀寫同一個
  `state/openclaw.sqlite` 資料表資料列；它只在磁碟上保留 Unix prompt socket，因為那是 IPC，不是持久執行階段狀態。
- 裝置身分、裝置驗證和啟動執行階段模組現在會將 SQLite 快照讀取器/寫入器與僅供 doctor 使用的舊版 JSON 匯入輔助工具分開。裝置身分使用型別化 `device_identities` 資料列，裝置驗證 token 使用型別化 `device_auth_tokens` 資料列。裝置驗證寫入會依裝置/角色協調資料列，而不是截斷 token 資料表，且執行階段不再透過舊的整個儲存區 adapter 路由單一 token 更新。舊版
  version-1 JSON 承載內容只作為 doctor 匯入/匯出形狀存在。
- GitHub Copilot 權杖交換快取使用共享 SQLite 外掛狀態資料表，
  位於 `github-copilot/token-cache/default`。這是提供者擁有的快取狀態，
  因此刻意不新增主機結構描述資料表。
- GitHub Copilot 壓縮不再寫入 `openclaw-compaction-*.json`
  工作區 sidecar。harness 會對受追蹤的 SDK 工作階段呼叫 SDK 歷史壓縮 RPC，
  而 OpenClaw 會將持久的工作階段/轉錄狀態保存在
  SQLite 中，而不是相容性標記檔案。
- 共享 Swift 執行階段（`OpenClawKit`）使用相同的
  `state/openclaw.sqlite` 資料列來存放裝置身分與裝置認證。macOS app
  輔助程式會匯入共享 SQLite 輔助工具，而不是擁有第二條 JSON 或
  SQLite 路徑。殘留的舊版 `identity/device.json` 會阻止建立身分，
  直到 doctor 將其匯入 SQLite，這與 TypeScript 和 Android
  啟動閘門一致。
- Android 裝置身分使用相同的 TypeScript 相容金鑰材料，
  儲存在具型別的 `state/openclaw.sqlite#table/device_identities` 資料列中。它絕不
  讀取或寫入 `openclaw/identity/device.json`；殘留的舊版檔案會阻止
  啟動，直到 doctor 將其匯入 SQLite。
- Android 快取的裝置認證權杖也使用具型別的
  `state/openclaw.sqlite#table/device_auth_tokens` 資料列，並與 TypeScript 和 Swift
  共享相同的 version-1 權杖語意。執行階段不再讀取 `SecurePrefs`
  `gateway.deviceToken*` 相容性鍵；這些只屬於遷移/doctor
  邏輯。
- Android 通知最近套件歷史使用具型別的
  `android_notification_recent_packages` 資料列。執行階段不再遷移或
  讀取舊的 SharedPreferences CSV 鍵。
- 當舊版 `identity/device.json`
  存在、SQLite 身分資料列無效，或無法開啟 SQLite 身分
  存放區時，裝置身分建立會以封閉方式失敗。doctor 會先匯入並移除該檔案，因此執行階段
  啟動無法在遷移前悄悄輪換配對身分。
- 裝置身分選擇是 SQLite 資料列鍵，而不是 JSON 檔案定位器。測試
  和閘道輔助工具會傳入明確身分鍵；只有 doctor 遷移和
  封閉式啟動閘門知道已退役的 `identity/device.json` 檔名。
- 工作階段重設相容性現在位於 doctor 設定遷移：
  `session.idleMinutes` 會移至 `session.reset.idleMinutes`，
  `session.resetByType.dm` 會移至 `session.resetByType.direct`，而
  執行階段重設政策只讀取標準重設鍵。
- 舊版設定相容性現在位於 `src/commands/doctor/` 下。一般
  `readConfigFileSnapshot()` 驗證不會匯入 doctor 舊版偵測器
  或標註舊版問題；`runDoctorConfigPreflight()` 會為
  doctor 修復/回報新增那些問題。doctor 設定流程會匯入
  `src/commands/doctor/legacy-config.ts`，而舊 OAuth profile-id 修復位於
  `src/commands/doctor/legacy/oauth-profile-ids.ts`
  下。
- 非 doctor 命令不會自動執行舊版設定修復。例如，
  `openclaw update --channel` 現在會因無效的舊版設定而失敗，並要求
  使用者執行 doctor，而不是悄悄匯入 doctor 遷移程式碼。
- 網頁推播、APNs、語音喚醒、更新檢查和設定健康狀態現在使用具型別的共享 SQLite
  資料表來存放訂閱、VAPID 金鑰、節點註冊、觸發資料列、
  路由資料列、更新通知狀態，以及設定健康項目，而不是
  整個不透明 JSON blob。網頁推播和 APNs 快照寫入現在會依主鍵協調
  訂閱/註冊，而不是清空其資料表；
  設定健康狀態也會依設定路徑執行相同處理。
  它們的執行階段模組會將 SQLite 快照讀取器/寫入器與
  僅供 doctor 使用的舊版 JSON 匯入輔助工具分開。
- 節點主機設定現在使用共享 SQLite 資料庫中的具型別單例資料列；
  doctor 會在一般執行階段使用前匯入舊的 `node.json` 檔案。
- 裝置/節點配對、頻道配對、頻道 allowlist 和 bootstrap 狀態
  現在使用具型別 SQLite 資料列，而不是整個不透明 JSON blob。外掛繫結
  核准和排程工作狀態遵循相同拆分：執行階段模組公開
  SQLite 支援的操作和中立快照輔助工具，而配對/bootstrap
  加上外掛繫結核准快照寫入會依主鍵協調資料列，
  而不是截斷資料表，同時 doctor 會透過
  `src/commands/doctor/legacy/*` 模組匯入/移除舊 JSON 檔案。
- 已安裝外掛記錄現在位於 SQLite 已安裝外掛索引中。
  執行階段設定讀取/寫入不再遷移或保留舊的
  `plugins.installs` authored-config 資料；doctor 會在一般執行階段使用前
  將該舊版設定形狀匯入 SQLite。
- QQ Bot 憑證復原快照現在位於 SQLite 外掛狀態中的
  `qqbot/credential-backups`。執行階段不再寫入
  `qqbot/data/credential-backup*.json`；QQ Bot doctor 合約會從
  作用中狀態目錄匯入並封存那些舊版備份檔案。
- 閘道重新載入規劃會在內部 `installedPluginIndex.installRecords.*`
  diff 命名空間下比較 SQLite 已安裝外掛索引快照。執行階段
  重新載入決策不再將那些資料列包裝在假的 `plugins.installs` 設定
  物件中。
- Matrix 命名帳戶憑證升級不再於執行階段
  讀取時發生。當能解析單一/預設 Matrix 帳戶時，
  doctor 擁有舊的頂層 `credentials/matrix/credentials.json`
  重新命名。
- 核心配對和排程執行階段模組不再匯出舊版 JSON 路徑
  建構器。doctor 擁有的舊版模組只為匯入測試和
  遷移建構 `pending.json`、`paired.json`、
  `bootstrap.json` 和 `cron/jobs.json` 來源路徑。舊版排程工作形狀正規化和排程執行記錄匯入
  位於 `src/commands/doctor/legacy/cron*.ts` 下。
- `src/commands/doctor/legacy/runtime-state.ts` 會從 doctor 將舊版 JSON 狀態
  檔案（包括節點主機設定）匯入 SQLite。新的舊版檔案
  匯入器維持在 `src/commands/doctor/legacy/` 下。
- `src/commands/doctor/state-migrations.ts` 會將舊版 `sessions.json` 和
  `*.jsonl` 轉錄直接匯入 SQLite，並移除成功匯入的來源。它
  不再透過 `agents/<agentId>/sessions/*.jsonl`
  暫存根目錄舊版轉錄，也不會在匯入前建立標準 JSONL 目標。
- 狀態完整性 doctor 檢查不再掃描舊版工作階段目錄或
  提供孤立 JSONL 刪除。舊版轉錄檔案只是遷移輸入，
  而遷移步驟擁有匯入與來源移除。
- 舊版 sandbox registry 匯入位於
  `src/commands/doctor/legacy/sandbox-registry.ts`；作用中 sandbox registry
  讀取和寫入仍然只使用 SQLite。
- 舊版工作階段轉錄健康狀態/匯入修復位於
  `src/commands/doctor/legacy/session-transcript-health.ts`；執行階段命令
  模組不再攜帶 JSONL 轉錄解析或作用中分支修復程式碼。

已完成的整併／刪除重點：

- 外掛狀態現在使用共用的 `state/openclaw.sqlite` 資料庫。舊的
  分支本機 `plugin-state/state.sqlite` 附帶匯入器已移除，因為
  該 SQLite 版面配置從未發行。探測/測試輔助程式會回報共用的
  `databasePath`，而不是公開外掛狀態專用的 SQLite 路徑。
- 任務與任務流程執行階段表格現在位於共用的
  `state/openclaw.sqlite` 資料庫，而不是 `tasks/runs.sqlite` 和
  `tasks/flows/registry.sqlite`；舊的附帶匯入器也因同樣的
  未發行版面配置原因而移除。
- `src/config/sessions/store.ts` 對輸入中繼資料、路由更新或
  updated-at 讀取不再需要 `storePath`。命令持久化、命令列介面
  工作階段清理、子代理深度、驗證覆寫和轉錄工作階段身分會使用
  代理/工作階段資料列 API。寫入會以 SQLite 資料列修補套用，
  並使用樂觀衝突重試。
- 工作階段目標解析現在公開每個代理的資料庫目標，而不是舊版
  `sessions.json` 路徑。共用閘道、ACP 中繼資料、doctor 路由修復和
  `openclaw sessions` 會列舉 `agent_databases` 與已設定的代理。
- 閘道工作階段路由現在使用 `resolveGatewaySessionDatabaseTarget`；傳回的
  目標會攜帶 `databasePath` 與候選 SQLite 資料列鍵，而不是舊版工作階段
  儲存檔案路徑。
- 通道工作階段執行階段型別現在針對 updated-at 讀取、輸入中繼資料和
  last-route 更新公開 `{agentId, sessionKey}`。舊的
  `saveSessionStore(storePath, store)` 相容型別已移除。
- 外掛執行階段、擴充功能 API 和 `config/sessions` barrel 介面現在會引導
  外掛程式碼使用 SQLite 支援的工作階段資料列輔助程式。根程式庫相容性
  匯出（`loadSessionStore`、`saveSessionStore`、`resolveStorePath`）仍保留為
  現有消費者的已棄用 shim。舊的
  `resolveLegacySessionStorePath` 輔助程式已移除；舊版 `sessions.json` 路徑
  建構現在只限於遷移和測試 fixture。
- `src/config/sessions/session-entries.sqlite.ts` 現在將標準工作階段項目
  儲存在每個代理的資料庫中，並支援資料列層級的讀取/upsert/刪除修補。
  執行階段 upsert/修補/刪除不再掃描大小寫變體或修剪舊版別名鍵；
  doctor 負責標準化。獨立 JSON 匯入輔助程式已移除，而遷移合併會 upsert
  較新的資料列，而不是取代整個工作階段表格。公開 read/list/load 輔助程式
  會從具型別的 `sessions` 和 `conversations` 資料列投影熱門工作階段
  中繼資料；`entry_json` 是相容性/除錯影子，可能過期或無效，但不會
  遺失具型別工作階段身分或傳遞情境。
- `src/config/sessions/delivery-info.ts` 現在從具型別的每代理
  `sessions` + `conversations` + `session_conversations` 資料列解析傳遞情境。
  它不再從 `session_entries.entry_json` 重建執行階段傳遞身分；缺少具型別
  對話資料列是 doctor 遷移/修復問題，而不是執行階段備援。
- 已儲存工作階段重設決策現在優先使用具型別的 `sessions.session_scope`、
  `sessions.chat_type` 和 `sessions.channel` 中繼資料。`sessionKey` 剖析
  只保留給命令目標上的明確執行緒/主題後綴；群組與直接重設分類不再來自
  鍵形狀。
- 工作階段清單/狀態顯示分類現在使用具型別聊天中繼資料和閘道工作階段種類。
  它不再將 `session_key` 內的 `:group:` 或 `:channel:` 子字串視為持久的
  群組/直接事實。
- 靜默回覆政策選擇現在只使用明確的對話型別或介面中繼資料。它不再從
  `session_key` 子字串猜測直接/群組政策。
- 工作階段顯示模型解析現在從 SQLite 工作階段資料庫目標接收代理 id，
  而不是從 `session_key` 拆出。
- 代理對代理公告目標補水現在只使用具型別的 `sessions.list`
  `deliveryContext`。它不再從舊版 `origin`、鏡像 `last*` 欄位或
  `session_key` 形狀恢復通道/帳號/執行緒路由。
- `sessions_send` 執行緒目標拒絕現在讀取具型別 SQLite 路由中繼資料。
  它不再透過從目標鍵剖析執行緒後綴來拒絕或接受目標。
- 群組範圍工具政策驗證現在讀取目前或已產生工作階段的具型別 SQLite
  對話路由。它不再透過解碼 `sessionKey` 信任群組/通道身分；當沒有具型別
  工作階段資料列為呼叫端提供的群組 id 擔保時，這些 id 會被丟棄。
- 通道模型覆寫比對現在使用明確的群組與父對話中繼資料。它不再從
  `parentSessionKey` 解碼父對話 id。
- 已儲存模型覆寫繼承現在需要來自具型別工作階段情境的明確父工作階段鍵。
  它不再從 `sessionKey` 中的 `:thread:` 或 `:topic:` 後綴推導父覆寫。
- 舊的工作階段執行緒資訊包裝器和已載入外掛執行緒剖析器已移除；
  沒有執行階段程式碼匯入 `config/sessions/thread-info`。
- 通道對話輔助程式不再公開完整工作階段鍵剖析橋接。核心仍會透過
  `resolveSessionConversation(...)` 正規化提供者擁有的原始對話 id，
  但不會從 `sessionKey` 重建路由事實。
- 完成傳遞、傳送政策和任務維護不再從 `session_key` 形狀推導聊天型別。
  舊的聊天型別鍵剖析器已刪除；這些路徑需要具型別工作階段中繼資料、
  具型別傳遞情境或明確的傳遞目標詞彙。
- 工作階段清單/狀態、診斷、核准帳號綁定、終端介面心跳偵測篩選和使用量摘要
  不再挖掘 `SessionEntry.origin` 以取得提供者/帳號/執行緒/顯示路由。
  唯一剩餘的執行階段 `origin` 讀取是非工作階段概念或目前回合傳遞物件。
- 核准請求原生對話查詢現在讀取具型別的每代理工作階段路由資料列。
  它不再從 `sessionKey` 剖析通道/群組/執行緒對話身分；缺少具型別
  中繼資料是遷移/修復問題。
- 閘道工作階段 changed/chat/session 事件承載不再回傳
  `SessionEntry.origin` 或 `last*` 路由影子；用戶端會收到具型別的
  `channel`、`chatType` 和 `deliveryContext`。
- 心跳偵測傳遞解析現在可以直接接收具型別 SQLite `deliveryContext`，
  而心跳偵測執行階段會傳遞每代理工作階段傳遞資料列，而不是依賴相容性
  `session_entries` 影子取得目前路由。
- 排程隔離代理傳遞目標解析也會先從具型別每代理工作階段傳遞資料列補水
  其目前路由，然後才退回相容性項目承載。
- 子代理公告來源解析現在會透過 `loadRequesterSessionEntry` 串接具型別
  請求者工作階段傳遞情境，並優先使用該資料列，而不是相容性
  `last*`/`deliveryContext` 影子。
- 輸入工作階段中繼資料更新現在會先與具型別每代理傳遞資料列合併；
  舊的 `SessionEntry` 傳遞欄位只在不存在具型別對話資料列時作為備援。
- 重新啟動/更新傳遞擷取現在讓具型別 SQLite 傳遞 `threadId` 優先於從
  `sessionKey` 剖析的主題/執行緒片段；剖析只作為舊版執行緒形狀鍵的備援。
- hook 代理情境通道 id 現在優先使用具型別 SQLite 對話身分，其次是明確的
  訊息中繼資料。它們不再從 `sessionKey` 剖析提供者/群組/通道片段。
- 閘道 `chat.send` 外部路由繼承現在讀取具型別 SQLite 工作階段路由
  中繼資料，而不是從 `sessionKey` 片段推斷通道/直接/群組範圍。
  通道範圍工作階段只有在具型別工作階段通道與聊天型別符合已儲存的
  傳遞情境時才會繼承；shared-main 工作階段保留其更嚴格的
  命令列介面/無用戶端中繼資料規則。
- 重新啟動哨兵喚醒和延續路由現在會先讀取具型別 SQLite 傳遞/路由資料列，
  再佇列心跳偵測喚醒或路由代理回合延續。它不再從工作階段項目 JSON
  影子重建傳遞情境。
- 閘道 `tools.effective` 情境解析現在讀取具型別 SQLite 傳遞/路由資料列，
  以取得提供者、帳號、目標、執行緒和回覆模式輸入。它不再從過期的
  `session_entries.entry_json` origin 影子恢復這些熱門路由欄位。
- 即時語音諮詢路由現在從具型別每代理 SQLite 工作階段資料列解析父/通話傳遞。
  它在選擇嵌入式代理訊息路由時，不再退回相容性
  `SessionEntry.deliveryContext` 影子。
- ACP 產生心跳偵測轉送和父串流路由現在從具型別 SQLite 工作階段資料列讀取
  父傳遞。它們不再從相容性工作階段項目影子重建父傳遞情境。
- 工作階段傳遞路由保留現在遵循具型別聊天中繼資料和持久化傳遞欄位。
  它不再從 `sessionKey` 擷取通道提示、直接/main 標記或執行緒形狀；
  內部 webchat 路由只有在 SQLite 已有該工作階段的具型別/持久化傳遞身分時，
  才會繼承外部目標。
- 通用工作階段傳遞擷取現在只讀取精確的具型別 SQLite 工作階段傳遞資料列。
  它不再剖析執行緒/主題後綴，也不會從執行緒形狀鍵退回基底工作階段鍵。
- 回覆分派、重新啟動哨兵復原和即時語音諮詢路由現在使用精確的具型別
  SQLite 工作階段/對話資料列進行執行緒路由。它們不再透過剖析執行緒形狀
  工作階段鍵來恢復執行緒 id 或基底工作階段傳遞情境。
- Embedded PI 歷史限制現在使用具型別 SQLite 工作階段路由投影
  （`sessions` + 主要 `conversations`）取得提供者、聊天型別和對等身分。
  它不再從 `sessionKey` 剖析提供者、DM、群組或執行緒形狀。
- 排程工具傳遞推斷現在只使用明確傳遞或目前具型別傳遞情境。
  它不再從 `agentSessionKey` 解碼通道、對等端、帳號或執行緒目標。
- 執行階段工作階段資料列不再攜帶舊的 `lastProvider` 路由別名。
  輔助程式和測試使用具型別 `lastChannel` 與 `deliveryContext` 欄位；
  doctor 遷移是唯一應該轉譯較舊路由別名或持久化 `origin` 影子的地方。
- 轉錄事件、VFS 資料列和工具成品資料列現在寫入每代理資料庫。
  未發行的全域轉錄檔案對應表格已移除；doctor 會改在持久遷移資料列中
  記錄舊版來源路徑。
- 執行階段轉錄查詢不再掃描 JSONL 位元組位移或探測舊版轉錄檔案。
  閘道 chat/media/history 路徑會從 SQLite 讀取轉錄資料列；工作階段 JSONL
  現在只是舊版 doctor 輸入，而不是執行階段狀態或匯出格式。
- 轉錄父項和分支關係使用 SQLite 轉錄標頭中的結構化
  `parentTranscriptScope: {agentId, sessionId}` 中繼資料，而不是路徑樣式的
  `agent-db:...transcript_events...` 定位器字串。
- 轉錄管理器合約不再公開隱式持久化
  `create(cwd)` 或 `continueRecent(cwd)` 建構子。持久化轉錄管理器會以明確的
  `{agentId, sessionId}` 範圍開啟；只有記憶體內管理器仍可在測試和純轉錄
  轉換中不帶範圍。
- 執行階段轉錄儲存 API 會解析 SQLite 範圍，而不是檔案系統路徑。
  舊的 `resolve...ForPath` 輔助程式和未使用的 `transcriptPath` 寫入選項
  已從執行階段呼叫端移除。
- 執行階段工作階段解析現在使用 `{agentId, sessionId}`，且不得為外部邊界
  推導 `sqlite-transcript://<agent>/<session>` 字串。舊版絕對 JSONL 路徑
  只作為 doctor 遷移輸入。
- 原生 hook 轉送直接橋接記錄現在位於具型別共用
  `native_hook_relay_bridges` 資料列，並以轉送 id 為鍵。執行階段不再為這些
  短生命週期橋接記錄寫入 `/tmp` JSON 登錄或不透明的通用記錄。
- `runEmbeddedPiAgent(...)` 不再有轉錄定位器參數。
  已準備的 worker 描述元也會省略 transcript 定位器。Runtime session
  狀態與已排入佇列的 follow-up runs 會攜帶 `{agentId, sessionId}`，而不是
  衍生出的 transcript handles。
- 內嵌壓縮現在會從 `agentId` 與 `sessionId` 取得 SQLite scope。
  壓縮 hooks、context-engine calls、命令列介面 delegation，以及 protocol replies
  不得接收衍生出的 `sqlite-transcript://...` handles。Export/debug code
  可以從 rows 具體化明確的 user artifacts，但不提供
  generic session JSONL export path，也不會把 file names 回饋到 runtime
  identity。
- `/export-session` 會從 SQLite 讀取 transcript rows，並只寫入請求的
  standalone HTML view。內嵌 viewer 不再從那些 rows 重建或
  下載 session JSONL。
- Context-engine delegation 不再解析 transcript locator 來復原
  agent identity。已準備的 runtime context 會把已解析的 `agentId`
  帶入內建壓縮 adapter。
- Transcript rewrite 與 live tool-result truncation 現在會依
  `{agentId, sessionId}` 讀取並持久化 transcript state，且不會為
  transcript-update event payloads 衍生 temporary locators。
- transcript-state helper surface 不再有以 locator 為基礎的
  `readTranscriptState`、`replaceTranscriptStateEvents` 或
  `persistTranscriptStateMutation` variants。Runtime callers 必須使用
  `{agentId, sessionId}` APIs。Doctor import 會依明確的 file
  path 讀取 legacy files 並寫入 SQLite rows；它不會遷移 locator strings。
- runtime session-manager contract 不再暴露 `open(locator)`、
  `forkFrom(locator)` 或 `setTranscriptLocator(...)`。Persisted session
  managers 只會依 `{agentId, sessionId}` 開啟；list/fork helpers 位於
  row-oriented session 與 checkpoint APIs，而不是 transcript manager
  facade。
- 閘道 transcript reader APIs 以 scope 優先。它們接收
  `{agentId, sessionId}`，且不接受可能意外成為 runtime identity 的
  positional transcript locator。Active transcript locator parsing 已移除；
  legacy source paths 只由 doctor import code 讀取。
- Transcript update events 也以 scope 優先。`emitSessionTranscriptUpdate`
  不再接受裸 locator string，而 listeners 會依
  `{agentId, sessionId}` 路由，不解析 handle。
- 閘道 session-message broadcast 會從 agent/session
  scope 解析 session keys，而不是從 transcript locator。舊的
  transcript-locator-to-session key resolver/cache 已移除。
- 閘道 session-history SSE 會依 agent/session scope 篩選 live updates。它不再
  canonicalizes transcript locator candidates、realpaths 或 file-shaped
  transcript identities 來決定 stream 是否應接收 update。
- Session lifecycle hooks 不再於
  `session_end` 衍生或暴露 transcript locators。Hook consumers 會取得
  `sessionId`、`sessionKey`、next-session
  ids，以及 agent context；transcript files 不是 lifecycle
  contract 的一部分。
- Reset hooks 也不再衍生或暴露 transcript locators。
  `before_reset` payload 會攜帶 recovered SQLite messages 與 reset
  reason，而 session identity 保持在 hook context 中。
- Agent harness reset 不再接受 transcript locator。Reset dispatch 會
  依 `sessionId`/`sessionKey` 加上 reason 設定 scope。
- Agent extension session types 不再暴露 `transcriptLocator`；extensions
  應使用 session context 與 runtime APIs，而不是存取
  file-shaped transcript identity。
- 外掛壓縮 hooks 不再暴露 transcript locators。Hook context
  已攜帶 session identity，而 transcript reads 必須透過 SQLite
  scope-aware APIs，而不是 file-shaped handles。
- `before_agent_finalize` hooks 不再暴露 `transcriptPath`，包括
  native hook relay payloads。Finalization hooks 只使用 session context。
- 閘道 reset responses 不再在
  returned entry 上合成 transcript locator。Reset 會建立 SQLite transcript rows、回傳乾淨的
  session entry，並把 transcript access 交給 scope-aware readers。
- 內嵌 run 與壓縮 results 不再為
  session accounting surfaced transcript locators。Automatic compaction 只會更新 active `sessionId`、
  compaction counters 與 token metadata。
- Embedded attempt results 不再回傳 `transcriptLocatorUsed`，且
  context-engine `compact()` results 不再回傳 transcript locators。
  Runtime retry loops 只接受 successor `sessionId`。
- Delivery-mirror transcript append results 不再回傳 transcript
  locators。Callers 會取得 appended `messageId`；transcript update signals 使用
  SQLite scope。
- Parent-session fork helpers 只回傳 forked `sessionId`。Subagent
  preparation 會把 child agent/session scope 傳給 engines。
- 命令列介面 runner params 與 history reseeding 不再接受 transcript locators。
  命令列介面 history reads 會從 `{agentId,
sessionId}` 與 session key context 解析 SQLite transcript scope。
- 命令列介面與 embedded-runner test fixtures 現在會依 session id seed 並讀取 SQLite transcript rows，
  而不是假裝 active sessions 是 `*.jsonl` files，或
  透過 runtime params 傳遞 `sqlite-transcript://...` string。
- Session tool-result guard events 會從已知 session scope emit，即使
  in-memory manager 沒有衍生 locator。它的 tests 不再偽造 active
  `/tmp/*.jsonl` transcript files。
- BTW 與 compaction-checkpoint helpers 現在會依
  SQLite scope 讀取與 fork transcript rows。Checkpoint metadata 現在只儲存 session ids 與 leaf/entry ids；
  衍生出的 locators 不再寫入 checkpoint payloads。
- 閘道 transcript-key lookup 會在 protocol
  boundaries 使用 SQLite transcript scope，且不再 realpaths 或 stats transcript filenames。
- Automatic compaction transcript rotation 會直接透過 SQLite transcript store 寫入 successor transcript rows。
  Session rows 只保留 successor session identity，而不是 durable JSONL path 或 persisted locator。
- Embedded context-engine compaction 使用 SQLite-named transcript rotation
  helpers。Rotation tests 不再建構 JSONL successor paths，或
  將 active sessions model 為 files。
- Managed outgoing image retention 會從
  SQLite transcript stats 為它的 transcript-message cache 建 key，而不是使用 filesystem stat calls。
- Runtime session locks 與 standalone legacy `.jsonl.lock` doctor
  lane 已移除。
- Microsoft Teams runtime barrel 與 public 外掛 SDK 不再 re-export
  舊的 file-lock helper；durable 外掛 state paths 由 SQLite-backed。
- Session age/count pruning 與 explicit session cleanup 已移除。
  Doctor 負責 legacy import；stale sessions 會被明確 reset 或 delete。
- Doctor integrity checks 不再把 legacy JSONL file 視為 SQLite session row 的有效 active
  transcript。Active transcript health 只看 SQLite；
  legacy JSONL files 會被回報為 migration/orphan-cleanup inputs。
- Doctor 不再把 `agents/<agent>/sessions/` 視為必要 runtime
  state。它只會在該 directory 已存在時掃描，作為 legacy import
  或 orphan-cleanup input。
- 閘道 `sessions.resolve`、session patch/reset/compact paths、subagent
  spawning、fast abort、ACP metadata、heartbeat-isolated sessions，以及終端介面
  patching 不再把 migrate 或 prune legacy session keys 作為
  normal runtime work 的 side effect。
- 命令列介面 command session resolution 現在會回傳 owning `agentId`，而不是
  `storePath`，且在 normal
  `--to` 或 `--session-id` resolution 期間不再複製 legacy main-session rows。Legacy main-row canonicalization
  只屬於 doctor。
- Runtime subagent depth resolution 不再讀取 `sessions.json` 或 JSON5
  session stores。它會依 agent id 讀取 SQLite `session_entries`，而 legacy
  depth/session metadata 只能透過 doctor import path 進入。
- Auth profile session overrides 會透過直接 `{agentId, sessionKey}`
  row upserts 持久化，而不是 lazy-loading file-shaped session-store runtime。
- Auto-reply verbose gating 與 session update helpers 現在會依 session identity 讀取/upsert SQLite
  session rows，且不再需要 legacy store path
  才能觸碰 persisted row state。
- Command-run session metadata helpers 現在使用 entry-oriented names 與 module
  paths；舊的 `session-store` command helper surface 已移除。
- Bootstrap header seeding 與 manual compaction boundary hardening 現在會直接 mutate
  SQLite transcript rows。Runtime callers 會傳遞 session identity，而不是
  writable `.jsonl` paths。
- Silent session-rotation replay 會依
  `{agentId, sessionId}` 從 SQLite transcript rows 複製近期 user/assistant turns。它不再接受
  source 或 target transcript locators。
- Fresh runtime session rows 不再儲存 transcript locators。Callers 會直接使用
  `{agentId, sessionId}`；export/debug commands 可以在具體化 rows 時選擇 output file
  names。
- Starting a new persisted transcript session 現在一律依
  scope 開啟 SQLite rows。Session manager 不再把先前 file-era transcript
  path 或 locator 作為新 session 的 identity 重用。
- Persisted transcript sessions 使用明確的
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API。舊的
  static `SessionManager.create/openForSession/list/forkFromSession` facades 已
  移除，因此 tests 與 runtime code 無法意外重新建立 file-era session
  discovery。
- 外掛 runtime 不再暴露 `api.runtime.agent.session.resolveTranscriptLocatorPath`；
  外掛 code 使用 SQLite row helpers 與 scope values。
- Public `session-store-runtime` SDK surface 現在只 export session row
  與 transcript row helpers。聚焦的 SQLite schema/path/transaction helpers
  位於 `sqlite-runtime`；raw open/close/reset helpers 仍只在 local first-party tests 使用。
- Legacy `.jsonl` trajectory/checkpoint filename classifiers 現在位於
  doctor legacy session-file module。Core session validation 不再 imports
  file-artifact helpers 來判斷 normal SQLite session ids。
- Active-memory blocking subagent runs 使用 SQLite transcript rows，而不是
  在外掛 state 下建立 temporary 或 persisted `session.jsonl` files。舊的
  `transcriptDir` option 已移除。
- One-off slug generation 與 Crestodian planner runs 使用 SQLite transcript rows，
  而不是建立 temporary `session.jsonl` files。
- `llm-task` helper runs 與 hidden commitment extraction 也使用 SQLite
  transcript rows，因此這些 model-only helper sessions 不再建立
  temporary JSON/JSONL transcript files。
- `TranscriptSessionManager` 現在只是 opened SQLite transcript scope。
  Runtime code 會用 `openTranscriptSessionManagerForSession({agentId,
sessionId})` 開啟它；create、branch、continue、list 與 fork flows 位於它們
  owning SQLite row helpers，而不是 static manager facades。
  Doctor/import/debug code 會在 runtime session manager 外處理明確的 legacy source files。
- Stale `SessionManager.newSession()` 與
  `SessionManager.createBranchedSession()` facade methods 已移除。New
  sessions 與 transcript descendants 由它們 owning SQLite
  workflow 建立，而不是把已開啟的 manager mutate 成不同的
  persisted session。
- Parent transcript fork decisions 與 fork creation 不再接受
  `storePath` 或 `sessionsDir`；它們使用 `{agentId, sessionId}` SQLite
  transcript scope，而不是保留的 filesystem path metadata。
- Memory-host 不再 export no-op session-directory transcript
  classification helpers；transcript filtering 現在會在 entry construction 期間從 SQLite row
  metadata 衍生。
- Memory-host 與 QMD session-export tests 使用 SQLite transcript scopes。舊的
  `agents/<agentId>/sessions/*.jsonl` paths 只在 test 有意證明 doctor/import/export compatibility
  的地方維持涵蓋。
- QA-lab raw session inspection 現在透過閘道使用 `sessions.list`
  而不是讀取 `agents/qa/sessions/sessions.json`；MSteams 回饋會直接附加到 SQLite 逐字稿，而不會偽造 JSONL 路徑。
- 共用傳入頻道回合現在攜帶 `{agentId, sessionKey}`，而不是舊版 `storePath`。LINE、WhatsApp、Slack、Discord、Telegram、Matrix、Signal、iMessage、BlueBubbles、Feishu、Google Chat、IRC、Nextcloud Talk、Zalo、Zalo Personal、QA Channel、Microsoft Teams、Mattermost、Synology Chat、Tlon、Twitch，以及 QQ Bot 記錄路徑現在會讀取 updated-at 中繼資料，並透過 SQLite 身分記錄傳入工作階段資料列。
- 逐字稿定位器持久化已從作用中工作階段資料列移除。`resolveSessionTranscriptTarget` 會回傳 `agentId`、`sessionId`，以及選用的主題中繼資料；doctor 是唯一會匯入舊版逐字稿檔名的程式碼。
- 執行階段逐字稿標頭從 SQLite 版本 `1` 開始。舊 JSONL V1/V2/V3 形狀升級只存在於 doctor 匯入中，並會在資料列儲存前，將匯入的標頭正規化為目前的 SQLite 逐字稿版本。
- database-first 防護現在禁止 `SessionManager.listAll` 和 `SessionManager.forkFromSession`；工作階段列表與 fork/restore 工作流程必須留在資料列/作用域化的 SQLite API 上。
- 該防護也禁止在 doctor/import 程式碼以外使用舊版逐字稿 JSONL 剖析/作用中分支修復輔助工具名稱，因此執行階段無法長出第二條舊版逐字稿遷移路徑。
- 嵌入式 PI 執行會拒絕傳入的逐字稿控制代碼。它們會在 worker 啟動前，以及嘗試觸碰逐字稿狀態前，再次使用 SQLite `{agentId, sessionId}` 身分。過期的 `/tmp/*.jsonl` 輸入無法選取執行階段寫入目標。
- 快取追蹤、Anthropic 承載、原始串流，以及診斷時間軸記錄，現在會寫入型別化 SQLite `diagnostic_events` 資料列。閘道穩定性套件現在會寫入型別化 SQLite `diagnostic_stability_bundles` 資料列。舊的 `diagnostics.cacheTrace.filePath`、`OPENCLAW_CACHE_TRACE_FILE`、`OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`，以及 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL 覆寫路徑已移除，且一般穩定性擷取不再寫入 `logs/stability/*.json` 檔案。
- 排程持久化現在會調和 SQLite `cron_jobs` 資料列，而不是在每次儲存時刪除並重新插入整個作業表。外掛目標回寫會直接更新相符的排程資料列，並在相同的狀態資料庫交易中保留執行階段排程狀態。
- 排程執行階段呼叫者現在使用穩定的 SQLite 排程儲存鍵。舊版 `cron.store` 路徑僅是 doctor 匯入輸入；生產閘道、工作維護、狀態、執行記錄，以及 Telegram 目標回寫路徑會使用 `resolveCronStoreKey`，且不再對該鍵進行路徑正規化。排程狀態現在回報 `storeKey`，而不是舊的檔案形狀 `storePath` 欄位。
- 排程執行階段載入和排程安排不再正規化舊版持久化作業形狀，例如 `jobId`、`schedule.cron`、數值 `atMs`、字串布林值，或缺少 `sessionTarget`。doctor 舊版匯入負責在資料列插入 SQLite 前完成這些修復。
- ACP spawn 不再解析或持久化逐字稿 JSONL 檔案路徑。Spawn 和 thread-bind 設定會直接持久化 SQLite 工作階段資料列，並保留工作階段 ID 作為留存的逐字稿身分。
- ACP 工作階段中繼資料 API 現在會依 `agentId` 讀取/列出/upsert SQLite 資料列，且不再將 `storePath` 作為 ACP 工作階段項目合約的一部分公開。
- 工作階段用量計算和閘道用量彙總現在只透過 `{agentId, sessionId}` 解析逐字稿。成本/用量快取和探索到的工作階段摘要不再合成或回傳逐字稿定位器字串。
- 閘道聊天附加、中止部分持久化、`/sessions.send`，以及 webchat 媒體逐字稿寫入，會直接透過 SQLite 逐字稿作用域附加。閘道逐字稿注入輔助工具不再接受 `transcriptLocator` 參數。
- SQLite 逐字稿探索現在只列出逐字稿作用域和統計資料：`{agentId, sessionId, updatedAt, eventCount}`。已停用的 `listSqliteSessionTranscriptLocators` 相容性輔助工具和每列 `locator` 欄位都已移除。
- 逐字稿修復執行階段現在只公開 `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`。舊的定位器式修復輔助工具已刪除；doctor/debug 程式碼會讀取明確的來源檔案路徑，且永遠不會遷移定位器字串。
- ACP replay ledger 執行階段現在將每個工作階段的 replay 資料列儲存在共用 SQLite 狀態資料庫，而不是 `acp/event-ledger.json`；doctor 會匯入並移除舊版檔案。
- 閘道逐字稿讀取器輔助工具現在位於 `src/gateway/session-transcript-readers.ts`，而不是舊的 `session-utils.fs` 模組名稱。fallback retry 歷史檢查現在以 SQLite 逐字稿內容命名，而不是舊的檔案輔助工具介面。
- 閘道 injected-chat 和壓縮輔助工具現在會透過內部輔助 API 傳遞 SQLite 逐字稿作用域，而不是將值命名為逐字稿路徑或來源檔案。
- Bootstrap continuation 偵測現在會透過 `hasCompletedBootstrapTranscriptTurn` 檢查 SQLite 逐字稿資料列；它不再公開檔案形狀的輔助工具名稱。
- embedded-runner 測試現在使用 SQLite 逐字稿身分，且開啟新的逐字稿管理器一律需要明確的 `sessionId`。
- 記憶索引輔助工具現在從頭到尾使用 SQLite 逐字稿術語：host 匯出 `listSessionTranscriptScopesForAgent` 和 `sessionTranscriptKeyForScope`，目標同步佇列為 `sessionTranscripts`，公開工作階段搜尋命中會公開不透明的 `transcript:<agent>:<session>` 路徑，而內部 DB 來源鍵是在 `source_kind='sessions'` 下的 `session:<session>`，而不是假的檔案路徑。
- 通用外掛 SDK 持久化去重輔助工具不再公開檔案形狀的選項。呼叫者會提供 SQLite 作用域鍵，而耐久去重資料列會存放在共用外掛狀態中。
- Microsoft Teams SSO token 已從鎖定的 JSON 檔案移至 SQLite 外掛狀態。Doctor 會匯入 `msteams-sso-tokens.json`，從承載重建標準 SSO token 鍵，並移除來源檔案。委派的 OAuth token 仍留在既有的私有憑證檔案邊界上。
- Matrix 同步快取狀態已從 `bot-storage.json` 移至 SQLite 外掛狀態。Doctor 會匯入舊版原始或包裝後的同步承載，並移除來源檔案。作用中的 Matrix 和 QA Matrix 用戶端會傳遞 SQLite sync-store 根目錄，而不是假的 `sync-store.json` 或 `bot-storage.json` 路徑。
- Matrix 舊版加密遷移狀態已從 `legacy-crypto-migration.json` 移至 SQLite 外掛狀態。Doctor 會匯入舊狀態檔；Matrix SDK IndexedDB 快照已從 `crypto-idb-snapshot.json` 移至 SQLite 外掛 blob。Matrix 復原鍵和憑證是 SQLite 外掛狀態資料列；其舊 JSON 檔案僅是 doctor 遷移輸入。
- Memory Wiki 活動記錄現在使用 SQLite 外掛狀態，而不是 `.openclaw-wiki/log.jsonl`。Memory Wiki 遷移提供者會匯入舊 JSONL 記錄；wiki markdown 和使用者 vault 內容仍作為工作區內容由檔案支援。
- Memory Wiki 不再建立 `.openclaw-wiki/state.json` 或未使用的 `.openclaw-wiki/locks` 目錄。如果較舊的 vault 仍有這些已退役的外掛中繼資料檔案，遷移提供者會移除它們。
- Crestodian 稽核項目現在使用核心 SQLite 外掛狀態，而不是 `audit/crestodian.jsonl`。Doctor 會匯入舊版 JSONL 稽核記錄，並在成功匯入後移除它。
- 設定寫入/觀察稽核項目現在使用核心 SQLite 外掛狀態，而不是 `logs/config-audit.jsonl`。Doctor 會匯入舊版 JSONL 稽核記錄，並在成功匯入後移除它。
- macOS companion 在編輯 `openclaw.json` 時，不再寫入應用程式本機的 `logs/config-audit.jsonl` 或 `logs/config-health.json` sidecar。設定檔仍由檔案支援，復原快照仍留在設定檔旁邊，而耐久設定稽核/健康狀態屬於閘道 SQLite 儲存。
- Crestodian rescue 待核准項目現在使用核心 SQLite 外掛狀態，而不是 `crestodian/rescue-pending/*.json`。Doctor 會匯入舊版待核准檔案，並在成功匯入後移除它們。
- Phone Control 暫時 arm 狀態現在使用 SQLite 外掛狀態，而不是 `plugins/phone-control/armed.json`。Doctor 會將舊版 armed-state 檔案匯入 `phone-control/arm-state` 命名空間，並移除該檔案。
- Doctor 不再就地修復 JSONL 逐字稿或建立備份 JSONL 檔案。它會將作用中分支匯入 SQLite，並移除舊版來源。
- session-memory hook 逐字稿查詢使用 `{agentId, sessionId}` 作用域限定的 SQLite 讀取。其輔助工具不再接受或衍生逐字稿定位器、舊版檔案讀取，或檔案重寫選項。
- Codex app-server 對話繫結現在依 OpenClaw 工作階段鍵或明確的 `{agentId, sessionId}` 作用域作為 SQLite 外掛狀態鍵。它們不得保留逐字稿路徑 fallback 繫結。
- Codex app-server mirrored-history 讀取只使用 SQLite 逐字稿作用域；它們不得從逐字稿檔案路徑復原身分。
- role-ordering 和壓縮重設路徑不再 unlink 舊逐字稿檔案；重設只會輪替 SQLite 工作階段資料列和逐字稿身分。
- 閘道重設和 checkpoint 回應會回傳乾淨的工作階段資料列加上工作階段 ID。它們不再為用戶端合成 SQLite 逐字稿定位器。
- memory-core 夢境整理不再透過探查缺少的 JSONL 檔案來修剪工作階段資料列。Subagent cleanup 會透過工作階段執行階段 API，而不是檔案系統存在性檢查。其逐字稿擷取測試會直接種入 SQLite 資料列，而不是建立 `agents/<id>/sessions` fixture 或定位器 placeholder。
- 記憶逐字稿索引可能會將 `transcript:<agentId>:<sessionId>` 作為 citation/read 輔助工具的虛擬搜尋命中路徑公開。耐久索引來源是關聯式的（`source_kind='sessions'`、`source_key='session:<sessionId>'`、`session_id=<sessionId>`），因此該值不是執行階段逐字稿定位器，不是檔案系統路徑，也絕不得傳回工作階段執行階段 API。
- 閘道 doctor 記憶狀態會從 SQLite 外掛狀態資料列讀取短期 recall 和 phase-signal 計數，而不是 `memory/.dreams/*.json`；命令列介面和 doctor 輸出現在會將該儲存標示為 SQLite 儲存，而不是路徑。
- memory-core 執行階段、命令列介面狀態、閘道 doctor 方法，以及外掛 SDK facade 不再稽核或封存舊版 `.dreams/session-corpus` 檔案。這些檔案僅是遷移輸入；doctor 會將它們匯入 SQLite，並在驗證後刪除來源。作用中工作階段擷取證據資料列現在使用虛擬 SQLite 路徑 `memory/session-ingestion/<day>.txt`；執行階段永遠不會從 `.dreams/session-corpus` 寫入或衍生狀態。
- memory-core 公開成品會將 SQLite host event 公開為虛擬 JSON 成品 `memory/events/memory-host-events.json`；它們不再重用舊版 `.dreams/events.jsonl` 來源路徑。
- Sandbox 容器/瀏覽器登錄現在使用共用 `sandbox_registry_entries` SQLite 表，並包含型別化工作階段、映像、時間戳、backend/config，以及瀏覽器連接埠欄位。Doctor 會匯入舊版單體與分片 JSON 登錄檔，並移除成功的來源。執行階段讀取會使用型別化資料列欄位作為事實來源；`entry_json` 只是一份 replay/debug 副本。
- Commitments 現在使用型別化共用 `commitments` 表，而不是整個儲存的 JSON blob。快照儲存會依 commitment id upsert，且只刪除缺少的資料列，而不是清空並重新插入整個表。執行階段會從型別化 scope、delivery-window、status、attempt，以及 text 欄位載入 commitments；`record_json` 只是一份 replay/debug 副本。Doctor 會匯入舊版 `commitments.json`，並在成功匯入後移除它。
- 排程作業定義、排程狀態，以及執行歷史不再有執行階段 JSON 寫入器或讀取器。執行階段使用具有型別化排程的 `cron_jobs` 資料列，
  payload、delivery、failure-alert、session、status 和 runtime-state 欄位，以及型別化的
  `cron_run_logs` metadata，用於 status、diagnostics summary、delivery status/error、
  session/run、model 和 token totals。`job_json` 只是 replay/debug 副本；`state_json` 保留尚未有熱查詢欄位的巢狀
  runtime diagnostics，而 runtime
  會從型別化欄位重新補水熱狀態欄位。Doctor 會匯入
  舊版 `jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 檔案，並移除
  已匯入的來源。外掛目標回寫會更新相符的 `cron_jobs`
  列，而不是載入並取代整個 cron store。
- 閘道啟動會忽略 runtime
  projection 中的舊版 `notify: true` 標記。Doctor 會在
  `cron.webhook` 有效時將它們轉換為明確的 SQLite delivery；在未設定時移除惰性標記；並在設定的 webhook 無效時
  保留它們並發出警告。
- Outbound 和 session delivery 佇列現在會將 queue status、entry kind、
  session key、channel、target、account id、retry count、last attempt/error、
  recovery state 和 platform-send markers 作為型別化欄位儲存在共享的
  `delivery_queue_entries` 資料表中。Runtime recovery 會從
  型別化欄位讀取這些熱欄位，retry/recovery mutation 會直接更新這些欄位，
  而不重寫 replay JSON。完整 JSON payload 只保留作為
  message bodies 和其他冷 replay 資料的 replay/debug blob。
- 受管理的 outgoing image records 現在使用型別化共享
  `managed_outgoing_image_records` 列，media bytes 仍儲存在
  `media_blobs`。JSON record 只保留作為 replay/debug 副本。
- Discord model-picker preferences、command-deploy hashes 和 thread bindings
  現在使用共享 SQLite plugin state。它們的舊版 JSON import plans 位於
  Discord 外掛 setup/doctor migration surface，而不是 core migration code。
- 外掛 legacy import detectors 使用 doctor 命名的模組，例如
  `doctor-legacy-state.ts` 或 `doctor-state-imports.ts`；一般 channel runtime
  模組不得匯入 legacy JSON detectors。
- BlueBubbles catchup cursors 和 inbound dedupe markers 現在使用共享 SQLite
  plugin state。它們的舊版 JSON import plans 位於 BlueBubbles 外掛
  setup/doctor migration surface，而不是 core migration code。
- Telegram update offsets、sticker cache rows、sent-message cache rows、
  topic-name cache rows 和 thread bindings 現在使用共享 SQLite plugin
  state。它們的舊版 JSON import plans 位於 Telegram 外掛
  setup/doctor migration surface，而不是 core migration code。
- iMessage catchup cursors、reply short-id mappings 和 sent-echo dedupe rows
  現在使用共享 SQLite plugin state。舊的 `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl` 和 `imessage/sent-echoes.jsonl` 檔案僅作為
  doctor 輸入。
- Feishu message dedupe rows 現在使用共享 SQLite plugin state，而不是
  `feishu/dedup/*.json` 檔案。其舊版 JSON import plan 位於 Feishu
  外掛 setup/doctor migration surface，而不是 core migration code。
- Microsoft Teams conversations、polls、pending upload buffers 和 feedback
  learnings 現在使用共享 SQLite plugin state/blob tables。pending upload
  path 使用 `plugin_blob_entries`，因此 media buffers 會儲存為 SQLite BLOB，
  而不是 base64 JSON。runtime helper 名稱現在使用 SQLite/state 命名，
  而不是 `*-fs` file-store 命名，且舊的 `storePath` shim 已從這些 stores
  移除。其舊版 JSON import plan 位於 Microsoft Teams 外掛 setup/doctor migration surface。
- Zalo hosted outbound media 現在使用共享 SQLite `plugin_blob_entries`，
  而不是 `openclaw-zalo-outbound-media` JSON/bin temp sidecars。
- Diffs viewer HTML 和 metadata 現在使用共享 SQLite `plugin_blob_entries`，
  而不是 `meta.json`/`viewer.html` 暫存檔。Rendered PNG/PDF outputs 仍是
  temp materializations，因為 channel delivery 仍需要 file path。
- Canvas managed documents 現在使用共享 SQLite `plugin_blob_entries`，
  而不是預設的 `state/canvas/documents` 目錄。Canvas host 會直接提供這些
  blobs；只有在明確的 `host.root`
  operator content 或 downstream media reader 需要 path 的 temporary materialization
  時，才會建立本機檔案。
- File Transfer audit decisions 現在使用共享 SQLite `plugin_state_entries`，
  而不是無界的 `audit/file-transfer.jsonl` runtime log。Doctor
  會將舊版 JSONL audit file 匯入 plugin state，並在乾淨匯入後移除來源。
- ACPX process leases 和 gateway instance identity 現在使用共享 SQLite plugin
  state。Doctor 會將舊版 `gateway-instance-id` 檔案匯入 plugin state
  並移除來源。
- ACPX generated wrapper scripts 和 isolated Codex home 是 OpenClaw temp root
  下的 temporary materialization，不是 durable OpenClaw state。durable ACPX
  runtime records 是 SQLite lease 和 gateway-instance rows；舊的 ACPX
  `stateDir` config surface 已移除，因為不再有 runtime state 寫入該處。
- 閘道 media attachments 現在使用共享的 `media_blobs` SQLite 資料表作為
  canonical byte store。回傳給 channel 和 sandbox compatibility surfaces 的 local paths
  是 database row 的 temp materializations，不是 durable media store。
  Runtime media allowlists 不再包含舊版 `$OPENCLAW_STATE_DIR/media` 或
  config-dir `media` roots；這些目錄只作為 doctor import sources。
- Shell completion 不再寫入 `$OPENCLAW_STATE_DIR/completions/*` cache
  files。Install、doctor、update 和 release smoke paths 會使用產生的
  completion output 或 profile sourcing，而不是 durable completion cache
  files。
- 閘道 skill-upload staging 現在使用共享的 `skill_uploads` 列。Upload
  metadata、idempotency keys 和 archive bytes 位於 SQLite；installer
  只會在 install 執行期間收到 temporary materialized archive path。
- Subagent inline attachments 不再 materialize 到 workspace
  `.openclaw/attachments/*` 下。spawn path 會準備 SQLite VFS seed entries，
  inline runs 會將這些 entries seed 到 per-agent runtime scratch namespace，
  disk-backed tools 則會針對 attachment paths 疊加該 SQLite scratch。舊的
  subagent-run attachment-dir registry columns 和 cleanup hooks 已移除。
- 命令列介面 image hydration 不再維護穩定的 `openclaw-cli-images` cache
  files。External CLI backends 仍會收到 file paths，但這些 paths 是
  per-run temp materializations，並會清理。
- Cache-trace diagnostics、Anthropic payload diagnostics、raw model stream
  diagnostics、diagnostics timeline events 和閘道 stability bundles 現在
  寫入 SQLite rows，而不是 `logs/*.jsonl` 或
  `logs/stability/*.json` 檔案。
  Runtime path override flags 和 env vars 已移除；export/debug
  commands 可以從 database rows 明確 materialize files。
- macOS companion 不再有 rolling `diagnostics.jsonl` writer。App
  logs 會進入 unified logging，而 durable 閘道 diagnostics 維持 SQLite-backed。
- macOS port-guardian record list 現在使用型別化共享 SQLite
  `macos_port_guardian_records` 列，而不是 Application Support JSON 檔案
  或 opaque singleton blob。
- 閘道 singleton locks 現在使用 `gateway_locks` scope 下型別化共享 SQLite
  `state_leases` 列，而不是 temp-dir lock files。Fly 和 OAuth
  troubleshooting docs 現在指向 SQLite lease/auth refresh lock，而不是過時的 file-lock cleanup。
- 閘道 restart sentinel state 現在使用型別化共享 SQLite
  `gateway_restart_sentinel` 列，而不是 `restart-sentinel.json`；runtime
  會從型別化欄位讀取 sentinel kind、status、routing、message、continuation 和 stats。
  `payload_json` 只是 replay/debug 副本。Runtime code 會直接清除
  SQLite row，且不再攜帶 file cleanup plumbing。
- 閘道 restart intent 和 supervisor handoff state 現在使用型別化共享
  SQLite `gateway_restart_intent` 和 `gateway_restart_handoff` 列，而不是
  `gateway-restart-intent.json` 和
  `gateway-supervisor-restart-handoff.json` sidecars。
- 閘道 singleton coordination 現在使用 `gateway_locks` 下型別化
  `state_leases` 列，而不是寫入 `gateway.<hash>.lock` 檔案。lease row
  擁有 lock owner、expiry、heartbeat 和 debug payload；SQLite 擁有
  atomic acquire/release boundary。已淘汰的 file-lock directory option
  已移除；tests 直接使用 SQLite row identity。
- 舊的未被參照 cron usage-report helper 會掃描 `cron/runs/*.jsonl`
  檔案，現已刪除。Cron run history reports 應讀取型別化
  `cron_run_logs` SQLite rows。
- Main-session restart recovery 現在透過 SQLite `agent_databases` registry
  發現 candidate agents，而不是掃描 `agents/*/sessions`
  目錄。
- Gemini session-corruption recovery 現在只刪除 SQLite session row；
  它不再需要舊版 `storePath` gate，也不會嘗試 unlink 衍生的
  transcript JSONL path。
- Path override handling 現在會將字面 `undefined`/`null` environment
  values 視為未設定，避免 tests 或 shell handoffs 期間意外產生 repo-root
  `undefined/state/*.sqlite` databases。
- Config health fingerprints 現在使用型別化共享 SQLite `config_health_entries`
  列，而不是 `logs/config-health.json`，讓一般 config file 成為唯一的
  non-credential configuration document。macOS companion 只保留 process-local
  health state，且不會重新建立舊的 JSON sidecar。
- Auth profile runtime 不再匯入或寫入 credential JSON files。
  canonical credential store 是 SQLite；`auth-profiles.json`、per-agent
  `auth.json` 和 shared `credentials/oauth.json` 是 doctor migration inputs，
  匯入後會移除。
- Auth profile save/state tests 現在直接斷言型別化 SQLite auth tables，
  且只會將 legacy auth-profile filenames 用於 doctor migration inputs。
- `openclaw secrets apply` 只會清理 config file、env file 和 SQLite
  auth-profile store。它不再攜帶會編輯已淘汰 per-agent `auth.json` 的
  compatibility logic；doctor 負責匯入並刪除該檔案。
- Hermes secret migration plans 和 applies 會將匯入的 API-key profiles 直接放入
  SQLite auth-profile store。它不再將 `auth-profiles.json` 寫入或驗證為
  intermediate target。
- User-facing auth docs 現在描述
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`，而不是
  告訴使用者檢查或複製 `auth-profiles.json`；舊版 OAuth/auth JSON
  名稱只會作為 doctor-import inputs 保留在文件中。
- Core state-path helpers 不再暴露已淘汰的 `credentials/oauth.json`
  檔案。舊版檔名僅限 doctor auth import path 本地使用。
- Install、security、onboarding、model-auth 和 SecretRef docs 現在描述
  SQLite auth-profile rows 和 whole-state backup/migration，而不是
  per-agent auth-profile JSON files。
- PI model discovery 現在會將 canonical credentials 傳入 in-memory
  `pi-coding-agent` auth storage。它不再於 discovery 期間建立、清理或寫入
  per-agent `auth.json`。
- Voice Wake trigger 和 routing settings 現在使用型別化共享 SQLite tables，
  而不是 `settings/voicewake.json`、`settings/voicewake-routing.json` 或
  opaque generic rows；doctor 會匯入舊版 JSON files，並在成功 migration 後移除它們。
- Update-check state 現在使用型別化共享 `update_check_state` row，而不是
  `update-check.json` 或 opaque generic blob；doctor 會匯入
  舊版 JSON file，並在成功 migration 後移除它。
- Config health state 現在使用型別化共享 `config_health_entries` rows，而不是
  `logs/config-health.json` 或 opaque generic blob；doctor
  會匯入舊版 JSON file，並在成功 migration 後移除它。
- 外掛 conversation binding approvals 現在使用型別化
  `plugin_binding_approvals` rows，而不是 opaque shared SQLite state 或
  `plugin-binding-approvals.json`；舊版檔案是 doctor 遷移輸入。
- 通用目前對話繫結現在會儲存具型別的
  `current_conversation_bindings` 資料列，而不是重寫
  `bindings/current-conversations.json`；doctor 會匯入舊版 JSON 檔案，並在成功遷移後
  將其移除。
- 記憶 Wiki 匯入來源同步帳本現在會為每個保存庫/來源鍵儲存一個 SQLite 外掛狀態資料列，
  而不是重寫 `.openclaw-wiki/source-sync.json`；
  遷移提供者會匯入並移除舊版 JSON 帳本。
- 記憶 Wiki ChatGPT 匯入執行記錄現在會為每個保存庫/執行 ID 儲存一個 SQLite 外掛狀態資料列，
  而不是寫入 `.openclaw-wiki/import-runs/*.json`。
  回復快照會維持為明確的保存庫檔案，直到匯入執行快照
  封存移至 blob 儲存為止。
- 記憶 Wiki 編譯摘要現在會儲存 SQLite 外掛 blob 資料列，而不是
  寫入 `.openclaw-wiki/cache/agent-digest.json` 和
  `.openclaw-wiki/cache/claims.jsonl`。遷移提供者會匯入舊快取
  檔案，並在快取目錄變成空目錄時將其移除。
- ClawHub 技能安裝追蹤現在會為每個工作區/技能儲存一個 SQLite 外掛狀態資料列，
  而不是在執行階段寫入或讀取 `.clawhub/lock.json` 和
  `.clawhub/origin.json` sidecar。執行階段程式碼使用已追蹤安裝
  狀態物件，而不是檔案形狀的 lockfile/origin 抽象。Doctor
  會從已設定的代理工作區匯入舊版 sidecar，並在乾淨匯入後移除它們。
- 已安裝外掛索引現在會讀寫具型別的共用 SQLite
  `installed_plugin_index` singleton 資料列，而不是 `plugins/installs.json`；該
  舊版 JSON 檔案只是 doctor 遷移輸入，並會在匯入後移除。
- 舊版 `plugins/installs.json` 路徑輔助程式現在位於 doctor 舊版
  程式碼中。執行階段外掛索引模組只公開 SQLite 支援的持久化
  選項，而不是 JSON 檔案路徑。
- 閘道重啟 sentinel、重啟意圖和 supervisor handoff 狀態現在使用
  具型別的共用 SQLite 資料列（`gateway_restart_sentinel`、
  `gateway_restart_intent` 和 `gateway_restart_handoff`），而不是通用
  不透明 blob。執行階段重啟程式碼沒有檔案形狀的 sentinel/intent/handoff
  合約。
- Matrix 同步快取、儲存中繼資料、執行緒繫結、入站去重標記、
  啟動驗證 cooldown 狀態、SDK IndexedDB 加密快照、
  憑證和復原金鑰現在都使用共用 SQLite 外掛狀態/blob
  資料表。執行階段路徑結構不再公開 `storage-meta.json` 中繼資料
  路徑；該檔名僅是舊版遷移輸入。它們的舊版 JSON 匯入
  計畫位於 Matrix 外掛 setup/doctor 遷移介面。
- Matrix 啟動不再掃描、回報或完成舊版 Matrix 檔案
  狀態。Matrix 檔案偵測、舊版加密快照建立、room-key
  還原遷移狀態、匯入和來源移除全都由 doctor 擁有。
- Matrix 執行階段遷移 barrel 已移除。舊版狀態/加密偵測
  和變更輔助程式由 Matrix doctor 直接匯入，而不是成為
  執行階段 API 介面的一部分。
- Matrix 遷移快照重用標記現在位於 SQLite 外掛狀態中，
  而不是 `matrix/migration-snapshot.json`；doctor 仍可重用相同的
  已驗證遷移前封存，而不必寫入 sidecar 狀態檔。
- Nostr bus 游標和設定檔發布狀態現在使用共用 SQLite 外掛
  狀態。它們的舊版 JSON 匯入計畫位於 Nostr 外掛 setup/doctor
  遷移介面。
- 主動記憶工作階段切換現在使用共用 SQLite 外掛狀態，而不是
  `session-toggles.json`；重新開啟記憶會刪除該資料列，而不是
  重寫 JSON 物件。
- 技能工作坊提案和審查計數器現在使用共用 SQLite 外掛
  狀態，而不是每個工作區的 `skill-workshop/<workspace>.json` 儲存。每個
  提案都是 `skill-workshop/proposals` 底下的獨立資料列，審查
  計數器則是 `skill-workshop/reviews` 底下的獨立資料列。
- 技能工作坊審查者子代理執行現在使用執行階段工作階段 transcript
  解析器，而不是建立 `skill-workshop/<sessionId>.json` sidecar 工作階段
  路徑。
- ACPX 程序 lease 現在使用 `acpx/process-leases` 底下的共用 SQLite 外掛狀態，
  而不是整檔式 `process-leases.json` registry。
  每個 lease 都會以自己的資料列儲存，保留啟動時清除 stale-process 的能力，
  且不需要執行階段 JSON 重寫路徑。
- ACPX wrapper script 和隔離的 Codex home 會在
  OpenClaw 暫存根目錄中產生。它們會視需要重新建立，且不是備份或
  遷移輸入。
- 子代理執行 registry 持久化使用具型別的共用 `subagent_runs` 資料列。舊的
  `subagents/runs.json` 路徑現在只是 doctor 遷移輸入，而且
  執行階段輔助程式名稱不再將狀態層描述為磁碟支援。
  執行階段測試不再建立無效或空的 `runs.json` fixture 來證明
  registry 行為；它們會直接 seed/read SQLite 資料列。
- Backup 會先 staged 狀態目錄再封存、複製非資料庫檔案、
  使用 `VACUUM INTO` snapshot `*.sqlite` 資料庫、略過即時 WAL/SHM
  sidecar、在封存 manifest 中記錄 snapshot 中繼資料，並使用封存 manifest
  在 SQLite 中記錄已完成的備份執行。`openclaw backup
create` 預設會驗證寫出的封存；`--no-verify` 是
  明確的快速路徑。
- `openclaw backup restore` 會在解壓前驗證封存、重用
  verifier 的正規化 manifest，並將已驗證的 manifest 資產還原到其
  記錄的來源路徑。它需要 `--yes` 才會寫入，並支援 `--dry-run`
  產生還原計畫。
- 舊的備份 volatile-path 篩選器已刪除。Backup 不再需要
  用於舊版工作階段或排程 JSON/JSONL 檔案的 live-tar skip list，因為 SQLite
  snapshot 會在建立封存前 staged。
- 一般 setup 和 onboarding 工作區準備不再建立
  `agents/<agentId>/sessions/` 目錄。它們只建立 config/workspace；
  SQLite 工作階段資料列和 transcript 資料列會按需在
  每個代理資料庫中建立。
- 安全性權限修復現在目標是全域與每個代理 SQLite
  資料庫，以及 WAL/SHM sidecar，而不是 `sessions.json` 和 transcript
  JSONL 檔案。
- Sandbox registry 執行階段名稱現在會直接描述 SQLite registry 種類，
  而不是透過作用中儲存延續舊版 JSON registry 術語。
- `openclaw reset --scope config+creds+sessions` 會移除每個代理的
  `openclaw-agent.sqlite` 資料庫以及 WAL/SHM sidecar，而不只是舊版
  `sessions/` 目錄。
- 閘道彙總工作階段輔助程式現在使用以 entry 為導向的名稱：
  `loadCombinedSessionEntriesForGateway` 會回傳 `{ databasePath, entries }`。
  舊的 combined-store 命名已從執行階段呼叫端移除。
- Docker MCP 頻道 seed 現在會將主要工作階段資料列和 transcript
  事件寫入每個代理 SQLite 資料庫，而不是建立
  `sessions.json` 和 JSONL transcript。
- 內建的 session-memory hook 現在會透過 `{agentId, sessionId}` 從
  SQLite 解析前一個工作階段脈絡。它不再掃描、儲存或合成
  transcript 路徑或 `workspace/sessions` 目錄。
- 內建的 command-logger hook 現在會將命令 audit 資料列寫入共用
  SQLite `command_log_entries` 資料表，而不是 append 到
  `logs/commands.log`。
- 頻道配對 allowlist 現在只會在執行階段和外掛 SDK 中公開 SQLite 支援的讀寫輔助程式。
  舊的 `*-allowFrom.json` 路徑解析器和
  檔案讀取器只存在於 doctor 舊版匯入程式碼底下。
- `migration_runs` 會記錄舊版狀態遷移執行及其狀態、
  時間戳記和 JSON 報告。
- `migration_sources` 會記錄每個已匯入的舊版檔案來源，包括 hash、大小、
  記錄數、目標資料表、執行 ID、狀態和來源移除狀態。
- `backup_runs` 會記錄備份封存路徑、狀態和 JSON manifest。
- 全域 schema 不保留未使用的 `agents` registry 資料表。代理
  資料庫探索是 canonical `agent_databases` registry，直到執行階段
  有真正的代理記錄 owner 為止。
- 產生的模型 catalog config 會儲存在具型別的全域 SQLite
  `agent_model_catalogs` 資料列中，並以代理目錄作為鍵。執行階段呼叫端使用
  `ensureOpenClawModelCatalog`；執行階段程式碼中沒有 `models.json` 相容性 API。
  實作會寫入 SQLite，而嵌入式 PI registry 會從該已儲存 payload hydrate，
  不會建立 `models.json` 檔案。
- QMD 工作階段 transcript markdown 匯出和 `memory.qmd.sessions` config 已
  移除。沒有 QMD transcript collection，沒有 `qmd/sessions*` 執行階段
  路徑，也沒有檔案支援的工作階段記憶橋接。
- memory-core 執行階段會從
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` 匯入 SQLite transcript indexing 輔助程式，而不是
  QMD SDK 子路徑。QMD 子路徑只為外部呼叫端保留相容性 re-export，
  直到 major SDK cleanup 可將其移除。
- QMD 自己的 `index.sqlite` 現在是由主要 SQLite `plugin_blob_entries` 資料表支援的暫存
  執行階段 materialization。執行階段不再建立持久的
  `~/.openclaw/agents/<agentId>/qmd` sidecar。
- 選用的 `memory-lancedb` 外掛不再建立
  `~/.openclaw/memory/lancedb` 作為隱含的 OpenClaw 管理儲存。它是
  外部 LanceDB backend，並會維持停用，直到 operator 設定明確的
  `dbPath`。
- `check:database-first-legacy-stores` 會讓新的執行階段來源失敗，只要它將
  舊版儲存名稱與 write-style 檔案系統 API 配對。它也會讓重新引入已退役 transcript bridge marker
  `transcriptLocator` 或 `sqlite-transcript://...` 的執行階段來源失敗。遷移、doctor、匯入
  和明確的非工作階段匯出程式碼仍被允許。較廣泛的舊版合約
  名稱，例如 `sessionFile`、`storePath` 和舊的 `SessionManager` file-era
  facade 仍有目前 owner，且需要個別的遷移 guard 工作，
  才能成為必要的 preflight check。該 guard 現在也涵蓋
  執行階段 `cache/*.json` 儲存、通用
  `thread-bindings.json` sidecar、排程 state/run-log JSON、config health JSON、
  restart 與 lock sidecar、Voice Wake settings、外掛 binding approvals、
  installed plugin index JSON、File Transfer audit JSONL、記憶 Wiki activity
  logs、舊的內建 `command-logger` text log，以及 pi-mono raw-stream JSONL
  diagnostics knobs。它也會禁止舊的根層級 doctor 舊版模組名稱，讓
  相容性程式碼維持在 `src/commands/doctor/` 底下。Android debug handler
  也會使用 logcat/in-memory output，而不是 staged `camera_debug.log` 或
  `debug_logs.txt` 快取檔案。

## 目標結構描述形態

保持結構描述明確。主機擁有的執行階段狀態使用具型別資料表。外掛擁有的不透明狀態使用 `plugin_state_entries` / `plugin_blob_entries`；沒有通用的主機 `kv` 資料表。

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

未來搜尋可以加入 FTS 資料表，而不必變更標準事件資料表：

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

大型值應使用 `blob` 欄位，而不是 JSON 字串編碼。保留 `value_json` 給必須能用一般 SQLite 工具檢視的小型結構化資料。

`agent_databases` 是此分支的標準登錄。不要在真正的代理記錄擁有者存在之前加入 `agents` 資料表；代理設定仍保留在 `openclaw.json`。

## Doctor 遷移形態

Doctor 應呼叫一個明確、可回報且可安全重新執行的遷移步驟：

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` 會在一般設定預檢之後叫用狀態遷移實作，並在匯入前建立已驗證的備份。執行階段啟動和 `openclaw migrate` 不得匯入舊版 OpenClaw 狀態檔案。

遷移屬性：

- 單一遷移流程會先探索所有舊版檔案來源並產生計畫，然後才變更任何內容。
- Doctor 會在匯入舊版檔案前建立已驗證的遷移前備份封存。
- 匯入具冪等性，並以來源路徑、mtime、大小、雜湊和目標資料表作為鍵。
- 成功的來源檔案會在目標資料庫提交後移除或封存。
- 失敗的匯入會讓來源保持不變，並在 `migration_runs` 中記錄警告。
- 遷移存在後，執行階段程式碼只讀取 SQLite。
- 不需要降級或匯出到執行階段檔案的路徑。

## 遷移清單

將這些移入全域資料庫：

- 任務登錄執行階段寫入現在使用共用資料庫；未發布的
  `tasks/runs.sqlite` 附帶匯入器已刪除。快照儲存會依任務
  id upsert，且只刪除遺失的任務/傳遞資料列。
- 任務流程執行階段寫入現在使用共用資料庫；未發布的
  `tasks/flows/registry.sqlite` 附帶匯入器已刪除。快照儲存會
  依流程 id upsert，且只刪除遺失的流程資料列。
- 外掛狀態執行階段寫入現在使用共用資料庫；未發布的
  `plugin-state/state.sqlite` 附帶匯入器已刪除。
- 內建記憶體搜尋不再預設使用 `memory/<agentId>.sqlite`；其
  索引資料表位於所屬代理資料庫中，且明確的
  `memorySearch.store.path` 附帶選擇加入已退役，改由 doctor 設定
  遷移處理。
- 內建記憶體重新索引只會重設代理資料庫中由記憶體擁有的資料表。
  它不得取代整個 SQLite 檔案，因為同一個資料庫也擁有
  工作階段、逐字稿、VFS 資料列、成品，以及執行階段快取。
- 沙箱容器/瀏覽器登錄來自單體與分片 JSON。執行階段
  寫入現在使用共用資料庫；舊版 JSON 匯入仍保留。
- 排程作業定義、排程狀態，以及執行歷史現在使用共用 SQLite；
  doctor 會匯入/移除舊版 `jobs.json`、`jobs-state.json`，以及
  `cron/runs/*.jsonl` 檔案
- 裝置身分/驗證、推送、更新檢查、承諾、OpenRouter 模型
  快取、已安裝外掛索引，以及應用程式伺服器繫結
- 裝置/節點配對與啟動記錄現在使用具型別的 SQLite 資料表
- 裝置配對通知訂閱者與已傳遞請求標記現在使用共用 SQLite
  外掛狀態資料表，而不是 `device-pair-notify.json`。
- 語音通話記錄現在使用 `voice-call` / `calls` 命名空間下的共用
  SQLite 外掛狀態資料表，而不是 `calls.jsonl`；外掛命令列介面
  會 tail 並摘要 SQLite 支援的通話歷史。
- QQ Bot 閘道工作階段、已知使用者記錄，以及 ref-index 引用快取
  現在使用 `qqbot` 命名空間（`gateway-sessions`、
  `known-users`、`ref-index`）下的 SQLite 外掛狀態，而不是
  `session-*.json`、`known-users.json`，以及 `ref-index.jsonl`。
  這些舊版檔案是快取，不會遷移。
- Discord 模型選擇器偏好設定、命令部署雜湊，以及討論串繫結
  現在使用 `discord` 命名空間
  （`model-picker-preferences`、`command-deploy-hashes`、`thread-bindings`）
  下的 SQLite 外掛狀態，而不是 `model-picker-preferences.json`、
  `command-deploy-cache.json`，以及 `thread-bindings.json`；Discord
  doctor/setup 遷移會匯入並移除舊版檔案。
- BlueBubbles 追趕游標與傳入去重標記現在使用 `bluebubbles` 命名空間
  （`catchup-cursors`、`inbound-dedupe`）下的 SQLite 外掛狀態，而不是
  `bluebubbles/catchup/*.json` 和
  `bluebubbles/inbound-dedupe/*.json`；BlueBubbles doctor/setup 遷移
  會匯入並移除舊版檔案。
- Telegram 更新偏移、貼圖快取項目、回覆鏈訊息快取
  項目、已送出訊息快取項目、主題名稱快取項目，以及討論串
  繫結現在使用 `telegram` 命名空間
  （`update-offsets`、`sticker-cache`、`message-cache`、`sent-messages`、
  `topic-names`、`thread-bindings`）下的 SQLite 外掛狀態，而不是
  `update-offset-*.json`、`sticker-cache.json`、`*.telegram-messages.json`、
  `*.telegram-sent-messages.json`、`*.telegram-topic-names.json`，以及
  `thread-bindings-*.json`；Telegram doctor/setup 遷移會匯入並
  移除舊版檔案。
- iMessage 追趕游標、回覆短 id 對應，以及已送出 echo 去重資料列
  現在使用 `imessage` 命名空間（`catchup-cursors`、
  `reply-cache`、`sent-echoes`）下的 SQLite 外掛狀態，而不是
  `imessage/catchup/*.json`、`imessage/reply-cache.jsonl`，以及
  `imessage/sent-echoes.jsonl`；iMessage doctor/setup 遷移會匯入並
  移除舊版檔案。
- Microsoft Teams 對話、投票、SSO 權杖，以及回饋學習現在使用
  SQLite 外掛狀態命名空間（`conversations`、`polls`、`sso-tokens`、
  `feedback-learnings`），而不是 `msteams-conversations.json`、
  `msteams-polls.json`、`msteams-sso-tokens.json`，以及
  `*.learnings.json`；Microsoft Teams doctor/setup 遷移會匯入並封存
  舊版檔案。待處理上傳是短期 SQLite 快取，舊的 JSON 快取檔案
  不會遷移。
- Matrix 同步快取、儲存中繼資料、討論串繫結、傳入去重標記、
  啟動驗證冷卻狀態、憑證、復原金鑰，以及 SDK
  IndexedDB 加密快照現在使用 `matrix` 下的 SQLite 外掛狀態/blob
  命名空間（`sync-store`、`storage-meta`、`thread-bindings`、
  `inbound-dedupe`、`startup-verification`、`credentials`、
  `recovery-key`、`idb-snapshots`），而不是 `bot-storage.json`、
  `storage-meta.json`、`thread-bindings.json`、`inbound-dedupe.json`、
  `startup-verification.json`、`credentials.json`、`recovery-key.json`，
  以及 `crypto-idb-snapshot.json`；Matrix doctor/setup 遷移會從
  帳號範圍的 Matrix 儲存根目錄匯入並移除這些舊版檔案。
- Nostr bus 游標與設定檔發布狀態現在使用 `nostr` 命名空間
  （`bus-state`、`profile-state`）下的 SQLite 外掛狀態，而不是
  `bus-state-*.json` 和 `profile-state-*.json`；Nostr doctor/setup
  遷移會匯入並移除舊版檔案。
- 主動記憶工作階段切換現在使用 `active-memory/session-toggles`
  下的 SQLite 外掛狀態，而不是 `session-toggles.json`。
- Skill Workshop 提案佇列與審查計數器現在使用
  `skill-workshop/proposals` 和 `skill-workshop/reviews` 下的 SQLite
  外掛狀態，而不是每個工作區的 `skill-workshop/<workspace>.json`
  檔案。
- 輸出傳遞與工作階段傳遞佇列現在共用全域 SQLite
  `delivery_queue_entries` 資料表，並使用不同佇列名稱
  （`outbound-delivery`、`session-delivery`），而不是持久化的
  `delivery-queue/*.json`、`delivery-queue/failed/*.json`，以及
  `session-delivery-queue/*.json` 檔案。doctor 舊版狀態步驟會匯入
  待處理與失敗資料列、移除過時的已傳遞標記，並在匯入後刪除舊的
  JSON 檔案。熱路由與重試欄位是具型別欄位；JSON payload 只保留
  用於重放/偵錯。
- ACPX 程序租約現在使用 `acpx/process-leases` 下的 SQLite 外掛狀態，
  而不是 `process-leases.json`。
- 備份與遷移執行中繼資料

將這些移入代理資料庫：

- 代理工作階段根目錄與相容性形狀的工作階段項目 payload。
  執行階段寫入已完成：熱工作階段中繼資料可在 `sessions` 中查詢，
  而舊版形狀的完整 `SessionEntry` payload 仍保留在
  `session_entries` 中。
- 代理逐字稿事件。執行階段寫入已完成。
- 壓縮檢查點與逐字稿快照。執行階段寫入已完成：
  檢查點逐字稿副本是 SQLite 逐字稿資料列，且檢查點
  中繼資料記錄在 `transcript_snapshots` 中。閘道檢查點輔助工具
  現在將這些值命名為逐字稿快照，而不是來源檔案。
- 代理 VFS scratch/workspace 命名空間。執行階段 VFS 寫入已完成。
- 子代理附件 payload。執行階段寫入已完成：它們是 SQLite VFS
  seed 項目，絕不是持久工作區檔案。
- 工具成品。執行階段寫入已完成。
- 執行成品。已透過每個代理的 `run_artifacts` 資料表完成 worker
  執行階段寫入。
- 代理本機執行階段快取。已透過每個代理的 `cache_entries` 資料表
  完成 worker 執行階段作用域快取寫入。閘道範圍模型快取會留在
  全域資料庫，除非它們變成代理專屬。
- ACP 父串流記錄。執行階段寫入已完成。
- ACP 重放分類帳工作階段。已透過 `acp_replay_sessions` 和
  `acp_replay_events` 完成執行階段寫入；舊版
  `acp/event-ledger.json` 只保留作為 doctor 輸入。
- ACP 工作階段中繼資料。已透過 `acp_sessions` 完成執行階段寫入；
  `sessions.json` 中的舊版 `entry.acp` 區塊只作為 doctor 遷移輸入。
- 當軌跡附帶檔不是明確匯出檔案時。執行階段寫入已完成：
  軌跡擷取會寫入代理資料庫 `trajectory_runtime_events` 資料列，
  並將執行作用域的成品鏡射到 SQLite。舊版附帶檔只作為 doctor
  匯入輸入；匯出可以具現化新的 JSONL 支援套件輸出，但不會在
  執行階段讀取或遷移舊的軌跡/逐字稿附帶檔。執行階段軌跡擷取
  會公開 SQLite 作用域；JSONL 路徑輔助工具隔離於匯出/偵錯支援，
  且不會從執行階段模組重新匯出。Embedded-runner 軌跡中繼資料會
  記錄 `{agentId, sessionId, sessionKey}` 身分，而不是持久保存
  逐字稿定位器。

這些暫時保留為檔案支援：

- `openclaw.json`
- provider 或命令列介面憑證檔案
- 外掛/套件資訊清單
- 選取磁碟模式時的使用者工作區與 Git 儲存庫
- 供操作員 tail 的記錄，除非特定記錄表面已移動

## 遷移計畫

### 階段 0：凍結邊界

在移動更多資料列之前，先明確定義持久狀態邊界：

- 將 `migration_runs` 資料表新增至全域資料庫。
  舊版狀態遷移執行報告已完成。
- 新增單一由 doctor 擁有的狀態遷移服務，用於檔案到資料庫匯入。
  已完成：`openclaw doctor --fix` 使用舊版狀態遷移實作。
- 讓 `plan` 唯讀，並讓 `apply` 建立備份、匯入、驗證，然後
  刪除或隔離舊檔案。
  已完成：doctor 會建立已驗證的遷移前備份，將備份路徑傳入
  `migration_runs`，並重用匯入器/移除路徑。
- 新增靜態禁令，讓新的執行階段程式碼不能寫入舊版狀態檔案，
  同時遷移程式碼與測試仍可 seed/讀取它們。
  已針對目前已遷移的舊版儲存完成；該 guard 也會掃描巢狀
  測試，以找出被禁止的執行階段逐字稿定位器合約。

### 階段 1：完成全域控制平面

將共用協調狀態保留在 `state/openclaw.sqlite`：

- 代理與代理資料庫登錄
- 任務與任務流程分類帳
- 外掛狀態
- 沙箱容器/瀏覽器登錄
- 排程/排程器執行歷史
- 配對、裝置、推送、更新檢查、終端介面、OpenRouter/模型快取，以及其他
  小型閘道作用域執行階段狀態
- 備份與遷移中繼資料
- 閘道媒體附件位元組。執行階段寫入已完成；直接檔案路徑是為了
  與通道傳送器和沙箱 staging 相容的暫時具現化。執行階段 allowlist
  接受 SQLite 具現化路徑，而不是舊版狀態/設定媒體根目錄。
  doctor 會將舊版媒體檔案匯入 `media_blobs`，並在成功寫入資料列後
  移除來源檔案。
- 偵錯代理擷取工作階段、事件，以及 payload blob。已完成：擷取資料
  位於共用狀態 DB 中，並透過共用狀態 DB bootstrap、schema、
  WAL，以及 busy-timeout 設定開啟。Payload 位元組會以 gzip 壓縮於
  `capture_blobs.data`；沒有偵錯代理執行階段附帶 DB 覆寫、
  blob 目錄，或僅限 proxy-capture 的產生 schema/codegen 目標。
  Doctor/啟動遷移會匯入已發布的 `debug-proxy/capture.sqlite` 資料列
  與參照的 payload blob，包括作用中的舊版 DB/blob 環境
  覆寫，然後封存這些來源，同時保留 CA 憑證不變。

此階段也會從這些子系統刪除重複的附帶 opener、權限輔助工具、WAL
設定、檔案系統修剪，以及相容性 writer。

### 階段 2：引入每個代理的資料庫

為每個代理建立一個資料庫，並從全域 DB 登錄它：

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

全域 `agent_databases` 資料列會儲存路徑、schema 版本、last-seen
時間戳，以及基本大小/完整性中繼資料。執行階段程式碼會向登錄請求
代理 DB，而不是直接推導檔案路徑。

代理 DB 擁有：

- `sessions` 作為標準工作階段根，`session_entries` 作為附加到該根的相容性形狀酬載資料表，而
  `session_routes` 作為唯一有效的 `session_key` 查詢
- `conversations` 和 `session_conversations` 作為附加到工作階段的正規化供應商
  路由身分
- `transcript_events`
- 逐字稿快照和壓縮檢查點。已完成執行階段寫入。
- `vfs_entries`
- `tool_artifacts` 和執行成品
- agent 本機執行階段/快取列。已完成 worker 範圍快取。
- ACP 父串流事件
- 軌跡執行階段事件，當它們不是明確匯出成品時

### 第 3 階段：取代工作階段儲存 API

執行階段已完成。檔案形狀的工作階段儲存介面不是有效的
執行階段合約：

- 執行階段不再呼叫 `loadSessionStore(storePath)`，也不再將 `storePath` 視為
  工作階段身分。
- 執行階段列操作為 `getSessionEntry`、`upsertSessionEntry`、
  `patchSessionEntry`、`deleteSessionEntry` 和 `listSessionEntries`。
- 整個儲存重寫輔助工具、檔案寫入器、佇列測試、別名修剪，以及
  舊版鍵刪除參數已從執行階段移除。
- 已棄用的根套件相容性匯出仍會將標準
  `sessions.json` 路徑轉接到 SQLite 列 API。
- `sessions.json` 解析只保留在 doctor 遷移/匯入程式碼和
  doctor 測試中。
- 執行階段生命週期 fallback 會讀取 SQLite 逐字稿標頭，而不是先讀取 JSONL
  第一行。

持續刪除任何重新引入檔案鎖參數、
修剪/截斷作為檔案維護用語、儲存路徑身分，或唯一斷言是 JSON 持久化的測試。

### 第 4 階段：移動逐字稿、ACP 串流、軌跡與 VFS

讓每個 agent 資料串流都成為資料庫原生：

- 逐字稿附加寫入會經由單一 SQLite 交易，確保
  工作階段標頭、檢查訊息冪等性、選取父尾端、插入
  `transcript_events`，並在
  `transcript_event_identities` 中記錄可查詢的身分中繼資料。已完成直接逐字稿訊息附加和
  一般持久化 `TranscriptSessionManager` 附加；明確分支
  操作保留其明確父選擇，且仍會寫入 SQLite 列，
  不會衍生任何檔案定位器。
- ACP 父串流記錄會成為列，而不是 `.acp-stream.jsonl` 檔案。已完成。
- ACP 衍生設定不再持久化逐字稿 JSONL 路徑。已完成。
- 執行階段軌跡擷取會直接寫入事件列/成品。明確的
  支援/匯出命令仍可產生支援套件 JSONL 成品作為
  匯出格式，但工作階段匯出不會重新建立工作階段 JSONL。已完成。
- 磁碟工作區在設定為磁碟模式時仍保留在磁碟上。
- VFS scratch 和實驗性僅 VFS 工作區模式使用 agent DB。

遷移會一次性匯入舊 JSONL 檔案，在
`migration_runs` 中記錄計數/雜湊，並在完整性檢查後移除已匯入檔案。

### 第 5 階段：備份、還原、清理與驗證

備份仍為單一封存檔：

- 對每個全域和 agent 資料庫建立檢查點。
- 使用 SQLite 備份語意或 `VACUUM INTO` 快照每個 DB。
- 封存壓縮後的 DB 快照、設定、外部憑證，以及要求的
  工作區匯出。
- 省略原始即時 `*.sqlite-wal` 和 `*.sqlite-shm` 檔案。
- 透過開啟每個 DB 快照並執行 `PRAGMA integrity_check` 進行驗證。
  `openclaw backup create` 預設會執行此封存驗證；
  `--no-verify` 只會略過寫入後封存檢查，不會略過快照
  建立完整性檢查。
- 還原會將快照複製回其目標路徑。此分支會將
  尚未發布的 SQLite 版面重設為 `user_version = 1`；未來發布後的 schema 變更
  可在需要時加入明確遷移。

### 第 6 階段：Worker 執行階段

在資料庫拆分落地期間，保持 worker 模式為實驗性：

- Worker 會接收 agent id、run id、檔案系統模式，以及 DB 登錄身分。
- 每個 worker 會開啟自己的 SQLite 連線。
- 父程序保留通道傳遞、核准、設定和取消權限。
- 先從每個有效執行一個 worker 開始；只有在生命週期和 DB
  連線所有權穩定後，才加入池化。

### 第 7 階段：刪除舊世界

執行階段工作階段管理已完成。舊世界只允許作為明確
doctor 輸入或支援/匯出輸出：

- 沒有執行階段 `sessions.json`、逐字稿 JSONL、sandbox registry JSON、task
  sidecar SQLite，或 plugin-state sidecar SQLite 寫入。
- 沒有 JSON/工作階段檔案修剪、檔案逐字稿截斷、工作階段檔案鎖，
  或鎖形狀的工作階段測試。
- 沒有目的在於保持舊工作階段檔案為最新狀態的執行階段相容性匯出。
- 明確支援匯出仍是使用者要求的封存/具現化
  格式，且不得將檔名回饋到執行階段身分中。

## 備份與還原

備份應該是一個封存檔，但資料庫擷取應為
SQLite 原生：

1. 停止長時間執行的寫入活動，或進入短暫備份屏障。
2. 對每個全域和 agent 資料庫執行檢查點。
3. 使用 SQLite 備份語意或 `VACUUM INTO`，將每個資料庫快照到
   暫存備份目錄。
4. 封存壓縮後的資料庫快照、設定檔、憑證目錄、
   選取的工作區，以及 manifest。
5. 透過開啟每個包含的 SQLite 快照並執行
   `PRAGMA integrity_check` 來驗證封存。
   `openclaw backup create` 預設會執行此操作；`--no-verify` 只用於
   有意略過寫入後封存檢查。

不要依賴原始即時 `*.sqlite`、`*.sqlite-wal` 和 `*.sqlite-shm` 複本作為
主要備份格式。封存 manifest 應記錄資料庫角色、
agent id、schema 版本、來源路徑、快照路徑、位元組大小，以及完整性
狀態。

還原應從封存快照重建全域資料庫和 agent 資料庫檔案。
由於 SQLite 版面尚未發布，此重構只保留第 1 版 schema，加上 doctor 檔案到資料庫匯入。
還原命令會先驗證封存，然後從已驗證的解壓縮酬載取代每個 manifest 資產。

## 執行階段重構計畫

1. 新增資料庫登錄 API。
   - 解析全域 DB 和每個 agent DB 路徑。
   - 將尚未發布的 schema 保持在 `user_version = 1`；在已發布 schema 需要前，
     不要加入 schema 遷移 runner 程式碼。
   - 新增測試、備份和 doctor 使用的關閉/檢查點/完整性輔助工具。

2. 收斂 sidecar SQLite 儲存。
   - 將外掛狀態資料表移入全域資料庫。已完成執行階段
     寫入；尚未發布的舊版 sidecar 匯入器已刪除。
   - 將 task registry 資料表移入全域資料庫。已完成執行階段
     寫入；尚未發布的舊版 sidecar 匯入器已刪除。
   - 將 Task Flow 資料表移入全域資料庫。已完成執行階段寫入；
     尚未發布的舊版 sidecar 匯入器已刪除。
   - 將內建記憶體搜尋資料表移入每個 agent 資料庫。已完成；明確的
     自訂 `memorySearch.store.path` 現在會由 doctor 設定遷移移除。
     完整重新索引會就地只針對記憶體資料表執行；舊的整檔
     交換路徑和 sidecar 索引交換輔助工具已刪除。
   - 從這些子系統刪除重複的資料庫 opener、WAL 設定、權限輔助工具，以及
     關閉路徑。

3. 將 agent 擁有的資料表移入每個 agent 資料庫。
   - 透過全域資料庫登錄依需求建立 agent DB。已完成。
   - 將執行階段工作階段項目、逐字稿事件、VFS 列，以及工具
     成品移至 agent DB。已完成。
   - 不遷移分支本機 shared-DB 工作階段項目、逐字稿事件、
     VFS 列或工具成品；該版面從未發布。只保留 doctor 中的舊版
     檔案到資料庫匯入。

4. 取代工作階段儲存 API。
   - 移除 `storePath` 作為執行階段身分。執行階段已完成，並由
     `check:database-first-legacy-stores` 防護：工作階段中繼資料、路由更新、
     命令持久化、命令列介面工作階段清理、Feishu 推理預覽、
     逐字稿狀態持久化、subagent 深度、auth profile 工作階段
     覆寫、父 fork 邏輯，以及 QA-lab 檢查現在都會從標準 agent/工作階段鍵
     解析資料庫。
     閘道/終端介面/UI/macOS 工作階段清單回應現在會公開 `databasePath`
     而不是舊版 `path`；macOS 偵錯介面會將每個 agent 資料庫顯示為唯讀狀態，
     而不是寫入 `session.store` 設定。
     `/status`、聊天驅動的軌跡匯出，以及命令列介面相依性 proxy 不再
     傳播舊版儲存路徑；逐字稿使用量 fallback 會依 agent/工作階段身分讀取
     SQLite。執行階段和 bridge 測試不再公開
     `storePath`；doctor/遷移輸入擁有該舊版欄位名稱。
     閘道合併工作階段載入不再針對
     非範本化 `session.store` 值有特殊執行階段分支；它會聚合每個 agent SQLite 列。
     舊版工作階段鎖 doctor lane 及其 `.jsonl.lock` 清理輔助工具
     已移除；SQLite 現在是工作階段並行邊界。
     熱執行階段呼叫點使用列導向輔助工具名稱，例如
     `resolveSessionRowEntry`；舊的 `resolveSessionStoreEntry` 相容性
     別名已從執行階段和外掛 SDK 匯出中移除。

- 使用 `{ agentId, sessionKey }` 列操作。
  已完成：`getSessionEntry`、`upsertSessionEntry`、`deleteSessionEntry`、
  `patchSessionEntry` 和 `listSessionEntries` 是 SQLite 優先 API，不
  需要工作階段儲存路徑。狀態摘要、本機 agent 狀態、health，
  以及 `openclaw sessions` 清單命令現在會直接讀取每個 agent 列，
  並顯示每個 agent SQLite 資料庫路徑，而不是 `sessions.json` 路徑。
- 以 `upsertSessionEntry`、
  `deleteSessionEntry`、`listSessionEntries` 和 SQL 清理查詢取代整個儲存刪除/插入。
  執行階段已完成：熱路徑現在使用列 API 和衝突重試列修補；
  剩餘的整個儲存匯入/取代輔助工具僅限於遷移匯入
  程式碼和 SQLite 後端測試。
  - 刪除 `store-writer.ts` 和 writer-queue 測試。已完成。
  - 從工作階段列 upsert/patch 刪除執行階段舊版鍵修剪和別名刪除參數。已完成。

5. 刪除執行階段 JSON registry 行為。
   - 讓 sandbox registry 讀取和寫入只使用 SQLite。已完成。
   - 僅從遷移步驟匯入單體和分片 JSON。已完成。
   - 移除分片 registry 鎖和 JSON 寫入。已完成。

- 保留一個型別化 registry 資料表，而不是將 registry 列儲存為泛用
  不透明 JSON，如果該形狀仍是熱路徑操作狀態。已完成。

6. 刪除檔案鎖形狀的工作階段變更。
   - 執行階段鎖建立和執行階段鎖 API 已完成。
   - 獨立舊版 `.jsonl.lock` doctor 清理 lane 已移除。
   - `session.writeLock` 是 doctor 遷移的舊版設定，不是型別化執行階段
     設定。
   - 狀態完整性不再有獨立的孤立逐字稿檔案修剪
     路徑；doctor 遷移會在一處匯入/移除舊版 JSONL 來源。
   - 閘道 singleton 協調使用 `gateway_locks` 下的型別化 SQLite `state_leases` 列，
     不再公開檔案鎖目錄介面。
   - 泛用外掛 SDK 去重持久化不再使用檔案鎖或 JSON
     檔案；它會寫入 shared SQLite 外掛狀態列。已完成。
   - QMD embed 協調使用 SQLite state lease，而不是
     `qmd/embed.lock`。已完成。

7. 讓 worker 具備資料庫感知能力。
   - Worker 開啟自己的 SQLite 連線。
   - 父程序擁有傳遞、通道 callback 和設定。
   - Worker 接收 agent id、run id、檔案系統模式，以及 DB 登錄
     身分，而不是即時 handle。
   - `vfs-only` 保持實驗性，並使用 agent 資料庫作為其儲存
     根。
   - 先保持每個有效執行一個 worker。池化可以等到 DB 連線
     生命週期和取消行為穩定後再處理。

8. 備份整合。
   - 教導備份透過 SQLite 備份或 `VACUUM INTO` 快照全域與 agent 資料庫。已針對狀態資產下發現的 `*.sqlite` 檔案完成。
   - 為 SQLite 完整性與 schema 版本加入備份驗證。已針對備份建立與預設封存驗證完整性檢查完成。
   - 在 SQLite 中記錄備份執行中繼資料。已透過共享的 `backup_runs` 資料表完成，包含封存路徑、狀態與 manifest JSON。
   - 從已驗證的封存快照加入還原。已完成：`openclaw backup
restore` 會在解壓前驗證、使用驗證器的正規化 manifest、支援 `--dry-run`，並要求 `--yes` 才會取代已記錄的來源路徑。
   - 僅在要求時包含 VFS/工作區匯出；不要將 session 內部資料匯出為 JSON 或 JSONL。

9. 刪除過時的測試與程式碼。已針對已知執行階段 session 表面完成。

- 移除會斷言執行階段建立 `sessions.json` 或 transcript JSONL 檔案的測試。已針對核心 session store、chat、閘道 transcript 事件、preview、lifecycle、command session-entry 更新、auto-reply reset/trace，以及 memory-core dreaming fixtures、approval target routing、session transcript repair、security permission repair、trajectory export 和 session export 完成。
  主動記憶 transcript 測試現在會斷言 SQLite 範圍，以及不會建立暫時或持久化的 JSONL 檔案。
  舊的心跳偵測 transcript-pruning 迴歸測試已移除，因為執行階段不再截斷 JSONL transcripts。
  Agent session-list tool 測試不再將舊版 `sessions.json` 路徑建模為閘道回應形狀；app/UI/macOS 測試改用 `databasePath`。
  `/status` transcript-usage 測試現在直接植入 SQLite transcript rows，而不是寫入 JSONL 檔案。
  閘道 session lifecycle 測試現在直接使用 SQLite transcript seeding helpers；舊的單行 session-file fixture 形狀已從 reset 和 delete 覆蓋範圍中移除。
  `sessions.delete` 不再回傳檔案時代的 `archived: []` 欄位；刪除只回報 row mutation 結果。舊的 `deleteTranscript` 選項也已移除：刪除 session 會移除標準的 `sessions` root，並讓 SQLite cascade session 擁有的 transcript、snapshot 與 trajectory rows，因此沒有 caller 能留下 transcript 孤兒，或忘記 cleanup branch。
  Context-engine trajectory capture 測試現在從隔離的 agent 資料庫讀取 `trajectory_runtime_events` rows，而不是讀取 `session.trajectory.jsonl`。
  Docker MCP channel seed scripts 現在直接植入 SQLite rows。直接寫入 `sessions.json` 僅限於 doctor fixtures。
  Tool Search 閘道 E2E 會從 SQLite transcript rows 讀取 tool-call evidence，而不是掃描 `agents/<agentId>/sessions/*.jsonl` 檔案。
  Memory-core host events 與 session-corpus scratch rows 現在位於共享 SQLite plugin-state；`events.jsonl` 與 `session-corpus/*.txt` 僅是舊版 doctor migration inputs。作用中 rows 使用 `memory/session-ingestion/` 虛擬路徑，而不是 `.dreams/session-corpus`。舊的 memory-core dreaming repair module 及其 命令列介面/閘道 測試已移除，因為執行階段不再擁有該 corpus 的檔案封存修復。Memory-core bridge/public-artifact 測試不再暴露 `.dreams/events.jsonl`；它們使用 SQLite-backed virtual JSON artifact name。
  Public SDK/Codex 測試文件現在說明 SQLite session state，而不是 session files，且 channel-turn 範例不再暴露 `storePath` 參數。
  Matrix sync state 現在直接使用 SQLite plugin-state store。作用中的 client/runtime contracts 傳入 account storage root，而不是 `bot-storage.json` 路徑，且 doctor 會在刪除來源前，將舊版 `bot-storage.json` 匯入 SQLite。QA Matrix restart/destructive scenarios 現在直接修改 SQLite sync row，而不是建立或刪除假的 `bot-storage.json` 檔案，且 E2EE substrate 傳入 sync-store root，而不是假的 `sync-store.json` 路徑。
  Matrix storage-root selection 不再依舊版 sync/thread JSON 檔案為 roots 評分；它使用 durable root metadata 加上真實 crypto state。
  執行階段 SQLite session backend test suite 不再捏造 `sessions.json`；舊版 source fixtures 現在位於匯入它們的 doctor tests。
  閘道 session 測試不再暴露 `createSessionStoreDir` helper 或未使用的 temp session-store path setup；fixture dirs 是明確的，且直接 row setup 使用 SQLite session-row naming。
  Doctor-only JSON5 session-store parser 覆蓋範圍已從 infra tests 移到 doctor migration tests，因此執行階段 test suites 不再擁有舊版 session-file parsing。
  Microsoft Teams runtime SSO/pending-upload 測試不再攜帶 JSON sidecar fixtures 或 parsers；舊版 SSO token parsing 僅存在於外掛 migration module。Telegram 測試不再植入假的 `/tmp/*.json` store paths；它們直接重設 SQLite-backed message cache。通用 OpenClaw test-state helper 不再暴露舊版 `auth-profiles.json` writer；doctor auth migration tests 在本地擁有該 fixture。
  TUI last-session pointers、exec approvals、active-memory toggles、Matrix dedupe/startup verification、Memory Wiki source sync、current-conversation bindings、onboarding auth，以及 Hermes secret imports 的執行階段測試，不再製造舊 sidecar files 或斷言舊 filenames 不存在。它們透過 SQLite rows 與 public store APIs 證明行為；doctor/migration tests 是唯一應該出現舊版 source filenames 的地方。
  device/node pairing、channel allowFrom、restart intents、restart handoff、session delivery queue entries、config health、iMessage caches、排程 jobs、PI transcript headers、subagent registries，以及 managed image attachments 的執行階段測試，也不再為了證明它們被忽略或不存在而建立已淘汰的 JSON/JSONL 檔案。
  PI overflow recovery 不再有 SessionManager rewrite/truncation fallback：tool-result truncation 與 context-engine transcript rewrites 會修改 SQLite transcript rows，然後從資料庫重新整理 active prompt state。
  Persisted SessionManager message appends 會委派給 atomic SQLite transcript append helper，以處理 parent selection 與 idempotency。一般 metadata/custom entry appends 也會在 SQLite 內選取目前 parent，因此 stale manager instances 不會復活 pre-SQLite parent-chain races。
  Synthetic PI tail cleanup for mid-turn prechecks and `sessions_yield` 現在直接修剪 SQLite transcript state；舊的 SessionManager tail-removal bridge 及其測試已刪除。
  Compaction checkpoint capture 也只從 SQLite 快照；callers 不再傳入 live SessionManager 作為替代 transcript source。
- 保留只用於 migration 的舊版檔案植入測試。
- 作用中執行階段表面的 JSON-file proof 已由 SQL row proof 取代。

- 為執行階段寫入舊版 session/cache JSON 路徑加入靜態禁止。
  已針對 repo guard 完成。

10. 讓 migration report 可稽核。
    - 在 SQLite 中記錄 migration runs，包含 started/finished timestamps、source paths、source hashes、counts、warnings 與 backup path。
      已完成：legacy-state migration executions 現在會持久化 `migration_runs` report，包含 source path/table inventory、source file SHA-256、sizes、record counts、warnings 與 backup path。
      已完成：legacy-state migration executions 也會持久化 `migration_sources` rows，用於 source-level audit 以及未來的 skip/backfill decisions。
    - 讓 apply 具備冪等性。部分匯入後重新執行時，應跳過已匯入的 source，或依 stable key 合併。
      已完成：session indexes、transcripts、delivery queues、plugin state、task ledgers，以及 agent-owned global SQLite rows 透過 stable keys 或 upsert/replace semantics 匯入，因此重新執行會合併而不會重複 durable rows。
    - 失敗的匯入必須保留原始 source file。
      已完成：失敗的 transcript imports 現在會將原始 JSONL source 保留在其偵測到的路徑，且 `migration_sources` 會將 source 記錄為 `warning`，並設定 `removed_source=0`，供下一次 doctor 執行使用。

## 效能規則

- 每個 thread/process 一個 connection 可以；不要跨 workers 共享 handles。
- 使用 WAL、`foreign_keys=ON`、30 秒 busy timeout，以及短的 `BEGIN IMMEDIATE` write transactions。
- 除非/直到 async transaction API 加入明確的 mutex/backpressure semantics，否則保持 write transaction helpers 同步。
- 保持 parent delivery writes 小且 transactional。
- 避免 whole-store rewrites；使用 row-level upsert/delete。
- 在移動 hot code 前，為 list-by-agent、list-by-session、updated-at、run id 與 expiration paths 加入 indexes。
- 將大型 artifacts、media 與 vectors 儲存為 BLOBs 或 chunked BLOB rows，而不是 base64 或 numeric-array JSON。
- 保持 opaque plugin-state entries 小且有範圍。
- 為 TTL/expiration 加入 SQL cleanup，而不是 filesystem pruning。
  已針對 database-owned runtime stores 完成：media、plugin state、plugin blobs、persistent dedupe 與 agent cache 都透過 SQLite rows 過期。剩餘 filesystem cleanup 僅限於 temporary materializations 或 explicit removal commands。

## 靜態禁止

加入 repo check，使對舊版狀態路徑的新執行階段寫入失敗：

- `sessions.json`
- `*.trajectory.jsonl`，不包括實體化的支援套件輸出
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
- 沙盒登錄分片 JSON 檔案
- 原生鉤子轉送 `/tmp` 橋接 JSON 檔案
- `plugin-state/state.sqlite`
- 臨時 `openclaw-state.sqlite` 執行階段附屬檔
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
- `SessionManager.open(...)` 由檔案支援的工作階段開啟器
- `SessionManager.listAll(...)` 和 `TranscriptSessionManager.listAll(...)`
  轉錄清單外觀
- `SessionManager.forkFromSession(...)` 和
  `TranscriptSessionManager.forkFromSession(...)` 轉錄分支外觀
- `SessionManager.newSession(...)` 和 `TranscriptSessionManager.newSession(...)`
  可變工作階段替換外觀
- `SessionManager.createBranchedSession(...)` 和
  `TranscriptSessionManager.createBranchedSession(...)` 分支工作階段外觀

此禁令應允許測試建立舊版 fixture，並允許遷移程式碼讀取、匯入、移除舊版檔案來源。未發布的 SQLite 附屬檔仍維持禁止，且不取得 doctor 匯入允許。

## 完成條件

- 執行階段資料與快取寫入全域或代理程式 SQLite 資料庫。
- 執行階段不再寫入工作階段索引、轉錄 JSONL、沙盒登錄
  JSON、任務附屬 SQLite，或 plugin-state 附屬 SQLite。未發布的任務
  與 plugin-state 附屬 SQLite 匯入器已刪除。
- 舊版檔案匯入僅限 doctor。
- 備份會產生一個封存檔，其中包含精簡 SQLite 快照與完整性證明。
- 代理程式 worker 可使用磁碟、VFS 暫存，或實驗性僅 VFS
  儲存執行。
- 設定與明確的認證檔案仍是唯一預期的持久性
  非資料庫控制檔案。
- Repo 檢查會防止重新引入舊版執行階段檔案儲存。
