---
read_when:
    - 變更 OpenClaw 更新、doctor、套件驗收或 Plugin 安裝行為
    - 準備或核准發行候選版
    - 偵錯套件更新、Plugin 依賴項清理或 Plugin 安裝回歸
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件遷移和 Plugin 安裝/更新行為
title: 測試：更新與 Plugin
x-i18n:
    generated_at: "2026-05-06T02:50:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

這是更新與 Plugin 驗證的專用檢查清單。目標很簡單：證明可安裝套件能更新真實使用者狀態、透過 `doctor` 修復過時的舊狀態，並且仍能從支援的來源安裝、載入、更新與解除安裝 Plugin。

如需更完整的測試執行器地圖，請參閱[測試](/zh-TW/help/testing)。如需即時供應商金鑰與會觸及網路的測試套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的內容

更新與 Plugin 測試保護這些合約：

- 套件 tarball 完整、具有有效的 `dist/postinstall-inventory.json`，且不依賴未封裝的 repo 檔案。
- 使用者可以從較舊的已發布套件移轉到候選套件，而不會遺失設定、代理、工作階段、工作區、Plugin allowlist 或通道設定。
- `openclaw doctor --fix --non-interactive` 擁有舊版清理與修復路徑。啟動流程不應為過時 Plugin 狀態新增隱藏的相容性遷移。
- Plugin 可從本機目錄、git repo、npm 套件與 ClawHub registry 路徑安裝。
- Plugin npm 相依套件會安裝在受管理的 npm root 中，在信任前掃描，並在解除安裝期間透過 npm 移除，因此 hoisted 相依套件不會殘留。
- 當沒有任何變更時，Plugin 更新是穩定的：安裝記錄、解析後的來源、已安裝相依套件版面配置與啟用狀態都會保持完整。

## 開發期間的本機證明

先從狹窄範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

對於 Plugin 安裝、解除安裝、相依套件或套件清單變更，也請執行涵蓋已編輯銜接點的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker lane 使用 tarball 之前，先證明套件成品：

```bash
pnpm release:check
```

`release:check` 會執行設定/docs/API 漂移檢查、寫入套件 dist 清單、執行 `npm pack --dry-run`、拒絕禁止封裝的檔案、將 tarball 安裝到暫存 prefix、執行 postinstall，並 smoke test bundled channel 進入點。

## Docker lanes

Docker lanes 是產品層級的證明。它們會在 Linux 容器內安裝或更新真實套件，並透過 CLI 指令、Gateway 啟動、HTTP 探測、RPC 狀態與檔案系統狀態來斷言行為。

迭代時使用聚焦 lanes：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要 lanes：

- `test:docker:plugins` 會驗證 Plugin 安裝 smoke test、本機資料夾安裝、本機資料夾更新略過行為、具有預先安裝相依套件的本機資料夾、`file:` 套件安裝、搭配 CLI 執行的 git 安裝、git moving-ref 更新、具有 hoisted transitive 相依套件的 npm registry 安裝、npm 更新 no-op、本機 ClawHub fixture 安裝與更新 no-op、marketplace 更新行為，以及 Claude-bundle 啟用/檢查。設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可讓 ClawHub 區塊保持 hermetic/offline。
- `test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝候選套件，讓 npm Plugin 依序完成安裝、檢查、停用、啟用、明確升級、明確降級，以及刪除 Plugin 程式碼後解除安裝。它會為每個階段記錄 RSS 與 CPU 指標。
- `test:docker:plugin-update` 會驗證未變更的已安裝 Plugin 在 `openclaw plugins update` 期間不會重新安裝或遺失安裝 metadata。
- `test:docker:upgrade-survivor` 會將候選 tarball 安裝到髒的舊使用者 fixture 上，執行套件更新與非互動 doctor，接著啟動 local loopback Gateway 並檢查狀態保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發布 baseline，透過 baked `openclaw config set` recipe 設定它，將其更新到候選 tarball，執行 doctor，檢查舊版清理，啟動 Gateway，並探測 `/healthz`、`/readyz` 與 RPC 狀態。
- `test:docker:update-restart-auth` 會安裝候選套件、啟動受管理的 token-auth Gateway、為 `openclaw update --yes --json` 取消設定呼叫端 gateway auth env，並要求候選更新指令在正常探測前重新啟動 Gateway。
- `test:docker:update-migration` 是重清理的已發布更新 lane。它會從已設定的 Discord/Telegram 風格使用者狀態開始，執行 baseline doctor，讓已設定 Plugin 相依套件有機會實體化，為已設定的 packaged plugin 播種舊版 Plugin 相依套件殘留，更新到候選 tarball，並要求更新後 doctor 移除舊版相依套件 root。

實用的 published-upgrade survivor 變體：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用情境為 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 與 `versioned-runtime-deps`。在彙總執行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 會展開為所有回報問題形狀的情境，包括 configured-plugin install migration。

完整更新遷移刻意與 Full Release CI 分開。當發布問題是「自 2026.4.23 以來的每個已發布穩定版是否都能更新到此候選版本並清理 Plugin 相依套件殘留？」時，使用手動 `Update Migration` workflow：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance 是 GitHub 原生的套件 gate。它會將一個候選套件解析為 `package-under-test` tarball、記錄版本與 SHA-256，接著對該精確 tarball 執行可重用 Docker E2E lanes。workflow harness ref 與套件來源 ref 分離，因此目前的測試邏輯可以驗證較舊的可信任發布版本。

候選來源：

- `source=npm`：驗證 `openclaw@beta`、`openclaw@latest` 或精確的已發布版本。
- `source=ref`：使用選取的目前 harness 封裝可信任分支、tag 或 commit。
- `source=url`：使用必要的 `package_sha256` 驗證 HTTPS tarball。
- `source=artifact`：重用另一個 Actions run 上傳的 tarball。

Full Release Validation 預設使用 `source=artifact`，由已解析的 release SHA 建置。對於發布後證明，傳入 `package_acceptance_package_spec=openclaw@YYYY.M.D`，讓相同升級矩陣改為針對已出貨的 npm 套件。

Release checks 會使用 package/update/restart/plugin 集合呼叫 Package Acceptance：

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

啟用 release soak 時，它們也會傳入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

這會讓套件遷移、更新通道切換、損毀受管理 Plugin 容忍度、過時 Plugin 相依套件清理、offline Plugin 覆蓋率、Plugin 更新行為，以及 Telegram 套件 QA 使用同一個已解析成品，而不會讓預設發布套件 gate 走過每個已發布版本。

`last-stable-4` 會解析為四個最新的穩定 npm 發布 OpenClaw 版本。Release package acceptance 會將 `2026.4.23` 釘選為第一個 Plugin 更新相容性邊界、`2026.5.2` 釘選為 Plugin 架構 churn 邊界，並將 `2026.4.15` 釘選為較舊的 2026.4.1x 已發布更新 baseline；解析器會去除已在最新四個版本中的重複 pins。若要取得完整的已發布更新遷移覆蓋率，請在獨立的 Update Migration workflow 中使用 `all-since-2026.4.23`，而不是 Full Release CI。當你也想要舊版 pre-date anchor 時，`release-history` 仍可用於手動更廣泛抽樣。

選取多個 published-upgrade survivor baselines 時，可重用 Docker workflow 會將每個 baseline 分片到自己的目標 runner job。每個 baseline shard 仍會執行選取的情境集合，但 logs 與 artifacts 會維持每個 baseline 各自獨立，wall time 也會受最慢 shard 限制，而不是一個大型 serial job。

在發布前驗證候選版本時，手動執行 package profile：

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

當發布問題包含 MCP channels、cron/subagent 清理、OpenAI web search 或 OpenWebUI 時，使用 `suite_profile=product`。只有在需要完整 Docker release-path 覆蓋率時，才使用 `suite_profile=full`。

## 發布預設

對於 release candidates，預設證明堆疊為：

1. `pnpm check:changed` 與 `pnpm test:changed`，用於原始碼層級回歸。
2. `pnpm release:check`，用於套件成品完整性。
3. Package Acceptance `package` profile 或 release-check 自訂套件 lanes，用於 install/update/restart/plugin contracts。
4. Cross-OS release checks，用於 OS-specific installer、onboarding 與 platform behavior。
5. 只有在變更表面觸及供應商或 hosted-service 行為時，才執行 live suites。

在 maintainer machines 上，除非明確進行本機證明，否則 broad gates 與 Docker/package product proof 應在 Testbox 中執行。

## 舊版相容性

相容性寬容範圍很窄且有時間限制：

- 到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可在 Package Acceptance 中容忍已出貨的套件 metadata 缺口。
- 已發布的 `2026.4.26` 套件可針對已出貨的本機 build metadata stamp files 發出警告。
- 較新的套件必須滿足現代合約。相同缺口會失敗，而不是警告或略過。

不要為這些舊形狀新增啟動遷移。新增或擴充 doctor 修復，然後在更新指令擁有重新啟動時，使用 `upgrade-survivor`、`published-upgrade-survivor` 或 `update-restart-auth` 證明它。

## 新增覆蓋率

變更更新或 Plugin 行為時，請在能以正確原因失敗的最低層級新增覆蓋率：

- 純路徑或 metadata 邏輯：在原始碼旁新增單元測試。
- 套件清單或 packed-file 行為：`package-dist-inventory` 或 tarball checker 測試。
- CLI 安裝/更新行為：Docker lane 斷言或 fixture。
- 已發布版本遷移行為：`published-upgrade-survivor` 情境。
- 更新擁有的重新啟動行為：`update-restart-auth`。
- Registry/package source 行為：`test:docker:plugins` fixture 或 ClawHub fixture server。
- 相依套件版面配置或清理行為：同時斷言 runtime execution 與 filesystem boundary。npm dependencies 可能 hoisted 到受管理的 npm root 下，因此測試應證明 root 已被掃描/清理，而不是假設 package-local `node_modules` tree。

新的 Docker fixtures 預設應保持 hermetic。除非測試重點是即時 registry 行為，否則使用本機 fixture registries 與 fake packages。

## 失敗分流

從 artifact identity 開始：

- 套件驗收 `resolve_package` 摘要：來源、版本、SHA-256 和
  成品名稱。
- Docker 成品：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、lane 記錄，以及重新執行命令。
- 升級存續摘要：`.artifacts/upgrade-survivor/summary.json`，
  包含基準版本、候選版本、情境、階段時間，以及
  配方步驟。

優先使用相同的套件成品重新執行失敗的精確 lane，而不是
重新執行整個 release umbrella。
