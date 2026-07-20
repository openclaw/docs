---
read_when:
    - 你需要瞭解 CI 作業為何有執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調版本驗證的執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送機制
summary: CI 工作圖、範圍閘門、發布傘狀流程與對應的本機命令
title: CI 流水線
x-i18n:
    generated_at: "2026-07-20T00:45:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2b185ae6261201072242a3873bd154cbf695e16bae3e41f7e05f6a5ac1a173
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在推送至 `main` 時執行（Markdown 與 `docs/**` 路徑在觸發階段會被忽略）、在每個非草稿 PR 上執行，以及透過手動分派執行。
標準 `main` 推送採單一執行：`CI` 並行群組允許一個
完整整合週期執行，同時 GitHub 僅保留最新的待處理推送。
新的合併會取代該待處理執行，而不會取消已經
註冊 Blacksmith 矩陣的工作。PR 仍會取消已被取代的分支最新提交，
而手動分派則使用隔離的群組。`preflight` 會分類差異，並在
只有不相關區域發生變更時關閉高成本通道。手動
`workflow_dispatch` 執行會刻意略過智慧範圍界定，並展開
完整圖形，以供候選版本與廣泛驗證使用。Android 通道仍需
透過 `include_android`（或 `release_gate` 輸入）選擇啟用。僅限發行版的
外掛涵蓋範圍位於獨立的
[`Plugin Prerelease`](#plugin-prerelease) 工作流程中，且只會由
[`Full Release Validation`](#full-release-validation) 或明確的手動
分派執行。

## 流水線概覽

| 工作                               | 用途                                                                                                                                                                                                                  | 執行時機                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `preflight`                        | 偵測變更範圍並建置 CI 資訊清單；在與 Node 相關的標準 `main` 上，於展開前重新整理並維護相依性快照                                                                                | 一律在非草稿推送和 PR 上執行                   |
| `security-fast`                    | 私密金鑰偵測、透過 `zizmor` 稽核已變更的工作流程，以及正式環境鎖定檔稽核                                                                                                                    | 一律在非草稿推送和 PR 上執行                   |
| `pnpm-store-warmup`                | 為 PR 和手動執行預熱由鎖定檔固定版本的 Actions 快取，且不阻塞 Linux Node 分片                                                                                                               | 在 main 之外選取 Node 或文件檢查通道時         |
| `build-artifacts`                  | 建置 `dist/`、Control UI、已建置命令列介面的冒煙檢查、啟動記憶體，以及內嵌已建置成品檢查                                                                                                      | 與 Node 相關的變更                             |
| `control-ui-i18n`                  | 驗證產生的 Control UI 語系套件、中繼資料和翻譯記憶；自動執行時僅提供建議，手動發行版 CI 時則會阻擋                                                                                           | 與 Control UI 國際化相關的變更和手動 CI        |
| `checks-fast-core`                 | 快速 Linux 正確性通道：抑制基準最大行數棘輪、內建項目與通訊協定、Bun 啟動器，以及 CI 路由快速任務                                                                                              | 與 Node 相關的變更                             |
| `qa-smoke-ci-profile`              | 有界自動 QA 冒煙代表集合的兩個自足均衡部分；完整分類涵蓋範圍仍可透過明確的 QA 設定檔使用                                                                                                          | 與 Node 相關的變更                             |
| `checks-fast-contracts-plugins-*`  | 兩個加權外掛合約分片                                                                                                                                                                                                  | 與 Node 相關的變更                             |
| `checks-fast-contracts-channels-*` | 兩個加權頻道合約分片                                                                                                                                                                                                  | 與 Node 相關的變更                             |
| `checks-node-*`                    | PR 上針對已變更目標的 Node 測試；在 `main`、手動、發行版及廣泛後備執行時使用完整核心分片                                                                                                    | 與 Node 相關的變更                             |
| `check-*`                          | 分片的主要本機閘門等效項目：防護、shrinkwrap、內建頻道設定中繼資料、正式環境型別、程式碼檢查、相依性、測試型別                                                                                 | 與 Node 相關的變更                             |
| `check-additional-*`               | 邊界檢查條帶（包括提示詞快照偏移）、工作階段存取器／逐字稿讀取器／SQLite 交易邊界、擴充功能程式碼檢查群組、套件邊界編譯／金絲雀測試，以及執行階段拓撲架構 | 與 Node 相關的變更                             |
| `checks-node-compat-node22`        | Node 22 相容性建置與冒煙通道                                                                                                                                                                                           | 針對發行版手動分派 CI                          |
| `check-docs`                       | 文件格式、程式碼檢查和失效連結檢查                                                                                                                                                                                    | 文件有變更時（PR 和手動分派）                  |
| `native-i18n`                      | 在來源 PR 上驗證原生來源擷取和本地化安全性；在產生的 PR 和手動 CI 上強制要求完整的翻譯／平台產生內容一致性                                                                                    | 與原生國際化相關的變更                         |
| `skills-python`                    | 針對以 Python 支援的 Skills 執行 Ruff + pytest                                                                                                                                                                        | 與 Python Skill 相關的變更                     |
| `checks-windows`                   | Windows 特定的程序／路徑測試，以及共用執行階段匯入指定符號的迴歸測試                                                                                                                                                   | 與 Windows 相關的變更                          |
| `macos-node`                       | 聚焦的 macOS TypeScript 測試：launchd、Homebrew、執行階段路徑、封裝指令碼、程序群組包裝函式                                                                                                                           | 與 macOS 相關的變更                            |
| `macos-swift`                      | macOS 應用程式的 Swift 程式碼檢查與建置，以及該應用程式和共用 OpenClawKit 套件的測試                                                                                                                                   | 與 macOS 相關的變更                            |
| `ios-build`                        | 產生 Xcode 專案，加上 iOS 應用程式模擬器建置                                                                                                                                                                          | iOS 應用程式、共用應用程式套件或 Swabble 變更 |
| `android`                          | 兩種變體的 Android 單元測試，加上一個偵錯 APK 建置                                                                                                                                                                    | 與 Android 相關的變更                          |
| `openclaw/ci-gate`                 | 最終彙總：要求預檢和安全性檢查；僅接受由資訊清單停用的下游通道略過                                                                                                                                                | 每次非草稿 CI 執行                             |
| `test-performance-agent`           | 獨立工作流程：在受信任的活動後，每日執行 Codex 慢速測試最佳化                                                                                                                                                         | 主要 CI 成功或手動分派                         |
| `openclaw-performance`             | 獨立工作流程：每日／依需求產生 Kova 執行階段效能報告，包含模擬供應商、深度分析和 GPT 5.6 即時通道                                                                                                                     | 排程和手動分派                                 |

獨立的 Periphery 工作流程會對 iOS 和 macOS 應用程式強制要求零無用程式碼發現。共用 OpenClawKit 工作流程會平行掃描兩個使用端，且只有在 Periphery 從兩次建置中產生相同的 Swift USR 時，才會回報宣告。其產生的 `OpenClawProtocol/GatewayModels.swift` 結構描述合約會保留為產生器擁有的程式碼，而不會被視為應用程式本機的無用程式碼。

## 快速失敗順序

1. `preflight` 決定哪些通道會存在。`docs-scope` 和 `changed-scope` 邏輯是此工作內的步驟，而不是獨立工作。標準 `main` 會立即啟動，但其並行群組僅允許一個完整執行，並將後續推送合併為一個最新的待處理執行。與 Node 相關的 main 推送也會在此處序列化唯一的相依性磁碟寫入器及其大小維護，之後下游工作才能掛載該金鑰；Blacksmith 可能只會向後續工作流程執行公開新提交，因此同一次執行的使用端會保留經標記檢查的本機後備方案。
2. `security-fast`、`check-*`、`check-additional-*`、`check-docs` 和 `skills-python` 會快速失敗，不會等待較繁重的成品和平台矩陣工作。
3. `build-artifacts` 和語系檢查會與快速 Linux 通道重疊執行。Control UI 和原生應用程式來源 PR 會排除產生的語系快照／資源；其序列化重新整理工作流程會在背景修復並自動合併隔離的產生內容 PR。來源 CI 仍會阻擋過時的來源清冊和不安全的本地化呼叫。產生的 PR、手動 CI 和發行準備會強制要求完整的翻譯／平台產生內容一致性。標準 `release/YYYY.M.PATCH` 分支可能會包含發行準備語系修復及其他產生的發行輸出。
4. 之後會展開較繁重的平台與執行階段通道：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build` 和 `android`。
5. `openclaw/ci-gate` 會等待每個已選取的通道。預檢和安全性檢查必須成功；只有資訊清單未選取的下游工作可以略過。已選取的通道若失敗或遭取消，彙總也會失敗。

合併協調器可以重複使用同一 PR 分支最新提交上已驗證成功的 `openclaw/ci-gate`，
最長可達 24 小時。這可避免在不相關的 `main` 變更後
重寫貢獻者分支。可重複使用的結果不會
取代針對目前 `main`、由 App 擁有的獨立嚴格測試合併檢查。
在有效期限內，後續待處理或失敗的重新執行不會清除
該未變更分支最新提交先前的成功結果。

預設分支規則集要求由 GitHub Actions 擁有的 `openclaw/ci-gate` 檢查。儲存庫維護者與管理員具備經稽核的緊急繞過機制，僅供已簽署的直接快轉合併使用；組織規則集仍會封鎖刪除與非快轉更新。一般 PR 合併應繼續使用此閘門，而不是繞過失敗的 CI。另一個由 App 擁有的嚴格測試合併檢查，仍會將提交頭綁定至目前的 `main`。

當較新的提交頭合併後，GitHub 可能會將已被取代的 PR 工作標記為 `cancelled`。除非同一 PR 的最新執行也失敗，否則應將其視為 CI 雜訊。正式的 `main` 執行在獲准後不會取消；當合併流量到達時，GitHub 只會以最新的分支尖端取代較舊的待處理執行。矩陣工作使用 `fail-fast: false`，而 `build-artifacts` 會直接回報內嵌通道、核心支援邊界與閘道監看失敗，而不是將小型驗證工作排入佇列。自動 CI 並行處理鍵具有版本編號（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍工作無法無限期封鎖較新的 main 執行。手動完整測試套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。外掛清單啟動記憶體防護在自架 Blacksmith Linux 上維持 350 MiB 上限，並允許 GitHub 託管的 Linux 使用 425 MiB，因為後者對相同已建置命令列介面的 RSS 基準值較高。

使用 `pnpm ci:timings`、`pnpm ci:timings:recent` 或 `node scripts/ci-run-timings.mjs <run-id>`，彙整 GitHub Actions 的實際經過時間、佇列時間、最慢工作、失敗情況，以及 `pnpm-store-warmup` 扇出屏障。工作流程內的 `ci-timings-summary` 工作存在於 `ci.yml` 中，但目前已停用（`if: false`）；請改為在本機執行計時輔助工具。若要查看建置計時，請檢查 `build-artifacts` 工作的 `Build dist` 步驟：`pnpm build:ci-artifacts` 會輸出 `[build-all] phase timings:` 並包含 `ui:build`；該工作也會上傳 `startup-memory` 成品。

## PR 背景與證據

外部貢獻者的 PR 會從
`.github/workflows/real-behavior-proof.yml` 執行 PR 背景與證據閘門。此工作流程會簽出
受信任的工作流程修訂版本（`github.workflow_sha`），且僅評估 PR 內文；
不會執行貢獻者分支中的程式碼。

此閘門適用於並非儲存庫擁有者、成員、協作者或機器人的 PR 作者。當 PR 內文包含作者撰寫的
`What Problem This Solves` 與 `Evidence` 區段時，即可通過。證據可以是聚焦的
測試、CI 結果、螢幕截圖、錄影、終端輸出、即時觀察、
已遮蔽敏感資訊的日誌或成品連結。內文提供意圖與有用的驗證資訊；
審查者會檢查程式碼、測試與 CI，以評估正確性。

當檢查失敗時，請更新 PR 內文，而不是再推送一個程式碼提交。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動分派會略過變更範圍偵測，並使預檢清單如同每個範圍區域皆有變更般運作。

獨立的 iOS 與 macOS Periphery 工作流程會強制執行零發現項目的無用程式碼政策。每個工作流程僅在非草稿 PR 觸及其原生掃描範圍時，或手動分派時執行。

- **CI 工作流程編輯**會驗證 Node CI 圖、工作流程 lint 與 Windows 工作路徑（由 `ci.yml` 執行），但本身不會強制執行 iOS、Android 或 macOS 原生建置；這些平台工作路徑仍限定於平台原始碼變更。
- **工作流程健全性檢查**會對所有工作流程 YAML 檔案執行 `actionlint`、`zizmor`、複合動作插值防護與衝突標記防護。限定於 PR 的 `security-fast` 工作也會對已變更的工作流程檔案執行 `zizmor`，讓工作流程安全性發現在主要 CI 圖中提早導致失敗。
- **推送至 `main` 時的文件**會由獨立的 `Docs` 工作流程檢查，並使用與 CI 相同的 ClawHub 文件鏡像，因此同時包含程式碼與文件的推送不會再將 CI `check-docs` 分片排入佇列。當文件有變更時，PR 與手動 CI 仍會從 CI 執行 `check-docs`。
- **終端介面 PTY**會在終端介面變更時，於 `checks-node-core-runtime-tui-pty` Linux Node 分片中執行。該分片會使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 執行 `test/vitest/vitest.tui-pty.config.ts`，因此同時涵蓋確定性的 `TuiBackend` 固定資料工作路徑，以及僅模擬外部模型端點、速度較慢的 `tui --local` 冒煙測試。
- **僅限 CI 路由的編輯、快速任務直接執行的一小組核心測試固定資料，以及範圍狹窄的外掛契約輔助工具編輯**會使用僅限 Node 的快速清單路徑：`preflight`、`security-fast`，以及變更所觸及的快速工作路徑，僅包括單一 `checks-fast-core` CI 路由任務、兩個外掛契約分片，或兩者。此路徑會略過建置成品、Node 22 相容性、通道契約、完整核心分片、內建外掛分片與其他防護矩陣。
- **Windows Node 檢查**的範圍限定於 Windows 特有的程序／路徑包裝函式、npm/pnpm/UI 執行器輔助工具、套件管理員設定，以及執行該工作路徑的 CI 工作流程介面；不相關的原始碼、外掛、安裝冒煙測試與僅測試變更，仍會留在 Linux Node 工作路徑上。

最慢的 Node 測試系列會拆分或平衡配置，使每個工作保持精簡，同時避免過度預留執行器：

- 外掛合約與頻道合約各自以兩個由 Blacksmith 支援的加權分片執行，並使用標準 GitHub 執行器作為後備。
- 核心單元快速／支援執行通道分開執行；核心執行階段基礎設施則拆分為程序、共用、掛鉤、祕密，以及三個排程領域分片。
- 自動回覆以平衡的工作程序執行，並將回覆子樹拆分為代理執行器、命令、分派、工作階段與狀態路由分片。
- 代理式閘道／伺服器（控制平面）設定會拆分至聊天、驗證、模型、HTTP／外掛、執行階段與啟動執行通道，而非等待建置成品。
- 一般 CI 僅將隔離的基礎設施包含模式分片封裝成確定性套件，每個套件最多包含 64 個測試檔案，藉此縮減 Node 矩陣，而不合併非隔離的命令／排程、具狀態的代理核心或閘道／伺服器測試套件。繁重的固定測試套件維持使用 8 vCPU，而封裝後及權重較低的執行通道則使用 4 vCPU。
- 標準儲存庫上的 PR 會針對合成合併樹差異重複使用變更測試解析器。精確的變更會執行一個目標式 Node 工作；每個選取的測試檔案都會取得自己的程序，因此具狀態測試套件的隔離仍保持完整。規劃器會結合同層測試與匯入圖相依項目，並針對工作區套件、套件／鎖定檔、共用測試工具、分割設定、重新命名或刪除的變更、公開擴充功能合約變更、具有特殊分片設定的測試、部分解析或空白目標、過大的路徑或目標計畫，以及規劃器錯誤，回復使用現有的 14 工作精簡完整測試套件計畫。目標式計畫一律保留完整的建置成品邊界閘門，因為其儲存庫掃描器無法從匯入關係推導。`main` 推送會執行相同的完整精簡測試套件：待處理的中間推送事件可能合併，因此最新保留的執行必須驗證完整的整合樹，而不能只驗證最後一次單一推送的差異。手動分派與發布閘門則保留完整的具名逐分片矩陣。
- 完整 Node 矩陣會優先納入一貫緩慢的序列工具、自動回覆命令分片，以及廣泛的核心快速快取寫入器。這既能維持 28 個工作的上限，也能避免關鍵路徑工作與下一次執行的轉換種子延後至後續批次。
- 廣泛的瀏覽器、QA、媒體及其他外掛測試會使用其專用 Vitest 設定，而非共用的外掛全包式設定。包含模式分片會使用 CI 分片名稱記錄計時項目，因此 `.artifacts/vitest-shard-timings.json` 能區分完整設定與經過篩選的分片。
- Linux Node 分片工作會透過上游 Actions 快取 API 保存 Vitest 的實驗性檔案系統模組快取，Blacksmith 會在其執行器上透明地加速此快取。每個 CI 分片都僅執行還原，並將受保護種子解壓縮至各自的執行器本機根目錄；接著，分片包裝器會為並行的 Vitest 程序提供獨立的即時子目錄。只有不會取消的每日暖機器或明確分派的暖機器會儲存新的不可變封存，因此 PR 無法發布轉換結果或建立每個 PR 專屬的快取系列。轉換輸入指紋會清除不相容的鎖定檔、套件、tsconfig 與 Vitest 設定世代。受保護的寫入器會掃描其還原的快取，並在快取超過 2 GiB 後修剪至 75%。Vitest 會雜湊模組 ID、原始碼內容、環境與解析後的轉換設定，因此一般的部分原始碼變更可讓未變更項目保持暖機，而已變更的模組則會安全地未命中快取。粗粒度還原前綴會銜接不同工作流程執行；一般 Actions 快取的 LRU 與閒置淘汰機制則會限制舊的不可變封存。
- 受信任的 Linux Node 工作也會針對每條支援的 Node 版本線，從單一受保護的相依套件磁碟繫結 pnpm 儲存庫與 `node_modules`。套件資訊清單、安裝設定、執行器平台及確切的 Node 修補版本不會納入磁碟金鑰；確切的執行階段與安裝輸入指紋會決定工作是重複使用該樹，還是重新安裝並重新整理同一磁碟。雜湊前會先將資訊清單標準化。經稽核的直接根掛鉤只保留 pnpm 的安裝生命週期指令碼，因此格式化及一般測試／建置指令碼的編輯可繼續使用暖機的相依套件樹；未經稽核的生命週期掛鉤漂移會採取封閉式失敗，直到其來源輸入納入指紋合約為止。相依套件、套件管理器、掛鉤來源與鎖定檔的變更一律會使快照失效。指紋相符是必要但非充分條件：設定也會檢查匯入端封存與資訊清單總和檢查碼，然後根據 Node 從各匯入端解析的套件資訊清單，驗證由 postinstall 保留、以登錄檔為依據的鎖定檔相依套件。匯入端內容遺失或過時時，會回復為全新安裝，而非提供根層級提升內容。若 PR 的唯讀快照無法使用，會解除工作區繫結並安裝至執行器本機儲存空間，避免緩慢寫入其無法發布的複本。黏著式冷安裝會停用 pnpm 的內部擷取重試，並利用逐步暖機的儲存庫進行最多三次有界限的完整安裝嘗試；逾時仍視為失敗。在經過內容驗證的還原或凍結鎖定檔安裝後，設定會停用 pnpm 重複的執行前相依套件檢查：儲存庫會刻意修剪外掛本機的 `node_modules`，否則 pnpm 會將其視為過時，並在分片展開期間透過不安全的並行隱含安裝進行修復。標準 main 預先檢查是唯一的寫入器，且會在每次重新整理時測量儲存庫；只有淘汰的套件版本使其超過 8 GiB 後，才會執行 `pnpm store prune`。即使寫入器工作已完成，Blacksmith 快照發布仍是非同步進行，因此使用新金鑰或指紋後的第一次執行仍可能是冷啟動；後續通過內容驗證的精確標記還原才是推出完成的證明。必要的 CI 工作與 PR 會取得可拋棄的複本，因此相依套件變更不會建立新磁碟、競爭快照或產生可能取消建置的快取鎖定。
- Node 分片與建置成品工作也會透過不可變 Actions 快取還原 Node 的可攜式磁碟編譯快取。獨立的 `test` 與 `build` 命名空間可避免各自的寫入器取代對方的封存：排程測試暖機器擁有受保護的測試種子，而 `build-artifacts` 每個 UTC 日最多可從受信任的 `main` 推送發布一個受保護建置封存。PR 與一般測試工作只會讀取受保護快照，因此功能分支的位元組碼永遠不會進入共用種子，PR 流量也不會建立快取封存。這可跨不同簽出路徑重複使用由 Node 載入的協調程式、建置工具及外部相依套件所使用的 V8 位元組碼，即使只有部分原始碼圖發生變更亦然。Vitest 子程序會停用繼承的編譯快取，因為涵蓋率可能在動態設定中啟用，而從位元組碼還原序列化指令碼時，V8 涵蓋率可能會失去原始碼位置的精確度。
- 建置成品工作也會保存依內容指紋識別的 `build-all` 步驟輸出。CI 自行建置的外掛 SDK 宣告會雜湊完整的儲存庫自有 TypeScript／JSON 原始碼圖，排除已安裝與已產生的目錄，並在 `tsdown` 清除 `dist` 後還原扁平宣告與套件橋接。該圖以外的文件、工作流程、外掛及其他變更可以重複使用宣告快照；原始碼變更則會在匯出閘門執行前重新建置該快照。
- 完整宣告建置會將 `tsdown` 拆分為 AI、工作區套件與統一群組。每個群組只快取宣告，但仍會先重新建置執行階段 JavaScript，再還原這些宣告。因此，核心或外掛變更只會使大型統一圖失效，而工作區套件變更則會保守地使每個相依宣告群組失效。公開完整建置通常使用不可變 Actions 快取；粗粒度還原金鑰會為部分變更提供種子，各群組的內容指紋會拒絕過時資料，而 GitHub 的快取配額會淘汰舊世代。每週 Node 22 執行通道則會在成功執行 `main` 後發布保留 14 天的成品，並只還原其不可變產生者身分在 `main` 上解析為該工作流程的成品，以避免配額頻繁變動，同時不允許 PR 程式碼寫入共用快取。私人 QA 宣告永遠不會保存在 Actions 快取中，因為快取命名空間並非機密性邊界。
- `check-additional-*` 會將補充邊界防護清單（`scripts/run-additional-boundary-checks.mjs`）劃分為一個提示詞密集分片（`check-additional-boundaries-a`，其中包含 Codex 提示詞快照漂移檢查）與一個涵蓋其餘條帶的合併分片（`check-additional-boundaries-bcd`）；兩者各自並行執行獨立防護並列印每項檢查的計時。套件邊界編譯／金絲雀工作會維持在一起，而執行階段拓撲架構則與嵌入 `build-artifacts` 的閘道監看涵蓋率分開執行。
- 在配備 32 vCPU 的自託管建置執行器上，閘道監看、頻道測試與核心支援邊界分片會在 `dist/` 和 `dist-runtime/` 已建置完成後，一同於 `build-artifacts` 內啟動。GitHub 託管的後備執行會讓閘道監看保持序列執行，避免低核心數資源爭用耗盡其就緒期限。

獲准執行後，標準 Linux CI 最多允許 28 個 Node 測試工作並行執行，
較小型的快速／檢查執行通道則最多允許 12 個；Windows 與 Android 維持為兩個，因為
這些執行器集區較小。精簡的完整設定批次採用
120 分鐘批次逾時，而包含模式群組則共用相同的有界工作預算。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play 偵錯 APK。第三方變體沒有獨立的原始碼集或資訊清單；其單元測試執行通道仍會使用 SMS／通話記錄 BuildConfig 旗標編譯該變體，同時避免在每次 Android 相關推送時重複執行偵錯 APK 封裝工作。每個目前的 Gradle 工作都具有一個受保護的黏著式磁碟；PR 工作使用可拋棄的複本，而受保護的執行則會就地重新整理依內容定址的 Gradle 項目。

Blacksmith 黏著式磁碟金鑰會刻意限制在支援的執行階段或工作維度內，絕不包含 PR 編號、提交、執行、分支或相依套件雜湊。執行階段轉換與編譯快取會使用 Actions 快取而非黏著式磁碟，因為不可變封存可提供能驗證的還原／儲存結果，並避免可變快照提升失敗。黏著式金鑰版本遷移後，僅將確切的淘汰金鑰、架構與區域身分新增至 `.github/retired-sticky-disks.json`，以相同維度與確認條件從 `main` 分派 `Sticky Disk Cleanup`，驗證刪除結果，然後移除這些項目。工作流程會將 ARM 身分路由至 ARM 執行器、拒絕執行器與區域不符的情況、使用 Blacksmith 的精確金鑰刪除動作，且絕不刪除 Docker 建置器快取或萬用字元前綴。Actions 快取封存使用一般的 LRU 與閒置淘汰機制。

`check-dependencies` 分片會執行生產環境 Knip 相依套件、未使用檔案及未使用匯出檢查。當 PR 新增未經審查的未使用檔案或留下過時的允許清單項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析、但刻意存在的動態外掛、產生內容、建置、即時測試與套件橋接介面。未使用匯出防護會排除測試支援檔案，並在任何未使用的生產環境匯出存在時失敗；刻意使用的動態消費端必須在 `config/knip.config.ts` 中建立模型。歷史目標若提供匯出防護便會執行該防護，否則保留其較舊的無用程式碼後備機制。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是將 OpenClaw 儲存庫活動傳入 ClawSweeper 的目標端橋接器。它不會簽出或執行不受信任的 PR 程式碼。此工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App 權杖，然後將精簡的 `repository_dispatch` 承載資料分派至 `openclaw/clawsweeper`。

此工作流程有四個管線：

- `clawsweeper_item`，用於明確的議題和 PR 審查請求；
- `clawsweeper_comment`，用於議題留言中的明確 ClawSweeper 命令；
- `clawsweeper_commit_review`，用於 `main` 推送上的提交層級審查請求；
- `github_activity`，用於 ClawSweeper 代理程式可能檢查的一般 GitHub 活動。

`github_activity` 管線只會轉送正規化後的中繼資料：事件類型、動作、執行者、儲存庫、項目編號、URL、標題、狀態，以及存在時的留言或審查簡短摘錄。它刻意避免轉送完整的網路鉤子本文。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，它會將正規化後的事件張貼至供 ClawSweeper 代理程式使用的 OpenClaw 閘道鉤子。

一般活動是觀察項目，預設不會傳遞。ClawSweeper 代理程式會在其提示中收到 Discord 目標，且只有在事件令人意外、可採取行動、具有風險或對維運有用時，才應張貼至 `#clawsweeper`。例行的開啟、編輯、機器人擾動、重複的網路鉤子雜訊及正常審查流量，應產生 `NO_REPLY`。

在此路徑中，應始終將 GitHub 標題、留言、本文、審查文字、分支名稱及提交訊息視為不受信任的資料。它們是摘要和分類的輸入，而不是工作流程或代理程式執行階段的指示。

## 手動分派

手動 CI 分派會執行與一般 CI 相同的工作圖，但會強制啟用每個非 Android 範圍管線：Linux 節點分片、隨附外掛分片、外掛與頻道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品煙霧檢查、文件檢查、Python Skills、Windows、macOS、iOS 建置，以及 Control UI／原生應用程式國際化。自動來源 PR 會驗證原生擷取清單和 Android／Apple 在地化安全性，而不要求同一個 PR 中包含翻譯或平台產生的輸出。序列化的 Native App Locale Refresh 工作流程會在一個隔離的 PR 中重建這些成品，並在必要檢查通過後啟用精確 HEAD 自動合併。對於產生成品的 PR、手動 CI、Full Release Validation 和發行準備，完整的原生一致性仍是阻擋條件。Control UI 語系一致性在自動 PR 和 `main` 執行中仍僅供參考，在手動／發行 CI 中則是阻擋條件。獨立的手動 CI 分派只有搭配 `include_android=true` 才會執行 Android（`release_gate` 輸入也會強制執行 Android）；完整發行總流程會傳入 `include_android=true` 來啟用 Android。CI 不包含外掛預發行靜態檢查、僅供發行使用的 `agentic-plugins` 分片、完整擴充套件批次掃描，以及外掛預發行 Docker 管線。只有當 `Full Release Validation` 在啟用發行驗證閘門的情況下分派獨立的 `Plugin Prerelease` 工作流程時，才會執行 Docker 預發行套件。

PR 最大行數檢查會從已簽出的合成合併樹衍生基準，並依據事件 HEAD 驗證其 HEAD 父項。手動執行使用唯一的並行群組，因此候選發行版本的完整套件不會被相同 ref 上的其他推送或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫者針對分支、標籤或完整提交 SHA 執行該工作圖，同時使用所選分派 ref 中的工作流程檔案；最大行數基準會與目標的合併基準比較，而該合併基準是針對該次執行所解析的預設分支 HEAD。`release_gate` 輸入是供維護者在 PR CI 因容量而停滯時使用的精確 SHA 備援：它要求 `target_ref` 必須是符合所分派分支 HEAD 的完整提交 SHA，且 `pull_request_number` 必須識別其合併樹將接受驗證的開放 PR。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

每月僅 npm 的延伸穩定版路徑是例外：請從精確的
`extended-stable/YYYY.M.33` 分支分派 `OpenClaw NPM
Release` 預檢和 `Full Release Validation`，保留其執行 ID，並將兩個 ID 傳入
直接 npm 發布執行。關於命令、確切身分要求、登錄檔回讀及選擇器
修復程序，請參閱[每月僅 npm 的延伸穩定版
發布](/zh-TW/reference/RELEASING#monthly-npm-only-extended-stable-publication)。此路徑不會分派外掛、macOS、Windows、GitHub
Release、私有 dist-tag 或其他平台發布。

## 執行器

| 執行器                          | 工作                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `security-fast`、手動 CI 分派和非標準儲存庫備援、QA Smoke 彙總、CodeQL 安全性和品質掃描、工作流程健全性檢查、標籤工具、自動回覆、獨立的 Docs 工作流程，以及完整的 Install Smoke 工作流程                                |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`pnpm-store-warmup`、`native-i18n`、除 QA Smoke CI 外的 `checks-fast-core`、外掛／頻道合約分片、大多數隨附／低負載 Linux 節點分片、除 `check-lint` 外的 `check-*` 管線、選定的 `check-additional-*` 分片、`check-docs` 和 `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保留的高負載 Linux 節點套件、邊界／擴充套件負載較高的 `check-additional-*` 分片，以及 `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | 自動 QA Smoke CI 分片、CI 和 Testbox 中的 `build-artifacts`，以及 `check-lint`（對 CPU 足夠敏感，因此 8 vCPU 的成本高於所節省的成本）                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上的 `macos-node`；分支儲存庫會退回使用 `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上的 `macos-swift` 和 `ios-build`；分支儲存庫會退回使用 `macos-26`                                                                                                                                                                                               |

## 執行器註冊配額

OpenClaw 目前的 GitHub 執行器註冊配額在 `ghx api rate_limit` 中顯示為每 5 分鐘 10,000 個自架
執行器註冊。由於 GitHub 可能變更
此配額，請在每次調校前重新檢查 `actions_runner_registration`。此限制由
`openclaw` 組織中的所有 Blacksmith 執行器註冊共用，因此新增另一個 Blacksmith 安裝並不會增加
新的配額。

將 Blacksmith 標籤視為控制突發量的稀缺資源。只負責
路由、通知、摘要、選擇分片或執行短時間 CodeQL 掃描的工作應
留在 GitHub 代管執行器上，除非它們有經實測的 Blacksmith 特定需求。
任何新的 Blacksmith 矩陣、更大的 `max-parallel` 或高頻率
工作流程都必須顯示其最壞情況註冊數，並將組織層級
目標維持在即時配額的約 60% 以下。以目前 10,000 次註冊的
配額而言，這代表 6,000 次註冊的運作目標，並為
並行儲存庫、重試及突發重疊保留餘裕。

變更目標 PR 計畫會將常見的 Node 測試突發量從 14 次 Blacksmith 註冊降低至 1 次。廣泛風險 PR 會保留 14 次註冊的精簡備援，因此最壞情況不會增加。

標準儲存庫 CI 會繼續將 Blacksmith 作為一般推送和 PR 執行的預設執行器路徑。`workflow_dispatch` 和非標準儲存庫執行會使用 GitHub 代管執行器，但目前一般的標準儲存庫執行不會探測 Blacksmith 佇列健康狀況，也不會在 Blacksmith 無法使用時自動退回至 GitHub 代管標籤。

## 本機對應命令

```bash
pnpm changed:lanes                            # 檢查 origin/main...HEAD 的本機變更管線分類器
pnpm check:changed                            # 智慧本機檢查閘門：依邊界管線檢查已變更的格式、型別檢查、lint 和防護
pnpm check                                    # 快速本機閘門：正式環境 tsgo + 分片 lint + 平行快速防護
pnpm check:test-types
pnpm check:timed                              # 相同閘門，並附有各階段計時
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest 測試
pnpm test:changed                             # 低成本的智慧變更 Vitest 目標
pnpm test:ui                                  # Control UI 單元／瀏覽器套件
pnpm ui:i18n:check                            # 產生的 Control UI 語系一致性（發行閘門）
pnpm native:i18n:baseline                     # 更新由原始碼擁有的原生擷取清單
pnpm native:i18n:verify                       # 原始碼清單 + Android／Apple 在地化安全性
pnpm native:i18n:check                        # 嚴格的翻譯／平台產生內容一致性（發行閘門）
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # 文件格式 + lint + 失效連結
pnpm build                                    # 當 CI 成品／煙霧檢查很重要時建置 dist
pnpm ios:build                                # 產生並建置 iOS 應用程式專案
pnpm ci:timings                               # 摘要最新的 origin/main 推送 CI 執行
pnpm ci:timings:recent                        # 比較近期成功的 main CI 執行
node scripts/ci-run-timings.mjs <run-id>      # 摘要總耗時、排隊時間及最慢工作
node scripts/ci-run-timings.mjs --latest-main # 忽略議題／留言雜訊並選擇 origin/main 推送 CI
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

手動分派通常會對工作流程參照進行基準測試。設定 `target_ref`，即可使用目前的工作流程實作，對發行標籤或其他分支進行基準測試。已發布的報告路徑與 latest 指標會依受測參照建立索引，而每個 `index.md` 都會記錄受測參照/SHA、工作流程參照/SHA、Kova 參照、設定檔、執行通道驗證模式、模型、重複次數及情境篩選條件。

工作流程會從固定的發行版本安裝 OCM，並從 `openclaw/Kova` 使用固定的 `kova_ref` 輸入安裝 Kova，接著執行三個通道：

- `mock-provider`：針對本機建置執行階段執行 Kova 診斷情境，並使用具確定性的假 OpenAI 相容驗證。
- `mock-deep-profile`：針對啟動、閘道及代理程式回合熱點進行 CPU/堆積/追蹤分析。依排程執行，或在使用 `deep_profile=true` 分派時執行。
- `live-openai-candidate`：執行真實的 OpenAI `openai/gpt-5.6-luna` 代理程式回合；當 `OPENAI_API_KEY` 無法使用時略過。依排程執行，或在使用 `live_openai_candidate=true` 分派時執行。

模擬供應商通道也會在 Kova 通過後執行 OpenClaw 原生原始碼探測：測量預設、略過通道、內部掛鉤及五十個外掛啟動案例的閘道開機時間與記憶體；測量內建外掛匯入 RSS、重複的模擬 OpenAI `channel-chat-baseline` hello 迴圈、針對已啟動閘道執行的命令列介面啟動命令，以及 SQLite 狀態煙霧效能探測。若受測參照先前發布的模擬供應商原始碼報告可供使用，原始碼摘要會將目前的 RSS 與堆積值和該基準比較，並將大幅增加的 RSS 標示為 `watch`。原始碼探測的 Markdown 摘要位於報告套件中的 `source/index.md`，原始 JSON 則置於其旁。

每個通道都會上傳完整的 GitHub 成品，包括 CPU、堆積、追蹤及壓縮的診斷套件。獨立的發布工作會下載並驗證這些成品，接著鑄發一個短期有效、權限僅限於 `openclaw/clawgrit-reports` 內容的 ClawSweeper GitHub App 權杖，並只將其傳遞給 Git push 步驟。它會將 `report.json`、`report.md`、`index.md`、原始碼探測成品及套件中繼資料/總和檢查碼提交至 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`；完整診斷封存檔則保留在連結的 Actions 成品中。發布程式在嘗試推送前，會拒絕任何超過 50 MB 的報告檔案。受測參照目前的指標為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。若應用程式權杖建立或報告發布失敗，排程執行與 `profile=release` 分派將會失敗。對於手動的非發行分派，發布仍屬建議性質，且驗證或發布失敗時會保留 GitHub 成品。先前的原始碼基準會以匿名方式從公開報告儲存庫擷取，因此成功擷取基準並不能證明發布程式已通過驗證。

## 完整發行驗證

`Full Release Validation` 是用於“發行前執行所有項目”的手動總括工作流程。它接受分支、標籤或完整提交 SHA，使用該目標分派手動 `CI` 工作流程（包括 Android）、分派 `Plugin Prerelease` 以執行僅限發行的外掛/套件/靜態/Docker 證明、針對目標 SHA 分派 `OpenClaw Performance`，並分派 `OpenClaw Release Checks` 以執行安裝煙霧測試、套件驗收、跨作業系統套件檢查、QA Lab 同等性、Matrix、Telegram，以及受閘門控管的 Discord、WhatsApp 和 Slack 通道（建議性的成熟度計分卡轉譯可透過 `run_maturity_scorecard` 選擇啟用）。穩定與完整設定檔一律包含詳盡的即時/E2E 及 Docker 發行路徑浸泡測試涵蓋範圍；beta 設定檔可透過 `run_release_soak=true` 選擇啟用。標準套件 Telegram E2E 會在套件驗收中執行，因此完整候選版本不會啟動重複的即時輪詢程式。發布後，傳入 `release_package_spec`，即可在發行檢查、套件驗收、Docker、跨作業系統及 Telegram 中重複使用已發布的 npm 套件，而無須重新建置。僅在需要針對已發布套件執行聚焦的 Telegram 重跑時，才使用 `npm_telegram_package_spec`。Codex 外掛即時套件通道預設使用相同的選定狀態：已發布的 `release_package_spec=openclaw@<tag>` 會衍生 `codex_plugin_spec=npm:@openclaw/codex@<tag>`，而 SHA/成品執行會從選定參照封裝 `extensions/codex`。若要使用自訂外掛來源，例如 `npm:`、`npm-pack:` 或 `git:` 規格，請明確設定 `codex_plugin_spec`。其即時代理程式證明會傳送可見的進度、持續執行隨機化的工作區讀取與精確的成品寫入，然後傳送完成訊息。

如需階段矩陣、確切的工作流程工作名稱、設定檔差異、成品及聚焦重跑控制代碼，請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)。

`OpenClaw Release Publish` 是手動變更狀態的發行工作流程。在發行標籤存在且 OpenClaw npm 預檢成功後，從受信任的 `main` 分派一般 beta 與穩定版本發布（預檢會在其檢查項目中執行 `pnpm plugins:sync:check`）。標籤仍會選定確切的發行提交，包括 `release/YYYY.M.PATCH` 上的提交；Tideclaw alpha 發布則繼續使用其對應的 alpha 分支。它需要已儲存的 `preflight_run_id`、成功的 `full_release_validation_run_id` 及其確切的 `full_release_validation_run_attempt`，並為所有可發布的外掛套件分派 `Plugin NPM Release`、針對相同的發行 SHA 分派 `Plugin ClawHub Release`，然後才分派 `OpenClaw NPM Release`。穩定版本發布還需要確切的 `windows_node_tag`；工作流程會在任何發布子工作流程之前驗證 Windows 原始碼發行版本，並將其 x64/ARM64 安裝程式與候選版本已核准的 `windows_node_installer_digests` 輸入比較，接著在發布 GitHub 發行草稿前，提升並驗證相同的固定安裝程式摘要，以及確切的配套資產和總和檢查碼合約。聚焦的僅外掛修復會使用 `plugin_publish_scope=selected`，並提供非空白套件清單。僅外掛的 `all-publishable` 執行需要與核心發布相同的不可變 npm 預檢及完整發行驗證證據。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上對固定提交進行證明，請使用輔助程式，而不要使用 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程分派參照必須是分支或標籤，不能是原始提交 SHA。輔助程式會在受信任的 `main` 工作流程 SHA 建立並推送暫時的 `release-ci/<sha>-...` 分支，透過工作流程的 `ref` 輸入傳遞要求的目標 SHA、在可用時重複使用嚴格的確切目標證據、驗證每個子工作流程的 `headSha` 都符合受信任的工作流程 SHA，並在執行完成時刪除暫時分支。傳入 `-f reuse_evidence=false` 可強制執行全新驗證。若任何子工作流程使用不同的工作流程 SHA 執行，總括驗證程式也會失敗。

`release_profile` 控制傳遞至發行檢查的即時/供應商涵蓋廣度。手動發行工作流程預設為 `stable`；只有在你刻意要使用廣泛的建議性供應商/媒體矩陣時，才使用 `full`。穩定與完整發行檢查一律執行詳盡的即時/E2E 及 Docker 發行路徑浸泡測試；beta 設定檔可透過 `run_release_soak=true` 選擇啟用。

- `beta` 保留最快的 OpenAI/核心發行關鍵通道。
- `stable` 新增穩定的供應商/後端集合。
- `full` 執行廣泛的建議性供應商/媒體矩陣。

總括工作流程會記錄已分派的子執行 ID，而最終的 `Verify full validation` 工作會重新檢查目前的子執行結論，並為每個子執行附加最慢工作表格。若重新執行子工作流程後轉為綠燈，只需重新執行父驗證程式工作，即可重新整理總括結果與時間摘要。

若要進行復原，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。針對發行候選版本使用 `all`；僅針對一般完整 CI 子工作流程使用 `ci`；僅針對外掛預發行子工作流程使用 `plugin-prerelease`；僅針對 OpenClaw Performance 子工作流程使用 `performance`；針對所有發行子工作流程使用 `release-checks`；或在總括工作流程上使用較窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這可讓發行執行環境在聚焦修正後，將失敗項目的重跑限制在一定範圍內。針對單一失敗的跨作業系統通道，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合使用，例如 `windows/packaged-upgrade`；長時間執行的跨作業系統命令會輸出心跳偵測行，而封裝的升級摘要會包含各階段計時。選定的 Matrix 與 Telegram QA 通道會阻擋一般發行驗證，標準執行階段工具涵蓋閘門亦同。QA 同等性、執行階段同等性，以及受閘門控管的 Discord、WhatsApp 和 Slack 即時通道屬於建議性項目。

`OpenClaw Release Checks` 使用受信任的工作流程參照，將選定參照一次解析為 `release-package-under-test` tarball，接著將該成品傳遞給跨作業系統檢查與套件驗收，並在執行浸泡測試涵蓋時，傳遞給即時/E2E 發行路徑 Docker 工作流程。這可讓發行執行環境間的套件位元組保持一致，並避免在多個子工作中重複封裝同一個候選版本。對於 Codex npm 外掛即時通道，發行檢查會傳遞從 `release_package_spec` 衍生且相符的已發布外掛規格、傳遞操作者提供的 `codex_plugin_spec`，或將輸入留空，讓 Docker 指令碼封裝選定簽出中的 Codex 外掛。

針對 `ref=main` 與 `rerun_group=all` 重複執行的 `Full Release Validation` 會取代較舊的總括工作流程。父監控程式在父工作流程被取消時，會取消其已分派的所有子工作流程，因此較新的 main 驗證不會排在已過時、長達兩小時的發行檢查執行之後。發行分支/標籤驗證與聚焦重跑群組會保留 `cancel-in-progress: false`。

## 即時與 E2E 分片

發行即時/E2E 子工作流程會保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而非使用單一循序工作：

- `native-live-src-agents` 與 `native-live-src-agents-zai-coding`
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
- 拆分的媒體音訊/視訊分片，以及依供應商篩選的音樂分片

這會維持相同的檔案涵蓋範圍，同時讓速度緩慢的即時供應商失敗更容易重新執行與診斷。彙總的 `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` 分片名稱仍可用於手動單次重跑。

原生即時媒體分片會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，而該映像由 `Live Media Runner Image` 工作流程建置。此映像會預先安裝 `ffmpeg` 與 `ffprobe`；媒體工作在設定前只會驗證二進位檔。請讓以 Docker 為基礎的即時測試套件在一般 Blacksmith 執行器上執行——容器工作不適合啟動巢狀 Docker 測試。

由 Docker 支援的即時模型／後端分片，會針對所選的每個提交使用獨立的共用 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` 映像。即時發布工作流程只建置並推送該映像一次，接著 Docker 即時模型、依供應商分片的閘道、命令列介面後端、ACP 繫結及 Codex 測試框架分片會使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。閘道 Docker 分片具有明確且低於工作流程作業逾時的指令碼層級 `timeout` 上限，因此容器卡住或清理路徑停滯時會快速失敗，而不會耗盡整個發布檢查的時間預算。如果這些分片各自重新建置完整的來源 Docker 目標，表示發布執行設定錯誤，並會因重複建置映像而浪費實際經過時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件能否作為產品正常運作？」時，請使用 `Package Acceptance`。它與一般 CI 不同：一般 CI 驗證原始碼樹，而套件驗收則透過使用者安裝或更新後所使用的相同 Docker E2E 測試框架，驗證單一 tarball。

### 作業

1. `resolve_package` 會簽出 `workflow_ref`、解析一個候選套件、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者上傳為 `package-under-test` 成品，並在 GitHub 步驟摘要中輸出來源、工作流程參照、套件參照、版本、SHA-256 和設定檔。
2. `package_integrity` 會下載 `package-under-test` 成品，並使用 `scripts/check-openclaw-package-tarball.mjs` 強制執行公開套件 tarball 合約。
3. `docker_acceptance` 會使用解析出的套件來源 SHA（若無則退回使用 `workflow_ref`）及 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重複使用的工作流程會下載該成品、驗證 tarball 清單、視需要準備套件摘要 Docker 映像，並針對該套件執行選定的 Docker 執行通道，而不是封裝工作流程的簽出內容。當設定檔選取多個目標 `docker_lanes` 時，可重複使用的工作流程只會準備套件和共用映像一次，接著將這些執行通道展開為平行的目標 Docker 作業，並各自產生唯一成品。
4. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。它會在 `telegram_mode` 不是 `none` 時執行；若套件驗收已解析出套件，則會安裝相同的 `package-under-test` 成品。獨立的 Telegram 分派仍可安裝已發布的 npm 規格。
5. `summary` 會在套件解析、完整性檢查、Docker 驗收或選用的 Telegram 執行通道失敗時，使工作流程失敗。對於諮詢性質的呼叫者，`advisory` 輸入會將驗收失敗降級為警告。

### 候選來源

- `source=npm` 僅接受 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`，或如 `openclaw@2026.4.27-beta.2` 的確切 OpenClaw 發布版本。請將其用於已發布的延伸穩定版、預發布版或穩定版驗收。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支／標籤、驗證所選提交可從儲存庫分支歷史記錄或發布標籤觸及、在分離的工作樹中安裝相依套件，並使用 `scripts/package-openclaw-for-docker.mjs` 將其封裝。
- `source=url` 會下載公開 HTTPS `.tgz`；必須提供 `package_sha256`。此路徑會拒絕 URL 認證資訊、非預設 HTTPS 連接埠、私有／內部／特殊用途的主機名稱或解析後 IP，以及不符合相同公開安全政策的重新導向。
- `source=trusted-url` 會從 `.github/package-trusted-sources.json` 中具名的受信任來源政策，下載 HTTPS `.tgz`；必須提供 `package_sha256` 和 `trusted_source_id`。僅應將其用於維護者擁有的企業鏡像或私有套件儲存庫，且這些來源需要設定主機、連接埠、路徑前置詞、重新導向主機或私有網路解析。如果政策宣告使用持有人權杖驗證，工作流程會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密鑰；仍會拒絕嵌入 URL 的認證資訊。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選填，但對外分享的成品應提供此值。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程／測試框架程式碼。`package_ref` 則是 `source=ref` 時要封裝的來源提交。這可讓目前的測試框架驗證較舊的受信任來源提交，而不必執行舊版工作流程邏輯。

### 套件組設定檔

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 集合，但使用即時 `plugins` 涵蓋範圍取代 `plugins-offline`，並加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 確切的 `docker_lanes`；當 `suite_profile=custom` 時為必要項目

`package` 設定檔使用離線外掛涵蓋範圍，因此已發布套件的驗證不會受即時 ClawHub 可用性限制。選用的 Telegram 執行通道會在 `NPM Telegram Beta E2E` 中重複使用 `package-under-test` 成品，而已發布 npm 規格的路徑則保留供獨立分派使用。

關於專用的更新和外掛測試政策，包括本機命令、
Docker 執行通道、套件驗收輸入、發布預設值及失敗分流，
請參閱[測試更新和外掛](/zh-TW/help/testing-updates-plugins)。

發布檢查會使用 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` 和 `telegram_mode=mock-openai` 呼叫套件驗收。這能讓套件遷移、更新、即時 ClawHub skill 安裝、過時外掛相依性清理、已設定外掛安裝修復、離線外掛、外掛更新和 Telegram 證明，都使用相同的已解析套件 tarball。發布 beta 版後，可在完整發布驗證或 OpenClaw 發布檢查中設定 `release_package_spec`，針對已發布的 npm 套件執行相同矩陣而無須重新建置；只有在套件驗收所需套件與其餘發布驗證不同時，才設定 `package_acceptance_package_spec`。跨作業系統發布檢查仍會涵蓋各作業系統特有的引導設定、安裝程式和平台行為；套件／更新產品驗證應從套件驗收開始。

`published-upgrade-survivor` Docker 執行通道會在阻斷式發布路徑中，每次執行驗證一個已發布套件基準。在套件驗收中，解析出的 `package-under-test` tarball 一律是候選套件，而 `published_upgrade_survivor_baseline` 會選取備援的已發布基準，預設為 `openclaw@latest`；失敗執行通道的重新執行命令會保留該基準。使用 `run_release_soak=true` 或 `release_profile=full` 的完整發布驗證會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展至最新四個穩定 npm 發布版本，並加上釘選的外掛相容性邊界版本，以及針對 Feishu 設定、保留的啟動／角色設定檔案、已設定的 OpenClaw 外掛安裝、波浪號記錄路徑和過時舊版外掛相依性根目錄等問題型態的測試資料。多基準已發布升級存續者的選取會依基準分片為個別的目標 Docker 執行器作業。當問題是完整的已發布更新清理，而不是一般完整發布 CI 的涵蓋廣度時，獨立的 `Update Migration` 工作流程會使用採用 `all-since-2026.4.23` 基準和 `plugin-deps-cleanup` 情境的 `update-migration` Docker 執行通道。本機彙總執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入確切套件規格、使用如 `openclaw@2026.4.15` 的 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一執行通道，或為情境矩陣設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`。已發布套件執行通道會使用內建的 `openclaw config set` 命令配方設定基準、在 `summary.json` 中記錄配方步驟，並在閘道啟動後探查 `/healthz`、`/readyz` 及 RPC 狀態。Windows 封裝套件和安裝程式的全新安裝執行通道也會驗證已安裝的套件能否從原始絕對 Windows 路徑匯入瀏覽器控制覆寫。OpenAI 跨作業系統代理程式回合煙霧測試在已設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.6-luna`，讓安裝和閘道驗證採用成本較低的 GPT-5.6 測試層級。

### 舊版相容性期間

套件驗收針對已發布的套件設有有限的舊版相容性期間。截至 `2026.4.25` 的套件（包括 `2026.4.25-beta.*`）可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可指向 tarball 中省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從衍生自 tarball 的模擬 git 測試資料中移除缺少的 pnpm `patchedDependencies`，並可記錄缺少的持久化 `update.channel`；
- 外掛煙霧測試可讀取舊版安裝記錄位置，或接受市集安裝記錄未持久化；
- `plugin-update` 可允許設定中繼資料遷移，但仍要求安裝記錄及不重新安裝的行為維持不變。

已發布的 `2026.4.26` 套件也可針對已隨套件發布的本機建置中繼資料戳記檔案發出警告，而截至 `2026.5.20` 的套件可在缺少 `npm-shrinkwrap.json` 時發出警告而非失敗。後續套件必須符合現代合約；相同情況將直接失敗，而不是警告或略過。

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

# 驗證來自具名受信任私有鏡像政策的 tarball。
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

偵錯失敗的套件驗收執行時，請先查看 `resolve_package` 摘要，以確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、執行通道記錄、階段計時和重新執行命令。請優先重新執行失敗的套件設定檔或確切 Docker 執行通道，而不是重新執行完整發布驗證。

## 安裝煙霧測試

`Install Smoke` 工作流程不再於 PR 或 `main` 推送時執行。其每夜／手動包裝器與發布驗證都會呼叫唯讀的 `install-smoke-reusable.yml` 核心，而且每次執行都會在 GitHub 託管的執行器上完成完整的安裝煙霧測試路徑：

- 根 Dockerfile 煙霧測試映像會針對每個目標 SHA 建置一次，並在不可變成品中繫結至工作流程修訂版與產生者嘗試次數，之後由命令列介面煙霧測試、代理程式刪除共享工作區命令列介面煙霧測試、容器閘道網路 E2E，以及內附的 `matrix` 外掛建置引數煙霧測試載入。外掛煙霧測試會驗證執行階段相依套件安裝鏡像，以及外掛載入時不會出現進入點逸出診斷。
- QR 套件安裝與安裝程式／更新 Docker 煙霧測試（包括 Rocky Linux 安裝程式執行路徑，以及針對可設定之 `update_baseline_version` npm 基準線的更新執行路徑）會以個別工作執行，讓安裝程式工作不必等待根映像煙霧測試完成。

較慢的 Bun 全域安裝映像提供者煙霧測試由 `run_bun_global_install_smoke` 個別控管。它會依每夜排程執行；從發布檢查呼叫工作流程時預設啟用，而手動 `Install Smoke` 分派也可選擇啟用。一般 PR CI 仍會針對與 Node 相關的變更執行快速 Bun 啟動器迴歸執行路徑。QR 與安裝程式 Docker 測試會保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用的即時測試映像、將 OpenClaw 封裝一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式／更新／外掛相依套件執行路徑的基本 Node/Git 執行器；
- 將相同 tarball 安裝至 `/app`，供一般功能執行路徑使用的功能映像。

Docker 執行路徑定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，而執行器只會執行選定的計畫。排程器透過 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每條執行路徑選取映像，再使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行各執行路徑。

### 可調整參數

| 變數                               | 預設值 | 用途                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般執行路徑的主要集區槽位數。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 提供者敏感之尾端集區的槽位數。                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 同時執行的即時執行路徑上限，避免提供者進行節流。                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 同時執行的 npm 安裝執行路徑上限。                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時執行的多服務執行路徑上限。                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 各執行路徑開始時間之間的錯開間隔，以避免 Docker 常駐程式發生大量建立請求；設定 `0` 可取消錯開。     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每條執行路徑的備援逾時（120 分鐘）；選定的即時／尾端執行路徑使用更嚴格的上限。           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定   | `1` 會列印排程器計畫，而不執行任何執行路徑。                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定   | 以逗號分隔的精確執行路徑清單；略過清理煙霧測試，讓代理程式能重現單一失敗的執行路徑。 |

比其有效上限更耗資源的執行路徑仍可從空集區啟動，之後會單獨執行，直到釋放容量為止。本機彙總流程會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、輸出作用中執行路徑狀態、保存執行路徑耗時以供最長優先排序，並且預設會在首次失敗後停止排程新的集區執行路徑。

### 可重複使用的即時／E2E 工作流程

可重複使用的即時／E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 所需的套件、映像種類、即時映像、執行路徑與認證資訊涵蓋範圍。接著，`scripts/docker-e2e.mjs` 會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 封裝 OpenClaw、下載目前執行作業的套件成品，或從 `package_artifact_run_id` 下載套件成品，然後驗證 tarball 內容清單。預設的 `no-push-artifact` 路徑會透過 Blacksmith 的 Docker 層快取，建置以套件摘要標記的基本／功能映像，將映像的確切位元組封裝成不可變的工作流程成品，並讓每個取用者驗證及載入該成品。`existing-only` 則要求明確提供 `docker_e2e_bare_image`/`docker_e2e_functional_image` GHCR 參照，且絕不進行建置或推送。這些登錄庫提取作業的每次嘗試逾時上限為 180 秒，因此卡住的串流會快速重試，而不會耗用 CI 關鍵路徑的大部分時間。排程驗證成功後，`openclaw-scheduled-live-checks.yml` 會將不可變的已測試映像資訊清單傳遞給個別的套件寫入發布器；唯讀的發布與預發布呼叫端絕不會經過該寫入器。

### 發布路徑區塊

發布 Docker 涵蓋範圍會使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊工作，讓每個區塊只驗證並載入其需要、以成品為基礎的映像種類（或在明確使用 `existing-only` 重複使用時提取該映像），並透過相同的加權排程器執行多條執行路徑：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

目前的發布 Docker 區塊包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`，以及 `openwebui`。`package-update-openai` 包含即時 Codex 外掛套件執行路徑；它會安裝候選 OpenClaw 套件、從 `codex_plugin_spec` 或同一參照的 tarball 安裝 Codex 外掛並明確核准安裝 Codex 命令列介面、執行 Codex 命令列介面預先檢查與同一工作階段的代理程式互動，然後執行一次零重試、中等思考程度的互動，期間傳送進度、讀取隨機化的工作區輸入、寫入其完全相符的成品，並傳送完成訊息。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍是彙總的外掛／執行階段別名。`install-e2e` 執行路徑別名仍是兩條提供者安裝程式執行路徑的彙總手動重新執行別名。

只要穩定版或完整發布路徑涵蓋範圍要求，OpenWebUI 就會在專用的大型磁碟 Blacksmith 執行器上，以獨立的 `openwebui` 區塊執行，即使可重複使用的工作流程會將支援的工作路由至 GitHub 託管的執行器亦然。將外部映像提取作業分開，可防止大型映像與 `plugins-runtime-services` 中的共用套件及外掛映像競爭；舊版彙總外掛／執行階段區塊仍會包含 OpenWebUI，以支援相容的手動重新執行。內附頻道更新執行路徑遇到暫時性 npm 網路失敗時會重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含執行路徑記錄、耗時、`summary.json`、`failures.json`、階段耗時、排程器計畫 JSON、慢速執行路徑表格，以及各執行路徑的重新執行命令。工作流程的 `docker_lanes` 輸入會針對該次執行所準備的映像執行選定的執行路徑，而不是執行分塊工作；如此可將失敗執行路徑的偵錯範圍限制在單一目標 Docker 工作內。如果選定的執行路徑是即時 Docker 執行路徑，目標工作會在本機建置即時測試映像以供該次重新執行。重新執行輔助工具會驗證失敗成品中選定的確切目標 SHA，而手動分派會重新封裝該參照，因為內部可重複使用工作流程的套件元組不屬於 `workflow_dispatch` 結構描述。只有當準備好的映像輸入以 GHCR 為基礎時，產生的命令才會包含這些映像輸入與 `shared_image_policy=existing-only`；執行器本機成品標記會被省略，讓全新的執行器重新建置它們。除非成品能證明復原的 GHCR 映像參照與明確的目標覆寫相符，否則該覆寫會捨棄這些參照。成品產生的工作流程定義參照也會被省略，因為完整發布的暫存分支會遭刪除；除非操作人員明確覆寫，否則分派會使用儲存庫的預設分支。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker 成品，並列印合併及各執行路徑的目標重新執行命令
pnpm test:docker:timings <summary>   # 慢速執行路徑與階段關鍵路徑摘要
```

排程的即時／E2E 工作流程每天會執行完整的發布路徑 Docker 測試套件，並在成功後針對確切的已測試映像成品叫用明確的發布器。

## 外掛預發布

`Plugin Prerelease` 是成本較高的產品／套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確的操作人員個別分派的工作流程。一般 PR、`main` 推送與獨立的手動 CI 分派都不會啟用該測試套件。它會將內附外掛測試平均分配至八個擴充功能工作執行器；這些擴充功能分片工作一次最多執行兩個外掛設定群組，每個群組使用一個 Vitest 工作執行緒及較大的 Node 堆積空間，避免匯入密集的外掛批次產生額外的 CI 工作。僅限發布的 Docker 預發布路徑（透過 `full_release_validation` 輸入啟用）會以每組四條的方式批次執行目標 Docker 執行路徑，避免為一至三分鐘的工作保留數十個執行器。該工作流程也會從 `@openclaw/plugin-inspector` 上傳一個資訊用途的 `plugin-inspector-advisory` 成品；檢查器發現項目是分流處理的輸入，不會改變具阻擋性的外掛預發布閘門。

## QA Lab

QA Lab 在主要智慧範圍工作流程之外設有專用 CI 執行路徑。代理能力對等性會納入廣泛的 QA 與發布測試工具，而不是獨立的 PR 工作流程。若要讓對等性隨廣泛驗證執行，請搭配使用 `Full Release Validation` 與 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會依 `main` 每夜執行，也可手動分派；它會展開模擬對等性，以及即時 Matrix、Telegram、Discord、WhatsApp 和 Slack 工作。即時工作會使用 `qa-live-shared` 環境；Telegram、Discord、WhatsApp 和 Slack 使用 Convex 租用，而 Matrix 則會佈建可拋棄的本機認證資訊。

發布檢查會使用確定性的模擬提供者與符合模擬資格的模型（`mock-openai/gpt-5.6-luna` 和 `mock-openai/gpt-5.6-luna-alt`），執行 Matrix 與 Telegram 即時傳輸執行路徑，讓頻道合約與即時模型延遲及一般提供者外掛啟動隔離。即時傳輸閘道會停用記憶搜尋，因為 QA 對等性會另外涵蓋記憶行為；提供者連線能力則由個別的即時模型、原生提供者與 Docker 提供者測試套件涵蓋。

排程與發布 Matrix 閘門會使用共用的 QA Lab 測試套件主機與即時配接器，執行發布情境。命令列介面的預設值與手動工作流程輸入仍為 `all`；手動 `all` 分派會展開 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 設定檔，讓 93 個情境的驗證能維持在每個工作的逾時範圍內。聚焦的手動分派會在單一工作中選取 `fast`、`release` 或 `transport`。

`OpenClaw Release Checks` 也會在核准發布前執行發布關鍵的 QA Lab 執行路徑；其 QA 對等性閘門會將候選與基準封裝作為平行執行路徑工作執行，然後將兩者的成品下載至小型報告工作，以進行最終對等性比較。

對於一般 PR，請依循範圍限定的 CI／檢查證據，而不要將對等性視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意設計為範圍有限的第一階段安全掃描器，而非完整的儲存庫掃描。每日、手動、`main` 推送及非草稿 PR 防護執行，會掃描 Actions 工作流程程式碼及風險最高的 JavaScript/TypeScript 介面，並使用篩選至高／嚴重 `security-severity` 的高信賴度安全性查詢。

PR 防護維持輕量：只有在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src` 或擁有程序的內建外掛執行階段路徑下發生變更時才會啟動，並執行與排程工作流程相同的高可信度安全矩陣。Android 與 macOS CodeQL 不納入 PR 預設流程。

### 安全性類別

| 類別                                          | 涵蓋範圍                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、密鑰、沙箱、排程與閘道基準                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | 核心頻道實作合約，以及頻道外掛執行階段、閘道、外掛 SDK、密鑰與稽核接觸點              |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、網頁擷取與外掛 SDK SSRF 政策介面                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助程式、對外傳遞，以及代理程式工具執行閘門                                           |
| `/codeql-security-high/process-exec-boundary`     | 本機殼層、程序啟動輔助程式、擁有子程序的內建外掛執行階段，以及工作流程指令碼黏合邏輯                             |
| `/codeql-security-high/plugin-trust-boundary`     | 外掛安裝、載入器、資訊清單、登錄、套件管理器安裝、來源載入，以及外掛 SDK 套件合約的信任介面 |

### 平台特定安全性分片

- `CodeQL Android Critical Security` — 排程執行的 Android 安全性分片。在工作流程健全性檢查所接受的最小型 Blacksmith Linux 執行器上，手動建置 Android 應用程式以供 CodeQL 使用。以上傳名稱 `/codeql-critical-security/android` 上傳。
- `CodeQL macOS Critical Security` — 每週／手動執行的 macOS 安全性分片。在 Blacksmith macOS 上手動建置 macOS 應用程式以供 CodeQL 使用，從上傳的 SARIF 中濾除相依套件建置結果，並以上傳名稱 `/codeql-critical-security/macos` 上傳。此分片不納入每日預設流程，因為即使沒有發現問題，macOS 建置仍占據絕大部分執行時間。

### 關鍵品質類別

`CodeQL Critical Quality` 是相對應的非安全性分片。它只會在 GitHub 託管的 Linux 執行器上，針對狹窄的高價值介面執行錯誤嚴重性、非安全性的 JavaScript/TypeScript 品質查詢，讓品質掃描不會耗用 Blacksmith 執行器註冊預算。其 PR 防護刻意比排程設定檔更小：非草稿 PR 只會針對其觸及的介面執行相符分片，範圍來自十三個可由 PR 路由的分片——`agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary` 與 `session-diagnostics-boundary`。`ui-control-plane` 與 `web-media-runtime-boundary` 不納入 PR 執行流程。CodeQL 設定與品質工作流程的變更會執行完整的 PR 分片集合（網路執行階段分片會依據自身的 CodeQL 設定檔與擁有網路功能的原始碼路徑觸發）。

手動分派接受：

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用於單獨執行一個品質分片的教學／反覆調整掛鉤。

| 類別                                                | 涵蓋範圍                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、密鑰、沙箱、排程與閘道安全性邊界程式碼                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化與 IO 合約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | 閘道協定結構描述與伺服器方法合約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心頻道與內建頻道外掛實作合約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型／供應商分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助程式，以及對外傳遞合約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段門面、記憶體外掛 SDK 別名、記憶體執行階段啟用黏合邏輯，以及記憶體 doctor 命令                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | 網路政策套件、原始通訊端與代理擷取執行階段、SSH 通道、閘道鎖定、JSONL 通訊端，以及推送傳輸介面                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部機制、工作階段傳遞佇列、對外工作階段繫結／傳遞輔助程式、診斷事件／日誌套件介面，以及工作階段 doctor 命令列介面合約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | 外掛 SDK 傳入回覆分派、回覆承載資料／分塊／執行階段輔助程式、頻道回覆選項、傳遞佇列，以及工作階段／討論串繫結輔助程式             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、供應商驗證與探索、供應商執行階段註冊、供應商預設值／目錄，以及網頁／搜尋／擷取／嵌入登錄    |
| `/codeql-critical-quality/ui-control-plane`             | 控制介面啟動程序、本機持久化、閘道控制流程，以及工作控制平面執行階段合約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取／搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公開介面，以及外掛 SDK 進入點合約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端的外掛 SDK 原始碼與外掛套件合約輔助程式                                                                                      |

品質與安全性維持分離，讓品質發現項目可以獨立排程、衡量、停用或擴充，而不會模糊安全性訊號。只有在狹窄設定檔具備穩定的執行時間與訊號之後，才應以限定範圍或分片的後續工作重新加入 Swift、Python 與內建外掛的 CodeQL 擴充。

## 維護工作流程

### 文件代理程式

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護管線，用於讓現有文件與最近合併的變更保持一致。它沒有單純的排程：`main` 上由非機器人推送且成功完成的 CI 執行可以觸發它，也可以直接透過手動分派執行。若 `main` 已向前推進，或過去一小時內已建立另一個未略過的文件代理程式執行，工作流程執行觸發就會略過。執行時，它會審查從上一個未略過的文件代理程式來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行即可涵蓋自上次文件處理以來累積的所有 main 變更。

### 測試效能代理程式

`Test Performance Agent` 工作流程是一條針對慢速測試的事件驅動 Codex 維護管線。它沒有單純的排程：`main` 上由非機器人推送且成功完成的 CI 執行可以觸發它，但如果該 UTC 日已有另一個工作流程執行觸發已執行或正在執行，就會略過。手動分派會略過這個每日活動閘門。此管線會建立完整測試套件的分組 Vitest 效能報告，僅允許 Codex 進行保留涵蓋率的小型測試效能修正，而非廣泛重構；接著重新執行完整測試套件報告，並拒絕會減少通過基準測試數量的變更。分組報告會記錄 Linux 與 macOS 上各設定的實際經過時間和最大 RSS，因此前後比較會在持續時間差異旁呈現測試記憶體差異。如果基準有失敗的測試，Codex 只能修正明顯的失敗，而且代理程式執行後的完整測試套件報告必須通過，才會提交任何內容。若 `main` 在機器人推送合併前向前推進，此管線會重定基底已驗證的修補程式、重新執行 `pnpm check:changed`，然後重試推送；有衝突的過期修補程式會被略過。它使用 GitHub 託管的 Ubuntu，讓 Codex 動作能維持與文件代理程式相同的移除 sudo 安全措施。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是供維護者在合併後清理重複項目的手動工作流程。它預設為試執行，只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會驗證已合併的 PR 確實已合併，且每個重複項目都有共同引用的議題或重疊的變更區塊。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機變更管線邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求比廣泛的 CI 平台範圍更嚴格：

- 核心正式環境變更會執行核心正式環境與核心測試型別檢查，以及核心 lint／防護；
- 僅核心測試的變更只會執行核心測試型別檢查與核心 lint；
- 擴充套件正式環境變更會執行擴充套件正式環境與擴充套件測試型別檢查，以及擴充套件 lint；
- 僅擴充套件測試的變更會執行擴充套件測試型別檢查與擴充套件 lint；
- 公開外掛 SDK 或外掛合約變更會擴大至擴充套件型別檢查，因為擴充套件相依於這些核心合約（Vitest 擴充套件全面掃描仍屬於明確的測試工作）；
- 僅包含發布中繼資料的版本提升會執行針對性的版本／設定／根相依套件檢查；
- 未知的根目錄／設定變更會採取安全失敗策略，執行所有檢查管線。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更省成本：直接測試編輯會執行其本身；原始碼編輯則優先使用明確對應，接著執行同層級測試與匯入圖相依項目。共用群組聊天室傳遞設定是其中一個明確對應：對群組可見回覆設定、來源回覆傳遞模式或訊息工具系統提示的變更，會透過核心回覆測試以及 Discord 與 Slack 傳遞迴歸測試進行路由，讓共用預設值的變更能在第一次推送 PR 前失敗。只有當變更廣泛影響測試框架，使低成本的對應集合無法作為可靠的替代指標時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

Crabbox 是由儲存庫維護的遠端機器包裝工具，用於維護者的 Linux 驗證。只有在來源受信任且現有相依套件已安裝完成時，代理工作階段才會在本機執行一個或少數幾個聚焦測試與低成本靜態檢查。較大型的測試套件與運算密集工作則使用 Crabbox，包括建置、型別檢查、平行展開的程式碼檢查、Docker、套件流程、E2E、實際環境驗證，以及 CI 一致性驗證。受信任維護者的重型驗證預設使用 `blacksmith-testbox`，而 `.crabbox.yaml` 現在也預設使用它。其設定的工作流程會注入提供者與代理認證資訊，因此不受信任的貢獻者或分支程式碼必須改用無密鑰的分支 CI，或經淨化的直接 AWS Crabbox。經淨化的 AWS 執行會設定 `CRABBOX_ENV_ALLOW=CI`、傳入 `--no-hydrate`，並使用全新的暫時遠端 `HOME`；這可防止儲存庫的 `OPENCLAW_*` 允許清單與既有驗證設定檔接觸不受信任的程式碼。它們會使用專供該不受信任來源、全新預熱的租用環境，絕不使用受信任或先前已注入認證資訊的租用環境。請從乾淨且受信任的 `main` 簽出啟動已安裝且受信任的 Crabbox 二進位檔，並僅使用 `--fresh-pr` 擷取遠端 PR；絕不可在本機執行不受信任簽出的包裝工具或設定。取消設定 `CRABBOX_AWS_INSTANCE_PROFILE`，且除非解析出的 `aws.instanceProfile` 為空，否則應採封閉式失敗。在任何安裝／測試之前，請使用受信任的絕對路徑工具要求 IMDSv2 權杖、證明 IAM 認證資訊端點傳回 404，並將遠端 `git rev-parse HEAD` 與完整且已審查的 PR 頂端 SHA 比對。將租用環境綁定至該 SHA，並在頂端變更時停止及重新預熱。將乾淨 `main` 中受信任的 `scripts/crabbox-untrusted-bootstrap.sh` 與 `--fresh-pr` 一併上傳；它會安裝固定版本的 Node/pnpm、驗證 SHA 與套件管理工具版本固定設定、隔離 `HOME`、安裝相依套件，然後執行要求的測試。
取消設定所有 `CRABBOX_TAILSCALE*` 覆寫、強制使用 `--network public
--tailscale=false`、清除出口節點／LAN 旗標，並在上傳任何指令碼之前，要求 `crabbox inspect` 回報使用公用網路且沒有 Tailscale 狀態。
自有 AWS/Hetzner 容量也仍可作為 Blacksmith 中斷、配額問題或明確要求使用自有容量進行測試時的備援方案。

代理不會為預期的工作預先預熱。請在第一個重型命令準備好時才取得 Testbox，後續重型命令重複使用傳回的 `tbx_...` ID，每次執行都同步目前的簽出，並在交接前停止它。

由 Crabbox 支援的 Blacksmith 執行會預熱、取得、同步、執行、回報並清理一次性 Testbox。當同步機器上的 `git status --short` 顯示至少 200 個受追蹤項目遭刪除時，內建同步健全性檢查會立即失敗，以偵測 `pnpm-lock.yaml` 等根目錄檔案消失的情況。若 PR 刻意包含大量刪除，請為遠端命令設定 `CRABBOX_ALLOW_MASS_DELETIONS=1`。

若本機 Blacksmith 命令列介面呼叫停留在同步階段超過五分鐘，且同步後沒有任何輸出，Crabbox 也會終止該呼叫。設定 `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` 可停用此防護，或針對異常龐大的本機差異使用較大的毫秒值。

第一次執行前，請從儲存庫根目錄檢查包裝工具：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

若 Crabbox 二進位檔過舊且未宣告支援所選提供者，儲存庫包裝工具會拒絕使用；由 Blacksmith 支援的執行則要求 Crabbox 0.22.0 或更新版本，讓包裝工具取得目前的 Testbox 同步、佇列與清理行為。在 Codex 工作樹或連結／稀疏簽出中，請避免使用本機 `pnpm crabbox:run` 指令碼，因為 pnpm 可能會在 Crabbox 啟動前協調相依套件；請改為直接呼叫 Node 包裝工具：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

使用相鄰簽出時，請先重新建置已忽略的本機二進位檔，再進行計時或驗證工作：

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` 中的 `blacksmith:` 區塊已固定組織、工作流程、工作與參照的預設值，因此下方明確旗標為選用。變更檢查關卡：

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

當本機相依套件不可用或目標會平行展開時，在 Testbox 上重新執行聚焦測試：

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

請讀取最終 JSON 摘要。實用欄位為 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 與 `totalMs`。對於委派的 Blacksmith Testbox 執行，Crabbox 包裝工具結束碼與 JSON 摘要即為命令結果。連結的 GitHub Actions 執行負責注入與保活；若 SSH 命令已傳回後 Testbox 才由外部停止，它可能會以 `cancelled` 結束。除非包裝工具的 `exitCode` 非零，或命令輸出顯示測試失敗，否則應將其視為清理／狀態附帶結果。由 Blacksmith 支援的一次性 Crabbox 執行應會自動停止 Testbox；若執行中斷或不確定是否完成清理，請檢查執行中的機器，並僅停止你建立的機器：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在刻意需要於同一台已注入環境的機器上執行多個命令時，才使用重複使用模式：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

請重複使用租用環境，而非過時的來源。省略 `--no-sync`，讓每次執行都上傳目前的簽出；只有在刻意重新執行未變更且已同步的工作樹時才使用它。不受信任的貢獻者／分支程式碼必須在每個命令中使用 `CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate` 與全新的暫時遠端 `HOME`；請在該淨化命令內安裝相依套件後再測試。只能重複使用專供同一個不受信任來源、全新預熱的租用環境；絕不可使用受信任或先前已注入認證資訊的租用環境。絕不可在本機執行不受信任簽出的包裝工具或設定：請從乾淨且受信任的 `main` 啟動已安裝且受信任的 Crabbox 二進位檔，並在每次執行時傳入 `--fresh-pr`。保持 `CRABBOX_AWS_INSTANCE_PROFILE` 未設定、拒絕非空的已解析執行個體設定檔、要求受信任的遠端 IMDS 無角色證明，並在安裝／測試前驗證已審查的頂端 SHA。將租用環境綁定至該 SHA；每次頂端變更後都停止並重新預熱。若沒有遠端 PR，請使用無密鑰的分支 CI。絕不可為不受信任來源選擇 `hydrate-github` 或會注入認證資訊的 Blacksmith 工作流程。

若故障的是 Crabbox 層，但 Blacksmith 本身可正常運作，則直接使用 Blacksmith 僅限於 `list`、`status` 與清理等診斷工作。在將直接 Blacksmith 執行視為維護者驗證之前，請先修復 Crabbox 路徑。

若 `blacksmith testbox list --all` 與 `blacksmith testbox status` 可正常運作，但新的預熱在幾分鐘後仍停留於 `queued`，且沒有 IP 或 Actions 執行 URL，請將其視為 Blacksmith 提供者、佇列、計費或組織限制的壓力。停止你建立且仍在佇列中的 ID、避免啟動更多 Testbox，並在有人檢查 Blacksmith 儀表板、計費與組織限制的同時，將驗證移至下方的自有 Crabbox 容量路徑。

只有在 Blacksmith 停機、受到配額限制、缺少所需環境，或目標明確要求使用自有容量時，才升級至自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

在 AWS 容量吃緊時，除非工作確實需要 48xlarge 等級的 CPU，否則請避免使用 `class=beast`。一個 `beast` 要求會從 192 個 vCPU 起跳，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額限制的方式。儲存庫維護的 `.crabbox.yaml` 預設使用 `class: standard`、隨需市場與 `capacity.hints: true`，讓經代理取得的 AWS 租用環境列印所選區域／市場、配額壓力、Spot 備援，以及高壓力執行個體類別警告。對較重型的廣泛檢查使用 `fast`；只有在 standard/fast 不足時才使用 `large`；`beast` 則僅適用於完整測試套件、所有外掛 Docker 矩陣、明確的發行／阻斷問題驗證或高核心效能分析等例外的 CPU 密集流程。請勿將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般程式碼檢查／型別檢查、小型 E2E 重現，或 Blacksmith 中斷診斷。請使用 `--market on-demand` 進行容量診斷，以免將 Spot 市場波動混入訊號。

`.crabbox.yaml` 負責提供者、同步與 GitHub Actions 注入的預設值。Crabbox 同步絕不會傳輸 `.git`，因此已注入環境的 Actions 簽出會保留其自身的遠端 Git 中繼資料，而不會同步維護者本機的遠端與物件儲存區；儲存庫設定也會額外排除絕不應傳輸的本機執行階段／建置產物，例如 `.artifacts` 與測試報告。`.github/workflows/crabbox-hydrate.yml` 負責簽出、Node/pnpm 設定、`origin/main` 擷取，以及自有雲端 `crabbox run --id <cbx_id>` 命令的非機密環境交接。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [開發頻道](/zh-TW/install/development-channels)
