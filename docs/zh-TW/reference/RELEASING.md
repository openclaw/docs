---
read_when:
    - 正在尋找公開發布頻道的定義
    - 執行版本發布驗證或套件驗收
    - 尋找版本命名與發布週期資訊
summary: 發布通道、操作人員檢查清單、驗證環境、版本命名與發布節奏
title: 發布政策
x-i18n:
    generated_at: "2026-07-22T10:45:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 347bbdefeca44d652d7222f0d80724c675c540b8f4ea5527475e3c4e2e7b4c4b
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前提供三個面向使用者的更新管道：

- stable：現有的正式推廣發行管道，在獨立的命令列介面／管道里程碑完成前，仍會透過 npm `latest` 解析
- beta：發佈至 npm `beta` 的預發行標籤
- dev：`main` 持續移動的最新版本

另外，發行作業人員可以將前一個已結束月份的核心套件發佈至 npm `extended-stable`，從修補版本 `33` 開始。當月的一般最終版本線會繼續使用 npm `latest`；僅此作業人員端的發佈分流本身不會變更命令列介面的更新管道解析方式。

Tideclaw Alpha 組建是另一個內部預發行軌道（npm dist-tag `alpha`），詳見 [NPM 工作流程輸入](#npm-workflow-inputs)和[發行測試機](#release-test-boxes)。

## 版本命名

- 每月 npm 延伸穩定版發行版本：`YYYY.M.PATCH`，搭配 `PATCH >= 33`、git 標籤 `vYYYY.M.PATCH`
- 每日／一般最終發行版本：`YYYY.M.PATCH`，搭配 `PATCH < 33`、git 標籤 `vYYYY.M.PATCH`
- 一般備援修正發行版本：`YYYY.M.PATCH-N`，git 標籤 `vYYYY.M.PATCH-N`
- Beta 預發行版本：`YYYY.M.PATCH-beta.N`，git 標籤 `vYYYY.M.PATCH-beta.N`
- Alpha 預發行版本：`YYYY.M.PATCH-alpha.N`，git 標籤 `vYYYY.M.PATCH-alpha.N`
- 月份或修補版本絕不補零
- `PATCH` 是依序遞增的每月發行列車編號，而非日曆日期。一般最終版與 Beta 發行會推進目前的發行列車；僅有 Alpha 的標籤絕不占用或推進 Beta／一般版本的修補版本號，因此選擇 Beta 或一般發行列車時，請忽略修補版本號較高的舊版純 Alpha 標籤。
- Alpha／每夜組建會使用下一個尚未發行的修補版本列車，重複組建時僅遞增 `alpha.N`。該修補版本一旦推出 Beta，新 Alpha 組建就會移至下一個修補版本。
- npm 版本不可變更：絕不可刪除、重新發佈或重複使用已發佈的標籤。請改為建立下一個預發行編號或下一個每月修補版本。
- `latest` 會繼續跟隨目前的一般／每日 npm 版本線；`beta` 是目前的 Beta 安裝目標
- `extended-stable` 代表受支援的前一個月份 npm 套件，從修補版本 `33` 開始；修補版本 `34` 及後續版本是該每月版本線的維護發行
- 一般最終版與一般修正版預設發佈至 npm `beta`；發行作業人員可以明確指定 `latest`，或稍後推廣已審核的 Beta 組建
- 專用的每月延伸穩定版路徑會以完全相同的版本發佈核心 npm 套件，以及所有可發佈至 npm 的官方外掛。此路徑不會將外掛發佈至 ClawHub，也不會發佈 macOS 或 Windows 成品、GitHub Release、私人儲存庫 dist-tag、Docker 映像、行動裝置成品或網站下載項目。
- 每個一般最終版都會一併發佈 npm 套件、macOS 應用程式、已簽署的獨立 Android APK，以及已簽署的 Windows Hub 安裝程式。Beta 發行通常會先驗證並發佈 npm／套件路徑；原生應用程式的組建、簽署、公證與推廣則保留給一般最終版，除非另有明確要求。

## 發行節奏

- 發行採 Beta 優先；只有在最新 Beta 通過驗證後才會推出穩定版
- 維護人員通常會從目前的 `main` 建立 `release/YYYY.M.PATCH` 分支並由此發行，使發行驗證與修正不會阻礙 `main` 上的新開發
- 若 Beta 標籤已推送或發佈但需要修正，維護人員會建立下一個 `-beta.N` 標籤，而不是刪除或重新建立舊標籤
- 詳細的發行程序、核准、認證資訊與復原注意事項僅供維護人員使用

## 每月僅限 npm 的延伸穩定版發佈

這是下方一般發行程序的專用例外。針對已結束的月份 `YYYY.M`，建立 `extended-stable/YYYY.M.33`；從同一分支發佈 `vYYYY.M.33` 及後續維護修補版本。發行標籤、分支頂端、簽出內容、套件版本、npm 預檢和完整發行驗證執行都必須指向同一個提交。受保護的 `main` 必須已包含嚴格晚於該月份的日曆月份最終版本，且修補版本低於 `33`；即使 `main` 已推進超過一個月，維護修補版本仍符合資格。

在正確的延伸穩定版分支上，將根套件升級至 `YYYY.M.P`、執行 `pnpm release:prep`，並確認每個可發佈的外掛套件都具有相同版本。提交並推送所有產生的變更，接著凍結並記錄產生的完整 SHA。工作流程會使用這棵已準備好的版本樹；不會代替你升級或同步版本。請勿為候選版本建立最終標籤。

針對該凍結 SHA 執行 npm 預檢和完整發行驗證，接著儲存兩個執行 ID，以及成功的完整發行驗證執行嘗試次數：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"

gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag="$RELEASE_SHA" \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

node scripts/full-release-validation-at-sha.mjs \
  --sha "$RELEASE_SHA" \
  --target-ref extended-stable/YYYY.M.33
```

SHA 形式僅受限於驗證用途的 npm 預檢支援。此輔助工具會固定受信任的工作流程程式碼，同時記錄確切的產品 SHA 和標準分支情境。其穩定版驗證設定檔與 npm `extended-stable` dist-tag 分開。

如果任一候選閘門失敗，或需要另一個反向移植，請更新分支、凍結新的 SHA，並重新執行受影響的候選閘門。候選版本驗證期間，請勿建立、刪除或移動最終標籤。兩個閘門都通過後，重新解析分支頂端，確認其仍等於 `RELEASE_SHA`，然後在該 SHA 建立並推送不可變更的 `vYYYY.M.P`。標記後若變更原始碼，必須建立新的修補版本和新候選版本；最終延伸穩定版標籤絕不可移動或刪除。

兩次執行都成功後，從完全相同的分支頂端發佈所有可發佈至 npm 的官方外掛。修補版本 `P` 必須為 `33` 或以上。將完整發行 SHA 作為 `ref` 傳入，等待完整矩陣和登錄檔讀回完成，然後儲存成功的外掛 NPM 發行執行 ID：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

此工作流程會使用一般已準備好的 `all-publishable` 套件清單，包括原始碼未變更的套件。工作流程成功前，會驗證每個確切套件以及每個外掛的 `extended-stable` 標籤。若部分執行失敗，請重新執行相同命令：已發佈的套件會重複使用，缺少或過時的外掛標籤會在 npm 發行環境下進行協調，而最終讀回仍會涵蓋完整套件集。

外掛工作流程成功且 npm 發行環境就緒後，發佈確切的核心預檢 tarball。核心發佈會驗證所參照的外掛執行在相同標準分支和確切原始碼 SHA 上為 `completed/success`：

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

針對刻意無法滿足每月 `.33` 或受保護 `main` 月份政策的分支儲存庫或非正式環境演練，請在 npm 預檢和發佈分派中都加入 `-f bypass_extended_stable_guard=true`。預設值為 `false`。只有搭配 `npm_dist_tag=extended-stable` 時才會接受略過，並會記錄在工作流程摘要中。這不會略過標準 `extended-stable/YYYY.M.33` 工作流程 ref、分支頂端／標籤／簽出內容相等性、最終標籤語法、套件／標籤版本相等性、參照執行與資訊清單身分、tarball 來源、環境核准、登錄檔讀回或選擇器修復證據。

發佈工作流程會驗證所參照的預檢、驗證和外掛執行身分、已準備的 tarball 摘要，以及核心登錄檔選擇器。工作流程成功後，請另行確認結果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

兩個命令都必須傳回 `YYYY.M.P`。若發佈成功但選擇器讀回失敗，請勿重新發佈不可變更的套件版本。請使用失敗工作流程之固定執行摘要所列印的單一 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復命令，然後再次執行兩項獨立讀回。回復至先前選擇器是另一項作業人員決策，並非讀回修復路徑。

公開支援文件最初將 Slack、Discord 和 Codex 指定為涵蓋的延伸穩定版外掛介面。該清單是支援聲明，而不是發行程式碼允許清單：每個可發佈至 npm 的官方外掛都會遵循相同的精確版本發佈路徑。

下方的一般檢查清單仍負責 Beta、`latest`、GitHub Release、外掛、macOS、Windows 和其他平台的發佈。請勿為此僅限 npm 的延伸穩定版路徑執行那些步驟。

## 一般發行作業人員檢查清單

此檢查清單呈現發行流程的公開形式。私人認證資訊、簽署、公證、dist-tag 復原和緊急回復的詳細資訊會保留在僅供維護人員使用的發行操作手冊中。

1. 從目前的 `main` 開始：拉取最新內容、確認目標提交已推送，並確認 `main` CI 已達到足以從其建立分支的綠燈狀態。
2. 從該提交建立 `release/YYYY.M.PATCH`。向後移植為選用；僅套用操作人員選取的集合。更新每個必要位置的版本、執行 `pnpm release:prep`、完成發行修正與必要的向前移植，並檢閱 `src/plugins/compat/registry.ts` 及 `src/commands/doctor/shared/deprecation-compat.ts`。
3. 將產品完整且尚未更新變更記錄的提交凍結為 **Code SHA**。執行確定性的來源預檢，然後使用 `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`。如此會固定可信任的工作流程工具，同時讓完整的 Vitest、Docker、QA、套件及效能矩陣以確切的 Code SHA 為目標。
4. 編輯前先將失敗分類。產品／程式碼失敗會產生新的 Code SHA，且該 SHA 必須通過完整驗證。工作流程、測試框架、認證資訊、核准或基礎架構失敗，應在其所屬介面修復，並針對相同的 Code SHA 重新執行。
5. 只有在 Code SHA 通過後，才根據自上一個可到達的已發布標籤以來合併的 PR 與直接提交，產生最上方的 `CHANGELOG.md` 區段。項目須面向使用者並去除重複。當分歧的已發布標籤或後續向前移植重新關聯已發布的 PR 時，請明確將其以 `--shipped-ref` 傳入。
6. 僅提交 `CHANGELOG.md`。此提交即為 **Release SHA**。從 Code SHA 到 Release SHA 的完整差異必須恰好是 `CHANGELOG.md`；若有任何其他路徑變更，發行流程即退回步驟 2。
7. 針對 Release SHA 執行固定 SHA 的完整發行驗證，並啟用證據重用。輕量父項必須記錄 `changelog-only-release-v1`、指向通過的 Code SHA，且不得分派任何產品子通道。這會重用產品證據，但不會重用套件位元組。
8. 針對 Release SHA／標籤，以 `preflight_only=true` 執行 `OpenClaw NPM Release`。儲存成功的 `preflight_run_id`。這會建置並檢查包含最終變更記錄的確切套件位元組。
9. 標記 Release SHA，然後使用成功的 Release-SHA 驗證父項與 npm 預檢來執行候選版本輔助程式，而不要再次分派其中任何一項：

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   若為穩定版，另請傳入 `--windows-node-tag vX.Y.Z`。輔助程式會驗證發行說明來源、npm 預檢位元組、Parallels 安裝／更新證明、Telegram 套件證明及外掛發布計畫，然後輸出發布命令。

   `OpenClaw Release Publish` 會平行將選取或所有可發布的外掛套件發布至 npm，並將同一組套件發布至 ClawHub；外掛 npm 發布成功後，再以相符的 dist-tag 提升已準備的 OpenClaw npm 預檢成品。發行簽出仍是產品／資料根目錄，而規劃與最終驗證則從確切且可信任的工作流程來源簽出執行，因此較舊的發行提交無法暗中使用過時的發行工具。任何發布子項開始前，流程都會轉譯並快取確切的 GitHub 發行內容。當完整相符的 `CHANGELOG.md` 區段符合 GitHub 的 125,000 字元限制及轉譯器相符的 125,000 位元組安全上限時，頁面會包含該確切的 `## YYYY.M.PATCH` 區段及其標題。當來源區段無法容納時，頁面會保留確切的分組編輯說明，並以指向標籤固定之 `CHANGELOG.md` 內完整記錄的穩定連結取代過大的貢獻記錄；絕不發布部分記錄或遭截斷的項目符號。工作流程會在加入 `### Release verification` 前選擇完整或精簡內容；若證明尾端會超出限制，則保留標準內容，並改為依賴不可變的附件證據。發布至 npm `latest` 的穩定版本會成為 GitHub 最新發行版，而保留於 npm `beta` 的穩定維護版本則以 GitHub `latest=false` 建立。工作流程也會將預檢相依性證據、完整驗證資訊清單及發布後登錄檔驗證證據上傳至 GitHub 發行版，以供發行後事件處理。流程會立即輸出子執行 ID、自動核准工作流程權杖有權核准的發行環境閘門、以記錄結尾摘要失敗的子工作、預先建立 GitHub 發行草稿頁面，並在發布 OpenClaw npm 套件的同時提升 Windows 與 Android 成品；這些階段成功後，會完成發行頁面與相依性證據，凡發布 OpenClaw npm 時皆會等待 ClawHub，接著執行可信任主分支的 Beta 驗證程式，並上傳 GitHub 發行版、npm 套件、所選外掛 npm 套件、所選 ClawHub 套件、子工作流程執行 ID，以及選用的 NPM Telegram 執行 ID 的發布後證據。ClawHub 啟動驗證程式要求確切的可信任主分支工作流程路徑與 SHA、生產端及終止執行嘗試、Release SHA、要求的套件集合、不可變套件成品元組，以及終止登錄檔讀回成品；不接受成功的舊版發行參照執行。

   接著，針對已發布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 套件執行發布後套件驗收。若已推送或發布的預發行版本需要修正，請建立下一個相符的預發行編號；絕不刪除或改寫舊版本。

10. 發布嘗試失敗時，除非失敗證明產品或變更記錄有瑕疵，否則保持 Release SHA 不變。繼續使用已成功且不可變的子項與成品；絕不重新建置或重新發布已成功發布的套件版本。
11. 若為穩定版，只有在經審查的 Beta 版或候選發行版具備必要驗證證據後才能繼續。穩定版 npm 發布也須透過 `OpenClaw Release Publish`，並經由 `preflight_run_id` 重用成功的預檢成品。穩定版 macOS 的發行就緒條件還包括已封裝的 `.zip`、`.dmg`、`.dSYM.zip`，以及 `main` 上已更新的 `appcast.xml`；macOS 發布工作流程會在驗證發行成品後，自動將已簽署的 appcast 發布至公開的 `main`，若分支保護阻擋直接推送，則開啟或更新 appcast PR。穩定版 Windows Hub 的就緒條件包括 OpenClaw GitHub 發行版上的已簽署 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 與 `OpenClawCompanion-SHA256SUMS.txt` 成品。將確切且已簽署的 `openclaw/openclaw-windows-node` 發行標籤以 `windows_node_tag` 傳入，並將候選版本已核准的安裝程式摘要對照表以 `windows_node_installer_digests` 傳入；`OpenClaw Release Publish` 會保留發行草稿、分派 `Windows Node Release`，並在發布前驗證全部三項成品。
12. 發布後，執行 npm 發布後驗證程式；需要發布後的頻道證明時，可選擇執行獨立的已發布 npm Telegram 端對端測試；視需要提升 dist-tag、驗證產生的 GitHub 發行頁面、執行發行公告步驟，然後完成[穩定版主分支收尾](#stable-main-closeout)，才能宣告穩定版本發行完成。

## 穩定版主分支收尾

在 `main` 包含實際已發布的發行狀態前，穩定版發布尚未完成。

1. 從全新且最新的 `main` 開始。以其為基準稽核 `release/YYYY.M.PATCH`，並向前移植 `main` 中缺少的實際修正。不要盲目將僅限發行版的相容性、測試或驗證轉接器合併至較新的 `main`。
2. 在一般路徑中，將 `main` 設為已發布的穩定版本。若 `main` 已推進至較新的穩定版 OpenClaw CalVer，延遲收尾可使用該版本；不要只為完成前一個發行版的收尾，而將已開始的發行列車降級。驗證程式仍要求確切的已發布變更記錄區段與 appcast 項目，並記錄實際的 `main` 版本及 SHA。任何根版本變更後，先執行 `pnpm release:prep`，再執行 `pnpm deps:shrinkwrap:generate`。
3. 使 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 區段與已標記的發行分支完全一致。若 Mac 發行版發布了穩定版 `appcast.xml` 更新，請一併納入。
4. 在操作人員明確啟動該發行列車前，不要將 `YYYY.M.PATCH+1`、Beta 版本或空白的未來變更記錄區段新增至 `main`。
5. 執行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 與 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送後，確認 `origin/main` 包含已發布版本與變更記錄，才能宣告穩定版發行完成。
6. 每次私有回復演練後，都應將儲存庫變數 `RELEASE_ROLLBACK_DRILL_ID` 與 `RELEASE_ROLLBACK_DRILL_DATE` 保持為最新狀態。

`OpenClaw Stable Main Closeout` 從穩定版發布後帶有已發布版本、變更記錄及 appcast 的 `main` 推送開始。它會讀取不可變的發布後證據，將已發布標籤與其完整發行驗證及發布執行綁定，然後驗證穩定版主分支狀態、發行版、必要的穩定版觀察期，以及具阻擋性的效能證據。它會將不可變的收尾資訊清單與總和檢查碼附加至 GitHub 發行版。自動推送觸發程序會略過早於不可變發布後證據的舊版發行，且絕不將該略過視為已完成收尾。

完整收尾需要同時具備兩項成品及相符的總和檢查碼。部分資訊清單會重新執行其記錄的 `main` SHA 與回復演練，以重新產生相同的位元組，然後附加缺少的總和檢查碼；無效的配對，或只有總和檢查碼而無資訊清單，仍會阻擋流程。缺少回復演練儲存庫變數的推送觸發執行會略過且不完成收尾；缺少演練記錄或記錄已超過 90 天，仍會阻擋手動且以證據為依據的收尾。私有復原命令保留於僅限維護人員的執行手冊中。僅使用手動分派來修復或重新執行以證據為依據的穩定版收尾。

若 Release Publish 父項僅在附加不可變的 npm／外掛證據後才失敗，請先修復並發布所有穩定版平台成品。接著，維護人員可使用 `allow_failed_publish_recovery=true` 手動分派收尾；此模式僅接受已完成但失敗的父項，此外還要求確切的 Android 與 Windows 成品合約、GitHub SHA-256 摘要、總和檢查碼驗證、Android 來源證明，以及由父項分派且成功的 Windows 提升作業；其 Authenticode 檢查與候選版本已核准的摘要必須和已發布的安裝程式相符，並同時符合一般的 macOS／appcast 檢查。自動推送收尾絕不啟用此復原模式。

只有在修正標籤解析至與基礎穩定版標籤相同的來源提交時，舊版備援修正標籤才能重用基礎套件證據。其 Android 發行版會重用基礎標籤已驗證的 APK，並新增修正標籤的來源證明。來源不同的修正必須發布並驗證自己的套件證據，並使用較高的 Android `versionCode`。

## 發行預檢

- 在發布前預檢之前執行 `pnpm check:test-types`，確保測試用 TypeScript 在較快速的本機 `pnpm check` 閘門之外仍受到涵蓋。
- 在發布前預檢之前執行 `pnpm check:architecture`，確保較廣泛的匯入循環與架構邊界檢查在較快速的本機閘門之外皆為綠燈。
- 在 `pnpm release:check` 之前執行 `pnpm build && pnpm ui:build`，確保封裝驗證步驟所需的 `dist/*` 發布成品與 Control UI 套件組合已存在。
- 在根版本升級之後、建立標籤之前執行 `pnpm release:prep`。它會執行每個在版本／設定／API 變更後經常產生偏移的確定性發布產生器：外掛版本、npm shrinkwrap、外掛清單、基礎設定結構描述、內建頻道設定中繼資料、設定文件基準、外掛 SDK 匯出、外掛 SDK API 契約資訊清單，以及 Control UI 語系套件組合。它也會阻擋流程，直到原生應用程式翻譯與平台產生的語系資源符合來源清單；若仍有落後，請在凍結 Code SHA 之前等待或派送 `Native App Locale Refresh`。`pnpm release:check` 會以檢查模式重新執行這些防護（包括嚴格的語系閘門與外掛 SDK 介面預算），並在執行套件發布檢查之前，一次回報所有產生成品偏移失敗。
- 外掛版本同步預設會將可發布的 `@openclaw/ai` 執行階段套件、官方外掛套件版本，以及現有的 `openclaw.compat.pluginApi` 下限更新為 OpenClaw 發布版本。請將該欄位視為外掛 SDK／執行階段 API 下限，而不只是套件版本的副本：對於刻意維持與較舊 OpenClaw 主機相容的僅外掛發布，請將下限保留為支援的最舊主機 API，並在外掛發布證明中記錄此選擇。
- 在核准發布之前執行手動 `Full Release Validation` 工作流程，以從單一進入點啟動所有發布前測試環境。它接受分支、標籤或完整提交 SHA，會派送手動 `CI`，並派送 `OpenClaw Release Checks` 以執行安裝冒煙測試、套件驗收、跨作業系統套件檢查、QA Lab 一致性、Matrix 與 Telegram 執行管道。穩定版與完整執行一律包含完整的即時／E2E 與 Docker 發布路徑耐久測試；`run_release_soak=true` 保留供明確的 Beta 耐久測試使用。套件驗收會在候選版本驗證期間提供標準套件 Telegram E2E，避免同時執行第二個即時輪詢器。

  發布 Beta 後提供 `release_package_spec`，即可在發布檢查、套件驗收與套件 Telegram E2E 之間重複使用已發布的 npm 套件，而不必重新建置發布 tarball。只有當 Telegram 應使用與其餘發布驗證不同的已發布套件時，才提供 `npm_telegram_package_spec`。當套件驗收應使用與發布套件規格不同的已發布套件時，請提供 `package_acceptance_package_spec`。當發布證據報告應證明驗證結果符合已發布的 npm 套件，但不強制執行 Telegram E2E 時，請提供 `evidence_package_spec`。

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- 若要在發布工作持續進行時取得套件候選版本的旁路證明，請執行手動 `Package Acceptance` 工作流程。使用 `source=npm` 指定 `openclaw@beta`、`openclaw@latest` 或精確的發布版本；使用 `source=ref`，透過目前的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支／標籤／SHA；使用 `source=url` 指定具有必要 SHA-256 且符合嚴格公開 URL 政策的公開 HTTPS tarball；使用 `source=trusted-url` 指定具名的受信任來源政策，並提供必要的 `trusted_source_id` 與 SHA-256；或使用 `source=artifact` 指定由其他 GitHub Actions 執行上傳的 tarball。

  此工作流程會將候選版本解析為 `package-under-test`、針對該 tarball 重複使用 Docker E2E 發布排程器，並可透過 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`，針對同一 tarball 執行 Telegram QA。當選取的 Docker 執行管道包含 `published-upgrade-survivor` 時，套件成品就是候選版本，而 `published_upgrade_survivor_baseline` 會選取已發布的基準。`update-restart-auth` 會同時將候選套件用作已安裝的命令列介面與受測套件，以測試候選版本更新命令的受管理重新啟動路徑。

  範例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常用設定檔：
  - `smoke`：安裝／頻道／代理程式、閘道網路與設定重新載入執行管道
  - `package`：不含 OpenWebUI 或即時 ClawHub 的成品原生套件／更新／重新啟動／外掛執行管道
  - `product`：套件設定檔加上 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發布路徑區塊
  - `custom`：精確選取 `docker_lanes`，以進行聚焦的重新執行

- 當你只需要發布候選版本的確定性一般 CI 涵蓋範圍時，請直接執行手動 `CI` 工作流程。手動 CI 派送會略過變更範圍限定，並強制執行 Linux Node 分片、內建外掛分片、外掛與頻道契約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS 與 Control UI i18n 執行管道。獨立的手動 CI 只有在使用 `include_android=true` 派送時才會執行 Android；`Full Release Validation` 會將該輸入傳遞給其 CI 子工作流程。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 驗證發布遙測時，請執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器執行 QA Lab，並驗證追蹤、指標與記錄匯出，以及受限的追蹤屬性與內容／識別碼遮蔽，而不需要 Opik、Langfuse 或其他外部收集器。
- 驗證收集器相容性時，請執行 `pnpm qa:otel:collector-smoke`。它會先將相同的 QA Lab OTLP 匯出路由至真正的 OpenTelemetry Collector Docker 容器，再執行本機接收器判定。
- 驗證受保護的 Prometheus 擷取時，請執行 `pnpm qa:prometheus:smoke`。它會執行 QA Lab、拒絕未經驗證的擷取，並驗證發布關鍵指標系列不含提示內容、原始識別碼、驗證權杖與本機路徑。
- 執行 `pnpm qa:observability:smoke`，依序執行來源簽出版本的 OpenTelemetry 與 Prometheus 冒煙測試執行管道。
- 每次建立標籤發布之前，請執行 `pnpm release:check`。
- `OpenClaw NPM Release` 預檢會在封裝 npm tarball 之前產生相依套件發布證據。npm 公告弱點閘門會阻擋發布。遞移資訊清單風險、相依套件擁有權／安裝介面與相依套件變更報告僅供發布證據使用。相依套件變更報告會比較發布候選版本與前一個可到達的發布標籤。預檢會將相依套件證據上傳為 `openclaw-release-dependency-evidence-<tag>`，並將其嵌入所準備 npm 預檢成品內的 `dependency-evidence/`。實際發布路徑會重複使用該預檢成品，接著將相同證據以 `openclaw-<version>-dependency-evidence.zip` 附加至 GitHub 發布。
- 標籤存在後，執行 `OpenClaw Release Publish` 以進行會產生變更的發布程序。請從受信任的 `main` 派送一般 Beta 與穩定版發布；發布標籤仍會選取精確的目標提交，且可能指向 `release/YYYY.M.PATCH`。Tideclaw Alpha 發布仍保留在其對應的 Alpha 分支。請傳入成功的 OpenClaw npm `preflight_run_id`、成功的 `full_release_validation_run_id` 與精確的 `full_release_validation_run_attempt`，並保留預設外掛發布範圍 `all-publishable`，除非你刻意執行聚焦修復。此工作流程會依序執行外掛 npm 發布、外掛 ClawHub 發布與 OpenClaw npm 發布，確保核心套件不會早於其外部化外掛發布；Windows 與 Android 推廣會針對草稿發布頁面，與核心 npm 發布同時執行。發布重新執行可接續進行：對於已發布的核心 npm 版本，在工作流程證明登錄檔 tarball 符合標籤的預檢成品後，會略過核心派送；當發布已包含經驗證的成品契約時，會略過 Windows／Android 推廣，因此重試只會重新執行失敗的階段。聚焦的僅外掛修復需要 `plugin_publish_scope=selected` 與非空白外掛清單。僅外掛的 `all-publishable` 執行需要完整且不可變的預檢與完整發布驗證證據；不接受部分證據。
- 穩定版 `OpenClaw Release Publish` 需要在對應的非預發布 `openclaw/openclaw-windows-node` 發布存在後提供精確的 `windows_node_tag`，以及經候選版本核准的 `windows_node_installer_digests` 對應表。在派送任何發布子工作流程之前，它會驗證來源發布已發布、不是預發布版本、包含必要的 x64／ARM64 安裝程式，且仍符合該核准對應表。接著，它會在 OpenClaw 發布仍為草稿時派送 `Windows Node Release`，並原封不動地傳遞固定的安裝程式摘要對應表。子工作流程會從該精確標籤下載已簽署的 Windows Hub 安裝程式、比對固定摘要、在 Windows 執行器上驗證其 Authenticode 簽章使用預期的 OpenClaw Foundation 簽署者、寫入 SHA-256 資訊清單，並將安裝程式與資訊清單上傳至標準 OpenClaw GitHub 發布，接著重新下載已推廣的成品，並驗證資訊清單成員資格與雜湊值。父工作流程會在發布前驗證目前的 x64、ARM64 與總和檢查碼成品契約。直接復原會先拒絕非預期的 `OpenClawCompanion-*` 成品名稱，再使用固定的來源位元組取代預期的契約成品。

  只有在復原時才手動派送 `Windows Node Release`，且一律傳入精確標籤，絕不可傳入 `latest`，並提供已核准來源發布中的明確 `expected_installer_digests` JSON 對應表。網站下載連結應指向目前穩定版發布的精確 OpenClaw 發布成品 URL，或僅在確認 GitHub 的 latest 重新導向指向相同發布後使用 `releases/latest/download/...`；請勿只連結至配套儲存庫發布頁面。

- 發行檢查現在於獨立的手動工作流程中執行：`OpenClaw Release Checks`。在核准發行前，它也會執行 QA Lab 模擬同等性執行線，以及 Matrix 發行設定檔和 Telegram QA 執行線。即時執行線使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI 認證資訊租約。若要執行所有維護中的 Matrix 情境，請使用 `matrix_profile=all` 執行手動 `QA-Lab - All Lanes` 工作流程；該工作流程會將此選擇分散至傳輸、媒體及 E2EE 設定檔，以便在各工作逾時限制內保留完整證明。
- 跨作業系統的安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它們會直接呼叫可重複使用的工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。這項拆分是刻意的：讓實際的 npm 發行路徑保持簡短、具決定性且聚焦於成品，而較慢的即時檢查則留在各自的執行線中，避免延遲或阻擋發布。
- 含有祕密的發行檢查應透過 `Full Release Validation`，或從 `main`/release 工作流程參照分派，以確保工作流程邏輯與祕密受到管控。
- `OpenClaw Release Checks` 接受分支、標籤或完整的提交 SHA，前提是解析出的提交可從 OpenClaw 分支或發行標籤到達。
- `OpenClaw NPM Release` 的僅驗證預檢也接受目前完整的 40 字元工作流程分支提交 SHA，而不要求已推送標籤。該 SHA 路徑僅供驗證，無法提升為實際發布。在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；實際發布仍需要真正的發行標籤。
- 兩個工作流程都會讓實際發布與提升路徑保留在 GitHub 託管的執行器上，而不會改變狀態的驗證路徑則可使用較大型的 Blacksmith Linux 執行器。
- 該工作流程會同時使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流程祕密來執行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`。
- npm 發行預檢不再等待獨立的發行檢查執行線。
- 在本機標記候選發行版之前，請執行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。此輔助工具會依序執行快速發行防護措施、外掛 npm/ClawHub 發行檢查、建置、UI 建置及 `release:openclaw:npm:check`，以便在 GitHub 發布工作流程開始前，找出常見且會阻擋核准的錯誤。
- 請在核准前執行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的預發行版／修正版標籤）。
- npm 發布後，請執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或相符的 beta／修正版版本），以在全新的暫存前綴中驗證已發布的登錄安裝路徑。
- 發布 beta 後，請執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，以使用共用的租用 Telegram 認證資訊集區，針對已發布的 npm 套件驗證已安裝套件的初始設定、Telegram 設定及真正的 Telegram E2E。本機維護者的一次性作業可以省略 Convex 變數，並直接傳入三項 `OPENCLAW_QA_TELEGRAM_*` 環境認證資訊。
- 若要從維護者電腦執行完整的發布後 beta 冒煙測試，請使用 `pnpm release:beta-smoke -- --beta betaN`。此輔助工具會執行 Parallels npm 更新／全新目標驗證、分派 `NPM Telegram Beta E2E`、輪詢確切的工作流程執行、下載成品，並印出 Telegram 報告。
- 維護者可透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行相同的發布後檢查。它刻意僅供手動執行，不會在每次合併時執行。
- 維護者發行自動化採用先預檢、後提升的方式：
  - 實際 npm 發布必須通過成功的 npm `preflight_run_id`。
  - 一般 beta 與穩定版的發布協調和預檢，會針對確切的目標標籤使用受信任的 `main`。Tideclaw alpha 發布與預檢則使用相符的 alpha 分支。
  - 穩定版 npm 發行預設為 `beta`；穩定版 npm 發布可透過工作流程輸入，明確指定 `latest`。
  - 基於權杖的 npm dist-tag 變更位於 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而來源存放庫則維持僅使用 OIDC 發布。
  - 公開的 `macOS Release` 僅供驗證；若標籤僅存在於發行分支上，但工作流程是從 `main` 分派，請設定 `public_release_branch=release/YYYY.M.PATCH`。
  - 實際 macOS 發布必須通過成功的 macOS `preflight_run_id` 和 `validate_run_id`。
  - 實際發布路徑會提升已備妥的成品，而不會再次重建。
- 對於 `YYYY.M.PATCH-N` 之類的穩定版修正發行，發布後驗證器也會檢查從 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同暫存前綴升級路徑，確保發行修正不會在無提示的情況下，讓較舊的全域安裝仍停留於基礎穩定版內容。
- 除非 tarball 同時包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 內容，否則 npm 發行預檢會採取失敗關閉，以免再次發布空白的瀏覽器儀表板。
- 發布後驗證也會檢查已安裝的登錄配置中，是否存在已發布的外掛進入點與套件中繼資料。若發行版本缺少外掛執行階段內容，發布後驗證器就會判定失敗，且該版本無法提升至 `latest`。
- `pnpm test:install:smoke` 也會針對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，讓安裝程式 E2E 能在發行發布路徑之前攔截意外的套件膨脹。
- 如果發行工作涉及 CI 規劃、擴充功能計時資訊清單或擴充功能測試矩陣，請在核准前從 `.github/workflows/plugin-prerelease.yml` 重新產生並審查由規劃器擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，確保發行說明不會描述過時的 CI 配置。
- 穩定版 macOS 發行準備情況也包含更新程式介面：GitHub 發行最終必須包含封裝後的 `.zip`、`.dmg` 和 `.dSYM.zip`；發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip（macOS 發布工作流程會自動提交，若直接推送遭阻擋則會開啟 appcast PR）；封裝後的應用程式必須保留非偵錯套件識別碼、非空的 Sparkle 摘要 URL，以及不低於該發行版本之標準 Sparkle 建置下限的 `CFBundleVersion`。

## 發行測試機

`Full Release Validation` 是操作人員從單一進入點啟動完整產品矩陣的方式。請使用此輔助工具，讓每個子工作流程都從固定於一個受信任 `main` 工作流程 SHA 的暫存分支執行，而要求的提交仍是受測候選版本：

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

此輔助工具會擷取目前的 `origin/main`、將 `release-ci/<workflow-sha>-...` 推送至該受信任的工作流程提交、從 alpha/beta 套件版本推斷 `beta`，其他情況則推斷 `stable`，接著使用 `ref=<target-sha>` 從暫存分支分派 `Full Release Validation`、驗證每個子工作流程的 `headSha` 都與釘選的父工作流程 SHA 相符，然後刪除暫存分支。傳入 `-f reuse_evidence=false` 可強制執行全新作業，傳入 `-f release_profile=full` 可執行廣泛的建議性掃描，或傳入 `--workflow-sha <trusted-main-sha>` 可釘選仍可從目前 `origin/main` 到達的較舊提交。工作流程本身絕不寫入存放庫參照。這能讓僅存在於 main 的發行工具保持可用，而無須將工具提交加入候選版本，也可避免意外證明較新的 `main` 子工作流程執行。

Code SHA 顯示為綠燈後，只提交 `CHANGELOG.md`，並使用 Release SHA 執行相同的輔助工具：

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

只有當 GitHub 證明 Release SHA 衍生自 Code SHA，且完整的變更路徑集合恰好是 `CHANGELOG.md` 時，第二個父工作流程才會重複使用產品證據。它會記錄 `changelog-only-release-v1`，且不分派任何產品子工作流程。npm 預檢及套件／安裝驗收仍會在 Release SHA 上執行，因為其 tarball 位元組已變更。

對於全新的 Code SHA，工作流程會解析目標、分派手動 `CI`，然後分派 `OpenClaw Release Checks`。`OpenClaw Release Checks` 會展開執行安裝冒煙測試、跨作業系統發行檢查、啟用浸泡測試時的即時／E2E Docker 發行路徑涵蓋範圍、含標準 Telegram 套件 E2E 的套件驗收、QA Lab 同等性、即時 Matrix，以及即時 Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 均成功時，完整／全部執行才可接受；但若聚焦式重新執行刻意略過獨立的 `Plugin Prerelease` 子工作流程，則不在此限。僅在使用 `release_package_spec` 或 `npm_telegram_package_spec` 聚焦重新執行已發布套件時，才使用獨立的 `npm-telegram` 子工作流程。最終驗證器摘要會包含每個子工作流程執行中耗時最久的工作表格，讓發行管理者無須下載日誌，即可查看目前的關鍵路徑。

在此發行路徑中，產品效能子工作流程僅產生成品。
傘狀工作流程會使用 `publish_reports=false` 分派它；除非其僅成品防護機制證明 Clawgrit 報告發布器仍維持略過狀態，否則驗證會遭拒。

如需完整階段矩陣、確切的工作流程工作名稱、穩定版與完整設定檔的差異、成品及聚焦式重新執行控制代碼，請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)。

子工作流程是從執行 `Full Release Validation`、已釘選 SHA 的受信任參照分派。每次子工作流程執行都必須使用確切的父工作流程 SHA。請勿使用原始 `--ref main -f ref=<sha>` 分派作為發行證明；請使用 `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`。

使用 `release_profile` 選擇即時／供應商涵蓋廣度：

- `beta`：最快的發行關鍵 OpenAI／核心即時與 Docker 路徑
- `stable`：供發行核准使用的 beta 加穩定版供應商／後端涵蓋範圍
- `full`：穩定版加廣泛的建議性供應商／媒體涵蓋範圍

穩定版與完整驗證在提升前一律執行詳盡的即時／E2E、Docker 發行路徑，以及有界限的已發布升級存續掃描。使用 `run_release_soak=true` 可要求對 beta 執行相同掃描。該掃描涵蓋最新四個穩定版套件、釘選的 `2026.4.23` 和 `2026.5.2` 基準，以及較舊的 `2026.4.15` 涵蓋範圍；重複的基準會移除，每個基準則會分片至各自的 Docker 執行器工作。

`OpenClaw Release Checks` 使用受信任的工作流程參照，將目標參照解析一次為 `release-package-under-test`，並在執行浸泡測試時，於跨作業系統、套件驗收和發行路徑 Docker 檢查中重複使用該成品。這能讓所有面向套件的測試機使用相同位元組，並避免重複建置套件。beta 已發布至 npm 後，請設定 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，讓發行檢查只下載一次已發布套件、從 `dist/build-info.json` 擷取其建置來源 SHA，並在跨作業系統、套件驗收、發行路徑 Docker 和套件 Telegram 執行線中重複使用該成品。

若已設定存放庫／組織變數，跨作業系統 OpenAI 安裝冒煙測試會使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.6-luna`，因為此執行線要證明的是套件安裝、初始設定、閘道啟動及一次即時代理程式執行，而非評測能力最強的模型。較廣泛的即時供應商矩陣仍是模型特定涵蓋範圍的所在。

請依發行階段使用以下變體：

```bash
# 驗證產品完整的 Code SHA。
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# 重複使用 Code SHA 產品證據，驗證僅變更日誌的 Release SHA。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# 發布 beta 後，新增已發布套件的 Telegram E2E。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

在針對性修正後首次重新執行時，不要使用完整的整合流程。如果其中一個檢查環境失敗，下一次驗證應使用失敗的子工作流程、工作、Docker 執行管道、套件設定檔、模型提供者或 QA 執行管道。只有當修正變更了共用的發布協調流程，或使先前所有檢查環境的證據失效時，才再次執行完整整合流程。整合流程的最終驗證器會重新檢查記錄的子工作流程執行 ID，因此子工作流程成功重新執行後，只需重新執行失敗的 `Verify full validation` 父工作。

當發布設定檔、實際浸泡設定及驗證輸入相符，且目標 SHA 相同，或新目標是其後代且完整的變更路徑集合恰好為 `CHANGELOG.md` 時，`rerun_group=all` 可重複使用先前成功的整合流程執行。完全相同目標的重複使用會記錄 `exact-target-full-validation-v1`；驗證後的 Release SHA 會記錄 `changelog-only-release-v1`。後者只重複使用產品驗證。Npm 預檢、套件位元組、發布說明來源，以及安裝／更新驗收仍必須針對 Release SHA 執行。任何版本、來源、產生內容、相依套件、套件或工作流程所擁有的目標變更，都需要新的 Code SHA 及全新的完整驗證。同一 `release/*` 參照與重新執行群組的較新整合流程執行，會自動取代進行中的執行。傳入 `reuse_evidence=false` 可強制執行全新的完整流程。

若要進行有限範圍的復原，請將 `rerun_group` 傳入整合流程。`all` 是實際的候選發布版本執行，`ci` 只執行一般 CI 子流程，`plugin-prerelease` 只執行僅限發布的外掛子流程，`release-checks` 執行每個發布檢查環境，而範圍較窄的發布群組為 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 及 `npm-telegram`。針對性的 `npm-telegram` 重新執行需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整／全部執行會使用 Package Acceptance 內的標準套件 Telegram E2E。針對性的跨作業系統重新執行可新增 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統／測試套件篩選器。QA 發布檢查失敗會阻擋一般發布驗證，包括標準層級中必要的 OpenClaw 動態工具漂移。Tideclaw alpha 執行仍可將不涉及套件安全性的發布檢查執行管道視為建議性檢查。使用 `release_profile=beta` 時，`Run repo/live E2E validation` 即時提供者測試套件屬於建議性檢查（警告而非阻擋條件）；stable 與完整設定檔仍會將其視為阻擋條件。當 `live_suite_filter` 明確要求受閘門控管的 QA 即時執行管道（例如 Discord、WhatsApp 或 Slack）時，必須啟用相符的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫變數；否則輸入擷取會失敗，而不會悄悄略過該執行管道。

### Vitest

Vitest 檢查環境是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍界定，並為候選發布版本強制執行一般測試圖：Linux Node 分片、隨附外掛分片、外掛與通道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n。當 `Full Release Validation` 執行此檢查環境時，因整合流程會傳入 `include_android=true`，所以也包含 Android；獨立手動 CI 需要 `include_android=true` 才能涵蓋 Android。

使用此檢查環境回答「原始碼樹是否通過完整的一般測試套件？」這與發布路徑的產品驗證不同。應保留的證據：

- `Full Release Validation` 摘要，其中顯示已分派的 `CI` 執行 URL
- `CI` 在完全相同的目標 SHA 上成功執行
- 調查迴歸問題時，CI 工作中失敗或緩慢的分片名稱
- 執行需要效能分析時，Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發布需要具決定性的一般 CI，但不需要 Docker、QA Lab、即時、跨作業系統或套件檢查環境時，才直接執行手動 CI。直接執行不含 Android 的 CI 時使用第一個命令。當直接執行的候選發布版本 CI 必須涵蓋 Android 時，新增 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 檢查環境位於 `OpenClaw Release Checks` 至 `openclaw-live-and-e2e-checks-reusable.yml`，另包含發布模式的 `install-smoke` 工作流程。它透過封裝後的 Docker 環境驗證候選發布版本，而不只執行原始碼層級測試。

發布 Docker 涵蓋範圍包括：

- 完整安裝冒煙測試，並啟用較慢的 Bun 全域安裝冒煙測試
- 依目標 SHA 準備／重複使用根 Dockerfile 冒煙測試映像檔，QR、根目錄／閘道及安裝程式／Bun 冒煙測試工作會以個別的安裝冒煙測試分片執行
- 儲存庫 E2E 執行管道
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 至 `plugins-runtime-install-h`，以及 `openwebui`
- 要求時，在專用大容量磁碟執行器上執行 OpenWebUI 涵蓋測試
- 拆分的隨附外掛安裝／解除安裝執行管道 `bundled-plugin-install-uninstall-0` 至 `bundled-plugin-install-uninstall-23`
- 發布檢查包含即時測試套件時，執行即時／E2E 提供者測試套件及 Docker 即時模型涵蓋測試

重新執行前先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含執行管道日誌、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON 及重新執行命令。若要進行針對性復原，請在可重複使用的即時／E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不要重新執行所有發布區塊。產生的重新執行命令會盡可能包含先前的 `package_artifact_run_id` 及準備好的 Docker 映像檔輸入，因此失敗的執行管道可重複使用相同的 tarball 與 GHCR 映像檔。

### QA Lab

QA Lab 檢查環境也是 `OpenClaw Release Checks` 的一部分。它是代理行為及通道層級的發布閘門，與 Vitest 及 Docker 套件機制分開。

發布 QA Lab 涵蓋範圍包括：

- 模擬同等性執行管道，使用代理同等性套件比較 OpenAI 候選執行管道與 `anthropic/claude-opus-4-8` 基準
- 使用 `qa-live-shared` 環境的 Matrix 即時介接器發布設定檔
- 使用 Convex CI 認證資訊租約的即時 Telegram QA 執行管道
- 發布遙測需要明確的本機證明時，使用 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此檢查環境回答「發布版本在 QA 情境及即時通道流程中是否行為正確？」核准發布時，請保留同等性、Matrix 及 Telegram 執行管道的成品 URL。完整 Matrix 涵蓋測試仍可透過手動分片 QA-Lab 執行取得，而不是作為預設的發布關鍵執行管道。

### 套件

套件檢查環境是可安裝產品的閘門。它由 `Package Acceptance` 及解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選版本正規化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並將工作流程測試框架參照與套件來源參照分開。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或完全相符的 OpenClaw 發布版本
- `source=ref`：使用選取的 `workflow_ref` 測試框架，封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載具有必要 `package_sha256` 的公開 HTTPS `.tgz`；系統會拒絕 URL 認證資訊、非預設 HTTPS 連接埠、私人／內部／特殊用途主機名稱或解析後的位址，以及不安全的重新導向
- `source=trusted-url`：下載具有必要 `package_sha256` 及 `trusted_source_id` 的 HTTPS `.tgz`，其來源是 `.github/package-trusted-sources.json` 中的具名政策；維護者擁有的企業鏡像或私人套件儲存庫應使用此方法，而不要在 `source=url` 中新增輸入層級的私人網路略過機制
- `source=artifact`：重複使用另一個 GitHub Actions 執行所上傳的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、準備好的發布套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對相同的已解析 tarball 執行遷移、更新、由 root 管理的 VPS 升級、已設定驗證的更新後重新啟動、即時 ClawHub skill 安裝、過時外掛相依套件清理、離線外掛固定裝置、外掛更新、外掛命令繫結逸出強化，以及 Telegram 套件 QA。阻擋式發布檢查會使用預設的最新已發布套件基準；含 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 設定檔，會將已發布版本升級存續者掃描擴展至 `last-stable-4`，再加上固定的 `2026.4.23`、`2026.5.2` 及 `2026.4.15` 基準，並使用 `reported-issues` 情境。對已發布的候選版本使用含 `source=npm` 的 Package Acceptance；對發布前由 SHA 支援的本機 npm tarball 使用 `source=ref`；對維護者擁有的企業／私人鏡像使用 `source=trusted-url`；對另一個 GitHub Actions 執行所上傳且已準備好的 tarball 使用 `source=artifact`。

這是大多數先前需要 Parallels 的套件／更新涵蓋測試之 GitHub 原生替代方案。跨作業系統發布檢查對作業系統特定的初始設定、安裝程式及平台行為仍很重要，但套件／更新產品驗證應優先使用 Package Acceptance。

更新與外掛驗證的標準檢查清單是[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。判斷哪個本機、Docker、Package Acceptance 或發布檢查執行管道可證明外掛安裝／更新、doctor 清理或已發布套件遷移變更時，請使用此清單。從每個穩定版 `2026.4.23+` 套件進行的完整已發布更新遷移，是獨立的手動 `Update Migration` 工作流程，不屬於完整發布 CI。

舊版套件驗收的寬容機制刻意設有時限。截至 `2026.4.25` 的套件，可針對已發布至 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少私人 QA 清單項目、缺少 `gateway install --wrapper`、由 tarball 衍生的 git 固定裝置中缺少修補檔案、缺少已保存的 `update.channel`、舊版外掛安裝記錄位置、缺少市集安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件可對已隨版本發布的本機建置中繼資料戳記檔案發出警告。後續套件必須符合現代套件合約；相同缺口會導致發布驗證失敗。

當發布問題涉及實際可安裝的套件時，請使用涵蓋範圍更廣的 Package Acceptance 設定檔：

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

- `smoke`：快速套件安裝／頻道／代理程式、閘道網路與設定重新載入路徑
- `package`：安裝／更新／重新啟動／外掛套件契約，加上即時 ClawHub Skill 安裝證明；這是發行檢查的預設值
- `product`：`package` 加上 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋與 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：供聚焦重新執行使用的確切 `docker_lanes` 清單

若要執行候選套件的 Telegram 證明，請在套件驗收中啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。此工作流程會將解析出的 `package-under-test` tarball 傳入 Telegram 路徑；獨立的 Telegram 工作流程仍接受已發布的 npm 規格，以供發布後檢查。

## 一般發行發布自動化

針對 beta、`latest`、外掛、GitHub Release 與平台發布，
`OpenClaw Release Publish` 是一般的變更型進入點。每月執行的
`.33+` 僅限 npm 的延伸穩定版路徑不使用此協調器。此
一般工作流程會依發行所需的順序協調受信任發布者工作流程：

1. 簽出發行標籤並解析其提交 SHA。
2. 確認標籤可從 `main` 或 `release/*` 到達（若為 alpha 預發行版，則可從 Tideclaw alpha 分支到達）。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 與 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同的範圍與 SHA 分派 `Plugin ClawHub Release`。
6. 在確認已儲存的 `full_release_validation_run_id` 與確切執行嘗試次數後，使用發行標籤、npm dist-tag 與已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。
7. 針對穩定版發行，建立 GitHub release 草稿或更新現有草稿，使用明確的 `windows_node_tag` 與候選版本核准的 `windows_node_installer_digests` 分派 `Windows Node Release`，並驗證標準 Windows 安裝程式／總和檢查碼資產。同時分派 `Android Release`，以建置確切標籤的已簽署 APK、總和檢查碼與來源證明。在發布草稿前驗證兩個原生資產契約。

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

將穩定版發布至預設的 beta dist-tag：

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

僅在聚焦修復或重新發布時使用較低階的 `Plugin NPM Release` 與 `Plugin ClawHub Release` 工作流程。當 `publish_openclaw_npm=true` 時，`OpenClaw Release Publish` 會拒絕 `plugin_publish_scope=selected`，因此核心套件無法在未包含所有可發布官方外掛（包括 `@openclaw/diffs-language-pack`）的情況下發布。若要修復選定的外掛，請搭配 `plugin_publish_scope=selected` 與 `plugins=@openclaw/name` 設定 `publish_openclaw_npm=false`，或直接分派子工作流程。

首次發布 ClawHub 啟動程序是例外：請從受信任的 `main`
分派 `Plugin ClawHub New`，並透過 `ref` 傳入完整的目標發行 SHA。
切勿從發行標籤或分支執行啟動工作流程本身：

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

標記前驗證需要 `dry_run=true`，會拒絕發行標籤與父執行
輸入，並且只接受可從 `main` 或 `release/*` 到達的確切目標。
它不會載入 ClawHub 認證資訊、發布套件位元組，或變更受信任
發布者設定。此工作流程仍會解析即時登錄檔計畫，
僅在無機密資訊的工作中簽出並封裝目標、具體化
鎖定的 ClawHub 工具鏈，並在發行標籤存在之前驗證不可變的成品與套件
slug／身分。只有在無機密資訊的封裝工作
完成後，才能核准 `clawhub-plugin-bootstrap` 環境；此受保護的驗證工作不含認證資訊或變更命令。

標記後經核准的試執行或實際啟動程序必須包含確切的
發行標籤，以及父 `OpenClaw Release Publish` 的執行 ID、嘗試次數與
分支。父工作流程會證明其本身的工作流程 SHA，以及 `Plugin ClawHub New` 的另一個確切受信任
`main` SHA；子執行與每個受保護
環境核准都必須符合該已核准的子 SHA。每次嘗試發布與變更受信任發布者前，
都會重新檢查發行標籤。

封裝工作
會上傳一個不可變的成品，其名稱、Actions 成品 ID／摘要、
產生者執行／嘗試次數、目標 SHA，以及每個套件的 tarball SHA-256／大小，
都會傳遞至驗證與受保護工作。受保護工作僅簽出受信任的 `main`
工具，透過 GitHub API 驗證成品組合、依確切成品 ID 下載、
重新雜湊每個 tarball，並使用固定版本命令列介面的 USTAR 標準化規則驗證本機 TAR 路徑與
套件身分。接著每個候選版本都會通過固定版本命令列介面的發布試執行；此步驟會在
登錄檔查詢或驗證前返回。認證資訊工作的預篩選器將壓縮後的 ClawPack
上限設為 120 MiB、檔案裝載總量設為 50 MiB、展開後的 TAR 資料設為 64 MiB，且
TAR 項目數設為 10,000。現有套件的受信任發布者修復仍僅限於
設定，但仍會封裝目標，並要求所請求的標籤與確切登錄檔位元組及中繼資料完全相同，
才會變更受信任發布者設定。發布後驗證會下載 ClawHub 成品，並
要求相同的 SHA-256 與大小。只有在確切的產生者工作已
成功完成時，重新執行失敗工作的復原程序才能重用較早
嘗試中的套件成品。最終證據也會繫結鎖定的 ClawHub 版本、鎖定檔
SHA-256 與 npm 完整性。若不相符，則需要新的套件版本。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作人員控制的輸入：

- `tag`：必要的發行標籤，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；當 `preflight_only=true` 時，也可以是目前完整的 40 字元工作流程分支提交 SHA，僅供驗證預檢使用
- `preflight_only`：`true` 僅用於驗證／建置／封裝，`false` 用於實際發布路徑
- `preflight_run_id`：現有的成功預檢執行 ID；實際發布路徑需要此值，讓工作流程重用已準備的 tarball，而非重新建置
- `full_release_validation_run_id`：此標籤／SHA 的成功 `Full Release Validation` 執行 ID，實際發布時必填。Beta 發布可僅憑預檢繼續，但會顯示警告；穩定版／`latest` 提升仍需要此值。
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數執行嘗試次數；只要提供執行 ID，就必須提供此值，以免重新執行在發布期間變更授權證據。
- `release_publish_run_id`：已核准的 `OpenClaw Release Publish` 執行 ID；當此工作流程由該父工作流程分派時必填（機器人執行者的實際發布呼叫）
- `plugin_npm_run_id`：成功且精確對應最新提交的 `Plugin NPM Release` 執行 ID；實際發布 `extended-stable` 核心套件時必填
- `npm_dist_tag`：發布路徑的 npm 目標標籤；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，預設為 `beta`。最終修補版 `33` 及之後版本必須使用 `extended-stable`；依預設，`extended-stable` 會拒絕較早的修補版，而且一律拒絕非最終標籤。
- `bypass_extended_stable_guard`：僅供測試使用的布林值，預設為 `false`；搭配 `npm_dist_tag=extended-stable` 時，會略過每月延伸穩定版資格限制，同時保留發行身分、成品、核准與回讀檢查。

`Plugin NPM Release` 接受 `npm_dist_tag=default` 以採用現有發行
行為，或接受 `npm_dist_tag=extended-stable` 以採用受防護的每月路徑。此
延伸穩定版選項需要 `publish_scope=all-publishable`、空白的
`plugins` 輸入、等於或高於 `33` 的最終修補版，以及位於確切分支頂端的標準
`extended-stable/YYYY.M.33` 分支。它絕不會移動外掛
`latest` 或 `beta`。新的套件版本會透過 OIDC 受信任發布（`npm publish --tag extended-stable`）以不可分割方式取得 `extended-stable`；
此來源工作流程不使用權杖驗證的 `npm dist-tag add`。重試時
會略過 npm 中已存在的確切版本，接著預設拒絕繼續，除非完整
回讀確認每個確切套件與 `extended-stable` 標籤皆已收斂。

`OpenClaw Release Publish` 接受以下由操作人員控制的輸入：

- `tag`：必要的發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時必填
- `full_release_validation_run_id`：成功的 `Full Release Validation` 執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時必填
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數嘗試次數；只要提供執行 ID，就必須提供此值
- `windows_node_tag`：確切的非預發行版 `openclaw/openclaw-windows-node` 發行標籤；發布 OpenClaw 穩定版時必填
- `windows_node_installer_digests`：候選版本核准的精簡 JSON 對應表，將目前的 Windows 安裝程式名稱對應至其固定的 `sha256:` 摘要；發布 OpenClaw 穩定版時必填
- `npm_telegram_run_id`：選填的成功 `NPM Telegram Beta E2E` 執行 ID，以納入最終發行證據
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤，為 `alpha`、`beta` 或 `latest` 之一
- `plugin_publish_scope`：預設為 `all-publishable`；僅在搭配 `publish_openclaw_npm=false` 執行聚焦的外掛專用修復工作時使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；僅在將此工作流程用作外掛專用修復協調器時設定 `false`
- `release_profile`：用於發行證據摘要的發行涵蓋設定檔；預設為 `from-validation`，會從驗證資訊清單讀取，亦可使用 `beta`、`stable` 或 `full` 覆寫
- `wait_for_clawhub`：預設為 `false`，因此 npm 可用性不會被 ClawHub 附屬工作阻擋；僅在工作流程必須連同 ClawHub 一併完成時設定 `true`

`OpenClaw Release Checks` 接受以下由操作人員控制的輸入：

- `ref`：要驗證的分支、標籤或完整提交 SHA。涉及機密資訊的檢查要求解析後的提交可從 OpenClaw 分支或發行標籤存取。
- `run_release_soak`：選擇在 Beta 版本發行檢查中執行完整的即時／E2E、Docker 發行路徑，以及涵蓋所有先前版本的升級存續浸泡測試。`release_profile=stable` 和 `release_profile=full` 會強制啟用此選項。

規則：

- 修補版本低於 `33` 的一般最終版本和修正版可發佈至 `beta` 或 `latest`。修補版本為 `33` 或以上的最終版本必須發佈至 `extended-stable`，且會拒絕位於該界線的修正後綴版本。
- Beta 預發行標籤只能發佈至 `beta`；Alpha 預發行標籤只能發佈至 `alpha`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許輸入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律僅供驗證
- 實際發佈路徑必須使用預檢期間所用的同一個 `npm_dist_tag`；工作流程會先驗證該中繼資料，再繼續發佈

## 一般 Beta／最新穩定版本發行順序

此舊版順序適用於同時負責外掛、GitHub Release、Windows 及其他平台工作的常規協調式發行。這不是本頁頂端記載的每月 `.33+` npm-only 延伸穩定版路徑。

建立一般協調式穩定版本時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在前，可使用目前完整的工作流程分支提交 SHA，對預檢工作流程執行僅供驗證的試執行。
2. 一般的 Beta 優先流程請選擇 `npm_dist_tag=beta`；只有在刻意要直接發佈穩定版本時，才選擇 `latest`。
3. 若要從單一手動工作流程取得一般 CI，以及即時提示詞快取、Docker、QA Lab、Matrix 和 Telegram 的涵蓋範圍，請在發行分支、發行標籤或完整提交 SHA 上執行 `Full Release Validation`。如果刻意只需要確定性的一般測試圖，則改在發行參照上執行手動 `CI` 工作流程。
4. 選取已簽署的 x64 和 ARM64 安裝程式應隨附發行的確切非預發行 `openclaw/openclaw-windows-node` 發行標籤。將其儲存為 `windows_node_tag`，並將其已驗證的摘要對應表儲存為 `windows_node_installer_digests`。發行候選版本輔助程式會記錄兩者，並將其納入產生的發佈命令。
5. 儲存成功的 `preflight_run_id`、`full_release_validation_run_id` 及確切的 `full_release_validation_run_attempt`。
6. 從受信任的 `main` 執行 `OpenClaw Release Publish`，使用相同的 `tag`、相同的 `npm_dist_tag`、所選的 `windows_node_tag`、其已儲存的 `windows_node_installer_digests`、已儲存的 `preflight_run_id`、`full_release_validation_run_id` 及 `full_release_validation_run_attempt`。它會先將外部化的外掛發佈至 npm 和 ClawHub，再提升 OpenClaw npm 套件。
7. 如果版本發行至 `beta`，請使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 提升至 `latest`。
8. 如果版本刻意直接發佈至 `latest`，且 `beta` 應立即採用相同的穩定版本建置，請使用同一個發行工作流程，讓兩個 dist-tag 都指向該穩定版本；或讓其排定的自我修復同步稍後移動 `beta`。

dist-tag 變更位於發行分類帳儲存庫中，因為它仍需要 `NPM_TOKEN`；原始碼儲存庫則維持僅使用 OIDC 發佈。這可讓直接發佈路徑與 Beta 優先提升路徑都記載於文件中，並讓操作人員可清楚查看。

如果維護者必須改用本機 npm 驗證，請只在專用的 tmux 工作階段內執行任何 1Password 命令列介面（`op`）命令。不要直接從主要代理程式殼層呼叫 `op`；將其置於 tmux 中可讓提示、警示與 OTP 處理過程保持可觀察，並防止主機重複發出警示。

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

維護者使用 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) 中的私人發行文件作為實際操作手冊。

## 相關內容

- [發行管道](/zh-TW/install/development-channels)
