---
read_when:
    - 執行或重新執行完整發布驗證
    - 比較穩定版與完整發行驗證設定檔
    - 偵錯發行驗證階段失敗
summary: 完整發布驗證的階段、子工作流程、發布設定檔、重新執行控制代碼與證據
title: 完整發布驗證
x-i18n:
    generated_at: "2026-05-02T21:03:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發行版總控流程。它是發行前驗證的唯一手動進入點，但大多數工作會在子工作流程中進行，因此失敗的執行環境可以重新執行，而不必重啟整個發行流程。

請從可信任的工作流程參照執行，通常是 `main`，並將發行分支、標籤或完整提交 SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流程會使用可信任的工作流程參照作為測試框架，並使用輸入的 `ref` 作為待測候選版本。這能讓新的驗證邏輯在驗證較舊的發行分支或標籤時仍可使用。

Package Acceptance 通常會從解析後的 `ref` 建置候選 tarball，包括透過 `pnpm ci:full-release` 分派的完整 SHA 執行。發布後，傳入 `package_acceptance_package_spec=openclaw@YYYY.M.D`（或 `openclaw@beta`/`openclaw@latest`），即可改為針對已發布的 npm 套件執行相同的套件/更新矩陣。

## 最上層階段

| 階段                 | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析             | **工作：** `Resolve target ref`<br />**子工作流程：** 無<br />**證明：** 解析發行分支、標籤或完整提交 SHA，並記錄選取的輸入。<br />**重新執行：** 如果這裡失敗，請重新執行總控流程。                                                                                                                                                                               |
| Vitest 與一般 CI     | **工作：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**證明：** 針對目標 ref 執行手動完整 CI 圖，包括 Linux Node 通道、內建 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置冒煙測試、文件檢查、Python Skills、Windows、macOS、Control UI i18n，以及透過總控流程執行的 Android。<br />**重新執行：** `rerun_group=ci`。 |
| Plugin 預發行        | **工作：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**證明：** 僅限發行的 Plugin 靜態檢查、代理式 Plugin 覆蓋範圍、完整擴充功能批次分片，以及 Plugin 預發行 Docker 通道。<br />**重新執行：** `rerun_group=plugin-prerelease`。                                                                                                       |
| 發行檢查             | **工作：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**證明：** 安裝冒煙測試、跨作業系統套件檢查、live/E2E 套件、Docker 發行路徑區塊、Package Acceptance、QA Lab 同等性、live Matrix，以及 live Telegram。<br />**重新執行：** `rerun_group=release-checks` 或較窄的 release-checks 控制代碼。                                |
| Package Telegram     | **工作：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**證明：** 當 `rerun_group=all` 且 `release_profile=full` 時，提供以成品為依據的 Telegram 套件證明；或當設定 `npm_telegram_package_spec` 時，提供已發布套件的 Telegram 證明。<br />**重新執行：** 使用 `rerun_group=npm-telegram` 搭配 `npm_telegram_package_spec`。                                     |
| 總控驗證器           | **工作：** `Verify full validation`<br />**子工作流程：** 無<br />**證明：** 重新檢查已記錄的子執行結論，並附加子工作流程中最慢工作的表格。<br />**重新執行：** 在重新執行失敗的子工作並轉綠後，只重新執行此工作。                                                                                                                                   |

對於 `ref=main` 且 `rerun_group=all`，較新的總控流程會取代較舊的總控流程。當父流程被取消時，它的監控器會取消任何已分派的子工作流程。發行分支與標籤驗證執行預設不會彼此取消。

## 發行檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它會解析一次目標，並在套件或 Docker 相關階段需要時，準備共用的 `release-package-under-test` 成品。

| 階段                | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發行目標            | **工作：** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選取的 ref、可選的預期 SHA、設定檔、重新執行群組，以及聚焦的 live 套件篩選器。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                           |
| 套件成品            | **工作：** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 打包或解析一個候選 tarball，並上傳 `release-package-under-test` 供下游套件相關檢查使用。<br />**重新執行：** 受影響的套件、跨作業系統或 live/E2E 群組。                                                                                                           |
| 安裝冒煙測試        | **工作：** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含根 Dockerfile 冒煙映像重用、QR 套件安裝、根與 Gateway Docker 冒煙測試、安裝器 Docker 測試、Bun 全域安裝 image-provider 冒煙測試，以及快速內建 Plugin 安裝/解除安裝 E2E。<br />**重新執行：** `rerun_group=install-smoke`。                              |
| 跨作業系統          | **工作：** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 在 Linux、Windows 與 macOS 上，針對選取的 provider 與 mode 執行全新安裝與升級通道，使用候選 tarball 加上基準套件。<br />**重新執行：** `rerun_group=cross-os`。                                                                               |
| Repo 與 live E2E    | **工作：** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** repository E2E、live cache、OpenAI websocket 串流、原生 live provider 與 Plugin 分片，以及由 `release_profile` 選取、以 Docker 支援的 live model/backend/gateway 測試框架。<br />**重新執行：** `rerun_group=live-e2e`，可選搭配 `live_suite_filter`。 |
| Docker 發行路徑     | **工作：** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品執行發行路徑 Docker 區塊。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                                                                      |
| Package Acceptance  | **工作：** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 離線 Plugin 套件 fixtures、Plugin 更新、模擬 OpenAI Telegram 套件驗收，以及針對相同 tarball，從 `2026.4.23` 當天或之後每個穩定 npm 發行版進行的已發布升級存續檢查。<br />**重新執行：** `rerun_group=package`。                                         |
| QA 同等性           | **工作：** `Run QA Lab parity lane` 與 `Run QA Lab parity report`<br />**支援工作流程：** 直接工作<br />**測試：** 候選與基準代理式同等性套件，接著是同等性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                       |
| QA live Matrix      | **工作：** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接工作<br />**測試：** `qa-live-shared` 環境中的快速 live Matrix QA 設定檔。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                        |
| QA live Telegram    | **工作：** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接工作<br />**測試：** 使用 Convex CI 認證租約的 live Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                    |
| 發行驗證器          | **工作：** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 選取的重新執行群組所需的發行檢查工作。<br />**重新執行：** 在聚焦的子工作通過後重新執行。                                                                                                                                                                                                 |

## Docker 發行路徑區塊

當 `live_suite_filter` 為空時，Docker 發行路徑階段會執行這些區塊：

| 區塊                                                            | 覆蓋範圍                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker 發行路徑冒煙通道。                                   |
| `package-update-openai`                                         | OpenAI 套件安裝與更新行為。                             |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                          |
| `package-update-core`                                           | Provider-neutral 套件與更新行為。                           |
| `plugins-runtime-plugins`                                       | 執行 Plugin 行為的 Plugin runtime 通道。                     |
| `plugins-runtime-services`                                      | 以服務支援的 Plugin runtime 通道；依要求包含 OpenWebUI。 |
| `plugins-runtime-install-a` 到 `plugins-runtime-install-h` | 為平行發行驗證拆分的 Plugin 安裝/runtime 批次。   |

當只有一個 Docker 通道失敗時，請在可重用 live/E2E 工作流程上使用目標式 `docker_lanes=<lane[,lane]>`。發行成品會在可用時包含每個通道的重新執行命令，並帶有套件成品與映像重用輸入。

## 發行設定檔

`release_profile` 主要控制發佈檢查中的即時/provider 覆蓋範圍。
它不會移除一般完整 CI、Plugin 預發佈、安裝煙霧測試、套件
驗收、QA Lab，或 Docker 發佈路徑區塊。`full` 也會讓
總控流程在 `rerun_group=all` 時，針對發佈套件成品執行套件 Telegram E2E，
因此完整預發佈候選版本不會默默略過該 Telegram 套件 lane。

| Profile   | 預期用途                          | 包含的即時/provider 覆蓋範圍                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的發佈關鍵煙霧測試。   | OpenAI/core 即時路徑、OpenAI 的 Docker 即時模型、原生 Gateway core、原生 OpenAI Gateway profile、原生 OpenAI plugin，以及 Docker 即時 Gateway OpenAI。               |
| `stable`  | 預設發佈核准 profile。 | `minimum` 加上 Anthropic、Google、MiniMax、backend、原生即時測試 harness、Docker 即時 CLI backend、Docker ACP bind、Docker Codex harness，以及一個 OpenCode Go 煙霧 shard。 |
| `full`    | 廣泛的 advisory 掃描。             | `stable` 加上 advisory providers、plugin 即時 shards，以及 media 即時 shards。                                                                                                  |

## `full` 專用新增項目

這些套件會被 `stable` 略過，並由 `full` 納入：

| 區域                             | `full` 專用覆蓋範圍                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker 即時模型               | OpenCode Go、OpenRouter、xAI、Z.ai，以及 Fireworks。                              |
| Docker 即時 Gateway              | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI，以及 Z.ai 的 advisory shard。 |
| 原生 Gateway provider profiles | Fireworks、DeepSeek、完整 OpenCode Go 模型 shards、OpenRouter、xAI，以及 Z.ai。  |
| 原生 plugin 即時 shards        | Plugins A-K、L-N、O-Z other、Moonshot，以及 xAI。                                 |
| 原生 media 即時 shards         | Audio、Google music、MiniMax music，以及 video groups A-D。                       |

`stable` 包含 `native-live-src-gateway-profiles-opencode-go-smoke`；`full`
則改用更廣泛的 OpenCode Go 模型 shards。

## 聚焦重跑

使用 `rerun_group` 避免重複執行不相關的發佈 boxes：

| Handle              | 範圍                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | 所有 Full Release Validation 階段。                                   |
| `ci`                | 僅手動完整 CI 子流程。                                            |
| `plugin-prerelease` | 僅 Plugin 預發佈子流程。                                         |
| `release-checks`    | 所有 OpenClaw Release Checks 階段。                                   |
| `install-smoke`     | 從 Install Smoke 到發佈檢查。                                 |
| `cross-os`          | 跨 OS 發佈檢查。                                              |
| `live-e2e`          | Repo/即時 E2E 與 Docker 發佈路徑驗證。                     |
| `package`           | Package Acceptance。                                                   |
| `qa`                | QA parity 加上 QA 即時 lanes。                                         |
| `qa-parity`         | 僅 QA parity lanes 與報告。                                      |
| `qa-live`           | 僅 QA 即時 Matrix 與 Telegram。                                     |
| `npm-telegram`      | 已發佈套件 Telegram E2E；需要 `npm_telegram_package_spec`。 |

當某個即時套件失敗時，請搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。
有效的 filter ids 定義在可重用的即時/E2E workflow 中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

## 要保留的證據

保留 `Full Release Validation` 摘要作為發佈層級索引。它會連結
子流程 run ids，並包含最慢作業表格。若有失敗，先檢查子
workflow，然後重跑上方最小的相符 handle。

實用成品：

- 來自 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 發佈路徑成品
- Package Acceptance `package-under-test` 與 Docker acceptance 成品
- 各 OS 與套件的 Cross-OS release-check 成品
- QA parity、Matrix，以及 Telegram 成品

## Workflow 檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
