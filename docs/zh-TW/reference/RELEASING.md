---
read_when:
    - 正在尋找公開發行通道定義
    - 執行發行驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證機器、版本命名與節奏
title: 發布政策
x-i18n:
    generated_at: "2026-05-07T15:08:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布通道：

- stable：標記版本，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：預發布標籤，發布到 npm `beta`
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
- 穩定與穩定修正版本預設發布到 npm `beta`；發布操作員可以明確指定 `latest`，或稍後提升已審核的 beta 建置
- 每個穩定的 OpenClaw 發布版本都會同時出貨 npm 套件和 macOS app；
  beta 版本通常會先驗證並發布 npm/套件路徑，而 mac app 建置/簽署/公證則保留給穩定版本，除非明確要求

## 發布節奏

- 發布採 beta 優先
- 穩定版本只會在最新 beta 驗證完成後跟進
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.D` 分支切出發布版本，
  讓發布驗證與修正不會阻礙 `main` 上的新開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切出下一個 `-beta.N` 標籤，而不是刪除或重新建立舊的 beta 標籤
- 詳細發布程序、核准、憑證與復原註記僅供維護者使用

## 發布操作員檢查清單

此檢查清單是發布流程的公開形狀。私人憑證、
簽署、公證、dist-tag 復原與緊急回復細節保留在
僅限維護者的發布執行手冊中。

1. 從目前 `main` 開始：拉取最新版本，確認目標提交已推送，
   並確認目前 `main` CI 足夠綠燈，可以從它建立分支。
2. 使用 `/changelog` 從真實提交歷史重寫頂部 `CHANGELOG.md` 區段，
   保持條目面向使用者，提交它、推送它，並在建立分支前再 rebase/pull 一次。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍被涵蓋時才移除過期相容性，或記錄為何要刻意保留。
4. 從目前 `main` 建立 `release/YYYY.M.D`；不要直接在 `main` 上進行正常發布工作。
5. 為預定標籤提升每個必要版本位置，然後執行
   `pnpm release:prep`。它會依正確順序重新整理 Plugin 版本、Plugin 清冊、設定結構描述、內建頻道設定中繼資料、設定文件基線、Plugin SDK 匯出，以及 Plugin SDK API 基線。標記前提交任何產生的漂移。接著執行本機決定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。在標籤存在前，
   完整 40 字元的發布分支 SHA 可用於僅驗證的預檢。儲存成功的 `preflight_run_id`。
7. 針對發布分支、標籤或完整提交 SHA，以 `Full Release Validation` 啟動所有預發布測試。這是四個大型發布測試盒的唯一手動入口點：Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行能證明修正的最小失敗檔案、通道、工作流程工作、套件設定檔、供應商或模型允許清單。只有在變更範圍使先前證據失效時，才重新執行完整傘狀流程。
9. 若為 beta，標記 `vYYYY.M.D-beta.N`，然後從相符的 `release/YYYY.M.D` 分支執行 `OpenClaw Release Publish`。它會驗證 `pnpm plugins:sync:check`，
   將所有可發布的 Plugin 套件並行派送到 npm，以及將同一組派送到
   ClawHub，然後在 Plugin npm 發布成功後，立即以相符的 dist-tag 提升已準備好的 OpenClaw npm 預檢成品。
   OpenClaw npm 發布時，ClawHub 發布可能仍在執行，但發布工作流程會立即列印子執行 ID。預設情況下，它在派送 ClawHub 後不會等待 ClawHub，因此 OpenClaw npm 可用性不會被較慢的 ClawHub 核准或登錄檔工作阻擋；當 ClawHub 必須阻擋工作流程完成時，請設定
   `wait_for_clawhub=true`。ClawHub 路徑會重試暫時性的 CLI 相依項安裝失敗，即使某個預覽儲存格偶發失敗也會發布通過預覽的 Plugin，最後會針對每個預期 Plugin 版本進行登錄檔驗證，因此部分發布仍保持可見且可重試。發布後，針對已發布的 `openclaw@YYYY.M.D-beta.N` 或
   `openclaw@beta` 套件執行發布後套件
   驗收。如果已推送或已發布的預發布版本需要修正，
   請切出下一個相符的預發布編號；不要刪除或重寫舊的預發布版本。
10. 若為穩定版本，只有在已審核的 beta 或發布候選版本具備所需驗證證據後才繼續。
    穩定 npm 發布也會透過
    `OpenClaw Release Publish`，使用 `preflight_run_id` 重用成功的預檢成品；穩定 macOS 發布就緒還需要
    `main` 上已打包的 `.zip`、`.dmg`、`.dSYM.zip`，以及已更新的 `appcast.xml`。
11. 發布後，執行 npm 發布後驗證器、需要發布後頻道證明時可選的獨立
    已發布 npm Telegram E2E、
    需要時的 dist-tag 提升、來自完整相符 `CHANGELOG.md` 區段的 GitHub 發布/預發布註記，以及發布公告
    步驟。

## 發布預檢

- 在發布預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 門檻之外仍受到涵蓋
- 在發布預檢前執行 `pnpm check:architecture`，讓更廣泛的匯入循環與架構邊界檢查在較快的本機門檻之外也保持通過
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發布成品與 Control UI 套件存在，以供封裝驗證步驟使用
- 在根版本提升後、標記前執行 `pnpm release:prep`。它會執行每個確定性的發布產生器，這些產生器通常會在版本、設定或 API 變更後出現漂移：Plugin 版本、Plugin 清單、基礎設定結構描述、內建頻道設定中繼資料、設定文件基準、Plugin SDK 匯出項目，以及 Plugin SDK API 基準。`pnpm release:check` 會以檢查模式重新執行這些防護，並在執行套件發布檢查前，以一次通過回報所有找到的產生內容漂移失敗。
- 在發布核准前執行手動 `Full Release Validation` 工作流程，從單一進入點啟動所有預發布測試箱。它接受分支、標記或完整提交 SHA，派發手動 `CI`，並為安裝煙霧測試、套件驗收、跨 OS 套件檢查、QA Lab 一致性、Matrix 與 Telegram 通道派發 `OpenClaw Release Checks`。穩定版/預設執行會將完整 live/E2E 與 Docker 發布路徑浸泡測試保留在 `run_release_soak=true` 之後；`release_profile=full` 會強制啟用浸泡測試。搭配 `release_profile=full` 與 `rerun_group=all` 時，它也會使用來自發布檢查的 `release-package-under-test` 成品執行套件 Telegram E2E。發布後，當同一個 Telegram E2E 也應證明已發布的 npm 套件時，請提供 `npm_telegram_package_spec`。發布後，當 Package Acceptance 應針對已出貨的 npm 套件，而不是 SHA 建置成品執行其套件/更新矩陣時，請提供 `package_acceptance_package_spec`。當私有證據報告應證明該驗證符合已發布的 npm 套件，而不強制執行 Telegram E2E 時，請提供 `evidence_package_spec`。範例：`gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- 當你希望在發布工作繼續進行時，為套件候選項取得側通道證明，請執行手動 `Package Acceptance` 工作流程。對 `openclaw@beta`、`openclaw@latest` 或精確發布版本使用 `source=npm`；使用 `source=ref` 搭配目前的 `workflow_ref` 測試工具封裝受信任的 `package_ref` 分支/標記/SHA；對需要 SHA-256 的 HTTPS tarball 使用 `source=url`；或對另一個 GitHub Actions 執行上傳的 tarball 使用 `source=artifact`。此工作流程會將候選項解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發布排程器，並可透過 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一個 tarball 執行 Telegram QA。當選取的 Docker 通道包含 `published-upgrade-survivor` 時，套件成品就是候選項，而 `published_upgrade_survivor_baseline` 會選擇已發布的基準。`update-restart-auth` 會將候選套件同時用作已安裝 CLI 與 package-under-test，因此它會測試候選更新命令的受管重新啟動路徑。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見設定檔：
  - `smoke`：安裝/頻道/代理、Gateway 網路與設定重新載入通道
  - `package`：不含 OpenWebUI 或 live ClawHub 的成品原生套件/更新/重新啟動/Plugin 通道
  - `product`：套件設定檔加上 MCP 頻道、cron/子代理清理、OpenAI 網路搜尋與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發布路徑區塊
  - `custom`：用於聚焦重新執行的精確 `docker_lanes` 選擇
- 當你只需要發布候選項的完整一般 CI 覆蓋時，直接執行手動 `CI` 工作流程。手動 CI 派發會繞過變更範圍，並強制執行 Linux Node 分片、內建 Plugin 分片、頻道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python skills、Windows、macOS、Android 與 Control UI i18n 通道。
  範例：`gh workflow run ci.yml --ref release/YYYY.M.D`
- 驗證發布遙測時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器測試 QA-lab，並驗證匯出的追蹤 span 名稱、受限屬性與內容/識別碼遮蔽，不需要 Opik、Langfuse 或其他外部收集器。
- 在每個已標記的發布前執行 `pnpm release:check`
- 在標記存在後，為會變更狀態的發布序列執行 `OpenClaw Release Publish`。從 `release/YYYY.M.D` 派發它（或在發布 main 可達標記時從 `main` 派發），傳入發布標記與成功的 OpenClaw npm `preflight_run_id`，並保留預設 Plugin 發布範圍 `all-publishable`，除非你刻意執行聚焦修復。此工作流程會序列化 Plugin npm 發布、Plugin ClawHub 發布與 OpenClaw npm 發布，因此核心套件不會在其外部化 Plugin 之前發布。
- 發布檢查現在會在獨立的手動工作流程中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發布核准前執行 QA Lab 模擬一致性通道，以及快速 live Matrix 設定檔與 Telegram QA 通道。live 通道使用 `qa-live-shared` 環境；Telegram 也使用 Convex CI 憑證租約。當你想要並行取得完整 Matrix 傳輸、媒體與 E2EE 清單時，請使用 `matrix_profile=all` 與 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` 工作流程。
- 跨 OS 安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，兩者會直接呼叫可重用工作流程 `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 此拆分是刻意設計的：讓真實 npm 發布路徑保持短、確定性且以成品為中心，同時讓較慢的 live 檢查留在自己的通道中，避免拖慢或阻擋發布
- 帶有秘密的發布檢查應透過 `Full Release Validation`，或從 `main`/release 工作流程 ref 派發，讓工作流程邏輯與秘密保持受控
- `OpenClaw Release Checks` 接受分支、標記或完整提交 SHA，只要解析出的提交可從 OpenClaw 分支或發布標記到達
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元工作流程分支提交 SHA，不需要已推送的標記
- 該 SHA 路徑僅供驗證，不能提升為真實發布
- 在 SHA 模式中，工作流程只會為套件中繼資料檢查合成 `v<package.json version>`；真實發布仍需要真實發布標記
- 兩個工作流程都會讓真實發布與提升路徑保留在 GitHub 託管 runner 上，而不會變更狀態的驗證路徑可以使用較大型的 Blacksmith Linux runner
- 該工作流程會使用 `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`，並同時使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` 工作流程秘密
- npm 發布預檢不再等待獨立的發布檢查通道
- 核准前執行 `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/修正版標記）
- npm 發布後，執行 `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（或相符的 beta/修正版版本），在全新的暫存前綴中驗證已發布登錄檔安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`，使用共享租用 Telegram 憑證池，針對已發布的 npm 套件驗證已安裝套件 onboarding、Telegram 設定與真實 Telegram E2E。本機維護者的一次性執行可省略 Convex 變數，並直接傳入三個 `OPENCLAW_QA_TELEGRAM_*` 環境憑證。
- 若要從維護者機器執行完整發布後 beta 煙霧測試，請使用 `pnpm release:beta-smoke -- --beta betaN`。此輔助程式會執行 Parallels npm 更新/全新目標驗證、派發 `NPM Telegram Beta E2E`、輪詢精確工作流程執行、下載成品，並列印 Telegram 報告。
- 維護者可以透過手動 `NPM Telegram Beta E2E` 工作流程，從 GitHub Actions 執行相同的發布後檢查。它刻意僅限手動，不會在每次合併時執行。
- 維護者發布自動化現在使用預檢後提升：
  - 真實 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真實 npm 發布必須從與成功預檢執行相同的 `main` 或 `release/YYYY.M.D` 分支派發
  - 穩定版 npm 發布預設目標為 `beta`
  - 穩定版 npm 發布可透過工作流程輸入明確指定目標為 `latest`
  - 基於權杖的 npm dist-tag 變更現在位於 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`，以提升安全性，因為 `npm dist-tag add` 仍需要 `NPM_TOKEN`，而公開儲存庫維持僅使用 OIDC 發布
  - 公開 `macOS Release` 僅供驗證；當標記只存在於發布分支，但工作流程從 `main` 派發時，請設定 `public_release_branch=release/YYYY.M.D`
  - 真實私有 mac 發布必須通過成功的私有 mac `preflight_run_id` 與 `validate_run_id`
  - 真實發布路徑會提升已準備的成品，而不是再次重新建置它們
- 對於像 `YYYY.M.D-N` 這樣的穩定修正版發布，發布後驗證器也會檢查相同暫存前綴中從 `YYYY.M.D` 到 `YYYY.M.D-N` 的升級路徑，確保發布修正不會默默讓較舊的全域安裝停留在基礎穩定 payload 上
- npm 發布預檢會封閉失敗，除非 tarball 同時包含 `dist/control-ui/index.html` 與非空的 `dist/control-ui/assets/` payload，避免我們再次出貨空的瀏覽器儀表板
- 發布後驗證也會檢查已發布的 Plugin 進入點與套件中繼資料是否存在於已安裝的登錄檔版面配置中。若發布缺少 Plugin 執行階段 payload，會讓 postpublish 驗證器失敗，且不能提升為 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，因此安裝程式 e2e 會在發布發佈路徑前捕捉到意外的封裝膨脹
- 如果發布工作觸及 CI 規劃、Plugin 時序 manifest 或 Plugin 測試矩陣，請在核准前重新產生並審閱由規劃器擁有的 `plugin-prerelease-extension-shard` 矩陣輸出，來源為 `.github/workflows/plugin-prerelease.yml`，確保發布說明不會描述過期的 CI 版面配置
- 穩定版 macOS 發布就緒狀態也包含更新程式介面：
  - GitHub 發布最後必須包含已封裝的 `.zip`、`.dmg` 與 `.dSYM.zip`
  - 發布後，`main` 上的 `appcast.xml` 必須指向新的穩定版 zip
  - 已封裝的 app 必須保留非 debug bundle id、非空的 Sparkle feed URL，以及高於或等於該發布版本標準 Sparkle 建置下限的 `CFBundleVersion`

## 發布測試箱

`Full Release Validation` 是操作員從單一進入點啟動所有預發布測試的方式。若要在快速移動的分支上取得釘選提交證明，請使用輔助程式，讓每個子工作流程都從固定於目標 SHA 的暫時分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

此輔助程式會推送 `release-ci/<sha>-...`，從該分支使用 `ref=<sha>` 派發 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，然後刪除暫時分支。這可避免意外證明較新的 `main` 子執行。

對於發布分支或標籤驗證，請從受信任的 `main` workflow
ref 執行，並將發布分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

此 workflow 會解析目標 ref，以
`target_ref=<release-ref>` 分派手動 `CI`，分派 `OpenClaw Release Checks`，準備一個
供套件面向檢查使用的父層 `release-package-under-test` artifact，並在
`release_profile=full` 且 `rerun_group=all`，或設定 `npm_telegram_package_spec` 時，
分派獨立的套件 Telegram E2E。接著 `OpenClaw Release
Checks` 會展開安裝 smoke、跨 OS 發布檢查、啟用 soak 時的 live/E2E Docker
發布路徑涵蓋範圍、含 Telegram 套件 QA 的套件驗收、QA Lab parity、live Matrix，
以及 live Telegram。只有在
`Full Release Validation`
摘要顯示 `normal_ci` 和 `release_checks` 成功時，完整執行才可接受。在 full/all 模式中，
`npm_telegram` 子項也必須成功；在 full/all 以外，除非提供了已發布的
`npm_telegram_package_spec`，否則會跳過。最終驗證器摘要會包含每個子執行的最慢工作表，
讓發布管理員無需下載記錄即可看見目前的關鍵路徑。
完整階段矩陣、確切 workflow 工作名稱、stable 與 full profile 的差異、
artifacts，以及聚焦重新執行控制代碼，請參閱
[完整發布驗證](/zh-TW/reference/full-release-validation)。
子 workflow 會從執行 `Full Release
Validation` 的受信任 ref 分派，通常是 `--ref main`，即使目標 `ref` 指向
較舊的發布分支或標籤也是如此。沒有獨立的 Full Release Validation
workflow-ref 輸入；請透過選擇 workflow run ref 來選擇受信任的 harness。
不要使用 `--ref main -f ref=<sha>` 來對移動中的 `main` 做精確提交證明；
原始提交 SHA 不能作為 workflow dispatch ref，因此請使用
`pnpm ci:full-release --sha <sha>` 建立釘選的暫時分支。

使用 `release_profile` 選擇 live/provider 廣度：

- `minimum`：最快速的發布關鍵 OpenAI/核心 live 與 Docker 路徑
- `stable`：minimum 加上用於發布核准的穩定 provider/backend 涵蓋範圍
- `full`：stable 加上廣泛的 advisory provider/media 涵蓋範圍

當發布阻擋 lane 為綠色，且你希望在升版前執行完整的 live/E2E、Docker 發布路徑，
以及有界限的已發布升級倖存者掃描時，請搭配 `stable` 使用
`run_release_soak=true`。該掃描涵蓋最新四個穩定套件，加上釘選的 `2026.4.23` 與
`2026.5.2` 基準，再加上較舊的 `2026.4.15` 涵蓋範圍，並移除重複基準，
且每個基準都分片到自己的 Docker runner 工作中。`full` 隱含
`run_release_soak=true`。

`OpenClaw Release Checks` 會使用受信任的 workflow ref 將目標
ref 解析一次為 `release-package-under-test`，並在執行 soak 時，於跨 OS、
套件驗收，以及發布路徑 Docker 檢查中重用該 artifact。這會讓所有套件面向的機器使用相同位元組，
並避免重複建置套件。跨 OS OpenAI 安裝 smoke 會在設定 repo/org 變數時使用
`OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此 lane
證明的是套件安裝、onboarding、gateway 啟動，以及一個 live agent turn，
而不是對最慢的預設模型做基準測試。更廣泛的 live provider
矩陣仍然是模型特定涵蓋範圍所在之處。

請依發布階段使用以下變體：

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

不要將完整總傘作為聚焦修復後的第一次重新執行。如果有一台機器失敗，
請使用失敗的子 workflow、工作、Docker lane、套件 profile、模型 provider，
或 QA lane 進行下一次證明。只有在修復變更了共用發布編排，或讓先前的全機器證據過期時，
才再次執行完整總傘。總傘的最終驗證器會重新檢查記錄的子 workflow run
id，因此在子 workflow 成功重新執行後，只需重新執行失敗的父層
`Verify full validation` 工作。

若要進行有界限的復原，請將 `rerun_group` 傳給總傘。`all` 是真正的
發布候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease`
只執行僅發布用的 Plugin 子項，`release-checks` 執行每個發布
機器，而較窄的發布群組是 `install-smoke`、`cross-os`、
`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦的 `npm-telegram` 重新執行需要 `npm_telegram_package_spec`；使用
`release_profile=full` 的 full/all 執行會使用 release-checks 套件 artifact。
聚焦的跨 OS 重新執行可以加入 `cross_os_suite_filter=windows/packaged-upgrade` 或
其他 OS/suite 篩選器。QA release-check 失敗屬於 advisory；僅 QA
失敗不會阻擋發布驗證。

### Vitest

Vitest 機器是手動 `CI` 子 workflow。手動 CI 會刻意
略過 changed scoping，並強制對發布候選執行一般測試圖：Linux Node shards、
bundled-plugin shards、channel contracts、Node 22
相容性、`check`、`check-additional`、build smoke、docs checks、Python
skills、Windows、macOS、Android，以及 Control UI i18n。

使用此機器回答「原始碼樹是否通過完整的一般測試套件？」
它與發布路徑產品驗證不同。要保留的證據：

- `Full Release Validation` 摘要，顯示已分派的 `CI` run URL
- `CI` run 在確切目標 SHA 上為綠色
- 調查 regression 時 CI 工作中的失敗或較慢 shard 名稱
- 當一次執行需要效能分析時，Vitest timing artifacts，例如 `.artifacts/vitest-shard-timings.json`

只有在發布需要決定性的一般 CI，但不需要 Docker、QA Lab、live、跨 OS，
或套件機器時，才直接執行手動 CI：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker 機器位於 `OpenClaw Release Checks` 中，透過
`openclaw-live-and-e2e-checks-reusable.yml`，以及 release-mode
`install-smoke` workflow。它會透過封裝的
Docker 環境驗證發布候選，而不只是原始碼層級測試。

發布 Docker 涵蓋範圍包括：

- 啟用慢速 Bun global install smoke 的完整安裝 smoke
- 依目標 SHA 準備/重用 root Dockerfile smoke image，並將 QR、
  root/gateway、installer/Bun smoke 工作作為獨立 install-smoke
  shards 執行
- repository E2E lanes
- 發布路徑 Docker chunks：`core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 請求時在 `plugins-runtime-services` chunk 中的 OpenWebUI 涵蓋範圍
- 分割的 bundled plugin 安裝/解除安裝 lanes
  `bundled-plugin-install-uninstall-0` 到
  `bundled-plugin-install-uninstall-23`
- 當 release checks 包含 live suites 時，live/E2E provider suites 與 Docker live model 涵蓋範圍

重新執行前請先使用 Docker artifacts。發布路徑排程器會上傳
`.artifacts/docker-tests/`，其中包含 lane 記錄、`summary.json`、`failures.json`、
phase timings、scheduler plan JSON，以及重新執行命令。若要聚焦復原，
請在可重用 live/E2E workflow 上使用 `docker_lanes=<lane[,lane]>`，
而不是重新執行所有 release chunks。產生的重新執行命令會在可用時包含先前的
`package_artifact_run_id` 與已準備的 Docker image 輸入，因此
失敗的 lane 可以重用相同的 tarball 和 GHCR images。

### QA Lab

QA Lab 機器也是 `OpenClaw Release Checks` 的一部分。它是 agentic
行為與 channel-level 發布 gate，獨立於 Vitest 和 Docker
套件機制。

發布 QA Lab 涵蓋範圍包括：

- mock parity lane，使用 agentic parity pack 比較 OpenAI candidate lane 與 Opus 4.6
  baseline
- 使用 `qa-live-shared` 環境的快速 live Matrix QA profile
- 使用 Convex CI credential leases 的 live Telegram QA lane
- 當發布 telemetry 需要明確本機證明時的 `pnpm qa:otel:smoke`

使用此機器回答「發布在 QA 場景與 live channel flows 中是否行為正確？」
核准發布時，請保留 parity、Matrix 和 Telegram
lanes 的 artifact URLs。完整 Matrix 涵蓋範圍仍可作為手動分片 QA-Lab
執行，而不是預設的發布關鍵 lane。

### 套件

套件機器是可安裝產品 gate。它由
`Package Acceptance` 與解析器
`scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選正規化為
Docker E2E 使用的 `package-under-test` tarball，驗證套件 inventory，
記錄套件版本與 SHA-256，並讓 workflow harness ref 與套件來源 ref 分離。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發布
  版本
- `source=ref`：使用選定的 `workflow_ref` harness，封裝受信任的 `package_ref` 分支、
  標籤或完整提交 SHA
- `source=url`：下載需要 `package_sha256` 的 HTTPS `.tgz`
- `source=artifact`：重用另一個 GitHub Actions run 上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備的發布套件 artifact、
`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、
`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會讓 migration、update、
configured-auth update restart、stale plugin dependency cleanup、offline plugin
fixtures、plugin update，以及 Telegram package QA 對同一個已解析 tarball 執行。
阻擋發布的檢查使用預設最新已發布套件基準；`run_release_soak=true` 或
`release_profile=full` 會擴展到從
`2026.4.23` 到 `latest` 的每個穩定 npm 發布基準，加上已回報問題 fixtures。對已出貨候選請使用
`source=npm` 的 Package Acceptance，或在發布前對 SHA 支援的本機 npm tarball 使用
`source=ref`/`source=artifact`。它是先前多數需要
Parallels 才能完成的套件/update 涵蓋範圍的 GitHub-native
替代方案。跨 OS release checks 對 OS 特定 onboarding、
installer 和 platform 行為仍然重要，但套件/update 產品驗證應偏好
Package Acceptance。

更新與 Plugin 驗證的標準檢查清單是
[測試更新和 plugins](/zh-TW/help/testing-updates-plugins)。在判斷哪個本機、Docker、
Package Acceptance 或 release-check lane 可證明 plugin install/update、
doctor cleanup，或已發布套件 migration 變更時，請使用它。
從每個穩定 `2026.4.23+` 套件進行完整的已發布 update migration 是
獨立的手動 `Update Migration` workflow，不屬於 Full Release CI。

舊版套件驗收寬限是刻意設下時限的。到 `2026.4.25` 為止的套件，可以針對已發布到 npm 的中繼資料缺口使用相容路徑：tarball 中缺少私有 QA inventory 項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少持久化的 `update.channel`、舊版 Plugin install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的設定中繼資料遷移。已發布的 `2026.4.26` 套件，可能會針對已經出貨的本機建置中繼資料 stamp 檔案發出警告。後續套件必須滿足現代套件契約；相同缺口會導致版本驗證失敗。

當發布問題涉及實際可安裝套件時，請使用範圍更廣的 Package Acceptance 設定檔：

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

- `smoke`：快速套件安裝、頻道、代理、Gateway 網路與設定重新載入 lane
- `package`：安裝、更新、重新啟動、Plugin 套件契約，不含即時 ClawHub；這是 release-check 預設值
- `product`：`package` 加上 MCP 頻道、cron/subagent 清理、OpenAI 網頁搜尋與 OpenWebUI
- `full`：含 OpenWebUI 的 Docker 發布路徑區塊
- `custom`：用於聚焦重跑的精確 `docker_lanes` 清單

若要取得 package-candidate Telegram 證明，請在 Package Acceptance 啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。工作流程會把解析出的 `package-under-test` tarball 傳入 Telegram lane；獨立的 Telegram 工作流程仍接受已發布的 npm 規格，用於發布後檢查。

## 發布自動化

`OpenClaw Release Publish` 是一般會變更狀態的發布入口點。它會按照發布所需順序協調 trusted-publisher 工作流程：

1. 簽出 release tag 並解析其 commit SHA。
2. 驗證該 tag 可從 `main` 或 `release/*` 觸及。
3. 執行 `pnpm plugins:sync:check`。
4. 以 `publish_scope=all-publishable` 和 `ref=<release-sha>` 派送 `Plugin NPM Release`。
5. 以相同 scope 和 SHA 派送 `Plugin ClawHub Release`。
6. 以 release tag、npm dist-tag 和已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。

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

直接提升穩定版到 `latest` 必須明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` 工作流程。若要修復選定 Plugin，請將 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name` 傳給 `OpenClaw Release Publish`；或者在不得發布 OpenClaw 套件時，直接派送子工作流程。

## NPM 工作流程輸入

`OpenClaw NPM Release` 接受這些由操作者控制的輸入：

- `tag`：必要的 release tag，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整 40 字元的工作流程分支 commit SHA，用於僅驗證的 preflight
- `preflight_only`：`true` 代表僅驗證、建置、封裝，`false` 代表真正的發布路徑
- `preflight_run_id`：真正發布路徑必填，讓工作流程重用成功 preflight run 準備好的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受這些由操作者控制的輸入：

- `tag`：必要的 release tag；必須已經存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight run id；當 `publish_openclaw_npm=true` 時必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；只有在聚焦修復工作時才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有在將工作流程用作僅 Plugin 修復協調器時才設為 `false`

`OpenClaw Release Checks` 接受這些由操作者控制的輸入：

- `ref`：要驗證的分支、tag 或完整 commit SHA。帶有密鑰的檢查要求解析出的 commit 可從 OpenClaw 分支或 release tag 觸及。
- `run_release_soak`：在穩定版/預設 release checks 上，選擇加入完整即時/E2E、Docker 發布路徑，以及 all-since upgrade-survivor soak。`release_profile=full` 會強制啟用它。

規則：

- 穩定版和修正版 tag 可發布到 `beta` 或 `latest`
- Beta prerelease tag 只能發布到 `beta`
- 對於 `OpenClaw NPM Release`，完整 commit SHA 輸入只允許在 `preflight_only=true` 時使用
- `OpenClaw Release Checks` 和 `Full Release Validation` 永遠只做驗證
- 真正發布路徑必須使用 preflight 期間使用的相同 `npm_dist_tag`；工作流程會在發布繼續前驗證該中繼資料

## 穩定版 npm 發布順序

切出穩定版 npm 發布時：

1. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在 tag 存在前，你可以使用目前完整的工作流程分支 commit SHA，對 preflight 工作流程做僅驗證的 dry run
2. 一般 beta-first 流程選擇 `npm_dist_tag=beta`；只有在你刻意想要直接發布穩定版時，才選擇 `latest`
3. 當你想從一個手動工作流程取得一般 CI 加上即時 prompt cache、Docker、QA Lab、Matrix 和 Telegram 覆蓋率時，在 release 分支、release tag 或完整 commit SHA 上執行 `Full Release Validation`
4. 如果你刻意只需要可決定性的正常測試圖，請改在 release ref 上執行手動 `CI` 工作流程
5. 儲存成功的 `preflight_run_id`
6. 以相同的 `tag`、相同的 `npm_dist_tag` 和已儲存的 `preflight_run_id` 執行 `OpenClaw Release Publish`；它會在提升 OpenClaw npm 套件前，先將外部化 Plugin 發布到 npm 和 ClawHub
7. 如果該發布落在 `beta`，使用私有 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` 工作流程，將該穩定版本從 `beta` 提升到 `latest`
8. 如果該發布刻意直接發布到 `latest`，且 `beta` 應立即跟隨同一個穩定版建置，請使用相同的私有工作流程，將兩個 dist-tag 都指向該穩定版本，或讓其排程的自我修復同步稍後移動 `beta`

dist-tag 變更位於私有 repo 是基於安全性，因為它仍需要 `NPM_TOKEN`，而 public repo 則維持只使用 OIDC 發布。

這讓直接發布路徑與 beta-first 提升路徑都保持已文件化，且對操作者可見。

如果維護者必須退回使用本機 npm 驗證，請只在專用 tmux session 內執行任何 1Password CLI（`op`）命令。不要從主要代理 shell 直接呼叫 `op`；將它保持在 tmux 內，可讓提示、警示和 OTP 處理可被觀察，並防止重複的主機警示。

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
中的私有發布文件作為實際 runbook。

## 相關

- [發布頻道](/zh-TW/install/development-channels)
