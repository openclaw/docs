---
read_when:
    - 執行或修正測試
summary: 如何在本機執行測試 (vitest)，以及何時使用強制/涵蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-06-27T20:01:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- 完整測試工具組（測試套件、即時、Docker）：[測試](/zh-TW/help/testing)
- 更新與外掛套件驗證：[測試更新與外掛](/zh-TW/help/testing-updates-plugins)

- 例行本機測試順序：
  1. `pnpm test:changed` 用於變更範圍的 Vitest 證明。
  2. `pnpm test <path-or-filter>` 用於單一檔案、目錄或明確目標。
  3. 只有在你刻意需要完整本機 Vitest 套件時，才使用 `pnpm test`。
- `pnpm test:force`：終止任何仍占用預設控制連接埠的殘留閘道程序，接著使用隔離的閘道連接執行完整 Vitest 套件，讓伺服器測試不會與執行中的實例衝突。先前的閘道執行導致連接埠 18789 被占用時使用此指令。
- `pnpm test:coverage`：使用 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是預設單元 lane 覆蓋率閘門，不是整個 repo 所有檔案的覆蓋率。門檻為 70% 行數/函式/陳述式，以及 55% 分支。因為 `coverage.all` 為 false，且預設 lane 將覆蓋率 include 範圍限定為具有同層來源檔的非 fast 單元測試，所以此閘門衡量的是此 lane 擁有的來源，而不是它碰巧載入的每個遞迴匯入。
- `pnpm test:coverage:changed`：只針對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：便宜的智慧變更測試執行。它會從直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖執行精準目標。廣泛/config/package 變更會被略過，除非它們對應到精準測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的廣泛變更測試執行。當測試 harness/config/package 編輯應回退到 Vitest 較廣泛的變更測試行為時使用。
- `pnpm changed:lanes`：顯示與 `origin/main` 的差異所觸發的架構 lane。
- `pnpm check:changed`：在 CI 外預設委派給 Crabbox/Testbox，接著在遠端子程序內針對與 `origin/main` 的差異執行智慧變更檢查閘門。它會針對受影響的架構 lane 執行 typecheck、lint 和 guard 指令，但不會執行 Vitest 測試。測試證明請使用 `pnpm test:changed` 或明確的 `pnpm test <target>`。
- Codex worktree 和 linked/sparse checkout：除非你已確認 pnpm 不會調和相依性，否則避免直接在本機執行 `pnpm test*`、`pnpm check*` 和 `pnpm crabbox:run`。針對很小的明確檔案證明，使用 `node scripts/run-vitest.mjs <path-or-filter>`；針對變更閘門或廣泛證明，使用 `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`，讓 pnpm 在 Testbox 內執行。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：針對 `pnpm check:changed` 和目標式 `pnpm test ...` 等指令，將 heavy-check 序列化保留在目前 worktree 內，而不是 Git common dir。只有在高容量本機主機上，且你刻意跨 linked worktree 執行獨立檢查時才使用。
- `pnpm test`：透過範圍化 Vitest lane 路由明確的檔案/目錄目標。未指定目標的執行是完整套件證明：它們使用固定 shard 群組、展開到 leaf config 以便本機平行執行，並在開始前列印預期的本機 shard fanout。extension 群組一律展開為個別 extension shard config，而不是單一巨大的 root-project 程序。
- 測試 wrapper 執行結束時會有簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的 duration 行仍是每個 shard 的細節。
- 共用 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir 或 auth-profile store 時，從 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- `pnpm test:env-mutations:report`：非阻斷式報告，列出直接修改 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` 或相關 OpenClaw env key 的測試與 harness。用它尋找可遷移到共用 test-state helper 的候選項目。
- Control UI mocked E2E：使用 `pnpm test:ui:e2e` 執行 Vitest + Playwright lane，該 lane 會啟動 Vite Control UI，並以真實 Chromium 頁面連到模擬的閘道 WebSocket。測試位於 `ui/src/**/*.e2e.test.ts`；共用 mock 和控制位於 `ui/src/test-helpers/control-ui-e2e.ts`。`pnpm test:e2e` 包含此 lane。在 Codex worktree 中，相依性安裝後，針對很小的目標式證明偏好使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`，或使用 Testbox/Crabbox 取得更廣泛的 GUI 證明。
- 程序 E2E helper：當 Vitest 程序層級 E2E 測試需要在一處取得執行中的閘道、命令列介面 env、log capture 和 cleanup 時，使用 `test/helpers/openclaw-test-instance.ts`。
- 終端介面 PTY 測試：快速 fake-backend PTY lane 使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts`。較慢的 `tui --local` smoke 使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 或 `pnpm tui:pty:test:watch --mode local`，它只 mock 外部模型端點。斷言穩定的可見文字或 fixture 呼叫，而不是原始 ANSI snapshot。
- Docker/Bash E2E helper：source `scripts/lib/docker-e2e-image.sh` 的 lane 可以將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並以 `scripts/lib/openclaw-e2e-instance.sh` 解碼；multi-home script 可以傳入 `docker_e2e_test_state_function_b64`，並在每個 flow 中呼叫 `openclaw_test_state_create <label> <scenario>`。較低層級的呼叫端可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 取得容器內 shell snippet，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 取得可 source 的主機 env 檔案。`create` 前的 `--` 會避免較新的節點執行階段將 `--env-file` 視為節點 flag。啟動閘道的 Docker/Bash lane 可以在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，以進行 entrypoint resolution、mock OpenAI startup、閘道前景/背景啟動、readiness probe、state env export、log dump 和程序 cleanup。
- 完整、extension 和 include-pattern shard 執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機 timing 資料；後續 whole-config 執行會使用這些 timing 平衡慢速與快速 shard。Include-pattern CI shard 會將 shard 名稱附加到 timing key，這會讓已篩選 shard timing 保持可見，而不會取代 whole-config timing 資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機 timing artifact。
- 選定的 `plugin-sdk` 和 `commands` 測試檔案現在會透過專用 light lane 路由，這些 lane 只保留 `test/setup.ts`，並讓 runtime-heavy case 留在既有 lane 上。
- 具有同層測試的來源檔會先對應到該同層測試，再回退到較廣泛的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 編輯會使用本機匯入圖執行匯入它們的測試，而不是在相依路徑精準時廣泛執行每個 shard。
- `auto-reply` 現在也拆成三個專用 config（`core`、`top-level`、`reply`），因此 reply harness 不會主導較輕量的 top-level status/token/helper 測試。
- 基礎 Vitest config 現在預設為 `pool: "threads"` 和 `isolate: false`，並在整個 repo config 中啟用共用的 non-isolated runner。
- `pnpm test:channels` 會執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 會執行所有 extension/外掛 shard。heavy channel 外掛、browser 外掛和 OpenAI 會作為專用 shard 執行；其他外掛群組維持批次執行。單一 bundled 外掛 lane 使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：啟用 Vitest 匯入 duration + import-breakdown 報告，同時仍針對明確的檔案/目錄目標使用範圍化 lane 路由。
- `pnpm test:perf:imports:changed`：相同的匯入 profiling，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對同一個已提交 git diff，對比 routed changed-mode path 與 native root-project 執行的 benchmark。
- `pnpm test:perf:changed:bench -- --worktree` 會在不先提交的情況下，benchmark 目前 worktree 變更集。
- `pnpm test:perf:profile:main`：為 Vitest main thread 寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為 unit runner 寫入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：序列執行每個 full-suite Vitest leaf config，並寫入分組 duration 資料，以及每個 config 的 JSON/log artifact。Test Performance Agent 會在嘗試修復慢速測試前，將此作為 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在以效能為重點的變更後，比較分組報告。
- `pnpm test:docker:timings <summary.json>` 會在 Docker all run 後檢查慢速 Docker lane；使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>`，從相同 artifact 列印便宜的目標式 rerun 指令。
- 閘道 integration：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` opt-in。
- `pnpm test:e2e`：執行 repo E2E aggregate：閘道端到端 smoke 測試，加上 Control UI mocked browser E2E lane。
- `pnpm test:e2e:gateway`：執行閘道端到端 smoke 測試（multi-instance WS/HTTP/node pairing）。預設在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 搭配 adaptive workers；使用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得 verbose log。
- `pnpm test:live`：執行 provider live 測試（minimax/zai）。需要 API key 和 `LIVE=1`（或 provider-specific `*_LIVE_TEST=1`）才會取消 skip。
- `pnpm test:docker:all`：建置共用的即時測試映像檔，將 OpenClaw 一次封裝為 npm tarball，建置/重用一個裸 Node/Git 執行器映像檔，以及一個將該 tarball 安裝到 `/app` 的功能映像檔，然後透過加權排程器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker 煙霧測試路徑。裸映像檔（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於安裝器/更新/外掛依賴路徑；這些路徑會掛載預先建置的 tarball，而不是使用複製的 repo 來源。功能映像檔（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般已建置應用程式功能路徑。`scripts/package-openclaw-for-docker.mjs` 是唯一的本機/CI 套件封裝器，並會在 Docker 使用之前驗證 tarball 與 `dist/postinstall-inventory.json`。Docker 路徑定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的計畫。`node scripts/test-docker-all.mjs --plan-json` 會輸出由排程器擁有的 CI 計畫，涵蓋選取的路徑、映像檔種類、套件/即時映像檔需求、狀態情境與憑證檢查，而不會建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制程序槽位，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制供應商敏感的尾端池，預設為 10。重量級路徑上限預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；供應商上限預設為每個供應商一個重量級路徑，透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 設定。較大的主機可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某個路徑在低並行主機上超過有效權重或資源上限，它仍可從空池啟動，並會獨自執行直到釋放容量。路徑啟動預設會錯開 2 秒，以避免本機 Docker daemon 建立風暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。執行器預設會預檢 Docker、清理過期的 OpenClaw E2E 容器、每 30 秒輸出作用中路徑狀態、在相容路徑之間共用供應商命令列介面工具快取、預設重試一次暫時性的即時供應商失敗（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將路徑耗時儲存在 `.artifacts/docker-tests/lane-timings.json`，供後續執行以最長優先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印路徑清單而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整狀態輸出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用耗時重用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 僅執行確定性/本機路徑，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 僅執行即時供應商路徑；套件別名為 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。僅即時模式會將主要與尾端即時路徑合併為一個最長優先池，讓供應商桶可一起打包 Claude、Codex 和 Gemini 工作。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否則執行器會在第一次失敗後停止排程新的池化路徑；每個路徑都有 120 分鐘的備援逾時，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選取的即時/尾端路徑會使用更嚴格的逐路徑上限。命令列介面後端 Docker 設定命令有自己的逾時，透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 設定（預設 180）。逐路徑記錄、`summary.json`、`failures.json` 與階段耗時會寫入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 檢查緩慢路徑，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印便宜且精準的重新執行命令。
- `pnpm test:docker:browser-cdp-snapshot`：建置以 Chromium 為後端的來源 E2E 容器，啟動原始 CDP 加上隔離的閘道，執行 `browser doctor --deep`，並驗證 CDP 角色快照包含連結 URL、游標提升的可點擊項目、iframe 參照與 frame 中繼資料。
- `pnpm test:docker:skill-install`：在裸 Docker 執行器中安裝封裝後的 OpenClaw tarball，停用 `skills.install.allowUploadedArchives`，從即時 ClawHub 搜尋解析目前的 skill slug，透過 `openclaw skills install` 安裝它，並驗證 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 和 `skills info --json`。
- 命令列介面後端即時 Docker 探測可以作為聚焦路徑執行，例如 `pnpm test:docker:live-cli-backend:claude`、`pnpm test:docker:live-cli-backend:claude:resume` 或 `pnpm test:docker:live-cli-backend:claude:mcp`。Gemini 也有對應的 `:resume` 與 `:mcp` 別名。
- `pnpm test:docker:openwebui`：啟動 Docker 化的 OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，然後透過 `/api/chat/completions` 執行真實的代理聊天。需要可用的即時模型金鑰，會拉取外部 Open WebUI 映像檔，且不預期像一般單元/E2E 套件一樣具備 CI 穩定性。
- `pnpm test:docker:mcp-channels`：啟動已植入資料的閘道容器，以及第二個會產生 `openclaw mcp serve` 的用戶端容器，然後驗證路由對話探索、轉錄讀取、附件中繼資料、即時事件佇列行為、對外傳送路由，以及透過真實 stdio bridge 傳遞的 Claude 風格頻道 + 權限通知。Claude 通知斷言會直接讀取原始 stdio MCP frame，因此煙霧測試會反映 bridge 實際發出的內容。
- `pnpm test:docker:upgrade-survivor`：在髒的舊使用者 fixture 上安裝封裝後的 OpenClaw tarball，執行套件更新加上非互動式 doctor，且不使用即時供應商或頻道金鑰，然後啟動 loopback 閘道，並檢查 agent、頻道設定、外掛 allowlist、工作區/工作階段檔案、過期的舊版外掛依賴狀態、啟動與 RPC 狀態是否存續。
- `pnpm test:docker:published-upgrade-survivor`：預設安裝 `openclaw@latest`，植入沒有即時供應商或頻道金鑰的真實既有使用者檔案，使用內建的 `openclaw config set` 命令配方設定該基準，將該已發布安裝更新為封裝後的 OpenClaw tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 loopback 閘道，並檢查已設定的意圖、工作區/工作階段檔案、過期的外掛設定與舊版依賴狀態、啟動、`/healthz`、`/readyz` 和 RPC 狀態是否存續或乾淨修復。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確的本機矩陣，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 加入情境 fixture；reported-issues 集合包含 `configured-plugin-installs`，用來驗證已設定的外部 OpenClaw 外掛會在升級期間自動安裝，以及 `stale-source-plugin-shadow`，用來避免僅來源的外掛陰影破壞啟動。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，並在將精確套件規格交給 Docker 路徑之前解析中繼基準 token，例如 `last-stable-4` 或 `all-since-2026.4.23`。
- `pnpm test:docker:update-migration`：在大量清理的 `plugin-deps-cleanup` 情境中執行 published-upgrade survivor harness，預設從 `openclaw@2026.4.23` 開始。獨立的 `Update Migration` 工作流程會以 `baselines=all-since-2026.4.23` 展開此路徑，讓 `.23` 之後的每個穩定已發布套件都更新至候選版本，並在 Full Release CI 外證明已設定外掛的依賴清理。
- `pnpm test:docker:plugins`：對本機路徑、`file:`、含 hoisted dependencies 的 npm registry 套件、git moving refs、ClawHub fixture、marketplace 更新，以及 Claude-bundle 啟用/檢查執行安裝/更新煙霧測試。

## 本機 PR 閘門

若要執行本機 PR 合併/閘門檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上偶發失敗，請先重新執行一次，再將其視為迴歸，然後用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

指令碼：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `pnpm tsx scripts/bench-model.ts --runs 10`
- 選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示：「Reply with a single word: ok. No punctuation or extra text.」

上次執行（2025-12-31，20 次執行）：

- minimax 中位數 1279ms（最小 1114，最大 2431）
- opus 中位數 2454ms（最小 1224，最大 3170）

## 命令列介面啟動基準測試

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

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小/最大值、結束碼/訊號分布，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 profile，因此計時與 profile 擷取會使用同一個測試框架。

已儲存輸出慣例：

- `pnpm test:startup:bench:smoke` 會將目標煙霧測試成品寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 和 `warmup=1`，將完整套件成品寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 和 `warmup=1`，重新整理簽入的基準 fixture，位置為 `test/fixtures/cli-startup-bench.json`

簽入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## 閘道啟動基準測試

指令碼：[`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

此基準測試預設使用建置後的命令列介面入口 `dist/entry.js`；使用套件指令命令前請先執行
`pnpm build`。若要改為測量原始碼
runner，請傳入 `--entry scripts/run-node.mjs`，並將這些結果
與建置入口基準分開保存。

用法：

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

案例 id：

- `default`：一般閘道啟動。
- `skipChannels`：略過頻道啟動的閘道啟動。
- `oneInternalHook`：一個已設定的內部 hook。
- `allInternalHooks`：所有內部 hook。
- `fiftyPlugins`：50 個 manifest 外掛。
- `fiftyStartupLazyPlugins`：50 個啟動延遲載入的 manifest 外掛。

輸出包含第一個程序輸出、`/healthz`、`/readyz`、HTTP 監聽記錄時間、
閘道就緒記錄時間、CPU 時間、CPU 核心比率、最大 RSS、heap、啟動追蹤
指標、事件迴圈延遲，以及外掛查詢表詳細指標。此指令碼
會在子閘道環境中啟用 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`。

將 `/healthz` 視為存活狀態：HTTP 伺服器可以回應。將 `/readyz` 視為
可用就緒狀態：啟動外掛 sidecar、頻道，以及就緒關鍵的
post-attach 工作都已穩定。閘道啟動 hook 會以非同步方式分派，
不屬於就緒保證的一部分。就緒記錄時間是
閘道內部就緒記錄時間戳；它有助於程序端
歸因，但不能取代外部 `/readyz` 探測。

比較變更時請使用 JSON 輸出或 `--output`。只有在追蹤輸出指向匯入、編譯或 CPU 密集工作，且無法僅從階段計時解釋時，才使用 `--cpu-prof-dir`。不要將原始碼 runner 結果與建置後的 `dist/entry.js` 結果作為同一個基準來比較。

## 閘道重新啟動基準測試

指令碼：[`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

重新啟動基準測試僅支援 macOS 和 Linux。它使用 SIGUSR1 進行
程序內重新啟動，並會在 Windows 上立即失敗。

此基準測試預設使用建置後的命令列介面入口 `dist/entry.js`；使用套件指令命令前請先執行
`pnpm build`。若要改為測量原始碼
runner，請傳入 `--entry scripts/run-node.mjs`，並將這些結果
與建置入口基準分開保存。

用法：

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

案例 id：

- `skipChannels`：略過頻道的重新啟動。
- `skipChannelsAcpxProbe`：略過頻道且開啟 ACPX 啟動探測的重新啟動。
- `skipChannelsNoAcpxProbe`：略過頻道且關閉 ACPX 啟動探測的重新啟動。
- `default`：一般重新啟動。
- `fiftyPlugins`：含 50 個 manifest 外掛的重新啟動。

輸出包含下一個 `/healthz`、下一個 `/readyz`、停機時間、重新啟動就緒計時、
CPU、RSS、替換程序的啟動追蹤指標，以及重新啟動追蹤
指標，涵蓋訊號處理、active-work drain、關閉階段、下一次啟動、就緒
計時和記憶體快照。此指令碼會在
子閘道環境中啟用 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 和 `OPENCLAW_GATEWAY_RESTART_TRACE=1`。

當變更觸及重新啟動訊號、關閉處理常式、
重新啟動後啟動、sidecar 關閉、服務交接，或重新啟動後就緒狀態時，請使用此基準測試。從 `skipChannels` 開始，將閘道機制與頻道
啟動隔離。只有在窄範圍案例已說明
重新啟動路徑後，才使用 `default` 或外掛較多的案例。

追蹤指標是歸因提示，不是結論。重新啟動變更應根據
多個樣本、相符的 owner span、`/healthz` 和 `/readyz`
行為，以及使用者可見的重新啟動合約來判斷。

## Onboarding E2E（Docker）

Docker 是選用的；只有容器化 onboarding 煙霧測試才需要。

在乾淨 Linux 容器中的完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

此指令碼會透過 pseudo-tty 驅動互動式精靈，驗證 config/workspace/session 檔案，然後啟動閘道並執行 `openclaw health`。

## QR 匯入煙霧測試（Docker）

確保維護中的 QR runtime helper 可在支援的 Docker 節點 runtime（節點 24 預設，節點 22 相容）下載入：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與外掛](/zh-TW/help/testing-updates-plugins)
