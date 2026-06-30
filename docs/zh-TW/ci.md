---
read_when:
    - 你需要了解為什麼 CI 作業有執行或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次發行驗證執行或重新執行
    - 你正在變更 ClawSweeper 派送或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發布總括項目，以及本機命令等效項目
title: CI 管線
x-i18n:
    generated_at: "2026-06-30T13:45:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 上執行。正式
`main` 推送會先通過 90 秒的託管 runner 准入視窗。
既有的 `CI` concurrency group 會在較新的
commit 送達時取消那個等待中的執行，因此連續合併不會各自註冊完整的 Blacksmith
矩陣。Pull request 和手動 dispatch 會略過等待。接著 `preflight` job
會分類差異，並在只有不相關區域變更時關閉昂貴的 lane。手動 `workflow_dispatch`
執行會刻意繞過智慧範圍判定，並展開完整圖形以供 release candidate 和廣泛
驗證使用。Android lane 會透過 `include_android` 保持選擇性啟用。僅限發行的
外掛覆蓋率位於獨立的 [`Plugin Prerelease`](#plugin-prerelease)
workflow，且只會從 [`Full Release Validation`](#full-release-validation)
或明確的手動 dispatch 執行。

## 管線概覽

| Job                                | 用途                                                                                                   | 執行時機                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件變更、已變更範圍、已變更 extensions，並建置 CI manifest                   | 一律在非草稿推送和 PR 上執行                  |
| `runner-admission`                 | 在註冊 Blacksmith 工作前，為正式 `main` 推送提供託管的 90 秒 debounce                | 每次 CI 執行；只在正式 `main` 推送時 sleep |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 進行已變更 workflow 稽核，以及 production lockfile 稽核                 | 一律在非草稿推送和 PR 上執行                  |
| `check-dependencies`               | Production Knip 僅依賴項檢查，加上未使用檔案 allowlist guard                                 | 節點相關變更                               |
| `build-artifacts`                  | 建置 `dist/`、Control UI、built-CLI smoke 檢查、嵌入式 built-artifact 檢查，以及可重用 artifacts | 節點相關變更                               |
| `checks-fast-core`                 | 快速 Linux 正確性 lane，例如 bundled、protocol、QA Smoke CI，以及 CI-routing 檢查                | 節點相關變更                               |
| `checks-fast-contracts-plugins-*`  | 兩個分 shard 的外掛 contract 檢查                                                                        | 節點相關變更                               |
| `checks-fast-contracts-channels-*` | 兩個分 shard 的 channel contract 檢查                                                                       | 節點相關變更                               |
| `checks-node-core-*`               | 核心節點測試 shard，排除 channel、bundled、contract 和 extension lane                          | 節點相關變更                               |
| `check-*`                          | 分 shard 的主要本機 gate 等價項目：prod types、lint、guards、test types，以及 strict smoke                | 節點相關變更                               |
| `check-additional-*`               | 架構、分 shard 的 boundary/prompt drift、extension guards、package boundary，以及 runtime topology     | 節點相關變更                               |
| `checks-node-compat-node22`        | 節點 22 相容性 build 和 smoke lane                                                                | 發行用手動 CI dispatch                     |
| `check-docs`                       | 文件格式化、lint，以及 broken-link 檢查                                                             | 文件變更                                        |
| `skills-python`                    | Python 支援的 Skills 的 Ruff + pytest                                                                    | Python-skill 相關變更                       |
| `checks-windows`                   | Windows 特定 process/path 測試，加上共用 runtime import specifier regression                      | Windows 相關變更                            |
| `macos-node`                       | 使用共用 built artifacts 的 macOS TypeScript 測試 lane                                               | macOS 相關變更                              |
| `macos-swift`                      | macOS app 的 Swift lint、build 和測試                                                            | macOS 相關變更                              |
| `ios-build`                        | Xcode project 產生，加上 iOS app simulator build                                                 | iOS app、shared app kit，或 Swabble 變更         |
| `android`                          | 兩種 flavor 的 Android unit test，加上一個 debug APK build                                              | Android 相關變更                            |
| `test-performance-agent`           | 受信任活動後每日執行 Codex slow-test 最佳化                                                 | Main CI 成功或手動 dispatch                  |
| `openclaw-performance`             | 每日/隨需的 Kova runtime performance 報告，包含 mock-provider、deep-profile 和 GPT 5.5 live lane | 排程和手動 dispatch                       |

## Fail-fast 順序

1. `runner-admission` 只會等待正式 `main` 推送；較新的推送會在 Blacksmith 註冊前取消該執行。
2. `preflight` 決定哪些 lane 會存在。`docs-scope` 和 `changed-scope` 邏輯是此 job 內的步驟，不是獨立 job。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不等待較重的 artifact 和 platform matrix job。
4. `build-artifacts` 會與快速 Linux lane 重疊，讓下游 consumers 可在共用 build 就緒後立即開始。
5. 較重的 platform 和 runtime lane 會在之後展開：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

當較新的推送落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的 job 標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則將其視為 CI 雜訊。Matrix job 使用 `fail-fast: false`，而 `build-artifacts` 會直接回報嵌入式 channel、core-support-boundary 和 gateway-watch 失敗，而不是排入小型 verifier job。自動 CI concurrency key 有版本標記（`CI-v7-*`），因此 GitHub 端在舊 queue group 中的殭屍執行無法無限期阻塞較新的 main 執行。手動 full-suite 執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>`，從 GitHub Actions 摘要 wall time、queue time、最慢的 jobs、failures，以及 `pnpm-store-warmup` fanout barrier。CI 也會將相同的執行摘要上傳為 `ci-timings-summary` artifact。若要查看 build timing，請檢查 `build-artifacts` job 的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會列印 `[build-all] phase timings:` 並包含 `ui:build`；該 job 也會上傳 `startup-memory` artifact。

對於 pull request 執行，終端 timing-summary job 會先從受信任的 base revision 執行 helper，再將 `GH_TOKEN` 傳給 `gh run view`。這會讓帶 token 的查詢遠離分支控制的程式碼，同時仍能摘要該 pull request 目前的 CI 執行。

## PR context 和 evidence

外部 contributor PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR context 和 evidence gate。該 workflow 會 checkout 受信任的
base commit，且只評估 PR body；它不會執行 contributor branch 的程式碼。

此 gate 適用於不是 repository owners、members、
collaborators 或 bots 的 PR authors。當 PR body 包含 authored
`What Problem This Solves` 和 `Evidence` sections 時即通過。Evidence 可以是聚焦的
test、CI result、screenshot、recording、terminal output、live observation、
redacted log 或 artifact link。Body 提供意圖與有用的驗證；
reviewers 會檢查 code、tests 和 CI 以評估正確性。

當檢查失敗時，請更新 PR body，而不是再推送另一個 code commit。

## 範圍和路由

Scope 邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit tests 覆蓋。手動 dispatch 會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI workflow edits** 會驗證節點 CI graph 加上 workflow linting，但本身不會強制執行 Windows、iOS、Android 或 macOS native builds；那些 platform lane 仍只會依 platform source changes 進行範圍判定。
- **Workflow Sanity** 會對所有 workflow YAML files 執行 `actionlint`、`zizmor`、composite-action interpolation guard，以及 conflict-marker guard。PR-scoped `security-fast` job 也會對已變更 workflow files 執行 `zizmor`，讓 workflow security findings 在 main CI graph 中提早失敗。
- **Docs on `main` pushes** 會由 standalone `Docs` workflow 使用與 CI 相同的 ClawHub docs mirror 檢查，因此混合 code+docs 推送不會也排入 CI `check-docs` shard。Pull requests 和 manual CI 在 docs changed 時仍會從 CI 執行 `check-docs`。
- **TUI PTY** 會在 TUI 變更時於 `checks-node-core-runtime-tui-pty` Linux 節點 shard 中執行。該 shard 會使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時覆蓋 deterministic `TuiBackend` fixture lane，以及只 mock external model endpoint 的較慢 `tui --local` smoke。
- **CI routing-only edits, selected cheap core-test fixture edits, and narrow plugin contract helper/test-routing edits** 會使用快速的節點限定 manifest path：`preflight`、security，以及單一 `checks-fast-core` task。當變更僅限於 fast task 直接 exercise 的 routing 或 helper surfaces 時，該 path 會略過 build artifacts、節點 22 compatibility、channel contracts、full core shards、bundled-plugin shards，以及 additional guard matrices。
- **Windows Node checks** 會限定於 Windows 特定 process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該 lane 的 CI workflow surfaces；不相關的 source、外掛、install-smoke 和 test-only 變更會留在 Linux 節點 lane 上。

最慢的節點測試系列會被拆分或平衡，讓每個作業保持小規模且不過度保留執行器：外掛合約與通道合約各自以兩個加權、Blacksmith 支援的分片執行，並搭配標準 GitHub 執行器備援；核心單元快速/支援通道會分開執行；核心執行階段基礎設施會拆分為狀態、程序/設定、共享，以及三個排程網域分片；自動回覆會以平衡的工作程序執行（並將回覆子樹拆分成 agent-runner、dispatch，以及 commands/state-routing 分片）；代理式閘道/伺服器設定則拆分到 chat/auth/model/http-plugin/runtime/startup 通道，而不是等待已建置成品。接著，一般 CI 只會將隔離的基礎設施 include-pattern 分片打包成最多 64 個測試檔案的決定性組合，縮小節點矩陣，而不合併非隔離的 command/cron、具狀態 agents-core，或 gateway/server 套件；繁重的固定套件維持在 8 vCPU，而打包後與較低權重的通道使用 4 vCPU。標準儲存庫上的 pull request 會使用額外的精簡准入計畫：相同的每設定群組會在目前 34 個作業的 Linux 節點計畫內，以隔離子程序執行，因此單一 PR 不會註冊完整的 70 多個作業節點矩陣。`main` 推送、手動派送與發行閘門會保留完整矩陣。廣泛的瀏覽器、QA、媒體與雜項外掛測試會使用其專用 Vitest 設定，而不是共享的外掛統包設定。Include-pattern 分片會使用 CI 分片名稱記錄計時項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分完整設定與篩選後的分片。`check-additional-*` 會將套件邊界編譯/canary 工作放在一起，並將執行階段拓撲架構與閘道監看覆蓋率分開；邊界防護清單會條帶化為一個提示繁重分片，以及一個包含其餘防護條帶的合併分片，每個分片都會並行執行選定的獨立防護，並列印每個檢查的計時。昂貴的 Codex happy-path 提示快照漂移檢查會作為其自己的額外作業執行，且只用於手動 CI 與影響提示的變更，因此一般無關的節點變更不會被冷提示快照生成阻塞，邊界分片也會保持平衡，同時提示漂移仍會固定到造成漂移的 PR；相同旗標會在已建置成品的核心 support-boundary 分片中略過提示快照 Vitest 生成。閘道監看、通道測試與核心 support-boundary 分片會在 `dist/` 與 `dist-runtime/` 已建置後，於 `build-artifacts` 內並行執行。

一旦准入，標準 Linux CI 最多允許 24 個並行節點測試作業，以及
12 個較小的 fast/check 通道；Windows 與 Android 維持在兩個，因為
那些執行器池較窄。

精簡 PR 計畫會為目前套件發出 18 個節點作業：完整設定
群組會在隔離子程序中批次執行，批次逾時為 120 分鐘，
而 include-pattern 群組共用相同的有界作業預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，接著建置 Play debug APK。第三方 flavor 沒有獨立的來源集或 manifest；其單元測試通道仍會以 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送時重複執行 debug APK 封裝作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（固定到最新 Knip 版本的正式環境 Knip 相依性專用檢查，且針對 `dlx` 安裝停用 pnpm 的最低發布年齡）與 `pnpm deadcode:unused-files`，後者會將 Knip 的正式環境未使用檔案發現結果與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的未使用檔案，或留下過時的允許清單項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的有意動態外掛、已生成、建置、即時測試與套件橋接介面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會簽出或執行不受信任的 pull request 程式碼。此工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App 權杖，然後將精簡的 `repository_dispatch` payload 派送到 `openclaw/clawsweeper`。

此工作流程有四個通道：

- `clawsweeper_item` 用於精確的 issue 與 pull request 審查請求；
- `clawsweeper_comment` 用於 issue 留言中的明確 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit 層級審查請求；
- `github_activity` 用於 ClawSweeper agent 可檢查的一般 GitHub 活動。

`github_activity` 通道只會轉送正規化後的中繼資料：事件類型、動作、actor、儲存庫、項目編號、URL、標題、狀態，以及在有留言或審查時提供短摘錄。它刻意避免轉送完整 webhook 內文。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，它會將正規化事件張貼到 ClawSweeper agent 的 OpenClaw 閘道 hook。

一般活動是觀察，而不是預設交付。ClawSweeper agent 會在其提示中收到 Discord 目標，且只有在事件令人意外、可採取行動、有風險，或對作業有用時，才應張貼到 `#clawsweeper`。例行開啟、編輯、機器人雜訊、重複 webhook 雜訊，以及正常審查流量都應產生 `NO_REPLY`。

在此路徑中，GitHub 標題、留言、本文、審查文字、分支名稱與 commit 訊息都應一律視為不受信任的資料。它們是摘要與分流的輸入，而不是工作流程或 agent 執行階段的指令。

## 手動派送

手動 CI 派送會執行與一般 CI 相同的作業圖，但會強制開啟所有非 Android 範圍通道：Linux 節點分片、 bundled-plugin 分片、外掛與通道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、已建置成品煙霧檢查、文件檢查、Python skills、Windows、macOS、iOS 建置，以及 Control UI i18n。獨立手動 CI 派送只有在 `include_android=true` 時才會執行 Android；完整發行總控會透過傳遞 `include_android=true` 啟用 Android。外掛預發行靜態檢查、僅限發行的 `agentic-plugins` 分片、完整 extension 批次掃描，以及外掛預發行 Docker 通道都排除在 CI 之外。Docker 預發行套件只會在 `Full Release Validation` 以啟用發行驗證閘門的方式派送獨立的 `Plugin Prerelease` 工作流程時執行。

手動執行會使用唯一的並行群組，因此發行候選完整套件不會被同一 ref 上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入允許受信任的呼叫者對分支、標籤或完整 commit SHA 執行該圖，同時使用所選派送 ref 的工作流程檔案。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                          | 作業                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 手動 CI 派送與非標準儲存庫備援、CodeQL JavaScript/actions 品質掃描、workflow-sanity、labeler、auto-response、CI 外部的文件工作流程，以及 install-smoke 預檢，讓 Blacksmith 矩陣可以更早排隊                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、較低權重的 extension 分片、`checks-fast-core`、外掛/通道合約分片、多數 bundled/較低權重 Linux 節點分片、`check-guards`、`check-prod-types`、`check-test-types`、選定的 `check-additional-*` 分片，以及 `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的繁重 Linux 節點套件、boundary/extension-heavy `check-additional-*` 分片，以及 `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`、`check-lint`（對 CPU 足夠敏感，以致 8 vCPU 的成本高於節省）；install-smoke Docker 建置（32-vCPU 佇列時間的成本高於節省）                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；fork 會退回 `macos-26`                                                                                                                                                                                                  |

## 執行器註冊預算

OpenClaw 目前的 GitHub 執行器註冊 bucket 在 `ghx api rate_limit` 中回報每 5 分鐘 10,000 次自託管
執行器註冊。每次調整前請重新檢查
`actions_runner_registration`，因為 GitHub 可能會變更
此 bucket。該限制由 `openclaw` 組織中的所有 Blacksmith 執行器註冊共用，因此新增另一個 Blacksmith 安裝不會新增
新的 bucket。

將 Blacksmith 標籤視為爆量控制的稀缺資源。只負責
路由、通知、摘要、選擇分片，或執行短 CodeQL 掃描的作業，
應維持在 GitHub 託管執行器上，除非它們已有量測到的 Blacksmith 專屬
需求。任何新的 Blacksmith 矩陣、更大的 `max-parallel`，或高頻率
工作流程，都必須顯示其最壞情況註冊數，並將組織層級
目標維持在即時 bucket 約 60% 以下。以目前 10,000 次註冊
bucket 來說，這代表 6,000 次註冊的操作目標，並為
並行儲存庫、重試與爆量重疊保留餘裕。

標準儲存庫 CI 會將 Blacksmith 保持為一般推送與 pull-request 執行的預設執行器路徑。`workflow_dispatch` 與非標準儲存庫執行會使用 GitHub 託管執行器，但一般標準執行目前不會探測 Blacksmith 佇列健康狀態，也不會在 Blacksmith 無法使用時自動退回 GitHub 託管標籤。

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

`OpenClaw Performance` 是產品／執行階段效能工作流程。它每天在 `main` 上執行，也可以手動派送：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動派送通常會對工作流程 ref 進行基準測試。設定 `target_ref`，即可用目前的工作流程實作對發行標籤或另一個分支進行基準測試。已發布的報告路徑和最新指標會依受測 ref 作為索引鍵，而且每個 `index.md` 都會記錄受測 ref/SHA、工作流程 ref/SHA、Kova ref、設定檔、lane 驗證模式、模型、重複次數，以及情境篩選器。

此工作流程會從固定版本安裝 OCM，並從 `openclaw/Kova` 的固定 `kova_ref` 輸入安裝 Kova，接著執行三個 lane：

- `mock-provider`：針對本機建置執行階段執行 Kova 診斷情境，並使用具決定性的假 OpenAI 相容驗證。
- `mock-deep-profile`：針對啟動、閘道和 agent 回合熱點進行 CPU／heap／trace 效能分析。
- `live-openai-candidate`：真實的 OpenAI `openai/gpt-5.5` agent 回合；當 `OPENAI_API_KEY` 無法使用時會略過。

mock-provider lane 也會在 Kova 通過後執行 OpenClaw 原生原始碼探針：預設、hook 和 50 個外掛啟動案例中的閘道啟動時間與記憶體；內建外掛匯入 RSS、重複的模擬 OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道的命令列介面啟動指令，以及 SQLite 狀態 smoke 效能探針。當受測 ref 可取得先前發布的 mock-provider 原始碼報告時，原始碼摘要會將目前 RSS 和 heap 值與該基準相比，並將大型 RSS 增加標記為 `watch`。原始碼探針 Markdown 摘要位於報告套件中的 `source/index.md`，旁邊附有原始 JSON。

每個 lane 都會上傳 GitHub artifacts。當設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、套件、`index.md` 和原始碼探針 artifacts 提交到 `openclaw/clawgrit-reports`，路徑為 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。目前受測 ref 指標會寫入 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發行驗證

`Full Release Validation` 是「發行前執行所有項目」的手動總括工作流程。它接受分支、標籤或完整 commit SHA，使用該目標派送手動 `CI` 工作流程，派送 `Plugin Prerelease` 以取得僅限發行的外掛／套件／靜態／Docker 證明，並派送 `OpenClaw Release Checks` 以進行安裝 smoke、套件接受度、跨 OS 套件檢查、從 QA 設定檔證據渲染成熟度計分卡、QA Lab 同等性、Matrix 和 Telegram lane。stable 和 full 設定檔一律包含完整 live/E2E 和 Docker 發行路徑 soak 覆蓋；beta 設定檔可透過 `run_release_soak=true` 選擇加入。標準套件 Telegram E2E 會在 Package Acceptance 內執行，因此完整候選版本不會啟動重複的 live poller。發布後，傳入 `release_package_spec` 即可在 release checks、Package Acceptance、Docker、跨 OS 和 Telegram 中重用已發行的 npm 套件，而不需重新建置。`npm_telegram_package_spec` 僅用於聚焦的已發布套件 Telegram 重新執行。Codex 外掛 live package lane 預設使用相同選取狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/artifact 執行會從選取 ref 打包 `extensions/codex`。如需自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` specs，請明確設定 `codex_plugin_spec`。

請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、精確工作流程 job 名稱、設定檔差異、artifacts，以及聚焦重新執行 handles。

`OpenClaw Release Publish` 是手動且會修改狀態的發行工作流程。請在發行標籤存在且 OpenClaw npm preflight 已成功後，從 `release/YYYY.M.PATCH` 或 `main` 派送它。它會驗證 `pnpm plugins:sync:check`，為所有可發布的外掛套件派送 `Plugin NPM Release`，為相同發行 SHA 派送 `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。stable 發布也需要精確的 `windows_node_tag`；工作流程會驗證 Windows 原始碼發行，並在任何發布子工作流程之前，將其 x64/ARM64 安裝程式與候選版本已核准的 `windows_node_installer_digests` 輸入進行比對，接著在發布 GitHub release draft 前，推廣並驗證相同的固定安裝程式 digest，以及精確的 companion asset 和 checksum 合約。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上提供固定 commit 證明，請使用輔助工具，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程派送 ref 必須是分支或標籤，不能是原始 commit SHA。輔助工具會在目標 SHA 推送暫時的 `release-ci/<sha>-...` 分支，從該固定 ref 派送 `Full Release Validation`，驗證每個子工作流程 `headSha` 都符合目標，並在執行完成時刪除暫時分支。若任何子工作流程在不同 SHA 上執行，總括驗證器也會失敗。

`release_profile` 控制傳入 release checks 的 live／provider 廣度。手動發行工作流程預設為 `stable`；只有在你刻意需要廣泛 advisory provider/media 矩陣時才使用 `full`。stable 和 full release checks 一律執行完整 live/E2E 和 Docker 發行路徑 soak；beta 設定檔可透過 `run_release_soak=true` 選擇加入。

- `minimum` 保留最快的 OpenAI／core 發行關鍵 lane。
- `stable` 加入 stable provider/backend 集合。
- `full` 執行廣泛 advisory provider/media 矩陣。

總括流程會記錄已派送的子執行 ID，而最終的 `Verify full validation` job 會重新檢查目前子執行結論，並為每個子執行附加最慢 job 表格。如果子工作流程重新執行後轉為綠燈，只需重新執行父驗證器 job，即可重新整理總括結果和時間摘要。

若要復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。對發行候選版本使用 `all`，只針對一般完整 CI 子項使用 `ci`，只針對外掛 prerelease 子項使用 `plugin-prerelease`，針對每個發行子項使用 `release-checks`，或在總括流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會讓失敗的發行 box 在聚焦修正後重新執行時保持有界。對於單一失敗的跨 OS lane，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合，例如 `windows/packaged-upgrade`；長時間跨 OS 指令會發出心跳偵測行，而 packaged-upgrade 摘要會包含各階段時間。QA release-check lane 屬於 advisory，但標準執行階段工具覆蓋 gate 例外；當必要的 OpenClaw 動態工具從標準 tier 摘要中漂移或消失時，它會阻擋。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將選取 ref 解析一次為 `release-package-under-test` tarball，接著將該 artifact 傳給跨 OS 檢查和 Package Acceptance，並在執行 soak 覆蓋時傳給 live/E2E 發行路徑 Docker 工作流程。這能讓套件位元組在各個發行 box 間保持一致，並避免在多個子 job 中重新打包同一個候選版本。對於 Codex npm-plugin live lane，release checks 會傳入從 `release_package_spec` 衍生的相符已發布外掛 spec、傳入操作者提供的 `codex_plugin_spec`，或將輸入留空，讓 Docker 指令碼打包選取 checkout 的 Codex 外掛。

對於 `ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行，較新的總括流程會取代較舊的總括流程。當父流程被取消時，父監控器會取消任何已派送的子工作流程，因此較新的 main 驗證不會卡在過時的兩小時 release-check 執行後面。發行分支／標籤驗證和聚焦重新執行群組會保留 `cancel-in-progress: false`。

## Live 與 E2E shards

發行 live/E2E 子流程會保留廣泛的原生 `pnpm test:live` 覆蓋，但它會透過 `scripts/test-live-shard.mjs` 以具名 shards 執行，而不是單一序列 job：

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

這會保留相同檔案覆蓋，同時讓緩慢的 live provider 失敗更容易重新執行和診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` shard 名稱仍可用於手動一次性重新執行。

原生 live media shards 會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；media jobs 只會在設定前驗證二進位檔。請將 Docker-backed live suites 保留在一般 Blacksmith runners 上；container jobs 不是啟動巢狀 Docker 測試的正確位置。

由 Docker 支援的即時模型/後端分片會針對每個選定的提交使用獨立共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發布工作流程會建置並推送該映像一次，接著 Docker 即時模型、依提供者分片的閘道、命令列介面後端、ACP 繫結，以及 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片在指令碼層級帶有明確的 `timeout` 上限，低於工作流程作業逾時時間，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個發布檢查預算。如果這些分片各自重新建置完整原始碼 Docker 目標，代表發布執行設定錯誤，並會在重複的映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證原始碼樹，而套件驗收會透過使用者安裝或更新後所執行的同一套 Docker E2E harness，驗證單一 tarball。

### 作業

1. `resolve_package` 會取出 `workflow_ref`、解析一個套件候選、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者上傳為 `package-under-test` 成品，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256，以及 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備套件摘要 Docker 映像，並針對該套件執行選定的 Docker lanes，而不是打包工作流程取出的程式碼。當 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會先準備套件和共用映像一次，然後將這些 lanes 展開為具有唯一成品的平行目標 Docker 作業。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。它會在 `telegram_mode` 不是 `none` 時執行，且當套件驗收已解析出套件時，會安裝同一個 `package-under-test` 成品；獨立的 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker 驗收，或可選 Telegram lane 失敗時讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。用於已發布的預發布/穩定版驗收。
- `source=ref` 會打包可信任的 `package_ref` 分支、標籤，或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤、驗證所選提交可從儲存庫分支歷史或發布標籤抵達、在分離的 worktree 中安裝相依項，並以 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 憑證、非預設 HTTPS 連接埠、私有/內部/特殊用途主機名稱或解析出的 IP，以及重新導向到相同公開安全政策以外的位置。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名的 trusted-source 政策下載 HTTPS `.tgz`；必須提供 `package_sha256` 和 `trusted_source_id`。僅用於維護者擁有、需要設定主機、連接埠、路徑前綴、重新導向主機，或私有網路解析的企業鏡像或私有套件儲存庫。如果政策宣告 bearer auth，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；仍會拒絕 URL 內嵌憑證。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為可選，但對外共享成品應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的可信任工作流程/harness 程式碼。`package_ref` 是 `source=ref` 時會被打包的來源提交。這讓目前的測試 harness 能驗證較舊的可信任來源提交，而不需執行舊的工作流程邏輯。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` profile 使用離線外掛覆蓋範圍，因此已發布套件驗證不會受即時 ClawHub 可用性阻擋。可選的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm spec 路徑給獨立 dispatch 使用。

如需專用的更新與外掛測試政策，包括本機命令、
Docker lanes、套件驗收輸入、發布預設值，以及失敗分診，
請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`，以及 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、即時 ClawHub skill 安裝、過期外掛相依清理、已設定外掛安裝修復、離線外掛、外掛更新，以及 Telegram 證明都使用同一個已解析的套件 tarball。在發布 beta 後，於 Full Release Validation 或 OpenClaw Release Checks 上設定 `release_package_spec`，即可針對已交付的 npm 套件執行相同矩陣而不重新建置；只有當套件驗收需要與其他發布驗證不同的套件時，才設定 `package_acceptance_package_spec`。跨 OS 發布檢查仍涵蓋 OS 特定的 onboarding、安裝程式，以及平台行為；套件/更新產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker lane 會在阻擋式發布路徑中，每次執行驗證一個已發布套件基準。在套件驗收中，已解析的 `package-under-test` tarball 一律是候選，而 `published_upgrade_survivor_baseline` 會選取後備已發布基準，預設為 `openclaw@latest`；失敗 lane 的重新執行命令會保留該基準。當 Full Release Validation 使用 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展到最新四個穩定 npm 發布，加上固定的外掛相容性邊界發布，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw 外掛安裝、波浪號記錄檔路徑，以及過期 legacy 外掛相依根目錄的議題形狀 fixture。多基準 published-upgrade survivor 選取會依基準分片成個別目標 Docker runner 作業。獨立的 `Update Migration` 工作流程會在問題是詳盡的已發布更新清理，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker lane 搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本機彙總執行可以使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 spec、使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 給情境矩陣。已發布 lane 會使用內建的 `openclaw config set` 命令 recipe 設定基準，在 `summary.json` 記錄 recipe 步驟，並在閘道啟動後探測 `/healthz`、`/readyz`，以及 RPC 狀態。Windows 打包與安裝程式 fresh lanes 也會驗證已安裝套件能從原始絕對 Windows 路徑匯入 browser-control 覆寫。OpenAI 跨 OS agent-turn smoke 在有設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因此安裝與閘道證明會維持在 GPT-5 測試模型上，同時避免 GPT-4.x 預設值。

### Legacy 相容性視窗

套件驗收對已發布套件有有限的 legacy 相容性視窗。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可能指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的假 git fixture 修剪缺少的 pnpm `patchedDependencies`，並可記錄缺少的持久化 `update.channel`；
- 外掛 smokes 可讀取 legacy 安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可允許設定中繼資料遷移，同時仍要求安裝記錄與不重新安裝行為維持不變。

已發布的 `2026.4.26` 套件也可對已交付的本機建置中繼資料 stamp 檔案發出警告。之後的套件必須符合現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本，以及 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時，以及重新執行命令。請優先重新執行失敗的套件 profile 或精確 Docker lanes，而不是重新執行完整發布驗證。

## 安裝 smoke

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用相同的範圍指令碼。它會將 smoke 覆蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會在 pull request 觸及 Docker/套件介面、內建外掛套件/manifest 變更，或 Docker smoke 作業會演練的核心外掛/頻道/閘道/外掛 SDK 介面時執行。僅原始碼的內建外掛變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查命令列介面、執行 agents delete shared-workspace 命令列介面 smoke、執行容器 gateway-network e2e、驗證內建 extension build arg，並在 240 秒的彙總命令逾時內執行有界的 bundled-plugin Docker profile（每個情境的 Docker 執行會另外設上限）。
- **完整路徑**會將 QR 套件安裝與安裝程式 Docker/update 覆蓋保留給夜間排程執行、手動 dispatch、workflow-call 發行檢查，以及真正觸及安裝程式/套件/Docker 介面的 pull request。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile smoke 映像，接著將 QR 套件安裝、根 Dockerfile/閘道 smoke、安裝程式/update smoke，以及快速 bundled-plugin Docker E2E 作為個別作業執行，因此安裝程式工作不必等在根映像 smoke 後面。

`main` 推送（包含 merge commit）不會強制使用完整路徑；當變更範圍邏輯會在推送上要求完整覆蓋時，workflow 會保留快速 Docker smoke，並將完整 install smoke 留給夜間或發行驗證。

較慢的 Bun 全域安裝 image-provider smoke 由 `run_bun_global_install_smoke` 另行 gate。它會在夜間排程與 release checks workflow 中執行，且手動 `Install Smoke` dispatch 可選擇納入它，但 pull request 與 `main` 推送不會執行。一般 PR CI 仍會針對與 Node 相關的變更執行快速 Bun launcher regression lane。QR 與安裝程式 Docker 測試保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/update/plugin-dependency lane 的純 Node/Git runner；
- 將同一個 tarball 安裝到 `/app`，供一般功能 lane 使用的功能映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的 plan。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 依 lane 選擇映像，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主 pool slot 數量。                                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對 provider 敏感的 tail-pool slot 數量。                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider 進行節流。                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，以避免 Docker daemon create 風暴；設為 `0` 則不錯開。                |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback 逾時（120 分鐘）；選取的 live/tail lane 使用較嚴格的上限。              |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器 plan，而不執行 lane。                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；略過 cleanup smoke，讓 agent 能重現單一失敗 lane。               |

比有效上限更重的 lane 仍可從空的 pool 啟動，接著單獨執行直到釋放容量。本機彙總流程會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、發出 active-lane 狀態、保存 lane 時間以供 longest-first 排序，並預設在首次失敗後停止排程新的 pooled lane。

### 可重用 live/E2E workflow

可重用 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、lane，以及憑證覆蓋。`scripts/docker-e2e.mjs` 接著將該 plan 轉換為 GitHub outputs 與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件 artifact，或從 `package_artifact_run_id` 下載套件 artifact；驗證 tarball inventory；在 plan 需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` input 或既有的套件 digest 映像，而不是重新建置。Docker 映像 pull 會以有界的每次嘗試 180 秒逾時重試，因此卡住的 registry/cache stream 會快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發行路徑分塊

發行 Docker 覆蓋會使用較小的 chunked job 並設定 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個 chunk 只 pull 它需要的映像種類，並透過相同的加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker chunk 為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 外掛套件 lane，該 lane 會安裝候選 OpenClaw 套件、從 `codex_plugin_spec` 或同 ref tarball 安裝 Codex 外掛並明確核准 Codex 命令列介面安裝、執行 Codex 命令列介面 preflight，接著針對 OpenAI 執行多個同一工作階段的 OpenClaw agent turn。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍是彙總的 plugin/runtime alias。`install-e2e` lane alias 仍是兩個 provider 安裝程式 lane 的彙總手動重跑 alias。

當完整 release-path 覆蓋要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，且只在 OpenWebUI-only dispatch 時保留獨立的 `openwebui` chunk。bundled-channel update lane 會針對暫時性 npm 網路失敗重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane log、時間、`summary.json`、`failures.json`、階段時間、排程器 plan JSON、slow-lane 表格，以及每個 lane 的重跑命令。workflow 的 `docker_lanes` input 會針對準備好的映像執行選取的 lane，而不是 chunk job，這會將失敗 lane 的除錯限制在一個目標 Docker job 內，並為該次執行準備、下載或重用套件 artifact；如果選取的 lane 是 live Docker lane，目標 job 會為該次重跑在本機建置 live-test 映像。產生的每個 lane GitHub 重跑命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 與準備好的映像 input，因此失敗的 lane 可以重用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker artifact 並列印合併/每個 lane 的目標重跑命令
pnpm test:docker:timings <summary>   # slow-lane 與階段關鍵路徑摘要
```

排程的 live/E2E workflow 每天執行完整 release-path Docker 套件。

## 外掛 Prerelease

`Plugin Prerelease` 是成本較高的產品/套件覆蓋，因此它是由 `Full Release Validation` 或明確操作員 dispatch 的獨立 workflow。一般 pull request、`main` 推送，以及獨立手動 CI dispatch 都會關閉該套件。它會在八個 extension worker 之間平衡內建外掛測試；這些 extension shard job 一次最多執行兩個外掛 config group，每個 group 使用一個 Vitest worker 與較大的 Node heap，讓 import-heavy 的外掛批次不會建立額外 CI job。僅發行的 Docker prerelease 路徑會以小群組批次處理目標 Docker lane，以避免為一到三分鐘的 job 保留數十個 runner。該 workflow 也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` artifact；inspector finding 是 triage input，不會變更阻擋性的 Plugin Prerelease gate。

## QA Lab

QA Lab 在主要 smart-scoped workflow 之外有專用 CI lane。Agentic parity 巢狀置於廣泛 QA 與發行 harness 之下，而不是獨立的 PR workflow。當 parity 應隨廣泛驗證執行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 會在 `main` 上夜間執行並於手動 dispatch 執行；它會將 mock parity lane、live Matrix lane，以及 live Telegram 與 Discord lane 展開為平行 job。Live job 使用 `qa-live-shared` environment，而 Telegram/Discord 使用 Convex lease。

Release checks 會使用 deterministic mock provider 與 mock-qualified model（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport lane，因此 channel contract 會與 live model 延遲和一般 provider-plugin startup 隔離。live transport 閘道會停用 memory search，因為 QA parity 會另行覆蓋記憶行為；provider 連線能力則由獨立的 live model、native provider 與 Docker provider 套件覆蓋。

Matrix 會對排程與發行 gate 使用 `--profile fast`，只有在 checkout 的命令列介面支援時才加入 `--fail-fast`。命令列介面預設值與手動 workflow input 仍為 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix 覆蓋分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` job。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab lane；其 QA parity gate 會將候選與 baseline pack 作為平行 lane job 執行，接著將兩者 artifact 下載到小型 report job 中，以進行最終 parity 比較。

對於一般 PR，請遵循 scoped CI/check 證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` workflow 有意作為狹窄的第一輪安全掃描器，而不是完整 repository sweep。每日、手動與非 draft pull request guard 執行會掃描 Actions workflow 程式碼，以及風險最高的 JavaScript/TypeScript 介面，並使用高信心安全查詢，篩選到 high/critical `security-severity`。

pull request guard 會保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的變更時啟動，並執行與排程 workflow 相同的高信心安全矩陣。Android 與 macOS CodeQL 不會進入 PR 預設值。

### 安全性類別

| 類別                                              | 表面                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、祕密、沙箱、排程與閘道基準                                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，以及通道外掛執行階段、閘道、外掛 SDK、祕密、稽核接觸點                                                                |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、web-fetch 與外掛 SDK SSRF 政策表面                                                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞，以及代理工具執行閘門                                                                            |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、manifest、登錄、套件管理器安裝、來源載入，以及外掛 SDK 套件合約信任表面                                               |

### 平台特定安全性分片

- `CodeQL Android Critical Security` — 排程的 Android 安全性分片。在工作流程健全性可接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android 應用程式。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週／手動 macOS 安全性分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式，從上傳的 SARIF 中濾除依賴項建置結果，並上傳至 `/codeql-critical-security/macos`。由於即使乾淨時，macOS 建置仍主導執行時間，因此保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是相對應的非安全性分片。它只在 GitHub 託管的 Linux runner 上，針對狹窄的高價值表面執行錯誤嚴重性、非安全性的 JavaScript/TypeScript 品質查詢，因此品質掃描不會花費 Blacksmith runner 註冊預算。它的 pull request 防護刻意小於排程設定檔：非草稿 PR 只會針對代理命令／模型／工具執行與回覆分派程式碼、設定 schema／遷移／IO 程式碼、驗證／祕密／沙箱／安全性程式碼、核心通道與 bundled 通道外掛執行階段、閘道協定／伺服器方法、記憶執行階段／SDK 黏合、MCP／程序／對外傳遞、供應商執行階段／模型目錄、工作階段診斷／傳遞佇列、外掛載入器、外掛 SDK／套件合約，或外掛 SDK 回覆執行階段變更，執行相對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 與 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動 dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用於隔離執行單一品質分片的教學／迭代鉤子。

| 類別                                                    | 表面                                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、祕密、沙箱、排程與閘道安全邊界程式碼                                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | 設定 schema、遷移、正規化與 IO 合約                                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道協定 schema 與伺服器方法合約                                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與 bundled 通道外掛實作合約                                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型／供應商分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及對外傳遞合約                                                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶主機 SDK、記憶執行階段 facade、記憶外掛 SDK alias、記憶執行階段啟用黏合，以及記憶 doctor 命令                                                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結／傳遞輔助工具、診斷事件／日誌 bundle 表面，以及工作階段 doctor 命令列介面合約                                     |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 傳入回覆分派、回覆 payload／分塊／執行階段輔助工具、通道回覆選項、傳遞佇列，以及工作階段／執行緒繫結輔助工具                                               |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、供應商驗證與探索、供應商執行階段註冊、供應商預設值／目錄，以及 web／search／fetch／embedding 登錄                                                  |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 啟動、本機持久化、閘道控制流程，以及任務控制平面執行階段合約                                                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch／search、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                                                       |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公開表面，以及外掛 SDK 入口點合約                                                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端外掛 SDK 原始碼與外掛套件合約輔助工具                                                                                                                   |

品質與安全性保持分離，因此可以排程、衡量、停用或擴充品質發現，而不會遮蔽安全性訊號。Swift、Python 與 bundled-plugin CodeQL 擴充應只在狹窄設定檔具有穩定執行時間與訊號後，作為有範圍或分片的後續工作加回。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是事件驅動的 Codex 維護通道，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動 dispatch 也可以直接執行它。當 `main` 已前進，或過去一小時內已建立另一個未跳過的 Docs Agent 執行時，workflow-run 叫用會跳過。執行時，它會審閱從上一個未跳過的 Docs Agent 來源 SHA 到目前 `main` 的 commit 範圍，因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護通道，用於處理緩慢測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果同一 UTC 日已有另一個 workflow-run 叫用已執行或正在執行，它會跳過。手動 dispatch 會繞過該每日活動閘門。此通道會建置完整套件分組的 Vitest 效能報告，讓 Codex 只進行小型且保留涵蓋率的測試效能修正，而不是廣泛重構，接著重新執行完整套件報告，並拒絕降低通過基準測試數量的變更。分組報告會記錄 Linux 與 macOS 上每個設定的牆鐘時間與最大 RSS，因此前後比較會在持續時間差異旁呈現測試記憶體差異。如果基準有失敗測試，Codex 只能修正明顯失敗，且 after-agent 完整套件報告必須通過，才會提交任何內容。當 `main` 在 bot push 落地前前進時，此通道會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的過時 patch 會被跳過。它使用 GitHub 託管的 Ubuntu，因此 Codex action 可以保持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是手動維護者工作流程，用於落地後清理重複項。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會驗證已落地的 PR 已合併，且每個重複項都有共同參照的 issue 或重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界比廣泛 CI 平台範圍更嚴格：

- 核心 production 變更會執行核心 prod 與核心 test typecheck，加上核心 lint／guard；
- 核心僅測試變更只會執行核心 test typecheck，加上核心 lint；
- extension production 變更會執行 extension prod 與 extension test typecheck，加上 extension lint；
- extension 僅測試變更會執行 extension test typecheck，加上 extension lint；
- 公開外掛 SDK 或外掛合約變更會擴展至 extension typecheck，因為 extensions 依賴這些核心合約（Vitest extension sweep 仍是明確的測試工作）；
- 僅 release metadata 的版本 bump 會執行目標版本／設定／root-dependency 檢查；
- 未知的 root／設定變更會 fail safe 到所有檢查通道。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，來源編輯偏好明確對應，接著是 sibling 測試與 import-graph 相依項。共用 group-room 傳遞設定是明確對應之一：對群組可見回覆設定、來源回覆傳遞模式，或 message-tool 系統提示的變更，會路由至核心回覆測試加上 Discord 與 Slack 傳遞回歸，因此共用預設變更會在第一次 PR push 前失敗。只有當變更範圍廣及 harness，以致便宜的對應集合不是可信 proxy 時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是 repo 擁有的 remote-box wrapper，用於維護者 Linux proof。當檢查對本機編輯迴圈而言太廣、CI parity 重要，或 proof 需要祕密、Docker、套件通道、可重用 box 或遠端日誌時，請從 repo root 使用它。一般 OpenClaw backend 是 `blacksmith-testbox`；擁有的 AWS／Hetzner 容量是 Blacksmith 中斷、配額問題或明確 owned-capacity 測試時的 fallback。

Crabbox 支援的 Blacksmith 執行會預熱、宣告、同步、執行、回報並清理
一次性的 Testbox。內建的同步健全性檢查會在必要的根目錄檔案
（例如 `pnpm-lock.yaml`）消失，或 `git status --short`
顯示至少 200 個已追蹤刪除項目時快速失敗。對於刻意的大量刪除 PR，請為遠端命令設定
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

Crabbox 也會終止停留在同步階段超過五分鐘且沒有同步後輸出的
本機 Blacksmith 命令列介面呼叫。設定
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該防護，或針對異常大的本機差異使用更大的
毫秒值。

第一次執行前，請從 repo 根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo 包裝器會拒絕未宣告 `blacksmith-testbox` 的過期 Crabbox 二進位檔。即使 `.crabbox.yaml` 已有自有雲預設值，也請明確傳入提供者。在 Codex worktree 或連結/稀疏 checkout 中，避免使用本機 `pnpm crabbox:run` 腳本，因為 pnpm 可能會在 Crabbox 啟動前協調相依套件；請改為直接呼叫 node 包裝器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 支援的執行需要 Crabbox 0.22.0 或更新版本，讓包裝器取得目前的 Testbox 同步、佇列與清理行為。使用同層 checkout 時，請在計時或證明工作前重建被忽略的本機二進位檔：

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

閱讀最終 JSON 摘要。有用的欄位是 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 與 `totalMs`。對於委派的
Blacksmith Testbox 執行，Crabbox 包裝器退出碼與 JSON 摘要就是
命令結果。連結的 GitHub Actions 執行負責水合與 keepalive；當 Testbox 在 SSH
命令已返回後被外部停止時，它可能會以 `cancelled` 結束。除非
包裝器 `exitCode` 非零或命令輸出顯示測試失敗，否則請將其視為清理/狀態成品。
一次性的 Blacksmith 支援 Crabbox 執行應該會自動停止 Testbox；
如果執行被中斷或清理狀態不明，請檢查即時 boxes，並只停止
你建立的 boxes：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要在同一個已水合 box 上執行多個命令時，才使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是損壞的層，但 Blacksmith 本身可運作，請只將直接
Blacksmith 用於診斷，例如 `list`、`status` 與清理。在將直接 Blacksmith 執行視為維護者證明前，先修好
Crabbox 路徑。

如果 `blacksmith testbox list --all` 與 `blacksmith testbox status` 可運作，但新的
warmup 在幾分鐘後仍停在 `queued`，且沒有 IP 或 Actions 執行 URL，
請將其視為 Blacksmith 提供者、佇列、計費或組織限制壓力。停止
你建立的 queued ids，避免啟動更多 Testbox，並在有人檢查 Blacksmith 儀表板、
計費與組織限制時，將證明移到下方的自有 Crabbox 容量路徑。

只有在 Blacksmith 停機、受到配額限制、缺少所需環境，或明確目標就是自有容量時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務真的需要 48xlarge 等級的 CPU，否則避免使用 `class=beast`。`beast` 請求從 192 個 vCPU 起跳，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額的方式。repo 擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域與 `capacity.hints: true`，因此代理的 AWS 租約會列印所選區域/市場、配額壓力、Spot 後援與高壓等級警告。對較重的廣泛檢查使用 `fast`，只有在 standard/fast 不足時才使用 `large`，而 `beast` 只用於例外的 CPU 密集型 lane，例如完整套件或全外掛 Docker 矩陣、明確的發行/阻斷驗證，或高核心效能剖析。不要將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint/typecheck、小型 E2E 重現，或 Blacksmith 停機分流。容量診斷請使用 `--market on-demand`，避免將 Spot 市場波動混入訊號。

`.crabbox.yaml` 擁有自有雲 lane 的提供者、同步與 GitHub Actions 水合預設值。它會排除本機 `.git`，讓已水合的 Actions checkout 保留自己的遠端 Git 中繼資料，而不是同步維護者本機的 remotes 與 object stores；也會排除絕不應傳輸的本機 runtime/build 成品。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` fetch，以及自有雲 `crabbox run --id <cbx_id>` 命令的非秘密環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發頻道](/zh-TW/install/development-channels)
