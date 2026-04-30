---
read_when:
    - 執行或修復測試
summary: 如何在本機執行測試 (vitest)，以及何時使用 force/coverage 模式
title: 測試
x-i18n:
    generated_at: "2026-04-30T18:38:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具組（套件、即時、Docker）：[測試](/zh-TW/help/testing)

- `pnpm test:force`：終止任何仍占用預設控制連接埠的 Gateway 程序，然後以隔離的 Gateway 連接埠執行完整 Vitest 套件，避免伺服器測試與執行中的實例衝突。當先前的 Gateway 執行留下連接埠 18789 被占用時使用。
- `pnpm test:coverage`：使用 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是已載入檔案的單元覆蓋率閘門，不是整個 repo 的全檔案覆蓋率。門檻為 70% 行數/函式/陳述式與 55% 分支。由於 `coverage.all` 為 false，此閘門會測量單元覆蓋率套件載入的檔案，而不是將每個分割 lane 原始檔視為未覆蓋。
- `pnpm test:coverage:changed`：只針對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：便宜的智慧變更測試執行。它會從直接測試編輯、同層 `*.test.ts` 檔案、明確原始碼對應，以及本機匯入圖執行精準目標。寬泛/config/package 變更會被略過，除非它們能對應到精準測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的寬泛變更測試執行。當測試 harness/config/package 編輯應退回到 Vitest 較寬泛的變更測試行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的 diff 觸發的架構 lane。
- `pnpm check:changed`：針對相對於 `origin/main` 的 diff 執行智慧變更檢查閘門。它會為受影響的架構 lane 執行 typecheck、lint 與 guard 命令，但不會執行 Vitest 測試。測試證明請使用 `pnpm test:changed` 或明確的 `pnpm test <target>`。
- `pnpm test`：透過有範圍的 Vitest lane 路由明確的檔案/目錄目標。未指定目標的執行使用固定 shard 群組，並展開為 leaf config 以進行本機平行執行；extension 群組一律展開為各 extension 的 shard config，而不是單一巨大的 root-project 程序。
- 測試 wrapper 執行會以簡短的 `[test] passed|failed|skipped ... in ...` 摘要結尾。Vitest 自己的耗時行仍保留每個 shard 的細節。
- 共用 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir 或 auth-profile store 時，從 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- 程序 E2E helper：當 Vitest 程序層級 E2E 測試需要執行中的 Gateway、CLI env、log capture 與集中清理時，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E helper：source `scripts/lib/docker-e2e-image.sh` 的 lane 可將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多 home 腳本可傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。較低層呼叫端可使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 產生容器內 shell snippet，或用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 產生可 source 的 host env file。`create` 前的 `--` 會避免較新的 Node runtime 將 `--env-file` 視為 Node flag。啟動 Gateway 的 Docker/Bash lane 可在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，用於 entrypoint 解析、mock OpenAI 啟動、Gateway 前景/背景啟動、readiness probe、狀態 env 匯出、log dump 與程序清理。
- 完整、extension 與 include-pattern shard 執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機 timing data；之後的 whole-config 執行會用這些 timing 平衡慢速與快速 shard。Include-pattern CI shard 會將 shard 名稱附加到 timing key，讓 filtered shard timing 可見而不取代 whole-config timing data。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機 timing artifact。
- 選定的 `plugin-sdk` 與 `commands` 測試檔案現在會透過專用 light lane 路由，這些 lane 只保留 `test/setup.ts`，並讓 runtime-heavy case 留在既有 lane 上。
- 具有同層測試的原始檔會先對應到該同層測試，再退回到較寬的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 與 `src/plugins/contracts` 下的 helper 編輯會使用本機匯入圖來執行匯入它們的測試，而不是在 dependency path 精準時寬泛執行每個 shard。
- `auto-reply` 現在也分割為三個專用 config（`core`、`top-level`、`reply`），因此 reply harness 不會主導較輕的 top-level status/token/helper 測試。
- Base Vitest config 現在預設為 `pool: "threads"` 與 `isolate: false`，並在整個 repo config 啟用共用的非隔離 runner。
- `pnpm test:channels` 執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 與 `pnpm test extensions` 執行所有 extension/Plugin shard。重型 channel Plugin、browser Plugin 與 OpenAI 會作為專用 shard 執行；其他 Plugin 群組維持批次。針對單一 bundled Plugin lane，使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：啟用 Vitest import-duration 與 import-breakdown 報告，同時仍對明確的檔案/目錄目標使用 scoped lane routing。
- `pnpm test:perf:imports:changed`：相同的 import profiling，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：針對相同的已提交 git diff，比較 routed changed-mode path 與 native root-project run 的 benchmark。
- `pnpm test:perf:changed:bench -- --worktree`：不先提交，直接對目前 worktree change set 進行 benchmark。
- `pnpm test:perf:profile:main`：為 Vitest main thread 寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為 unit runner 寫入 CPU 與 heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：序列執行每個 full-suite Vitest leaf config，並寫入 grouped duration data 加上 per-config JSON/log artifact。Test Performance Agent 會將其用作嘗試修復慢測試前的 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在效能導向變更後比較 grouped report。
- Gateway integration：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` opt-in。
- `pnpm test:e2e`：執行 Gateway 端對端 smoke test（multi-instance WS/HTTP/node pairing）。在 `vitest.e2e.config.ts` 中預設為 `threads` + `isolate: false` 搭配 adaptive worker；用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細 log。
- `pnpm test:live`：執行 provider live test（minimax/zai）。需要 API key 與 `LIVE=1`（或 provider-specific `*_LIVE_TEST=1`）才會取消 skip。
- `pnpm test:docker:all`：建置共用 live-test image，將 OpenClaw 一次打包為 npm tarball，建置/重用 bare Node/Git runner image 與將該 tarball 安裝到 `/app` 的 functional image，然後透過 weighted scheduler 以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker smoke lane。bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於 installer/update/plugin-dependency lane；這些 lane 會掛載預建 tarball，而不是使用複製的 repo source。functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般 built-app functionality lane。`scripts/package-openclaw-for-docker.mjs` 是單一 local/CI package packer，會在 Docker 使用前驗證 tarball 與 `dist/postinstall-inventory.json`。Docker lane definition 位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner logic 位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 執行選定 plan。`node scripts/test-docker-all.mjs --plan-json` 會輸出 scheduler-owned CI plan，內容包含選定 lane、image kind、package/live-image need、state scenario 與 credential check，且不會建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制 process slot，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，預設為 10。Heavy lane cap 預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 與 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider cap 預設為每個 provider 一個 heavy lane，透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 與 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`。較大的 host 可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某個 lane 在低平行度 host 上超過有效 weight 或 resource cap，它仍可從空 pool 啟動，並會獨自執行直到釋放 capacity。Lane start 預設錯開 2 秒，以避免本機 Docker daemon create storm；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。runner 預設會 preflight Docker、清理過期 OpenClaw E2E container、每 30 秒輸出 active-lane status、在相容 lane 間共用 provider CLI tool cache、預設對 transient live-provider failure 重試一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將 lane timing 儲存在 `.artifacts/docker-tests/lane-timings.json`，供後續執行採 longest-first ordering。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印 lane manifest 而不執行 Docker，`OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整 status output，或用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用 timing reuse。僅執行 deterministic/local lane 時使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`，僅執行 live-provider lane 時使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`；package alias 為 `pnpm test:docker:local:all` 與 `pnpm test:docker:live:all`。Live-only mode 會將 main 與 tail live lane 合併為一個 longest-first pool，讓 provider bucket 能一起打包 Claude、Codex 與 Gemini 工作。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，runner 會在首次失敗後停止排程新的 pooled lane；每個 lane 都有 120 分鐘 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail lane 會使用更嚴格的 per-lane cap。CLI backend Docker setup command 有自己的 timeout，透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（預設 180）。Per-lane log、`summary.json`、`failures.json` 與 phase timing 會寫入 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 檢查慢 lane，並用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印便宜的 targeted rerun command。
- `pnpm test:docker:browser-cdp-snapshot`：建置 Chromium-backed source E2E container，啟動 raw CDP 與隔離的 Gateway，執行 `browser doctor --deep`，並驗證 CDP role snapshot 包含 link URL、cursor-promoted clickable、iframe ref 與 frame metadata。
- CLI backend live Docker probe 可作為 focused lane 執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 與 Gemini 具有對應的 `:resume` 與 `:mcp` alias。
- `pnpm test:docker:openwebui`：啟動 Dockerized OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，接著透過 `/api/chat/completions` 執行真實 proxied chat。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI）、會拉取外部 Open WebUI image，且不像一般 unit/e2e suite 那樣預期具備 CI 穩定性。
- `pnpm test:docker:mcp-channels`：啟動 seeded Gateway container 與第二個會 spawn `openclaw mcp serve` 的 client container，接著驗證 routed conversation discovery、transcript read、attachment metadata、live event queue behavior、outbound send routing，以及透過真實 stdio bridge 傳送的 Claude-style channel + permission notification。Claude notification assertion 會直接讀取 raw stdio MCP frame，因此 smoke 反映 bridge 實際 emit 的內容。
- `pnpm test:docker:upgrade-survivor`: 將封裝好的 OpenClaw tarball 安裝到髒的舊使用者測試夾具上，執行套件更新以及不使用 live provider 或 channel keys 的非互動式 doctor，接著啟動 loopback Gateway，並檢查 agents、channel config、Plugin allowlists、workspace/session files、過時的 Plugin runtime-deps 狀態、startup，以及 RPC status 都能保留下來。

## 本機 PR 關卡

若要在本機執行 PR 合入/關卡檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上偶發失敗，請先重新執行一次，再將其視為回歸問題，然後使用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

Script：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 選用 env：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示：「回覆單一單字：ok。不要標點或額外文字。」

上次執行（2025-12-31，20 次執行）：

- minimax 中位數 1279ms（最小 1114，最大 2431）
- opus 中位數 2454ms（最小 1224，最大 3170）

## CLI 啟動基準測試

Script：[`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小/最大值、結束碼/signal 分佈，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 profiles，因此計時與 profile 擷取會使用相同的測試框架。

儲存輸出慣例：

- `pnpm test:startup:bench:smoke` 會將目標煙霧測試成品寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 和 `warmup=1` 將完整套件成品寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 和 `warmup=1` 重新整理已提交的基準 fixture，位置為 `test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## Onboarding E2E（Docker）

Docker 是選用的；只有在容器化 onboarding 煙霧測試時才需要。

在乾淨 Linux 容器中的完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

此 script 透過 pseudo-tty 驅動互動式精靈，驗證 config/workspace/session 檔案，然後啟動 gateway 並執行 `openclaw health`。

## QR 匯入煙霧測試（Docker）

確保維護中的 QR runtime helper 能在受支援的 Docker Node runtime 下載入（Node 24 預設，Node 22 相容）：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
