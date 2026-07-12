---
read_when:
    - 正在尋找公開發布頻道的定義
    - 執行發布驗證或套件驗收
    - 尋找版本命名與發布週期
summary: 發布通道、操作人員檢查清單、驗證環境、版本命名與發布節奏
title: 發布政策
x-i18n:
    generated_at: "2026-07-11T21:47:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前提供三個面向使用者的更新通道：

- stable：現有的正式推廣發布通道；在獨立的命令列介面／通道里程碑完成前，仍會透過 npm `latest` 解析
- beta：發布至 npm `beta` 的預發行標籤
- dev：持續移動的 `main` 最新提交

此外，發布操作人員可以將上一個已結束月份的核心套件發布至 npm `extended-stable`，修補版本從 `33` 開始。當月的一般最終版本線仍使用 npm `latest`；這項操作端的發布分流本身不會變更命令列介面的更新通道解析方式。

Tideclaw alpha 組建是另一條內部預發行軌道（npm dist-tag `alpha`），詳見 [NPM 工作流程輸入](#npm-workflow-inputs)與[發布測試環境](#release-test-boxes)。

## 版本命名

- 每月 npm extended-stable 發行版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`，git 標籤為 `vYYYY.M.PATCH`
- 每日／一般最終發行版本：`YYYY.M.PATCH`，其中 `PATCH < 33`，git 標籤為 `vYYYY.M.PATCH`
- 一般備援修正發行版本：`YYYY.M.PATCH-N`，git 標籤為 `vYYYY.M.PATCH-N`
- Beta 預發行版本：`YYYY.M.PATCH-beta.N`，git 標籤為 `vYYYY.M.PATCH-beta.N`
- Alpha 預發行版本：`YYYY.M.PATCH-alpha.N`，git 標籤為 `vYYYY.M.PATCH-alpha.N`
- 月份或修補版本絕不可補零
- `PATCH` 是每月依序遞增的發行列車編號，而非日曆日期。一般最終版本與 beta 版本會推進目前的發行列車；僅有 alpha 的標籤絕不占用或推進 beta／一般版本的修補編號，因此選擇 beta 或一般發行列車時，請忽略修補編號較高的舊版純 alpha 標籤。
- Alpha／每夜組建使用下一個尚未發行的修補版本列車，重複組建時只遞增 `alpha.N`。該修補版本一旦已有 beta，新 alpha 組建就移至下一個修補版本。
- npm 版本不可變更：絕不可刪除、重新發布或重複使用已發布的標籤。請改為建立下一個預發行編號或下一個每月修補版本。
- `latest` 繼續跟隨目前的一般／每日 npm 版本線；`beta` 是目前的 beta 安裝目標
- `extended-stable` 代表受支援的上一月份 npm 套件，修補版本從 `33` 開始；修補版本 `34` 及之後的版本是該每月版本線上的維護發行
- 一般最終版本與一般修正版本預設發布至 npm `beta`；發布操作人員可以明確指定 `latest`，或稍後將經過驗證的 beta 組建推廣至該通道
- 專用的每月 extended-stable 路徑會以完全相同的版本發布核心 npm 套件及所有可發布至 npm 的官方外掛。它不會將外掛發布至 ClawHub，也不會發布 macOS 或 Windows 成品、GitHub Release、私有儲存庫 dist-tag、Docker 映像、行動平台成品或網站下載項目。
- 每個一般最終版本都會一併發布 npm 套件、macOS 應用程式、已簽署的獨立 Android APK，以及已簽署的 Windows Hub 安裝程式。Beta 版本通常會先驗證並發布 npm／套件路徑；原生應用程式的組建、簽署、公證與推廣則保留給一般最終版本，除非明確要求。

## 發行節奏

- 發行流程會先推出 beta；只有最新 beta 通過驗證後，stable 才會跟進
- 維護人員通常會從目前的 `main` 建立 `release/YYYY.M.PATCH` 分支並由此進行發行，因此發行驗證與修正不會阻礙 `main` 上的新開發
- 如果 beta 標籤已推送或發布後需要修正，維護人員會建立下一個 `-beta.N` 標籤，而非刪除或重新建立舊標籤
- 詳細的發行程序、核准、憑證與復原說明僅供維護人員使用

## 每月僅發布至 npm 的 extended-stable 流程

這是下方一般發行程序的專用例外。對於已結束的月份 `YYYY.M`，建立 `extended-stable/YYYY.M.33`；從同一分支發布 `vYYYY.M.33` 及後續的維護修補版本。發行標籤、分支頂端、簽出內容、套件版本、npm 預檢，以及完整發行驗證執行都必須指向同一個提交。受保護的 `main` 必須已包含日曆月份嚴格晚於該月份，且修補版本低於 `33` 的最終版本；即使 `main` 已向前推進超過一個月，維護修補版本仍符合資格。

在確切的 extended-stable 分支上，將根套件版本提升至 `YYYY.M.P`，執行 `pnpm release:prep`，並驗證每個可發布的擴充套件皆使用相同版本。提交並推送所有產生的變更，在該提交上建立並推送不可變更的 `vYYYY.M.P` 標籤，並記錄產生的完整 SHA。工作流程會使用這棵已準備完成的來源樹；它們不會代替你提升或同步版本。

從該已準備分支的確切頂端執行 npm 預檢與完整發行驗證，接著儲存兩者的執行 ID，以及成功的完整發行驗證執行嘗試次數：

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

`release_profile=stable` 是現有的驗證深度設定檔；它與 npm `extended-stable` dist-tag 分開，並刻意保持不變。

兩項執行都成功後，從同一個確切分支頂端發布所有可發布至 npm 的官方外掛。修補版本 `P` 必須為 `33` 或以上。將完整發行 SHA 作為 `ref` 傳入，等待完整矩陣與登錄檔回讀完成，接著儲存成功的外掛 NPM 發行執行 ID：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

工作流程使用一般已準備好的 `all-publishable` 套件清單，其中包括原始碼未變更的套件。成功前，它會驗證每個確切套件及每個外掛的 `extended-stable` 標籤。如果部分執行失敗，請重新執行相同命令：已發布的套件會被重複使用、缺少或過期的外掛標籤會在 npm 發行環境中進行校正，而最終回讀仍會涵蓋完整套件集合。

外掛工作流程成功且 npm 發行環境就緒後，發布預檢所產生的確切核心 tarball。核心發布會驗證所引用的外掛執行在相同的標準分支及完全相同的來源 SHA 上處於 `completed/success` 狀態：

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

對於刻意無法符合每月 `.33` 或受保護 `main` 月份政策的分支版本或非正式環境演練，請在 npm 預檢與發布分派中都加入 `-f bypass_extended_stable_guard=true`。預設值為 `false`。只有在 `npm_dist_tag=extended-stable` 時才接受略過設定，且會記錄於工作流程摘要中。它不會略過標準的 `extended-stable/YYYY.M.33` 工作流程參照、分支頂端／標籤／簽出內容一致性、最終標籤語法、套件／標籤版本一致性、所引用執行與資訊清單身分、tarball 來源、環境核准、登錄檔回讀或選擇器修復證據。

發布工作流程會驗證所引用的預檢、驗證與外掛執行身分、已準備 tarball 的摘要值，以及核心登錄檔選擇器。工作流程成功後，請另外確認結果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

兩個命令都必須回傳 `YYYY.M.P`。如果發布成功但選擇器回讀失敗，請勿重新發布不可變更的套件版本。請使用失敗工作流程中必定執行的摘要所列出的單一 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復命令，然後再次執行兩項獨立回讀。回復至先前的選擇器是另一項操作人員決策，不屬於回讀修復路徑。

公開支援文件最初將 Slack、Discord 和 Codex 指定為涵蓋的 extended-stable 外掛介面。該清單是支援聲明，而非發行程式碼允許清單：所有可發布至 npm 的官方外掛都遵循相同的完全一致版本發布路徑。

下方的一般檢查清單仍負責 beta、`latest`、GitHub Release、外掛、macOS、Windows 及其他平台的發布。請勿對這條僅發布至 npm 的 extended-stable 路徑執行那些步驟。

## 一般發行操作人員檢查清單

此檢查清單呈現發行流程的公開形式。私有憑證、簽署、公證、dist-tag 復原及緊急回復的詳細資訊保留於僅供維護人員使用的發行操作手冊中。

1. 從目前的 `main` 開始：拉取最新內容、確認目標提交已推送，並確認 `main` 的 CI 狀態足以建立分支。
2. 根據自上一個可達的發布標籤以來已合併的 PR 和所有直接提交，產生 `CHANGELOG.md` 最上方的章節。條目應面向使用者，去除內容重疊的 PR／直接提交條目，提交並推送，然後在建立分支前再次 rebase／拉取。當分歧的已發布標籤或之後的向前移植，使已發布的 PR 被重新關聯時，請以 `--shipped-ref` 明確傳入該標籤；驗證器會使用標籤快照中編號章節的完整貢獻記錄內所明列的 PR 資料列、忽略 `Unreleased`，並記錄確切排除的 PR 清單與數量。
3. 檢閱 `src/plugins/compat/registry.ts` 和 `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍有涵蓋時，才移除已到期的相容性；否則請記錄刻意保留的原因。
4. 從目前的 `main` 建立 `release/YYYY.M.PATCH`。不要直接在 `main` 上進行一般發布作業。
5. 更新標籤所需的每個版本位置，然後執行 `pnpm release:prep`。它會依序重新整理外掛版本、npm shrinkwrap、外掛清單、基礎設定結構描述、內建頻道設定中繼資料、設定文件基準、外掛 SDK 匯出，以及外掛 SDK API 基準。在加上標籤前，提交所有產生的差異，然後執行本機確定性預檢：`pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤尚不存在之前，允許使用完整的 40 字元發布分支 SHA，僅供驗證預檢使用。預檢會針對確切簽出的相依性圖產生相依性發布證據，並將其儲存在 npm 預檢成品中。儲存成功的 `preflight_run_id`。
7. 針對發布分支、標籤或完整提交 SHA，透過 `Full Release Validation` 啟動所有發布前測試。這是四個大型發布測試區塊的唯一手動進入點：Vitest、Docker、QA Lab 和 Package。儲存 `full_release_validation_run_id` 與確切的 `full_release_validation_run_attempt`；兩者都是 `OpenClaw NPM Release` 和 `OpenClaw Release Publish` 的必要輸入。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正有效的最小失敗檔案、執行道、工作流程作業、套件設定檔、提供者或模型允許清單。只有在變更的範圍使先前證據失效時，才重新執行完整的統合流程。
9. 對於已加標籤的 beta 候選版本，請從相符的 `release/YYYY.M.PATCH` 分支執行 `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。對於穩定版，還要傳入必要的 Windows 來源版本：`pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。此輔助程式使用受信任的 `main` 作為工作流程來源，同時讓每個工作流程以確切標籤為目標。它會將不可變的候選版本／工具身分與已派送的執行 ID 檢查點，儲存在 `.artifacts/release-candidate/<tag>/release-candidate-state.json`；重新執行相同命令時會續接這些確切執行，而候選版本、工具、設定檔或選項如有任何差異，便會採取封閉式失敗。在派送完整驗證矩陣前，此輔助程式會以確定性方式呈現確切標籤的 GitHub 發布內文，並拒絕缺少版本標題、超出限制且無法使用標準精簡格式的內文，或從標籤無法到達的貢獻記錄基礎／目標來源。它也會依據所參照的累積標籤記錄，驗證任何明確的已發布基準排除中繼資料。接著，它會執行本機產生式發布檢查、派送或驗證完整發布驗證與 npm 預檢證據、針對確切準備好的壓縮套件執行 Parallels 全新安裝／更新證明及 Telegram 套件證明、記錄外掛 npm 與 ClawHub 計畫，並且只在證據套件全部通過後，才輸出確切的 `OpenClaw Release Publish` 命令。

   `OpenClaw Release Publish` 會將選定或所有可發布的外掛套件平行派送至 npm，並將同一組套件派送至 ClawHub；外掛 npm 發布成功後，再以相符的 dist-tag 推進已準備好的 OpenClaw npm 預檢成品。發布簽出內容仍是產品／資料根目錄，而規劃與最終驗證則從確切且受信任的工作流程來源簽出內容執行，因此較舊的發布提交無法悄悄使用過時的發布工具。在任何發布子工作開始前，它會呈現並快取確切的 GitHub 發布內文。當完整且相符的 `CHANGELOG.md` 章節符合 GitHub 的 125,000 字元限制及呈現器相符的 125,000 位元組安全上限時，頁面會包含完全相同的 `## YYYY.M.PATCH` 章節，包括其標題。當來源章節無法容納時，頁面會保留完全相同的分組編輯說明，並將過大的貢獻記錄替換為指向標籤固定之 `CHANGELOG.md` 完整記錄的穩定連結；絕不發布不完整記錄或遭截斷的項目符號。工作流程會先選擇完整或精簡內文，再加入 `### 發布驗證`；若證明尾段會超出限制，則保留標準內文並改以不可變的附加證據為準。發布至 npm `latest` 的穩定版會成為 GitHub 的最新發布，而保留在 npm `beta` 的穩定維護版本則會以 GitHub `latest=false` 建立。此工作流程也會將預檢相依性證據、完整驗證資訊清單及發布後登錄檔驗證證據上傳至 GitHub 發布，以供發布後事件應變使用。它會立即輸出子執行 ID、自動核准工作流程權杖獲准核准的發布環境閘門、以記錄尾段摘要失敗的子作業、預先建立 GitHub 發布草稿頁面，並在發布 OpenClaw npm 的同時平行推進 Windows 和 Android 成品；這些階段成功後，便完成發布頁面與相依性證據，在發布 OpenClaw npm 時等待 ClawHub，然後執行受信任 `main` 上的 beta 驗證器，並針對 GitHub 發布、npm 套件、選定的外掛 npm 套件、選定的 ClawHub 套件、子工作流程執行 ID，以及選用的 NPM Telegram 執行 ID，上傳發布後證據。ClawHub 啟動驗證器要求確切且受信任的 `main` 工作流程路徑與 SHA、產生端與終止端的執行嘗試次數、發布 SHA、要求的套件集合、不可變的套件成品元組，以及終止端登錄檔回讀成品；不接受成功但屬於舊式發布參照的執行。

   接著，針對已發布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 套件執行發布後套件驗收。如果已推送或已發布的預發布版本需要修正，請建立下一個相符的預發布編號；絕不要刪除或重寫舊版本。

10. 對於穩定版，只有在經審核的 beta 或發布候選版本具備必要驗證證據後才可繼續。穩定版 npm 發布也會透過 `OpenClaw Release Publish` 進行，並以 `preflight_run_id` 重複使用成功的預檢成品。穩定版 macOS 發布就緒還要求 `main` 上已有封裝完成的 `.zip`、`.dmg`、`.dSYM.zip` 及更新後的 `appcast.xml`；macOS 發布工作流程會在驗證發布成品後，自動將已簽署的 appcast 發布至公開的 `main`，若分支保護阻止直接推送，則會建立或更新 appcast PR。穩定版 Windows Hub 就緒要求 OpenClaw GitHub 發布上已有已簽署的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 和 `OpenClawCompanion-SHA256SUMS.txt` 成品。將已簽署的 `openclaw/openclaw-windows-node` 確切發布標籤傳入 `windows_node_tag`，並將候選版本已核准的安裝程式摘要對應表傳入 `windows_node_installer_digests`；`OpenClaw Release Publish` 會保留發布草稿、派送 `Windows Node Release`，並在發布前驗證全部三個成品。
11. 發布後，執行 npm 發布後驗證器；若需要發布後頻道證明，可選擇執行獨立的已發布 npm Telegram 端對端測試；必要時推進 dist-tag、驗證產生的 GitHub 發布頁面、執行發布公告步驟，然後完成[穩定版 main 收尾](#stable-main-closeout)，之後才能宣告穩定版發布完成。

## 穩定版 main 收尾

在 `main` 包含實際已發布的版本狀態之前，穩定版發布尚未完成。

1. 從全新且最新的 `main` 開始。對照稽核 `release/YYYY.M.PATCH`，並將 `main` 中缺少的實際修正向前移植。不要盲目地將僅供發布使用的相容性、測試或驗證配接器合併至較新的 `main`。
2. 將 `main` 設為已發布的穩定版本，而非推測性的下一個發布系列。變更根版本後執行 `pnpm release:prep`，接著執行 `pnpm deps:shrinkwrap:generate`。
3. 讓 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 章節與已加標籤的發布分支完全一致。若 Mac 發布已發布 `appcast.xml`，也要納入該穩定版更新。
4. 在操作人員明確啟動該發布系列前，不要將 `YYYY.M.PATCH+1`、beta 版本或空白的未來變更記錄章節加入 `main`。
5. 執行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送後，確認 `origin/main` 包含已發布版本及變更記錄，才能宣告穩定版發布完成。
6. 每次進行私有回復演練後，持續更新儲存庫變數 `RELEASE_ROLLBACK_DRILL_ID` 和 `RELEASE_ROLLBACK_DRILL_DATE`。

`OpenClaw Stable Main Closeout` 會從穩定版發布後包含已發布版本、變更記錄和 appcast 的 `main` 推送開始。它會讀取不可變的發布後證據，將已發布標籤繫結至其完整發布驗證與發布執行，接著驗證穩定版 main 狀態、發布、必要的穩定版觀察期，以及具阻擋性的效能證據。它會將不可變的收尾資訊清單及總和檢查碼附加至 GitHub 發布。自動推送觸發器會略過早於不可變發布後證據的舊式發布，且絕不將該略過視為已完成收尾。

完整收尾同時要求兩項成品及相符的總和檢查碼。不完整的資訊清單會重播其中記錄的 `main` SHA 和回復演練，以重新產生完全相同的位元組，然後附加缺少的總和檢查碼；無效的配對或只有總和檢查碼而沒有資訊清單，仍會保持阻擋狀態。由推送觸發且缺少回復演練儲存庫變數的執行會略過，且不會完成收尾；缺少或超過 90 天的演練記錄，仍會阻擋手動且以證據為基礎的收尾。私有復原命令仍保留在僅限維護者使用的操作手冊中。只有在修復或重播以證據為基礎的穩定版收尾時，才使用手動派送。

只有當舊式備援修正標籤解析至與基礎穩定版標籤相同的來源提交時，才可重複使用基礎套件證據。其 Android 發布會重複使用基礎標籤已驗證的 APK，並加入修正標籤的來源證明。若修正版本使用不同來源，則必須發布並驗證自己的套件證據，且使用更高的 Android `versionCode`。

## 發布預檢

- 在發布預檢之前執行 `pnpm check:test-types`，以確保測試用 TypeScript 在較快速的本機 `pnpm check` 閘門之外仍受到涵蓋。
- 在發布預檢之前執行 `pnpm check:architecture`，以確保更廣泛的匯入循環與架構邊界檢查在較快速的本機閘門之外皆通過。
- 在 `pnpm release:check` 之前執行 `pnpm build && pnpm ui:build`，以確保套件驗證步驟所需的 `dist/*` 發布成品與控制介面套件組合均已存在。
- 在根版本提升之後、加上標籤之前執行 `pnpm release:prep`。它會執行所有在版本、設定或 API 變更後經常產生偏差的確定性發布產生器：外掛版本、npm shrinkwrap、外掛清單、基礎設定結構描述、內建頻道設定中繼資料、設定文件基準、外掛 SDK 匯出項目，以及外掛 SDK API 基準。`pnpm release:check` 會以檢查模式重新執行這些防護檢查（另加外掛 SDK 介面預算檢查），並在執行套件發布檢查之前，一次回報所有產生內容偏差的失敗項目。
- 外掛版本同步預設會將可發布的 `@openclaw/ai` 執行階段套件、官方外掛套件版本，以及現有的 `openclaw.compat.pluginApi` 最低版本更新為 OpenClaw 發布版本。請將該欄位視為外掛 SDK／執行階段 API 的最低版本，而不只是套件版本的副本：對於刻意維持與較舊 OpenClaw 主機相容的純外掛發布，請將最低版本保留為最舊的受支援主機 API，並在外掛發布證明中記錄此選擇。
- 在核准發布之前，執行手動 `Full Release Validation` 工作流程，以從單一入口點啟動所有發布前測試環境。它接受分支、標籤或完整提交 SHA，並分派手動 `CI`，以及分派 `OpenClaw Release Checks` 來執行安裝冒煙測試、套件驗收、跨作業系統套件檢查、QA Lab 一致性、Matrix 與 Telegram 執行路徑。穩定版與完整執行一律包含詳盡的即時／端對端測試及 Docker 發布路徑持續測試；保留 `run_release_soak=true` 以明確執行 beta 持續測試。套件驗收會在候選版本驗證期間提供標準的套件 Telegram 端對端測試，避免同時執行第二個即時輪詢器。

  發布 beta 後提供 `release_package_spec`，即可在發布檢查、套件驗收與套件 Telegram 端對端測試中重複使用已發布的 npm 套件，而不必重新建置發布 tarball。僅在 Telegram 應使用與其餘發布驗證不同的已發布套件時，才提供 `npm_telegram_package_spec`。當套件驗收應使用與發布套件規格不同的已發布套件時，提供 `package_acceptance_package_spec`。當發布證據報告應證明驗證結果與已發布的 npm 套件相符、但不強制執行 Telegram 端對端測試時，提供 `evidence_package_spec`。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- 若要在發布工作持續進行時取得套件候選版本的旁路證明，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或確切發布版本使用 `source=npm`；使用 `source=ref`，以目前的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支、標籤或 SHA；對具備必要 SHA-256 與嚴格公開 URL 政策的公開 HTTPS tarball 使用 `source=url`；對使用必要 `trusted_source_id` 與 SHA-256 的具名受信任來源政策使用 `source=trusted-url`；或對由另一個 GitHub Actions 執行所上傳的 tarball 使用 `source=artifact`。

  此工作流程會將候選版本解析為 `package-under-test`，針對該 tarball 重複使用 Docker 端對端發布排程器，並可透過 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`，針對相同 tarball 執行 Telegram QA。當選取的 Docker 執行路徑包含 `published-upgrade-survivor` 時，套件成品即為候選版本，而 `published_upgrade_survivor_baseline` 則選取已發布的基準版本。`update-restart-auth` 會同時將候選套件用作已安裝的命令列介面與受測套件，以便測試候選版本更新命令的受管理重新啟動路徑。

  範例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常用設定檔：
  - `smoke`：安裝／頻道／代理程式、閘道網路與設定重新載入執行路徑
  - `package`：不含 OpenWebUI 或即時 ClawHub、以成品為準的套件／更新／重新啟動／外掛執行路徑
  - `product`：套件設定檔，加上 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發布路徑區塊
  - `custom`：精確選取 `docker_lanes`，以進行聚焦的重新執行

- 僅需要對發布候選版本進行確定性的正常 CI 涵蓋時，請直接執行手動 `CI` 工作流程。手動 CI 分派會略過變更範圍限制，並強制執行 Linux Node 分片、內建外掛分片、外掛與頻道契約分片、Node 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS 與控制介面國際化執行路徑。獨立手動 CI 執行只有在以 `include_android=true` 分派時才會執行 Android；`Full Release Validation` 會將此輸入傳遞給其 CI 子工作流程。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 驗證發布遙測時，執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器執行 QA-lab，並驗證追蹤、指標與日誌匯出，以及受限的追蹤屬性和內容／識別碼遮蔽，而不需要 Opik、Langfuse 或其他外部收集器。
- 驗證收集器相容性時，執行 `pnpm qa:otel:collector-smoke`。它會先將相同的 QA-lab OTLP 匯出導向真正的 OpenTelemetry Collector Docker 容器，再執行本機接收器斷言。
- 驗證受保護的 Prometheus 抓取時，執行 `pnpm qa:prometheus:smoke`。它會執行 QA-lab、拒絕未驗證身分的抓取，並驗證發布關鍵指標系列不含提示詞內容、原始識別碼、驗證權杖與本機路徑。
- 執行 `pnpm qa:observability:smoke`，以依序執行原始碼簽出版本的 OpenTelemetry 與 Prometheus 冒煙測試路徑。
- 每次加上標籤發布前，都要執行 `pnpm release:check`。
- `OpenClaw NPM Release` 預檢會在封裝 npm tarball 前產生依賴項發布證據。npm 公告漏洞閘門會阻擋發布。遞移資訊清單風險、依賴項擁有權／安裝介面，以及依賴項變更報告僅作為發布證據。依賴項變更報告會比較發布候選版本與前一個可到達的發布標籤。預檢會將依賴項證據上傳為 `openclaw-release-dependency-evidence-<tag>`，並將其嵌入準備好的 npm 預檢成品內的 `dependency-evidence/`。實際發布路徑會重複使用該預檢成品，然後將相同證據以 `openclaw-<version>-dependency-evidence.zip` 附加至 GitHub 發布。
- 標籤存在後，執行 `OpenClaw Release Publish` 以進行會產生變更的發布序列。從受信任的 `main` 分派一般 beta 與穩定版發布；發布標籤仍會選取確切的目標提交，且可指向 `release/YYYY.M.PATCH`。Tideclaw alpha 發布仍維持在其對應的 alpha 分支上。傳入成功的 OpenClaw npm `preflight_run_id`、成功的 `full_release_validation_run_id`，以及確切的 `full_release_validation_run_attempt`；除非刻意執行聚焦修復，否則請保留預設的外掛發布範圍 `all-publishable`。此工作流程會依序執行外掛 npm 發布、外掛 ClawHub 發布與 OpenClaw npm 發布，確保核心套件不會早於其外部化外掛發布；Windows 與 Android 推廣會針對草稿發布頁面，與核心 npm 發布同時執行。發布重新執行可接續進度：若核心 npm 版本已發布，工作流程在證明登錄檔 tarball 與標籤的預檢成品相符後，會略過核心分派；若發布已包含經驗證的資產契約，也會略過 Windows／Android 推廣，因此重試只會重新執行失敗階段。聚焦的純外掛修復必須使用 `plugin_publish_scope=selected`，並提供非空白的外掛清單。純外掛的 `all-publishable` 執行需要完整且不可變的預檢與完整發布驗證證據；不接受不完整的證據。
- 穩定版 `OpenClaw Release Publish` 要求提供確切的 `windows_node_tag`，且對應的非預發行 `openclaw/openclaw-windows-node` 發布必須已存在，另須提供候選版本核准的 `windows_node_installer_digests` 對應表。在分派任何發布子工作流程之前，它會驗證來源發布已發布、不是預發行版本、包含必要的 x64／ARM64 安裝程式，且仍與核准的對應表相符。接著，它會在 OpenClaw 發布仍為草稿時分派 `Windows Node Release`，並原封不動地攜帶已固定的安裝程式摘要對應表。子工作流程會從該確切標籤下載已簽署的 Windows Hub 安裝程式，將其與固定的摘要比對，在 Windows 執行器上驗證其 Authenticode 簽章使用預期的 OpenClaw Foundation 簽署者、寫入 SHA-256 資訊清單，並將安裝程式與資訊清單上傳至標準 OpenClaw GitHub 發布；之後再重新下載已推廣的資產，驗證其包含於資訊清單中且雜湊相符。父工作流程會在發布前驗證目前的 x64、ARM64 與總和檢查碼資產契約。直接復原會先拒絕未預期的 `OpenClawCompanion-*` 資產名稱，再以固定的來源位元組取代預期的契約資產。

  僅在復原時手動分派 `Windows Node Release`，且一律傳入確切標籤，絕不可使用 `latest`，並提供來自已核准來源發布的明確 `expected_installer_digests` JSON 對應表。網站下載連結應指向目前穩定版發布的確切 OpenClaw 發布資產 URL；或僅在確認 GitHub 的 latest 重新導向指向相同發布後，才使用 `releases/latest/download/...`；請勿僅連結至伴隨元件儲存庫的發布頁面。

- 發行檢查現在於獨立的手動工作流程 `OpenClaw Release Checks` 中執行。在核准發行前，它也會執行 QA Lab 模擬同等性執行道、快速即時 Matrix 設定檔，以及 Telegram QA 執行道。即時執行道使用 `qa-live-shared` 環境；Telegram 還會使用 Convex CI 憑證租約。若要平行執行完整的 Matrix 傳輸、媒體與 E2EE 清單，請手動執行 `QA-Lab - All Lanes` 工作流程，並設定 `matrix_profile=all` 與 `matrix_shards=true`。
- 跨作業系統安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，兩者會直接呼叫可重複使用的工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。此拆分是刻意設計的：讓實際 npm 發行路徑保持簡短、確定且聚焦於成品，而較慢的即時檢查則留在自己的執行道中，以免拖慢或阻擋發布。
- 含有機密資料的發行檢查應透過 `Full Release Validation` 分派，或從 `main`／發行工作流程參照分派，確保工作流程邏輯與機密資料受到控管。
- `OpenClaw Release Checks` 接受分支、標籤或完整提交 SHA，前提是解析出的提交可從 OpenClaw 分支或發行標籤觸及。
- `OpenClaw NPM Release` 的僅驗證預檢也接受目前完整的 40 字元工作流程分支提交 SHA，不要求已推送標籤。此 SHA 路徑僅供驗證，不能提升為實際發布。在 SHA 模式下，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；實際發布仍需要真正的發行標籤。
- 這兩個工作流程都讓實際發布與提升路徑在 GitHub 託管的執行器上執行，而不會修改狀態的驗證路徑則可使用較大型的 Blacksmith Linux 執行器。
- 該工作流程會使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` 工作流程機密資料來執行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`。
- npm 發行預檢不再等待獨立的發行檢查執行道。
- 在本機為候選版本加上標籤前，請執行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。此輔助程式會依序執行快速發行防護檢查、外掛 npm／ClawHub 發行檢查、建置、UI 建置與 `release:openclaw:npm:check`，以便在 GitHub 發布工作流程啟動前，發現常見且會阻擋核准的錯誤。
- 核准前，請執行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或相應的預發行／修正版標籤）。
- npm 發布後，請執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或相應的 beta／修正版版本），以在全新的暫存前綴中驗證已發布的登錄庫安裝路徑。
- beta 發布後，請執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共用的租用 Telegram 憑證集區，針對已發布的 npm 套件驗證已安裝套件的初始設定、Telegram 設定及真正的 Telegram 端對端測試。本機維護者的單次執行可省略 Convex 變數，改為直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` 環境憑證。
- 若要從維護者電腦執行完整的發布後 beta 冒煙測試，請使用 `pnpm release:beta-smoke -- --beta betaN`。此輔助程式會執行 Parallels npm 更新／全新目標驗證、分派 `NPM Telegram Beta E2E`、輪詢確切的工作流程執行、下載成品，並輸出 Telegram 報告。
- 維護者可透過手動 `NPM Telegram Beta E2E` 工作流程，在 GitHub Actions 執行相同的發布後檢查。此工作流程刻意僅允許手動執行，不會在每次合併時執行。
- 維護者發行自動化採用先預檢、再提升的流程：
  - 實際 npm 發布必須通過成功的 npm `preflight_run_id`。
  - 一般 beta 與穩定版發布的協調流程和預檢，會針對確切的目標標籤使用受信任的 `main`。Tideclaw alpha 發布與預檢則使用相應的 alpha 分支。
  - 穩定版 npm 發行預設使用 `beta`；穩定版 npm 發布可透過工作流程輸入明確指定 `latest`。
  - 使用權杖的 npm dist-tag 修改位於 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而原始碼存放庫維持僅使用 OIDC 發布。
  - 公開的 `macOS Release` 僅供驗證；若標籤只存在於發行分支，但工作流程是從 `main` 分派，請設定 `public_release_branch=release/YYYY.M.PATCH`。
  - 實際 macOS 發布必須通過成功的 macOS `preflight_run_id` 與 `validate_run_id`。
  - 實際發布路徑會提升已準備好的成品，而不會再次重新建置。
- 對於 `YYYY.M.PATCH-N` 這類穩定版修正發行，發布後驗證器也會檢查同一個暫存前綴中從 `YYYY.M.PATCH` 升級至 `YYYY.M.PATCH-N` 的路徑，確保發行修正不會在無聲無息間讓較舊的全域安裝仍停留在基礎穩定版內容。
- 除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` 內容，否則 npm 發行預檢會採取失敗即關閉策略，避免再次發布空白的瀏覽器儀表板。
- 發布後驗證也會檢查已發布外掛的進入點與套件中繼資料是否存在於已安裝的登錄庫配置中。若發行缺少外掛執行階段內容，發布後驗證器便會失敗，且該版本無法提升為 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack 的 `unpackedSize` 預算，因此安裝程式端對端測試可在發行發布路徑執行前，發現意外的封裝膨脹。
- 若發行工作涉及 CI 規劃、擴充功能計時資訊清單或擴充功能測試矩陣，請在核准前重新產生並檢閱 `.github/workflows/plugin-prerelease.yml` 中由規劃器擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，以免發行說明描述過時的 CI 配置。
- 穩定版 macOS 發行就緒狀態也包含更新程式介面：GitHub 發行最終必須包含封裝好的 `.zip`、`.dmg` 與 `.dSYM.zip`；發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip（macOS 發布工作流程會自動提交，若直接推送遭阻擋則會開啟 appcast PR）；封裝的應用程式必須維持非偵錯套件識別碼、非空的 Sparkle 摘要 URL，以及不低於該發行版本標準 Sparkle 建置下限的 `CFBundleVersion`。

## 發行測試機

`Full Release Validation` 是操作人員從單一進入點啟動所有發行前測試的方式。若要在快速變動的分支上提供固定提交的證明，請使用輔助程式，讓每個子工作流程都從固定於單一受信任 `main` 工作流程 SHA 的暫存分支執行，同時讓要求的提交維持為受測候選版本：

```bash
pnpm ci:full-release --sha <full-sha>
```

此輔助程式會擷取目前的 `origin/main`、將受信任的工作流程提交推送至 `release-ci/<workflow-sha>-...`、從暫存分支分派 `Full Release Validation` 並設定 `ref=<target-sha>`、在可用時重複使用嚴格且精確符合目標的證據、驗證每個子工作流程的 `headSha` 都符合固定的父工作流程 SHA，然後刪除暫存分支。傳入 `-f reuse_evidence=false` 可強制重新執行，或傳入 `--workflow-sha <trusted-main-sha>` 以固定仍可從目前 `origin/main` 觸及的較舊提交。工作流程本身絕不寫入存放庫參照。如此可持續使用僅限 `main` 的發行工具，而不必將工具提交加入候選版本，並避免意外地以較新的 `main` 子執行作為證明。

若要驗證發行分支或標籤，請從受信任的 `main` 工作流程參照執行，並將發行分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

工作流程會解析目標參照、使用 `target_ref=<release-ref>` 分派手動 `CI`，接著分派 `OpenClaw Release Checks`。`OpenClaw Release Checks` 會展開執行安裝冒煙測試、跨作業系統發行檢查、啟用長時間測試時的即時／端對端 Docker 發行路徑涵蓋、包含標準 Telegram 套件端對端測試的套件驗收、QA Lab 同等性、即時 Matrix 與即時 Telegram。只有在 `Full Release Validation` 摘要顯示 `normal_ci`、`plugin_prerelease` 與 `release_checks` 均成功時，完整／全部執行才可接受；但刻意略過獨立 `Plugin Prerelease` 子工作的聚焦重新執行不在此限。只有在使用 `release_package_spec` 或 `npm_telegram_package_spec` 聚焦重新執行已發布套件時，才使用獨立的 `npm-telegram` 子工作。最終驗證器摘要會包含每個子執行中最慢工作的表格，讓發行管理員無須下載記錄檔即可查看目前的關鍵路徑。

在此發行路徑中，產品效能子工作僅產生成品。此統括工作流程會以
`publish_reports=false` 分派該子工作；除非僅成品防護檢查能證明 Clawgrit
報告發布器保持略過狀態，否則驗證會遭拒絕。

如需完整的階段矩陣、確切的工作流程工作名稱、穩定版與完整設定檔差異、成品，以及聚焦重新執行控制項，請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)。

子工作流程會從執行 `Full Release Validation` 的受信任參照分派，通常是 `--ref main`，即使目標 `ref` 指向較舊的發行分支或標籤亦然。每個子執行都必須使用確切的父工作流程 SHA；若 `main` 在子工作分派解析前已有進展，統括工作流程會採取失敗即關閉策略。沒有獨立的 Full Release Validation 工作流程參照輸入；請透過選擇工作流程執行參照來選擇受信任的測試框架。請勿使用 `--ref main -f ref=<sha>` 為持續變動的 `main` 提供精確提交證明；原始提交 SHA 無法作為工作流程分派參照，因此請使用 `pnpm ci:full-release --sha <target-sha>`，在受信任的 `origin/main` 建立暫存分支，同時將目標 SHA 保留為候選輸入。

使用 `release_profile` 選擇即時／供應商涵蓋範圍：

- `minimum`：最快的發行關鍵 OpenAI／核心即時與 Docker 路徑
- `stable`：最低範圍加上發行核准所需的穩定供應商／後端涵蓋
- `full`：穩定範圍加上廣泛的建議性供應商／媒體涵蓋

穩定版與完整驗證在提升前，一律會執行詳盡的即時／端對端測試、Docker 發行路徑，以及有界限的已發布升級存續掃描。使用 `run_release_soak=true` 可要求 beta 也執行相同掃描。該掃描涵蓋最新四個穩定版套件、固定的 `2026.4.23` 與 `2026.5.2` 基準，以及更舊的 `2026.4.15` 涵蓋範圍；重複的基準會移除，且每個基準會分片至各自的 Docker 執行器工作。

`OpenClaw Release Checks` 會使用受信任的工作流程參照，將目標參照解析一次為 `release-package-under-test`，並在執行長時間測試時，於跨作業系統、套件驗收與發行路徑 Docker 檢查中重複使用該成品。如此可讓所有面向套件的測試機使用完全相同的位元組，並避免重複建置套件。beta 已發布至 npm 後，請設定 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，讓發行檢查只下載一次已發布套件、從 `dist/build-info.json` 擷取其建置來源 SHA，並在跨作業系統、套件驗收、發行路徑 Docker 與套件 Telegram 執行道中重複使用該成品。

跨作業系統 OpenAI 安裝冒煙測試會在已設定存放庫／組織變數時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.6-luna`，因為此執行道要證明的是套件安裝、初始設定、閘道啟動與一次即時代理程式執行，而非評測最強大的模型。較廣泛的即時供應商矩陣仍是模型特定涵蓋的所在。

請依發行階段使用以下變體：

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

在進行針對性修正後，第一次重新執行時不要使用完整的總括工作流程。如果某個執行環境失敗，下一次驗證應使用失敗的子工作流程、作業、Docker 執行路徑、套件設定檔、模型供應商或 QA 執行路徑。只有當修正變更了共用的發布協調流程，或使先前所有執行環境的證據過時時，才再次執行完整的總括工作流程。總括工作流程的最終驗證器會重新檢查已記錄的子工作流程執行 ID，因此成功重新執行子工作流程後，只需重新執行失敗的 `Verify full validation` 父作業。

只有在先前成功的總括工作流程執行驗證了完全相同的目標 SHA、發布設定檔、實際浸泡測試設定及驗證輸入時，`rerun_group=all` 才能重複使用該執行。這是為重新執行同一候選版本提供的有限復原機制，而不是跨 SHA 重複使用證據。若候選版本有變更，包括僅修改變更記錄或版本的提交，請重新執行所有受變更路徑或成品雜湊影響的套件、成品、安裝、Docker 或供應商關卡。對於相同的 `release/*` 參照與重新執行群組，較新的總括工作流程執行會自動取代仍在進行中的執行。傳入 `reuse_evidence=false` 可強制進行全新的完整執行。

若要進行有限復原，請將 `rerun_group` 傳給總括工作流程。`all` 是真正的候選發布版本執行，`ci` 只執行一般 CI 子工作流程，`plugin-prerelease` 只執行發布專用的外掛子工作流程，`release-checks` 執行所有發布執行環境，而範圍更窄的發布群組包括 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。針對性重新執行 `npm-telegram` 時必須提供 `release_package_spec` 或 `npm_telegram_package_spec`；完整或 `all` 執行會使用 Package Acceptance 內的標準套件 Telegram E2E。針對性跨作業系統重新執行可新增 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統／測試套件篩選器。QA 發布檢查失敗會阻擋一般發布驗證，包括標準層級中必要的 OpenClaw 動態工具漂移檢查。Tideclaw alpha 執行仍可將不涉及套件安全性的發布檢查執行路徑視為建議性檢查。使用 `release_profile=beta` 時，`Run repo/live E2E validation` 的即時供應商測試套件屬於建議性檢查（僅產生警告，不會阻擋）；stable 與 full 設定檔仍會將其視為阻擋性檢查。當 `live_suite_filter` 明確要求受控管的 QA 即時執行路徑（例如 Discord、WhatsApp 或 Slack）時，必須啟用對應的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` 儲存庫變數；否則輸入擷取會失敗，而不是默默略過該執行路徑。

### Vitest

Vitest 執行環境是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍限制，並強制對候選發布版本執行一般測試圖：Linux 節點分片、內建外掛分片、外掛與頻道契約分片、節點 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python Skills、Windows、macOS，以及 Control UI 國際化。當 `Full Release Validation` 執行此環境時，因總括工作流程會傳入 `include_android=true`，因此包含 Android；獨立手動 CI 必須設定 `include_android=true` 才會涵蓋 Android。

使用此執行環境回答「原始碼樹是否通過完整的一般測試套件？」這與發布路徑的產品驗證不同。應保留的證據：

- 顯示已派送 `CI` 執行 URL 的 `Full Release Validation` 摘要
- 完全相同目標 SHA 上成功的 `CI` 執行
- 調查迴歸問題時，CI 作業中失敗或緩慢的分片名稱
- 執行需要效能分析時所用的 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發布需要可重現的一般 CI，但不需要 Docker、QA Lab、即時、跨作業系統或套件執行環境時，才直接執行手動 CI。非 Android 的直接 CI 請使用第一個命令。當直接執行的候選發布版本 CI 必須涵蓋 Android 時，請新增 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 執行環境位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml` 執行，並包含發布模式的 `install-smoke` 工作流程。它會透過封裝後的 Docker 環境驗證候選發布版本，而不只執行原始碼層級的測試。

發布 Docker 涵蓋範圍包括：

- 完整安裝冒煙測試，並啟用較慢的 Bun 全域安裝冒煙測試
- 依目標 SHA 準備／重複使用根 Dockerfile 冒煙測試映像，QR、根目錄／閘道及安裝程式／Bun 冒煙作業會作為獨立的 install-smoke 分片執行
- 儲存庫 E2E 執行路徑
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 至 `plugins-runtime-install-h`，以及 `openwebui`
- 在要求時，於專用的大容量磁碟執行器上執行 OpenWebUI 涵蓋測試
- 分拆的內建外掛安裝／解除安裝執行路徑：`bundled-plugin-install-uninstall-0` 至 `bundled-plugin-install-uninstall-23`
- 發布檢查包含即時測試套件時，執行即時／E2E 供應商測試套件與 Docker 即時模型涵蓋測試

重新執行前請先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含執行路徑記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON 及重新執行命令。若要進行針對性復原，請在可重複使用的即時／E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有發布區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 與已準備的 Docker 映像輸入，因此失敗的執行路徑可重複使用同一個 tarball 與 GHCR 映像。

### QA Lab

QA Lab 執行環境也是 `OpenClaw Release Checks` 的一部分。它是代理式行為與頻道層級的發布關卡，與 Vitest 和 Docker 套件機制分開。

發布 QA Lab 涵蓋範圍包括：

- 使用代理式同等性測試包，比較 OpenAI 候選執行路徑與 `anthropic/claude-opus-4-8` 基準的模擬同等性執行路徑
- 使用 `qa-live-shared` 環境的快速即時 Matrix QA 設定檔
- 使用 Convex CI 憑證租約的即時 Telegram QA 執行路徑
- 發布遙測需要明確的本機驗證時，執行 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此執行環境回答「此版本在 QA 情境與即時頻道流程中的行為是否正確？」核准發布時，請保留同等性、Matrix 與 Telegram 執行路徑的成品 URL。完整 Matrix 涵蓋測試仍可透過手動分片 QA-Lab 執行使用，而不是作為預設的發布關鍵執行路徑。

### 套件

套件執行環境是可安裝產品的關卡。其基礎為 `Package Acceptance` 與解析器 `scripts/resolve-openclaw-package-candidate.mjs`。解析器會將候選項目標準化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件內容清單、記錄套件版本與 SHA-256，並讓工作流程工具框架參照與套件來源參照彼此分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest` 或確切的 OpenClaw 發布版本
- `source=ref`：使用所選的 `workflow_ref` 工具框架，封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載公開的 HTTPS `.tgz`，並要求提供 `package_sha256`；URL 憑證、非預設 HTTPS 連接埠、私人／內部／特殊用途主機名稱或解析後的位址，以及不安全的重新導向都會遭到拒絕
- `source=trusted-url`：使用必要的 `package_sha256` 與 `.github/package-trusted-sources.json` 中具名原則的 `trusted_source_id`，下載 HTTPS `.tgz`；對於維護者擁有的企業鏡像或私人套件儲存庫，請使用此來源，而不要在 `source=url` 新增輸入層級的私人網路繞過機制
- `source=artifact`：重複使用由其他 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape` 與 `telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對同一個已解析 tarball 保留遷移、更新、根目錄管理的 VPS 升級、已設定驗證資訊的更新重啟、即時 ClawHub Skills 安裝、過時外掛相依性清理、離線外掛測試資料、外掛更新、外掛命令繫結逸出強化，以及 Telegram 套件 QA。阻擋性發布檢查預設使用最新已發布套件作為基準；設定 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 設定檔，會將已發布升級存續測試擴展至 `last-stable-4`，並加入固定的 `2026.4.23`、`2026.5.2` 與 `2026.4.15` 基準及 `reported-issues` 情境。對於已發布的候選版本，請使用 `source=npm` 執行 Package Acceptance；對於發布前由 SHA 支援的本機 npm tarball，使用 `source=ref`；對於維護者擁有的企業／私人鏡像，使用 `source=trusted-url`；對於由其他 GitHub Actions 執行上傳的已準備 tarball，使用 `source=artifact`。

這是 GitHub 原生的替代方案，可取代先前需要 Parallels 才能完成的大部分套件／更新涵蓋測試。跨作業系統發布檢查對於作業系統特定的初始設定、安裝程式及平台行為仍然重要，但套件／更新產品驗證應優先使用 Package Acceptance。

更新與外掛驗證的標準檢查清單是[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。判斷哪個本機、Docker、Package Acceptance 或發布檢查執行路徑能證明外掛安裝／更新、doctor 清理或已發布套件遷移變更時，請使用此清單。針對每個穩定版 `2026.4.23+` 套件進行的完整已發布更新遷移，是獨立的手動 `Update Migration` 工作流程，不屬於 Full Release CI。

舊版套件驗收的寬容機制刻意設有時間限制。截至 `2026.4.25` 的套件，可針對已發布至 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少私人 QA 內容清單項目、缺少 `gateway install --wrapper`、由 tarball 衍生的 git 測試資料中缺少修補檔、缺少持久化的 `update.channel`、舊版外掛安裝記錄位置、缺少市集安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件可針對已隨版本交付的本機建置中繼資料戳記檔案發出警告。之後的套件必須符合現代套件契約；相同的缺口會導致發布驗證失敗。

當發布問題涉及實際可安裝的套件時，請使用範圍更廣的 Package Acceptance 設定檔：

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

- `smoke`：快速套件安裝／頻道／代理程式、閘道網路及設定重新載入通道
- `package`：安裝／更新／重新啟動／外掛套件合約，加上即時 ClawHub Skills 安裝證明；這是發行檢查的預設值
- `product`：`package` 加上 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋及 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：用於聚焦重新執行的確切 `docker_lanes` 清單

若要進行候選套件的 Telegram 證明，請在套件驗收中啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。此工作流程會將解析後的 `package-under-test` tarball 傳入 Telegram 通道；獨立的 Telegram 工作流程仍接受已發布的 npm 規格，以進行發布後檢查。

## 一般發行發布自動化

對於 beta、`latest`、外掛、GitHub Release 及平台發布，`OpenClaw Release Publish` 是一般的變更型進入點。每月 `.33+`、僅限 npm 的延伸穩定版路徑不使用此協調器。一般工作流程會依發行所需的順序協調受信任發布者工作流程：

1. 簽出發行標籤並解析其提交 SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 到達（若為 alpha 預發行版，也可從 Tideclaw alpha 分支到達）。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 及 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同範圍與 SHA 分派 `Plugin ClawHub Release`。
6. 驗證已儲存的 `full_release_validation_run_id` 與確切執行嘗試次數後，使用發行標籤、npm dist-tag 及已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。
7. 對於穩定版發行，以草稿形式建立或更新 GitHub 發行版本，使用明確的 `windows_node_tag` 及候選版本已核准的 `windows_node_installer_digests` 分派 `Windows Node Release`，並驗證標準 Windows 安裝程式／總和檢查碼資產。同時分派 `Android Release`，以建置確切標籤的已簽署 APK，以及總和檢查碼與來源證明。發布草稿前，請驗證這兩項原生資產合約。

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

僅在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 與 `Plugin ClawHub Release` 工作流程。當 `publish_openclaw_npm=true` 時，`OpenClaw Release Publish` 會拒絕 `plugin_publish_scope=selected`，因此核心套件無法在未包含每個可發布官方外掛（包括 `@openclaw/diffs-language-pack`）的情況下發布。若要修復所選外掛，請設定 `publish_openclaw_npm=false`、`plugin_publish_scope=selected` 及 `plugins=@openclaw/name`，或直接分派子工作流程。

首次發布的 ClawHub 啟動程序屬於例外：請從受信任的 `main` 分派 `Plugin ClawHub New`，並透過 `ref` 傳入完整的目標發行 SHA。絕不可從發行標籤或分支本身執行啟動工作流程：

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

標籤前驗證要求 `dry_run=true`、拒絕發行標籤及父執行輸入，且僅接受可從 `main` 或 `release/*` 到達的確切目標。它不會載入 ClawHub 認證、發布套件位元組，或變更受信任發布者設定。此工作流程仍會解析即時登錄計畫，僅在無機密資訊的工作中簽出並封裝目標，具現化鎖定的 ClawHub 工具鏈，並在發行標籤存在前驗證不可變資產及套件 slug／身分。只有在無機密資訊的封裝工作完成後，才核准 `clawhub-plugin-bootstrap` 環境；這項受保護的驗證工作不具任何認證或變更命令。

已核准的試執行或加上標籤後的實際啟動程序，必須包含確切的發行標籤，以及父層 `OpenClaw Release Publish` 的執行 ID、嘗試次數及分支。父層會證明自身的工作流程 SHA，以及用於 `Plugin ClawHub New` 的另一個確切受信任 `main` SHA；子執行及每項受保護環境核准都必須符合該已核准的子層 SHA。每次發布嘗試及受信任發布者變更前，都會重新檢查發行標籤。

封裝工作會上傳一項不可變資產，其名稱、Actions 資產 ID／摘要、產生者執行／嘗試次數、目標 SHA，以及各套件 tarball 的 SHA-256／大小，都會傳遞至驗證與受保護工作。受保護工作僅簽出受信任的 `main` 工具，透過 GitHub API 驗證資產組合，依確切資產 ID 下載、重新雜湊每個 tarball，並依固定版本命令列介面的 USTAR 標準化規則驗證本機 TAR 路徑及套件身分。接著，每個候選版本都會通過固定版本命令列介面的發布試執行，而該試執行會在登錄查詢或驗證前傳回。認證工作的預先篩選器將壓縮後的 ClawPack 上限設為 120 MiB、檔案承載總量上限設為 50 MiB、展開後的 TAR 資料上限設為 64 MiB，並將 TAR 項目數上限設為 10,000。既有套件的受信任發布者修復仍僅限設定，但仍會封裝目標，且在變更受信任發布者設定前，要求所請求的標籤與確切登錄位元組及中繼資料完全相等。發布後驗證會下載 ClawHub 資產，並要求相同的 SHA-256 與大小。只有在確切的產生者工作成功完成時，重新執行失敗工作的復原程序才可重用先前嘗試的套件資產。最終證據也會綁定鎖定的 ClawHub 版本、鎖定檔 SHA-256 及 npm 完整性資訊。若不相符，則必須使用新的套件版本。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受下列由操作人員控制的輸入：

- `tag`：必要的發行標籤，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；當 `preflight_only=true` 時，也可以是目前完整的 40 字元工作流程分支提交 SHA，僅用於驗證預檢
- `preflight_only`：僅執行驗證／建置／封裝時設為 `true`，實際發布路徑設為 `false`
- `preflight_run_id`：既有且成功的預檢執行 ID；實際發布路徑必須提供，使工作流程重用已準備的 tarball，而不是重新建置
- `full_release_validation_run_id`：此標籤／SHA 的成功 `Full Release Validation` 執行 ID，實際發布時必須提供。Beta 發布可僅憑預檢並顯示警告後繼續，但穩定版／`latest` 提升仍需要此項。
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數執行嘗試次數；只要提供執行 ID 就必須提供此項，以免重新執行在發布期間變更授權證據。
- `release_publish_run_id`：已核准的 `OpenClaw Release Publish` 執行 ID；當此工作流程由該父層分派時（機器人執行者的實際發布呼叫），必須提供
- `plugin_npm_run_id`：成功且完全符合目前提交的 `Plugin NPM Release` 執行 ID；實際發布 `extended-stable` 核心時必須提供
- `npm_dist_tag`：發布路徑的 npm 目標標籤；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，預設為 `beta`。最終修補版本 `33` 及後續版本必須使用 `extended-stable`；依預設，`extended-stable` 會拒絕更早的修補版本，且一律拒絕非最終標籤。
- `bypass_extended_stable_guard`：僅供測試的布林值，預設為 `false`；搭配 `npm_dist_tag=extended-stable` 時，會略過每月延伸穩定版資格限制，同時保留發行身分、資產、核准及回讀檢查。

`Plugin NPM Release` 接受 `npm_dist_tag=default` 以沿用既有發行行為，或接受 `npm_dist_tag=extended-stable` 以使用受防護的每月路徑。延伸穩定版選項要求 `publish_scope=all-publishable`、空白的 `plugins` 輸入、修補版本為 `33` 或以上的最終版本，以及位於確切分支頂端的標準 `extended-stable/YYYY.M.33` 分支。它絕不會移動外掛的 `latest` 或 `beta`。新套件版本會透過 OIDC 受信任發布，以不可分割的方式取得 `extended-stable`（`npm publish --tag extended-stable`）；此來源工作流程不會使用以權杖驗證的 `npm dist-tag add`。重試會略過 npm 中已存在的確切版本，然後以封閉方式失敗，除非完整回讀確認每個確切套件與 `extended-stable` 標籤皆已收斂。

`OpenClaw Release Publish` 接受下列由操作人員控制的輸入：

- `tag`：必要的發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時必須提供
- `full_release_validation_run_id`：成功的 `Full Release Validation` 執行 ID；當 `publish_openclaw_npm=true` 或 `plugin_publish_scope=all-publishable` 時必須提供
- `full_release_validation_run_attempt`：與 `full_release_validation_run_id` 配對的確切正整數嘗試次數；只要提供執行 ID就必須提供
- `windows_node_tag`：確切且非預發行版的 `openclaw/openclaw-windows-node` 發行標籤；發布 OpenClaw 穩定版時必須提供
- `windows_node_installer_digests`：由候選版本核准的精簡 JSON 對應表，將目前 Windows 安裝程式名稱對應至固定的 `sha256:` 摘要；發布 OpenClaw 穩定版時必須提供
- `npm_telegram_run_id`：選用的成功 `NPM Telegram Beta E2E` 執行 ID，用於納入最終發行證據
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤，可為 `alpha`、`beta` 或 `latest`
- `plugin_publish_scope`：預設為 `all-publishable`；只有在 `publish_openclaw_npm=false` 的聚焦外掛修復工作中才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；僅在將此工作流程用作僅限外掛的修復協調器時設為 `false`
- `release_profile`：用於發行證據摘要的發行涵蓋設定檔；預設為 `from-validation`，會從驗證資訊清單讀取，也可覆寫為 `beta`、`stable` 或 `full`
- `wait_for_clawhub`：預設為 `false`，避免 npm 可用性遭 ClawHub 輔助流程阻擋；只有在工作流程完成時必須包含 ClawHub 完成狀態，才設為 `true`

`OpenClaw Release Checks` 接受下列由操作人員控制的輸入：

- `ref`：要驗證的分支、標籤或完整提交 SHA。包含機密資訊的檢查要求解析出的提交可從 OpenClaw 分支或發行標籤到達。
- `run_release_soak`：為 beta 發行檢查選擇執行完整的即時／端對端、Docker 發行路徑，以及所有歷來版本升級存續性長時間測試。當 `release_profile=stable` 或 `release_profile=full` 時，會強制啟用。

規則：

- 修訂版號低於 `33` 的一般正式版與修正版可發布至 `beta` 或 `latest`。修訂版號為 `33` 或以上的正式版必須發布至 `extended-stable`，而位於此界線的修正尾碼版本則會遭到拒絕。
- Beta 預發行標籤只能發布至 `beta`；alpha 預發行標籤只能發布至 `alpha`
- 對於 `OpenClaw NPM Release`，僅當 `preflight_only=true` 時才允許輸入完整的提交 SHA
- `OpenClaw Release Checks` 與 `Full Release Validation` 一律僅供驗證
- 實際發布路徑必須使用預檢期間所用的同一個 `npm_dist_tag`；工作流程會先驗證該中繼資料，然後才繼續發布

## 一般 beta/latest 穩定版發行順序

此舊版順序適用於一般的協調式發行，該流程也負責外掛、GitHub Release、Windows 與其他平台工作。這不是本頁頂端所記載、每月執行的 `.33+` npm-only 延伸穩定版路徑。

建立一般協調式穩定版發行時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，可以使用目前工作流程分支的完整提交 SHA，對預檢工作流程執行僅供驗證的試運行。
2. 一般先發布 beta 的流程請選擇 `npm_dist_tag=beta`；只有在刻意要直接發布穩定版時，才選擇 `latest`。
3. 若希望透過單一手動工作流程取得一般 CI，以及即時提示快取、Docker、QA Lab、Matrix 與 Telegram 的涵蓋範圍，請在發行分支、發行標籤或完整提交 SHA 上執行 `Full Release Validation`。若刻意只需要具確定性的一般測試圖，請改為在發行參照上執行手動 `CI` 工作流程。
4. 選取確切且非預發行的 `openclaw/openclaw-windows-node` 發行標籤，其已簽署的 x64 與 ARM64 安裝程式將隨版本發布。將其儲存為 `windows_node_tag`，並將這些安裝程式經驗證的摘要對應表儲存為 `windows_node_installer_digests`。候選發行版輔助程式會記錄兩者，並將其納入產生的發布命令。
5. 儲存成功的 `preflight_run_id`、`full_release_validation_run_id`，以及確切的 `full_release_validation_run_attempt`。
6. 從受信任的 `main` 執行 `OpenClaw Release Publish`，並使用相同的 `tag`、相同的 `npm_dist_tag`、所選的 `windows_node_tag`、其已儲存的 `windows_node_installer_digests`、已儲存的 `preflight_run_id`、`full_release_validation_run_id` 與 `full_release_validation_run_attempt`。此流程會先將外部化外掛發布至 npm 與 ClawHub，再提升 OpenClaw npm 套件。
7. 若發行版發布至 `beta`，請使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 提升至 `latest`。
8. 若發行版刻意直接發布至 `latest`，而 `beta` 應立即指向同一穩定版組建，請使用同一個發行工作流程，讓兩個 dist-tag 都指向該穩定版本；或者讓其排程的自我修復同步稍後移動 `beta`。

dist-tag 變更位於發行帳本儲存庫中，因為該操作仍需要 `NPM_TOKEN`，而原始碼儲存庫僅保留使用 OIDC 的發布方式。如此可確保直接發布路徑與先發布 beta 的提升路徑都有文件記載，且操作人員均可看見。

若維護者必須改用本機 npm 驗證，所有 1Password 命令列介面 (`op`) 命令都只能在專用 tmux 工作階段內執行。請勿直接從主要代理程式 shell 呼叫 `op`；將其保留在 tmux 內，可讓提示、警示與 OTP 處理過程保持可觀察，並避免主機重複發出警示。

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

維護者使用 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) 中的私人發行文件，作為實際操作手冊。

## 相關內容

- [發行通道](/zh-TW/install/development-channels)
