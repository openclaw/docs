---
read_when:
    - 執行或重新執行完整版本驗證
    - 比較穩定版與完整版本的驗證設定檔
    - 偵錯發行驗證階段失敗問題
summary: 完整版本驗證階段、子工作流程、發布設定檔、重新執行控制代碼與證據
title: 完整版本發布驗證
x-i18n:
    generated_at: "2026-07-12T14:49:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發布驗證的總入口：用於發布前驗證的單一手動進入點。大部分工作會在子工作流程中進行，因此某個執行環境失敗時，可以重新執行，而不必重新啟動整個發布流程。

請從受信任的工作流程參照執行，通常是 `main`，並將發布分支、標籤或完整提交 SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` 也接受 `anthropic` 或 `minimax`，用於跨作業系統的初始設定及端對端代理程式回合。可重複使用的子作業會從 `job.workflow_repository` 和 `job.workflow_sha` 解析被呼叫的工作流程驗證框架，而輸入的 `ref` 則選取要測試的候選版本。如此一來，驗證較舊的發布分支或標籤時，仍可使用目前受信任的驗證邏輯。

每個已派送的子工作流程都必須回報與父層 `Full Release Validation` 執行相同的工作流程 SHA。如果 `main` 在父層與子層派送之間發生變動，即使子工作流程本身成功，總工作流程仍會以封閉方式失敗。若要針對不可變的精確提交進行驗證，請使用 `pnpm ci:full-release --sha <target-sha>`。此輔助程式會建立暫時的 `release-ci/*` 參照，固定至目前受信任的 `origin/main`，僅將目標 SHA 作為候選 `ref` 傳入，在有可用的嚴格精確目標證據時加以重複使用，並在驗證後刪除該參照。傳入 `-f reuse_evidence=false` 可強制重新執行，或傳入 `--workflow-sha <trusted-main-sha>`，以選取目前仍可從 `origin/main` 到達的較舊工作流程提交。工作流程本身絕不會建立或更新儲存庫參照。

`release_profile=stable` 和 `release_profile=full` 一律會執行完整的即時／Docker 長時間測試。傳入 `run_release_soak=true`，可在 `beta` 設定檔中包含相同的長時間測試執行路徑。若驗證資訊清單未包含此長時間測試及具阻擋性的產品效能證據，穩定版發布將予以拒絕。

Package Acceptance 通常會從解析後的 `ref` 建置候選 tarball，包括以 `pnpm ci:full-release` 派送的完整 SHA 執行。發布 beta 版後，傳入 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，可在發布檢查、Package Acceptance、跨作業系統、發布路徑 Docker，以及套件版 Telegram 之間重複使用已發布的 npm 套件。只有在 Package Acceptance 應刻意驗證不同套件時，才使用 `package_acceptance_package_spec`。Codex 外掛的即時套件執行路徑遵循相同狀態：已發布的 `release_package_spec` 值會衍生出 `codex_plugin_spec=npm:@openclaw/codex@<version>`；SHA／成品執行會從選取的參照封裝 `extensions/codex`；操作人員也可直接為 `npm:`、`npm-pack:` 或 `git:` 外掛來源設定 `codex_plugin_spec`。此執行路徑會授予該外掛所需的明確 Codex 命令列介面安裝核准，接著執行 Codex 命令列介面預檢，以及同一工作階段中的 OpenAI 代理程式回合。

## 頂層階段

對於 `rerun_group=all`，會先執行 `Check for reusable validation evidence` 作業：它會尋找與完全相同的目標 SHA、發布設定檔、有效長時間測試設定及驗證輸入相符，且最近一次成功的完整驗證。找到此類證據時，會略過所有執行路徑，並由總驗證器重新檢查不可變的父層成品、子層執行和派送記錄。這僅適用於相同候選版本的重新執行復原；不允許跨 SHA 重複使用。若候選版本已變更，請重新執行受該差異影響的每個套件、成品、安裝、Docker 或供應商閘門。傳入 `reuse_evidence=false` 可強制重新執行完整流程。只有從 `main` 或工作流程提交仍位於受信任 `main` 譜系上的標準 SHA 固定 `release-ci/*` 參照執行時，才會重複使用證據；其他工作流程參照會重新執行所選執行路徑。

同樣對於 `rerun_group=all`，`Verify Docker runtime image assets` 作業會使用 `OPENCLAW_EXTENSIONS=diagnostics-otel,codex` 建置 `runtime-assets` Docker 目標。它會與其他階段平行執行，並由總驗證器強制檢查；各執行路徑不再於派送前等待它完成。較窄範圍的 `rerun_group` 會略過此預檢。

| 階段                    | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析                | **作業：** `Resolve target ref`<br />**子工作流程：** 無<br />**驗證內容：** 解析發布分支、標籤或完整提交 SHA，並記錄所選輸入。<br />**重新執行：** 若失敗，請重新執行總工作流程。                                                                                                                                                                                                                                                                                                            |
| Docker 資產預檢         | **作業：** `Verify Docker runtime image assets`<br />**子工作流程：** 無<br />**驗證內容：** 在派送任何其他階段前，確認 `runtime-assets` Docker 建置目標仍可成功。僅在 `rerun_group=all` 時執行。<br />**重新執行：** 使用 `rerun_group=all` 重新執行總工作流程。                                                                                                                                                                                                                                         |
| Vitest 與一般 CI        | **作業：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**驗證內容：** 針對目標參照執行手動完整 CI 圖，包括 Linux 節點執行路徑、內附外掛分片、外掛與頻道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、已建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS、Control UI 國際化，以及透過總工作流程執行的 Android。<br />**重新執行：** `rerun_group=ci`。                                                                                          |
| 外掛預發布              | **作業：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**驗證內容：** 僅限發布的外掛靜態檢查、代理式外掛涵蓋範圍、完整外掛批次分片、外掛預發布 Docker 執行路徑，以及供相容性分流使用、不具阻擋性的 `plugin-inspector-advisory` 成品。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                                                                                                                          |
| 發布檢查                | **作業：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**驗證內容：** 安裝冒煙測試、跨作業系統套件檢查、Package Acceptance、QA Lab 一致性、即時 Matrix，以及即時 Telegram。Stable 和 full 設定檔也會執行完整的即時／端對端測試套件與 Docker 發布路徑區塊；beta 可透過 `run_release_soak=true` 選擇加入。<br />**重新執行：** `rerun_group=release-checks` 或範圍更窄的 release-checks 控制代碼。                                                                |
| 套件版 Telegram         | **作業：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**驗證內容：** 設定 `release_package_spec` 或 `npm_telegram_package_spec` 時，執行聚焦於已發布套件的 Telegram 端對端測試。完整候選版本驗證則改用標準 Package Acceptance Telegram 端對端測試。<br />**重新執行：** 使用 `rerun_group=npm-telegram`，並搭配 `release_package_spec` 或 `npm_telegram_package_spec`。                                                                                                              |
| 產品效能                | **作業：** `Run product performance evidence`<br />**子工作流程：** `OpenClaw Performance`<br />**驗證內容：** 針對目標 SHA 執行發布設定檔效能測試（`profile=release`、`repeat=3`、`fail_on_regression=true`、`publish_reports=false`）。Kova 輸出會保留在工作流程成品中，且子工作流程必須證明其報告發布程式已略過。僅對 `rerun_group=all` 或 `rerun_group=performance` 為必要（具阻擋性）；範圍較窄的重新執行群組不需要。<br />**重新執行：** `rerun_group=performance`。 |
| 總驗證器                | **作業：** `Verify full validation`<br />**子工作流程：** 無<br />**驗證內容：** 重新檢查已記錄的子工作流程執行結果，並附加各子工作流程中最慢作業的表格。<br />**重新執行：** 將失敗的子工作流程重新執行至成功後，僅重新執行此作業。                                                                                                                                                                                                                                                                 |

總工作流程一律以僅產生成品的模式派送產品效能測試。`OpenClaw Performance` 僅允許排程執行，或明確設定 `publish_reports=true` 的手動派送發布報告。僅產生成品的防護作業必須成功完成，以證明發布程式作業維持略過狀態。全新及重複使用的證據都會記錄 `controls.performanceReportPublication=artifact-only`；若沒有相符的正規化效能子工作流程證明，驗證器與重複使用選取器會拒絕該證據。

驗證器會將標準資訊清單上傳為 `full-release-validation-<run-id>-<run-attempt>`。證據工具會在下載該確切成品 ID 前，驗證其成品 ID、摘要、產生者執行及嘗試次數。它會限制下載的 ZIP 大小、根據 REST `sha256:` 摘要驗證其位元組，並串流讀取唯一允許且大小受限的資訊清單項目，而不解壓縮封存檔。為了支援較舊的發布使用者，暫時保留固定名稱的別名。驗證器一律優先使用包含嘗試次數的成品；在過渡期間，只有對嘗試次數為 1 的資訊清單 v2 產生者，才接受固定名稱。對於後續嘗試及資訊清單 v3，則會拒絕該舊式名稱。

對於搭配 `rerun_group=all` 的 `ref=main`、`release/*` 參照，以及 Tideclaw alpha 參照，若有相同參照和重新執行群組的較新總工作流程執行，便會取代較舊的執行。父層遭取消時，其監控程式會取消已派送的所有子工作流程。標籤與固定 SHA 驗證執行不會互相取消。

## 發布檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它只會解析目標一次，並在套件或面向 Docker 的階段需要時，準備共用的 `release-package-under-test` 成品。

| 階段                     | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發布目標                 | **作業：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選定的 ref、選用的預期 SHA、設定檔、重新執行群組，以及聚焦的即時測試套件篩選器。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                             |
| 套件成品                 | **作業：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 封裝或解析一個候選 tarball，並上傳 `release-package-under-test`，供下游面向套件的檢查使用。<br />**重新執行：** 受影響的套件、跨作業系統或即時／E2E 群組。                                                                                                                                                                                                                                                                                             |
| 安裝冒煙測試             | **作業：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含重複使用根 Dockerfile 冒煙測試映像、QR 套件安裝、根層級與閘道 Docker 冒煙測試、安裝程式 Docker 測試，以及 Bun 全域安裝映像提供者冒煙測試。<br />**重新執行：** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                           |
| 跨作業系統               | **作業：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 在 Linux、Windows 與 macOS 上，針對選定的提供者與模式執行全新安裝和升級檢查路徑，使用候選 tarball 與基準套件。<br />**重新執行：** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                 |
| 儲存庫與即時 E2E         | **作業：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 儲存庫 E2E、即時快取、OpenAI WebSocket 串流、原生即時提供者與外掛分片，以及由 `release_profile` 選取、以 Docker 為基礎的即時模型／後端／閘道測試框架。<br />**執行條件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。                                                                                |
| Docker 發布路徑          | **作業：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 使用共用套件成品執行發布路徑 Docker 區塊。<br />**執行條件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                                                                                                                                                     |
| 套件驗收                 | **作業：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線外掛套件測試固定資料、外掛更新、標準的模擬 OpenAI Telegram 套件 E2E，以及針對同一個 tarball 的已發布版本升級存續檢查。阻擋發布的檢查使用預設的最新已發布基準；耐久檢查（`run_release_soak=true`）會擴展至最近 4 個穩定 npm 版本，加上 3 個固定的歷史版本（`2026.4.23`、`2026.5.2`、`2026.4.15`），並針對已回報問題的升級測試固定資料執行。<br />**重新執行：** `rerun_group=package`。 |
| 成熟度評分卡             | **作業：** `Render maturity scorecard release docs`<br />**支援工作流程：** `maturity-scorecard.yml`<br />**測試：** 針對目標 ref 轉譯諮詢性成熟度評分卡文件。僅在傳入 `run_maturity_scorecard=true` 時執行。<br />**重新執行：** `rerun_group=qa`，並搭配 `run_maturity_scorecard=true`。                                                                                                                                                                                                                                                           |
| QA 一致性                | **作業：** `Run QA Lab parity lane` 與 `Run QA Lab parity report`<br />**支援工作流程：** 直接作業<br />**測試：** 候選版本與基準版本的代理式一致性套件，接著產生一致性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| QA 執行階段一致性        | **作業：** `Run QA Lab runtime parity lane`<br />**支援工作流程：** 直接作業<br />**測試：** `openclaw`／`codex` 執行階段配對的代理式一致性檢查路徑（`pnpm openclaw qa suite --runtime-pair openclaw,codex`），包含標準層級，以及在 `run_release_soak=true` 時執行的耐久層級。諮詢性質：個別失敗不會阻擋發布檢查驗證器。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                    |
| QA 執行階段工具涵蓋範圍 | **作業：** `Enforce QA Lab runtime tool coverage`<br />**支援工作流程：** 直接作業<br />**測試：** 使用 QA 執行階段一致性檢查路徑的輸出，檢查標準執行階段一致性層級中 `openclaw` 與 `codex` 之間的動態工具差異（`pnpm openclaw qa coverage --tools`）。阻擋性：此作業不可透過諮詢性覆寫略過。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                        |
| QA 即時 Matrix           | **作業：** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接作業<br />**測試：** 在 `qa-live-shared` 環境中執行快速即時 Matrix QA 設定檔。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                          |
| QA 即時 Telegram         | **作業：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接作業<br />**測試：** 使用 Convex CI 認證資訊租約執行即時 Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                                      |
| 發布驗證器               | **作業：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 選定重新執行群組所需的發布檢查作業。<br />**重新執行：** 聚焦的子作業通過後重新執行。                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker 發布路徑區塊

當 `live_suite_filter` 為空時，Docker 發布路徑階段會執行下列區塊：

| 區塊                                                            | 涵蓋範圍                                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 發布路徑冒煙測試路徑。                                                                                          |
| `package-update-openai`                                         | OpenAI 套件安裝／更新行為、Codex 隨需安裝、Codex 外掛即時互動，以及 Chat Completions 工具呼叫。 |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                                                                              |
| `package-update-core`                                           | 與提供者無關的套件與更新行為。                                                                                              |
| `plugins-runtime-plugins`                                       | 驗證外掛行為的外掛執行階段檢查路徑。                                                                                        |
| `plugins-runtime-services`                                      | 由服務支援與即時外掛的執行階段檢查路徑。                                                                                    |
| `plugins-runtime-install-a` 至 `plugins-runtime-install-h`      | 為平行發布驗證而分割的外掛安裝／執行階段批次。                                                                               |
| `openwebui`                                                     | 依要求在專用大容量磁碟執行器上隔離執行的 OpenWebUI 相容性冒煙測試。                                                         |

當只有一個 Docker 檢查路徑失敗時，請在可重複使用的即時／E2E 工作流程中使用針對性的 `docker_lanes=<lane[,lane]>`。若可用，發布成品會包含各檢查路徑的重新執行命令，以及套件成品和映像重複使用輸入。

## 發布設定檔

`release_profile` 主要控制發布檢查中的即時／供應商涵蓋範圍。
它不會移除一般完整 CI、外掛預發布、安裝冒煙測試、套件
驗收或 QA Lab。Stable 與 full 設定檔一律執行完整的儲存庫／即時
E2E，以及 Docker 發布路徑浸泡測試涵蓋。Beta 設定檔可透過
`run_release_soak=true` 選擇啟用。套件驗收會為每個完整候選版本提供標準的套件
Telegram E2E，因此傘狀工作流程不會重複執行該
即時輪詢器。

| 設定檔   | 預期用途                        | 包含的即時／供應商涵蓋範圍                                                                                                                                                                               |
| -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最快速的發布關鍵冒煙測試。      | OpenAI／核心即時路徑、OpenAI 的 Docker 即時模型、原生閘道核心、原生 OpenAI 閘道設定檔、原生 OpenAI 外掛，以及 Docker 即時閘道 OpenAI。                                                                    |
| `stable` | 預設發布核准設定檔。            | `beta` 加上 Anthropic 冒煙測試、Google、MiniMax、後端、原生即時測試工具組、Docker 即時命令列介面後端、Docker ACP 繫結、Docker Codex 工具組、Docker 子代理公告，以及一個 OpenCode Go 冒煙測試分片。 |
| `full`   | 廣泛的建議性掃描。              | `stable` 加上建議性供應商、外掛即時分片，以及媒體即時分片。                                                                                                                                               |

## 僅限 full 的新增項目

以下測試套件會由 `stable` 略過，並由 `full` 納入：

| 領域                             | 僅限 full 的涵蓋範圍                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Docker 即時模型                  | OpenCode Go、OpenRouter、xAI、Z.ai，以及 Fireworks。                                                                     |
| Docker 即時閘道                  | 建議性供應商分為 DeepSeek／Fireworks、OpenCode Go／OpenRouter，以及 xAI／Z.ai 分片。                                     |
| 原生閘道供應商設定檔             | 完整 Anthropic Opus 與 Sonnet／Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI，以及 Z.ai。 |
| 原生外掛即時分片                 | 外掛 A-K、L-N、O-Z 其他項目、Moonshot，以及 xAI。                                                                        |
| 原生媒體即時分片                 | 音訊、Google 音樂、MiniMax 音樂，以及影片群組 A-D。                                                                      |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則改用範圍更廣的
Anthropic 與 OpenCode Go 模型分片。聚焦重新執行仍可使用彙總
`native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` 控制代號。

## 聚焦重新執行

使用 `rerun_group` 以避免重複執行不相關的發布執行環境：

| 控制代號            | 範圍                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整發布驗證階段。                                                                          |
| `ci`                | 僅手動完整 CI 子工作流程。                                                                       |
| `plugin-prerelease` | 僅外掛預發布子工作流程。                                                                         |
| `release-checks`    | 所有 OpenClaw 發布檢查階段。                                                                     |
| `install-smoke`     | 從安裝冒煙測試到發布檢查。                                                                       |
| `cross-os`          | 跨作業系統發布檢查。                                                                             |
| `live-e2e`          | 儲存庫／即時 E2E 與 Docker 發布路徑驗證。                                                       |
| `package`           | 套件驗收。                                                                                       |
| `qa`                | QA 同等性加上 QA 即時執行管線。                                                                  |
| `qa-parity`         | 僅 QA 同等性執行管線與報告。                                                                     |
| `qa-live`           | QA 即時 Matrix／Telegram，加上啟用時受閘控的 Discord、WhatsApp 與 Slack 執行管線。              |
| `npm-telegram`      | 已發布套件的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。          |
| `performance`       | 僅產品效能證據。                                                                                 |

當單一即時測試套件失敗時，請搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。
有效的篩選器 ID 定義於可重複使用的即時／E2E 工作流程中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 控制代號是其三個供應商分片的彙總重新執行控制代號，
因此仍會展開執行所有建議性 Docker 閘道工作。

當單一跨作業系統執行管線失敗時，請搭配 `rerun_group=cross-os` 使用
`cross_os_suite_filter`。此篩選器接受作業系統 ID、測試套件 ID，或作業系統／測試套件組合，例如
`windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨作業系統
摘要包含封裝升級執行管線各階段的時間，而長時間執行的
命令會輸出心跳偵測行，因此能在工作
逾時前看出更新是否卡住。

QA 發布檢查失敗會阻止一般發布驗證。QA 執行階段工具
涵蓋範圍檢查（標準層級中 `openclaw` 與 `codex` 之間的動態工具漂移）
也會阻止發布檢查驗證器，即使底層
QA 執行階段同等性執行管線僅屬建議性。Tideclaw Alpha 執行仍可
將非套件安全性的發布檢查執行管線視為建議性。使用
`release_profile=beta` 時，`Run repo/live E2E validation` 即時供應商測試套件
屬於建議性：第三方模型部署會在發布期間於底層發生變化，因此
Beta 會將其失敗顯示為警告，而 Stable 與 full 設定檔仍會讓
這些失敗具有阻擋效果。當
`live_suite_filter` 明確要求受閘控的 QA 即時執行管線（例如 Discord、
WhatsApp 或 Slack）時，必須啟用對應的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫
變數；否則輸入擷取會失敗，而不會默默略過該執行管線。
需要新的 QA 證據時，請重新執行 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 應保留的證據

保留 `Full Release Validation` 摘要作為發布層級索引。它會連結
子工作流程執行 ID，並包含最慢工作的表格。若發生失敗，請先檢查子
工作流程，再重新執行上方最小且相符的控制代號。

實用成品：

- 來自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 發布路徑成品
- 套件驗收的 `package-under-test` 與 Docker 驗收成品
- 每個作業系統與測試套件的跨作業系統發布檢查成品
- QA 同等性、執行階段同等性、Matrix 與 Telegram 成品

## 工作流程檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
