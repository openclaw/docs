---
read_when:
    - 正在尋找公開發行通道定義
    - 執行發布驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作者檢查清單、驗證機器、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-06T18:01:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布通道：

- 穩定版：預設發布到 npm `beta` 的標記發布，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發布標籤
- 開發版：`main` 的移動中最新提交

## 版本命名

- 穩定版發布版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定版修正發布版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- beta 預發布版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已推廣的穩定版 npm 發布
- `beta` 表示目前的 beta 安裝目標
- 穩定版與穩定版修正發布預設發布到 npm `beta`；發布操作者可以明確指定 `latest`，或稍後推廣已審核的 beta 建置
- 每個穩定版 OpenClaw 發布都會同時交付 npm 套件和 macOS 應用程式；
  beta 發布通常會先驗證並發布 npm/套件路徑，而 Mac 應用程式的建置/簽署/公證則保留給穩定版，除非另有明確要求

## 發布節奏

- 發布採 beta 優先
- 只有在最新版 beta 驗證完成後，才會進入穩定版
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發布，
  因此發布驗證和修正不會阻擋 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細的發布程序、核准、憑證和復原注意事項僅限維護者

## 發布操作者檢查清單

這份檢查清單是發布流程的公開形式。私有憑證、
簽署、公證、dist-tag 復原和緊急回滾細節會保留在
僅限維護者的發布執行手冊中。

1. 從目前的 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` 的 CI 綠燈程度足以從它建立分支。
2. 使用真實提交歷史搭配 `/changelog` 重寫最上方的 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交它、推送它，並在建立分支前再次 rebase/pull。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍有涵蓋時才移除過期相容性，或記錄為什麼有意繼續保留。
4. 從目前的 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發布工作。
5. 針對預期標籤更新每個必要版本位置，執行
   `pnpm plugins:sync`，讓可發布的 Plugin 套件共享發布
   版本和相容性中繼資料，然後執行本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 執行 `OpenClaw NPM Release`，並設定 `preflight_only=true`。在標籤存在前，
   可使用完整 40 字元的發布分支 SHA 進行僅驗證預檢。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 針對發布分支、標籤或完整提交 SHA 啟動所有發布前測試。這是四個大型發布測試箱的唯一手動入口點：Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正的最小失敗檔案、通道、工作流程工作、套件設定檔、提供者或模型允許清單。只有在變更範圍使先前證據過期時，才重新執行完整傘狀流程。
9. 對於 beta，標記 `vYYYY.M.D-beta.N`，然後從相符的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   將所有可發布的 Plugin 套件並行發送到 npm，並將同一組發送到
   ClawHub，然後在 Plugin npm 發布成功後，立即使用相符的 dist-tag 推廣已準備好的 OpenClaw npm 預檢成品。
   ClawHub 發布在 OpenClaw npm 發布時可能仍在執行，但發布工作流程必須等到兩條 Plugin 發布路徑和 OpenClaw npm 發布路徑都成功完成後才會結束。發布後，對已發布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 套件執行發布後套件
   接受測試。如果已推送或已發布的預發布需要修正，
   請切出下一個相符的預發布編號；不要刪除或改寫舊的
   預發布。
10. 對於穩定版，只有在已審核的 beta 或候選發布具備必要驗證證據後才繼續。
    穩定版 npm 發布也會透過
    `OpenClaw Release Publish`，並透過
    `preflight_run_id` 重用成功的預檢成品；穩定版 macOS 發布就緒還需要
    `main` 上已有封裝的 `.zip`、`.dmg`、`.dSYM.zip` 和更新後的 `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器、在需要發布後通道證據時可選的獨立
    已發布 npm Telegram E2E、必要時的 dist-tag 推廣、從完整相符 `CHANGELOG.md` 區段產生的 GitHub 發布/預發布說明，以及發布公告
    步驟。

## 發布預檢

- 在 release preflight 前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` gate 之外仍有涵蓋
- 在 release preflight 前執行 `pnpm check:architecture`，讓較廣泛的 import cycle 與 architecture boundary 檢查在較快的本機 gate 之外保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` release artifact 與 Control UI bundle 存在，以供 pack validation 步驟使用
- 在根版本 bump 之後、tagging 之前執行 `pnpm plugins:sync`。它會更新可發布的 Plugin package 版本、OpenClaw peer/API 相容性 metadata、build metadata，以及 Plugin changelog stub，使其符合核心 release 版本。`pnpm plugins:sync:check` 是非變更性的 release guard；如果忘記此步驟，publish workflow 會在任何 registry mutation 之前失敗。
- 在 release approval 前執行手動 `Full Release Validation` workflow，從單一進入點啟動所有 pre-release test box。它接受 branch、tag 或完整 commit SHA，dispatch 手動 `CI`，並 dispatch `OpenClaw Release Checks`，用於 install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix 與 Telegram lane。Stable/default 執行會將 exhaustive live/E2E 與 Docker release-path soak 保留在 `run_release_soak=true` 之後；`release_profile=full` 會強制啟用 soak。使用 `release_profile=full` 與 `rerun_group=all` 時，它也會針對 release checks 產生的 `release-package-under-test` artifact 執行 package Telegram E2E。發布後，如果同一個 Telegram E2E 也應證明已發布的 npm package，請提供 `npm_telegram_package_spec`。發布後，如果 Package Acceptance 應針對已出貨的 npm package，而不是 SHA-built artifact，執行其 package/update matrix，請提供 `package_acceptance_package_spec`。如果 private evidence report 應證明 validation 符合已發布的 npm package，但不強制執行 Telegram E2E，請提供 `evidence_package_spec`。範例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在 release 工作持續進行時，為 package candidate 取得 side-channel proof，請執行手動 `Package Acceptance` workflow。對 `openclaw@beta`、`openclaw@latest` 或精確 release 版本使用 `source=npm`；若要以目前的 `workflow_ref` harness 打包可信任的 `package_ref` branch/tag/SHA，使用 `source=ref`；對具必要 SHA-256 的 HTTPS tarball 使用 `source=url`；或對另一個 GitHub Actions run 上傳的 tarball 使用 `source=artifact`。此 workflow 會將 candidate resolve 為 `package-under-test`，針對該 tarball 重用 Docker E2E release scheduler，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一個 tarball 執行 Telegram QA。當選取的 Docker lane 包含 `published-upgrade-survivor` 時，package artifact 會是 candidate，而 `published_upgrade_survivor_baseline` 會選取已發布的 baseline。`update-restart-auth` 會將 candidate package 同時用作已安裝的 CLI 與 package-under-test，因此會演練 candidate update command 的 managed restart path。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見 profile：
  - `smoke`：install/channel/agent、gateway network 與 config reload lane
  - `package`：不含 OpenWebUI 或 live ClawHub 的 artifact-native package/update/restart/Plugin lane
  - `product`：package profile 加上 MCP channel、cron/subagent cleanup、OpenAI web search 與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker release-path chunk
  - `custom`：針對聚焦 rerun 的精確 `docker_lanes` 選取
- 當你只需要 release candidate 的完整一般 CI 涵蓋時，直接執行手動 `CI` workflow。手動 CI dispatch 會繞過 changed scoping，並強制執行 Linux Node shard、bundled-Plugin shard、channel contract、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android 與 Control UI i18n lane。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證 release telemetry 時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver 演練 QA-lab，並驗證匯出的 trace span name、有界 attribute，以及 content/identifier redaction，而不需要 Opik、Langfuse 或其他外部 collector。
- 每次 tagged release 前執行 `pnpm release:check`
- tag 存在後，執行 `OpenClaw Release Publish` 以進行會變更狀態的 publish sequence。從 `release/YYYY.M.D` dispatch 它（或在發布 main-reachable tag 時從 `main` dispatch），傳入 release tag 與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin publish scope `all-publishable`，除非你是在刻意執行聚焦修復。此 workflow 會序列化 Plugin npm publish、Plugin ClawHub publish 與 OpenClaw npm publish，確保核心 package 不會在其 externalized Plugin 之前發布。
- Release check 現在於獨立的手動 workflow 中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在 release approval 前執行 QA Lab mock parity lane，以及快速 live Matrix profile 與 Telegram QA lane。live lane 使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential lease。當你需要完整 Matrix transport、media 與 E2EE inventory 平行執行時，請使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- Cross-OS install 與 upgrade runtime validation 是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，它們會直接呼叫 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這個拆分是刻意的：讓真正的 npm release path 保持短、deterministic 且聚焦 artifact，而較慢的 live check 留在自己的 lane，避免拖慢或阻擋 publish
- 帶有 secret 的 release check 應透過 `Full Release Validation` dispatch，或從 `main`/release workflow ref dispatch，讓 workflow logic 與 secret 保持受控
- `OpenClaw Release Checks` 接受 branch、tag 或完整 commit SHA，只要 resolved commit 可從 OpenClaw branch 或 release tag 觸及
- `OpenClaw NPM Release` validation-only preflight 也接受目前完整 40 字元 workflow-branch commit SHA，不需要 pushed tag
- 該 SHA path 僅供 validation，不能提升為真正的 publish
- 在 SHA mode 中，workflow 只為 package metadata check 合成 `v<package.json version>`；真正 publish 仍需要真正的 release tag
- 兩個 workflow 都將真正的 publish 與 promotion path 保留在 GitHub-hosted runner 上，而非變更性的 validation path 可以使用較大的 Blacksmith Linux runner
- 該 workflow 會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` 執行，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secret
- npm release preflight 不再等待獨立的 release checks lane
- 在 approval 前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction tag）
- npm publish 後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction version），在新的暫存 prefix 中驗證已發布的 registry install path
- beta publish 後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享的 leased Telegram credential pool，針對已發布的 npm package 驗證 installed-package onboarding、Telegram setup 與真實 Telegram E2E。本機 maintainer 的一次性執行可省略 Convex var，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credential。
- 若要從 maintainer 機器執行完整 post-publish beta smoke，使用 `pnpm release:beta-smoke -- --beta betaN`。helper 會執行 Parallels npm update/fresh-target validation、dispatch `NPM Telegram Beta E2E`、poll 精確 workflow run、下載 artifact，並列印 Telegram report。
- Maintainer 可以透過手動 `NPM Telegram Beta E2E` workflow 從 GitHub Actions 執行相同的 post-publish check。它刻意設為 manual-only，不會在每次 merge 時執行。
- Maintainer release automation 現在使用 preflight-then-promote：
  - 真正的 npm publish 必須通過成功的 npm `preflight_run_id`
  - 真正的 npm publish 必須從與成功 preflight run 相同的 `main` 或 `release/YYYY.M.D` branch dispatch
  - stable npm release 預設為 `beta`
  - stable npm publish 可透過 workflow input 明確指定 `latest`
  - token-based npm dist-tag mutation 現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以提升安全性，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而 public repo 保持 OIDC-only publish
  - 公開 `macOS Release` 僅供 validation；當 tag 只存在於 release branch，但 workflow 從 `main` dispatch 時，設定 `public_release_branch=release/YYYY.M.D`
  - 真正的 private mac publish 必須通過成功的 private mac `preflight_run_id` 與 `validate_run_id`
  - 真正的 publish path 會 promote 已準備好的 artifact，而不是再次 rebuild
- 對於像 `YYYY.M.D-N` 這樣的 stable correction release，post-publish verifier 也會檢查相同的 temp-prefix upgrade path，從 `YYYY.M.D` 到 `YYYY.M.D-N`，確保 release correction 不會靜默地讓較舊的全域安裝停留在 base stable payload
- npm release preflight 會 fail closed，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，避免再次出貨空的 browser dashboard
- Post-publish verification 也會檢查已發布 Plugin entrypoint 與 package metadata 是否存在於已安裝的 registry layout 中。若 release 出貨時缺少 Plugin runtime payload，postpublish verifier 會失敗，且不能 promote 到 `latest`。
- `pnpm test:install:smoke` 也會在 candidate update tarball 上強制執行 npm pack `unpackedSize` budget，因此 installer e2e 會在 release publish path 前抓到意外的 pack bloat
- 如果 release 工作觸及 CI planning、extension timing manifest 或 extension test matrix，請在 approval 前重新產生並 review planner-owned 的 `.github/workflows/plugin-prerelease.yml` `plugin-prerelease-extension-shard` matrix output，避免 release note 描述過期的 CI layout
- Stable macOS release readiness 也包含 updater surface：
  - GitHub release 最終必須包含 packaged `.zip`、`.dmg` 與 `.dSYM.zip`
  - `main` 上的 `appcast.xml` 必須在 publish 後指向新的 stable zip
  - packaged app 必須保留非 debug bundle id、非空 Sparkle feed URL，以及等於或高於該 release version canonical Sparkle build floor 的 `CFBundleVersion`

## Release test box

`Full Release Validation` 是 operator 從單一進入點啟動所有 pre-release test 的方式。若要在快速變動的 branch 上取得 pinned commit proof，請使用 helper，讓每個 child workflow 都從固定於目標 SHA 的暫時 branch 執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

helper 會 push `release-ci/<sha>-...`，從該 branch dispatch `Full Release Validation` 並帶上 `ref=<sha>`，驗證每個 child workflow 的 `headSha` 符合目標，然後刪除暫時 branch。這可避免意外證明較新的 `main` child run。

若要進行 release branch 或 tag validation，請從可信任的 `main` workflow ref 執行，並將 release branch 或 tag 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

此工作流程會解析目標 ref，分派帶有 `target_ref=<release-ref>` 的手動 `CI`，分派 `OpenClaw Release Checks`，為面向套件的檢查準備上層 `release-package-under-test` 成品，並在 `release_profile=full` 且 `rerun_group=all` 時，或設定 `npm_telegram_package_spec` 時，分派獨立的套件 Telegram E2E。接著 `OpenClaw Release Checks` 會展開安裝煙霧測試、跨作業系統發行檢查、啟用浸泡測試時的即時/E2E Docker 發行路徑覆蓋、包含 Telegram 套件 QA 的套件驗收、QA Lab parity、即時 Matrix，以及即時 Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci` 與 `release_checks` 成功時，完整執行才可接受。在 full/all 模式下，`npm_telegram` 子項也必須成功；在 full/all 之外，除非提供已發布的 `npm_telegram_package_spec`，否則會略過。最終驗證器摘要會包含每個子執行的最慢工作表格，讓發行管理員不必下載記錄即可看到目前的關鍵路徑。請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、確切工作流程工作名稱、stable 與 full 設定檔差異、成品，以及聚焦重新執行控制項。子工作流程會從執行 `Full Release Validation` 的受信任 ref 分派，通常是 `--ref main`，即使目標 `ref` 指向較舊的發行分支或標籤也是如此。沒有獨立的 Full Release Validation 工作流程 ref 輸入；請透過選擇工作流程執行 ref 來選擇受信任的控制流程。不要在移動中的 `main` 上使用 `--ref main -f ref=<sha>` 作為精確提交證明；原始提交 SHA 不能作為工作流程分派 ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立釘選的臨時分支。

使用 `release_profile` 選擇即時/供應商廣度：

- `minimum`：最快的發行關鍵 OpenAI/核心即時與 Docker 路徑
- `stable`：minimum 加上用於發行核准的穩定供應商/後端覆蓋
- `full`：stable 加上廣泛的建議供應商/媒體覆蓋

當發行阻塞路徑為綠燈，且你希望在推廣前執行完整的即時/E2E、Docker 發行路徑，以及有界限的已發布升級存活掃描時，請搭配 `stable` 使用 `run_release_soak=true`。該掃描涵蓋最新四個 stable 套件，加上釘選的 `2026.4.23` 與 `2026.5.2` 基準，以及較舊的 `2026.4.15` 覆蓋；會移除重複基準，並將每個基準分片到自己的 Docker 執行器工作中。`full` 會隱含 `run_release_soak=true`。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref 將目標 ref 解析一次為 `release-package-under-test`，並在執行浸泡測試時於跨作業系統、套件驗收，以及發行路徑 Docker 檢查中重用該成品。這能讓所有面向套件的機器使用相同位元組，並避免重複建置套件。跨作業系統 OpenAI 安裝煙霧測試會在設定 repo/org 變數時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此路徑是在證明套件安裝、onboarding、Gateway 啟動，以及一次即時 agent 回合，而不是對最慢的預設模型做效能基準測試。較廣泛的即時供應商矩陣仍然是模型特定覆蓋的位置。

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

不要在聚焦修正後第一次重新執行時使用完整總括流程。如果某個機器失敗，下一次證明請使用失敗的子工作流程、工作、Docker 路徑、套件設定檔、模型供應商，或 QA 路徑。只有在修正變更了共用發行編排，或讓先前所有機器的證據過期時，才再次執行完整總括流程。總括流程的最終驗證器會重新檢查記錄的子工作流程執行 ID，因此在子工作流程成功重新執行後，只需重新執行失敗的上層 `Verify full validation` 工作。

若要進行有界限的復原，請將 `rerun_group` 傳給總括流程。`all` 是真正的發行候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行僅限發行的 Plugin 子項，`release-checks` 會執行每個發行機器，而較窄的發行群組是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 與 `npm-telegram`。聚焦的 `npm-telegram` 重新執行需要 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 執行會使用 release-checks 套件成品。聚焦的跨作業系統重新執行可以加入 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統/套件篩選器。QA release-check 失敗屬於建議性質；僅 QA 失敗不會阻擋發行驗證。

### Vitest

Vitest 機器是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍限制，並強制針對發行候選執行一般測試圖：Linux Node 分片、bundled-plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用此機器回答「原始碼樹是否通過完整的一般測試套件？」它不同於發行路徑產品驗證。需保留的證據：

- 顯示已分派 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 在精確目標 SHA 上呈綠燈
- 調查迴歸時來自 CI 工作的失敗或緩慢分片名稱
- 需要效能分析時的 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發行需要確定性的一般 CI，但不需要 Docker、QA Lab、即時、跨作業系統，或套件機器時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 機器位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml`，以及發行模式的 `install-smoke` 工作流程。它會透過封裝的 Docker 環境驗證發行候選，而不只做原始碼層級測試。

發行 Docker 覆蓋包含：

- 啟用緩慢 Bun 全域安裝煙霧測試的完整安裝煙霧測試
- 依目標 SHA 準備/重用根 Dockerfile 煙霧映像，並將 QR、root/gateway，以及 installer/Bun 煙霧工作作為獨立 install-smoke 分片執行
- 儲存庫 E2E 路徑
- 發行路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 與 `plugins-runtime-install-h`
- 要求時在 `plugins-runtime-services` 區塊內的 OpenWebUI 覆蓋
- 拆分的 bundled plugin 安裝/解除安裝路徑，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發行檢查包含即時套件時的即時/E2E 供應商套件與 Docker 即時模型覆蓋

重新執行前先使用 Docker 成品。發行路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含路徑記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重新執行命令。若要聚焦復原，請在可重用的即時/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有發行區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 與已準備的 Docker 映像輸入，因此失敗路徑可以重用相同 tarball 與 GHCR 映像。

### QA Lab

QA Lab 機器也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為與通道層級的發行閘門，與 Vitest 和 Docker 套件機制分離。

發行 QA Lab 覆蓋包含：

- 使用 agentic parity pack，比較 OpenAI 候選路徑與 Opus 4.6 基準的 mock parity 路徑
- 使用 `qa-live-shared` 環境的快速即時 Matrix QA 設定檔
- 使用 Convex CI 憑證租約的即時 Telegram QA 路徑
- 當發行遙測需要明確本機證明時的 `pnpm qa:otel:smoke`

使用此機器回答「此發行在 QA 情境與即時通道流程中是否正確運作？」核准發行時，請保留 parity、Matrix 與 Telegram 路徑的成品 URL。完整 Matrix 覆蓋仍可作為手動分片 QA-Lab 執行使用，而不是預設的發行關鍵路徑。

### 套件

套件機器是可安裝產品閘門。它由 `Package Acceptance` 與解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選正規化為供 Docker E2E 使用的 `package-under-test` tarball，驗證套件清單，記錄套件版本與 SHA-256，並讓工作流程控制流程 ref 與套件來源 ref 分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本
- `source=ref`：使用選定的 `workflow_ref` 控制流程封裝受信任的 `package_ref` 分支、標籤，或完整提交 SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發行套件成品、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 執行套件驗收。套件驗收會針對相同解析後的 tarball 保持遷移、更新、已設定驗證的更新重新啟動、過期 Plugin 相依性清理、離線 Plugin fixtures、Plugin 更新，以及 Telegram 套件 QA。阻塞性發行檢查使用預設最新已發布套件基準；`run_release_soak=true` 或 `release_profile=full` 會擴展為從 `2026.4.23` 到 `latest` 的每個 stable npm 已發布基準，加上回報問題的 fixtures。已出貨候選請使用 `source=npm` 的套件驗收，發布前的 SHA 支援本機 npm tarball 則使用 `source=ref`/`source=artifact`。它是大多數先前需要 Parallels 的套件/更新覆蓋的 GitHub 原生替代方案。跨作業系統發行檢查對作業系統特定的 onboarding、installer 與平台行為仍然重要，但套件/更新產品驗證應優先使用套件驗收。

更新與 Plugin 驗證的標準檢查清單是[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。在決定哪個本機、Docker、套件驗收，或 release-check 路徑可證明 Plugin 安裝/更新、doctor 清理，或已發布套件遷移變更時，請使用它。從每個 stable `2026.4.23+` 套件進行完整已發布更新遷移，是獨立的手動 `Update Migration` 工作流程，不是 Full Release CI 的一部分。

舊版 package-acceptance 寬限是刻意設定時限的。到
`2026.4.25` 為止的套件，可以針對已發布到 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少的私有 QA inventory 項目、缺少
`gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少持久化的 `update.channel`、舊版 Plugin install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件，可能會對已出貨的本機建置中繼資料 stamp 檔案提出警告。後續套件必須符合現代套件合約；同樣的缺口會使發布驗證失敗。

當發布問題是關於實際可安裝套件時，請使用更廣泛的 Package Acceptance 設定檔：

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

- `smoke`：快速套件安裝/channel/agent、Gateway 網路，以及設定重新載入 lane
- `package`：不含即時 ClawHub 的 install/update/restart/Plugin 套件合約；這是 release-check 預設值
- `product`：`package` 加上 MCP channels、cron/subagent 清理、OpenAI web search，以及 OpenWebUI
- `full`：包含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：用於聚焦重跑的精確 `docker_lanes` 清單

若要取得套件候選版本的 Telegram 證明，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。workflow 會將解析後的
`package-under-test` tarball 傳入 Telegram lane；獨立的 Telegram workflow 仍接受已發布的 npm 規格，用於發布後檢查。

## 發布自動化

`OpenClaw Release Publish` 是一般的變更性發布進入點。它會依照發布所需順序編排 trusted-publisher workflows：

1. 簽出 release tag 並解析其 commit SHA。
2. 驗證該 tag 可從 `main` 或 `release/*` 到達。
3. 執行 `pnpm plugins:sync:check`。
4. 以 `publish_scope=all-publishable` 和 `ref=<release-sha>` dispatch `Plugin NPM Release`。
5. 以相同 scope 和 SHA dispatch `Plugin ClawHub Release`。
6. 以 release tag、npm dist-tag，以及儲存的 `preflight_run_id` dispatch `OpenClaw NPM Release`。

Beta 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

將穩定版發布到預設 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

直接將穩定版提升到 `latest` 是明確操作：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflows。若要修復選定的 Plugin，請將
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`，或在不得發布 OpenClaw 套件時直接 dispatch 子 workflow。

## NPM workflow 輸入

`OpenClaw NPM Release` 接受這些由 operator 控制的輸入：

- `tag`：必要的 release tag，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，它也可以是目前完整 40 字元的 workflow 分支 commit SHA，用於僅驗證的 preflight
- `preflight_only`：`true` 表示僅 validation/build/package，`false` 表示實際發布路徑
- `preflight_run_id`：實際發布路徑上必要，讓 workflow 重用成功 preflight run 準備好的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標 tag；預設為 `beta`

`OpenClaw Release Publish` 接受這些由 operator 控制的輸入：

- `tag`：必要的 release tag；必須已經存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight run id；當 `publish_openclaw_npm=true` 時為必要
- `npm_dist_tag`：OpenClaw 套件的 npm 目標 tag
- `plugin_publish_scope`：預設為 `all-publishable`；只有聚焦修復工作才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有將 workflow 作為僅 Plugin 修復的編排器時，才設定為 `false`

`OpenClaw Release Checks` 接受這些由 operator 控制的輸入：

- `ref`：要驗證的分支、tag 或完整 commit SHA。帶有 secret 的檢查要求解析後的 commit 可從 OpenClaw 分支或 release tag 到達。
- `run_release_soak`：在 stable/default release checks 上選擇加入完整 live/E2E、Docker release-path，以及 all-since upgrade-survivor soak。它會由 `release_profile=full` 強制啟用。

規則：

- Stable 和 correction tags 可以發布到 `beta` 或 `latest`
- Beta prerelease tags 只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許完整 commit SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 永遠僅用於驗證
- 實際發布路徑必須使用 preflight 期間使用的相同 `npm_dist_tag`；workflow 會在發布繼續前驗證該中繼資料

## 穩定版 npm 發布順序

切出穩定版 npm 發布時：

1. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在 tag 存在之前，你可以使用目前完整的 workflow 分支 commit SHA，對 preflight workflow 執行僅驗證的 dry run
2. 一般 beta-first 流程選擇 `npm_dist_tag=beta`，只有在你刻意想要直接發布穩定版時才選擇 `latest`
3. 當你想要從單一手動 workflow 取得一般 CI 加上即時 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆蓋率時，請在 release branch、release tag 或完整 commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要 deterministic normal test graph，請改在 release ref 上執行手動 `CI` workflow
5. 儲存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`，以及儲存的 `preflight_run_id` 執行 `OpenClaw Release Publish`；它會在提升 OpenClaw npm 套件之前，將外部化的 Plugins 發布到 npm 和 ClawHub
7. 如果發布落在 `beta`，請使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發布刻意直接發布到 `latest`，且 `beta` 應立即跟隨相同穩定建置，請使用同一個私有 workflow 將兩個 dist-tags 指向穩定版本，或讓其排程式自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中是出於安全考量，因為它仍需要 `NPM_TOKEN`，而 public repo 保持僅 OIDC 發布。

這讓直接發布路徑和 beta-first 提升路徑都被文件化，且 operator 可見。

如果 maintainer 必須退回使用本機 npm 驗證，請只在專用 tmux session 內執行任何 1Password CLI (`op`) commands。不要直接從主要 agent shell 呼叫 `op`；將它保留在 tmux 內，可讓 prompts、alerts 和 OTP 處理可觀察，並防止重複的 host alerts。

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

Maintainers 使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有發布文件作為實際 runbook。

## 相關

- [發布 channels](/zh-TW/install/development-channels)
