---
read_when:
    - 執行或修復測試
summary: 如何在本機執行測試 (vitest)，以及何時使用強制/涵蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-05-10T19:50:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具組（套件、live、Docker）：[測試](/zh-TW/help/testing)
- 更新與 Plugin 套件驗證：[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)

- `pnpm test:force`: 終止任何仍占用預設控制埠的殘留 gateway 行程，然後使用隔離的 Gateway 埠執行完整 Vitest 套件，讓伺服器測試不會與正在執行的執行個體衝突。當先前的 Gateway 執行讓埠 18789 被占用時使用此指令。
- `pnpm test:coverage`: 使用 V8 覆蓋率（透過 `vitest.unit.config.ts`）執行單元套件。這是預設單元路徑的覆蓋率閘門，不是整個 repo 的全檔案覆蓋率。門檻為 70% 行/函式/陳述式，以及 55% 分支。由於 `coverage.all` 為 false，且預設路徑將覆蓋率 include 範圍限定在具有相鄰來源檔案的非快速單元測試，此閘門會衡量此路徑擁有的來源，而不是它碰巧載入的每個遞移匯入。
- `pnpm test:coverage:changed`: 只針對自 `origin/main` 以來已變更的檔案執行單元覆蓋率。
- `pnpm test:changed`: 低成本的智慧變更測試執行。它會從直接測試編輯、相鄰的 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖執行精準目標。寬泛/設定/套件變更會被略過，除非它們能對應到精準測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明確的寬泛變更測試執行。當測試框架/設定/套件編輯應回退到 Vitest 較寬泛的變更測試行為時使用。
- `pnpm changed:lanes`: 顯示相對於 `origin/main` 的 diff 觸發的架構路徑。
- `pnpm check:changed`: 針對相對於 `origin/main` 的 diff 執行智慧變更檢查閘門。它會為受影響的架構路徑執行型別檢查、lint 和 guard 指令，但不會執行 Vitest 測試。請使用 `pnpm test:changed` 或明確的 `pnpm test <target>` 作為測試證明。
- `pnpm test`: 將明確的檔案/目錄目標路由到範圍化的 Vitest 路徑。未指定目標的執行會使用固定分片群組，並展開到 leaf 設定以供本機平行執行；Plugin 群組一律展開到個別 Plugin 的分片設定，而不是一個龐大的根專案行程。
- 測試包裝器執行結束時會有簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗時行仍保留為每個分片的詳細資訊。
- 共享 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定 fixture、工作區、agent 目錄或 auth-profile store 時，請從 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- 行程 E2E 輔助工具：當 Vitest 行程層級 E2E 測試需要執行中的 Gateway、CLI env、log 擷取，以及集中清理時，請使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E 輔助工具：source `scripts/lib/docker-e2e-image.sh` 的路徑可以將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多 home 腳本可以傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。較低階的呼叫者可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 取得容器內 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 取得可 source 的主機 env 檔。`create` 前的 `--` 可避免較新的 Node runtime 將 `--env-file` 視為 Node flag。會啟動 Gateway 的 Docker/Bash 路徑可以在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，用於 entrypoint 解析、mock OpenAI 啟動、Gateway 前景/背景啟動、就緒探測、狀態 env 匯出、log dump，以及行程清理。
- 完整、Plugin，以及 include-pattern 分片執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機時間資料；後續整個設定的執行會使用這些時間來平衡慢速與快速分片。Include-pattern CI 分片會將分片名稱附加到時間 key，這會讓篩選後的分片時間保持可見，而不取代整個設定的時間資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機時間 artifact。
- 選定的 `plugin-sdk` 和 `commands` 測試檔案現在會路由到專用的輕量路徑，這些路徑只保留 `test/setup.ts`，並讓 runtime-heavy 案例留在既有路徑。
- 具有相鄰測試的來源檔案會先對應到該相鄰測試，再回退到較寬的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的輔助工具編輯，會使用本機匯入圖來執行匯入它們的測試，而不是在依賴路徑精準時寬泛執行每個分片。
- `auto-reply` 現在也拆分為三個專用設定（`core`、`top-level`、`reply`），因此 reply 測試框架不會主導較輕量的 top-level 狀態/token/輔助工具測試。
- 基礎 Vitest 設定現在預設為 `pool: "threads"` 和 `isolate: false`，並在整個 repo 設定中啟用共享的非隔離 runner。
- `pnpm test:channels` 會執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 會執行所有 Plugin 分片。重型頻道 Plugin、瀏覽器 Plugin，以及 OpenAI 會作為專用分片執行；其他 Plugin 群組維持批次處理。使用 `pnpm test extensions/<id>` 執行單一內建 Plugin 路徑。
- `pnpm test:perf:imports`: 啟用 Vitest 匯入耗時 + 匯入明細報告，同時仍對明確檔案/目錄目標使用範圍化路徑路由。
- `pnpm test:perf:imports:changed`: 相同的匯入 profiling，但只針對自 `origin/main` 以來已變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對相同已提交 git diff，將路由後的 changed-mode 路徑與原生根專案執行進行 benchmark。
- `pnpm test:perf:changed:bench -- --worktree` 會在不先提交的情況下，針對目前 worktree 變更集進行 benchmark。
- `pnpm test:perf:profile:main`: 為 Vitest 主執行緒寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: 為單元 runner 寫入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: 逐一序列執行每個完整套件 Vitest leaf 設定，並寫入分組耗時資料以及每個設定的 JSON/log artifact。Test Performance Agent 會在嘗試修復慢速測試前，使用此作為基準。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: 在以效能為重點的變更後比較分組報告。
- Gateway 整合：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇性啟用。
- `pnpm test:e2e`: 執行 Gateway 端對端煙霧測試（多執行個體 WS/HTTP/node 配對）。預設在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 搭配自適應 workers；可用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細 log。
- `pnpm test:live`: 執行 provider live tests（minimax/zai）。需要 API keys 和 `LIVE=1`（或 provider-specific `*_LIVE_TEST=1`）才能取消跳過。
- `pnpm test:docker:all`: 建置共享的 live-test 映像檔，將 OpenClaw 一次打包為 npm tarball，建置/重用一個裸 Node/Git runner 映像檔，以及一個會把該 tarball 安裝到 `/app` 的功能映像檔，然後透過加權 scheduler 以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker 煙霧路徑。裸映像檔（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於 installer/update/plugin-dependency 路徑；這些路徑會掛載預先建置的 tarball，而不是使用複製的 repo 來源。功能映像檔（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般建置後 app 功能路徑。`scripts/package-openclaw-for-docker.mjs` 是唯一的本機/CI 套件 packer，並會在 Docker 使用前驗證 tarball 和 `dist/postinstall-inventory.json`。Docker 路徑定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定計畫。`node scripts/test-docker-all.mjs --plan-json` 會輸出由 scheduler 擁有的 CI 計畫，內容包含選定路徑、映像檔種類、套件/live-image 需求、狀態情境，以及憑證檢查，而不會建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制行程 slot，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，預設為 10。重型路徑上限預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider 上限預設為每個 provider 一個重型路徑，透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`。較大的主機可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某個路徑在低平行度主機上超過有效權重或資源上限，它仍可從空 pool 啟動，並會單獨執行直到釋放容量。路徑啟動預設錯開 2 秒，以避免本機 Docker daemon 建立風暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。runner 預設會預檢 Docker、清理陳舊的 OpenClaw E2E 容器、每 30 秒輸出 active-lane 狀態、在相容路徑之間共享 provider CLI tool caches、預設重試一次暫時性 live-provider 失敗（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將路徑時間儲存在 `.artifacts/docker-tests/lane-timings.json`，供後續執行依最長優先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不執行 Docker 的情況下列印路徑 manifest，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整狀態輸出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用時間重用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 只執行確定性/本機路徑，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 只執行 live-provider 路徑；套件別名為 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。Live-only 模式會將 main 和 tail live 路徑合併為一個最長優先 pool，讓 provider bucket 可以一起打包 Claude、Codex 和 Gemini 工作。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，runner 會在第一次失敗後停止排程新的 pooled 路徑，且每個路徑都有 120 分鐘 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail 路徑使用更嚴格的每路徑上限。CLI backend Docker 設定指令有自己的 timeout，透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（預設 180）。每路徑 log、`summary.json`、`failures.json` 和階段時間會寫入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 檢查慢速路徑，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印低成本的精準重新執行指令。
- `pnpm test:docker:browser-cdp-snapshot`: 建置以 Chromium 為後端的來源 E2E 容器，啟動原始 CDP 加上隔離 Gateway，執行 `browser doctor --deep`，並驗證 CDP role snapshots 包含 link URLs、cursor-promoted clickables、iframe refs 和 frame metadata。
- `pnpm test:docker:skill-install`: 在裸 Docker runner 中安裝打包後的 OpenClaw tarball，停用 `skills.install.allowUploadedArchives`，從即時 ClawHub 搜尋解析目前 skill slug，透過 `openclaw skills install` 安裝，並驗證 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 和 `skills info --json`。
- CLI backend live Docker probes 可以作為聚焦路徑執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有對應的 `:resume` 和 `:mcp` 別名。
- `pnpm test:docker:openwebui`: 啟動 Dockerized OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，然後透過 `/api/chat/completions` 執行真實的 proxied chat。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI），會拉取外部 Open WebUI 映像檔，且不預期像一般 unit/e2e 套件一樣具備 CI 穩定性。
- `pnpm test:docker:mcp-channels`：啟動已植入資料的 Gateway 容器，以及第二個會產生 `openclaw mcp serve` 的用戶端容器，接著驗證路由後的對話探索、逐字稿讀取、附件中繼資料、即時事件佇列行為、對外傳送路由，以及透過真實 stdio 橋接器傳送的 Claude 風格頻道與權限通知。Claude 通知斷言會直接讀取原始 stdio MCP 訊框，因此該煙霧測試反映橋接器實際發出的內容。
- `pnpm test:docker:upgrade-survivor`：將封裝好的 OpenClaw tarball 安裝到有髒資料的舊使用者 fixture 上，執行套件更新以及不含即時 provider 或頻道金鑰的非互動式 doctor，接著啟動 loopback Gateway，並檢查代理、頻道設定、Plugin 允許清單、工作區/工作階段檔案、過期的舊版 Plugin 相依狀態、啟動流程，以及 RPC 狀態是否都能保留下來。
- `pnpm test:docker:published-upgrade-survivor`：預設安裝 `openclaw@latest`，植入沒有即時 provider 或頻道金鑰的擬真既有使用者檔案，使用內建的 `openclaw config set` 指令配方設定該基準，將該已發佈安裝更新到封裝好的 OpenClaw tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動 loopback Gateway，並檢查已設定的意圖、工作區/工作階段檔案、過期的 Plugin 設定與舊版相依狀態、啟動流程、`/healthz`、`/readyz`，以及 RPC 狀態是否能保留或乾淨地修復。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確的本機矩陣，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 新增情境 fixture；reported-issues 集合包含 `configured-plugin-installs`，用來驗證升級期間會自動安裝已設定的外部 OpenClaw plugins，以及 `stale-source-plugin-shadow`，用來避免僅存在於原始碼的 Plugin shadow 破壞啟動。套件驗收會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，並在把精確套件規格交給 Docker lanes 前，解析像 `last-stable-4` 或 `all-since-2026.4.23` 這類中繼基準 token。
- `pnpm test:docker:update-migration`：在清理工作繁重的 `plugin-deps-cleanup` 情境中執行已發佈升級 survivor harness，預設從 `openclaw@2026.4.23` 開始。獨立的 `Update Migration` workflow 會以 `baselines=all-since-2026.4.23` 展開此 lane，因此從 `.23` 起的每個穩定已發佈套件都會更新到候選版本，並在完整發行 CI 之外證明已設定 Plugin 的相依清理。
- `pnpm test:docker:plugins`：針對本機路徑、`file:`、具有 hoisted 相依項的 npm registry 套件、git 移動 ref、ClawHub fixture、marketplace 更新，以及 Claude-bundle 啟用/檢查，執行安裝/更新煙霧測試。

## 本機 PR 門檻

若要在本機執行 PR 合併/門檻檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上出現不穩定失敗，先重新執行一次，再將其視為回歸，然後用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

腳本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 選用 env：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示："Reply with a single word: ok. No punctuation or extra text."

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

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 兩個預設集

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小/最大值、退出代碼/訊號分布，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 profiles，讓計時與 profile 擷取使用相同的測試框架。

已儲存輸出的慣例：

- `pnpm test:startup:bench:smoke` 會將目標 smoke artifact 寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 和 `warmup=1`，將完整套件 artifact 寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 和 `warmup=1`，重新整理已納入版控的基準 fixture：`test/fixtures/cli-startup-bench.json`

已納入版控的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## Onboarding E2E（Docker）

Docker 是選用項；只有容器化 onboarding smoke tests 需要它。

在乾淨 Linux 容器中的完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

此腳本會透過 pseudo-tty 驅動互動式精靈，驗證 config/workspace/session 檔案，然後啟動 Gateway 並執行 `openclaw health`。

## QR 匯入 smoke（Docker）

確保維護中的 QR runtime helper 可在支援的 Docker Node runtimes（預設 Node 24，相容 Node 22）下載入：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與 plugins](/zh-TW/help/testing-updates-plugins)
