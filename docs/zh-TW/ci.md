---
read_when:
    - 你需要了解 CI 作業為何有執行或未執行
    - 你正在偵錯一個失敗的 GitHub Actions 檢查
    - 您正在協調一次發行驗證執行或重新執行
    - 你正在變更 ClawSweeper 派送或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括及本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-02T20:43:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw 持續整合會在每次推送到 `main` 以及每個拉取請求時執行。`preflight` 作業會分類差異，並在只有不相關區域變更時關閉高成本的路徑。手動 `workflow_dispatch` 執行會刻意略過智慧範圍判定，並展開完整圖形，用於發布候選版本與廣泛驗證。Android 路徑透過 `include_android` 維持選擇性啟用。僅限發布的 Plugin 覆蓋範圍位於獨立的 [`Plugin 預發布`](#plugin-prerelease) 工作流程中，且只會從 [`完整發布驗證`](#full-release-validation) 或明確的手動分派執行。

## 管線概覽

| 作業                             | 目的                                                                                                      | 執行時機                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、變更範圍、變更的擴充功能，並建置持續整合資訊清單                                        | 一律在非草稿推送和拉取請求上執行 |
| `security-scm-fast`              | 透過 `zizmor` 偵測私鑰並稽核工作流程                                                                     | 一律在非草稿推送和拉取請求上執行 |
| `security-dependency-audit`      | 針對 npm 安全公告執行不需相依套件的生產鎖定檔稽核                                                       | 一律在非草稿推送和拉取請求上執行 |
| `security-fast`                  | 快速安全性作業的必要彙總                                                                                  | 一律在非草稿推送和拉取請求上執行 |
| `check-dependencies`             | 生產 Knip 僅相依套件檢查，加上未使用檔案允許清單防護                                                     | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置產物檢查，以及可重複使用的下游產物                                       | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性路徑，例如 bundled／plugin-contract／protocol 檢查                                      | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的頻道合約檢查，具有穩定的彙總檢查結果                                                              | Node 相關變更                      |
| `checks-node-core-test`          | 核心 Node 測試分片，不含頻道、bundled、合約和擴充功能路徑                                                | Node 相關變更                      |
| `check`                          | 分片的主要本機閘門等效項：生產型別、lint、防護、測試型別，以及嚴格 smoke                                 | Node 相關變更                      |
| `check-additional`               | 架構、邊界、擴充功能表面防護、套件邊界，以及 gateway-watch 分片                                          | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI smoke 測試與啟動記憶體 smoke                                                                  | Node 相關變更                      |
| `checks`                         | 已建置產物頻道測試的驗證器                                                                               | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 路徑                                                                          | 發布用手動持續整合分派             |
| `check-docs`                     | 文件格式、lint 和損壞連結檢查                                                                            | 文件已變更                         |
| `skills-python`                  | Python 支援的 Skills 的 Ruff + pytest                                                                    | Python Skill 相關變更              |
| `checks-windows`                 | Windows 專用程序／路徑測試，加上共用執行階段匯入指定詞回歸                                              | Windows 相關變更                   |
| `macos-node`                     | 使用共用已建置產物的 macOS TypeScript 測試路徑                                                           | macOS 相關變更                     |
| `macos-swift`                    | macOS 應用程式的 Swift lint、建置與測試                                                                  | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                                 | Android 相關變更                   |
| `test-performance-agent`         | 可信活動後的每日 Codex 慢速測試最佳化                                                                    | 主要持續整合成功或手動分派         |
| `openclaw-performance`           | 每日／隨選 Kova 執行階段效能報告，含 mock-provider、deep-profile 和 GPT 5.4 live 路徑                    | 排程與手動分派                     |

## 快速失敗順序

1. `preflight` 決定哪些路徑實際存在。`docs-scope` 和 `changed-scope` 邏輯是此作業內的步驟，不是獨立作業。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 會快速失敗，不等待較重的產物與平台矩陣作業。
3. `build-artifacts` 會與快速 Linux 路徑重疊，讓下游消費者能在共用建置準備好後立即開始。
4. 較重的平台與執行階段路徑之後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

當較新的推送落在同一個拉取請求或 `main` 參照上時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非同一參照的最新執行也失敗，否則請將其視為持續整合雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此仍會回報一般分片失敗，但在整個工作流程已被取代後不會繼續排隊。自動持續整合並行鍵有版本標記（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍項目無法無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動分派會略過變更範圍偵測，並讓 preflight 資訊清單表現得像每個有範圍的區域都已變更。

- **持續整合工作流程編輯** 會驗證 Node 持續整合圖形與工作流程 linting，但不會自行強制 Windows、Android 或 macOS 原生建置；那些平台路徑仍然限定於平台原始碼變更。
- **僅持續整合路由的編輯、選定的低成本核心測試 fixture 編輯，以及狹窄的 Plugin 合約輔助程式／測試路由編輯** 使用快速的僅 Node 資訊清單路徑：`preflight`、安全性，以及單一 `checks-fast-core` 工作。當變更僅限於快速工作直接測試的路由或輔助表面時，該路徑會略過建置產物、Node 22 相容性、頻道合約、完整核心分片、bundled-plugin 分片，以及額外防護矩陣。
- **Windows Node 檢查** 限定於 Windows 專用程序／路徑包裝器、npm／pnpm／UI 執行器輔助程式、套件管理器設定，以及執行該路徑的持續整合工作流程表面；不相關的原始碼、Plugin、install-smoke 和僅測試變更會留在 Linux Node 路徑上。

最慢的 Node 測試家族會被拆分或平衡，讓每個作業保持小型且不過度保留執行器：頻道合約以三個加權分片執行，小型核心單元路徑會配對，auto-reply 以四個平衡 worker 執行（reply 子樹拆分為 agent-runner、dispatch 和 commands/state-routing 分片），而 agentic Gateway／Plugin 設定會分散在現有僅原始碼的 agentic Node 作業中，而不是等待已建置產物。廣泛的瀏覽器、QA、媒體和其他 Plugin 測試會使用其專用 Vitest 設定，而非共用 Plugin catch-all。包含模式分片會使用持續整合分片名稱記錄時間項目，因此 `.artifacts/vitest-shard-timings.json` 能區分整個設定與經篩選的分片。`check-additional` 將套件邊界編譯／canary 工作放在一起，並將執行階段拓撲架構與 Gateway watch 覆蓋範圍分開；邊界防護分片會在單一作業內並行執行其小型獨立防護。Gateway watch、頻道測試和核心支援邊界分片會在 `dist/` 與 `dist-runtime/` 已建置完成後，於 `build-artifacts` 內並行執行。

Android 持續整合會執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，接著建置 Play debug APK。第三方 flavor 沒有獨立的 source set 或 manifest；其單元測試路徑仍會使用 SMS／call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送時產生重複的 debug APK 封裝作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（釘選至最新 Knip 版本的生產 Knip 僅相依套件檢查，並在 `dlx` 安裝時停用 pnpm 的最低發布年齡限制）和 `pnpm deadcode:unused-files`，後者會將 Knip 的生產未使用檔案發現與 `scripts/deadcode-unused-files.allowlist.mjs` 比較。當拉取請求新增未經審查的未使用檔案，或留下過期的允許清單項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的刻意動態 Plugin、生成、建置、live-test 和套件橋接表面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會簽出或執行不受信任的拉取請求程式碼。該工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload 分派到 `openclaw/clawsweeper`。

該工作流程有四個路徑：

- `clawsweeper_item` 用於精確的 issue 與拉取請求審查請求；
- `clawsweeper_comment` 用於 issue 留言中的明確 ClawSweeper 指令；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit 層級審查請求；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub 活動。

`github_activity` 路徑只會轉送正規化後的中繼資料：事件類型、動作、actor、儲存庫、項目編號、URL、標題、狀態，以及在存在時提供留言或審查的短摘錄。它刻意避免轉送完整 Webhook 內文。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，它會將正規化事件發布到 OpenClaw Gateway hook，供 ClawSweeper agent 使用。

一般活動是觀察，不是預設交付。ClawSweeper agent 會在其提示中收到 Discord 目標，且只有在事件令人意外、可採取行動、有風險或具操作實用性時，才應發布到 `#clawsweeper`。例行開啟、編輯、bot 變動、重複 Webhook 雜訊和一般審查流量應產生 `NO_REPLY`。

在整個路徑中，將 GitHub 標題、留言、內文、審查文字、分支名稱和 commit 訊息視為不受信任的資料。它們是摘要與分流的輸入，不是工作流程或 agent 執行階段的指令。

## 手動分派

手動 CI 分派會執行與一般 CI 相同的作業圖，但會強制啟用每個非 Android 範圍的通道：Linux Node 分片、隨附 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python Skills、Windows、macOS，以及控制 UI i18n。獨立的手動 CI 分派只會在 `include_android=true` 時執行 Android；完整發布總傘流程會透過傳入 `include_android=true` 啟用 Android。Plugin 預發布靜態檢查、僅發布使用的 `agentic-plugins` 分片、完整延伸套件批次掃描，以及 Plugin 預發布 Docker 通道會從 CI 中排除。Docker 預發布套件只會在 `Full Release Validation` 分派獨立的 `Plugin Prerelease` 工作流程且啟用發布驗證閘門時執行。

手動執行會使用唯一的並行群組，因此發布候選版本的完整套件不會被同一 ref 上的另一個 push 或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫端在使用所選分派 ref 中的工作流程檔案時，針對分支、標籤或完整 commit SHA 執行該作業圖。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                           | 作業                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性作業與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速協定／合約／隨附檢查、分片通道合約檢查、除 lint 外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python Skills、工作流程健全性、標籤器、自動回應；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith 矩陣能更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低權重的延伸套件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`，以及 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、隨附 Plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 夠敏感，因此 8 vCPU 節省的成本不如額外耗費）；install-smoke Docker 建置（32-vCPU 排隊時間成本不如節省的時間）                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` 是產品／執行階段效能工作流程。它每天在 `main` 上執行，也可以手動分派：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

工作流程會從釘選的發布版本安裝 OCM，並從釘選的 `kova_ref` 輸入安裝 Kova，接著執行三個通道：

- `mock-provider`：Kova 診斷情境，針對具備確定性假 OpenAI 相容驗證的本機建置執行階段執行。
- `mock-deep-profile`：針對啟動、Gateway 和 agent-turn 熱點進行 CPU／heap／trace 分析。
- `live-gpt54`：真實的 OpenAI `openai/gpt-5.4` agent turn；當 `OPENAI_API_KEY` 無法使用時會略過。

mock-provider 通道也會在 Kova 通過後執行 OpenClaw 原生來源探測：預設、hook 和 50-Plugin 啟動案例中的 Gateway 開機計時與記憶體；重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈；以及針對已啟動 Gateway 的 CLI 啟動指令。來源探測 Markdown 摘要位於報告套件中的 `source/index.md`，旁邊有原始 JSON。

每個通道都會上傳 GitHub 成品。設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、套件、`index.md` 和來源探測成品提交到 `openclaw/clawgrit-reports`，路徑為 `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`。目前分支指標會寫入 `openclaw-performance/<ref>/latest-<lane>.json`。

## 完整發布驗證

`Full Release Validation` 是用於「在發布前執行所有項目」的手動總傘工作流程。它接受分支、標籤或完整 commit SHA，使用該目標分派手動 `CI` 工作流程，分派 `Plugin Prerelease` 以取得僅發布使用的 Plugin／套件／靜態／Docker 證明，並分派 `OpenClaw Release Checks` 以進行安裝煙霧測試、套件接受度、Docker 發布路徑套件、live／E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。使用 `rerun_group=all` 與 `release_profile=full` 時，它也會針對來自發布檢查的 `release-package-under-test` 成品執行 `NPM Telegram Beta E2E`。發布後，傳入 `npm_telegram_package_spec`，即可針對已發布的 npm 套件重新執行同一個 Telegram 套件通道。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、精確工作流程作業名稱、設定檔差異、成品，以及聚焦重新執行控制代碼。

`OpenClaw Release Publish` 是會變更狀態的手動發布工作流程。請在發布標籤存在且 OpenClaw npm preflight 已成功之後，從 `release/YYYY.M.D` 或 `main` 分派它。它會驗證 `pnpm plugins:sync:check`、針對所有可發布的 Plugin 套件分派 `Plugin NPM Release`、針對同一發布 SHA 分派 `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速移動分支上取得釘選 commit 證明，請使用 helper，而不是使用 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程分派 ref 必須是分支或標籤，不能是原始 commit SHA。helper 會在目標 SHA 上推送暫時的 `release-ci/<sha>-...` 分支，從該釘選 ref 分派 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。如果任何子工作流程在不同 SHA 上執行，總傘驗證器也會失敗。

`release_profile` 控制傳入發布檢查的 live／provider 廣度。手動發布工作流程預設為 `stable`；只有在你刻意想要廣泛的 advisory provider／媒體矩陣時，才使用 `full`。

- `minimum` 保留最快的 OpenAI／核心發布關鍵通道。
- `stable` 加入穩定的 provider／後端集合。
- `full` 執行廣泛的 advisory provider／媒體矩陣。

總傘流程會記錄已分派的子執行 ID，最後的 `Verify full validation` 作業會重新檢查目前的子執行結論，並為每個子執行附加最慢作業表。如果子工作流程重新執行後轉為綠燈，只需重新執行父驗證器作業，即可重新整理總傘結果與計時摘要。

為了復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。在總控流程上，使用 `all` 表示發布候選版本，`ci` 表示僅一般完整 CI 子流程，`plugin-prerelease` 表示僅 Plugin 預發布子流程，`release-checks` 表示每個發布子流程，或使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會讓失敗的發布檢查機器在完成聚焦修正後，重新執行範圍維持受限。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將選取的 ref 解析一次為 `release-package-under-test` tarball，接著把該成品傳給 live/E2E 發布路徑 Docker 工作流程與套件驗收分片。這會讓各發布檢查機器之間的套件位元組保持一致，並避免在多個子工作中重新打包同一個候選版本。

當 `ref=main` 且 `rerun_group=all` 時，重複的 `Full Release Validation` 執行會取代較舊的總控流程。父監控器在父流程被取消時，會取消任何它已分派的子工作流程，因此較新的 main 驗證不會卡在過期的兩小時 release-check 執行後面。發布分支/標籤驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## Live 和 E2E 分片

發布 live/E2E 子流程保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是單一序列工作：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` 工作
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的媒體音訊/影片分片，以及 provider-filtered 音樂分片

這會維持相同的檔案涵蓋範圍，同時讓緩慢的 live provider 失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live 媒體分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像檔由 `Live Media Runner Image` 工作流程建置。該映像檔預先安裝 `ffmpeg` 和 `ffprobe`；媒體工作只會在設定前驗證這些二進位檔。請將 Docker 支援的 live 測試套件保留在一般 Blacksmith runner 上執行，container job 並不適合啟動巢狀 Docker 測試。

Docker 支援的 live 模型/backend 分片會針對每個選取的 commit 使用獨立共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔。live 發布工作流程會建置並推送該映像檔一次，接著 Docker live 模型、provider 分片 Gateway、CLI backend、ACP bind 和 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片帶有明確的腳本層級 `timeout` 上限，且低於工作流程 job timeout，因此卡住的容器或清理路徑會快速失敗，而不是耗完整個 release-check 預算。如果這些分片各自重新建置完整原始碼 Docker target，表示該發布執行設定錯誤，並會在重複映像檔建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證原始碼樹，而套件驗收會透過使用者在安裝或更新後操作的同一套 Docker E2E harness，驗證單一 tarball。

### 工作

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者上傳為 `package-under-test` 成品，並在 GitHub step summary 中印出來源、工作流程 ref、套件 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball inventory、在需要時準備 package-digest Docker 映像檔，並針對該套件執行選取的 Docker lane，而不是打包工作流程 checkout。當 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件和共用映像檔一次，接著將這些 lane 展開成具有唯一成品的平行目標 Docker 工作。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。它會在 `telegram_mode` 不是 `none` 時執行，且當 Package Acceptance 解析出套件時，會安裝同一個 `package-under-test` 成品；獨立 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker 驗收或選用 Telegram lane 失敗時讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@alpha`、`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。將此用於已發布的預發布/穩定版驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整 commit SHA。解析器會 fetch OpenClaw 分支/標籤、驗證選取的 commit 可從儲存庫分支歷史或發布標籤到達、在 detached worktree 中安裝 deps，並用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 是選用項目，但外部共享的成品應提供它。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是在 `source=ref` 時被打包的來源 commit。這讓目前的測試 harness 能驗證較舊的受信任來源 commit，而不執行舊的工作流程邏輯。

### 測試套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` profile 使用離線 Plugin 涵蓋範圍，因此已發布套件驗證不會受限於 live ClawHub 可用性。選用的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，而已發布 npm spec 路徑則保留給獨立 dispatch。

如需專用的更新與 Plugin 測試政策，包括本機命令、Docker lane、Package Acceptance 輸入、發布預設值與失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發布檢查會使用 `source=artifact`、準備好的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這會讓套件遷移、更新、過期 Plugin 相依項清理、已設定 Plugin 安裝修復、離線 Plugin、Plugin 更新與 Telegram 證明都在同一個已解析的套件 tarball 上進行。設定 Full Release Validation 或 OpenClaw Release Checks 上的 `package_acceptance_package_spec`，即可針對已發布的 npm 套件執行同一個矩陣，而不是針對以 SHA 建置的成品。跨 OS 發布檢查仍涵蓋 OS 特定的 onboarding、安裝程式與平台行為；套件/更新產品驗證應從 Package Acceptance 開始。`published-upgrade-survivor` Docker lane 每次執行會驗證一個已發布套件基準。在 Package Acceptance 中，解析出的 `package-under-test` tarball 永遠是候選，而 `published_upgrade_survivor_baseline` 會選取備援的已發布基準，預設為 `openclaw@latest`；失敗 lane 的重新執行命令會保留該基準。設定 `published_upgrade_survivor_baselines=all-since-2026.4.23`，可將 Full Release CI 擴展到從 `2026.4.23` 到 `latest` 的每個穩定 npm 發布版本；`release-history` 仍可用於使用較舊前日期錨點的手動更廣泛取樣。設定 `published_upgrade_survivor_scenarios=reported-issues`，可將相同基準擴展到針對飛書設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、波浪號記錄路徑，以及過期舊版 Plugin 相依項根目錄等 issue 型 fixture 的矩陣。獨立的 `Update Migration` 工作流程會在問題是完整的已發布更新清理，而不是一般 Full Release CI 廣度時，使用帶有 `all-since-2026.4.23` 和 `plugin-deps-cleanup` 的 `update-migration` Docker lane。本機彙總執行可以透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 spec，透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 作為情境矩陣。已發布 lane 會使用內建的 `openclaw config set` 命令配方設定基準、在 `summary.json` 中記錄配方步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 與 RPC 狀態。Windows packaged 與 installer fresh lane 也會驗證已安裝的套件能從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 在有設定時預設為 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則為 `openai/gpt-5.4`，因此安裝與 Gateway 證明會維持在 GPT-5 測試模型上，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

Package Acceptance 對已發布的套件有受限的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可能指向 tarball 省略的檔案；
- 當套件未公開該 flag 時，`doctor-switch` 可能會跳過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可能會從 tarball 衍生的假 git fixture 中移除缺失的 `pnpm.patchedDependencies`，並可能記錄缺失的持久化 `update.channel`；
- Plugin smoke 可能會讀取舊版安裝記錄位置，或接受缺失的 marketplace 安裝記錄持久化；
- `plugin-update` 可能允許設定 metadata 遷移，同時仍要求安裝記錄與不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可能針對已出貨的本機建置 metadata stamp 檔案發出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或跳過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時和重新執行命令。優先重新執行失敗的套件設定檔或精確 Docker lane，而不是重新執行完整發布驗證。

## 安裝煙霧測試

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用相同的範圍腳本。它會將煙霧測試涵蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/套件表面、內建 Plugin 套件/manifest 變更，或 Docker 煙霧測試作業會演練的核心 Plugin/channel/gateway/Plugin SDK 表面的 Pull Request 執行。僅限原始碼的內建 Plugin 變更、僅測試編輯和僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI 煙霧測試、執行容器 gateway-network e2e、驗證內建 extension 建置引數，並在 240 秒彙總命令逾時內執行有界的內建 Plugin Docker 設定檔（每個情境的 Docker 執行會另行限制）。
- **完整路徑**會保留 QR 套件安裝與安裝程式 Docker/update 涵蓋範圍，用於每晚排程執行、手動派送、workflow-call 發布檢查，以及真正觸及安裝程式/套件/Docker 表面的 Pull Request。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 煙霧測試映像，然後將 QR 套件安裝、根 Dockerfile/gateway 煙霧測試、安裝程式/update 煙霧測試，以及快速內建 Plugin Docker E2E 作為獨立作業執行，讓安裝程式工作不必等待根映像煙霧測試。

`main` 推送（包含 merge commit）不會強制使用完整路徑；當變更範圍邏輯會在推送時要求完整涵蓋範圍時，工作流程會保留快速 Docker 煙霧測試，並將完整安裝煙霧測試留給每晚或發布驗證。

較慢的 Bun 全域安裝 image-provider 煙霧測試會由 `run_bun_global_install_smoke` 另外控管。它會在每晚排程與發布檢查工作流程中執行，且手動 `Install Smoke` 派送可以選擇納入它，但 Pull Request 和 `main` 推送不會。QR 與安裝程式 Docker 測試會保留各自聚焦於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共享的 live-test 映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共享的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/update/plugin-dependency lane 的裸 Node/Git runner；
- 將同一個 tarball 安裝到 `/app`、用於一般功能 lane 的功能性映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選定的計畫。排程器會以 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主 pool slot 數量。                                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Provider 敏感的尾端 pool slot 數量。                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider 節流。                                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm 安裝 lane 上限。                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行多服務 lane 上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，以避免 Docker daemon create 風暴；設為 `0` 表示不錯開。              |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的後備逾時（120 分鐘）；選定的 live/tail lane 會使用更嚴格的上限。                  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫而不執行 lane。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；略過清理煙霧測試，讓 agent 可以重現單一失敗 lane。                |

比其有效上限更重的 lane 仍可從空 pool 啟動，然後獨自執行直到釋放容量。本機彙總會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、輸出 active-lane 狀態、保存 lane 計時以供最長優先排序，並且預設在第一次失敗後停止排程新的 pooled lane。

### 可重用的 live/E2E 工作流程

可重用的 live/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像類型、live 映像、lane 和憑證涵蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub 輸出和摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball 清單；當計畫需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以 package-digest 標記的 bare/functional GHCR Docker E2E 映像；並且重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或既有 package-digest 映像，而不是重新建置。Docker 映像拉取會以有界的每次嘗試 180 秒逾時重試，讓卡住的 registry/cache 串流能快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發布路徑分塊

發布 Docker 涵蓋範圍會以較小的分塊作業執行，並使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個分塊只拉取它所需的映像類型，並透過同一個加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發布 Docker 分塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總 Plugin/runtime 別名。`install-e2e` lane 別名仍是兩個 provider 安裝程式 lane 的彙總手動重新執行別名。

當完整 release-path 涵蓋範圍要求時，OpenWebUI 會併入 `plugins-runtime-services`，且只在 OpenWebUI-only 派送時保留獨立的 `openwebui` 分塊。內建 channel update lane 會針對暫時性 npm 網路失敗重試一次。

每個分塊都會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢速 lane 表格，以及每個 lane 的重新執行命令。工作流程的 `docker_lanes` 輸入會對已準備的映像執行選定 lane，而不是執行分塊作業，這會將失敗 lane 的偵錯限制在一個目標 Docker 作業內，並為該執行準備、下載或重用套件成品；如果選定 lane 是 live Docker lane，目標作業會在本機為該次重新執行建置 live-test 映像。產生的每個 lane GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備的映像輸入，因此失敗的 lane 可以重用失敗執行中的精確套件和映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E 工作流程每日執行完整 release-path Docker 套件。

## Plugin 預發行

`Plugin Prerelease` 是成本更高的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確操作員派送的獨立工作流程。一般 Pull Request、`main` 推送和獨立的手動 CI 派送會保持該套件關閉。它會在八個 extension worker 之間平衡內建 Plugin 測試；這些 extension shard 作業一次最多執行兩個 Plugin config group，每個 group 使用一個 Vitest worker 和較大的 Node heap，因此 import-heavy 的 Plugin 批次不會建立額外 CI 作業。僅限發布的 Docker 預發行路徑會將目標 Docker lane 以小群組批次處理，避免為一到三分鐘的作業保留數十個 runner。

## QA Lab

QA Lab 在主要 smart-scoped 工作流程之外有專用 CI lane。Agentic parity 巢狀於廣泛的 QA 和發布 harness 之下，而不是獨立的 PR 工作流程。當 parity 應該隨廣泛驗證執行一起進行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會在 `main` 每晚執行，也會在手動派送時執行；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lane 展開為平行作業。Live 作業使用 `qa-live-shared` 環境，Telegram/Discord 使用 Convex leases。

發布檢查會使用 deterministic mock provider 和 mock-qualified models（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport lane，因此 channel contract 會與 live model latency 和一般 provider-plugin 啟動隔離。Live transport gateway 會停用記憶體搜尋，因為 QA parity 會另外涵蓋記憶體行為；provider 連線能力由獨立的 live model、native provider 和 Docker provider 套件涵蓋。

Matrix 會對排程與發布 gate 使用 `--profile fast`，只有在 checkout 的 CLI 支援時才加入 `--fail-fast`。CLI 預設值和手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 派送一律會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發布核准前執行發布關鍵的 QA Lab lane；其 QA parity gate 會將候選與 baseline pack 作為平行 lane 作業執行，然後將兩個成品下載到小型報告作業，以進行最終 parity 比較。

對於一般 PR，請遵循範圍化 CI/check 證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意設計為範圍狹窄的第一輪安全掃描器，而不是完整的儲存庫掃描。每日、手動，以及非草稿 pull request 防護執行會掃描 Actions 工作流程程式碼，以及風險最高的 JavaScript/TypeScript 表面，並使用高信心度安全查詢，篩選出高/重大 `security-severity`。

pull request 防護保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下方有變更時啟動，並執行與排程工作流程相同的高信心度安全矩陣。Android 和 macOS CodeQL 不包含在 PR 預設值中。

### 安全類別

| 類別                                              | 表面                                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、密鑰、沙箱、cron 和 gateway 基準                                                                                             |
| `/codeql-security-high/channel-runtime-boundary`  | 核心 channel 實作合約，加上 channel plugin 執行階段、gateway、Plugin SDK、密鑰、稽核接觸點                                        |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、web-fetch，以及 Plugin SDK SSRF 政策表面                                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞，以及 agent 工具執行閘門                                                                   |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、載入器、manifest、registry、package-manager 安裝、來源載入，以及 Plugin SDK 套件合約信任表面                         |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。在 workflow sanity 接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android app。上傳到 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中濾除相依性建置結果，並上傳到 `/codeql-critical-security/macos` 底下。因為即使乾淨時，macOS 建置也主導執行時間，所以保留在每日預設值之外。

### Critical Quality 類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在較小的 Blacksmith Linux runner 上，針對狹窄的高價值表面執行 error-severity、非安全性的 JavaScript/TypeScript 品質查詢。它的 pull request 防護刻意比排程設定檔更小：非草稿 PR 只會為 agent command/model/tool 執行與 reply dispatch 程式碼、config schema/migration/IO 程式碼、auth/secrets/sandbox/security 程式碼、核心 channel 與 bundled channel plugin 執行階段、gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、plugin loader、Plugin SDK/package-contract，或 Plugin SDK reply runtime 變更，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL config 與 quality workflow 變更會執行全部十二個 PR 品質分片。

手動 dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用來隔離執行單一品質分片的教學/迭代鉤子。

| 類別                                                    | 表面                                                                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、密鑰、沙箱、cron 和 gateway 安全邊界程式碼                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Config schema、migration、normalization 和 IO 合約                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemas 和 server method 合約                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心 channel 和 bundled channel plugin 實作合約                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution、model/provider dispatch、auto-reply dispatch 與 queues，以及 ACP control-plane runtime 合約                                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers 和 tool bridges、process supervision helpers，以及 outbound delivery 合約                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK、memory runtime facades、memory Plugin SDK aliases、memory runtime activation glue，以及 memory doctor commands                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals、session delivery queues、outbound session binding/delivery helpers、diagnostic event/log bundle 表面，以及 session doctor CLI 合約       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch、reply payload/chunking/runtime helpers、channel reply options、delivery queues，以及 session/thread binding helpers          |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization、provider auth 和 discovery、provider runtime registration、provider defaults/catalogs，以及 web/search/fetch/embedding registries |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap、local persistence、gateway control flows，以及 task control-plane runtime 合約                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、media IO、media understanding、image-generation，以及 media-generation runtime 合約                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Loader、registry、public-surface，以及 Plugin SDK entrypoint 合約                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布 package-side Plugin SDK 來源和 plugin package contract helpers                                                                                          |

品質與安全保持分離，讓品質發現可以排程、量測、停用或擴充，而不會遮蔽安全訊號。Swift、Python 和 bundled-plugin CodeQL 擴充，應該只在狹窄設定檔有穩定執行時間與訊號之後，作為有範圍或分片的後續工作加回。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是事件驅動的 Codex 維護通道，用來讓現有文件與近期落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動 dispatch 也可以直接執行。Workflow-run 呼叫會在 `main` 已前進，或過去一小時內已建立另一個未跳過的 Docs Agent 執行時跳過。執行時，它會檢閱從前一個未跳過的 Docs Agent 來源 SHA 到目前 `main` 的 commit 範圍，因此每小時一次執行可以涵蓋自上次文件通過後累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護通道，用於慢速測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果當天 UTC 已經有另一個 workflow-run 呼叫執行過或正在執行，就會跳過。手動 dispatch 會略過該每日活動閘門。這個通道會建置完整套件的 grouped Vitest 效能報告，讓 Codex 只進行保留覆蓋率的小型測試效能修正，而不是廣泛重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗的測試，Codex 只能修正明顯失敗，而 agent 後的完整套件報告必須通過，才會提交任何內容。當 `main` 在 bot push 落地前前進時，這個通道會 rebase 已驗證的 patch，重新執行 `pnpm check:changed`，並重試 push；有衝突的過期 patch 會被跳過。它使用 GitHub-hosted Ubuntu，讓 Codex action 可以維持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是供維護者在落地後清理重複項目的手動工作流程。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 前，它會驗證已落地的 PR 已合併，並且每個重複項目都有共享的引用 issue 或重疊的變更 hunks。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求比廣泛的 CI 平台範圍更嚴格：

- 核心 production 變更會執行核心 prod 和核心 test typecheck，加上核心 lint/guards；
- 僅核心 test 的變更只會執行核心 test typecheck 加上核心 lint；
- extension production 變更會執行 extension prod 和 extension test typecheck，加上 extension lint；
- 僅 extension test 的變更會執行 extension test typecheck 加上 extension lint；
- public Plugin SDK 或 plugin-contract 變更會擴展到 extension typecheck，因為 extensions 依賴那些核心合約（Vitest extension sweeps 仍是明確的測試工作）；
- release metadata-only 版本升級會執行 targeted version/config/root-dependency checks；
- unknown root/config 變更會 fail safe 到所有 check lanes。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，而且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，來源編輯優先使用明確 mappings，然後是 sibling tests 和 import-graph dependents。共享 group-room delivery config 是明確 mappings 之一：對 group visible-reply config、source reply delivery mode，或 message-tool system prompt 的變更，會透過核心 reply tests 加上 Discord 和 Slack delivery regressions 路由，讓共享預設值變更在第一次 PR push 前失敗。只有當變更已廣泛到整個 harness，使便宜的 mapped set 不再是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從儲存庫根目錄執行 Testbox，並優先使用全新且已預熱的機器來做廣泛驗證。在重複使用、已過期，或剛回報非預期大量同步內容的機器上投入耗時的驗證關卡之前，先在該機器內執行 `pnpm testbox:sanity`。

當必要的根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤的刪除項目時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；請停止該機器並改為預熱全新機器，而不是偵錯產品測試失敗。對於刻意包含大量刪除的 PR，請在該次健全性檢查執行時設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該保護，或針對異常龐大的本機差異使用較大的毫秒值。

當 Blacksmith 無法使用，或偏好使用自有雲端容量時，Crabbox 是此儲存庫擁有的第二條 Linux 驗證遠端機器路徑。預熱一台機器，透過專案工作流程將其水合，然後透過 Crabbox CLI 執行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 擁有提供者、同步與 GitHub Actions 水合預設值。它會排除本機 `.git`，讓已水合的 Actions checkout 保留自己的遠端 Git 中繼資料，而不是同步維護者本機的 remote 與 object store；它也會排除絕不應傳輸的本機執行階段/建置成品。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` 擷取，以及後續 `crabbox run --id <cbx_id>` 命令會載入的非機密環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
