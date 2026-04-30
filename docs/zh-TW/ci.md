---
read_when:
    - 你需要了解 CI 作業為何執行或未執行
    - 你正在偵錯一個失敗的 GitHub Actions 檢查
    - 您正在協調發布驗證的執行或重新執行
summary: CI 作業圖、範圍閘門、發行總括項與本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-04-30T18:38:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 上執行。`preflight` 工作會分類 diff，並在只有不相關區域變更時關閉昂貴的執行路徑。手動 `workflow_dispatch` 執行會刻意略過智慧範圍界定，並為候選版本與廣泛驗證展開完整圖。Android 執行路徑透過 `include_android` 維持選擇加入。僅限發行的 Plugin 涵蓋範圍位於獨立的 [`Plugin Prerelease`](#plugin-prerelease) workflow，且只會從 [`Full Release Validation`](#full-release-validation) 或明確的手動 dispatch 執行。

## 管線概覽

| 工作                             | 目的                                                                                         | 執行時機                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、變更範圍、變更的 Plugin，並建立 CI manifest                                 | 一律在非草稿 push 與 PR 上執行     |
| `security-scm-fast`              | 透過 `zizmor` 進行私鑰偵測與 workflow 稽核                                                   | 一律在非草稿 push 與 PR 上執行     |
| `security-dependency-audit`      | 針對 npm advisories 進行不需安裝相依套件的 production lockfile 稽核                           | 一律在非草稿 push 與 PR 上執行     |
| `security-fast`                  | 快速安全性工作的必要彙總                                                                     | 一律在非草稿 push 與 PR 上執行     |
| `check-dependencies`             | Production Knip 僅相依套件檢查，加上未使用檔案 allowlist 防護                                | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、建置成品檢查，以及可重用的下游 artifacts                           | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性執行路徑，例如 bundled/plugin-contract/protocol 檢查                         | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的 channel contract 檢查，並具備穩定的彙總檢查結果                                       | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，排除 channel、bundled、contract 與 Plugin 執行路徑                        | Node 相關變更                      |
| `check`                          | 分片的主要本機 gate 等價檢查：prod types、lint、guards、test types 與 strict smoke            | Node 相關變更                      |
| `check-additional`               | 架構、邊界、Plugin 介面防護、package-boundary 與 gateway-watch 分片                           | Node 相關變更                      |
| `build-smoke`                    | Built-CLI smoke tests 與 startup-memory smoke                                                 | Node 相關變更                      |
| `checks`                         | 建置成品 channel tests 的驗證器                                                              | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 執行路徑                                                          | 發行用手動 CI dispatch             |
| `check-docs`                     | 文件格式、lint 與 broken-link 檢查                                                           | 文件已變更                         |
| `skills-python`                  | Python-backed skills 的 Ruff + pytest                                                        | Python-skill 相關變更              |
| `checks-windows`                 | Windows 特定的 process/path 測試，加上共用 runtime import specifier 回歸檢查                 | Windows 相關變更                   |
| `macos-node`                     | 使用共用建置成品的 macOS TypeScript 測試執行路徑                                             | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、build 與 tests                                                       | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android unit tests，加上一個 debug APK build                                  | Android 相關變更                   |
| `test-performance-agent`         | 受信任活動後的每日 Codex slow-test 最佳化                                                    | Main CI 成功或手動 dispatch        |

## Fail-fast 順序

1. `preflight` 決定哪些執行路徑實際存在。`docs-scope` 與 `changed-scope` 邏輯是此工作內的步驟，不是獨立工作。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 與 `skills-python` 會快速失敗，不等待較重的 artifact 與平台矩陣工作。
3. `build-artifacts` 會與快速 Linux 執行路徑重疊，因此下游消費者可以在共用 build 準備好後立即開始。
4. 較重的平台與 runtime 執行路徑接著展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 與 `android`。

當較新的 push 落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的工作標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此仍會回報一般分片失敗，但不會在整個 workflow 已被取代後繼續排隊。自動 CI concurrency key 已版本化（`CI-v7-*`），因此 GitHub 端舊佇列群組中的 zombie 不會無限期封鎖較新的 main 執行。手動 full-suite 執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit tests 涵蓋。手動 dispatch 會略過 changed-scope detection，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI workflow 編輯**會驗證 Node CI 圖與 workflow linting，但本身不會強制 Windows、Android 或 macOS native builds；那些平台執行路徑仍限定於平台原始碼變更。
- **CI routing-only 編輯、選定的低成本 core-test fixture 編輯，以及狹窄的 plugin contract helper/test-routing 編輯**會使用快速 Node-only manifest 路徑：`preflight`、security 與單一 `checks-fast-core` task。當變更僅限於 fast task 直接執行的 routing 或 helper surfaces 時，該路徑會略過 build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards 與 additional guard matrices。
- **Windows Node checks**限定於 Windows 特定的 process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該執行路徑的 CI workflow surfaces；不相關的 source、Plugin、install-smoke 與 test-only 變更會留在 Linux Node 執行路徑。

最慢的 Node test families 會被拆分或平衡，讓每個工作維持小型且不過度保留 runners：channel contracts 以三個加權分片執行，小型 core unit 執行路徑會配對，auto-reply 以四個平衡 workers 執行（reply subtree 拆成 agent-runner、dispatch 與 commands/state-routing 分片），而 agentic gateway/plugin configs 會分散在既有的 source-only agentic Node jobs 中，而不是等待 built artifacts。廣泛的 browser、QA、media 與 miscellaneous plugin tests 使用各自專用的 Vitest configs，而不是共用 plugin catch-all。Include-pattern shards 會使用 CI shard name 記錄 timing entries，因此 `.artifacts/vitest-shard-timings.json` 可以區分完整 config 與 filtered shard。`check-additional` 會將 package-boundary compile/canary 工作放在一起，並將 runtime topology architecture 與 gateway watch coverage 分開；boundary guard shard 會在單一工作內並行執行其小型獨立 guards。Gateway watch、channel tests 與 core support-boundary shard 會在 `dist/` 與 `dist-runtime/` 已建置後，於 `build-artifacts` 內並行執行。

Android CI 會執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test 執行路徑仍會使用 SMS/call-log BuildConfig flags 編譯該 flavor，同時避免在每個 Android 相關 push 上重複 debug APK packaging job。

`check-dependencies` shard 會執行 `pnpm deadcode:dependencies`（production Knip 僅相依套件檢查，釘選到最新 Knip 版本，且為 `dlx` 安裝停用 pnpm 的 minimum release age）與 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file findings 與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的 unused file，或留下過期的 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的 intentional dynamic plugin、generated、build、live-test 與 package bridge surfaces。

## 手動 Dispatch

手動 CI dispatch 會執行與一般 CI 相同的 job graph，但強制開啟每個非 Android scoped lane：Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS 與 Control UI i18n。獨立手動 CI dispatch 只有在 `include_android=true` 時才會執行 Android；完整發行 umbrella 會透過傳入 `include_android=true` 啟用 Android。Plugin prerelease static checks、僅限發行的 `agentic-plugins` shard、完整 Plugin batch sweep，以及 plugin prerelease Docker lanes 都排除於 CI 之外。Docker prerelease suite 只會在 `Full Release Validation` 以啟用 release-validation gate 的方式 dispatch 獨立的 `Plugin Prerelease` workflow 時執行。

手動執行使用唯一的 concurrency group，因此 release-candidate full suite 不會被同一 ref 上的另一個 push 或 PR run 取消。選用的 `target_ref` input 讓受信任的 caller 可以針對 branch、tag 或完整 commit SHA 執行該圖，同時使用所選 dispatch ref 的 workflow file。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| 執行器                           | 作業                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性作業與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速協定/合約/ bundled 檢查、分片的頻道合約檢查、除 lint 以外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith 矩陣能更早排入佇列 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低權重的 Plugin 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、bundled Plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 夠敏感，8 vCPU 的成本高過省下的時間）；install-smoke Docker 建置（32 vCPU 的佇列時間成本高過省下的時間）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本機等效命令

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 完整發行驗證

`Full Release Validation` 是「發行前執行所有內容」的手動總括工作流程。它接受分支、標籤或完整 commit SHA，使用該目標派送手動 `CI` 工作流程，為僅發行用的 Plugin/套件/靜態/Docker 證明派送 `Plugin Prerelease`，並為安裝煙霧測試、套件接受度、Docker 發行路徑套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道派送 `OpenClaw Release Checks`。提供已發布套件規格時，它也可以執行發布後的 `NPM Telegram Beta E2E` 工作流程。

`release_profile` 控制傳入發行檢查的 live/供應商涵蓋範圍：

- `minimum` 保留最快的 OpenAI/核心發行關鍵通道。
- `stable` 加入穩定供應商/後端集合。
- `full` 執行廣泛的諮詢供應商/媒體矩陣。

總括流程會記錄已派送的子執行 ID，而最終的 `Verify full validation` 作業會重新檢查目前子執行結論，並為每個子執行附加最慢作業表。如果子工作流程重新執行後轉為綠燈，只需重新執行父驗證器作業，即可重新整理總括結果與時間摘要。

若要復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。發行候選版本使用 `all`，僅一般完整 CI 子項使用 `ci`，每個發行子項使用 `release-checks`，或在總括流程上使用較窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會讓失敗的發行盒在針對性修復後，重新執行範圍保持有界。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將所選 ref 解析一次為 `release-package-under-test` tarball，然後將該成品傳給 live/E2E 發行路徑 Docker 工作流程和套件接受度分片。這能讓套件位元組在各發行盒之間保持一致，並避免在多個子作業中重新打包同一個候選版本。

## Live 和 E2E 分片

發行 live/E2E 子項保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但它會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是單一序列作業：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 依供應商篩選的 `native-live-src-gateway-profiles` 作業
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒體音訊/視訊分片，以及依供應商篩選的音樂分片

這會保留相同的檔案涵蓋範圍，同時讓緩慢的 live 供應商失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live 媒體分片在 `Live Media Runner Image` 工作流程建置的 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行。該映像已預先安裝 `ffmpeg` 和 `ffprobe`；媒體作業只會在設定前驗證二進位檔。請將 Docker 支援的 live 套件放在一般 Blacksmith 執行器上，container 作業不是啟動巢狀 Docker 測試的合適位置。

Docker 支援的 live 模型/後端分片會對每個所選 commit 使用個別共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。live 發行工作流程會建置並推送該映像一次，接著 Docker live 模型、Gateway、CLI 後端、ACP bind 和 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。如果這些分片各自重新建置完整原始碼 Docker 目標，表示發行執行設定錯誤，會在重複映像建置上浪費牆鐘時間。

## 套件接受度

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證原始碼樹，而套件接受度會透過使用者在安裝或更新後實際執行的同一套 Docker E2E harness 來驗證單一 tarball。

### 作業

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備 package-digest Docker 映像，並針對該套件而不是打包工作流程 checkout 執行所選 Docker 通道。當 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件與共用映像一次，然後將這些通道展開為具有唯一成品的平行目標 Docker 作業。
3. `package_telegram` 會選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時它會執行，並在 Package Acceptance 已解析套件時安裝相同的 `package-under-test` 成品；獨立 Telegram 派送仍可安裝已發布的 npm 規格。
4. 如果套件解析、Docker 接受度或選用的 Telegram 通道失敗，`summary` 會使工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。請將此用於已發布 beta/穩定版的驗收。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整 commit SHA。解析器會擷取 OpenClaw 分支/標籤、驗證所選 commit 可從儲存庫分支歷史或發行標籤到達、在分離的 worktree 中安裝相依套件，並使用 `scripts/package-openclaw-for-docker.mjs` 封裝。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 是選用，但外部共享的 artifact 應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任 workflow/harness 程式碼。`package_ref` 是在 `source=ref` 時會被封裝的來源 commit。這讓目前的測試 harness 可以驗證較舊的受信任來源 commit，而不必執行舊的 workflow 邏輯。

### 套件組合設定檔

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發行路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` 設定檔使用離線 Plugin 覆蓋範圍，因此已發布套件驗證不會受限於即時 ClawHub 可用性。選用的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` artifact，並保留已發布 npm 規格路徑供獨立 dispatch 使用。

發行檢查會以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 呼叫 Package Acceptance。發行路徑 Docker 區塊涵蓋重疊的 package/update/Plugin lane；Package Acceptance 會針對同一個已解析套件 tarball 保留 artifact-native 的內建 channel 相容性、離線 Plugin 和 Telegram 證明。跨 OS 發行檢查仍涵蓋 OS 專屬的 onboarding、安裝程式和平台行為；package/update 產品驗證應從 Package Acceptance 開始。Windows 封裝與安裝程式全新 lane 也會驗證已安裝套件可從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 會在已設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4-mini`，因此安裝與 Gateway 證明會保持快速且具決定性。

### 舊版相容性期間

Package Acceptance 對已發布套件有有限的舊版相容性期間。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從 tarball 衍生的假 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，並可記錄缺失的持久化 `update.channel`；
- Plugin smoke 可以讀取舊版安裝記錄位置，或接受缺失的 marketplace 安裝記錄持久化；
- `plugin-update` 可以允許 config metadata 遷移，但仍要求安裝記錄和無重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可以對已出貨的本機 build metadata stamp 檔案發出警告。後續套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

### 範例

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

偵錯失敗的 package acceptance 執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker artifacts：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時，以及重新執行命令。請優先重新執行失敗的 package 設定檔或精確的 Docker lanes，而不是重新執行完整發行驗證。

## 安裝 smoke

獨立的 `Install Smoke` workflow 會透過自己的 `preflight` job 重用相同的範圍腳本。它會將 smoke 覆蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/package 表面、內建 Plugin 套件/manifest 變更，或 Docker smoke jobs 會執行的核心 Plugin/channel/Gateway/Plugin SDK 表面的 pull request 執行。僅來源的內建 Plugin 變更、僅測試編輯和僅文件編輯不會保留 Docker worker。快速路徑會建置 root Dockerfile image 一次、檢查 CLI、執行 agents delete shared-workspace CLI smoke、執行容器 gateway-network e2e、驗證內建 extension build arg，並在 240 秒彙總命令逾時內執行受限的內建 Plugin Docker 設定檔（每個情境的 Docker 執行另有上限）。
- **完整路徑**會保留 QR 套件安裝與安裝程式 Docker/update 覆蓋範圍，用於夜間排程執行、手動 dispatch、workflow-call 發行檢查，以及真正觸及安裝程式/package/Docker 表面的 pull request。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR root Dockerfile smoke image，然後將 QR 套件安裝、root Dockerfile/Gateway smoke、安裝程式/update smoke，以及快速內建 Plugin Docker E2E 作為獨立 job 執行，讓安裝程式工作不必等待 root image smoke。

`main` push（包括 merge commit）不會強制完整路徑；當變更範圍邏輯會在 push 上要求完整覆蓋範圍時，workflow 會保留快速 Docker smoke，並將完整 install smoke 留給夜間或發行驗證。

慢速的 Bun 全域安裝 image-provider smoke 由 `run_bun_global_install_smoke` 另行控管。它會在夜間排程和發行檢查 workflow 中執行，手動 `Install Smoke` dispatch 可以選擇加入，但 pull request 和 `main` push 不會。QR 和安裝程式 Docker 測試保留各自專注於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共享 live-test image、將 OpenClaw 封裝一次為 npm tarball，並建置兩個共享 `scripts/e2e/Dockerfile` images：

- 用於安裝程式/update/Plugin 相依性 lane 的裸 Node/Git runner；
- 將相同 tarball 安裝到 `/app` 的功能 image，用於一般功能 lane。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的 plan。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇 image，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lanes。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的 main-pool slot 數量。                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider-sensitive tail-pool slot 數量。                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider 進行節流。                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm install lane 上限。                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的 stagger，用來避免 Docker daemon create 風暴；設為 `0` 表示不 stagger。         |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback 逾時（120 分鐘）；選取的 live/tail lane 會使用更嚴格的上限。            |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器 plan 而不執行 lanes。                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗號分隔的精確 lane 清單；會略過 cleanup smoke，讓 agents 可以重現一個失敗的 lane。           |

比有效上限更重的 lane 仍可從空 pool 啟動，然後單獨執行直到釋放容量。本機彙總會 preflight Docker、移除過期的 OpenClaw E2E 容器、發出 active-lane 狀態、保存 lane 計時以便 longest-first 排序，並預設在第一次失敗後停止排程新的 pooled lane。

### 可重用的 live/E2E workflow

可重用的 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個 package、image kind、live image、lane 和 credential 覆蓋範圍。`scripts/docker-e2e.mjs` 接著會將該 plan 轉換為 GitHub outputs 和摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 封裝 OpenClaw、下載目前執行的 package artifact，或從 `package_artifact_run_id` 下載 package artifact；驗證 tarball inventory；當 plan 需要已安裝 package 的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以 package digest 標記的 bare/functional GHCR Docker E2E images；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` inputs 或現有的 package-digest images，而不是重新建置。Docker image pull 會以每次嘗試 180 秒的受限逾時重新嘗試，讓卡住的 registry/cache stream 能快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發行路徑區塊

發行 Docker 覆蓋範圍會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊 jobs，因此每個區塊只會 pull 它需要的 image kind，並透過相同的加權排程器執行多個 lanes：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

目前發行版本的 Docker 分塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`，以及 `bundled-channels-contracts`。彙總的 `bundled-channels` 分塊仍可用於手動一次性重新執行，而 `plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍保留為彙總的 Plugin/runtime 別名。`install-e2e` 通道別名仍是兩個供應商安裝程式通道的彙總手動重新執行別名。`bundled-channels` 分塊會執行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是序列式全包的 `bundled-channel-deps` 通道。

當完整發行路徑涵蓋範圍要求時，OpenWebUI 會併入 `plugins-runtime-services`，並且只在僅限 OpenWebUI 的派送中保留獨立的 `openwebui` 分塊。內建通道更新通道會針對暫時性 npm 網路失敗重試一次。

每個分塊都會上傳 `.artifacts/docker-tests/`，其中包含通道記錄、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢速通道表格，以及每個通道的重新執行命令。工作流程的 `docker_lanes` 輸入會針對已準備的映像執行所選通道，而不是分塊作業，這會將失敗通道的偵錯限制在一個目標 Docker 作業內，並為該次執行準備、下載或重用套件成品；如果所選通道是即時 Docker 通道，目標作業會在本機建置即時測試映像以供該次重新執行使用。產生的每個通道 GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備映像輸入，因此失敗的通道可以重用失敗執行中的確切套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的即時/E2E 工作流程會每日執行完整的發行路徑 Docker 套件。

## Plugin 預發行

`Plugin Prerelease` 是成本較高的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確的操作員派送的獨立工作流程。一般 pull request、`main` 推送，以及獨立的手動 CI 派送會保持該套件關閉。它會在八個擴充工作器之間平衡內建 Plugin 測試；這些擴充分片作業每次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest 工作器和較大的 Node heap，讓匯入量大的 Plugin 批次不會建立額外的 CI 作業。

## QA Lab

QA Lab 在主要的智慧範圍工作流程之外有專用的 CI 通道。

- `Parity gate` 工作流程會在相符的 PR 變更和手動派送時執行；它會建置私有 QA runtime，並比較模擬 GPT-5.5 和 Opus 4.6 agentic 套件。
- `QA-Lab - All Lanes` 工作流程會在 `main` 上每晚執行，並在手動派送時執行；它會將模擬同位閘門、即時 Matrix 通道，以及即時 Telegram 和 Discord 通道扇出為平行作業。即時作業使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex 租約。

發行檢查會使用確定性的模擬供應商和符合模擬資格的模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram 即時傳輸通道，因此通道合約會與即時模型延遲和一般供應商 Plugin 啟動隔離。即時傳輸 Gateway 會停用記憶搜尋，因為 QA 同位會另外涵蓋記憶行為；供應商連線能力由獨立的即時模型、原生供應商和 Docker 供應商套件涵蓋。

Matrix 會在排程和發行閘門使用 `--profile fast`，並且只在簽出的 CLI 支援時加入 `--fail-fast`。CLI 預設值和手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 派送一律會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab 通道；它的 QA 同位閘門會將候選與基準套件作為平行通道作業執行，接著將兩個成品下載到一個小型報告作業中進行最終同位比較。

除非變更實際觸及 QA runtime、模型套件同位，或同位工作流程擁有的表面，否則不要將 PR 合併路徑置於 `Parity gate` 之後。對於一般通道、設定、文件或單元測試修正，請將其視為選用訊號，並遵循範圍化 CI/檢查證據。

## CodeQL

`CodeQL` 工作流程刻意作為狹窄的第一輪安全掃描器，而不是完整儲存庫掃描。每日、手動和非草稿 pull request 守門執行會掃描 Actions 工作流程程式碼，以及最高風險的 JavaScript/TypeScript 表面，並使用高信心安全查詢，篩選為高/嚴重 `security-severity`。

pull request 守門保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下的變更啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 和 macOS CodeQL 不包含在 PR 預設值中。

### 安全類別

| 類別                                              | 表面                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、秘密、sandbox、cron 和 Gateway 基準                                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，以及通道 Plugin runtime、Gateway、Plugin SDK、秘密、稽核接觸點                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、web-fetch，以及 Plugin SDK SSRF policy 表面                                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行協助工具、輸出交付，以及 agent 工具執行閘門                                                                        |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、載入器、manifest、registry、runtime-dependency staging、source-loading，以及 Plugin SDK 套件合約信任表面                  |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。為 CodeQL 在工作流程健全性接受的最小 Blacksmith Linux runner 上手動建置 Android 應用程式。上傳到 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式，從上傳的 SARIF 中篩除依賴項建置結果，並上傳到 `/codeql-critical-security/macos` 底下。因為即使乾淨時 macOS 建置也主導 runtime，所以保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在較小的 Blacksmith Linux runner 上，針對狹窄的高價值表面執行錯誤嚴重性、非安全的 JavaScript/TypeScript 品質查詢。其 pull request 守門刻意小於排程設定檔：非草稿 PR 只會針對 agent 命令/模型/工具執行與回覆派送程式碼、設定 schema/migration/IO 程式碼、auth/secrets/sandbox/security 程式碼、核心通道和內建通道 Plugin runtime、Gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、Plugin loader、Plugin SDK/package-contract，或 Plugin SDK reply runtime 變更，執行相符的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 設定和品質工作流程變更會執行全部十二個 PR 品質分片。

手動派送接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用於單獨執行一個品質分片的教學/迭代掛鉤。

| 類別                                                    | 介面                                                                                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Auth、祕密、沙箱、Cron 與 Gateway 安全邊界程式碼                                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化與 IO 合約                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 協定結構描述與伺服器方法合約                                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與隨附通道 Plugin 實作合約                                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及對外傳遞合約                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段外觀、記憶體 Plugin SDK 別名、記憶體執行階段啟用黏合層，以及記憶體 doctor 命令                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞輔助工具、診斷事件/記錄組合包介面，以及工作階段 doctor CLI 合約                                             |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆分派、回覆承載/分塊/執行階段輔助工具、通道回覆選項、傳遞佇列，以及工作階段/執行緒繫結輔助工具                                                 |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型型錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值/型錄，以及網頁/搜尋/擷取/嵌入註冊表                                                           |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動程序、本機持久化、Gateway 控制流程，以及任務控制平面執行階段合約                                                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取/搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、註冊表、公開介面，以及 Plugin SDK 進入點合約                                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 原始碼與 Plugin 套件合約輔助工具                                                                                                          |

品質會與安全性分開，因此品質發現可以排程、衡量、停用或擴充，而不會掩蓋安全性訊號。Swift、Python 與隨附 Plugin 的 CodeQL 擴充，應只在窄範圍設定檔具備穩定執行階段與訊號之後，作為具範圍或分片的後續工作加回。

## 維護工作流程

### 文件 Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於讓現有文件與最近落地的變更保持一致。它沒有純排程：在 `main` 上成功的非機器人推送 CI 執行可以觸發它，手動派送也可以直接執行它。當 `main` 已前進，或上一小時內已建立另一個未略過的 Docs Agent 執行時，工作流程執行叫用會略過。執行時，它會審查從前一個未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此一次每小時執行可以涵蓋自上次文件巡檢以來累積的所有 main 變更。

### 測試效能 Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於處理緩慢測試。它沒有純排程：在 `main` 上成功的非機器人推送 CI 執行可以觸發它，但如果另一個工作流程執行叫用在該 UTC 日已經執行或正在執行，它就會略過。手動派送會略過該每日活動閘門。此通道會建立完整套件分組 Vitest 效能報告，讓 Codex 只進行小型且保留覆蓋率的測試效能修正，而不是大範圍重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯的失敗，而且 Agent 後的完整套件報告必須通過，才會提交任何內容。當 `main` 在機器人推送落地前前進時，此通道會將已驗證的修補重新基底化、重新執行 `pnpm check:changed`，並重試推送；有衝突的過期修補會被略過。它使用 GitHub 託管的 Ubuntu，因此 Codex 動作可以維持與文件 Agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是用於落地後重複項清理的手動維護者工作流程。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會驗證已落地的 PR 已合併，並且每個重複項都有共用的參照 issue，或有重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機變更通道邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界比廣泛 CI 平台範圍更嚴格：

- 核心生產變更會執行核心生產與核心測試型別檢查，加上核心 lint/guard；
- 僅核心測試變更只會執行核心測試型別檢查，加上核心 lint；
- 擴充功能生產變更會執行擴充功能生產與擴充功能測試型別檢查，加上擴充功能 lint；
- 僅擴充功能測試變更會執行擴充功能測試型別檢查，加上擴充功能 lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴大到擴充功能型別檢查，因為擴充功能依賴這些核心合約（Vitest 擴充功能掃描仍是明確的測試工作）；
- 僅發布中繼資料的版本升級會執行目標式版本/設定/根相依性檢查；
- 未知根目錄/設定變更會以安全失敗方式進入所有檢查通道。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，原始碼編輯優先使用明確對應，接著是同層測試與匯入圖相依項。共用群組房間傳遞設定是其中一個明確對應：群組可見回覆設定、來源回覆傳遞模式，或訊息工具系統提示的變更，會透過核心回覆測試加上 Discord 與 Slack 傳遞回歸測試路由，因此共用預設值變更會在第一次 PR 推送前失敗。只有在變更的範圍涵蓋整個測試框架，使得便宜的對應集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從 repo 根目錄執行 Testbox，並優先使用全新預熱的 box 進行廣泛證明。在把緩慢閘門花在已重用、過期，或剛回報異常大量同步的 box 之前，先在 box 內執行 `pnpm testbox:sanity`。

當必要根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤刪除時，健全性檢查會快速失敗。這通常代表遠端同步狀態不是 PR 的可信副本；請停止該 box 並預熱新的，而不是偵錯產品測試失敗。對於刻意的大量刪除 PR，請為該健全性執行設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止本機 Blacksmith CLI 叫用，如果它停留在同步階段超過五分鐘且沒有同步後輸出。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該 guard，或針對異常大的本機 diff 使用更大的毫秒值。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
