---
read_when:
    - 執行或修正測試
summary: 如何在本機執行測試（vitest），以及何時使用強制／覆蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-07-14T14:10:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- 完整測試套件（測試套件、即時測試、Docker）：[測試](/zh-TW/help/testing)
- 更新與外掛套件驗證：[測試更新與外掛](/zh-TW/help/testing-updates-plugins)

## Agent 預設行為

只有在來源可信任且現有相依套件已安裝妥當時，Agent 工作階段才會在本機執行一個或少數幾個聚焦測試及低成本靜態檢查。絕不在本機執行不受信任的儲存庫工具。較大型的測試套件、會展開型別檢查／程式碼檢查的變更閘門、建置、Docker、套件流程、E2E、即時證明及跨平台驗證，皆透過 Crabbox 遠端執行。受信任維護者的高負載證明預設使用 Blacksmith Testbox。已設定的 Testbox 工作流程會載入認證資訊，因此不受信任的貢獻者或分支程式碼必須改用不含祕密資訊的分支 CI，或經過清理的直接 AWS Crabbox。

不要為預期中的工作預先暖機。等第一個高負載命令準備就緒時，再延遲取得後端；後續高負載命令重複使用傳回的 `tbx_...` ID；每次執行時同步目前的簽出內容，並在交接前停止後端。

首次成功重複使用後，包裝程式會將租用環境的基底、相依套件及 Testbox 工作流程指紋記錄於 `.crabbox/testbox-leases/`。僅修改原始碼時，會繼續重複使用已暖機的環境。若合併基底、鎖定檔、套件管理器輸入、包裝程式或 Testbox 工作流程有所變更，系統會採取失敗關閉策略，並要求全新的租用環境。每次執行仍會同步目前的簽出內容。
`OPENCLAW_TESTBOX_ALLOW_STALE=1` 僅供刻意進行診斷時使用，不可作為發行證明。

下方的本機測試命令適用於人工工作流程與範圍受限的 Agent 證明。若遠端供應者無法使用，必須回報；這不代表可以默默改在本機執行廣泛閘門。

對於不受信任的高負載證明，請使用 `--provider aws` 延遲暖機。每次執行都必須設定 `CRABBOX_ENV_ALLOW=CI`、傳入 `--provider aws --no-hydrate`，並在安裝相依套件或執行測試前使用全新的暫時遠端 `HOME`。使用專供該不受信任來源、全新暖機的租用環境；絕不重複使用受信任或先前已載入認證資訊的租用環境。從乾淨且受信任的 `main` 簽出內容啟動已安裝且受信任的 Crabbox 二進位檔，並只使用 `--fresh-pr` 擷取遠端 PR；絕不在本機執行不受信任簽出內容中的包裝程式或設定。取消設定 `CRABBOX_AWS_INSTANCE_PROFILE`，且除非解析後的 `aws.instanceProfile` 為空，否則採取失敗關閉策略。進行任何安裝／測試之前，請使用受信任的絕對路徑工具要求 IMDSv2 權杖、證明 IAM 認證資訊端點傳回 404，並驗證遠端 `git rev-parse HEAD` 等於完整且已審查的 PR 頭部 SHA。將租用環境綁定至該 SHA，並在頭部變更時停止及重新暖機。將乾淨 `main` 中受信任的 `scripts/crabbox-untrusted-bootstrap.sh` 與 `--fresh-pr` 一併上傳；它會安裝固定版本的 Node/pnpm、驗證 SHA 與套件管理器版本固定設定、隔離 `HOME`、安裝相依套件，然後執行要求的測試。若代理程式無法證明不存在角色或遠端 PR，請使用不含祕密資訊的分支 CI。不要使用 `hydrate-github`、`--no-sync` 或會載入認證資訊的 Testbox 工作流程。
取消設定所有 `CRABBOX_TAILSCALE*` 覆寫、強制使用 `--network public
--tailscale=false`、清除出口節點／LAN 旗標，並要求 `crabbox inspect` 在上傳任何指令碼之前，回報未包含任何 Tailscale 狀態的公用網路連線。

## 例行本機順序

1. `pnpm test:changed` 用於變更範圍的 Vitest 證明。
2. `pnpm test <path-or-filter>` 用於單一檔案、目錄或明確目標。
3. 只有在刻意需要完整本機 Vitest 測試套件時，才使用 `pnpm test`。

在 Codex 工作樹或連結／稀疏簽出中，Agent 應避免直接在本機使用
`pnpm test*`／`pnpm check*`／`pnpm crabbox:run`：

- 相依套件已就緒時的範圍受限聚焦證明：
  `node scripts/run-vitest.mjs <path-or-filter>`。
- 先分類再進行的變更檢查：`node scripts/check-changed.mjs`；僅文件、無變更及小型中繼資料方案會在相依套件已就緒時保留於本機執行，而高負載或缺少相依套件的方案則委派給 Testbox。
- 明確保留租用環境的廣泛證明：`node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`，使 pnpm 在 Testbox 內執行。
- 包裝程式最後的 `exitCode` 與計時 JSON 即為命令結果。委派的 Blacksmith GitHub Actions 執行在 SSH 命令成功後可能顯示 `cancelled`，因為 Testbox 是從保活動作外部停止；將其視為失敗前，請先檢查包裝程式摘要與命令輸出。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：對於 `pnpm check:changed` 及指定目標的 `pnpm test ...` 等命令，會將高負載檢查的序列化保留在目前工作樹內，而不是 Git 共用目錄中。只有在高容量本機主機上刻意跨連結工作樹執行獨立檢查時，才使用此功能。

## 核心命令

測試包裝程式執行結束時會顯示簡短的 `[test] passed|failed|skipped ... in ...` 摘要；Vitest 本身的持續時間行則保留為各分片的詳細資訊。

| 命令                                              | 功能                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 明確的檔案／目錄目標會透過具範圍的 Vitest 流程路由。未指定目標的執行屬於完整測試套件證明：固定分片群組會展開為葉節點設定，以便在本機平行執行，並在開始前列印預期的分片展開數量。擴充功能群組一律展開為各擴充功能專屬的分片設定，而非單一龐大的根專案程序。           |
| `pnpm test:changed`                               | 低成本智慧變更測試執行：根據直接測試編輯、同層 `*.test.ts` 檔案、明確的原始碼對應關係及本機匯入圖產生精確目標。除非廣泛／設定／套件變更能對應至精確測試，否則會略過。                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 明確的廣泛變更測試執行；當測試框架／設定／套件編輯應改用 Vitest 較廣泛的變更測試行為時使用。                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | 釋放已設定的 OpenClaw 閘道連接埠（預設 `18789`），然後使用隔離的閘道連接埠執行完整測試套件，避免伺服器測試與正在執行的執行個體發生衝突。                                                                                                                                                                                    |
| `pnpm test:coverage`                              | 針對預設單元測試流程（`vitest.unit.config.ts`）輸出資訊用途的 V8 覆蓋率報告；不強制套用覆蓋率門檻。                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | 僅針對自 `origin/main` 起變更的檔案產生單元測試覆蓋率。                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | 顯示相對於 `origin/main` 的差異所觸發的架構流程。                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | 選擇執行方式前先對變更流程進行分類。僅文件、無變更及小型中繼資料方案會在相依套件已就緒時保留於本機執行；包含型別檢查／程式碼檢查展開、其他高負載流程或缺少本機相依套件的方案，則會在 CI 外委派給 Crabbox／Testbox。不會執行 Vitest；測試證明請使用 `pnpm test:changed` 或 `pnpm test <target>`。 |

## 共用測試狀態與程序輔助工具

- `src/test-utils/openclaw-test-state.ts`：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定固定資料、工作區、Agent 目錄或驗證設定檔儲存區時，請從 Vitest 使用。
- `pnpm test:env-mutations:report`：以非阻斷方式回報直接修改 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` 或相關環境變數鍵的測試／測試框架。使用此功能尋找適合遷移至共用測試狀態輔助工具的候選項目。
- `test/helpers/openclaw-test-instance.ts`：將需要執行中閘道、命令列介面環境、日誌擷取及清理作業的程序層級 E2E 測試集中處理。
- 載入 `scripts/lib/docker-e2e-image.sh` 的 Docker／Bash E2E 流程可將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並使用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多主目錄指令碼可傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。`node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 會寫入可供載入的主機環境檔案（`create` 前的 `--` 可避免較新的 Node 執行環境將 `--env-file` 視為 Node 旗標）。啟動閘道的流程可載入 `scripts/lib/openclaw-e2e-instance.sh`，用於進入點解析、模擬 OpenAI 啟動、前景／背景啟動、就緒探測、狀態環境變數匯出、日誌傾印及程序清理。

## Control UI、終端介面與擴充功能流程

- **Control UI 模擬 E2E：** `pnpm test:ui:e2e` 會執行 Vitest + Playwright 測試管線，啟動 Vite Control UI，並以真實 Chromium 頁面連線至模擬的閘道 WebSocket。測試位於 `ui/src/**/*.e2e.test.ts`；共用模擬與控制項位於 `ui/src/test-helpers/control-ui-e2e.ts`。`pnpm test:e2e` 包含此測試管線。代理程式執行預設使用 Testbox/Crabbox，包括針對性驗證；僅在明確需要本機備援時使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`。
- **終端介面 PTY 測試：** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` 會執行快速的模擬後端 PTY 測試管線。`OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 或 `pnpm tui:pty:test:watch --mode local` 會執行較慢的 `tui --local` 冒煙測試，該測試僅模擬外部模型端點。請斷言穩定的可見文字或測試資料呼叫，而非原始 ANSI 快照。
- `pnpm test:extensions` 和 `pnpm test extensions` 會執行所有擴充功能／外掛分片。負載較重的頻道外掛、瀏覽器外掛和 OpenAI 會使用專用分片執行；其他外掛群組則維持批次執行。`pnpm test extensions/<id>` 會執行一個內建外掛測試管線。
- 具有同層測試的原始碼檔案會先對應至該同層測試，再退回至範圍較廣的目錄 glob。對 `src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下輔助程式的編輯，會使用本機匯入圖來執行匯入它們的測試；當相依性路徑明確時，不會廣泛執行每個分片。
- 合約目錄目標會展開至各自的合約測試管線：`pnpm test src/channels/plugins/contracts` 會執行四個頻道合約設定，而 `pnpm test src/plugins/contracts` 會執行外掛合約設定，因為通用的 `channels`/`plugins` 專案會排除 `contracts/**`。
- `auto-reply` 會拆分成三個專用設定（`core`、`top-level`、`reply`），避免回覆測試框架佔用較輕量的頂層狀態／權杖／輔助程式測試的大部分資源。
- 選定的 `plugin-sdk` 和 `commands` 測試檔案會透過專用的輕量測試管線執行，這些管線僅保留 `test/setup.ts`，而執行階段負載較重的案例則留在其既有測試管線中。
- 基礎 Vitest 設定預設為 `pool: "threads"` 和 `isolate: false`，並在整個儲存庫的設定中啟用共用的非隔離執行器。
- `pnpm test:channels` 會執行 `vitest.channels.config.ts`。

## 閘道與 E2E

- 閘道整合為選用功能：`OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway`。
- `pnpm test:e2e`：儲存庫 E2E 彙總 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`。
- `pnpm test:e2e:gateway`：閘道端對端冒煙測試（多執行個體 WS/HTTP/節點配對）。在 `vitest.e2e.config.ts` 中預設使用 `threads` + `isolate: false` 與自適應工作程序；使用 `OPENCLAW_E2E_WORKERS=<n>` 調整，使用 `OPENCLAW_E2E_VERBOSE=1` 啟用詳細記錄。
- `pnpm test:live`：供應商即時測試（Claude/Minimax/DeepSeek/z.ai/等，由 `*.live.test.ts` 控制）。需要 API 金鑰以及 `LIVE=1`（或 `OPENCLAW_LIVE_TEST=1`）才能取消略過；使用 `OPENCLAW_LIVE_TEST_QUIET=0` 啟用詳細輸出。

## 完整 Docker 套件（`pnpm test:docker:all`）

建置共用的即時測試映像，將 OpenClaw 一次封裝為 npm tarball，建置／重複使用精簡的 Node/Git 執行器映像，以及將該 tarball 安裝至 `/app` 的功能映像，接著透過加權排程器執行 Docker 冒煙測試管線。`scripts/package-openclaw-for-docker.mjs` 是唯一的本機／CI 套件封裝器，會先驗證 tarball 與 `dist/postinstall-inventory.json`，再交由 Docker 使用。

- 精簡映像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）：安裝程式／更新／外掛相依性測試管線；掛載預先建置的 tarball，而非複製的儲存庫原始碼。
- 功能映像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）：一般已建置應用程式功能測試管線。
- 測試管線定義：`scripts/lib/docker-e2e-scenarios.mjs`。規劃器：`scripts/lib/docker-e2e-plan.mjs`。執行器：`scripts/test-docker-all.mjs`。
- `node scripts/test-docker-all.mjs --plan-json` 會輸出由排程器管理的 CI 計畫（測試管線、映像種類、套件／即時映像需求、狀態情境、認證資訊檢查），但不建置或執行 Docker。

排程調整參數（環境變數，括號內為預設值）：

| 環境變數                                                                                                         | 預設值             | 用途                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | 處理程序插槽。                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | 供應商敏感的尾端集區。                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 高負載即時供應商測試管線上限。                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm 資源測試管線上限。                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | 服務資源測試管線上限。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | 各供應商的高負載測試管線上限。                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | 更嚴格的各供應商上限。                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | 適用於較大型主機的覆寫值。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | 測試管線啟動之間的延遲，可避免本機 Docker 常駐程式出現大量建立請求。                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | 各測試管線的備援逾時；選定的即時／尾端測試管線使用較嚴格的上限。                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 暫時性即時供應商失敗的重試次數。                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | 僅列印測試管線資訊清單，不執行 Docker。                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | 執行中測試管線的狀態列印間隔。                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | 重複使用 `.artifacts/docker-tests/lane-timings.json`，依最長優先順序排列；設為 `0` 可停用。                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` 僅用於確定性／本機測試管線，`only` 僅用於即時供應商測試管線。別名：`pnpm test:docker:local:all`、`pnpm test:docker:live:all`。僅即時模式會將主要與尾端即時測試管線合併為一個最長優先集區，讓供應商分組將 Claude/Codex/Gemini 工作一起打包。 |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | 命令列介面後端 Docker 設定逾時。                                                                                                                                                                                                                                                          |

資源上限的環境變數模式為 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`（資源名稱轉為大寫，非英數字元會合併為 `_`）。

其他行為：執行器預設會預先檢查 Docker、清理過期的 OpenClaw E2E 容器、在相容的執行通道之間共用供應商命令列介面工具快取，並在第一次失敗後停止排程新的集區執行通道，除非已設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`。如果某個執行通道在低平行度主機上超過有效權重／資源上限，它仍可從空集區啟動並獨立執行，直到釋放容量。各執行通道的記錄、`summary.json`、`failures.json` 與階段計時會寫入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 檢查緩慢的執行通道，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 輸出成本低廉的針對性重新執行命令。

### 值得注意的 Docker 執行通道

| 命令                                                                     | 驗證內容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | 以 Chromium 為後端、使用原始 CDP 與隔離閘道的原始碼 E2E 容器；`browser doctor --deep` CDP 角色快照包含連結 URL、由游標提升為可點擊項目的元素、iframe 參照與框架中繼資料。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | 使用 `skills.install.allowUploadedArchives: false` 在純淨的 Docker 執行器中安裝已封裝的 tarball、從即時 ClawHub 搜尋解析目前的 Skill slug、透過 `openclaw skills install` 安裝，並驗證 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 與 `skills info --json`。                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | 聚焦於命令列介面後端的即時探測；Gemini 具有對應的 `:resume` 與 `:mcp` 別名。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | Docker 化的 OpenClaw + Open WebUI：登入、檢查 `/api/models`，並透過 `/api/chat/completions` 執行真正的代理聊天。需要可用的即時模型金鑰，且會提取外部映像檔；不預期能像單元／E2E 測試套件一樣在 CI 中保持穩定。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | 預先植入資料的閘道容器，加上一個會產生 `openclaw mcp serve` 的用戶端容器：經路由的對話探索、逐字稿讀取、附件中繼資料、即時事件佇列行為、外送傳送路由，以及透過真實 stdio 橋接器傳送的 Claude 風格通道與權限通知（斷言會直接讀取原始 stdio MCP 訊框）。                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | 在已污染的舊使用者測試樣本上安裝已封裝的 tarball、不使用即時供應商／通道金鑰執行套件更新與非互動式 doctor、啟動回送閘道，並檢查代理程式／通道設定／外掛允許清單／工作區／工作階段檔案／過期的舊版外掛相依性狀態／啟動／RPC 狀態是否得以保留。                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | 預設安裝 `openclaw@latest`、植入逼真的現有使用者檔案、透過內建的 `openclaw config set` 配方進行設定、更新至已封裝的 tarball、執行非互動式 doctor、寫入 `.artifacts/upgrade-survivor/summary.json`，並檢查 `/healthz`、`/readyz` 與 RPC 狀態。可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫、使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 擴充矩陣，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 新增情境測試樣本（包含 `configured-plugin-installs` 與 `stale-source-plugin-shadow`）。套件驗收會將這些公開為 `published_upgrade_survivor_baseline(s)`／`_scenarios`，並解析 `last-stable-4` 或 `all-since-2026.4.23` 等中繼權杖。 |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` 情境中的已發布升級存續測試框架，預設從 `openclaw@2026.4.23` 開始。`Update Migration` 工作流程會使用 `baselines=all-since-2026.4.23` 擴充此測試，以證明完整發布 CI 以外的已設定外掛相依性清理。                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | 針對本機路徑、`file:`、具有提升相依性的 npm 登錄套件、git 移動參照、ClawHub 測試樣本、市集更新，以及 Claude 套件啟用／檢查的安裝／更新冒煙測試。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## 本機 PR 閘門

若要執行本機 PR 合併／閘門檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高負載主機上偶發失敗，請先重新執行一次，再將其視為迴歸，接著使用 `pnpm test <path/to/test>` 加以隔離。對於記憶體受限的主機：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 測試效能工具

- `pnpm test:perf:imports`：啟用 Vitest 匯入時間與匯入明細報告，同時仍對明確的檔案／目錄目標使用限定範圍的執行通道路由。`pnpm test:perf:imports:changed` 將相同的效能分析限定於自 `origin/main` 起已變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對相同的已提交 git 差異，比較經路由的變更模式路徑與原生根專案執行的基準；`pnpm test:perf:changed:bench -- --worktree` 則在不先提交的情況下，對目前工作樹的變更集進行基準測試。
- `pnpm test:perf:profile:main` 會為 Vitest 主執行緒寫入 CPU 效能分析（`.artifacts/vitest-main-profile`）；`pnpm test:perf:profile:runner` 會為單元測試執行器寫入 CPU 與堆積效能分析（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：依序執行每個完整測試套件的 Vitest 葉節點設定，並寫入分組的執行時間資料，以及各設定的 JSON／記錄成品。完整測試套件報告預設會隔離檔案，因此先前檔案所保留的模組圖與 GC 暫停時間不會計入後續斷言；只有在刻意分析共用工作執行緒的累積情況時，才傳入 `-- --no-isolate`。測試效能代理程式會在嘗試修正緩慢測試前，以此作為基準。`pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` 會比較效能導向變更前後的分組報告。
- 完整、擴充功能與包含模式的分片執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機計時資料；後續的完整設定執行會使用這些計時來平衡較慢與較快的分片。包含模式的 CI 分片會將分片名稱附加至計時鍵，讓篩選後的分片計時保持可見，而不會取代完整設定的計時資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機計時成品。

## 基準測試

<Accordion title="模型延遲（scripts/bench-model.ts）">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`。預設提示詞：“只用一個單字回覆：ok。不要使用標點符號或額外文字。”

</Accordion>

<Accordion title="命令列介面啟動（scripts/bench-cli-startup.ts）">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

預設集：

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 合併兩個預設集

輸出包含 `sampleCount`、平均值、p50、p95、最小值／最大值、結束代碼／訊號分布，以及每個命令的最大 RSS。`--cpu-prof-dir`／`--heap-prof-dir` 會為每次執行寫入 V8 設定檔。

儲存的輸出：`pnpm test:startup:bench:smoke` 會寫入 `.artifacts/cli-startup-bench-smoke.json`；`pnpm test:startup:bench:save` 會寫入 `.artifacts/cli-startup-bench-all.json`（`runs=5 warmup=1`）。簽入的測試資料：`test/fixtures/cli-startup-bench.json`，由 `pnpm test:startup:bench:update` 重新整理，並由 `pnpm test:startup:bench:check` 比較。

</Accordion>

<Accordion title="閘道啟動（scripts/bench-gateway-startup.ts）">

預設使用位於 `dist/entry.js` 的已建置命令列介面進入點；請先執行 `pnpm build`。若要改為測量原始碼執行器，請傳入 `--entry scripts/run-node.mjs`，並將這些結果與已建置進入點的基準分開保存。

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

案例 ID：`default`、`skipChannels`（略過頻道啟動）、`oneInternalHook`、`allInternalHooks`、`fiftyPlugins`（50 個資訊清單外掛）、`fiftyStartupLazyPlugins`（50 個啟動時延遲載入的資訊清單外掛）。

輸出包含第一個程序輸出、`/healthz`、`/readyz`、HTTP 監聽記錄時間、閘道就緒記錄時間、CPU 時間、CPU 核心比率、最大 RSS、堆積、啟動追蹤指標、事件迴圈延遲，以及外掛查詢表的詳細指標。此指令碼會在子閘道環境中設定 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`。

`/healthz` 代表存活狀態（HTTP 伺服器可以回應）。`/readyz` 代表可用就緒狀態（啟動外掛的伴隨程序、頻道，以及附加後攸關就緒狀態的工作均已穩定）。啟動掛鉤會以非同步方式派送，不屬於就緒保證的一部分。就緒記錄時間是閘道的內部時間戳記，可用於程序端歸因，但不能取代外部 `/readyz` 探查。

比較變更時，請使用 JSON 輸出或 `--output`。只有當追蹤輸出指出問題位於匯入、編譯或僅靠階段計時無法解釋的 CPU 密集工作時，才使用 `--cpu-prof-dir`。

</Accordion>

<Accordion title="閘道重新啟動（scripts/bench-gateway-restart.ts）">

僅支援 macOS 和 Linux（使用 SIGUSR1 進行程序內重新啟動；在 Windows 上會立即失敗）。預設同樣使用上述閘道啟動的已建置進入點，也可透過 `--entry scripts/run-node.mjs` 覆寫。

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

案例 ID：`skipChannels`、`skipChannelsAcpxProbe`（開啟 ACPX 啟動探查）、`skipChannelsNoAcpxProbe`（關閉探查）、`default`、`fiftyPlugins`。

輸出包含下一個 `/healthz`、下一個 `/readyz`、停機時間、重新啟動就緒計時、CPU、RSS、替代程序的啟動追蹤指標，以及訊號處理、進行中工作排空、關閉階段、下次啟動、就緒計時和記憶體快照的重新啟動追蹤指標。此指令碼會設定 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 和 `OPENCLAW_GATEWAY_RESTART_TRACE=1`。

當變更涉及重新啟動訊號、關閉處理常式、重新啟動後的啟動、伴隨程序關閉、服務交接或重新啟動後的就緒狀態時，請使用此基準測試。先從 `skipChannels` 開始，將閘道機制與頻道啟動隔離；只有在狹義案例已能解釋重新啟動路徑後，才使用 `default` 或外掛密集案例。追蹤指標只是歸因提示，而非定論——應根據多個樣本、相符的擁有者範圍、`/healthz`／`/readyz` 行為，以及使用者可見的重新啟動合約來判斷重新啟動變更。

</Accordion>

## 新手引導端對端測試（Docker）

選用；僅容器化新手引導煙霧測試需要。在乾淨的 Linux 容器中執行完整的冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

透過虛擬終端機驅動互動式精靈，驗證設定／工作區／工作階段檔案，接著啟動閘道並執行 `openclaw health`。

## QR 匯入煙霧測試（Docker）

確保受維護的 QR 執行階段輔助工具可在支援的 Docker Node 執行階段下載入（預設為 Node 24，相容於 Node 22）：

```bash
pnpm test:docker:qr
```

## 相關內容

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與外掛](/zh-TW/help/testing-updates-plugins)
