---
read_when:
    - 變更 OpenClaw 更新、doctor、套件驗收或 Plugin 安裝行為
    - 準備或核准候選版本
    - 除錯套件更新、Plugin 依賴項清理或 Plugin 安裝回歸問題
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件遷移與 Plugin 安裝/更新行為
title: 測試：更新與 Plugin
x-i18n:
    generated_at: "2026-05-05T06:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

這是更新與 Plugin 驗證的專用檢查清單。目標很簡單：證明可安裝套件可以更新真實使用者狀態、透過 `doctor` 修復過時的舊狀態，並且仍能從支援的來源安裝、載入、更新與解除安裝 Plugin。

如需更完整的測試執行器對照，請參閱[測試](/zh-TW/help/testing)。如需即時提供者金鑰與會觸及網路的測試套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的內容

更新與 Plugin 測試保護下列合約：

- 套件 tarball 完整、具有有效的 `dist/postinstall-inventory.json`，且不依賴未打包的 repo 檔案。
- 使用者可以從較舊的已發布套件移至候選套件，而不會遺失設定、agent、session、workspace、Plugin allowlist 或 channel 設定。
- `openclaw doctor --fix --non-interactive` 負責舊版清理與修復路徑。啟動流程不應為過時的 Plugin 狀態增加隱藏的相容性遷移。
- Plugin 可從本機目錄、git repo、npm 套件與 ClawHub registry 路徑安裝。
- Plugin npm 相依套件會安裝在受管理的 npm root 中、在信任前被掃描，並在解除安裝時透過 npm 移除，因此 hoisted 相依套件不會殘留。
- 當沒有任何變更時，Plugin 更新是穩定的：安裝記錄、解析後來源、已安裝相依套件配置與啟用狀態都保持不變。

## 開發期間的本機證明

從窄範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

對於 Plugin 安裝、解除安裝、相依套件或套件 inventory 變更，也請執行涵蓋所編輯邊界的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker lane 使用 tarball 前，先證明套件 artifact：

```bash
pnpm release:check
```

`release:check` 會執行設定/docs/API drift 檢查、寫入套件 dist inventory、執行 `npm pack --dry-run`、拒絕被禁止的打包檔案、將 tarball 安裝到暫存 prefix、執行 postinstall，並 smoke bundled channel entrypoints。

## Docker lanes

Docker lanes 是產品層級證明。它們會在 Linux container 中安裝或更新真實套件，並透過 CLI 命令、Gateway 啟動、HTTP probes、RPC 狀態與檔案系統狀態斷言行為。

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

- `test:docker:plugins` 驗證 Plugin 安裝 smoke、本機資料夾安裝、本機資料夾更新跳過行為、含預先安裝相依套件的本機資料夾、`file:` 套件安裝、帶 CLI 執行的 git 安裝、git moving-ref 更新、含 hoisted transitive 相依套件的 npm registry 安裝、npm 更新 no-op、本機 ClawHub fixture 安裝與更新 no-op、marketplace 更新行為，以及 Claude-bundle 啟用/檢查。設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可讓 ClawHub 區塊保持 hermetic/offline。
- `test:docker:plugin-lifecycle-matrix` 會在裸 container 中安裝候選套件，讓 npm Plugin 依序經過安裝、檢查、停用、啟用、明確升級、明確降級，以及在刪除 Plugin 程式碼後解除安裝。它會記錄每個階段的 RSS 與 CPU 指標。
- `test:docker:plugin-update` 驗證未變更的已安裝 Plugin 在 `openclaw plugins update` 期間不會重新安裝或遺失安裝 metadata。
- `test:docker:upgrade-survivor` 會將候選 tarball 安裝到髒的舊使用者 fixture 上，執行套件更新與非互動式 doctor，然後啟動 loopback Gateway 並檢查狀態保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發布 baseline，透過內建的 `openclaw config set` recipe 設定它，將它更新到候選 tarball，執行 doctor，檢查舊版清理，啟動 Gateway，並 probe `/healthz`、`/readyz` 與 RPC 狀態。
- `test:docker:update-restart-auth` 會安裝候選套件、啟動受管理的 token-auth Gateway、為 `openclaw update --yes --json` unset 呼叫者 gateway auth env，並要求候選更新命令在正常 probes 前重新啟動 Gateway。
- `test:docker:update-migration` 是清理密集的 published-update lane。它從已設定的 Discord/Telegram 風格使用者狀態開始，執行 baseline doctor 讓已設定的 Plugin 相依套件有機會實體化，為已設定的 packaged Plugin seed 舊版 Plugin 相依套件殘骸，更新到候選 tarball，並要求 post-update doctor 移除舊版相依套件 root。

實用的 published-upgrade survivor 變體：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用情境為 `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 與 `versioned-runtime-deps`。在彙總執行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 會展開為所有回報 issue 形狀的情境，包括 configured-plugin install migration。

完整更新遷移刻意與 Full Release CI 分離。當發布問題是「從 2026.4.23 起的每個已發布穩定版本，是否都能更新到此候選版本並清理 Plugin 相依套件殘骸？」時，請使用手動 `Update Migration` workflow：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance 是 GitHub 原生的套件 gate。它會將一個候選套件解析成 `package-under-test` tarball，記錄版本與 SHA-256，然後對該精確 tarball 執行可重用的 Docker E2E lanes。workflow harness ref 與套件來源 ref 分離，因此目前測試邏輯可以驗證較舊的受信任版本。

候選來源：

- `source=npm`：驗證 `openclaw@beta`、`openclaw@latest` 或精確的已發布版本。
- `source=ref`：使用所選的目前 harness 打包受信任 branch、tag 或 commit。
- `source=url`：使用必要的 `package_sha256` 驗證 HTTPS tarball。
- `source=artifact`：重用另一個 Actions run 上傳的 tarball。

Full Release Validation 預設使用 `source=artifact`，從解析後的 release SHA 建置。若要進行發布後證明，請傳入 `package_acceptance_package_spec=openclaw@YYYY.M.D`，讓相同的升級矩陣改以已出貨的 npm 套件為目標。

Release checks 會以 package/update/restart/plugin 集合呼叫 Package Acceptance：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

啟用 release soak 時，它們也會傳入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

這會讓套件遷移、更新 channel 切換、過時 Plugin 相依套件清理、離線 Plugin 覆蓋、Plugin 更新行為，以及 Telegram 套件 QA 都落在同一個解析後 artifact 上，而不讓預設 release package gate 遍歷每個已發布版本。

`last-stable-4` 會解析為 npm 已發布的四個最新穩定 OpenClaw 版本。Release package acceptance 將 `2026.4.23` pin 為第一個 plugin-update 相容性邊界，將 `2026.5.2` pin 為 Plugin 架構 churn 邊界，並將 `2026.4.15` pin 為較舊的 2026.4.1x published-update baseline；resolver 會 dedupe 已包含在最新四個版本中的 pins。如需完整的 published update migration 覆蓋，請在獨立的 Update Migration workflow 中使用 `all-since-2026.4.23`，而不是 Full Release CI。當你也想要 legacy pre-date anchor 時，`release-history` 仍可用於手動更廣泛抽樣。

選取多個 published-upgrade survivor baselines 時，可重用 Docker workflow 會將每個 baseline shard 成各自的 targeted runner job。每個 baseline shard 仍會執行所選情境集合，但 log 與 artifact 會保持 per-baseline，而總時間會受最慢 shard 約束，而不是一個大型 serial job。

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

當發布問題包含 MCP channels、cron/subagent 清理、OpenAI web search 或 OpenWebUI 時，使用 `suite_profile=product`。只有在需要完整 Docker release-path 覆蓋時，才使用 `suite_profile=full`。

## 發布預設值

對於 release candidates，預設證明堆疊為：

1. `pnpm check:changed` 與 `pnpm test:changed`，用於 source-level regressions。
2. `pnpm release:check`，用於套件 artifact 完整性。
3. Package Acceptance `package` profile 或 release-check 自訂套件 lanes，用於 install/update/restart/plugin 合約。
4. Cross-OS release checks，用於 OS-specific 安裝程式、onboarding 與平台行為。
5. 只有當變更表面觸及提供者或 hosted-service 行為時，才執行即時測試套件。

在 maintainer machines 上，broad gates 與 Docker/package 產品證明應在 Testbox 中執行，除非明確進行本機證明。

## 舊版相容性

相容性寬容範圍很窄且有時間限制：

- 到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可在 Package Acceptance 中容忍已出貨的套件 metadata 缺口。
- 已發布的 `2026.4.26` 套件可能會對已出貨的本機 build metadata stamp 檔案發出警告。
- 後續套件必須滿足現代合約。相同缺口會失敗，而不是警告或跳過。

不要為這些舊形狀新增啟動遷移。新增或擴充 doctor 修復，然後在 update 命令負責 restart 時，用 `upgrade-survivor`、`published-upgrade-survivor` 或 `update-restart-auth` 證明它。

## 新增覆蓋

變更更新或 Plugin 行為時，請在能因正確原因失敗的最低層級新增覆蓋：

- 純 path 或 metadata 邏輯：在來源旁新增 unit test。
- 套件 inventory 或 packed-file 行為：`package-dist-inventory` 或 tarball checker test。
- CLI 安裝/更新行為：Docker lane assertion 或 fixture。
- Published-release migration 行為：`published-upgrade-survivor` 情境。
- Update-owned restart 行為：`update-restart-auth`。
- Registry/package source 行為：`test:docker:plugins` fixture 或 ClawHub fixture server。
- 相依套件配置或清理行為：同時斷言 runtime execution 與 filesystem boundary。npm 相依套件可能 hoist 到受管理的 npm root 下，因此測試應證明 root 已被掃描/清理，而不是假設 package-local `node_modules` tree。

新的 Docker fixtures 預設保持 hermetic。除非測試重點是即時 registry 行為，否則使用本機 fixture registries 與 fake packages。

## 失敗分診

從 artifact identity 開始：

- 套件驗收 `resolve_package` 摘要：來源、版本、SHA-256，以及
  成品名稱。
- Docker 成品：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、通道記錄，以及重新執行命令。
- 升級存活摘要：`.artifacts/upgrade-survivor/summary.json`，
  包含基準版本、候選版本、情境、階段時間，以及
  recipe 步驟。

優先使用相同套件成品重新執行失敗的確切通道，而不是
重新執行整個發布總括流程。
