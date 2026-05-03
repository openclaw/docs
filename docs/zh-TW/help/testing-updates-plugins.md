---
read_when:
    - 變更 OpenClaw 更新、診斷、套件驗收或 Plugin 安裝行為
    - 準備或核准發行候選版本
    - 偵錯套件更新、Plugin 依賴項清理或 Plugin 安裝回歸
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件遷移與 Plugin 安裝／更新行為
title: 測試：更新與 Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

這是更新和 Plugin 驗證的專用檢查清單。目標很簡單：證明可安裝套件能更新真實使用者狀態、透過 `doctor` 修復過時的舊版狀態，並且仍能從支援的來源安裝、載入、更新與解除安裝 Plugin。

如需更完整的測試執行器對照圖，請參閱[測試](/zh-TW/help/testing)。如需即時 provider 金鑰與會觸及網路的測試套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的內容

更新與 Plugin 測試保護下列契約：

- 套件 tarball 是完整的，具有有效的 `dist/postinstall-inventory.json`，且不依賴未封裝的 repo 檔案。
- 使用者可以從較舊的已發佈套件移轉到候選套件，而不遺失設定、agent、session、workspace、Plugin allowlist 或 channel 設定。
- `openclaw doctor --fix --non-interactive` 負責舊版清理與修復路徑。啟動流程不應為過時的 Plugin 狀態增加隱藏的相容性 migration。
- Plugin 可從本機目錄、git repo、npm 套件，以及 ClawHub registry 路徑安裝。
- Plugin npm 相依套件會安裝在受管理的 npm root 中，在信任前被掃描，並在解除安裝期間透過 npm 移除，使 hoisted 相依套件不會殘留。
- 當沒有變更時，Plugin 更新是穩定的：安裝記錄、解析後來源、已安裝相依套件版面，以及啟用狀態都保持完整。

## 開發期間的本機證明

從窄範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

對於 Plugin 安裝、解除安裝、相依套件或套件 inventory 變更，也請執行涵蓋已編輯接縫的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker lane 消耗 tarball 之前，先證明套件 artifact：

```bash
pnpm release:check
```

`release:check` 會執行設定/docs/API drift 檢查、寫入套件 dist inventory、執行 `npm pack --dry-run`、拒絕禁止封裝的檔案、將 tarball 安裝到暫存 prefix、執行 postinstall，並 smoke bundled channel entrypoint。

## Docker lane

Docker lane 是產品層級的證明。它們會在 Linux container 內安裝或更新真實套件，並透過 CLI 指令、Gateway 啟動、HTTP probe、RPC 狀態與檔案系統狀態來斷言行為。

迭代時使用聚焦 lane：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要 lane：

- `test:docker:plugins` 驗證 Plugin 安裝 smoke、本機資料夾安裝、本機資料夾更新略過行為、具有預先安裝相依套件的本機資料夾、`file:` 套件安裝、帶有 CLI 執行的 git 安裝、git moving-ref 更新、具有 hoisted transitive 相依套件的 npm registry 安裝、npm 更新 no-op、本機 ClawHub fixture 安裝與更新 no-op、marketplace 更新行為，以及 Claude bundle 啟用/檢查。設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可讓 ClawHub 區塊保持 hermetic/離線。
- `test:docker:plugin-lifecycle-matrix` 會在裸 container 中安裝候選套件，讓 npm Plugin 依序執行安裝、檢查、停用、啟用、明確升級、明確降級，以及刪除 Plugin 程式碼後的解除安裝。它會記錄每個階段的 RSS 與 CPU 指標。
- `test:docker:plugin-update` 驗證未變更的已安裝 Plugin 在 `openclaw plugins update` 期間不會重新安裝或遺失安裝 metadata。
- `test:docker:upgrade-survivor` 會將候選 tarball 安裝到髒的舊使用者 fixture 之上、執行套件更新加上非互動式 doctor，接著啟動 loopback Gateway 並檢查狀態保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發佈 baseline，透過 baked `openclaw config set` recipe 設定它，將它更新到候選 tarball，執行 doctor，檢查舊版清理，啟動 Gateway，並 probe `/healthz`、`/readyz` 與 RPC 狀態。
- `test:docker:update-migration` 是著重清理的已發佈更新 lane。它會從已設定的 Discord/Telegram 風格使用者狀態開始，執行 baseline doctor 讓已設定的 Plugin 相依套件有機會具體化，為已設定的 packaged Plugin 植入舊版 Plugin 相依套件殘留物，更新到候選 tarball，並要求更新後 doctor 移除舊版相依套件 root。

實用的已發佈升級 survivor 變體：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用情境包括 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`tilde-log-path` 與 `versioned-runtime-deps`。在 aggregate 執行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 會展開為所有 reported issue 形狀的情境，包括 configured-plugin install migration。

完整更新 migration 會刻意與 Full Release CI 分開。當 release 問題是「2026.4.23 之後的每個已發佈 stable release 是否都能更新到這個候選版本並清理 Plugin 相依套件殘留物？」時，請使用手動 `Update Migration` workflow：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance 是 GitHub 原生的套件 gate。它會將一個候選套件解析成 `package-under-test` tarball、記錄版本與 SHA-256，接著針對該確切 tarball 執行可重用的 Docker E2E lane。workflow harness ref 與套件來源 ref 分離，因此目前的測試邏輯可以驗證較舊的受信任 release。

候選來源：

- `source=npm`：驗證 `openclaw@beta`、`openclaw@latest` 或確切的已發佈版本。
- `source=ref`：使用選取的目前 harness 封裝受信任的 branch、tag 或 commit。
- `source=url`：驗證 HTTPS tarball，並要求 `package_sha256`。
- `source=artifact`：重用另一個 Actions run 上傳的 tarball。

Full Release Validation 預設使用 `source=artifact`，由解析後的 release SHA 建置。若要進行發佈後證明，請傳入 `package_acceptance_package_spec=openclaw@YYYY.M.D`，讓相同的升級矩陣以已出貨的 npm 套件為目標。

Release 檢查會使用 package/update/plugin 集合呼叫 Package Acceptance：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

它們也會傳入：

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

這會讓套件 migration、更新 channel 切換、過時 Plugin 相依套件清理、離線 Plugin 覆蓋、Plugin 更新行為，以及 Telegram 套件 QA 都落在同一個解析後 artifact 上。

`all-since-2026.4.23` 是 Full Release CI 升級樣本：從 `2026.4.23` 到 `latest` 的每個 stable npm-published release。若要進行詳盡的已發佈更新 migration 覆蓋，請在獨立的 Update Migration workflow 中使用 `all-since-2026.4.23`，而不是 Full Release CI。當你也想要舊版前日期 anchor 時，`release-history` 仍可用於手動更廣泛抽樣。

在 release 前驗證候選版本時，手動執行 package profile：

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

當 release 問題包含 MCP channel、cron/subagent 清理、OpenAI web search 或 OpenWebUI 時，使用 `suite_profile=product`。只有在需要完整 Docker release-path 覆蓋時，才使用 `suite_profile=full`。

## Release 預設值

對於 release candidate，預設證明堆疊是：

1. `pnpm check:changed` 與 `pnpm test:changed`，用於 source 層級 regression。
2. `pnpm release:check`，用於套件 artifact 完整性。
3. Package Acceptance `package` profile，或 release-check 自訂套件 lane，用於 install/update/plugin 契約。
4. Cross-OS release 檢查，用於 OS-specific installer、onboarding 與 platform 行為。
5. 只有當變更 surface 觸及 provider 或 hosted-service 行為時，才執行 live suite。

在 maintainer 機器上，寬範圍 gate 與 Docker/package 產品證明應在 Testbox 中執行，除非明確進行本機證明。

## 舊版相容性

相容性寬容範圍很窄且有時間限制：

- 到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可容忍 Package Acceptance 中已出貨的套件 metadata 缺口。
- 已發佈的 `2026.4.26` 套件可對已出貨的本機 build metadata stamp 檔案發出警告。
- 較新的套件必須滿足現代契約。相同缺口會失敗，而不是警告或略過。

不要為這些舊形狀新增啟動 migration。請新增或延伸 doctor 修復，然後使用 `upgrade-survivor` 或 `published-upgrade-survivor` 證明它。

## 新增覆蓋

變更更新或 Plugin 行為時，請在能因正確理由失敗的最低層新增覆蓋：

- 純路徑或 metadata 邏輯：來源旁的 unit test。
- 套件 inventory 或 packed-file 行為：`package-dist-inventory` 或 tarball checker test。
- CLI 安裝/更新行為：Docker lane assertion 或 fixture。
- 已發佈 release migration 行為：`published-upgrade-survivor` 情境。
- Registry/package 來源行為：`test:docker:plugins` fixture 或 ClawHub fixture server。
- 相依套件版面或清理行為：同時斷言 runtime 執行與檔案系統邊界。npm 相依套件可能 hoist 到受管理的 npm root 下，因此測試應證明 root 會被掃描/清理，而不是假設 package-local `node_modules` tree。

新的 Docker fixture 預設保持 hermetic。除非測試重點是 live registry 行為，否則使用本機 fixture registry 與 fake package。

## 失敗分類

從 artifact 身分開始：

- Package Acceptance `resolve_package` 摘要：來源、版本、SHA-256 與 artifact 名稱。
- Docker artifact：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane log 與 rerun 指令。
- Upgrade survivor 摘要：`.artifacts/upgrade-survivor/summary.json`，包含 baseline 版本、候選版本、情境、階段 timing 與 recipe step。

優先使用相同套件 artifact 重新執行失敗的確切 lane，而不是重新執行整個 release umbrella。
