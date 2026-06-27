---
read_when:
    - 執行或重新執行完整發行驗證
    - 比較穩定版與完整發行驗證設定檔
    - 偵錯發行驗證階段失敗
summary: 完整發布驗證階段、子工作流程、發布設定檔、重新執行控制代碼與證據
title: 完整發布驗證
x-i18n:
    generated_at: "2026-06-27T19:59:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發布總控流程。它是預發布證明的單一手動
入口點，但大多數工作會在子工作流程中進行，因此失敗的機器可以重新執行，
不必重啟整個發布。

請從受信任的工作流程 ref 執行，通常是 `main`，並將發布分支、
標籤或完整 commit SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流程會使用受信任的工作流程 ref 作為測試框架，並使用輸入
`ref` 作為待測候選版本。這樣在驗證較舊的發布分支或標籤時，
仍可使用新的驗證邏輯。

`release_profile=stable` 和 `release_profile=full` 一律會執行完整的
即時/Docker 浸泡測試。傳入 `run_release_soak=true` 可在 beta 設定檔中
包含相同的浸泡測試通道。Stable 發布會拒絕缺少此浸泡測試與阻斷性產品效能證據的驗證資訊清單。

套件驗收通常會從解析出的 `ref` 建置候選 tarball，包括透過
`pnpm ci:full-release` 派發的完整 SHA 執行。beta 發布後，傳入
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` 可在發布檢查、套件驗收、
跨作業系統、發布路徑 Docker，以及套件 Telegram 中重用已發布的 npm 套件。
只有在套件驗收應刻意證明不同套件時，才使用 `package_acceptance_package_spec`。
Codex 外掛即時套件通道遵循相同狀態：已發布的 `release_package_spec`
值會推導出 `codex_plugin_spec=npm:@openclaw/codex@<version>`；SHA/成品執行會從選定的 ref
打包 `extensions/codex`；操作員也可以直接設定 `codex_plugin_spec`，用於
`npm:`、`npm-pack:` 或 `git:` 外掛來源。該通道會授予此插件所需的明確 Codex 命令列介面安裝批准，
然後執行 Codex 命令列介面預檢與同一工作階段的 OpenAI agent 回合。

## 頂層階段

| 階段                 | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 目標解析             | **工作：** `Resolve target ref`<br />**子工作流程：** 無<br />**證明：** 解析發布分支、標籤或完整 commit SHA，並記錄選定的輸入。<br />**重新執行：** 如果此項失敗，重新執行總控流程。                                                                                                                                                                                                                                             |
| Vitest 與一般 CI     | **工作：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**證明：** 針對目標 ref 執行手動完整 CI 圖，包括 Linux 節點通道、內建外掛 shards、外掛與通道合約 shards、節點 22 相容性、`check-*`、`check-additional-*`、建置成品 smoke 檢查、文件檢查、Python Skills、Windows、macOS、Control UI i18n，以及透過總控流程執行的 Android。<br />**重新執行：** `rerun_group=ci`。                           |
| 外掛預發布           | **工作：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**證明：** 僅發布使用的外掛靜態檢查、agentic 外掛涵蓋、完整 extension 批次 shards、外掛預發布 Docker 通道，以及供相容性分流使用的非阻斷性 `plugin-inspector-advisory` 成品。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                                                        |
| 發布檢查             | **工作：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**證明：** 安裝 smoke、跨作業系統套件檢查、套件驗收、QA Lab parity、即時 Matrix，以及即時 Telegram。Stable 與 full 設定檔也會執行完整的即時/E2E 套件與 Docker 發布路徑 chunks；beta 可透過 `run_release_soak=true` 選擇加入。<br />**重新執行：** `rerun_group=release-checks` 或更窄的 release-checks handle。 |
| 套件 Telegram        | **工作：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**證明：** 當設定 `release_package_spec` 或 `npm_telegram_package_spec` 時，執行聚焦的已發布套件 Telegram E2E。完整候選版本驗證則使用標準的套件驗收 Telegram E2E。<br />**重新執行：** 使用 `rerun_group=npm-telegram` 並搭配 `release_package_spec` 或 `npm_telegram_package_spec`。                                               |
| 總控驗證器           | **工作：** `Verify full validation`<br />**子工作流程：** 無<br />**證明：** 重新檢查已記錄的子執行結論，並從子工作流程附加最慢工作的表格。<br />**重新執行：** 在重新執行失敗的子流程並轉綠後，只重新執行此工作。                                                                                                                                                                                                  |

對於 `ref=main` 和 `rerun_group=all`，較新的總控流程會取代較舊的流程。
父流程被取消時，其監視器會取消任何已派發的子工作流程。發布分支與標籤驗證執行
預設不會彼此取消。

## 發布檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它會解析一次目標，
並在套件或面向 Docker 的階段需要時，準備共用的 `release-package-under-test` 成品。

| 階段                | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發布目標            | **作業：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選取的 ref、選用的預期 SHA、設定檔、重新執行群組，以及聚焦的即時套件篩選器。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                                                                          |
| 套件成品            | **作業：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 打包或解析一個候選 tarball，並上傳 `release-package-under-test` 供下游套件面向檢查使用。<br />**重新執行：** 受影響的套件、跨作業系統或即時/E2E 群組。                                                                                                                                                                                        |
| 安裝煙霧測試        | **作業：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含重用根 Dockerfile 煙霧測試映像、QR 套件安裝、根與閘道 Docker 煙霧測試、安裝程式 Docker 測試、Bun 全域安裝 image-provider 煙霧測試，以及快速的內建外掛安裝/解除安裝 E2E。<br />**重新執行：** `rerun_group=install-smoke`。                                      |
| 跨作業系統          | **作業：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 針對選取的供應商與模式，在 Linux、Windows 和 macOS 上執行全新安裝與升級通道，使用候選 tarball 加上基準套件。<br />**重新執行：** `rerun_group=cross-os`。                                                                                      |
| 儲存庫與即時 E2E   | **作業：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 儲存庫 E2E、即時快取、OpenAI websocket 串流、原生即時供應商與外掛分片，以及由 `release_profile` 選取、Docker 支援的即時模型/後端/閘道測試工具。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。 |
| Docker 發布路徑     | **作業：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品執行發布路徑 Docker 區塊。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`。                                                |
| 套件驗收            | **作業：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線外掛套件 fixtures、外掛更新、標準 mock-OpenAI Telegram 套件 E2E，以及針對同一個 tarball 的已發布升級存活檢查。阻斷式發布檢查使用預設的最新已發布基準；浸泡檢查會擴展到 `2026.4.23` 當天或之後的每個穩定 npm 發布版本，加上已回報問題的 fixtures。<br />**重新執行：** `rerun_group=package`。 |
| QA 同等性           | **作業：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支援工作流程：** 直接作業<br />**測試：** 候選與基準 agentic 同等性套件，接著產生同等性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                      |
| QA 即時 Matrix      | **作業：** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接作業<br />**測試：** `qa-live-shared` 環境中的快速即時 Matrix QA 設定檔。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                         |
| QA 即時 Telegram    | **作業：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接作業<br />**測試：** 使用 Convex CI 認證租約的即時 Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                               |
| 發布驗證器          | **作業：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 選取的重新執行群組所需的發布檢查作業。<br />**重新執行：** 聚焦的子作業通過後重新執行。                                                                                                                                                                                                  |

## Docker 發布路徑區塊

當 `live_suite_filter` 為空時，Docker 發布路徑階段會執行這些區塊：

| 區塊                                                            | 涵蓋範圍                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 發布路徑煙霧測試通道。                                                                                        |
| `package-update-openai`                                         | OpenAI 套件安裝/更新行為、Codex 隨選安裝、Codex 外掛即時回合，以及 Chat Completions 工具呼叫。                            |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                                                                             |
| `package-update-core`                                           | 供應商中立的套件與更新行為。                                                                                               |
| `plugins-runtime-plugins`                                       | 執行外掛行為的外掛執行階段通道。                                                                                           |
| `plugins-runtime-services`                                      | 服務支援與即時外掛執行階段通道；在要求時包含 OpenWebUI。                                                                    |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 為平行發布驗證拆分的外掛安裝/執行階段批次。                                                                                |

當只有一個 Docker 通道失敗時，請在可重用的即時/E2E 工作流程上使用目標式 `docker_lanes=<lane[,lane]>`。發布成品會在可用時包含每個通道的重新執行命令，以及套件成品和映像重用輸入。

## 發布設定檔

`release_profile` 主要控制發布檢查中的即時/供應商廣度。它不會移除一般完整 CI、外掛預發布、安裝煙霧測試、套件驗收或 QA Lab。穩定與完整設定檔一律執行詳盡的儲存庫/即時 E2E 和 Docker 發布路徑浸泡涵蓋。Beta 設定檔可以透過 `run_release_soak=true` 選擇加入。套件驗收會為每個完整候選提供標準套件 Telegram E2E，因此總控流程不會重複該即時輪詢器。

| 設定檔    | 預期用途                    | 包含的即時/供應商涵蓋範圍                                                                                                                                                     |
| --------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的發布關鍵煙霧測試。    | OpenAI/核心即時路徑、OpenAI 的 Docker 即時模型、原生閘道核心、原生 OpenAI 閘道設定檔、原生 OpenAI 外掛，以及 Docker 即時閘道 OpenAI。                     |
| `stable`  | 預設發布核准設定檔。        | `minimum` 加上 Anthropic 煙霧測試、Google、MiniMax、後端、原生即時測試工具、Docker 即時命令列介面後端、Docker ACP 綁定、Docker Codex 測試工具，以及 OpenCode Go 煙霧測試分片。 |
| `full`    | 廣泛的諮詢式掃描。          | `stable` 加上諮詢式供應商、外掛即時分片，以及媒體即時分片。                                                                                                        |

## 僅完整設定檔新增項目

這些套件會被 `stable` 略過，並包含於 `full`：

| 區域                             | 僅完整設定檔涵蓋範圍                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 即時模型                  | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                          |
| Docker 即時閘道                  | 諮詢式供應商拆分為 DeepSeek/Fireworks、OpenCode Go/OpenRouter，以及 xAI/Z.ai 分片。                                        |
| 原生閘道供應商設定檔             | 完整 Anthropic Opus 與 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI 和 Z.ai。        |
| 原生外掛即時分片                 | 外掛 A-K、L-N、O-Z 其他、Moonshot 和 xAI。                                                                                  |
| 原生媒體即時分片                 | 音訊、Google 音樂、MiniMax 音樂，以及影片群組 A-D。                                                                         |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則改用更廣泛的 Anthropic 和 OpenCode Go 模型分片。聚焦的重新執行仍可使用彙總的 `native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` 控制代碼。

## 聚焦的重新執行

使用 `rerun_group` 以避免重複執行無關的發佈方塊：

| Handle              | 範圍                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整發佈驗證階段。                                                             |
| `ci`                | 僅手動完整 CI 子項。                                                                      |
| `plugin-prerelease` | 僅外掛預發佈子項。                                                                   |
| `release-checks`    | 所有 OpenClaw 發佈檢查階段。                                                             |
| `install-smoke`     | 透過發佈檢查進行安裝冒煙測試。                                                           |
| `cross-os`          | 跨作業系統發佈檢查。                                                                        |
| `live-e2e`          | 儲存庫/即時 E2E 與 Docker 發佈路徑驗證。                                               |
| `package`           | 套件驗收。                                                                             |
| `qa`                | QA 同等性加上 QA 即時通道。                                                                   |
| `qa-parity`         | 僅 QA 同等性通道與報告。                                                                |
| `qa-live`           | QA 即時 Matrix/Telegram，加上啟用時受閘控的 Discord、WhatsApp 與 Slack 通道。             |
| `npm-telegram`      | 已發佈套件的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。 |

當一個即時套件失敗時，搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。
有效的篩選器 id 定義於可重用的即時/E2E 工作流程中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

`live-gateway-advisory-docker` handle 是其三個供應商分片的彙總重新執行 handle，
因此仍會展開到所有 advisory Docker 閘道作業。

當一個跨作業系統通道失敗時，搭配 `rerun_group=cross-os` 使用 `cross_os_suite_filter`。
篩選器接受作業系統 id、套件 id，或作業系統/套件配對，
例如 `windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨作業系統
摘要包含套件化升級通道的各階段計時，而長時間執行的
命令會列印心跳偵測行，讓卡住的 Windows 更新能在
作業逾時前被看見。

QA 發佈檢查失敗會阻擋一般發佈驗證。標準層級中必要的 OpenClaw
動態工具漂移也會阻擋發佈檢查驗證器。
Tideclaw alpha 執行仍可將非套件安全性的發佈檢查通道視為
advisory。當 `live_suite_filter` 明確要求受閘控的 QA 即時通道，
例如 Discord、WhatsApp 或 Slack 時，對應的
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫變數必須啟用；否則
輸入擷取會失敗，而不是默默略過該通道。當你需要新的 QA 證據時，
重新執行 `rerun_group=qa`、`qa-parity` 或 `qa-live`。

## 要保留的證據

將 `Full Release Validation` 摘要保留作為發佈層級索引。它會連結
子執行 id，並包含最慢作業表。若發生失敗，請先檢查子
工作流程，然後重新執行上方最小的相符 handle。

有用的成品：

- 來自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 發佈路徑成品
- 套件驗收的 `package-under-test` 與 Docker 驗收成品
- 各作業系統與套件的跨作業系統發佈檢查成品
- QA 同等性、Matrix 與 Telegram 成品

## 工作流程檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
