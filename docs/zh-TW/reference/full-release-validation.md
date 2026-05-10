---
read_when:
    - 執行或重新執行完整發布驗證
    - 比較穩定版與完整發行驗證設定檔
    - 偵錯發行驗證階段失敗
summary: 完整發布驗證階段、子工作流程、發布設定檔、重新執行控制代碼與證據
title: 完整發布驗證
x-i18n:
    generated_at: "2026-05-10T19:50:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發布總控工作流程。它是預發布證明的唯一手動進入點，但大部分工作會在子工作流程中進行，因此失敗的執行項目可以重新執行，而不必重新開始整個發布。

請從受信任的工作流程 ref 執行，通常是 `main`，並將發布分支、標籤或完整 commit SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流程會使用受信任的工作流程 ref 作為測試框架，並使用輸入
`ref` 作為受測候選版本。這讓驗證較舊的發布分支或標籤時，也能使用新的驗證邏輯。

預設情況下，`release_profile=stable` 會執行會阻擋發布的執行線，並跳過完整的即時/Docker soak。傳入 `run_release_soak=true` 可在 stable 執行中包含 soak 執行線。`release_profile=full` 一律啟用 soak 執行線，因此廣泛的諮詢設定檔不會悄悄降低涵蓋範圍。

Package Acceptance 通常會從解析後的
`ref` 建置候選 tarball，包括透過 `pnpm ci:full-release` 分派的完整 SHA 執行。發布後，傳入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或
`openclaw@beta`/`openclaw@latest`），即可對已發布的 npm 套件執行相同的套件/更新矩陣。

## 頂層階段

| 階段                | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析    | **工作：** `Resolve target ref`<br />**子工作流程：** 無<br />**證明內容：** 解析發布分支、標籤或完整 commit SHA，並記錄選取的輸入。<br />**重新執行：** 如果這個階段失敗，請重新執行總控工作流程。                                                                                                                                                                                                                               |
| Vitest 和一般 CI | **工作：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**證明內容：** 針對目標 ref 執行手動完整 CI 圖，包括 Linux Node 執行線、隨附 Plugin 分片、頻道合約、Node 22 相容性、`check`、`check-additional`、建置 smoke、文件檢查、Python Skills、Windows、macOS、Control UI i18n，以及透過總控工作流程執行的 Android。<br />**重新執行：** `rerun_group=ci`。                                                  |
| Plugin 預發布    | **工作：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**證明內容：** 僅發布使用的 Plugin 靜態檢查、代理式 Plugin 涵蓋範圍、完整擴充批次分片，以及 Plugin 預發布 Docker 執行線。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                                                                                                                        |
| 發布檢查       | **工作：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**證明內容：** 安裝 smoke、跨作業系統套件檢查、Package Acceptance、QA Lab 對等性、即時 Matrix，以及即時 Telegram。搭配 `run_release_soak=true` 或 `release_profile=full` 時，也會執行完整的即時/E2E 套件和 Docker 發布路徑區塊。<br />**重新執行：** `rerun_group=release-checks` 或更精準的 release-checks 控制代碼。 |
| 套件成品     | **工作：** `Prepare release package artifact`<br />**子工作流程：** 無<br />**證明內容：** 及早建立上層 `release-package-under-test` tarball，供不需要等待 `OpenClaw Release Checks` 的套件相關檢查使用。<br />**重新執行：** 重新執行總控工作流程，或為 `rerun_group=npm-telegram` 提供 `npm_telegram_package_spec`。                                                                                    |
| 套件 Telegram     | **工作：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**證明內容：** 當 `rerun_group=all` 且 `release_profile=full` 時，提供以上層成品為基礎的 Telegram 套件證明；或在設定 `npm_telegram_package_spec` 時，提供已發布套件的 Telegram 證明。<br />**重新執行：** 使用 `npm_telegram_package_spec` 搭配 `rerun_group=npm-telegram`。                                                                               |
| 總控驗證器    | **工作：** `Verify full validation`<br />**子工作流程：** 無<br />**證明內容：** 重新檢查已記錄的子執行結論，並附加子工作流程中最慢工作的表格。<br />**重新執行：** 在重新執行失敗的子工作流程並轉為綠燈後，只重新執行這個工作。                                                                                                                                                                                    |

對於 `ref=main` 和 `rerun_group=all`，較新的總控工作流程會取代較舊的總控工作流程。當上層被取消時，其監控器會取消已經分派的任何子工作流程。發布分支和標籤驗證執行預設不會彼此取消。

## 發布檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它會解析一次目標，並在套件或 Docker 相關階段需要時，準備共用的 `release-package-under-test` 成品。

| 階段                | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發布目標            | **工作：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選取的 ref、選用的預期 SHA、profile、重新執行群組，以及聚焦的 live 套件篩選器。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| 套件成品            | **工作：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 打包或解析一個候選 tarball，並上傳 `release-package-under-test`，供下游面向套件的檢查使用。<br />**重新執行：** 受影響的套件、跨 OS 或 live/E2E 群組。                                                                                                                                                                                                              |
| 安裝 smoke          | **工作：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含根 Dockerfile smoke 映像重用、QR 套件安裝、根與 Gateway Docker smoke、安裝程式 Docker 測試、Bun 全域安裝映像提供者 smoke，以及快速的內建 Plugin 安裝/解除安裝 E2E。<br />**重新執行：** `rerun_group=install-smoke`。                                                                                                                                 |
| 跨 OS               | **工作：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 針對選取的提供者與模式，在 Linux、Windows 和 macOS 上執行全新與升級路徑，使用候選 tarball 加上一個基準套件。<br />**重新執行：** `rerun_group=cross-os`。                                                                                                                                                                                  |
| Repo 與 live E2E    | **工作：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** repository E2E、live 快取、OpenAI websocket 串流、原生 live 提供者與 Plugin 分片，以及由 `release_profile` 選取、以 Docker 支援的 live 模型/backend/Gateway harness。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。 |
| Docker 發布路徑     | **工作：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品的發布路徑 Docker 區塊。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                                                                      |
| 套件接受度          | **工作：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線 Plugin 套件 fixture、Plugin 更新、mock-OpenAI Telegram 套件接受度，以及針對同一個 tarball 的已發布升級存活檢查。阻擋發布的檢查使用預設最新已發布基準；soak 檢查會擴展到 `2026.4.23` 或之後的每個穩定 npm 發布版本，加上已回報問題的 fixture。<br />**重新執行：** `rerun_group=package`。                          |
| QA 同等性           | **工作：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支援工作流程：** 直接工作<br />**測試：** 候選與基準 agentic 同等性套件，接著是同等性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA live Matrix      | **工作：** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接工作<br />**測試：** `qa-live-shared` 環境中的快速 live Matrix QA profile。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **工作：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接工作<br />**測試：** 使用 Convex CI 憑證租約的 live Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| 發布驗證器          | **工作：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 選取的重新執行群組所需的發布檢查工作。<br />**重新執行：** 聚焦的子工作通過後重新執行。                                                                                                                                                                                                                                                                                                    |

## Docker 發布路徑區塊

當 `live_suite_filter` 為空時，Docker 發布路徑階段會執行這些區塊：

| 區塊                                                            | 涵蓋範圍                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | Core Docker 發布路徑 smoke 路徑。                                                |
| `package-update-openai`                                         | OpenAI 套件安裝/更新行為，包含 Codex 隨選安裝。                                  |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                                   |
| `package-update-core`                                           | 提供者中立的套件與更新行為。                                                     |
| `plugins-runtime-plugins`                                       | 執行 Plugin 行為的 Plugin runtime 路徑。                                          |
| `plugins-runtime-services`                                      | 服務支援與 live Plugin runtime 路徑；在要求時包含 OpenWebUI。                    |
| `plugins-runtime-install-a` 到 `plugins-runtime-install-h`      | 分割為平行發布驗證的 Plugin 安裝/runtime 批次。                                  |

當只有一個 Docker 路徑失敗時，請在可重用 live/E2E 工作流程上使用目標式
`docker_lanes=<lane[,lane]>`。發布成品會包含每個路徑的重新執行命令，
並在可用時帶入套件成品與映像重用輸入。

## 發布 profile

`release_profile` 主要控制發布檢查中的 live/提供者廣度。
它不會移除一般完整 CI、Plugin 預發布、安裝 smoke、套件接受度，
或 QA Lab。對於 `stable`，完整的 repo/live E2E 和 Docker
發布路徑區塊是 soak 涵蓋範圍，並會在 `run_release_soak=true` 時執行。
`full` 會強制開啟 soak 涵蓋範圍，並在 `rerun_group=all` 時讓總括執行針對父層發布套件成品執行套件 Telegram E2E，因此完整的預發布候選不會靜默略過該 Telegram 套件路徑。

| Profile   | 預期用途                          | 包含的 live/提供者涵蓋範圍                                                                                                                                                         |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的發布關鍵 smoke。            | OpenAI/core live 路徑、OpenAI 的 Docker live 模型、原生 Gateway core、原生 OpenAI Gateway profile、原生 OpenAI Plugin，以及 Docker live Gateway OpenAI。                            |
| `stable`  | 預設發布核准 profile。            | `minimum` 加上 Anthropic smoke、Google、MiniMax、backend、原生 live test harness、Docker live CLI backend、Docker ACP bind、Docker Codex harness，以及一個 OpenCode Go smoke 分片。 |
| `full`    | 廣泛的 advisory 掃描。            | `stable` 加上 advisory 提供者、Plugin live 分片，以及媒體 live 分片。                                                                                                               |

## 僅 full 新增項目

這些套件會被 `stable` 略過，並由 `full` 包含：

| 區域                             | 僅 full 涵蓋範圍                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Docker live 模型                 | OpenCode Go、OpenRouter、xAI、Z.ai 和 Fireworks。                                                                        |
| Docker live Gateway              | Advisory 提供者分割為 DeepSeek/Fireworks、OpenCode Go/OpenRouter，以及 xAI/Z.ai 分片。                                   |
| 原生 Gateway 提供者 profile      | 完整 Anthropic Opus 和 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI，以及 Z.ai。 |
| 原生 Plugin live 分片            | Plugins A-K、L-N、O-Z 其他、Moonshot，以及 xAI。                                                                         |
| 原生媒體 live 分片               | Audio、Google music、MiniMax music，以及 video groups A-D。                                                              |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則改用更廣泛的
Anthropic 和 OpenCode Go 模型分片。聚焦的重新執行仍可使用彙總的
`native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` handle。

## 聚焦的重新執行

使用 `rerun_group` 以避免重複執行不相關的發布方塊：

| Handle              | 範圍                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有「完整發行驗證」階段。                                   |
| `ci`                | 僅限手動完整 CI 子項。                                            |
| `plugin-prerelease` | 僅限 Plugin 預發行子項。                                         |
| `release-checks`    | 所有 OpenClaw 發行檢查階段。                                   |
| `install-smoke`     | 安裝 Smoke 至發行檢查。                                 |
| `cross-os`          | 跨 OS 發行檢查。                                              |
| `live-e2e`          | Repo/live E2E 與 Docker 發行路徑驗證。                     |
| `package`           | 套件驗收。                                                   |
| `qa`                | QA 對等性加上 QA 即時通道。                                         |
| `qa-parity`         | 僅限 QA 對等性通道與報告。                                      |
| `qa-live`           | 僅限 QA 即時 Matrix 與 Telegram。                                     |
| `npm-telegram`      | 已發布套件 Telegram E2E；需要 `npm_telegram_package_spec`。 |

當某個即時套件失敗時，請搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。
有效的篩選器 ID 定義於可重用的 live/E2E 工作流程中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

`live-gateway-advisory-docker` handle 是其三個提供者分片的彙總重新執行 handle，
因此仍會展開到所有諮詢 Docker Gateway 作業。

當某個跨 OS 通道失敗時，請搭配 `rerun_group=cross-os` 使用 `cross_os_suite_filter`。
篩選器接受 OS ID、套件 ID，或 OS/套件配對，例如
`windows/packaged-upgrade`、`windows`，或 `packaged-fresh`。跨 OS
摘要會包含封裝升級通道的各階段計時，而長時間執行的
命令會列印 Heartbeat 行，讓卡住的 Windows 更新能在
作業逾時前被看見。

QA 發行檢查通道屬於諮詢性質。僅 QA 失敗會回報為警告，
且不會封鎖發行檢查驗證器；需要新的 QA 證據時，請重新執行 `rerun_group=qa`、
`qa-parity` 或 `qa-live`。

## 要保留的證據

保留「完整發行驗證」摘要作為發行層級索引。它會連結
子執行 ID，並包含最慢作業表格。遇到失敗時，請先檢查子
工作流程，然後重新執行上方最小的相符 handle。

實用成品：

- 來自「完整發行驗證」父項與 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 發行路徑成品
- 套件驗收 `package-under-test` 與 Docker 驗收成品
- 各 OS 與套件的跨 OS 發行檢查成品
- QA 對等性、Matrix 與 Telegram 成品

## 工作流程檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
