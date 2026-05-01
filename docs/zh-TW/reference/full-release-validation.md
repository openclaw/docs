---
read_when:
    - 執行或重新執行完整發布驗證
    - 比較穩定版與完整發行驗證設定檔
    - 排解發行驗證階段的失敗
summary: 完整發布驗證階段、子工作流程、發布設定檔、重新執行控制代碼與佐證資料
title: 完整版本發布驗證
x-i18n:
    generated_at: "2026-05-01T02:45:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發行驗證總入口。它是發行前證明的單一手動
進入點，但大多數工作會在子工作流程中執行，因此失敗的執行環境可重新執行，
而不必重新啟動整個發行流程。

請從受信任的工作流程參照執行，通常是 `main`，並將發行分支、
標籤或完整提交 SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流程會使用受信任的工作流程參照作為測試框架，並使用輸入的
`ref` 作為受測候選版本。這可在驗證較舊的發行分支或標籤時，
仍使用新的驗證邏輯。

## 頂層階段

| 階段                  | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析              | **Job:** `Resolve target ref`<br />**子工作流程：** 無<br />**證明：** 解析發行分支、標籤或完整提交 SHA，並記錄選取的輸入。<br />**重新執行：** 如果此項失敗，重新執行總流程。                                                                                                                                                   |
| Vitest 和一般 CI      | **Job:** `Run normal full CI`<br />**子工作流程：** `CI`<br />**證明：** 針對目標參照手動執行完整 CI 圖，包含 Linux Node 路徑、內建 Plugin 分片、通道契約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python Skills、Windows、macOS、Control UI i18n，以及透過總流程執行 Android。<br />**重新執行：** `rerun_group=ci` |
| Plugin 預發行         | **Job:** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**證明：** 僅發行使用的 Plugin 靜態檢查、代理式 Plugin 覆蓋率、完整 extension 批次分片，以及 Plugin 預發行 Docker 路徑。<br />**重新執行：** `rerun_group=plugin-prerelease`                                                                 |
| 發行檢查              | **Job:** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**證明：** 安裝煙霧測試、跨作業系統套件檢查、live/E2E 套件、Docker 發行路徑區塊、套件驗收、QA Lab 同等性、live Matrix，以及 live Telegram。<br />**重新執行：** `rerun_group=release-checks` 或較窄的發行檢查控制代碼。           |
| 發布後 Telegram       | **Job:** `Run post-publish Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**證明：** 設定 `npm_telegram_package_spec` 時，執行選用的已發布套件 Telegram 證明。<br />**重新執行：** `rerun_group=npm-telegram`                                                                                                      |
| 總流程驗證器          | **Job:** `Verify full validation`<br />**子工作流程：** 無<br />**證明：** 重新檢查已記錄的子執行結論，並附加來自子工作流程的最慢工作表格。<br />**重新執行：** 在重新執行失敗子項並轉綠後，只重新執行此工作。                                                                                                                     |

對於 `ref=main` 和 `rerun_group=all`，較新的總流程會取代較舊的總流程。
當父流程被取消時，它的監控器會取消已分派的任何子工作流程。發行分支
和標籤驗證執行預設不會彼此取消。

## 發行檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它會解析一次目標，
並在套件或 Docker 面向的階段需要時，準備共用的
`release-package-under-test` 成品。

| 階段                | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發行目標            | **Job:** `Resolve target ref`<br />**支援工作流程：** 無<br />**測試：** 選取的參照、選用的預期 SHA、設定檔、重新執行群組，以及聚焦的 live 套件篩選器。<br />**重新執行：** `rerun_group=release-checks`                                                                                                                           |
| 套件成品            | **Job:** `Prepare release package artifact`<br />**支援工作流程：** 無<br />**測試：** 打包或解析一個候選 tarball，並上傳 `release-package-under-test` 供下游套件面向檢查使用。<br />**重新執行：** 受影響的套件、跨作業系統或 live/E2E 群組。                                                                                      |
| 安裝煙霧測試        | **Job:** `Run install smoke`<br />**支援工作流程：** `Install Smoke`<br />**測試：** 使用根 Dockerfile 煙霧測試映像重用的完整安裝路徑、QR 套件安裝、根與 Gateway Docker 煙霧測試、安裝程式 Docker 測試、Bun 全域安裝 image-provider 煙霧測試，以及快速內建 Plugin Docker E2E。<br />**重新執行：** `rerun_group=install-smoke` |
| 跨作業系統          | **Job:** `cross_os_release_checks`<br />**支援工作流程：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 在 Linux、Windows 和 macOS 上，針對選取的提供者和模式執行全新安裝與升級路徑，使用候選 tarball 加上基準套件。<br />**重新執行：** `rerun_group=cross-os`                                                     |
| Repo 和 live E2E    | **Job:** `Run repo/live E2E validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** repository E2E、live cache、OpenAI websocket 串流、原生 live 提供者與 Plugin 分片，以及由 `release_profile` 選取的 Docker 支援 live 模型/backend/Gateway 測試框架。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。 |
| Docker 發行路徑     | **Job:** `Run Docker release-path validation`<br />**支援工作流程：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品執行發行路徑 Docker 區塊。<br />**重新執行：** `rerun_group=live-e2e`                                                                                                                |
| 套件驗收            | **Job:** `Run package acceptance`<br />**支援工作流程：** `Package Acceptance`<br />**測試：** 成品原生的內建通道相依性相容性、離線 Plugin 套件 fixtures，以及針對相同 tarball 的 mock-OpenAI Telegram 套件驗收。<br />**重新執行：** `rerun_group=package`                                                                         |
| QA 同等性           | **Job:** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支援工作流程：** 直接工作<br />**測試：** 候選版本與基準代理式同等性套件，接著執行同等性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`                                                                                              |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**支援工作流程：** 直接工作<br />**測試：** `qa-live-shared` 環境中的快速 live Matrix QA 設定檔。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`                                                                                                                          |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**支援工作流程：** 直接工作<br />**測試：** 使用 Convex CI 認證租約的 live Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`                                                                                                                               |
| 發行驗證器          | **Job:** `Verify release checks`<br />**支援工作流程：** 無<br />**測試：** 選取的重新執行群組所需的發行檢查工作。<br />**重新執行：** 在聚焦的子工作通過後重新執行。                                                                                                                                                                |

## Docker 發行路徑區塊

當 `live_suite_filter` 為空時，Docker 發行路徑階段會執行這些區塊：

| 區塊                                                                                        | 覆蓋範圍                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | 核心 Docker 發行路徑煙霧測試路徑。                                      |
| `package-update-openai`                                                                     | OpenAI 套件安裝與更新行為。                                             |
| `package-update-anthropic`                                                                  | Anthropic 套件安裝與更新行為。                                          |
| `package-update-core`                                                                       | 提供者中立的套件與更新行為。                                            |
| `plugins-runtime-plugins`                                                                   | 演練 Plugin 行為的 Plugin runtime 路徑。                                |
| `plugins-runtime-services`                                                                  | 服務支援的 Plugin runtime 路徑；要求時包含 OpenWebUI。                  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | 為平行發行驗證拆分的 Plugin 安裝/runtime 批次。                         |
| `bundled-channels-core`                                                                     | 內建通道 Docker 行為。                                                  |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | 內建通道更新行為。                                                      |
| `bundled-channels-contracts`                                                                | Docker 發行路徑中的內建通道契約檢查。                                   |

當只有一個 Docker lane 失敗時，請在可重用的即時/E2E workflow 上使用目標式的 `docker_lanes=<lane[,lane]>`。release 成品會在可用時包含每個 lane 的重新執行命令，並附上 package 成品與映像重用輸入。

## release 設定檔

`release_profile` 只控制 release 檢查內的即時/provider 覆蓋範圍。它不會移除一般的完整 CI、Plugin Prerelease、安裝 smoke、package acceptance、QA Lab，或 Docker release-path 區塊。

| 設定檔    | 預期用途                         | 包含的即時/provider 覆蓋範圍                                                                                                                                                 |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的 release 關鍵 smoke。      | OpenAI/core 即時路徑、OpenAI 的 Docker 即時模型、原生 Gateway core、原生 OpenAI Gateway 設定檔、原生 OpenAI Plugin，以及 Docker 即時 Gateway OpenAI。                       |
| `stable`  | 預設 release 核准設定檔。        | `minimum` 加上 Anthropic、Google、MiniMax、backend、原生即時測試 harness、Docker 即時 CLI backend、Docker ACP bind、Docker Codex harness，以及一個 OpenCode Go smoke shard。 |
| `full`    | 廣泛的 advisory 掃描。           | `stable` 加上 advisory providers、Plugin 即時 shards，以及媒體即時 shards。                                                                                                  |

## 僅 full 新增項目

這些套件會被 `stable` 略過，並由 `full` 包含：

| 區域                             | 僅 full 覆蓋範圍                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Docker 即時模型                  | OpenCode Go、OpenRouter、xAI、Z.ai，以及 Fireworks。                             |
| Docker 即時 Gateway              | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI，以及 Z.ai 的 advisory shard。 |
| 原生 Gateway provider 設定檔     | Fireworks、DeepSeek、完整 OpenCode Go 模型 shards、OpenRouter、xAI，以及 Z.ai。  |
| 原生 Plugin 即時 shards          | Plugins A-K、L-N、O-Z 其他、Moonshot，以及 xAI。                                 |
| 原生媒體即時 shards              | 音訊、Google 音樂、MiniMax 音樂，以及影片群組 A-D。                              |

`stable` 包含 `native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則改用更廣泛的 OpenCode Go 模型 shards。

## 聚焦重新執行

使用 `rerun_group` 以避免重複執行不相關的 release boxes：

| 控制代碼            | 範圍                                              |
| ------------------- | ------------------------------------------------- |
| `all`               | 所有 Full Release Validation 階段。               |
| `ci`                | 僅手動完整 CI 子項。                              |
| `plugin-prerelease` | 僅 Plugin Prerelease 子項。                       |
| `release-checks`    | 所有 OpenClaw Release Checks 階段。               |
| `install-smoke`     | 安裝 Smoke 到 release checks。                    |
| `cross-os`          | Cross-OS release checks。                         |
| `live-e2e`          | repo/即時 E2E 與 Docker release-path 驗證。       |
| `package`           | Package Acceptance。                              |
| `qa`                | QA parity 加上 QA 即時 lanes。                    |
| `qa-parity`         | 僅 QA parity lanes 與報告。                       |
| `qa-live`           | 僅 QA 即時 Matrix 與 Telegram。                   |
| `npm-telegram`      | 僅選用的發布後 Telegram E2E。                     |

當一個即時套件失敗時，搭配 `rerun_group=live-e2e` 使用 `live_suite_filter`。有效的 filter id 定義於可重用的即時/E2E workflow，包括 `docker-live-models`、`live-gateway-docker`、`live-gateway-anthropic-docker`、`live-gateway-google-docker`、`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、`live-cli-backend-docker`、`live-acp-bind-docker`，以及 `live-codex-harness-docker`。

## 要保留的證據

保留 `Full Release Validation` 摘要作為 release 層級索引。它會連結子執行 id，並包含最慢 job 表格。若發生失敗，請先檢查子 workflow，然後重新執行上方最小的相符 handle。

實用成品：

- `OpenClaw Release Checks` 中的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker release-path 成品
- Package Acceptance `package-under-test` 與 Docker acceptance 成品
- 每個 OS 與套件的 Cross-OS release-check 成品
- QA parity、Matrix，以及 Telegram 成品

## Workflow 檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
