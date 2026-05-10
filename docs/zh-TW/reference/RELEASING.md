---
read_when:
    - 正在尋找公開發布通道定義
    - 執行發行驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布軌道、操作員檢查清單、驗證方塊、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-10T19:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布軌道：

- stable：已標記的發布，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發布標籤
- dev：`main` 的移動中最新版本

## 版本命名

- 穩定發布版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定修正發布版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發布版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已升級推廣的穩定 npm 發布
- `beta` 表示目前的 beta 安裝目標
- 穩定和穩定修正發布預設發布到 npm `beta`；發布操作員可以明確指定 `latest`，或稍後升級推廣已審核的 beta 建置
- 每個穩定 OpenClaw 發布都會同時交付 npm 套件和 macOS 應用程式；
  beta 發布通常會先驗證並發布 npm/套件路徑，mac 應用程式的建置/簽署/公證則保留給穩定發布，除非另有明確要求

## 發布節奏

- 發布採 beta 優先
- 只有在最新 beta 驗證完成後才會進入穩定發布
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發布，
  讓發布驗證和修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊 beta 標籤
- 詳細發布程序、核准、憑證和復原注意事項僅限維護者使用

## 發布操作員檢查清單

此檢查清單是發布流程的公開形態。私人憑證、
簽署、公證、dist-tag 復原和緊急回復細節保留在
僅限維護者使用的發布操作手冊中。

1. 從目前 `main` 開始：拉取最新內容，確認目標 commit 已推送，
   並確認目前 `main` 的 CI 綠燈狀態足以從它建立分支。
2. 使用 `/changelog` 根據真實 commit 歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交、推送，並在建立分支前再 rebase/pull 一次。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍有涵蓋時才移除過期相容性，或記錄為何有意保留。
4. 從目前 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發布工作。
5. 針對預期標籤更新每個必要的版本位置，然後執行
   `pnpm release:prep`。它會以正確順序重新整理 plugin 版本、plugin 清單、設定結構描述、內建通道設定中繼資料、設定文件基準、plugin SDK 匯出，以及 plugin SDK API 基準。在標記前提交任何產生的差異。接著執行本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在前，
   允許使用完整 40 字元的發布分支 SHA 進行僅驗證預檢。儲存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 對發布分支、標籤或完整 commit SHA 啟動所有預發布測試。這是四個大型發布測試箱的單一手動進入點：Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正的最小失敗檔案、軌道、工作流程作業、套件設定檔、提供者或模型允許清單。只有在變更表面讓先前證據過期時，才重新執行完整 umbrella。
9. 對於 beta，標記 `vYYYY.M.D-beta.N`，然後從相符的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   將所有可發布的 plugin 套件平行派送到 npm 和相同集合到
   ClawHub，然後在 plugin npm 發布成功後，立即使用相符的 dist-tag 升級推廣已準備好的 OpenClaw npm 預檢成品。
   OpenClaw npm 發布子項成功後，它會從完整相符的
   `CHANGELOG.md` 區段建立或更新相符的 GitHub release/prerelease 頁面。發布到 npm `latest` 的穩定發布會成為
   GitHub latest release；保留在 npm `beta` 的穩定維護發布會以 GitHub `latest=false` 建立。
   OpenClaw npm 發布時 ClawHub 發布可能仍在執行，但發布工作流程會立即列印子執行 ID。預設情況下，它在派送後不會等待 ClawHub，因此 OpenClaw npm 可用性不會被較慢的 ClawHub 核准或 registry 工作阻塞；當 ClawHub 必須阻塞工作流程完成時，請設定
   `wait_for_clawhub=true`。ClawHub 路徑會重試暫時性的 CLI 相依性安裝失敗，即使某個預覽儲存格出現 flake，也會發布通過預覽的 plugin，並以每個預期 plugin 版本的 registry 驗證收尾，讓部分發布保持可見且可重試。發布後，針對已發布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 套件執行發布後套件
   驗收。如果已推送或已發布的預發布需要修正，
   請切出下一個相符的預發布編號；不要刪除或重寫舊預發布。
10. 對於穩定發布，只有在已審核的 beta 或 release candidate 具備
    必要驗證證據後才繼續。穩定 npm 發布也會透過
    `OpenClaw Release Publish` 進行，並透過
    `preflight_run_id` 重用成功的預檢成品；穩定 macOS 發布就緒也需要
    `main` 上的已封裝 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`。
    私有 macOS 發布工作流程會在發布資產驗證後，自動將已簽署的 appcast 發布到公開
    `main`；如果分支保護阻止直接推送，它會開啟或更新 appcast PR。
11. 發布後，執行 npm 發布後驗證器、在需要發布後通道證明時執行可選的獨立已發布 npm Telegram E2E、
    視需要進行 dist-tag 升級推廣、驗證產生的 GitHub 發布頁面，
    並執行發布公告步驟。

## 發布預檢

- 在發行預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 關卡之外也保持涵蓋
- 在發行預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機關卡之外也保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發行成品和控制 UI 套件存在，以供封裝驗證步驟使用
- 在根版本提升後、標記前執行 `pnpm release:prep`。它會執行每個在版本、設定或 API 變更後常見漂移的確定性發行產生器：Plugin 版本、Plugin 庫存、基礎設定結構描述、內建頻道設定中繼資料、設定文件基準線、Plugin SDK 匯出，以及 Plugin SDK API 基準線。`pnpm release:check` 會以檢查模式重新執行這些防護，並在執行套件發行檢查前，於一次通過中回報它找到的每個產生成果漂移失敗。
- 在發行核准前執行手動 `Full Release Validation` workflow，從單一進入點啟動所有發行前測試箱。它接受分支、標籤或完整 commit SHA，派發手動 `CI`，並針對安裝冒煙、套件接受度、跨 OS 套件檢查、QA Lab parity、Matrix 和 Telegram 路徑派發 `OpenClaw Release Checks`。穩定版/預設執行會把完整即時/E2E 與 Docker 發行路徑 soak 保留在 `run_release_soak=true` 後方；`release_profile=full` 會強制啟用 soak。搭配 `release_profile=full` 和 `rerun_group=all` 時，它也會針對 release checks 的 `release-package-under-test` 成品執行套件 Telegram E2E。發布後若同一個 Telegram E2E 也應證明已發布的 npm 套件，請提供 `npm_telegram_package_spec`。發布後若 Package Acceptance 應針對已出貨的 npm 套件，而不是 SHA 建置成品，執行其套件/更新矩陣，請提供 `package_acceptance_package_spec`。當私有證據報告應證明驗證符合已發布的 npm 套件、但不強制執行 Telegram E2E 時，請提供 `evidence_package_spec`。範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在發行工作繼續進行時，為套件候選項取得旁路證據，請執行手動 `Package Acceptance` workflow。對 `openclaw@beta`、`openclaw@latest` 或精確發行版本使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` harness 封裝受信任的 `package_ref` 分支/標籤/SHA；對需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或對另一個 GitHub Actions 執行上傳的 tarball 使用 `source=artifact`。此 workflow 會將候選項解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發行排程器，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對相同 tarball 執行 Telegram QA。當選取的 Docker 路徑包含 `published-upgrade-survivor` 時，套件成品就是候選項，而 `published_upgrade_survivor_baseline` 會選取已發布的基準線。`update-restart-auth` 會將候選套件同時作為已安裝 CLI 與 package-under-test，因此它會演練候選更新命令的受管理重新啟動路徑。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見 profile：
  - `smoke`：安裝/頻道/代理、Gateway 網路，以及設定重新載入路徑
  - `package`：無 OpenWebUI 或即時 ClawHub 的成品原生套件/更新/重新啟動/Plugin 路徑
  - `product`：套件 profile 加上 MCP 頻道、Cron/子代理清理、OpenAI 網頁搜尋，以及 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發行路徑區塊
  - `custom`：用於聚焦重新執行的精確 `docker_lanes` 選取
- 當你只需要發行候選項的完整一般 CI 涵蓋時，直接執行手動 `CI` workflow。手動 CI 派發會略過變更範圍界定，並強制執行 Linux Node shards、內建 Plugin shards、頻道契約、Node 22 相容性、`check`、`check-additional`、建置冒煙、文件檢查、Python Skills、Windows、macOS、Android，以及控制 UI i18n 路徑。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發行遙測時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器演練 QA-lab，並驗證匯出的 trace span 名稱、受界定的屬性，以及內容/識別碼遮蔽，而不需要 Opik、Langfuse 或其他外部收集器。
- 在每個已標記發行前執行 `pnpm release:check`
- 標籤存在後，為會變更狀態的發布序列執行 `OpenClaw Release Publish`。從 `release/YYYY.M.D` 派發它（或在發布可從 main 觸及的標籤時從 `main` 派發），傳入發行標籤和成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin 發布範圍 `all-publishable`，除非你刻意執行聚焦修復。此 workflow 會序列化 Plugin npm 發布、Plugin ClawHub 發布，以及 OpenClaw npm 發布，因此核心套件不會早於其外部化 Plugin 發布。
- Release checks 現在在獨立的手動 workflow 中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發行核准前執行 QA Lab mock parity 路徑，加上快速即時 Matrix profile 和 Telegram QA 路徑。即時路徑使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI 認證租約。當你想平行取得完整 Matrix 傳輸、媒體和 E2EE 庫存時，請以 `matrix_profile=all` 和 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- 跨 OS 安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，它們會直接呼叫可重用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這項拆分是刻意的：讓真正的 npm 發行路徑保持短、確定性且聚焦成品，而較慢的即時檢查留在自己的路徑中，避免拖慢或阻擋發布
- 帶有秘密的 release checks 應透過 `Full Release
Validation` 派發，或從 `main`/release workflow ref 派發，讓 workflow 邏輯與秘密維持受控
- `OpenClaw Release Checks` 接受分支、標籤或完整 commit SHA，只要解析出的 commit 可從 OpenClaw 分支或發行標籤觸及
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元 workflow 分支 commit SHA，而不要求推送的標籤
- 該 SHA 路徑僅供驗證，不能提升為真正發布
- 在 SHA 模式中，workflow 只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發行標籤
- 兩個 workflow 都把真正發布與提升路徑保留在 GitHub 託管 runner 上，而非變更型驗證路徑可使用較大的 Blacksmith Linux runner
- 該 workflow 會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` workflow secrets
- npm 發行預檢不再等待獨立的 release checks 路徑
- 在核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/修正版標籤）
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/修正版版本），以在全新的暫存 prefix 中驗證已發布 registry 安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租用 Telegram 認證池，針對已發布 npm 套件驗證已安裝套件 onboarding、Telegram 設定，以及真實 Telegram E2E。本機維護者一次性執行可省略 Convex 變數，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env 認證。
- 若要從維護者機器執行完整發布後 beta 冒煙，請使用 `pnpm release:beta-smoke -- --beta betaN`。此 helper 會執行 Parallels npm 更新/全新目標驗證、派發 `NPM Telegram Beta E2E`、輪詢精確的 workflow 執行、下載成品，並列印 Telegram 報告。
- 維護者可透過手動 `NPM Telegram Beta E2E` workflow，從 GitHub Actions 執行相同的發布後檢查。它刻意僅限手動，不會在每次合併時執行。
- 維護者發行自動化現在使用預檢後提升：
  - 真正的 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真正的 npm 發布必須從與成功預檢執行相同的 `main` 或 `release/YYYY.M.D` 分支派發
  - 穩定版 npm 發行預設為 `beta`
  - 穩定版 npm 發布可透過 workflow 輸入明確指定 `latest`
  - 基於 token 的 npm dist-tag 變更現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以符合安全性，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開 repo 保持僅 OIDC 發布
  - 公開 `macOS Release` 僅供驗證；當標籤只存在於發行分支，但 workflow 從 `main` 派發時，設定 `public_release_branch=release/YYYY.M.D`
  - 真正的私有 Mac 發布必須通過成功的私有 Mac `preflight_run_id` 和 `validate_run_id`
  - 真正的發布路徑會提升已準備好的成品，而不是再次重新建置它們
- 對於像 `YYYY.M.D-N` 這樣的穩定版修正發行，發布後驗證器也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同暫存 prefix 升級路徑，讓發行修正不能無聲地讓較舊的全域安裝停留在基礎穩定版 payload
- npm 發行預檢會失敗關閉，除非 tarball 同時包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，避免我們再次出貨空白瀏覽器 dashboard
- 發布後驗證也會檢查已發布 Plugin 進入點和套件中繼資料是否存在於已安裝 registry 版面中。若發行缺少 Plugin 執行階段 payload，會使 postpublish 驗證器失敗，且無法提升到 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，因此 installer e2e 會在發行發布路徑前捕捉意外的封裝膨脹
- 如果發行工作觸及 CI 規劃、Plugin 時序 manifest，或 Plugin 測試矩陣，請在核准前重新產生並審閱 `.github/workflows/plugin-prerelease.yml` 中由 planner 擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，避免發行說明描述過時的 CI 版面
- 穩定版 macOS 發行就緒也包含 updater 表面：
  - GitHub release 最終必須包含封裝好的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip；私有 macOS 發布 workflow 會自動 commit 它，或在直接推送受阻時開啟 appcast PR
  - 封裝好的 app 必須保留非除錯 bundle id、非空 Sparkle feed URL，以及等於或高於該發行版本 canonical Sparkle build floor 的 `CFBundleVersion`

## 發行測試箱

`Full Release Validation` 是操作員從單一進入點啟動所有發行前測試的方式。若要在快速移動的分支上取得釘選 commit 證明，請使用 helper，讓每個子 workflow 都從固定於目標 SHA 的暫時分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

此輔助工具會推送 `release-ci/<sha>-...`，從該分支以 `ref=<sha>` 分派 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，然後刪除暫時分支。這可避免意外驗證較新的 `main` 子執行。

若要驗證發布分支或標籤，請從受信任的 `main` 工作流程 ref 執行，並將發布分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

此工作流程會解析目標 ref，以 `target_ref=<release-ref>` 分派手動 `CI`，分派 `OpenClaw Release Checks`，為面向套件的檢查準備父層 `release-package-under-test` 成品，並且在 `release_profile=full` 且 `rerun_group=all`，或設定 `npm_telegram_package_spec` 時，分派獨立的套件 Telegram E2E。接著 `OpenClaw Release Checks` 會展開安裝煙霧測試、跨作業系統發布檢查、啟用 soak 時的 live/E2E Docker 發布路徑覆蓋、包含 Telegram 套件 QA 的 Package Acceptance、QA Lab 對等性、即時 Matrix 與即時 Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci` 和 `release_checks` 成功時，完整執行才可接受。在 full/all 模式下，`npm_telegram` 子項也必須成功；在 full/all 之外，除非提供已發布的 `npm_telegram_package_spec`，否則會跳過。最終驗證器摘要包含每個子執行的最慢工作表格，因此發布管理員無需下載記錄即可查看目前的關鍵路徑。
請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、精確的工作流程工作名稱、stable 與 full 設定檔差異、成品，以及聚焦重新執行控制項。
子工作流程會從執行 `Full Release Validation` 的受信任 ref 分派，通常是 `--ref main`，即使目標 `ref` 指向較舊的發布分支或標籤也一樣。沒有獨立的 Full Release Validation 工作流程 ref 輸入；請透過選擇工作流程執行 ref 來選擇受信任的測試框架。
不要使用 `--ref main -f ref=<sha>` 對移動中的 `main` 做精確提交證明；原始提交 SHA 不能作為工作流程分派 ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立固定的暫時分支。

使用 `release_profile` 選擇 live/provider 廣度：

- `minimum`：最快的發布關鍵 OpenAI/核心 live 與 Docker 路徑
- `stable`：minimum 加上用於發布核准的穩定 provider/backend 覆蓋
- `full`：stable 加上廣泛的諮詢性 provider/media 覆蓋

當發布阻擋路徑都為綠燈，且你想在提升前執行詳盡的 live/E2E、Docker 發布路徑，以及有界限的已發布升級倖存者掃描時，請搭配 `stable` 使用 `run_release_soak=true`。該掃描涵蓋最新四個穩定套件，加上固定的 `2026.4.23` 與 `2026.5.2` 基準，再加上較舊的 `2026.4.15` 覆蓋，並移除重複基準，且每個基準都分片到自己的 Docker runner 工作。`full` 隱含 `run_release_soak=true`。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將目標 ref 解析一次為 `release-package-under-test`，並在 soak 執行時於跨作業系統、Package Acceptance 與發布路徑 Docker 檢查中重用該成品。這讓所有面向套件的機器都使用相同位元組，並避免重複建置套件。
跨作業系統 OpenAI 安裝煙霧測試會在設定 repo/org 變數時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此路徑是在證明套件安裝、onboarding、Gateway 啟動，以及一次即時 agent 回合，而不是對最慢的預設模型做基準測試。更廣泛的即時 provider 矩陣仍是模型特定覆蓋的位置。

依發布階段使用以下變體：

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要把完整 umbrella 作為聚焦修正後的第一次重新執行。如果某個 box 失敗，下一次證明請使用失敗的子工作流程、工作、Docker 路徑、套件設定檔、模型 provider 或 QA 路徑。只有當修正變更了共享發布協調，或使先前的全 box 證據過期時，才再次執行完整 umbrella。umbrella 的最終驗證器會重新檢查已記錄的子工作流程執行 ID，因此在子工作流程成功重新執行後，只需重新執行失敗的 `Verify full validation` 父層工作。

若要有界限地復原，請將 `rerun_group` 傳給 umbrella。`all` 是真正的發布候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行僅發布用的 Plugin 子項，`release-checks` 執行每個發布 box，而較窄的發布群組是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重新執行需要 `npm_telegram_package_spec`；搭配 `release_profile=full` 的 full/all 執行會使用 release-checks 套件成品。聚焦的跨作業系統重新執行可以新增 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統/套件過濾器。QA release-check 失敗屬於諮詢性質；僅 QA 失敗不會阻擋發布驗證。

### Vitest

Vitest box 是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍限定，並強制對發布候選執行一般測試圖：Linux Node 分片、bundled-plugin 分片、channel contracts、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用此 box 回答「原始碼樹是否通過完整的一般測試套件？」它不同於發布路徑產品驗證。需要保留的證據：

- `Full Release Validation` 摘要，顯示已分派的 `CI` 執行 URL
- `CI` 執行在精確目標 SHA 上為綠燈
- 調查回歸時來自 CI 工作的失敗或緩慢分片名稱
- 需要效能分析時的 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發布需要確定性的一般 CI，但不需要 Docker、QA Lab、live、跨作業系統或套件 box 時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位於 `OpenClaw Release Checks`，透過 `openclaw-live-and-e2e-checks-reusable.yml`，以及發布模式的 `install-smoke` 工作流程。它會透過封裝的 Docker 環境驗證發布候選，而不只做原始碼層級測試。

發布 Docker 覆蓋包含：

- 啟用慢速 Bun 全域安裝煙霧測試的完整安裝煙霧測試
- 依目標 SHA 準備/重用根 Dockerfile 煙霧映像，QR、root/gateway，以及 installer/Bun 煙霧工作會作為獨立 install-smoke 分片執行
- repository E2E 路徑
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 要求時，`plugins-runtime-services` 區塊內的 OpenWebUI 覆蓋
- 分割的 bundled Plugin 安裝/解除安裝路徑，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當 release checks 包含 live 套件時的 live/E2E provider 套件與 Docker live 模型覆蓋

重新執行前先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含路徑記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重新執行命令。若要聚焦復原，請在可重用 live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有發布區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker 映像輸入，因此失敗路徑可以重用相同的 tarball 與 GHCR 映像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為與 channel 層級的發布 gate，與 Vitest 和 Docker 套件機制分開。

發布 QA Lab 覆蓋包含：

- 使用 agentic parity pack，將 OpenAI 候選路徑與 Opus 4.6 基準比較的模擬對等路徑
- 使用 `qa-live-shared` 環境的快速即時 Matrix QA 設定檔
- 使用 Convex CI 認證租約的即時 Telegram QA 路徑
- 當發布遙測需要明確本機證明時的 `pnpm qa:otel:smoke`

使用此 box 回答「發布在 QA 場景與即時 channel 流程中是否行為正確？」核准發布時，請保留 parity、Matrix 和 Telegram 路徑的成品 URL。完整 Matrix 覆蓋仍可作為手動分片 QA-Lab 執行使用，而不是預設的發布關鍵路徑。

### Package

Package box 是可安裝產品 gate。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選標準化為 Docker E2E 使用的 `package-under-test` tarball，驗證套件清單，記錄套件版本與 SHA-256，並讓工作流程測試框架 ref 與套件來源 ref 分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本
- `source=ref`：以選定的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會讓遷移、更新、已設定 auth 的更新重新啟動、即時 ClawHub skill 安裝、過期 Plugin 依賴清理、離線 Plugin fixtures、Plugin 更新，以及 Telegram 套件 QA 使用相同解析後的 tarball。阻擋發布的檢查使用預設的最新已發布套件基準；`run_release_soak=true` 或 `release_profile=full` 會擴展為從 `2026.4.23` 到 `latest` 的每個穩定 npm 已發布基準，加上已回報議題 fixtures。對已出貨候選使用搭配 `source=npm` 的 Package Acceptance，或在發布前對 SHA 支援的本機 npm tarball 使用 `source=ref`/`source=artifact`。它是先前多數需要 Parallels 的套件/更新覆蓋的 GitHub 原生替代方案。跨作業系統發布檢查對於作業系統特定的 onboarding、installer 與平台行為仍然重要，但套件/更新產品驗證應優先使用 Package Acceptance。

更新與 Plugin 驗證的標準檢查清單是
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。在判斷哪個本機、Docker、Package Acceptance 或 release-check lane 能證明
Plugin 安裝/更新、doctor 清理，或已發布套件遷移變更時，請使用它。
從每個穩定版 `2026.4.23+` 套件進行的完整已發布更新遷移，
是獨立的手動 `Update Migration` 工作流程，不屬於 Full Release CI。

舊版 package-acceptance 寬容性是刻意設定時限的。到
`2026.4.25` 為止的套件，對於已發布到 npm 的 metadata 缺口可以使用相容性路徑：tarball 中缺少的私人 QA inventory 項目、缺少
`gateway install --wrapper`、tarball 衍生 git
fixture 中缺少 patch 檔案、缺少持久化的 `update.channel`、舊版 Plugin 安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的 config metadata
遷移。已發布的 `2026.4.26` 套件可以針對已隨版本出貨的本機 build metadata stamp 檔案發出警告。後續套件
必須滿足現代套件合約；相同缺口會使 release
validation 失敗。

當 release 問題涉及實際可安裝套件時，請使用更廣的 Package Acceptance profiles：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常見套件 profiles：

- `smoke`：快速套件 install/channel/agent、Gateway network，以及 config
  reload lanes
- `package`：install/update/restart/Plugin 套件合約，加上即時 ClawHub
  skill install 證明；這是 release-check 預設值
- `product`：`package` 加上 MCP channels、cron/subagent cleanup、OpenAI web
  search，以及 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker release-path chunks
- `custom`：用於聚焦重跑的精確 `docker_lanes` 清單

若要為 package-candidate 提供 Telegram 證明，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。該 workflow 會將解析出的
`package-under-test` tarball 傳入 Telegram lane；獨立的
Telegram workflow 仍接受已發布的 npm spec，用於發布後檢查。

## Release 發布自動化

`OpenClaw Release Publish` 是一般的變更性發布入口點。它會依照 release 所需順序協調 trusted-publisher workflows：

1. 簽出 release tag 並解析其 commit SHA。
2. 驗證該 tag 可從 `main` 或 `release/*` 到達。
3. 執行 `pnpm plugins:sync:check`。
4. 以 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 派發 `Plugin NPM Release`。
5. 以相同 scope 和 SHA 派發 `Plugin ClawHub Release`。
6. 以 release tag、npm dist-tag，以及已儲存的 `preflight_run_id`
   派發 `OpenClaw NPM Release`。

Beta 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stable 發布到預設 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stable 直接提升到 `latest` 必須明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflows。若要修復選定的 Plugin，請將
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`，或在 OpenClaw 套件不得發布時直接派發子 workflow。

## NPM workflow 輸入

`OpenClaw NPM Release` 接受這些由操作員控制的輸入：

- `tag`：必要的 release tag，例如 `v2026.4.2`、`v2026.4.2-1`，或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整 40 字元 workflow-branch commit SHA，用於僅驗證的 preflight
- `preflight_only`：`true` 表示只進行 validation/build/package，`false` 表示實際發布路徑
- `preflight_run_id`：實際發布路徑必填，讓 workflow 重用成功 preflight run 準備好的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標 tag；預設為 `beta`

`OpenClaw Release Publish` 接受這些由操作員控制的輸入：

- `tag`：必要的 release tag；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight run id；
  當 `publish_openclaw_npm=true` 時必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標 tag
- `plugin_publish_scope`：預設為 `all-publishable`；只有在聚焦修復工作時才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的
  `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有在將該 workflow 作為僅 Plugin 修復協調器時才設為 `false`

`OpenClaw Release Checks` 接受這些由操作員控制的輸入：

- `ref`：要驗證的 branch、tag，或完整 commit SHA。帶有 secret 的檢查
  要求解析出的 commit 可從 OpenClaw branch 或
  release tag 到達。
- `run_release_soak`：在 stable/default release checks 上選擇加入完整 live/E2E、Docker release-path，以及 all-since upgrade-survivor soak。它會由 `release_profile=full` 強制啟用。

規則：

- Stable 和 correction tags 可以發布到 `beta` 或 `latest`
- Beta prerelease tags 只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 時才允許完整 commit SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律
  只做驗證
- 實際發布路徑必須使用 preflight 期間使用的相同 `npm_dist_tag`；
  workflow 會在發布繼續前驗證該 metadata

## Stable npm release 順序

切 stable npm release 時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在 tag 存在之前，你可以使用目前完整 workflow-branch commit
     SHA，對 preflight workflow 進行僅驗證 dry run
2. 一般 beta-first flow 選擇 `npm_dist_tag=beta`，只有在刻意要直接 stable publish 時才選擇 `latest`
3. 當你想要從單一手動 workflow 取得一般 CI 加上 live prompt cache、Docker、QA Lab、
   Matrix，以及 Telegram 覆蓋時，請在 release branch、release tag，或完整
   commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要確定性的正常 test graph，請改為在 release ref 上執行
   手動 `CI` workflow
5. 儲存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`，以及已儲存的 `preflight_run_id`
   執行 `OpenClaw Release Publish`；它會先將外部化 Plugins 發布到 npm
   和 ClawHub，再提升 OpenClaw npm 套件
7. 如果 release 落在 `beta`，請使用私人
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow，將該 stable 版本從 `beta` 提升到 `latest`
8. 如果 release 是刻意直接發布到 `latest`，且 `beta`
   應立即跟隨相同 stable build，請使用同一個私人
   workflow，將兩個 dist-tags 都指向該 stable 版本，或讓其排程的
   self-healing sync 稍後移動 `beta`

dist-tag 變更位於私人 repo 中是出於安全性，因為它仍然
需要 `NPM_TOKEN`，而公開 repo 保持 OIDC-only publish。

這讓 direct publish path 和 beta-first promotion path 都
有文件記錄，且對操作員可見。

如果 maintainer 必須退回使用本機 npm authentication，請只在專用 tmux session 內執行任何 1Password
CLI (`op`) commands。不要直接從主要 agent shell 呼叫 `op`；
將其保留在 tmux 內，能讓 prompts、alerts 和 OTP 處理可觀察，並防止重複的 host alerts。

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

Maintainers 使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私人 release docs 作為實際 runbook。

## 相關

- [Release channels](/zh-TW/install/development-channels)
