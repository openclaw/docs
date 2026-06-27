---
read_when:
    - 變更 OpenClaw 更新、doctor、套件驗收或外掛安裝行為
    - 準備或核准候選版本
    - 偵錯套件更新、外掛依賴項清理或外掛安裝回歸問題
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件遷移，以及外掛安裝／更新行為
title: 測試：更新與外掛
x-i18n:
    generated_at: "2026-06-27T19:24:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

這是更新與外掛驗證的專用檢查清單。目標很簡單：證明可安裝套件能更新真實使用者狀態、透過 `doctor` 修復過時的舊版狀態，並且仍能從支援的來源安裝、載入、更新及解除安裝外掛。

如需更完整的測試執行器對照，請參閱[測試](/zh-TW/help/testing)。如需即時供應商金鑰與會觸及網路的測試套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的內容

更新與外掛測試保護以下合約：

- 套件 tarball 是完整的、具有有效的 `dist/postinstall-inventory.json`，且不依賴未打包的 repo 檔案。
- 使用者可以從較舊的已發布套件移至候選套件，而不會遺失設定、代理、工作階段、工作區、外掛允許清單或通道設定。
- `openclaw doctor --fix --non-interactive` 擁有舊版清理與修復路徑。啟動流程不應為過時的外掛狀態增加隱藏的相容性遷移。
- 外掛可從本機目錄、git repo、npm 套件與 ClawHub registry 路徑安裝。
- 外掛 npm 依賴項會安裝在每個外掛各自的一個受管理 npm 專案中，在信任前先掃描，並在解除安裝時透過 npm 移除，避免提升的依賴項殘留。
- 外掛更新在沒有任何變更時保持穩定：安裝記錄、解析後來源、已安裝依賴項配置與啟用狀態都保持不變。

## 開發期間的本機證明

從窄範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

若有外掛安裝、解除安裝、依賴項或套件 inventory 變更，也請執行涵蓋已編輯接縫的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker lane 消耗 tarball 之前，先證明套件 artifact：

```bash
pnpm release:check
```

`release:check` 會執行設定/docs/API 漂移檢查、寫入套件 dist inventory、執行 `npm pack --dry-run`、拒絕禁止打包的檔案、將 tarball 安裝到暫存 prefix、執行 postinstall，並對 bundled channel entrypoints 進行 smoke 測試。

## Docker lanes

Docker lanes 是產品層級證明。它們會在 Linux 容器內安裝或更新真實套件，並透過命令列介面命令、閘道啟動、HTTP probes、RPC 狀態與檔案系統狀態來斷言行為。

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

- `test:docker:plugins` 驗證外掛安裝 smoke、本機資料夾安裝、本機資料夾更新略過行為、具有預先安裝依賴項的本機資料夾、`file:` 套件安裝、含命令列介面執行的 git 安裝、git moving-ref 更新、含提升的遞移依賴項的 npm registry 安裝、npm 更新 no-op、格式錯誤的 npm 套件 metadata 拒絕、本機 ClawHub fixture 安裝與更新 no-op、marketplace 更新行為，以及 Claude-bundle 啟用/檢查。設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可讓 ClawHub 區塊保持 hermetic/offline。
- `test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝候選套件，讓 npm 外掛完成安裝、檢查、停用、啟用、明確升級、明確降級，以及刪除外掛程式碼後解除安裝。它會記錄每個階段的 RSS 與 CPU 指標。
- `test:docker:plugin-update` 驗證未變更的已安裝外掛在 `openclaw plugins update` 期間不會重新安裝或遺失安裝 metadata。
- `test:docker:upgrade-survivor` 會將候選 tarball 安裝到骯髒的舊使用者 fixture 上，執行套件更新與非互動式 doctor，然後啟動 loopback 閘道並檢查狀態保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發布 baseline，透過內建的 `openclaw config set` recipe 設定它，將其更新至候選 tarball，執行 doctor，檢查舊版清理，啟動閘道，並 probe `/healthz`、`/readyz` 與 RPC 狀態。
- `test:docker:update-restart-auth` 會安裝候選套件，啟動受管理的 token-auth 閘道，為 `openclaw update --yes --json` 取消設定呼叫端 gateway auth env，並要求候選更新命令在一般 probes 前重新啟動閘道。
- `test:docker:update-migration` 是重清理的已發布更新 lane。它從已設定的 Discord/Telegram 風格使用者狀態開始，執行 baseline doctor，讓已設定外掛依賴項有機會實體化，為已設定的 packaged plugin 植入舊版外掛依賴項殘留，更新至候選 tarball，並要求更新後 doctor 移除舊版依賴項根目錄。

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

完整更新遷移刻意與 Full Release CI 分離。當發布問題是「從 2026.4.23 起的每個已發布穩定版本是否都能更新到此候選版本並清理外掛依賴項殘留？」時，請使用手動 `Update Migration` workflow：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 套件驗收

套件驗收是 GitHub 原生套件 gate。它會將一個候選套件解析為 `package-under-test` tarball，記錄版本與 SHA-256，然後對該精確 tarball 執行可重用的 Docker E2E lanes。workflow harness ref 與套件來源 ref 分離，因此目前的測試邏輯可以驗證較舊的受信任發布版本。

候選來源：

- `source=npm`：驗證 `openclaw@beta`、`openclaw@latest` 或精確的已發布版本。
- `source=ref`：使用選定的目前 harness 打包受信任的 branch、tag 或 commit。
- `source=url`：使用必要的 `package_sha256` 驗證公開 HTTPS tarball。此路徑會拒絕 URL credentials、非預設 HTTPS ports、私有/內部 hostnames 或 DNS/IP 結果、特殊用途 IP 空間與不安全 redirects。
- `source=trusted-url`：使用必要的 `package_sha256` 與 `trusted_source_id`，依據 `.github/package-trusted-sources.json` 中 maintainer-owned policy 驗證 HTTPS tarball。請將此用於企業/私有 mirrors，而不是使用 input-level allow-private switch 來削弱 `source=url`。Bearer auth 若由 policy 設定，會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret。
- `source=artifact`：重用另一個 Actions run 上傳的 tarball。

Full Release Validation 預設使用 `source=artifact`，由解析後的 release SHA 建置。若要進行發布後證明，請傳入 `package_acceptance_package_spec=openclaw@YYYY.M.PATCH`，讓同一個升級矩陣改為目標已發布的 npm 套件。

Release checks 會使用 package/update/restart/plugin 集合呼叫套件驗收：

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

啟用 release soak 時，它們也會傳入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

這讓套件遷移、更新通道切換、損壞 managed-plugin 容忍、過時外掛依賴項清理、離線外掛涵蓋、外掛更新行為與 Telegram 套件 QA，都在同一個解析後 artifact 上執行，而不會讓預設 release package gate 走遍每個已發布版本。

`last-stable-4` 會解析為四個最新穩定 npm-published OpenClaw 發布版本。Release package acceptance 釘選 `2026.4.23` 作為第一個 plugin-update 相容性邊界、`2026.5.2` 作為 plugin-architecture churn 邊界，並將 `2026.4.15` 作為較舊的 2026.4.1x published-update baseline；resolver 會對已在最新四個版本中的 pins 去重。若需要完整的已發布更新遷移涵蓋，請在獨立的 Update Migration workflow 中使用 `all-since-2026.4.23`，而不是 Full Release CI。當你也想要舊版 pre-date anchor 時，`release-history` 仍可用於手動更廣泛取樣。

選取多個 published-upgrade survivor baselines 時，可重用 Docker workflow 會將每個 baseline 分片到各自的目標 runner job。每個 baseline shard 仍會執行選定的情境集合，但 logs 與 artifacts 會保持 per-baseline，wall time 也會受限於最慢的 shard，而不是一個大型 serial job。

在發布前驗證候選版本時，手動執行套件 profile：

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

當發布問題包含 MCP channels、排程/subagent cleanup、OpenAI web search 或 OpenWebUI 時，請使用 `suite_profile=product`。只有在需要完整 Docker release-path 涵蓋時，才使用 `suite_profile=full`。

## 發布預設

對於 release candidates，預設證明堆疊為：

1. `pnpm check:changed` 與 `pnpm test:changed`，用於 source-level regressions。
2. `pnpm release:check`，用於套件 artifact 完整性。
3. 套件驗收 `package` profile 或 release-check 自訂套件 lanes，用於 install/update/restart/plugin 合約。
4. Cross-OS release checks，用於 OS-specific installer、onboarding 與 platform behavior。
5. 只有在已變更表面觸及供應商或 hosted-service behavior 時，才執行 live suites。

在 maintainer machines 上，broad gates 與 Docker/package product proof 應在 Testbox 中執行，除非明確正在執行本機證明。

## 舊版相容性

相容性寬容範圍很窄，且有時間限制：

- 到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可在套件驗收中容忍已經發布的套件 metadata 缺口。
- 已發布的 `2026.4.26` 套件可對已發布的本機建置 metadata stamp files 發出警告。
- 後續套件必須滿足現代合約。相同缺口會失敗，而不是警告或略過。

不要為這些舊形狀加入新的啟動遷移。請新增或擴充 doctor 修復，然後在更新命令擁有重新啟動時，使用 `upgrade-survivor`、`published-upgrade-survivor` 或 `update-restart-auth` 證明它。

## 新增涵蓋

變更更新或外掛行為時，請在能因正確原因失敗的最低層新增涵蓋：

- 純路徑或中繼資料邏輯：在來源旁新增單元測試。
- 套件清單或已打包檔案行為：`package-dist-inventory` 或 tarball
  檢查器測試。
- 命令列介面安裝/更新行為：Docker 路徑斷言或 fixture。
- 已發布版本遷移行為：`published-upgrade-survivor` 情境。
- 更新所擁有的重新啟動行為：`update-restart-auth`。
- 登錄檔/套件來源行為：`test:docker:plugins` fixture 或 ClawHub
  fixture 伺服器。
- 相依性配置或清理行為：同時斷言執行階段執行與
  檔案系統邊界。npm 相依性可能會被提升到外掛的
  受管理 npm 專案內，因此測試應證明會掃描/清理該專案，
  而不是假設只會處理外掛套件本機的 `node_modules` 樹。

預設保持新的 Docker fixture hermetic。除非測試重點是即時登錄檔行為，否則請使用本機 fixture 登錄檔與
假套件。

## 失敗分流

從成品身分開始：

- Package Acceptance `resolve_package` 摘要：來源、版本、SHA-256，以及
  成品名稱。
- Docker 成品：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、路徑日誌，以及重新執行命令。
- 升級倖存者摘要：`.artifacts/upgrade-survivor/summary.json`，
  包含基準版本、候選版本、情境、階段計時，以及
  recipe 步驟。

偏好使用相同套件成品重新執行失敗的精確路徑，而不是
重新執行整個 release umbrella。
