---
read_when:
    - 你需要了解為什麼 CI 作業有執行或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次版本驗證執行或重新執行
    - 你正在變更 ClawSweeper 派送或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括項目與本機命令等效項目
title: CI 管線
x-i18n:
    generated_at: "2026-07-06T21:46:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56efdae09754c6fe11abfe707a28c679dd0dae231fbaf15da0cf57f76498bb29
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在推送到 `main` 時執行（Markdown 和 `docs/**` 路徑會在觸發條件中被忽略）、在非草稿 pull request 時執行（僅 CHANGELOG 的差異會被忽略），以及在手動派送時執行。標準 `main` 推送會先通過 90 秒的託管 runner 准入窗口；`CI` concurrency group 會在較新的提交到達時取消等待中的執行，因此連續合併不會每次都註冊完整的 Blacksmith 矩陣。Pull request 和手動派送會略過等待。接著 `preflight` job 會分類差異，並在只有不相關區域變更時關閉昂貴的 lane。手動 `workflow_dispatch` 執行會刻意繞過智慧範圍限定，並展開完整圖形，用於發行候選版本與廣泛驗證。Android lane 透過 `include_android`（或 `release_gate` 輸入）維持選擇性啟用。僅發行使用的外掛涵蓋範圍位於獨立的 [`外掛預發行`](#plugin-prerelease) 工作流程中，且只會從 [`完整發行驗證`](#full-release-validation) 或明確的手動派送執行。

## 管線總覽

| Job                                | 用途                                                                                                                                                                                            | 執行時機                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件變更、已變更範圍、已變更擴充功能，並建置 CI manifest                                                                                                            | 一律在非草稿推送和 PR 上執行                  |
| `runner-admission`                 | 在註冊 Blacksmith 工作前，對標準 `main` 推送進行託管 90 秒 debounce                                                                                                         | 每次 CI 執行；僅在標準 `main` 推送時睡眠 |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 稽核已變更工作流程，以及生產 lockfile 稽核                                                                                                          | 一律在非草稿推送和 PR 上執行                  |
| `pnpm-store-warmup`                | 預熱由 lockfile 鎖定的 pnpm store 快取，且不阻塞 Linux 節點 shard                                                                                                                       | 已選取節點或 docs-check lane                   |
| `build-artifacts`                  | 建置 `dist/`、Control UI、已建置命令列介面 smoke check、啟動記憶體，以及嵌入式已建置 artifact 檢查                                                                                              | 與節點相關的變更                               |
| `checks-fast-core`                 | 快速 Linux 正確性 lane：bundled + protocol、Bun launcher，以及 CI 路由 fast task                                                                                                       | 與節點相關的變更                               |
| `checks-fast-contracts-plugins-*`  | 兩個加權外掛 contract shard                                                                                                                                                                | 與節點相關的變更                               |
| `checks-fast-contracts-channels-*` | 兩個加權 channel contract shard                                                                                                                                                               | 與節點相關的變更                               |
| `checks-node-*`                    | 核心節點測試 shard，不包含 channel、bundled、contract 與 extension lane                                                                                                                   | 與節點相關的變更                               |
| `check-*`                          | 分片後的主要本機 gate 等價項：guards、shrinkwrap、bundled-channel config metadata、生產 types、lint、dependencies、test types                                                                | 與節點相關的變更                               |
| `check-additional-*`               | 邊界檢查分帶（包含 prompt snapshot drift）、session accessor/transcript reader 邊界、extension lint 群組、package boundary compile/canary，以及 runtime topology architecture | 與節點相關的變更                               |
| `checks-node-compat-node22`        | 節點 22 相容性建置與 smoke lane                                                                                                                                                         | 發行用的手動 CI 派送                     |
| `check-docs`                       | 文件格式化、lint 與壞連結檢查                                                                                                                                                      | 文件已變更（PR 和手動派送）              |
| `native-i18n`                      | 原生 app、Android 與 Apple i18n inventory 檢查                                                                                                                                               | 與原生 i18n 相關的變更                        |
| `skills-python`                    | Python-backed Skills 的 Ruff + pytest                                                                                                                                                             | 與 Python skill 相關的變更                       |
| `checks-windows`                   | Windows 專屬 process/path 測試，加上 shared runtime import specifier regression                                                                                                               | 與 Windows 相關的變更                            |
| `macos-node`                       | 聚焦的 macOS TypeScript 測試：launchd、Homebrew、runtime paths、packaging scripts、process-group wrapper                                                                                         | 與 macOS 相關的變更                              |
| `macos-swift`                      | macOS app 的 Swift lint、build 與 tests                                                                                                                                                     | 與 macOS 相關的變更                              |
| `ios-build`                        | Xcode project generation 加上 iOS app simulator build                                                                                                                                          | iOS app、shared app kit 或 Swabble 變更         |
| `android`                          | 兩種 flavor 的 Android unit tests 加上一個 debug APK build                                                                                                                                       | 與 Android 相關的變更                            |
| `test-performance-agent`           | 獨立工作流程：可信活動後的每日 Codex slow-test optimization                                                                                                                       | Main CI 成功或手動派送                  |
| `openclaw-performance`             | 獨立工作流程：每日/隨選 Kova runtime performance reports，包含 mock-provider、deep-profile 與 GPT 5.5 live lane                                                                       | 排程和手動派送                       |

## Fail-fast 順序

1. `runner-admission` 只會等待標準 `main` 推送；較新的推送會在 Blacksmith 註冊前取消該次執行。
2. `preflight` 會決定哪些 lane 根本存在。`docs-scope` 和 `changed-scope` 邏輯是此 job 內的步驟，不是獨立 job。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不會等待較重的 artifact 與平台矩陣 job。
4. `build-artifacts` 會與快速 Linux lane 重疊，讓下游消費者能在 shared build 準備好時立即開始。
5. 較重的平台與 runtime lane 會在之後展開：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

當較新的推送落在相同 PR 或 `main` ref 時，GitHub 可能會將被取代的 job 標記為 `cancelled`。除非相同 ref 的最新執行也失敗，否則將其視為 CI 噪音。矩陣 job 使用 `fail-fast: false`，而 `build-artifacts` 會直接回報 embedded channel、core-support-boundary 和 gateway-watch 失敗，而不是排入小型 verifier job。自動 CI concurrency key 有版本標記（`CI-v7-*`），因此 GitHub 端舊 queue group 中的 zombie 不會無限期阻塞較新的 main 執行。手動 full-suite 執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>` 從 GitHub Actions 摘要 wall time、queue time、最慢的 job、失敗項目，以及 `pnpm-store-warmup` fanout barrier。工作流程內的 `ci-timings-summary` job 存在於 `ci.yml`，但目前已停用（`if: false`）；請改在本機執行 timing helper。若要查看 build timing，請檢查 `build-artifacts` job 的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會印出 `[build-all] phase timings:` 並包含 `ui:build`；該 job 也會上傳 `startup-memory` artifact。

## PR 脈絡與證據

外部貢獻者 PR 會從 `.github/workflows/real-behavior-proof.yml` 執行 PR 脈絡與證據 gate。該工作流程會 checkout 可信的工作流程 revision（`github.workflow_sha`），且只評估 PR body；它不會執行貢獻者 branch 的程式碼。

此 gate 適用於不是 repository owners、members、collaborators 或 bots 的 PR 作者。當 PR body 包含作者撰寫的 `What Problem This Solves` 和 `Evidence` section 時即通過。證據可以是聚焦測試、CI 結果、螢幕截圖、錄影、終端機輸出、即時觀察、已遮蔽記錄，或 artifact 連結。Body 提供意圖與有用驗證；reviewer 會檢查程式碼、測試與 CI 來評估正確性。

當檢查失敗時，請更新 PR body，而不是再推送另一個程式碼 commit。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit tests 覆蓋。手動派送會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI 工作流程編輯**會驗證節點 CI 圖、工作流程 lint，以及 Windows 通道（由 `ci.yml` 執行），但不會自行強制執行 iOS、Android 或 macOS 原生建置；那些平台通道仍限於平台原始碼變更。
- **工作流程健全性**會對所有工作流程 YAML 檔案執行 `actionlint`、`zizmor`，並執行複合動作插值防護與衝突標記防護。PR 範圍的 `security-fast` 作業也會對變更的工作流程檔案執行 `zizmor`，讓工作流程安全性發現能在主要 CI 圖中及早失敗。
- **推送到 `main` 的文件**會由獨立的 `Docs` 工作流程檢查，並使用與 CI 相同的 ClawHub 文件鏡像，因此混合程式碼與文件的推送不會同時排入 CI 的 `check-docs` 分片。Pull request 與手動 CI 在文件變更時仍會從 CI 執行 `check-docs`。
- **終端介面 PTY**會在終端介面變更時於 `checks-node-core-runtime-tui-pty` Linux 節點分片中執行。該分片會以 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋確定性的 `TuiBackend` fixture 通道，以及較慢、只模擬外部模型端點的 `tui --local` smoke。
- **僅限 CI 路由的編輯、快速工作直接執行的一小組核心測試 fixture，以及狹窄的外掛合約輔助程式編輯**會使用快速的僅節點 manifest 路徑：`preflight`、`security-fast`，以及變更觸及的快速通道，也就是單一 `checks-fast-core` CI 路由工作、兩個外掛合約分片，或兩者。該路徑會略過建置成品、節點 22 相容性、通道合約、完整核心分片、內建外掛分片，以及額外的防護矩陣。
- **Windows 節點檢查**限於 Windows 專屬的程序/路徑 wrapper、npm/pnpm/UI runner 輔助程式、套件管理器設定，以及執行該通道的 CI 工作流程介面；不相關的原始碼、外掛、安裝 smoke 和僅測試變更會留在 Linux 節點通道上。

最慢的節點測試系列會被拆分或平衡，讓每個作業維持小型規模而不過度保留 runner：

- 外掛合約與通道合約各自以兩個加權、Blacksmith 支援的分片執行，並具備標準 GitHub runner 後援。
- 核心單元 fast/support 通道會分開執行；核心 runtime 基礎設施會拆分為 process、shared、hooks、secrets，以及三個排程網域分片。
- Auto-reply 會以平衡的 worker 執行，reply 子樹會拆成 agent-runner、commands、dispatch、session 和 state-routing 分片。
- Agentic 閘道/伺服器（控制平面）設定會拆分為 chat、auth、model、HTTP/plugin、runtime 和 startup 通道，而不是等待建置成品。
- 一般 CI 只會將隔離的基礎設施 include-pattern 分片打包成最多 64 個測試檔案的確定性套組，降低節點矩陣規模，同時不合併非隔離的 command/cron、有狀態 agents-core，或 gateway/server 測試套件。大型固定套件仍使用 8 vCPU，而打包與較低權重的通道使用 4 vCPU。
- 標準儲存庫上的 Pull request 會使用精簡 admission 計畫：相同的逐設定群組在隔離子程序中執行，目前是 18 個節點測試作業，而不是 74 個作業的完整矩陣。`main` 推送、手動 dispatch 和 release gate 會保留完整矩陣。
- 廣泛的瀏覽器、QA、媒體與雜項外掛測試會使用各自專用的 Vitest 設定，而不是共用外掛 catch-all。Include-pattern 分片會使用 CI 分片名稱記錄時間項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分完整設定與篩選後的分片。
- `check-additional-*` 會將補充邊界防護清單（`scripts/run-additional-boundary-checks.mjs`）分條到一個 prompt-heavy 分片（`check-additional-boundaries-a`，其中包含 Codex 提示快照漂移檢查）以及一個用於剩餘條帶的合併分片（`check-additional-boundaries-bcd`），每個分片都會並行執行獨立防護並列印逐檢查時間。套件邊界 compile/canary 工作會維持在一起，而 runtime topology architecture 會與嵌入 `build-artifacts` 的閘道 watch 覆蓋範圍分開執行。
- 閘道 watch、通道測試，以及核心 support-boundary 分片會在 `dist/` 和 `dist-runtime/` 已建置完成後，於 `build-artifacts` 內並行執行。

一旦通過 admission，標準 Linux CI 允許最多 24 個並行節點測試作業，
較小的 fast/check 通道則允許 12 個；Windows 和 Android 維持兩個，因為
那些 runner 池較窄。精簡的完整設定批次會以
120 分鐘批次逾時執行，而 include-pattern 群組共用相同的有界
作業預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。第三方 flavor 沒有獨立的 source set 或 manifest；其單元測試通道仍會使用 SMS/通話記錄 BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送時重複執行 debug APK 封裝作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（釘選到精確 Knip 版本的生產 Knip 僅依賴項目 pass，並在 `dlx` 安裝時停用 pnpm 的最低發行年齡）和 `pnpm deadcode:unused-files`，後者會將 Knip 的生產未使用檔案發現與 `scripts/deadcode-unused-files.allowlist.mjs` 比對，另有一份諮詢性 `pnpm deadcode:report:ci:ts-unused` 報告會上傳為 `deadcode-reports` 成品。當 PR 新增未經審查的未使用檔案，或留下過時 allowlist 項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的有意動態外掛、生成、建置、live-test 和套件 bridge 介面。

## ClawSweeper 活動轉發

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端 bridge。它不會 checkout 或執行不受信任的 pull request 程式碼。該工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload dispatch 到 `openclaw/clawsweeper`。

該工作流程有四個通道：

- `clawsweeper_item` 用於精確的 issue 和 pull request 審查請求；
- `clawsweeper_comment` 用於 issue comment 中明確的 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit 層級審查請求；
- `github_activity` 用於 ClawSweeper 代理可能檢查的一般 GitHub 活動。

`github_activity` 通道只會轉發正規化中繼資料：事件類型、動作、actor、儲存庫、項目編號、URL、標題、狀態，以及存在時的留言或審查短摘錄。它有意避免轉發完整 webhook body。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，會將正規化事件發布到 ClawSweeper 代理的 OpenClaw 閘道 hook。

一般活動是觀察，不是預設交付。ClawSweeper 代理會在其提示中收到 Discord 目標，且只有在事件令人意外、可行動、有風險或具營運用途時，才應發布到 `#clawsweeper`。例行開啟、編輯、bot churn、重複 webhook 雜訊，以及正常審查流量都應產生 `NO_REPLY`。

在整個路徑中，將 GitHub 標題、留言、body、審查文字、分支名稱和 commit message 視為不受信任的資料。它們是摘要與分流的輸入，不是工作流程或代理 runtime 的指令。

## 手動 dispatch

手動 CI dispatch 會執行與一般 CI 相同的作業圖，但會強制開啟每個非 Android 範圍通道：Linux 節點分片、內建外掛分片、外掛與通道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、建置成品 smoke 檢查、文件檢查、Python Skills、Windows、macOS、iOS 建置，以及 Control UI i18n。獨立手動 CI dispatch 只有在 `include_android=true` 時才會執行 Android（`release_gate` 輸入也會強制 Android）；完整 release umbrella 會透過傳遞 `include_android=true` 啟用 Android。外掛 prerelease 靜態檢查、僅 release 的 `agentic-plugins` 分片、完整 extension 批次掃描，以及外掛 prerelease Docker 通道會從 CI 排除。Docker prerelease 套件只會在 `Full Release Validation` 以啟用 release-validation gate 的方式 dispatch 獨立的 `Plugin Prerelease` 工作流程時執行。

手動執行會使用唯一的 concurrency group，因此 release-candidate 完整套件不會被同一 ref 上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫者，使用所選 dispatch ref 的工作流程檔案，針對分支、tag 或完整 commit SHA 執行該圖。`release_gate` 輸入是 exact-SHA maintainer 後援，用於容量停滯的 PR CI：它要求 `target_ref` 必須是與 dispatched 分支 head 相符的完整 commit SHA。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月 npm-only extended-stable 路徑是例外：從精確的
`extended-stable/YYYY.M.33` 分支 dispatch `OpenClaw NPM
Release` preflight 和 `Full Release Validation`，保留它們的 run ID，並將兩個 ID 傳給
直接 npm publish 執行。請參閱[每月 npm-only extended-stable
發布](/zh-TW/reference/RELEASING#monthly-npm-only-extended-stable-publication)，了解
命令、精確身分需求、registry readback，以及 selector
修復程序。此路徑不會 dispatch 外掛、macOS、Windows、GitHub
Release、private dist-tag 或其他平台發布。

## Runner

| 執行器                          | 工作                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI 派送與非標準儲存庫備援、CodeQL 安全性與品質掃描、工作流程健全性檢查、標籤器、自動回覆、獨立的 Docs 工作流程，以及整個 Install Smoke 工作流程                                                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`pnpm-store-warmup`、`native-i18n`、`checks-fast-core`、外掛/通道合約分片、多數綁定/較輕量的 Linux 節點分片、除 `check-lint` 外的 `check-*` 線道、選定的 `check-additional-*` 分片、`check-docs`，以及 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重量級 Linux 節點套件、邊界/外掛密集的 `check-additional-*` 分片，以及 `android`                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404` | CI 與 Testbox 中的 `build-artifacts`，以及 `check-lint`（對 CPU 足夠敏感，因此 8 vCPU 的成本高於節省的成本）                                                                                                                                                              |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；分支儲存庫會退回到 `macos-15`                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；分支儲存庫會退回到 `macos-26`                                                                                                                                                                                             |

## 執行器註冊預算

OpenClaw 目前的 GitHub 執行器註冊配額在 `ghx api rate_limit` 中回報為每 5 分鐘 10,000 次自行託管執行器註冊。每次調整前都要重新檢查 `actions_runner_registration`，因為 GitHub 可能會變更這個配額。此限制由 `openclaw` 組織中的所有 Blacksmith 執行器註冊共用，因此新增另一個 Blacksmith 安裝不會新增新的配額。

將 Blacksmith 標籤視為爆量控制的稀缺資源。只負責路由、通知、摘要、選擇分片，或執行短時間 CodeQL 掃描的工作，應留在 GitHub 託管的執行器上，除非它們有經量測的 Blacksmith 特定需求。任何新的 Blacksmith 矩陣、更大的 `max-parallel`，或高頻率工作流程，都必須顯示其最壞情況註冊數，並將組織層級目標維持在即時配額約 60% 以下。以目前 10,000 次註冊配額來說，這代表 6,000 次註冊的操作目標，為並行儲存庫、重試與爆量重疊保留餘裕。

標準儲存庫 CI 會將 Blacksmith 保持為一般推送與拉取請求執行的預設執行器路徑。`workflow_dispatch` 與非標準儲存庫執行會使用 GitHub 託管的執行器，但一般標準執行目前不會探測 Blacksmith 佇列健康狀態，也不會在 Blacksmith 不可用時自動退回到 GitHub 託管標籤。

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

`OpenClaw Performance` 是產品/執行階段效能工作流程。它每天在 `main` 上執行，也可以手動派送：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動派送通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對發行標籤或另一個分支進行基準測試。已發布的報告路徑與最新指標會以受測 ref 為索引鍵，且每個 `index.md` 都會記錄受測 ref/SHA、工作流程 ref/SHA、Kova ref、設定檔、線道驗證模式、模型、重複次數，以及情境篩選器。

此工作流程會從固定版本安裝 OCM，並從 `openclaw/Kova` 以固定的 `kova_ref` 輸入安裝 Kova，然後執行三條線道：

- `mock-provider`：Kova 診斷情境，針對使用確定性假 OpenAI 相容驗證的本機建置執行階段。
- `mock-deep-profile`：針對啟動、閘道與代理回合熱點的 CPU/堆積/追蹤分析。依排程執行，或在派送時搭配 `deep_profile=true` 執行。
- `live-openai-candidate`：真實 OpenAI `openai/gpt-5.5` 代理回合；當 `OPENAI_API_KEY` 不可用時略過。依排程執行，或在派送時搭配 `live_openai_candidate=true` 執行。

mock-provider 線道也會在 Kova 通過後執行 OpenClaw 原生來源探測：預設、略過通道、內部鉤子與五十個外掛啟動案例中的閘道開機時間與記憶體；綁定外掛匯入 RSS、重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道的命令列介面啟動命令，以及 SQLite 狀態煙霧效能探測。當受測 ref 可取得先前已發布的 mock-provider 來源報告時，來源摘要會將目前 RSS 與堆積值與該基準比較，並將大幅 RSS 增加標記為 `watch`。來源探測 Markdown 摘要位於報告套件中的 `source/index.md`，原始 JSON 則在旁邊。

每條線道都會上傳 GitHub 成品。當 `CLAWGRIT_REPORTS_TOKEN` 已設定時，工作流程也會將 `report.json`、`report.md`、套件、`index.md` 與來源探測成品提交到 `openclaw/clawgrit-reports`，路徑為 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。目前受測 ref 指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發行驗證

`Full Release Validation` 是「發行前執行所有項目」的手動總括工作流程。它接受分支、標籤或完整提交 SHA，使用該目標派送手動 `CI` 工作流程（包含 Android）、派送 `Plugin Prerelease` 以取得僅限發行的外掛/套件/靜態/Docker 證明、針對目標 SHA 派送 `OpenClaw Performance`，並派送 `OpenClaw Release Checks` 以進行安裝煙霧測試、套件驗收、跨作業系統套件檢查、QA Lab 對等性、Matrix 與 Telegram 線道（建議性成熟度評分卡呈現可透過 `run_maturity_scorecard` 選擇啟用）。穩定版與完整設定檔一律包含完整的即時/E2E 與 Docker 發行路徑浸泡覆蓋；beta 設定檔可透過 `run_release_soak=true` 選擇啟用。標準套件 Telegram E2E 會在 Package Acceptance 內執行，因此完整候選版本不會啟動重複的即時輪詢器。發布後，傳入 `release_package_spec` 可在 release checks、Package Acceptance、Docker、跨作業系統與 Telegram 中重用已發行的 npm 套件，而不重新建置。`npm_telegram_package_spec` 只用於聚焦的已發布套件 Telegram 重新執行。Codex 外掛即時套件線道預設使用相同的選定狀態：已發布的 `release_package_spec=openclaw@<tag>` 會推導出 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/成品執行會從選定 ref 打包 `extensions/codex`。若要使用自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` 規格，請明確設定 `codex_plugin_spec`。

請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、確切的工作流程工作名稱、設定檔差異、成品，以及聚焦重新執行控制項。

`OpenClaw Release Publish` 是手動的變更型發行工作流程。請在發行標籤存在且 OpenClaw npm 預檢成功後，從 `release/YYYY.M.PATCH` 或 `main` 派送它（預檢會在其檢查中執行 `pnpm plugins:sync:check`）。它需要已儲存的 `preflight_run_id` 與成功的 `full_release_validation_run_id`，會為所有可發布的外掛套件派送 `Plugin NPM Release`，為同一個發行 SHA 派送 `Plugin ClawHub Release`，接著才派送 `OpenClaw NPM Release`。穩定版發布也需要精確的 `windows_node_tag`；工作流程會先驗證 Windows 來源發行，並在任何發布子工作前，將其 x64/ARM64 安裝程式與候選核准的 `windows_node_installer_digests` 輸入進行比較，接著提升並驗證同一組固定安裝程式摘要，加上精確的伴隨資產與校驗和合約，然後才發布 GitHub 發行草稿。

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

GitHub workflow dispatch ref 必須是分支或標籤，不能是原始 commit SHA。此
輔助工具會在目標 SHA 推送一個暫時的 `release-ci/<sha>-...` 分支，
從該釘選 ref dispatch `Full Release Validation`，驗證每個子
workflow 的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。如果任何子 workflow 在不同的 SHA 執行，總括驗證器也會失敗。

`release_profile` 控制傳入發行檢查的即時/供應商涵蓋廣度。手動發行 workflow 預設為 `stable`；只有在你刻意想要廣泛的 advisory 供應商/媒體矩陣時才使用 `full`。穩定版與完整發行檢查一律執行詳盡的即時/E2E 與 Docker 發行路徑 soak；beta 設定檔可以用 `run_release_soak=true` 選擇加入。

- `minimum` 保留最快的 OpenAI/核心發行關鍵 lane。
- `stable` 加入穩定版供應商/後端集合。
- `full` 執行廣泛的 advisory 供應商/媒體矩陣。

總括 workflow 會記錄已 dispatch 的子執行 ID，而最終的 `Verify full validation` 工作會重新檢查目前子執行結論，並為每個子執行附加最慢工作表。如果重新執行某個子 workflow 後轉為綠燈，只需重新執行父驗證器工作，以重新整理總括結果與時間摘要。

若要復原，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。發行候選版使用 `all`，只重新執行一般完整 CI 子 workflow 使用 `ci`，只重新執行外掛預發行子 workflow 使用 `plugin-prerelease`，只重新執行 OpenClaw Performance 子 workflow 使用 `performance`，重新執行每個發行子 workflow 使用 `release-checks`，或在總括 workflow 上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能在聚焦修復後，限制失敗發行 box 的重新執行範圍。若只有一個跨 OS lane 失敗，請將 `rerun_group=cross-os` 搭配 `cross_os_suite_filter`，例如 `windows/packaged-upgrade`；長時間的跨 OS 命令會輸出心跳偵測行，而 packaged-upgrade 摘要會包含各階段時間。QA release-check lane 屬於 advisory，但標準 runtime 工具涵蓋 gate 例外；當必要的 OpenClaw 動態工具在標準層摘要中漂移或消失時，該 gate 會阻擋。

`OpenClaw Release Checks` 使用受信任的 workflow ref，將所選 ref 解析一次成 `release-package-under-test` tarball，然後將該 artifact 傳給跨 OS 檢查與套件驗收，並在執行 soak 涵蓋時傳給即時/E2E 發行路徑 Docker workflow。這會讓發行 box 之間的套件位元組保持一致，並避免在多個子工作中重複打包同一個候選版本。對於 Codex npm-plugin 即時 lane，發行檢查會傳入從 `release_package_spec` 衍生出的相符已發布外掛 spec、傳入操作者提供的 `codex_plugin_spec`，或將輸入留空，讓 Docker script 打包所選 checkout 的 Codex 外掛。

對 `ref=main` 且 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的總括 workflow。父監控器會在父 workflow 被取消時，取消任何已 dispatch 的子 workflow，因此較新的 main 驗證不會卡在過時的兩小時 release-check 執行後面。發行分支/標籤驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## 即時與 E2E shard

發行即時/E2E 子 workflow 保留廣泛的原生 `pnpm test:live` 涵蓋，但它會透過 `scripts/test-live-shard.mjs` 以具名 shard 執行，而不是單一序列工作：

- `native-live-src-agents` and `native-live-src-agents-zai-coding`
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
- split media audio/video shards and provider-filtered music shards

這會保留相同的檔案涵蓋，同時讓緩慢的即時供應商失敗更容易重新執行與診斷。彙總的 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` shard 名稱仍可用於手動一次性重新執行。

原生即時媒體 shard 會在 `Live Media Runner Image` workflow 建置的 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行。該映像預先安裝 `ffmpeg` 與 `ffprobe`；媒體工作只會在設定前驗證二進位檔。請將 Docker 支援的即時套件組保留在一般 Blacksmith runner 上，容器工作不是啟動巢狀 Docker 測試的正確位置。

Docker 支援的即時模型/後端 shard 會針對每個所選 commit 使用獨立的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 映像。即時發行 workflow 會建置並推送該映像一次，然後 Docker 即時模型、供應商分 shard 的 Gateway、命令列介面後端、ACP bind 與 Codex harness shard 會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker shard 會攜帶明確的 script 層級 `timeout` 上限，且低於 workflow 工作 timeout，因此卡住的容器或清理路徑會快速失敗，而不是消耗整個 release-check 預算。如果這些 shard 獨立重建完整 source Docker target，代表發行執行設定錯誤，並會在重複映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證 source tree，而套件驗收會透過使用者在安裝或更新後操作的相同 Docker E2E harness 驗證單一 tarball。

### 工作

1. `resolve_package` checkout `workflow_ref`，解析一個套件候選版本，寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，寫入 `.artifacts/docker-e2e-package/package-candidate.json`，將兩者作為 `package-under-test` artifact 上傳，並在 GitHub 步驟摘要中列印來源、workflow ref、套件 ref、版本、SHA-256 與設定檔。
2. `package_integrity` 下載 `package-under-test` artifact，並使用 `scripts/check-openclaw-package-tarball.mjs` 強制執行公開套件 tarball contract。
3. `docker_acceptance` 以解析出的套件來源 SHA 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`（fallback 為 `workflow_ref`），並設定 `package_artifact_name=package-under-test`。可重用 workflow 會下載該 artifact、驗證 tarball inventory、在需要時準備 package-digest Docker 映像，並針對該套件執行所選 Docker lane，而不是打包 workflow checkout。當設定檔選取多個目標 `docker_lanes` 時，可重用 workflow 會準備套件與共享映像一次，然後將這些 lane 展開為平行的目標 Docker 工作，並使用唯一 artifact。
4. `package_telegram` 可選擇呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，且在套件驗收解析出一個套件時，會安裝相同的 `package-under-test` artifact；獨立 Telegram dispatch 仍可安裝已發布的 npm spec。
5. `summary` 會在套件解析、完整性、Docker 驗收或可選 Telegram lane 失敗時讓 workflow 失敗。`advisory` 輸入會將 advisory 呼叫者的驗收失敗降級為警告。

### 候選來源

- `source=npm` 只接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。這用於已發布的 extended-stable、預發行或穩定版驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整 commit SHA。解析器會擷取 OpenClaw 分支/標籤，驗證所選 commit 可從 repository 分支歷史或發行標籤抵達，在 detached worktree 中安裝依賴，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 認證資料、非預設 HTTPS port、私有/內部/特殊用途 hostname 或解析出的 IP，以及不符合相同公開安全政策的 redirect。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名 trusted-source 政策下載 HTTPS `.tgz`；必須提供 `package_sha256` 與 `trusted_source_id`。只在維護者擁有的企業 mirror 或私有套件 repository 需要設定 host、port、path prefix、redirect host 或 private-network resolution 時使用此選項。如果政策宣告 bearer 驗證，workflow 會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret；仍會拒絕 URL 內嵌的認證資料。
- `source=artifact` 從 `artifact_run_id` 與 `artifact_name` 下載一個 `.tgz`；`package_sha256` 可選，但應為外部共享 artifact 提供。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任 workflow/harness code。`package_ref` 是在 `source=ref` 時會被打包的來源 commit。這讓目前的測試 harness 可以驗證較舊的受信任來源 commit，而不執行舊 workflow 邏輯。

### 套件組設定檔

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — the `package` set with live `plugins` coverage instead of `plugins-offline`, plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — full Docker release-path chunks with OpenWebUI
- `custom` — exact `docker_lanes`; required when `suite_profile=custom`

`package` 設定檔使用離線外掛涵蓋，因此已發布套件驗證不會受限於即時 ClawHub 可用性。可選 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` artifact，並保留已發布 npm spec 路徑供獨立 dispatch 使用。

如需專用更新與外掛測試政策，包括本機命令、Docker lane、套件驗收輸入、發行預設值與失敗 triage，請參閱 [測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發行檢查會呼叫套件驗收，並使用 `source=artifact`、已準備的發行套件 artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 與 `telegram_mode=mock-openai`。這會讓套件 migration、更新、即時 ClawHub skill 安裝、過期外掛依賴清理、已設定外掛安裝修復、離線外掛、外掛更新與 Telegram proof 都使用相同解析出的套件 tarball。在發布 beta 後，請在 Full Release Validation 或 OpenClaw Release Checks 上設定 `release_package_spec`，以針對已發布的 npm 套件執行相同矩陣而不重新建置；只有當套件驗收需要與其餘發行驗證不同的套件時，才設定 `package_acceptance_package_spec`。跨 OS 發行檢查仍會涵蓋 OS 特定的 onboarding、安裝程式與平台行為；套件/更新產品驗證應從套件驗收開始。

`published-upgrade-survivor` Docker 通道會在阻斷式發布路徑中，每次執行驗證一個已發布套件基準。在 Package Acceptance 中，解析出的 `package-under-test` tarball 一律是候選版本，而 `published_upgrade_survivor_baseline` 會選取備援的已發布基準，預設為 `openclaw@latest`；失敗通道的重新執行命令會保留該基準。當 Full Release Validation 設定 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'`，並設定 `published_upgrade_survivor_scenarios=reported-issues`，以擴展涵蓋最新四個穩定版 npm 發布，加上固定的外掛相容性邊界發布，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw 外掛安裝、波浪號記錄檔路徑，以及過時舊版外掛相依性根目錄的議題形狀夾具。多基準已發布升級倖存者選項會依基準分片到個別的目標 Docker runner 工作。獨立的 `Update Migration` workflow 會在問題是完整清理已發布更新，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker 通道搭配 `all-since-2026.4.23` 基準與 `plugin-deps-cleanup` 情境。本機彙總執行可以用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件規格，也可以用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一通道，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 來指定情境矩陣。已發布通道會用內建的 `openclaw config set` 命令配方設定基準，將配方步驟記錄在 `summary.json`，並在閘道啟動後探測 `/healthz`、`/readyz`，以及 RPC 狀態。Windows 封裝與安裝程式 fresh 通道也會驗證已安裝套件可以從原始絕對 Windows 路徑匯入 browser-control 覆寫。OpenAI 跨 OS agent-turn smoke 會在設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因此安裝與閘道證明會停留在 GPT-5 測試模型，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

Package Acceptance 針對已發布套件有有界的舊版相容性窗口。直到 `2026.4.25` 的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私人 QA 項目可以指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從 tarball 衍生的假 git 夾具中修剪缺失的 pnpm `patchedDependencies`，也可以記錄缺失的已持久化 `update.channel`；
- 外掛 smokes 可以讀取舊版安裝記錄位置，或接受缺失的 marketplace 安裝記錄持久化；
- `plugin-update` 可以允許設定中繼資料遷移，同時仍要求安裝記錄與不重新安裝行為維持不變。

已發布的 `2026.4.26` 套件也可以針對已出貨的本機建置中繼資料戳記檔案發出警告，而直到 `2026.5.20` 的套件在缺少 `npm-shrinkwrap.json` 時可以警告而不是失敗。之後的套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的 package acceptance 執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道記錄、階段計時，以及重新執行命令。優先重新執行失敗的套件 profile 或精確 Docker 通道，而不是重新執行完整 release validation。

## 安裝 smoke

獨立的 `Install Smoke` workflow 不再於 pull request 或 `main` push 上執行。它會在 nightly 排程、手動 dispatch，以及作為 release validation 的 workflow call 執行，而且每次執行都會在 GitHub-hosted runner 上走完整 install-smoke 路徑：

- 根 Dockerfile smoke 映像會針對每個目標 SHA 建置一次（或從 GHCR 以 `ghcr.io/openclaw/openclaw-dockerfile-smoke:<sha>` 重用），然後 CLI smoke、agents delete shared-workspace CLI smoke、container gateway-network E2E，以及 bundled `matrix` 外掛 build-arg smoke 會針對它執行。外掛 smoke 會驗證執行階段相依性安裝鏡像，以及外掛載入時沒有 entry-escape 診斷。
- QR 套件安裝與安裝程式/update Docker smokes（包括 Rocky Linux 安裝程式通道，以及針對可設定 `update_baseline_version` npm 基準的 update 通道）會作為獨立工作執行，讓安裝程式工作不必等在根映像 smokes 後面。

較慢的 Bun 全域安裝 image-provider smoke 由 `run_bun_global_install_smoke` 另行控管。它會在 nightly 排程上執行，對 release checks 的 workflow calls 預設啟用，而手動 `Install Smoke` dispatches 可以選擇加入。一般 PR CI 仍會針對 Node 相關變更執行快速 Bun launcher regression 通道。QR 與安裝程式 Docker 測試保留各自著重安裝的 Dockerfiles。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共享 live-test 映像，將 OpenClaw 打包一次為 npm tarball，並建置兩個共享的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/update/外掛相依性通道的裸 Node/Git runner；
- 會將同一個 tarball 安裝到 `/app`、用於一般功能通道的功能性映像。

Docker 通道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行所選 plan。排程器會用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個通道選擇映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行通道。

### 可調項目

| 變數                                   | 預設值 | 用途                                                                                          |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | 一般通道的主池 slot 數量。                                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | provider-sensitive tail-pool slot 數量。                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | 並行 live 通道上限，避免 provider 節流。                                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5      | 並行 npm 安裝通道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | 並行 multi-service 通道上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | 通道啟動之間的錯開時間，以避免 Docker daemon create storms；設為 `0` 表示不錯開。             |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每通道 fallback timeout（120 分鐘）；所選 live/tail 通道會使用更嚴格的上限。                  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` 會列印排程器 plan，而不執行通道。                                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | 逗號分隔的精確通道清單；略過 cleanup smoke，讓 agent 可重現單一失敗通道。                    |

比有效上限更重的通道仍可從空池啟動，然後單獨執行直到釋放容量。本機彙總會預先檢查 Docker、移除過時 OpenClaw E2E 容器、發出 active-lane 狀態、持久化通道計時以便 longest-first 排序，並且預設在第一次失敗後停止排程新的 pooled 通道。

### 可重用 live/E2E workflow

可重用 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、通道與憑證涵蓋範圍。接著 `scripts/docker-e2e.mjs` 會將該 plan 轉換為 GitHub outputs 與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball inventory；在 plan 需要 package-installed 通道時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件摘要標記的裸/功能性 GHCR Docker E2E 映像；並且重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` inputs 或現有的 package-digest 映像，而不是重新建置。Docker 映像拉取會使用有界的每次嘗試 180 秒 timeout 重新嘗試，讓卡住的 registry/cache stream 可以快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發布路徑分塊

Release Docker 涵蓋範圍會以較小的 chunked jobs 執行，並使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個 chunk 只拉取所需的映像種類，並透過同一個加權排程器執行多個通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的 release Docker chunks 是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`package-update-openai` 包含 live Codex 外掛套件通道，會安裝候選 OpenClaw 套件，從 `codex_plugin_spec` 或同 ref tarball 安裝 Codex 外掛並明確核准 Codex 命令列介面安裝，執行 Codex 命令列介面 preflight，然後針對 OpenAI 執行多個同 session 的 OpenClaw agent turns。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍是彙總的外掛/執行階段別名。`install-e2e` 通道別名仍是兩個 provider installer 通道的彙總手動重新執行別名。

OpenWebUI 會在完整發行路徑涵蓋範圍要求時併入 `plugins-runtime-services`，且只會在僅限 OpenWebUI 的分派中保留獨立的 `openwebui` 區塊。捆綁通道更新通道會針對暫時性 npm 網路失敗重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含通道記錄、時間統計、`summary.json`、`failures.json`、階段時間、排程器計畫 JSON、慢速通道表格，以及每個通道的重新執行命令。工作流程的 `docker_lanes` 輸入會針對已準備的映像執行選定通道，而不是區塊作業，這會將失敗通道的偵錯限制在一個目標 Docker 作業內，並為該次執行準備、下載或重用套件成品；如果選定通道是即時 Docker 通道，目標作業會在本機建置即時測試映像以供該次重新執行使用。產生的每通道 GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備映像輸入，因此失敗通道可以重用失敗執行中的確切套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的即時/E2E 工作流程每天執行完整發行路徑 Docker 套件。

## 外掛預發行

`Plugin Prerelease` 是成本較高的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確操作員分派的獨立工作流程。一般 pull request、`main` 推送和獨立手動 CI 分派都不會啟用該套件。它會在八個擴充功能工作器之間平衡捆綁外掛測試；這些擴充功能分片作業一次最多執行兩個外掛設定群組，每個群組使用一個 Vitest 工作器和較大的節點堆積，讓匯入密集的外掛批次不會產生額外 CI 作業。僅限發行的 Docker 預發行路徑（由 `full_release_validation` 輸入啟用）會以四個為一組批次處理目標 Docker 通道，以避免為一到三分鐘的作業保留數十個執行器。該工作流程也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` 成品；檢查器發現項目是分診輸入，不會變更阻擋性的外掛預發行閘門。

## QA Lab

QA Lab 在主要智慧範圍工作流程之外有專用 CI 通道。代理同等性巢狀位於廣泛的 QA 與發行測試框架之下，而不是獨立的 PR 工作流程。當同等性應隨廣泛驗證執行一起進行時，請使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程每晚在 `main` 上以及手動分派時執行；它會將模擬同等性通道、即時 Matrix 通道，以及即時 Telegram 和 Discord 通道展開為平行作業。即時作業使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex 租約。

發行檢查會使用確定性的模擬提供者和符合模擬條件的模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram 即時傳輸通道，因此通道合約會與即時模型延遲和一般提供者外掛啟動隔離。即時傳輸閘道會停用記憶搜尋，因為 QA 同等性會另外涵蓋記憶行為；提供者連線能力則由獨立的即時模型、原生提供者和 Docker 提供者套件涵蓋。

Matrix 會針對排程和發行閘門使用 `--profile fast`，只在已簽出的命令列介面支援時加入 `--fail-fast`。命令列介面預設值和手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 分派一律會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab 通道；其 QA 同等性閘門會將候選與基準套件作為平行通道作業執行，然後將兩個成品下載到小型報告作業中，以進行最終同等性比較。

對於一般 PR，請遵循具範圍的 CI/檢查證據，而不是將同等性視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意是狹窄的第一輪安全掃描器，而不是完整儲存庫掃描。每日、手動、`main` 推送和非草稿 pull request 防護執行會掃描 Actions 工作流程程式碼，以及最高風險的 JavaScript/TypeScript 表面，並使用高信心安全查詢，篩選為高/嚴重 `security-severity`。

pull request 防護保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`，或擁有程序的捆綁外掛執行階段路徑下有變更時啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 和 macOS CodeQL 不包含在 PR 預設值中。

### 安全類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認證、秘密、沙箱、排程和閘道基準                                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，加上通道外掛執行階段、閘道、外掛 SDK、秘密、稽核接觸點                                                           |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 剖析、網路防護、網頁擷取和外掛 SDK SSRF 政策表面                                                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助程式、對外傳遞和代理工具執行閘門                                                                            |
| `/codeql-security-high/process-exec-boundary`     | 本機 shell、程序產生輔助程式、擁有子程序的捆綁外掛執行階段，以及工作流程指令碼黏合                                                |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、資訊清單、登錄、套件管理器安裝、來源載入，以及外掛 SDK 套件合約信任表面                                          |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。為 CodeQL 在工作流程健全性接受的最小 Blacksmith Linux 執行器上手動建置 Android 應用程式。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式，從上傳的 SARIF 中篩除相依項建置結果，並上傳至 `/codeql-critical-security/macos`。由於即使在乾淨狀態下 macOS 建置也主導執行時間，因此保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它只會在 GitHub 託管的 Linux 執行器上，針對狹窄的高價值表面執行錯誤嚴重性、非安全的 JavaScript/TypeScript 品質查詢，因此品質掃描不會消耗 Blacksmith 執行器註冊預算。其 pull request 防護刻意比排程設定檔更小：非草稿 PR 只會針對其觸及的表面，從十三個可由 PR 路由的分片中執行對應分片 — `agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 和 `session-diagnostics-boundary`。`ui-control-plane` 和 `web-media-runtime-boundary` 不包含在 PR 執行中。CodeQL 設定與品質工作流程變更會執行完整 PR 分片集（網路執行階段分片會依據其自身的 CodeQL 設定檔和擁有網路的來源路徑觸發）。

手動分派接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用於單獨執行一個品質分片的教學/迭代掛鉤。

| 類別                                                    | 介面                                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、密鑰、沙箱、排程和閘道安全邊界程式碼                                                                                                                       |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化和 IO 合約                                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道通訊協定結構描述和伺服器方法合約                                                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道和內建通道外掛實作合約                                                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器和工具橋接、程序監督輔助程式，以及對外傳遞合約                                                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段門面、記憶體外掛 SDK 別名、記憶體執行階段啟用黏合層，以及記憶體 doctor 命令                                                     |
| `/codeql-critical-quality/network-runtime-boundary`     | 網路政策套件、原始 socket 和 proxy-capture 執行階段、SSH 通道、閘道鎖、JSONL socket，以及推送傳輸介面                                                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞輔助程式、診斷事件/日誌套件介面，以及工作階段 doctor 命令列介面合約                                      |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 入站回覆分派、回覆酬載/分塊/執行階段輔助程式、通道回覆選項、傳遞佇列，以及工作階段/執行緒繫結輔助程式                                                |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值/目錄，以及 web/search/fetch/embedding 登錄檔                                               |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、閘道控制流程，以及任務控制平面執行階段合約                                                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取/搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                                                        |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄檔、公開介面，以及外掛 SDK 進入點合約                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端外掛 SDK 原始碼和外掛套件合約輔助程式                                                                                                               |

品質與安全性保持分離，讓品質發現可以排程、衡量、停用或擴充，而不會模糊安全性訊號。Swift、Python 和內建外掛 CodeQL 擴充應只在窄範圍設定檔具備穩定的執行階段與訊號之後，才作為有範圍或分片的後續工作加回來。

## 維護工作流程

### 文件代理

`Docs Agent` 工作流程是事件驅動的 Codex 維護通道，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非機器人推送 CI 執行可以觸發它，手動分派也可以直接執行它。當 `main` 已經前進，或上一小時內已建立另一個未略過的 Docs Agent 執行時，workflow-run 呼叫會略過。執行時，它會檢閱從前一個未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### 測試效能代理

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護通道，用於處理緩慢測試。它沒有純排程：`main` 上成功的非機器人推送 CI 執行可以觸發它，但如果另一個 workflow-run 呼叫在該 UTC 日已經執行或正在執行，它會略過。手動分派會繞過該每日活動閘門。此通道會建立全套件分組的 Vitest 效能報告，讓 Codex 只進行保留覆蓋率的小型測試效能修正，而不是大範圍重構，接著重新執行全套件報告，並拒絕會降低通過基準測試數量的變更。分組報告會記錄 Linux 和 macOS 上每個設定的牆鐘時間與最大 RSS，因此前後比較會在持續時間差異旁呈現測試記憶體差異。如果基準有失敗的測試，Codex 只能修正明顯的失敗，而且代理後的全套件報告必須通過，才會提交任何內容。當 `main` 在機器人推送落地前前進時，此通道會 rebase 已驗證的修補、重新執行 `pnpm check:changed`，並重試推送；有衝突的過期修補會被略過。它使用 GitHub 託管的 Ubuntu，讓 Codex action 可以維持與文件代理相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是手動維護者工作流程，用於落地後清理重複項。它預設為 dry-run，且只在 `apply=true` 時關閉明確列出的 PR。在修改 GitHub 之前，它會驗證已落地的 PR 已合併，且每個重複項都有共用的參照議題或重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求比廣泛 CI 平台範圍更嚴格：

- 核心生產變更會執行核心 prod 和核心 test 型別檢查，加上核心 lint/guards；
- 核心僅測試變更只會執行核心 test 型別檢查，加上核心 lint；
- 擴充生產變更會執行擴充 prod 和擴充 test 型別檢查，加上擴充 lint；
- 擴充僅測試變更會執行擴充 test 型別檢查，加上擴充 lint；
- 公開外掛 SDK 或外掛合約變更會擴展到擴充型別檢查，因為擴充依賴那些核心合約（Vitest 擴充掃描仍然是明確測試工作）；
- 僅 release metadata 的版本遞增會執行目標式版本/設定/root-dependency 檢查；
- 未知 root/設定變更會 fail safe 到所有檢查通道。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，原始碼編輯優先使用明確對應，接著是 sibling 測試與 import-graph 相依項。共用群組聊天室傳遞設定是其中一個明確對應：對群組可見回覆設定、來源回覆傳遞模式或 message-tool 系統提示的變更，會經由核心回覆測試加上 Discord 和 Slack 傳遞迴歸測試路由，因此共用預設值變更會在第一次 PR 推送前失敗。只有當變更的範圍足以涵蓋整個 harness，使便宜的對應集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是 repo 擁有的遠端盒裝 wrapper，用於維護者 Linux 證明。代理工作階段預設使用它進行測試與計算密集型工作，包括建置、型別檢查、lint fan-out、Docker、套件通道、E2E、即時證明和 CI 對等性。受信任的維護者程式碼預設使用 `blacksmith-testbox`，且 `.crabbox.yaml` 現在也預設為它。其設定的工作流程會注入提供者和代理認證，因此不受信任的貢獻者或 fork 程式碼必須改用無密鑰 fork CI 或經過消毒的 direct AWS Crabbox。經過消毒的 AWS 執行會設定 `CRABBOX_ENV_ALLOW=CI`、傳遞 `--no-hydrate`，並使用全新的暫時遠端 `HOME`；這會防止 repo 的 `OPENCLAW_*` allowlist 和既有驗證設定檔觸及不受信任的程式碼。它們使用專供該不受信任來源的新 warmed lease，絕不使用受信任或先前已 hydrate 的 lease。從乾淨受信任的 `main` checkout 啟動已安裝且受信任的 Crabbox binary，並只使用 `--fresh-pr` 擷取遠端 PR；絕不要在本機執行不受信任 checkout 的 wrapper 或設定。Unset `CRABBOX_AWS_INSTANCE_PROFILE`，並 fail closed，除非解析出的 `aws.instanceProfile` 為空。在任何安裝/測試前，使用受信任的絕對路徑工具要求 IMDSv2 token、證明 IAM credentials endpoint 回傳 404，並將遠端 `git rev-parse HEAD` 與完整已檢閱 PR head SHA 比對。將 lease 繫結到該 SHA，並在 head 變更時停止/重新 warm。從乾淨的 `main` 上傳受信任的 `scripts/crabbox-untrusted-bootstrap.sh`，並搭配 `--fresh-pr`；它會安裝釘選的 Node/pnpm、驗證 SHA 和 package-manager pin、隔離 `HOME`、安裝相依項，然後執行要求的測試。
Unset 所有 `CRABBOX_TAILSCALE*` 覆寫、強制 `--network public --tailscale=false`、清除 exit-node/LAN 旗標，並在上傳任何 script 前要求 `crabbox inspect` 回報 public networking 且沒有 Tailscale 狀態。
自有 AWS/Hetzner 容量也仍然是 Blacksmith 中斷、配額問題或明確自有容量測試的 fallback。

在可能需要測試或重型證明的受信任程式碼任務開始時，代理應立即在背景命令工作階段 pre-warm，於 hydration 執行期間繼續檢查與編輯，重用回傳的 `tbx_...` id，每次執行都同步目前 checkout，並在交接前停止它：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Crabbox 支援的 Blacksmith 執行會 warm、claim、sync、run、report，並清理一次性 Testboxes。內建 sync sanity check 會在 synced box 上的 `git status --short` 顯示至少 200 個 tracked deletions 時快速失敗，這能抓到像 `pnpm-lock.yaml` 這類消失的根檔案。對於有意的大量刪除 PR，請為遠端命令設定 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

Crabbox 也會終止在 sync 階段停留超過五分鐘且沒有 post-sync 輸出的本機 Blacksmith 命令列介面呼叫。設定 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該 guard，或針對異常大的本機 diff 使用較大的毫秒值。

第一次執行前，請從 repo root 檢查 wrapper：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper 會拒絕未宣告所選 provider 的過期 Crabbox binary，而 Blacksmith 支援的執行需要 Crabbox 0.22.0 或更新版本，讓 wrapper 取得目前的 Testbox sync、queue 和 cleanup 行為。在 Codex worktree 或 linked/sparse checkout 中，避免使用本機 `pnpm crabbox:run` script，因為 pnpm 可能會在 Crabbox 啟動前 reconcile 相依項；請改為直接呼叫 node wrapper：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用 sibling checkout 時，請在計時或證明工作前重建被忽略的本機 binary：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` 中的 `blacksmith:` 區塊已經固定 org、workflow、job 和 ref 的預設值，因此下方的明確旗標是選用的。變更閘門：

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

重新執行聚焦測試：

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

讀取最終 JSON 摘要。有用的欄位是 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。對於委派的
Blacksmith Testbox 執行，Crabbox 包裝器結束碼和 JSON 摘要就是
命令結果。連結的 GitHub Actions 執行負責水合與 keepalive；當 SSH
命令已經回傳後，Testbox 從外部停止時，它可能會以 `cancelled` 結束。
除非包裝器的 `exitCode` 非零，或命令輸出顯示測試失敗，否則請將其視為清理/狀態成品。
由 Blacksmith 支援的一次性 Crabbox 執行應該會自動停止 Testbox；
如果執行被中斷或清理狀態不明，請檢查即時 box，且只停止你建立的 box：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要在同一個已水合的 box 上執行多個命令時，才使用重用：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

重複使用租約，而不是過期的原始碼。省略 `--no-sync`，讓每次執行都上傳
目前的 checkout；只有在刻意重新執行未變更且已同步的樹時才使用它。
不受信任的貢獻者/分支程式碼必須使用
`CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate`，並為每個命令使用全新的
暫時遠端 `HOME`；測試前在該已清理的命令內安裝相依套件。只重複使用專門為
相同不受信任來源新預熱的租約；絕不可使用受信任或先前已 hydrate 的租約。絕不要在本機執行不受信任 checkout 的 wrapper 或設定：從乾淨且受信任的 `main` 啟動已安裝的
受信任 Crabbox binary，並在每次執行時傳入 `--fresh-pr`。保持
`CRABBOX_AWS_INSTANCE_PROFILE` 未設定，拒絕非空的已解析 instance profile，
要求受信任遠端 IMDS 無角色證明，並在 install/test 前驗證已審查的 head SHA。
將租約繫結到該 SHA；任何 head 變更後都停止並重新預熱。如果沒有遠端 PR，請使用無密鑰的 fork CI。
絕不要為不受信任來源選擇 `hydrate-github` 或 credential-hydrated Blacksmith 工作流程。

如果 Crabbox 是壞掉的層，但 Blacksmith 本身可用，則只將直接使用
Blacksmith 用於 `list`、`status` 和清理等診斷。在將直接 Blacksmith 執行視為維護者證明之前，
先修好 Crabbox 路徑。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的
warmup 在幾分鐘後仍停在 `queued`，且沒有 IP 或 Actions run URL，請將其視為 Blacksmith provider、
queue、billing 或 org-limit 壓力。停止你建立的 queued id，避免啟動更多 Testbox，
並在有人檢查 Blacksmith dashboard、billing 和 org limits 時，將證明移到下方的
自有 Crabbox 容量路徑。

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確目標是自有容量時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務確實需要 48xlarge 等級的 CPU，否則避免使用 `class=beast`。`beast` 請求從 192 vCPU 開始，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額的方式。repo 自有的 `.crabbox.yaml` 預設為 `class: standard`、on-demand market，以及 `capacity.hints: true`，因此 brokered AWS 租約會列印所選 region/market、quota pressure、Spot fallback，以及 high-pressure class 警告。較重的大範圍檢查使用 `fast`，只有在 standard/fast 不足時才使用 `large`，而 `beast` 只用於例外的 CPU-bound lanes，例如 full-suite 或 all-plugin Docker matrices、明確的 release/blocker validation，或 high-core performance profiling。不要將 `beast` 用於 `pnpm check:changed`、focused tests、docs-only work、一般 lint/typecheck、小型 E2E repro，或 Blacksmith outage triage。容量診斷使用 `--market on-demand`，避免將 Spot market churn 混入訊號。

`.crabbox.yaml` 擁有 provider、sync 和 GitHub Actions hydration 預設值。Crabbox sync 永遠不會傳輸 `.git`，因此 hydrated Actions checkout 會保留自己的遠端 Git metadata，而不是同步維護者本機的 remotes 和 object stores；repo 設定也另外排除了不應傳輸的本機 runtime/build artifacts（例如 `.artifacts` 和 test reports）。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、節點/pnpm 設定、`origin/main` fetch，以及 owned-cloud `crabbox run --id <cbx_id>` 命令的非秘密環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
