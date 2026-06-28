---
read_when:
    - 你需要了解為什麼 CI 工作有執行或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次版本發布驗證執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括作業，以及本機命令對應項目
title: CI 管線
x-i18n:
    generated_at: "2026-06-28T00:10:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 上執行。Canonical
`main` 推送會先經過 90 秒的託管執行器准入視窗。
既有的 `CI` concurrency group 會在較新的
commit 落地時取消該等待中的執行，因此連續合併不會各自註冊完整的 Blacksmith
矩陣。Pull request 和手動 dispatch 會略過等待。接著 `preflight` 作業會
分類 diff，並在只有不相關區域變更時關閉昂貴的執行線。手動
`workflow_dispatch` 執行會刻意繞過智慧範圍界定，並為 release candidates 和廣泛
驗證展開完整圖。Android 執行線透過 `include_android` 維持 opt-in。
僅限 release 的外掛覆蓋範圍位於獨立的 [`外掛 Prerelease`](#plugin-prerelease)
workflow，且只會從 [`Full Release Validation`](#full-release-validation)
或明確的手動 dispatch 執行。

## Pipeline overview

| 作業                               | 用途                                                                                                      | 執行時機                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件變更、已變更範圍、已變更 extensions，並建置 CI manifest                                       | 一律在非 draft 推送和 PR 上執行                    |
| `runner-admission`                 | 在 Blacksmith 工作註冊前，為 canonical `main` 推送提供託管的 90 秒 debounce                              | 每次 CI 執行；僅在 canonical `main` 推送時 sleep    |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 進行已變更 workflow 稽核，以及 production lockfile 稽核                      | 一律在非 draft 推送和 PR 上執行                    |
| `check-dependencies`               | Production Knip 僅依賴項目 pass，加上 unused-file allowlist guard                                        | 節點相關變更                                        |
| `build-artifacts`                  | 建置 `dist/`、Control UI、built-CLI smoke checks、embedded built-artifact checks，以及 reusable artifacts | 節點相關變更                                        |
| `checks-fast-core`                 | 快速 Linux 正確性執行線，例如 bundled、protocol、QA Smoke CI，以及 CI-routing checks                     | 節點相關變更                                        |
| `checks-fast-contracts-plugins-*`  | 兩個分片外掛 contract checks                                                                              | 節點相關變更                                        |
| `checks-fast-contracts-channels-*` | 兩個分片 channel contract checks                                                                          | 節點相關變更                                        |
| `checks-node-core-*`               | Core 節點 test shards，不含 channel、bundled、contract，以及 extension 執行線                             | 節點相關變更                                        |
| `check-*`                          | 分片 main local gate 等效項目：prod types、lint、guards、test types，以及 strict smoke                   | 節點相關變更                                        |
| `check-additional-*`               | Architecture、分片 boundary/prompt drift、extension guards、package boundary，以及 runtime topology      | 節點相關變更                                        |
| `checks-node-compat-node22`        | 節點 22 compatibility build 和 smoke 執行線                                                               | Releases 的手動 CI dispatch                         |
| `check-docs`                       | 文件格式化、lint，以及 broken-link checks                                                                 | 文件已變更                                          |
| `skills-python`                    | Python-backed Skills 的 Ruff + pytest                                                                     | Python-skill 相關變更                               |
| `checks-windows`                   | Windows-specific process/path tests，加上 shared runtime import specifier regressions                     | Windows 相關變更                                    |
| `macos-node`                       | 使用 shared built artifacts 的 macOS TypeScript test 執行線                                               | macOS 相關變更                                      |
| `macos-swift`                      | macOS app 的 Swift lint、build，以及 tests                                                                | macOS 相關變更                                      |
| `ios-build`                        | Xcode project generation 加上 iOS app simulator build                                                     | iOS app、shared app kit，或 Swabble 變更            |
| `android`                          | 兩種 flavor 的 Android unit tests，加上一個 debug APK build                                               | Android 相關變更                                    |
| `test-performance-agent`           | Trusted activity 後的每日 Codex slow-test optimization                                                    | Main CI 成功或手動 dispatch                         |
| `openclaw-performance`             | 每日/隨選 Kova runtime performance reports，含 mock-provider、deep-profile，以及 GPT 5.5 live 執行線     | Scheduled 和手動 dispatch                           |

## Fail-fast order

1. `runner-admission` 只會等待 canonical `main` 推送；較新的推送會在 Blacksmith 註冊前取消該執行。
2. `preflight` 決定哪些執行線實際存在。`docs-scope` 和 `changed-scope` 邏輯是此作業內的步驟，而不是獨立作業。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不會等待較重的 artifact 和 platform matrix jobs。
4. `build-artifacts` 會與快速 Linux 執行線重疊，因此 downstream consumers 可在 shared build 準備好後立即開始。
5. 較重的平台和 runtime 執行線接著展開：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

當較新的推送落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的作業標示為 `cancelled`。除非同一 ref 的最新執行也失敗，否則將其視為 CI noise。Matrix jobs 使用 `fail-fast: false`，而 `build-artifacts` 會直接回報 embedded channel、core-support-boundary 和 gateway-watch failures，而不是排入細小的 verifier jobs。自動 CI concurrency key 有版本標記（`CI-v7-*`），因此 GitHub 端舊 queue group 中的 zombie 不會無限期阻塞較新的 main 執行。手動 full-suite 執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>`，可從 GitHub Actions 摘要 wall time、queue time、最慢作業、失敗，以及 `pnpm-store-warmup` fanout barrier。CI 也會將相同的 run summary 上傳為 `ci-timings-summary` artifact。若要查看 build timing，請檢查 `build-artifacts` 作業的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會列印 `[build-all] phase timings:` 並包含 `ui:build`；該作業也會上傳 `startup-memory` artifact。

對於 pull request 執行，terminal timing-summary 作業會先從 trusted base revision 執行 helper，再將 `GH_TOKEN` 傳給 `gh run view`。這會讓帶 token 的查詢避開 branch-controlled code，同時仍摘要 pull request 目前的 CI 執行。

## PR context and evidence

外部 contributor PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR context 和 evidence gate。該 workflow 會 checkout trusted
base commit，且只評估 PR body；它不會執行 contributor branch 的程式碼。

此 gate 適用於不是 repository owners、members、
collaborators 或 bots 的 PR authors。當 PR body 包含作者撰寫的
`What Problem This Solves` 和 `Evidence` sections 時就會通過。Evidence 可以是 focused
test、CI result、screenshot、recording、terminal output、live observation、
redacted log 或 artifact link。Body 提供意圖和有用的驗證；
reviewers 會檢查程式碼、測試和 CI 來評估正確性。

當檢查失敗時，請更新 PR body，而不是再推送另一個 code commit。

## Scope and routing

Scope logic 位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit tests 覆蓋。Manual dispatch 會略過 changed-scope detection，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI workflow edits** 會驗證節點 CI graph 加上 workflow linting，但本身不會強制 Windows、iOS、Android 或 macOS native builds；那些 platform lanes 仍限定於 platform source changes。
- **Workflow Sanity** 會在所有 workflow YAML files 上執行 `actionlint`、`zizmor`、composite-action interpolation guard，以及 conflict-marker guard。PR-scoped `security-fast` 作業也會對已變更的 workflow files 執行 `zizmor`，讓 workflow security findings 在 main CI graph 中提早失敗。
- **Docs on `main` pushes** 會由 standalone `Docs` workflow 使用與 CI 相同的 ClawHub docs mirror 檢查，因此混合 code+docs pushes 不會也排入 CI `check-docs` shard。Pull requests 和 manual CI 在 docs changed 時仍會從 CI 執行 `check-docs`。
- **終端介面 PTY** 會在終端介面變更時於 `checks-node-core-runtime-tui-pty` Linux 節點 shard 中執行。該 shard 以 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋 deterministic `TuiBackend` fixture lane，以及較慢、只 mock external model endpoint 的 `tui --local` smoke。
- **CI routing-only edits、selected cheap core-test fixture edits，以及 narrow plugin contract helper/test-routing edits** 使用快速的 Node-only manifest path：`preflight`、security，以及單一 `checks-fast-core` task。當變更僅限於 fast task 直接測試的 routing 或 helper surfaces 時，該 path 會略過 build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards，以及 additional guard matrices。
- **Windows Node checks** 限定於 Windows-specific process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該 lane 的 CI workflow surfaces；不相關的 source、plugin、install-smoke 和 test-only changes 會留在 Linux 節點執行線上。

最慢的節點測試系列會被拆分或平衡，讓每個作業保持精簡且不會過度預留執行器：外掛合約與頻道合約各自以兩個加權、由 Blacksmith 支援的分片執行，並保留標準 GitHub 執行器備援；核心單元快速/支援通道分開執行；核心執行階段基礎設施拆分為狀態、程序/設定、共用，以及三個排程領域分片；自動回覆以平衡的 worker 執行（回覆子樹拆分為 agent-runner、dispatch，以及 commands/state-routing 分片）；代理式閘道/伺服器設定則拆分到 chat/auth/model/http-plugin/runtime/startup 通道，而不是等待建置完成的成品。一般 CI 接著只會把隔離的基礎設施 include-pattern 分片打包成最多 64 個測試檔案的確定性組合，降低節點矩陣規模，同時不合併非隔離的 command/cron、具狀態的 agents-core，或 gateway/server 測試套件；固定的重型套件維持在 8 vCPU，而打包與較低權重的通道使用 4 vCPU。標準儲存庫上的 Pull request 會使用額外的精簡准入計畫：相同的每設定群組會在目前的 34 作業 Linux 節點計畫內，以隔離子程序執行，因此單一 PR 不會註冊完整的 70 多作業節點矩陣。`main` 推送、手動派送與發行閘門會保留完整矩陣。廣泛的瀏覽器、QA、媒體與雜項外掛測試會使用各自專用的 Vitest 設定，而不是共用的外掛總括設定。Include-pattern 分片會使用 CI 分片名稱記錄時間項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個設定與經過篩選的分片。`check-additional-*` 會將套件邊界編譯/canary 工作放在一起，並把執行階段拓撲架構與閘道監看覆蓋率分開；邊界守衛清單會被條帶化成一個偏重提示詞的分片，以及一個結合剩餘守衛條帶的分片，每個分片都會並行執行選定的獨立守衛，並列印每項檢查的耗時。昂貴的 Codex happy-path 提示詞快照漂移檢查，只有在手動 CI 與影響提示詞的變更時才會作為自己的 additional 作業執行，因此一般無關的節點變更不必等待冷啟動提示詞快照產生，邊界分片也能維持平衡，同時提示詞漂移仍會固定追蹤到造成它的 PR；同一個旗標也會在建置成品的核心 support-boundary 分片內略過提示詞快照 Vitest 產生。閘道監看、頻道測試與核心 support-boundary 分片，會在 `dist/` 與 `dist-runtime/` 已經建置完成後，於 `build-artifacts` 內並行執行。

准入後，標準 Linux CI 允許最多 24 個節點測試作業並行，
較小的 fast/check 通道則允許 12 個；Windows 與 Android 維持在兩個，
因為那些執行器池較窄。

目前套件的精簡 PR 計畫會產生 18 個節點作業：whole-config
群組會以隔離子程序分批執行，批次逾時為 120 分鐘，
而 include-pattern 群組共用同一個有界作業預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。第三方 flavor 沒有獨立的 source set 或 manifest；它的單元測試通道仍會用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送時重複執行 debug APK 封裝作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（僅依賴項的 production Knip 檢查，固定使用最新 Knip 版本，並在 `dlx` 安裝時停用 pnpm 的最低發布年齡限制）以及 `pnpm deadcode:unused-files`，後者會將 Knip 的 production 未使用檔案發現結果與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的未使用檔案，或留下過時的 allowlist 項目時，未使用檔案守衛會失敗，同時保留 Knip 無法靜態解析的有意動態外掛、產生、建置、live-test 與套件橋接表面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request 程式碼。此 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload 派送到 `openclaw/clawsweeper`。

此 workflow 有四個通道：

- `clawsweeper_item` 用於精確的 issue 與 pull request 審查請求；
- `clawsweeper_comment` 用於 issue 留言中的明確 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit 層級審查請求；
- `github_activity` 用於 ClawSweeper agent 可檢查的一般 GitHub 活動。

`github_activity` 通道只會轉送正規化後的中繼資料：事件類型、動作、actor、儲存庫、項目編號、URL、標題、狀態，以及存在時的留言或審查短摘錄。它刻意避免轉送完整的 webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，會將正規化事件發送到 ClawSweeper agent 的 OpenClaw 閘道 hook。

一般活動是觀察，而不是預設交付。ClawSweeper agent 會在其提示詞中收到 Discord 目標，且只有在事件令人意外、可行動、有風險，或對作業有用時，才應發佈到 `#clawsweeper`。例行開啟、編輯、bot 變動、重複 webhook 雜訊，以及一般審查流量都應產生 `NO_REPLY`。

在這整條路徑中，請將 GitHub 標題、留言、body、審查文字、分支名稱與 commit 訊息視為不受信任的資料。它們是摘要與分流的輸入，不是 workflow 或 agent 執行階段的指令。

## 手動派送

手動 CI 派送會執行與一般 CI 相同的作業圖，但會強制開啟每個非 Android 範圍通道：Linux 節點分片、bundled-plugin 分片、外掛與頻道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、建置成品 smoke 檢查、文件檢查、Python skills、Windows、macOS、iOS build，以及 Control UI i18n。獨立的手動 CI 派送只有在 `include_android=true` 時才會執行 Android；完整發行總括流程會透過傳入 `include_android=true` 啟用 Android。外掛 prerelease 靜態檢查、僅限發行的 `agentic-plugins` 分片、完整 extension 批次掃描，以及外掛 prerelease Docker 通道都排除在 CI 之外。Docker prerelease 套件只會在 `Full Release Validation` 以啟用 release-validation gate 的方式派送獨立的 `Plugin Prerelease` workflow 時執行。

手動執行會使用唯一的 concurrency group，因此 release-candidate 完整套件不會被同一 ref 上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫端針對分支、標籤或完整 commit SHA 執行該圖，同時使用所選派送 ref 的 workflow 檔案。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                          | 作業                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 手動 CI 派送與非標準儲存庫備援、CodeQL JavaScript/actions 品質掃描、workflow-sanity、labeler、auto-response、CI 外的 docs workflow，以及 install-smoke preflight，讓 Blacksmith 矩陣能更早排隊                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、較低權重的 extension 分片、`checks-fast-core`、外掛/頻道合約分片、大多數 bundled/較低權重的 Linux 節點分片、`check-guards`、`check-prod-types`、`check-test-types`、選定的 `check-additional-*` 分片，以及 `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux 節點套件、邊界/extension-heavy `check-additional-*` 分片，以及 `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`、`check-lint`（對 CPU 足夠敏感，以致 8 vCPU 節省的時間不值得其成本）；install-smoke Docker 建置（32-vCPU 排隊時間的成本高於節省的時間）                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；fork 會退回 `macos-26`                                                                                                                                                                                                  |

## 執行器註冊預算

OpenClaw 目前的 GitHub 執行器註冊 bucket 允許每 5 分鐘 3,000 次自架
執行器註冊。此限制由 `openclaw` 組織中的所有 Blacksmith 執行器
註冊共用，因此新增另一個 Blacksmith
安裝並不會新增 bucket。

請將 Blacksmith 標籤視為控制突發量的稀缺資源。只負責
路由、通知、摘要、選擇分片，或執行短 CodeQL 掃描的作業，
應維持在 GitHub-hosted 執行器上，除非它們已有量測過的 Blacksmith-specific
需求。任何新的 Blacksmith 矩陣、更大的 `max-parallel`，或高頻率
workflow，都必須顯示其最壞情況註冊數，並將組織層級
目標維持在每 5 分鐘 2,000 次註冊以下，為並行
儲存庫與重試作業保留餘裕。

標準儲存庫 CI 會將 Blacksmith 保持為一般 push 與 pull-request 執行的預設執行器路徑。`workflow_dispatch` 與非標準儲存庫執行會使用 GitHub-hosted 執行器，但一般標準執行目前不會探測 Blacksmith 佇列健康狀態，也不會在 Blacksmith 無法使用時自動退回 GitHub-hosted 標籤。

## 本機對應項

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

`OpenClaw Performance` 是產品／執行階段效能工作流程。它每天在 `main` 上執行，也可以手動分派：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動分派通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對 release tag 或其他分支進行基準測試。已發布的報告路徑和最新指標會依受測 ref 建立鍵值，且每個 `index.md` 都會記錄受測 ref/SHA、工作流程 ref/SHA、Kova ref、profile、lane auth mode、model、repeat count 和 scenario filters。

此工作流程會從固定版本安裝 OCM，並從 `openclaw/Kova` 以固定的 `kova_ref` 輸入安裝 Kova，接著執行三個 lane：

- `mock-provider`：針對本機建置執行階段，以確定性的假 OpenAI 相容驗證執行 Kova diagnostic scenarios。
- `mock-deep-profile`：針對啟動、閘道和 agent-turn 熱點進行 CPU／heap／trace profiling。
- `live-openai-candidate`：真實 OpenAI `openai/gpt-5.5` agent turn；當 `OPENAI_API_KEY` 不可用時略過。

mock-provider lane 也會在 Kova pass 後執行 OpenClaw 原生 source probes：預設、hook 和 50 外掛啟動情境下的閘道啟動時間與記憶體；內建外掛 import RSS、重複的 mock-OpenAI `channel-chat-baseline` hello loops、針對已啟動閘道的命令列介面啟動命令，以及 SQLite 狀態 smoke 效能 probe。當先前已發布的 mock-provider source report 可供受測 ref 使用時，source summary 會將目前 RSS 和 heap 值與該 baseline 比較，並將大幅 RSS 增加標示為 `watch`。source probe Markdown 摘要位於報告 bundle 的 `source/index.md`，旁邊附有原始 JSON。

每個 lane 都會上傳 GitHub artifacts。設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、bundles、`index.md` 和 source-probe artifacts 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 底下。目前受測 ref 的指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發布驗證

`Full Release Validation` 是「發布前執行所有項目」的手動總控工作流程。它接受分支、tag 或完整 commit SHA，使用該目標分派手動 `CI` 工作流程，分派 `Plugin Prerelease` 以取得僅發布用的外掛／package／static／Docker 證明，並分派 `OpenClaw Release Checks` 以進行 install smoke、package acceptance、跨 OS package checks、從 QA profile evidence 轉譯 maturity scorecard、QA Lab parity、Matrix 和 Telegram lane。stable 和 full profile 一律包含完整 live/E2E 和 Docker release-path soak coverage；beta profile 可透過 `run_release_soak=true` 選擇加入。標準 package Telegram E2E 會在 Package Acceptance 內執行，因此完整候選版本不會啟動重複的 live poller。發布後，傳入 `release_package_spec` 可在 release checks、Package Acceptance、Docker、跨 OS 和 Telegram 之間重用已發布的 npm package，而無需重新建置。僅在 focused published-package Telegram rerun 時使用 `npm_telegram_package_spec`。Codex 外掛 live package lane 預設使用相同的選取狀態：已發布的 `release_package_spec=openclaw@<tag>` 會推導出 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/artifact runs 會從選取的 ref 打包 `extensions/codex`。針對自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` specs，請明確設定 `codex_plugin_spec`。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解 stage matrix、確切工作流程 job 名稱、profile 差異、artifacts，以及 focused rerun handles。

`OpenClaw Release Publish` 是手動變更發布工作流程。在 release tag 存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.PATCH` 或 `main` 分派它。它會驗證 `pnpm plugins:sync:check`，為所有可發布的外掛 package 分派 `Plugin NPM Release`，為相同 release SHA 分派 `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。stable publish 也需要精確的 `windows_node_tag`；工作流程會驗證 Windows source release，並在任何 publish child 之前，將其 x64/ARM64 installers 與候選核准的 `windows_node_installer_digests` 輸入比較，然後在發布 GitHub release draft 前，提升並驗證相同固定 installer digests，加上精確的 companion asset 和 checksum contract。

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

GitHub workflow dispatch refs 必須是分支或 tags，不能是原始 commit SHA。helper 會在目標 SHA 推送暫時的 `release-ci/<sha>-...` 分支，從該固定 ref 分派 `Full Release Validation`，驗證每個 child workflow 的 `headSha` 都符合目標，並在 run 完成時刪除暫時分支。如果任何 child workflow 在不同 SHA 執行，總控 verifier 也會失敗。

`release_profile` 控制傳遞到 release checks 的 live/provider 範圍。手動 release workflows 預設為 `stable`；只有在你刻意需要廣泛的 advisory provider/media matrix 時才使用 `full`。stable 和 full release checks 一律執行完整 live/E2E 和 Docker release-path soak；beta profile 可透過 `run_release_soak=true` 選擇加入。

- `minimum` 保留最快的 OpenAI/core release-critical lanes。
- `stable` 加入 stable provider/backend set。
- `full` 執行廣泛的 advisory provider/media matrix。

總控會記錄已分派的 child run ids，而最終的 `Verify full validation` job 會重新檢查目前的 child run conclusions，並為每個 child run 附加 slowest-job tables。如果 child workflow 重新執行後轉為綠燈，只需重新執行 parent verifier job，即可刷新總控結果和 timing summary。

若要復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。針對 release candidate 使用 `all`，只重跑一般 full CI child 時使用 `ci`，只重跑外掛 prerelease child 時使用 `plugin-prerelease`，每個 release child 使用 `release-checks`，或使用更窄的 group：總控上的 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能在 focused fix 後，將失敗 release box 的 rerun 限制在範圍內。針對單一失敗的 cross-OS lane，將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合，例如 `windows/packaged-upgrade`；長時間 cross-OS 命令會輸出 heartbeat lines，且 packaged-upgrade summaries 會包含每個 phase 的 timings。QA release-check lanes 為 advisory，但 standard runtime tool coverage gate 例外；當必要的 OpenClaw dynamic tools 從 standard tier summary 漂移或消失時，它會阻擋。

`OpenClaw Release Checks` 使用 trusted workflow ref，將選取的 ref 解析一次為 `release-package-under-test` tarball，然後將該 artifact 傳給 cross-OS checks 和 Package Acceptance，若執行 soak coverage，也傳給 live/E2E release-path Docker workflow。這會讓 package bytes 在 release boxes 之間保持一致，並避免在多個 child jobs 中重新打包相同候選版本。針對 Codex npm-plugin live lane，release checks 會傳遞由 `release_package_spec` 推導出的相符已發布外掛 spec、傳遞 operator 提供的 `codex_plugin_spec`，或保留輸入空白，讓 Docker script 打包選取 checkout 的 Codex 外掛。

`ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` runs 會取代較舊的總控。parent monitor 會在 parent 被取消時，取消它已分派的任何 child workflow，因此較新的 main validation 不會卡在過時的兩小時 release-check run 後面。Release branch/tag validation 和 focused rerun groups 保持 `cancel-in-progress: false`。

## Live 和 E2E 分片

release live/E2E child 會保留廣泛的原生 `pnpm test:live` coverage，但它會透過 `scripts/test-live-shard.mjs` 以具名 shards 執行，而不是單一 serial job：

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

這會保留相同的檔案 coverage，同時讓緩慢的 live provider failures 更容易 rerun 和診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` shard names 仍可用於手動 one-shot reruns。

原生 live media shards 在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；media jobs 只會在 setup 前驗證 binaries。請讓 Docker-backed live suites 在一般 Blacksmith runners 上執行，container jobs 不是啟動 nested Docker tests 的正確位置。

Docker 支援的即時模型/後端分片會針對每個選定提交使用獨立共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發布工作流程會建置並推送該映像一次，接著 Docker 即時模型、依供應商分片的閘道、命令列介面後端、ACP 綁定，以及 Codex harness 分片都會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片帶有明確的腳本層級 `timeout` 上限，低於工作流程作業逾時，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個發布檢查預算。如果這些分片各自獨立重建完整原始碼 Docker 目標，表示發布執行設定錯誤，會把實際時間浪費在重複映像建置上。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件作為產品是否正常運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證原始碼樹，而套件驗收會透過使用者在安裝或更新後執行的同一套 Docker E2E harness，驗證單一 tarball。

### 作業

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 與設定檔。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備套件摘要 Docker 映像，並針對該套件執行選定的 Docker lanes，而不是打包工作流程 checkout。當某個設定檔選取多個目標式 `docker_lanes` 時，可重用工作流程會準備套件與共用映像一次，然後將這些 lanes 分散為平行的目標式 Docker 作業，並使用唯一成品。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行；如果套件驗收已解析出套件，它會安裝同一個 `package-under-test` 成品；獨立的 Telegram dispatch 仍可安裝已發布的 npm spec。
4. 如果套件解析、Docker 驗收，或可選的 Telegram lane 失敗，`summary` 會讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。用於已發布的預發布/穩定版驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤、驗證所選提交可從儲存庫分支歷史或發布標籤到達、在 detached worktree 中安裝相依項，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 憑證、非預設 HTTPS 連接埠、私有/內部/特殊用途主機名稱或解析後 IP，以及導向到同一套公開安全政策外部的重新導向。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名的 trusted-source 政策下載 HTTPS `.tgz`；必須提供 `package_sha256` 與 `trusted_source_id`。僅在維護者擁有的企業鏡像或私有套件儲存庫需要已設定的主機、連接埠、路徑前綴、重新導向主機或私有網路解析時使用。如果政策宣告 bearer auth，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；內嵌於 URL 的憑證仍會被拒絕。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選用，但外部共享成品應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是在 `source=ref` 時會被打包的來源提交。這讓目前的測試 harness 能驗證較舊的受信任來源提交，而不執行舊的工作流程邏輯。

### 套件設定檔

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` 設定檔使用離線外掛覆蓋率，因此已發布套件驗證不會受即時 ClawHub 可用性阻擋。可選的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm spec 路徑供獨立 dispatch 使用。

如需專用的更新與外掛測試政策，包括本機命令、Docker lanes、套件驗收輸入、發布預設值與失敗分流，請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發布檢查會使用 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` 與 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、即時 ClawHub skill 安裝、過時外掛相依項清理、已設定外掛安裝修復、離線外掛、外掛更新與 Telegram 證明都落在同一個已解析的套件 tarball 上。發布 beta 後，在完整發布驗證或 OpenClaw 發布檢查上設定 `release_package_spec`，即可針對已出貨的 npm 套件執行同一個矩陣而不重建；只有當套件驗收需要與其餘發布驗證不同的套件時，才設定 `package_acceptance_package_spec`。跨 OS 發布檢查仍涵蓋 OS 特定的 onboarding、安裝程式與平台行為；套件/更新產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker lane 會在阻塞發布路徑中，每次執行驗證一個已發布套件基準。在套件驗收中，已解析的 `package-under-test` tarball 一律是候選，而 `published_upgrade_survivor_baseline` 會選取 fallback 已發布基準，預設為 `openclaw@latest`；失敗 lane 重新執行命令會保留該基準。當完整發布驗證設定 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展至最新四個穩定 npm 發布，加上釘選的外掛相容性邊界發布，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw 外掛安裝、tilde 記錄路徑與過時舊版外掛相依項根目錄的 issue-shaped fixtures。多基準 published-upgrade survivor 選項會依基準分片成不同的目標式 Docker runner 作業。獨立的 `Update Migration` 工作流程會使用 `update-migration` Docker lane 搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`，適用於問題是完整已發布更新清理，而不是一般完整發布 CI 廣度時。本機彙總執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 specs，也可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用情境矩陣。已發布 lane 會使用內建的 `openclaw config set` 命令配方設定基準、在 `summary.json` 中記錄配方步驟，並在閘道啟動後探測 `/healthz`、`/readyz` 與 RPC 狀態。Windows packaged 與 installer fresh lanes 也會驗證已安裝套件可從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，若未設定則使用 `openai/gpt-5.5`，因此安裝與閘道證明會維持在 GPT-5 測試模型上，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

套件驗收對已發布套件有有界的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA entries 可指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的 fake git fixture 修剪缺少的 pnpm `patchedDependencies`，並可記錄缺少的持久化 `update.channel`；
- 外掛 smokes 可讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可允許設定中繼資料遷移，同時仍要求安裝記錄與不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可對已經出貨的本機建置中繼資料 stamp 檔案發出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段耗時與重新執行命令。請優先重新執行失敗的套件設定檔或精確 Docker lanes，而不是重新執行完整發布驗證。

## 安裝 smoke

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用同一個 scope 腳本。它會將 smoke 覆蓋率拆分為 `run_fast_install_smoke` 與 `run_full_install_smoke`。

- **快速路徑** 會在觸及 Docker/套件介面、隨附外掛套件/manifest 變更，或 Docker smoke 作業會演練的核心外掛/頻道/閘道/外掛 SDK 介面的 pull request 上執行。僅來源碼的隨附外掛變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查命令列介面、執行 agents delete shared-workspace 命令列介面 smoke、執行容器 gateway-network e2e、驗證隨附擴充功能 build arg，並在 240 秒的彙總命令逾時內執行有界的隨附外掛 Docker profile（每個情境的 Docker 執行會另行設上限）。
- **完整路徑** 會保留 QR 套件安裝與安裝程式 Docker/update 覆蓋，供 nightly 排程執行、手動 dispatch、workflow-call 發行檢查，以及真正觸及安裝程式/套件/Docker 介面的 pull request 使用。在完整模式下，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile smoke 映像，然後將 QR 套件安裝、根 Dockerfile/閘道 smoke、安裝程式/update smoke，以及快速隨附外掛 Docker E2E 作為獨立作業執行，讓安裝程式工作不必卡在根映像 smoke 後方。

`main` push（包含 merge commit）不會強制完整路徑；當變更範圍邏輯會在 push 上要求完整覆蓋時，workflow 會保留快速 Docker smoke，並將完整安裝 smoke 留給 nightly 或發行驗證。

緩慢的 Bun 全域安裝 image-provider smoke 會由 `run_bun_global_install_smoke` 另行管控。它會在 nightly 排程與發行檢查 workflow 中執行，且手動 `Install Smoke` dispatch 可以選擇啟用，但 pull request 和 `main` push 不會執行。一般 PR CI 仍會針對 Node 相關變更執行快速 Bun launcher 迴歸 lane。QR 與安裝程式 Docker 測試會保留各自聚焦安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像，將 OpenClaw 打包一次成 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/update/plugin-dependency lane 的裸 Node/Git runner；
- 將相同 tarball 安裝到 `/app` 的功能映像，用於一般功能 lane。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選定的 plan。排程器會用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，然後用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主 pool slot 數量。                                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider-sensitive tail-pool slot 數量。                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider throttle。                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，避免 Docker daemon create storm；設為 `0` 表示不錯開。               |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback 逾時（120 分鐘）；選定的 live/tail lane 會使用更嚴格的上限。            |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定  | `1` 會列印排程器 plan，但不執行 lane。                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定  | 以逗號分隔的精確 lane 清單；略過 cleanup smoke，讓 agent 可以重現單一失敗 lane。              |

比其有效上限更重的 lane 仍可從空 pool 啟動，然後單獨執行直到釋放容量。本機彙總流程會預先檢查 Docker、移除過期的 OpenClaw E2E container、輸出 active-lane 狀態、保存 lane timing 供 longest-first 排序使用，並預設在第一次失敗後停止排程新的 pooled lane。

### 可重用 live/E2E workflow

可重用 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、lane 和認證覆蓋。`scripts/docker-e2e.mjs` 接著會將該 plan 轉換為 GitHub output 和 summary。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載 current-run package artifact，或從 `package_artifact_run_id` 下載 package artifact；驗證 tarball inventory；當 plan 需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以 package-digest 標記的裸/功能 GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` input 或既有 package-digest 映像，而不是重新建置。Docker 映像 pull 會以有界的每次嘗試 180 秒逾時重試，因此卡住的 registry/cache stream 會快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發行路徑區塊

發行 Docker 覆蓋會以較小的分塊作業執行，並設定 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個 chunk 只 pull 自己需要的映像種類，並透過相同的加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker chunk 為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 外掛套件 lane，會安裝候選 OpenClaw 套件，從 `codex_plugin_spec` 或相同 ref 的 tarball 安裝 Codex 外掛並明確核准 Codex 命令列介面安裝，執行 Codex 命令列介面 preflight，然後針對 OpenAI 執行多次同一 session 的 OpenClaw agent turn。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總的外掛/runtime alias。`install-e2e` lane alias 仍是兩個 provider 安裝程式 lane 的彙總手動 rerun alias。

當完整 release-path 覆蓋要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，且只在 OpenWebUI-only dispatch 時保留獨立的 `openwebui` chunk。隨附頻道 update lane 會針對暫時性 npm 網路失敗重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，內容包含 lane log、timing、`summary.json`、`failures.json`、phase timing、scheduler plan JSON、slow-lane table，以及每個 lane 的 rerun command。workflow 的 `docker_lanes` input 會針對已準備的映像執行選定 lane，而不是 chunk 作業，這會將失敗 lane 的偵錯限制在一個目標 Docker 作業內，並為該次執行準備、下載或重用 package artifact；如果選定 lane 是 live Docker lane，目標作業會為該次 rerun 在本機建置 live-test 映像。產生的每個 lane GitHub rerun command 會在值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備映像 input，因此失敗 lane 可以重用失敗 run 的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker artifact，並列印合併/每個 lane 的目標 rerun command
pnpm test:docker:timings <summary>   # slow-lane 與 phase 關鍵路徑 summary
```

排程的 live/E2E workflow 每日執行完整 release-path Docker suite。

## 外掛預發行

`Plugin Prerelease` 是成本較高的產品/套件覆蓋，因此是由 `Full Release Validation` 或明確 operator dispatch 的獨立 workflow。一般 pull request、`main` push，以及獨立手動 CI dispatch 都會關閉該 suite。它會在八個 extension worker 之間平衡隨附外掛測試；這些 extension shard 作業一次最多執行兩個外掛 config group，每個 group 使用一個 Vitest worker 和較大的 Node heap，因此 import-heavy 外掛批次不會建立額外 CI 作業。僅發行的 Docker prerelease 路徑會將目標 Docker lane 以小群組分批，避免為一到三分鐘的作業保留數十個 runner。workflow 也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` artifact；inspector finding 是 triage input，不會改變阻塞性的外掛預發行 gate。

## QA Lab

QA Lab 在主要 smart-scoped workflow 之外有專用 CI lane。Agentic parity 巢狀位於廣泛 QA 與發行 harness 之下，不是獨立的 PR workflow。當 parity 應隨廣泛驗證 run 一起執行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 會每晚在 `main` 上以及手動 dispatch 時執行；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lane 展開成平行作業。Live 作業使用 `qa-live-shared` environment，Telegram/Discord 使用 Convex lease。

發行檢查會使用 deterministic mock provider 和 mock-qualified model（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport lane，因此頻道 contract 會與 live model latency 和一般 provider-plugin startup 隔離。live transport 閘道會停用 memory search，因為 QA parity 會另外覆蓋 memory behavior；provider connectivity 則由獨立的 live model、native provider 和 Docker provider suite 覆蓋。

Matrix 會在排程與發行 gate 使用 `--profile fast`，且只在 checked-out 命令列介面支援時加入 `--fail-fast`。命令列介面預設值與手動 workflow input 仍為 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix 覆蓋 shard 成 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發行核准前執行 release-critical QA Lab lane；其 QA parity gate 會將候選與 baseline pack 作為平行 lane 作業執行，然後將兩者 artifact 下載到小型 report 作業中，供最終 parity 比較使用。

對於一般 PR，請遵循 scoped CI/check evidence，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` workflow 刻意作為範圍狹窄的第一輪安全掃描器，而不是完整 repository sweep。每日、手動與非草稿 pull request guard run 會掃描 Actions workflow code 加上最高風險的 JavaScript/TypeScript 介面，並使用高信心安全查詢，篩選至 high/critical `security-severity`。

pull request guard 保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下的變更啟動，並執行與排程 workflow 相同的高信心安全矩陣。Android 和 macOS CodeQL 不在 PR 預設範圍內。

### 安全類別

| 類別                                              | 介面                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、秘密、沙箱、排程與閘道基準                                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，加上通道外掛執行階段、閘道、外掛 SDK、秘密、稽核接觸點                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 剖析、網路防護、網頁擷取與外掛 SDK SSRF 政策介面                                                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、外送傳遞與代理工具執行閘門                                                                       |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、資訊清單、登錄、套件管理器安裝、來源載入與外掛 SDK 套件合約信任介面                                          |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程執行的 Android 安全分片。為了 CodeQL，在通過工作流程健全性檢查的最小 Blacksmith Linux runner 上手動建置 Android app。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動執行的 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中濾除相依性建置結果，並上傳至 `/codeql-critical-security/macos`。因為 macOS 建置即使乾淨也會主導執行時間，所以保留在每日預設之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在 GitHub 託管的 Linux runner 上，針對狹窄的高價值介面執行錯誤嚴重度、非安全 JavaScript/TypeScript 品質查詢，因此品質掃描不會消耗 Blacksmith runner 註冊預算。它的 pull request 防護刻意比排程設定檔更小：非草稿 PR 只會針對代理命令/模型/工具執行與回覆派送程式碼、設定結構描述/遷移/IO 程式碼、驗證/秘密/沙箱/安全程式碼、核心通道與內建通道外掛執行階段、閘道協定/伺服器方法、記憶體執行階段/SDK 銜接、MCP/程序/外送傳遞、提供者執行階段/模型目錄、工作階段診斷/傳遞佇列、外掛載入器、外掛 SDK/套件合約，或外掛 SDK 回覆執行階段變更，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 與 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動派送接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用於單獨執行一個品質分片的教學/疊代鉤子。

| 類別                                                    | 介面                                                                                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、秘密、沙箱、排程與閘道安全邊界程式碼                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化與 IO 合約                                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道協定結構描述與伺服器方法合約                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與內建通道外掛實作合約                                                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/提供者派送、自動回覆派送與佇列，以及 ACP 控制平面執行階段合約                                                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及外送傳遞合約                                                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體外掛 SDK 別名、記憶體執行階段啟用銜接，以及記憶體 doctor 命令                                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、外送工作階段繫結/傳遞輔助工具、診斷事件/記錄組合包介面，以及工作階段 doctor 命令列介面合約                              |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 入站回覆派送、回覆承載/分塊/執行階段輔助工具、通道回覆選項、傳遞佇列，以及工作階段/執行緒繫結輔助工具                                          |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值/目錄，以及 web/search/fetch/embedding 登錄                                           |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 啟動、本機持久化、閘道控制流程，以及任務控制平面執行階段合約                                                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取/搜尋、媒體 IO、媒體理解、影像生成與媒體生成執行階段合約                                                                                     |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公開介面與外掛 SDK 進入點合約                                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端外掛 SDK 來源與外掛套件合約輔助工具                                                                                                          |

品質與安全保持分離，讓品質發現可以在不遮蔽安全訊號的情況下被排程、量測、停用或擴充。Swift、Python 與內建外掛 CodeQL 擴充應只在狹窄設定檔具備穩定執行時間與訊號後，作為有範圍或分片的後續工作重新加入。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動派送也可以直接執行它。當 `main` 已經前進，或上一小時內已建立另一個未跳過的 Docs Agent 執行時，工作流程執行呼叫會跳過。執行時，它會審查從上一個未跳過 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於處理慢速測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果該 UTC 日已有另一個工作流程執行呼叫已執行或正在執行，它會跳過。手動派送會略過該每日活動閘門。此通道會建置完整套件分組 Vitest 效能報告，讓 Codex 只做保留覆蓋率的小型測試效能修正，而不是大範圍重構，接著重新執行完整套件報告，並拒絕降低通過基準測試數的變更。分組報告會記錄 Linux 與 macOS 上每個設定的實際耗時與最大 RSS，因此前後比較會在持續時間差異旁呈現測試記憶體差異。如果基準有失敗測試，Codex 只能修正明顯失敗，而代理之後的完整套件報告必須通過，才會提交任何內容。當 `main` 在 bot push 落地前前進時，此通道會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期 patch 會被跳過。它使用 GitHub 託管的 Ubuntu，讓 Codex action 能維持與文件代理相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是一個手動維護者工作流程，用於落地後的重複項目清理。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 前，它會驗證已落地 PR 已合併，且每個重複 PR 都有共同引用的 issue 或重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機變更通道邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門在架構邊界上比廣泛的 CI 平台範圍更嚴格：

- 核心生產變更會執行核心 prod 與核心 test typecheck，加上核心 lint/guards；
- 只有核心測試的變更只會執行核心 test typecheck，加上核心 lint；
- extension 生產變更會執行 extension prod 與 extension test typecheck，加上 extension lint；
- 只有 extension 測試的變更會執行 extension test typecheck，加上 extension lint；
- 公開外掛 SDK 或外掛合約變更會擴展到 extension typecheck，因為 extensions 依賴那些核心合約（Vitest extension 掃描仍是明確的測試工作）；
- 僅發布中繼資料的版本 bump 會執行目標式版本/設定/root 相依性檢查；
- 未知的 root/設定變更會安全失敗到所有檢查通道。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，來源編輯優先使用明確對應，接著是 sibling 測試與匯入圖相依項。共享群組聊天室傳遞設定是其中一個明確對應：群組可見回覆設定、來源回覆傳遞模式或 message-tool 系統提示的變更，會透過核心回覆測試加上 Discord 與 Slack 傳遞回歸測試路由，因此共享預設變更會在第一次 PR push 前失敗。只有當變更範圍廣到便宜的對應集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是 repo 擁有的遠端機器包裝器，用於維護者 Linux 證明。當檢查對本機編輯迴圈來說太廣、CI 對等性很重要，或證明需要秘密、Docker、套件通道、可重用機器或遠端記錄時，請從 repo root 使用它。一般 OpenClaw 後端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是 Blacksmith 中斷、配額問題或明確自有容量測試時的備援。

Crabbox 支援的 Blacksmith 執行會預熱、領用、同步、執行、回報並清理
一次性 Testbox。內建同步健全性檢查會在必要的根目錄檔案
（例如 `pnpm-lock.yaml`）消失，或 `git status --short`
顯示至少 200 個已追蹤刪除項目時快速失敗。對於刻意進行大量刪除的 PR，請為遠端命令設定
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本機 Blacksmith 命令列介面呼叫停留在同步階段超過五分鐘且沒有同步後輸出，Crabbox 也會終止該呼叫。設定
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該保護，或針對異常龐大的本機差異使用更大的毫秒值。

第一次執行前，請從 repo 根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo 包裝器會拒絕未宣告 `blacksmith-testbox` 的過舊 Crabbox 二進位檔。即使 `.crabbox.yaml` 已有自有雲預設值，也請明確傳入提供者。在 Codex worktree 或連結/稀疏 checkout 中，請避免使用本機 `pnpm crabbox:run` script，因為 pnpm 可能會在 Crabbox 啟動前協調依賴；改為直接叫用 node 包裝器：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 支援的執行需要 Crabbox 0.22.0 或更新版本，讓包裝器取得目前的 Testbox 同步、佇列與清理行為。使用同層 checkout 時，請在計時或證明工作前重新建置被忽略的本機二進位檔：

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

閱讀最終 JSON 摘要。有用的欄位是 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。對於委派的
Blacksmith Testbox 執行，Crabbox 包裝器結束碼與 JSON 摘要就是命令結果。連結的 GitHub Actions 執行負責 hydration 和 keepalive；當 Testbox 在 SSH 命令已經返回後被外部停止時，它可能會以 `cancelled` 完成。除非包裝器 `exitCode` 非零或命令輸出顯示測試失敗，否則請將其視為清理/狀態產物。一次性 Blacksmith 支援的 Crabbox 執行應該會自動停止 Testbox；如果執行被中斷或清理狀態不明，請檢查即時 box，且只停止你建立的 box：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要在同一個已 hydrated box 上執行多個命令時才使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是故障層，但 Blacksmith 本身可用，請只將直接
Blacksmith 用於 `list`、`status` 和清理等診斷。在將直接 Blacksmith 執行視為維護者證明前，請先修復
Crabbox 路徑。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的
warmup 在幾分鐘後仍停在 `queued`，且沒有 IP 或 Actions 執行 URL，請將其視為 Blacksmith 提供者、佇列、帳務或組織限制壓力。停止你建立的 queued id，避免啟動更多 Testbox，並在有人檢查 Blacksmith dashboard、帳務與組織限制時，將證明移到下方的自有 Crabbox 容量路徑。

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確目標就是使用自有容量時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務確實需要 48xlarge 等級的 CPU，否則避免使用 `class=beast`。`beast` 請求從 192 vCPU 開始，是最容易觸發區域性 EC2 Spot 或 On-Demand Standard 配額的方法。repo 擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域與 `capacity.hints: true`，因此 brokered AWS lease 會列印選定的區域/市場、配額壓力、Spot fallback 與高壓力 class 警告。對較重的廣泛檢查使用 `fast`，只有在 standard/fast 不足時才使用 `large`，且只在例外的 CPU-bound lane（例如完整套件或全外掛 Docker 矩陣、明確的 release/blocker 驗證，或高核心效能分析）使用 `beast`。不要將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint/typecheck、小型 E2E 重現，或 Blacksmith 停機分流。容量診斷請使用 `--market on-demand`，如此 Spot 市場變動就不會混入訊號。

`.crabbox.yaml` 擁有自有雲 lane 的提供者、同步與 GitHub Actions hydration 預設值。它會排除本機 `.git`，讓 hydrated Actions checkout 保留自己的遠端 Git metadata，而不是同步維護者本機的 remote 與 object store；它也會排除不應傳輸的本機 runtime/build artifact。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` fetch，以及自有雲 `crabbox run --id <cbx_id>` 命令的非機密環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發頻道](/zh-TW/install/development-channels)
