---
read_when:
    - 正在尋找公開發布通道定義
    - 執行發行驗證或套件驗收
    - 正在尋找版本命名與發布節奏
    - 規劃每月支援或 LTS 發行線
summary: 發行通道、操作員檢查清單、驗證機器、版本命名、規劃中的每月支援系列與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-07T01:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布通道：

- stable：標記的發布版本，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發布標籤
- dev：`main` 的移動前端

## 版本命名

- Stable 發布版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 舊版 stable 修正發布版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發布版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已推廣的 stable npm 發布版本
- `beta` 表示目前的 beta 安裝目標
- Stable 與舊版修正發布預設發布到 npm `beta`；發布操作員可以明確指定 `latest`，或稍後推廣已審核的 beta 建置
- 每個 stable OpenClaw 發布版本都會同時交付 npm package 和 macOS app；
  beta 發布通常會先驗證並發布 npm/package 路徑，除非明確要求，否則
  mac app 建置/簽署/公證會保留給 stable

### 規劃中的每月支援版本

OpenClaw 目前還沒有 LTS 或每月支援通道。維護者正在
朝向相容 SemVer 的每月支援線邁進，但目前已交付的更新
通道仍是 `stable`、`beta` 和 `dev`。

規劃中的版本格式是 `YYYY.M.PATCH`：

- `YYYY` 是年份。
- `M` 是每月發布線，不含前導零。
- `PATCH` 在該每月線內遞增，並且可以視需要增長到任意高度。

例如，`2026.6.0`、`2026.6.1` 和 `2026.6.2` 都會在 2026 年 6 月
這條線上。未來的每月支援 dist-tag，例如 `stable-2026-6` 或
`lts-2026-6`，可能會指向該線，而 `latest` 會繼續快速移動。

這個未來模型會取代新 `YYYY.M.D-N` 修正發布的需求。
既有舊版修正版本仍會被識別，讓較舊的 package 和
升級路徑能持續運作。

## 發布節奏

- 發布採 beta 優先
- Stable 只會在最新 beta 驗證後跟進
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發布，
  這樣發布驗證和修正就不會阻礙 `main` 上的新
  開發
- 如果 beta 標籤已被推送或發布且需要修正，維護者會切出
  下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細的發布程序、核准、憑證和復原注意事項
  僅限維護者使用

## 發布操作員檢查清單

此檢查清單是發布流程的公開形態。私人憑證、
簽署、公證、dist-tag 復原和緊急回復細節會留在
僅限維護者使用的發布 runbook 中。

1. 從目前的 `main` 開始：拉取最新版本，確認目標 commit 已推送，
   並確認目前 `main` 的 CI 狀態足以從它建立分支。
2. 使用 `/changelog` 依據真實 commit 歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交並推送，然後在分支前再 rebase/pull
   一次。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍被涵蓋時才移除過期的
   相容性，或記錄為何刻意保留。
4. 從目前的 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發布工作。
5. 為預定標籤更新每個必要版本位置，執行
   `pnpm plugins:sync`，讓可發布的 Plugin package 共用發布
   版本和相容性中繼資料，然後執行本機決定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，
   允許使用完整 40 字元的發布分支 SHA 進行僅驗證的
   預檢。儲存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation`，為發布分支、標籤或完整 commit SHA
   啟動所有預發布測試。這是四個大型發布測試箱
   Vitest、Docker、QA Lab 和 Package 的單一手動入口點。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正的最小失敗
   檔案、通道、workflow job、package profile、provider 或 model allowlist。
   只有在變更的表面讓既有證據過期時，才重新執行完整 umbrella。
9. 對 beta，標記 `vYYYY.M.D-beta.N`，然後從相符的
   `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   將所有可發布的 Plugin package 平行派送到 npm，以及同一組派送到
   ClawHub，然後在 Plugin npm 發布成功後，立即使用相符的 dist-tag
   推廣已準備好的 OpenClaw npm 預檢
   artifact。ClawHub 發布在 OpenClaw npm 發布時可能仍在執行，但
   release publish workflow 不會在兩條 Plugin 發布路徑和
   OpenClaw npm 發布路徑都成功完成前結束。發布後，請針對已發布的
   `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` package 執行發布後 package
   acceptance。如果已推送或已發布的預發布需要修正，
   請切出下一個相符的預發布編號；不要刪除或重寫舊的
   預發布。
10. 對 stable，只有在已審核的 beta 或 release candidate 擁有所需的
    驗證證據後才繼續。Stable npm 發布也會透過
    `OpenClaw Release Publish`，使用 `preflight_run_id` 重用成功的預檢 artifact；
    stable macOS 發布準備就緒也需要 `main` 上的
    已封裝 `.zip`、`.dmg`、`.dSYM.zip` 和更新後的 `appcast.xml`。
11. 發布後，執行 npm 發布後 verifier、需要發布後通道證明時可選的 standalone
    published-npm Telegram E2E、
    需要時的 dist-tag 推廣、來自完整相符 `CHANGELOG.md` 區段的 GitHub
    release/prerelease notes，以及發布公告
    步驟。

## 發布預檢

- 在發行預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 關卡之外也受到涵蓋
- 在發行預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機關卡之外也保持通過
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發行成品與 Control UI bundle 存在，以供打包驗證步驟使用
- 在根版本遞增後、標記 tag 前執行 `pnpm plugins:sync`。它會更新可發布 Plugin 套件版本、OpenClaw peer/API 相容性中繼資料、建置中繼資料，以及 Plugin 變更記錄 stub，使其符合核心發行版本。`pnpm plugins:sync:check` 是不會變更檔案的發行防護；如果忘記這個步驟，發布工作流程會在任何 registry 變更前失敗。
- 在發行核准前執行手動 `Full Release Validation` 工作流程，從單一進入點啟動所有發行前測試箱。它接受分支、tag 或完整 commit SHA，會派發手動 `CI`，並派發 `OpenClaw Release Checks`，涵蓋安裝 smoke、套件接受度、跨 OS 套件檢查、QA Lab parity、Matrix 與 Telegram lanes。穩定版/預設執行會將完整 live/E2E 與 Docker 發行路徑 soak 保留在 `run_release_soak=true` 後方；`release_profile=full` 會強制開啟 soak。搭配 `release_profile=full` 與 `rerun_group=all` 時，它也會使用 release checks 產生的 `release-package-under-test` artifact 執行套件 Telegram E2E。發布後，如果同一個 Telegram E2E 也應驗證已發布的 npm 套件，請提供 `npm_telegram_package_spec`。發布後，如果 Package Acceptance 應針對已出貨的 npm 套件而非由 SHA 建置的 artifact 執行其 package/update matrix，請提供 `package_acceptance_package_spec`。如果私人證據報告應證明驗證結果符合已發布的 npm 套件，但不強制執行 Telegram E2E，請提供 `evidence_package_spec`。範例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在發行工作持續進行時，為套件候選版本取得旁路證明，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或精確發行版本使用 `source=npm`；使用 `source=ref` 搭配目前的 `workflow_ref` harness 來打包受信任的 `package_ref` 分支/tag/SHA；使用 `source=url` 搭配需要 SHA-256 的 HTTPS tarball；或使用 `source=artifact` 取得由其他 GitHub Actions run 上傳的 tarball。此工作流程會將候選版本解析為 `package-under-test`，重用 Docker E2E 發行排程器針對該 tarball 執行，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一個 tarball 執行 Telegram QA。當選取的 Docker lanes 包含 `published-upgrade-survivor` 時，package artifact 就是候選版本，而 `published_upgrade_survivor_baseline` 會選取已發布的 baseline。`update-restart-auth` 會同時使用候選套件作為已安裝的 CLI 與 package-under-test，因此會演練候選更新命令的受管理重啟路徑。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用 profiles：
  - `smoke`：install/channel/agent、Gateway 網路與 config reload lanes
  - `package`：不含 OpenWebUI 或 live ClawHub 的 artifact-native package/update/restart/plugin lanes
  - `product`：package profile 加上 MCP channels、cron/subagent cleanup、OpenAI web search 與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發行路徑 chunks
  - `custom`：用於聚焦重跑的精確 `docker_lanes` 選取
- 當你只需要發行候選版本的完整一般 CI 覆蓋率時，請直接執行手動 `CI` 工作流程。手動 CI 派發會略過 changed scoping，並強制執行 Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android 與 Control UI i18n lanes。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發行 telemetry 時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver 演練 QA-lab，並驗證匯出的 trace span 名稱、有界屬性，以及內容/識別碼遮蔽，不需要 Opik、Langfuse 或其他外部 collector。
- 每次標記發行前都執行 `pnpm release:check`
- 在 tag 存在後，執行 `OpenClaw Release Publish` 進行會變更狀態的發布序列。從 `release/YYYY.M.D` 派發它（或在發布 main 可到達 tag 時從 `main` 派發），傳入 release tag 與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin 發布範圍 `all-publishable`，除非你刻意執行聚焦修復。此工作流程會序列化 Plugin npm publish、Plugin ClawHub publish 與 OpenClaw npm publish，避免核心套件在其外部化 Plugin 前被發布。
- Release checks 現在於獨立的手動工作流程中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發行核准前執行 QA Lab mock parity lane，以及快速 live Matrix profile 與 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential leases。當你想平行取得完整 Matrix transport、media 與 E2EE inventory 時，請使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` 工作流程。
- 跨 OS 安裝與升級 runtime 驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，會直接呼叫 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這項拆分是有意為之：讓真正的 npm 發行路徑保持短小、確定且以 artifact 為核心，同時讓較慢的 live checks 留在自己的 lane 中，避免拖慢或阻擋發布
- 帶有 secret 的發行檢查應透過 `Full Release
Validation` 或從 `main`/release workflow ref 派發，讓工作流程邏輯與 secrets 維持受控
- `OpenClaw Release Checks` 接受分支、tag 或完整 commit SHA，只要解析出的 commit 可從 OpenClaw 分支或 release tag 到達
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元的 workflow-branch commit SHA，不需要已推送的 tag
- 該 SHA 路徑僅供驗證，不能提升為真正發布
- 在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真實 release tag
- 兩個工作流程都將真正的發布與提升路徑保留在 GitHub-hosted runners 上，而不會變更狀態的驗證路徑可以使用較大的 Blacksmith Linux runners
- 該工作流程會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 執行，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets
- npm 發行預檢不再等待獨立的 release checks lane
- 在核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction tag）
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction version），以在全新的暫存 prefix 中驗證已發布 registry 安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租用的 Telegram credential pool，針對已發布 npm 套件驗證已安裝套件 onboarding、Telegram 設定與真實 Telegram E2E。本機 maintainer 一次性執行可省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- 若要從 maintainer 機器執行完整的發布後 beta smoke，請使用 `pnpm release:beta-smoke -- --beta betaN`。helper 會執行 Parallels npm update/fresh-target 驗證、派發 `NPM Telegram Beta E2E`、輪詢精確 workflow run、下載 artifact，並列印 Telegram 報告。
- Maintainers 可以透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行相同的發布後檢查。它刻意僅允許手動執行，不會在每次 merge 時執行。
- Maintainer 發行自動化現在使用 preflight-then-promote：
  - 真正 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真正 npm 發布必須從與成功預檢 run 相同的 `main` 或 `release/YYYY.M.D` 分支派發
  - 穩定版 npm releases 預設為 `beta`
  - 穩定版 npm publish 可透過 workflow input 明確指定目標為 `latest`
  - token-based npm dist-tag mutation 現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，這是出於安全考量，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開 repo 維持 OIDC-only publish
  - 公開 `macOS Release` 僅供驗證；當 tag 只存在於 release branch，但 workflow 從 `main` 派發時，請設定 `public_release_branch=release/YYYY.M.D`
  - 真正 private mac publish 必須通過成功的 private mac `preflight_run_id` 與 `validate_run_id`
  - 真正發布路徑會提升已準備好的 artifacts，而不是再次重建它們
- 對於像 `YYYY.M.D-N` 這類 legacy stable correction releases，發布後 verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同暫存 prefix 升級路徑，讓 release corrections 不會默默讓較舊的全域安裝停留在基礎穩定版 payload
- 除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，否則 npm 發行預檢會 fail closed，避免我們再次出貨空的瀏覽器 dashboard
- 發布後驗證也會檢查已發布的 Plugin entrypoints 與套件中繼資料是否存在於已安裝的 registry layout 中。若發行版本缺少 Plugin runtime payloads，postpublish verifier 會失敗，且不能提升為 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，因此 installer e2e 會在發行發布路徑前捕捉意外的 pack 膨脹
- 如果發行工作觸及 CI planning、extension timing manifests 或 extension test matrices，請在核准前重新產生並審查 planner-owned `plugin-prerelease-extension-shard` matrix outputs，來源為 `.github/workflows/plugin-prerelease.yml`，讓發行說明不會描述過時的 CI layout
- 穩定版 macOS 發行就緒狀態也包含 updater surfaces：
  - GitHub release 最終必須包含已打包的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - 發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip
  - 已打包的 app 必須保留非 debug bundle id、非空的 Sparkle feed URL，以及對該發行版本而言等於或高於 canonical Sparkle build floor 的 `CFBundleVersion`

## 發行測試箱

`Full Release Validation` 是 operators 從單一進入點啟動所有發行前測試的方式。若要在快速移動分支上取得 pinned commit proof，請使用 helper，讓每個 child workflow 都從固定在目標 SHA 的暫時分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

helper 會推送 `release-ci/<sha>-...`，從該分支派發 `Full Release Validation` 並使用 `ref=<sha>`，驗證每個 child workflow 的 `headSha` 都符合目標，然後刪除暫時分支。這可避免意外證明較新的 `main` child run。

若要驗證 release branch 或 tag，請從受信任的 `main` workflow ref 執行，並將 release branch 或 tag 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

此工作流程會解析目標 ref、分派手動 `CI` 並帶上
`target_ref=<release-ref>`、分派 `OpenClaw Release Checks`、為面向套件的檢查準備父層 `release-package-under-test` 成品，並且在 `release_profile=full` 搭配
`rerun_group=all`，或設定 `npm_telegram_package_spec` 時，分派獨立套件 Telegram E2E。接著 `OpenClaw Release
Checks` 會展開安裝煙霧測試、跨 OS 發行檢查、啟用 soak 時的 live/E2E Docker
發行路徑覆蓋、包含 Telegram
套件 QA 的 Package Acceptance、QA Lab parity、live Matrix，以及 live Telegram。只有在
`Full Release Validation`
摘要顯示 `normal_ci` 和 `release_checks` 成功時，完整執行才可接受。在 full/all 模式中，
`npm_telegram` 子項也必須成功；在 full/all 之外，除非提供了已發布的 `npm_telegram_package_spec`，否則會略過它。最終
驗證器摘要會包含每個子執行的最慢工作表格，讓發行管理員不必下載記錄即可查看目前的關鍵路徑。
請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、確切工作流程工作名稱、stable 與 full profile
差異、成品，以及聚焦重新執行控制柄。
子工作流程會從執行 `Full Release
Validation` 的受信任 ref 分派，通常是 `--ref main`，即使目標 `ref` 指向較舊的發行分支或標籤也是如此。沒有獨立的 Full Release Validation
workflow-ref 輸入；請透過選擇工作流程執行 ref 來選擇受信任的測試框架。
不要在移動中的 `main` 上使用 `--ref main -f ref=<sha>` 取得精確提交證明；
原始提交 SHA 不能作為工作流程分派 ref，因此請使用
`pnpm ci:full-release --sha <sha>` 建立釘選的暫時分支。

使用 `release_profile` 選擇 live/provider 廣度：

- `minimum`：最快的發行關鍵 OpenAI/core live 與 Docker 路徑
- `stable`：minimum 加上穩定 provider/backend 覆蓋，用於發行核准
- `full`：stable 加上廣泛 advisory provider/media 覆蓋

當發行封鎖 lanes
為綠色，且你想在升級前執行完整的 live/E2E、Docker 發行路徑，以及
有界限的已發布 upgrade-survivor 掃描時，請搭配 `stable` 使用 `run_release_soak=true`。該掃描涵蓋最新四個 stable 套件，加上釘選的 `2026.4.23` 與 `2026.5.2`
基準，以及較舊的 `2026.4.15` 覆蓋，並移除重複基準，且將每個基準分片到自己的 Docker runner 工作中。`full` 隱含
`run_release_soak=true`。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將目標
ref 一次解析為 `release-package-under-test`，並在 soak 執行時於 cross-OS、
Package Acceptance 與 release-path Docker 檢查中重用該成品。這會讓所有面向套件的 boxes 使用相同位元組，並避免重複建置套件。
cross-OS OpenAI 安裝煙霧測試會在設定 repo/org 變數時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此 lane
是在證明套件安裝、onboarding、Gateway 啟動，以及一次 live agent 回合，而不是對最慢的預設模型進行基準測試。更廣泛的 live provider
矩陣仍然是模型特定覆蓋的位置。

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

不要把完整傘狀工作流程作為聚焦修正後的第一次重新執行。如果某個 box
失敗，請使用失敗的子工作流程、工作、Docker lane、套件 profile、模型
provider 或 QA lane 取得下一次證明。只有當修正變更了共享發行協調流程，或讓先前的全 box 證據
過期時，才再次執行完整傘狀工作流程。傘狀工作流程的最終驗證器會重新檢查已記錄的子工作流程執行
id，因此在子工作流程成功重新執行後，只需重新執行失敗的
`Verify full validation` 父工作。

若要進行有界限復原，請將 `rerun_group` 傳給傘狀工作流程。`all` 是真正的
發行候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease`
只執行僅限發行的 Plugin 子項，`release-checks` 執行每個發行
box，而較窄的發行群組是 `install-smoke`、`cross-os`、
`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重新執行需要 `npm_telegram_package_spec`；使用
`release_profile=full` 的 full/all 執行會使用 release-checks 套件成品。聚焦的
cross-OS 重新執行可以加入 `cross_os_suite_filter=windows/packaged-upgrade` 或
其他 OS/suite 篩選器。QA release-check 失敗屬於 advisory；僅 QA
失敗不會封鎖發行驗證。

### Vitest

Vitest box 是手動 `CI` 子工作流程。手動 CI 會刻意
略過變更範圍，並強制對發行候選執行一般測試圖：Linux Node 分片、bundled-plugin 分片、channel contracts、Node 22
相容性、`check`、`check-additional`、建置煙霧測試、docs checks、Python
skills、Windows、macOS、Android，以及 Control UI i18n。

使用此 box 回答「原始碼樹是否通過完整的一般測試套件？」
它不同於 release-path 產品驗證。要保留的證據：

- `Full Release Validation` 摘要顯示已分派的 `CI` 執行 URL
- `CI` 在精確目標 SHA 上為綠色
- 調查迴歸時 CI 工作中的失敗或緩慢分片名稱
- 當執行需要效能分析時，Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有在發行需要具決定性的一般 CI，但不需要 Docker、QA Lab、live、cross-OS 或套件 boxes 時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位於 `OpenClaw Release Checks` 中，透過
`openclaw-live-and-e2e-checks-reusable.yml`，以及發行模式
`install-smoke` 工作流程。它會透過已封裝的
Docker 環境驗證發行候選，而不只是原始碼層級測試。

發行 Docker 覆蓋包含：

- 啟用緩慢 Bun 全域安裝煙霧測試的完整安裝煙霧測試
- 依目標 SHA 準備/重用根 Dockerfile 煙霧映像，QR、
  root/gateway 與 installer/Bun 煙霧工作會作為獨立 install-smoke
  分片執行
- 儲存庫 E2E lanes
- release-path Docker chunks：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 需要時在 `plugins-runtime-services` chunk 內的 OpenWebUI 覆蓋
- 分割的 bundled Plugin 安裝/解除安裝 lanes
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-23`
- 發行檢查包含 live suites 時的 live/E2E provider suites 與 Docker live 模型覆蓋

在重新執行前先使用 Docker 成品。release-path 排程器會上傳
`.artifacts/docker-tests/`，其中包含 lane 記錄、`summary.json`、`failures.json`、
階段計時、排程器計畫 JSON，以及重新執行命令。若要聚焦復原，
請在可重用的 live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是
重新執行所有發行 chunks。產生的重新執行命令會在可用時包含先前的
`package_artifact_run_id` 與已準備的 Docker 映像輸入，因此失敗的 lane
可以重用相同 tarball 與 GHCR 映像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic
行為與 channel 層級發行閘門，獨立於 Vitest 和 Docker
套件機制。

發行 QA Lab 覆蓋包含：

- 使用 agentic parity pack 比較 OpenAI 候選 lane 與 Opus 4.6
  基準的 mock parity lane
- 使用 `qa-live-shared` 環境的快速 live Matrix QA profile
- 使用 Convex CI credential leases 的 live Telegram QA lane
- 當發行遙測需要明確本機證明時的 `pnpm qa:otel:smoke`

使用此 box 回答「發行在 QA 情境與 live channel 流程中是否行為正確？」
核准發行時，請保留 parity、Matrix 和 Telegram
lanes 的成品 URL。完整 Matrix 覆蓋仍可作為手動分片 QA-Lab 執行使用，而非預設的發行關鍵 lane。

### 套件

套件 box 是可安裝產品閘門。它由
`Package Acceptance` 與 resolver
`scripts/resolve-openclaw-package-candidate.mjs` 支援。resolver 會將候選正規化為
Docker E2E 消耗的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並將
工作流程測試框架 ref 與套件來源 ref 分開。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行
  版本
- `source=ref`：使用選取的 `workflow_ref` 測試框架打包受信任的 `package_ref` 分支、標籤，或完整提交 SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會以 `source=artifact`、已準備的發行套件成品、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、
`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會讓 migration、update、
configured-auth update restart、陳舊 Plugin 相依性清理、離線 Plugin
fixtures、Plugin update，以及 Telegram package QA 針對相同解析後的
tarball 執行。封鎖性發行檢查使用預設最新已發布套件
基準；`run_release_soak=true` 或
`release_profile=full` 會擴展到從
`2026.4.23` 到 `latest` 的每個 stable npm 已發布基準，加上已回報問題的 fixtures。對已出貨候選使用
Package Acceptance 搭配 `source=npm`，或在發布前針對有 SHA 支撐的本機 npm tarball 使用
`source=ref`/`source=artifact`。它是多數先前需要
Parallels 的套件/update 覆蓋的 GitHub 原生
替代方案。cross-OS 發行檢查對 OS 特定 onboarding、
installer 與平台行為仍然重要，但套件/update 產品驗證應優先使用 Package Acceptance。

update 與 Plugin 驗證的標準檢查清單是
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。在判斷哪個本機、Docker、Package Acceptance 或 release-check lane 能證明
Plugin 安裝/update、doctor cleanup，或已發布套件 migration 變更時，請使用它。
從每個 stable `2026.4.23+` 套件進行的完整已發布 update migration 是
獨立的手動 `Update Migration` 工作流程，不屬於 Full Release CI。

舊版 package-acceptance 寬容性是刻意限時保留的。到
`2026.4.25` 為止的套件，對於已發布到 npm 的中繼資料缺口，可以使用相容性路徑：
tar 封存檔中缺少私有 QA 清單項目、缺少 `gateway install --wrapper`、
tar 封存檔衍生的 git 測試夾具中缺少修補檔、缺少持久化的 `update.channel`、
舊版 Plugin 安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及在
`plugins update` 期間進行設定中繼資料遷移。已發布的 `2026.4.26` 套件，對於已經出貨的本機建置中繼資料戳記檔可以發出警告。後續套件
必須符合現代套件契約；相同缺口會使發行驗證失敗。

當發行問題涉及實際可安裝套件時，請使用較廣的 Package Acceptance 設定檔：

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

- `smoke`：快速套件安裝/通道/代理、Gateway 網路，以及設定
  重新載入路徑
- `package`：不含即時
  ClawHub 的安裝/更新/重新啟動/Plugin 套件契約；這是 release-check 預設值
- `product`：`package` 加上 MCP 通道、cron/subagent 清理、OpenAI 網頁
  搜尋，以及 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：用於聚焦重跑的精確 `docker_lanes` 清單

若要進行套件候選版 Telegram 驗證，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。該 workflow 會將解析出的
`package-under-test` tar 封存檔傳入 Telegram 路徑；獨立的
Telegram workflow 仍接受已發布的 npm 規格，以進行發布後檢查。

## 發行發布自動化

`OpenClaw Release Publish` 是一般的變更型發布進入點。它會依發行所需順序編排 trusted-publisher workflow：

1. 簽出發行標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 到達。
3. 執行 `pnpm plugins:sync:check`。
4. 以 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 派送 `Plugin NPM Release`。
5. 以相同範圍與 SHA 派送 `Plugin ClawHub Release`。
6. 以發行標籤、npm dist-tag，以及已儲存的 `preflight_run_id`
   派送 `OpenClaw NPM Release`。

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

穩定版直接提升到 `latest` 必須明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflow。若是選定 Plugin 修復，請將
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`；或是在不得發布 OpenClaw 套件時，直接派送子 workflow。

## NPM workflow 輸入

`OpenClaw NPM Release` 接受這些由操作員控制的輸入：

- `tag`：必要發行標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整 40 字元的 workflow 分支 commit SHA，用於僅驗證的預檢
- `preflight_only`：`true` 表示只進行驗證/建置/套件，`false` 表示
  真正發布路徑
- `preflight_run_id`：真正發布路徑需要此項，讓 workflow 重用
  成功預檢執行中準備好的 tar 封存檔
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受這些由操作員控制的輸入：

- `tag`：必要發行標籤；必須已經存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 ID；
  當 `publish_openclaw_npm=true` 時為必要
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；僅在聚焦修復工作時
  使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，逗號分隔的
  `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；僅在將該
  workflow 作為僅 Plugin 修復編排器時設為 `false`

`OpenClaw Release Checks` 接受這些由操作員控制的輸入：

- `ref`：要驗證的分支、標籤，或完整 commit SHA。含密鑰的檢查
  要求解析出的 commit 可從 OpenClaw 分支或
  發行標籤到達。
- `run_release_soak`：在穩定版/預設發行檢查上，選擇加入完整即時/E2E、Docker 發行路徑，以及
  all-since upgrade-survivor soak。它會由 `release_profile=full` 強制啟用。

規則：

- 穩定版與修正版標籤可以發布到 `beta` 或 `latest`
- Beta 預發行標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 時才允許完整 commit SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律
  只做驗證
- 真正發布路徑必須使用預檢期間使用的同一個 `npm_dist_tag`；
  workflow 會在發布繼續之前驗證該中繼資料

## 穩定版 npm 發行流程

切出穩定版 npm 發行時：

1. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在之前，你可以使用目前完整 workflow 分支 commit
     SHA，對預檢 workflow 進行僅驗證的 dry run
2. 一般 beta-first 流程選擇 `npm_dist_tag=beta`；只有在你有意直接發布穩定版時才選擇 `latest`
3. 當你希望透過單一手動 workflow 取得一般 CI 加上即時 prompt cache、Docker、QA Lab、
   Matrix，以及 Telegram 覆蓋時，請在發行分支、發行標籤或完整
   commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要 deterministic 的一般測試圖，請改在發行 ref 上執行
   手動 `CI` workflow
5. 儲存成功的 `preflight_run_id`
6. 使用相同 `tag`、相同 `npm_dist_tag`，以及已儲存的 `preflight_run_id` 執行 `OpenClaw Release Publish`；它會先將外部化的 Plugins 發布到 npm
   和 ClawHub，再提升 OpenClaw npm 套件
7. 如果發行落在 `beta`，請使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發行刻意直接發布到 `latest`，且 `beta`
   應立即跟隨相同的穩定建置，請使用同一個私有
   workflow，將兩個 dist-tag 都指向該穩定版本，或讓其排程自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中是基於安全性，因為它仍
需要 `NPM_TOKEN`，而公開 repo 則維持僅 OIDC 發布。

這讓直接發布路徑與 beta-first 提升路徑都
有文件記載，且對操作員可見。

如果維護者必須退回本機 npm 驗證，請只在專用 tmux session 中執行任何 1Password
CLI (`op`) 指令。不要從主要代理 shell 直接呼叫 `op`；把它保留在 tmux 內，可讓提示、
警示與 OTP 處理可被觀察，並避免重複主機警示。

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
中的私有發行文件作為實際 runbook。

## 相關

- [發行通道](/zh-TW/install/development-channels)
