---
read_when:
    - 執行或重新執行完整版本驗證
    - 比較穩定版與完整發布驗證設定檔
    - 偵錯發布驗證階段失敗問題
summary: 完整發行驗證階段、子工作流程、發行設定檔、重新執行控制代碼與證據
title: 完整發行驗證
x-i18n:
    generated_at: "2026-07-11T21:45:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發布驗證的總入口：用於發布前驗證的單一手動進入點。
大部分工作會在子工作流程中進行，因此某個執行環境失敗後，可以單獨重新執行，而不必重新啟動整個發布流程。

請從受信任的工作流程參照（通常是 `main`）執行，並將發布分支、
標籤或完整提交 SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` 也接受 `anthropic` 或 `minimax`，用於跨作業系統的新手引導和
端對端代理輪次。可重複使用的子作業會從 `job.workflow_repository` 和
`job.workflow_sha` 解析被呼叫的工作流程驗證框架，而輸入的 `ref`
則選取受測候選版本。如此一來，在驗證較舊的發布分支或標籤時，
仍可使用目前受信任的驗證邏輯。

每個已分派的子工作流程，都必須回報與父層 `Full Release Validation`
執行相同的工作流程 SHA。如果 `main` 在父層與子層分派之間發生變動，
即使子工作流程本身成功，總入口仍會以封閉方式失敗。若要取得不可變的精確提交驗證，
請使用 `pnpm ci:full-release --sha <target-sha>`。此輔助工具會建立一個
固定於目前受信任 `origin/main` 的暫時 `release-ci/*` 參照，只將目標
SHA 作為候選 `ref` 傳入，在可用時重複使用嚴格的精確目標證據，
並在驗證後刪除該參照。傳入 `-f reuse_evidence=false` 可強制全新執行，或傳入
`--workflow-sha <trusted-main-sha>`，以選取仍可從目前 `origin/main`
存取的較舊工作流程提交。工作流程本身絕不會建立或更新儲存庫參照。

`release_profile=stable` 和 `release_profile=full` 一律執行完整的
即時／Docker 長時間壓力測試。傳入 `run_release_soak=true`，可讓
`beta` 設定檔也包含相同的長時間壓力測試執行路徑。若驗證資訊清單缺少此壓力測試和
具阻擋性的產品效能證據，穩定版發布將予以拒絕。

套件驗收通常會從解析後的 `ref` 建置候選 tarball，包括透過
`pnpm ci:full-release` 分派的完整 SHA 執行。發布 beta 版後，請傳入
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，以便在發布檢查、
套件驗收、跨作業系統、發布路徑 Docker 和套件 Telegram 驗證中，
重複使用已發布的 npm 套件。只有在套件驗收應刻意驗證不同套件時，
才使用 `package_acceptance_package_spec`。Codex 外掛的即時套件執行路徑
遵循相同狀態：已發布的 `release_package_spec` 值會衍生
`codex_plugin_spec=npm:@openclaw/codex@<version>`；SHA／成品執行會從選定的
參照封裝 `extensions/codex`；操作人員也可直接設定 `codex_plugin_spec`，
以指定 `npm:`、`npm-pack:` 或 `git:` 外掛來源。該執行路徑會授予此
外掛所需的明確 Codex 命令列介面安裝核准，接著執行 Codex 命令列介面預檢，
以及同一工作階段中的 OpenAI 代理輪次。

## 頂層階段

當 `rerun_group=all` 時，會先執行 `Check for reusable validation evidence`
作業：它會尋找最近一次成功、且目標 SHA、發布設定檔、實際壓力測試設定及驗證輸入
完全相同的完整驗證。若有此類證據，所有執行路徑都會略過，總入口驗證器則會
重新檢查不可變的父層成品、子工作流程執行及分派記錄。這僅用於相同候選版本的
重新執行復原；並不允許跨 SHA 重複使用。若候選版本已變更，請重新執行所有受該差異
影響的套件、成品、安裝、Docker 或供應商閘門。傳入 `reuse_evidence=false`
可強制執行全新的完整驗證。只有從 `main`，或工作流程提交仍位於受信任
`main` 譜系上的標準 SHA 固定 `release-ci/*` 參照執行時，才會重複使用證據；
其他工作流程參照會重新執行選定的執行路徑。

同樣在 `rerun_group=all` 時，`Verify Docker runtime image assets` 作業會使用
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex` 建置 `runtime-assets` Docker
目標。它會與其他階段平行執行，並由總入口驗證器強制檢查；其他執行路徑在分派前
不再等待它完成。範圍較窄的 `rerun_group` 會略過此預檢。

| 階段                    | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析                | **作業：** `Resolve target ref`<br />**子工作流程：** 無<br />**驗證內容：** 解析發布分支、標籤或完整提交 SHA，並記錄選定的輸入。<br />**重新執行：** 若此作業失敗，請重新執行總入口。                                                                                                                                                                                                                                                                                                                                          |
| Docker 成品預檢         | **作業：** `Verify Docker runtime image assets`<br />**子工作流程：** 無<br />**驗證內容：** 在分派任何其他階段前，確認 `runtime-assets` Docker 建置目標仍可成功完成。僅在 `rerun_group=all` 時執行。<br />**重新執行：** 使用 `rerun_group=all` 重新執行總入口。                                                                                                                                                                                                                                                                     |
| Vitest 與一般 CI        | **作業：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**驗證內容：** 對目標參照執行手動完整 CI 圖，包括 Linux 節點執行路徑、內建外掛分片、外掛與頻道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、已建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS、Control UI 國際化，以及透過總入口執行的 Android 驗證。<br />**重新執行：** `rerun_group=ci`。                                                                                                                        |
| 外掛預發布              | **作業：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**驗證內容：** 僅限發布的外掛靜態檢查、代理式外掛涵蓋率、完整外掛批次分片、外掛預發布 Docker 執行路徑，以及用於相容性分類、不具阻擋性的 `plugin-inspector-advisory` 成品。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                                                                                                                                                                                  |
| 發布檢查                | **作業：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**驗證內容：** 安裝冒煙測試、跨作業系統套件檢查、套件驗收、QA Lab 一致性、即時 Matrix，以及即時 Telegram。穩定版和完整設定檔也會執行完整的即時／端對端測試套件及 Docker 發布路徑分塊；beta 可透過 `run_release_soak=true` 選擇加入。<br />**重新執行：** `rerun_group=release-checks` 或範圍更窄的發布檢查控制項。                                                                                                          |
| 套件 Telegram           | **作業：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**驗證內容：** 當設定 `release_package_spec` 或 `npm_telegram_package_spec` 時，對已發布套件執行聚焦的 Telegram 端對端測試。完整候選版本驗證則改用標準套件驗收 Telegram 端對端測試。<br />**重新執行：** 使用 `rerun_group=npm-telegram`，並搭配 `release_package_spec` 或 `npm_telegram_package_spec`。                                                                                                                                  |
| 產品效能                | **作業：** `Run product performance evidence`<br />**子工作流程：** `OpenClaw Performance`<br />**驗證內容：** 對目標 SHA 執行發布設定檔效能測試（`profile=release`、`repeat=3`、`fail_on_regression=true`、`publish_reports=false`）。Kova 輸出會保留在工作流程成品中，且子工作流程必須證明其報告發布器已略過。僅在 `rerun_group=all` 或 `rerun_group=performance` 時為必要（具阻擋性）；範圍更窄的重新執行群組不需要。<br />**重新執行：** `rerun_group=performance`。 |
| 總入口驗證器            | **作業：** `Verify full validation`<br />**子工作流程：** 無<br />**驗證內容：** 重新檢查已記錄的子工作流程執行結論，並附加各子工作流程中耗時最長的作業表格。<br />**重新執行：** 將失敗的子工作流程重新執行至成功後，只重新執行此作業。                                                                                                                                                                                                                                                                                           |

總入口一律以僅產生成品模式分派產品效能測試。
`OpenClaw Performance` 只允許排程執行，或明確設定
`publish_reports=true` 的手動分派發布報告。僅產生成品防護必須成功完成，
以證明發布器作業維持略過狀態。全新與重複使用的證據都會記錄
`controls.performanceReportPublication=artifact-only`；若證據缺少相符且
已正規化的效能子工作流程驗證，驗證器和重複使用選取器都會予以拒絕。

驗證器會將標準資訊清單上傳為
`full-release-validation-<run-id>-<run-attempt>`。證據工具在下載該精確
成品 ID 前，會驗證其成品 ID、摘要、產生者執行和嘗試次數。它會限制下載的
ZIP 大小、依照 REST `sha256:` 摘要驗證其位元組，並以串流方式讀取唯一允許且
大小受限的資訊清單項目，而不解壓縮封存檔。為了支援較舊的發布使用者，
暫時保留穩定名稱別名。驗證器一律優先使用包含嘗試次數的成品；在過渡期間，
只有當產生者為第 1 次嘗試且資訊清單版本為 v2 時，才接受穩定名稱。
後續嘗試及資訊清單 v3 都會拒絕該舊名稱。

對於 `ref=main` 且 `rerun_group=all` 的情況、`release/*` 參照，以及 Tideclaw
alpha 參照，具有相同參照與重新執行群組的較新總入口執行，會取代較舊的執行。
父層被取消時，其監控器會取消所有已分派的子工作流程。標籤與固定 SHA
驗證執行不會互相取消。

## 發布檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它只解析目標一次，並在
套件或面向 Docker 的階段需要時，準備共用的 `release-package-under-test`
成品。

| 階段                     | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發布目標                 | **工作：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選定的參照、選用的預期 SHA、設定檔、重新執行群組，以及聚焦的即時測試套件篩選條件。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                             |
| 套件成品                 | **工作：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 封裝或解析一個候選 tarball，並上傳 `release-package-under-test`，供下游面向套件的檢查使用。<br />**重新執行：** 受影響的套件、跨作業系統或即時／端對端群組。                                                                                                                                                                                                                                                                                             |
| 安裝冒煙測試             | **工作：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包括重複使用根目錄 Dockerfile 冒煙測試映像、QR 套件安裝、根目錄與閘道 Docker 冒煙測試、安裝程式 Docker 測試，以及 Bun 全域安裝映像提供者冒煙測試。<br />**重新執行：** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                           |
| 跨作業系統               | **工作：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 使用候選 tarball 與基準套件，針對選定的提供者和模式，在 Linux、Windows 與 macOS 上執行全新安裝及升級管線。<br />**重新執行：** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                 |
| 儲存庫與即時端對端測試   | **工作：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 儲存庫端對端測試、即時快取、OpenAI WebSocket 串流、原生即時提供者與外掛分片，以及由 `release_profile` 選擇、以 Docker 為後端的即時模型／後端／閘道測試框架。<br />**執行條件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。                                                                                |
| Docker 發布路徑          | **工作：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 使用共用套件成品執行發布路徑 Docker 區塊。<br />**執行條件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                                                                                                                                                     |
| 套件驗收                 | **工作：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線外掛套件測試資料、外掛更新、標準模擬 OpenAI Telegram 套件端對端測試，以及使用相同 tarball 執行已發布版本升級後的存續檢查。阻擋發布的檢查預設使用最新已發布基準版本；浸泡測試檢查（`run_release_soak=true`）會擴充至最近 4 個穩定 npm 版本，加上 3 個固定的歷史版本（`2026.4.23`、`2026.5.2`、`2026.4.15`），並針對已回報問題的升級測試資料執行。<br />**重新執行：** `rerun_group=package`。 |
| 成熟度計分卡             | **工作：** `Render maturity scorecard release docs`<br />**支援工作流程：** `maturity-scorecard.yml`<br />**測試：** 針對目標參照產生建議性成熟度計分卡文件。僅在傳入 `run_maturity_scorecard=true` 時執行。<br />**重新執行：** `rerun_group=qa` 搭配 `run_maturity_scorecard=true`。                                                                                                                                                                                                                                                           |
| QA 一致性                | **工作：** `Run QA Lab parity lane` 與 `Run QA Lab parity report`<br />**支援工作流程：** 直接工作<br />**測試：** 候選版本與基準版本的代理式一致性套件，接著產生一致性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| QA 執行階段一致性        | **工作：** `Run QA Lab runtime parity lane`<br />**支援工作流程：** 直接工作<br />**測試：** `openclaw`／`codex` 執行階段配對的代理式一致性管線（`pnpm openclaw qa suite --runtime-pair openclaw,codex`），包括標準層級，以及在 `run_release_soak=true` 時執行的浸泡測試層級。建議性：個別失敗不會阻擋發布檢查驗證器。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                    |
| QA 執行階段工具涵蓋率    | **工作：** `Enforce QA Lab runtime tool coverage`<br />**支援工作流程：** 直接工作<br />**測試：** 使用 QA 執行階段一致性管線的輸出，在標準執行階段一致性層級中檢查 `openclaw` 與 `codex` 之間的動態工具偏差（`pnpm openclaw qa coverage --tools`）。阻擋性：此工作不可透過建議性覆寫來略過。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                        |
| QA 即時 Matrix           | **工作：** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接工作<br />**測試：** 在 `qa-live-shared` 環境中執行快速即時 Matrix QA 設定檔。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                          |
| QA 即時 Telegram         | **工作：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接工作<br />**測試：** 使用 Convex CI 憑證租約執行即時 Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                                      |
| 發布驗證器               | **工作：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 所選重新執行群組所需的發布檢查工作。<br />**重新執行：** 聚焦的子工作通過後重新執行。                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker 發布路徑區塊

當 `live_suite_filter` 為空時，Docker 發布路徑階段會執行下列區塊：

| 區塊                                                            | 涵蓋範圍                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 發布路徑冒煙測試管線。                                                                                      |
| `package-update-openai`                                         | OpenAI 套件安裝／更新行為、Codex 隨需安裝、Codex 外掛即時回合，以及 Chat Completions 工具呼叫。 |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                                                             |
| `package-update-core`                                           | 與提供者無關的套件及更新行為。                                                                              |
| `plugins-runtime-plugins`                                       | 驗證外掛行為的外掛執行階段管線。                                                                        |
| `plugins-runtime-services`                                      | 由服務支援的外掛執行階段管線與即時外掛執行階段管線。                                                                              |
| `plugins-runtime-install-a` 到 `plugins-runtime-install-h`      | 拆分以進行平行發布驗證的外掛安裝／執行階段批次。                                                      |
| `openwebui`                                                     | 在要求時，於專用的大容量磁碟執行器上隔離執行 OpenWebUI 相容性冒煙測試。                                    |

當只有一條 Docker 管線失敗時，請在可重複使用的即時／端對端工作流程中使用定向的 `docker_lanes=<lane[,lane]>`。若可用，發布成品會包含各管線的重新執行命令，以及套件成品和映像重複使用輸入。

## 發布設定檔

`release_profile` 主要控制發布檢查中的即時測試／提供者涵蓋範圍。
它不會移除一般完整 CI、外掛預發布、安裝冒煙測試、套件驗收或 QA Lab。`stable` 與 `full` 設定檔一律執行全面的儲存庫／即時 E2E，以及 Docker 發布路徑耐久測試。`beta` 設定檔可透過 `run_release_soak=true` 選擇加入。套件驗收會為每個完整候選版本提供標準套件 Telegram E2E，因此總括工作流程不會重複執行該即時輪詢器。

| 設定檔   | 預期用途                          | 包含的即時測試／提供者涵蓋範圍                                                                                                                                                                             |
| -------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最快速的發布關鍵冒煙測試。        | OpenAI／核心即時路徑、OpenAI 的 Docker 即時模型、原生閘道核心、原生 OpenAI 閘道設定檔、原生 OpenAI 外掛，以及 Docker 即時閘道 OpenAI。                                                                         |
| `stable` | 預設的發布核准設定檔。            | `beta` 加上 Anthropic 冒煙測試、Google、MiniMax、後端、原生即時測試框架、Docker 即時命令列介面後端、Docker ACP 繫結、Docker Codex 測試框架、Docker 子代理程式公告，以及一個 OpenCode Go 冒煙測試分片。 |
| `full`   | 廣泛的建議性掃描。                | `stable` 加上建議性提供者、外掛即時測試分片，以及媒體即時測試分片。                                                                                                                                            |

## 僅限完整設定檔的額外項目

`stable` 會略過下列測試套件，而 `full` 會納入：

| 領域                             | 僅限完整設定檔的涵蓋範圍                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 即時模型                  | OpenCode Go、OpenRouter、xAI、Z.ai 與 Fireworks。                                                                           |
| Docker 即時閘道                  | 建議性提供者分為 DeepSeek／Fireworks、OpenCode Go／OpenRouter，以及 xAI／Z.ai 分片。                                         |
| 原生閘道提供者設定檔             | 完整 Anthropic Opus 與 Sonnet／Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 與 Z.ai。          |
| 原生外掛即時測試分片             | 外掛 A-K、L-N、O-Z 其他、Moonshot 與 xAI。                                                                                   |
| 原生媒體即時測試分片             | 音訊、Google 音樂、MiniMax 音樂，以及影片群組 A-D。                                                                          |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 與
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則改用涵蓋範圍更廣的
Anthropic 與 OpenCode Go 模型分片。針對性重新執行仍可使用彙總控制代碼
`native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go`。

## 針對性重新執行

使用 `rerun_group` 避免重複執行不相關的發布執行環境：

| 控制代碼            | 範圍                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整發布驗證階段。                                                                          |
| `ci`                | 僅限手動完整 CI 子工作流程。                                                                     |
| `plugin-prerelease` | 僅限外掛預發布子工作流程。                                                                       |
| `release-checks`    | 所有 OpenClaw 發布檢查階段。                                                                     |
| `install-smoke`     | 從安裝冒煙測試到發布檢查。                                                                       |
| `cross-os`          | 跨作業系統發布檢查。                                                                              |
| `live-e2e`          | 儲存庫／即時 E2E 與 Docker 發布路徑驗證。                                                        |
| `package`           | 套件驗收。                                                                                        |
| `qa`                | QA 一致性加上 QA 即時測試通道。                                                                  |
| `qa-parity`         | 僅限 QA 一致性測試通道與報告。                                                                    |
| `qa-live`           | QA 即時 Matrix／Telegram，以及啟用時受條件控管的 Discord、WhatsApp 與 Slack 測試通道。            |
| `npm-telegram`      | 已發布套件的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。           |
| `performance`       | 僅限產品效能證據。                                                                                |

當某個即時測試套件失敗時，搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。
有效的篩選器 ID 定義於可重複使用的即時／E2E 工作流程中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 控制代碼是其三個提供者分片的彙總重新執行控制代碼，因此仍會展開執行所有建議性 Docker 閘道工作。

當某個跨作業系統測試通道失敗時，搭配 `rerun_group=cross-os` 使用
`cross_os_suite_filter`。篩選器接受作業系統 ID、測試套件 ID，或作業系統／測試套件配對，例如
`windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨作業系統摘要包含套件升級測試通道各階段的耗時，而長時間執行的命令會輸出心跳偵測行，以便在工作逾時前看出更新程序已停滯。

QA 發布檢查失敗會阻擋一般發布驗證。QA 執行階段工具涵蓋檢查（標準層級中 `openclaw` 與 `codex` 之間的動態工具偏差）也會阻擋發布檢查驗證器，即使其底層 QA 執行階段一致性測試通道屬於建議性檢查。Tideclaw alpha 執行仍可將非套件安全性的發布檢查測試通道視為建議性檢查。使用 `release_profile=beta` 時，`Run repo/live E2E validation` 即時提供者測試套件屬於建議性檢查：第三方模型部署可能在發布期間發生變更，因此 beta 會將其失敗顯示為警告，而 stable 與 full 設定檔仍會讓這些失敗阻擋發布。當
`live_suite_filter` 明確要求受條件控管的 QA 即時測試通道（例如 Discord、
WhatsApp 或 Slack）時，必須啟用相符的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫變數；否則輸入擷取會失敗，而不是無提示地略過該測試通道。
需要新的 QA 證據時，請重新執行 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 應保留的證據

保留 `Full Release Validation` 摘要作為發布層級的索引。它會連結子工作流程執行 ID，並包含耗時最長的工作表格。若發生失敗，請先檢查子工作流程，然後重新執行上述最小的相符控制代碼。

實用的成品：

- 來自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 發布路徑成品
- 套件驗收的 `package-under-test` 與 Docker 驗收成品
- 各作業系統與測試套件的跨作業系統發布檢查成品
- QA 一致性、執行階段一致性、Matrix 與 Telegram 成品

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
