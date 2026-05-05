---
read_when:
    - 變更 OpenClaw 更新、doctor、套件驗收或 Plugin 安裝行為
    - 準備或核准發行候選版本
    - 套件更新、Plugin 相依性清理或 Plugin 安裝回歸的偵錯
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件移轉，以及 Plugin 安裝/更新行為
title: 測試：更新與 Plugin
x-i18n:
    generated_at: "2026-05-05T01:47:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

這是專用於更新與 Plugin 驗證的檢查清單。目標很
簡單：證明可安裝套件能更新真實使用者狀態、透過 `doctor` 修復過時的
舊版狀態，並且仍能從支援的來源安裝、載入、更新與解除安裝
Plugin。

如需更完整的測試執行器對照，請參閱[測試](/zh-TW/help/testing)。如需即時供應商
金鑰與會觸及網路的測試套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的內容

更新與 Plugin 測試保護下列契約：

- 套件 tarball 是完整的，具備有效的 `dist/postinstall-inventory.json`，
  且不依賴未封裝的儲存庫檔案。
- 使用者可以從較舊的已發佈套件移轉到候選套件，而不遺失設定、代理、工作階段、工作區、Plugin 允許清單或
  頻道設定。
- `openclaw doctor --fix --non-interactive` 負責舊版清理與修復
  路徑。啟動流程不應為過時的
  Plugin 狀態增加隱藏的相容性遷移。
- Plugin 安裝可從本機目錄、git 儲存庫、npm 套件與
  ClawHub 登錄路徑運作。
- Plugin npm 相依套件會安裝在受管理的 npm 根目錄中，在信任前接受掃描，
  並在解除安裝期間透過 npm 移除，因此被提升的相依套件不會
  殘留。
- 當沒有任何變更時，Plugin 更新應保持穩定：安裝記錄、解析後的
  來源、已安裝的相依套件配置與啟用狀態都維持不變。

## 開發期間的本機證明

從狹窄範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

若有 Plugin 安裝、解除安裝、相依套件或套件清單變更，也請
執行涵蓋已編輯銜接面的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker 跑道取用 tarball 前，先證明套件產物：

```bash
pnpm release:check
```

`release:check` 會執行設定/文件/API 漂移檢查、寫入套件 dist
清單、執行 `npm pack --dry-run`、拒絕被禁止的封裝檔案、將
tarball 安裝到臨時前置目錄、執行 postinstall，並對內建頻道
進入點做 smoke 測試。

## Docker 跑道

Docker 跑道是產品層級的證明。它們會在 Linux 容器內安裝或更新真實
套件，並透過 CLI 命令、Gateway 啟動、HTTP 探測、RPC 狀態與檔案系統狀態
斷言行為。

迭代時使用聚焦跑道：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要跑道：

- `test:docker:plugins` 驗證 Plugin 安裝 smoke、本機資料夾安裝、
  本機資料夾更新跳過行為、含預先安裝相依套件的本機資料夾、`file:` 套件安裝、含 CLI 執行的 git
  安裝、git 移動參照更新、含被提升遞移
  相依套件的 npm 登錄安裝、npm 更新無操作、本機 ClawHub fixture 安裝與更新
  無操作、市集更新行為，以及 Claude-bundle 啟用/檢查。設定
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可讓 ClawHub 區塊保持 hermetic/offline。
- `test:docker:plugin-lifecycle-matrix` 會在空白
  容器中安裝候選套件，讓 npm Plugin 依序經過安裝、檢查、停用、啟用、
  明確升級、明確降級，以及刪除 Plugin
  程式碼後解除安裝。它會記錄各階段的 RSS 與 CPU 指標。
- `test:docker:plugin-update` 驗證未變更的已安裝 Plugin
  不會在 `openclaw plugins update` 期間重新安裝或遺失安裝中繼資料。
- `test:docker:upgrade-survivor` 會將候選 tarball 安裝到髒污的
  舊使用者 fixture 上，執行套件更新加上非互動式 doctor，接著啟動
  loopback Gateway 並檢查狀態保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發佈基準版本，
  透過內建的 `openclaw config set` 配方設定它，將其更新到
  候選 tarball，執行 doctor，檢查舊版清理，啟動 Gateway，並
  探測 `/healthz`、`/readyz` 與 RPC 狀態。
- `test:docker:update-migration` 是清理量較重的已發佈更新跑道。它
  從已設定的 Discord/Telegram 風格使用者狀態開始，執行基準
  doctor，讓已設定 Plugin 相依套件有機會實體化，為已設定的封裝 Plugin 植入
  舊版 Plugin 相依套件碎屑，更新到
  候選 tarball，並要求更新後的 doctor 移除舊版
  相依套件根目錄。

實用的已發佈升級 survivor 變體：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用情境為 `base`、`feishu-channel`、`bootstrap-persona`、
`plugin-deps-cleanup`、`configured-plugin-installs`、
`stale-source-plugin-shadow`、`tilde-log-path` 與 `versioned-runtime-deps`。在彙總執行中，
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 會展開為所有回報
issue 形狀的情境，包括已設定 Plugin 安裝遷移。

完整更新遷移刻意與 Full Release CI 分開。當發行問題是「從 2026.4.23 起的每個
已發佈穩定版本，是否都能更新到此候選版本並
清理 Plugin 相依套件碎屑？」時，請使用手動 `Update Migration` 工作流程：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance 是 GitHub 原生的套件閘門。它會將一個候選
套件解析為 `package-under-test` tarball，記錄版本與 SHA-256，接著
針對該精確 tarball 執行可重用 Docker E2E 跑道。工作流程 harness
參照與套件來源參照分離，因此目前的測試邏輯可以驗證
較舊的受信任版本。

候選來源：

- `source=npm`：驗證 `openclaw@beta`、`openclaw@latest`，或精確的
  已發佈版本。
- `source=ref`：使用選定的目前
  harness 封裝受信任的分支、標籤或提交。
- `source=url`：使用必要的 `package_sha256` 驗證 HTTPS tarball。
- `source=artifact`：重用另一個 Actions 執行上傳的 tarball。

Full Release Validation 預設使用 `source=artifact`，由已解析的
發行 SHA 建置。若要做發佈後證明，請傳入
`package_acceptance_package_spec=openclaw@YYYY.M.D`，讓相同升級矩陣
改以已出貨的 npm 套件為目標。

發行檢查會以套件/更新/Plugin 集呼叫 Package Acceptance：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

它們也會傳入：

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

這會讓套件遷移、更新頻道切換、過時 Plugin 相依套件
清理、離線 Plugin 覆蓋、Plugin 更新行為與 Telegram 套件
QA 都位於同一個已解析產物上。

`all-since-2026.4.23` 是 Full Release CI 升級樣本：從 `2026.4.23` 到 `latest` 的每個穩定 npm 已發佈版本。若要取得完整的已發佈
更新遷移覆蓋，請在獨立的 Update
Migration 工作流程中使用 `all-since-2026.4.23`，而不是 Full Release CI。當你也需要舊版日期前
錨點時，`release-history` 仍可供手動更廣泛抽樣。

在發行前驗證候選版本時，手動執行套件 profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

當發行問題包含 MCP 頻道、cron/subagent 清理、OpenAI 網頁搜尋或 OpenWebUI 時，使用 `suite_profile=product`。只有在需要完整 Docker 發行路徑覆蓋時，才使用 `suite_profile=full`。

## 發行預設

對於發行候選版本，預設證明堆疊如下：

1. `pnpm check:changed` 與 `pnpm test:changed`，用於來源層級的迴歸。
2. `pnpm release:check`，用於套件產物完整性。
3. Package Acceptance `package` profile，或 release-check 自訂套件
   跑道，用於安裝/更新/Plugin 契約。
4. 跨 OS 發行檢查，用於 OS 特定安裝器、onboarding 與平台
   行為。
5. 只有當變更表面觸及供應商或託管服務
   行為時，才執行即時測試套件。

在維護者機器上，廣泛閘門與 Docker/套件產品證明應在
Testbox 中執行，除非明確要做本機證明。

## 舊版相容性

相容性寬限範圍很窄且有時間限制：

- 到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可容許
  Package Acceptance 中已出貨的套件中繼資料缺口。
- 已發佈的 `2026.4.26` 套件可能會針對已出貨的本機建置中繼資料戳記
  檔案發出警告。
- 較新的套件必須符合現代契約。相同缺口會失敗，而不是
  警告或跳過。

不要為這些舊形狀新增啟動遷移。新增或擴充 doctor
修復，然後用 `upgrade-survivor` 或 `published-upgrade-survivor` 證明它。

## 新增覆蓋

變更更新或 Plugin 行為時，請在能因正確原因
失敗的最低層級新增覆蓋：

- 純路徑或中繼資料邏輯：來源旁的單元測試。
- 套件清單或封裝檔案行為：`package-dist-inventory` 或 tarball
  檢查器測試。
- CLI 安裝/更新行為：Docker 跑道斷言或 fixture。
- 已發佈版本遷移行為：`published-upgrade-survivor` 情境。
- 登錄/套件來源行為：`test:docker:plugins` fixture 或 ClawHub
  fixture 伺服器。
- 相依套件配置或清理行為：同時斷言執行階段執行與
  檔案系統邊界。npm 相依套件可能會被提升到受管理的 npm
  根目錄下，因此測試應證明該根目錄有被掃描/清理，而不是假設有
  套件本機的 `node_modules` 樹。

讓新的 Docker fixture 預設保持 hermetic。除非測試重點就是即時登錄行為，
否則使用本機 fixture 登錄與假套件。

## 失敗分流

從產物身分開始：

- Package Acceptance `resolve_package` 摘要：來源、版本、SHA-256 與
  產物名稱。
- Docker 產物：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、跑道日誌與重新執行命令。
- Upgrade survivor 摘要：`.artifacts/upgrade-survivor/summary.json`，
  包含基準版本、候選版本、情境、階段時間與
  配方步驟。

優先使用相同套件產物重新執行失敗的精確跑道，而不是
重新執行整個發行總括流程。
