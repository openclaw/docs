---
read_when:
    - 你需要瞭解 CI 工作為何有執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調版本發布驗證的執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 工作流程圖、範圍閘門、發布統整流程與對應的本機命令
title: CI 管線
x-i18n:
    generated_at: "2026-07-14T13:31:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 56332874183aa0cdf2bdf60f68324aef3b5a81bd87510dc75f195cdefe3313b4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在推送至 `main` 時（Markdown 與 `docs/**` 路徑會在觸發條件中忽略）、每個非草稿提取要求，以及手動分派時執行。
標準 `main` 推送會先經過 90 秒的
託管執行器准入等待期；當較新的提交送達時，`CI` 並行群組會取消該等待中的
執行，因此依序合併不會各自註冊完整的
Blacksmith 矩陣。提取要求與手動分派會略過等待。接著，
`preflight` 工作會分類差異，並在只有不相關區域發生變更時
關閉高成本的執行通道。手動 `workflow_dispatch` 執行會刻意
略過智慧範圍界定，並展開完整圖譜，以用於候選版本和
廣泛驗證。Android 執行通道仍須透過 `include_android`（或
`release_gate` 輸入）選擇啟用。僅限發行版的外掛涵蓋範圍位於獨立的
[`Plugin Prerelease`](#plugin-prerelease) 工作流程中，且僅會從
[`Full Release Validation`](#full-release-validation) 或明確的手動
分派執行。

## 管線概覽

| 工作                               | 用途                                                                                                                                                                                                                  | 執行時機                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | 偵測僅文件的變更、已變更的範圍、已變更的擴充功能，並建立 CI 資訊清單                                                                                                                                                  | 所有非草稿推送和提取要求                            |
| `runner-admission`                 | 在註冊 Blacksmith 工作前，針對標準 `main` 推送進行託管的 90 秒防彈跳處理                                                                                                                                   | 每次 CI 執行；僅標準 `main` 推送會等待 |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 稽核已變更的工作流程，以及稽核正式環境鎖定檔                                                                                                                                      | 所有非草稿推送和提取要求                            |
| `pnpm-store-warmup`                | 預熱由鎖定檔固定版本的 pnpm 儲存區快取，且不阻擋 Linux Node 分片                                                                                                                                                       | 已選取 Node 或文件檢查執行通道                      |
| `build-artifacts`                  | 建置 `dist/`、Control UI、已建置命令列介面的冒煙檢查、啟動記憶體，以及內嵌的已建置成品檢查                                                                                                                  | Node 相關變更                                       |
| `control-ui-i18n`                  | 驗證產生的 Control UI 語系套件、中繼資料與翻譯記憶庫；自動執行時僅提供建議，手動發行 CI 時則具阻擋作用                                                                                                                  | Control UI 國際化相關變更及手動 CI                  |
| `checks-fast-core`                 | 快速 Linux 正確性執行通道：已變更檔案的 TypeScript 程式碼行數棘輪、隨附項目與通訊協定、Bun 啟動器，以及 CI 路由快速任務                                                                                                | Node 相關或正式環境 TypeScript 變更                 |
| `qa-smoke-ci-profile`              | 有界自動化 QA 冒煙測試代表性集合中兩個自足且平衡的部分；完整分類涵蓋仍可透過明確的 QA 設定檔使用                                                                                                                       | Node 相關變更                                       |
| `checks-fast-contracts-plugins-*`  | 兩個加權的外掛合約分片                                                                                                                                                                                                | Node 相關變更                                       |
| `checks-fast-contracts-channels-*` | 兩個加權的頻道合約分片                                                                                                                                                                                                | Node 相關變更                                       |
| `checks-node-*`                    | 提取要求執行已變更目標的 Node 測試；`main`、手動、發行及廣泛後備執行則執行完整核心分片                                                                                                                     | Node 相關變更                                       |
| `check-*`                          | 分片的主要本機閘門等效項目：防護、shrinkwrap、隨附頻道設定中繼資料、正式環境型別、lint、相依套件、測試型別                                                                                                            | Node 相關變更                                       |
| `check-additional-*`               | 邊界檢查條帶（包括提示詞快照漂移）、工作階段存取器／逐字稿讀取器／SQLite 交易邊界、擴充功能 lint 群組、套件邊界編譯／金絲雀測試，以及執行階段拓撲架構                                                                  | Node 相關變更                                       |
| `checks-node-compat-node22`        | Node 22 相容性建置與冒煙測試執行通道                                                                                                                                                                                  | 發行版的手動 CI 分派                                |
| `check-docs`                       | 文件格式、lint 與失效連結檢查                                                                                                                                                                                         | 文件有變更（提取要求及手動分派）                    |
| `native-i18n`                      | 原生應用程式、Android 與 Apple 國際化清冊檢查                                                                                                                                                                         | 原生國際化相關變更                                  |
| `skills-python`                    | Python 支援的 Skills 使用 Ruff + pytest                                                                                                                                                                               | Python Skills 相關變更                              |
| `checks-windows`                   | Windows 特定的程序／路徑測試，以及共用執行階段匯入指定符的迴歸測試                                                                                                                                                   | Windows 相關變更                                    |
| `macos-node`                       | 聚焦的 macOS TypeScript 測試：launchd、Homebrew、執行階段路徑、封裝指令碼、程序群組包裝器                                                                                                                            | macOS 相關變更                                      |
| `macos-swift`                      | macOS 應用程式的 Swift lint、建置與測試                                                                                                                                                                               | macOS 相關變更                                      |
| `ios-build`                        | 產生 Xcode 專案及建置 iOS 應用程式模擬器                                                                                                                                                                             | iOS 應用程式、共用應用程式套件或 Swabble 變更       |
| `android`                          | 兩種變體的 Android 單元測試，加上一個偵錯 APK 建置                                                                                                                                                                    | Android 相關變更                                    |
| `openclaw/ci-gate`                 | 最終彙總：要求准入、前置檢查及安全性檢查通過；僅接受資訊清單停用的下游執行通道略過                                                                                                                                      | 每次非草稿 CI 執行                                  |
| `test-performance-agent`           | 獨立工作流程：在受信任活動後，每日執行 Codex 慢速測試最佳化                                                                                                                                                           | 主要 CI 成功或手動分派                              |
| `openclaw-performance`             | 獨立工作流程：每日／隨需產生 Kova 執行階段效能報告，包含模擬提供者、深度分析及 GPT 5.6 即時執行通道                                                                                                                    | 排程及手動分派                                      |

獨立的 Periphery 工作流程會強制 iOS 與 macOS 應用程式不得出現任何無效程式碼發現項目。共用的 OpenClawKit 工作流程會平行掃描兩個使用端，且只有在 Periphery 從兩次建置中發出相同的 Swift USR 時，才會回報宣告。其產生的 `OpenClawProtocol/GatewayModels.swift` 結構描述合約會保留為產生器所擁有的程式碼，而不會視為應用程式本機的無效程式碼。

## 快速失敗順序

1. `runner-admission` 僅會等待標準 `main` 推送；較新的推送會在 Blacksmith 註冊前取消該次執行。
2. `preflight` 決定哪些執行通道實際存在。`docs-scope` 與 `changed-scope` 邏輯是此工作內的步驟，而非獨立工作。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 與 `skills-python` 會快速失敗，不會等待較繁重的成品與平台矩陣工作。
4. `build-artifacts` 與提供建議的 `control-ui-i18n` 檢查會和快速 Linux 執行通道重疊進行。產生的語系漂移會持續可見，而獨立的重新整理工作流程會在背景修復。
5. 之後會展開較繁重的平台與執行階段執行通道：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 與 `android`。
6. `openclaw/ci-gate` 會等待每個已選取的執行通道。准入、前置檢查與安全性檢查必須成功；下游工作僅可在資訊清單未選取它們時略過。任何失敗或取消的已選取執行通道都會使彙總失敗。

合併協調器可針對相同的提取要求前端，重複使用通過驗證且成功的 `openclaw/ci-gate`
最多 24 小時。這可避免在發生不相關的 `main` 變更後，重寫
貢獻者分支。可重複使用的結果不會取代針對目前 `main` 執行的
另一項嚴格且由應用程式擁有的測試合併檢查。
在有效期限內，之後處於等待中或失敗的重新執行，不會抹除該未變更前端
先前的成功結果。

GitHub 可能會在同一個 PR 或 `main` ref 有較新的推送進入時，將已被取代的工作標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則應將其視為 CI 雜訊。矩陣工作使用 `fail-fast: false`，而 `build-artifacts` 會直接回報內嵌的頻道、核心支援邊界及閘道監看失敗，而不會將微型驗證工作排入佇列。自動 CI 並行處理鍵已版本化（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍工作不會無限期阻擋較新的 main 執行。手動完整測試套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。外掛清單啟動記憶體防護在自架 Blacksmith Linux 上維持 350 MiB 上限，並在 GitHub 託管的 Linux 上允許 425 MiB；後者執行相同建置完成的命令列介面時，RSS 基準較高。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>`，彙整 GitHub Actions 的實際經過時間、佇列時間、最慢工作、失敗項目及 `pnpm-store-warmup` 扇出屏障。工作流程內的 `ci-timings-summary` 工作存在於 `ci.yml`，但目前已停用（`if: false`）；請改為在本機執行計時輔助工具。若要查看建置計時，請檢查 `build-artifacts` 工作的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會輸出 `[build-all] phase timings:` 並包含 `ui:build`；該工作也會上傳 `startup-memory` 成品。

## PR 背景與證據

外部貢獻者的 PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR 背景與證據關卡。該工作流程會簽出
受信任的工作流程修訂版（`github.workflow_sha`），且只評估 PR 內文；
不會執行貢獻者分支中的程式碼。

此關卡適用於不是儲存庫擁有者、成員、協作者或機器人的 PR 作者。當 PR 內文包含由作者撰寫的
`What Problem This Solves` 與 `Evidence` 區段時，即會通過。證據可以是聚焦的
測試、CI 結果、螢幕擷取畫面、錄影、終端輸出、即時觀察、
經過遮蔽的記錄或成品連結。內文提供意圖與實用的驗證資訊；
審查者則檢查程式碼、測試與 CI，以評估正確性。

檢查失敗時，請更新 PR 內文，而不是再推送一個程式碼提交。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動分派會略過變更範圍偵測，並讓預檢資訊清單視同每個有範圍限制的區域都已變更。

獨立的 iOS 與 macOS Periphery 工作流程會強制執行零發現項目的無用程式碼政策。各工作流程只會在非草稿提取要求觸及其原生掃描範圍時，或經手動分派時執行。

- **CI 工作流程編輯**會驗證 Node CI 圖、工作流程 lint 及 Windows 執行路徑（由 `ci.yml` 執行），但本身不會強制執行 iOS、Android 或 macOS 原生建置；這些平台執行路徑仍限定於平台原始碼變更。
- **工作流程健全性檢查**會對所有工作流程 YAML 檔案執行 `actionlint`、`zizmor`、複合動作插值防護及衝突標記防護。PR 範圍內的 `security-fast` 工作也會對變更的工作流程檔案執行 `zizmor`，讓工作流程安全性發現項目能在主要 CI 圖中提早失敗。
- `main` 推送中的**文件**會由獨立的 `Docs` 工作流程檢查，並使用與 CI 相同的 ClawHub 文件鏡像，因此混合程式碼與文件的推送不會同時將 CI 的 `check-docs` 分片排入佇列。當文件有變更時，提取要求與手動 CI 仍會從 CI 執行 `check-docs`。
- **終端介面 PTY**會在終端介面變更時，於 `checks-node-core-runtime-tui-pty` Linux Node 分片中執行。該分片會使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋確定性的 `TuiBackend` 固定資料執行路徑，以及速度較慢、僅模擬外部模型端點的 `tui --local` 煙霧測試。
- **僅限 CI 路由的編輯、快速任務直接執行的一小組核心測試固定資料，以及範圍狹窄的外掛合約輔助工具編輯**會使用快速的純 Node 資訊清單路徑：`preflight`、`security-fast`，以及變更所觸及的快速執行路徑，且僅限這些項目——單一 `checks-fast-core` CI 路由任務、兩個外掛合約分片，或兩者皆有。該路徑會略過建置成品、Node 22 相容性、頻道合約、完整核心分片、隨附外掛分片及其他防護矩陣。
- **Windows Node 檢查**的範圍限定於 Windows 特有的處理程序／路徑包裝函式、npm／pnpm／UI 執行器輔助工具、套件管理員設定，以及執行該路徑的 CI 工作流程介面；不相關的原始碼、外掛、安裝煙霧測試及僅測試變更仍留在 Linux Node 執行路徑。

最慢的 Node 測試系列會經過拆分或平衡，使每個工作保持精簡，而不會過度預留執行器：

- 外掛合約與頻道合約各自以兩個加權的 Blacksmith 後端分片執行，並提供標準 GitHub 執行器作為備援。
- 核心單元快速／支援執行路徑會分別執行；核心執行階段基礎架構會拆分為處理程序、共用、掛鉤、祕密，以及三個排程領域分片。
- 自動回覆會以平衡的工作程序執行，並將回覆子樹拆分為代理執行器、命令、分派、工作階段及狀態路由分片。
- 代理式閘道／伺服器（控制平面）設定會拆分至聊天、驗證、模型、HTTP／外掛、執行階段及啟動執行路徑，而不是等待建置成品。
- 一般 CI 只會將隔離的基礎架構包含模式分片封裝為確定性的組合，每個組合最多包含 64 個測試檔案，以縮減 Node 矩陣，同時不合併非隔離的命令／排程、具狀態的代理核心或閘道／伺服器測試套件。繁重的固定測試套件維持使用 8 vCPU，而組合及權重較低的執行路徑則使用 4 vCPU。
- 標準儲存庫上的提取要求會針對合成合併樹差異重複使用變更測試解析器。精確的變更會執行一個目標式 Node 工作；每個選取的測試檔案都會取得自己的處理程序，因此具狀態測試套件仍能維持隔離。規劃器會結合同層測試與匯入圖相依項目，並在工作區套件、套件／鎖定檔案、共用測試框架、拆分設定、重新命名或刪除的變更、公開擴充功能合約變更、具有特殊分片設定的測試、僅部分解析或空白的目標、過大的路徑或目標計畫，以及規劃器錯誤時，退回現有的 14 工作精簡完整測試套件計畫。目標式計畫一律保留完整的建置成品邊界關卡，因為其儲存庫掃描器無法從匯入項目推導。`main` 推送、手動分派及發布關卡會保留完整矩陣，因為已取消且被取代的 `main` 執行，會使單次推送差異不足以作為整合證據。
- 完整 Node 矩陣會優先接納持續緩慢的序列工具與自動回覆命令分片。如此可維持 28 個工作上限，同時避免簡短的字母順序群組將關鍵路徑工作推遲至後續批次。
- 廣泛的瀏覽器、QA、媒體及其他外掛測試會使用各自專用的 Vitest 設定，而不是共用的外掛全包設定。包含模式分片會使用 CI 分片名稱記錄計時項目，讓 `.artifacts/vitest-shard-timings.json` 能區分完整設定與篩選後的分片。
- `check-additional-*` 會將補充邊界防護清單（`scripts/run-additional-boundary-checks.mjs`）分條至一個提示詞密集分片（`check-additional-boundaries-a`，其中包含 Codex 提示詞快照漂移檢查）及一個涵蓋其餘分條的合併分片（`check-additional-boundaries-bcd`）；每個分片都會並行執行彼此獨立的防護，並輸出各項檢查的計時。套件邊界編譯／金絲雀工作會保留在一起，而執行階段拓撲架構會與內嵌於 `build-artifacts` 的閘道監看涵蓋範圍分開執行。
- 在 `dist/` 與 `dist-runtime/` 已完成建置後，閘道監看、頻道測試及核心支援邊界分片會在 `build-artifacts` 內並行執行。

獲准執行後，標準 Linux CI 最多允許 28 個 Node 測試工作並行執行，
較小型的快速／檢查執行路徑則最多為 12 個；Windows 與 Android 維持為兩個，因為
這些執行器集區較為有限。精簡的完整設定批次使用
120 分鐘的批次逾時，而包含模式群組則共用相同且有界限的
工作預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，接著建置 Play 偵錯 APK。第三方變體沒有獨立的原始碼集或資訊清單；其單元測試執行路徑仍會使用 SMS／通話記錄 BuildConfig 旗標編譯該變體，同時避免在每次 Android 相關推送時執行重複的偵錯 APK 封裝工作。

`check-dependencies` 分片會執行正式環境的 Knip 相依性、未使用檔案及未使用匯出檢查。當 PR 新增尚未經審查的未使用檔案，或留下過時的允許清單項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的刻意動態外掛、產生內容、建置、即時測試及套件橋接介面。未使用匯出防護會排除測試支援檔案，接著在出現新發現項目或過時的必要基準項目時失敗；刪除無用匯出後，請使用 `pnpm deadcode:exports:update` 重新產生僅可縮減的基準。歷史目標若提供匯出防護便會執行，否則保留其較舊的無用程式碼備援機制。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是將 OpenClaw 儲存庫活動傳入 ClawSweeper 的目標端橋接器。它不會簽出或執行不受信任的提取要求程式碼。該工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App 權杖，接著將精簡的 `repository_dispatch` 承載資料分派至 `openclaw/clawsweeper`。

該工作流程有四條執行路徑：

- `clawsweeper_item` 用於精確指定的議題與提取要求審查請求；
- `clawsweeper_comment` 用於議題留言中的明確 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` 推送上的提交層級審查請求；
- `github_activity` 用於 ClawSweeper 代理可檢查的一般 GitHub 活動。

`github_activity` 執行路徑只會轉送正規化的中繼資料：事件類型、動作、執行者、儲存庫、項目編號、URL、標題、狀態，以及留言或審查內容存在時的簡短摘錄。它刻意避免轉送完整的網路鉤子本文。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，其會將正規化事件傳送至供 ClawSweeper 代理使用的 OpenClaw 閘道掛鉤。

一般活動是觀察，而非預設傳送。ClawSweeper 代理會在提示詞中收到 Discord 目標，且只應在事件出乎預期、可採取行動、有風險或對維運有用時，才傳送至 `#clawsweeper`。例行開啟、編輯、機器人雜訊、重複的網路鉤子雜訊及一般審查流量應產生 `NO_REPLY`。

在整條路徑中，應將 GitHub 標題、留言、本文、審查文字、分支名稱及提交訊息視為不受信任的資料。它們是摘要與分流的輸入，而不是工作流程或代理執行階段的指示。

## 手動分派

手動 CI 分派會執行與一般 CI 相同的工作圖，但會強制啟用所有非 Android 範圍的執行通道：Linux Node 分片、內建外掛分片、外掛與頻道契約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS、iOS 建置，以及 Control UI 國際化。Control UI 語系一致性在自動 PR 與 `main` 執行中僅供參考，因為獨立的重新整理工作流程會在背景修復產生內容的偏移；但在手動 CI 中會阻擋流程，因此也會阻擋完整發行驗證。獨立的手動 CI 分派僅在使用 `include_android=true` 時執行 Android（`release_gate` 輸入也會強制執行 Android）；完整發行的總括流程則藉由傳遞 `include_android=true` 啟用 Android。外掛預發行靜態檢查、僅限發行的 `agentic-plugins` 分片、完整擴充功能批次掃描，以及外掛預發行 Docker 執行通道均排除在 CI 之外。Docker 預發行套件僅在 `Full Release Validation` 分派啟用發行驗證閘門的獨立 `Plugin Prerelease` 工作流程時執行。

手動執行使用唯一的並行群組，因此候選發行版本的完整套件不會被同一參照上的其他推送或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫者針對分支、標籤或完整提交 SHA 執行該工作圖，同時使用所選分派參照中的工作流程檔案。選用的 `loc_base_ref` 會為獨立手動執行提供精確的比較 SHA。`release_gate` 輸入是供維護者在 PR CI 因容量停滯時使用的精確 SHA 備援方案：它要求 `target_ref` 是與分派分支頂端相符的完整提交 SHA，且 `pr_number` 必須識別開啟中的提取要求。工作流程會驗證該 PR 目前的頂端與基底，等待 GitHub 完成可合併性計算，鎖定回報的測試合併提交，擷取 GitHub 的合成提取要求合併參照，驗證其 SHA 與兩個父提交，接著在安裝相依套件並執行變更檔案的 TypeScript LOC 棘輪檢查前，簽出該樹狀結構。這與自動 PR CI 的合併樹狀結構及政策實作一致。若目標擁有的工作流程修訂沒有 `pr_number`，便無法提供同等的合併樹狀結構證據；請將 PR 頂端更新至目前的工作流程並重新啟動精確頂端驗證，而不要使用此備援方案。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月僅限 npm 的延伸穩定版路徑是例外：請從精確的
`extended-stable/YYYY.M.33` 分支分派 `OpenClaw NPM
Release` 預檢和 `Full Release Validation`，
保留兩者的執行 ID，並將兩個 ID 傳遞給直接 npm 發布執行。命令、精確身分要求、
登錄檔回讀和選擇器修復程序，請參閱[每月僅限 npm 的延伸穩定版
發布](/zh-TW/reference/RELEASING#monthly-npm-only-extended-stable-publication)。
此路徑不會分派外掛、macOS、Windows、GitHub Release、私人 dist-tag，
或其他平台發布。

## 執行器

| 執行器                          | 工作                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `runner-admission`、`security-fast`、手動 CI 分派與非標準儲存庫備援、QA 冒煙測試彙總、CodeQL 安全性與品質掃描、工作流程健全性檢查、標籤工具、自動回覆、獨立的文件工作流程，以及完整的安裝冒煙測試工作流程            |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`pnpm-store-warmup`、`native-i18n`、除 QA 冒煙測試 CI 之外的 `checks-fast-core`、外掛／頻道契約分片、多數內建／較輕量的 Linux Node 分片、除 `check-lint` 之外的 `check-*` 執行通道、所選的 `check-additional-*` 分片、`check-docs`，以及 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的重量級 Linux Node 套件、邊界／擴充功能密集的 `check-additional-*` 分片，以及 `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | 自動 QA 冒煙測試 CI 分片、CI 與 Testbox 中的 `build-artifacts`，以及 `check-lint`（對 CPU 足夠敏感，以致 8 個 vCPU 增加的成本高於節省的成本）                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；分支儲存庫會退回使用 `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；分支儲存庫會退回使用 `macos-26`                                                                                                                                                                                               |

## 執行器註冊預算

OpenClaw 目前的 GitHub 執行器註冊配額在 `ghx api rate_limit` 中回報為每 5 分鐘 10,000 次自託管執行器註冊。由於 GitHub 可能變更此配額，請在每次調校前重新檢查 `actions_runner_registration`。此限制由 `openclaw` 組織中的所有 Blacksmith 執行器註冊共用，因此新增另一個 Blacksmith 安裝並不會增加新的配額。

請將 Blacksmith 標籤視為突發量控制的稀缺資源。只負責路由、通知、彙總、選擇分片或執行短時間 CodeQL 掃描的工作，除非已量測出 Blacksmith 特有需求，否則應保留在 GitHub 託管的執行器上。任何新的 Blacksmith 矩陣、更大的 `max-parallel`，或高頻率工作流程，都必須顯示其最壞情況下的註冊次數，並將組織層級目標維持在即時配額的約 60% 以下。以目前 10,000 次註冊的配額而言，這表示操作目標為 6,000 次註冊，並為並行儲存庫、重試和突發重疊保留餘裕。

變更目標的 PR 計畫將常見的 Node 測試突發量從 14 次 Blacksmith 註冊降至 1 次。高風險範圍的 PR 會保留 14 次註冊的精簡備援方案，因此最壞情況不會增加。

標準儲存庫 CI 會維持以 Blacksmith 作為一般推送和提取要求執行的預設執行器路徑。`workflow_dispatch` 與非標準儲存庫執行會使用 GitHub 託管的執行器，但一般標準執行目前不會探測 Blacksmith 佇列健康狀態，也不會在 Blacksmith 無法使用時自動退回 GitHub 託管的標籤。

## 本機等效命令

```bash
pnpm changed:lanes                            # 檢查 origin/main...HEAD 的本機變更執行通道分類器
pnpm check:changed                            # 智慧型本機檢查閘門：依邊界執行通道檢查變更的格式／型別／程式碼檢查／防護
pnpm check                                    # 快速本機閘門：正式環境 tsgo + 分片程式碼檢查 + 平行快速防護
pnpm check:test-types
pnpm check:timed                              # 相同閘門，並包含各階段計時
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest 測試
pnpm test:changed                             # 低成本的智慧型變更 Vitest 目標
pnpm test:ui                                  # Control UI 單元／瀏覽器套件
pnpm ui:i18n:check                            # 產生的 Control UI 語系一致性（發行閘門）
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # 文件格式 + 程式碼檢查 + 失效連結
pnpm build                                    # 當 CI 成品／冒煙檢查很重要時建置 dist
pnpm ios:build                                # 產生並建置 iOS 應用程式專案
pnpm ci:timings                               # 彙總最新的 origin/main 推送 CI 執行
pnpm ci:timings:recent                        # 比較近期成功的 main CI 執行
node scripts/ci-run-timings.mjs <run-id>      # 彙總實際經過時間、佇列時間和最慢工作
node scripts/ci-run-timings.mjs --latest-main # 忽略問題／留言雜訊並選擇 origin/main 推送 CI
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

手動分派通常會對工作流程參照進行基準測試。設定 `target_ref`，即可使用目前的工作流程實作對發行標籤或其他分支進行基準測試。已發布的報告路徑與最新指標會依受測參照建立索引，而每個 `index.md` 都會記錄受測參照／SHA、工作流程參照／SHA、Kova 參照、設定檔、執行通道驗證模式、模型、重複次數，以及情境篩選條件。

此工作流程會從固定版本安裝 OCM，並從 `openclaw/Kova` 依固定的 `kova_ref` 輸入安裝 Kova，接著執行三個執行通道：

- `mock-provider`：針對本機建置的執行階段執行 Kova 診斷情境，並使用確定性的假 OpenAI 相容驗證。
- `mock-deep-profile`：對啟動、閘道和代理程式回合熱點進行 CPU／堆積／追蹤分析。會依排程執行，或在分派時搭配 `deep_profile=true` 執行。
- `live-openai-candidate`：執行真實的 OpenAI `openai/gpt-5.6-luna` 代理程式回合；當 `OPENAI_API_KEY` 無法使用時略過。會依排程執行，或在分派時搭配 `live_openai_candidate=true` 執行。

模擬提供者管線在 Kova 通過後，也會執行 OpenClaw 原生原始碼探測：涵蓋預設、略過頻道、內部鉤子及五十個外掛啟動案例的閘道啟動時間與記憶體；內建外掛匯入 RSS、重複的模擬 OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道執行的命令列介面啟動命令，以及 SQLite 狀態冒煙效能探測。若受測參照有先前發布的模擬提供者原始碼報告，原始碼摘要會將目前的 RSS 與堆積值和該基準比較，並將大幅增加的 RSS 標記為 `watch`。原始碼探測的 Markdown 摘要位於報告套件中的 `source/index.md`，原始 JSON 則置於其旁。

每條管線都會上傳完整的 GitHub 成品，包括 CPU、堆積、追蹤及壓縮診斷套件。獨立的發布工作會下載並驗證這些成品，接著建立一個短效期的 ClawSweeper GitHub App 權杖，其範圍僅限於 `openclaw/clawgrit-reports` 內容，並且只將它傳遞給 Git 推送步驟。它會將 `report.json`、`report.md`、`index.md`、原始碼探測成品，以及套件中繼資料／總和檢查碼提交至 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`；完整診斷封存檔則保留在連結的 Actions 成品中。發布程式會在嘗試推送前拒絕任何超過 50 MB 的報告檔案。目前的受測參照指標為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。若 App 權杖建立或報告發布失敗，排程執行及 `profile=release` 分派會失敗。手動非發布分派會將發布維持為提示性質，並在驗證或發布失敗時保留 GitHub 成品。先前的原始碼基準是從公開報告儲存庫匿名擷取，因此成功擷取基準並不能證明發布程式已通過驗證。

## 完整發布驗證

`Full Release Validation` 是用於「發布前執行所有項目」的手動統括工作流程。它接受分支、標籤或完整提交 SHA，並使用該目標分派手動 `CI` 工作流程（包括 Android）、分派 `Plugin Prerelease` 以進行僅限發布的外掛／套件／靜態／Docker 證明、針對目標 SHA 分派 `OpenClaw Performance`，以及分派 `OpenClaw Release Checks` 以進行安裝冒煙測試、套件驗收、跨作業系統套件檢查、QA Lab 一致性、Matrix 與 Telegram 管線（提示性成熟度評分卡呈現可透過 `run_maturity_scorecard` 選擇啟用）。穩定版與完整設定檔一律包含完整的即時／E2E 及 Docker 發布路徑浸泡測試涵蓋範圍；Beta 設定檔可透過 `run_release_soak=true` 選擇啟用。標準套件 Telegram E2E 會在套件驗收內執行，因此完整候選版本不會啟動重複的即時輪詢程式。發布後，傳入 `release_package_spec`，即可在發布檢查、套件驗收、Docker、跨作業系統及 Telegram 中重複使用已發布的 npm 套件，而不必重新建置。僅在針對已發布套件進行聚焦的 Telegram 重新執行時使用 `npm_telegram_package_spec`。Codex 外掛即時套件管線預設使用相同的選定狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA／成品執行則會從選定參照封裝 `extensions/codex`。對於 `npm:`、`npm-pack:` 或 `git:` 規格等自訂外掛來源，請明確設定 `codex_plugin_spec`。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，瞭解
階段矩陣、確切的工作流程工作名稱、設定檔差異、成品，以及
聚焦重新執行控制項。

`OpenClaw Release Publish` 是會變更狀態的手動發布工作流程。在發布標籤
存在且 OpenClaw npm 預檢成功後，從受信任的 `main` 分派
一般 Beta 與穩定版發布（預檢會在其檢查項目中執行
`pnpm plugins:sync:check`）。標籤仍會選取確切的
發布提交，包括 `release/YYYY.M.PATCH` 上的提交；Tideclaw Alpha
發布則繼續使用相符的 Alpha 分支。它需要已儲存的
`preflight_run_id`、成功的
`full_release_validation_run_id` 及其確切的
`full_release_validation_run_attempt`，為所有
可發布的外掛套件分派 `Plugin NPM Release`，為相同的
發布 SHA 分派 `Plugin ClawHub Release`，之後才會分派 `OpenClaw NPM Release`。穩定版發布也
需要確切的 `windows_node_tag`；工作流程會驗證 Windows 原始碼
發布，並在執行任何發布子工作流程之前，將其 x64／ARM64 安裝程式與候選版本已核准的
`windows_node_installer_digests` 輸入比較，接著提升並驗證
相同的固定安裝程式摘要，以及確切的配套成品與總和檢查碼
合約，之後才發布 GitHub 發布草稿。
聚焦的僅限外掛修復使用 `plugin_publish_scope=selected`，並搭配非空的
套件清單。僅限外掛的 `all-publishable` 執行需要與核心發布相同的不可變 npm
預檢及完整發布驗證證據。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上進行固定提交證明，請使用輔助程式，而非
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程分派參照必須是分支或標籤，不能是原始提交 SHA。
輔助程式會在受信任的 `main`
工作流程 SHA 上推送暫時的 `release-ci/<sha>-...` 分支，透過工作流程的 `ref` 輸入傳遞所要求的目標 SHA，
在可用時重複使用嚴格的精確目標證據，驗證每個子
工作流程的 `headSha` 都與受信任的工作流程 SHA 相符，並在執行完成時刪除暫時
分支。傳入 `-f reuse_evidence=false` 可強制執行全新的
驗證。若任何子工作流程使用不同的工作流程 SHA 執行，統括驗證程式也會失敗。

`release_profile` 控制傳入發布檢查的即時／提供者涵蓋廣度。
手動發布工作流程預設為 `stable`；只有在你
刻意需要廣泛的提示性提供者／媒體矩陣時，才使用 `full`。穩定版與完整
發布檢查一律執行完整的即時／E2E 及 Docker 發布路徑浸泡測試；
Beta 設定檔可透過 `run_release_soak=true` 選擇啟用。

- `minimum` 保留最快速且對 OpenAI／核心發布至關重要的管線。
- `stable` 加入穩定的提供者／後端集合。
- `full` 執行廣泛的提示性提供者／媒體矩陣。

統括工作流程會記錄已分派的子執行 ID，而最終的 `Verify full validation` 工作會重新檢查目前的子執行結論，並附加每個子執行最慢工作的表格。如果重新執行子工作流程後變為通過，只需重新執行父層驗證程式工作，即可重新整理統括結果與時間摘要。

為進行復原，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。發布候選版本使用 `all`，僅執行一般完整 CI 子工作流程使用 `ci`，僅執行外掛預發布子工作流程使用 `plugin-prerelease`，僅執行 OpenClaw 效能子工作流程使用 `performance`，執行所有發布子工作流程使用 `release-checks`，或在統括工作流程上使用較窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這可讓失敗的發布環境在聚焦修正後，將重新執行範圍維持在有限範圍內。對於單一失敗的跨作業系統管線，可將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合，例如 `windows/packaged-upgrade`；長時間執行的跨作業系統命令會輸出心跳偵測行，而已封裝的升級摘要則包含各階段的時間。除標準執行階段工具涵蓋範圍閘門外，QA 發布檢查管線皆為提示性；當必要的 OpenClaw 動態工具與標準層級摘要不一致或從中消失時，該閘門會阻止通過。

`OpenClaw Release Checks` 使用受信任的工作流程參照，將選定參照解析一次並產生 `release-package-under-test` tarball，接著將該成品傳遞給跨作業系統檢查與套件驗收；執行浸泡測試涵蓋範圍時，也會傳遞給即時／E2E 發布路徑 Docker 工作流程。這可讓不同發布環境使用一致的套件位元組，並避免在多個子工作中重複封裝相同的候選版本。對於 Codex npm 外掛即時管線，發布檢查會傳入從 `release_package_spec` 衍生的相符已發布外掛規格、傳入操作人員提供的 `codex_plugin_spec`，或將輸入留空，使 Docker 指令碼封裝選定簽出中的 Codex 外掛。

`ref=main` 與 `rerun_group=all` 的重複 `Full Release Validation`
執行會取代較舊的統括工作流程。父層監控程式會在父層取消時，取消其
已分派的所有子工作流程，因此較新的 main 驗證
不會排在過時且耗時兩小時的發布檢查執行之後。發布分支／標籤
驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## 即時與 E2E 分片

發布即時／E2E 子工作流程保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但會透過 `scripts/test-live-shard.mjs` 將其作為具名分片執行，而不是單一循序工作：

- `native-live-src-agents` 與 `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- 依提供者篩選的 `native-live-src-gateway-profiles` 工作
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒體音訊／視訊分片，以及依提供者篩選的音樂分片

這會維持相同的檔案涵蓋範圍，同時讓緩慢的即時提供者失敗更容易重新執行與診斷。彙總的 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` 分片名稱仍可用於手動單次重新執行。

原生即時媒體分片會在由 `Live Media Runner Image` 工作流程建置的 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行。該映像預先安裝 `ffmpeg` 與 `ffprobe`；媒體工作只會在設定前驗證二進位檔。請讓 Docker 支援的即時測試套件在一般 Blacksmith 執行器上執行——容器工作不適合啟動巢狀 Docker 測試。

Docker 支援的即時模型／後端分片會針對每個選定提交使用獨立的共用 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 映像。即時發布工作流程只會建置並推送該映像一次，接著 Docker 即時模型、依提供者分片的閘道、命令列介面後端、ACP 繫結及 Codex 測試框架分片會使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片在工作流程工作逾時之前，會套用明確的指令碼層級 `timeout` 上限，使卡住的容器或清理路徑能快速失敗，而不會耗盡整個發布檢查預算。如果這些分片各自重新建置完整的原始碼 Docker 目標，表示發布執行設定錯誤，並會因重複建置映像而浪費經過時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件能否作為產品正常運作？」時，請使用 `Package Acceptance`。它與一般 CI 不同：一般 CI 驗證原始碼樹，而套件驗收則透過使用者在安裝或更新後會使用的同一套 Docker E2E 測試框架，驗證單一 tarball。

### 工作

1. `resolve_package` 會簽出 `workflow_ref`、解析一個套件候選項目、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者上傳為 `package-under-test` 成品，並在 GitHub 步驟摘要中輸出來源、工作流程參照、套件參照、版本、SHA-256 與設定檔。
2. `package_integrity` 會下載 `package-under-test` 成品，並使用 `scripts/check-openclaw-package-tarball.mjs` 強制執行公開套件 tarball 合約。
3. `docker_acceptance` 會使用解析出的套件來源 SHA（若無則退回 `workflow_ref`）及 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重複使用的工作流程會下載該成品、驗證 tarball 清單、在需要時準備套件摘要 Docker 映像，並針對該套件執行選取的 Docker 執行路徑，而非封裝工作流程的簽出內容。當設定檔選取多個目標 `docker_lanes` 時，可重複使用的工作流程會只準備一次套件與共用映像，接著將這些執行路徑展開為平行的目標 Docker 工作，且各自使用唯一成品。
4. `package_telegram` 可選擇呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不等於 `none` 時便會執行；若「套件驗收」解析出 `package-under-test` 成品，則會安裝相同成品；獨立的 Telegram 分派仍可安裝已發布的 npm 規格。
5. 若套件解析、完整性、Docker 驗收或選用的 Telegram 執行路徑失敗，`summary` 會讓工作流程失敗。`advisory` 輸入會將驗收失敗降級為警告，供諮詢性呼叫端使用。

### 候選來源

- `source=npm` 僅接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或如 `openclaw@2026.4.27-beta.2` 的確切 OpenClaw 發行版本。請用於已發布的延伸穩定版、預先發行版或穩定版驗收。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支／標籤、驗證選取的提交可從儲存庫分支歷史或發行標籤抵達、在分離的工作樹中安裝相依套件，並使用 `scripts/package-openclaw-for-docker.mjs` 將其封裝。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 認證資訊、非預設 HTTPS 連接埠、私人／內部／特殊用途主機名稱或解析後的 IP，以及重新導向至不符合相同公開安全政策的位置。
- `source=trusted-url` 會依據 `.github/package-trusted-sources.json` 中指定的受信任來源政策，下載 HTTPS `.tgz`；必須提供 `package_sha256` 與 `trusted_source_id`。僅將此方式用於維護者擁有的企業鏡像或私人套件儲存庫，且這些來源需要設定主機、連接埠、路徑前綴、重新導向主機或私人網路解析。若政策宣告使用持有人驗證，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密鑰；仍會拒絕嵌入 URL 的認證資訊。
- `source=artifact` 會從 `artifact_run_id` 與 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選用，但針對對外共用的成品應提供此值。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程／測試框架程式碼。當 `source=ref` 時，`package_ref` 是要封裝的來源提交。如此一來，目前的測試框架便能驗證較舊的受信任來源提交，而不必執行舊的工作流程邏輯。

### 套件組設定檔

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — 使用即時 `plugins` 涵蓋範圍取代 `plugins-offline` 的 `package` 集合，另加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 發行路徑區塊
- `custom` — 確切的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` 設定檔使用離線外掛涵蓋範圍，因此已發布套件的驗證不會受限於 ClawHub 的即時可用性。選用的 Telegram 執行路徑會在 `NPM Telegram Beta E2E` 中重複使用 `package-under-test` 成品，並保留已發布 npm 規格路徑供獨立分派使用。

如需專用的更新與外掛測試政策，包括本機命令、
Docker 執行路徑、套件驗收輸入、發行預設值與失敗分流，
請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發行檢查會使用 `source=artifact`、準備完成的發行套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 與 `telegram_mode=mock-openai` 呼叫「套件驗收」。這能讓套件遷移、更新、即時 ClawHub Skill 安裝、過時外掛相依套件清理、已設定外掛的安裝修復、離線外掛、外掛更新與 Telegram 證明使用相同的已解析套件 tarball。發布 beta 版後，在「完整發行驗證」或「OpenClaw 發行檢查」中設定 `release_package_spec`，即可針對已發布的 npm 套件執行相同矩陣，而不需重新建置；僅當「套件驗收」需要使用不同於其餘發行驗證的套件時，才設定 `package_acceptance_package_spec`。跨作業系統發行檢查仍涵蓋各作業系統特有的初始設定、安裝程式與平台行為；套件／更新產品驗證應從「套件驗收」開始。

`published-upgrade-survivor` Docker 執行路徑會在阻擋式發行路徑的每次執行中驗證一個已發布套件基準。在「套件驗收」中，解析出的 `package-under-test` tarball 一律為候選套件，而 `published_upgrade_survivor_baseline` 會選取備用的已發布基準，預設為 `openclaw@latest`；失敗執行路徑的重新執行命令會保留該基準。搭配 `run_release_soak=true` 或 `release_profile=full` 的「完整發行驗證」會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 與 `published_upgrade_survivor_scenarios=reported-issues`，以擴展至最新四個穩定 npm 發行版、釘選的外掛相容性邊界發行版，以及針對 Feishu 設定、保留的啟動程序／角色檔案、已設定的 OpenClaw 外掛安裝、波浪號日誌路徑與過時舊版外掛相依套件根目錄所設計的問題情境固定資料。多基準的已發布升級存續測試選項會依基準分片至不同的目標 Docker 執行器工作。當問題是完整的已發布更新清理，而不是一般「完整發行 CI」涵蓋範圍時，獨立的 `Update Migration` 工作流程會使用搭配 `all-since-2026.4.23` 基準與 `plugin-deps-cleanup` 情境的 `update-migration` Docker 執行路徑。本機彙總執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入確切套件規格、使用如 `openclaw@2026.4.15` 的 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一執行路徑，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用情境矩陣。已發布套件執行路徑會使用內建的 `openclaw config set` 命令配方設定基準、在 `summary.json` 中記錄配方步驟，並在閘道啟動後探測 `/healthz`、`/readyz` 與 RPC 狀態。Windows 封裝版與安裝程式全新安裝執行路徑也會驗證已安裝套件能從原始的 Windows 絕對路徑匯入瀏覽器控制覆寫。OpenAI 跨作業系統代理程式回合冒煙測試會在設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.6-luna`，讓安裝與閘道證明採用成本較低的 GPT-5.6 測試層級。

### 舊版相容性期間

「套件驗收」針對已發布套件設有範圍受限的舊版相容性期間。截至 `2026.4.25` 的套件（包括 `2026.4.25-beta.*`）可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私人 QA 項目可能指向 tarball 未包含的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可略過 `gateway install --wrapper` 持久性子案例；
- `update-channel-switch` 可從衍生自 tarball 的模擬 Git 固定資料中移除缺少的 pnpm `patchedDependencies`，也可記錄缺少的持久化 `update.channel`；
- 外掛冒煙測試可讀取舊版安裝記錄位置，或接受缺少市集安裝記錄持久化；
- `plugin-update` 可允許設定中繼資料遷移，但仍要求安裝記錄與不重新安裝行為維持不變。

已發布的 `2026.4.26` 套件也可針對已隨套件發布的本機建置中繼資料戳記檔案發出警告，而截至 `2026.5.20` 的套件在缺少 `npm-shrinkwrap.json` 時可發出警告而非失敗。之後的套件必須符合現代合約；相同條件會導致失敗，而非警告或略過。

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

# 使用套件涵蓋範圍驗證已發布的延伸穩定版套件。
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

# 驗證來自具名受信任私人鏡像政策的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 重複使用由另一個 Actions 執行上傳的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

偵錯失敗的套件驗收執行時，請先查看 `resolve_package` 摘要，確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、執行路徑日誌、階段計時與重新執行命令。請優先重新執行失敗的套件設定檔或確切 Docker 執行路徑，而非重新執行完整發行驗證。

## 安裝冒煙測試

`Install Smoke` 工作流程不再於提取要求或 `main` 推送時執行。其每夜／手動包裝工作流程與發行驗證都會呼叫唯讀的 `install-smoke-reusable.yml` 核心，且每次執行都會在 GitHub 託管的執行器上走完完整的安裝冒煙測試路徑：

- 每個目標 SHA 僅建置一次根 Dockerfile 冒煙測試映像，並將其繫結至不可變成品中的工作流程修訂版本與產生者執行嘗試，接著由命令列介面冒煙測試、代理程式刪除共用工作區的命令列介面冒煙測試、容器閘道網路端對端測試，以及內建 `matrix` 外掛建置引數冒煙測試載入。外掛冒煙測試會驗證執行階段相依套件安裝鏡像，以及外掛載入時不會出現進入點逸出診斷。
- QR 套件安裝與安裝程式／更新 Docker 冒煙測試（包括 Rocky Linux 安裝程式執行路徑，以及針對可設定 `update_baseline_version` npm 基準的更新執行路徑）會以獨立工作執行，讓安裝程式工作不必等待根映像冒煙測試完成。

慢速的 Bun 全域安裝映像提供者冒煙測試由 `run_bun_global_install_smoke` 單獨控管。它會依夜間排程執行，對來自發布檢查的工作流程呼叫預設啟用，而手動 `Install Smoke` 分派可選擇啟用。一般 PR CI 仍會針對與 Node 相關的變更執行快速的 Bun 啟動器迴歸測試通道。QR 與安裝程式 Docker 測試則保留各自聚焦於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用的即時測試映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式、更新與外掛相依性測試通道的純 Node/Git 執行器；
- 將同一個 tarball 安裝至 `/app`，供一般功能測試通道使用的功能完整映像。

Docker 測試通道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，而執行器只會執行選定的計畫。排程器透過 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個測試通道選取映像，接著使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行測試通道。

### 可調整項目

| 變數                               | 預設值 | 用途                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般測試通道的主集區插槽數。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對提供者敏感的尾端集區插槽數。                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 即時測試通道並行上限，避免提供者節流。                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | npm 安裝測試通道並行上限。                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 多服務測試通道並行上限。                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 測試通道啟動之間的錯開時間，以避免 Docker 常駐程式發生大量建立作業；設為 `0` 則不錯開。     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個測試通道的備援逾時（120 分鐘）；選定的即時／尾端測試通道使用更嚴格的上限。           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定   | `1` 會列印排程器計畫，但不執行測試通道。                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定   | 以逗號分隔的確切測試通道清單；略過清理冒煙測試，讓代理程式可重現單一失敗的測試通道。 |

比其有效上限更重的測試通道仍可從空集區啟動，之後會單獨執行，直到釋放容量為止。本機彙總作業會預先檢查 Docker、移除過時的 OpenClaw E2E 容器、輸出作用中測試通道狀態、保存測試通道耗時以供最長優先排序，且預設會在第一次失敗後停止排程新的集區測試通道。

### 可重複使用的即時／E2E 工作流程

可重複使用的即時／E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 所需的套件、映像種類、即時映像、測試通道及認證資訊涵蓋範圍。接著 `scripts/docker-e2e.mjs` 會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行作業的套件成品，或從 `package_artifact_run_id` 下載套件成品，然後驗證 tarball 內容清單。預設的 `no-push-artifact` 路徑會透過 Blacksmith 的 Docker 層快取，建置以套件摘要標記的純執行／功能完整映像，將映像的確切位元組打包成不可變工作流程成品，並由每個取用者驗證及載入該成品。`existing-only` 則要求明確指定 `docker_e2e_bare_image`/`docker_e2e_functional_image` GHCR 參照，且絕不建置或推送。這些登錄檔提取作業的每次嘗試逾時上限為 180 秒，讓卡住的串流能快速重試，而不會占用大部分 CI 關鍵路徑。排程驗證成功後，`openclaw-scheduled-live-checks.yml` 會將不可變的已測試映像資訊清單傳給獨立的套件寫入發布器；唯讀的正式發布與預發布呼叫端絕不會經過該寫入器。

### 發布路徑分塊

發布 Docker 涵蓋範圍會使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊作業，讓每個分塊只驗證並載入自身所需、由成品支援的映像種類（或在明確使用 `existing-only` 重複使用時提取映像），並透過同一個加權排程器執行多個測試通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

目前的發布 Docker 分塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`，以及 `openwebui`。`package-update-openai` 包含即時 Codex 外掛套件測試通道，該通道會安裝候選 OpenClaw 套件、從 `codex_plugin_spec` 安裝 Codex 外掛，或在明確核准安裝 Codex CLI 的情況下安裝相同參照的 tarball、執行 Codex CLI 預先檢查，然後透過 OpenAI 執行多個同工作階段的 OpenClaw 代理程式回合。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍為彙總外掛／執行階段別名。`install-e2e` 測試通道別名仍為兩個提供者安裝程式測試通道的彙總手動重新執行別名。

每當穩定版或完整發布路徑涵蓋範圍要求時，OpenWebUI 都會在專用的大容量磁碟 Blacksmith 執行器上，作為獨立的 `openwebui` 分塊執行，即使可重複使用的工作流程將支援的作業路由至 GitHub 託管的執行器也是如此。將外部映像提取作業分開，可防止大型映像與 `plugins-runtime-services` 中的共用套件及外掛映像競爭；舊版彙總外掛／執行階段分塊仍包含 OpenWebUI，以支援相容的手動重新執行。內建通道更新測試通道會針對暫時性的 npm 網路失敗重試一次。

每個分塊都會上傳 `.artifacts/docker-tests/`，其中包含測試通道記錄、耗時、`summary.json`、`failures.json`、階段耗時、排程器計畫 JSON、慢速測試通道表格，以及各測試通道的重新執行命令。工作流程的 `docker_lanes` 輸入會使用為該次執行準備的映像來執行選定的測試通道，而非使用分塊作業，讓失敗測試通道的偵錯範圍限制在單一目標 Docker 作業內；若選定的測試通道是即時 Docker 測試通道，目標作業會在本機為該次重新執行建置即時測試映像。重新執行輔助工具會驗證失敗成品中確切選定的目標 SHA，而手動分派會重新打包該參照，因為內部可重複使用工作流程的套件元組不屬於 `workflow_dispatch` 結構描述。產生的命令只有在準備好的映像輸入由 GHCR 支援時，才會包含這些輸入與 `shared_image_policy=existing-only`；執行器本機成品標記會被省略，讓新的執行器重新建置它們。除非成品能證明復原的 GHCR 映像參照與明確的目標覆寫相符，否則目標覆寫會捨棄這些參照。成品產生的工作流程定義參照也會被省略，因為完整發布的暫存分支會遭刪除；除非操作人員明確覆寫，否則分派會使用儲存庫的預設分支。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker 成品並列印合併及各測試通道的目標重新執行命令
pnpm test:docker:timings <summary>   # 慢速測試通道與階段關鍵路徑摘要
```

排程的即時／E2E 工作流程會每日執行完整的發布路徑 Docker 套件，並在成功後針對確切的已測試映像成品叫用明確的發布器。

## 外掛預發布

`Plugin Prerelease` 是成本較高的產品／套件涵蓋範圍，因此它是由 `Full Release Validation` 或操作人員明確分派的獨立工作流程。一般提取要求、`main` 推送及獨立手動 CI 分派都不會啟用該套件。它會在八個擴充套件工作節點之間平衡內建外掛測試；這些擴充套件分片作業一次最多執行兩個外掛設定群組，每個群組使用一個 Vitest 工作執行緒，並配置較大的 Node 堆積記憶體，使大量匯入的外掛批次不會建立額外的 CI 作業。僅限發布的 Docker 預發布路徑（由 `full_release_validation` 輸入啟用）會以每四個為一組批次執行目標 Docker 測試通道，避免為僅需一到三分鐘的作業保留數十個執行器。此工作流程也會從 `@openclaw/plugin-inspector` 上傳資訊性的 `plugin-inspector-advisory` 成品；檢查器發現是分流處理的輸入，不會變更具阻擋作用的外掛預發布閘門。

## QA 實驗室

QA 實驗室在主要智慧範圍工作流程之外設有專用 CI 測試通道。代理式一致性包含在廣泛的 QA 與發布測試框架中，而非獨立的 PR 工作流程。當一致性應隨廣泛驗證執行時，請搭配 `rerun_group=qa-parity` 使用 `Full Release Validation`。

- `QA-Lab - All Lanes` 工作流程會依 `main` 每夜執行，也可手動分派；它會將模擬一致性測試通道、即時 Matrix 測試通道，以及即時 Telegram 與 Discord 測試通道展開為平行作業。即時作業使用 `qa-live-shared` 環境，而 Telegram／Discord 使用 Convex 租用資源。

發布檢查會搭配確定性的模擬提供者與符合模擬資格的模型（`mock-openai/gpt-5.6-luna` 和 `mock-openai/gpt-5.6-luna-alt`），執行 Matrix 與 Telegram 即時傳輸測試通道，讓通道合約不受即時模型延遲與一般提供者外掛啟動的影響。即時傳輸閘道會停用記憶體搜尋，因為 QA 一致性會另外涵蓋記憶體行為；提供者連線能力則由獨立的即時模型、原生提供者及 Docker 提供者套件涵蓋。

Matrix 會在排程與發布閘門中使用 `--profile fast`，且僅在簽出的命令列介面支援時加入 `--fail-fast`。命令列介面的預設值與手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 分派一律會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在核准發布前執行發布關鍵的 QA 實驗室測試通道；其 QA 一致性閘門會將候選與基準套件作為平行測試通道作業執行，接著將兩者的成品下載至小型報告作業，以進行最終一致性比較。

對一般 PR，請依循限定範圍的 CI／檢查證據，而不要將一致性視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意設計為範圍狹窄的第一階段安全掃描器，而非完整的儲存庫掃描。每日、手動、`main` 推送，以及非草稿提取要求的防護執行，會掃描 Actions 工作流程程式碼與風險最高的 JavaScript/TypeScript 介面，並使用高信賴度的安全性查詢，篩選出高／重大 `security-severity`。

提取要求防護維持輕量：只有在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或擁有程序的內建外掛執行階段路徑下發生變更時才會啟動，並執行與排程工作流程相同的高信賴度安全性矩陣。Android 與 macOS CodeQL 不包含在 PR 預設項目中。

### 安全性類別

| 類別                                              | 範圍                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、機密資訊、沙箱、排程與閘道基準                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | 核心頻道實作合約，以及頻道外掛執行階段、閘道、外掛 SDK、機密資訊與稽核接觸點              |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、網頁擷取與外掛 SDK SSRF 政策介面                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞與代理程式工具執行閘門                                           |
| `/codeql-security-high/process-exec-boundary`     | 本機殼層、程序啟動輔助工具、擁有子程序的內建外掛執行階段，以及工作流程指令碼黏合層                             |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、資訊清單、登錄檔、套件管理器安裝、原始碼載入，以及外掛 SDK 套件合約信任介面 |

### 平台特定的安全性分片

- `CodeQL Android Critical Security` — 排程執行的 Android 安全性分片。在工作流程健全性檢查所接受的最小型 Blacksmith Linux 執行器上，手動建置 Android 應用程式以供 CodeQL 使用。以上傳名稱 `/codeql-critical-security/android` 上傳。
- `CodeQL macOS Critical Security` — 每週／手動執行的 macOS 安全性分片。在 Blacksmith macOS 上手動建置 macOS 應用程式以供 CodeQL 使用，從上傳的 SARIF 中篩除相依項目建置結果，並以上傳名稱 `/codeql-critical-security/macos` 上傳。此分片不納入每日預設執行項目，因為即使結果無異常，macOS 建置仍會占用大部分執行時間。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全性分片。它僅在 GitHub 託管的 Linux 執行器上，針對範圍狹窄但價值高的介面執行錯誤嚴重性等級的非安全性 JavaScript/TypeScript 品質查詢，讓品質掃描不會耗用 Blacksmith 執行器註冊預算。其提取要求防護刻意比排程設定檔更小：非草稿 PR 僅針對其觸及的介面執行對應分片，這些分片來自 13 個可由 PR 路由的分片 — `agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 和 `session-diagnostics-boundary`。`ui-control-plane` 與 `web-media-runtime-boundary` 不會在 PR 執行中使用。CodeQL 設定與品質工作流程變更會執行完整的 PR 分片集（網路執行階段分片會根據其本身的 CodeQL 設定檔與擁有網路功能的原始碼路徑觸發）。

手動分派接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

這些範圍較窄的設定檔是教學／反覆調整用的掛鉤，可供單獨執行一個品質分片。

| 類別                                                    | 範圍                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、機密資訊、沙箱、排程與閘道安全性邊界程式碼                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化與 IO 合約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道通訊協定結構描述與伺服器方法合約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心頻道與內建頻道外掛實作合約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型／供應商分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接器、程序監督輔助工具，以及對外傳遞合約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶主機 SDK、記憶執行階段外觀介面、記憶外掛 SDK 別名、記憶執行階段啟用黏合層，以及記憶 doctor 命令                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | 網路政策套件、原始通訊端與 Proxy 擷取執行階段、SSH 通道、閘道鎖定、JSONL 通訊端，以及推播傳輸介面                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部實作、工作階段傳遞佇列、對外工作階段繫結／傳遞輔助工具、診斷事件／記錄套件介面，以及工作階段 doctor 命令列介面合約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 傳入回覆分派、回覆承載資料／分塊／執行階段輔助工具、頻道回覆選項、傳遞佇列，以及工作階段／討論串繫結輔助工具             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、供應商驗證與探索、供應商執行階段註冊、供應商預設值／目錄，以及網頁／搜尋／擷取／嵌入登錄檔    |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動程序、本機持久化、閘道控制流程，以及工作控制平面執行階段合約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取／搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄檔、公開介面與外掛 SDK 進入點合約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端的外掛 SDK 原始碼與外掛套件合約輔助工具                                                                                      |

品質與安全性保持分離，因此可以排程、衡量、停用或擴充品質發現，而不會模糊安全性訊號。只有在這些範圍較窄的設定檔具備穩定的執行時間與訊號後，才應以限定範圍或分片的後續工作，重新加入 Swift、Python 與內建外掛的 CodeQL 擴充。

## 維護工作流程

### 文件代理程式

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於使現有文件與近期合併的變更保持一致。它沒有單純的排程：`main` 上由非 Bot 推送所產生且成功的 CI 執行可以觸發它，手動分派也可以直接執行它。當 `main` 已有後續進展，或過去一小時內已建立另一個未略過的文件代理程式執行時，工作流程執行所觸發的呼叫會略過。執行時，它會檢閱從前一個未略過的文件代理程式來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件檢查後累積的所有 main 變更。

### 測試效能代理程式

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於處理緩慢的測試。它沒有單純的排程：`main` 上由非 Bot 推送所產生且成功的 CI 執行可以觸發它，但如果當個 UTC 日已有另一個工作流程執行呼叫曾執行或正在執行，便會略過。手動分派會略過這項每日活動閘門。此路徑會建立按群組分類的完整測試套件 Vitest 效能報告，只允許 Codex 進行保留涵蓋率的小型測試效能修正，而非大範圍重構，接著重新執行完整測試套件報告，並拒絕會降低基準通過測試數量的變更。分組報告會記錄 Linux 與 macOS 上每個設定的實際經過時間及最大 RSS，因此前後比較會在時間差異旁呈現測試記憶體差異。如果基準有失敗的測試，Codex 只能修正明顯的失敗，且代理程式執行後的完整測試套件報告必須通過，才會提交任何內容。當 `main` 在 Bot 推送完成前已有後續進展，此路徑會重定基底經驗證的修補、重新執行 `pnpm check:changed`，並重試推送；發生衝突的過時修補會略過。它使用 GitHub 託管的 Ubuntu，使 Codex action 能維持與文件代理程式相同的移除 sudo 安全措施。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是維護者用於合併後清理重複項目的手動工作流程。其預設為試執行，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 前，它會確認已合併落地的 PR，並確認每個重複 PR 具有共同參照的議題或重疊的變更區塊。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機變更路徑邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求，比廣泛的 CI 平台範圍更嚴格：

- 核心正式環境變更會執行核心正式環境與核心測試型別檢查，以及核心 lint／防護檢查；
- 僅限核心測試的變更只會執行核心測試型別檢查與核心 lint；
- 擴充功能正式環境變更會執行擴充功能正式環境與擴充功能測試型別檢查，以及擴充功能 lint；
- 僅限擴充功能測試的變更會執行擴充功能測試型別檢查與擴充功能 lint；
- 公開外掛 SDK 或外掛合約變更會擴大至擴充功能型別檢查，因為擴充功能依賴這些核心合約（Vitest 擴充功能全面測試仍屬於明確的測試工作）；
- 僅限發行中繼資料的版本遞增會執行針對性的版本／設定／根層級相依項目檢查；
- 未知的根層級／設定變更會採取安全失敗策略，執行所有檢查路徑。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更省資源：直接修改的測試會自行執行；原始碼修改會優先採用明確對應，接著執行同層級測試與匯入圖中的相依項目。共用群組聊天室傳遞設定是其中一項明確對應：群組可見回覆設定、來源回覆傳遞模式或訊息工具系統提示的變更，會經由核心回覆測試以及 Discord 和 Slack 傳遞迴歸測試進行路由，讓共用預設值的變更能在首次推送 PR 前失敗。只有當變更涵蓋整個測試框架，使廉價的對應測試集不再是可信的替代指標時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是儲存庫自有的遠端機器包裝工具，用於維護者的 Linux 驗證。僅當來源可信且現有相依套件已安裝完成時，Agent
工作階段才會在本機執行一個或少數幾個聚焦測試與低成本靜態檢查。較大型的測試套件與
運算密集型工作則使用 Crabbox，包括建置、型別檢查、分流執行 lint、
Docker、套件工作流程、E2E、即時驗證，以及與 CI 環境的一致性驗證。可信維護者的高負載
驗證預設使用 `blacksmith-testbox`，而 `.crabbox.yaml` 現在也預設使用它。其設定的
工作流程會載入供應商與 Agent 的認證資訊，因此不可信的貢獻者或
分支程式碼必須改用不含機密資訊的分支 CI，或經過環境淨化、直接執行的 AWS Crabbox。
經淨化的 AWS 執行會設定 `CRABBOX_ENV_ALLOW=CI`、傳入
`--no-hydrate`，並使用全新的暫時遠端 `HOME`；這可防止儲存庫的
`OPENCLAW_*` 允許清單與現有驗證設定檔接觸不可信程式碼。
這些執行會使用專供該不可信來源、全新預熱的租用環境，絕不使用
可信或先前載入過認證資訊的租用環境。請從乾淨且可信的 `main` 簽出中
啟動已安裝的可信 Crabbox 執行檔，並僅使用
`--fresh-pr` 擷取遠端 PR；絕不在本機執行不可信簽出中的包裝工具或設定。
取消設定 `CRABBOX_AWS_INSTANCE_PROFILE`，且除非解析後的
`aws.instanceProfile` 為空，否則應採取失敗關閉。在執行任何安裝或測試前，請使用可信的
絕對路徑工具要求 IMDSv2 權杖、證明 IAM 認證資訊
端點回傳 404，並將遠端 `git rev-parse HEAD` 與完整的
已審查 PR 前端 SHA 比對。將租用環境繫結至該 SHA，並在前端變更時停止並重新預熱。
將乾淨 `main` 中可信的 `scripts/crabbox-untrusted-bootstrap.sh`
連同 `--fresh-pr` 一起上傳；它會安裝固定版本的 Node/pnpm、驗證 SHA 與
套件管理工具版本固定設定、隔離 `HOME`、安裝相依套件，然後執行
所要求的測試。
取消設定所有 `CRABBOX_TAILSCALE*` 覆寫、強制使用 `--network public
--tailscale=false`、清除出口節點／LAN 旗標，並要求 `crabbox inspect` 在上傳任何指令碼前
回報使用公用網路且沒有 Tailscale 狀態。
自有的 AWS/Hetzner 容量也仍是 Blacksmith 發生中斷、
配額問題，或明確要求使用自有容量測試時的備援方案。

Agent 不會為預期中的工作預先預熱。請在第一個高負載命令準備好時
才取得 Testbox，後續高負載命令重複使用回傳的 `tbx_...` ID，
每次執行都同步目前的簽出，並在交接前停止。

由 Crabbox 支援的 Blacksmith 執行會預熱、認領、同步、執行、回報並清理
一次性 Testbox。內建同步健全性檢查會在同步後的機器上
`git status --short` 顯示至少 200 個已追蹤檔案遭刪除時快速失敗，
藉此偵測 `pnpm-lock.yaml` 等根目錄檔案消失的情況。對於有意進行
大量刪除的 PR，請為遠端命令設定 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

如果本機 Blacksmith 命令列介面呼叫停留在同步階段超過五分鐘，
且同步後沒有任何輸出，Crabbox 也會終止該呼叫。設定
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用此防護；若本機差異異常龐大，
也可使用較大的毫秒值。

首次執行前，請從儲存庫根目錄檢查包裝工具：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

若過時的 Crabbox 執行檔未宣告支援所選供應商，儲存庫包裝工具會拒絕使用；由 Blacksmith 支援的執行則要求 Crabbox 0.22.0 或更新版本，確保包裝工具具備目前的 Testbox 同步、佇列與清理行為。在 Codex 工作樹或連結／稀疏簽出中，請避免使用本機 `pnpm crabbox:run` 指令碼，因為 pnpm 可能會在 Crabbox 啟動前重新協調相依套件；請改為直接呼叫 Node 包裝工具：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用相鄰簽出時，請先重新建置已忽略的本機執行檔，再進行計時或驗證工作：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` 中的 `blacksmith:` 區塊已固定組織、工作流程、工作與參照的預設值，因此下列明確旗標皆為選用。變更閘門：

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

當本機相依套件無法使用，或目標會分流執行時，在 Testbox 上重新執行聚焦測試：

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

請讀取最終 JSON 摘要。實用欄位為 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 與 `totalMs`。對於委派的
Blacksmith Testbox 執行，Crabbox 包裝工具的結束代碼與 JSON 摘要就是
命令結果。連結的 GitHub Actions 執行負責載入環境與維持連線；若 SSH
命令已回傳後 Testbox 才由外部停止，它可能會以 `cancelled` 結束。
除非包裝工具的 `exitCode` 不為零，或命令輸出顯示測試失敗，
否則應將其視為清理／狀態附帶結果。
由 Blacksmith 支援的一次性 Crabbox 執行應自動停止 Testbox；
若執行遭中斷或清理狀態不明，請檢查仍在運作的機器，且僅停止
你所建立的機器：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

僅在確實需要於同一個已載入環境的機器上執行多個命令時，才使用重複使用功能：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

請重複使用租用環境，而非過時的來源。省略 `--no-sync`，讓每次執行都上傳
目前的簽出；僅在有意重新執行未變更、已同步的檔案樹時才使用它。
不可信的貢獻者／分支程式碼必須在每個命令中使用
`CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate`，以及全新的
暫時遠端 `HOME`；請先在該經淨化的命令中安裝相依套件，再進行測試。
僅可重複使用專供同一不可信來源、全新預熱的租用環境；絕不可使用可信或先前
載入過認證資訊的租用環境。絕不在本機執行不可信簽出中的包裝工具或設定：
請從乾淨且可信的 `main` 啟動已安裝的可信 Crabbox 執行檔，並在每次
執行時傳入 `--fresh-pr`。保持 `CRABBOX_AWS_INSTANCE_PROFILE` 未設定、拒絕解析後
非空的執行個體設定檔、要求可信遠端 IMDS 無角色證明，並在安裝／測試前驗證
已審查的前端 SHA。將租用環境繫結至該 SHA；每次前端變更後都應停止並
重新預熱。若沒有遠端 PR，請使用不含機密資訊的分支 CI。
絕不可為不可信來源選擇 `hydrate-github`，或載入認證資訊的 Blacksmith 工作流程。

若故障層位於 Crabbox，但 Blacksmith 本身運作正常，則僅可將直接
Blacksmith 用於 `list`、`status` 與清理等診斷工作。在將直接 Blacksmith
執行視為維護者驗證前，必須先修復 Crabbox 路徑。

若 `blacksmith testbox list --all` 與 `blacksmith testbox status` 可正常運作，但新的
預熱在幾分鐘後仍停留於 `queued`，且沒有 IP 或 Actions 執行 URL，
請將其視為 Blacksmith 供應商、佇列、計費或組織限制壓力。停止你建立的
排隊中 ID，避免啟動更多 Testbox，並將驗證移至下方的
自有 Crabbox 容量路徑，同時由其他人檢查 Blacksmith 儀表板、
計費與組織限制。

僅當 Blacksmith 中斷、受到配額限制、缺少所需環境，或明確以自有容量為目標時，才升級至自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

AWS 容量吃緊時，除非工作確實需要 48xlarge 等級的 CPU，否則請避免使用 `class=beast`。一次 `beast` 請求會從 192 個 vCPU 起跳，是最容易觸發區域性 EC2 Spot 或 On-Demand Standard 配額的方式。儲存庫自有的 `.crabbox.yaml` 預設使用 `class: standard`、隨需市場與 `capacity.hints: true`，讓由代理服務配置的 AWS 租用環境輸出所選區域／市場、配額壓力、Spot 備援與高壓力機器等級警告。較繁重的廣泛檢查請使用 `fast`；只有在 standard/fast 不足時才使用 `large`；`beast` 則僅用於例外的 CPU 密集型工作流程，例如完整測試套件或全外掛 Docker 矩陣、明確的發行／阻擋問題驗證，或高核心數效能分析。請勿將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint／型別檢查、小型 E2E 重現，或 Blacksmith 中斷分流。容量診斷請使用 `--market on-demand`，避免將 Spot 市場波動混入訊號。

`.crabbox.yaml` 管理供應商、同步與 GitHub Actions 環境載入預設值。Crabbox 同步絕不傳輸 `.git`，因此已載入環境的 Actions 簽出會保留自身的遠端 Git 中繼資料，而不會同步維護者本機的遠端設定與物件儲存區；儲存庫設定也會排除不應傳輸的本機執行階段／建置產物，例如 `.artifacts` 與測試報告。`.github/workflows/crabbox-hydrate.yml` 管理簽出、Node/pnpm 設定、`origin/main` 擷取，以及自有雲端 `crabbox run --id <cbx_id>` 命令所需的非機密環境交接。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [開發管道](/zh-TW/install/development-channels)
