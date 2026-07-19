---
read_when:
    - 變更 OpenClaw 更新、doctor、套件驗收或外掛安裝行為
    - 準備或核准候選版本
    - 偵錯套件更新、外掛相依性清理或外掛安裝功能退化問題
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件移轉，以及外掛安裝／更新行為
title: 測試：更新與外掛
x-i18n:
    generated_at: "2026-07-19T13:48:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96a11fe42472f758d4fd1cc568486e301f7460982fdb547cab8b39de04a8dabe
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

更新與外掛驗證檢查清單：證明可安裝的套件能夠
更新真實使用者狀態、透過 `doctor` 修復過時的舊版狀態，並且仍可
從每個支援的來源安裝、載入、更新及解除安裝外掛。

如需更完整的測試執行器對照，請參閱[測試](/zh-TW/help/testing)。如需即時供應商
金鑰及會存取網路的測試套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的項目

- 套件 tarball 完整、具有有效的 `dist/postinstall-inventory.json`，
  且不依賴未封裝的存放庫檔案。
- 使用者可從較舊的已發布套件移轉至候選套件，
  而不遺失設定、代理程式、工作階段、工作區、外掛允許清單或
  頻道設定。
- `openclaw doctor --fix --non-interactive` 負責舊版清理與修復
  路徑。啟動流程不應為過時的外掛狀態增加隱藏的相容性遷移。
- 外掛安裝可使用本機目錄、git 存放庫、npm 套件及
  ClawHub 登錄路徑。
- 外掛的 npm 相依套件會在每個外掛各自的一個受管理 npm 專案中安裝，
  在信任前接受掃描，並在解除安裝外掛時透過 `npm uninstall`
  移除，避免提升至上層的相依套件殘留。
- 沒有任何變更時，外掛更新不會執行任何動作：安裝記錄、已解析的
  來源、已安裝的相依套件配置及啟用狀態都維持不變。

## 開發期間的本機驗證

從小範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

若有外掛安裝、解除安裝、相依套件或套件清單變更，也請
執行涵蓋所編輯介面的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker 測試路徑使用 tarball 前，先驗證套件成品：

```bash
pnpm release:check
```

`release:check` 會執行設定／文件／API 漂移檢查（設定結構描述、設定文件
基準、外掛 SDK API 合約資訊清單與匯出、外掛版本／清單）、
寫入套件發行清單、執行 `npm pack --dry-run`、拒絕禁止
封裝的檔案、將 tarball 安裝至暫存前綴、執行 postinstall，並
對隨附頻道進入點執行冒煙測試。

## Docker 測試路徑

Docker 測試路徑是產品層級的驗證。它們會在 Linux 容器內安裝或更新真實
套件，並透過命令列介面命令、閘道啟動、HTTP 探測、RPC 狀態及檔案系統狀態
判定行為是否正確。

反覆調整時請使用聚焦的測試路徑：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要測試路徑：

- `test:docker:plugins` 涵蓋外掛安裝冒煙測試、本機資料夾安裝、
  本機資料夾更新略過行為、具有預先安裝相依套件的本機資料夾、
  `file:` 套件安裝、可執行命令列介面命令的 git 安裝、git
  移動參照更新、具有提升至上層之遞移相依套件的 npm 登錄安裝、
  npm 更新無操作、拒絕格式錯誤的 npm 套件中繼資料、
  本機 ClawHub 測試資料安裝與更新無操作、市集更新行為，
  以及 Claude 套件組啟用／檢查。設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`，
  使 ClawHub 區塊維持封閉／離線。
- `test:docker:plugin-lifecycle-matrix` 會將候選套件安裝至空白
  容器，讓 npm 外掛依序經過安裝、檢查、停用、啟用、
  明確升級、明確降級，並在刪除外掛
  程式碼後解除安裝。它會記錄各階段的 RSS 與 CPU 指標。
- `test:docker:plugin-update` 會驗證未變更的已安裝外掛在
  `openclaw plugins update` 期間不會重新安裝或遺失安裝中繼資料。
- `test:docker:upgrade-survivor` 會將候選 tarball 安裝至含有髒資料的
  舊使用者測試資料之上，執行套件更新及非互動式 doctor，接著啟動
  迴路閘道並檢查狀態是否保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發布的基準版本，
  使用預先內建的 `openclaw config set` 配方進行設定，再更新至
  候選 tarball、執行 doctor、檢查舊版清理、啟動閘道，並
  探測 `/healthz`、`/readyz` 及 RPC 狀態。
- `test:docker:update-restart-auth` 會安裝候選套件、啟動
  受管理且使用權杖驗證的閘道、為 `openclaw update --yes --json`
  取消設定呼叫端的閘道驗證環境變數，並要求候選更新命令
  在執行一般探測前重新啟動閘道。
- `test:docker:update-migration` 是著重清理的已發布版本更新測試路徑。它
  從已設定的 Discord／Telegram 類型使用者狀態開始，執行基準版本的
  doctor，讓已設定的外掛相依套件有機會實體化，為已設定的封裝外掛植入
  舊版外掛相依套件殘留物，更新至
  候選 tarball，並要求更新後的 doctor 移除舊版
  相依套件根目錄。

實用的已發布版本升級存續測試變體：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用情境：`base`、`acpx-openclaw-tools-bridge`、`feishu-channel`、
`bootstrap-persona`、`channel-post-core-restore`、`plugin-deps-cleanup`、
`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path`
及 `versioned-runtime-deps`。在彙總執行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
（別名 `far-reaching`）會展開為所有情境，包括
已設定外掛的安裝遷移。

完整更新遷移刻意與完整發布 CI 分開。當發布問題是「從 2026.4.23
起的每個已發布穩定版本，是否都能更新至此候選版本並
清理外掛相依套件殘留物？」時，請使用手動 `Update Migration` 工作流程：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 套件驗收

套件驗收是 GitHub 原生的套件閘門。它會將一個候選
套件解析成 `package-under-test` tarball，記錄版本與 SHA-256，然後
針對該確切 tarball 執行可重複使用的 Docker 端對端測試路徑。工作流程測試框架
參照與套件來源參照彼此分離，因此目前的測試邏輯可驗證
較舊的可信任版本。

候選來源：

- `source=npm`：驗證 `openclaw@extended-stable`、`openclaw@beta`、
  `openclaw@latest` 或確切的已發布版本。
- `source=ref`：使用所選的目前
  測試框架封裝可信任的分支、標籤或提交。
- `source=url`：使用必要的 `package_sha256` 驗證公開 HTTPS tarball。
  此路徑會拒絕 URL 認證資訊、非預設 HTTPS 連接埠、私人／內部
  主機名稱或 DNS／IP 結果、特殊用途 IP 空間及不安全的重新導向。
- `source=trusted-url`：使用必要的
  `package_sha256` 與 `trusted_source_id`，依照
  `.github/package-trusted-sources.json` 中由維護者擁有的政策驗證 HTTPS tarball。請將此方式用於企業／私人
  鏡像，而非透過輸入層級的允許私人
  開關削弱 `source=url`。依政策設定時，Bearer 驗證會使用固定的
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密鑰。
- `source=artifact`：重複使用另一個 Actions 執行所上傳的 tarball。

完整發布驗證預設使用 `source=artifact`，並從
已解析的發布 SHA 建置。如需發布後驗證，請傳入
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`，讓相同的升級矩陣
改為以已發布的 npm 套件為目標。

發布檢查會使用套件／更新／重新啟動／外掛集合呼叫套件驗收：

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

啟用發布浸泡測試時（`release_profile=stable` 與
`full` 會強制啟用），也會傳入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

如此可讓套件遷移、更新頻道切換、損壞的受管理外掛
容錯、過時外掛相依套件清理、離線外掛涵蓋範圍、外掛
更新行為及 Telegram 套件品質保證，都使用同一個已解析成品，
又不會讓預設發布套件閘門走訪每個已發布版本。

`last-stable-4` 會解析為最新四個已穩定發布至 npm 的 OpenClaw
版本。發布套件驗收會將 `2026.4.23` 固定為第一個外掛更新
相容性邊界、將 `2026.5.2` 固定為外掛架構變動邊界，並將
`2026.4.15` 固定為較舊的 2026.4.1x 已發布版本更新基準；解析器
會去除已包含於最新四個版本中的重複固定版本。如需完整的已發布
版本更新遷移涵蓋範圍，請在獨立的更新遷移工作流程中使用
`all-since-2026.4.23`，而非完整發布 CI。若還需要舊版日期前的
錨點，仍可使用 `release-history` 進行手動的更廣泛抽樣。

選取多個已發布版本升級存續測試基準時，可重複使用的
Docker 工作流程會將每個基準分流至各自的目標執行器工作。每個
基準分流仍會執行所選情境集合，但記錄與成品會維持
按基準區分，且總耗時取決於最慢的分流，而非一個大型
序列工作。

在發布前驗證候選版本時，請手動執行套件設定檔：

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

如需已發布的延伸穩定版金絲雀測試，請設定
`package_spec=openclaw@extended-stable`。套件驗收會先將該
選擇器解析成確切的 tarball，再執行 Docker 測試路徑。

若發布問題包含 MCP 頻道、
排程／子代理程式清理、OpenAI 網頁搜尋或 OpenWebUI，請使用 `suite_profile=product`。只有在需要完整的
Docker 發布路徑涵蓋範圍時，才使用 `suite_profile=full`。

## 發布預設值

對於候選發布版本，預設驗證堆疊為：

1. `pnpm check:changed` 與 `pnpm test:changed`，用於原始碼層級的迴歸。
2. `pnpm release:check`，用於套件成品完整性。
3. 套件驗收 `package` 設定檔或發布檢查的自訂套件
   測試路徑，用於安裝／更新／重新啟動／外掛合約。
4. 跨作業系統發布檢查，用於作業系統特定的安裝程式、初始設定及平台
   行為。
5. 只有在變更的介面涉及供應商或託管服務
   行為時，才執行即時測試套件。

在維護者機器上，除非明確執行本機驗證，否則廣泛閘門及 Docker／套件產品驗證應在
Testbox 中執行。

## 舊版相容性

相容性寬容範圍狹窄且有明確時限：

- 截至 `2026.4.25` 的套件（包括 `2026.4.25-beta.*`）在套件驗收中可容許
  已發布套件中既有的中繼資料缺漏。
- 已發布的 `2026.4.26` 套件可對已發布的本機建置中繼資料戳記
  檔案發出警告。
- 後續套件必須符合現代合約。相同的缺漏會導致失敗，
  而非警告或略過。

請勿為這些舊格式新增啟動遷移。請新增或擴充 doctor
修復，接著使用 `upgrade-survivor`、`published-upgrade-survivor`，或在更新命令負責重新啟動時使用
`update-restart-auth` 進行驗證。

## 新增涵蓋範圍

變更更新或外掛行為時，請在能因正確原因而失敗的最低層級新增測試涵蓋：

- 純路徑或中繼資料邏輯：在原始碼旁新增單元測試。
- 套件清單或封裝檔案行為：`package-dist-inventory` 或 tarball
  檢查器測試。
- 命令列介面的安裝／更新行為：Docker 測試線的斷言或測試資料。
- 已發布版本的遷移行為：`published-upgrade-survivor` 情境。
- 由更新流程負責的重新啟動行為：`update-restart-auth`。
- 登錄檔／套件來源行為：`test:docker:plugins` 測試資料或 ClawHub
  測試伺服器。
- 相依套件配置或清理行為：同時斷言執行階段的運作與
  檔案系統邊界。npm 相依套件可能會提升至外掛所管理的 npm 專案內，
  因此測試應證明該專案會被掃描／清理，而不是假設只處理外掛套件本機的
  `node_modules` 樹狀結構。

新的 Docker 測試資料預設應保持封閉自足。除非測試目的在於驗證即時登錄檔行為，
否則請使用本機測試登錄檔與假套件。

## 失敗分類處理

先確認成品識別資訊：

- 套件驗收 `resolve_package` 摘要：來源、版本、SHA-256，以及
  成品名稱。
- Docker 成品：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、測試線日誌，以及重新執行命令。
- 升級後保留項目摘要：`.artifacts/upgrade-survivor/summary.json`，
  包含基準版本、候選版本、情境、各階段耗時，以及設定作法的涵蓋情形。

相較於重新執行整套發布測試，應優先使用相同套件成品重新執行失敗的確切測試線。
