---
read_when:
    - 你需要了解為什麼 CI 作業有執行或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次版本驗證執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 工作圖、範圍閘門、發行總括，以及本機等效命令
title: CI 管線
x-i18n:
    generated_at: "2026-06-27T19:00:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 Pull Request 上執行。標準
`main` 推送會先通過 90 秒的託管 runner 准入視窗。
現有的 `CI` 並行群組會在較新的提交送達時取消該等待中的執行，
因此連續合併不會各自註冊完整的 Blacksmith
矩陣。Pull Request 和手動派送會略過等待。接著 `preflight` 作業
會分類差異，並在只有不相關區域變更時關閉昂貴的 lane。
手動 `workflow_dispatch` 執行會刻意繞過智慧
範圍界定，並為候選版本和廣泛驗證展開完整圖形。Android lane
透過 `include_android` 維持選擇性啟用。僅限發行版的
外掛涵蓋位於獨立的 [`Plugin Prerelease`](#plugin-prerelease)
工作流程中，且只會從 [`Full Release Validation`](#full-release-validation)
或明確的手動派送執行。

## Pipeline 概覽

| 作業                                | 目的                                                                                                   | 執行時機                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件變更、變更範圍、變更的 extensions，並建置 CI manifest                   | 一律在非草稿推送與 PR 上執行                  |
| `runner-admission`                 | 在 Blacksmith 工作註冊前，為標準 `main` 推送提供託管的 90 秒防抖                | 每次 CI 執行；僅在標準 `main` 推送時休眠 |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 進行變更工作流程稽核，以及生產 lockfile 稽核                 | 一律在非草稿推送與 PR 上執行                  |
| `check-dependencies`               | 生產 Knip 僅依賴項目檢查，加上未使用檔案 allowlist 防護                                 | 節點相關變更                               |
| `build-artifacts`                  | 建置 `dist/`、Control UI、已建置命令列介面 smoke 檢查、嵌入式已建置 artifact 檢查，以及可重用 artifact | 節點相關變更                               |
| `checks-fast-core`                 | 快速 Linux 正確性 lane，例如 bundled、protocol、QA Smoke CI，以及 CI 路由檢查                | 節點相關變更                               |
| `checks-fast-contracts-plugins-*`  | 兩個分片的外掛合約檢查                                                                        | 節點相關變更                               |
| `checks-fast-contracts-channels-*` | 兩個分片的通道合約檢查                                                                       | 節點相關變更                               |
| `checks-node-core-*`               | 核心節點測試分片，排除通道、bundled、contract 和 extension lane                          | 節點相關變更                               |
| `check-*`                          | 分片的主要本機 gate 等效項：生產型別、lint、防護、測試型別，以及嚴格 smoke                | 節點相關變更                               |
| `check-additional-*`               | 架構、分片的邊界/提示 drift、extension 防護、package 邊界，以及 runtime topology     | 節點相關變更                               |
| `checks-node-compat-node22`        | 節點 22 相容性建置與 smoke lane                                                                | 發行版的手動 CI 派送                     |
| `check-docs`                       | 文件格式化、lint，以及 broken-link 檢查                                                             | 文件變更                                        |
| `skills-python`                    | 針對 Python-backed Skills 執行 Ruff + pytest                                                                    | Python Skill 相關變更                       |
| `checks-windows`                   | Windows 特定 process/path 測試，加上共享 runtime import specifier 迴歸                      | Windows 相關變更                            |
| `macos-node`                       | 使用共享已建置 artifact 的 macOS TypeScript 測試 lane                                               | macOS 相關變更                              |
| `macos-swift`                      | macOS app 的 Swift lint、建置和測試                                                            | macOS 相關變更                              |
| `ios-build`                        | Xcode 專案產生，加上 iOS app 模擬器建置                                                 | iOS app、共享 app kit，或 Swabble 變更         |
| `android`                          | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                              | Android 相關變更                            |
| `test-performance-agent`           | 受信任活動後的每日 Codex 慢速測試最佳化                                                 | Main CI 成功或手動派送                  |
| `openclaw-performance`             | 使用 mock-provider、deep-profile 和 GPT 5.5 live lane 的每日/按需 Kova runtime 效能報告 | 排程和手動派送                       |

## Fail-fast 順序

1. `runner-admission` 只會等待標準 `main` 推送；較新的推送會在 Blacksmith 註冊前取消該執行。
2. `preflight` 決定哪些 lane 會存在。`docs-scope` 和 `changed-scope` 邏輯是此作業內的步驟，不是獨立作業。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不等待較重的 artifact 與平台矩陣作業。
4. `build-artifacts` 會與快速 Linux lane 重疊，因此下游消費者可在共享建置就緒後立即開始。
5. 較重的平台與 runtime lane 會在之後展開：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

當較新的推送送達相同 PR 或 `main` ref 時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非相同 ref 的最新執行也失敗，否則將其視為 CI 雜訊。矩陣作業使用 `fail-fast: false`，且 `build-artifacts` 會直接回報嵌入式通道、core-support-boundary 和 gateway-watch 失敗，而不是排入小型 verifier 作業。自動 CI 並行 key 有版本標記（`CI-v7-*`），因此舊佇列群組中的 GitHub 端 zombie 不會無限期封鎖較新的 main 執行。手動 full-suite 執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>`，從 GitHub Actions 摘要 wall time、queue time、最慢作業、失敗，以及 `pnpm-store-warmup` fanout barrier。CI 也會將相同的執行摘要作為 `ci-timings-summary` artifact 上傳。若要查看建置時間，請檢查 `build-artifacts` 作業的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會列印 `[build-all] phase timings:`，並包含 `ui:build`；該作業也會上傳 `startup-memory` artifact。

對於 Pull Request 執行，終端 timing-summary 作業會先從受信任的 base revision 執行 helper，然後才將 `GH_TOKEN` 傳給 `gh run view`。這會讓帶 token 的查詢避開分支可控制的程式碼，同時仍能摘要 Pull Request 目前的 CI 執行。

## PR 情境與證據

外部貢獻者 PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR 情境與證據 gate。該工作流程會 checkout 受信任的
base commit，且只評估 PR 內文；它不會執行來自
貢獻者分支的程式碼。

此 gate 適用於不是儲存庫擁有者、成員、
協作者或 bot 的 PR 作者。當 PR 內文包含作者撰寫的
`What Problem This Solves` 和 `Evidence` 區段時即通過。證據可以是聚焦的
測試、CI 結果、截圖、錄影、終端輸出、live 觀察、
已遮蔽紀錄，或 artifact 連結。內文提供意圖和實用驗證；
審查者會檢查程式碼、測試和 CI 以評估正確性。

當檢查失敗時，請更新 PR 內文，而不是再推送另一個程式碼提交。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動派送會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個有範圍的區域都已變更。

- **CI 工作流程編輯** 會驗證節點 CI 圖形加上工作流程 linting，但本身不會強制 Windows、iOS、Android 或 macOS native 建置；這些平台 lane 仍會以平台原始碼變更為範圍。
- **Workflow Sanity** 會對所有 workflow YAML 檔案執行 `actionlint`、`zizmor`、composite-action interpolation 防護，以及 conflict-marker 防護。PR 範圍的 `security-fast` 作業也會對變更的 workflow 檔案執行 `zizmor`，因此工作流程安全性發現會在主要 CI 圖形中提早失敗。
- **`main` 推送上的文件** 由獨立的 `Docs` 工作流程檢查，使用與 CI 相同的 ClawHub 文件 mirror，因此混合 code+docs 推送不會也排入 CI 的 `check-docs` 分片。Pull Request 和手動 CI 在文件變更時仍會從 CI 執行 `check-docs`。
- **終端介面 PTY** 會在終端介面變更時於 `checks-node-core-runtime-tui-pty` Linux 節點分片中執行。該分片會使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此它涵蓋 deterministic `TuiBackend` fixture lane，以及只 mock 外部模型端點的較慢 `tui --local` smoke。
- **僅 CI 路由編輯、選定的低成本 core-test fixture 編輯，以及狹窄的外掛合約 helper/test-routing 編輯** 會使用快速的僅節點 manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` 工作。當變更限於該快速工作直接演練的路由或 helper surface 時，該路徑會略過 build artifacts、節點 22 相容性、通道合約、完整核心分片、bundled-plugin 分片，以及額外的防護矩陣。
- **Windows 節點檢查** 的範圍限於 Windows 特定 process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該 lane 的 CI workflow surface；不相關的原始碼、外掛、install-smoke 和 test-only 變更會維持在 Linux 節點 lane 上。

最慢的節點測試家族會被拆分或平衡，讓每個作業維持小規模且不過度保留執行器：外掛合約與通道合約各自以兩個加權的 Blacksmith 支援分片執行，並保留標準 GitHub 執行器備援；核心單元 fast/support 路徑分開執行；核心執行階段基礎設施拆分為 state、process/config、shared，以及三個 cron 領域分片；auto-reply 以平衡的 worker 執行（reply 子樹再拆成 agent-runner、dispatch，以及 commands/state-routing 分片）；agentic gateway/server 設定則拆分到 chat/auth/model/http-plugin/runtime/startup 路徑，而不是等待已建置的成品。一般 CI 接著只會把隔離的基礎設施 include-pattern 分片打包成最多 64 個測試檔的決定性套件，在不合併非隔離 command/cron、具狀態 agents-core，或 gateway/server 測試套件的情況下降低節點矩陣；固定的重型測試套件維持在 8 vCPU，而打包後與較低權重的路徑使用 4 vCPU。標準儲存庫上的 pull request 使用額外的精簡准入計畫：相同的每組設定群組會在目前 34 個作業的 Linux 節點計畫內，以隔離子程序執行，因此單一 PR 不會註冊完整的 70 多個作業節點矩陣。`main` 推送、手動派送與 release gate 仍保留完整矩陣。廣泛的瀏覽器、QA、媒體，以及雜項外掛測試會使用各自專用的 Vitest 設定，而不是共用的外掛 catch-all。Include-pattern 分片會使用 CI 分片名稱記錄計時項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個設定與已篩選分片。`check-additional-*` 會把 package 邊界編譯/canary 工作放在一起，並把執行階段拓撲架構與 gateway watch 覆蓋範圍分開；邊界 guard 清單被分條成一個 prompt-heavy 分片，以及一個給其餘 guard 條帶的合併分片，每個分片都會並行執行選定的獨立 guard，並列印每個檢查的計時。成本高昂的 Codex happy-path prompt snapshot drift 檢查會作為自己的額外作業執行，且只用於手動 CI 與會影響 prompt 的變更，因此一般無關的節點變更不必等待冷啟動 prompt snapshot 產生，邊界分片也能維持平衡，同時 prompt drift 仍固定到造成它的 PR；相同旗標會在 built-artifact core support-boundary 分片內略過 prompt snapshot Vitest 產生。Gateway watch、通道測試，以及核心 support-boundary 分片會在 `dist/` 與 `dist-runtime/` 已完成建置後，於 `build-artifacts` 內並行執行。

一旦准入，標準 Linux CI 允許最多 24 個並行節點測試作業，較小的 fast/check 路徑則允許 12 個；Windows 與 Android 維持兩個，因為那些執行器池較窄。

精簡 PR 計畫會針對目前測試套件發出 18 個節點作業：whole-config 群組會以隔離子程序批次執行，批次逾時為 120 分鐘，而 include-pattern 群組共用相同的有界作業預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，接著建置 Play debug APK。第三方 flavor 沒有獨立的 source set 或 manifest；其單元測試路徑仍會使用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送時執行重複的 debug APK 封裝作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（釘選至最新 Knip 版本的 production Knip dependency-only pass，並在 `dlx` 安裝時停用 pnpm 的 minimum release age）與 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file 發現項目與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未審閱的未使用檔案，或留下過時的 allowlist 項目時，unused-file guard 會失敗，同時保留 Knip 無法以靜態方式解析的刻意動態外掛、產生檔、建置、live-test，以及 package bridge 表面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request 程式碼。此 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，接著將精簡的 `repository_dispatch` payload 派送到 `openclaw/clawsweeper`。

此 workflow 有四個路徑：

- `clawsweeper_item` 用於精確的 issue 與 pull request 審閱請求；
- `clawsweeper_comment` 用於 issue comment 中明確的 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit 層級審閱請求；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub 活動。

`github_activity` 路徑只會轉送正規化 metadata：event type、action、actor、repository、item number、URL、title、state，以及存在時的 comments 或 reviews 短摘錄。它刻意避免轉送完整的 webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，會將正規化事件發布到 OpenClaw Gateway hook，供 ClawSweeper agent 使用。

一般活動是觀察，而不是預設交付。ClawSweeper agent 會在其 prompt 中收到 Discord 目標，且只應在事件令人意外、可採取行動、有風險，或對營運有用時發布到 `#clawsweeper`。例行開啟、編輯、bot churn、重複 webhook 雜訊，以及正常 review 流量都應產生 `NO_REPLY`。

在整條路徑中，將 GitHub titles、comments、bodies、review text、branch names，以及 commit messages 視為不受信任資料。它們是摘要與 triage 的輸入，而不是 workflow 或 agent runtime 的指令。

## 手動派送

手動 CI 派送會執行與一般 CI 相同的作業圖，但會強制開啟每個非 Android scoped 路徑：Linux 節點分片、bundled-plugin 分片、外掛與通道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、built-artifact smoke checks、docs checks、Python skills、Windows、macOS、iOS build，以及 Control UI i18n。獨立的手動 CI 派送只會在 `include_android=true` 時執行 Android；完整 release umbrella 會透過傳入 `include_android=true` 啟用 Android。外掛 prerelease 靜態檢查、release-only 的 `agentic-plugins` 分片、完整 extension batch sweep，以及外掛 prerelease Docker 路徑都會從 CI 排除。Docker prerelease 測試套件只會在 `Full Release Validation` 以 release-validation gate 啟用狀態派送獨立的 `Plugin Prerelease` workflow 時執行。

手動執行會使用唯一的 concurrency group，因此 release-candidate full suite 不會被同一 ref 上的另一個 push 或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任呼叫端使用所選 dispatch ref 的 workflow 檔案，對 branch、tag，或完整 commit SHA 執行該圖。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                          | 作業                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 手動 CI 派送與非標準儲存庫備援、CodeQL JavaScript/actions 品質掃描、workflow-sanity、labeler、auto-response、CI 外的 docs workflows，以及 install-smoke preflight，讓 Blacksmith 矩陣可以更早排隊                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、較低權重的 extension 分片、`checks-fast-core`、外掛/通道合約分片、多數 bundled/較低權重 Linux 節點分片、`check-guards`、`check-prod-types`、`check-test-types`、選定的 `check-additional-*` 分片，以及 `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux 節點測試套件、boundary/extension-heavy `check-additional-*` 分片，以及 `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`、`check-lint`（對 CPU 夠敏感，以致 8 vCPU 成本高於所省下的時間）；install-smoke Docker builds（32-vCPU 排隊時間成本高於所省下的時間）                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；fork 會退回 `macos-26`                                                                                                                                                                                                  |

## 執行器註冊預算

OpenClaw 目前的 GitHub runner-registration bucket 允許每 5 分鐘 3,000 次 self-hosted runner 註冊。此限制由 `openclaw` 組織中的所有 Blacksmith runner 註冊共用，因此新增另一個 Blacksmith 安裝不會新增新的 bucket。

將 Blacksmith label 視為 burst control 的稀缺資源。只負責路由、通知、摘要、選擇分片，或執行短 CodeQL 掃描的作業應維持在 GitHub-hosted runners 上，除非它們有已量測的 Blacksmith-specific 需求。任何新的 Blacksmith 矩陣、較大的 `max-parallel`，或高頻 workflow，都必須顯示其最壞情況註冊數量，並讓 org-level 目標維持在每 5 分鐘低於 2,000 次註冊，為並行儲存庫與重試作業保留餘裕。

Canonical-repo CI 會將 Blacksmith 保持為一般 push 與 pull-request 執行的預設執行器路徑。`workflow_dispatch` 與非 canonical repository 執行會使用 GitHub-hosted runners，但一般 canonical 執行目前不會探測 Blacksmith queue health，也不會在 Blacksmith 無法使用時自動退回 GitHub-hosted labels。

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

手動派送通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對發布標籤或其他分支進行基準測試。已發布的報告路徑和最新指標會依受測 ref 作為鍵值，且每個 `index.md` 都會記錄受測 ref/SHA、工作流程 ref/SHA、Kova ref、設定檔、通道驗證模式、模型、重複次數與情境篩選器。

此工作流程會從固定版本安裝 OCM，並從 `openclaw/Kova` 以固定的 `kova_ref` 輸入安裝 Kova，接著執行三個通道：

- `mock-provider`：以具決定性的假 OpenAI 相容驗證，針對本機建置執行階段執行 Kova 診斷情境。
- `mock-deep-profile`：針對啟動、閘道與代理回合熱點進行 CPU／堆積／追蹤剖析。
- `live-openai-candidate`：真實的 OpenAI `openai/gpt-5.5` 代理回合；當 `OPENAI_API_KEY` 不可用時略過。

mock-provider 通道也會在 Kova 通過後執行 OpenClaw 原生來源探測：預設、hook 與 50 外掛啟動案例下的閘道啟動時間與記憶體；內建外掛匯入 RSS、重複 mock-OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道的命令列介面啟動命令，以及 SQLite 狀態 smoke 效能探測。當受測 ref 可取得先前已發布的 mock-provider 來源報告時，來源摘要會將目前 RSS 與堆積值與該基準線比較，並將大幅 RSS 增加標記為 `watch`。來源探測 Markdown 摘要位於報告套件中的 `source/index.md`，旁邊有原始 JSON。

每個通道都會上傳 GitHub 成品。當設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、套件、`index.md` 與來源探測成品提交到 `openclaw/clawgrit-reports`，路徑為 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。目前受測 ref 指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發布驗證

`Full Release Validation` 是「發布前執行所有項目」的手動總控工作流程。它接受分支、標籤或完整提交 SHA，使用該目標派送手動 `CI` 工作流程，為僅發布用途的外掛／套件／靜態／Docker 證明派送 `Plugin Prerelease`，並派送 `OpenClaw Release Checks` 以進行安裝 smoke、套件驗收、跨 OS 套件檢查、從 QA 設定檔證據算繪成熟度計分卡、QA Lab 對等性、Matrix 與 Telegram 通道。stable 與 full 設定檔一律包含完整的 live/E2E 與 Docker 發布路徑浸泡覆蓋；beta 設定檔可透過 `run_release_soak=true` 選擇加入。標準套件 Telegram E2E 會在 Package Acceptance 內執行，因此完整候選版本不會啟動重複的 live poller。發布後，傳入 `release_package_spec` 可在 release checks、Package Acceptance、Docker、cross-OS 與 Telegram 之間重用已發布的 npm 套件，而不重新建置。僅在聚焦的已發布套件 Telegram 重新執行時使用 `npm_telegram_package_spec`。Codex 外掛 live package 通道預設使用相同的選定狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA／成品執行會從選定 ref 打包 `extensions/codex`。若要使用自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` 規格，請明確設定 `codex_plugin_spec`。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、確切工作流程作業名稱、設定檔差異、成品與聚焦重新執行控制代碼。

`OpenClaw Release Publish` 是手動變更型發布工作流程。請在發布標籤存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.PATCH` 或 `main` 派送它。它會驗證 `pnpm plugins:sync:check`，為所有可發布外掛套件派送 `Plugin NPM Release`，為相同發布 SHA 派送 `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。stable 發布也需要精確的 `windows_node_tag`；此工作流程會驗證 Windows 來源發布，並在任何發布子流程之前，將其 x64/ARM64 安裝程式與候選版本已核准的 `windows_node_installer_digests` 輸入比較，然後在發布 GitHub 發布草稿前，提升並驗證相同固定的安裝程式摘要，以及精確的配套資產與校驗和合約。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動分支上取得固定提交證明，請使用輔助工具，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程派送 ref 必須是分支或標籤，不能是原始提交 SHA。輔助工具會在目標 SHA 推送臨時 `release-ci/<sha>-...` 分支，從該固定 ref 派送 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成時刪除臨時分支。若任何子工作流程在不同 SHA 執行，總控驗證器也會失敗。

`release_profile` 控制傳入 release checks 的 live／provider 廣度。手動發布工作流程預設為 `stable`；只有在你刻意需要廣泛的建議 provider／媒體矩陣時，才使用 `full`。stable 與 full release checks 一律執行完整 live/E2E 與 Docker 發布路徑浸泡；beta 設定檔可透過 `run_release_soak=true` 選擇加入。

- `minimum` 保留最快的 OpenAI／核心發布關鍵通道。
- `stable` 加入穩定 provider／後端集合。
- `full` 執行廣泛的建議 provider／媒體矩陣。

總控會記錄已派送的子執行 ID，而最終的 `Verify full validation` 作業會重新檢查目前子執行結論，並為每個子執行附加最慢作業表格。如果重新執行某個子工作流程後變綠，只要重新執行父層驗證器作業，即可重新整理總控結果與時間摘要。

若要復原，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。發布候選版本使用 `all`，僅一般完整 CI 子流程使用 `ci`，僅外掛預發布子流程使用 `plugin-prerelease`，每個發布子流程使用 `release-checks`，或在總控上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會讓失敗發布箱在聚焦修正後的重新執行保持有界。對於單一失敗的 cross-OS 通道，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 搭配使用，例如 `windows/packaged-upgrade`；長時間 cross-OS 命令會輸出心跳偵測行，packaged-upgrade 摘要則包含各階段時間。QA release-check 通道是建議性質，但標準執行階段工具覆蓋閘除外；當必要的 OpenClaw 動態工具偏移或從標準層摘要消失時，該閘會阻擋。

`OpenClaw Release Checks` 使用受信任工作流程 ref，將選定 ref 解析一次為 `release-package-under-test` tarball，然後將該成品傳給 cross-OS 檢查與 Package Acceptance，並在執行浸泡覆蓋時傳給 live/E2E 發布路徑 Docker 工作流程。這可讓套件位元組在發布箱之間保持一致，並避免在多個子作業中重新打包相同候選版本。對於 Codex npm-plugin live 通道，release checks 會傳入從 `release_package_spec` 衍生的相符已發布外掛規格、傳入操作者提供的 `codex_plugin_spec`，或將輸入留空，讓 Docker 指令碼打包選定 checkout 的 Codex 外掛。

針對 `ref=main` 且 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的總控。當父流程被取消時，父層監控器會取消它已派送的任何子工作流程，因此較新的 main 驗證不會卡在過期的兩小時 release-check 執行後面。發布分支／標籤驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## Live 與 E2E 分片

release live/E2E 子流程保留廣泛的原生 `pnpm test:live` 覆蓋，但它會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是單一序列作業：

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

這會保持相同檔案覆蓋，同時讓緩慢的 live provider 失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live media 分片會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 與 `ffprobe`；media 作業只會在設定前驗證二進位檔。請將 Docker 支援的 live 套件保留在一般 Blacksmith runner 上，容器作業並不適合啟動巢狀 Docker 測試。

Docker 支援的即時模型/後端分片會針對每個選取的提交使用獨立共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發布工作流程會建置並推送該映像一次，接著 Docker 即時模型、依提供者分片的閘道、命令列介面後端、ACP 繫結，以及 Codex harness 分片都會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片帶有明確的腳本層級 `timeout` 上限，且低於工作流程作業逾時時間，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個發布檢查預算。如果這些分片各自重新建置完整來源 Docker 目標，表示發布執行設定錯誤，會在重複映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證來源樹，而套件驗收會透過使用者在安裝或更新後實際使用的同一套 Docker E2E harness，驗證單一 tarball。

### 作業

1. `resolve_package` 會簽出 `workflow_ref`、解析一個套件候選項、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程參照、套件參照、版本、SHA-256 和設定檔。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備套件摘要 Docker 映像，並針對該套件執行選取的 Docker 路線，而不是打包工作流程簽出內容。當設定檔選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件和共享映像一次，然後將那些路線展開為平行的目標 Docker 作業，並使用唯一成品。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。它會在 `telegram_mode` 不是 `none` 時執行，且當套件驗收解析出套件時，會安裝同一個 `package-under-test` 成品；獨立 Telegram 派發仍可安裝已發布的 npm 規格。
4. 如果套件解析、Docker 驗收，或可選的 Telegram 路線失敗，`summary` 會使工作流程失敗。

### 候選來源

- `source=npm` 僅接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。請用於已發布的預發布/穩定版驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤、驗證選取的提交可從儲存庫分支歷史或發布標籤到達、在分離工作樹中安裝相依項，並用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 認證、非預設 HTTPS 連接埠、私人/內部/特殊用途主機名稱或解析後的 IP，以及導向到同一公開安全性政策之外的重新導向。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名受信任來源政策下載 HTTPS `.tgz`；必須提供 `package_sha256` 和 `trusted_source_id`。僅在維護者擁有的企業鏡像或私人套件儲存庫需要設定主機、連接埠、路徑前綴、重新導向主機，或私人網路解析時使用。若政策宣告 bearer auth，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；URL 內嵌認證仍會被拒絕。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 是選用，但應該為外部共享成品提供。

請保持 `workflow_ref` 與 `package_ref` 分離。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是在 `source=ref` 時會被打包的來源提交。這讓目前的測試 harness 能驗證較舊的受信任來源提交，而不執行舊的工作流程邏輯。

### 套件設定檔

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 精確的 `docker_lanes`；在 `suite_profile=custom` 時必填

`package` 設定檔使用離線外掛涵蓋範圍，因此已發布套件驗證不會受即時 ClawHub 可用性影響。可選的 Telegram 路線會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm 規格路徑供獨立派發使用。

如需專用的更新與外掛測試政策，包括本機命令、Docker 路線、套件驗收輸入、發布預設值和失敗分類，請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、準備好的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、即時 ClawHub skill 安裝、過時外掛相依項清理、已設定外掛安裝修復、離線外掛、外掛更新，以及 Telegram 證明，都使用同一個已解析套件 tarball。在發布 beta 後，在完整發布驗證或 OpenClaw 發布檢查上設定 `release_package_spec`，即可針對已出貨的 npm 套件執行同一矩陣而不重新建置；只有在套件驗收需要與其餘發布驗證不同的套件時，才設定 `package_acceptance_package_spec`。跨 OS 發布檢查仍涵蓋 OS 特定的 onboarding、安裝程式和平台行為；套件/更新產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker 路線會在阻塞發布路徑中，每次執行驗證一個已發布套件基準。在套件驗收中，解析後的 `package-under-test` tarball 永遠是候選項，而 `published_upgrade_survivor_baseline` 會選取後備已發布基準，預設為 `openclaw@latest`；失敗路線重新執行命令會保留該基準。使用 `run_release_soak=true` 或 `release_profile=full` 的完整發布驗證會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展到最新四個穩定 npm 發布版本，加上釘選的外掛相容性邊界發布，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw 外掛安裝、波浪號記錄路徑和過時舊版外掛相依項根目錄的問題形狀 fixtures。多基準已發布升級倖存者選項會依基準分片為獨立的目標 Docker runner 作業。獨立的 `Update Migration` 工作流程會在問題是完整的已發布更新清理，而不是一般完整發布 CI 廣度時，使用 `update-migration` Docker 路線搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本機彙總執行可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件規格、用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一路線，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用情境矩陣。已發布路線會用內建的 `openclaw config set` 命令配方設定基準、在 `summary.json` 記錄配方步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 以及 RPC 狀態。Windows 打包與安裝程式全新路線也會驗證已安裝套件能從原始絕對 Windows 路徑匯入瀏覽器控制覆寫。OpenAI 跨 OS agent-turn smoke 預設在設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因此安裝與閘道證明會維持在 GPT-5 測試模型，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

套件驗收對已發布套件有界定範圍的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私人 QA 項目可能指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的假 git fixture 中修剪缺少的 pnpm `patchedDependencies`，並可記錄缺少持久化的 `update.channel`；
- 外掛 smokes 可讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可允許設定中繼資料遷移，同時仍要求安裝記錄和不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可針對已出貨的本機建置中繼資料戳記檔案提出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、路線記錄、階段計時和重新執行命令。優先重新執行失敗的套件設定檔或精確 Docker 路線，而不是重新執行完整發布驗證。

## 安裝 smoke

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用同一個範圍腳本。它會將 smoke 涵蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/package 介面、隨附外掛 package/manifest 變更，或 Docker smoke 作業會演練的核心外掛/頻道/閘道/外掛 SDK 介面的 pull request 執行。僅來源碼的隨附外掛變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查命令列介面、執行 agents delete shared-workspace 命令列介面 smoke、執行容器 gateway-network e2e、驗證隨附 extension build arg，並在 240 秒的彙總命令逾時內執行有界的隨附外掛 Docker profile（每個情境的 Docker run 會分別設上限）。
- **完整路徑**會保留 QR package install 與 installer Docker/update 覆蓋範圍，用於 nightly 排程執行、手動 dispatch、workflow-call release checks，以及真正觸及 installer/package/Docker 介面的 pull request。在完整模式中，install-smoke 會準備或重用一個 target-SHA GHCR 根 Dockerfile smoke 映像，然後將 QR package install、根 Dockerfile/gateway smokes、installer/update smokes，以及快速隨附外掛 Docker E2E 作為個別作業執行，讓 installer 工作不必等在根映像 smokes 後面。

`main` 推送（包含 merge commits）不會強制走完整路徑；當 changed-scope 邏輯在推送上要求完整覆蓋範圍時，workflow 會保留快速 Docker smoke，並將完整 install smoke 留給 nightly 或 release validation。

較慢的 Bun global install image-provider smoke 會由 `run_bun_global_install_smoke` 另外控管。它會在 nightly schedule 和 release checks workflow 中執行，手動 `Install Smoke` dispatch 可以選擇啟用它，但 pull request 和 `main` 推送不會啟用。一般 PR CI 仍會針對 Node 相關變更執行快速 Bun launcher regression lane。QR 和 installer Docker 測試會保留各自聚焦安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像、將 OpenClaw 打包一次成 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於 installer/update/plugin-dependency lanes 的裸 Node/Git runner；
- 將同一個 tarball 安裝到 `/app`、供一般功能 lanes 使用的功能映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選定的 plan。scheduler 會透過 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lanes。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lanes 的主 pool slot 數量。                                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對 provider 敏感的 tail-pool slot 數量。                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 providers throttle。                                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，以避免 Docker daemon create storms；設為 `0` 表示不錯開。            |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback timeout（120 分鐘）；選定的 live/tail lanes 會使用更嚴格的上限。        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印 scheduler plan，但不執行 lanes。                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；會略過 cleanup smoke，讓 agents 能重現單一失敗 lane。             |

比有效上限更重的 lane 仍可從空 pool 啟動，接著會獨自執行直到釋放容量。本機彙總流程會預先檢查 Docker、移除過期 OpenClaw E2E containers、發出 active-lane 狀態、保存 lane timings 以便依最長優先排序，且預設在第一次失敗後停止排程新的 pooled lanes。

### 可重用的 live/E2E workflow

可重用的 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些 package、image kind、live image、lane，以及 credential 覆蓋範圍。接著 `scripts/docker-e2e.mjs` 會將該 plan 轉換為 GitHub outputs 和 summaries。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載 current-run package artifact，或從 `package_artifact_run_id` 下載 package artifact；驗證 tarball inventory；當 plan 需要 package-installed lanes 時，透過 Blacksmith 的 Docker layer cache 建置並推送以 package digest 標記的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` inputs 或現有 package-digest images，而不是重新建置。Docker image pulls 會以有界的每次嘗試 180 秒 timeout 重試，讓卡住的 registry/cache stream 快速重試，而不是消耗大部分 CI critical path。

### Release-path chunks

Release Docker 覆蓋範圍會執行較小的 chunked jobs，並使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個 chunk 只拉取需要的 image kind，並透過同一個 weighted scheduler 執行多個 lanes：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的 release Docker chunks 是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 外掛 package lane，會安裝候選 OpenClaw package、從 `codex_plugin_spec` 或 same-ref tarball 安裝 Codex 外掛並明確核准 Codex 命令列介面安裝、執行 Codex 命令列介面 preflight，接著針對 OpenAI 執行多個 same-session OpenClaw agent turns。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總外掛/runtime aliases。`install-e2e` lane alias 仍是兩個 provider installer lanes 的彙總手動 rerun alias。

當完整 release-path 覆蓋範圍要求時，OpenWebUI 會併入 `plugins-runtime-services`，且只有在 OpenWebUI-only dispatches 時才保留獨立的 `openwebui` chunk。Bundled-channel update lanes 會針對暫時性 npm network failures 重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane logs、timings、`summary.json`、`failures.json`、phase timings、scheduler plan JSON、slow-lane tables，以及每個 lane 的 rerun commands。workflow 的 `docker_lanes` input 會針對已準備的映像執行選定 lanes，而不是 chunk jobs，這會將 failed-lane debugging 限縮在一個目標 Docker job 內，並為該 run 準備、下載或重用 package artifact；如果選定 lane 是 live Docker lane，目標 job 會在本機為該 rerun 建置 live-test 映像。產生的每個 lane GitHub rerun commands 會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備的 image inputs，因此失敗的 lane 可以重用失敗 run 的精確 package 和映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E workflow 每天會執行完整 release-path Docker suite。

## 外掛 Prerelease

`Plugin Prerelease` 是成本較高的產品/package 覆蓋範圍，因此它是由 `Full Release Validation` 或明確 operator dispatch 的獨立 workflow。一般 pull requests、`main` 推送，以及獨立手動 CI dispatches 會保持該 suite 關閉。它會在八個 extension workers 之間平衡隨附外掛測試；這些 extension shard jobs 一次最多執行兩個外掛 config groups，每個 group 使用一個 Vitest worker 和較大的 Node heap，避免 import-heavy 外掛 batches 產生額外 CI jobs。release-only Docker prerelease 路徑會將目標 Docker lanes 分成小群組批次執行，以避免為一到三分鐘的 jobs 保留數十個 runners。該 workflow 也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` artifact；inspector findings 是 triage input，不會改變阻擋性的外掛 Prerelease gate。

## QA Lab

QA Lab 有專用 CI lanes，位於主要 smart-scoped workflow 之外。Agentic parity 會巢狀包含在廣泛的 QA 和 release harnesses 底下，而不是獨立的 PR workflow。當 parity 應與廣泛 validation run 一起執行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 每晚在 `main` 上執行，也可手動 dispatch；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lanes 分散成平行 jobs。Live jobs 使用 `qa-live-shared` environment，而 Telegram/Discord 使用 Convex leases。

Release checks 會以 deterministic mock provider 和 mock-qualified models（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram live transport lanes，因此 channel contract 會與 live model latency 和一般 provider-plugin startup 隔離。live transport 閘道會停用 memory search，因為 QA parity 會另外覆蓋 memory behavior；provider connectivity 則由獨立的 live model、native provider 和 Docker provider suites 覆蓋。

Matrix 會在 scheduled 和 release gates 使用 `--profile fast`，只有在 checked-out 命令列介面支援時才加上 `--fail-fast`。命令列介面預設值和手動 workflow input 仍是 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix 覆蓋範圍分片成 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` jobs。

`OpenClaw Release Checks` 也會在 release approval 前執行 release-critical QA Lab lanes；其 QA parity gate 會將 candidate 和 baseline packs 作為平行 lane jobs 執行，然後將兩個 artifacts 下載到小型 report job，以完成最終 parity comparison。

對於一般 PR，請依循 scoped CI/check evidence，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` workflow 刻意設計為狹窄的第一輪 security scanner，而不是完整 repository sweep。每日、手動，以及非 draft pull request guard runs 會掃描 Actions workflow code 加上最高風險的 JavaScript/TypeScript 介面，並使用高信賴度 security queries，篩選到高/critical `security-severity`。

pull request guard 保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下的變更啟動，並執行與 scheduled workflow 相同的高信賴度 security matrix。Android 和 macOS CodeQL 不在 PR defaults 中。

### Security categories

| 類別                                              | 介面範圍                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、密鑰、沙盒、排程和閘道基準                                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，以及通道外掛執行階段、閘道、外掛 SDK、密鑰、稽核接觸點                                                           |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、網頁擷取，以及外掛 SDK SSRF 政策介面範圍                                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞，以及代理工具執行閘門                                                                       |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、資訊清單、登錄、套件管理器安裝、來源載入，以及外掛 SDK 套件合約信任介面範圍                                      |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程執行的 Android 安全分片。在工作流程健全性可接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android 應用程式。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週／手動的 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式，從上傳的 SARIF 中篩除依賴項建置結果，並上傳至 `/codeql-critical-security/macos`。因為即使在乾淨狀態下，macOS 建置也主導執行時間，所以保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在 GitHub 託管的 Linux runners 上，針對狹窄且高價值的介面範圍執行錯誤嚴重性、非安全的 JavaScript/TypeScript 品質查詢，讓品質掃描不消耗 Blacksmith runner 註冊預算。它的 pull request 防護刻意小於排程設定檔：非草稿 PR 只會針對代理命令／模型／工具執行與回覆分派程式碼、設定結構描述／遷移／IO 程式碼、驗證／密鑰／沙盒／安全程式碼、核心通道與內建通道外掛執行階段、閘道協定／伺服器方法、記憶體執行階段／SDK 黏合、MCP／程序／對外傳遞、提供者執行階段／模型目錄、工作階段診斷／傳遞佇列、外掛載入器、外掛 SDK／套件合約，或外掛 SDK 回覆執行階段變更，執行相符的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 設定和品質工作流程變更會執行全部十二個 PR 品質分片。

手動分派接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用來單獨執行一個品質分片的教學／反覆運算鉤子。

| 類別                                                    | 介面範圍                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、密鑰、沙盒、排程和閘道安全邊界程式碼                                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化和 IO 合約                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道協定結構描述和伺服器方法合約                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道和內建通道外掛實作合約                                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型／提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器和工具橋接、程序監督輔助工具，以及對外傳遞合約                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體外掛 SDK 別名、記憶體執行階段啟用黏合，以及記憶體 doctor 命令                                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結／傳遞輔助工具、診斷事件／記錄組合包介面範圍，以及工作階段 doctor 命令列介面合約                                |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 傳入回覆分派、回覆承載／分塊／執行階段輔助工具、通道回覆選項、傳遞佇列，以及工作階段／執行緒繫結輔助工具                                               |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值／目錄，以及網頁／搜尋／擷取／嵌入登錄                                                        |
| `/codeql-critical-quality/ui-control-plane`             | Control UI 啟動、本機持久化、閘道控制流程，以及任務控制平面執行階段合約                                                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取／搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                                                        |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公用介面範圍，以及外掛 SDK 進入點合約                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端外掛 SDK 來源和外掛套件合約輔助工具                                                                                                                   |

品質與安全分開，以便品質發現可以被排程、測量、停用或擴充，而不會遮蔽安全訊號。Swift、Python 和內建外掛 CodeQL 擴充，應只在狹窄設定檔有穩定執行時間與訊號之後，作為具範圍或分片的後續工作加回。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是事件驅動的 Codex 維護通道，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動分派也可以直接執行它。當 `main` 已經前進，或過去一小時內已有另一個未略過的 Docs Agent 執行被建立時，workflow-run 呼叫會略過。當它執行時，會審閱從上一個未略過 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護通道，用於慢速測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果另一個 workflow-run 呼叫在該 UTC 日已經執行或正在執行，就會略過。手動分派會繞過該每日活動閘門。此通道會建置完整套件分組 Vitest 效能報告，讓 Codex 只進行保留覆蓋率的小型測試效能修正，而非大範圍重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。分組報告會記錄 Linux 和 macOS 上每個設定的牆鐘時間與最大 RSS，因此前後比較會在持續時間差異旁呈現測試記憶體差異。如果基準有失敗測試，Codex 只能修正明顯失敗，且代理之後的完整套件報告必須通過，才會提交任何內容。當 bot push 落地前 `main` 前進時，此通道會 rebase 已驗證的修補、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期修補會被略過。它使用 GitHub 託管的 Ubuntu，因此 Codex action 可以維持與文件代理相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是用於落地後重複項清理的手動維護者工作流程。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會驗證已落地的 PR 已合併，且每個重複項都有共用的參照 issue 或重疊的已變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機變更通道路由邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門在架構邊界上，比廣泛的 CI 平台範圍更嚴格：

- 核心正式程式碼變更會執行核心正式程式碼與核心測試型別檢查，加上核心 lint／防護；
- 僅核心測試變更只會執行核心測試型別檢查，加上核心 lint；
- 擴充正式程式碼變更會執行擴充正式程式碼與擴充測試型別檢查，加上擴充 lint；
- 僅擴充測試變更會執行擴充測試型別檢查，加上擴充 lint；
- 公用外掛 SDK 或外掛合約變更會擴展到擴充型別檢查，因為擴充依賴這些核心合約（Vitest 擴充掃描仍保留為明確測試工作）；
- 僅 release 中繼資料的版本提升會執行目標式版本／設定／根依賴檢查；
- 未知的根／設定變更會失效保護到所有檢查通道。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，來源編輯優先使用明確對應，然後是同層測試與匯入圖依賴項。共享群組房間傳遞設定是明確對應之一：群組可見回覆設定、來源回覆傳遞模式，或訊息工具系統提示的變更，會路由到核心回覆測試，加上 Discord 和 Slack 傳遞迴歸，讓共享預設值變更在第一次 PR push 前就失敗。只有當變更的範圍足夠涵蓋整個測試框架，使便宜的對應集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是 repo 擁有的遠端機器包裝器，用於維護者 Linux 證明。當檢查對本機編輯迴圈來說過於廣泛、CI 對等性很重要，或證明需要密鑰、Docker、套件通道、可重複使用的機器，或遠端記錄時，請從 repo 根目錄使用它。一般的 OpenClaw 後端是 `blacksmith-testbox`；自有 AWS／Hetzner 容量是 Blacksmith 中斷、配額問題，或明確自有容量測試時的備援。

Crabbox 支援的 Blacksmith 執行會預熱、宣告、同步、執行、回報並清理
一次性 Testboxes。內建的同步健全性檢查會在必要的
根檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short`
顯示至少 200 個已追蹤刪除項目時快速失敗。對於刻意大量刪除的 PR，請為遠端命令設定
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

如果本機 Blacksmith 命令列介面呼叫停留在
同步階段超過五分鐘且沒有同步後輸出，Crabbox 也會終止該呼叫。設定
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該防護，或針對異常龐大的本機差異使用較大的
毫秒值。

首次執行前，請從 repo 根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果 Crabbox 二進位檔過舊且未宣告 `blacksmith-testbox`，repo 包裝器會拒絕執行。即使 `.crabbox.yaml` 已有 owned-cloud 預設值，也請明確傳入供應者。在 Codex worktrees 或 linked/sparse checkouts 中，請避免使用本機 `pnpm crabbox:run` 指令碼，因為 pnpm 可能會在 Crabbox 啟動前重新協調相依套件；請改為直接呼叫 node 包裝器：

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

閱讀最後的 JSON 摘要。有用的欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。一次性 Blacksmith 支援的 Crabbox 執行應該會自動停止 Testbox；如果執行中斷或清理狀態不明，請檢查即時 box，且只停止你建立的 box：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要於同一個已水合的 box 上執行多個命令時，才使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是故障層，但 Blacksmith 本身可用，請只將直接
Blacksmith 用於 `list`、`status` 和清理等診斷。請先修復
Crabbox 路徑，再將直接 Blacksmith 執行視為維護者證明。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的
warmups 在幾分鐘後仍停在 `queued` 且沒有 IP 或 Actions 執行 URL，
請將其視為 Blacksmith 供應者、佇列、帳務或組織限制壓力。停止你建立的
queued ids、避免啟動更多 Testboxes，並在有人檢查 Blacksmith dashboard、
帳務和組織限制時，把證明移到下方 owned Crabbox capacity 路徑。

只有在 Blacksmith 當機、受配額限制、缺少所需環境，或明確以 owned capacity 為目標時，才升級到 owned Crabbox capacity：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務真的需要 48xlarge 等級 CPU，否則避免使用 `class=beast`。`beast` 請求從 192 vCPU 開始，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額的方式。repo 擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域和 `capacity.hints: true`，因此代理的 AWS lease 會列印所選區域/市場、配額壓力、Spot fallback，以及高壓等級警告。較重的廣泛檢查請使用 `fast`，只有在 standard/fast 不足時才使用 `large`，而 `beast` 僅用於例外的 CPU-bound lanes，例如 full-suite 或 all-plugin Docker matrices、明確的 release/blocker validation，或高核心效能 profiling。請勿將 `beast` 用於 `pnpm check:changed`、聚焦測試、docs-only work、一般 lint/typecheck、小型 E2E repros，或 Blacksmith outage triage。容量診斷請使用 `--market on-demand`，讓 Spot market churn 不會混入訊號。

`.crabbox.yaml` 擁有 owned-cloud lanes 的供應者、同步與 GitHub Actions 水合預設值。它排除本機 `.git`，使已水合的 Actions checkout 保留自己的遠端 Git metadata，而不是同步維護者本機 remotes 和 object stores；它也排除不應傳輸的本機 runtime/build artifacts。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、節點/pnpm 設定、`origin/main` fetch，以及 owned-cloud `crabbox run --id <cbx_id>` 命令的非機密環境 handoff。

## 相關

- [安裝總覽](/zh-TW/install)
- [開發頻道](/zh-TW/install/development-channels)
