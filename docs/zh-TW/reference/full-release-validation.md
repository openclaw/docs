---
read_when:
    - 執行或重新執行完整發行驗證
    - 比較穩定版與完整版發行驗證設定檔
    - 偵錯發布驗證階段失敗
summary: Full Release Validation 階段、子工作流程、發布設定檔、重新執行控制代碼與證據
title: 完整版本發布驗證
x-i18n:
    generated_at: "2026-07-05T11:39:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5ece97d1f12e6a097cf9314acd47614f0f80cee704b1b48c0cedfe5e39ff064
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發行驗證總入口：用於發行前證明的單一手動進入點。大多數工作會在子工作流程中進行，因此某個執行環境失敗時，可以重新執行而不必重啟整個發行流程。

請從受信任的工作流程 ref 執行，通常是 `main`，並將發行分支、標籤或完整 commit SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` 也接受 `anthropic` 或 `minimax`，用於跨作業系統 onboarding 與端對端代理程式回合。子工作流程會使用受信任的工作流程 ref 作為測試框架，並使用輸入的 `ref` 作為待測候選版本，因此在驗證較舊的發行分支或標籤時，新的驗證邏輯仍可使用。

`release_profile=stable` 和 `release_profile=full` 一律執行完整的 live/Docker soak。傳入 `run_release_soak=true` 可在 `beta` profile 中包含相同的 soak 驗證線。穩定版發佈會拒絕缺少此 soak 與阻斷性產品效能證據的驗證 manifest。

Package Acceptance 通常會從解析後的 `ref` 建置候選 tarball，包括透過 `pnpm ci:full-release` 分派的完整 SHA 執行。beta 發佈後，傳入 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` 可在發行檢查、Package Acceptance、跨作業系統、發行路徑 Docker，以及套件 Telegram 中重用已發佈的 npm 套件。只有在 Package Acceptance 應刻意證明不同套件時，才使用 `package_acceptance_package_spec`。Codex 外掛 live 套件驗證線遵循相同狀態：已發佈的 `release_package_spec` 值會衍生出 `codex_plugin_spec=npm:@openclaw/codex@<version>`；SHA/artifact 執行會從選定 ref 打包 `extensions/codex`；操作人員也可以直接為 `npm:`、`npm-pack:` 或 `git:` 外掛來源設定 `codex_plugin_spec`。該驗證線會授予此外掛所需的明確 Codex 命令列介面安裝核准，然後執行 Codex 命令列介面 preflight 與同一工作階段的 OpenAI 代理程式回合。

## 頂層階段

對於 `rerun_group=all`，`Verify Docker runtime image assets` job 會作為所有其他階段的閘門：它會在其他任何項目分派之前，先以 `OPENCLAW_EXTENSIONS=diagnostics-otel,codex` 建置 `runtime-assets` Docker target。較窄的 `rerun_group` 會略過此 preflight。

| 階段                    | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 目標解析                | **Job：** `Resolve target ref`<br />**子工作流程：** 無<br />**證明：** 解析發行分支、標籤或完整 commit SHA，並記錄選定輸入。<br />**重新執行：** 若此項失敗，重新執行總入口。                                                                                                                                                                                                                 |
| Docker 資產 preflight   | **Job：** `Verify Docker runtime image assets`<br />**子工作流程：** 無<br />**證明：** 在任何其他階段分派之前，`runtime-assets` Docker 建置 target 仍會成功。僅在 `rerun_group=all` 時執行。<br />**重新執行：** 以 `rerun_group=all` 重新執行總入口。                                                                                                                                             |
| Vitest 與一般 CI        | **Job：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**證明：** 針對目標 ref 的手動完整 CI 圖，包括 Linux 節點驗證線、內建外掛分片、外掛與 channel contract 分片、節點 22 相容性、`check-*`、`check-additional-*`、建置 artifact smoke 檢查、文件檢查、Python skills、Windows、macOS、Control UI i18n，以及透過總入口執行的 Android。<br />**重新執行：** `rerun_group=ci`。 |
| 外掛 prerelease         | **Job：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**證明：** 僅限發行的外掛靜態檢查、agentic 外掛覆蓋率、完整外掛批次分片、外掛 prerelease Docker 驗證線，以及供相容性 triage 使用的非阻斷性 `plugin-inspector-advisory` artifact。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                       |
| 發行檢查                | **Job：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**證明：** 安裝 smoke、跨作業系統套件檢查、Package Acceptance、QA Lab parity、live Matrix，以及 live Telegram。穩定版與完整 profile 也會執行完整的 live/E2E 套件與 Docker 發行路徑區塊；beta 可透過 `run_release_soak=true` 選擇加入。<br />**重新執行：** `rerun_group=release-checks` 或較窄的 release-checks handle。 |
| 套件 Telegram           | **Job：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**證明：** 當設定 `release_package_spec` 或 `npm_telegram_package_spec` 時，針對已發佈套件執行聚焦的 Telegram E2E。完整候選驗證會改用標準 Package Acceptance Telegram E2E。<br />**重新執行：** 使用 `release_package_spec` 或 `npm_telegram_package_spec` 的 `rerun_group=npm-telegram`。         |
| 產品效能                | **Job：** `Run product performance evidence`<br />**子工作流程：** `OpenClaw Performance`<br />**證明：** 針對目標 SHA 的 release-profile 效能執行（`profile=release`、`repeat=3`、`fail_on_regression=true`）。僅對 `rerun_group=all` 或 `rerun_group=performance` 必要且具阻斷性；較窄的重新執行群組不需要。<br />**重新執行：** `rerun_group=performance`。                         |
| 總入口驗證器            | **Job：** `Verify full validation`<br />**子工作流程：** 無<br />**證明：** 重新檢查已記錄的子執行結論，並附加來自子工作流程的最慢 job 表格。<br />**重新執行：** 在將失敗的子項目重新執行至綠燈後，只重新執行此 job。                                                                                                                                                                           |

對於 `ref=main` 且 `rerun_group=all`，較新的總入口會取代較舊的總入口。當父項被取消時，其監控器會取消任何已分派的子工作流程。發行分支與標籤驗證執行預設不會互相取消。

## 發行檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它會解析目標一次，並在套件或 Docker 相關階段需要時，準備共享的 `release-package-under-test` artifact。

| 階段                     | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發行目標                 | **作業：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選取的參照、選用的預期 SHA、設定檔、重新執行群組，以及聚焦的即時套件篩選器。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                             |
| 套件成品                 | **作業：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 封裝或解析一個候選 tarball，並上傳 `release-package-under-test` 供下游面向套件的檢查使用。<br />**重新執行：** 受影響的套件、跨作業系統或即時/E2E 群組。                                                                                                                                                                                                                                                                                             |
| 安裝冒煙測試             | **作業：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含重用根 Dockerfile 冒煙測試映像、QR 套件安裝、根與閘道 Docker 冒煙測試、安裝程式 Docker 測試，以及 Bun 全域安裝映像提供者冒煙測試。<br />**重新執行：** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                           |
| 跨作業系統               | **作業：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 針對選取的提供者與模式，在 Linux、Windows 和 macOS 上執行全新與升級路徑，使用候選 tarball 加上一個基準套件。<br />**重新執行：** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                 |
| 儲存庫與即時 E2E         | **作業：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 儲存庫 E2E、即時快取、OpenAI websocket 串流、原生即時提供者與外掛分片，以及由 `release_profile` 選取、以 Docker 支援的即時模型/後端/閘道測試工具。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。                                                                                |
| Docker 發行路徑          | **作業：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品執行發行路徑 Docker 區塊。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                                                                                                                                                     |
| 套件驗收                 | **作業：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線外掛套件 fixtures、外掛更新、標準 mock-OpenAI Telegram 套件 E2E，以及針對同一個 tarball 的已發布升級存活檢查。阻斷式發行檢查會使用預設的最新已發布基準；浸泡檢查 (`run_release_soak=true`) 會擴展到最近 4 個穩定 npm 發行版，加上 3 個釘選的歷史版本 (`2026.4.23`、`2026.5.2`、`2026.4.15`)，並針對已回報問題的升級 fixtures 執行。<br />**重新執行：** `rerun_group=package`。 |
| 成熟度評分卡             | **作業：** `Render maturity scorecard release docs`<br />**支援工作流程：** `maturity-scorecard.yml`<br />**測試：** 針對目標參照轉譯諮詢性成熟度評分卡文件。只有在傳入 `run_maturity_scorecard=true` 時才會執行。<br />**重新執行：** `rerun_group=qa` 搭配 `run_maturity_scorecard=true`。                                                                                                                                                                                                                                                           |
| QA 對等性                | **作業：** `Run QA Lab parity lane` 與 `Run QA Lab parity report`<br />**支援工作流程：** 直接作業<br />**測試：** 候選與基準代理式對等性套件，接著產生對等性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| QA 執行階段對等性        | **作業：** `Run QA Lab runtime parity lane`<br />**支援工作流程：** 直接作業<br />**測試：** `openclaw`/`codex` 執行階段配對代理式對等性路徑 (`pnpm openclaw qa suite --runtime-pair openclaw,codex`)，包含標準層級，並在 `run_release_soak=true` 時包含浸泡層級。諮詢性：個別失敗不會阻斷發行檢查驗證器。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                    |
| QA 執行階段工具涵蓋率    | **作業：** `Enforce QA Lab runtime tool coverage`<br />**支援工作流程：** 直接作業<br />**測試：** 使用 QA 執行階段對等性路徑的輸出，在標準執行階段對等性層級 (`pnpm openclaw qa coverage --tools`) 中檢查 `openclaw` 與 `codex` 之間的動態工具漂移。阻斷式：此作業不可由諮詢性覆寫。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                        |
| QA 即時 Matrix           | **作業：** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接作業<br />**測試：** `qa-live-shared` 環境中的快速即時 Matrix QA 設定檔。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                          |
| QA 即時 Telegram         | **作業：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接作業<br />**測試：** 使用 Convex CI 憑證租約的即時 Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                                      |
| 發行驗證器               | **作業：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 所選重新執行群組所需的發行檢查作業。<br />**重新執行：** 在聚焦的子作業通過後重新執行。                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker 發行路徑區塊

當 `live_suite_filter` 為空時，Docker 發行路徑階段會執行這些區塊：

| 區塊                                                            | 涵蓋範圍                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 發行路徑冒煙測試路徑。                                                                                      |
| `package-update-openai`                                         | OpenAI 套件安裝/更新行為、Codex 隨選安裝、Codex 外掛即時回合，以及 Chat Completions 工具呼叫。 |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                                                             |
| `package-update-core`                                           | 提供者中立的套件與更新行為。                                                                              |
| `plugins-runtime-plugins`                                       | 執行外掛行為的外掛執行階段路徑。                                                                        |
| `plugins-runtime-services`                                      | 由服務支援與即時外掛執行階段路徑；在要求時包含 OpenWebUI。                                           |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 為平行發行驗證拆分的外掛安裝/執行階段批次。                                                      |

當只有一個 Docker 路徑失敗時，請在可重用的即時/E2E 工作流程上使用目標式
`docker_lanes=<lane[,lane]>`。發行成品會在可用時包含每個路徑的重新執行
命令，並附帶套件成品與映像重用輸入。

## 發行設定檔

`release_profile` 主要控制發佈檢查內的實機/提供者涵蓋廣度。
它不會移除一般完整 CI、外掛預發佈、安裝煙霧測試、套件
驗收或 QA 實驗室。Stable 和 full 設定檔一律執行完整的儲存庫/實機
E2E，以及 Docker 發佈路徑浸泡涵蓋。beta 設定檔可透過
`run_release_soak=true` 選擇加入。套件驗收會為每個完整候選版本提供標準套件
Telegram E2E，因此 umbrella 不會重複該實機輪詢器。

| 設定檔   | 預期用途                          | 包含的實機/提供者涵蓋範圍                                                                                                                                                                                 |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最快的發佈關鍵煙霧測試。          | OpenAI/核心實機路徑、OpenAI 的 Docker 實機模型、原生閘道核心、原生 OpenAI 閘道設定檔、原生 OpenAI 外掛，以及 Docker 實機閘道 OpenAI。                                                                    |
| `stable` | 預設發佈核准設定檔。              | `beta` 加上 Anthropic 煙霧測試、Google、MiniMax、後端、原生實機測試框架、Docker 實機命令列介面後端、Docker ACP 綁定、Docker Codex 框架、Docker subagent-announce，以及一個 OpenCode Go 煙霧測試分片。 |
| `full`   | 廣泛諮詢掃描。                    | `stable` 加上諮詢提供者、外掛實機分片，以及媒體實機分片。                                                                                                                                                 |

## 僅 full 包含的新增項目

這些套件會由 `stable` 略過，並包含在 `full` 中：

| 區域                             | 僅 full 涵蓋範圍                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 實機模型                  | OpenCode Go、OpenRouter、xAI、Z.ai，以及 Fireworks。                                                                        |
| Docker 實機閘道                  | 諮詢提供者分成 DeepSeek/Fireworks、OpenCode Go/OpenRouter，以及 xAI/Z.ai 分片。                                             |
| 原生閘道提供者設定檔             | 完整 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI，以及 Z.ai。     |
| 原生外掛實機分片                 | 外掛 A-K、L-N、O-Z 其他、Moonshot，以及 xAI。                                                                               |
| 原生媒體實機分片                 | Audio、Google 音樂、MiniMax 音樂，以及影片群組 A-D。                                                                        |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則改用更廣泛的
Anthropic 和 OpenCode Go 模型分片。聚焦重新執行仍可使用彙總
`native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` 控制代碼。

## 聚焦重新執行

使用 `rerun_group` 以避免重複執行無關的發佈盒：

| 控制代碼            | 範圍                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整發佈驗證階段。                                                                          |
| `ci`                | 僅手動完整 CI 子項。                                                                            |
| `plugin-prerelease` | 僅外掛預發佈子項。                                                                              |
| `release-checks`    | 所有 OpenClaw 發佈檢查階段。                                                                    |
| `install-smoke`     | 透過發佈檢查的安裝煙霧測試。                                                                    |
| `cross-os`          | 跨 OS 發佈檢查。                                                                                |
| `live-e2e`          | 儲存庫/實機 E2E 和 Docker 發佈路徑驗證。                                                        |
| `package`           | 套件驗收。                                                                                      |
| `qa`                | QA 對等性加上 QA 實機路徑。                                                                     |
| `qa-parity`         | 僅 QA 對等性路徑和報告。                                                                        |
| `qa-live`           | 啟用時包含 QA 實機 Matrix/Telegram，加上受門控的 Discord、WhatsApp 和 Slack 路徑。              |
| `npm-telegram`      | 已發佈套件 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。           |
| `performance`       | 僅產品效能證據。                                                                                |

當某個實機套件失敗時，搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。
有效的篩選器 ID 定義於可重用的實機/E2E 工作流程中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 控制代碼是其三個提供者分片的彙總重新執行控制代碼，
因此它仍會展開到所有諮詢 Docker 閘道作業。

當某個跨 OS 路徑失敗時，搭配 `rerun_group=cross-os` 使用
`cross_os_suite_filter`。此篩選器接受 OS ID、套件 ID，或 OS/套件配對，
例如 `windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨 OS
摘要包含已封裝升級路徑的各階段計時，且長時間執行的命令會列印心跳偵測行，
讓卡住的更新能在作業逾時前可見。

QA 發佈檢查失敗會阻擋一般發佈驗證。QA 執行階段工具涵蓋檢查
（標準層中 `openclaw` 與 `codex` 之間的動態工具漂移）也會阻擋發佈檢查驗證器，
即使底層 QA 執行階段對等性路徑屬於諮詢性質。Tideclaw alpha 執行仍可將非套件安全
發佈檢查路徑視為諮詢。當 `live_suite_filter` 明確請求受門控的 QA 實機路徑，
例如 Discord、WhatsApp 或 Slack，對應的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
儲存庫變數必須啟用；否則輸入擷取會失敗，而不是靜默略過該路徑。
需要新的 QA 證據時，重新執行 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 要保留的證據

保留 `Full Release Validation` 摘要作為發佈層級索引。它連結子執行 ID，
並包含最慢作業表。若發生失敗，先檢查子工作流程，然後重新執行上方最小的相符控制代碼。

實用成品：

- `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 底下的 Docker 發佈路徑成品
- 套件驗收的 `package-under-test` 和 Docker 驗收成品
- 各 OS 和套件的跨 OS 發佈檢查成品
- QA 對等性、執行階段對等性、Matrix，以及 Telegram 成品

## 工作流程檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
