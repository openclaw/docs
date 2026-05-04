---
read_when:
    - 正在尋找公開發布通道定義
    - 執行發行驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證環境、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-04T07:06:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布通道：

- 穩定版：已標記的發行版，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發行標籤
- dev：`main` 的移動中最新提交

## 版本命名

- 穩定版發行版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定修正版發行版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發行版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已晉升的穩定版 npm 發行版
- `beta` 表示目前的 beta 安裝目標
- 穩定版與穩定修正版發行版預設發布到 npm `beta`；發布操作員可以明確指定 `latest`，或稍後晉升已審核的 beta 組建
- 每個穩定版 OpenClaw 發行版都會同時出貨 npm 套件與 macOS 應用程式；
  beta 發行版通常會先驗證並發布 npm/套件路徑，
  mac 應用程式的建置/簽署/公證則保留給穩定版，除非明確要求

## 發布節奏

- 發布採 beta 優先
- 只有在最新 beta 通過驗證後，穩定版才會接續發布
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發行版，
  因此發布驗證與修正不會阻擋 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細發布程序、核准、憑證與復原備註僅限維護者使用

## 發布操作員檢查清單

此檢查清單是發布流程的公開形式。私有憑證、簽署、公證、dist-tag 復原與緊急回復細節保留在僅限維護者使用的發布 runbook 中。

1. 從目前的 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` 的 CI 足夠穩定，可以從中建立分支。
2. 使用 `/changelog` 從真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交、推送，並在建立分支前再次 rebase/pull。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍有覆蓋時才移除已過期的
   相容性，或記錄為何有意保留。
4. 從目前的 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發布工作。
5. 為預期標籤更新每個必要的版本位置，執行
   `pnpm plugins:sync`，讓可發布的 Plugin 套件共享發行版本與相容性中繼資料，然後執行本機決定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，
   允許使用完整 40 字元的發布分支 SHA 進行僅驗證預檢。保存成功的 `preflight_run_id`。
7. 對發布分支、標籤或完整提交 SHA 執行 `Full Release Validation`，啟動所有預發布測試。這是四個大型發布測試盒的唯一手動入口：
   Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正的最小失敗
   檔案、通道、工作流程作業、套件設定檔、Provider 或模型允許清單。只有當變更的表面使先前證據過期時，才重新執行完整總括流程。
9. 對 beta，標記 `vYYYY.M.D-beta.N`，然後從相符的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   先將所有可發布的 Plugin 套件發布到 npm，再將相同集合以 ClawPack npm-pack tarball 形式發布到 ClawHub，
   然後使用相符的 dist-tag 晉升已準備好的 OpenClaw npm 預檢成品。發布後，針對已發布的
   `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 套件執行發布後套件
   acceptance。如果已推送或已發布的預發行需要修正，
   請切下一個相符的預發行編號；不要刪除或重寫舊的
   預發行。
10. 對穩定版，只有在已審核的 beta 或發布候選版具備
    必要驗證證據後才繼續。穩定版 npm 發布也會透過
    `OpenClaw Release Publish`，透過
    `preflight_run_id` 重用成功的預檢成品；穩定版 macOS 發布就緒也需要
    `main` 上的已封裝 `.zip`、`.dmg`、`.dSYM.zip` 以及更新後的 `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器、在需要發布後通道證明時執行可選的獨立
    published-npm Telegram E2E、
    在需要時進行 dist-tag 晉升、從完整相符的 `CHANGELOG.md` 區段產生 GitHub 發行/預發行說明，
    以及發布公告步驟。

## 發布預檢

- 發布預檢前先執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 閘門之外仍受到涵蓋
- 發布預檢前先執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機閘門之外保持綠燈
- 在 `pnpm release:check` 前先執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發布成品與 Control UI bundle 存在，以供封裝驗證步驟使用
- 在根版本升級後、標記前執行 `pnpm plugins:sync`。它會更新可發布的 Plugin 套件版本、OpenClaw peer/API 相容性中繼資料、建置中繼資料，以及 Plugin 變更記錄 stub，以符合核心發布版本。`pnpm plugins:sync:check` 是不變更檔案的發布守衛；如果忘記此步驟，發布工作流程會在任何 registry 變更前失敗。
- 在發布核准前執行手動 `Full Release Validation` 工作流程，從單一進入點啟動所有預發布測試盒。它接受分支、標籤或完整 commit SHA，分派手動 `CI`，並分派 `OpenClaw Release Checks`，涵蓋安裝 smoke、套件接受度、Docker 發布路徑套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 與 Telegram lane。使用 `release_profile=full` 和 `rerun_group=all` 時，它也會針對來自發布檢查的 `release-package-under-test` 成品執行套件 Telegram E2E。發布後提供 `npm_telegram_package_spec`，可讓同一個 Telegram E2E 也驗證已發布的 npm 套件。發布後提供 `package_acceptance_package_spec`，可讓 Package Acceptance 對已出貨的 npm 套件執行其套件/更新矩陣，而不是針對以 SHA 建置的成品執行。提供 `evidence_package_spec` 時，私有證據報告可證明驗證符合已發布的 npm 套件，而不強制執行 Telegram E2E。
  範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在發布工作繼續進行時，為套件候選版本取得旁路證據，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或精確發布版本使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` harness 封裝受信任的 `package_ref` 分支/標籤/SHA；對需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或對另一個 GitHub Actions run 上傳的 tarball 使用 `source=artifact`。工作流程會將候選項解析為 `package-under-test`，重用 Docker E2E 發布排程器針對該 tarball 執行，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一個 tarball 執行 Telegram QA。當所選 Docker lane 包含 `published-upgrade-survivor` 時，套件成品就是候選項，而 `published_upgrade_survivor_baseline` 會選擇已發布的基準。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見設定檔：
  - `smoke`：安裝/channel/agent、Gateway 網路與 config reload lane
  - `package`：成品原生的套件/更新/Plugin lane，不包含 OpenWebUI 或 live ClawHub
  - `product`：套件設定檔加上 MCP channels、cron/subagent cleanup、OpenAI web search 與 OpenWebUI
  - `full`：包含 OpenWebUI 的 Docker 發布路徑區塊
  - `custom`：用於聚焦重跑的精確 `docker_lanes` 選擇
- 當你只需要發布候選版本的完整一般 CI 覆蓋時，直接執行手動 `CI` 工作流程。手動 CI 分派會略過 changed scoping，並強制執行 Linux Node shards、bundled-plugin shards、channel contracts、Node 22 相容性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android 與 Control UI i18n lane。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發布遙測時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver 演練 QA-lab，並驗證匯出的 trace span 名稱、有界屬性，以及內容/識別碼遮蔽，不需要 Opik、Langfuse 或其他外部 collector。
- 每次標記發布前執行 `pnpm release:check`
- 標籤存在後，為會變更狀態的發布序列執行 `OpenClaw Release Publish`。從 `release/YYYY.M.D` 分派它（或在發布 main 可到達標籤時從 `main` 分派），傳入發布標籤與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin 發布範圍 `all-publishable`，除非你刻意執行聚焦修復。工作流程會序列化 Plugin npm publish、Plugin ClawHub publish 與 OpenClaw npm publish，確保核心套件不會在其外部化 Plugin 之前發布。
- 發布檢查現在於獨立的手動工作流程中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發布核准前執行 QA Lab mock parity lane，加上快速 live Matrix profile 與 Telegram QA lane。live lane 使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI credential lease。當你想平行取得完整 Matrix transport、media 與 E2EE inventory 時，請使用 `matrix_profile=all` 和 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` 工作流程。
- 跨 OS 安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，這些工作流程會直接呼叫可重用工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這個拆分是刻意設計的：讓真正的 npm 發布路徑保持短、確定且聚焦於成品，同時讓較慢的 live 檢查保留在自己的 lane 中，避免拖慢或阻擋發布
- 帶有 secret 的發布檢查應透過 `Full Release Validation` 或從 `main`/release 工作流程 ref 分派，讓工作流程邏輯與 secret 維持受控
- `OpenClaw Release Checks` 接受分支、標籤或完整 commit SHA，只要解析出的 commit 可從 OpenClaw 分支或發布標籤到達
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元工作流程分支 commit SHA，不需要已推送的標籤
- 該 SHA 路徑僅供驗證，不能提升為真正發布
- 在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發布標籤
- 兩個工作流程都讓真正的發布與提升路徑維持在 GitHub-hosted runner 上，而不變更狀態的驗證路徑可以使用較大的 Blacksmith Linux runner
- 該工作流程會使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` 工作流程 secret 執行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 發布預檢不再等待獨立的發布檢查 lane
- 核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction 標籤）
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction 版本），在全新的暫時 prefix 中驗證已發布的 registry 安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租借的 Telegram credential pool，針對已發布的 npm 套件驗證已安裝套件 onboarding、Telegram 設定與真正的 Telegram E2E。本機 maintainer 的一次性執行可省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- 若要從 maintainer 機器執行完整的發布後 beta smoke，請使用 `pnpm release:beta-smoke -- --beta betaN`。helper 會執行 Parallels npm update/fresh-target 驗證、分派 `NPM Telegram Beta E2E`、輪詢精確的工作流程 run、下載成品，並列印 Telegram 報告。
- Maintainer 可以透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行相同的發布後檢查。它刻意設為僅手動，不會在每次合併時執行。
- Maintainer 發布自動化現在使用 preflight-then-promote：
  - 真正的 npm publish 必須通過成功的 npm `preflight_run_id`
  - 真正的 npm publish 必須從與成功預檢 run 相同的 `main` 或 `release/YYYY.M.D` 分支分派
  - 穩定 npm 發布預設為 `beta`
  - 穩定 npm publish 可透過工作流程輸入明確指定 `latest`
  - 基於 token 的 npm dist-tag 變更現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，基於安全性，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開 repo 保持僅 OIDC publish
  - 公開 `macOS Release` 僅供驗證；當標籤只存在於發布分支但工作流程從 `main` 分派時，設定 `public_release_branch=release/YYYY.M.D`
  - 真正的私有 mac publish 必須通過成功的私有 mac `preflight_run_id` 與 `validate_run_id`
  - 真正的發布路徑會提升已準備的成品，而不是再次重建它們
- 對於像 `YYYY.M.D-N` 這樣的穩定修正發布，發布後 verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同暫時 prefix 升級路徑，避免發布修正悄悄讓較舊的全域安裝停留在基礎穩定 payload
- npm 發布預檢預設失敗關閉，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，避免再次出貨空的瀏覽器 dashboard
- 發布後驗證也會檢查已發布的 Plugin entrypoint 與套件中繼資料是否存在於已安裝的 registry 版面中。若發布缺少 Plugin 執行階段 payload，會讓 postpublish verifier 失敗，且不能提升到 `latest`。
- `pnpm test:install:smoke` 也會在候選更新 tarball 上強制執行 npm pack `unpackedSize` 預算，因此 installer e2e 會在發布 publish 路徑前捕捉意外的 pack 膨脹
- 如果發布工作觸及 CI 規劃、Plugin timing manifests 或 Plugin test matrices，請在核准前重新產生並審查由 planner 擁有、來自 `.github/workflows/plugin-prerelease.yml` 的 `plugin-prerelease-extension-shard` matrix outputs，避免發布說明描述過期的 CI 版面
- 穩定 macOS 發布就緒也包含 updater surfaces：
  - GitHub release 最終必須包含已封裝的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - 發布後 `main` 上的 `appcast.xml` 必須指向新的穩定 zip
  - 已封裝 app 必須保持非 debug bundle id、非空 Sparkle feed URL，以及等於或高於該發布版本 canonical Sparkle build floor 的 `CFBundleVersion`

## 發布測試盒

`Full Release Validation` 是操作員從單一進入點啟動所有預發布測試的方式。若要在快速移動的分支上取得 pinned commit 證明，請使用 helper，讓每個子工作流程都從固定於目標 SHA 的暫時分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

helper 會推送 `release-ci/<sha>-...`，從該分支分派 `Full Release Validation` 並設定 `ref=<sha>`，驗證每個子工作流程的 `headSha` 都符合目標，然後刪除暫時分支。這可避免意外證明較新的 `main` 子 run。

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

工作流程會解析目標 ref、以 `target_ref=<release-ref>` 觸發手動 `CI`、觸發 `OpenClaw Release Checks`、為面向套件的檢查準備父層 `release-package-under-test` 成品，並且在 `release_profile=full` 且 `rerun_group=all` 時，或設定了 `npm_telegram_package_spec` 時，觸發獨立套件 Telegram E2E。接著 `OpenClaw Release Checks` 會展開安裝冒煙測試、跨作業系統發行檢查、即時/E2E Docker 發行路徑涵蓋、含 Telegram 套件 QA 的 Package Acceptance、QA Lab 同等性、即時 Matrix，以及即時 Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci` 和 `release_checks` 成功時，完整執行才可接受。在 full/all 模式中，`npm_telegram` 子項也必須成功；在 full/all 之外，除非提供了已發布的 `npm_telegram_package_spec`，否則會略過。最終驗證器摘要包含每個子執行的最慢工作表格，因此發行管理者無需下載日誌即可看到目前的關鍵路徑。
如需完整階段矩陣、精確工作流程工作名稱、stable 與 full profile 差異、成品，以及聚焦重新執行控制代碼，請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)。
子工作流程會從執行 `Full Release Validation` 的受信任 ref 觸發，通常是 `--ref main`，即使目標 `ref` 指向較舊的發行分支或標籤也一樣。沒有單獨的 Full Release Validation workflow-ref 輸入；請透過選擇工作流程執行 ref 來選擇受信任的測試框架。
不要在移動中的 `main` 上使用 `--ref main -f ref=<sha>` 取得精確提交證明；原始提交 SHA 不能作為工作流程觸發 ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立固定的暫時分支。

使用 `release_profile` 選擇即時/提供者涵蓋範圍：

- `minimum`：最快速的發行關鍵 OpenAI/core 即時與 Docker 路徑
- `stable`：minimum 加上發行核准所需的穩定提供者/後端涵蓋
- `full`：stable 加上廣泛的諮詢型提供者/媒體涵蓋

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將目標 ref 解析一次為 `release-package-under-test`，並在發行路徑 Docker 檢查與 Package Acceptance 中重複使用該成品。這讓所有面向套件的機器使用相同位元組，並避免重複建置套件。
跨作業系統 OpenAI 安裝冒煙測試會在設定 repo/org 變數時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為這條路徑是在證明套件安裝、onboarding、gateway 啟動，以及一次即時 agent 回合，而不是對最慢的預設模型進行基準測試。更廣泛的即時提供者矩陣仍然是模型特定涵蓋的地方。

依照發行階段使用這些變體：

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

不要將完整 umbrella 用作聚焦修正後的第一次重新執行。如果某台機器失敗，請將失敗的子工作流程、工作、Docker 路徑、套件 profile、模型提供者，或 QA 路徑用於下一次證明。只有當修正變更了共享發行協調，或讓先前全部機器的證據過期時，才再次執行完整 umbrella。umbrella 的最終驗證器會重新檢查記錄的子工作流程執行 id，因此在子工作流程成功重新執行後，只需重新執行失敗的 `Verify full validation` 父工作。

若要進行有界復原，請將 `rerun_group` 傳給 umbrella。`all` 是真正的發行候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行僅發行使用的 plugin 子項，`release-checks` 執行每個發行機器，而較窄的發行群組是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重新執行需要 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 執行會使用 release-checks 套件成品。

### Vitest

Vitest 機器是手動 `CI` 子工作流程。手動 CI 會刻意繞過變更範圍界定，並強制對發行候選執行一般測試圖：Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android，以及 Control UI i18n。

使用這台機器回答「原始碼樹是否通過完整的一般測試套件？」這不同於發行路徑產品驗證。要保留的證據：

- 顯示已觸發 `CI` 執行 URL 的 `Full Release Validation` 摘要
- 精確目標 SHA 上為綠燈的 `CI` 執行
- 調查回歸時來自 CI 工作的失敗或緩慢 shard 名稱
- 當執行需要效能分析時，保留 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發行需要確定性的一般 CI，但不需要 Docker、QA Lab、即時、跨作業系統或套件機器時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 機器位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml` 加上發行模式 `install-smoke` 工作流程。它會透過封裝的 Docker 環境驗證發行候選，而不只是原始碼層級測試。

發行 Docker 涵蓋包括：

- 啟用緩慢 Bun 全域安裝冒煙測試的完整安裝冒煙測試
- 依目標 SHA 準備/重複使用 root Dockerfile 冒煙映像，QR、root/gateway，以及 installer/Bun 冒煙工作會作為獨立 install-smoke shard 執行
- repository E2E 路徑
- 發行路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 要求時，在 `plugins-runtime-services` 區塊內提供 OpenWebUI 涵蓋
- 分拆的 bundled plugin 安裝/解除安裝路徑，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發行檢查包含即時套件時的即時/E2E 提供者套件與 Docker 即時模型涵蓋

重新執行前先使用 Docker 成品。發行路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含路徑日誌、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重新執行命令。若要聚焦復原，請在可重用的即時/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有發行區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker 映像輸入，因此失敗路徑可以重複使用相同 tarball 和 GHCR 映像。

### QA Lab

QA Lab 機器也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為與 channel 層級的發行閘門，獨立於 Vitest 和 Docker 套件機制。

發行 QA Lab 涵蓋包括：

- 使用 agentic parity pack，將 OpenAI 候選路徑與 Opus 4.6 基準線比較的 mock 同等性路徑
- 使用 `qa-live-shared` 環境的快速即時 Matrix QA profile
- 使用 Convex CI 憑證租約的即時 Telegram QA 路徑
- 當發行遙測需要明確本機證明時的 `pnpm qa:otel:smoke`

使用這台機器回答「發行在 QA 情境與即時 channel 流程中是否行為正確？」核准發行時，請保留同等性、Matrix 和 Telegram 路徑的成品 URL。完整 Matrix 涵蓋仍可作為手動分片 QA-Lab 執行使用，而不是預設的發行關鍵路徑。

### 套件

Package 機器是可安裝產品閘門。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選項正規化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本和 SHA-256，並讓工作流程測試框架 ref 與套件來源 ref 分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本
- `source=ref`：使用選定的 `workflow_ref` 測試框架，封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重複使用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發行套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對相同解析 tarball 保持遷移、更新、過時 plugin 依賴清理、離線 plugin 夾具、plugin 更新，以及 Telegram 套件 QA。升級矩陣涵蓋從 `2026.4.23` 到 `latest` 的每個穩定 npm 已發布基準線；對已出貨候選項使用 `source=npm` 的 Package Acceptance，或在發布前對有 SHA 支援的本機 npm tarball 使用 `source=ref`/`source=artifact`。它是過去多數需要 Parallels 的套件/更新涵蓋的 GitHub 原生替代方案。跨作業系統發行檢查對作業系統特定的 onboarding、安裝程式與平台行為仍然重要，但套件/更新產品驗證應優先使用 Package Acceptance。

更新與 plugin 驗證的標準檢查清單是[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。在判斷哪個本機、Docker、Package Acceptance 或 release-check 路徑能證明 plugin 安裝/更新、doctor 清理，或已發布套件遷移變更時，請使用它。從每個穩定 `2026.4.23+` 套件進行的完整已發布更新遷移，是單獨的手動 `Update Migration` 工作流程，不屬於 Full Release CI。

舊版 package-acceptance 寬容性是刻意限時的。到 `2026.4.25` 為止的套件，可以對已發布到 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少 private QA inventory entries、缺少 `gateway install --wrapper`、tarball 衍生 git 夾具中缺少 patch files、缺少持久化 `update.channel`、舊版 plugin install-record 位置、缺少 marketplace install-record persistence，以及 `plugins update` 期間的 config metadata migration。已發布的 `2026.4.26` 套件可能會對已出貨的本機建置中繼資料 stamp files 發出警告。較新的套件必須滿足現代套件合約；相同缺口會導致發行驗證失敗。

當發行問題關於實際可安裝套件時，使用更廣泛的 Package Acceptance profiles：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常用套件 profiles：

- `smoke`：快速套件安裝/頻道/代理、Gateway 網路與設定
  重新載入通道
- `package`：不使用即時 ClawHub 的安裝/更新/Plugin 套件合約；這是 release-check
  預設值
- `product`：`package` 加上 MCP 頻道、cron/subagent 清理、OpenAI 網頁
  搜尋，以及 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：用於聚焦重新執行的精確 `docker_lanes` 清單

若要進行套件候選版 Telegram 驗證，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。此工作流程會將解析出的
`package-under-test` tarball 傳入 Telegram 通道；獨立的
Telegram 工作流程仍接受已發布的 npm 規格，用於發布後檢查。

## 發布自動化

`OpenClaw Release Publish` 是一般會變更狀態的發布進入點。它會依照發布所需的順序
協調 trusted-publisher 工作流程：

1. 簽出發布標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 連到。
3. 執行 `pnpm plugins:sync:check`。
4. 以 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 派發 `Plugin NPM Release`。
5. 使用相同範圍與 SHA 派發 `Plugin ClawHub Release`。
6. 使用發布標籤、npm dist-tag，以及
   已儲存的 `preflight_run_id` 派發 `OpenClaw NPM Release`。

Beta 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

穩定版發布到預設 beta dist-tag：

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

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 與 `Plugin ClawHub Release` 工作流程。若要修復選定的 plugin，請將
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`，或在不得發布 OpenClaw 套件時直接派發子工作流程。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受這些由操作者控制的輸入：

- `tag`：必要的發布標籤，例如 `v2026.4.2`、`v2026.4.2-1`，或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前
  完整 40 字元的工作流程分支 commit SHA，用於僅驗證的預檢
- `preflight_only`：`true` 表示僅驗證/建置/打包，`false` 表示
  真正的發布路徑
- `preflight_run_id`：真正發布路徑必填，讓工作流程重用
  成功預檢執行所準備的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受這些由操作者控制的輸入：

- `tag`：必要的發布標籤；必須已經存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 ID；
  當 `publish_openclaw_npm=true` 時必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；只有在
  聚焦修復工作時才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有在使用此
  工作流程作為僅 plugin 修復的協調器時才設為 `false`

`OpenClaw Release Checks` 接受這些由操作者控制的輸入：

- `ref`：要驗證的分支、標籤，或完整 commit SHA。含有祕密的檢查
  要求解析出的 commit 可從 OpenClaw 分支或
  發布標籤連到。

規則：

- 穩定版與修正版標籤可以發布到 `beta` 或 `latest`
- Beta 預發布標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 時才允許完整 commit SHA 輸入
- `OpenClaw Release Checks` 與 `Full Release Validation` 一律
  只進行驗證
- 真正發布路徑必須使用預檢期間所用的同一個 `npm_dist_tag`；
  工作流程會在發布繼續前驗證該中繼資料

## 穩定版 npm 發布順序

切出穩定版 npm 發布時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在之前，你可以使用目前完整的工作流程分支 commit
     SHA，對預檢工作流程進行僅驗證的試執行
2. 一般 beta-first 流程選擇 `npm_dist_tag=beta`，或只有在你有意直接發布穩定版時才選擇 `latest`
3. 當你想從單一手動工作流程取得一般 CI 加上即時 prompt cache、Docker、QA Lab、
   Matrix 與 Telegram 覆蓋時，請在發布分支、發布標籤，或完整
   commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要可重現的一般測試圖，請改在發布 ref 上執行
   手動 `CI` 工作流程
5. 儲存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`，
   以及已儲存的 `preflight_run_id` 執行 `OpenClaw Release Publish`；它會先將外部化的 plugins 發布到 npm
   與 ClawHub，再提升 OpenClaw npm 套件
7. 如果發布落在 `beta`，請使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流程，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發布是有意直接發布到 `latest`，而 `beta`
   應該立即跟隨同一個穩定版建置，請使用同一個私有
   工作流程，讓兩個 dist-tags 都指向該穩定版本，或讓其排程的
   自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 是出於安全考量，因為它仍然
需要 `NPM_TOKEN`，而公開 repo 維持僅使用 OIDC 發布。

這讓直接發布路徑與 beta-first 提升路徑都保有文件化且操作者可見。

如果維護者必須退回本機 npm 驗證，請只在專用 tmux 工作階段內執行任何 1Password
CLI (`op`) 命令。不要直接從主代理 shell 呼叫 `op`；將其保留在 tmux 內可讓提示、
警示與 OTP 處理可觀察，並防止重複的主機警示。

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
中的私有發布文件作為實際操作手冊。

## 相關

- [發布通道](/zh-TW/install/development-channels)
