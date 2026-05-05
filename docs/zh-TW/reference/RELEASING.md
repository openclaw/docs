---
read_when:
    - 正在尋找公開發行通道定義
    - 執行發布驗證或套件驗收
    - 正在尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證環境、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-05T01:48:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發行通道：

- 穩定版：帶有標籤的發行版本，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- Beta：發布到 npm `beta` 的預發行標籤
- 開發版：`main` 的移動頭部

## 版本命名

- 穩定版發行版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定版修正發行版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發行版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已提升的穩定版 npm 發行版本
- `beta` 表示目前的 Beta 安裝目標
- 穩定版和穩定版修正發行版本預設發布到 npm `beta`；發行操作員可以明確指定 `latest`，或稍後提升經過審核的 Beta 建置
- 每個穩定版 OpenClaw 發行版本都會同時交付 npm 套件和 macOS 應用程式；
  Beta 發行版本通常會先驗證並發布 npm／套件路徑，而 mac 應用程式的建置／簽署／公證則保留給穩定版，除非明確要求

## 發行節奏

- 發行採用 Beta 優先
- 穩定版只會在最新 Beta 驗證完成後接續推出
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發行版本，
  因此發行驗證和修正不會阻塞 `main` 上的新開發
- 如果 Beta 標籤已推送或發布且需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 Beta 標籤
- 詳細的發行程序、核准、憑證和復原備註僅供維護者使用

## 發行操作員檢查清單

這份檢查清單是發行流程的公開形態。私有憑證、
簽署、公證、dist-tag 復原和緊急回復細節會保留在
僅供維護者使用的發行操作手冊中。

1. 從目前的 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` 的 CI 綠燈程度足以從它建立分支。
2. 使用 `/changelog` 從真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交它、推送它，並在建立分支前再 rebase／pull
   一次。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發行相容性記錄。只有在升級路徑仍受到涵蓋時才移除過期相容性，或記錄為何刻意保留。
4. 從目前的 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發行工作。
5. 為預定標籤更新所有必要的版本位置，執行
   `pnpm plugins:sync`，讓可發布的 Plugin 套件共用發行版本和相容性中繼資料，然後執行本機決定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，
   可使用完整 40 字元的發行分支 SHA 進行僅驗證預檢。儲存成功的 `preflight_run_id`。
7. 針對發行分支、標籤或完整提交 SHA，以 `Full Release Validation`
   啟動所有預發行測試。這是四個大型發行測試盒的唯一手動入口點：Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發行分支上修正，並重新執行能證明修正的最小失敗檔案、通道、工作流程工作、套件設定檔、提供者或模型允許清單。只有在變更表面使先前證據過期時，才重新執行完整 umbrella。
9. 對於 Beta，標記 `vYYYY.M.D-beta.N`，然後從相符的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，先將所有可發布的 Plugin 套件發布到 npm，接著以 ClawPack npm-pack tarballs 的形式將同一組發布到 ClawHub，然後使用相符的 dist-tag 提升已準備好的 OpenClaw npm 預檢成品。發布後，對已發布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 套件執行發布後套件
   acceptance。如果已推送或發布的預發行版本需要修正，
   請切出下一個相符的預發行編號；不要刪除或重寫舊的
   預發行版本。
10. 對於穩定版，只有在經審核的 Beta 或發行候選版本具備所需驗證證據後才繼續。穩定版 npm 發布也會透過
    `OpenClaw Release Publish`，並透過
    `preflight_run_id` 重用成功的預檢成品；穩定版 macOS 發行準備狀態也要求 `main` 上有封裝好的 `.zip`、`.dmg`、`.dSYM.zip` 和已更新的 `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器、在需要發布後通道證明時可選的獨立
    已發布 npm Telegram E2E、必要時的 dist-tag 提升、從完整相符
    `CHANGELOG.md` 區段產生的 GitHub 發行／預發行備註，以及發行公告
    步驟。

## 發行預檢

- 在發布預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 閘門之外也持續涵蓋
- 在發布預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機閘門之外保持綠燈
- 在執行 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發布成品與 Control UI bundle 存在，供封裝驗證步驟使用
- 在根版本升級後、標記前執行 `pnpm plugins:sync`。它會更新可發布的 Plugin package 版本、OpenClaw peer/API 相容性中繼資料、建置中繼資料，以及 Plugin 變更記錄 stub，以符合核心發布版本。`pnpm plugins:sync:check` 是不變更檔案的發布防護；如果忘記此步驟，發布 workflow 會在任何 registry 變更前失敗。
- 在發布核准前執行手動 `Full Release Validation` workflow，從單一進入點啟動所有發布前測試盒。它接受分支、標籤或完整 commit SHA，會派發手動 `CI`，並派發 `OpenClaw Release Checks` 來執行安裝 smoke、package acceptance、跨 OS package 檢查、QA Lab parity、Matrix 與 Telegram lanes。Stable/default 執行會將完整 live/E2E 與 Docker 發布路徑 soak 保留在 `run_release_soak=true` 之後；`release_profile=full` 會強制啟用 soak。搭配 `release_profile=full` 與 `rerun_group=all` 時，它也會針對 release checks 產生的 `release-package-under-test` artifact 執行 package Telegram E2E。發布後，若同一個 Telegram E2E 也應驗證已發布的 npm package，請提供 `npm_telegram_package_spec`。發布後，若 Package Acceptance 應針對已出貨的 npm package 而非 SHA 建置 artifact 執行其 package/update 矩陣，請提供 `package_acceptance_package_spec`。若 private evidence report 應證明驗證符合已發布的 npm package，而不強制 Telegram E2E，請提供 `evidence_package_spec`。範例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在發布工作繼續進行時，為 package 候選版本取得旁路證明，請執行手動 `Package Acceptance` workflow。針對 `openclaw@beta`、`openclaw@latest` 或精確發布版本使用 `source=npm`；若要用目前的 `workflow_ref` harness 封裝受信任的 `package_ref` 分支/標籤/SHA，使用 `source=ref`；針對需要 SHA-256 的 HTTPS tarball，使用 `source=url`；或針對另一個 GitHub Actions 執行上傳的 tarball，使用 `source=artifact`。該 workflow 會將候選版本解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發布排程器，並可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 針對同一 tarball 執行 Telegram QA。當選取的 Docker lanes 包含 `published-upgrade-survivor` 時，package artifact 是候選版本，而 `published_upgrade_survivor_baseline` 會選取已發布的 baseline。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常用 profile：
  - `smoke`：安裝/channel/agent、Gateway 網路與設定重新載入 lanes
  - `package`：artifact 原生 package/update/Plugin lanes，不包含 OpenWebUI 或 live ClawHub
  - `product`：package profile 加上 MCP channels、cron/subagent cleanup、OpenAI web search 與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發布路徑 chunks
  - `custom`：用於聚焦重新執行的精確 `docker_lanes` 選取
- 當你只需要發布候選版本的一般完整 CI 涵蓋時，請直接執行手動 `CI` workflow。手動 CI 派發會略過 changed scoping，並強制執行 Linux Node shards、bundled-Plugin shards、channel contracts、Node 22 相容性、`check`、`check-additional`、build smoke、docs checks、Python Skills、Windows、macOS、Android 與 Control UI i18n lanes。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發布遙測時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver 執行 QA-lab，並驗證匯出的 trace span 名稱、有界屬性，以及內容/識別碼遮蔽，且不需要 Opik、Langfuse 或其他外部 collector。
- 每次標記發布前執行 `pnpm release:check`
- 標籤存在後，執行 `OpenClaw Release Publish` 以進行會變更狀態的發布序列。從 `release/YYYY.M.D` 派發它（或在發布 main 可到達標籤時從 `main` 派發），傳入發布標籤與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin 發布範圍 `all-publishable`，除非你刻意執行聚焦修復。該 workflow 會序列化 Plugin npm publish、Plugin ClawHub publish 與 OpenClaw npm publish，避免核心 package 在其外部化 Plugins 之前發布。
- Release checks 現在在個別的手動 workflow 中執行：`OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發布核准前執行 QA Lab mock parity lane，加上快速 live Matrix profile 與 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential leases。當你想並行取得完整 Matrix transport、media 與 E2EE inventory 時，請使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- 跨 OS 安裝與升級 runtime 驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，它們會直接呼叫可重用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這項拆分是刻意設計：保持真實 npm 發布路徑短、可預測且聚焦於 artifact，同時讓較慢的 live checks 留在自己的 lane 中，避免拖慢或阻擋發布
- 帶有 secret 的 release checks 應透過 `Full Release Validation` 或從 `main`/release workflow ref 派發，讓 workflow 邏輯與 secrets 維持受控
- `OpenClaw Release Checks` 接受分支、標籤或完整 commit SHA，只要解析出的 commit 可從 OpenClaw 分支或發布標籤到達即可
- `OpenClaw NPM Release` 的 validation-only preflight 也接受目前完整 40 字元的 workflow-branch commit SHA，不需要已推送的標籤
- 該 SHA 路徑僅供驗證，不能提升為真實發布
- 在 SHA 模式中，workflow 只會為 package metadata check 合成 `v<package.json version>`；真實發布仍需要真正的發布標籤
- 兩個 workflow 都讓真實 publish 與 promotion 路徑在 GitHub-hosted runners 上執行，而不變更狀態的驗證路徑可以使用較大的 Blacksmith Linux runners
- 該 workflow 會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並搭配 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets
- npm release preflight 不再等待個別的 release checks lane
- 在核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或對應的 beta/correction 標籤）
- npm publish 後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或對應的 beta/correction 版本），在全新的 temp prefix 中驗證已發布 registry 安裝路徑
- beta publish 後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共用租借 Telegram credential pool，針對已發布 npm package 驗證已安裝 package 的 onboarding、Telegram 設定與真實 Telegram E2E。本機 maintainer 一次性執行可以省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- 若要從 maintainer 機器執行完整的 post-publish beta smoke，請使用 `pnpm release:beta-smoke -- --beta betaN`。此 helper 會執行 Parallels npm update/fresh-target 驗證、派發 `NPM Telegram Beta E2E`、輪詢精確 workflow run、下載 artifact，並列印 Telegram report。
- Maintainers 可透過手動 `NPM Telegram Beta E2E` workflow，從 GitHub Actions 執行相同的 post-publish 檢查。它刻意設為僅手動執行，不會在每次 merge 時執行。
- Maintainer release automation 現在使用 preflight-then-promote：
  - 真實 npm publish 必須通過成功的 npm `preflight_run_id`
  - 真實 npm publish 必須從與成功 preflight run 相同的 `main` 或 `release/YYYY.M.D` 分支派發
  - stable npm releases 預設為 `beta`
  - stable npm publish 可透過 workflow input 明確指定 `latest`
  - token-based npm dist-tag 變更現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，這是基於安全性考量，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而 public repo 保持 OIDC-only publish
  - public `macOS Release` 僅供驗證；當標籤只存在於 release branch，但 workflow 從 `main` 派發時，設定 `public_release_branch=release/YYYY.M.D`
  - 真實 private mac publish 必須通過成功的 private mac `preflight_run_id` 與 `validate_run_id`
  - 真實 publish 路徑會提升已準備好的 artifact，而不是再次重建它們
- 對於 `YYYY.M.D-N` 這類 stable correction releases，post-publish verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同 temp-prefix 升級路徑，避免 release corrections 靜默地讓較舊的全域安裝停留在基礎 stable payload
- npm release preflight 會 fail closed，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，這樣我們才不會再次出貨空的瀏覽器 dashboard
- Post-publish verification 也會檢查已發布 Plugin 進入點與 package metadata 是否存在於已安裝的 registry layout 中。若某次發布缺少 Plugin runtime payloads，postpublish verifier 會失敗，且不能提升為 `latest`。
- `pnpm test:install:smoke` 也會在 candidate update tarball 上強制執行 npm pack `unpackedSize` 預算，因此 installer e2e 能在 release publish 路徑前捕捉意外的 pack 膨脹
- 如果發布工作觸及 CI planning、extension timing manifests 或 extension test matrices，請在核准前重新產生並審閱 planner-owned `plugin-prerelease-extension-shard` matrix outputs，來源為 `.github/workflows/plugin-prerelease.yml`，讓 release notes 不會描述過時的 CI layout
- Stable macOS release readiness 也包含 updater surfaces：
  - GitHub release 最終必須包含封裝好的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - `main` 上的 `appcast.xml` 必須在發布後指向新的 stable zip
  - 封裝好的 app 必須保留 non-debug bundle id、非空 Sparkle feed URL，以及等於或高於該 release version 正規 Sparkle build floor 的 `CFBundleVersion`

## 發布測試盒

`Full Release Validation` 是操作者從單一進入點啟動所有發布前測試的方式。若要在快速移動分支上取得 pinned commit proof，請使用 helper，讓每個 child workflow 都從固定於目標 SHA 的暫時分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

該 helper 會推送 `release-ci/<sha>-...`，從該分支派發 `Full Release Validation` 並帶入 `ref=<sha>`，驗證每個 child workflow 的 `headSha` 都符合目標，然後刪除暫時分支。這可避免意外證明了較新的 `main` child run。

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

工作流程會解析目標 ref，以 `target_ref=<release-ref>` 觸發手動 `CI`，觸發 `OpenClaw Release Checks`，為面向套件的檢查準備父層 `release-package-under-test` artifact，並在 `release_profile=full` 且 `rerun_group=all` 時，或設定了 `npm_telegram_package_spec` 時，觸發獨立的套件 Telegram E2E。接著 `OpenClaw Release
Checks` 會展開安裝冒煙測試、跨作業系統發布檢查、啟用 soak 時的 live/E2E Docker 發布路徑涵蓋、含 Telegram 套件 QA 的 Package Acceptance、QA Lab parity、live Matrix，以及 live Telegram。完整執行只有在 `Full Release Validation` 摘要顯示 `normal_ci` 和 `release_checks` 成功時才可接受。在 full/all 模式中，`npm_telegram` 子項也必須成功；在 full/all 之外，除非提供了已發布的 `npm_telegram_package_spec`，否則會略過。最終驗證器摘要會包含每個子執行的最慢工作表格，讓發布管理者不必下載日誌即可查看目前的關鍵路徑。
完整階段矩陣、確切工作流程工作名稱、stable 與 full profile 差異、artifact，以及聚焦重新執行控制代碼，請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)。
子工作流程會從執行 `Full Release
Validation` 的可信任 ref 觸發，通常是 `--ref main`，即使目標 `ref` 指向較舊的發布分支或標籤也是如此。沒有單獨的 Full Release Validation workflow-ref 輸入；請透過選擇工作流程執行 ref 來選擇可信任的 harness。不要在移動中的 `main` 上使用 `--ref main -f ref=<sha>` 作為精確 commit 證明；原始 commit SHA 不能作為 workflow dispatch ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立固定的臨時分支。

使用 `release_profile` 選擇 live/provider 廣度：

- `minimum`：最快的發布關鍵 OpenAI/core live 與 Docker 路徑
- `stable`：minimum 加上用於發布核准的穩定 provider/backend 涵蓋
- `full`：stable 加上廣泛的 advisory provider/media 涵蓋

當發布阻斷 lane 已綠燈，且你想在升版前執行詳盡的 live/E2E、Docker 發布路徑，以及 all-since-2026.4.23 upgrade-survivor 掃描時，請搭配 `stable` 使用 `run_release_soak=true`。`full` 會隱含 `run_release_soak=true`。

`OpenClaw Release Checks` 會使用可信任的工作流程 ref，將目標 ref 解析一次為 `release-package-under-test`，並在 soak 執行時於跨作業系統、Package Acceptance，以及發布路徑 Docker 檢查中重用該 artifact。這能讓所有面向套件的 box 使用相同 bytes，並避免重複建置套件。跨作業系統 OpenAI 安裝冒煙測試會在 repo/org 變數已設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此 lane 是在證明套件安裝、onboarding、gateway 啟動，以及一次 live agent 回合，而不是針對最慢的預設模型進行 benchmark。更廣泛的 live provider 矩陣仍是模型特定涵蓋的所在。

根據發布階段使用這些變體：

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

不要在聚焦修正後第一次重新執行時使用完整 umbrella。如果某個 box 失敗，請使用失敗的子工作流程、工作、Docker lane、套件 profile、模型 provider，或 QA lane 作為下一次證明。只有在修正變更了共用發布 orchestration，或讓先前的全 box 證據過期時，才再次執行完整 umbrella。umbrella 的最終驗證器會重新檢查記錄的子工作流程執行 ID，因此在子工作流程成功重新執行後，只需重新執行失敗的父工作 `Verify full validation`。

若要進行有界恢復，請將 `rerun_group` 傳給 umbrella。`all` 是真正的 release-candidate 執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行僅發布用 Plugin 子項，`release-checks` 會執行每個發布 box，而較窄的發布群組為 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。聚焦的 `npm-telegram` 重新執行需要 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 執行會使用 release-checks 套件 artifact。聚焦的跨作業系統重新執行可加入 `cross_os_suite_filter=windows/packaged-upgrade` 或其他作業系統/套件篩選器。QA release-check 失敗屬於 advisory；僅 QA 失敗不會阻斷發布驗證。

### Vitest

Vitest box 是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍界定，並強制對 release candidate 執行一般測試圖：Linux Node shard、bundled-plugin shard、channel contract、Node 22 相容性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android，以及 Control UI i18n。

使用此 box 回答「原始碼樹是否通過完整的一般測試套件？」它與發布路徑產品驗證不同。需要保留的證據：

- 顯示已觸發 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 執行在確切目標 SHA 上為綠燈
- 調查回歸時的失敗或緩慢 shard 名稱，來自 CI 工作
- 需要效能分析時的 Vitest timing artifact，例如 `.artifacts/vitest-shard-timings.json`

只有在發布需要確定性的一般 CI，但不需要 Docker、QA Lab、live、跨作業系統或套件 box 時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box 位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml` 以及 release-mode `install-smoke` 工作流程執行。它會透過 packaged Docker 環境驗證 release candidate，而不只是原始碼層級測試。

發布 Docker 涵蓋包含：

- 啟用緩慢 Bun global install smoke 的完整安裝冒煙測試
- 依目標 SHA 準備/重用根 Dockerfile smoke image，並將 QR、root/gateway，以及 installer/Bun smoke 工作作為獨立 install-smoke shard 執行
- repository E2E lane
- 發布路徑 Docker chunk：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 要求時，在 `plugins-runtime-services` chunk 內的 OpenWebUI 涵蓋
- 分割的 bundled Plugin 安裝/解除安裝 lane
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-23`
- 當發布檢查包含 live suite 時的 live/E2E provider suite 與 Docker live model 涵蓋

重新執行前請先使用 Docker artifact。發布路徑 scheduler 會上傳 `.artifacts/docker-tests/`，其中含 lane 日誌、`summary.json`、`failures.json`、階段 timing、scheduler plan JSON，以及重新執行命令。若要聚焦恢復，請在可重用 live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有發布 chunk。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker image 輸入，因此失敗的 lane 可以重用相同 tarball 和 GHCR image。

### QA Lab

QA Lab box 也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為與 channel 層級的發布 gate，獨立於 Vitest 和 Docker 套件機制。

發布 QA Lab 涵蓋包含：

- 使用 agentic parity pack，將 OpenAI candidate lane 與 Opus 4.6 baseline 比較的 mock parity lane
- 使用 `qa-live-shared` 環境的快速 live Matrix QA profile
- 使用 Convex CI credential lease 的 live Telegram QA lane
- 當發布 telemetry 需要明確本機證明時的 `pnpm qa:otel:smoke`

使用此 box 回答「發布是否在 QA 情境和 live channel flow 中正確運作？」核准發布時，請保留 parity、Matrix 和 Telegram lane 的 artifact URL。完整 Matrix 涵蓋仍可作為手動 sharded QA-Lab 執行使用，而非預設的發布關鍵 lane。

### 套件

套件 box 是可安裝產品 gate。它由 `Package Acceptance` 和 resolver `scripts/resolve-openclaw-package-candidate.mjs` 支援。resolver 會將 candidate 正規化為 Docker E2E 使用的 `package-under-test` tarball，驗證套件 inventory，記錄套件版本與 SHA-256，並讓工作流程 harness ref 與套件來源 ref 分離。

支援的 candidate 來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發布版本
- `source=ref`：以所選 `workflow_ref` harness 打包可信任的 `package_ref` 分支、標籤或完整 commit SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會以 `source=artifact`、已準備的發布套件 artifact、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對同一個已解析 tarball 保持 migration、update、stale Plugin dependency cleanup、offline Plugin fixture、Plugin update，以及 Telegram 套件 QA。阻斷性發布檢查會使用預設的最新已發布套件 baseline；`run_release_soak=true` 或 `release_profile=full` 會擴展到從 `2026.4.23` 到 `latest` 的每個穩定 npm 已發布 baseline，再加上已回報問題 fixture。對已出貨 candidate 使用 `source=npm` 的 Package Acceptance；或在發布前，對 SHA 支援的本機 npm tarball 使用 `source=ref`/`source=artifact`。它是 GitHub 原生替代方案，用來取代過去大多數需要 Parallels 的 package/update 涵蓋。跨作業系統發布檢查對於作業系統特定 onboarding、installer 和 platform 行為仍然重要，但 package/update 產品驗證應優先使用 Package Acceptance。

update 和 Plugin 驗證的標準檢查清單是[測試 update 和 Plugin](/zh-TW/help/testing-updates-plugins)。決定哪個本機、Docker、Package Acceptance 或 release-check lane 能證明 Plugin 安裝/update、doctor cleanup，或已發布套件 migration 變更時，請使用它。從每個穩定 `2026.4.23+` 套件進行的詳盡已發布 update migration 是單獨的手動 `Update Migration` 工作流程，不屬於 Full Release CI。

Legacy package-acceptance 寬容度會刻意設定時間限制。到 `2026.4.25` 為止的套件，可能會針對已發布到 npm 的 metadata 缺口使用相容性路徑：tarball 中缺少 private QA inventory entry、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch file、缺少持久化 `update.channel`、legacy Plugin install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的 config metadata migration。已發布的 `2026.4.26` 套件可能會對已出貨的本機 build metadata stamp file 發出警告。後續套件必須滿足現代套件 contract；相同缺口會使發布驗證失敗。

當發布問題關乎實際可安裝套件時，請使用更廣泛的 Package Acceptance profile：

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

- `smoke`：快速套件安裝/頻道/代理、Gateway 網路，以及設定
  重新載入通道
- `package`：安裝/更新/Plugin 套件合約，不含即時 ClawHub；這是 release-check
  預設值
- `product`：`package` 加上 MCP 頻道、cron/subagent 清理、OpenAI 網頁
  搜尋，以及 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：用於聚焦重新執行的精確 `docker_lanes` 清單

如需套件候選版本的 Telegram 證明，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。工作流程會將解析出的
`package-under-test` tarball 傳入 Telegram 通道；獨立的
Telegram 工作流程仍接受已發布的 npm 規格，用於發布後檢查。

## 發布自動化

`OpenClaw Release Publish` 是一般的可變更發布進入點。它會依照發布所需的順序
協調 trusted-publisher 工作流程：

1. 簽出發布標籤並解析其 commit SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 觸及。
3. 執行 `pnpm plugins:sync:check`。
4. 以 `publish_scope=all-publishable` 和
   `ref=<release-sha>` 派送 `Plugin NPM Release`。
5. 以相同的範圍和 SHA 派送 `Plugin ClawHub Release`。
6. 以發布標籤、npm dist-tag，以及
   已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。

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

直接將穩定版提升到 `latest` 必須明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

僅在聚焦修復或重新發布工作時，才使用較底層的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流程。若要修復選定 Plugin，請將
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`；或在不得發布 OpenClaw 套件時，直接派送子工作流程。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作員控制的輸入：

- `tag`：必要的發布標籤，例如 `v2026.4.2`、`v2026.4.2-1`，或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，它也可以是目前
  完整 40 字元的工作流程分支 commit SHA，用於僅驗證的 preflight
- `preflight_only`：`true` 表示僅驗證/建置/打包，`false` 表示
  真正的發布路徑
- `preflight_run_id`：真正發布路徑必填，讓工作流程重用
  成功 preflight 執行中準備好的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受以下由操作員控制的輸入：

- `tag`：必要的發布標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight 執行 id；
  當 `publish_openclaw_npm=true` 時必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；僅在
  聚焦修復工作時使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，使用逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；僅在將此
  工作流程作為僅 Plugin 修復協調器時設為 `false`

`OpenClaw Release Checks` 接受以下由操作員控制的輸入：

- `ref`：要驗證的分支、標籤，或完整 commit SHA。帶有秘密的檢查
  需要解析後的 commit 可從 OpenClaw 分支或
  發布標籤觸及。
- `run_release_soak`：在穩定版/預設發布檢查中選擇執行完整的即時/E2E、Docker 發布路徑，以及
  all-since upgrade-survivor soak。它會被
  `release_profile=full` 強制開啟。

規則：

- 穩定版和修正版標籤可發布到 `beta` 或 `latest`
- Beta prerelease 標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在
  `preflight_only=true` 時才允許輸入完整 commit SHA
- `OpenClaw Release Checks` 和 `Full Release Validation` 永遠
  僅用於驗證
- 真正的發布路徑必須使用 preflight 期間所用的相同 `npm_dist_tag`；
  工作流程會在發布前驗證該中繼資料仍然一致

## 穩定版 npm 發布順序

切出穩定版 npm 發布時：

1. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在之前，你可以使用目前完整的工作流程分支 commit
     SHA，對 preflight 工作流程進行僅驗證的 dry run
2. 一般 beta-first 流程請選擇 `npm_dist_tag=beta`；只有在你刻意想要直接發布穩定版時
   才選擇 `latest`
3. 當你想要從單一手動工作流程取得一般 CI 加上即時 prompt cache、Docker、QA Lab、
   Matrix 和 Telegram 覆蓋時，請在發布分支、發布標籤，或完整
   commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要確定性的正常測試圖，請改為在發布 ref 上執行
   手動 `CI` 工作流程
5. 儲存成功的 `preflight_run_id`
6. 以相同的 `tag`、相同的 `npm_dist_tag`，以及已儲存的 `preflight_run_id`
   執行 `OpenClaw Release Publish`；它會先將外部化的 Plugin 發布到 npm
   和 ClawHub，再提升 OpenClaw npm 套件
7. 如果發布落在 `beta`，請使用私有的
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流程，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發布是刻意直接發布到 `latest`，且 `beta`
   應立即跟隨相同的穩定版建置，請使用同一個私有
   工作流程，將兩個 dist-tag 都指向該穩定版本，或讓其排程的
   自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中是基於安全性，因為它仍然
需要 `NPM_TOKEN`，而公開 repo 則維持僅使用 OIDC 發布。

這會讓直接發布路徑和 beta-first 提升路徑都
有文件記錄，且操作員可見。

如果維護者必須回退到本機 npm 驗證，請只在專用 tmux 工作階段內執行任何 1Password
CLI (`op`) 命令。請勿從主要代理 shell 直接呼叫 `op`；將它保留在 tmux 內可讓提示、
警示和 OTP 處理可觀察，並防止重複的主機警示。

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
中的私有發布文件作為實際執行手冊。

## 相關

- [發布頻道](/zh-TW/install/development-channels)
