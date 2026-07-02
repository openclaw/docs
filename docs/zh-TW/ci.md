---
read_when:
    - 你需要了解為什麼 CI 作業有或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次版本發布驗證執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: 持續整合作業圖、範圍閘門、發行總括作業與本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-07-02T13:57:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 時執行。正式
`main` 推送會先通過 90 秒的託管 runner 准入視窗。
現有的 `CI` concurrency group 會在較新的
commit 落地時取消等待中的執行，因此連續合併不會各自註冊完整的 Blacksmith
矩陣。Pull request 和手動 dispatch 會略過等待。接著 `preflight` job
會分類 diff，並在只有不相關區域變更時關閉昂貴的 lane。手動 `workflow_dispatch`
執行會刻意繞過智慧範圍判定，並展開完整圖形，以供 release candidate
和廣泛驗證使用。Android lane 仍透過 `include_android` 選擇加入。僅限發布的
外掛覆蓋範圍位於獨立的 [`外掛預發布`](#plugin-prerelease)
workflow，且只會由 [`完整發布驗證`](#full-release-validation)
或明確的手動 dispatch 執行。

## Pipeline 概觀

| Job                                | 用途                                                                                                   | 執行時機                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件變更、已變更範圍、已變更 extensions，並建置 CI manifest                   | 一律在非草稿推送和 PR 上執行                  |
| `runner-admission`                 | 在註冊 Blacksmith 工作前，為正式 `main` 推送進行託管 90 秒 debounce                | 每次 CI 執行；只在正式 `main` 推送時 sleep |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 進行已變更 workflow 稽核，以及 production lockfile 稽核                 | 一律在非草稿推送和 PR 上執行                  |
| `check-dependencies`               | Production Knip 僅依賴項目通過檢查，加上未使用檔案 allowlist guard                                 | Node 相關變更                               |
| `build-artifacts`                  | 建置 `dist/`、Control UI、built-CLI smoke checks、嵌入式已建置 artifact 檢查，以及可重用 artifact | Node 相關變更                               |
| `checks-fast-core`                 | 快速 Linux 正確性 lane，例如 bundled、protocol、QA Smoke CI 和 CI-routing checks                | Node 相關變更                               |
| `checks-fast-contracts-plugins-*`  | 兩個分片的外掛 contract 檢查                                                                        | Node 相關變更                               |
| `checks-fast-contracts-channels-*` | 兩個分片的 channel contract 檢查                                                                       | Node 相關變更                               |
| `checks-node-core-*`               | Core Node test shard，排除 channel、bundled、contract 和 extension lane                          | Node 相關變更                               |
| `check-*`                          | 分片的主要本機 gate 等價項：prod types、lint、guards、test types 和 strict smoke                | Node 相關變更                               |
| `check-additional-*`               | 架構、分片的 boundary/prompt drift、extension guards、package boundary 和 runtime topology     | Node 相關變更                               |
| `checks-node-compat-node22`        | Node 22 相容性建置與 smoke lane                                                                | 發布用手動 CI dispatch                     |
| `check-docs`                       | 文件格式化、lint 和 broken-link 檢查                                                             | 文件已變更                                        |
| `skills-python`                    | Python 支援的 Skills 的 Ruff + pytest                                                                    | Python-skill 相關變更                       |
| `checks-windows`                   | Windows 特定 process/path 測試，加上共享 runtime import specifier regression                      | Windows 相關變更                            |
| `macos-node`                       | 使用共享已建置 artifact 的 macOS TypeScript test lane                                               | macOS 相關變更                              |
| `macos-swift`                      | macOS app 的 Swift lint、建置和測試                                                            | macOS 相關變更                              |
| `ios-build`                        | Xcode 專案產生，加上 iOS app simulator build                                                 | iOS app、shared app kit 或 Swabble 變更         |
| `android`                          | 兩種 flavor 的 Android unit test，加上一個 debug APK build                                              | Android 相關變更                            |
| `test-performance-agent`           | 受信任活動後的每日 Codex slow-test 最佳化                                                 | Main CI 成功或手動 dispatch                  |
| `openclaw-performance`             | 使用 mock-provider、deep-profile 和 GPT 5.5 live lane 的每日/隨選 Kova runtime performance report | 排程和手動 dispatch                       |

## Fail-fast 順序

1. `runner-admission` 只會等待正式 `main` 推送；較新的推送會在 Blacksmith 註冊前取消執行。
2. `preflight` 會決定哪些 lane 實際存在。`docs-scope` 和 `changed-scope` 邏輯是此 job 內的 step，不是獨立 job。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不必等待較重的 artifact 和平台矩陣 job。
4. `build-artifacts` 會與快速 Linux lane 重疊，因此下游消費者可在共享建置就緒後立即開始。
5. 較重的平台和 runtime lane 會在之後展開：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

當較新的推送落到同一個 PR 或 `main` ref 時，GitHub 可能會將被取代的 job 標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則請將其視為 CI 雜訊。矩陣 job 使用 `fail-fast: false`，而 `build-artifacts` 會直接回報嵌入式 channel、core-support-boundary 和 gateway-watch 失敗，而不是排入很小的 verifier job。自動 CI concurrency key 有版本編號（`CI-v7-*`），因此 GitHub 端舊 queue group 中的 zombie 不會無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>`，從 GitHub Actions 摘要 wall time、queue time、最慢 job、失敗，以及 `pnpm-store-warmup` fanout barrier。CI 也會將相同的執行摘要上傳為 `ci-timings-summary` artifact。若要查看建置時間，請檢查 `build-artifacts` job 的 `Build dist` step：`pnpm build:ci-artifacts` 會列印 `[build-all] phase timings:`，並包含 `ui:build`；該 job 也會上傳 `startup-memory` artifact。

對於 pull request 執行，終端 timing-summary job 會先從受信任的 base revision 執行 helper，然後再將 `GH_TOKEN` 傳給 `gh run view`。這會讓帶 token 的查詢避開分支控制的程式碼，同時仍能摘要 pull request 目前的 CI 執行。

## PR context 和證據

外部 contributor PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR context 和證據 gate。該 workflow 會 checkout 受信任的
base commit，且只評估 PR body；它不會執行 contributor branch 的程式碼。

此 gate 適用於不是 repository owner、member、
collaborator 或 bot 的 PR 作者。當 PR body 包含作者撰寫的
`What Problem This Solves` 和 `Evidence` section 時即通過。證據可以是聚焦的
test、CI result、screenshot、recording、terminal output、live observation、
redacted log 或 artifact link。Body 提供意圖和有用的驗證；
reviewer 會檢查程式碼、測試和 CI 以評估正確性。

當檢查失敗時，請更新 PR body，而不是再推送另一個 code commit。

## Scope 和 routing

Scope 邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit test 覆蓋。手動 dispatch 會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI workflow 編輯**會驗證 Node CI graph 加上 workflow linting，但本身不會強制 Windows、iOS、Android 或 macOS native build；那些平台 lane 仍限於平台 source 變更。
- **Workflow Sanity** 會對所有 workflow YAML 檔案執行 `actionlint`、`zizmor`，以及 composite-action interpolation guard 和 conflict-marker guard。PR-scoped `security-fast` job 也會對已變更的 workflow 檔案執行 `zizmor`，因此 workflow security finding 會在主要 CI graph 中提早失敗。
- **`main` 推送上的文件**會由獨立的 `Docs` workflow 使用與 CI 相同的 ClawHub docs mirror 進行檢查，因此混合 code+docs 推送不會也排入 CI `check-docs` shard。Pull request 和手動 CI 在文件變更時仍會從 CI 執行 `check-docs`。
- **TUI PTY** 會在 TUI 變更時於 `checks-node-core-runtime-tui-pty` Linux Node shard 中執行。該 shard 會使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時覆蓋確定性的 `TuiBackend` fixture lane，以及只 mock 外部模型 endpoint、較慢的 `tui --local` smoke。
- **僅 CI routing 編輯、選定的便宜 core-test fixture 編輯，以及狹窄的外掛 contract helper/test-routing 編輯**會使用快速 Node-only manifest path：`preflight`、security，以及單一 `checks-fast-core` task。當變更僅限於快速 task 直接測試的 routing 或 helper surface 時，該 path 會略過 build artifacts、Node 22 相容性、channel contracts、完整 core shards、bundled-plugin shards 和 additional guard matrices。
- **Windows Node checks** 限於 Windows 特定 process/path wrapper、npm/pnpm/UI runner helper、package manager config，以及會執行該 lane 的 CI workflow surface；不相關的 source、外掛、install-smoke 和 test-only 變更仍留在 Linux Node lane。

最慢的節點測試家族會被拆分或平衡，讓每個工作保持小型規模而不會過度保留 runner：外掛合約與通道合約各自以兩個加權、由 Blacksmith 支援的分片執行，並保留標準 GitHub runner 後備；核心單元 fast/support lane 分開執行；核心執行階段基礎設施拆分為 state、process/config、shared，以及三個排程領域分片；自動回覆以平衡 worker 執行（reply 子樹拆分為 agent-runner、dispatch，以及 commands/state-routing 分片）；agentic gateway/server 設定拆分到 chat/auth/model/http-plugin/runtime/startup lane，而不是等待建置成品。一般 CI 接著只把隔離的基礎設施 include-pattern 分片打包成最多 64 個測試檔案的確定性 bundle，減少節點矩陣，而不合併非隔離的 command/cron、有狀態 agents-core，或 gateway/server 套件；重量級固定套件維持在 8 vCPU，而已打包與較低權重的 lane 使用 4 vCPU。標準儲存庫上的 pull request 使用額外的精簡 admission plan：相同的 per-config 群組會在目前 34-job Linux 節點計畫內以隔離子程序執行，因此單一 PR 不會註冊完整的 70 多個 job 節點矩陣。`main` push、手動 dispatch，以及 release gate 會保留完整矩陣。廣泛的瀏覽器、QA、媒體，以及雜項外掛測試使用各自專用的 Vitest 設定，而不是共用的外掛 catch-all。Include-pattern 分片會使用 CI 分片名稱記錄 timing entry，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個設定與已篩選的分片。`check-additional-*` 會把套件邊界編譯/canary 工作放在一起，並把執行階段拓撲架構與閘道 watch coverage 分開；boundary guard 清單會被條帶化為一個 prompt-heavy 分片，以及一個結合剩餘 guard stripe 的合併分片，每個分片會並行執行選定的獨立 guard 並印出各檢查 timing。昂貴的 Codex happy-path prompt snapshot drift 檢查會作為自己的 additional job 執行，僅用於手動 CI 和會影響 prompt 的變更，因此一般不相關的節點變更不會卡在 cold prompt snapshot 產生後面，boundary 分片也能維持平衡，同時 prompt drift 仍會釘選到造成它的 PR；相同旗標會在 built-artifact core support-boundary 分片內略過 prompt snapshot Vitest 產生。閘道 watch、通道測試，以及 core support-boundary 分片會在 `dist/` 與 `dist-runtime/` 已建置完成後，於 `build-artifacts` 內並行執行。

一旦准入，標準 Linux CI 允許最多 24 個節點測試工作並行，
較小的 fast/check lane 則允許 12 個；Windows 與 Android 維持在兩個，
因為那些 runner pool 較窄。

精簡 PR 計畫會為目前套件輸出 18 個節點工作：whole-config
群組會以隔離子程序批次執行，批次逾時為 120 分鐘，
而 include-pattern 群組共用相同的有界 job 預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其單元測試 lane 仍會使用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關 push 上重複執行 debug APK 打包工作。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（production Knip dependency-only pass，釘選到最新 Knip 版本，並在 `dlx` 安裝時停用 pnpm 的 minimum release age）以及 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file 發現與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。unused-file guard 會在 PR 新增未經審查的未使用檔案，或留下過時 allowlist entry 時失敗，同時保留 Knip 無法靜態解析的有意動態外掛、generated、build、live-test，以及 package bridge surface。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request 程式碼。該 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload dispatch 到 `openclaw/clawsweeper`。

此 workflow 有四個 lane：

- `clawsweeper_item` 用於精確的 issue 與 pull request review request；
- `clawsweeper_comment` 用於 issue comment 中明確的 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` push 上的 commit-level review request；
- `github_activity` 用於 ClawSweeper agent 可檢查的一般 GitHub 活動。

`github_activity` lane 只轉送正規化中繼資料：event type、action、actor、repository、item number、URL、title、state，以及存在時的 comment 或 review 短摘錄。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，它會將正規化事件發送到 ClawSweeper agent 的 OpenClaw 閘道 hook。

一般活動是觀察，而不是預設交付。ClawSweeper agent 會在 prompt 中收到 Discord 目標，並且只有在事件令人意外、可採取行動、有風險，或對營運有用時，才應張貼到 `#clawsweeper`。例行開啟、編輯、bot churn、重複 webhook 雜訊，以及一般 review 流量都應產生 `NO_REPLY`。

在整個路徑中，請將 GitHub title、comment、body、review text、branch name，以及 commit message 視為不受信任的資料。它們是摘要與分流的輸入，而不是 workflow 或 agent 執行階段的指令。

## 手動 dispatch

手動 CI dispatch 會執行與一般 CI 相同的 job graph，但會強制啟用每個非 Android scoped lane：Linux 節點分片、bundled-plugin 分片、外掛與通道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、built-artifact smoke check、docs check、Python skills、Windows、macOS、iOS build，以及 Control UI i18n。獨立的手動 CI dispatch 只有在 `include_android=true` 時執行 Android；完整 release umbrella 會透過傳入 `include_android=true` 啟用 Android。外掛 prerelease static check、release-only `agentic-plugins` 分片、完整 extension batch sweep，以及外掛 prerelease Docker lane 會排除於 CI 之外。Docker prerelease 套件只會在 `Full Release Validation` dispatch 獨立的 `Plugin Prerelease` workflow 並啟用 release-validation gate 時執行。

手動執行會使用唯一的 concurrency group，因此 release-candidate full suite 不會被同一 ref 上的另一個 push 或 PR run 取消。選用的 `target_ref` input 讓受信任的呼叫端可使用所選 dispatch ref 的 workflow 檔案，針對 branch、tag 或完整 commit SHA 執行該 graph。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | 工作                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 手動 CI dispatch 與非標準儲存庫後備、CodeQL JavaScript/actions 品質掃描、workflow-sanity、labeler、auto-response、CI 以外的 docs workflow，以及 install-smoke preflight，讓 Blacksmith 矩陣可以更早排隊                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、較低權重的 extension 分片、`checks-fast-core`、外掛/通道合約分片、多數 bundled/較低權重 Linux 節點分片、`check-guards`、`check-prod-types`、`check-test-types`、選定的 `check-additional-*` 分片，以及 `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重量級 Linux 節點套件、boundary/extension-heavy `check-additional-*` 分片，以及 `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`、`check-lint`（對 CPU 足夠敏感，8 vCPU 的成本高於節省）；install-smoke Docker build（32-vCPU queue time 的成本高於節省）                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork 會後備到 `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；fork 會後備到 `macos-26`                                                                                                                                                                                                  |

## Runner 註冊預算

OpenClaw 目前的 GitHub runner-registration bucket 在 `ghx api rate_limit`
中回報每 5 分鐘 10,000 次 self-hosted runner 註冊。每次調校前都要重新檢查
`actions_runner_registration`，因為 GitHub 可能變更此 bucket。此限制由
`openclaw` organization 中所有 Blacksmith runner 註冊共用，因此新增另一個
Blacksmith 安裝不會增加新的 bucket。

將 Blacksmith label 視為 burst control 的稀缺資源。只負責 route、notify、summarize、select shards，或執行短 CodeQL scan 的 job，應留在 GitHub-hosted runner 上，除非它們有已量測的 Blacksmith-specific 需求。任何新的 Blacksmith 矩陣、更大的 `max-parallel`，或高頻率 workflow 都必須展示其 worst-case registration count，並將 org-level 目標維持在即時 bucket 約 60% 以下。以目前 10,000-registration bucket 來說，這表示 6,000-registration operating target，為並行儲存庫、重試，以及 burst overlap 保留空間。

標準儲存庫 CI 會在一般 push 與 pull-request run 中保留 Blacksmith 作為預設 runner path。`workflow_dispatch` 與非標準儲存庫 run 使用 GitHub-hosted runner，但一般標準 run 目前不會探測 Blacksmith queue health，也不會在 Blacksmith 不可用時自動後備到 GitHub-hosted label。

## 本機對應方式

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

`OpenClaw Performance` 是產品／執行階段效能工作流程。它每天在 `main` 上執行，也可以手動派發：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動派發通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對發布標籤或其他分支進行基準測試。已發布的報告路徑與 latest 指標會以受測 ref 作為鍵，而每個 `index.md` 都會記錄受測 ref/SHA、工作流程 ref/SHA、Kova ref、設定檔、通道驗證模式、模型、重複次數，以及情境篩選條件。

此工作流程會從固定發布版本安裝 OCM，並從 `openclaw/Kova` 依固定的 `kova_ref` 輸入安裝 Kova，接著執行三個通道：

- `mock-provider`：針對本機建置執行階段，使用確定性的假 OpenAI 相容驗證執行 Kova 診斷情境。
- `mock-deep-profile`：針對啟動、閘道與代理回合熱點進行 CPU／heap／trace 分析。
- `live-openai-candidate`：真實的 OpenAI `openai/gpt-5.5` 代理回合；當 `OPENAI_API_KEY` 不可用時會略過。

mock-provider 通道也會在 Kova 通過後執行 OpenClaw 原生原始碼探針：在預設、hook 與 50 個外掛啟動案例下的閘道啟動時間與記憶體；內建外掛 import RSS、重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道的命令列介面啟動命令，以及 SQLite 狀態 smoke 效能探針。當受測 ref 有先前已發布的 mock-provider 原始碼報告可用時，原始碼摘要會將目前 RSS 與 heap 值和該基準比較，並將大幅 RSS 增加標記為 `watch`。原始碼探針 Markdown 摘要位於報告組合包中的 `source/index.md`，旁邊有原始 JSON。

每個通道都會上傳 GitHub 成品。當 `CLAWGRIT_REPORTS_TOKEN` 已設定時，工作流程也會將 `report.json`、`report.md`、組合包、`index.md` 與原始碼探針成品提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 底下。目前受測 ref 指標會寫入 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發布驗證

`Full Release Validation` 是「發布前執行所有項目」的手動總括工作流程。它接受分支、標籤或完整 commit SHA，使用該目標派發手動 `CI` 工作流程，針對僅發布用的外掛／套件／靜態／Docker 證明派發 `Plugin Prerelease`，並針對安裝 smoke、套件接受度、跨 OS 套件檢查、從 QA 設定檔證據渲染成熟度計分卡、QA Lab parity、Matrix 與 Telegram 通道派發 `OpenClaw Release Checks`。stable 與 full 設定檔一律包含完整的 live/E2E 與 Docker 發布路徑 soak 涵蓋；beta 設定檔可以用 `run_release_soak=true` 選擇加入。標準套件 Telegram E2E 會在 Package Acceptance 內執行，因此完整候選版本不會啟動重複的 live poller。發布後，傳入 `release_package_spec` 可在 release checks、Package Acceptance、Docker、跨 OS 與 Telegram 之間重用已發布的 npm 套件，而不重新建置。`npm_telegram_package_spec` 僅用於聚焦的已發布套件 Telegram 重新執行。Codex 外掛 live 套件通道預設使用相同的選定狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA／成品執行會從選定 ref 打包 `extensions/codex`。若要使用自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` 規格，請明確設定 `codex_plugin_spec`。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、精確的工作流程 job 名稱、設定檔差異、成品，以及聚焦重新執行控制項。

`OpenClaw Release Publish` 是手動的變更性發布工作流程。請在發布標籤存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.PATCH` 或 `main` 派發它。它會驗證 `pnpm plugins:sync:check`，針對所有可發布的外掛套件派發 `Plugin NPM Release`，針對相同發布 SHA 派發 `Plugin ClawHub Release`，之後才使用已儲存的 `preflight_run_id` 派發 `OpenClaw NPM Release`。stable 發布也需要精確的 `windows_node_tag`；此工作流程會在任何發布子項目前驗證 Windows 原始碼發布，並將其 x64/ARM64 安裝程式與候選版本已核准的 `windows_node_installer_digests` 輸入比較，接著在發布 GitHub release draft 前，推進並驗證相同固定安裝程式摘要，以及精確的 companion asset 與 checksum 合約。

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

GitHub 工作流程派發 ref 必須是分支或標籤，不能是原始 commit SHA。輔助工具會在目標 SHA 推送暫時的 `release-ci/<sha>-...` 分支，從該固定 ref 派發 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。總括驗證器也會在任何子工作流程以不同 SHA 執行時失敗。

`release_profile` 控制傳入 release checks 的 live／provider 廣度。手動發布工作流程預設為 `stable`；只有在你刻意需要廣泛的 advisory provider／media 矩陣時，才使用 `full`。stable 與 full release checks 一律執行完整的 live/E2E 與 Docker 發布路徑 soak；beta 設定檔可以用 `run_release_soak=true` 選擇加入。

- `minimum` 保留最快的 OpenAI／核心發布關鍵通道。
- `stable` 加入 stable provider／backend 集合。
- `full` 執行廣泛的 advisory provider／media 矩陣。

總括工作流程會記錄已派發的子執行 ID，而最後的 `Verify full validation` job 會重新檢查目前子執行結論，並為每個子執行附加最慢 job 表格。如果子工作流程重新執行後轉為綠燈，只需重新執行父驗證器 job，即可重新整理總括結果與時間摘要。

復原時，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。對發布候選版本使用 `all`，只重新執行一般完整 CI 子項時使用 `ci`，只重新執行外掛 prerelease 子項時使用 `plugin-prerelease`，重新執行每個發布子項時使用 `release-checks`，或使用更窄的群組：總括工作流程上的 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會讓聚焦修正後的失敗發布框重新執行維持有界。若是單一失敗的跨 OS 通道，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合，例如 `windows/packaged-upgrade`；長時間的跨 OS 命令會輸出心跳偵測行，而 packaged-upgrade 摘要會包含每個階段的時間。QA release-check 通道為 advisory，標準執行階段工具涵蓋閘門除外；當必要的 OpenClaw 動態工具從標準層摘要漂移或消失時，該閘門會阻擋。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將選定 ref 解析一次為 `release-package-under-test` tarball，接著將該成品傳給跨 OS 檢查與 Package Acceptance，以及在執行 soak 涵蓋時傳給 live/E2E 發布路徑 Docker 工作流程。這可讓套件位元組在發布框之間保持一致，並避免在多個子 job 中重新打包相同候選版本。對於 Codex npm 外掛 live 通道，release checks 會傳入從 `release_package_spec` 衍生的相符已發布外掛規格、傳入操作員提供的 `codex_plugin_spec`，或將輸入留白，讓 Docker 指令碼打包選定 checkout 的 Codex 外掛。

針對 `ref=main` 與 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的總括執行。當父項被取消時，父監視器會取消它已派發的任何子工作流程，因此較新的 main 驗證不會卡在過時的兩小時 release-check 執行後面。發布分支／標籤驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## Live 與 E2E 分片

發布 live/E2E 子項保留廣泛的原生 `pnpm test:live` 涵蓋，但它會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是一個序列 job：

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

這會保留相同的檔案涵蓋，同時讓緩慢的 live provider 失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live media 分片會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 與 `ffprobe`；media job 在設定前只會驗證二進位檔。請將 Docker-backed live 套件保留在一般 Blacksmith runner 上，容器 job 不適合啟動巢狀 Docker 測試。

由 Docker 支援的即時模型/後端分片，會針對每個選定的提交使用個別共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔。即時發布工作流程會建置並推送該映像檔一次，接著 Docker 即時模型、依提供者分片的閘道、命令列介面後端、ACP bind，以及 Codex harness 分片都會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片在工作流程作業逾時之前，帶有明確的腳本層級 `timeout` 上限，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個發布檢查預算。如果這些分片各自重新建置完整原始碼 Docker 目標，代表發布執行設定錯誤，會把實際時間浪費在重複的映像檔建置上。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件作為產品是否可用？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 會驗證原始碼樹，而套件驗收會透過使用者在安裝或更新後操作的相同 Docker E2E harness，驗證單一 tarball。

### 作業

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選項目、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者上傳為 `package-under-test` artifact，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256，以及 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該 artifact、驗證 tarball 清單、在需要時準備 package-digest Docker 映像檔，並針對該套件執行所選 Docker lanes，而不是打包工作流程 checkout。當某個 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件與共享映像檔一次，接著將那些 lanes 扇出成平行的目標 Docker 作業，且各自使用唯一 artifact。
3. `package_telegram` 可選擇呼叫 `NPM Telegram Beta E2E`。它會在 `telegram_mode` 不是 `none` 時執行，且在套件驗收已解析出套件時安裝相同的 `package-under-test` artifact；獨立的 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker 驗收，或可選的 Telegram lane 失敗時讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。請用於已發布的預發布/穩定版驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤、驗證所選提交可從儲存庫分支歷史或發布標籤抵達、在 detached worktree 中安裝相依套件，並以 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 憑證、非預設 HTTPS 連接埠、私人/內部/特殊用途主機名稱或解析出的 IP，以及重新導向到相同公開安全政策之外的位置。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名的 trusted-source 政策下載 HTTPS `.tgz`；必須提供 `package_sha256` 和 `trusted_source_id`。只應將此用於維護者擁有的企業 mirror，或需要設定主機、連接埠、路徑前綴、重新導向主機，或私人網路解析的私人套件儲存庫。如果政策宣告 bearer auth，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；URL 內嵌憑證仍會遭拒。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 是選填，但對外共享的 artifact 應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是在 `source=ref` 時會被打包的來源提交。這讓目前的測試 harness 能驗證較舊的受信任來源提交，而不必執行舊的工作流程邏輯。

### 套件組 profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑 chunks
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` profile 使用離線外掛涵蓋範圍，因此已發布套件的驗證不會受限於即時 ClawHub 可用性。可選的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` artifact，並保留已發布 npm spec 路徑供獨立 dispatch 使用。

如需專用的更新與外掛測試政策，包括本機命令、
Docker lanes、套件驗收輸入、發布預設值，以及失敗分流，
請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、已準備的發布套件 artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`，以及 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、即時 ClawHub skill 安裝、過時外掛相依清理、已設定外掛安裝修復、離線外掛、外掛更新，以及 Telegram 證明都使用同一個已解析的套件 tarball。在發布 beta 後，於 Full Release Validation 或 OpenClaw Release Checks 設定 `release_package_spec`，即可針對已出貨的 npm 套件執行相同矩陣而不重新建置；只有在套件驗收需要與其餘發布驗證不同的套件時，才設定 `package_acceptance_package_spec`。跨 OS 發布檢查仍會涵蓋 OS 特定的 onboarding、安裝程式與平台行為；套件/更新的產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker lane 會在阻擋發布路徑中，每次執行驗證一個已發布套件基準。在套件驗收中，已解析的 `package-under-test` tarball 永遠是候選項目，而 `published_upgrade_survivor_baseline` 會選取備援已發布基準，預設為 `openclaw@latest`；失敗 lane 的重新執行命令會保留該基準。Full Release Validation 搭配 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展到最新四個穩定 npm 發布，加上釘選的外掛相容性邊界發布，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw 外掛安裝、波浪號記錄路徑，以及過時舊版外掛相依根目錄的議題形狀 fixtures。多基準 published-upgrade survivor 選取項目會依基準分片成獨立的目標 Docker runner 作業。獨立的 `Update Migration` 工作流程會在問題是完整的已發布更新清理，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker lane 搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本機彙總執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 spec、透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 供情境矩陣使用。已發布 lane 會以內建的 `openclaw config set` 命令 recipe 設定基準、在 `summary.json` 記錄 recipe 步驟，並在閘道啟動後探測 `/healthz`、`/readyz`，以及 RPC 狀態。Windows 套件化與安裝程式 fresh lanes 也會驗證已安裝套件能從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 預設在已設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因此安裝與閘道證明會維持在 GPT-5 測試模型，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

套件驗收對已發布套件有界定範圍的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私人 QA entries 可指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可略過 `gateway install --wrapper` persistence 子案例；
- `update-channel-switch` 可從 tarball 衍生的假 git fixture 中修剪缺少的 pnpm `patchedDependencies`，並可記錄缺少持久化的 `update.channel`；
- 外掛 smokes 可讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可允許設定 metadata 遷移，同時仍要求安裝記錄和 no-reinstall 行為保持不變。

已發布的 `2026.4.26` 套件也可針對已出貨的本機建置 metadata stamp 檔案發出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker artifacts：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段耗時，以及重新執行命令。請優先重新執行失敗的套件 profile 或精確 Docker lanes，而不是重新執行完整發布驗證。

## 安裝 smoke

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用相同的範圍腳本。它會將 smoke 涵蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/套件表面、內建外掛套件/manifest 變更，或 Docker smoke 作業會演練的核心外掛/頻道/閘道/外掛 SDK 表面的 pull request 執行。僅原始碼的內建外掛變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查命令列介面、執行 agents delete shared-workspace 命令列介面 smoke、執行容器 gateway-network e2e、驗證內建擴充功能建置引數，並在 240 秒彙總命令逾時內執行有界的 bundled-plugin Docker profile（每個情境的 Docker 執行會另外設上限）。
- **完整路徑**保留 QR 套件安裝與安裝程式 Docker/update 覆蓋率，供 nightly 排程執行、手動 dispatch、workflow-call 發行檢查，以及真正觸及安裝程式/套件/Docker 表面的 pull request 使用。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile smoke 映像，然後將 QR 套件安裝、根 Dockerfile/閘道 smoke、安裝程式/update smoke，以及快速 bundled-plugin Docker E2E 作為獨立作業執行，讓安裝程式工作不必等待根映像 smoke。

`main` 推送（包含 merge commit）不會強制使用完整路徑；當變更範圍邏輯會在推送時要求完整覆蓋率，workflow 會保留快速 Docker smoke，並將完整 install smoke 留給 nightly 或發行驗證。

較慢的 Bun 全域安裝 image-provider smoke 由 `run_bun_global_install_smoke` 另外控管。它會在 nightly 排程與 release checks workflow 中執行，手動 `Install Smoke` dispatch 可以選擇啟用它，但 pull request 與 `main` 推送不會執行。一般 PR CI 仍會針對 Node 相關變更執行快速 Bun launcher regression lane。QR 與安裝程式 Docker 測試保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像，將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 一個供安裝程式/update/plugin-dependency lane 使用的裸 Node/Git runner；
- 一個功能性映像，會將同一個 tarball 安裝到 `/app`，供一般功能 lane 使用。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選定的計畫。scheduler 會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選取映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主集區 slot 數量。                                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider-sensitive tail-pool slot 數量。                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider 節流。                                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，用於避免 Docker daemon create storms；設為 `0` 表示不錯開。         |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback 逾時（120 分鐘）；選定的 live/tail lane 會使用更緊的上限。             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定  | `1` 會列印 scheduler 計畫而不執行 lane。                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定  | 逗號分隔的精確 lane 清單；跳過 cleanup smoke，讓 agent 可以重現單一失敗 lane。               |

比其有效上限更重的 lane 仍可從空集區啟動，然後單獨執行直到釋放容量。本機彙總會預先檢查 Docker、移除過時的 OpenClaw E2E 容器、輸出 active-lane 狀態、保存 lane timing 以便依最長優先排序，並預設在第一次失敗後停止排程新的 pooled lane。

### 可重用 live/E2E workflow

可重用 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些套件、映像種類、live 映像、lane 與憑證覆蓋率。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub outputs 與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件 artifact，或從 `package_artifact_run_id` 下載套件 artifact；驗證 tarball inventory；當計畫需要 package-installed lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送帶有 package-digest 標籤的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或現有 package-digest 映像，而不是重新建置。Docker 映像 pull 會以每次嘗試 180 秒的有界逾時重試，讓卡住的 registry/cache stream 能快速重試，而不是消耗 CI 關鍵路徑的大部分時間。

### 發行路徑分塊

發行 Docker 覆蓋率會以較小的 chunked job 搭配 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行，因此每個 chunk 只會拉取所需的映像種類，並透過同一個加權 scheduler 執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker chunk 包含 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 外掛套件 lane，該 lane 會安裝候選 OpenClaw 套件，從 `codex_plugin_spec` 或同 ref tarball 安裝 Codex 外掛並明確核准 Codex 命令列介面安裝，執行 Codex 命令列介面 preflight，然後針對 OpenAI 執行多次同一 session 的 OpenClaw agent turn。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍是彙總外掛/runtime alias。`install-e2e` lane alias 仍是兩個 provider installer lane 的彙總手動重跑 alias。

當完整 release-path 覆蓋率要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，並且只為 OpenWebUI-only dispatch 保留獨立的 `openwebui` chunk。Bundled-channel update lane 會針對暫時性 npm 網路失敗重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane log、timing、`summary.json`、`failures.json`、phase timing、scheduler plan JSON、slow-lane table，以及每個 lane 的重跑命令。workflow `docker_lanes` 輸入會針對已準備的映像執行選定 lane，而不是執行 chunk job，這會將失敗 lane 偵錯限制在一個目標 Docker job 內，並為該次執行準備、下載或重用套件 artifact；如果選定 lane 是 live Docker lane，目標 job 會在本機為該次重跑建置 live-test 映像。產生的每個 lane GitHub 重跑命令會在值存在時包含 `package_artifact_run_id`、`package_artifact_name` 與已準備的映像輸入，讓失敗 lane 能重用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker artifact，並列印合併/每個 lane 的目標重跑命令
pnpm test:docker:timings <summary>   # slow-lane 與 phase 關鍵路徑摘要
```

排程的 live/E2E workflow 每天執行完整 release-path Docker suite。

## 外掛預發行

`Plugin Prerelease` 是成本較高的產品/套件覆蓋率，因此它是一個獨立 workflow，由 `Full Release Validation` 或明確的 operator dispatch。一般 pull request、`main` 推送，以及獨立的手動 CI dispatch 都會關閉該 suite。它會在八個 extension worker 之間平衡內建外掛測試；這些 extension shard job 每次最多執行兩個外掛設定群組，每個群組使用一個 Vitest worker 與較大的 Node heap，讓 import-heavy 外掛批次不會產生額外 CI job。僅限發行的 Docker prerelease 路徑會以小群組批次執行目標 Docker lane，避免為一到三分鐘的 job 保留數十個 runner。workflow 也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` artifact；inspector finding 是 triage input，不會改變阻塞性的 Plugin Prerelease gate。

## QA Lab

QA Lab 在主要 smart-scoped workflow 之外有專用 CI lane。Agentic parity 巢狀在廣泛的 QA 與發行 harness 之下，而不是獨立的 PR workflow。當 parity 應該伴隨廣泛驗證執行時，請使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 每晚在 `main` 上執行，也可手動 dispatch；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lane 展開為平行 job。Live job 使用 `qa-live-shared` 環境，Telegram/Discord 使用 Convex lease。

Release checks 會以 deterministic mock provider 與 mock-qualified model（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport lane，因此頻道合約會與 live model latency 及一般 provider-plugin startup 隔離。Live transport 閘道會停用 memory search，因為 QA parity 會另行覆蓋記憶行為；provider 連線能力則由獨立的 live model、native provider 與 Docker provider suite 覆蓋。

Matrix 會在排程與發行 gate 使用 `--profile fast`，並且只有在 checkout 的命令列介面支援時才加入 `--fail-fast`。命令列介面預設值與手動 workflow input 仍是 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix 覆蓋率分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` job。

`OpenClaw Release Checks` 也會在發行核准前執行 release-critical QA Lab lane；其 QA parity gate 會將候選與 baseline pack 作為平行 lane job 執行，然後將兩個 artifact 下載到小型 report job 中進行最終 parity 比較。

對於一般 PR，請遵循 scoped CI/check evidence，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` workflow 刻意作為狹窄的第一輪安全掃描器，而不是完整 repository 掃描。每日、手動與非 draft pull request guard 執行會掃描 Actions workflow 程式碼，以及最高風險的 JavaScript/TypeScript 表面，並使用高信賴度安全查詢，篩選為 high/critical `security-severity`。

Pull request guard 保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或 process-owning 內建外掛 runtime 路徑下的變更啟動，並執行與排程 workflow 相同的高信賴度安全矩陣。Android 與 macOS CodeQL 不在 PR 預設範圍內。

### 安全類別

| 類別                                              | 介面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、密鑰、沙箱、排程與閘道基準                                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | 核心頻道實作合約，加上頻道外掛執行階段、閘道、外掛 SDK、密鑰、稽核接觸點                                                           |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、網頁擷取，以及外掛 SDK SSRF 政策介面                                                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、行程執行輔助工具、對外傳遞，以及代理工具執行閘門                                                                        |
| `/codeql-security-high/process-exec-boundary`     | 本機 shell、行程 spawn 輔助工具、擁有子行程的 bundled 外掛執行階段，以及工作流程指令碼黏合                                         |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、manifest、registry、套件管理器安裝、來源載入，以及外掛 SDK 套件合約信任介面                                      |

### 平台特定安全性分片

- `CodeQL Android Critical Security` — 排程的 Android 安全性分片。為了在 workflow sanity 接受的最小 Blacksmith Linux runner 上執行 CodeQL，手動建置 Android app。上傳到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週／手動 macOS 安全性分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中篩除相依項建置結果，並上傳到 `/codeql-critical-security/macos`。因為 macOS 建置即使乾淨也會主導執行時間，所以保留在每日預設之外。

### Critical Quality 類別

`CodeQL Critical Quality` 是對應的非安全性分片。它只在 GitHub-hosted Linux runners 上，針對狹窄的高價值介面執行 error-severity、非安全性 JavaScript/TypeScript 品質查詢，讓品質掃描不消耗 Blacksmith runner-registration 預算。它的 pull request guard 刻意比排程 profile 更小：非 draft PR 只會針對代理命令／模型／工具執行與回覆派送程式碼、config schema／migration／IO 程式碼、驗證／密鑰／沙箱／安全性程式碼、核心頻道與 bundled 頻道外掛執行階段、閘道協定／server-method、記憶體執行階段／SDK 黏合、MCP／行程／對外傳遞、provider 執行階段／模型 catalog、session diagnostics／傳遞佇列、外掛載入器、外掛 SDK／package-contract，或外掛 SDK 回覆執行階段變更，執行相符的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL config 與品質工作流程變更會執行全部十二個 PR 品質分片。

手動 dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄 profile 是用於單獨執行一個品質分片的教學／迭代鉤子。

| 類別                                                    | 介面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、密鑰、沙箱、排程與閘道安全邊界程式碼                                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Config schema、migration、normalization 與 IO 合約                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道協定 schema 與伺服器方法合約                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心頻道與 bundled 頻道外掛實作合約                                                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型／provider dispatch、自動回覆 dispatch 與佇列，以及 ACP control-plane 執行階段合約                                                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、行程 supervision 輔助工具，以及對外傳遞合約                                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體 host SDK、記憶體執行階段 facade、記憶體外掛 SDK alias、記憶體執行階段啟用黏合，以及記憶體 doctor 命令                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、session 傳遞佇列、對外 session 繫結／傳遞輔助工具、診斷事件／log bundle 介面，以及 session doctor 命令列介面合約                                   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK inbound 回覆 dispatch、回覆 payload／chunking／runtime 輔助工具、頻道回覆選項、傳遞佇列，以及 session／thread 繫結輔助工具                              |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型 catalog normalization、provider 驗證與探索、provider 執行階段註冊、provider 預設值／catalog，以及 web／search／fetch／embedding registry                     |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap、本機持久化、閘道控制流程，以及 task control-plane 執行階段合約                                                                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch／search、媒體 IO、媒體理解、image-generation，以及 media-generation 執行階段合約                                                                   |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、registry、公開介面，以及外掛 SDK 進入點合約                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端外掛 SDK 來源與外掛套件合約輔助工具                                                                                                                   |

品質與安全性保持分離，讓品質 finding 可以排程、衡量、停用或擴充，而不會模糊安全性訊號。Swift、Python 與 bundled-plugin CodeQL 擴充，應該只在狹窄 profile 具有穩定執行時間與訊號後，才以 scoped 或 sharded 後續工作加回。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護 lane，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動 dispatch 也可以直接執行。當 `main` 已經往前移動，或上一小時內已建立另一個非 skipped 的 Docs Agent 執行時，workflow-run invocation 會跳過。執行時，它會檢閱從前一個非 skipped Docs Agent 來源 SHA 到目前 `main` 的 commit 範圍，所以每小時一次的執行可以涵蓋自上一輪文件處理後累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護 lane，用於處理慢速測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果另一個 workflow-run invocation 在該 UTC 日已經執行或正在執行，就會跳過。手動 dispatch 會略過該每日活動閘門。這條 lane 會建立 full-suite grouped Vitest 效能報告，讓 Codex 只做保留 coverage 的小型測試效能修正，而不是大型 refactor，然後重新執行 full-suite 報告，並拒絕降低通過 baseline 測試數量的變更。Grouped 報告會記錄 Linux 與 macOS 上每個 config 的 wall time 與 max RSS，因此 before/after 比較會在 duration delta 旁呈現測試記憶體 delta。如果 baseline 有失敗測試，Codex 只能修正明顯失敗，且 after-agent full-suite 報告必須通過後才能 commit。當 bot push 落地前 `main` 往前推進時，這條 lane 會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的 stale patch 會被跳過。它使用 GitHub-hosted Ubuntu，讓 Codex action 可以和 docs agent 維持相同的 drop-sudo 安全姿態。

### Merge 後的重複 PR

`Duplicate PRs After Merge` 工作流程是手動 maintainer 工作流程，用於落地後清理重複項目。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會驗證已落地 PR 已 merge，且每個 duplicate 都有共享的 referenced issue 或重疊的 changed hunks。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門在架構邊界方面比廣泛的 CI 平台範圍更嚴格：

- core production 變更會執行 core prod 與 core test typecheck，加上 core lint／guards；
- core test-only 變更只會執行 core test typecheck，加上 core lint；
- extension production 變更會執行 extension prod 與 extension test typecheck，加上 extension lint；
- extension test-only 變更會執行 extension test typecheck，加上 extension lint；
- public 外掛 SDK 或 plugin-contract 變更會擴展到 extension typecheck，因為 extensions 依賴這些 core contracts（Vitest extension sweeps 保持為明確測試工作）；
- release metadata-only version bumps 會執行目標式 version／config／root-dependency 檢查；
- unknown root／config 變更會 fail safe 到所有檢查 lane。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，source edits 優先使用明確 mapping，接著是 sibling tests 與 import-graph dependents。Shared group-room delivery config 是明確 mapping 之一：group visible-reply config、source reply delivery mode，或 message-tool system prompt 的變更會經由 core reply tests，加上 Discord 與 Slack delivery regressions，使 shared default 變更在第一次 PR push 前就會失敗。只有當變更範圍廣及 harness，讓便宜的 mapped set 不是可信 proxy 時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是 repo 擁有的遠端機器包裝器，用於維護者 Linux 證明。當檢查對本機編輯迴圈來說太廣、CI 對等性很重要，或證明需要密鑰、Docker、套件通道、可重複使用的機器或遠端記錄時，請從 repo 根目錄使用它。一般的 OpenClaw 後端是 `blacksmith-testbox`；擁有的 AWS/Hetzner 容量是 Blacksmith 停擺、配額問題，或明確要測試自有容量時的備援。

Crabbox 支援的 Blacksmith 執行會預熱、取得、同步、執行、報告並清理一次性 Testboxes。內建的同步健全性檢查會在必要根檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤刪除時快速失敗。對於有意的大量刪除 PR，請為遠端命令設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

Crabbox 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith 命令列介面呼叫。設定 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該防護，或針對異常大的本機 diff 使用較大的毫秒值。

第一次執行前，請從 repo 根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo 包裝器會拒絕未宣告 `blacksmith-testbox` 的過期 Crabbox 二進位檔。即使 `.crabbox.yaml` 有自有雲預設值，也請明確傳入提供者。在 Codex worktrees 或連結/稀疏 checkout 中，避免使用本機 `pnpm crabbox:run` 指令碼，因為 pnpm 可能會在 Crabbox 啟動前重新協調相依套件；請改為直接呼叫 node 包裝器：

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

閱讀最終 JSON 摘要。有用的欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。對於委派的 Blacksmith Testbox 執行，Crabbox 包裝器結束碼和 JSON 摘要就是命令結果。連結的 GitHub Actions 執行負責 hydration 和 keepalive；當 SSH 命令已經返回後 Testbox 從外部停止時，它可能會以 `cancelled` 結束。除非包裝器 `exitCode` 非零，或命令輸出顯示測試失敗，否則請將其視為清理/狀態成品。一次性的 Blacksmith 支援 Crabbox 執行應自動停止 Testbox；如果執行被中斷或清理狀態不明，請檢查即時機器並只停止你建立的機器：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你有意需要在同一台已 hydration 的機器上執行多個命令時，才使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是故障層，但 Blacksmith 本身可用，請只將直接 Blacksmith 用於診斷，例如 `list`、`status` 和清理。在把直接 Blacksmith 執行視為維護者證明前，先修好 Crabbox 路徑。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的預熱在幾分鐘後仍停在 `queued`，且沒有 IP 或 Actions 執行 URL，請將其視為 Blacksmith 提供者、佇列、帳務或組織限制壓力。停止你建立的已排隊 id，避免啟動更多 Testbox，並在有人檢查 Blacksmith 儀表板、帳務和組織限制時，把證明移到下方自有 Crabbox 容量路徑。

只有在 Blacksmith 停擺、受配額限制、缺少所需環境，或自有容量明確是目標時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務確實需要 48xlarge 等級 CPU，否則避免使用 `class=beast`。`beast` 請求從 192 vCPU 起跳，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額的方式。repo 擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域和 `capacity.hints: true`，因此 brokered AWS leases 會列印選定的區域/市場、配額壓力、Spot 備援和高壓力等級警告。對較重的廣泛檢查使用 `fast`，只有在 standard/fast 不足時才使用 `large`，而 `beast` 只用於例外的 CPU-bound 通道，例如完整套件或所有外掛 Docker 矩陣、明確的 release/blocker 驗證，或高核心效能 profiling。不要將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint/typecheck、小型 E2E 重現，或 Blacksmith 停擺分流。使用 `--market on-demand` 做容量診斷，避免 Spot 市場波動混入訊號。

`.crabbox.yaml` 擁有自有雲通道的提供者、同步和 GitHub Actions hydration 預設值。它排除本機 `.git`，讓已 hydration 的 Actions checkout 保留自己的遠端 Git metadata，而不是同步維護者本機 remotes 和 object stores；它也排除不應傳輸的本機 runtime/build artifacts。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` fetch，以及自有雲 `crabbox run --id <cbx_id>` 命令的非密鑰環境交接。

## 相關

- [安裝概觀](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
