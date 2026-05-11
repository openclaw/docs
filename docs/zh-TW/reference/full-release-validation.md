---
read_when:
    - 執行或重新執行完整發行驗證
    - 比較穩定版與完整發布驗證設定檔
    - 偵錯發行驗證階段失敗
summary: 完整發行驗證階段、子工作流程、發行設定檔、重新執行控制代碼與佐證
title: 完整發布驗證
x-i18n:
    generated_at: "2026-05-11T20:35:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` 是發行驗證總入口。它是發行前證明的單一手動
進入點，但大多數工作會在子工作流程中進行，因此失敗的機器可以重新執行，
而不必重啟整個發行流程。

請從受信任的工作流程 ref 執行，通常是 `main`，並將發行分支、標籤或完整 commit SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子工作流程會使用受信任的工作流程 ref 作為測試工具，並使用輸入的
`ref` 作為受測候選版本。這能在驗證較舊的發行分支或標籤時，仍可使用新的驗證邏輯。

預設情況下，`release_profile=stable` 會執行阻擋發行的檢查路徑，並略過
完整的即時/Docker 耐久測試。傳入 `run_release_soak=true` 可在 stable 執行中包含
耐久測試路徑。`release_profile=full` 一律啟用耐久測試路徑，因此廣泛的建議設定檔不會默默降低覆蓋範圍。

套件驗收通常會從解析後的
`ref` 建置候選 tarball，包括使用 `pnpm ci:full-release` 觸發的完整 SHA 執行。在
beta 發布後，傳入 `release_package_spec=openclaw@YYYY.M.D-beta.N` 可在發行檢查、套件驗收、跨 OS、
發行路徑 Docker，以及套件 Telegram 中重用已發布的 npm 套件。只有在套件驗收應刻意證明不同套件時，才使用 `package_acceptance_package_spec`。

## 頂層階段

| 階段                 | 詳細資訊                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標解析             | **工作：** `Resolve target ref`<br />**子工作流程：** 無<br />**證明：** 解析發行分支、標籤或完整 commit SHA，並記錄所選輸入。<br />**重新執行：** 若此處失敗，重新執行總入口。                                                                                                                                                                                                 |
| Vitest 與一般 CI     | **工作：** `Run normal full CI`<br />**子工作流程：** `CI`<br />**證明：** 針對目標 ref 的手動完整 CI 圖，包括 Linux Node 路徑、 bundled Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python Skills、Windows、macOS、Control UI i18n，以及透過總入口執行的 Android。<br />**重新執行：** `rerun_group=ci`。 |
| Plugin 發行前驗證    | **工作：** `Run plugin prerelease validation`<br />**子工作流程：** `Plugin Prerelease`<br />**證明：** 僅限發行的 Plugin 靜態檢查、代理式 Plugin 覆蓋範圍、完整擴充批次分片、Plugin 發行前 Docker 路徑，以及用於相容性分流的非阻擋式 `plugin-inspector-advisory` 成品。<br />**重新執行：** `rerun_group=plugin-prerelease`。                         |
| 發行檢查             | **工作：** `Run release/live/Docker/QA validation`<br />**子工作流程：** `OpenClaw Release Checks`<br />**證明：** 安裝煙霧測試、跨 OS 套件檢查、套件驗收、QA Lab 對等性、即時 Matrix，以及即時 Telegram。使用 `run_release_soak=true` 或 `release_profile=full` 時，也會執行完整即時/E2E 套件與 Docker 發行路徑區塊。<br />**重新執行：** `rerun_group=release-checks` 或更精準的 release-checks 控制代碼。 |
| 套件成品             | **工作：** `Prepare release package artifact`<br />**子工作流程：** 無<br />**證明：** 提早建立父層 `release-package-under-test` tarball，供不需要等待 `OpenClaw Release Checks` 的套件相關檢查使用。<br />**重新執行：** 重新執行總入口，或為已發布套件的重新執行提供 `release_package_spec`。                                                                 |
| 套件 Telegram        | **工作：** `Run package Telegram E2E`<br />**子工作流程：** `NPM Telegram Beta E2E`<br />**證明：** 在 `rerun_group=all` 且 `release_profile=full` 時，提供以父層成品支援的 Telegram 套件證明；或在設定 `release_package_spec` 或 `npm_telegram_package_spec` 時，提供已發布套件的 Telegram 證明。<br />**重新執行：** 使用 `release_package_spec` 或 `npm_telegram_package_spec` 的 `rerun_group=npm-telegram`。 |
| 總入口驗證器         | **工作：** `Verify full validation`<br />**子工作流程：** 無<br />**證明：** 重新檢查已記錄的子執行結論，並附加子工作流程中最慢工作的表格。<br />**重新執行：** 在重新執行失敗的子工作流程並轉綠後，只重新執行此工作。                                                                                                                                                 |

對於 `ref=main` 和 `rerun_group=all`，較新的總入口會取代較舊的總入口。
當父層被取消時，其監控器會取消它已派發的任何子工作流程。發行分支與標籤驗證執行預設不會彼此取消。

## 發行檢查階段

`OpenClaw Release Checks` 是最大的子工作流程。它會先解析目標一次，並在套件
或 Docker 相關階段需要時，準備共用的 `release-package-under-test` 成品。

| 階段               | 詳細資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 發布目標      | **Job：** `Resolve target ref`<br />**支援 workflow：** 無<br />**測試：** 已選取的 ref、選用的預期 SHA、profile、rerun group，以及聚焦的 live suite filter。<br />**重新執行：** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| 套件成品    | **Job：** `Prepare release package artifact`<br />**支援 workflow：** 無<br />**測試：** 封裝或解析一個候選 tarball，並上傳 `release-package-under-test` 供下游面向套件的檢查使用。<br />**重新執行：** 受影響的套件、跨作業系統，或 live/E2E 群組。                                                                                                                                                                                                              |
| 安裝冒煙測試       | **Job：** `Run install smoke`<br />**支援 workflow：** `Install Smoke`<br />**測試：** 完整安裝路徑，包含重用根 Dockerfile 冒煙映像、QR 套件安裝、根與 Gateway Docker 冒煙測試、安裝程式 Docker 測試、Bun 全域安裝映像提供者冒煙測試，以及快速的內建 Plugin 安裝/解除安裝 E2E。<br />**重新執行：** `rerun_group=install-smoke`。                                                                                                                                 |
| 跨作業系統            | **Job：** `cross_os_release_checks`<br />**支援 workflow：** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**測試：** 在 Linux、Windows 和 macOS 上，針對所選提供者與模式執行全新安裝與升級路徑，使用候選 tarball 加上一個基準套件。<br />**重新執行：** `rerun_group=cross-os`。                                                                                                                                                                                  |
| 儲存庫與 live E2E   | **Job：** `Run repo/live E2E validation`<br />**支援 workflow：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 儲存庫 E2E、live 快取、OpenAI websocket 串流、原生 live 提供者與 Plugin shards，以及由 `release_profile` 選取的 Docker 支援 live 模型/backend/Gateway harness。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`，可選擇搭配 `live_suite_filter`。 |
| Docker 發布路徑 | **Job：** `Run Docker release-path validation`<br />**支援 workflow：** `OpenClaw Live And E2E Checks (Reusable)`<br />**測試：** 針對共用套件成品執行發布路徑 Docker chunks。<br />**執行：** `run_release_soak=true`、`release_profile=full`，或聚焦的 `rerun_group=live-e2e`。<br />**重新執行：** `rerun_group=live-e2e`。                                                                                                                                                      |
| 套件驗收  | **Job：** `Run package acceptance`<br />**支援 workflow：** `Package Acceptance`<br />**測試：** 離線 Plugin 套件 fixtures、Plugin 更新、mock-OpenAI Telegram 套件驗收，以及針對同一個 tarball 的已發布升級存活檢查。阻擋發布的檢查使用預設最新已發布基準；soak 檢查會擴展到 `2026.4.23` 當天或之後的每個穩定 npm 發布版本，加上已回報問題 fixtures。<br />**重新執行：** `rerun_group=package`。                          |
| QA 對等性           | **Job：** `Run QA Lab parity lane` 和 `Run QA Lab parity report`<br />**支援 workflow：** 直接 jobs<br />**測試：** 候選與基準 agentic 對等性 packs，然後是對等性報告。<br />**重新執行：** `rerun_group=qa-parity` 或 `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA live Matrix      | **Job：** `Run QA Lab live Matrix lane`<br />**支援 workflow：** 直接 job<br />**測試：** `qa-live-shared` 環境中的快速 live Matrix QA profile。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **Job：** `Run QA Lab live Telegram lane`<br />**支援 workflow：** 直接 job<br />**測試：** 使用 Convex CI 認證 leases 的 live Telegram QA。<br />**重新執行：** `rerun_group=qa-live` 或 `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| 發布驗證器    | **Job：** `Verify release checks`<br />**支援 workflow：** 無<br />**測試：** 所選 rerun group 的必要 release-check jobs。<br />**重新執行：** 聚焦的子 jobs 通過後重新執行。                                                                                                                                                                                                                                                                                                    |

## Docker 發布路徑 chunks

當 `live_suite_filter` 為空時，Docker 發布路徑階段會執行這些 chunks：

| Chunk                                                           | 覆蓋範圍                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | 核心 Docker 發布路徑冒煙測試路徑。                                                             |
| `package-update-openai`                                         | OpenAI 套件安裝/更新行為、Codex 隨選安裝，以及 Chat Completions 工具呼叫。 |
| `package-update-anthropic`                                      | Anthropic 套件安裝與更新行為。                                                    |
| `package-update-core`                                           | 提供者中立的套件與更新行為。                                                     |
| `plugins-runtime-plugins`                                       | 演練 Plugin 行為的 Plugin runtime 路徑。                                               |
| `plugins-runtime-services`                                      | 由服務支援與 live Plugin runtime 路徑；在要求時包含 OpenWebUI。                  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 為平行發布驗證而拆分的 Plugin 安裝/runtime 批次。                             |

當只有一個 Docker 路徑失敗時，請在可重用 live/E2E workflow 上使用目標式
`docker_lanes=<lane[,lane]>`。發布成品包含每個路徑的重新執行
commands，並在可用時帶有套件成品與映像重用輸入。

## 發布 profiles

`release_profile` 主要控制發布檢查內的 live/提供者廣度。
它不會移除一般完整 CI、Plugin Prerelease、安裝冒煙測試、套件
驗收或 QA Lab。對於 `stable`，詳盡的儲存庫/live E2E 與 Docker
發布路徑 chunks 是 soak 覆蓋範圍，並在 `run_release_soak=true` 時執行。
`full` 會強制啟用 soak 覆蓋範圍，也會在 `rerun_group=all` 時讓 umbrella 執行針對父發布套件成品的套件 Telegram
E2E，因此完整的預發布候選不會悄悄跳過該 Telegram 套件路徑。

| Profile   | 預期用途                      | 包含的 live/提供者覆蓋範圍                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最快的發布關鍵冒煙測試。   | OpenAI/core live 路徑、OpenAI 的 Docker live 模型、原生 Gateway core、原生 OpenAI Gateway profile、原生 OpenAI Plugin，以及 Docker live Gateway OpenAI。                     |
| `stable`  | 預設發布核准 profile。 | `minimum` 加上 Anthropic 冒煙測試、Google、MiniMax、backend、原生 live test harness、Docker live CLI backend、Docker ACP bind、Docker Codex harness，以及 OpenCode Go 冒煙 shard。 |
| `full`    | 廣泛 advisory 掃描。             | `stable` 加上 advisory providers、Plugin live shards，以及 media live shards。                                                                                                        |

## 僅 full 新增項目

這些 suites 會被 `stable` 跳過，並由 `full` 包含：

| 區域                             | 僅 full 覆蓋範圍                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live 模型               | OpenCode Go、OpenRouter、xAI、Z.ai，以及 Fireworks。                                                                          |
| Docker live Gateway              | Advisory providers 分割為 DeepSeek/Fireworks、OpenCode Go/OpenRouter，以及 xAI/Z.ai shards。                              |
| 原生 Gateway 提供者 profiles | 完整 Anthropic Opus 和 Sonnet/Haiku shards、Fireworks、DeepSeek、完整 OpenCode Go 模型 shards、OpenRouter、xAI，以及 Z.ai。 |
| 原生 Plugin live shards        | Plugins A-K、L-N、O-Z other、Moonshot，以及 xAI。                                                                             |
| 原生 media live shards         | Audio、Google music、MiniMax music，以及 video groups A-D。                                                                   |

`stable` 包含 `native-live-src-gateway-profiles-anthropic-smoke` 和
`native-live-src-gateway-profiles-opencode-go-smoke`；`full` 則使用較廣泛的
Anthropic 與 OpenCode Go 模型 shards。聚焦的重新執行仍可使用
彙總的 `native-live-src-gateway-profiles-anthropic` 或
`native-live-src-gateway-profiles-opencode-go` handles。

## 聚焦重新執行

使用 `rerun_group` 以避免重複執行無關的發布 boxes：

| 控制代碼            | 範圍                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | 所有完整發行驗證階段。                                                                          |
| `ci`                | 僅手動完整 CI 子項。                                                                            |
| `plugin-prerelease` | 僅 Plugin 預發行子項。                                                                          |
| `release-checks`    | 所有 OpenClaw 發行檢查階段。                                                                    |
| `install-smoke`     | 從安裝煙霧測試到發行檢查。                                                                      |
| `cross-os`          | 跨 OS 發行檢查。                                                                                |
| `live-e2e`          | 儲存庫/live E2E 與 Docker 發行路徑驗證。                                                        |
| `package`           | 套件驗收。                                                                                      |
| `qa`                | QA 同等性加上 QA live 通道。                                                                    |
| `qa-parity`         | 僅 QA 同等性通道與報告。                                                                        |
| `qa-live`           | 僅 QA live Matrix 與 Telegram。                                                                 |
| `npm-telegram`      | 已發布套件的 Telegram E2E；需要 `release_package_spec` 或 `npm_telegram_package_spec`。         |

當某個 live 套件失敗時，請使用 `live_suite_filter` 搭配 `rerun_group=live-e2e`。
有效的篩選器 ID 定義在可重用的 live/E2E 工作流程中，包括
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`，以及
`live-codex-harness-docker`。

`live-gateway-advisory-docker` 控制代碼是其三個提供者分片的彙總重跑控制代碼，
因此仍會展開到所有 advisory Docker Gateway 作業。

當某個跨 OS 通道失敗時，請使用 `cross_os_suite_filter` 搭配 `rerun_group=cross-os`。
篩選器接受 OS ID、套件 ID，或 OS/套件配對，例如
`windows/packaged-upgrade`、`windows` 或 `packaged-fresh`。跨 OS
摘要包含套件化升級通道的各階段時間，而長時間執行的命令會列印 Heartbeat 行，
讓卡住的 Windows 更新能在作業逾時前被看見。

QA 發行檢查通道屬於 advisory。僅 QA 失敗會回報為警告，
且不會阻擋發行檢查驗證器；當你需要新的 QA 證據時，請重跑 `rerun_group=qa`、
`qa-parity` 或 `qa-live`。

## 要保留的證據

保留 `Full Release Validation` 摘要作為發行層級索引。它會連結
子執行 ID，並包含最慢作業表。若發生失敗，請先檢查子工作流程，
再重跑上方最小的相符控制代碼。

實用成品：

- 來自完整發行驗證父項與 `OpenClaw Release Checks` 的 `release-package-under-test`
- `.artifacts/docker-tests/` 下的 Docker 發行路徑成品
- 套件驗收 `package-under-test` 與 Docker 驗收成品
- 每個 OS 和套件的跨 OS 發行檢查成品
- QA 同等性、Matrix 與 Telegram 成品

## 工作流程檔案

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
