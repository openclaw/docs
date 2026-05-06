---
read_when:
    - 執行或修正測試
summary: 如何在本機執行測試 (vitest) 以及何時使用 force/coverage 模式
title: 測試
x-i18n:
    generated_at: "2026-05-06T09:18:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具組（測試套件、即時、Docker）：[測試](/zh-TW/help/testing)
- 更新與 Plugin 套件驗證：[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)

- `pnpm test:force`：終止任何仍佔用預設控制連接埠的 Gateway 行程，然後使用隔離的 Gateway 連接執行完整 Vitest 套件，避免伺服器測試與執行中的實例衝突。當先前的 Gateway 執行留下連接埠 18789 被佔用時使用此命令。
- `pnpm test:coverage`：使用 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是預設單元 lane 的覆蓋率 gate，不是整個 repo 的全檔案覆蓋率。閾值為 70% 行數/函式/陳述式，以及 55% 分支。由於 `coverage.all` 為 false，且預設 lane 會將覆蓋率 include 範圍限定在具有同層來源檔案的非快速單元測試，這個 gate 會測量此 lane 擁有的來源，而不是它碰巧載入的每個傳遞 import。
- `pnpm test:coverage:changed`：只針對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：低成本的智慧變更測試執行。它會從直接測試編輯、同層 `*.test.ts` 檔案、明確來源映射，以及本機 import 圖執行精確目標。廣泛/config/package 變更會被略過，除非它們映射到精確測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的廣泛變更測試執行。當測試 harness/config/package 編輯應回退到 Vitest 較廣泛的 changed-test 行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的 diff 觸發的架構 lane。
- `pnpm check:changed`：針對相對於 `origin/main` 的 diff 執行智慧變更檢查 gate。它會為受影響的架構 lane 執行 typecheck、lint 和 guard 命令，但不會執行 Vitest 測試。測試證明請使用 `pnpm test:changed` 或明確的 `pnpm test <target>`。
- `pnpm test`：將明確的檔案/目錄目標透過 scoped Vitest lane 路由。未指定目標的執行會使用固定 shard 群組，並展開到 leaf config 以便本機平行執行；extension 群組永遠展開為每個 extension 的 shard config，而不是一個巨大的 root-project 行程。
- 測試 wrapper 執行結束時會顯示簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗時行會保留為每個 shard 的詳細資訊。
- 共享 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir 或 auth-profile store 時，請從 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- 行程 E2E helper：當 Vitest 行程層級 E2E 測試需要執行中的 Gateway、CLI env、log 擷取和集中清理時，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E helper：source `scripts/lib/docker-e2e-image.sh` 的 lane 可以將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多 home 腳本可以傳入 `docker_e2e_test_state_function_b64`，並在每個 flow 呼叫 `openclaw_test_state_create <label> <scenario>`。較低層呼叫者可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 取得容器內 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 取得可 source 的 host env 檔案。`create` 前面的 `--` 會避免較新的 Node runtime 將 `--env-file` 視為 Node flag。啟動 Gateway 的 Docker/Bash lane 可以在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，用於 entrypoint 解析、mock OpenAI 啟動、Gateway 前景/背景啟動、readiness probe、狀態 env 匯出、log dump 和行程清理。
- 完整、extension 與 include-pattern shard 執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機 timing 資料；後續 whole-config 執行會使用這些 timing 來平衡慢速與快速 shard。Include-pattern CI shard 會將 shard 名稱附加到 timing key，使 filtered shard timing 可見，而不會取代 whole-config timing 資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機 timing artifact。
- 選定的 `plugin-sdk` 和 `commands` 測試檔案現在會路由到專用輕量 lane，這些 lane 只保留 `test/setup.ts`，並讓 runtime-heavy case 留在既有 lane。
- 具有同層測試的來源檔案會先映射到該同層測試，再回退到較廣的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 編輯會使用本機 import 圖來執行 importing 測試，而不是在 dependency path 精確時廣泛執行每個 shard。
- `auto-reply` 現在也拆分成三個專用 config（`core`、`top-level`、`reply`），讓 reply harness 不會主導較輕量的 top-level status/token/helper 測試。
- 基礎 Vitest config 現在預設為 `pool: "threads"` 和 `isolate: false`，並在整個 repo config 中啟用共享的非隔離 runner。
- `pnpm test:channels` 執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 執行所有 extension/Plugin shard。重型 channel Plugin、browser Plugin 和 OpenAI 會作為專用 shard 執行；其他 Plugin 群組維持批次處理。單一 bundled Plugin lane 請使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：啟用 Vitest import-duration + import-breakdown 報告，同時仍對明確的檔案/目錄目標使用 scoped lane 路由。
- `pnpm test:perf:imports:changed`：相同的 import profiling，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 針對同一個已提交 git diff，比較 routed changed-mode path 與原生 root-project 執行的 benchmark。
- `pnpm test:perf:changed:bench -- --worktree` 對目前 worktree 變更集進行 benchmark，不需要先 commit。
- `pnpm test:perf:profile:main`：為 Vitest main thread 寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為單元 runner 寫入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：序列執行每個 full-suite Vitest leaf config，並寫入分組耗時資料以及每個 config 的 JSON/log artifact。Test Performance Agent 會在嘗試修復慢速測試前將此作為 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在以效能為重點的變更後比較分組報告。
- Gateway 整合：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇啟用。
- `pnpm test:e2e`：執行 Gateway 端對端 smoke 測試（多實例 WS/HTTP/node 配對）。預設為 `threads` + `isolate: false`，並在 `vitest.e2e.config.ts` 中使用 adaptive workers；可用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細 log。
- `pnpm test:live`：執行 provider live 測試（minimax/zai）。需要 API key 和 `LIVE=1`（或 provider-specific `*_LIVE_TEST=1`）才會取消 skip。
- `pnpm test:docker:all`：建置共享 live-test image，將 OpenClaw 打包一次為 npm tarball，建置/重用 bare Node/Git runner image 加上一個會將該 tarball 安裝到 `/app` 的 functional image，然後透過 weighted scheduler 以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker smoke lane。Bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於 installer/update/plugin-dependency lane；這些 lane 會掛載預先建置的 tarball，而不是使用複製的 repo source。Functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般 built-app 功能 lane。`scripts/package-openclaw-for-docker.mjs` 是單一 local/CI package packer，並會在 Docker 使用前驗證 tarball 和 `dist/postinstall-inventory.json`。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 執行選定 plan。`node scripts/test-docker-all.mjs --plan-json` 會輸出由 scheduler 擁有的 CI plan，內容包含選定 lane、image kind、package/live-image 需求、state scenario 和 credential check，不會建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制行程 slot，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，預設為 10。重型 lane cap 預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider cap 預設透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`，每個 provider 一個重型 lane。較大的 host 可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果單一 lane 在低平行度 host 上超過有效 weight 或 resource cap，它仍可從空 pool 啟動，並會獨自執行直到釋放 capacity。Lane 啟動預設錯開 2 秒，以避免本機 Docker daemon create storm；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。Runner 預設會 preflight Docker、清理過期 OpenClaw E2E container、每 30 秒輸出 active-lane 狀態、在相容 lane 間共享 provider CLI tool cache、預設重試 transient live-provider failure 一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將 lane timing 儲存在 `.artifacts/docker-tests/lane-timings.json`，供後續執行 longest-first 排序使用。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印 lane manifest 而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整狀態輸出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用 timing 重用。僅執行 deterministic/local lane 時使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`，僅執行 live-provider lane 時使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`；package alias 為 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。Live-only mode 會將 main 和 tail live lane 合併成一個 longest-first pool，使 provider bucket 可以一起排入 Claude、Codex 和 Gemini 工作。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否則 runner 在第一次 failure 後會停止排程新的 pooled lane；每個 lane 都有 120 分鐘 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail lane 使用較嚴格的 per-lane cap。CLI backend Docker setup 命令有自己的 timeout，透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（預設 180）設定。每個 lane 的 log、`summary.json`、`failures.json` 和 phase timing 會寫入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 可檢查慢速 lane，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 可列印低成本的針對性 rerun 命令。
- `pnpm test:docker:browser-cdp-snapshot`：建置由 Chromium 支援的 source E2E container，啟動 raw CDP 加上隔離的 Gateway，執行 `browser doctor --deep`，並驗證 CDP role snapshot 包含 link URL、cursor-promoted clickable、iframe ref 和 frame metadata。
- CLI backend live Docker probe 可以作為 focused lane 執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有對應的 `:resume` 和 `:mcp` alias。
- `pnpm test:docker:openwebui`：啟動 Dockerized OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，然後透過 `/api/chat/completions` 執行真正的 proxied chat。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI）、會拉取外部 Open WebUI image，且不預期像一般 unit/e2e suite 一樣具備 CI 穩定性。
- `pnpm test:docker:mcp-channels`：啟動一個已植入資料的 Gateway 容器，以及第二個會產生 `openclaw mcp serve` 的用戶端容器，接著驗證路由對話探索、逐字稿讀取、附件中繼資料、即時事件佇列行為、傳出傳送路由，以及透過真實 stdio bridge 傳遞的 Claude 風格頻道與權限通知。Claude 通知斷言會直接讀取原始 stdio MCP 框架，因此該 smoke 會反映 bridge 實際發出的內容。
- `pnpm test:docker:upgrade-survivor`：將打包好的 OpenClaw tarball 安裝到髒的舊使用者 fixture 上，執行套件更新和非互動式 doctor，且不使用即時 provider 或頻道金鑰，接著啟動迴環 Gateway，並檢查 agents、頻道設定、plugin allowlists、工作區/工作階段檔案、過期的舊版 plugin 相依狀態、啟動流程，以及 RPC 狀態是否保留下來。
- `pnpm test:docker:published-upgrade-survivor`：預設安裝 `openclaw@latest`，植入不含即時 provider 或頻道金鑰的真實既有使用者檔案，使用內建的 `openclaw config set` 命令配方設定該 baseline，將該已發布安裝更新為打包好的 OpenClaw tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動迴環 Gateway，並檢查已設定的 intents、工作區/工作階段檔案、過期的 plugin 設定和舊版相依狀態、啟動流程、`/healthz`、`/readyz`，以及 RPC 狀態是否保留下來或乾淨地修復。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一 baseline，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確的本機矩陣，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 加入情境 fixture；reported-issues 集合包含 `configured-plugin-installs`，用來驗證已設定的外部 OpenClaw plugins 會在升級期間自動安裝，以及 `stale-source-plugin-shadow`，用來避免僅存在於原始碼的 plugin shadows 破壞啟動流程。套件驗收會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，並在把精確套件規格交給 Docker lanes 之前，解析像是 `last-stable-4` 或 `all-since-2026.4.23` 這類中繼 baseline token。
- `pnpm test:docker:update-migration`：在大量清理的 `plugin-deps-cleanup` 情境中執行已發布升級 survivor harness，預設從 `openclaw@2026.4.23` 開始。獨立的 `Update Migration` workflow 會用 `baselines=all-since-2026.4.23` 展開此 lane，讓從 `.23` 起的每個穩定已發布套件都更新到候選版本，並在 Full Release CI 之外證明已設定的 plugin 相依清理。
- `pnpm test:docker:plugins`：針對本機路徑、`file:`、具有 hoisted dependencies 的 npm registry packages、git moving refs、ClawHub fixtures、marketplace updates，以及 Claude-bundle enable/inspect 執行安裝/更新 smoke。

## 本機 PR 關卡

針對本機 PR 合併/關卡檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上偶發失敗，先重新執行一次，再將其視為回歸問題，然後使用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

指令碼：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示詞："Reply with a single word: ok. No punctuation or extra text."

上次執行（2025-12-31，20 次執行）：

- minimax 中位數 1279ms（最小值 1114，最大值 2431）
- opus 中位數 2454ms（最小值 1224，最大值 3170）

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

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小值/最大值、結束代碼/訊號分布，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 設定檔，讓計時與設定檔擷取使用同一套測試框架。

已儲存輸出的慣例：

- `pnpm test:startup:bench:smoke` 會將目標煙霧測試成品寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 和 `warmup=1` 將完整測試套件成品寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 和 `warmup=1` 重新整理已簽入的基準 fixture：`test/fixtures/cli-startup-bench.json`

已簽入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## Onboarding E2E（Docker）

Docker 是選用項；只有容器化 onboarding 煙霧測試才需要。

在乾淨 Linux 容器中的完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

此指令碼會透過 pseudo-tty 驅動互動式精靈，驗證設定/工作區/session 檔案，然後啟動 gateway 並執行 `openclaw health`。

## QR 匯入煙霧測試（Docker）

確保維護中的 QR 執行階段輔助程式可在支援的 Docker Node 執行階段中載入（Node 24 預設，Node 22 相容）：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與 plugins](/zh-TW/help/testing-updates-plugins)
