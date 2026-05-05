---
read_when:
    - 執行或重新執行完整發行驗證
    - 比較穩定版與完整發行驗證設定檔
    - 偵錯發布驗證階段失敗
summary: 完整發行驗證的階段、子工作流程、發行設定檔、重新執行控制代碼與證據
title: 完整發布驗證
x-i18n:
    generated_at: "2026-05-05T01:49:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發布總工作流程。它是預發布驗證的單一手動進入點，但大多數工作會在子工作流程中進行，讓失敗的執行環境可以重新執行，而不必重新啟動整個發布流程。

從受信任的工作流程 ref 執行，通常是 `main`，並將發布分支、標籤或完整 commit SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流程會使用受信任的工作流程 ref 作為測試框架，並使用輸入的 `ref` 作為受測候選版本。這讓驗證較舊的發布分支或標籤時，仍可使用新的驗證邏輯。

預設情況下，`release_profile=stable` 會執行會阻擋發布的執行線，並略過完整的即時/Docker 長時間浸泡測試。傳入 `run_release_soak=true` 可在 stable 執行中包含浸泡測試執行線。`release_profile=full` 一律啟用浸泡測試執行線，讓廣泛的建議設定檔不會無聲地降低覆蓋率。

套件驗收通常會從解析後的 `ref` 建置候選 tarball，包括透過 `pnpm ci:full-release` 分派的完整 SHA 執行。發布後，傳入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或 `openclaw@beta`/`openclaw@latest`），即可改為針對已發布的 npm 套件執行相同的套件/更新矩陣。

## 頂層階段

| 階段                 | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析             | **作業：** `Resolve target ref`<br />**子工作流程：** 無<br />**證明：** 解析發布分支、標籤或完整 commit SHA，並記錄選取的輸入。<br />**重新執行：** 如果此項失敗，重新執行總工作流程。                                                                                                                                                                                         |
| Vitest 與一般 CI     | **作業：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**證明：** 針對目標 ref 執行手動完整 CI 圖，包括 Linux Node 執行線、內建 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python Skills、Windows、macOS、Control UI i18n，以及透過總工作流程執行的 Android。<br />**重新執行：** `rerun_group=ci`。 |
| Plugin 預發布        | **作業：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**證明：** 僅發布使用的 Plugin 靜態檢查、代理式 Plugin 覆蓋、完整 Plugin 批次分片，以及 Plugin 預發布 Docker 執行線。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                                                                         |
| 發布檢查             | **作業：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**證明：** 安裝煙霧測試、跨作業系統套件檢查、套件驗收、QA Lab 一致性、即時 Matrix，以及即時 Telegram。使用 `run_release_soak=true` 或 `release_profile=full` 時，也會執行完整的即時/E2E 套件和 Docker 發布路徑區塊。<br />**重新執行：** `rerun_group=release-checks` 或較窄的發布檢查控制代碼。 |
| 套件成品             | **作業：** `Prepare release package artifact`<br />**子工作流程：** 無<br />**證明：** 提早建立父層 `release-package-under-test` tarball，供不需要等待 `OpenClaw Release Checks` 的套件相關檢查使用。<br />**重新執行：** 重新執行總工作流程，或為 `rerun_group=npm-telegram` 提供 `npm_telegram_package_spec`。                                                               |
| 套件 Telegram        | **作業：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**證明：** 在 `rerun_group=all` 且 `release_profile=full` 時，提供由父層成品支援的 Telegram 套件證明；或在設定 `npm_telegram_package_spec` 時，提供已發布套件的 Telegram 證明。<br />**重新執行：** 使用 `npm_telegram_package_spec` 的 `rerun_group=npm-telegram`。 |
| 總工作流程驗證器     | **作業：** `Verify full validation`<br />**子工作流程：** 無<br />**證明：** 重新檢查已記錄的子執行結論，並附加來自子工作流程的最慢作業表格。<br />**重新執行：** 在重新執行失敗的子工作流程並轉為綠燈後，只重新執行此作業。                                                                                                                                                |

對於 `ref=main` 和 `rerun_group=all`，較新的總工作流程會取代較舊的總工作流程。當父層被取消時，它的監控器會取消任何已經分派的子工作流程。發布分支與標籤驗證執行預設不會彼此取消。

## 發布檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它會解析一次目標，並在套件或 Docker 相關階段需要時，準備共用的 `release-package-under-test` 成品。

| 階段                | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發行目標            | **作業：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選取的 ref、選用的預期 SHA、設定檔、重新執行群組，以及聚焦的即時套件篩選器。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| 套件成品            | **作業：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 封裝或解析一個候選 tarball，並上傳 `release-package-under-test` 供下游面向套件的檢查使用。<br />**重新執行：** 受影響的套件、跨作業系統或即時/E2E 群組。                                                                                                                                                                                                              |
| 安裝煙霧測試        | **作業：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含重用根 Dockerfile 煙霧測試映像、QR 套件安裝、根與 Gateway Docker 煙霧測試、安裝程式 Docker 測試、Bun 全域安裝 image-provider 煙霧測試，以及快速 bundled-plugin 安裝/解除安裝 E2E。<br />**重新執行：** `rerun_group=install-smoke`。                                                                                                                                 |
| 跨作業系統          | **作業：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 針對選取的提供者與模式，在 Linux、Windows 和 macOS 上執行全新與升級路線，使用候選 tarball 加上基準套件。<br />**重新執行：** `rerun_group=cross-os`。                                                                                                                                                                                  |
| 儲存庫與即時 E2E    | **作業：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 儲存庫 E2E、即時快取、OpenAI websocket 串流、原生即時提供者與 Plugin 分片，以及由 `release_profile` 選取、Docker 支援的即時模型/後端/Gateway 測試框架。<br />**執行條件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。 |
| Docker 發行路徑     | **作業：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品的發行路徑 Docker 區塊。<br />**執行條件：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                                                                      |
| Package Acceptance  | **作業：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線 Plugin 套件夾具、Plugin 更新、mock-OpenAI Telegram 套件驗收，以及針對同一個 tarball 的已發布升級存活檢查。阻擋發行的檢查使用預設的最新已發布基準；浸泡測試會擴展到 `2026.4.23` 當天或之後的每個穩定 npm 發行版，加上已回報問題的夾具。<br />**重新執行：** `rerun_group=package`。                          |
| QA 同等性           | **作業：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支援工作流程：** 直接作業<br />**測試：** 候選與基準代理同等性套件，接著產生同等性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA 即時 Matrix      | **作業：** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接作業<br />**測試：** `qa-live-shared` 環境中的快速即時 Matrix QA 設定檔。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA 即時 Telegram    | **作業：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接作業<br />**測試：** 使用 Convex CI 憑證租約的即時 Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| 發行驗證器          | **作業：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 選取重新執行群組所需的發行檢查作業。<br />**重新執行：** 在聚焦的子作業通過後重新執行。                                                                                                                                                                                                                                                                                                    |

## Docker 發行路徑區塊

當 `live_suite_filter` 為空時，Docker 發行路徑階段會執行這些區塊：

| 區塊                                                            | 涵蓋範圍                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 發行路徑煙霧測試路線。                                     |
| `package-update-openai`                                         | OpenAI 套件安裝與更新行為。                                             |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                          |
| `package-update-core`                                           | 提供者中立的套件與更新行為。                                            |
| `plugins-runtime-plugins`                                       | 測試 Plugin 行為的 Plugin runtime 路線。                                |
| `plugins-runtime-services`                                      | 服務支援的 Plugin runtime 路線；在要求時包含 OpenWebUI。                |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 為平行發行驗證而拆分的 Plugin 安裝/runtime 批次。                       |

當只有一條 Docker 路線失敗時，請在可重用的即時/E2E 工作流程上使用目標式 `docker_lanes=<lane[,lane]>`。發行成品會包含每條路線的重新執行命令，並在可用時帶有套件成品與映像重用輸入。

## 發行設定檔

`release_profile` 主要控制發行檢查中的即時/提供者廣度。它不會移除一般完整 CI、Plugin Prerelease、安裝煙霧測試、套件驗收或 QA Lab。對於 `stable`，詳盡的儲存庫/即時 E2E 與 Docker 發行路徑區塊屬於浸泡測試涵蓋範圍，並在 `run_release_soak=true` 時執行。`full` 會強制開啟浸泡測試涵蓋範圍，並且在 `rerun_group=all` 時，讓傘狀執行針對父層發行套件成品執行套件 Telegram E2E，因此完整的預發布候選不會默默略過該 Telegram 套件路線。

| 設定檔    | 預期用途                          | 包含的即時/提供者涵蓋範圍                                                                                                                                                          |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的發行關鍵煙霧測試。          | OpenAI/核心即時路徑、OpenAI 的 Docker 即時模型、原生 Gateway 核心、原生 OpenAI Gateway 設定檔、原生 OpenAI Plugin，以及 Docker 即時 Gateway OpenAI。                              |
| `stable`  | 預設發行核准設定檔。              | `minimum` 加上 Anthropic 煙霧測試、Google、MiniMax、後端、原生即時測試框架、Docker 即時 CLI 後端、Docker ACP bind、Docker Codex 測試框架，以及一個 OpenCode Go 煙霧測試分片。 |
| `full`    | 廣泛的諮詢性掃描。                | `stable` 加上諮詢性提供者、Plugin 即時分片，以及媒體即時分片。                                                                                                                    |

## 僅限 full 的新增項目

這些套件會被 `stable` 略過，並由 `full` 包含：

| 區域                             | 僅限 full 的涵蓋範圍                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 即時模型                  | OpenCode Go、OpenRouter、xAI、Z.ai，以及 Fireworks。                                                                         |
| Docker 即時 Gateway              | 諮詢性提供者拆分為 DeepSeek/Fireworks、OpenCode Go/OpenRouter，以及 xAI/Z.ai 分片。                                          |
| 原生 Gateway 提供者設定檔        | 完整 Anthropic Opus 與 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI，以及 Z.ai。       |
| 原生 Plugin 即時分片             | Plugins A-K、L-N、O-Z other、Moonshot，以及 xAI。                                                                            |
| 原生媒體即時分片                 | 音訊、Google 音樂、MiniMax 音樂，以及影片群組 A-D。                                                                          |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則使用更廣泛的 Anthropic 與 OpenCode Go 模型分片。聚焦重新執行仍可使用彙總的 `native-live-src-gateway-profiles-anthropic` 或 `native-live-src-gateway-profiles-opencode-go` handle。

## 聚焦重新執行

使用 `rerun_group` 以避免重複執行不相關的發行 box：

| 代號                | 範圍                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有 `Full Release Validation` 階段。                                   |
| `ci`                | 僅手動完整 CI 子項。                                            |
| `plugin-prerelease` | 僅 Plugin 預發布子項。                                         |
| `release-checks`    | 所有 OpenClaw Release Checks 階段。                                   |
| `install-smoke`     | 透過發布檢查進行 Install Smoke。                                 |
| `cross-os`          | 跨 OS 發布檢查。                                              |
| `live-e2e`          | 儲存庫/即時 E2E 與 Docker 發布路徑驗證。                     |
| `package`           | 套件驗收。                                                   |
| `qa`                | QA 同等性加上 QA 即時通道。                                         |
| `qa-parity`         | 僅 QA 同等性通道與報告。                                      |
| `qa-live`           | 僅 QA 即時 Matrix 與 Telegram。                                     |
| `npm-telegram`      | 已發布套件 Telegram E2E；需要 `npm_telegram_package_spec`。 |

當某個即時套件失敗時，請搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。
有效的篩選器 ID 定義在可重用的即時/E2E 工作流程中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 代號是其三個提供者分片的彙總重新執行代號，
因此仍會展開到所有 advisory Docker Gateway 工作。

當某個跨 OS 通道失敗時，請搭配 `rerun_group=cross-os` 使用 `cross_os_suite_filter`。
此篩選器接受 OS ID、套件 ID，或 OS/套件配對，例如
`windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨 OS
摘要包含已封裝升級通道的各階段耗時，而長時間執行的命令會列印 Heartbeat
行，因此卡住的 Windows 更新在工作逾時前就能看見。

QA 發布檢查通道屬於 advisory。僅 QA 失敗會回報為警告，
且不會阻擋發布檢查驗證器；當你需要新的 QA 證據時，請重新執行 `rerun_group=qa`、
`qa-parity` 或 `qa-live`。

## 要保留的證據

保留 `Full Release Validation` 摘要作為發布層級索引。它會連結
子執行 ID，並包含最慢工作表。若發生失敗，請先檢查子
工作流程，然後重新執行上方最小的相符代號。

有用的成品：

- 來自 Full Release Validation 父項與 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 底下的 Docker 發布路徑成品
- Package Acceptance `package-under-test` 與 Docker 驗收成品
- 每個 OS 與套件的跨 OS 發布檢查成品
- QA 同等性、Matrix 與 Telegram 成品

## 工作流程檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
