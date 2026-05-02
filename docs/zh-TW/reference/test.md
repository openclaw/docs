---
read_when:
    - 執行或修正測試
summary: 如何在本機執行測試 (vitest)，以及何時使用強制/覆蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-05-02T21:03:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具組（測試套件、即時、Docker）：[測試](/zh-TW/help/testing)
- 更新與 Plugin 套件驗證：[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)

- `pnpm test:force`：終止任何仍占用預設控制連接埠的 Gateway 程序，然後使用隔離的 Gateway 連接執行完整 Vitest 套件，讓伺服器測試不會與執行中的執行個體衝突。當先前的 Gateway 執行留下 18789 連接埠被占用時使用。
- `pnpm test:coverage`：使用 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是已載入檔案的單元覆蓋率關卡，不是整個儲存庫所有檔案的覆蓋率。門檻為行數/函式/陳述式 70%，分支 55%。因為 `coverage.all` 為 false，此關卡會測量單元覆蓋率套件載入的檔案，而不是將每個分割通道來源檔都視為未覆蓋。
- `pnpm test:coverage:changed`：只針對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：低成本的智慧變更測試執行。它會從直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖執行精準目標。廣泛/設定/套件變更會略過，除非它們對應到精準測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的廣泛變更測試執行。當測試框架/設定/套件編輯應退回到 Vitest 較廣泛的變更測試行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的差異所觸發的架構通道。
- `pnpm check:changed`：針對相對於 `origin/main` 的差異執行智慧變更檢查關卡。它會為受影響的架構通道執行型別檢查、lint 和防護命令，但不會執行 Vitest 測試。使用 `pnpm test:changed` 或明確的 `pnpm test <target>` 作為測試證明。
- `pnpm test`：將明確的檔案/目錄目標透過有範圍的 Vitest 通道路由。未指定目標的執行會使用固定分片群組，並展開為葉層設定以供本機平行執行；擴充群組一律展開為逐擴充分片設定，而不是一個巨大的根專案程序。
- 測試包裝器執行結尾會有簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的持續時間行仍保留為逐分片詳細資料。
- 共享 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定 fixture、工作區、代理程式目錄或 auth-profile 儲存區時，從 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- 程序 E2E 輔助工具：當 Vitest 程序層級 E2E 測試需要執行中的 Gateway、CLI 環境、日誌擷取，以及集中清理時，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E 輔助工具：來源載入 `scripts/lib/docker-e2e-image.sh` 的通道可以將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多 HOME 指令碼可以傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。較低層級的呼叫端可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 取得容器內 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 取得可 source 的主機環境檔。`create` 前方的 `--` 可避免較新的 Node 執行階段將 `--env-file` 視為 Node 旗標。啟動 Gateway 的 Docker/Bash 通道可以在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，用於進入點解析、模擬 OpenAI 啟動、Gateway 前景/背景啟動、就緒探測、狀態環境匯出、日誌傾印，以及程序清理。
- 完整、擴充和 include-pattern 分片執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機計時資料；之後的整體設定執行會使用這些計時來平衡慢速與快速分片。Include-pattern CI 分片會將分片名稱附加到計時鍵，讓篩選後的分片計時保持可見，而不取代整體設定計時資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機計時成品。
- 選定的 `plugin-sdk` 和 `commands` 測試檔現在會透過專用輕量通道路由，只保留 `test/setup.ts`，讓執行階段較重的案例留在既有通道。
- 有同層測試的來源檔會先對應到該同層測試，再退回到較寬的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 底下的輔助工具編輯會使用本機匯入圖來執行匯入它們的測試，而不是在相依路徑精準時廣泛執行每個分片。
- `auto-reply` 現在也分割為三個專用設定（`core`、`top-level`、`reply`），讓回覆框架不會主導較輕量的頂層狀態/token/輔助工具測試。
- 基礎 Vitest 設定現在預設為 `pool: "threads"` 和 `isolate: false`，並在整個儲存庫設定中啟用共享的非隔離 runner。
- `pnpm test:channels` 執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 會執行所有擴充/Plugin 分片。較重的頻道 Plugin、瀏覽器 Plugin 和 OpenAI 會作為專用分片執行；其他 Plugin 群組維持批次處理。使用 `pnpm test extensions/<id>` 執行單一內建 Plugin 通道。
- `pnpm test:perf:imports`：啟用 Vitest 匯入持續時間與匯入細目報告，同時仍對明確檔案/目錄目標使用有範圍的通道路由。
- `pnpm test:perf:imports:changed`：相同的匯入效能分析，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會將路由後的 changed-mode 路徑，與同一個已提交 git 差異的原生根專案執行進行基準比較。
- `pnpm test:perf:changed:bench -- --worktree` 會在不先提交的情況下，對目前工作樹變更集進行基準測試。
- `pnpm test:perf:profile:main`：為 Vitest 主執行緒寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為單元 runner 寫入 CPU + heap profiles（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：序列執行每個完整套件 Vitest 葉層設定，並寫入分組持續時間資料，以及逐設定 JSON/日誌成品。Test Performance Agent 會在嘗試修復慢測試前，以此作為基準。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在以效能為焦點的變更後比較分組報告。
- Gateway 整合：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇加入。
- `pnpm test:e2e`：執行 Gateway 端對端煙霧測試（多執行個體 WS/HTTP/node 配對）。預設為 `threads` + `isolate: false`，並在 `vitest.e2e.config.ts` 中使用自適應 workers；可用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細日誌。
- `pnpm test:live`：執行提供者 live 測試（minimax/zai）。需要 API 金鑰和 `LIVE=1`（或提供者特定的 `*_LIVE_TEST=1`）才能取消略過。
- `pnpm test:docker:all`：建置共享 live-test 映像檔，將 OpenClaw 一次打包為 npm tarball，建置/重用裸 Node/Git runner 映像檔，以及會將該 tarball 安裝到 `/app` 的功能映像檔，然後透過加權排程器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker 煙霧通道。裸映像檔（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於安裝器/更新/Plugin 相依性通道；這些通道會掛載預先建置的 tarball，而不是使用複製的儲存庫來源。功能映像檔（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般已建置應用程式功能通道。`scripts/package-openclaw-for-docker.mjs` 是單一本機/CI 套件打包器，並在 Docker 使用前驗證 tarball 與 `dist/postinstall-inventory.json`。Docker 通道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的計畫。`node scripts/test-docker-all.mjs --plan-json` 會輸出排程器擁有的 CI 計畫，包含選定通道、映像種類、套件/live-image 需求、狀態場景，以及認證檢查，而不建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制程序槽位，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制對提供者敏感的尾端 pool，預設為 10。重型通道上限預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供者上限預設為每個提供者一個重型通道，透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`。較大型主機可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某個通道在低平行度主機上超過有效權重或資源上限，它仍可從空 pool 啟動，並會獨自執行直到釋放容量。通道啟動預設錯開 2 秒，以避免本機 Docker daemon 建立風暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。Runner 預設會預先檢查 Docker、清理過期 OpenClaw E2E 容器、每 30 秒輸出作用中通道狀態、在相容通道之間共享提供者 CLI 工具快取、預設重試暫時性 live-provider 失敗一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將通道計時儲存在 `.artifacts/docker-tests/lane-timings.json`，供之後執行時以最長優先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印通道 manifest 而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整狀態輸出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用計時重用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 僅執行確定性/本機通道，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 僅執行 live-provider 通道；套件別名為 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。Live-only 模式會將主要與尾端 live 通道合併成一個最長優先 pool，讓提供者 bucket 能將 Claude、Codex 和 Gemini 工作一起打包。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否則 runner 會在第一次失敗後停止排程新的 pooled 通道；每個通道都有 120 分鐘的備援逾時，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail 通道使用較嚴格的逐通道上限。CLI 後端 Docker 設定命令有自己的逾時，可透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 設定（預設 180）。逐通道日誌、`summary.json`、`failures.json` 和階段計時會寫入 `.artifacts/docker-tests/<run-id>/` 底下；使用 `pnpm test:docker:timings <summary.json>` 檢查慢速通道，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印低成本的目標式重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：建置由 Chromium 支援的來源 E2E 容器，啟動原始 CDP 加上隔離的 Gateway，執行 `browser doctor --deep`，並驗證 CDP 角色快照包含連結 URL、游標提升的可點擊項目、iframe 參照，以及 frame 中繼資料。
- CLI 後端 live Docker 探測可以作為聚焦通道執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有相對應的 `:resume` 與 `:mcp` 別名。
- `pnpm test:docker:openwebui`：啟動 Docker 化的 OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，然後透過 `/api/chat/completions` 執行真實的代理聊天。需要可用的 live 模型金鑰（例如 `~/.profile` 中的 OpenAI）、會拉取外部 Open WebUI 映像檔，且不預期像一般單元/e2e 套件一樣具備 CI 穩定性。
- `pnpm test:docker:mcp-channels`：啟動已植入資料的 Gateway 容器，以及第二個會產生 `openclaw mcp serve` 的用戶端容器，然後驗證路由後的對話探索、transcript 讀取、附件中繼資料、live 事件佇列行為、對外傳送路由，以及真實 stdio bridge 上的 Claude 風格頻道 + 權限通知。Claude 通知斷言會直接讀取原始 stdio MCP frames，因此煙霧測試會反映 bridge 實際輸出的內容。
- `pnpm test:docker:upgrade-survivor`：將打包好的 OpenClaw tarball 安裝到髒的舊使用者 fixture 上，執行套件更新加上不含即時 provider 或通道金鑰的非互動式 doctor，接著啟動迴路 Gateway，並檢查代理程式、通道設定、Plugin 允許清單、工作區/工作階段檔案、過時的舊版 Plugin 相依狀態、啟動與 RPC 狀態是否保留下來。
- `pnpm test:docker:published-upgrade-survivor`：預設安裝 `openclaw@latest`，植入不含即時 provider 或通道金鑰的擬真既有使用者檔案，使用內建的 `openclaw config set` 命令配方設定該基準，將該已發布安裝更新到打包好的 OpenClaw tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動迴路 Gateway，並檢查已設定的意圖、工作區/工作階段檔案、過時的 Plugin 設定與舊版相依狀態、啟動、`/healthz`、`/readyz` 與 RPC 狀態是否保留下來或能乾淨修復。用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確矩陣，例如 `all-since-2026.4.23`，或用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 新增情境 fixture；reported-issues 集合包含 `configured-plugin-installs`，用來驗證已設定的外部 OpenClaw Plugin 會在升級期間自動安裝。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 與 `published_upgrade_survivor_scenarios`。
- `pnpm test:docker:update-migration`：在清理量大的 `plugin-deps-cleanup` 情境中執行已發布升級存活性 harness，預設從 `openclaw@2026.4.23` 開始。獨立的 `Update Migration` 工作流程會用 `baselines=all-since-2026.4.23` 展開這個 lane，讓從 `.23` 起的每個穩定已發布套件都更新到候選版本，並在 Full Release CI 之外證明已設定 Plugin 的相依清理。
- `pnpm test:docker:plugins`：針對本機路徑、`file:`、具有 hoisted 相依的 npm registry 套件、git 移動 refs、ClawHub fixture、marketplace 更新，以及 Claude-bundle 啟用/檢查執行安裝/更新 smoke。

## 本機 PR 門檻檢查

若要在本機進行 PR 合併/門檻檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上發生不穩定失敗，請先重新執行一次，再將其視為回歸問題；接著使用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

腳本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示：「用單一詞回覆：ok。不要標點或額外文字。」

上次執行（2025-12-31，20 次執行）：

- minimax 中位數 1279ms（最小 1114，最大 2431）
- opus 中位數 2454ms（最小 1224，最大 3170）

## CLI 啟動基準測試

腳本：[`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

用法：

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

預設集：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：兩個預設集

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小/最大值、退出碼/訊號分布，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 profile，讓計時與 profile 擷取使用相同的測試框架。

已儲存輸出慣例：

- `pnpm test:startup:bench:smoke` 會將目標煙霧測試成品寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 和 `warmup=1` 將完整套件成品寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 和 `warmup=1` 重新整理簽入的基準 fixture，位置為 `test/fixtures/cli-startup-bench.json`

簽入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## Onboarding E2E（Docker）

Docker 是選用項；只有在容器化 onboarding 煙霧測試時才需要。

在乾淨的 Linux 容器中執行完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

此腳本會透過 pseudo-tty 驅動互動式精靈，驗證設定/工作區/session 檔案，然後啟動 Gateway 並執行 `openclaw health`。

## QR 匯入煙霧測試（Docker）

確保維護中的 QR 執行階段輔助程式可在支援的 Docker Node 執行階段下載入（Node 24 預設、Node 22 相容）：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)
