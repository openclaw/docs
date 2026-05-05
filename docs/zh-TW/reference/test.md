---
read_when:
    - 執行或修復測試
summary: 如何在本機執行測試（vitest），以及何時使用 force/coverage 模式
title: 測試
x-i18n:
    generated_at: "2026-05-05T06:18:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具組（測試套件、即時測試、Docker）：[測試](/zh-TW/help/testing)
- 更新與 Plugin 套件驗證：[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)

- `pnpm test:force`：終止任何仍占用預設控制埠的殘留 Gateway 程序，然後以隔離的 Gateway 埠執行完整 Vitest 套件，讓伺服器測試不會與執行中的執行個體衝突。當先前的 Gateway 執行留下 18789 埠被占用時使用此指令。
- `pnpm test:coverage`：以 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是已載入檔案的單元覆蓋率閘門，不是整個儲存庫所有檔案的覆蓋率。門檻為 70% 行數/函式/陳述式，以及 55% 分支。由於 `coverage.all` 為 false，閘門會測量單元覆蓋率套件載入的檔案，而不是把每個分割 lane 的原始檔視為未覆蓋。
- `pnpm test:coverage:changed`：只針對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：低成本的智慧變更測試執行。它會從直接測試編輯、同層 `*.test.ts` 檔案、明確的來源對應，以及本機匯入圖執行精準目標。廣泛/config/package 變更會被略過，除非它們對應到精準測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的廣泛變更測試執行。當測試 harness/config/package 編輯應退回到 Vitest 較廣泛的變更測試行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的 diff 觸發的架構 lane。
- `pnpm check:changed`：針對相對於 `origin/main` 的 diff 執行智慧變更檢查閘門。它會針對受影響的架構 lane 執行 typecheck、lint 和 guard 指令，但不會執行 Vitest 測試。使用 `pnpm test:changed` 或明確的 `pnpm test <target>` 作為測試證明。
- `pnpm test`：將明確的檔案/目錄目標路由到範圍化的 Vitest lane。未指定目標的執行會使用固定 shard 群組，並展開為 leaf config 以供本機平行執行；extension 群組一律展開為各 extension shard config，而不是一個巨大的 root-project 程序。
- 測試 wrapper 執行結束時會有簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗時列會保留為每個 shard 的細節。
- 共用 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir 或 auth-profile store 時，從 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- Process E2E 輔助工具：當 Vitest 程序層級 E2E 測試需要在一處取得執行中的 Gateway、CLI env、log capture 與 cleanup 時，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E 輔助工具：source `scripts/lib/docker-e2e-image.sh` 的 lane 可以把 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入 container，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；multi-home scripts 可以傳入 `docker_e2e_test_state_function_b64`，並在每個 flow 中呼叫 `openclaw_test_state_create <label> <scenario>`。較低層級的呼叫端可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 取得 container 內 shell snippet，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 取得可 source 的 host env file。`create` 前的 `--` 可避免較新的 Node runtime 將 `--env-file` 視為 Node flag。啟動 Gateway 的 Docker/Bash lane 可以在 container 內 source `scripts/lib/openclaw-e2e-instance.sh`，以取得 entrypoint resolution、mock OpenAI startup、Gateway foreground/background launch、readiness probes、state env export、log dumps，以及 process cleanup。
- Full、extension 與 include-pattern shard 執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機 timing data；後續 whole-config 執行會使用這些 timing 來平衡慢速與快速 shard。Include-pattern CI shard 會把 shard 名稱附加到 timing key，讓 filtered shard timing 保持可見，而不取代 whole-config timing data。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機 timing artifact。
- 選定的 `plugin-sdk` 和 `commands` 測試檔案現在會路由到專用 light lane，只保留 `test/setup.ts`，並讓 runtime-heavy case 留在既有 lane。
- 有同層測試的 source file 會先對應到該同層測試，再退回到較廣的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 編輯會使用本機匯入圖執行匯入它們的測試，而不是在 dependency path 精準時廣泛執行每個 shard。
- `auto-reply` 現在也分成三個專用 config（`core`、`top-level`、`reply`），讓 reply harness 不會主導較輕量的 top-level status/token/helper 測試。
- 基礎 Vitest config 現在預設為 `pool: "threads"` 和 `isolate: false`，並在整個儲存庫 config 中啟用共用的 non-isolated runner。
- `pnpm test:channels` 會執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 會執行所有 extension/Plugin shard。Heavy channel Plugin、browser Plugin 和 OpenAI 會以專用 shard 執行；其他 Plugin 群組保持 batched。針對單一 bundled Plugin lane 使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：啟用 Vitest import-duration 與 import-breakdown reporting，同時仍對明確檔案/目錄目標使用範圍化 lane routing。
- `pnpm test:perf:imports:changed`：相同的 import profiling，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：針對相同已提交 git diff，將 routed changed-mode path 與原生 root-project run 做 benchmark。
- `pnpm test:perf:changed:bench -- --worktree`：不先提交，直接對目前 worktree change set 做 benchmark。
- `pnpm test:perf:profile:main`：為 Vitest main thread 寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為 unit runner 寫入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：逐一序列執行每個 full-suite Vitest leaf config，並寫入 grouped duration data 以及每個 config 的 JSON/log artifact。Test Performance Agent 會在嘗試修復慢速測試前用它作為 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在效能導向變更後比較 grouped report。
- Gateway 整合：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇加入。
- `pnpm test:e2e`：執行 Gateway end-to-end smoke test（multi-instance WS/HTTP/node pairing）。預設使用 `threads` + `isolate: false`，並在 `vitest.e2e.config.ts` 中使用 adaptive worker；用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細 log。
- `pnpm test:live`：執行 provider live test（minimax/zai）。需要 API key 和 `LIVE=1`（或 provider-specific `*_LIVE_TEST=1`）才能解除 skip。
- `pnpm test:docker:all`：建置共用 live-test image，將 OpenClaw 一次打包為 npm tarball，建置/重用 bare Node/Git runner image，以及把該 tarball 安裝到 `/app` 的 functional image，然後透過加權 scheduler 以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker smoke lane。Bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於 installer/update/plugin-dependency lane；這些 lane 會掛載預先建置的 tarball，而不是使用複製的 repo source。Functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般 built-app functionality lane。`scripts/package-openclaw-for-docker.mjs` 是單一本機/CI package packer，並會在 Docker 使用前驗證 tarball 和 `dist/postinstall-inventory.json`。Docker lane definition 位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner logic 位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的 plan。`node scripts/test-docker-all.mjs --plan-json` 會輸出由 scheduler 擁有的 CI plan，內容包含選定 lane、image kind、package/live-image needs、state scenario 和 credential check，而不建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制 process slot，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，預設為 10。Heavy lane cap 預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider cap 預設透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`，讓每個 provider 一次一個 heavy lane。較大的 host 可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果在低平行度 host 上單一 lane 超過有效 weight 或 resource cap，它仍可從空 pool 啟動，並會單獨執行直到釋放 capacity。Lane start 預設錯開 2 秒，以避免本機 Docker daemon create storm；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。Runner 預設會 preflight Docker、清理 stale OpenClaw E2E container、每 30 秒輸出 active-lane status、在相容 lane 間共用 provider CLI tool cache、預設重試一次暫時性 live-provider failure（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將 lane timing 儲存在 `.artifacts/docker-tests/lane-timings.json`，供後續執行以 longest-first ordering 使用。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印 lane manifest 而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整 status output，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用 timing reuse。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 只執行 deterministic/local lane，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 只執行 live-provider lane；package alias 為 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。Live-only mode 會把 main 和 tail live lane 合併到一個 longest-first pool，讓 provider bucket 可以一起打包 Claude、Codex 和 Gemini work。Runner 在第一次 failure 後會停止排程新的 pooled lane，除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`；每個 lane 都有 120 分鐘 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail lane 會使用更嚴格的 per-lane cap。CLI backend Docker setup command 有自己的 timeout，透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（預設 180）設定。每個 lane 的 log、`summary.json`、`failures.json` 和 phase timing 會寫在 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 檢查慢速 lane，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印低成本的 targeted rerun command。
- `pnpm test:docker:browser-cdp-snapshot`：建置 Chromium-backed source E2E container、啟動 raw CDP 加上隔離的 Gateway、執行 `browser doctor --deep`，並驗證 CDP role snapshot 包含 link URL、cursor-promoted clickable、iframe ref 和 frame metadata。
- CLI backend live Docker probe 可作為 focused lane 執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有相對應的 `:resume` 與 `:mcp` alias。
- `pnpm test:docker:openwebui`：啟動 Dockerized OpenClaw + Open WebUI、透過 Open WebUI 登入、檢查 `/api/models`，然後透過 `/api/chat/completions` 執行真實 proxied chat。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI）、會 pull 外部 Open WebUI image，且不預期像一般 unit/e2e suite 一樣具備 CI 穩定性。
- `pnpm test:docker:mcp-channels`：啟動 seeded Gateway container 和第二個 client container，後者會 spawn `openclaw mcp serve`，接著驗證 routed conversation discovery、transcript read、attachment metadata、live event queue behavior、outbound send routing，以及透過真實 stdio bridge 傳送的 Claude-style channel + permission notification。Claude notification assertion 會直接讀取 raw stdio MCP frame，因此 smoke 會反映 bridge 實際輸出的內容。
- `pnpm test:docker:upgrade-survivor`：在髒的舊使用者 fixture 上安裝打包的 OpenClaw tarball，執行套件更新加上非互動式 doctor，不使用即時提供者或頻道金鑰，然後啟動 loopback Gateway，並檢查代理、頻道設定、Plugin 允許清單、工作區/工作階段檔案、過時的舊版 Plugin 依賴狀態、啟動流程，以及 RPC 狀態是否都能保留下來。
- `pnpm test:docker:published-upgrade-survivor`：預設安裝 `openclaw@latest`，植入真實既有使用者檔案但不使用即時提供者或頻道金鑰，透過內建的 `openclaw config set` 命令配方設定該基準，將該已發布安裝更新為打包的 OpenClaw tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 loopback Gateway，並檢查已設定的意圖、工作區/工作階段檔案、過時的 Plugin 設定與舊版依賴狀態、啟動流程、`/healthz`、`/readyz`，以及 RPC 狀態是否能保留下來或乾淨修復。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確的本機矩陣，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 加入情境 fixture；reported-issues 集合包含 `configured-plugin-installs`，用來驗證已設定的外部 OpenClaw plugins 會在升級期間自動安裝，也包含 `stale-source-plugin-shadow`，用來避免僅來源的 Plugin shadow 破壞啟動流程。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，並在把精確套件規格交給 Docker lanes 前，先解析例如 `last-stable-4` 或 `all-since-2026.4.23` 的中繼基準 token。
- `pnpm test:docker:update-migration`：在 cleanup-heavy 的 `plugin-deps-cleanup` 情境中執行 published-upgrade survivor harness，預設從 `openclaw@2026.4.23` 開始。獨立的 `Update Migration` workflow 會用 `baselines=all-since-2026.4.23` 展開此 lane，讓 `.23` 之後每個已發布的穩定套件都更新到候選版本，並在 Full Release CI 之外證明已設定 Plugin 的依賴清理。
- `pnpm test:docker:plugins`：針對本機路徑、`file:`、具有 hoisted 依賴的 npm registry 套件、git moving refs、ClawHub fixtures、marketplace 更新，以及 Claude-bundle 啟用/檢查，執行安裝/更新 smoke。

## 本機 PR gate

針對本機 PR 合併/gate 檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上出現不穩定失敗，請先重新執行一次，再將其視為回歸；接著用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

指令碼：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示：「以單一字詞回覆：ok。不要標點符號或額外文字。」

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

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小/最大值、離開代碼/訊號分布，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 profile，讓計時與 profile 擷取使用同一套 harness。

已儲存輸出的慣例：

- `pnpm test:startup:bench:smoke` 會將目標 smoke 成品寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 與 `warmup=1`，將完整套件成品寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 與 `warmup=1`，重新整理已簽入的基準 fixture：`test/fixtures/cli-startup-bench.json`

已簽入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## Onboarding E2E（Docker）

Docker 是選用的；只有容器化 onboarding smoke 測試才需要。

在乾淨 Linux 容器中的完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

此指令碼會透過 pseudo-tty 驅動互動式精靈，驗證 config/workspace/session 檔案，接著啟動 Gateway 並執行 `openclaw health`。

## QR 匯入 smoke（Docker）

確保維護中的 QR runtime helper 能在支援的 Docker Node runtime（Node 24 預設、Node 22 相容）下載入：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與 plugins](/zh-TW/help/testing-updates-plugins)
