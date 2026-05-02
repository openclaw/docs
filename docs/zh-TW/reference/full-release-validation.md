---
read_when:
    - 執行或重新執行完整發布驗證
    - 比較穩定與完整發行驗證設定檔
    - 偵錯發行驗證階段失敗
summary: 完整發布驗證階段、子工作流程、發布設定檔、重新執行控制代碼與證據
title: 完整發行驗證
x-i18n:
    generated_at: "2026-05-02T02:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發行驗證的總控流程。它是預釋出驗證的單一手動進入點，但大多數工作都在子工作流程中執行，因此失敗的執行環境可以重新執行，而不必重新啟動整個發行流程。

從受信任的工作流程 ref 執行，通常是 `main`，並將發行分支、標籤或完整提交 SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流程會使用受信任的工作流程 ref 作為測試框架，並使用輸入
`ref` 作為受測候選版本。這樣在驗證較舊的發行分支或標籤時，仍可使用新的驗證邏輯。

## 頂層階段

| 階段                 | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析             | **作業：** `Resolve target ref`<br />**子工作流程：** 無<br />**驗證：** 解析發行分支、標籤或完整提交 SHA，並記錄選取的輸入。<br />**重新執行：** 如果此階段失敗，請重新執行總控流程。                                                                                                                                       |
| Vitest 與一般 CI     | **作業：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**驗證：** 針對目標 ref 執行手動完整 CI 圖，包括 Linux Node lanes、內建 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置 smoke、文件檢查、Python skills、Windows、macOS、Control UI i18n，以及透過總控流程執行的 Android。<br />**重新執行：** `rerun_group=ci`。 |
| Plugin 預釋出        | **作業：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**驗證：** 僅限發行的 Plugin 靜態檢查、代理式 Plugin 覆蓋率、完整擴充套件批次分片，以及 Plugin 預釋出 Docker lanes。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                               |
| 發行檢查             | **作業：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**驗證：** 安裝 smoke、跨 OS 套件檢查、live/E2E 套件、Docker 發行路徑區塊、Package Acceptance、QA Lab parity、live Matrix，以及 live Telegram。<br />**重新執行：** `rerun_group=release-checks` 或更窄範圍的 release-checks 控制項。 |
| 套件 Telegram        | **作業：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**驗證：** 在 `rerun_group=all` 且 `release_profile=full` 時，提供以成品為基礎的 Telegram 套件驗證；或在設定 `npm_telegram_package_spec` 時，提供已發布套件的 Telegram 驗證。<br />**重新執行：** `rerun_group=npm-telegram` 搭配 `npm_telegram_package_spec`。 |
| 總控驗證器           | **作業：** `Verify full validation`<br />**子工作流程：** 無<br />**驗證：** 重新檢查已記錄的子執行結論，並附加子工作流程中最慢作業的表格。<br />**重新執行：** 在重新執行失敗子項並轉綠後，只重新執行此作業。                                                                                                                 |

對於 `ref=main` 和 `rerun_group=all`，較新的總控流程會取代較舊的流程。
當父流程被取消時，其監控程式會取消任何已派發的子工作流程。發行分支與標籤驗證執行預設不會彼此取消。

## 發行檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它會解析一次目標，並在套件或 Docker 相關階段需要時，準備共用的 `release-package-under-test` 成品。

| 階段                | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發行目標            | **作業：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選取的 ref、選用的預期 SHA、設定檔、重新執行群組，以及聚焦的 live 套件篩選器。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                   |
| 套件成品            | **作業：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 打包或解析一個候選 tarball，並上傳 `release-package-under-test` 供下游套件相關檢查使用。<br />**重新執行：** 受影響的套件、跨 OS 或 live/E2E 群組。                                                                                       |
| 安裝 smoke          | **作業：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含根 Dockerfile smoke 映像重用、QR 套件安裝、根與 Gateway Docker smokes、安裝程式 Docker 測試、Bun 全域安裝 image-provider smoke，以及快速內建 Plugin 安裝/解除安裝 E2E。<br />**重新執行：** `rerun_group=install-smoke`。 |
| 跨 OS               | **作業：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 使用候選 tarball 加上基準套件，針對選取的 provider 與 mode，在 Linux、Windows 和 macOS 上執行全新安裝與升級 lanes。<br />**重新執行：** `rerun_group=cross-os`。                                      |
| Repo 與 live E2E    | **作業：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** repository E2E、live cache、OpenAI websocket streaming、原生 live provider 與 Plugin 分片，以及由 `release_profile` 選取的 Docker 支援 live model/backend/gateway 測試框架。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。 |
| Docker 發行路徑     | **作業：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品執行發行路徑 Docker 區塊。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                          |
| Package Acceptance  | **作業：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線 Plugin 套件 fixtures、Plugin 更新，以及針對同一 tarball 的 mock-OpenAI Telegram 套件接受度測試。<br />**重新執行：** `rerun_group=package`。                                                                                 |
| QA parity           | **作業：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支援工作流程：** 直接作業<br />**測試：** 候選與基準代理式 parity packs，接著執行 parity 報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                         |
| QA live Matrix      | **作業：** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接作業<br />**測試：** 在 `qa-live-shared` 環境中執行快速 live Matrix QA profile。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                              |
| QA live Telegram    | **作業：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接作業<br />**測試：** 使用 Convex CI credential leases 的 live Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                 |
| 發行驗證器          | **作業：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 選取的重新執行群組所需的 release-check 作業。<br />**重新執行：** 在聚焦的子作業通過後重新執行。                                                                                                                                                  |

## Docker 發行路徑區塊

當 `live_suite_filter` 為空時，Docker 發行路徑階段會執行這些區塊：

| 區塊                                                            | 覆蓋範圍                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker 發行路徑 smoke lanes。                                      |
| `package-update-openai`                                         | OpenAI 套件安裝與更新行為。                                            |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                         |
| `package-update-core`                                           | Provider-neutral 套件與更新行為。                                      |
| `plugins-runtime-plugins`                                       | 執行 Plugin 行為的 Plugin runtime lanes。                               |
| `plugins-runtime-services`                                      | 服務支援的 Plugin runtime lanes；在要求時包含 OpenWebUI。              |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 為平行發行驗證拆分的 Plugin 安裝/runtime 批次。                         |

當只有一個 Docker lane 失敗時，請在可重用 live/E2E 工作流程上使用目標式
`docker_lanes=<lane[,lane]>`。發行成品會在可用時包含每個 lane 的重新執行命令，並帶有套件成品與映像重用輸入。

## 發行設定檔

`release_profile` 主要控制發行檢查中的 live/provider 廣度。
它不會移除一般完整 CI、Plugin Prerelease、安裝 smoke、package
acceptance、QA Lab 或 Docker 發行路徑區塊。`full` 也會讓總控流程在
`rerun_group=all` 時針對發行套件成品執行套件 Telegram E2E，因此完整的預發布候選版本不會默默略過該 Telegram 套件 lane。

| 設定檔 | 預期用途 | 包含的即時/提供者覆蓋範圍 |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的發行關鍵煙霧測試。 | OpenAI/核心即時路徑、OpenAI 的 Docker 即時模型、原生 gateway 核心、原生 OpenAI gateway 設定檔、原生 OpenAI plugin，以及 Docker 即時 gateway OpenAI。 |
| `stable`  | 預設的發行核准設定檔。 | `minimum` 加上 Anthropic、Google、MiniMax、後端、原生即時測試框架、Docker 即時 CLI 後端、Docker ACP 綁定、Docker Codex 框架，以及一個 OpenCode Go 煙霧測試分片。 |
| `full`    | 廣泛的 advisory 掃描。 | `stable` 加上 advisory 提供者、plugin 即時分片，以及媒體即時分片。 |

## 僅限 full 的新增項目

這些套件會被 `stable` 略過，並由 `full` 包含：

| 區域 | 僅限 full 的覆蓋範圍 |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker 即時模型 | OpenCode Go、OpenRouter、xAI、Z.ai，以及 Fireworks。 |
| Docker 即時 Gateway | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI，以及 Z.ai 的 advisory 分片。 |
| 原生 Gateway 提供者設定檔 | Fireworks、DeepSeek、完整 OpenCode Go 模型分片、OpenRouter、xAI，以及 Z.ai。 |
| 原生 Plugin 即時分片 | Plugin A-K、L-N、O-Z 其他、Moonshot，以及 xAI。 |
| 原生媒體即時分片 | 音訊、Google 音樂、MiniMax 音樂，以及視訊群組 A-D。 |

`stable` 包含 `native-live-src-gateway-profiles-opencode-go-smoke`；`full`
則使用更廣泛的 OpenCode Go 模型分片。

## 聚焦重新執行

使用 `rerun_group` 以避免重複執行不相關的發行箱：

| 控制代碼 | 範圍 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有 Full Release Validation 階段。 |
| `ci`                | 僅手動完整 CI 子項。 |
| `plugin-prerelease` | 僅 Plugin Prerelease 子項。 |
| `release-checks`    | 所有 OpenClaw Release Checks 階段。 |
| `install-smoke`     | 從 Install Smoke 到發行檢查。 |
| `cross-os`          | 跨作業系統發行檢查。 |
| `live-e2e`          | 儲存庫/即時 E2E 與 Docker 發行路徑驗證。 |
| `package`           | 套件驗收。 |
| `qa`                | QA parity 加上 QA 即時 lanes。 |
| `qa-parity`         | 僅 QA parity lanes 與報告。 |
| `qa-live`           | 僅 QA 即時 Matrix 與 Telegram。 |
| `npm-telegram`      | 已發布套件的 Telegram E2E；需要 `npm_telegram_package_spec`。 |

當有一個即時套件失敗時，搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。
有效的篩選器 ID 定義於可重用的即時/E2E workflow，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

## 要保留的證據

保留 `Full Release Validation` 摘要作為發行層級索引。它會連結
子執行 ID，並包含最慢工作的表格。若發生失敗，請先檢查子
workflow，然後重新執行上方最小的相符控制代碼。

實用成品：

- 來自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 發行路徑成品
- Package Acceptance 的 `package-under-test` 與 Docker 驗收成品
- 每個作業系統與套件的跨作業系統發行檢查成品
- QA parity、Matrix，以及 Telegram 成品

## Workflow 檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
