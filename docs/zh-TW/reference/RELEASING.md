---
read_when:
    - 正在尋找公開發布通道定義
    - 執行發行驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證環境、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-02T02:58:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e915840070324f7614c993d20490f0bf4c9b266c57ce74eddfc461e019d3dc07
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布軌道：

- 穩定版：已標記的發布版本，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- Beta：發布到 npm `beta` 的預先發布標籤
- 開發版：`main` 的移動前端

## 版本命名

- 穩定發布版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定修正發布版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預先發布版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已提升的穩定 npm 發布版本
- `beta` 表示目前的 Beta 安裝目標
- 穩定版和穩定修正版預設發布到 npm `beta`；發布操作者可以明確指定 `latest`，或稍後提升已審核的 Beta 建置
- 每個穩定的 OpenClaw 發布版本都會同時交付 npm 套件和 macOS 應用程式；
  Beta 發布通常會先驗證並發布 npm/套件路徑，mac 應用程式的建置/簽署/公證則保留給穩定版，除非明確要求

## 發布節奏

- 發布以 Beta 優先推進
- 只有在最新 Beta 驗證完成後，穩定版才會跟進
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發布，
  讓發布驗證和修正不會阻塞 `main` 上的新開發
- 如果 Beta 標籤已推送或發布後需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 Beta 標籤
- 詳細的發布程序、核准、憑證和復原注意事項僅限維護者

## 發布操作者檢查清單

此檢查清單是發布流程的公開形式。私人憑證、
簽署、公證、dist-tag 復原和緊急回復細節會保留在
僅限維護者的發布執行手冊中。

1. 從目前 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` CI 足夠穩定，可從它建立分支。
2. 使用 `/changelog` 根據真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交、推送，並在建立分支前再 rebase/pull 一次。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍受涵蓋時才移除已到期的相容性，否則記錄為何刻意保留。
4. 從目前 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發布工作。
5. 針對預定標籤更新每個必要的版本位置，然後執行本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，
   可使用完整 40 字元的發布分支 SHA 進行僅驗證預檢。儲存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 針對發布分支、標籤或完整提交 SHA 啟動所有發布前測試。這是四個大型發布測試盒的唯一手動進入點：Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正的最小失敗檔案、軌道、工作流程作業、套件設定檔、提供者或模型 allowlist。只有當變更範圍使先前證據過期時，才重新執行完整總括流程。
9. 對於 Beta，標記 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 發布，然後針對已發布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 套件執行發布後套件驗收。如果已推送或發布的 Beta 需要修正，請切出下一個 `-beta.N`；不要刪除或重寫舊的 Beta。
10. 對於穩定版，只有在已審核的 Beta 或發布候選版本具備必要驗證證據後才繼續。穩定版 npm 發布會透過 `preflight_run_id` 重用成功的預檢成品；穩定版 macOS 發布就緒也需要 `main` 上的封裝 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器、在需要發布後頻道證明時執行可選的獨立已發布 npm Telegram E2E、在需要時進行 dist-tag 提升、根據完整相符的 `CHANGELOG.md` 區段建立 GitHub 發布/預先發布說明，以及發布公告步驟。

## 發布預檢

- 在發布預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` gate 之外仍保持涵蓋
- 在發布預檢前執行 `pnpm check:architecture`，讓更廣泛的 import cycle 與架構邊界檢查在較快的本機 gate 之外保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發布成品與 Control UI bundle 存在，可供 pack 驗證步驟使用
- 在發布核准前執行手動 `Full Release Validation` workflow，從單一進入點啟動所有發布前 test boxes。它接受 branch、tag 或完整 commit SHA，會 dispatch 手動 `CI`，並 dispatch `OpenClaw Release Checks`，涵蓋 install smoke、package acceptance、Docker release-path suites、live/E2E、OpenWebUI、QA Lab parity、Matrix 與 Telegram lanes。使用 `release_profile=full` 與 `rerun_group=all` 時，它也會針對 release checks 產生的 `release-package-under-test` artifact 執行 package Telegram E2E。發布後若相同的 Telegram E2E 也應驗證已發布的 npm package，請提供 `npm_telegram_package_spec`。若 private evidence report 應驗證該 validation 與已發布的 npm package 相符，而不強制執行 Telegram E2E，請提供 `evidence_package_spec`。
  範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在發布工作持續進行時，為 package candidate 取得 side-channel proof，請執行手動 `Package Acceptance` workflow。對 `openclaw@beta`、`openclaw@latest` 或精確 release version 使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` harness 打包受信任的 `package_ref` branch/tag/SHA；對需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或對另一個 GitHub Actions run 上傳的 tarball 使用 `source=artifact`。該 workflow 會將 candidate 解析為 `package-under-test`，針對該 tarball 重用 Docker E2E release scheduler，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對相同 tarball 執行 Telegram QA。當選取的 Docker lanes 包含 `published-upgrade-survivor` 時，package artifact 是 candidate，而 `published_upgrade_survivor_baseline` 會選取已發布 baseline。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見 profiles：
  - `smoke`：install/channel/agent、gateway network 與 config reload lanes
  - `package`：artifact-native package/update/Plugin lanes，不含 OpenWebUI 或 live ClawHub
  - `product`：package profile 加上 MCP channels、cron/subagent cleanup、OpenAI web search 與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker release-path chunks
  - `custom`：精確的 `docker_lanes` 選取，用於聚焦 rerun
- 當你只需要 release candidate 的完整一般 CI coverage 時，請直接執行手動 `CI` workflow。手動 CI dispatch 會繞過 changed scoping，並強制執行 Linux Node shards、bundled-Plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python Skills、Windows、macOS、Android 與 Control UI i18n lanes。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發布 telemetry 時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver exercise QA-lab，並驗證匯出的 trace span names、有界 attributes，以及 content/identifier redaction，無需 Opik、Langfuse 或其他外部 collector。
- 每次 tagged release 前執行 `pnpm release:check`
- Release checks 現在於獨立的手動 workflow 中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發布核准前執行 QA Lab mock parity gate，以及快速 live Matrix profile 與 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential leases。當你想平行取得完整 Matrix transport、media 與 E2EE inventory 時，請使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- 跨作業系統 install 與 upgrade runtime validation 是 public `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，兩者會直接呼叫 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 此分割是刻意設計：讓真正的 npm release path 保持短小、確定且聚焦 artifact，同時較慢的 live checks 留在自己的 lane 中，避免它們拖慢或阻擋 publish
- 帶有 secret 的 release checks 應透過 `Full Release Validation` 或從 `main`/release workflow ref dispatch，讓 workflow logic 與 secrets 保持受控
- `OpenClaw Release Checks` 接受 branch、tag 或完整 commit SHA，只要解析出的 commit 可從 OpenClaw branch 或 release tag 觸及即可
- `OpenClaw NPM Release` validation-only preflight 也接受目前完整 40 字元 workflow-branch commit SHA，不要求已推送 tag
- 該 SHA path 僅供 validation，不能提升為真正 publish
- 在 SHA mode 中，workflow 只會為 package metadata check 合成 `v<package.json version>`；真正 publish 仍需要真實 release tag
- 兩個 workflows 都將真正的 publish 與 promotion path 保留在 GitHub-hosted runners 上，而 non-mutating validation path 可使用較大的 Blacksmith Linux runners
- 該 workflow 會使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets 執行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm release preflight 不再等待獨立的 release checks lane
- 核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction tag）
- npm publish 後執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction version），在新的暫存 prefix 中驗證已發布 registry install path
- beta publish 後執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租用 Telegram credential pool，針對已發布 npm package 驗證 installed-package onboarding、Telegram setup 與真實 Telegram E2E。本機 maintainer 一次性執行可省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- Maintainers 可以透過手動 `NPM Telegram Beta E2E` workflow，從 GitHub Actions 執行相同的 post-publish check。它刻意僅允許手動執行，不會在每次 merge 時執行。
- Maintainer release automation 現在使用 preflight-then-promote：
  - 真正的 npm publish 必須通過成功的 npm `preflight_run_id`
  - 真正的 npm publish 必須從與成功 preflight run 相同的 `main` 或 `release/YYYY.M.D` branch dispatch
  - stable npm releases 預設為 `beta`
  - stable npm publish 可透過 workflow input 明確指定 `latest`
  - 基於 token 的 npm dist-tag mutation 現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以提升安全性，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而 public repo 保持 OIDC-only publish
  - public `macOS Release` 僅供 validation；當 tag 只存在於 release branch，但 workflow 從 `main` dispatch 時，請設定 `public_release_branch=release/YYYY.M.D`
  - 真正的 private mac publish 必須通過成功的 private mac `preflight_run_id` 與 `validate_run_id`
  - 真正的 publish paths 會 promote 已準備好的 artifacts，而不是再次 rebuild
- 對於像 `YYYY.M.D-N` 這類 stable correction releases，post-publish verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同 temp-prefix upgrade path，讓 release corrections 不會悄悄讓較舊的 global installs 停留在 base stable payload
- npm release preflight 會 fail closed，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，避免再次發佈空的 browser dashboard
- Post-publish verification 也會檢查已發布 Plugin entrypoints 與 package metadata 是否存在於已安裝的 registry layout 中。若 release 遺漏 Plugin runtime payloads，會使 postpublish verifier 失敗，且不能 promote 到 `latest`。
- `pnpm test:install:smoke` 也會對 candidate update tarball 強制執行 npm pack `unpackedSize` budget，因此 installer e2e 會在 release publish path 前捕捉意外的 pack bloat
- 如果 release 工作觸及 CI planning、Plugin timing manifests 或 Plugin test matrices，請在核准前重新產生並檢閱 planner-owned `plugin-prerelease-extension-shard` matrix outputs，來源為 `.github/workflows/plugin-prerelease.yml`，讓 release notes 不會描述過期的 CI layout
- Stable macOS release readiness 也包含 updater surfaces：
  - GitHub release 最終必須包含已封裝的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - publish 後，`main` 上的 `appcast.xml` 必須指向新的 stable zip
  - 封裝後的 app 必須保留非 debug bundle id、非空的 Sparkle feed URL，以及等於或高於該 release version canonical Sparkle build floor 的 `CFBundleVersion`

## 發布測試箱

`Full Release Validation` 是 operators 從單一進入點啟動所有發布前測試的方式。請從受信任的 `main` workflow ref 執行它，並將 release branch、tag 或完整 commit SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

該 workflow 會解析 target ref，使用 `target_ref=<release-ref>` dispatch 手動 `CI`、dispatch `OpenClaw Release Checks`，並在 `release_profile=full` 且 `rerun_group=all`，或設定 `npm_telegram_package_spec` 時，dispatch standalone package Telegram E2E。接著 `OpenClaw Release Checks` 會展開 install smoke、cross-OS release checks、live/E2E Docker release-path coverage、帶有 Telegram package QA 的 Package Acceptance、QA Lab parity、live Matrix 與 live Telegram。只有當 `Full Release Validation` summary 顯示 `normal_ci` 與 `release_checks` 成功時，完整 run 才可接受。在 full/all mode 中，`npm_telegram` child 也必須成功；在 full/all 之外，除非提供已發布的 `npm_telegram_package_spec`，否則它會被略過。最終 verifier summary 會包含每個 child run 的 slowest-job tables，讓 release manager 無需下載 logs 即可查看目前 critical path。
請參閱 [完整發布驗證](/zh-TW/reference/full-release-validation)，了解完整 stage matrix、精確 workflow job names、stable 與 full profile 差異、artifacts，以及 focused rerun handles。
Child workflows 會從執行 `Full Release Validation` 的受信任 ref dispatch，通常是 `--ref main`，即使 target `ref` 指向較舊的 release branch 或 tag。沒有獨立的 Full Release Validation workflow-ref input；請透過選擇 workflow run ref 來選擇受信任的 harness。

使用 `release_profile` 選取 live/provider breadth：

- `minimum`：最快的 release-critical OpenAI/core live 與 Docker path
- `stable`：minimum 加上 release approval 所需的 stable provider/backend coverage
- `full`：stable 加上廣泛 advisory provider/media coverage

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將目標 ref 一次解析為 `release-package-under-test`，並在 release-path Docker 檢查與 Package Acceptance 中重複使用該成品。這會讓所有面向套件的 boxes 使用相同位元組，並避免重複建置套件。當 repo/org 變數已設定時，跨 OS OpenAI 安裝煙霧測試會使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，因為這條 lane 是在驗證套件安裝、onboarding、gateway 啟動，以及一次 live agent turn，而不是對最慢的預設模型做基準測試。較廣泛的 live provider 矩陣仍然是模型特定覆蓋的地方。

依據發布階段使用這些變體：

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

不要在聚焦修正後的第一次重跑使用完整 umbrella。如果有一個 box 失敗，下一次證明請使用失敗的子工作流程、job、Docker lane、package profile、model provider 或 QA lane。只有在修正變更了共享發布編排，或讓較早的 all-box 證據過期時，才再次執行完整 umbrella。umbrella 的最終驗證器會重新檢查記錄的子工作流程 run ids，因此在子工作流程成功重跑後，只需重跑失敗的 `Verify full validation` 父 job。

若要有界限地復原，將 `rerun_group` 傳給 umbrella。`all` 是真正的 release-candidate 執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行 release-only Plugin 子項，`release-checks` 會執行每個 release box，而較窄的 release groups 是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦的 `npm-telegram` 重跑需要 `npm_telegram_package_spec`；搭配 `release_profile=full` 的 full/all 執行會使用 release-checks 套件成品。

### Vitest

Vitest box 是手動 `CI` 子工作流程。手動 CI 會刻意繞過 changed scoping，並強制對 release candidate 執行一般測試圖：Linux Node shards、bundled-plugin shards、channel contracts、Node 22 相容性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android 和 Control UI i18n。

使用這個 box 回答「原始碼樹是否通過完整的一般測試套件？」它不等同於 release-path product validation。應保留的證據：

- `Full Release Validation` 摘要，顯示 dispatched `CI` run URL
- `CI` run 在精確目標 SHA 上為綠燈
- 調查迴歸時，CI jobs 中失敗或較慢的 shard 名稱
- 當某次執行需要效能分析時，保留 Vitest timing artifacts，例如 `.artifacts/vitest-shard-timings.json`

只有在發布需要確定性的一般 CI，但不需要 Docker、QA Lab、live、cross-OS 或 package boxes 時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml`，加上 release-mode `install-smoke` 工作流程。它會透過 packaged Docker environments 驗證 release candidate，而不只是 source-level tests。

Release Docker 覆蓋範圍包含：

- 啟用較慢 Bun global install smoke 的完整 install smoke
- 依目標 SHA 準備/重複使用 root Dockerfile smoke image，QR、root/gateway 和 installer/Bun smoke jobs 會作為個別 install-smoke shards 執行
- repository E2E lanes
- release-path Docker chunks：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 請求時，在 `plugins-runtime-services` chunk 內包含 OpenWebUI 覆蓋
- 分割的 bundled plugin install/uninstall lanes，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當 release checks 包含 live suites 時，包含 live/E2E provider suites 和 Docker live model 覆蓋

重跑前先使用 Docker artifacts。release-path scheduler 會上傳 `.artifacts/docker-tests/`，其中含有 lane logs、`summary.json`、`failures.json`、phase timings、scheduler plan JSON 和 rerun commands。若要聚焦復原，請在 reusable live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有 release chunks。產生的 rerun commands 會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker image inputs，因此失敗的 lane 可以重複使用相同 tarball 和 GHCR images。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic behavior 與 channel-level release gate，與 Vitest 和 Docker package mechanics 分開。

Release QA Lab 覆蓋範圍包含：

- mock parity gate，使用 agentic parity pack 比較 OpenAI candidate lane 與 Opus 4.6 baseline
- 使用 `qa-live-shared` environment 的 fast live Matrix QA profile
- 使用 Convex CI credential leases 的 live Telegram QA lane
- 當 release telemetry 需要明確的本地證明時，執行 `pnpm qa:otel:smoke`

使用這個 box 回答「此發布在 QA scenarios 和 live channel flows 中是否行為正確？」核准發布時，請保留 parity、Matrix 和 Telegram lanes 的 artifact URLs。完整 Matrix 覆蓋仍可透過手動 sharded QA-Lab run 取得，而不是預設的 release-critical lane。

### 套件

Package box 是 installable-product gate。它由 `Package Acceptance` 和 resolver `scripts/resolve-openclaw-package-candidate.mjs` 支援。resolver 會將 candidate 標準化為 Docker E2E 消耗的 `package-under-test` tarball、驗證 package inventory、記錄 package version 和 SHA-256，並讓 workflow harness ref 與 package source ref 保持分離。

支援的 candidate sources：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw release version
- `source=ref`：使用選定的 `workflow_ref` harness 打包受信任的 `package_ref` branch、tag 或完整 commit SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重複使用另一個 GitHub Actions run 上傳的 `.tgz`

`OpenClaw Release Checks` 會以 `source=artifact`、已準備的 release package artifact、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會讓 migration、update、過期 Plugin dependency cleanup、offline Plugin fixtures、Plugin update 和 Telegram package QA 針對相同已解析的 tarball 執行。它是 GitHub-native 替代方案，用來取代過去多數需要 Parallels 的 package/update 覆蓋。Cross-OS release checks 對 OS-specific onboarding、installer 和 platform behavior 仍然重要，但 package/update product validation 應優先使用 Package Acceptance。

update 與 Plugin validation 的標準 checklist 是 [測試更新與 plugins](/zh-TW/help/testing-updates-plugins)。在決定哪個 local、Docker、Package Acceptance 或 release-check lane 能證明 Plugin install/update、doctor cleanup 或 published-package migration change 時使用它。從每個 stable `2026.4.23+` package 進行的完整 published update migration 是獨立的手動 `Update Migration` 工作流程，不屬於 Full Release CI。

Legacy package-acceptance leniency 有意設定時間盒。到 `2026.4.25` 為止的 packages 可以對已發布到 npm 的 metadata gaps 使用 compatibility path：tarball 缺少 private QA inventory entries、缺少 `gateway install --wrapper`、tarball-derived git fixture 中缺少 patch files、缺少已持久化的 `update.channel`、legacy Plugin install-record locations、缺少 marketplace install-record persistence，以及 `plugins update` 期間的 config metadata migration。已發布的 `2026.4.26` package 可以對已出貨的 local build metadata stamp files 發出警告。較新的 packages 必須滿足現代 package contracts；相同缺口會讓 release validation 失敗。

當發布問題關於實際可安裝套件時，使用較廣泛的 Package Acceptance profiles：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常見 package profiles：

- `smoke`：快速 package install/channel/agent、gateway network 和 config reload lanes
- `package`：不含 live ClawHub 的 install/update/plugin package contracts；這是 release-check 預設值
- `product`：`package` 加上 MCP channels、cron/subagent cleanup、OpenAI web search 和 OpenWebUI
- `full`：含 OpenWebUI 的 Docker release-path chunks
- `custom`：用於聚焦重跑的精確 `docker_lanes` 清單

若要 package-candidate Telegram proof，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。工作流程會將解析後的 `package-under-test` tarball 傳入 Telegram lane；standalone Telegram 工作流程仍接受已發布的 npm spec，用於 post-publish checks。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受這些由操作者控制的輸入：

- `tag`：必要的 release tag，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整的 40 字元 workflow-branch commit SHA，用於 validation-only preflight
- `preflight_only`：`true` 表示僅 validation/build/package，`false` 表示真正的 publish path
- `preflight_run_id`：在真正 publish path 上為必要項目，讓工作流程重複使用 successful preflight run 準備好的 tarball
- `npm_dist_tag`：publish path 的 npm 目標 tag；預設為 `beta`

`OpenClaw Release Checks` 接受這些由操作者控制的輸入：

- `ref`：要驗證的 branch、tag 或完整 commit SHA。帶有 secret 的 checks 要求解析後的 commit 可從 OpenClaw branch 或 release tag 觸及。

規則：

- Stable 和 correction tags 可以發布到 `beta` 或 `latest`
- Beta prerelease tags 只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，完整 commit SHA 輸入只允許在 `preflight_only=true` 時使用
- `OpenClaw Release Checks` 和 `Full Release Validation` 永遠僅用於 validation
- 真正 publish path 必須使用 preflight 期間使用的相同 `npm_dist_tag`；工作流程會在 publish 繼續前驗證該 metadata

## 穩定版 npm 發布流程

切出穩定版 npm 發布時：

1. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在之前，你可以使用目前完整工作流程分支的提交
     SHA，對預檢工作流程進行僅供驗證的 dry run
2. 一般的先 beta 流程請選擇 `npm_dist_tag=beta`，只有在你刻意要直接發布穩定版時
   才選擇 `latest`
3. 當你想從單一手動工作流程取得一般 CI 加上即時 prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆蓋時，請在發布分支、發布標籤或完整
   提交 SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要確定性的正常測試圖，請改在發布 ref 上執行
   手動 `CI` 工作流程
5. 儲存成功的 `preflight_run_id`
6. 使用 `preflight_only=false`、相同的
   `tag`、相同的 `npm_dist_tag`，以及已儲存的 `preflight_run_id`，再次執行 `OpenClaw NPM Release`
7. 如果發布落在 `beta`，請使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流程，將該穩定版本從 `beta` 推升到 `latest`
8. 如果發布是刻意直接發布到 `latest`，且 `beta`
   應立即跟隨相同的穩定建置，請使用同一個私有
   工作流程，將兩個 dist-tags 都指向該穩定版本，或讓其排程的
   自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中是出於安全考量，因為它仍然
需要 `NPM_TOKEN`，而公開 repo 則維持僅使用 OIDC 發布。

這讓直接發布路徑和先 beta 推升路徑都能
被記錄並讓操作人員可見。

如果維護者必須退回使用本機 npm 驗證，請只在專用 tmux session
中執行任何 1Password CLI (`op`) 命令。請勿從主要 agent shell
直接呼叫 `op`；將它限制在 tmux 內可讓提示、
警示和 OTP 處理可被觀察，並防止重複的主機警示。

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
中的私有發布文件作為實際 runbook。

## 相關

- [發布通道](/zh-TW/install/development-channels)
