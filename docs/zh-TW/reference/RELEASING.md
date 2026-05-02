---
read_when:
    - 正在尋找公開發布通道定義
    - 執行發布驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作者檢查清單、驗證箱、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-02T21:03:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有四個公開發行通道：

- stable：預設發布到 npm `beta`，或在明確要求時發布到 npm `latest` 的標籤化發行版
- alpha：發布到 npm `alpha` 的預先發行標籤
- beta：發布到 npm `beta` 的預先發行標籤
- dev：`main` 的移動最新狀態

## 版本命名

- 穩定版發行版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定版修正發行版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Alpha 預先發行版本：`YYYY.M.D-alpha.N`
  - Git 標籤：`vYYYY.M.D-alpha.N`
- Beta 預先發行版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 代表目前已提升的穩定版 npm 發行版
- `alpha` 代表目前的 alpha 安裝目標
- `beta` 代表目前的 beta 安裝目標
- 穩定版與穩定版修正發行預設發布到 npm `beta`；發行操作人員可以明確指定 `latest`，或稍後提升已驗證的 beta 建置
- 每個穩定版 OpenClaw 發行都會同時出貨 npm 套件與 macOS 應用程式；
  beta 發行通常會先驗證並發布 npm/套件路徑，除非明確要求，否則
  mac 應用程式的建置/簽署/公證保留給穩定版

## 發行節奏

- 發行採 beta 優先推進
- 穩定版只會在最新 beta 驗證完成後推出
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發行，
  讓發行驗證與修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細的發行程序、核准、憑證與復原注意事項
  僅限維護者查看

## 發行操作人員檢查清單

此檢查清單是發行流程的公開形態。私人憑證、
簽署、公證、dist-tag 復原與緊急回滾細節會留在
僅限維護者的發行執行手冊中。

1. 從目前的 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` CI 綠燈程度足以從它建立分支。
2. 使用 `/changelog` 從真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持項目面向使用者，提交、推送，並在建立分支前再次 rebase/pull。
3. 檢閱
   `src/plugins/compat/registry.ts` 與
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發行相容性記錄。只有在升級路徑仍被涵蓋時才移除過期相容性，或記錄為何有意保留。
4. 從目前的 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發行工作。
5. 針對預期標籤更新每個必要的版本位置，執行
   `pnpm plugins:sync`，讓可發布的 Plugin 套件共享發行版本與相容性中繼資料，接著執行本機決定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check`，以及
   `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在前，
   允許使用完整 40 字元的發行分支 SHA 進行僅限驗證的預檢。儲存成功的 `preflight_run_id`。
7. 針對發行分支、標籤或完整提交 SHA，以 `Full Release Validation` 啟動所有預發行測試。這是四個大型發行測試盒的唯一手動入口點：Vitest、Docker、QA Lab 與 Package。
8. 如果驗證失敗，請在發行分支上修正，並重新執行可證明該修正的最小失敗檔案、通道、工作流程作業、套件設定檔、提供者或模型允許清單。只有在變更範圍使先前證據失效時，才重新執行完整總控流程。
9. 對於 alpha 或 beta，標記 `vYYYY.M.D-alpha.N` 或 `vYYYY.M.D-beta.N`，然後從
   相符的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   先將所有可發布的 Plugin 套件發布到 npm，接著將同一組發布到 ClawHub，
   然後使用相符的 dist-tag 提升已準備好的 OpenClaw npm 預檢成品。發布後，針對已發布的 `openclaw@YYYY.M.D-alpha.N`、`openclaw@alpha`、
   `openclaw@YYYY.M.D-beta.N` 或 `openclaw@beta` 套件執行發布後套件驗收。如果已推送或
   已發布的預先發行需要修正，請切出下一個相符的預先發行編號；
   不要刪除或重寫舊的預先發行。
10. 對於穩定版，只有在已驗證的 beta 或發行候選版具備
    所需驗證證據後才繼續。穩定版 npm 發布也透過
    `OpenClaw Release Publish` 進行，並透過
    `preflight_run_id` 重用成功的預檢成品；穩定版 macOS 發行就緒也需要
    在 `main` 上具備已封裝的 `.zip`、`.dmg`、`.dSYM.zip` 與更新後的 `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器；需要發布後通道證明時，執行可選的獨立已發布 npm Telegram E2E；
    在需要時進行 dist-tag 提升；從完整相符的 `CHANGELOG.md` 區段產生 GitHub 發行/預先發行說明；
    並執行發行公告步驟。

## 發行預檢

- 在發布預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 閘門之外也保持涵蓋
- 在發布預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機閘門之外也保持通過
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發布成品與 Control UI bundle 存在，以供封裝驗證步驟使用
- 在根版本號提升後、打標籤前執行 `pnpm plugins:sync`。它會更新可發布的 Plugin 套件版本、OpenClaw peer/API 相容性中繼資料、建置中繼資料，以及 Plugin 變更記錄 stub，以符合核心發布版本。`pnpm plugins:sync:check` 是非變更式發布防護；如果忘記此步驟，發布工作流程會在任何 registry 變更前失敗。
- 在發布核准前執行手動 `Full Release Validation` 工作流程，從單一進入點啟動所有預發布測試盒。它接受分支、標籤或完整提交 SHA，分派手動 `CI`，並分派 `OpenClaw Release Checks`，涵蓋安裝煙霧測試、套件接受度、Docker 發布路徑套件、live/E2E、OpenWebUI、QA Lab parity、Matrix，以及 Telegram lanes。使用 `release_profile=full` 和 `rerun_group=all` 時，它也會針對 release checks 產生的 `release-package-under-test` artifact 執行套件 Telegram E2E。發布後若同一個 Telegram E2E 也應證明已發布的 npm 套件，請提供 `npm_telegram_package_spec`。發布後若 Package Acceptance 應針對已出貨的 npm 套件，而不是 SHA 建置 artifact，執行其套件/更新矩陣，請提供 `package_acceptance_package_spec`。當私有證據報告應證明驗證符合已發布的 npm 套件，但不強制執行 Telegram E2E 時，請提供 `evidence_package_spec`。範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在發布工作持續進行時，為套件候選版本取得旁路證明，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@alpha`、`openclaw@beta`、`openclaw@latest` 或精確發布版本使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` harness 封裝受信任的 `package_ref` 分支/標籤/SHA；使用 `source=url` 指向需要 SHA-256 的 HTTPS tarball；或使用 `source=artifact` 指向另一個 GitHub Actions run 上傳的 tarball。此工作流程會將候選版本解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發布排程器，並可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 針對同一 tarball 執行 Telegram QA。當所選 Docker lanes 包含 `published-upgrade-survivor` 時，套件 artifact 就是候選版本，而 `published_upgrade_survivor_baseline` 會選取已發布的基準版本。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用 profile：
  - `smoke`：安裝/channel/agent、Gateway 網路，以及設定重新載入 lanes
  - `package`：artifact 原生套件/更新/Plugin lanes，不含 OpenWebUI 或 live ClawHub
  - `product`：package profile 加上 MCP channels、cron/subagent 清理、OpenAI 網頁搜尋，以及 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發布路徑區塊
  - `custom`：用於聚焦重跑的精確 `docker_lanes` 選擇
- 當你只需要發布候選版本的完整一般 CI 涵蓋範圍時，直接執行手動 `CI` 工作流程。手動 CI 分派會略過 changed scoping，並強制執行 Linux Node shards、內建 Plugin shards、channel contracts、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python skills、Windows、macOS、Android，以及 Control UI i18n lanes。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發布遙測時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver 執行 QA-lab，並驗證匯出的 trace span 名稱、有界屬性，以及內容/識別碼遮蔽，不需要 Opik、Langfuse 或其他外部 collector。
- 每次標記發布前執行 `pnpm release:check`
- 在標籤存在後，執行 `OpenClaw Release Publish` 進行會造成變更的發布序列。從 `release/YYYY.M.D` 分派它（或在發布 main 可達標籤時從 `main` 分派），傳入發布標籤與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin 發布範圍 `all-publishable`，除非你刻意執行聚焦修復。此工作流程會序列化 Plugin npm 發布、Plugin ClawHub 發布，以及 OpenClaw npm 發布，避免核心套件早於其外部化 Plugin 發布。
- 發布檢查現在會在獨立的手動工作流程中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發布核准前執行 QA Lab mock parity lane、快速 live Matrix profile，以及 Telegram QA lane。live lanes 使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI credential leases。當你想平行取得完整 Matrix transport、media 與 E2EE inventory 時，請使用 `matrix_profile=all` 和 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` 工作流程。
- 跨 OS 安裝與升級 runtime 驗證是公開 `OpenClaw Release Checks` 和 `Full Release Validation` 的一部分，兩者會直接呼叫可重用工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 此拆分是刻意設計：保持真正的 npm 發布路徑短小、確定且聚焦於 artifact，而較慢的 live 檢查留在自己的 lane 中，避免拖慢或阻擋發布
- 帶有 secret 的發布檢查應透過 `Full Release Validation` 分派，或從 `main`/release 工作流程 ref 分派，讓工作流程邏輯與 secrets 維持受控
- `OpenClaw Release Checks` 接受分支、標籤或完整提交 SHA，只要解析出的提交可從 OpenClaw 分支或發布標籤到達
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元的工作流程分支提交 SHA，不需要已推送的標籤
- 該 SHA 路徑僅供驗證，不能升級為真正發布
- 在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發布標籤
- 兩個工作流程都把真正發布與 promotion 路徑保留在 GitHub-hosted runners 上，而非變更式驗證路徑可使用較大的 Blacksmith Linux runners
- 該工作流程會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並同時使用 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 工作流程 secrets
- npm 發布預檢不再等待獨立的 release checks lane
- 在核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction 標籤）
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction 版本），在全新的暫存 prefix 中驗證已發布 registry 安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共用租用 Telegram credential pool，針對已發布的 npm 套件驗證已安裝套件的 onboarding、Telegram 設定，以及真實 Telegram E2E。本機 maintainer 一次性執行可省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- Maintainer 可透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行同一個發布後檢查。它刻意僅限手動執行，不會在每次 merge 時執行。
- Maintainer 發布自動化現在使用先預檢後 promotion：
  - 真正的 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真正的 npm 發布必須從與成功預檢 run 相同的 `main` 或 `release/YYYY.M.D` 分支分派
  - stable npm 發布預設為 `beta`
  - stable npm 發布可透過工作流程輸入明確指定 `latest`
  - 基於 token 的 npm dist-tag 變更現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，原因是 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開 repo 保持 OIDC-only 發布
  - 公開 `macOS Release` 僅供驗證；當標籤只存在於 release 分支，但工作流程從 `main` 分派時，請設定 `public_release_branch=release/YYYY.M.D`
  - 真正的私有 mac 發布必須通過成功的私有 mac `preflight_run_id` 和 `validate_run_id`
  - 真正的發布路徑會 promotion 已準備好的 artifact，而不是再次重新建置它們
- 對於像 `YYYY.M.D-N` 這樣的 stable correction 發布，發布後 verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同暫存 prefix 升級路徑，讓發布 correction 無法悄悄讓較舊的全域安裝停留在基礎 stable payload
- npm 發布預檢會 fail closed，除非 tarball 同時包含 `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` payload，這樣我們才不會再次出貨空的瀏覽器 dashboard
- 發布後驗證也會檢查已發布的 Plugin entrypoints 和套件中繼資料是否存在於已安裝的 registry 版面中。若某次發布缺少 Plugin runtime payload，postpublish verifier 會失敗，且不能 promotion 到 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，因此 installer e2e 能在發布 publish 路徑前捕捉意外的 pack 膨脹
- 如果發布工作觸及 CI 規劃、擴充功能 timing manifests，或擴充功能測試矩陣，請在核准前重新產生並檢閱 planner 擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，來源為 `.github/workflows/plugin-prerelease.yml`，讓發布說明不會描述過期的 CI 版面
- Stable macOS 發布準備度也包含 updater surfaces：
  - GitHub release 最終必須包含已封裝的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - `main` 上的 `appcast.xml` 必須在發布後指向新的 stable zip
  - 已封裝 app 必須保持非 debug bundle id、非空 Sparkle feed URL，以及高於或等於該發布版本 canonical Sparkle build floor 的 `CFBundleVersion`

## 發布測試盒

`Full Release Validation` 是 operator 從單一進入點啟動所有預發布測試的方式。若要在快速變動分支上取得 pinned commit 證明，請使用 helper，讓每個 child workflow 都從固定在目標 SHA 的暫存分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

helper 會推送 `release-ci/<sha>-...`，從該分支分派 `Full Release Validation` 並帶入 `ref=<sha>`，驗證每個 child workflow 的 `headSha` 都符合目標，然後刪除暫存分支。這能避免意外證明了較新的 `main` child run。

若要驗證 release 分支或標籤，請從受信任的 `main` 工作流程 ref 執行，並將 release 分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

工作流程會解析目標 ref，使用 `target_ref=<release-ref>` 派送手動 `CI`，派送 `OpenClaw Release Checks`，並在 `release_profile=full` 且 `rerun_group=all` 時，或設定 `npm_telegram_package_spec` 時，派送獨立的套件 Telegram E2E。`OpenClaw Release Checks` 接著會展開安裝冒煙測試、跨 OS 發行檢查、live/E2E Docker 發行路徑涵蓋、包含 Telegram 套件 QA 的 Package Acceptance、QA Lab parity、live Matrix，以及 live Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci` 和 `release_checks` 成功時，完整執行才可接受。在 full/all 模式中，`npm_telegram` 子項也必須成功；在 full/all 以外則會略過，除非已提供已發布的 `npm_telegram_package_spec`。最終驗證器摘要會包含每個子執行的最慢工作表，因此發行管理員無需下載記錄也能看到目前的關鍵路徑。
請參閱 [完整發行驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、精確的工作流程工作名稱、stable 與 full 設定檔差異、成品，以及聚焦重新執行控制項。
子工作流程會從執行 `Full Release Validation` 的受信任 ref 派送，通常是 `--ref main`，即使目標 `ref` 指向較舊的發行分支或標籤也一樣。沒有獨立的 Full Release Validation workflow-ref 輸入；請透過選擇工作流程執行 ref 來選擇受信任的測試框架。
不要在移動中的 `main` 上使用 `--ref main -f ref=<sha>` 作為精確提交證明；原始提交 SHA 無法作為工作流程派送 ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立釘選的暫時分支。

使用 `release_profile` 選擇 live/provider 涵蓋範圍：

- `minimum`：最快的發行關鍵 OpenAI/核心 live 與 Docker 路徑
- `stable`：minimum 加上用於發行核准的穩定 provider/backend 涵蓋
- `full`：stable 加上廣泛的 advisory provider/media 涵蓋

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將目標 ref 解析一次為 `release-package-under-test`，並在發行路徑 Docker 檢查與 Package Acceptance 中重用該成品。這能讓所有面向套件的機器使用相同位元組，並避免重複建置套件。
當 repo/org 變數已設定時，跨 OS OpenAI 安裝冒煙測試會使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此 lane 是在證明套件安裝、onboarding、Gateway 啟動，以及一輪 live agent，而不是對最慢的預設模型進行基準測試。更廣泛的 live provider 矩陣仍然是模型特定涵蓋的所在。

依發行階段使用這些變體：

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

不要在聚焦修正後的第一次重新執行時使用完整 umbrella。如果某一台機器失敗，請使用失敗的子工作流程、工作、Docker lane、套件設定檔、模型 provider，或 QA lane 作為下一個證明。只有在修正變更了共享發行編排，或使先前所有機器的證據過時時，才再次執行完整 umbrella。umbrella 的最終驗證器會重新檢查已記錄的子工作流程執行 ID，因此在子工作流程成功重新執行後，只要重新執行失敗的 `Verify full validation` 父工作即可。

若要進行有界復原，請將 `rerun_group` 傳給 umbrella。`all` 是真正的發行候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行僅限發行的 Plugin 子項，`release-checks` 執行每個發行機器，而較窄的發行群組是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重新執行需要 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 執行會使用 release-checks 套件成品。

### Vitest

Vitest 機器是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍判定，並強制對發行候選執行一般測試圖：Linux Node shards、bundled-Plugin shards、channel contracts、Node 22 相容性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android，以及 Control UI i18n。

使用這台機器回答「原始碼樹是否通過完整的一般測試套件？」
它不等同於發行路徑產品驗證。要保留的證據：

- 顯示已派送 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 執行在精確目標 SHA 上為綠色
- 調查迴歸時，來自 CI 工作的失敗或緩慢 shard 名稱
- 當執行需要效能分析時，Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發行需要確定性的一般 CI，但不需要 Docker、QA Lab、live、跨 OS 或套件機器時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 機器位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml`，以及發行模式的 `install-smoke` 工作流程。它會透過封裝的 Docker 環境驗證發行候選，而不只是原始碼層級測試。

發行 Docker 涵蓋包括：

- 啟用緩慢 Bun 全域安裝冒煙測試的完整安裝冒煙測試
- 依目標 SHA 準備/重用根 Dockerfile 冒煙映像，並將 QR、root/gateway，以及 installer/Bun 冒煙工作作為獨立 install-smoke shards 執行
- repository E2E lanes
- 發行路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`，以及 `plugins-runtime-install-h`
- 要求時，`plugins-runtime-services` 區塊內的 OpenWebUI 涵蓋
- 拆分的 bundled Plugin 安裝/解除安裝 lanes，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發行檢查包含 live suites 時，live/E2E provider suites 與 Docker live model 涵蓋

重新執行前先使用 Docker 成品。發行路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重新執行命令。若要進行聚焦復原，請在可重用 live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有發行區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker 映像輸入，因此失敗的 lane 可以重用相同的 tarball 和 GHCR 映像。

### QA Lab

QA Lab 機器也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為與 channel 層級的發行門檻，獨立於 Vitest 與 Docker 套件機制。

發行 QA Lab 涵蓋包括：

- 使用 agentic parity pack，將 OpenAI 候選 lane 與 Opus 4.6 baseline 比較的 mock parity lane
- 使用 `qa-live-shared` 環境的快速 live Matrix QA 設定檔
- 使用 Convex CI 認證租約的 live Telegram QA lane
- 當發行 telemetry 需要明確本機證明時的 `pnpm qa:otel:smoke`

使用這台機器回答「發行在 QA 情境與 live channel flows 中是否正確運作？」
核准發行時，請保留 parity、Matrix 和 Telegram lanes 的成品 URL。完整 Matrix 涵蓋仍可作為手動分片 QA-Lab 執行使用，而不是預設的發行關鍵 lane。

### 套件

套件機器是可安裝產品門檻。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選正規化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件 inventory、記錄套件版本與 SHA-256，並讓工作流程測試框架 ref 與套件來源 ref 分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本
- `source=ref`：使用選定的 `workflow_ref` 測試框架封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重用由另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會以 `source=artifact`、已準備的發行套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues`，以及 `telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對同一個已解析 tarball 保持 migration、update、陳舊 Plugin 依賴清理、offline Plugin fixtures、Plugin update，以及 Telegram 套件 QA。升級矩陣涵蓋從 `2026.4.23` 到 `latest` 的每個穩定 npm 已發布 baseline；對於已出貨的候選，使用 `source=npm` 的 Package Acceptance，或在發布前對 SHA 支援的本機 npm tarball 使用 `source=ref`/`source=artifact`。它是 GitHub 原生的替代方案，取代過去大多數需要 Parallels 的套件/update 涵蓋。跨 OS 發行檢查對 OS 特定 onboarding、安裝程式與平台行為仍然重要，但套件/update 產品驗證應優先使用 Package Acceptance。

update 與 Plugin 驗證的標準檢查清單是 [測試 updates 和 plugins](/zh-TW/help/testing-updates-plugins)。在決定哪個本機、Docker、Package Acceptance 或 release-check lane 能證明 Plugin install/update、doctor cleanup，或已發布套件 migration 變更時，請使用它。
從每個穩定 `2026.4.23+` 套件進行的完整已發布 update migration 是獨立的手動 `Update Migration` 工作流程，不屬於 Full Release CI。

舊版 package-acceptance 寬容性是刻意限時的。到 `2026.4.25` 為止的套件，可針對已發布到 npm 的 metadata gaps 使用相容性路徑：tarball 中缺少的 private QA inventory entries、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch files、缺少持久化的 `update.channel`、舊版 Plugin install-record locations、缺少 marketplace install-record persistence，以及 `plugins update` 期間的 config metadata migration。已發布的 `2026.4.26` 套件可能會針對已出貨的本機建置 metadata stamp files 發出警告。後續套件必須滿足現代套件合約；這些相同缺口會使發行驗證失敗。

當發行問題是關於實際可安裝套件時，請使用更廣泛的 Package Acceptance 設定檔：

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

- `smoke`：快速套件安裝/channel/agent、Gateway 網路，以及 config reload lanes
- `package`：沒有 live ClawHub 的 install/update/Plugin 套件合約；這是 release-check 預設值
- `product`：`package` 加上 MCP channels、cron/subagent cleanup、OpenAI web search，以及 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：用於聚焦重新執行的精確 `docker_lanes` 清單

針對套件候選版的 Telegram 證明，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。該工作流程會將解析後的
`package-under-test` tarball 傳入 Telegram lane；獨立的
Telegram 工作流程仍接受已發布的 npm 規格，用於發布後檢查。

## 發布自動化

`OpenClaw Release Publish` 是一般的變更型發布進入點。它會依照發行所需的順序協調 trusted-publisher 工作流程：

1. 簽出發行標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 連到。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 分派 `Plugin ClawHub Release`。
6. 使用發行標籤、npm dist-tag，以及已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。

Beta 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Alpha 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

穩定版發布到預設 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

穩定版直接提升到 `latest` 是明確操作：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

只有在需要聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流程。若要修復選定的 Plugin，請將 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`；或者在不得發布 OpenClaw 套件時，直接分派子工作流程。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作員控制的輸入：

- `tag`：必填的發行標籤，例如 `v2026.4.2`、`v2026.4.2-1`，或
  `v2026.4.2-alpha.1` 或 `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整的 40 字元工作流程分支 commit SHA，用於僅驗證的預檢
- `preflight_only`：`true` 表示僅驗證、建置、封裝；`false` 表示實際發布路徑
- `preflight_run_id`：實際發布路徑必填，讓工作流程重用成功預檢執行所準備的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受以下由操作員控制的輸入：

- `tag`：必填的發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 id；
  當 `publish_openclaw_npm=true` 時必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；只有在聚焦修復工作時才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有在將工作流程用作僅 Plugin 修復協調器時才設為 `false`

`OpenClaw Release Checks` 接受以下由操作員控制的輸入：

- `ref`：要驗證的分支、標籤，或完整 commit SHA。帶有祕密的檢查要求解析後的 commit 可從 OpenClaw 分支或發行標籤連到。

規則：

- 穩定版與修正版標籤可以發布到 `beta` 或 `latest`
- Alpha 預發行標籤只能發布到 `alpha`
- Beta 預發行標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許完整 commit SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 永遠都只做驗證
- 實際發布路徑必須使用預檢期間使用的相同 `npm_dist_tag`；工作流程會在發布繼續前驗證該中繼資料

## 穩定版 npm 發行順序

切出穩定版 npm 發行時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 標籤存在前，你可以使用目前完整的工作流程分支 commit SHA，對預檢工作流程進行僅驗證的 dry run
2. 一般 beta 優先流程請選擇 `npm_dist_tag=beta`；只有在你有意直接發布穩定版時才選擇 `latest`
3. 當你想從單一手動工作流程取得一般 CI，加上即時 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆蓋率時，請在發行分支、發行標籤或完整 commit SHA 上執行 `Full Release Validation`
4. 如果你有意只需要確定性的一般測試圖，請改在發行 ref 上執行手動 `CI` 工作流程
5. 儲存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`，以及已儲存的 `preflight_run_id` 執行 `OpenClaw Release Publish`；它會先將外部化 Plugin 發布到 npm 和 ClawHub，再提升 OpenClaw npm 套件
7. 如果發行落在 `beta`，請使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流程，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發行有意直接發布到 `latest`，且 `beta` 應立即跟隨相同的穩定版建置，請使用同一個私有工作流程，將兩個 dist-tag 都指向該穩定版本；或讓其排程的自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中以確保安全，因為它仍然需要 `NPM_TOKEN`，而公開 repo 則維持僅 OIDC 發布。

這會讓直接發布路徑和 beta 優先提升路徑都保有文件記錄，並且對操作員可見。

如果維護者必須退回使用本機 npm 驗證，請只在專用 tmux 工作階段內執行任何 1Password CLI (`op`) 命令。不要直接從主要代理 shell 呼叫 `op`；將它保留在 tmux 內，能讓提示、警示和 OTP 處理可觀察，並防止重複的主機警示。

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

維護者會使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有發行文件作為實際操作手冊。

## 相關

- [發行通道](/zh-TW/install/development-channels)
