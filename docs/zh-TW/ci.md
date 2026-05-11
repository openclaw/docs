---
read_when:
    - 你需要了解 CI 工作為何執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次發行驗證執行或重新執行
    - 你正在變更 ClawSweeper 派送或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發布總括項，以及本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-11T20:22:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個拉取請求時執行。`preflight` 作業會分類差異，並在只有不相關區域變更時關閉昂貴的執行路徑。手動 `workflow_dispatch` 執行會刻意略過智慧範圍限定，並展開完整圖形以供發行候選版本與廣泛驗證使用。Android 路徑透過 `include_android` 保持選擇性啟用。僅限發行的 Plugin 覆蓋範圍位於獨立的 [`Plugin 預先發行`](#plugin-prerelease) 工作流程中，且只會從 [`完整發行驗證`](#full-release-validation) 或明確的手動分派執行。

## 管線概覽

| 作業                             | 目的                                                                                                      | 執行時機                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、已變更範圍、已變更擴充功能，並建置 CI 資訊清單                                          | 永遠在非草稿推送與拉取請求上執行 |
| `security-scm-fast`              | 透過 `zizmor` 進行私密金鑰偵測與工作流程稽核                                                             | 永遠在非草稿推送與拉取請求上執行 |
| `security-dependency-audit`      | 對 npm 安全公告進行無相依性的生產 lockfile 稽核                                                          | 永遠在非草稿推送與拉取請求上執行 |
| `security-fast`                  | 快速安全作業所需的彙總檢查                                                                               | 永遠在非草稿推送與拉取請求上執行 |
| `check-dependencies`             | 僅針對 Knip 生產相依性進行檢查，外加未使用檔案允許清單防護                                               | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、控制 UI、建置成品檢查，以及可供下游重用的成品                                             | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性路徑，例如 bundled/plugin-contract/protocol 檢查                                        | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的通道合約檢查，並提供穩定的彙總檢查結果                                                             | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，排除通道、bundled、合約與擴充功能路徑                                                | Node 相關變更                      |
| `check`                          | 分片的主要本機閘門等效檢查：生產型別、lint、防護、測試型別與嚴格 smoke                                  | Node 相關變更                      |
| `check-additional`               | 架構、分片邊界/提示漂移、擴充功能防護、套件邊界與 Gateway 監看                                          | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI 的 smoke 測試與啟動記憶體 smoke                                                               | Node 相關變更                      |
| `checks`                         | 建置成品通道測試的驗證器                                                                                 | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 路徑                                                                          | 發行用手動 CI 分派                 |
| `check-docs`                     | 文件格式、lint 與失效連結檢查                                                                            | 文件已變更                         |
| `skills-python`                  | Python 支援 Skills 的 Ruff + pytest                                                                      | Python Skills 相關變更             |
| `checks-windows`                 | Windows 專用的程序/路徑測試，以及共用執行階段匯入指定器回歸檢查                                         | Windows 相關變更                   |
| `macos-node`                     | 使用共用建置成品的 macOS TypeScript 測試路徑                                                             | macOS 相關變更                     |
| `macos-swift`                    | macOS 應用程式的 Swift lint、建置與測試                                                                  | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android 單元測試，以及一個 debug APK 建置                                                 | Android 相關變更                   |
| `test-performance-agent`         | 在可信活動後進行每日 Codex 慢速測試最佳化                                                                | 主要 CI 成功或手動分派             |
| `openclaw-performance`           | 每日/隨選 Kova 執行階段效能報告，包含 mock-provider、deep-profile 與 GPT 5.4 即時路徑                    | 排程與手動分派                     |

## 快速失敗順序

1. `preflight` 決定哪些路徑實際存在。`docs-scope` 與 `changed-scope` 邏輯是此作業內的步驟，不是獨立作業。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 與 `skills-python` 會快速失敗，不等待較重的成品與平台矩陣作業。
3. `build-artifacts` 會與快速 Linux 路徑重疊，讓下游消費者在共用建置就緒後立即開始。
4. 較重的平台與執行階段路徑隨後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 與 `android`。

當較新的推送落在同一個拉取請求或 `main` 參照上時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非同一參照的最新執行也失敗，否則請將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此它們仍會回報正常的分片失敗，但在整個工作流程已被取代後不會再排入佇列。自動 CI 並行鍵已版本化（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍作業無法無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

`ci-timings-summary` 作業會為每次非草稿 CI 執行上傳精簡的 `ci-timings-summary` 成品。它會記錄目前執行的牆鐘時間、排隊時間、最慢作業與失敗作業，因此 CI 健康檢查不需要重複抓取完整的 Actions 酬載。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試覆蓋。手動分派會略過變更範圍偵測，並讓 preflight 資訊清單表現得像每個限定範圍的區域都已變更。

- **CI 工作流程編輯**會驗證 Node CI 圖形與工作流程 lint，但本身不會強制執行 Windows、Android 或 macOS 原生建置；這些平台路徑仍限定於平台原始碼變更。
- **僅限 CI 路由的編輯、選定的廉價核心測試 fixture 編輯，以及狹窄的 Plugin 合約輔助/測試路由編輯**會使用快速的僅 Node 資訊清單路徑：`preflight`、安全檢查，以及單一 `checks-fast-core` 任務。當變更僅限於快速任務直接執行的路由或輔助介面時，該路徑會略過建置成品、Node 22 相容性、通道合約、完整核心分片、bundled-plugin 分片與額外防護矩陣。
- **Windows Node 檢查**限定於 Windows 專用程序/路徑包裝器、npm/pnpm/UI 執行器輔助工具、套件管理器設定，以及執行該路徑的 CI 工作流程介面；不相關的原始碼、Plugin、安裝 smoke 與僅測試變更仍保留在 Linux Node 路徑上。

最慢的 Node 測試家族會被拆分或平衡，讓每個作業保持較小而不過度保留 runner：通道合約以三個加權的 Blacksmith 支援分片執行，並有標準 GitHub runner 後援；核心單元 fast/support 路徑分開執行；核心執行階段基礎設施拆分為 state、process/config、cron 與 shared 分片；auto-reply 以平衡的 worker 執行（reply 子樹拆分為 agent-runner、dispatch 與 commands/state-routing 分片）；agentic gateway/server 設定拆分到 chat/auth/model/http-plugin/runtime/startup 路徑，而不是等待建置成品。廣泛的瀏覽器、QA、媒體與其他 Plugin 測試使用其專用 Vitest 設定，而不是共用的 Plugin 統包。include-pattern 分片會使用 CI 分片名稱記錄時間項目，因此 `.artifacts/vitest-shard-timings.json` 能區分完整設定與已篩選分片。`check-additional` 將套件邊界編譯/canary 工作放在一起，並將執行階段拓撲架構與 Gateway 監看覆蓋範圍分開；邊界防護清單會分散到四個矩陣分片，每個分片都並行執行選定的獨立防護，並列印各檢查的時間。昂貴的 Codex happy-path 提示快照漂移檢查會作為自己的額外作業執行，只用於手動 CI 與影響提示的變更，因此一般不相關的 Node 變更不會等待冷啟提示快照生成，邊界分片也能保持平衡，同時提示漂移仍釘選到造成它的拉取請求；相同旗標也會在建置成品核心 support-boundary 分片內略過提示快照 Vitest 生成。Gateway 監看、通道測試與核心 support-boundary 分片會在 `dist/` 與 `dist-runtime/` 已建置後，於 `build-artifacts` 內並行執行。

Android CI 會執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，接著建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其單元測試路徑仍會使用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送時重複執行 debug APK 封裝作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（針對生產 Knip 僅相依性檢查，釘選到最新 Knip 版本，並在 `dlx` 安裝時停用 pnpm 的最短發布年齡限制）以及 `pnpm deadcode:unused-files`，後者會將 Knip 的生產未使用檔案發現與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當拉取請求新增未審查的未使用檔案或留下過期的允許清單項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的刻意動態 Plugin、生成、建置、即時測試與套件橋接介面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會 check out 或執行不受信任的拉取請求程式碼。此工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` 酬載分派到 `openclaw/clawsweeper`。

此工作流程有四個路徑：

- `clawsweeper_item` 用於精確的議題與拉取請求審查請求；
- `clawsweeper_comment` 用於議題留言中的明確 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` 推送上的提交層級審查請求；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub 活動。

`github_activity` 路徑只會轉送正規化中繼資料：事件類型、動作、執行者、儲存庫、項目編號、URL、標題、狀態，以及存在時的留言或審查短摘錄。它刻意避免轉送完整 webhook 主體。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，它會將正規化事件發布到 OpenClaw Gateway hook，供 ClawSweeper agent 使用。

一般活動是觀察，而非預設傳遞。ClawSweeper agent 會在其提示中收到 Discord 目標，且只有在事件令人意外、可採取行動、有風險或對營運有用時，才應發布到 `#clawsweeper`。例行開啟、編輯、bot 變動、重複 Webhook 雜訊與正常審查流量都應產生 `NO_REPLY`。

在整個路徑中，將 GitHub 標題、留言、內文、審查文字、分支名稱與 commit 訊息視為不受信任的資料。它們是摘要與分診的輸入，不是 workflow 或 agent runtime 的指令。

## 手動觸發

手動 CI 觸發會執行與一般 CI 相同的 job graph，但會強制啟用所有非 Android 範圍的 lane：Linux Node 分片、 bundled-plugin 分片、channel contract、Node 22 相容性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI 觸發只會在 `include_android=true` 時執行 Android；完整 release umbrella 會透過傳入 `include_android=true` 來啟用 Android。Plugin prerelease static checks、僅 release 使用的 `agentic-plugins` 分片、完整 extension batch sweep，以及 plugin prerelease Docker lane 都會從 CI 排除。Docker prerelease suite 只會在 `Full Release Validation` 以 release-validation gate 啟用的狀態分派獨立的 `Plugin Prerelease` workflow 時執行。

手動執行會使用唯一的 concurrency group，因此 release-candidate full suite 不會被同一 ref 上的另一個 push 或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫者在使用所選 dispatch ref 的 workflow 檔案時，針對分支、標籤或完整 commit SHA 執行該 graph。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、快速安全性 job 與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled checks、分片的 channel contract checks、除了 lint 以外的 `check` 分片、`check-additional` 彙總、Node test aggregate verifiers、docs checks、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub-hosted Ubuntu，讓 Blacksmith matrix 可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較輕量的 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`，以及 `check-test-types`                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke、Linux Node test 分片、bundled plugin test 分片、`check-additional` 分片、`android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`、`check-lint`（對 CPU 足夠敏感，8 vCPU 省下的成本不如增加的成本）；install-smoke Docker builds（32-vCPU 排隊時間的成本高於其節省的時間）                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

Canonical-repo CI 會保留 Blacksmith 作為預設 runner 路徑。在 `preflight` 期間，`scripts/ci-runner-labels.mjs` 會檢查最近已排隊與執行中的 Actions 執行，以找出已排隊的 Blacksmith job。如果特定 Blacksmith label 已經有排隊中的 job，原本會使用該 exact label 的下游 job 只會在該次執行中退回相符的 GitHub-hosted runner（`ubuntu-24.04`、`windows-2025` 或 `macos-latest`）。同一 OS family 中其他 Blacksmith size 會維持在其主要 label 上。如果 API probe 失敗，則不會套用 fallback。

## 本機等效命令

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` 是產品/runtime 效能 workflow。它每天在 `main` 上執行，也可以手動觸發：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動觸發通常會 benchmark workflow ref。設定 `target_ref` 可使用目前 workflow 實作來 benchmark release tag 或其他分支。已發布的 report path 與 latest pointer 會依 tested ref 建立 key，而每個 `index.md` 都會記錄 tested ref/SHA、workflow ref/SHA、Kova ref、profile、lane auth mode、model、repeat count，以及 scenario filters。

此 workflow 會從 pinned release 安裝 OCM，並從 `openclaw/Kova` 的 pinned `kova_ref` 輸入安裝 Kova，然後執行三個 lane：

- `mock-provider`：針對 local-build runtime，以 deterministic fake OpenAI-compatible auth 執行 Kova diagnostic scenarios。
- `mock-deep-profile`：針對 startup、gateway 與 agent-turn 熱點進行 CPU/heap/trace profiling。
- `live-gpt54`：一次真實的 OpenAI `openai/gpt-5.4` agent turn，在 `OPENAI_API_KEY` 不可用時略過。

mock-provider lane 也會在 Kova pass 後執行 OpenClaw-native source probes：default、hook 與 50-plugin startup case 的 gateway boot timing 與 memory；重複的 mock-OpenAI `channel-chat-baseline` hello loops；以及針對已啟動 gateway 的 CLI startup commands。source probe Markdown summary 位於 report bundle 中的 `source/index.md`，原始 JSON 則在旁邊。

每個 lane 都會上傳 GitHub artifacts。當設定 `CLAWGRIT_REPORTS_TOKEN` 時，此 workflow 也會將 `report.json`、`report.md`、bundles、`index.md` 與 source-probe artifacts commit 到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 底下。目前的 tested-ref pointer 會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整 Release 驗證

`Full Release Validation` 是「在 release 前執行所有項目」的手動 umbrella workflow。它接受分支、標籤或完整 commit SHA，使用該目標分派手動 `CI` workflow，為僅 release 使用的 plugin/package/static/Docker proof 分派 `Plugin Prerelease`，並為 install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix 與 Telegram lane 分派 `OpenClaw Release Checks`。Stable/default 執行會把 exhaustive live/E2E 與 Docker release-path coverage 保留在 `run_release_soak=true` 之後；`release_profile=full` 會強制啟用該 soak coverage，讓廣泛的 advisory validation 維持廣泛。使用 `rerun_group=all` 與 `release_profile=full` 時，它也會針對 release checks 的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳入 `release_package_spec` 即可在 release checks、Package Acceptance、Docker、cross-OS 與 Telegram 中重用已發行的 npm package，而不需重新建置。只有在 Telegram 必須驗證不同 package 時，才使用 `npm_telegram_package_spec`。

請參閱[完整 release 驗證](/zh-TW/reference/full-release-validation)，了解
stage matrix、確切 workflow job names、profile differences、artifacts，以及
focused rerun handles。

`OpenClaw Release Publish` 是手動的 mutating release workflow。在 release tag 存在且
OpenClaw npm preflight 成功後，從 `release/YYYY.M.D` 或 `main` 分派它。它會驗證 `pnpm plugins:sync:check`、
為所有可發布的 plugin package 分派 `Plugin NPM Release`、為相同 release SHA 分派
`Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 分派
`OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上提供釘選提交的證明，請使用輔助工具，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程派送參照必須是分支或標籤，而不是原始提交 SHA。此輔助工具會在目標 SHA 上推送臨時 `release-ci/<sha>-...` 分支，從該釘選參照派送 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成時刪除臨時分支。若任何子工作流程在不同 SHA 上執行，傘狀驗證器也會失敗。

`release_profile` 控制傳入發布檢查的 live/provider 廣度。手動發布工作流程預設為 `stable`；只有在你刻意需要廣泛的建議性 provider/media 矩陣時，才使用 `full`。`run_release_soak` 控制 stable/default 發布檢查是否執行完整的 live/E2E 與 Docker 發布路徑 soak；`full` 會強制啟用 soak。

- `minimum` 保留最快的 OpenAI/core 發布關鍵路徑。
- `stable` 加入穩定的 provider/backend 集合。
- `full` 執行廣泛的建議性 provider/media 矩陣。

傘狀流程會記錄已派送的子執行 ID，而最終的 `Verify full validation` job 會重新檢查目前的子執行結論，並為每個子執行附加最慢 job 表格。如果重新執行某個子工作流程後轉為綠燈，只需重新執行父層驗證器 job，即可刷新傘狀結果與時間摘要。

復原時，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。發布候選請使用 `all`，只重跑一般完整 CI 子流程請用 `ci`，只重跑 Plugin 預發布子流程請用 `plugin-prerelease`，重跑每個發布子流程請用 `release-checks`，或在傘狀流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能在針對性修復後，將失敗發布箱的重跑範圍維持在有限範圍。若只有一個 cross-OS 路徑失敗，請將 `rerun_group=cross-os` 搭配 `cross_os_suite_filter`，例如 `windows/packaged-upgrade`；長時間的 cross-OS 命令會輸出 Heartbeat 行，packaged-upgrade 摘要也包含各階段時間。QA 發布檢查路徑屬於建議性質，因此只有 QA 失敗會警告，但不會阻擋 release-check 驗證器。

`OpenClaw Release Checks` 使用受信任的工作流程參照，將選取的參照解析一次成 `release-package-under-test` tarball，然後把該成品傳給 cross-OS 檢查與套件驗收，並在執行 soak 覆蓋時傳給 live/E2E 發布路徑 Docker 工作流程。這讓套件位元組在所有發布箱之間保持一致，並避免在多個子 job 中重新打包同一個候選版本。

針對 `ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的傘狀流程。當父層被取消時，父層監控器會取消它已派送的任何子工作流程，因此較新的 main 驗證不會卡在過期的兩小時 release-check 執行後方。發布分支/標籤驗證與聚焦的重跑群組會保留 `cancel-in-progress: false`。

## Live 與 E2E 分片

發布 live/E2E 子流程保留廣泛的原生 `pnpm test:live` 覆蓋，但會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是使用單一序列 job：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider 篩選的 `native-live-src-gateway-profiles` job
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的媒體音訊/視訊分片，以及 provider 篩選的音樂分片

這保留相同的檔案覆蓋，同時讓緩慢的 live provider 失敗更容易重跑與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重跑。

原生 live 媒體分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，此映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；媒體 job 只會在設定前驗證二進位檔。請將 Docker-backed live 套件保留在一般 Blacksmith runner 上，container job 不適合啟動巢狀 Docker 測試。

Docker-backed live model/backend 分片會針對每個選取的提交使用獨立共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。live 發布工作流程會建置並推送該映像一次，接著 Docker live model、provider 分片的 Gateway、CLI backend、ACP bind 與 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片帶有明確的指令碼層級 `timeout` 上限，低於工作流程 job timeout，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個 release-check 預算。如果這些分片各自重新建置完整 source Docker 目標，表示發布執行設定錯誤，會把時間浪費在重複映像建置上。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證原始碼樹，而套件驗收會透過使用者在安裝或更新後所使用的同一套 Docker E2E harness，驗證單一 tarball。

### Job

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程參照、套件參照、版本、SHA-256 和 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備 package-digest Docker 映像，並針對該套件執行選取的 Docker 路徑，而不是打包工作流程 checkout。當某個 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會先準備套件與共享映像一次，然後將這些路徑展開為平行的目標 Docker job，並使用唯一成品。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行；若套件驗收已解析套件，則會安裝同一個 `package-under-test` 成品；獨立 Telegram 派送仍可安裝已發布的 npm 規格。
4. `summary` 會在套件解析、Docker 驗收或可選的 Telegram 路徑失敗時，讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。請將此用於已發布的預發布/穩定版驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤，驗證選取的提交可從儲存庫分支歷史或發布標籤到達，在 detached worktree 中安裝依賴，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 是選填，但外部共享成品應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是 `source=ref` 時會被打包的來源提交。這讓目前的測試 harness 能驗證較舊的受信任來源提交，而不必執行舊的工作流程邏輯。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` profile 使用離線 Plugin 覆蓋，因此已發布套件驗證不會受限於 live ClawHub 可用性。可選的 Telegram 路徑會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並為獨立派送保留已發布 npm 規格路徑。

關於專用的更新與 Plugin 測試政策，包括本機命令、Docker 路徑、套件驗收輸入、發布預設值與失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、準備好的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`，以及 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、即時 ClawHub Skill 安裝、過期 Plugin 依賴項清理、已設定 Plugin 的安裝修復、離線 Plugin、Plugin 更新，以及 Telegram 證明，都使用同一個已解析的套件 tarball。在發布 beta 後，在完整發布驗證或 OpenClaw 發布檢查上設定 `release_package_spec`，即可針對已出貨的 npm 套件執行同一個矩陣而不重新建置；只有在套件驗收需要使用不同於其餘發布驗證的套件時，才設定 `package_acceptance_package_spec`。跨 OS 發布檢查仍涵蓋 OS 特定的導入、安裝器與平台行為；套件/更新產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker lane 會在阻擋發布路徑中，每次執行驗證一個已發布套件基準。在套件驗收中，已解析的 `package-under-test` tarball 永遠是候選版本，而 `published_upgrade_survivor_baseline` 會選擇後備的已發布基準，預設為 `openclaw@latest`；失敗 lane 的重新執行命令會保留該基準。當完整發布驗證使用 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展到四個最新穩定 npm 發布版本，加上固定的 Plugin 相容性邊界發布版本，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、波浪號記錄路徑，以及過期舊版 Plugin 依賴項根目錄的議題形狀 fixture。多基準 published-upgrade survivor 選項會依基準分片到個別的目標 Docker runner 工作。獨立的 `更新遷移` workflow 會使用 `update-migration` Docker lane 搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`，用於問題是完整的已發布更新清理，而不是一般完整發布 CI 廣度時。本機聚合執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件規格，也可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 供情境矩陣使用。已發布 lane 會以內建的 `openclaw config set` 命令配方設定基準，將配方步驟記錄到 `summary.json`，並在 Gateway 啟動後探測 `/healthz`、`/readyz`，以及 RPC 狀態。Windows 套件化與安裝器全新 lane 也會驗證已安裝套件能從原始絕對 Windows 路徑匯入瀏覽器控制覆寫。OpenAI 跨 OS agent-turn 煙霧測試在設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因此安裝與 Gateway 證明會維持在 GPT-5 測試模型，同時避免 GPT-4.x 預設值。

### 舊版相容性時窗

套件驗收對已發布套件有界定的舊版相容性時窗。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從 tarball 衍生的假 git fixture 中修剪缺少的 pnpm `patchedDependencies`，並可以記錄缺少的持久化 `update.channel`；
- Plugin 煙霧測試可以讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可以允許設定中繼資料遷移，同時仍要求安裝記錄與不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可以針對已出貨的本機建置中繼資料戳記檔案發出警告。較新的套件必須滿足現代契約；相同條件會失敗，而不是警告或略過。

### 範例

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

偵錯失敗的套件驗收執行時，先從 `resolve_package` 摘要開始，以確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時與重新執行命令。優先重新執行失敗的套件設定檔或精確 Docker lane，而不是重新執行完整發布驗證。

## 安裝煙霧測試

獨立的 `安裝煙霧測試` workflow 會透過自己的 `preflight` 工作重用同一個範圍腳本。它會將煙霧測試覆蓋拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/套件表面、內建 Plugin 套件/manifest 變更，或 Docker 煙霧測試工作會演練的核心 Plugin/channel/gateway/Plugin SDK 表面的 pull request 執行。僅原始碼的內建 Plugin 變更、僅測試編輯與僅文件編輯不會保留 Docker worker。快速路徑會建置根 Dockerfile 映像一次、檢查 CLI、執行 agents delete shared-workspace CLI 煙霧測試、執行容器 gateway-network e2e、驗證內建 extension 建置引數，並在 240 秒聚合命令逾時內執行有界的內建 Plugin Docker 設定檔（每個情境的 Docker 執行另有個別上限）。
- **完整路徑**會保留 QR 套件安裝與安裝器 Docker/更新覆蓋，用於夜間排程執行、手動派送、workflow-call 發布檢查，以及真正觸及安裝器/套件/Docker 表面的 pull request。在完整模式中，install-smoke 會準備或重用一個目標 SHA GHCR 根 Dockerfile 煙霧測試映像，接著將 QR 套件安裝、根 Dockerfile/Gateway 煙霧測試、安裝器/更新煙霧測試，以及快速內建 Plugin Docker E2E 作為獨立工作執行，讓安裝器工作不必排在根映像煙霧測試後面等待。

`main` 推送（包括合併 commit）不會強制使用完整路徑；當變更範圍邏輯會在推送上要求完整覆蓋時，workflow 會保留快速 Docker 煙霧測試，並將完整安裝煙霧測試留給夜間或發布驗證。

較慢的 Bun 全域安裝 image-provider 煙霧測試會另外由 `run_bun_global_install_smoke` 控制。它會在夜間排程與發布檢查 workflow 中執行，手動 `安裝煙霧測試` 派送也可選擇加入，但 pull request 與 `main` 推送不會執行。QR 與安裝器 Docker 測試會保留各自專注於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用的即時測試映像、將 OpenClaw 打包一次成 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝器/更新/Plugin 依賴項 lane 的裸 Node/Git runner；
- 將同一個 tarball 安裝到 `/app` 中、用於一般功能 lane 的功能映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的計畫。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主集區槽位數。                                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider 敏感尾端集區槽位數。                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行即時 lane 上限，避免 provider 節流。                                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行多服務 lane 上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，以避免 Docker daemon 建立風暴；設為 `0` 表示不錯開。                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的後備逾時（120 分鐘）；選取的即時/尾端 lane 使用更嚴格的上限。                    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫而不執行 lane。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗號分隔的精確 lane 清單；略過清理煙霧測試，讓 agent 能重現一個失敗的 lane。                 |

比其有效上限更重的 lane 仍可從空集區啟動，接著獨自執行直到釋放容量。本機聚合會預檢 Docker、移除過期的 OpenClaw E2E 容器、輸出作用中 lane 狀態、持久化 lane 計時以供最長優先排序，並預設在第一次失敗後停止排程新的 pooled lane。

### 可重用即時/E2E workflow

可重用即時/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、即時映像、lane 與憑證覆蓋。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball 清單；當計畫需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或現有套件 digest 映像，而不是重新建置。Docker 映像拉取會以有界的每次嘗試 180 秒逾時重試，因此卡住的 registry/cache stream 會快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發布路徑分塊

發布 Docker 覆蓋會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊工作，因此每個分塊只會拉取所需的映像種類，並透過同一個加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行版 Docker 分塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍保留為 Plugin/runtime 的聚合別名。`install-e2e` 通道別名仍是兩個供應商安裝程式通道的聚合手動重跑別名。

當完整發行路徑覆蓋要求 OpenWebUI 時，它會併入 `plugins-runtime-services`；只有在僅針對 OpenWebUI 的派送中，才保留獨立的 `openwebui` 分塊。Bundled-channel 更新通道會針對暫時性 npm 網路失敗重試一次。

每個分塊都會上傳 `.artifacts/docker-tests/`，其中包含通道日誌、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢速通道表格，以及每個通道的重跑命令。工作流程的 `docker_lanes` 輸入會使用已準備好的映像檔執行選定通道，而不是執行分塊作業，這會將失敗通道的除錯範圍限制在一個目標 Docker 作業內，並為該次執行準備、下載或重用套件成品；如果選定通道是即時 Docker 通道，目標作業會在本機建置即時測試映像檔以供該次重跑使用。產生的每通道 GitHub 重跑命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備映像檔輸入，因此失敗通道可以重用失敗執行中的完全相同套件與映像檔。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的即時/E2E 工作流程會每日執行完整發行路徑 Docker 套件。

## Plugin 預發行

`Plugin Prerelease` 是成本較高的產品/套件覆蓋，因此它是由 `Full Release Validation` 或明確操作員派送的獨立工作流程。一般 pull request、`main` 推送和獨立手動 CI 派送都不會啟用該套件。它會在八個 extension worker 之間平衡 bundled Plugin 測試；這些 extension 分片作業一次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest worker 和較大的 Node heap，因此匯入量大的 Plugin 批次不會產生額外的 CI 作業。僅限發行的 Docker 預發行路徑會以小群組批次執行目標 Docker 通道，以避免為一到三分鐘的作業保留數十個 runner。該工作流程也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` 成品；inspector 發現是分流輸入，不會改變封鎖性的 Plugin Prerelease gate。

## QA Lab

QA Lab 在主要智慧範圍工作流程之外有專用 CI 通道。Agentic parity 巢狀於廣泛的 QA 和發行 harness 之下，而不是獨立的 PR 工作流程。當 parity 應該隨廣泛驗證執行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會每晚在 `main` 上執行，也會在手動派送時執行；它會將 mock parity 通道、即時 Matrix 通道，以及即時 Telegram 和 Discord 通道展開為平行作業。即時作業使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex leases。

發行檢查會使用確定性的 mock provider 和符合 mock 條件的模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram 即時傳輸通道，因此 channel contract 會與即時模型延遲和一般 provider-plugin 啟動隔離。即時傳輸 Gateway 會停用記憶體搜尋，因為 QA parity 會另外覆蓋記憶體行為；provider 連線能力由獨立的即時模型、原生 provider 和 Docker provider 套件覆蓋。

Matrix 會針對排程和發行 gate 使用 `--profile fast`，只有在 checkout 的 CLI 支援時才加入 `--fail-fast`。CLI 預設值和手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 派送一律會將完整 Matrix 覆蓋分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab 通道；其 QA parity gate 會將 candidate 和 baseline pack 作為平行通道作業執行，然後將兩者成品下載到小型報告作業中，以進行最終 parity 比較。

對於一般 PR，請遵循具範圍的 CI/check 證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程有意設計為狹窄的第一輪安全掃描器，而不是完整的 repository 掃描。每日、手動和非草稿 pull request guard 執行會掃描 Actions workflow code，以及最高風險的 JavaScript/TypeScript 表面，並使用高信心安全查詢，篩選為高/critical `security-severity`。

pull request guard 保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下有變更時啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 和 macOS CodeQL 不包含在 PR 預設值中。

### 安全類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、secrets、sandbox、cron 和 Gateway baseline                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | 核心 channel 實作合約，加上 channel Plugin runtime、Gateway、Plugin SDK、secrets、audit touchpoints                                |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、network guard、web-fetch 和 Plugin SDK SSRF policy 表面                                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers、process execution helpers、outbound delivery 和 agent tool-execution gates                                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install、loader、manifest、registry、package-manager install、source-loading 和 Plugin SDK package contract trust surfaces |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。在 workflow sanity 可接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android app。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中篩除 dependency build results，並上傳至 `/codeql-critical-security/macos`。由於 macOS 建置即使乾淨也主導 runtime，因此保留在每日預設值之外。

### Critical Quality 類別

`CodeQL Critical Quality` 是對應的非安全分片。它只會在較小的 Blacksmith Linux runner 上，針對狹窄的高價值表面執行 error-severity、非安全 JavaScript/TypeScript 品質查詢。其 pull request guard 刻意小於排程 profile：非草稿 PR 只會在 agent command/model/tool execution 和 reply dispatch code、config schema/migration/IO code、auth/secrets/sandbox/security code、核心 channel 與 bundled channel Plugin runtime、Gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、Plugin loader、Plugin SDK/package-contract 或 Plugin SDK reply runtime 變更時，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 設定和品質工作流程變更會執行全部十二個 PR 品質分片。

手動派送接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄 profile 是用於隔離執行單一品質分片的教學/迭代 hooks。

| 類別                                                    | 範圍                                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、祕密、沙箱、Cron 與 Gateway 安全邊界程式碼                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定 schema、遷移、正規化與 IO 合約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 通訊協定 schema 與伺服器方法合約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與內建通道 Plugin 實作合約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/供應商分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接器、程序監督輔助工具，以及外送合約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體 Plugin SDK 別名、記憶體執行階段啟用黏合層，以及記憶體 doctor 命令                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段遞送佇列、外送工作階段繫結/遞送輔助工具、診斷事件/記錄 bundle 介面，以及工作階段 doctor CLI 合約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 進站回覆分派、回覆承載/分塊/執行階段輔助工具、通道回覆選項、遞送佇列，以及工作階段/執行緒繫結輔助工具             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、供應商驗證與探索、供應商執行階段註冊、供應商預設值/目錄，以及網頁/搜尋/擷取/嵌入註冊表    |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、Gateway 控制流程，以及工作控制平面執行階段合約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取/搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、註冊表、公開介面，以及 Plugin SDK 進入點合約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 原始碼與 Plugin 套件合約輔助工具                                                                                      |

品質與安全性保持分離，如此品質發現可以在不模糊安全訊號的情況下排程、量測、停用或擴充。Swift、Python 與內建 Plugin 的 CodeQL 擴充，應只在狹窄設定檔具備穩定執行階段與訊號後，才作為有範圍或分片的後續工作加回。

## 維護工作流程

### 文件 Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用來讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非機器人推送 CI 執行可以觸發它，手動分派也可以直接執行它。若 `main` 已往前移動，或過去一小時內已建立另一個未略過的 Docs Agent 執行，workflow-run 呼叫會略過。執行時，它會檢閱從前一個未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### 測試效能 Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於處理慢速測試。它沒有純排程：`main` 上成功的非機器人推送 CI 執行可以觸發它，但若同一個 UTC 日已有另一個 workflow-run 呼叫已執行或正在執行，它會略過。手動分派會繞過該每日活動閘門。這條路徑會建置完整套件分組的 Vitest 效能報告，讓 Codex 只進行小型、保留涵蓋率的測試效能修正，而不是廣泛重構；接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，且 agent 後的完整套件報告必須通過，才會提交任何內容。當 `main` 在機器人推送落地前前進，這條路徑會 rebase 已驗證的補丁、重新執行 `pnpm check:changed`，並重試推送；衝突的過期補丁會被略過。它使用 GitHub 託管的 Ubuntu，因此 Codex action 可以維持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是一個手動維護者工作流程，用於落地後的重複項清理。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會驗證已落地的 PR 已合併，且每個重複項都有共用的引用 issue，或有重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求比廣泛 CI 平台範圍更嚴格：

- 核心正式環境變更會執行核心正式環境與核心測試 typecheck，加上核心 lint/guard；
- 僅核心測試變更只會執行核心測試 typecheck，加上核心 lint；
- 擴充功能正式環境變更會執行擴充功能正式環境與擴充功能測試 typecheck，加上擴充功能 lint；
- 僅擴充功能測試變更會執行擴充功能測試 typecheck，加上擴充功能 lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴展到擴充功能 typecheck，因為擴充功能依賴這些核心合約（Vitest 擴充功能 sweep 仍是明確的測試工作）；
- 僅發布中繼資料的版本 bump 會執行目標式版本/設定/根依賴檢查；
- 未知的根目錄/設定變更會 fail safe 到所有檢查路徑。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，原始碼編輯會優先使用明確對應，接著是同層測試與匯入圖相依項。共享群組聊天室遞送設定是明確對應之一：群組可見回覆設定、來源回覆遞送模式，或 message-tool 系統提示的變更，會路由通過核心回覆測試，加上 Discord 與 Slack 遞送迴歸，讓共享預設值變更在第一次 PR 推送前就失敗。只有當變更的範圍大到橫跨測試架構，使便宜的對應集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是 repo 擁有的遠端機器包裝器，用於維護者 Linux 證明。當檢查對本機編輯迴圈而言太廣、需要 CI 同等性，或證明需要祕密、Docker、套件路徑、可重用機器或遠端記錄時，請從 repo 根目錄使用它。一般 OpenClaw 後端是 `blacksmith-testbox`；擁有的 AWS/Hetzner 容量是 Blacksmith 中斷、配額問題或明確需要自有容量測試時的備援。

Crabbox 支援的 Blacksmith 執行會 warm、claim、sync、run、report，並清理一次性 Testbox。內建 sync sanity check 會在必要根檔案如 `pnpm-lock.yaml` 消失，或 `git status --short` 顯示至少 200 個已追蹤刪除時快速失敗。對於刻意的大量刪除 PR，請為遠端命令設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

Crabbox 也會終止停留在 sync 階段超過五分鐘且沒有 sync 後輸出的本機 Blacksmith CLI 呼叫。設定 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該 guard，或對異常大的本機 diff 使用較大的毫秒值。

第一次執行前，請從 repo 根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

若 Crabbox 二進位檔過舊且未宣告 `blacksmith-testbox`，repo 包裝器會拒絕執行。即使 `.crabbox.yaml` 有自有雲端預設值，也請明確傳入 provider。

變更閘門：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

聚焦測試重跑：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

完整套件：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

請閱讀最終 JSON 摘要。有用的欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 與 `totalMs`。一次性 Blacksmith 支援的 Crabbox 執行應自動停止 Testbox；如果執行中斷或清理狀態不明，請檢查即時機器，且只停止你建立的機器：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要在同一台已 hydrated 的機器上執行多個命令時，才使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是損壞的層，但 Blacksmith 本身可運作，請只將直接 Blacksmith 用於診斷，例如 `list`、`status` 與清理。在將直接 Blacksmith 執行視為維護者證明之前，請先修正 Crabbox 路徑。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可運作，但新的 warmup 在幾分鐘後仍停在 `queued`，且沒有 IP 或 Actions 執行 URL，請將其視為 Blacksmith provider、佇列、帳務或組織限制壓力。停止你建立的 queued id，避免啟動更多 Testbox，並將證明移到下方自有 Crabbox 容量路徑，同時讓人檢查 Blacksmith 儀表板、帳務與組織限制。

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確以自有容量為目標時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務確實需要 48xlarge 等級的 CPU，否則避免使用 `class=beast`。`beast` 請求從 192 個 vCPU 起跳，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額限制的方式。此儲存庫擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域，以及 `capacity.hints: true`，因此代理的 AWS 租用會列印所選區域/市場、配額壓力、Spot 後援，以及高壓等級警告。較重的廣泛檢查請使用 `fast`；只有在 standard/fast 不足時才使用 `large`；`beast` 只用於例外的 CPU 密集型工作線，例如全套測試或所有 Plugin 的 Docker 矩陣、明確的發行/阻斷驗證，或高核心效能分析。不要將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint/typecheck、小型 E2E 重現，或 Blacksmith 中斷分流。容量診斷請使用 `--market on-demand`，讓 Spot 市場波動不會混入訊號。

`.crabbox.yaml` 負責自有雲端工作線的供應商、同步，以及 GitHub Actions 水合預設值。它會排除本機 `.git`，因此水合後的 Actions checkout 會保留自己的遠端 Git 中繼資料，而不是同步維護者本機的遠端與物件儲存區；它也會排除絕不應傳輸的本機執行階段/建置產物。`.github/workflows/crabbox-hydrate.yml` 負責自有雲端 `crabbox run --id <cbx_id>` 命令的 checkout、Node/pnpm 設定、`origin/main` 擷取，以及非機密環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
