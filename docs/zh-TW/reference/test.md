---
read_when:
    - 執行或修正測試
summary: 如何在本機執行測試 (vitest)，以及何時使用強制/覆蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-06-28T00:13:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- 全套測試工具組（套件、即時、Docker）：[測試](/zh-TW/help/testing)
- 更新與外掛套件驗證：[測試更新與外掛](/zh-TW/help/testing-updates-plugins)

- 例行本機測試順序：
  1. `pnpm test:changed` 用於變更範圍的 Vitest 證明。
  2. `pnpm test <path-or-filter>` 用於單一檔案、目錄或明確目標。
  3. 只有在你刻意需要完整本機 Vitest 套件時才使用 `pnpm test`。
- `pnpm test:force`：終止任何占用預設控制連接埠的殘留閘道程序，然後使用隔離的閘道連接埠執行完整 Vitest 套件，避免伺服器測試與執行中的執行個體衝突。當先前的閘道執行留下連接埠 18789 被占用時使用。
- `pnpm test:coverage`：以 V8 覆蓋率執行單元套件（透過 `vitest.unit.config.ts`）。這是預設單元通道的覆蓋率閘門，不是整個儲存庫所有檔案的覆蓋率。門檻為行數/函式/陳述式 70%，分支 55%。由於 `coverage.all` 為 false，且預設通道會將覆蓋率 include 範圍限制為具有相鄰來源檔的非快速單元測試，因此此閘門衡量的是此通道擁有的來源，而不是它碰巧載入的每個遞移匯入。
- `pnpm test:coverage:changed`：只對自 `origin/main` 以來變更的檔案執行單元覆蓋率。
- `pnpm test:changed`：便宜的智慧變更測試執行。它會從直接測試編輯、相鄰 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖執行精準目標。廣泛/設定/套件變更會被略過，除非它們對應到精準測試。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：明確的廣泛變更測試執行。當測試工具框架/設定/套件編輯應回退到 Vitest 較廣泛的變更測試行為時使用。
- `pnpm changed:lanes`：顯示相對於 `origin/main` 的差異所觸發的架構通道。
- `pnpm check:changed`：在 CI 之外預設委派給 Crabbox/Testbox，然後在遠端子程序內針對相對於 `origin/main` 的差異執行智慧變更檢查閘門。它會為受影響的架構通道執行型別檢查、lint 和防護命令，但不會執行 Vitest 測試。測試證明請使用 `pnpm test:changed` 或明確的 `pnpm test <target>`。
- Codex 工作樹與 linked/sparse 簽出：除非你已確認 pnpm 不會協調依賴，否則避免直接在本機執行 `pnpm test*`、`pnpm check*` 和 `pnpm crabbox:run`。對於極小的明確檔案證明，使用 `node scripts/run-vitest.mjs <path-or-filter>`；對於變更閘門或廣泛證明，使用 `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`，讓 pnpm 在 Testbox 內執行。
- 透過 Crabbox 的 Testbox 證明：使用 wrapper 最終的 `exitCode` 和計時 JSON 作為命令結果。委派的 Blacksmith GitHub Actions 執行可能會在成功的 SSH 命令後顯示 `cancelled`，因為 Testbox 是從 keepalive action 外部停止的；在將其視為測試失敗前，先驗證 wrapper 摘要與命令輸出。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：讓 `pnpm check:changed` 和目標式 `pnpm test ...` 等命令的重型檢查序列化限制在目前工作樹內，而不是 Git common dir。只有在高容量本機主機上刻意跨 linked 工作樹執行獨立檢查時才使用。
- `pnpm test`：透過具範圍的 Vitest 通道路由明確的檔案/目錄目標。未指定目標的執行是完整套件證明：它們使用固定分片群組、展開為 leaf configs 以進行本機平行執行，並在開始前列印預期的本機分片 fanout。擴充功能群組一律展開為每個擴充功能的分片設定，而不是一個巨大的根專案程序。
- 測試 wrapper 執行結尾會有簡短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的持續時間行仍保留為每個分片的細節。
- 共用 OpenClaw 測試狀態：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定 fixture、工作區、代理程式目錄或 auth-profile store 時，請從 Vitest 使用 `src/test-utils/openclaw-test-state.ts`。
- `pnpm test:env-mutations:report`：非阻塞報告，列出直接變更 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` 或相關 OpenClaw env keys 的測試與工具框架。用它尋找可遷移到共用 test-state helper 的候選項目。
- Control UI 模擬 E2E：使用 `pnpm test:ui:e2e` 執行 Vitest + Playwright 通道，該通道會啟動 Vite Control UI，並以真實 Chromium 頁面對模擬的閘道 WebSocket 進行操作。測試位於 `ui/src/**/*.e2e.test.ts`；共用 mock 與控制項位於 `ui/src/test-helpers/control-ui-e2e.ts`。`pnpm test:e2e` 包含此通道。在 Codex 工作樹中，安裝依賴後，對極小目標證明優先使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`，或使用 Testbox/Crabbox 進行更廣泛的 GUI 證明。
- 程序 E2E helper：當 Vitest 程序層級 E2E 測試需要在同一處處理執行中的閘道、命令列介面 env、日誌擷取與清理時，使用 `test/helpers/openclaw-test-instance.ts`。
- 終端介面 PTY 測試：使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` 執行快速假後端 PTY 通道。較慢的 `tui --local` smoke 請使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 或 `pnpm tui:pty:test:watch --mode local`，它只 mock 外部模型端點。斷言穩定的可見文字或 fixture 呼叫，而不是原始 ANSI 快照。
- Docker/Bash E2E helper：source `scripts/lib/docker-e2e-image.sh` 的通道可以將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並使用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；多 home 指令碼可以傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。較低層級的呼叫端可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 產生容器內 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 產生可 source 的主機 env 檔。`create` 前的 `--` 可避免較新的 Node 執行階段將 `--env-file` 視為 Node 旗標。會啟動閘道的 Docker/Bash 通道可以在容器內 source `scripts/lib/openclaw-e2e-instance.sh`，以處理進入點解析、mock OpenAI 啟動、閘道前景/背景啟動、就緒探針、狀態 env 匯出、日誌 dump，以及程序清理。
- 完整、擴充功能與 include-pattern 分片執行會更新 `.artifacts/vitest-shard-timings.json` 中的本機計時資料；後續整個設定的執行會使用這些計時來平衡慢速與快速分片。Include-pattern CI 分片會將分片名稱附加到計時 key，這會讓過濾後的分片計時保持可見，而不取代整個設定的計時資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機計時 artifact。
- 選定的 `plugin-sdk` 和 `commands` 測試檔案現在會經由專用輕量通道路由，該通道只保留 `test/setup.ts`，讓執行階段較重的案例留在既有通道上。
- 具有相鄰測試的來源檔會先對應到該相鄰測試，再回退到較廣的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 編輯會使用本機匯入圖來執行匯入它們的測試，而不是在依賴路徑精準時廣泛執行每個分片。
- `auto-reply` 現在也拆分為三個專用設定（`core`、`top-level`、`reply`），因此 reply 工具框架不會主導較輕量的 top-level 狀態/token/helper 測試。
- 基礎 Vitest 設定現在預設為 `pool: "threads"` 和 `isolate: false`，並在整個儲存庫設定中啟用共用非隔離 runner。
- `pnpm test:channels` 執行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 會執行所有擴充功能/外掛分片。重型通道外掛、瀏覽器外掛和 OpenAI 會作為專用分片執行；其他外掛群組維持批次處理。單一 bundled 外掛通道請使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：啟用 Vitest 匯入持續時間 + 匯入分解報告，同時仍對明確檔案/目錄目標使用具範圍的通道路由。
- `pnpm test:perf:imports:changed`：相同的匯入 profiling，但只針對自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對相同已提交的 git diff，將路由後的 changed-mode 路徑與原生 root-project 執行做基準比較。
- `pnpm test:perf:changed:bench -- --worktree` 會在不先提交的情況下，對目前工作樹變更集進行基準測試。
- `pnpm test:perf:profile:main`：為 Vitest 主執行緒寫入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：為單元 runner 寫入 CPU + heap profiles（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：以序列方式執行每個完整套件 Vitest leaf config，並寫入分組持續時間資料以及每個設定的 JSON/log artifacts。Test Performance Agent 會在嘗試修復慢速測試前，將此作為 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在效能導向變更後比較分組報告。
- `pnpm test:docker:timings <summary.json>` 會在 Docker all 執行後檢查慢速 Docker 通道；使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 從相同 artifacts 列印便宜的目標式重跑命令。
- 閘道整合：透過 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 選擇加入。
- `pnpm test:e2e`：執行儲存庫 E2E 聚合：閘道端對端 smoke tests，加上 Control UI 模擬瀏覽器 E2E 通道。
- `pnpm test:e2e:gateway`：執行閘道端對端 smoke tests（多執行個體 WS/HTTP/節點 配對）。預設為 `threads` + `isolate: false`，並在 `vitest.e2e.config.ts` 中使用自適應 workers；用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並設定 `OPENCLAW_E2E_VERBOSE=1` 取得詳細日誌。
- `pnpm test:live`：執行 provider live tests（minimax/zai）。需要 API keys 和 `LIVE=1`（或 provider-specific `*_LIVE_TEST=1`）才會取消略過。
- `pnpm test:docker:all`：建置共用的即時測試映像檔，將 OpenClaw 一次打包成 npm tarball，建置/重用裸節點/Git 執行器映像檔，以及會把該 tarball 安裝到 `/app` 的功能映像檔，然後透過加權排程器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 Docker 煙霧測試線。裸映像檔（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用於安裝器/更新/外掛相依性測試線；這些測試線會掛載預先建置的 tarball，而不是使用複製的 repo 原始碼。功能映像檔（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用於一般已建置應用程式功能測試線。`scripts/package-openclaw-for-docker.mjs` 是單一的本機/CI 套件打包器，並會在 Docker 使用前驗證 tarball 與 `dist/postinstall-inventory.json`。Docker 測試線定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的計畫。`node scripts/test-docker-all.mjs --plan-json` 會輸出由排程器擁有的 CI 計畫，內容包含所選測試線、映像檔種類、套件/即時映像檔需求、狀態情境與憑證檢查，而不會建置或執行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制程序槽位，預設為 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制對提供者敏感的尾端集區，預設為 10。重型測試線上限預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` 與 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供者上限預設為每個提供者一條重型測試線，透過 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 與 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 設定。較大型主機可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某條測試線在低平行度主機上超過有效權重或資源上限，它仍可從空集區開始，並會獨自執行直到釋放容量。測試線啟動預設錯開 2 秒，以避免本機 Docker daemon 建立風暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆寫。執行器預設會預檢 Docker、清除過期的 OpenClaw E2E 容器、每 30 秒輸出作用中測試線狀態、在相容測試線之間共用提供者命令列介面工具快取、預設重試一次暫時性即時提供者失敗（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），並將測試線計時儲存在 `.artifacts/docker-tests/lane-timings.json`，供後續執行依最久優先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印測試線資訊清單而不執行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可調整狀態輸出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 停用計時重用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 只執行確定性/本機測試線，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 只執行即時提供者測試線；套件別名為 `pnpm test:docker:local:all` 與 `pnpm test:docker:live:all`。僅即時模式會將主要與尾端即時測試線合併成一個最久優先集區，讓提供者桶可以一起裝入 Claude、Codex 與 Gemini 工作。除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否則執行器會在第一次失敗後停止排程新的集區測試線，且每條測試線都有 120 分鐘的備援逾時，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選取的即時/尾端測試線會使用更嚴格的逐測試線上限。命令列介面後端 Docker 設定命令有自己的逾時，可透過 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 設定（預設 180）。逐測試線日誌、`summary.json`、`failures.json` 與階段計時會寫入 `.artifacts/docker-tests/<run-id>/` 底下；使用 `pnpm test:docker:timings <summary.json>` 檢查緩慢測試線，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印低成本的目標重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：建置以 Chromium 為後端的原始碼 E2E 容器，啟動原始 CDP 加上隔離的閘道，執行 `browser doctor --deep`，並驗證 CDP 角色快照包含連結 URL、游標提升的可點擊項目、iframe 參照與 frame metadata。
- `pnpm test:docker:skill-install`：在裸 Docker 執行器中安裝已打包的 OpenClaw tarball，停用 `skills.install.allowUploadedArchives`，從即時 ClawHub 搜尋解析目前的 Skills slug，透過 `openclaw skills install` 安裝，並驗證 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 與 `skills info --json`。
- 命令列介面後端即時 Docker 探測可以作為聚焦測試線執行，例如 `pnpm test:docker:live-cli-backend:claude`、`pnpm test:docker:live-cli-backend:claude:resume` 或 `pnpm test:docker:live-cli-backend:claude:mcp`。Gemini 有對應的 `:resume` 與 `:mcp` 別名。
- `pnpm test:docker:openwebui`：啟動 Docker 化的 OpenClaw + Open WebUI，透過 Open WebUI 登入，檢查 `/api/models`，然後透過 `/api/chat/completions` 執行真正的代理聊天。需要可用的即時模型金鑰，會拉取外部 Open WebUI 映像檔，且不預期像一般單元/E2E 套件一樣在 CI 中穩定。
- `pnpm test:docker:mcp-channels`：啟動已植入資料的閘道容器與第二個會產生 `openclaw mcp serve` 的用戶端容器，然後驗證路由對話探索、轉錄讀取、附件 metadata、即時事件佇列行為、外送路由，以及透過真實 stdio bridge 傳送的 Claude 風格頻道 + 權限通知。Claude 通知斷言會直接讀取原始 stdio MCP frame，因此煙霧測試反映 bridge 實際發出的內容。
- `pnpm test:docker:upgrade-survivor`：在髒的舊使用者 fixture 上安裝已打包的 OpenClaw tarball，執行套件更新與非互動式 doctor，不使用即時提供者或頻道金鑰，然後啟動 loopback 閘道，並檢查代理、頻道設定、外掛 allowlist、工作區/工作階段檔案、過期的舊版外掛相依性狀態、啟動與 RPC 狀態是否存活。
- `pnpm test:docker:published-upgrade-survivor`：預設安裝 `openclaw@latest`，在沒有即時提供者或頻道金鑰的情況下植入逼真的既有使用者檔案，用內建的 `openclaw config set` 命令配方設定該基準線，將該已發布安裝更新到已打包的 OpenClaw tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 loopback 閘道，並檢查已設定 intent、工作區/工作階段檔案、過期外掛設定與舊版相依性狀態、啟動、`/healthz`、`/readyz` 與 RPC 狀態是否存活或乾淨修復。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準線，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確本機矩陣，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 加入情境 fixture；reported-issues 集合包含 `configured-plugin-installs`，用於驗證已設定的外部 OpenClaw 外掛會在升級期間自動安裝，以及 `stale-source-plugin-shadow`，用於避免僅限原始碼的外掛影子破壞啟動。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 與 `published_upgrade_survivor_scenarios`，並在把精確套件規格交給 Docker 測試線之前，解析如 `last-stable-4` 或 `all-since-2026.4.23` 的 meta 基準線 token。
- `pnpm test:docker:update-migration`：在大量清理的 `plugin-deps-cleanup` 情境中執行已發布升級 survivor harness，預設從 `openclaw@2026.4.23` 開始。獨立的 `Update Migration` workflow 會用 `baselines=all-since-2026.4.23` 展開此測試線，讓 `.23` 之後的每個穩定已發布套件都更新到候選版本，並在 Full Release CI 之外證明已設定外掛相依性的清理。
- `pnpm test:docker:plugins`：針對本機路徑、`file:`、具有 hoisted 相依性的 npm registry 套件、git moving refs、ClawHub fixture、marketplace 更新，以及 Claude bundle 啟用/檢查，執行安裝/更新煙霧測試。

## 本機 PR 關卡

若要執行本機 PR 合併／關卡檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上出現偶發失敗，請先重新執行一次，再將其視為回歸，接著用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機，請使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延遲基準測試（本機金鑰）

指令碼：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `pnpm tsx scripts/bench-model.ts --runs 10`
- 選用環境變數：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 預設提示："Reply with a single word: ok. No punctuation or extra text."

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

預設組：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：兩個預設組

輸出包含每個命令的 `sampleCount`、平均值、p50、p95、最小／最大值、退出碼／訊號分布，以及最大 RSS 摘要。選用的 `--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 profile，讓計時與 profile 擷取使用同一個 harness。

已儲存輸出慣例：

- `pnpm test:startup:bench:smoke` 會將目標 smoke artifact 寫入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 會使用 `runs=5` 和 `warmup=1` 將完整套件 artifact 寫入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 會使用 `runs=5` 和 `warmup=1` 重新整理已簽入的基準 fixture：`test/fixtures/cli-startup-bench.json`

已簽入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 重新整理
- 使用 `pnpm test:startup:bench:check` 將目前結果與 fixture 比較

## 閘道啟動基準測試

指令碼：[`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

此基準測試預設使用位於 `dist/entry.js` 的已建置命令列介面入口；在使用 package-script 命令前，請先執行
`pnpm build`。若要改為測量原始碼
runner，請傳入 `--entry scripts/run-node.mjs`，並將這些結果
與已建置入口基準分開保存。

用法：

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

案例 ID：

- `default`：正常的閘道啟動。
- `skipChannels`：略過通道啟動的閘道啟動。
- `oneInternalHook`：一個已設定的內部 hook。
- `allInternalHooks`：所有內部 hook。
- `fiftyPlugins`：50 個 manifest 外掛。
- `fiftyStartupLazyPlugins`：50 個啟動延遲載入的 manifest 外掛。

輸出包含第一個程序輸出、`/healthz`、`/readyz`、HTTP listen log 時間、
閘道 ready log 時間、CPU 時間、CPU core 比率、最大 RSS、heap、startup trace
指標、事件迴圈延遲，以及外掛 lookup-table 詳細指標。此指令碼
會在子閘道環境中啟用 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`。

將 `/healthz` 解讀為存活狀態：HTTP 伺服器可以回應。將 `/readyz` 解讀為
可用就緒狀態：啟動外掛 sidecar、通道，以及對就緒狀態至關重要的
post-attach 工作已穩定。閘道啟動 hook 會以非同步方式派發，
不屬於就緒保證的一部分。Ready log 時間是
閘道的內部 ready log timestamp；它對程序端
歸因很有用，但不能取代外部 `/readyz` 探針。

比較變更時，請使用 JSON 輸出或 `--output`。只有在 trace 輸出指向匯入、編譯或 CPU-bound 工作，
且無法只透過階段計時解釋時，才使用 `--cpu-prof-dir`。不要將 source-runner 結果與
已建置的 `dist/entry.js` 結果視為同一個基準來比較。

## 閘道重新啟動基準測試

指令碼：[`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

重新啟動基準測試僅支援 macOS 和 Linux。它使用 SIGUSR1 進行
程序內重新啟動，並會在 Windows 上立即失敗。

此基準測試預設使用位於 `dist/entry.js` 的已建置命令列介面入口；在使用 package-script 命令前，請先執行
`pnpm build`。若要改為測量原始碼
runner，請傳入 `--entry scripts/run-node.mjs`，並將這些結果
與已建置入口基準分開保存。

用法：

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

案例 ID：

- `skipChannels`：略過通道的重新啟動。
- `skipChannelsAcpxProbe`：略過通道且 ACPX 啟動探針開啟的重新啟動。
- `skipChannelsNoAcpxProbe`：略過通道且 ACPX 啟動探針關閉的重新啟動。
- `default`：正常重新啟動。
- `fiftyPlugins`：搭配 50 個 manifest 外掛的重新啟動。

輸出包含下一個 `/healthz`、下一個 `/readyz`、停機時間、重新啟動就緒計時、
CPU、RSS、替換程序的 startup trace 指標，以及 signal handling、active-work drain、close phases、next start、ready
timing 和 memory snapshots 的 restart trace
指標。此指令碼會在
子閘道環境中啟用 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 和 `OPENCLAW_GATEWAY_RESTART_TRACE=1`。

當變更觸及重新啟動訊號、close handlers、
startup-after-restart、sidecar shutdown、service handoff，或重新啟動後的 readiness 時，請使用此基準測試。
隔離閘道機制與通道
啟動時，請從 `skipChannels` 開始。只有在窄案例能解釋
重新啟動路徑後，才使用 `default` 或外掛較多的案例。

Trace 指標是歸因提示，不是判定。重新啟動變更應根據
多個樣本、相符的 owner span、`/healthz` 和 `/readyz`
行為，以及使用者可見的重新啟動合約來判斷。

## Onboarding E2E (Docker)

Docker 是選用項；只有容器化 onboarding smoke tests 需要它。

在乾淨 Linux 容器中的完整 cold-start 流程：

```bash
scripts/e2e/onboard-docker.sh
```

此指令碼會透過 pseudo-tty 驅動互動式精靈、驗證 config/workspace/session 檔案，接著啟動閘道並執行 `openclaw health`。

## QR 匯入 smoke (Docker)

確保受維護的 QR runtime helper 可在支援的 Docker 節點 runtime 下載入（預設節點 24，相容節點 22）：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與外掛](/zh-TW/help/testing-updates-plugins)
