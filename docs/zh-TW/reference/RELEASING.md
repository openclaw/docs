---
read_when:
    - 正在尋找公開發布通道定義
    - 執行發布驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作者檢查清單、驗證框、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-11T20:34:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三條公開發布通道：

- stable：已加標籤的發布，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發布標籤
- dev：`main` 的移動中最新提交

## 版本命名

- 穩定版發布版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定版修正發布版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發布版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已晉升的穩定版 npm 發布
- `beta` 表示目前的 beta 安裝目標
- 穩定版與穩定版修正發布預設發布到 npm `beta`；發布操作員可以明確指定 `latest`，或稍後晉升已驗證的 beta 建置
- 每個穩定版 OpenClaw 發布都會同時交付 npm 套件與 macOS app；
  beta 發布通常會先驗證並發布 npm/package 路徑，而 mac app 建置/簽署/公證
  除非明確要求，否則保留給穩定版

## 發布節奏

- 發布採 beta 優先
- 只有在最新 beta 已驗證後才會接續穩定版
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發布，
  讓發布驗證與修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發布後需要修正，維護者會切出下一個 `-beta.N` 標籤，
  而不是刪除或重建舊的 beta 標籤
- 詳細發布程序、核准、憑證與復原備註
  僅限維護者使用

## 發布操作員檢查清單

此檢查清單是發布流程的公開形狀。私人憑證、
簽署、公證、dist-tag 復原與緊急回復細節會保留在
僅限維護者使用的發布手冊中。

1. 從目前 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` 的 CI 足夠綠燈，可以從它建立分支。
2. 使用 `/changelog` 根據真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持項目面向使用者，提交它、推送它，並在建立分支前再次 rebase/pull。
3. 檢閱
   `src/plugins/compat/registry.ts` 與
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍受涵蓋時才移除過期的
   相容性，或記錄為何有意保留。
4. 從目前 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上執行一般發布工作。
5. 為預期標籤提升每個必要版本位置，然後執行
   `pnpm release:prep`。它會依正確順序重新整理 Plugin 版本、Plugin 清單、設定
   schema、內建通道設定中繼資料、設定文件基準、Plugin SDK
   匯出，以及 Plugin SDK API 基準。在加標籤前提交任何產生的
   差異。然後執行本機確定性 preflight：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在前，
   可使用完整 40 字元的發布分支 SHA 進行僅驗證的
   preflight。儲存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 針對發布分支、標籤或完整提交 SHA
   啟動所有預發布測試。這是四個大型發布測試盒的唯一手動入口：
   Vitest、Docker、QA Lab 與 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正的最小失敗
   檔案、通道、workflow job、package profile、provider 或 model allowlist。
   只有在變更的表面使先前證據過期時，才重新執行完整 umbrella。
9. 對於 beta，標記 `vYYYY.M.D-beta.N`，然後從相符的 `release/YYYY.M.D` 分支
   執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   將所有可發布的 Plugin 套件平行派送到 npm 與同一組到
   ClawHub，然後在 Plugin npm 發布成功後，立即以相符的 dist-tag
   晉升已準備好的 OpenClaw npm preflight 成品。
   在 OpenClaw npm publish 子項成功後，它會從完整相符的
   `CHANGELOG.md` 區段建立或更新相符的 GitHub release/prerelease 頁面。
   發布到 npm `latest` 的穩定版會成為 GitHub 最新發布；保留在 npm `beta` 的
   穩定版維護發布會以 GitHub `latest=false` 建立。
   ClawHub 發布可能在 OpenClaw npm 發布時仍在執行，但發布 workflow
   會立即列印子執行 ID。預設情況下，它在派送 ClawHub 後不會等待它，
   因此 OpenClaw npm 可用性不會被較慢的 ClawHub 核准或 registry 工作阻塞；
   當 ClawHub 必須阻塞 workflow 完成時，請設定
   `wait_for_clawhub=true`。ClawHub 路徑會重試暫時性 CLI 相依套件安裝失敗，
   即使某個 preview cell 不穩定也會發布 preview 通過的 Plugin，
   並以每個預期 Plugin 版本的 registry 驗證結束，讓部分發布
   仍可見且可重試。發布後，針對已發布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 套件執行
   發布後套件
   acceptance。如果已推送或已發布的預發布需要修正，
   請切出下一個相符的預發布編號；不要刪除或重寫舊的
   預發布。
10. 對於穩定版，只有在已審核的 beta 或 release candidate 具備
    必要驗證證據後才繼續。穩定版 npm 發布也會透過
    `OpenClaw Release Publish`，使用 `preflight_run_id` 重用成功的 preflight 成品；
    穩定版 macOS 發布就緒還需要 `main` 上有已打包的 `.zip`、`.dmg`、`.dSYM.zip`
    與更新後的 `appcast.xml`。
    私有 macOS 發布 workflow 會在發布資產驗證後，自動將已簽署的 appcast
    發布到公開 `main`；如果分支保護阻擋直接推送，它會開啟或更新 appcast PR。
11. 發布後，執行 npm 發布後驗證器、需要發布後通道證明時可選的獨立
    published-npm Telegram E2E、必要時的 dist-tag 晉升、驗證產生的 GitHub release 頁面，
    並執行發布公告步驟。

## 發布 preflight

- 在 release preflight 前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` gate 之外也保持涵蓋
- 在 release preflight 前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機 gate 之外也保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓 pack 驗證步驟所需的 `dist/*` 發行成品與 Control UI bundle 存在
- 在根版本 bump 之後、tagging 之前執行 `pnpm release:prep`。它會執行每個在版本/config/API 變更後常見漂移的確定性發行產生器：Plugin 版本、Plugin inventory、base config schema、bundled channel config metadata、config docs baseline、Plugin SDK exports，以及 Plugin SDK API baseline。`pnpm release:check` 會以 check mode 重新執行這些 guard，並在執行 package release checks 前，一次回報它找到的每個 generated drift failure。
- 在發行核准前執行手動 `Full Release Validation` 工作流程，從單一入口點啟動所有預發行 test boxes。它接受 branch、tag 或完整 commit SHA，dispatch 手動 `CI`，並為 install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix 和 Telegram lanes dispatch `OpenClaw Release Checks`。Stable/default 執行會將 exhaustive live/E2E 與 Docker release-path soak 保留在 `run_release_soak=true` 之後；`release_profile=full` 會強制啟用 soak。使用 `release_profile=full` 與 `rerun_group=all` 時，它也會針對 release checks 的 `release-package-under-test` artifact 執行 package Telegram E2E。發布 beta 後提供 `release_package_spec`，即可在 release checks、Package Acceptance 與 package Telegram E2E 之間重用已發行的 npm package，而不必重新建置 release tarball。只有當 Telegram 應使用不同於其餘 release validation 的已發布 package 時，才提供 `npm_telegram_package_spec`。當 Package Acceptance 應使用不同於 release package spec 的已發布 package 時，提供 `package_acceptance_package_spec`。當 private evidence report 應證明 validation 符合已發布 npm package、但不強制執行 Telegram E2E 時，提供 `evidence_package_spec`。
  範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你希望在 release 工作繼續進行時，為 package candidate 取得 side-channel proof，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或精確 release version 使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` harness 封裝受信任的 `package_ref` branch/tag/SHA；對需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或對另一個 GitHub Actions run 上傳的 tarball 使用 `source=artifact`。此工作流程會將 candidate 解析為 `package-under-test`，針對該 tarball 重用 Docker E2E release scheduler，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 針對同一個 tarball 執行 Telegram QA。當所選 Docker lanes 包含 `published-upgrade-survivor` 時，package artifact 是 candidate，且 `published_upgrade_survivor_baseline` 會選取已發布的 baseline。`update-restart-auth` 會將 candidate package 同時作為已安裝 CLI 與 package-under-test，藉此演練 candidate update command 的 managed restart path。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見 profile：
  - `smoke`：install/channel/agent、gateway network，以及 config reload lanes
  - `package`：artifact-native package/update/restart/plugin lanes，不含 OpenWebUI 或 live ClawHub
  - `product`：package profile 加上 MCP channels、cron/subagent cleanup、OpenAI web search，以及 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker release-path chunks
  - `custom`：用於聚焦 rerun 的精確 `docker_lanes` 選取
- 當你只需要 release candidate 的完整正常 CI 涵蓋時，直接執行手動 `CI` 工作流程。手動 CI dispatch 會繞過 changed scoping，並強制執行 Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android，以及 Control UI i18n lanes。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發行 telemetry 時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver 演練 QA-lab，並驗證匯出的 trace span names、有界 attributes，以及 content/identifier redaction，而不需要 Opik、Langfuse 或其他外部 collector。
- 每次 tagged release 前執行 `pnpm release:check`
- 在 tag 存在後，為 mutating publish sequence 執行 `OpenClaw Release Publish`。從 `release/YYYY.M.D` dispatch 它（或在發布 main-reachable tag 時從 `main` dispatch），傳入 release tag 與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin publish scope `all-publishable`，除非你有意執行聚焦修復。此工作流程會依序執行 Plugin npm publish、Plugin ClawHub publish 與 OpenClaw npm publish，避免 core package 在其 externalized plugins 之前發布。
- Release checks 現在在獨立的手動工作流程中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在 release approval 前執行 QA Lab mock parity lane，以及快速的 live Matrix profile 與 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential leases。當你希望並行取得完整 Matrix transport、media 與 E2EE inventory 時，使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` 工作流程。
- Cross-OS install 與 upgrade runtime validation 是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，它們會直接呼叫 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這種拆分是刻意的：讓真正的 npm release path 保持短、確定性且聚焦於 artifact，同時較慢的 live checks 保留在自己的 lane，避免拖慢或阻擋 publish
- 帶有秘密的 release checks 應透過 `Full Release Validation` dispatch，或從 `main`/release workflow ref dispatch，讓 workflow logic 與 secrets 維持受控
- `OpenClaw Release Checks` 接受 branch、tag 或完整 commit SHA，只要解析出的 commit 可從 OpenClaw branch 或 release tag 觸及
- `OpenClaw NPM Release` validation-only preflight 也接受目前完整 40 字元 workflow-branch commit SHA，不需要 pushed tag
- 該 SHA 路徑僅供 validation，且不能提升為真正的 publish
- 在 SHA mode 中，工作流程只會為 package metadata check 合成 `v<package.json version>`；真正的 publish 仍需要真正的 release tag
- 兩個工作流程都將真正的 publish 與 promotion path 保持在 GitHub-hosted runners 上，而 non-mutating validation path 可使用較大的 Blacksmith Linux runners
- 該工作流程使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets
- npm release preflight 不再等待獨立的 release checks lane
- 在核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction tag）
- npm publish 之後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction version），在全新的 temp prefix 中驗證已發布 registry install path
- beta publish 後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享 leased Telegram credential pool，針對已發布 npm package 驗證 installed-package onboarding、Telegram setup 與真實 Telegram E2E。本機 maintainer one-off 可省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- 若要從 maintainer 機器執行完整 post-publish beta smoke，使用 `pnpm release:beta-smoke -- --beta betaN`。此 helper 會執行 Parallels npm update/fresh-target validation、dispatch `NPM Telegram Beta E2E`、poll 精確 workflow run、下載 artifact，並印出 Telegram report。
- Maintainers 可透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行相同 post-publish check。它刻意只允許手動執行，不會在每次 merge 時執行。
- Maintainer release automation 現在使用 preflight-then-promote：
  - 真正的 npm publish 必須通過成功的 npm `preflight_run_id`
  - 真正的 npm publish 必須從與成功 preflight run 相同的 `main` 或 `release/YYYY.M.D` branch dispatch
  - stable npm releases 預設為 `beta`
  - stable npm publish 可透過 workflow input 明確指向 `latest`
  - token-based npm dist-tag mutation 現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以確保安全，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而 public repo 維持 OIDC-only publish
  - public `macOS Release` 僅供 validation；當 tag 只存在於 release branch、但 workflow 從 `main` dispatch 時，設定 `public_release_branch=release/YYYY.M.D`
  - 真正的 private mac publish 必須通過成功的 private mac `preflight_run_id` 與 `validate_run_id`
  - 真正的 publish paths 會 promote 已準備好的 artifacts，而不是再次重建它們
- 對於像 `YYYY.M.D-N` 這樣的 stable correction releases，post-publish verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同 temp-prefix upgrade path，讓 release corrections 不會在沒有提示的情況下讓較舊的 global installs 停留在 base stable payload
- npm release preflight 會 fail closed，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，這樣我們就不會再次發布空的 browser dashboard
- Post-publish verification 也會檢查 installed registry layout 中是否存在已發布 Plugin entrypoints 與 package metadata。若某個 release 發布時缺少 Plugin runtime payloads，將會讓 postpublish verifier 失敗，且不能 promote 到 `latest`。
- `pnpm test:install:smoke` 也會在 candidate update tarball 上強制執行 npm pack `unpackedSize` budget，因此 installer e2e 會在 release publish path 前抓到意外的 pack bloat
- 如果 release work 觸及 CI planning、extension timing manifests 或 extension test matrices，請在 approval 前重新產生並檢視 planner-owned `plugin-prerelease-extension-shard` matrix outputs（來自 `.github/workflows/plugin-prerelease.yml`），讓 release notes 不會描述過時的 CI layout
- Stable macOS release readiness 也包含 updater surfaces：
  - GitHub release 最終必須包含封裝好的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - publish 後，`main` 上的 `appcast.xml` 必須指向新的 stable zip；private macOS publish workflow 會自動 commit 它，或在 direct push 受阻時開啟 appcast PR
  - 封裝後的 app 必須保留 non-debug bundle id、非空 Sparkle feed URL，以及等於或高於該 release version canonical Sparkle build floor 的 `CFBundleVersion`

## Release test boxes

`Full Release Validation` 是 operators 從單一入口點啟動所有 pre-release tests 的方式。若要在快速變動的 branch 上取得 pinned commit proof，請使用 helper，讓每個 child workflow 都從固定在目標 SHA 的 temporary branch 執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

輔助程式會推送 `release-ci/<sha>-...`，從該分支以 `ref=<sha>` 分派 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，然後刪除暫存分支。這可避免意外證明較新的 `main` 子執行。

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

工作流程會解析目標 ref，以 `target_ref=<release-ref>` 分派手動 `CI`，分派 `OpenClaw Release Checks`，為面向套件的檢查準備父層 `release-package-under-test` 成品，並在 `release_profile=full` 且 `rerun_group=all`，或設定了 `release_package_spec` 或 `npm_telegram_package_spec` 時，分派獨立套件 Telegram E2E。接著 `OpenClaw Release Checks` 會展開安裝 smoke、跨 OS release 檢查、啟用 soak 時的 live/E2E Docker release-path 覆蓋、包含 Telegram 套件 QA 的 Package Acceptance、QA Lab parity、live Matrix，以及 live Telegram。完整執行只有在 `Full Release Validation` 摘要顯示 `normal_ci` 和 `release_checks` 成功時才可接受。在 full/all 模式中，`npm_telegram` 子項也必須成功；在 full/all 之外，除非提供了已發布的 `release_package_spec` 或 `npm_telegram_package_spec`，否則會略過。最終 verifier 摘要包含每個子執行的最慢作業表格，因此 release manager 無需下載記錄即可看到目前的關鍵路徑。
請參閱 [完整 release 驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、精確工作流程作業名稱、stable 與 full profile 差異、成品，以及聚焦重新執行 handle。
子工作流程會從執行 `Full Release Validation` 的受信任 ref 分派，通常是 `--ref main`，即使目標 `ref` 指向較舊的 release 分支或標籤也是如此。沒有獨立的 Full Release Validation 工作流程 ref 輸入；請透過選擇工作流程執行 ref 來選擇受信任的 harness。
不要使用 `--ref main -f ref=<sha>` 對移動中的 `main` 進行精確 commit 證明；原始 commit SHA 不能作為工作流程分派 ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立釘選的暫存分支。

使用 `release_profile` 選擇 live/provider 廣度：

- `minimum`：最快的 release-critical OpenAI/core live 與 Docker 路徑
- `stable`：minimum 加上 release 核准所需的 stable provider/backend 覆蓋
- `full`：stable 加上廣泛的 advisory provider/media 覆蓋

當 release-blocking lane 都為綠燈，且你想在升版前執行完整 live/E2E、Docker release-path，以及有界限的已發布升級存活掃描時，請搭配 `stable` 使用 `run_release_soak=true`。該掃描涵蓋最新四個 stable 套件，加上釘選的 `2026.4.23` 和 `2026.5.2` baseline，以及較舊的 `2026.4.15` 覆蓋，會移除重複 baseline，並將每個 baseline 分片到各自的 Docker runner 作業。`full` 隱含 `run_release_soak=true`。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將目標 ref 解析一次為 `release-package-under-test`，並在 soak 執行時，於跨 OS、Package Acceptance 和 release-path Docker 檢查中重用該成品。這會讓所有面向套件的機器使用相同位元組，並避免重複建置套件。
Beta 已經在 npm 上後，請設定 `release_package_spec=openclaw@YYYY.M.D-beta.N`，讓 release 檢查下載已發布套件一次，從 `dist/build-info.json` 擷取其建置來源 SHA，並將該成品重用於跨 OS、Package Acceptance、release-path Docker 和套件 Telegram lane。
跨 OS OpenAI 安裝 smoke 會在設定 repo/org 變數時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為這條 lane 是在證明套件安裝、onboarding、Gateway 啟動和一次 live agent turn，而不是對最慢的預設模型進行基準測試。更廣泛的 live provider 矩陣仍然是模型特定覆蓋的地方。

依照 release 階段使用這些變體：

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

不要將完整 umbrella 作為聚焦修復後的第一次重新執行。如果一個 box 失敗，請使用失敗的子工作流程、作業、Docker lane、套件 profile、模型 provider 或 QA lane 作為下一次證明。只有在修復變更了共用 release orchestration，或讓較早的全 box 證據過期時，才再次執行完整 umbrella。umbrella 的最終 verifier 會重新檢查記錄的子工作流程執行 ID，因此在子工作流程成功重新執行後，只需重新執行失敗的 `Verify full validation` 父作業。

若要有界限復原，請將 `rerun_group` 傳給 umbrella。`all` 是真正的 release-candidate 執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行 release-only Plugin 子項，`release-checks` 執行每個 release box，而較窄的 release group 為 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重新執行需要 `release_package_spec` 或 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 執行會使用 release-checks 套件成品。聚焦的跨 OS 重新執行可加入 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/suite 篩選器。QA release-check 失敗屬於 advisory；僅 QA 失敗不會阻擋 release 驗證。

### Vitest

Vitest box 是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍限制，並強制執行 release candidate 的一般測試圖：Linux Node 分片、捆綁 Plugin 分片、channel contract、Node 22 相容性、`check`、`check-additional`、build smoke、文件檢查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用此 box 回答「source tree 是否通過完整的一般測試套件？」它不等同於 release-path 產品驗證。要保留的證據：

- `Full Release Validation` 摘要，顯示分派的 `CI` 執行 URL
- `CI` 在精確目標 SHA 上為綠燈
- 調查 regression 時來自 CI 作業的失敗或緩慢分片名稱
- 當執行需要效能分析時，Vitest timing 成品，例如 `.artifacts/vitest-shard-timings.json`

只有當 release 需要確定性的一般 CI，但不需要 Docker、QA Lab、live、跨 OS 或套件 box 時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml`，加上 release-mode 的 `install-smoke` 工作流程。它會透過封裝好的 Docker 環境驗證 release candidate，而不只是來源層級測試。

Release Docker 覆蓋包含：

- 啟用慢速 Bun 全域安裝 smoke 的完整安裝 smoke
- 依目標 SHA 準備/重用 root Dockerfile smoke 映像，QR、root/Gateway 和 installer/Bun smoke 作業會作為獨立 install-smoke 分片執行
- repository E2E lane
- release-path Docker chunk：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 請求時，在 `plugins-runtime-services` chunk 內的 OpenWebUI 覆蓋
- 分割的捆綁 Plugin 安裝/解除安裝 lane，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當 release 檢查包含 live suite 時的 live/E2E provider suite 與 Docker live 模型覆蓋

重新執行前請使用 Docker 成品。release-path scheduler 會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、`summary.json`、`failures.json`、階段 timing、scheduler plan JSON 和重新執行命令。若要聚焦復原，請在可重用 live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有 release chunk。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 和已準備 Docker 映像輸入，因此失敗的 lane 可以重用相同 tarball 和 GHCR 映像。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為與 channel 層級 release gate，與 Vitest 和 Docker 套件機制分開。

Release QA Lab 覆蓋包含：

- 使用 agentic parity pack，將 OpenAI candidate lane 與 Opus 4.6 baseline 比較的 mock parity lane
- 使用 `qa-live-shared` 環境的快速 live Matrix QA profile
- 使用 Convex CI credential lease 的 live Telegram QA lane
- 當 release telemetry 需要明確本機證明時的 `pnpm qa:otel:smoke`

使用此 box 回答「release 在 QA 情境和 live channel flow 中是否行為正確？」核准 release 時，請保留 parity、Matrix 和 Telegram lane 的成品 URL。完整 Matrix 覆蓋仍可作為手動分片 QA-Lab 執行使用，而不是預設的 release-critical lane。

### Package

Package box 是可安裝產品 gate。它由 `Package Acceptance` 和 resolver `scripts/resolve-openclaw-package-candidate.mjs` 支援。resolver 會將 candidate 正規化為 Docker E2E 使用的 `package-under-test` tarball，驗證套件清單，記錄套件版本與 SHA-256，並讓工作流程 harness ref 與套件來源 ref 分離。

支援的 candidate 來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw release 版本
- `source=ref`：使用選定的 `workflow_ref` harness，封裝受信任的 `package_ref` 分支、標籤或完整 commit SHA
- `source=url`：下載 HTTPS `.tgz`，且需要 `package_sha256`
- `source=artifact`：重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會以 `source=artifact`、已準備的 release 套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對相同已解析 tarball 保持 migration、update、configured-auth update restart、live ClawHub skill install、過期 Plugin 相依性清理、離線 Plugin fixture、Plugin update，以及 Telegram 套件 QA。阻擋 release 的檢查會使用預設的最新已發布套件 baseline；`run_release_soak=true` 或 `release_profile=full` 會擴展為從 `2026.4.23` 到 `latest` 的每個 stable npm 已發布 baseline，加上 reported-issue fixture。對於已出貨 candidate，請使用 `source=npm` 的 Package Acceptance；對於發布前以 SHA 支援的本機 npm tarball，請使用 `source=ref`/`source=artifact`。它是 GitHub 原生替代方案，可取代多數先前需要 Parallels 的套件/update 覆蓋。跨 OS release 檢查對於 OS 特定 onboarding、installer 和平台行為仍然重要，但套件/update 產品驗證應優先使用 Package Acceptance。

更新與 Plugin 驗證的標準檢查清單是
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。在判斷哪個本機、Docker、套件驗收或發行檢查路徑能證明 Plugin 安裝/更新、doctor 清理，或已發布套件遷移變更時，請使用它。
從每個穩定版 `2026.4.23+` 套件進行的完整已發布更新遷移，是另一個手動 `Update Migration` 工作流程，不屬於完整發行 CI。

舊版套件驗收寬限是有意設定時間限制。到
`2026.4.25` 為止的套件，可以針對已發布到 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少的私有 QA 清單項目、缺少
`gateway install --wrapper`、從 tarball 衍生的 git
fixture 中缺少修補檔、缺少已持久化的 `update.channel`、舊版 Plugin 安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件可以針對已經出貨的本機建置中繼資料戳記檔提出警告。之後的套件必須滿足現代套件合約；相同缺口會使發行驗證失敗。

當發行問題涉及實際可安裝套件時，請使用較廣的套件驗收設定檔：

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

- `smoke`：快速套件安裝/頻道/代理、Gateway 網路與設定重新載入路徑
- `package`：安裝/更新/重新啟動/Plugin 套件合約，加上即時 ClawHub
  skill 安裝證明；這是發行檢查預設值
- `product`：`package` 加上 MCP 頻道、cron/subagent 清理、OpenAI 網頁搜尋，以及 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：用於聚焦重跑的精確 `docker_lanes` 清單

若要進行套件候選版 Telegram 證明，請在套件驗收中啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。此工作流程會將解析後的 `package-under-test` tarball 傳入 Telegram 路徑；獨立的
Telegram 工作流程仍接受已發布的 npm 規格，用於發布後檢查。

## 發行發布自動化

`OpenClaw Release Publish` 是一般的變更型發布入口點。它會依照發行所需順序協調受信任發布者工作流程：

1. 簽出發行標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 觸及。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 與
   `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同範圍與 SHA 分派 `Plugin ClawHub Release`。
6. 使用發行標籤、npm dist-tag 與已儲存的 `preflight_run_id` 分派
   `OpenClaw NPM Release`。

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

穩定版直接提升到 `latest` 需要明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 與 `Plugin ClawHub Release` 工作流程。若要修復選定的 Plugin，請將
`plugin_publish_scope=selected` 與 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`，或在不得發布 OpenClaw 套件時直接分派子工作流程。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作員控制的輸入：

- `tag`：必要的發行標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整 40 字元工作流程分支 commit SHA，用於僅驗證的預檢
- `preflight_only`：`true` 表示僅驗證/建置/封裝，`false` 表示實際發布路徑
- `preflight_run_id`：實際發布路徑必填，讓工作流程重用成功預檢執行所準備的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受以下由操作員控制的輸入：

- `tag`：必要的發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 ID；
  當 `publish_openclaw_npm=true` 時必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；僅在聚焦修復工作時使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有在將工作流程用作僅 Plugin 修復協調器時才設為 `false`

`OpenClaw Release Checks` 接受以下由操作員控制的輸入：

- `ref`：要驗證的分支、標籤或完整 commit SHA。帶有密鑰的檢查要求解析後的 commit 可從 OpenClaw 分支或發行標籤觸及。
- `run_release_soak`：在穩定版/預設發行檢查中，選擇加入完整即時/E2E、Docker 發行路徑，以及 all-since 升級倖存者 soak。`release_profile=full` 會強制啟用它。

規則：

- 穩定版與修正版標籤可以發布到 `beta` 或 `latest`
- Beta 預發行標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許輸入完整 commit SHA
- `OpenClaw Release Checks` 與 `Full Release Validation` 永遠只做驗證
- 實際發布路徑必須使用預檢期間使用的相同 `npm_dist_tag`；
  工作流程會在發布繼續前驗證該中繼資料

## 穩定版 npm 發行順序

切出穩定版 npm 發行時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在前，你可以使用目前完整工作流程分支 commit
     SHA，對預檢工作流程進行僅驗證的試跑
2. 一般 beta 優先流程請選擇 `npm_dist_tag=beta`，只有在你有意直接發布穩定版時才選擇 `latest`
3. 當你希望透過單一手動工作流程取得一般 CI，加上即時 prompt cache、Docker、QA Lab、Matrix 與 Telegram 覆蓋時，請在發行分支、發行標籤或完整 commit SHA 上執行
   `Full Release Validation`
4. 如果你刻意只需要確定性的正常測試圖，請改在發行 ref 上執行手動 `CI` 工作流程
5. 儲存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag` 與已儲存的 `preflight_run_id` 執行
   `OpenClaw Release Publish`；它會先將外部化 Plugin 發布到 npm 與
   ClawHub，再提升 OpenClaw npm 套件
7. 如果發行落在 `beta`，請使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流程，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發行刻意直接發布到 `latest`，且 `beta`
   應立即跟隨相同穩定版建置，請使用同一個私有工作流程將兩個 dist-tag 指向穩定版本，或讓其排程自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中是基於安全考量，因為它仍然需要
`NPM_TOKEN`，而公開 repo 保持僅使用 OIDC 發布。

這讓直接發布路徑與 beta 優先提升路徑都保持文件化，並且對操作員可見。

如果維護者必須退回使用本機 npm 驗證，請只在專用 tmux session 內執行任何 1Password
CLI（`op`）命令。不要直接從主要代理 shell 呼叫 `op`；將其保留在 tmux 內可讓提示、警示與 OTP 處理可觀察，並防止重複的主機警示。

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
中的私有發行文件作為實際 runbook。

## 相關

- [發行頻道](/zh-TW/install/development-channels)
