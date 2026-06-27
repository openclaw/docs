---
read_when:
    - 尋找公開發行通道定義
    - 執行版本發布驗證或套件驗收
    - 尋找版本命名與發布節奏
summary: 發布通道、操作員檢查清單、驗證框、版本命名與發布節奏
title: 發行政策
x-i18n:
    generated_at: "2026-06-27T19:59:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw 有三個公開發布通道：

- stable：已標記的發布，預設發布到 npm `beta`，或在明確要求時發布到 npm `latest`
- beta：預發布標籤，發布到 npm `beta`
- dev：`main` 的移動最新端

## 版本命名

- 穩定發布版本：`YYYY.M.PATCH`
  - Git 標籤：`vYYYY.M.PATCH`
- 穩定修正版發布版本：`YYYY.M.PATCH-N`
  - Git 標籤：`vYYYY.M.PATCH-N`
- Beta 預發布版本：`YYYY.M.PATCH-beta.N`
  - Git 標籤：`vYYYY.M.PATCH-beta.N`
- 月份或修補版號不要補零
- 從 2026 年 6 月發布流程更新開始，第三個元件是
  依序遞增的每月發布列車編號，而不是日曆日期。穩定版與 beta
  發布會決定目前列車；僅 alpha 的標籤不會消耗或
  推進 beta/stable 修補版號。更新前的標籤與 npm 版本會保留
  既有名稱並維持有效；發布自動化會繼續依
  年、月、修補版、通道，以及預發布或修正版
  編號比較它們。
- Alpha/nightly 組建會使用下一個尚未發布的修補列車，重複組建時只
  遞增 `alpha.N`。一旦該修補版已有 beta，新的 alpha 組建
  會移到下一個修補版。選擇 beta 或 stable 列車時，請忽略修補版號
  較高的舊版僅 alpha 標籤。
- npm 版本不可變。如果 beta 標籤已經發布，不要
  刪除、重新發布或重複使用它；請切下一個 beta 編號或下一個每月
  修補版。因為 `2026.6.5-beta.1` 已在
  轉換期間發布，2026 年 6 月發布列車必須使用修補版 `5` 或更高。不要
  將新的 2026 年 6 月 stable 或 beta 列車發布為 `2026.6.2`、`2026.6.3` 或
  `2026.6.4`。
- 在 stable `2026.6.5` 之後，下一個新的 beta 列車是 `2026.6.6-beta.1`，即使
  已存在修補版號更高的自動化僅 alpha 標籤。
- `latest` 表示目前已升級的穩定 npm 發布
- `beta` 表示目前的 beta 安裝目標
- 穩定與穩定修正版發布預設發布到 npm `beta`；發布操作員可以明確指定 `latest`，或稍後升級已審核的 beta 組建
- 每個 OpenClaw 穩定發布都會一起交付 npm 套件、macOS 應用程式，以及已簽署的
  Windows Hub 安裝程式；beta 發布通常會先驗證並發布
  npm/package 路徑，原生應用程式的建置/簽署/公證/升級
  則保留給 stable，除非明確要求

## 發布節奏

- 發布採 beta 優先
- 只有在最新 beta 驗證完成後才會跟進 stable
- 維護者通常會從目前 `main` 建立的 `release/YYYY.M.PATCH` 分支切發布，
  因此發布驗證與修正不會阻塞 `main` 上的新
  開發
- 如果 beta 標籤已推送或發布且需要修正，維護者會切
  下一個 `-beta.N` 標籤，而不是刪除或重新建立舊 beta 標籤
- 詳細發布程序、核准、憑證與復原備註
  僅限維護者使用

## 發布操作員檢查清單

此檢查清單是發布流程的公開形態。私有憑證、
簽署、公證、dist-tag 復原，以及緊急回滾細節會保留在
僅限維護者的發布執行手冊中。

1. 從目前 `main` 開始：拉取最新內容，確認目標提交已推送，
   並確認目前 `main` CI 足夠綠燈，可從它建立分支。
2. 從自上一個可到達發布標籤以來合併的 PR 和所有直接
   提交產生最上方的 `CHANGELOG.md` 區段。保持條目面向使用者，
   去除重疊 PR/直接提交條目的重複，提交重寫內容、推送，
   並在建立分支前再次 rebase/pull。
3. 檢閱
   `src/plugins/compat/registry.ts` 和
   `src/commands/doctor/shared/deprecation-compat.ts` 中的發布相容性記錄。只有在升級路徑仍受到涵蓋時才移除過期
   相容性，或記錄其為何刻意保留。
4. 從目前 `main` 建立 `release/YYYY.M.PATCH`；不要直接在 `main`
   上進行一般發布工作。
5. 針對預定標籤更新每個必要版本位置，然後執行
   `pnpm release:prep`。它會以正確順序重新整理外掛版本、外掛清單、設定
   schema、內建通道設定中繼資料、設定文件基準、外掛 SDK
   匯出，以及外掛 SDK API 基準。標記前提交任何產生的
   漂移。接著執行本機確定性預檢：
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`，以及 `pnpm release:check`。
6. 以 `preflight_only=true` 執行 `OpenClaw NPM Release`。標籤存在前，
   可使用完整 40 字元發布分支 SHA 進行僅驗證
   預檢。預檢會針對
   精確簽出的依賴關係圖產生依賴發布證據，並將其儲存在 npm 預檢
   成品中。儲存成功的 `preflight_run_id`。
7. 使用 `Full Release Validation` 為發布
   分支、標籤或完整提交 SHA 啟動所有預發布測試。這是四個大型發布測試箱的唯一手動進入點：
   Vitest、Docker、QA Lab 和 Package。
8. 如果驗證失敗，請在發布分支上修正，並重新執行最小的失敗
   檔案、通道、工作流程工作、套件設定檔、供應商或模型允許清單，以
   證明修正。只有當變更的表面使既有證據過期時，
   才重新執行完整傘狀流程。
9. 針對已標記的 beta 候選版，從相符的
   `release/YYYY.M.PATCH` 分支執行
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N`。針對 stable，還要傳入必要的 Windows 來源
   發布：
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。
   此輔助程式會執行本機產生發布檢查，派送或驗證
   完整發布驗證與 npm 預檢證據，針對精確準備好的 tarball 加上 Telegram 套件
   證據執行 Parallels
   全新/更新證明，記錄外掛 npm 與 ClawHub 計畫，並且只有在證據套件全綠後才列印精確的
   `OpenClaw Release Publish` 命令。
   `OpenClaw Release Publish` 會將選取或所有可發布外掛
   套件平行派送到 npm 和同一組 ClawHub，然後在
   外掛 npm 發布成功後，立即使用相符的 dist-tag 升級
   已準備好的 OpenClaw npm 預檢成品。
   OpenClaw npm 發布子工作成功後，它會從完整相符的
   `CHANGELOG.md` 區段建立或更新相符的 GitHub release/prerelease 頁面。發布到 npm `latest` 的穩定發布會成為
   GitHub latest release；保留在 npm `beta` 的穩定維護發布會以 GitHub `latest=false`
   建立。工作流程也會將預檢
   依賴證據、完整驗證清單，以及發布後登錄檔
   驗證證據上傳到 GitHub release，以供發布後事故
   回應使用。發布工作流程會立即列印子執行 ID，自動核准
   工作流程 token 允許核准的發布環境閘門，使用日誌尾端摘要
   失敗的子工作，在 OpenClaw npm 發布成功後立即完成 GitHub release 與依賴
   證據，當正在發布 OpenClaw npm 時等待 ClawHub，然後執行 `pnpm release:verify-beta`，並
   上傳 GitHub release、npm 套件、選取的
   外掛 npm 套件、選取的 ClawHub 套件、子工作流程執行 ID，以及
   選用 NPM Telegram 執行 ID 的發布後證據。ClawHub 路徑會重試暫時性的命令列介面
   依賴安裝失敗，即使某個
   預覽儲存格偶發失敗，也會發布通過預覽的外掛，並以每個預期
   外掛版本的登錄檔驗證結束，讓部分發布保持可見且可重試。然後針對已發布的
   `openclaw@YYYY.M.PATCH-beta.N` 或
   `openclaw@beta` 套件執行發布後
   套件驗收。如果已推送或發布的預發布需要修正，
   請切下一個相符的預發布編號；不要刪除或重寫舊的
   預發布。
10. 針對 stable，只有在已審核的 beta 或候選發布具備
    必要驗證證據後才繼續。穩定 npm 發布也會透過
    `OpenClaw Release Publish`，並透過
    `preflight_run_id` 重用成功的預檢成品；穩定 macOS 發布就緒還要求
    `main` 上有已封裝的 `.zip`、`.dmg`、`.dSYM.zip`，以及更新後的 `appcast.xml`。
    macOS 發布工作流程會在發布資產驗證後自動將已簽署的 appcast 發布到公開 `main`；
    如果分支保護阻擋直接推送，它會開啟或更新 appcast PR。穩定 Windows Hub
    就緒要求 OpenClaw GitHub release 上有已簽署的 `OpenClawCompanion-Setup-x64.exe`、
    `OpenClawCompanion-Setup-arm64.exe`，以及
    `OpenClawCompanion-SHA256SUMS.txt` 資產。
    傳入精確的已簽署 `openclaw/openclaw-windows-node` 發布標籤作為
    `windows_node_tag`，並將其候選版已核准的安裝程式摘要對應表作為
    `windows_node_installer_digests`；`OpenClaw Release Publish` 會保留
    release 草稿，派送 `Windows Node Release`，並在發布前驗證全部三項
    資產。
11. 發布後，執行 npm 發布後驗證器、在需要發布後通道證明時執行選用的獨立
    published-npm Telegram E2E、
    需要時進行 dist-tag 升級，驗證產生的 GitHub release 頁面，
    執行發布公告步驟，然後在稱穩定發布完成前完成 [Stable main
    收尾](#stable-main-closeout)。

## Stable main 收尾

穩定發布必須等到 `main` 帶有實際已出貨的
發布狀態才算完成。

1. 從全新最新的 `main` 開始。以它為基準稽核 `release/YYYY.M.PATCH`，並
   forward-port `main` 中缺少的真實修正。不要盲目將僅限 release 的相容性、
   測試或驗證轉接器合併到較新的 `main`。
2. 將 `main` 設為已發布的穩定版本，而不是推測中的下一個發布列車。根版本變更後執行
   `pnpm release:prep`，接著執行
   `pnpm deps:shrinkwrap:generate`。
3. 讓 `main` 上 `CHANGELOG.md` 的 `## YYYY.M.PATCH` 區段與
   已標記的 release 分支完全一致。如果 mac
   release 發布了穩定版 `appcast.xml` 更新，也要包含它。
4. 在操作者明確啟動該發布列車之前，不要將 `YYYY.M.PATCH+1`、beta 版本，
   或空的未來 changelog 區段加入 `main`。
5. 執行 `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`，以及
   `OPENCLAW_TESTBOX=1 pnpm check:changed`。推送，然後在宣告穩定版發布完成之前，
   驗證 `origin/main` 包含已發布版本與 changelog。
6. 每次私有復原演練後，保持儲存庫變數 `RELEASE_ROLLBACK_DRILL_ID` 和
   `RELEASE_ROLLBACK_DRILL_DATE` 為最新。
   `OpenClaw Stable Main Closeout` 會從穩定版發布後、帶有已發布版本、
   changelog 與 appcast 的 `main` 推送開始。它會讀取不可變的發布後證據，
   將已發布標籤繫結到其完整發布驗證與發布執行，然後驗證穩定版 main 狀態、
   release、強制穩定版觀察期，以及阻斷性效能證據。它會將不可變的收尾資訊清單與校驗和
   附加到 GitHub release。自動推送觸發器會略過早於不可變發布後證據的舊版 release；
   它絕不會將該略過視為已完成收尾。完整收尾需要同時具備兩個資產與相符的校驗和。
   部分資訊清單會重播其記錄的 `main` SHA 與復原演練，以重新產生相同的位元組，
   然後附加缺少的校驗和；無效的配對，或沒有資訊清單的校驗和，仍會造成阻斷。
   沒有復原演練儲存庫變數的推送觸發執行會略過，且不會完成收尾；缺少或超過 90 天的
   演練記錄仍會阻斷手動、以證據支撐的收尾。私有復原命令仍保留在僅限維護者的 runbook 中。
   只有在修復或重播以證據支撐的穩定版收尾時，才使用手動觸發。
   舊版備援修正標籤只有在修正標籤解析到與基礎穩定版標籤相同的來源提交時，
   才可重用基礎套件證據。來源不同的修正必須發布並驗證其自身的套件證據。

## Release 預檢

- 在發布預檢前執行 `pnpm check:test-types`，讓測試 TypeScript 在較快的本機 `pnpm check` 關卡之外也保持涵蓋
- 在發布預檢前執行 `pnpm check:architecture`，讓較廣的匯入循環與架構邊界檢查在較快的本機關卡之外也保持綠燈
- 在 `pnpm release:check` 前執行 `pnpm build && pnpm ui:build`，讓預期的 `dist/*` 發布成品與 Control UI bundle 存在，以供封裝驗證步驟使用
- 在根版本號提升後、標記前執行 `pnpm release:prep`。它會執行每個在版本/設定/API 變更後常見漂移的確定性發布產生器：外掛版本、外掛清單、基礎設定 schema、內建頻道設定中繼資料、設定文件基準、外掛 SDK 匯出，以及外掛 SDK API 基準。`pnpm release:check` 會以檢查模式重新執行這些防護，並在執行套件發布檢查前，於單次流程中回報它找到的每個產生內容漂移失敗。
- 外掛版本同步預設會將官方外掛套件版本與現有的 `openclaw.compat.pluginApi` 最低版本更新為 OpenClaw 發布版本。請將該欄位視為外掛 SDK/執行階段 API 的最低版本，而不只是套件版本的副本：對於刻意維持相容於較舊 OpenClaw 主機的外掛專屬發布，請將最低版本保留在最舊支援的主機 API，並在外掛發布證明中記錄此選擇。
- 在發布核准前執行手動 `Full Release Validation` workflow，從單一入口點啟動所有發布前測試盒。它接受分支、標籤或完整 commit SHA，派發手動 `CI`，並派發 `OpenClaw Release Checks` 以進行安裝煙霧測試、套件驗收、跨作業系統套件檢查、QA Lab 對等性、Matrix 與 Telegram lanes。穩定版與完整執行一律包含詳盡的 live/E2E 與 Docker 發布路徑 soak；`run_release_soak=true` 保留用於明確的 beta soak。套件驗收在候選版本驗證期間提供標準套件 Telegram E2E，避免第二個並行 live poller。
  發布 beta 後提供 `release_package_spec`，以便在發布檢查、套件驗收與套件 Telegram E2E 中重用已發布的 npm 套件，而不重新建置發布 tarball。只有在 Telegram 應使用不同於其餘發布驗證的已發布套件時，才提供 `npm_telegram_package_spec`。當套件驗收應使用不同於發布套件規格的已發布套件時，提供 `package_acceptance_package_spec`。當發布證據報告應證明驗證符合已發布的 npm 套件、但不強制執行 Telegram E2E 時，提供 `evidence_package_spec`。
  範例：
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- 當你想在發布工作繼續進行時，為套件候選版本取得旁路證明，請執行手動 `Package Acceptance` workflow。對 `openclaw@beta`、`openclaw@latest` 或精確發布版本使用 `source=npm`；使用 `source=ref` 以目前的 `workflow_ref` harness 封裝受信任的 `package_ref` 分支/標籤/SHA；對具備必要 SHA-256 與嚴格公開 URL 政策的公開 HTTPS tarball 使用 `source=url`；對使用必要 `trusted_source_id` 與 SHA-256 的具名受信任來源政策使用 `source=trusted-url`；或對另一個 GitHub Actions 執行上傳的 tarball 使用 `source=artifact`。該 workflow 會將候選版本解析為 `package-under-test`，針對該 tarball 重用 Docker E2E 發布排程器，並可使用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier` 對同一個 tarball 執行 Telegram QA。當選取的 Docker lanes 包含 `published-upgrade-survivor` 時，套件 artifact 是候選版本，而 `published_upgrade_survivor_baseline` 會選取已發布的基準版本。`update-restart-auth` 會將候選套件同時作為已安裝的命令列介面與 package-under-test，因此會演練候選版本更新命令的受管重新啟動路徑。
  範例：`gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  常見 profile：
  - `smoke`：安裝/頻道/agent、閘道網路與設定重新載入 lanes
  - `package`：不含 OpenWebUI 或 live ClawHub 的 artifact 原生套件/更新/重新啟動/外掛 lanes
  - `product`：套件 profile 加上 MCP 頻道、排程/subagent 清理、OpenAI 網路搜尋與 OpenWebUI
  - `full`：含 OpenWebUI 的 Docker 發布路徑區塊
  - `custom`：用於聚焦重跑的精確 `docker_lanes` 選取
- 當你只需要發布候選版本的確定性一般 CI 涵蓋時，直接執行手動 `CI` workflow。手動 CI 派發會略過變更範圍界定，並強制執行 Linux 節點 shards、內建外掛 shards、外掛與頻道 contract shards、節點 22 相容性、`check-*`、`check-additional-*`、建置 artifact 煙霧檢查、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n lanes。獨立手動 CI 只有在以 `include_android=true` 派發時才會執行 Android；`Full Release Validation` 會將該輸入傳給其 CI 子項。
  含 Android 的範例：`gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- 驗證發布 telemetry 時執行 `pnpm qa:otel:smoke`。它會透過本機 OTLP/HTTP 接收器演練 QA-lab，並驗證 trace、metric 與 log 匯出，以及受限的 trace attributes 與內容/識別碼遮蔽，不需要 Opik、Langfuse 或其他外部 collector。
- 驗證 collector 相容性時執行 `pnpm qa:otel:collector-smoke`。它會先透過真正的 OpenTelemetry Collector Docker 容器路由同一個 QA-lab OTLP 匯出，再執行本機接收器斷言。
- 驗證受保護的 Prometheus scraping 時執行 `pnpm qa:prometheus:smoke`。它會演練 QA-lab、拒絕未驗證的 scrape，並驗證發布關鍵 metric families 不含 prompt 內容、原始識別碼、auth token 與本機路徑。
- 當你想連續執行來源 checkout 的 OpenTelemetry 與 Prometheus 煙霧 lanes 時，執行 `pnpm qa:observability:smoke`。
- 每次標記發布前執行 `pnpm release:check`
- `OpenClaw NPM Release` 預檢會在封裝 npm tarball 前產生相依性發布證據。npm advisory 漏洞關卡會阻擋發布。遞移 manifest 風險、相依性擁有權/安裝表面，以及相依性變更報告僅作為發布證據。相依性變更報告會將發布候選版本與前一個可到達的發布標籤比較。
- 預檢會將相依性證據上傳為 `openclaw-release-dependency-evidence-<tag>`，並同時將其嵌入已準備的 npm 預檢 artifact 內的 `dependency-evidence/`。真正的發布路徑會重用該預檢 artifact，然後將同一份證據以 `openclaw-<version>-dependency-evidence.zip` 附加到 GitHub release。
- 標籤存在後，執行 `OpenClaw Release Publish` 以進行會變更狀態的發布序列。從 `release/YYYY.M.PATCH` 派發它（或在發布 main 可到達的標籤時從 `main` 派發），傳入發布標籤、成功的 OpenClaw npm `preflight_run_id`，以及成功的 `full_release_validation_run_id`，並保留預設外掛發布範圍 `all-publishable`，除非你刻意執行聚焦修復。該 workflow 會序列化外掛 npm 發布、外掛 ClawHub 發布與 OpenClaw npm 發布，因此 core 套件不會在其外部化外掛之前發布。
- 穩定版 `OpenClaw Release Publish` 需要在相符的非 prerelease `openclaw/openclaw-windows-node` release 存在後，提供精確的 `windows_node_tag`。它也需要候選版本已核准的 `windows_node_installer_digests` map。在派發任何發布子項前，它會驗證來源 release 已發布、非 prerelease、包含必要的 x64/ARM64 installer，且仍符合該已核准 map。接著它會在 OpenClaw release 仍為草稿時派發 `Windows Node Release`，並原封不動攜帶釘選的 installer digest map。子 workflow 會從該精確標籤下載已簽署的 Windows Hub installer，與釘選 digest 比對，在 Windows runner 上驗證其 Authenticode 簽章使用預期的 OpenClaw Foundation 簽署者，寫入 SHA-256 manifest，並將 installer 與 manifest 上傳到標準 OpenClaw GitHub release，然後重新下載已提升的 assets，並驗證 manifest 成員與 hash。父項會在發布前驗證目前的 x64、ARM64 與 checksum asset contract。直接復原會在用釘選來源 bytes 取代預期 contract assets 前，拒絕非預期的 `OpenClawCompanion-*` asset 名稱。只有在復原時才手動派發 `Windows Node Release`，且一律傳入精確標籤，絕不可傳 `latest`，並傳入已核准來源 release 的明確 `expected_installer_digests` JSON map。網站下載連結應指向目前穩定版的精確 OpenClaw release asset URL，或只在確認 GitHub 的 latest redirect 指向同一個 release 後，才使用 `releases/latest/download/...`；不要只連到 companion repo release 頁面。
- 發布檢查現在於獨立的手動 workflow 中執行：
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` 也會在發布核准前執行 QA Lab mock parity lane，加上快速 live Matrix profile 與 Telegram QA lane。live lanes 使用 `qa-live-shared` environment；Telegram 也使用 Convex CI credential leases。當你想並行取得完整 Matrix transport、media 與 E2EE inventory 時，請以 `matrix_profile=all` 和 `matrix_shards=true` 執行手動 `QA-Lab - All Lanes` workflow。
- 跨作業系統安裝與升級執行階段驗證是公開 `OpenClaw Release Checks` 與 `Full Release Validation` 的一部分，兩者會直接呼叫可重用 workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- 這個拆分是刻意的：保持真正的 npm 發布路徑短、確定性且聚焦於 artifact，同時讓較慢的 live 檢查留在自己的 lane 中，避免拖慢或阻擋發布
- 帶有 secret 的發布檢查應透過 `Full Release Validation` 派發，或從 `main`/release workflow ref 派發，讓 workflow 邏輯與 secrets 維持受控
- `OpenClaw Release Checks` 接受分支、標籤或完整 commit SHA，只要解析出的 commit 可從 OpenClaw 分支或發布標籤到達
- `OpenClaw NPM Release` 僅驗證預檢也接受目前完整 40 字元 workflow 分支 commit SHA，不需要已推送標籤
- 該 SHA 路徑僅供驗證，不能提升為真正發布
- 在 SHA 模式中，workflow 只會為套件中繼資料檢查合成 `v<package.json version>`；真正發布仍需要真正的發布標籤
- 兩個 workflow 都讓真正發布與提升路徑留在 GitHub-hosted runners 上，而不會變更狀態的驗證路徑可使用較大的 Blacksmith Linux runners
- 該 workflow 會使用 `OPENAI_API_KEY` 與 `ANTHROPIC_API_KEY` workflow secrets 執行
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- npm 發布預檢不再等待獨立的發布檢查 lane
- 在本機標記發布候選版本前，執行 `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`。該 helper 會依照能在 GitHub 發布 workflow 開始前抓出常見核准阻擋錯誤的順序，執行快速發布防護、外掛 npm/ClawHub 發布檢查、建置、UI 建置與 `release:openclaw:npm:check`。
- 核准前執行 `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（或相符的 beta/correction 標籤）
- npm 發布後，執行
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  （或相符的 beta/修正版）以在全新的暫存前綴中驗證已發布登錄檔的
  安裝路徑
- beta 發布後，執行 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  以使用共享租用的 Telegram 憑證
  集區，針對已發布的 npm 套件驗證已安裝套件的入門設定、Telegram 設定，以及真實 Telegram E2E。
  本機維護者的一次性執行可以省略 Convex 變數，並直接傳入三個
  `OPENCLAW_QA_TELEGRAM_*` 環境憑證。
- 若要從維護者機器執行完整的發布後 beta 煙霧測試，請使用 `pnpm release:beta-smoke -- --beta betaN`。此輔助程式會執行 Parallels npm 更新/全新目標驗證、派送 `NPM Telegram Beta E2E`、輪詢確切的工作流程執行、下載成品，並列印 Telegram 報告。
- 維護者也可以透過 GitHub Actions 中的
  手動 `NPM Telegram Beta E2E` 工作流程執行相同的發布後檢查。它刻意僅能手動執行，
  不會在每次合併時執行。
- 維護者發布自動化現在使用預檢後再提升：
  - 真實 npm 發布必須通過成功的 npm `preflight_run_id`
  - 真實 npm 發布必須從與成功預檢執行相同的 `main` 或
    `release/YYYY.M.PATCH` 分支派送
  - stable npm 發布預設為 `beta`
  - stable npm 發布可以透過工作流程輸入明確指定 `latest`
  - 基於權杖的 npm dist-tag 變更現在位於
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`，因為
    `npm dist-tag add` 仍需要 `NPM_TOKEN`，而原始碼儲存庫維持
    僅 OIDC 發布
  - 公開的 `macOS Release` 僅供驗證；當標籤只存在於
    release 分支，但工作流程是從 `main` 派送時，請設定
    `public_release_branch=release/YYYY.M.PATCH`
  - 真實 macOS 發布必須通過成功的 macOS `preflight_run_id` 和
    `validate_run_id`
  - 真實發布路徑會提升已準備好的成品，而不是再次重新建置
- 對於像 `YYYY.M.PATCH-N` 這樣的 stable 修正版發布，發布後驗證器
  也會檢查從 `YYYY.M.PATCH` 到 `YYYY.M.PATCH-N` 的相同暫存前綴升級路徑，
  因此發布修正不會悄悄讓較舊的全域安裝停留在
  基礎 stable 負載
- npm 發布預檢會採取失敗關閉策略，除非 tarball 同時包含
  `dist/control-ui/index.html` 和非空的 `dist/control-ui/assets/` 負載，
  這樣我們才不會再次發布空白的瀏覽器儀表板
- 發布後驗證也會檢查已發布的外掛進入點和
  套件中繼資料是否存在於已安裝的登錄檔版面配置中。若發布缺少外掛執行階段負載，
  將無法通過發布後驗證器，
  且不能提升為 `latest`。
- `pnpm test:install:smoke` 也會對候選更新 tarball 強制執行 npm pack `unpackedSize` 預算，
  因此安裝程式 e2e 會在發布流程之前
  捕捉意外的打包膨脹
- 如果發布工作觸及 CI 規劃、擴充功能時間資訊清單或
  擴充功能測試矩陣，請在核准前，從
  `.github/workflows/plugin-prerelease.yml` 重新產生並審查由規劃器擁有的
  `plugin-prerelease-extension-shard` 矩陣輸出，避免發布說明
  描述過時的 CI 版面配置
- Stable macOS 發布就緒狀態也包含更新程式介面：
  - GitHub 發布最終必須包含已封裝的 `.zip`、`.dmg` 和 `.dSYM.zip`
  - 發布後，`main` 上的 `appcast.xml` 必須指向新的 stable zip；macOS 發布工作流程會自動提交它，
    或在直接推送受阻時開啟 appcast
    PR
  - 已封裝的應用程式必須保留非偵錯 bundle id、非空的 Sparkle feed
    URL，以及等於或高於該發布版本標準 Sparkle 建置下限的 `CFBundleVersion`

## 發布測試箱

`Full Release Validation` 是操作人員從單一進入點啟動所有預發布測試的方式。若要在快速變動分支上取得釘選提交的證明，請使用輔助工具，讓每個子工作流程都從固定在目標 SHA 的暫存分支執行：

```bash
pnpm ci:full-release --sha <full-sha>
```

輔助工具會推送 `release-ci/<sha>-...`、從該分支以 `ref=<sha>` 分派 `Full Release Validation`、驗證每個子工作流程的 `headSha` 都符合目標，然後刪除暫存分支。這可避免意外證明到較新的 `main` 子執行。

若要驗證發布分支或標籤，請從受信任的 `main` 工作流程 ref 執行，並將發布分支或標籤作為 `ref` 傳入：

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

工作流程會解析目標 ref、以 `target_ref=<release-ref>` 分派手動 `CI`，然後分派 `OpenClaw Release Checks`。`OpenClaw Release Checks` 會展開安裝冒煙測試、跨作業系統發布檢查、啟用 soak 時的 live/E2E Docker 發布路徑涵蓋、包含標準 Telegram 套件 E2E 的 Package Acceptance、QA Lab 對等性、live Matrix，以及 live Telegram。只有當 `Full Release Validation` 摘要顯示 `normal_ci`、`plugin_prerelease` 和 `release_checks` 成功時，完整/all 執行才可接受，除非聚焦重跑刻意略過了獨立的 `Plugin
Prerelease` 子項。僅在使用 `release_package_spec` 或 `npm_telegram_package_spec` 進行聚焦已發布套件重跑時，才使用獨立的 `npm-telegram` 子項。最終驗證器摘要會包含每個子執行的最慢工作表格，因此發布管理員不必下載記錄即可查看目前的關鍵路徑。
請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解完整階段矩陣、確切工作流程工作名稱、stable 與 full 設定檔差異、成品，以及聚焦重跑控制項。
子工作流程會從執行 `Full Release Validation` 的受信任 ref 分派，通常是 `--ref main`，即使目標 `ref` 指向較舊的發布分支或標籤也是如此。沒有獨立的 Full Release Validation 工作流程 ref 輸入；請透過選擇工作流程執行 ref 來選擇受信任的測試框架。
不要對移動中的 `main` 使用 `--ref main -f ref=<sha>` 來取得精確提交證明；原始提交 SHA 不能作為工作流程分派 ref，因此請使用 `pnpm ci:full-release --sha <sha>` 建立釘選的暫存分支。

使用 `release_profile` 選擇 live/provider 的涵蓋廣度：

- `minimum`：最快的發布關鍵 OpenAI/core live 與 Docker 路徑
- `stable`：minimum 加上發布核准所需的穩定 provider/backend 涵蓋
- `full`：stable 加上廣泛的 advisory provider/media 涵蓋

stable 和 full 驗證在推廣前一律執行完整的 live/E2E、Docker 發布路徑，以及有界的已發布升級倖存者掃描。
使用 `run_release_soak=true` 為 beta 請求相同掃描。該掃描涵蓋最新四個 stable 套件，以及釘選的 `2026.4.23` 和 `2026.5.2` 基準，加上較舊的 `2026.4.15` 涵蓋；重複基準會被移除，且每個基準都會切分到自己的 Docker runner 工作中。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將目標 ref 解析一次為 `release-package-under-test`，並在 soak 執行時於跨作業系統、Package Acceptance 和發布路徑 Docker 檢查中重用該成品。這可讓所有面向套件的測試箱使用相同位元組，並避免重複建置套件。
beta 已經發布到 npm 後，設定 `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`，讓發布檢查下載已出貨套件一次、從 `dist/build-info.json` 擷取其建置來源 SHA，並將該成品重用於跨作業系統、Package Acceptance、發布路徑 Docker，以及套件 Telegram 測試線。
跨作業系統 OpenAI 安裝冒煙測試會在 repo/org 變數已設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因為此測試線是在證明套件安裝、onboarding、閘道啟動，以及一次 live agent turn，而不是評測最慢的預設模型。較廣泛的 live provider 矩陣仍然是模型特定涵蓋的位置。

依發布階段使用這些變體：

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

不要將完整總傘工作流程作為聚焦修正後的第一次重跑。如果有一個測試箱失敗，下一次證明請使用失敗的子工作流程、工作、Docker 測試線、套件設定檔、模型 provider 或 QA 測試線。只有當修正變更了共用發布編排，或讓先前的全測試箱證據過期時，才再次執行完整總傘工作流程。總傘工作流程的最終驗證器會重新檢查已記錄的子工作流程執行 ID，因此在子工作流程成功重跑後，只需重跑失敗的 `Verify full validation` 父工作。

若要進行有界復原，請將 `rerun_group` 傳給總傘工作流程。`all` 是真正的發布候選執行，`ci` 只執行一般 CI 子項，`plugin-prerelease` 只執行發布專用外掛子項，`release-checks` 執行每個發布測試箱，而較窄的發布群組為 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 和 `npm-telegram`。
聚焦 `npm-telegram` 重跑需要 `release_package_spec` 或 `npm_telegram_package_spec`；完整/all 執行會使用 Package Acceptance 內的標準套件 Telegram E2E。聚焦跨作業系統重跑可以加入 `cross_os_suite_filter=windows/packaged-upgrade` 或另一個 OS/suite 篩選器。QA 發布檢查失敗會阻擋一般發布驗證，包括標準層所需的 OpenClaw 動態工具漂移。Tideclaw alpha 執行仍可將非套件安全性的發布檢查測試線視為 advisory。當 `live_suite_filter` 明確請求 gated QA live 測試線，例如 Discord、WhatsApp 或 Slack 時，必須啟用相符的 `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 變數；否則輸入擷取會失敗，而不是靜默略過該測試線。

### Vitest

Vitest 測試箱是手動 `CI` 子工作流程。手動 CI 會刻意略過變更範圍限制，並強制發布候選執行一般測試圖：Linux 節點 shards、bundled-plugin shards、外掛與頻道合約 shards、節點 22 相容性、`check-*`、`check-additional-*`、建置成品冒煙檢查、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n。當 `Full Release Validation` 執行此測試箱時會包含 Android，因為總傘工作流程會傳入 `include_android=true`；獨立手動 CI 需要 `include_android=true` 才有 Android 涵蓋。

使用此測試箱回答「原始碼樹是否通過完整的一般測試套件？」它不同於發布路徑產品驗證。要保留的證據：

- 顯示已分派 `CI` 執行 URL 的 `Full Release Validation` 摘要
- `CI` 在確切目標 SHA 上為綠燈
- 調查回歸時來自 CI 工作的失敗或緩慢 shard 名稱
- 需要效能分析時的 Vitest 計時成品，例如 `.artifacts/vitest-shard-timings.json`

只有當發布需要確定性的一般 CI，但不需要 Docker、QA Lab、live、跨作業系統或套件測試箱時，才直接執行手動 CI。非 Android 直接 CI 使用第一個命令。當直接發布候選 CI 必須涵蓋 Android 時，加入 `include_android=true`：

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker 測試箱位於 `OpenClaw Release Checks`，透過 `openclaw-live-and-e2e-checks-reusable.yml`，再加上 release-mode 的 `install-smoke` 工作流程。它透過打包的 Docker 環境驗證發布候選，而不只是原始碼層級測試。

發布 Docker 涵蓋包括：

- 啟用較慢 Bun 全域安裝冒煙測試的完整安裝冒煙測試
- 依目標 SHA 準備/重用 root Dockerfile 冒煙映像，QR、root/gateway 和 installer/Bun 冒煙工作會作為獨立 install-smoke shards 執行
- repository E2E 測試線
- 發布路徑 Docker 區塊：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g` 和 `plugins-runtime-install-h`
- 請求時位於 `plugins-runtime-services` 區塊內的 OpenWebUI 涵蓋
- 分拆的 bundled 外掛安裝/解除安裝測試線，從 `bundled-plugin-install-uninstall-0` 到 `bundled-plugin-install-uninstall-23`
- 當發布檢查包含 live suites 時的 live/E2E provider suites 與 Docker live model 涵蓋

重跑前先使用 Docker 成品。發布路徑排程器會上傳 `.artifacts/docker-tests/`，其中包含測試線記錄、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON，以及重跑命令。若要聚焦復原，請在可重用的 live/E2E 工作流程上使用 `docker_lanes=<lane[,lane]>`，而不是重跑所有發布區塊。產生的重跑命令會在可用時包含先前的 `package_artifact_run_id` 和已準備的 Docker 映像輸入，因此失敗的測試線可以重用相同 tarball 與 GHCR 映像。

### QA Lab

QA Lab 測試箱也是 `OpenClaw Release Checks` 的一部分。它是 agentic 行為與頻道層級的發布閘門，與 Vitest 和 Docker 套件機制分開。

發布 QA Lab 涵蓋包括：

- 使用 agentic parity pack，比較 OpenAI candidate 測試線與 Opus 4.6 基準的 mock parity 測試線
- 使用 `qa-live-shared` 環境的快速 live Matrix QA 設定檔
- 使用 Convex CI 憑證租約的 live Telegram QA 測試線
- 當發布 telemetry 需要明確本機證明時的 `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`

使用此測試箱回答「發布在 QA 情境與 live 頻道流程中的行為是否正確？」核准發布時，請保留 parity、Matrix 和 Telegram 測試線的成品 URL。完整 Matrix 涵蓋仍可作為手動分片 QA-Lab 執行使用，而不是預設的發布關鍵測試線。

### 套件

套件測試箱是可安裝產品閘門。它由 `Package Acceptance` 和解析器 `scripts/resolve-openclaw-package-candidate.mjs` 支援。解析器會將候選項正規化為 Docker E2E 使用的 `package-under-test` tarball、驗證套件清單、記錄套件版本與 SHA-256，並將工作流程測試框架 ref 與套件來源 ref 分開。

支援的候選來源：

- `source=npm`：`openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發行版本
- `source=ref`：使用所選的 `workflow_ref` 測試框架，打包受信任的 `package_ref` 分支、標籤或完整 commit SHA
- `source=url`：下載公開 HTTPS `.tgz`，且必須提供 `package_sha256`；會拒絕 URL 認證資訊、非預設 HTTPS 連接埠、私人/內部/特殊用途主機名稱或解析後位址，以及不安全的重新導向
- `source=trusted-url`：從 `.github/package-trusted-sources.json` 中具名政策下載 HTTPS `.tgz`，且必須提供 `package_sha256` 和 `trusted_source_id`；維護者擁有的企業鏡像或私有套件儲存庫請使用此項，而不是替 `source=url` 新增輸入層級的私人網路繞過
- `source=artifact`：重用另一個 GitHub Actions 執行上傳的 `.tgz`

`OpenClaw Release Checks` 會使用 `source=artifact`、已準備好的發行套件 artifact、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` 執行 Package Acceptance。Package Acceptance 會針對相同解析出的 tarball 保留遷移、更新、已設定認證的更新重新啟動、即時 ClawHub skill 安裝、過期外掛相依性清理、離線外掛 fixtures、外掛更新，以及 Telegram 套件 QA。阻擋式發行檢查使用預設最新已發布套件基準；含 `run_release_soak=true`、`release_profile=stable` 或 `release_profile=full` 的 beta profile，會擴展到從 `2026.4.23` 到 `latest` 的每個穩定 npm 已發布基準，加上已回報問題的 fixtures。已出貨候選版本使用含 `source=npm` 的 Package Acceptance；發布前由 SHA 支援的本機 npm tarball 使用 `source=ref`；維護者擁有的企業/私人鏡像使用 `source=trusted-url`；另一個 GitHub Actions 執行上傳的已準備 tarball 使用 `source=artifact`。它是 GitHub 原生替代方案，可取代先前大多需要 Parallels 的套件/更新覆蓋範圍。跨 OS 發行檢查對 OS 特定的 onboarding、安裝程式與平台行為仍然重要，但套件/更新的產品驗證應優先使用 Package Acceptance。

更新與外掛驗證的權威檢查清單是 [測試更新與外掛](/zh-TW/help/testing-updates-plugins)。在判斷哪個本機、Docker、Package Acceptance 或發行檢查 lane 能證明外掛安裝/更新、doctor 清理，或已發布套件遷移變更時，請使用它。從每個穩定 `2026.4.23+` 套件進行的完整已發布更新遷移，是獨立的手動 `Update Migration` workflow，不屬於 Full Release CI。

舊版 package-acceptance 寬容性刻意設有時限。到 `2026.4.25` 為止的套件，可針對已發布到 npm 的中繼資料缺口使用相容路徑：tarball 中缺少私人 QA inventory entries、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少持久化的 `update.channel`、舊版外掛 install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的 config metadata 遷移。已發布的 `2026.4.26` 套件可針對已出貨的本機建置中繼資料 stamp 檔案發出警告。較新的套件必須符合現代套件契約；相同缺口會導致發行驗證失敗。

當發行問題涉及實際可安裝套件時，請使用較廣的 Package Acceptance profiles：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

常見套件 profiles：

- `smoke`：快速套件安裝/channel/agent、閘道網路與 config reload lanes
- `package`：安裝/更新/重新啟動/外掛套件契約，加上即時 ClawHub skill 安裝證明；這是發行檢查預設值
- `product`：`package` 加上 MCP channels、cron/subagent cleanup、OpenAI web search 與 OpenWebUI
- `full`：含 OpenWebUI 的 Docker release-path chunks
- `custom`：用於聚焦重新執行的確切 `docker_lanes` 清單

若要進行套件候選版本的 Telegram 證明，請在 Package Acceptance 上啟用 `telegram_mode=mock-openai` 或 `telegram_mode=live-frontier`。該 workflow 會將解析後的 `package-under-test` tarball 傳入 Telegram lane；獨立 Telegram workflow 仍接受已發布的 npm spec，用於發布後檢查。

## 發行發布自動化

`OpenClaw Release Publish` 是一般會變更狀態的發布進入點。它會依發行所需順序協調 trusted-publisher workflows：

1. 簽出發行標籤並解析其 commit SHA。
2. 驗證標籤可從 `main` 或 `release/*` 觸及。
3. 執行 `pnpm plugins:sync:check`。
4. 使用 `publish_scope=all-publishable` 和 `ref=<release-sha>` 派發 `Plugin NPM Release`。
5. 使用相同 scope 和 SHA 派發 `Plugin ClawHub Release`。
6. 在驗證已儲存的 `full_release_validation_run_id` 後，使用發行標籤、npm dist-tag 與已儲存的 `preflight_run_id` 派發 `OpenClaw NPM Release`。
7. 對穩定發行，建立或更新 GitHub release 為草稿，使用明確的 `windows_node_tag` 和候選版本已核准的 `windows_node_installer_digests` 派發 `Windows Node Release`，並在發布草稿前驗證權威安裝程式/checksum assets。

Beta 發布範例：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

穩定版本發布到預設 beta dist-tag：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

直接提升穩定版本到 `latest` 必須明確指定：

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

只有在聚焦修復或重新發布工作時，才使用較低階的 `Plugin NPM Release` 和 `Plugin ClawHub Release` workflows。當 `publish_openclaw_npm=true` 時，`OpenClaw Release Publish` 會拒絕 `plugin_publish_scope=selected`，因此核心套件不能在缺少任何可發布官方外掛的情況下出貨，包括 `@openclaw/diffs-language-pack`。若要修復選定外掛，請設定 `publish_openclaw_npm=false` 搭配 `plugin_publish_scope=selected` 和 `plugins=@openclaw/name`，或直接派發子 workflow。

## NPM workflow 輸入

`OpenClaw NPM Release` 接受這些由操作員控制的輸入：

- `tag`：必要發行標籤，例如 `v2026.4.2`、`v2026.4.2-1` 或 `v2026.4.2-beta.1`；當 `preflight_only=true` 時，也可以是目前完整 40 字元 workflow-branch commit SHA，用於僅驗證的 preflight
- `preflight_only`：`true` 表示僅驗證/建置/打包，`false` 表示真正的發布路徑
- `preflight_run_id`：真正發布路徑必填，讓 workflow 重用成功 preflight 執行準備好的 tarball
- `npm_dist_tag`：發布路徑的 npm 目標標籤；預設為 `beta`

`OpenClaw Release Publish` 接受這些由操作員控制的輸入：

- `tag`：必要發行標籤；必須已存在
- `preflight_run_id`：成功的 `OpenClaw NPM Release` preflight run id；當 `publish_openclaw_npm=true` 時必填
- `full_release_validation_run_id`：成功的 `Full Release Validation` run id；當 `publish_openclaw_npm=true` 時必填
- `windows_node_tag`：確切的非預發行 `openclaw/openclaw-windows-node` release tag；穩定 OpenClaw 發布必填
- `windows_node_installer_digests`：候選版本已核准的精簡 JSON map，將目前 Windows 安裝程式名稱對應到其釘選的 `sha256:` digest；穩定 OpenClaw 發布必填
- `npm_dist_tag`：OpenClaw 套件的 npm 目標標籤
- `plugin_publish_scope`：預設為 `all-publishable`；只有在 `publish_openclaw_npm=false` 且進行聚焦的外掛專用修復工作時，才使用 `selected`
- `plugins`：當 `plugin_publish_scope=selected` 時，以逗號分隔的 `@openclaw/*` 套件名稱
- `publish_openclaw_npm`：預設為 `true`；只有在將 workflow 作為外掛專用修復協調器時，才設定為 `false`
- `wait_for_clawhub`：預設為 `false`，使 npm 可用性不會被 ClawHub sidecar 阻擋；只有在 workflow 完成必須包含 ClawHub 完成時，才設定為 `true`

`OpenClaw Release Checks` 接受這些由操作員控制的輸入：

- `ref`：要驗證的分支、標籤或完整 commit SHA。帶有 secret 的檢查要求解析後的 commit 可從 OpenClaw 分支或 release tag 觸及。
- `run_release_soak`：選擇加入 beta 發行檢查的完整 live/E2E、Docker release-path，以及 all-since upgrade-survivor soak。`release_profile=stable` 和 `release_profile=full` 會強制啟用它。

規則：

- 穩定與修正標籤可發布到 `beta` 或 `latest`
- Beta 預發行標籤只能發布到 `beta`
- 對 `OpenClaw NPM Release`，只有在 `preflight_only=true` 時才允許完整 commit SHA 輸入
- `OpenClaw Release Checks` 和 `Full Release Validation` 一律僅作驗證
- 真正發布路徑必須使用 preflight 期間使用的相同 `npm_dist_tag`；workflow 會在發布前驗證該中繼資料仍一致

## 穩定 npm 發行順序

切穩定 npm 發行時：

1. 使用 `preflight_only=true` 執行 `OpenClaw NPM Release`
   - 在標籤存在之前，你可以使用目前完整工作流程分支提交的
     SHA，對預檢工作流程進行僅驗證的 dry run
2. 一般的 beta 優先流程請選擇 `npm_dist_tag=beta`，只有在你有意直接發布穩定版時
   才選擇 `latest`
3. 當你想從單一手動工作流程取得一般 CI 加上即時提示快取、Docker、QA Lab、
   Matrix 與 Telegram 涵蓋範圍時，請在發行分支、發行標籤或完整
   提交 SHA 上執行 `Full Release Validation`
4. 如果你有意只需要具決定性的正常測試圖，請改在發行 ref 上執行
   手動 `CI` 工作流程
5. 選取確切的非預發行 `openclaw/openclaw-windows-node` 發行標籤，
   其已簽署的 x64 與 ARM64 安裝程式將用於出貨。將它儲存為
   `windows_node_tag`，並將其已驗證的摘要對照表儲存為
   `windows_node_installer_digests`。發行候選輔助工具會記錄兩者，
   並將它們包含在其產生的發布命令中。
6. 儲存成功的 `preflight_run_id` 與 `full_release_validation_run_id`
7. 使用相同的 `tag`、相同的 `npm_dist_tag`、所選的 `windows_node_tag`、
   其已儲存的 `windows_node_installer_digests`、已儲存的
   `preflight_run_id`，以及已儲存的 `full_release_validation_run_id`
   執行 `OpenClaw Release Publish`；它會先將外部化的外掛發布到 npm 和 ClawHub，
   再提升 OpenClaw npm 套件
8. 如果發行已落在 `beta`，請使用
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   工作流程，將該穩定版本從 `beta` 提升到 `latest`
9. 如果發行有意直接發布到 `latest`，且 `beta` 應立即跟隨相同的穩定建置，
   請使用同一個發行工作流程，將兩個 dist-tag 都指向該穩定版本，或讓其排程的
   自我修復同步稍後移動 `beta`

dist-tag 變更位於發行台帳 repo，因為它仍然需要
`NPM_TOKEN`，而原始碼 repo 保持僅使用 OIDC 的發布。

這會讓直接發布路徑與 beta 優先提升路徑都保持有文件記載，並對操作者可見。

如果維護者必須退回使用本機 npm 驗證，請只在專用 tmux 工作階段內執行任何 1Password
命令列介面 (`op`) 命令。不要直接從主要代理 shell 呼叫 `op`；將它保持在 tmux 內，
可讓提示、警示與 OTP 處理變得可觀察，並防止重複的主機警示。

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
中的私有發行文件作為實際執行手冊。

## 相關

- [發行通道](/zh-TW/install/development-channels)
