---
read_when:
    - 將 OpenClaw 執行階段資料、快取、對話記錄、工作狀態或暫存檔案移至 SQLite
    - 從舊版 JSON 或 JSONL 檔案設計 doctor 遷移作業
    - 變更備份、還原、VFS 或工作執行緒儲存行為
    - 移除工作階段鎖定、修剪、截斷或 JSON 相容性路徑
summary: 在維持設定由檔案支援的同時，將 SQLite 設為主要持久狀態與快取層的遷移計畫
title: 資料庫優先的狀態重構
x-i18n:
    generated_at: "2026-07-12T21:25:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75a7cc6f170a9f9bc44ef7f027f9f1a5fbd24b81b4b0018d1cf4872e68754b34
    source_path: refactor/database-first.md
    workflow: 16
---

# 資料庫優先的狀態重構

## 決策

使用兩層 SQLite 配置：

- 全域資料庫：`~/.openclaw/state/openclaw.sqlite`
- Agent 資料庫：每個 Agent 各有一個 SQLite 資料庫，用於 Agent 擁有的工作區、逐字稿、VFS、成品，以及大型的各 Agent 執行階段狀態
- 設定維持檔案儲存：`openclaw.json` 保留在資料庫之外。執行階段驗證設定檔移至 SQLite；外部供應商或命令列介面的認證資訊檔案仍由其擁有者管理，並位於 OpenClaw 資料庫之外。

全域資料庫是控制平面資料庫。它負責 Agent 探索、共用閘道狀態、配對、裝置／節點狀態、工作與流程帳冊、外掛狀態、排程器執行階段狀態、備份中繼資料，以及遷移狀態。

Agent 資料庫是資料平面資料庫。它負責 Agent 的工作階段中繼資料、逐字稿事件串流、VFS 工作區或暫存命名空間、工具成品、執行成品，以及可搜尋／建立索引的 Agent 本機快取資料。

這提供單一、持久的全域檢視，同時不必將大型 Agent 工作區、逐字稿與二進位暫存資料塞入共用閘道的寫入通道。

## 強制契約

此遷移只有一種標準執行階段形態：

- 工作階段資料列僅保存工作階段中繼資料。它們不得保存 `transcriptLocator`、逐字稿檔案路徑、同層 JSONL 路徑、鎖定路徑、修剪中繼資料，或檔案時代的相容性指標。
- 逐字稿識別一律使用 SQLite 識別：`{agentId, sessionId}`，並在通訊協定需要時加上選用的主題中繼資料。
- `sqlite-transcript://...` 不是執行階段或通訊協定識別。新程式碼不得衍生、保存、傳遞、剖析或遷移逐字稿定位器。執行階段與測試完全不應包含虛擬定位器；文件僅可為了禁止它而提及此字串。
- 舊版 `sessions.json`、逐字稿 JSONL、`.jsonl.lock`、修剪、截斷，以及舊工作階段路徑邏輯，只能存在於 doctor 遷移／匯入路徑中。
- 舊版工作階段設定別名只能存在於 doctor 遷移中。執行階段不會解讀 `session.idleMinutes`、`session.resetByType.dm`，也不會將跨 Agent 的 `agent:main:*` 主要工作階段別名用於另一個已設定的 Agent。
- 工作階段路由識別是具型別的關聯式狀態。高頻執行階段與 UI 路徑應讀取 `sessions.session_scope`、`sessions.account_id`、`sessions.primary_conversation_id`、`conversations` 和 `session_conversations`；除了刪除舊呼叫端期間作為相容性影子外，不得剖析 `session_key`，也不得從 `session_entries.entry_json` 挖掘供應商識別。
- 頻道層級的私訊標記（例如 `dm` 與 `direct`）是路由詞彙，不是逐字稿定位器或檔案儲存相容性控制代碼。
- 舊版鉤子處理常式設定只能存在於 doctor 警告／遷移介面中。執行階段不得載入 `hooks.internal.handlers`；鉤子只能透過探索到的鉤子目錄與 `HOOK.md` 中繼資料執行。
- 執行階段啟動、高頻回覆路徑、壓縮、重設、復原、診斷、TTS、記憶鉤子、子 Agent、外掛命令路由、通訊協定邊界與鉤子，必須在執行階段中傳遞 `{agentId, sessionId}`。
- 測試應透過 `{agentId, sessionId}` 植入並驗證 SQLite 逐字稿資料列。除非涵蓋 doctor 匯入、非工作階段的支援／偵錯具現化，或通訊協定形態，否則僅證明 JSONL 路徑轉送、保留呼叫端提供的定位器，或逐字稿檔案相容性的測試都應刪除。
- `runEmbeddedPiAgent(...)`、已準備的工作程式執行，以及內部的嵌入式嘗試，都不得接受逐字稿定位器。它們依 `{agentId, sessionId}` 開啟 SQLite 逐字稿管理器，並將該管理器傳給內部化的 PI 相容 Agent 工作階段，使過時的呼叫端無法讓執行器寫入 JSON/JSONL 逐字稿。
- 執行器診斷必須將執行階段／快取／承載資料追蹤記錄儲存在 SQLite 中。執行階段診斷不得公開 JSONL 檔案覆寫控制項或通用逐字稿 JSONL 匯出輔助函式；面向使用者的匯出功能可以從資料庫資料列具現化明確成品，而不會將檔名回傳給執行階段。
- 原始串流記錄使用 `OPENCLAW_RAW_STREAM=1` 加上 SQLite 診斷資料列。舊版 pi-mono 的 `PI_RAW_STREAM`、`PI_RAW_STREAM_PATH` 和 `raw-openai-completions.jsonl` 檔案記錄器契約不屬於 OpenClaw 執行階段或測試。
- QMD 記憶索引不得將 SQLite 逐字稿匯出為 Markdown 檔案。QMD 僅為已設定的記憶檔案建立索引；工作階段逐字稿搜尋仍由 SQLite 支援。
- 對新程式碼而言，QMD SDK 子路徑僅供 QMD 使用。SQLite 工作階段逐字稿索引輔助函式位於 `memory-core-host-engine-session-transcripts`；任何 QMD 重新匯出都僅供相容性使用，執行階段程式碼不得使用。
- 內建記憶索引位於其所屬的 Agent 資料庫中。執行階段設定與已解析的執行階段契約不得公開 `memorySearch.store.path`；doctor 會刪除該舊版設定鍵，而目前程式碼會在內部傳遞 Agent 的 `databasePath`。

實作工作應持續刪除程式碼，直到這些陳述在 doctor／匯入／匯出／偵錯邊界之外皆無例外地成立。

## 目標狀態與進度

### 強制目標

- 一個全域 SQLite 資料庫負責控制平面狀態：
  `state/openclaw.sqlite`。
- 每個 Agent 各有一個 SQLite 資料庫負責資料平面狀態：
  `agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定維持檔案儲存。`openclaw.json` 不屬於此次資料庫重構。
- 舊版檔案只能作為 doctor 遷移輸入。
- 執行階段絕不將工作階段或逐字稿 JSONL 作為作用中狀態寫入或讀取。

### 目標狀態

- `not-started`：檔案時代的執行階段程式碼仍在寫入作用中狀態。
- `migrating`：doctor／匯入程式碼可將檔案資料移至 SQLite。
- `dual-read`：同時讀取 SQLite 與舊版檔案的暫時橋接。除非明確記載為僅供 doctor 使用，否則此次重構禁止此狀態。
- `sqlite-runtime`：執行階段僅讀寫 SQLite。
- `clean`：舊版執行階段 API 與測試已移除，且防護機制可防止迴歸。
- `done`：文件、測試、備份、doctor 遷移與變更檢查證明已達乾淨狀態。

### 目前狀態

- 工作階段：執行階段已達 `clean`。工作階段資料列位於各 Agent 資料庫中，執行階段 API 使用 `{agentId, sessionId}` 或 `{agentId, sessionKey}`，而 `sessions.json` 僅作為 doctor 的舊版輸入。
- 逐字稿：執行階段已達 `clean`。逐字稿事件、識別、快照與軌跡執行階段事件位於各 Agent 資料庫中。執行階段不再接受逐字稿定位器或 JSONL 逐字稿路徑。
- PI 嵌入式執行器：`clean`。嵌入式 PI 執行、已準備的工作程式、壓縮與重試迴圈使用 SQLite 工作階段範圍，並拒絕過時的逐字稿控制代碼。
- 排程：執行階段已達 `clean`。執行階段使用 `cron_jobs` 和 `cron_run_logs`；執行階段測試使用 SQLite 的 `storeKey` 命名，而檔案時代的排程路徑僅保留在 doctor 舊版遷移測試中。
- 工作登錄：`clean`。工作與 Task Flow 執行階段資料列位於 `state/openclaw.sqlite`；未發布的附屬 SQLite 匯入器已刪除。
- 外掛狀態：`clean`。外掛狀態／Blob 資料列位於共用全域資料庫中；防護機制會阻止舊版外掛狀態附屬 SQLite 輔助函式。
- 記憶：內建記憶與工作階段逐字稿索引已達 `sqlite-runtime`。記憶索引資料表位於各 Agent 資料庫中，外掛記憶狀態使用共用外掛狀態資料列，而舊版記憶檔案是 doctor 遷移輸入或使用者工作區內容。
- 備份：`sqlite-runtime`。備份階段會壓縮 SQLite 快照、略過作用中的 WAL/SHM 附屬檔案、驗證 SQLite 完整性，並將備份執行記錄至全域資料庫。
- Doctor 遷移：刻意維持在 `migrating`。Doctor 會將舊版 JSON、JSONL 與已淘汰的附屬儲存匯入 SQLite，記錄遷移執行／來源，並移除已成功處理的來源。
- E2E 指令碼：執行階段涵蓋範圍已達 `clean`。Docker MCP 植入程序會寫入 SQLite 資料列。執行階段情境 Docker 指令碼僅在 doctor 遷移植入資料中建立舊版 JSONL，並明確命名舊版工作階段索引路徑。

### 剩餘工作

- [x] 重新命名排程執行階段測試的儲存變數，避免使用 `storePath`，除非它們是 doctor 的舊版輸入。
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
- [x] 讓 Docker 執行階段情境的舊版 JSONL 植入資料明確顯示僅供 doctor 使用。
      檔案：`scripts/e2e/session-runtime-context-docker-client.ts`。
      證明：`rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` 僅顯示
      `seedBrokenLegacySessionForDoctorMigration`。
- [x] 在任何結構描述變更後，保持 Kysely 產生的型別一致。
      檔案：`src/state/openclaw-state-schema.sql`、
      `src/state/openclaw-agent-schema.sql`、
      `src/state/*generated*`。
      證明：此次沒有結構描述變更；`pnpm db:kysely:check`；
      `pnpm lint:kysely`。
- [x] 重新執行針對已修改儲存、命令和指令碼的聚焦測試。
      證明：`pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`；`git diff --check`。
- [x] 在宣告 `done` 前，執行變更閘門或遠端廣泛驗證。
      證明：在暫時設定 Node 24/pnpm，並為同步且不含 `.git` 的工作區明確設定路徑路由後，`pnpm check:changed --timed -- <changed extension paths>` 已在 Hetzner Crabbox 執行 `run_3f1cabf6b25c` 中通過。

### 不得迴歸

- 不得使用逐字稿定位器。
- 不得使用作用中的工作階段檔案。
- 除 doctor 舊版遷移測試外，不得使用假的 JSONL 測試固定資料。
- 預期使用 Kysely 之處不得直接存取原始 SQLite。
- 不得新增檔案時代的資料庫遷移。全域結構描述維持版本 `1`。
  已發布的各 Agent 版本 `1` 結構描述包含一次有界的執行階段遷移至版本 `2`，以提供穩定的記憶來源識別。

## 程式碼閱讀假設

沒有任何後續產品決策會阻礙此計畫。實作應依下列假設繼續進行：

- 直接使用 `node:sqlite`，並要求此儲存路徑使用 Node 22+ 執行階段。
- 僅保留一個一般設定檔。此重構不得將設定、外掛資訊清單或 Git 工作區移入 SQLite。
- 不需要執行階段相容性檔案。舊版 JSON 與 JSONL 檔案僅作為遷移輸入。分支本機的 SQLite 附屬檔案從未發布，因此直接刪除而不匯入。
- `openclaw doctor --fix` 負責將舊版檔案遷移至資料庫。執行階段啟動僅負責已發布 SQLite 結構描述版本之間的有限升級；不得匯入檔案時期的狀態。
- 認證資訊相容性遵循相同規則：執行階段認證資訊存放於 SQLite。舊版 `auth-profiles.json`、各代理程式的 `auth.json`，以及共用的 `credentials/oauth.json` 檔案是 doctor 遷移輸入，匯入後即移除。
- 產生的模型目錄狀態由資料庫支援。執行階段程式碼不得寫入 `agents/<agentId>/agent/models.json`；現有 `models.json` 檔案是舊版 doctor 輸入，匯入 `agent_model_catalogs` 後即移除。
- 執行階段不得遷移、正規化或橋接逐字稿定位器。SQLite 中的作用中逐字稿識別資訊為 `{agentId, sessionId}`。檔案路徑僅作為舊版 doctor 輸入，而 `sqlite-transcript://...` 必須從執行階段、通訊協定、掛鉤與外掛介面消失，不得將其視為邊界控制代碼。
- 執行階段讀取 SQLite 逐字稿時，不會執行舊版 JSONL 項目形狀遷移，也不會為了相容性而重寫整份逐字稿。舊版項目正規化僅保留於明確的 doctor／匯入公用工具中。Doctor 會先正規化舊版 JSONL 逐字稿檔案，再插入 SQLite 資料列；目前的執行階段資料列已依現行逐字稿結構描述寫入。軌跡／工作階段匯出會原樣讀取這些資料列，且不得在匯出時執行舊版遷移。
- 舊版逐字稿 JSONL 剖析／遷移輔助函式僅供 doctor 使用。執行階段逐字稿格式程式碼僅建構目前的 SQLite 逐字稿上下文；doctor 負責在插入資料列前升級舊版 JSONL 項目。
- 舊有由執行階段負責的 JSONL 逐字稿串流輔助函式已刪除。Doctor 匯入程式碼負責明確讀取舊版檔案；執行階段工作階段歷程則讀取 SQLite 資料列。
- Codex app-server 繫結使用 OpenClaw `sessionId` 作為 Codex 外掛狀態命名空間中的標準索引鍵。`sessionKey` 是用於路由／顯示的中繼資料，不得取代持久的工作階段 ID，也不得恢復逐字稿檔案識別資訊。
- 上下文引擎會直接接收目前的執行階段合約。登錄機制不得使用會刪除 `sessionKey`、`transcriptScope` 或 `prompt` 的重試相容層包裝引擎；無法接受目前資料庫優先參數的引擎應明確失敗，而不是透過橋接運作。
- 備份輸出應維持為單一封存檔案。資料庫內容應以精簡的 SQLite 快照形式納入該封存檔案，而不是原始的即時 WAL 附屬檔案。
- 逐字稿搜尋很實用，但不是首次資料庫優先改造的必要項目。設計結構描述時，應讓日後能加入 FTS。
- 在資料庫邊界穩定期間，Worker 執行應維持為由設定控制的實驗性功能。

## 程式碼閱讀發現

目前分支已經超越概念驗證階段。共用資料庫已存在，Node `node:sqlite` 已透過小型執行階段輔助函式接線，先前的儲存區現在會寫入 `state/openclaw.sqlite` 或所屬的 `openclaw-agent.sqlite` 資料庫。

剩餘工作不是選擇 SQLite，而是保持新邊界乾淨，並刪除任何仍形似舊有檔案世界的相容性介面：

- 工作階段 `storePath` 不再是執行階段識別資訊、測試固定資料形狀或狀態承載資料欄位。執行階段與橋接測試不再包含 `storePath` 合約名稱；doctor／遷移程式碼負責該舊版詞彙。
- 工作階段寫入不再經過舊有的程序內 `store-writer.ts` 佇列。SQLite 修補寫入會在交易外準備，接著透過短暫的同步驗證／套用交易執行，並明確偵測衝突。
- 舊版路徑探索仍有有效的遷移用途，但執行階段程式碼不應再將 `sessions.json` 與逐字稿 JSONL 檔案視為可能的寫入目標。
- 代理程式所屬的資料表位於各代理程式的 SQLite 資料庫中。全域資料庫保留登錄／控制平面資料列；逐字稿識別資訊是各代理程式逐字稿資料列中的 `{agentId, sessionId}`。執行階段程式碼不得保存逐字稿檔案路徑或遷移逐字稿定位器。
- Doctor 已經會匯入多種舊版檔案。清理工作的目標是將其整合為由 doctor 呼叫的單一明確遷移實作，並產生持久的遷移報告。

沒有其他產品問題會阻礙實作。

## 目前程式碼形態

此分支已具備真正的共用 SQLite 基礎：

- 執行環境最低需求現在為 Node 22+：`package.json`、命令列介面執行環境防護、
  安裝程式預設值、macOS 執行環境定位器、CI，以及公開安裝文件現在皆一致。
  舊有的 Node 22 相容性管線已移除。
- `src/state/openclaw-state-db.ts` 會開啟 `openclaw.sqlite`、設定 WAL、
  `synchronous=NORMAL`、`busy_timeout=30000`、`foreign_keys=ON`，並套用
  衍生自 `src/state/openclaw-state-schema.sql`
  的產生式結構描述模組。
- Kysely 資料表型別與執行環境結構描述模組，會從依據已提交 `.sql` 檔案建立的
  可拋棄式 SQLite 資料庫產生；執行環境程式碼不再為全域、各代理程式或代理
  擷取資料庫保留複製貼上的結構描述字串。
- 執行環境儲存區會從這些產生的 Kysely `DB` 介面衍生所選取與插入的資料列型別，
  而非手動建立 SQLite 資料列形狀的影子型別。原始 SQL 仍僅限於結構描述套用、
  pragma 與僅供遷移使用的 DDL。
- 全域 SQLite 結構描述仍為 `user_version = 1`。各代理程式結構描述的版本為
  `2`；其開啟器會以原子方式，將已發布版本 `1` 的記憶來源鍵遷移為穩定的
  整數識別。檔案至資料庫的匯入仍由 doctor 程式碼負責。
- 在擁有權邊界明確且為標準定義之處，會強制執行關聯式擁有權：
  來源遷移資料列會隨 `migration_runs` 串聯刪除、任務傳遞狀態會隨
  `task_runs` 串聯刪除，而逐字稿識別資料列會隨逐字稿事件串聯刪除。
- 目前的共用資料表包括 `agent_databases`、
  `auth_profile_stores`、`auth_profile_state`、
  `plugin_state_entries`、`plugin_blob_entries`、`media_blobs`、
  `skill_uploads`、`capture_sessions`、`capture_events`、`capture_blobs`、
  `sandbox_registry_entries`、`cron_run_logs`、`cron_jobs`、`commitments`、
  `delivery_queue_entries`、`model_capability_cache`、
  `workspace_setup_state`、`native_hook_relay_bridges`、
  `current_conversation_bindings`、`plugin_binding_approvals`、
  `tui_last_sessions`、`acp_sessions`、`acp_replay_sessions`、
  `acp_replay_events`、`task_runs`、`task_delivery_state`、`flow_runs`、
  `subagent_runs`、`migration_runs` 及 `backup_runs`。
- 任意由外掛擁有的狀態不會取得由主機擁有的型別化資料表。已安裝的外掛使用
  `plugin_state_entries` 儲存具版本的 JSON 承載資料，並使用
  `plugin_blob_entries` 儲存位元組，同時具備命名空間／鍵擁有權、TTL 清理、
  備份與外掛遷移記錄。當主機擁有查詢契約時，由主機擁有的外掛協調狀態仍可
  使用型別化資料表，例如 `plugin_binding_approvals`。
- 外掛遷移是針對外掛所擁有命名空間的資料遷移，而非主機結構描述遷移。
  外掛可透過遷移提供者遷移自己的具版本狀態／二進位大型物件項目，而主機會在
  一般遷移台帳中記錄來源／執行狀態。安裝新外掛不需要變更
  `openclaw-state-schema.sql`，除非主機本身要取得新跨外掛契約的擁有權。
- `src/state/openclaw-agent-db.ts` 會開啟
  `agents/<agentId>/agent/openclaw-agent.sqlite`、在全域資料庫中登錄該資料庫，
  並擁有代理程式本機的工作階段、逐字稿、VFS、成品、快取與記憶索引資料表。
  共用執行環境探索現在會讀取由產生型別定義的 `agent_databases` 登錄表，
  而非在每個呼叫位置重新實作該查詢。
- 全域與各代理程式資料庫會記錄一筆 `schema_meta` 資料列，其中包含資料庫角色、
  結構描述版本、時間戳記，以及代理程式資料庫的代理程式 ID。全域資料庫仍為
  `user_version = 1`；各代理程式資料庫會在有限範圍的記憶來源識別遷移後使用
  版本 `2`。
- 各代理程式工作階段識別現在具有標準的 `sessions` 根資料表，以
  `session_id` 為鍵，並將 `session_key`、`session_scope`、`account_id`、
  `primary_conversation_id`、時間戳記、顯示欄位、模型中繼資料、控制框架 ID，
  以及父層／衍生連結作為可查詢欄位。`session_routes` 是從 `session_key`
  到目前 `session_id` 的唯一作用中路由索引，因此路由鍵可移至新的持久工作階段，
  而不會讓熱門讀取必須在重複的 `sessions.session_key` 資料列之間選擇。舊有
  相容性形狀的 `session_entries.entry_json` 承載資料會透過外部索引鍵附加於
  持久的 `session_id` 根；它不再是結構描述層級中工作階段的唯一表示方式。
- 各代理程式的外部對話識別也已關聯化：
  `conversations` 儲存正規化的提供者／帳號／對話識別，而
  `session_conversations` 會將一個 OpenClaw 工作階段連結至一或多個外部對話。
  這涵蓋共用主要私訊工作階段，其中多個對話者可刻意對應至同一工作階段，
  而無須在 `session_key` 中提供不實資訊。SQLite 也會強制自然提供者識別的
  唯一性，因此相同的頻道／帳號／種類／對話者／討論串組合無法分岔至不同的
  對話 ID。共用主要直接對話者會以 `participant` 角色連結，因此一個
  OpenClaw 工作階段可代表多個外部私訊對話者，而不必將較早的對話者降級為
  定義模糊的相關資料列。`sessions.primary_conversation_id` 仍會指向目前的
  型別化傳遞目標。已關閉的路由／狀態欄位會透過 SQLite `CHECK` 約束強制執行，
  而非僅依賴 TypeScript 聯集。
  執行環境工作階段投影會先清除 `session_entries.entry_json` 中的相容性路由
  影子資料，再套用型別化工作階段／對話欄位，因此過時的 JSON 承載資料無法
  恢復傳遞目標。
  子代理程式公告路由同樣要求型別化 SQLite 傳遞內容；它不再退回使用相容性的
  `SessionEntry` 路由欄位。
  閘道 `chat.send` 的明確傳遞繼承會讀取型別化 SQLite 傳遞內容，而非
  `origin`／`last*` 相容性欄位。
  `tools.effective` 同樣會從型別化 SQLite 傳遞／路由資料列衍生
  提供者／帳號／討論串內容，而非過時的 `last*` 工作階段項目影子資料。
  系統事件提示內容會從型別化傳遞欄位重建頻道／目標／帳號／討論串欄位，
  而非使用 `origin` 影子資料。
  共用的 `deliveryContextFromSession` 輔助函式與工作階段至對話對應器現在會
  完全忽略 `SessionEntry.origin`；只有型別化傳遞欄位與關聯式對話資料列能
  建立熱門路由識別。
  執行環境工作階段項目正規化會在保存或投影 `entry_json` 前移除 `origin`，
  而傳入中繼資料會寫入型別化頻道／聊天欄位及關聯式對話資料列，而非建立新的
  origin 影子資料。
- 逐字稿事件、逐字稿快照與軌跡執行環境事件現在會參照標準的各代理程式
  `sessions` 根，並隨工作階段刪除而串聯刪除。逐字稿識別／冪等性資料列會繼續
  從確切的逐字稿事件資料列串聯刪除。
- 記憶核心索引現在使用明確的代理程式資料庫資料表
  `memory_index_meta`、`memory_index_sources`、`memory_index_chunks` 與
  `memory_embedding_cache`，並由 `memory_index_state` 追蹤修訂變更。
  選用的 FTS／向量側邊索引會命名為 `memory_index_chunks_fts` 與
  `memory_index_chunks_vec`，而非一般性的 `meta`、`files`、`chunks`、
  `chunks_fts` 或 `chunks_vec` 資料表。這些標準名稱會保留目前的
  路徑／來源資料列形狀及序列化嵌入相容性。這些資料表屬於衍生／搜尋快取，
  而非標準逐字稿儲存區；它們可從記憶工作區檔案與已設定來源刪除並重建。
  開啟使用已發布一般名稱的記憶索引時，會將其中繼資料、來源、區塊與嵌入快取
  遷移至標準資料表；衍生的 FTS／向量資料表則會以其標準名稱重建。
- 子代理程式執行復原狀態現在位於型別化的共用 `subagent_runs` 資料列中，
  並具有子工作階段、請求者與控制器工作階段鍵的索引。舊有
  `subagents/runs.json` 檔案僅作為 doctor 遷移輸入。
- 目前對話繫結現在位於型別化的共用 `current_conversation_bindings` 資料列中，
  以正規化對話 ID 為鍵，並將目標代理程式／工作階段欄位、對話種類、狀態、
  到期時間及中繼資料儲存為關聯式欄位，而非重複的不透明繫結記錄。
  持久繫結鍵包含正規化對話種類，因此直接／群組／頻道參照不會互相衝突，
  且 SQLite 會拒絕無效的繫結種類／狀態值。舊有
  `bindings/current-conversations.json` 檔案僅作為 doctor 遷移輸入。
- 傳遞佇列復原現在會在重播 JSON 上覆加頻道、目標、帳號、工作階段、重試、
  錯誤、平台傳送與復原狀態的型別化佇列欄位。`entry_json` 會保留重播承載資料、
  掛鉤與格式化承載資料，但型別化欄位是熱門佇列路由／狀態的權威來源。
- 終端介面上次工作階段還原指標現在位於型別化的共用
  `tui_last_sessions` 資料列中，以雜湊後的終端介面連線／工作階段範圍為鍵。
  舊有終端介面 JSON 檔案僅作為 doctor 遷移輸入。
- 預設 TTS 偏好設定現在位於 `speech-core` 外掛下的共用外掛狀態 SQLite
  資料列中。舊有 `settings/tts.json` 檔案僅作為 doctor 遷移輸入；執行環境
  不再讀取或寫入 TTS 偏好設定 JSON 檔案，而舊有路徑解析器則位於 doctor
  遷移模組中。
- 機密目標中繼資料現在會描述儲存區，而不再假裝每個認證資訊目標都是設定檔。
  `openclaw.json` 仍為設定儲存區；驗證設定檔目標使用型別化 SQLite
  `auth_profile_stores` 資料列，並將依提供者形狀組織的認證資訊保留為
  JSON 承載資料。
- 機密稽核不再掃描已退役的各代理程式 `auth.json` 檔案。doctor 負責對該舊有
  檔案發出警告、匯入並移除。
- 舊有驗證設定檔路徑輔助函式現在位於 doctor 舊版程式碼中。核心驗證設定檔
  路徑輔助函式會公開 SQLite 驗證儲存區識別與顯示位置，而非
  `auth-profiles.json` 或 `auth-state.json` 執行環境路徑。
- 子代理程式執行復原與 OpenRouter 模型能力快取執行環境模組，現在會將 SQLite
  快照讀取器／寫入器與僅供 doctor 使用的舊有 JSON 匯入輔助函式分離。
  OpenRouter 能力使用 `provider_id = "openrouter"` 下的型別化通用
  `model_capability_cache` 資料列，而非單一不透明快取二進位大型物件或
  提供者專用的主機資料表。子代理程式執行的 `taskName` 會儲存在型別化
  `subagent_runs.task_name` 欄位中；`payload_json` 副本是重播／偵錯資料，
  而非熱門顯示或查詢欄位的來源。
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` 會在代理程式資料庫的
  `vfs_entries` 資料表上實作 SQLite VFS。目錄讀取、遞迴匯出、刪除與重新命名
  會使用具索引的 `(namespace, path)` 前綴範圍，而非掃描整個命名空間或依賴
  `LIKE` 路徑比對。
- `src/agents/runtime-worker.entry.ts` 會為工作程序建立每次執行專用的
  SQLite VFS、工具成品、執行成品與具範圍的快取儲存區。
- 工作區啟動完成標記現在位於型別化的共用 `workspace_setup_state` 資料列中，
  以解析後的工作區路徑為鍵，而非 `.openclaw/workspace-state.json`；執行環境
  不再讀取或重寫舊有工作區標記，且輔助 API 不再只是為了衍生儲存識別而四處
  傳遞虛假的 `.openclaw/setup-state` 路徑。
- 執行核准現在位於型別化的共用 SQLite `exec_approvals_config` 單例資料列中。
  doctor 會匯入舊有 `~/.openclaw/exec-approvals.json`；執行環境寫入不再建立、
  重寫該檔案，或將其回報為作用中的儲存位置。macOS 輔助應用程式會讀寫相同的
  `state/openclaw.sqlite` 資料表資料列；它只會將 Unix 提示通訊端保留在磁碟上，
  因為那是 IPC，而非持久的執行環境狀態。
- 裝置識別、裝置驗證與啟動執行環境模組，現在會將其 SQLite 快照讀取器／寫入器
  與僅供 doctor 使用的舊有 JSON 匯入輔助函式分離。裝置識別使用型別化
  `device_identities` 資料列，而裝置驗證權杖使用型別化
  `device_auth_tokens` 資料列。裝置驗證寫入會依裝置／角色協調資料列，
  而非截斷權杖資料表，且執行環境不再
  透過舊版整體儲存區配接器路由單一權杖更新。舊版
  version-1 JSON 承載內容僅作為 doctor 匯入／匯出格式存在。
- GitHub Copilot 權杖交換快取使用共用 SQLite 外掛狀態資料表，
  位於 `github-copilot/token-cache/default`。這是由提供者擁有的快取狀態，
  因此刻意不新增主機結構描述資料表。
- GitHub Copilot 壓縮不再寫入 `openclaw-compaction-*.json`
  工作區附屬檔案。測試框架會針對受追蹤的 SDK 工作階段呼叫 SDK 歷程壓縮 RPC，
  而 OpenClaw 會將持久工作階段／逐字稿狀態保留在
  SQLite 中，而非相容性標記檔案。
- 共用 Swift 執行階段（`OpenClawKit`）針對裝置身分和裝置驗證使用相同的
  `state/openclaw.sqlite` 資料列。macOS 應用程式
  輔助程式會匯入共用 SQLite 輔助程式，而非自行擁有第二個 JSON 或
  SQLite 路徑。若殘留舊版 `identity/device.json`，將阻止建立身分，
  直到 doctor 將其匯入 SQLite，這與 TypeScript 和 Android
  的啟動閘門一致。
- Android 裝置身分使用儲存在具型別
  `state/openclaw.sqlite#table/device_identities` 資料列中、與 TypeScript 相容的相同金鑰材料。它絕不
  讀取或寫入 `openclaw/identity/device.json`；若殘留舊版檔案，將阻止
  啟動，直到 doctor 將其匯入 SQLite。
- Android 快取的裝置驗證權杖也使用具型別的
  `state/openclaw.sqlite#table/device_auth_tokens` 資料列，並與 TypeScript 和 Swift 共用相同的
  version-1 權杖語意。執行階段不再讀取 `SecurePrefs`
  `gateway.deviceToken*` 相容性金鑰；這些金鑰僅屬於遷移／doctor
  邏輯。
- Android 通知的最近套件歷程使用具型別的
  `android_notification_recent_packages` 資料列。執行階段不再遷移或
  讀取舊版 SharedPreferences CSV 金鑰。
- 當舊版 `identity/device.json`
  存在、SQLite 身分資料列無效，或無法開啟 SQLite 身分
  儲存區時，裝置身分建立會以關閉方式失敗。doctor 會先匯入並移除該檔案，因此執行階段
  啟動無法在遷移前無聲地輪替配對身分。
- 裝置身分選取項是 SQLite 資料列金鑰，而非 JSON 檔案定位器。測試
  和閘道輔助程式會傳遞明確的身分金鑰；只有 doctor 遷移和
  以關閉方式失敗的啟動閘門知道已淘汰的 `identity/device.json` 檔名。
- 工作階段重設相容性現在位於 doctor 設定遷移中：
  `session.idleMinutes` 會移至 `session.reset.idleMinutes`，
  `session.resetByType.dm` 會移至 `session.resetByType.direct`，而
  執行階段重設原則只會讀取標準重設金鑰。
- 舊版設定相容性現在位於 `src/commands/doctor/` 下。一般
  `readConfigFileSnapshot()` 驗證不會匯入 doctor 舊版偵測器，
  也不會標註舊版問題；`runDoctorConfigPreflight()` 會加入這些問題，供
  doctor 修復／回報。doctor 設定流程會匯入
  `src/commands/doctor/legacy-config.ts`，而舊版 OAuth 設定檔 ID 修復則位於
  `src/commands/doctor/legacy/oauth-profile-ids.ts`
  下。
- 非 doctor 命令不會自動執行舊版設定修復。例如，
  `openclaw update --channel` 現在遇到無效的舊版設定時會失敗，並要求
  使用者執行 doctor，而非無聲地匯入 doctor 遷移程式碼。
- Web 推播、APNs、語音喚醒、更新檢查和設定健康狀態現在會使用具型別的共用 SQLite
  資料表來儲存訂閱、VAPID 金鑰、節點註冊、觸發程序資料列、
  路由資料列、更新通知狀態和設定健康狀態項目，而非
  完整的不透明 JSON Blob。Web 推播和 APNs 快照寫入現在會依主鍵協調
  訂閱／註冊，而非清除其資料表；
  設定健康狀態也會依設定路徑採用相同方式。
  其執行階段模組會將 SQLite 快照讀取器／寫入器與
  僅供 doctor 使用的舊版 JSON 匯入輔助程式分開。
- 節點主機設定現在使用共用 SQLite 資料庫中的具型別單例資料列；
  doctor 會在一般執行階段使用前匯入舊版 `node.json` 檔案。
- 裝置／節點配對、頻道配對、頻道允許清單和啟動程序狀態
  現在會使用具型別的 SQLite 資料列，而非完整的不透明 JSON Blob。外掛繫結
  核准和排程工作狀態也採用相同的拆分方式：執行階段模組公開
  由 SQLite 支援的操作和中立快照輔助程式，而配對／啟動程序
  及外掛繫結核准快照寫入會依主鍵協調資料列，
  而非截斷資料表；同時 doctor 會透過
  `src/commands/doctor/legacy/*` 模組匯入／移除舊版 JSON 檔案。
- 已安裝外掛記錄現在位於 SQLite 已安裝外掛索引中。
  執行階段設定讀取／寫入不再遷移或保留舊版
  `plugins.installs` 手動編寫的設定資料；doctor 會在一般執行階段使用前，
  將該舊版設定格式匯入 SQLite。
- QQ Bot 認證資訊復原快照現在位於 SQLite 外掛狀態中的
  `qqbot/credential-backups`。執行階段不再寫入
  `qqbot/data/credential-backup*.json`；QQ Bot doctor 合約會從作用中狀態目錄匯入並
  封存這些舊版備份檔案。
- 閘道重新載入規劃會在內部
  `installedPluginIndex.installRecords.*` 差異命名空間下比較 SQLite 已安裝外掛索引快照。執行階段
  重新載入決策不再將這些資料列包裝成虛假的 `plugins.installs` 設定
  物件。
- Matrix 具名帳戶認證資訊升級不再於執行階段
  讀取時進行。當能解析出單一／預設 Matrix 帳戶時，doctor 會負責舊版頂層
  `credentials/matrix/credentials.json`
  重新命名。
- 核心配對和排程執行階段模組不再匯出舊版 JSON 路徑
  建構器。由 doctor 擁有的舊版模組僅為匯入測試和
  遷移建構 `pending.json`、`paired.json`、
  `bootstrap.json` 和 `cron/jobs.json` 來源路徑。舊版排程工作格式正規化和排程執行記錄匯入
  位於 `src/commands/doctor/legacy/cron*.ts` 下。
- `src/commands/doctor/legacy/runtime-state.ts` 會從 doctor 將舊版 JSON 狀態
  檔案（包括節點主機設定）匯入 SQLite。新的舊版檔案
  匯入器會保留在 `src/commands/doctor/legacy/` 下。
- `src/commands/doctor/state-migrations.ts` 會將舊版 `sessions.json` 和
  `*.jsonl` 逐字稿直接匯入 SQLite，並移除成功匯入的來源。它
  不再透過 `agents/<agentId>/sessions/*.jsonl` 暫存根目錄舊版逐字稿，
  也不會在匯入前建立標準 JSONL 目標。
- 狀態完整性 doctor 檢查不再掃描舊版工作階段目錄，也不再
  提供刪除孤立 JSONL 的選項。舊版逐字稿檔案僅作為遷移輸入，
  而遷移步驟會負責匯入及移除來源。
- 舊版沙箱登錄匯入位於
  `src/commands/doctor/legacy/sandbox-registry.ts` 下；作用中的沙箱登錄
  讀取和寫入仍僅使用 SQLite。
- 舊版工作階段逐字稿健康狀態／匯入修復位於
  `src/commands/doctor/legacy/session-transcript-health.ts` 下；執行階段命令
  模組不再包含 JSONL 逐字稿剖析或作用中分支修復程式碼。

已完成的整併／刪除重點：

- 外掛狀態現在使用共用的 `state/openclaw.sqlite` 資料庫。舊有的
  分支本機 `plugin-state/state.sqlite` 附屬匯入器已移除，因為
  該 SQLite 配置從未發布。探測／測試輔助工具會回報共用的
  `databasePath`，而不再公開外掛狀態專用的 SQLite 路徑。
- Task 與 Task Flow 執行階段資料表現在位於共用的
  `state/openclaw.sqlite` 資料庫，而非 `tasks/runs.sqlite` 與
  `tasks/flows/registry.sqlite`；舊有附屬匯入器也因相同的未發布配置原因而移除。
- `src/config/sessions/store.ts` 的傳入中繼資料、路由更新或更新時間讀取
  不再需要 `storePath`。命令持久化、命令列介面工作階段清理、
  子代理程式深度、驗證覆寫及逐字稿工作階段身分識別，均使用
  代理程式／工作階段資料列 API。寫入會以 SQLite 資料列修補套用，
  並在樂觀衝突時重試。
- 工作階段目標解析現在公開每個代理程式的資料庫目標，而非舊有的
  `sessions.json` 路徑。共用閘道、ACP 中繼資料、doctor 路由修復及
  `openclaw sessions` 會列舉 `agent_databases` 與已設定的代理程式。
- 閘道工作階段路由現在使用 `resolveGatewaySessionDatabaseTarget`；傳回的
  目標會攜帶 `databasePath` 與候選 SQLite 資料列鍵，而非舊有的
  工作階段儲存檔案路徑。
- 頻道工作階段執行階段型別現在會為更新時間讀取、傳入中繼資料及
  最後路由更新公開 `{agentId, sessionKey}`。舊有的
  `saveSessionStore(storePath, store)` 相容性型別已移除。
- 外掛執行階段、擴充功能 API 與外掛 SDK 工作階段介面，現在公開
  SQLite 支援的工作階段資料列輔助工具，而非作用中工作階段的整體儲存區／
  檔案相容性輔助工具。根程式庫的相容性匯出僅在外掛 SDK 之外保留，
  供舊有內部與遷移呼叫端使用。舊有的 `resolveLegacySessionStorePath`
  輔助工具已移除；舊版 `sessions.json` 路徑建構現在僅存在於遷移與測試固定資料中。
- `src/config/sessions/session-entries.sqlite.ts` 現在會將標準工作階段
  項目儲存在每個代理程式的資料庫中，並支援資料列層級的讀取／更新插入／刪除修補。
  執行階段的更新插入／修補／刪除不再掃描大小寫變體，也不再清除
  舊版別名鍵；標準化由 doctor 負責。獨立的 JSON 匯入輔助工具已移除，
  遷移會更新插入較新的資料列，而非取代整個工作階段資料表。
  公開的讀取／列舉／載入輔助工具會從具型別的 `sessions` 與
  `conversations` 資料列投影常用的工作階段中繼資料；`entry_json`
  是相容性／偵錯用的影子資料，即使內容過時或無效，也不會遺失
  具型別的工作階段身分或傳遞內容。
- `src/config/sessions/delivery-info.ts` 現在會從具型別的每個代理程式
  `sessions` + `conversations` + `session_conversations` 資料列解析傳遞內容。
  它不再從 `session_entries.entry_json` 重建執行階段傳遞身分；
  缺少具型別的對話資料列屬於 doctor 遷移／修復問題，而非執行階段備援。
- 已儲存工作階段的重設決策現在優先使用具型別的
  `sessions.session_scope`、`sessions.chat_type` 與 `sessions.channel`
  中繼資料。僅在命令目標具有明確的討論串／主題後綴時，才會繼續解析
  `sessionKey`；群組與直接重設的分類不再來自鍵的形式。
- 工作階段清單／狀態顯示分類現在使用具型別的聊天中繼資料與
  閘道工作階段種類。它不再將 `session_key` 內的 `:group:` 或
  `:channel:` 子字串視為持久可靠的群組／直接對話依據。
- 靜默回覆政策選擇現在僅使用明確的對話類型或介面中繼資料。
  它不再根據 `session_key` 子字串猜測直接／群組政策。
- 工作階段顯示模型解析現在會從 SQLite 工作階段資料庫目標取得
  代理程式 ID，而非從 `session_key` 拆解出來。
- 代理程式對代理程式的宣告目標補足現在僅使用具型別的 `sessions.list`
  `deliveryContext`。它不再從舊版 `origin`、鏡像的 `last*` 欄位或
  `session_key` 形式復原頻道／帳戶／討論串路由。
- `sessions_send` 的討論串目標拒絕判定現在讀取具型別的 SQLite 路由
  中繼資料。它不再透過從目標鍵解析討論串後綴來拒絕或接受目標。
- 群組範圍的工具政策驗證現在讀取目前或衍生工作階段的具型別 SQLite
  對話路由。它不再透過解碼 `sessionKey` 信任群組／頻道身分；
  若沒有具型別工作階段資料列為呼叫端提供的群組 ID 背書，便會捨棄該 ID。
- 頻道模型覆寫比對現在使用明確的群組與父對話中繼資料。
  它不再從 `parentSessionKey` 解碼父對話 ID。
- 已儲存模型覆寫的繼承現在需要具型別工作階段內容提供明確的父工作階段鍵。
  它不再從 `sessionKey` 中的 `:thread:` 或 `:topic:` 後綴衍生父層覆寫。
- 舊有的工作階段討論串資訊包裝函式與已載入外掛討論串剖析器已移除；
  執行階段程式碼不再匯入 `config/sessions/thread-info`。
- 頻道對話輔助工具不再公開完整工作階段鍵的解析橋接。
  核心仍會透過 `resolveSessionConversation(...)` 標準化由供應商擁有的
  原始對話 ID，但不會從 `sessionKey` 重建路由資訊。
- 完成傳遞、傳送政策與 Task 維護不再從 `session_key` 形式衍生聊天類型。
  舊有的聊天類型鍵剖析器已刪除；這些路徑需要具型別的工作階段中繼資料、
  具型別的傳遞內容或明確的傳遞目標詞彙。
- 工作階段清單／狀態、診斷、核准帳戶繫結、終端介面心跳偵測篩選及
  使用量摘要，不再從 `SessionEntry.origin` 挖掘供應商／帳戶／討論串／
  顯示路由。剩餘的執行階段 `origin` 讀取僅涉及非工作階段概念或
  目前回合的傳遞物件。
- 核准要求的原生對話查詢現在讀取具型別的每個代理程式工作階段路由資料列。
  它不再從 `sessionKey` 解析頻道／群組／討論串對話身分；缺少具型別
  中繼資料屬於遷移／修復問題。
- 閘道工作階段變更／聊天／工作階段事件承載資料不再回傳
  `SessionEntry.origin` 或 `last*` 路由影子；用戶端會收到具型別的
  `channel`、`chatType` 與 `deliveryContext`。
- 心跳偵測傳遞解析現在可直接接收具型別的 SQLite `deliveryContext`，
  而心跳偵測執行階段會傳入每個代理程式的工作階段傳遞資料列，
  不再依賴相容性 `session_entries` 影子取得目前路由。
- 排程隔離代理程式的傳遞目標解析，也會先從具型別的每個代理程式
  工作階段傳遞資料列補足目前路由，才退回相容性項目承載資料。
- 子代理程式宣告來源解析現在會透過 `loadRequesterSessionEntry`
  傳遞具型別的要求端工作階段傳遞內容，並優先使用該資料列，而非
  相容性的 `last*`／`deliveryContext` 影子。
- 傳入工作階段中繼資料更新現在會優先與具型別的每個代理程式傳遞資料列合併；
  僅在不存在具型別的對話資料列時，才以舊有的 `SessionEntry` 傳遞欄位作為備援。
- 重新啟動／更新傳遞擷取現在會讓具型別 SQLite 傳遞的 `threadId`
  優先於從 `sessionKey` 解析出的主題／討論串片段；解析僅作為
  舊版討論串形式鍵的備援。
- Hook 代理程式內容的頻道 ID 現在優先使用具型別 SQLite 對話身分，
  其次才是明確的訊息中繼資料。它們不再從 `sessionKey` 解析
  供應商／群組／頻道片段。
- 閘道 `chat.send` 的外部路由繼承現在讀取具型別 SQLite 工作階段路由
  中繼資料，而非從 `sessionKey` 片段推斷頻道／直接／群組範圍。
  僅當具型別工作階段頻道與聊天類型符合已儲存的傳遞內容時，
  頻道範圍工作階段才會繼承；共用主要工作階段則保留較嚴格的
  命令列介面／無用戶端中繼資料規則。
- 重新啟動哨兵喚醒與續接路由現在會先讀取具型別 SQLite 傳遞／路由資料列，
  再將心跳偵測喚醒或已路由的代理程式回合續接排入佇列。它不再從
  工作階段項目 JSON 影子重建傳遞內容。
- 閘道 `tools.effective` 內容解析現在會從具型別 SQLite 傳遞／路由資料列
  讀取供應商、帳戶、目標、討論串及回覆模式輸入。它不再從過時的
  `session_entries.entry_json` 來源影子復原這些常用路由欄位。
- 即時語音諮詢路由現在會從具型別的每個代理程式 SQLite 工作階段資料列
  解析父層／通話傳遞。選擇嵌入式代理程式訊息路由時，不再退回
  相容性的 `SessionEntry.deliveryContext` 影子。
- ACP 衍生心跳偵測轉送與父串流路由現在從具型別 SQLite 工作階段資料列
  讀取父層傳遞。它們不再從相容性工作階段項目影子重建父層傳遞內容。
- 工作階段傳遞路由保留現在遵循具型別聊天中繼資料與持久化傳遞欄位。
  它不再從 `sessionKey` 擷取頻道提示、直接／主要標記或討論串形式；
  內部網頁聊天路由僅會在 SQLite 已具有該工作階段的具型別／持久化
  傳遞身分時，才繼承外部目標。
- 通用工作階段傳遞擷取現在僅讀取完全符合的具型別 SQLite 工作階段
  傳遞資料列。它不再解析討論串／主題後綴，也不再從討論串形式的鍵
  退回基礎工作階段鍵。
- 回覆分派、重新啟動哨兵復原與即時語音諮詢路由現在使用完全符合的
  具型別 SQLite 工作階段／對話資料列進行討論串路由。它們不再透過
  解析討論串形式的工作階段鍵來復原討論串 ID 或基礎工作階段傳遞內容。
- 嵌入式 PI 歷程限制現在使用具型別 SQLite 工作階段路由投影
  （`sessions` + 主要 `conversations`）取得供應商、聊天類型與
  對等端身分。它不再從 `sessionKey` 解析供應商、私訊、群組或討論串形式。
- 排程工具傳遞推斷現在僅使用明確的傳遞資訊或目前具型別的傳遞內容。
  它不再從 `agentSessionKey` 解碼頻道、對等端、帳戶或討論串目標。
- 執行階段工作階段資料列不再包含舊有的 `lastProvider` 路由別名。
  輔助工具與測試使用具型別的 `lastChannel` 與 `deliveryContext` 欄位；
  只有 doctor 遷移應轉換較舊的路由別名或持久化的 `origin` 影子。
- 逐字稿事件、VFS 資料列與工具成品資料列現在會寫入每個代理程式的
  資料庫。未發布的全域逐字稿檔案對應資料表已移除；doctor 改為在
  持久遷移資料列中記錄舊版來源路徑。
- 執行階段逐字稿查詢不再掃描 JSONL 位元組偏移，也不再探測舊版逐字稿檔案。
  閘道聊天／媒體／歷程路徑會從 SQLite 讀取逐字稿資料列；
  工作階段 JSONL 現在僅是舊版 doctor 輸入，不是執行階段狀態或匯出格式。
- 逐字稿父層與分支關係使用 SQLite 逐字稿標頭中的結構化
  `parentTranscriptScope: {agentId, sessionId}` 中繼資料，而非類路徑的
  `agent-db:...transcript_events...` 定位字串。
- 逐字稿管理員合約不再公開隱含持久化的 `create(cwd)` 或
  `continueRecent(cwd)` 建構函式。持久化逐字稿管理員會使用明確的
  `{agentId, sessionId}` 範圍開啟；僅有記憶體內管理員在測試與
  純逐字稿轉換中維持無範圍。
- 執行階段逐字稿儲存 API 會解析 SQLite 範圍，而非檔案系統路徑。
  舊有的 `resolve...ForPath` 輔助工具與未使用的 `transcriptPath`
  寫入選項已從執行階段呼叫端移除。
- 執行階段工作階段解析現在使用 `{agentId, sessionId}`，且不得為外部邊界
  衍生 `sqlite-transcript://<agent>/<session>` 字串。舊版絕對 JSONL
  路徑僅作為 doctor 遷移輸入。
- 原生 Hook 轉送直接橋接記錄現在位於具型別的共用
  `native_hook_relay_bridges` 資料列，並以轉送 ID 作為鍵。執行階段不再為
  這些短期橋接記錄寫入 `/tmp` JSON 登錄檔或不透明的通用記錄。
- `runEmbeddedPiAgent(...)` 不再具有對話記錄定位器參數。
  預備的工作程序描述元也會省略對話記錄定位器。執行階段工作階段
  狀態與排入佇列的後續執行會攜帶 `{agentId, sessionId}`，而非
  衍生的對話記錄控制代碼。
- 嵌入式壓縮現在會從 `agentId` 與 `sessionId` 取得 SQLite 範圍。
  壓縮掛鉤、內容引擎呼叫、命令列介面委派及通訊協定回覆
  不得接收衍生的 `sqlite-transcript://...` 控制代碼。匯出／偵錯程式碼
  可以從資料列具現化明確的使用者成品，但不會提供
  通用工作階段 JSONL 匯出路徑，也不會將檔案名稱回饋至執行階段
  身分。
- `/export-session` 會從 SQLite 讀取對話記錄資料列，且只寫入所要求的
  獨立 HTML 檢視。嵌入式檢視器不再從這些資料列重建或
  下載工作階段 JSONL。
- 內容引擎委派不再剖析對話記錄定位器以還原
  代理程式身分。預備的執行階段內容會將已解析的 `agentId`
  傳入內建壓縮配接器。
- 對話記錄重寫與即時工具結果截斷現在會依
  `{agentId, sessionId}` 讀取及持久保存對話記錄狀態，且不會為
  對話記錄更新事件承載資料衍生暫時定位器。
- 對話記錄狀態輔助程式介面不再具有以定位器為基礎的
  `readTranscriptState`、`replaceTranscriptStateEvents` 或
  `persistTranscriptStateMutation` 變體。執行階段呼叫端必須使用
  `{agentId, sessionId}` API。Doctor 匯入會透過明確檔案
  路徑讀取舊版檔案並寫入 SQLite 資料列；它不會遷移定位器字串。
- 執行階段工作階段管理員合約不再公開 `open(locator)`、
  `forkFrom(locator)` 或 `setTranscriptLocator(...)`。持久化工作階段
  管理員只會依 `{agentId, sessionId}` 開啟；列出／分支輔助程式位於
  以資料列為導向的工作階段與檢查點 API，而非對話記錄管理員
  外觀介面。
- 閘道對話記錄讀取器 API 以範圍優先。它們接受
  `{agentId, sessionId}`，且不接受可能意外成為執行階段身分的
  位置式對話記錄定位器。作用中對話記錄定位器剖析
  已移除；舊版來源路徑僅由 Doctor 匯入程式碼讀取。
- 對話記錄更新事件也以範圍優先。`emitSessionTranscriptUpdate`
  不再接受單獨的定位器字串，接聽程式會依
  `{agentId, sessionId}` 路由，而不剖析控制代碼。
- 閘道工作階段訊息廣播會從代理程式／工作階段
  範圍解析工作階段金鑰，而非從對話記錄定位器解析。舊有的對話記錄定位器至工作階段
  金鑰解析器／快取已移除。
- 閘道工作階段歷程 SSE 會依代理程式／工作階段範圍篩選即時更新。它不
  再將候選對話記錄定位器正規化，也不再解析實際路徑，或使用檔案形式的
  對話記錄身分來判斷串流是否應接收更新。
- 工作階段生命週期掛鉤不再於
  `session_end` 衍生或公開對話記錄定位器。掛鉤使用端會取得 `sessionId`、`sessionKey`、下一個工作階段
  ID 與代理程式內容；對話記錄檔案不屬於生命週期
  合約。
- 重設掛鉤也不再衍生或公開對話記錄定位器。
  `before_reset` 承載資料會攜帶從 SQLite 復原的訊息與重設
  原因，而工作階段身分則保留在掛鉤內容中。
- 代理程式測試框架重設不再接受對話記錄定位器。重設分派會以
  `sessionId`／`sessionKey` 加上原因限定範圍。
- 代理程式擴充功能工作階段型別不再公開 `transcriptLocator`；擴充功能
  應使用工作階段內容與執行階段 API，而非嘗試取得
  檔案形式的對話記錄身分。
- 外掛壓縮掛鉤不再公開對話記錄定位器。掛鉤內容
  已攜帶工作階段身分，而對話記錄讀取必須透過可感知 SQLite
  範圍的 API，而非檔案形式的控制代碼。
- `before_agent_finalize` 掛鉤不再公開 `transcriptPath`，包括
  原生掛鉤轉送承載資料。完成掛鉤只使用工作階段內容。
- 閘道重設回應不再於回傳項目中合成對話記錄定位器。
  重設會建立 SQLite 對話記錄資料列、回傳乾淨的
  工作階段項目，並將對話記錄存取交由可感知範圍的讀取器處理。
- 嵌入式執行與壓縮結果不再為
  工作階段計量公開對話記錄定位器。自動壓縮只會更新作用中的 `sessionId`、
  壓縮計數器與權杖中繼資料。
- 嵌入式嘗試結果不再回傳 `transcriptLocatorUsed`，且
  內容引擎 `compact()` 結果不再回傳對話記錄定位器。
  執行階段重試迴圈只接受後繼 `sessionId`。
- 傳送鏡像對話記錄附加結果不再回傳對話記錄
  定位器。呼叫端會取得已附加的 `messageId`；對話記錄更新訊號使用
  SQLite 範圍。
- 父工作階段分支輔助程式只回傳分支後的 `sessionId`。子代理程式
  預備程序會將子代理程式／工作階段範圍傳給引擎。
- 命令列介面執行器參數與歷程重新植入不再接受對話記錄定位器。
  命令列介面歷程讀取會從 `{agentId,
sessionId}` 與工作階段金鑰內容解析 SQLite 對話記錄範圍。
- 命令列介面與嵌入式執行器測試固定資料現在會依工作階段 ID 植入及讀取 SQLite 對話記錄資料列，
  而非假裝作用中工作階段是 `*.jsonl` 檔案，或
  透過執行階段參數傳遞 `sqlite-transcript://...` 字串。
- 工作階段工具結果防護事件會從已知工作階段範圍發出，即使
  記憶體內管理員沒有衍生的定位器。其測試不再偽造作用中的
  `/tmp/*.jsonl` 對話記錄檔案。
- BTW 與壓縮檢查點輔助程式現在會依
  SQLite 範圍讀取及分支對話記錄資料列。檢查點中繼資料現在只儲存工作階段 ID 與葉節點／項目 ID；
  衍生定位器不再寫入檢查點承載資料。
- 閘道對話記錄金鑰查詢會在通訊協定
  邊界使用 SQLite 對話記錄範圍，且不再解析對話記錄檔名的實際路徑或取得其狀態。
- 自動壓縮對話記錄輪替會直接透過
  SQLite 對話記錄儲存區寫入後繼對話記錄資料列。工作階段資料列只保留
  後繼工作階段身分，而非永久 JSONL 路徑或持久化定位器。
- 嵌入式內容引擎壓縮使用以 SQLite 命名的對話記錄輪替
  輔助程式。輪替測試不再建構 JSONL 後繼路徑，或
  將作用中工作階段模型化為檔案。
- 受管理的外送影像保留會從
  SQLite 對話記錄統計資料產生其對話記錄訊息快取的金鑰，而非呼叫檔案系統狀態查詢。
- 執行階段工作階段鎖定與獨立的舊版 `.jsonl.lock` Doctor
  路徑已移除。
- Microsoft Teams 執行階段匯出模組與公開外掛 SDK 不再重新匯出
  舊有的檔案鎖定輔助程式；永久外掛狀態路徑由 SQLite 支援。
- 工作階段依存續時間／數量修剪與明確的工作階段清理已移除。
  Doctor 負責舊版匯入；過時工作階段會被明確重設或刪除。
- Doctor 完整性檢查不再將舊版 JSONL 檔案視為 SQLite 工作階段資料列的有效作用中
  對話記錄。作用中對話記錄健康狀態只以 SQLite 為準；
  舊版 JSONL 檔案會回報為遷移／孤立項目清理的輸入。
- Doctor 不再將 `agents/<agent>/sessions/` 視為必要的執行階段
  狀態。只有當該目錄已存在時，才會將其掃描為舊版匯入
  或孤立項目清理輸入。
- 閘道 `sessions.resolve`、工作階段修補／重設／壓縮路徑、子代理程式
  產生、快速中止、ACP 中繼資料、心跳偵測隔離工作階段及終端介面
  修補，不再將遷移或修剪舊版工作階段金鑰作為
  一般執行階段工作的副作用。
- 命令列介面命令工作階段解析現在會回傳所屬的 `agentId`，而非
  `storePath`，且在一般
  `--to` 或 `--session-id` 解析期間不再複製舊版主要工作階段資料列。舊版主要資料列正規化只屬於
  Doctor。
- 執行階段子代理程式深度解析不再讀取 `sessions.json` 或 JSON5
  工作階段儲存區。它會依代理程式 ID 讀取 SQLite `session_entries`，而舊版
  深度／工作階段中繼資料只能透過 Doctor 匯入路徑進入。
- 驗證設定檔工作階段覆寫會透過直接的 `{agentId, sessionKey}`
  資料列 upsert 持久保存，而非延遲載入檔案形式的工作階段儲存區執行階段。
- 自動回覆詳細輸出閘控與工作階段更新輔助程式現在會依工作階段身分讀取／upsert SQLite
  工作階段資料列，且在存取持久化資料列狀態前
  不再需要舊版儲存區路徑。
- 命令執行工作階段中繼資料輔助程式現在使用以項目為導向的名稱與模組
  路徑；舊有的 `session-store` 命令輔助程式介面已移除。
- 啟動載入標頭植入與手動壓縮邊界強化現在會直接變更
  SQLite 對話記錄資料列。執行階段呼叫端傳遞工作階段身分，而非
  可寫入的 `.jsonl` 路徑。
- 靜默工作階段輪替重播會從 SQLite 對話記錄資料列依
  `{agentId, sessionId}` 複製最近的使用者／助理對話輪次。它不再接受
  來源或目標對話記錄定位器。
- 新的執行階段工作階段資料列不再儲存對話記錄定位器。呼叫端會直接使用
  `{agentId, sessionId}`；匯出／偵錯命令可在具現化資料列時選擇輸出檔案
  名稱。
- 啟動新的持久化對話記錄工作階段時，現在一律會依
  範圍開啟 SQLite 資料列。工作階段管理員不再重複使用先前檔案時代的對話記錄
  路徑或定位器，作為新工作階段的身分。
- 持久化對話記錄工作階段會使用明確的
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API。舊有的
  靜態 `SessionManager.create/openForSession/list/forkFromSession` 外觀介面已
  移除，因此測試與執行階段程式碼不會意外重新建立檔案時代的工作階段
  探索。
- 外掛執行階段不再公開 `api.runtime.agent.session.resolveTranscriptLocatorPath`；
  外掛程式碼會使用 SQLite 資料列輔助程式與範圍值。
- 公開的 `session-store-runtime` SDK 介面現在只匯出工作階段資料列
  與對話記錄資料列輔助程式。專用的 SQLite 結構描述／路徑／交易輔助程式
  位於 `sqlite-runtime`；原始開啟／關閉／重設輔助程式仍僅供內部
  第一方測試使用。
- 舊版 `.jsonl` 軌跡／檢查點檔名分類器現在位於
  Doctor 舊版工作階段檔案模組中。核心工作階段驗證不再匯入
  檔案成品輔助程式，以判斷一般 SQLite 工作階段 ID。
- 主動記憶封鎖式子代理程式執行會使用 SQLite 對話記錄資料列，而非
  在外掛狀態下建立暫時或持久化的 `session.jsonl` 檔案。舊有的
  `transcriptDir` 選項已移除。
- 一次性短代稱產生與 Crestodian 規劃器執行會使用 SQLite 對話記錄資料列，
  而非建立暫時的 `session.jsonl` 檔案。
- `llm-task` 輔助程式執行與隱藏承諾擷取也會使用 SQLite
  對話記錄資料列，因此這些僅供模型使用的輔助工作階段不再建立
  暫時 JSON／JSONL 對話記錄檔案。
- `TranscriptSessionManager` 現在只代表已開啟的 SQLite 對話記錄範圍。
  執行階段程式碼會使用 `openTranscriptSessionManagerForSession({agentId,
sessionId})` 開啟它；建立、分支、繼續、列出與分支複製流程位於各自所屬的
  SQLite 資料列輔助程式，而非靜態管理員外觀介面。
  Doctor／匯入／偵錯程式碼會在執行階段工作階段管理員之外處理明確的舊版來源檔案。
- 過時的 `SessionManager.newSession()` 與
  `SessionManager.createBranchedSession()` 外觀介面方法已移除。新
  工作階段與對話記錄後代會由其所屬的 SQLite
  工作流程建立，而非將已開啟的管理員變更為不同的
  持久化工作階段。
- 父對話記錄分支決策與分支建立不再接受
  `storePath` 或 `sessionsDir`；它們使用 `{agentId, sessionId}` SQLite
  對話記錄範圍，而非保留的檔案系統路徑中繼資料。
- 記憶體主機不再匯出無作用的工作階段目錄對話記錄
  分類輔助程式；對話記錄篩選現在會在建構項目期間從 SQLite 資料列
  中繼資料衍生。
- 記憶體主機與 QMD 工作階段匯出測試使用 SQLite 對話記錄範圍。舊有的
  `agents/<agentId>/sessions/*.jsonl` 路徑只會保留在刻意驗證 Doctor／匯入／匯出相容性的
  測試中。
- QA-lab 原始工作階段檢查現在透過閘道使用 `sessions.list`，而非讀取 `agents/qa/sessions/sessions.json`；MSteams 意見回饋會直接附加至 SQLite 逐字記錄，不會虛構 JSONL 路徑。
- 共用的傳入頻道回合現在會攜帶 `{agentId, sessionKey}`，而非舊版 `storePath`。LINE、WhatsApp、Slack、Discord、Telegram、Matrix、Signal、iMessage、BlueBubbles、Feishu、Google Chat、IRC、Nextcloud Talk、Zalo、Zalo Personal、QA Channel、Microsoft Teams、Mattermost、Synology Chat、Tlon、Twitch 和 QQ Bot 的記錄路徑現在會讀取 updated-at 中繼資料，並透過 SQLite 身分識別記錄傳入工作階段資料列。
- 已從作用中工作階段資料列移除逐字記錄定位器的持久化。`resolveSessionTranscriptTarget` 會傳回 `agentId`、`sessionId` 和選用的主題中繼資料；doctor 是唯一會匯入舊版逐字記錄檔名的程式碼。
- 執行階段逐字記錄標頭從 SQLite 版本 `1` 開始。舊 JSONL V1/V2/V3 格式的升級僅存在於 doctor 匯入中，並會在儲存資料列前，將匯入的標頭正規化為目前的 SQLite 逐字記錄版本。
- 資料庫優先防護現在禁止 `SessionManager.listAll` 和 `SessionManager.forkFromSession`；工作階段列出及分支／還原工作流程必須維持使用資料列／範圍限定的 SQLite API。
- 此防護也會在 doctor／匯入程式碼之外禁止舊版逐字記錄 JSONL 剖析／作用中分支修復輔助函式名稱，使執行階段無法衍生第二條舊版逐字記錄遷移路徑。
- 內嵌 PI 執行會拒絕傳入的逐字記錄控制代碼。它們會在啟動工作程序前，以及嘗試存取逐字記錄狀態前，再次使用 SQLite `{agentId, sessionId}` 身分識別。過期的 `/tmp/*.jsonl` 輸入無法選取執行階段寫入目標。
- 快取追蹤、Anthropic 承載資料、原始串流和診斷時間軸記錄現在會寫入具型別的 SQLite `diagnostic_events` 資料列。閘道穩定性套件現在會寫入具型別的 SQLite `diagnostic_stability_bundles` 資料列。舊有的 `diagnostics.cacheTrace.filePath`、`OPENCLAW_CACHE_TRACE_FILE`、`OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` 和 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL 覆寫路徑已移除，一般穩定性擷取也不再寫入 `logs/stability/*.json` 檔案。
- 排程持久化現在會協調 SQLite `cron_jobs` 資料列，而非每次儲存時刪除並重新插入整個工作資料表。外掛目標回寫會直接更新相符的排程資料列，並在同一個狀態資料庫交易中維護執行階段排程狀態。
- 排程執行階段呼叫端現在使用穩定的 SQLite 排程儲存區索引鍵。舊版 `cron.store` 路徑僅作為 doctor 匯入輸入；正式環境閘道、任務維護、狀態、執行記錄和 Telegram 目標回寫路徑會使用 `resolveCronStoreKey`，且不再對索引鍵進行路徑正規化。排程狀態現在回報 `storeKey`，而非舊有檔案形式的 `storePath` 欄位。
- 排程執行階段載入和排程不再正規化舊版持久化工作格式，例如 `jobId`、`schedule.cron`、數值型 `atMs`、字串布林值或缺少 `sessionTarget`。doctor 舊版匯入會在資料列插入 SQLite 前負責這些修復。
- ACP 衍生不再解析或持久化逐字記錄 JSONL 檔案路徑。衍生和執行緒繫結設定會直接持久化 SQLite 工作階段資料列，並保留工作階段 ID 作為逐字記錄身分識別。
- ACP 工作階段中繼資料 API 現在會依 `agentId` 讀取／列出／新增或更新 SQLite 資料列，且不再將 `storePath` 公開為 ACP 工作階段項目合約的一部分。
- 工作階段用量計算和閘道用量彙總現在僅依 `{agentId, sessionId}` 解析逐字記錄。成本／用量快取和探索到的工作階段摘要不再合成或傳回逐字記錄定位器字串。
- 閘道聊天附加、中止部分內容持久化、`/sessions.send` 和網路聊天媒體逐字記錄寫入，現在會直接透過 SQLite 逐字記錄範圍附加。閘道逐字記錄注入輔助函式不再接受 `transcriptLocator` 參數。
- SQLite 逐字記錄探索現在僅列出逐字記錄範圍和統計資料：`{agentId, sessionId, updatedAt, eventCount}`。已移除無效的 `listSqliteSessionTranscriptLocators` 相容性輔助函式和每列的 `locator` 欄位。
- 逐字記錄修復執行階段現在僅公開 `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`。舊有以定位器為基礎的修復輔助函式已刪除；doctor／偵錯程式碼會讀取明確的來源檔案路徑，且絕不遷移定位器字串。
- ACP 重播帳本執行階段現在會將每個工作階段的重播資料列儲存在共用 SQLite 狀態資料庫中，而非 `acp/event-ledger.json`；doctor 會匯入並移除舊版檔案。
- 閘道逐字記錄讀取器輔助函式現在位於 `src/gateway/session-transcript-readers.ts`，而非舊有的 `session-utils.fs` 模組名稱。後備重試歷程檢查現在以 SQLite 逐字記錄內容命名，而非舊有檔案輔助函式介面。
- 閘道注入聊天和壓縮輔助函式現在會透過內部輔助函式 API 傳遞 SQLite 逐字記錄範圍，而非將值命名為逐字記錄路徑或來源檔案。
- 啟動程序接續偵測現在透過 `hasCompletedBootstrapTranscriptTurn` 檢查 SQLite 逐字記錄資料列；它不再公開檔案形式的輔助函式名稱。
- 內嵌執行器測試現在使用 SQLite 逐字記錄身分識別，而開啟新的逐字記錄管理器一律需要明確的 `sessionId`。
- 記憶索引輔助函式現在端對端使用 SQLite 逐字記錄術語：主機匯出 `listSessionTranscriptScopesForAgent` 和 `sessionTranscriptKeyForScope`，定向同步佇列使用 `sessionTranscripts`，公開工作階段搜尋命中項目會公開不透明的 `transcript:<agent>:<session>` 路徑，而內部資料庫來源索引鍵在 `source_kind='sessions'` 下是 `session:<session>`，而非虛假的檔案路徑。
- 通用外掛 SDK 持久化去重輔助函式不再公開檔案形式的選項。呼叫端會提供 SQLite 範圍索引鍵，而持久化去重資料列位於共用外掛狀態中。
- Microsoft Teams SSO 權杖已從鎖定的 JSON 檔案移至 SQLite 外掛狀態。doctor 會匯入 `msteams-sso-tokens.json`、從承載資料重建標準 SSO 權杖索引鍵，並移除來源檔案。委派的 OAuth 權杖仍維持在其現有的私有認證資訊檔案邊界。
- Matrix 同步快取狀態已從 `bot-storage.json` 移至 SQLite 外掛狀態。doctor 會匯入舊版原始或包裝過的同步承載資料，並移除來源檔案。作用中的 Matrix 和 QA Matrix 用戶端會傳遞 SQLite 同步儲存區根目錄，而非虛假的 `sync-store.json` 或 `bot-storage.json` 路徑。
- Matrix 舊版加密遷移狀態已從 `legacy-crypto-migration.json` 移至 SQLite 外掛狀態。doctor 會匯入舊狀態檔案；Matrix SDK IndexedDB 快照已從 `crypto-idb-snapshot.json` 移至 SQLite 外掛二進位大型物件。Matrix 復原金鑰和認證資訊是 SQLite 外掛狀態資料列；其舊 JSON 檔案僅作為 doctor 遷移輸入。
- Memory Wiki 活動記錄現在使用 SQLite 外掛狀態，而非 `.openclaw-wiki/log.jsonl`。Memory Wiki 遷移提供者會匯入舊 JSONL 記錄；Wiki Markdown 和使用者保存庫內容仍作為工作區內容，以檔案為後端。
- Memory Wiki 不再建立 `.openclaw-wiki/state.json` 或未使用的 `.openclaw-wiki/locks` 目錄。如果較舊的保存庫仍包含這些已停用的外掛中繼資料檔案，遷移提供者會將其移除。
- Crestodian 稽核項目現在使用核心 SQLite 外掛狀態，而非 `audit/crestodian.jsonl`。doctor 會匯入舊版 JSONL 稽核記錄，並在成功匯入後將其移除。
- 設定寫入／觀察稽核項目現在使用核心 SQLite 外掛狀態，而非 `logs/config-audit.jsonl`。doctor 會匯入舊版 JSONL 稽核記錄，並在成功匯入後將其移除。
- macOS 輔助應用程式在編輯 `openclaw.json` 時，不再寫入應用程式本機的 `logs/config-audit.jsonl` 或 `logs/config-health.json` 附屬檔案。設定檔仍以檔案為後端，復原快照仍位於設定檔旁，而持久化設定稽核／健康狀態則屬於閘道 SQLite 儲存區。
- Crestodian 救援待核准項目現在使用核心 SQLite 外掛狀態，而非 `crestodian/rescue-pending/*.json`。doctor 會匯入舊版待核准檔案，並在成功匯入後將其移除。
- Phone Control 暫時啟用狀態現在使用 SQLite 外掛狀態，而非 `plugins/phone-control/armed.json`。doctor 會將舊版啟用狀態檔案匯入 `phone-control/arm-state` 命名空間，並移除該檔案。
- doctor 不再就地修復 JSONL 逐字記錄或建立備份 JSONL 檔案。它會將作用中分支匯入 SQLite，並移除舊版來源。
- 工作階段記憶掛鉤的逐字記錄查詢，會使用僅限 `{agentId, sessionId}` 範圍的 SQLite 讀取。其輔助函式不再接受或衍生逐字記錄定位器、舊版檔案讀取或檔案重寫選項。
- Codex 應用程式伺服器對話繫結現在會依 OpenClaw 工作階段索引鍵或明確的 `{agentId, sessionId}` 範圍，為 SQLite 外掛狀態建立索引鍵。它們不得保留逐字記錄路徑後備繫結。
- Codex 應用程式伺服器的鏡像歷程讀取僅使用 SQLite 逐字記錄範圍；它們不得從逐字記錄檔案路徑復原身分識別。
- 角色排序和壓縮重設路徑不再取消連結舊逐字記錄檔案；重設只會輪替 SQLite 工作階段資料列和逐字記錄身分識別。
- 閘道重設和檢查點回應會傳回乾淨的工作階段資料列及工作階段 ID。它們不再為用戶端合成 SQLite 逐字記錄定位器。
- memory-core 夢境整理不再透過探測缺少的 JSONL 檔案來修剪工作階段資料列。子代理程式清理會透過工作階段執行階段 API 進行，而非檔案系統存在性檢查。其逐字記錄擷取測試會直接植入 SQLite 資料列，而非建立 `agents/<id>/sessions` 測試資料或定位器預留位置。
- 記憶逐字記錄索引可將 `transcript:<agentId>:<sessionId>` 公開為供引用／讀取輔助函式使用的虛擬搜尋命中路徑。持久化索引來源是關聯式資料（`source_kind='sessions'`、`source_key='session:<sessionId>'`、`session_id=<sessionId>`），因此該值不是執行階段逐字記錄定位器、不是檔案系統路徑，且絕不可傳回工作階段執行階段 API。
- 閘道 doctor 記憶狀態會從 SQLite 外掛狀態資料列讀取短期回想和階段訊號計數，而非 `memory/.dreams/*.json`；命令列介面和 doctor 輸出現在會將該儲存體標示為 SQLite 儲存區，而非路徑。
- memory-core 執行階段、命令列介面狀態、閘道 doctor 方法和外掛 SDK Facade 不再稽核或封存舊版 `.dreams/session-corpus` 檔案。這些檔案僅作為遷移輸入；doctor 會將其匯入 SQLite，並在驗證後刪除來源。作用中工作階段擷取證據資料列現在使用虛擬 SQLite 路徑 `memory/session-ingestion/<day>.txt`；執行階段絕不寫入 `.dreams/session-corpus`，也不從中衍生狀態。
- memory-core 公開成品會將 SQLite 主機事件公開為虛擬 JSON 成品 `memory/events/memory-host-events.json`；它們不再重複使用舊版 `.dreams/events.jsonl` 來源路徑。
- 沙箱容器／瀏覽器登錄現在使用共用的 `sandbox_registry_entries` SQLite 資料表，包含具型別的工作階段、映像、時間戳記、後端／設定和瀏覽器連接埠欄位。doctor 會匯入舊版單體和分片 JSON 登錄檔案，並移除成功匯入的來源。執行階段讀取會將具型別的資料列欄位作為單一真實來源；`entry_json` 僅作為重播／偵錯副本。
- 承諾事項現在使用具型別的共用 `commitments` 資料表，而非整個儲存區的 JSON 二進位大型物件。快照儲存會依承諾事項 ID 新增或更新，且僅刪除缺少的資料列，而非清除並重新插入資料表。執行階段會從具型別的範圍、交付時段、狀態、嘗試和文字欄位載入承諾事項；`record_json` 僅作為重播／偵錯副本。doctor 會匯入舊版 `commitments.json`，並在成功匯入後將其移除。
- 排程工作定義、排程狀態和執行歷程不再具有執行階段
  JSON 寫入器或讀取器。執行階段使用 `cron_jobs` 資料列，其中包含具型別的排程、
  承載資料、傳遞、失敗警示、工作階段、狀態及執行階段狀態欄位，另以具型別的
  `cron_run_logs` 中繼資料記錄狀態、診斷摘要、傳遞狀態／錯誤、
  工作階段／執行、模型及權杖總數。`job_json` 僅是重播／偵錯副本；`state_json` 保留
  尚無熱門查詢欄位的巢狀執行階段診斷，而執行階段會從具型別欄位
  重新載入熱門狀態欄位。Doctor 會匯入舊版
  `jobs.json`、`jobs-state.json` 及 `runs/*.jsonl` 檔案，並移除
  已匯入的來源。外掛目標回寫會更新相符的 `cron_jobs`
  資料列，而不是載入並取代整個排程儲存區。
- 閘道啟動時會忽略執行階段投影中的舊版 `notify: true` 標記。
  當 `cron.webhook` 有效時，Doctor 會將其轉換為明確的 SQLite 傳遞；
  未設定時會移除無作用的標記；已設定的網路鉤子無效時則會
  保留標記並發出警告。
- 外送與工作階段傳遞佇列現在會在共用
  `delivery_queue_entries` 資料表中，以具型別欄位儲存佇列狀態、項目種類、
  工作階段金鑰、頻道、目標、帳號 ID、重試次數、上次嘗試／錯誤、
  復原狀態及平台傳送標記。執行階段復原會從
  具型別欄位讀取這些熱門欄位，而重試／復原變更會直接更新這些欄位，
  不會重寫重播 JSON。完整 JSON 承載資料僅保留為
  訊息本文及其他冷門重播資料的重播／偵錯 Blob。
- 受管理的外送圖片記錄現在使用具型別的共用
  `managed_outgoing_image_records` 資料列，而媒體位元組仍儲存在
  `media_blobs` 中。JSON 記錄僅保留為重播／偵錯副本。
- Discord 模型選擇器偏好設定、命令部署雜湊及討論串繫結
  現在使用共用 SQLite 外掛狀態。其舊版 JSON 匯入計畫位於
  Discord 外掛的設定／Doctor 遷移介面，而非核心遷移程式碼。
- 外掛舊版匯入偵測器使用以 Doctor 命名的模組，例如
  `doctor-legacy-state.ts` 或 `doctor-state-imports.ts`；一般頻道執行階段
  模組不得匯入舊版 JSON 偵測器。
- BlueBubbles 追補游標及輸入去重標記現在使用共用 SQLite
  外掛狀態。其舊版 JSON 匯入計畫位於 BlueBubbles 外掛的
  設定／Doctor 遷移介面，而非核心遷移程式碼。
- Telegram 更新偏移量、貼圖快取資料列、已傳送訊息快取資料列、
  主題名稱快取資料列及討論串繫結現在使用共用 SQLite 外掛
  狀態。其舊版 JSON 匯入計畫位於 Telegram 外掛的
  設定／Doctor 遷移介面，而非核心遷移程式碼。
- iMessage 追補游標、回覆短 ID 對應及已傳送回聲去重資料列
  現在使用共用 SQLite 外掛狀態。舊有的 `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl` 及 `imessage/sent-echoes.jsonl` 檔案
  僅作為 Doctor 輸入。
- Feishu 訊息去重資料列現在改用核心可宣告式去重
  （共用 SQLite 外掛狀態中的 `feishu.dedup.*` 命名空間），不再使用
  `feishu/dedup/*.json` 檔案或已淘汰的手刻 `dedup.*` 儲存區；由於
  防重播快取會在升級後重建，因此不進行舊版匯入。
- Microsoft Teams 對話、投票、待處理上傳緩衝區及意見回饋
  學習資料現在使用共用 SQLite 外掛狀態／Blob 資料表。待處理上傳
  路徑使用 `plugin_blob_entries`，因此媒體緩衝區會儲存為 SQLite BLOB，
  而不是 base64 JSON。執行階段輔助程式名稱現在採用 SQLite／狀態命名，
  不再使用 `*-fs` 檔案儲存區命名，且舊有的 `storePath` 相容層已從
  這些儲存區移除。其舊版 JSON 匯入計畫位於 Microsoft Teams
  外掛的設定／Doctor 遷移介面。
- Zalo 託管的外送媒體現在使用共用 SQLite `plugin_blob_entries`，
  不再使用 `openclaw-zalo-outbound-media` JSON／bin 暫存附屬檔案。
- 差異檢視器的 HTML 與中繼資料現在使用共用 SQLite `plugin_blob_entries`，
  不再使用 `meta.json`／`viewer.html` 暫存檔案。算繪出的 PNG／PDF 輸出仍是
  暫時具現化檔案，因為頻道傳遞仍需要檔案路徑。
- Canvas 受管理文件現在使用共用 SQLite `plugin_blob_entries`，
  不再使用預設的 `state/canvas/documents` 目錄。Canvas 主機會直接提供這些
  Blob；僅在明確指定 `host.root` 的操作員內容，或下游媒體讀取器
  需要路徑而進行暫時具現化時，才會建立本機檔案。
- File Transfer 稽核決策現在使用共用 SQLite `plugin_state_entries`，
  不再使用無界限的 `audit/file-transfer.jsonl` 執行階段記錄。Doctor
  會將舊版 JSONL 稽核檔案匯入外掛狀態，並在乾淨匯入後移除來源。
- ACPX 處理程序租約及閘道執行個體身分現在使用共用 SQLite 外掛
  狀態。Doctor 會將舊版 `gateway-instance-id` 檔案匯入外掛狀態，
  並移除來源。
- ACPX 產生的包裝函式指令碼及隔離的 Codex 主目錄是 OpenClaw 暫存根目錄下的
  暫時具現化內容，而非持久的 OpenClaw 狀態。持久的 ACPX 執行階段記錄
  是 SQLite 租約及閘道執行個體資料列；舊有的 ACPX `stateDir` 設定介面已移除，
  因為不再有執行階段狀態寫入該處。
- 閘道媒體附件現在使用共用 `media_blobs` SQLite 資料表作為
  標準位元組儲存區。傳回給頻道及沙箱相容性介面的本機路徑
  是資料庫資料列的暫時具現化內容，而非持久媒體
  儲存區。執行階段媒體允許清單不再包含舊版
  `$OPENCLAW_STATE_DIR/media` 或設定目錄的 `media` 根目錄；這些目錄僅是
  Doctor 匯入來源。
- Shell 自動完成不再寫入 `$OPENCLAW_STATE_DIR/completions/*` 快取
  檔案。安裝、Doctor、更新及發布煙霧測試路徑會使用產生的
  自動完成輸出或設定檔載入，而不是持久的自動完成快取
  檔案。
- 閘道 Skills 上傳暫存現在使用共用 `skill_uploads` 資料列。上傳
  中繼資料、冪等金鑰及封存位元組皆存放在 SQLite 中；安裝程式
  僅會在安裝執行期間收到暫時具現化的封存檔路徑。
- 子代理程式內嵌附件不再具現化至工作區
  `.openclaw/attachments/*` 下。產生路徑會準備 SQLite VFS 種子項目，
  內嵌執行會將這些項目植入每個代理程式的執行階段暫存命名空間，
  而以磁碟為後端的工具會將該 SQLite 暫存區疊加至附件路徑。舊有的
  子代理程式執行附件目錄登錄欄位及清理掛鉤已移除。
- 命令列介面圖片載入不再維護穩定的 `openclaw-cli-images` 快取
  檔案。外部命令列介面後端仍會收到檔案路徑，但這些路徑是
  每次執行的暫時具現化內容，並會清理。
- 快取追蹤診斷、Anthropic 承載資料診斷、原始模型串流
  診斷、診斷時間軸事件及閘道穩定性套件現在會
  寫入 SQLite 資料列，而不是 `logs/*.jsonl` 或
  `logs/stability/*.json` 檔案。
  執行階段路徑覆寫旗標及環境變數已移除；匯出／偵錯
  命令可明確地從資料庫資料列具現化檔案。
- macOS 隨附應用程式不再具有輪替式 `diagnostics.jsonl` 寫入器。應用程式
  記錄會送往統一記錄系統，而持久的閘道診斷仍以 SQLite 為後端。
- macOS 連接埠守護程式記錄清單現在使用具型別的共用 SQLite
  `macos_port_guardian_records` 資料列，不再使用 Application Support JSON 檔案
  或不透明的單例 Blob。
- 閘道單例鎖現在使用 `gateway_locks` 範圍下具型別的共用 SQLite
  `state_leases` 資料列，不再使用暫存目錄鎖定檔案。Fly 與 OAuth
  疑難排解文件現在會指向 SQLite 租約／驗證重新整理鎖，
  而不是過時的檔案鎖清理。
- 閘道重新啟動哨兵狀態現在使用具型別的共用 SQLite
  `gateway_restart_sentinel` 資料列，不再使用 `restart-sentinel.json`；執行階段
  會從具型別欄位讀取哨兵種類、狀態、路由、訊息、接續內容及統計資料。
  `payload_json` 僅是重播／偵錯副本。執行階段程式碼會直接清除
  SQLite 資料列，且不再攜帶檔案清理管線。
- 閘道重新啟動意圖及監督程式交接狀態現在使用具型別的共用
  SQLite `gateway_restart_intent` 及 `gateway_restart_handoff` 資料列，不再使用
  `gateway-restart-intent.json` 及
  `gateway-supervisor-restart-handoff.json` 附屬檔案。
- 閘道單例協調現在使用 `gateway_locks` 下具型別的 `state_leases` 資料列，
  不再寫入 `gateway.<hash>.lock` 檔案。租約資料列持有鎖擁有者、
  到期時間、心跳偵測及偵錯承載資料；SQLite 負責原子式取得／釋放邊界。
  已淘汰的檔案鎖目錄選項已移除；測試會直接使用 SQLite 資料列身分。
- 舊有、未被參照且會掃描 `cron/runs/*.jsonl`
  檔案的排程用量報告輔助程式已刪除。排程執行歷程報告應讀取具型別的
  `cron_run_logs` SQLite 資料列。
- 主要工作階段重新啟動復原現在透過 SQLite `agent_databases` 登錄
  探索候選代理程式，而不是掃描 `agents/*/sessions`
  目錄。
- Gemini 工作階段損毀復原現在只會刪除 SQLite 工作階段資料列；
  不再需要舊版 `storePath` 閘門，也不會嘗試取消連結衍生的
  對話記錄 JSONL 路徑。
- 路徑覆寫處理現在會將字面值 `undefined`／`null` 環境
  值視為未設定，避免在測試或 Shell 交接期間意外於儲存庫根目錄建立
  `undefined/state/*.sqlite` 資料庫。
- 設定健康狀態指紋現在使用具型別的共用 SQLite `config_health_entries`
  資料列，不再使用 `logs/config-health.json`，讓一般設定檔成為
  唯一的非認證資訊設定文件。macOS 隨附應用程式僅保留
  處理程序本機健康狀態，且不會重新建立舊有的 JSON 附屬檔案。
- 驗證設定檔執行階段不再匯入或寫入認證資訊 JSON 檔案。
  標準認證資訊儲存區為 SQLite；`auth-profiles.json`、每個代理程式的
  `auth.json` 及共用的 `credentials/oauth.json` 都是 Doctor 遷移輸入，
  並會在匯入後移除。
- 驗證設定檔儲存／狀態測試現在會直接判定具型別的 SQLite 驗證資料表，
  且僅將舊版驗證設定檔檔名用於 Doctor 遷移輸入。
- `openclaw secrets apply` 僅會清除設定檔、環境檔案及 SQLite
  驗證設定檔儲存區。它不再包含編輯已淘汰之每個代理程式
  `auth.json` 的相容性邏輯；Doctor 負責匯入並刪除該檔案。
- Hermes 機密遷移會規劃並將匯入的 API 金鑰設定檔直接套用至
  SQLite 驗證設定檔儲存區。它不再將 `auth-profiles.json`
  寫入或驗證為中介目標。
- 面向使用者的驗證文件現在會說明
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`，而不是
  要求使用者檢查或複製 `auth-profiles.json`；舊版 OAuth／驗證 JSON
  名稱僅保留為 Doctor 匯入輸入的文件記載。
- 核心狀態路徑輔助程式不再公開已淘汰的 `credentials/oauth.json`
  檔案。舊版檔名僅存在於 Doctor 驗證匯入路徑中。
- 安裝、安全性、初始設定、模型驗證及 SecretRef 文件現在會說明
  SQLite 驗證設定檔資料列及整體狀態備份／遷移，而不是
  每個代理程式的驗證設定檔 JSON 檔案。
- PI 模型探索現在會將標準認證資訊傳遞至記憶體內的
  `pi-coding-agent` 驗證儲存區。探索期間不再建立、清除或寫入
  每個代理程式的 `auth.json`。
- Voice Wake 觸發與路由設定現在使用具型別的共用 SQLite 資料表，
  不再使用 `settings/voicewake.json`、`settings/voicewake-routing.json` 或
  不透明的通用資料列；Doctor 會匯入舊版 JSON 檔案，並在
  成功遷移後移除它們。
- 更新檢查狀態現在使用具型別的共用 `update_check_state` 資料列，
  不再使用 `update-check.json` 或不透明的通用 Blob；Doctor 會匯入
  舊版 JSON 檔案，並在成功遷移後移除它。
- 設定健康狀態現在使用具型別的共用 `config_health_entries` 資料列，
  不再使用 `logs/config-health.json` 或不透明的通用 Blob；Doctor
  會匯入舊版 JSON 檔案，並在成功遷移後移除它。
- 外掛對話繫結核准現在使用具型別的
  `plugin_binding_approvals` 資料列，而非不透明的共用 SQLite 狀態或
  `plugin-binding-approvals.json`；舊版檔案是 doctor 遷移輸入。
- 通用的目前對話繫結現在儲存具型別的
  `current_conversation_bindings` 資料列，而非重寫
  `bindings/current-conversations.json`；doctor 會匯入舊版 JSON 檔案，並在
  遷移成功後將其移除。
- Memory Wiki 匯入來源的同步帳本現在針對每個 vault/source 鍵儲存一筆 SQLite 外掛狀態資料列，
  而非重寫 `.openclaw-wiki/source-sync.json`；
  遷移提供者會匯入並移除舊版 JSON 帳本。
- Memory Wiki ChatGPT 匯入執行記錄現在針對每個 vault/run id 儲存一筆 SQLite 外掛狀態資料列，
  而非寫入 `.openclaw-wiki/import-runs/*.json`。
  在匯入執行快照的封存移至 blob 儲存空間之前，
  復原快照仍會保留為明確的 vault 檔案。
- Memory Wiki 編譯摘要現在儲存 SQLite 外掛 blob 資料列，而非
  寫入 `.openclaw-wiki/cache/agent-digest.json` 和
  `.openclaw-wiki/cache/claims.jsonl`。遷移提供者會匯入舊快取
  檔案，並在快取目錄變空時將其移除。
- ClawHub skill 安裝追蹤現在針對每個
  workspace/skill 儲存一筆 SQLite 外掛狀態資料列，而非在執行階段寫入或讀取 `.clawhub/lock.json` 和
  `.clawhub/origin.json` 輔助檔案。執行階段程式碼使用受追蹤安裝
  狀態物件，而非檔案形式的 lockfile/origin 抽象。Doctor
  會從已設定的代理工作區匯入舊版輔助檔案，並在完整匯入後
  將其移除。
- 已安裝外掛索引現在讀寫具型別的共用 SQLite
  `installed_plugin_index` 單例資料列，而非 `plugins/installs.json`；舊版
  JSON 檔案僅作為 doctor 遷移輸入，並在匯入後移除。
- 舊版 `plugins/installs.json` 路徑輔助程式現在位於 doctor 舊版
  程式碼中。執行階段外掛索引模組僅公開由 SQLite 支援的持久化
  選項，而非 JSON 檔案路徑。
- 閘道重新啟動哨兵、重新啟動意圖及監督程式交接狀態現在使用
  具型別的共用 SQLite 資料列（`gateway_restart_sentinel`、
  `gateway_restart_intent` 和 `gateway_restart_handoff`），而非通用的
  不透明 blob。執行階段重新啟動程式碼不再有檔案形式的哨兵／意圖／交接
  合約。
- Matrix 同步快取、儲存中繼資料、執行緒繫結、入站去重標記、
  啟動驗證冷卻狀態、SDK IndexedDB 加密快照、
  認證資訊及復原金鑰現在使用共用 SQLite 外掛狀態／blob
  資料表。執行階段路徑結構不再公開 `storage-meta.json` 中繼資料
  路徑；該檔名僅作為舊版遷移輸入。其舊版 JSON 匯入
  計畫位於 Matrix 外掛設定／doctor 遷移介面中。入站
  去重標記採用核心可宣告去重機制（共用狀態資料庫中的
  `matrix.inbound-dedupe.*` 命名空間）；Matrix doctor 狀態遷移會匯入
  已淘汰的每個根目錄 `inbound-dedupe` 資料列及 `inbound-dedupe.json` 一次，
  之後執行階段只會讀取可宣告去重儲存區。
- Matrix 啟動時不再掃描、回報或完成舊版 Matrix 檔案
  狀態。Matrix 檔案偵測、舊版加密快照建立、房間金鑰
  還原遷移狀態、匯入及來源移除現在全由 doctor 負責。
- Matrix 執行階段遷移匯出模組已移除。Matrix doctor 會直接匯入舊版狀態／加密偵測
  與變更輔助程式，而非將其納入
  執行階段 API 介面。
- Matrix 遷移快照重用標記現在位於 SQLite 外掛狀態中，
  而非 `matrix/migration-snapshot.json`；doctor 仍可重用同一個
  已驗證的遷移前封存，而不必寫入輔助狀態檔案。
- Nostr 匯流排游標及個人檔案發布狀態現在使用共用 SQLite 外掛
  狀態。其舊版 JSON 匯入計畫位於 Nostr 外掛設定／doctor
  遷移介面中。
- 主動記憶工作階段切換狀態現在使用共用 SQLite 外掛狀態，而非
  `session-toggles.json`；重新開啟記憶時會刪除該資料列，而非
  重寫 JSON 物件。
- Skill Workshop 提案及審查計數器現在使用共用 SQLite 外掛
  狀態，而非每個工作區的 `skill-workshop/<workspace>.json` 儲存區。每個
  提案都是 `skill-workshop/proposals` 下的獨立資料列，而審查
  計數器則是 `skill-workshop/reviews` 下的獨立資料列。
- Skill Workshop 審查者子代理執行現在使用執行階段工作階段逐字稿
  解析器，而非建立 `skill-workshop/<sessionId>.json` 輔助工作階段
  路徑。
- ACPX 程序租約現在使用 `acpx/process-leases` 下的共用 SQLite 外掛狀態，
  而非整個檔案形式的 `process-leases.json` 登錄。
  每個租約都儲存為獨立資料列，在不需要執行階段 JSON 重寫路徑的情況下，
  保留啟動時清除過期程序的能力。
- ACPX 包裝指令碼及隔離的 Codex 主目錄會在
  OpenClaw 暫存根目錄中產生。它們會視需要重新建立，且不是備份或
  遷移輸入。
- 子代理執行登錄持久化使用具型別的共用 `subagent_runs` 資料列。舊的
  `subagents/runs.json` 路徑現在僅作為 doctor 遷移輸入，而
  執行階段輔助程式名稱不再將狀態層描述為由磁碟支援。
  執行階段測試不再建立無效或空白的 `runs.json` 固定資料來驗證
  登錄行為；而是直接植入／讀取 SQLite 資料列。
- 備份會在封存前暫存狀態目錄、複製非資料庫檔案、
  使用 `VACUUM INTO` 建立資料庫快照、省略即時 WAL/SHM 輔助檔案、在
  封存資訊清單中記錄快照中繼資料，並將
  已完成的備份執行連同封存資訊清單記錄在 SQLite 中。`openclaw backup
create` 預設會驗證已寫入的封存；`--no-verify` 是
  明確的快速路徑。
- `openclaw backup restore` 會在解壓縮前驗證封存、重用
  驗證器正規化後的資訊清單，並將已驗證的資訊清單資產還原至其
  記錄的來源路徑。寫入時必須使用 `--yes`，並支援 `--dry-run`
  以取得還原計畫。
- 舊的備份易變路徑篩選器已刪除。由於 SQLite
  快照會在建立封存前完成暫存，備份不再需要針對舊版工作階段或排程 JSON/JSONL 檔案的
  即時 tar 略過清單。
- 一般設定及初始設定的工作區準備流程不再建立
  `agents/<agentId>/sessions/` 目錄。它們只會建立設定／工作區；
  SQLite 工作階段資料列及逐字稿資料列會在每個代理的
  資料庫中視需要建立。
- 安全性權限修復現在以全域及每個代理的 SQLite
  資料庫和 WAL/SHM 輔助檔案為目標，而非 `sessions.json` 和逐字稿
  JSONL 檔案。
- 沙箱登錄的執行階段名稱現在直接描述 SQLite 登錄種類，
  而非在作用中的儲存區中沿用舊版 JSON 登錄術語。
- `openclaw reset --scope config+creds+sessions` 會移除每個代理的
  `openclaw-agent.sqlite` 資料庫及 WAL/SHM 輔助檔案，而不只是舊版
  `sessions/` 目錄。
- 閘道彙總工作階段輔助程式現在使用以項目為導向的名稱：
  `loadCombinedSessionEntriesForGateway` 會回傳 `{ databasePath, entries }`。
  舊的組合儲存區命名已從執行階段呼叫端移除。
- Docker MCP 頻道植入現在會將主要工作階段資料列及逐字稿
  事件寫入每個代理的 SQLite 資料庫，而非建立
  `sessions.json` 和 JSONL 逐字稿。
- 內建的 session-memory hook 現在會依 `{agentId, sessionId}` 從
  SQLite 解析上一個工作階段的內容。它不再掃描、儲存或合成
  逐字稿路徑或 `workspace/sessions` 目錄。
- 內建的 command-logger hook 現在會將命令稽核資料列寫入共用
  SQLite `command_log_entries` 資料表，而非附加至
  `logs/commands.log`。
- 頻道配對允許清單現在於執行階段及外掛 SDK 中僅公開由 SQLite 支援的讀取／寫入輔助程式。
  舊的 `*-allowFrom.json` 路徑解析器及
  檔案讀取器只存在於 doctor 舊版匯入程式碼下。
- `migration_runs` 會記錄舊版狀態遷移執行及其狀態、
  時間戳記和 JSON 報告。
- `migration_sources` 會記錄每個已匯入的舊版檔案來源及其雜湊、大小、
  記錄數、目標資料表、執行 id、狀態和來源移除狀態。
- `backup_runs` 會記錄備份封存路徑、狀態及 JSON 資訊清單。
- 全域結構描述不會保留未使用的 `agents` 登錄資料表。在執行階段
  擁有真正的代理記錄負責者之前，代理資料庫探索是標準的 `agent_databases` 登錄。
- 產生的模型目錄設定會儲存在依代理目錄為索引鍵、具型別的全域 SQLite
  `agent_model_catalogs` 資料列中。執行階段呼叫端使用
  `ensureOpenClawModelCatalog`；執行階段程式碼中沒有 `models.json` 相容性 API。
  實作會寫入 SQLite，並從該儲存的承載資料填入內嵌 PI 登錄，
  而不會建立 `models.json` 檔案。
- QMD 工作階段逐字稿 Markdown 匯出及 `memory.qmd.sessions` 設定已
  移除。不再有 QMD 逐字稿集合、`qmd/sessions*` 執行階段
  路徑，亦無檔案式工作階段記憶橋接。
- memory-core 執行階段會從
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` 匯入 SQLite 逐字稿索引輔助程式，而非
  QMD SDK 子路徑。QMD 子路徑僅為
  外部呼叫端保留相容性重新匯出，直到主要 SDK 清理作業可將其移除。
- QMD 自身的 `index.sqlite` 現在是由主要 SQLite
  `plugin_blob_entries` 資料表支援的暫存執行階段實體化。執行階段不再建立持久的
  `~/.openclaw/agents/<agentId>/qmd` 輔助檔案。
- 選用的 `memory-lancedb` 外掛不再建立
  `~/.openclaw/memory/lancedb` 作為由 OpenClaw 隱含管理的儲存區。它是
  外部 LanceDB 後端，並會維持停用，直到操作者設定明確的
  `dbPath`。
- `check:database-first-legacy-stores` 會讓將
  舊版儲存區名稱與寫入型檔案系統 API 配對的新執行階段原始碼檢查失敗。它也會讓重新引入已淘汰逐字稿橋接標記
  `transcriptLocator` 或 `sqlite-transcript://...` 的執行階段
  原始碼檢查失敗。遷移、doctor、匯入及
  明確的非工作階段匯出程式碼仍允許使用。較廣泛的舊版合約
  名稱，例如 `sessionFile`、`storePath` 和舊的 `SessionManager` 檔案時代
  外觀介面，仍有目前的負責者，需要另行進行遷移防護工作，
  才能成為必要的前置檢查。此防護現在也涵蓋
  執行階段 `cache/*.json` 儲存區、通用
  `thread-bindings.json` 輔助檔案、排程狀態／執行記錄 JSON、設定健康狀態 JSON、
  重新啟動及鎖定輔助檔案、Voice Wake 設定、外掛繫結核准、
  已安裝外掛索引 JSON、File Transfer 稽核 JSONL、Memory Wiki 活動
  記錄、舊的內建 `command-logger` 文字記錄，以及 pi-mono 原始串流 JSONL
  診斷旋鈕。它也會禁止舊的根層級 doctor 舊版模組名稱，使
  相容性程式碼維持在 `src/commands/doctor/` 下。Android 偵錯處理常式
  也改用 logcat／記憶體內輸出，而非暫存 `camera_debug.log` 或
  `debug_logs.txt` 快取檔案。

## 目標結構形式

保持結構明確。主機擁有的執行階段狀態使用具型別的資料表。外掛擁有的
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
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
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

`memory_index_sources.id` 是穩定的整數主鍵；`(path, source)` 維持唯一。

未來可新增 FTS 資料表以支援搜尋，而不變更標準事件資料表：

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

大型值應使用 `blob` 欄位，而非 JSON 字串編碼。針對必須能以一般
SQLite 工具檢視的小型結構化資料，保留使用 `value_json`。

`agent_databases` 是此分支的標準登錄檔。在真正的代理程式記錄擁有者存在之前，請勿新增
`agents` 資料表；代理程式設定仍保留在
`openclaw.json` 中。

## Doctor 遷移形式

Doctor 應呼叫一個可回報且可安全地
重新執行的明確遷移步驟：

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` 會在一般設定預先檢查後叫用狀態遷移實作，
並在匯入前建立經驗證的備份。執行階段啟動程序和 `openclaw migrate`
不得匯入舊版 OpenClaw 狀態檔案。

遷移屬性：

- 單次遷移流程會探索所有舊版檔案來源，並在變更任何內容前產生計畫。
- Doctor 會在匯入舊版檔案前建立經驗證的遷移前備份封存。
- 匯入具冪等性，並以來源路徑、mtime、大小、雜湊和目標資料表作為鍵值。
- 目標資料庫提交後，成功處理的來源檔案會被移除或封存。
- 匯入失敗時會保留來源不變，並在 `migration_runs` 中記錄警告。
- 遷移存在後，執行階段程式碼僅讀取 SQLite。
- 不需要降級或匯出至執行階段檔案的路徑。

## 遷移清單

將以下項目移至全域資料庫：

- 任務登錄執行階段寫入現在使用共用資料庫；未發布的
  `tasks/runs.sqlite` 側車匯入器已刪除。快照儲存會依任務
  id 執行 upsert，且只刪除缺少的任務／遞送資料列。
- Task Flow 執行階段寫入現在使用共用資料庫；未發布的
  `tasks/flows/registry.sqlite` 側車匯入器已刪除。快照儲存會
  依流程 id 執行 upsert，且只刪除缺少的流程資料列。
- 外掛狀態執行階段寫入現在使用共用資料庫；未發布的
  `plugin-state/state.sqlite` 側車匯入器已刪除。
- 內建記憶搜尋不再預設使用 `memory/<agentId>.sqlite`；其
  索引資料表位於所屬的代理程式資料庫中，而明確選用的
  `memorySearch.store.path` 側車設定已退役，交由 doctor 設定
  遷移處理。
- 內建記憶重新建立索引時，只會重設代理程式資料庫中由記憶功能擁有的資料表。
  它不得取代整個 SQLite 檔案，因為同一個資料庫也擁有
  工作階段、逐字稿、VFS 資料列、成品，以及執行階段快取。
- 來自單體與分片 JSON 的沙箱容器／瀏覽器登錄。執行階段
  寫入現在使用共用資料庫；仍保留舊版 JSON 匯入。
- 排程工作定義、排程狀態與執行歷程現在使用共用 SQLite；
  doctor 會匯入／移除舊版 `jobs.json`、`jobs-state.json` 與
  `cron/runs/*.jsonl` 檔案
- 裝置身分／驗證、推播、更新檢查、承諾、OpenRouter 模型
  快取、已安裝外掛索引，以及應用程式伺服器繫結
- 裝置／節點配對與啟動記錄現在使用具型別的 SQLite 資料表
- 裝置配對通知訂閱者與已遞送要求標記，現在使用
  共用 SQLite 外掛狀態資料表，而非 `device-pair-notify.json`。
- 語音通話記錄現在使用共用 SQLite 外掛狀態資料表中的
  `voice-call`／`calls` 命名空間，而非 `calls.jsonl`；外掛命令列介面
  會追蹤並彙整由 SQLite 支援的通話歷程。
- QQ Bot 閘道工作階段、已知使用者記錄與參照索引引用快取現在使用
  `qqbot` 命名空間（`gateway-sessions`、
  `known-users`、`ref-index`）下的 SQLite 外掛狀態，而非 `session-*.json`、`known-users.json`
  與 `ref-index.jsonl`。這些舊版檔案屬於快取，不會遷移。
- Discord 模型選擇器偏好設定、命令部署雜湊與討論串繫結
  現在使用 `discord` 命名空間
  （`model-picker-preferences`、`command-deploy-hashes`、`thread-bindings`）
  下的 SQLite 外掛狀態，而非 `model-picker-preferences.json`、`command-deploy-cache.json` 與
  `thread-bindings.json`；Discord doctor／設定遷移會匯入並
  移除舊版檔案。
- BlueBubbles 追補游標與傳入資料去重標記現在使用
  `bluebubbles` 命名空間（`catchup-cursors`、`inbound-dedupe`）
  下的 SQLite 外掛狀態，而非 `bluebubbles/catchup/*.json` 與
  `bluebubbles/inbound-dedupe/*.json`；BlueBubbles doctor／設定遷移
  會匯入並移除舊版檔案。
- Telegram 更新位移、貼圖快取項目、回覆鏈訊息快取
  項目、已傳送訊息快取項目、主題名稱快取項目與討論串
  繫結，現在使用 `telegram` 命名空間
  （`update-offsets`、`sticker-cache`、`message-cache`、`sent-messages`、
  `topic-names`、`thread-bindings`）下的 SQLite 外掛狀態，而非 `update-offset-*.json`、
  `sticker-cache.json`、`*.telegram-messages.json`、
  `*.telegram-sent-messages.json`、`*.telegram-topic-names.json` 與
  `thread-bindings-*.json`；Telegram doctor／設定遷移會匯入並
  移除舊版檔案。
- iMessage 追補游標、回覆短 id 對應與已傳送回音去重資料列
  現在使用 `imessage` 命名空間（`catchup-cursors`、
  `reply-cache`、`sent-echoes`）下的 SQLite 外掛狀態，而非 `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl` 與 `imessage/sent-echoes.jsonl`；iMessage
  doctor／設定遷移會匯入並移除舊版檔案。
- Microsoft Teams 交談、投票、SSO 權杖與意見回饋學習資料現在
  使用 SQLite 外掛狀態命名空間（`conversations`、`polls`、`sso-tokens`、
  `feedback-learnings`），而非 `msteams-conversations.json`、
  `msteams-polls.json`、`msteams-sso-tokens.json` 與 `*.learnings.json`；Microsoft Teams
  doctor／設定遷移會匯入並封存舊版檔案。
  待上傳資料是短期 SQLite 快取，舊的 JSON 快取檔案
  不會遷移。
- Matrix 同步快取、儲存中繼資料、討論串繫結、傳入資料去重標記、
  啟動驗證冷卻狀態、認證資訊、復原金鑰與 SDK
  IndexedDB 加密快照，現在使用 `matrix` 下的 SQLite 外掛狀態／blob 命名空間
  （`sync-store`、`storage-meta`、`thread-bindings`、
  `matrix.inbound-dedupe.*`，透過核心可認領去重機制、
  `startup-verification`、`credentials`、`recovery-key`、`idb-snapshots`），
  而非 `bot-storage.json`、`storage-meta.json`、`thread-bindings.json`、
  `inbound-dedupe.json`、`startup-verification.json`、`credentials.json`、
  `recovery-key.json` 與 `crypto-idb-snapshot.json`；Matrix doctor／設定
  遷移會從帳號範圍的 Matrix 儲存根目錄匯入並移除這些舊版檔案
  （以及已退役、每個根目錄各自存在的 `inbound-dedupe` SQLite 資料列）。
- Nostr 匯流排游標與個人檔案發布狀態現在使用
  `nostr` 命名空間（`bus-state`、`profile-state`）下的 SQLite 外掛狀態，而非
  `bus-state-*.json` 與 `profile-state-*.json`；Nostr doctor／設定
  遷移會匯入並移除舊版檔案。
- 主動記憶工作階段切換設定現在使用
  `active-memory/session-toggles` 下的 SQLite 外掛狀態，而非 `session-toggles.json`。
- Skill Workshop 提案佇列與審查計數器現在使用
  `skill-workshop/proposals` 與 `skill-workshop/reviews` 下的 SQLite 外掛狀態，而非
  各工作區的 `skill-workshop/<workspace>.json` 檔案。
- 對外遞送與工作階段遞送佇列現在共用全域 SQLite
  `delivery_queue_entries` 資料表，並使用不同的佇列名稱
  （`outbound-delivery`、`session-delivery`），而非持久化的
  `delivery-queue/*.json`、`delivery-queue/failed/*.json` 與
  `session-delivery-queue/*.json` 檔案。doctor 的舊版狀態步驟會匯入
  待處理與失敗資料列、移除過期的已遞送標記，並在匯入後刪除舊的
  JSON 檔案。熱門路由與重試欄位是具型別的欄位；
  JSON 承載資料僅保留用於重播／除錯。
- ACPX 處理程序租約現在使用 `acpx/process-leases`
  下的 SQLite 外掛狀態，而非 `process-leases.json`。
- 備份與遷移執行中繼資料

將這些移入代理程式資料庫：

- 代理程式工作階段根目錄與相容性形狀的工作階段項目承載資料。執行階段寫入已完成：
  熱門工作階段中繼資料可在 `sessions` 中查詢，而
  舊版形狀的完整 `SessionEntry` 承載資料仍保留在 `session_entries` 中。
- 代理程式逐字稿事件。執行階段寫入已完成。
- 壓縮檢查點與逐字稿快照。執行階段寫入已完成：
  檢查點逐字稿副本是 SQLite 逐字稿資料列，而檢查點
  中繼資料記錄在 `transcript_snapshots` 中。閘道檢查點輔助函式
  現在將這些值稱為逐字稿快照，而非來源檔案。
- 代理程式 VFS 暫存／工作區命名空間。執行階段 VFS 寫入已完成。
- 子代理程式附件承載資料。執行階段寫入已完成：它們是 SQLite VFS
  種子項目，絕不會成為持久化工作區檔案。
- 工具成品。執行階段寫入已完成。
- 執行成品。工作者執行階段已透過每個代理程式的
  `run_artifacts` 資料表完成寫入。
- 代理程式本機執行階段快取。工作者執行階段範圍的快取已透過
  每個代理程式的 `cache_entries` 資料表完成寫入。閘道範圍的模型快取會保留在
  全域資料庫中，除非它們變成代理程式專屬。
- ACP 父串流日誌。執行階段寫入已完成。
- ACP 重播帳本工作階段。執行階段已透過
  `acp_replay_sessions` 與 `acp_replay_events` 完成寫入；舊版 `acp/event-ledger.json`
  僅保留作為 doctor 輸入。
- ACP 工作階段中繼資料。執行階段已透過 `acp_sessions` 完成寫入；`sessions.json`
  中舊版 `entry.acp` 區塊僅作為 doctor 遷移輸入。
- 非明確匯出檔案的軌跡側車檔案。執行階段寫入已完成：
  軌跡擷取會寫入代理程式資料庫的 `trajectory_runtime_events`
  資料列，並將執行範圍的成品鏡像至 SQLite。舊版側車檔案僅作為 doctor
  匯入輸入；匯出可以實體化新的 JSONL 支援套件輸出，
  但不會在執行階段讀取或遷移舊的軌跡／逐字稿側車檔案。
  執行階段軌跡擷取會公開 SQLite 範圍；JSONL 路徑輔助函式
  僅限於匯出／除錯支援，且不會從執行階段模組重新匯出。
  內嵌執行器軌跡中繼資料會記錄 `{agentId, sessionId, sessionKey}`
  身分，而非持久化逐字稿定位器。

目前這些仍以檔案為後端：

- `openclaw.json`
- 提供者或命令列介面的認證資訊檔案
- 外掛／套件資訊清單
- 選取磁碟模式時的使用者工作區與 Git 儲存庫
- 供操作人員持續追蹤的日誌，除非已移動特定日誌介面

## 遷移計畫

### 階段 0：凍結邊界

在移動更多資料列之前，先明確定義持久化狀態邊界：

- 在全域資料庫新增 `migration_runs` 資料表。
  舊版狀態遷移執行報告已完成。
- 新增單一由 doctor 擁有的狀態遷移服務，以執行檔案至資料庫的匯入。
  已完成：`openclaw doctor --fix` 使用舊版狀態遷移實作。
- 將 `plan` 設為唯讀，並讓 `apply` 建立備份、匯入、驗證，然後
  刪除或隔離舊檔案。
  已完成：doctor 會建立已驗證的遷移前備份、將備份路徑
  傳入 `migration_runs`，並重複使用匯入器／移除路徑。
- 新增靜態禁令，使新的執行階段程式碼無法寫入舊版狀態檔案，同時
  遷移程式碼與測試仍可植入／讀取這些檔案。
  目前已遷移的舊版儲存已完成；防護機制也會掃描巢狀
  測試，以尋找禁止使用的執行階段逐字稿定位器合約。

### 階段 1：完成全域控制平面

將共用協調狀態保留在 `state/openclaw.sqlite`：

- 代理程式與代理程式資料庫登錄
- 任務與 Task Flow 帳本
- 外掛狀態
- 沙箱容器／瀏覽器登錄
- 排程／排程器執行歷程
- 配對、裝置、推播、更新檢查、終端介面、OpenRouter／模型快取，以及其他
  小型閘道範圍執行階段狀態
- 備份與遷移中繼資料
- 閘道媒體附件位元組。執行階段寫入已完成；直接檔案路徑
  是暫時實體化項目，用於維持與頻道傳送器及沙箱
  暫存區的相容性。執行階段允許清單接受 SQLite 實體化路徑，而非舊版
  狀態／設定媒體根目錄。doctor 會將舊版媒體檔案匯入
  `media_blobs`，並在資料列成功寫入後移除來源檔案。
- 除錯 Proxy 擷取工作階段、事件與承載資料 blob。已完成：擷取資料位於
  共用狀態資料庫，並透過共用狀態資料庫的啟動程序、結構描述、
  WAL 與忙碌逾時設定開啟。承載資料位元組會以 gzip 壓縮並儲存在
  `capture_blobs.data`；沒有除錯 Proxy 執行階段側車資料庫覆寫、
  blob 目錄，或僅供 Proxy 擷取使用的產生式結構描述／程式碼產生目標。
  doctor／啟動遷移會匯入已發布的 `debug-proxy/capture.sqlite` 資料列
  與被參照的承載資料 blob，包括作用中的舊版資料庫／blob 環境
  覆寫，接著封存這些來源，同時保留 CA 憑證不變。

此階段也會從這些子系統中刪除重複的側車開啟器、權限輔助函式、WAL
設定、檔案系統清理與相容性寫入器。

### 階段 2：導入每個代理程式各自的資料庫

為每個代理程式建立一個資料庫，並從全域資料庫登錄：

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

全域 `agent_databases` 資料列會儲存路徑、結構描述版本、上次出現
時間戳記，以及基本的大小／完整性中繼資料。執行階段程式碼會向登錄要求
代理程式資料庫，而非直接衍生檔案路徑。

代理程式資料庫擁有：

- 以 `sessions` 作為標準工作階段根項目，`session_entries` 則作為附加至該根項目、具相容性形狀的承載資料表，而
  `session_routes` 則作為唯一的作用中 `session_key` 查詢
- 以 `conversations` 與 `session_conversations` 作為附加至工作階段的標準化提供者
  路由身分
- `transcript_events`
- 對話記錄快照與壓縮檢查點。執行階段寫入已完成。
- `vfs_entries`
- `tool_artifacts` 與執行成品
- 代理程式本機的執行階段／快取資料列。工作站範圍的快取已完成。
- ACP 父串流事件
- 非明確匯出成品的軌跡執行階段事件

### 階段 3：取代工作階段儲存區 API

執行階段已完成。檔案形狀的工作階段儲存區介面不再是作用中的
執行階段合約：

- 執行階段不再呼叫 `loadSessionStore(storePath)`，也不再將 `storePath` 視為
  工作階段身分。
- 執行階段資料列操作為 `getSessionEntry`、`upsertSessionEntry`、
  `patchSessionEntry`、`deleteSessionEntry` 與 `listSessionEntries`。
- 整個儲存區的重寫輔助函式、檔案寫入器、佇列測試、別名修剪，以及
  舊版金鑰刪除參數，皆已從執行階段移除。
- 已淘汰的根套件相容性匯出仍會將標準
  `sessions.json` 路徑轉接至 SQLite 資料列 API。
- `sessions.json` 剖析僅保留於 doctor 遷移／匯入程式碼與
  doctor 測試中。
- 執行階段生命週期的備援會讀取 SQLite 對話記錄標頭，而不是 JSONL 的第一
  行。

持續刪除任何重新引入檔案鎖定參數、
將修剪／截斷描述為檔案維護的詞彙、儲存區路徑身分，或唯一斷言為 JSON 持久化的測試
之內容。

### 階段 4：移動對話記錄、ACP 串流、軌跡與 VFS

讓每個代理程式資料串流都以資料庫為原生基礎：

- 對話記錄附加寫入會透過單一 SQLite 交易，確保工作階段
  標頭存在、檢查訊息冪等性、選取父項尾端、插入
  `transcript_events`，並在
  `transcript_event_identities` 中記錄可查詢的身分中繼資料。直接附加對話記錄訊息及
  一般持久化的 `TranscriptSessionManager` 附加已完成；明確的分支
  操作會保留其明確的父項選擇，且仍寫入 SQLite 資料列，
  不衍生任何檔案定位資訊。
- ACP 父串流日誌成為資料列，而不是 `.acp-stream.jsonl` 檔案。已完成。
- ACP 衍生設定不再持久化對話記錄 JSONL 路徑。已完成。
- 執行階段軌跡擷取會直接寫入事件資料列／成品。明確的
  支援／匯出命令仍可產生支援套件 JSONL 成品作為
  匯出格式，但工作階段匯出不會重新建立工作階段 JSONL。已完成。
- 設定為磁碟模式時，磁碟工作區仍保留在磁碟上。
- VFS 暫存空間與實驗性的僅限 VFS 工作區模式使用代理程式資料庫。

遷移會匯入舊 JSONL 檔案一次，在
`migration_runs` 中記錄數量／雜湊，並在完整性檢查後移除已匯入的檔案。

### 階段 5：備份、還原、壓縮與驗證

備份仍為單一封存檔案：

- 為每個全域與代理程式資料庫建立檢查點。
- 使用 SQLite 備份語意或 `VACUUM INTO` 建立每個資料庫的快照。
- 封存精簡的資料庫快照、設定、外部認證資訊，以及要求的
  工作區匯出。
- 省略原始的即時 `*.sqlite-wal` 與 `*.sqlite-shm` 檔案。
- 透過開啟每個資料庫快照並執行 `PRAGMA integrity_check` 進行驗證。
  `openclaw backup create` 預設會執行此封存驗證；
  `--no-verify` 僅略過寫入後的封存檢查，不會略過快照
  建立時的完整性檢查。
- 還原會將快照複製回其目標路徑。還原的全域資料庫使用
  版本 `1`；還原的每代理程式資料庫使用版本 `2`，版本 `1` 快照則會在
  開啟時以不可分割方式升級。

### 階段 6：工作站執行階段

在資料庫拆分完成期間，讓工作站模式維持實驗性：

- 工作站接收代理程式 ID、執行 ID、檔案系統模式及資料庫登錄身分。
- 每個工作站開啟自己的 SQLite 連線。
- 父項保有頻道傳遞、核准、設定與取消權限。
- 一開始每個作用中執行使用一個工作站；僅在生命週期與資料庫
  連線擁有權穩定後才新增集區化。

### 階段 7：刪除舊世界

執行階段工作階段管理已完成。舊世界僅允許作為明確的
doctor 輸入或支援／匯出輸出：

- 不允許執行階段寫入 `sessions.json`、對話記錄 JSONL、沙箱登錄 JSON、任務
  側掛 SQLite 或外掛狀態側掛 SQLite。
- 不允許 JSON／工作階段檔案修剪、檔案對話記錄截斷、工作階段檔案鎖定，
  或鎖定形狀的工作階段測試。
- 不允許以維持舊工作階段檔案最新狀態為目的的執行階段相容性匯出。
- 明確的支援匯出仍是使用者要求的封存／具體化
  格式，且不得將檔案名稱回饋至執行階段身分。

## 備份與還原

備份應為單一封存檔案，但資料庫擷取應以
SQLite 為原生基礎：

1. 停止長時間執行的寫入活動，或進入短暫的備份屏障。
2. 為每個全域與代理程式資料庫執行檢查點。
3. 使用 `VACUUM INTO` 將資料庫快照建立至暫存備份目錄。
   需要擁有者定義 SQLite 功能的外掛結構描述，應維持拒絕運作，
   直到擁有者提供安全的快照合約。
4. 封存資料庫快照、設定檔、認證資訊目錄、選取的
   工作區及資訊清單。
5. 驗證每個 SQLite 快照的檔案形狀，接著開啟標準 OpenClaw
   資料庫，並執行 `PRAGMA integrity_check` 及角色驗證。專用的
   外掛結構描述維持不透明，除非其擁有者提供驗證器。
   `openclaw backup create` 預設會執行此操作；`--no-verify` 僅用於
   刻意略過寫入後的封存檢查。

不要依賴原始即時 `*.sqlite`、`*.sqlite-wal` 與 `*.sqlite-shm` 複本作為
主要備份格式。封存資訊清單應記錄資料庫角色、
代理程式 ID、結構描述版本、來源路徑、快照路徑、位元組大小及完整性
狀態。

還原應從封存快照重建全域資料庫與代理程式資料庫檔案。
全域結構描述維持版本 `1`；每代理程式版本 `1`
快照會接受有界的執行階段升級至版本 `2`。doctor 仍是
檔案至資料庫匯入的唯一擁有者。還原命令會先驗證
封存檔案，再以經驗證且解壓縮的承載資料取代每項資訊清單資產。

## 執行階段重構計畫

1. 新增資料庫登錄 API。
   - 解析全域資料庫與每代理程式資料庫路徑。
   - 將全域結構描述維持在 `user_version = 1`。每代理程式資料庫使用版本 `2`，
     並包含從已發布版本 `1` 記憶體來源形狀進行的一次不可分割遷移。
   - 新增供測試、備份及 doctor 使用的關閉／檢查點／完整性輔助函式。

2. 合併側掛 SQLite 儲存區。
   - 將外掛狀態資料表移入全域資料庫。執行階段
     寫入已完成；未發布的舊版側掛匯入器已刪除。
   - 將任務登錄資料表移入全域資料庫。執行階段
     寫入已完成；未發布的舊版側掛匯入器已刪除。
   - 將 Task Flow 資料表移入全域資料庫。執行階段寫入已完成；
     未發布的舊版側掛匯入器已刪除。
   - 將內建記憶搜尋資料表移入每個代理程式資料庫。已完成；明確的
     自訂 `memorySearch.store.path` 現在會由 doctor 設定遷移移除。
     完整重新建立索引僅針對記憶體資料表就地執行；舊有的整檔
     交換路徑與側掛索引交換輔助函式已刪除。
   - 從這些子系統中刪除重複的資料庫開啟器、WAL 設定、權限輔助函式及
     關閉路徑。

3. 將代理程式擁有的資料表移入每代理程式資料庫。
   - 透過全域資料庫登錄按需建立代理程式資料庫。已完成。
   - 將執行階段工作階段項目、對話記錄事件、VFS 資料列及工具
     成品移至代理程式資料庫。已完成。
   - 不要遷移分支本機的共用資料庫工作階段項目、對話記錄事件、
     VFS 資料列或工具成品；該配置從未發布。僅在 doctor 中保留舊版
     檔案至資料庫匯入。

4. 取代工作階段儲存區 API。
   - 移除作為執行階段身分的 `storePath`。執行階段已完成，並由
     `check:database-first-legacy-stores` 防護：工作階段中繼資料、路由更新、
     命令持久化、命令列介面工作階段清理、Feishu 推理預覽、
     對話記錄狀態持久化、子代理程式深度、驗證設定檔工作階段
     覆寫、父項分支邏輯及 QA 實驗室檢查，現在都會根據標準的代理程式／工作階段金鑰解析
     資料庫。
     閘道／終端介面／UI／macOS 工作階段清單回應現在公開 `databasePath`
     而不是舊版 `path`；macOS 偵錯介面會將每代理程式資料庫顯示為
     唯讀狀態，而不是寫入 `session.store` 設定。
     `/status`、由聊天驅動的軌跡匯出及命令列介面相依性代理不再
     傳遞舊版儲存區路徑；對話記錄使用量備援會依代理程式／工作階段身分讀取
     SQLite。執行階段與橋接測試不再公開
     `storePath`；doctor／遷移輸入擁有該舊版欄位名稱。
     閘道合併工作階段載入不再針對
     非範本化的 `session.store` 值設有特殊執行階段分支；它會彙總每代理程式 SQLite 資料列。
     舊版工作階段鎖定 doctor 路線及其 `.jsonl.lock` 清理輔助函式
     已移除；SQLite 現在是工作階段並行處理的界線。
     熱門執行階段呼叫位置使用以資料列為導向的輔助函式名稱，例如
     `resolveSessionRowEntry`；舊有的 `resolveSessionStoreEntry` 相容性
     別名已從執行階段與外掛 SDK 匯出中移除。

- 使用 `{ agentId, sessionKey }` 資料列操作。
  已完成：`getSessionEntry`、`upsertSessionEntry`、`deleteSessionEntry`、
  `patchSessionEntry` 與 `listSessionEntries` 均為 SQLite 優先的 API，
  不需要工作階段儲存區路徑。狀態摘要、本機代理程式狀態、健康狀態
  及 `openclaw sessions` 清單命令現在會直接讀取每代理程式資料列，
  並顯示每代理程式 SQLite 資料庫路徑，而不是 `sessions.json` 路徑。
- 使用 `upsertSessionEntry`、
  `deleteSessionEntry`、`listSessionEntries` 與 SQL 清理查詢取代整個儲存區的刪除／插入。
  執行階段已完成：熱門路徑現在使用資料列 API 及會在衝突時重試的資料列修補；
  剩餘的整個儲存區匯入／取代輔助函式僅限遷移匯入
  程式碼與 SQLite 後端測試。
  - 刪除 `store-writer.ts` 與寫入器佇列測試。已完成。
  - 從工作階段資料列向上插入／修補中刪除執行階段舊版金鑰修剪與別名刪除參數。已完成。

5. 刪除執行階段 JSON 登錄行為。
   - 讓沙箱登錄讀取與寫入僅使用 SQLite。已完成。
   - 僅從遷移步驟匯入單體與分片 JSON。已完成。
   - 移除分片登錄鎖定與 JSON 寫入。已完成。

- 如果登錄資料列的形狀仍為熱門路徑的操作狀態，請保留一個具型別的登錄資料表，而不是將其儲存為通用的
  不透明 JSON。已完成。

6. 刪除具有檔案鎖定形狀的工作階段變更。
   - 執行階段鎖定建立與執行階段鎖定 API 已完成。
   - 獨立的舊版 `.jsonl.lock` doctor 清理路線已移除。
   - `session.writeLock` 是由 doctor 遷移的舊版設定，而不是具型別的執行階段
     設定。
   - 狀態完整性不再具有獨立的孤立對話記錄檔案修剪
     路徑；doctor 遷移會在單一位置匯入／移除舊版 JSONL 來源。
   - 閘道單例協調會在
     `gateway_locks` 下使用具型別的 SQLite `state_leases` 資料列，且不再公開檔案鎖定目錄介面。
   - 通用外掛 SDK 去重持久化不再使用檔案鎖定或 JSON
     檔案；它會寫入共用 SQLite 外掛狀態資料列。已完成。
   - QMD 內嵌協調使用 SQLite 狀態租約，而不是
     `qmd/embed.lock`。已完成。

7. 讓工作站具備資料庫感知能力。
   - 工作站開啟自己的 SQLite 連線。
   - 父項擁有傳遞、頻道回呼及設定。
   - 工作站接收代理程式 ID、執行 ID、檔案系統模式及資料庫登錄
     身分，而不是即時控制代碼。
   - `vfs-only` 維持實驗性，並使用代理程式資料庫作為其儲存
     根目錄。
   - 一開始每個作用中執行保留一個工作站。集區化可等到資料庫連線
     生命週期與取消行為穩定無虞後再進行。

8. 備份整合。
   - 讓備份使用 `VACUUM INTO` 建立全域、代理程式及外掛資料庫的快照。已針對狀態資產下探索到的 `*.sqlite` 檔案完成；需要無法取得之擁有者能力的外掛結構描述會採取失敗即關閉。
   - 新增備份驗證，以檢查標準 SQLite 完整性及結構描述身分，並針對專用外掛快照進行通用檔案形態驗證。已完成備份建立及預設封存檔驗證。
   - 將備份執行中繼資料記錄至 SQLite。已透過共用的 `backup_runs` 資料表完成，其中包含封存檔路徑、狀態及資訊清單 JSON。
   - 新增從已驗證封存快照還原的功能。已完成：`openclaw backup
restore` 會在解壓縮前進行驗證、使用驗證器正規化後的資訊清單、支援 `--dry-run`，且必須指定 `--yes` 才會取代已記錄的來源路徑。
   - 僅在要求時納入 VFS／工作區匯出；不要將工作階段內部資料匯出為 JSON 或 JSONL。

9. 刪除過時的測試與程式碼。已針對已知的執行階段工作階段介面完成。

- 移除會斷言執行階段建立 `sessions.json` 或逐字稿 JSONL
  檔案的測試。已完成核心工作階段儲存區、聊天、閘道逐字稿事件、
  預覽、生命週期、命令工作階段項目更新、自動回覆重設／追蹤，以及
  memory-core 夢境整理測試資料、核准目標路由、工作階段逐字稿
  修復、安全性權限修復、軌跡匯出和工作階段匯出。
  主動記憶逐字稿測試現在會斷言 SQLite 範圍，且不會建立暫存或
  持久化的 JSONL 檔案。
  舊有的心跳偵測逐字稿修剪迴歸測試已移除，因為
  執行階段不再截斷 JSONL 逐字稿。
  代理程式工作階段清單工具測試不再將舊版 `sessions.json` 路徑
  建模為閘道回應格式；應用程式／UI／macOS 測試改用 `databasePath`。
  `/status` 逐字稿用量測試現在會直接植入 SQLite 逐字稿資料列，
  而非寫入 JSONL 檔案。
  閘道工作階段生命週期測試現在會直接使用 SQLite 逐字稿植入輔助函式；
  舊有的單行工作階段檔案測試資料格式已從重設與刪除涵蓋範圍中移除。
  `sessions.delete` 不再傳回檔案時代的 `archived: []` 欄位；刪除作業
  僅回報資料列異動結果。舊有的 `deleteTranscript` 選項也已移除：
  刪除工作階段會移除標準 `sessions` 根資料列，並讓 SQLite 串聯刪除
  該工作階段擁有的逐字稿、快照和軌跡資料列，因此任何呼叫端都無法
  留下孤立的逐字稿，也不會遺漏清理分支。
  情境引擎軌跡擷取測試現在會從隔離的代理程式資料庫讀取
  `trajectory_runtime_events` 資料列，而非讀取
  `session.trajectory.jsonl`。
  Docker MCP 頻道植入指令碼現在會直接植入 SQLite 資料列。直接寫入
  `sessions.json` 的行為僅限於 doctor 測試資料。
  Tool Search Gateway E2E 現在會從 SQLite 逐字稿資料列讀取工具呼叫證據，
  而非掃描 `agents/<agentId>/sessions/*.jsonl` 檔案。
  Memory-core 主機事件和工作階段語料庫暫存資料列現在位於共用的
  SQLite 外掛狀態中；`events.jsonl` 和 `session-corpus/*.txt` 僅作為
  舊版 doctor 遷移輸入。作用中資料列使用 `memory/session-ingestion/`
  虛擬路徑，而非 `.dreams/session-corpus`。舊有的 memory-core 夢境整理
  修復模組及其命令列介面／閘道測試已移除，因為執行階段不再負責
  該語料庫的檔案封存修復。Memory-core 橋接／公開成品測試不再公開
  `.dreams/events.jsonl`；它們改用以 SQLite 為後端的虛擬 JSON 成品名稱。
  公開 SDK／Codex 測試文件現在改稱 SQLite 工作階段狀態，而非工作階段
  檔案，且頻道回合範例不再公開 `storePath` 引數。
  Matrix 同步狀態現在會直接使用 SQLite 外掛狀態儲存區。作用中的
  用戶端／執行階段合約會傳入帳號儲存根目錄，而非 `bot-storage.json`
  路徑；doctor 會先將舊版 `bot-storage.json` 匯入 SQLite，再刪除
  來源檔案。QA Matrix 重新啟動／破壞性情境現在會直接異動 SQLite 同步
  資料列，而非建立或刪除假的 `bot-storage.json` 檔案；E2EE 基礎層則
  傳入同步儲存根目錄，而非假的 `sync-store.json` 路徑。
  Matrix 儲存根目錄選擇不再依舊版同步／討論串 JSON 檔案為根目錄評分；
  它改用持久根目錄中繼資料與實際的加密狀態。
  執行階段 SQLite 工作階段後端測試套件不再虛構
  `sessions.json`；舊版來源測試資料現在位於負責匯入它們的 doctor
  測試中。
  閘道工作階段測試不再公開 `createSessionStoreDir` 輔助函式，也不再
  設定未使用的暫存工作階段儲存區路徑；測試資料目錄會明確指定，而
  直接設定資料列時則使用 SQLite 工作階段資料列命名。
  僅供 doctor 使用的 JSON5 工作階段儲存區剖析器涵蓋範圍已從基礎設施
  測試移至 doctor 遷移測試，因此執行階段測試套件不再負責舊版
  工作階段檔案剖析。
  Microsoft Teams 執行階段 SSO／待處理上傳測試不再攜帶 JSON 側載
  測試資料或剖析器；舊版 SSO 權杖剖析僅存在於外掛遷移模組中。
  Telegram 測試不再植入假的 `/tmp/*.json` 儲存區路徑；它們會直接
  重設以 SQLite 為後端的訊息快取。通用 OpenClaw 測試狀態輔助函式
  不再公開舊版 `auth-profiles.json` 寫入器；doctor 驗證遷移測試會在
  本機自行管理該測試資料。
  終端介面最後工作階段指標、exec 核准、主動記憶切換、Matrix 去重／
  啟動驗證、Memory Wiki 來源同步、目前對話繫結、初始設定驗證，以及
  Hermes 機密匯入的執行階段測試，不再製造舊有的側載檔案，也不再
  斷言舊檔名不存在。它們會透過 SQLite 資料列與公開儲存區 API 證明
  行為；只有 doctor／遷移測試中才應出現舊版來源檔名。
  裝置／節點配對、頻道 allowFrom、重新啟動意圖、重新啟動交接、
  工作階段傳送佇列項目、設定健康狀態、iMessage 快取、排程工作、
  PI 逐字稿標頭、子代理程式登錄表，以及受管理圖片附件的執行階段
  測試，也不再為了證明已停用的 JSON／JSONL 檔案會被忽略或不存在
  而建立這些檔案。
  PI 溢位復原不再具有 SessionManager 重寫／截斷後援機制：工具結果
  截斷與情境引擎逐字稿重寫會異動 SQLite 逐字稿資料列，然後從資料庫
  重新整理作用中的提示詞狀態。
  持久化的 SessionManager 訊息附加作業會委派給不可分割的 SQLite
  逐字稿附加輔助函式，以處理父項選擇與冪等性。一般中繼資料／自訂
  項目附加作業也會在 SQLite 內選取目前的父項，因此過時的管理員
  執行個體不會讓 SQLite 前的父項鏈競爭問題死灰復燃。
  回合中途預先檢查和 `sessions_yield` 的合成 PI 尾端清理現在會
  直接修剪 SQLite 逐字稿狀態；舊有的 SessionManager 尾端移除橋接及其
  測試已刪除。
  壓縮檢查點擷取也只會從 SQLite 建立快照；呼叫端不再傳入即時的
  SessionManager 作為替代逐字稿來源。
- 僅保留為遷移而植入舊版檔案的測試。
- 作用中執行階段介面的 JSON 檔案證明已改為 SQL 資料列證明。

- 新增靜態禁令，禁止執行階段寫入舊版工作階段／快取 JSON 路徑。
  儲存庫防護規則已完成。

10. 讓遷移報告可供稽核。
    - 在 SQLite 中記錄遷移執行資訊，包括開始／完成時間戳記、來源
      路徑、來源雜湊、計數、警告及備份路徑。
      已完成：舊版狀態遷移的執行現在會保存一份 `migration_runs`
      報告，其中包含來源路徑／資料表清單、來源檔案 SHA-256、大小、
      記錄數、警告及備份路徑。
      已完成：舊版狀態遷移的執行也會保存 `migration_sources`
      資料列，以供來源層級稽核，以及日後決定略過或回填。
    - 確保套用操作具備冪等性。部分匯入後再次執行時，應略過
      已匯入的來源，或依穩定鍵合併。
      已完成：工作階段索引、逐字稿、傳遞佇列、外掛狀態、任務
      帳本，以及代理程式所擁有的全域 SQLite 資料列，皆透過穩定鍵或
      upsert／replace 語意匯入，因此重新執行時會合併，而不會重複建立持久
      資料列。
    - 匯入失敗時，必須將原始來源檔案保留在原處。
      已完成：逐字稿匯入失敗時，現在會將原始 JSONL 來源保留在
      偵測到的路徑，而 `migration_sources` 會將來源記錄為
      `warning`，並設定 `removed_source=0`，供下次 doctor 執行處理。

## 效能規則

- 每個執行緒／程序使用一個連線即可；請勿跨
  worker 共用控制代碼。
- 使用 WAL、`foreign_keys=ON`、5 秒忙碌逾時，以及簡短的 `BEGIN IMMEDIATE`
  寫入交易。請勿在 SQLite 的
  單次忙碌等待機制之上疊加同步鎖定重試。
- 寫入交易輔助函式應保持同步，除非／直到非同步交易
  API 加入明確的互斥鎖／背壓語意。
- 父層傳遞寫入應保持精簡，並以交易方式執行。
- 避免重寫整個儲存區；使用資料列層級的 upsert／delete。
- 在將高頻程式碼移入之前，先為依代理程式列出、依工作階段列出、更新時間、執行 ID 及
  到期路徑新增索引。
- 將大型成品、媒體及向量儲存為 BLOB 或分塊 BLOB 資料列，而非
  base64 或數值陣列 JSON。
- 不透明的外掛狀態項目應保持精簡且限定範圍。
- 使用 SQL 清理 TTL／到期項目，而非檔案系統修剪。
  資料庫所擁有的執行階段儲存區已完成此項：媒體、外掛狀態、外掛 Blob、
  持久化去重及代理程式快取，現在全都透過 SQLite 資料列到期。其餘
  檔案系統清理僅限於暫時具體化的內容或明確的
  移除命令。

## 靜態禁令

新增一項儲存庫檢查，讓任何對舊版狀態路徑的新執行階段寫入都會失敗：

- `sessions.json`
- `*.trajectory.jsonl`，但實體化的支援套件輸出除外
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
- `devices/pending.json` / `devices/paired.json` / `devices/bootstrap.json`
  （已於 2026.7 淘汰：執行階段儲存區改為共用狀態資料庫中的 `device_pairing_*` /
  `device_bootstrap_tokens`；已配對的記錄會在閘道啟動時匯入，
  暫時性的待處理／啟動程序資料列則會捨棄）
- `nodes/pending.json` / `nodes/paired.json`（已於 2026.7 淘汰：在閘道啟動時併入已配對的裝置記錄）
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
- 原生鉤子轉送器的 `/tmp` 橋接 JSON 檔案
- `plugin-state/state.sqlite`
- 臨時建立的 `openclaw-state.sqlite` 執行階段附屬檔案
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
- 瀏覽器設定檔裝飾標記 `.openclaw-profile-decorated`
- `SessionManager.open(...)` 以檔案為後端的工作階段開啟器
- `SessionManager.listAll(...)` 和 `TranscriptSessionManager.listAll(...)`
  對話記錄清單外觀介面
- `SessionManager.forkFromSession(...)` 和
  `TranscriptSessionManager.forkFromSession(...)` 對話記錄分支外觀介面
- `SessionManager.newSession(...)` 和 `TranscriptSessionManager.newSession(...)`
  可變工作階段替換外觀介面
- `SessionManager.createBranchedSession(...)` 和
  `TranscriptSessionManager.createBranchedSession(...)` 分支工作階段外觀介面

此禁令應允許測試建立舊版固定資料，並允許遷移程式碼讀取、匯入及移除舊版檔案來源。尚未發布的 SQLite 附屬檔案仍屬禁止項目，且不會獲得 doctor 匯入例外。

## 完成條件

- 執行階段資料與快取寫入全域或代理程式 SQLite 資料庫。
- 執行階段不再寫入工作階段索引、對話記錄 JSONL、沙箱登錄
  JSON、任務附屬 SQLite 或外掛狀態附屬 SQLite。刪除尚未發布的任務
  與外掛狀態附屬 SQLite 匯入器。
- 舊版檔案只能由 doctor 匯入。
- 備份會產生單一封存檔，其中包含精簡的 SQLite 快照及完整性證明。
- 代理程式工作行程可以使用磁碟、VFS 暫存空間或實驗性的純 VFS
  儲存空間執行。
- 設定檔及明確的認證資訊檔案仍是唯一預期會持久保存的非資料庫控制檔案。
- 儲存庫檢查可防止重新引入舊版執行階段檔案儲存區。
