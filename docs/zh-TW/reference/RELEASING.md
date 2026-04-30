---
read_when:
    - 正在尋找公開發行通道定義
    - 執行發行驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布路線、操作員檢查清單、驗證環境、版本命名和節奏
title: 發布政策
x-i18n:
    generated_at: "2026-04-30T03:36:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布通道：

- stable：標記的發布版本，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發布標籤
- dev：`main` 的移動前端

## 版本命名

- 穩定發布版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定修正發布版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發布版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 月份或日期不要補零
- `latest` 表示目前已提升的穩定 npm 發布版本
- `beta` 表示目前的 beta 安裝目標
- 穩定與穩定修正發布版本預設發布到 npm `beta`；發布操作人員可以明確指定 `latest`，或稍後提升已審核的 beta 建置
- 每個穩定 OpenClaw 發布版本都會同時交付 npm 套件與 macOS 應用程式；
  beta 發布版本通常會先驗證並發布 npm/套件路徑，而
  Mac 應用程式建置/簽署/公證則保留給穩定版本，除非明確要求

## 發布節奏

- 發布採 beta 優先
- 穩定版本只會在最新 beta 通過驗證後跟進
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發布版本，
  讓發布驗證與修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切出下一個 `-beta.N` 標籤，
  而不是刪除或重新建立舊的 beta 標籤
- 詳細發布程序、核准、憑證與復原注意事項僅限維護者使用

## 發布操作人員檢查清單

此檢查清單是發布流程的公開形式。私人憑證、
簽署、公證、dist-tag 復原與緊急復原詳細資訊會保留在
僅限維護者使用的發布操作手冊中。

1. 從目前 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` CI 的綠燈程度足以從中建立分支。
2. 使用 `/changelog` 依據真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持項目面向使用者，提交、推送，並在建立分支前再 rebase/pull 一次。
3. 檢閱
   `src/plugins/compat/registry.ts` 與
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍受涵蓋時才移除已過期的相容性，
   或記錄為何有意繼續保留。
4. 從目前 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發布工作。
5. 針對預定標籤更新所有必要版本位置，然後執行本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，
   可使用完整 40 字元的發布分支 SHA 進行僅驗證的預檢。儲存成功的 `preflight_run_id`。
7. 對發布分支、標籤或完整提交 SHA 啟動 `Full Release Validation`，執行所有發布前測試。這是四個大型發布測試盒的唯一手動入口點：Vitest、Docker、QA Lab 與 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行可證明修正的最小失敗檔案、通道、工作流程作業、套件設定檔、Provider 或模型允許清單。只有在變更範圍使既有證據失效時，才重新執行完整總括流程。
9. 對 beta，標記 `vYYYY.M.D-beta.N`，使用 npm dist-tag `beta` 發布，然後針對已發布的 `openclaw@YYYY.M.D-beta.N`
   或 `openclaw@beta` 套件執行發布後套件驗收。如果已推送或已發布的 beta 需要修正，
   請切出下一個 `-beta.N`；不要刪除或重寫舊的 beta。
10. 對穩定版本，只有在已審核的 beta 或候選發布版本具備所需驗證證據後才繼續。
    穩定 npm 發布會透過 `preflight_run_id` 重用成功的預檢成品；穩定 macOS 發布就緒狀態
    也需要 `main` 上已有封裝的 `.zip`、`.dmg`、`.dSYM.zip` 與更新後的
    `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器；在需要發布後通道證據時，可選擇執行獨立的
    已發布 npm Telegram E2E；視需要進行 dist-tag 提升；依據完整相符的 `CHANGELOG.md` 區段撰寫 GitHub 發布/預發布說明；並執行發布公告
    步驟。

## 發布預檢

- 在 release preflight 前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` gate 外仍受到涵蓋
- 在 release preflight 前執行 `pnpm check:architecture`，讓較廣泛的 import cycle 與架構邊界檢查在較快的本機 gate 外維持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發行成品與控制 UI bundle 存在，可供 pack 驗證步驟使用
- 在 release 核准前執行手動 `Full Release Validation` workflow，以從單一進入點啟動所有 pre-release test boxes。它接受 branch、tag 或完整 commit SHA，會 dispatch 手動 `CI`，並 dispatch `OpenClaw Release Checks`，涵蓋 install smoke、package acceptance、Docker release-path suites、live/E2E、OpenWebUI、QA Lab parity、Matrix 與 Telegram lanes。只有在 package 已發布且 post-publish Telegram E2E 也應執行時，才提供 `npm_telegram_package_spec`。當 private evidence report 應證明該驗證符合已發布的 npm package，但不強制執行 Telegram E2E 時，提供 `evidence_package_spec`。
  範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你想在 release 工作繼續時，為 package candidate 取得 side-channel proof，請執行手動 `Package Acceptance` workflow。針對 `openclaw@beta`、`openclaw@latest` 或精確 release version 使用 `source=npm`；使用 `source=ref` 搭配目前 `workflow_ref` harness 來 pack 受信任的 `package_ref` branch/tag/SHA；針對需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或針對由另一個 GitHub Actions run 上傳的 tarball 使用 `source=artifact`。workflow 會將 candidate 解析為 `package-under-test`，針對該 tarball 重複使用 Docker E2E release scheduler，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一個 tarball 執行 Telegram QA。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  常見 profiles：
  - `smoke`：install/channel/agent、gateway network 與 config reload lanes
  - `package`：artifact-native package/update/plugin lanes，不含 OpenWebUI 或 live ClawHub
  - `product`：package profile 加上 MCP channels、cron/subagent cleanup、OpenAI web search 與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker release-path chunks
  - `custom`：針對聚焦 rerun 的精確 `docker_lanes` 選擇
- 當你只需要 release candidate 的完整一般 CI 覆蓋時，直接執行手動 `CI` workflow。手動 CI dispatch 會繞過 changed scoping，並強制執行 Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android 與控制 UI i18n lanes。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證 release telemetry 時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver exercise QA-lab，並驗證匯出的 trace span names、bounded attributes 與 content/identifier redaction，不需要 Opik、Langfuse 或其他外部 collector。
- 每次 tagged release 前執行 `pnpm release:check`
- Release checks 現在會在獨立的手動 workflow 中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在 release approval 前執行 QA Lab mock parity gate，加上快速 live Matrix profile 與 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential leases。當你想平行取得完整 Matrix transport、media 與 E2EE inventory 時，使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- Cross-OS install 與 upgrade runtime validation 是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，它們會直接呼叫 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這種拆分是有意的：保持真正的 npm release path 短小、deterministic 且專注於 artifact，同時讓較慢的 live checks 留在自己的 lane 中，避免拖慢或阻塞 publish
- 帶有 secret 的 release checks 應透過 `Full Release Validation` dispatch，或從 `main`/release workflow ref dispatch，讓 workflow logic 與 secrets 維持受控
- 只要 resolved commit 可從 OpenClaw branch 或 release tag 抵達，`OpenClaw Release Checks` 就接受 branch、tag 或完整 commit SHA
- `OpenClaw NPM Release` validation-only preflight 也接受目前完整 40 字元 workflow-branch commit SHA，不需要 pushed tag
- 該 SHA path 只供 validation 使用，不能提升為真正 publish
- 在 SHA mode 中，workflow 只會為 package metadata check 合成 `v<package.json version>`；真正 publish 仍需要真正的 release tag
- 兩個 workflow 都讓真正 publish 與 promotion path 留在 GitHub-hosted runners 上，而 non-mutating validation path 可使用較大的 Blacksmith Linux runners
- 該 workflow 會使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets 執行 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm release preflight 不再等待獨立的 release checks lane
- 核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或對應的 beta/correction tag）
- npm publish 後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或對應的 beta/correction version），在全新 temp prefix 中驗證已發布的 registry install path
- beta publish 後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用 shared leased Telegram credential pool，針對已發布的 npm package 驗證 installed-package onboarding、Telegram setup 與真實 Telegram E2E。本機 maintainer 一次性操作可省略 Convex vars，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- Maintainers 可透過手動 `NPM Telegram Beta E2E` workflow，從 GitHub Actions 執行相同的 post-publish check。它刻意只允許手動執行，不會在每次 merge 時執行。
- Maintainer release automation 現在使用 preflight-then-promote：
  - 真正的 npm publish 必須通過成功的 npm `preflight_run_id`
  - 真正的 npm publish 必須從與成功 preflight run 相同的 `main` 或 `release/YYYY.M.D` branch dispatch
  - stable npm releases 預設為 `beta`
  - stable npm publish 可透過 workflow input 明確指定 `latest`
  - token-based npm dist-tag mutation 現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，以提升安全性，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而 public repo 保持 OIDC-only publish
  - public `macOS Release` 僅供 validation
  - 真正的 private mac publish 必須通過成功的 private mac `preflight_run_id` 與 `validate_run_id`
  - 真正的 publish paths 會 promote prepared artifacts，而不是再次 rebuild 它們
- 對於 `YYYY.M.D-N` 這類 stable correction releases，post-publish verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同 temp-prefix upgrade path，讓 release corrections 不會悄悄讓較舊的 global installs 停留在 base stable payload
- npm release preflight 會 fail closed，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，這樣我們才不會再次發布空的瀏覽器 dashboard
- Post-publish verification 也會檢查已發布的 registry install 是否在 root `dist/*` layout 下包含非空的 bundled plugin runtime deps。若 release 發布時缺少或空的 bundled plugin dependency payloads，postpublish verifier 會失敗，且不能 promote 至 `latest`。
- `pnpm test:install:smoke` 也會對 candidate update tarball 強制執行 npm pack `unpackedSize` budget，因此 installer e2e 會在 release publish path 前捕捉意外的 pack bloat
- 如果 release 工作碰到 CI planning、extension timing manifests 或 extension test matrices，請在 approval 前重新生成並審查 planner-owned 的 `plugin-prerelease-extension-shard` matrix outputs，來源為 `.github/workflows/plugin-prerelease.yml`，讓 release notes 不會描述過期的 CI layout
- Stable macOS release readiness 也包含 updater surfaces：
  - GitHub release 最終必須包含 packaged `.zip`、`.dmg` 與 `.dSYM.zip`
  - publish 後，`main` 上的 `appcast.xml` 必須指向新的 stable zip
  - packaged app 必須維持 non-debug bundle id、非空 Sparkle feed URL，以及高於或等於該 release version canonical Sparkle build floor 的 `CFBundleVersion`

## Release test boxes

`Full Release Validation` 是 operators 從單一進入點啟動所有 pre-release tests 的方式。請從受信任的 `main` workflow ref 執行，並將 release branch、tag 或完整 commit SHA 作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

workflow 會解析 target ref，dispatch 帶有 `target_ref=<release-ref>` 的手動 `CI`，dispatch `OpenClaw Release Checks`，並在設定 `npm_telegram_package_spec` 時，選擇性 dispatch standalone post-publish Telegram E2E。`OpenClaw Release Checks` 接著會展開 install smoke、cross-OS release checks、live/E2E Docker release-path coverage、含 Telegram package QA 的 Package Acceptance、QA Lab parity、live Matrix 與 live Telegram。只有當 `Full Release Validation` summary 顯示 `normal_ci` 與 `release_checks` 成功，且任何選用的 `npm_telegram` child 成功或刻意略過時，full run 才可接受。最終 verifier summary 會包含每個 child run 的 slowest-job tables，讓 release manager 不必下載 logs 就能看見目前的 critical path。
Child workflows 會從執行 `Full Release Validation` 的受信任 ref dispatch，通常是 `--ref main`，即使 target `ref` 指向較舊的 release branch 或 tag。沒有獨立的 Full Release Validation workflow-ref input；請透過選擇 workflow run ref 來選擇受信任的 harness。

使用 `release_profile` 選擇 live/provider breadth：

- `minimum`：最快的 release-critical OpenAI/core live 與 Docker path
- `stable`：minimum 加上 release approval 所需的 stable provider/backend coverage
- `full`：stable 加上廣泛 advisory provider/media coverage

`OpenClaw Release Checks` 使用受信任 workflow ref，將 target ref 解析一次為 `release-package-under-test`，並在 release-path Docker checks 與 Package Acceptance 中重複使用該 artifact。這會讓所有 package-facing boxes 使用相同 bytes，並避免重複 package builds。
當 repo/org variable 已設定時，cross-OS OpenAI install smoke 會使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4-mini`，因為此 lane 是在證明 package install、onboarding、gateway startup 與一次 live agent turn，而不是 benchmark 最慢的 default model。較廣泛的 live provider matrix 仍是 model-specific coverage 的位置。

依 release stage 使用這些 variants：

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

不要在專注修正後的第一次重新執行時使用完整總括流程。如果其中一個方塊失敗，請使用失敗的子工作流程、作業、Docker 通道、套件設定檔、模型提供者或 QA 通道作為下一個驗證。只有當修正變更了共用發布編排，或使先前的全方塊證據過期時，才再次執行完整總括流程。總括流程的最終驗證器會重新檢查已記錄的子工作流程執行 ID，因此在子工作流程成功重新執行後，只需重新執行失敗的 `Verify full validation` 父作業。

若要進行有界復原，請將 `rerun_group` 傳給總括流程。`all` 是實際的發布候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行僅限發布的 Plugin 子項，`release-checks` 會執行每個發布方塊，而較窄的發布群組則是 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`，以及在提供獨立套件 Telegram 通道時使用的 `npm-telegram`。

### Vitest

Vitest 方塊是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍判定，並強制對發布候選執行一般測試圖：Linux Node 分片、內建 Plugin 分片、頻道合約、Node 22 相容性、`check`、`check-additional`、建置冒煙、文件檢查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。

使用此方塊回答「原始碼樹是否通過完整的一般測試套件？」它不等同於發布路徑產品驗證。要保留的證據：

- 顯示已分派 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 在確切目標 SHA 上通過
- 調查迴歸時，來自 CI 作業的失敗或緩慢分片名稱
- 當執行需要效能分析時，Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發布需要決定性的一般 CI，但不需要 Docker、QA Lab、即時、跨 OS 或套件方塊時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 方塊位於 `OpenClaw Release Checks` 中，透過 `openclaw-live-and-e2e-checks-reusable.yml`，再加上發布模式的 `install-smoke` 工作流程。它會透過封裝後的 Docker 環境驗證發布候選，而不只是原始碼層級測試。

發布 Docker 覆蓋範圍包含：

- 啟用緩慢 Bun 全域安裝冒煙的完整安裝冒煙
- 依目標 SHA 準備／重用根 Dockerfile 冒煙映像，並以個別 install-smoke 分片執行 QR、root/gateway，以及 installer/Bun 冒煙作業
- 儲存庫 E2E 通道
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`，以及 `bundled-channels-contracts`
- 請求時，在 `plugins-runtime-services` 區塊內的 OpenWebUI 覆蓋範圍
- 將內建頻道相依性通道拆分為 channel-smoke、update-target，以及 setup/runtime 合約區塊，而不是一個大型內建頻道作業
- 拆分內建 Plugin 安裝／解除安裝通道 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發布檢查包含即時套件時的即時／E2E 提供者套件與 Docker 即時模型覆蓋範圍

重新執行前先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含通道記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重新執行命令。若要進行專注復原，請在可重用即時／E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重新執行所有發布區塊。產生的重新執行命令會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker 映像輸入，因此失敗的通道可以重用相同的 tarball 和 GHCR 映像。

### QA Lab

QA Lab 方塊也是 `OpenClaw Release Checks` 的一部分。它是代理行為與頻道層級的發布閘門，獨立於 Vitest 和 Docker 套件機制。

發布 QA Lab 覆蓋範圍包含：

- 使用代理同等性套件，比較 OpenAI 候選通道與 Opus 4.6 基準線的模擬同等性閘門
- 使用 `qa-live-shared` 環境的快速即時 Matrix QA 設定檔
- 使用 Convex CI 認證租約的即時 Telegram QA 通道
- 當發布遙測需要明確本機證據時的 `pnpm qa:otel:smoke`

使用此方塊回答「發布在 QA 情境和即時頻道流程中是否行為正確？」核准發布時，請保留同等性、Matrix 和 Telegram 通道的成品 URL。完整 Matrix 覆蓋範圍仍可作為手動分片 QA-Lab 執行使用，而不是預設的發布關鍵通道。

### 套件

套件方塊是可安裝產品閘門。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選正規化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並讓工作流程工具參考與套件來源參考保持分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發布版本
- `source=ref`：使用所選的 `workflow_ref` 工具封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重用另一個 GitHub Actions 執行所上傳的 `.tgz`

`OpenClaw Release Checks` 會以 `source=ref`、`package_ref=<release-ref>`、`suite_profile=custom`、`docker_lanes=bundled-channel-deps-compat plugins-offline`，以及 `telegram_mode=mock-openai` 執行 Package Acceptance。發布路徑 Docker 區塊涵蓋重疊的安裝、更新和 Plugin 更新通道；Package Acceptance 會針對相同解析後的 tarball 保留成品原生的內建頻道相容性、離線 Plugin 夾具，以及 Telegram 套件 QA。它是大多數先前需要 Parallels 的套件／更新覆蓋範圍的 GitHub 原生替代方案。跨 OS 發布檢查對 OS 特定的上線、安裝程式和平台行為仍然重要，但套件／更新產品驗證應優先使用 Package Acceptance。

舊版 package-acceptance 寬容度是刻意限時的。到 `2026.4.25` 為止的套件，可針對已發布到 npm 的中繼資料缺口使用相容性路徑：tarball 中缺少私有 QA 清單項目、缺少 `gateway install --wrapper`、tarball 衍生 git 夾具中缺少修補檔、缺少持久化的 `update.channel`、舊版 Plugin 安裝記錄位置、缺少市集安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件可能會針對已出貨的本機建置中繼資料戳記檔發出警告。之後的套件必須符合現代套件合約；相同缺口會導致發布驗證失敗。

當發布問題關於實際可安裝套件時，請使用較廣的 Package Acceptance 設定檔：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

常見套件設定檔：

- `smoke`：快速套件安裝／頻道／代理、Gateway 網路，以及設定重新載入通道
- `package`：不含即時 ClawHub 的安裝／更新／Plugin 套件合約；這是 release-check 預設值
- `product`：`package` 加上 MCP 頻道、cron／子代理清理、OpenAI 網頁搜尋，以及 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：用於專注重新執行的確切 `docker_lanes` 清單

若要提供套件候選 Telegram 證據，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。工作流程會將解析後的 `package-under-test` tarball 傳入 Telegram 通道；獨立 Telegram 工作流程仍接受已發布的 npm 規格，用於發布後檢查。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受以下由操作者控制的輸入：

- `tag`：必要的發布標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整 40 字元工作流程分支提交 SHA，用於僅驗證的預檢
- `preflight_only`：`true` 表示僅驗證／建置／套件，`false` 表示實際發布路徑
- `preflight_run_id`：在實際發布路徑上為必要，讓工作流程重用成功預檢執行所準備的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Checks` 接受以下由操作者控制的輸入：

- `ref`：要驗證的分支、標籤或完整提交 SHA。帶有密鑰的檢查要求解析後的提交可從 OpenClaw 分支或發布標籤到達。

規則：

- 穩定版與修正版標籤可以發布到 `beta` 或 `latest`
- Beta 預發布標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許完整提交 SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 永遠僅用於驗證
- 實際發布路徑必須使用預檢期間所用的相同 `npm_dist_tag`；工作流程會驗證發布前中繼資料仍然一致

## 穩定 npm 發布順序

切出穩定 npm 發布時：

1. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 標籤存在之前，你可以使用目前完整工作流程分支提交 SHA，對預檢工作流程進行僅驗證的試執行
2. 一般 beta 優先流程請選擇 `npm_dist_tag=beta`，只有在你刻意想直接發布穩定版時才選擇 `latest`
3. 當你想從單一手動工作流程取得一般 CI 加上即時提示快取、Docker、QA Lab、Matrix 和 Telegram 覆蓋範圍時，請在發布分支、發布標籤或完整提交 SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要決定性的一般測試圖，請改在發布參考上執行手動 `CI` 工作流程
5. 儲存成功的 `preflight_run_id`
6. 再次執行 `OpenClaw NPM Release`，並使用 `preflight_only=false`、相同的 `tag`、相同的 `npm_dist_tag`，以及已儲存的 `preflight_run_id`
7. 如果發布落在 `beta`，請使用私有 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 推進到 `latest`
8. 如果發布刻意直接發布到 `latest`，且 `beta` 應立即跟隨相同穩定版建置，請使用相同的私有工作流程，將兩個 dist-tag 都指向該穩定版本，或讓其排程的自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中是基於安全性，因為它仍然需要 `NPM_TOKEN`，而公開 repo 保持僅使用 OIDC 發布。

這讓直接發布路徑和 beta 優先推進路徑都保持文件化，並且對操作者可見。

如果維護者必須改用本機 npm 驗證，請只在專用 tmux 工作階段內執行任何 1Password
CLI (`op`) 命令。不要直接從主要代理 shell 呼叫 `op`；將它保留在 tmux 內，可讓提示、
警示和 OTP 處理可被觀察，並防止重複的主機警示。

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

維護者使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私人發行文件作為實際操作手冊。

## 相關

- [發行通道](/zh-TW/install/development-channels)
