---
read_when:
    - 將 OpenClaw 執行階段資料、快取、對話記錄、任務狀態或暫存檔案移至 SQLite
    - 設計從舊版 JSON 或 JSONL 檔案遷移的 doctor 機制
    - 變更備份、還原、VFS 或工作節點儲存行為
    - 移除工作階段鎖定、清理、截斷或 JSON 相容性路徑
summary: 將 SQLite 設為主要持久狀態與快取層，同時維持設定由檔案支援的遷移計畫
title: 資料庫優先的狀態重構
x-i18n:
    generated_at: "2026-07-20T00:56:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e4ce692df8bfd031429b466166ce05d70ad0514a6628d9b3a69bf694c18a5914
    source_path: refactor/database-first.md
    workflow: 16
---

# 資料庫優先的狀態重構

## 決策

使用兩層式 SQLite 配置：

- 全域資料庫：`~/.openclaw/state/openclaw.sqlite`
- 代理程式資料庫：每個代理程式各有一個 SQLite 資料庫，用於代理程式所擁有的工作區、
  逐字記錄、VFS、成品，以及大型的每代理程式執行階段狀態
- 設定仍以檔案為後端：`openclaw.json` 仍位於
  資料庫之外。執行階段驗證設定檔移至 SQLite；外部提供者或命令列介面的
  認證資訊檔案仍由其擁有者管理，並位於 OpenClaw 資料庫之外。

全域資料庫是控制平面資料庫。它負責代理程式探索、
共用閘道狀態、配對、裝置／節點狀態、任務與流程帳本、外掛
狀態、排程器執行階段狀態、備份中繼資料，以及遷移狀態。

代理程式資料庫是資料平面資料庫。它負責代理程式的工作階段
中繼資料、逐字記錄事件串流、VFS 工作區或暫存命名空間、工具
成品、執行成品，以及可搜尋／可建立索引的代理程式本機快取資料。

這樣可提供單一持久的全域檢視，而不必強迫將大型代理程式工作區、
逐字記錄及二進位暫存資料放入共用閘道寫入通道。

## 強制契約

此遷移只有一種標準執行階段形態：

- 工作階段資料列僅持久化工作階段中繼資料。不得持久化
  `transcriptLocator`、逐字記錄檔案路徑、同層 JSONL 路徑、鎖定路徑、
  修剪中繼資料，或檔案時代的相容性指標。
- 逐字記錄身分一律使用 SQLite 身分：`{agentId, sessionId}`，並在
  通訊協定需要時加上選用的主題中繼資料。
- `sqlite-transcript://...` 不是執行階段或通訊協定身分。新程式碼不得
  衍生、持久化、傳遞、剖析或遷移逐字記錄定位器。執行階段與
  測試完全不應包含偽定位器；文件只能為了禁止它而提及該字串。
- 舊版 `sessions.json`、逐字記錄 JSONL、`.jsonl.lock`、修剪、截斷，
  以及舊工作階段路徑邏輯，只能存在於 doctor 遷移／匯入路徑中。
- 舊版工作階段設定別名只能存在於 doctor 遷移中。執行階段
  不會解讀 `session.idleMinutes`、`session.resetByType.dm`，或
  將跨代理程式的 `agent:main:*` 主工作階段別名用於另一個已設定的代理程式。
- 工作階段路由身分是具型別的關聯狀態。高頻執行階段與使用者介面路徑
  應讀取 `sessions.session_scope`、`sessions.account_id`、
  `sessions.primary_conversation_id`、`conversations` 和
  `session_conversations`；不得剖析 `session_key`，也不得從
  `session_entries.entry_json` 挖掘提供者身分，但在刪除舊呼叫端期間可將其作為
  相容性影子。
- 頻道層級的私訊標記（例如 `dm` 與 `direct`）屬於路由
  詞彙，而非逐字記錄定位器或檔案儲存區相容性控制代碼。
- 舊版鉤子處理常式設定只能存在於 doctor 警告／遷移介面。
  執行階段不得載入 `hooks.internal.handlers`；鉤子只能透過探索到的
  鉤子目錄與 `HOOK.md` 中繼資料執行。
- 執行階段啟動、高頻回覆路徑、壓縮、重設、復原、診斷、
  TTS、記憶體鉤子、子代理程式、外掛命令路由、通訊協定邊界及
  鉤子，都必須透過執行階段傳遞 `{agentId, sessionId}`。
- 測試應透過 `{agentId, sessionId}` 植入並斷言 SQLite
  逐字記錄資料列。若測試僅證明 JSONL 路徑轉送、
  保留呼叫端提供的定位器，或逐字記錄檔案相容性，
  則應刪除，除非其涵蓋 doctor 匯入、非工作階段的支援／偵錯
  實體化，或通訊協定形態。
- `runEmbeddedPiAgent(...)`、已準備的工作程式執行，以及內部嵌入式
  嘗試，都不得接受逐字記錄定位器。它們依 `{agentId, sessionId}` 開啟 SQLite
  逐字記錄管理器，並將該管理器傳給內部化且與 PI 相容的
  代理程式工作階段，使過時的呼叫端無法讓執行器寫入
  JSON／JSONL 逐字記錄。
- 執行器診斷必須將執行階段／快取／承載資料追蹤記錄儲存在 SQLite。
  執行階段診斷不得公開 JSONL 檔案覆寫旋鈕或通用的
  逐字記錄 JSONL 匯出輔助程式；面向使用者的匯出可從資料庫資料列實體化明確的
  成品，而不會將檔案名稱傳回執行階段。
- 原始串流記錄使用 `OPENCLAW_RAW_STREAM=1` 加上 SQLite 診斷資料列。
  舊版 pi-mono 的 `PI_RAW_STREAM`、`PI_RAW_STREAM_PATH` 和
  `raw-openai-completions.jsonl` 檔案記錄器契約，不屬於 OpenClaw
  執行階段或測試。
- QMD 記憶體索引不得將 SQLite 逐字記錄匯出為 Markdown 檔案。
  QMD 只為已設定的記憶體檔案建立索引；工作階段逐字記錄搜尋仍以
  SQLite 為後端。
- 對新程式碼而言，QMD SDK 子路徑僅供 QMD 使用。SQLite 工作階段逐字記錄
  索引輔助程式位於 `memory-core-host-engine-session-transcripts`；任何
  QMD 重新匯出都只用於相容性，執行階段程式碼不得使用。
- 內建記憶體索引位於所屬代理程式資料庫中。執行階段設定與
  已解析的執行階段契約不得公開 `memorySearch.store.path`；doctor
  會刪除該舊版設定鍵，而目前的程式碼會在內部傳遞代理程式的
  `databasePath`。

實作工作應持續刪除程式碼，直到上述陳述全部成立，
且 doctor／匯入／匯出／偵錯邊界之外沒有任何例外。

## 目標狀態與進度

### 強制目標

- 一個全域 SQLite 資料庫負責控制平面狀態：
  `state/openclaw.sqlite`。
- 每個代理程式各有一個 SQLite 資料庫，負責資料平面狀態：
  `agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定仍以檔案為後端。`openclaw.json` 不屬於此次資料庫
  重構。
- 舊版檔案只能作為 doctor 遷移輸入。
- 執行階段絕不將工作階段或逐字記錄 JSONL 作為作用中狀態讀寫。

### 目標狀態

- `not-started`：檔案時代的執行階段程式碼仍會寫入作用中狀態。
- `migrating`：doctor／匯入程式碼可將檔案資料移入 SQLite。
- `dual-read`：暫時性橋接會同時讀取 SQLite 與舊版檔案。此次重構
  禁止此狀態，除非明確記載為僅供 doctor 使用。
- `sqlite-runtime`：執行階段僅讀寫 SQLite。
- `clean`：移除舊版執行階段 API 與測試，並由防護機制防止
  回歸。
- `done`：文件、測試、備份、doctor 遷移及變更檢查證明
  狀態乾淨。

### 目前狀態

- 工作階段：執行階段為 `clean`。工作階段資料列位於每代理程式資料庫中，
  執行階段 API 使用 `{agentId, sessionId}` 或 `{agentId, sessionKey}`，而
  `sessions.json` 僅作為 doctor 的舊版輸入。
- 逐字記錄：執行階段為 `clean`。逐字記錄事件、身分、快照，
  以及軌跡執行階段事件都位於每代理程式資料庫中。執行階段不再
  接受逐字記錄定位器或 JSONL 逐字記錄路徑。
- PI 嵌入式執行器：`clean`。嵌入式 PI 執行、已準備的工作程式、壓縮，
  以及重試迴圈都使用 SQLite 工作階段範圍，並拒絕過時的逐字記錄控制代碼。
- 排程：執行階段為 `clean`。執行階段使用 `cron_jobs` 及排程所擁有的 `task_runs`；
  執行階段測試使用 SQLite `storeKey` 命名，而檔案時代的排程路徑僅保留於
  doctor 舊版遷移測試中。
- 任務登錄：`clean`。任務與任務流程執行階段資料列位於
  `state/openclaw.sqlite`；未發行的附屬 SQLite 匯入器已刪除。
- 外掛狀態：`clean`。外掛狀態／Blob 資料列位於共用全域
  資料庫中；已設置防護以避免使用舊版外掛狀態附屬 SQLite 輔助程式。
- 記憶體：內建記憶體與工作階段逐字記錄索引為 `sqlite-runtime`。
  記憶體索引資料表位於每代理程式資料庫中，外掛記憶體狀態使用
  共用外掛狀態資料列，而舊版記憶體檔案則是 doctor 遷移輸入
  或使用者工作區內容。
- 備份：`sqlite-runtime`。備份會暫存經壓縮的 SQLite 快照、省略作用中的
  WAL／SHM 附屬檔案、驗證 SQLite 完整性，並在
  全域資料庫中記錄備份執行。
- 工作區設定：`sqlite-runtime`。設定完成狀態、工作區證明，
  以及產生的啟動程序雜湊，都位於具型別的共用 SQLite 資料表中。執行階段
  不會讀寫已淘汰的工作區 JSON 與 `.attested` 附屬檔案；
  Doctor 負責經驗證的匯入與經確認的移除。
- Doctor 遷移：刻意維持 `migrating`。Doctor 將舊版 JSON、
  JSONL 及已淘汰的附屬儲存區匯入 SQLite，記錄遷移執行／來源，
  並移除成功處理的來源。
- 執行核准：`file-runtime`。TypeScript 與 macOS 仍會讀寫
  作用中狀態目錄的 `exec-approvals.json`；保留的
  `exec_approvals_config` 結構描述目前尚無執行階段擁有者。未來切換時必須
  加入同狀態 doctor 匯入，並同時遷移兩個執行階段。
- 端對端指令碼：執行階段涵蓋率為 `clean`。Docker MCP 植入會寫入 SQLite
  資料列。執行階段情境 Docker 指令碼只會在
  doctor 遷移種子內建立舊版 JSONL，並明確命名舊版工作階段索引路徑。

### 剩餘工作

- [x] 重新命名排程執行階段測試的儲存區變數，避免使用 `storePath`，除非
      它們是 doctor 舊版輸入。
      檔案：`src/cron/service.test-harness.ts`、
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`、
      `src/cron/service/timer.regression.test.ts`、
      `src/cron/service/ops.test.ts`、`src/cron/service/store.test.ts`、
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`、
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`、
      `src/cron/store.test.ts`。
      證明：`pnpm check:database-first-legacy-stores`；`rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`。
- [x] 移除或重新命名過時的檔案時代匯出測試模擬物件。
      檔案：`src/auto-reply/reply/commands-export-test-mocks.ts`。
      證明：`rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`。
- [x] 讓 Docker 執行階段情境中的舊版 JSONL 種子明確顯示為僅供 doctor 使用。
      檔案：`scripts/e2e/session-runtime-context-docker-client.ts`。
      證明：`rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` 顯示只有
      `seedBrokenLegacySessionForDoctorMigration`。
- [x] 在任何結構描述變更後，維持 Kysely 產生的型別同步。
      檔案：`src/state/openclaw-state-schema.sql`、
      `src/state/openclaw-agent-schema.sql`、
      `src/state/*generated*`。
      證明：此輪沒有結構描述變更；`pnpm db:kysely:check`；
      `pnpm lint:kysely`。
- [x] 重新執行針對已變更儲存區、命令及指令碼的聚焦測試。
      證明：`pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-session.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`；`git diff --check`。
- [x] 宣告 `done` 前，執行變更閘門或遠端廣泛驗證。
      證明：在暫時設定 Node 24／pnpm，並為同步後無
      `.git` 的工作區明確設定路徑路由後，`pnpm check:changed --timed -- <changed extension paths>` 已於
      Hetzner Crabbox 執行 `run_3f1cabf6b25c` 中通過。

### 不得回歸

- 不得有逐字記錄定位器。
- 不得有作用中的工作階段檔案。
- 不得有假的 JSONL 測試固定資料，doctor 舊版遷移測試除外。
- 預期使用 Kysely 時，不得直接存取 SQLite。
- 不得新增檔案時代的資料庫遷移。全域結構描述版本維持為 `1`。
  已發行的每代理程式版本 `1` 結構描述只有一項範圍有限的執行階段遷移，
  會遷移至版本 `2`，以提供穩定的記憶體來源身分。

## 程式碼閱讀假設

沒有任何後續產品決策會阻礙此計畫。實作應依照
以下假設進行：

- 直接使用 `node:sqlite`，並要求此儲存路徑採用可安全重設 WAL 的 Node 執行階段
  （22.22.3+、24.15+ 或 25.9+）。
- 僅保留一個一般設定檔。在此次重構中，請勿將設定、外掛
  資訊清單或 Git 工作區移入 SQLite。
- 不需要執行階段相容性檔案。舊版 JSON 與 JSONL 檔案僅作為
  遷移輸入。分支本機的 SQLite 附屬檔案從未發布，因此直接刪除，
  而不匯入。
- `openclaw doctor --fix` 負責舊版檔案至資料庫的遷移。執行階段
  啟動僅負責已發布 SQLite 結構描述版本之間的有限升級；
  不得匯入檔案時代的狀態。
- 認證資訊相容性遵循相同規則：執行階段認證資訊存放於
  SQLite。舊版 `auth-profiles.json`、各代理程式的 `auth.json`，以及共用的
  `credentials/oauth.json` 檔案是 doctor 的遷移輸入，匯入後
  即予以移除。
- 產生的模型目錄狀態由資料庫支援。執行階段程式碼不得寫入
  `agents/<agentId>/agent/models.json`；現有的 `models.json` 檔案是舊版
  doctor 輸入，匯入 `agent_model_catalogs` 後即予以移除。
- 執行階段不得遷移、正規化或橋接對話記錄定位器。目前有效的
  對話記錄識別資訊是 SQLite 中的 `{agentId, sessionId}`。檔案路徑僅作為
  舊版 doctor 輸入，而 `sqlite-transcript://...` 必須從執行階段、通訊協定、
  鉤子與外掛介面中消失，不得將其視為邊界控制代碼。
- 執行階段讀取 SQLite 對話記錄時，不會執行舊版 JSONL 項目格式遷移，
  也不會為了相容性而重寫整份對話記錄。舊版項目正規化仍由
  明確的 doctor／匯入公用程式負責。Doctor 會先正規化舊版 JSONL 對話記錄
  檔案，再插入 SQLite 資料列；目前的執行階段資料列
  已依現行對話記錄結構描述寫入。軌跡／工作階段匯出
  會依原樣讀取這些資料列，且不得在匯出時執行舊版遷移。
- 舊版對話記錄 JSONL 解析／遷移輔助程式僅供 doctor 使用。執行階段
  對話記錄格式程式碼只建立目前的 SQLite 對話記錄內容；doctor
  負責在插入資料列前升級舊版 JSONL 項目。
- 舊有由執行階段擁有的 JSONL 對話記錄串流輔助程式已刪除。Doctor
  匯入程式碼負責明確讀取舊版檔案；執行階段工作階段歷程則讀取
  SQLite 資料列。
- Codex app-server 繫結使用 OpenClaw 的 `sessionId`，作為 Codex
  外掛狀態命名空間中的標準鍵。`sessionKey` 是用於路由／顯示的中繼資料，
  不得取代持久工作階段 ID，也不得恢復以對話記錄檔案作為識別資訊。
- 內容引擎會直接接收目前的執行階段合約。登錄區
  不得以會刪除 `sessionKey`、
  `transcriptScope` 或 `prompt` 的重試相容層包裝引擎；無法接受目前
  資料庫優先參數的引擎應明確失敗，而非透過橋接運作。
- 備份輸出應維持為單一封存檔案。資料庫內容應以精簡的 SQLite
  快照形式納入該封存檔，而非原始的即時 WAL 附屬檔案。
- 對話記錄搜尋很有用，但不是首次資料庫優先
  改版的必要功能。結構描述的設計應允許日後加入 FTS。
- 在資料庫邊界穩定下來之前，工作程序執行應在設定控制下
  維持實驗性功能。

## 程式碼閱讀結果

目前的分支已經超越概念驗證階段。共用
資料庫已存在，Node `node:sqlite` 已透過小型執行階段輔助程式接線，而
先前的儲存區現在會寫入 `state/openclaw.sqlite` 或其所屬的
`openclaw-agent.sqlite` 資料庫。

剩餘工作並不是選擇 SQLite，而是保持新邊界整潔，
並刪除所有仍形似舊檔案世界的相容性介面：

- 工作階段 `storePath` 已不再是執行階段識別資訊、測試固定資料格式或
  狀態承載資料欄位。執行階段與橋接測試已不再包含
  `storePath` 合約名稱；doctor／遷移程式碼負責該舊版詞彙。
- 工作階段寫入不再經由舊有的程序內 `store-writer.ts`
  佇列。SQLite 修補寫入會在交易外進行準備，接著使用短暫的
  同步驗證／套用交易，並明確偵測衝突。
- 舊版路徑探索仍有有效的遷移用途，但執行階段程式碼應
  停止將 `sessions.json` 與對話記錄 JSONL 檔案視為可能的寫入
  目標。
- 代理程式擁有的資料表位於各代理程式的 SQLite 資料庫中。全域資料庫保留
  登錄區／控制平面資料列；對話記錄識別資訊是各代理程式對話記錄資料列中的
  `{agentId, sessionId}`。執行階段程式碼不得保存對話記錄檔案
  路徑或遷移對話記錄定位器。
- Doctor 已匯入數個舊版檔案。清理工作的目標是將其整合為
  doctor 呼叫的單一明確遷移實作，並提供持久的
  遷移報告。

沒有其他產品問題會阻礙實作。

## 目前的程式碼結構

此分支已具備真正的共用 SQLite 基礎：

- 執行階段最低版本現在要求可安全重設 WAL 的 Node 組建：22.22.3+、
  24.15+ 或 25.9+。`package.json`、命令列介面執行階段防護、安裝程式預設值、
  macOS 執行階段定位器、CI 與公開安裝文件現在全都一致。
- `src/state/openclaw-state-db.ts` 會開啟 `openclaw.sqlite`、設定 WAL、
  `synchronous=NORMAL`、`busy_timeout=30000`、`foreign_keys=ON`，並套用
  衍生自 `src/state/openclaw-state-schema.sql` 的已產生結構描述模組。
- Kysely 資料表型別與執行階段結構描述模組，是從依據已提交的 `.sql` 檔案建立的
  可拋棄式 SQLite 資料庫產生；執行階段程式碼不再為全域、各代理程式或代理
  擷取資料庫保留複製貼上的結構描述字串。
- 執行階段儲存區會從這些產生的 Kysely `DB` 介面衍生選取與插入的資料列型別，
  而不再手動建立重複的 SQLite 資料列形狀。原始 SQL 仍僅限用於套用結構描述、pragma 與僅供遷移使用的 DDL。
- 全域 SQLite 結構描述維持在 `user_version = 1`。各代理程式結構描述
  版本為 `2`；其開啟器會以不可分割方式，將已發布版本 `1` 的
  記憶體來源鍵遷移為穩定的整數識別碼。從檔案匯入資料庫的作業
  仍保留在 doctor 程式碼中。
- 在擁有權邊界為標準定義之處，會強制執行關聯式擁有權：
  來源遷移資料列會從 `migration_runs` 串聯刪除，任務遞送狀態
  會從 `task_runs` 串聯刪除，而逐字稿識別資料列則會從
  逐字稿事件串聯刪除。
- 目前的共用資料表包括 `agent_databases`、
  `auth_profile_stores`、`auth_profile_state`、
  `plugin_state_entries`、`plugin_blob_entries`、`media_blobs`、
  `skill_uploads`、`capture_sessions`、`capture_events`、`capture_blobs`、
  `sandbox_registry_entries`、`cron_jobs`、`commitments`、
  `delivery_queue_entries`、`model_capability_cache`、
  `workspace_setup_state`、`workspace_path_aliases`、`workspace_attestations`、
  `workspace_generated_bootstrap_hashes`、`native_hook_relay_bridges`、
  `current_conversation_bindings`、`plugin_binding_approvals`、
  `tui_last_sessions`、`acp_sessions`、`acp_replay_sessions`、
  `acp_replay_events`、`task_runs`、`task_delivery_state`、`flow_runs`、
  `subagent_runs`、`migration_runs` 與 `backup_runs`。
- 外掛任意擁有的狀態不會使用主機擁有的具型別資料表。已安裝的
  外掛會使用 `plugin_state_entries` 儲存具版本的 JSON 承載資料，並使用
  `plugin_blob_entries` 儲存位元組，同時具備命名空間／鍵擁有權、TTL 清理、
  備份與外掛遷移記錄。當主機擁有查詢合約時，主機擁有的外掛協調狀態
  仍可使用具型別資料表，例如 `plugin_binding_approvals`。
- 外掛遷移是針對外掛擁有之命名空間的資料遷移，而不是主機
  結構描述遷移。外掛可透過遷移提供者遷移自身具版本的狀態／Blob 項目，
  而主機會在一般遷移台帳中記錄來源／執行狀態。除非主機本身要取得
  新跨外掛合約的擁有權，否則安裝新外掛不需要變更
  `openclaw-state-schema.sql`。
- `src/state/openclaw-agent-db.ts` 會開啟
  `agents/<agentId>/agent/openclaw-agent.sqlite`、在全域資料庫中註冊該資料庫，並擁有代理程式本機的工作階段、逐字稿、VFS、成品、快取
  與記憶體索引資料表。共用執行階段探索現在會讀取具產生型別的
  `agent_databases` 登錄，而不再於每個呼叫位置重新實作該查詢。
- 全域與各代理程式資料庫會記錄一筆 `schema_meta` 資料列，其中包含資料庫角色、
  結構描述版本、時間戳記，以及代理程式資料庫的代理程式 ID。全域資料庫
  維持在 `user_version = 1`；經過有界的記憶體來源識別遷移後，各代理程式資料庫使用版本 `2`。
- 各代理程式工作階段識別現在有一個標準的 `sessions` 根資料表，以
  `session_id` 作為鍵，並將 `session_key`、`session_scope`、`account_id`、
  `primary_conversation_id`、時間戳記、顯示欄位、模型中繼資料、
  測試框架 ID，以及父系／衍生連結設為可查詢欄位。`session_routes`
  是從 `session_key` 指向目前
  `session_id` 的唯一作用中路由索引，因此路由鍵可移至新的持久工作階段，而不會
  讓熱路徑讀取必須在重複的 `sessions.session_key` 資料列之間選擇。舊的
  `session_entries.entry_json` 相容形狀承載資料會透過外部索引鍵附掛在
  持久的 `session_id` 根上；它不再是結構描述層級中工作階段的唯一
  表示方式。
- 各代理程式外部對話識別也採用關聯式結構：
  `conversations` 儲存正規化的提供者／帳號／對話識別，而
  `session_conversations` 會將一個 OpenClaw 工作階段連結至一或多個外部
  對話。這涵蓋共用主要 DM 工作階段，其中多個對等端可刻意對應至同一工作階段，
  而不必在 `session_key` 中虛報。SQLite 也會對自然提供者識別
  強制執行唯一性，因此相同的頻道／帳號／種類／對等端／討論串組合
  不會分岔至不同的對話 ID。
  共用主要直接對等端會以 `participant` 角色連結，因此一個
  OpenClaw 工作階段可代表多個外部 DM 對等端，而不必將
  較舊的對等端降級為含糊的相關資料列。`sessions.primary_conversation_id` 仍
  指向目前具型別的遞送目標。已關閉的路由／狀態欄位
  透過 SQLite `CHECK` 約束強制執行，而非僅依賴
  TypeScript 聯集。
  執行階段工作階段投影會先清除 `session_entries.entry_json` 中的相容路由影子，
  再套用具型別的工作階段／對話欄位，因此過時的 JSON 承載資料無法重新啟用遞送目標。
  子代理程式公告路由同樣要求具型別的 SQLite 遞送內容；
  它不再退回使用相容的 `SessionEntry` 路由欄位。
  閘道 `chat.send` 的明確遞送繼承會讀取具型別的 SQLite
  遞送內容，而不是 `origin`/`last*` 相容欄位。
  `tools.effective` 同樣會從具型別的 SQLite 遞送／路由資料列衍生提供者／帳號／討論串內容，
  而非使用過時的 `last*` 工作階段項目影子。
  系統事件提示詞內容會從具型別的遞送欄位重建頻道／收件者／帳號／討論串欄位，
  而非使用 `origin` 影子。
  共用的 `deliveryContextFromSession` 輔助程式與工作階段至對話
  對應器現在會完全忽略 `SessionEntry.origin`；只有具型別的遞送欄位
  與關聯式對話資料列能建立熱路徑路由識別。
  執行階段工作階段項目正規化會在保存或投影 `entry_json` 前移除
  `origin`，而輸入中繼資料會寫入具型別的頻道／聊天
  欄位與關聯式對話資料列，而不再建立新的來源影子。
- 逐字稿事件、逐字稿快照與軌跡執行階段事件現在會
  參照標準的各代理程式 `sessions` 根，並在刪除工作階段時串聯刪除。
  逐字稿識別／冪等性資料列會繼續從確切的逐字稿事件資料列串聯刪除。
- 記憶體核心索引現在使用明確的代理程式資料庫資料表
  `memory_index_meta`、`memory_index_sources`、`memory_index_chunks` 與
  `memory_embedding_cache`，並以 `memory_index_state` 追蹤修訂變更。
  選用的 FTS／向量輔助索引命名為 `memory_index_chunks_fts` 與
  `memory_index_chunks_vec`，而非通用的 `meta`、`files`、`chunks`、
  `chunks_fts` 或 `chunks_vec` 資料表。標準名稱會保留目前的
  路徑／來源資料列形狀與序列化嵌入相容性。這些資料表
  是衍生／搜尋快取，而非標準逐字稿儲存區；可將其
  刪除，並從記憶體工作區檔案與已設定的來源重建。
  開啟已發布且使用通用名稱的記憶體索引時，會將其中繼資料、來源、
  區塊與嵌入快取遷移至標準資料表；衍生的 FTS／向量
  資料表則會以標準名稱重建。
- 子代理程式執行復原狀態現在存放於具型別的共用 `subagent_runs` 資料列中，
  並為子工作階段、請求者與控制器工作階段鍵建立索引。舊的
  `subagents/runs.json` 檔案僅作為 Doctor 清理輸入。其執行項目是
  暫時性的復原狀態，因此 Doctor 會記錄退役收據，並
  捨棄該檔案而不匯入。由於在 SQLite 資料列遭修剪後，檔案無法證明
  其項目仍有效或已過時，因此操作人員在跨越此邊界升級前，
  必須先讓檔案時代的作用中執行完成。
- 目前的對話繫結現在存放於具型別的共用
  `current_conversation_bindings` 資料列中，並以正規化的對話 ID 作為鍵，將
  目標代理程式／工作階段欄位、對話種類、狀態、到期時間與中繼資料
  儲存為關聯式欄位，而非重複且不透明的繫結記錄。
  持久繫結鍵包含正規化的對話種類，因此
  直接／群組／頻道參照不會衝突，而 SQLite 會拒絕無效的繫結
  種類／狀態值。舊的
  `bindings/current-conversations.json` 檔案僅作為 doctor 遷移輸入。
- 遞送佇列復原現在會在重播 JSON 上疊加頻道、目標、
  帳號、工作階段、重試、錯誤、平台傳送與復原狀態的具型別佇列欄位。
  `entry_json` 會保留重播承載資料、鉤子與格式化
  承載資料，但熱路徑佇列路由／狀態以具型別欄位為準。
- 終端介面上次工作階段還原指標現在存放於具型別的共用
  `tui_last_sessions` 資料列中，並以雜湊後的終端介面連線／工作階段範圍作為鍵。
  執行階段僅讀寫 SQLite、以不可分割方式對每個範圍執行 upsert，並
  排除心跳偵測工作階段。`openclaw doctor --fix` 會嚴格驗證
  舊的終端介面 JSON 檔案、保留較新的 SQLite 資料列、驗證標準結果，
  並移除未變更的舊版檔案，而非留下封存檔。
- Discord 命令部署雜湊現在存放於共用外掛狀態 SQLite
  儲存區中。執行階段僅讀寫確切且限定於應用程式範圍的鍵。Doctor
  會刪除可重建的舊版 `discord/command-deploy-cache.json` 檔案
  而不匯入，因此下次啟動時會執行一次標準協調。
- 預設 TTS 偏好設定現在存放於共用外掛狀態 SQLite 資料列中，並歸於
  `speech-core` 外掛之下。舊的 `settings/tts.json` 檔案僅作為 doctor 遷移
  輸入；執行階段不再讀寫 TTS 偏好設定 JSON 檔案，而
  舊版路徑解析器則位於 doctor 遷移模組中。
- 密鑰目標中繼資料現在使用儲存區的概念，而不再假裝每個
  認證資訊目標都是設定檔。`openclaw.json` 仍是設定儲存區；
  驗證設定檔目標使用具型別的 SQLite `auth_profile_stores` 資料列，並將
  依提供者形狀組織的認證資訊保留為 JSON 承載資料。
- 密鑰稽核不再掃描已退役的各代理程式 `auth.json` 檔案。Doctor 負責
  警告、匯入及移除該舊版檔案。
- 舊版驗證設定檔路徑輔助程式現在位於 doctor 舊版程式碼中。核心驗證
  設定檔路徑輔助程式會公開 SQLite 驗證儲存區識別與顯示位置，
  而非 `auth-profiles.json` 或 `auth-state.json` 執行階段路徑。
- 子代理程式執行復原與 OpenRouter 模型能力快取執行階段模組
  現在會將 SQLite 快照讀取器／寫入器，與僅供 doctor 使用的舊版 JSON
  匯入輔助程式分開。OpenRouter 能力使用 `provider_id = "openrouter"` 下具型別且通用的
  `model_capability_cache` 資料列，而非
  單一不透明快取 Blob 或提供者專用的主機資料表。子代理程式執行
  `taskName` 儲存在具型別的 `subagent_runs.task_name` 欄位中；
  `payload_json` 副本是重播／偵錯資料，而非熱路徑顯示或
  查詢欄位的來源。
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` 會在代理程式資料庫的
  `vfs_entries` 資料表上實作 SQLite VFS。目錄讀取、遞迴
  匯出、刪除與重新命名會使用具索引的 `(namespace, path)` 前綴範圍，
  而非掃描整個命名空間或依賴 `LIKE` 路徑比對。
- `src/agents/runtime-worker.entry.ts` 會為工作程序建立每次執行專用的 SQLite VFS、工具成品、
  執行成品及限定範圍的快取儲存區。
- 工作區啟動程序完成狀態、證明的新近程度及產生的啟動程序
  雜湊，現在存放在具型別的共用 `workspace_setup_state`、
  `workspace_path_aliases`、`workspace_attestations` 及
  `workspace_generated_bootstrap_hashes` 資料列中，並以標準工作區
  身分識別作為鍵值。持久化的詞法與實際路徑別名，可在已設定的符號連結消失後，
  讓防止工作區消失的保護機制維持穩定；重新指向的別名會採取封閉式失敗。
  執行階段不再讀取或寫入
  `openclaw-workspace-state.json`、`.openclaw/workspace-state.json`、狀態目錄中的
  `workspace-attestations/*.attested`，或同層的 `<workspace>.attested`
  側載檔案。`openclaw doctor --fix` 會驗證並宣告舊版來源、
  將其匯入 SQLite 並附上遷移收據、驗證標準資料列，
  然後才移除已宣告的檔案。
- 共用結構描述保留一個 `exec_approvals_config` 單例資料列，但
  執行階段切換仍待完成。TypeScript 與 macOS 輔助程式仍使用
  狀態範圍的 JSON 檔案，且必須一併移至 SQLite。
- TypeScript 裝置身分識別現在使用具型別的 `device_identities` 資料列，
  並將僅供 doctor 使用的舊版 JSON 匯入保留在執行階段擁有者之外。裝置驗證
  在協調完成結構描述與跨執行階段遷移前仍以檔案為後端；
  `device_auth_tokens` 仍保留供該後續工作使用。
- GitHub Copilot 權杖交換快取使用共用 SQLite 外掛狀態資料表，
  位於 `github-copilot/token-cache/default` 下。這是由提供者擁有的快取狀態，
  因此刻意不新增主機結構描述資料表。
- GitHub Copilot 壓縮不再寫入 `openclaw-compaction-*.json`
  工作區側載檔案。測試框架會針對追蹤中的 SDK 工作階段呼叫 SDK 歷程壓縮 RPC，
  而 OpenClaw 會將持久工作階段／逐字稿狀態保存在 SQLite 中，
  而非相容性標記檔案。
- 共用 Swift 執行階段（`OpenClawKit`）會為裝置
  身分識別使用相同的 `state/openclaw.sqlite#table/device_identities` 結構與資料列鍵值。
  Apple 容器中的舊版檔案由 Swift 遷移擁有者匯入，因為 TypeScript Doctor
  無法存取這些容器。Swift 裝置驗證在協調進行驗證後續工作前仍以檔案為後端。
- Android 裝置身分識別與快取的裝置驗證仍為應用程式本機儲存區。
  它們需要由 Android 擁有的獨立遷移；主機 SQLite 宣告並不描述
  Android 目前的行為。
- Android 通知的近期套件歷程使用具型別的
  `android_notification_recent_packages` 資料列。執行階段不再遷移或
  讀取舊有的 SharedPreferences CSV 鍵值。
- 當舊版 `identity/device.json` 存在、SQLite 身分識別資料列無效，
  或 SQLite 身分識別儲存區無法開啟時，裝置身分識別建立會採取封閉式失敗。
  Doctor 會先匯入並移除該檔案，因此執行階段啟動無法在遷移前
  悄然輪替配對身分識別。
- 裝置身分識別選項是 SQLite 資料列鍵值，而非 JSON 檔案定位器。測試
  與閘道輔助程式會傳入明確的身分識別鍵值；只有 doctor 遷移與
  封閉式失敗啟動閘門知道已淘汰的 `identity/device.json` 檔名。
- 工作階段重設相容性現在位於 doctor 設定遷移中：
  `session.idleMinutes` 會移至 `session.reset.idleMinutes`，
  `session.resetByType.dm` 會移至 `session.resetByType.direct`，而
  執行階段重設原則只會讀取標準重設鍵值。
- 舊版設定相容性現在位於 `src/commands/doctor/` 下。一般
  `readConfigFileSnapshot()` 驗證不會匯入 doctor 舊版偵測器，
  也不會標註舊版問題；`runDoctorConfigPreflight()` 會加入這些問題，
  供 doctor 修復／報告使用。doctor 設定流程會匯入
  `src/commands/doctor/legacy-config.ts`，而舊版 OAuth 設定檔 ID 修復位於
  `src/commands/doctor/legacy/oauth-profile-ids.ts`
  下。
- 非 doctor 命令不會自動執行舊版設定修復。例如，
  `openclaw update --channel` 現在遇到無效的舊版設定時會失敗，並要求
  使用者執行 doctor，而非悄然匯入 doctor 遷移程式碼。
- Web 推播、APNs、語音喚醒、更新檢查及設定健康狀態現在使用具型別的共用 SQLite
  資料表來儲存訂閱、VAPID 金鑰、節點註冊、觸發條件資料列、
  路由資料列、更新通知狀態及設定健康狀態項目，而非
  完整且不透明的 JSON Blob。Web 推播與 APNs 寫入只會 upsert 受影響的
  主鍵資料列；設定健康狀態則依設定路徑進行調整。其執行階段
  模組仍與僅供 Doctor 使用的舊版 JSON 匯入輔助程式分開。
- APNs 執行階段只會讀取及寫入 `apns_registrations`。明確的
  `openclaw doctor --fix` 會嚴格匯入已淘汰的
  `push/apns-registrations.json`、保留現有標準資料列、驗證
  交易、記錄收據，並移除含有機密資訊的 JSON。
  由收據支援的重試只會執行清理，而
  `apns_registration_tombstones` 涵蓋首次修復前的失效項目，因此
  過時的轉送授權或裝置權杖無法復原。
- 節點主機設定現在使用共用 SQLite 資料庫中具型別的單例資料列。
  當舊版 `node.json` 檔案或中斷的宣告仍存在時，執行階段會採取封閉式失敗；
  明確的 `openclaw doctor --fix` 會先嚴格匯入並移除它，
  才允許正常使用執行階段。
- 裝置／節點配對、頻道配對、頻道允許清單及啟動程序狀態，
  現在使用具型別的 SQLite 資料列，而非完整且不透明的 JSON Blob。外掛繫結
  核准與排程工作狀態遵循相同的拆分方式：執行階段模組會公開
  由 SQLite 支援的操作與中立快照輔助程式；配對／啟動程序
  以及外掛繫結核准快照寫入會依主鍵調整資料列，
  而非截斷資料表；doctor 則透過
  `src/commands/doctor/legacy/*` 模組匯入／移除舊有 JSON 檔案。
- 已安裝外掛記錄現在存放在 SQLite 已安裝外掛索引中。
  執行階段設定讀取／寫入不再遷移或保留舊有
  `plugins.installs` 撰寫設定資料；doctor 會在正常使用執行階段前，
  將該舊版設定結構匯入 SQLite。
- QQ Bot 認證資訊復原快照現在存放在 SQLite 外掛狀態中，
  位於 `qqbot/credential-backups` 下。執行階段不再寫入
  `qqbot/data/credential-backup*.json`；QQ Bot doctor 合約會從使用中的狀態目錄
  匯入並封存這些舊版備份檔案。
- 閘道重新載入規劃會在內部 `installedPluginIndex.installRecords.*`
  差異命名空間下，比較 SQLite 已安裝外掛索引快照。執行階段
  重新載入決策不再以虛假的 `plugins.installs` 設定
  物件包裝這些資料列。
- Matrix 帳號認證資訊現在存放在 SQLite 外掛狀態中。執行階段只會讀取
  該標準儲存區；若能解析其帳號，Doctor 會匯入、驗證並封存已淘汰的
  `credentials/matrix/credentials*.json` 檔案。
- 核心配對與排程執行階段模組不再使用舊版 JSON 路徑建構器。
  已淘汰的配對路徑 SDK 輔助程式仍保留為僅供遷移使用的相容性功能；
  doctor 狀態遷移負責其檔案讀取與匯入。由 Doctor 擁有的舊版
  模組建構 `pending.json`、`paired.json`、`bootstrap.json` 及
  `cron/jobs.json` 來源路徑，僅供匯入測試與遷移使用。舊版排程
  工作結構正規化與 JSONL 歷程匯入位於
  `src/commands/doctor/cron/` 下；舊版 SQLite 歷程最終處理會在
  開啟狀態資料庫時執行。
- `src/commands/doctor/legacy/runtime-state.ts` 會從 doctor 將舊版 JSON 狀態
  檔案（包括節點主機設定）匯入 SQLite。新的舊版檔案
  匯入器仍位於 `src/commands/doctor/legacy/` 下。
- `src/commands/doctor/state-migrations.ts` 會將舊版 `sessions.json` 與
  `*.jsonl` 逐字稿直接匯入 SQLite，並移除已成功處理的來源。它
  不再透過 `agents/<agentId>/sessions/*.jsonl` 暫存根目錄舊版逐字稿，
  也不會在匯入前建立標準 JSONL 目標。
- 狀態完整性 doctor 檢查不再掃描舊版工作階段目錄，
  也不再提供刪除孤立 JSONL 的選項。舊版逐字稿檔案僅作為遷移輸入，
  而遷移步驟同時負責匯入與移除來源。
- 舊版沙箱登錄匯入位於
  `src/commands/doctor/legacy/sandbox-registry.ts` 下；使用中的沙箱登錄
  讀取與寫入仍僅使用 SQLite。
- 舊版工作階段逐字稿健康狀態／匯入修復位於
  `src/commands/doctor/legacy/session-transcript-health.ts` 下；執行階段命令
  模組不再包含 JSONL 逐字稿剖析或使用中分支修復程式碼。

已完成的整併／刪除重點：

- 外掛狀態現在使用共用的 `state/openclaw.sqlite` 資料庫。舊的
  分支本機 `plugin-state/state.sqlite` 輔助檔匯入器已移除，因為
  該 SQLite 配置從未發布。探查／測試輔助函式會回報共用的
  `databasePath`，而不再公開外掛狀態專用的 SQLite 路徑。
- Task 與 Task Flow 執行階段資料表現在位於共用的
  `state/openclaw.sqlite` 資料庫，而非 `tasks/runs.sqlite` 和
  `tasks/flows/registry.sqlite`；舊的輔助檔匯入器基於相同的未發布配置原因而移除。
- `src/config/sessions/store.ts` 的輸入中繼資料、路由更新或更新時間讀取不再需要
  `storePath`。命令持久化、命令列介面
  工作階段清理、子代理程式深度、驗證覆寫及逐字稿工作階段
  身分改用代理程式／工作階段資料列 API。寫入會以 SQLite 資料列修補的形式套用，
  並在發生樂觀衝突時重試。
- 工作階段目標解析現在公開各代理程式的資料庫目標，而非舊式
  `sessions.json` 路徑。共用閘道、ACP 中繼資料、doctor 路由修復及
  `openclaw sessions` 會列舉 `agent_databases` 以及已設定的代理程式。
- 閘道工作階段路由現在使用 `resolveGatewaySessionDatabaseTarget`；傳回的
  目標會攜帶 `databasePath` 及候選 SQLite 資料列索引鍵，而非
  舊式工作階段儲存區檔案路徑。
- 頻道工作階段執行階段型別現在公開 `{agentId, sessionKey}`，用於
  更新時間讀取、輸入中繼資料及最後路由更新。舊的
  `saveSessionStore(storePath, store)` 相容型別已移除。
- 外掛執行階段、擴充功能 API 及外掛 SDK 工作階段介面現在公開
  以 SQLite 為後端的工作階段資料列輔助函式，而非作用中工作階段的整體儲存區／檔案
  相容輔助函式。根程式庫相容匯出僅在外掛 SDK 之外保留，
  供舊式內部及遷移呼叫端使用。舊的
  `resolveLegacySessionStorePath` 輔助函式已移除；舊式 `sessions.json` 路徑
  建構現在僅存在於遷移與測試固定資料中。
- `src/config/sessions/session-entries.sqlite.ts` 現在將標準工作階段
  項目儲存在各代理程式資料庫中，並支援資料列層級的讀取／向上插入／刪除修補。
  執行階段向上插入／修補／刪除不再掃描大小寫變體或
  清除舊式別名索引鍵；標準化由 doctor 負責。獨立的
  JSON 匯入輔助函式已移除，且遷移會合併並向上插入較新的資料列，
  而非取代整個工作階段資料表。公開的讀取／列出／載入輔助函式會從具型別的
  `sessions` 與 `conversations` 資料列投影常用工作階段中繼資料；
  `entry_json` 是相容／偵錯影子資料，即使過時或無效，
  也不會遺失具型別的工作階段身分或傳遞上下文。
- `src/config/sessions/delivery-info.ts` 現在會從具型別、各代理程式的
  `sessions` + `conversations` + `session_conversations` 資料列解析傳遞上下文。
  它不再從 `session_entries.entry_json` 重建執行階段傳遞身分；
  缺少具型別的對話資料列是 doctor 遷移／修復問題，
  而非執行階段備援。
- 已儲存工作階段的重設判定現在優先使用具型別的 `sessions.session_scope`、
  `sessions.chat_type` 及 `sessions.channel` 中繼資料。`sessionKey` 剖析
  僅保留給命令目標上的明確討論串／主題後綴；群組與
  私訊的重設分類不再取決於索引鍵形狀。
- 工作階段清單／狀態的顯示分類現在使用具型別的聊天中繼資料及
  閘道工作階段種類。它不再將 `session_key` 內的
  `:group:` 或 `:channel:` 子字串視為持久可靠的群組／私訊判定依據。
- 靜默回覆政策選擇現在僅使用明確的對話型別或介面
  中繼資料。它不再根據 `session_key` 子字串猜測私訊／群組政策。
- 工作階段顯示模型解析現在會從 SQLite 工作階段資料庫目標接收
  代理程式 ID，而非從 `session_key` 分割取得。
- 代理程式間公告目標的資料填入現在僅使用具型別的 `sessions.list`
  `deliveryContext`。它不再從舊式 `origin`、鏡像的
  `last*` 欄位或 `session_key` 形狀復原頻道／帳號／討論串路由。
- `sessions_send` 的討論串目標拒絕現在會讀取具型別的 SQLite 路由
  中繼資料。它不再透過從目標索引鍵剖析討論串後綴來拒絕或接受目標。
- 群組範圍的工具政策驗證現在會讀取目前或衍生工作階段的具型別 SQLite 對話
  路由。它不再透過解碼 `sessionKey` 來信任群組／頻道
  身分；若沒有具型別的工作階段資料列為呼叫端提供的群組 ID 背書，
  就會捨棄這些 ID。
- 頻道模型覆寫比對現在使用明確的群組與父層
  對話中繼資料。它不再從 `parentSessionKey` 解碼父層對話 ID。
- 已儲存模型覆寫的繼承現在要求具型別工作階段上下文提供明確的父層工作階段索引鍵。
  它不再從 `sessionKey` 中的 `:thread:` 或
  `:topic:` 後綴推導父層覆寫。
- 舊的工作階段討論串資訊包裝函式與已載入外掛討論串剖析器已移除；
  執行階段程式碼不再匯入 `config/sessions/thread-info`。
- 頻道對話輔助函式不再公開完整工作階段索引鍵的剖析
  橋接。核心仍會透過 `resolveSessionConversation(...)` 正規化供應商所擁有的原始對話 ID，
  但不會從 `sessionKey` 重建路由資訊。
- 完成傳遞、傳送政策及任務維護不再從 `session_key`
  的形狀推導聊天型別。舊的聊天型別索引鍵剖析器已刪除；
  這些路徑要求具型別的工作階段中繼資料、具型別的傳遞上下文，或
  明確的傳遞目標詞彙。
- 工作階段清單／狀態、診斷、核准帳號繫結、終端介面心跳偵測
  篩選及用量摘要不再從 `SessionEntry.origin` 挖掘
  供應商／帳號／討論串／顯示路由資訊。僅存的執行階段
  `origin` 讀取皆屬於非工作階段概念或目前回合的傳遞物件。
- 核准要求的原生對話查詢現在會讀取具型別的各代理程式工作階段
  路由資料列。它不再從 `sessionKey` 剖析頻道／群組／討論串對話身分；
  缺少具型別的中繼資料屬於遷移／修復問題。
- 閘道工作階段變更／聊天／工作階段事件承載資料不再回傳
  `SessionEntry.origin` 或 `last*` 路由影子資料；用戶端會收到具型別的
  `channel`、`chatType` 及 `deliveryContext`。
- 心跳偵測傳遞解析現在可直接接收具型別的 SQLite
  `deliveryContext`，而心跳偵測執行階段會傳入各代理程式的
  工作階段傳遞資料列，不再依賴相容的 `session_entries`
  影子資料進行目前路由。
- 排程隔離代理程式的傳遞目標解析也會先從具型別的各代理程式
  工作階段傳遞資料列填入目前路由，再退回相容項目承載資料。
- 子代理程式公告來源解析現在會透過 `loadRequesterSessionEntry` 傳遞具型別的要求端工作階段
  傳遞上下文，並優先採用該資料列，而非相容的
  `last*`/`deliveryContext` 影子資料。
- 輸入工作階段中繼資料更新現在會先與具型別的各代理程式
  傳遞資料列合併；只有在不存在具型別的對話資料列時，才會以舊的
  `SessionEntry` 傳遞欄位作為備援。
- 重新啟動／更新傳遞擷取現在會讓具型別的 SQLite 傳遞
  `threadId` 優先於從 `sessionKey` 剖析的主題／討論串片段；
  剖析僅作為舊式討論串形狀索引鍵的備援。
- Hook 代理程式上下文的頻道 ID 現在優先使用具型別的 SQLite 對話身分，
  其次才是明確的訊息中繼資料。它們不再從 `sessionKey`
  剖析供應商／群組／頻道片段。
- 閘道 `chat.send` 外部路由繼承現在會讀取具型別的 SQLite 工作階段
  路由中繼資料，而非從 `sessionKey` 片段推斷頻道／私訊／群組範圍。
  只有當具型別的工作階段頻道和聊天型別與已儲存的傳遞上下文相符時，
  頻道範圍的工作階段才會繼承；共用主要工作階段則維持更嚴格的
  命令列介面／無用戶端中繼資料規則。
- 重新啟動哨兵喚醒及接續路由現在會先讀取具型別的 SQLite
  傳遞／路由資料列，再將心跳偵測喚醒或已路由的代理程式回合
  接續排入佇列。它不再從工作階段項目的 JSON 影子資料重建傳遞上下文。
- 閘道 `tools.effective` 上下文解析現在會讀取具型別的 SQLite
  傳遞／路由資料列，以取得供應商、帳號、目標、討論串及回覆模式
  輸入。它不再從過時的 `session_entries.entry_json` 來源影子資料復原這些常用路由欄位。
- 即時語音諮詢路由現在會從具型別的各代理程式 SQLite 工作階段資料列
  解析父層／通話傳遞。選擇內嵌代理程式訊息路由時，
  它不再退回相容的 `SessionEntry.deliveryContext` 影子資料。
- ACP 衍生心跳偵測轉送及父層串流路由現在會從具型別的 SQLite 工作階段資料列
  讀取父層傳遞。它們不再從相容的工作階段項目影子資料重建父層傳遞上下文。
- 工作階段傳遞路由保留現在遵循具型別的聊天中繼資料及
  持久化傳遞欄位。它不再從 `sessionKey` 擷取頻道提示、私訊／主要
  標記或討論串形狀；只有當 SQLite 已具備該工作階段的具型別／持久化
  傳遞身分時，內部網頁聊天路由才會繼承外部目標。
- 通用工作階段傳遞擷取現在僅讀取完全相符的具型別 SQLite
  工作階段傳遞資料列。它不再剖析討論串／主題後綴，也不會從
  討論串形狀的索引鍵退回基礎工作階段索引鍵。
- 回覆分派、重新啟動哨兵復原及即時語音諮詢路由現在會使用完全相符的
  具型別 SQLite 工作階段／對話資料列進行討論串路由。它們不再透過
  剖析討論串形狀的工作階段索引鍵，復原討論串 ID 或基礎工作階段傳遞上下文。
- 內嵌 Pi 歷程限制現在使用具型別的 SQLite 工作階段路由
  投影（`sessions` + 主要 `conversations`）取得供應商、聊天型別
  及對等端身分。它不再從 `sessionKey` 剖析供應商、私訊、群組或討論串形狀。
- 排程工具傳遞推斷現在僅使用明確的傳遞資訊或目前具型別的
  傳遞上下文。它不再從 `agentSessionKey` 解碼頻道、對等端、帳號或討論串目標。
- 執行階段工作階段資料列不再攜帶舊的 `lastProvider` 路由別名。
  輔助函式和測試會使用具型別的 `lastChannel` 與 `deliveryContext` 欄位；
  doctor 遷移是唯一應轉換舊路由別名或持久化
  `origin` 影子資料的位置。
- 逐字稿事件、VFS 資料列及工具成品資料列現在會寫入各代理程式
  資料庫。未發布的全域逐字稿檔案對應資料表已移除；doctor
  改在持久遷移資料列中記錄舊式來源路徑。
- 執行階段逐字稿查詢不再掃描 JSONL 位元組位移或探查舊式
  逐字稿檔案。閘道聊天／媒體／歷程路徑會從 SQLite 讀取逐字稿資料列；
  工作階段 JSONL 現在僅是舊式 doctor 輸入，而非執行階段狀態或匯出格式。
- 逐字稿父層及分支關係使用 SQLite 逐字稿標頭中的結構化
  `parentTranscriptScope: {agentId, sessionId}` 中繼資料，而非路徑形式的
  `agent-db:...transcript_events...` 定位器字串。
- 逐字稿管理器合約不再公開隱含持久化的
  `create(cwd)` 或 `continueRecent(cwd)` 建構函式。持久化逐字稿
  管理器會使用明確的 `{agentId, sessionId}` 範圍開啟；只有
  記憶體內管理器在測試與純逐字稿轉換中仍不受範圍限制。
- 執行階段逐字稿儲存區 API 解析 SQLite 範圍，而非檔案系統路徑。舊的 `resolve...ForPath` 輔助函式與未使用的 `transcriptPath` 寫入選項已從執行階段呼叫端移除。
- 執行階段工作階段解析現在使用 `{agentId, sessionId}`，且不得為外部邊界衍生 `sqlite-transcript://<agent>/<session>` 字串。舊版絕對 JSONL 路徑僅能作為 doctor 遷移輸入。
- 原生鉤子轉送的直接橋接記錄現在存放於具型別的共用 `native_hook_relay_bridges` 資料列中，並以轉送 id 作為鍵。執行階段不再為這些短期橋接記錄寫入 `/tmp` JSON 登錄或不透明的通用記錄。
- `runEmbeddedPiAgent(...)` 不再具有逐字稿定位器參數。已準備的工作者描述元也省略逐字稿定位器。執行階段工作階段狀態與已排入佇列的後續執行會攜帶 `{agentId, sessionId}`，而非衍生的逐字稿控制代碼。
- 內嵌壓縮現在從 `agentId` 與 `sessionId` 取得 SQLite 範圍。壓縮鉤子、內容引擎呼叫、命令列介面委派與通訊協定回覆不得接收衍生的 `sqlite-transcript://...` 控制代碼。匯出／偵錯程式碼可從資料列具體化明確的使用者成品，但不會提供通用的工作階段 JSONL 匯出路徑，也不會將檔案名稱回饋至執行階段身分。
- `/export-session` 從 SQLite 讀取逐字稿資料列，且只寫入所要求的獨立 HTML 檢視。內嵌檢視器不再從這些資料列重建或下載工作階段 JSONL。
- 內容引擎委派不再剖析逐字稿定位器來復原代理程式身分。已準備的執行階段內容會將解析後的 `agentId` 傳入內建壓縮配接器。
- 逐字稿重寫與即時工具結果截斷現在依 `{agentId, sessionId}` 讀取及保存逐字稿狀態，且不會為逐字稿更新事件承載資料衍生暫時定位器。
- 逐字稿狀態輔助函式介面不再具有以定位器為基礎的 `readTranscriptState`、`replaceTranscriptStateEvents` 或 `persistTranscriptStateMutation` 變體。執行階段呼叫端必須使用 `{agentId, sessionId}` API。Doctor 匯入會依明確檔案路徑讀取舊版檔案並寫入 SQLite 資料列；它不會遷移定位器字串。
- 執行階段工作階段管理器合約不再公開 `open(locator)`、`forkFrom(locator)` 或 `setTranscriptLocator(...)`。持久化工作階段管理器只能依 `{agentId, sessionId}` 開啟；列出／分支輔助函式位於以資料列為導向的工作階段與檢查點 API，而非逐字稿管理器門面。
- 閘道逐字稿讀取器 API 以範圍為優先。它們接受 `{agentId, sessionId}`，且不接受可能意外成為執行階段身分的位置式逐字稿定位器。現行逐字稿定位器剖析已移除；舊版來源路徑僅由 doctor 匯入程式碼讀取。
- 逐字稿更新事件也以範圍為優先。`emitSessionTranscriptUpdate` 不再接受單獨的定位器字串，而接聽程式會依 `{agentId, sessionId}` 路由，無須剖析控制代碼。
- 閘道工作階段訊息廣播會從代理程式／工作階段範圍解析工作階段鍵，而非從逐字稿定位器解析。舊的逐字稿定位器至工作階段鍵解析器／快取已移除。
- 閘道工作階段歷程 SSE 會依代理程式／工作階段範圍篩選即時更新。它不再將逐字稿定位器候選項、實際路徑或檔案形式的逐字稿身分正規化，以決定串流是否應接收更新。
- 工作階段生命週期鉤子不再於 `session_end` 上衍生或公開逐字稿定位器。鉤子使用端會取得 `sessionId`、`sessionKey`、下一個工作階段 id 與代理程式內容；逐字稿檔案不屬於生命週期合約。
- 重設鉤子也不再衍生或公開逐字稿定位器。`before_reset` 承載資料會攜帶已復原的 SQLite 訊息及重設原因，而工作階段身分保留於鉤子內容中。
- 代理程式測試框架重設不再接受逐字稿定位器。重設分派以 `sessionId`/`sessionKey` 加上原因限定範圍。
- 代理程式擴充功能工作階段型別不再公開 `transcriptLocator`；擴充功能應使用工作階段內容與執行階段 API，而非存取檔案形式的逐字稿身分。
- 外掛壓縮鉤子不再公開逐字稿定位器。鉤子內容已攜帶工作階段身分，而逐字稿讀取必須透過可感知 SQLite 範圍的 API 進行，而非使用檔案形式的控制代碼。
- `before_agent_finalize` 鉤子不再公開 `transcriptPath`，包括原生鉤子轉送承載資料。最終處理鉤子僅使用工作階段內容。
- 閘道重設回應不再於傳回的項目上合成逐字稿定位器。重設會建立 SQLite 逐字稿資料列、傳回乾淨的工作階段項目，並將逐字稿存取交由可感知範圍的讀取器處理。
- 內嵌執行與壓縮結果不再公開用於工作階段計量的逐字稿定位器。自動壓縮僅更新作用中的 `sessionId`、壓縮計數器與權杖中繼資料。
- 內嵌嘗試結果不再傳回 `transcriptLocatorUsed`，而內容引擎 `compact()` 結果也不再傳回逐字稿定位器。執行階段重試迴圈只接受後繼 `sessionId`。
- 傳遞鏡像逐字稿附加結果不再傳回逐字稿定位器。呼叫端會取得附加的 `messageId`；逐字稿更新訊號使用 SQLite 範圍。
- 父工作階段分支輔助函式只傳回分支後的 `sessionId`。子代理程式準備作業會將子代理程式／工作階段範圍傳給引擎。
- 命令列介面執行器參數與歷程重新植入不再接受逐字稿定位器。命令列介面歷程讀取會從 `{agentId,
sessionId}` 與工作階段鍵內容解析 SQLite 逐字稿範圍。
- 命令列介面與內嵌執行器測試固定資料現在會依工作階段 id 植入及讀取 SQLite 逐字稿資料列，不再假裝作用中工作階段是 `*.jsonl` 檔案，也不會透過執行階段參數傳遞 `sqlite-transcript://...` 字串。
- 即使記憶體內管理器沒有衍生定位器，工作階段工具結果防護事件也會從已知的工作階段範圍發出。其測試不再偽造作用中的 `/tmp/*.jsonl` 逐字稿檔案。
- BTW 與壓縮檢查點輔助函式現在會依 SQLite 範圍讀取及分支逐字稿資料列。檢查點中繼資料現在只儲存工作階段 id 與葉節點／項目 id；不再將衍生定位器寫入檢查點承載資料。
- 閘道逐字稿鍵查詢會在通訊協定邊界使用 SQLite 逐字稿範圍，且不再解析逐字稿檔案名稱的實際路徑或取得其狀態。
- 自動壓縮逐字稿輪替會直接透過 SQLite 逐字稿儲存區寫入後繼逐字稿資料列。工作階段資料列只保留後繼工作階段身分，而非永久的 JSONL 路徑或持久化定位器。
- 內嵌內容引擎壓縮會使用以 SQLite 命名的逐字稿輪替輔助函式。輪替測試不再建構 JSONL 後繼路徑，也不會將作用中工作階段模型化為檔案。
- 受管理的外送影像保留機制會根據 SQLite 逐字稿統計資料設定逐字稿訊息快取鍵，而非呼叫檔案系統狀態函式。
- 執行階段工作階段鎖與獨立的舊版 `.jsonl.lock` doctor 路徑已移除。
- Microsoft Teams 執行階段匯出檔與公用外掛 SDK 不再重新匯出舊的檔案鎖輔助函式；永久外掛狀態路徑由 SQLite 支援。
- 依工作階段存續時間／數量進行的修剪與明確工作階段清理已移除。Doctor 負責舊版匯入；過時工作階段會明確重設或刪除。
- Doctor 完整性檢查不再將舊版 JSONL 檔案計為 SQLite 工作階段資料列的有效作用中逐字稿。作用中逐字稿健全狀態僅以 SQLite 為準；舊版 JSONL 檔案會被回報為遷移／孤立項目清理輸入。
- Doctor 不再將 `agents/<agent>/sessions/` 視為必要的執行階段狀態。只有在該目錄已存在時，才會將其掃描為舊版匯入或孤立項目清理輸入。
- 閘道 `sessions.resolve`、工作階段修補／重設／壓縮路徑、子代理程式產生、快速中止、ACP 中繼資料、心跳偵測隔離工作階段與終端介面修補，不再將遷移或修剪舊版工作階段鍵作為一般執行階段工作的副作用。
- 命令列介面命令工作階段解析現在會傳回所屬的 `agentId`，而非 `storePath`，且在一般 `--to` 或 `--session-id` 解析期間不再複製舊版主要工作階段資料列。舊版主要資料列正規化僅屬於 doctor。
- 執行階段子代理程式深度解析不再讀取 `sessions.json` 或 JSON5 工作階段儲存區。它會依代理程式 id 讀取 SQLite `session_entries`，而舊版深度／工作階段中繼資料只能透過 doctor 匯入路徑進入。
- 驗證設定檔工作階段覆寫會透過直接的 `{agentId, sessionKey}` 資料列 upsert 持久化，而非延遲載入檔案形式的工作階段儲存區執行階段。
- 自動回覆詳細資訊閘控與工作階段更新輔助函式現在會依工作階段身分讀取／upsert SQLite 工作階段資料列，且在變更持久化資料列狀態前不再需要舊版儲存區路徑。
- 命令執行工作階段中繼資料輔助函式現在使用以項目為導向的名稱與模組路徑；舊的 `session-store` 命令輔助函式介面已移除。
- 啟動標頭植入與手動壓縮邊界強化現在會直接變更 SQLite 逐字稿資料列。執行階段呼叫端會傳遞工作階段身分，而非可寫入的 `.jsonl` 路徑。
- 無訊息工作階段輪替重播會依 `{agentId, sessionId}` 從 SQLite 逐字稿資料列複製最近的使用者／助理對話輪次。它不再接受來源或目標逐字稿定位器。
- 新的執行階段工作階段資料列不再儲存逐字稿定位器。呼叫端會直接使用 `{agentId, sessionId}`；匯出／偵錯命令在具體化資料列時可選擇輸出檔案名稱。
- 開始新的持久化逐字稿工作階段時，現在一律依範圍開啟 SQLite 資料列。工作階段管理器不再重複使用先前檔案時代的逐字稿路徑或定位器，作為新工作階段的身分。
- 持久化逐字稿工作階段使用明確的 `openTranscriptSessionManagerForSession({agentId, sessionId})` API。舊的靜態 `SessionManager.create/openForSession/list/forkFromSession` 門面已移除，因此測試與執行階段程式碼不會意外重新建立檔案時代的工作階段探索。
- 外掛執行階段不再公開 `api.runtime.agent.session.resolveTranscriptLocatorPath`；外掛程式碼會使用 SQLite 資料列輔助函式與範圍值。
- 公用 `session-store-runtime` SDK 介面現在只匯出工作階段資料列與逐字稿資料列輔助函式。專用的 SQLite 結構描述／路徑／交易輔助函式位於 `sqlite-runtime`；原始開啟／關閉／重設輔助函式仍僅供第一方測試於本機使用。
- 舊版 `.jsonl` 軌跡／檢查點檔案名稱分類器現在位於 doctor 舊版工作階段檔案模組中。核心工作階段驗證不再匯入檔案成品輔助函式，以判斷一般 SQLite 工作階段 id。
- 主動記憶阻塞式子代理程式執行會使用 SQLite 逐字稿資料列，而非在外掛狀態下建立暫時或持久化的 `session.jsonl` 檔案。舊的 `transcriptDir` 選項已移除。
- 一次性 slug 產生與系統代理程式規劃器執行會使用 SQLite 逐字稿資料列，而非建立暫時的 `session.jsonl` 檔案。
- `llm-task` 輔助執行和隱藏承諾擷取也使用 SQLite
  逐字稿資料列，因此這些僅供模型使用的輔助工作階段不再建立
  暫存 JSON/JSONL 逐字稿檔案。
- `TranscriptSessionManager` 現在只是一個已開啟的 SQLite 逐字稿範圍。
  執行階段程式碼使用 `openTranscriptSessionManagerForSession({agentId,
sessionId})` 開啟它；建立、分支、繼續、列出和分叉流程位於其
  所屬的 SQLite 資料列輔助程式中，而非靜態管理器外觀。
  Doctor／匯入／偵錯程式碼會在執行階段工作階段管理器之外處理明確的舊版來源檔案。
- 已移除過時的 `SessionManager.newSession()` 和
  `SessionManager.createBranchedSession()` 外觀方法。新的
  工作階段和逐字稿衍生項目由其所屬的 SQLite
  工作流程建立，而不是將已開啟的管理器變更為不同的
  持久化工作階段。
- 上層逐字稿分叉決策和分叉建立不再接受
  `storePath` 或 `sessionsDir`；它們使用 `{agentId, sessionId}` SQLite
  逐字稿範圍，而不是保留的檔案系統路徑中繼資料。
- Memory-host 不再匯出不執行任何操作的工作階段目錄逐字稿
  分類輔助程式；逐字稿篩選現在會在建立項目時衍生自 SQLite 資料列
  中繼資料。
- Memory-host 和 QMD 工作階段匯出測試使用 SQLite 逐字稿範圍。舊的
  `agents/<agentId>/sessions/*.jsonl` 路徑僅在測試刻意驗證
  Doctor／匯入／匯出相容性時才保留涵蓋。
- QA-lab 原始工作階段檢查現在透過閘道使用 `sessions.list`，
  而不是讀取 `agents/qa/sessions/sessions.json`；MSteams 意見回饋
  直接附加至 SQLite 逐字稿，不再虛構 JSONL 路徑。
- 共用的傳入頻道輪次現在攜帶 `{agentId, sessionKey}`，而不是
  舊版 `storePath`。LINE、WhatsApp、Slack、Discord、Telegram、Matrix、Signal、
  iMessage、BlueBubbles、Feishu、Google Chat、IRC、Nextcloud Talk、Zalo、
  Zalo Personal、QA Channel、Microsoft Teams、Mattermost、Synology Chat、Tlon、
  Twitch 和 QQ Bot 的記錄路徑現在會讀取更新時間中繼資料，並透過
  SQLite 身分記錄傳入工作階段資料列。
- 已從作用中的工作階段資料列移除逐字稿定位器持久化。
  `resolveSessionTranscriptTarget` 會傳回 `agentId`、`sessionId` 和選用的
  主題中繼資料；只有 Doctor 程式碼會匯入舊版逐字稿檔案
  名稱。
- 執行階段逐字稿標頭從 SQLite 版本 `1` 開始。舊版 JSONL V1/V2/V3
  形狀升級僅存在於 Doctor 匯入中，並會在儲存資料列前將匯入的標頭
  正規化為目前的 SQLite 逐字稿版本。
- 資料庫優先防護現在禁止 `SessionManager.listAll` 和
  `SessionManager.forkFromSession`；工作階段列出及分叉／還原工作流程
  必須維持使用資料列／範圍限定的 SQLite API。
- 此防護也禁止在 Doctor／匯入程式碼之外使用舊版逐字稿 JSONL 剖析／作用中分支修復輔助程式
  名稱，因此執行階段無法再產生第二條舊版
  逐字稿遷移路徑。
- 內嵌 PI 執行會拒絕傳入的逐字稿控制代碼。它們會在工作執行緒啟動前，以及
  該嘗試接觸逐字稿狀態前，再次使用 SQLite
  `{agentId, sessionId}` 身分。過時的 `/tmp/*.jsonl` 輸入無法選取
  執行階段寫入目標。
- 快取追蹤、Anthropic 承載資料、原始串流和診斷時間軸記錄
  現在會寫入具型別的 SQLite `diagnostic_events` 資料列。閘道穩定性套件
  現在會寫入具型別的 SQLite `diagnostic_stability_bundles` 資料列。舊的
  `diagnostics.cacheTrace.filePath`、`OPENCLAW_CACHE_TRACE_FILE`、
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` 和
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL 覆寫路徑已移除，且
  一般穩定性擷取不再寫入 `logs/stability/*.json` 檔案。
- 排程持久化現在會協調 SQLite `cron_jobs` 資料列，而不是
  每次儲存時刪除並重新插入整個工作資料表。外掛目標
  寫回會直接更新相符的排程資料列，並將執行階段排程狀態保留在
  同一個狀態資料庫交易中。
- 排程執行階段呼叫端現在使用穩定的 SQLite 排程儲存區鍵。舊版
  `cron.store` 路徑僅作為 Doctor 匯入輸入；正式環境閘道、工作
  維護、狀態、執行歷程和 Telegram 目標寫回路徑使用
  `resolveCronStoreKey`，且不再對鍵進行路徑正規化。排程狀態現在會
  回報 `storeKey`，而不是舊的檔案形狀 `storePath` 欄位。
- 排程執行階段載入和排程不再正規化舊版持久化工作
  形狀，例如 `jobId`、`schedule.cron`、數字 `atMs`、字串布林值或
  缺少 `sessionTarget`。Doctor 舊版匯入會在將資料列插入
  SQLite 前負責這些修復。
- ACP 產生程序不再解析或持久化逐字稿 JSONL 檔案路徑。產生程序
  和執行緒繫結設定會直接持久化 SQLite 工作階段資料列，並保留
  工作階段 ID 作為逐字稿身分。
- ACP 工作階段中繼資料 API 現在會依 `agentId` 讀取／列出／向上插入 SQLite 資料列，且
  不再將 `storePath` 公開為 ACP 工作階段項目合約的一部分。
- 工作階段用量計算和閘道用量彙總現在只依 `{agentId, sessionId}` 解析逐字稿。
  成本／用量快取和已探索工作階段
  摘要不再合成或傳回逐字稿定位器字串。
- 閘道聊天附加、中止時的部分持久化、`/sessions.send` 和
  Webchat 媒體逐字稿寫入會直接透過 SQLite 逐字稿
  範圍附加。閘道逐字稿注入輔助程式不再接受
  `transcriptLocator` 參數。
- SQLite 逐字稿探索現在只列出逐字稿範圍和統計資料：
  `{agentId, sessionId, updatedAt, eventCount}`。已無作用的
  `listSqliteSessionTranscriptLocators` 相容性輔助程式和每列
  `locator` 欄位已移除。
- 逐字稿修復執行階段現在只公開
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`。舊的
  定位器式修復輔助程式已刪除；Doctor／偵錯程式碼會讀取明確的
  來源檔案路徑，且絕不遷移定位器字串。
- ACP 重播帳本執行階段現在會將每個工作階段的重播資料列儲存在共用的
  SQLite 狀態資料庫中，而不是 `acp/event-ledger.json`；Doctor 會匯入並
  移除舊版檔案。
- 閘道逐字稿讀取器輔助程式現在位於
  `src/gateway/session-transcript-readers.ts`，而不是舊的
  `session-utils.fs` 模組名稱。後援重試歷程檢查現在依
  SQLite 逐字稿內容命名，而不是使用舊的檔案輔助程式介面。
- 閘道注入聊天和壓縮輔助程式現在會透過內部輔助 API
  傳遞 SQLite 逐字稿範圍，而不是將值命名為逐字稿路徑或
  來源檔案。
- 啟動程序延續偵測現在透過
  `hasCompletedBootstrapTranscriptTurn` 檢查 SQLite 逐字稿資料列；它不再公開檔案形狀的
  輔助程式名稱。
- 內嵌執行器測試現在使用 SQLite 逐字稿身分，而開啟新的
  逐字稿管理器一律需要明確的 `sessionId`。
- 記憶索引輔助程式現在全程使用 SQLite 逐字稿術語：
  主機匯出 `listSessionTranscriptScopesForAgent` 和
  `sessionTranscriptKeyForScope`，定向同步會將 `sessionTranscripts` 排入佇列，
  公開工作階段搜尋命中項目會公開不透明的 `transcript:<agent>:<session>` 路徑，
  而內部資料庫來源鍵是在
  `source_kind='sessions'` 下的 `session:<session>`，而不是虛假的檔案路徑。
- 通用外掛 SDK 持久化去重輔助程式不再公開檔案形狀的
  選項。呼叫端提供 SQLite 範圍鍵，而持久去重資料列位於
  共用外掛狀態中。
- Microsoft Teams SSO 權杖已從鎖定的 JSON 檔案移至 SQLite 外掛
  狀態。Doctor 會匯入 `msteams-sso-tokens.json`、從承載資料重建標準 SSO 權杖
  鍵，並移除來源檔案。委派的 OAuth 權杖仍維持在其現有的私人認證資訊檔案邊界。
- Matrix 同步快取狀態已從 `bot-storage.json` 移至 SQLite 外掛
  狀態。Doctor 會匯入舊版原始或包裝的同步承載資料，並移除
  來源檔案。作用中的 Matrix 和 QA Lab Matrix 轉接器用戶端會傳入 SQLite 同步儲存區根
  目錄，而不是虛假的 `sync-store.json` 或 `bot-storage.json` 路徑。
- Matrix 舊版加密遷移狀態已從
  `legacy-crypto-migration.json` 移至 SQLite 外掛狀態。Doctor 會匯入
  舊的狀態檔案；Matrix SDK IndexedDB 快照已從
  `crypto-idb-snapshot.json` 移至 SQLite 外掛 Blob。Matrix 復原金鑰和
  認證資訊是 SQLite 外掛狀態資料列；其舊 JSON 檔案僅作為 Doctor
  遷移輸入。
- Memory Wiki 活動記錄現在使用 SQLite 外掛狀態，而不是
  `.openclaw-wiki/log.jsonl`。Memory Wiki 遷移提供者會匯入舊的
  JSONL 記錄；Wiki Markdown 和使用者保存庫內容仍以檔案形式
  儲存為工作區內容。
- Memory Wiki 不再建立 `.openclaw-wiki/state.json` 或未使用的
  `.openclaw-wiki/locks` 目錄。如果較舊的保存庫仍含有這些已淘汰的
  外掛中繼資料檔案，遷移提供者會將其移除。
- 系統代理程式稽核項目現在使用核心 SQLite 外掛狀態，而不是
  `audit/crestodian.jsonl`。Doctor 會匯入舊版 JSONL 稽核記錄，並在
  成功匯入後將其移除。
- 設定寫入／觀察稽核項目現在使用核心 SQLite 外掛狀態，而不是
  `logs/config-audit.jsonl`。Doctor 會匯入舊版 JSONL 稽核記錄，並在
  成功匯入後將其移除。
- macOS 輔助程式在編輯 `openclaw.json` 時，不再寫入應用程式本機的
  `logs/config-audit.jsonl` 或 `logs/config-health.json` 附屬檔案。設定
  檔案仍以檔案形式儲存，復原快照仍位於設定檔案旁，
  而持久設定稽核／健康狀態則屬於閘道 SQLite 儲存區。
- 系統代理程式救援的待處理核准現在使用核心 SQLite 外掛狀態，而不是
  `crestodian/rescue-pending/*.json` 或 `openclaw/rescue-pending/*.json`。
  這些短期安全能力絕不會匯入；Doctor 會捨棄
  這兩個已淘汰的目錄，避免升級重新啟用過時的寫入。
- Phone Control 暫時啟用狀態現在使用 SQLite 外掛狀態，而不是
  `plugins/phone-control/armed.json`。Doctor 會將舊版已啟用狀態
  檔案匯入 `phone-control/arm-state` 命名空間，並移除該檔案。
- Doctor 不再就地修復 JSONL 逐字稿或建立備份 JSONL
  檔案。它會將作用中分支匯入 SQLite，並移除舊版來源。
- 工作階段記憶掛鉤逐字稿查詢使用 `{agentId, sessionId}` 純範圍
  SQLite 讀取。其輔助程式不再接受或衍生逐字稿定位器、
  舊版檔案讀取或檔案重寫選項。
- Codex app-server 對話繫結現在會依
  OpenClaw 工作階段鍵或明確的 `{agentId, sessionId}` 範圍，設定 SQLite 外掛狀態的鍵。它們不得
  保留逐字稿路徑後援繫結。
- Codex app-server 鏡像歷程讀取只使用 SQLite 逐字稿範圍；
  它們不得從逐字稿檔案路徑復原身分。
- 角色排序和壓縮重設路徑不再取消連結舊的逐字稿
  檔案；重設只會輪替 SQLite 工作階段資料列和逐字稿身分。
- 閘道重設和檢查點回應會傳回乾淨的工作階段資料列及工作階段
  ID。它們不再為用戶端合成 SQLite 逐字稿定位器。
- Memory-core 夢境整理不再透過探查遺失的
  JSONL 檔案來刪除工作階段資料列。子代理程式清理會透過工作階段執行階段 API 進行，而不是
  檔案系統存在性檢查。其逐字稿擷取測試會直接植入 SQLite 資料列，
  而不是建立 `agents/<id>/sessions` 測試資料或定位器
  預留位置。
- 記憶逐字稿索引可將 `transcript:<agentId>:<sessionId>` 公開為
  引用／讀取輔助程式的虛擬搜尋命中路徑。持久索引來源為
  關聯式資料（`source_kind='sessions'`、`source_key='session:<sessionId>'`、
  `session_id=<sessionId>`)，因此該值不是執行階段逐字記錄定位器，
  也不是檔案系統路徑，且絕不可傳回工作階段執行階段 API。
- 閘道 doctor 記憶體狀態會從 SQLite 外掛狀態資料列讀取短期回憶與階段訊號計數，
  而不是從 `memory/.dreams/*.json` 讀取；命令列介面與
  doctor 輸出現在將該儲存體標示為 SQLite 儲存區，而非路徑。
- Memory-core 執行階段、命令列介面狀態、閘道 doctor 方法與外掛 SDK
  facade 不再稽核或封存舊版 `.dreams/session-corpus` 檔案。
  這些檔案僅是遷移輸入；doctor 會將其匯入 SQLite，並在驗證後
  刪除來源。作用中工作階段擷取證據資料列
  現在使用虛擬 SQLite 路徑 `memory/session-ingestion/<day>.txt`；執行階段
  絕不寫入 `.dreams/session-corpus`，也不從中衍生狀態。
- Memory-core 公開成品會將 SQLite 主機事件公開為虛擬 JSON
  成品 `memory/events/memory-host-events.json`；不再重複使用
  舊版 `.dreams/events.jsonl` 來源路徑。
- 沙箱容器／瀏覽器登錄現在使用共用的
  `sandbox_registry_entries` SQLite 資料表，其中包含具型別的工作階段、映像、時間戳記、
  後端／設定與瀏覽器連接埠欄位。Doctor 會匯入舊版單體及
  分片 JSON 登錄檔，並移除成功匯入的來源。執行階段讀取會以
  具型別的資料列欄位作為真實來源；`entry_json` 僅是重播／除錯
  副本。
- 承諾事項現在使用具型別的共用 `commitments` 資料表，而非
  整個儲存區的 JSON Blob。執行階段使用具索引的範圍、傳遞時段、滾動式
  上限、狀態與嘗試查詢，以及同步 SQLite 交易；
  `record_json` 僅是重播／除錯副本。明確的 doctor 修復會驗證
  完整的舊版 `commitments.json`、保留較新的 SQLite 資料列、驗證
  結果，然後才移除未變更的來源。執行階段絕不讀取或
  寫入已淘汰的檔案。
- Web Push 訂閱與產生的 VAPID 身分現在使用具型別的共用
  `web_push_subscriptions` 和 `web_push_vapid_keys` 資料列。執行階段註冊、
  到期清理與首次使用金鑰產生均使用資料列層級的 SQLite
  交易。明確的 Doctor 修復會驗證兩個已淘汰的 JSON 儲存區、
  在寫入 SQLite 前宣告其所有權、以不可分割方式匯入、拒絕
  衝突的 VAPID 身分、驗證結果，然後才移除
  宣告。Doctor 會在整個匯入期間持有狀態目錄維護鎖，
  使較舊的閘道無法重新建立已淘汰的檔案。註冊、
  傳遞、刪除與金鑰解析會採取失敗關閉，直到 Doctor 解決
  待處理的舊版來源或中斷的宣告為止。
- 排程工作定義、排程狀態與執行歷程不再有執行階段
  JSON 寫入器或讀取器。執行階段使用 `cron_jobs` 資料列，其中包含具型別的排程、
  承載內容、傳遞、失敗警示、工作階段、狀態與執行階段狀態欄位，以及
  排程所擁有的 `task_runs` 詳細資料，用於診斷、傳遞、工作階段／執行、模型
  與權杖總計。`job_json` 僅是重播／除錯副本；`state_json` 保留
  尚無高頻查詢欄位的巢狀執行階段診斷資料，而執行階段
  會從具型別欄位重新載入高頻狀態欄位。Doctor 會匯入
  舊版 `jobs.json`、`jobs-state.json` 與 `runs/*.jsonl` 檔案，並移除
  已匯入的來源。外掛目標回寫會更新相符的 `cron_jobs`
  資料列，而不是載入並取代整個排程儲存區。
- 閘道啟動時會忽略執行階段投影中的舊版 `notify: true` 標記。
  Doctor 僅會在將這些標記轉換為明確的 SQLite 傳遞時，讀取已淘汰的原始
  `cron.webhook`，之後便移除該設定鍵。
- 外寄與工作階段傳遞佇列現在會將佇列狀態、項目種類、
  工作階段鍵、頻道、目標、帳戶 ID、重試次數、上次嘗試／錯誤、
  復原狀態與平台傳送標記儲存為共用
  `delivery_queue_entries` 資料表中的具型別欄位。執行階段復原會從
  具型別欄位讀取這些高頻欄位，且重試／復原變更會直接更新這些欄位，
  不會重寫重播 JSON。完整 JSON 承載內容僅保留作為
  訊息本文及其他低頻重播資料的重播／除錯 Blob。
- 受管理的外寄影像記錄現在使用具型別的共用
  `managed_outgoing_image_records` 資料列。執行階段僅讀取具型別欄位；
  JSON 欄位是重播／除錯副本。原始影像位元組仍是在受管理媒體目錄中
  具名稱的附件成品。
- Discord 模型選擇器偏好設定、命令部署雜湊與討論串繫結
  現在使用共用 SQLite 外掛狀態。其舊版 JSON 匯入計畫位於
  Discord 外掛設定／doctor 遷移介面，而非核心遷移程式碼。
- 外掛舊版匯入偵測器使用由 doctor 命名的模組，例如
  `doctor-legacy-state.ts` 或 `doctor-state-imports.ts`；一般頻道執行階段
  模組不得匯入舊版 JSON 偵測器。
- BlueBubbles 補抓游標與輸入去重標記現在使用共用 SQLite
  外掛狀態。其舊版 JSON 匯入計畫位於 BlueBubbles 外掛
  設定／doctor 遷移介面，而非核心遷移程式碼。
- Telegram 更新偏移量、貼圖快取資料列、已傳送訊息快取資料列、
  主題名稱快取資料列與討論串繫結現在使用共用 SQLite 外掛
  狀態。其舊版 JSON 匯入計畫位於 Telegram 外掛
  設定／doctor 遷移介面，而非核心遷移程式碼。
- iMessage 補抓游標、回覆短 ID 對應與已傳送回聲去重資料列
  現在使用共用 SQLite 外掛狀態。舊有的 `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl` 與 `imessage/sent-echoes.jsonl` 檔案
  僅作為 doctor 輸入。
- Feishu 訊息去重資料列現在使用核心可宣告式去重
  （共用 SQLite 外掛狀態中的 `feishu.dedup.*` 命名空間），而非
  `feishu/dedup/*.json` 檔案或已淘汰的手工 `dedup.*` 儲存區；
  不進行舊版匯入，因為重播防護快取會在升級後重建。
- Microsoft Teams 對話、投票、待處理上傳緩衝區與回饋
  學習資料現在使用共用 SQLite 外掛狀態／Blob 資料表。待處理上傳
  路徑使用 `plugin_blob_entries`，讓媒體緩衝區儲存為 SQLite BLOB，
  而非 base64 JSON。執行階段輔助程式名稱現在使用 SQLite／狀態命名，
  而非 `*-fs` 檔案儲存區命名，且舊有的 `storePath` 相容層已從
  這些儲存區中移除。其舊版 JSON 匯入計畫位於 Microsoft Teams
  外掛設定／doctor 遷移介面。
- Zalo 託管的外寄媒體現在使用共用 SQLite `plugin_blob_entries`，
  而非 `openclaw-zalo-outbound-media` JSON／bin 暫存附屬檔案。
- 差異檢視器 HTML 與中繼資料現在使用共用 SQLite `plugin_blob_entries`，
  而非 `meta.json`／`viewer.html` 暫存檔案。檢視器 HTML 會儲存為
  gzip Blob，且僅保存 URL 權杖雜湊。算繪出的 PNG／PDF 輸出
  仍為暫時具現化檔案，因為頻道傳遞仍需要檔案路徑；
  其到期中繼資料由 SQLite 管理，不使用 JSON 附屬檔案。
- Canvas 受管理文件現在使用共用 SQLite `plugin_blob_entries`，
  而非預設的 `state/canvas/documents` 目錄。Canvas 主機會直接提供這些
  Blob；僅針對明確的 `host.root` 操作員內容，或下游媒體讀取器
  需要路徑時的暫時具現化，才會建立本機檔案。
- 檔案傳輸稽核決策現在使用共用 SQLite `plugin_state_entries`，
  而非無界限的 `audit/file-transfer.jsonl` 執行階段記錄。Doctor
  會將舊版 JSONL 稽核檔案匯入外掛狀態，並在完整匯入後移除來源。
- ACPX 程序租約與閘道執行個體身分現在使用共用 SQLite 外掛
  狀態。Doctor 會將舊版 `gateway-instance-id` 檔案匯入外掛狀態，
  並移除來源。
- ACPX 產生的包裝函式指令碼與隔離的 Codex 主目錄，是位於
  OpenClaw 暫存根目錄下的暫時具現化內容，而非持久的 OpenClaw 狀態。
  持久的 ACPX 執行階段記錄是 SQLite 租約與閘道執行個體資料列；
  舊有的 ACPX `stateDir` 設定介面已移除，因為執行階段狀態
  已不再寫入其中。
- 閘道媒體附件現在使用共用 `media_blobs` SQLite 資料表
  作為標準位元組儲存區。傳回頻道與沙箱相容介面的本機路徑
  是資料庫資料列的暫時具現化內容，而非
  持久媒體儲存區。執行階段媒體允許清單不再包含舊版
  `$OPENCLAW_STATE_DIR/media` 或設定目錄 `media` 根目錄；這些目錄
  僅作為 doctor 匯入來源。
- Shell 自動完成不再寫入 `$OPENCLAW_STATE_DIR/completions/*` 快取
  檔案。安裝、doctor、更新與發行煙霧測試路徑會使用產生的
  自動完成輸出或載入設定檔，而非持久的自動完成快取
  檔案。
- 閘道 Skills 上傳暫存現在使用共用 `skill_uploads` 與
  `skill_upload_chunks` 資料列。區塊在上傳期間保持各自的交易性，
  接著提交程序會組合一個經驗證的封存 BLOB，並移除區塊
  資料列。安裝程式僅會在安裝執行期間收到暫時具現化的封存檔路徑。
  Doctor 會捨棄已淘汰、保留一小時的檔案系統
  暫存樹，而非匯入暫時性上傳。
- 子代理程式行內附件不再具現化於工作區
  `.openclaw/attachments/*` 下。生成路徑會準備 SQLite VFS 種子項目，
  行內執行會將這些項目植入每個代理程式的執行階段暫存命名空間，
  而以磁碟為後端的工具會將該 SQLite 暫存空間疊加為附件路徑。舊有的
  子代理程式執行附件目錄登錄欄位與清理掛鉤已移除。
- 命令列介面影像補水不再維護穩定的 `openclaw-cli-images` 快取
  檔案。外部命令列介面後端仍會收到檔案路徑，但這些路徑是
  每次執行的暫時具現化內容，且會進行清理。
- 快取追蹤診斷、Anthropic 承載內容診斷、原始模型串流
  診斷、診斷時間軸事件與閘道穩定性套件現在會
  寫入 SQLite 資料列，而非 `logs/*.jsonl` 或
  `logs/stability/*.json` 檔案。
  執行階段路徑覆寫旗標與環境變數已移除；匯出／除錯
  命令可明確地從資料庫資料列具現化檔案。
- macOS 輔助應用程式不再有滾動式 `diagnostics.jsonl` 寫入器。應用程式
  記錄會傳送至統一記錄系統，而持久的閘道診斷資料仍以 SQLite 為後端。
- macOS 連接埠守護程式記錄清單現在使用具型別的共用 SQLite
  `macos_port_guardian_records` 資料列，而非 Application Support JSON 檔案
  或不透明的單例 Blob。所有 macOS 應用程式設定檔使用相同的主機全域原生
  資料庫，因為它們會協調本機連接埠。當較舊、會寫入 JSON 的應用程式副本
  正在執行時，每項分類帳操作都會封鎖。遷移只會加入舊
  分類帳的穩定檔案鎖定協定，以建立來源快照並在稍後重新驗證
  來源。它會根據即時命令與程序啟動事實解析每個舊版資料列，
  過程中不持有該鎖；接著重新讀取具權威性的 SQLite 資料列、套用
  計畫、驗證每筆收據，並移除來源。移除重試會重新規劃
  遺失的資料列，避免已淘汰的過時收據復活。該鎖保持
  短期存續，因此不會在 SSH 生成程序後卡住較舊的寫入器。切換
  刻意設計為單向：穩態執行階段絕不讀取、投影或寫入 JSON，
  且回復至僅支援 JSON 的組建不會保留較新的 SQLite 收據。
- 閘道單例鎖現在使用 `gateway_locks` 範圍下具型別的共用 SQLite
  `state_leases` 資料列，而非暫存目錄鎖定檔案。Fly 與 OAuth
  疑難排解文件現在會指向 SQLite 租約／驗證重新整理鎖，
  而非過時的檔案鎖清理。
- 閘道重新啟動哨兵狀態現在使用具型別的共用 SQLite
  `gateway_restart_sentinel` 資料列，而非 `restart-sentinel.json`；執行階段會從
  具型別的欄位讀取哨兵種類、狀態、路由、訊息、接續內容及統計資料。
  這些欄位是權威來源；`payload_json` 僅為重播／偵錯用的影子資料。
  執行階段的讀取、寫入與清除路徑僅使用 SQLite。單一有界的狀態遷移模組
  會在啟動及 Doctor 期間執行，以便在正常的重新啟動復原之前匯入經驗證的
  舊版更新後哨兵、驗證具型別的資料列，並移除來源檔案。穩態執行階段模組
  均不會讀取、寫入或清理舊版檔案。
- 閘道重新啟動意圖與監督程式交接狀態現在使用具型別的共用
  SQLite `gateway_restart_intent` 與 `gateway_restart_handoff` 資料列，而非
  `gateway-restart-intent.json` 與
  `gateway-supervisor-restart-handoff.json` 附屬檔案。
- 閘道單例協調現在使用 `gateway_locks` 下具型別的
  `state_leases` 資料列，而非寫入 `gateway.<hash>.lock` 檔案。租約資料列
  持有鎖定擁有者、到期時間、心跳偵測及偵錯酬載；SQLite 負責原子性的
  取得／釋放邊界。已移除停用的檔案鎖定目錄選項；測試會直接使用 SQLite
  資料列識別。
- 已刪除掃描 `cron/runs/*.jsonl` 檔案、未被參照的舊版排程
  使用量報告輔助程式。排程執行歷程報告會讀取由排程擁有的
  `task_runs` 資料列。
- 主工作階段的重新啟動復原現在透過 SQLite
  `agent_databases` 登錄檔尋找候選代理程式，而非掃描
  `agents/*/sessions` 目錄。
- Gemini 工作階段損毀復原現在只會刪除 SQLite 工作階段資料列；
  不再需要舊版 `storePath` 閘門，也不會嘗試取消連結衍生的
  逐字稿 JSONL 路徑。
- 路徑覆寫處理現在會將字面值 `undefined`/`null`
  環境值視為未設定，避免在測試或 Shell 交接期間意外於儲存庫根目錄建立
  `undefined/state/*.sqlite` 資料庫。
- 設定健康狀態指紋現在使用具型別的共用 SQLite
  `config_health_entries` 資料列，而非 `logs/config-health.json`，使一般設定檔維持為
  唯一不含認證資訊的設定文件。macOS 隨附應用程式只保留行程本機的健康狀態，
  且不會重新建立舊版 JSON 附屬檔案。
- 驗證設定檔執行階段不再匯入或寫入認證資訊 JSON 檔案。
  SQLite 是標準認證資訊儲存區；`auth-profiles.json`、各代理程式的
  `auth.json` 及共用的 `credentials/oauth.json` 是 Doctor 遷移輸入，
  並會在匯入後移除。
- 驗證設定檔儲存／狀態測試現在會直接斷言具型別的 SQLite
  驗證資料表，且僅將舊版驗證設定檔檔名用於 Doctor 遷移輸入。
- `openclaw secrets apply` 僅會清理設定檔、環境檔案及 SQLite
  驗證設定檔儲存區。它不再包含編輯已停用之各代理程式
  `auth.json` 的相容性邏輯；該檔案的匯入與刪除由 Doctor 負責。
- Hermes 密鑰遷移會規劃並將匯入的 API 金鑰設定檔直接套用至
  SQLite 驗證設定檔儲存區。不再將 `auth-profiles.json` 寫入或驗證為
  中繼目標。
- 面向使用者的驗證文件現在說明
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`，而非
  指示使用者檢查或複製 `auth-profiles.json`；舊版 OAuth／驗證 JSON
  名稱僅作為 Doctor 匯入輸入保留在文件中。
- MCP OAuth 工作階段現在使用共用 `state/openclaw.sqlite` 中具版本的
  `mcp_oauth_stores` 資料列。由 SDK 擁有的權杖、用戶端註冊及探索物件
  仍保留在單一經驗證的 JSON 酬載中，使相依套件的擴充欄位得以保留；
  每次讀取／修改／寫入則會在單一簡短的 Kysely 交易中提交。單一共用 SQLite
  租約會序列化重新整理、登入與登出；內嵌 MCP 傳輸不再允許 MCP SDK
  在該租約之外重新整理。Doctor 會以來源收據獨占匯入並移除已停用的
  `mcp-oauth/*.json` 儲存區，且執行階段沒有檔案後援機制。
- 核心狀態路徑輔助程式不再公開已停用的
  `credentials/oauth.json` 檔案。舊版檔名僅存在於 Doctor 驗證匯入路徑中。
- 安裝、安全性、初始設定、模型驗證及 SecretRef 文件現在說明
  SQLite 驗證設定檔資料列與完整狀態備份／遷移，而非各代理程式的驗證設定檔
  JSON 檔案。
- PI 模型探索現在會將標準認證資訊傳入記憶體內的
  `pi-coding-agent` 驗證儲存區。探索期間不再建立、清理或寫入各代理程式的
  `auth.json`。
- 語音喚醒觸發與路由設定現在使用具型別的共用 SQLite 資料表，
  而非 `settings/voicewake.json`、`settings/voicewake-routing.json` 或
  不透明的通用資料列；Doctor 會匯入舊版 JSON 檔案，並在成功遷移後將其移除。
- 更新檢查狀態現在使用具型別的共用 `update_check_state` 資料列，
  而非 `update-check.json` 或不透明的通用 Blob；Doctor 會匯入
  舊版 JSON 檔案，並在成功遷移後將其移除。
- 設定健康狀態現在使用具型別的共用 `config_health_entries` 資料列，
  而非 `logs/config-health.json` 或不透明的通用 Blob；Doctor
  會匯入舊版 JSON 檔案，並在成功遷移後將其移除。
- 外掛對話繫結核准現在使用具型別的
  `plugin_binding_approvals` 資料列，而非不透明的共用 SQLite 狀態或
  `plugin-binding-approvals.json`；舊版檔案是 Doctor 遷移輸入。
- 通用目前對話繫結現在會儲存具型別的
  `current_conversation_bindings` 資料列，而非重寫
  `bindings/current-conversations.json`；Doctor 會匯入舊版 JSON 檔案，並在成功遷移後
  將其移除。
- Memory Wiki 匯入來源同步帳本現在會按每個保存庫／來源金鑰
  儲存一筆 SQLite 外掛狀態資料列，而非重寫 `.openclaw-wiki/source-sync.json`；
  遷移提供者會匯入並移除舊版 JSON 帳本。
- Memory Wiki ChatGPT 匯入執行記錄現在會按每個保存庫／執行 ID
  儲存一筆 SQLite 外掛狀態資料列，而非寫入 `.openclaw-wiki/import-runs/*.json`。
  復原快照仍會維持為明確的保存庫檔案，直到匯入執行快照封存移至
  Blob 儲存區為止。
- Memory Wiki 編譯摘要現在會儲存壓縮的 SQLite 外掛 Blob 資料列，
  而非寫入 `.openclaw-wiki/cache/agent-digest.json` 與
  `.openclaw-wiki/cache/claims.jsonl`。此快取可重建，因此 Doctor
  會刪除舊快取檔案，而不匯入它們。
- ClawHub Skill 安裝追蹤現在會按每個工作區／Skill 儲存一筆
  SQLite 外掛狀態資料列，而非在執行階段寫入或讀取 `.clawhub/lock.json` 與
  `.clawhub/origin.json` 附屬檔案。執行階段程式碼會使用受追蹤安裝狀態物件，
  而非檔案形態的鎖定檔／來源抽象。Doctor 會從已設定的代理程式工作區
  匯入舊版附屬檔案，並在完整匯入後將其移除。
- 已安裝的外掛索引現在會讀寫具型別的共用 SQLite
  `installed_plugin_index` 單例資料列，而非 `plugins/installs.json`；
  舊版 JSON 檔案僅為 Doctor 遷移輸入，並會在匯入後移除。
- 舊版 `plugins/installs.json` 路徑輔助程式現在位於 Doctor 舊版
  程式碼中。執行階段外掛索引模組只會公開由 SQLite 支援的持久化選項，
  而非 JSON 檔案路徑。
- 閘道重新啟動哨兵、重新啟動意圖及監督程式交接狀態現在使用
  具型別的共用 SQLite 資料列（`gateway_restart_sentinel`、
  `gateway_restart_intent` 及 `gateway_restart_handoff`），而非通用的不透明 Blob。
  執行階段重新啟動程式碼不再有檔案形態的哨兵／意圖／交接合約。
- Matrix 同步快取、儲存中繼資料、討論串繫結、傳入去重標記、
  啟動驗證冷卻狀態、SDK IndexedDB 加密快照、認證資訊及復原金鑰現在使用
  共用 SQLite 外掛狀態／Blob 資料表。執行階段路徑結構不再公開
  `storage-meta.json` 中繼資料路徑；該檔名僅為舊版遷移輸入。其舊版 JSON
  匯入計畫位於 Matrix 外掛設定／Doctor 遷移介面。傳入去重標記使用核心
  可宣告去重機制（共用狀態資料庫中的 `matrix.inbound-dedupe.*` 命名空間）；
  Matrix Doctor 狀態遷移會一次匯入已停用的各根目錄
  `inbound-dedupe` 資料列與 `inbound-dedupe.json`，之後執行階段只會讀取
  可宣告去重儲存區。
- Matrix 啟動不再掃描、回報或完成舊版 Matrix 檔案狀態。
  Matrix 檔案偵測、舊版加密快照建立、房間金鑰還原遷移狀態、匯入及來源移除
  全部由 Doctor 負責。
- Matrix 執行階段遷移彙整匯出已移除。舊版狀態／加密偵測與修改
  輔助程式由 Matrix Doctor 直接匯入，而不再屬於執行階段 API 介面。
- Matrix 遷移快照重複使用標記現在位於 SQLite 外掛狀態中，
  而非 `matrix/migration-snapshot.json`；Doctor 仍可重複使用相同的已驗證遷移前封存，
  而不必寫入附屬狀態檔案。
- Nostr 匯流排游標與設定檔發布狀態現在使用共用 SQLite 外掛狀態。
  其舊版 JSON 匯入計畫位於 Nostr 外掛設定／Doctor 遷移介面。
- 主動記憶工作階段切換現在使用共用 SQLite 外掛狀態，而非
  `session-toggles.json`；重新開啟記憶功能時會刪除該資料列，而非重寫 JSON 物件。
- Skill Workshop 提案與審查計數器現在使用共用 SQLite 外掛狀態，
  而非各工作區的 `skill-workshop/<workspace>.json` 儲存區。每個提案都是
  `skill-workshop/proposals` 下的獨立資料列，審查計數器則是
  `skill-workshop/reviews` 下的獨立資料列。
- Skill Workshop 審查者子代理程式執行現在會使用執行階段工作階段
  逐字稿解析器，而非建立 `skill-workshop/<sessionId>.json` 附屬工作階段路徑。
- ACPX 行程租約現在使用 `acpx/process-leases` 下的共用 SQLite
  外掛狀態，而非完整檔案式的 `process-leases.json` 登錄檔。每個租約都會儲存為
  自有資料列，在不需要執行階段 JSON 重寫路徑的情況下，保留啟動時清除
  過期行程的能力。
- ACPX 包裝函式指令碼與隔離的 Codex 主目錄會在 OpenClaw
  暫存根目錄中產生。它們會視需要重新建立，且不是備份或遷移輸入。
- 子代理程式執行登錄檔持久化使用具型別的共用
  `subagent_runs` 資料列。舊版 `subagents/runs.json` 路徑現在僅為 Doctor
  清理輸入。Doctor 會在狀態維護鎖定下宣告該路徑、將捨棄決策記錄於 SQLite，
  並在不匯入暫時執行狀態的情況下將其移除。不再保留任何執行階段 JSON
  讀取器、寫入器、快取或後援機制；在此停用邊界刻意不支援跨版本復原
  僅存在於檔案中的進行中執行。執行階段測試不再建立無效或空白的
  `runs.json` 固定資料來驗證登錄檔行為；而是直接植入／讀取 SQLite
  資料列。
- 備份會先暫存狀態目錄再封存、複製非資料庫檔案、使用
  `VACUUM INTO` 建立資料庫快照、省略即時 WAL／SHM 附屬檔案、
  在封存清單中記錄快照中繼資料，並將已完成的備份執行連同封存清單記錄於
  SQLite。`openclaw backup
create` 預設會驗證已寫入的封存；
  `--no-verify` 是明確的快速路徑。
- `openclaw backup restore` 會在解壓縮前驗證封存、重複使用驗證器的
  正規化清單，並將已驗證的清單資產還原至其記錄的來源路徑。寫入時需要
  `--yes`，並支援使用 `--dry-run` 產生還原計畫。
- 已刪除舊版備份的揮發性路徑篩選器。由於 SQLite 快照會在建立
  封存前完成暫存，備份不再需要用於舊版工作階段或排程 JSON／JSONL 檔案的
  即時 tar 略過清單。
- 一般設定與新手引導的工作區準備不再建立
  `agents/<agentId>/sessions/` 目錄。它們只建立設定／工作區；
  SQLite 工作階段資料列與逐字稿資料列會依需求建立於
  各代理程式的資料庫中。
- 安全性權限修復現在以全域與各代理程式的 SQLite
  資料庫及 WAL/SHM 附屬檔案為目標，而非 `sessions.json` 與逐字稿
  JSONL 檔案。
- 沙箱登錄的執行階段名稱現在直接描述 SQLite 登錄種類，
  不再於作用中儲存區沿用舊版 JSON 登錄術語。
- `openclaw reset --scope config+creds+sessions` 會移除各代理程式的
  `openclaw-agent.sqlite` 資料庫及 WAL/SHM 附屬檔案，而不再僅移除舊版
  `sessions/` 目錄。
- 閘道彙總工作階段輔助函式現在使用以項目為導向的名稱：
  `loadCombinedSessionEntriesForGateway` 會傳回 `{ databasePath, entries }`。
  舊有的合併儲存區命名已從執行階段呼叫端移除。
- Docker MCP 頻道植入現在會將主要工作階段資料列與逐字稿
  事件寫入各代理程式的 SQLite 資料庫，而非建立
  `sessions.json` 與 JSONL 逐字稿。
- 內建的工作階段記憶體掛鉤現在會依 `{agentId, sessionId}` 從
  SQLite 解析先前工作階段的上下文。它不再掃描、儲存或合成
  逐字稿路徑或 `workspace/sessions` 目錄。
- 內建的命令記錄器掛鉤現在會將命令稽核資料列寫入共用
  SQLite `command_log_entries` 資料表，而非附加至
  `logs/commands.log`。
- 頻道配對允許清單現在於執行階段僅公開由 SQLite 支援的讀寫輔助函式。
  已淘汰的外掛 SDK 路徑解析器仍保留以維持移轉相容性；
  檔案讀取器僅存在於 doctor 狀態移轉程式碼中。
- `migration_runs` 會記錄舊版狀態移轉的執行項目，包括狀態、
  時間戳記與 JSON 報告。
- `migration_sources` 會記錄每個匯入的舊版檔案來源，包括雜湊、大小、
  記錄數、目標資料表、執行 ID、狀態與來源移除狀態。
- `backup_runs` 會記錄備份封存檔路徑、狀態與 JSON 資訊清單。
- 全域結構描述不會保留未使用的 `agents` 登錄資料表。在執行階段
  擁有真正的代理程式記錄擁有者之前，代理程式資料庫探索是標準的
  `agent_databases` 登錄。
- 產生的模型目錄設定會儲存於具型別的全域 SQLite
  `agent_model_catalogs` 資料列中，並以代理程式目錄為索引鍵。執行階段呼叫端使用
  `ensureOpenClawModelCatalog`；執行階段程式碼中沒有 `models.json` 相容性 API。
  此實作會寫入 SQLite，且內嵌的 PI 登錄會由該儲存的承載資料填入，
  而不建立 `models.json` 檔案。
- 選用的 `memory.qmd.sessions` 匯出會從
  各代理程式的資料庫讀取標準逐字稿資料列，並在 QMD 主目錄下產生經過清理的 Markdown，
  作為明確的 QMD 輸入成品。因此，QMD 工作階段集合與成品
  識別資訊對應仍屬於已設定之外部工具
  橋接的一部分；它們不是第二個標準逐字稿儲存區。
- QMD 自有的 `index.sqlite`、YAML 集合設定與模型下載仍是
  `~/.openclaw/agents/<agentId>/qmd` 下的外部工具成品；它們不會
  鏡像至 `plugin_blob_entries`。OpenClaw 所擁有的 QMD 協調
  以資料庫為優先：共用的 `state_leases` 會在全域序列化嵌入作業，而各代理程式的
  `state_leases` 則會序列化集合／更新／嵌入寫入器。執行階段不會建立
  QMD 鎖定附屬檔案。
- 選用的 `memory-lancedb` 外掛不再建立
  `~/.openclaw/memory/lancedb` 作為 OpenClaw 隱含管理的儲存區。它是
  外部 LanceDB 後端，並會維持停用，直到操作人員設定明確的
  `dbPath`。
- `check:database-first-legacy-stores` 會讓將
  舊版儲存區名稱與寫入式檔案系統 API 配對的新執行階段原始碼失敗。它也會讓重新引入已退役逐字稿橋接標記
  `transcriptLocator` 或 `sqlite-transcript://...` 的執行階段
  原始碼失敗。移轉、doctor、匯入
  與明確的非工作階段匯出程式碼仍受允許。範圍較廣的舊版合約
  名稱（例如 `sessionFile`、`storePath` 與舊有 `SessionManager` 檔案時代
  外觀介面）目前仍有擁有者，且需要另行進行移轉防護工作，
  才能成為必要的前置檢查。此防護現在也涵蓋
  執行階段 `cache/*.json` 儲存區、一般
  `thread-bindings.json` 附屬檔案、排程狀態／執行記錄 JSON、設定健康狀態 JSON、
  重新啟動與鎖定附屬檔案、語音喚醒設定、外掛繫結核准、
  已安裝外掛索引 JSON、檔案傳輸稽核 JSONL、記憶 Wiki 活動
  記錄、舊有內建 `command-logger` 文字記錄，以及 pi-mono 原始串流 JSONL
  診斷控制項。它也禁止舊有根層級 doctor 舊版模組名稱，
  以確保相容性程式碼留在 `src/commands/doctor/` 下。Android 偵錯處理常式
  也會使用 logcat／記憶體內輸出，而非暫存 `camera_debug.log` 或
  `debug_logs.txt` 快取檔案。

## 目標結構描述形態

結構描述應保持明確。主機擁有的執行階段狀態使用型別化資料表。外掛擁有的
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
skill_upload_chunks(upload_id, byte_offset, size_bytes, chunk_blob)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, relay_origin, topic, environment, distribution, token_debug_suffix, updated_at_ms)
apns_registration_tombstones(node_id, deleted_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, gateway_context_path, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
workspace_path_aliases(alias_key, alias_path, workspace_key, workspace_path, updated_at_ms)
workspace_attestations(workspace_key, attested_at_ms, updated_at_ms)
workspace_generated_bootstrap_hashes(workspace_key, filename, sha256)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, agent_id, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json, cleanup_pending)
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

`memory_index_sources.id` 是穩定的整數主鍵；`(path, source)` 維持唯一。

未來的搜尋功能可以新增 FTS 資料表，而不必變更標準事件資料表：

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

大型值應使用 `blob` 欄位，而非 JSON 字串編碼。對於必須能以一般
SQLite 工具檢視的小型結構化資料，則保留
`value_json`。

`agent_databases` 是此分支的標準登錄檔。在存在真正的代理程式記錄擁有者之前，請勿新增
`agents` 資料表；代理程式設定仍位於
`openclaw.json`。

## Doctor 遷移形態

Doctor 應呼叫一個明確、可產生報告且可安全地
重新執行的遷移步驟：

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` 會在一般設定預檢後叫用狀態遷移實作，並在匯入前建立經過驗證的備份。執行階段
啟動與 `openclaw migrate` 不得匯入舊版 OpenClaw 狀態檔案。

遷移屬性：

- 單次遷移會先探索所有舊版檔案來源並產生計畫，
  然後才變更任何內容。
- Doctor 會在匯入舊版檔案前建立經過驗證的遷移前備份封存檔。
- 匯入具有冪等性，並以來源路徑、mtime、大小、雜湊與目標
  資料表作為識別鍵。
- 目標資料庫提交後，成功處理的來源檔案會被移除或封存。
- 匯入失敗時會保留來源不變，並在
  `migration_runs` 中記錄警告。
- 遷移就緒後，執行階段程式碼只會讀取 SQLite。
- 不需要降級／匯出至執行階段檔案的路徑。

## 遷移清單

將下列項目移至全域資料庫：

- 任務登錄檔執行階段寫入現在使用共用資料庫；未出貨的
  `tasks/runs.sqlite` 側車匯入器已刪除。快照儲存會依任務
  id 執行 upsert，並僅刪除缺少的任務／遞送資料列。
- Task Flow 執行階段寫入現在使用共用資料庫；未出貨的
  `tasks/flows/registry.sqlite` 側車匯入器已刪除。快照儲存會
  依流程 id 執行 upsert，並僅刪除缺少的流程資料列。
- 外掛狀態執行階段寫入現在使用共用資料庫；未出貨的
  `plugin-state/state.sqlite` 側車匯入器已刪除。
- 內建記憶搜尋不再預設使用 `memory/<agentId>.sqlite`；其
  索引資料表位於所屬代理程式資料庫中，而明確選擇加入的
  `memorySearch.store.path` 側車機制已退役，改由 doctor 設定
  遷移處理。
- 內建記憶重新索引只會重設代理程式資料庫中由記憶功能擁有的資料表。
  它不得取代整個 SQLite 檔案，因為同一資料庫還存放
  工作階段、逐字記錄、VFS 資料列、成品和執行階段快取。
- 將沙箱容器／瀏覽器登錄檔從單體和分片 JSON 移出。執行階段
  寫入現在使用共用資料庫；仍保留舊版 JSON 匯入。
- 排程工作定義、排程狀態和執行歷程現在使用共用 SQLite；
  doctor 會匯入／移除舊版 `jobs.json`、`jobs-state.json` 和
  `cron/runs/*.jsonl` 檔案
- 裝置身分／驗證、推播、更新檢查、承諾、OpenRouter 模型
  快取、已安裝外掛索引和應用程式伺服器繫結
- 裝置／節點配對和啟動程序記錄現在使用具型別的 SQLite 資料表
- 裝置配對通知訂閱者和已遞送請求標記現在使用
  共用 SQLite 外掛狀態資料表，而非 `device-pair-notify.json`。
- 語音通話記錄現在使用共用 SQLite 外掛狀態資料表中的
  `voice-call` / `calls` 命名空間，而非 `calls.jsonl`；外掛命令列介面
  會追蹤並摘要由 SQLite 支援的通話歷程。
- QQ Bot 閘道工作階段、已知使用者記錄和 ref-index 引用快取現在使用
  `qqbot` 命名空間（`gateway-sessions`、
  `known-users`、`ref-index`）下的 SQLite 外掛狀態，而非 `session-*.json`、`known-users.json`
  和 `ref-index.jsonl`。這些舊版檔案是快取，不會進行遷移。
- Discord 模型選擇器偏好設定、命令部署雜湊和討論串繫結
  現在使用 `discord` 命名空間
  （`model-picker-preferences`、`command-deploy-hashes`、`thread-bindings`）
  下的 SQLite 外掛狀態，而非 `model-picker-preferences.json`、`command-deploy-cache.json` 和
  `thread-bindings.json`；Discord doctor／設定遷移會匯入並
  移除舊版檔案。
- BlueBubbles 追趕游標和輸入去重標記現在使用
  `bluebubbles` 命名空間（`catchup-cursors`、`inbound-dedupe`）
  下的 SQLite 外掛狀態，而非 `bluebubbles/catchup/*.json` 和
  `bluebubbles/inbound-dedupe/*.json`；BlueBubbles doctor／設定遷移會
  匯入並移除舊版檔案。
- Telegram 更新位移、貼圖快取項目、回覆鏈訊息快取
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
  待處理上傳是短期 SQLite 快取，舊版 JSON 快取檔案
  不會進行遷移。
- Matrix 同步快取、儲存中繼資料、討論串繫結、輸入去重標記、
  啟動驗證冷卻狀態、認證資訊、復原金鑰和 SDK
  IndexedDB 加密快照現在使用
  `matrix` 下的 SQLite 外掛狀態／二進位大型物件命名空間（`sync-store`、`storage-meta`、`thread-bindings`、
  透過核心可宣告去重機制的 `matrix.inbound-dedupe.*`、
  `startup-verification`、`credentials`、`recovery-key`、`idb-snapshots`），
  而非 `bot-storage.json`、`storage-meta.json`、`thread-bindings.json`、
  `inbound-dedupe.json`、`startup-verification.json`、`credentials.json`、
  `recovery-key.json` 和 `crypto-idb-snapshot.json`；Matrix doctor／設定
  遷移會從帳號範圍的 Matrix 儲存根目錄匯入並移除這些舊版檔案
  （以及已退役的各根目錄 `inbound-dedupe` SQLite 資料列）。
- Nostr 匯流排游標和設定檔發布狀態現在使用
  `nostr` 命名空間（`bus-state`、`profile-state`）下的 SQLite 外掛狀態，而非
  `bus-state-*.json` 和 `profile-state-*.json`；Nostr doctor／設定
  遷移會匯入並移除舊版檔案。
- 主動記憶工作階段切換現在使用
  `active-memory/session-toggles` 下的 SQLite 外掛狀態，而非 `session-toggles.json`。
- Skill Workshop 提案佇列和審查計數器現在使用
  `skill-workshop/proposals` 和 `skill-workshop/reviews` 下的 SQLite 外掛狀態，而非
  各工作區的 `skill-workshop/<workspace>.json` 檔案。
- 輸出遞送和工作階段遞送佇列現在共用全域 SQLite
  `delivery_queue_entries` 資料表，並使用不同的佇列名稱
  （`outbound-delivery`、`session-delivery`），而非持久的
  `delivery-queue/*.json`、`delivery-queue/failed/*.json` 和
  `session-delivery-queue/*.json` 檔案。doctor 舊版狀態步驟會匯入
  待處理和失敗資料列、移除過時的已遞送標記，並在匯入後刪除舊版
  JSON 檔案。熱門路由和重試欄位是具型別的欄；JSON
  承載內容僅保留供重播／偵錯使用。
- ACPX 程序租約現在使用 `acpx/process-leases`
  下的 SQLite 外掛狀態，而非 `process-leases.json`。
- 備份和遷移執行中繼資料

將以下項目移入代理程式資料庫：

- 代理程式工作階段根目錄和相容性形狀的工作階段項目承載內容。執行階段寫入已完成：
  熱門工作階段中繼資料可在 `sessions` 中查詢，而
  舊版形狀的完整 `SessionEntry` 承載內容仍位於 `session_entries` 中。
- 代理程式逐字記錄事件。執行階段寫入已完成。
- 壓縮檢查點和逐字記錄快照。執行階段寫入已完成：
  檢查點逐字記錄複本是 SQLite 逐字記錄資料列，而檢查點
  中繼資料記錄於 `transcript_snapshots`。閘道檢查點輔助程式
  現在將這些值稱為逐字記錄快照，而非來源檔案。
- 代理程式 VFS 暫存／工作區命名空間。執行階段 VFS 寫入已完成。
- 子代理程式附件承載內容。執行階段寫入已完成：它們是 SQLite VFS
  種子項目，絕不會成為持久工作區檔案。
- 工具成品。執行階段寫入已完成。
- 執行成品。透過各代理程式
  `run_artifacts` 資料表進行的工作程式執行階段寫入已完成。
- 代理程式本機執行階段快取。透過
  各代理程式 `cache_entries` 資料表進行的工作程式執行階段範圍快取寫入已完成。閘道範圍的模型快取會保留在
  全域資料庫中，除非它們成為代理程式特定快取。
- ACP 父串流記錄。執行階段寫入已完成。
- ACP 重播分類帳工作階段。透過
  `acp_replay_sessions` 和 `acp_replay_events` 進行的執行階段寫入已完成；舊版 `acp/event-ledger.json`
  僅保留作為 doctor 輸入。
- ACP 工作階段中繼資料。透過 `acp_sessions` 進行的執行階段寫入已完成；`sessions.json` 中的舊版
  `entry.acp` 區塊僅作為 doctor 遷移輸入。
- 非明確匯出檔案的軌跡側車。執行階段
  寫入已完成：軌跡擷取會寫入代理程式資料庫的 `trajectory_runtime_events`
  資料列，並將執行範圍的成品鏡像至 SQLite。舊版側車僅作為 doctor
  匯入輸入；匯出可以具體化新的 JSONL 支援套件輸出，
  但不會在執行階段讀取或遷移舊版軌跡／逐字記錄側車。
  執行階段軌跡擷取會公開 SQLite 範圍；JSONL 路徑輔助程式
  僅供匯出／偵錯支援使用，且不會從執行階段模組重新匯出。
  內嵌執行器軌跡中繼資料會記錄 `{agentId, sessionId, sessionKey}`
  身分，而非持久保存逐字記錄定位器。

目前仍將以下項目保留為檔案支援：

- `openclaw.json`
- 提供者或命令列介面認證資訊檔案
- 外掛／套件資訊清單
- 選取磁碟模式時的使用者工作區和 Git 儲存庫
- 供操作員追蹤的記錄，除非特定記錄介面已移出

## 遷移計畫

### 階段 0：凍結邊界

在移動更多資料列之前，先明確定義持久狀態邊界：

- 在全域資料庫中新增 `migration_runs` 資料表。
  舊版狀態遷移執行報告已完成。
- 新增單一由 doctor 擁有的狀態遷移服務，用於從檔案匯入資料庫。
  已完成：`openclaw doctor --fix` 使用舊版狀態遷移實作。
- 將 `plan` 設為唯讀，並讓 `apply` 建立備份、匯入、驗證，然後
  刪除或隔離舊檔案。
  已完成：doctor 會建立經驗證的遷移前備份、將備份路徑
  傳入 `migration_runs`，並重複使用匯入器／移除路徑。
- 新增靜態禁令，使新的執行階段程式碼無法寫入舊版狀態檔案，同時
  遷移程式碼和測試仍可植入／讀取這些檔案。
  目前已遷移的舊版儲存區已完成；防護機制也會掃描巢狀
  測試中的禁用執行階段逐字記錄定位器合約。

### 階段 1：完成全域控制平面

將共用協調狀態保留在 `state/openclaw.sqlite` 中：

- 代理程式和代理程式資料庫登錄檔
- 任務和 Task Flow 分類帳
- 外掛狀態
- 沙箱容器／瀏覽器登錄檔
- 排程／排程器執行歷程
- 配對、裝置、推播、更新檢查、終端介面、OpenRouter／模型快取和其他
  小型閘道範圍執行階段狀態
- 備份和遷移中繼資料
- 閘道媒體附件位元組。執行階段寫入已完成；直接檔案路徑
  是為了與頻道傳送器和沙箱暫存相容而建立的暫時具體化項目。
  執行階段允許清單接受 SQLite 具體化路徑，而非舊版
  狀態／設定媒體根目錄。doctor 會將舊版媒體檔案匯入
  `media_blobs`，並在成功寫入資料列後移除來源檔案。
- 偵錯 Proxy 擷取工作階段、事件和承載內容二進位大型物件。已完成：擷取資料
  位於共用狀態資料庫，並透過共用狀態資料庫的啟動程序、結構、
  WAL 和忙碌逾時設定開啟。承載內容位元組會在
  `capture_blobs.data` 中以 gzip 壓縮；沒有偵錯 Proxy 執行階段側車資料庫覆寫、
  二進位大型物件目錄或僅供 Proxy 擷取使用的產生結構／程式碼產生目標。
  doctor／啟動遷移會匯入已出貨的 `debug-proxy/capture.sqlite` 資料列
  和參照的承載內容二進位大型物件，包括作用中的舊版資料庫／二進位大型物件環境
  覆寫，然後封存這些來源，同時保留 CA 憑證不變。

此階段也會從這些子系統中刪除重複的輔助檔案開啟器、權限輔助函式、WAL
設定、檔案系統清理，以及相容性寫入器。

### 第 2 階段：導入各代理程式專屬資料庫

為每個代理程式建立一個資料庫，並從全域資料庫註冊：

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

全域 `agent_databases` 資料列儲存路徑、結構描述版本、上次出現的
時間戳記，以及基本大小／完整性中繼資料。執行階段程式碼會向登錄檔查詢
代理程式資料庫，而不是直接推導檔案路徑。

代理程式資料庫負責：

- `sessions` 作為標準工作階段根，並將 `session_entries` 作為
  具有相容形狀且附加至該根的承載資料表，以及將
  `session_routes` 作為唯一的作用中 `session_key` 查詢
- `conversations` 和 `session_conversations` 作為附加至工作階段的正規化提供者
  路由識別資訊
- `transcript_events`
- 逐字稿快照與壓縮檢查點。執行階段寫入已完成。
- `vfs_entries`
- `tool_artifacts` 和執行成品
- 代理程式本機執行階段／快取資料列。工作站範圍快取已完成。
- ACP 父串流事件
- 軌跡執行階段事件（若它們不是明確的匯出成品）

### 第 3 階段：取代工作階段儲存區 API

執行階段已完成。檔案形狀的工作階段儲存區介面不再是作用中的
執行階段合約：

- 執行階段不再呼叫 `loadSessionStore(storePath)`，也不再將 `storePath` 視為
  工作階段識別資訊。
- 執行階段資料列操作為 `getSessionEntry`、`upsertSessionEntry`、
  `patchSessionEntry`、`deleteSessionEntry` 和 `listSessionEntries`。
- 整個儲存區重寫輔助函式、檔案寫入器、佇列測試、別名清理，以及
  舊版索引鍵刪除參數已從執行階段移除。
- 已淘汰的根套件相容性匯出仍會將標準
  `sessions.json` 路徑轉接至 SQLite 資料列 API。
- `sessions.json` 剖析僅保留於 doctor 遷移／匯入程式碼和
  doctor 測試中。
- 執行階段生命週期備援會讀取 SQLite 逐字稿標頭，而非 JSONL 的第一
  行。

持續刪除任何重新導入檔案鎖定參數、
將清理／截斷描述為檔案維護的詞彙、以儲存區路徑作為識別資訊，或唯一斷言
為 JSON 持久化的測試。

### 第 4 階段：移動逐字稿、ACP 串流、軌跡和 VFS

讓每個代理程式資料串流都以資料庫為原生儲存方式：

- 逐字稿附加寫入會透過單一 SQLite 交易，確保工作階段
  標頭存在、檢查訊息冪等性、選取父尾端、插入
  `transcript_events`，並在
  `transcript_event_identities` 中記錄可查詢的識別中繼資料。直接附加逐字稿訊息和
  一般持久化 `TranscriptSessionManager` 附加已完成；明確的分支
  操作會保留其明確的父項選擇，且仍寫入 SQLite 資料列，
  不推導任何檔案定位資訊。
- ACP 父串流記錄會成為資料列，而非 `.acp-stream.jsonl` 檔案。已完成。
- ACP 衍生設定不再持久化逐字稿 JSONL 路徑。已完成。
- 執行階段軌跡擷取會直接寫入事件資料列／成品。明確的
  支援／匯出命令仍可產生支援套件 JSONL 成品作為
  匯出格式，但工作階段匯出不會重新建立工作階段 JSONL。已完成。
- 設定為磁碟模式時，磁碟工作區會保留在磁碟上。
- VFS 暫存空間和實驗性的僅限 VFS 工作區模式會使用代理程式資料庫。

遷移會匯入舊 JSONL 檔案一次，在
`migration_runs` 中記錄計數／雜湊，並在完整性檢查後移除已匯入的檔案。

### 第 5 階段：備份、還原、Vacuum 和驗證

備份仍為單一封存檔案：

- 為每個全域及代理程式資料庫建立檢查點。
- 使用 SQLite 備份語意或 `VACUUM INTO` 建立各資料庫的快照。
- 封存壓縮的資料庫快照、設定、外部認證資訊，以及要求的
  工作區匯出。
- 省略原始即時 `*.sqlite-wal` 和 `*.sqlite-shm` 檔案。
- 透過開啟每個資料庫快照並執行 `PRAGMA integrity_check` 來驗證。
  `openclaw backup create` 預設會執行此封存驗證；
  `--no-verify` 只略過寫入後的封存檢查，不會略過快照
  建立完整性檢查。
- 還原會將快照複製回其目標路徑。還原的全域資料庫使用
  版本 `1`；還原的各代理程式資料庫使用版本 `2`，而版本 `1` 快照會在開啟時
  以不可分割方式升級。

### 第 6 階段：工作站執行階段

在資料庫拆分落地期間，工作站模式維持實驗性：

- 工作站會收到代理程式 ID、執行 ID、檔案系統模式和資料庫登錄檔識別資訊。
- 每個工作站會開啟自己的 SQLite 連線。
- 父項保留通道傳遞、核准、設定和取消權限。
- 一開始，每個作用中執行使用一個工作站；只有在生命週期和資料庫
  連線擁有權穩定後，才加入集區。

### 第 7 階段：刪除舊世界

執行階段工作階段管理已完成。舊世界只允許作為明確的
doctor 輸入或支援／匯出輸出：

- 執行階段不寫入 `sessions.json`、逐字稿 JSONL、沙箱登錄檔 JSON、任務
  輔助 SQLite 或外掛狀態輔助 SQLite。
- 不進行 JSON／工作階段檔案清理、檔案逐字稿截斷、工作階段檔案鎖定，
  也不保留鎖定形狀的工作階段測試。
- 執行階段中不保留以讓舊工作階段檔案維持最新為目的的相容性匯出。
- 明確的支援匯出仍是使用者要求的封存／具體化
  格式，且不得將檔案名稱回饋至執行階段識別資訊。

## 備份與還原

備份應為單一封存檔案，但資料庫擷取應採用
SQLite 原生方式：

1. 停止長時間執行的寫入活動，或進入短暫的備份屏障。
2. 為每個全域及代理程式資料庫執行檢查點。
3. 使用 `VACUUM INTO` 將資料庫快照建立至暫存備份目錄。
   需要擁有者定義之 SQLite 功能的外掛結構描述，會採取故障關閉，
   直到擁有者提供安全的快照合約為止。
4. 封存資料庫快照、設定檔、認證資訊目錄、所選
   工作區和資訊清單。
5. 驗證每個 SQLite 快照的檔案形狀，接著開啟標準 OpenClaw
   資料庫並執行 `PRAGMA integrity_check` 加上角色驗證。專用的
   外掛結構描述維持不透明，除非其擁有者提供驗證器。
   `openclaw backup create` 預設會執行此操作；`--no-verify` 僅用於
   刻意略過寫入後的封存檢查。

不要依賴原始即時 `*.sqlite`、`*.sqlite-wal` 和 `*.sqlite-shm` 副本作為
主要備份格式。封存資訊清單應記錄資料庫角色、
代理程式 ID、結構描述版本、來源路徑、快照路徑、位元組大小和完整性
狀態。

還原應從封存快照重建全域資料庫和代理程式資料庫檔案。
全域結構描述維持版本 `1`；各代理程式版本 `1`
快照會進行有限範圍的執行階段升級至版本 `2`。doctor 仍是
檔案至資料庫匯入的唯一擁有者。還原命令會先驗證
封存檔案，接著以經驗證的解壓縮承載資料取代每項資訊清單資產。

## 執行階段重構計畫

1. 新增資料庫登錄檔 API。
   - 解析全域資料庫和各代理程式資料庫路徑。
   - 將全域結構描述維持在 `user_version = 1`。各代理程式資料庫使用版本 `2`，
     並從已發布的版本 `1` 記憶體來源形狀進行一次不可分割遷移。
   - 新增供測試、備份和 doctor 使用的關閉／檢查點／完整性輔助函式。

2. 合併輔助 SQLite 儲存區。
   - 將外掛狀態資料表移至全域資料庫。執行階段
     寫入已完成；未發布的舊版輔助檔案匯入器已刪除。
   - 將任務登錄檔資料表移至全域資料庫。執行階段
     寫入已完成；未發布的舊版輔助檔案匯入器已刪除。
   - 將 Task Flow 資料表移至全域資料庫。執行階段寫入已完成；
     未發布的舊版輔助檔案匯入器已刪除。
   - 將內建記憶體搜尋資料表移至各代理程式資料庫。已完成；明確的
     自訂 `memorySearch.store.path` 現在會由 doctor 設定遷移移除。
     完整重新建立索引只會就地針對記憶體資料表執行；舊的整檔
     交換路徑和輔助索引交換函式已刪除。
   - 從這些子系統刪除重複的資料庫開啟器、WAL 設定、權限輔助函式和
     關閉路徑。

3. 將代理程式擁有的資料表移至各代理程式資料庫。
   - 透過全域資料庫登錄檔按需建立代理程式資料庫。已完成。
   - 將執行階段工作階段項目、逐字稿事件、VFS 資料列和工具
     成品移至代理程式資料庫。已完成。
   - 不要遷移分支本機共用資料庫工作階段項目、逐字稿事件、
     VFS 資料列或工具成品；該配置從未發布。只在 doctor 中保留舊版
     檔案至資料庫匯入。

4. 取代工作階段儲存區 API。
   - 移除 `storePath` 作為執行階段識別資訊。執行階段已完成，且由
     `check:database-first-legacy-stores` 防護：工作階段中繼資料、路由更新、
     命令持久化、命令列介面工作階段清理、Feishu 推理預覽、
     逐字稿狀態持久化、子代理程式深度、認證設定檔工作階段
     覆寫、父項分叉邏輯和 QA-lab 檢查，現在都會從標準
     代理程式／工作階段索引鍵解析資料庫。
     閘道／終端介面／UI／macOS 工作階段清單回應現在會公開 `databasePath`，
     而非舊版 `path`；macOS 偵錯介面會將各代理程式資料庫
     顯示為唯讀狀態，而非寫入 `session.store` 設定。
     `/status`、由聊天驅動的軌跡匯出和命令列介面相依性代理
     不再傳播舊版儲存區路徑；逐字稿用量備援會依
     代理程式／工作階段識別資訊讀取 SQLite。執行階段和橋接測試不再公開
     `storePath`；doctor／遷移輸入負責該舊版欄位名稱。
     閘道合併工作階段載入不再針對
     非範本化 `session.store` 值設有特殊執行階段分支；它會彙總各代理程式 SQLite 資料列。
     舊版工作階段鎖定 doctor 執行路徑及其 `.jsonl.lock` 清理輔助函式
     已移除；SQLite 現在是工作階段並行邊界。
     熱門執行階段呼叫位置使用資料列導向的輔助函式名稱，例如
     `resolveSessionRowEntry`；舊的 `resolveSessionStoreEntry` 相容性
     別名已從執行階段和外掛 SDK 匯出中移除。

- 使用 `{ agentId, sessionKey }` 資料列操作。
  已完成：`getSessionEntry`、`upsertSessionEntry`、`deleteSessionEntry`、
  `patchSessionEntry` 和 `listSessionEntries` 是 SQLite 優先的 API，
  不需要工作階段儲存區路徑。狀態摘要、本機代理程式狀態、健康情況，
  以及 `openclaw sessions` 清單命令現在會直接讀取各代理程式資料列，
  並顯示各代理程式 SQLite 資料庫路徑，而非 `sessions.json` 路徑。
- 以 `upsertSessionEntry`、
  `deleteSessionEntry`、`listSessionEntries` 和 SQL 清理查詢取代整個儲存區刪除／插入。
  執行階段已完成：熱門路徑現在使用資料列 API 和可在衝突時重試的資料列修補；
  剩餘的整個儲存區匯入／取代輔助函式僅限於遷移匯入
  程式碼和 SQLite 後端測試。
  - 刪除 `store-writer.ts` 和寫入器佇列測試。已完成。
  - 從工作階段資料列 upsert／修補中刪除執行階段舊版索引鍵清理和別名刪除參數。已完成。

5. 刪除執行階段 JSON 登錄檔行為。
   - 讓沙箱登錄檔僅透過 SQLite 讀寫。已完成。
   - 僅從遷移步驟匯入單體式與分片式 JSON。已完成。
   - 移除分片式登錄檔鎖定與 JSON 寫入。已完成。

- 如果此結構仍是熱路徑作業狀態，請保留一個具型別的登錄檔資料表，而不要將登錄檔資料列儲存為通用的
  不透明 JSON。已完成。

6. 刪除具有檔案鎖定形式的工作階段變更。
   - 執行階段鎖定建立與執行階段鎖定 API 已完成。
   - 已移除獨立的舊版 `.jsonl.lock` doctor 清理通道。
   - 狀態完整性不再有獨立的孤立逐字稿檔案修剪
     路徑；doctor 遷移會在單一位置匯入並移除舊版 JSONL 來源。
   - 閘道單例協調會使用 `gateway_locks` 下具型別的 SQLite `state_leases` 資料列，
     且不再公開檔案鎖定目錄介面。
   - 通用外掛 SDK 的重複資料刪除持久化不再使用檔案鎖定或 JSON
     檔案；它會寫入共用 SQLite 外掛狀態資料列。已完成。
   - QMD 協調會針對嵌入使用共用 SQLite 租約，並針對每個集合／更新／嵌入寫入器
     使用個別代理程式的 SQLite 租約。執行階段不再
     建立 `qmd/embed.lock.lock` 或 `agents/<agentId>/qmd-write.lock.lock`；
     Doctor 僅移除確定已過時的退役附屬檔案。已完成。

7. 讓工作執行緒具備資料庫感知能力。
   - 工作執行緒會開啟自己的 SQLite 連線。
   - 父程序負責傳遞、頻道回呼與設定。
   - 工作執行緒接收代理程式 ID、執行 ID、檔案系統模式與資料庫登錄檔
     識別資訊，而非即時控制代碼。
   - `vfs-only` 維持實驗性質，並使用代理程式資料庫作為其儲存
     根目錄。
   - 先為每個作用中的執行保留一個工作執行緒。在資料庫連線
     生命週期與取消行為變得單純可靠之前，可暫緩導入集區。

8. 備份整合。
   - 讓備份功能使用 `VACUUM INTO` 建立全域、代理程式與外掛資料庫的快照。
     針對狀態資產下探索到的 `*.sqlite` 檔案已完成；
     若外掛結構描述需要無法取得的擁有者功能，則會採取失敗關閉。
   - 加入標準 SQLite 完整性與結構描述識別資訊的備份驗證，
     並為專用外掛快照加入通用檔案結構驗證。備份建立與預設封存檔驗證已完成。
   - 在 SQLite 中記錄備份執行中繼資料。已透過共用 `backup_runs`
     資料表完成，其中包含封存檔路徑、狀態與資訊清單 JSON。
   - 加入從已驗證封存快照還原的功能。已完成：`openclaw backup
restore` 會在解壓縮前進行驗證、使用驗證器正規化後的
     資訊清單、支援 `--dry-run`，並要求先提供 `--yes`，才會取代
     已記錄的來源路徑。
   - 僅在要求時納入 VFS／工作區匯出；不要將工作階段
     內部資料匯出為 JSON 或 JSONL。

9. 刪除過時的測試與程式碼。已針對已知的執行階段工作階段介面完成。

- 移除會斷言執行階段建立 `sessions.json` 或逐字稿
  JSONL 檔案的測試。核心工作階段儲存區、聊天、閘道逐字稿事件、
  預覽、生命週期、命令工作階段項目更新、自動回覆重設／追蹤，以及
  memory-core 夢境整理固定資料、核准目標路由、工作階段逐字稿
  修復、安全性權限修復、軌跡匯出與工作階段匯出均已完成。
  主動記憶逐字稿測試現在會斷言 SQLite 範圍，且不會建立暫存或
  持久化的 JSONL 檔案。
  已移除舊版心跳偵測逐字稿修剪迴歸測試，因為
  執行階段不再截斷 JSONL 逐字稿。
  代理程式工作階段清單工具測試不再將舊版 `sessions.json` 路徑
  建模為閘道回應結構；應用程式／UI／macOS 測試使用 `databasePath`。
  `/status` 逐字稿使用量測試現在會直接植入 SQLite 逐字稿資料列，
  而非寫入 JSONL 檔案。
  閘道工作階段生命週期測試現在會直接使用 SQLite 逐字稿植入輔助函式；
  重設與刪除涵蓋範圍中已移除舊版單行工作階段檔案固定資料結構。
  `sessions.delete` 不再傳回檔案時代的 `archived: []` 欄位；刪除
  僅回報資料列變更結果。舊版 `deleteTranscript` 選項也已
  移除：刪除工作階段時會移除標準 `sessions` 根目錄，並讓
  SQLite 串聯刪除工作階段所擁有的逐字稿、快照與軌跡資料列，因此沒有
  呼叫端會遺留孤立逐字稿或忘記某個清理分支。
  上下文引擎軌跡擷取測試現在會從隔離的代理程式資料庫讀取 `trajectory_runtime_events`
  資料列，而非讀取
  `session.trajectory.jsonl`。
  Docker MCP 頻道植入指令碼現在會直接植入 SQLite 資料列。直接
  寫入 `sessions.json` 僅限用於 doctor 固定資料。
  工具搜尋閘道端對端測試會從 SQLite 逐字稿資料列讀取工具呼叫證據，
  而非掃描 `agents/<agentId>/sessions/*.jsonl` 檔案。
  Memory-core 主機事件與工作階段語料庫暫存資料列現在位於共用
  SQLite 外掛狀態中；`events.jsonl` 與 `session-corpus/*.txt` 僅為舊版
  doctor 遷移輸入。作用中的資料列使用 `memory/session-ingestion/`
  虛擬路徑，而非 `.dreams/session-corpus`。已移除舊版 memory-core 夢境整理
  修復模組及其命令列介面／閘道測試，因為執行階段不再
  負責該語料庫的檔案封存修復。Memory-core
  橋接／公開成品測試不再公開 `.dreams/events.jsonl`；它們
  會使用由 SQLite 支援的虛擬 JSON 成品名稱。
  公開 SDK／Codex 測試文件現在使用 SQLite 工作階段狀態，而非工作階段
  檔案，且頻道回合範例不再公開 `storePath` 引數。
  Matrix 同步狀態現在會直接使用 SQLite 外掛狀態儲存區。作用中的
  用戶端／執行階段合約會傳遞帳戶儲存根目錄，而非 `bot-storage.json`
  路徑，且 doctor 會先將舊版 `bot-storage.json` 匯入 SQLite，再刪除
  來源。QA Lab Matrix 重新啟動／破壞性情境現在會直接變更 SQLite 同步
  資料列，而非建立或刪除假的 `bot-storage.json` 檔案，且
  E2EE 基礎層會傳遞同步儲存區根目錄，而非假的
  `sync-store.json` 路徑。
  Matrix 儲存根目錄選擇不再依舊版同步／執行緒 JSON
  檔案為根目錄評分；它會使用持久根目錄中繼資料與真實的加密狀態。
  執行階段 SQLite 工作階段後端測試套件不再虛構
  `sessions.json`；舊版來源固定資料現在位於負責匯入的 doctor
  測試中。
  閘道工作階段測試不再公開 `createSessionStoreDir` 輔助函式或
  未使用的暫存工作階段儲存區路徑設定；固定資料目錄會明確指定，而直接
  資料列設定使用 SQLite 工作階段資料列命名。
  僅供 doctor 使用的 JSON5 工作階段儲存區剖析器涵蓋範圍已從基礎設施測試移至
  doctor 遷移測試，因此執行階段測試套件不再負責舊版
  工作階段檔案剖析。
  Microsoft Teams 執行階段 SSO／待上傳測試不再包含 JSON 附屬檔案
  固定資料或剖析器；舊版 SSO 權杖剖析僅存在於外掛
  遷移模組中。Telegram 測試不再植入假的 `/tmp/*.json` 儲存區
  路徑；它們會直接重設由 SQLite 支援的訊息快取。通用
  OpenClaw 測試狀態輔助函式不再公開舊版 `auth-profiles.json`
  寫入器；doctor 驗證遷移測試會在本機負責該固定資料。
  終端介面上次工作階段指標、執行核准、主動記憶
  切換、Matrix 重複資料刪除／啟動驗證、Memory Wiki 來源同步、
  目前對話繫結、上線驗證與 Hermes 密鑰匯入的執行階段測試，不再
  建立舊版附屬檔案，或斷言舊檔名不存在。它們
  會透過 SQLite 資料列與公開儲存區 API 證明行為；doctor／遷移
  測試是唯一應出現舊版來源檔名的位置。
  裝置／節點配對、頻道 allowFrom、重新啟動意圖、
  重新啟動移交、工作階段傳遞佇列項目、設定健康狀態、iMessage
  快取、排程工作、PI 逐字稿標頭、子代理程式登錄檔與受管理
  圖片附件的執行階段測試，也不再為了證明退役的 JSON／JSONL 檔案
  會被忽略或不存在而建立它們。
  PI 溢位復原不再具有 SessionManager 重寫／截斷
  後援：工具結果截斷與上下文引擎逐字稿重寫會變更
  SQLite 逐字稿資料列，然後從資料庫重新整理作用中的提示狀態。
  持久化的 SessionManager 訊息附加會委派給不可分割的 SQLite
  逐字稿附加輔助函式，以進行父項選擇與確保冪等性。一般
  中繼資料／自訂項目附加也會在 SQLite 內選取目前父項，因此
  過時的管理器執行個體不會使 SQLite 之前的父項鏈結競爭問題死灰復燃。
  回合中預先檢查與 `sessions_yield` 的合成 PI 尾端清理，現在會
  直接修剪 SQLite 逐字稿狀態；舊版 SessionManager 尾端移除
  橋接及其測試已刪除。
  壓縮檢查點擷取也僅從 SQLite 建立快照；呼叫端
  不再傳遞即時 SessionManager 作為替代逐字稿來源。
- 僅保留為遷移植入舊版檔案的測試。
- 作用中執行階段介面的 JSON 檔案證明已由 SQL 資料列證明取代。

- 加入靜態禁令，禁止執行階段寫入舊版工作階段／快取 JSON 路徑。
  儲存庫防護已完成。

10. 讓遷移報告可供稽核。
    - 在 SQLite 中記錄遷移執行，包含開始／完成時間戳記、來源
      路徑、來源雜湊、計數、警告與備份路徑。
      已完成：舊版狀態遷移執行現在會持久化 `migration_runs`
      報告，其中包含來源路徑／資料表清單、來源檔案 SHA-256、大小、
      記錄數、警告與備份路徑。
      已完成：舊版狀態遷移執行也會持久化 `migration_sources`
      資料列，以供來源層級稽核及未來的略過／回填決策使用。
    - 讓套用作業具備冪等性。在部分匯入後重新執行時，應
      略過已匯入的來源，或依穩定鍵合併。
      已完成：工作階段索引、逐字稿、傳遞佇列、外掛狀態、工作
      分類帳與代理程式擁有的全域 SQLite 資料列，會透過穩定鍵或
      upsert／replace 語意匯入，因此重新執行時會合併，而不會複製持久
      資料列。
    - 匯入失敗時，必須將原始來源檔案保留在原處。
      已完成：逐字稿匯入失敗時，現在會將原始 JSONL 來源留在
      偵測到的路徑，而 `migration_sources` 會將來源記錄為
      `warning`，並附上供下次 doctor 執行使用的 `removed_source=0`。

## 效能規則

- 每個執行緒／程序使用一個連線即可；不要在工作執行緒之間共用
  控制代碼。
- 使用 WAL、`foreign_keys=ON`、5 秒忙碌逾時，以及簡短的 `BEGIN IMMEDIATE`
  寫入交易。不要在 SQLite 的單次忙碌等待之上再疊加同步鎖定重試。
- 除非／直到非同步交易 API 加入明確的互斥鎖／背壓語意，否則
  寫入交易輔助函式應維持同步。
- 讓父程序的傳遞寫入保持精簡且具交易性。
- 避免重寫整個儲存區；使用資料列層級的 upsert／delete。
- 在移動熱路徑程式碼之前，為依代理程式列出、依工作階段列出、更新時間、執行 ID 與
  到期路徑加入索引。
- 將大型成品、媒體與向量儲存為 BLOB 或分塊 BLOB 資料列，而非
  base64 或數值陣列 JSON。
- 讓不透明的外掛狀態項目保持精簡且範圍明確。
- 為 TTL／到期加入 SQL 清理，而非檔案系統修剪。
  資料庫擁有的執行階段儲存區已完成：媒體、外掛狀態、外掛 Blob、
  持久化重複資料刪除與代理程式快取全都透過 SQLite 資料列到期。其餘
  檔案系統清理僅限於暫時具現化或明確的
  移除命令。

## 靜態禁令

加入儲存庫檢查，讓新增的執行階段舊版狀態路徑寫入無法通過：

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
- `openclaw-workspace-state.json`
- `workspace-state.json`
- `workspace-attestations/*.attested`
- 同層 `<workspace>.attested`
- Matrix `credentials*.json` 和 `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json` / `devices/paired.json` / `devices/bootstrap.json`
  （已於 2026.7 淘汰：執行階段儲存區是共用狀態資料庫中的 `device_pairing_*` /
  `device_bootstrap_tokens`；成對記錄會在
  閘道啟動時匯入，暫時性的待處理／啟動程序資料列則會被捨棄）
- `nodes/pending.json` / `nodes/paired.json`（已於 2026.7 淘汰：在閘道啟動時併入成對的裝置記錄）
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`（已淘汰；僅由 Doctor 匯入至 `web_push_subscriptions`）
- `push/vapid-keys.json`（已淘汰；僅由 Doctor 匯入至 `web_push_vapid_keys`）
- `push/apns-registrations.json`（已淘汰；僅由 Doctor 匯入至 `apns_registrations`）
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
- `plugin-state/state.sqlite`
- 臨時的 `openclaw-state.sqlite` 執行階段附屬檔案
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock.lock`
- `agents/<agentId>/qmd-write.lock.lock`
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
- `openclaw/rescue-pending/*.json`
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
- `SessionManager.open(...)` 以檔案為後端的工作階段開啟器
- `SessionManager.listAll(...)` 和 `TranscriptSessionManager.listAll(...)`
  逐字稿清單外觀介面
- `SessionManager.forkFromSession(...)` 和
  `TranscriptSessionManager.forkFromSession(...)` 逐字稿分支外觀介面
- `SessionManager.newSession(...)` 和 `TranscriptSessionManager.newSession(...)`
  可變工作階段替換外觀介面
- `SessionManager.createBranchedSession(...)` 和
  `TranscriptSessionManager.createBranchedSession(...)` 分支工作階段外觀介面

此禁令應允許測試建立舊版固定資料，並允許遷移程式碼
讀取／匯入／移除舊版檔案來源。尚未發布的 SQLite 附屬檔案仍受禁令約束，
且不會取得 Doctor 匯入豁免。

## 完成條件

- 執行階段資料與快取寫入全域或代理程式 SQLite 資料庫。
- 執行階段不再寫入工作階段索引、逐字稿 JSONL、沙箱登錄
  JSON、任務附屬 SQLite 或外掛狀態附屬 SQLite。刪除尚未發布的任務
  與外掛狀態附屬 SQLite 匯入器。
- 舊版檔案僅由 Doctor 匯入。
- 備份會產生單一封存檔，其中包含精簡的 SQLite 快照與完整性證明。
- 代理程式工作者可搭配磁碟、VFS 暫存空間或實驗性的僅限 VFS
  儲存空間執行。
- 設定與明確指定的認證資訊檔案，仍是唯一預期持久保存的
  非資料庫控制檔案。
- 儲存庫檢查可防止重新引入舊版執行階段檔案儲存區。
