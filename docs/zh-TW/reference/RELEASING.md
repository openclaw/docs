---
read_when:
    - 尋找公開發布頻道定義
    - 執行發布驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證環境、版本命名與發布節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-02T23:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發行通道：

- stable：預設發布到 npm `beta` 的標記版本，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發行標籤
- dev：`main` 的移動最新狀態

## 版本命名

- 穩定版發行版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定版修正發行版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發行版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已提升的穩定版 npm 發行版本
- `beta` 表示目前的 beta 安裝目標
- 穩定版與穩定版修正發行版本預設發布到 npm `beta`；發行操作人員可以明確指定 `latest`，或稍後提升已審核的 beta 組建
- 每個穩定版 OpenClaw 發行版本都會同時發布 npm 套件和 macOS 應用程式；
  beta 發行版本通常會先驗證並發布 npm/套件路徑，而 Mac 應用程式的組建/簽署/公證則保留給穩定版，除非明確要求

## 發行節奏

- 發行會先進入 beta
- 只有在最新 beta 驗證完成後才會進入穩定版
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發行版本，
  讓發行驗證與修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細的發行程序、核准、憑證與復原注意事項僅限維護者使用

## 發行操作人員檢查清單

此檢查清單是發行流程的公開形狀。私有憑證、簽署、公證、dist-tag 復原與緊急回復細節保留在僅限維護者使用的發行操作手冊中。

1. 從目前的 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` 的 CI 狀態足以從它建立分支。
2. 使用 `/changelog` 依據真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，保持項目面向使用者，提交並推送，然後在建立分支前再 rebase/pull 一次。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發行相容性記錄。只有在升級路徑仍被涵蓋時才移除已過期的相容性，否則記錄為何刻意保留。
4. 從目前的 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發行工作。
5. 為預定標籤提升所有必要版本位置，執行
   `pnpm plugins:sync`，讓可發布的 Plugin 套件共用發行版本與相容性中繼資料，然後執行本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，允許使用完整 40 字元的發行分支 SHA 進行僅驗證預檢。保存成功的 `preflight_run_id`。
7. 針對發行分支、標籤或完整提交 SHA，以 `Full Release Validation` 啟動所有預發行測試。這是四個大型發行測試箱的單一手動入口點：Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發行分支上修正，並重新執行能證明修正的最小失敗檔案、通道、工作流程作業、套件設定檔、提供者或模型允許清單。只有在變更範圍使先前證據過期時，才重新執行完整總括流程。
9. 對於 beta，標記 `vYYYY.M.D-beta.N`，然後從相符的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，先將所有可發布的 Plugin 套件發布到 npm，再將相同集合發布到 ClawHub，然後使用相符的 dist-tag 提升已準備好的 OpenClaw npm 預檢成品。發布後，針對已發布的 `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 套件執行發布後套件接受測試。如果已推送或已發布的預發行版本需要修正，請切出下一個相符的預發行編號；不要刪除或重寫舊的預發行版本。
10. 對於穩定版，只有在已審核的 beta 或發行候選版本具備必要驗證證據後才繼續。穩定版 npm 發布也會透過
    `OpenClaw Release Publish`，使用 `preflight_run_id` 重用成功的預檢成品；穩定版 macOS 發行就緒狀態也需要 `main` 上的已封裝 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器、在需要發布後通道證明時執行選用的獨立已發布 npm Telegram E2E、在需要時進行 dist-tag 提升、依據完整相符的 `CHANGELOG.md` 區段撰寫 GitHub 發行/預發行說明，以及完成發行公告步驟。

## 發行預檢

- 在發行預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 關卡之外仍受到涵蓋
- 在發行預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機關卡之外保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發行成品與 Control UI bundle 存在，以供打包驗證步驟使用
- 在根版本升級之後、標記之前執行 `pnpm plugins:sync`。它會更新可發布的 plugin 套件版本、OpenClaw 對等/API 相容性中繼資料、建置中繼資料，以及 plugin changelog stub，使其符合核心發行版本。`pnpm plugins:sync:check` 是不會變更內容的發行防護；如果忘記此步驟，發布工作流程會在任何 registry 變更前失敗。
- 在發行核准前執行手動 `Full Release Validation` 工作流程，從單一入口點啟動所有發行前測試箱。它接受分支、標籤或完整 commit SHA，派發手動 `CI`，並派發 `OpenClaw Release Checks`，涵蓋安裝 smoke、套件驗收、Docker 發行路徑套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 與 Telegram 線路。使用 `release_profile=full` 與 `rerun_group=all` 時，它也會針對 release checks 產生的 `release-package-under-test` 成品執行套件 Telegram E2E。發布後，如果同一個 Telegram E2E 也應驗證已發布的 npm 套件，請提供 `npm_telegram_package_spec`。發布後，如果 Package Acceptance 應針對已出貨的 npm 套件，而不是 SHA 建置成品執行其套件/更新矩陣，請提供 `package_acceptance_package_spec`。如果私有證據報告應證明驗證符合已發布的 npm 套件，但不強制執行 Telegram E2E，請提供 `evidence_package_spec`。範例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你希望在發行工作持續進行時，為套件候選版本取得旁路證明，請執行手動 `Package Acceptance` 工作流程。使用 `source=npm` 來指定 `openclaw@beta`、`openclaw@latest` 或精確的發行版本；使用 `source=ref` 以目前的 `workflow_ref` harness 打包受信任的 `package_ref` 分支/標籤/SHA；使用 `source=url` 來指定需要 SHA-256 的 HTTPS tarball；或使用 `source=artifact` 來指定另一個 GitHub Actions 執行上傳的 tarball。該工作流程會將候選版本解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發行排程器，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一個 tarball 執行 Telegram QA。當選取的 Docker 線路包含 `published-upgrade-survivor` 時，套件成品就是候選版本，而 `published_upgrade_survivor_baseline` 會選取已發布的基準版本。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見設定檔：
  - `smoke`：安裝/頻道/代理、Gateway 網路，以及設定重新載入線路
  - `package`：不含 OpenWebUI 或 live ClawHub 的成品原生套件/更新/plugin 線路
  - `product`：套件設定檔加上 MCP 頻道、cron/subagent 清理、OpenAI 網頁搜尋與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發行路徑區塊
  - `custom`：用於聚焦重跑的精確 `docker_lanes` 選取
- 當你只需要發行候選版本的完整正常 CI 覆蓋時，請直接執行手動 `CI` 工作流程。手動 CI 派發會略過變更範圍判定，並強制執行 Linux Node shards、bundled-plugin shards、頻道合約、Node 22 相容性、`check`、`check-additional`、建置 smoke、文件檢查、Python skills、Windows、macOS、Android 與 Control UI i18n 線路。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發行遙測時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器演練 QA-lab，並驗證匯出的 trace span 名稱、有界屬性，以及內容/識別碼遮蔽，而不需要 Opik、Langfuse 或其他外部收集器。
- 每個加上標籤的發行前都執行 `pnpm release:check`
- 在標籤存在後，執行 `OpenClaw Release Publish` 以進行會變更狀態的發布序列。從 `release/YYYY.M.D` 派發它（或在發布 main 可到達的標籤時從 `main` 派發），傳入發行標籤與成功的 OpenClaw npm `preflight_run_id`，並保留預設的 plugin 發布範圍 `all-publishable`，除非你刻意執行聚焦修復。該工作流程會序列化 plugin npm 發布、plugin ClawHub 發布與 OpenClaw npm 發布，確保核心套件不會早於其外部化 plugins 發布。
- 發行檢查現在在獨立的手動工作流程中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發行核准前執行 QA Lab mock parity 線路、快速 live Matrix 設定檔，以及 Telegram QA 線路。live 線路使用 `qa-live-shared` 環境；Telegram 也會使用 Convex CI 憑證租約。當你希望平行取得完整 Matrix 傳輸、媒體與 E2EE inventory 時，請使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` 工作流程。
- 跨作業系統安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，它們會直接呼叫可重用工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這種拆分是刻意的：讓真正的 npm 發行路徑保持短、確定且專注於成品，而較慢的 live 檢查留在自己的線路中，避免拖慢或阻擋發布
- 帶有密鑰的發行檢查應透過 `Full Release Validation` 派發，或從 `main`/發行工作流程 ref 派發，讓工作流程邏輯與 secrets 保持受控
- `OpenClaw Release Checks` 接受分支、標籤或完整 commit SHA，只要解析出的 commit 可從 OpenClaw 分支或發行標籤到達
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元的工作流程分支 commit SHA，不需要已推送的標籤
- 該 SHA 路徑僅供驗證，不能提升為真正的發布
- 在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發行標籤
- 兩個工作流程都將真正的發布與提升路徑保留在 GitHub 託管 runner 上，而不會變更狀態的驗證路徑可使用較大的 Blacksmith Linux runner
- 該工作流程會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` 工作流程 secrets
- npm 發行預檢不再等待獨立的發行檢查線路
- 在核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction 標籤）
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction 版本），以在全新的暫存 prefix 中驗證已發布 registry 的安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享的租用 Telegram 憑證池，針對已發布的 npm 套件驗證已安裝套件 onboarding、Telegram 設定，以及真正的 Telegram E2E。本機 maintainer 的一次性執行可以省略 Convex 變數，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env 憑證。
- Maintainer 可以透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行相同的發布後檢查。它刻意只支援手動執行，不會在每次 merge 時執行。
- Maintainer 發行自動化現在使用先預檢再提升：
  - 真正的 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真正的 npm 發布必須從成功預檢執行所在的同一個 `main` 或 `release/YYYY.M.D` 分支派發
  - 穩定版 npm 發行預設為 `beta`
  - 穩定版 npm 發布可透過工作流程輸入明確指定 `latest`
  - 基於 token 的 npm dist-tag 變更現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以確保安全，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開 repo 保持僅 OIDC 發布
  - 公開 `macOS Release` 僅供驗證；當標籤只存在於發行分支，但工作流程從 `main` 派發時，請設定 `public_release_branch=release/YYYY.M.D`
  - 真正的私有 mac 發布必須通過成功的私有 mac `preflight_run_id` 與 `validate_run_id`
  - 真正的發布路徑會提升已準備好的成品，而不是再次重建它們
- 對於像 `YYYY.M.D-N` 這樣的穩定版修正版發行，發布後驗證器也會檢查相同暫存 prefix 中從 `YYYY.M.D` 到 `YYYY.M.D-N` 的升級路徑，確保發行修正版不會悄悄讓較舊的全域安裝停留在基礎穩定版 payload 上
- npm 發行預檢會 fail closed，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，避免我們再次出貨空的瀏覽器儀表板
- 發布後驗證也會檢查已發布 plugin 進入點與套件中繼資料是否存在於已安裝的 registry 版面中。若發行版本缺少 plugin 執行階段 payload，發布後驗證器會失敗，且不能提升為 `latest`。
- `pnpm test:install:smoke` 也會針對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，因此 installer e2e 會在發行發布路徑前抓出意外的 pack 膨脹
- 如果發行工作觸及 CI 規劃、extension timing manifests 或 extension test matrices，請在核准前重新產生並審查由 planner 擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，來源為 `.github/workflows/plugin-prerelease.yml`，以免發行說明描述過時的 CI 版面
- 穩定版 macOS 發行準備狀態也包含 updater surfaces：
  - GitHub release 最終必須包含打包好的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - 發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip
  - 打包後的 app 必須保留非 debug bundle id、非空的 Sparkle feed URL，以及等於或高於該發行版本 canonical Sparkle build floor 的 `CFBundleVersion`

## 發行測試箱

`Full Release Validation` 是 operators 從單一入口點啟動所有發行前測試的方式。若要在快速變動分支上取得 pinned commit 證明，請使用 helper，讓每個子工作流程都從固定在目標 SHA 的暫存分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

該 helper 會推送 `release-ci/<sha>-...`，從該分支派發 `Full Release Validation` 並帶入 `ref=<sha>`，驗證每個子工作流程的 `headSha` 都符合目標，然後刪除暫存分支。這可避免意外證明較新的 `main` 子執行。

若要驗證發行分支或標籤，請從受信任的 `main` 工作流程 ref 執行，並將發行分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

工作流程會解析目標參照，使用 `target_ref=<release-ref>` 觸發手動 `CI`，觸發 `OpenClaw Release Checks`，並在 `release_profile=full` 搭配 `rerun_group=all` 時，或設定 `npm_telegram_package_spec` 時，觸發獨立套件 Telegram E2E。`OpenClaw Release Checks` 接著會展開執行安裝煙霧測試、跨 OS 發布檢查、即時/E2E Docker 發布路徑涵蓋、含 Telegram 套件 QA 的 Package Acceptance、QA Lab 對等性、即時 Matrix，以及即時 Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci` 和 `release_checks` 成功時，完整執行才可接受。在 full/all 模式中，`npm_telegram` 子項也必須成功；在 full/all 以外會略過，除非提供了已發布的 `npm_telegram_package_spec`。最終驗證器摘要包含每個子執行的最慢作業表，因此發布管理者無需下載日誌即可查看目前的關鍵路徑。
請參閱 [完整版本驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、確切工作流程作業名稱、stable 與 full 設定檔差異、成品，以及聚焦重跑控制項。
子工作流程會從執行 `Full Release Validation` 的受信任參照觸發，通常是 `--ref main`，即使目標 `ref` 指向較舊的發布分支或標籤也是如此。沒有獨立的 Full Release Validation 工作流程參照輸入；請透過選擇工作流程執行參照來選擇受信任的執行框架。
不要在移動中的 `main` 上使用 `--ref main -f ref=<sha>` 取得確切提交證明；原始提交 SHA 不能作為工作流程觸發參照，因此請使用 `pnpm ci:full-release --sha <sha>` 建立釘選的暫時分支。

使用 `release_profile` 選擇即時/提供者涵蓋範圍：

- `minimum`: 最快的發布關鍵 OpenAI/核心即時測試與 Docker 路徑
- `stable`: 最低範圍加上發布核准所需的穩定提供者/後端涵蓋範圍
- `full`: 穩定範圍加上廣泛的參考性提供者/媒體涵蓋範圍

`OpenClaw Release Checks` 會使用受信任工作流程參照，將目標參照解析一次為 `release-package-under-test`，並在發布路徑 Docker 檢查和 Package Acceptance 中重用該成品。這會讓所有面向套件的測試箱都使用相同位元組內容，並避免重複建置套件。
跨 OS OpenAI 安裝煙霧測試會在設定儲存庫/組織變數時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為這條測試線是在證明套件安裝、初始設定、Gateway 啟動，以及一次即時代理程式回合，而不是對最慢的預設模型進行基準測試。較廣的即時提供者矩陣仍是特定模型涵蓋範圍的位置。

請依發布階段使用這些變體：

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

不要把完整總括流程當成聚焦修正後的第一次重跑。如果某個測試箱失敗，請使用失敗的子工作流程、作業、Docker 測試線、套件設定檔、模型提供者，或 QA 測試線進行下一次證明。只有在修正變更了共用發布編排，或讓先前所有測試箱的證據失效時，才再次執行完整總括流程。總括流程的最終驗證器會重新檢查已記錄的子工作流程執行 ID，因此在子工作流程成功重跑後，只需重跑失敗的 `Verify full validation` 父作業。

若要進行有界復原，請將 `rerun_group` 傳給總括流程。`all` 是真正的發布候選版本執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行僅發布用 Plugin 子項，`release-checks` 會執行每個發布測試箱，而較窄的發布群組是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 執行會使用發布檢查套件成品。

### Vitest

Vitest 測試箱是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍限定，並強制發布候選版本使用一般測試圖：Linux Node 分片、隨附 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用這個測試箱回答「原始碼樹是否通過完整的一般測試套件？」它不同於發布路徑產品驗證。請保留的證據：

- `Full Release Validation` 摘要，顯示已觸發的 `CI` 執行 URL
- `CI` 在確切目標 SHA 上通過
- 調查迴歸時 CI 作業中的失敗或緩慢分片名稱
- 當執行需要效能分析時的 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發布需要確定性的一般 CI，但不需要 Docker、QA Lab、即時、跨 OS 或套件測試箱時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 測試箱位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml` 以及發布模式 `install-smoke` 工作流程執行。它會透過封裝的 Docker 環境驗證發布候選版本，而不只是原始碼層級測試。

發布 Docker 涵蓋範圍包括：

- 啟用緩慢 Bun 全域安裝煙霧測試的完整安裝煙霧測試
- 依目標 SHA 準備/重用根 Dockerfile 煙霧測試映像，QR、根/Gateway，以及安裝器/Bun 煙霧測試作業會作為獨立 install-smoke 分片執行
- 儲存庫 E2E 測試線
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`，以及 `plugins-runtime-install-h`
- 要求時，在 `plugins-runtime-services` 區塊內的 OpenWebUI 涵蓋範圍
- 拆分的隨附 Plugin 安裝/解除安裝測試線 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發布檢查包含即時測試套件時，涵蓋即時/E2E 提供者套件與 Docker 即時模型

重新執行前先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含測試線日誌、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重跑命令。若要進行聚焦復原，請在可重用的即時/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有發布區塊。產生的重跑命令會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker 映像輸入，因此失敗的測試線可以重用相同的 tar 封裝檔和 GHCR 映像。

### QA Lab

QA Lab 測試箱也是 `OpenClaw Release Checks` 的一部分。它是代理式行為和通道層級的發布門檻，與 Vitest 和 Docker 套件機制分開。

發布 QA Lab 涵蓋範圍包括：

- 使用代理式對等性包，將 OpenAI 候選測試線與 Opus 4.6 基準比較的模擬對等性測試線
- 使用 `qa-live-shared` 環境的快速即時 Matrix QA 設定檔
- 使用 Convex CI 憑證租約的 Telegram 即時 QA 測試線
- 當發布遙測需要明確本機證明時執行 `pnpm qa:otel:smoke`

使用這個測試箱回答「發布版本在 QA 情境和即時通道流程中的行為是否正確？」核准發布時，請保留對等性、Matrix 和 Telegram 測試線的成品 URL。完整 Matrix 涵蓋範圍仍可作為手動分片 QA-Lab 執行取得，而不是預設的發布關鍵測試線。

### 套件

套件測試箱是可安裝產品門檻。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選項正規化為 Docker E2E 使用的 `package-under-test` tar 封裝檔、驗證套件清單、記錄套件版本與 SHA-256，並讓工作流程執行框架參照與套件來源參照保持分離。

支援的候選來源：

- `source=npm`: `openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發布版本
- `source=ref`: 使用所選 `workflow_ref` 執行框架，打包受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`: 下載 HTTPS `.tgz`，並提供必要的 `package_sha256`
- `source=artifact`: 重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues`，以及 `telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會讓遷移、更新、過期 Plugin 依賴清理、離線 Plugin 夾具、Plugin 更新，以及 Telegram 套件 QA 都針對同一個已解析的 tar 封裝檔執行。升級矩陣涵蓋從 `2026.4.23` 到 `latest` 的每個 npm 已發布穩定基準；對已出貨候選版本使用 `source=npm` 的 Package Acceptance，或在發布前對有 SHA 支援的本機 npm tar 封裝檔使用 `source=ref`/`source=artifact`。它是 GitHub 原生替代方案，可取代先前大多數需要 Parallels 的套件/更新涵蓋範圍。跨 OS 發布檢查對 OS 特定的初始設定、安裝器和平台行為仍然重要，但套件/更新產品驗證應優先使用 Package Acceptance。

更新與 Plugin 驗證的標準檢查清單是 [測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。判斷哪個本機、Docker、Package Acceptance 或發布檢查測試線能證明 Plugin 安裝/更新、診斷清理，或已發布套件遷移變更時，請使用它。
從每個穩定 `2026.4.23+` 套件進行完整已發布更新遷移，是獨立的手動 `Update Migration` 工作流程，不屬於完整發布 CI。

舊版套件驗收寬限刻意設有時間限制。`2026.4.25` 以前的套件可針對已發布到 npm 的中繼資料缺口使用相容性路徑：tar 封裝檔中缺少私有 QA 清單項目、缺少 `gateway install --wrapper`、tar 封裝檔衍生的 Git 夾具中缺少補丁檔案、缺少持久化的 `update.channel`、舊版 Plugin 安裝記錄位置、缺少市集安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件可針對已出貨的本機建置中繼資料戳記檔提出警告。後續套件必須滿足現代套件合約；同樣的缺口會使發布驗證失敗。

當發布問題關於實際可安裝套件時，使用較廣的 Package Acceptance 設定檔：

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

- `smoke`: 快速套件安裝/通道/代理程式、Gateway 網路，以及設定重新載入測試線
- `package`: 不含即時 ClawHub 的安裝/更新/Plugin 套件合約；這是發布檢查預設值
- `product`: `package` 加上 MCP 通道、Cron/子代理程式清理、OpenAI 網頁搜尋，以及 OpenWebUI
- `full`: 含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`: 用於聚焦重跑的精確 `docker_lanes` 清單

對於套件候選 Telegram 證明，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。該工作流程會將解析後的
`package-under-test` tarball 傳入 Telegram 通道；獨立的
Telegram 工作流程仍接受已發布的 npm 規格，用於發布後檢查。

## 發布自動化

`OpenClaw Release Publish` 是一般會變更狀態的發布入口點。它會依照發行所需的順序協調受信任發布者工作流程：

1. 簽出發行標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 觸及。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同範圍和 SHA 分派 `Plugin ClawHub Release`。
6. 使用發行標籤、npm dist-tag，以及已儲存的
   `preflight_run_id` 分派 `OpenClaw NPM Release`。

Beta 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

穩定版發布到預設的 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

直接將穩定版提升到 `latest` 需要明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

僅在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流程。若要修復選定的 Plugin，請將
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`；或在不得發布 OpenClaw 套件時，直接分派子工作流程。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作員控制的輸入：

- `tag`：必要的發行標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整的 40 字元工作流程分支 commit SHA，用於僅驗證的預檢
- `preflight_only`：`true` 表示僅驗證、建置和封裝，`false` 表示實際發布路徑
- `preflight_run_id`：實際發布路徑必填，讓工作流程重用成功預檢執行中準備好的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受以下由操作員控制的輸入：

- `tag`：必要的發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 ID；當 `publish_openclaw_npm=true` 時必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；僅在聚焦修復工作時使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；僅在將工作流程用作僅 Plugin 修復協調器時設為 `false`

`OpenClaw Release Checks` 接受以下由操作員控制的輸入：

- `ref`：要驗證的分支、標籤或完整 commit SHA。帶有祕密的檢查要求解析後的 commit 可從 OpenClaw 分支或發行標籤觸及。

規則：

- 穩定版和修正版標籤可發布到 `beta` 或 `latest`
- Beta 預發行標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許完整 commit SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律僅用於驗證
- 實際發布路徑必須使用預檢期間使用的相同 `npm_dist_tag`；工作流程會在發布前繼續驗證該中繼資料

## 穩定版 npm 發行順序

切出穩定版 npm 發行時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在之前，你可以使用目前完整的工作流程分支 commit SHA，對預檢工作流程進行僅驗證的試執行
2. 一般 beta 優先流程請選擇 `npm_dist_tag=beta`；只有在你有意直接發布穩定版時，才選擇 `latest`
3. 當你想從單一手動工作流程取得一般 CI，加上即時提示快取、Docker、QA Lab、Matrix 和 Telegram 覆蓋時，請在發行分支、發行標籤或完整 commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要確定性的標準測試圖，請改在發行 ref 上執行手動 `CI` 工作流程
5. 儲存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`，以及已儲存的 `preflight_run_id` 執行 `OpenClaw Release Publish`；它會先將外部化 Plugin 發布到 npm 和 ClawHub，再提升 OpenClaw npm 套件
7. 如果發行落在 `beta`，請使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流程，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發行是刻意直接發布到 `latest`，且 `beta`
   應立即跟隨同一個穩定建置，請使用相同的私有工作流程，將兩個 dist-tag 指向該穩定版本；或讓其排程的自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中是出於安全考量，因為它仍需要 `NPM_TOKEN`，而公開 repo 保持僅使用 OIDC 發布。

這讓直接發布路徑和 beta 優先提升路徑都已文件化，且對操作員可見。

如果維護者必須退回使用本機 npm 驗證，請只在專用 tmux 工作階段內執行任何 1Password CLI (`op`) 命令。不要直接從主要代理 shell 呼叫 `op`；將它放在 tmux 內可讓提示、警示和 OTP 處理可被觀察，並避免重複的主機警示。

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

維護者使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有發行文件作為實際執行手冊。

## 相關

- [發行通道](/zh-TW/install/development-channels)
