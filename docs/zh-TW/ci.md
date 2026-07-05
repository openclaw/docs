---
read_when:
    - 你需要了解 CI 作業為什麼有執行或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次發行驗證執行或重新執行
    - 你正在變更 ClawSweeper 調度或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發布總括項目，以及本機命令等價項目
title: CI 管線
x-i18n:
    generated_at: "2026-07-05T11:05:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0462c4fe6ce0aacac5fe303cea1181b11822fc44b2d6a2fe4102ca59ce68539e
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在推送到 `main` 時執行（Markdown 和 `docs/**` 路徑會在觸發條件中被忽略）、在非草稿 pull request 時執行（只包含 CHANGELOG 的差異會被忽略），以及在手動觸發時執行。標準的 `main` 推送會先通過 90 秒的託管 runner 准入視窗；`CI` concurrency group 會在有較新的提交進入時取消該等待中的執行，因此連續合併不會各自註冊完整的 Blacksmith 矩陣。Pull request 和手動觸發會略過等待。接著 `preflight` job 會分類差異，並在只有不相關區域變更時關閉昂貴的 lanes。手動 `workflow_dispatch` 執行會刻意繞過智慧範圍判定，並展開完整圖形，用於 release candidates 和廣泛驗證。Android lanes 透過 `include_android`（或 `release_gate` 輸入）維持選擇性啟用。僅供發行使用的外掛涵蓋範圍位於獨立的 [`外掛預發行`](#plugin-prerelease) workflow，且只會從 [`完整發行驗證`](#full-release-validation) 或明確的手動觸發執行。

## 管線概覽

| Job                                | 用途                                                                                                                                                                                            | 執行時機                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件變更、變更的範圍、變更的 extensions，並建置 CI manifest                                                                                                            | 一律在非草稿推送和 PR 上執行                  |
| `runner-admission`                 | 在註冊 Blacksmith 工作前，為標準 `main` 推送提供託管 90 秒防抖                                                                                                         | 每次 CI 執行；僅在標準 `main` 推送時 sleep |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 進行變更 workflow 稽核，以及 production lockfile 稽核                                                                                                          | 一律在非草稿推送和 PR 上執行                  |
| `pnpm-store-warmup`                | 預熱由 lockfile 鎖定的 pnpm store 快取，而不阻塞 Linux 節點 shards                                                                                                                       | 已選取節點或 docs-check lanes                   |
| `build-artifacts`                  | 建置 `dist/`、Control UI、已建置命令列介面 smoke checks、啟動記憶體，以及嵌入式已建置 artifact 檢查                                                                                              | 節點相關變更                               |
| `checks-fast-core`                 | 快速 Linux 正確性 lanes：bundled + protocol、QA Smoke CI、Bun launcher，以及 CI-routing fast task                                                                                          | 節點相關變更                               |
| `checks-fast-contracts-plugins-*`  | 兩個加權外掛 contract shards                                                                                                                                                                | 節點相關變更                               |
| `checks-fast-contracts-channels-*` | 兩個加權 channel contract shards                                                                                                                                                               | 節點相關變更                               |
| `checks-node-*`                    | 核心節點測試 shards，不含 channel、bundled、contract 和 extension lanes                                                                                                                   | 節點相關變更                               |
| `check-*`                          | Sharded main local gate equivalent：guards、shrinkwrap、bundled-channel config metadata、prod types、lint、dependencies、test types                                                                | 節點相關變更                               |
| `check-additional-*`               | Boundary check stripes（包括 prompt snapshot drift）、session accessor/transcript reader boundaries、extension lint groups、package boundary compile/canary，以及 runtime topology architecture | 節點相關變更                               |
| `checks-node-compat-node22`        | 節點 22 相容性建置和 smoke lane                                                                                                                                                         | 發行用手動 CI 觸發                     |
| `check-docs`                       | 文件格式化、lint 和 broken-link checks                                                                                                                                                      | 文件有變更（PR 和手動觸發）              |
| `native-i18n`                      | Native app、Android 和 Apple i18n inventory checks                                                                                                                                               | Native i18n 相關變更                        |
| `skills-python`                    | Python-backed skills 的 Ruff + pytest                                                                                                                                                             | Python-skill 相關變更                       |
| `checks-windows`                   | Windows-specific process/path tests 加上 shared runtime import specifier regressions                                                                                                               | Windows 相關變更                            |
| `macos-node`                       | 聚焦的 macOS TypeScript tests：launchd、Homebrew、runtime paths、packaging scripts、process-group wrapper                                                                                         | macOS 相關變更                              |
| `macos-swift`                      | macOS app 的 Swift lint、build 和 tests                                                                                                                                                     | macOS 相關變更                              |
| `ios-build`                        | Xcode project generation 加上 iOS app simulator build                                                                                                                                          | iOS app、shared app kit 或 Swabble 變更         |
| `android`                          | 兩種 flavors 的 Android unit tests 加上一個 debug APK build                                                                                                                                       | Android 相關變更                            |
| `test-performance-agent`           | 獨立 workflow：受信任活動後的每日 Codex slow-test optimization                                                                                                                       | Main CI 成功或手動觸發                  |
| `openclaw-performance`             | 獨立 workflow：每日/隨選 Kova runtime performance reports，包含 mock-provider、deep-profile 和 GPT 5.5 live lanes                                                                       | 排程和手動觸發                       |

## Fail-fast 順序

1. `runner-admission` 只會等待標準 `main` 推送；較新的推送會在 Blacksmith 註冊前取消執行。
2. `preflight` 決定哪些 lanes 實際存在。`docs-scope` 和 `changed-scope` 邏輯是此 job 內的 steps，不是獨立 jobs。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不等待較重的 artifact 和 platform matrix jobs。
4. `build-artifacts` 會與快速 Linux lanes 重疊，使下游 consumers 能在 shared build 準備好後立即開始。
5. 較重的 platform 和 runtime lanes 隨後展開：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

當同一個 PR 或 `main` ref 上有較新的推送進入時，GitHub 可能會將已被取代的 jobs 標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則將其視為 CI 雜訊。Matrix jobs 使用 `fail-fast: false`，而 `build-artifacts` 會直接回報 embedded channel、core-support-boundary 和 gateway-watch failures，而不是排入很小的 verifier jobs。自動 CI concurrency key 有版本標記（`CI-v7-*`），因此 GitHub 端舊 queue group 中的 zombie 不會無限期阻塞較新的 main runs。手動 full-suite runs 使用 `CI-manual-v1-*`，且不會取消進行中的執行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>` 從 GitHub Actions 摘要 wall time、queue time、最慢 jobs、failures，以及 `pnpm-store-warmup` fanout barrier。In-workflow `ci-timings-summary` job 存在於 `ci.yml`，但目前已停用（`if: false`）；請改為在本機執行 timing helper。若要查看建置時間，檢查 `build-artifacts` job 的 `Build dist` step：`pnpm build:ci-artifacts` 會印出 `[build-all] phase timings:` 並包含 `ui:build`；該 job 也會上傳 `startup-memory` artifact。

## PR context 和 evidence

外部 contributor PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR context 和 evidence gate。該 workflow 會 checkout
受信任的 workflow revision（`github.workflow_sha`）並只評估 PR body；
它不會執行 contributor branch 的程式碼。

此 gate 適用於不是 repository owners、members、collaborators 或 bots 的 PR authors。當 PR body 包含作者撰寫的
`What Problem This Solves` 和 `Evidence` sections 時即通過。Evidence 可以是聚焦測試、CI result、screenshot、recording、terminal output、live observation、redacted log 或 artifact link。Body 提供 intent 和有用的 validation；
reviewers 會檢查 code、tests 和 CI 以評估 correctness。

當檢查失敗時，請更新 PR body，而不是再推送另一個 code commit。

## 範圍和路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit tests 涵蓋。手動觸發會略過 changed-scope detection，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI 工作流程編輯**會驗證節點 CI 圖、工作流程 lint，以及 Windows 通道（由 `ci.yml` 執行），但不會自行強制執行 iOS、Android 或 macOS 原生建置；這些平台通道仍限定於平台原始碼變更。
- **工作流程健全性檢查**會對所有工作流程 YAML 檔案執行 `actionlint`、`zizmor`、複合動作插值防護，以及衝突標記防護。PR 範圍的 `security-fast` 作業也會對已變更的工作流程檔案執行 `zizmor`，讓工作流程安全性發現能在主要 CI 圖中提早失敗。
- **推送到 `main` 的文件**會由獨立的 `Docs` 工作流程檢查，使用與 CI 相同的 ClawHub 文件鏡像，因此混合程式碼與文件的推送不會同時排入 CI `check-docs` 分片。Pull request 和手動 CI 在文件變更時仍會從 CI 執行 `check-docs`。
- **終端介面 PTY**會在 `checks-node-core-runtime-tui-pty` Linux 節點分片中針對終端介面變更執行。該分片會以 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋確定性的 `TuiBackend` fixture 通道，以及較慢、僅模擬外部模型端點的 `tui --local` smoke。
- **僅限 CI 路由的編輯、快速任務直接執行的一小組核心測試 fixture，以及狹窄的外掛合約輔助程式編輯**會使用快速的僅節點 manifest 路徑：`preflight`、`security-fast`，以及變更所觸及的快速通道，也就是單一 `checks-fast-core` CI 路由任務、兩個外掛合約分片，或兩者。該路徑會略過建置成品、節點 22 相容性、頻道合約、完整核心分片、內建外掛分片，以及額外的防護矩陣。
- **Windows 節點檢查**限定於 Windows 專用的程序/路徑包裝器、npm/pnpm/UI 執行器輔助程式、套件管理器設定，以及會執行該通道的 CI 工作流程表面；無關的原始碼、外掛、安裝 smoke 和僅測試變更會留在 Linux 節點通道。

最慢的節點測試家族已拆分或平衡，讓每個作業保持小型且不會過度預留 runner：

- 外掛合約和頻道合約各自以兩個加權的 Blacksmith 支援分片執行，並保留標準 GitHub runner 後援。
- 核心單元快速/支援通道會分開執行；核心執行階段基礎設施會拆分為 process、shared、hooks、secrets，以及三個排程網域分片。
- 自動回覆會以平衡的 worker 執行，並將回覆子樹拆分為 agent-runner、commands、dispatch、session，以及 state-routing 分片。
- 代理式閘道/伺服器（控制平面）設定會拆分為 chat、auth、model、HTTP/plugin、runtime，以及 startup 通道，而不是等待建置成品。
- 一般 CI 只會將隔離的基礎設施 include-pattern 分片打包成最多 64 個測試檔案的確定性組合，藉此減少節點矩陣，同時不合併非隔離的 command/cron、有狀態 agents-core，或閘道/伺服器套件。重量級固定套件仍使用 8 vCPU，而已打包和較低權重的通道使用 4 vCPU。
- canonical 儲存庫上的 pull request 會使用精簡准入計畫：相同的每設定群組會在隔離子程序中執行，目前是 18 個節點測試作業，而不是 74 個作業的完整矩陣。`main` 推送、手動分派和發行 gate 會保留完整矩陣。
- 廣泛的瀏覽器、QA、媒體和雜項外掛測試會使用各自專用的 Vitest 設定，而不是共用的外掛 catch-all。Include-pattern 分片會使用 CI 分片名稱記錄時間項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分完整設定與篩選後的分片。
- `check-additional-*` 會將補充邊界防護清單（`scripts/run-additional-boundary-checks.mjs`）分成一個提示詞密集分片（`check-additional-boundaries-a`，其中包含 Codex 提示詞快照漂移檢查）和一個合併剩餘條帶的分片（`check-additional-boundaries-bcd`），每個分片都會並行執行獨立防護並列印各檢查的時間。套件邊界編譯/canary 工作會維持在一起，而執行階段拓撲架構會與嵌入 `build-artifacts` 的閘道 watch 覆蓋分開執行。
- 閘道 watch、頻道測試，以及核心支援邊界分片，會在 `dist/` 和 `dist-runtime/` 已建置完成後，於 `build-artifacts` 內並行執行。

准入後，canonical Linux CI 允許最多 24 個並行節點測試作業，
較小的 fast/check 通道則允許 12 個；Windows 和 Android 維持在兩個，因為
這些 runner 池較窄。精簡的完整設定批次會以
120 分鐘批次逾時執行，而 include-pattern 群組共用相同的有界
作業預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，接著建置 Play debug APK。第三方 flavor 沒有獨立的 source set 或 manifest；其單元測試通道仍會以 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送時重複執行 debug APK 封裝作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（固定到精確 Knip 版本的生產 Knip 僅相依性 pass，並針對 `dlx` 安裝停用 pnpm 的最低發行年齡）和 `pnpm deadcode:unused-files`，後者會將 Knip 的生產未使用檔案發現與 `scripts/deadcode-unused-files.allowlist.mjs` 比對，另外還會上傳諮詢性的 `pnpm deadcode:report:ci:ts-unused` 報告作為 `deadcode-reports` 成品。當 PR 新增未經審查的未使用檔案，或留下過時 allowlist 項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的有意動態外掛、產生、建置、即時測試，以及套件橋接表面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request 程式碼。該工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，接著將精簡的 `repository_dispatch` payload 分派到 `openclaw/clawsweeper`。

該工作流程有四個通道：

- `clawsweeper_item` 用於精確的 issue 和 pull request 審查請求；
- `clawsweeper_comment` 用於 issue comment 中明確的 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit 層級審查請求；
- `github_activity` 用於 ClawSweeper 代理可能檢查的一般 GitHub 活動。

`github_activity` 通道只會轉送正規化中繼資料：事件類型、動作、actor、儲存庫、項目編號、URL、標題、狀態，以及存在時的 comment 或 review 簡短摘錄。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，會將正規化事件送到供 ClawSweeper 代理使用的 OpenClaw 閘道 hook。

一般活動是觀察，而不是預設投遞。ClawSweeper 代理會在其提示詞中收到 Discord 目標，且只有在事件令人意外、可行動、有風險或對營運有用時，才應該發布到 `#clawsweeper`。例行開啟、編輯、bot 雜訊、重複 webhook 噪音，以及正常 review 流量都應產生 `NO_REPLY`。

在整個路徑中，請將 GitHub 標題、comment、body、review text、branch name 和 commit message 視為不受信任的資料。它們是摘要和分診的輸入，不是工作流程或代理執行階段的指令。

## 手動分派

手動 CI 分派會執行與一般 CI 相同的作業圖，但會強制開啟每個非 Android 範圍通道：Linux 節點分片、內建外掛分片、外掛和頻道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、建置成品 smoke 檢查、文件檢查、Python Skills、Windows、macOS、iOS 建置，以及 Control UI i18n。獨立手動 CI 分派只會在 `include_android=true` 時執行 Android（`release_gate` 輸入也會強制 Android）；完整發行 umbrella 會透過傳入 `include_android=true` 啟用 Android。外掛預發行靜態檢查、僅發行的 `agentic-plugins` 分片、完整 extension 批次掃描，以及外掛預發行 Docker 通道會排除於 CI 之外。Docker 預發行套件只會在 `Full Release Validation` 以啟用發行驗證 gate 的方式分派獨立的 `Plugin Prerelease` 工作流程時執行。

手動執行會使用唯一的並行群組，因此發行候選完整套件不會被同一 ref 上的另一個推送或 PR 執行取消。可選的 `target_ref` 輸入讓受信任的呼叫端可使用所選分派 ref 的工作流程檔案，對 branch、tag 或完整 commit SHA 執行該圖。`release_gate` 輸入是容量停滯 PR CI 的精確 SHA maintainer 後援：它要求 `target_ref` 必須是與已分派 branch head 相符的完整 commit SHA。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月僅 npm 的 extended-stable 路徑是例外：請從精確的
`extended-stable/YYYY.M.33` branch 分派 `OpenClaw NPM
Release` preflight 和 `Full Release Validation`，保留它們的執行 ID，並將兩個 ID 都傳給
直接 npm publish 執行。請參閱[每月僅 npm extended-stable
發布](/zh-TW/reference/RELEASING#monthly-npm-only-extended-stable-publication)以取得
命令、精確身分要求、registry 回讀，以及 selector
修復程序。此路徑不會分派外掛、macOS、Windows、GitHub
Release、私有 dist-tag，或其他平台發布。

## Runners

| 執行器                          | 作業                                                                                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI 派送與非標準儲存庫後援、CodeQL 安全性與品質掃描、workflow-sanity、labeler、auto-response、獨立的 Docs 工作流程，以及整個 Install Smoke 工作流程                                                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | 除 QA Smoke CI 外的 `preflight`、`security-fast`、`pnpm-store-warmup`、`native-i18n`、`checks-fast-core`、外掛/頻道合約分片、多數 bundled/較輕量的 Linux 節點分片、除 `check-lint` 外的 `check-*` 通道、選定的 `check-additional-*` 分片、`check-docs`，以及 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重型 Linux 節點套件、boundary/extension-heavy `check-additional-*` 分片，以及 `android`                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI 與 Testbox 中的 `build-artifacts`，以及 `check-lint`（對 CPU 足夠敏感，8 vCPU 的成本高於節省的時間）                                                                                                                                                                    |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；fork 會後援到 `macos-15`                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；fork 會後援到 `macos-26`                                                                                                                                                                                                                |

## 執行器註冊預算

OpenClaw 目前的 GitHub 執行器註冊儲存桶在 `ghx api rate_limit` 中回報每 5 分鐘 10,000 次自託管執行器註冊。每次調校前都要重新檢查 `actions_runner_registration`，因為 GitHub 可能會變更這個儲存桶。此限制由 `openclaw` 組織中的所有 Blacksmith 執行器註冊共用，因此新增另一個 Blacksmith 安裝並不會增加新的儲存桶。

將 Blacksmith 標籤視為突發控制的稀缺資源。只負責路由、通知、摘要、選取分片，或執行短 CodeQL 掃描的作業，除非已量測出 Blacksmith 專屬需求，否則應留在 GitHub 託管執行器上。任何新的 Blacksmith 矩陣、更大的 `max-parallel`，或高頻率工作流程，都必須顯示其最壞情況註冊數，並讓組織層級目標保持在即時儲存桶約 60% 以下。以目前 10,000 次註冊的儲存桶而言，這表示 6,000 次註冊的營運目標，為並行儲存庫、重試與突發重疊保留餘裕。

標準儲存庫 CI 將 Blacksmith 保持為一般 push 與 pull-request 執行的預設執行器路徑。`workflow_dispatch` 與非標準儲存庫執行會使用 GitHub 託管執行器，但一般標準執行目前不會探測 Blacksmith 佇列健康狀態，也不會在 Blacksmith 無法使用時自動後援到 GitHub 託管標籤。

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

手動派送通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對 release tag 或其他分支進行基準測試。已發布的報告路徑與最新指標會依受測 ref 建立鍵值，而每個 `index.md` 都會記錄受測 ref/SHA、工作流程 ref/SHA、Kova ref、profile、通道驗證模式、模型、重複次數，以及情境篩選條件。

此工作流程會從 pinned release 安裝 OCM，並從 `openclaw/Kova` 的 pinned `kova_ref` 輸入安裝 Kova，然後執行三個通道：

- `mock-provider`：針對本機建置的執行階段，以決定性的假 OpenAI 相容驗證執行 Kova 診斷情境。
- `mock-deep-profile`：針對啟動、閘道與代理回合熱點進行 CPU/heap/trace profiling。依排程執行，或在派送時使用 `deep_profile=true` 執行。
- `live-openai-candidate`：真實的 OpenAI `openai/gpt-5.5` 代理回合，在 `OPENAI_API_KEY` 不可用時略過。依排程執行，或在派送時使用 `live_openai_candidate=true` 執行。

mock-provider 通道也會在 Kova pass 後執行 OpenClaw 原生原始碼探測：預設、略過頻道、內部鉤子與五十個外掛啟動情境下的閘道開機時間與記憶體；bundled 外掛匯入 RSS、重複的模擬 OpenAI `channel-chat-baseline` hello 迴圈、對已啟動閘道執行的命令列介面啟動命令，以及 SQLite 狀態 smoke 效能探測。當受測 ref 的先前已發布 mock-provider 原始碼報告可用時，原始碼摘要會比較目前 RSS 與 heap 值和該 baseline，並將大幅 RSS 增加標記為 `watch`。原始碼探測 Markdown 摘要位於報告 bundle 的 `source/index.md`，原始 JSON 會放在旁邊。

每個通道都會上傳 GitHub artifacts。當已設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、bundles、`index.md` 與原始碼探測 artifacts 提交到 `openclaw/clawgrit-reports` 中的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。目前受測 ref 指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發布驗證

`Full Release Validation` 是「發布前執行所有項目」的手動總覽工作流程。它接受分支、標籤或完整 commit SHA，使用該目標派送手動 `CI` 工作流程（包含 Android）、派送 `Plugin Prerelease` 以進行僅發布用的外掛/套件/靜態/Docker 證明、針對目標 SHA 派送 `OpenClaw Performance`，並派送 `OpenClaw Release Checks` 以進行安裝 smoke、套件驗收、跨 OS 套件檢查、QA Lab parity、Matrix 與 Telegram 通道（advisory maturity scorecard rendering 可透過 `run_maturity_scorecard` 選擇加入）。stable 與 full profiles 一律包含完整的 live/E2E 與 Docker release-path soak 覆蓋；beta profile 可使用 `run_release_soak=true` 選擇加入。標準套件 Telegram E2E 會在 Package Acceptance 內執行，因此完整候選版不會啟動重複的 live poller。發布後，傳入 `release_package_spec` 可在 release checks、Package Acceptance、Docker、cross-OS 與 Telegram 中重用已發布的 npm 套件，而不需重新建置。`npm_telegram_package_spec` 僅用於聚焦的已發布套件 Telegram 重新執行。Codex 外掛 live package 通道預設使用相同選取狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/artifact 執行會從選取 ref 打包 `extensions/codex`。若要使用自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` specs，請明確設定 `codex_plugin_spec`。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解 stage matrix、精確工作流程作業名稱、profile 差異、artifacts，以及聚焦重新執行 handles。

`OpenClaw Release Publish` 是手動的變更型發布工作流程。請在 release tag 存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.PATCH` 或 `main` 派送它（preflight 會在檢查中執行 `pnpm plugins:sync:check`）。它需要已儲存的 `preflight_run_id` 與成功的 `full_release_validation_run_id`，會為所有可發布的外掛套件派送 `Plugin NPM Release`、為同一個 release SHA 派送 `Plugin ClawHub Release`，然後才派送 `OpenClaw NPM Release`。Stable publish 也需要精確的 `windows_node_tag`；在任何 publish child 前，此工作流程會驗證 Windows 原始碼 release，並將其 x64/ARM64 installers 與候選版核准的 `windows_node_installer_digests` 輸入進行比較，然後在發布 GitHub release draft 前，提升並驗證那些相同的 pinned installer digests，以及精確的 companion asset 與 checksum contract。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得 pinned commit 證明，請使用 helper，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs 必須是分支或標籤，而不是原始 commit SHA。該
helper 會在目標 SHA 推送一個暫時的 `release-ci/<sha>-...` 分支，
從該固定 ref dispatch `Full Release Validation`，驗證每個子
workflow 的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。總括驗證器也會在任何子 workflow 於不同 SHA 執行時失敗。

`release_profile` 控制傳入 release checks 的 live/provider 覆蓋範圍。
手動 release workflows 預設為 `stable`；只有在你
有意要執行廣泛的 advisory provider/media matrix 時才使用 `full`。Stable 和 full
release checks 一律執行完整的 live/E2E 和 Docker release-path soak；
beta profile 可用 `run_release_soak=true` 選擇加入。

- `minimum` 保留最快的 OpenAI/core release-critical lanes。
- `stable` 加入 stable provider/backend 集合。
- `full` 執行廣泛的 advisory provider/media matrix。

總括流程會記錄 dispatch 出去的子 run ids，而最終的 `Verify full validation` job 會重新檢查目前子 run 的 conclusions，並為每個子 run 附加最慢 job 表格。如果某個子 workflow 重新執行後轉為綠燈，只要重新執行 parent verifier job，即可重新整理總括結果與時間摘要。

若要復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。release candidate 使用 `all`，只跑一般 full CI child 使用 `ci`，只跑 plugin prerelease child 使用 `plugin-prerelease`，只跑 OpenClaw Performance child 使用 `performance`，每個 release child 使用 `release-checks`，或在總括流程上使用更窄的 group：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能讓失敗的 release box 在針對性修復後將重新執行範圍限制住。若是單一失敗的 cross-OS lane，請將 `rerun_group=cross-os` 搭配 `cross_os_suite_filter`，例如 `windows/packaged-upgrade`；較長的 cross-OS commands 會輸出心跳偵測行，而 packaged-upgrade 摘要會包含每個階段的時間。QA release-check lanes 屬 advisory，但標準 runtime tool coverage gate 例外；當必要的 OpenClaw dynamic tools 漂移或從 standard tier summary 消失時，該 gate 會阻擋。

`OpenClaw Release Checks` 會使用受信任的 workflow ref，將選定 ref 一次解析為 `release-package-under-test` tarball，接著將該 artifact 傳給 cross-OS checks 和 Package Acceptance，以及在執行 soak coverage 時傳給 live/E2E release-path Docker workflow。這能讓 package bytes 在各 release boxes 間保持一致，並避免在多個子 jobs 中重複打包同一個 candidate。對於 Codex npm-plugin live lane，release checks 會傳入從 `release_package_spec` 推導出的相符已發布 plugin spec、傳入 operator 提供的 `codex_plugin_spec`，或讓 input 保持空白，使 Docker script 打包選定 checkout 的 Codex plugin。

針對 `ref=main` 且 `rerun_group=all` 的重複 `Full Release Validation` runs
會取代較舊的總括流程。當 parent 被取消時，parent monitor 會取消它
已 dispatch 的任何 child workflow，因此較新的 main validation
不會排在過時的兩小時 release-check run 後面。Release branch/tag
validation 和針對性 rerun groups 會維持 `cancel-in-progress: false`。

## Live 和 E2E shards

release live/E2E child 保留廣泛的原生 `pnpm test:live` 覆蓋範圍，但會透過 `scripts/test-live-shard.mjs` 以具名 shards 執行，而不是單一 serial job：

- `native-live-src-agents` 和 `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- split media audio/video shards 和 provider-filtered music shards

這會保留相同的檔案覆蓋範圍，同時讓較慢的 live provider 失敗更容易重新執行與診斷。彙總的 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` shard 名稱仍可用於手動一次性重新執行。

原生 live media shards 會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該 image 由 `Live Media Runner Image` workflow 建置。該 image 預先安裝 `ffmpeg` 和 `ffprobe`；media jobs 在 setup 前只會驗證 binaries。請將 Docker-backed live suites 保持在一般 Blacksmith runners 上執行，container jobs 不是啟動巢狀 Docker tests 的正確位置。

Docker-backed live model/backend shards 會針對每個選定 commit 使用獨立共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` image。live release workflow 會建置並推送該 image 一次，接著 Docker live model、provider-sharded 閘道、命令列介面 backend、ACP bind 和 Codex harness shards 會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker shards 會帶有明確的 script-level `timeout` 上限，低於 workflow job timeout，因此卡住的 container 或 cleanup path 會快速失敗，而不是耗盡整個 release-check 預算。如果這些 shards 各自重新建置完整的 source Docker target，表示 release run 設定錯誤，並會在重複 image builds 上浪費實際時間。

## Package Acceptance

當問題是「這個可安裝的 OpenClaw package 是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證 source tree，而 package acceptance 會透過使用者在安裝或更新後執行的同一套 Docker E2E harness，驗證單一 tarball。

### Jobs

1. `resolve_package` 會 checkout `workflow_ref`、解析一個 package candidate、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者都上傳為 `package-under-test` artifact，並在 GitHub step summary 中列印 source、workflow ref、package ref、version、SHA-256 和 profile。
2. `package_integrity` 會下載 `package-under-test` artifact，並使用 `scripts/check-openclaw-package-tarball.mjs` 強制執行公開 package tarball contract。
3. `docker_acceptance` 會使用解析出的 package source SHA（fallback 到 `workflow_ref`）和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。reusable workflow 會下載該 artifact、驗證 tarball inventory、在需要時準備 package-digest Docker images，並針對該 package 執行選定的 Docker lanes，而不是打包 workflow checkout。當某個 profile 選取多個目標式 `docker_lanes` 時，reusable workflow 會先準備 package 和共享 images 一次，再將那些 lanes 展開為平行的目標式 Docker jobs，且各自具有唯一 artifacts。
4. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。它會在 `telegram_mode` 不是 `none` 時執行，並在 Package Acceptance 已解析 package 時安裝相同的 `package-under-test` artifact；獨立 Telegram dispatch 仍可安裝已發布的 npm spec。
5. `summary` 會在 package resolution、integrity、Docker acceptance 或可選 Telegram lane 失敗時讓 workflow 失敗。`advisory` input 會將 acceptance 失敗降級為 advisory callers 的 warnings。

### Candidate sources

- `source=npm` 只接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw release version，例如 `openclaw@2026.4.27-beta.2`。用於已發布的 extended-stable、prerelease 或 stable acceptance。
- `source=ref` 會打包受信任的 `package_ref` branch、tag 或完整 commit SHA。resolver 會 fetch OpenClaw branches/tags，驗證選定 commit 可從 repository branch history 或 release tag 抵達，在 detached worktree 中安裝 deps，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL credentials、非預設 HTTPS ports、private/internal/special-use hostnames 或 resolved IPs，以及違反相同公開安全政策的 redirects。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名 trusted-source policy 下載 HTTPS `.tgz`；必須提供 `package_sha256` 和 `trusted_source_id`。僅在 maintainer-owned enterprise mirrors 或 private package repositories 需要設定 hosts、ports、path prefixes、redirect hosts 或 private-network resolution 時使用此選項。如果 policy 宣告 bearer auth，workflow 會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；URL-embedded credentials 仍會被拒絕。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 是選填，但對於外部分享的 artifacts 應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行 test 的受信任 workflow/harness code。`package_ref` 是 `source=ref` 時會被打包的 source commit。這讓目前的 test harness 能驗證較舊的受信任 source commits，而不必執行舊的 workflow logic。

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 集合，但使用 live `plugins` 覆蓋範圍取代 `plugins-offline`，並加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 搭配 OpenWebUI 的完整 Docker release-path chunks
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` profile 使用 offline plugin 覆蓋範圍，因此已發布 package validation 不會受 live ClawHub availability 阻擋。可選的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` artifact，並保留已發布 npm spec path 供獨立 dispatch 使用。

如需專用的 update 和 plugin testing policy，包括 local commands、
Docker lanes、Package Acceptance inputs、release defaults 和 failure triage，
請參閱 [Testing updates and plugins](/zh-TW/help/testing-updates-plugins)。

Release checks 會以 `source=artifact`、準備好的 release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 和 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這會讓 package migration、update、live ClawHub skill install、stale-plugin-dependency cleanup、configured-plugin install repair、offline plugin、plugin-update 和 Telegram proof 使用同一個解析出的 package tarball。在發布 beta 後，於 Full Release Validation 或 OpenClaw Release Checks 設定 `release_package_spec`，即可在不重新建置的情況下針對已出貨 npm package 執行相同 matrix；只有在 Package Acceptance 需要與其餘 release validation 不同的 package 時，才設定 `package_acceptance_package_spec`。Cross-OS release checks 仍會涵蓋 OS-specific onboarding、installer 和 platform behavior；package/update product validation 應從 Package Acceptance 開始。

`published-upgrade-survivor` Docker lane 會在阻斷式發布路徑中，每次執行驗證一個已發布套件基準。在 Package Acceptance 中，解析出的 `package-under-test` tarball 一律是候選版本，而 `published_upgrade_survivor_baseline` 會選取備援的已發布基準，預設為 `openclaw@latest`；失敗 lane 的重新執行命令會保留該基準。Full Release Validation 搭配 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展涵蓋四個最新穩定 npm 發布版本，加上釘選的外掛相容性邊界版本，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw 外掛安裝、波浪號記錄檔路徑，以及過時舊版外掛依賴根目錄的問題形狀 fixture。多基準 published-upgrade survivor 選項會依基準分片成不同的目標 Docker runner job。獨立的 `Update Migration` 工作流程會使用 `update-migration` Docker lane，搭配 `all-since-2026.4.23` 基準與 `plugin-deps-cleanup` 情境；這適用於問題是要完整清理已發布更新，而不是一般 Full Release CI 廣度時。本機彙總執行可以用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件規格，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 供情境矩陣使用。已發布 lane 會用內建的 `openclaw config set` 命令配方設定基準，在 `summary.json` 中記錄配方步驟，並在閘道啟動後探測 `/healthz`、`/readyz` 和 RPC 狀態。Windows 套件化與安裝程式全新 lane 也會驗證已安裝套件可以從原始絕對 Windows 路徑匯入瀏覽器控制覆寫。OpenAI 跨 OS agent-turn smoke 在已設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因此安裝與閘道驗證會停留在 GPT-5 測試模型，同時避開 GPT-4.x 預設值。

### 舊版相容性視窗

Package Acceptance 對已發布套件有受限的舊版相容性視窗。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從 tarball 衍生的假 git fixture 中修剪缺少的 pnpm `patchedDependencies`，並且可以記錄缺少的持久化 `update.channel`；
- 外掛 smokes 可以讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可以允許設定中繼資料遷移，同時仍要求安裝記錄與無重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可以對已出貨的本機建置中繼資料戳記檔發出警告，而到 `2026.5.20` 為止的套件可以在缺少 `npm-shrinkwrap.json` 時警告而非失敗。較新的套件必須滿足現代契約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的 package acceptance 執行時，從 `resolve_package` 摘要開始，確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時，以及重新執行命令。優先重新執行失敗的套件 profile 或精確 Docker lane，而不是重新執行完整發布驗證。

## 安裝 smoke

獨立的 `Install Smoke` 工作流程不再於 pull request 或 `main` push 上執行。它會在夜間排程、手動 dispatch，以及從發布驗證進行 workflow call 時執行，且每次執行都會在 GitHub-hosted runner 上走完整的 install-smoke 路徑：

- 根 Dockerfile smoke 映像會針對每個目標 SHA 建置一次，或從 GHCR 以 `ghcr.io/openclaw/openclaw-dockerfile-smoke:<sha>` 重用，接著 CLI smoke、agents delete shared-workspace CLI smoke、container gateway-network E2E，以及內建 `matrix` 外掛 build-arg smoke 都會針對它執行。外掛 smoke 會驗證執行階段依賴安裝鏡像，以及外掛載入時不會出現 entry-escape 診斷。
- QR 套件安裝與安裝程式/更新 Docker smokes，包括 Rocky Linux 安裝程式 lane，以及針對可設定 `update_baseline_version` npm 基準的更新 lane，會作為獨立 job 執行，因此安裝程式工作不會卡在根映像 smokes 後面。

較慢的 Bun 全域安裝 image-provider smoke 會由 `run_bun_global_install_smoke` 另外閘控。它會在夜間排程執行，從發布檢查進行 workflow call 時預設開啟，而手動 `Install Smoke` dispatch 可以選擇加入。一般 PR CI 仍會針對 Node 相關變更執行快速 Bun launcher 迴歸 lane。QR 與安裝程式 Docker 測試會保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像，將 OpenClaw 打包一次成 npm tarball，並建置兩個共用 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/更新/外掛依賴 lane 的裸 Node/Git runner；
- 將相同 tarball 安裝到 `/app`、用於一般功能 lane 的功能性映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選定的計畫。排程器會用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選取映像，接著用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主集區 slot 數。                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 供應商敏感 tail 集區 slot 數。                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免供應商節流。                                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行多服務 lane 上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，用於避免 Docker daemon 建立風暴；設為 `0` 表示不錯開。              |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的備援逾時時間（120 分鐘）；選定的 live/tail lane 使用更嚴格的上限。               |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫而不執行 lane。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；略過清理 smoke，讓 agent 可以重現單一失敗 lane。                 |

比有效上限更重的 lane 仍可從空集區啟動，然後獨自執行直到釋放容量。本機彙總會預先檢查 Docker、移除過時的 OpenClaw E2E 容器、發出 active-lane 狀態、持久化 lane 計時以供最長優先排序，且預設在第一次失敗後停止排程新的 pooled lane。

### 可重用 live/E2E 工作流程

可重用 live/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、lane，以及憑證覆蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換成 GitHub outputs 與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball inventory；當計畫需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或既有套件 digest 映像，而不是重新建置。Docker 映像 pull 會以每次嘗試 180 秒的受限逾時重試，因此卡住的 registry/cache 串流會快速重試，而不是耗掉大部分 CI 關鍵路徑。

### 發布路徑區塊

Release Docker 覆蓋會用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊 job，因此每個分塊只會 pull 它需要的映像種類，並透過相同的加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的 release Docker 分塊是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 外掛套件 lane，該 lane 會安裝候選 OpenClaw 套件，從 `codex_plugin_spec` 或相同 ref tarball 安裝 Codex 外掛並明確核准 Codex 命令列介面安裝，執行 Codex 命令列介面 preflight，接著針對 OpenAI 執行多個相同 session 的 OpenClaw agent turns。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總外掛/執行階段別名。`install-e2e` lane 別名仍是兩個供應商安裝程式 lane 的彙總手動重新執行別名。

OpenWebUI 會在完整發行路徑涵蓋範圍要求它時併入 `plugins-runtime-services`，且只有在僅針對 OpenWebUI 的分派中才保留獨立的 `openwebui` 區塊。Bundled-channel 更新通道會針對暫時性的 npm 網路失敗重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含通道記錄、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢速通道表格，以及各通道的重新執行命令。工作流程 `docker_lanes` 輸入會針對準備好的映像執行選取的通道，而不是執行區塊工作，這會將失敗通道的偵錯範圍限制在一個目標 Docker 工作內，並為該次執行準備、下載或重用套件成品；如果選取的通道是即時 Docker 通道，目標工作會在本機建置即時測試映像以供該次重新執行使用。產生的各通道 GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和準備好的映像輸入，因此失敗的通道可以重用失敗執行中的確切套件和映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的即時/E2E 工作流程每天執行完整的發行路徑 Docker 套件。

## 外掛預發行

`Plugin Prerelease` 是成本較高的產品/套件涵蓋範圍，因此它是一個由 `Full Release Validation` 或明確操作員分派的獨立工作流程。一般 pull request、`main` 推送和獨立的手動 CI 分派都不會啟用該套件。它會在八個擴充功能工作器之間平衡 bundled 外掛測試；這些擴充功能分片工作一次最多執行兩個外掛設定群組，每個群組使用一個 Vitest worker，並配置較大的節點 heap，讓大量匯入的外掛批次不會建立額外的 CI 工作。僅限發行的 Docker 預發行路徑（由 `full_release_validation` 輸入啟用）會以四個一組批次處理目標 Docker 通道，以避免為一到三分鐘的工作保留數十個 runner。此工作流程也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` 成品；inspector 發現項目是分流輸入，不會改變阻擋性的外掛預發行閘門。

## QA Lab

QA Lab 在主要智慧範圍工作流程之外有專用的 CI 通道。Agentic parity 巢狀位於廣泛的 QA 和發行 harness 之下，而不是獨立的 PR 工作流程。當 parity 應隨廣泛驗證執行一起執行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會在 `main` 上每晚執行，也會在手動分派時執行；它會將 mock parity 通道、即時 Matrix 通道，以及即時 Telegram 和 Discord 通道展開為平行工作。即時工作使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex leases。

發行檢查會使用決定性的 mock provider 和 mock-qualified 模型（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram 即時傳輸通道，因此 channel contract 會與即時模型延遲和一般 provider 外掛啟動隔離。即時傳輸閘道會停用記憶搜尋，因為 QA parity 會另行涵蓋記憶行為；provider 連線能力則由獨立的即時模型、原生 provider 和 Docker provider 套件涵蓋。

Matrix 會針對排程與發行閘門使用 `--profile fast`，且只有在 checked-out 命令列介面支援時才加入 `--fail-fast`。命令列介面預設值和手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 分派一律會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 工作。

`OpenClaw Release Checks` 也會在發行核准之前執行發行關鍵的 QA Lab 通道；其 QA parity 閘門會將 candidate 和 baseline packs 作為平行通道工作執行，然後將兩個成品都下載到小型報告工作中，以進行最終 parity 比較。

對於一般 PR，請遵循範圍化 CI/檢查證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意作為範圍狹窄的第一道安全掃描器，而不是完整儲存庫掃描。每日、手動、`main` 推送和非草稿 pull request guard 執行會掃描 Actions 工作流程程式碼，以及風險最高的 JavaScript/TypeScript 表面，並使用高信心安全查詢，篩選為高/關鍵 `security-severity`。

pull request guard 保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或擁有程序的 bundled 外掛 runtime 路徑下有變更時啟動，且會執行與排程工作流程相同的高信心安全矩陣。Android 和 macOS CodeQL 不包含在 PR 預設值中。

### 安全性類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、機密、沙箱、排程和閘道基準                                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | 核心 channel 實作合約，加上 channel 外掛 runtime、閘道、外掛 SDK、機密、稽核觸點                                                     |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路 guard、web-fetch，以及外掛 SDK SSRF 政策表面                                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers、程序執行 helpers、outbound delivery，以及 agent tool-execution gates                                                   |
| `/codeql-security-high/process-exec-boundary`     | 本機 shell、process spawn helpers、擁有 subprocess 的 bundled 外掛 runtime，以及工作流程 script glue                                 |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、loader、manifest、registry、package-manager install、source-loading，以及外掛 SDK 套件合約信任表面                        |

### 平台特定安全性分片

- `CodeQL Android Critical Security` — 排程的 Android 安全性分片。在 workflow sanity 接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android app。上傳至 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全性分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中過濾掉相依性建置結果，並上傳至 `/codeql-critical-security/macos` 底下。由於即使在乾淨狀態下 macOS 建置也主導 runtime，因此保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全性分片。它只在 GitHub-hosted Linux runner 上，對範圍狹窄的高價值表面執行 error-severity、非安全性的 JavaScript/TypeScript 品質查詢，因此品質掃描不會消耗 Blacksmith runner-registration 預算。其 pull request guard 刻意小於排程 profile：非草稿 PR 只會針對它們觸及的表面執行對應分片，來自十三個可由 PR 路由的分片 — `agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 和 `session-diagnostics-boundary`。`ui-control-plane` 和 `web-media-runtime-boundary` 不包含在 PR 執行中。CodeQL 設定和品質工作流程變更會執行完整 PR 分片集（network runtime 分片會根據它自己的 CodeQL 設定檔和擁有網路的來源路徑觸發）。

手動分派接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄 profile 是用於隔離執行單一品質分片的教學/迭代 hooks。

| 類別                                                    | 範圍                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | 認證、密鑰、沙箱、排程和閘道安全邊界程式碼                                                                                                                   |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化和 IO 合約                                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道協定結構描述和伺服器方法合約                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道和隨附通道外掛實作合約                                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型／供應商分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器和工具橋接、程序監督輔助工具，以及輸出傳遞合約                                                                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶主機 SDK、記憶執行階段 facade、記憶外掛 SDK 別名、記憶執行階段啟用黏合層，以及記憶 doctor 命令                                                          |
| `/codeql-critical-quality/network-runtime-boundary`     | 網路政策套件、原始 socket 和 proxy-capture 執行階段、SSH tunnel、閘道鎖、JSONL socket，以及推送傳輸介面                                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、輸出工作階段繫結／傳遞輔助工具、診斷事件／記錄套件介面，以及工作階段 doctor 命令列介面合約                                  |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 輸入回覆分派、回覆酬載／分塊／執行階段輔助工具、通道回覆選項、傳遞佇列，以及工作階段／執行緒繫結輔助工具                                           |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、供應商認證與探索、供應商執行階段註冊、供應商預設值／目錄，以及 web／search／fetch／embedding 登錄                                           |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、閘道控制流程，以及任務控制平面執行階段合約                                                                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch／search、媒體 IO、媒體理解、影像生成和媒體生成執行階段合約                                                                                     |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公用介面和外掛 SDK 進入點合約                                                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端外掛 SDK 原始碼和外掛套件合約輔助工具                                                                                                            |

品質與安全性保持分離，讓品質發現可以被排程、衡量、停用或擴充，而不會遮蔽安全性訊號。Swift、Python 和隨附外掛的 CodeQL 擴充，應只在窄範圍設定檔具備穩定執行階段與訊號後，作為限定範圍或分片的後續工作加回來。

## 維護工作流程

### 文件代理

`Docs Agent` 工作流程是事件驅動的 Codex 維護通道，用於讓現有文件與近期落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動分派也可以直接執行它。當 `main` 已前進，或上一小時內已建立另一個未略過的 Docs Agent 執行時，工作流程執行叫用會略過。執行時，它會檢閱從上一個未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### 測試效能代理

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護通道，用於處理緩慢測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果另一個工作流程執行叫用在同一 UTC 日已執行或正在執行，則會略過。手動分派會繞過該每日活動閘門。此通道會建立完整套件分組 Vitest 效能報告，讓 Codex 只進行保留覆蓋率的小型測試效能修正，而不是大範圍重構，然後重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。分組報告會記錄 Linux 和 macOS 上每個設定的牆鐘時間與最大 RSS，因此前後比較會在持續時間差異旁顯示測試記憶體差異。如果基準有失敗測試，Codex 只能修正明顯失敗，且代理後的完整套件報告必須通過，才會提交任何內容。當 `main` 在 bot push 落地前前進時，此通道會 rebase 已驗證的修補、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期修補會被略過。它使用 GitHub-hosted Ubuntu，讓 Codex action 可以維持與文件代理相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是手動維護者工作流程，用於落地後清理重複項。預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 前，它會驗證已落地的 PR 已合併，且每個重複項都有共用的參照議題或重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門和變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門在架構邊界上比廣泛的 CI 平台範圍更嚴格：

- 核心生產變更會執行核心 prod 和核心 test 型別檢查，以及核心 lint／guards；
- 核心僅測試變更只會執行核心 test 型別檢查與核心 lint；
- extension 生產變更會執行 extension prod 和 extension test 型別檢查，以及 extension lint；
- extension 僅測試變更會執行 extension test 型別檢查與 extension lint；
- 公用外掛 SDK 或外掛合約變更會擴展到 extension 型別檢查，因為 extensions 依賴這些核心合約（Vitest extension sweeps 仍是明確的測試工作）；
- release metadata-only 版本提升會執行目標式版本／設定／根相依性檢查；
- 未知的 root／config 變更會 fail safe 到所有檢查通道。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，並且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，來源編輯優先使用明確映射，然後是 sibling tests 和 import-graph dependents。共享 group-room 傳遞設定是明確映射之一：對群組可見回覆設定、來源回覆傳遞模式或 message-tool system prompt 的變更，會路由到核心回覆測試加上 Discord 和 Slack 傳遞迴歸，讓共享預設值變更在第一次 PR push 前失敗。只有當變更足夠涵蓋整個 harness，導致便宜映射集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是 repo 擁有的 remote-box wrapper，用於維護者 Linux proof。代理
工作階段預設會將它用於測試與計算密集工作，
包括建置、型別檢查、lint fan-out、Docker、套件通道、E2E、live
proof，以及 CI parity。受信任的維護者程式碼預設使用
`blacksmith-testbox`，且 `.crabbox.yaml` 現在預設為它。它設定的
工作流程會注入供應商和代理憑證，因此不受信任的貢獻者或
fork 程式碼必須改用無密鑰的 fork CI 或經過清理的 direct AWS Crabbox。
Sanitized AWS 執行會設定 `CRABBOX_ENV_ALLOW=CI`、傳入
`--no-hydrate`，並使用新的臨時遠端 `HOME`；這可防止 repo
`OPENCLAW_*` allowlist 和現有認證設定檔觸及不受信任的程式碼。
它們使用新暖機且專用於該不受信任來源的租約，絕不使用
受信任或先前已注入的租約。從乾淨且受信任的 `main` checkout
啟動已安裝的受信任 Crabbox
binary，並只用 `--fresh-pr` 擷取遠端 PR；絕不在本機執行不受信任 checkout 的 wrapper 或 config。
取消設定 `CRABBOX_AWS_INSTANCE_PROFILE`，且除非解析出的
`aws.instanceProfile` 為空，否則 fail closed。在任何 install/test 前，使用受信任的
絕對路徑工具要求 IMDSv2 token，證明 IAM credentials
endpoint 回傳 404，並將遠端 `git rev-parse HEAD` 與完整
已審查 PR head SHA 比對。將租約繫結到該 SHA，並在 head 變更時停止／重新暖機。
從乾淨的 `main` 上傳受信任的 `scripts/crabbox-untrusted-bootstrap.sh`
並搭配 `--fresh-pr`；它會安裝固定版本的 Node/pnpm、驗證 SHA 和
package-manager pin、隔離 `HOME`、安裝相依性，然後執行
要求的測試。
取消設定所有 `CRABBOX_TAILSCALE*` 覆寫，強制 `--network public
--tailscale=false`，清除 exit-node/LAN 旗標，並要求 `crabbox inspect` 在上傳任何 script 前
回報公開網路且沒有 Tailscale 狀態。
自有 AWS/Hetzner 容量也仍是 Blacksmith 中斷、
配額問題或明確自有容量測試的備援。

在可能需要測試或重型 proof 的受信任程式碼任務開始時，代理
應立即在背景命令工作階段預先暖機，並在注入執行時持續
檢查與編輯，重用傳回的 `tbx_...` id，
在每次執行時同步目前 checkout，並在交接前停止它：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Crabbox 支援的 Blacksmith 執行會暖機、claim、同步、執行、回報，並清理
一次性 Testboxes。內建同步健全性檢查會在
同步後 box 上的 `git status --short` 顯示至少 200 個 tracked deletions 時快速失敗，
這會捕捉例如 `pnpm-lock.yaml` 之類消失的 root 檔案。對於刻意
大量刪除的 PR，請為遠端命令設定 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

Crabbox 也會終止在
sync 階段停留超過五分鐘且沒有 post-sync 輸出的本機 Blacksmith CLI 叫用。設定
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該 guard，或對異常大型
本機 diff 使用較大的毫秒值。

第一次執行前，從 repo root 檢查 wrapper：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper 會拒絕未公告所選 provider 的過期 Crabbox binary，而 Blacksmith 支援的執行需要 Crabbox 0.22.0 或更新版本，讓 wrapper 取得目前的 Testbox sync、queue 和 cleanup 行為。在 Codex worktrees 或 linked/sparse checkouts 中，避免使用本機 `pnpm crabbox:run` script，因為 pnpm 可能會在 Crabbox 啟動前協調相依性；請改為直接叫用 node wrapper：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用 sibling checkout 時，請在 timing 或 proof 工作前重建被忽略的本機 binary：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` 中的 `blacksmith:` 區塊已經固定 org、workflow、job 和 ref 預設值，因此下面的明確旗標是選用的。變更閘門：

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
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

完整套件：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

閱讀最終 JSON 摘要。實用欄位是 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。對於委派的
Blacksmith Testbox 執行，Crabbox 包裝器結束碼和 JSON 摘要就是
命令結果。連結的 GitHub Actions 執行負責 hydration 和 keepalive；當 Testbox 在 SSH
命令已經返回後由外部停止時，它可能以 `cancelled` 結束。除非
包裝器 `exitCode` 非零，或命令輸出顯示測試失敗，否則請將其視為清理/狀態產物。
一次性的 Blacksmith 支援 Crabbox 執行應會自動停止 Testbox；
如果執行被中斷或清理狀態不明，請檢查即時 box，並且只停止
你建立的 box：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要在同一個已 hydrated 的 box 上執行多個命令時，才使用重用：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

重用租約，而不是過時的原始碼。省略 `--no-sync`，讓每次執行都上傳
目前 checkout；只有在刻意重新執行未變更且已同步的樹時才使用它。
不受信任的貢獻者/fork 程式碼必須使用
`CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate`，並且每個命令都使用全新的
暫時遠端 `HOME`；在測試前於該已消毒的命令內安裝相依項。
只能重用專門用於同一份不受信任原始碼的新預熱租約；絕不可使用受信任或先前已 hydrated 的租約。絕不要
在本機執行不受信任 checkout 的包裝器或設定：從乾淨且受信任的 `main` 啟動已安裝的
受信任 Crabbox 二進位檔，並在每次執行傳入 `--fresh-pr`。
保持 `CRABBOX_AWS_INSTANCE_PROFILE` 未設定，拒絕非空的已解析
instance profile，要求受信任的遠端 IMDS 無角色證明，並在 install/test 前驗證
已審閱的 head SHA。將租約綁定到該 SHA；任何 head 變更後都要停止並
重新預熱。如果沒有遠端 PR，請使用無密鑰 fork CI。
絕不要為不受信任原始碼選擇 `hydrate-github` 或憑證 hydrated 的 Blacksmith workflow。

如果 Crabbox 是壞掉的那一層，但 Blacksmith 本身可用，請只將直接
Blacksmith 用於 `list`、`status` 和清理等診斷。在將直接 Blacksmith 執行視為維護者證明前，先修復
Crabbox 路徑。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的
warmup 在幾分鐘後仍停在 `queued`，且沒有 IP 或 Actions 執行 URL，
請將其視為 Blacksmith provider、佇列、計費或 org 限額壓力。停止
你建立的 queued id，避免啟動更多 Testbox，並在有人檢查 Blacksmith dashboard、
計費和 org 限額時，把證明移到下面的自有 Crabbox 容量路徑。

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確以自有容量為目標時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務真的需要 48xlarge 等級 CPU，否則避免 `class=beast`。`beast` 請求從 192 個 vCPU 開始，最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額。repo 自有的 `.crabbox.yaml` 預設為 `class: standard`、on-demand market 和 `capacity.hints: true`，因此 brokered AWS 租約會列印選定的 region/market、配額壓力、Spot fallback，以及高壓力 class 警告。較重的廣泛檢查請使用 `fast`；只有在 standard/fast 不足時才使用 `large`；`beast` 僅用於例外的 CPU-bound lane，例如 full-suite 或 all-plugin Docker matrix、明確的 release/blocker 驗證，或高核心效能剖析。不要將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint/typecheck、小型 E2E 重現，或 Blacksmith 中斷分流。容量診斷請使用 `--market on-demand`，避免將 Spot market 波動混入訊號。

`.crabbox.yaml` 擁有 provider、sync 和 GitHub Actions hydration 預設值。Crabbox sync 永遠不會傳輸 `.git`，因此已 hydrated 的 Actions checkout 會保留自己的遠端 Git metadata，而不是同步維護者本機的 remote 和 object store；repo 設定也額外排除絕不應傳輸的本機 runtime/build artifacts（例如 `.artifacts` 和測試報告）。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、節點/pnpm 設定、`origin/main` fetch，以及用於自有雲端 `crabbox run --id <cbx_id>` 命令的非密鑰環境交接。

## 相關

- [安裝總覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
