---
read_when:
    - 正在尋找公開發布頻道定義
    - 執行發布驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證盒、版本命名與節奏
title: 發行政策
x-i18n:
    generated_at: "2026-07-05T11:39:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed09e292495a0597fa72d32ad0a17428cf38dcb2d2e11dd77ff60b773a73bf35
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前公開三個面向使用者的更新通道：

- stable：現有已晉升的發行通道，在獨立的命令列介面/通道里程碑完成前，仍會透過 npm `latest` 解析
- beta：發布到 npm `beta` 的預發行標籤
- dev：`main` 的移動頭端

另外，發行操作人員可以將落後的已完成月份核心
套件發布到 npm `extended-stable`，從修補版本 `33` 開始。本月份
一般最終線會繼續使用 npm `latest`；這個操作人員端的發布
分流本身不會改變命令列介面更新通道解析。

Tideclaw alpha 建置是獨立的內部預發行軌道（npm dist-tag `alpha`），涵蓋於 [NPM 工作流程輸入](#npm-workflow-inputs)與[發行測試盒](#release-test-boxes)。

## 版本命名

- 每月 npm extended-stable 發行版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`，git 標籤 `vYYYY.M.PATCH`
- 每日/一般最終發行版本：`YYYY.M.PATCH`，其中 `PATCH < 33`，git 標籤 `vYYYY.M.PATCH`
- 一般後備修正發行版本：`YYYY.M.PATCH-N`，git 標籤 `vYYYY.M.PATCH-N`
- Beta 預發行版本：`YYYY.M.PATCH-beta.N`，git 標籤 `vYYYY.M.PATCH-beta.N`
- Alpha 預發行版本：`YYYY.M.PATCH-alpha.N`，git 標籤 `vYYYY.M.PATCH-alpha.N`
- 月份或修補版本一律不要補零
- `PATCH` 是依序遞增的每月發行列車編號，不是日曆日。一般最終與 beta 發行會推進目前列車；僅 alpha 的標籤永遠不會消耗或推進 beta/一般修補版本號，因此在選擇 beta 或一般列車時，請忽略具有較高修補版本號的舊版僅 alpha 標籤。
- Alpha/nightly 建置使用下一個尚未發行的修補列車，重複建置時只遞增 `alpha.N`。一旦該修補版本已有 beta，新的 alpha 建置會移至下一個修補版本。
- npm 版本是不可變的：絕不要刪除、重新發布或重複使用已發布標籤。請改切下一個預發行編號或下一個每月修補版本。
- `latest` 會繼續跟隨目前的一般/每日 npm 線；`beta` 是目前的 beta 安裝目標
- `extended-stable` 表示受支援的落後月份 npm 套件，從修補版本 `33` 開始；修補版本 `34` 及之後是在該每月線上的維護發行
- 一般最終與一般修正發行預設會發布到 npm `beta`；發行操作人員可以明確指定 `latest`，或稍後晉升已審核的 beta 建置
- 專用的每月 extended-stable 路徑只發布核心 npm 套件。它不發布外掛、macOS 或 Windows 成品、GitHub Release、私有儲存庫 dist-tag、Docker 映像、行動裝置成品或網站下載項目。
- 每個一般最終發行都會同時交付 npm 套件、macOS app，以及已簽署的 Windows Hub 安裝程式。Beta 發行通常會先驗證並發布 npm/套件路徑，原生 app 的建置/簽署/公證/晉升則保留給一般最終發行，除非明確要求。

## 發行節奏

- 發行採 beta 優先；stable 只會在最新 beta 驗證完成後跟進
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.PATCH` 分支切發行，因此發行驗證與修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切下一個 `-beta.N` 標籤，而不是刪除或重新建立舊標籤
- 詳細的發行程序、核准、憑證與復原備註僅限維護者

## 每月僅 npm extended-stable 發布

這是下方一般發行程序的專用例外。針對已完成的月份 `YYYY.M`，建立 `extended-stable/YYYY.M.33`；從同一分支發布
`vYYYY.M.33` 與後續維護修補版本。發行
標籤、分支頂端、checkout、套件版本、npm 預檢，以及 Full Release
Validation 執行都必須指向同一個 commit。受保護的 `main` 必須
已包含嚴格晚於該日曆月份、且修補版本低於
`33` 的最終版本；在 `main` 推進超過一個
月份後，維護修補版本仍符合資格。

從精確的 extended-stable 分支執行 npm 預檢與 Full Release Validation，然後儲存兩個執行 ID：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` 是現有的驗證深度設定檔；它與 npm `extended-stable` dist-tag 分開，並且有意
保持不變。

兩個執行都成功且 npm 發行環境就緒後，晉升
精確的預檢 tarball。修補版本 `P` 必須為 `33` 或更高：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

對於刻意無法滿足每月 `.33` 或受保護 `main` 月份政策的 fork 或非生產演練，請將
`-f bypass_extended_stable_guard=true` 加到 npm 預檢與發布
dispatch。預設值為 `false`。只有在
`npm_dist_tag=extended-stable` 時才接受此繞過，並會記錄在工作流程摘要中。它
不會繞過標準的 `extended-stable/YYYY.M.33` 工作流程 ref、
分支頂端/標籤/checkout 相等、最終標籤語法、套件/標籤版本
相等、引用執行與 manifest 身分、tarball 來源證明、
環境核准、registry 回讀或選擇器修復證據。

發布工作流程會驗證引用的執行身分、已準備
tarball 摘要，以及兩個 npm registry 選擇器。工作流程成功後，請獨立確認
結果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

兩個命令都必須回傳 `YYYY.M.P`。如果發布成功但選擇器
回讀失敗，請不要重新發布不可變的套件版本。使用
失敗工作流程 always-run 摘要中列印的單一 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復命令，然後重複兩個
獨立回讀。回復到先前選擇器是另一個操作人員
決策，不是回讀修復路徑。

下方的一般檢查清單仍負責 beta、`latest`、GitHub Release、
外掛、macOS、Windows 與其他平台發布。不要為這個僅 npm extended-stable 路徑執行那些
步驟。

## 一般發行操作人員檢查清單

此檢查清單是發行流程的公開形狀。私有憑證、簽署、公證、dist-tag 復原與緊急回復細節保留在僅限維護者的發行 runbook 中。

1. 從目前 `main` 開始：拉取最新內容，確認目標 commit 已推送，並確認 `main` CI 足夠綠燈，可以從其建立分支。
2. 從自上一個可到達發行標籤以來已合併的 PR 與所有直接 commit 產生頂部 `CHANGELOG.md` 區段。保持條目面向使用者，去除重疊的 PR/直接 commit 條目，commit、push，並在建立分支前再 rebase/pull 一次。
3. 檢查 `src/plugins/compat/registry.ts` 與 `src/commands/doctor/shared/deprecation-compat.ts` 中的發行相容性記錄。只有在升級路徑仍受涵蓋時才移除過期相容性，否則記錄為何刻意保留。
4. 從目前 `main` 建立 `release/YYYY.M.PATCH`。不要直接在 `main` 上執行一般發行工作。
5. 為標籤提升每個必要位置的版本，然後執行 `pnpm release:prep`。它會依序重新整理外掛版本、npm shrinkwrap、外掛清單、基礎設定結構描述、已內建通道設定中繼資料、設定文件基準、外掛 SDK 匯出，以及外掛 SDK API 基準。在加標籤前 commit 任何產生的漂移，然後執行本機確定性預檢：`pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在前，完整 40 字元的發行分支 SHA 可用於僅驗證預檢。預檢會為精確 checkout 的依賴圖產生依賴發行證據，並儲存在 npm 預檢成品中。儲存成功的 `preflight_run_id`。
7. 使用發行分支、標籤或完整 commit SHA 的 `Full Release Validation` 啟動所有預發行測試。這是四個大型發行測試盒的單一手動進入點：Vitest、Docker、QA Lab 與 Package。儲存 `full_release_validation_run_id`；它是 `OpenClaw NPM Release` 與 `OpenClaw Release Publish` 兩者的必要輸入。
8. 如果驗證失敗，請在發行分支上修正，並重新執行能證明修正的最小失敗檔案、lane、工作流程 job、套件設定檔、提供者或模型 allowlist。只有當變更表面使先前證據過期時，才重新執行完整 umbrella。
9. 對於已加標籤的 beta 候選版本，請從相符的 `release/YYYY.M.PATCH` 分支執行 `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。對於 stable，也請傳入必要的 Windows 來源發行：`pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。此輔助工具會執行本機產生式發行檢查、dispatch 或驗證完整發行驗證與 npm 預檢證據、針對精確已準備 tarball 加上 Telegram 套件證明執行 Parallels fresh/update 證明、記錄外掛 npm 與 ClawHub 計畫，並且只在證據套件綠燈後列印精確的 `OpenClaw Release Publish` 命令。

   `OpenClaw Release Publish` 會將選定或所有可發布的外掛套件 dispatch 到 npm，並將同一組套件平行發布到 ClawHub，然後在外掛 npm 發布成功後，使用相符的 dist-tag 晉升已準備的 OpenClaw npm 預檢成品。OpenClaw npm 發布子項成功後，它會從完整相符的 `CHANGELOG.md` 區段建立或更新相符的 GitHub release/prerelease 頁面：發布到 npm `latest` 的 stable 發行會成為 GitHub latest release，保留在 npm `beta` 上的 stable 維護發行則會以 GitHub `latest=false` 建立。工作流程也會將預檢依賴證據、完整驗證 manifest，以及發布後 registry 驗證證據上傳到 GitHub release，以供發行後事件回應使用。它會立即列印子執行 ID，自動核准工作流程 token 允許核准的發行環境 gate，以 log tail 摘要失敗的子 job，在 OpenClaw npm 發布成功後立即完成 GitHub release 與依賴證據收尾，在 OpenClaw npm 正在發布時等待 ClawHub，然後執行 `pnpm release:verify-beta`，並上傳 GitHub release、npm 套件、選定外掛 npm 套件、選定 ClawHub 套件、子工作流程執行 ID，以及選用 NPM Telegram 執行 ID 的發布後證據。ClawHub 路徑會重試暫時性的命令列介面依賴安裝失敗，即使某個 preview cell flakes 也會發布 preview 通過的外掛，並以每個預期外掛版本的 registry 驗證結束，讓部分發布保持可見且可重試。

   然後針對已發布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 套件執行發布後套件驗收。如果已推送或已發布的預發行需要修正，請切下一個相符的預發行編號；絕不要刪除或改寫舊版本。

10. 對於穩定版，只有在已審核的 beta 或發行候選版具備必要的驗證證據後才繼續。穩定版 npm 發布也透過 `OpenClaw Release Publish` 進行，並透過 `preflight_run_id` 重用成功的預檢成品。穩定版 macOS 發行就緒也要求 `main` 上有已封裝的 `.zip`、`.dmg`、`.dSYM.zip`，以及更新後的 `appcast.xml`；macOS 發布工作流程會在發行資產驗證後，自動將已簽署的 appcast 發布到公開 `main`，或在分支保護阻擋直接推送時開啟/更新 appcast PR。穩定版 Windows Hub 就緒要求 OpenClaw GitHub 發行版上有已簽署的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 和 `OpenClawCompanion-SHA256SUMS.txt` 資產。將確切已簽署的 `openclaw/openclaw-windows-node` 發行標籤作為 `windows_node_tag` 傳入，並將其候選版已核准的安裝程式摘要對照表作為 `windows_node_installer_digests` 傳入；`OpenClaw Release Publish` 會保留發行草稿、派發 `Windows Node Release`，並在發布前驗證全部三個資產。
11. 發布後，執行 npm 發布後驗證器；需要發布後頻道證據時，執行選用的獨立已發布 npm Telegram E2E；視需要進行 dist-tag 升級；驗證產生的 GitHub 發行頁面；執行發行公告步驟；然後完成[穩定版 main 收尾](#stable-main-closeout)，再將穩定版發行視為完成。

## 穩定版 main 收尾

穩定版發布在 `main` 承載實際已交付發行狀態前不算完成。

1. 從最新的全新 `main` 開始。對照它稽核 `release/YYYY.M.PATCH`，並將 `main` 缺少的實際修正向前移植。不要盲目地把僅限發行分支的相容性、測試或驗證配接器合併到較新的 `main`。
2. 將 `main` 設為已交付的穩定版版本，而不是推測性的下一個版本線。根版本變更後執行 `pnpm release:prep`，再執行 `pnpm deps:shrinkwrap:generate`。
3. 讓 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 區段與已標記的發行分支完全一致。若 mac 發行發布了穩定版 `appcast.xml` 更新，請一併包含。
4. 在操作員明確啟動該發行版本線前，不要將 `YYYY.M.PATCH+1`、beta 版本或空的未來 changelog 區段加入 `main`。
5. 執行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送後，在將穩定版發行稱為完成前，驗證 `origin/main` 包含已交付版本與 changelog。
6. 每次私有回復演練後，保持儲存庫變數 `RELEASE_ROLLBACK_DRILL_ID` 和 `RELEASE_ROLLBACK_DRILL_DATE` 為最新。

`OpenClaw Stable Main Closeout` 會從穩定版發布後承載已交付版本、changelog 和 appcast 的 `main` 推送開始。它讀取不可變的發布後證據，將已交付標籤綁定到其 Full Release Validation 和 Publish 執行，然後驗證穩定版 main 狀態、發行版、必要的穩定版長時間驗證，以及阻擋性的效能證據。它會將不可變的收尾清單與校驗和附加到 GitHub 發行版。自動推送觸發器會略過早於不可變發布後證據的舊版發行，且絕不將該略過視為已完成收尾。

完整收尾需要同時具備資產與相符的校驗和。部分清單會重播其記錄的 `main` SHA 與回復演練，以重新產生相同位元組，然後附加缺少的校驗和；無效配對，或只有校驗和而沒有清單，仍會阻擋。沒有回復演練儲存庫變數的推送觸發執行會略過且不完成收尾；缺少演練記錄或記錄超過 90 天，仍會阻擋有證據支撐的手動收尾。私有復原命令保留在僅限維護者的 runbook 中。手動派發僅用於修復或重播有證據支撐的穩定版收尾。

舊版回退修正標籤只有在修正標籤解析到與基礎穩定版標籤相同的來源提交時，才可重用基礎套件證據。來源不同的修正必須發布並驗證自己的套件證據。

## 發行預檢

- 在發行預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 閘門之外仍受涵蓋。
- 在發行預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機閘門之外維持綠燈。
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發行成品和 Control UI bundle 存在，以供封裝驗證步驟使用。
- 在根版本遞增後且標記前執行 `pnpm release:prep`。它會執行所有在版本/設定/API 變更後常見漂移的確定性發行產生器：外掛版本、npm shrinkwrap、外掛清冊、基礎設定結構描述、內建頻道設定中繼資料、設定文件基準、外掛 SDK 匯出，以及外掛 SDK API 基準。`pnpm release:check` 會以檢查模式重新執行這些防護（外加外掛 SDK 介面預算檢查），並在執行套件發行檢查前，一次回報所有產生內容漂移失敗。
- 外掛版本同步預設會將可發布的 `@openclaw/ai` 執行階段套件、官方外掛套件版本，以及既有 `openclaw.compat.pluginApi` 下限更新為 OpenClaw 發行版本。請將該欄位視為外掛 SDK/執行階段 API 下限，而不只是套件版本的副本：對於刻意維持與較舊 OpenClaw 主機相容的純外掛發行，請將下限保留在最舊支援的主機 API，並在外掛發行證據中記錄該選擇。
- 在發行核准前執行手動 `Full Release Validation` 工作流程，從單一入口點啟動所有發行前測試箱。它接受分支、標籤或完整提交 SHA，派發手動 `CI`，並為安裝煙霧測試、套件驗收、跨 OS 套件檢查、QA Lab 同等性、Matrix 和 Telegram 路徑派發 `OpenClaw Release Checks`。穩定版和完整執行一律包含完整的即時/E2E 與 Docker 發行路徑長時間驗證；`run_release_soak=true` 保留給明確的 beta 長時間驗證。Package Acceptance 會在候選版驗證期間提供標準套件 Telegram E2E，避免第二個並行即時輪詢器。

  發布 beta 後提供 `release_package_spec`，以便在發行檢查、Package Acceptance 和套件 Telegram E2E 中重用已交付的 npm 套件，而不重建發行 tarball。只有當 Telegram 應使用與其餘發行驗證不同的已發布套件時，才提供 `npm_telegram_package_spec`。當 Package Acceptance 應使用與發行套件規格不同的已發布套件時，提供 `package_acceptance_package_spec`。當發行證據報告應證明驗證符合已發布的 npm 套件、但不強制執行 Telegram E2E 時，提供 `evidence_package_spec`。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- 當你想在發行工作持續進行時，為套件候選版取得旁路證據，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或確切發行版本使用 `source=npm`；使用 `source=ref` 以目前 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支/標籤/SHA；對具必要 SHA-256 與嚴格公開 URL 政策的公開 HTTPS tarball 使用 `source=url`；對使用必要 `trusted_source_id` 與 SHA-256 的具名受信來源政策使用 `source=trusted-url`；或對另一個 GitHub Actions 執行上傳的 tarball 使用 `source=artifact`。

  工作流程會將候選版解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發行排程器，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一 tarball 執行 Telegram QA。當選取的 Docker 路徑包含 `published-upgrade-survivor` 時，套件成品就是候選版，而 `published_upgrade_survivor_baseline` 會選取已發布的基準。`update-restart-auth` 會將候選套件同時作為已安裝的命令列介面和 package-under-test，藉此演練候選版更新命令的受管重啟路徑。

  範例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常見設定檔：
  - `smoke`：安裝/頻道/代理、閘道網路，以及設定重新載入路徑
  - `package`：不含 OpenWebUI 或即時 ClawHub 的成品原生套件/更新/重啟/外掛路徑
  - `product`：套件設定檔加上 MCP 頻道、cron/子代理清理、OpenAI 網頁搜尋和 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發行路徑區塊
  - `custom`：針對聚焦重跑的確切 `docker_lanes` 選擇

- 當你只需要發行候選版的確定性一般 CI 覆蓋時，直接執行手動 `CI` 工作流程。手動 CI 派發會略過變更範圍判定，並強制執行 Linux 節點分片、內建外掛分片、外掛與頻道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、建置成品煙霧檢查、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n 路徑。獨立手動 CI 只有在以 `include_android=true` 派發時才執行 Android；`Full Release Validation` 會為其 CI 子流程傳入該輸入。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 驗證發布遙測時，執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器執行 QA-lab，並驗證追蹤、指標與日誌匯出，以及有界追蹤屬性和內容/識別碼遮蔽，而不需要 Opik、Langfuse 或其他外部收集器。
- 驗證收集器相容性時，執行 `pnpm qa:otel:collector-smoke`。它會先將相同的 QA-lab OTLP 匯出路由到真正的 OpenTelemetry Collector Docker 容器，再進行本機接收器斷言。
- 驗證受保護的 Prometheus 抓取時，執行 `pnpm qa:prometheus:smoke`。它會執行 QA-lab、拒絕未驗證的抓取，並驗證發布關鍵的指標系列不含提示內容、原始識別碼、驗證權杖和本機路徑。
- 執行 `pnpm qa:observability:smoke`，連續跑來源 checkout 的 OpenTelemetry 與 Prometheus smoke 路徑。
- 每次標記發布前，執行 `pnpm release:check`。
- `OpenClaw NPM Release` 預檢會在封裝 npm tarball 前產生依賴發布證據。npm advisory 漏洞閘門會阻擋發布。遞移 manifest 風險、依賴所有權/安裝表面，以及依賴變更報告僅作為發布證據。依賴變更報告會比較發布候選版本與上一個可到達的發布標籤。預檢會將依賴證據上傳為 `openclaw-release-dependency-evidence-<tag>`，也會把它嵌入準備好的 npm 預檢成品中的 `dependency-evidence/`。真正的發布路徑會重用該預檢成品，然後把相同證據作為 `openclaw-<version>-dependency-evidence.zip` 附加到 GitHub release。
- 標籤存在後，執行 `OpenClaw Release Publish` 來進行會變更狀態的發布序列。從 `release/YYYY.M.PATCH` 派送它（或在發布 main 可到達的標籤時從 `main` 派送），傳入發布標籤、成功的 OpenClaw npm `preflight_run_id`，以及成功的 `full_release_validation_run_id`，並保留預設外掛發布範圍 `all-publishable`，除非你刻意執行聚焦修復。此 workflow 會序列化外掛 npm 發布、外掛 ClawHub 發布與 OpenClaw npm 發布，確保核心套件不會在其外部化外掛之前發布。
- 穩定版 `OpenClaw Release Publish` 需要在對應的非預發布 `openclaw/openclaw-windows-node` release 存在後，提供精確的 `windows_node_tag`，以及候選核准的 `windows_node_installer_digests` map。在派送任何發布子 workflow 前，它會驗證來源 release 已發布、非預發布、包含所需的 x64/ARM64 安裝程式，且仍符合該已核准的 map。接著它會在 OpenClaw release 仍為草稿時派送 `Windows Node Release`，並原封不動攜帶釘選的安裝程式 digest map。子 workflow 會從該精確標籤下載已簽署的 Windows Hub 安裝程式，將它們與釘選 digest 比對，於 Windows 執行器上驗證其 Authenticode 簽章使用預期的 OpenClaw Foundation 簽署者，寫入 SHA-256 manifest，並將安裝程式與 manifest 上傳到標準 OpenClaw GitHub release，然後重新下載已提升的資產並驗證 manifest 成員資格與雜湊。父 workflow 會在發布前驗證目前的 x64、ARM64 與 checksum 資產合約。直接復原會先拒絕非預期的 `OpenClawCompanion-*` 資產名稱，再用釘選的來源位元組取代預期合約資產。

  只有復原時才手動派送 `Windows Node Release`，且一律傳入精確標籤，絕不可用 `latest`，並附上來自已核准來源 release 的明確 `expected_installer_digests` JSON map。網站下載連結應指向目前穩定版 release 的精確 OpenClaw release 資產 URL，或只在確認 GitHub 的 latest 重新導向指向同一個 release 後，才使用 `releases/latest/download/...`；不要只連到 companion repo 的 release 頁面。

- 發布檢查現在於獨立的手動 workflow 中執行：`OpenClaw Release Checks`。它也會在發布核准前執行 QA Lab mock parity 路徑，以及快速 live Matrix profile 與 Telegram QA 路徑。live 路徑使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI 憑證租約。當你想並行取得完整 Matrix transport、media 與 E2EE inventory 時，請以 `matrix_profile=all` 和 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- 跨 OS 安裝與升級 runtime 驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，兩者會直接呼叫可重用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。這種拆分是刻意的：讓真正的 npm 發布路徑保持短、確定且聚焦於成品，而較慢的 live 檢查保留在自己的路徑中，避免拖慢或阻擋發布。
- 帶有秘密的發布檢查應透過 `Full Release Validation` 派送，或從 `main`/release workflow ref 派送，讓 workflow 邏輯與秘密維持受控。
- `OpenClaw Release Checks` 接受分支、標籤或完整 commit SHA，只要解析後的 commit 可從 OpenClaw 分支或發布標籤到達。
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元 workflow 分支 commit SHA，不需要已推送的標籤。該 SHA 路徑僅供驗證，不能提升為真正發布。在 SHA 模式中，workflow 只為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發布標籤。
- 兩個 workflow 都將真正的發布與提升路徑保留在 GitHub 託管執行器上，而不會變更狀態的驗證路徑可使用較大的 Blacksmith Linux 執行器。
- 該 workflow 會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets。
- npm 發布預檢不再等待獨立的發布檢查路徑。
- 在本機標記發布候選版本前，執行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。此 helper 會依序執行快速發布護欄、外掛 npm/ClawHub 發布檢查、build、UI build 與 `release:openclaw:npm:check`，用來在 GitHub 發布 workflow 開始前抓出常見會阻擋核准的錯誤。
- 核准前，執行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或對應的預發布/修正版標籤）。
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或對應的 beta/修正版版本），在全新的暫存 prefix 中驗證已發布的 registry 安裝路徑。
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租用的 Telegram 憑證池，針對已發布的 npm 套件驗證已安裝套件 onboarding、Telegram 設定，以及真正的 Telegram E2E。本機維護者的一次性執行可省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env 憑證。
- 若要從維護者機器執行完整的發布後 beta smoke，使用 `pnpm release:beta-smoke -- --beta betaN`。此 helper 會執行 Parallels npm update/fresh-target 驗證、派送 `NPM Telegram Beta E2E`、輪詢精確 workflow run、下載成品，並列印 Telegram 報告。
- 維護者也可以透過手動 `NPM Telegram Beta E2E` workflow，從 GitHub Actions 執行相同的發布後檢查。它刻意僅限手動，不會在每次 merge 時執行。
- 維護者發布自動化使用預檢後提升：
  - 真正的 npm 發布必須通過成功的 npm `preflight_run_id`。
  - 真正發布必須從與成功預檢 run 相同的 `main` 或 `release/YYYY.M.PATCH` 分支派送（alpha 預發布允許使用 Tideclaw alpha 分支）。
  - 穩定版 npm release 預設為 `beta`；穩定版 npm 發布可透過 workflow input 明確指定目標為 `latest`。
  - 基於權杖的 npm dist-tag 變更位於 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而來源 repo 保持僅使用 OIDC 發布。
  - 公開 `macOS Release` 僅供驗證；當標籤只存在於發布分支，但 workflow 從 `main` 派送時，設定 `public_release_branch=release/YYYY.M.PATCH`。
  - 真正的 macOS 發布必須通過成功的 macOS `preflight_run_id` 與 `validate_run_id`。
  - 真正發布路徑會提升已準備好的成品，而不是再次重建它們。
- 對於像 `YYYY.M.PATCH-N` 這樣的穩定修正版發布，發布後 verifier 也會檢查相同的暫存 prefix 升級路徑，從 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N`，讓發布修正不會悄悄讓較舊的全域安裝停留在基礎穩定版 payload。
- npm 發布預檢會 fail closed，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，避免再次發布空的瀏覽器 dashboard。
- 發布後驗證也會檢查已發布外掛 entrypoint 與套件中繼資料是否存在於已安裝的 registry 版面中。若某個 release 缺少外掛 runtime payload，會使 postpublish verifier 失敗，且不能提升為 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，因此安裝程式 e2e 會在發布路徑前抓到意外的封裝膨脹。
- 如果發布工作觸及 CI 規劃、擴充 timing manifest 或擴充測試矩陣，請在核准前從 `.github/workflows/plugin-prerelease.yml` 重新產生並審查由 planner 擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，避免發布說明描述過期的 CI 版面。
- 穩定版 macOS 發布就緒也包含 updater 表面：GitHub release 最終必須包含已封裝的 `.zip`、`.dmg` 與 `.dSYM.zip`；發布後 `main` 上的 `appcast.xml` 必須指向新的穩定版 zip（macOS 發布 workflow 會自動提交它，或在直接推送受阻時開啟 appcast PR）；已封裝 app 必須保留非 debug bundle id、非空的 Sparkle feed URL，以及等於或高於該發布版本標準 Sparkle build floor 的 `CFBundleVersion`。

## 發布測試箱

`Full Release Validation` 是操作者從單一入口點啟動所有發布前測試的方式。若要在快速移動的分支上取得釘選 commit 證明，使用此 helper，讓每個子 workflow 都從固定於目標 SHA 的暫存分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

此 helper 會推送 `release-ci/<sha>-...`，從該分支派送 `Full Release Validation` 並帶上 `ref=<sha>`，驗證每個子 workflow 的 `headSha` 都符合目標，然後刪除暫存分支。這可避免意外證明較新的 `main` 子 run。

對於發布分支或標籤驗證，從受信任的 `main` workflow ref 執行，並將發布分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

工作流程會解析目標 ref，派發手動 `CI` 並帶上 `target_ref=<release-ref>`，接著派發 `OpenClaw Release Checks`。`OpenClaw Release Checks` 會展開安裝冒煙測試、跨作業系統發布檢查、在啟用 soak 時的即時/E2E Docker 發布路徑覆蓋、含標準 Telegram 套件 E2E 的套件驗收、QA Lab 對等性、即時 Matrix，以及即時 Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 都成功時，完整/all 執行才可接受；除非某次聚焦重新執行是刻意略過獨立的 `Plugin Prerelease` 子項。只有在使用 `release_package_spec` 或 `npm_telegram_package_spec` 進行已發布套件的聚焦重新執行時，才使用獨立的 `npm-telegram` 子項。最終驗證器摘要會包含每個子執行的最慢工作表格，讓發布管理員不必下載記錄即可查看目前的關鍵路徑。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、精確工作流程工作名稱、穩定與完整設定檔差異、成品，以及聚焦重新執行控制項。

子工作流程會從執行 `Full Release Validation` 的受信任 ref 派發，通常是 `--ref main`，即使目標 `ref` 指向較舊的發布分支或標籤也是如此。沒有獨立的完整發布驗證 workflow-ref 輸入；請透過選擇工作流程執行 ref 來選擇受信任的測試框架。不要使用 `--ref main -f ref=<sha>` 在移動中的 `main` 上做精確提交證明；原始提交 SHA 不能作為工作流程派發 ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立已釘選的臨時分支。

使用 `release_profile` 選擇即時/提供者廣度：

- `minimum`：最快的發布關鍵 OpenAI/核心即時與 Docker 路徑
- `stable`：minimum 加上發布核准所需的穩定提供者/後端覆蓋
- `full`：stable 加上廣泛的諮詢性提供者/媒體覆蓋

穩定與完整驗證在升版前一律執行詳盡的即時/E2E、Docker 發布路徑，以及有界的已發布升級存活掃描。使用 `run_release_soak=true` 為 beta 請求相同掃描。該掃描涵蓋最新四個穩定套件，加上已釘選的 `2026.4.23` 與 `2026.5.2` 基準，以及較舊的 `2026.4.15` 覆蓋；重複基準會被移除，且每個基準都會分片到自己的 Docker runner 工作。

`OpenClaw Release Checks` 會使用受信任工作流程 ref 將目標 ref 解析一次為 `release-package-under-test`，並在 soak 執行時於跨作業系統、套件驗收和發布路徑 Docker 檢查中重用該成品。這會讓所有面向套件的機器使用相同位元組，並避免重複建置套件。beta 已經發布到 npm 後，設定 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，讓發布檢查下載已出貨套件一次，從 `dist/build-info.json` 擷取其建置來源 SHA，並在跨作業系統、套件驗收、發布路徑 Docker 和套件 Telegram lane 中重用該成品。

跨作業系統 OpenAI 安裝冒煙測試會在 repo/org 變數已設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因為此 lane 是在證明套件安裝、上線設定、閘道啟動，以及一次即時代理回合，而不是在對最慢的預設模型做基準測試。較廣泛的即時提供者矩陣仍然是模型特定覆蓋的位置。

依發布階段使用這些變體：

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要在聚焦修正後第一次重新執行時使用完整總括。如果某一台機器失敗，下一次證明請使用失敗的子工作流程、工作、Docker lane、套件設定檔、模型提供者或 QA lane。只有當修正變更了共享發布編排，或讓先前所有機器的證據過期時，才再次執行完整總括。總括的最終驗證器會重新檢查記錄的子工作流程執行 ID，因此子工作流程成功重新執行後，只需重新執行失敗的 `Verify full validation` 父工作。

若要進行有界復原，請將 `rerun_group` 傳給總括。`all` 是真正的發布候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行發布專用外掛子項，`release-checks` 會執行每個發布機器，而較窄的發布群組是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦 `npm-telegram` 重新執行需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整/all 執行會使用套件驗收內的標準套件 Telegram E2E。聚焦跨作業系統重新執行可加入 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統/套件組篩選器。QA 發布檢查失敗會阻擋一般發布驗證，包括標準層級中必要的 OpenClaw 動態工具漂移。Tideclaw alpha 執行仍可將非套件安全的發布檢查 lane 視為諮詢性。當 `live_suite_filter` 明確請求受控管的 QA 即時 lane，例如 Discord、WhatsApp 或 Slack 時，必須啟用相符的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 變數；否則輸入擷取會失敗，而不是默默略過該 lane。

### Vitest

Vitest 機器是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍界定，並強制對發布候選執行一般測試圖：Linux 節點分片、內建外掛分片、外掛與頻道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、已建置成品冒煙檢查、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n。當 `Full Release Validation` 執行此機器時會包含 Android，因為總括會傳遞 `include_android=true`；獨立手動 CI 需要 `include_android=true` 才有 Android 覆蓋。

使用此機器回答「來源樹是否通過完整的一般測試套件？」它不同於發布路徑產品驗證。應保留的證據：

- 顯示已派發 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 在精確目標 SHA 上為綠燈
- 調查迴歸時 CI 工作中的失敗或緩慢分片名稱
- 當執行需要效能分析時，保留 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發布需要可重現的一般 CI，而不需要 Docker、QA Lab、即時、跨作業系統或套件機器時，才直接執行手動 CI。非 Android 直接 CI 使用第一個命令。當直接發布候選 CI 必須涵蓋 Android 時加入 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 機器位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml`，再加上發布模式的 `install-smoke` 工作流程。它會透過已封裝的 Docker 環境驗證發布候選，而不只是來源層級測試。

發布 Docker 覆蓋包括：

- 啟用較慢 Bun 全域安裝冒煙測試的完整安裝冒煙測試
- 依目標 SHA 準備/重用根 Dockerfile 冒煙映像，且 QR、根/閘道，以及安裝器/Bun 冒煙工作會作為獨立 install-smoke 分片執行
- 儲存庫 E2E lane
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`
- 請求時，在 `plugins-runtime-services` 區塊內的 OpenWebUI 覆蓋
- 分割的內建外掛安裝/解除安裝 lane：`bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發布檢查包含即時套件組時的即時/E2E 提供者套件組與 Docker 即時模型覆蓋

重新執行前請先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重新執行命令。若要聚焦復原，請在可重用即時/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有發布區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 與已準備的 Docker 映像輸入，因此失敗的 lane 可以重用相同的 tarball 和 GHCR 映像。

### QA Lab

QA Lab 機器也是 `OpenClaw Release Checks` 的一部分。它是代理行為與頻道層級的發布 gate，與 Vitest 和 Docker 套件機制分開。

發布 QA Lab 覆蓋包括：

- 使用代理對等性套件，比較 OpenAI 候選 lane 與 `anthropic/claude-opus-4-8` 基準的 mock 對等性 lane
- 使用 `qa-live-shared` 環境的快速即時 Matrix QA 設定檔
- 使用 Convex CI 憑證租約的即時 Telegram QA lane
- 當發布遙測需要明確本機證明時的 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此機器回答「發布在 QA 情境和即時頻道流程中是否表現正確？」核准發布時，請保留對等性、Matrix 和 Telegram lane 的成品 URL。完整 Matrix 覆蓋仍可作為手動分片 QA-Lab 執行，而不是預設的發布關鍵 lane。

### 套件

套件機器是可安裝產品 gate。它由 `Package Acceptance` 與解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選正規化為供 Docker E2E 使用的 `package-under-test` tarball、驗證套件清冊、記錄套件版本與 SHA-256，並讓工作流程測試框架 ref 與套件來源 ref 分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本
- `source=ref`：使用選定的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載公開 HTTPS `.tgz`，且必須提供 `package_sha256`；URL 憑證、非預設 HTTPS 連接埠、私有/內部/特殊用途主機名稱或解析後位址，以及不安全重新導向都會被拒絕
- `source=trusted-url`：從 `.github/package-trusted-sources.json` 中具名政策下載 HTTPS `.tgz`，且必須提供 `package_sha256` 和 `trusted_source_id`；請將此用於維護者擁有的企業鏡像或私有套件儲存庫，而不是為 `source=url` 加入輸入層級的私有網路旁路
- `source=artifact`：重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` 執行套件驗收。套件驗收會針對同一個已解析的 tarball，維持遷移、更新、root 管理的 VPS 升級、已設定驗證的更新後重新啟動、即時 ClawHub Skills 安裝、過期外掛依賴清理、離線外掛 fixture、外掛更新、外掛命令綁定跳脫強化，以及 Telegram 套件 QA。阻擋發布的檢查會使用預設的最新已發布套件基準；使用 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 設定檔，會將 published-upgrade-survivor 掃描擴展到 `last-stable-4`，再加上固定的 `2026.4.23`、`2026.5.2` 和 `2026.4.15` 基準，並包含 `reported-issues` 情境。對已經出貨的候選版本，請使用 `source=npm` 執行套件驗收；對發布前由 SHA 支援的本機 npm tarball，請使用 `source=ref`；對維護者擁有的企業／私有鏡像，請使用 `source=trusted-url`；對另一個 GitHub Actions 執行上傳的已準備 tarball，請使用 `source=artifact`。

它是 GitHub 原生替代方案，可取代過去大多數需要 Parallels 的套件／更新覆蓋範圍。跨作業系統發布檢查對作業系統特定的首次設定、安裝程式與平台行為仍然重要，但套件／更新產品驗證應優先使用套件驗收。

更新與外掛驗證的標準清單是[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。在決定哪個本機、Docker、套件驗收或發布檢查 lane 能證明外掛安裝／更新、doctor 清理或已發布套件遷移變更時，請使用它。從每個穩定版 `2026.4.23+` 套件進行完整的已發布更新遷移，是獨立的手動 `Update Migration` 工作流程，不屬於完整發布 CI。

舊版 package-acceptance 寬容度是刻意限時的。到 `2026.4.25` 為止的套件，可針對已經發布到 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少私有 QA 清單項目、缺少 `gateway install --wrapper`、從 tarball 衍生的 git fixture 中缺少修補檔、缺少持久化的 `update.channel`、舊版外掛 install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件，對已經出貨的本機建置中繼資料戳記檔可發出警告。較新的套件必須滿足現代套件合約；相同缺口會導致發布驗證失敗。

當發布問題與實際可安裝套件有關時，請使用較廣的套件驗收設定檔：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常見套件設定檔：

- `smoke`：快速套件安裝／頻道／代理、閘道網路與設定重新載入 lane
- `package`：安裝／更新／重新啟動／外掛套件合約，加上即時 ClawHub Skills 安裝證明；這是發布檢查預設值
- `product`：`package` 加上 MCP 頻道、排程／子代理清理、OpenAI 網頁搜尋與 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：用於聚焦重跑的精確 `docker_lanes` 清單

若要取得套件候選版本的 Telegram 證明，請在套件驗收上啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。此工作流程會將已解析的 `package-under-test` tarball 傳入 Telegram lane；獨立 Telegram 工作流程仍接受已發布的 npm 規格以進行發布後檢查。

## 一般發布自動化

對於 beta、`latest`、外掛、GitHub Release 與平台發布，
`OpenClaw Release Publish` 是一般的變更型進入點。每月
`.33+` 的僅 npm extended-stable 路徑不使用這個協調器。
一般工作流程會依發布需要的順序協調 trusted-publisher 工作流程：

1. 簽出發布標籤並解析其提交 SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 連到（或 alpha 預發布可從 Tideclaw alpha 分支連到）。
3. 執行 `pnpm plugins:sync:check`。
4. 以 `publish_scope=all-publishable` 和 `ref=<release-sha>` 派送 `Plugin NPM Release`。
5. 以相同 scope 和 SHA 派送 `Plugin ClawHub Release`。
6. 在驗證已儲存的 `full_release_validation_run_id` 後，使用發布標籤、npm dist-tag 與已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。
7. 對穩定版發布，將 GitHub release 建立或更新為草稿，使用明確的 `windows_node_tag` 和候選核准的 `windows_node_installer_digests` 派送 `Windows Node Release`，並在發布草稿前驗證標準安裝程式／校驗和資產。

Beta 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

穩定版發布到預設 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

直接提升穩定版到 `latest` 必須明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流程。當 `publish_openclaw_npm=true` 時，`OpenClaw Release Publish` 會拒絕 `plugin_publish_scope=selected`，因此核心套件不能在缺少任何可發布官方外掛的情況下出貨，包括 `@openclaw/diffs-language-pack`。若要進行指定外掛修復，請設定 `publish_openclaw_npm=false` 搭配 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或直接派送子工作流程。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受這些由操作者控制的輸入：

- `tag`：必要的發布標籤，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；當 `preflight_only=true` 時，也可以是目前完整 40 字元的工作流程分支提交 SHA，用於僅驗證的預檢
- `preflight_only`：`true` 表示只做驗證／建置／套件；`false` 表示實際發布路徑
- `preflight_run_id`：既有成功預檢執行 ID；實際發布路徑需要它，讓工作流程重用已準備的 tarball，而不是重新建置
- `full_release_validation_run_id`：此標籤／SHA 的成功 `Full Release Validation` 執行 ID；實際發布需要。Beta 發布可在只有預檢的情況下帶警告繼續，但穩定版／`latest` 提升仍需要它。
- `release_publish_run_id`：已核准的 `OpenClaw Release Publish` 執行 ID；當此工作流程由該父工作流程派送時（bot-actor 實際發布呼叫）需要
- `npm_dist_tag`：發布路徑的 npm 目標標籤；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，預設為 `beta`。最終 patch `33` 及之後必須使用 `extended-stable`；預設情況下，`extended-stable` 會拒絕更早的 patch，並且一律拒絕非最終標籤。
- `bypass_extended_stable_guard`：僅供測試的布林值，預設 `false`；搭配 `npm_dist_tag=extended-stable` 時，會略過每月 extended-stable eligibility，同時保留發布身分、成品、核准與讀回檢查。

`OpenClaw Release Publish` 接受這些由操作者控制的輸入：

- `tag`：必要的發布標籤；必須已經存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 ID；當 `publish_openclaw_npm=true` 時需要
- `full_release_validation_run_id`：成功的 `Full Release Validation` 執行 ID；當 `publish_openclaw_npm=true` 時需要
- `windows_node_tag`：精確的非預發布 `openclaw/openclaw-windows-node` 發布標籤；穩定版 OpenClaw 發布需要
- `windows_node_installer_digests`：候選核准的精簡 JSON 對應表，將目前 Windows 安裝程式名稱對應到其固定的 `sha256:` 摘要；穩定版 OpenClaw 發布需要
- `npm_telegram_run_id`：選用的成功 `NPM Telegram Beta E2E` 執行 ID，可納入最終發布證據
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤，為 `alpha`、`beta` 或 `latest` 之一
- `plugin_publish_scope`：預設為 `all-publishable`；只有在使用 `publish_openclaw_npm=false` 進行聚焦的僅外掛修復工作時，才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有在將此工作流程用作僅外掛修復協調器時，才設定為 `false`
- `release_profile`：用於發布證據摘要的發布覆蓋設定檔；預設為 `from-validation`，會從驗證 manifest 讀取，或以 `beta`、`stable` 或 `full` 覆寫
- `wait_for_clawhub`：預設為 `false`，因此 npm 可用性不會被 ClawHub sidecar 阻擋；只有在工作流程完成必須包含 ClawHub 完成時，才設定為 `true`

`OpenClaw Release Checks` 接受這些由操作者控制的輸入：

- `ref`：要驗證的分支、標籤或完整提交 SHA。帶有秘密的檢查要求已解析提交可從 OpenClaw 分支或發布標籤連到。
- `run_release_soak`：為 beta 發布檢查選擇加入完整的即時／E2E、Docker 發布路徑，以及 all-since upgrade-survivor soak。它會由 `release_profile=stable` 和 `release_profile=full` 強制啟用。

規則：

- patch `33` 以下的一般最終版本與修正版可發布到 `beta` 或 `latest`。patch `33` 或以上的最終版本必須發布到 `extended-stable`，而該邊界上的 correction-suffix 版本會被拒絕。
- Beta 預發布標籤只能發布到 `beta`；alpha 預發布標籤只能發布到 `alpha`
- 對 `OpenClaw NPM Release` 而言，完整提交 SHA 輸入只允許在 `preflight_only=true` 時使用
- `OpenClaw Release Checks` 和 `Full Release Validation` 永遠只做驗證
- 實際發布路徑必須使用預檢期間使用的同一個 `npm_dist_tag`；工作流程會在發布前驗證該中繼資料仍然延續

## 一般 beta／latest 穩定版發布順序

這個舊版順序適用於也負責外掛、GitHub Release、Windows 與其他平台工作的常規協調式發布。它不是本頁頂端記錄的每月 `.33+` 僅 npm extended-stable 路徑。

切出一般協調式穩定版發布時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，你可以使用目前完整工作流程分支的 commit SHA，對預檢工作流程進行僅供驗證的 dry run。
2. 一般的 beta-first 流程請選擇 `npm_dist_tag=beta`，只有在你刻意要直接發布穩定版時才選擇 `latest`。
3. 當你想要從單一手動工作流程取得一般 CI，以及即時提示快取、Docker、QA Lab、Matrix 和 Telegram 涵蓋範圍時，請在發布分支、發布標籤或完整 commit SHA 上執行 `Full Release Validation`。如果你刻意只需要確定性的一般測試圖，請改在發布 ref 上執行手動 `CI` 工作流程。
4. 選取確切的非預發布 `openclaw/openclaw-windows-node` 發布標籤，其簽署的 x64 和 ARM64 安裝程式應該隨版本出貨。將它儲存為 `windows_node_tag`，並將其已驗證的摘要對照儲存為 `windows_node_installer_digests`。release-candidate helper 會記錄兩者，並把它們納入其產生的發布命令。
5. 儲存成功的 `preflight_run_id` 和 `full_release_validation_run_id`。
6. 使用相同的 `tag`、相同的 `npm_dist_tag`、選定的 `windows_node_tag`、其已儲存的 `windows_node_installer_digests`、已儲存的 `preflight_run_id`，以及已儲存的 `full_release_validation_run_id` 執行 `OpenClaw Release Publish`。它會先將外部化外掛發布到 npm 和 ClawHub，再推進 OpenClaw npm 套件。
7. 如果發布落在 `beta`，請使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 推進到 `latest`。
8. 如果該發布刻意直接發布到 `latest`，且 `beta` 應立即跟隨同一個穩定建置，請使用相同的發布工作流程，將兩個 dist-tag 都指向該穩定版本，或讓其排程自我修復同步稍後移動 `beta`。

dist-tag 變更位於發布 ledger repo，因為它仍需要 `NPM_TOKEN`，而原始碼 repo 保持僅使用 OIDC 發布。這讓直接發布路徑和 beta-first 推進路徑都維持有文件可查，且操作人員可見。

如果維護者必須退回使用本機 npm 驗證，請只在專用 tmux session 中執行任何 1Password 命令列介面（`op`）命令。不要從主要 agent shell 直接呼叫 `op`；將它保留在 tmux 內，可讓提示、警示和 OTP 處理可觀察，並防止重複的主機警示。

## 公開參考資料

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

維護者會使用 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) 中的私人發布文件作為實際 runbook。

## 相關

- [發布通道](/zh-TW/install/development-channels)
