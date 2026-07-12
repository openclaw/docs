---
read_when:
    - 你需要了解 CI 工作為何有執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次發布驗證執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送功能
summary: CI 工作流程圖、範圍閘門、發布整合流程，以及對應的本機命令
title: CI 管線
x-i18n:
    generated_at: "2026-07-12T14:20:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8ff447c56fabf3148d4368567c2365e6940f00aded8b7212ae3d232a777d92a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在推送至 `main` 時執行（Markdown 與 `docs/**` 路徑會在觸發階段被忽略）、在非草稿提取要求時執行（僅含 CHANGELOG 的差異會被忽略），以及在手動分派時執行。標準 `main` 推送會先經過 90 秒的託管執行器准入等待期；當有較新的提交進入時，`CI` 並行群組會取消該等待中的執行，因此依序合併不會各自登記完整的 Blacksmith 矩陣。提取要求與手動分派會略過等待。接著，`preflight` 作業會分類差異，並在僅有不相關區域發生變更時停用耗費資源的執行管線。手動 `workflow_dispatch` 執行會刻意略過智慧範圍判定，並展開完整的執行圖，以用於候選版本與廣泛驗證。Android 執行管線仍須透過 `include_android`（或 `release_gate` 輸入）選擇啟用。僅限發行版的外掛涵蓋範圍位於獨立的 [`Plugin Prerelease`](#plugin-prerelease) 工作流程中，而且只會從 [`Full Release Validation`](#full-release-validation) 或明確的手動分派執行。

## 管線概覽

| 工作                               | 用途                                                                                                                                                                                                                  | 執行時機                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `preflight`                        | 偵測僅文件的變更、變更的範圍、變更的擴充功能，並建立 CI 資訊清單                                                                                                                                                      | 非草稿推送和 PR 一律執行                              |
| `runner-admission`                 | 在註冊 Blacksmith 工作前，對標準 `main` 推送執行由託管執行器負責的 90 秒防彈跳                                                                                                                                        | 每次 CI 執行；僅標準 `main` 推送會暫停                |
| `security-fast`                    | 偵測私密金鑰、透過 `zizmor` 稽核已變更的工作流程，以及稽核正式環境鎖定檔                                                                                                                                               | 非草稿推送和 PR 一律執行                              |
| `pnpm-store-warmup`                | 預熱由鎖定檔固定版本的 pnpm 儲存區快取，且不阻塞 Linux Node 分片                                                                                                                                                       | 選取 Node 或文件檢查通道時                            |
| `build-artifacts`                  | 建置 `dist/`、Control UI、執行已建置命令列介面的冒煙檢查、啟動記憶體檢查，以及內嵌建置成品檢查                                                                                                                        | 有 Node 相關變更時                                    |
| `control-ui-i18n`                  | 驗證產生的 Control UI 語系套件、詮釋資料和翻譯記憶；自動執行時僅提供建議，手動發布 CI 時則會阻擋                                                                                                                       | 有 Control UI i18n 相關變更及手動 CI 時               |
| `checks-fast-core`                 | 快速 Linux 正確性通道：內建項目與通訊協定、Bun 啟動器，以及 CI 路由快速任務                                                                                                                                            | 有 Node 相關變更時                                    |
| `qa-smoke-ci-profile`              | 有界自動 QA 冒煙測試代表性集合中，兩個各自完備且平衡的部分；完整分類涵蓋仍可透過明確的 QA 設定檔取得                                                                                                                    | 有 Node 相關變更時                                    |
| `checks-fast-contracts-plugins-*`  | 兩個加權的外掛契約分片                                                                                                                                                                                                | 有 Node 相關變更時                                    |
| `checks-fast-contracts-channels-*` | 兩個加權的頻道契約分片                                                                                                                                                                                                | 有 Node 相關變更時                                    |
| `checks-node-*`                    | 核心 Node 測試分片，不含頻道、內建項目、契約和擴充功能通道                                                                                                                                                            | 有 Node 相關變更時                                    |
| `check-*`                          | 分片的主要本機閘門等效項目：防護檢查、shrinkwrap、內建頻道設定詮釋資料、正式環境型別、程式碼檢查、相依套件、測試型別                                                                                                    | 有 Node 相關變更時                                    |
| `check-additional-*`               | 邊界檢查分帶（包括提示詞快照漂移）、工作階段存取器／逐字稿讀取器／SQLite 交易邊界、擴充功能程式碼檢查群組、套件邊界編譯／金絲雀測試，以及執行階段拓撲架構                                                                | 有 Node 相關變更時                                    |
| `checks-node-compat-node22`        | Node 22 相容性建置和冒煙測試通道                                                                                                                                                                                       | 發布時手動分派 CI                                     |
| `check-docs`                       | 文件格式、程式碼檢查和失效連結檢查                                                                                                                                                                                    | 文件有變更時（PR 和手動分派）                         |
| `native-i18n`                      | 原生應用程式、Android 和 Apple 的 i18n 清查檢查                                                                                                                                                                       | 有原生 i18n 相關變更時                                |
| `skills-python`                    | 對 Python 支援的 Skills 執行 Ruff + pytest                                                                                                                                                                            | 有 Python Skills 相關變更時                           |
| `checks-windows`                   | Windows 專用的程序／路徑測試，以及共用執行階段匯入指定項回歸測試                                                                                                                                                      | 有 Windows 相關變更時                                 |
| `macos-node`                       | 聚焦的 macOS TypeScript 測試：launchd、Homebrew、執行階段路徑、封裝指令碼、程序群組包裝器                                                                                                                             | 有 macOS 相關變更時                                   |
| `macos-swift`                      | macOS 應用程式的 Swift 程式碼檢查、建置和測試                                                                                                                                                                         | 有 macOS 相關變更時                                   |
| `ios-build`                        | 產生 Xcode 專案並建置 iOS 應用程式模擬器版本                                                                                                                                                                          | iOS 應用程式、共用應用程式套件或 Swabble 有變更時     |
| `android`                          | 兩種變體的 Android 單元測試，另加一次偵錯 APK 建置                                                                                                                                                                    | 有 Android 相關變更時                                 |
| `test-performance-agent`           | 獨立工作流程：在受信任活動後，每日執行 Codex 慢速測試最佳化                                                                                                                                                           | 主要 CI 成功或手動分派時                              |
| `openclaw-performance`             | 獨立工作流程：每日／隨選產生 Kova 執行階段效能報告，包含模擬提供者、深度分析和 GPT 5.6 即時通道                                                                                                                        | 排程和手動分派時                                      |

## 快速失敗順序

1. `runner-admission` 僅等待標準的 `main` 推送；較新的推送會在 Blacksmith 註冊前取消該次執行。
2. `preflight` 決定哪些執行管道會存在。`docs-scope` 和 `changed-scope` 邏輯是此工作內的步驟，而非獨立工作。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不必等待較繁重的成品與平台矩陣工作。
4. `build-artifacts` 和諮詢性質的 `control-ui-i18n` 檢查會與快速 Linux 執行管道重疊執行。產生的語系漂移會維持可見，同時獨立的重新整理工作流程會在背景修復它。
5. 接著會展開較繁重的平台與執行階段管道：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。

當較新的推送送達同一個 PR 或 `main` 參照時，GitHub 可能會將已被取代的工作標示為 `cancelled`。除非相同參照的最新執行也失敗，否則請將其視為 CI 雜訊。矩陣工作使用 `fail-fast: false`，而 `build-artifacts` 會直接回報內嵌的頻道、核心支援邊界及閘道監看失敗，而不會將微型驗證工作排入佇列。自動 CI 並行處理鍵具有版本編號（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍工作無法無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。外掛清單啟動記憶體防護在自行託管的 Blacksmith Linux 上維持 350 MiB 上限，並在 GitHub 託管的 Linux 上允許 425 MiB，因為對於相同的已建置命令列介面，後者的 RSS 基準較高。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>`，彙整 GitHub Actions 的實際經過時間、佇列時間、最慢工作、失敗項目，以及 `pnpm-store-warmup` 扇出屏障。工作流程內的 `ci-timings-summary` 工作存在於 `ci.yml` 中，但目前已停用（`if: false`）；請改為在本機執行計時輔助工具。若要查看建置計時，請檢查 `build-artifacts` 工作的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會列印 `[build-all] phase timings:` 並包含 `ui:build`；該工作也會上傳 `startup-memory` 成品。

## PR 背景資訊與證據

外部貢獻者的 PR 會執行來自
`.github/workflows/real-behavior-proof.yml` 的 PR 背景資訊與證據閘門。此工作流程會簽出
受信任的工作流程修訂版本（`github.workflow_sha`），且僅評估 PR 內文；
它不會執行貢獻者分支中的程式碼。

此閘門適用於並非儲存庫擁有者、成員、協作者或機器人的 PR 作者。當 PR 本文包含作者撰寫的 `What Problem This Solves` 與 `Evidence` 章節時，檢查即會通過。證據可以是聚焦測試、CI 結果、螢幕截圖、錄影、終端機輸出、即時觀察、經遮蔽處理的日誌或成品連結。本文用於提供意圖與實用的驗證資訊；審查者會檢查程式碼、測試與 CI，以評估正確性。

檢查失敗時，請更新 PR 本文，而不是再推送一個程式碼提交。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動分派會略過變更範圍偵測，讓預檢資訊清單如同每個受範圍控管的區域皆有變更般運作。

- **CI 工作流程編輯**會驗證 Node CI 圖、工作流程 lint，以及 Windows 執行路徑（由 `ci.yml` 執行），但其本身不會強制執行 iOS、Android 或 macOS 原生建置；這些平台執行路徑仍只針對平台原始碼變更。
- **工作流程健全性檢查**會對所有工作流程 YAML 檔案執行 `actionlint`、`zizmor`，以及複合動作插值防護與衝突標記防護。PR 範圍的 `security-fast` 工作也會對變更過的工作流程檔案執行 `zizmor`，讓工作流程安全性問題能在主要 CI 圖中提早導致失敗。
- **推送至 `main` 時的文件**會由獨立的 `Docs` 工作流程檢查，並使用與 CI 相同的 ClawHub 文件鏡像，因此混合程式碼與文件的推送不會同時將 CI 的 `check-docs` 分片加入佇列。當文件有變更時，提取要求與手動 CI 仍會從 CI 執行 `check-docs`。
- **終端介面 PTY**會在 `checks-node-core-runtime-tui-pty` Linux Node 分片中針對終端介面變更執行。此分片會以 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋確定性的 `TuiBackend` 固定資料執行路徑，以及只模擬外部模型端點、速度較慢的 `tui --local` 煙霧測試。
- **僅變更 CI 路由、快速工作直接執行的一小組核心測試固定資料，以及範圍狹窄的外掛合約輔助程式**時，會使用快速的僅限 Node 資訊清單路徑：`preflight`、`security-fast`，以及該變更所觸及的快速執行路徑——單一 `checks-fast-core` CI 路由工作、兩個外掛合約分片，或兩者皆執行。此路徑會略過建置成品、Node 22 相容性、頻道合約、完整核心分片、內建外掛分片與其他防護矩陣。
- **Windows Node 檢查**的範圍限於 Windows 特定的處理程序／路徑包裝函式、npm/pnpm/UI 執行器輔助程式、套件管理器設定，以及執行該路徑的 CI 工作流程介面；不相關的原始碼、外掛、安裝煙霧測試與僅測試變更，仍留在 Linux Node 執行路徑。

最慢的 Node 測試系列會加以拆分或平衡，讓每個工作維持精簡，同時避免預留過多執行器：

- 外掛合約與頻道合約各自以兩個加權、由 Blacksmith 支援的分片執行，並以標準 GitHub 執行器作為備援。
- 核心單元快速／支援執行路徑會分開執行；核心執行階段基礎設施則拆分為處理程序、共用、鉤子、機密資料，以及三個排程領域分片。
- 自動回覆會以平衡的工作處理程序執行，回覆子樹則拆分為代理執行器、命令、分派、工作階段與狀態路由分片。
- 代理式閘道／伺服器（控制平面）設定會拆分為聊天、驗證、模型、HTTP／外掛、執行階段與啟動執行路徑，而非等待建置成品。
- 一般 CI 僅會將隔離的基礎設施包含模式分片封裝成確定性套組，每組最多 64 個測試檔案，以縮減 Node 矩陣，同時不合併非隔離的命令／排程、具狀態的代理核心或閘道／伺服器測試套件。固定的重型測試套件仍使用 8 vCPU，而封裝後及權重較低的執行路徑則使用 4 vCPU。
- 標準儲存庫上的提取要求會使用精簡的准入計畫：相同的各設定群組會在隔離的子處理程序中執行，目前為 19 個 Node 測試工作，而非完整矩陣的 74 個工作。單一完整設定批次會分散至現有、使用相同執行器的精簡工作中，同時保留其 120 分鐘逾時；序列工具設定則會分散至三個僅限 PR 的群組；推送至 `main`、手動分派及發布閘門仍會保留完整矩陣。
- 廣泛的瀏覽器、QA、媒體與其他外掛測試會使用其專用 Vitest 設定，而非共用的外掛統包設定。包含模式分片會使用 CI 分片名稱記錄計時項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分完整設定與經篩選的分片。
- `check-additional-*` 會將補充邊界防護清單（`scripts/run-additional-boundary-checks.mjs`）分散為一個提示詞密集的分片（`check-additional-boundaries-a`，其中包含 Codex 提示詞快照漂移檢查），以及一個涵蓋其餘分區的合併分片（`check-additional-boundaries-bcd`）；每個分片都會並行執行獨立防護，並列印各項檢查的計時。套件邊界編譯／金絲雀作業會維持在一起，而執行階段拓撲架構則與嵌入 `build-artifacts` 的閘道監看涵蓋範圍分開執行。
- 在 `dist/` 與 `dist-runtime/` 已完成建置後，閘道監看、頻道測試與核心支援邊界分片會在 `build-artifacts` 內並行執行。

准入後，標準 Linux CI 最多允許同時執行 28 個 Node 測試工作，
較小型的快速／檢查執行路徑則最多 12 個；Windows 與 Android 維持為兩個，因為
這些執行器集區較為有限。精簡的完整設定批次採用
120 分鐘的批次逾時，而包含模式群組則共用相同的受限
工作預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，接著建置 Play 偵錯 APK。第三方變體沒有獨立的原始碼集或資訊清單；其單元測試執行路徑仍會以 SMS／通話記錄 BuildConfig 旗標編譯該變體，同時避免在每次與 Android 相關的推送中重複執行偵錯 APK 封裝工作。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（僅針對生產環境相依套件的 Knip 檢查，固定使用精確的 Knip 版本，且 `dlx` 安裝停用 pnpm 的最低發布時間限制）與 `pnpm deadcode:unused-files`；後者會將 Knip 的生產環境未使用檔案發現項目與 `scripts/deadcode-unused-files.allowlist.mjs` 比較，另有建議性質的 `pnpm deadcode:report:ci:ts-unused` 報告會以 `deadcode-reports` 成品名稱上傳。當 PR 新增未經審查的未使用檔案，或留下過時的允許清單項目時，未使用檔案防護會失敗；同時保留 Knip 無法靜態解析、但刻意存在的動態外掛、產生內容、建置、即時測試與套件橋接介面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是將 OpenClaw 儲存庫活動傳入 ClawSweeper 的目標端橋接工作流程。它不會簽出或執行不受信任的提取要求程式碼。此工作流程會使用 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App 權杖，接著將精簡的 `repository_dispatch` 承載資料分派至 `openclaw/clawsweeper`。

此工作流程有四條執行路徑：

- `clawsweeper_item` 用於特定議題與提取要求的審查請求；
- `clawsweeper_comment` 用於議題留言中的明確 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於推送至 `main` 時的提交層級審查請求；
- `github_activity` 用於 ClawSweeper 代理可能檢查的一般 GitHub 活動。

`github_activity` 執行路徑只會轉送標準化中繼資料：事件類型、動作、執行者、儲存庫、項目編號、URL、標題、狀態，以及存在留言或審查時的簡短摘錄。它刻意避免轉送完整的網路鉤子本文。`openclaw/clawsweeper` 中的接收工作流程為 `.github/workflows/github-activity.yml`，會將標準化事件傳送至供 ClawSweeper 代理使用的 OpenClaw 閘道鉤子。

一般活動僅供觀察，預設不會傳送。ClawSweeper 代理會在其提示詞中收到 Discord 目標，且僅應在事件出乎預期、可採取行動、具有風險或對營運有用時，才發佈至 `#clawsweeper`。例行開啟、編輯、機器人雜訊、重複的網路鉤子雜訊與正常審查流量應產生 `NO_REPLY`。

在此整條路徑中，請將 GitHub 標題、留言、本文、審查文字、分支名稱與提交訊息視為不受信任的資料。它們是摘要與分流的輸入，而非工作流程或代理執行階段的指示。

## 手動分派

手動 CI 分派會執行與一般 CI 相同的工作圖，但強制開啟所有非 Android 的受範圍控管執行路徑：Linux Node 分片、內建外掛分片、外掛與頻道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品煙霧測試、文件檢查、Python Skills、Windows、macOS、iOS 建置，以及 Control UI i18n。Control UI 語系一致性在自動 PR 與 `main` 執行中屬於建議性檢查，因為獨立的重新整理工作流程會在背景修復產生內容的漂移；在手動 CI 中則屬於阻擋性檢查，因此 Full Release Validation 亦會受其阻擋。獨立手動 CI 分派僅會在設定 `include_android=true` 時執行 Android（`release_gate` 輸入也會強制執行 Android）；完整發布傘狀流程則透過傳入 `include_android=true` 來啟用 Android。外掛預發布靜態檢查、僅限發布的 `agentic-plugins` 分片、完整擴充功能批次掃描，以及外掛預發布 Docker 執行路徑，皆不包含在 CI 中。Docker 預發布測試套件只會在 `Full Release Validation` 以啟用發布驗證閘門的方式分派獨立的 `Plugin Prerelease` 工作流程時執行。

手動執行會使用唯一的並行群組，因此候選發布版本的完整測試套件不會被相同參照上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫端針對分支、標籤或完整提交 SHA 執行該工作圖，同時使用所選分派參照中的工作流程檔案。`release_gate` 輸入是供維護者在 PR CI 因容量而停滯時使用的精確 SHA 備援機制：它要求 `target_ref` 必須是與分派分支頂端相符的完整提交 SHA。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月僅限 npm 的延伸穩定版路徑是例外：請從精確的
`extended-stable/YYYY.M.33` 分支分派 `OpenClaw NPM
Release` 預檢與 `Full Release Validation`，保留其執行 ID，並將這兩個 ID 傳入
直接 npm 發布執行。請參閱[每月僅限 npm 的延伸穩定版
發布](/zh-TW/reference/RELEASING#monthly-npm-only-extended-stable-publication)，了解
相關命令、精確身分要求、登錄檔回讀與選擇器
修復程序。此路徑不會分派外掛、macOS、Windows、GitHub
Release、私有 dist-tag 或其他平台發布。

## 執行器

| 執行器                          | 工作                                                                                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動分派 CI 與非標準儲存庫的備援執行、QA Smoke 彙總、CodeQL 安全性與品質掃描、工作流程健全性檢查、標籤器、自動回覆、獨立的 Docs 工作流程，以及完整的 Install Smoke 工作流程                                                                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`pnpm-store-warmup`、`native-i18n`、除 QA Smoke CI 外的 `checks-fast-core`、外掛／頻道契約分片、大多數隨附／較輕量的 Linux 節點分片、除 `check-lint` 外的 `check-*` 執行路徑、部分 `check-additional-*` 分片、`check-docs`，以及 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的高負載 Linux 節點測試套件、著重邊界／擴充功能的 `check-additional-*` 分片，以及 `android`                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | 自動 QA Smoke CI 分片、CI 與 Testbox 中的 `build-artifacts`，以及 `check-lint`（對 CPU 足夠敏感，使用 8 vCPU 所增加的成本高於節省的成本）                                                                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；分支儲存庫則備援至 `macos-15`                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；分支儲存庫則備援至 `macos-26`                                                                                                                                                                                                                |

## 執行器註冊預算

OpenClaw 目前的 GitHub 執行器註冊配額，在 `ghx api rate_limit` 中回報為每 5 分鐘 10,000 次自託管
執行器註冊。每次調校前都要重新檢查
`actions_runner_registration`，因為 GitHub 可能會變更
這項配額。此限制由
`openclaw` 組織中的所有 Blacksmith 執行器註冊共同使用，因此新增另一個 Blacksmith 安裝並不會增加
新的配額。

將 Blacksmith 標籤視為控制突發流量的稀缺資源。僅負責
路由、通知、摘要、選擇分片或執行短時間 CodeQL 掃描的工作，除非有經過量測的 Blacksmith 特定
需求，否則應繼續使用 GitHub 託管的執行器。任何新的 Blacksmith 矩陣、更大的 `max-parallel`，或高頻率
工作流程，都必須列出其最壞情況的註冊次數，並將組織層級
目標維持在即時配額的約 60% 以下。以目前 10,000 次註冊的
配額計算，這表示作業目標為 6,000 次註冊，並為
並行儲存庫、重試及突發重疊預留空間。

標準儲存庫 CI 會繼續將 Blacksmith 作為一般推送與提取要求執行的預設執行器路徑。`workflow_dispatch` 與非標準儲存庫執行會使用 GitHub 託管的執行器，但一般標準執行目前不會探測 Blacksmith 佇列健康狀態，也不會在 Blacksmith 無法使用時自動備援至 GitHub 託管的標籤。

## 本機對應指令

```bash
pnpm changed:lanes                            # 檢查 origin/main...HEAD 的本機變更執行路徑分類器
pnpm check:changed                            # 智慧型本機檢查閘門：依邊界執行路徑檢查變更的格式／型別檢查／lint／防護
pnpm check                                    # 快速本機閘門：正式環境 tsgo + 分片 lint + 平行快速防護
pnpm check:test-types
pnpm check:timed                              # 相同閘門，包含各階段計時
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest 測試
pnpm test:changed                             # 低成本的智慧型變更 Vitest 目標
pnpm test:ui                                  # Control UI 單元／瀏覽器測試套件
pnpm ui:i18n:check                            # 產生的 Control UI 語系一致性檢查（發布閘門）
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # 文件格式 + lint + 失效連結
pnpm build                                    # 當 CI 成品／冒煙檢查很重要時建置 dist
pnpm ios:build                                # 產生並建置 iOS 應用程式專案
pnpm ci:timings                               # 摘要最新的 origin/main 推送 CI 執行
pnpm ci:timings:recent                        # 比較近期成功的 main CI 執行
node scripts/ci-run-timings.mjs <run-id>      # 摘要總耗時、佇列時間及最慢的工作
node scripts/ci-run-timings.mjs --latest-main # 忽略議題／留言雜訊，並選擇 origin/main 推送 CI
node scripts/ci-run-timings.mjs --recent 10   # 比較近期成功的 main CI 執行
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

手動分派通常會對工作流程參照進行效能基準測試。設定 `target_ref`，即可使用目前的工作流程實作，對發行標籤或其他分支進行效能基準測試。已發布報告的路徑與 latest 指標會依受測參照建立索引，而每個 `index.md` 都會記錄受測參照/SHA、工作流程參照/SHA、Kova 參照、設定檔、通道驗證模式、模型、重複次數及情境篩選條件。

此工作流程會從固定版本的發行版安裝 OCM，並依固定的 `kova_ref` 輸入從 `openclaw/Kova` 安裝 Kova，接著執行三個通道：

- `mock-provider`：使用具備確定性假 OpenAI 相容驗證的本機建置執行階段，執行 Kova 診斷情境。
- `mock-deep-profile`：針對啟動、閘道及代理程式回合熱點進行 CPU/堆積/追蹤效能分析。依排程執行，或在分派時使用 `deep_profile=true` 執行。
- `live-openai-candidate`：執行一次真實的 OpenAI `openai/gpt-5.6-luna` 代理程式回合；當 `OPENAI_API_KEY` 無法使用時略過。依排程執行，或在分派時使用 `live_openai_candidate=true` 執行。

模擬提供者執行路徑也會在 Kova 通過後執行 OpenClaw 原生原始碼探測：涵蓋預設、略過頻道、內部掛鉤與五十個外掛啟動案例的閘道啟動時間與記憶體；內建外掛匯入 RSS、重複的模擬 OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道執行的命令列介面啟動指令，以及 SQLite 狀態煙霧效能探測。若受測參照有先前發布的模擬提供者原始碼報告可用，原始碼摘要會將目前的 RSS 與堆積值和該基準比較，並將大幅增加的 RSS 標記為 `watch`。原始碼探測的 Markdown 摘要位於報告套件中的 `source/index.md`，原始 JSON 則置於其旁。

每個執行路徑都會上傳完整的 GitHub 成品，包括 CPU、堆積、追蹤與壓縮診斷套件。另一個發布工作會下載並驗證這些成品，接著鑄造一個短效期的 ClawSweeper GitHub App 權杖，其範圍僅限於 `openclaw/clawgrit-reports` 的內容，且只會將該權杖傳給 Git 推送步驟。它會將 `report.json`、`report.md`、`index.md`、原始碼探測成品，以及套件中繼資料／總和檢查碼提交至 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`；完整診斷封存檔則保留在連結的 Actions 成品中。發布者會在嘗試推送前拒絕任何超過 50 MB 的報告檔案。目前受測參照的指標為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。若應用程式權杖建立或報告發布失敗，排程執行與 `profile=release` 分派都會失敗。手動非發布分派會將發布保留為建議性質，並在驗證或發布失敗時保留 GitHub 成品。先前的原始碼基準會從公開報告儲存庫以匿名方式擷取，因此成功擷取基準並不能證明發布者驗證成功。

## 完整發布驗證

`Full Release Validation` 是用於「發布前執行所有項目」的手動傘狀工作流程。它接受分支、標籤或完整提交 SHA，使用該目標分派手動 `CI` 工作流程（包括 Android）、分派 `Plugin Prerelease` 以進行僅限發布的外掛／套件／靜態／Docker 證明、針對目標 SHA 分派 `OpenClaw Performance`，並分派 `OpenClaw Release Checks` 以進行安裝煙霧測試、套件驗收、跨作業系統套件檢查、QA Lab 一致性、Matrix 與 Telegram 執行路徑（建議性成熟度計分卡呈現可透過 `run_maturity_scorecard` 選擇啟用）。穩定版與完整設定檔一律包含詳盡的即時／E2E 與 Docker 發布路徑長時間覆蓋測試；beta 設定檔可透過 `run_release_soak=true` 選擇啟用。標準套件 Telegram E2E 會在套件驗收內執行，因此完整候選版本不會啟動重複的即時輪詢器。發布後，傳入 `release_package_spec`，即可在發布檢查、套件驗收、Docker、跨作業系統與 Telegram 中重複使用已發布的 npm 套件，而無須重新建置。僅在針對已發布套件進行 Telegram 重跑時使用 `npm_telegram_package_spec`。Codex 外掛即時套件執行路徑預設使用相同的選定狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生出 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA／成品執行則會從選定參照封裝 `extensions/codex`。若使用自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` 規格，請明確設定 `codex_plugin_spec`。

如需階段矩陣、確切的工作流程工作名稱、設定檔差異、成品與
聚焦重跑控制項，請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)。

`OpenClaw Release Publish` 是手動且會變更狀態的發布工作流程。請在發布標籤
已存在，且 OpenClaw npm 預檢成功後，從受信任的 `main` 分派
一般 beta 與穩定版發布（預檢會執行
`pnpm plugins:sync:check` 等檢查）。標籤仍會選取確切的
發布提交，包括 `release/YYYY.M.PATCH` 上的提交；Tideclaw alpha
發布則繼續使用其對應的 alpha 分支。此流程需要已儲存的
`preflight_run_id`，以及成功執行的
`full_release_validation_run_id` 和其確切的
`full_release_validation_run_attempt`；它會為所有
可發布的外掛套件分派 `Plugin NPM Release`，為相同的
發布 SHA 分派 `Plugin ClawHub Release`，之後才會分派
`OpenClaw NPM Release`。穩定版發布還需要確切的 `windows_node_tag`；
工作流程會驗證 Windows 來源版本，並在任何發布子流程開始前，
將其 x64/ARM64 安裝程式與候選版本已核准的
`windows_node_installer_digests` 輸入進行比較；接著在發布 GitHub
版本草稿前，提升並驗證相同的固定安裝程式摘要，以及確切的配套資產
與總和檢查碼契約。
僅針對外掛的集中修復使用 `plugin_publish_scope=selected`，並提供非空的
套件清單。僅外掛的 `all-publishable` 執行需要與核心發布相同的不可變 npm
預檢和完整發布驗證證據。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得固定提交證明，請使用輔助程式，而非
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程分派的 ref 必須是分支或標籤，不能是原始提交 SHA。
輔助程式會在受信任的 `main` 工作流程 SHA 上推送暫時的
`release-ci/<sha>-...` 分支，透過工作流程的 `ref` 輸入傳入要求的目標
SHA，在可用時重複使用嚴格的確切目標證據，驗證每個子工作流程的
`headSha` 均與受信任的工作流程 SHA 相符，並在執行完成後刪除暫時
分支。傳入 `-f reuse_evidence=false` 可強制執行全新驗證。如果任何子工作流程
使用不同的工作流程 SHA 執行，總括驗證器也會失敗。

`release_profile` 控制傳入發布檢查的即時／供應商涵蓋範圍。手動發布
工作流程預設為 `stable`；只有在你刻意需要廣泛的建議性供應商／媒體矩陣時，
才使用 `full`。穩定版和完整發布檢查一律執行詳盡的即時／E2E 與 Docker
發布路徑長時間測試；beta 設定檔可透過 `run_release_soak=true` 選擇加入。

- `minimum` 保留最快的 OpenAI／核心發布關鍵執行區。
- `stable` 加入穩定的供應商／後端集合。
- `full` 執行廣泛的建議性供應商／媒體矩陣。

總括流程會記錄已分派的子執行 ID，而最終的 `Verify full validation` 工作會
重新檢查目前子執行的結論，並為每個子執行附加最慢工作表。如果某個子工作流程
重新執行後轉為成功，只需重新執行父層驗證器工作，即可重新整理總括結果與時間摘要。

在復原時，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受
`rerun_group`。發布候選版本使用 `all`，僅執行一般完整 CI 子流程使用 `ci`，
僅執行外掛預發布子流程使用 `plugin-prerelease`，僅執行 OpenClaw Performance
子流程使用 `performance`，所有發布子流程使用 `release-checks`，或在總括流程上
使用範圍更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、
`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。如此可在集中修復後，將失敗的
發布機器重新執行範圍限制在必要部分。若只有一個跨作業系統執行區失敗，請將
`rerun_group=cross-os` 與 `cross_os_suite_filter` 結合使用，例如
`windows/packaged-upgrade`；耗時的跨作業系統命令會輸出心跳偵測行，而套件升級摘要
則包含各階段耗時。QA 發布檢查執行區屬於建議性質，但標準執行階段工具涵蓋範圍
閘門除外；當必要的 OpenClaw 動態工具在標準層級摘要中發生偏移或消失時，該閘門
會進行阻擋。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將選定的 ref 一次解析成
`release-package-under-test` tarball，然後將該成品傳給跨作業系統檢查與
Package Acceptance；執行長時間測試涵蓋時，也會傳給即時／E2E 發布路徑 Docker
工作流程。這可讓不同發布機器使用一致的套件位元組，並避免在多個子工作中重複封裝
相同的候選版本。對於 Codex npm 外掛即時執行區，發布檢查會傳入從
`release_package_spec` 衍生出的相符已發布外掛規格、傳入操作人員提供的
`codex_plugin_spec`，或將輸入留空，讓 Docker 指令碼封裝所選簽出中的 Codex
外掛。

針對 `ref=main` 且 `rerun_group=all` 的重複 `Full Release Validation`
執行，較新的總括流程會取代較舊的流程。父層監控器在父流程取消時，會取消所有
已分派的子工作流程，因此較新的 main 驗證不會卡在過時且耗時兩小時的發布檢查
執行之後。發布分支／標籤驗證與集中重新執行群組會維持
`cancel-in-progress: false`。

## 即時與 E2E 分片

發布即時／E2E 子流程會保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但會透過 `scripts/test-live-shard.mjs` 將其作為具名分片執行，而不是單一序列工作：

- `native-live-src-agents` 和 `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- 依供應商篩選的 `native-live-src-gateway-profiles` 工作
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的媒體音訊／視訊分片，以及依供應商篩選的音樂分片

這會維持相同的檔案涵蓋範圍，同時讓緩慢的即時供應商失敗更容易重新執行與診斷。彙總的 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動單次重新執行。

原生即時媒體分片會在由 `Live Media Runner Image` 工作流程建置的 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行。該映像已預先安裝 `ffmpeg` 和 `ffprobe`；媒體工作在設定前只會驗證這些二進位檔。請讓以 Docker 為基礎的即時測試套件在一般 Blacksmith 執行器上執行——容器工作不適合啟動巢狀 Docker 測試。

以 Docker 為基礎的即時模型／後端分片會針對每個選定提交，使用個別的共用 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 映像。即時發布工作流程只會建置並推送該映像一次，接著 Docker 即時模型、依供應商分片的閘道、命令列介面後端、ACP 繫結和 Codex 測試框架分片會使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片會在工作流程工作逾時之前，於指令碼層級設定明確的 `timeout` 上限，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個發布檢查預算。如果這些分片各自重新建置完整來源 Docker 目標，代表發布執行設定錯誤，並會因重複建置映像而浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件能否作為產品正常運作？」時，請使用 `Package Acceptance`。它與一般 CI 不同：一般 CI 驗證原始碼樹，而套件驗收則透過使用者在安裝或更新後所使用的相同 Docker E2E 測試框架，驗證單一 tarball。

### 工作

1. `resolve_package` 會簽出 `workflow_ref`、解析一個套件候選版本、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者上傳為 `package-under-test` 成品，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 和設定檔。
2. `package_integrity` 會下載 `package-under-test` 成品，並使用 `scripts/check-openclaw-package-tarball.mjs` 強制執行公開套件 tarball 契約。
3. `docker_acceptance` 會使用已解析的套件來源 SHA（若無則改用 `workflow_ref`）和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重複使用的工作流程會下載該成品、驗證 tarball 清單、視需要準備套件摘要 Docker 映像，並針對該套件執行選定的 Docker 執行區，而不是封裝工作流程簽出。當設定檔選取多個目標 `docker_lanes` 時，可重複使用的工作流程只會準備套件與共用映像一次，接著將這些執行區展開為使用唯一成品的平行目標 Docker 工作。
4. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行；若 Package Acceptance 已解析套件，便會安裝相同的 `package-under-test` 成品。獨立 Telegram 分派仍可安裝已發布的 npm 規格。
5. 若套件解析、完整性、Docker 驗收或選用的 Telegram 執行區失敗，`summary` 會讓工作流程失敗。`advisory` 輸入會針對建議性呼叫端，將驗收失敗降級為警告。

### 候選版本來源

- `source=npm` 僅接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。請將此用於已發布的延伸穩定版、預發布版或穩定版驗收。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支／標籤、驗證所選提交可從儲存庫分支歷史或發布標籤抵達、在分離的工作樹中安裝相依套件，並使用 `scripts/package-openclaw-for-docker.mjs` 封裝。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 認證資訊、非預設 HTTPS 連接埠、私人／內部／特殊用途主機名稱或解析後的 IP，以及重新導向至相同公開安全政策以外的位置。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名的受信任來源政策下載 HTTPS `.tgz`；必須提供 `package_sha256` 和 `trusted_source_id`。僅將此用於維護者擁有、需要設定主機、連接埠、路徑前置字串、重新導向主機或私人網路解析的企業鏡像或私人套件儲存庫。如果政策宣告 Bearer 驗證，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密鑰；仍會拒絕嵌入 URL 的認證資訊。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選用，但對外部共用的成品應提供此值。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程／測試框架程式碼。`package_ref` 則是使用 `source=ref` 時會被封裝的來源提交。這可讓目前的測試框架驗證較舊的受信任來源提交，而不必執行舊的工作流程邏輯。

### 測試套件設定檔

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — 使用即時 `plugins` 涵蓋範圍取代 `plugins-offline` 的 `package` 集合，另加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 確切的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` 設定檔使用離線外掛涵蓋範圍，因此已發佈套件的驗證不會受限於即時 ClawHub 的可用性。選用的 Telegram 執行路徑會在 `NPM Telegram Beta E2E` 中重複使用 `package-under-test` 成品，並保留已發佈的 npm 規格路徑供獨立分派使用。

如需專用的更新與外掛測試政策，包括本機命令、
Docker 執行路徑、Package Acceptance 輸入、發行預設值與失敗分流，
請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發行檢查會使用 `source=artifact`、準備好的發行套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 與 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這會讓套件遷移、更新、即時 ClawHub skill 安裝、過時外掛相依套件清理、已設定外掛的安裝修復、離線外掛、外掛更新與 Telegram 驗證，都使用同一個已解析的套件 tarball。在發佈 beta 版後，於 Full Release Validation 或 OpenClaw Release Checks 設定 `release_package_spec`，即可針對已發佈的 npm 套件執行相同矩陣而不需重新建置；只有當 Package Acceptance 所需套件必須不同於其餘發行驗證使用的套件時，才設定 `package_acceptance_package_spec`。跨作業系統發行檢查仍涵蓋作業系統特定的初始設定、安裝程式與平台行為；套件／更新產品驗證應從 Package Acceptance 開始。

`published-upgrade-survivor` Docker 執行路徑會在阻擋式發行路徑中，每次執行驗證一個已發佈套件基準。在 Package Acceptance 中，已解析的 `package-under-test` tarball 一律是候選套件，而 `published_upgrade_survivor_baseline` 會選取備援的已發佈基準，預設為 `openclaw@latest`；失敗執行路徑的重新執行命令會保留該基準。使用 `run_release_soak=true` 或 `release_profile=full` 的 Full Release Validation 會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 與 `published_upgrade_survivor_scenarios=reported-issues`，將範圍擴展至最新四個穩定版 npm 發行，以及固定的外掛相容性邊界版本與依問題情境建構的測試資料，涵蓋 Feishu 設定、保留的啟動／角色設定檔案、已設定的 OpenClaw 外掛安裝、波浪號記錄路徑，以及過時的舊版外掛相依套件根目錄。選取多個基準的已發佈升級存續測試會依基準分片至個別的目標 Docker 執行器工作。當問題是全面清理已發佈版本的更新，而不是一般 Full Release CI 的涵蓋廣度時，獨立的 `Update Migration` 工作流程會使用 `update-migration` Docker 執行路徑，搭配 `all-since-2026.4.23` 基準與 `plugin-deps-cleanup` 情境。本機彙總執行可以透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入確切套件規格、使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`（例如 `openclaw@2026.4.15`）保留單一執行路徑，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以指定情境矩陣。已發佈套件執行路徑會使用內建的 `openclaw config set` 命令配方設定基準、將配方步驟記錄在 `summary.json`，並在閘道啟動後探測 `/healthz`、`/readyz` 與 RPC 狀態。Windows 套裝與安裝程式全新安裝執行路徑也會驗證已安裝套件能否從原始的 Windows 絕對路徑匯入瀏覽器控制覆寫。跨作業系統 OpenAI 代理程式回合煙霧測試會在有設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.6-luna`，讓安裝與閘道驗證使用成本較低的 GPT-5.6 測試層級。

### 舊版相容性期間

Package Acceptance 對已發佈套件提供有界限的舊版相容性期間。截至 `2026.4.25`（包括 `2026.4.25-beta.*`）的套件可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向 tarball 未包含的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從衍生自 tarball 的模擬 git 測試資料中移除缺少的 pnpm `patchedDependencies`，並可記錄缺少持久化 `update.channel` 的情況；
- 外掛煙霧測試可以讀取舊版安裝記錄位置，或接受未持久化市集安裝記錄的情況；
- `plugin-update` 可以允許設定中繼資料遷移，但仍要求安裝記錄與不重新安裝的行為保持不變。

已發佈的 `2026.4.26` 套件也可以針對已隨套件發佈的本機建置中繼資料戳記檔案發出警告，而截至 `2026.5.20` 的套件可以在缺少 `npm-shrinkwrap.json` 時發出警告而非失敗。後續套件必須符合現代合約；相同情況將改為失敗，而非警告或略過。

### 範例

```bash
# 使用產品層級涵蓋範圍驗證目前的 beta 套件。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 使用套件涵蓋範圍驗證已發佈的延伸穩定版套件。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 使用目前的測試框架封裝並驗證發行分支。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 驗證 tarball URL。source=url 時必須提供 SHA-256。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 從具名且受信任的私有鏡像政策驗證 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 重複使用另一個 Actions 執行所上傳的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

偵錯失敗的套件驗收執行時，請先查看 `resolve_package` 摘要，確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、執行路徑記錄、階段耗時與重新執行命令。應優先重新執行失敗的套件設定檔或確切 Docker 執行路徑，而不是重新執行完整發行驗證。

## 安裝煙霧測試

`Install Smoke` 工作流程不再於提取要求或推送至 `main` 時執行。其每夜／手動包裝工作流程與發行驗證都會呼叫唯讀的 `install-smoke-reusable.yml` 核心，而且每次執行都會在 GitHub 託管的執行器上完成完整安裝煙霧測試路徑：

- 每個目標 SHA 只會建置一次根 Dockerfile 煙霧測試映像，將其繫結至工作流程修訂版本與產生者嘗試次數，並儲存在不可變成品中；之後由命令列介面煙霧測試、代理程式刪除共用工作區命令列介面煙霧測試、容器閘道網路 E2E，以及隨附的 `matrix` 外掛建置引數煙霧測試載入。外掛煙霧測試會驗證執行階段相依套件安裝鏡像，以及外掛載入時不會產生進入點逸出診斷。
- QR 套件安裝與安裝程式／更新 Docker 煙霧測試（包括 Rocky Linux 安裝程式執行路徑，以及針對可設定之 `update_baseline_version` npm 基準的更新執行路徑）會以個別工作執行，因此安裝程式工作不需在根映像煙霧測試之後等待。

較慢的 Bun 全域安裝映像提供者煙霧測試會由 `run_bun_global_install_smoke` 獨立控管。它會依每夜排程執行，從發行檢查呼叫工作流程時預設啟用，而手動分派 `Install Smoke` 時可以選擇啟用。一般提取要求 CI 仍會針對與 Node 相關的變更執行快速 Bun 啟動器迴歸執行路徑。QR 與安裝程式 Docker 測試會繼續使用各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用的即時測試映像、將 OpenClaw 封裝一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式／更新／外掛相依套件執行路徑的純 Node/Git 執行器；
- 將相同 tarball 安裝至 `/app`、用於一般功能執行路徑的功能完整映像。

Docker 執行路徑定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，而執行器只會執行選取的計畫。排程器會透過 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個執行路徑選取映像，然後使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行這些路徑。

### 可調整項目

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般執行路徑的主集區槽位數。                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對提供者敏感之尾端集區的槽位數。                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 同時執行的即時執行路徑上限，避免提供者進行節流。                                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 同時執行的 npm 安裝執行路徑上限。                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時執行的多服務執行路徑上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 錯開執行路徑啟動時間，以避免 Docker 常駐程式發生大量建立作業；設為 `0` 表示不錯開。            |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個執行路徑的備援逾時（120 分鐘）；選取的即時／尾端執行路徑會使用更嚴格的上限。               |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫，但不執行任何執行路徑。                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的確切執行路徑清單；略過清理煙霧測試，讓代理程式可以重現單一失敗的執行路徑。        |

負載高於其有效上限的執行路徑仍可從空集區啟動，之後會單獨執行，直到釋放容量為止。本機彙總會預先檢查 Docker、移除過時的 OpenClaw E2E 容器、輸出作用中執行路徑狀態、持久保存執行路徑耗時以供最長優先排序，並且預設在第一次失敗後停止排程新的集區執行路徑。

### 可重複使用的即時／E2E 工作流程

可重複使用的即時／E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json`，以判斷所需的套件、映像種類、即時映像、執行通道與認證資訊涵蓋範圍。接著，`scripts/docker-e2e.mjs` 會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 封裝 OpenClaw、下載目前執行作業的套件成品，或從 `package_artifact_run_id` 下載套件成品，然後驗證 tarball 的內容清單。預設的 `no-push-artifact` 路徑會透過 Blacksmith 的 Docker 層快取建置以套件摘要標記的基本／功能映像，將映像的確切位元組封裝成不可變的工作流程成品，並讓每個使用端驗證及載入該成品。相較之下，`existing-only` 要求明確指定 `docker_e2e_bare_image`／`docker_e2e_functional_image` GHCR 參照，且絕不建置或推送。這些登錄檔提取作業對每次嘗試設有 180 秒的逾時上限，因此卡住的串流能快速重試，而不會耗掉大部分 CI 關鍵路徑時間。排程驗證成功後，`openclaw-scheduled-live-checks.yml` 會將不可變的已測試映像資訊清單傳遞給獨立且具套件寫入權限的發布程式；唯讀的正式版與預發行版呼叫端絕不會經過該寫入程式。

### 發行路徑區塊

發行版 Docker 涵蓋範圍會執行較小的分塊作業，並設定 `OPENCLAW_SKIP_DOCKER_BUILD=1`，如此每個區塊只會驗證及載入所需、由成品支援的映像種類（或在明確使用 `existing-only` 重複利用時提取映像），並透過相同的加權排程器執行多個執行通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

目前的發行版 Docker 區塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 至 `plugins-runtime-install-h`，以及 `openwebui`。`package-update-openai` 包含即時 Codex 外掛套件執行通道；此通道會安裝候選 OpenClaw 套件、從 `codex_plugin_spec` 或相同參照的 tarball 安裝 Codex 外掛並明確核准安裝 Codex 命令列介面、執行 Codex 命令列介面預檢，然後在同一工作階段中針對 OpenAI 執行多輪 OpenClaw 代理程式操作。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍是外掛／執行階段的彙總別名。`install-e2e` 執行通道別名仍是兩個提供者安裝程式執行通道的彙總手動重新執行別名。

每當穩定版或完整發行路徑涵蓋範圍要求時，OpenWebUI 都會在專用的大磁碟 Blacksmith 執行器上，以獨立的 `openwebui` 區塊執行，即使可重複使用的工作流程會將支援的作業路由至 GitHub 託管的執行器亦然。將外部映像提取作業分開，可避免大型映像與 `plugins-runtime-services` 中的共用套件及外掛映像競爭；舊版彙總外掛／執行階段區塊仍會納入 OpenWebUI，以支援相容的手動重新執行。內建通道更新執行通道遇到暫時性的 npm 網路失敗時，會重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含執行通道記錄、耗時、`summary.json`、`failures.json`、階段耗時、排程器計畫 JSON、慢速執行通道表格，以及各執行通道的重新執行命令。工作流程的 `docker_lanes` 輸入會針對該次執行所準備的映像執行選定的執行通道，而不使用區塊作業，使失敗執行通道的偵錯範圍限制在單一目標 Docker 作業內；如果選定的執行通道是即時 Docker 執行通道，目標作業會為該次重新執行在本機建置即時測試映像。重新執行輔助程式會驗證失敗成品中的確切選定目標 SHA，而手動分派會重新封裝該參照，因為內部可重複使用工作流程的套件元組不屬於 `workflow_dispatch` 結構描述。只有當準備好的映像輸入由 GHCR 支援時，產生的命令才會包含這些映像輸入與 `shared_image_policy=existing-only`；執行器本機的成品標記則會省略，以便全新的執行器重新建置。明確指定目標覆寫時，會捨棄復原的 GHCR 映像參照，除非成品能證明它們與覆寫目標相符。由成品產生的工作流程定義參照也會省略，因為完整發行的暫存分支會被刪除；除非操作人員明確覆寫，否則分派會使用儲存庫的預設分支。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker 成品並輸出合併及各執行通道的目標重新執行命令
pnpm test:docker:timings <summary>   # 慢速執行通道與階段關鍵路徑摘要
```

排程的即時／E2E 工作流程每天會執行完整的發行路徑 Docker 套件組，並在成功後針對確切的已測試映像成品叫用明確的發布程式。

## 外掛預發行

`Plugin Prerelease` 是成本較高的產品／套件涵蓋範圍，因此它是由 `Full Release Validation` 或操作人員明確分派的獨立工作流程。一般提取要求、`main` 推送，以及獨立的手動 CI 分派，都不會啟用此套件組。它會在八個擴充功能工作器之間平衡內建外掛測試；這些擴充功能分片作業每次最多同時執行兩個外掛設定群組，每個群組使用一個 Vitest 工作器與較大的 Node 堆積空間，避免匯入密集的外掛批次產生額外的 CI 作業。僅供發行版使用的 Docker 預發行路徑（由 `full_release_validation` 輸入啟用）會以每組四個為單位批次執行目標 Docker 執行通道，避免為只需一至三分鐘的作業保留數十個執行器。此工作流程也會從 `@openclaw/plugin-inspector` 上傳僅供參考的 `plugin-inspector-advisory` 成品；檢查器發現是分流處理的輸入，不會改變具阻擋作用的 Plugin Prerelease 閘門。

## QA Lab

QA Lab 在主要智慧範圍工作流程之外設有專用的 CI 執行通道。代理式同等性測試包含在廣泛的 QA 與發行測試框架之下，而不是獨立的提取要求工作流程。若同等性測試應搭配廣泛驗證執行，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會在 `main` 上每晚執行，也可手動分派；它會將模擬同等性執行通道、即時 Matrix 執行通道，以及即時 Telegram 與 Discord 執行通道展開為平行作業。即時作業使用 `qa-live-shared` 環境，而 Telegram／Discord 則使用 Convex 租用資源。

發行檢查會使用確定性的模擬提供者與具模擬限定詞的模型（`mock-openai/gpt-5.6-luna` 與 `mock-openai/gpt-5.6-luna-alt`）執行 Matrix 與 Telegram 即時傳輸執行通道，使通道合約不受即時模型延遲與一般提供者外掛啟動的影響。即時傳輸閘道會停用記憶搜尋，因為 QA 同等性測試會另外涵蓋記憶行為；提供者連線能力則由獨立的即時模型、原生提供者與 Docker 提供者套件組涵蓋。

Matrix 針對排程與發行閘門使用 `--profile fast`，且僅在已簽出的命令列介面支援時才加入 `--fail-fast`。命令列介面預設值與手動工作流程輸入仍為 `all`；手動分派 `matrix_profile=all` 時，總會將完整的 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在核准發行前執行發行關鍵的 QA Lab 執行通道；其 QA 同等性閘門會將候選套件與基準套件作為平行執行通道作業執行，再將兩者的成品下載至小型報告作業，以進行最終同等性比較。

對於一般提取要求，請依循範圍限定的 CI／檢查證據，而不要將同等性測試視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意設計為範圍狹窄的第一階段安全掃描器，而非完整的儲存庫掃描。每日、手動、`main` 推送與非草稿提取要求的防護執行，會掃描 Actions 工作流程程式碼與風險最高的 JavaScript／TypeScript 表面，使用高可信度的安全查詢，並篩選至高／嚴重的 `security-severity`。

提取要求防護保持輕量：只有變更位於 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`，或擁有處理程序的內建外掛執行階段路徑下時才會啟動，且執行與排程工作流程相同的高可信度安全矩陣。Android 與 macOS CodeQL 不包含在提取要求預設項目中。

### 安全類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、密鑰、沙箱、排程與閘道基準                                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，以及通道外掛執行階段、閘道、外掛 SDK、密鑰與稽核接觸點                                                           |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 剖析、網路防護、網頁擷取與外掛 SDK SSRF 政策表面                                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、處理程序執行輔助程式、對外傳遞與代理程式工具執行閘門                                                                     |
| `/codeql-security-high/process-exec-boundary`     | 本機殼層、處理程序產生輔助程式、擁有子處理程序的內建外掛執行階段，以及工作流程指令碼銜接程式                                           |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、資訊清單、登錄檔、套件管理員安裝、來源載入，以及外掛 SDK 套件合約的信任表面                                         |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。在工作流程健全性檢查接受的最小型 Blacksmith Linux 執行器上，手動建置 Android 應用程式以供 CodeQL 使用。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週／手動的 macOS 安全分片。在 Blacksmith macOS 上手動建置 macOS 應用程式以供 CodeQL 使用，從上傳的 SARIF 中篩除相依套件建置結果，並上傳至 `/codeql-critical-security/macos`。由於即使掃描結果無問題，macOS 建置仍會占用大部分執行時間，因此不納入每日預設項目。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它僅針對範圍狹窄且高價值的表面，執行錯誤嚴重性、非安全性的 JavaScript／TypeScript 品質查詢，並使用 GitHub 託管的 Linux 執行器，使品質掃描不會消耗 Blacksmith 執行器註冊預算。其提取要求防護刻意小於排程設定檔：非草稿提取要求只會針對其觸及的表面執行相符的分片，分片來自十三個可由提取要求路由的分片 — `agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 與 `session-diagnostics-boundary`。`ui-control-plane` 與 `web-media-runtime-boundary` 不會在提取要求執行中使用。CodeQL 設定與品質工作流程變更會執行完整的提取要求分片集合（網路執行階段分片會依其自身的 CodeQL 設定檔與擁有網路功能的來源路徑觸發）。

手動分派接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

範圍狹窄的設定檔是教學／反覆調整用的掛鉤，可用來單獨執行一個品質分片。

| 類別                                                    | 範圍                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、機密資訊、沙箱、排程與閘道安全邊界程式碼                                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化與 IO 合約                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道協定結構描述與伺服器方法合約                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心頻道與內建頻道外掛實作合約                                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型／供應商分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接器、程序監督輔助工具，以及對外傳遞合約                                                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶主機 SDK、記憶執行階段外觀、記憶外掛 SDK 別名、記憶執行階段啟用黏合層，以及記憶 doctor 命令                                                                 |
| `/codeql-critical-quality/network-runtime-boundary`     | 網路原則套件、原始通訊端與代理擷取執行階段、SSH 通道、閘道鎖定、JSONL 通訊端，以及推播傳輸介面                                                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部機制、工作階段傳遞佇列、對外工作階段繫結／傳遞輔助工具、診斷事件／日誌套件介面，以及工作階段 doctor 命令列介面合約                                    |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 傳入回覆分派、回覆承載資料／分塊／執行階段輔助工具、頻道回覆選項、傳遞佇列，以及工作階段／討論串繫結輔助工具                                           |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、供應商驗證與探索、供應商執行階段註冊、供應商預設值／目錄，以及網頁／搜尋／擷取／嵌入登錄表                                                      |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、閘道控制流程，以及工作控制平面執行階段合約                                                                                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取／搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                                                        |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄表、公開介面與外掛 SDK 進入點合約                                                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端的外掛 SDK 原始碼與外掛套件合約輔助工具                                                                                                              |

品質與安全性維持分離，因此可以排程、衡量、停用或擴充品質發現，而不會掩蓋安全性訊號。只有在精簡設定檔的執行階段與訊號穩定後，才應將 Swift、Python 與內建外掛的 CodeQL 擴充，以限定範圍或分片的後續工作形式加回。

## 維護工作流程

### 文件代理程式

`Docs Agent` 工作流程是事件驅動的 Codex 維護管線，用於讓現有文件與最近合併的變更保持一致。它沒有單純的排程：`main` 上由非機器人推送且成功的 CI 執行可以觸發它，也可以直接手動分派執行。若 `main` 已有後續變更，或過去一小時內已建立另一個未略過的 Docs Agent 執行，工作流程執行觸發便會略過。執行時，它會審查從上一次未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上一次文件檢查後累積的所有 main 變更。

### 測試效能代理程式

`Test Performance Agent` 工作流程是針對慢速測試的事件驅動 Codex 維護管線。它沒有單純的排程：`main` 上由非機器人推送且成功的 CI 執行可以觸發它，但若該 UTC 日已有另一個工作流程執行觸發已執行或正在執行，就會略過。手動分派不受每日活動閘門限制。此管線會建立完整測試套件的分組 Vitest 效能報告，讓 Codex 僅進行維持涵蓋率的小型測試效能修正，而非廣泛重構，接著重新執行完整測試套件報告，並拒絕會降低基準通過測試數量的變更。分組報告會記錄 Linux 與 macOS 上各設定的實際經過時間與最大 RSS，因此前後比較會同時呈現測試記憶體差異與持續時間差異。若基準有失敗的測試，Codex 只能修正明顯的失敗，且代理程式執行後的完整測試套件報告必須通過，才能提交任何內容。若機器人推送落地前 `main` 已前進，此管線會將已驗證的修補程式重定基底、重新執行 `pnpm check:changed`，並重試推送；發生衝突的過時修補程式會被略過。它使用 GitHub 託管的 Ubuntu，讓 Codex action 能維持與文件代理程式相同的 drop-sudo 安全措施。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是供維護者在合併後清理重複項目的手動工作流程。它預設為試執行，只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 前，它會驗證已落地的 PR 已合併，且每個重複 PR 都有共同參照的議題或重疊的變更區塊。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機變更管線邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。相較於廣泛的 CI 平台範圍，該本機檢查閘門對架構邊界更嚴格：

- 核心正式環境變更會執行核心正式環境與核心測試型別檢查，以及核心 lint／防護檢查；
- 僅核心測試的變更只會執行核心測試型別檢查與核心 lint；
- 擴充套件正式環境變更會執行擴充套件正式環境與擴充套件測試型別檢查，以及擴充套件 lint；
- 僅擴充套件測試的變更會執行擴充套件測試型別檢查與擴充套件 lint；
- 公開外掛 SDK 或外掛合約變更會擴大至擴充套件型別檢查，因為擴充套件依賴這些核心合約（Vitest 擴充套件掃描仍屬於明確的測試工作）；
- 僅發布中繼資料的版本號提升會執行針對性的版本／設定／根依賴項檢查；
- 未知的根目錄／設定變更會採取安全失敗策略，執行所有檢查管線。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，並刻意比 `check:changed` 更輕量：直接測試編輯會執行其本身；原始碼編輯會優先採用明確對應，接著執行同層測試與匯入圖相依項目。共用群組房間傳遞設定是其中一項明確對應：對群組可見回覆設定、來源回覆傳遞模式或訊息工具系統提示的變更，會經由核心回覆測試，以及 Discord 與 Slack 傳遞迴歸測試進行路由，讓共用預設值變更能在第一次推送 PR 前失敗。僅當變更廣泛影響測試框架，使得低成本的對應集合無法作為可信的代理指標時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是儲存庫自有的遠端機器包裝工具，用於維護者的 Linux 驗證。代理程式工作階段預設使用它來執行測試與運算密集型工作，包括建置、型別檢查、lint 扇出、Docker、套件管線、端對端測試、即時驗證與 CI 一致性驗證。受信任的維護者程式碼預設使用 `blacksmith-testbox`，而 `.crabbox.yaml` 現在也以它為預設值。其設定的工作流程會載入供應商與代理程式認證資訊，因此不受信任的貢獻者或分支程式碼必須改用無機密資訊的分支 CI，或經過淨化的直接 AWS Crabbox。經過淨化的 AWS 執行會設定 `CRABBOX_ENV_ALLOW=CI`、傳入 `--no-hydrate`，並使用全新的暫時遠端 `HOME`；這可防止儲存庫的 `OPENCLAW_*` 允許清單與現有驗證設定檔傳入不受信任的程式碼。它們會使用專供該不受信任來源、全新預熱的租用環境，絕不使用受信任或先前已載入的租用環境。請從乾淨且受信任的 `main` 簽出啟動已安裝且受信任的 Crabbox 二進位檔，並僅透過 `--fresh-pr` 擷取遠端 PR；絕不可在本機執行不受信任簽出中的包裝工具或設定。取消設定 `CRABBOX_AWS_INSTANCE_PROFILE`，且除非解析後的 `aws.instanceProfile` 為空，否則採取安全失敗。在任何安裝／測試前，使用受信任的絕對路徑工具要求 IMDSv2 權杖、證明 IAM 認證資訊端點傳回 404，並將遠端 `git rev-parse HEAD` 與完整且已審查的 PR head SHA 比較。將租用環境綁定至該 SHA，並在 head 變更時停止並重新預熱。請從乾淨的 `main` 上傳受信任的 `scripts/crabbox-untrusted-bootstrap.sh`，並搭配 `--fresh-pr`；它會安裝固定版本的 Node／pnpm、驗證 SHA 與套件管理器版本固定設定、隔離 `HOME`、安裝依賴項，然後執行要求的測試。
取消設定所有 `CRABBOX_TAILSCALE*` 覆寫、強制使用 `--network public
--tailscale=false`、清除出口節點／LAN 旗標，並要求 `crabbox inspect` 在上傳任何指令碼前，回報公開網路且沒有 Tailscale 狀態。自有的 AWS／Hetzner 容量也仍是 Blacksmith 中斷、配額問題或明確要求使用自有容量測試時的備援方案。

在可能需要測試或大量驗證的受信任程式碼工作開始時，代理程式應立即在背景命令工作階段中預熱，在載入期間繼續檢查與編輯，重複使用傳回的 `tbx_...` id，在每次執行時同步目前簽出，並在交付前停止它：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

由 Crabbox 支援的 Blacksmith 執行會預熱、認領、同步、執行、回報，並清理一次性的 Testbox。內建同步健全性檢查會在同步機器上的 `git status --short` 顯示至少 200 個受追蹤刪除項目時快速失敗，以便偵測像 `pnpm-lock.yaml` 這類消失的根目錄檔案。對於刻意進行大量刪除的 PR，請為遠端命令設定 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

若本機 Blacksmith 命令列介面呼叫停留在同步階段超過五分鐘，且同步後沒有輸出，Crabbox 也會終止該呼叫。設定 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用該防護，或針對異常龐大的本機差異使用更大的毫秒值。

首次執行前，請從儲存庫根目錄檢查包裝工具：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

儲存庫包裝工具會拒絕未宣告所選供應商的過時 Crabbox 二進位檔；由 Blacksmith 支援的執行需要 Crabbox 0.22.0 或更新版本，讓包裝工具取得目前的 Testbox 同步、佇列與清理行為。在 Codex 工作樹或連結／稀疏簽出中，請避免使用本機 `pnpm crabbox:run` 指令碼，因為 pnpm 可能會在 Crabbox 啟動前協調依賴項；請改為直接呼叫 node 包裝工具：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用同層簽出時，請在進行計時或驗證工作前，重新建置被忽略的本機二進位檔：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` 中的 `blacksmith:` 區塊已固定組織、工作流程、工作、ref 的預設值，因此下方的明確旗標為選用。變更檢查閘門：

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

完整測試套件：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

讀取最終的 JSON 摘要。實用欄位包括 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。對於委派的
Blacksmith Testbox 執行，Crabbox 包裝器的結束代碼和 JSON 摘要就是
命令結果。連結的 GitHub Actions 執行負責環境準備和保活；當 SSH
命令已經返回後，若 Testbox 從外部停止，它可能會以 `cancelled` 結束。
除非包裝器的 `exitCode` 非零，或命令輸出顯示測試失敗，否則請將其視為
清理／狀態產物。使用 Blacksmith 後端的一次性 Crabbox 執行應自動停止 Testbox；
如果執行遭到中斷或清理狀態不明，請檢查執行中的機器，並只停止
你建立的機器：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要於同一個已準備完成的機器上執行多個命令時，才使用重複使用功能：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

重複使用租約，而非過時的原始碼。不要使用 `--no-sync`，讓每次執行都上傳
目前的工作目錄；只有在刻意重新執行未變更且已同步的原始碼樹時才使用它。
不受信任的貢獻者／分支原始碼必須使用
`CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate`，並為每個命令使用全新的
暫時遠端 `HOME`；請先在該淨化命令中安裝相依套件，再執行測試。只能重複使用
專門為同一份不受信任原始碼新近預熱的租約；絕不可使用受信任或先前已準備完成的租約。
絕不可在本機執行不受信任工作目錄中的包裝器或設定：請從乾淨且受信任的 `main`
啟動已安裝的可信 Crabbox 二進位檔，並在每次執行時傳入 `--fresh-pr`。
保持 `CRABBOX_AWS_INSTANCE_PROFILE` 未設定，拒絕解析結果為非空值的
執行個體設定檔，要求可信遠端提供 IMDS 無角色證明，並在安裝／測試前驗證
已審查的 head SHA。將租約繫結至該 SHA；任何 head 變更後都要停止並重新預熱。
若不存在遠端 PR，請使用無密鑰的分支 CI。絕不可為不受信任的原始碼選擇
`hydrate-github` 或已注入認證資訊的 Blacksmith 工作流程。

如果故障層是 Crabbox，但 Blacksmith 本身運作正常，請只將直接使用
Blacksmith 用於 `list`、`status` 和清理等診斷。在將直接 Blacksmith
執行視為維護者證明前，先修正 Crabbox 路徑。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 正常運作，但新的
預熱在數分鐘後仍停留於 `queued`，且沒有 IP 或 Actions 執行 URL，
請將其視為 Blacksmith 供應商、佇列、計費或組織限制壓力。停止你建立的
已排入佇列 ID，避免啟動更多 Testbox，並將證明移至下方自有的 Crabbox 容量路徑，
同時由其他人檢查 Blacksmith 儀表板、計費和組織限制。

只有在 Blacksmith 停機、配額受限、缺少所需環境，或明確以自有容量為目標時，才升級使用自有的 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

在 AWS 容量壓力下，除非工作確實需要 48xlarge 等級的 CPU，否則請避免使用 `class=beast`。一個 `beast` 請求從 192 個 vCPU 起跳，最容易觸發區域性的 EC2 Spot 或 On-Demand Standard 配額。存放庫自有的 `.crabbox.yaml` 預設為 `class: standard`、隨需市場，以及 `capacity.hints: true`，因此透過代理取得的 AWS 租約會列印選取的區域／市場、配額壓力、Spot 備援和高壓力類別警告。較繁重的廣泛檢查使用 `fast`；只有在 standard／fast 不足時才使用 `large`；`beast` 僅用於例外的 CPU 密集執行路徑，例如完整測試套件或所有外掛的 Docker 矩陣、明確的發行／阻斷項目驗證，或高核心效能分析。請勿將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint／型別檢查、小型 E2E 重現，或 Blacksmith 停機分類。容量診斷請使用 `--market on-demand`，避免 Spot 市場波動混入訊號。

`.crabbox.yaml` 負責供應商、同步和 GitHub Actions 環境準備的預設值。Crabbox 同步絕不傳輸 `.git`，因此已準備完成的 Actions 簽出會保留其本身的遠端 Git 中繼資料，而不會同步維護者本機的遠端設定和物件儲存區；存放庫設定還會排除不應傳輸的本機執行階段／建置產物（例如 `.artifacts` 和測試報告）。`.github/workflows/crabbox-hydrate.yml` 負責簽出、Node／pnpm 設定、擷取 `origin/main`，以及為自有雲端的 `crabbox run --id <cbx_id>` 命令交接非密鑰環境。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
