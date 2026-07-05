---
read_when:
    - 變更 OpenClaw 更新、doctor、套件驗收或外掛安裝行為
    - 準備或核准候選版本
    - 偵錯套件更新、外掛依賴項清理或外掛安裝迴歸
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件遷移，以及外掛安裝/更新行為
title: 測試：更新與外掛
x-i18n:
    generated_at: "2026-07-05T11:25:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

更新與外掛驗證的檢查清單：證明可安裝套件能更新真實使用者狀態、透過 `doctor` 修復過時的舊狀態，並且仍可從每個支援來源安裝、載入、更新與解除安裝外掛。

如需更廣泛的測試執行器對照，請參閱[測試](/zh-TW/help/testing)。如需即時提供者金鑰與會觸及網路的套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的內容

- 套件 tarball 完整、具有有效的 `dist/postinstall-inventory.json`，且不依賴未封裝的儲存庫檔案。
- 使用者可以從較舊的已發布套件移轉到候選套件，而不會遺失設定、代理、工作階段、工作區、外掛允許清單或通道設定。
- `openclaw doctor --fix --non-interactive` 負責舊狀態清理與修復路徑。啟動流程不應為過時外掛狀態增加隱藏的相容性遷移。
- 外掛可從本機目錄、git 儲存庫、npm 套件與 ClawHub 登錄路徑安裝。
- 外掛 npm 依賴項會安裝在每個外掛各自的一個受管理 npm 專案中，先經掃描再被信任，並在外掛解除安裝期間透過 `npm uninstall` 移除，讓提升的依賴項不會殘留。
- 外掛更新在沒有變更時是無操作：安裝記錄、解析後來源、已安裝依賴項配置與啟用狀態都保持不變。

## 開發期間的本機證明

從窄範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

若變更涉及外掛安裝、解除安裝、依賴項或套件清單，也請執行涵蓋已編輯銜接面的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker 路徑使用 tarball 之前，先證明套件成品：

```bash
pnpm release:check
```

`release:check` 會執行設定/文件/API 漂移檢查（設定 schema、設定文件基準、外掛 SDK API 基準與匯出、外掛版本/清單）、寫入套件 dist 清單、執行 `npm pack --dry-run`、拒絕禁止封裝的檔案、將 tarball 安裝到暫存前綴、執行 postinstall，並對內建通道進入點做煙霧測試。

## Docker 路徑

Docker 路徑是產品層級證明。它們會在 Linux 容器內安裝或更新真實套件，並透過命令列介面命令、閘道啟動、HTTP 探測、RPC 狀態與檔案系統狀態斷言行為。

迭代時使用聚焦路徑：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要路徑：

- `test:docker:plugins` 涵蓋外掛安裝煙霧測試、本機資料夾安裝、本機資料夾更新略過行為、具有預先安裝依賴項的本機資料夾、`file:` 套件安裝、含命令列介面執行的 git 安裝、git moving-ref 更新、含提升傳遞依賴項的 npm 登錄安裝、npm 更新無操作、格式錯誤的 npm 套件中繼資料拒絕、本機 ClawHub fixture 安裝與更新無操作、市集更新行為，以及 Claude-bundle 啟用/檢查。設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可讓 ClawHub 區塊保持 hermetic/離線。
- `test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝候選套件，對 npm 外掛執行安裝、檢查、停用、啟用、明確升級、明確降級，以及刪除外掛程式碼後解除安裝。它會記錄每個階段的 RSS 與 CPU 指標。
- `test:docker:plugin-update` 驗證未變更的已安裝外掛在 `openclaw plugins update` 期間不會重新安裝或遺失安裝中繼資料。
- `test:docker:upgrade-survivor` 會將候選 tarball 安裝到髒的舊使用者 fixture 上，執行套件更新加上非互動式 doctor，然後啟動 loopback 閘道並檢查狀態保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發布基準，透過烘焙的 `openclaw config set` recipe 設定它，將它更新到候選 tarball，執行 doctor，檢查舊狀態清理，啟動閘道，並探測 `/healthz`、`/readyz` 與 RPC 狀態。
- `test:docker:update-restart-auth` 會安裝候選套件、啟動受管理 token-auth 閘道、為 `openclaw update --yes --json` 取消設定呼叫端閘道 auth 環境，並要求候選更新命令在一般探測前重新啟動閘道。
- `test:docker:update-migration` 是著重清理的已發布更新路徑。它從已設定的 Discord/Telegram 風格使用者狀態開始，執行基準 doctor，讓已設定的外掛依賴項有機會實體化，為已設定的封裝外掛植入舊外掛依賴項殘留，更新到候選 tarball，並要求更新後 doctor 移除舊依賴項根目錄。

實用的已發布升級存活者變體：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用情境：`base`、`acpx-openclaw-tools-bridge`、`feishu-channel`、`bootstrap-persona`、`channel-post-core-restore`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 與 `versioned-runtime-deps`。在聚合執行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`（別名 `far-reaching`）會展開為所有情境，包括 configured-plugin 安裝遷移。

完整更新遷移刻意與完整發布 CI 分離。當發布問題是「從 2026.4.23 起的每個已發布穩定版本是否都能更新到此候選版本並清理外掛依賴項殘留？」時，使用手動 `Update Migration` workflow：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 套件驗收

套件驗收是 GitHub 原生套件閘門。它會將一個候選套件解析為 `package-under-test` tarball、記錄版本與 SHA-256，然後針對該精確 tarball 執行可重用的 Docker E2E 路徑。workflow harness ref 與套件來源 ref 分離，因此目前測試邏輯可驗證較舊的受信任發布。

候選來源：

- `source=npm`：驗證 `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest` 或精確的已發布版本。
- `source=ref`：使用選定的目前 harness 封裝受信任分支、標籤或提交。
- `source=url`：驗證具有必要 `package_sha256` 的公開 HTTPS tarball。此路徑會拒絕 URL 認證、非預設 HTTPS 連接埠、私有/內部主機名稱或 DNS/IP 結果、特殊用途 IP 空間與不安全重新導向。
- `source=trusted-url`：使用必要的 `package_sha256` 與 `trusted_source_id`，依 `.github/package-trusted-sources.json` 中維護者擁有的政策驗證 HTTPS tarball。請將此用於企業/私有鏡像，而不是用輸入層級 allow-private 開關削弱 `source=url`。Bearer auth 在由政策設定時，會使用固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret。
- `source=artifact`：重用另一個 Actions 執行上傳的 tarball。

完整發布驗證預設使用 `source=artifact`，從已解析的發布 SHA 建置。若要進行發布後證明，請傳入 `package_acceptance_package_spec=openclaw@YYYY.M.PATCH`，讓同一個升級矩陣改以已發佈的 npm 套件為目標。

發布檢查會以套件/更新/重新啟動/外掛集合呼叫套件驗收：

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

當啟用發布 soak（對 `release_profile=stable` 與 `full` 強制開啟）時，它們也會傳入：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

這會讓套件遷移、更新通道切換、受管理外掛損毀容忍、過時外掛依賴項清理、離線外掛涵蓋範圍、外掛更新行為與 Telegram 套件 QA 都針對同一個已解析成品執行，而不讓預設發布套件閘門走訪每個已發布版本。

`last-stable-4` 解析為最新四個已由 npm 發布的穩定 OpenClaw 版本。發布套件驗收會將 `2026.4.23` 固定為第一個外掛更新相容性邊界、`2026.5.2` 固定為外掛架構變動邊界，並將 `2026.4.15` 固定為較舊的 2026.4.1x 已發布更新基準；解析器會去除已包含在最新四個中的固定版本。若要完整涵蓋已發布更新遷移，請在獨立的更新遷移 workflow 中使用 `all-since-2026.4.23`，而不是完整發布 CI。當你也需要舊的日期前錨點時，`release-history` 仍可用於手動更廣泛取樣。

選取多個已發布升級存活者基準時，可重用 Docker workflow 會將每個基準分片到各自的目標 runner job。每個基準分片仍會執行選定的情境集合，但記錄與成品會按基準保留，且總時間受最慢分片限制，而不是一個大型序列 job。

在發布前驗證候選版本時，手動執行套件設定檔：

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

對於已發布的 extended-stable 金絲雀，設定 `package_spec=openclaw@extended-stable`。套件驗收會在 Docker 路徑執行前，將該選擇器解析為精確 tarball。

當發布問題包含 MCP 通道、cron/subagent 清理、OpenAI web search 或 OpenWebUI 時，使用 `suite_profile=product`。只有在需要完整 Docker 發布路徑涵蓋範圍時，才使用 `suite_profile=full`。

## 發布預設

對於候選發布版本，預設證明堆疊是：

1. `pnpm check:changed` 與 `pnpm test:changed`，用於來源層級回歸。
2. `pnpm release:check`，用於套件成品完整性。
3. 套件驗收 `package` 設定檔或 release-check 自訂套件路徑，用於安裝/更新/重新啟動/外掛合約。
4. 跨 OS 發布檢查，用於 OS 特定安裝程式、onboarding 與平台行為。
5. 只有在變更面觸及提供者或託管服務行為時，才執行即時套件。

在維護者機器上，廣泛閘門與 Docker/套件產品證明應在 Testbox 中執行，除非明確進行本機證明。

## 舊版相容性

相容性寬容範圍很窄且有時限：

- 到 `2026.4.25` 為止的套件（包括 `2026.4.25-beta.*`）可在套件驗收中容忍已發布套件中繼資料缺口。
- 已發布的 `2026.4.26` 套件可對已出貨的本機建置中繼資料戳記檔提出警告。
- 之後的套件必須滿足現代合約。相同缺口會失敗，而不是警告或略過。

不要為這些舊形狀新增啟動遷移。請新增或擴充 doctor 修復，然後在更新命令負責重新啟動時，使用 `upgrade-survivor`、`published-upgrade-survivor` 或 `update-restart-auth` 證明它。

## 新增涵蓋範圍

變更更新或外掛行為時，請在能因正確原因失敗的最低層級新增涵蓋範圍：

- 純路徑或中繼資料邏輯：在來源旁新增單元測試。
- 套件清單或打包檔案行為：`package-dist-inventory` 或 tarball
  檢查器測試。
- 命令列介面安裝/更新行為：Docker lane 斷言或 fixture。
- 已發布版本遷移行為：`published-upgrade-survivor` 情境。
- 更新負責的重新啟動行為：`update-restart-auth`。
- 登錄/套件來源行為：`test:docker:plugins` fixture 或 ClawHub
  fixture 伺服器。
- 依賴項版面配置或清理行為：同時斷言執行階段執行與檔案系統邊界。npm 依賴項可能會被提升到外掛的
  受管 npm 專案內，因此測試應證明該專案會被掃描/清理，
  而不是假設只有外掛套件本機的 `node_modules` 樹。

預設讓新的 Docker fixtures 保持 hermetic。除非測試重點是即時登錄行為，
否則請使用本機 fixture 登錄與假套件。

## 失敗分診

從成品身分開始：

- Package Acceptance `resolve_package` 摘要：來源、版本、SHA-256，以及
  成品名稱。
- Docker 成品：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、lane 記錄，以及重新執行命令。
- Upgrade survivor 摘要：`.artifacts/upgrade-survivor/summary.json`，
  包含基準版本、候選版本、情境、階段計時，以及
  設定 recipe 覆蓋範圍。

優先使用同一個套件成品重新執行失敗的確切 lane，
而不是重新執行整個發布 umbrella。
