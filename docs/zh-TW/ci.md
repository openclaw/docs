---
read_when:
    - 你需要了解 CI 工作為何執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 您正在協調一次發布驗證的執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括項目和本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-03T21:28:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個拉取請求時執行。`preflight` 工作會分類差異，並在只有不相關區域變更時關閉昂貴的執行路徑。手動 `workflow_dispatch` 執行會刻意略過智慧範圍判定，並展開完整圖形，用於發布候選版本與廣泛驗證。Android 路徑透過 `include_android` 維持選擇加入。僅發布使用的 Plugin 涵蓋範圍位於獨立的 [`Plugin 預發布`](#plugin-prerelease) 工作流程中，且只會從 [`完整發布驗證`](#full-release-validation) 或明確的手動分派執行。

## 管線概觀

| 工作                             | 用途                                                                                                      | 執行時機                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、變更範圍、變更的擴充功能，並建置 CI 清單                                                 | 一律在非草稿推送與 PR 上執行       |
| `security-scm-fast`              | 透過 `zizmor` 進行私密金鑰偵測與工作流程稽核                                                              | 一律在非草稿推送與 PR 上執行       |
| `security-dependency-audit`      | 針對 npm 公告進行無相依性的生產 lockfile 稽核                                                             | 一律在非草稿推送與 PR 上執行       |
| `security-fast`                  | 快速安全工作的必要彙總                                                                                    | 一律在非草稿推送與 PR 上執行       |
| `check-dependencies`             | 生產 Knip 僅相依性檢查，加上未使用檔案允許清單防護                                                       | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置成品檢查，以及可重用的下游成品                                           | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性路徑，例如 bundled/Plugin 合約/protocol 檢查                                             | Node 相關變更                      |
| `checks-fast-contracts-channels` | 使用穩定彙總檢查結果的分片 channel 合約檢查                                                              | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，不包含 channel、bundled、contract 和 extension 路徑                                  | Node 相關變更                      |
| `check`                          | 分片主要本機閘門等價項：生產型別、lint、防護、測試型別，以及嚴格 smoke                                  | Node 相關變更                      |
| `check-additional`               | 架構、分片 boundary/prompt drift、extension 防護、套件 boundary，以及 Gateway watch                      | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI smoke 測試與啟動記憶體 smoke                                                                   | Node 相關變更                      |
| `checks`                         | 已建置成品 channel 測試的驗證器                                                                           | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 路徑                                                                           | 發布用手動 CI 分派                 |
| `check-docs`                     | 文件格式化、lint 與失效連結檢查                                                                           | 文件已變更                         |
| `skills-python`                  | Python 支援 Skills 的 Ruff + pytest                                                                       | Python Skills 相關變更             |
| `checks-windows`                 | Windows 特定 process/path 測試，加上共用 runtime import specifier 迴歸                                   | Windows 相關變更                   |
| `macos-node`                     | 使用共用已建置成品的 macOS TypeScript 測試路徑                                                           | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、建置與測試                                                                       | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                                 | Android 相關變更                   |
| `test-performance-agent`         | 受信任活動後的每日 Codex 慢速測試最佳化                                                                  | Main CI 成功或手動分派             |
| `openclaw-performance`           | 每日/隨選 Kova runtime 效能報告，包含 mock-provider、deep-profile 與 GPT 5.4 live 路徑                   | 排程與手動分派                     |

## 快速失敗順序

1. `preflight` 決定哪些路徑會存在。`docs-scope` 與 `changed-scope` 邏輯是此工作內的步驟，而不是獨立工作。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 會快速失敗，而不等待較重的成品與平台矩陣工作。
3. `build-artifacts` 會與快速 Linux 路徑重疊，因此下游消費者可在共用建置就緒後立即開始。
4. 較重的平台與 runtime 路徑會在之後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

當同一個 PR 或 `main` ref 上有較新的推送落地時，GitHub 可能會將已被取代的工作標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則應將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此仍會回報正常的分片失敗，但不會在整個工作流程已被取代後繼續排隊。自動 CI 並行 key 已版本化為 (`CI-v7-*`)，因此 GitHub 端舊佇列群組中的殭屍工作無法無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動分派會略過變更範圍偵測，並讓 preflight 清單表現得像每個 scoped 區域都已變更。

- **CI 工作流程編輯**會驗證 Node CI 圖形加上工作流程 linting，但本身不會強制 Windows、Android 或 macOS native 建置；這些平台路徑仍會限定在平台原始碼變更。
- **僅 CI 路由編輯、選定的便宜 core-test fixture 編輯，以及狹窄的 Plugin 合約 helper/test-routing 編輯**會使用快速 Node-only 清單路徑：`preflight`、security，以及單一 `checks-fast-core` 工作。當變更僅限於快速工作直接執行的路由或 helper 表面時，該路徑會略過建置成品、Node 22 相容性、channel 合約、完整 core 分片、bundled-plugin 分片，以及額外防護矩陣。
- **Windows Node 檢查**限定於 Windows 特定 process/path wrapper、npm/pnpm/UI runner helper、套件管理器設定，以及執行該路徑的 CI 工作流程表面；不相關的原始碼、Plugin、install-smoke 與僅測試變更會留在 Linux Node 路徑。

最慢的 Node 測試族群會被拆分或平衡，讓每個工作保持小型且不過度保留 runner：channel 合約以三個加權分片執行，core unit fast/support 路徑分開執行，core runtime infra 拆分為 state 與 process/config 分片，auto-reply 以平衡 worker 執行（reply 子樹拆分為 agent-runner、dispatch 與 commands/state-routing 分片），而 agentic gateway/server config 則拆分到 chat/auth/model/http-plugin/runtime/startup 路徑，而不是等待已建置成品。廣泛的 browser、QA、media 與雜項 Plugin 測試使用各自專用的 Vitest config，而不是共用的 Plugin catch-all。Include-pattern 分片會使用 CI 分片名稱記錄計時項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 與經篩選的分片。`check-additional` 會將 package-boundary compile/canary 工作放在一起，並將 runtime topology architecture 與 gateway watch 覆蓋範圍分開；boundary 防護清單會條帶化到四個矩陣分片，每個分片並行執行選定的獨立防護並列印每項檢查的計時，包括 `pnpm prompt:snapshots:check`，因此 Codex runtime happy-path prompt drift 會固定到造成它的 PR。Gateway watch、channel 測試與 core support-boundary 分片會在 `dist/` 和 `dist-runtime/` 已建置後，於 `build-artifacts` 內並行執行。

Android CI 會同時執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。第三方 flavor 沒有獨立的 source set 或 manifest；其單元測試路徑仍會使用 SMS/call-log BuildConfig flag 編譯該 flavor，同時避免在每次 Android 相關推送中重複執行 debug APK 封裝工作。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（生產 Knip 僅相依性檢查，固定到最新 Knip 版本，且為 `dlx` 安裝停用 pnpm 的最低發布年齡）與 `pnpm deadcode:unused-files`，後者會將 Knip 的生產未使用檔案發現結果與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的未使用檔案，或留下過時的允許清單項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的刻意動態 Plugin、產生檔案、建置、live-test 與 package bridge 表面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是將 OpenClaw 儲存庫活動橋接到 ClawSweeper 的目標端橋接器。它不會 checkout 或執行不受信任的拉取請求程式碼。該工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload 分派到 `openclaw/clawsweeper`。

此工作流程有四個路徑：

- `clawsweeper_item` 用於精確的 issue 與拉取請求 review 請求；
- `clawsweeper_comment` 用於 issue comment 中明確的 ClawSweeper 指令；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit 層級 review 請求；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub 活動。

`github_activity` 路徑只會轉送正規化 metadata：event type、action、actor、repository、item number、URL、title、state，以及存在 comment 或 review 時的短摘錄。它刻意避免轉送完整 Webhook body。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，它會將正規化事件發佈到 ClawSweeper agent 的 OpenClaw Gateway hook。

一般活動是觀察，而不是預設交付。ClawSweeper agent 會在其 prompt 中收到 Discord 目標，且應只在事件令人意外、可採取行動、有風險或具操作實用性時，才發佈到 `#clawsweeper`。例行開啟、編輯、bot 擾動、重複 Webhook 雜訊與正常 review 流量應產生 `NO_REPLY`。

在整條路徑中，請將 GitHub title、comment、body、review text、branch name 與 commit message 視為不受信任的資料。它們是摘要與分流的輸入，而不是工作流程或 agent runtime 的指令。

## 手動分派

Manual CI 分派會執行與一般 CI 相同的工作圖，但會強制啟用每個非 Android 範圍的 lane：Linux Node 分片、內建 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python Skills、Windows、macOS，以及 Control UI i18n。獨立的 Manual CI 分派只會在 `include_android=true` 時執行 Android；完整 release umbrella 會透過傳入 `include_android=true` 啟用 Android。Plugin 預發佈靜態檢查、僅限 release 的 `agentic-plugins` 分片、完整 extension 批次掃描，以及 Plugin 預發佈 Docker lane 都排除在 CI 之外。Docker 預發佈套件只會在 `Full Release Validation` 以啟用 release-validation gate 的方式分派獨立的 `Plugin Prerelease` 工作流程時執行。

手動執行會使用唯一的 concurrency group，因此 release-candidate 完整套件不會被同一個 ref 上的另一個 push 或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫端，使用所選分派 ref 的工作流程檔案，針對分支、標籤或完整 commit SHA 執行該圖。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                           | 工作                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性工作與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速協定/合約/內建檢查、分片通道合約檢查、除了 lint 以外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 代管的 Ubuntu，讓 Blacksmith 矩陣可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低權重的 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`，以及 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、內建 Plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 足夠敏感，8 vCPU 的成本高於節省的時間）；install-smoke Docker 建置（32-vCPU 排隊時間的成本高於節省的時間）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本機對等指令

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

## OpenClaw 效能

`OpenClaw Performance` 是產品/runtime 效能工作流程。它每天在 `main` 上執行，也可以手動分派：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動分派通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對 release 標籤或另一個分支進行基準測試。已發佈的報告路徑和 latest pointer 會依測試的 ref 建立索引，而每個 `index.md` 都會記錄測試的 ref/SHA、工作流程 ref/SHA、Kova ref、profile、lane auth mode、model、repeat count，以及 scenario filters。

工作流程會從固定的 release 安裝 OCM，並從 `openclaw/Kova` 以固定的 `kova_ref` 輸入安裝 Kova，然後執行三個 lane：

- `mock-provider`：Kova diagnostic scenarios，針對本機建置的 runtime，使用 deterministic fake OpenAI-compatible auth。
- `mock-deep-profile`：針對啟動、Gateway 和 agent-turn 熱點的 CPU/heap/trace profiling。
- `live-gpt54`：真正的 OpenAI `openai/gpt-5.4` agent turn，會在 `OPENAI_API_KEY` 不可用時跳過。

mock-provider lane 也會在 Kova 通過後執行 OpenClaw 原生原始碼探測：default、hook 和 50-Plugin 啟動情境的 Gateway 開機時間與記憶體；重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈；以及針對已啟動 Gateway 的 CLI 啟動指令。原始碼探測 Markdown 摘要位於報告 bundle 的 `source/index.md`，旁邊附有原始 JSON。

每個 lane 都會上傳 GitHub artifacts。設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、bundles、`index.md` 和 source-probe artifacts 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 下。目前測試 ref 的 pointer 會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整 release 驗證

`Full Release Validation` 是用於「release 前執行所有項目」的手動 umbrella 工作流程。它接受分支、標籤或完整 commit SHA，分派 manual `CI` 工作流程並使用該目標，分派 `Plugin Prerelease` 以取得僅限 release 的 Plugin/package/static/Docker 證明，並分派 `OpenClaw Release Checks` 以進行 install smoke、package acceptance、Docker release-path 套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram lane。使用 `rerun_group=all` 與 `release_profile=full` 時，它也會針對 release checks 的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發佈後，傳入 `npm_telegram_package_spec` 可針對已發佈的 npm package 重新執行相同的 Telegram package lane。

請參閱[完整 release 驗證](/zh-TW/reference/full-release-validation)，了解
stage matrix、確切的工作流程工作名稱、profile 差異、artifacts，以及
focused rerun handles。

`OpenClaw Release Publish` 是會進行變更的手動 release 工作流程。在 release 標籤存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.D` 或 `main` 分派它。它會驗證 `pnpm plugins:sync:check`，針對所有可發佈的 Plugin packages 分派 `Plugin NPM Release`，針對相同 release SHA 分派 `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得固定 commit 證明，請使用 helper，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs 必須是分支或標籤，不能是原始 commit SHA。該
helper 會在目標 SHA 上推送暫時的 `release-ci/<sha>-...` 分支，
從該固定 ref 分派 `Full Release Validation`，驗證每個 child
workflow 的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。若任何 child workflow 在
不同 SHA 上執行，umbrella verifier 也會失敗。

`release_profile` 控制傳入發布檢查的即時/提供者廣度。手動發布工作流程預設為 `stable`；只有在你有意使用廣泛的 advisory 提供者/媒體矩陣時，才使用 `full`。

- `minimum` 保留最快的 OpenAI/核心發布關鍵路徑。
- `stable` 加入穩定的提供者/後端集合。
- `full` 執行廣泛的 advisory 提供者/媒體矩陣。

總括工作流程會記錄已派送的子執行 ID，而最終的 `Verify full validation` 作業會重新檢查目前的子執行結論，並為每個子執行附加最慢作業表。如果子工作流程重新執行後轉為綠燈，只需重新執行父層驗證作業，即可刷新總括結果與時間摘要。

復原時，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。發布候選版本使用 `all`，只針對一般完整 CI 子項使用 `ci`，只針對 Plugin 預發布子項使用 `plugin-prerelease`，針對每個發布子項使用 `release-checks`，或在總括工作流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能讓失敗的發布執行箱在聚焦修復後，將重新執行範圍保持在受控範圍內。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將所選 ref 解析一次為 `release-package-under-test` tarball，然後把該成品傳給即時/E2E 發布路徑 Docker 工作流程與套件接受測試分片。這會讓各個發布執行箱使用一致的套件位元組，並避免在多個子作業中重新封裝相同候選版本。

針對 `ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的總括執行。父層監控器會在父層被取消時，取消它已經派送的任何子工作流程，因此較新的 main 驗證不會卡在過時的兩小時發布檢查執行後面。發布分支/標籤驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## 即時與 E2E 分片

發布即時/E2E 子項保留廣泛的原生 `pnpm test:live` 覆蓋，但它會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是使用單一序列作業：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 提供者篩選的 `native-live-src-gateway-profiles` 作業
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒體音訊/影片分片，以及提供者篩選的音樂分片

這會保留相同的檔案覆蓋，同時讓緩慢的即時提供者失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生即時媒體分片會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像會預先安裝 `ffmpeg` 和 `ffprobe`；媒體作業只會在設定前驗證二進位檔。請將 Docker 支援的即時套件保留在一般 Blacksmith 執行器上，容器作業不適合啟動巢狀 Docker 測試。

Docker 支援的即時模型/後端分片會針對每個所選提交使用獨立共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發布工作流程會建置並推送該映像一次，然後 Docker 即時模型、提供者分片 Gateway、CLI 後端、ACP 繫結和 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片在指令碼層級帶有明確的 `timeout` 上限，低於工作流程作業逾時，因此卡住的容器或清理路徑會快速失敗，而不是耗完整個發布檢查預算。如果這些分片各自重新建置完整來源 Docker 目標，表示發布執行設定錯誤，並會把時間浪費在重複映像建置上。

## 套件接受測試

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證來源樹，而套件接受測試會透過使用者安裝或更新後會執行的相同 Docker E2E harness，驗證單一 tarball。

### 作業

1. `resolve_package` 會簽出 `workflow_ref`，解析一個套件候選版本，寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，寫入 `.artifacts/docker-e2e-package/package-candidate.json`，將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 和設定檔。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品，驗證 tarball 清單，在需要時準備套件摘要 Docker 映像，並針對該套件執行所選 Docker 路徑，而不是封裝工作流程簽出內容。當某個設定檔選取多個目標 `docker_lanes` 時，可重用工作流程會先準備套件和共享映像一次，然後將這些路徑展開為具有唯一成品的平行目標 Docker 作業。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行；如果 Package Acceptance 已解析套件，會安裝相同的 `package-under-test` 成品；獨立 Telegram 派送仍可安裝已發布的 npm 規格。
4. `summary` 會在套件解析、Docker 接受測試或可選 Telegram 路徑失敗時，讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。這用於已發布的預發布/穩定版接受測試。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤，驗證所選提交可從儲存庫分支歷史或發布標籤抵達，在分離的工作樹中安裝相依項，並用 `scripts/package-openclaw-for-docker.mjs` 封裝。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 是可選的，但外部共享成品應提供它。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是在 `source=ref` 時會被封裝的來源提交。這讓目前的測試 harness 能驗證較舊的受信任來源提交，而不需執行舊的工作流程邏輯。

### 套件設定檔

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 搭配 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` 設定檔使用離線 Plugin 覆蓋，因此已發布套件驗證不會受限於即時 ClawHub 可用性。可選 Telegram 路徑會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm 規格路徑供獨立派送使用。

關於專用的更新與 Plugin 測試政策，包括本機命令、Docker 路徑、Package Acceptance 輸入、發布預設值和失敗分診，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、準備好的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這會讓套件遷移、更新、過期 Plugin 相依項清理、已設定 Plugin 安裝修復、離線 Plugin、Plugin 更新與 Telegram 證明，都落在相同已解析的套件 tarball 上。設定 Full Release Validation 或 OpenClaw Release Checks 的 `package_acceptance_package_spec`，即可針對已發布的 npm 套件執行相同矩陣，而不是針對 SHA 建置的成品。跨 OS 發布檢查仍會涵蓋 OS 特定的 onboarding、安裝器和平台行為；套件/更新產品驗證應從 Package Acceptance 開始。`published-upgrade-survivor` Docker 路徑會在每次執行驗證一個已發布套件基準線。在 Package Acceptance 中，已解析的 `package-under-test` tarball 永遠是候選版本，而 `published_upgrade_survivor_baseline` 會選取後備已發布基準線，預設為 `openclaw@latest`；失敗路徑的重新執行命令會保留該基準線。設定 `published_upgrade_survivor_baselines=all-since-2026.4.23`，可將 Full Release CI 擴展到從 `2026.4.23` 到 `latest` 的每個穩定 npm 發布；`release-history` 仍可用於使用較舊日期前錨點的手動更廣泛抽樣。設定 `published_upgrade_survivor_scenarios=reported-issues`，可將相同基準線擴展到針對飛書設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、波浪號日誌路徑，以及過期舊版 Plugin 相依項根目錄的議題形狀 fixture。獨立的 `Update Migration` 工作流程會在問題是完整已發布更新清理，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker 路徑搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本機彙總執行可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件規格，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一路徑，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 來使用情境矩陣。已發布路徑會使用烘焙好的 `openclaw config set` 命令配方設定基準線，在 `summary.json` 中記錄配方步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 和 RPC 狀態。Windows 封裝版與安裝器全新路徑也會驗證已安裝套件能從原始絕對 Windows 路徑匯入瀏覽器控制覆寫。OpenAI 跨 OS agent-turn smoke 預設在有設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因此安裝與 Gateway 證明會停留在 GPT-5 測試模型，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

Package Acceptance 針對已發布套件具有有界的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可跳過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的假 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，並可記錄缺失的持久化 `update.channel`；
- Plugin smoke 可讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可允許設定中繼資料遷移，同時仍要求安裝記錄和不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可能對已出貨的本機建置中繼資料戳記檔發出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或跳過。

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

偵錯失敗的套件驗收執行時，請先查看 `resolve_package` 摘要，以確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道記錄、階段計時與重新執行命令。請優先重新執行失敗的套件設定檔或精確的 Docker 通道，而不是重新執行完整發布驗證。

## 安裝煙霧測試

獨立的 `Install Smoke` workflow 會透過自己的 `preflight` 作業重用相同的範圍腳本。它會將煙霧測試涵蓋範圍拆分為 `run_fast_install_smoke` 與 `run_full_install_smoke`。

- **快速路徑** 會針對觸及 Docker/套件介面、內建 Plugin 套件/資訊清單變更，或 Docker 煙霧測試作業會演練的核心 Plugin/通道/gateway/Plugin SDK 介面的 pull request 執行。僅限原始碼的內建 Plugin 變更、僅限測試的編輯，以及僅限文件的編輯不會保留 Docker workers。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行代理程式刪除共用工作區 CLI 煙霧測試、執行容器 gateway-network e2e、驗證內建擴充功能建置引數，並在 240 秒的彙總命令逾時內執行有界的內建 Plugin Docker 設定檔（每個情境的 Docker 執行會分別設上限）。
- **完整路徑** 會保留 QR 套件安裝與安裝程式 Docker/更新涵蓋範圍，用於每夜排程執行、手動分派、workflow-call 發布檢查，以及真正觸及安裝程式/套件/Docker 介面的 pull request。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 煙霧測試映像，然後將 QR 套件安裝、根 Dockerfile/gateway 煙霧測試、安裝程式/更新煙霧測試，以及快速內建 Plugin Docker E2E 作為個別作業執行，讓安裝程式工作不必等待根映像煙霧測試。

`main` 推送（包含合併提交）不會強制走完整路徑；當變更範圍邏輯會在推送時要求完整涵蓋範圍，workflow 會保留快速 Docker 煙霧測試，並將完整安裝煙霧測試留給每夜或發布驗證。

較慢的 Bun 全域安裝映像提供者煙霧測試會由 `run_bun_global_install_smoke` 另行控管。它會在每夜排程與發布檢查 workflow 中執行，手動 `Install Smoke` 分派也可以選擇加入，但 pull request 與 `main` 推送不會執行。QR 與安裝程式 Docker 測試會保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用的 live-test 映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/更新/Plugin 相依性通道的裸 Node/Git 執行器；
- 將相同 tarball 安裝到 `/app`，供一般功能通道使用的功能性映像。

Docker 通道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，執行器只會執行選取的計畫。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 依通道選取映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行通道。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般通道的主集區插槽數。                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對提供者敏感的尾端集區插槽數。                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live 通道上限，避免提供者限流。                                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm 安裝通道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行多服務通道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道啟動間隔，用於避免 Docker daemon 建立風暴；設為 `0` 表示不交錯。                         |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每通道後備逾時（120 分鐘）；選取的 live/tail 通道會使用更嚴格的上限。                        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫而不執行通道。                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確通道清單；略過清理煙霧測試，讓代理程式能重現單一失敗通道。                  |

重於其有效上限的通道仍可從空集區啟動，然後會單獨執行直到釋放容量。本機彙總會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、輸出使用中通道狀態、保存通道計時以供最長優先排序，並且預設在第一次失敗後停止排程新的集區通道。

### 可重用 live/E2E workflow

可重用的 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些套件、映像種類、live 映像、通道與認證涵蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball 清單；在計畫需要已安裝套件的通道時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件摘要標記的裸/功能性 GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或既有的套件摘要映像，而不是重新建置。Docker 映像拉取會以每次嘗試 180 秒的有界逾時重新嘗試，因此卡住的 registry/cache 串流會快速重試，而不是耗掉大部分 CI 關鍵路徑。

### 發布路徑區塊

發布 Docker 涵蓋範圍會以較小的分塊作業執行，並設定 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個區塊只拉取所需的映像種類，並透過相同的加權排程器執行多個通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發布 Docker 區塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍為彙總 Plugin/runtime 別名。`install-e2e` 通道別名仍為兩個提供者安裝程式通道的彙總手動重新執行別名。

當完整發布路徑涵蓋範圍要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，並且只在僅限 OpenWebUI 的分派中保留獨立的 `openwebui` 區塊。內建通道更新通道會針對暫時性 npm 網路失敗重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含通道記錄、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢通道表格，以及每通道重新執行命令。workflow 的 `docker_lanes` 輸入會針對已準備的映像執行選取的通道，而不是區塊作業，這會將失敗通道偵錯限制在一個目標 Docker 作業內，並為該次執行準備、下載或重用套件成品；如果選取的通道是 live Docker 通道，目標作業會為該次重新執行在本機建置 live-test 映像。產生的每通道 GitHub 重新執行命令會在值存在時包含 `package_artifact_run_id`、`package_artifact_name` 與已準備的映像輸入，因此失敗通道可以重用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E workflow 會每日執行完整發布路徑 Docker 套件。

## Plugin 預發布

`Plugin Prerelease` 是成本較高的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確的操作員分派的獨立 workflow。一般 pull request、`main` 推送與獨立手動 CI 分派會關閉該套件。它會在八個擴充功能 workers 之間平衡內建 Plugin 測試；這些擴充功能分片作業每次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest worker 與較大的 Node heap，讓匯入繁重的 Plugin 批次不會建立額外 CI 作業。僅限發布的 Docker 預發布路徑會以小群組批次執行目標 Docker 通道，避免為一到三分鐘的作業保留數十個執行器。

## QA Lab

QA Lab 有位於主要智慧範圍 workflow 之外的專用 CI 通道。Agentic parity 巢狀位於廣泛 QA 與發布測試工具之下，而不是獨立的 PR workflow。當 parity 應隨廣泛驗證執行一起進行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 會在 `main` 上每夜執行並可手動分派；它會將 mock parity 通道、live Matrix 通道，以及 live Telegram 與 Discord 通道展開為平行作業。Live 作業使用 `qa-live-shared` environment，Telegram/Discord 使用 Convex leases。

發布檢查會以確定性的 mock 提供者與 mock 限定模型（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport 通道，讓通道合約與 live 模型延遲及一般提供者 Plugin 啟動隔離。live transport gateway 會停用記憶體搜尋，因為 QA parity 會另外涵蓋記憶體行為；提供者連線能力由獨立的 live 模型、原生提供者與 Docker 提供者套件涵蓋。

Matrix 會在排程與發布 gates 中使用 `--profile fast`，且只有在簽出的 CLI 支援時才加入 `--fail-fast`。CLI 預設值與手動 workflow 輸入仍為 `all`；手動 `matrix_profile=all` 分派一律會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發布核准前執行發布關鍵的 QA Lab 通道；其 QA parity gate 會將候選與基準 packs 作為平行通道作業執行，接著將兩者成品下載到小型報告作業中，以進行最終 parity 比較。

對於一般 PR，請依循範圍化 CI/檢查證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意作為範圍狹窄的第一輪安全掃描器，而不是完整的儲存庫掃描。每日、手動和非草稿 pull request 防護執行會掃描 Actions 工作流程程式碼，以及最高風險的 JavaScript/TypeScript 表面，並使用高信賴度安全查詢篩選高/重大 `security-severity`。

pull request 防護保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下有變更時啟動，並執行與排程工作流程相同的高信賴度安全矩陣。Android 和 macOS CodeQL 不包含在 PR 預設值中。

### 安全類別

| 類別                                          | 表面                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、機密、沙箱、Cron 和 Gateway 基準                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，加上通道 Plugin 執行階段、Gateway、Plugin SDK、機密、稽核接觸點              |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 剖析、網路防護、web-fetch，以及 Plugin SDK SSRF 政策表面                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞，以及代理工具執行閘門                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、載入器、資訊清單、登錄、套件管理器安裝、來源載入，以及 Plugin SDK 套件合約信任表面 |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。會在工作流程健全性接受的最小 Blacksmith Linux 執行器上，為 CodeQL 手動建置 Android 應用程式。上傳至 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全分片。會在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式，從上傳的 SARIF 中篩除相依項建置結果，並上傳至 `/codeql-critical-security/macos` 底下。由於 macOS 建置即使乾淨時也會主導執行時間，因此保留在每日預設值之外。

### 重大品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在較小的 Blacksmith Linux 執行器上，針對狹窄的高價值表面執行錯誤嚴重性、非安全的 JavaScript/TypeScript 品質查詢。它的 pull request 防護刻意小於排程設定檔：非草稿 PR 只有在代理命令/模型/工具執行與回覆分派程式碼、設定架構/遷移/IO 程式碼、驗證/機密/沙箱/安全程式碼、核心通道與內建通道 Plugin 執行階段、Gateway 協定/server-method、記憶體執行階段/SDK 黏合、MCP/程序/對外傳遞、供應商執行階段/模型目錄、工作階段診斷/傳遞佇列、Plugin 載入器、Plugin SDK/套件合約，或 Plugin SDK 回覆執行階段有變更時，才會執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動分派接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是教學/迭代掛鉤，用來單獨執行一個品質分片。

| 類別                                                | 表面                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、機密、沙箱、Cron 和 Gateway 安全邊界程式碼                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定架構、遷移、正規化和 IO 合約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 協定架構和伺服器方法合約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與內建通道 Plugin 實作合約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/供應商分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及對外傳遞合約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段外觀、記憶體 Plugin SDK 別名、記憶體執行階段啟用黏合，以及記憶體 doctor 命令                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞輔助工具、診斷事件/記錄套件表面，以及工作階段 doctor CLI 合約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆分派、回覆承載/chunking/執行階段輔助工具、通道回覆選項、傳遞佇列，以及工作階段/執行緒繫結輔助工具             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、供應商驗證與探索、供應商執行階段註冊、供應商預設值/目錄，以及 web/search/fetch/embedding 登錄    |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、Gateway 控制流程，以及任務控制平面執行階段合約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公開表面，以及 Plugin SDK 進入點合約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 來源與 Plugin 套件合約輔助工具                                                                                      |

品質與安全保持分離，讓品質發現可以被排程、衡量、停用或擴充，而不會模糊安全訊號。Swift、Python 和內建 Plugin CodeQL 擴充，應該只在狹窄設定檔具有穩定執行時間與訊號後，才作為具範圍或分片的後續工作加回來。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非機器人 push CI 執行可以觸發它，手動分派也可以直接執行它。當 `main` 已經前進，或過去一小時內已建立另一個未略過的 Docs Agent 執行時，workflow-run 呼叫會略過。執行時，它會審閱從上一個未略過 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件處理以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於處理緩慢測試。它沒有純排程：`main` 上成功的非機器人 push CI 執行可以觸發它，但如果當 UTC 日已有另一個 workflow-run 呼叫已執行或正在執行，則會略過。手動分派會略過該每日活動閘門。此路徑會建置完整套件分組 Vitest 效能報告，讓 Codex 只進行保留覆蓋率的小型測試效能修正，而不是廣泛重構，然後重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，而代理之後的完整套件報告必須通過，才能提交任何內容。當機器人 push 落地前 `main` 前進時，此路徑會 rebase 已驗證的修補、重新執行 `pnpm check:changed`，並重試 push；衝突的過期修補會被略過。它使用 GitHub 託管的 Ubuntu，讓 Codex action 可以維持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是手動維護者工作流程，用於落地後的重複清理。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在修改 GitHub 之前，它會驗證落地 PR 已合併，且每個重複項目都有共用的參照 issue 或重疊的變更區塊。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門在架構邊界方面比廣泛的 CI 平台範圍更嚴格：

- 核心正式程式碼變更會執行核心正式程式碼與核心測試 typecheck，加上核心 lint/guards；
- 只有核心測試的變更只會執行核心測試 typecheck，加上核心 lint；
- 擴充功能正式程式碼變更會執行擴充功能正式程式碼與擴充功能測試 typecheck，加上擴充功能 lint；
- 只有擴充功能測試的變更會執行擴充功能測試 typecheck，加上擴充功能 lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴大到擴充功能 typecheck，因為擴充功能依賴這些核心合約（Vitest 擴充功能掃描仍然是明確的測試工作）；
- 只有發布中繼資料的版本升級會執行目標版本/設定/root-dependency 檢查；
- 未知 root/設定變更會以故障安全方式進入所有檢查路徑。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，來源編輯優先使用明確對應，接著是同層測試與 import-graph 相依項。共用 group-room 傳遞設定是其中一個明確對應：群組可見回覆設定、來源回覆傳遞模式，或 message-tool 系統提示的變更，會透過核心回覆測試加上 Discord 與 Slack 傳遞迴歸測試，因此共用預設變更會在第一次 PR push 之前失敗。只有當變更的範圍大到測試框架層級，使廉價對應集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從存放庫根目錄執行 Testbox，並且在需要廣泛證明時優先使用剛暖機完成的新 box。在把緩慢的驗證關卡花在已重複使用、已過期，或剛回報同步量異常龐大的 box 之前，請先在該 box 內執行 `pnpm testbox:sanity`。

當必要的根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤檔案被刪除時，完整性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；請停止該 box 並改為暖機一個新的 box，而不是偵錯產品測試失敗。對於刻意大量刪除的 PR，請為該次完整性檢查設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該保護機制，或針對異常龐大的本機差異使用較大的毫秒值。

當 Blacksmith 無法使用，或偏好使用自有雲端容量時，Crabbox 是存放庫擁有的第二條遠端 box Linux 證明路徑。暖機一個 box，透過專案工作流程補齊內容，然後透過 Crabbox CLI 執行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 負責提供者、同步與 GitHub Actions 補齊內容的預設值。它會排除本機 `.git`，讓已補齊內容的 Actions checkout 保留自己的遠端 Git 中繼資料，而不是同步維護者本機的遠端與物件存放區；它也會排除絕不應傳輸的本機執行階段／建置成品。`.github/workflows/crabbox-hydrate.yml` 負責 checkout、Node/pnpm 設定、`origin/main` 擷取，以及非秘密環境交接，供後續 `crabbox run --id <cbx_id>` 命令載入來源。

## 相關

- [安裝概觀](/zh-TW/install)
- [開發頻道](/zh-TW/install/development-channels)
