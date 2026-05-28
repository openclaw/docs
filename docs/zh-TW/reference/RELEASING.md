---
read_when:
    - 正在尋找公開發行通道定義
    - 執行發布驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證框、版本命名與發布節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-12T08:46:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布通道：

- stable：帶標籤的發布版本，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發布標籤
- dev：`main` 的移動最新提交

## 版本命名

- Stable 發布版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- Stable 修正發布版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發布版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已推廣的 stable npm 發布版本
- `beta` 表示目前的 beta 安裝目標
- Stable 和 stable 修正發布版本預設發布到 npm `beta`；發布操作員可以明確指定 `latest`，或稍後推廣已審核的 beta 建置
- 每個 stable OpenClaw 發布版本都會一起發布 npm 套件和 macOS App；
  beta 發布版本通常會先驗證並發布 npm/套件路徑，而 mac App 建置/簽署/公證則保留給 stable，除非明確要求

## 發布節奏

- 發布採 beta 優先
- Stable 只會在最新 beta 完成驗證後跟進
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發布版本，
  讓發布驗證和修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發布後需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細發布流程、核准、憑證和復原備註僅限維護者使用

## 發布操作員檢查清單

這份檢查清單是發布流程的公開形式。私人憑證、
簽署、公證、dist-tag 復原和緊急回復細節會保留在
僅限維護者使用的發布操作手冊中。

1. 從目前 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` CI 足夠綠燈，可以從它建立分支。
2. 使用 `/changelog` 從真實提交歷史重寫頂部的 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交它、推送它，並在建立分支前再次 rebase/pull。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍受涵蓋時才移除過期相容性，或記錄為何刻意保留。
4. 從目前 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發布工作。
5. 為預期標籤更新所有必要版本位置，然後執行
   `pnpm release:prep`。它會依正確順序重新整理 Plugin 版本、Plugin 清單、設定
   schema、內建通道設定中繼資料、設定文件基準、Plugin SDK
   匯出，以及 Plugin SDK API 基準。在加標籤前提交任何產生的漂移。然後執行本機 deterministic 預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在前，
   可以使用完整 40 字元的發布分支 SHA 進行僅驗證的預檢。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 為發布分支、標籤或完整提交 SHA 啟動所有預發布測試。這是四個大型發布測試盒子的唯一手動入口點：Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正的最小失敗檔案、通道、workflow job、套件 profile、provider 或 model 允許清單。只有在變更的表面讓先前證據過期時，才重新執行完整 umbrella。
9. 對於 beta，標記 `vYYYY.M.D-beta.N`，然後從相符的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   將所有可發布的 Plugin 套件平行派送到 npm 和相同集合到
   ClawHub，然後在 Plugin npm 發布成功後，立即使用相符的 dist-tag 推廣已準備好的 OpenClaw npm 預檢 artifact。
   在 OpenClaw npm 發布子項成功後，它會從完整相符的
   `CHANGELOG.md` 區段建立或更新相符的 GitHub 發布/預發布頁面。發布到 npm `latest` 的 stable 發布版本會成為 GitHub 最新發布；保留在 npm `beta` 上的 stable 維護發布版本會以 GitHub `latest=false` 建立。
   ClawHub 發布在 OpenClaw npm 發布時可能仍在執行，但發布 workflow 會立即列印子 run ID。預設情況下，它在派送 ClawHub 後不會等待 ClawHub，因此 OpenClaw npm 可用性不會被較慢的 ClawHub 核准或 registry 工作阻塞；當 ClawHub 必須阻塞 workflow 完成時，請設定
   `wait_for_clawhub=true`。ClawHub 路徑會重試暫時性的 CLI 相依套件安裝失敗，即使某個預覽 cell 偶發失敗也會發布通過預覽的 Plugin，並以每個預期 Plugin 版本的 registry 驗證作結，讓部分發布保持可見且可重試。發布後，執行
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   以透過單一命令驗證 GitHub 預發布、npm `beta` dist-tag、npm integrity、
   已發布安裝路徑、ClawHub 精確版本、ClawHub artifact 和子 workflow 結論。當
   ClawHub sidecar 只在可重試 job 中失敗且應就地重新執行時，加入 `--rerun-failed-clawhub`。
   然後針對已發布的
   `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 套件執行發布後套件驗收。如果已推送或已發布的預發布需要修正，
   請切出下一個相符的預發布編號；不要刪除或重寫舊的預發布。
10. 對於 stable，只有在已審核的 beta 或發布候選具備所需驗證證據後才繼續。
    Stable npm 發布也會透過
    `OpenClaw Release Publish`，使用 `preflight_run_id` 重用成功的預檢 artifact；stable macOS 發布就緒也需要
    打包好的 `.zip`、`.dmg`、`.dSYM.zip` 和 `main` 上已更新的 `appcast.xml`。
    私有 macOS 發布 workflow 會在發布資產通過驗證後，自動將簽署的 appcast 發布到公開
    `main`；如果分支保護阻擋直接推送，它會開啟或更新 appcast PR。
11. 發布後，執行 npm 發布後驗證器、在需要發布後通道證據時執行選用的獨立
    已發布 npm Telegram E2E、視需要進行 dist-tag 推廣、驗證產生的 GitHub 發布頁面，
    並執行發布公告步驟。

## 發布預檢

- 在發行前預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 閘門之外仍維持涵蓋
- 在發行前預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機閘門之外保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發行成品與 Control UI 套件包存在，以供套件驗證步驟使用
- 在根版本提升後、標記前執行 `pnpm release:prep`。它會執行每個在版本、設定或 API 變更後常見漂移的確定性發行產生器：Plugin 版本、Plugin 清單、基礎設定結構描述、內建通道設定中繼資料、設定文件基準、Plugin SDK 匯出，以及 Plugin SDK API 基準。`pnpm release:check` 會以檢查模式重新執行這些防護，並在執行套件發行檢查前，一次回報它找到的所有已產生漂移失敗。
- 在發行核准前執行手動 `Full Release Validation` 工作流程，從單一進入點啟動所有發行前測試箱。它接受分支、標籤或完整提交 SHA，派發手動 `CI`，並派發 `OpenClaw Release Checks`，用於安裝冒煙、套件驗收、跨 OS 套件檢查、QA Lab 同等性、Matrix，以及 Telegram 路線。穩定版／預設執行會將完整即時／E2E 與 Docker 發行路徑浸泡測試保留在 `run_release_soak=true` 之後；`release_profile=full` 會強制開啟浸泡測試。使用 `release_profile=full` 與 `rerun_group=all` 時，它也會針對來自發行檢查的 `release-package-under-test` 成品執行套件 Telegram E2E。在發布 beta 後提供 `release_package_spec`，即可在發行檢查、Package Acceptance 與套件 Telegram E2E 中重用已出貨的 npm 套件，而不需重新建置發行 tarball。只有在 Telegram 應使用與其餘發行驗證不同的已發布套件時，才提供 `npm_telegram_package_spec`。當 Package Acceptance 應使用與發行套件規格不同的已發布套件時，提供 `package_acceptance_package_spec`。當私有證據報告應證明驗證符合已發布 npm 套件，但不強制執行 Telegram E2E 時，提供 `evidence_package_spec`。
  範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在發行工作繼續進行時，為套件候選版本取得旁路證明，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或精確發行版本使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支／標籤／SHA；對需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或對另一個 GitHub Actions 執行上傳的 tarball 使用 `source=artifact`。該工作流程會將候選項解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發行排程器，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 針對同一個 tarball 執行 Telegram QA。當選取的 Docker 路線包含 `published-upgrade-survivor` 時，套件成品就是候選項，而 `published_upgrade_survivor_baseline` 會選取已發布的基準。`update-restart-auth` 會將候選套件同時作為已安裝 CLI 與 package-under-test，因此會測試候選更新命令的受管理重新啟動路徑。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用設定檔：
  - `smoke`：安裝／通道／代理、Gateway 網路，以及設定重新載入路線
  - `package`：成品原生套件／更新／重新啟動／Plugin 路線，不含 OpenWebUI 或即時 ClawHub
  - `product`：套件設定檔加上 MCP 通道、cron／子代理清理、OpenAI 網頁搜尋，以及 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發行路徑區塊
  - `custom`：針對聚焦重新執行的精確 `docker_lanes` 選取
- 當你只需要發行候選版本的完整一般 CI 涵蓋時，直接執行手動 `CI` 工作流程。手動 CI 派發會略過變更範圍判定，並強制執行 Linux Node 分片、內建 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置冒煙、文件檢查、Python Skills、Windows、macOS、Android，以及 Control UI i18n 路線。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發行遙測時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器測試 QA-lab，並驗證匯出的追蹤 span 名稱、有界屬性，以及內容／識別碼遮蔽，不需要 Opik、Langfuse 或其他外部收集器。
- 每次標記發行前執行 `pnpm release:check`
- 在標籤存在後，執行 `OpenClaw Release Publish` 以進行會變更狀態的發布序列。從 `release/YYYY.M.D` 派發它（或在發布可從 `main` 觸及的標籤時從 `main` 派發），傳入發行標籤與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin 發布範圍 `all-publishable`，除非你刻意執行聚焦修復。該工作流程會序列化 Plugin npm 發布、Plugin ClawHub 發布與 OpenClaw npm 發布，讓核心套件不會在其外部化 Plugin 前發布。
- 發行檢查現在在獨立的手動工作流程中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發行核准前執行 QA Lab 模擬同等性路線，加上快速即時 Matrix 設定檔與 Telegram QA 路線。即時路線使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI 憑證租約。當你想要並行取得完整 Matrix 傳輸、媒體與 E2EE 清單時，使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` 工作流程。
- 跨 OS 安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，兩者會直接呼叫可重用工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這個拆分是刻意的：讓真正的 npm 發行路徑保持短小、確定且聚焦於成品，同時讓較慢的即時檢查留在自己的路線中，避免拖慢或阻擋發布
- 帶有秘密的發行檢查應透過 `Full Release Validation` 派發，或從 `main`／發行工作流程 ref 派發，讓工作流程邏輯與秘密維持受控
- `OpenClaw Release Checks` 接受分支、標籤或完整提交 SHA，只要解析出的提交可從 OpenClaw 分支或發行標籤觸及即可
- `OpenClaw NPM Release` 僅驗證前置預檢也接受目前完整 40 字元的工作流程分支提交 SHA，不需要已推送的標籤
- 該 SHA 路徑僅供驗證，不能提升為真正發布
- 在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發行標籤
- 兩個工作流程都將真正發布與提升路徑保留在 GitHub 託管 runner 上，而不變更狀態的驗證路徑可以使用較大的 Blacksmith Linux runner
- 該工作流程會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` 工作流程秘密
- npm 發行前置預檢不再等待獨立的發行檢查路線
- 在本機標記發行候選版本前，執行 `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`。該輔助程式會依照可在 GitHub 發布工作流程開始前捕捉常見核准阻擋錯誤的順序，執行快速發行防護、Plugin npm／ClawHub 發行檢查、建置、UI 建置，以及 `release:openclaw:npm:check`。
- 在核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta／修正版標籤）
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta／修正版版本），以在全新的暫存前綴中驗證已發布 registry 安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享的租用 Telegram 憑證池，針對已發布的 npm 套件驗證已安裝套件 onboarding、Telegram 設定，以及真實 Telegram E2E。本機維護者一次性執行可省略 Convex 變數，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` 環境憑證。
- 若要從維護者機器執行完整發布後 beta 冒煙測試，使用 `pnpm release:beta-smoke -- --beta betaN`。該輔助程式會執行 Parallels npm 更新／全新目標驗證、派發 `NPM Telegram Beta E2E`、輪詢精確工作流程執行、下載成品，並列印 Telegram 報告。
- 維護者也可以透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行相同的發布後檢查。它刻意僅限手動，不會在每次合併時執行。
- 維護者發行自動化現在使用先預檢再提升：
  - 真正的 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真正的 npm 發布必須從與成功預檢執行相同的 `main` 或 `release/YYYY.M.D` 分支派發
  - 穩定版 npm 發行預設為 `beta`
  - 穩定版 npm 發布可透過工作流程輸入明確目標為 `latest`
  - 基於 token 的 npm dist-tag 變更現在位於 `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` 以提高安全性，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開 repo 維持僅 OIDC 發布
  - 公開 `macOS Release` 僅供驗證；當標籤只存在於發行分支但工作流程從 `main` 派發時，設定 `public_release_branch=release/YYYY.M.D`
  - 真正的私有 mac 發布必須通過成功的私有 mac `preflight_run_id` 與 `validate_run_id`
  - 真正發布路徑會提升已準備好的成品，而不是再次重建它們
- 對於像 `YYYY.M.D-N` 這樣的穩定版修正發行，發布後驗證器也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同暫存前綴升級路徑，讓發行修正不會默默地讓較舊的全域安裝停留在基礎穩定版 payload
- 除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，否則 npm 發行前置預檢會封閉失敗，避免我們再次出貨空的瀏覽器儀表板
- 發布後驗證也會檢查已發布 Plugin 進入點與套件中繼資料是否存在於已安裝的 registry 配置中。若發行缺少 Plugin 執行階段 payload，會導致 postpublish 驗證器失敗，且不能提升為 `latest`。
- `pnpm test:install:smoke` 也會在候選更新 tarball 上強制執行 npm pack `unpackedSize` 預算，因此安裝器 e2e 會在發行發布路徑前捕捉意外的封裝膨脹
- 如果發行工作觸及 CI 規劃、extension 時序資訊清單或 extension 測試矩陣，請在核准前重新產生並審查 `.github/workflows/plugin-prerelease.yml` 中由規劃器擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，讓發行說明不會描述過期的 CI 版面
- 穩定版 macOS 發行就緒性也包含更新器表面：
  - GitHub 發行最終必須包含封裝好的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - 發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip；私有 macOS 發布工作流程會自動提交它，或在直接推送受阻時開啟 appcast PR
  - 封裝後的 App 必須保留非除錯 bundle id、非空的 Sparkle feed URL，以及高於或等於該發行版本正式 Sparkle 建置下限的 `CFBundleVersion`

## 發行測試環境

`Full Release Validation` 是操作人員從單一進入點啟動所有預發行測試的方式。若要在快速變動的分支上取得固定 commit 的證明，請使用這個 helper，讓每個子 workflow 都從固定在目標 SHA 的暫存分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

這個 helper 會推送 `release-ci/<sha>-...`，從該分支以 `ref=<sha>` 分派 `Full Release Validation`，驗證每個子 workflow 的 `headSha` 都符合目標，然後刪除暫存分支。這可避免意外證明較新的 `main` 子執行。

若要驗證發行分支或標籤，請從受信任的 `main` workflow ref 執行，並將發行分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

此 workflow 會解析目標 ref，以 `target_ref=<release-ref>` 分派手動 `CI`，分派 `OpenClaw Release Checks`，為面向套件的檢查準備父層 `release-package-under-test` artifact，並在 `release_profile=full` 且 `rerun_group=all`，或設定了 `release_package_spec` 或 `npm_telegram_package_spec` 時，分派獨立套件 Telegram E2E。接著 `OpenClaw Release Checks` 會展開安裝 smoke、跨 OS 發行檢查、啟用 soak 時的 live/E2E Docker 發行路徑涵蓋、Package Acceptance 搭配 Telegram 套件 QA、QA Lab parity、live Matrix，以及 live Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci` 和 `release_checks` 成功時，完整執行才可接受。在 full/all 模式下，`npm_telegram` 子項也必須成功；在 full/all 之外，除非提供了已發布的 `release_package_spec` 或 `npm_telegram_package_spec`，否則會跳過。最終 verifier 摘要包含每個子執行的最慢 job 表格，因此發行管理員不用下載 logs 就能看到目前的關鍵路徑。
請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、精確的 workflow job 名稱、stable 與 full profile 差異、artifacts，以及聚焦 rerun handles。
子 workflow 會從執行 `Full Release Validation` 的受信任 ref 分派，通常是 `--ref main`，即使目標 `ref` 指向較舊的發行分支或標籤也是如此。沒有獨立的 Full Release Validation workflow-ref 輸入；請透過選擇 workflow run ref 來選擇受信任的 harness。
不要使用 `--ref main -f ref=<sha>` 在移動中的 `main` 上做精確 commit 證明；原始 commit SHA 不能作為 workflow dispatch ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立固定的暫存分支。

使用 `release_profile` 選擇 live/provider 廣度：

- `minimum`：最快的發行關鍵 OpenAI/core live 與 Docker 路徑
- `stable`：minimum 加上用於發行核准的穩定 provider/backend 涵蓋
- `full`：stable 加上廣泛的 advisory provider/media 涵蓋

當發行阻塞 lanes 都是綠燈，且你想在 promotion 前執行完整 live/E2E、Docker 發行路徑，以及有界限的已發布升級存活 sweep 時，請搭配 `stable` 使用 `run_release_soak=true`。該 sweep 涵蓋最新四個 stable 套件，加上固定的 `2026.4.23` 和 `2026.5.2` baselines，以及較舊的 `2026.4.15` 涵蓋，並移除重複 baselines，且每個 baseline 都 sharding 到自己的 Docker runner job。`full` 會隱含 `run_release_soak=true`。

`OpenClaw Release Checks` 使用受信任的 workflow ref 將目標 ref 解析一次為 `release-package-under-test`，並在 soak 執行時，於跨 OS、Package Acceptance 和發行路徑 Docker 檢查中重用該 artifact。這能讓所有面向套件的 boxes 使用相同 bytes，並避免重複建置套件。
Beta 已經在 npm 上後，請設定 `release_package_spec=openclaw@YYYY.M.D-beta.N`，讓發行檢查下載一次已發布套件，從 `dist/build-info.json` 擷取其建置來源 SHA，並將該 artifact 重用於跨 OS、Package Acceptance、發行路徑 Docker，以及套件 Telegram lanes。
跨 OS OpenAI 安裝 smoke 會在設定 repo/org 變數時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此 lane 是在證明套件安裝、onboarding、Gateway 啟動，以及一次 live agent turn，而不是 benchmark 最慢的預設模型。較廣泛的 live provider 矩陣仍是模型特定涵蓋的所在位置。

請依照發行階段使用這些變體：

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
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
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要將完整 umbrella 作為聚焦修復後的第一次 rerun。如果某個測試環境失敗，下一次證明請使用失敗的子 workflow、job、Docker lane、套件 profile、模型 provider，或 QA lane。只有當修復變更了共用發行 orchestration，或讓較早的全 box 證據過期時，才再次執行完整 umbrella。umbrella 的最終 verifier 會重新檢查已記錄的子 workflow run ids，因此在子 workflow 成功 rerun 後，只需 rerun 失敗的 `Verify full validation` 父 job。

若要進行有界限的復原，請將 `rerun_group` 傳給 umbrella。`all` 是真正的發行候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行發行專用 Plugin 子項，`release-checks` 執行每個發行 box，而較窄的發行 groups 則是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` reruns 需要 `release_package_spec` 或 `npm_telegram_package_spec`；搭配 `release_profile=full` 的 full/all 執行會使用 release-checks 套件 artifact。聚焦的跨 OS reruns 可加入 `cross_os_suite_filter=windows/packaged-upgrade` 或另一個 OS/suite filter。QA release-check 失敗屬於 advisory；僅 QA 失敗不會阻塞發行驗證。

### Vitest

Vitest box 是手動 `CI` 子 workflow。手動 CI 會刻意略過 changed scoping，並強制執行發行候選的一般測試圖：Linux Node shards、bundled-plugin shards、channel contracts、Node 22 相容性、`check`、`check-additional`、build smoke、docs checks、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用此 box 回答「原始碼樹是否通過完整一般測試套件？」
它不同於發行路徑產品驗證。需要保留的證據：

- 顯示已分派 `CI` run URL 的 `Full Release Validation` 摘要
- `CI` run 在精確目標 SHA 上為綠燈
- 調查 regressions 時，來自 CI jobs 的失敗或緩慢 shard 名稱
- 當執行需要效能分析時，Vitest timing artifacts，例如 `.artifacts/vitest-shard-timings.json`

只有在發行需要 deterministic 一般 CI，但不需要 Docker、QA Lab、live、跨 OS 或套件 boxes 時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml`，再加上 release-mode `install-smoke` workflow。它會透過已封裝的 Docker environments 驗證發行候選，而不只是 source-level tests。

發行 Docker 涵蓋包括：

- 啟用慢速 Bun global install smoke 的完整安裝 smoke
- 依目標 SHA 準備/重用 root Dockerfile smoke image，且 QR、root/gateway，以及 installer/Bun smoke jobs 作為獨立 install-smoke shards 執行
- repository E2E lanes
- 發行路徑 Docker chunks：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 請求時在 `plugins-runtime-services` chunk 內執行 OpenWebUI 涵蓋
- 拆分的 bundled Plugin install/uninstall lanes，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發行檢查包含 live suites 時，live/E2E provider suites 和 Docker live model 涵蓋

rerun 前請先使用 Docker artifacts。發行路徑 scheduler 會上傳 `.artifacts/docker-tests/`，其中包含 lane logs、`summary.json`、`failures.json`、phase timings、scheduler plan JSON，以及 rerun commands。若要聚焦復原，請在 reusable live/E2E workflow 上使用 `docker_lanes=<lane[,lane]>`，而不是 rerun 所有發行 chunks。產生的 rerun commands 會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker image inputs，因此失敗 lane 可以重用相同 tarball 和 GHCR images。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為和 channel-level 的發行 gate，與 Vitest 和 Docker 套件機制分開。

發行 QA Lab 涵蓋包括：

- mock parity lane，使用 agentic parity pack，比較 OpenAI candidate lane 與 Opus 4.6 baseline
- 使用 `qa-live-shared` environment 的快速 live Matrix QA profile
- 使用 Convex CI credential leases 的 live Telegram QA lane
- 當發行 telemetry 需要明確本機證明時執行 `pnpm qa:otel:smoke`

使用此 box 回答「發行版是否在 QA scenarios 和 live channel flows 中正確運作？」
核准發行時，請保留 parity、Matrix 和 Telegram lanes 的 artifact URLs。完整 Matrix 涵蓋仍可作為手動 sharded QA-Lab run 使用，而不是預設的發行關鍵 lane。

### 套件

套件 box 是可安裝產品 gate。它由 `Package Acceptance` 和 resolver `scripts/resolve-openclaw-package-candidate.mjs` 支援。resolver 會將 candidate 正規化為 Docker E2E 使用的 `package-under-test` tarball，驗證套件 inventory，記錄套件版本和 SHA-256，並保持 workflow harness ref 與套件來源 ref 分離。

支援的 candidate sources：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本
- `source=ref`：使用選定的 `workflow_ref` harness 打包受信任的 `package_ref` 分支、標籤，或完整 commit SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重用另一個 GitHub Actions run 上傳的 `.tgz`

`OpenClaw Release Checks` 會以 `source=artifact`、已準備好的發行套件成品、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、
`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對同一個已解析的
tarball 保持遷移、更新、已設定驗證的更新重啟、即時 ClawHub skill 安裝、過期 Plugin 相依清理、離線 Plugin
fixtures、Plugin 更新，以及 Telegram 套件 QA。阻擋式發行檢查會使用預設的最新已發布套件基準；
`run_release_soak=true` 或
`release_profile=full` 會擴展到從 `2026.4.23` 到 `latest` 的每個穩定 npm 已發布基準，
再加上已回報問題的 fixtures。對於已出貨的候選版本，請使用
`source=npm` 的 Package Acceptance；對於發布前由 SHA 支援的本機 npm tarball，請使用
`source=ref`/`source=artifact`。這是大部分過去需要
Parallels 的套件/更新涵蓋範圍在 GitHub 原生環境中的替代方案。跨 OS 發行檢查對於 OS 特定的初始設定、
安裝程式與平台行為仍然重要，但套件/更新產品驗證應優先使用 Package Acceptance。

更新與 Plugin 驗證的權威檢查清單是
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。在判斷哪個本機、Docker、Package Acceptance
或發行檢查 lane 能證明 Plugin 安裝/更新、doctor 清理或已發布套件遷移變更時，請使用它。
從每個穩定 `2026.4.23+` 套件進行的完整已發布更新遷移，是獨立的手動 `Update Migration`
workflow，不屬於 Full Release CI。

舊版 package-acceptance 寬容度刻意有時間限制。直到 `2026.4.25` 的套件，對已發布到 npm 的中繼資料缺口可使用相容性路徑：
tarball 中缺少私有 QA inventory 項目、缺少
`gateway install --wrapper`、tarball 衍生 git
fixture 中缺少修補檔、缺少已持久化的 `update.channel`、舊版 Plugin 安裝記錄位置、缺少 marketplace
安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26`
套件可能會針對已出貨的本機建置中繼資料 stamp 檔發出警告。之後的套件必須符合現代套件合約；
相同缺口會使發行驗證失敗。

當發行問題關於實際可安裝套件時，請使用更廣的 Package Acceptance profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常見套件 profile：

- `smoke`：快速套件安裝/channel/agent、Gateway 網路與設定重新載入 lanes
- `package`：安裝/更新/重啟/Plugin 套件合約，加上即時 ClawHub skill 安裝證明；這是發行檢查預設值
- `product`：`package` 加上 MCP channels、cron/subagent 清理、OpenAI 網頁搜尋與 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：用於聚焦重新執行的精確 `docker_lanes` 清單

對於套件候選版本的 Telegram 證明，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。workflow 會把已解析的
`package-under-test` tarball 傳入 Telegram lane；獨立 Telegram workflow 仍接受已發布的 npm spec
用於發布後檢查。

## 發行發布自動化

`OpenClaw Release Publish` 是一般的變更性發布進入點。它會依照發行需求的順序協調 trusted-publisher workflow：

1. 簽出發行標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 抵達。
3. 執行 `pnpm plugins:sync:check`。
4. 以 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 派送 `Plugin NPM Release`。
5. 使用相同 scope 與 SHA 派送 `Plugin ClawHub Release`。
6. 使用發行標籤、npm dist-tag 與已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。

Beta 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

發布穩定版到預設 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

直接提升穩定版到 `latest` 必須明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflow。
對於指定的 Plugin 修復，請將
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`；或在不得發布 OpenClaw 套件時，直接派送子 workflow。

## NPM workflow 輸入

`OpenClaw NPM Release` 接受以下由操作者控制的輸入：

- `tag`：必要發行標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，它也可以是目前完整 40 字元 workflow 分支 commit SHA，
  用於僅驗證的 preflight
- `preflight_only`：`true` 表示僅驗證/建置/打包，`false` 表示真正的發布路徑
- `preflight_run_id`：真正發布路徑上必要，讓 workflow 重用成功 preflight 執行產生的已準備 tarball
- `npm_dist_tag`：發布路徑的 npm 目標 tag；預設為 `beta`

`OpenClaw Release Publish` 接受以下由操作者控制的輸入：

- `tag`：必要發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight run id；
  當 `publish_openclaw_npm=true` 時為必要
- `npm_dist_tag`：OpenClaw 套件的 npm 目標 tag
- `plugin_publish_scope`：預設為 `all-publishable`；只有聚焦修復工作才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，為逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有把 workflow 作為僅 Plugin 修復協調器使用時，才設為 `false`
- `wait_for_clawhub`：預設為 `false`，因此 npm 可用性不會被 ClawHub sidecar 阻擋；
  只有當 workflow 完成必須包含 ClawHub 完成時，才設為 `true`

`OpenClaw Release Checks` 接受以下由操作者控制的輸入：

- `ref`：要驗證的分支、標籤或完整 commit SHA。帶有 secret 的檢查要求已解析 commit
  可從 OpenClaw 分支或發行標籤抵達。
- `run_release_soak`：在穩定版/預設發行檢查中選擇啟用完整 live/E2E、Docker 發行路徑，以及
  all-since upgrade-survivor soak。它會由 `release_profile=full` 強制啟用。

規則：

- 穩定版與修正版標籤可以發布到 `beta` 或 `latest`
- Beta prerelease 標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有當 `preflight_only=true` 時才允許完整 commit SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律僅用於驗證
- 真正的發布路徑必須使用 preflight 期間使用的同一個 `npm_dist_tag`；
  workflow 會在發布繼續前驗證該中繼資料

## 穩定 npm 發行順序

建立穩定 npm 發行時：

1. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在前，你可以使用目前完整 workflow 分支 commit SHA，對 preflight workflow 執行僅驗證的 dry run
2. 一般 beta-first 流程選擇 `npm_dist_tag=beta`；只有在你刻意要直接發布穩定版時，才選擇 `latest`
3. 當你想從單一手動 workflow 取得一般 CI 加上 live prompt cache、Docker、QA Lab、Matrix 與 Telegram 涵蓋範圍時，
   請在發行分支、發行標籤或完整 commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要確定性的正常測試圖，請改在發行 ref 上執行手動 `CI` workflow
5. 儲存成功的 `preflight_run_id`
6. 使用相同 `tag`、相同 `npm_dist_tag` 與已儲存的 `preflight_run_id` 執行
   `OpenClaw Release Publish`；它會先將外部化 Plugin 發布到 npm 和 ClawHub，再提升 OpenClaw npm 套件
7. 如果發行落在 `beta`，請使用私有
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發行是刻意直接發布到 `latest`，且 `beta` 應立即跟隨同一個穩定建置，請使用同一個私有
   workflow，將兩個 dist-tags 都指向該穩定版本；或讓其排程自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中是基於安全性，因為它仍然需要 `NPM_TOKEN`，
而 public repo 則維持僅 OIDC 發布。

這能讓直接發布路徑與 beta-first 提升路徑都保有文件化，並對操作者可見。

如果維護者必須退回使用本機 npm 驗證，請只在專用 tmux session 內執行任何 1Password
CLI (`op`) 命令。不要從主要 agent shell 直接呼叫 `op`；將它保留在 tmux 內可讓提示、
警示與 OTP 處理可觀測，並防止重複的主機警示。

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

維護者會使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有發行文件作為實際 runbook。

## 相關

- [發行 channels](/zh-TW/install/development-channels)
