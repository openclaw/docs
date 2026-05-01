---
read_when:
    - 執行或修復測試
summary: 如何在本機執行測試（vitest），以及何時使用強制/覆蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-05-01T02:45:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: de18ac7d822055ee34885e5e897eff0fe7dde57c945a6b7f2c4bb2a29445c859
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具組（套件、即時、Docker）：[測試](/zh-TW/help/testing)

- `pnpm test:force`：終止任何仍占用預設控制埠的 Gateway 行程，接著以隔離的 Gateway 埠執行完整 Vitest 套件，讓伺服器測試不會與執行中的實例衝突。當先前的 Gateway 執行讓埠 18789 被占用時，請使用此指令。
- `pnpm test:coverage`：使用 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是已載入檔案的單元覆蓋率閘門，不是整個儲存庫的全檔案覆蓋率。門檻為行數/函式/陳述式 70%，分支 55%。因為 `coverage.all` 為 false，此閘門會衡量單元覆蓋率套件載入的檔案，而不是把每個分割車道的原始碼檔案都視為未覆蓋。
- `pnpm test:coverage:changed`：只針對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：低成本的智慧變更測試執行。它會從直接測試編輯、相鄰的 `*.test.ts` 檔案、明確的來源對應，以及本機匯入圖執行精準目標。寬泛/config/package 變更會被略過，除非它們對應到精準測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的寬泛變更測試執行。當測試工具組/config/package 編輯應退回到 Vitest 較寬泛的變更測試行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的差異所觸發的架構車道。
- `pnpm check:changed`：針對相對於 `origin/main` 的差異執行智慧變更檢查閘門。它會為受影響的架構車道執行型別檢查、lint 和 guard 指令，但不會執行 Vitest 測試。需要測試證明時，請使用 `pnpm test:changed` 或明確的 `pnpm test <target>`。
- `pnpm test`：將明確的檔案/目錄目標透過範圍化 Vitest 車道路由。未指定目標的執行會使用固定 shard 群組，並展開為葉節點 config，以供本機平行執行；extension 群組一律展開為每個 extension 的 shard config，而不是一個巨大的根專案行程。
- 測試包裝器執行結束時會有簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗時行會保留為每個 shard 的細節。
- 共用 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir 或 auth-profile store 時，請在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。
- 行程 E2E 輔助工具：當 Vitest 行程層級 E2E 測試需要在同一處取得執行中的 Gateway、CLI env、log 擷取和清理時，請使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E 輔助工具：source `scripts/lib/docker-e2e-image.sh` 的車道可以將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多 home 腳本可以傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。較低層級的呼叫端可使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 取得容器內 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 取得可 source 的主機 env 檔案。`create` 前的 `--` 會避免較新的 Node runtime 將 `--env-file` 視為 Node flag。啟動 Gateway 的 Docker/Bash 車道可以在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，用於 entrypoint 解析、mock OpenAI 啟動、Gateway 前景/背景啟動、readiness probe、state env 匯出、log dump，以及行程清理。
- 完整、extension 與 include-pattern shard 執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機時間資料；之後的 whole-config 執行會使用這些時間來平衡慢速與快速 shard。Include-pattern CI shard 會把 shard 名稱附加到 timing key，讓篩選過的 shard timing 保持可見，而不會取代 whole-config timing 資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機 timing artifact。
- 選定的 `plugin-sdk` 和 `commands` 測試檔案現在會透過專用的輕量車道路由，只保留 `test/setup.ts`，並讓 runtime-heavy 案例留在既有車道。
- 有相鄰測試的原始碼檔案會先對應到該相鄰測試，再退回到更寬的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 編輯會使用本機匯入圖來執行匯入它們的測試，而不是在依賴路徑精準時寬泛執行每個 shard。
- `auto-reply` 現在也分成三個專用 config（`core`、`top-level`、`reply`），讓 reply harness 不會主導較輕量的頂層 status/token/helper 測試。
- 基礎 Vitest config 現在預設為 `pool: "threads"` 和 `isolate: false`，並在整個儲存庫 config 中啟用共用的非隔離 runner。
- `pnpm test:channels` 會執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 會執行所有 extension/Plugin shard。重量級 channel Plugin、browser Plugin 和 OpenAI 會作為專用 shard 執行；其他 Plugin 群組維持批次執行。使用 `pnpm test extensions/<id>` 執行一個 bundled Plugin 車道。
- `pnpm test:perf:imports`：啟用 Vitest 匯入耗時與匯入 breakdown 回報，同時仍對明確的檔案/目錄目標使用範圍化車道路由。
- `pnpm test:perf:imports:changed`：相同的匯入 profiling，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對相同的已提交 git 差異，比較 routed changed-mode 路徑與原生 root-project 執行。
- `pnpm test:perf:changed:bench -- --worktree` 會在不先提交的情況下 benchmark 目前 worktree 變更集。
- `pnpm test:perf:profile:main`：為 Vitest main thread 寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為 unit runner 寫入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：序列執行每個 full-suite Vitest 葉節點 config，並寫入分組耗時資料與每個 config 的 JSON/log artifact。Test Performance Agent 會在嘗試修復慢速測試前，以此作為 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在以效能為重點的變更後比較分組報告。
- Gateway 整合：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇啟用。
- `pnpm test:e2e`：執行 Gateway 端對端 smoke 測試（多實例 WS/HTTP/node pairing）。預設為 `threads` + `isolate: false`，並在 `vitest.e2e.config.ts` 中使用自適應 worker；可用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細 log。
- `pnpm test:live`：執行 provider live 測試（minimax/zai）。需要 API key 和 `LIVE=1`（或 provider 專屬的 `*_LIVE_TEST=1`）才能取消 skip。
- `pnpm test:docker:all`：建置共用 live-test image，將 OpenClaw 一次打包為 npm tarball，建置/重用 bare Node/Git runner image，以及將該 tarball 安裝到 `/app` 的 functional image，接著透過 weighted scheduler 以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker smoke 車道。bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於 installer/update/plugin-dependency 車道；這些車道會掛載預先建置的 tarball，而不是使用複製的 repo source。functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般 built-app 功能車道。`scripts/package-openclaw-for-docker.mjs` 是單一本機/CI package packer，會在 Docker 使用前驗證 tarball 與 `dist/postinstall-inventory.json`。Docker 車道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的 plan。`node scripts/test-docker-all.mjs --plan-json` 會發出由 scheduler 擁有的 CI plan，內容包含選定車道、image 類型、package/live-image 需求、state scenario 和 credential 檢查，而不建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制行程 slot，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，預設為 10。重量級車道上限預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider 上限預設透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`，讓每個 provider 有一個重量級車道。較大的主機可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某個車道在低平行度主機上超過有效 weight 或 resource cap，它仍可從空 pool 啟動，並會單獨執行直到釋放容量。車道啟動預設會錯開 2 秒，以避免本機 Docker daemon create storm；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。runner 預設會 preflight Docker、清理過期的 OpenClaw E2E 容器、每 30 秒發出 active-lane 狀態、在相容車道之間共用 provider CLI tool cache、預設重試一次暫時性 live-provider 失敗（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將車道 timing 儲存在 `.artifacts/docker-tests/lane-timings.json`，供之後執行時採用 longest-first 排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印車道 manifest 而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整狀態輸出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用 timing 重用。若只要 deterministic/local 車道，使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`；若只要 live-provider 車道，使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`；package alias 為 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。Live-only 模式會將 main 與 tail live 車道合併為一個 longest-first pool，讓 provider bucket 可以一起打包 Claude、Codex 和 Gemini 工作。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，runner 會在第一次失敗後停止排程新的 pooled 車道；每個車道都有 120 分鐘 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail 車道使用較嚴格的每車道上限。CLI backend Docker 設定指令有自己的 timeout，由 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（預設 180）。每車道 log、`summary.json`、`failures.json` 和 phase timing 會寫入 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 檢查慢速車道，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印低成本的精準重跑指令。
- `pnpm test:docker:browser-cdp-snapshot`：建置 Chromium-backed source E2E 容器，啟動 raw CDP 加上隔離 Gateway，執行 `browser doctor --deep`，並驗證 CDP role snapshot 包含 link URL、cursor-promoted clickable、iframe ref 和 frame metadata。
- CLI backend live Docker probe 可作為聚焦車道執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有對應的 `:resume` 與 `:mcp` alias。
- `pnpm test:docker:openwebui`：啟動 Dockerized OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，接著透過 `/api/chat/completions` 執行真正的 proxied chat。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI），會拉取外部 Open WebUI image，且不預期像一般 unit/e2e 套件那樣具備 CI 穩定性。
- `pnpm test:docker:mcp-channels`：啟動 seeded Gateway 容器，以及第二個會 spawn `openclaw mcp serve` 的 client 容器，接著驗證 routed conversation discovery、transcript read、attachment metadata、live event queue 行為、outbound send routing，以及透過真正 stdio bridge 傳遞的 Claude-style channel + permission notification。Claude notification assertion 會直接讀取 raw stdio MCP frame，因此 smoke 會反映 bridge 實際發出的內容。
- `pnpm test:docker:upgrade-survivor`: 在有髒資料的舊使用者 fixture 上安裝已打包的 OpenClaw tarball，執行套件更新以及不使用即時 provider 或 channel keys 的非互動式 doctor，然後啟動回送 Gateway，並檢查 agents、channel config、Plugin 允許清單、workspace/session 檔案、過期的 Plugin runtime-deps 狀態、啟動流程和 RPC 狀態是否保留下來。
- `pnpm test:docker:published-upgrade-survivor`: 預設在有髒資料的舊使用者 fixture 上安裝 `openclaw@latest`，將該已發佈的安裝更新為已打包的 OpenClaw tarball，然後執行相同的 doctor、Gateway 啟動與 RPC 存續斷言。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫基準。

## 本機 PR 門檻

若要執行本機 PR 合併/門檻檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上出現不穩定失敗，請先重新執行一次，再將其視為迴歸，然後用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

指令碼：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示：「只回覆單字：ok。不要標點或額外文字。」

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

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小值/最大值、結束碼/訊號分布，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 設定檔，讓計時和設定檔擷取使用相同的測試框架。

已儲存輸出慣例：

- `pnpm test:startup:bench:smoke` 會將目標冒煙測試成品寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 和 `warmup=1` 將完整套件成品寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 和 `warmup=1` 重新整理已簽入的基準 fixture：`test/fixtures/cli-startup-bench.json`

已簽入 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## 入門 E2E（Docker）

Docker 是選用的；只有在容器化入門冒煙測試時才需要。

在乾淨 Linux 容器中的完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

此指令碼會透過 pseudo-tty 驅動互動式精靈，驗證設定/工作區/session 檔案，然後啟動 Gateway 並執行 `openclaw health`。

## QR 匯入冒煙測試（Docker）

確保維護中的 QR 執行階段輔助程式可在支援的 Docker Node 執行階段下載入（預設 Node 24，相容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
