---
read_when:
    - 執行或修復測試
summary: 如何在本機執行測試 (vitest) 以及何時使用強制/覆蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-05-06T02:57:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4a87abe86ab28f14b1ea96846ee221eb504fb1bc9e6c17b4b2f348867cde855d
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具包（測試套件、即時、Docker）：[測試](/zh-TW/help/testing)
- 更新與 Plugin 套件驗證：[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)

- `pnpm test:force`：終止任何仍占用預設控制連接埠的殘留 Gateway 程序，然後以隔離的 Gateway 連接埠執行完整 Vitest 套件，讓伺服器測試不會與執行中的執行個體衝突。當先前的 Gateway 執行留下連接埠 18789 被占用時使用。
- `pnpm test:coverage`：使用 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是預設單元 lane 的覆蓋率 gate，不是整個 repo 的全檔案覆蓋率。閾值為 70% 行數/函式/陳述式與 55% 分支。由於 `coverage.all` 為 false，且預設 lane 會將覆蓋率包含範圍限定到具備 sibling 原始檔的非快速單元測試，因此此 gate 會測量此 lane 擁有的原始碼，而不是它剛好載入的每個遞移 import。
- `pnpm test:coverage:changed`：只針對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：低成本的智慧變更測試執行。它會從直接測試編輯、sibling `*.test.ts` 檔案、明確的原始碼對應，以及 local import 圖執行精準目標。廣泛/config/package 變更會被略過，除非它們對應到精準測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的廣泛變更測試執行。當測試 harness/config/package 編輯應回退到 Vitest 較廣泛的 changed-test 行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的 diff 觸發的架構 lane。
- `pnpm check:changed`：針對相對於 `origin/main` 的 diff 執行智慧變更檢查 gate。它會針對受影響的架構 lane 執行 typecheck、lint 與 guard 命令，但不會執行 Vitest 測試。測試證明請使用 `pnpm test:changed` 或明確的 `pnpm test <target>`。
- `pnpm test`：將明確的檔案/目錄目標路由到具作用域的 Vitest lane。未指定目標的執行會使用固定 shard 群組，並展開到 leaf config 以進行本機平行執行；extension 群組一律展開到各 extension shard config，而不是單一巨大的 root-project 程序。
- 測試 wrapper 執行結尾會有一段簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的 duration 行仍保留作為每個 shard 的細節。
- 共用 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir 或 auth-profile store 時，從 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- 程序 E2E helper：當 Vitest 程序層級 E2E 測試需要在同一處取得執行中的 Gateway、CLI env、log capture 與 cleanup 時，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E helper：source `scripts/lib/docker-e2e-image.sh` 的 lane 可以將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入 container，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；multi-home script 可以傳入 `docker_e2e_test_state_function_b64`，並在每個 flow 中呼叫 `openclaw_test_state_create <label> <scenario>`。較低層級的 caller 可使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 取得 container 內 shell snippet，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 取得可被 source 的 host env 檔案。`create` 前的 `--` 會避免較新的 Node runtime 將 `--env-file` 視為 Node flag。啟動 Gateway 的 Docker/Bash lane 可以在 container 內 source `scripts/lib/openclaw-e2e-instance.sh`，以處理 entrypoint resolution、mock OpenAI startup、Gateway foreground/background launch、readiness probe、state env export、log dump 與程序 cleanup。
- 完整、extension 與 include-pattern shard 執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機 timing 資料；後續 whole-config 執行會使用這些 timing 平衡慢速與快速 shard。Include-pattern CI shard 會將 shard 名稱附加到 timing key，讓篩選後的 shard timing 可見，而不會取代 whole-config timing 資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機 timing artifact。
- 選定的 `plugin-sdk` 與 `commands` 測試檔現在會路由到專用輕量 lane，這些 lane 只保留 `test/setup.ts`，並讓 runtime-heavy case 留在既有 lane。
- 具備 sibling 測試的原始檔會先對應到該 sibling，再回退到較廣的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 與 `src/plugins/contracts` 底下的 helper 編輯會使用 local import 圖來執行 importing tests，而不是在 dependency path 精準時廣泛執行每個 shard。
- `auto-reply` 現在也分成三個專用 config（`core`、`top-level`、`reply`），讓 reply harness 不會主導較輕量的 top-level status/token/helper 測試。
- Base Vitest config 現在預設為 `pool: "threads"` 與 `isolate: false`，並在整個 repo config 啟用共用非隔離 runner。
- `pnpm test:channels` 會執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 與 `pnpm test extensions` 會執行所有 extension/Plugin shard。heavy channel Plugin、browser Plugin 與 OpenAI 會作為專用 shard 執行；其他 Plugin 群組維持 batched。單一 bundled Plugin lane 請使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：啟用 Vitest import-duration 與 import-breakdown 報告，同時仍對明確的檔案/目錄目標使用 scoped lane routing。
- `pnpm test:perf:imports:changed`：相同的 import profiling，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會 benchmark routed changed-mode path 與相同已提交 git diff 的原生 root-project 執行。
- `pnpm test:perf:changed:bench -- --worktree` 會在不先 commit 的情況下 benchmark 目前 worktree 變更集。
- `pnpm test:perf:profile:main`：為 Vitest main thread 寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為 unit runner 寫入 CPU 與 heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：serially 執行每個 full-suite Vitest leaf config，並寫入分組 duration 資料，以及每個 config 的 JSON/log artifact。Test Performance Agent 會在嘗試修復慢速測試前，將此作為 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在 performance-focused 變更後比較分組報告。
- Gateway integration：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇加入。
- `pnpm test:e2e`：執行 Gateway 端對端 smoke test（multi-instance WS/HTTP/node pairing）。預設為 `threads` + `isolate: false`，並在 `vitest.e2e.config.ts` 中使用 adaptive workers；可用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得 verbose log。
- `pnpm test:live`：執行 provider live test（minimax/zai）。需要 API key 與 `LIVE=1`（或 provider-specific `*_LIVE_TEST=1`）才會解除略過。
- `pnpm test:docker:all`：建置共用 live-test image，將 OpenClaw 打包一次為 npm tarball，建置/重用 bare Node/Git runner image，以及將該 tarball 安裝到 `/app` 的 functional image，然後透過 weighted scheduler 以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker smoke lane。bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於 installer/update/plugin-dependency lane；這些 lane 會掛載預先建置的 tarball，而不是使用複製的 repo source。functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般 built-app functionality lane。`scripts/package-openclaw-for-docker.mjs` 是單一 local/CI package packer，並會在 Docker 消耗前驗證 tarball 與 `dist/postinstall-inventory.json`。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner logic 位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的 plan。`node scripts/test-docker-all.mjs --plan-json` 會輸出 scheduler-owned CI plan，內容包含選定 lane、image kind、package/live-image needs、state scenario 與 credential check，而不會建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制程序 slot，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，預設為 10。heavy lane cap 預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 與 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider cap 預設透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 與 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`，限制每個 provider 一個 heavy lane。較大型 host 請使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某個 lane 在低平行度 host 上超過 effective weight 或 resource cap，它仍可從空 pool 開始，並會單獨執行直到釋放容量。lane start 預設會錯開 2 秒，以避免本機 Docker daemon create storm；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。runner 預設會 preflight Docker、清理 stale OpenClaw E2E container、每 30 秒輸出 active-lane status、在相容 lane 之間共用 provider CLI tool cache、預設重試 transient live-provider failure 一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將 lane timing 存到 `.artifacts/docker-tests/lane-timings.json`，供後續執行 longest-first ordering。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印 lane manifest 而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整 status output，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用 timing reuse。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 可只執行 deterministic/local lane，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 可只執行 live-provider lane；package alias 為 `pnpm test:docker:local:all` 與 `pnpm test:docker:live:all`。Live-only mode 會將 main 與 tail live lane 合併成一個 longest-first pool，讓 provider bucket 可以一起打包 Claude、Codex 與 Gemini 工作。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，runner 會在第一次失敗後停止排程新的 pooled lane，且每個 lane 具備 120 分鐘 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail lane 會使用較嚴格的 per-lane cap。CLI backend Docker setup command 有自己的 timeout，可透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 設定（預設 180）。每個 lane 的 log、`summary.json`、`failures.json` 與 phase timing 會寫入 `.artifacts/docker-tests/<run-id>/` 底下；使用 `pnpm test:docker:timings <summary.json>` 檢查慢速 lane，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印低成本的 targeted rerun command。
- `pnpm test:docker:browser-cdp-snapshot`：建置 Chromium-backed source E2E container，啟動 raw CDP 加上隔離的 Gateway，執行 `browser doctor --deep`，並驗證 CDP role snapshot 包含 link URL、cursor-promoted clickable、iframe ref 與 frame metadata。
- CLI backend live Docker probe 可以作為 focused lane 執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 與 Gemini 也有對應的 `:resume` 與 `:mcp` alias。
- `pnpm test:docker:openwebui`：啟動 Dockerized OpenClaw + Open WebUI、透過 Open WebUI 登入、檢查 `/api/models`，然後透過 `/api/chat/completions` 執行真正的 proxied chat。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI），會 pull 外部 Open WebUI image，且不預期像一般 unit/e2e suite 一樣具有 CI-stable。
- `pnpm test:docker:mcp-channels`：啟動一個已預置資料的 Gateway 容器，以及第二個會產生 `openclaw mcp serve` 的用戶端容器，然後驗證路由後的對話探索、逐字稿讀取、附件中繼資料、即時事件佇列行為、對外傳送路由，以及透過真正 stdio 橋接器傳遞的 Claude 風格頻道 + 權限通知。Claude 通知斷言會直接讀取原始 stdio MCP 框架，因此該 smoke 反映橋接器實際發出的內容。
- `pnpm test:docker:upgrade-survivor`：將打包後的 OpenClaw tarball 安裝到髒汙的舊使用者 fixture 上，執行套件更新加上非互動式 doctor，且不使用即時提供者或頻道金鑰，然後啟動 loopback Gateway，並檢查 agents、頻道設定、Plugin allowlist、workspace/session 檔案、過時的舊版 Plugin 相依狀態、啟動流程，以及 RPC 狀態是否都能保留。
- `pnpm test:docker:published-upgrade-survivor`：預設安裝 `openclaw@latest`，預置逼真的既有使用者檔案，且不使用即時提供者或頻道金鑰，使用內建的 `openclaw config set` 命令配方設定該基準，將該已發佈安裝更新到打包後的 OpenClaw tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 loopback Gateway，並檢查已設定的 intents、workspace/session 檔案、過時的 Plugin 設定與舊版相依狀態、啟動流程、`/healthz`、`/readyz`，以及 RPC 狀態是否能保留或乾淨修復。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確的本機矩陣，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 加入情境 fixture；reported-issues 集合包含 `configured-plugin-installs`，用來驗證已設定的外部 OpenClaw Plugin 會在升級期間自動安裝，以及 `stale-source-plugin-shadow`，用來避免僅存在於原始碼的 Plugin shadow 破壞啟動流程。套件接受測試會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，並在將精確套件規格交給 Docker lanes 前解析中繼基準 token，例如 `last-stable-4` 或 `all-since-2026.4.23`。
- `pnpm test:docker:update-migration`：在清理工作繁重的 `plugin-deps-cleanup` 情境中執行已發佈升級 survivor harness，預設從 `openclaw@2026.4.23` 開始。獨立的 `Update Migration` workflow 會以 `baselines=all-since-2026.4.23` 展開此 lane，讓從 `.23` 起的每個穩定已發佈套件都更新到候選版本，並在 Full Release CI 之外證明已設定 Plugin 的相依清理。
- `pnpm test:docker:plugins`：對本機路徑、`file:`、具有 hoisted 相依項的 npm registry 套件、git moving refs、ClawHub fixture、marketplace 更新，以及 Claude-bundle 啟用/檢查執行安裝/更新 smoke。

## 本機 PR gate

若要執行本機 PR land/gate 檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上偶發失敗，請先重新執行一次，再將其視為迴歸；接著用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

腳本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示：「回覆單一字詞：ok。不要標點或額外文字。」

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

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小/最大值、結束碼/訊號分布，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 profile，讓計時與 profile 擷取使用同一套 harness。

已儲存輸出慣例：

- `pnpm test:startup:bench:smoke` 會將目標 smoke artifact 寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會以 `runs=5` 和 `warmup=1` 將完整套件 artifact 寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會以 `runs=5` 和 `warmup=1` 重新整理已納入版控的基準 fixture：`test/fixtures/cli-startup-bench.json`

已納入版控的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## Onboarding E2E（Docker）

Docker 是選用的；這只在容器化 onboarding smoke 測試時需要。

在乾淨 Linux 容器中的完整 cold-start 流程：

```bash
scripts/e2e/onboard-docker.sh
```

此腳本會透過 pseudo-tty 驅動互動式精靈，驗證 config/workspace/session 檔案，然後啟動 Gateway 並執行 `openclaw health`。

## QR 匯入 smoke 測試（Docker）

確保維護中的 QR runtime helper 能在受支援的 Docker Node runtime 下載入（Node 24 預設，Node 22 相容）：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [Live 測試](/zh-TW/help/testing-live)
- [更新與 Plugin 測試](/zh-TW/help/testing-updates-plugins)
