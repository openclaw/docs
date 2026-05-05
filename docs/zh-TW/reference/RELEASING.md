---
read_when:
    - 正在尋找公開發布通道定義
    - 執行發行驗證或套件驗收
    - 查找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證環境、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-05T06:18:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布通道：

- stable：已標記的發布版本，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：發布到 npm `beta` 的預發布標籤
- dev：`main` 的移動頭部

## 版本命名

- 穩定版發布版本：`YYYY.M.D`
  - Git 標籤：`vYYYY.M.D`
- 穩定版修正發布版本：`YYYY.M.D-N`
  - Git 標籤：`vYYYY.M.D-N`
- Beta 預發布版本：`YYYY.M.D-beta.N`
  - Git 標籤：`vYYYY.M.D-beta.N`
- 不要在月份或日期前補零
- `latest` 表示目前已提升的穩定版 npm 發布
- `beta` 表示目前的 beta 安裝目標
- 穩定版與穩定版修正發布預設發布到 npm `beta`；發布操作人員可以明確指定 `latest`，或稍後提升已審核的 beta 建置
- 每個穩定版 OpenClaw 發布都會同時交付 npm 套件與 macOS 應用程式；
  beta 發布通常會先驗證並發布 npm/package 路徑，
  mac 應用程式的建置/簽署/公證則保留給穩定版，除非明確要求

## 發布節奏

- 發布採 beta 優先
- 穩定版只會在最新 beta 驗證完成後推出
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發布，
  讓發布驗證與修正不會阻塞 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細發布程序、核准、憑證與復原備註僅限維護者使用

## 發布操作人員檢查清單

這份檢查清單是發布流程的公開輪廓。私人憑證、
簽署、公證、dist-tag 復原與緊急回復細節會保留在
僅限維護者使用的發布執行手冊中。

1. 從目前的 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` 的 CI 狀態足以從它建立分支。
2. 使用 `/changelog` 從真實提交歷史重寫最上方的 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交它、推送它，並在建立分支前再 rebase/pull 一次。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍受涵蓋時才移除過期相容性，或記錄為何刻意保留。
4. 從目前的 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行一般發布工作。
5. 為預期標籤調升每個必要版本位置，執行
   `pnpm plugins:sync`，讓可發布的 Plugin 套件共享發布版本與相容性中繼資料，接著執行本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check` 和
   `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在之前，
   允許使用完整 40 字元的發布分支 SHA 進行僅驗證預檢。
   儲存成功的 `preflight_run_id`。
7. 對發布分支、標籤或完整提交 SHA 執行 `Full Release Validation`，
   啟動所有預發布測試。這是四個大型發布測試箱的單一手動入口點：
   Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正的最小失敗
   檔案、通道、工作流程工作、套件設定檔、提供者或模型 allowlist。
   只有在變更範圍讓先前證據失效時，才重新執行完整總括流程。
9. 對於 beta，標記 `vYYYY.M.D-beta.N`，然後從相符的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   先將所有可發布的 Plugin 套件發布到 npm，接著將同一組套件以 ClawPack npm-pack tarball 的形式發布到 ClawHub，
   然後以相符的 dist-tag 提升已準備好的 OpenClaw npm 預檢成品。發布後，針對已發布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 套件執行發布後套件驗收。如果已推送或已發布的預發布需要修正，
   請切出下一個相符的預發布編號；不要刪除或改寫舊的預發布。
10. 對於穩定版，只有在已審核的 beta 或發布候選版本具備必要驗證證據後才繼續。
    穩定版 npm 發布也會透過
    `OpenClaw Release Publish` 進行，並透過
    `preflight_run_id` 重用成功的預檢成品；穩定版 macOS 發布就緒也需要
    `main` 上已封裝的 `.zip`、`.dmg`、`.dSYM.zip` 與更新後的 `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器、在需要發布後通道證據時執行選用的獨立 published-npm Telegram E2E、
    視需要進行 dist-tag 提升、從完整相符的 `CHANGELOG.md` 區段產生 GitHub release/prerelease 備註，
    並執行發布公告步驟。

## 發布預檢

- 在發行預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 閘門之外也保持涵蓋
- 在發行預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機閘門之外也保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發行成品與 Control UI bundle 存在，以供封裝驗證步驟使用
- 在根版本提升後、標記前執行 `pnpm plugins:sync`。它會更新可發布 Plugin 套件版本、OpenClaw peer/API 相容性中繼資料、建置中繼資料，以及 Plugin changelog stub，使其符合核心發行版本。`pnpm plugins:sync:check` 是非變更式發行防護；如果忘記此步驟，發布 workflow 會在任何 registry 變更前失敗。
- 在發行核准前執行手動 `Full Release Validation` workflow，從單一進入點啟動所有預發行測試機。它接受分支、標記或完整 commit SHA，派送手動 `CI`，並派送 `OpenClaw Release Checks` 以執行安裝煙霧測試、套件驗收、跨 OS 套件檢查、QA Lab parity、Matrix 與 Telegram 執行線。穩定版/預設執行會將完整 live/E2E 與 Docker 發行路徑 soak 保留在 `run_release_soak=true` 後方；`release_profile=full` 會強制啟用 soak。搭配 `release_profile=full` 與 `rerun_group=all` 時，它也會針對來自發行檢查的 `release-package-under-test` 成品執行套件 Telegram E2E。發布後提供 `npm_telegram_package_spec`，可讓相同的 Telegram E2E 也驗證已發布的 npm 套件。發布後提供 `package_acceptance_package_spec`，可讓 Package Acceptance 針對已交付的 npm 套件執行其套件/更新矩陣，而不是針對由 SHA 建置的成品。提供 `evidence_package_spec`，可讓私有證據報告驗證該驗證對應到已發布的 npm 套件，而不強制執行 Telegram E2E。範例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你希望在發行工作繼續期間，為套件候選版本取得旁路證明時，執行手動 `Package Acceptance` workflow。對 `openclaw@beta`、`openclaw@latest` 或精確發行版本使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` harness 封裝受信任的 `package_ref` 分支/標記/SHA；使用 `source=url` 搭配需要 SHA-256 的 HTTPS tarball；或使用 `source=artifact` 取得由另一個 GitHub Actions 執行上傳的 tarball。該 workflow 會將候選項解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發行排程器，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對相同 tarball 執行 Telegram QA。當選定的 Docker 執行線包含 `published-upgrade-survivor` 時，套件成品就是候選項，而 `published_upgrade_survivor_baseline` 會選擇已發布的基準線。`update-restart-auth` 會使用候選套件同時作為已安裝 CLI 與 package-under-test，因此會測試候選更新命令的受管重啟路徑。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見設定檔：
  - `smoke`：安裝/頻道/agent、Gateway 網路與設定重新載入執行線
  - `package`：不含 OpenWebUI 或 live ClawHub 的成品原生套件/更新/重啟/Plugin 執行線
  - `product`：套件設定檔加上 MCP 頻道、cron/subagent 清理、OpenAI 網頁搜尋與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發行路徑分塊
  - `custom`：針對聚焦重跑選擇精確的 `docker_lanes`
- 當你只需要發行候選版本的完整一般 CI 涵蓋時，直接執行手動 `CI` workflow。手動 CI 派送會略過變更範圍限制，並強制執行 Linux Node shards、bundled-plugin shards、頻道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python skills、Windows、macOS、Android 與 Control UI i18n 執行線。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發行 telemetry 時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP receiver 測試 QA-lab，並驗證匯出的 trace span 名稱、有界屬性，以及內容/識別碼遮蔽，而不需要 Opik、Langfuse 或其他外部 collector。
- 每次標記發行前執行 `pnpm release:check`
- 標記存在後，針對會變更狀態的發布序列執行 `OpenClaw Release Publish`。從 `release/YYYY.M.D` 派送它（或在發布 main 可達標記時從 `main` 派送），傳入發行標記與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin 發布範圍 `all-publishable`，除非你刻意執行聚焦修復。該 workflow 會序列化 Plugin npm 發布、Plugin ClawHub 發布與 OpenClaw npm 發布，讓核心套件不會在其外部化 Plugin 之前發布。
- 發行檢查現在在獨立的手動 workflow 中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發行核准前執行 QA Lab mock parity 執行線，以及快速 live Matrix 設定檔與 Telegram QA 執行線。live 執行線使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential leases。當你想要平行取得完整 Matrix transport、media 與 E2EE inventory 時，請使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- 跨 OS 安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，兩者會直接呼叫 reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這項拆分是刻意設計：讓真正的 npm 發行路徑保持短小、決定性且聚焦於成品，同時較慢的 live 檢查留在自己的執行線中，避免拖慢或阻塞發布
- 帶有秘密的發行檢查應透過 `Full Release Validation` 或從 `main`/release workflow ref 派送，讓 workflow 邏輯與秘密維持受控
- `OpenClaw Release Checks` 接受分支、標記或完整 commit SHA，只要解析出的 commit 可從 OpenClaw 分支或發行標記到達
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元 workflow 分支 commit SHA，而不需要已推送標記
- 該 SHA 路徑僅供驗證，不能提升為真正發布
- 在 SHA 模式中，workflow 只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發行標記
- 兩個 workflow 都會將真正發布與提升路徑保留在 GitHub-hosted runners 上，而非變更式驗證路徑可以使用較大的 Blacksmith Linux runners
- 該 workflow 使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets
- npm 發行預檢不再等待獨立的發行檢查執行線
- 核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction 標記）
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/correction 版本），在新的暫存 prefix 中驗證已發布 registry 安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共用租用 Telegram credential pool，針對已發布 npm 套件驗證已安裝套件 onboarding、Telegram 設定與真實 Telegram E2E。本機維護者的一次性執行可省略 Convex 變數，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` env credentials。
- 若要從維護者機器執行完整發布後 beta 煙霧測試，請使用 `pnpm release:beta-smoke -- --beta betaN`。該 helper 會執行 Parallels npm update/fresh-target 驗證、派送 `NPM Telegram Beta E2E`、輪詢精確 workflow run、下載成品，並列印 Telegram 報告。
- 維護者可以透過手動 `NPM Telegram Beta E2E` workflow，從 GitHub Actions 執行相同的發布後檢查。它刻意設為僅限手動，且不會在每次 merge 時執行。
- 維護者發行自動化現在使用預檢再提升：
  - 真正的 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真正的 npm 發布必須從與成功預檢執行相同的 `main` 或 `release/YYYY.M.D` 分支派送
  - 穩定 npm 發行預設為 `beta`
  - 穩定 npm 發布可透過 workflow input 明確目標為 `latest`
  - 基於 token 的 npm dist-tag 變更現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 以確保安全，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開 repo 保持僅使用 OIDC 發布
  - 公開 `macOS Release` 僅供驗證；當標記只存在於發行分支，但 workflow 從 `main` 派送時，設定 `public_release_branch=release/YYYY.M.D`
  - 真正的私有 mac 發布必須通過成功的私有 mac `preflight_run_id` 與 `validate_run_id`
  - 真正發布路徑會提升已準備好的成品，而不是再次重建它們
- 對於像 `YYYY.M.D-N` 這樣的穩定修正版發行，發布後 verifier 也會檢查從 `YYYY.M.D` 到 `YYYY.M.D-N` 的相同暫存 prefix 升級路徑，讓發行修正版不會悄悄讓較舊的全域安裝停留在基礎穩定 payload
- npm 發行預檢會以封閉方式失敗，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，避免再次交付空的瀏覽器 dashboard
- 發布後驗證也會檢查已發布 Plugin 進入點與套件中繼資料是否存在於已安裝的 registry 版面中。若發行缺少 Plugin runtime payload，postpublish verifier 會失敗，且不能提升為 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，因此 installer e2e 會在發行發布路徑前捕捉意外的封裝膨脹
- 如果發行工作觸及 CI 規劃、extension timing manifests 或 extension test matrices，請在核准前重新產生並審閱 planner 擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，來源為 `.github/workflows/plugin-prerelease.yml`，避免發行說明描述過期的 CI 版面
- 穩定 macOS 發行就緒狀態也包含 updater surfaces：
  - GitHub release 最終必須包含已封裝的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - 發布後，`main` 上的 `appcast.xml` 必須指向新的穩定 zip
  - 已封裝 app 必須保留非 debug bundle id、非空的 Sparkle feed URL，以及對該發行版本而言等於或高於標準 Sparkle 建置下限的 `CFBundleVersion`

## 發行測試機

`Full Release Validation` 是操作員從單一進入點啟動所有預發行測試的方式。若要在快速移動分支上取得 pinned commit 證明，請使用 helper，讓每個子 workflow 都從固定在目標 SHA 的暫時分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

helper 會推送 `release-ci/<sha>-...`，從該分支以 `ref=<sha>` 派送 `Full Release Validation`，驗證每個子 workflow 的 `headSha` 都符合目標，然後刪除暫時分支。這可避免意外證明較新的 `main` 子執行。

若要驗證發行分支或標記，請從受信任的 `main` workflow ref 執行它，並將發行分支或標記作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

此 workflow 會解析目標 ref、派送手動 `CI` 並使用
`target_ref=<release-ref>`、派送 `OpenClaw Release Checks`、為面向套件的檢查準備父層
`release-package-under-test` 成品，並在 `release_profile=full` 且
`rerun_group=all` 時，或設定了 `npm_telegram_package_spec` 時，派送獨立的套件 Telegram E2E。接著，`OpenClaw Release
Checks` 會展開安裝冒煙測試、跨作業系統發行檢查、啟用浸泡測試時的 live/E2E Docker
發行路徑覆蓋、包含 Telegram
套件 QA 的 Package Acceptance、QA Lab 同等性檢查、live Matrix，以及 live Telegram。只有當
`Full Release Validation`
摘要顯示 `normal_ci` 和 `release_checks` 成功時，完整執行才可接受。在 full/all 模式中，
`npm_telegram` 子項也必須成功；在 full/all 之外則會略過，
除非提供了已發布的 `npm_telegram_package_spec`。最終驗證器摘要包含每個子執行的最慢工作表格，因此發行管理員不必下載記錄即可看到目前的關鍵路徑。
請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、精確 workflow 工作名稱、stable 與 full profile
差異、成品，以及聚焦重新執行控制項。
子 workflow 會從執行 `Full Release
Validation` 的受信任 ref 派送，通常是 `--ref main`，即使目標 `ref` 指向較舊的發行分支或標籤也是如此。沒有個別的 Full Release Validation
workflow-ref 輸入；請透過選擇 workflow 執行 ref 來選擇受信任的測試框架。
不要在移動中的 `main` 上使用 `--ref main -f ref=<sha>` 進行精確 commit 證明；
原始 commit SHA 不能作為 workflow dispatch ref，因此請使用
`pnpm ci:full-release --sha <sha>` 來建立釘選的暫時分支。

使用 `release_profile` 選擇 live/供應商廣度：

- `minimum`：最快速、發行關鍵的 OpenAI/核心 live 與 Docker 路徑
- `stable`：minimum 加上用於發行核准的 stable 供應商/後端覆蓋
- `full`：stable 加上廣泛的 advisory 供應商/媒體覆蓋

當發行封鎖 lanes 皆為綠燈，且你希望在升版前執行完整的 live/E2E、Docker 發行路徑，以及有界的已發布升級倖存者掃描時，請搭配 `stable` 使用 `run_release_soak=true`。該掃描涵蓋最新四個 stable 套件，加上釘選的 `2026.4.23` 與 `2026.5.2`
基準，以及較舊的 `2026.4.15` 覆蓋，並移除重複基準，且每個基準都分片到自己的 Docker runner 工作中。`full` 會隱含
`run_release_soak=true`。

`OpenClaw Release Checks` 使用受信任的 workflow ref，將目標
ref 解析一次為 `release-package-under-test`，並在浸泡測試執行時，於跨作業系統、Package Acceptance 與發行路徑 Docker 檢查中重用該成品。這能讓所有面向套件的執行環境使用相同位元組，並避免重複建置套件。
當 repo/org 變數已設定時，跨作業系統 OpenAI 安裝冒煙測試會使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此 lane 是在證明套件安裝、onboarding、gateway 啟動，以及一次 live agent 回合，而不是對最慢的預設模型做效能基準測試。更廣泛的 live 供應商矩陣仍是模型特定覆蓋的所在。

依據發行階段使用以下變體：

```bash
# 驗證未發布的發行候選分支。
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

# 發布 beta 後，加入已發布套件的 Telegram E2E。
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

不要把完整總括 workflow 當成聚焦修正後的第一次重新執行。如果有一個執行環境失敗，下一次證明請使用失敗的子 workflow、工作、Docker lane、套件 profile、模型供應商，或 QA lane。只有當修正變更了共用發行編排，或讓先前所有執行環境的證據過期時，才再次執行完整總括 workflow。總括 workflow 的最終驗證器會重新檢查已記錄的子 workflow 執行 ID，因此在子 workflow 成功重新執行後，只需重新執行失敗的
`Verify full validation` 父工作。

如需有界復原，請將 `rerun_group` 傳給總括 workflow。`all` 是真正的發行候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease`
只執行僅限發行的 Plugin 子項，`release-checks` 會執行每個發行執行環境，而較窄的發行群組是 `install-smoke`、`cross-os`、
`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 與 `npm-telegram`。
聚焦的 `npm-telegram` 重新執行需要 `npm_telegram_package_spec`；使用 `release_profile=full` 的 full/all 執行會使用 release-checks 套件成品。聚焦的跨作業系統重新執行可以加入 `cross_os_suite_filter=windows/packaged-upgrade` 或另一個作業系統/套件篩選器。QA release-check 失敗屬於 advisory；僅 QA 失敗不會封鎖發行驗證。

### Vitest

Vitest 執行環境是手動 `CI` 子 workflow。手動 CI 會刻意略過變更範圍限制，並強制對發行候選執行一般測試圖：Linux Node 分片、bundled-plugin 分片、channel 合約、Node 22
相容性、`check`、`check-additional`、建置冒煙測試、文件檢查、Python
Skills、Windows、macOS、Android，以及 Control UI i18n。

使用此執行環境回答「原始碼樹是否通過完整的一般測試套件？」
它不同於發行路徑產品驗證。需保留的證據：

- 顯示已派送 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 在精確目標 SHA 上為綠燈
- 調查回歸時，CI 工作中的失敗或緩慢分片名稱
- 當執行需要效能分析時，保留 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發行需要確定性的一般 CI，但不需要 Docker、QA Lab、live、跨作業系統或套件執行環境時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 執行環境位於 `OpenClaw Release Checks` 中，透過
`openclaw-live-and-e2e-checks-reusable.yml`，另加上 release-mode
`install-smoke` workflow。它會透過打包的 Docker 環境驗證發行候選，而不僅是原始碼層級測試。

發行 Docker 覆蓋包含：

- 啟用較慢 Bun 全域安裝冒煙測試的完整安裝冒煙測試
- 依目標 SHA 準備/重用 root Dockerfile 冒煙映像，並將 QR、
  root/gateway，以及 installer/Bun 冒煙工作作為個別 install-smoke
  分片執行
- repository E2E lanes
- 發行路徑 Docker 區塊：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g` 與 `plugins-runtime-install-h`
- 要求時，在 `plugins-runtime-services` 區塊內的 OpenWebUI 覆蓋
- 拆分的 bundled plugin 安裝/解除安裝 lanes：
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-23`
- 當 release checks 包含 live 套件時的 live/E2E 供應商套件與 Docker live 模型覆蓋

重新執行前先使用 Docker 成品。發行路徑排程器會上傳
`.artifacts/docker-tests/`，其中包含 lane 記錄、`summary.json`、`failures.json`、
階段計時、排程器計畫 JSON，以及重新執行命令。聚焦復原時，請在可重用 live/E2E workflow 上使用
`docker_lanes=<lane[,lane]>`，而不是重新執行所有發行區塊。產生的重新執行命令會在可用時包含先前的
`package_artifact_run_id` 與已準備的 Docker 映像輸入，因此失敗的 lane 可以重用相同的 tarball 與 GHCR 映像。

### QA Lab

QA Lab 執行環境也是 `OpenClaw Release Checks` 的一部分。它是 agentic
行為與 channel 層級的發行閘道，獨立於 Vitest 與 Docker 套件機制。

發行 QA Lab 覆蓋包含：

- mock 同等性 lane，使用 agentic parity pack 比較 OpenAI 候選 lane 與 Opus 4.6
  基準
- 使用 `qa-live-shared` 環境的快速 live Matrix QA profile
- 使用 Convex CI credential leases 的 live Telegram QA lane
- 當發行遙測需要明確本機證明時的 `pnpm qa:otel:smoke`

使用此執行環境回答「發行在 QA 情境與 live channel 流程中是否行為正確？」
核准發行時，請保留 parity、Matrix 與 Telegram lanes 的成品 URL。完整 Matrix 覆蓋仍可作為手動分片 QA-Lab 執行使用，而不是預設的發行關鍵 lane。

### 套件

套件執行環境是可安裝產品的閘道。它由
`Package Acceptance` 與 resolver
`scripts/resolve-openclaw-package-candidate.mjs` 支援。resolver 會將候選標準化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並讓 workflow 測試框架 ref 與套件來源 ref 分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本
- `source=ref`：使用所選 `workflow_ref` 測試框架打包受信任的 `package_ref` 分支、標籤，或完整 commit SHA
- `source=url`：下載 HTTPS `.tgz`，且需要 `package_sha256`
- `source=artifact`：重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發行套件成品、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、
`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會對相同解析後的 tarball 保持遷移、更新、
已設定 auth 的更新重啟、過期 plugin 相依清理、離線 plugin fixtures、plugin 更新，以及 Telegram 套件 QA。封鎖性 release checks 使用預設最新已發布套件基準；`run_release_soak=true` 或
`release_profile=full` 會擴展到從
`2026.4.23` 到 `latest` 的每個 stable npm 已發布基準，加上已回報問題的 fixtures。對已出貨候選使用帶有 `source=npm` 的
Package Acceptance，或對發布前由 SHA 支援的本機 npm tarball 使用
`source=ref`/`source=artifact`。它是 GitHub 原生的替代方案，可取代過去大多數需要 Parallels 的套件/更新覆蓋。跨作業系統 release checks 對作業系統特定的 onboarding、installer 與平台行為仍然重要，但套件/更新產品驗證應優先使用 Package Acceptance。

更新與 plugin 驗證的標準檢查清單是
[測試更新與 plugins](/zh-TW/help/testing-updates-plugins)。在判斷哪個本機、Docker、Package Acceptance，或 release-check lane 能證明 plugin 安裝/更新、doctor 清理，或已發布套件遷移變更時，請使用它。
從每個 stable `2026.4.23+` 套件進行完整已發布更新遷移，是個別的手動 `Update Migration` workflow，不屬於 Full Release CI。

舊版套件驗收的寬鬆規則是刻意限時保留的。直到
`2026.4.25` 為止的套件，可以針對已發布到 npm 的中繼資料缺口使用相容路徑：
tarball 中缺少的私有 QA 清單項目、缺少
`gateway install --wrapper`、由 tarball 衍生的 git
fixture 中缺少修補檔、缺少已持久化的 `update.channel`、舊版 Plugin 安裝記錄
位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料
遷移。已發布的 `2026.4.26` 套件，可能會針對已經出貨的本機建置中繼資料戳記檔
發出警告。較新的套件必須符合現代套件合約；相同缺口會導致發行驗證失敗。

當發行問題關於實際可安裝套件時，請使用更廣泛的套件驗收設定檔：

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

- `smoke`：快速套件安裝/頻道/agent、Gateway 網路，以及設定重新載入通道
- `package`：不含即時 ClawHub 的安裝/更新/重新啟動/Plugin 套件合約；這是發行檢查的預設值
- `product`：`package` 加上 MCP 頻道、cron/subagent 清理、OpenAI 網頁搜尋，以及 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發行路徑區塊
- `custom`：用於聚焦重新執行的精確 `docker_lanes` 清單

若要針對套件候選項提供 Telegram 證明，請在套件驗收啟用 `telegram_mode=mock-openai` 或
`telegram_mode=live-frontier`。此 workflow 會將解析出的
`package-under-test` tarball 傳入 Telegram 通道；獨立的
Telegram workflow 仍接受已發布的 npm 規格，用於發布後檢查。

## 發行發布自動化

`OpenClaw Release Publish` 是一般會變更狀態的發布進入點。它會依照發行所需的順序協調可信發布者 workflow：

1. 簽出發行標籤並解析其提交 SHA。
2. 驗證該標籤可從 `main` 或 `release/*` 觸及。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 分派 `Plugin NPM Release`。
5. 使用相同範圍和 SHA 分派 `Plugin ClawHub Release`。
6. 使用發行標籤、npm dist-tag，以及已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。

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

直接提升穩定版到 `latest` 是明確操作：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和
`Plugin ClawHub Release` workflow。若要修復選定 Plugin，請將
`plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給
`OpenClaw Release Publish`，或在不得發布 OpenClaw 套件時直接分派子 workflow。

## NPM workflow 輸入

`OpenClaw NPM Release` 接受這些由操作員控制的輸入：

- `tag`：必要的發行標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或
  `v2026.4.2-beta.1`；當 `preflight_only=true` 時，它也可以是目前完整的
  40 字元 workflow 分支提交 SHA，用於僅驗證的預檢
- `preflight_only`：`true` 表示僅驗證/建置/打包，`false` 表示實際發布路徑
- `preflight_run_id`：實際發布路徑需要此值，讓 workflow 重用成功預檢執行中準備好的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受這些由操作員控制的輸入：

- `tag`：必要的發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` 預檢執行 id；當 `publish_openclaw_npm=true` 時必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；只有聚焦修復工作才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有將 workflow 作為僅 Plugin 修復協調器時才設為 `false`

`OpenClaw Release Checks` 接受這些由操作員控制的輸入：

- `ref`：要驗證的分支、標籤或完整提交 SHA。帶有密鑰的檢查要求解析出的提交可從 OpenClaw 分支或發行標籤觸及。
- `run_release_soak`：在穩定版/預設發行檢查中選擇執行完整的即時/E2E、Docker 發行路徑，以及 all-since 升級倖存浸泡測試。`release_profile=full` 會強制啟用它。

規則：

- 穩定版與修正版標籤可以發布到 `beta` 或 `latest`
- Beta 預發行標籤只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許完整提交 SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律僅用於驗證
- 實際發布路徑必須使用預檢期間使用的相同 `npm_dist_tag`；workflow 會在發布繼續前驗證該中繼資料

## 穩定版 npm 發行順序

切出穩定版 npm 發行時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在之前，你可以使用目前完整的 workflow 分支提交 SHA，對預檢 workflow 執行僅驗證的試跑
2. 一般先發布到 beta 的流程請選擇 `npm_dist_tag=beta`，只有在你刻意要直接發布穩定版時才使用 `latest`
3. 當你想從單一手動 workflow 取得一般 CI 加上即時提示快取、Docker、QA Lab、Matrix 和 Telegram 覆蓋時，請在發行分支、發行標籤或完整提交 SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要決定性的正常測試圖，請改在發行 ref 上執行手動 `CI` workflow
5. 儲存成功的 `preflight_run_id`
6. 使用相同的 `tag`、相同的 `npm_dist_tag`，以及已儲存的 `preflight_run_id` 執行 `OpenClaw Release Publish`；它會先將外部化的 Plugin 發布到 npm 和 ClawHub，再提升 OpenClaw npm 套件
7. 如果發行落在 `beta`，請使用私有
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow 將該穩定版本從 `beta` 提升到 `latest`
8. 如果發行刻意直接發布到 `latest`，且 `beta` 應立即跟隨相同穩定建置，請使用同一個私有 workflow 將兩個 dist-tag 指向穩定版本，或讓它排程的自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 中是出於安全考量，因為它仍需要 `NPM_TOKEN`，而公開 repo 保持僅使用 OIDC 發布。

這讓直接發布路徑和先 beta 後提升路徑都有文件記載，且操作員可見。

如果維護者必須退回本機 npm 驗證，請只在專用 tmux 工作階段內執行任何 1Password
CLI (`op`) 命令。不要從主要 agent shell 直接呼叫 `op`；將它保留在 tmux 內可讓提示、警示和 OTP 處理可觀察，並防止重複的主機警示。

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
