---
read_when:
    - 正在尋找公開發布管道定義
    - 執行發行驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證框、版本命名與節奏
title: 發行政策
x-i18n:
    generated_at: "2026-07-04T17:50:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前公開三個面向使用者的更新通道：

- stable：現有的已提升發行通道；在獨立的命令列介面/通道里程碑落地前，仍會透過
  npm `latest` 解析
- beta：發佈到 npm `beta` 的預發行標籤
- dev：`main` 的移動頂端

另外，發行操作員可以將前一個已完成月份的核心套件發佈到 npm `extended-stable`，
從修補版 `33` 開始。目前月份的一般正式線會繼續使用 npm `latest`；這個操作員端的
發佈分流本身不會改變命令列介面的更新通道解析。

## 版本命名

- 每月 npm extended-stable 發行版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`
  - Git 標籤：`vYYYY.M.PATCH`
- 每日/一般正式發行版本：`YYYY.M.PATCH`，其中 `PATCH < 33`
  - Git 標籤：`vYYYY.M.PATCH`
- 一般 fallback 修正發行版本：`YYYY.M.PATCH-N`
  - Git 標籤：`vYYYY.M.PATCH-N`
- Beta 預發行版本：`YYYY.M.PATCH-beta.N`
  - Git 標籤：`vYYYY.M.PATCH-beta.N`
- 不要將月份或修補版補零
- 自 2026 年 6 月發行流程更新開始，第三個元件是循序的每月發行列車編號，
  不是日曆日期。Stable 和 beta 發行會決定目前列車；僅 alpha 的標籤不會消耗或
  推進 beta/stable 修補版號。更新前的標籤與 npm 版本會保留既有名稱並維持有效；
  發行自動化會繼續依年份、月份、修補版、通道，以及預發行或修正編號比較它們。
- Alpha/nightly 組建會使用下一個尚未發行的修補版列車，且重複組建時只遞增
  `alpha.N`。一旦該修補版已有 beta，新的 alpha 組建會移到下一個修補版。
  選取 beta 或 stable 列車時，忽略修補版號較高的舊版僅 alpha 標籤。
- npm 版本不可變。如果 beta 標籤已經發佈，請不要刪除、重新發佈或重複使用它；
  請切下一個 beta 編號或下一個每月修補版。因為 `2026.6.5-beta.1` 已在轉換期間發佈，
  2026 年 6 月發行列車必須使用修補版 `5` 或更高版本。不要將新的 2026 年 6 月
  stable 或 beta 列車發佈為 `2026.6.2`、`2026.6.3` 或 `2026.6.4`。
- 在一般正式版 `2026.6.5` 之後，下一個新的 beta 列車是
  `2026.6.6-beta.1`，即使已存在修補版號較高的自動化僅 alpha 標籤也一樣。
- `latest` 會繼續跟隨目前的一般/每日 npm 線
- `beta` 表示目前的 beta 安裝目標
- `extended-stable` 表示受支援的前一月份 npm 套件，從修補版
  `33` 開始；修補版 `34` 及之後版本是該每月線上的維護發行
- 專用的每月 extended-stable 路徑只發佈核心 npm 套件。它不會發佈外掛、macOS 或 Windows 成品、GitHub Release、
  私有儲存庫 dist-tag、Docker 映像、行動成品或網站下載項目。

## 發行節奏

- 發行先進入 beta
- Stable 只會在最新 beta 通過驗證後跟進
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.PATCH` 分支切出發行，
  因此發行驗證與修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發佈且需要修正，維護者會切下一個 `-beta.N` 標籤，
  而不是刪除或重新建立舊 beta 標籤
- 詳細的發行程序、核准、憑證與復原注意事項僅供維護者使用

## 每月僅 npm 的 extended-stable 發佈

這是下方一般發行程序的專用例外。對於已完成的月份 `YYYY.M`，建立
`extended-stable/YYYY.M.33`；從同一分支發佈 `vYYYY.M.33` 及之後的維護修補版。
發行標籤、分支頂端、checkout、套件版本、npm 預檢，以及 Full Release Validation 執行
都必須指向同一個提交。受保護的 `main` 必須已包含嚴格晚於該月份的日曆月份正式版本，
且修補版低於 `33`；在 `main` 推進超過一個月後，維護修補版仍保持符合資格。

從精確的 extended-stable 分支執行 npm 預檢與 Full Release Validation，
然後儲存兩個執行 ID：

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

`release_profile=stable` 是既有的驗證深度設定檔；它與 npm `extended-stable`
dist-tag 分開，且刻意保持不變。

在兩次執行都成功且 npm 發行環境就緒後，提升精確的預檢 tarball。
修補版 `P` 必須為 `33` 或更高：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

對於刻意無法滿足每月 `.33` 或受保護 `main` 月份政策的 fork 或非生產演練，
請在 npm 預檢與發佈 dispatch 中都加入
`-f bypass_extended_stable_guard=true`。預設值為 `false`。只有在
`npm_dist_tag=extended-stable` 時才接受此 bypass，且會記錄在工作流程摘要中。
它不會繞過 canonical `extended-stable/YYYY.M.33` 工作流程 ref、分支頂端/標籤/checkout 相等性、
正式標籤語法、套件/標籤版本相等性、參照執行與 manifest 身分、tarball 來源、
環境核准、登錄檔回讀，或選擇器修復證據。

發佈工作流程會驗證參照的執行身分、已準備的 tarball 摘要，以及兩個 npm 登錄檔選擇器。
工作流程成功後，請獨立確認結果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

兩個命令都必須回傳 `YYYY.M.P`。如果發佈成功但選擇器回讀失敗，
不要重新發佈不可變的套件版本。使用失敗工作流程 always-run 摘要中列印的單一
`npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復命令，
然後重複兩個獨立回讀。回滾到先前的選擇器是另一個操作員決策，
不是回讀修復路徑。

下方的一般檢查清單仍負責 beta、`latest`、GitHub Release、外掛、macOS、Windows，
以及其他平台發佈。不要為這個僅 npm 的 extended-stable 路徑執行那些步驟。

## 一般發行操作員檢查清單

此檢查清單是發行流程的公開形式。私有憑證、簽署、公證、dist-tag 復原，
以及緊急回滾細節會保留在僅限維護者使用的發行操作手冊中。

1. 從目前的 `main` 開始：拉取最新內容，確認目標提交已推送，並確認目前 `main` 的 CI 足夠綠燈，可以從它建立分支。
2. 從上一次可到達的發行標籤之後已合併的 PR 與所有直接提交，產生頂端的 `CHANGELOG.md` 區段。保持條目面向使用者、去除重疊的 PR/直接提交條目、提交重寫、推送，並在建立分支前再次 rebase/pull。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發行相容性記錄。只有在升級路徑仍有涵蓋時才移除過期相容性，否則記錄為何刻意保留。
4. 從目前的 `main` 建立 `release/YYYY.M.PATCH`；不要直接在 `main` 上進行一般發行工作。
5. 為預期標籤更新每個必要的版本位置，然後執行
   `pnpm release:prep`。它會以正確順序重新整理外掛版本、外掛清單、設定結構描述、隨附通道設定中繼資料、設定文件基準、外掛 SDK 匯出，以及外掛 SDK API 基準。標記前提交任何產生的漂移。接著執行本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，允許使用完整 40 字元的發行分支 SHA 進行僅驗證預檢。預檢會為精確簽出的依賴圖產生依賴發行證據，並將其儲存在 npm 預檢成品中。儲存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 針對發行分支、標籤或完整提交 SHA 啟動所有發行前測試。這是四個大型發行測試箱的唯一手動進入點：Vitest、Docker、QA Lab，以及 Package。
8. 如果驗證失敗，請在發行分支上修正，並重新執行可證明修正的最小失敗檔案、lane、工作流程工作、套件 profile、提供者或模型允許清單。只有在變更的表面使先前證據失效時，才重新執行完整總控流程。
9. 對於已標記的 beta 候選版本，從相符的
   `release/YYYY.M.PATCH` 分支執行
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。對於穩定版，也傳入必要的 Windows 來源發行：
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。
   這個輔助工具會執行本機產生式發行檢查、派送或驗證完整發行驗證與 npm 預檢證據、針對精確準備好的 tarball 執行 Parallels 全新/更新證明加上 Telegram 套件證明、記錄外掛 npm 與 ClawHub 計畫，並且只在證據組合為綠燈後列印精確的
   `OpenClaw Release Publish` 命令。
   `OpenClaw Release Publish` 會將選取或所有可發布的外掛套件平行派送到 npm，並將同一組派送到 ClawHub，然後在外掛 npm 發布成功後，立即使用相符的 dist-tag 推升已準備好的 OpenClaw npm 預檢成品。
   OpenClaw npm 發布子流程成功後，它會從完整相符的
   `CHANGELOG.md` 區段建立或更新相符的 GitHub 發行/預發行頁面。發布到 npm `latest` 的穩定版會成為 GitHub 最新發行；保留在 npm `beta` 的穩定維護版會以 GitHub `latest=false` 建立。工作流程也會將預檢依賴證據、完整驗證清單，以及發布後 registry 驗證證據上傳到 GitHub 發行，以供發行後事件回應使用。發布工作流程會立即列印子流程執行 ID、自動核准工作流程權杖允許核准的發行環境閘門、使用記錄尾端彙總失敗的子工作、在 OpenClaw npm 發布成功後立即收尾 GitHub 發行與依賴證據、每當正在發布 OpenClaw npm 時等待 ClawHub，然後執行 `pnpm release:verify-beta`，並上傳 GitHub 發行、npm 套件、選取的外掛 npm 套件、選取的 ClawHub 套件、子工作流程執行 ID，以及選用 NPM Telegram 執行 ID 的發布後證據。ClawHub 路徑會重試暫時性的命令列介面依賴安裝失敗，即使某個預覽儲存格偶發失敗也會發布通過預覽的外掛，並以每個預期外掛版本的 registry 驗證結束，讓部分發布保持可見且可重試。然後針對已發布的
   `openclaw@YYYY.M.PATCH-beta.N` 或
   `openclaw@beta` 套件執行發布後套件接受度測試。如果已推送或已發布的預發行需要修正，請切出下一個相符的預發行編號；不要刪除或重寫舊的預發行。
10. 對於穩定版，只有在已審核的 beta 或發行候選版本具備必要驗證證據後才繼續。穩定版 npm 發布也透過
    `OpenClaw Release Publish` 進行，並透過
    `preflight_run_id` 重用成功的預檢成品；穩定版 macOS 發行就緒也需要 `main` 上已封裝的 `.zip`、`.dmg`、`.dSYM.zip`，以及已更新的 `appcast.xml`。
    macOS 發布工作流程會在發行資產驗證後，自動將已簽署的 appcast 發布到公開 `main`；如果分支保護阻擋直接推送，則會開啟或更新 appcast PR。穩定版 Windows Hub 就緒需要 OpenClaw GitHub 發行上的已簽署 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe`，以及
    `OpenClawCompanion-SHA256SUMS.txt` 資產。
    將精確已簽署的 `openclaw/openclaw-windows-node` 發行標籤作為
    `windows_node_tag` 傳入，並將其候選核准的安裝程式摘要映射作為
    `windows_node_installer_digests` 傳入；`OpenClaw Release Publish` 會保留發行草稿、派送 `Windows Node Release`，並在發布前驗證全部三項資產。
11. 發布後，執行 npm 發布後驗證器；在需要發布後通道證明時，埈行選用的獨立已發布 npm Telegram E2E；必要時進行 dist-tag 推升；驗證產生的 GitHub 發行頁面；執行發行公告步驟；然後在稱穩定版發行完成前，完成[穩定版 main 收尾](#stable-main-closeout)。

## 穩定版 main 收尾

在 `main` 搭載實際已發布的發行狀態前，穩定版發布尚未完成。

1. 從全新最新的 `main` 開始。稽核 `release/YYYY.M.PATCH` 與它的差異，並 forward-port `main` 中缺少的實際修正。不要盲目將僅發行用的相容性、測試或驗證配接器合併到更新的 `main`。
2. 將 `main` 設為已發布的穩定版本，而不是推測性的下一列車版本。在根版本變更後執行
   `pnpm release:prep`，接著執行
   `pnpm deps:shrinkwrap:generate`。
3. 讓 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 區段精確符合已標記的發行分支。若 mac 發行已發布 `appcast.xml` 更新，請納入穩定版 `appcast.xml` 更新。
4. 在操作者明確啟動該發行列車之前，不要將 `YYYY.M.PATCH+1`、beta 版本或空的未來 changelog 區段新增到 `main`。
5. 執行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`，以及
   `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送，然後在稱穩定版發行完成前，驗證 `origin/main` 包含已發布版本與 changelog。
6. 每次私有復原演練後，讓 repository variables `RELEASE_ROLLBACK_DRILL_ID` 和
   `RELEASE_ROLLBACK_DRILL_DATE` 保持最新。
   `OpenClaw Stable Main Closeout` 會從穩定版發布後、搭載已發布版本、changelog 和 appcast 的 `main` 推送開始。它會讀取不可變的發布後證據，將已發布標籤綁定到其 Full Release Validation 與 Publish 執行，然後驗證穩定版 main 狀態、發行、強制穩定浸泡測試，以及阻擋性的效能證據。它會將不可變的收尾清單與校驗和附加到 GitHub 發行。自動推送觸發會略過早於不可變發布後證據的舊版發行；它絕不會將該略過視為已完成收尾。完整收尾需要兩個資產與相符的校驗和。部分清單會重放其記錄的 `main` SHA 與復原演練以重新產生相同位元組，然後附加缺少的校驗和；無效配對，或沒有清單的校驗和，會保持阻擋狀態。沒有復原演練 repository variables 的推送觸發執行會略過且不完成收尾；缺少或超過 90 天的演練記錄仍會阻擋手動、有證據支撐的收尾。私有復原命令保留在僅維護者可見的 runbook 中。
   只使用手動派送來修復或重放有證據支撐的穩定版收尾。
   舊版備援修正標籤只有在修正標籤解析到與基礎穩定標籤相同的來源提交時，才能重用基礎套件證據。
   來源不同的修正必須發布並驗證自己的套件證據。

## 發行預檢

- 在發行預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 閘門之外仍有覆蓋
- 在發行預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機閘門之外保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發行成品與 Control UI 套件存在，供打包驗證步驟使用
- 在根版本遞增之後、標記前執行 `pnpm release:prep`。它會執行每個常在版本/設定/API 變更後發生偏移的確定性發行產生器：外掛版本、外掛清單、基礎設定結構描述、內建通道設定中繼資料、設定文件基準、外掛 SDK 匯出，以及外掛 SDK API 基準。`pnpm release:check` 會以檢查模式重新執行這些防護，並在執行套件發行檢查前，以單次通過回報所有找到的產生內容偏移失敗。
- 外掛版本同步預設會將官方外掛套件版本與既有 `openclaw.compat.pluginApi` 下限更新為 OpenClaw 發行版本。將該欄位視為外掛 SDK/執行階段 API 下限，而不只是套件版本的副本：若是刻意維持與較舊 OpenClaw 主機相容的純外掛發行，請將下限保留在最舊支援的主機 API，並在外掛發行證明中記錄此選擇。
- 在發行核准前執行手動 `Full Release Validation` 工作流程，以從單一進入點啟動所有發行前測試盒。它接受分支、標籤或完整提交 SHA，分派手動 `CI`，並分派 `OpenClaw Release Checks` 以執行安裝冒煙、套件驗收、跨作業系統套件檢查、QA Lab 對等、Matrix 與 Telegram 路徑。穩定版與完整執行一律包含完整 live/E2E 與 Docker 發行路徑浸泡；`run_release_soak=true` 會保留給明確的 beta 浸泡。Package Acceptance 在候選驗證期間提供標準套件 Telegram E2E，避免第二個並行 live 輪詢器。
  發布 beta 後提供 `release_package_spec`，即可在發行檢查、Package Acceptance 與套件 Telegram E2E 之間重用已出貨的 npm 套件，而不需重新建置發行 tarball。只有當 Telegram 應使用與其餘發行驗證不同的已發布套件時，才提供 `npm_telegram_package_spec`。當 Package Acceptance 應使用與發行套件規格不同的已發布套件時，提供 `package_acceptance_package_spec`。當發行證據報告應證明驗證符合已發布的 npm 套件，但不強制執行 Telegram E2E 時，提供 `evidence_package_spec`。
  範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- 當你想在發行工作繼續進行時，為套件候選提供旁路證明，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或精確發行版本使用 `source=npm`；使用 `source=ref` 以目前 `workflow_ref` 測試框架打包受信任的 `package_ref` 分支/標籤/SHA；對具備必要 SHA-256 與嚴格公開 URL 政策的公開 HTTPS tarball 使用 `source=url`；對使用必要 `trusted_source_id` 與 SHA-256 的具名受信任來源政策使用 `source=trusted-url`；或對由另一個 GitHub Actions 執行上傳的 tarball 使用 `source=artifact`。此工作流程會將候選解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發行排程器，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一個 tarball 執行 Telegram QA。當選定的 Docker 路徑包含 `published-upgrade-survivor` 時，套件成品就是候選，而 `published_upgrade_survivor_baseline` 會選取已發布的基準。`update-restart-auth` 會將候選套件同時作為已安裝命令列介面與 package-under-test，以測試候選更新命令的受管重啟路徑。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見設定檔：
  - `smoke`：安裝/通道/代理、閘道網路與設定重新載入路徑
  - `package`：不含 OpenWebUI 或 live ClawHub 的成品原生套件/更新/重啟/外掛路徑
  - `product`：套件設定檔加上 MCP 通道、排程/子代理清理、OpenAI 網頁搜尋與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發行路徑區塊
  - `custom`：用於聚焦重跑的精確 `docker_lanes` 選取
- 當你只需要發行候選的確定性一般 CI 覆蓋時，直接執行手動 `CI` 工作流程。手動 CI 分派會繞過變更範圍限制，並強制執行 Linux 節點分片、內建外掛分片、外掛與通道合約分片、節點 22 相容性、`check-*`、`check-additional-*`、已建置成品冒煙檢查、文件檢查、Python skills、Windows、macOS 與 Control UI i18n 路徑。獨立手動 CI 只有在以 `include_android=true` 分派時才會執行 Android；`Full Release Validation` 會為其 CI 子項傳遞該輸入。
  Android 範例：`gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- 驗證發行遙測時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器測試 QA-lab，並驗證追蹤、指標與日誌匯出，以及有界追蹤屬性和內容/識別碼遮蔽，而不需要 Opik、Langfuse 或其他外部收集器。
- 驗證收集器相容性時執行 `pnpm qa:otel:collector-smoke`。它會先透過真正的 OpenTelemetry Collector Docker 容器路由相同的 QA-lab OTLP 匯出，再進行本機接收器斷言。
- 驗證受保護的 Prometheus 抓取時執行 `pnpm qa:prometheus:smoke`。它會測試 QA-lab、拒絕未驗證的抓取，並驗證發行關鍵指標族群不含提示內容、原始識別碼、驗證權杖與本機路徑。
- 當你想連續執行原始碼 checkout 的 OpenTelemetry 與 Prometheus 冒煙路徑時，執行 `pnpm qa:observability:smoke`。
- 每次標記發行前執行 `pnpm release:check`
- `OpenClaw NPM Release` 預檢會在打包 npm tarball 前產生依賴項發行證據。npm advisory 漏洞閘門會阻擋發行。傳遞性 manifest 風險、依賴項所有權/安裝表面，以及依賴項變更報告僅作為發行證據。依賴項變更報告會比較發行候選與前一個可到達的發行標籤。
- 預檢會將依賴項證據上傳為 `openclaw-release-dependency-evidence-<tag>`，並同時嵌入已準備好的 npm 預檢成品中的 `dependency-evidence/` 下。真正的發布路徑會重用該預檢成品，然後將相同證據以 `openclaw-<version>-dependency-evidence.zip` 附加到 GitHub release。
- 標籤存在後，執行 `OpenClaw Release Publish` 以進行會變更狀態的發布序列。從 `release/YYYY.M.PATCH` 分派它（或在發布可由 `main` 到達的標籤時從 `main` 分派），傳入發行標籤、成功的 OpenClaw npm `preflight_run_id` 與成功的 `full_release_validation_run_id`，並保留預設外掛發布範圍 `all-publishable`，除非你刻意執行聚焦修復。此工作流程會序列化外掛 npm 發布、外掛 ClawHub 發布與 OpenClaw npm 發布，讓核心套件不會在其外部化外掛之前發布。
- 穩定版 `OpenClaw Release Publish` 需要在相符的非預發行 `openclaw/openclaw-windows-node` release 存在後，提供精確的 `windows_node_tag`。它也需要候選核准的 `windows_node_installer_digests` 對應。在分派任何發布子項前，它會驗證來源 release 已發布、非預發行、包含必要的 x64/ARM64 安裝程式，且仍符合該核准對應。接著它會在 OpenClaw release 仍為草稿時分派 `Windows Node Release`，並原封不動攜帶釘選的安裝程式摘要對應。子工作流程會從該精確標籤下載已簽署的 Windows Hub 安裝程式，將它們與釘選摘要比對，於 Windows runner 上驗證其 Authenticode 簽章使用預期的 OpenClaw Foundation 簽署者，寫入 SHA-256 manifest，並將安裝程式與 manifest 上傳到標準 OpenClaw GitHub release，然後重新下載已提升的資產並驗證 manifest 成員資格與雜湊。父工作流程會在發布前驗證目前的 x64、ARM64 與校驗和資產合約。直接復原會先拒絕非預期的 `OpenClawCompanion-*` 資產名稱，再以釘選來源位元組取代預期的合約資產。只有在復原時才手動分派 `Windows Node Release`，且一律傳入精確標籤，絕不使用 `latest`，並提供來自已核准來源 release 的明確 `expected_installer_digests` JSON 對應。網站下載連結應指向目前穩定版發行的精確 OpenClaw release 資產 URL，或只在確認 GitHub 的 latest 重新導向指向同一個 release 後，才使用 `releases/latest/download/...`；不要只連到 companion repo release 頁面。
- 發行檢查現在於獨立的手動工作流程中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發行核准前執行 QA Lab mock 對等路徑，以及快速 live Matrix 設定檔和 Telegram QA 路徑。live 路徑使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI 憑證租約。當你想並行取得完整 Matrix 傳輸、媒體與 E2EE 清單時，請以 `matrix_profile=all` 和 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` 工作流程。
- 跨作業系統安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，它們會直接呼叫可重用工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這項拆分是刻意的：讓真正的 npm 發行路徑保持簡短、確定性且聚焦於成品，而較慢的 live 檢查保留在自己的路徑中，避免拖慢或阻擋發布
- 帶有秘密的發行檢查應透過 `Full Release Validation` 分派，或從 `main`/release 工作流程 ref 分派，讓工作流程邏輯與秘密維持受控
- `OpenClaw Release Checks` 接受分支、標籤或完整提交 SHA，只要解析出的提交可從 OpenClaw 分支或發行標籤到達
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元的工作流程分支提交 SHA，而不要求已推送標籤
- 該 SHA 路徑僅供驗證，不能提升為真正發布
- 在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發行標籤
- 兩個工作流程都將真正的發布與提升路徑保留在 GitHub 託管 runner 上，而非變更性驗證路徑可使用較大的 Blacksmith Linux runner
- 該工作流程會使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` 工作流程秘密執行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 發行預檢不再等待獨立的發行檢查路徑
- 在本機標記發行候選前，執行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。此輔助程式會依序執行快速發行防護、外掛 npm/ClawHub 發行檢查、建置、UI 建置與 `release:openclaw:npm:check`，以在 GitHub 發布工作流程開始前捕捉常見會阻擋核准的錯誤。
- 在核准前執行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  （或相符的 beta/修正標籤）
- npm 發布後，執行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  （或相符的 beta/修正版）以在全新的暫存 prefix 中驗證已發布的 registry
  安裝路徑
- 發布 beta 後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以針對已發布的 npm 套件，使用共用租用的 Telegram 認證
  池，驗證已安裝套件的 onboarding、Telegram 設定，以及真實 Telegram E2E。
  本機維護者的一次性操作可省略 Convex 變數，並直接傳入三個
  `OPENCLAW_QA_TELEGRAM_*` env 認證。
- 若要從維護者機器執行完整的發布後 beta smoke，請使用 `pnpm release:beta-smoke -- --beta betaN`。此 helper 會執行 Parallels npm 更新/全新目標驗證、派送 `NPM Telegram Beta E2E`、輪詢確切的 workflow run、下載 artifact，並列印 Telegram 報告。
- 維護者可以透過 GitHub Actions 的
  手動 `NPM Telegram Beta E2E` workflow 執行相同的發布後檢查。它刻意僅允許手動執行，
  不會在每次 merge 時執行。
- 維護者 release 自動化現在使用 preflight-then-promote：
  - 真實 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真實 npm 發布必須從與成功 preflight run 相同的 `main` 或
    `release/YYYY.M.PATCH` branch 派送
  - stable npm release 預設為 `beta`
  - stable npm 發布可以透過 workflow input 明確指定目標為 `latest`
  - 以 token 為基礎的 npm dist-tag mutation 現在位於
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因為
    `npm dist-tag add` 仍需要 `NPM_TOKEN`，而 source repo 維持
    僅使用 OIDC 的發布
  - 公開 `macOS Release` 僅用於驗證；當 tag 只存在於
    release branch，但 workflow 是從 `main` 派送時，請設定
    `public_release_branch=release/YYYY.M.PATCH`
  - 真實 macOS 發布必須通過成功的 macOS `preflight_run_id` 和
    `validate_run_id`
  - 真實發布路徑會 promote 已準備的 artifact，而不是再次重建
    它們
- 對於像 `YYYY.M.PATCH-N` 這樣的 stable 修正版 release，發布後 verifier
  也會檢查從 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同暫存 prefix 升級路徑，
  因此 release 修正不會默默讓較舊的全域安裝停留在
  base stable payload
- npm release preflight 會 fail closed，除非 tarball 同時包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，
  這樣我們就不會再次發布空的瀏覽器 dashboard
- 發布後驗證也會檢查已發布的外掛 entrypoint 和
  package metadata 是否存在於已安裝的 registry layout 中。若 release
  缺少外掛 runtime payload，會使 postpublish verifier 失敗，且
  無法 promote 到 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，
  因此 installer e2e 會在 release 發布路徑之前捕捉意外的 pack 膨脹
- 如果 release 工作觸及 CI 規劃、外掛 timing manifest，或
  外掛 test matrix，請在核准前重新產生並審閱由 planner 擁有的
  `plugin-prerelease-extension-shard` matrix output，其來源為
  `.github/workflows/plugin-prerelease.yml`，如此 release notes 才不會
  描述過時的 CI layout
- Stable macOS release readiness 也包含 updater surface：
  - GitHub release 最終必須包含打包後的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - `main` 上的 `appcast.xml` 必須在發布後指向新的 stable zip；
    macOS publish workflow 會自動 commit，或在 direct push 被封鎖時開啟 appcast
    PR
  - 打包後的 app 必須維持非 debug bundle id、非空的 Sparkle feed
    URL，以及大於或等於該 release version 的 canonical Sparkle build floor
    的 `CFBundleVersion`

## 發布測試機器

`Full Release Validation` 是操作人員從單一進入點啟動所有預發布測試的方式。若要在快速變動的分支上取得固定提交的證明，請使用輔助工具，讓每個子工作流程都從固定在目標 SHA 的臨時分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

輔助工具會推送 `release-ci/<sha>-...`、從該分支以 `ref=<sha>` 派發 `Full Release Validation`、驗證每個子工作流程的 `headSha` 都符合目標，然後刪除臨時分支。這可避免意外證明到較新的 `main` 子執行。

若要驗證發布分支或標籤，請從受信任的 `main` 工作流程 ref 執行，並將發布分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

此工作流程會解析目標 ref，派發帶有 `target_ref=<release-ref>` 的手動 `CI`，然後派發 `OpenClaw Release Checks`。`OpenClaw Release Checks` 會展開安裝煙霧測試、跨作業系統發布檢查、啟用 soak 時的 live/E2E Docker 發布路徑涵蓋、含標準 Telegram 套件 E2E 的 Package Acceptance、QA Lab 對等性、live Matrix，以及 live Telegram。完整/all 執行只有在 `Full Release Validation` 摘要顯示 `normal_ci`、`plugin_prerelease` 與 `release_checks` 都成功時才可接受，除非焦點重跑刻意略過了獨立的 `Plugin Prerelease` 子項。獨立的 `npm-telegram` 子項只應用於使用 `release_package_spec` 或 `npm_telegram_package_spec` 的焦點已發布套件重跑。最終驗證器摘要會包含每個子執行的最慢工作表格，因此發布管理者無需下載記錄即可看到目前的關鍵路徑。
請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、精確的工作流程工作名稱、stable 與 full 設定檔差異、成品，以及焦點重跑控制項。
子工作流程會從執行 `Full Release Validation` 的受信任 ref 派發，通常是 `--ref main`，即使目標 `ref` 指向較舊的發布分支或標籤也是如此。沒有獨立的 Full Release Validation 工作流程 ref 輸入；請透過選擇工作流程執行 ref 來選擇受信任的測試框架。
請勿使用 `--ref main -f ref=<sha>` 來對移動中的 `main` 進行精確提交證明；原始提交 SHA 不能作為工作流程派發 ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立固定的臨時分支。

使用 `release_profile` 選擇 live/provider 涵蓋範圍：

- `minimum`：最快的發布關鍵 OpenAI/core live 與 Docker 路徑
- `stable`：minimum 加上發布核准所需的穩定 provider/backend 涵蓋
- `full`：stable 加上廣泛的建議性 provider/media 涵蓋

Stable 與 full 驗證在升級前一律執行完整的 live/E2E、Docker 發布路徑，以及有界限的已發布升級存活掃描。使用 `run_release_soak=true` 可為 beta 要求相同掃描。該掃描涵蓋最新四個 stable 套件，以及固定的 `2026.4.23` 與 `2026.5.2` 基準，再加上較舊的 `2026.4.15` 涵蓋，會移除重複基準，並將每個基準分片到各自的 Docker runner 工作中。

`OpenClaw Release Checks` 使用受信任的工作流程 ref 將目標 ref 解析一次為 `release-package-under-test`，並在執行 soak 時於跨作業系統、Package Acceptance 與發布路徑 Docker 檢查中重複使用該成品。這會讓所有面向套件的測試機器使用相同位元組，並避免重複建置套件。beta 已經發布到 npm 後，設定 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，讓發布檢查下載已出貨套件一次、從 `dist/build-info.json` 擷取其建置來源 SHA，並將該成品重複用於跨作業系統、Package Acceptance、發布路徑 Docker，以及套件 Telegram 線路。
跨作業系統 OpenAI 安裝煙霧測試會在 repo/org 變數已設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此線路證明的是套件安裝、onboarding、閘道啟動，以及一次 live agent turn，而不是對最慢的預設模型做效能基準。較廣泛的 live provider 矩陣仍然是模型特定涵蓋的地方。

請依發布階段使用這些變體：

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

在焦點修復後的第一次重跑，不要使用完整 umbrella。如果某個測試機器失敗，請使用失敗的子工作流程、工作、Docker 線路、套件設定檔、模型 provider，或 QA 線路作為下一次證明。只有在修復更改了共用發布編排，或讓先前的全測試機器證據過期時，才再次執行完整 umbrella。umbrella 的最終驗證器會重新檢查已記錄的子工作流程執行 ID，因此在子工作流程成功重跑後，只需重跑失敗的 `Verify full validation` 父工作。

若要進行有界限的復原，請將 `rerun_group` 傳給 umbrella。`all` 是真正的發布候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行僅發布使用的外掛子項，`release-checks` 執行每個發布測試機器，而較窄的發布群組為 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 與 `npm-telegram`。焦點 `npm-telegram` 重跑需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整/all 執行會使用 Package Acceptance 內的標準套件 Telegram E2E。焦點跨作業系統重跑可以加入 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統/套件篩選器。QA 發布檢查失敗會阻擋一般發布驗證，包括標準層級中必要的 OpenClaw 動態工具漂移。Tideclaw alpha 執行仍可將非套件安全的發布檢查線路視為建議性。當 `live_suite_filter` 明確要求 Discord、WhatsApp 或 Slack 等受閘控的 QA live 線路時，必須啟用對應的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 變數；否則輸入擷取會失敗，而不是默默略過該線路。

### Vitest

Vitest 測試機器是手動 `CI` 子工作流程。手動 CI 會刻意繞過變更範圍判定，並強制發布候選使用一般測試圖：Linux 節點 分片、 bundled-plugin 分片、外掛與 channel contract 分片、節點 22 相容性、`check-*`、`check-additional-*`、建置成品煙霧檢查、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n。當 `Full Release Validation` 執行此測試機器時會包含 Android，因為 umbrella 會傳入 `include_android=true`；獨立手動 CI 需要 `include_android=true` 才有 Android 涵蓋。

使用此測試機器回答「原始碼樹是否通過完整的一般測試套件？」它與發布路徑產品驗證不同。需要保留的證據：

- 顯示已派發 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 在精確目標 SHA 上為綠燈
- 調查回歸時來自 CI 工作的失敗或緩慢分片名稱
- 當執行需要效能分析時，保留 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有在發布需要確定性的一般 CI，但不需要 Docker、QA Lab、live、跨作業系統或套件測試機器時，才直接執行手動 CI。非 Android 直接 CI 使用第一個命令。當直接發布候選 CI 必須涵蓋 Android 時，加入 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 測試機器位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml`，再加上發布模式的 `install-smoke` 工作流程。它會透過已封裝的 Docker 環境驗證發布候選，而不是只做原始碼層級測試。

發布 Docker 涵蓋包括：

- 啟用緩慢 Bun 全域安裝煙霧測試的完整安裝煙霧測試
- 依目標 SHA 準備/重用根 Dockerfile 煙霧映像，並將 QR、root/gateway 與 installer/Bun 煙霧工作作為獨立 install-smoke 分片執行
- 儲存庫 E2E 線路
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 與 `plugins-runtime-install-h`
- 要求時在 `plugins-runtime-services` 區塊內的 OpenWebUI 涵蓋
- 拆分的 bundled 外掛安裝/解除安裝線路，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發布檢查包含 live 套件時的 live/E2E provider 套件與 Docker live 模型涵蓋

重跑前請先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含線路記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重跑命令。若要進行焦點復原，請在可重用 live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有發布區塊。產生的重跑命令會在可用時包含先前的 `package_artifact_run_id` 與已準備的 Docker 映像輸入，因此失敗線路可以重用相同 tarball 與 GHCR 映像。

### QA Lab

QA Lab 測試機器也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為與 channel 層級發布閘門，與 Vitest 和 Docker 套件機制分開。

發布 QA Lab 涵蓋包括：

- 使用 agentic parity pack 比較 OpenAI 候選線路與 Opus 4.6 基準的 mock 對等性線路
- 使用 `qa-live-shared` 環境的快速 live Matrix QA 設定檔
- 使用 Convex CI 憑證租約的 live Telegram QA 線路
- 當發布 telemetry 需要明確本機證明時，執行 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此測試機器回答「發布在 QA 情境與 live channel 流程中是否正確運作？」核准發布時，請保留對等性、Matrix 與 Telegram 線路的成品 URL。完整 Matrix 涵蓋仍可透過手動分片 QA-Lab 執行取得，而不是預設的發布關鍵線路。

### Package

Package 測試機器是可安裝產品閘門。它由 `Package Acceptance` 與解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選正規化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並將工作流程測試框架 ref 與套件來源 ref 分開。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發行
  版本
- `source=ref`：使用選取的 `workflow_ref` 測試框架打包受信任的 `package_ref` 分支、標籤或完整 commit SHA
- `source=url`：下載需要 `package_sha256` 的公開 HTTPS `.tgz`；
  URL 認證、非預設 HTTPS 連接埠、私有/內部/特殊用途
  主機名稱或解析後位址，以及不安全的重新導向都會被拒絕
- `source=trusted-url`：從
  `.github/package-trusted-sources.json` 中具名政策下載需要
  `package_sha256` 和 `trusted_source_id` 的 HTTPS `.tgz`；將此用於維護者擁有的
  企業鏡像或私有套件儲存庫，而不是為 `source=url` 新增輸入層級的私有網路繞過
- `source=artifact`：重複使用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發行套件成品、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、
`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對相同解析出的
tarball 保留遷移、更新、已設定驗證的更新重新啟動、即時 ClawHub skill 安裝、過期外掛相依性清理、離線外掛
fixtures、外掛更新，以及 Telegram 套件 QA。阻擋性發行檢查會使用預設的最新已發布套件
基準線；使用 `run_release_soak=true`、`release_profile=stable` 或
`release_profile=full` 的 beta profile 會擴展為從
`2026.4.23` 到 `latest` 的每個穩定 npm 已發布基準線，加上已回報問題的 fixtures。對已出貨的候選版本使用
`source=npm` 的 Package Acceptance；發布前對 SHA 支援的本機 npm tarball 使用
`source=ref`；對維護者擁有的企業/私有鏡像使用 `source=trusted-url`；或對另一個 GitHub Actions 執行上傳的已準備 tarball 使用
`source=artifact`。
它是 GitHub 原生的替代方案，可取代先前大多需要 Parallels 的套件/更新覆蓋範圍。跨 OS 發行檢查對 OS 特定的導入、安裝程式與平台行為仍然重要，但套件/更新的產品驗證應優先使用 Package Acceptance。

更新與外掛驗證的標準檢查清單是
[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。在判定哪個本機、Docker、Package Acceptance 或發行檢查 lane 可證明
外掛安裝/更新、doctor 清理，或已發布套件遷移變更時，請使用它。
從每個穩定 `2026.4.23+` 套件進行完整已發布更新遷移，是獨立的手動 `Update Migration` workflow，不屬於 Full Release CI。

舊版 package-acceptance 寬容度刻意設定了時間限制。到
`2026.4.25` 為止的套件，可針對已發布到 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少私有 QA inventory 項目、缺少
`gateway install --wrapper`、tarball 衍生的 git
fixture 中缺少 patch 檔案、缺少持久化的 `update.channel`、舊版外掛安裝記錄
位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料
遷移。已發布的 `2026.4.26` 套件可針對已出貨的本機建置中繼資料戳記檔案發出警告。較新的套件
必須滿足現代套件契約；相同缺口會導致發行
驗證失敗。

當發行問題關於實際可安裝套件時，請使用更廣泛的 Package Acceptance profiles：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常用套件 profiles：

- `smoke`：快速套件安裝/channel/agent、閘道網路與設定
  重新載入 lanes
- `package`：安裝/更新/重新啟動/外掛套件契約，加上即時 ClawHub
  skill 安裝證明；這是發行檢查預設值
- `product`：`package` 加上 MCP channels、cron/subagent 清理、OpenAI web
  search 與 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：用於聚焦重跑的確切 `docker_lanes` 清單

對於套件候選版本的 Telegram 證明，請在 Package Acceptance 啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。該 workflow 會將解析出的
`package-under-test` tarball 傳入 Telegram lane；獨立的
Telegram workflow 仍接受已發布的 npm spec，以進行發布後檢查。

## 一般發行發布自動化

對於 beta、`latest`、外掛、GitHub Release 與平台發布，
`OpenClaw Release Publish` 是正常的變更入口點。每月
`.33+` 僅 npm 的 extended-stable 路徑不使用此 orchestrator。一般 workflow
會依照發行所需順序協調 trusted-publisher workflows：

1. 簽出發行標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 觸及。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和
   `ref=<release-sha>` dispatch `Plugin NPM Release`。
5. 使用相同 scope 和 SHA dispatch `Plugin ClawHub Release`。
6. 驗證已儲存的
   `full_release_validation_run_id` 後，使用發行標籤、npm dist-tag 與
   已儲存的 `preflight_run_id` dispatch `OpenClaw NPM Release`。
7. 對穩定發行，建立或更新 GitHub release 為 draft，使用明確的 `windows_node_tag` 和
   候選版本核准的 `windows_node_installer_digests` dispatch
   `Windows Node Release`，並在發布 draft 前驗證標準
   安裝程式/checksum assets。

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

直接提升穩定版到 `latest` 需要明確指定：

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

只有在聚焦修復或重新發布工作時，才使用較低層級的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflows。
當 `publish_openclaw_npm=true` 時，`OpenClaw Release Publish` 會拒絕
`plugin_publish_scope=selected`，因此核心
套件不能在未包含每個可發布的官方外掛（包括
`@openclaw/diffs-language-pack`）的情況下出貨。若要進行選定外掛修復，請設定
`publish_openclaw_npm=false`，搭配 `plugin_publish_scope=selected` 和
`plugins=@openclaw/name`，或直接 dispatch 子 workflow。

## NPM workflow inputs

`OpenClaw NPM Release` 接受這些由操作員控制的 inputs：

- `tag`：必要發行標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前
  workflow 分支的完整 40 字元 commit SHA，用於僅驗證 preflight
- `preflight_only`：`true` 表示僅驗證/建置/打包，`false` 表示
  真正發布路徑
- `preflight_run_id`：真正發布路徑必要，讓 workflow 重複使用
  成功 preflight 執行中準備的 tarball
- `full_release_validation_run_id`：真正每月 extended-stable 與一般
  非 beta 發布必要，讓 workflow 驗證確切的驗證執行
- `npm_dist_tag`：發布路徑的 npm 目標標籤；接受 `alpha`、`beta`、
  `latest` 或 `extended-stable`，預設為 `beta`。最終 patch `33` 與之後必須
  使用 `extended-stable`；預設情況下，`extended-stable` 會拒絕更早的 patches，且一律
  拒絕非最終標籤。
- `bypass_extended_stable_guard`：僅供測試的布林值，預設 `false`；搭配
  `npm_dist_tag=extended-stable` 時，會繞過每月 extended-stable eligibility，同時保留
  發行身分、成品、核准與 readback 檢查。

`OpenClaw Release Publish` 接受這些由操作員控制的 inputs：

- `tag`：必要發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight run id；
  當 `publish_openclaw_npm=true` 時必要
- `full_release_validation_run_id`：成功的 `Full Release Validation` run
  id；當 `publish_openclaw_npm=true` 時必要
- `windows_node_tag`：確切的非 prerelease `openclaw/openclaw-windows-node`
  release tag；穩定 OpenClaw 發布必要
- `windows_node_installer_digests`：候選版本核准的緊湊 JSON map，將
  目前 Windows 安裝程式名稱對應到其固定的 `sha256:` digests；穩定 OpenClaw 發布必要
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；只有在
  `publish_openclaw_npm=false` 的聚焦外掛專用修復工作中才使用 `selected`
- `plugins`：當
  `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有在將 workflow 作為外掛專用修復 orchestrator 時才設定為 `false`
- `wait_for_clawhub`：預設為 `false`，因此 npm 可用性不會被
  ClawHub sidecar 阻擋；只有在 workflow 完成必須包含
  ClawHub 完成時才設定為 `true`

`OpenClaw Release Checks` 接受這些由操作員控制的 inputs：

- `ref`：要驗證的分支、標籤或完整 commit SHA。帶有 secret 的檢查
  要求解析出的 commit 可從 OpenClaw 分支或
  發行標籤觸及。
- `run_release_soak`：為 beta 發行檢查選擇加入完整 live/E2E、Docker 發行路徑與
  all-since upgrade-survivor soak。它會由
  `release_profile=stable` 和 `release_profile=full` 強制啟用。

規則：

- patch `33` 以下的一般最終版與修正版可發布到
  `beta` 或 `latest`。patch `33` 或以上的最終版必須發布到
  `extended-stable`，且該邊界上的 correction-suffix 版本會被拒絕。
- Beta prerelease tags 只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 時才允許完整 commit SHA input
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律
  僅供驗證
- 真正發布路徑必須使用 preflight 期間使用的相同 `npm_dist_tag`；
  workflow 會在發布前驗證該中繼資料仍然一致

## 一般 beta/latest 穩定發行順序

此舊版順序適用於一般 orchestrated release，該發行也負責
外掛、GitHub Release、Windows 與其他平台工作。它不是本頁頂端記錄的
每月 `.33+` 僅 npm extended-stable 路徑。

切出一般 orchestrated 穩定發行時：

1. 執行 `OpenClaw NPM Release`，並設定 `preflight_only=true`
   - 在標籤存在之前，你可以使用目前完整工作流程分支提交的
     SHA，對預檢工作流程進行僅驗證的 dry run
2. 一般的 beta 優先流程請選擇 `npm_dist_tag=beta`，只有在你刻意要直接發布穩定版時
   才選擇 `latest`
3. 當你想透過單一手動工作流程取得一般 CI，加上即時提示快取、Docker、QA Lab、
   Matrix 和 Telegram 涵蓋時，請在 release 分支、release 標籤或完整
   commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要確定性的正常測試圖，請改在 release ref 上執行
   手動 `CI` 工作流程
5. 選取確切的非預發行 `openclaw/openclaw-windows-node` release 標籤，
   其已簽署的 x64 和 ARM64 安裝程式應該隨版本發布。將它儲存為
   `windows_node_tag`，並將其已驗證的摘要對應儲存為
   `windows_node_installer_digests`。release-candidate 輔助程式會記錄兩者，
   並將它們納入產生的發布命令。
6. 儲存成功的 `preflight_run_id` 和 `full_release_validation_run_id`
7. 使用相同的 `tag`、相同的 `npm_dist_tag`、選取的 `windows_node_tag`、
   其已儲存的 `windows_node_installer_digests`、
   已儲存的 `preflight_run_id`，以及已儲存的 `full_release_validation_run_id`
   執行 `OpenClaw Release Publish`；它會先將外部化外掛發布到 npm 和 ClawHub，
   再提升 OpenClaw npm 套件
8. 如果 release 落在 `beta`，請使用
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流程，將該穩定版本從 `beta` 提升到 `latest`
9. 如果 release 刻意直接發布到 `latest`，且 `beta` 應該立即跟隨相同的穩定建置，
   請使用同一個 release 工作流程，將兩個 dist-tags 都指向該穩定版本，
   或讓其排程的自我修復同步稍後移動 `beta`

dist-tag 變更位於 release ledger repo，因為它仍然需要
`NPM_TOKEN`，而原始碼 repo 則維持僅使用 OIDC 發布。

這會讓直接發布路徑和 beta 優先提升路徑都保有文件記錄，且讓操作人員可見。

如果維護者必須退回使用本機 npm 驗證，請只在專用的 tmux 工作階段內執行任何 1Password
命令列介面（`op`）命令。不要從主要 agent shell 直接呼叫 `op`；將它限制在 tmux 內，
可讓提示、警示和 OTP 處理保持可觀察，並防止重複的主機警示。

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

維護者使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私人 release 文件作為實際 runbook。

## 相關

- [Release channels](/zh-TW/install/development-channels)
