---
read_when:
    - 執行或修正測試
summary: 如何在本機執行測試（vitest），以及何時使用強制／覆蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-07-11T21:47:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- 完整測試套件（測試套組、即時測試、Docker）：[測試](/zh-TW/help/testing)
- 更新與外掛套件驗證：[測試更新與外掛](/zh-TW/help/testing-updates-plugins)

## 代理程式預設行為

代理程式工作階段會透過 Crabbox 在遠端執行測試及運算密集型驗證。受信任的維護者程式碼預設使用 Blacksmith Testbox。設定的 Testbox 工作流程會載入憑證，因此不受信任的貢獻者或分支程式碼必須改用無密鑰的分支 CI，或經過淨化的 AWS 直接 Crabbox。

當受信任的程式碼工作可能需要測試或大量驗證時，應立即在背景命令工作階段中預熱；在環境載入期間繼續工作，重複使用傳回的 `tbx_...` ID，每次執行時同步目前的檢出內容，並在交接前將其停止：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

第一次成功重複使用後，包裝器會將租用環境的基底、相依套件及 Testbox 工作流程指紋記錄於 `.crabbox/testbox-leases/`。僅修改原始碼時，會繼續重複使用已預熱的環境。若合併基底、鎖定檔、套件管理器輸入、包裝器或 Testbox 工作流程有所變更，系統會採取失敗即關閉策略，並要求使用新的租用環境。每次執行仍會同步目前的檢出內容。
`OPENCLAW_TESTBOX_ALLOW_STALE=1` 僅供刻意進行診斷使用，不可作為發布驗證。

以下本機測試命令適用於人工工作流程，或使用者明確要求的代理程式備援方案。若遠端供應商無法使用，必須回報；這不代表可以默默執行大範圍的本機閘門檢查。

對於不受信任的程式碼，請使用 `--provider aws` 預熱。每次執行都必須設定 `CRABBOX_ENV_ALLOW=CI`、傳入 `--provider aws --no-hydrate`，並在安裝相依套件或執行測試前使用全新的暫時遠端 `HOME`。請使用專供該不受信任來源使用的新預熱租用環境；絕不可重複使用受信任或先前已載入憑證的租用環境。請從乾淨且受信任的 `main` 檢出內容啟動已安裝的受信任 Crabbox 二進位檔，並僅使用 `--fresh-pr` 擷取遠端 PR；絕不可在本機執行不受信任檢出內容中的包裝器或設定。取消設定 `CRABBOX_AWS_INSTANCE_PROFILE`，且除非解析後的 `aws.instanceProfile` 為空，否則採取失敗即關閉策略。在任何安裝或測試前，使用受信任的絕對路徑工具要求提供 IMDSv2 權杖、證明 IAM 憑證端點傳回 404，並確認遠端 `git rev-parse HEAD` 等於經完整審查的 PR 頭部 SHA。將租用環境綁定至該 SHA，並在頭部發生變更時停止並重新預熱。搭配 `--fresh-pr`，從乾淨的 `main` 上傳受信任的 `scripts/crabbox-untrusted-bootstrap.sh`；此指令碼會安裝鎖定版本的 Node/pnpm、驗證 SHA 與套件管理器版本鎖定、隔離 `HOME`、安裝相依套件，然後執行指定的測試。若代理服務無法證明沒有角色，或遠端 PR 不存在，請使用無密鑰的分支 CI。請勿使用 `hydrate-github`、`--no-sync`，或已載入憑證的 Testbox 工作流程。
取消設定所有 `CRABBOX_TAILSCALE*` 覆寫值，強制使用 `--network public
--tailscale=false`，清除出口節點／區域網路旗標，並在上傳任何指令碼前，要求 `crabbox inspect` 回報使用公開網路且沒有 Tailscale 狀態。

## 例行本機執行順序

1. 使用 `pnpm test:changed` 對變更範圍執行 Vitest 驗證。
2. 使用 `pnpm test <path-or-filter>` 測試單一檔案、目錄或明確目標。
3. 僅在刻意需要完整本機 Vitest 測試套組時使用 `pnpm test`。

在 Codex 工作樹或連結／稀疏檢出中，代理程式應避免直接在本機執行 `pnpm test*` / `pnpm check*` / `pnpm crabbox:run`：

- 若使用者明確要求對小型檔案採用本機備援：
  `node scripts/run-vitest.mjs <path-or-filter>`。
- 變更閘門或大範圍驗證：使用 `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`，讓 pnpm 在 Testbox 內執行。
- 包裝器最終的 `exitCode` 與計時 JSON 即為命令結果。委派的 Blacksmith GitHub Actions 執行可能會在 SSH 命令成功後顯示 `cancelled`，因為 Testbox 是從保活動作外部停止的；在將其視為失敗前，請先檢查包裝器摘要與命令輸出。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：針對 `pnpm check:changed` 與定向 `pnpm test ...` 等命令，將重量級檢查的序列化限制在目前工作樹內，而非 Git 共用目錄。僅限在高效能本機主機上刻意跨連結工作樹執行獨立檢查時使用。

## 核心命令

測試包裝器執行結束時會顯示簡短的 `[test] passed|failed|skipped ... in ...` 摘要；Vitest 本身的持續時間列則保留為各分片的詳細資訊。

| 命令                                              | 功能                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 明確指定的檔案／目錄目標會透過限定範圍的 Vitest 執行通道執行。未指定目標的執行屬於完整測試套組驗證：固定分片群組會展開為葉節點設定，以供本機平行執行，並在開始前列印預期的分片分散配置。擴充功能群組一律展開為各擴充功能專屬的分片設定，而非單一龐大的根專案程序。 |
| `pnpm test:changed`                               | 低成本的智慧型變更測試執行：根據直接修改的測試、同層 `*.test.ts` 檔案、明確的原始碼對應關係及本機匯入圖，精準選擇目標。除非大範圍／設定／套件變更可對應至特定測試，否則會予以略過。                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 明確的大範圍變更測試執行；當測試框架／設定／套件修改應回退至 Vitest 較廣泛的變更測試行為時使用。                                                                                                                                                                                                              |
| `pnpm test:force`                                 | 釋放設定的 OpenClaw 閘道連接埠（預設為 `18789`），然後使用隔離的閘道連接埠執行完整測試套組，避免伺服器測試與正在執行的執行個體發生衝突。                                                                                                                                                                          |
| `pnpm test:coverage`                              | 針對預設單元測試通道（`vitest.unit.config.ts`）產生僅供參考的 V8 覆蓋率報告；不強制執行任何覆蓋率門檻。                                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | 僅針對自 `origin/main` 起變更的檔案產生單元測試覆蓋率。                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | 顯示相對於 `origin/main` 的差異所觸發的架構通道。                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | 在 CI 外預設委派給 Crabbox/Testbox，接著於遠端子程序內執行智慧型變更檢查閘門：針對受影響的通道執行格式化、型別檢查、程式碼檢查及防護命令。不執行 Vitest；請使用 `pnpm test:changed` 或 `pnpm test <target>` 進行測試驗證。                                                                      |

## 共用測試狀態與程序輔助工具

- `src/test-utils/openclaw-test-state.ts`：當 Vitest 測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定固定資料、工作區、代理程式目錄或驗證設定檔儲存區時使用。
- `pnpm test:env-mutations:report`：針對直接修改 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` 或相關環境變數鍵的測試／測試框架，產生非阻斷式報告。可用於找出應遷移至共用測試狀態輔助工具的項目。
- `test/helpers/openclaw-test-instance.ts`：供需要執行中閘道、命令列介面環境、日誌擷取與集中清理的程序層級端對端測試使用。
- 引用 `scripts/lib/docker-e2e-image.sh` 的 Docker/Bash 端對端測試通道，可將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並使用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多主目錄指令碼可傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。`node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 會寫入可由主機引用的環境檔案（`create` 前的 `--` 可防止較新的 Node 執行環境將 `--env-file` 視為 Node 旗標）。啟動閘道的通道可引用 `scripts/lib/openclaw-e2e-instance.sh`，以處理進入點解析、模擬 OpenAI 啟動、前景／背景啟動、就緒探測、狀態環境匯出、日誌傾印及程序清理。

## 控制介面、終端介面與擴充功能通道

- **Control UI 模擬端對端測試：** `pnpm test:ui:e2e` 會執行 Vitest + Playwright 測試通道，啟動 Vite Control UI，並驅動真實的 Chromium 頁面與模擬的閘道 WebSocket 互動。測試位於 `ui/src/**/*.e2e.test.ts`；共用模擬與控制項位於 `ui/src/test-helpers/control-ui-e2e.ts`。`pnpm test:e2e` 包含此測試通道。代理程式執行預設使用 Testbox/Crabbox，包括針對性驗證；只有在明確採用本機備援方案時，才使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`。
- **終端介面 PTY 測試：** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` 會執行快速的假後端 PTY 測試通道。`OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 或 `pnpm tui:pty:test:watch --mode local` 會執行較慢的 `tui --local` 冒煙測試，且僅模擬外部模型端點。請對穩定的可見文字或測試資料呼叫進行斷言，而非原始 ANSI 快照。
- `pnpm test:extensions` 和 `pnpm test extensions` 會執行所有擴充功能／外掛分片。重量級通道外掛、瀏覽器外掛和 OpenAI 會以專用分片執行；其他外掛群組則維持批次執行。`pnpm test extensions/<id>` 會執行單一內建外掛測試通道。
- 具有同層測試的原始碼檔案會先對應至該同層測試，再退回使用範圍更廣的目錄 glob。修改 `src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的輔助程式時，若相依路徑明確，會使用本機匯入圖來執行匯入這些輔助程式的測試，而不是廣泛執行所有分片。
- 合約目錄目標會展開至各自的合約測試通道：`pnpm test src/channels/plugins/contracts` 會執行四個通道合約設定，而 `pnpm test src/plugins/contracts` 會執行外掛合約設定，因為一般的 `channels`／`plugins` 專案會排除 `contracts/**`。
- `auto-reply` 會拆分為三個專用設定（`core`、`top-level`、`reply`），避免回覆測試框架拖慢較輕量的頂層狀態、權杖和輔助程式測試。
- 選定的 `plugin-sdk` 和 `commands` 測試檔案會透過專用的輕量測試通道執行，這些通道只保留 `test/setup.ts`；大量使用執行階段的案例則留在既有測試通道。
- Vitest 基礎設定預設為 `pool: "threads"` 和 `isolate: false`，並在整個儲存庫的設定中啟用共用的非隔離執行器。
- `pnpm test:channels` 會執行 `vitest.channels.config.ts`。

## 閘道與端對端測試

- 閘道整合需明確啟用：`OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway`。
- `pnpm test:e2e`：儲存庫端對端測試彙總 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`。
- `pnpm test:e2e:gateway`：閘道端對端冒煙測試（多執行個體 WS／HTTP／節點配對）。預設在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 與自適應工作執行緒；可用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並用 `OPENCLAW_E2E_VERBOSE=1` 啟用詳細記錄。
- `pnpm test:live`：提供者即時測試（Claude／Minimax／DeepSeek／z.ai 等，由 `*.live.test.ts` 控制）。需要 API 金鑰，且必須設定 `LIVE=1`（或 `OPENCLAW_LIVE_TEST=1`）才不會跳過；可用 `OPENCLAW_LIVE_TEST_QUIET=0` 啟用詳細輸出。

## 完整 Docker 測試套件（`pnpm test:docker:all`）

建置共用的即時測試映像檔，將 OpenClaw 一次封裝為 npm tarball，建置／重用基本的 Node／Git 執行器映像檔，以及將該 tarball 安裝至 `/app` 的功能映像檔，然後透過加權排程器執行 Docker 冒煙測試通道。`scripts/package-openclaw-for-docker.mjs` 是本機／持續整合共用的唯一套件封裝器，會在 Docker 使用前驗證 tarball 和 `dist/postinstall-inventory.json`。

- 基本映像檔（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）：安裝程式／更新／外掛相依性測試通道；掛載預先建置的 tarball，而非複製儲存庫原始碼。
- 功能映像檔（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）：一般已建置應用程式功能測試通道。
- 測試通道定義：`scripts/lib/docker-e2e-scenarios.mjs`。規劃器：`scripts/lib/docker-e2e-plan.mjs`。執行器：`scripts/test-docker-all.mjs`。
- `node scripts/test-docker-all.mjs --plan-json` 會輸出由排程器管理的持續整合計畫（測試通道、映像檔種類、套件／即時映像檔需求、狀態情境、憑證檢查），而不建置或執行 Docker。

排程調整項目（環境變數，括號內為預設值）：

| 環境變數                                                                                                        | 預設值              | 用途                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | 處理程序槽位數。                                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | 對提供者敏感的尾端集區。                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 重量級即時提供者測試通道上限。                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm 資源測試通道上限。                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | 服務資源測試通道上限。                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | 各提供者的重量級測試通道上限。                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | 較嚴格的各提供者上限。                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | 供較大型主機使用的覆寫值。                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | 測試通道啟動之間的延遲，避免本機 Docker 常駐程式同時大量建立資源。                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000（120 分鐘） | 各測試通道的備援逾時；選定的即時／尾端測試通道會使用更嚴格的上限。                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 暫時性即時提供者失敗的重試次數。                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | 關閉                | 不執行 Docker，僅列印測試通道資訊清單。                                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | 使用中測試通道的狀態列印間隔。                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | 開啟                | 重用 `.artifacts/docker-tests/lane-timings.json`，以最長優先方式排序；設為 `0` 可停用。                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` 表示僅執行確定性／本機測試通道，`only` 表示僅執行即時提供者測試通道。別名：`pnpm test:docker:local:all`、`pnpm test:docker:live:all`。僅即時模式會將主要和尾端即時測試通道合併成一個最長優先集區，讓提供者分組能將 Claude／Codex／Gemini 工作排在一起。 |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | 命令列介面後端 Docker 設定逾時。                                                                                                                                                                                                                                                                                   |

資源上限的環境變數模式為 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`（資源名稱轉為大寫，非英數字元合併為 `_`）。

其他行為：執行器預設會預先檢查 Docker、清理殘留的 OpenClaw E2E 容器、在相容的測試通道之間共用供應商命令列介面工具快取，並在第一次失敗後停止排程新的集區測試通道，除非設定了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`。如果某個測試通道在低平行度主機上超過有效的權重／資源上限，它仍可從空集區啟動並單獨執行，直到釋放容量。各測試通道的日誌、`summary.json`、`failures.json` 與階段計時會寫入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 檢查緩慢的測試通道，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 輸出低成本的定向重新執行命令。

### 重要的 Docker 測試通道

| 命令                                                                        | 驗證內容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | 由 Chromium 支援的原始碼 E2E 容器，搭配原始 CDP 與隔離的閘道；`browser doctor --deep` CDP 角色快照包含連結 URL、由游標提升為可點擊的元素、iframe 參照與影格中繼資料。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:skill-install`                                            | 在設定 `skills.install.allowUploadedArchives: false` 的純淨 Docker 執行器中安裝封裝後的 tarball，從即時 ClawHub 搜尋解析目前的 skill slug，透過 `openclaw skills install` 安裝，並驗證 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 與 `skills info --json`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | 聚焦的命令列介面後端即時探測；Gemini 也有對應的 `:resume` 與 `:mcp` 別名。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:openwebui`                                                | Docker 化的 OpenClaw + Open WebUI：登入、檢查 `/api/models`，並透過 `/api/chat/completions` 執行真實的代理聊天。需要可用的即時模型金鑰，且會拉取外部映像；預期不會像單元／E2E 測試套件一樣具備穩定的 CI 表現。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:mcp-channels`                                             | 預先植入資料的閘道容器，加上一個產生 `openclaw mcp serve` 的用戶端容器：驗證路由式對話探索、逐字稿讀取、附件中繼資料、即時事件佇列行為、對外傳送路由，以及透過真實 stdio 橋接器傳送的 Claude 風格頻道與權限通知（斷言會直接讀取原始 stdio MCP 訊框）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | 將封裝後的 tarball 安裝到含有舊版使用者殘留資料的測試治具上，在沒有即時供應商／頻道金鑰的情況下執行套件更新與非互動式 doctor，啟動 local loopback 閘道，並檢查代理程式／頻道設定、外掛允許清單、工作區／工作階段檔案、殘留的舊版外掛相依性狀態、啟動與 RPC 狀態是否都能保留。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | 預設安裝 `openclaw@latest`、植入符合實際情況的現有使用者檔案、透過內建的 `openclaw config set` 配方進行設定、更新至封裝後的 tarball、執行非互動式 doctor、寫入 `.artifacts/upgrade-survivor/summary.json`，並檢查 `/healthz`、`/readyz` 與 RPC 狀態。可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫、使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 擴充矩陣，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 新增情境測試治具（包含 `configured-plugin-installs` 與 `stale-source-plugin-shadow`）。套件驗收會將這些項目公開為 `published_upgrade_survivor_baseline(s)`／`_scenarios`，並解析如 `last-stable-4` 或 `all-since-2026.4.23` 等中繼權杖。 |
| `pnpm test:docker:update-migration`                                         | 在 `plugin-deps-cleanup` 情境中執行已發布版本升級存續測試框架，預設從 `openclaw@2026.4.23` 開始。`Update Migration` 工作流程會使用 `baselines=all-since-2026.4.23` 擴充此測試，以證明在完整發布 CI 之外，已設定外掛的相依性清理也能正常運作。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:plugins`                                                  | 針對本機路徑、`file:`、具有提升相依性的 npm 登錄套件、git 浮動參照、ClawHub 測試治具、市集更新，以及 Claude 套件組合的啟用／檢查，執行安裝／更新冒煙測試。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## 本機 PR 閘門

若要在本機執行 PR 合併／閘門檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高負載主機上偶發失敗，請先重新執行一次，再將其視為迴歸；接著使用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 測試效能工具

- `pnpm test:perf:imports`：啟用 Vitest 匯入耗時與匯入細目報告，同時仍針對明確的檔案／目錄目標使用限定範圍的執行通道路由。`pnpm test:perf:imports:changed` 會將相同的效能分析限定於自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對相同的已提交 git 差異，比較經路由的變更模式路徑與原生根專案執行的基準效能；`pnpm test:perf:changed:bench -- --worktree` 則無須先提交，即可對目前工作樹的變更集進行基準測試。
- `pnpm test:perf:profile:main` 會寫入 Vitest 主執行緒的 CPU 效能分析資料（`.artifacts/vitest-main-profile`）；`pnpm test:perf:profile:runner` 會寫入單元測試執行器的 CPU 與堆積效能分析資料（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：依序執行完整測試套件中每個 Vitest 葉節點設定，並寫入分組耗時資料，以及各設定的 JSON／記錄成品。完整測試套件報告預設會隔離檔案，因此先前檔案保留的模組圖與 GC 暫停不會計入後續斷言；僅在刻意分析共用工作執行緒的累積情況時，才傳入 `-- --no-isolate`。測試效能代理會在嘗試修正緩慢測試之前，以此作為基準。`pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` 會比較以效能為重點的變更完成後之分組報告。
- 完整、外掛與包含模式的分片執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機計時資料；後續執行整個設定時，會使用這些計時資料平衡快慢分片。包含模式的 CI 分片會將分片名稱附加至計時鍵，讓篩選後的分片計時仍可見，而不會取代整個設定的計時資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機計時成品。

## 基準測試

<Accordion title="模型延遲（scripts/bench-model.ts）">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`。預設提示：「只用一個詞回覆：ok。不要使用標點符號或額外文字。」

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

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：合併上述兩個預設集

輸出包含 `sampleCount`、平均值、p50、p95、最小值／最大值、結束代碼／訊號分布，以及各命令的最大 RSS。`--cpu-prof-dir`／`--heap-prof-dir` 會為每次執行寫入 V8 效能分析資料。

已儲存的輸出：`pnpm test:startup:bench:smoke` 會寫入 `.artifacts/cli-startup-bench-smoke.json`；`pnpm test:startup:bench:save` 會寫入 `.artifacts/cli-startup-bench-all.json`（`runs=5 warmup=1`）。簽入版本庫的固定資料：`test/fixtures/cli-startup-bench.json`，由 `pnpm test:startup:bench:update` 重新整理，並由 `pnpm test:startup:bench:check` 比較。

</Accordion>

<Accordion title="閘道啟動（scripts/bench-gateway-startup.ts）">

預設使用位於 `dist/entry.js` 的已建置命令列介面進入點；請先執行 `pnpm build`。若要改為測量原始碼執行器，請傳入 `--entry scripts/run-node.mjs`，並將這些結果與已建置進入點的基準分開保存。

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

案例識別碼：`default`、`skipChannels`（略過頻道啟動）、`oneInternalHook`、`allInternalHooks`、`fiftyPlugins`（50 個資訊清單外掛）、`fiftyStartupLazyPlugins`（50 個啟動時延遲載入的資訊清單外掛）。

輸出包含第一筆程序輸出、`/healthz`、`/readyz`、HTTP 監聽記錄時間、閘道就緒記錄時間、CPU 時間、CPU 核心比率、最大 RSS、堆積、啟動追蹤指標、事件迴圈延遲，以及外掛查閱表的詳細指標。此指令碼會在子閘道環境中設定 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`。

`/healthz` 代表存活狀態（HTTP 伺服器可以回應）。`/readyz` 代表可用就緒狀態（啟動外掛附屬程序、頻道，以及附加後會影響就緒狀態的關鍵工作均已穩定）。啟動掛鉤會非同步分派，不屬於就緒保證的一部分。就緒記錄時間是閘道的內部時間戳記，可用於程序端歸因，但不能取代外部 `/readyz` 探測。

比較變更時，請使用 JSON 輸出或 `--output`。只有在追蹤輸出指出匯入、編譯或受 CPU 限制的工作，而僅靠階段計時無法解釋時，才使用 `--cpu-prof-dir`。

</Accordion>

<Accordion title="閘道重新啟動（scripts/bench-gateway-restart.ts）">

僅支援 macOS 與 Linux（使用 SIGUSR1 進行程序內重新啟動；在 Windows 上會立即失敗）。已建置進入點的預設值，以及 `--entry scripts/run-node.mjs` 覆寫方式，皆與上述閘道啟動相同。

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

案例識別碼：`skipChannels`、`skipChannelsAcpxProbe`（開啟 ACPX 啟動探測）、`skipChannelsNoAcpxProbe`（關閉探測）、`default`、`fiftyPlugins`。

輸出包含下一次 `/healthz`、下一次 `/readyz`、停機時間、重新啟動就緒計時、CPU、RSS、替代程序的啟動追蹤指標，以及訊號處理、進行中工作排空、關閉階段、下一次啟動、就緒計時與記憶體快照的重新啟動追蹤指標。此指令碼會設定 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 與 `OPENCLAW_GATEWAY_RESTART_TRACE=1`。

當變更涉及重新啟動訊號、關閉處理常式、重新啟動後的啟動流程、附屬程序關閉、服務移交或重新啟動後的就緒狀態時，請使用此基準測試。先使用 `skipChannels`，將閘道機制與頻道啟動隔離；只有在窄範圍案例已能解釋重新啟動路徑後，才使用 `default` 或外掛密集型案例。追蹤指標是歸因提示，而非判定結論——請依據多次樣本、相符的擁有者範圍、`/healthz`／`/readyz` 行為，以及使用者可見的重新啟動契約來評估重新啟動變更。

</Accordion>

## 初始設定端對端測試（Docker）

選用；僅容器化初始設定冒煙測試需要。在乾淨的 Linux 容器中執行完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

透過虛擬終端機操作互動式精靈，驗證設定／工作區／工作階段檔案，接著啟動閘道並執行 `openclaw health`。

## QR 匯入冒煙測試（Docker）

確保受維護的 QR 執行階段輔助工具可在支援的 Docker Node 執行階段下載入（預設使用 Node 24，並相容於 Node 22）：

```bash
pnpm test:docker:qr
```

## 相關內容

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與外掛](/zh-TW/help/testing-updates-plugins)
