---
read_when:
    - 執行或修正測試
summary: 如何在本機執行測試 (vitest)，以及何時使用 force/coverage 模式
title: 測試
x-i18n:
    generated_at: "2026-05-02T02:59:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具組（測試套件、即時、Docker）：[測試](/zh-TW/help/testing)
- 更新與 Plugin 套件驗證：[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)

- `pnpm test:force`：終止任何仍佔用預設控制連接埠的殘留 Gateway 行程，然後使用隔離的 Gateway 連接執行完整 Vitest 套件，避免伺服器測試與執行中的實例衝突。當先前的 Gateway 執行讓連接埠 18789 被佔用時使用此指令。
- `pnpm test:coverage`：使用 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是已載入檔案的單元覆蓋率閘門，不是整個儲存庫的全檔案覆蓋率。門檻為行數/函式/陳述式 70%，分支 55%。因為 `coverage.all` 為 false，此閘門會測量單元覆蓋率套件載入的檔案，而不是將每個分割車道來源檔都視為未覆蓋。
- `pnpm test:coverage:changed`：只針對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：低成本的智慧變更測試執行。它會從直接測試編輯、相鄰的 `*.test.ts` 檔案、明確的來源對應，以及本機匯入圖中執行精準目標。除非可對應到精準測試，否則會略過廣泛/設定/套件變更。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的廣泛變更測試執行。當測試框架/設定/套件編輯應退回 Vitest 較廣泛的變更測試行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的差異所觸發的架構車道。
- `pnpm check:changed`：對相對於 `origin/main` 的差異執行智慧變更檢查閘門。它會針對受影響的架構車道執行型別檢查、lint 與保護命令，但不會執行 Vitest 測試。測試證明請使用 `pnpm test:changed` 或明確的 `pnpm test <target>`。
- `pnpm test`：將明確的檔案/目錄目標透過有範圍的 Vitest 車道路由。未指定目標的執行會使用固定 shard 群組，並展開為 leaf config 以進行本機平行執行；擴充功能群組一律展開為各擴充功能的 shard 設定，而不是一個巨大的根專案行程。
- 測試包裝器執行結尾會有簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗時行會保留為各 shard 的詳細資訊。
- 共用的 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定 fixture、工作區、代理目錄或 auth-profile store 時，請在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。
- 行程 E2E helper：當 Vitest 行程層級 E2E 測試需要執行中的 Gateway、CLI 環境、日誌擷取與集中清理時，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E helper：source `scripts/lib/docker-e2e-image.sh` 的車道可以將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多 home 腳本可以傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。較低層呼叫者可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 取得容器內 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 產生可 source 的主機環境檔。`create` 前的 `--` 會避免較新的 Node 執行階段把 `--env-file` 當成 Node 旗標。啟動 Gateway 的 Docker/Bash 車道可以在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，用於 entrypoint 解析、模擬 OpenAI 啟動、Gateway 前景/背景啟動、就緒探測、狀態環境匯出、日誌傾印與行程清理。
- 完整、擴充功能與 include-pattern shard 執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機計時資料；後續 whole-config 執行會使用這些計時來平衡較慢與較快的 shard。Include-pattern CI shard 會將 shard 名稱附加到計時鍵，讓篩選後的 shard 計時保持可見，而不會取代 whole-config 計時資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機計時成品。
- 選取的 `plugin-sdk` 與 `commands` 測試檔現在會路由到專用輕量車道，這些車道只保留 `test/setup.ts`，並讓執行階段較重的案例留在既有車道。
- 具有相鄰測試的來源檔會先對應到該相鄰測試，再退回較廣的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 與 `src/plugins/contracts` 底下的 helper 編輯會使用本機匯入圖來執行匯入它們的測試，而不是在依賴路徑精準時廣泛執行每個 shard。
- `auto-reply` 現在也分割為三個專用設定（`core`、`top-level`、`reply`），因此 reply harness 不會主導較輕量的 top-level 狀態/token/helper 測試。
- 基礎 Vitest 設定現在預設為 `pool: "threads"` 與 `isolate: false`，並在整個儲存庫設定中啟用共用的非隔離 runner。
- `pnpm test:channels` 會執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 與 `pnpm test extensions` 會執行所有擴充功能/Plugin shard。重型 channel Plugin、瀏覽器 Plugin 與 OpenAI 會作為專用 shard 執行；其他 Plugin 群組維持批次執行。單一 bundled Plugin 車道請使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：啟用 Vitest 匯入耗時與匯入分解報告，同時仍對明確檔案/目錄目標使用有範圍的車道路由。
- `pnpm test:perf:imports:changed`：相同的匯入剖析，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對同一個已提交 git diff，對路由後的 changed-mode 路徑與原生根專案執行進行基準測試。
- `pnpm test:perf:changed:bench -- --worktree` 會在不先提交的情況下，對目前工作樹變更集進行基準測試。
- `pnpm test:perf:profile:main`：為 Vitest 主執行緒寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為單元 runner 寫入 CPU 與 heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：逐一序列執行每個 full-suite Vitest leaf config，並寫入分組耗時資料以及各設定的 JSON/日誌成品。Test Performance Agent 會在嘗試修復慢速測試前，將此作為基準。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：比較效能導向變更後的分組報告。
- Gateway 整合：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇加入。
- `pnpm test:e2e`：執行 Gateway 端對端 smoke tests（多實例 WS/HTTP/node pairing）。預設為 `threads` + `isolate: false`，並在 `vitest.e2e.config.ts` 中使用自適應 worker；可用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細日誌。
- `pnpm test:live`：執行 provider live tests（minimax/zai）。需要 API 金鑰與 `LIVE=1`（或 provider 專屬的 `*_LIVE_TEST=1`）才能取消略過。
- `pnpm test:docker:all`：建置共用 live-test 映像檔，將 OpenClaw 一次打包為 npm tarball，建置/重用 bare Node/Git runner 映像檔，以及會將該 tarball 安裝到 `/app` 的 functional 映像檔，然後透過加權排程器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker smoke 車道。bare 映像檔（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於 installer/update/plugin-dependency 車道；這些車道會掛載預建 tarball，而不是使用複製的儲存庫來源。functional 映像檔（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般已建置應用功能車道。`scripts/package-openclaw-for-docker.mjs` 是單一的本機/CI 套件打包器，並會在 Docker 使用前驗證 tarball 與 `dist/postinstall-inventory.json`。Docker 車道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行所選計畫。`node scripts/test-docker-all.mjs --plan-json` 會輸出 scheduler-owned CI 計畫，內容包含所選車道、映像檔種類、套件/live-image 需求、狀態情境與認證檢查，而不建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制行程 slot，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，預設為 10。重型車道上限預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 與 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider 上限預設為每個 provider 一個重型車道，透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 與 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 設定。較大的主機可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果在低平行度主機上一個車道超過有效權重或資源上限，它仍可從空 pool 啟動，並會單獨執行直到釋放容量。車道啟動預設間隔 2 秒，以避免本機 Docker daemon 建立風暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。runner 預設會預先檢查 Docker、清理陳舊的 OpenClaw E2E 容器、每 30 秒輸出 active-lane 狀態、在相容車道之間共用 provider CLI 工具快取、預設重試一次暫時性 live-provider 失敗（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將車道計時儲存在 `.artifacts/docker-tests/lane-timings.json`，供後續執行以最長優先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印車道 manifest 而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整狀態輸出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用計時重用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 可只執行 deterministic/local 車道，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 只執行 live-provider 車道；套件別名為 `pnpm test:docker:local:all` 與 `pnpm test:docker:live:all`。Live-only 模式會將 main 與 tail live 車道合併為一個最長優先 pool，讓 provider bucket 可以一起打包 Claude、Codex 與 Gemini 工作。runner 會在第一次失敗後停止排程新的 pooled 車道，除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`；每個車道都有 120 分鐘的 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail 車道使用更緊的 per-lane 上限。CLI backend Docker 設定命令有自己的 timeout，透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（預設 180）設定。各車道日誌、`summary.json`、`failures.json` 與 phase timing 會寫入 `.artifacts/docker-tests/<run-id>/` 底下；使用 `pnpm test:docker:timings <summary.json>` 檢查慢速車道，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印低成本的目標重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：建置 Chromium-backed source E2E 容器，啟動原始 CDP 加上隔離的 Gateway，執行 `browser doctor --deep`，並驗證 CDP role snapshot 包含連結 URL、cursor-promoted clickable、iframe ref 與 frame metadata。
- CLI backend live Docker probe 可作為聚焦車道執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 與 Gemini 有對應的 `:resume` 與 `:mcp` 別名。
- `pnpm test:docker:openwebui`：啟動 Docker 化的 OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，然後透過 `/api/chat/completions` 執行真正的 proxied chat。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI），會拉取外部 Open WebUI 映像檔，且不預期像一般 unit/e2e 套件一樣 CI 穩定。
- `pnpm test:docker:mcp-channels`：啟動 seeded Gateway 容器與第二個 client 容器，該容器會產生 `openclaw mcp serve`，然後驗證 routed conversation discovery、transcript reads、attachment metadata、live event queue behavior、outbound send routing，以及透過真正 stdio bridge 的 Claude-style channel + permission notifications。Claude notification assertion 會直接讀取原始 stdio MCP frame，因此 smoke 會反映 bridge 實際發出的內容。
- `pnpm test:docker:upgrade-survivor`：將封裝好的 OpenClaw tarball 安裝到髒的舊使用者 fixture 上，在沒有即時提供者或頻道金鑰的情況下執行套件更新與非互動式 doctor，接著啟動 local loopback Gateway，並檢查 agent、頻道設定、Plugin 允許清單、工作區/工作階段檔案、過時的舊版 Plugin 相依性狀態、啟動流程與 RPC 狀態是否保留。
- `pnpm test:docker:published-upgrade-survivor`：預設安裝 `openclaw@latest`，在沒有即時提供者或頻道金鑰的情況下植入擬真的既有使用者檔案，使用內建的 `openclaw config set` 命令配方設定該基準，將該已發布安裝更新為封裝好的 OpenClaw tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動 local loopback Gateway，並檢查已設定的 intent、工作區/工作階段檔案、過時的 Plugin 設定與舊版相依性狀態、啟動流程、`/healthz`、`/readyz` 與 RPC 狀態是否保留或乾淨修復。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確矩陣，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 新增情境 fixture；Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 與 `published_upgrade_survivor_scenarios`。
- `pnpm test:docker:update-migration`：在清理量大的 `plugin-deps-cleanup` 情境中執行已發布升級保留測試工具，預設從 `openclaw@2026.4.23` 開始。獨立的 `Update Migration` 工作流程會以 `baselines=all-since-2026.4.23` 展開此通道，讓 `.23` 之後的每個穩定已發布套件都更新到候選版本，並在 Full Release CI 之外證明已設定 Plugin 的相依性清理。
- `pnpm test:docker:plugins`：針對本機路徑、`file:`、具有提升相依性的 npm registry 套件、git 移動 ref、ClawHub fixture、市集更新，以及 Claude-bundle 的啟用/檢查執行安裝/更新 smoke。

## 本機 PR 閘門

若要進行本機 PR 合併/閘門檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上偶發失敗，請先重新執行一次，再將其視為迴歸，接著使用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

腳本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示詞：「以單一單字回覆：ok。不要標點符號或額外文字。」

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

預設組合：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：兩個預設組合

輸出會包含每個命令的 `sampleCount`、平均值、p50、p95、最小/最大值、結束碼/訊號分佈，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 分析檔，因此計時和分析檔擷取會使用同一套執行框架。

已儲存輸出慣例：

- `pnpm test:startup:bench:smoke` 會將目標煙霧測試成品寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 和 `warmup=1` 將完整套件成品寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 和 `warmup=1` 重新整理簽入的基準 fixture，位置為 `test/fixtures/cli-startup-bench.json`

簽入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## 新手導引 E2E（Docker）

Docker 是選用的；只有在容器化新手導引煙霧測試時才需要。

在乾淨 Linux 容器中的完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

此腳本會透過 pseudo-tty 驅動互動式精靈，驗證設定/工作區/session 檔案，接著啟動 gateway 並執行 `openclaw health`。

## QR 匯入煙霧測試（Docker）

確保維護中的 QR 執行階段輔助程式可在支援的 Docker Node 執行階段下載入（Node 24 預設、Node 22 相容）：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與 plugins](/zh-TW/help/testing-updates-plugins)
