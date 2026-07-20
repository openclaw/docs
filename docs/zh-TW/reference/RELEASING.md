---
read_when:
    - 尋找公開發布頻道的定義
    - 執行版本驗證或套件驗收
    - 尋找版本命名與發布週期
summary: 發布管道、操作人員檢查清單、驗證方塊、版本命名與發布週期
title: 發布政策
x-i18n:
    generated_at: "2026-07-20T00:54:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7807f44029f8f5fd0d40499c0b1f2e731cd99780cf1f081bf62230a2146c49e4
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前提供三個面向使用者的更新通道：

- stable：現有的已推廣發行通道，在獨立的命令列介面／通道里程碑完成前，仍會透過 npm `latest` 解析
- beta：發佈至 npm `beta` 的預發行標籤
- dev：`main` 的持續移動最新版本

另外，發行作業人員可將前一個已結束月份的核心套件發佈至 npm
`extended-stable`，從修補版本 `33` 開始。當月的
一般最終版本線會繼續使用 npm `latest`；這項作業端的發佈
分流本身不會變更命令列介面的更新通道解析方式。

Tideclaw alpha 組建是另一條內部預發行軌道（npm dist-tag `alpha`），相關內容請參閱 [NPM 工作流程輸入](#npm-workflow-inputs)與[發行測試機](#release-test-boxes)。

## 版本命名

- 每月 npm 延伸穩定版發行版本：`YYYY.M.PATCH`，搭配 `PATCH >= 33`、git 標籤 `vYYYY.M.PATCH`
- 每日／一般最終發行版本：`YYYY.M.PATCH`，搭配 `PATCH < 33`、git 標籤 `vYYYY.M.PATCH`
- 一般備援修正發行版本：`YYYY.M.PATCH-N`，git 標籤 `vYYYY.M.PATCH-N`
- Beta 預發行版本：`YYYY.M.PATCH-beta.N`，git 標籤 `vYYYY.M.PATCH-beta.N`
- Alpha 預發行版本：`YYYY.M.PATCH-alpha.N`，git 標籤 `vYYYY.M.PATCH-alpha.N`
- 月份或修補版本絕不可補零
- `PATCH` 是依序遞增的每月發行列車編號，而不是日曆日期。一般最終版與 beta 發行會推進目前的發行列車；僅有 alpha 的標籤絕不會占用或推進 beta／一般版本的修補編號，因此選擇 beta 或一般發行列車時，請忽略修補編號較高的舊版純 alpha 標籤。
- Alpha／夜間組建使用下一個尚未發行的修補版本列車，重複組建時只遞增 `alpha.N`。該修補版本一旦有 beta，新 alpha 組建就會移至下一個修補版本。
- npm 版本不可變更：絕不可刪除、重新發佈或重複使用已發佈的標籤。請改為建立下一個預發行編號或下一個每月修補版本。
- `latest` 繼續跟隨目前的一般／每日 npm 版本線；`beta` 是目前的 beta 安裝目標
- `extended-stable` 代表受支援的前一月份 npm 套件，從修補版本 `33` 開始；修補版本 `34` 及之後的版本是該每月版本線上的維護發行
- 一般最終版與一般修正發行預設發佈至 npm `beta`；發行作業人員可明確指定 `latest`，或稍後推廣已審核的 beta 組建
- 專用的每月延伸穩定版路徑會以完全相同的版本發佈核心 npm 套件，以及每個可發佈至 npm 的官方外掛。它不會將外掛發佈至 ClawHub，也不會發佈 macOS 或 Windows 成品、GitHub Release、私有儲存庫 dist-tag、Docker 映像、行動裝置成品或網站下載項目。
- 每個一般最終發行都會一併交付 npm 套件、macOS 應用程式、已簽署的獨立 Android APK，以及已簽署的 Windows Hub 安裝程式。Beta 發行通常會先驗證並發佈 npm／套件路徑；除非明確要求，原生應用程式的組建、簽署、公證與推廣會保留至一般最終發行時進行。

## 發行節奏

- 發行會先推出 beta；只有在最新 beta 通過驗證後，才會推出 stable
- 維護者通常會從目前的 `main` 建立 `release/YYYY.M.PATCH` 分支來製作發行，因此發行驗證與修正不會阻礙 `main` 上的新開發
- 如果 beta 標籤已推送或發佈後需要修正，維護者會建立下一個 `-beta.N` 標籤，而不是刪除或重新建立舊標籤
- 詳細的發行程序、核准、認證資訊與復原注意事項僅供維護者使用

## 僅限 npm 的每月延伸穩定版發佈

這是下方一般發行程序的專用例外。針對已結束的月份
`YYYY.M`，建立 `extended-stable/YYYY.M.33`；並從同一分支發佈
`vYYYY.M.33` 及之後的維護修補版本。發行標籤、分支頂端、簽出內容、
套件版本、npm 預檢，以及完整發行驗證執行，都必須指向同一個提交。
受保護的 `main` 必須已包含嚴格晚於該月份之日曆月份的最終版本，
且修補版本低於 `33`；即使 `main` 已推進超過一個月，
維護修補版本仍符合資格。

在指定的延伸穩定版分支上，將根套件版本提升至 `YYYY.M.P`，執行
`pnpm release:prep`，並確認每個可發佈的擴充套件都具有
相同版本。提交並推送所有產生的變更，在該提交建立並推送
不可變更的 `vYYYY.M.P` 標籤，並記錄產生的完整 SHA。
工作流程會使用這棵已準備好的檔案樹；它們不會代你提升或同步
版本。

從該已準備分支的確切頂端執行 npm 預檢與完整發行驗證，
然後儲存兩者的執行 ID，以及成功的完整發行驗證
執行嘗試編號：

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

`release_profile=stable` 是現有的驗證深度設定檔；它與 npm
`extended-stable` dist-tag 分開，並刻意維持不變。

兩項執行都成功後，從完全相同的分支頂端發佈每個可發佈至 npm 的
官方外掛。修補版本 `P` 必須為 `33` 或更高版本。
將完整發行 SHA 以 `ref` 傳入，等待完整矩陣與登錄檔回讀完成，
然後儲存成功的外掛 NPM 發行執行 ID：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

工作流程會使用一般已準備的 `all-publishable` 套件清單，
包括原始碼未變更的套件。成功前，它會驗證每個確切套件
以及每個外掛的 `extended-stable` 標籤。如果部分執行失敗，
請重新執行相同命令：已發佈的套件會被重複使用、缺少或過期的
外掛標籤會在 npm 發行環境下調整一致，而最終回讀仍會涵蓋
完整套件集合。

外掛工作流程成功且 npm 發行環境準備完成後，
發佈預檢所產生的確切核心 tarball。核心發佈會驗證
所參照的外掛執行在相同的標準分支上為 `completed/success`，
且使用完全相同的來源 SHA：

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

對於刻意無法符合每月 `.33` 或受保護
`main` 月份政策的分支版本或非正式環境演練，
請在 npm 預檢與發佈分派中都加入 `-f bypass_extended_stable_guard=true`。
預設值為 `false`。只有搭配 `npm_dist_tag=extended-stable`
時才會接受略過，且會記錄於工作流程摘要中。
它不會略過標準 `extended-stable/YYYY.M.33` 工作流程參照、
分支頂端／標籤／簽出內容相等性、最終標籤語法、套件／標籤版本
相等性、所參照執行與資訊清單身分、tarball 來源、
環境核准、登錄檔回讀或選擇器修復證據。

發佈工作流程會驗證所參照的預檢、驗證與外掛執行身分、
已準備 tarball 的摘要，以及核心登錄檔選擇器。
工作流程成功後，請獨立確認結果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

兩個命令都必須傳回 `YYYY.M.P`。如果發佈成功但選擇器
回讀失敗，請勿重新發佈不可變更的套件版本。請使用失敗工作流程的
固定執行摘要中所列出的單一 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復命令，
然後再次執行兩項獨立回讀。回復至先前的選擇器是另一項作業人員
決策，並非回讀修復路徑。

公開支援文件一開始將 Slack、Discord 與 Codex 指定為
涵蓋的延伸穩定版外掛介面。該清單是支援聲明，而非
發行程式碼允許清單：每個可發佈至 npm 的官方外掛都遵循
相同的精確版本發佈路徑。

下方的一般檢查清單繼續負責 beta、`latest`、GitHub Release、
外掛、macOS、Windows 與其他平台的發佈。請勿對這條僅限 npm 的
延伸穩定版路徑執行這些步驟。

## 一般發行作業人員檢查清單

此檢查清單是發行流程的公開形式。私有認證資訊、簽署、公證、dist-tag 復原與緊急回復細節仍保留於僅供維護者使用的發行操作手冊中。

1. 從目前的 `main` 開始：拉取最新內容、確認目標提交已推送，並確認 `main` CI 的狀態足以從中建立分支。
2. 從該提交建立 `release/YYYY.M.PATCH`。是否回移修正為選擇性；只套用作業人員選定的集合。提升每個必要位置的版本、執行 `pnpm release:prep`、完成發行修正與必要的向前移植，並審查 `src/plugins/compat/registry.ts` 及 `src/commands/doctor/shared/deprecation-compat.ts`。
3. 將產品完成且尚未產生變更日誌的提交凍結為**程式碼 SHA**。執行確定性的來源預檢，然後使用 `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`。這會固定受信任的工作流程工具，同時讓完整的 Vitest、Docker、QA、套件與效能矩陣以確切的程式碼 SHA 為目標。
4. 編輯前先分類失敗原因。產品／程式碼失敗會產生新的程式碼 SHA，且該 SHA 必須通過完整驗證。工作流程、測試框架、認證資訊、核准或基礎架構失敗，則在其所屬介面中修復，並針對相同的程式碼 SHA 重新執行。
5. 只有在程式碼 SHA 通過後，才根據自上一個可到達的已交付標籤以來合併的 PR 與直接提交，產生最上方的 `CHANGELOG.md` 區段。條目應面向使用者且不重複。當分歧的已交付標籤或之後的向前移植，將已發行的 PR 重新關聯時，請明確以 `--shipped-ref` 傳入。
6. 只提交 `CHANGELOG.md`。此提交即為**發行 SHA**。從程式碼 SHA 到發行 SHA 的完整差異必須恰好只有 `CHANGELOG.md`；若有任何其他路徑變更，發行程序就必須返回步驟 2。
7. 針對發行 SHA 執行固定 SHA 的完整發行驗證，並啟用證據重複使用。輕量級父執行必須記錄 `changelog-only-release-v1`、指向已通過的程式碼 SHA，且不得分派任何產品子執行通道。這會重複使用產品證據；不會重複使用套件位元組。
8. 針對發行 SHA／標籤，以 `preflight_only=true` 執行 `OpenClaw NPM Release`。儲存成功的 `preflight_run_id`。這會組建並檢查包含最終變更日誌的確切套件位元組。
9. 為發行 SHA 加上標籤，然後使用成功的發行 SHA 驗證父執行與 npm 預檢來執行候選版本輔助工具，不要再次分派其中任何一項：

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   對於穩定版，也請傳入 `--windows-node-tag vX.Y.Z`。此輔助工具會驗證版本資訊來源、npm 預檢位元組、Parallels 安裝／更新證明、Telegram 套件證明，以及外掛發布計畫，接著印出發布命令。

   `OpenClaw Release Publish` 會將選定或所有可發布的外掛套件分派至 npm，並行將同一組套件分派至 ClawHub；外掛成功發布至 npm 後，再使用相符的 dist-tag 推送已備妥的 OpenClaw npm 預檢成品。版本簽出仍是產品／資料根目錄，而規劃與最終驗證則從完全相符且受信任的工作流程來源簽出執行，確保較舊的版本提交無法在未察覺的情況下使用過時的發布工具。任何發布子工作開始前，它會轉譯並快取確切的 GitHub 版本內容。當完整且相符的 `CHANGELOG.md` 章節符合 GitHub 的 125,000 字元限制及轉譯器相符的 125,000 位元組安全上限時，頁面會包含該確切的 `## YYYY.M.PATCH` 章節及其標題。來源章節若無法容納，頁面會保留原封不動的分組編輯說明，並將過大的貢獻紀錄替換為指向標籤固定之 `CHANGELOG.md` 中完整紀錄的穩定連結；絕不發布不完整的紀錄或遭截斷的項目。工作流程會先選擇完整或精簡內容，再加入 `### Release verification`；若證明尾段會超出限制，則保留標準內容，並改以不可變的隨附證據為準。發布至 npm `latest` 的穩定版會成為 GitHub 最新版本，而保留在 npm `beta` 的穩定維護版本則會以 GitHub `latest=false` 建立。工作流程也會將預檢相依性證據、完整驗證資訊清單，以及發布後登錄檔驗證證據上傳至 GitHub 版本，以供發布後事件回應使用。它會立即印出子工作執行 ID、自動核准工作流程權杖獲准核准的發布環境閘門、以日誌尾段摘要失敗的子工作、預先建立 GitHub 草稿版本頁面，並在 OpenClaw npm 發布的同時推送 Windows 與 Android 成品；這些階段成功後，它會完成版本頁面與相依性證據，在發布 OpenClaw npm 時等待 ClawHub，接著執行受信任 main 的 beta 驗證器，並上傳 GitHub 版本、npm 套件、選定的外掛 npm 套件、選定的 ClawHub 套件、子工作流程執行 ID，以及選用的 NPM Telegram 執行 ID 等發布後證據。ClawHub 啟動驗證器要求完全相符且受信任的 main 工作流程路徑與 SHA、生產端與終止執行嘗試、版本 SHA、要求的套件組、不可變的套件成品元組，以及終止登錄檔讀回成品；不接受成功的舊式版本參照執行。

   接著，針對已發布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 套件執行發布後套件驗收。若已推送或發布的預發行版本需要修正，請建立下一個相符的預發行版本編號；絕不可刪除或改寫舊版本。

10. 發布嘗試失敗時，除非失敗證明產品或變更日誌有缺陷，否則應保持版本 SHA 不變。繼續使用已成功且不可變的子工作與成品；絕不可重新建置或重新發布已成功的套件版本。
11. 對於穩定版，僅在經審查的 beta 或候選版本具備必要的驗證證據後才可繼續。穩定版 npm 發布也會經過 `OpenClaw Release Publish`，並透過 `preflight_run_id` 重複使用成功的預檢成品。穩定版 macOS 發布就緒還要求 `main` 上已封裝的 `.zip`、`.dmg`、`.dSYM.zip`，以及已更新的 `appcast.xml`；macOS 發布工作流程會在版本成品通過驗證後，自動將已簽署的 appcast 發布至公開的 `main`，若分支保護阻擋直接推送，則會開啟或更新 appcast PR。穩定版 Windows Hub 就緒要求 OpenClaw GitHub 版本中已簽署的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 與 `OpenClawCompanion-SHA256SUMS.txt` 成品。將完全相符且已簽署的 `openclaw/openclaw-windows-node` 版本標籤以 `windows_node_tag` 傳入，並將其經候選版本核准的安裝程式摘要對應表以 `windows_node_installer_digests` 傳入；`OpenClaw Release Publish` 會保留版本草稿、分派 `Windows Node Release`，並在發布前驗證全部三個成品。
12. 發布後，請執行 npm 發布後驗證器；需要發布後頻道證明時，可選擇執行獨立的已發布 npm Telegram E2E；並視需要推送 dist-tag、驗證產生的 GitHub 版本頁面、執行版本公告步驟，接著完成[穩定版 main 收尾](#stable-main-closeout)，才能將穩定版視為完成。

## 穩定版 main 收尾

在 `main` 帶有實際已發布的版本狀態前，穩定版發布尚未完成。

1. 從全新且最新的 `main` 開始。依此稽核 `release/YYYY.M.PATCH`，並向前移植 `main` 中缺少的實際修正。請勿盲目將僅供版本使用的相容性、測試或驗證配接器合併至較新的 `main`。
2. 一般路徑應將 `main` 設為已發布的穩定版本。若 `main` 已推進至較新的 OpenClaw 穩定版 CalVer，延遲的收尾可使用該版本；請勿只為完成前一版本的收尾，而將已啟動的版本列車降級。驗證器仍要求完全相符的已發布變更日誌章節與 appcast 項目，並記錄實際的 `main` 版本及 SHA。根版本有任何變更後，請執行 `pnpm release:prep`，接著執行 `pnpm deps:shrinkwrap:generate`。
3. 讓 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 章節與已標記的版本分支完全一致。若 Mac 版本發布了穩定版 `appcast.xml` 更新，也請納入該更新。
4. 在操作者明確啟動該版本列車前，請勿將 `YYYY.M.PATCH+1`、beta 版本或空白的未來變更日誌章節加入 `main`。
5. 執行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 與 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送後，請先驗證 `origin/main` 包含已發布的版本與變更日誌，再將穩定版視為完成。
6. 每次私有回復演練後，請讓儲存庫變數 `RELEASE_ROLLBACK_DRILL_ID` 與 `RELEASE_ROLLBACK_DRILL_DATE` 保持最新。

`OpenClaw Stable Main Closeout` 會從穩定版發布後，帶有已發布版本、變更日誌及 appcast 的 `main` 推送開始。它會讀取不可變的發布後證據，將已發布的標籤繫結至其完整版本驗證與發布執行，接著驗證穩定版 main 狀態、版本、必要的穩定版浸泡測試，以及具阻擋性的效能證據。它會將不可變的收尾資訊清單與總和檢查碼附加至 GitHub 版本。自動推送觸發程序會略過早於不可變發布後證據的舊式版本，且絕不會將該略過視為已完成收尾。

完整收尾同時需要兩個成品及相符的總和檢查碼。部分資訊清單會重播其記錄的 `main` SHA 與回復演練，以重新產生完全相同的位元組，接著附加缺少的總和檢查碼；無效的配對，或只有總和檢查碼而沒有資訊清單，仍會造成阻擋。由推送觸發、但缺少回復演練儲存庫變數的執行會略過，且不會完成收尾；缺少或超過 90 天的演練紀錄，仍會阻擋手動且有證據支持的收尾。私有復原命令仍保留在僅供維護者使用的操作手冊中。僅可使用手動分派來修復或重播有證據支持的穩定版收尾。

若版本發布父工作僅在附加不可變的 npm／外掛證據後失敗，請先修復並發布所有穩定版平台成品。接著，維護者可使用 `allow_failed_publish_recovery=true` 手動分派收尾；此模式僅接受已完成但失敗的父工作，此外還要求完全相符的 Android 與 Windows 成品合約、GitHub SHA-256 摘要、總和檢查碼驗證、Android 來源證明，以及由父工作分派且成功的 Windows 推送，其 Authenticode 檢查與經候選版本核准的摘要須符合已發布的安裝程式，並同時滿足一般的 macOS／appcast 檢查。自動推送收尾絕不會啟用此復原模式。

舊式備援修正標籤僅能在修正標籤解析至與基礎穩定版標籤相同的來源提交時，重複使用基礎套件證據。其 Android 版本會重複使用基礎標籤已驗證的 APK，並為修正標籤加入來源證明。來源不同的修正必須發布並驗證自己的套件證據，並使用較高的 Android `versionCode`。

## 發布預檢

- 在發布預檢前執行 `pnpm check:test-types`，以確保測試 TypeScript 在較快速的本機 `pnpm check` 閘門之外仍涵蓋在內。
- 在發布預檢前執行 `pnpm check:architecture`，以確保更廣泛的匯入循環與架構邊界檢查在較快速的本機閘門之外維持通過狀態。
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，以確保封裝驗證步驟所需的 `dist/*` 版本成品與 Control UI 套件組合已存在。
- 在根版本調升後且建立標籤前執行 `pnpm release:prep`。它會執行每個常在版本／設定／API 變更後發生偏移的確定性版本產生器：外掛版本、npm shrinkwrap、外掛清單、基礎設定結構描述、隨附頻道設定中繼資料、設定文件基準、外掛 SDK 匯出、外掛 SDK API 合約資訊清單，以及 Control UI 語系套件組合。它也會持續阻擋，直到原生應用程式翻譯與平台產生的語系資源符合來源清單；若有落後，請在凍結程式碼 SHA 前等待或分派 `Native App Locale Refresh`。`pnpm release:check` 會以檢查模式重新執行這些防護措施（包括嚴格的語系閘門與外掛 SDK 介面預算），並在執行套件版本檢查前，一次回報所有產生內容偏移失敗。
- 外掛版本同步預設會將可發布的 `@openclaw/ai` 執行階段套件、官方外掛套件版本，以及現有的 `openclaw.compat.pluginApi` 下限更新為 OpenClaw 版本。請將該欄位視為外掛 SDK／執行階段 API 下限，而不只是套件版本的副本：對於刻意保持與舊版 OpenClaw 主機相容、且僅發布外掛的版本，請將下限保留為最舊的受支援主機 API，並在外掛發布證明中記錄此選擇。
- 在核准版本前執行手動 `Full Release Validation` 工作流程，以從單一進入點啟動所有預發行測試箱。它接受分支、標籤或完整提交 SHA，分派手動 `CI`，並分派 `OpenClaw Release Checks` 以執行安裝煙霧測試、套件驗收、跨作業系統套件檢查、QA Lab 一致性、Matrix 與 Telegram 工作線。穩定版與完整執行一律包含全面的即時／E2E 與 Docker 發布路徑浸泡測試；保留 `run_release_soak=true` 供明確的 beta 浸泡測試使用。套件驗收會在候選版本驗證期間提供標準套件 Telegram E2E，避免另一個並行的即時輪詢器。

  發布 beta 後提供 `release_package_spec`，以在版本檢查、套件驗收及套件 Telegram E2E 中重複使用已發布的 npm 套件，而無須重新建置版本 tarball。僅當 Telegram 應使用與其餘版本驗證不同的已發布套件時，才提供 `npm_telegram_package_spec`。當套件驗收應使用與版本套件規格不同的已發布套件時，提供 `package_acceptance_package_spec`。當版本證據報告應證明驗證符合已發布的 npm 套件，而不強制執行 Telegram E2E 時，提供 `evidence_package_spec`。

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- 當你希望在發布工作持續進行時，為套件候選版本取得旁路證明，請執行手動 `Package Acceptance` 工作流程。使用 `source=npm` 處理 `openclaw@beta`、`openclaw@latest` 或確切的發布版本；使用 `source=ref`，透過目前的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支／標籤／SHA；使用 `source=url` 處理具有必要 SHA-256 與嚴格公開 URL 政策的公開 HTTPS tarball；使用 `source=trusted-url`，透過必要的 `trusted_source_id` 與 SHA-256 套用具名受信任來源政策；或使用 `source=artifact` 處理由另一個 GitHub Actions 執行所上傳的 tarball。

  此工作流程會將候選版本解析為 `package-under-test`，針對該 tarball 重複使用 Docker E2E 發布排程器，並可透過 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`，對同一個 tarball 執行 Telegram QA。當選取的 Docker 執行通道包含 `published-upgrade-survivor` 時，套件成品就是候選版本，而 `published_upgrade_survivor_baseline` 會選取已發布的基準版本。`update-restart-auth` 會將候選套件同時用作已安裝的命令列介面與受測套件，因此會測試候選版本更新命令的受管理重新啟動路徑。

  範例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常用設定檔：
  - `smoke`：安裝／頻道／代理程式、閘道網路與設定重新載入執行通道
  - `package`：不含 OpenWebUI 或即時 ClawHub 的成品原生套件／更新／重新啟動／外掛執行通道
  - `product`：套件設定檔，加上 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋與 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker 發布路徑區塊
  - `custom`：用於聚焦重新執行的確切 `docker_lanes` 選項

- 當只需要為發布候選版本提供確定性的正常 CI 涵蓋範圍時，請直接執行手動 `CI` 工作流程。手動 CI 分派會略過變更範圍界定，並強制執行 Linux Node 分片、內附外掛分片、外掛與頻道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS 與 Control UI i18n 執行通道。獨立手動 CI 執行只有在使用 `include_android=true` 分派時才會執行 Android；`Full Release Validation` 會將該輸入傳遞給其 CI 子工作流程。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 驗證發布遙測時，請執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器測試 QA-lab，並驗證追蹤、指標與日誌匯出，以及受限的追蹤屬性和內容／識別碼遮蔽，無須使用 Opik、Langfuse 或其他外部收集器。
- 驗證收集器相容性時，請執行 `pnpm qa:otel:collector-smoke`。它會先透過真正的 OpenTelemetry Collector Docker 容器路由相同的 QA-lab OTLP 匯出，再進行本機接收器判定。
- 驗證受保護的 Prometheus 擷取時，請執行 `pnpm qa:prometheus:smoke`。它會測試 QA-lab、拒絕未經驗證的擷取，並驗證發布關鍵指標系列不含提示內容、原始識別碼、驗證權杖與本機路徑。
- 請執行 `pnpm qa:observability:smoke`，以依序執行來源簽出版本的 OpenTelemetry 與 Prometheus 冒煙測試通道。
- 每次建立帶標籤的發布版本前，請執行 `pnpm release:check`。
- `OpenClaw NPM Release` 預檢會先產生相依套件發布證據，再封裝 npm tarball。npm 安全公告漏洞閘門會阻擋發布。遞移資訊清單風險、相依套件擁有權／安裝介面，以及相依套件變更報告僅作為發布證據。相依套件變更報告會比較發布候選版本與上一個可到達的發布標籤。預檢會將相依套件證據上傳為 `openclaw-release-dependency-evidence-<tag>`，也會將其嵌入已準備的 npm 預檢成品內的 `dependency-evidence/`。實際發布路徑會重複使用該預檢成品，接著將同一份證據以 `openclaw-<version>-dependency-evidence.zip` 附加至 GitHub 發布版本。
- 標籤存在後，請執行 `OpenClaw Release Publish` 以進行會修改狀態的發布流程。請從受信任的 `main` 分派一般 beta 與穩定版發布；發布標籤仍會選取確切的目標提交，且可能指向 `release/YYYY.M.PATCH`。Tideclaw alpha 發布則維持在其對應的 alpha 分支。請傳入成功的 OpenClaw npm `preflight_run_id`、成功的 `full_release_validation_run_id` 與確切的 `full_release_validation_run_attempt`，並維持預設的外掛發布範圍 `all-publishable`，除非刻意執行聚焦修復。此工作流程會依序執行外掛 npm 發布、外掛 ClawHub 發布與 OpenClaw npm 發布，確保核心套件不會早於其外部化外掛發布；Windows 與 Android 推廣會在草稿發布頁面上，與核心 npm 發布同時執行。發布重新執行可從中斷處繼續：若核心 npm 版本已發布，工作流程會在證明登錄檔 tarball 與該標籤的預檢成品相符後略過核心分派；若發布版本已包含經驗證的成品合約，則會略過 Windows／Android 推廣，因此重試只會重做失敗的階段。僅限外掛的聚焦修復需要 `plugin_publish_scope=selected` 與非空白外掛清單。僅限外掛的 `all-publishable` 執行需要完整且不可變的預檢與完整發布驗證證據；部分證據會遭拒絕。
- 穩定版 `OpenClaw Release Publish` 要求在相符的非預發布 `openclaw/openclaw-windows-node` 發布版本存在後，提供確切的 `windows_node_tag`，以及經候選版本核准的 `windows_node_installer_digests` 對應表。在分派任何發布子工作流程前，它會驗證來源發布版本已發布、不是預發布版本、包含必要的 x64／ARM64 安裝程式，且仍與該已核准對應表相符。接著，它會在 OpenClaw 發布版本仍為草稿時分派 `Windows Node Release`，並原封不動地攜帶已釘選的安裝程式摘要對應表。子工作流程會從該確切標籤下載已簽署的 Windows Hub 安裝程式，將其與已釘選的摘要比對，在 Windows 執行器上驗證其 Authenticode 簽章使用預期的 OpenClaw Foundation 簽署者，寫入 SHA-256 資訊清單，並將安裝程式與資訊清單上傳至正式的 OpenClaw GitHub 發布版本，接著重新下載已推廣的成品，並驗證資訊清單成員資格與雜湊值。父工作流程會在發布前驗證目前的 x64、ARM64 與總和檢查碼成品合約。直接復原會先拒絕未預期的 `OpenClawCompanion-*` 成品名稱，再以已釘選的來源位元組取代預期的合約成品。

  僅限復原時才手動分派 `Windows Node Release`，且一律傳入確切標籤，絕不可使用 `latest`，並傳入已核准來源發布版本中明確的 `expected_installer_digests` JSON 對應表。網站下載連結應指向目前穩定版本的確切 OpenClaw 發布成品 URL；只有在驗證 GitHub 的 latest 重新導向指向同一個發布版本後，才可使用 `releases/latest/download/...`；請勿只連結至配套儲存庫的發布頁面。

- 發行檢查現在於獨立的手動工作流程中執行：`OpenClaw Release Checks`。在核准發行前，它也會執行 QA Lab 模擬同等性執行管道、Matrix 發行設定檔與 Telegram QA 執行管道。即時執行管道使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI 認證資訊租約。若要執行所有維護中的 Matrix 情境，請使用 `matrix_profile=all` 執行手動 `QA-Lab - All Lanes` 工作流程；該工作流程會將此選擇展開至傳輸、媒體及 E2EE 設定檔，以便在各工作的逾時限制內完成完整驗證。
- 跨作業系統安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，兩者會直接呼叫可重複使用的工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。這項拆分是刻意的：讓實際的 npm 發行路徑保持簡短、確定且聚焦於成品，而較慢的即時檢查則留在各自的執行管道中，避免延誤或阻擋發布。
- 含有密鑰的發行檢查應透過 `Full Release Validation`，或從 `main`/release 工作流程參照分派，以確保工作流程邏輯與密鑰受到控管。
- `OpenClaw Release Checks` 接受分支、標籤或完整提交 SHA，前提是解析出的提交可從 OpenClaw 分支或發行標籤存取。
- `OpenClaw NPM Release` 的僅驗證預檢也接受目前完整的 40 字元工作流程分支提交 SHA，無須已推送的標籤。此 SHA 路徑僅供驗證，不能提升為實際發布。在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；實際發布仍需要真正的發行標籤。
- 這兩個工作流程都會讓實際發布與提升路徑在 GitHub 託管的執行器上執行，而不會變更狀態的驗證路徑則可使用較大型的 Blacksmith Linux 執行器。
- 該工作流程會同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` 工作流程密鑰來執行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`。
- npm 發行預檢不再等待獨立的發行檢查執行管道。
- 在本機為發行候選版本加上標籤前，請執行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。此輔助程式會依序執行快速發行護欄、外掛 npm/ClawHub 發行檢查、建置、UI 建置與 `release:openclaw:npm:check`，以便在 GitHub 發布工作流程開始前找出常見且會阻擋核准的錯誤。
- 請在核准前執行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的預發行／修正版標籤）。
- npm 發布後，請執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或相符的 beta／修正版本），以使用全新的暫存前綴驗證已發布的登錄檔安裝路徑。
- beta 發布後，請執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共用的租用 Telegram 認證資訊集區，針對已發布的 npm 套件驗證已安裝套件的初始設定、Telegram 設定及真正的 Telegram E2E。本機維護者的一次性執行可以省略 Convex 變數，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` 環境認證資訊。
- 若要從維護者的機器執行完整的發布後 beta 冒煙測試，請使用 `pnpm release:beta-smoke -- --beta betaN`。此輔助程式會執行 Parallels npm 更新／全新目標驗證、分派 `NPM Telegram Beta E2E`、輪詢確切的工作流程執行、下載成品，並列印 Telegram 報告。
- 維護者可透過手動 `NPM Telegram Beta E2E` 工作流程，在 GitHub Actions 中執行相同的發布後檢查。它刻意設為只能手動執行，不會在每次合併時執行。
- 維護者發行自動化採用先預檢、再提升的方式：
  - 實際 npm 發布必須通過成功的 npm `preflight_run_id`。
  - 一般 beta 與穩定版的發布協調及預檢，會針對確切的目標標籤使用受信任的 `main`。Tideclaw alpha 發布與預檢則使用相符的 alpha 分支。
  - 穩定版 npm 發行預設為 `beta`；穩定版 npm 發布可透過工作流程輸入明確指定 `latest`。
  - 以權杖為基礎的 npm dist-tag 變更位於 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而來源存放庫維持僅使用 OIDC 發布。
  - 公開的 `macOS Release` 僅供驗證；當標籤只存在於發行分支，但工作流程是從 `main` 分派時，請設定 `public_release_branch=release/YYYY.M.PATCH`。
  - 實際 macOS 發布必須通過成功的 macOS `preflight_run_id` 與 `validate_run_id`。
  - 實際發布路徑會提升已準備好的成品，而不會再次重新建置。
- 對於 `YYYY.M.PATCH-N` 之類的穩定版修正發行，發布後驗證程式也會檢查從 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同暫存前綴升級路徑，確保發行修正不會在未被察覺的情況下，讓較舊的全域安裝仍使用基礎穩定版內容。
- 除非 tarball 同時包含 `dist/control-ui/index.html` 與非空白的 `dist/control-ui/assets/` 內容，否則 npm 發行預檢會採取封閉式失敗，以免再次發布空白的瀏覽器儀表板。
- 發布後驗證也會檢查已發布的外掛進入點與套件中繼資料是否存在於已安裝的登錄檔配置中。若發行版本缺少外掛執行階段內容，將無法通過發布後驗證程式，也無法提升至 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，讓安裝程式 E2E 能在發行發布路徑執行前找出意外的套件膨脹。
- 若發行工作觸及 CI 規劃、擴充功能計時資訊清單或擴充功能測試矩陣，請在核准前從 `.github/workflows/plugin-prerelease.yml` 重新產生並檢閱由規劃工具擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，以免發行說明描述過時的 CI 配置。
- 穩定版 macOS 發行就緒狀態也包括更新程式介面：GitHub 發行最終必須包含已封裝的 `.zip`、`.dmg` 與 `.dSYM.zip`；發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip（macOS 發布工作流程會自動提交，若直接推送遭到封鎖，則會開啟 appcast PR）；已封裝的應用程式必須保留非偵錯套件識別碼、非空白的 Sparkle 摘要 URL，以及不低於該發行版本之標準 Sparkle 建置下限的 `CFBundleVersion`。

## 發行測試機器

`Full Release Validation` 是操作人員從單一進入點啟動完整產品矩陣的方式。請使用此輔助程式，讓每個子工作流程都從固定在一個受信任 `main` 工作流程 SHA 的暫存分支執行，同時讓要求的提交維持為受測候選版本：

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

此輔助程式會擷取目前的 `origin/main`、在該受信任的工作流程提交上推送 `release-ci/<workflow-sha>-...`、從 alpha／beta 套件版本推斷 `beta`（否則使用 `stable`）、從暫存分支以 `ref=<target-sha>` 分派 `Full Release Validation`、驗證每個子工作流程的 `headSha` 都符合固定的父工作流程 SHA，然後刪除暫存分支。傳入 `-f reuse_evidence=false` 可強制執行全新工作、傳入 `-f release_profile=full` 可執行廣泛的諮詢性掃描，或傳入 `--workflow-sha <trusted-main-sha>` 可固定仍能從目前 `origin/main` 存取的較舊提交。工作流程本身絕不寫入存放庫參照。這可在不將工具提交加入候選版本的情況下，使用僅存在於 main 的發行工具，並避免意外驗證較新的 `main` 子工作流程執行。

Code SHA 顯示綠燈後，只提交 `CHANGELOG.md`，並使用 Release SHA 執行相同的輔助程式：

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

只有在 GitHub 證明 Release SHA 衍生自 Code SHA，且完整的變更路徑集合恰好為 `CHANGELOG.md` 時，第二個父工作流程才會重複使用產品證據。它會記錄 `changelog-only-release-v1`，且不分派任何產品子工作流程。npm 預檢與套件／安裝驗收仍會在 Release SHA 上執行，因為其 tarball 位元組已變更。

對於全新的 Code SHA，工作流程會解析目標、分派手動 `CI`，然後分派 `OpenClaw Release Checks`。`OpenClaw Release Checks` 會展開執行安裝冒煙測試、跨作業系統發行檢查、啟用浸泡測試時的即時／E2E Docker 發行路徑涵蓋範圍、包含標準 Telegram 套件 E2E 的套件驗收、QA Lab 同等性、即時 Matrix 與即時 Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci`、`plugin_prerelease` 與 `release_checks` 均成功時，完整／全部執行才可接受；除非聚焦的重新執行刻意略過獨立的 `Plugin Prerelease` 子工作流程。僅在使用 `release_package_spec` 或 `npm_telegram_package_spec` 進行聚焦的已發布套件重新執行時，才使用獨立的 `npm-telegram` 子工作流程。最終驗證程式摘要包含每個子工作流程執行的最慢工作表格，讓發行管理者無須下載記錄檔即可查看目前的關鍵路徑。

在此發行路徑中，產品效能子工作流程僅產生成品。傘狀工作流程會使用 `publish_reports=false` 分派它；除非其僅成品護欄證明 Clawgrit 報告發布程式維持略過狀態，否則驗證會遭拒。

如需完整的階段矩陣、確切的工作流程工作名稱、穩定版與完整設定檔的差異、成品及聚焦重新執行控制項，請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)。

子工作流程是從執行 `Full Release Validation`、以 SHA 固定的受信任參照分派。每個子工作流程執行都必須使用完全相同的父工作流程 SHA。請勿使用原始 `--ref main -f ref=<sha>` 分派作為發行驗證；請使用 `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`。

使用 `release_profile` 選取即時／供應商涵蓋廣度：

- `beta`：最快的發行關鍵 OpenAI／核心即時與 Docker 路徑
- `stable`：用於發行核准的 beta 加穩定版供應商／後端涵蓋範圍
- `full`：穩定版加廣泛的諮詢性供應商／媒體涵蓋範圍

穩定版與完整驗證在提升前，一律會執行詳盡的即時／E2E、Docker 發行路徑及有界限的已發布升級存續掃描。使用 `run_release_soak=true` 可為 beta 要求相同的掃描。此掃描涵蓋最新四個穩定版套件、固定的 `2026.4.23` 與 `2026.5.2` 基準，以及較舊的 `2026.4.15` 涵蓋範圍；其中會移除重複基準，並將每個基準分片至各自的 Docker 執行器工作。

`OpenClaw Release Checks` 使用受信任的工作流程參照，將目標參照一次解析為 `release-package-under-test`，並在執行浸泡測試時，於跨作業系統、套件驗收及發行路徑 Docker 檢查中重複使用該成品。這可讓所有面向套件的測試機器使用相同位元組，並避免重複建置套件。beta 已發布至 npm 後，請設定 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，讓發行檢查只下載一次已發布的套件、從 `dist/build-info.json` 擷取其建置來源 SHA，並在跨作業系統、套件驗收、發行路徑 Docker 及套件 Telegram 執行管道中重複使用該成品。

當存放庫／組織變數已設定時，跨作業系統 OpenAI 安裝冒煙測試會使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.6-luna`，因為此執行管道要驗證的是套件安裝、初始設定、閘道啟動及一次即時代理程式互動，而非評測功能最強大的模型。較廣泛的即時供應商矩陣仍是涵蓋特定模型的執行位置。

請依發行階段使用下列變體：

```bash
# 驗證產品完整的 Code SHA。
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# 重複使用 Code SHA 產品證據，驗證僅變更日誌的 Release SHA。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# 發布 beta 後，加入已發布套件的 Telegram E2E。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

進行針對性修正後，第一次重新執行時不要使用完整的總括流程。如果某個執行環境失敗，下一次驗證請使用失敗的子工作流程、工作、Docker 通道、套件設定檔、模型供應商或 QA 通道。只有在修正變更了共用的發布協調流程，或使先前所有執行環境的證據失效時，才再次執行完整的總括流程。總括流程的最終驗證器會重新檢查已記錄的子工作流程執行 ID，因此成功重新執行子工作流程後，只需重新執行失敗的 `Verify full validation` 父工作。

當發布設定檔、實際浸泡設定與驗證輸入相符，且目標 SHA 相同，或新目標是其後代且完整的變更路徑集合恰好為 `CHANGELOG.md` 時，`rerun_group=all` 可以重複使用先前成功的總括流程執行。完全相同目標的重複使用會記錄 `exact-target-full-validation-v1`；驗證後的 Release SHA 會記錄 `changelog-only-release-v1`。後者只重複使用產品驗證。npm 預檢、套件位元組、版本說明來源，以及安裝／更新驗收仍必須針對 Release SHA 執行。任何版本、來源、產生內容、相依套件、套件或工作流程所擁有的目標變更，都需要新的 Code SHA 與全新的完整驗證。相同 `release/*` ref 與重新執行群組的新總括流程執行，會自動取代進行中的執行。傳入 `reuse_evidence=false` 可強制執行全新的完整流程。

若要進行有限範圍的復原，請將 `rerun_group` 傳入總括流程。`all` 是實際的候選發布版本執行，`ci` 只執行一般 CI 子流程，`plugin-prerelease` 只執行僅限發布的外掛子流程，`release-checks` 會執行所有發布執行環境，而範圍較窄的發布群組為 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 及 `npm-telegram`。針對性的 `npm-telegram` 重新執行需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整／全部執行會使用 Package Acceptance 內的標準套件 Telegram E2E。針對性的跨作業系統重新執行可以加入 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統／測試套件篩選條件。QA 發布檢查失敗會阻擋一般發布驗證，包括標準層級所需的 OpenClaw 動態工具漂移檢查。Tideclaw alpha 執行仍可將非套件安全性的發布檢查通道視為建議性項目。使用 `release_profile=beta` 時，`Run repo/live E2E validation` 即時供應商測試套件是建議性的（只發出警告，不會阻擋）；stable 與 full 設定檔仍會讓它們具有阻擋效果。當 `live_suite_filter` 明確要求受閘控的 QA 即時通道（例如 Discord、WhatsApp 或 Slack）時，必須啟用相符的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫變數；否則輸入擷取會失敗，而不是無聲略過該通道。

### Vitest

Vitest 執行環境是手動的 `CI` 子工作流程。手動 CI 會刻意略過變更範圍界定，並對候選發布版本強制執行一般測試圖：Linux Node 分片、內建外掛分片、外掛與頻道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS，以及 Control UI i18n。當 `Full Release Validation` 執行此環境時，因為總括流程會傳入 `include_android=true`，所以會包含 Android；獨立手動 CI 則需要 `include_android=true` 才能涵蓋 Android。

使用此執行環境回答“原始碼樹是否通過完整的一般測試套件？”。這與發布路徑的產品驗證不同。需保留的證據：

- `Full Release Validation` 摘要，其中顯示已派送的 `CI` 執行 URL
- `CI` 在完全相同的目標 SHA 上成功執行
- 調查迴歸問題時，CI 工作中失敗或緩慢的分片名稱
- 需要進行效能分析時的 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有在發布需要具決定性的一般 CI，但不需要 Docker、QA Lab、即時、跨作業系統或套件執行環境時，才直接執行手動 CI。直接執行非 Android CI 時使用第一個命令。若直接執行的候選發布版本 CI 必須涵蓋 Android，請加入 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 執行環境位於 `OpenClaw Release Checks` 至 `openclaw-live-and-e2e-checks-reusable.yml`，另包含發布模式的 `install-smoke` 工作流程。它透過封裝後的 Docker 環境驗證候選發布版本，而不只進行原始碼層級測試。

發布 Docker 涵蓋範圍包括：

- 完整安裝冒煙測試，並啟用較慢的 Bun 全域安裝冒煙測試
- 依目標 SHA 準備／重複使用根 Dockerfile 冒煙映像，其中 QR、root／閘道與安裝程式／Bun 冒煙工作會作為個別的安裝冒煙分片執行
- 儲存庫 E2E 通道
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 至 `plugins-runtime-install-h`，以及 `openwebui`
- 要求時，在專用大容量磁碟執行器上進行 OpenWebUI 涵蓋
- 分割的內建外掛安裝／解除安裝通道 `bundled-plugin-install-uninstall-0` 至 `bundled-plugin-install-uninstall-23`
- 當發布檢查包含即時測試套件時，執行即時／E2E 供應商測試套件與 Docker 即時模型涵蓋

重新執行前請先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含通道記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON 及重新執行命令。若要進行針對性復原，請在可重複使用的即時／E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不要重新執行所有發布區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 與已準備的 Docker 映像輸入，因此失敗的通道可以重複使用相同的 tarball 與 GHCR 映像。

### QA Lab

QA Lab 執行環境也是 `OpenClaw Release Checks` 的一部分。它是代理行為與頻道層級的發布閘門，與 Vitest 及 Docker 套件機制分開。

發布 QA Lab 涵蓋範圍包括：

- 模擬同等性通道，使用代理同等性套件，比較 OpenAI 候選通道與 `anthropic/claude-opus-4-8` 基準
- 使用 `qa-live-shared` 環境的 Matrix 即時轉接器發布設定檔
- 使用 Convex CI 認證資訊租約的即時 Telegram QA 通道
- 當發布遙測需要明確的本機證據時，使用 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此執行環境回答“發布版本在 QA 情境與即時頻道流程中的行為是否正確？”。核准發布時，請保留同等性、Matrix 與 Telegram 通道的成品 URL。完整的 Matrix 涵蓋仍可透過手動分片的 QA Lab 執行取得，而不是作為預設的發布關鍵通道。

### 套件

套件執行環境是可安裝產品的閘門。它由 `Package Acceptance` 與解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選項目正規化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並使工作流程框架 ref 與套件來源 ref 保持分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或完全相符的 OpenClaw 發布版本
- `source=ref`：使用選定的 `workflow_ref` 框架，封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載公開 HTTPS `.tgz`，且必須提供 `package_sha256`；系統會拒絕 URL 認證資訊、非預設 HTTPS 連接埠、私人／內部／特殊用途主機名稱或解析位址，以及不安全的重新導向
- `source=trusted-url`：下載 HTTPS `.tgz`，且必須提供 `package_sha256` 與 `trusted_source_id`，其值來自 `.github/package-trusted-sources.json` 中的具名原則；請將此方式用於維護者所擁有的企業鏡像或私人套件儲存庫，而不要在 `source=url` 中加入輸入層級的私人網路略過機制
- `source=artifact`：重複使用另一個 GitHub Actions 執行所上傳的 `.tgz`

`OpenClaw Release Checks` 使用 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對同一個已解析的 tarball 執行遷移、更新、由 root 管理的 VPS 升級、已設定驗證的更新重新啟動、即時 ClawHub skill 安裝、過期外掛相依套件清理、離線外掛固定資料、外掛更新、外掛命令繫結逸出強化，以及 Telegram 套件 QA。具阻擋效果的發布檢查會使用預設的最新已發布套件基準；使用 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 設定檔，會將已發布升級存活者掃描擴充至 `last-stable-4`，再加上固定的 `2026.4.23`、`2026.5.2` 與 `2026.4.15` 基準，並使用 `reported-issues` 情境。對於已發布的候選項目，請搭配 `source=npm` 使用 Package Acceptance；發布前由 SHA 支援的本機 npm tarball 使用 `source=ref`；維護者所擁有的企業／私人鏡像使用 `source=trusted-url`；另一個 GitHub Actions 執行所上傳的已準備 tarball 則使用 `source=artifact`。

它是 GitHub 原生的替代方案，可取代先前大多需要 Parallels 的套件／更新涵蓋。跨作業系統發布檢查對於特定作業系統的初始設定、安裝程式與平台行為仍然重要，但套件／更新產品驗證應優先使用 Package Acceptance。

更新與外掛驗證的標準檢查清單是[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。在決定哪個本機、Docker、Package Acceptance 或發布檢查通道可驗證外掛安裝／更新、doctor 清理或已發布套件遷移變更時，請使用此清單。針對每個 stable `2026.4.23+` 套件進行的完整已發布更新遷移，是獨立的手動 `Update Migration` 工作流程，不屬於完整發布 CI。

舊版套件驗收的寬容處理刻意設有時間限制。至 `2026.4.25` 為止的套件，可以針對已發布至 npm 的中繼資料缺漏使用相容性路徑：tarball 中缺少私人 QA 清單項目、缺少 `gateway install --wrapper`、由 tarball 衍生的 git 固定資料中缺少修補檔案、缺少持久化的 `update.channel`、舊版外掛安裝記錄位置、缺少市集安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件可針對已隨版本發布的本機建置中繼資料戳記檔案發出警告。後續套件必須符合現代套件合約；相同的缺漏會導致發布驗證失敗。

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

常見套件設定檔：

- `smoke`：快速套件安裝／頻道／代理程式、閘道網路及設定重新載入路徑
- `package`：安裝／更新／重新啟動／外掛套件合約，加上即時 ClawHub skill 安裝證明；這是版本檢查的預設值
- `product`：`package` 加上 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋及 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：用於聚焦重新執行的確切 `docker_lanes` 清單

若要進行候選套件的 Telegram 證明，請在 Package Acceptance 啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。此工作流程會將解析後的 `package-under-test` tarball 傳入 Telegram 路徑；獨立的 Telegram 工作流程仍接受已發布的 npm 規格，以供發布後檢查使用。

## 一般版本發布自動化

對於 beta、`latest`、外掛、GitHub Release 及平台發布，
`OpenClaw Release Publish` 是一般的變更進入點。每月一次的
`.33+` 僅限 npm 延伸穩定版路徑不使用此協調器。一般
工作流程會依版本所需的順序協調受信任發布者工作流程：

1. 簽出版本標籤並解析其提交 SHA。
2. 確認可從 `main` 或 `release/*` 到達該標籤（若為 alpha 預發行版本，則可從 Tideclaw alpha 分支到達）。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同範圍與 SHA 分派 `Plugin ClawHub Release`。
6. 在驗證已儲存的 `full_release_validation_run_id` 和確切執行嘗試次數後，使用版本標籤、npm dist-tag 及已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。
7. 對於穩定版本，以草稿形式建立或更新 GitHub 版本，使用明確的 `windows_node_tag` 和經候選版本核准的 `windows_node_installer_digests` 分派 `Windows Node Release`，並驗證標準 Windows 安裝程式／總和檢查碼資產。同時分派 `Android Release`，以建置確切標籤的已簽署 APK、總和檢查碼及來源證明。在發布草稿前驗證兩項原生資產合約。

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

將穩定版本發布至預設 beta dist-tag：

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

直接升級穩定版本至 `latest` 必須明確指定：

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

僅在聚焦修復或重新發布作業時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流程。當 `publish_openclaw_npm=true` 時，`OpenClaw Release Publish` 會拒絕 `plugin_publish_scope=selected`，使核心套件無法在缺少任何可發布的官方外掛（包括 `@openclaw/diffs-language-pack`）時出貨。若要修復選定的外掛，請搭配 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 設定 `publish_openclaw_npm=false`，或直接分派子工作流程。

首次發布 ClawHub 啟動程序屬於例外：從受信任的 `main`
分派 `Plugin ClawHub New`，並透過 `ref` 傳入完整的目標版本 SHA。
絕不可從版本標籤或分支本身執行啟動工作流程：

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

加上標籤前驗證需要 `dry_run=true`、拒絕版本標籤及父執行
輸入，且僅接受可從 `main` 或 `release/*` 到達的確切目標。
它不會載入 ClawHub 認證資訊、發布套件位元組或變更受信任
發布者設定。此工作流程仍會解析即時登錄計畫、僅在無密鑰作業中
簽出並封裝目標、具體化已鎖定的 ClawHub 工具鏈，並在版本標籤
存在前驗證不可變資產及套件 slug／身分。僅在無密鑰封裝作業
完成後才核准 `clawhub-plugin-bootstrap` 環境；此受保護的驗證作業
沒有認證資訊或變更命令。

加上標籤後，已核准的試執行或實際啟動程序必須包含確切
版本標籤，以及父 `OpenClaw Release Publish` 的執行 ID、嘗試次數和
分支。父工作流程會證明自身的工作流程 SHA，以及 `Plugin ClawHub New` 的另一個確切受信任
`main` SHA；子執行及每次受保護
環境核准都必須符合該核准的子 SHA。每次發布嘗試和受信任發布者變更前，
都會重新檢查版本標籤。

封裝作業
會上傳單一不可變資產，其名稱、Actions 資產 ID／摘要、
產生者執行／嘗試次數、目標 SHA，以及各套件 tarball 的 SHA-256／大小，
都會傳入驗證及受保護作業。受保護作業僅簽出受信任的 `main`
工具、透過 GitHub API 驗證資產元組、依確切資產 ID 下載、
重新雜湊每個 tarball，並使用固定版本命令列介面的 USTAR 標準化規則驗證本機 TAR 路徑及
套件身分。接著，每個候選項目都必須通過固定版本命令列介面的發布試執行；該試執行會在
登錄查詢或驗證前返回。認證資訊作業的預先篩選會將壓縮後的 ClawPack
上限設為 120 MiB、檔案酬載總量設為 50 MiB、展開的 TAR 資料設為 64 MiB，並將
TAR 項目數設為 10,000。現有套件的受信任發布者修復仍僅限設定，
但它仍會封裝目標，並要求所請求的標籤及確切的登錄位元組與中繼資料完全相等，
才會變更受信任發布者
設定。發布後驗證會下載 ClawHub 資產，並
要求相同的 SHA-256 和大小。重新執行失敗作業的復原僅能在確切產生者作業
已成功完成時，重複使用較早嘗試的套件資產。
最終證據也會繫結已鎖定的 ClawHub 版本、鎖定檔
SHA-256 及 npm 完整性值。若不相符，則需要新的套件版本。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作人員控制的輸入：

- `tag`：必要的版本標籤，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；當 `preflight_only=true` 時，也可以是目前完整的 40 字元工作流程分支提交 SHA，以進行僅限驗證的前置檢查
- `preflight_only`：`true` 僅用於驗證／建置／封裝，`false` 用於實際發布路徑
- `preflight_run_id`：現有且成功的前置檢查執行 ID；實際發布路徑需要此值，使工作流程重複使用準備好的 tarball，而非重新建置
- `full_release_validation_run_id`：此標籤／SHA 的成功 `Full Release Validation` 執行 ID，實際發布時必填。Beta 發布可僅憑前置檢查繼續並顯示警告，但穩定版／`latest` 升級仍需要此值。
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數執行嘗試次數；每當提供執行 ID 時即為必填，以免重新執行在發布期間變更授權證據。
- `release_publish_run_id`：已核准的 `OpenClaw Release Publish` 執行 ID；此工作流程由該父工作流程分派時為必填（機器人執行者的實際發布呼叫）
- `plugin_npm_run_id`：成功且精確對應目前 HEAD 的 `Plugin NPM Release` 執行 ID；實際的 `extended-stable` 核心發布需要此值
- `npm_dist_tag`：發布路徑的 npm 目標標籤；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，預設為 `beta`。最終修補版本 `33` 及之後版本必須使用 `extended-stable`；依預設，`extended-stable` 會拒絕較早的修補版本，並一律拒絕非最終標籤。
- `bypass_extended_stable_guard`：僅供測試的布林值，預設為 `false`；搭配 `npm_dist_tag=extended-stable` 時，會略過每月延伸穩定版資格限制，同時保留版本身分、資產、核准及回讀檢查。

`Plugin NPM Release` 接受 `npm_dist_tag=default` 以使用現有版本
行為，或接受 `npm_dist_tag=extended-stable` 以使用受防護的每月路徑。
延伸穩定版選項需要 `publish_scope=all-publishable`、空白的
`plugins` 輸入、等於或高於 `33` 的最終修補版本，以及位於確切頂端的標準
`extended-stable/YYYY.M.33` 分支。它絕不會移動外掛
`latest` 或 `beta`。新套件版本會透過 OIDC 受信任發布（`npm publish --tag extended-stable`）以不可分割方式取得 `extended-stable`；
此來源工作流程不使用以權杖驗證的 `npm dist-tag add`。重試時
會略過 npm 中已存在的確切版本，之後除非完整
回讀確認每個確切套件及 `extended-stable` 標籤均已收斂，否則會採取封閉式失敗。

`OpenClaw Release Publish` 接受以下由操作人員控制的輸入：

- `tag`：必要的版本標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 前置檢查執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時為必填
- `full_release_validation_run_id`：成功的 `Full Release Validation` 執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時為必填
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數嘗試次數；每當提供執行 ID 時即為必填
- `windows_node_tag`：確切且非預發行版本的 `openclaw/openclaw-windows-node` 版本標籤；穩定版 OpenClaw 發布時為必填
- `windows_node_installer_digests`：經候選版本核准的精簡 JSON 對應表，將目前的 Windows 安裝程式名稱對應至其固定的 `sha256:` 摘要；穩定版 OpenClaw 發布時為必填
- `npm_telegram_run_id`：選用的成功 `NPM Telegram Beta E2E` 執行 ID，用於納入最終版本證據
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤，為 `alpha`、`beta` 或 `latest` 之一
- `plugin_publish_scope`：預設為 `all-publishable`；僅在搭配 `publish_openclaw_npm=false` 進行聚焦且僅限外掛的修復作業時，才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；僅在將工作流程用作僅限外掛的修復協調器時，才設定 `false`
- `release_profile`：用於版本證據摘要的版本涵蓋範圍設定檔；預設為 `from-validation`，會從驗證資訊清單讀取，或以 `beta`、`stable` 或 `full` 覆寫
- `wait_for_clawhub`：預設為 `false`，使 npm 可用性不會遭 ClawHub 輔助流程阻擋；僅在工作流程完成條件必須包含 ClawHub 完成時，才設定 `true`

`OpenClaw Release Checks` 接受以下由操作人員控制的輸入：

- `ref`：要驗證的分支、標籤或完整提交 SHA。含有機密資訊的檢查要求解析出的提交可從 OpenClaw 分支或發布標籤存取。
- `run_release_soak`：選擇加入詳盡的即時／E2E、Docker 發布路徑，以及涵蓋所有歷來版本的升級存續浸泡測試，以進行 Beta 版本發布檢查。`release_profile=stable` 和 `release_profile=full` 會強制啟用此選項。

規則：

- 低於修補版本 `33` 的一般正式版本與修正版，可發布至 `beta` 或 `latest`。修補版本為 `33` 或以上的正式版本必須發布至 `extended-stable`，且會拒絕位於此界線的修正後綴版本。
- Beta 預發布標籤只能發布至 `beta`；Alpha 預發布標籤只能發布至 `alpha`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許輸入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律僅供驗證
- 實際發布路徑必須使用預檢期間所用的同一個 `npm_dist_tag`；工作流程會先驗證該中繼資料，再繼續發布

## 一般 Beta／latest 穩定版本發布順序

此舊版順序適用於同時負責外掛、GitHub Release、Windows 及其他平台工作的常規協調式發布。這不是本頁頂端記載的每月 `.33+` 僅限 npm 的延伸穩定版本路徑。

建立常規協調式穩定版本時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。標籤尚未存在前，可使用目前工作流程分支的完整提交 SHA，對預檢工作流程執行僅供驗證的試執行。
2. 一般先發布 Beta 的流程請選擇 `npm_dist_tag=beta`；只有在刻意要直接發布穩定版本時，才選擇 `latest`。
3. 若要透過單一手動工作流程執行一般 CI，並涵蓋即時提示快取、Docker、QA Lab、Matrix 及 Telegram，請在發布分支、發布標籤或完整提交 SHA 上執行 `Full Release Validation`。若刻意只需要具確定性的一般測試圖，請改在發布參照上執行手動 `CI` 工作流程。
4. 選取已簽署的 x64 與 ARM64 安裝程式應隨之發布的確切非預發布 `openclaw/openclaw-windows-node` 發布標籤。將其儲存為 `windows_node_tag`，並將其已驗證的摘要對應表儲存為 `windows_node_installer_digests`。候選發布版本輔助工具會記錄兩者，並將其納入產生的發布命令中。
5. 儲存成功的 `preflight_run_id`、`full_release_validation_run_id`，以及確切的 `full_release_validation_run_attempt`。
6. 從受信任的 `main` 執行 `OpenClaw Release Publish`，並使用相同的 `tag`、相同的 `npm_dist_tag`、選定的 `windows_node_tag`、其已儲存的 `windows_node_installer_digests`、已儲存的 `preflight_run_id`、`full_release_validation_run_id` 和 `full_release_validation_run_attempt`。它會先將外部化的外掛發布至 npm 和 ClawHub，再提升 OpenClaw npm 套件。
7. 若發布落在 `beta`，請使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 提升至 `latest`。
8. 若發布刻意直接發布至 `latest`，且 `beta` 應立即採用同一個穩定組建，請使用相同的發布工作流程，將兩個 dist-tag 都指向該穩定版本；或讓其排程的自我修復同步稍後移動 `beta`。

dist-tag 變更位於發布分類帳儲存庫中，因為它仍需要 `NPM_TOKEN`，而原始碼儲存庫則維持僅使用 OIDC 發布。這能讓直接發布路徑與先發布 Beta 的提升路徑都具備文件說明，並讓操作人員清楚可見。

若維護者必須改用本機 npm 驗證，請只在專用 tmux 工作階段內執行任何 1Password 命令列介面（`op`）命令。請勿直接從主要代理程式 shell 呼叫 `op`；將其保留在 tmux 內可讓提示、警示和 OTP 處理過程可供觀察，並防止主機重複發出警示。

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

維護者使用 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) 中的私人發布文件作為實際操作手冊。

## 相關內容

- [發布管道](/zh-TW/install/development-channels)
