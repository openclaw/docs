---
read_when:
    - 你需要了解某個 CI 作業為何有執行或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次版本驗證執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 工作圖、範圍門檻、發行總括項目與本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-07-04T06:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 和每個 pull request 上執行。標準
`main` 推送會先經過 90 秒的託管 runner 准入視窗。
現有的 `CI` 並行群組會在較新的
commit 抵達時取消該等待中的執行，因此連續合併不會各自註冊完整的 Blacksmith
矩陣。Pull request 和手動分派會跳過等待。接著 `preflight` 作業
會分類差異，並在只有不相關區域變更時關閉昂貴的通道。手動
`workflow_dispatch` 執行會刻意繞過智慧範圍界定，並展開完整圖形以供 release candidate 和廣泛
驗證。Android 通道透過 `include_android` 保持選擇加入。僅限發行版的
外掛覆蓋範圍位於獨立的 [`外掛預發行`](#plugin-prerelease)
工作流程中，且只會從 [`完整發行驗證`](#full-release-validation)
或明確的手動分派執行。

## 管線概覽

| 作業                               | 用途                                                                                                      | 執行時機                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件變更、已變更範圍、已變更擴充，以及建置 CI manifest                                            | 一律在非草稿推送和 PR 上執行                       |
| `runner-admission`                 | 在註冊 Blacksmith 工作之前，為標準 `main` 推送提供託管的 90 秒去抖動                                     | 每次 CI 執行；只有標準 `main` 推送會休眠            |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 進行已變更工作流程稽核，以及正式環境 lockfile 稽核                           | 一律在非草稿推送和 PR 上執行                       |
| `check-dependencies`               | 正式環境 Knip 僅相依性檢查，加上未使用檔案 allowlist 防護                                                | 節點相關變更                                        |
| `build-artifacts`                  | 建置 `dist/`、控制使用者介面、已建置命令列介面煙霧檢查、嵌入式已建置成品檢查，以及可重用成品            | 節點相關變更                                        |
| `checks-fast-core`                 | 快速 Linux 正確性通道，例如 bundled、protocol、QA Smoke CI，以及 CI 路由檢查                              | 節點相關變更                                        |
| `checks-fast-contracts-plugins-*`  | 兩個分片的外掛合約檢查                                                                                   | 節點相關變更                                        |
| `checks-fast-contracts-channels-*` | 兩個分片的通道合約檢查                                                                                   | 節點相關變更                                        |
| `checks-node-core-*`               | 核心節點測試分片，排除通道、bundled、合約與擴充通道                                                     | 節點相關變更                                        |
| `check-*`                          | 分片的主要本機閘門等價檢查：正式環境型別、lint、防護、測試型別，以及嚴格煙霧檢查                       | 節點相關變更                                        |
| `check-additional-*`               | 架構、分片邊界/提示漂移、擴充防護、套件邊界，以及執行階段拓撲                                           | 節點相關變更                                        |
| `checks-node-compat-node22`        | 節點 22 相容性建置與煙霧通道                                                                             | 發行版的手動 CI 分派                                |
| `check-docs`                       | 文件格式化、lint，以及失效連結檢查                                                                       | 文件已變更                                          |
| `skills-python`                    | Python 後端 Skills 的 Ruff + pytest                                                                      | Python Skill 相關變更                               |
| `checks-windows`                   | Windows 專用程序/路徑測試，加上共享執行階段匯入 specifier 迴歸                                          | Windows 相關變更                                    |
| `macos-node`                       | 使用共享已建置成品的 macOS TypeScript 測試通道                                                           | macOS 相關變更                                      |
| `macos-swift`                      | macOS 應用程式的 Swift lint、建置與測試                                                                  | macOS 相關變更                                      |
| `ios-build`                        | Xcode 專案產生，加上 iOS 應用程式模擬器建置                                                              | iOS 應用程式、共享 app kit，或 Swabble 變更         |
| `android`                          | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                                 | Android 相關變更                                    |
| `test-performance-agent`           | 受信任活動後的每日 Codex 慢速測試最佳化                                                                  | 主要 CI 成功或手動分派                              |
| `openclaw-performance`             | 每日/隨需 Kova 執行階段效能報告，包含 mock-provider、deep-profile，以及 GPT 5.5 即時通道                 | 排程和手動分派                                      |

## 快速失敗順序

1. `runner-admission` 只會等待標準 `main` 推送；較新的推送會在 Blacksmith 註冊前取消該執行。
2. `preflight` 決定哪些通道根本存在。`docs-scope` 和 `changed-scope` 邏輯是此作業中的步驟，不是獨立作業。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不等待較重的成品與平台矩陣作業。
4. `build-artifacts` 會與快速 Linux 通道重疊，因此下游消費者可在共享建置準備好後立即開始。
5. 較重的平台與執行階段通道隨後展開：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

當較新的推送落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則請將其視為 CI 雜訊。矩陣作業使用 `fail-fast: false`，而 `build-artifacts` 會直接回報嵌入式通道、core-support-boundary 和 gateway-watch 失敗，而不是排入小型驗證作業。自動 CI 並行鍵已版本化（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍項目無法無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent`，或 `node scripts/ci-run-timings.mjs <run-id>` 來摘要 GitHub Actions 的牆鐘時間、佇列時間、最慢作業、失敗，以及 `pnpm-store-warmup` 展開屏障。CI 也會將相同的執行摘要上傳為 `ci-timings-summary` 成品。若要檢查建置時間，請查看 `build-artifacts` 作業的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會列印 `[build-all] phase timings:` 並包含 `ui:build`；該作業也會上傳 `startup-memory` 成品。

對於 pull request 執行，終端 timing-summary 作業會先從受信任的基礎修訂版執行 helper，再將 `GH_TOKEN` 傳給 `gh run view`。這會讓帶 token 的查詢避開分支控制的程式碼，同時仍能摘要 pull request 目前的 CI 執行。

## PR 背景與證據

外部貢獻者 PR 會從 `.github/workflows/real-behavior-proof.yml`
執行 PR 背景與證據閘門。該工作流程會 checkout 受信任的
基礎 commit，且只評估 PR 內文；它不會執行
貢獻者分支中的程式碼。

此閘門適用於不是儲存庫擁有者、成員、
協作者或 bot 的 PR 作者。當 PR 內文包含作者撰寫的
`What Problem This Solves` 和 `Evidence` 區段時即通過。證據可以是聚焦的
測試、CI 結果、截圖、錄影、終端輸出、即時觀察、
已遮蔽紀錄，或成品連結。內文提供意圖與有用的驗證；
審查者會檢查程式碼、測試和 CI 來評估正確性。

當檢查失敗時，請更新 PR 內文，而不是再推送另一個程式碼 commit。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動分派會跳過 changed-scope 偵測，並讓 preflight manifest 表現得像每個已界定範圍的區域都已變更。

- **CI 工作流程編輯** 會驗證節點 CI 圖形與工作流程 linting，但不會自行強制執行 Windows、iOS、Android 或 macOS 原生建置；這些平台通道仍限定於平台原始碼變更。
- **工作流程健全性** 會在所有工作流程 YAML 檔案上執行 `actionlint`、`zizmor`、composite-action 內插防護，以及衝突標記防護。PR 範圍的 `security-fast` 作業也會在已變更的工作流程檔案上執行 `zizmor`，因此工作流程安全性發現會在主要 CI 圖形中提早失敗。
- **`main` 推送上的文件** 由獨立的 `Docs` 工作流程檢查，使用與 CI 相同的 ClawHub 文件鏡像，因此混合程式碼+文件推送不會也排入 CI `check-docs` 分片。Pull request 和手動 CI 在文件變更時仍會從 CI 執行 `check-docs`。
- **終端介面 PTY** 會針對終端介面變更在 `checks-node-core-runtime-tui-pty` Linux 節點分片中執行。該分片會以 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋確定性的 `TuiBackend` fixture 通道，以及較慢的 `tui --local` 煙霧測試，後者只 mock 外部模型端點。
- **僅 CI 路由編輯、選定的低成本核心測試 fixture 編輯，以及狹窄的外掛合約 helper/測試路由編輯** 會使用快速僅節點 manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` 工作。當變更僅限於快速工作直接演練的路由或 helper 表面時，該路徑會跳過建置成品、節點 22 相容性、通道合約、完整核心分片、bundled-plugin 分片，以及額外防護矩陣。
- **Windows 節點檢查** 限定於 Windows 專用程序/路徑 wrapper、npm/pnpm/使用者介面 runner helper、套件管理器設定，以及執行該通道的 CI 工作流程表面；不相關的原始碼、外掛、install-smoke 和僅測試變更會留在 Linux 節點通道上。

最慢的節點測試家族會被拆分或平衡，讓每個作業都維持小規模而不會過度保留 runner：外掛合約與通道合約各自以兩個加權、Blacksmith 支援的 shard 執行，並保留標準 GitHub runner 後援；核心單元 fast/support lane 分開執行；核心執行階段基礎設施拆分為 state、process/config、shared，以及三個排程網域 shard；auto-reply 以平衡的 worker 執行（reply 子樹拆分為 agent-runner、dispatch，以及 commands/state-routing shard）；agentic gateway/server 設定則拆分到 chat/auth/model/http-plugin/runtime/startup lane，而不是等待建置成品。一般 CI 接著只會把 isolated infra include-pattern shard 打包成最多 64 個測試檔的決定性 bundle，以減少節點矩陣，同時不合併非隔離的 command/cron、具狀態的 agents-core，或 gateway/server suite；重型固定 suite 仍使用 8 vCPU，而 bundled 與較低權重 lane 使用 4 vCPU。canonical repository 上的 pull request 使用額外的精簡 admission plan：相同的 per-config 群組會在目前 34-job Linux 節點計畫內，以隔離 subprocess 執行，因此單一 PR 不會註冊完整的 70 多個作業節點矩陣。`main` push、manual dispatch 與 release gate 保留完整矩陣。大型 browser、QA、media，以及雜項外掛測試會使用各自專用的 Vitest 設定，而不是共用的外掛 catch-all。Include-pattern shard 會使用 CI shard 名稱記錄 timing entry，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 與 filtered shard。`check-additional-*` 會把 package-boundary compile/canary 工作放在一起，並將 runtime topology architecture 與 gateway watch coverage 分開；boundary guard 清單會分條成一個 prompt-heavy shard，以及一個合併 shard 給其餘 guard stripe，每個 shard 會並行執行選定的獨立 guard，並列印每個檢查的 timing。昂貴的 Codex happy-path prompt snapshot drift 檢查會作為自己的 additional job 執行，只用於 manual CI 與會影響 prompt 的變更，因此一般不相關的節點變更不必等待冷啟動 prompt snapshot 生成，boundary shard 也能保持平衡，同時 prompt drift 仍會釘選到造成它的 PR；相同旗標會在 built-artifact core support-boundary shard 內略過 prompt snapshot Vitest 生成。Gateway watch、channel tests，以及 core support-boundary shard 會在 `dist/` 與 `dist-runtime/` 已建置完成後，在 `build-artifacts` 內並行執行。

admitted 之後，canonical Linux CI 允許最多 24 個並行節點測試作業，
較小的 fast/check lane 則允許 12 個；Windows 與 Android 維持在兩個，
因為那些 runner pool 較窄。

精簡 PR 計畫會為目前的 suite 發出 18 個節點作業：whole-config
群組會在隔離 subprocess 中批次執行，批次 timeout 為 120 分鐘，
而 include-pattern 群組共享相同的受限作業預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test lane 仍會使用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關 push 上重複執行 debug APK packaging 作業。

`check-dependencies` shard 會執行 `pnpm deadcode:dependencies`（production Knip dependency-only pass，釘選到最新 Knip 版本，並在 `dlx` 安裝時停用 pnpm 的 minimum release age）與 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file findings 與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的 unused file，或留下過期 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的有意動態外掛、generated、build、live-test 與 package bridge surface。

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository activity 到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request code。該 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload dispatch 到 `openclaw/clawsweeper`。

該 workflow 有四個 lane：

- `clawsweeper_item` 用於精確的 issue 與 pull request review request；
- `clawsweeper_comment` 用於 issue comment 中明確的 ClawSweeper command；
- `clawsweeper_commit_review` 用於 `main` push 上的 commit-level review request；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub activity。

`github_activity` lane 只會轉送標準化 metadata：event type、action、actor、repository、item number、URL、title、state，以及存在 comment 或 review 時的短摘錄。它會刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中接收端 workflow 是 `.github/workflows/github-activity.yml`，它會把標準化 event post 到 OpenClaw 閘道 hook，供 ClawSweeper agent 使用。

一般 activity 是 observation，不是預設 delivery。ClawSweeper agent 會在 prompt 中收到 Discord target，且只有當 event 令人意外、可行動、有風險，或對營運有用時，才應 post 到 `#clawsweeper`。例行 open、edit、bot churn、重複 webhook noise，以及一般 review traffic 應該產生 `NO_REPLY`。

在這整條路徑中，請將 GitHub title、comment、body、review text、branch name 與 commit message 視為不受信任的資料。它們是 summarization 與 triage 的輸入，不是 workflow 或 agent runtime 的指令。

## Manual dispatches

Manual CI dispatch 會執行與一般 CI 相同的 job graph，但會強制開啟每個非 Android scoped lane：Linux 節點 shard、bundled-plugin shard、外掛與通道合約 shard、節點 22 compatibility、`check-*`、`check-additional-*`、built-artifact smoke check、docs check、Python skills、Windows、macOS、iOS build，以及 Control UI i18n。獨立 manual CI dispatch 只有在 `include_android=true` 時才會執行 Android；完整 release umbrella 會透過傳入 `include_android=true` 啟用 Android。Plugin prerelease static check、release-only `agentic-plugins` shard、完整 extension batch sweep，以及 plugin prerelease Docker lane 都排除在 CI 之外。Docker prerelease suite 只有在 `Full Release Validation` dispatch 個別的 `Plugin Prerelease` workflow，且啟用 release-validation gate 時才會執行。

Manual run 使用唯一的 concurrency group，因此 release-candidate full suite 不會被同一 ref 上的另一個 push 或 PR run 取消。選用的 `target_ref` input 允許受信任的 caller 使用所選 dispatch ref 的 workflow file，對 branch、tag 或完整 commit SHA 執行該 graph。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manual CI dispatch 與 non-canonical repository fallback、CodeQL JavaScript/actions quality scan、workflow-sanity、labeler、auto-response、CI 外部的 docs workflow，以及 install-smoke preflight，讓 Blacksmith matrix 可以更早 queue                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、較低權重的 extension shard、除 QA Smoke CI 以外的 `checks-fast-core`、外掛/通道合約 shard、多數 bundled/較低權重的 Linux 節點 shard、`check-guards`、`check-prod-types`、`check-test-types`、選定的 `check-additional-*` shard，以及 `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux 節點 suite、boundary/extension-heavy `check-additional-*` shard，以及 `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI 與 Testbox 中的 `build-artifacts`、`check-lint`（對 CPU 足夠敏感，8 vCPU 的成本高於節省）；install-smoke Docker build（32-vCPU queue time 的成本高於節省）                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork fallback 到 `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；fork fallback 到 `macos-26`                                                                                                                                                                                                                     |

## Runner registration budget

OpenClaw 目前的 GitHub runner-registration bucket 在 `ghx api rate_limit` 中回報為每 5 分鐘 10,000 次 self-hosted
runner registration。每次 tuning pass 前都要重新檢查
`actions_runner_registration`，因為 GitHub 可能變更這個 bucket。此限制由
`openclaw` 組織中的所有 Blacksmith runner registration 共享，因此新增另一個 Blacksmith installation 不會新增
bucket。

將 Blacksmith label 視為 burst control 的稀缺資源。只負責
route、notify、summarize、select shard，或執行短 CodeQL scan 的作業應該
留在 GitHub-hosted runner 上，除非它們有經測量的 Blacksmith-specific
需求。任何新的 Blacksmith matrix、更大的 `max-parallel`，或高頻率
workflow，都必須顯示其 worst-case registration count，並讓 org-level
target 維持在 live bucket 約 60% 以下。以目前 10,000-registration
bucket 來說，這代表 6,000-registration operating target，為
concurrent repository、retry 與 burst overlap 保留餘裕。

Canonical-repo CI 會將 Blacksmith 保持為一般 push 與 pull-request run 的預設 runner 路徑。`workflow_dispatch` 與 non-canonical repository run 使用 GitHub-hosted runner，但一般 canonical run 目前不會探測 Blacksmith queue health，也不會在 Blacksmith 不可用時自動 fallback 到 GitHub-hosted label。

## Local equivalents

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

`OpenClaw Performance` 是產品／執行階段效能工作流程。它每天在 `main` 上執行，也可以手動派送：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動派送通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對發布標籤或其他分支進行基準測試。已發布的報告路徑和最新指標會以受測 ref 為鍵，每個 `index.md` 都會記錄受測 ref/SHA、工作流程 ref/SHA、Kova ref、設定檔、lane 授權模式、模型、重複次數，以及情境篩選器。

此工作流程會從固定發布版本安裝 OCM，並從 `openclaw/Kova` 在固定的 `kova_ref` 輸入安裝 Kova，然後執行三個 lane：

- `mock-provider`：Kova 診斷情境，針對使用確定性假 OpenAI 相容授權的本機建置執行階段。
- `mock-deep-profile`：針對啟動、閘道，以及 agent-turn 熱點的 CPU／heap／trace 分析。
- `live-openai-candidate`：真實 OpenAI `openai/gpt-5.5` agent 回合；當 `OPENAI_API_KEY` 不可用時會略過。

mock-provider lane 也會在 Kova 通過後執行 OpenClaw 原生原始碼探針：預設、hook，以及 50 個外掛啟動情境下的閘道啟動時間與記憶體；內建外掛匯入 RSS、重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道的命令列介面啟動命令，以及 SQLite 狀態 smoke 效能探針。當受測 ref 有先前發布的 mock-provider 原始碼報告可用時，原始碼摘要會將目前的 RSS 與 heap 值與該基準比較，並將大幅 RSS 增加標記為 `watch`。原始碼探針 Markdown 摘要位於報告 bundle 的 `source/index.md`，原始 JSON 會放在旁邊。

每個 lane 都會上傳 GitHub artifacts。當已設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、bundles、`index.md` 以及原始碼探針 artifacts 提交到 `openclaw/clawgrit-reports`，路徑為 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。目前受測 ref 指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發布驗證

`Full Release Validation` 是「發布前執行所有項目」的手動總括工作流程。它接受分支、標籤或完整 commit SHA，使用該目標派送手動 `CI` 工作流程，為僅發布用的外掛／套件／靜態／Docker 證明派送 `Plugin Prerelease`，並為安裝 smoke、套件接受度、跨 OS 套件檢查、從 QA profile 證據渲染成熟度記分卡、QA Lab parity、Matrix 與 Telegram lane 派送 `OpenClaw Release Checks`。stable 與 full profile 一律包含完整 live/E2E 和 Docker 發布路徑 soak 覆蓋；beta profile 可用 `run_release_soak=true` 選擇啟用。標準套件 Telegram E2E 會在 Package Acceptance 內執行，因此完整候選版本不會啟動重複的 live poller。發布後，傳入 `release_package_spec` 可在 release checks、Package Acceptance、Docker、跨 OS 與 Telegram 中重複使用已發布的 npm 套件，而不需重新建置。只有在針對已發布套件進行 Telegram 聚焦重跑時，才使用 `npm_telegram_package_spec`。Codex 外掛 live package lane 預設使用同一個選定狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生出 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/artifact 執行會從選定 ref 打包 `extensions/codex`。若要使用自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` spec，請明確設定 `codex_plugin_spec`。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、確切工作流程 job 名稱、profile 差異、artifacts，以及聚焦重跑 handle。

`OpenClaw Release Publish` 是手動變更發布工作流程。請在發布標籤已存在且 OpenClaw npm preflight 已成功後，從 `release/YYYY.M.PATCH` 或 `main` 派送它。它會驗證 `pnpm plugins:sync:check`，為所有可發布的外掛套件派送 `Plugin NPM Release`，為相同發布 SHA 派送 `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。stable 發布也需要精確的 `windows_node_tag`；在任何發布子工作流程之前，工作流程會驗證 Windows 原始碼發布，並將其 x64/ARM64 安裝程式與候選核准的 `windows_node_installer_digests` 輸入比較，然後在發布 GitHub release draft 前，推廣並驗證相同的固定安裝程式 digest，以及精確的 companion asset 與 checksum contract。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得固定 commit 證明，請使用 helper，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程派送 ref 必須是分支或標籤，不能是原始 commit SHA。helper 會在目標 SHA 推送暫時的 `release-ci/<sha>-...` 分支，從該固定 ref 派送 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。若任何子工作流程在不同 SHA 執行，總括 verifier 也會失敗。

`release_profile` 控制傳入 release checks 的 live／provider 範圍。手動發布工作流程預設為 `stable`；只有在你刻意需要廣泛的 advisory provider／media 矩陣時，才使用 `full`。stable 與 full release checks 一律執行完整 live/E2E 和 Docker 發布路徑 soak；beta profile 可用 `run_release_soak=true` 選擇啟用。

- `minimum` 保留最快的 OpenAI／core 發布關鍵 lane。
- `stable` 加入 stable provider／backend 集合。
- `full` 執行廣泛的 advisory provider／media 矩陣。

總括工作流程會記錄已派送的子執行 ID，最終的 `Verify full validation` job 會重新檢查目前的子執行結論，並為每個子執行附加最慢 job 表格。若子工作流程重跑後變綠，只需重跑父 verifier job，即可重新整理總括結果與時間摘要。

復原時，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。發布候選版本請使用 `all`；僅正常完整 CI 子工作流程使用 `ci`；僅外掛 prerelease 子工作流程使用 `plugin-prerelease`；所有發布子工作流程使用 `release-checks`；或在總括工作流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能在聚焦修正後，讓失敗的發布 box 重跑保持有界。對於單一失敗的跨 OS lane，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合，例如 `windows/packaged-upgrade`；較長的跨 OS 命令會發出心跳偵測列，packaged-upgrade 摘要會包含各階段時間。QA release-check lane 皆為 advisory，除了標準執行階段工具覆蓋 gate；當必要 OpenClaw dynamic tools 從 standard tier 摘要漂移或消失時，該 gate 會阻擋。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將選定 ref 解析一次成 `release-package-under-test` tarball，然後將該 artifact 傳給跨 OS 檢查與 Package Acceptance，以及在執行 soak 覆蓋時傳給 live/E2E 發布路徑 Docker 工作流程。這讓套件 bytes 在各個發布 box 之間保持一致，並避免在多個子 job 中重新打包同一個候選版本。對於 Codex npm 外掛 live lane，release checks 會傳入從 `release_package_spec` 衍生出的相符已發布外掛 spec、傳入操作員提供的 `codex_plugin_spec`，或將輸入留空，讓 Docker script 打包選定 checkout 的 Codex 外掛。

對於 `ref=main` 與 `rerun_group=all` 的重複 `Full Release Validation` 執行，較新的總括工作流程會取代較舊的總括工作流程。當父工作流程被取消時，父監控器會取消它已派送的任何子工作流程，因此較新的 main 驗證不會排在過期的兩小時 release-check 執行後面。發布分支／標籤驗證與聚焦重跑群組會保留 `cancel-in-progress: false`。

## Live 與 E2E shards

發布 live/E2E 子工作流程保留廣泛的原生 `pnpm test:live` 覆蓋，但會透過 `scripts/test-live-shard.mjs` 以具名 shards 執行，而不是單一序列 job：

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
- split media audio/video shards and provider-filtered music shards

這會保留相同檔案覆蓋，同時讓緩慢的 live provider 失敗更容易重跑與診斷。彙總 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` shard 名稱仍可用於手動一次性重跑。

原生 live media shards 在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。此映像預先安裝 `ffmpeg` 和 `ffprobe`；media jobs 只會在設定前驗證二進位檔。請將 Docker 支援的 live suites 保持在一般 Blacksmith runners 上執行；container jobs 不是啟動巢狀 Docker tests 的正確位置。

Docker 支援的 live model/backend 分片會針對每個選取的提交使用單獨的共用 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。live release workflow 會建置並推送該映像一次，接著 Docker live model、依提供者分片的閘道、命令列介面後端、ACP bind，以及 Codex harness 分片都會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片在 workflow job timeout 之下帶有明確的 script 層級 `timeout` 上限，因此卡住的容器或清理路徑會快速失敗，而不是耗完整個 release-check 預算。如果這些分片各自重新建置完整 source Docker target，表示 release run 設定錯誤，會在重複映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證 source tree，而套件驗收則透過使用者在安裝或更新後會執行的同一套 Docker E2E harness，驗證單一 tarball。

### 工作

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者上傳為 `package-under-test` artifact，並在 GitHub step summary 中印出來源、workflow ref、package ref、版本、SHA-256，以及 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用 workflow 會下載該 artifact、驗證 tarball inventory、在需要時準備 package-digest Docker 映像，並針對該套件執行選取的 Docker lane，而不是打包 workflow checkout。當某個 profile 選取多個目標 `docker_lanes` 時，可重用 workflow 會先準備套件與共用映像一次，然後將這些 lane 展開為具有唯一 artifact 的並行目標 Docker job。
3. `package_telegram` 可選擇呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，並在套件驗收解析出套件時安裝同一個 `package-under-test` artifact；獨立的 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker 驗收，或可選的 Telegram lane 失敗時讓 workflow 失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。請用於已發布的 prerelease/stable 驗收。
- `source=ref` 會打包受信任的 `package_ref` branch、tag 或完整 commit SHA。解析器會 fetch OpenClaw branches/tags，驗證選取的提交可從 repository branch history 或 release tag 到達，在 detached worktree 中安裝 deps，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載公開 HTTPS `.tgz`；`package_sha256` 為必填。此路徑會拒絕 URL credentials、非預設 HTTPS port、private/internal/special-use hostnames 或解析出的 IP，以及重新導向到同一公開安全政策以外的位置。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名 trusted-source policy 下載 HTTPS `.tgz`；`package_sha256` 和 `trusted_source_id` 為必填。僅在維護者擁有的企業 mirror 或私有套件 repository 需要設定 hosts、ports、path prefixes、redirect hosts，或 private-network resolution 時使用。若 policy 宣告 bearer auth，workflow 會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；內嵌於 URL 的 credentials 仍會被拒絕。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選填，但外部分享的 artifact 應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任 workflow/harness code。`package_ref` 是在 `source=ref` 時會被打包的來源提交。這可讓目前的測試 harness 驗證較舊的受信任來源提交，而不執行舊 workflow 邏輯。

### 套件組 profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 搭配 OpenWebUI 的完整 Docker release-path chunks
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` profile 使用離線外掛覆蓋率，因此已發布套件驗證不會受 live ClawHub 可用性阻擋。可選的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` artifact，並保留已發布 npm spec 路徑供獨立 dispatch 使用。

如需專用更新與外掛測試政策，包含本機命令、
Docker lane、套件驗收輸入、release 預設值，以及失敗分流，
請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

Release checks 會以 `source=artifact`、已準備的 release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`，以及 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件 migration、更新、live ClawHub skill 安裝、過時外掛依賴清理、已設定外掛安裝修復、離線外掛、外掛更新，以及 Telegram 證明都使用同一個已解析的套件 tarball。在發布 beta 之後，於 Full Release Validation 或 OpenClaw Release Checks 上設定 `release_package_spec`，即可對已出貨的 npm 套件執行同一個 matrix 而不重新建置；只有當套件驗收需要使用與其他 release validation 不同的套件時，才設定 `package_acceptance_package_spec`。跨 OS release checks 仍涵蓋 OS 特定的 onboarding、installer 和 platform 行為；package/update 產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker lane 會在阻擋 release path 中，每次執行驗證一個已發布套件 baseline。在套件驗收中，解析出的 `package-under-test` tarball 永遠是候選套件，而 `published_upgrade_survivor_baseline` 選取 fallback 已發布 baseline，預設為 `openclaw@latest`；失敗 lane 的 rerun 命令會保留該 baseline。當 Full Release Validation 設定 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展到最新四個 stable npm releases，加上針對 Feishu config、保留的 bootstrap/persona files、已設定的 OpenClaw 外掛安裝、tilde log paths，以及過時 legacy 外掛依賴 roots 的固定外掛相容性邊界 releases 與 issue-shaped fixtures。多 baseline published-upgrade survivor 選項會依 baseline 分片到不同的目標 Docker runner jobs。獨立的 `Update Migration` workflow 會在問題是全面的已發布更新清理，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker lane 搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本機彙總執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 spec，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 來執行情境 matrix。已發布 lane 會使用內建的 `openclaw config set` 命令 recipe 設定 baseline，在 `summary.json` 中記錄 recipe steps，並在閘道啟動後探測 `/healthz`、`/readyz`，以及 RPC status。Windows packaged 和 installer fresh lanes 也會驗證已安裝套件可以從原始絕對 Windows path 匯入 browser-control override。OpenAI cross-OS agent-turn smoke 在設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因此 install 和 gateway proof 會停留在 GPT-5 test model，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

套件驗收對已發布套件有受限的 legacy-compatibility windows。到 `2026.4.25` 為止的套件，包含 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的 private QA entries 可指向 tarball 省略的檔案；
- 當套件未公開該 flag 時，`doctor-switch` 可略過 `gateway install --wrapper` persistence subcase；
- `update-channel-switch` 可從 tarball-derived fake git fixture 修剪缺少的 pnpm `patchedDependencies`，且可記錄缺少的 persisted `update.channel`；
- 外掛 smoke 可讀取 legacy install-record locations，或接受缺少 marketplace install-record persistence；
- `plugin-update` 可允許 config metadata migration，同時仍要求 install record 和 no-reinstall 行為維持不變。

已發布的 `2026.4.26` 套件也可對已出貨的 local build metadata stamp files 發出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` summary 開始，確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` child run 及其 Docker artifacts：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane logs、phase timings，以及 rerun commands。請優先重新執行失敗的 package profile 或精確 Docker lanes，而不是重新執行完整 release validation。

## 安裝 smoke

獨立的 `Install Smoke` workflow 會透過自己的 `preflight` job 重用同一個 scope script。它會將 smoke 覆蓋率分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/套件介面、內建外掛套件/manifest 變更，或 Docker smoke 作業會演練的核心外掛/頻道/閘道/外掛 SDK 介面之 pull request 執行。僅原始碼的內建外掛變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查命令列介面、執行 agents delete shared-workspace 命令列介面 smoke、執行容器 gateway-network e2e、驗證內建 extension 建置參數，並在 240 秒的彙總命令逾時內執行有界的內建外掛 Docker profile（每個情境的 Docker 執行會分別設定上限）。
- **完整路徑**會保留 QR 套件安裝與安裝程式 Docker/update 覆蓋率，用於 nightly 排程執行、手動 dispatch、workflow-call 發行檢查，以及真正觸及安裝程式/套件/Docker 介面的 pull request。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile smoke 映像，接著將 QR 套件安裝、根 Dockerfile/閘道 smoke、安裝程式/update smoke，以及快速內建外掛 Docker E2E 作為獨立作業執行，讓安裝程式工作不必排在根映像 smoke 後面等待。

`main` 推送（包含 merge commit）不會強制使用完整路徑；當變更範圍邏輯會在推送時要求完整覆蓋率，workflow 會保留快速 Docker smoke，並將完整 install smoke 留給 nightly 或發行驗證。

較慢的 Bun 全域安裝 image-provider smoke 會由 `run_bun_global_install_smoke` 另外控管。它會在 nightly 排程與 release checks workflow 中執行，且手動 `Install Smoke` dispatch 可以選擇啟用它，但 pull request 和 `main` 推送不會執行。一般 PR CI 仍會針對 Node 相關變更執行快速 Bun launcher 回歸 lane。QR 與安裝程式 Docker 測試會保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像，將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/update/plugin-dependency lane 的精簡 Node/Git runner；
- 將同一個 tarball 安裝到 `/app`、供一般功能 lane 使用的功能性映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的計畫。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選取映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主集區 slot 數。                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對 provider 敏感的 tail-pool slot 數。                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider 節流。                                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，避免 Docker daemon 建立風暴；設為 `0` 則不錯開。                    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback 逾時（120 分鐘）；選取的 live/tail lane 使用更嚴格的上限。             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫而不執行 lane。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；略過清理 smoke，讓代理能重現單一失敗 lane。                      |

比有效上限更重的 lane 仍可從空集區啟動，然後獨自執行直到釋放容量。本機彙總流程會預檢 Docker、移除過時的 OpenClaw E2E 容器、輸出 active-lane 狀態、保存 lane timing 以便 longest-first 排序，並預設在第一次失敗後停止排程新的 pooled lane。

### 可重用的 live/E2E workflow

可重用的 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、lane 與 credential 覆蓋率。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub output 與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件 artifact，或從 `package_artifact_run_id` 下載套件 artifact；驗證 tarball inventory；在計畫需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` input 或既有的套件 digest 映像，而不是重新建置。Docker 映像 pull 會以每次嘗試 180 秒的有界逾時重試，讓卡住的 registry/cache stream 能快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發行路徑區塊

發行 Docker 覆蓋率會以較小的 chunked 作業執行，並設定 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個 chunk 只 pull 所需的映像種類，並透過同一個 weighted scheduler 執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker chunk 為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 外掛套件 lane，該 lane 會安裝候選 OpenClaw 套件，從 `codex_plugin_spec` 或同 ref tarball 安裝 Codex 外掛並明確核准 Codex 命令列介面安裝，執行 Codex 命令列介面 preflight，接著對 OpenAI 執行多個同工作階段的 OpenClaw 代理 turn。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總的外掛/runtime alias。`install-e2e` lane alias 仍是兩個 provider 安裝程式 lane 的彙總手動重新執行 alias。

當完整 release-path 覆蓋率要求時，OpenWebUI 會併入 `plugins-runtime-services`，並且只為 OpenWebUI-only dispatch 保留獨立的 `openwebui` chunk。內建頻道 update lane 會針對暫時性 npm 網路失敗重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane log、timing、`summary.json`、`failures.json`、階段 timing、scheduler plan JSON、slow-lane 表格，以及每個 lane 的重新執行命令。workflow 的 `docker_lanes` input 會針對已準備的映像執行選取的 lane，而不是執行 chunk 作業，這會將失敗 lane 的偵錯限制在一個目標 Docker 作業內，並為該次執行準備、下載或重用套件 artifact；如果選取的 lane 是 live Docker lane，目標作業會為該次重新執行在本機建置 live-test 映像。產生的每個 lane GitHub 重新執行命令會在那些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備的映像 input，讓失敗的 lane 能重用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker artifact 並列印合併/每個 lane 的目標重新執行命令
pnpm test:docker:timings <summary>   # slow-lane 與階段關鍵路徑摘要
```

排程的 live/E2E workflow 會每天執行完整 release-path Docker 套件。

## 外掛 Prerelease

`Plugin Prerelease` 是成本較高的產品/套件覆蓋率，因此它是由 `Full Release Validation` 或明確的操作員 dispatch 的獨立 workflow。一般 pull request、`main` 推送，以及獨立的手動 CI dispatch 都會關閉該套件。它會在八個 extension worker 之間平衡內建外掛測試；這些 extension shard 作業一次最多執行兩個外掛 config group，每個 group 使用一個 Vitest worker 和較大的 Node heap，讓 import-heavy 的外掛批次不會產生額外的 CI 作業。僅發行使用的 Docker prerelease 路徑會以小群組批次執行目標 Docker lane，避免為一到三分鐘的作業保留數十個 runner。workflow 也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` artifact；inspector finding 是 triage 輸入，不會改變阻擋性的 Plugin Prerelease gate。

## QA Lab

QA Lab 在主要 smart-scoped workflow 之外有專用 CI lane。Agentic parity 會巢狀置於廣泛 QA 與發行 harness 之下，而不是獨立的 PR workflow。當 parity 應隨廣泛驗證執行一起運行時，使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 每晚在 `main` 上執行，也可手動 dispatch；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lane 展開為平行作業。Live 作業使用 `qa-live-shared` environment，而 Telegram/Discord 使用 Convex lease。

Release checks 會使用 deterministic mock provider 與 mock-qualified model（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport lane，讓頻道 contract 與 live model latency 及一般 provider-plugin 啟動隔離。Live transport 閘道會停用 memory search，因為 QA parity 會另外覆蓋 memory 行為；provider 連線能力由獨立的 live model、native provider 與 Docker provider 套件覆蓋。

Matrix 會在排程與發行 gate 使用 `--profile fast`，並且只在 checkout 的命令列介面支援時加入 `--fail-fast`。命令列介面預設值與手動 workflow input 仍為 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix 覆蓋率分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發行核准前執行 release-critical QA Lab lane；其 QA parity gate 會將候選與 baseline pack 作為平行 lane 作業執行，接著將兩者 artifact 下載到小型報告作業，以進行最終 parity 比較。

對於一般 PR，請遵循 scoped CI/check 證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` workflow 是刻意保持範圍狹窄的第一輪安全掃描器，不是完整 repository sweep。每日、手動，以及非 draft pull request guard 執行會掃描 Actions workflow 程式碼，加上最高風險的 JavaScript/TypeScript 介面，並使用高信心安全查詢，篩選至 high/critical `security-severity`。

Pull request guard 維持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`，或擁有 process 的內建外掛 runtime 路徑下的變更啟動，並執行與排程 workflow 相同的高信心安全矩陣。Android 和 macOS CodeQL 不在 PR 預設值中。

### 安全類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、密鑰、沙箱、排程與閘道基準                                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，以及通道外掛執行階段、閘道、外掛 SDK、密鑰、稽核接觸點                                                          |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、web-fetch 與外掛 SDK SSRF 政策表面                                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞與代理工具執行閘門                                                                           |
| `/codeql-security-high/process-exec-boundary`     | 本機 shell、程序 spawn 輔助工具、擁有子程序的內建外掛執行階段，以及工作流程腳本膠合                                                |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、manifest、registry、套件管理器安裝、來源載入與外掛 SDK 套件合約信任表面                                          |

### 平台特定安全性分片

- `CodeQL Android Critical Security` — 排程的 Android 安全性分片。在工作流程健全性可接受的最小 Blacksmith Linux runner 上，手動建置 Android 應用程式供 CodeQL 使用。上傳到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週／手動 macOS 安全性分片。在 Blacksmith macOS 上手動建置 macOS 應用程式供 CodeQL 使用，從上傳的 SARIF 中濾除相依性建置結果，並上傳到 `/codeql-critical-security/macos`。因為即使乾淨時 macOS 建置仍主導執行時間，所以保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全性分片。它只在 GitHub 託管的 Linux runner 上，針對狹窄的高價值表面執行錯誤嚴重性、非安全性的 JavaScript/TypeScript 品質查詢，讓品質掃描不會消耗 Blacksmith runner 註冊預算。它的 pull request 防護刻意比排程 profile 更小：非草稿 PR 只會針對代理命令／模型／工具執行與回覆分派程式碼、設定 schema／遷移／IO 程式碼、auth／密鑰／沙箱／安全性程式碼、核心通道與內建通道外掛執行階段、閘道協定／伺服器方法、記憶體執行階段／SDK 膠合、MCP／程序／對外傳遞、提供者執行階段／模型目錄、工作階段診斷／傳遞佇列、外掛載入器、外掛 SDK／套件合約，或外掛 SDK 回覆執行階段變更，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 與 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動派送接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄 profile 是用來單獨執行一個品質分片的教學／迭代掛鉤。

| 類別                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth、密鑰、沙箱、排程與閘道安全性邊界程式碼                                                                                                                     |
| `/codeql-critical-quality/config-boundary`              | 設定 schema、遷移、正規化與 IO 合約                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道協定 schema 與伺服器方法合約                                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與內建通道外掛實作合約                                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型／提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及對外傳遞合約                                                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體外掛 SDK aliases、記憶體執行階段啟用膠合，以及記憶體 doctor 命令                                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結／傳遞輔助工具、診斷事件／日誌套件表面，以及工作階段 doctor 命令列介面合約                                      |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 入站回覆分派、回覆 payload／分塊／執行階段輔助工具、通道回覆選項、傳遞佇列，以及工作階段／執行緒繫結輔助工具                                           |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者 auth 與探索、提供者執行階段註冊、提供者預設值／目錄，以及 web／search／fetch／embedding registries                                       |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap、本機持久化、閘道控制流程，以及任務控制平面執行階段合約                                                                                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch／search、媒體 IO、媒體理解、image-generation 與 media-generation 執行階段合約                                                                      |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、registry、公開表面與外掛 SDK 進入點合約                                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端外掛 SDK 來源與外掛套件合約輔助工具                                                                                                                  |

品質與安全性保持分離，因此品質發現可以排程、衡量、停用或擴充，而不會遮蔽安全性訊號。Swift、Python 與內建外掛 CodeQL 擴充，應該只在狹窄 profile 具有穩定執行時間與訊號之後，作為有範圍或分片的後續工作加回。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護線，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動派送也可以直接執行它。當 `main` 已經前進，或上一小時內已建立另一個非略過的 Docs Agent 執行時，workflow-run 呼叫會略過。執行時，它會審查從前一次非略過 Docs Agent 來源 SHA 到目前 `main` 的 commit 範圍，因此每小時一次執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是一條針對慢速測試的事件驅動 Codex 維護線。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果當天 UTC 已有另一個 workflow-run 呼叫執行過或正在執行，它會略過。手動派送會繞過該每日活動閘門。這條線會建置完整套件分組 Vitest 效能報告，讓 Codex 只進行保留覆蓋率的小型測試效能修正，而不是大範圍重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。分組報告會記錄 Linux 與 macOS 上每個設定的 wall time 與最大 RSS，因此 before/after 比較會在持續時間差異旁呈現測試記憶體差異。如果基準有失敗測試，Codex 只能修正明顯失敗，且 after-agent 完整套件報告必須通過，才會提交任何內容。當 `main` 在 bot push 落地前前進時，這條線會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期 patch 會被略過。它使用 GitHub 託管的 Ubuntu，因此 Codex action 可以維持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是供維護者在落地後清理重複項目的手動工作流程。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會驗證已落地 PR 已合併，且每個重複項目都有共用的引用 issue 或重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求比廣泛的 CI 平台範圍更嚴格：

- 核心 production 變更會執行核心 prod 與核心 test typecheck，加上核心 lint／guards；
- 僅核心測試變更只會執行核心 test typecheck，加上核心 lint；
- extension production 變更會執行 extension prod 與 extension test typecheck，加上 extension lint；
- 僅 extension 測試變更會執行 extension test typecheck，加上 extension lint；
- 公開外掛 SDK 或外掛合約變更會擴展到 extension typecheck，因為 extensions 依賴那些核心合約（Vitest extension sweeps 仍是明確的測試工作）；
- 僅 release metadata 版本 bump 會執行目標版本／設定／根相依性檢查；
- 未知的 root／config 變更會 fail safe 到所有檢查線。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，來源編輯優先使用明確映射，接著是 sibling tests 與 import-graph dependents。共享群組聊天室傳遞設定是明確映射之一：對群組可見回覆設定、來源回覆傳遞模式，或 message-tool system prompt 的變更，會透過核心回覆測試加上 Discord 與 Slack 傳遞回歸路由，因此共享預設值變更會在第一次 PR push 前失敗。只有當變更的範圍涵蓋整個 harness，以致便宜的映射集合不再是可信 proxy 時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是儲存庫擁有、用於維護者 Linux 驗證的遠端機器包裝器。當檢查範圍對本機編輯迴圈而言太廣、CI 對等性很重要，或驗證需要秘密、Docker、套件通道、可重用機器或遠端日誌時，請從儲存庫根目錄使用它。一般的 OpenClaw 後端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是 Blacksmith 中斷、配額問題，或明確需要自有容量測試時的後備方案。

由 Crabbox 支援的 Blacksmith 執行會預熱、宣告、同步、執行、回報並清理一次性 Testbox。內建同步健全性檢查會在必要根檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤刪除項目時快速失敗。對於刻意的大量刪除 PR，請為遠端命令設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

Crabbox 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith 命令列介面呼叫。設定 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該防護，或針對異常龐大的本機差異使用較大的毫秒值。

首次執行前，請從儲存庫根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

儲存庫包裝器會拒絕未宣告 `blacksmith-testbox` 的過期 Crabbox 二進位檔。即使 `.crabbox.yaml` 有自有雲端預設值，也請明確傳入提供者。在 Codex 工作樹或連結/稀疏 checkout 中，避免使用本機 `pnpm crabbox:run` 腳本，因為 pnpm 可能會在 Crabbox 啟動前協調相依性；請改為直接呼叫 node 包裝器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 支援的執行需要 Crabbox 0.22.0 或更新版本，讓包裝器取得目前的 Testbox 同步、佇列與清理行為。使用同層 checkout 時，請在計時或驗證工作前重新建置被忽略的本機二進位檔：

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

閱讀最終 JSON 摘要。有用的欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。對於委派的 Blacksmith Testbox 執行，Crabbox 包裝器結束碼和 JSON 摘要就是命令結果。連結的 GitHub Actions 執行負責 hydration 和 keepalive；當 SSH 命令已經返回後，Testbox 從外部停止時，它可能會以 `cancelled` 結束。除非包裝器 `exitCode` 非零，或命令輸出顯示測試失敗，否則請將其視為清理/狀態成品。一次性 Blacksmith 支援的 Crabbox 執行應該會自動停止 Testbox；如果執行被中斷或清理狀態不明，請檢查線上機器，並只停止你建立的機器：

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

如果 Crabbox 是故障層，但 Blacksmith 本身可運作，請只將直接 Blacksmith 用於 `list`、`status` 和清理等診斷。在將直接 Blacksmith 執行視為維護者驗證前，請先修復 Crabbox 路徑。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可運作，但新的 warmup 在數分鐘後仍停在 `queued`，且沒有 IP 或 Actions 執行 URL，請將其視為 Blacksmith 提供者、佇列、帳單或組織限制壓力。停止你建立的 queued id，避免啟動更多 Testbox，並在有人檢查 Blacksmith 儀表板、帳單和組織限制時，將驗證移至下方的自有 Crabbox 容量路徑。

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確以自有容量為目標時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非工作真的需要 48xlarge 級 CPU，否則請避免 `class=beast`。`beast` 請求從 192 vCPU 開始，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額的方式。儲存庫擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域和 `capacity.hints: true`，因此經代理的 AWS 租約會列印所選區域/市場、配額壓力、Spot 後備，以及高壓力類別警告。較重的大範圍檢查使用 `fast`，只有在 standard/fast 不足時才使用 `large`，而 `beast` 只用於特殊的 CPU 密集通道，例如完整套件或全外掛 Docker 矩陣、明確的發布/阻斷驗證，或高核心效能分析。不要將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint/typecheck、小型 E2E 重現，或 Blacksmith 中斷分流。容量診斷請使用 `--market on-demand`，避免 Spot 市場波動混入訊號。

`.crabbox.yaml` 擁有自有雲端通道的提供者、同步和 GitHub Actions hydration 預設值。它會排除本機 `.git`，讓已 hydrated 的 Actions checkout 保留自己的遠端 Git 中繼資料，而不是同步維護者本機的 remote 和物件儲存，並且會排除不應傳輸的本機執行階段/建置成品。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` 擷取，以及自有雲端 `crabbox run --id <cbx_id>` 命令的非秘密環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
