---
read_when:
    - 你需要瞭解 CI 工作為何有執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次版本發布驗證執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送機制
summary: CI 作業圖、範圍閘門、發布總括流程，以及對應的本機命令
title: CI 流水線
x-i18n:
    generated_at: "2026-07-22T10:27:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00e6d48d543001ee40472d14e059a040714ed31ab2d59b83ebd566c6f1e32db1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在推送至 `main` 時執行（觸發時會忽略 Markdown 與 `docs/**` 路徑）、在每個非草稿 PR 上執行，以及透過手動分派執行。
標準 `main` 推送採單一執行：`CI` 並行群組允許一個
完整整合週期執行，同時 GitHub 僅保留最新的待處理推送。
新的合併會取代該待處理執行，而不是取消已經
註冊 Blacksmith 矩陣的工作。PR 仍會取消已被取代的分支最新提交，
而手動分派則使用隔離的群組。`preflight` 會分類差異，並在
只有不相關區域變更時關閉高成本執行通道。手動
`workflow_dispatch` 執行會刻意略過智慧範圍限定，並展開
完整圖形，以用於候選版本與廣泛驗證。Android 執行通道維持
透過 `include_android`（或 `release_gate` 輸入）選擇性啟用。僅限發行的
外掛涵蓋範圍位於獨立的
[`Plugin Prerelease`](#plugin-prerelease) 工作流程中，且僅會從
[`Full Release Validation`](#full-release-validation) 或明確的手動
分派執行。

## 流水線概覽

| 工作                                | 用途                                                                                                                                                                                                               | 執行時機                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `preflight`                        | 偵測已變更範圍並建立 CI 資訊清單；在與 Node 相關的標準 `main` 上，於展開前重新整理並維護相依性快照                                                                        | 一律在非草稿推送與 PR 上執行             |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 稽核已變更的工作流程，以及正式環境鎖定檔稽核                                                                                                                             | 一律在非草稿推送與 PR 上執行             |
| `pnpm-store-warmup`                | 為 PR 與手動執行預熱由鎖定檔固定版本的 Actions 快取，且不阻擋 Linux Node 分片                                                                                                           | 在 main 之外選取 Node 或文件檢查執行通道時 |
| `build-artifacts`                  | 建置 `dist/`、Control UI、已建置命令列介面的冒煙檢查、啟動記憶體，以及內嵌建置成品檢查                                                                                                                 | 與 Node 相關的變更                          |
| `control-ui-i18n`                  | 驗證產生的 Control UI 語系套件、中繼資料與翻譯記憶庫；自動執行時僅提供建議，手動發行 CI 時則為阻擋條件                                                                               | 與 Control UI i18n 相關的變更及手動 CI |
| `checks-fast-core`                 | 快速 Linux 正確性執行通道：抑制基準最大行數棘輪、內建項目與通訊協定、Bun 啟動器，以及 CI 路由快速任務                                                                                  | 與 Node 相關的變更                          |
| `qa-smoke-ci-profile`              | 有界自動 QA 冒煙測試代表集合中兩個自足且均衡的部分；完整分類涵蓋仍可透過明確的 QA 設定檔使用                                                         | 與 Node 相關的變更                          |
| `checks-fast-contracts-plugins-*`  | 兩個加權的外掛合約分片                                                                                                                                                                                   | 與 Node 相關的變更                          |
| `checks-fast-contracts-channels-*` | 兩個加權的通道合約分片                                                                                                                                                                                  | 與 Node 相關的變更                          |
| `checks-node-*`                    | PR 上針對已變更目標的 Node 測試；在 `main`、手動、發行及廣泛後援執行中執行完整核心分片                                                                                                      | 與 Node 相關的變更                          |
| `check-*`                          | 分片式主要本機閘門等效項目：防護、shrinkwrap、內建通道設定中繼資料、正式環境型別、lint、相依性、測試型別                                                                                   | 與 Node 相關的變更                          |
| `check-additional-*`               | 邊界檢查條帶（包括提示詞快照偏移）、工作階段存取器／逐字稿讀取器／SQLite 交易邊界、擴充功能 lint 群組、套件邊界編譯／金絲雀測試，以及執行階段拓撲架構 | 與 Node 相關的變更                          |
| `checks-node-compat-node22`        | Node 22 相容性建置與冒煙測試執行通道                                                                                                                                                                            | 用於發行的手動 CI 分派                |
| `check-docs`                       | 文件格式、lint 與損壞連結檢查                                                                                                                                                                         | 文件變更時（PR 與手動分派）         |
| `native-i18n`                      | 在原始碼 PR 上驗證原生來源擷取與本地化安全性；在產生型 PR 與手動 CI 上強制完整翻譯／平台產生內容一致                                                               | 與原生 i18n 相關的變更                   |
| `skills-python`                    | 對以 Python 為基礎的 Skills 執行 Ruff 與 pytest                                                                                                                                                                                | 與 Python Skills 相關的變更                  |
| `checks-windows`                   | Windows 特定的程序／路徑測試，以及共用執行階段匯入指定符號迴歸測試                                                                                                                                  | 與 Windows 相關的變更                       |
| `macos-node`                       | 聚焦的 macOS TypeScript 測試：launchd、Homebrew、執行階段路徑、封裝指令碼、程序群組包裝器                                                                                                            | 與 macOS 相關的變更                         |
| `macos-swift`                      | macOS 應用程式的 Swift lint 與建置，以及該應用程式和共用 OpenClawKit 套件的測試                                                                                                                         | 與 macOS 相關的變更                         |
| `ios-build`                        | 產生 Xcode 專案及建置 iOS 應用程式模擬器                                                                                                                                                             | iOS 應用程式、共用應用程式套件或 Swabble 變更    |
| `android`                          | 兩種變體的 Android 單元測試，外加一次除錯 APK 建置                                                                                                                                                          | 與 Android 相關的變更                       |
| `openclaw/ci-gate`                 | 最終彙總：要求預檢與安全檢查通過；僅接受資訊清單停用的下游執行通道略過                                                                                                           | 每次非草稿 CI 執行                         |
| `test-performance-agent`           | 獨立工作流程：可信活動後每日執行 Codex 慢速測試最佳化                                                                                                                                          | Main CI 成功或手動分派             |
| `openclaw-performance`             | 獨立工作流程：每日／隨選產生 Kova 執行階段效能報告，包含模擬供應商、深度分析及 GPT 5.6 即時執行通道                                                                                          | 排程與手動分派                  |

獨立的 Periphery 工作流程會強制 iOS 與 macOS 應用程式不得出現無用程式碼發現項目。共用 OpenClawKit 工作流程會平行掃描兩個使用端，且僅在 Periphery 從兩次建置中輸出相同的 Swift USR 時，才回報該宣告。其產生的 `OpenClawProtocol/GatewayModels.swift` 結構描述合約會保留為產生器擁有的程式碼，而不會視為應用程式本機的無用程式碼。

## 快速失敗順序

1. `preflight` 會決定哪些執行通道確實存在。`docs-scope` 與 `changed-scope` 邏輯是此工作中的步驟，而非獨立工作。標準 `main` 會立即開始，但其並行群組僅允許一個完整執行，並將後續推送合併為一個最新的待處理執行。與 Node 相關的 main 推送也會在此將唯一的相依性磁碟寫入器及其大小維護序列化，之後下游工作才能掛載該金鑰；Blacksmith 可能只會向後續工作流程執行公開新的提交，因此同一次執行的使用端會保留經標記檢查的本機後援機制。
2. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 與 `skills-python` 會快速失敗，無須等待較繁重的成品與平台矩陣工作。
3. `build-artifacts` 與語系檢查會和快速 Linux 執行通道重疊執行。Control UI 與原生應用程式原始碼 PR 會排除產生的語系快照／資源；其序列化的重新整理工作流程會在背景修復並自動合併隔離的產生型 PR。原始碼 CI 仍會阻擋過時的來源清冊與不安全的本地化呼叫。產生型 PR、手動 CI 與發行準備會強制完整翻譯／平台產生內容一致。標準 `release/YYYY.M.PATCH` 分支可以包含發行準備語系修復，以及其他產生的發行輸出。
4. 之後會展開較繁重的平台與執行階段執行通道：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 與 `android`。
5. `openclaw/ci-gate` 會等待每個已選取的執行通道。預檢與安全檢查必須成功；僅當資訊清單未選取下游工作時，這些工作才能略過。任何失敗或取消的已選取執行通道都會使彙總失敗。

合併協調器可以針對相同的 PR 分支最新提交，重複使用已通過驗證且成功的 `openclaw/ci-gate`
最長 24 小時。這可避免因不相關的 `main` 變更而重寫
貢獻者分支。可重複使用的結果不會
取代針對目前 `main`、由 App 擁有的獨立嚴格測試合併檢查。
之後的待處理或失敗重新執行，在有效期限內不會抹除
該未變更分支最新提交先前的成功結果。

預設分支規則集要求由 GitHub Actions 擁有的 `openclaw/ci-gate` 檢查。儲存庫維護者與管理員具有經稽核的緊急繞過權限，僅供已簽署的直接快轉合併使用；組織規則集仍會阻止刪除與非快轉更新。一般 PR 合併應繼續使用此閘門，而不是繞過失敗的 CI。另一個由 App 擁有的嚴格測試合併檢查仍會將提交頭繫結至目前的 `main`。

當較新的提交頭完成合併時，GitHub 可能會將已被取代的 PR 工作標示為 `cancelled`。除非同一個 PR 的最新執行也失敗，否則應將其視為 CI 雜訊。標準 `main` 執行在准入後不會取消；當合併流量進入時，GitHub 只會以最新提交頂端取代較舊的待執行項目。矩陣工作使用 `fail-fast: false`，而 `build-artifacts` 會直接回報內嵌頻道、核心支援邊界和閘道監看失敗，而不會將微型驗證工作排入佇列。自動 CI 並行處理鍵具有版本編號（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍項目無法無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。外掛清單啟動記憶體防護在自行託管的 Blacksmith Linux 上維持 350 MiB 上限，並在 GitHub 託管的 Linux 上允許 425 MiB；對相同的已建置命令列介面而言，後者的 RSS 基準較高。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>`，彙整 GitHub Actions 的總耗時、佇列時間、最慢工作、失敗項目及 `pnpm-store-warmup` 扇出屏障。工作流程內的 `ci-timings-summary` 工作存在於 `ci.yml` 中，但目前已停用（`if: false`）；請改在本機執行計時輔助工具。若要檢查建置計時，請查看 `build-artifacts` 工作的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會輸出 `[build-all] phase timings:` 並包含 `ui:build`；該工作也會上傳 `startup-memory` 成品。

## PR 背景與證據

外部貢獻者的 PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR 背景與證據閘門。該工作流程會簽出
受信任的工作流程修訂版本（`github.workflow_sha`），且僅評估 PR 內文；
它不會執行貢獻者分支中的程式碼。

此閘門適用於並非儲存庫擁有者、成員、
協作者或機器人的 PR 作者。當 PR 內文包含作者撰寫的
`What Problem This Solves` 和 `Evidence` 區段時，即會通過。證據可以是聚焦的
測試、CI 結果、螢幕截圖、錄影、終端機輸出、即時觀察、
已遮蔽的記錄或成品連結。內文用於說明意圖並提供實用的驗證；
審查者會檢查程式碼、測試和 CI，以評估正確性。

當檢查失敗時，請更新 PR 內文，而不是推送另一個程式碼提交。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動分派會略過變更範圍偵測，並使預檢資訊清單視同每個受範圍控管的區域皆已變更。

個別的 iOS 與 macOS Periphery 工作流程會強制執行零發現項目的無用程式碼政策。各工作流程僅會在非草稿 PR 觸及其原生掃描範圍時，或在手動分派時執行。

- **CI 工作流程編輯**會驗證 Node CI 圖形、工作流程程式碼檢查和 Windows 執行區（由 `ci.yml` 執行），但其本身不會強制執行 iOS、Android 或 macOS 原生建置；這些平台執行區仍僅限於平台原始碼變更。
- **工作流程健全性檢查**會對所有工作流程 YAML 檔案執行 `actionlint`、`zizmor`、複合動作插值防護和衝突標記防護。PR 範圍內的 `security-fast` 工作也會對已變更的工作流程檔案執行 `zizmor`，讓工作流程安全性發現項目能在主要 CI 圖形中提早導致失敗。
- **推送至 `main` 時的文件**會由獨立的 `Docs` 工作流程使用與 CI 相同的 ClawHub 文件鏡像進行檢查，因此同時包含程式碼與文件的推送不會另外將 CI `check-docs` 分片排入佇列。當文件有變更時，PR 與手動 CI 仍會從 CI 執行 `check-docs`。
- **終端介面 PTY**會在終端介面變更時於 `checks-node-core-runtime-tui-pty` Linux Node 分片中執行。該分片會使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋確定性的 `TuiBackend` 固定資料執行區，以及僅模擬外部模型端點、速度較慢的 `tui --local` 冒煙測試。
- **僅限 CI 路由的編輯、快速任務直接執行的一小組核心測試固定資料，以及範圍狹窄的外掛契約輔助工具編輯**會使用僅限 Node 的快速資訊清單路徑：`preflight`、`security-fast`，以及僅執行變更所觸及的快速執行區——單一 `checks-fast-core` CI 路由任務、兩個外掛契約分片，或兩者皆執行。此路徑會略過建置成品、Node 22 相容性、頻道契約、完整核心分片、隨附外掛分片及額外的防護矩陣。
- **Windows Node 檢查**僅限於 Windows 特定的程序／路徑包裝函式、npm/pnpm/UI 執行器輔助工具、套件管理員設定，以及執行該執行區的 CI 工作流程介面；不相關的原始碼、外掛、安裝冒煙測試及僅測試變更仍會使用 Linux Node 執行區。

最慢的 Node 測試系列會加以拆分或平衡，使每項工作保持精簡，同時避免預留過多執行器：

- 外掛合約與頻道合約各自在兩個由 Blacksmith 支援的加權分片中執行，並以標準 GitHub 執行器作為備援。
- 核心單元快速／支援執行通道會分開執行；核心執行階段基礎架構則拆分為程序、共用、鉤子、祕密，以及三個排程領域分片。
- 自動回覆以平衡的工作程序執行，回覆子樹拆分為代理執行器、命令、分派、工作階段及狀態路由分片。
- 代理式閘道／伺服器（控制平面）設定會拆分至聊天、驗證、模型、HTTP／外掛、執行階段及啟動執行通道，而非等待建置成品。
- 一般 CI 僅將隔離的基礎架構包含模式分片封裝成確定性套件，每個套件最多包含 64 個測試檔案，在不合併非隔離命令／排程、具狀態的 agents-core 或閘道／伺服器測試套件的情況下縮減節點矩陣。高負載固定測試套件維持使用 8 vCPU，封裝後及權重較低的執行通道則使用 4 vCPU。
- 標準儲存庫上的 PR 會針對合成合併樹差異重複使用變更測試解析器。精確變更會執行一個目標式節點工作；每個選取的測試檔案都會使用自己的程序，因此具狀態測試套件的隔離仍保持完整。規劃器會結合同層測試與匯入圖相依項目；若遇到工作區套件、套件／鎖定檔、共用測試框架、分割設定、重新命名或刪除的變更、公開擴充功能合約變更、具有特殊分片設定的測試、僅部分解析或空白的目標、過大的路徑或目標計畫，以及規劃器錯誤，則退回既有的 14 工作精簡完整測試套件計畫。目標式計畫一律保留完整的建置成品邊界閘門，因為其儲存庫掃描器無法從匯入項目推導。`main` 推送會執行相同的完整精簡測試套件：待處理的中間推送事件可能會合併，因此最新保留下來的執行必須驗證完整整合樹，而不只是其最後一次單一推送的差異。手動分派與發布閘門則保留完整的具名逐分片矩陣。
- 完整節點矩陣會優先允許持續緩慢的序列工具、自動回覆命令分片，以及廣泛的 core-fast 快取寫入器。如此可維持 28 個工作的上限，同時避免關鍵路徑工作及下一次執行的轉換種子延後至後續批次。
- 廣泛的瀏覽器、QA、媒體及其他外掛測試會使用各自專用的 Vitest 設定，而非共用的外掛全包設定。包含模式分片會使用 CI 分片名稱記錄計時項目，使 `.artifacts/vitest-shard-timings.json` 能區分完整設定與經篩選的分片。
- Linux 節點分片工作會透過上游 Actions 快取 API 保留 Vitest 的實驗性檔案系統模組快取，Blacksmith 會在其執行器上透明地加速該 API。每個 CI 分片都只能還原，並將受保護的種子解壓縮到各自的執行器本機根目錄；接著分片包裝器會為並行的 Vitest 程序提供各自獨立的即時子目錄。只有不會取消的每日暖機程式或明確分派的暖機程式能儲存新的不可變封存檔，因此 PR 無法發布轉換結果或建立各 PR 專屬的快取系列。轉換輸入指紋會清除不相容的鎖定檔、套件、tsconfig 及 Vitest 設定世代。受保護的寫入器會掃描已還原的快取，並在其超過 2 GiB 後修剪至 75%。Vitest 會雜湊模組 ID、原始碼內容、環境及解析後的轉換設定，因此一般的部分原始碼變更可讓未變更的項目保持暖機，而已變更的模組則能安全地快取未命中。粗粒度還原前綴可銜接不同工作流程執行；一般 Actions 快取的 LRU 與閒置驅逐機制會限制舊的不可變封存檔。
- 受信任的 Linux 節點工作也會針對每個支援的節點版本線，從一個受保護的相依性磁碟掛載 pnpm 儲存區及 `node_modules`。套件資訊清單、安裝設定、執行器平台及確切的節點修補版本不會納入磁碟金鑰；確切的執行階段與安裝輸入指紋會決定工作要重複使用該樹，還是重新安裝並重新整理同一個磁碟。資訊清單會在雜湊前標準化。經稽核的直接根目錄鉤子僅保留 pnpm 的安裝生命週期指令碼，因此格式化及一般測試／建置指令碼的編輯可維持相依性樹的暖機狀態；未經稽核的生命週期鉤子變動會採取封閉式失敗，直到其來源輸入納入指紋合約為止。相依性、套件管理員、鉤子來源及鎖定檔變更一律使快照失效。指紋相符是必要但非充分條件：設定程序也會檢查匯入者封存檔及資訊清單總和檢查碼，然後對照節點從其匯入者解析的套件資訊清單，驗證由安裝後程序保留、以登錄檔為來源的鎖定檔相依性。匯入者內容缺失或過時時，會改為全新安裝，而非提供根目錄提升內容。若 PR 的唯讀快照無法使用，工作區掛載會分離並安裝至執行器本機儲存空間，以避免對無法發布的複本進行緩慢寫入。黏著式冷安裝會停用 pnpm 內部擷取重試，並從逐步暖機的儲存區進行最多三次有界限的完整安裝嘗試；逾時仍視為失敗。在經內容驗證的還原或凍結鎖定檔安裝後，設定程序會停用 pnpm 多餘的執行前相依性檢查：儲存庫會刻意修剪外掛本機的 `node_modules`，否則 pnpm 會將其視為過時，並在分片展開期間透過不安全的並行隱式安裝進行修復。標準 main 預檢是唯一的寫入器，並會在每次重新整理時測量儲存區；只有在已淘汰的套件版本使其超過 8 GiB 後，才會執行 `pnpm store prune`。即使寫入器工作已完成，Blacksmith 快照發布仍是非同步的，因此使用新金鑰或指紋後的第一次執行可能仍是冷啟動；之後通過內容驗證、具有完全相符標記的還原才是推出證明。必要的 CI 工作與 PR 會取得可拋棄式複本，因此相依性變更不會建立新磁碟、競爭快照，或產生可能取消建置的快取鎖定。
- 節點分片及建置成品工作也會透過不可變的 Actions 快取，還原節點的可攜式磁碟編譯快取。彼此獨立的 `test` 與 `build` 命名空間可防止各自的寫入器取代對方的封存檔：排程測試暖機程式擁有受保護的測試種子，而 `build-artifacts` 每個 UTC 日最多可從受信任的 `main` 推送發布一個受保護的建置封存檔。PR 與一般測試工作只會讀取受保護的快照，因此功能分支位元組碼永遠不會進入共用種子，且 PR 流量不會建立任何快取封存檔。這會跨不同簽出路徑重複使用由節點載入的協調程式碼、建置工具及外部相依性的 V8 位元組碼，即使只有部分原始碼圖發生變更亦然。Vitest 子程序會停用繼承的編譯快取，因為動態設定中可能會啟用涵蓋率，而當指令碼從位元組碼還原序列化時，V8 涵蓋率可能失去原始碼位置精確度。
- 建置成品工作也會保留以內容指紋識別的 `build-all` 步驟輸出。CI 自行建置的外掛 SDK 宣告會雜湊儲存庫擁有的完整 TypeScript／JSON 原始碼圖、排除已安裝及產生的目錄，並在 `tsdown` 清除 `dist` 後，同時還原平面宣告與套件橋接。該圖以外的文件、工作流程、外掛及其他變更可重複使用宣告快照；原始碼變更則會在匯出閘門執行前重新建置。
- 完整宣告建置會將 `tsdown` 拆分為 AI、工作區套件及統一群組。每個群組只快取宣告，之後仍會先重新建置執行階段 JavaScript，再還原那些宣告。因此，核心或外掛變更只會使大型統一圖失效，而工作區套件變更則會保守地使每個相依的宣告群組失效。公開完整建置通常使用不可變的 Actions 快取；粗粒度還原金鑰會為部分變更提供種子，各群組內容指紋會拒絕過時資料，而 GitHub 的快取配額會驅逐舊世代。每週 Node 22 執行通道則會在成功執行 `main` 後發布保留 14 天的成品，且僅還原其不可變產生者身分可在 `main` 上解析至該工作流程的成品，以避免配額頻繁更替，同時不允許 PR 程式碼寫入共用快取。Private-QA 宣告永遠不會保留於 Actions 快取中，因為快取命名空間並非機密性邊界。
- `check-additional-*` 會將補充邊界防護清單（`scripts/run-additional-boundary-checks.mjs`）條帶化為一個提示詞密集分片（`check-additional-boundaries-a`，其中包含 Codex 提示詞快照漂移檢查），以及一個用於其餘條帶的合併分片（`check-additional-boundaries-bcd`）；兩者都會並行執行獨立防護並輸出各項檢查的計時。套件邊界編譯／金絲雀工作會維持在一起，而執行階段拓撲架構則與嵌入 `build-artifacts` 的閘道監看涵蓋率分開執行。
- 在 32-vCPU 的自架建置執行器上，閘道監看、頻道測試及核心支援邊界分片會在 `dist/` 與 `dist-runtime/` 已建置完成後，於 `build-artifacts` 內一同啟動。GitHub 託管的備援執行會讓閘道監看維持序列執行，以免低核心數的資源競爭耗盡其就緒期限。

一旦獲准執行，標準 Linux CI 最多允許 28 個節點測試工作及
12 個較小型的快速／檢查執行通道同時執行；Windows 與 Android 則維持兩個，因為
這些執行器集區規模較小。精簡的完整設定批次具有
120 分鐘的批次逾時，而包含模式群組共用相同的有界限
工作預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，接著建置 Play 偵錯 APK。第三方變體沒有獨立的原始碼集或資訊清單；其單元測試執行通道仍會使用 SMS／通話記錄 BuildConfig 旗標編譯該變體，同時避免在每次與 Android 相關的推送中執行重複的偵錯 APK 封裝工作。目前每個 Gradle 工作都有一個受保護的黏著式磁碟；PR 工作使用可拋棄式複本，而受保護的執行則會就地重新整理內容定址的 Gradle 項目。

Blacksmith 黏著式磁碟金鑰會刻意限制於支援的執行階段或工作維度，絕不包含 PR 編號、提交、執行、分支或相依性雜湊。執行階段轉換與編譯快取使用 Actions 快取而非黏著式磁碟，因為不可變封存檔可提供可驗證的還原／儲存結果，並避免可變快照升級失敗。黏著式金鑰版本遷移後，只將確切的已淘汰金鑰、架構及區域身分加入 `.github/retired-sticky-disks.json`，使用相同維度與確認條件從 `main` 分派 `Sticky Disk Cleanup`，驗證刪除後再移除那些項目。該工作流程會將 ARM 身分路由至 ARM 執行器、拒絕執行器區域不相符的情況、使用 Blacksmith 的完全相符金鑰刪除動作，且絕不刪除 Docker 建置器快取或萬用字元前綴。Actions 快取封存檔採用一般 LRU 與閒置驅逐機制。

`check-dependencies` 分片會執行正式環境的 Knip 相依性、未使用檔案及未使用匯出檢查。若 PR 新增未經審查的未使用檔案，或留下過時的允許清單項目，未使用檔案防護就會失敗；同時保留 Knip 無法靜態解析的刻意動態外掛、產生內容、建置、即時測試及套件橋接介面。未使用匯出防護會排除測試支援檔案，並在任何正式環境匯出未被使用時失敗；刻意的動態取用者必須在 `config/knip.config.ts` 中建立模型。歷史目標若有提供匯出防護便會執行，否則繼續使用其較舊的無用程式碼備援。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是將 OpenClaw 儲存庫活動導入 ClawSweeper 的目標端橋接器。它不會簽出或執行不受信任的 PR 程式碼。此工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App 權杖，接著將精簡的 `repository_dispatch` 承載資料分派至 `openclaw/clawsweeper`。

此工作流程有四個管道：

- `clawsweeper_item`，用於精確的議題與 PR 審查要求；
- `clawsweeper_comment`，用於議題留言中的明確 ClawSweeper 命令；
- `clawsweeper_commit_review`，用於 `main` 推送中的提交層級審查要求；
- `github_activity`，用於 ClawSweeper 代理程式可能檢查的一般 GitHub 活動。

`github_activity` 管道只會轉送正規化的中繼資料：事件類型、動作、執行者、儲存庫、項目編號、URL、標題、狀態，以及留言或審查存在時的簡短摘錄。它刻意避免轉送完整的網路鉤子本文。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，它會將正規化事件傳送至 ClawSweeper 代理程式的 OpenClaw 閘道鉤子。

一般活動僅供觀察，預設不會傳送。ClawSweeper 代理程式會在提示中收到 Discord 目標，且只應在事件出乎意料、可採取行動、具有風險或對維運有用時，才傳送至 `#clawsweeper`。例行開啟、編輯、機器人活動干擾、重複的網路鉤子雜訊，以及正常審查流量都應產生 `NO_REPLY`。

在此路徑中，應始終將 GitHub 標題、留言、本文、審查文字、分支名稱及提交訊息視為不受信任的資料。它們是摘要與分流的輸入，而不是工作流程或代理程式執行階段的指示。

## 手動分派

手動 CI 分派會執行與一般 CI 相同的工作圖，但會強制啟用所有非 Android 範圍的管道：Linux 節點分片、內含外掛分片、外掛與頻道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS、iOS 建置，以及 Control UI／原生應用程式 i18n。自動來源 PR 會驗證原生擷取清冊及 Android／Apple 在地化安全性，不要求在同一個 PR 中包含翻譯或平台產生的輸出。序列化的 Native App Locale Refresh 工作流程會在單一隔離的 PR 中重新建置這些成品，並在必要檢查通過後啟用精確 HEAD 自動合併。完整原生一致性仍會阻擋產生成品的 PR、手動 CI、Full Release Validation 及發行準備。Control UI 語系一致性在自動 PR 與 `main` 執行中仍屬建議性質，在手動／發行 CI 中則具阻擋作用。獨立的手動 CI 分派只會搭配 `include_android=true` 執行 Android（`release_gate` 輸入也會強制執行 Android）；完整發行總流程則透過傳入 `include_android=true` 啟用 Android。CI 不包含外掛預發行靜態檢查、僅供發行使用的 `agentic-plugins` 分片、完整擴充功能批次掃描，以及外掛預發行 Docker 管道。只有當 `Full Release Validation` 在啟用發行驗證閘門的情況下分派獨立的 `Plugin Prerelease` 工作流程時，才會執行 Docker 預發行套件。

PR 最大行數檢查會從已簽出的合成合併樹衍生基準，並依照事件 HEAD 驗證其 HEAD 父項。手動執行會使用唯一的並行群組，因此候選版本完整套件不會遭同一參照上的其他推送或 PR 執行取消。可選的 `target_ref` 輸入可讓受信任的呼叫者針對分支、標籤或完整提交 SHA 執行該工作圖，同時使用所選分派參照中的工作流程檔案；最大行數基準會與該次執行所解析之預設分支 HEAD 的目標合併基底比較。`release_gate` 輸入是供維護者在 PR CI 因容量停滯時使用的精確 SHA 備援方案：它要求 `target_ref` 必須是與所分派分支 HEAD 相符的完整提交 SHA，且 `pull_request_number` 必須識別其合併樹接受驗證的開放 PR。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月僅限 npm 的延伸穩定版路徑是例外：請從完全相同的
`extended-stable/YYYY.M.33` 分支分派 `OpenClaw NPM
Release` 預檢和 `Full Release Validation`，
保留其執行 ID，並將這兩個 ID 傳給直接 npm 發布執行。請參閱[每月僅限 npm
的延伸穩定版發布](/zh-TW/reference/RELEASING#monthly-npm-only-extended-stable-publication)，
以取得命令、精確身分要求、登錄檔回讀及選擇器修復程序。此路徑不會分派外掛、
macOS、Windows、GitHub Release、私人 dist-tag 或其他平台發布。

## 執行器

| 執行器                          | 工作                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `security-fast`、手動 CI 分派與非標準儲存庫備援、QA Smoke 彙總、CodeQL 安全性與品質掃描、工作流程健全性檢查、標籤器、自動回應、獨立的 Docs 工作流程，以及整個 Install Smoke 工作流程                                |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`pnpm-store-warmup`、`native-i18n`、除 QA Smoke CI 以外的 `checks-fast-core`、外掛／頻道合約分片、大多數內含／較輕量的 Linux 節點分片、除 `check-lint` 以外的 `check-*` 管道、選定的 `check-additional-*` 分片、`check-docs`，以及 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的高負載 Linux 節點套件、著重邊界／擴充功能的 `check-additional-*` 分片，以及 `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | 自動 QA Smoke CI 分片、CI 與 Testbox 中的 `build-artifacts`，以及 `check-lint`（對 CPU 足夠敏感，因此 8 個 vCPU 增加的成本高於其節省的成本）                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；分支儲存庫會備援至 `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 與 `ios-build`；分支儲存庫會備援至 `macos-26`                                                                                                                                                                                               |

## 執行器註冊預算

OpenClaw 目前的 GitHub 執行器註冊配額在 `ghx api rate_limit` 中顯示為每 5 分鐘
10,000 次自託管執行器註冊。由於 GitHub 可能變更此配額，每次調校前都應重新檢查
`actions_runner_registration`。此限制由 `openclaw` 組織中的所有 Blacksmith
執行器註冊共用，因此新增另一個 Blacksmith 安裝不會增加新的配額。

將 Blacksmith 標籤視為控制突發流量的稀缺資源。僅負責路由、通知、摘要、
選擇分片或執行短時間 CodeQL 掃描的工作，除非有經測量的 Blacksmith 特定需求，
否則應留在 GitHub 託管的執行器上。任何新的 Blacksmith 矩陣、更大的
`max-parallel`，或高頻率工作流程，都必須列出其最差情況的註冊數量，
並將組織層級目標維持在即時配額的約 60% 以下。依目前 10,000 次註冊的配額，
這代表操作目標為 6,000 次註冊，以便為並行儲存庫、重試及突發重疊保留餘裕。

變更目標的 PR 計畫會將常見的節點測試突發量從 14 次 Blacksmith 註冊減少至 1 次。廣泛風險的 PR 仍保留 14 次註冊的精簡備援，因此最差情況不會增加。

標準儲存庫 CI 會繼續將 Blacksmith 作為一般推送與 PR 執行的預設執行器路徑。`workflow_dispatch` 與非標準儲存庫執行會使用 GitHub 託管的執行器，但一般標準執行目前不會探測 Blacksmith 佇列健康狀況，也不會在 Blacksmith 無法使用時自動備援至 GitHub 託管的標籤。

## 介面棘輪

兩項只能縮減的預算用於保護設定介面。只要數量增加，兩者都會使 CI 失敗，
直到同一個 PR 中有意識地更新預算檔案；當清理作業降低實際數量時，兩者也都要求
向下調整棘輪。

- `config/env-var-count-budget.txt` 限制正式環境來源中 `src/`、
  `packages/` 及 `extensions/` 下不同 `OPENCLAW_*` 名稱的數量
  （排除測試與 QA Lab）。由 `node scripts/check-env-var-count.mjs` 檢查。
  移除環境變數時：在同一個 PR 中降低此數字。新增環境變數屬於
  設定介面決策——請在 PR 本文中說明理由。
- `docs/.generated/config-baseline.counts.json` 限制各種類
  （核心／頻道／外掛）的 `openclaw.json` 結構描述項目數量。由
  `pnpm config:docs:check` 檢查；任何結構描述變更後，請使用 `pnpm config:docs:gen`
  重新產生。

## 本機對應方式

```bash
pnpm changed:lanes                            # 檢查 origin/main...HEAD 的本機變更分流分類器
pnpm check:changed                            # 智慧型本機檢查閘門：依邊界分流檢查變更的格式、型別檢查、lint 與防護
pnpm check                                    # 快速本機閘門：正式環境 tsgo + 分片 lint + 平行快速防護
pnpm check:test-types
pnpm check:timed                              # 相同閘門，並提供各階段計時
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest 測試
pnpm test:changed                             # 低成本智慧型變更 Vitest 目標
pnpm test:ui                                  # Control UI 單元／瀏覽器測試套件
pnpm ui:i18n:check                            # 產生的 Control UI 語系一致性（發布閘門）
pnpm native:i18n:baseline                     # 更新由原始碼擁有的原生擷取清單
pnpm native:i18n:verify                       # 原始碼清單 + Android/Apple 在地化安全性
pnpm native:i18n:check                        # 嚴格檢查翻譯／平台產生內容的一致性（發布閘門）
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # 文件格式 + lint + 失效連結
pnpm build                                    # 當 CI 成品／煙霧檢查重要時建置 dist
pnpm ios:build                                # 產生並建置 iOS 應用程式專案
pnpm ci:timings                               # 摘要最新的 origin/main 推送 CI 執行
pnpm ci:timings:recent                        # 比較近期成功的 main CI 執行
node scripts/ci-run-timings.mjs <run-id>      # 摘要總耗時、佇列時間與最慢工作
node scripts/ci-run-timings.mjs --latest-main # 忽略議題／留言雜訊，並選擇 origin/main 推送 CI
node scripts/ci-run-timings.mjs --recent 10   # 比較近期成功的 main CI 執行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw 效能

`OpenClaw Performance` 是產品／執行階段效能工作流程。它每天在 `main` 上執行，也可手動分派：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動分派通常會對工作流程參照進行基準測試。設定 `target_ref`，即可使用目前的工作流程實作對發布標籤或其他分支進行基準測試。已發布的報告路徑與最新指標會依受測參照建立索引，而每個 `index.md` 都會記錄受測參照／SHA、工作流程參照／SHA、Kova 參照、設定檔、分流驗證模式、模型、重複次數與情境篩選器。

此工作流程會從固定版本安裝 OCM，並從 `openclaw/Kova` 使用固定的 `kova_ref` 輸入安裝 Kova，接著執行三個分流：

- `mock-provider`：使用具決定性的模擬 OpenAI 相容驗證，針對本機建置的執行階段執行 Kova 診斷情境。
- `mock-deep-profile`：針對啟動、閘道與代理程式回合熱點進行 CPU／堆積／追蹤分析。依排程執行，或在分派時搭配 `deep_profile=true` 執行。
- `live-openai-candidate`：執行一個真實 OpenAI `openai/gpt-5.6-luna` 代理程式回合；當 `OPENAI_API_KEY` 無法使用時略過。依排程執行，或在分派時搭配 `live_openai_candidate=true` 執行。

模擬提供者分流也會在 Kova 通過後執行 OpenClaw 原生原始碼探測：涵蓋預設、略過頻道、內部掛鉤與五十個外掛啟動情境的閘道開機計時與記憶體；內建外掛匯入 RSS、重複的模擬 OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道執行的命令列介面啟動命令，以及 SQLite 狀態煙霧效能探測。若受測參照可取得先前發布的模擬提供者原始碼報告，原始碼摘要會將目前的 RSS 與堆積值和該基準比較，並將大幅增加的 RSS 標記為 `watch`。原始碼探測 Markdown 摘要位於報告套件中的 `source/index.md`，原始 JSON 則位於其旁。

每個分流都會上傳完整的 GitHub 成品，包括 CPU、堆積、追蹤與壓縮診斷套件。獨立的發布工作會下載並驗證這些成品，接著建立一個短期有效、權限僅限於 `openclaw/clawgrit-reports` 內容的 ClawSweeper GitHub App 權杖，且只將其傳遞給 Git 推送步驟。它會在 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 下提交 `report.json`、`report.md`、`index.md`、原始碼探測成品，以及套件中繼資料／總和檢查碼；完整診斷封存檔則保留在連結的 Actions 成品中。發布程式會在嘗試推送前拒絕任何超過 50 MB 的報告檔案。目前受測參照的指標為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。若應用程式權杖建立或報告發布失敗，排程執行與 `profile=release` 分派都會失敗。手動非發布分派會將發布保持為建議性質，並在驗證或發布失敗時保留 GitHub 成品。先前的原始碼基準會以匿名方式從公開報告儲存庫擷取，因此成功擷取基準並不能證明發布程式驗證成功。

## 完整發布驗證

`Full Release Validation` 是用於“發布前執行所有項目”的手動統合工作流程。它接受分支、標籤或完整提交 SHA，使用該目標分派手動 `CI` 工作流程（包括 Android）、分派 `Plugin Prerelease` 以進行僅限發布的外掛／套件／靜態／Docker 證明、針對目標 SHA 分派 `OpenClaw Performance`，並分派 `OpenClaw Release Checks` 以執行安裝煙霧測試、套件驗收、跨作業系統套件檢查、QA Lab 一致性、Matrix、Telegram，以及受閘門控管的 Discord、WhatsApp 與 Slack 分流（建議性成熟度計分卡呈現可透過 `run_maturity_scorecard` 選擇啟用）。穩定版與完整設定檔一律包含完整的即時／E2E 與 Docker 發布路徑浸泡涵蓋；Beta 設定檔可透過 `run_release_soak=true` 選擇啟用。標準套件 Telegram E2E 會在套件驗收內執行，因此完整候選版本不會啟動重複的即時輪詢器。發布後，傳入 `release_package_spec`，即可在發布檢查、套件驗收、Docker、跨作業系統與 Telegram 中重複使用已發布的 npm 套件，而無須重新建置。僅在針對已發布套件進行聚焦的 Telegram 重新執行時使用 `npm_telegram_package_spec`。Codex 外掛即時套件分流預設使用相同的選取狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA／成品執行則會從選取的參照封裝 `extensions/codex`。針對 `npm:`、`npm-pack:` 或 `git:` 規格等自訂外掛來源，請明確設定 `codex_plugin_spec`。其即時代理程式證明會傳送可見的進度、繼續執行隨機化工作區讀取與精確成品寫入，然後傳送完成通知。

如需階段矩陣、確切工作流程工作名稱、設定檔差異、成品與聚焦重新執行控制項，請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)。

`OpenClaw Release Publish` 是手動且會變更狀態的發布工作流程。發布標籤存在且 OpenClaw npm 預檢成功後，從受信任的 `main` 分派一般 Beta 與穩定版發布（預檢的檢查項目包含 `pnpm plugins:sync:check`）。標籤仍會選取確切的發布提交，包括 `release/YYYY.M.PATCH` 上的提交；Tideclaw Alpha 發布則繼續使用其對應的 Alpha 分支。它需要已儲存的 `preflight_run_id`、成功的 `full_release_validation_run_id` 及其確切的 `full_release_validation_run_attempt`，會為所有可發布的外掛套件分派 `Plugin NPM Release`，為相同的發布 SHA 分派 `Plugin ClawHub Release`，並且僅在此之後才分派 `OpenClaw NPM Release`。穩定版發布還需要確切的 `windows_node_tag`；此工作流程會先驗證 Windows 原始碼發布，並將其 x64／ARM64 安裝程式與候選版本核准的 `windows_node_installer_digests` 輸入比較，然後才執行任何發布子工作流程；接著，它會提升並驗證這些相同的固定安裝程式摘要，以及確切的配套成品與總和檢查碼合約，之後才發布 GitHub 發布草稿。聚焦的僅外掛修復會使用 `plugin_publish_scope=selected`，並搭配非空白套件清單。僅外掛的 `all-publishable` 執行需要與核心發布相同且不可變更的 npm 預檢與完整發布驗證證據。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得固定提交證明，請使用輔助工具，而非 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程分派參照必須是分支或標籤，不得為原始提交 SHA。輔助工具會在受信任的 `main` 工作流程 SHA 建立並推送暫時的 `release-ci/<sha>-...` 分支、透過工作流程的 `ref` 輸入傳遞要求的目標 SHA、在可用時重複使用嚴格的精確目標證據、驗證每個子工作流程的 `headSha` 都與受信任的工作流程 SHA 相符，並在執行完成時刪除暫時分支。傳入 `-f reuse_evidence=false` 可強制執行全新驗證。若任何子工作流程使用不同的工作流程 SHA 執行，統合驗證程式也會失敗。

`release_profile` 控制傳入發布檢查的即時／提供者涵蓋範圍。手動發布工作流程預設為 `stable`；僅在有意使用廣泛的建議性提供者／媒體矩陣時，才使用 `full`。穩定版與完整發布檢查一律執行完整的即時／E2E 與 Docker 發布路徑浸泡測試；Beta 設定檔可透過 `run_release_soak=true` 選擇啟用。

- `beta` 保留最快速且對 OpenAI／核心發布至關重要的分流。
- `stable` 加入穩定的提供者／後端集合。
- `full` 執行廣泛的建議性提供者／媒體矩陣。

統合工作流程會記錄所分派子執行的 ID，而最終的 `Verify full validation` 工作會重新檢查目前的子執行結論，並為每個子執行附加最慢工作表格。若重新執行子工作流程後轉為成功，只需重新執行父驗證程式工作，即可重新整理統合結果與計時摘要。

為了復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。在傘狀工作流程上，使用 `all` 表示候選版本，使用 `ci` 表示僅一般完整 CI 子工作流程，使用 `plugin-prerelease` 表示僅外掛預發佈子工作流程，使用 `performance` 表示僅 OpenClaw 效能子工作流程，使用 `release-checks` 表示所有發佈子工作流程，或使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能讓失敗的發佈執行環境在針對性修正後，將重新執行範圍維持在有限範圍內。對於單一失敗的跨作業系統通道，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合，例如 `windows/packaged-upgrade`；耗時較長的跨作業系統命令會輸出心跳偵測行，而已封裝升級摘要則包含各階段的計時。選定的 Matrix 與 Telegram QA 通道會阻擋一般發佈驗證，標準執行階段工具涵蓋率閘門亦同。QA 一致性、執行階段一致性，以及受閘門控管的 Discord、WhatsApp 和 Slack 即時通道僅供參考。

`OpenClaw Release Checks` 使用受信任的工作流程參照，將選定的參照一次解析為 `release-package-under-test` tarball，接著將該成品傳遞給跨作業系統檢查與套件驗收；執行浸泡涵蓋時，也會傳遞給即時／E2E 發佈路徑 Docker 工作流程。這可讓各發佈執行環境使用一致的套件位元組，並避免在多個子作業中重複封裝同一個候選版本。對於 Codex npm 外掛即時通道，發佈檢查會傳入衍生自 `release_package_spec` 且相符的已發佈外掛規格、傳入操作人員提供的 `codex_plugin_spec`，或將輸入留空，讓 Docker 指令碼封裝選定簽出版本中的 Codex 外掛。

針對 `ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行
會取代較舊的傘狀工作流程。父監控程序會在父工作流程遭取消時，取消它
已分派的所有子工作流程，因此較新的主線驗證
不會排在過時且耗時兩小時的發佈檢查執行之後。發佈分支／標籤
驗證與針對性重新執行群組會保留 `cancel-in-progress: false`。

## 即時與 E2E 分片

發佈即時／E2E 子工作流程會保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但會透過 `scripts/test-live-shard.mjs` 將其作為具名分片執行，而非單一循序作業：

- `native-live-src-agents` 和 `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- 依提供者篩選的 `native-live-src-gateway-profiles` 作業
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的媒體音訊／視訊分片，以及依提供者篩選的音樂分片

這會維持相同的檔案涵蓋範圍，同時讓緩慢的即時提供者失敗更容易重新執行與診斷。彙總的 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動單次重新執行。

原生即時媒體分片會在由 `Live Media Runner Image` 工作流程建置的 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行。該映像已預先安裝 `ffmpeg` 和 `ffprobe`；媒體作業只會在設定前驗證二進位檔。請讓以 Docker 為基礎的即時套件在一般 Blacksmith 執行器上執行——容器作業不適合啟動巢狀 Docker 測試。

以 Docker 為基礎的即時模型／後端分片，會為每個選定的提交使用另一個共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 映像。即時發佈工作流程只會建置並推送該映像一次，接著 Docker 即時模型、依提供者分片的閘道、命令列介面後端、ACP 繫結及 Codex 測試框架分片會使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片在工作流程作業逾時之前設有明確的指令碼層級 `timeout` 上限，因此卡住的容器或清理路徑會快速失敗，而不會耗盡整個發佈檢查時間預算。如果這些分片各自重新建置完整的來源 Docker 目標，表示發佈執行設定錯誤，並會因重複建置映像而浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件能否作為產品運作？」時，請使用 `Package Acceptance`。它與一般 CI 不同：一般 CI 驗證原始碼樹，而套件驗收會透過使用者在安裝或更新後使用的相同 Docker E2E 測試框架，驗證單一 tarball。

### 作業

1. `resolve_package` 會簽出 `workflow_ref`、解析一個套件候選項目、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中顯示來源、工作流程參照、套件參照、版本、SHA-256 和設定檔。
2. `package_integrity` 會下載 `package-under-test` 成品，並使用 `scripts/check-openclaw-package-tarball.mjs` 強制執行公開套件 tarball 合約。
3. `docker_acceptance` 會使用解析出的套件來源 SHA（若無則回退至 `workflow_ref`）和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重複使用的工作流程會下載該成品、驗證 tarball 清單、視需要準備套件摘要 Docker 映像，並針對該套件執行選定的 Docker 通道，而不是封裝工作流程簽出版本。當設定檔選取多個針對性的 `docker_lanes` 時，可重複使用的工作流程只準備一次套件與共用映像，接著將這些通道展開為平行的針對性 Docker 作業，且各自使用唯一成品。
4. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時便會執行；若套件驗收已解析出套件，則會安裝相同的 `package-under-test` 成品；獨立 Telegram 分派仍可安裝已發佈的 npm 規格。
5. `summary` 會在套件解析、完整性、Docker 驗收或選用的 Telegram 通道失敗時，讓工作流程失敗。`advisory` 輸入會將驗收失敗降級為警告，供參考性呼叫端使用。

### 候選項目來源

- `source=npm` 僅接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發佈版本，例如 `openclaw@2026.4.27-beta.2`。請將其用於已發佈的延伸穩定版、預發佈版或穩定版驗收。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支／標籤、驗證選定的提交可從儲存庫分支歷程或發佈標籤觸及、在分離的工作樹中安裝相依套件，並使用 `scripts/package-openclaw-for-docker.mjs` 將其封裝。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 認證資訊、非預設 HTTPS 連接埠、私人／內部／特殊用途主機名稱或解析出的 IP，以及不符合相同公開安全政策的重新導向。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中的具名受信任來源政策下載 HTTPS `.tgz`；必須提供 `package_sha256` 和 `trusted_source_id`。只有需要設定主機、連接埠、路徑前置詞、重新導向主機或私人網路解析的維護者自有企業鏡像或私人套件儲存庫，才應使用此項。如果政策宣告使用持有人驗證，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密鑰；仍會拒絕嵌入 URL 的認證資訊。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選用，但對外共用成品時應予以提供。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程／測試框架程式碼。`package_ref` 是在 `source=ref` 時會被封裝的來源提交。這讓目前的測試框架能驗證較舊的受信任來源提交，而不必執行舊的工作流程邏輯。

### 套件設定檔

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 集合，其中使用即時 `plugins` 涵蓋取代 `plugins-offline`，再加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 發佈路徑區塊
- `custom` — 確切的 `docker_lanes`；在 `suite_profile=custom` 時為必要

`package` 設定檔使用離線外掛涵蓋，因此已發佈套件驗證不會受制於 ClawHub 的即時可用性。選用的 Telegram 通道會在 `NPM Telegram Beta E2E` 中重複使用 `package-under-test` 成品，而獨立分派仍保留已發佈 npm 規格路徑。

如需專用的更新與外掛測試政策，包括本機命令、
Docker 通道、套件驗收輸入、發佈預設值和失敗分流，
請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

發佈檢查會使用 `source=artifact`、準備好的發佈套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 和 `telegram_mode=mock-openai` 呼叫套件驗收。這能讓套件遷移、更新、即時 ClawHub Skill 安裝、過時外掛相依套件清理、已設定外掛安裝修復、離線外掛、外掛更新和 Telegram 驗證，都使用同一個解析出的套件 tarball。在發佈 Beta 版後，於完整發佈驗證或 OpenClaw 發佈檢查設定 `release_package_spec`，即可針對已發佈的 npm 套件執行相同矩陣，而不必重新建置；只有在套件驗收需要使用與其他發佈驗證不同的套件時，才設定 `package_acceptance_package_spec`。跨作業系統發佈檢查仍涵蓋作業系統特定的初始設定、安裝程式和平台行為；套件／更新產品驗證應從套件驗收開始。

`published-upgrade-survivor` Docker 通道會在阻擋式發佈路徑的每次執行中，驗證一個已發佈套件基準。在套件驗收中，解析出的 `package-under-test` tarball 一律是候選項目，而 `published_upgrade_survivor_baseline` 會選取回退的已發佈基準，預設為 `openclaw@latest`；失敗通道的重新執行命令會保留該基準。使用 `run_release_soak=true` 或 `release_profile=full` 的完整發佈驗證會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展至最新四個穩定 npm 版本、固定的外掛相容性邊界版本，以及針對 Feishu 設定、保留的啟動程序／角色設定檔、已設定的 OpenClaw 外掛安裝、波浪號記錄路徑和過時的舊版外掛相依套件根目錄所設計的問題情境測試資料。多基準已發佈升級存續選項會依基準分片至個別針對性 Docker 執行器作業。當問題是徹底清理已發佈更新，而不是一般完整發佈 CI 的廣度時，獨立的 `Update Migration` 工作流程會使用具有 `all-since-2026.4.23` 基準和 `plugin-deps-cleanup` 情境的 `update-migration` Docker 通道。本機彙總執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入確切的套件規格、透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`（例如 `openclaw@2026.4.15`）保留單一通道，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用情境矩陣。已發佈通道會使用內建的 `openclaw config set` 命令配方設定基準、將配方步驟記錄至 `summary.json`，並在閘道啟動後探測 `/healthz`、`/readyz` 和 RPC 狀態。Windows 已封裝與安裝程式全新安裝通道，也會驗證已安裝的套件能否從原始的 Windows 絕對路徑匯入瀏覽器控制覆寫。OpenAI 跨作業系統代理程式輪次冒煙測試在有設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.6-luna`，讓安裝與閘道驗證使用成本較低的 GPT-5.6 測試層級。

### 舊版相容性期間

套件驗收針對已發布的套件設有範圍明確的舊版相容期間。直到 `2026.4.25`（包括 `2026.4.25-beta.*`）的套件可使用相容路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向未包含於 tarball 的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從衍生自 tarball 的模擬 git fixture 中移除缺少的 pnpm `patchedDependencies`，並可記錄缺少的持久化 `update.channel`；
- 外掛冒煙測試可以讀取舊版安裝記錄位置，或接受缺少市集安裝記錄持久化；
- `plugin-update` 可以允許設定中繼資料遷移，但仍要求安裝記錄和不重新安裝的行為維持不變。

已發布的 `2026.4.26` 套件也可以針對已交付的本機建置中繼資料戳記檔案發出警告，而直到 `2026.5.20` 的套件在缺少 `npm-shrinkwrap.json` 時，可以發出警告而非失敗。後續套件必須符合現代合約；相同條件將導致失敗，而非警告或略過。

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

# 使用目前的測試框架封裝並驗證發布分支。
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

# 從指定且受信任的私有鏡像原則驗證 tarball。
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

偵錯失敗的套件驗收執行時，先查看 `resolve_package` 摘要，以確認套件來源、版本及 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段耗時及重新執行命令。應優先重新執行失敗的套件設定檔或確切的 Docker lane，而非重新執行完整發布驗證。

## 安裝冒煙測試

`Install Smoke` 工作流程不再於 PR 或 `main` 推送時執行。其每夜／手動包裝工作流程與發布驗證都會呼叫唯讀的 `install-smoke-reusable.yml` 核心，且每次執行都會在 GitHub-hosted runner 上採用完整的安裝冒煙測試路徑：

- 根 Dockerfile 冒煙測試映像會針對每個目標 SHA 建置一次，並以不可變成品繫結至工作流程修訂版本及產生端的執行嘗試，之後由命令列介面冒煙測試、代理程式刪除共用工作區的命令列介面冒煙測試、容器閘道網路 E2E，以及內建 `matrix` 外掛建置引數冒煙測試載入。外掛冒煙測試會驗證執行階段相依套件安裝鏡像，並確認外掛載入時不會出現進入點逸出診斷。
- QR 套件安裝與安裝程式／更新 Docker 冒煙測試（包括 Rocky Linux 安裝程式 lane，以及針對可設定 `update_baseline_version` npm 基準線的更新 lane）會以個別作業執行，因此安裝程式工作無須在根映像冒煙測試後方等待。

較慢的 Bun 全域安裝映像提供者冒煙測試由 `run_bun_global_install_smoke` 獨立控管。它會依每夜排程執行，發布檢查呼叫工作流程時預設啟用，手動 `Install Smoke` 分派也可選擇啟用。一般 PR CI 仍會針對與 Node 相關的變更執行快速 Bun 啟動器迴歸 lane。QR 與安裝程式 Docker 測試各自保留專注於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用的即時測試映像、將 OpenClaw 封裝成 npm tarball 一次，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式／更新／外掛相依套件 lane 的基本 Node/Git runner；
- 將相同 tarball 安裝至 `/app`，用於一般功能 lane 的功能映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，而 runner 僅執行所選計畫。排程器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，然後使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                               | 預設值 | 用途                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主集區槽位數。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對提供者敏感的尾端集區槽位數。                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 即時 lane 並行上限，避免提供者限流。                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | npm 安裝 lane 並行上限。                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 多服務 lane 並行上限。                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，以避免 Docker daemon 建立風暴；設為 `0` 則不錯開。     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的備援逾時（120 分鐘）；所選即時／尾端 lane 使用更嚴格的上限。           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定   | `1` 會列印排程器計畫而不執行 lane。                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定   | 以逗號分隔的確切 lane 清單；略過清理冒煙測試，讓代理程式可重現單一失敗 lane。 |

重量超過其有效上限的 lane 仍可從空集區啟動，之後會獨自執行，直到釋放容量。本機彙總流程會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、輸出作用中 lane 狀態、保存 lane 耗時以便依最長優先排序，且預設會在第一次失敗後停止排程新的集區 lane。

### 可重複使用的即時／E2E 工作流程

可重複使用的即時／E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 所需的套件、映像種類、即時映像、lane 及認證資訊涵蓋範圍。接著 `scripts/docker-e2e.mjs` 會將該計畫轉換為 GitHub 輸出及摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 封裝 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品，然後驗證 tarball 清單。預設的 `no-push-artifact` 路徑會透過 Blacksmith 的 Docker layer cache 建置以套件摘要標記的基本／功能映像，將確切映像位元組封裝成不可變的工作流程成品，並讓每個使用端驗證及載入該成品。`existing-only` 則要求明確指定 `docker_e2e_bare_image`/`docker_e2e_functional_image` GHCR 參照，且絕不建置或推送。這些登錄檔提取的每次嘗試逾時上限為 180 秒，因此卡住的串流會快速重試，而不會耗費大部分 CI 關鍵路徑。排程驗證成功後，`openclaw-scheduled-live-checks.yml` 會將不可變的已測試映像資訊清單傳遞給獨立的套件寫入發布程式；唯讀的發布與預發布呼叫端絕不會經過該寫入程式。

### 發布路徑區塊

發布 Docker 涵蓋範圍會使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊作業，使每個區塊僅驗證並載入其所需、由成品支援的映像種類（或在明確的 `existing-only` 重複使用模式下提取），並透過相同的加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

目前的發布 Docker 區塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 至 `plugins-runtime-install-h`，以及 `openwebui`。`package-update-openai` 包含即時 Codex 外掛套件 lane，它會安裝候選 OpenClaw 套件、從 `codex_plugin_spec` 或同參照 tarball 安裝 Codex 外掛並明確核准安裝 Codex 命令列介面、執行 Codex 命令列介面預先檢查和同一工作階段代理程式回合，然後執行零重試的中等思考回合；該回合會傳送進度、讀取隨機化的工作區輸入、寫入完全一致的成品，並傳送完成通知。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍為彙總外掛／執行階段別名。`install-e2e` lane 別名仍是兩個提供者安裝程式 lane 的彙總手動重新執行別名。

當穩定版或完整發布路徑涵蓋範圍要求時，OpenWebUI 會在專用的大容量磁碟 Blacksmith runner 上以獨立的 `openwebui` 區塊執行，即使可重複使用的工作流程將支援的作業路由至 GitHub-hosted runner 亦然。分開處理外部映像提取，可避免大型映像與 `plugins-runtime-services` 中的共用套件及外掛映像競爭；舊版彙總外掛／執行階段區塊仍包含 OpenWebUI，以支援相容的手動重新執行。內建頻道更新 lane 遇到暫時性 npm 網路失敗時會重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、耗時、`summary.json`、`failures.json`、階段耗時、排程器計畫 JSON、慢速 lane 表格及各 lane 的重新執行命令。工作流程的 `docker_lanes` 輸入會針對為該次執行準備的映像執行所選 lane，而非執行區塊作業，讓失敗 lane 的偵錯範圍維持在單一目標 Docker 作業；若所選 lane 是即時 Docker lane，目標作業會在本機為該次重新執行建置即時測試映像。重新執行輔助程式會驗證失敗成品中確切選取的目標 SHA，而手動分派會重新封裝該參照，因為內部可重複使用工作流程的套件 tuple 並不屬於 `workflow_dispatch` 結構描述。產生的命令僅會在準備好的映像輸入由 GHCR 支援時，包含這些輸入及 `shared_image_policy=existing-only`；runner 本機成品標籤則會省略，讓新的 runner 重新建置。除非成品能證明復原的 GHCR 映像參照符合明確的目標覆寫，否則會捨棄這些參照。由成品產生的工作流程定義參照也會省略，因為完整發布的暫存分支會被刪除；除非操作人員明確覆寫，否則分派會使用儲存庫的預設分支。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker 成品，並列印合併及各 lane 的目標重新執行命令
pnpm test:docker:timings <summary>   # 慢速 lane 與階段關鍵路徑摘要
```

排程的即時／E2E 工作流程每天執行完整的發布路徑 Docker 套件組，成功後會針對確切的已測試映像成品叫用明確的發布程式。

## 外掛預發布

`Plugin Prerelease` 涵蓋較高成本的產品／套件，因此是由 `Full Release Validation` 或明確指定的操作人員派送的獨立工作流程。一般 PR、`main` 推送與獨立的手動 CI 派送都不會啟用該套件。它會將隨附外掛測試平均分配至八個擴充功能工作器；這些擴充功能分片工作一次最多執行兩組外掛設定，每組使用一個 Vitest 工作器及較大的 Node 堆積空間，避免匯入量大的外掛批次產生額外的 CI 工作。僅限發行版的 Docker 預發行路徑（由 `full_release_validation` 輸入啟用）會將目標 Docker 執行管線以每四個一組的方式批次處理，避免為一至三分鐘的工作保留數十個執行器。該工作流程也會上傳由 `@openclaw/plugin-inspector` 產生、僅供參考的 `plugin-inspector-advisory` 成品；檢查器的發現是分流處理的輸入，不會改變具阻擋作用的外掛預發行閘門。

## QA Lab

QA Lab 在主要的智慧範圍工作流程之外設有專用的 CI 執行管線。代理式同等性檢查嵌套於廣泛的 QA 與發行測試框架中，而非獨立的 PR 工作流程。當同等性檢查應隨廣泛驗證執行一起進行時，請搭配 `rerun_group=qa-parity` 使用 `Full Release Validation`。

- `QA-Lab - All Lanes` 工作流程會在 `main` 每晚執行，也可透過手動派送執行；它會分散執行模擬同等性檢查，以及即時 Matrix、Telegram、Discord、WhatsApp 與 Slack 工作。即時工作使用 `qa-live-shared` 環境；Telegram、Discord、WhatsApp 與 Slack 使用 Convex 租約，而 Matrix 則佈建可拋棄的本機認證資訊。

發行檢查會使用確定性模擬提供者及符合模擬資格的模型（`mock-openai/gpt-5.6-luna` 與 `mock-openai/gpt-5.6-luna-alt`）執行 Matrix 和 Telegram 即時傳輸執行管線，使頻道合約不受即時模型延遲及一般提供者外掛啟動影響。即時傳輸閘道會停用記憶體搜尋，因為 QA 同等性檢查會另外涵蓋記憶體行為；提供者連線能力則由獨立的即時模型、原生提供者與 Docker 提供者套件涵蓋。

排程與發行版 Matrix 閘門會搭配發行情境，使用共用的 QA Lab 套件主機與即時轉接器。命令列介面預設值與手動工作流程輸入仍為 `all`；手動 `all` 派送會分散執行 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 設定檔，讓 93 個情境的證明維持在各工作逾時限制內。聚焦的手動派送會在單一工作中選取 `fast`、`release` 或 `transport`。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab 執行管線；其 QA 同等性閘門會將候選套件與基準套件當作平行執行管線工作執行，接著將兩者的成品下載至小型報告工作中，以進行最終的同等性比較。

對一般 PR，請依循限定範圍的 CI／檢查證據，而不要將同等性檢查視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意設計為範圍有限的第一階段安全性掃描器，而非完整的儲存庫掃描。每日、手動、`main` 推送與非草稿 PR 的防護執行，會掃描 Actions 工作流程程式碼，以及風險最高的 JavaScript／TypeScript 介面，並使用高信賴度安全性查詢篩選出高／重大 `security-severity`。

PR 防護會保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或擁有程序的隨附外掛執行階段路徑下的變更啟動，並執行與排程工作流程相同的高信賴度安全性矩陣。Android 與 macOS CodeQL 不納入 PR 預設執行範圍。

### 安全性類別

| 類別                                          | 介面                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、祕密、沙箱、排程與閘道基準                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | 核心頻道實作合約，加上頻道外掛執行階段、閘道、外掛 SDK、祕密與稽核接觸點              |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 剖析、網路防護、網頁擷取與外掛 SDK SSRF 政策介面                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助程式、對外傳遞與代理工具執行閘門                                           |
| `/codeql-security-high/process-exec-boundary`     | 本機殼層、程序衍生輔助程式、擁有子程序的隨附外掛執行階段與工作流程指令碼黏合層                             |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、資訊清單、登錄檔、套件管理器安裝、來源載入與外掛 SDK 套件合約信任介面 |

### 平台專用安全性分片

- `CodeQL Android Critical Security` — 排程執行的 Android 安全性分片。在工作流程健全性檢查所接受的最小 Blacksmith Linux 執行器上，為 CodeQL 手動建置 Android 應用程式。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週／手動執行的 macOS 安全性分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式、從上傳的 SARIF 中篩除相依性建置結果，並上傳至 `/codeql-critical-security/macos`。它不納入每日預設執行範圍，因為即使結果無異常，macOS 建置仍會占用大部分執行時間。

### 重大品質類別

`CodeQL Critical Quality` 是對應的非安全性分片。它僅在 GitHub 託管的 Linux 執行器上，對範圍有限且高價值的介面執行錯誤嚴重性、非安全性的 JavaScript／TypeScript 品質查詢，使品質掃描不會消耗 Blacksmith 執行器註冊預算。其 PR 防護刻意比排程設定檔更小：非草稿 PR 只會針對其接觸的介面執行相符分片，分片取自十三個可由 PR 路由的分片——`agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 與 `session-diagnostics-boundary`。`ui-control-plane` 與 `web-media-runtime-boundary` 不納入 PR 執行。CodeQL 設定與品質工作流程的變更會執行完整的 PR 分片集合（網路執行階段分片會根據其自己的 CodeQL 設定檔與擁有網路的來源路徑啟動）。

手動派送接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

範圍有限的設定檔是用於單獨執行一個品質分片的教學／迭代掛鉤。

| 類別                                                | 介面                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、祕密、沙箱、排程與閘道安全性邊界程式碼                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化與 IO 合約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道通訊協定結構描述與伺服器方法合約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心頻道與隨附頻道外掛實作合約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型／提供者派送、自動回覆派送與佇列，以及 ACP 控制平面執行階段合約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助程式，以及對外傳遞合約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段外觀、記憶體外掛 SDK 別名、記憶體執行階段啟用黏合層，以及記憶體 doctor 命令                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | 網路政策套件、原始通訊端與 Proxy 擷取執行階段、SSH 通道、閘道鎖定、JSONL 通訊端，以及推送傳輸介面                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結／傳遞輔助程式、診斷事件／日誌套件介面，以及工作階段 doctor 命令列介面合約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 傳入回覆派送、回覆承載資料／分塊／執行階段輔助程式、頻道回覆選項、傳遞佇列，以及工作階段／討論串繫結輔助程式             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值／目錄，以及網頁／搜尋／擷取／嵌入登錄檔    |
| `/codeql-critical-quality/ui-control-plane`             | 控制介面啟動、本機持久化、閘道控制流程，以及任務控制平面執行階段合約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取／搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄檔、公開介面與外掛 SDK 進入點合約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發佈的套件端外掛 SDK 來源與外掛套件合約輔助程式                                                                                      |

品質與安全性保持分離，因此可以排程、衡量、停用或擴充品質發現，而不會模糊安全性訊號。只有在範圍有限的設定檔具備穩定的執行時間與訊號後，才應透過限定範圍或分片的後續工作重新加入 Swift、Python 與隨附外掛的 CodeQL 擴充。

## 維護工作流程

### 文件代理

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護執行管線，用於讓現有文件與最近合併的變更保持一致。它沒有純排程：`main` 上成功且非機器人的推送 CI 執行可觸發它，手動派送也可直接執行它。當 `main` 已繼續前進，或過去一小時內已建立另一個未略過的文件代理執行時，工作流程執行觸發會略過。執行時，它會審查從上一個未略過的文件代理來源 SHA 到目前 `main` 的提交範圍，因此每小時的一次執行可涵蓋自上次文件檢查以來累積的所有主分支變更。

### 測試效能代理

`Test Performance Agent` 工作流程是針對緩慢測試、由事件驅動的 Codex 維護路徑。它沒有單純的排程：`main` 上成功的非機器人推送 CI 執行可以觸發它，但如果該 UTC 日已有另一個工作流程執行呼叫曾經執行或正在執行，就會略過。手動分派不受這個每日活動閘門限制。此路徑會建立完整測試套件的分組 Vitest 效能報告，讓 Codex 僅進行可維持涵蓋率的小型測試效能修正，而非大範圍重構，接著重新執行完整測試套件報告，並拒絕會減少通過基準測試數量的變更。分組報告會記錄 Linux 和 macOS 上每個設定的實際經過時間與最大 RSS，因此前後比較會在持續時間差異旁呈現測試記憶體差異。如果基準中有失敗的測試，Codex 只能修正明顯的失敗，而且代理程式執行後的完整測試套件報告必須通過，才能提交任何內容。當 `main` 在機器人推送落地前前進時，此路徑會重定基底已驗證的修補程式、重新執行 `pnpm check:changed`，並重試推送；發生衝突的過時修補程式會被略過。它使用 GitHub 託管的 Ubuntu，讓 Codex 動作可維持與文件代理程式相同的移除 sudo 安全策略。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是供維護者手動執行的工作流程，用於落地後清理重複項目。它預設為試執行，且僅在 `apply=true` 時關閉明確列出的 PR。在變更 GitHub 前，它會確認已落地的 PR 已合併，且每個重複 PR 都有共同引用的議題或重疊的變更區塊。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

### 設定基準數量棘輪

`pnpm config:docs:check` 會拒絕未記載於文件的設定介面增長，以及損壞或過時的數量快照。當經審查的產品變更刻意新增結構描述路徑時，請執行 `pnpm config:docs:gen`、檢查核心／頻道／外掛數量差異與產生的 SHA-256 檔案，並將經審慎確認的基準提升與結構描述、說明、標籤、遷移及測試一併提交。請勿手動編輯數量檔案來規避棘輪。

設定作者也必須為新葉節點設定 Settings 層級。在葉節點加入 `advanced: false` 或
`advanced: true`，或將鍵置於其層級應由所有後代繼承的祖先節點下。未分類的根節點會使結構描述品質
測試失敗，並提供可複製貼上的骨架；沒有祖先節點的路徑預設為進階。
經整理的常見葉節點快照，會讓刻意的層級變更在
審查中清楚可見。

本機變更路徑邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門在架構界線方面比廣泛的 CI 平台範圍更嚴格：

- 核心正式環境變更會執行核心正式環境與核心測試型別檢查，以及核心 lint／防護檢查；
- 僅核心測試的變更只會執行核心測試型別檢查，以及核心 lint；
- 擴充功能正式環境變更會執行擴充功能正式環境與擴充功能測試型別檢查，以及擴充功能 lint；
- 僅擴充功能測試的變更會執行擴充功能測試型別檢查，以及擴充功能 lint；
- 公開外掛 SDK 或外掛合約變更會擴展至擴充功能型別檢查，因為擴充功能相依於這些核心合約（Vitest 擴充功能全面測試仍屬於明確的測試工作）；
- 僅發布中繼資料的版本提升會執行針對性的版本／設定／根相依套件檢查；
- 未知的根目錄／設定變更會以安全失敗方式執行所有檢查路徑。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 成本更低：直接修改測試時會執行該測試；修改原始碼時則優先採用明確對應，接著是同層測試與匯入圖中的相依項目。共用群組聊天室傳遞設定是其中一個明確對應：群組可見回覆設定、來源回覆傳遞模式或訊息工具系統提示的變更，會路由至核心回覆測試，以及 Discord 和 Slack 的傳遞迴歸測試，讓共用預設值的變更能在第一次推送 PR 前失敗。只有當變更廣泛到涵蓋整個測試框架，使低成本的對應集合無法作為可靠的替代指標時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是儲存庫自有的遠端主機包裝工具，用於維護者的 Linux 證明。只有在來源受信任且現有相依套件安裝已就緒時，代理程式
工作階段才會將一個／少數聚焦測試與低成本靜態檢查留在本機執行。較大型的測試套件與
運算密集型工作會使用 Crabbox，包括建置、型別檢查、lint 分流、
Docker、套件路徑、端對端測試、實際環境證明與 CI 一致性驗證。受信任維護者的高負載
證明預設使用 `blacksmith-testbox`，而 `.crabbox.yaml` 現在也預設使用它。其設定的
工作流程會載入供應商與代理程式認證資訊，因此不受信任的貢獻者或
分支程式碼必須改用無密鑰的分支 CI，或經清理的直接 AWS Crabbox。
經清理的 AWS 執行會設定 `CRABBOX_ENV_ALLOW=CI`、傳入
`--no-hydrate`，並使用全新的臨時遠端 `HOME`；這可防止儲存庫的
`OPENCLAW_*` 允許清單與現有驗證設定檔接觸不受信任的程式碼。
它們使用專供該不受信任來源、全新預熱的租用環境，絕不使用
受信任或先前已載入認證資訊的租用環境。請從乾淨且受信任的 `main` 簽出啟動已安裝且受信任的 Crabbox
二進位檔，並僅使用 `--fresh-pr` 擷取遠端 PR；絕不可在本機執行不受信任簽出的包裝工具或設定。
取消設定 `CRABBOX_AWS_INSTANCE_PROFILE`，且除非解析後的
`aws.instanceProfile` 為空，否則以安全失敗方式中止。在任何安裝／測試前，使用受信任的
絕對路徑工具要求 IMDSv2 權杖、證明 IAM 認證資訊
端點回傳 404，並將遠端 `git rev-parse HEAD` 與完整的
已審查 PR 頂端 SHA 比較。將租用環境綁定至該 SHA，並在頂端變更時停止／重新預熱。
將乾淨 `main` 中受信任的 `scripts/crabbox-untrusted-bootstrap.sh`
與 `--fresh-pr` 一併上傳；它會安裝固定版本的 Node／pnpm、驗證 SHA 與
套件管理工具版本固定設定、隔離 `HOME`、安裝相依套件，然後執行
要求的測試。
取消設定所有 `CRABBOX_TAILSCALE*` 覆寫、強制使用 `--network public
--tailscale=false`、清除出口節點／LAN 旗標，並要求 `crabbox inspect` 在上傳任何指令碼前
回報使用公用網路且沒有 Tailscale 狀態。
自有的 AWS／Hetzner 容量也仍是 Blacksmith 中斷、
配額問題或明確要求使用自有容量測試時的備援方案。

代理程式不會為預期的工作預先預熱。請在第一個
高負載命令就緒時才取得 Testbox，對後續高負載
命令重複使用回傳的 `tbx_...` ID、每次執行都同步目前的簽出，並在交接前停止它。

由 Crabbox 支援的 Blacksmith 執行會預熱、認領、同步、執行、回報並清理
一次性 Testbox。內建同步健全性檢查會在同步主機上的
`git status --short` 顯示至少 200 個受追蹤檔案遭刪除時快速失敗，
藉此偵測 `pnpm-lock.yaml` 等根目錄檔案消失的情況。若 PR 刻意進行
大規模刪除，請為遠端命令設定 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

如果本機 Blacksmith 命令列介面呼叫停留在
同步階段超過五分鐘，且同步後沒有任何輸出，Crabbox 也會終止該呼叫。設定
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用此防護，或針對異常龐大的本機差異使用更大的
毫秒值。

第一次執行前，請從儲存庫根目錄檢查包裝工具：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果過時的 Crabbox 二進位檔未宣告支援所選供應商，儲存庫包裝工具會拒絕使用；由 Blacksmith 支援的執行則要求 Crabbox 0.22.0 或更新版本，讓包裝工具能取得目前的 Testbox 同步、佇列及清理行為。在 Codex 工作樹或連結／稀疏簽出中，請避免使用本機 `pnpm crabbox:run` 指令碼，因為 pnpm 可能會在 Crabbox 啟動前調整相依套件；請改為直接呼叫 Node 包裝工具：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用同層簽出時，請在計時或證明工作前重新建置被忽略的本機二進位檔：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` 中的 `blacksmith:` 區塊已固定組織、工作流程、工作與參照的預設值，因此下列明確旗標為選用。變更閘門：

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

當本機相依套件無法使用或目標會分流時，在 Testbox 上重新執行
聚焦測試：

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

請閱讀最終 JSON 摘要。實用欄位包括 `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs` 與 `totalMs`。對於委派的
Blacksmith Testbox 執行，Crabbox 包裝工具結束代碼與 JSON 摘要就是
命令結果。連結的 GitHub Actions 執行負責載入認證資訊與維持連線；如果 Testbox 在 SSH
命令已回傳後遭外部停止，它可能會以 `cancelled` 結束。除非
包裝工具的 `exitCode` 非零，或命令輸出顯示測試失敗，否則應將其視為清理／狀態產物。
由 Blacksmith 支援的一次性 Crabbox 執行應會自動停止 Testbox；
如果執行遭中斷或清理狀態不明，請檢查執行中的主機，並且只停止
你建立的主機：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在刻意需要於同一個已載入認證資訊的主機上執行多個命令時，才使用重複利用：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

請重複使用租用環境，而非過時的原始碼。省略 `--no-sync`，使每次執行都會上傳
目前的簽出；只有在刻意重新執行未變更且已同步的樹狀內容時才使用它。
不受信任的貢獻者／分支程式碼必須對每個命令使用
`CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate` 與全新的
臨時遠端 `HOME`；測試前請在該清理命令內安裝相依套件。只能重複使用專供
相同不受信任來源、全新預熱的租用環境；絕不可使用受信任或先前已載入認證資訊的租用環境。絕不可
在本機執行不受信任簽出的包裝工具或設定：請從乾淨且受信任的 `main` 啟動已安裝且
受信任的 Crabbox 二進位檔，並在每次執行時傳入 `--fresh-pr`。
保持 `CRABBOX_AWS_INSTANCE_PROFILE` 未設定、拒絕非空的已解析
執行個體設定檔、要求受信任的遠端 IMDS 無角色證明，並在
安裝／測試前驗證已審查的頂端 SHA。將租用環境綁定至該 SHA；任何頂端變更後皆須停止並
重新預熱。如果不存在遠端 PR，請使用無密鑰的分支 CI。
絕不可為不受信任來源選擇 `hydrate-github` 或載入認證資訊的 Blacksmith 工作流程。

如果損壞的是 Crabbox 層，但 Blacksmith 本身運作正常，則僅將直接
Blacksmith 用於 `list`、`status` 與清理等診斷。在將直接 Blacksmith 執行視為維護者證明前，請先修正
Crabbox 路徑。

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可正常運作，但新的
預熱在幾分鐘後仍停留於 `queued`，且沒有 IP 或 Actions 執行 URL，
請將其視為 Blacksmith 提供者、佇列、帳務或組織限制壓力。停止你建立的
佇列中 ID，避免啟動更多 Testbox，並將驗證移至下方自有 Crabbox 容量路徑，
同時由其他人檢查 Blacksmith 儀表板、帳務和組織限制。

只有在 Blacksmith 中斷、受配額限制、缺少所需環境，或明確以自有容量為目標時，才升級至自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

在 AWS 容量吃緊時，除非工作確實需要 48xlarge 等級的 CPU，否則請避免 `class=beast`。`beast` 請求從 192 個 vCPU 起跳，最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額。儲存庫自有的 `.crabbox.yaml` 預設為 `class: standard`、on-demand 市場和 `capacity.hints: true`，讓透過代理取得的 AWS 租用執行個體輸出所選區域／市場、配額壓力、Spot 備援和高壓力等級警告。較繁重的廣泛檢查請使用 `fast`；只有在 standard／fast 不敷使用後才使用 `large`；`beast` 則僅用於特殊的 CPU 密集工作管線，例如完整測試套件或所有外掛的 Docker 矩陣、明確的發布／阻斷問題驗證，或高核心數效能分析。請勿將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint／型別檢查、小型 E2E 重現或 Blacksmith 中斷分類。容量診斷請使用 `--market on-demand`，避免將 Spot 市場波動混入訊號。

`.crabbox.yaml` 負責提供者、同步和 GitHub Actions 注入的預設值。Crabbox 同步絕不傳輸 `.git`，因此已注入 Actions 的簽出會保留自己的遠端 Git 中繼資料，而不會同步維護者本機的遠端設定和物件儲存區；此外，儲存庫設定也會排除絕不應傳輸的本機執行階段／建置成品（例如 `.artifacts` 和測試報告）。`.github/workflows/crabbox-hydrate.yml` 負責簽出、Node／pnpm 設定、`origin/main` 擷取，以及自有雲端 `crabbox run --id <cbx_id>` 命令的非機密環境交接。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
