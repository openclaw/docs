---
read_when:
    - 變更 OpenClaw 更新、診斷、套件驗收或外掛安裝行為
    - 準備或核准候選版本
    - 偵錯套件更新、外掛相依性清理或外掛安裝回歸問題
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件遷移，以及外掛安裝／更新行為
title: 測試：更新與外掛
x-i18n:
    generated_at: "2026-07-11T21:26:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

更新與外掛驗證檢查清單：證明可安裝套件能夠更新真實使用者狀態、透過 `doctor` 修復過時的舊版狀態，並且仍能從所有支援的來源安裝、載入、更新及解除安裝外掛。

如需更完整的測試執行器對照表，請參閱[測試](/zh-TW/help/testing)。如需即時提供者金鑰與會觸及網路的測試套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的項目

- 套件壓縮檔內容完整、具有有效的 `dist/postinstall-inventory.json`，且不依賴未封裝的儲存庫檔案。
- 使用者可以從較舊的已發布套件升級至候選套件，而不會遺失設定、代理程式、工作階段、工作區、外掛允許清單或頻道設定。
- `openclaw doctor --fix --non-interactive` 負責舊版清理與修復路徑。啟動流程不應為過時的外掛狀態增加隱藏的相容性遷移。
- 外掛可從本機目錄、git 儲存庫、npm 套件及 ClawHub 登錄檔路徑安裝。
- 每個外掛的 npm 相依套件會安裝至各自受管理的 npm 專案中、在信任前接受掃描，並在解除安裝外掛時透過 `npm uninstall` 移除，避免提升至上層的相依套件殘留。
- 未發生任何變更時，外掛更新不會執行任何操作：安裝記錄、解析後的來源、已安裝的相依套件配置及啟用狀態都保持不變。

## 開發期間的本機驗證

先從小範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

若變更涉及外掛安裝、解除安裝、相依套件或套件清冊，也請執行涵蓋所編輯介面的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker 測試通道使用壓縮檔之前，請先驗證套件成品：

```bash
pnpm release:check
```

`release:check` 會執行設定／文件／API 差異檢查（設定結構描述、設定文件基準、外掛 SDK API 基準與匯出、外掛版本／清冊）、寫入套件發行清冊、執行 `npm pack --dry-run`、拒絕禁止封裝的檔案、將壓縮檔安裝至暫存前綴、執行安裝後處理，並對內建頻道進入點執行冒煙測試。

## Docker 測試通道

Docker 測試通道提供產品層級的驗證。它們會在 Linux 容器內安裝或更新真實套件，並透過命令列介面命令、閘道啟動、HTTP 探測、RPC 狀態及檔案系統狀態驗證行為。

反覆調整時使用聚焦的測試通道：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要的測試通道：

- `test:docker:plugins` 涵蓋外掛安裝冒煙測試、本機資料夾安裝、本機資料夾更新略過行為、具有預先安裝相依套件的本機資料夾、`file:` 套件安裝、可執行命令列介面命令的 git 安裝、git 移動參照更新、具有提升至上層之遞移相依套件的 npm 登錄檔安裝、npm 更新無操作、拒絕格式錯誤的 npm 套件中繼資料、本機 ClawHub 固定資料安裝與更新無操作、市集更新行為，以及 Claude 套件組合的啟用／檢查。設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`，可使 ClawHub 區塊保持封閉／離線。
- `test:docker:plugin-lifecycle-matrix` 會在空白容器中安裝候選套件，讓一個 npm 外掛依序經過安裝、檢查、停用、啟用、明確升級、明確降級，以及刪除外掛程式碼後解除安裝。它會記錄每個階段的 RSS 與 CPU 指標。
- `test:docker:plugin-update` 驗證未變更的已安裝外掛在執行 `openclaw plugins update` 時，不會重新安裝或遺失安裝中繼資料。
- `test:docker:upgrade-survivor` 會將候選壓縮檔安裝至有殘留狀態的舊使用者固定資料上，執行套件更新與非互動式 doctor，接著啟動 local loopback 閘道並檢查狀態是否保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發布的基準版本，透過內建的 `openclaw config set` 配方進行設定，再更新至候選壓縮檔、執行 doctor、檢查舊版清理、啟動閘道，並探測 `/healthz`、`/readyz` 與 RPC 狀態。
- `test:docker:update-restart-auth` 會安裝候選套件、啟動受管理且採用權杖驗證的閘道、為 `openclaw update --yes --json` 取消設定呼叫端的閘道驗證環境變數，並要求候選版本的更新命令在執行一般探測前重新啟動閘道。
- `test:docker:update-migration` 是著重清理的已發布版本更新測試通道。它會從已設定的 Discord／Telegram 風格使用者狀態開始，執行基準版本的 doctor，使已設定的外掛相依套件有機會具體化；接著為已設定的封裝外掛植入舊版外掛相依套件殘留物、更新至候選壓縮檔，並要求更新後的 doctor 移除舊版相依套件根目錄。

實用的已發布版本升級存續測試變體：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用情境：`base`、`acpx-openclaw-tools-bridge`、`feishu-channel`、`bootstrap-persona`、`channel-post-core-restore`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 及 `versioned-runtime-deps`。在彙總執行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`（別名 `far-reaching`）會展開為所有情境，包括已設定外掛的安裝遷移。

完整更新遷移刻意與完整發布 CI 分開。當發布問題是「自 `2026.4.23` 起的每個已發布穩定版本，是否都能更新至此候選版本並清理外掛相依套件殘留物？」時，請使用手動 `Update Migration` 工作流程：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 套件驗收

套件驗收是 GitHub 原生的套件關卡。它會將一個候選套件解析為 `package-under-test` 壓縮檔、記錄版本與 SHA-256，然後針對該確切壓縮檔執行可重複使用的 Docker 端對端測試通道。工作流程測試框架的參照與套件來源參照彼此分開，因此目前的測試邏輯可以驗證較舊的可信任版本。

候選來源：

- `source=npm`：驗證 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest` 或確切的已發布版本。
- `source=ref`：使用選定的目前測試框架，封裝可信任的分支、標籤或提交。
- `source=url`：使用必要的 `package_sha256` 驗證公開 HTTPS 壓縮檔。此路徑會拒絕 URL 憑證、非預設 HTTPS 連接埠、私人／內部主機名稱或 DNS／IP 結果、特殊用途 IP 位址空間及不安全的重新導向。
- `source=trusted-url`：使用必要的 `package_sha256` 與 `trusted_source_id`，依據 `.github/package-trusted-sources.json` 中由維護者擁有的原則驗證 HTTPS 壓縮檔。企業／私人鏡像應使用此方式，而不是透過輸入層級的允許私人來源開關削弱 `source=url`。若原則設定了 Bearer 驗證，會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 機密。
- `source=artifact`：重複使用另一個 Actions 執行所上傳的壓縮檔。

完整發布驗證預設使用 `source=artifact`，並從解析後的發布 SHA 建置。若要進行發布後驗證，請傳入 `package_acceptance_package_spec=openclaw@YYYY.M.PATCH`，使相同的升級矩陣改為針對已發布的 npm 套件。

發布檢查會使用以下套件／更新／重新啟動／外掛集合呼叫套件驗收：

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

啟用發布浸泡測試時（`release_profile=stable` 與 `full` 會強制啟用），也會傳入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

這讓套件遷移、更新頻道切換、已損壞受管理外掛的容錯、過時外掛相依套件清理、離線外掛涵蓋範圍、外掛更新行為及 Telegram 套件品質保證，都能針對同一個解析後的成品執行，而不必讓預設發布套件關卡遍歷每個已發布版本。

`last-stable-4` 會解析為 npm 上最新發布的四個 OpenClaw 穩定版本。發布套件驗收將 `2026.4.23` 固定為第一個外掛更新相容性邊界、將 `2026.5.2` 固定為外掛架構劇烈變動邊界，並將 `2026.4.15` 固定為較舊的 2026.4.1x 已發布版本更新基準；解析器會移除已包含在最新四個版本中的重複固定版本。如需完整涵蓋已發布版本的更新遷移，請在獨立的更新遷移工作流程中使用 `all-since-2026.4.23`，而非完整發布 CI。若也需要舊日期前的錨點，仍可使用 `release-history` 進行手動擴大抽樣。

選取多個已發布版本升級存續測試基準時，可重複使用的 Docker 工作流程會將每個基準分片至各自的目標執行器工作。每個基準分片仍會執行選定的情境集合，但記錄與成品會按基準分開保存，且總耗時由最慢的分片決定，而非單一大型循序工作。

發布前驗證候選版本時，可手動執行套件設定檔：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

若為已發布的延伸穩定金絲雀版本，請設定 `package_spec=openclaw@extended-stable`。套件驗收會在 Docker 測試通道執行前，將該選擇器解析為確切的壓縮檔。

當發布問題包含 MCP 頻道、排程／子代理程式清理、OpenAI 網頁搜尋或 OpenWebUI 時，請使用 `suite_profile=product`。只有在需要完整涵蓋 Docker 發布路徑時，才使用 `suite_profile=full`。

## 發布預設值

對發布候選版本而言，預設驗證堆疊如下：

1. 使用 `pnpm check:changed` 與 `pnpm test:changed` 檢查原始碼層級的回歸。
2. 使用 `pnpm release:check` 驗證套件成品完整性。
3. 使用套件驗收的 `package` 設定檔或發布檢查的自訂套件測試通道，驗證安裝／更新／重新啟動／外掛合約。
4. 使用跨作業系統發布檢查，驗證作業系統特定的安裝程式、初始設定與平台行為。
5. 僅當變更的介面涉及提供者或託管服務行為時，才執行即時測試套件。

在維護者機器上，除非明確執行本機驗證，否則廣泛關卡與 Docker／套件產品驗證應在 Testbox 中執行。

## 舊版相容性

相容性寬限範圍狹窄且有時間限制：

- `2026.4.25` 以前（含 `2026.4.25-beta.*`）的套件，可在套件驗收中容許已發布套件的中繼資料缺漏。
- 已發布的 `2026.4.26` 套件可針對已發布的本機建置中繼資料戳記檔案發出警告。
- 後續套件必須符合現代合約。相同缺漏將直接失敗，而非警告或略過。

請勿為這些舊格式新增啟動遷移。請新增或擴充 doctor 修復，然後使用 `upgrade-survivor`、`published-upgrade-survivor`，或在更新命令負責重新啟動時使用 `update-restart-auth` 加以驗證。

## 新增涵蓋範圍

變更更新或外掛行為時，請在能因正確原因失敗的最低層級新增涵蓋範圍：

- 純路徑或中繼資料邏輯：在原始碼旁加入單元測試。
- 套件清單或封裝檔案行為：使用 `package-dist-inventory` 或 tarball
  檢查器測試。
- 命令列介面安裝／更新行為：使用 Docker 測試通道斷言或測試固定資料。
- 已發布版本的遷移行為：使用 `published-upgrade-survivor` 情境。
- 由更新流程負責的重新啟動行為：使用 `update-restart-auth`。
- 登錄檔／套件來源行為：使用 `test:docker:plugins` 測試固定資料或 ClawHub
  測試固定資料伺服器。
- 相依性配置或清理行為：同時斷言執行階段的實際執行結果與檔案系統邊界。npm 相依套件可能會提升至外掛
  受管理的 npm 專案內，因此測試應證明該專案會被掃描／清理，
  而非假設只會處理外掛套件本身的 `node_modules` 目錄樹。

新建的 Docker 測試固定資料預設應保持封閉且不依賴外部環境。除非測試重點是即時登錄檔行為，否則請使用本機測試固定資料登錄檔和
模擬套件。

## 失敗分類診斷

先從成品識別資訊著手：

- 套件驗收 `resolve_package` 摘要：來源、版本、SHA-256，以及
  成品名稱。
- Docker 成品：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、測試通道日誌，以及重新執行命令。
- 升級存續測試摘要：`.artifacts/upgrade-survivor/summary.json`，
  包含基準版本、候選版本、情境、各階段耗時，以及
  設定配方涵蓋範圍。

應優先使用相同套件成品重新執行失敗的特定測試通道，而非
重新執行整套發布測試。
