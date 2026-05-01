---
read_when:
    - 正在尋找公開發布通道定義
    - 執行發布驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證環境、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-01T02:45:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb56568bf860ba9eae47df71c5c1ebefe9eb9ae05ac4706dbb425772ff6cdcaa
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發行通道：

- stable：帶標籤的發行版本，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發行標籤
- dev：`main` 的移動中最新版本

## 版本命名

- 穩定版發行版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定版修正版發行版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發行版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已推廣的穩定版 npm 發行版本
- `beta` 表示目前的 beta 安裝目標
- 穩定版與穩定版修正版發行預設發布到 npm `beta`；發行操作員可以明確指定 `latest`，或稍後推廣已審核的 beta 建置
- 每個穩定版 OpenClaw 發行都會同時交付 npm 套件與 macOS 應用程式；
  beta 發行通常會先驗證並發布 npm/套件路徑，而
  Mac 應用程式的建置/簽署/公證會保留給穩定版，除非明確要求

## 發行節奏

- 發行採 beta 優先
- 只有在最新 beta 驗證完成後才會推出穩定版
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發行版本，
  讓發行驗證與修正不會阻礙 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細的發行程序、核准、憑證與復原備註
  僅限維護者使用

## 發行操作員檢查清單

此檢查清單是發行流程的公開形式。私有憑證、
簽署、公證、dist-tag 復原與緊急回滾細節會保留在
僅限維護者使用的發行執行手冊中。

1. 從目前 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` 的 CI 狀態足以從它建立分支。
2. 使用 `/changelog` 依據真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持項目面向使用者，提交、推送，並在建立分支前再次 rebase/pull。
3. 檢閱
   `src/plugins/compat/registry.ts` 與
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發行相容性記錄。只有在升級路徑仍有涵蓋時才移除過期相容性，
   或記錄為何刻意保留。
4. 從目前 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發行工作。
5. 針對預定標籤更新所有必要的版本位置，然後執行
   本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build` 和 `pnpm release:check`。
6. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，
   可使用完整 40 字元的發行分支 SHA 進行僅驗證的
   預檢。保存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 針對
   發行分支、標籤或完整提交 SHA 啟動所有預發行測試。這是四個大型發行測試箱的唯一手動入口點：
   Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發行分支上修正，並重新執行能證明修正的最小失敗
   檔案、通道、工作流程作業、套件設定檔、Provider 或模型允許清單。
   只有在變更範圍使先前證據失效時，才重新執行完整總括流程。
9. 對於 beta，標記 `vYYYY.M.D-beta.N`，以 npm dist-tag `beta` 發布，然後針對已發布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 套件執行發布後套件驗收。如果已推送或已發布的 beta 需要修正，
   請切出下一個 `-beta.N`；不要刪除或重寫舊的 beta。
10. 對於穩定版，只有在已審核的 beta 或 release candidate 具備
    所需驗證證據後才繼續。穩定版 npm 發布會透過 `preflight_run_id` 重用成功的
    預檢成品；穩定版 macOS 發行準備狀態
    也需要在 `main` 上具備已封裝的 `.zip`、`.dmg`、`.dSYM.zip` 與更新後的
    `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器、需要發布後通道證明時可選的獨立
    已發布 npm Telegram E2E、
    必要時的 dist-tag 推廣、來自完整相符 `CHANGELOG.md` 區段的 GitHub release/prerelease notes，以及發行公告
    步驟。

## 發行預檢

- 在發行預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 門檻之外仍保持涵蓋
- 在發行預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機門檻之外也能維持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發行成品與 Control UI bundle 存在，以供打包驗證步驟使用
- 在核准發行前執行手動 `Full Release Validation` workflow，從單一入口點啟動所有發行前測試盒。它接受分支、標籤或完整 commit SHA，會派發手動 `CI`，並派發 `OpenClaw Release Checks` 以涵蓋安裝 smoke、套件驗收、Docker 發行路徑套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 與 Telegram lanes。只有在套件已發布且也應執行發布後 Telegram E2E 時，才提供 `npm_telegram_package_spec`。當私有證據報告應證明該驗證符合已發布的 npm 套件，但不強制執行 Telegram E2E 時，請提供 `evidence_package_spec`。範例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在發行工作繼續進行時，為套件候選版本取得旁路證明，請執行手動 `Package Acceptance` workflow。對 `openclaw@beta`、`openclaw@latest` 或精確發行版本使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` harness 打包受信任的 `package_ref` 分支/標籤/SHA；使用 `source=url` 處理需要 SHA-256 的 HTTPS tarball；或使用 `source=artifact` 處理由另一個 GitHub Actions run 上傳的 tarball。此 workflow 會將候選版本解析為 `package-under-test`，對該 tarball 重用 Docker E2E 發行排程器，並可用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一 tarball 執行 Telegram QA。範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常見 profile：
  - `smoke`：安裝/channel/agent、Gateway 網路與設定重新載入 lanes
  - `package`：artifact 原生的套件/更新/Plugin lanes，不含 OpenWebUI 或 live ClawHub
  - `product`：package profile 加上 MCP channels、cron/subagent 清理、OpenAI 網頁搜尋與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發行路徑分塊
  - `custom`：用於聚焦重跑的精確 `docker_lanes` 選擇
- 當你只需要發行候選版本的完整一般 CI 涵蓋時，請直接執行手動 `CI` workflow。手動 CI 派發會略過 changed scoping，並強制執行 Linux Node shards、bundled-Plugin shards、channel contracts、Node 22 相容性、`check`、`check-additional`、build smoke、文件檢查、Python skills、Windows、macOS、Android 與 Control UI i18n lanes。範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發行遙測時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver 演練 QA-lab，並驗證匯出的 trace span 名稱、受限屬性，以及內容/識別碼遮蔽，不需要 Opik、Langfuse 或其他外部 collector。
- 每次標記發行前執行 `pnpm release:check`
- 發行檢查現在在獨立的手動 workflow 中執行：`OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在核准發行前執行 QA Lab mock parity gate，加上快速 live Matrix profile 與 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential leases。當你想平行取得完整 Matrix 傳輸、媒體與 E2EE inventory 時，請使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- 跨作業系統安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，兩者會直接呼叫 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這項拆分是刻意設計的：讓真正的 npm 發行路徑保持短小、可決定且以 artifact 為中心，同時讓較慢的 live 檢查留在自己的 lane 中，避免拖慢或阻擋發布
- 帶有 secret 的發行檢查應透過 `Full Release Validation` 派發，或從 `main`/release workflow ref 派發，讓 workflow 邏輯與 secrets 保持受控
- `OpenClaw Release Checks` 接受分支、標籤或完整 commit SHA，只要解析後的 commit 可從 OpenClaw 分支或發行標籤到達
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元的 workflow 分支 commit SHA，不需要已推送標籤
- 該 SHA 路徑僅限驗證，不能升級為真正發布
- 在 SHA 模式中，workflow 只會為套件 metadata 檢查合成 `v<package.json version>`；真正發布仍需要真正的發行標籤
- 兩個 workflow 都會讓真正的發布與推廣路徑保留在 GitHub-hosted runners 上，而非變更性驗證路徑可以使用較大的 Blacksmith Linux runners
- 該 workflow 會使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets 執行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 發行預檢不再等待獨立的發行檢查 lane
- 核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction 標籤）
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction 版本），以在全新的暫存 prefix 中驗證已發布 registry 的安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共用的租用 Telegram credential pool，針對已發布的 npm 套件驗證已安裝套件的 onboarding、Telegram 設定，以及真實 Telegram E2E。本機 maintainer 的一次性作業可以省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- Maintainer 可以透過手動 `NPM Telegram Beta E2E` workflow，在 GitHub Actions 中執行相同的發布後檢查。它刻意設為僅手動執行，不會在每次 merge 時執行。
- Maintainer 發行自動化現在使用 preflight-then-promote：
  - 真正的 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真正的 npm 發布必須從與成功預檢 run 相同的 `main` 或 `release/YYYY.M.D` 分支派發
  - stable npm 發行預設為 `beta`
  - stable npm 發布可透過 workflow input 明確指定 `latest`
  - 基於 token 的 npm dist-tag 變更現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，以提升安全性，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開 repo 保持僅 OIDC 發布
  - 公開 `macOS Release` 僅供驗證；當標籤只存在於發行分支，但 workflow 從 `main` 派發時，請設定 `public_release_branch=release/YYYY.M.D`
  - 真正的私有 mac 發布必須通過成功的私有 mac `preflight_run_id` 與 `validate_run_id`
  - 真正的發布路徑會推廣已準備好的 artifact，而不是再次重建
- 對於像 `YYYY.M.D-N` 這類 stable correction 發行，發布後 verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同暫存 prefix 升級路徑，讓發行修正不會在無聲中讓較舊的全域安裝停留在基礎 stable payload
- npm 發行預檢會 fail closed，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，這樣我們才不會再次發布空的瀏覽器 dashboard
- 發布後驗證也會檢查已發布 registry 安裝是否在 root `dist/*` 佈局下包含非空的 bundled Plugin runtime deps。若發行缺少或帶有空的 bundled Plugin dependency payload，postpublish verifier 會失敗，且不能推廣到 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，因此 installer e2e 會在發行發布路徑前抓到意外的打包膨脹
- 如果發行工作觸及 CI 規劃、extension timing manifests 或 extension test matrices，請在核准前重新產生並檢閱 planner 擁有的 `plugin-prerelease-extension-shard` matrix outputs，來源為 `.github/workflows/plugin-prerelease.yml`，讓發行說明不會描述過時的 CI 佈局
- Stable macOS 發行就緒度也包含 updater surfaces：
  - GitHub release 最終必須包含已打包的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - `appcast.xml` 在 `main` 上必須在發布後指向新的 stable zip
  - 已打包的 app 必須維持非 debug bundle id、非空的 Sparkle feed URL，以及等於或高於該發行版本 canonical Sparkle build floor 的 `CFBundleVersion`

## 發行測試盒

`Full Release Validation` 是 operators 從單一入口點啟動所有發行前測試的方式。從受信任的 `main` workflow ref 執行它，並將發行分支、標籤或完整 commit SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

該 workflow 會解析目標 ref，使用 `target_ref=<release-ref>` 派發手動 `CI`，派發 `OpenClaw Release Checks`，並在設定 `npm_telegram_package_spec` 時選擇性派發獨立的發布後 Telegram E2E。`OpenClaw Release Checks` 接著會展開安裝 smoke、跨作業系統發行檢查、live/E2E Docker 發行路徑涵蓋、含 Telegram 套件 QA 的 Package Acceptance、QA Lab parity、live Matrix 與 live Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci` 與 `release_checks` 成功，且任何選用的 `npm_telegram` child 成功或刻意略過時，完整 run 才可接受。最終 verifier 摘要包含每個 child run 的最慢 job 表格，讓 release manager 不必下載 logs 就能看到目前的關鍵路徑。完整 stage matrix、精確 workflow job 名稱、stable 與 full profile 差異、artifacts 與聚焦重跑 handles，請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)。
Child workflows 會從執行 `Full Release Validation` 的受信任 ref 派發，通常是 `--ref main`，即使目標 `ref` 指向較舊的發行分支或標籤。沒有獨立的 Full Release Validation workflow-ref input；請透過選擇 workflow run ref 來選擇受信任的 harness。

使用 `release_profile` 選擇 live/provider 廣度：

- `minimum`：最快的發行關鍵 OpenAI/core live 與 Docker 路徑
- `stable`：minimum 加上用於發行核准的 stable provider/backend 涵蓋
- `full`：stable 加上廣泛的 advisory provider/media 涵蓋

`OpenClaw Release Checks` 使用受信任的 workflow ref，將目標 ref 解析一次為 `release-package-under-test`，並在發行路徑 Docker 檢查與 Package Acceptance 中重用該 artifact。這讓所有面向套件的 boxes 都使用相同 bytes，並避免重複建置套件。跨作業系統 OpenAI 安裝 smoke 在 repo/org 變數已設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4-mini`，因為此 lane 是在證明套件安裝、onboarding、Gateway 啟動與一次 live agent turn，而不是 benchmark 最慢的預設模型。更廣泛的 live provider matrix 仍然是模型特定涵蓋的所在位置。

請依發行階段使用這些變體：

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要把完整總控流程用作專注修正後的第一次重新執行。如果某個檢查箱失敗，下一次驗證請使用失敗的子工作流程、作業、Docker lane、套件設定檔、模型提供者或 QA lane。只有在修正變更了共用發布編排，或讓先前的全檢查箱證據過期時，才再次執行完整總控流程。總控流程的最終驗證器會重新檢查記錄的子工作流程執行 ID，因此子工作流程成功重新執行後，只需重新執行失敗的 `Verify full validation` 父作業。

若要進行有界復原，請將 `rerun_group` 傳給總控流程。`all` 是真正的發布候選執行，`ci` 只執行一般 CI 子流程，`plugin-prerelease` 只執行僅發布用的 Plugin 子流程，`release-checks` 會執行每個發布檢查箱，而更窄的發布群組是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`，以及在提供獨立套件 Telegram lane 時的 `npm-telegram`。

### Vitest

Vitest 檢查箱是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍限定，並針對發布候選強制執行一般測試圖：Linux Node 分片、 bundled-Plugin 分片、頻道合約、Node 22 相容性、`check`、`check-additional`、建置 smoke、文件檢查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用此檢查箱回答「原始碼樹是否通過完整的一般測試套件？」它不同於發布路徑的產品驗證。需保留的證據：

- `Full Release Validation` 摘要，顯示已派發的 `CI` 執行 URL
- `CI` 在精確目標 SHA 上通過
- 調查迴歸時，來自 CI 作業的失敗或緩慢分片名稱
- 需要效能分析時的 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有在發布需要確定性的一般 CI，但不需要 Docker、QA Lab、live、跨 OS 或套件檢查箱時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 檢查箱位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml` 加上發布模式的 `install-smoke` 工作流程。它會透過封裝後的 Docker 環境驗證發布候選，而不只是原始碼層級測試。

發布 Docker 覆蓋範圍包括：

- 啟用緩慢 Bun 全域安裝 smoke 的完整安裝 smoke
- 依目標 SHA 準備/重用 root Dockerfile smoke 映像，並將 QR、root/Gateway，以及安裝器/Bun smoke 作業作為獨立的 install-smoke 分片執行
- 儲存庫 E2E lane
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`，以及 `bundled-channels-contracts`
- 要求時，`plugins-runtime-services` 區塊內的 OpenWebUI 覆蓋
- 將 bundled-channel 依賴 lane 拆分到 channel-smoke、update-target，以及設定/執行階段合約區塊，而不是一個大型 bundled-channel 作業
- 拆分 bundled Plugin 安裝/解除安裝 lane，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發布檢查包含 live 套件時，包含 live/E2E 提供者套件與 Docker live 模型覆蓋

重新執行前先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含 lane 日誌、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重新執行命令。若要專注復原，請在可重用 live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有發布區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker 映像輸入，因此失敗 lane 可重用相同 tarball 和 GHCR 映像。

### QA Lab

QA Lab 檢查箱也是 `OpenClaw Release Checks` 的一部分。它是代理式行為與頻道層級的發布閘門，獨立於 Vitest 和 Docker 套件機制。

發布 QA Lab 覆蓋範圍包括：

- 使用代理式 parity pack，比較 OpenAI 候選 lane 與 Opus 4.6 基準的 mock parity gate
- 使用 `qa-live-shared` 環境的快速 live Matrix QA 設定檔
- 使用 Convex CI 憑證租約的 live Telegram QA lane
- 當發布遙測需要明確本機證據時，執行 `pnpm qa:otel:smoke`

使用此檢查箱回答「此發布在 QA 情境和 live 頻道流程中是否行為正確？」核准發布時，請保留 parity、Matrix 和 Telegram lane 的成品 URL。完整 Matrix 覆蓋仍可作為手動分片 QA-Lab 執行使用，而不是預設的發布關鍵 lane。

### 套件

套件檢查箱是可安裝產品的閘門。它由 `Package Acceptance` 與解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選正規化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並讓工作流程 harness ref 與套件原始碼 ref 保持分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本
- `source=ref`：使用選定的 `workflow_ref` harness 封裝受信任的 `package_ref` 分支、標籤或完整 commit SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會以 `source=ref`、`package_ref=<release-ref>`、`suite_profile=custom`、`docker_lanes=bundled-channel-deps-compat plugins-offline`，以及 `telegram_mode=mock-openai` 執行 Package Acceptance。發布路徑 Docker 區塊會涵蓋重疊的安裝、更新與 Plugin 更新 lane；Package Acceptance 會保留成品原生 bundled-channel 相容性、離線 Plugin 夾具，以及針對同一個已解析 tarball 的 Telegram 套件 QA。它是先前大多需要 Parallels 的套件/更新覆蓋之 GitHub 原生替代方案。跨 OS 發布檢查對於 OS 特定的 onboarding、安裝器與平台行為仍然重要，但套件/更新產品驗證應優先使用 Package Acceptance。

舊版 package-acceptance 寬容性刻意有時間限制。到 `2026.4.25` 為止的套件，可針對已發布到 npm 的中繼資料缺口使用相容路徑：tarball 中缺少私有 QA 清單項目、缺少 `gateway install --wrapper`、tarball 衍生 git 夾具中缺少 patch 檔案、缺少已保存的 `update.channel`、舊版 Plugin 安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件可針對已出貨的本機建置中繼資料戳記檔案發出警告。較新的套件必須滿足現代套件合約；那些相同缺口會導致發布驗證失敗。

當發布問題與實際可安裝套件有關時，使用更廣的 Package Acceptance 設定檔：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常見套件設定檔：

- `smoke`：快速套件安裝/頻道/代理、Gateway 網路，以及設定重新載入 lane
- `package`：不含 live ClawHub 的安裝/更新/Plugin 套件合約；這是 release-check 預設值
- `product`：`package` 加上 MCP 頻道、cron/subagent 清理、OpenAI 網頁搜尋，以及 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：用於專注重新執行的精確 `docker_lanes` 清單

若要進行套件候選 Telegram 驗證，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。工作流程會將已解析的 `package-under-test` tarball 傳入 Telegram lane；獨立 Telegram 工作流程仍接受已發布的 npm 規格用於發布後檢查。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作者控制的輸入：

- `tag`：必要發布標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整 40 字元工作流程分支 commit SHA，用於僅驗證的預檢
- `preflight_only`：`true` 代表只進行驗證/建置/套件，`false` 代表真正發布路徑
- `preflight_run_id`：真正發布路徑上必填，讓工作流程重用成功預檢執行中準備的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Checks` 接受以下由操作者控制的輸入：

- `ref`：要驗證的分支、標籤或完整 commit SHA。帶有祕密的檢查要求已解析 commit 必須可從 OpenClaw 分支或發布標籤到達。

規則：

- 穩定版和修正版標籤可發布到 `beta` 或 `latest`
- Beta 預發布標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許完整 commit SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 永遠只用於驗證
- 真正發布路徑必須使用預檢期間使用的相同 `npm_dist_tag`；工作流程會在發布前驗證該中繼資料仍然延續

## 穩定版 npm 發布順序

切穩定版 npm 發布時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在前，你可以使用目前完整工作流程分支 commit SHA，對預檢工作流程進行僅驗證的 dry run
2. 一般 beta-first 流程請選擇 `npm_dist_tag=beta`，只有在你刻意要直接發布穩定版時才選擇 `latest`
3. 當你想從一個手動工作流程取得一般 CI 加上 live prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆蓋時，請在發布分支、發布標籤或完整 commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要確定性的一般測試圖，請改在發布 ref 上執行手動 `CI` 工作流程
5. 保存成功的 `preflight_run_id`
6. 再次執行 `OpenClaw NPM Release`，使用 `preflight_only=false`、相同的 `tag`、相同的 `npm_dist_tag`，以及已保存的 `preflight_run_id`
7. 如果發布落在 `beta`，請使用私有 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 提升到 `latest`
8. 如果發布刻意直接發布到 `latest`，而 `beta` 應立即跟隨相同穩定版建置，請使用同一個私有工作流程，將兩個 dist-tag 都指向該穩定版本，或讓其排程的自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 以確保安全，因為它仍需要 `NPM_TOKEN`，而公開 repo 則維持只使用 OIDC 發布。

這讓直接發布路徑與 beta-first 推廣路徑都保持已文件化，且操作者可見。

如果維護者必須回退到本機 npm 驗證，請只在專用的 tmux 工作階段內執行任何 1Password CLI (`op`) 命令。不要直接從主要代理程式 shell 呼叫 `op`；將其保留在 tmux 內可讓提示、警示和 OTP 處理可觀察，並防止重複的主機警示。

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

維護者會使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私人發布文件作為實際的執行手冊。

## 相關

- [發布通道](/zh-TW/install/development-channels)
