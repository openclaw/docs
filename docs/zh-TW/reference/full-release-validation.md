---
read_when:
    - 執行或重新執行完整版本驗證
    - 比較穩定版與完整版本驗證設定檔
    - 偵錯發行驗證階段失敗問題
summary: 完整版本驗證階段、子工作流程、發布設定檔、重新執行控制代碼與證據
title: 完整版本發布驗證
x-i18n:
    generated_at: "2026-07-14T14:08:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f4dad526111a514392a6a0108e88ed276461155ac6768444458eb44ad8c0ee35
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發行產品驗證的總括流程。大部分工作
都在子工作流程中進行，因此失敗的執行環境可以重新執行，而無須重新啟動
整個發行流程。

將產品已完成但尚未更新變更日誌的提交凍結為 **Code SHA**，然後執行：

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

`provider` 也接受 `anthropic` 或 `minimax`，以進行跨作業系統的新手引導和
端對端代理程式回合。此輔助工具會從 alpha/beta
套件版本推斷 `beta` 設定檔，否則使用 `stable`。使用
`-f key=value` 傳遞替代的工作流程輸入；僅在執行廣泛的安全公告掃描時使用 `-f release_profile=full`。

此輔助工具會建立暫時的 `release-ci/*` 參照，並將其固定至單一受信任的
`origin/main` 工作流程 SHA；它只會將目標 SHA 作為候選 `ref` 傳遞，
並在驗證後刪除暫時參照。每個已分派的子工作流程都必須
回報同一個工作流程 SHA。傳遞
`-f reuse_evidence=false` 以強制執行全新作業，或傳遞
`--workflow-sha <trusted-main-sha>` 以選取目前 `origin/main` 仍可到達的較舊工作流程提交。
工作流程本身絕不會建立或更新儲存庫參照。

當 Code SHA 通過所有檢查後，只產生並提交 `CHANGELOG.md`。這個新
提交就是 **Release SHA**。針對 Release SHA 執行相同的輔助工具。只有在
GitHub 證明 Release SHA 衍生自 Code SHA，且完整的變更路徑集合恰好為 `CHANGELOG.md` 時，
才會重複使用產品證據；npm
預檢和套件／安裝驗收仍會在 Release SHA 上執行。

`release_profile=stable` 和 `release_profile=full` 一律執行完整的
即時／Docker 長時間壓力測試。傳遞 `run_release_soak=true`，即可使用
`beta` 設定檔納入相同的長時間壓力測試執行區。若驗證資訊清單
缺少此長時間壓力測試和具阻擋性的產品效能證據，穩定版發布將予以拒絕。

套件驗收通常會從解析後的
`ref` 建置候選 tarball，包括使用 `pnpm ci:full-release` 分派的完整 SHA 執行作業。發布
beta 版本後，傳遞 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，即可在
發行檢查、套件驗收、跨作業系統、發行路徑 Docker，以及套件 Telegram 中重複使用
已發布的 npm 套件。僅當套件驗收應刻意驗證不同套件時，才使用 `package_acceptance_package_spec`。
Codex 外掛的即時套件執行區會遵循相同狀態：已發布的
`release_package_spec` 值會衍生 `codex_plugin_spec=npm:@openclaw/codex@<version>`；
SHA／成品執行作業會從選取的參照封裝 `extensions/codex`；而操作人員
可直接設定 `codex_plugin_spec`，以指定 `npm:`、`npm-pack:` 或 `git:` 外掛
來源。此執行區會授予該外掛所需的明確 Codex 命令列介面安裝核准，
然後執行 Codex 命令列介面預檢，以及同一工作階段中的 OpenAI 代理程式回合。

## 頂層階段

對於 `rerun_group=all`，會先執行 `Check for reusable validation evidence` 作業。
它會尋找最新且先前已通過的完整驗證，該驗證須具有相同的發行
設定檔、有效的長時間壓力測試設定和驗證輸入。完全相同目標的重新執行會使用
`exact-target-full-validation-v1`。若某個衍生提交的完整差異恰好為
`CHANGELOG.md`，則會使用 `changelog-only-release-v1`；所有產品執行區都會略過，
而驗證器會獨立重新檢查 GitHub 提交比較、不可變的
父項成品、子執行作業和分派日誌。任何其他目標變更都需要
全新的 Code SHA 驗證。傳遞 `reuse_evidence=false` 以強制執行全新的完整
作業。只有來自 `main`，或工作流程提交仍位於受信任 `main` 譜系上的標準 SHA 固定
`release-ci/*` 參照，才會重複使用證據；
其他工作流程參照會重新執行所選執行區。

同樣對於 `rerun_group=all`，`Verify Docker runtime image assets` 作業會使用
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex` 建置 `runtime-assets` Docker 目標。
它會與其他階段平行執行，並由總括驗證器強制要求；執行區在分派前不再等待
它完成。範圍較窄的 `rerun_group` 會略過此預檢。

| 階段                    | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析                | **作業：** `Resolve target ref`<br />**子工作流程：** 無<br />**驗證：** 解析發行分支、標籤或完整提交 SHA，並記錄所選輸入。<br />**重新執行：** 若此作業失敗，請重新執行總括流程。                                                                                                                                                                                                                                                                                                            |
| Docker 資產預檢         | **作業：** `Verify Docker runtime image assets`<br />**子工作流程：** 無<br />**驗證：** 確認 `runtime-assets` Docker 建置目標在分派任何其他階段前仍能成功。僅針對 `rerun_group=all` 執行。<br />**重新執行：** 使用 `rerun_group=all` 重新執行總括流程。                                                                                                                                                                                                                                         |
| Vitest 和一般 CI        | **作業：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**驗證：** 對目標參照執行手動完整 CI 圖，包括 Linux Node 執行區、隨附外掛分片、外掛和頻道契約分片、Node 22 相容性、`check-*`、`check-additional-*`、已建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS、Control UI 國際化，以及透過總括流程執行的 Android。<br />**重新執行：** `rerun_group=ci`。                                                                                          |
| 外掛預發行              | **作業：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**驗證：** 僅限發行的外掛靜態檢查、代理式外掛涵蓋範圍、完整外掛批次分片、外掛預發行 Docker 執行區，以及用於相容性分流的不具阻擋性 `plugin-inspector-advisory` 成品。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                                                                                                                          |
| 發行檢查                | **作業：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**驗證：** 安裝冒煙測試、跨作業系統套件檢查、套件驗收、QA Lab 一致性、即時 Matrix，以及即時 Telegram。穩定版和完整設定檔也會執行完整的即時／端對端測試套件和 Docker 發行路徑區塊；beta 可使用 `run_release_soak=true` 選擇加入。<br />**重新執行：** `rerun_group=release-checks` 或範圍較窄的發行檢查控制代碼。                                                                |
| 套件 Telegram           | **作業：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**驗證：** 設定 `release_package_spec` 或 `npm_telegram_package_spec` 時，針對已發布套件執行聚焦的 Telegram 端對端測試。完整候選版本驗證則改用標準的套件驗收 Telegram 端對端測試。<br />**重新執行：** 使用 `release_package_spec` 或 `npm_telegram_package_spec` 執行 `rerun_group=npm-telegram`。                                                                                                              |
| 產品效能                | **作業：** `Run product performance evidence`<br />**子工作流程：** `OpenClaw Performance`<br />**驗證：** 對目標 SHA 執行發行設定檔效能測試（`profile=release`、`repeat=3`、`fail_on_regression=true`、`publish_reports=false`）。Kova 輸出會保留在工作流程成品中，且子工作流程必須證明其報告發布器已略過。僅 `rerun_group=all` 或 `rerun_group=performance` 必須執行且具有阻擋性；範圍較窄的重新執行群組不需要。<br />**重新執行：** `rerun_group=performance`。 |
| 總括驗證器              | **作業：** `Verify full validation`<br />**子工作流程：** 無<br />**驗證：** 重新檢查已記錄的子執行作業結果，並附加來自子工作流程的最慢作業表格。<br />**重新執行：** 將失敗的子工作流程重新執行至通過後，只需重新執行此作業。                                                                                                                                                                                                                                                                 |

總括流程一律以僅產生成品模式分派產品效能。
`OpenClaw Performance` 僅允許排程執行作業，或明確設定 `publish_reports=true` 的
手動分派發布報告。僅產生成品防護必須成功完成，
以證明發布器作業維持略過狀態。
全新和重複使用的證據都會記錄
`controls.performanceReportPublication=artifact-only`；驗證器和重複使用
選擇器會拒絕缺少相符標準化效能子工作流程證明的證據。

驗證器會將標準資訊清單上傳為
`full-release-validation-<run-id>-<run-attempt>`。證據工具會先驗證
其成品 ID、摘要、產生者執行作業和嘗試次數，再依該確切
成品 ID 下載。它會限制所下載 ZIP 的大小、依 REST
`sha256:` 摘要驗證其位元組，並以串流方式讀取唯一允許且大小受限的資訊清單項目，而不
解壓縮封存檔。為了相容較舊的發布使用者，暫時保留穩定名稱別名。
驗證器一律優先使用包含嘗試次數的成品；
在過渡期間，只有嘗試 1 次的資訊清單 v2
產生者可使用穩定名稱。對於後續嘗試和資訊清單 v3，穩定名稱會遭拒絕。

對於搭配 `rerun_group=all` 的 `ref=main`、`release/*` 參照，以及 Tideclaw
alpha 參照，具有相同參照和重新執行群組的較新總括執行作業
會取代較舊的執行作業。父項取消時，其監控器會取消它已分派的所有
子工作流程。標籤和固定 SHA 驗證執行作業不會
互相取消。

## 發行檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它只會解析目標
一次，並在套件或 Docker 相關階段需要時，準備共用的 `release-package-under-test` 成品。

| 階段                    | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發布目標           | **作業：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選定的參照、選用的預期 SHA、設定檔、重新執行群組，以及聚焦的即時測試套件篩選器。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                             |
| 套件成品         | **作業：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 封裝或解析一個候選 tarball，並上傳 `release-package-under-test`，供下游面向套件的檢查使用。<br />**重新執行：** 受影響的套件、跨作業系統或即時/E2E 群組。                                                                                                                                                                                                                                                                                             |
| 安裝冒煙測試            | **作業：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含重複使用根 Dockerfile 冒煙測試映像、QR 套件安裝、根層級與閘道 Docker 冒煙測試、安裝程式 Docker 測試，以及 Bun 全域安裝映像提供者冒煙測試。<br />**重新執行：** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                           |
| 跨作業系統                 | **作業：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 在 Linux、Windows 與 macOS 上，針對選定的提供者與模式執行全新安裝和升級通道，使用候選 tarball 加上基準套件。<br />**重新執行：** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                 |
| 儲存庫與即時 E2E        | **作業：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 儲存庫 E2E、即時快取、OpenAI websocket 串流、原生即時提供者與外掛分片，以及由 `release_profile` 選取、以 Docker 支援的即時模型/後端/閘道測試框架。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。                                                                                |
| Docker 發布路徑      | **作業：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 對共用套件成品執行發布路徑 Docker 區塊。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                                                                                                                                                     |
| 套件驗收       | **作業：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線外掛套件固定資料、外掛更新、標準的模擬 OpenAI Telegram 套件 E2E，以及針對相同 tarball 的已發布版本升級存續檢查。阻擋發布的檢查使用預設的最新已發布基準；浸泡測試檢查（`run_release_soak=true`）則擴展至最近 4 個穩定 npm 版本，另加 3 個固定的歷史版本（`2026.4.23`、`2026.5.2`、`2026.4.15`），並針對已回報問題的升級固定資料執行。<br />**重新執行：** `rerun_group=package`。 |
| 成熟度評分卡       | **作業：** `Render maturity scorecard release docs`<br />**支援工作流程：** `maturity-scorecard.yml`<br />**測試：** 依照目標參照轉譯諮詢性成熟度評分卡文件。僅在傳入 `run_maturity_scorecard=true` 時執行。<br />**重新執行：** 使用 `run_maturity_scorecard=true` 執行 `rerun_group=qa`。                                                                                                                                                                                                                                                           |
| QA 同等性                | **作業：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支援工作流程：** 直接作業<br />**測試：** 候選版本與基準版本的代理式同等性套件，接著產生同等性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| QA 執行階段同等性        | **作業：** `Run QA Lab runtime parity lane`<br />**支援工作流程：** 直接作業<br />**測試：** `openclaw`/`codex` 執行階段配對的代理式同等性通道（`pnpm openclaw qa suite --runtime-pair openclaw,codex`），包含標準層級，以及搭配 `run_release_soak=true` 時的浸泡測試層級。諮詢性：個別失敗不會阻擋發布檢查驗證器。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                    |
| QA 執行階段工具涵蓋範圍 | **作業：** `Enforce QA Lab runtime tool coverage`<br />**支援工作流程：** 直接作業<br />**測試：** 使用 QA 執行階段同等性通道的輸出，在標準執行階段同等性層級（`pnpm openclaw qa coverage --tools`）中檢查 `openclaw` 與 `codex` 之間的動態工具差異。阻擋性：此作業無法透過諮詢性設定覆寫。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                        |
| QA 即時 Matrix           | **作業：** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接作業<br />**測試：** 在 `qa-live-shared` 環境中執行快速即時 Matrix QA 設定檔。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                          |
| QA 即時 Telegram         | **作業：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接作業<br />**測試：** 使用 Convex CI 認證資訊租約進行即時 Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                                      |
| 發布驗證器         | **作業：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 選定重新執行群組所需的發布檢查作業。<br />**重新執行：** 在聚焦的子作業通過後重新執行。                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker 發布路徑區塊

當 `live_suite_filter` 為空時，Docker 發布路徑階段會執行下列區塊：

| 區塊                                                           | 涵蓋範圍                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 發布路徑冒煙測試通道。                                                                                      |
| `package-update-openai`                                         | OpenAI 套件安裝/更新行為、Codex 隨需安裝、Codex 外掛即時輪次，以及 Chat Completions 工具呼叫。 |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                                                             |
| `package-update-core`                                           | 與提供者無關的套件與更新行為。                                                                              |
| `plugins-runtime-plugins`                                       | 驗證外掛行為的外掛執行階段通道。                                                                        |
| `plugins-runtime-services`                                      | 由服務支援的即時外掛執行階段通道。                                                                              |
| `plugins-runtime-install-a` 至 `plugins-runtime-install-h` | 拆分為平行發布驗證的外掛安裝/執行階段批次。                                                      |
| `openwebui`                                                     | 依要求在專用大磁碟執行器上隔離執行的 OpenWebUI 相容性冒煙測試。                                    |

只有一個 Docker 通道失敗時，請在可重複使用的即時/E2E 工作流程上使用目標式 `docker_lanes=<lane[,lane]>`。發布成品會包含各通道的重新執行命令，並在可用時提供套件成品與映像重複使用輸入。

## 發布設定檔

`release_profile` 主要控制發布檢查中的即時/提供者涵蓋廣度。
它不會移除一般完整 CI、外掛預發布、安裝冒煙測試、套件驗收或 QA Lab。穩定版與完整設定檔一律執行詳盡的儲存庫/即時 E2E，以及 Docker 發布路徑浸泡測試涵蓋。Beta 設定檔可透過 `run_release_soak=true` 選擇啟用。套件驗收會為每個完整候選版本提供標準的套件 Telegram E2E，因此總括工作流程不會重複執行該即時輪詢器。

| 設定檔  | 預定用途                      | 納入的即時／供應商涵蓋範圍                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最快速的發布關鍵煙霧測試。   | OpenAI／核心即時路徑、OpenAI 的 Docker 即時模型、原生閘道核心、原生 OpenAI 閘道設定檔、原生 OpenAI 外掛，以及 Docker 即時閘道 OpenAI。                                            |
| `stable` | 預設發布核准設定檔。 | `beta`，再加上 Anthropic 煙霧測試、Google、MiniMax、後端、原生即時測試框架、Docker 即時命令列介面後端、Docker ACP 綁定、Docker Codex 測試框架、Docker 子代理程式公告，以及一個 OpenCode Go 煙霧測試分片。 |
| `full`   | 廣泛的諮詢性掃描。             | `stable`，再加上諮詢性供應商、外掛即時分片，以及媒體即時分片。                                                                                                                               |

## 僅完整設定檔新增的項目

這些套件會由 `stable` 略過，並由 `full` 納入：

| 區域                             | 僅完整設定檔的涵蓋範圍                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 即時模型               | OpenCode Go、OpenRouter、xAI、Z.ai，以及 Fireworks。                                                                          |
| Docker 即時閘道              | 諮詢性供應商拆分為 DeepSeek／Fireworks、OpenCode Go／OpenRouter，以及 xAI／Z.ai 分片。                              |
| 原生閘道供應商設定檔 | 完整的 Anthropic Opus 與 Sonnet／Haiku 分片、Fireworks、DeepSeek、完整的 OpenCode Go 模型分片、OpenRouter、xAI，以及 Z.ai。 |
| 原生外掛即時分片        | 外掛 A-K、L-N、O-Z 其他項目、Moonshot，以及 xAI。                                                                             |
| 原生媒體即時分片         | 音訊、Google 音樂、MiniMax 音樂，以及視訊群組 A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則改用更廣泛的
Anthropic 與 OpenCode Go 模型分片。聚焦的重新執行仍可使用
彙總的 `native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` 控制代碼。

## 聚焦重新執行

使用 `rerun_group`，以避免重複執行無關的發布工作：

| 控制代碼              | 範圍                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整發布驗證階段。                                                             |
| `ci`                | 僅手動完整 CI 子工作流程。                                                                      |
| `plugin-prerelease` | 僅外掛預發布子工作流程。                                                                   |
| `release-checks`    | 所有 OpenClaw 發布檢查階段。                                                             |
| `install-smoke`     | 從安裝煙霧測試到發布檢查。                                                           |
| `cross-os`          | 跨作業系統發布檢查。                                                                        |
| `live-e2e`          | 儲存庫／即時端對端測試與 Docker 發布路徑驗證。                                               |
| `package`           | 套件驗收。                                                                             |
| `qa`                | QA 同等性加上 QA 即時執行線。                                                                   |
| `qa-parity`         | 僅 QA 同等性執行線與報告。                                                                |
| `qa-live`           | QA 即時 Matrix／Telegram，以及啟用時受閘門控管的 Discord、WhatsApp 與 Slack 執行線。             |
| `npm-telegram`      | 已發布套件的 Telegram 端對端測試；需要 `release_package_spec` 或 `npm_telegram_package_spec`。 |
| `performance`       | 僅產品效能證據。                                                              |

當某個即時套件失敗時，搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。
有效的篩選器 ID 定義於可重複使用的即時／端對端工作流程中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 控制代碼是其三個供應商分片的彙總重新執行控制代碼，
因此仍會展開執行所有諮詢性 Docker 閘道工作。

當某個跨作業系統執行線失敗時，搭配 `rerun_group=cross-os` 使用
`cross_os_suite_filter`。篩選器接受作業系統 ID、套件 ID，或作業系統／套件配對，
例如 `windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨作業系統
摘要包含封裝升級執行線各階段的計時，而長時間執行的
命令會印出心跳偵測行，讓卡住的更新能在工作
逾時前被發現。

QA 發布檢查失敗會阻擋一般發布驗證。QA 執行階段工具
涵蓋範圍檢查（標準層級中 `openclaw` 與 `codex` 之間的動態工具偏移）
也會阻擋發布檢查驗證器，即使其
底層 QA 執行階段同等性執行線屬於諮詢性。Tideclaw alpha 執行仍可
將非套件安全性的發布檢查執行線視為諮詢性。使用
`release_profile=beta` 時，`Run repo/live E2E validation` 即時供應商套件
屬於諮詢性：第三方模型部署會在發布期間於底層發生變更，因此
beta 會將其失敗呈現為警告，而 stable 與 full 設定檔仍會
將其視為阻擋項目。當
`live_suite_filter` 明確要求受閘門控管的 QA 即時執行線（例如 Discord、
WhatsApp 或 Slack）時，必須啟用對應的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫
變數；否則輸入擷取會失敗，而非無聲地略過該執行線。
需要最新 QA 證據時，請重新執行 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 要保留的證據

保留 `Full Release Validation` 摘要作為發布層級的索引。它會連結
子工作流程執行 ID，並包含最慢工作表格。若發生失敗，請先檢查子
工作流程，再重新執行上方最小的相符控制代碼。

同時記錄 Code SHA 與 Release SHA、重用政策與變更路徑集合、
綠燈的 Code SHA 父執行，以及輕量的 Release SHA 父執行。

實用成品：

- `release-package-under-test`，來自 `OpenClaw Release Checks`
- `.artifacts/docker-tests/` 下的 Docker 發布路徑成品
- 套件驗收 `package-under-test` 與 Docker 驗收成品
- 每個作業系統與套件的跨作業系統發布檢查成品
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
