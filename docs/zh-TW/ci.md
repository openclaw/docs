---
read_when:
    - 你需要了解為什麼 CI 作業有執行或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一輪發布驗證執行或重新執行
    - 你正在變更 ClawSweeper 派送或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發布保護傘，以及本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-07-04T17:48:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個提取請求上執行。標準的
`main` 推送會先通過 90 秒的託管執行器准入視窗。
現有的 `CI` 並行群組會在較新的提交落地時取消該等待中的執行，
因此連續合併不會各自註冊完整的 Blacksmith 矩陣。
提取請求與手動派發會略過等待。接著 `preflight` 作業
會分類差異，並在只有不相關區域變更時關閉昂貴的執行線。
手動 `workflow_dispatch` 執行會刻意繞過智慧範圍限定，
並展開完整圖形，以供候選版本與廣泛驗證使用。Android 執行線透過
`include_android` 保持選擇加入。僅限發行版的外掛涵蓋範圍位於獨立的
[`外掛預發行`](#plugin-prerelease) 工作流程中，且只會由
[`完整發行驗證`](#full-release-validation) 或明確的手動派發執行。

## 管線概覽

| 作業                                | 目的                                                                                                   | 執行時機                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件變更、已變更範圍、已變更擴充功能，並建置 CI 清單                   | 一律在非草稿推送與提取請求上執行                  |
| `runner-admission`                 | 在註冊 Blacksmith 工作前，為標準 `main` 推送提供託管 90 秒防抖                | 每次 CI 執行；僅在標準 `main` 推送時休眠 |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 進行已變更工作流程稽核，以及生產 lockfile 稽核                 | 一律在非草稿推送與提取請求上執行                  |
| `check-dependencies`               | 生產 Knip 僅相依性檢查，加上未使用檔案允許清單防護                                 | Node 相關變更                               |
| `build-artifacts`                  | 建置 `dist/`、Control UI、已建置命令列介面煙霧檢查、內嵌建置成品檢查，以及可重用成品 | Node 相關變更                               |
| `checks-fast-core`                 | 快速 Linux 正確性執行線，例如 bundled、protocol、QA Smoke CI，以及 CI 路由檢查                | Node 相關變更                               |
| `checks-fast-contracts-plugins-*`  | 兩個分片外掛合約檢查                                                                        | Node 相關變更                               |
| `checks-fast-contracts-channels-*` | 兩個分片通道合約檢查                                                                       | Node 相關變更                               |
| `checks-node-core-*`               | 核心 Node 測試分片，不包含通道、bundled、合約與擴充功能執行線                          | Node 相關變更                               |
| `check-*`                          | 分片主要本機閘門等效項：生產型別、lint、防護、測試型別，以及嚴格煙霧測試                | Node 相關變更                               |
| `check-additional-*`               | 架構、分片邊界/提示漂移、擴充功能防護、套件邊界，以及執行階段拓撲     | Node 相關變更                               |
| `checks-node-compat-node22`        | Node 22 相容性建置與煙霧執行線                                                                | 發行版的手動 CI 派發                     |
| `check-docs`                       | 文件格式、lint，以及失效連結檢查                                                             | 文件已變更                                        |
| `skills-python`                    | Python 支援 Skills 的 Ruff + pytest                                                                    | Python Skill 相關變更                       |
| `checks-windows`                   | Windows 專屬程序/路徑測試，加上共用執行階段匯入指定器回歸                      | Windows 相關變更                            |
| `macos-node`                       | 使用共用建置成品的 macOS TypeScript 測試執行線                                               | macOS 相關變更                              |
| `macos-swift`                      | macOS app 的 Swift lint、建置與測試                                                            | macOS 相關變更                              |
| `ios-build`                        | Xcode 專案產生，加上 iOS app 模擬器建置                                                 | iOS app、共用 app kit，或 Swabble 變更         |
| `android`                          | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                              | Android 相關變更                            |
| `test-performance-agent`           | 在受信任活動後每日進行 Codex 慢速測試最佳化                                                 | 主要 CI 成功或手動派發                  |
| `openclaw-performance`             | 每日/按需 Kova 執行階段效能報告，包含 mock-provider、deep-profile，以及 GPT 5.5 live 執行線 | 排程與手動派發                       |

## 快速失敗順序

1. `runner-admission` 僅等待標準 `main` 推送；較新的推送會在 Blacksmith 註冊前取消該次執行。
2. `preflight` 決定哪些執行線實際存在。`docs-scope` 和 `changed-scope` 邏輯是此作業內的步驟，不是獨立作業。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不會等待較重的成品與平台矩陣作業。
4. `build-artifacts` 會與快速 Linux 執行線重疊，讓下游消費者在共用建置準備好後立即開始。
5. 較重的平台與執行階段執行線會在之後展開：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

當較新的推送落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則請將其視為 CI 雜訊。矩陣作業使用 `fail-fast: false`，而 `build-artifacts` 會直接回報內嵌通道、core-support-boundary 和 gateway-watch 失敗，而不是排入微小的驗證器作業。自動 CI 並行金鑰已版本化（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍執行不會無限期阻塞較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>` 從 GitHub Actions 摘要總牆鐘時間、佇列時間、最慢作業、失敗，以及 `pnpm-store-warmup` 展開屏障。CI 也會將相同的執行摘要上傳為 `ci-timings-summary` 成品。若要查看建置時間，請檢查 `build-artifacts` 作業的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會列印 `[build-all] phase timings:` 並包含 `ui:build`；該作業也會上傳 `startup-memory` 成品。

對於提取請求執行，終端 timing-summary 作業會先從受信任的基底修訂版執行輔助工具，再將 `GH_TOKEN` 傳給 `gh run view`。這會讓帶有權杖的查詢避開分支控制的程式碼，同時仍摘要該提取請求目前的 CI 執行。

## PR 情境與證據

外部貢獻者 PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR 情境與證據閘門。此工作流程會簽出受信任的
基底提交，且只評估 PR 本文；它不會執行貢獻者分支中的程式碼。

此閘門適用於不是儲存庫擁有者、成員、
協作者或 bot 的 PR 作者。當 PR 本文包含作者撰寫的
`What Problem This Solves` 與 `Evidence` 區段時即會通過。證據可以是聚焦的
測試、CI 結果、螢幕截圖、錄影、終端機輸出、即時觀察、
已遮蔽記錄，或成品連結。本文提供意圖與有用的驗證；
審閱者會檢查程式碼、測試與 CI 來評估正確性。

當檢查失敗時，請更新 PR 本文，而不是再推送另一個程式碼提交。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動派發會略過 changed-scope 偵測，並讓 preflight 清單表現得像每個範圍區域都已變更。

- **CI 工作流程編輯** 會驗證 Node CI 圖形加上工作流程 linting，但本身不會強制執行 Windows、iOS、Android 或 macOS 原生建置；這些平台執行線仍限於平台原始碼變更。
- **工作流程健全性** 會對所有工作流程 YAML 檔案執行 `actionlint`、`zizmor`、composite-action 插值防護，以及衝突標記防護。PR 範圍的 `security-fast` 作業也會對已變更的工作流程檔案執行 `zizmor`，讓工作流程安全性發現能在主要 CI 圖形中提早失敗。
- **`main` 推送上的文件** 會由獨立的 `Docs` 工作流程檢查，並使用與 CI 相同的 ClawHub 文件鏡像，因此混合程式碼+文件推送不會同時排入 CI `check-docs` 分片。提取請求與手動 CI 在文件變更時仍會從 CI 執行 `check-docs`。
- **終端介面 PTY** 會在 TUI 變更的 `checks-node-core-runtime-tui-pty` Linux Node 分片中執行。該分片使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋確定性的 `TuiBackend` fixture 執行線，以及較慢、只 mock 外部模型端點的 `tui --local` 煙霧測試。
- **僅 CI 路由編輯、選定的廉價核心測試 fixture 編輯，以及狹窄的外掛合約輔助工具/測試路由編輯** 使用快速的僅 Node 清單路徑：`preflight`、security，以及單一 `checks-fast-core` 任務。當變更僅限於該快速任務直接演練的路由或輔助工具表面時，該路徑會略過建置成品、Node 22 相容性、通道合約、完整核心分片、bundled-plugin 分片，以及額外防護矩陣。
- **Windows Node 檢查** 限於 Windows 專屬程序/路徑包裝器、npm/pnpm/UI 執行器輔助工具、套件管理器設定，以及執行該執行線的 CI 工作流程表面；不相關的原始碼、外掛、安裝煙霧測試，以及僅測試變更會留在 Linux Node 執行線上。

最慢的節點測試家族已拆分或平衡，讓每個作業保持小規模且不過度預留 runner：外掛合約與通道合約各自以兩個加權的 Blacksmith 支援分片執行，並保留標準 GitHub runner 後援；核心單元 fast/support lane 分開執行；核心執行階段基礎設施拆分為 state、process/config、shared，以及三個排程網域分片；auto-reply 以平衡 worker 執行（reply 子樹拆分為 agent-runner、dispatch，以及 commands/state-routing 分片）；agentic 閘道/server 設定則拆分到 chat/auth/model/http-plugin/runtime/startup lane，而不是等待已建置成品。接著，一般 CI 只會把隔離的基礎設施 include-pattern 分片封裝成最多 64 個測試檔案的確定性套組，藉此縮減節點矩陣，而不合併非隔離的 command/cron、有狀態 agents-core，或 gateway/server 測試套件；重型固定套件維持使用 8 vCPU，而套組化與較低權重的 lane 使用 4 vCPU。canonical 儲存庫上的 pull request 使用額外的精簡准入計畫：相同的每設定群組會在目前 34 作業 Linux 節點計畫內的隔離子行程中執行，因此單一 PR 不會註冊完整的 70 多作業節點矩陣。`main` push、手動 dispatch，以及 release gate 保留完整矩陣。廣泛的瀏覽器、QA、媒體，以及雜項外掛測試會使用各自專用的 Vitest 設定，而不是共用的外掛 catch-all。Include-pattern 分片會使用 CI 分片名稱記錄計時項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分完整設定與篩選後的分片。`check-additional-*` 會把 package 邊界編譯/canary 工作放在一起，並將執行階段拓撲架構與閘道 watch 覆蓋範圍分開；邊界 guard 清單會條帶化為一個 prompt-heavy 分片，以及一個包含其餘 guard 條帶的合併分片，各自並行執行選定的獨立 guard，並列印每項檢查的計時。昂貴的 Codex happy-path prompt 快照漂移檢查會作為自己的 additional 作業執行，且只用於手動 CI 與影響 prompt 的變更，因此一般不相關的節點變更不會被冷啟動 prompt 快照產生卡住，邊界分片也能保持平衡，同時 prompt 漂移仍會固定到造成它的 PR；相同旗標會略過已建置成品核心 support-boundary 分片內的 prompt 快照 Vitest 產生。閘道 watch、通道測試，以及核心 support-boundary 分片會在 `dist/` 與 `dist-runtime/` 已建置完成後，於 `build-artifacts` 內並行執行。

准入後，canonical Linux CI 允許最多 24 個節點測試作業並行，以及
較小的 fast/check lane 允許 12 個；Windows 與 Android 維持兩個，因為
那些 runner 池較窄。

精簡 PR 計畫會為目前套件發出 18 個節點作業：whole-config
群組會在隔離子行程中批次執行，批次逾時為 120 分鐘，
而 include-pattern 群組共用相同的有界作業預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；它的 unit-test lane 仍會使用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關 push 上重複執行 debug APK 封裝作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（固定到最新 Knip 版本的 production Knip dependency-only pass，並為 `dlx` 安裝停用 pnpm 的 minimum release age）與 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file 發現與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增新的未審查 unused file，或留下過時 allowlist 項目時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的刻意動態外掛、generated、build、live-test，以及 package bridge 表面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request 程式碼。此 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload dispatch 到 `openclaw/clawsweeper`。

此 workflow 有四個 lane：

- `clawsweeper_item` 用於精確的 issue 與 pull request 審查請求；
- `clawsweeper_comment` 用於 issue comment 中明確的 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` push 上的 commit 層級審查請求；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub 活動。

`github_activity` lane 只會轉送正規化中繼資料：事件類型、動作、actor、儲存庫、項目編號、URL、標題、狀態，以及存在 comment 或 review 時的短摘錄。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，會把正規化事件發布到供 ClawSweeper agent 使用的 OpenClaw 閘道 hook。

一般活動是觀察，而不是預設投遞。ClawSweeper agent 會在 prompt 中收到 Discord 目標，且只應在事件令人意外、可採取行動、有風險，或具營運用途時發布到 `#clawsweeper`。例行開啟、編輯、bot churn、重複 webhook 雜訊，以及一般 review 流量應產生 `NO_REPLY`。

在此路徑中，請全程將 GitHub 標題、comment、body、review text、branch name，以及 commit message 視為不受信任資料。它們是用於摘要與分流的輸入，而不是 workflow 或 agent 執行階段的指令。

## 手動 dispatch

手動 CI dispatch 會執行與一般 CI 相同的作業圖，但強制開啟每個非 Android scoped lane：Linux 節點分片、bundled-plugin 分片、外掛與通道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、built-artifact smoke 檢查、docs 檢查、Python Skills、Windows、macOS、iOS build，以及 Control UI i18n。獨立手動 CI dispatch 只有在 `include_android=true` 時執行 Android；完整 release umbrella 會透過傳入 `include_android=true` 啟用 Android。外掛 prerelease 靜態檢查、release-only `agentic-plugins` 分片、完整 extension batch sweep，以及外掛 prerelease Docker lane 會從 CI 排除。Docker prerelease 套件只會在 `Full Release Validation` 以啟用 release-validation gate 的方式 dispatch 獨立 `Plugin Prerelease` workflow 時執行。

手動執行會使用唯一 concurrency group，因此 release-candidate full suite 不會被同一 ref 上的另一個 push 或 PR run 取消。選用的 `target_ref` 輸入讓受信任的呼叫者可針對 branch、tag，或完整 commit SHA 執行該圖，同時使用所選 dispatch ref 的 workflow file。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月 npm-only extended-stable 路徑是例外：請從確切的
`extended-stable/YYYY.M.33` branch dispatch `OpenClaw NPM
Release` preflight 與 `Full Release Validation`，保留其 run ID，並將兩個 ID 傳給
直接 npm publish run。請參閱[每月 npm-only extended-stable
發布](/zh-TW/reference/RELEASING#monthly-npm-only-extended-stable-publication)以取得
命令、精確身分要求、registry readback，以及 selector
修復程序。此路徑不會 dispatch 外掛、macOS、Windows、GitHub
Release、private dist-tag，或其他平台發布。

## Runner

| Runner                          | 作業                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI dispatch 與非 canonical 儲存庫後援、CodeQL JavaScript/actions 品質掃描、workflow-sanity、labeler、auto-response、CI 外的 docs workflow，以及 install-smoke preflight，讓 Blacksmith 矩陣能更早排隊                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、較低權重的 extension 分片、除了 QA Smoke CI 以外的 `checks-fast-core`、外掛/通道合約分片、多數 bundled/較低權重 Linux 節點分片、`check-guards`、`check-prod-types`、`check-test-types`、選定的 `check-additional-*` 分片，以及 `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux 節點套件、boundary/extension-heavy `check-additional-*` 分片，以及 `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI 與 Testbox 中的 `build-artifacts`、`check-lint`（對 CPU 足夠敏感，8 vCPU 的成本高於節省）；install-smoke Docker build（32-vCPU 的排隊時間成本高於節省）                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork 會後援到 `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；fork 會後援到 `macos-26`                                                                                                                                                                                                                     |

## Runner 註冊預算

OpenClaw 目前的 GitHub runner-registration bucket 在 `ghx api rate_limit` 中回報每 5 分鐘 10,000 次 self-hosted
runner 註冊。因為 GitHub 可能變更此 bucket，所以每次調校前都要重新檢查
`actions_runner_registration`。此限制由 `openclaw`
組織中的所有 Blacksmith runner 註冊共用，因此新增另一個 Blacksmith 安裝不會增加
新的 bucket。

請將 Blacksmith label 視為爆量控制的稀缺資源。只負責
route、notify、summarize、select shard，或執行短 CodeQL scan 的作業，應
留在 GitHub-hosted runner 上，除非它們有已測量的 Blacksmith 專屬
需求。任何新的 Blacksmith 矩陣、較大的 `max-parallel`，或高頻率
workflow，都必須展示其最壞情況註冊數，並讓組織層級
目標保持在 live bucket 約 60% 以下。以目前 10,000-registration
bucket 計算，代表 6,000-registration 的操作目標，為
並行儲存庫、retry，以及 burst overlap 保留餘裕。

Canonical-repo CI 會在一般 push 與 pull-request run 中保留 Blacksmith 作為預設 runner 路徑。`workflow_dispatch` 與非 canonical 儲存庫 run 會使用 GitHub-hosted runner，但一般 canonical run 目前不會探測 Blacksmith queue health，也不會在 Blacksmith 無法使用時自動後援到 GitHub-hosted label。

## 本機對應項目

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw 效能

`OpenClaw Performance` 是產品/執行階段效能工作流程。它每天在 `main` 上執行，也可以手動派送：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動派送通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對發行標籤或其他分支進行基準測試。已發布的報告路徑和 latest 指標會依受測 ref 設定索引鍵，而且每個 `index.md` 都會記錄受測 ref/SHA、工作流程 ref/SHA、Kova ref、設定檔、lane 驗證模式、模型、重複次數和情境篩選器。

此工作流程會從固定的發行版本安裝 OCM，並從 `openclaw/Kova` 以固定的 `kova_ref` 輸入安裝 Kova，接著執行三個 lane：

- `mock-provider`：針對本機建置執行階段，使用決定性的假 OpenAI 相容驗證執行 Kova 診斷情境。
- `mock-deep-profile`：針對啟動、閘道和 agent turn 熱點進行 CPU/heap/trace 效能分析。
- `live-openai-candidate`：真實的 OpenAI `openai/gpt-5.5` agent turn，當 `OPENAI_API_KEY` 不可用時略過。

mock-provider lane 也會在 Kova 通過後執行 OpenClaw 原生原始碼探針：在預設、hook 和 50 個外掛啟動案例中量測閘道開機時間與記憶體；內建外掛匯入 RSS、重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道的命令列介面啟動命令，以及 SQLite 狀態煙霧效能探針。當可取得受測 ref 先前已發布的 mock-provider 原始碼報告時，原始碼摘要會將目前 RSS 和 heap 值與該基準比較，並將大幅 RSS 增加標記為 `watch`。原始碼探針 Markdown 摘要位於報告 bundle 的 `source/index.md`，旁邊附有原始 JSON。

每個 lane 都會上傳 GitHub artifact。設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、bundle、`index.md` 和原始碼探針 artifact 提交到 `openclaw/clawgrit-reports`，路徑為 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。目前受測 ref 指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發行驗證

`Full Release Validation` 是「發行前執行所有項目」的手動總控工作流程。它接受分支、標籤或完整 commit SHA，使用該目標派送手動 `CI` 工作流程，針對僅限發行的外掛/套件/靜態/Docker 證明派送 `Plugin Prerelease`，並針對安裝煙霧、套件驗收、跨作業系統套件檢查、從 QA 設定檔證據算繪成熟度評分卡、QA Lab 同等性、Matrix 和 Telegram lane 派送 `OpenClaw Release Checks`。stable 和 full 設定檔一律包含完整的 live/E2E 與 Docker 發行路徑 soak 涵蓋；beta 設定檔可用 `run_release_soak=true` 選擇加入。標準套件 Telegram E2E 會在 Package Acceptance 內執行，因此完整候選版本不會啟動重複的即時輪詢器。發布後，傳入 `release_package_spec` 以在 release checks、Package Acceptance、Docker、跨作業系統和 Telegram 中重用已出貨的 npm 套件，而不需重新建置。僅在聚焦的已發布套件 Telegram 重新執行時使用 `npm_telegram_package_spec`。Codex 外掛 live package lane 預設使用相同的已選狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生出 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/artifact 執行會從所選 ref 封裝 `extensions/codex`。針對自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` spec，請明確設定 `codex_plugin_spec`。

請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、確切工作流程 job 名稱、設定檔差異、artifact，以及聚焦重新執行控制代碼。

`OpenClaw Release Publish` 是手動變更式發行工作流程。在發行標籤存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.PATCH` 或 `main` 派送它。它會驗證 `pnpm plugins:sync:check`，針對所有可發布的外掛套件派送 `Plugin NPM Release`，針對相同的發行 SHA 派送 `Plugin ClawHub Release`，之後才會使用已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。Stable 發布也需要完全相符的 `windows_node_tag`；此工作流程會驗證 Windows 原始碼發行版本，並在任何發布子流程前，將其 x64/ARM64 安裝程式與候選版本已核准的 `windows_node_installer_digests` 輸入比較，接著在發布 GitHub release draft 前，推進並驗證相同固定的安裝程式摘要，以及確切的配套 asset 和 checksum contract。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得固定 commit 證明，請使用輔助工具，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程派送 ref 必須是分支或標籤，不能是原始 commit SHA。輔助工具會在目標 SHA 推送暫時的 `release-ci/<sha>-...` 分支，從該固定 ref 派送 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。如果任何子工作流程在不同 SHA 上執行，總控驗證器也會失敗。

`release_profile` 控制傳入 release checks 的 live/provider 範圍。手動發行工作流程預設為 `stable`；只有在你刻意需要廣泛的 advisory provider/media 矩陣時，才使用 `full`。Stable 和 full release checks 一律執行完整的 live/E2E 和 Docker 發行路徑 soak；beta 設定檔可用 `run_release_soak=true` 選擇加入。

- `minimum` 保留最快的 OpenAI/core 發行關鍵 lane。
- `stable` 加入 stable provider/backend 集合。
- `full` 執行廣泛的 advisory provider/media 矩陣。

總控會記錄已派送的子執行 ID，而最終的 `Verify full validation` job 會重新檢查目前子執行的結論，並附加每個子執行的最慢 job 表格。如果子工作流程重新執行並轉為綠燈，只需重新執行父驗證器 job，即可重新整理總控結果和時間摘要。

為了復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。針對發行候選版本使用 `all`；只針對一般完整 CI 子流程使用 `ci`；只針對外掛 prerelease 子流程使用 `plugin-prerelease`；針對每個 release 子流程使用 `release-checks`；或在總控上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能在聚焦修正後，將失敗的 release box 重新執行維持在有限範圍。針對單一失敗的跨作業系統 lane，將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 搭配使用，例如 `windows/packaged-upgrade`；長時間的跨作業系統命令會輸出心跳偵測行，而 packaged-upgrade 摘要會包含各階段時間。QA release-check lane 屬於 advisory，但標準執行階段工具涵蓋 gate 例外；當必要的 OpenClaw dynamic tools 從 standard tier summary 漂移或消失時，該 gate 會阻擋。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將所選 ref 解析一次為 `release-package-under-test` tarball，然後將該 artifact 傳給跨作業系統檢查和 Package Acceptance，以及在執行 soak 涵蓋時傳給 live/E2E 發行路徑 Docker 工作流程。這能讓套件位元組在多個 release box 之間保持一致，並避免在多個子 job 中重新封裝相同候選版本。針對 Codex npm-plugin live lane，release checks 會傳入從 `release_package_spec` 衍生的相符已發布外掛 spec、傳入操作者提供的 `codex_plugin_spec`，或將輸入留空，讓 Docker script 封裝所選 checkout 的 Codex 外掛。

`ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的總控。父監控器在父流程取消時，會取消任何它已派送的子工作流程，因此較新的 main 驗證不會卡在過時的兩小時 release-check 執行後面。發行分支/標籤驗證和聚焦重新執行群組會保留 `cancel-in-progress: false`。

## Live 與 E2E shard

Release live/E2E 子流程會保留廣泛的原生 `pnpm test:live` 涵蓋，但會透過 `scripts/test-live-shard.mjs` 以具名 shard 執行，而不是單一 serial job：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的 media audio/video shard，以及 provider-filtered music shard

這會維持相同的檔案涵蓋，同時讓緩慢的 live provider 失敗更容易重新執行和診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` shard 名稱仍可用於手動一次性重新執行。

原生 live media shard 會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像檔由 `Live Media Runner Image` 工作流程建置。該映像檔會預先安裝 `ffmpeg` 和 `ffprobe`；media job 只會在 setup 前驗證二進位檔。請將 Docker 支援的 live suite 保持在一般 Blacksmith runner 上；container job 不適合啟動巢狀 Docker 測試。

Docker 支援的即時模型/後端分片會針對每個選取的提交使用獨立共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發布工作流程會建置並推送該映像一次，接著 Docker 即時模型、依提供者分片的閘道、命令列介面後端、ACP 繫結，以及 Codex harness 分片都會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片會帶有明確的腳本層級 `timeout` 上限，低於工作流程作業逾時，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個發布檢查預算。如果這些分片各自獨立重建完整來源 Docker 目標，表示發布執行設定錯誤，並會在重複映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證來源樹，而套件驗收會透過使用者安裝或更新後會執行的相同 Docker E2E harness，驗證單一 tarball。

### 作業

1. `resolve_package` 會簽出 `workflow_ref`、解析一個套件候選項、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 與設定檔。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備套件摘要 Docker 映像，並針對該套件執行選取的 Docker lane，而不是封裝工作流程簽出內容。當設定檔選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件與共用映像一次，然後將這些 lane 展開為具有唯一成品的平行目標 Docker 作業。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。它會在 `telegram_mode` 不是 `none` 時執行，並在套件驗收已解析套件時安裝相同的 `package-under-test` 成品；獨立的 Telegram dispatch 仍可安裝已發布的 npm 規格。
4. `summary` 會在套件解析、Docker 驗收，或可選 Telegram lane 失敗時讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。將此用於已發布的預發布/穩定版驗收。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤、驗證選取的提交可從儲存庫分支歷史或發布標籤抵達、在 detached worktree 中安裝相依項，並以 `scripts/package-openclaw-for-docker.mjs` 封裝。
- `source=url` 會下載公開 HTTPS `.tgz`；`package_sha256` 為必填。此路徑會拒絕 URL 認證、非預設 HTTPS 連接埠、私有/內部/特殊用途主機名稱或解析出的 IP，以及重新導向到相同公開安全政策以外的位置。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名的受信任來源政策下載 HTTPS `.tgz`；`package_sha256` 和 `trusted_source_id` 為必填。僅將此用於需要設定主機、連接埠、路徑前綴、重新導向主機或私有網路解析的維護者擁有企業鏡像或私有套件儲存庫。如果政策宣告 bearer auth，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；URL 內嵌認證仍會被拒絕。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選填，但外部共享成品應提供它。

保持 `workflow_ref` 與 `package_ref` 分離。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是在 `source=ref` 時會被封裝的來源提交。這讓目前的測試 harness 能驗證較舊的受信任來源提交，而不必執行舊的工作流程邏輯。

### 套件設定檔

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` 設定檔使用離線外掛涵蓋範圍，因此已發布套件驗證不會受限於即時 ClawHub 可用性。可選的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，而已發布 npm 規格路徑則保留給獨立 dispatch。

如需專用的更新與外掛測試政策，包括本機命令、Docker lane、套件驗收輸入、發布預設值與失敗分流，請參閱 [測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`，以及 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、即時 ClawHub skill 安裝、過期外掛相依項清理、已設定外掛安裝修復、離線外掛、外掛更新與 Telegram 證明都使用同一個已解析的套件 tarball。在發布 beta 後，於 Full Release Validation 或 OpenClaw Release Checks 設定 `release_package_spec`，即可針對已出貨的 npm 套件執行相同矩陣而不重建；只有當套件驗收需要使用與其餘發布驗證不同的套件時，才設定 `package_acceptance_package_spec`。跨 OS 發布檢查仍會涵蓋 OS 特定的 onboarding、安裝程式與平台行為；套件/更新產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker lane 會在阻擋式發布路徑中，每次執行驗證一個已發布套件基準。在套件驗收中，已解析的 `package-under-test` tarball 永遠是候選項，而 `published_upgrade_survivor_baseline` 會選取後備已發布基準，預設為 `openclaw@latest`；失敗 lane 重新執行命令會保留該基準。當 Full Release Validation 使用 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 與 `published_upgrade_survivor_scenarios=reported-issues`，以擴展到最新四個穩定 npm 發布，加上釘選的外掛相容性邊界發布，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw 外掛安裝、波浪號記錄路徑，以及過期舊版外掛相依項根目錄的議題形狀 fixtures。多基準已發布升級倖存者選項會依基準分片為獨立的目標 Docker runner 作業。獨立的 `Update Migration` 工作流程會在問題是完整的已發布更新清理，而不是一般 Full Release CI 廣度時，使用帶有 `all-since-2026.4.23` 與 `plugin-deps-cleanup` 的 `update-migration` Docker lane。本機彙總執行可以透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件規格、用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 來使用情境矩陣。已發布 lane 會以內建的 `openclaw config set` 命令配方設定基準、在 `summary.json` 記錄配方步驟，並在閘道啟動後探測 `/healthz`、`/readyz` 與 RPC 狀態。Windows 已封裝與安裝程式全新 lane 也會驗證已安裝套件能從原始絕對 Windows 路徑匯入瀏覽器控制覆寫。OpenAI 跨 OS agent-turn smoke 在已設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因此安裝與閘道證明會停留在 GPT-5 測試模型，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

套件驗收針對已發布套件有界定的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從 tarball 衍生的假 git fixture 中修剪遺失的 pnpm `patchedDependencies`，並可記錄遺失的持久化 `update.channel`；
- 外掛 smoke 可以讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可以允許設定中繼資料遷移，同時仍要求安裝記錄與不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可以針對已出貨的本機建置中繼資料戳記檔案發出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段時間，以及重新執行命令。請優先重新執行失敗的套件設定檔或精確 Docker lane，而不是重新執行完整發布驗證。

## 安裝 smoke

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用相同的範圍腳本。它會將 smoke 涵蓋範圍拆分為 `run_fast_install_smoke` 與 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/套件介面、捆綁外掛套件/清單變更，或 Docker smoke 作業會演練的核心外掛/頻道/閘道/外掛 SDK 介面的拉取請求執行。僅來源的捆綁外掛變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查命令列介面、執行 agents delete shared-workspace 命令列介面 smoke、執行容器 gateway-network e2e、驗證捆綁擴充功能建置參數，並在 240 秒彙總命令逾時內執行有界的捆綁外掛 Docker profile（每個情境的 Docker 執行另有個別上限）。
- **完整路徑**會保留 QR 套件安裝與安裝器 Docker/update 覆蓋範圍，用於夜間排程執行、手動 dispatch、workflow-call 發行檢查，以及真正觸及安裝器/套件/Docker 介面的拉取請求。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile smoke 映像，接著將 QR 套件安裝、根 Dockerfile/閘道 smoke、安裝器/update smoke，以及快速捆綁外掛 Docker E2E 作為獨立作業執行，讓安裝器工作不必等待根映像 smoke。

`main` 推送（包含合併提交）不會強制使用完整路徑；當變更範圍邏輯會在推送上要求完整覆蓋時，工作流程會保留快速 Docker smoke，並將完整安裝 smoke 留給夜間或發行驗證。

較慢的 Bun 全域安裝 image-provider smoke 會由 `run_bun_global_install_smoke` 另行控管。它會在夜間排程與發行檢查工作流程中執行，手動 `Install Smoke` dispatch 也可以選擇加入，但拉取請求和 `main` 推送不會執行。一般 PR CI 仍會針對與節點相關的變更執行快速 Bun launcher 迴歸 lane。QR 與安裝器 Docker 測試會保留各自聚焦安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像，將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝器/update/外掛相依性 lane 的裸節點/Git runner；
- 功能性映像，會將相同 tarball 安裝到 `/app`，供一般功能 lane 使用。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選定的計畫。排程器會透過 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主集區 slot 數量。                                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對 provider 敏感的尾端集區 slot 數量。                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider 進行節流。                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，用於避免 Docker daemon 建立風暴；設為 `0` 表示不錯開。               |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的後備逾時（120 分鐘）；選定的 live/tail lane 會使用更嚴格的上限。                  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定  | `1` 會列印排程器計畫而不執行 lane。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定  | 以逗號分隔的精確 lane 清單；會略過清理 smoke，讓 agent 能重現單一失敗 lane。                  |

比其有效上限更重的 lane 仍可從空集區啟動，之後會單獨執行直到釋放容量。本機彙總會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、輸出作用中 lane 狀態、持久化 lane 計時以進行最長優先排序，且預設會在第一次失敗後停止排程新的集區 lane。

### 可重用 live/E2E 工作流程

可重用 live/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些套件、映像類型、live 映像、lane，以及憑證覆蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub outputs 與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件 artifact，或從 `package_artifact_run_id` 下載套件 artifact；驗證 tarball inventory；當計畫需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的裸/功能性 GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或既有的套件 digest 映像，而不是重新建置。Docker 映像 pull 會以每次嘗試 180 秒的有界逾時重試，讓卡住的 registry/cache 串流能快速重試，而不是耗盡 CI 關鍵路徑的大部分時間。

### 發行路徑區塊

發行 Docker 覆蓋範圍會以較小的分塊作業執行，並設定 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個區塊只 pull 所需的映像類型，並透過同一個加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker 區塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 外掛套件 lane，會安裝候選 OpenClaw 套件，從 `codex_plugin_spec` 或具有明確 Codex 命令列介面安裝核准的同 ref tarball 安裝 Codex 外掛，執行 Codex 命令列介面預先檢查，接著對 OpenAI 執行多個同一工作階段的 OpenClaw agent turn。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總外掛/runtime 別名。`install-e2e` lane 別名仍是兩個 provider 安裝器 lane 的彙總手動重跑別名。

當完整 release-path 覆蓋要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，且只有在 OpenWebUI-only dispatch 時才保留獨立的 `openwebui` 區塊。捆綁頻道 update lane 會針對暫時性 npm 網路失敗重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含 lane 日誌、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢速 lane 表格，以及每個 lane 的重跑命令。工作流程 `docker_lanes` 輸入會針對已準備的映像執行選定的 lane，而不是區塊作業，這會將失敗 lane 偵錯限制在單一目標 Docker 作業中，並為該次執行準備、下載或重用套件 artifact；如果選定 lane 是 live Docker lane，目標作業會在本機為該次重跑建置 live-test 映像。產生的每個 lane GitHub 重跑命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備映像輸入，讓失敗 lane 能重用失敗執行中的確切套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker artifacts 並列印合併/每個 lane 的目標重跑命令
pnpm test:docker:timings <summary>   # 慢速 lane 與階段關鍵路徑摘要
```

排程的 live/E2E 工作流程每天執行完整 release-path Docker 套件。

## 外掛預發行

`Plugin Prerelease` 是成本較高的產品/套件覆蓋範圍，因此它是由 `Full Release Validation` 或明確操作員 dispatch 的獨立工作流程。一般拉取請求、`main` 推送，以及獨立手動 CI dispatch 都會關閉該套件。它會在八個擴充功能 worker 之間平衡捆綁外掛測試；這些擴充功能 shard 作業一次最多執行兩個外掛設定群組，每個群組使用一個 Vitest worker 和較大的節點 heap，讓匯入密集的外掛批次不會建立額外 CI 作業。僅發行的 Docker 預發行路徑會以小群組批次處理目標 Docker lane，避免為一到三分鐘的作業保留數十個 runner。該工作流程也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` artifact；inspector findings 是分流輸入，不會變更阻塞性的外掛預發行閘門。

## QA Lab

QA Lab 在主要 smart-scoped 工作流程之外有專用 CI lane。Agentic parity 巢狀位於廣泛 QA 與發行 harness 之下，而不是獨立 PR 工作流程。當 parity 應隨廣泛驗證執行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會在 `main` 上夜間執行並支援手動 dispatch；它會將 mock parity lane、live Matrix lane，以及 live Telegram 與 Discord lane 展開為平行作業。Live 作業使用 `qa-live-shared` 環境，Telegram/Discord 使用 Convex leases。

發行檢查會使用 deterministic mock provider 和 mock-qualified models（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport lane，讓頻道合約與 live model 延遲以及一般 provider-plugin 啟動隔離。Live transport 閘道會停用 memory search，因為 QA parity 會另外覆蓋記憶行為；provider 連線能力則由獨立的 live model、native provider 和 Docker provider 套件覆蓋。

Matrix 會針對排程與發行閘門使用 `--profile fast`，且只有在 checkout 的命令列介面支援時才加入 `--fail-fast`。命令列介面預設值與手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix 覆蓋分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab lane；其 QA parity 閘門會將候選與基準 pack 作為平行 lane 作業執行，接著將兩者的 artifact 下載到小型報告作業中，進行最終 parity 比較。

對於一般 PR，請遵循範圍化的 CI/check 證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意作為範圍狹窄的第一輪安全掃描器，而不是完整儲存庫掃描。每日、手動，以及非草稿拉取請求 guard 執行會掃描 Actions 工作流程程式碼，加上最高風險的 JavaScript/TypeScript 介面，並使用篩選至 high/critical `security-severity` 的高信心安全查詢。

拉取請求 guard 會保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`，或擁有程序的捆綁外掛 runtime 路徑下有變更時啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 與 macOS CodeQL 不會納入 PR 預設。

### 安全分類

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 身分驗證、密鑰、沙盒、排程與閘道基準                                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | 核心頻道實作契約，加上頻道外掛執行階段、閘道、外掛 SDK、密鑰、稽核接觸點                                                            |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、web-fetch 與外掛 SDK SSRF 政策表面                                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞，以及代理程式工具執行閘門                                                                    |
| `/codeql-security-high/process-exec-boundary`     | 本機 shell、程序產生輔助工具、擁有子程序的內建外掛執行階段，以及工作流程腳本黏合碼                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、manifest、registry、套件管理器安裝、來源載入，以及外掛 SDK 套件契約信任表面                                       |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。為 CodeQL 手動建置 Android 應用程式，使用工作流程健全性接受的最小 Blacksmith Linux 執行器。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全分片。為 CodeQL 在 Blacksmith macOS 上手動建置 macOS 應用程式，從上傳的 SARIF 中篩除相依性建置結果，並上傳至 `/codeql-critical-security/macos`。因為即使乾淨時 macOS 建置也主導執行時間，所以保留在每日預設值之外。

### Critical Quality 類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在 GitHub 託管的 Linux 執行器上，針對狹窄的高價值表面執行 error 嚴重性的非安全 JavaScript/TypeScript 品質查詢，讓品質掃描不消耗 Blacksmith 執行器註冊預算。它的 pull request 防護刻意比排程設定檔更小：非草稿 PR 只會針對代理程式命令/模型/工具執行與回覆分派程式碼、設定 schema/遷移/IO 程式碼、身分驗證/密鑰/沙盒/安全程式碼、核心頻道與內建頻道外掛執行階段、閘道協定/server-method、記憶體執行階段/SDK 黏合碼、MCP/程序/對外傳遞、提供者執行階段/模型目錄、工作階段診斷/傳遞佇列、外掛載入器、外掛 SDK/套件契約，或外掛 SDK 回覆執行階段變更，執行相符的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 與 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動分派接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用來單獨執行一個品質分片的教學/迭代掛鉤。

| 類別                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 身分驗證、密鑰、沙盒、排程與閘道安全邊界程式碼                                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | 設定 schema、遷移、正規化與 IO 契約                                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道協定 schema 與伺服器方法契約                                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心頻道與內建頻道外掛實作契約                                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段契約                                                                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及對外傳遞契約                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體外掛 SDK 別名、記憶體執行階段啟用黏合碼，以及記憶體 doctor 命令                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞輔助工具、診斷事件/記錄 bundle 表面，以及工作階段 doctor 命令列介面契約                                      |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 入站回覆分派、回覆 payload/分塊/執行階段輔助工具、頻道回覆選項、傳遞佇列，以及工作階段/thread 繫結輔助工具                                               |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者身分驗證與探索、提供者執行階段註冊、提供者預設值/目錄，以及 web/search/fetch/embedding registry                                            |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 啟動、本機持久化、閘道控制流程，以及任務控制平面執行階段契約                                                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段契約                                                                                      |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、registry、公開表面，以及外掛 SDK 進入點契約                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端外掛 SDK 來源與外掛套件契約輔助工具                                                                                                                   |

品質與安全分開保留，讓品質發現可以排程、量測、停用或擴充，而不會模糊安全訊號。Swift、Python 與內建外掛 CodeQL 擴充只應在狹窄設定檔具備穩定執行時間與訊號後，作為有範圍或分片的後續工作加回。

## 維護工作流程

### 文件代理程式

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非機器人 push CI 執行可以觸發它，手動分派也可以直接執行它。當 `main` 已經前進，或過去一小時內已建立另一個未略過的 Docs Agent 執行時，workflow-run 呼叫會略過。執行時，它會檢閱從前一個未略過 Docs Agent 來源 SHA 到目前 `main` 的 commit 範圍，因此一次每小時執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### 測試效能代理程式

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於處理緩慢測試。它沒有純排程：`main` 上成功的非機器人 push CI 執行可以觸發它，但如果當天 UTC 已有另一個 workflow-run 呼叫執行過或正在執行，它會略過。手動分派會略過該每日活動閘門。此通道會建置完整套件分組 Vitest 效能報告，讓 Codex 只進行保留涵蓋率的小型測試效能修正，而不是大範圍重構，然後重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。分組報告會記錄 Linux 與 macOS 上每個設定的 wall time 與最大 RSS，因此前後比較會在持續時間差異旁呈現測試記憶體差異。如果基準有失敗測試，Codex 只能修正明顯失敗，而且代理程式後的完整套件報告必須通過，才會提交任何內容。當機器人 push 落地前 `main` 前進時，此通道會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的過時 patch 會被略過。它使用 GitHub 託管的 Ubuntu，因此 Codex action 可以保持與文件代理程式相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是一個手動維護者工作流程，用於落地後的重複項清理。它預設為 dry-run，且只會在 `apply=true` 時關閉明確列出的 PR。在變更 GitHub 前，它會驗證落地 PR 已合併，且每個重複項都有共用的引用 issue 或重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界比廣泛 CI 平台範圍更嚴格：

- 核心 production 變更會執行核心 prod 與核心 test typecheck，加上核心 lint/guards；
- 僅核心 test 變更只會執行核心 test typecheck，加上核心 lint；
- extension production 變更會執行 extension prod 與 extension test typecheck，加上 extension lint；
- 僅 extension test 變更會執行 extension test typecheck，加上 extension lint；
- 公開外掛 SDK 或外掛契約變更會擴展到 extension typecheck，因為 extensions 依賴那些核心契約（Vitest extension sweeps 仍是明確的測試工作）；
- 僅 release metadata 的版本 bump 會執行目標式版本/設定/root-dependency 檢查；
- 未知 root/設定變更會 fail safe 到所有檢查通道。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，來源編輯優先使用明確映射，接著是 sibling 測試與 import-graph dependents。共用 group-room 傳遞設定是其中一個明確映射：對群組可見回覆設定、來源回覆傳遞模式，或 message-tool 系統提示的變更，會經由核心回覆測試加上 Discord 與 Slack 傳遞回歸測試，因此共用預設變更會在第一次 PR push 前失敗。只有當變更涉及足夠廣的 harness，使便宜的映射集合無法作為可信 proxy 時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是 repo 擁有的遠端機器包裝器，用於維護者 Linux 證明。當檢查對本機編輯迴圈來說太廣、CI
一致性很重要，或證明需要密鑰、Docker、套件通道、
可重用機器或遠端記錄時，請從 repo 根目錄使用它。一般 OpenClaw 後端是
`blacksmith-testbox`；自有 AWS/Hetzner 容量是 Blacksmith
中斷、配額問題或明確自有容量測試時的後備方案。

Crabbox 支援的 Blacksmith 執行會預熱、認領、同步、執行、回報並清理
一次性的 Testboxes。內建同步健全性檢查會在必要
根檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short`
顯示至少 200 個已追蹤刪除項目時快速失敗。對於刻意大量刪除的 PR，請為遠端命令設定
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

Crabbox 也會終止本機 Blacksmith 命令列介面呼叫，當它停留在
同步階段超過五分鐘且沒有同步後輸出時。設定
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該防護，或對異常大的本機差異使用較大的
毫秒值。

第一次執行前，請從 repo 根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo 包裝器會拒絕未宣告 `blacksmith-testbox` 的過期 Crabbox 二進位檔。即使 `.crabbox.yaml` 有自有雲預設值，也請明確傳入提供者。在 Codex 工作樹或 linked/sparse checkouts 中，避免使用本機 `pnpm crabbox:run` 指令碼，因為 pnpm 可能會在 Crabbox 啟動前協調依賴項；請改為直接呼叫 node 包裝器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 支援的執行需要 Crabbox 0.22.0 或更新版本，讓包裝器取得目前的 Testbox 同步、佇列與清理行為。使用相鄰 checkout 時，請在計時或證明工作前重建被忽略的本機二進位檔：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
```

聚焦測試重新執行：

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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

閱讀最終 JSON 摘要。有用欄位是 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。對於委派的
Blacksmith Testbox 執行，Crabbox 包裝器退出碼與 JSON 摘要就是
命令結果。連結的 GitHub Actions 執行負責 hydration 與 keepalive；當 SSH
命令已經回傳後，Testbox 從外部停止時，它可能以 `cancelled` 結束。
除非包裝器 `exitCode` 非零或命令輸出顯示測試失敗，否則請將其視為清理/狀態成品。
一次性的 Blacksmith 支援 Crabbox 執行應該會自動停止 Testbox；
如果執行被中斷或清理不明確，請檢查即時機器並只停止
你建立的機器：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要在同一個已 hydrated 機器上執行多個命令時才使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是故障層但 Blacksmith 本身可用，僅將直接
Blacksmith 用於診斷，例如 `list`、`status` 和清理。先修好
Crabbox 路徑，再把直接 Blacksmith 執行視為維護者證明。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的
warmups 幾分鐘後仍停在 `queued`，且沒有 IP 或 Actions 執行 URL，
請將其視為 Blacksmith 提供者、佇列、帳單或組織限制壓力。停止你建立的
queued ids，避免啟動更多 Testboxes，並將證明移至下方的
自有 Crabbox 容量路徑，同時讓其他人檢查 Blacksmith 儀表板、
帳單與組織限制。

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確以自有容量為目標時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務真的需要 48xlarge 等級 CPU，否則避免使用 `class=beast`。`beast` 請求從 192 vCPU 開始，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額的方式。repo 擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域，以及 `capacity.hints: true`，因此代理的 AWS leases 會列印所選區域/市場、配額壓力、Spot 後備，以及高壓力等級警告。較重的廣泛檢查使用 `fast`，只有在 standard/fast 不足時才使用 `large`，而 `beast` 只用於例外的 CPU-bound 通道，例如完整套件或全外掛 Docker 矩陣、明確的發行/阻斷驗證，或高核心效能分析。不要將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint/typecheck、小型 E2E 重現或 Blacksmith 中斷分流。容量診斷請使用 `--market on-demand`，避免 Spot 市場波動混入訊號。

`.crabbox.yaml` 擁有自有雲通道的提供者、同步與 GitHub Actions hydration 預設值。它排除本機 `.git`，使 hydrated Actions checkout 保留自己的遠端 Git 中繼資料，而不是同步維護者本機 remotes 和 object stores；它也排除不應傳輸的本機 runtime/build 成品。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、節點/pnpm 設定、`origin/main` 擷取，以及自有雲 `crabbox run --id <cbx_id>` 命令的非密鑰環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
