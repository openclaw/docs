---
read_when:
    - 變更 OpenClaw 更新、doctor、套件驗收或 Plugin 安裝行為
    - 準備或核准發行候選版本
    - 偵錯套件更新、Plugin 相依性清理或 Plugin 安裝迴歸问题
sidebarTitle: Update and plugin tests
summary: OpenClaw 如何驗證更新路徑、套件遷移，以及 Plugin 安裝/更新行為
title: 測試：更新與 Plugin
x-i18n:
    generated_at: "2026-05-02T02:53:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

這是更新與 Plugin 驗證的專用檢查清單。目標很
簡單：證明可安裝套件能更新真實使用者狀態，透過 `doctor` 修復過時的
舊版狀態，並且仍然能從支援的來源安裝、載入、更新與解除安裝
plugins。

如需更完整的測試執行器對照，請參閱[測試](/zh-TW/help/testing)。如需即時提供者
金鑰與會觸及網路的套件，請參閱[即時測試](/zh-TW/help/testing-live)。

## 我們保護的內容

更新與 Plugin 測試會保護以下合約：

- 套件 tarball 完整，具有有效的 `dist/postinstall-inventory.json`，
  且不依賴未打包的 repo 檔案。
- 使用者可以從較舊的已發布套件移轉到候選套件，
  而不會遺失設定、agents、sessions、workspaces、Plugin allowlists 或
  channel 設定。
- `openclaw doctor --fix --non-interactive` 負責舊版清理與修復
  路徑。啟動流程不應為過時的 Plugin 狀態增加隱藏的相容性遷移。
- Plugin 安裝可從本機目錄、git repos、npm packages，以及
  ClawHub registry 路徑運作。
- Plugin npm 相依項會安裝在受管理的 npm root 中，信任前會先掃描，
  並在解除安裝時透過 npm 移除，避免 hoisted dependencies 殘留。
- 當沒有任何變更時，Plugin 更新是穩定的：安裝紀錄、解析後的
  source、已安裝相依項配置，以及啟用狀態都會保持完整。

## 開發期間的本機證明

從窄範圍開始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

針對 Plugin 安裝、解除安裝、相依項或套件 inventory 變更，也要
執行涵蓋已編輯邊界的聚焦測試：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何套件 Docker lane 消耗 tarball 之前，先證明套件 artifact：

```bash
pnpm release:check
```

`release:check` 會執行設定/文件/API drift 檢查、寫入套件 dist
inventory、執行 `npm pack --dry-run`、拒絕禁止打包的檔案、將
tarball 安裝到暫存 prefix、執行 postinstall，並 smoke bundled channel
entrypoints。

## Docker lanes

Docker lanes 是產品層級的證明。它們會在 Linux containers 內安裝或更新真實
套件，並透過 CLI commands、Gateway 啟動、HTTP probes、RPC 狀態與檔案系統狀態
斷言行為。

迭代時使用聚焦 lanes：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要 lanes：

- `test:docker:plugins` 驗證 Plugin 安裝 smoke、本機資料夾安裝、
  本機資料夾更新略過行為、具有預先安裝相依項的本機資料夾、
  `file:` package 安裝、具 CLI 執行的 git 安裝、git moving-ref 更新、
  具有 hoisted transitive dependencies 的 npm registry 安裝、npm 更新 no-ops、
  本機 ClawHub fixture 安裝與更新 no-ops、marketplace 更新行為，以及 Claude-bundle 啟用/檢查。設定
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可讓 ClawHub 區塊保持 hermetic/offline。
- `test:docker:plugin-update` 驗證未變更的已安裝 Plugin 在
  `openclaw plugins update` 期間不會重新安裝或遺失安裝 metadata。
- `test:docker:upgrade-survivor` 會將候選 tarball 安裝到髒的
  舊使用者 fixture 上方，執行套件更新加上 non-interactive doctor，接著啟動
  local loopback Gateway 並檢查狀態保留。
- `test:docker:published-upgrade-survivor` 會先安裝已發布 baseline，
  透過 baked `openclaw config set` recipe 設定它，將其更新到
  候選 tarball，執行 doctor，檢查舊版清理，啟動 Gateway，並
  probe `/healthz`、`/readyz` 與 RPC 狀態。
- `test:docker:update-migration` 是 cleanup-heavy 的 published-update lane。它
  從已設定的 Discord/Telegram-style 使用者狀態開始，執行 baseline
  doctor，讓已設定的 Plugin 相依項有機會實體化，為已設定的 packaged Plugin
  播種舊版 Plugin 相依項殘留，更新到候選 tarball，並要求 post-update doctor
  移除舊版相依項 roots。

實用的 published-upgrade survivor 變體：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用 scenarios 為 `base`、`feishu-channel`、`bootstrap-persona`、
`plugin-deps-cleanup`、`tilde-log-path` 與 `versioned-runtime-deps`。在彙總執行中，
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 會展開為所有已回報
issue-shaped scenarios。

完整更新遷移刻意與 Full Release CI 分開。當 release 問題是「自
2026.4.23 起的每個已發布 stable release 是否都能更新到此候選版本，並
清理 Plugin 相依項殘留？」時，請使用手動 `Update Migration` workflow：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance 是 GitHub-native 的套件 gate。它會將一個候選
套件解析成 `package-under-test` tarball，記錄版本與 SHA-256，接著
針對該精確 tarball 執行 reusable Docker E2E lanes。workflow harness
ref 與 package source ref 分離，因此目前的測試邏輯可以驗證
較舊的受信任 releases。

候選來源：

- `source=npm`：驗證 `openclaw@beta`、`openclaw@latest`，或精確的
  已發布版本。
- `source=ref`：使用所選的目前 harness 打包受信任的 branch、tag 或 commit。
- `source=url`：使用必要的 `package_sha256` 驗證 HTTPS tarball。
- `source=artifact`：重用另一個 Actions run 上傳的 tarball。

Release checks 會以 package/update/plugin set 呼叫 Package Acceptance：

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

它們也會傳入：

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

這會讓套件遷移、更新 channel 切換、過時 Plugin 相依項清理、
離線 Plugin 涵蓋、Plugin 更新行為，以及 Telegram 套件 QA 都使用同一個已解析 artifact。

`release-history` 是有界的 release-check sample：最新六個 stable releases、
`2026.4.23`，以及一個更舊的 pre-date anchor。若要做詳盡的已發布更新
遷移涵蓋，請在獨立的 Update Migration workflow 中使用
`all-since-2026.4.23`，而不是 Full Release CI。

在 release 前驗證候選版本時，手動執行 package profile：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

當 release 問題包含 MCP channels、cron/subagent cleanup、OpenAI web search
或 OpenWebUI 時，使用 `suite_profile=product`。只有在需要完整 Docker release-path
涵蓋時才使用 `suite_profile=full`。

## Release 預設值

針對 release candidates，預設證明堆疊是：

1. `pnpm check:changed` 與 `pnpm test:changed`，用於 source-level regressions。
2. `pnpm release:check`，用於套件 artifact integrity。
3. Package Acceptance `package` profile 或 release-check 自訂 package
   lanes，用於 install/update/plugin contracts。
4. Cross-OS release checks，用於 OS-specific installer、onboarding 與 platform
   behavior。
5. 只有在變更表面觸及提供者或 hosted-service behavior 時，才執行 live suites。

在 maintainer machines 上，broad gates 與 Docker/package product proof 應在
Testbox 中執行，除非明確要做本機證明。

## 舊版相容性

相容性寬容範圍很窄且有時間限制：

- 到 `2026.4.25` 為止的套件，包含 `2026.4.25-beta.*`，在 Package Acceptance
  中可以容忍已經出貨的套件 metadata 缺口。
- 已發布的 `2026.4.26` 套件可以針對已出貨的本機 build metadata stamp
  檔案發出警告。
- 後續套件必須滿足現代合約。相同缺口會失敗，而不是警告或略過。

不要為這些舊形狀新增啟動遷移。請新增或擴充 doctor
修復，然後使用 `upgrade-survivor` 或 `published-upgrade-survivor` 證明。

## 新增涵蓋

變更更新或 Plugin 行為時，請在能以正確原因失敗的最低層新增涵蓋：

- 純路徑或 metadata 邏輯：來源旁的 unit test。
- Package inventory 或 packed-file 行為：`package-dist-inventory` 或 tarball
  checker test。
- CLI install/update 行為：Docker lane assertion 或 fixture。
- Published-release migration 行為：`published-upgrade-survivor` scenario。
- Registry/package source 行為：`test:docker:plugins` fixture 或 ClawHub
  fixture server。
- Dependency layout 或 cleanup 行為：同時斷言 runtime execution 與
  filesystem boundary。npm dependencies 可能 hoisted 到受管理的 npm
  root 下，因此測試應證明 root 會被掃描/清理，而不是假設存在
  package-local `node_modules` tree。

新的 Docker fixtures 預設保持 hermetic。除非測試重點是 live registry
行為，否則使用本機 fixture registries 與 fake packages。

## 失敗分流

從 artifact identity 開始：

- Package Acceptance `resolve_package` summary：source、version、SHA-256 與
  artifact name。
- Docker artifacts：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、lane logs 與 rerun commands。
- Upgrade survivor summary：`.artifacts/upgrade-survivor/summary.json`，
  包含 baseline version、candidate version、scenario、phase timings 與
  recipe steps。

優先使用相同 package artifact 重新執行失敗的精確 lane，而不是
重新執行整個 release umbrella。
