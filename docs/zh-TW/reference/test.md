---
read_when:
    - 執行或修正測試
summary: 如何在本機執行測試（vitest），以及何時使用強制/覆蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-05-05T01:48:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具組（測試套件、即時測試、Docker）：[測試](/zh-TW/help/testing)
- 更新與 Plugin 套件驗證：[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)

- `pnpm test:force`：終止任何仍占用預設控制埠的 Gateway 程序，然後使用隔離的 Gateway 埠執行完整 Vitest 套件，避免伺服器測試與正在執行的實例衝突。當先前的 Gateway 執行留下埠 18789 被占用時使用此命令。
- `pnpm test:coverage`：使用 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是已載入檔案的單元覆蓋率閘門，不是整個儲存庫的所有檔案覆蓋率。閾值為 70% 行數/函式/陳述式，以及 55% 分支。因為 `coverage.all` 為 false，此閘門會測量單元覆蓋率套件載入的檔案，而不是將每個分割 lane 的原始檔視為未覆蓋。
- `pnpm test:coverage:changed`：只對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：低成本的智慧變更測試執行。它會從直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖執行精準目標。寬泛/config/package 變更會被略過，除非它們對應到精準測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的寬泛變更測試執行。當測試框架/config/package 編輯應退回到 Vitest 較寬泛的變更測試行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的差異所觸發的架構 lane。
- `pnpm check:changed`：針對相對於 `origin/main` 的差異執行智慧變更檢查閘門。它會針對受影響的架構 lane 執行 typecheck、lint 與 guard 命令，但不會執行 Vitest 測試。需要測試證明時，使用 `pnpm test:changed` 或明確的 `pnpm test <target>`。
- `pnpm test`：將明確的檔案/目錄目標透過範圍化的 Vitest lane 路由。未指定目標的執行會使用固定 shard 群組，並展開為 leaf config 以供本機平行執行；extension 群組一律展開為逐 extension 的 shard config，而不是一個巨大的根專案程序。
- 測試包裝器執行結束時會顯示簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗時行仍保留為每個 shard 的細節。
- 共用 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir 或 auth-profile store 時，在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。
- 程序 E2E 輔助工具：當 Vitest 程序層級 E2E 測試需要執行中的 Gateway、CLI env、日誌擷取與清理集中於一處時，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E 輔助工具：source `scripts/lib/docker-e2e-image.sh` 的 lane 可將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多 home 腳本可傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。較低階的呼叫端可使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 產生容器內 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 產生可 source 的主機 env 檔案。`create` 前面的 `--` 可避免較新的 Node runtime 將 `--env-file` 視為 Node flag。啟動 Gateway 的 Docker/Bash lane 可在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，以取得 entrypoint 解析、mock OpenAI 啟動、Gateway 前景/背景啟動、就緒性探測、狀態 env 匯出、日誌傾印與程序清理。
- 完整、extension 與 include-pattern shard 執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機計時資料；之後的 whole-config 執行會使用這些計時來平衡慢速與快速 shard。Include-pattern CI shard 會將 shard 名稱附加到計時鍵，讓篩選後的 shard 計時保持可見，同時不取代 whole-config 計時資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機計時 artifact。
- 選定的 `plugin-sdk` 與 `commands` 測試檔案現在會路由到專用輕量 lane，只保留 `test/setup.ts`，讓 runtime-heavy 案例維持在既有 lane 上。
- 具有同層測試的原始檔會先對應到該同層測試，再退回到較寬泛的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 與 `src/plugins/contracts` 底下的 helper 編輯會使用本機匯入圖來執行匯入它們的測試，而不是在 dependency path 精準時寬泛執行每個 shard。
- `auto-reply` 現在也分割為三個專用 config（`core`、`top-level`、`reply`），讓 reply harness 不會主導較輕量的 top-level status/token/helper 測試。
- 基礎 Vitest config 現在預設為 `pool: "threads"` 與 `isolate: false`，並在整個儲存庫 config 啟用共用的非隔離 runner。
- `pnpm test:channels` 會執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 與 `pnpm test extensions` 會執行所有 extension/Plugin shard。重量級 channel Plugin、browser Plugin 與 OpenAI 會作為專用 shard 執行；其他 Plugin 群組維持批次執行。對單一 bundled Plugin lane 使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：啟用 Vitest 匯入耗時與匯入分解報告，同時仍對明確的檔案/目錄目標使用範圍化 lane 路由。
- `pnpm test:perf:imports:changed`：相同的匯入 profiling，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：針對同一個已提交的 git diff，比較 routed changed-mode path 與原生 root-project 執行的基準效能。
- `pnpm test:perf:changed:bench -- --worktree`：不先提交，即對目前 worktree 變更集進行基準測試。
- `pnpm test:perf:profile:main`：為 Vitest main thread 寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為 unit runner 寫入 CPU 與 heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：逐一序列執行每個 full-suite Vitest leaf config，並寫入分組耗時資料與每個 config 的 JSON/log artifact。Test Performance Agent 會將此作為嘗試修復慢速測試前的 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在效能導向變更後比較分組報告。
- Gateway 整合：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇加入。
- `pnpm test:e2e`：執行 Gateway 端到端 smoke 測試（多實例 WS/HTTP/node pairing）。預設使用 `threads` + `isolate: false`，並在 `vitest.e2e.config.ts` 中使用自適應 worker；可用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細日誌。
- `pnpm test:live`：執行 provider live 測試（minimax/zai）。需要 API key 與 `LIVE=1`（或 provider-specific `*_LIVE_TEST=1`）才能取消略過。
- `pnpm test:docker:all`：建置共用 live-test image，將 OpenClaw 打包一次為 npm tarball，建置/重用 bare Node/Git runner image，以及把該 tarball 安裝到 `/app` 的 functional image，接著透過 weighted scheduler 使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker smoke lane。bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於 installer/update/plugin-dependency lane；這些 lane 會掛載預先建置的 tarball，而不是使用複製的儲存庫來源。functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般 built-app functionality lane。`scripts/package-openclaw-for-docker.mjs` 是唯一的本機/CI package packer，並會在 Docker 使用前驗證 tarball 與 `dist/postinstall-inventory.json`。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的 plan。`node scripts/test-docker-all.mjs --plan-json` 會輸出 scheduler 擁有的 CI plan，內容包含選定 lane、image kind、package/live-image 需求、state scenario 與 credential check，而不建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制程序 slot，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，預設為 10。重量級 lane cap 預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 與 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider cap 預設透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 與 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`，每個 provider 一條重量級 lane。較大型主機可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某個 lane 在低平行度主機上超過有效 weight 或 resource cap，它仍可從空 pool 開始，並會獨自執行直到釋放容量。lane 啟動預設交錯 2 秒，以避免本機 Docker daemon create storm；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。runner 預設會 preflight Docker、清理 stale OpenClaw E2E 容器、每 30 秒輸出 active-lane 狀態、在相容 lane 之間共用 provider CLI 工具 cache、預設重試 transient live-provider failure 一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將 lane timing 儲存在 `.artifacts/docker-tests/lane-timings.json`，供後續執行以 longest-first 排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可印出 lane manifest 而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整狀態輸出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用計時重用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 僅執行 deterministic/local lane，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 僅執行 live-provider lane；package alias 為 `pnpm test:docker:local:all` 與 `pnpm test:docker:live:all`。Live-only 模式會將 main 與 tail live lane 合併為單一 longest-first pool，讓 provider bucket 可一起打包 Claude、Codex 與 Gemini 工作。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，runner 會在第一次失敗後停止排程新的 pooled lane，且每個 lane 都有 120 分鐘 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail lane 使用較嚴格的每 lane cap。CLI backend Docker setup 命令有自己的 timeout，可透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 設定（預設 180）。每個 lane 的日誌、`summary.json`、`failures.json` 與 phase timing 會寫入 `.artifacts/docker-tests/<run-id>/` 底下；使用 `pnpm test:docker:timings <summary.json>` 檢查慢速 lane，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 印出低成本的精準 rerun 命令。
- `pnpm test:docker:browser-cdp-snapshot`：建置以 Chromium 為後端的 source E2E 容器，啟動 raw CDP 加上一個隔離的 Gateway，執行 `browser doctor --deep`，並驗證 CDP role snapshot 包含 link URL、cursor-promoted clickable、iframe ref 與 frame metadata。
- CLI backend live Docker probe 可作為聚焦 lane 執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 與 Gemini 也有相對應的 `:resume` 與 `:mcp` alias。
- `pnpm test:docker:openwebui`：啟動 Docker 化的 OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，然後透過 `/api/chat/completions` 執行真實的 proxied chat。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI）、會拉取外部 Open WebUI image，且不預期像一般 unit/e2e 套件一樣 CI-stable。
- `pnpm test:docker:mcp-channels`：啟動 seeded Gateway 容器與第二個 client 容器，後者會產生 `openclaw mcp serve`，接著驗證 routed conversation discovery、transcript read、attachment metadata、live event queue 行為、outbound send routing，以及透過真實 stdio bridge 的 Claude-style channel + permission notification。Claude notification assertion 會直接讀取 raw stdio MCP frame，因此 smoke 會反映 bridge 實際發出的內容。
- `pnpm test:docker:upgrade-survivor`：將打包好的 OpenClaw tarball 安裝到狀態不乾淨的舊使用者測試夾具上，執行套件更新與非互動式診斷，且不使用即時提供者或頻道金鑰，接著啟動 local loopback Gateway，並檢查代理、頻道設定、Plugin 允許清單、工作區/工作階段檔案、過期的舊版 Plugin 相依狀態、啟動流程與 RPC 狀態都能保留下來。
- `pnpm test:docker:published-upgrade-survivor`：預設安裝 `openclaw@latest`，植入不含即時提供者或頻道金鑰的擬真既有使用者檔案，使用內建的 `openclaw config set` 命令配方設定該基準，將該已發布安裝更新為打包好的 OpenClaw tarball，執行非互動式診斷，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動 local loopback Gateway，並檢查已設定的意圖、工作區/工作階段檔案、過期的 Plugin 設定與舊版相依狀態、啟動流程、`/healthz`、`/readyz` 與 RPC 狀態都能保留下來或乾淨修復。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確矩陣，例如 `all-since-2026.4.23`，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 加入情境測試夾具；reported-issues 集合包含 `configured-plugin-installs`，用來驗證已設定的外部 OpenClaw plugins 會在升級期間自動安裝，也包含 `stale-source-plugin-shadow`，用來避免僅存在於原始碼的 Plugin 遮蔽破壞啟動流程。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 與 `published_upgrade_survivor_scenarios`。
- `pnpm test:docker:update-migration`：在清理工作較重的 `plugin-deps-cleanup` 情境中執行已發布升級存活檢查工具，預設從 `openclaw@2026.4.23` 開始。獨立的 `Update Migration` workflow 會以 `baselines=all-since-2026.4.23` 展開此路徑，讓 `.23` 之後每個穩定發布的套件都更新到候選版本，並在 Full Release CI 之外證明已設定 Plugin 的相依清理可正常運作。
- `pnpm test:docker:plugins`：針對本機路徑、`file:`、含提升相依的 npm registry 套件、git 移動參照、ClawHub 測試夾具、市集更新，以及 Claude 套裝啟用/檢查，執行安裝/更新冒煙測試。

## 本機 PR 關卡

若要在本機執行 PR 合併/關卡檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載高的主機上出現不穩定失敗，請先重新執行一次，再將其視為回歸；接著用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

指令碼：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示詞：「請只回覆一個單字：ok。不要標點符號或額外文字。」

上次執行（2025-12-31，20 次執行）：

- minimax 中位數 1279ms（最小 1114，最大 2431）
- opus 中位數 2454ms（最小 1224，最大 3170）

## CLI 啟動基準測試

指令碼：[`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

輸出包含每個命令的 `sampleCount`、avg、p50、p95、min/max、退出碼/訊號分布，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 profiles，讓計時與 profile 擷取使用相同的 harness。

已儲存輸出慣例：

- `pnpm test:startup:bench:smoke` 會將目標煙霧測試 artifact 寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 和 `warmup=1`，將完整套件 artifact 寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 和 `warmup=1`，重新整理已提交的基準 fixture `test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## 入門 E2E（Docker）

Docker 是選用的；這只在容器化入門煙霧測試中需要。

在乾淨 Linux 容器中的完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

這個指令碼會透過 pseudo-tty 驅動互動式精靈，驗證 config/workspace/session 檔案，接著啟動 Gateway 並執行 `openclaw health`。

## QR 匯入煙霧測試（Docker）

確保維護中的 QR 執行階段輔助工具可在支援的 Docker Node 執行階段下載入（Node 24 預設，Node 22 相容）：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與 plugins](/zh-TW/help/testing-updates-plugins)
