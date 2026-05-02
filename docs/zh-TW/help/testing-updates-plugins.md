---
read_when:
    - 變更 OpenClaw 更新、doctor、套件驗收或 Plugin 安裝行為
    - 準備或核准發行候選版本
    - 偵錯套件更新、Plugin 依賴項清理或 Plugin 安裝回歸問題
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件遷移，以及 Plugin 安裝/更新行為
title: 測試：更新與 Plugin
x-i18n:
    generated_at: "2026-05-02T20:50:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

這是更新與 Plugin 驗證的專用檢查清單。目標很簡單：證明可安裝套件能更新真實使用者狀態、透過 `doctor` 修復過期的舊狀態，並且仍能從支援的來源安裝、載入、更新與解除安裝 Plugin。

如需更完整的測試執行器地圖，請參閱[測試](/zh-TW/help/testing)。如需即時提供者金鑰與會觸及網路的測試套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的內容

更新與 Plugin 測試保護以下合約：

- 套件 tarball 完整、具有有效的 `dist/postinstall-inventory.json`，且不依賴未封裝的 repo 檔案。
- 使用者可以從較舊的已發布套件移轉到候選套件，而不遺失設定、代理、工作階段、工作區、Plugin 允許清單或頻道設定。
- `openclaw doctor --fix --non-interactive` 負責舊版清理與修復路徑。啟動流程不應為過期 Plugin 狀態增加隱藏相容性遷移。
- Plugin 安裝可從本機目錄、git repo、npm 套件與 ClawHub 登錄路徑運作。
- Plugin npm 相依套件會安裝在受管理的 npm 根目錄中、在信任前掃描，並在解除安裝時透過 npm 移除，讓提升的相依套件不會殘留。
- 當沒有變更時，Plugin 更新保持穩定：安裝記錄、解析後來源、已安裝相依佈局與啟用狀態保持不變。

## 開發期間的本機證明

從窄範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

針對 Plugin 安裝、解除安裝、相依套件或套件清單變更，也請執行涵蓋已編輯接縫的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker lane 消耗 tarball 之前，先證明套件成品：

```bash
pnpm release:check
```

`release:check` 會執行設定/文件/API 漂移檢查、寫入套件 dist 清單、執行 `npm pack --dry-run`、拒絕禁止打包的檔案、將 tarball 安裝到暫存 prefix、執行 postinstall，並對內建頻道進入點進行 smoke 測試。

## Docker lane

Docker lane 是產品層級證明。它們會在 Linux 容器內安裝或更新真實套件，並透過 CLI 命令、Gateway 啟動、HTTP 探測、RPC 狀態與檔案系統狀態斷言行為。

迭代時使用聚焦 lane：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要 lane：

- `test:docker:plugins` 驗證 Plugin 安裝 smoke、本機資料夾安裝、本機資料夾更新跳過行為、具有預先安裝相依套件的本機資料夾、`file:` 套件安裝、可執行 CLI 的 git 安裝、git moving-ref 更新、含提升傳遞相依套件的 npm registry 安裝、npm 更新無操作、本機 ClawHub fixture 安裝與更新無操作、市集更新行為，以及 Claude-bundle 啟用/檢查。設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可讓 ClawHub 區塊保持 hermetic/離線。
- `test:docker:plugin-update` 驗證未變更的已安裝 Plugin 在 `openclaw plugins update` 期間不會重新安裝或遺失安裝中繼資料。
- `test:docker:upgrade-survivor` 會將候選 tarball 安裝到髒的舊使用者 fixture 上，執行套件更新與非互動式 doctor，然後啟動 local loopback Gateway 並檢查狀態保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發布基準、透過內建的 `openclaw config set` 配方設定它、將它更新到候選 tarball、執行 doctor、檢查舊版清理、啟動 Gateway，並探測 `/healthz`、`/readyz` 與 RPC 狀態。
- `test:docker:update-migration` 是清理密集的已發布更新 lane。它從已設定的 Discord/Telegram 風格使用者狀態開始，執行基準 doctor，讓已設定 Plugin 相依套件有機會實體化，為已設定的套裝 Plugin 播種舊版 Plugin 相依殘留，更新到候選 tarball，並要求更新後 doctor 移除舊版相依根目錄。

實用的已發布升級 survivor 變體：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用情境為 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`tilde-log-path` 與 `versioned-runtime-deps`。在彙總執行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 會展開為所有已回報 issue 形狀的情境，包括已設定 Plugin 安裝遷移。

完整更新遷移刻意與 Full Release CI 分離。當發布問題是「2026.4.23 之後的每個已發布 stable release 是否都能更新到此候選版本並清理 Plugin 相依殘留？」時，請使用手動 `Update Migration` 工作流程：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 套件驗收

Package Acceptance 是 GitHub 原生套件閘門。它會將一個候選套件解析為 `package-under-test` tarball、記錄版本與 SHA-256，然後針對該精確 tarball 執行可重用 Docker E2E lane。工作流程 harness ref 與套件來源 ref 分離，因此目前測試邏輯可以驗證較舊的受信任 release。

候選來源：

- `source=npm`：驗證 `openclaw@beta`、`openclaw@latest` 或精確的已發布版本。
- `source=ref`：使用所選目前 harness 打包受信任分支、tag 或 commit。
- `source=url`：使用必要的 `package_sha256` 驗證 HTTPS tarball。
- `source=artifact`：重用另一個 Actions 執行上傳的 tarball。

Full Release Validation 預設使用 `source=artifact`，由已解析的 release SHA 建置。若要進行發布後證明，請傳入 `package_acceptance_package_spec=openclaw@YYYY.M.D`，讓相同升級矩陣改以已出貨的 npm 套件為目標。

Release check 會使用套件/更新/Plugin 集呼叫 Package Acceptance：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

它們也會傳入：

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

這會讓套件遷移、更新頻道切換、過期 Plugin 相依清理、離線 Plugin 覆蓋率、Plugin 更新行為與 Telegram 套件 QA 都在同一個已解析成品上進行。

`all-since-2026.4.23` 是 Full Release CI 升級樣本：從 `2026.4.23` 到 `latest` 的每個 stable npm 已發布 release。如需詳盡的已發布更新遷移覆蓋率，請在獨立的 Update Migration 工作流程中使用 `all-since-2026.4.23`，而不是 Full Release CI。當你也需要舊版日期前錨點時，`release-history` 仍可供手動更廣泛抽樣使用。

在 release 前驗證候選版本時，手動執行套件 profile：

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

當 release 問題包含 MCP 頻道、cron/subagent 清理、OpenAI web search 或 OpenWebUI 時，請使用 `suite_profile=product`。只有在需要完整 Docker release 路徑覆蓋率時，才使用 `suite_profile=full`。

## Release 預設

針對 release candidate，預設證明堆疊為：

1. `pnpm check:changed` 與 `pnpm test:changed` 用於來源層級回歸。
2. `pnpm release:check` 用於套件成品完整性。
3. Package Acceptance `package` profile 或 release-check 自訂套件 lane，用於安裝/更新/Plugin 合約。
4. Cross-OS release check，用於 OS 特定安裝器、onboarding 與平台行為。
5. 只有當變更表面觸及提供者或託管服務行為時，才執行即時測試套件。

在 maintainer 機器上，廣泛閘門與 Docker/套件產品證明應在 Testbox 中執行，除非明確進行本機證明。

## 舊版相容性

相容性寬容是窄範圍且有時間限制的：

- 到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，在 Package Acceptance 中可容忍已出貨的套件中繼資料缺口。
- 已發布的 `2026.4.26` 套件可能會對已出貨的本機建置中繼資料戳記檔案發出警告。
- 後續套件必須滿足現代合約。相同缺口會失敗，而不是警告或跳過。

不要為這些舊形狀新增啟動遷移。新增或延伸 doctor 修復，然後用 `upgrade-survivor` 或 `published-upgrade-survivor` 證明它。

## 新增覆蓋率

變更更新或 Plugin 行為時，請在能因正確原因失敗的最低層新增覆蓋率：

- 純路徑或中繼資料邏輯：來源旁的單元測試。
- 套件清單或打包檔案行為：`package-dist-inventory` 或 tarball 檢查器測試。
- CLI 安裝/更新行為：Docker lane 斷言或 fixture。
- 已發布 release 遷移行為：`published-upgrade-survivor` 情境。
- 登錄/套件來源行為：`test:docker:plugins` fixture 或 ClawHub fixture 伺服器。
- 相依佈局或清理行為：同時斷言 runtime 執行與檔案系統邊界。npm 相依套件可能會被提升到受管理的 npm 根目錄下，因此測試應證明根目錄會被掃描/清理，而不是假設套件本機 `node_modules` 樹。

讓新的 Docker fixture 預設保持 hermetic。除非測試重點是即時登錄行為，否則使用本機 fixture 登錄與假套件。

## 失敗分流

從成品身分開始：

- Package Acceptance `resolve_package` 摘要：來源、版本、SHA-256 與成品名稱。
- Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄與重新執行命令。
- Upgrade survivor 摘要：`.artifacts/upgrade-survivor/summary.json`，包含基準版本、候選版本、情境、階段計時與配方步驟。

比起重新執行整個 release umbrella，優先使用相同套件成品重新執行失敗的精確 lane。
