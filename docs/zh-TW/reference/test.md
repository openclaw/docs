---
read_when:
    - 執行或修復測試
summary: 如何在本機執行測試（vitest），以及何時使用強制/涵蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-04-30T03:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具包（套件、即時、Docker）：[測試](/zh-TW/help/testing)

- `pnpm test:force`：終止任何仍占用預設控制埠的殘留 Gateway 行程，接著使用隔離的 Gateway 埠執行完整 Vitest 套件，讓伺服器測試不會與執行中的實例衝突。當先前的 Gateway 執行讓埠 18789 被占用時，使用此指令。
- `pnpm test:coverage`：使用 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是已載入檔案的單元覆蓋率關卡，不是整個儲存庫的全檔案覆蓋率。閾值為 70% 行數/函式/陳述式，以及 55% 分支。因為 `coverage.all` 為 false，這個關卡會測量單元覆蓋率套件載入的檔案，而不是把每個分割 lane 的原始碼檔案都視為未覆蓋。
- `pnpm test:coverage:changed`：只針對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：便宜的智慧變更測試執行。它會從直接測試編輯、相鄰的 `*.test.ts` 檔案、明確的原始碼對應，以及本機匯入圖執行精確目標。寬泛/設定/套件變更會被略過，除非它們對應到精確測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的寬泛變更測試執行。當測試工具/設定/套件編輯應該退回 Vitest 較寬泛的變更測試行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的差異所觸發的架構 lanes。
- `pnpm check:changed`：針對相對於 `origin/main` 的差異執行智慧變更檢查關卡。它會為受影響的架構 lanes 執行型別檢查、lint 與守衛指令，但不會執行 Vitest 測試。測試證明請使用 `pnpm test:changed` 或明確的 `pnpm test <target>`。
- `pnpm test`：透過作用域化的 Vitest lanes 路由明確的檔案/目錄目標。未指定目標的執行會使用固定 shard 群組，並展開為 leaf 設定以便本機平行執行；extension 群組一律展開為每個 extension 的 shard 設定，而不是一個巨大的根專案行程。
- 測試包裝器執行會以簡短的 `[test] passed|failed|skipped ... in ...` 摘要結束。Vitest 自己的持續時間行會保留為每個 shard 的細節。
- 共享的 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定 fixture、工作區、agent 目錄或 auth-profile 存放區時，從 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- 行程 E2E 輔助工具：當 Vitest 行程層級 E2E 測試需要執行中的 Gateway、CLI env、日誌擷取與清理集中在一處時，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E 輔助工具：source `scripts/lib/docker-e2e-image.sh` 的 lanes 可以把 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多 home 腳本可以傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。較低階呼叫端可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 產生容器內 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 產生可 source 的主機 env 檔案。`create` 前面的 `--` 會避免較新的 Node runtime 把 `--env-file` 視為 Node 旗標。啟動 Gateway 的 Docker/Bash lanes 可以在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，用於 entrypoint 解析、模擬 OpenAI 啟動、Gateway 前景/背景啟動、就緒探測、狀態 env 匯出、日誌傾印與行程清理。
- 完整、extension 與 include-pattern shard 執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機計時資料；後續的 whole-config 執行會使用這些計時來平衡慢速與快速 shard。Include-pattern CI shards 會把 shard 名稱附加到計時 key，這會讓篩選後的 shard 計時保持可見，而不會取代 whole-config 計時資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機計時 artifact。
- 選定的 `plugin-sdk` 與 `commands` 測試檔案現在會透過專用輕量 lanes 路由，這些 lanes 只保留 `test/setup.ts`，並把 runtime-heavy 案例留在既有 lanes 上。
- 有相鄰測試的原始碼檔案會先對應到該相鄰測試，再退回較寬的目錄 globs。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 與 `src/plugins/contracts` 下的輔助工具編輯，會使用本機匯入圖來執行匯入它們的測試，而不是在依賴路徑精確時寬泛執行每個 shard。
- `auto-reply` 現在也分成三個專用設定（`core`、`top-level`、`reply`），因此 reply harness 不會主導較輕量的頂層狀態/token/輔助工具測試。
- 基礎 Vitest 設定現在預設為 `pool: "threads"` 與 `isolate: false`，並在整個儲存庫設定中啟用共享的非隔離 runner。
- `pnpm test:channels` 執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 與 `pnpm test extensions` 會執行所有 extension/Plugin shards。重型 channel plugins、瀏覽器 Plugin 與 OpenAI 會作為專用 shards 執行；其他 Plugin 群組會保持批次處理。針對單一 bundled Plugin lane，請使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：啟用 Vitest 匯入持續時間與匯入分解報告，同時仍針對明確的檔案/目錄目標使用作用域化 lane 路由。
- `pnpm test:perf:imports:changed`：相同的匯入 profiling，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會用相同已提交 git diff，將 routed changed-mode 路徑與原生 root-project 執行進行基準測試。
- `pnpm test:perf:changed:bench -- --worktree` 會在不先提交的情況下，對目前 worktree 變更集進行基準測試。
- `pnpm test:perf:profile:main`：為 Vitest 主執行緒寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為單元 runner 寫入 CPU 與 heap profiles（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：序列執行每個 full-suite Vitest leaf config，並寫入分組持續時間資料以及每個 config 的 JSON/log artifacts。Test Performance Agent 會在嘗試修復慢速測試前使用此項作為基準線。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在以效能為重點的變更後比較分組報告。
- Gateway 整合：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇加入。
- `pnpm test:e2e`：執行 Gateway 端對端 smoke tests（多實例 WS/HTTP/node pairing）。預設在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 搭配自適應 workers；使用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細日誌。
- `pnpm test:live`：執行 provider live tests（minimax/zai）。需要 API keys 與 `LIVE=1`（或 provider-specific `*_LIVE_TEST=1`）才會取消略過。
- `pnpm test:docker:all`：建置共享 live-test image，將 OpenClaw 一次打包成 npm tarball，建置/重用 bare Node/Git runner image，加上一個會把該 tarball 安裝到 `/app` 的 functional image，接著透過 weighted scheduler 使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker smoke lanes。bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於 installer/update/plugin-dependency lanes；這些 lanes 會掛載預先建置的 tarball，而不是使用複製的儲存庫原始碼。functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般 built-app functionality lanes。`scripts/package-openclaw-for-docker.mjs` 是唯一的本機/CI package packer，並會在 Docker 消耗前驗證 tarball 與 `dist/postinstall-inventory.json`。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的 plan。`node scripts/test-docker-all.mjs --plan-json` 會輸出 scheduler 擁有的 CI plan，內容包含選定 lanes、image kinds、package/live-image 需求、狀態 scenarios 與 credential checks，而不建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制行程 slots，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，預設為 10。重型 lane caps 預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 與 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider caps 預設透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 與 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`，每個 provider 一個重型 lane。較大的 hosts 請使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果在低平行度 host 上某個 lane 超過有效 weight 或 resource cap，它仍然可以從空 pool 啟動，並會獨自執行直到釋放 capacity。lane 啟動預設錯開 2 秒，以避免本機 Docker daemon create 風暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。runner 預設會 preflight Docker、清理陳舊的 OpenClaw E2E containers、每 30 秒輸出 active-lane status、在相容 lanes 之間共享 provider CLI tool caches、預設重試一次暫時性 live-provider failures（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將 lane timings 儲存在 `.artifacts/docker-tests/lane-timings.json`，以便後續執行使用 longest-first 排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印 lane manifest 而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整狀態輸出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用 timing reuse。只要 deterministic/local lanes，請使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`；只要 live-provider lanes，請使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`；package aliases 為 `pnpm test:docker:local:all` 與 `pnpm test:docker:live:all`。Live-only 模式會把 main 與 tail live lanes 合併到一個 longest-first pool，讓 provider buckets 可以一起打包 Claude、Codex 與 Gemini 工作。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否則 runner 會在第一次失敗後停止排程新的 pooled lanes，而且每個 lane 都有 120 分鐘的 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail lanes 使用更嚴格的 per-lane caps。CLI backend Docker setup commands 有自己的 timeout，透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 設定（預設 180）。每個 lane 的日誌、`summary.json`、`failures.json` 與 phase timings 會寫在 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 檢查慢速 lanes，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印便宜的 targeted rerun commands。
- `pnpm test:docker:browser-cdp-snapshot`：建置 Chromium-backed source E2E container，啟動 raw CDP 與隔離的 Gateway，執行 `browser doctor --deep`，並驗證 CDP role snapshots 包含 link URLs、cursor-promoted clickables、iframe refs 與 frame metadata。
- CLI backend live Docker probes 可以作為 focused lanes 執行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 與 Gemini 有對應的 `:resume` 與 `:mcp` aliases。
- `pnpm test:docker:openwebui`：啟動 Dockerized OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，接著透過 `/api/chat/completions` 執行真實的 proxied chat。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI），會拉取外部 Open WebUI image，且不預期像一般 unit/e2e suites 一樣具備 CI 穩定性。
- `pnpm test:docker:mcp-channels`：啟動 seeded Gateway container，以及會生成 `openclaw mcp serve` 的第二個 client container，接著透過真實 stdio bridge 驗證 routed conversation discovery、transcript reads、attachment metadata、live event queue behavior、outbound send routing，以及 Claude-style channel + permission notifications。Claude notification assertion 會直接讀取 raw stdio MCP frames，因此 smoke 能反映 bridge 實際發出的內容。

## 本機 PR 關卡

對於本機 PR 合併/閘道檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上偶發失敗，先重新執行一次，再將其視為回歸；接著用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

腳本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可選環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示詞：「回覆單一單字：ok。不要標點符號或額外文字。」

上次執行（2025-12-31，20 次執行）：

- minimax 中位數 1279ms（最小值 1114，最大值 2431）
- opus 中位數 2454ms（最小值 1224，最大值 3170）

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

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小/最大值、結束碼/訊號分布，以及最大 RSS 摘要。可選的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 設定檔，讓計時與設定檔擷取使用同一套測試工具。

儲存輸出慣例：

- `pnpm test:startup:bench:smoke` 會將目標煙霧測試產物寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 與 `warmup=1` 將完整套件產物寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 與 `warmup=1` 重新整理已納入版本控制的基準 fixture，位置為 `test/fixtures/cli-startup-bench.json`

已納入版本控制的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## Onboarding E2E（Docker）

Docker 是可選項目；只有容器化 onboarding 煙霧測試才需要。

在乾淨的 Linux 容器中執行完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

此腳本會透過 pseudo-tty 驅動互動式精靈，驗證設定/工作區/session 檔案，然後啟動 Gateway 並執行 `openclaw health`。

## QR 匯入煙霧測試（Docker）

確保維護中的 QR runtime 輔助工具可在支援的 Docker Node runtime（預設 Node 24，相容 Node 22）下載入：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
