---
read_when:
    - 正在尋找公開發布頻道的定義
    - 執行版本驗證或套件驗收
    - 尋找版本命名方式與發布節奏
summary: 發布通道、維運人員檢查清單、驗證環境、版本命名與發布節奏
title: 發布政策
x-i18n:
    generated_at: "2026-07-12T14:47:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前提供三個面向使用者的更新頻道：

- stable：現有的已提升發行頻道，在獨立的命令列介面／頻道里程碑完成前，仍會透過 npm `latest` 解析
- beta：發佈至 npm `beta` 的預發行標籤
- dev：持續移動的 `main` 最新版本

此外，發行作業人員可將最近一個已結束月份的核心套件發佈至 npm `extended-stable`，從修補版本 `33` 開始。當月的一般正式版本線仍使用 npm `latest`；這項作業人員端的發佈分流本身不會變更命令列介面的更新頻道解析方式。

Tideclaw alpha 組建是獨立的內部預發行軌道（npm dist-tag `alpha`），相關內容請參閱 [NPM 工作流程輸入](#npm-workflow-inputs)與[發行測試機](#release-test-boxes)。

## 版本命名

- 每月 npm extended-stable 發行版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`，git 標籤為 `vYYYY.M.PATCH`
- 每日／一般正式發行版本：`YYYY.M.PATCH`，其中 `PATCH < 33`，git 標籤為 `vYYYY.M.PATCH`
- 一般後備修正發行版本：`YYYY.M.PATCH-N`，git 標籤為 `vYYYY.M.PATCH-N`
- Beta 預發行版本：`YYYY.M.PATCH-beta.N`，git 標籤為 `vYYYY.M.PATCH-beta.N`
- Alpha 預發行版本：`YYYY.M.PATCH-alpha.N`，git 標籤為 `vYYYY.M.PATCH-alpha.N`
- 月份或修補版本絕不補零
- `PATCH` 是每月發行列車的序號，不是日曆日期。一般正式版與 beta 版會推進目前的發行列車；僅有 alpha 的標籤絕不占用或推進 beta／一般版本的修補編號，因此選擇 beta 或一般發行列車時，請忽略修補編號較高的舊版純 alpha 標籤。
- Alpha／每夜組建使用下一個尚未發行的修補版本列車，重複組建時只遞增 `alpha.N`。該修補版本一旦有 beta 版，新的 alpha 組建便移至下一個修補版本。
- npm 版本不可變更：絕不刪除、重新發佈或重複使用已發佈的標籤。請改為建立下一個預發行編號或下一個每月修補版本。
- `latest` 繼續指向目前的一般／每日 npm 版本線；`beta` 是目前的 beta 安裝目標
- `extended-stable` 代表受支援的前一月份 npm 套件，從修補版本 `33` 開始；修補版本 `34` 及之後的版本是該每月版本線的維護發行
- 一般正式版與一般修正版預設發佈至 npm `beta`；發行作業人員可以明確指定 `latest`，或稍後提升經過審核的 beta 組建
- 專用的每月 extended-stable 路徑會以完全相同的版本發佈核心 npm 套件，以及每個可發佈至 npm 的官方外掛。它不會將外掛發佈至 ClawHub，也不會發佈 macOS 或 Windows 成品、GitHub Release、私有儲存庫 dist-tag、Docker 映像、行動裝置成品或網站下載項目。
- 每個一般正式發行版都會一併推出 npm 套件、macOS 應用程式、已簽署的獨立 Android APK，以及已簽署的 Windows Hub 安裝程式。Beta 發行版通常會先驗證並發佈 npm／套件路徑；除非明確要求，原生應用程式的組建／簽署／公證／提升會保留給一般正式版。

## 發行節奏

- 發行流程以 beta 優先；只有在最新 beta 通過驗證後，stable 才會跟進
- 維護者通常會從目前的 `main` 建立 `release/YYYY.M.PATCH` 分支來製作發行版，因此發行驗證與修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發佈但需要修正，維護者會建立下一個 `-beta.N` 標籤，而不會刪除或重建舊標籤
- 詳細的發行程序、核准、認證資訊與復原說明僅供維護者使用

## 每月僅 npm 的 extended-stable 發佈

這是下方一般發行程序的專用例外。對於已結束的月份 `YYYY.M`，請建立 `extended-stable/YYYY.M.33`；並從同一分支發佈 `vYYYY.M.33` 及後續維護修補版本。發行標籤、分支頂端、簽出版本、套件版本、npm 預檢，以及 Full Release Validation 執行都必須指向同一個提交。受保護的 `main` 必須已包含一個日曆月份嚴格較晚且修補版本低於 `33` 的正式版本；即使 `main` 已推進超過一個月，維護修補版本仍符合資格。

在確切的 extended-stable 分支上，將根套件版本提升為 `YYYY.M.P`，執行 `pnpm release:prep`，並確認每個可發佈的擴充套件都有相同版本。提交並推送所有產生的變更，在該提交上建立並推送不可變更的 `vYYYY.M.P` 標籤，並記錄產生的完整 SHA。工作流程會使用這個已準備完成的樹狀內容；它們不會代你提升或同步版本。

從該確切的已準備分支頂端執行 npm 預檢與 Full Release Validation，然後儲存兩者的執行 ID，以及成功的 Full Release Validation 執行嘗試次數：

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

`release_profile=stable` 是現有的驗證深度設定檔；它與 npm `extended-stable` dist-tag 分開，且刻意維持不變。

兩項執行都成功後，從完全相同的分支頂端發佈每個可發佈至 npm 的官方外掛。修補版本 `P` 必須為 `33` 或更高。將完整發行 SHA 作為 `ref` 傳入，等待完整矩陣與登錄檔回讀完成，然後儲存成功的 Plugin NPM Release 執行 ID：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

該工作流程使用一般已準備好的 `all-publishable` 套件清單，包括原始碼未變更的套件。它會在成功前驗證每個確切套件，以及每個外掛的 `extended-stable` 標籤。如果部分執行失敗，請重新執行相同命令：已發佈的套件會重複使用，缺少或過期的外掛標籤會在 npm 發行環境下進行協調，而最終回讀仍會涵蓋完整套件集合。

外掛工作流程成功且 npm 發行環境就緒後，發佈確切的核心預檢 tarball。核心發佈會驗證所引用的外掛執行在相同的標準分支與確切原始碼 SHA 上為 `completed/success`：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

對於刻意無法滿足每月 `.33` 或受保護 `main` 月份政策的分叉或非正式環境演練，請在 npm 預檢與發佈派送中都加入 `-f bypass_extended_stable_guard=true`。預設值為 `false`。只有搭配 `npm_dist_tag=extended-stable` 時才接受略過，且工作流程摘要會記錄此設定。它不會略過標準的 `extended-stable/YYYY.M.33` 工作流程 ref、分支頂端／標籤／簽出版本一致性、正式標籤語法、套件／標籤版本一致性、所引用執行與資訊清單的身分、tarball 來源、環境核准、登錄檔回讀，或選擇器修復證據。

發佈工作流程會驗證所引用的預檢、驗證與外掛執行身分、已準備 tarball 的摘要，以及核心登錄檔選擇器。工作流程成功後，請獨立確認結果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

兩個命令都必須傳回 `YYYY.M.P`。如果發佈成功但選擇器回讀失敗，請勿重新發佈不可變更的套件版本。請使用失敗工作流程之固定執行摘要中列印的單一 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復命令，然後再次執行兩項獨立回讀。回復至先前的選擇器屬於另一項作業人員決策，不是回讀修復路徑。

公開支援文件最初將 Slack、Discord 與 Codex 指定為涵蓋的 extended-stable 外掛介面。該清單是支援聲明，不是發行程式碼的允許清單：每個可發佈至 npm 的官方外掛都遵循相同的確切版本發佈路徑。

下方的一般檢查清單繼續負責 beta、`latest`、GitHub Release、外掛、macOS、Windows，以及其他平台的發佈。請勿針對這個僅 npm 的 extended-stable 路徑執行那些步驟。

## 一般發行作業人員檢查清單

此檢查清單呈現發行流程的公開形式。私密認證資訊、簽署、公證、dist-tag 復原與緊急復原的詳細資訊仍保留在僅供維護者使用的發行操作手冊中。

1. 從目前的 `main` 開始：拉取最新內容、確認目標提交已推送，並確認 `main` 的 CI 狀態足夠正常，可據此建立分支。
2. 根據自上一個可達的發布標籤以來已合併的 PR 和所有直接提交，產生 `CHANGELOG.md` 最上方的章節。條目應面向使用者，去除 PR 與直接提交之間重複的條目，提交並推送，然後在建立分支前再進行一次 rebase／拉取。當已發布但分歧的標籤或後續的向前移植，將已發布的 PR 重新關聯時，請使用 `--shipped-ref` 明確傳入該標籤；驗證程式會使用標籤快照中編號章節內完整貢獻記錄的明確 PR 資料列、忽略 `Unreleased`，並記錄實際排除的 PR 清單與數量。
3. 檢查 `src/plugins/compat/registry.ts` 與 `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍受到涵蓋時，才能移除已到期的相容性；否則請記錄刻意保留它的原因。
4. 從目前的 `main` 建立 `release/YYYY.M.PATCH`。不要直接在 `main` 上執行一般發布工作。
5. 更新標籤所需的每個版本位置，然後執行 `pnpm release:prep`。它會依序重新整理外掛版本、npm shrinkwrap、外掛清單、基礎設定結構描述、隨附頻道設定中繼資料、設定文件基準、外掛 SDK 匯出項目，以及外掛 SDK API 基準。加上標籤前，先提交所有產生的差異，然後執行本機確定性預檢：`pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤尚未存在前，可使用完整的 40 字元發布分支 SHA，僅供驗證預檢使用。預檢會針對實際簽出的相依性圖產生相依套件發布證據，並將其儲存在 npm 預檢成品中。儲存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation`，針對發布分支、標籤或完整提交 SHA 啟動所有發布前測試。這是四大發布測試環境唯一的手動進入點：Vitest、Docker、QA Lab 和 Package。儲存 `full_release_validation_run_id` 與實際的 `full_release_validation_run_attempt`；兩者都是 `OpenClaw NPM Release` 和 `OpenClaw Release Publish` 的必要輸入。
8. 如果驗證失敗，請在發布分支上修正，並重新執行可證明修正有效的最小失敗檔案、lane、工作流程作業、套件設定檔、提供者或模型允許清單。只有在變更的範圍使先前證據失效時，才重新執行完整的統整流程。
9. 對於已加上標籤的 beta 候選版本，請從相符的 `release/YYYY.M.PATCH` 分支執行 `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。若為穩定版，還要傳入必要的 Windows 來源版本：`pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。此輔助程式使用受信任的 `main` 作為工作流程來源，而每個工作流程都以實際標籤為目標。它會將不可變的候選版本／工具身分與已派送的執行 ID 檢查點記錄在 `.artifacts/release-candidate/<tag>/release-candidate-state.json`；重新執行相同命令時，會恢復這些實際執行，而候選版本、工具、設定檔或選項若有任何偏差，都會採取失敗關閉。在派送完整驗證矩陣之前，輔助程式會以確定性方式呈現實際標籤的 GitHub 發布內容，並拒絕缺少版本標題、超出限制且無法使用標準精簡格式的內容，或無法從該標籤到達的貢獻記錄基準／目標來源資訊。它也會根據所參照的累積標籤記錄，驗證任何明確的已發布基準排除中繼資料。接著，它會執行本機產生的發布檢查、派送或驗證完整發布驗證與 npm 預檢證據、針對實際備妥的 tarball 執行 Parallels 全新安裝／更新證明以及 Telegram 套件證明、記錄外掛 npm 與 ClawHub 計畫，並且只有在證據套件全部通過後，才輸出實際的 `OpenClaw Release Publish` 命令。

   `OpenClaw Release Publish` 會將選取的或所有可發布的外掛套件並行發布至 npm，並將相同的套件集發布至 ClawHub；外掛成功發布至 npm 後，再使用相符的 dist-tag 推送已準備好的 OpenClaw npm 預檢成品。發布簽出內容仍作為產品／資料根目錄，而規劃與最終驗證則從完全一致且受信任的工作流程來源簽出內容執行，因此較舊的發布提交無法在未被察覺的情況下使用過時的發布工具。在任何發布子工作開始之前，它會轉譯並快取完全一致的 GitHub 發布版本內文。當完整且相符的 `CHANGELOG.md` 區段同時符合 GitHub 的 125,000 字元限制與轉譯器相符的 125,000 位元組安全上限時，頁面會包含該完全一致的 `## YYYY.M.PATCH` 區段，包括其標題。當來源區段無法符合限制時，頁面會保留完全一致的分組編輯註記，並以指向標籤釘選之 `CHANGELOG.md` 中完整記錄的穩定連結，取代過大的貢獻記錄；絕不發布不完整的記錄或遭截斷的項目符號。工作流程會在加入 `### Release verification` 之前，選擇完整或精簡的內文；若證明尾段會導致內容超出限制，則保留標準內文，並改以不可變更的隨附證據為準。發布至 npm `latest` 的穩定版本會成為 GitHub 最新發布版本，而保留在 npm `beta` 的穩定維護版本則會使用 GitHub `latest=false` 建立。工作流程也會將預檢相依性證據、完整驗證資訊清單，以及發布後的登錄檔驗證證據上傳至 GitHub 發布版本，以供發布後事件回應使用。它會立即列印子工作執行 ID、自動核准工作流程權杖有權核准的發布環境閘門、使用日誌尾段摘要說明失敗的子工作、預先建立 GitHub 發布版本草稿頁面，並在 OpenClaw 發布至 npm 的同時並行推送 Windows 與 Android 成品；這些階段成功後，便完成發布版本頁面與相依性證據；每當 OpenClaw 正在發布至 npm 時都會等待 ClawHub，接著執行受信任主分支的 Beta 驗證器，並上傳 GitHub 發布版本、npm 套件、選取的外掛 npm 套件、選取的 ClawHub 套件、子工作流程執行 ID，以及選用的 NPM Telegram 執行 ID 之發布後證據。ClawHub 啟動驗證器要求完全一致的受信任主分支工作流程路徑與 SHA、產生者與終止執行嘗試、發布 SHA、要求的套件集、不可變更的套件成品組，以及終止登錄檔回讀成品；即使舊版發布參照執行成功，也不予接受。

   接著，針對已發布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 套件執行發布後套件驗收。如果已推送或發布的預發行版本需要修正，請建立下一個相符的預發行版本號；絕對不要刪除或改寫舊版本。

10. 對於穩定版，只有在經過審核的 Beta 版或候選發布版具備所需的驗證證據後，才能繼續。穩定版的 npm 發布也透過 `OpenClaw Release Publish` 進行，並使用 `preflight_run_id` 重複使用成功的預檢成品。穩定版 macOS 發布就緒還需要 `main` 上已有封裝的 `.zip`、`.dmg`、`.dSYM.zip` 與更新後的 `appcast.xml`；macOS 發布工作流程會在發布資產驗證完成後，自動將已簽署的 appcast 發布至公開的 `main`，若分支保護阻擋直接推送，則會開啟或更新 appcast PR。穩定版 Windows Hub 就緒需要 OpenClaw GitHub 發布版本中包含已簽署的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 與 `OpenClawCompanion-SHA256SUMS.txt` 資產。將已簽署的 `openclaw/openclaw-windows-node` 確切發布標籤傳入 `windows_node_tag`，並將經候選版本核准的安裝程式摘要對應表傳入 `windows_node_installer_digests`；`OpenClaw Release Publish` 會保留發布草稿、分派 `Windows Node Release`，並在發布前驗證全部三項資產。
11. 發布後，執行 npm 發布後驗證器；需要發布後的頻道證明時，可選擇執行獨立的已發布 npm Telegram E2E；視需要提升 dist-tag、驗證產生的 GitHub 發布頁面、執行發布公告步驟，然後完成[穩定版 main 收尾](#stable-main-closeout)，之後才能宣布穩定版發布完成。

## 穩定版 main 收尾

穩定版發布必須等到 `main` 包含實際已發布的版本狀態後才算完成。

1. 從全新且最新的 `main` 開始。對照稽核 `release/YYYY.M.PATCH`，並將 `main` 中缺少的實際修正向前移植。不要盲目將僅供發布版本使用的相容性、測試或驗證配接器合併至較新的 `main`。
2. 將 `main` 設為已發布的穩定版本，而不是推測中的下一個發布系列。變更根目錄版本後執行 `pnpm release:prep`，接著執行 `pnpm deps:shrinkwrap:generate`。
3. 讓 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 區段與已加標籤的發布分支完全一致。若 Mac 版本發布時包含穩定版 `appcast.xml` 更新，也要納入該更新。
4. 在操作人員明確啟動該發布系列之前，不要將 `YYYY.M.PATCH+1`、Beta 版本或空白的未來變更記錄區段加入 `main`。
5. 執行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送後，先確認 `origin/main` 包含已發布的版本與變更記錄，再宣告穩定版發布完成。
6. 每次完成私有回復演練後，讓儲存庫變數 `RELEASE_ROLLBACK_DRILL_ID` 和 `RELEASE_ROLLBACK_DRILL_DATE` 保持最新。

`OpenClaw Stable Main Closeout` 從穩定版發布後，包含已發布版本、變更記錄與 appcast 的 `main` 推送開始。它會讀取不可變的發布後證據，將已發布的標籤繫結至其完整發布驗證與發布執行，接著驗證穩定版主線狀態、發布、必要的穩定版觀察期，以及具阻擋作用的效能證據。它會將不可變的結案資訊清單與校驗碼附加至 GitHub 發布。自動推送觸發程序會略過早於不可變發布後證據的舊版發布，且絕不會將該略過視為已完成結案。

完整結案需要同時具備兩項資產以及相符的校驗碼。部分資訊清單會重播其中記錄的 `main` SHA 與回復演練，以重新產生完全相同的位元組，接著附加缺少的校驗碼；無效的配對，或只有校驗碼而沒有資訊清單，都會持續形成阻擋。若推送觸發的執行缺少回復演練儲存庫變數，便會略過且不完成結案；缺少演練記錄或記錄超過 90 天，仍會阻擋以證據為依據的手動結案。私有復原命令會保留在僅供維護者使用的操作手冊中。只有在修復或重播以證據為依據的穩定版結案時，才使用手動分派。

只有當修正標籤解析至與基礎穩定版標籤相同的原始碼提交時，舊版備援修正標籤才能重複使用基礎套件證據。其 Android 發布會重複使用基礎標籤已驗證的 APK，並加入修正標籤的來源證明。若修正使用不同的原始碼，就必須發布並驗證自己的套件證據，且使用更高的 Android `versionCode`。

## 發布前檢查

- 在發布前置檢查之前執行 `pnpm check:test-types`，確保測試 TypeScript 在較快速的本機 `pnpm check` 閘門之外仍有涵蓋。
- 在發布前置檢查之前執行 `pnpm check:architecture`，確保範圍更廣的匯入循環與架構邊界檢查在較快速的本機閘門之外皆通過。
- 在 `pnpm release:check` 之前執行 `pnpm build && pnpm ui:build`，確保封裝驗證步驟所需的 `dist/*` 發布成品與 Control UI 套件組合均已存在。
- 在根版本提升之後、建立標籤之前執行 `pnpm release:prep`。它會執行所有在版本、設定或 API 變更後通常容易產生偏差的確定性發布產生器：外掛版本、npm shrinkwrap、外掛清單、基礎設定結構描述、內建頻道設定中繼資料、設定文件基準、外掛 SDK 匯出，以及外掛 SDK API 基準。`pnpm release:check` 會以檢查模式重新執行這些防護檢查（另加外掛 SDK 表面預算檢查），並在執行套件發布檢查前，一次回報所有產生內容偏差失敗。
- 根據預設，外掛版本同步會將可發布的 `@openclaw/ai` 執行階段套件、官方外掛套件版本，以及現有的 `openclaw.compat.pluginApi` 最低版本更新為 OpenClaw 發布版本。請將該欄位視為外掛 SDK／執行階段 API 的最低版本，而不只是套件版本的副本：若僅發布外掛，且刻意維持與較舊 OpenClaw 主機的相容性，請將最低版本保留為支援的最舊主機 API，並在外掛發布證明中記錄此選擇。
- 在核准發布之前執行手動 `Full Release Validation` 工作流程，以從單一進入點啟動所有發布前測試環境。它接受分支、標籤或完整提交 SHA，分派手動 `CI`，並分派 `OpenClaw Release Checks`，以執行安裝冒煙測試、套件驗收、跨作業系統套件檢查、QA Lab 一致性、Matrix 與 Telegram 測試通道。穩定版與完整執行一律包含詳盡的即時／E2E 與 Docker 發布路徑耐久測試；保留 `run_release_soak=true` 以明確執行 beta 耐久測試。套件驗收會在候選版本驗證期間提供標準的套件 Telegram E2E，避免同時執行第二個即時輪詢程式。

  發布 beta 後提供 `release_package_spec`，即可在各項發布檢查、套件驗收與套件 Telegram E2E 中重複使用已發布的 npm 套件，而無須重新建置發布 tarball。只有當 Telegram 應使用與其餘發布驗證不同的已發布套件時，才提供 `npm_telegram_package_spec`。當套件驗收應使用與發布套件規格不同的已發布套件時，提供 `package_acceptance_package_spec`。當發布證據報告應證明驗證結果與已發布的 npm 套件相符，但不強制執行 Telegram E2E 時，提供 `evidence_package_spec`。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- 若要在發布工作持續進行時，為套件候選版本取得旁路證明，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或確切發布版本使用 `source=npm`；若要使用目前的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支／標籤／SHA，請使用 `source=ref`；對具有必要 SHA-256 與嚴格公開 URL 政策的公開 HTTPS tarball 使用 `source=url`；對使用必要 `trusted_source_id` 與 SHA-256 的具名受信任來源政策使用 `source=trusted-url`；或對由其他 GitHub Actions 執行所上傳的 tarball 使用 `source=artifact`。

  此工作流程會將候選版本解析為 `package-under-test`，針對該 tarball 重複使用 Docker E2E 發布排程器，並可透過 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一個 tarball 執行 Telegram QA。當選取的 Docker 測試通道包含 `published-upgrade-survivor` 時，套件成品即為候選版本，而 `published_upgrade_survivor_baseline` 會選取已發布的基準版本。`update-restart-auth` 會同時將候選套件用作已安裝的命令列介面與待測套件，以測試候選版本更新命令的受管理重新啟動路徑。

  範例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常用設定檔：
  - `smoke`：安裝／頻道／代理程式、閘道網路，以及設定重新載入測試通道
  - `package`：以成品為原生基礎的套件／更新／重新啟動／外掛測試通道，不含 OpenWebUI 或即時 ClawHub
  - `product`：套件設定檔加上 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋與 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker 發布路徑區塊
  - `custom`：精確選取 `docker_lanes`，以進行聚焦的重新執行

- 如果只需要發布候選版本的確定性一般 CI 涵蓋範圍，請直接執行手動 `CI` 工作流程。手動 CI 分派會略過變更範圍限定，並強制執行 Linux Node 分片、內建外掛分片、外掛與頻道契約分片、Node 22 相容性、`check-*`、`check-additional-*`、已建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS，以及 Control UI 國際化測試通道。獨立手動 CI 只有在分派時設定 `include_android=true` 才會執行 Android；`Full Release Validation` 會將該輸入傳給其 CI 子工作流程。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 驗證發布遙測時，執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器測試 QA Lab，並驗證追蹤、指標與日誌匯出，以及有界的追蹤屬性和內容／識別碼遮蔽，而不需要 Opik、Langfuse 或其他外部收集器。
- 驗證收集器相容性時，執行 `pnpm qa:otel:collector-smoke`。它會先將相同的 QA Lab OTLP 匯出路由通過真正的 OpenTelemetry Collector Docker 容器，再執行本機接收器判斷提示。
- 驗證受保護的 Prometheus 抓取時，執行 `pnpm qa:prometheus:smoke`。它會測試 QA Lab、拒絕未經驗證的抓取，並確認發布關鍵指標系列不含提示內容、原始識別碼、驗證權杖與本機路徑。
- 執行 `pnpm qa:observability:smoke`，依序執行來源簽出版本的 OpenTelemetry 與 Prometheus 冒煙測試通道。
- 在每個有標籤的發布之前執行 `pnpm release:check`。
- `OpenClaw NPM Release` 前置檢查會在封裝 npm tarball 之前產生相依性發布證據。npm 公告漏洞閘門會阻擋發布。遞移資訊清單風險、相依性所有權／安裝表面，以及相依性變更報告僅作為發布證據。相依性變更報告會比較發布候選版本與前一個可到達的發布標籤。前置檢查會將相依性證據上傳為 `openclaw-release-dependency-evidence-<tag>`，也會將其嵌入已準備的 npm 前置檢查成品內的 `dependency-evidence/`。實際發布路徑會重複使用該前置檢查成品，然後將同一份證據以 `openclaw-<version>-dependency-evidence.zip` 附加至 GitHub 發布版本。
- 標籤存在後，執行 `OpenClaw Release Publish` 以進行會產生變更的發布序列。從受信任的 `main` 分派一般 beta 與穩定版發布；發布標籤仍會選取確切的目標提交，並可指向 `release/YYYY.M.PATCH`。Tideclaw alpha 發布仍保留在其對應的 alpha 分支。傳入成功的 OpenClaw npm `preflight_run_id`、成功的 `full_release_validation_run_id`，以及確切的 `full_release_validation_run_attempt`；除非刻意執行聚焦修復，否則請維持預設外掛發布範圍 `all-publishable`。此工作流程會依序執行外掛 npm 發布、外掛 ClawHub 發布與 OpenClaw npm 發布，避免在外部化外掛之前發布核心套件；Windows 與 Android 升級會在草稿發布頁面上，與核心 npm 發布並行執行。發布重新執行可接續進度：若核心 npm 版本已發布，工作流程會先證明登錄檔 tarball 與標籤的前置檢查成品相符，再略過核心分派；若發布版本已包含經驗證的成品契約，則會略過 Windows／Android 升級，因此重試只會重新執行失敗的階段。聚焦的僅外掛修復需要 `plugin_publish_scope=selected` 與非空白的外掛清單。僅外掛的 `all-publishable` 執行需要完整且不可變的前置檢查與 Full Release Validation 證據；部分證據會遭拒絕。
- 穩定版 `OpenClaw Release Publish` 要求在對應的非預發布 `openclaw/openclaw-windows-node` 發布版本存在後，提供確切的 `windows_node_tag`，以及候選版本已核准的 `windows_node_installer_digests` 對應表。在分派任何發布子工作流程之前，它會驗證該來源發布版本已發布、不是預發布版本、包含必要的 x64／ARM64 安裝程式，且仍與已核准的對應表相符。接著，它會在 OpenClaw 發布版本仍為草稿時分派 `Windows Node Release`，並原封不動地傳遞固定的安裝程式摘要對應表。子工作流程會從該確切標籤下載已簽署的 Windows Hub 安裝程式，將其與固定摘要比對，在 Windows 執行器上驗證其 Authenticode 簽章使用預期的 OpenClaw Foundation 簽署者、寫入 SHA-256 資訊清單，並將安裝程式與資訊清單上傳至標準 OpenClaw GitHub 發布版本；然後重新下載已升級的成品，並驗證資訊清單成員與雜湊值。父工作流程會在發布前驗證目前的 x64、ARM64 與總和檢查碼成品契約。直接復原會先拒絕非預期的 `OpenClawCompanion-*` 成品名稱，再以固定的來源位元組取代預期的契約成品。

  僅在復原時手動分派 `Windows Node Release`，且一律傳入確切標籤，絕不使用 `latest`，並附上已核准來源發布版本的明確 `expected_installer_digests` JSON 對應表。網站下載連結應指向目前穩定版的確切 OpenClaw 發布成品 URL；只有在驗證 GitHub 的 latest 重新導向指向同一發布版本後，才能使用 `releases/latest/download/...`；請勿只連結至配套儲存庫的發布頁面。

- 發布檢查現在於獨立的手動工作流程中執行：`OpenClaw Release Checks`。在核准發布前，它也會執行 QA Lab 模擬同等性測試通道，以及快速即時 Matrix 設定檔和 Telegram QA 通道。即時通道使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI 認證資訊租約。若要並行執行完整的 Matrix 傳輸、媒體和 E2EE 清查，請以 `matrix_profile=all` 和 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` 工作流程。
- 跨作業系統安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，兩者會直接呼叫可重複使用的工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。這項拆分是刻意為之：讓真正的 npm 發布路徑維持簡短、具確定性，並專注於成品；較慢的即時檢查則留在各自的通道中，以免拖延或阻擋發布。
- 含有密鑰的發布檢查應透過 `Full Release Validation` 分派，或從 `main`／發布工作流程參照分派，以確保工作流程邏輯和密鑰維持受控。
- `OpenClaw Release Checks` 接受分支、標籤或完整的提交 SHA，前提是解析出的提交可從 OpenClaw 分支或發布標籤到達。
- `OpenClaw NPM Release` 的僅驗證預檢也接受目前完整的 40 字元工作流程分支提交 SHA，不要求已推送標籤。該 SHA 路徑僅供驗證，無法提升為真正的發布。在 SHA 模式下，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發布標籤。
- 這兩個工作流程都會在 GitHub 託管的執行器上保留真正的發布與提升路徑，而不會變更狀態的驗證路徑則可使用更大型的 Blacksmith Linux 執行器。
- 該工作流程會同時使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流程密鑰，執行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`。
- npm 發布預檢不再等待獨立的發布檢查通道。
- 在本機標記候選發布版本前，請執行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。此輔助工具會依序執行快速發布防護檢查、外掛 npm／ClawHub 發布檢查、建置、UI 建置，以及 `release:openclaw:npm:check`，以便在 GitHub 發布工作流程啟動前，找出常見的核准阻擋錯誤。
- 核准前，請執行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或對應的預發布／修正版標籤）。
- npm 發布後，請執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或對應的 beta／修正版本），以在全新的暫存前綴中驗證已發布的登錄檔安裝路徑。
- beta 發布後，請執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共用的租用 Telegram 認證資訊池，針對已發布的 npm 套件驗證已安裝套件的初始設定、Telegram 設定，以及真正的 Telegram E2E。本機維護者的一次性執行可省略 Convex 變數，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` 環境認證資訊。
- 若要從維護者電腦執行完整的發布後 beta 冒煙測試，請使用 `pnpm release:beta-smoke -- --beta betaN`。此輔助工具會執行 Parallels npm 更新／全新目標驗證、分派 `NPM Telegram Beta E2E`、輪詢確切的工作流程執行、下載成品，並輸出 Telegram 報告。
- 維護者可透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行相同的發布後檢查。此流程刻意設為僅限手動執行，不會在每次合併時執行。
- 維護者發布自動化採用先預檢再提升的方式：
  - 真正的 npm 發布必須有成功的 npm `preflight_run_id`。
  - 一般 beta 與穩定版的發布協調和預檢，會針對確切的目標標籤使用受信任的 `main`。Tideclaw alpha 發布和預檢則使用對應的 alpha 分支。
  - 穩定版 npm 發布預設使用 `beta`；穩定版 npm 發布可透過工作流程輸入明確指定 `latest`。
  - 以權杖為基礎的 npm dist-tag 變更位於 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而來源儲存庫只保留 OIDC 發布。
  - 公開的 `macOS Release` 僅供驗證；若標籤只存在於發布分支，但工作流程是從 `main` 分派，請設定 `public_release_branch=release/YYYY.M.PATCH`。
  - 真正的 macOS 發布必須有成功的 macOS `preflight_run_id` 和 `validate_run_id`。
  - 真正的發布路徑會提升已準備好的成品，而不是再次重新建置。
- 對於 `YYYY.M.PATCH-N` 之類的穩定修正版，發布後驗證器也會檢查相同的暫存前綴升級路徑，從 `YYYY.M.PATCH` 升級至 `YYYY.M.PATCH-N`，以免發布修正悄悄讓較舊的全域安裝仍停留在基礎穩定版內容。
- 除非壓縮套件同時包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 內容，否則 npm 發布預檢會採取封閉式失敗，以免再次發布空白的瀏覽器儀表板。
- 發布後驗證也會檢查已發布的外掛進入點和套件中繼資料是否存在於已安裝的登錄檔配置中。若發布版本缺少外掛執行階段內容，發布後驗證器便會失敗，且無法提升至 `latest`。
- `pnpm test:install:smoke` 也會對候選更新壓縮套件強制執行 npm pack `unpackedSize` 預算，因此安裝程式 E2E 能在發布流程前攔截意外的封裝膨脹。
- 如果發布工作觸及 CI 規劃、擴充功能計時資訊清單或擴充功能測試矩陣，請在核准前重新產生並檢閱 `.github/workflows/plugin-prerelease.yml` 中由規劃器擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，以免發布說明描述過時的 CI 配置。
- 穩定版 macOS 發布就緒條件也包含更新程式介面：GitHub 發布最終必須包含已封裝的 `.zip`、`.dmg` 和 `.dSYM.zip`；發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip（macOS 發布工作流程會自動提交，若直接推送受阻，則會建立 appcast PR）；已封裝的應用程式必須保有非除錯版套件識別碼、非空的 Sparkle 摘要 URL，以及不低於該發布版本之標準 Sparkle 建置下限的 `CFBundleVersion`。

## 發布測試機

`Full Release Validation` 是操作人員從單一進入點啟動所有發布前測試的方式。若要在快速變動的分支上取得固定提交的證明，請使用此輔助工具，讓每個子工作流程都從固定於單一受信任 `main` 工作流程 SHA 的暫存分支執行，同時讓要求的提交維持為受測候選項目：

```bash
pnpm ci:full-release --sha <full-sha>
```

此輔助工具會擷取目前的 `origin/main`，將受信任的工作流程提交推送至 `release-ci/<workflow-sha>-...`，從暫存分支分派 `Full Release Validation` 並設定 `ref=<target-sha>`，在可用時重複使用嚴格符合確切目標的證據，確認每個子工作流程的 `headSha` 都符合固定的父工作流程 SHA，然後刪除暫存分支。傳入 `-f reuse_evidence=false` 可強制全新執行，或傳入 `--workflow-sha <trusted-main-sha>`，以固定仍可從目前 `origin/main` 到達的較舊提交。工作流程本身絕不寫入儲存庫參照。如此可在不向候選項目加入工具提交的情況下，維持僅限 main 的發布工具可用，並避免意外以較新的 `main` 子工作流程執行作為證明。

若要驗證發布分支或標籤，請從受信任的 `main` 工作流程參照執行，並將發布分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

此工作流程會解析目標參照，使用 `target_ref=<release-ref>` 分派手動 `CI`，然後分派 `OpenClaw Release Checks`。`OpenClaw Release Checks` 會展開執行安裝冒煙測試、跨作業系統發布檢查、啟用浸泡測試時的即時／E2E Docker 發布路徑涵蓋範圍、包含標準 Telegram 套件 E2E 的套件驗收、QA Lab 同等性測試、即時 Matrix，以及即時 Telegram。只有在 `Full Release Validation` 摘要顯示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 均成功時，完整／全部執行才可接受；但刻意略過獨立 `Plugin Prerelease` 子項目的聚焦重新執行除外。只有在使用 `release_package_spec` 或 `npm_telegram_package_spec`，針對已發布套件進行聚焦重新執行時，才使用獨立的 `npm-telegram` 子項目。最終驗證器摘要包含每個子項目執行的最慢工作表格，因此發布管理員不必下載記錄，即可查看目前的關鍵路徑。

在此發布路徑中，產品效能子項目僅產生成品。傘狀流程會以
`publish_reports=false` 分派它，而且除非其僅成品防護檢查證明 Clawgrit 報告發布器維持
略過狀態，否則驗證會遭拒絕。

完整的階段矩陣、確切的工作流程工作名稱、穩定版與完整設定檔差異、成品及聚焦重新執行控制方式，請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)。

即使目標 `ref` 指向較舊的發布分支或標籤，子工作流程也會從執行 `Full Release Validation` 的受信任參照分派，通常是 `--ref main`。每個子項目執行都必須使用確切的父工作流程 SHA；若 `main` 在子項目分派解析前已前進，傘狀流程會採取封閉式失敗。沒有獨立的 Full Release Validation 工作流程參照輸入；請透過選擇工作流程執行參照來選擇受信任的測試架構。請勿使用 `--ref main -f ref=<sha>`，在變動中的 `main` 上取得確切提交證明；原始提交 SHA 無法作為工作流程分派參照，因此請使用 `pnpm ci:full-release --sha <target-sha>`，在受信任的 `origin/main` 建立暫存分支，同時將目標 SHA 保留為候選輸入。

使用 `release_profile` 選擇即時／供應商涵蓋廣度：

- `minimum`：最快的發布關鍵 OpenAI／核心即時與 Docker 路徑
- `stable`：minimum 加上用於發布核准的穩定供應商／後端涵蓋範圍
- `full`：stable 加上廣泛的建議性供應商／媒體涵蓋範圍

穩定版和完整驗證在提升前，一律會執行詳盡的即時／E2E、Docker 發布路徑，以及有界限的已發布升級存續掃描。若要為 beta 要求相同的掃描，請使用 `run_release_soak=true`。該掃描涵蓋最新四個穩定版套件，以及固定的 `2026.4.23` 和 `2026.5.2` 基準，另加較舊的 `2026.4.15` 涵蓋範圍；重複的基準會被移除，每個基準會分片至各自的 Docker 執行器工作。

`OpenClaw Release Checks` 會使用受信任的工作流程參照，將目標參照解析一次為 `release-package-under-test`，並在執行浸泡測試時，於跨作業系統、套件驗收和發布路徑 Docker 檢查中重複使用該成品。如此可讓所有面向套件的測試機使用相同位元組，並避免重複建置套件。beta 已上架 npm 後，請設定 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，讓發布檢查只下載一次已發布套件、從 `dist/build-info.json` 擷取其建置來源 SHA，並在跨作業系統、套件驗收、發布路徑 Docker 和套件 Telegram 通道中重複使用該成品。

當儲存庫／組織變數已設定時，跨作業系統 OpenAI 安裝冒煙測試會使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.6-luna`，因為此通道要證明的是套件安裝、初始設定、閘道啟動，以及一次即時代理程式回合，而不是對最強大的模型進行效能評測。更廣泛的即時供應商矩陣仍是模型特定涵蓋範圍的所在。

請依發布階段使用以下變體：

```bash
# 驗證尚未發布的候選版本分支。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# 驗證已推送的確切提交。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# 發布 beta 版後，新增已發布套件的 Telegram E2E。
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

進行針對性修正後，第一次重新執行時不要使用完整的統合流程。若其中一個驗證環境失敗，下一次驗證請使用失敗的子工作流程、工作、Docker 測試通道、套件設定檔、模型供應商或 QA 測試通道。只有在修正變更了共用的發布協調流程，或使先前所有驗證環境的證據失效時，才再次執行完整統合流程。統合流程的最終驗證器會重新檢查已記錄的子工作流程執行 ID，因此成功重新執行子工作流程後，只需重新執行失敗的 `Verify full validation` 父工作。

只有當先前成功的統合流程執行驗證了完全相同的目標 SHA、發布設定檔、實際生效的浸泡測試設定及驗證輸入時，`rerun_group=all` 才能重複使用該次執行。這是用於重新執行相同候選版本的有限復原機制，而非跨 SHA 重複使用證據。若候選版本有所變更，包括僅變更更新日誌或版本的提交，請重新執行所有受變更路徑或成品雜湊影響的套件、成品、安裝、Docker 或供應商閘門。同一 `release/*` 參照和重新執行群組的較新統合流程執行會自動取代進行中的執行。傳入 `reuse_evidence=false` 可強制執行全新的完整流程。

若要進行有限復原，請將 `rerun_group` 傳給統合流程。`all` 是實際的候選版本執行，`ci` 僅執行一般 CI 子流程，`plugin-prerelease` 僅執行發布專用的外掛子流程，`release-checks` 執行所有發布驗證環境，而範圍更窄的發布群組包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。針對性的 `npm-telegram` 重新執行需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整／全部執行會使用 Package Acceptance 內的標準套件 Telegram E2E。針對性的跨作業系統重新執行可加入 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統／測試套件篩選器。QA 發布檢查失敗會阻擋一般發布驗證，包括標準層級中必要的 OpenClaw 動態工具漂移檢查。Tideclaw alpha 執行仍可將與套件安全無關的發布檢查測試通道視為建議性檢查。使用 `release_profile=beta` 時，`Run repo/live E2E validation` 的即時供應商測試套件屬於建議性檢查（產生警告而非阻擋）；stable 和 full 設定檔仍將其視為阻擋條件。當 `live_suite_filter` 明確要求受閘門控管的 QA 即時測試通道（例如 Discord、WhatsApp 或 Slack）時，必須啟用相符的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫變數；否則輸入擷取會失敗，而非默默略過該測試通道。

### Vitest

Vitest 驗證環境是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍限定，並對候選版本強制執行一般測試圖：Linux Node 分片、內建外掛分片、外掛與頻道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品煙霧檢查、文件檢查、Python Skills、Windows、macOS，以及 Control UI 國際化。由於統合流程會傳入 `include_android=true`，因此當 `Full Release Validation` 執行此驗證環境時會包含 Android；獨立手動 CI 需要 `include_android=true` 才會涵蓋 Android。

使用此驗證環境回答「原始碼樹是否通過完整的一般測試套件？」它不同於發布路徑的產品驗證。應保留的證據：

- 顯示已派送 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 在確切目標 SHA 上成功執行
- 調查迴歸問題時，CI 工作中失敗或緩慢的分片名稱
- 執行需要效能分析時，Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有在發布需要具確定性的一般 CI，但不需要 Docker、QA Lab、即時、跨作業系統或套件驗證環境時，才直接執行手動 CI。非 Android 的直接 CI 請使用第一個命令。當直接執行的候選版本 CI 必須涵蓋 Android 時，請加入 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 驗證環境位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml` 執行，另加發布模式的 `install-smoke` 工作流程。它透過封裝後的 Docker 環境驗證候選版本，而不只執行原始碼層級測試。

發布 Docker 涵蓋範圍包括：

- 完整安裝煙霧測試，並啟用耗時較長的 Bun 全域安裝煙霧測試
- 依目標 SHA 準備／重複使用根 Dockerfile 煙霧測試映像，QR、root／閘道及安裝程式／Bun 煙霧測試工作會以獨立的 install-smoke 分片執行
- 儲存庫 E2E 測試通道
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 至 `plugins-runtime-install-h`，以及 `openwebui`
- 提出要求時，在專用的大容量磁碟執行器上執行 OpenWebUI 涵蓋測試
- 拆分的內建外掛安裝／解除安裝測試通道 `bundled-plugin-install-uninstall-0` 至 `bundled-plugin-install-uninstall-23`
- 發布檢查包含即時測試套件時，執行即時／E2E 供應商測試套件及 Docker 即時模型涵蓋測試

重新執行前請先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含測試通道記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON 及重新執行命令。若要進行針對性復原，請在可重複使用的即時／E2E 工作流程中使用 `docker_lanes=<lane[,lane]>`，而非重新執行所有發布區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 及已準備的 Docker 映像輸入，因此失敗的測試通道可重複使用相同的 tarball 和 GHCR 映像。

### QA Lab

QA Lab 驗證環境也是 `OpenClaw Release Checks` 的一部分。它是代理行為及頻道層級的發布閘門，與 Vitest 和 Docker 套件機制分開。

發布 QA Lab 涵蓋範圍包括：

- 使用代理同等性套件，將 OpenAI 候選測試通道與 `anthropic/claude-opus-4-8` 基準比較的模擬同等性測試通道
- 使用 `qa-live-shared` 環境的快速即時 Matrix QA 設定檔
- 使用 Convex CI 認證資訊租約的即時 Telegram QA 測試通道
- 當發布遙測需要明確的本機證明時，執行 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此驗證環境回答「發布版本在 QA 情境及即時頻道流程中的行為是否正確？」核准發布時，請保留同等性、Matrix 和 Telegram 測試通道的成品 URL。完整的 Matrix 涵蓋測試仍可透過手動分片 QA-Lab 執行，不屬於預設的發布關鍵測試通道。

### 套件

套件驗證環境是可安裝產品的閘門。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選版本正規化為供 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並將工作流程測試框架參照與套件來源參照分開保存。

支援的候選版本來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或確切的 OpenClaw 發布版本
- `source=ref`：使用所選的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載公開 HTTPS `.tgz`，且必須提供 `package_sha256`；系統會拒絕 URL 認證資訊、非預設 HTTPS 連接埠、私人／內部／特殊用途主機名稱或解析後位址，以及不安全的重新導向
- `source=trusted-url`：從 `.github/package-trusted-sources.json` 中的具名政策下載 HTTPS `.tgz`，且必須提供 `package_sha256` 和 `trusted_source_id`；維護者擁有的企業鏡像或私人套件儲存庫應使用此方式，而非為 `source=url` 新增輸入層級的私人網路略過機制
- `source=artifact`：重複使用其他 GitHub Actions 執行所上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape` 及 `telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對同一個已解析的 tarball，保留遷移、更新、root 管理的 VPS 升級、已設定驗證資訊的更新重新啟動、即時 ClawHub Skill 安裝、過時外掛相依套件清理、離線外掛測試資料、外掛更新、外掛命令繫結逸出強化及 Telegram 套件 QA。具阻擋性的發布檢查會使用預設的最新已發布套件基準；搭配 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 設定檔，會將已發布版本升級存續測試擴大至 `last-stable-4`，再加上固定的 `2026.4.23`、`2026.5.2` 和 `2026.4.15` 基準，並執行 `reported-issues` 情境。對於已發布的候選版本，請搭配 `source=npm` 使用 Package Acceptance；對於發布前以 SHA 為依據的本機 npm tarball，使用 `source=ref`；對於維護者擁有的企業／私人鏡像，使用 `source=trusted-url`；對於其他 GitHub Actions 執行上傳的已準備 tarball，則使用 `source=artifact`。

它是在 GitHub 原生環境中取代過去大部分需要 Parallels 才能執行的套件／更新涵蓋測試。跨作業系統發布檢查對作業系統特定的新手設定、安裝程式及平台行為仍然重要，但套件／更新產品驗證應優先使用 Package Acceptance。

更新與外掛驗證的標準檢查清單為[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。在決定要使用哪個本機、Docker、Package Acceptance 或發布檢查測試通道來證明外掛安裝／更新、doctor 清理或已發布套件遷移變更時，請使用此清單。從每個穩定版 `2026.4.23+` 套件執行的完整已發布更新遷移，屬於獨立的手動 `Update Migration` 工作流程，不包含在 Full Release CI 中。

舊版 package-acceptance 的寬容機制刻意設有時限。截至 `2026.4.25` 的套件可針對已發布至 npm 的中繼資料缺漏使用相容性路徑：tarball 中缺少私人 QA 清單項目、缺少 `gateway install --wrapper`、由 tarball 衍生的 git 測試資料中缺少修補檔案、缺少持久化的 `update.channel`、舊版外掛安裝記錄位置、缺少市集安裝記錄持久化，以及在執行 `plugins update` 時進行設定中繼資料遷移。已發布的 `2026.4.26` 套件可能會針對已隨版本發布的本機建置中繼資料戳記檔案發出警告。較新的套件必須符合現代套件合約；相同缺漏會導致發布驗證失敗。

當發布問題涉及實際可安裝套件時，請使用範圍更廣的 Package Acceptance 設定檔：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常用套件設定檔：

- `smoke`：快速套件安裝／頻道／代理、閘道網路與設定重新載入執行路徑
- `package`：安裝／更新／重新啟動／外掛套件合約，以及即時 ClawHub skill 安裝證明；這是發布檢查的預設值
- `product`：`package` 加上 MCP 頻道、排程／子代理清理、OpenAI 網頁搜尋及 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：用於聚焦重新執行的確切 `docker_lanes` 清單

若要驗證候選套件的 Telegram，請在 Package Acceptance 啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。此工作流程會將解析後的 `package-under-test` tarball 傳入 Telegram 執行路徑；獨立的 Telegram 工作流程仍接受已發布的 npm 規格，以進行發布後檢查。

## 一般發布自動化

針對 beta、`latest`、外掛、GitHub Release 與平台發布，
`OpenClaw Release Publish` 是一般的變更入口點。每月
`.33+` 的僅限 npm 延伸穩定版路徑不使用此協調器。一般
工作流程會依照發布需求的順序協調受信任發布者工作流程：

1. 簽出發布標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 到達（alpha 預發布版本亦可從 Tideclaw alpha 分支到達）。
3. 執行 `pnpm plugins:sync:check`。
4. 分派 `Plugin NPM Release`，並設定 `publish_scope=all-publishable` 與 `ref=<release-sha>`。
5. 使用相同範圍與 SHA 分派 `Plugin ClawHub Release`。
6. 驗證已儲存的 `full_release_validation_run_id` 與確切執行嘗試次數後，使用發布標籤、npm dist-tag 及已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。
7. 對於穩定版發布，以草稿形式建立或更新 GitHub release，使用明確的 `windows_node_tag` 與候選版本核准的 `windows_node_installer_digests` 分派 `Windows Node Release`，並驗證標準 Windows 安裝程式／總和檢查碼資產。同時分派 `Android Release`，建置確切標籤的已簽署 APK，以及總和檢查碼與來源證明。發布草稿前，請驗證兩項原生資產合約。

Beta 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

將穩定版發布至預設 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

直接將穩定版提升至 `latest` 必須明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

僅在聚焦修復或重新發布作業時，才使用較低階的 `Plugin NPM Release` 與 `Plugin ClawHub Release` 工作流程。當 `publish_openclaw_npm=true` 時，`OpenClaw Release Publish` 會拒絕 `plugin_publish_scope=selected`，以免核心套件在未包含所有可發布的官方外掛（包括 `@openclaw/diffs-language-pack`）時發布。若要修復選定的外掛，請設定 `publish_openclaw_npm=false`、`plugin_publish_scope=selected` 與 `plugins=@openclaw/name`，或直接分派子工作流程。

首次發布的 ClawHub 啟動程序屬於例外：從受信任的 `main` 分派 `Plugin ClawHub New`，
並透過 `ref` 傳入完整的目標發布 SHA。
絕不可從發布標籤或分支執行啟動工作流程本身：

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

標籤前驗證要求 `dry_run=true`、拒絕發布標籤與父執行
輸入，且僅接受可從 `main` 或 `release/*` 到達的確切目標。
它不會載入 ClawHub 認證資訊、發布套件位元組，或變更受信任
發布者設定。此工作流程仍會解析即時 registry 計畫，
僅在無機密資訊的工作中簽出並封裝目標、具體化
鎖定的 ClawHub 工具鏈，並在發布標籤存在前驗證不可變資產及套件
slug／身分。僅在無機密資訊的封裝工作完成後，才核准
`clawhub-plugin-bootstrap` 環境；此受保護的驗證工作沒有認證資訊或變更指令。

已核准的試執行或標記後的實際啟動程序，必須包含確切的
發布標籤，以及父層 `OpenClaw Release Publish` 的執行 ID、嘗試次數與
分支。父層會證明其自身的工作流程 SHA，以及 `Plugin ClawHub New` 使用的另一個確切受信任
`main` SHA；子執行與每項受保護
環境核准都必須符合該已核准的子層 SHA。每次發布嘗試與受信任發布者變更前，
都會重新檢查發布標籤。

封裝工作會
上傳一項不可變資產，其名稱、Actions 資產 ID／摘要、
產生者執行／嘗試次數、目標 SHA，以及每個套件 tarball 的 SHA-256／大小，
都會傳入驗證與受保護的工作。受保護的工作僅簽出受信任的 `main`
工具，透過 GitHub API 驗證資產 tuple，依確切資產 ID 下載，
重新雜湊每個 tarball，並依固定版本命令列介面的 USTAR 標準化規則驗證本機 TAR 路徑與
套件身分。之後，每個候選版本都會通過固定版本命令列介面的發布試執行；該試執行會在
registry 查詢或驗證前返回。認證資訊工作預先篩選器將壓縮的 ClawPack
限制為 120 MiB、檔案承載總量限制為 50 MiB、展開後 TAR 資料限制為 64 MiB，並將
TAR 項目數限制為 10,000。現有套件的受信任發布者修復仍為
僅設定，但它仍會封裝目標，並要求指定的標籤以及確切的 registry 位元組與中繼資料完全一致，
才會變更受信任發布者設定。發布後驗證會下載 ClawHub 資產，並
要求相同的 SHA-256 與大小。僅當確切的產生者工作已
成功完成時，重新執行失敗工作的復原程序才可重用先前
嘗試的套件資產。最終證據也會繫結鎖定的 ClawHub 版本、鎖定檔
SHA-256 與 npm 完整性資訊。若不相符，則必須使用新的套件版本。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作者控制的輸入：

- `tag`：必要的發布標籤，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；當 `preflight_only=true` 時，也可以是目前完整的 40 字元工作流程分支 commit SHA，供僅驗證的預先檢查使用
- `preflight_only`：`true` 表示僅驗證／建置／封裝，`false` 表示實際發布路徑
- `preflight_run_id`：既有且成功的預先檢查執行 ID；實際發布路徑中為必要項目，使工作流程重用已準備的 tarball，而非重新建置
- `full_release_validation_run_id`：此標籤／SHA 成功的 `Full Release Validation` 執行 ID；實際發布時為必要項目。Beta 發布可僅憑預先檢查並附帶警告繼續，但穩定版／`latest` 提升仍然需要此項。
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數執行嘗試次數；只要提供執行 ID 就必須提供此項，以免重新執行在發布期間變更授權證據。
- `release_publish_run_id`：已核准的 `OpenClaw Release Publish` 執行 ID；當此工作流程由該父層分派時（機器人執行者的實際發布呼叫）為必要項目
- `plugin_npm_run_id`：成功且精確對應 head 的 `Plugin NPM Release` 執行 ID；實際發布 `extended-stable` 核心套件時為必要項目
- `npm_dist_tag`：發布路徑的 npm 目標標籤；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，預設為 `beta`。最終修訂版 `33` 及之後的版本必須使用 `extended-stable`；預設情況下，`extended-stable` 會拒絕更早的修訂版，且一律拒絕非最終標籤。
- `bypass_extended_stable_guard`：僅供測試的布林值，預設為 `false`；搭配 `npm_dist_tag=extended-stable` 時，略過每月延伸穩定版資格檢查，同時保留發布身分、資產、核准及回讀檢查。

`Plugin NPM Release` 接受 `npm_dist_tag=default` 以沿用既有發布
行為，或接受 `npm_dist_tag=extended-stable` 以使用受保護的每月路徑。
延伸穩定版選項要求 `publish_scope=all-publishable`、空白的
`plugins` 輸入、修訂版至少為 `33` 的最終版本，以及位於確切頂端的標準
`extended-stable/YYYY.M.33` 分支。它絕不會移動外掛的
`latest` 或 `beta`。新套件版本會透過 OIDC 受信任發布，以不可分割的方式取得 `extended-stable`
（`npm publish --tag extended-stable`）；此來源工作流程不使用以權杖驗證的 `npm dist-tag add`。重試時
會略過 npm 中已存在的確切版本，然後採取封閉式失敗，除非完整
回讀確認每個確切套件及 `extended-stable` 標籤都已收斂。

`OpenClaw Release Publish` 接受以下由操作者控制的輸入：

- `tag`：必要的發布標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預先檢查執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時為必要項目
- `full_release_validation_run_id`：成功的 `Full Release Validation` 執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時為必要項目
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數嘗試次數；只要提供執行 ID 就必須提供此項
- `windows_node_tag`：確切且非預發布版本的 `openclaw/openclaw-windows-node` 發布標籤；穩定版 OpenClaw 發布時為必要項目
- `windows_node_installer_digests`：候選版本核准的精簡 JSON 對應表，將目前的 Windows 安裝程式名稱對應至固定的 `sha256:` 摘要；穩定版 OpenClaw 發布時為必要項目
- `npm_telegram_run_id`：選用的成功 `NPM Telegram Beta E2E` 執行 ID，納入最終發布證據
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤，可為 `alpha`、`beta` 或 `latest`
- `plugin_publish_scope`：預設為 `all-publishable`；僅在 `publish_openclaw_npm=false` 的聚焦外掛修復作業中使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；僅在將此工作流程用作僅限外掛的修復協調器時設為 `false`
- `release_profile`：用於發布證據摘要的發布涵蓋設定檔；預設為 `from-validation`，會從驗證資訊清單讀取，亦可使用 `beta`、`stable` 或 `full` 覆寫
- `wait_for_clawhub`：預設為 `false`，因此 npm 可用性不會被 ClawHub 輔助程序阻擋；僅當工作流程完成必須包含 ClawHub 完成時，才設為 `true`

`OpenClaw Release Checks` 接受以下由操作者控制的輸入：

- `ref`：要驗證的分支、標籤或完整 commit SHA。包含機密資訊的檢查要求解析後的 commit 可從 OpenClaw 分支或發布標籤到達。
- `run_release_soak`：在 beta 發布檢查中選擇加入完整的即時／E2E、Docker 發布路徑，以及全部歷史版本升級存活浸泡測試。`release_profile=stable` 與 `release_profile=full` 會強制啟用此項。

規則：

- 修訂版號低於 `33` 的一般正式版與修正版可發布至 `beta` 或 `latest`。修訂版號為 `33` 或以上的正式版必須發布至 `extended-stable`，而位於此分界的修正尾碼版本會遭到拒絕。
- Beta 預發行標籤只能發布至 `beta`；alpha 預發行標籤只能發布至 `alpha`
- 對於 `OpenClaw NPM Release`，僅當 `preflight_only=true` 時才允許輸入完整的提交 SHA
- `OpenClaw Release Checks` 與 `Full Release Validation` 一律只進行驗證
- 實際發布路徑必須使用預檢期間所用的相同 `npm_dist_tag`；工作流程會先驗證該中繼資料，再繼續發布

## 一般 beta/latest 穩定版發布順序

此舊版順序適用於一般的協調式發布，該流程也負責外掛、GitHub Release、Windows 及其他平台工作。這不是本頁頂端記載的每月 `.33+`、僅限 npm 的延伸穩定版路徑。

建立一般的協調式穩定版時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。標籤存在之前，你可以使用目前工作流程分支的完整提交 SHA，對預檢工作流程進行僅驗證的試執行。
2. 一般先發布 beta 的流程請選擇 `npm_dist_tag=beta`；只有刻意要直接發布穩定版時，才選擇 `latest`。
3. 如果你希望透過單一手動工作流程，對發布分支、發布標籤或完整提交 SHA 執行一般 CI，並涵蓋即時提示快取、Docker、QA Lab、Matrix 與 Telegram，請執行 `Full Release Validation`。如果你刻意只需要具決定性的一般測試圖，則改為在發布參照上執行手動 `CI` 工作流程。
4. 選取確切且非預發行的 `openclaw/openclaw-windows-node` 發布標籤，其已簽署的 x64 與 ARM64 安裝程式將隨版本發布。將其儲存為 `windows_node_tag`，並將這些安裝程式經驗證的摘要對應表儲存為 `windows_node_installer_digests`。候選發布版輔助工具會記錄兩者，並將其納入所產生的發布命令中。
5. 儲存成功的 `preflight_run_id`、`full_release_validation_run_id`，以及確切的 `full_release_validation_run_attempt`。
6. 從受信任的 `main` 執行 `OpenClaw Release Publish`，並提供相同的 `tag`、相同的 `npm_dist_tag`、選取的 `windows_node_tag`、其已儲存的 `windows_node_installer_digests`，以及已儲存的 `preflight_run_id`、`full_release_validation_run_id` 和 `full_release_validation_run_attempt`。它會先將外部化的外掛發布至 npm 與 ClawHub，再提升 OpenClaw npm 套件。
7. 如果版本發布至 `beta`，請使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 提升至 `latest`。
8. 如果版本刻意直接發布至 `latest`，而 `beta` 應立即跟隨相同的穩定組建，請使用相同的發布工作流程，將兩個 dist-tag 都指向該穩定版本；或者讓其排程的自我修復同步稍後移動 `beta`。

dist-tag 變更位於發布帳本儲存庫中，因為它仍需要 `NPM_TOKEN`，而原始碼儲存庫則維持僅透過 OIDC 發布。這能讓直接發布路徑與先發布 beta 的提升路徑都具備文件記載，且可供操作人員查看。

如果維護者必須改用本機 npm 驗證，請只在專用的 tmux 工作階段內執行任何 1Password 命令列介面 (`op`) 命令。請勿直接從主要代理程式 shell 呼叫 `op`；將其保留在 tmux 中，可讓提示、警示及 OTP 處理保持可觀察，並避免主機重複發出警示。

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

維護者會使用 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) 中的私人發布文件作為實際操作手冊。

## 相關內容

- [發布管道](/zh-TW/install/development-channels)
