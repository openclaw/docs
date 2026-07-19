---
read_when:
    - 執行或重新執行完整版本驗證
    - 比較穩定版與完整版本的驗證設定檔
    - 偵錯發布驗證階段失敗
summary: 完整發行驗證階段、子工作流程、發行設定檔、重新執行控制代碼與證據
title: 完整版本驗證
x-i18n:
    generated_at: "2026-07-19T14:02:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ec027e633efb118c7fbad8b2cd2a17408c2ba46e0c0742a180b1019e21731174
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發布產品驗證的統整流程。大多數工作會在子工作流程中進行，因此失敗的執行環境可以重新執行，而不必重新啟動整個發布流程。在凍結 Code SHA 前先執行發布準備；當背景機器人尚未提交 Control UI 語系輸出時，此步驟會更新該輸出，接著強制執行與發布 CI 相同的嚴格零後援檢查。

將產品完整且尚未更新變更日誌的提交凍結為 **Code SHA**，然後執行：

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

`provider` 也接受 `anthropic` 或 `minimax`，以進行跨作業系統的新手設定和端對端代理程式回合。此輔助工具會從 alpha/beta 套件版本推斷 `beta` 設定檔，否則使用 `stable`。使用 `-f key=value` 傳入替代工作流程輸入；僅在進行廣泛的公告掃描時使用 `-f release_profile=full`。

此輔助工具會建立暫時的 `release-ci/*` 參照，並將其固定至單一受信任的 `origin/main` 工作流程 SHA；它只會將目標 SHA 作為候選 `ref` 傳入，並在驗證後刪除暫時參照。每個已分派的子流程都必須回報相同的工作流程 SHA。傳入
`-f reuse_evidence=false` 可強制執行全新的流程，或傳入
`--workflow-sha <trusted-main-sha>`，選取目前 `origin/main` 仍可到達的較舊工作流程提交。工作流程本身絕不會建立或更新儲存庫參照。

當 Code SHA 通過後，只產生並提交 `CHANGELOG.md`。這個新提交即為 **Release SHA**。針對 Release SHA 執行相同的輔助工具。只有當 GitHub 證明 Release SHA 衍生自 Code SHA，且完整的變更路徑集合恰好為 `CHANGELOG.md` 時，才會重複使用產品證據；npm 預檢和套件／安裝驗收仍會在 Release SHA 上執行。

`release_profile=stable` 和 `release_profile=full` 一律執行完整的即時／Docker 長時間測試。傳入 `run_release_soak=true`，即可使用 `beta` 設定檔納入相同的長時間測試執行區。若驗證資訊清單不包含此長時間測試和具阻擋性的產品效能證據，穩定版發布將予以拒絕。

套件驗收通常會從解析出的 `ref` 建置候選 tarball，包括使用 `pnpm ci:full-release` 分派的完整 SHA 執行。在發布 beta 版後，傳入 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，即可在發布檢查、套件驗收、跨作業系統、發布路徑 Docker 和套件 Telegram 流程中重複使用已發布的 npm 套件。只有在套件驗收應刻意驗證不同套件時，才使用 `package_acceptance_package_spec`。Codex 外掛的即時套件執行區會遵循相同狀態：已發布的 `release_package_spec` 值會衍生出 `codex_plugin_spec=npm:@openclaw/codex@<version>`；SHA／成品執行會從所選參照封裝 `extensions/codex`；操作者也可直接為 `npm:`、`npm-pack:` 或 `git:` 外掛來源設定 `codex_plugin_spec`。此執行區會授予該外掛所需的明確 Codex 命令列介面安裝核准，接著執行 Codex 命令列介面預檢和同一工作階段中的 OpenAI 代理程式回合。其最後一個零重試、中等思考程度的回合會在省略 Codex `final` 的情況下傳送可見進度、讀取隨機化的工作區輸入、寫入其完全一致的成品，並傳送明確的完成訊息。這可捕捉 v2026.7.1 中一般進度傳送會終止回合的迴歸問題。

## 頂層階段

針對 `rerun_group=all`，會先執行 `Check for reusable validation evidence` 工作。它會尋找最新且先前已通過的完整驗證，並要求其具有相同的發布設定檔、有效長時間測試設定及驗證輸入。完全相同目標的重新執行會使用 `exact-target-full-validation-v1`。若後代提交的完整差異恰好為 `CHANGELOG.md`，則會使用 `changelog-only-release-v1`；所有產品執行區都會略過，而驗證器會獨立重新檢查 GitHub 提交比較、不可變的父成品、子流程執行和分派記錄。任何其他目標變更都需要全新的 Code SHA 驗證。傳入 `reuse_evidence=false` 可強制執行全新的完整流程。只有從 `main` 或標準且固定至 SHA 的 `release-ci/*` 參照執行時，才會重複使用證據，且其工作流程提交必須仍位於受信任的 `main` 沿襲上；其他工作流程參照會重新執行所選執行區。

全新的套件相關驗證會先準備一個不可變的 tarball 和一個 Docker 映像成品，再分派外掛預發布及 OpenClaw 發布檢查。這兩個子流程會在使用前驗證相同的套件 SHA、成品 ID、服務摘要、生產者執行嘗試次數及 Docker 封存檔摘要。與套件無關的純 Docker 層會使用內容定址的 GHCR 快取；候選版本專屬映像仍是不可變的 GitHub 成品。具有明確已發布套件規格的聚焦執行則保留現有套件路徑。

此外，針對 `rerun_group=all`，`Verify Docker runtime image assets` 工作會使用 `OPENCLAW_EXTENSIONS=diagnostics-otel,codex` 建置 `runtime-assets` Docker 目標。它會與其他階段平行執行，並由統整驗證器強制檢查；各執行區在分派前不再等待它完成。範圍較窄的 `rerun_group` 會略過此預檢。

| 階段                    | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析                | **工作：** `Resolve target ref`<br />**子工作流程：** 無<br />**驗證內容：** 解析發布分支、標籤或完整提交 SHA，並記錄所選輸入。<br />**重新執行：** 若此步驟失敗，請重新執行統整流程。                                                                                                                                                                                                                                                                                                                                               |
| 共用候選版本            | **工作：** `Prepare shared release candidate`<br />**子工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**驗證內容：** 封裝並驗證一個精確 SHA 的套件、建置一個可運作的 Docker 映像，並為兩個套件相關子工作流程記錄不可變的套件及映像成品組。<br />**重新執行：** 重新執行受影響的套件、外掛預發布、跨作業系統或即時／E2E 群組。                                                                                                                         |
| Docker 資產預檢         | **工作：** `Verify Docker runtime image assets`<br />**子工作流程：** 無<br />**驗證內容：** 在分派任何其他階段前，確認 `runtime-assets` Docker 建置目標仍可成功。僅針對 `rerun_group=all` 執行。<br />**重新執行：** 使用 `rerun_group=all` 重新執行統整流程。                                                                                                                                                                                                                         |
| Vitest 和一般 CI        | **工作：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**驗證內容：** 針對目標參照執行手動完整 CI 圖，包括 Linux Node 執行區、隨附外掛分片、外掛和頻道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、已建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS、Control UI i18n，以及透過統整流程執行的 Android。<br />**重新執行：** `rerun_group=ci`。                                                                 |
| 外掛預發布              | **工作：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**驗證內容：** 僅限發布的外掛靜態檢查、代理式外掛涵蓋範圍、完整外掛批次分片、外掛預發布 Docker 執行區，以及用於相容性分類且不具阻擋性的 `plugin-inspector-advisory` 成品。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                                                                                         |
| 發布檢查                | **工作：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**驗證內容：** 安裝冒煙測試、跨作業系統套件檢查、套件驗收、QA Lab 一致性、即時 Matrix 和 Telegram，以及受閘門控管的公告性 Discord、WhatsApp 和 Slack 執行區。穩定版和完整設定檔也會執行完整的即時／E2E 測試套件及 Docker 發布路徑區塊；beta 可透過 `run_release_soak=true` 選擇加入。<br />**重新執行：** `rerun_group=release-checks` 或範圍較窄的發布檢查控制項。 |
| 套件 Telegram           | **工作：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**驗證內容：** 設定 `release_package_spec` 或 `npm_telegram_package_spec` 時，針對已發布套件執行聚焦的 Telegram E2E。完整候選版本驗證則改用標準套件驗收 Telegram E2E。<br />**重新執行：** 使用 `release_package_spec` 或 `npm_telegram_package_spec` 執行 `rerun_group=npm-telegram`。                                                                                                            |
| 產品效能                | **工作：** `Run product performance evidence`<br />**子工作流程：** `OpenClaw Performance`<br />**驗證內容：** 針對目標 SHA 執行發布設定檔效能測試（`profile=release`、`repeat=3`、`fail_on_regression=true`、`publish_reports=false`）。Kova 輸出會保留在工作流程成品中，且子流程必須證明其報告發布器已略過。只有 `rerun_group=all` 或 `rerun_group=performance` 才要求此項並具有阻擋性；範圍較窄的重新執行群組不要求此項。<br />**重新執行：** `rerun_group=performance`。 |
| 統整驗證器              | **工作：** `Verify full validation`<br />**子工作流程：** 無<br />**驗證內容：** 重新檢查已記錄的子流程執行結果，並附加各子工作流程中耗時最長的工作表格。<br />**重新執行：** 將失敗的子流程重新執行至通過後，只重新執行此工作。                                                                                                                                                                                                                                                              |

統整流程一律以僅產生成品模式分派產品效能測試。只有排程執行或明確設定 `publish_reports=true` 的手動分派，`OpenClaw Performance` 才允許發布報告。僅產生成品的防護機制必須成功完成，以證明發布器工作維持略過狀態。全新和重複使用的證據會記錄
`controls.performanceReportPublication=artifact-only`；若證據不包含相符且已正規化的效能子流程證明，驗證器和重複使用選擇器都會予以拒絕。

驗證器會將標準資訊清單上傳為
`full-release-validation-<run-id>-<run-attempt>`。證據工具會先驗證其成品 ID、摘要、生產者執行及嘗試次數，再依該確切成品 ID 下載。它會限制下載的 ZIP 大小、依照 REST `sha256:` 摘要驗證其位元組，並串流處理唯一允許且有大小限制的資訊清單項目，而不解壓縮封存檔。暫時保留穩定名稱的別名，以供較舊的發布使用端使用。驗證器一律優先使用包含嘗試次數的成品；作為過渡措施，只有當生產者為第 1 次嘗試且使用資訊清單 v2 時，才接受穩定名稱。對於後續嘗試及資訊清單 v3，它會拒絕該舊版名稱。

對於含有 `rerun_group=all` 的 `ref=main`、對於 `release/*` refs，以及對於 Tideclaw
alpha refs，較新的傘狀執行會取代具有相同 ref 和重新執行群組的較舊執行。父項取消時，其監控程式會取消任何已分派的子
工作流程。標籤與固定 SHA 驗證執行不會
彼此取消。

## 發行檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它只解析目標
一次，並在可用時驗證傘狀流程的共用套件成品。直接或聚焦分派會在套件或面向 Docker 的階段需要時，準備自己的 `release-package-under-test`
成品。

| 階段                    | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發行目標           | **工作：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 所選 ref、選用的預期 SHA、設定檔、重新執行群組，以及聚焦的即時套件篩選條件。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                             |
| 套件成品         | **工作：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 驗證傘狀流程的不可變套件組合，或為直接／聚焦的發行檢查分派封裝一個候選 tarball，然後將其提供給下游面向套件的檢查。<br />**重新執行：** 受影響的套件、跨作業系統或即時／E2E 群組。                                                                                                                                                                                                                                |
| 安裝煙霧測試            | **工作：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含重複使用根 Dockerfile 煙霧測試映像、QR 套件安裝、根目錄與閘道 Docker 煙霧測試、安裝程式 Docker 測試，以及 Bun 全域安裝映像提供者煙霧測試。<br />**重新執行：** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                           |
| 跨作業系統                 | **工作：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 在 Linux、Windows 與 macOS 上，針對所選提供者與模式執行全新安裝和升級路徑，並使用候選 tarball 加上基準套件。<br />**重新執行：** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                 |
| 儲存庫與即時 E2E        | **工作：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 儲存庫 E2E、即時快取、OpenAI WebSocket 串流、原生即時提供者與外掛分片，以及由 `release_profile` 選取、以 Docker 支援的即時模型／後端／閘道測試框架。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。                                                                                |
| Docker 發行路徑      | **工作：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品執行發行路徑 Docker 區塊。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                                                                                                                                                     |
| 套件驗收       | **工作：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線外掛套件固定資料、外掛更新、標準的模擬 OpenAI Telegram 套件 E2E，以及針對同一個 tarball 的已發布升級存續檢查。阻擋式發行檢查使用預設的最新已發布基準；浸泡檢查（`run_release_soak=true`）會擴展至最近 4 個穩定 npm 發行版，加上 3 個固定的歷史版本（`2026.4.23`、`2026.5.2`、`2026.4.15`），並針對已回報問題的升級固定資料執行。<br />**重新執行：** `rerun_group=package`。 |
| 成熟度計分卡       | **工作：** `Render maturity scorecard release docs`<br />**支援工作流程：** `maturity-scorecard.yml`<br />**測試：** 針對目標 ref 轉譯建議性成熟度計分卡文件。僅在傳入 `run_maturity_scorecard=true` 時執行。<br />**重新執行：** 使用 `run_maturity_scorecard=true` 的 `rerun_group=qa`。                                                                                                                                                                                                                                                           |
| QA 同等性                | **工作：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支援工作流程：** 直接工作<br />**測試：** 候選與基準的代理式同等性套件，接著產生同等性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| QA 執行階段同等性        | **工作：** `Run QA Lab runtime parity lane`<br />**支援工作流程：** 直接工作<br />**測試：** `openclaw`/`codex` 執行階段配對的代理式同等性路徑（`pnpm openclaw qa suite --runtime-pair openclaw,codex`），包含標準層級，並在使用 `run_release_soak=true` 時包含浸泡層級。建議性：個別失敗不會阻擋發行檢查驗證器。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                    |
| QA 執行階段工具涵蓋範圍 | **工作：** `Enforce QA Lab runtime tool coverage`<br />**支援工作流程：** 直接工作<br />**測試：** 在標準執行階段同等性層級（`pnpm openclaw qa coverage --tools`）中，使用 QA 執行階段同等性路徑的輸出，檢查 `openclaw` 與 `codex` 之間的動態工具漂移。阻擋性：此工作無法透過建議性設定覆寫。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                        |
| QA 即時 Matrix           | **工作：** `Run QA Live Matrix profile`<br />**支援工作流程：** `QA-Lab - All Lanes` 可重複使用工作流程<br />**測試：** 在 `qa-live-shared` 環境中，透過共用 Matrix 即時轉接器執行已證明同等的 YAML 情境。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`；使用 `live_suite_filter=qa-live-matrix` 進行聚焦的 Matrix 重新執行。                                                                                                                                                                                                                    |
| QA 即時 Telegram         | **工作：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 受信任的 `OpenClaw Release Telegram QA` 分派<br />**測試：** 使用 Convex CI 認證資訊租約進行即時 Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                 |
| QA 即時 Discord          | **工作：** `Run QA Lab live Discord lane`<br />**支援工作流程：** 直接建議性工作<br />**測試：** 啟用 `OPENCLAW_RELEASE_QA_DISCORD_LIVE_CI_ENABLED` 時，使用 Convex CI 認證資訊租約進行即時 Discord QA。<br />**重新執行：** 使用 `live_suite_filter=qa-live-discord` 的 `rerun_group=qa-live`。                                                                                                                                                                                                                                                                            |
| QA 即時 WhatsApp         | **工作：** `Run QA Lab live WhatsApp lane`<br />**支援工作流程：** 直接建議性工作<br />**測試：** 啟用 `OPENCLAW_RELEASE_QA_WHATSAPP_LIVE_CI_ENABLED` 時，使用 Convex CI 認證資訊租約進行即時 WhatsApp QA。<br />**重新執行：** 使用 `live_suite_filter=qa-live-whatsapp` 的 `rerun_group=qa-live`。                                                                                                                                                                                                                                                                        |
| QA 即時 Slack            | **工作：** `Run QA Lab live Slack lane`<br />**支援工作流程：** 直接建議性工作<br />**測試：** 啟用 `OPENCLAW_RELEASE_QA_SLACK_LIVE_CI_ENABLED` 時，使用 Convex CI 認證資訊租約進行即時 Slack QA。<br />**重新執行：** 使用 `live_suite_filter=qa-live-slack` 的 `rerun_group=qa-live`。                                                                                                                                                                                                                                                                                    |
| 發行驗證器         | **工作：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 所選重新執行群組所需的發行檢查工作。<br />**重新執行：** 聚焦的子工作通過後重新執行。                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker 發行路徑區塊

當 `live_suite_filter` 為空時，Docker 發行路徑階段會執行以下
區塊：

| 區塊                                                           | 涵蓋範圍                                                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 發行路徑冒煙測試執行線。                                                                                                        |
| `package-update-openai`                                         | OpenAI 套件安裝／更新行為、Codex 隨選安裝、Codex 外掛即時進度後續處理，以及 Chat Completions 工具呼叫。 |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                                                                               |
| `package-update-core`                                           | 與供應商無關的套件及更新行為。                                                                                                |
| `plugins-runtime-plugins`                                       | 驗證外掛行為的外掛執行階段執行線。                                                                                          |
| `plugins-runtime-services`                                      | 由服務支援及即時外掛執行階段執行線。                                                                                                |
| `plugins-runtime-install-a` 至 `plugins-runtime-install-h` | 為平行發行驗證而拆分的外掛安裝／執行階段批次。                                                                        |
| `openwebui`                                                     | 如有要求，將 OpenWebUI 相容性冒煙測試隔離至專用的大磁碟執行器上。                                                      |

只有一條 Docker 執行線失敗時，請在可重複使用的即時／E2E 工作流程中使用目標式
`docker_lanes=<lane[,lane]>`。若可用，發行成品會包含各執行線的重新執行
命令，以及套件成品和映像檔重複使用輸入。

## 發行設定檔

`release_profile` 主要控制發行檢查中的即時／供應商涵蓋廣度。
它不會移除一般完整 CI、外掛預發行、安裝冒煙測試、套件
驗收或 QA Lab。穩定版和完整設定檔一律會執行詳盡的儲存庫／即時
E2E 與 Docker 發行路徑浸泡測試涵蓋。Beta 設定檔可透過
`run_release_soak=true` 選擇加入。套件驗收會為每個完整候選版本提供標準套件
Telegram E2E，因此上層流程不會重複該
即時輪詢器。

| 設定檔  | 預期用途                      | 包含的即時／供應商涵蓋範圍                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最快速的發行關鍵冒煙測試。   | OpenAI／核心即時路徑、OpenAI 的 Docker 即時模型、原生閘道核心、原生 OpenAI 閘道設定檔、原生 OpenAI 外掛，以及 Docker 即時閘道 OpenAI。                                            |
| `stable` | 預設發行核准設定檔。 | `beta` 加上 Anthropic 冒煙測試、Google、MiniMax、後端、原生即時測試控管工具、Docker 即時命令列介面後端、Docker ACP 繫結、Docker Codex 控管工具、Docker 子代理公告，以及一個 OpenCode Go 冒煙測試分片。 |
| `full`   | 廣泛的建議性掃描。             | `stable` 加上建議性供應商、外掛即時分片及媒體即時分片。                                                                                                                               |

## 僅完整設定檔新增的項目

下列套件組會被 `stable` 略過，並由 `full` 納入：

| 領域                             | 僅完整設定檔涵蓋範圍                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 即時模型               | OpenCode Go、OpenRouter、xAI、Z.ai 及 Fireworks。                                                                          |
| Docker 即時閘道              | 建議性供應商拆分為 DeepSeek／Fireworks、OpenCode Go／OpenRouter，以及 xAI／Z.ai 分片。                              |
| 原生閘道供應商設定檔 | 完整 Anthropic Opus 與 Sonnet／Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 及 Z.ai。 |
| 原生外掛即時分片        | 外掛 A-K、L-N、O-Z 其他項目、Moonshot 及 xAI。                                                                             |
| 原生媒體即時分片         | 音訊、Google 音樂、MiniMax 音樂，以及影片群組 A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則改用更廣泛的
Anthropic 與 OpenCode Go 模型分片。針對性重新執行仍可使用
彙總 `native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` 控制代碼。

## 針對性重新執行

使用 `rerun_group`，以避免重複執行無關的發行執行盒：

| 控制代碼              | 範圍                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整發行驗證階段。                                                             |
| `ci`                | 僅限手動完整 CI 子工作流程。                                                                      |
| `plugin-prerelease` | 僅限外掛預發行子工作流程。                                                                   |
| `release-checks`    | 所有 OpenClaw 發行檢查階段。                                                             |
| `install-smoke`     | 從安裝冒煙測試至發行檢查。                                                           |
| `cross-os`          | 跨作業系統發行檢查。                                                                        |
| `live-e2e`          | 儲存庫／即時 E2E 與 Docker 發行路徑驗證。                                               |
| `package`           | 套件驗收。                                                                             |
| `qa`                | QA 同等性加上 QA 即時執行線。                                                                   |
| `qa-parity`         | 僅限 QA 同等性執行線與報告。                                                                |
| `qa-live`           | QA 即時 Matrix／Telegram，以及啟用時受控的 Discord、WhatsApp 和 Slack 執行線。             |
| `npm-telegram`      | 已發布套件的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。 |
| `performance`       | 僅限產品效能證據。                                                              |

當一個即時套件組失敗時，請將 `live_suite_filter` 與 `rerun_group=live-e2e` 搭配使用。
有效的篩選器 ID 定義於可重複使用的即時／E2E 工作流程中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker` 及
`live-codex-harness-docker`。

若要針對 QA 傳輸層重新執行，請設定 `rerun_group=qa-live`，並使用
標準選取器 `qa-live-matrix`、`qa-live-telegram`、`qa-live-discord`、
`qa-live-whatsapp` 或 `qa-live-slack`。

`live-gateway-advisory-docker` 控制代碼是其
三個供應商分片的彙總重新執行控制代碼，因此仍會展開至所有建議性 Docker 閘道工作。

當一條跨作業系統執行線失敗時，請將 `cross_os_suite_filter` 與 `rerun_group=cross-os` 搭配使用。
篩選器接受作業系統 ID、套件組 ID 或作業系統／套件組配對，例如
`windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨作業系統
摘要包含套件化升級執行線各階段的計時，而長時間執行的
命令會輸出心跳偵測行，因此可在工作
逾時前看出更新是否卡住。

QA 發行檢查失敗只會在所選的
Matrix、Telegram 與 QA 執行階段工具涵蓋執行線中阻擋一般發行驗證。QA 同等性、執行階段
同等性，以及受控的 Discord、WhatsApp 和 Slack 即時執行線均為建議性，
並會發布狀態成品，而不阻擋發行驗證器。Tideclaw
Alpha 執行仍可將非套件安全性的發行檢查執行線視為建議性。使用
`release_profile=beta` 時，`Run repo/live E2E validation` 即時供應商套件組
為建議性：第三方模型部署會在發行期間發生變化，因此
Beta 會將其失敗顯示為警告，而穩定版與完整設定檔仍會
將其設為阻擋項目。當
`live_suite_filter` 明確要求受控的 QA 即時執行線（例如 Discord、
WhatsApp 或 Slack）時，必須啟用相符的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫
變數；否則輸入擷取會失敗，而不是無聲地略過該執行線。
需要新的 QA 證據時，請重新執行 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 應保留的證據

保留 `Full Release Validation` 摘要作為發行層級索引。它會連結
子工作流程執行 ID，並包含最慢工作表格。若發生失敗，請先檢查子
工作流程，再重新執行上述最小的相符控制代碼。

記錄 Code SHA 與 Release SHA、重複使用原則與變更路徑集合、
綠燈 Code SHA 父執行，以及輕量級 Release SHA 父執行。

實用成品：

- `release-package-under-test`，來自 `OpenClaw Release Checks`
- `.artifacts/docker-tests/` 下的 Docker 發行路徑成品
- 套件驗收 `package-under-test` 與 Docker 驗收成品
- 各作業系統及套件組的跨作業系統發行檢查成品
- QA 同等性、執行階段同等性，以及所選的 Matrix、Telegram、Discord、WhatsApp
  或 Slack 成品

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
