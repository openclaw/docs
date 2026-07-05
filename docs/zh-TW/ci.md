---
read_when:
    - 你需要了解為什麼 CI 作業有執行或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次發布驗證執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行保護傘，以及對應的本機命令
title: CI 管線
x-i18n:
    generated_at: "2026-07-05T01:54:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1420bd233290e4377b73dea864253eeb3e57b5cd626698305546bcac691840c0
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個提取請求時執行。標準的
`main` 推送會先通過 90 秒的託管執行器准入視窗。
既有的 `CI` 並行群組會在較新的
提交送達時取消那個等待中的執行，因此連續合併不會各自註冊完整的 Blacksmith
矩陣。提取請求與手動派發會略過等待。`preflight` 作業
接著會分類差異，並在只有不相關區域變更時關閉昂貴的執行線。手動
`workflow_dispatch` 執行會刻意繞過智慧範圍判定，
並為發布候選版本與廣泛驗證展開完整圖形。Android 執行線仍透過 `include_android`
維持選用。僅發布用的
外掛涵蓋範圍位於獨立的 [`Plugin Prerelease`](#plugin-prerelease)
工作流程中，且只會從 [`Full Release Validation`](#full-release-validation)
或明確的手動派發執行。

## 管線概覽

| 作業                                | 目的                                                                                                   | 執行時機                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件變更、已變更範圍、已變更擴充功能，並建置 CI 資訊清單                   | 一律在非草稿推送與 PR 上執行                  |
| `runner-admission`                 | 在註冊 Blacksmith 工作前，針對標準 `main` 推送提供託管 90 秒防抖                | 每次 CI 執行；只在標準 `main` 推送時休眠 |
| `security-fast`                    | 私鑰偵測、透過 `zizmor` 進行已變更工作流程稽核，以及正式環境 lockfile 稽核                 | 一律在非草稿推送與 PR 上執行                  |
| `check-dependencies`               | 正式環境 Knip 僅相依性檢查，加上未使用檔案允許清單防護                                 | 節點相關變更                               |
| `build-artifacts`                  | 建置 `dist/`、Control UI、已建置命令列介面冒煙檢查、嵌入式已建置成品檢查，以及可重用成品 | 節點相關變更                               |
| `checks-fast-core`                 | 快速 Linux 正確性執行線，例如 bundled、protocol、QA Smoke CI，以及 CI 路由檢查                | 節點相關變更                               |
| `checks-fast-contracts-plugins-*`  | 兩個分片的外掛合約檢查                                                                        | 節點相關變更                               |
| `checks-fast-contracts-channels-*` | 兩個分片的頻道合約檢查                                                                       | 節點相關變更                               |
| `checks-node-core-*`               | 核心節點測試分片，不含頻道、bundled、contract 與 extension 執行線                          | 節點相關變更                               |
| `check-*`                          | 分片的主要本機閘門等效項：正式環境型別、lint、防護、測試型別與嚴格冒煙                | 節點相關變更                               |
| `check-additional-*`               | 架構、分片的邊界/提示詞漂移、擴充功能防護、套件邊界與執行階段拓撲     | 節點相關變更                               |
| `checks-node-compat-node22`        | 節點 22 相容性建置與冒煙執行線                                                                | 發布用手動 CI 派發                     |
| `check-docs`                       | 文件格式化、lint 與損壞連結檢查                                                             | 文件已變更                                        |
| `skills-python`                    | 針對 Python 支援的 skills 執行 Ruff + pytest                                                                    | Python skill 相關變更                       |
| `checks-windows`                   | Windows 專屬程序/路徑測試，加上共用執行階段匯入指定器回歸檢查                      | Windows 相關變更                            |
| `macos-node`                       | 使用共用已建置成品的 macOS TypeScript 測試執行線                                               | macOS 相關變更                              |
| `macos-swift`                      | macOS 應用程式的 Swift lint、建置與測試                                                            | macOS 相關變更                              |
| `ios-build`                        | Xcode 專案產生，加上 iOS 應用程式模擬器建置                                                 | iOS 應用程式、共用 app kit，或 Swabble 變更         |
| `android`                          | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                              | Android 相關變更                            |
| `test-performance-agent`           | 在受信任活動後，每日 Codex 慢測試最佳化                                                 | 主要 CI 成功或手動派發                  |
| `openclaw-performance`             | 每日/隨選 Kova 執行階段效能報告，含 mock-provider、deep-profile 與 GPT 5.5 即時執行線 | 排程與手動派發                       |

## 快速失敗順序

1. `runner-admission` 只會等待標準 `main` 推送；較新的推送會在 Blacksmith 註冊前取消該執行。
2. `preflight` 決定哪些執行線實際存在。`docs-scope` 與 `changed-scope` 邏輯是此作業內的步驟，不是獨立作業。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 與 `skills-python` 會快速失敗，不等待較重的成品與平台矩陣作業。
4. `build-artifacts` 會與快速 Linux 執行線重疊，因此下游消費者可在共用建置準備好後立即開始。
5. 較重的平台與執行階段執行線會在之後展開：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 與 `android`。

當較新的推送送達同一個 PR 或 `main` 參照時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非同一參照的最新執行也失敗，否則將其視為 CI 雜訊。矩陣作業使用 `fail-fast: false`，而 `build-artifacts` 會直接回報嵌入式頻道、core-support-boundary 與 gateway-watch 失敗，而不是排入微小的驗證器作業。自動 CI 並行鍵已版本化 (`CI-v7-*`)，因此 GitHub 端舊佇列群組中的殭屍作業無法無限期阻塞較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>`，可摘要 GitHub Actions 的牆鐘時間、佇列時間、最慢作業、失敗項目，以及 `pnpm-store-warmup` 展開屏障。CI 也會將相同的執行摘要上傳為 `ci-timings-summary` 成品。若要查看建置時間，請檢查 `build-artifacts` 作業的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會列印 `[build-all] phase timings:` 並包含 `ui:build`；該作業也會上傳 `startup-memory` 成品。

對於提取請求執行，終端 timing-summary 作業會先從受信任的基底修訂版本執行輔助程式，再將 `GH_TOKEN` 傳給 `gh run view`。這會讓帶 token 的查詢避開分支控制的程式碼，同時仍摘要提取請求目前的 CI 執行。

## PR 情境與證據

外部貢獻者 PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR 情境與證據閘門。該工作流程會簽出受信任的
基底提交，且只評估 PR 內文；它不會執行來自
貢獻者分支的程式碼。

此閘門適用於不是儲存庫擁有者、成員、
協作者或機器人的 PR 作者。當 PR 內文包含作者撰寫的
`What Problem This Solves` 與 `Evidence` 區段時會通過。證據可以是聚焦的
測試、CI 結果、螢幕截圖、錄影、終端輸出、即時觀察、
已遮罩紀錄，或成品連結。內文提供意圖與實用驗證；
審查者會檢查程式碼、測試與 CI 以評估正確性。

當檢查失敗時，請更新 PR 內文，而不是再推送另一個程式碼提交。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動派發會略過 changed-scope 偵測，並讓 preflight 資訊清單表現得像每個作用範圍區域都已變更。

- **CI 工作流程編輯**會驗證節點 CI 圖形與工作流程 lint，但不會單獨強制執行 Windows、iOS、Android 或 macOS 原生建置；這些平台執行線仍限定於平台原始碼變更。
- **Workflow Sanity** 會針對所有工作流程 YAML 檔案執行 `actionlint`、`zizmor`、複合動作插值防護，以及衝突標記防護。PR 作用範圍的 `security-fast` 作業也會針對已變更工作流程檔案執行 `zizmor`，使工作流程安全性發現能在主要 CI 圖形中提早失敗。
- **`main` 推送上的文件**會由獨立的 `Docs` 工作流程檢查，並使用與 CI 相同的 ClawHub 文件鏡像，因此混合程式碼+文件的推送不會也排入 CI `check-docs` 分片。提取請求與手動 CI 在文件變更時仍會從 CI 執行 `check-docs`。
- **TUI PTY** 會在 `checks-node-core-runtime-tui-pty` Linux 節點分片中針對 TUI 變更執行。該分片會以 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋確定性的 `TuiBackend` fixture 執行線，以及較慢、只模擬外部模型端點的 `tui --local` 冒煙測試。
- **僅 CI 路由的編輯、選定的低成本核心測試 fixture 編輯，以及狹窄的外掛合約輔助程式/測試路由編輯**會使用快速的僅節點資訊清單路徑：`preflight`、security，以及單一 `checks-fast-core` 任務。當變更僅限於該快速任務直接演練的路由或輔助程式表面時，此路徑會略過建置成品、節點 22 相容性、頻道合約、完整核心分片、bundled-plugin 分片，以及額外防護矩陣。
- **Windows 節點檢查**的範圍限定於 Windows 專屬程序/路徑包裝器、npm/pnpm/UI 執行器輔助程式、套件管理器設定，以及執行該執行線的 CI 工作流程表面；不相關的原始碼、外掛、install-smoke 與僅測試變更會留在 Linux 節點執行線上。

最慢的節點測試系列會被拆分或平衡，讓每個作業保持小型且不過度預留執行器：外掛合約與頻道合約各自作為兩個加權、由 Blacksmith 支援的分片執行，並具備標準 GitHub 執行器後援；核心單元快速/支援執行線分開執行；核心執行階段基礎設施拆分為 state、process/config、shared，以及三個排程網域分片；auto-reply 以平衡工作器執行（reply 子樹拆分為 agent-runner、dispatch、commands/state-routing 分片）；agentic 閘道/server 設定則拆分到 chat/auth/model/http-plugin/runtime/startup 執行線，而不是等待建置成品。一般 CI 接著只會把隔離的基礎設施 include-pattern 分片封裝成最多 64 個測試檔案的確定性套件，減少節點矩陣，而不合併非隔離的 command/cron、具狀態的 agents-core，或 gateway/server 套件；繁重的固定套件維持使用 8 vCPU，而封裝後與較低權重的執行線使用 4 vCPU。標準儲存庫上的 pull request 會使用額外的精簡准入計畫：相同的逐設定群組會在目前 34 作業的 Linux 節點計畫內，以隔離子程序執行，因此單一 PR 不會註冊完整的 70 多作業節點矩陣。`main` 推送、手動 dispatch，以及 release gate 會保留完整矩陣。廣泛的瀏覽器、QA、媒體，以及其他雜項外掛測試會使用各自專用的 Vitest 設定，而不是共用的外掛 catch-all。Include-pattern 分片會使用 CI 分片名稱記錄 timing entries，因此 `.artifacts/vitest-shard-timings.json` 可以區分完整設定與已篩選分片。`check-additional-*` 會把套件邊界編譯/canary 工作放在一起，並將執行階段拓撲架構與閘道 watch 覆蓋分開；邊界 guard 清單會條帶化為一個 prompt-heavy 分片，以及另一個合併分片用於其餘 guard 條帶，每個分片會並行執行選取的獨立 guards，並列印逐檢查 timing。昂貴的 Codex happy-path prompt snapshot drift 檢查會作為自己的額外作業，只在手動 CI 與影響 prompt 的變更中執行，因此一般不相關的節點變更不會等待冷啟動 prompt snapshot 產生，邊界分片也能保持平衡，同時 prompt drift 仍會固定到造成它的 PR；相同旗標也會在 built-artifact core support-boundary 分片內略過 prompt snapshot Vitest 產生。閘道 watch、頻道測試，以及 core support-boundary 分片會在 `build-artifacts` 內，於 `dist/` 和 `dist-runtime/` 已建置後並行執行。

准入後，標準 Linux CI 允許最多 24 個並行節點測試作業，以及
12 個較小的 fast/check 執行線；Windows 和 Android 維持在兩個，因為
這些執行器池較窄。

精簡 PR 計畫會為目前套件發出 18 個節點作業：whole-config
群組會在隔離子程序中批次執行，批次逾時為 120 分鐘，
而 include-pattern 群組共用相同的有界作業預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test 執行線仍會使用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送時重複執行 debug APK packaging 作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（production Knip dependency-only pass，固定使用最新 Knip 版本，並針對 `dlx` 安裝停用 pnpm 的 minimum release age）以及 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file findings 與 `scripts/deadcode-unused-files.allowlist.mjs` 比較。當 PR 新增未審查的 unused file，或留下過期 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的有意動態外掛、generated、build、live-test，以及 package bridge surfaces。

## ClawSweeper 活動轉發

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request 程式碼。該 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload dispatch 到 `openclaw/clawsweeper`。

該 workflow 有四個執行線：

- `clawsweeper_item` 用於精確的 issue 與 pull request review request；
- `clawsweeper_comment` 用於 issue comments 中明確的 ClawSweeper commands；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit-level review requests；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub 活動。

`github_activity` 執行線只會轉發正規化 metadata：event type、action、actor、repository、item number、URL、title、state，以及存在時的 comments 或 reviews 短摘錄。它刻意避免轉發完整 webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，會將正規化事件張貼到供 ClawSweeper agent 使用的 OpenClaw 閘道 hook。

一般活動是觀察，而不是預設交付。ClawSweeper agent 會在其 prompt 中收到 Discord target，且只應在事件令人意外、可採取行動、有風險，或對營運有用時張貼到 `#clawsweeper`。例行 opens、edits、bot churn、重複 webhook noise，以及一般 review traffic 應產生 `NO_REPLY`。

在整條路徑中，請將 GitHub titles、comments、bodies、review text、branch names，以及 commit messages 視為不受信任的資料。它們是 summarization 和 triage 的輸入，而不是 workflow 或 agent runtime 的指令。

## 手動 dispatch

手動 CI dispatch 會執行與一般 CI 相同的作業圖，但強制啟用每個非 Android scoped lane：Linux 節點分片、bundled-plugin 分片、外掛與頻道合約分片、節點 22 compatibility、`check-*`、`check-additional-*`、built-artifact smoke checks、docs checks、Python Skills、Windows、macOS、iOS build，以及 Control UI i18n。獨立手動 CI dispatch 只有在 `include_android=true` 時執行 Android；完整 release umbrella 會透過傳遞 `include_android=true` 啟用 Android。外掛 prerelease static checks、release-only `agentic-plugins` 分片、完整 extension batch sweep，以及外掛 prerelease Docker 執行線會從 CI 排除。Docker prerelease suite 只會在 `Full Release Validation` 以啟用 release-validation gate 的方式 dispatch 個別的 `Plugin Prerelease` workflow 時執行。

手動執行會使用唯一的 concurrency group，因此 release-candidate full suite 不會被相同 ref 上的另一個 push 或 PR run 取消。選用的 `target_ref` input 讓受信任呼叫端可以對 branch、tag，或完整 commit SHA 執行該圖，同時使用所選 dispatch ref 中的 workflow file。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月 npm-only extended-stable 路徑是例外：請從精確的
`extended-stable/YYYY.M.33` branch dispatch `OpenClaw NPM
Release` preflight 與 `Full Release Validation`，保留其 run IDs，並將兩個 ID 傳遞給
direct npm publish run。請參閱[每月 npm-only extended-stable
發佈](/zh-TW/reference/RELEASING#monthly-npm-only-extended-stable-publication)，了解
commands、精確身份要求、registry readback，以及 selector
repair procedure。此路徑不會 dispatch 外掛、macOS、Windows、GitHub
Release、private dist-tag，或其他平台發佈。

## 執行器

| 執行器                          | 作業                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI dispatch 與非標準儲存庫後援、CodeQL JavaScript/actions quality scans、workflow-sanity、labeler、auto-response、CI 以外的 docs workflows，以及 install-smoke preflight，讓 Blacksmith 矩陣可以更早排隊                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、較低權重的 extension 分片、除 QA Smoke CI 以外的 `checks-fast-core`、外掛/頻道合約分片、大多數 bundled/較低權重的 Linux 節點分片、`check-guards`、`check-prod-types`、`check-test-types`、選取的 `check-additional-*` 分片，以及 `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的繁重 Linux 節點套件、boundary/extension-heavy `check-additional-*` 分片，以及 `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI 與 Testbox 中的 `build-artifacts`、`check-lint`（CPU-sensitive 到 8 vCPU 的成本高於節省）；install-smoke Docker builds（32-vCPU queue time 的成本高於節省）                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；forks 會後援到 `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 和 `ios-build`；forks 會後援到 `macos-26`                                                                                                                                                                                                                     |

## 執行器註冊預算

OpenClaw 目前的 GitHub runner-registration bucket 在 `ghx api rate_limit` 中回報每 5 分鐘 10,000 個 self-hosted
runner registrations。每次 tuning pass 前都要重新檢查
`actions_runner_registration`，因為 GitHub 可能會變更
此 bucket。該 limit 由 `openclaw` organization 中所有 Blacksmith runner registrations 共用，因此新增另一個 Blacksmith installation 不會新增
新的 bucket。

請將 Blacksmith labels 視為 burst control 的稀缺資源。只負責 route、notify、summarize、select shards，或執行短 CodeQL scans 的作業，應維持在 GitHub-hosted runners，除非它們有已量測的 Blacksmith-specific
需求。任何新的 Blacksmith matrix、更大的 `max-parallel`，或高頻率
workflow，都必須呈現其 worst-case registration count，並讓 org-level
target 維持在 live bucket 約 60% 以下。以目前 10,000-registration
bucket 來說，這代表 6,000-registration operating target，為
concurrent repositories、retries，以及 burst overlap 保留餘裕。

標準儲存庫 CI 會讓 Blacksmith 作為一般 push 與 pull-request runs 的預設執行器路徑。`workflow_dispatch` 與非標準儲存庫執行會使用 GitHub-hosted runners，但一般標準執行目前不會探測 Blacksmith queue health，也不會在 Blacksmith 無法使用時自動後援到 GitHub-hosted labels。

## 本機等效項目

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

`OpenClaw Performance` 是產品/執行階段效能工作流程。它每天在 `main` 上執行，也可以手動分派：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動分派通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對發行標籤或其他分支進行基準測試。已發布的報告路徑與最新指標會依測試的 ref 建立索引，而每個 `index.md` 都會記錄測試的 ref/SHA、工作流程 ref/SHA、Kova ref、設定檔、執行線驗證模式、模型、重複次數與情境篩選條件。

此工作流程會從固定版本安裝 OCM，並從 `openclaw/Kova` 依固定的 `kova_ref` 輸入安裝 Kova，接著執行三條執行線：

- `mock-provider`：針對本機建置執行階段執行 Kova 診斷情境，並使用確定性的假 OpenAI 相容驗證。
- `mock-deep-profile`：針對啟動、閘道與代理回合熱點進行 CPU/heap/trace profiling。
- `live-openai-candidate`：真實的 OpenAI `openai/gpt-5.5` 代理回合；當 `OPENAI_API_KEY` 不可用時會略過。

mock-provider 執行線也會在 Kova 通過後執行 OpenClaw 原生原始碼探針：預設、hook 與 50 外掛啟動案例中的閘道啟動時間與記憶體；內建外掛匯入 RSS、重複 mock-OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道的命令列介面啟動命令，以及 SQLite 狀態 smoke 效能探針。當測試 ref 有上一份已發布的 mock-provider 原始碼報告可用時，原始碼摘要會將目前的 RSS 與 heap 值和該基準比較，並將大幅 RSS 增加標記為 `watch`。原始碼探針 Markdown 摘要位於報告 bundle 中的 `source/index.md`，旁邊有原始 JSON。

每條執行線都會上傳 GitHub artifact。當設定了 `CLAWGRIT_REPORTS_TOKEN` 時，此工作流程也會將 `report.json`、`report.md`、bundle、`index.md` 與原始碼探針 artifact 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 下。目前測試 ref 的指標會寫入 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發行驗證

`Full Release Validation` 是用於「發行前執行所有項目」的手動總括工作流程。它接受分支、標籤或完整 commit SHA，使用該目標分派手動 `CI` 工作流程，為僅發行用的外掛/套件/靜態/Docker 證明分派 `Plugin Prerelease`，並為安裝 smoke、套件接受度、跨作業系統套件檢查、從 QA profile 證據算繪成熟度計分卡、QA Lab parity、Matrix 與 Telegram 執行線分派 `OpenClaw Release Checks`。stable 與 full profile 一律包含完整的 live/E2E 與 Docker 發行路徑 soak 涵蓋；beta profile 可透過 `run_release_soak=true` 選擇加入。標準套件 Telegram E2E 會在 Package Acceptance 內執行，因此完整候選不會啟動重複的 live poller。發布後，傳入 `release_package_spec` 可在 release checks、Package Acceptance、Docker、跨作業系統與 Telegram 中重用已出貨的 npm 套件，而不需重新建置。只有在聚焦重新執行已發布套件 Telegram 時，才使用 `npm_telegram_package_spec`。Codex 外掛 live package 執行線預設使用相同的已選狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/artifact 執行會從已選 ref 打包 `extensions/codex`。若要使用自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` spec，請明確設定 `codex_plugin_spec`。

請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、確切的工作流程 job 名稱、profile 差異、artifact 與聚焦重新執行 handle。

`OpenClaw Release Publish` 是手動的變更型發行工作流程。在發行標籤存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.PATCH` 或 `main` 分派它。它會驗證 `pnpm plugins:sync:check`，為所有可發布外掛套件分派 `Plugin NPM Release`，為同一個發行 SHA 分派 `Plugin ClawHub Release`，接著才會使用已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。Stable 發布也需要精確的 `windows_node_tag`；在任何發布子流程前，此工作流程會驗證 Windows 原始碼發行，並將其 x64/ARM64 安裝程式與候選已核准的 `windows_node_installer_digests` 輸入比較，接著在發布 GitHub release draft 前，提升並驗證相同固定的安裝程式 digest，加上精確的 companion asset 與 checksum contract。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動分支上提供固定 commit 證明，請使用 helper，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程分派 ref 必須是分支或標籤，不能是原始 commit SHA。此 helper 會在目標 SHA 推送臨時 `release-ci/<sha>-...` 分支，從該固定 ref 分派 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成後刪除臨時分支。總括驗證器也會在任何子工作流程於不同 SHA 執行時失敗。

`release_profile` 會控制傳入 release checks 的 live/provider 廣度。手動發行工作流程預設為 `stable`；只有在你刻意想要廣泛的 advisory provider/media 矩陣時才使用 `full`。Stable 與 full release checks 一律執行完整的 live/E2E 與 Docker 發行路徑 soak；beta profile 可透過 `run_release_soak=true` 選擇加入。

- `minimum` 保留最快的 OpenAI/核心發行關鍵執行線。
- `stable` 加入 stable provider/backend 集合。
- `full` 執行廣泛的 advisory provider/media 矩陣。

總括流程會記錄已分派的子執行 ID，而最後的 `Verify full validation` job 會重新檢查目前子執行結論，並為每個子執行附加最慢 job 表格。如果重新執行某個子工作流程並轉為綠燈，只需重新執行父層驗證器 job，即可重新整理總括結果與時間摘要。

若要復原，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。對發行候選使用 `all`，僅對一般完整 CI 子流程使用 `ci`，僅對外掛 prerelease 子流程使用 `plugin-prerelease`，對每個發行子流程使用 `release-checks`，或在總括流程上使用較窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能讓失敗的發行 box 在聚焦修正後進行有界限的重新執行。若單一跨作業系統執行線失敗，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合，例如 `windows/packaged-upgrade`；長時間的跨作業系統命令會輸出心跳偵測行，而 packaged-upgrade 摘要會包含各階段時間。QA release-check 執行線皆為 advisory，但標準 runtime tool coverage gate 例外；當必要的 OpenClaw dynamic tools 在 standard tier summary 中漂移或消失時，該 gate 會阻擋。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將已選 ref 解析一次為 `release-package-under-test` tarball，然後將該 artifact 傳給跨作業系統檢查與 Package Acceptance，若執行 soak coverage，也會傳給 live/E2E 發行路徑 Docker 工作流程。這能讓各發行 box 的套件位元組保持一致，並避免在多個子 job 中重複打包同一個候選。對於 Codex npm-plugin live 執行線，release checks 會傳入從 `release_package_spec` 衍生的相符已發布外掛 spec、傳入操作員提供的 `codex_plugin_spec`，或將輸入留空，讓 Docker script 打包已選 checkout 的 Codex 外掛。

重複的 `ref=main` 且 `rerun_group=all` 的 `Full Release Validation` 執行會取代較舊的總括流程。當父流程被取消時，父層監視器會取消它已分派的任何子工作流程，因此較新的 main 驗證不會排在過時的兩小時 release-check 執行之後。發行分支/標籤驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## Live 與 E2E shard

發行 live/E2E 子流程保留廣泛的原生 `pnpm test:live` 涵蓋，但它會透過 `scripts/test-live-shard.mjs` 以命名 shard 執行，而不是單一序列 job：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 依 provider 篩選的 `native-live-src-gateway-profiles` job
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的 media audio/video shard 與依 provider 篩選的 music shard

這會保留相同的檔案涵蓋範圍，同時讓緩慢的 live provider 失敗更容易重新執行與診斷。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` shard 名稱仍可用於手動一次性重新執行。

原生 live media shard 會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，此映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 與 `ffprobe`；media job 只會在設定前驗證二進位檔。請將 Docker 支援的 live suites 保持在一般 Blacksmith runner 上，容器 job 不適合啟動巢狀 Docker 測試。

以 Docker 支援的即時模型/後端分片會針對每個選取的提交使用個別共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發行工作流程會建置並推送該映像一次，接著 Docker 即時模型、依提供者分片的閘道、命令列介面後端、ACP 繫結，以及 Codex harness 分片都會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片會在工作流程作業逾時之前帶有明確的指令碼層級 `timeout` 上限，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個發行檢查預算。如果這些分片各自重新建置完整的原始碼 Docker 目標，代表發行執行設定錯誤，並會在重複映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證原始碼樹，而套件驗收會透過使用者在安裝或更新後執行的相同 Docker E2E harness，驗證單一 tarball。

### 作業

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選項、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 與 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備套件摘要 Docker 映像，並針對該套件執行選取的 Docker lanes，而不是打包工作流程 checkout。當某個 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件與共用映像一次，然後將這些 lanes 展開為平行的目標 Docker 作業，並各自產生唯一成品。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行；若套件驗收已解析出一個套件，則安裝相同的 `package-under-test` 成品；獨立 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker 驗收或可選 Telegram lane 失敗時使工作流程失敗。

### 候選來源

- `source=npm` 僅接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。用於已發布的 extended-stable、預發行或 stable 驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤、驗證選取的提交可從儲存庫分支歷史或發行標籤到達、在 detached worktree 中安裝相依項，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 憑證、非預設 HTTPS 連接埠、私有/內部/特殊用途主機名稱或解析出的 IP，以及重新導向到相同公開安全政策以外的目標。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名 trusted-source 政策下載 HTTPS `.tgz`；必須提供 `package_sha256` 和 `trusted_source_id`。僅在維護者擁有的企業鏡像或私人套件儲存庫需要設定主機、連接埠、路徑前綴、重新導向主機或私有網路解析時使用。如果政策宣告 bearer auth，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；URL 內嵌憑證仍會被拒絕。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 可選，但對外部共享成品應提供。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是 `source=ref` 時會被打包的來源提交。這讓目前的測試 harness 能驗證較舊的受信任來源提交，而不執行舊的工作流程邏輯。

### 套件 profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發行路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` profile 使用離線外掛涵蓋範圍，因此已發布套件驗證不會受限於即時 ClawHub 可用性。可選 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm spec 路徑供獨立 dispatch 使用。

如需專用的更新與外掛測試政策，包括本機命令、Docker lanes、套件驗收輸入、發行預設值與失敗分診，請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發行檢查會以 `source=artifact`、已準備好的發行套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、即時 ClawHub skill install、過期外掛相依項清理、已設定外掛安裝修復、離線外掛、外掛更新，以及 Telegram proof 都在相同已解析的套件 tarball 上執行。在發布 beta 後，於 Full Release Validation 或 OpenClaw Release Checks 設定 `release_package_spec`，即可針對已發布的 npm 套件執行相同矩陣而無需重新建置；只有當套件驗收需要使用不同於其餘發行驗證的套件時，才設定 `package_acceptance_package_spec`。跨 OS 發行檢查仍涵蓋 OS 特定的 onboarding、安裝程式與平台行為；套件/更新產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker lane 會在阻擋式發行路徑中，每次執行驗證一個已發布套件基準。在套件驗收中，解析出的 `package-under-test` tarball 一律是候選項，而 `published_upgrade_survivor_baseline` 會選取 fallback 已發布基準，預設為 `openclaw@latest`；失敗 lane 的重新執行命令會保留該基準。當 Full Release Validation 設定 `run_release_soak=true` 或 `release_profile=full` 時，會將 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 與 `published_upgrade_survivor_scenarios=reported-issues` 設定為跨越最新四個 stable npm 發行版，加上固定的外掛相容性邊界發行版，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定 OpenClaw 外掛安裝、tilde 記錄路徑與過期 legacy 外掛相依項根目錄的 issue-shaped fixtures。多基準 published-upgrade survivor 選項會依基準分片為個別目標 Docker runner 作業。獨立的 `Update Migration` 工作流程會使用 `update-migration` Docker lane，搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`，用於問題是徹底的已發布更新清理，而非一般 Full Release CI 廣度時。本機彙總執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 specs，透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用情境矩陣。已發布 lane 會以內建的 `openclaw config set` 命令 recipe 設定基準、在 `summary.json` 中記錄 recipe 步驟，並在閘道啟動後探測 `/healthz`、`/readyz` 與 RPC 狀態。Windows packaged 與 installer fresh lanes 也會驗證已安裝套件可從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 在設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因此安裝與閘道 proof 會維持在 GPT-5 測試模型，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

套件驗收針對已發布套件有有限的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中的已知私人 QA 項目可指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的 fake git fixture 中修剪缺漏的 pnpm `patchedDependencies`，並可記錄缺漏的持久化 `update.channel`；
- 外掛 smokes 可讀取 legacy 安裝記錄位置，或接受缺漏 marketplace 安裝記錄持久化；
- `plugin-update` 可允許設定中繼資料遷移，同時仍要求安裝記錄與 no-reinstall 行為保持不變。

已發布的 `2026.4.26` 套件也可針對已發行的本機建置中繼資料 stamp 檔案發出警告。較新的套件必須滿足現代契約；相同條件會失敗，而不是警告或略過。

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

# Validate the published extended-stable package with package coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane logs、phase timings 與 rerun commands。請優先重新執行失敗的套件 profile 或精確 Docker lanes，而不是重新執行完整發行驗證。

## 安裝 smoke

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用相同的 scope 指令碼。它會將 smoke 涵蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/套件介面、內建外掛套件/資訊清單變更，或 Docker 冒煙作業會涵蓋的核心外掛/頻道/閘道/外掛 SDK 介面的提取請求執行。僅原始碼的內建外掛變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查命令列介面、執行 agents delete shared-workspace 命令列介面冒煙測試、執行容器 gateway-network e2e、驗證內建延伸功能建置參數，並在 240 秒的彙總命令逾時內執行有界限的內建外掛 Docker profile（每個情境的 Docker 執行會分別設上限）。
- **完整路徑**會保留 QR 套件安裝與安裝程式 Docker/更新涵蓋範圍，供夜間排程執行、手動派發、workflow-call 發行檢查，以及確實觸及安裝程式/套件/Docker 介面的提取請求使用。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 冒煙映像，接著以獨立作業執行 QR 套件安裝、根 Dockerfile/閘道冒煙測試、安裝程式/更新冒煙測試，以及快速內建外掛 Docker E2E，讓安裝程式工作不必等待根映像冒煙測試。

`main` 推送（包含合併提交）不會強制使用完整路徑；當變更範圍邏輯會在推送上要求完整涵蓋時，工作流程會保留快速 Docker 冒煙測試，並將完整安裝冒煙測試留給夜間或發行驗證。

緩慢的 Bun 全域安裝 image-provider 冒煙測試會另外由 `run_bun_global_install_smoke` 控制。它會在夜間排程與發行檢查工作流程中執行，手動 `Install Smoke` 派發也可以選擇啟用它，但提取請求與 `main` 推送不會執行。一般 PR CI 仍會針對節點相關變更執行快速 Bun 啟動器迴歸 lane。QR 與安裝程式 Docker 測試會保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 供安裝程式/更新/外掛相依性 lane 使用的裸節點/Git runner；
- 將同一個 tarball 安裝到 `/app` 的功能映像，供一般功能 lane 使用。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選定的計畫。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主集區 slot 數量。                                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對 provider 敏感的尾端集區 slot 數量。                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider 節流。                                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行多服務 lane 上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，避免 Docker daemon create 風暴；設為 `0` 表示不錯開。                |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的備援逾時（120 分鐘）；選定的 live/tail lane 會使用更嚴格的上限。                  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定  | `1` 會列印排程器計畫而不執行 lane。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定  | 以逗號分隔的精確 lane 清單；會略過清理冒煙測試，讓 agent 能重現單一失敗 lane。                |

比其有效上限更重的 lane 仍可從空集區啟動，然後單獨執行直到釋放容量。本機彙總流程會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、輸出作用中 lane 狀態、持久化 lane 計時以便最長優先排序，並預設在第一次失敗後停止排程新的集區 lane。

### 可重用的 live/E2E 工作流程

可重用的 live/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、lane 與憑證涵蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件 artifact，或從 `package_artifact_run_id` 下載套件 artifact；驗證 tarball 清單；當計畫需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件摘要標記的裸/功能 GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或既有套件摘要映像，而不是重新建置。Docker 映像拉取會以每次嘗試 180 秒的有界逾時重試，因此卡住的 registry/cache stream 會快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發行路徑分塊

發行 Docker 涵蓋範圍會執行較小的分塊作業，並使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每個分塊只會拉取所需的映像種類，並透過同一個加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker 分塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 外掛套件 lane，會安裝候選 OpenClaw 套件，從 `codex_plugin_spec` 或同 ref tarball 安裝 Codex 外掛並取得明確的 Codex 命令列介面安裝核准，執行 Codex 命令列介面預檢，然後針對 OpenAI 執行多個同一 session 的 OpenClaw agent turn。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總外掛/runtime 別名。`install-e2e` lane 別名仍是兩個 provider 安裝程式 lane 的彙總手動重新執行別名。

當完整發行路徑涵蓋範圍要求 OpenWebUI 時，它會被併入 `plugins-runtime-services`，且只為僅 OpenWebUI 的派發保留獨立的 `openwebui` 分塊。內建頻道更新 lane 會針對暫時性 npm 網路失敗重試一次。

每個分塊都會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢速 lane 表格，以及每個 lane 的重新執行命令。工作流程的 `docker_lanes` 輸入會針對已準備的映像執行選定 lane，而不是執行分塊作業，這會將失敗 lane 偵錯限制在一個目標 Docker 作業中，並為該次執行準備、下載或重用套件 artifact；如果選定 lane 是 live Docker lane，目標作業會在本機建置 live-test 映像以供該次重新執行使用。產生的每個 lane GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 與已準備映像輸入，因此失敗 lane 可以重用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E 工作流程每天執行完整的發行路徑 Docker 套件。

## 外掛預先發行

`Plugin Prerelease` 是成本較高的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確操作員派發的獨立工作流程。一般提取請求、`main` 推送，以及獨立手動 CI 派發都會停用該套件。它會在八個延伸功能 worker 之間平衡內建外掛測試；這些延伸功能分片作業一次最多執行兩個外掛設定群組，每個群組使用一個 Vitest worker，並配置較大的節點 heap，讓 import-heavy 的外掛批次不會建立額外 CI 作業。僅發行使用的 Docker 預先發行路徑會以小群組批次處理目標 Docker lane，避免為一到三分鐘的作業保留數十個 runner。該工作流程也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` artifact；inspector findings 是分流輸入，不會改變阻擋性的外掛預先發行 gate。

## QA Lab

QA Lab 在主要 smart-scoped 工作流程之外有專用 CI lane。Agentic parity 會巢狀放在廣泛 QA 與發行 harness 之下，而不是獨立的 PR 工作流程。當 parity 應與廣泛驗證執行同行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會每晚在 `main` 上執行，也可手動派發；它會將 mock parity lane、live Matrix lane，以及 live Telegram 與 Discord lane 展開為平行作業。Live 作業使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex leases。

發行檢查會使用決定性的 mock provider 與符合 mock 資格的模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport lane，因此頻道合約會與 live model 延遲和一般 provider 外掛啟動隔離。live transport 閘道會停用 memory search，因為 QA parity 會分別涵蓋 memory 行為；provider 連線能力由獨立的 live model、native provider 與 Docker provider 套件涵蓋。

Matrix 會針對排程與發行 gate 使用 `--profile fast`，並只在 checkout 出來的命令列介面支援時加入 `--fail-fast`。命令列介面預設值與手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 派發永遠會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab lane；其 QA parity gate 會將候選與 baseline pack 作為平行 lane 作業執行，然後將兩者 artifact 下載到小型報告作業中，進行最終 parity 比較。

對於一般 PR，請遵循範圍化 CI/檢查證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意作為窄範圍的第一輪安全掃描器，而不是完整儲存庫掃描。每日、手動與非草稿提取請求 guard 執行會掃描 Actions 工作流程程式碼，加上最高風險的 JavaScript/TypeScript 介面，並使用高信心安全查詢，篩選到 high/critical `security-severity`。

提取請求 guard 保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或擁有 process 的內建外掛 runtime 路徑底下的變更啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 與 macOS CodeQL 不會納入 PR 預設值。

### 安全類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、secrets、sandbox、排程與閘道基準                                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | 核心 channel 實作合約，加上 channel 外掛執行階段、閘道、外掛 SDK、secrets、audit 接觸點                                            |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、network guard、web-fetch，以及外掛 SDK SSRF 政策表面                                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers、process execution helpers、outbound delivery，以及 agent tool-execution gates                                          |
| `/codeql-security-high/process-exec-boundary`     | 本機 shell、process spawn helpers、擁有 subprocess 的 bundled 外掛執行階段，以及 workflow script glue                               |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、loader、manifest、registry、package-manager install、source-loading，以及外掛 SDK package contract 信任表面               |

### 平台特定安全性分片

- `CodeQL Android Critical Security` — 排程的 Android 安全性分片。為 CodeQL 手動建置 Android app，使用 workflow sanity 接受的最小 Blacksmith Linux runner。上傳到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動的 macOS 安全性分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中濾除相依性建置結果，並上傳到 `/codeql-critical-security/macos`。因為即使乾淨時 macOS 建置也主導執行時間，所以保留在每日預設之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是相對應的非安全性分片。它只在 GitHub-hosted Linux runners 上，針對狹窄的高價值表面執行 error-severity、非安全性的 JavaScript/TypeScript 品質查詢，讓品質掃描不會消耗 Blacksmith runner-registration 預算。其 pull request guard 刻意比排程 profile 更小：非 draft PR 只會針對 agent command/model/tool execution 與 reply dispatch code、config schema/migration/IO code、auth/secrets/sandbox/security code、核心 channel 與 bundled channel 外掛執行階段、gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、plugin loader、外掛 SDK/package-contract，或外掛 SDK reply runtime 變更，執行相對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 與 `plugin-sdk-reply-runtime` 分片。CodeQL config 與 quality workflow 變更會執行全部十二個 PR quality 分片。

手動 dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄 profile 是用於單獨執行一個品質分片的教學/反覆運算 hook。

| 類別                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth、secrets、sandbox、排程與閘道安全性邊界程式碼                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Config schema、migration、normalization 與 IO 合約                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道 protocol schemas 與 server method 合約                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心 channel 與 bundled channel 外掛實作合約                                                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution、model/provider dispatch、auto-reply dispatch 與 queues，以及 ACP control-plane runtime 合約                                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers 與 tool bridges、process supervision helpers，以及 outbound delivery 合約                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK、memory runtime facades、memory 外掛 SDK aliases、memory runtime activation glue，以及 memory doctor commands                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals、session delivery queues、outbound session binding/delivery helpers、diagnostic event/log bundle 表面，以及 session doctor 命令列介面合約   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK inbound reply dispatch、reply payload/chunking/runtime helpers、channel reply options、delivery queues，以及 session/thread binding helpers               |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization、provider auth 與 discovery、provider runtime registration、provider defaults/catalogs，以及 web/search/fetch/embedding registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap、local persistence、閘道 control flows，以及 task control-plane runtime 合約                                                                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、media IO、media understanding、image-generation，以及 media-generation runtime 合約                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Loader、registry、public-surface，以及外掛 SDK entrypoint 合約                                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布 package-side 外掛 SDK source 與 plugin package contract helpers                                                                                            |

品質與安全性保持分離，讓品質 findings 可以在不模糊安全性訊號的情況下被排程、量測、停用或擴充。Swift、Python 與 bundled-plugin CodeQL 擴充，應只在狹窄 profile 具備穩定執行時間與訊號後，作為 scoped 或 sharded follow-up work 加回來。

## 維護 workflows

### Docs Agent

`Docs Agent` workflow 是事件驅動的 Codex 維護 lane，用於讓現有 docs 與最近 landed 的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI run 可以觸發它，manual dispatch 也可以直接執行它。Workflow-run invocation 會在 `main` 已推進，或過去一小時內已建立另一個 non-skipped Docs Agent run 時跳過。當它執行時，會 review 從前一個 non-skipped Docs Agent source SHA 到目前 `main` 的 commit range，因此每小時一次的 run 可以涵蓋自上次 docs pass 後累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` workflow 是事件驅動的 Codex 維護 lane，用於慢速測試。它沒有純排程：`main` 上成功的非 bot push CI run 可以觸發它，但如果另一個 workflow-run invocation 已經在該 UTC 日執行過或正在執行，它會跳過。Manual dispatch 會繞過該每日活動 gate。此 lane 會建置 full-suite grouped Vitest performance report，允許 Codex 只進行小型且保留 coverage 的 test performance fixes，而不是大範圍 refactors，接著重新執行 full-suite report，並拒絕降低 passing baseline test count 的變更。Grouped report 會記錄 Linux 與 macOS 上每個 config 的 wall time 與 max RSS，因此 before/after 比較會在 duration deltas 旁呈現 test memory deltas。如果 baseline 有 failing tests，Codex 只能修正明顯失敗，且 after-agent full-suite report 必須通過才會提交任何內容。當 `main` 在 bot push landed 之前推進時，此 lane 會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的 stale patches 會被跳過。它使用 GitHub-hosted Ubuntu，讓 Codex action 能保持與 docs agent 相同的 drop-sudo 安全姿態。

### Merge 後的重複 PR

`Duplicate PRs After Merge` workflow 是供 maintainer 進行 post-land duplicate cleanup 的手動 workflow。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在修改 GitHub 之前，它會驗證 landed PR 已 merged，且每個 duplicate 都有共用的 referenced issue 或重疊的 changed hunks。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機 check gates 與 changed routing

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機 check gate 對 architecture boundaries 的要求比廣泛的 CI platform scope 更嚴格：

- core production 變更會執行 core prod 與 core test typecheck，加上 core lint/guards；
- core test-only 變更只會執行 core test typecheck 加上 core lint；
- extension production 變更會執行 extension prod 與 extension test typecheck，加上 extension lint；
- extension test-only 變更會執行 extension test typecheck 加上 extension lint；
- public 外掛 SDK 或 plugin-contract 變更會擴展到 extension typecheck，因為 extensions 相依於那些 core contracts（Vitest extension sweeps 仍然是明確的 test work）；
- release metadata-only version bumps 會執行 targeted version/config/root-dependency checks；
- unknown root/config 變更會 fail safe 到所有 check lanes。

本機 changed-test routing 位於 `scripts/test-projects.test-support.mjs`，並且刻意比 `check:changed` 更便宜：直接 test edits 會執行自身，source edits 優先使用 explicit mappings，接著是 sibling tests 與 import-graph dependents。Shared group-room delivery config 是 explicit mappings 之一：對 group visible-reply config、source reply delivery mode，或 message-tool system prompt 的變更，會 route through core reply tests 加上 Discord 與 Slack delivery regressions，因此 shared default 變更會在第一次 PR push 前失敗。只有當變更廣泛到 harness-wide、便宜的 mapped set 不是可信 proxy 時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是 repo 擁有的遠端機器包裝器，用於維護者 Linux 證明。當檢查對本機編輯迴圈來說太廣、需要與 CI 對齊，或證明需要 secrets、Docker、package lanes、可重複使用的機器或遠端記錄時，請從 repo 根目錄使用它。一般 OpenClaw 後端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是 Blacksmith 中斷、配額問題，或明確需要自有容量測試時的備援。

Crabbox 支援的 Blacksmith 執行會 warm、claim、sync、run、report，並清理一次性的 Testboxes。內建的同步健全性檢查會在必要根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤刪除項目時快速失敗。對於有意的大量刪除 PR，請為遠端命令設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

Crabbox 也會終止在 sync 階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith 命令列介面呼叫。設定 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該防護，或針對異常大的本機 diff 使用較大的毫秒值。

第一次執行前，請從 repo 根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果 Crabbox 二進位檔過舊且未宣告 `blacksmith-testbox`，repo 包裝器會拒絕執行。即使 `.crabbox.yaml` 有自有雲端預設值，也請明確傳入 provider。在 Codex worktrees 或 linked/sparse checkouts 中，避免使用本機 `pnpm crabbox:run` script，因為 pnpm 可能會在 Crabbox 啟動前協調相依套件；請改為直接呼叫 node 包裝器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 支援的執行需要 Crabbox 0.22.0 或更新版本，讓包裝器取得目前的 Testbox sync、queue 與 cleanup 行為。使用 sibling checkout 時，請在計時或證明工作前重建被忽略的本機二進位檔：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Changed gate：

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

Focused test rerun：

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

Full suite：

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

閱讀最終 JSON 摘要。實用欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。對於委派的 Blacksmith Testbox 執行，Crabbox 包裝器的結束碼和 JSON 摘要就是命令結果。連結的 GitHub Actions 執行負責 hydration 與 keepalive；當 SSH 命令已經返回後，Testbox 被外部停止時，它可能以 `cancelled` 結束。除非包裝器 `exitCode` 非零或命令輸出顯示測試失敗，否則請將其視為 cleanup/status artifact。一次性的 Blacksmith 支援 Crabbox 執行應該會自動停止 Testbox；如果執行被中斷或 cleanup 不明確，請檢查即時機器並只停止你建立的機器：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你有意需要在同一個 hydrated box 上執行多個命令時，才使用 reuse：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是故障層，但 Blacksmith 本身可用，只能將直接 Blacksmith 用於 `list`、`status` 和 cleanup 等診斷。在將直接 Blacksmith 執行視為維護者證明前，請先修復 Crabbox 路徑。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的 warmups 在幾分鐘後仍停在 `queued`，且沒有 IP 或 Actions run URL，請將其視為 Blacksmith provider、queue、billing 或 org-limit 壓力。停止你建立的 queued ids，避免啟動更多 Testboxes，並在有人檢查 Blacksmith dashboard、billing 和 org limits 時，將證明移到下面的自有 Crabbox 容量路徑。

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確以自有容量為目標時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務真的需要 48xlarge 級 CPU，否則避免 `class=beast`。`beast` request 從 192 vCPU 起跳，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額的方式。repo 擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域，以及 `capacity.hints: true`，因此 brokered AWS leases 會列印選取的 region/market、quota pressure、Spot fallback 與 high-pressure class warnings。較重的廣泛檢查使用 `fast`，只有在 standard/fast 不足時才使用 `large`，而 `beast` 只用於例外的 CPU-bound lanes，例如 full-suite 或 all-plugin Docker matrices、明確的 release/blocker validation，或 high-core performance profiling。不要將 `beast` 用於 `pnpm check:changed`、focused tests、docs-only work、一般 lint/typecheck、小型 E2E repros，或 Blacksmith outage triage。容量診斷請使用 `--market on-demand`，這樣 Spot market churn 就不會混入訊號。

`.crabbox.yaml` 擁有自有雲端 lanes 的 provider、sync 與 GitHub Actions hydration 預設值。它會排除本機 `.git`，讓 hydrated Actions checkout 保留自己的 remote Git metadata，而不是同步 maintainer-local remotes 與 object stores；它也會排除絕不應傳輸的本機 runtime/build artifacts。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm setup、`origin/main` fetch，以及自有雲端 `crabbox run --id <cbx_id>` 命令的非 secret environment handoff。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發頻道](/zh-TW/install/development-channels)
