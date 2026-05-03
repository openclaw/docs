---
read_when:
    - 執行或重新執行完整發布驗證
    - 比較穩定版與完整版的發布驗證設定檔
    - 偵錯發布驗證階段失敗
summary: 完整發布驗證階段、子工作流程、發布設定檔、重新執行控制代碼與佐證
title: 完整發布驗證
x-i18n:
    generated_at: "2026-05-03T21:42:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發行總括流程。它是發行前驗證的單一手動
進入點，但大多數工作會在子 workflow 中進行，讓失敗的執行環境可以重跑，而不必重新啟動整個發行流程。

從受信任的 workflow ref 執行它，通常是 `main`，並將發行分支、
標籤或完整 commit SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子 workflow 會將受信任的 workflow ref 用於測試框架，並將輸入的
`ref` 用於待測候選版本。這能在驗證較舊的發行分支或標籤時，
仍可使用新的驗證邏輯。

套件驗收通常會從已解析的 `ref` 建置候選 tarball，
包括透過 `pnpm ci:full-release` 派發的完整 SHA 執行。發布後，
傳入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或
`openclaw@beta`/`openclaw@latest`），即可改為針對已出貨的 npm 套件執行相同的套件/更新矩陣。

## 頂層階段

| 階段                 | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析             | **Job:** `Resolve target ref`<br />**子 workflow:** 無<br />**證明：** 解析發行分支、標籤或完整 commit SHA，並記錄選取的輸入。<br />**重跑：** 如果此步驟失敗，重跑總括流程。                                                                                                                                               |
| Vitest 與一般 CI     | **Job:** `Run normal full CI`<br />**子 workflow:** `CI`<br />**證明：** 針對目標 ref 的手動完整 CI 圖，包括 Linux Node lanes、內建 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python skills、Windows、macOS、Control UI i18n，以及透過總括流程執行的 Android。<br />**重跑：** `rerun_group=ci`。 |
| Plugin 預發行        | **Job:** `Run plugin prerelease validation`<br />**子 workflow:** `Plugin Prerelease`<br />**證明：** 僅限發行的 Plugin 靜態檢查、agentic Plugin 覆蓋率、完整擴充批次分片，以及 Plugin 預發行 Docker lanes。<br />**重跑：** `rerun_group=plugin-prerelease`。                                                                 |
| 發行檢查             | **Job:** `Run release/live/Docker/QA validation`<br />**子 workflow:** `OpenClaw Release Checks`<br />**證明：** 安裝煙霧測試、跨 OS 套件檢查、live/E2E 測試套件、Docker 發行路徑區塊、套件驗收、QA Lab parity、live Matrix，以及 live Telegram。<br />**重跑：** `rerun_group=release-checks` 或更窄的 release-checks handle。 |
| 套件成品             | **Job:** `Prepare release package artifact`<br />**子 workflow:** 無<br />**證明：** 夠早建立父層 `release-package-under-test` tarball，供不需要等待 `OpenClaw Release Checks` 的套件面向檢查使用。<br />**重跑：** 重跑總括流程，或為 `rerun_group=npm-telegram` 提供 `npm_telegram_package_spec`。                    |
| 套件 Telegram        | **Job:** `Run package Telegram E2E`<br />**子 workflow:** `NPM Telegram Beta E2E`<br />**證明：** 在 `rerun_group=all` 且 `release_profile=full` 時，提供由父層成品支援的 Telegram 套件驗證；或在設定 `npm_telegram_package_spec` 時，提供已發布套件的 Telegram 驗證。<br />**重跑：** `rerun_group=npm-telegram` 搭配 `npm_telegram_package_spec`。 |
| 總括驗證器           | **Job:** `Verify full validation`<br />**子 workflow:** 無<br />**證明：** 重新檢查已記錄的子執行結論，並附加子 workflow 的最慢 job 表格。<br />**重跑：** 在重跑失敗的子 workflow 並轉綠後，只重跑此 job。                                                                                                                   |

對於 `ref=main` 和 `rerun_group=all`，較新的總括流程會取代較舊的總括流程。
當父層被取消時，它的監控器會取消任何已派發的子 workflow。
發行分支與標籤驗證執行預設不會互相取消。

## 發行檢查階段

`OpenClaw Release Checks` 是最大的子 workflow。它會解析一次目標，
並在套件或 Docker 面向階段需要時，準備共用的 `release-package-under-test` 成品。

| 階段                | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發行目標            | **Job:** `Resolve target ref`<br />**後備 workflow:** 無<br />**測試：** 選取的 ref、選擇性的預期 SHA、profile、重跑群組，以及聚焦的 live 測試套件篩選器。<br />**重跑：** `rerun_group=release-checks`。                                                                                                                     |
| 套件成品            | **Job:** `Prepare release package artifact`<br />**後備 workflow:** 無<br />**測試：** 打包或解析一個候選 tarball，並上傳 `release-package-under-test` 供下游套件面向檢查使用。<br />**重跑：** 受影響的套件、跨 OS 或 live/E2E 群組。                                                                                         |
| 安裝煙霧測試        | **Job:** `Run install smoke`<br />**後備 workflow:** `Install Smoke`<br />**測試：** 完整安裝路徑，包含根層 Dockerfile 煙霧測試映像重用、QR 套件安裝、根層與 Gateway Docker 煙霧測試、安裝程式 Docker 測試、Bun 全域安裝映像提供者煙霧測試，以及快速內建 Plugin 安裝/解除安裝 E2E。<br />**重跑：** `rerun_group=install-smoke`。 |
| 跨 OS               | **Job:** `cross_os_release_checks`<br />**後備 workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 在 Linux、Windows 和 macOS 上，使用候選 tarball 加上基準套件，針對選取的提供者與模式執行全新安裝和升級 lanes。<br />**重跑：** `rerun_group=cross-os`。                                           |
| Repo 與 live E2E    | **Job:** `Run repo/live E2E validation`<br />**後備 workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** repository E2E、live cache、OpenAI websocket streaming、原生 live 提供者與 Plugin 分片，以及由 `release_profile` 選取的 Docker 支援 live model/backend/gateway 測試框架。<br />**重跑：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。 |
| Docker 發行路徑     | **Job:** `Run Docker release-path validation`<br />**後備 workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品執行發行路徑 Docker 區塊。<br />**重跑：** `rerun_group=live-e2e`。                                                                                                           |
| 套件驗收            | **Job:** `Run package acceptance`<br />**後備 workflow:** `Package Acceptance`<br />**測試：** 離線 Plugin 套件 fixture、Plugin 更新、mock-OpenAI Telegram 套件驗收，以及從每個 `2026.4.23` 或之後的穩定 npm 發行版，針對相同 tarball 執行的已發布升級 survivor 檢查。<br />**重跑：** `rerun_group=package`。             |
| QA parity           | **Job:** `Run QA Lab parity lane` 與 `Run QA Lab parity report`<br />**後備 workflow:** 直接 job<br />**測試：** 候選與基準 agentic parity packs，然後執行 parity 報告。<br />**重跑：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                         |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**後備 workflow:** 直接 job<br />**測試：** `qa-live-shared` 環境中的快速 live Matrix QA profile。<br />**重跑：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                     |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**後備 workflow:** 直接 job<br />**測試：** 使用 Convex CI credential leases 的 live Telegram QA。<br />**重跑：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                   |
| 發行驗證器          | **Job:** `Verify release checks`<br />**後備 workflow:** 無<br />**測試：** 針對選取重跑群組所需的 release-check jobs。<br />**重跑：** 在聚焦的子 jobs 通過後重跑。                                                                                                                                                            |

## Docker 發行路徑區塊

當 `live_suite_filter` 為空時，Docker 發行路徑階段會執行這些區塊：

| 區塊                                                            | 覆蓋範圍                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker 發行路徑煙霧測試 lanes。                                   |
| `package-update-openai`                                         | OpenAI 套件安裝與更新行為。                                             |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                          |
| `package-update-core`                                           | 提供者中立的套件與更新行為。                                            |
| `plugins-runtime-plugins`                                       | 執行 Plugin 行為的 Plugin runtime lanes。                               |
| `plugins-runtime-services`                                      | 服務支援的 Plugin runtime lanes；在要求時包含 OpenWebUI。               |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 為平行發行驗證而拆分的 Plugin 安裝/runtime 批次。                       |

當只有一個 Docker 通道失敗時，請在可重用的即時/E2E 工作流程上使用目標式 `docker_lanes=<lane[,lane]>`。發行成品會在可用時包含每個通道的重新執行命令，並帶有套件成品與映像重用輸入。

## 發行設定檔

`release_profile` 主要控制發行檢查中的即時/供應商涵蓋範圍。它不會移除一般完整 CI、Plugin Prerelease、安裝煙霧測試、套件驗收、QA Lab，或 Docker 發行路徑區塊。`full` 也會讓傘狀執行在 `rerun_group=all` 時，針對父層發行套件成品執行套件 Telegram E2E，因此完整的預發布候選版本不會默默略過該 Telegram 套件通道。

| 設定檔    | 預期用途                          | 包含的即時/供應商涵蓋範圍                                                                                                                                                          |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的發行關鍵煙霧測試。          | OpenAI/核心即時路徑、OpenAI 的 Docker 即時模型、原生 gateway 核心、原生 OpenAI gateway 設定檔、原生 OpenAI Plugin，以及 Docker 即時 gateway OpenAI。                              |
| `stable`  | 預設發行核准設定檔。              | `minimum` 加上 Anthropic 煙霧測試、Google、MiniMax、後端、原生即時測試框架、Docker 即時 CLI 後端、Docker ACP 綁定、Docker Codex 框架，以及一個 OpenCode Go 煙霧測試分片。         |
| `full`    | 廣泛的 advisory 掃描。            | `stable` 加上 advisory 供應商、Plugin 即時分片，以及媒體即時分片。                                                                                                                |

## 僅完整設定檔的新增項目

這些套件會被 `stable` 略過，並由 `full` 包含：

| 區域                             | 僅完整設定檔的涵蓋範圍                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker 即時模型                  | OpenCode Go、OpenRouter、xAI、Z.ai，以及 Fireworks。                                                                        |
| Docker 即時 gateway              | advisory 供應商拆分為 DeepSeek/Fireworks、OpenCode Go/OpenRouter，以及 xAI/Z.ai 分片。                                    |
| 原生 gateway 供應商設定檔        | 完整 Anthropic Opus 與 Sonnet/Haiku 分片、Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI，以及 Z.ai。     |
| 原生 Plugin 即時分片             | Plugins A-K、L-N、O-Z other、Moonshot，以及 xAI。                                                                           |
| 原生媒體即時分片                 | 音訊、Google 音樂、MiniMax 音樂，以及影片群組 A-D。                                                                        |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則改用更廣泛的 Anthropic 與 OpenCode Go 模型分片。聚焦的重新執行仍可使用彙總的 `native-live-src-gateway-profiles-anthropic` 或 `native-live-src-gateway-profiles-opencode-go` 控制代碼。

## 聚焦重新執行

使用 `rerun_group` 以避免重複執行無關的發行機器：

| 控制代碼            | 範圍                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有 Full Release Validation 階段。                                   |
| `ci`                | 僅手動完整 CI 子流程。                                                |
| `plugin-prerelease` | 僅 Plugin Prerelease 子流程。                                         |
| `release-checks`    | 所有 OpenClaw Release Checks 階段。                                   |
| `install-smoke`     | 安裝煙霧測試到發行檢查。                                              |
| `cross-os`          | 跨作業系統發行檢查。                                                  |
| `live-e2e`          | 儲存庫/即時 E2E 與 Docker 發行路徑驗證。                              |
| `package`           | Package Acceptance。                                                   |
| `qa`                | QA parity 加上 QA 即時通道。                                          |
| `qa-parity`         | 僅 QA parity 通道與報告。                                             |
| `qa-live`           | 僅 QA 即時 Matrix 與 Telegram。                                       |
| `npm-telegram`      | 已發布套件的 Telegram E2E；需要 `npm_telegram_package_spec`。         |

當有一個即時套件失敗時，請搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。有效的篩選器 ID 定義於可重用的即時/E2E 工作流程中，包括 `docker-live-models`、`live-gateway-docker`、`live-gateway-anthropic-docker`、`live-gateway-google-docker`、`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、`live-cli-backend-docker`、`live-acp-bind-docker`，以及 `live-codex-harness-docker`。

`live-gateway-advisory-docker` 控制代碼是其三個供應商分片的彙總重新執行控制代碼，因此仍會展開到所有 advisory Docker gateway 工作。

## 要保留的證據

保留 `Full Release Validation` 摘要作為發行層級索引。它會連結子流程執行 ID，並包含最慢工作的表格。若有失敗，請先檢查子工作流程，再重新執行上方最小的相符控制代碼。

實用成品：

- 來自 Full Release Validation 父流程和 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 發行路徑成品
- Package Acceptance 的 `package-under-test` 與 Docker 驗收成品
- 每個作業系統與套件的 Cross-OS 發行檢查成品
- QA parity、Matrix，以及 Telegram 成品

## 工作流程檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
