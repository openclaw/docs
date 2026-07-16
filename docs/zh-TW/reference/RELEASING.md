---
read_when:
    - 尋找公開發布頻道定義
    - 執行版本驗證或套件驗收
    - 尋找版本命名與發布週期資訊
summary: 發布管道、操作員檢查清單、驗證方塊、版本命名與發布節奏
title: 發布政策
x-i18n:
    generated_at: "2026-07-16T11:56:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前提供三個面向使用者的更新頻道：

- stable：現有的正式推廣發行頻道，在獨立的命令列介面／頻道里程碑完成前，仍會透過 npm `latest` 解析
- beta：發佈至 npm `beta` 的預發行標籤
- dev：`main` 持續移動的最新版本

此外，發行操作人員可以從修補版本 `33` 開始，將最近一個已結束月份的核心
套件發佈至 npm `extended-stable`。當月的一般正式版本線則繼續使用 npm `latest`；
這項操作端的發佈分流本身不會改變命令列介面的更新頻道解析方式。

Tideclaw alpha 組建是獨立的內部預發行軌道（npm dist-tag `alpha`），詳見 [NPM 工作流程輸入](#npm-workflow-inputs)和[發行測試盒](#release-test-boxes)。

## 版本命名

- 每月 npm 延伸穩定版發行版本：`YYYY.M.PATCH`，搭配 `PATCH >= 33`，git 標籤為 `vYYYY.M.PATCH`
- 每日／一般正式發行版本：`YYYY.M.PATCH`，搭配 `PATCH < 33`，git 標籤為 `vYYYY.M.PATCH`
- 一般備援修正發行版本：`YYYY.M.PATCH-N`，git 標籤為 `vYYYY.M.PATCH-N`
- Beta 預發行版本：`YYYY.M.PATCH-beta.N`，git 標籤為 `vYYYY.M.PATCH-beta.N`
- Alpha 預發行版本：`YYYY.M.PATCH-alpha.N`，git 標籤為 `vYYYY.M.PATCH-alpha.N`
- 月份或修補版本絕不可補零
- `PATCH` 是依序遞增的每月發行列車編號，而非日曆日期。一般正式版與 beta 發行會推進目前的發行列車；僅有 alpha 的標籤絕不占用或推進 beta／一般版本的修補編號，因此選擇 beta 或一般發行列車時，應忽略修補編號較高的舊版純 alpha 標籤。
- Alpha／夜間組建使用下一個尚未發行的修補版本列車，重複組建時只遞增 `alpha.N`。該修補版本一旦已有 beta，新 alpha 組建就會移至下一個修補版本。
- npm 版本不可變更：絕不可刪除、重新發佈或重複使用已發佈的標籤。請改為建立下一個預發行編號或下一個每月修補版本。
- `latest` 會繼續跟隨目前的一般／每日 npm 版本線；`beta` 是目前的 beta 安裝目標
- `extended-stable` 代表受支援的最近一個月份 npm 套件，從修補版本 `33` 開始；修補版本 `34` 及之後的版本是該每月版本線的維護發行
- 一般正式版與一般修正版本預設發佈至 npm `beta`；發行操作人員可以明確指定 `latest`，或稍後推廣已審核的 beta 組建
- 專用的每月延伸穩定版流程會以完全相同的版本發佈核心 npm 套件及所有可發佈至 npm 的官方外掛。它不會將外掛發佈至 ClawHub，也不會發佈 macOS 或 Windows 成品、GitHub Release、私有儲存庫 dist-tag、Docker 映像、行動裝置成品或網站下載項目。
- 每個一般正式發行都會一併提供 npm 套件、macOS 應用程式、已簽署的獨立 Android APK，以及已簽署的 Windows Hub 安裝程式。Beta 發行通常會先驗證並發佈 npm／套件流程；除非明確要求，原生應用程式的組建、簽署、公證與推廣僅保留給一般正式發行。

## 發行節奏

- 發行流程先推出 beta；只有在最新 beta 通過驗證後，才會推出 stable
- 維護者通常會從目前的 `main` 建立 `release/YYYY.M.PATCH` 分支來進行發行，讓發行驗證與修正不會阻礙 `main` 上的新開發
- 如果 beta 標籤已推送或發佈但需要修正，維護者會建立下一個 `-beta.N` 標籤，而不是刪除或重新建立舊標籤
- 詳細的發行程序、核准、認證資訊與復原說明僅供維護者使用

## 僅限 npm 的每月延伸穩定版發佈

這是下方一般發行程序的專用例外。針對已結束的月份
`YYYY.M`，建立 `extended-stable/YYYY.M.33`；並從同一分支發佈
`vYYYY.M.33` 及後續維護修補版本。發行標籤、分支頂端、簽出內容、套件版本、npm 預檢，
以及完整發行驗證執行都必須指向同一個提交。受保護的 `main`
必須已包含日曆月份嚴格較晚，且修補版本低於
`33` 的正式版本；即使 `main` 已推進超過一個
月，維護修補版本仍符合資格。

在確切的延伸穩定版分支上，將根套件版本提升至 `YYYY.M.P`，執行
`pnpm release:prep`，並確認每個可發佈的擴充套件都使用
相同版本。提交並推送所有產生的變更，在該提交上建立並推送
不可變更的 `vYYYY.M.P` 標籤，然後記錄產生的完整 SHA。
工作流程會使用這個已準備完成的樹狀內容；它們不會替你提升或同步
版本。

從該確切的已準備分支頂端執行 npm 預檢與完整發行驗證，
然後儲存兩者的執行 ID，以及成功的完整發行驗證
執行嘗試次數：

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

`release_profile=stable` 是現有的驗證深度設定檔；它與
npm `extended-stable` dist-tag 分開，且刻意
維持不變。

兩項執行都成功後，從同一個確切分支頂端發佈所有可發佈至 npm 的
官方外掛。修補版本 `P` 必須為 `33` 或更高。將完整發行
SHA 以 `ref` 傳入，等待完整矩陣與登錄檔回讀完成，然後儲存
成功的外掛 NPM 發行執行 ID：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

此工作流程使用一般已準備好的 `all-publishable` 套件清單，
包括原始碼未變更的套件。它會驗證每個確切套件
及每個外掛的 `extended-stable` 標籤，全部通過後才會成功。如果部分執行
失敗，請重新執行相同命令：已發佈的套件會重複使用，缺少
或過時的外掛標籤會在 npm 發行環境下完成協調，而
最終回讀仍會涵蓋完整套件集合。

外掛工作流程成功且 npm 發行環境準備就緒後，
發佈預檢產生的確切核心 tarball。核心發佈會驗證
引用的外掛執行在相同標準分支及
確切來源 SHA 上為 `completed/success`：

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
`main` 月份政策的分支或非正式環境演練，請在 npm 預檢與發佈
分派中都加入 `-f bypass_extended_stable_guard=true`。預設值為 `false`。
只有搭配 `npm_dist_tag=extended-stable` 時才會接受此略過設定，且會記錄於工作流程摘要中。它
不會略過標準 `extended-stable/YYYY.M.33` 工作流程參照、
分支頂端／標籤／簽出內容一致性、正式標籤語法、套件／標籤版本
一致性、引用執行與資訊清單身分、tarball 來源、
環境核准、登錄檔回讀或選擇器修復證據。

發佈工作流程會驗證引用的預檢、驗證與外掛
執行身分、已準備 tarball 的摘要，以及核心登錄檔選擇器。
工作流程成功後，請獨立確認結果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

兩個命令都必須傳回 `YYYY.M.P`。如果發佈成功但選擇器
回讀失敗，請勿重新發佈不可變更的套件版本。請使用失敗工作流程
固定執行摘要中列印的單一 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復命令，
然後再次執行兩項獨立回讀。將選擇器復原至先前版本是另一項操作人員
決策，並非回讀修復流程。

公開支援文件最初將 Slack、Discord 和 Codex 指定為
延伸穩定版涵蓋的外掛介面。該清單是支援聲明，而不是
發行程式碼允許清單：所有可發佈至 npm 的官方外掛都遵循
相同的確切版本發佈流程。

下方的一般檢查清單仍負責 beta、`latest`、GitHub Release、
外掛、macOS、Windows 及其他平台的發佈。請勿為這個僅限 npm 的
延伸穩定版流程執行那些步驟。

## 一般發行操作人員檢查清單

此檢查清單呈現公開的發行流程架構。私密認證資訊、簽署、公證、dist-tag 復原與緊急復原的詳細資訊仍保留在僅供維護者使用的發行操作手冊中。

1. 從目前的 `main` 開始：拉取最新內容、確認目標提交已推送，並確認 `main` 的 CI 狀態足以從中建立分支。
2. 從該提交建立 `release/YYYY.M.PATCH`。反向移植為選用；只套用操作人員選定的項目。提升所有必要位置的版本、執行 `pnpm release:prep`、完成發行修正與必要的正向移植，並檢查 `src/plugins/compat/registry.ts` 和 `src/commands/doctor/shared/deprecation-compat.ts`。
3. 將產品完整且尚未加入變更記錄的提交凍結為 **程式碼 SHA**。執行確定性的原始碼預檢，然後使用 `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`。這會固定受信任的工作流程工具，同時讓完整的 Vitest、Docker、QA、套件與效能矩陣針對確切的程式碼 SHA 執行。
4. 編輯前先分類失敗原因。產品／程式碼失敗會產生新的程式碼 SHA，且該 SHA 必須通過完整驗證。工作流程、測試架構、認證資訊、核准或基礎架構失敗則應在其所屬介面修復，並針對相同的程式碼 SHA 重新執行。
5. 只有在程式碼 SHA 通過後，才根據自上一個可到達的已發佈標籤以來所合併的 PR 與直接提交，產生最上方的 `CHANGELOG.md` 區段。條目應面向使用者且不得重複。若分歧的已發佈標籤或後續正向移植重新關聯已發行的 PR，請透過 `--shipped-ref` 明確傳入該標籤。
6. 只提交 `CHANGELOG.md`。此提交即為 **發行 SHA**。從程式碼 SHA 到發行 SHA 的完整差異必須恰好只有 `CHANGELOG.md`；若有任何其他路徑變更，發行流程就必須返回步驟 2。
7. 針對發行 SHA 執行固定 SHA 的完整發行驗證，並啟用證據重複使用。輕量父工作流程必須記錄 `changelog-only-release-v1`、指向已通過的程式碼 SHA，且不得分派任何產品子流程。這會重複使用產品證據，但不會重複使用套件位元組。
8. 針對發行 SHA／標籤，以 `preflight_only=true` 執行 `OpenClaw NPM Release`。儲存成功的 `preflight_run_id`。這會組建並檢查包含最終變更記錄的確切套件位元組。
9. 為發行 SHA 加上標籤，接著使用成功的發行 SHA 驗證父工作流程和 npm 預檢來執行候選版本輔助工具，而不要再次分派其中任何一項：

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   若為穩定版，也請傳入 `--windows-node-tag vX.Y.Z`。此輔助程式會驗證版本資訊來源、npm 預檢位元組、Parallels 安裝／更新證明、Telegram 套件證明，以及外掛發布計畫，然後輸出發布命令。

   `OpenClaw Release Publish` 會將所選或所有可發布的外掛套件平行分派至 npm，並將同一組套件分派至 ClawHub；外掛成功發布至 npm 後，再以相符的 dist-tag 升級已準備好的 OpenClaw npm 預檢成品。發布簽出仍是產品／資料根目錄，而規劃與最終驗證則從完全相符且受信任的工作流程來源簽出執行，避免較舊的發布提交在未察覺的情況下使用過時的發布工具。在任何發布子程序啟動前，它會轉譯並快取完全相符的 GitHub 發行版本內文。當完整且相符的 `CHANGELOG.md` 區段符合 GitHub 的 125,000 字元限制及轉譯器相符的 125,000 位元組安全上限時，頁面會包含完全相符的 `## YYYY.M.PATCH` 區段及其標題。當來源區段無法容納時，頁面會保留完全相符且分組的編輯說明，並將過大的貢獻記錄替換為指向標籤固定之 `CHANGELOG.md` 中完整記錄的穩定連結；絕不發布部分記錄或遭截斷的項目符號。工作流程會先選擇完整或精簡內文，再加入 `### Release verification`；若證明尾端會超出限制，則保留標準內文，並改為依賴不可變的附加證據。發布至 npm `latest` 的穩定版會成為 GitHub 最新發行版本，而保留在 npm `beta` 的穩定維護版本則會使用 GitHub `latest=false` 建立。工作流程也會將預檢相依性證據、完整驗證資訊清單，以及發布後登錄檔驗證證據上傳至 GitHub 發行版本，以供發布後事件處理。它會立即輸出子執行 ID、自動核准工作流程權杖有權核准的發布環境閘門、以記錄尾端摘要說明失敗的子工作、預先建立 GitHub 發行版本草稿頁面，並在 OpenClaw 發布至 npm 的同時並行升級 Windows 與 Android 成品；這些階段成功後，完成發行版本頁面及相依性證據，在 OpenClaw 發布至 npm 時等待 ClawHub，接著執行受信任主要分支的 Beta 驗證器，並為 GitHub 發行版本、npm 套件、所選外掛 npm 套件、所選 ClawHub 套件、子工作流程執行 ID，以及選用的 NPM Telegram 執行 ID 上傳發布後證據。ClawHub 啟動驗證器要求完全相符且受信任的主要分支工作流程路徑與 SHA、產生端與終端執行嘗試、發行版本 SHA、要求的套件組、不可變的套件成品組合，以及終端登錄檔回讀成品；不接受成功的舊式發行版本參照執行。

   接著，針對已發布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 套件執行發布後套件驗收。如果已推送或發布的預發行版本需要修正，請建立下一個相符的預發行版本編號；絕不可刪除或重寫舊版本。

10. 發布嘗試失敗時，除非失敗證明產品或變更日誌有缺陷，否則請維持 Release SHA 不變。繼續使用已成功且不可變的子程序與成品；絕不可重新建置或重新發布已成功的套件版本。
11. 若為穩定版，只有在經審核的 Beta 版或候選發行版具備必要的驗證證據後，才能繼續。穩定版 npm 發布也會經過 `OpenClaw Release Publish`，並透過 `preflight_run_id` 重複使用成功的預檢成品。穩定版 macOS 發行準備就緒也要求 `main` 上已封裝的 `.zip`、`.dmg`、`.dSYM.zip`，以及已更新的 `appcast.xml`；macOS 發布工作流程會在驗證發行版本成品後，自動將已簽署的 appcast 發布至公開的 `main`，若分支保護阻止直接推送，則會建立或更新 appcast PR。穩定版 Windows Hub 準備就緒要求 OpenClaw GitHub 發行版本上有已簽署的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 與 `OpenClawCompanion-SHA256SUMS.txt` 成品。請將完全相符且已簽署的 `openclaw/openclaw-windows-node` 發行標籤作為 `windows_node_tag` 傳入，並將其經候選版本核准的安裝程式摘要對應表作為 `windows_node_installer_digests` 傳入；`OpenClaw Release Publish` 會保留發行版本草稿、分派 `Windows Node Release`，並在發布前驗證全部三項成品。
12. 發布後，請執行 npm 發布後驗證器；需要發布後頻道證明時，可選擇執行獨立的已發布 npm Telegram 端對端測試；在需要時升級 dist-tag、驗證產生的 GitHub 發行版本頁面、執行發行公告步驟，接著完成[穩定版主要分支收尾](#stable-main-closeout)，之後才能宣告穩定版發行完成。

## 穩定版主要分支收尾

在 `main` 包含實際已發布的發行狀態前，穩定版發布尚未完成。

1. 從全新且最新的 `main` 開始。以它為基準稽核 `release/YYYY.M.PATCH`，並向前移植 `main` 中缺少的實際修正。不要盲目將僅供發行版本使用的相容性、測試或驗證轉接器合併至較新的 `main`。
2. 一般流程中，將 `main` 設為已發布的穩定版本。若 `main` 已推進至較新的穩定 OpenClaw CalVer，延遲收尾可以使用該版本；不要只為了完成先前發行版本的收尾，而將已開始的發行列車降版。驗證器仍要求完全相符的已發布變更日誌區段與 appcast 項目，並記錄實際的 `main` 版本與 SHA。任何根版本變更後，先執行 `pnpm release:prep`，再執行 `pnpm deps:shrinkwrap:generate`。
3. 讓 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 區段與已加標籤的發行分支完全相符。若 Mac 發行版本發布了穩定版 `appcast.xml` 更新，請將其納入。
4. 在操作人員明確啟動該發行列車前，不要將 `YYYY.M.PATCH+1`、Beta 版本或空白的未來變更日誌區段加入 `main`。
5. 執行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 與 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送後，確認 `origin/main` 包含已發布版本與變更日誌，之後才能宣告穩定版發行完成。
6. 每次私有復原演練後，請確保儲存庫變數 `RELEASE_ROLLBACK_DRILL_ID` 與 `RELEASE_ROLLBACK_DRILL_DATE` 維持最新。

`OpenClaw Stable Main Closeout` 從穩定版發布後，包含已發布版本、變更日誌與 appcast 的 `main` 推送開始。它會讀取不可變的發布後證據，將已發布標籤繫結至其完整發行驗證與發布執行，接著驗證穩定版主要分支狀態、發行版本、必要的穩定版浸泡測試，以及具阻擋性的效能證據。它會將不可變的收尾資訊清單與總和檢查碼附加至 GitHub 發行版本。自動推送觸發程序會略過早於不可變發布後證據的舊式發行版本，且絕不將該略過視為已完成收尾。

完整收尾要求同時具備兩項成品及相符的總和檢查碼。部分資訊清單會重播其中記錄的 `main` SHA 與復原演練，以重新產生完全相同的位元組，接著附加缺少的總和檢查碼；無效的配對，或只有總和檢查碼而沒有資訊清單，都會持續造成阻擋。缺少復原演練儲存庫變數的推送觸發執行會略過，且不會完成收尾；缺少或超過 90 天的演練記錄仍會阻擋手動且有證據支持的收尾。私有復原命令仍保留在僅限維護者使用的操作手冊中。只有在修復或重播有證據支持的穩定版收尾時，才使用手動分派。

如果 Release Publish 父工作流程只在附加不可變的 npm／外掛證據後失敗，請先修復並發布每一項穩定版平台成品。接著，維護者可以使用 `allow_failed_publish_recovery=true` 手動分派收尾；該模式只接受已完成但失敗的父工作流程，並且除了正常的 macOS／appcast 檢查外，還要求完全相符的 Android 與 Windows 成品合約、GitHub SHA-256 摘要、總和檢查碼驗證、Android 來源證明，以及由父工作流程分派且成功的 Windows 升級，其 Authenticode 檢查與候選版本核准摘要必須符合已發布的安裝程式。自動推送收尾絕不會啟用此復原模式。

只有在修正標籤解析至與基礎穩定版標籤相同的來源提交時，舊式備援修正標籤才能重複使用基礎套件證據。其 Android 發行版本會重複使用基礎標籤已驗證的 APK，並加入修正標籤的來源證明。來源不同的修正版本必須發布並驗證自身的套件證據，且使用較高的 Android `versionCode`。

## 發行預檢

- 在發行預檢前執行 `pnpm check:test-types`，讓測試用 TypeScript 在較快的本機 `pnpm check` 閘門之外仍涵蓋於檢查範圍。
- 在發行預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機閘門之外也維持通過。
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓封裝驗證步驟所需的預期 `dist/*` 發行成品與 Control UI 套件組合存在。
- 在提升根版本後、加上標籤前執行 `pnpm release:prep`。它會執行所有在版本／設定／API 變更後經常產生偏移的確定性發行產生器：外掛版本、npm shrinkwrap、外掛清單、基礎設定結構描述、內建頻道設定中繼資料、設定文件基準、外掛 SDK 匯出，以及外掛 SDK API 基準。`pnpm release:check` 會以檢查模式重新執行這些防護（另加外掛 SDK 介面預算檢查），並在執行套件發行檢查前，於單次執行中回報每一項產生內容偏移失敗。
- 依預設，外掛版本同步會將可發布的 `@openclaw/ai` 執行階段套件、官方外掛套件版本，以及既有的 `openclaw.compat.pluginApi` 下限更新至 OpenClaw 發行版本。請將該欄位視為外掛 SDK／執行階段 API 下限，而不只是套件版本的副本：對於刻意維持與較舊 OpenClaw 主機相容、且僅發布外掛的發行版本，請將下限維持在支援的最舊主機 API，並在外掛發行證明中記錄此選擇。
- 在核准發行前執行手動 `Full Release Validation` 工作流程，以便從單一進入點啟動所有預發行測試機。它接受分支、標籤或完整提交 SHA，分派手動 `CI`，並分派 `OpenClaw Release Checks`，以執行安裝煙霧測試、套件驗收、跨作業系統套件檢查、QA Lab 一致性、Matrix 與 Telegram 工作路徑。穩定版與完整執行一律包含詳盡的即時／端對端測試與 Docker 發行路徑浸泡測試；保留 `run_release_soak=true` 供明確的 Beta 浸泡測試使用。套件驗收會在候選版本驗證期間提供標準的套件 Telegram 端對端測試，避免第二個並行的即時輪詢程式。

  發布 Beta 版後提供 `release_package_spec`，可在發行檢查、套件驗收及套件 Telegram 端對端測試中重複使用已發布的 npm 套件，而不必重新建置發行 tarball。只有在 Telegram 應使用與其餘發行驗證不同的已發布套件時，才提供 `npm_telegram_package_spec`。當套件驗收應使用與發行套件規格不同的已發布套件時，提供 `package_acceptance_package_spec`。當發行證據報告應證明驗證與已發布的 npm 套件相符，但不強制執行 Telegram 端對端測試時，提供 `evidence_package_spec`。

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- 當你想在發布工作持續進行的同時，為套件候選版本取得旁路證明時，請執行手動 `Package Acceptance` 工作流程。使用 `source=npm` 處理 `openclaw@beta`、`openclaw@latest` 或確切的發布版本；使用 `source=ref`，透過目前的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支／標籤／SHA；使用 `source=url` 處理具備必要 SHA-256 並遵循嚴格公開 URL 政策的公開 HTTPS tarball；使用 `source=trusted-url`，透過必要的 `trusted_source_id` 和 SHA-256 套用具名的受信任來源政策；或使用 `source=artifact` 處理由另一個 GitHub Actions 執行所上傳的 tarball。

  此工作流程會將候選版本解析為 `package-under-test`、針對該 tarball 重複使用 Docker E2E 發布排程器，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`，針對同一個 tarball 執行 Telegram QA。當所選的 Docker 執行區包含 `published-upgrade-survivor` 時，套件成品就是候選版本，而 `published_upgrade_survivor_baseline` 會選取已發布的基準版本。`update-restart-auth` 會同時使用候選套件作為已安裝的命令列介面和受測套件，以便測試候選更新命令的受管理重新啟動路徑。

  範例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常用設定檔：
  - `smoke`：安裝／頻道／代理程式、閘道網路和設定重新載入執行區
  - `package`：不含 OpenWebUI 或即時 ClawHub 的成品原生套件／更新／重新啟動／外掛執行區
  - `product`：套件設定檔，加上 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋和 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker 發布路徑區塊
  - `custom`：為聚焦重新執行而確切選取 `docker_lanes`

- 當你只需要發布候選版本的確定性一般 CI 涵蓋範圍時，請直接執行手動 `CI` 工作流程。手動 CI 分派會略過變更範圍判定，並強制執行 Linux Node 分片、隨附外掛分片、外掛與頻道合約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS，以及 Control UI 國際化執行區。獨立手動 CI 執行僅會在使用 `include_android=true` 分派時執行 Android；`Full Release Validation` 會將該輸入傳遞給其 CI 子工作流程。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 驗證發布遙測時，請執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器執行 QA-lab，並驗證追蹤、指標與日誌匯出，以及受限的追蹤屬性和內容／識別碼遮蔽，無須使用 Opik、Langfuse 或其他外部收集器。
- 驗證收集器相容性時，請執行 `pnpm qa:otel:collector-smoke`。在進行本機接收器判定之前，它會將相同的 QA-lab OTLP 匯出路由至真正的 OpenTelemetry Collector Docker 容器。
- 驗證受保護的 Prometheus 抓取時，請執行 `pnpm qa:prometheus:smoke`。它會執行 QA-lab、拒絕未經驗證的抓取，並確認發布關鍵指標系列不包含提示內容、原始識別碼、驗證權杖和本機路徑。
- 請執行 `pnpm qa:observability:smoke`，以依序執行來源簽出版本的 OpenTelemetry 和 Prometheus 冒煙測試執行區。
- 每次建立帶標籤的發布版本之前，請執行 `pnpm release:check`。
- `OpenClaw NPM Release` 前置檢查會在封裝 npm tarball 前產生相依套件發布證據。npm 安全公告弱點閘門會阻止發布。遞移資訊清單風險、相依套件擁有權／安裝介面，以及相依套件變更報告僅作為發布證據。相依套件變更報告會比較發布候選版本與前一個可到達的發布標籤。前置檢查會將相依套件證據上傳為 `openclaw-release-dependency-evidence-<tag>`，並將其內嵌於已準備 npm 前置檢查成品中的 `dependency-evidence/` 下。實際發布路徑會重複使用該前置檢查成品，然後將相同證據以 `openclaw-<version>-dependency-evidence.zip` 附加至 GitHub 發布版本。
- 標籤存在後，請執行 `OpenClaw Release Publish` 以進行會變更狀態的發布順序。請從受信任的 `main` 分派一般 beta 和穩定版發布；發布標籤仍會選取確切的目標提交，且可能指向 `release/YYYY.M.PATCH`。Tideclaw alpha 發布仍保留在相符的 alpha 分支上。請傳入成功的 OpenClaw npm `preflight_run_id`、成功的 `full_release_validation_run_id` 和確切的 `full_release_validation_run_attempt`，並維持預設外掛發布範圍 `all-publishable`，除非你刻意執行聚焦修復。此工作流程會依序執行外掛 npm 發布、外掛 ClawHub 發布和 OpenClaw npm 發布，確保核心套件不會早於其已外部化的外掛發布；Windows 和 Android 推廣會在草稿發布頁面上，與核心 npm 發布同時執行。發布重新執行可接續進行：若核心 npm 版本已發布，工作流程會先證明登錄檔 tarball 與標籤的前置檢查成品相符，再略過核心分派；當發布版本已包含通過驗證的成品合約時，則會略過 Windows／Android 推廣，因此重試只會重新執行失敗的階段。聚焦的僅外掛修復需要 `plugin_publish_scope=selected` 和非空白的外掛清單。僅外掛的 `all-publishable` 執行需要完整且不可變的前置檢查與完整發布驗證證據；不接受部分證據。
- 穩定版 `OpenClaw Release Publish` 需要在相符的非預發布 `openclaw/openclaw-windows-node` 發布版本存在後，提供確切的 `windows_node_tag`，以及候選版本已核准的 `windows_node_installer_digests` 對應表。在分派任何發布子工作流程之前，它會驗證來源發布版本已發布、不是預發布版本、包含必要的 x64／ARM64 安裝程式，且仍與該核准對應表相符。接著，它會在 OpenClaw 發布版本仍為草稿時分派 `Windows Node Release`，並原封不動地傳遞固定的安裝程式摘要對應表。子工作流程會從該確切標籤下載已簽署的 Windows Hub 安裝程式、比對固定的摘要、在 Windows 執行器上驗證其 Authenticode 簽章使用預期的 OpenClaw Foundation 簽署者、寫入 SHA-256 資訊清單，並將安裝程式與資訊清單上傳至標準 OpenClaw GitHub 發布版本，然後重新下載已推廣的成品並驗證其資訊清單成員資格與雜湊值。父工作流程會在發布前驗證目前的 x64、ARM64 和總和檢查碼成品合約。直接復原會先拒絕非預期的 `OpenClawCompanion-*` 成品名稱，再使用固定的來源位元組取代預期的合約成品。

  僅限復原時才手動分派 `Windows Node Release`，而且一律傳入確切標籤，絕不可傳入 `latest`，並附上來自已核准來源發布版本的明確 `expected_installer_digests` JSON 對應表。網站下載連結應指向目前穩定版的確切 OpenClaw 發布成品 URL，或僅在確認 GitHub 的最新版本重新導向指向同一發布版本後，才指向 `releases/latest/download/...`；請勿只連結至配套儲存庫的發布頁面。

- 發行檢查現在會在獨立的手動工作流程中執行：`OpenClaw Release Checks`。它也會在核准發行前執行 QA Lab 模擬一致性工作管線，以及 Matrix 發行設定檔與 Telegram QA 工作管線。即時工作管線使用 `qa-live-shared` 環境；Telegram 還會使用 Convex CI 認證資訊租約。當你要執行所有維護中的 Matrix 情境時，請使用 `matrix_profile=all` 執行手動 `QA-Lab - All Lanes` 工作流程；該工作流程會將這項選擇分散到傳輸、媒體與 E2EE 設定檔，以便在各作業逾時限制內完成完整驗證。
- 跨作業系統的安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，兩者會直接呼叫可重複使用的工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。這項拆分是刻意設計的：讓真正的 npm 發行路徑保持精簡、確定且以成品為重點，同時讓較慢的即時檢查留在自己的工作管線中，以免拖延或阻擋發布。
- 含有機密資訊的發行檢查應透過 `Full Release Validation` 分派，或從 `main`/release 工作流程參照分派，讓工作流程邏輯與機密資訊維持受控。
- `OpenClaw Release Checks` 接受分支、標籤或完整的提交 SHA，前提是解析出的提交可從 OpenClaw 分支或發行標籤抵達。
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整的 40 字元工作流程分支提交 SHA，不需要已推送的標籤。該 SHA 路徑僅供驗證，無法提升為真正的發布。在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；真正的發布仍需要真正的發行標籤。
- 兩個工作流程都會將真正的發布與提升路徑保留在 GitHub 託管的執行器上，而不會修改狀態的驗證路徑則可使用較大型的 Blacksmith Linux 執行器。
- 該工作流程會同時使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流程機密資訊來執行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`。
- npm 發行預檢不再等待獨立的發行檢查工作管線。
- 在本機為候選版本加上標籤前，請執行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。此輔助程式會依照能在 GitHub 發布工作流程開始前發現常見核准阻礙錯誤的順序，執行快速發行防護檢查、外掛 npm/ClawHub 發行檢查、建置、UI 建置及 `release:openclaw:npm:check`。
- 請在核准前執行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的預發行／修正版標籤）。
- npm 發布後，請執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或相符的 beta／修正版版本），在全新的暫存前綴中驗證已發布的登錄安裝路徑。
- beta 發布後，請執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共用的租用 Telegram 認證資訊集區，針對已發布的 npm 套件驗證已安裝套件的新手設定、Telegram 設定，以及真正的 Telegram E2E。本機維護者的一次性執行可以省略 Convex 變數，直接傳入三項 `OPENCLAW_QA_TELEGRAM_*` 環境認證資訊。
- 若要從維護者電腦執行完整的發布後 beta 冒煙測試，請使用 `pnpm release:beta-smoke -- --beta betaN`。此輔助程式會執行 Parallels npm 更新／全新目標驗證、分派 `NPM Telegram Beta E2E`、輪詢確切的工作流程執行、下載成品，並輸出 Telegram 報告。
- 維護者可以透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行相同的發布後檢查。此工作流程刻意限定為手動執行，不會在每次合併時執行。
- 維護者發行自動化採用先預檢、再提升的方式：
  - 真正的 npm 發布必須通過成功的 npm `preflight_run_id`。
  - 一般 beta 與穩定版的發布協調和預檢，會針對確切的目標標籤使用受信任的 `main`。Tideclaw alpha 發布與預檢則使用相符的 alpha 分支。
  - 穩定版 npm 發行預設使用 `beta`；穩定版 npm 發布可透過工作流程輸入明確指定 `latest`。
  - 以權杖為基礎的 npm dist-tag 修改位於 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而來源存放庫只保留 OIDC 發布。
  - 公開的 `macOS Release` 僅供驗證；若標籤只存在於發行分支上，但工作流程是從 `main` 分派，請設定 `public_release_branch=release/YYYY.M.PATCH`。
  - 真正的 macOS 發布必須通過成功的 macOS `preflight_run_id` 和 `validate_run_id`。
  - 真正的發布路徑會提升已準備好的成品，而不是再次重建。
- 對於 `YYYY.M.PATCH-N` 這類穩定版修正發行，發布後驗證器也會檢查從 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同暫存前綴升級路徑，確保發行修正不會在未發出警告的情況下，讓較舊的全域安裝仍停留在基礎穩定版內容。
- 除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` 內容，否則 npm 發行預檢會以失敗關閉，避免再次發布空白的瀏覽器儀表板。
- 發布後驗證也會檢查已發布外掛的進入點與套件中繼資料是否存在於已安裝的登錄配置中。若發行版本缺少外掛執行階段內容，發布後驗證器會判定失敗，且無法提升至 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，讓安裝程式 E2E 能在發行發布路徑開始前，攔截意外的打包膨脹。
- 如果發行工作涉及 CI 規劃、擴充功能計時資訊清單或擴充功能測試矩陣，請在核准前從 `.github/workflows/plugin-prerelease.yml` 重新產生並審查由規劃器擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，確保發行說明不會描述過時的 CI 配置。
- 穩定版 macOS 發行就緒條件也包括更新程式介面：GitHub 發行最終必須包含已封裝的 `.zip`、`.dmg` 和 `.dSYM.zip`；發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip（macOS 發布工作流程會自動提交，若直接推送遭阻擋，則會開啟 appcast PR）；已封裝的應用程式必須保留非除錯套件識別碼、非空的 Sparkle 摘要 URL，以及不低於該發行版本標準 Sparkle 建置下限的 `CFBundleVersion`。

## 發行測試盒

`Full Release Validation` 是操作人員從單一進入點啟動完整產品矩陣的方式。請使用此輔助程式，讓每個子工作流程都從固定於單一受信任 `main` 工作流程 SHA 的暫存分支執行，而要求的提交仍然是受測候選項目：

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

此輔助程式會擷取目前的 `origin/main`、在該受信任的工作流程提交上推送 `release-ci/<workflow-sha>-...`、從 alpha/beta 套件版本推斷 `beta`（其他版本則推斷 `stable`）、從暫存分支使用 `ref=<target-sha>` 分派 `Full Release Validation`、驗證每個子工作流程的 `headSha` 都符合釘選的父工作流程 SHA，然後刪除暫存分支。傳入 `-f reuse_evidence=false` 可強制執行全新工作，傳入 `-f release_profile=full` 可執行廣泛的建議性掃描，或傳入 `--workflow-sha <trusted-main-sha>` 以釘選仍可從目前 `origin/main` 抵達的較舊提交。工作流程本身絕不寫入存放庫參照。如此可在不向候選項目加入工具提交的情況下使用僅限 main 的發行工具，並避免意外驗證較新的 `main` 子工作流程執行。

程式碼 SHA 通過後，只提交 `CHANGELOG.md`，並使用發行 SHA 執行相同的輔助程式：

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

只有在 GitHub 證明發行 SHA 衍生自程式碼 SHA，且完整的變更路徑集合恰好為 `CHANGELOG.md` 時，第二個父工作流程才會重複使用產品證據。它會記錄 `changelog-only-release-v1`，且不分派任何產品子工作流程。npm 預檢與套件／安裝驗收仍會在發行 SHA 上執行，因為其 tarball 位元組已變更。

對於全新的程式碼 SHA，工作流程會解析目標、分派手動 `CI`，再分派 `OpenClaw Release Checks`。啟用浸泡測試時，`OpenClaw Release Checks` 會分散執行安裝冒煙測試、跨作業系統發行檢查、即時／E2E Docker 發行路徑涵蓋範圍、包含標準 Telegram 套件 E2E 的套件驗收、QA Lab 一致性、即時 Matrix，以及即時 Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 均成功時，完整／全部執行才可接受；但若聚焦重新執行刻意略過獨立的 `Plugin Prerelease` 子工作流程，則不受此限。只有在使用 `release_package_spec` 或 `npm_telegram_package_spec` 聚焦重新執行已發布套件時，才使用獨立的 `npm-telegram` 子工作流程。最終驗證器摘要包含每個子工作流程執行的最慢作業表格，因此發行管理員不必下載記錄，就能查看目前的關鍵路徑。

在此發行路徑中，產品效能子工作流程僅產生成品。
上層工作流程使用 `publish_reports=false` 分派它；除非其僅成品防護檢查證明 Clawgrit 報告發布器維持略過狀態，否則驗證會遭拒絕。

如需完整的階段矩陣、確切的工作流程作業名稱、穩定版與完整設定檔差異、成品，以及聚焦重新執行控制代碼，請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)。

子工作流程會從執行 `Full Release Validation` 的 SHA 釘選受信任參照進行分派。每次子工作流程執行都必須使用完全相同的父工作流程 SHA。請勿使用原始 `--ref main -f ref=<sha>` 分派作為發行證明；請使用 `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`。

使用 `release_profile` 選擇即時／供應商涵蓋廣度：

- `beta`：最快的發行關鍵 OpenAI／核心即時與 Docker 路徑
- `stable`：供發行核准使用的 beta 加穩定版供應商／後端涵蓋範圍
- `full`：穩定版加廣泛的建議性供應商／媒體涵蓋範圍

穩定版與完整驗證在提升前一律會執行詳盡的即時／E2E、Docker 發行路徑，以及有界限的已發布升級存續掃描。使用 `run_release_soak=true` 可為 beta 要求相同掃描。該掃描涵蓋最新四個穩定版套件、釘選的 `2026.4.23` 和 `2026.5.2` 基準，以及較舊的 `2026.4.15` 涵蓋範圍；其中會移除重複基準，並將每個基準分片至各自的 Docker 執行器作業。

`OpenClaw Release Checks` 使用受信任的工作流程參照，將目標參照一次解析為 `release-package-under-test`；執行浸泡測試時，會在跨作業系統、套件驗收與發行路徑 Docker 檢查中重複使用該成品。如此可讓所有面向套件的測試盒使用相同位元組，並避免重複建置套件。beta 已發布至 npm 後，請設定 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，讓發行檢查僅下載一次已發布套件、從 `dist/build-info.json` 擷取其建置來源 SHA，並為跨作業系統、套件驗收、發行路徑 Docker 與套件 Telegram 工作管線重複使用該成品。

若已設定存放庫／組織變數，跨作業系統 OpenAI 安裝冒煙測試會使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.6-luna`，因為此工作管線旨在驗證套件安裝、新手設定、閘道啟動，以及一次即時代理程式回合，而不是評測能力最強的模型。較廣泛的即時供應商矩陣仍是進行模型特定涵蓋的地方。

請依發行階段使用以下變體：

```bash
# 驗證產品完成版的 Code SHA。
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# 重複使用 Code SHA 的產品證據，驗證僅變更日誌的 Release SHA。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# 發布 beta 版後，新增已發布套件的 Telegram E2E。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

完成聚焦修正後，第一次重新執行時不要使用完整傘狀流程。若某個檢查框失敗，下一次驗證請使用失敗的子工作流程、工作、Docker 執行通道、套件設定檔、模型提供者或 QA 執行通道。只有在修正變更了共用發布協調機制，或使先前所有檢查框的證據失效時，才再次執行完整傘狀流程。傘狀流程的最終驗證器會重新檢查記錄的子工作流程執行 ID，因此子工作流程成功重新執行後，只需重新執行失敗的 `Verify full validation` 父工作。

當發布設定檔、有效的浸泡測試設定與驗證輸入相符，且目標 SHA
相同，或新目標是其後代且完整變更路徑集合恰好為
`CHANGELOG.md` 時，`rerun_group=all` 可重複使用先前成功的傘狀流程執行。完全相同目標的重複使用會記錄
`exact-target-full-validation-v1`；驗證後的 Release SHA 會記錄
`changelog-only-release-v1`。後者只重複使用產品驗證。Npm
預檢、套件位元組、版本資訊來源，以及安裝／更新驗收
仍必須針對 Release SHA 執行。任何版本、來源、產生內容、
相依套件、套件或工作流程所擁有的目標變更，都需要新的 Code SHA
及全新的完整驗證。同一 `release/*` ref 與
重新執行群組的較新傘狀流程執行會自動取代進行中的執行。傳入
`reuse_evidence=false` 可強制執行全新的完整流程。

若要進行有限範圍的復原，請將 `rerun_group` 傳入傘狀流程。`all` 是實際的候選發布版本執行，`ci` 只執行一般 CI 子流程，`plugin-prerelease` 只執行發布專用的外掛子流程，`release-checks` 執行所有發布檢查框，而較小範圍的發布群組為 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 與 `npm-telegram`。聚焦的 `npm-telegram` 重新執行需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整／全部執行會使用 Package Acceptance 內的標準套件 Telegram E2E。聚焦的跨作業系統重新執行可加入 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統／測試套件篩選器。QA 發布檢查失敗會阻擋一般發布驗證，包括標準層級中必要的 OpenClaw 動態工具漂移檢查。Tideclaw alpha 執行仍可將與套件安全性無關的發布檢查通道視為建議性檢查。使用 `release_profile=beta` 時，`Run repo/live E2E validation` 即時提供者測試套件為建議性檢查（只發出警告，不會阻擋）；stable 與完整設定檔仍會將其視為阻擋條件。當 `live_suite_filter` 明確要求受閘控的 QA 即時通道（例如 Discord、WhatsApp 或 Slack）時，必須啟用相符的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫變數；否則輸入擷取會失敗，而不是無聲略過該通道。

### Vitest

Vitest 檢查框是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍界定，並為候選發布版本強制執行一般測試圖：Linux Node 分片、內建外掛分片、外掛與通道契約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置產物冒煙檢查、文件檢查、Python Skills、Windows、macOS，以及 Control UI 國際化。當 `Full Release Validation` 執行此檢查框時，會包含 Android，因為傘狀流程會傳入 `include_android=true`；獨立手動 CI 需要 `include_android=true` 才能涵蓋 Android。

使用此檢查框回答「原始碼樹是否通過完整的一般測試套件？」這與發布路徑的產品驗證不同。應保留的證據：

- `Full Release Validation` 摘要，顯示已派送的 `CI` 執行 URL
- `CI` 在完全相同的目標 SHA 上執行成功
- 調查迴歸問題時，CI 工作中的失敗或緩慢分片名稱
- 需要分析執行效能時的 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發布需要確定性的一般 CI，但不需要 Docker、QA Lab、即時、跨作業系統或套件檢查框時，才直接執行手動 CI。非 Android 的直接 CI 請使用第一個命令。若直接候選發布版本 CI 必須涵蓋 Android，請加入 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 檢查框位於 `OpenClaw Release Checks` 至 `openclaw-live-and-e2e-checks-reusable.yml`，另包含發布模式的 `install-smoke` 工作流程。它透過封裝好的 Docker 環境驗證候選發布版本，而不只執行原始碼層級測試。

發布 Docker 涵蓋範圍包括：

- 完整安裝冒煙測試，並啟用較慢的 Bun 全域安裝冒煙測試
- 依目標 SHA 準備／重複使用根目錄 Dockerfile 冒煙測試映像，且 QR、根目錄／閘道與安裝程式／Bun 冒煙工作會分別以獨立的安裝冒煙測試分片執行
- 儲存庫 E2E 執行通道
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 至 `plugins-runtime-install-h`，以及 `openwebui`
- 依要求在專用大容量磁碟執行器上執行 OpenWebUI 涵蓋測試
- 分割的內建外掛安裝／解除安裝通道 `bundled-plugin-install-uninstall-0` 至 `bundled-plugin-install-uninstall-23`
- 當發布檢查包含即時測試套件時，執行即時／E2E 提供者測試套件與 Docker 即時模型涵蓋測試

重新執行前先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含執行通道記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重新執行命令。若要進行聚焦復原，請在可重複使用的即時／E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，不要重新執行所有發布區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 與已準備的 Docker 映像輸入，因此失敗的執行通道可重複使用相同的 tarball 與 GHCR 映像。

### QA Lab

QA Lab 檢查框也是 `OpenClaw Release Checks` 的一部分。這是代理式行為與通道層級的發布閘門，與 Vitest 和 Docker 套件機制分開。

發布 QA Lab 涵蓋範圍包括：

- 模擬對等通道，使用代理式對等套件比較 OpenAI 候選通道與 `anthropic/claude-opus-4-8` 基準
- 使用 `qa-live-shared` 環境的 Matrix 即時轉接器發布設定檔
- 使用 Convex CI 認證資訊租約的即時 Telegram QA 通道
- 發布遙測需要明確的本機證明時，使用 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此檢查框回答「發布版本在 QA 情境與即時通道流程中的行為是否正確？」核准發布時，請保留對等、Matrix 與 Telegram 通道的成品 URL。完整 Matrix 涵蓋測試仍可透過手動分片的 QA-Lab 執行取得，而不是預設的發布關鍵通道。

### 套件

Package 檢查框是可安裝產品的閘門。其後端由 `Package Acceptance` 與解析器 `scripts/resolve-openclaw-package-candidate.mjs` 提供。解析器會將候選項標準化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並使工作流程測試框架 ref 與套件來源 ref 保持分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或完全相符的 OpenClaw 發布版本
- `source=ref`：使用選定的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載公開 HTTPS `.tgz`，並要求提供 `package_sha256`；含 URL 認證資訊、非預設 HTTPS 連接埠、私有／內部／特殊用途主機名稱或解析位址，以及不安全的重新導向都會遭到拒絕
- `source=trusted-url`：下載 HTTPS `.tgz`，並要求提供 `package_sha256` 及 `trusted_source_id`，其值來自 `.github/package-trusted-sources.json` 中的具名原則；對於維護者擁有的企業鏡像或私有套件儲存庫，請使用此方法，不要在 `source=url` 中新增輸入層級的私有網路略過機制
- `source=artifact`：重複使用另一個 GitHub Actions 執行所上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對同一個已解析 tarball，持續執行移轉、更新、根層級管理的 VPS 升級、已設定驗證更新後重新啟動、即時 ClawHub Skill 安裝、過時外掛相依套件清理、離線外掛固定裝置、外掛更新、外掛命令繫結逸出強化，以及 Telegram 套件 QA。具阻擋性的發布檢查會使用預設的最新已發布套件基準；搭配 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 設定檔，會將已發布升級存續測試擴展至 `last-stable-4`，並加入釘選的 `2026.4.23`、`2026.5.2` 與 `2026.4.15` 基準，以及 `reported-issues` 情境。對於已發布的候選項，請使用搭配 `source=npm` 的 Package Acceptance；對於發布前以 SHA 為基礎的本機 npm tarball，使用 `source=ref`；對於維護者擁有的企業／私有鏡像，使用 `source=trusted-url`；對於另一個 GitHub Actions 執行所上傳的已準備 tarball，使用 `source=artifact`。

這是 GitHub 原生的替代方案，可取代先前大多數需要 Parallels 的套件／更新涵蓋測試。跨作業系統發布檢查對於作業系統特定的初始設定、安裝程式與平台行為仍很重要，但套件／更新產品驗證應優先使用 Package Acceptance。

更新與外掛驗證的標準檢查清單為[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。判斷哪個本機、Docker、Package Acceptance 或發布檢查通道能證明外掛安裝／更新、doctor 清理或已發布套件移轉變更時，請使用此清單。針對每個 stable `2026.4.23+` 套件進行的完整已發布更新移轉，是獨立的手動 `Update Migration` 工作流程，不屬於 Full Release CI。

舊版套件驗收的寬鬆處理刻意設有期限。截至 `2026.4.25` 的套件，可針對已發布至 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少私有 QA 清單項目、缺少 `gateway install --wrapper`、衍生自 tarball 的 git 固定裝置中缺少修補檔案、缺少持久保存的 `update.channel`、舊版外掛安裝記錄位置、缺少市集安裝記錄持久保存，以及在 `plugins update` 期間進行設定中繼資料移轉。已發布的 `2026.4.26` 套件可針對已經發布的本機建置中繼資料戳記檔案發出警告。後續套件必須符合現代套件契約；相同的缺口將導致發布驗證失敗。

當發布問題涉及實際可安裝套件時，請使用涵蓋範圍更廣的 Package Acceptance 設定檔：

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

- `smoke`：快速套件安裝／頻道／代理程式、閘道網路與設定重新載入執行路徑
- `package`：安裝／更新／重新啟動／外掛套件契約，加上即時 ClawHub skill 安裝證明；這是發行檢查的預設值
- `product`：`package` 加上 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋與 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：用於聚焦重新執行的精確 `docker_lanes` 清單

若要進行套件候選版本的 Telegram 驗證，請在套件驗收中啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。工作流程會將解析後的 `package-under-test` tarball 傳入 Telegram 執行路徑；獨立的 Telegram 工作流程仍接受已發布的 npm 規格，以進行發布後檢查。

## 一般發行發布自動化

對於 beta、`latest`、外掛、GitHub Release 與平台發布，
`OpenClaw Release Publish` 是一般的變更進入點。每月執行的
`.33+` 僅限 npm 延伸穩定版路徑不使用此協調器。
一般工作流程會按照發行所需的順序協調受信任發布者工作流程：

1. 簽出發行標籤並解析其提交 SHA。
2. 確認可從 `main` 或 `release/*` 到達該標籤（若為 alpha 預發行版本，則也可從 Tideclaw alpha 分支到達）。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 與 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同的範圍與 SHA 分派 `Plugin ClawHub Release`。
6. 確認已儲存的 `full_release_validation_run_id` 與確切執行嘗試次數後，使用發行標籤、npm dist-tag 與已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。
7. 對於穩定版發行，建立 GitHub 發行草稿或將其更新為草稿，使用明確的 `windows_node_tag` 與候選版本已核准的 `windows_node_installer_digests` 分派 `Windows Node Release`，並確認標準 Windows 安裝程式／總和檢查碼資產。同時分派 `Android Release`，以建置確切標籤的已簽署 APK、總和檢查碼與來源證明。發布草稿前，請確認這兩項原生資產契約。

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

直接升級穩定版至 `latest` 必須明確指定：

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

僅將較低階的 `Plugin NPM Release` 與 `Plugin ClawHub Release` 工作流程用於聚焦修復或重新發布工作。當 `publish_openclaw_npm=true` 時，`OpenClaw Release Publish` 會拒絕 `plugin_publish_scope=selected`，因此核心套件無法在未包含每個可發布的官方外掛（包括 `@openclaw/diffs-language-pack`）時發布。若要修復所選外掛，請將 `publish_openclaw_npm=false` 與 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 一併設定，或直接分派子工作流程。

首次發布的 ClawHub 啟動程序為例外：從受信任的 `main`
分派 `Plugin ClawHub New`，並透過 `ref` 傳入完整的目標發行 SHA。
絕不可從發行標籤或分支執行啟動程序工作流程本身：

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

標籤前驗證需要 `dry_run=true`、拒絕發行標籤與父執行
輸入，而且只接受可從 `main` 或 `release/*` 到達的確切目標。
它不會載入 ClawHub 認證資訊、發布套件位元組，或變更受信任
發布者設定。工作流程仍會解析即時登錄檔計畫、
僅在無機密資訊的工作中簽出並封裝目標、具現化
鎖定的 ClawHub 工具鏈，並在發行標籤存在前驗證不可變資產與套件
slug／身分。請僅在無機密資訊的封裝工作
完成後核准 `clawhub-plugin-bootstrap` 環境；
此受保護的驗證工作不含認證資訊或變更命令。

標記後已核准的試執行或實際啟動程序必須包含確切的
發行標籤，以及父 `OpenClaw Release Publish` 執行 ID、嘗試次數與
分支。父項會證明其自身工作流程 SHA，以及 `Plugin ClawHub New` 的另一個確切受信任
`main` SHA；子執行與每項受保護的
環境核准都必須符合該已核准的子項 SHA。每次嘗試發布與變更受信任發布者前，
都會重新檢查發行標籤。

封裝工作
會上傳一項不可變資產；其名稱、Actions 資產 ID／摘要、
產生者執行／嘗試次數、目標 SHA，以及每個套件 tarball 的 SHA-256／大小，
都會傳入驗證工作與受保護工作。受保護工作只會簽出受信任的 `main`
工具，透過 GitHub API 驗證資產組合、依確切資產 ID 下載、
重新雜湊每個 tarball，並使用固定版本命令列介面的 USTAR 標準化規則驗證本機 TAR 路徑與
套件身分。之後每個候選版本都必須通過固定版本命令列介面的發布試執行，而該試執行會在
查詢登錄檔或驗證身分前返回。認證資訊工作的預先篩選器將壓縮後的 ClawPack
限制為 120 MiB、檔案承載總量限制為 50 MiB、展開後的 TAR 資料限制為 64 MiB，且
TAR 項目數限制為 10,000。既有套件的受信任發布者修復仍
僅進行設定，但仍會封裝目標，並要求所請求的標籤
與確切的登錄檔位元組和中繼資料完全相等，才會變更受信任發布者
設定。發布後驗證會下載 ClawHub 資產，並
要求相同的 SHA-256 與大小。重新執行失敗項目的復原只有在確切的產生者工作已
成功完成時，才可重複使用先前
嘗試的套件資產。最終證據也會繫結鎖定的 ClawHub 版本、鎖定檔
SHA-256 與 npm 完整性。若不相符，則需要新的套件版本。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作人員控制的輸入：

- `tag`：必要的發行標籤，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；當 `preflight_only=true` 時，也可以是目前完整的 40 字元工作流程分支提交 SHA，以僅進行驗證的預檢
- `preflight_only`：`true` 僅進行驗證／建置／封裝，`false` 則用於實際發布路徑
- `preflight_run_id`：既有的成功預檢執行 ID；實際發布路徑需要此項，讓工作流程重複使用已準備的 tarball，而非重新建置
- `full_release_validation_run_id`：此標籤／SHA 的成功 `Full Release Validation` 執行 ID，實際發布需要此項。Beta 發布可以只依預檢繼續執行，但會顯示警告；穩定版／`latest` 升級仍需要此項。
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數執行嘗試次數；只要提供執行 ID，就必須提供此項，確保重新執行無法在發布期間變更授權證據。
- `release_publish_run_id`：已核准的 `OpenClaw Release Publish` 執行 ID；當此工作流程由該父項分派時需要此項（機器人執行者的實際發布呼叫）
- `plugin_npm_run_id`：成功且完全符合 HEAD 的 `Plugin NPM Release` 執行 ID；實際發布 `extended-stable` 核心時需要此項
- `npm_dist_tag`：發布路徑的 npm 目標標籤；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，預設為 `beta`。最終修補版本 `33` 及更新版本必須使用 `extended-stable`；依預設，`extended-stable` 會拒絕較早的修補版本，且一律拒絕非最終標籤。
- `bypass_extended_stable_guard`：僅供測試的布林值，預設為 `false`；搭配 `npm_dist_tag=extended-stable` 時，會略過每月延伸穩定版的資格要求，同時保留發行身分、資產、核准與回讀檢查。

`Plugin NPM Release` 接受 `npm_dist_tag=default` 以維持既有發行
行為，或接受 `npm_dist_tag=extended-stable` 以使用受防護的每月路徑。
延伸穩定版選項需要 `publish_scope=all-publishable`、空白的
`plugins` 輸入、等於或高於 `33` 的最終修補版本，以及位於確切尖端的標準
`extended-stable/YYYY.M.33` 分支。它絕不會移動外掛
`latest` 或 `beta`。新套件版本會透過 OIDC 受信任發布（`npm publish --tag extended-stable`）以不可分割方式取得 `extended-stable`；
此來源工作流程不使用以權杖驗證身分的 `npm dist-tag add`。重試時會
略過 npm 中已存在的確切版本，之後除非完整
回讀確認每個確切套件與 `extended-stable` 標籤皆已收斂，否則會採封閉式失敗。

`OpenClaw Release Publish` 接受以下由操作人員控制的輸入：

- `tag`：必要的發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時需要此項
- `full_release_validation_run_id`：成功的 `Full Release Validation` 執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時需要此項
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數嘗試次數；只要提供執行 ID，就必須提供此項
- `windows_node_tag`：確切的非預發行 `openclaw/openclaw-windows-node` 發行標籤；發布穩定版 OpenClaw 時需要此項
- `windows_node_installer_digests`：候選版本已核准的精簡 JSON 對應表，將目前 Windows 安裝程式名稱對應至其固定的 `sha256:` 摘要；發布穩定版 OpenClaw 時需要此項
- `npm_telegram_run_id`：選用的成功 `NPM Telegram Beta E2E` 執行 ID，用於納入最終發行證據
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤，可為 `alpha`、`beta` 或 `latest` 之一
- `plugin_publish_scope`：預設為 `all-publishable`；僅在搭配 `publish_openclaw_npm=false` 進行聚焦且僅限外掛的修復工作時使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；僅在將工作流程用作僅限外掛的修復協調器時設定 `false`
- `release_profile`：用於發行證據摘要的發行涵蓋範圍設定檔；預設為 `from-validation`，會從驗證資訊清單讀取，或以 `beta`、`stable` 或 `full` 覆寫
- `wait_for_clawhub`：預設為 `false`，因此 npm 可用性不會受到 ClawHub 輔助程序阻擋；僅當工作流程必須在 ClawHub 完成後才算完成時，才設定 `true`

`OpenClaw Release Checks` 接受以下由操作人員控制的輸入：

- `ref`：要驗證的分支、標籤或完整提交 SHA。包含機密資訊的檢查要求解析後的提交必須可從 OpenClaw 分支或發行標籤存取。
- `run_release_soak`：選擇加入詳盡的即時／E2E、Docker 發行路徑，以及針對 Beta 發行檢查的所有既有版本升級存活浸泡測試。`release_profile=stable` 和 `release_profile=full` 會強制啟用此項目。

規則：

- 低於修補版本 `33` 的一般最終版本與修正版，可發佈至 `beta` 或 `latest`。修補版本為 `33` 或更高的最終版本，必須發佈至 `extended-stable`，且會拒絕位於該界線的修正後綴版本。
- Beta 預發行標籤只能發佈至 `beta`；Alpha 預發行標籤只能發佈至 `alpha`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許輸入完整提交 SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律僅供驗證
- 實際發佈路徑必須使用預檢期間所用的相同 `npm_dist_tag`；工作流程會在繼續發佈前驗證該中繼資料

## 一般 Beta／latest 穩定版發行順序

這個舊版順序適用於一般的協調式發行；該發行也負責外掛、GitHub Release、Windows 及其他平台工作。這不是本頁頂端所記載的每月 `.33+` 僅限 npm 的延伸穩定版路徑。

建立一般的協調式穩定版發行時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。標籤存在之前，可以使用目前工作流程分支的完整提交 SHA，對預檢工作流程執行僅供驗證的試執行。
2. 一般先發佈 Beta 的流程請選擇 `npm_dist_tag=beta`；只有在刻意要直接發佈穩定版時，才選擇 `latest`。
3. 若要透過單一手動工作流程取得一般 CI，以及即時提示快取、Docker、QA Lab、Matrix 和 Telegram 的涵蓋範圍，請在發行分支、發行標籤或完整提交 SHA 上執行 `Full Release Validation`。如果刻意只需要具決定性的一般測試圖，請改在發行參照上執行手動 `CI` 工作流程。
4. 選取其已簽署 x64 與 ARM64 安裝程式應隨附發行的確切非預發行 `openclaw/openclaw-windows-node` 發行標籤。將其儲存為 `windows_node_tag`，並將其已驗證的摘要對照表儲存為 `windows_node_installer_digests`。發行候選版輔助程式會記錄兩者，並將其納入產生的發佈命令中。
5. 儲存成功的 `preflight_run_id`、`full_release_validation_run_id`，以及確切的 `full_release_validation_run_attempt`。
6. 從受信任的 `main` 執行 `OpenClaw Release Publish`，並使用相同的 `tag`、相同的 `npm_dist_tag`、所選的 `windows_node_tag`、其已儲存的 `windows_node_installer_digests`、已儲存的 `preflight_run_id`、`full_release_validation_run_id` 和 `full_release_validation_run_attempt`。它會先將外部化的外掛發佈至 npm 和 ClawHub，再升級 OpenClaw npm 套件。
7. 如果發行落在 `beta`，請使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 升級至 `latest`。
8. 如果發行刻意直接發佈至 `latest`，而且 `beta` 應立即跟隨相同的穩定版建置，請使用相同的發行工作流程，將兩個 dist-tag 都指向該穩定版本；也可以讓其排程的自我修復同步稍後移動 `beta`。

dist-tag 變更位於發行分類帳儲存庫中，因為它仍需要 `NPM_TOKEN`，而原始碼儲存庫則維持僅使用 OIDC 發佈。如此可讓直接發佈路徑與先發佈 Beta 的升級路徑都有文件記載，且操作人員都能看見。

如果維護者必須改用本機 npm 驗證，請只在專用的 tmux 工作階段內執行任何 1Password 命令列介面（`op`）命令。請勿直接從主要代理程式殼層呼叫 `op`；將其保留在 tmux 中，可讓提示、警示與 OTP 處理過程保持可觀察，並防止主機重複發出警示。

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

- [發行通道](/zh-TW/install/development-channels)
