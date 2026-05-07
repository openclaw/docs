---
read_when:
    - 正在尋找公開發行通道定義
    - 執行發布驗證或套件驗收
    - 想了解版本命名與發布節奏
summary: 發布軌道、操作員檢查清單、驗證環境、版本命名和節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-07T13:25:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發行通道：

- stable：已標記的發行版本，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：預發行標籤，發布到 npm `beta`
- dev：`main` 的移動中最新版本

## 版本命名

- 穩定發行版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定修正發行版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發行版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 不要對月份或日期補零
- `latest` 表示目前已提升的穩定 npm 發行版本
- `beta` 表示目前的 beta 安裝目標
- 穩定與穩定修正發行版本預設發布到 npm `beta`；發行操作人員可以明確指定 `latest`，或稍後提升經審核的 beta 建置
- 每個穩定 OpenClaw 發行版本都會一併交付 npm 套件與 macOS app；
  beta 發行版本通常會先驗證並發布 npm/套件路徑，而
  Mac app 建置/簽署/公證則保留給穩定版本，除非明確要求

## 發行節奏

- 發行採 beta 優先
- 只有在最新 beta 驗證完成後才會推出穩定版本
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發行版本，
  因此發行驗證與修正不會阻擋 `main` 上的新
  開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切出
  下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細的發行程序、核准、憑證與復原注意事項僅限
  維護者使用

## 發行操作人員檢查清單

此檢查清單是發行流程的公開輪廓。私人憑證、
簽署、公證、dist-tag 復原與緊急回滾詳細資訊會保留在
僅限維護者使用的發行操作手冊中。

1. 從目前的 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` 的 CI 綠燈程度足以從它建立分支。
2. 使用 `/changelog` 依據真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交它、推送它，並在建立分支前再 rebase/pull
   一次。
3. 檢閱
   `src/plugins/compat/registry.ts` 與
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發行相容性記錄。只有在升級路徑仍有涵蓋時才移除過期的
   相容性，或記錄為何要刻意保留它。
4. 從目前的 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上執行一般發行工作。
5. 為預期標籤調升每個必要位置的版本，執行
   `pnpm plugins:sync`，讓可發布的 Plugin 套件共享發行
   版本與相容性中繼資料，然後執行本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check`，以及
   `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，
   可使用完整的 40 字元發行分支 SHA 進行僅限驗證的
   預檢。儲存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 針對
   發行分支、標籤或完整提交 SHA 啟動所有預發行測試。這是四個大型發行測試箱的唯一手動進入點：
   Vitest、Docker、QA Lab 與 Package。
8. 如果驗證失敗，請在發行分支上修正，並重新執行能證明修正的最小失敗
   檔案、通道、工作流程 job、套件設定檔、提供者或模型允許清單。
   只有在變更範圍使先前證據失效時，才重新執行完整總括流程。
9. 對於 beta，標記 `vYYYY.M.D-beta.N`，然後從
   對應的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   將所有可發布的 Plugin 套件平行派送到 npm 與同一組
   ClawHub，然後在 Plugin npm 發布成功後，立即使用相符的 dist-tag
   提升已準備好的 OpenClaw npm 預檢
   成品。ClawHub 發布在 OpenClaw npm 發布時可能仍在執行，但
   發行發布工作流程必須等到兩條 Plugin 發布路徑與
   OpenClaw npm 發布路徑都成功完成後才會結束。發布後，請針對已發布的
   `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 套件執行發布後套件
   驗收。如果已推送或已發布的預發行版本需要修正，
   請切出下一個相符的預發行編號；不要刪除或重寫舊的
   預發行版本。
10. 對於穩定版本，只有在已審核的 beta 或 release candidate 具備
    所需驗證證據後才繼續。穩定 npm 發布也會透過
    `OpenClaw Release Publish`，並透過
    `preflight_run_id` 重用成功的預檢成品；穩定 macOS 發行就緒也需要
    `main` 上已打包的 `.zip`、`.dmg`、`.dSYM.zip`，以及更新後的 `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器、在需要發布後通道證明時執行選用的獨立
    已發布 npm Telegram E2E、
    在需要時執行 dist-tag 提升、根據完整相符的 `CHANGELOG.md` 區段產生 GitHub release/prerelease notes，
    以及發行公告
    步驟。

## 發行預檢

- 在 release preflight 前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` gate 之外仍受到涵蓋
- 在 release preflight 前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機 gate 之外也保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓 pack 驗證步驟需要的 `dist/*` release 成品與 Control UI bundle 存在
- 在根版本 bump 之後、標記 tag 之前執行 `pnpm plugins:sync`。它會更新可發布 Plugin 套件版本、OpenClaw peer/API 相容性 metadata、build metadata，以及 Plugin changelog stub，以符合核心 release 版本。`pnpm plugins:sync:check` 是不變更檔案的 release guard；如果忘記此步驟，publish workflow 會在任何 registry mutation 之前失敗。
- 在 release approval 前執行手動 `Full Release Validation` workflow，從單一 entrypoint 啟動所有 pre-release test boxes。它接受 branch、tag 或完整 commit SHA，dispatch 手動 `CI`，並 dispatch `OpenClaw Release Checks`，涵蓋 install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix 與 Telegram lanes。Stable/default runs 會將完整 live/E2E 與 Docker release-path soak 保留在 `run_release_soak=true` 後方；`release_profile=full` 會強制開啟 soak。搭配 `release_profile=full` 與 `rerun_group=all` 時，也會針對 release checks 產生的 `release-package-under-test` artifact 執行 package Telegram E2E。發布後，若同一個 Telegram E2E 也應驗證已發布的 npm package，請提供 `npm_telegram_package_spec`。發布後，若 Package Acceptance 應針對已交付的 npm package 而非 SHA-built artifact 執行其 package/update matrix，請提供 `package_acceptance_package_spec`。若私有 evidence report 應驗證 validation 符合已發布 npm package、但不強制 Telegram E2E，請提供 `evidence_package_spec`。範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在 release 工作持續進行時，為 package candidate 取得 side-channel proof，請執行手動 `Package Acceptance` workflow。對 `openclaw@beta`、`openclaw@latest` 或精確 release version 使用 `source=npm`；使用 `source=ref` 搭配目前 `workflow_ref` harness 來 pack 受信任的 `package_ref` branch/tag/SHA；對需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或對另一個 GitHub Actions run 上傳的 tarball 使用 `source=artifact`。workflow 會將 candidate 解析為 `package-under-test`，針對該 tarball 重用 Docker E2E release scheduler，並可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 針對同一個 tarball 執行 Telegram QA。當選取的 Docker lanes 包含 `published-upgrade-survivor` 時，package artifact 會是 candidate，而 `published_upgrade_survivor_baseline` 會選取已發布 baseline。`update-restart-auth` 會將 candidate package 同時作為已安裝 CLI 與 package-under-test，因此會測試 candidate update command 的 managed restart path。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見 profiles：
  - `smoke`：install/channel/agent、Gateway network 與 config reload lanes
  - `package`：artifact-native package/update/restart/Plugin lanes，不含 OpenWebUI 或 live ClawHub
  - `product`：package profile，加上 MCP channels、cron/subagent cleanup、OpenAI web search 與 OpenWebUI
  - `full`：Docker release-path chunks，含 OpenWebUI
  - `custom`：為聚焦 rerun 精確選取 `docker_lanes`
- 當你只需要 release candidate 的完整一般 CI coverage 時，直接執行手動 `CI` workflow。手動 CI dispatches 會繞過 changed scoping，並強制執行 Linux Node shards、bundled-Plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android 與 Control UI i18n lanes。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證 release telemetry 時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver 測試 QA-lab，並驗證匯出的 trace span names、受限 attributes，以及 content/identifier redaction，不需要 Opik、Langfuse 或其他外部 collector。
- 每次 tagged release 前執行 `pnpm release:check`
- tag 存在後，為 mutating publish sequence 執行 `OpenClaw Release Publish`。從 `release/YYYY.M.D` dispatch（或在發布 main-reachable tag 時從 `main` dispatch），傳入 release tag 與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin publish scope `all-publishable`，除非你刻意執行聚焦修復。workflow 會序列化 Plugin npm publish、Plugin ClawHub publish 與 OpenClaw npm publish，因此核心 package 不會在外部化 Plugins 之前發布。
- Release checks 現在在獨立的手動 workflow 中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在 release approval 前執行 QA Lab mock parity lane，加上快速 live Matrix profile 與 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential leases。當你想並行取得完整 Matrix transport、media 與 E2EE inventory 時，請以 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- Cross-OS install 與 upgrade runtime validation 是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，它們會直接呼叫 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這項拆分是刻意設計的：讓真正的 npm release path 保持短小、deterministic 且聚焦 artifact，同時讓較慢的 live checks 留在自己的 lane，避免拖慢或阻擋 publish
- 帶有 secrets 的 release checks 應透過 `Full Release
Validation` dispatch，或從 `main`/release workflow ref dispatch，讓 workflow logic 與 secrets 維持受控
- `OpenClaw Release Checks` 接受 branch、tag 或完整 commit SHA，只要 resolved commit 可從 OpenClaw branch 或 release tag 抵達
- `OpenClaw NPM Release` validation-only preflight 也接受目前完整 40 字元 workflow-branch commit SHA，不需要已推送的 tag
- 該 SHA path 僅供 validation，無法提升為真正 publish
- 在 SHA mode 中，workflow 只會為 package metadata check 合成 `v<package.json version>`；真正 publish 仍需要真實 release tag
- 兩個 workflows 都將真正的 publish 與 promotion path 保持在 GitHub-hosted runners 上，而不變更檔案的 validation path 可使用較大型的 Blacksmith Linux runners
- 該 workflow 會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets
- npm release preflight 不再等待獨立的 release checks lane
- 在 approval 前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction tag）
- npm publish 後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction version），在全新 temp prefix 中驗證已發布 registry install path
- beta publish 後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共用租用 Telegram credential pool，針對已發布 npm package 驗證 installed-package onboarding、Telegram setup 與真實 Telegram E2E。本機 maintainer 一次性執行可省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- 若要從 maintainer machine 執行完整 post-publish beta smoke，請使用 `pnpm release:beta-smoke -- --beta betaN`。helper 會執行 Parallels npm update/fresh-target validation、dispatch `NPM Telegram Beta E2E`、poll 精確 workflow run、下載 artifact，並列印 Telegram report。
- Maintainers 可透過手動 `NPM Telegram Beta E2E` workflow，從 GitHub Actions 執行相同的 post-publish check。它刻意僅限手動，不會在每次 merge 時執行。
- Maintainer release automation 現在使用 preflight-then-promote：
  - 真正 npm publish 必須通過成功的 npm `preflight_run_id`
  - 真正 npm publish 必須從成功 preflight run 相同的 `main` 或 `release/YYYY.M.D` branch dispatch
  - stable npm releases 預設為 `beta`
  - stable npm publish 可透過 workflow input 明確指定 `latest`
  - token-based npm dist-tag mutation 現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，以確保安全性，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開 repo 保持 OIDC-only publish
  - 公開 `macOS Release` 僅供 validation；當 tag 只存在於 release branch，但 workflow 從 `main` dispatch 時，請設定 `public_release_branch=release/YYYY.M.D`
  - 真正私有 mac publish 必須通過成功的私有 mac `preflight_run_id` 與 `validate_run_id`
  - 真正 publish paths 會 promote 已準備的 artifacts，而不是再次重建它們
- 對 `YYYY.M.D-N` 這類 stable correction releases，post-publish verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的同一個 temp-prefix upgrade path，讓 release corrections 不會默默讓較舊 global installs 留在 base stable payload
- 除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，否則 npm release preflight 會 fail closed，避免再次發布空白 browser dashboard
- Post-publish verification 也會檢查已發布 Plugin entrypoints 與 package metadata 是否存在於已安裝 registry layout。若 release 缺少 Plugin runtime payloads，postpublish verifier 會失敗，且不能提升為 `latest`。
- `pnpm test:install:smoke` 也會在 candidate update tarball 上強制執行 npm pack `unpackedSize` budget，因此 installer e2e 能在 release publish path 之前抓到意外的 pack bloat
- 如果 release work 觸及 CI planning、extension timing manifests 或 extension test matrices，請在 approval 前重新產生並 review planner-owned `plugin-prerelease-extension-shard` matrix outputs（來自 `.github/workflows/plugin-prerelease.yml`），讓 release notes 不會描述過時的 CI layout
- Stable macOS release readiness 也包含 updater surfaces：
  - GitHub release 最終必須包含已封裝的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - publish 後，`appcast.xml` on `main` 必須指向新的 stable zip
  - 已封裝 app 必須保持 non-debug bundle id、非空 Sparkle feed URL，以及大於或等於該 release version canonical Sparkle build floor 的 `CFBundleVersion`

## Release 測試盒

`Full Release Validation` 是 operators 從單一 entrypoint 啟動所有 pre-release tests 的方式。若要在快速變動 branch 上取得 pinned commit proof，請使用 helper，讓每個 child workflow 都從固定於目標 SHA 的 temporary branch 執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

helper 會推送 `release-ci/<sha>-...`，從該 branch dispatch `Full Release Validation` 並帶入 `ref=<sha>`，驗證每個 child workflow 的 `headSha` 符合目標，接著刪除 temporary branch。這能避免意外驗證到較新的 `main` child run。

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

此 workflow 會解析目標 ref，使用 `target_ref=<release-ref>` 派送手動 `CI`，派送 `OpenClaw Release Checks`，準備供套件相關檢查使用的父層 `release-package-under-test` artifact，並在 `release_profile=full` 且 `rerun_group=all` 時，或設定 `npm_telegram_package_spec` 時，派送獨立的套件 Telegram E2E。接著 `OpenClaw Release Checks` 會展開安裝煙霧測試、跨 OS release 檢查、啟用 soak 時的 live/E2E Docker release 路徑涵蓋、含 Telegram 套件 QA 的 Package Acceptance、QA Lab parity、live Matrix，以及 live Telegram。只有在 `Full Release Validation` 摘要顯示 `normal_ci` 和 `release_checks` 成功時，完整執行才可接受。在 full/all 模式中，`npm_telegram` 子項也必須成功；在 full/all 之外，除非提供已發布的 `npm_telegram_package_spec`，否則會略過。最終 verifier 摘要會包含每個子執行的最慢 job 表格，讓 release manager 不必下載 logs 就能看到目前的 critical path。
請參閱[完整 release 驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、精確的 workflow job 名稱、stable 與 full profile 的差異、artifacts，以及聚焦 rerun 控制。
子 workflow 會從執行 `Full Release Validation` 的受信任 ref 派送，通常是 `--ref main`，即使目標 `ref` 指向較舊的 release branch 或 tag。沒有獨立的 Full Release Validation workflow-ref 輸入；請透過選擇 workflow run ref 來選擇受信任的 harness。
不要在移動中的 `main` 上使用 `--ref main -f ref=<sha>` 作為精確 commit 證明；原始 commit SHA 不能作為 workflow dispatch ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立 pinned 暫時 branch。

使用 `release_profile` 選擇 live/provider 廣度：

- `minimum`：最快的 release-critical OpenAI/core live 與 Docker 路徑
- `stable`：minimum 加上用於 release 核准的 stable provider/backend 涵蓋
- `full`：stable 加上廣泛的 advisory provider/media 涵蓋

當 release-blocking lanes 為綠燈，且你想在 promotion 前執行詳盡的 live/E2E、Docker release 路徑，以及有界的已發布升級倖存者掃描時，請搭配 `stable` 使用 `run_release_soak=true`。該掃描涵蓋最新四個 stable 套件，加上 pinned `2026.4.23` 和 `2026.5.2` baseline，以及較舊的 `2026.4.15` 涵蓋；重複 baseline 會移除，且每個 baseline 都會分片到自己的 Docker runner job。`full` 會隱含 `run_release_soak=true`。

`OpenClaw Release Checks` 會使用受信任的 workflow ref，將目標 ref 一次解析為 `release-package-under-test`，並在 soak 執行時於 cross-OS、Package Acceptance，以及 release-path Docker 檢查中重用該 artifact。這能讓所有套件相關 boxes 使用相同 bytes，並避免重複建置套件。
當 repo/org 變數已設定時，cross-OS OpenAI 安裝煙霧測試會使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此 lane 是在證明套件安裝、onboarding、Gateway 啟動，以及一次 live agent turn，而不是 benchmark 最慢的預設 model。更廣泛的 live provider 矩陣仍是 model-specific 涵蓋的位置。

依照 release 階段使用這些變體：

```bash
# 驗證未發布的 release candidate branch。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# 驗證精確推送的 commit。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# 發布 beta 後，加入已發布套件 Telegram E2E。
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

不要把完整 umbrella 當作聚焦修復後的第一次 rerun。如果有一個 box 失敗，下一次 proof 請使用失敗的子 workflow、job、Docker lane、package profile、model provider，或 QA lane。只有在修復變更了共享 release orchestration，或讓先前 all-box evidence 過期時，才再次執行完整 umbrella。umbrella 的最終 verifier 會重新檢查記錄的子 workflow run ids，因此在子 workflow 成功 rerun 後，只需 rerun 失敗的父層 `Verify full validation` job。

若要進行有界復原，請將 `rerun_group` 傳給 umbrella。`all` 是真正的 release-candidate run，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行 release-only Plugin 子項，`release-checks` 執行每個 release box，而較窄的 release 群組為 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` rerun 需要 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all run 會使用 release-checks 套件 artifact。聚焦的 cross-OS rerun 可加入 `cross_os_suite_filter=windows/packaged-upgrade` 或其他 OS/suite filter。QA release-check 失敗屬 advisory；僅 QA 失敗不會阻擋 release 驗證。

### Vitest

Vitest box 是手動 `CI` 子 workflow。手動 CI 會刻意略過 changed scoping，並對 release candidate 強制執行一般 test graph：Linux Node shards、bundled-Plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android，以及 Control UI i18n。

使用此 box 回答「source tree 是否通過完整的一般 test suite？」
這與 release-path 產品驗證不同。應保留的 evidence：

- `Full Release Validation` 摘要，顯示派送的 `CI` run URL
- `CI` run 在精確目標 SHA 上為綠燈
- 調查 regression 時，CI jobs 中失敗或緩慢的 shard 名稱
- 當 run 需要效能分析時，Vitest timing artifacts，例如 `.artifacts/vitest-shard-timings.json`

只有在 release 需要 deterministic 一般 CI，但不需要 Docker、QA Lab、live、cross-OS 或 package boxes 時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml` 以及 release-mode `install-smoke` workflow 執行。它透過 packaged Docker environments 驗證 release candidate，而不只做 source-level tests。

Release Docker 涵蓋包括：

- 啟用緩慢 Bun global install smoke 的完整 install smoke
- 依目標 SHA 準備/重用 root Dockerfile smoke image，並將 QR、root/Gateway，以及 installer/Bun smoke jobs 作為獨立 install-smoke shards 執行
- repository E2E lanes
- release-path Docker chunks：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 依要求在 `plugins-runtime-services` chunk 內涵蓋 OpenWebUI
- 分割的 bundled Plugin install/uninstall lanes：`bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- release checks 包含 live suites 時的 live/E2E provider suites 與 Docker live model 涵蓋

rerun 前先使用 Docker artifacts。release-path scheduler 會上傳 `.artifacts/docker-tests/`，其中包含 lane logs、`summary.json`、`failures.json`、phase timings、scheduler plan JSON，以及 rerun commands。若要聚焦復原，請在 reusable live/E2E workflow 上使用 `docker_lanes=<lane[,lane]>`，而不是 rerun 所有 release chunks。產生的 rerun commands 會在可用時包含先前的 `package_artifact_run_id` 與已準備的 Docker image inputs，因此失敗的 lane 可重用相同 tarball 與 GHCR images。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic behavior 與 channel-level release gate，獨立於 Vitest 與 Docker 套件機制。

Release QA Lab 涵蓋包括：

- 使用 agentic parity pack，比較 OpenAI candidate lane 與 Opus 4.6 baseline 的 mock parity lane
- 使用 `qa-live-shared` environment 的快速 live Matrix QA profile
- 使用 Convex CI credential leases 的 live Telegram QA lane
- release telemetry 需要明確 local proof 時的 `pnpm qa:otel:smoke`

使用此 box 回答「release 在 QA scenarios 與 live channel flows 中是否表現正確？」
核准 release 時，保留 parity、Matrix 和 Telegram lanes 的 artifact URLs。完整 Matrix 涵蓋仍可作為手動 sharded QA-Lab run 使用，而不是預設的 release-critical lane。

### Package

Package box 是可安裝產品 gate。它由 `Package Acceptance` 和 resolver `scripts/resolve-openclaw-package-candidate.mjs` 支援。resolver 會將 candidate 正規化為 Docker E2E 消耗的 `package-under-test` tarball，驗證套件 inventory，記錄 package version 與 SHA-256，並將 workflow harness ref 與 package source ref 分開。

支援的 candidate sources：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw release version
- `source=ref`：使用選定的 `workflow_ref` harness，封裝受信任的 `package_ref` branch、tag 或完整 commit SHA
- `source=url`：下載 HTTPS `.tgz`，並要求 `package_sha256`
- `source=artifact`：重用另一個 GitHub Actions run 上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的 release package artifact、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對同一個已解析 tarball 保持 migration、update、configured-auth update restart、stale Plugin dependency cleanup、offline Plugin fixtures、Plugin update，以及 Telegram package QA。阻擋 release 的檢查使用預設的最新已發布套件 baseline；`run_release_soak=true` 或 `release_profile=full` 會擴展為從 `2026.4.23` 到 `latest` 的每個 stable npm-published baseline，加上 reported-issue fixtures。對已 shipped 的 candidate 使用 `source=npm` 執行 Package Acceptance，或在 publish 前對 SHA-backed local npm tarball 使用 `source=ref`/`source=artifact`。它是 GitHub-native replacement，可取代過去多數需要 Parallels 的 package/update 涵蓋。Cross-OS release checks 對 OS-specific onboarding、installer 與 platform behavior 仍然重要，但 package/update 產品驗證應優先使用 Package Acceptance。

update 與 Plugin 驗證的 canonical checklist 是[測試 updates 與 plugins](/zh-TW/help/testing-updates-plugins)。判斷哪個 local、Docker、Package Acceptance 或 release-check lane 能證明 Plugin install/update、doctor cleanup，或已發布套件 migration 變更時，請使用它。從每個 stable `2026.4.23+` 套件進行的詳盡 published update migration，是獨立的手動 `Update Migration` workflow，不屬於 Full Release CI。

舊版套件驗收寬限是刻意設定時限的。到
`2026.4.25` 為止的套件，可針對已發布到 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少的私人 QA 清冊項目、缺少
`gateway install --wrapper`、tarball 衍生 git fixture 中缺少的修補檔、缺少持久化的 `update.channel`、舊版 Plugin 安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件可針對已出貨的本機建置中繼資料戳記檔發出警告。之後的套件必須符合現代套件合約；相同缺口會導致發布驗證失敗。

當發布問題涉及實際可安裝套件時，請使用更廣泛的套件驗收設定檔：

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

- `smoke`：快速套件安裝/channel/agent、Gateway 網路，以及設定重新載入路徑
- `package`：安裝/更新/重新啟動/Plugin 套件合約，不含即時 ClawHub；這是發布檢查預設值
- `product`：`package` 加上 MCP channel、cron/subagent 清理、OpenAI 網路搜尋，以及 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：精確的 `docker_lanes` 清單，用於聚焦重新執行

若要提供套件候選版本的 Telegram 證明，請在套件驗收中啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。workflow 會將解析後的 `package-under-test` tarball 傳入 Telegram 路徑；獨立 Telegram workflow 仍接受已發布的 npm 規格，用於發布後檢查。

## 發布自動化

`OpenClaw Release Publish` 是一般會進行變更的發布入口點。它會依照發布所需順序協調 trusted-publisher workflow：

1. 簽出發布標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 觸及。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 派送 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 派送 `Plugin ClawHub Release`。
6. 使用發布標籤、npm dist-tag，以及已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。

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

僅在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflow。對於選定 Plugin 修復，請將 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`，或在不得發布 OpenClaw 套件時直接派送子 workflow。

## NPM workflow 輸入

`OpenClaw NPM Release` 接受這些由操作員控制的輸入：

- `tag`：必要發布標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整的 40 字元 workflow 分支 commit SHA，用於僅驗證的 preflight
- `preflight_only`：`true` 表示僅驗證/建置/打包，`false` 表示實際發布路徑
- `preflight_run_id`：實際發布路徑必填，讓 workflow 重用成功 preflight 執行所準備的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受這些由操作員控制的輸入：

- `tag`：必要發布標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight 執行 id；
  當 `publish_openclaw_npm=true` 時必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；僅在聚焦修復工作時使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；僅在將 workflow 用作僅 Plugin 修復協調器時設定為 `false`

`OpenClaw Release Checks` 接受這些由操作員控制的輸入：

- `ref`：要驗證的分支、標籤或完整 commit SHA。帶有 secret 的檢查要求解析後的 commit 可從 OpenClaw 分支或發布標籤觸及。
- `run_release_soak`：在穩定版/預設發布檢查中選擇執行完整即時/E2E、Docker 發布路徑，以及 all-since 升級存續 soak。`release_profile=full` 會強制啟用。

規則：

- 穩定版和修正版標籤可發布到 `beta` 或 `latest`
- Beta 預發布標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，完整 commit SHA 輸入只有在
  `preflight_only=true` 時才允許
- `OpenClaw Release Checks` 和 `Full Release Validation` 永遠只做驗證
- 實際發布路徑必須使用 preflight 期間使用的相同 `npm_dist_tag`；
  workflow 會在發布前繼續驗證該中繼資料

## 穩定版 npm 發布順序

切出穩定版 npm 發布時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在前，你可以使用目前完整的 workflow 分支 commit
     SHA，對 preflight workflow 執行僅驗證的 dry run
2. 一般 beta-first 流程選擇 `npm_dist_tag=beta`，或僅在你刻意想直接發布穩定版時選擇 `latest`
3. 若希望從單一手動 workflow 取得一般 CI 加上即時 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆蓋，請在發布分支、發布標籤或完整 commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要 deterministic 一般測試圖，請改在發布 ref 上執行手動 `CI` workflow
5. 儲存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`，以及已儲存的 `preflight_run_id` 執行 `OpenClaw Release Publish`；它會先將外部化 Plugin 發布到 npm 和 ClawHub，再提升 OpenClaw npm 套件
7. 如果發布落在 `beta`，請使用私人
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發布刻意直接發布到 `latest`，且 `beta`
   應立即跟隨相同穩定版建置，請使用同一個私人
   workflow 將兩個 dist-tag 指向該穩定版本，或讓其排程自我修復同步稍後移動 `beta`

dist-tag 變更位於私人 repo 是基於安全性，因為它仍需要 `NPM_TOKEN`，而公開 repo 維持僅 OIDC 發布。

這會讓直接發布路徑和 beta-first 提升路徑都保持文件化，且操作員可見。

如果維護者必須退回本機 npm 驗證，請只在專用 tmux session 內執行任何 1Password CLI (`op`) 命令。不要從主要 agent shell 直接呼叫 `op`；將它保持在 tmux 內可讓提示、警示和 OTP 處理可被觀察，並防止重複的主機警示。

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
中的私人發布文件作為實際 runbook。

## 相關

- [發布 channel](/zh-TW/install/development-channels)
