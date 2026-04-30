---
read_when:
    - 你需要了解 CI 作業為何執行或未執行
    - 您正在偵錯一項失敗的 GitHub Actions 檢查
    - 你正在協調發布驗證的執行或重新執行
summary: CI 作業圖、範圍閘門、發布總括項與本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-04-30T09:35:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 上執行。`preflight` 作業會分類差異，並在只有不相關區域變更時關閉昂貴的執行路徑。手動 `workflow_dispatch` 執行會刻意略過智慧範圍界定，並展開完整圖形，以供發行候選版本和廣泛驗證使用。Android 路徑透過 `include_android` 維持選用。僅限發行的 Plugin 覆蓋範圍位於獨立的 [`Plugin 預發行`](#plugin-prerelease) 工作流程中，且只會從 [`完整發行驗證`](#full-release-validation) 或明確的手動派發執行。

## 管線概觀

| 作業                             | 用途                                                                                         | 執行時機                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、已變更範圍、已變更擴充功能，並建置 CI manifest                               | 一律在非草稿推送和 PR 上執行       |
| `security-scm-fast`              | 透過 `zizmor` 偵測私密金鑰並稽核工作流程                                                     | 一律在非草稿推送和 PR 上執行       |
| `security-dependency-audit`      | 針對 npm advisories 進行不需相依性的正式環境 lockfile 稽核                                   | 一律在非草稿推送和 PR 上執行       |
| `security-fast`                  | 快速安全性作業的必要彙總                                                                     | 一律在非草稿推送和 PR 上執行       |
| `check-dependencies`             | 僅針對正式環境 Knip 相依性的檢查，加上未使用檔案 allowlist 防護                               | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置 artifact 檢查，以及可重複使用的下游 artifact                | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性路徑，例如 bundled/plugin-contract/protocol 檢查                            | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的 channel contract 檢查，並提供穩定的彙總檢查結果                                       | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，不含 channel、bundled、contract 和 extension 路徑                         | Node 相關變更                      |
| `check`                          | 分片的主要本機 gate 對等項：正式環境型別、lint、防護、測試型別與嚴格 smoke                   | Node 相關變更                      |
| `check-additional`               | 架構、邊界、extension-surface 防護、package-boundary 與 gateway-watch 分片                    | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI 的 smoke 測試與啟動記憶體 smoke                                                    | Node 相關變更                      |
| `checks`                         | 已建置 artifact channel 測試的驗證器                                                         | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 路徑                                                               | 發行用手動 CI 派發                 |
| `check-docs`                     | 文件格式化、lint 與斷裂連結檢查                                                              | 文件已變更                         |
| `skills-python`                  | Python 支援 skills 的 Ruff + pytest                                                          | Python skill 相關變更              |
| `checks-windows`                 | Windows 專用 process/path 測試，加上共用 runtime import specifier 回歸                       | Windows 相關變更                   |
| `macos-node`                     | 使用共用已建置 artifact 的 macOS TypeScript 測試路徑                                         | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、建置與測試                                                           | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                     | Android 相關變更                   |
| `test-performance-agent`         | 受信任活動後的每日 Codex 慢速測試最佳化                                                      | Main CI 成功或手動派發             |

## Fail-fast 順序

1. `preflight` 會決定哪些路徑實際存在。`docs-scope` 和 `changed-scope` 邏輯是此作業內的步驟，不是獨立作業。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 會快速失敗，不需等待較重的 artifact 與平台矩陣作業。
3. `build-artifacts` 會與快速 Linux 路徑重疊，讓下游消費者能在共用建置完成後立即開始。
4. 較重的平台與 runtime 路徑之後會展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

當同一個 PR 或 `main` ref 上有較新的推送進來時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則請將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此它們仍會回報正常的分片失敗，但不會在整個工作流程已被取代後繼續排隊。自動 CI concurrency key 已版本化（`CI-v7-*`），因此 GitHub 端舊佇列群組中的僵屍項目無法無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動派發會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個有範圍的區域都已變更。

- **CI 工作流程編輯** 會驗證 Node CI 圖形加上工作流程 linting，但本身不會強制執行 Windows、Android 或 macOS 原生建置；這些平台路徑仍只限於平台原始碼變更。
- **僅 CI 路由編輯、選定的便宜 core-test fixture 編輯，以及狹窄的 Plugin contract helper/test-routing 編輯** 會使用快速的 Node-only manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` 工作。當變更僅限於快速工作直接涵蓋的路由或 helper 表面時，該路徑會略過 build artifacts、Node 22 相容性、channel contracts、完整 core 分片、bundled-plugin 分片，以及額外的 guard 矩陣。
- **Windows Node 檢查** 會限定於 Windows 專用 process/path wrapper、npm/pnpm/UI runner helper、package manager config，以及執行該路徑的 CI 工作流程表面；不相關的原始碼、Plugin、install-smoke 和僅測試變更會留在 Linux Node 路徑上。

最慢的 Node 測試家族會被拆分或平衡，讓每個作業維持小型而不過度保留 runner：channel contracts 以三個加權分片執行，小型 core unit 路徑會配對，auto-reply 以四個平衡 worker 執行（reply 子樹拆成 agent-runner、dispatch 與 commands/state-routing 分片），而 agentic gateway/plugin config 會分散到既有的 source-only agentic Node 作業中，不需等待已建置 artifact。廣泛的瀏覽器、QA、媒體與雜項 Plugin 測試會使用各自專用的 Vitest config，而不是共用的 Plugin catch-all。Include-pattern 分片會使用 CI 分片名稱記錄計時項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 與已過濾分片。`check-additional` 會將 package-boundary compile/canary 工作放在一起，並將 runtime topology architecture 與 gateway watch 覆蓋範圍分開；boundary guard 分片會在單一作業內並行執行其小型獨立防護。Gateway watch、channel 測試與 core support-boundary 分片會在 `dist/` 和 `dist-runtime/` 已建置後，於 `build-artifacts` 內並行執行。

Android CI 會同時執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，接著建置 Play debug APK。third-party flavor 沒有獨立 source set 或 manifest；其單元測試路徑仍會使用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送上重複執行 debug APK packaging 作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（一個針對正式環境的 Knip dependency-only pass，固定使用最新 Knip 版本，且針對 `dlx` 安裝停用 pnpm 的最低發行年齡限制）以及 `pnpm deadcode:unused-files`，後者會將 Knip 的正式環境未使用檔案發現與 `scripts/deadcode-unused-files.allowlist.mjs` 比較。當 PR 新增未經審查的未使用檔案，或留下過時的 allowlist 項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的刻意動態 Plugin、generated、build、live-test 與 package bridge 表面。

## 手動派發

手動 CI 派發會執行與一般 CI 相同的作業圖形，但會強制開啟每個非 Android 範圍路徑：Linux Node 分片、bundled-plugin 分片、channel contracts、Node 22 相容性、`check`、`check-additional`、build smoke、文件檢查、Python skills、Windows、macOS 與 Control UI i18n。獨立的手動 CI 派發只有在 `include_android=true` 時才會執行 Android；完整發行 umbrella 會透過傳遞 `include_android=true` 啟用 Android。Plugin 預發行靜態檢查、僅限發行的 `agentic-plugins` 分片、完整 extension 批次掃描，以及 Plugin 預發行 Docker 路徑皆排除於 CI 之外。Docker 預發行套件只會在 `Full Release Validation` 以啟用 release-validation gate 的方式派發獨立 `Plugin Prerelease` 工作流程時執行。

手動執行會使用唯一的 concurrency group，因此發行候選版本的完整套件不會被同一 ref 上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫端針對 branch、tag 或完整 commit SHA 執行該圖形，同時使用所選派發 ref 的工作流程檔案。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| 執行器                           | 作業                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性作業與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速協定/合約/內建檢查、分片的頻道合約檢查、除 lint 外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith 矩陣可以更早排入佇列 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低負載的 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、內建 Plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 夠敏感，8 vCPU 的成本高於節省的時間）；install-smoke Docker 建置（32-vCPU 佇列時間的成本高於節省的時間）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本機對應項目

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

`Full Release Validation` 是「在發行前執行所有項目」的手動總括工作流程。它接受分支、標籤或完整 commit SHA，使用該目標派送手動 `CI` 工作流程、派送 `Plugin Prerelease` 以進行僅限發行的 Plugin/套件/靜態/Docker 證明，並派送 `OpenClaw Release Checks` 以進行安裝 smoke、套件驗收、Docker 發行路徑套件、即時/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。提供已發布套件規格時，它也可以執行發布後的 `NPM Telegram Beta E2E` 工作流程。

`release_profile` 控制傳入發行檢查的即時/供應商廣度：

- `minimum` 保留最快的 OpenAI/核心發行關鍵通道。
- `stable` 加入穩定的供應商/後端集合。
- `full` 執行廣泛的建議供應商/媒體矩陣。

總括工作流程會記錄已派送的子執行 ID，而最終的 `Verify full validation` 作業會重新檢查目前子執行結論，並為每個子執行附加最慢作業表。如果子工作流程重新執行後變為綠燈，只需重新執行父驗證器作業，即可重新整理總括結果與時間摘要。

為了復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。對發行候選版本使用 `all`，只對一般完整 CI 子項使用 `ci`，對每個發行子項使用 `release-checks`，或在總括工作流程上使用較窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會讓失敗的發行盒在焦點修復後，重新執行範圍維持受限。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將所選 ref 解析一次成 `release-package-under-test` tarball，然後將該 artifact 傳給即時/E2E 發行路徑 Docker 工作流程與套件驗收分片。這會讓套件位元組在各個發行盒之間保持一致，並避免在多個子作業中重新打包同一個候選版本。

## 即時與 E2E 分片

發行即時/E2E 子項保留廣泛的原生 `pnpm test:live` 覆蓋範圍，但它會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是單一序列作業：

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
- 分割的媒體音訊/影片分片，以及依供應商篩選的音樂分片

這會維持相同的檔案覆蓋範圍，同時讓緩慢的即時供應商失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生即時媒體分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；媒體作業只會在設定前驗證二進位檔。請將 Docker 支援的即時套件保留在一般 Blacksmith 執行器上，因為容器作業不適合啟動巢狀 Docker 測試。

Docker 支援的即時模型/後端分片會針對每個選取的 commit 使用個別共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發行工作流程會建置並推送該映像一次，然後 Docker 即時模型、Gateway、CLI 後端、ACP bind 和 Codex harness 分片會使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。如果這些分片各自重新建置完整來源 Docker 目標，表示發行執行設定錯誤，並會在重複映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能像產品一樣運作？」時，請使用 `Package Acceptance`。它與一般 CI 不同：一般 CI 會驗證來源樹，而套件驗收會透過使用者在安裝或更新後執行的相同 Docker E2E harness，驗證單一 tarball。

### 作業

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選版本、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` artifact 上傳，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 和設定檔。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該 artifact、驗證 tarball 清單、在需要時準備 package-digest Docker 映像，並針對該套件執行所選的 Docker 通道，而不是打包工作流程 checkout。當設定檔選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件與共享映像一次，然後將這些通道展開為平行的目標 Docker 作業，且各自使用唯一 artifact。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行；若 Package Acceptance 已解析套件，則安裝相同的 `package-under-test` artifact；獨立 Telegram 派送仍可安裝已發布的 npm 規格。
4. 如果套件解析、Docker 驗收或可選的 Telegram 通道失敗，`summary` 會讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。這用於已發布 beta/穩定版的接受測試。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整 commit SHA。解析器會擷取 OpenClaw 分支/標籤，驗證所選 commit 可從儲存庫分支歷史或發行標籤抵達，在分離的 worktree 中安裝相依項目，並使用 `scripts/package-openclaw-for-docker.mjs` 封裝。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 與 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選用，但外部分享的 artifact 應提供此值。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任 workflow/harness 程式碼。`package_ref` 是在 `source=ref` 時會被封裝的來源 commit。這讓目前的測試 harness 可以驗證較舊的受信任來源 commit，而不必執行舊的 workflow 邏輯。

### 套件組合設定檔

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發行路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` 設定檔使用離線 Plugin 覆蓋範圍，因此已發布套件驗證不會受即時 ClawHub 可用性阻擋。選用的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` artifact，並保留已發布 npm 規格路徑供獨立派送使用。

發行檢查會以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 與 `telegram_mode=mock-openai` 呼叫 Package Acceptance。發行路徑 Docker 區塊涵蓋重疊的 package/update/plugin lane；Package Acceptance 則針對相同解析出的套件 tarball，保留 artifact 原生的 bundled-channel 相容性、離線 Plugin 與 Telegram 證明。跨 OS 發行檢查仍涵蓋 OS 特定的 onboarding、installer 與平台行為；package/update 產品驗證應從 Package Acceptance 開始。Windows 封裝與 installer fresh lane 也會驗證已安裝套件可以從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 在已設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4-mini`，因此安裝與 Gateway 證明可保持快速且確定性。

### 舊版相容性期間

Package Acceptance 對已發布套件設有有限的舊版相容性期間。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向 tarball 省略的檔案；
- 當套件未公開該 flag 時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從 tarball 衍生的假 git fixture 中修剪缺少的 `pnpm.patchedDependencies`，並可記錄缺少持久化的 `update.channel`；
- Plugin smoke 可以讀取舊版 install-record 位置，或接受缺少 marketplace install-record 持久化；
- `plugin-update` 可以允許設定中繼資料遷移，同時仍要求 install record 與 no-reinstall 行為保持不變。

已發布的 `2026.4.26` 套件也可以針對已出貨的本機建置中繼資料戳記檔提出警告。後續套件必須符合現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的 package acceptance 執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行與其 Docker artifact：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段耗時與重新執行命令。請優先重新執行失敗的套件設定檔或精確 Docker lane，而不是重新執行完整發行驗證。

## 安裝 smoke

獨立的 `Install Smoke` workflow 會透過自己的 `preflight` job 重用相同的範圍腳本。它將 smoke 覆蓋範圍拆分為 `run_fast_install_smoke` 與 `run_full_install_smoke`。

- **快速路徑** 會在 pull request 觸及 Docker/package 表面、bundled Plugin package/manifest 變更，或 Docker smoke job 會演練的核心 Plugin/channel/gateway/Plugin SDK 表面時執行。僅來源的 bundled Plugin 變更、僅測試編輯與僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI smoke、執行 container gateway-network e2e、驗證 bundled extension build arg，並在 240 秒彙總命令逾時內執行有界限的 bundled-plugin Docker 設定檔（每個情境的 Docker 執行會分別設上限）。
- **完整路徑** 保留 QR package install 與 installer Docker/update 覆蓋範圍，用於夜間排程執行、手動派送、workflow-call 發行檢查，以及真正觸及 installer/package/Docker 表面的 pull request。在完整模式中，install-smoke 會準備或重用一個 target-SHA GHCR 根 Dockerfile smoke 映像，然後將 QR package install、根 Dockerfile/gateway smoke、installer/update smoke，以及快速 bundled-plugin Docker E2E 作為獨立 job 執行，因此 installer 工作不必等在根映像 smoke 後面。

`main` 推送（包含 merge commit）不會強制使用完整路徑；當變更範圍邏輯在 push 上要求完整覆蓋時，workflow 會保留快速 Docker smoke，並將完整 install smoke 留給夜間或發行驗證。

較慢的 Bun 全域安裝 image-provider smoke 由 `run_bun_global_install_smoke` 另行控管。它會在夜間排程與發行檢查 workflow 中執行，手動 `Install Smoke` 派送也可以選擇加入，但 pull request 與 `main` 推送不會執行。QR 與 installer Docker 測試保留各自聚焦於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像，將 OpenClaw 封裝一次為 npm tarball，並建置兩個共用 `scripts/e2e/Dockerfile` 映像：

- 用於 installer/update/plugin-dependency lane 的裸 Node/Git runner；
- 將相同 tarball 安裝到 `/app` 的功能性映像，用於一般功能 lane。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選定的計畫。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調整項目

| 變數                                   | 預設值  | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主 pool slot 數量。                                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對 provider 敏感的 tail-pool slot 數量。                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 同時執行的 live lane 上限，避免 provider 節流。                                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 同時執行的 npm install lane 上限。                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時執行的多服務 lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，用於避免 Docker daemon 建立風暴；設為 `0` 表示不錯開。               |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的備援逾時（120 分鐘）；選定的 live/tail lane 使用更嚴格的上限。                    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫而不執行 lane。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；略過清理 smoke，讓 agent 可以重現單一失敗 lane。                  |

比有效上限更重的 lane 仍可從空 pool 啟動，然後單獨執行直到釋放容量。本機彙總流程會預檢 Docker、移除過時的 OpenClaw E2E 容器、輸出作用中 lane 狀態、保存 lane 耗時供 longest-first 排序使用，且預設在第一次失敗後停止排程新的 pooled lane。

### 可重用 live/E2E workflow

可重用 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些套件、映像種類、live 映像、lane 與憑證覆蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 封裝 OpenClaw、下載目前執行的套件 artifact，或從 `package_artifact_run_id` 下載套件 artifact；驗證 tarball 清單；在計畫需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的裸/功能性 GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或既有套件 digest 映像，而非重新建置。Docker 映像 pull 會以有界限的每次嘗試 180 秒逾時重試，因此卡住的 registry/cache stream 會快速重試，而不是耗盡大部分 CI 關鍵路徑。

### 發行路徑區塊

發行 Docker 覆蓋範圍會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊 job，因此每個區塊只會 pull 它需要的映像種類，並透過相同加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

目前發行版 Docker 區塊是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`，以及 `bundled-channels-contracts`。彙總的 `bundled-channels` 區塊仍可用於手動一次性重新執行，而 `plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總 Plugin/runtime 別名。`install-e2e` 通道別名仍是兩個供應商安裝器通道的彙總手動重新執行別名。`bundled-channels` 區塊會執行拆分後的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是序列式全合一的 `bundled-channel-deps` 通道。

當完整發行路徑涵蓋範圍要求時，OpenWebUI 會併入 `plugins-runtime-services`，且只有在僅限 OpenWebUI 的分派中才保留獨立的 `openwebui` 區塊。Bundled-channel 更新通道會對暫時性 npm 網路失敗重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含通道記錄、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢速通道表格，以及每個通道的重新執行命令。工作流程 `docker_lanes` 輸入會針對已準備好的映像執行選取的通道，而不是區塊作業，這會將失敗通道的偵錯限制在單一目標 Docker 作業中，並為該次執行準備、下載或重用套件成品；如果選取的通道是即時 Docker 通道，目標作業會為該次重新執行在本機建置即時測試映像。產生的每通道 GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備映像輸入，因此失敗通道可以重用失敗執行中的確切套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的即時/E2E 工作流程會每日執行完整發行路徑 Docker 套件。

## Plugin 預發行

`Plugin Prerelease` 是成本較高的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確操作員分派的獨立工作流程。一般 pull request、`main` 推送，以及獨立的手動 CI 分派都不會啟用該套件。它會在八個 extension worker 之間平衡 bundled Plugin 測試；這些 extension shard 作業一次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest worker，並使用較大的 Node heap，因此匯入量大的 Plugin 批次不會建立額外的 CI 作業。

## QA Lab

QA Lab 在主要智慧範圍工作流程之外有專用 CI 通道。

- `Parity gate` 工作流程會在符合的 PR 變更和手動分派時執行；它會建置私有 QA runtime，並比較 mock GPT-5.5 與 Opus 4.6 agentic packs。
- `QA-Lab - All Lanes` 工作流程會每晚在 `main` 上和手動分派時執行；它會將 mock parity gate、即時 Matrix 通道，以及即時 Telegram 和 Discord 通道展開為平行作業。即時作業使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex leases。

發行檢查會使用確定性的 mock 供應商和 mock 限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram 即時傳輸通道，因此通道合約會與即時模型延遲和一般供應商 Plugin 啟動隔離。即時傳輸 Gateway 會停用記憶體搜尋，因為 QA parity 會另外涵蓋記憶體行為；供應商連線能力則由獨立的即時模型、原生供應商和 Docker 供應商套件涵蓋。

Matrix 對排程和發行 gate 使用 `--profile fast`，只有在簽出的 CLI 支援時才加入 `--fail-fast`。CLI 預設值與手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 分派一律會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab 通道；其 QA parity gate 會將候選與基準 packs 作為平行通道作業執行，然後將兩個成品下載到小型報告作業中，進行最終 parity 比較。

除非變更實際觸及 QA runtime、model-pack parity，或 parity 工作流程擁有的表面，否則不要把 PR landing path 放在 `Parity gate` 後方。對於一般通道、設定、文件或單元測試修正，請將它視為選用訊號，並遵循範圍化的 CI/檢查證據。

## CodeQL

`CodeQL` 工作流程有意作為窄範圍的第一道安全掃描器，而不是完整儲存庫掃描。每日、手動和非草稿 pull request guard 執行會掃描 Actions 工作流程程式碼，加上最高風險的 JavaScript/TypeScript 表面，並使用高信心安全查詢篩選到高/重大 `security-severity`。

pull request guard 保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下的變更啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 和 macOS CodeQL 不屬於 PR 預設值。

### 安全性類別

| 類別                                              | 表面                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、密鑰、沙箱、Cron 和 Gateway 基準                                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，加上通道 Plugin runtime、Gateway、Plugin SDK、密鑰、稽核接觸點                                                       |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路 guard、web-fetch，以及 Plugin SDK SSRF 政策表面                                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行 helper、對外傳遞，以及 agent tool-execution gates                                                                 |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、loader、manifest、registry、runtime-dependency staging、source-loading，以及 Plugin SDK 套件合約信任表面                  |

### 平台特定安全性分片

- `CodeQL Android Critical Security` — 排程的 Android 安全性分片。為 CodeQL 在 workflow sanity 接受的最小 Blacksmith Linux runner 上手動建置 Android app。上傳到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全性分片。為 CodeQL 在 Blacksmith macOS 上手動建置 macOS app，從上傳的 SARIF 中篩除相依性建置結果，並上傳到 `/codeql-critical-security/macos`。因為即使乾淨時 macOS 建置也主導 runtime，所以保留在每日預設值之外。

### Critical Quality 類別

`CodeQL Critical Quality` 是對應的非安全性分片。它只會在較小的 Blacksmith Linux runner 上，對窄範圍高價值表面執行錯誤嚴重度、非安全性 JavaScript/TypeScript 品質查詢。它的 pull request guard 有意比排程設定檔更小：非草稿 PR 只會針對 agent 命令/模型/工具執行與回覆分派程式碼、設定 schema/migration/IO 程式碼、驗證/密鑰/沙箱/安全性程式碼、核心通道與 bundled 通道 Plugin runtime、Gateway 協定/server-method、記憶體 runtime/SDK glue、MCP/process/outbound delivery、供應商 runtime/model catalog、session diagnostics/delivery queues、Plugin loader、Plugin SDK/package-contract，或 Plugin SDK reply runtime 變更，執行相符的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動分派接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

窄範圍設定檔是用於隔離執行單一品質分片的教學/迭代 hook。

| 類別                                                    | 涵蓋範圍                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth、secrets、sandbox、Cron，以及 Gateway 安全邊界程式碼                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化，以及 IO 合約                                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 協定結構描述與伺服器方法合約                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心 channel 與內建 channel Plugin 實作合約                                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及對外傳遞合約                                                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體 Plugin SDK 別名、記憶體執行階段啟用銜接，以及記憶體 doctor 命令                                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞輔助工具、診斷事件/日誌組合表面，以及工作階段 doctor CLI 合約                                            |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆分派、回覆酬載/分塊/執行階段輔助工具、channel 回覆選項、傳遞佇列，以及工作階段/thread 繫結輔助工具                                         |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值/目錄，以及 web/search/fetch/embedding 登錄表                                               |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、Gateway 控制流程，以及任務控制平面執行階段合約                                                                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                                                    |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄表、公用表面，以及 Plugin SDK 進入點合約                                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 原始碼與 Plugin 套件合約輔助工具                                                                                                        |

品質與安全維持分離，讓品質發現可以排程、量測、停用或擴充，而不會掩蓋安全訊號。Swift、Python，以及內建 Plugin 的 CodeQL 擴充，應只在狹窄設定檔具備穩定執行階段與訊號之後，再作為有範圍或分片的後續工作加回。

## 維護工作流程

### 文件 Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於讓現有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，也可以透過手動分派直接執行。當 `main` 已經前進，或過去一小時內已有另一個未略過的 Docs Agent 執行被建立時，workflow-run 呼叫會略過。執行時，它會檢視從上一個未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### 測試效能 Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於處理慢速測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果另一個 workflow-run 呼叫在該 UTC 日已經執行或正在執行，它會略過。手動分派會繞過每日活動閘門。這條路徑會建立完整套件分組 Vitest 效能報告，讓 Codex 只進行小型且保留覆蓋率的測試效能修正，而不是大範圍重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯的失敗，且 agent 後的完整套件報告必須通過後才會提交任何內容。當 bot push 落地前 `main` 又前進時，這條路徑會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期 patch 會被略過。它使用 GitHub 託管的 Ubuntu，因此 Codex action 可以維持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是供維護者在落地後清理重複項目的手動工作流程。它預設為 dry-run，且只會在 `apply=true` 時關閉明確列出的 PR。修改 GitHub 之前，它會驗證已落地的 PR 已合併，且每個重複項目都有共用的引用 issue，或有重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求比廣泛 CI 平台範圍更嚴格：

- 核心 production 變更會執行核心 prod 與核心 test 型別檢查，加上核心 lint/guards；
- 僅核心測試的變更只會執行核心 test 型別檢查，加上核心 lint；
- extension production 變更會執行 extension prod 與 extension test 型別檢查，加上 extension lint；
- 僅 extension 測試的變更會執行 extension test 型別檢查，加上 extension lint；
- 公用 Plugin SDK 或 Plugin 合約變更會擴展到 extension 型別檢查，因為 extensions 依賴這些核心合約（Vitest extension 掃描仍然是明確的測試工作）；
- 僅 release metadata 的版本 bump 會執行目標式版本/設定/root-dependency 檢查；
- 未知的 root/config 變更會 fail safe 到所有檢查路徑。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，原始碼編輯會優先使用明確映射，接著是同層測試與 import graph 相依項。共享 group-room 傳遞設定是明確映射之一：對 group visible-reply 設定、source reply delivery mode，或 message-tool system prompt 的變更，會透過核心回覆測試加上 Discord 與 Slack 傳遞回歸測試進行路由，因此共享預設值變更會在第一次 PR push 前失敗。只有當變更的範圍廣到便宜映射集合不再是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從 repo root 執行 Testbox，並優先為廣泛證明使用新的已暖機 box。在把慢速閘門花在重複使用、過期，或剛回報非預期大量同步的 box 之前，先在 box 內執行 `pnpm testbox:sanity`。

當必要 root 檔案如 `pnpm-lock.yaml` 消失，或 `git status --short` 顯示至少 200 個已追蹤刪除時，sanity check 會快速失敗。這通常代表遠端同步狀態不是 PR 的可信副本；請停止該 box 並暖機新的 box，而不是偵錯產品測試失敗。對於刻意的大量刪除 PR，為該 sanity 執行設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止停留在同步階段超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該保護，或針對異常大的本機 diff 使用較大的毫秒值。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發 channel](/zh-TW/install/development-channels)
