---
read_when:
    - 執行或修正測試
summary: 如何在本機執行測試（vitest）以及何時使用強制/覆蓋率模式
title: 測試
x-i18n:
    generated_at: "2026-07-05T17:40:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17e8128198bea80e83a74cfbeb0a63056e7913ce4c7b6f976b4ec929fcfe493d
    source_path: reference/test.md
    workflow: 16
---

- 完整測試套件（套件、即時、Docker）：[測試](/zh-TW/help/testing)
- 更新與外掛套件驗證：[測試更新與外掛](/zh-TW/help/testing-updates-plugins)

## 代理預設值

代理工作階段會透過 Crabbox 遠端執行測試和計算密集型驗證。受信任的維護者程式碼預設使用 Blacksmith Testbox。設定好的 Testbox 工作流程會注入憑證，因此不受信任的貢獻者或 fork 程式碼必須改用無密鑰的 fork CI 或經過清理的直接 AWS Crabbox。

當受信任的程式碼任務可能需要測試或繁重證明時，請立即在背景命令工作階段中預熱，在注入期間持續工作，重用傳回的 `tbx_...` ID，在每次執行時同步目前 checkout，並在交接前停止它：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

以下本機測試命令適用於人工工作流程，或使用者明確要求的代理備援。必須回報遠端提供者無法使用；這不代表可以靜默執行廣泛的本機閘門。

對於不受信任的程式碼，請使用 `--provider aws` 預熱。每次執行都必須設定 `CRABBOX_ENV_ALLOW=CI`，傳入 `--provider aws --no-hydrate`，並在安裝相依套件或執行測試前使用新的暫時遠端 `HOME`。使用專門給該不受信任來源的新預熱租約；絕不要重用受信任或先前已注入憑證的租約。從乾淨且受信任的 `main` checkout 啟動已安裝的受信任 Crabbox 二進位檔，並只用 `--fresh-pr` 擷取遠端 PR；絕不要在本機執行不受信任 checkout 的 wrapper 或設定。取消設定 `CRABBOX_AWS_INSTANCE_PROFILE`，除非解析出的 `aws.instanceProfile` 為空，否則以關閉狀態失敗。在任何安裝/測試前，使用受信任的絕對路徑工具要求 IMDSv2 權杖、證明 IAM 憑證端點傳回 404，並驗證遠端 `git rev-parse HEAD` 等於完整已審查的 PR head SHA。將租約綁定到該 SHA，並在 head 變更時停止/重新預熱。從乾淨的 `main` 上傳受信任的 `scripts/crabbox-untrusted-bootstrap.sh`，並搭配 `--fresh-pr`；它會安裝釘選的 Node/pnpm、驗證 SHA 和套件管理器釘選、隔離 `HOME`、安裝相依套件，然後執行要求的測試。如果 broker 無法證明沒有角色或沒有遠端 PR 存在，請使用無密鑰的 fork CI。不要使用 `hydrate-github`、`--no-sync` 或已注入憑證的 Testbox 工作流程。
取消設定所有 `CRABBOX_TAILSCALE*` 覆寫，強制 `--network public
--tailscale=false`，清除 exit-node/LAN 旗標，並要求 `crabbox inspect` 在上傳任何指令碼前回報公開網路且沒有 Tailscale 狀態。

## 例行本機順序

1. `pnpm test:changed` 用於變更範圍的 Vitest 證明。
2. `pnpm test <path-or-filter>` 用於單一檔案、目錄或明確目標。
3. 只有在你刻意需要完整本機 Vitest 套件時，才使用 `pnpm test`。

在 Codex worktree 或 linked/sparse checkout 中，代理會避免直接本機執行 `pnpm test*` / `pnpm check*` / `pnpm crabbox:run`：

- 使用者明確要求的微小檔案本機備援：
  `node scripts/run-vitest.mjs <path-or-filter>`。
- 變更閘門或廣泛證明：`node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`，讓 pnpm 在 Testbox 內執行。
- wrapper 最終的 `exitCode` 和 timing JSON 就是命令結果。委派的 Blacksmith GitHub Actions 執行可能會在成功的 SSH 命令後顯示 `cancelled`，因為 Testbox 是從 keepalive action 外部停止；在把它視為失敗前，請檢查 wrapper 摘要和命令輸出。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：對 `pnpm check:changed` 和目標式 `pnpm test ...` 等命令，將 heavy-check 序列化限制在目前 worktree 內，而不是 Git common dir。只有在高容量本機主機上，且你刻意跨 linked worktree 執行獨立檢查時才使用。

## 核心命令

測試 wrapper 執行結尾會有簡短的 `[test] passed|failed|skipped ... in ...` 摘要；Vitest 自己的 duration 行保留為每個 shard 的細節。

| 命令                                           | 作用                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 明確的檔案/目錄目標會透過 scoped Vitest lane 路由。未指定目標的執行是完整套件證明：固定 shard 群組會展開成 leaf config 以供本機平行執行，並在開始前印出預期的 shard fanout。extension 群組一律展開成每個 extension 的 shard config，而不是一個巨大的 root-project process。 |
| `pnpm test:changed`                               | 低成本智慧變更測試執行：從直接測試編輯、同層 `*.test.ts` 檔案、明確來源映射和本機 import graph 取得精準目標。廣泛/config/package 變更會略過，除非它們映射到精準測試。                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 明確的廣泛變更測試執行；當測試 harness/config/package 編輯應回退到 Vitest 較廣泛的變更測試行為時使用。                                                                                                                                                                                                              |
| `pnpm test:force`                                 | 釋放設定的 OpenClaw 閘道連接埠（預設 `18789`），然後以隔離的閘道連接埠執行完整套件，讓伺服器測試不會與正在執行的執行個體衝突。                                                                                                                                                                          |
| `pnpm test:coverage`                              | 使用 V8 coverage 的單元套件（`vitest.unit.config.ts`）。這是 default-unit-lane gate，不是整個 repo coverage：`coverage.all` 為 `false`，門檻為 lines/functions/statements 70%、branches 55%，範圍限於具有同層來源檔案的非快速單元測試。                                                                                           |
| `pnpm test:coverage:changed`                      | 只對自 `origin/main` 以來變更的檔案執行單元 coverage。                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | 顯示相對於 `origin/main` 的 diff 觸發的架構 lane。                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | 在 CI 外預設委派給 Crabbox/Testbox，然後在遠端子程序內執行智慧變更檢查閘門：typecheck、lint，以及受影響 lane 的 guard 命令。不執行 Vitest；測試證明請使用 `pnpm test:changed` 或 `pnpm test <target>`。                                                                                      |

## 共用測試狀態與程序輔助工具

- `src/test-utils/openclaw-test-state.ts`：當測試需要隔離的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir 或 auth-profile store 時，從 Vitest 使用。
- `pnpm test:env-mutations:report`：對直接修改 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` 或相關 env key 的測試/harness 產生非阻塞報告。用它尋找可遷移到共用 test-state helper 的候選項。
- `test/helpers/openclaw-test-instance.ts`：需要正在執行的閘道、命令列介面 env、log capture 和集中 cleanup 的程序層級 E2E 測試。
- 來源為 `scripts/lib/docker-e2e-image.sh` 的 Docker/Bash E2E lane，可以將 `docker_e2e_test_state_shell_b64 <label> <scenario>` 傳入容器，並用 `scripts/lib/openclaw-e2e-instance.sh` 解碼；multi-home 指令碼可以傳入 `docker_e2e_test_state_function_b64`，並在每個流程中呼叫 `openclaw_test_state_create <label> <scenario>`。`node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 會寫入可 source 的 host env 檔案（`create` 前的 `--` 會避免較新的 Node runtime 將 `--env-file` 視為 Node 旗標）。啟動閘道的 lane 可以 source `scripts/lib/openclaw-e2e-instance.sh`，以取得 entrypoint resolution、mock OpenAI startup、前景/背景啟動、readiness probe、state env export、log dump 和 process cleanup。

## Control UI、終端介面與 extension lane

- **Control UI mock E2E：** `pnpm test:ui:e2e` 執行 Vitest + Playwright lane，該 lane 會啟動 Vite Control UI，並驅動真實 Chromium 頁面連到 mock 閘道 WebSocket。測試位於 `ui/src/**/*.e2e.test.ts`；共用 mock/control 位於 `ui/src/test-helpers/control-ui-e2e.ts`。`pnpm test:e2e` 包含此 lane。代理執行預設使用 Testbox/Crabbox，包括目標式證明；只有在明確本機備援時才使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`。
- **終端介面 PTY 測試：** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` 執行快速 fake-backend PTY lane。`OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 或 `pnpm tui:pty:test:watch --mode local` 會執行較慢的 `tui --local` smoke，它只 mock 外部模型端點。斷言穩定的可見文字或 fixture 呼叫，而不是 raw ANSI snapshot。
- `pnpm test:extensions` 和 `pnpm test extensions` 會執行所有 extension/外掛 shard。繁重的 channel 外掛、browser 外掛和 OpenAI 會作為專用 shard 執行；其他外掛群組維持批次處理。`pnpm test extensions/<id>` 會執行一個 bundled 外掛 lane。
- 有同層測試的來源檔案會先映射到該同層測試，再回退到較寬的目錄 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 編輯會使用本機 import graph 執行 importing tests，而不是在 dependency path 精準時廣泛執行每個 shard。
- `auto-reply` 分成三個專用 config（`core`、`top-level`、`reply`），讓 reply harness 不會主導較輕量的 top-level status/token/helper 測試。
- 選定的 `plugin-sdk` 和 `commands` 測試檔案會透過專用 light lane 路由，該 lane 只保留 `test/setup.ts`，讓 runtime-heavy case 留在既有 lane 上。
- 基礎 Vitest config 預設為 `pool: "threads"` 和 `isolate: false`，並在 repo config 中啟用共用 non-isolated runner。
- `pnpm test:channels` 執行 `vitest.channels.config.ts`。

## 閘道與 E2E

- 閘道整合為選用：`OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway`。
- `pnpm test:e2e`：repo E2E 彙總 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`。
- `pnpm test:e2e:gateway`：閘道端到端冒煙測試（多執行個體 WS/HTTP/節點配對）。預設在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 與自適應 worker；可用 `OPENCLAW_E2E_WORKERS=<n>` 調整，並用 `OPENCLAW_E2E_VERBOSE=1` 開啟詳細記錄。
- `pnpm test:live`：供應商即時測試（Claude/Minimax/DeepSeek/z.ai/等等，由 `*.live.test.ts` 控制）。需要 API 金鑰與 `LIVE=1`（或 `OPENCLAW_LIVE_TEST=1`）才會取消略過；可用 `OPENCLAW_LIVE_TEST_QUIET=0` 輸出詳細內容。

## 完整 Docker 套件組（`pnpm test:docker:all`）

建置共用即時測試映像檔，將 OpenClaw 一次打包為 npm tarball，建置/重用裸 Node/Git runner 映像檔，以及會將該 tarball 安裝到 `/app` 的功能映像檔，然後透過加權排程器執行 Docker 冒煙 lane。`scripts/package-openclaw-for-docker.mjs` 是唯一的本機/CI 套件打包器，並會在 Docker 使用前驗證 tarball 與 `dist/postinstall-inventory.json`。

- 裸映像檔（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）：安裝器/更新/外掛相依性 lane；掛載預先建置的 tarball，而不是複製 repo 原始碼。
- 功能映像檔（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）：一般已建置應用程式功能 lane。
- Lane 定義：`scripts/lib/docker-e2e-scenarios.mjs`。規劃器：`scripts/lib/docker-e2e-plan.mjs`。執行器：`scripts/test-docker-all.mjs`。
- `node scripts/test-docker-all.mjs --plan-json` 會輸出由排程器擁有的 CI 計畫（lane、映像檔類型、套件/即時映像檔需求、狀態情境、憑證檢查），不會建置或執行 Docker。

排程調整項（環境變數，括號內為預設值）：

| 環境變數                                                                                                        | 預設值              | 用途                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | 程序槽位。                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | 對供應商敏感的尾端池。                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 大型即時供應商 lane 上限。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm 資源 lane 上限。                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | 服務資源 lane 上限。                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | 每個供應商的大型 lane 上限。                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | 較窄的每供應商上限。                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | 較大型主機的覆寫值。                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | lane 啟動之間的延遲，避免本機 Docker daemon 建立風暴。                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000（120 分） | 每個 lane 的後備逾時；特定即時/尾端 lane 會使用更嚴格的上限。                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 暫時性即時供應商失敗的重試次數。                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | 不執行 Docker，只列印 lane manifest。                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | 作用中 lane 狀態列印間隔。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | 重用 `.artifacts/docker-tests/lane-timings.json` 以採用最久優先排序；設為 `0` 可停用。                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` 僅用於可決定性/本機 lane，`only` 僅用於即時供應商 lane。別名：`pnpm test:docker:local:all`、`pnpm test:docker:live:all`。僅即時模式會將 main 與 tail 即時 lane 合併為一個最久優先池，讓供應商 bucket 可一起打包 Claude/Codex/Gemini 工作。 |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | 命令列介面後端 Docker 設定逾時。                                                                                                                                                                                                                                                           |

資源上限的環境變數模式為 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`（資源名稱轉為大寫，非英數字元折疊為 `_`）。

其他行為：runner 預設會預檢 Docker、清理過期的 OpenClaw E2E 容器、在相容 lane 之間共用供應商命令列介面工具快取，並在第一次失敗後停止排程新的池化 lane，除非設定 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`。如果某個 lane 在低平行度主機上超過有效的權重/資源上限，它仍可從空池啟動並單獨執行，直到釋放容量。每個 lane 的記錄、`summary.json`、`failures.json` 與階段時間會寫入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 檢查較慢的 lane，並使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 列印低成本的目標重跑命令。

### 重要 Docker lane

| 命令                                                                     | 驗證                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | 由 Chromium 支援的來源 E2E 容器，具備原始 CDP + 隔離的閘道；`browser doctor --deep` CDP 角色快照包含連結 URL、由游標提升的可點擊項目、iframe 參照，以及 frame 中繼資料。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | 在裸 Docker runner 中安裝打包的 tarball，並使用 `skills.install.allowUploadedArchives: false`，從即時 ClawHub 搜尋解析目前的 skill slug，透過 `openclaw skills install` 安裝，並驗證 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 和 `skills info --json`。                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | 聚焦的命令列介面後端即時探測；Gemini 有對應的 `:resume` 和 `:mcp` 別名。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | Docker 化的 OpenClaw + Open WebUI：登入、檢查 `/api/models`，透過 `/api/chat/completions` 執行真正的代理聊天。需要可用的即時模型金鑰，並會拉取外部映像；不預期像單元/E2E 套件一樣具備 CI 穩定性。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | 已植入資料的閘道容器加上會產生 `openclaw mcp serve` 的用戶端容器：路由對話探索、逐字稿讀取、附件中繼資料、即時事件佇列行為、外傳傳送路由，以及透過真實 stdio bridge 傳送的 Claude 風格頻道 + 權限通知（斷言會直接讀取原始 stdio MCP frame）。                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | 將打包的 tarball 安裝到髒的舊使用者 fixture 上，執行套件更新以及沒有即時 provider/channel 金鑰的非互動式 doctor，啟動 loopback 閘道，檢查代理/channel 設定/外掛 allowlist/workspace/session 檔案/過期 legacy 外掛依賴狀態/startup/RPC 狀態是否保留。                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | 預設安裝 `openclaw@latest`，植入逼真的既有使用者檔案，透過烘焙好的 `openclaw config set` recipe 設定，更新到打包的 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，檢查 `/healthz`、`/readyz`、RPC 狀態。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 擴展矩陣，或用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 新增情境 fixture（包含 `configured-plugin-installs` 和 `stale-source-plugin-shadow`）。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline(s)` / `_scenarios`，並解析像 `last-stable-4` 或 `all-since-2026.4.23` 這類 meta token。 |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` 情境中的 published-upgrade survivor harness，預設從 `openclaw@2026.4.23` 開始。`Update Migration` 工作流程會用 `baselines=all-since-2026.4.23` 擴展此項，以證明 Full Release CI 之外的 configured-plugin 依賴清理。                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | 針對本機路徑、`file:`、含 hoisted 依賴的 npm registry 套件、git moving refs、ClawHub fixture、marketplace 更新，以及 Claude bundle 啟用/檢查的安裝/更新 smoke 測試。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## 本機 PR gate

若要執行本機 PR land/gate 檢查，請執行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在負載較高的主機上出現 flaky，請先重新執行一次，再將其視為 regression，然後用 `pnpm test <path/to/test>` 隔離問題。對於記憶體受限的主機：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 測試效能工具

- `pnpm test:perf:imports`：啟用 Vitest import-duration + import-breakdown 報告，同時仍對明確的檔案/目錄目標使用 scoped lane routing。`pnpm test:perf:imports:changed` 會將相同 profiling 範圍限制在自 `origin/main` 以來變更的檔案。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對相同已提交 git diff，比較 routed changed-mode path 與 native root-project run 的 benchmark；`pnpm test:perf:changed:bench -- --worktree` 會在不先提交的情況下 benchmark 目前 worktree 變更集。
- `pnpm test:perf:profile:main` 會為 Vitest main thread 寫入 CPU profile（`.artifacts/vitest-main-profile`）；`pnpm test:perf:profile:runner` 會為 unit runner 寫入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：序列執行每個 full-suite Vitest leaf config，並寫入分組的 duration 資料以及每個 config 的 JSON/log artifact。Full-suite 報告預設會隔離檔案，因此先前檔案保留的 module graph 和 GC pause 不會計入後續 assertion；只有在刻意 profiling shared-worker accumulation 時才傳入 `-- --no-isolate`。Test Performance Agent 會在嘗試修復慢速測試前，使用此作為 baseline。`pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` 會在以效能為重點的變更後比較分組報告。
- Full、extension 和 include-pattern shard run 會更新 `.artifacts/vitest-shard-timings.json` 中的本機 timing 資料；後續 whole-config run 會使用這些 timing 來平衡慢速與快速 shard。Include-pattern CI shard 會將 shard 名稱附加到 timing key，讓 filtered shard timing 保持可見，而不會取代 whole-config timing 資料。設定 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本機 timing artifact。

## Benchmarks

<Accordion title="模型延遲（scripts/bench-model.ts）">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

選用 env：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`。預設提示：「請只回覆一個單字：ok。不要標點符號或額外文字。」

</Accordion>

<Accordion title="命令列介面啟動（scripts/bench-cli-startup.ts）">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

預設組合：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：合併兩個預設組合

輸出包含每個命令的 `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布，以及最大 RSS。`--cpu-prof-dir` / `--heap-prof-dir` 會為每次執行寫入 V8 profiles。

已儲存的輸出：`pnpm test:startup:bench:smoke` 會寫入 `.artifacts/cli-startup-bench-smoke.json`；`pnpm test:startup:bench:save` 會寫入 `.artifacts/cli-startup-bench-all.json`（`runs=5 warmup=1`）。已簽入的 fixture：`test/fixtures/cli-startup-bench.json`，由 `pnpm test:startup:bench:update` 重新整理，並由 `pnpm test:startup:bench:check` 比對。

</Accordion>

<Accordion title="閘道啟動 (scripts/bench-gateway-startup.ts)">

預設使用建置後的命令列介面入口 `dist/entry.js`；請先執行 `pnpm build`。傳入 `--entry scripts/run-node.mjs` 可改為測量原始碼 runner，並將這些結果與建置入口基準分開保存。

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

案例 id：`default`、`skipChannels`（略過 channel 啟動）、`oneInternalHook`、`allInternalHooks`、`fiftyPlugins`（50 個 manifest 外掛）、`fiftyStartupLazyPlugins`（50 個 startup-lazy manifest 外掛）。

輸出包含第一個程序輸出、`/healthz`、`/readyz`、HTTP listen log time、閘道 ready log time、CPU time、CPU core ratio、max RSS、heap、startup trace metrics、event-loop delay，以及外掛 lookup-table detail metrics。此 script 會在子閘道環境中設定 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`。

`/healthz` 是存活狀態（HTTP server 可以回應）。`/readyz` 是可用就緒狀態（startup 外掛 sidecars、channels，以及 ready-critical post-attach 工作都已完成）。Startup hooks 會非同步分派，且不屬於就緒保證的一部分。Ready log time 是閘道的內部時間戳，適合用於程序端歸因，但不能取代外部 `/readyz` probe。

比較變更時請使用 JSON 輸出或 `--output`。只有在 trace 輸出指向 import、compile 或 CPU-bound 工作，而階段計時本身無法解釋時，才使用 `--cpu-prof-dir`。

</Accordion>

<Accordion title="閘道重新啟動 (scripts/bench-gateway-restart.ts)">

僅限 macOS 與 Linux（使用 SIGUSR1 進行程序內重新啟動；在 Windows 會立即失敗）。與上方閘道啟動相同，預設使用建置入口，並可用 `--entry scripts/run-node.mjs` 覆寫。

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

案例 id：`skipChannels`、`skipChannelsAcpxProbe`（ACPX startup probe 開啟）、`skipChannelsNoAcpxProbe`（probe 關閉）、`default`、`fiftyPlugins`。

輸出包含下一個 `/healthz`、下一個 `/readyz`、downtime、restart ready timing、CPU、RSS、替換程序的 startup trace metrics，以及 signal handling、active-work drain、close phases、next start、ready timing 和 memory snapshots 的 restart trace metrics。此 script 會設定 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 與 `OPENCLAW_GATEWAY_RESTART_TRACE=1`。

當變更涉及重新啟動訊號、close handlers、startup-after-restart、sidecar shutdown、service handoff，或重新啟動後的就緒狀態時，請使用此 benchmark。先從 `skipChannels` 開始，將閘道機制與 channel 啟動隔離；只有在窄範例能解釋重新啟動路徑後，才使用 `default` 或外掛較多的案例。Trace metrics 是歸因提示，不是判決；請根據多個樣本、相符的 owner span、`/healthz`/`/readyz` 行為，以及使用者可見的重新啟動契約來判斷重新啟動變更。

</Accordion>

## Onboarding E2E (Docker)

選用；只有容器化 onboarding smoke tests 需要。乾淨 Linux container 中的完整冷啟動流程：

```bash
scripts/e2e/onboard-docker.sh
```

透過 pseudo-tty 驅動互動式 wizard，驗證 config/workspace/session files，接著啟動閘道並執行 `openclaw health`。

## QR 匯入煙霧測試 (Docker)

確保維護中的 QR runtime helper 可在支援的 Docker 節點執行環境下載入（預設節點 24，相容節點 22）：

```bash
pnpm test:docker:qr
```

## 相關

- [測試](/zh-TW/help/testing)
- [即時測試](/zh-TW/help/testing-live)
- [測試更新與外掛](/zh-TW/help/testing-updates-plugins)
