---
read_when:
    - 正在尋找公開發布通道定義
    - 執行發布驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證主機、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-07-06T10:52:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9c40bab337e28cb1e0263a45d2d1de7a515def2492a810de8a150ef1f4fe18d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 目前公開三個使用者可見的更新通道：

- stable：現有的已推廣發行通道；在獨立的命令列介面/通道里程碑完成之前，仍會透過 npm `latest` 解析
- beta：發布到 npm `beta` 的預發行標籤
- dev：`main` 的移動最新提交

另外，發行操作員可以將前一個已完成月份的核心
套件發布到 npm `extended-stable`，從修補版 `33` 開始。當月的
一般 final 線會繼續使用 npm `latest`；這個操作員端的發布
分流本身不會改變命令列介面更新通道解析。

Tideclaw alpha 建置是另一條內部預發行軌道（npm dist-tag `alpha`），涵蓋於 [NPM 工作流程輸入](#npm-workflow-inputs)與[發行測試機器](#release-test-boxes)。

## 版本命名

- 每月 npm extended-stable 發行版本：`YYYY.M.PATCH`，其中 `PATCH >= 33`，git 標籤 `vYYYY.M.PATCH`
- 每日/一般 final 發行版本：`YYYY.M.PATCH`，其中 `PATCH < 33`，git 標籤 `vYYYY.M.PATCH`
- 一般 fallback 修正發行版本：`YYYY.M.PATCH-N`，git 標籤 `vYYYY.M.PATCH-N`
- Beta 預發行版本：`YYYY.M.PATCH-beta.N`，git 標籤 `vYYYY.M.PATCH-beta.N`
- Alpha 預發行版本：`YYYY.M.PATCH-alpha.N`，git 標籤 `vYYYY.M.PATCH-alpha.N`
- 月份或修補版絕不補零
- `PATCH` 是每月發行列車的序號，不是日曆日期。一般 final 與 beta 發行會推進目前列車；僅 alpha 的標籤絕不消耗或推進 beta/一般修補版號，因此選擇 beta 或一般列車時，請忽略修補版號較高的舊版僅 alpha 標籤。
- Alpha/nightly 建置使用下一個尚未發行的修補版列車，重複建置時只遞增 `alpha.N`。一旦該修補版已有 beta，新的 alpha 建置會移到下一個修補版。
- npm 版本不可變：絕不刪除、重新發布或重複使用已發布的標籤。請改切下一個預發行編號或下一個每月修補版。
- `latest` 繼續跟隨目前的一般/每日 npm 線；`beta` 是目前的 beta 安裝目標
- `extended-stable` 表示受支援的前一個月份 npm 套件，從修補版 `33` 開始；修補版 `34` 及之後版本是該月線上的維護發行
- 一般 final 與一般修正發行預設發布到 npm `beta`；發行操作員可以明確指定 `latest`，或稍後推廣已審核的 beta 建置
- 專用的每月 extended-stable 路徑會以完全相同版本發布核心 npm 套件與每個可發布到 npm 的官方外掛。它不會將外掛發布到 ClawHub，也不會發布 macOS 或 Windows 成品、GitHub Release、私有儲存庫 dist-tag、Docker 映像、行動端成品或網站下載。
- 每個一般 final 發行會一併交付 npm 套件、macOS app 與已簽署的 Windows Hub 安裝程式。Beta 發行通常會先驗證並發布 npm/套件路徑，原生 app 建置/簽署/公證/推廣則保留給一般 final，除非明確要求。

## 發行節奏

- 發行先進入 beta；只有在最新 beta 驗證完成後，stable 才會跟進
- 維護者通常會從目前 `main` 建立 `release/YYYY.M.PATCH` 分支來切發行，因此發行驗證與修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切下一個 `-beta.N` 標籤，而不是刪除或重建舊標籤
- 詳細發行程序、核准、憑證與復原註記僅限維護者

## 每月僅 npm 的 extended-stable 發布

這是以下一般發行程序的專用例外。對於已完成的月份 `YYYY.M`，建立 `extended-stable/YYYY.M.33`；從同一分支發布
`vYYYY.M.33` 與後續維護修補版。發行
標籤、分支頂端、checkout、套件版本、npm 預檢，以及 Full Release
Validation 執行都必須識別同一個 commit。受保護的 `main` 必須
已包含日曆月份嚴格晚於它且修補版低於
`33` 的 final 版本；即使 `main` 推進超過一個
月份，維護修補版仍符合資格。

在精確的 extended-stable 分支上，將根套件升版到 `YYYY.M.P`，執行
`pnpm release:prep`，並確認每個可發布的 extension 套件都具有
相同版本。提交並推送所有產生的變更，在該 commit 建立並推送
不可變的 `vYYYY.M.P` 標籤，並記錄產生的完整 SHA。
工作流程會使用這棵已準備的樹；它們不會替你升版或同步
版本。

從該精確已準備分支頂端執行 npm 預檢與 Full Release Validation，然後儲存兩個執行 ID：

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

`release_profile=stable` 是現有的驗證深度設定檔；它與 npm `extended-stable` dist-tag 分開，且有意
保持不變。

兩個執行都成功後，從相同的精確分支頂端發布每個可發布到 npm 的官方外掛。修補版 `P` 必須為 `33` 或更大。將完整發行
SHA 作為 `ref` 傳入，等待完整矩陣與 registry 回讀，然後儲存
成功的 Plugin NPM Release 執行 ID：

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

該工作流程使用一般已準備的 `all-publishable` 套件清單，
包含原始碼未變更的套件。它會在成功前驗證每個精確套件
以及每個外掛 `extended-stable` 標籤。如果部分執行
失敗，請重新執行同一個命令：已發布的套件會重用，缺失
或過時的外掛標籤會在 npm 發行環境下調和，而
最終回讀仍會涵蓋完整套件集合。

外掛工作流程成功且 npm 發行環境就緒後，
發布精確的核心預檢 tarball。核心發布會驗證
參照的外掛執行是在相同 canonical 分支與
精確來源 SHA 上的 `completed/success`：

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

對於 fork 或非正式生產演練，如果有意無法滿足
每月 `.33` 或受保護 `main` 的月份政策，請將
`-f bypass_extended_stable_guard=true` 加到 npm 預檢與發布
dispatch。預設值為 `false`。此 bypass 只會在
`npm_dist_tag=extended-stable` 時接受，且會記錄在工作流程摘要中。它
不會繞過 canonical `extended-stable/YYYY.M.33` 工作流程 ref、
分支頂端/標籤/checkout 相等性、final 標籤語法、套件/標籤版本
相等性、參照執行與 manifest 身分、tarball 來源、
環境核准、registry 回讀，或 selector 修復證據。

發布工作流程會驗證參照的預檢、驗證與外掛
執行身分、已準備 tarball digest，以及核心 registry selector。
工作流程成功後，請獨立確認結果：

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

兩個命令都必須回傳 `YYYY.M.P`。如果發布成功但 selector
回讀失敗，不要重新發布不可變的套件版本。使用
失敗工作流程 always-run 摘要中列印的單一 `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復命令，
然後重複兩個獨立回讀。回復到前一個 selector 是另一個操作員
決策，不是回讀修復路徑。

公開支援文件一開始將 Slack、Discord 與 Codex 指定為
涵蓋的 extended-stable 外掛介面。該清單是支援聲明，不是
發行程式碼 allowlist：每個可發布到 npm 的官方外掛都遵循
相同的精確版本發布路徑。

以下一般檢查清單仍負責 beta、`latest`、GitHub Release、
外掛、macOS、Windows，以及其他平台發布。不要為這條僅 npm 的 extended-stable 路徑執行那些
步驟。

## 一般發行操作員檢查清單

此檢查清單是發行流程的公開形態。私有憑證、簽署、公證、dist-tag 復原，以及緊急 rollback 細節保留在僅限維護者的發行 runbook 中。

1. 從目前的 `main` 開始：拉取最新版本、確認目標 commit 已推送，並確認 `main` CI 綠到足以從它建立分支。
2. 從上一個可到達發行標籤之後合併的 PR 與所有直接 commit 產生最上層 `CHANGELOG.md` 區段。保持條目面向使用者、去除重疊的 PR/直接 commit 條目、提交、推送，並在建立分支前再 rebase/pull 一次。
3. 檢閱 `src/plugins/compat/registry.ts` 與 `src/commands/doctor/shared/deprecation-compat.ts` 中的發行相容性記錄。只有在升級路徑仍受涵蓋時才移除已過期相容性，否則記錄為何有意保留。
4. 從目前的 `main` 建立 `release/YYYY.M.PATCH`。不要直接在 `main` 上執行一般發行工作。
5. 為該標籤升版每個必要的版本位置，然後執行 `pnpm release:prep`。它會依序重新整理外掛版本、npm shrinkwrap、外掛清單、基礎設定 schema、內建通道設定 metadata、設定文件 baseline、外掛 SDK 匯出，以及外掛 SDK API baseline。在標記前提交任何產生的 drift，然後執行本機 deterministic 預檢：`pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在前，可使用完整 40 字元發行分支 SHA 作為僅驗證預檢。預檢會為精確 checkout 的依賴圖產生依賴發行證據，並將其儲存在 npm 預檢 artifact 中。儲存成功的 `preflight_run_id`。
7. 對發行分支、標籤或完整 commit SHA 以 `Full Release Validation` 啟動所有預發行測試。這是四個大型發行測試機器的唯一手動進入點：Vitest、Docker、QA Lab 與 Package。儲存 `full_release_validation_run_id`；它是 `OpenClaw NPM Release` 與 `OpenClaw Release Publish` 的必要輸入。
8. 如果驗證失敗，請在發行分支上修正，並重新執行能證明修正的最小失敗檔案、lane、工作流程 job、套件 profile、provider 或 model allowlist。只有在變更的介面讓先前證據過時時，才重新執行完整 umbrella。
9. 對於已標記的 beta 候選版本，從相符的 `release/YYYY.M.PATCH` 分支執行 `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。對於 stable，也傳入必要的 Windows 來源發行：`pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。該 helper 會執行本機產生式發行檢查，dispatch 或驗證完整發行驗證與 npm 預檢證據，針對精確已準備 tarball 加上 Telegram 套件證據執行 Parallels fresh/update 證明，記錄外掛 npm 與 ClawHub 計畫，並且只在證據 bundle 全綠後列印精確的 `OpenClaw Release Publish` 命令。

   `OpenClaw Release Publish` 會將選取的或所有可發布的外掛套件 dispatch 到 npm，並將同一組套件平行 dispatch 到 ClawHub；接著在外掛 npm 發布成功後，使用相符的 dist-tag 推升已準備好的 OpenClaw npm 預檢成品。OpenClaw npm 發布子流程成功後，它會從完整且相符的 `CHANGELOG.md` 章節建立或更新對應的 GitHub release/prerelease 頁面：發布到 npm `latest` 的穩定版會成為 GitHub latest release，保留在 npm `beta` 的穩定維護版則會以 GitHub `latest=false` 建立。此工作流程也會將預檢相依性證據、完整驗證 manifest，以及發布後 registry 驗證證據上傳到 GitHub release，以供發布後事件回應使用。它會立即列印子流程 run ID，自動核准 workflow token 允許核准的 release environment gate，以記錄尾端摘要失敗的子工作，在 OpenClaw npm 發布成功後立即完成 GitHub release 與相依性證據，當 OpenClaw npm 正在發布時等待 ClawHub，然後執行 `pnpm release:verify-beta`，並為 GitHub release、npm 套件、選取的外掛 npm 套件、選取的 ClawHub 套件、子工作流程 run ID，以及選用的 NPM Telegram run ID 上傳發布後證據。ClawHub 路徑會重試暫時性的命令列介面相依性安裝失敗，即使某個 preview cell 發生 flakes 仍會發布通過 preview 的外掛，最後會對每個預期的外掛版本執行 registry 驗證，讓部分發布保持可見且可重試。

   然後針對已發布的 `openclaw@YYYY.M.PATCH-beta.N` 或 `openclaw@beta` 套件執行發布後套件接受測試。如果已推送或已發布的 prerelease 需要修正，請切出下一個相符的 prerelease 編號；絕不可刪除或重寫舊版本。

10. 對穩定版，只有在已審核的 beta 或 release candidate 具備必要驗證證據後才繼續。穩定版 npm 發布也會透過 `OpenClaw Release Publish`，使用 `preflight_run_id` 重用成功的預檢成品。穩定版 macOS 發布就緒也要求已封裝的 `.zip`、`.dmg`、`.dSYM.zip`，以及 `main` 上更新後的 `appcast.xml`；macOS 發布工作流程會在 release 資產驗證後，自動將已簽署的 appcast 發布到公開 `main`，或者在分支保護阻擋直接推送時開啟/更新 appcast PR。穩定版 Windows Hub 就緒要求 OpenClaw GitHub release 上有已簽署的 `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe` 和 `OpenClawCompanion-SHA256SUMS.txt` 資產。將確切已簽署的 `openclaw/openclaw-windows-node` release tag 作為 `windows_node_tag` 傳入，並將其已通過 candidate 核准的安裝程式 digest map 作為 `windows_node_installer_digests` 傳入；`OpenClaw Release Publish` 會保留 release draft、dispatch `Windows Node Release`，並在發布前驗證全部三個資產。
11. 發布後，執行 npm 發布後驗證器；需要發布後通道證據時，執行選用的獨立已發布 npm Telegram E2E；在需要時執行 dist-tag 推升；驗證產生的 GitHub release 頁面；執行 release announcement 步驟；然後完成 [穩定版 main 收尾](#stable-main-closeout)，之後才可稱穩定版發布完成。

## 穩定版 main 收尾

穩定版發布在 `main` 承載實際已出貨 release 狀態之前，不算完成。

1. 從全新的最新 `main` 開始。對照它稽核 `release/YYYY.M.PATCH`，並 forward-port `main` 缺少的實際修正。不要盲目將只存在於 release 的相容性、測試或驗證 adapter merge 到較新的 `main`。
2. 將 `main` 設為已出貨的穩定版本，而不是推測性的下一列車版本。在根版本變更後執行 `pnpm release:prep`，然後執行 `pnpm deps:shrinkwrap:generate`。
3. 讓 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 章節與已標記的 release 分支完全一致。若 mac release 發布了穩定版 `appcast.xml` 更新，也要包含它。
4. 在操作者明確開始該 release train 之前，不要將 `YYYY.M.PATCH+1`、beta 版本，或空白的未來 changelog 章節加入 `main`。
5. 執行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check` 和 `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送後，在稱穩定版 release 完成前，驗證 `origin/main` 包含已出貨版本與 changelog。
6. 每次私有 rollback drill 後，保持 repository variables `RELEASE_ROLLBACK_DRILL_ID` 和 `RELEASE_ROLLBACK_DRILL_DATE` 為最新。

`OpenClaw Stable Main Closeout` 會從穩定版發布後，承載已出貨版本、changelog 和 appcast 的 `main` push 開始。它會讀取不可變的發布後證據，將已出貨 tag 綁定到其 Full Release Validation 與 Publish run，然後驗證穩定版 main 狀態、release、必要的穩定版 soak，以及阻擋性的效能證據。它會將不可變的收尾 manifest 與 checksum 附加到 GitHub release。自動 push trigger 會略過早於不可變發布後證據的舊版 release，且絕不將該略過視為已完成收尾。

完整收尾需要同時具備資產與相符 checksum。部分 manifest 會重放其記錄的 `main` SHA 與 rollback drill 以重新產生相同位元組，然後附加缺少的 checksum；無效配對，或只有 checksum 而沒有 manifest，仍會阻擋。沒有 rollback drill repository variables 的 push-triggered run 會略過而不完成收尾；缺少或超過 90 天的 drill 記錄，仍會阻擋有證據支撐的手動收尾。私有復原命令保留在僅限維護者的 runbook 中。僅使用 manual dispatch 來修復或重放有證據支撐的穩定版收尾。

舊版 fallback correction tag 只有在 correction tag 解析到與基礎穩定版 tag 相同的原始碼 commit 時，才可重用基礎套件證據。來源不同的 correction 必須發布並驗證自己的套件證據。

## Release 預檢

- 在 release 預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` gate 之外仍受到涵蓋。
- 在 release 預檢前執行 `pnpm check:architecture`，讓更廣泛的 import cycle 與架構邊界檢查在較快的本機 gate 之外保持綠燈。
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` release 成品與 Control UI bundle 存在，以供 pack 驗證步驟使用。
- 在根版本 bump 後、標記 tag 前執行 `pnpm release:prep`。它會執行每個在版本/設定/API 變更後常見漂移的 deterministic release generator：外掛版本、npm shrinkwrap、外掛 inventory、基礎 config schema、bundled channel config metadata、config docs baseline、外掛 SDK exports，以及外掛 SDK API baseline。`pnpm release:check` 會以 check mode 重新執行這些 guard（另加外掛 SDK surface budget check），並在執行套件 release 檢查前，一次回報每個產生內容漂移失敗。
- 外掛版本同步預設會將可發布的 `@openclaw/ai` runtime package、官方外掛套件版本，以及既有的 `openclaw.compat.pluginApi` floors 更新到 OpenClaw release 版本。請將該欄位視為外掛 SDK/runtime API floor，而不只是套件版本的副本：對於刻意維持與較舊 OpenClaw host 相容的僅外掛 release，請將 floor 保持在最舊支援的 host API，並在外掛 release proof 中記錄該選擇。
- 在 release 核准前執行手動 `Full Release Validation` 工作流程，從單一 entrypoint 啟動所有 pre-release test box。它接受分支、tag 或完整 commit SHA，dispatch 手動 `CI`，並為 install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix 和 Telegram lanes dispatch `OpenClaw Release Checks`。穩定版與完整 run 一律包含詳盡的 live/E2E 與 Docker release-path soak；`run_release_soak=true` 保留給明確的 beta soak。Package Acceptance 會在 candidate validation 期間提供 canonical package Telegram E2E，避免第二個並行 live poller。

  發布 beta 後提供 `release_package_spec`，即可在 release checks、Package Acceptance 與 package Telegram E2E 之間重用已出貨的 npm 套件，而不重新建置 release tarball。只有在 Telegram 應使用與其他 release validation 不同的已發布套件時，才提供 `npm_telegram_package_spec`。當 Package Acceptance 應使用與 release package spec 不同的已發布套件時，提供 `package_acceptance_package_spec`。當 release evidence report 應證明驗證符合已發布的 npm 套件、但不強制執行 Telegram E2E 時，提供 `evidence_package_spec`。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- 當你希望在 release 工作持續進行時，為套件 candidate 取得 side-channel proof，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或確切 release 版本使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` harness 打包受信任的 `package_ref` 分支/tag/SHA；對具備必要 SHA-256 與嚴格公開 URL policy 的公開 HTTPS tarball 使用 `source=url`；對使用必要 `trusted_source_id` 與 SHA-256 的具名 trusted-source policy 使用 `source=trusted-url`；或對另一個 GitHub Actions run 上傳的 tarball 使用 `source=artifact`。

  此工作流程會將 candidate 解析為 `package-under-test`，針對該 tarball 重用 Docker E2E release scheduler，並可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一 tarball 執行 Telegram QA。當選取的 Docker lanes 包含 `published-upgrade-survivor` 時，package artifact 是 candidate，而 `published_upgrade_survivor_baseline` 會選取已發布的 baseline。`update-restart-auth` 會將 candidate package 同時作為已安裝的命令列介面與 package-under-test，藉此演練 candidate update command 的 managed restart path。

  範例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  常用 profiles：
  - `smoke`：install/channel/agent、gateway network 和 config reload lanes
  - `package`：artifact-native package/update/restart/plugin lanes，不含 OpenWebUI 或 live ClawHub
  - `product`：package profile，加上 MCP channels、cron/subagent cleanup、OpenAI web search 和 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker release-path chunks
  - `custom`：用於 focused rerun 的確切 `docker_lanes` 選取

- 當你只需要 release candidate 的 deterministic normal CI coverage 時，直接執行手動 `CI` 工作流程。手動 CI dispatch 會繞過 changed scoping，並強制執行 Linux 節點 shards、bundled-plugin shards、plugin and channel contract shards、節點 22 compatibility、`check-*`、`check-additional-*`、built-artifact smoke checks、docs checks、Python skills、Windows、macOS，以及 Control UI i18n lanes。獨立手動 CI run 只有在以 `include_android=true` dispatch 時才執行 Android；`Full Release Validation` 會為其 CI 子流程傳入該 input。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- 驗證發布遙測時，執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器執行 QA-lab，並驗證追蹤、指標與日誌匯出，以及有界限的追蹤屬性和內容/識別碼遮蔽，不需要 Opik、Langfuse 或其他外部收集器。
- 驗證收集器相容性時，執行 `pnpm qa:otel:collector-smoke`。它會先透過真正的 OpenTelemetry Collector Docker 容器路由相同的 QA-lab OTLP 匯出，再進行本機接收器斷言。
- 驗證受保護的 Prometheus 抓取時，執行 `pnpm qa:prometheus:smoke`。它會執行 QA-lab、拒絕未驗證的抓取，並驗證發布關鍵的指標族群不含提示內容、原始識別碼、驗證權杖與本機路徑。
- 執行 `pnpm qa:observability:smoke`，連續跑完原始碼簽出中的 OpenTelemetry 與 Prometheus 煙霧測試通道。
- 每次標記發布前執行 `pnpm release:check`。
- `OpenClaw NPM Release` 預檢會在打包 npm tarball 之前產生依賴項發布證據。npm advisory 漏洞閘門會阻擋發布。傳遞性 manifest 風險、依賴項所有權/安裝表面，以及依賴項變更報告僅作為發布證據。依賴項變更報告會比較發布候選版與前一個可到達的發布標籤。預檢會將依賴項證據上傳為 `openclaw-release-dependency-evidence-<tag>`，也會將它嵌入準備好的 npm 預檢成品內的 `dependency-evidence/`。真正的發布路徑會重用該預檢成品，然後將同一份證據作為 `openclaw-<version>-dependency-evidence.zip` 附加到 GitHub 發布。
- 標籤存在後，執行 `OpenClaw Release Publish` 進行會變更狀態的發布序列。從 `release/YYYY.M.PATCH`（或發布 main 可到達標籤時的 `main`）派送它，傳入發布標籤、成功的 OpenClaw npm `preflight_run_id`，以及成功的 `full_release_validation_run_id`，並保留預設外掛發布範圍 `all-publishable`，除非你是刻意執行聚焦修復。此 workflow 會序列化外掛 npm 發布、外掛 ClawHub 發布，以及 OpenClaw npm 發布，確保核心套件不會早於其外部化外掛發布。
- 穩定版 `OpenClaw Release Publish` 需要在相符的非預發布 `openclaw/openclaw-windows-node` 發布存在後，提供精確的 `windows_node_tag`，以及已由候選版核准的 `windows_node_installer_digests` 映射。在派送任何發布子項目前，它會驗證來源發布已發布、不是預發布、包含必要的 x64/ARM64 安裝程式，且仍符合該核准映射。接著它會在 OpenClaw 發布仍為草稿時派送 `Windows Node Release`，並原封不動帶入釘選的安裝程式 digest 映射。子 workflow 會從該精確標籤下載已簽署的 Windows Hub 安裝程式，與釘選 digest 比對，在 Windows runner 上驗證其 Authenticode 簽章使用預期的 OpenClaw Foundation 簽署者，寫入 SHA-256 manifest，並將安裝程式與 manifest 上傳到標準 OpenClaw GitHub 發布，然後重新下載已提升的資產並驗證 manifest 成員資格與雜湊值。父 workflow 會在發布前驗證目前的 x64、ARM64 與 checksum 資產合約。直接復原會先拒絕非預期的 `OpenClawCompanion-*` 資產名稱，再用釘選的來源位元組取代預期的合約資產。

  只有在復原時才手動派送 `Windows Node Release`，且一律傳入精確標籤，絕不要傳 `latest`，並傳入已核准來源發布中的明確 `expected_installer_digests` JSON 映射。網站下載連結應指向目前穩定版發布的精確 OpenClaw 發布資產 URL，或只在驗證 GitHub 的 latest 重新導向指向同一個發布後，才使用 `releases/latest/download/...`；不要只連到 companion repo 發布頁面。

- 發布檢查現在於獨立的手動 workflow 中執行：`OpenClaw Release Checks`。它也會在發布核准前執行 QA Lab mock parity 通道，以及快速 live Matrix profile 和 Telegram QA 通道。live 通道使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI 憑證租約。當你想平行執行完整 Matrix 傳輸、媒體與 E2EE 清單時，請以 `matrix_profile=all` 和 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- 跨作業系統安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它們會直接呼叫可重用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`。這個拆分是刻意的：讓真正的 npm 發布路徑保持短小、確定且聚焦於成品，而較慢的 live 檢查留在自己的通道中，避免拖慢或阻擋發布。
- 帶有祕密的發布檢查應透過 `Full Release Validation` 派送，或從 `main`/release workflow ref 派送，讓 workflow 邏輯與祕密維持受控。
- 只要解析出的 commit 可從 OpenClaw 分支或發布標籤到達，`OpenClaw Release Checks` 接受分支、標籤或完整 commit SHA。
- `OpenClaw NPM Release` 的僅驗證預檢也接受目前 workflow 分支的完整 40 字元 commit SHA，不需要已推送的標籤。該 SHA 路徑僅供驗證，不能提升為真正發布。在 SHA 模式中，workflow 只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發布標籤。
- 兩個 workflow 都會將真正的發布與提升路徑保留在 GitHub-hosted runner 上，而非變更狀態的驗證路徑可以使用較大的 Blacksmith Linux runner。
- 該 workflow 會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow 祕密。
- npm 發布預檢不再等待獨立的發布檢查通道。
- 在本機標記發布候選版前，執行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。此 helper 會依序執行快速發布護欄、外掛 npm/ClawHub 發布檢查、建置、UI 建置，以及 `release:openclaw:npm:check`，在 GitHub 發布 workflow 開始前捕捉常見會阻擋核准的錯誤。
- 核准前執行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的預發布/修正版標籤）。
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（或相符的 beta/修正版版本），在全新的暫存 prefix 中驗證已發布 registry 安裝路徑。
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租用的 Telegram 憑證池，針對已發布的 npm 套件驗證已安裝套件 onboarding、Telegram 設定與真正的 Telegram E2E。本機維護者的一次性操作可以省略 Convex 變數，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env 憑證。
- 若要從維護者機器執行完整的發布後 beta 煙霧測試，請使用 `pnpm release:beta-smoke -- --beta betaN`。此 helper 會執行 Parallels npm 更新/全新目標驗證、派送 `NPM Telegram Beta E2E`、輪詢精確的 workflow run、下載成品，並列印 Telegram 報告。
- 維護者可以透過手動 `NPM Telegram Beta E2E` workflow，從 GitHub Actions 執行相同的發布後檢查。它刻意只允許手動執行，不會在每次合併時執行。
- 維護者發布自動化使用先預檢後提升：
  - 真正的 npm 發布必須通過成功的 npm `preflight_run_id`。
  - 真正發布必須從與成功預檢 run 相同的 `main` 或 `release/YYYY.M.PATCH` 分支派送（Tideclaw alpha 分支可用於 alpha 預發布）。
  - 穩定版 npm 發布預設為 `beta`；穩定版 npm 發布可以透過 workflow 輸入明確指定 `latest`。
  - 以權杖為基礎的 npm dist-tag 變更位於 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而來源 repo 保持僅使用 OIDC 發布。
  - 公開 `macOS Release` 僅供驗證；當標籤只存在於發布分支，但 workflow 從 `main` 派送時，設定 `public_release_branch=release/YYYY.M.PATCH`。
  - 真正的 macOS 發布必須通過成功的 macOS `preflight_run_id` 與 `validate_run_id`。
  - 真正發布路徑會提升已準備好的成品，而不是再次重建它們。
- 對於像 `YYYY.M.PATCH-N` 這樣的穩定版修正發布，發布後驗證器也會檢查從 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同暫存 prefix 升級路徑，確保發布修正不會悄悄讓較舊的全域安裝停留在基礎穩定版 payload。
- 除非 tarball 同時包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，否則 npm 發布預檢會失敗關閉，避免我們再次出貨空的瀏覽器儀表板。
- 發布後驗證也會檢查已發布外掛 entrypoint 與套件中繼資料是否存在於已安裝的 registry 版面配置中。若發布缺少外掛執行階段 payload，發布後驗證器會失敗，且不能提升到 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，因此安裝程式 e2e 能在發布發布路徑前捕捉意外的打包膨脹。
- 如果發布工作觸及 CI 規劃、extension timing manifest 或 extension 測試矩陣，請在核准前重新產生並審查 `.github/workflows/plugin-prerelease.yml` 中由 planner 擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，避免發布說明描述過時的 CI 版面配置。
- 穩定版 macOS 發布就緒狀態也包含更新器表面：GitHub 發布最後必須包含打包後的 `.zip`、`.dmg` 與 `.dSYM.zip`；發布後 `main` 上的 `appcast.xml` 必須指向新的穩定版 zip（macOS 發布 workflow 會自動提交它，或在直接推送被阻擋時開啟 appcast PR）；打包後的 app 必須保留非除錯 bundle id、非空的 Sparkle feed URL，以及不低於該發布版本標準 Sparkle 建置下限的 `CFBundleVersion`。

## 發布測試盒

`Full Release Validation` 是操作者從單一進入點啟動所有發布前測試的方式。若要在快速變動的分支上取得釘選 commit 證明，請使用 helper，讓每個子 workflow 都從固定在目標 SHA 的暫存分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

此 helper 會推送 `release-ci/<sha>-...`，從該分支派送 `Full Release Validation` 並帶入 `ref=<sha>`，驗證每個子 workflow 的 `headSha` 都符合目標，然後刪除暫存分支。這可以避免意外證明較新的 `main` 子 run。

若要驗證發布分支或標籤，請從可信任的 `main` workflow ref 執行，並將發布分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

工作流程會解析目標 ref，使用 `target_ref=<release-ref>` 分派手動 `CI`，接著分派 `OpenClaw Release Checks`。`OpenClaw Release Checks` 會展開安裝煙霧測試、跨作業系統發行檢查、啟用 soak 時的 live/E2E Docker 發行路徑涵蓋、Package Acceptance 與標準 Telegram 套件 E2E、QA Lab parity、live Matrix，以及 live Telegram。full/all 執行只有在 `Full Release Validation` 摘要顯示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 成功時才可接受，除非 focused rerun 是刻意略過獨立的 `Plugin Prerelease` 子項。僅在使用 `release_package_spec` 或 `npm_telegram_package_spec` 進行 focused 已發布套件 rerun 時，才使用獨立的 `npm-telegram` 子項。最終 verifier 摘要包含每個子執行的最慢工作表格，因此 release manager 不必下載日誌即可查看目前的 critical path。

請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、精確的工作流程 job 名稱、stable 與 full profile 差異、artifact，以及 focused rerun handle。

子工作流程會從執行 `Full Release Validation` 的可信 ref 分派，通常是 `--ref main`，即使目標 `ref` 指向較舊的發行分支或 tag。沒有獨立的 Full Release Validation workflow-ref 輸入；請透過選擇工作流程執行 ref 來選擇可信 harness。不要使用 `--ref main -f ref=<sha>` 對移動中的 `main` 做精確 commit 證明；原始 commit SHA 不能作為 workflow dispatch ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立 pinned 暫時分支。

使用 `release_profile` 選擇 live/provider 廣度：

- `minimum`：最快的 release-critical OpenAI/core live 與 Docker path
- `stable`：minimum 加上發行核准所需的 stable provider/backend 涵蓋
- `full`：stable 加上廣泛的 advisory provider/media 涵蓋

stable 和 full 驗證在 promotion 前一律執行完整的 live/E2E、Docker 發行路徑，以及有界限的已發布 upgrade-survivor sweep。使用 `run_release_soak=true` 可為 beta 要求相同 sweep。該 sweep 涵蓋最新四個 stable 套件，加上 pinned `2026.4.23` 和 `2026.5.2` baseline，以及較舊的 `2026.4.15` 涵蓋；會移除重複 baseline，並將每個 baseline 分片到各自的 Docker runner job。

`OpenClaw Release Checks` 會使用可信 workflow ref 將目標 ref 解析一次為 `release-package-under-test`，並在 soak 執行時於跨作業系統、Package Acceptance 和發行路徑 Docker 檢查中重用該 artifact。這會讓所有面向套件的機器使用相同位元組，並避免重複建置套件。beta 已經發布到 npm 後，請設定 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，讓 release checks 只下載一次已出貨套件，從 `dist/build-info.json` 擷取其建置來源 SHA，並將該 artifact 重用於跨作業系統、Package Acceptance、發行路徑 Docker 和套件 Telegram lanes。

跨作業系統 OpenAI 安裝煙霧測試在 repo/org 變數已設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因為這個 lane 是在證明套件安裝、onboarding、閘道啟動和一次 live agent turn，而不是對最慢的預設模型做 benchmark。更廣泛的 live provider 矩陣仍然是模型特定涵蓋的位置。

請根據發行階段使用這些變體：

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

不要將完整 umbrella 用作 focused fix 後的第一次 rerun。如果某一台機器失敗，請使用失敗的子工作流程、job、Docker lane、套件 profile、模型 provider 或 QA lane 作為下一次證明。只有在修正變更了共享發行 orchestration，或讓先前 all-box 證據過期時，才再次執行完整 umbrella。umbrella 的最終 verifier 會重新檢查已記錄的子工作流程執行 id，因此子工作流程成功 rerun 後，只需 rerun 失敗的 `Verify full validation` 父 job。

若要有界限地復原，請將 `rerun_group` 傳給 umbrella。`all` 是真正的 release-candidate 執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行 release-only 外掛子項，`release-checks` 執行每個發行機器，而較窄的發行群組是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。Focused `npm-telegram` rerun 需要 `release_package_spec` 或 `npm_telegram_package_spec`；full/all 執行使用 Package Acceptance 內的標準套件 Telegram E2E。Focused 跨作業系統 rerun 可以加入 `cross_os_suite_filter=windows/packaged-upgrade` 或另一個 OS/suite filter。QA release-check 失敗會阻擋一般發行驗證，包括 standard tier 中必要的 OpenClaw dynamic tool drift。Tideclaw alpha 執行仍可將非 package-safety release-check lane 視為 advisory。當 `live_suite_filter` 明確要求 gated QA live lane，例如 Discord、WhatsApp 或 Slack 時，必須啟用相符的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 變數；否則輸入擷取會失敗，而不是靜默略過該 lane。

### Vitest

Vitest 機器是手動 `CI` 子工作流程。手動 CI 會刻意繞過 changed scoping，並為 release candidate 強制執行一般測試圖：Linux 節點 shards、bundled-plugin shards、外掛和 channel contract shards、節點 22 相容性、`check-*`、`check-additional-*`、built-artifact smoke checks、docs checks、Python skills、Windows、macOS，以及 Control UI i18n。當 `Full Release Validation` 執行該機器時會包含 Android，因為 umbrella 會傳入 `include_android=true`；獨立手動 CI 需要 `include_android=true` 才有 Android 涵蓋。

使用這台機器回答「原始碼樹是否通過完整的一般測試套件？」它不等同於 release-path 產品驗證。要保留的證據：

- 顯示已分派 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 在精確目標 SHA 上為 green
- 調查 regression 時來自 CI jobs 的失敗或緩慢 shard 名稱
- 當執行需要效能分析時的 Vitest timing artifact，例如 `.artifacts/vitest-shard-timings.json`

只有在發行需要 deterministic 一般 CI，但不需要 Docker、QA Lab、live、跨作業系統或套件機器時，才直接執行手動 CI。非 Android 直接 CI 使用第一個命令。當直接 release-candidate CI 必須涵蓋 Android 時，加入 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 機器透過 `openclaw-live-and-e2e-checks-reusable.yml` 存在於 `OpenClaw Release Checks` 中，另外還有 release-mode `install-smoke` 工作流程。它會透過 packaged Docker 環境驗證 release candidate，而不只是 source-level 測試。

發行 Docker 涵蓋包含：

- 啟用慢速 Bun global install smoke 的完整安裝煙霧測試
- 依目標 SHA 準備/重用 root Dockerfile smoke image，QR、root/gateway 和 installer/Bun smoke jobs 會作為獨立 install-smoke shards 執行
- repository E2E lanes
- release-path Docker chunks：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`
- 要求時在 `plugins-runtime-services` chunk 內的 OpenWebUI 涵蓋
- 拆分的 bundled 外掛 install/uninstall lanes：`bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- release checks 包含 live suites 時的 live/E2E provider suites 與 Docker live model 涵蓋

rerun 前請先使用 Docker artifacts。release-path scheduler 會上傳 `.artifacts/docker-tests/`，其中包含 lane logs、`summary.json`、`failures.json`、phase timings、scheduler plan JSON，以及 rerun commands。若要 focused recovery，請在可重用 live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是 rerun 所有發行 chunks。產生的 rerun commands 會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker image 輸入，因此失敗的 lane 可以重用相同 tarball 和 GHCR images。

### QA Lab

QA Lab 機器也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為和 channel-level 發行 gate，與 Vitest 和 Docker 套件機制分開。

發行 QA Lab 涵蓋包含：

- mock parity lane，使用 agentic parity pack 將 OpenAI candidate lane 與 `anthropic/claude-opus-4-8` baseline 比較
- 使用 `qa-live-shared` 環境的 fast live Matrix QA profile
- 使用 Convex CI credential leases 的 live Telegram QA lane
- 當發行 telemetry 需要明確本地證明時的 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用這台機器回答「發行版本在 QA scenarios 和 live channel flows 中是否正確運作？」核准發行時請保留 parity、Matrix 和 Telegram lanes 的 artifact URLs。完整 Matrix 涵蓋仍可作為手動 sharded QA-Lab 執行使用，而不是預設 release-critical lane。

### Package

Package 機器是可安裝產品 gate。它由 `Package Acceptance` 和 resolver `scripts/resolve-openclaw-package-candidate.mjs` 支援。resolver 會將 candidate 正規化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件 inventory、記錄套件版本與 SHA-256，並將 workflow harness ref 與套件來源 ref 分開保存。

支援的 candidate sources：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本
- `source=ref`：使用選取的 `workflow_ref` harness 打包可信 `package_ref` 分支、tag 或完整 commit SHA
- `source=url`：下載需要 `package_sha256` 的公開 HTTPS `.tgz`；會拒絕 URL credentials、非預設 HTTPS ports、private/internal/special-use hostnames 或 resolved addresses，以及不安全的 redirects
- `source=trusted-url`：從 `.github/package-trusted-sources.json` 中的具名 policy 下載需要 `package_sha256` 和 `trusted_source_id` 的 HTTPS `.tgz`；將此用於 maintainer-owned enterprise mirrors 或 private package repositories，而不是向 `source=url` 加入 input-level private-network bypass
- `source=artifact`：重用另一個 GitHub Actions 執行所上傳的 `.tgz`

`OpenClaw Release Checks` 會以 `source=artifact`、已準備的發行套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` 執行套件驗收。套件驗收會針對同一個已解析的 tarball，保留遷移、更新、根管理 VPS 升級、已設定驗證的更新重啟、即時 ClawHub 技能安裝、過期外掛相依性清理、離線外掛 fixture、外掛更新、外掛命令繫結跳脫強化，以及 Telegram 套件 QA。封鎖式發行檢查會使用預設的最新已發佈套件基準；含有 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta 設定檔，會將 published-upgrade-survivor 掃描擴展到 `last-stable-4`，再加上釘選的 `2026.4.23`、`2026.5.2` 和 `2026.4.15` 基準，並包含 `reported-issues` 情境。對已發行的候選版本使用 `source=npm` 的套件驗收，對發佈前由 SHA 支援的本機 npm tarball 使用 `source=ref`，對維護者擁有的企業／私有鏡像使用 `source=trusted-url`，或對另一個 GitHub Actions 執行上傳的已準備 tarball 使用 `source=artifact`。

它是 GitHub 原生替代方案，可取代過去大多數需要 Parallels 的套件／更新覆蓋範圍。跨作業系統發行檢查對作業系統特定的 onboarding、安裝程式與平台行為仍然重要，但套件／更新產品驗證應優先使用套件驗收。

更新與外掛驗證的標準檢查清單是[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。在決定哪個本機、Docker、套件驗收或發行檢查路徑可證明外掛安裝／更新、doctor 清理，或已發佈套件遷移變更時，請使用它。從每個穩定 `2026.4.23+` 套件進行完整已發佈更新遷移，是獨立的手動 `Update Migration` 工作流程，不屬於完整發行 CI。

舊版 package-acceptance 寬容度刻意設有時間限制。到 `2026.4.25` 為止的套件，可能會針對已發佈到 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少私有 QA 庫存項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少已持久化的 `update.channel`、舊版外掛安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發佈的 `2026.4.26` 套件可能會針對已經發行的本機建置中繼資料戳記檔案提出警告。之後的套件必須符合現代套件合約；相同缺口會導致發行驗證失敗。

當發行問題關於實際可安裝套件時，使用更廣泛的套件驗收設定檔：

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

- `smoke`：快速套件安裝／頻道／代理、閘道網路與設定重新載入路徑
- `package`：安裝／更新／重啟／外掛套件合約，加上即時 ClawHub 技能安裝證明；這是發行檢查預設值
- `product`：`package` 加上 MCP 頻道、排程／子代理清理、OpenAI 網頁搜尋與 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：用於聚焦重跑的精確 `docker_lanes` 清單

針對套件候選版本的 Telegram 證明，請在套件驗收啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。工作流程會將已解析的 `package-under-test` tarball 傳入 Telegram 路徑；獨立 Telegram 工作流程仍接受已發佈的 npm 規格，用於發佈後檢查。

## 定期發行發佈自動化

對於 beta、`latest`、外掛、GitHub Release 與平台發佈，
`OpenClaw Release Publish` 是一般的變更入口點。每月
`.33+` 僅 npm 的 extended-stable 路徑不使用此協調器。一般工作流程會依照發行所需順序協調 trusted-publisher 工作流程：

1. 簽出發行標籤並解析其提交 SHA。
2. 驗證標籤可從 `main` 或 `release/*` 連到（或 alpha 預發行版可從 Tideclaw alpha 分支連到）。
3. 執行 `pnpm plugins:sync:check`。
4. 以 `publish_scope=all-publishable` 和 `ref=<release-sha>` 派送 `Plugin NPM Release`。
5. 以相同範圍和 SHA 派送 `Plugin ClawHub Release`。
6. 驗證已儲存的 `full_release_validation_run_id` 後，以發行標籤、npm dist-tag 和已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。
7. 對於穩定版發行，建立或更新 GitHub release 為草稿，使用明確的 `windows_node_tag` 和候選版本核准的 `windows_node_installer_digests` 派送 `Windows Node Release`，並在發佈草稿前驗證標準安裝程式／校驗和成品。

Beta 發佈範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

穩定版發佈到預設 beta dist-tag：

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

只有在聚焦修復或重新發佈工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流程。當 `publish_openclaw_npm=true` 時，`OpenClaw Release Publish` 會拒絕 `plugin_publish_scope=selected`，因此核心套件不能在沒有每個可發佈官方外掛（包括 `@openclaw/diffs-language-pack`）的情況下發行。若要修復選定外掛，請將 `publish_openclaw_npm=false` 搭配 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或直接派送子工作流程。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受下列由操作員控制的輸入：

- `tag`：必要發行標籤，例如 `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` 或 `v2026.4.2-alpha.1`；當 `preflight_only=true` 時，也可以是目前工作流程分支完整 40 字元提交 SHA，用於僅驗證的 preflight
- `preflight_only`：`true` 表示僅驗證／建置／封裝，`false` 表示真正發佈路徑
- `preflight_run_id`：既有成功 preflight 執行 ID；真正發佈路徑需要此項，讓工作流程重用已準備的 tarball，而不是重新建置
- `full_release_validation_run_id`：此標籤／SHA 的成功 `Full Release Validation` 執行 ID；真正發佈需要此項。Beta 發佈可以僅依靠 preflight 繼續並提出警告，但穩定版／`latest` 提升仍需要它。
- `release_publish_run_id`：已核准的 `OpenClaw Release Publish` 執行 ID；當此工作流程由該父工作流程派送時需要（bot-actor 真正發佈呼叫）
- `plugin_npm_run_id`：成功的 exact-head `Plugin NPM Release` 執行 ID；真正的 `extended-stable` 核心發佈需要此項
- `npm_dist_tag`：發佈路徑的 npm 目標標籤；接受 `alpha`、`beta`、`latest` 或 `extended-stable`，預設為 `beta`。最終 patch `33` 及之後必須使用 `extended-stable`；預設情況下，`extended-stable` 會拒絕更早的 patch，並且一律拒絕非最終標籤。
- `bypass_extended_stable_guard`：僅供測試的布林值，預設 `false`；搭配 `npm_dist_tag=extended-stable` 時，會略過每月 extended-stable 資格檢查，同時保留發行身分、成品、核准與回讀檢查。

`Plugin NPM Release` 接受 `npm_dist_tag=default` 用於既有發行行為，或接受 `npm_dist_tag=extended-stable` 用於受保護的每月路徑。extended-stable 選項需要 `publish_scope=all-publishable`、空的 `plugins` 輸入、等於或高於 `33` 的最終 patch，以及位於精確頂端的標準 `extended-stable/YYYY.M.33` 分支。它絕不移動外掛 `latest` 或 `beta`。新套件版本會透過 OIDC trusted publication（`npm publish --tag extended-stable`）以原子方式取得 `extended-stable`；此來源工作流程不使用 token 驗證的 `npm dist-tag add`。重試會略過 npm 中已存在的精確版本，然後除非完整回讀確認每個精確套件與 `extended-stable` 標籤都已收斂，否則會封閉失敗。

`OpenClaw Release Publish` 接受下列由操作員控制的輸入：

- `tag`：必要發行標籤；必須已經存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight 執行 ID；當 `publish_openclaw_npm=true` 時需要
- `full_release_validation_run_id`：成功的 `Full Release Validation` 執行 ID；當 `publish_openclaw_npm=true` 時需要
- `windows_node_tag`：精確的非預發行 `openclaw/openclaw-windows-node` 發行標籤；穩定版 OpenClaw 發佈需要此項
- `windows_node_installer_digests`：候選版本核准的精簡 JSON 映射，將目前 Windows 安裝程式名稱對應到其釘選的 `sha256:` 摘要；穩定版 OpenClaw 發佈需要此項
- `npm_telegram_run_id`：選用的成功 `NPM Telegram Beta E2E` 執行 ID，用於納入最終發行證據
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤，為 `alpha`、`beta` 或 `latest` 之一
- `plugin_publish_scope`：預設為 `all-publishable`；只有在搭配 `publish_openclaw_npm=false` 進行聚焦的僅外掛修復工作時，才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有在將工作流程作為僅外掛修復協調器使用時，才設為 `false`
- `release_profile`：用於發行證據摘要的發行覆蓋範圍設定檔；預設為 `from-validation`，會從驗證 manifest 讀取，或以 `beta`、`stable` 或 `full` 覆寫
- `wait_for_clawhub`：預設為 `false`，因此 npm 可用性不會被 ClawHub sidecar 阻擋；只有當工作流程完成必須包含 ClawHub 完成時，才設為 `true`

`OpenClaw Release Checks` 接受下列由操作員控制的輸入：

- `ref`：要驗證的分支、標籤或完整提交 SHA。帶有密鑰的檢查要求已解析提交可從 OpenClaw 分支或發行標籤連到。
- `run_release_soak`：選擇加入 beta 發行檢查的完整即時／E2E、Docker 發行路徑，以及 all-since upgrade-survivor soak。它會由 `release_profile=stable` 和 `release_profile=full` 強制啟用。

規則：

- 下方低於修補版 `33` 的一般最終版本與修正版可發布到 `beta` 或 `latest`。修補版 `33` 或以上的最終版本必須發布到 `extended-stable`，且該邊界上的修正尾碼版本會被拒絕。
- Beta 預發行標籤只能發布到 `beta`；alpha 預發行標籤只能發布到 `alpha`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許輸入完整提交 SHA
- `OpenClaw Release Checks` 與 `Full Release Validation` 永遠只用於驗證
- 真正的發布路徑必須使用預檢期間所用的同一個 `npm_dist_tag`；工作流程會在發布繼續前驗證該中繼資料

## 一般 beta/latest 穩定版發布序列

這個舊有序列適用於同時涵蓋外掛、GitHub Release、Windows 和其他平台工作的常規協調式發布。它不是本頁頂部記錄的每月 `.33+` npm-only extended-stable 路徑。

切出一般協調式穩定版本時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，你可以使用目前完整工作流程分支的提交 SHA，對預檢工作流程進行僅驗證的試執行。
2. 一般 beta 優先流程請選擇 `npm_dist_tag=beta`；只有在你刻意想要直接發布穩定版時，才使用 `latest`。
3. 當你想透過一個手動工作流程取得一般 CI 加上即時提示快取、Docker、QA Lab、Matrix 和 Telegram 覆蓋時，請在發布分支、發布標籤或完整提交 SHA 上執行 `Full Release Validation`。如果你刻意只需要確定性的常規測試圖，請改在發布參照上執行手動 `CI` 工作流程。
4. 選取精確的非預發行 `openclaw/openclaw-windows-node` 發布標籤，其已簽署的 x64 與 ARM64 安裝程式應隨版本發出。將它儲存為 `windows_node_tag`，並將它們經驗證的摘要對應儲存為 `windows_node_installer_digests`。發布候選輔助工具會記錄兩者，並將它們包含在產生的發布命令中。
5. 儲存成功的 `preflight_run_id` 與 `full_release_validation_run_id`。
6. 使用相同的 `tag`、相同的 `npm_dist_tag`、選定的 `windows_node_tag`、其已儲存的 `windows_node_installer_digests`、已儲存的 `preflight_run_id`，以及已儲存的 `full_release_validation_run_id` 執行 `OpenClaw Release Publish`。它會先將外部化外掛發布到 npm 與 ClawHub，再提升 OpenClaw npm 套件。
7. 如果版本落在 `beta`，請使用 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 提升到 `latest`。
8. 如果版本刻意直接發布到 `latest`，且 `beta` 應立即跟隨同一個穩定建置，請使用同一個發布工作流程將兩個 dist-tag 都指向該穩定版本，或讓其排程的自我修復同步稍後移動 `beta`。

dist-tag 變更位於發布帳本儲存庫中，因為它仍然需要 `NPM_TOKEN`，而原始碼儲存庫維持僅 OIDC 發布。這讓直接發布路徑與 beta 優先提升路徑都保有文件記錄，且讓操作員可見。

如果維護者必須改用本機 npm 驗證，請只在專用 tmux 工作階段內執行任何 1Password 命令列介面（`op`）命令。不要從主要代理 shell 直接呼叫 `op`；將它保持在 tmux 內，可讓提示、警示與 OTP 處理保持可觀察，並防止重複的主機警示。

## 公開參考

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

維護者使用 [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) 中的私人發布文件作為實際執行手冊。

## 相關

- [發布通道](/zh-TW/install/development-channels)
