---
read_when:
    - 你需要了解 CI 作業為何執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次發布驗證執行或重新執行
summary: CI 作業圖、範圍閘門、發行總括項，以及本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-01T02:44:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c2ee36f96ccf86d4adb739f5f7efb82c05f733e7693571ce391269d2538fec7
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個拉取請求時執行。`preflight` 工作會分類差異，並在只有不相關區域變更時關閉昂貴的路徑。手動 `workflow_dispatch` 執行會刻意略過智慧範圍判定，並展開完整圖形，用於候選版本與廣泛驗證。Android 路徑透過 `include_android` 維持選擇加入。僅限發行版的 Plugin 覆蓋位於獨立的 [`Plugin 預發行`](#plugin-prerelease) 工作流程中，且只會從 [`完整發行驗證`](#full-release-validation) 或明確的手動派發執行。

## 管線總覽

| 工作                             | 目的                                                                                         | 執行時機                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、變更範圍、變更的擴充功能，並建置 CI 清單                                   | 一律在非草稿推送與 PR 上執行       |
| `security-scm-fast`              | 透過 `zizmor` 進行私鑰偵測與工作流程稽核                                                    | 一律在非草稿推送與 PR 上執行       |
| `security-dependency-audit`      | 針對 npm advisories 的無依賴生產 lockfile 稽核                                               | 一律在非草稿推送與 PR 上執行       |
| `security-fast`                  | 快速安全工作所需的彙總                                                                       | 一律在非草稿推送與 PR 上執行       |
| `check-dependencies`             | 僅限生產 Knip 依賴檢查，加上未使用檔案允許清單防護                                          | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置成品檢查，以及可重用的下游成品                              | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性路徑，例如 bundled/plugin-contract/protocol 檢查                            | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的頻道合約檢查，並提供穩定的彙總檢查結果                                                | Node 相關變更                      |
| `checks-node-core-test`          | 核心 Node 測試分片，不包含頻道、bundled、contract 與擴充功能路徑                             | Node 相關變更                      |
| `check`                          | 分片的主要本機閘門等價項：生產型別、lint、防護、測試型別與嚴格 smoke                        | Node 相關變更                      |
| `check-additional`               | 架構、邊界、擴充功能表面防護、套件邊界，以及 gateway-watch 分片                              | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI smoke 測試與啟動記憶體 smoke                                                      | Node 相關變更                      |
| `checks`                         | 已建置成品頻道測試的驗證器                                                                   | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 路徑                                                              | 發行版的手動 CI 派發               |
| `check-docs`                     | 文件格式化、lint 與損壞連結檢查                                                             | 文件已變更                         |
| `skills-python`                  | Python 支援 Skills 的 Ruff + pytest                                                          | Python Skill 相關變更              |
| `checks-windows`                 | Windows 專用處理程序/路徑測試，以及共享執行階段 import specifier 迴歸                       | Windows 相關變更                   |
| `macos-node`                     | 使用共享已建置成品的 macOS TypeScript 測試路徑                                               | macOS 相關變更                     |
| `macos-swift`                    | macOS App 的 Swift lint、建置與測試                                                          | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                    | Android 相關變更                   |
| `test-performance-agent`         | 可信活動後每日的 Codex 慢速測試最佳化                                                       | 主要 CI 成功或手動派發             |

## 快速失敗順序

1. `preflight` 會決定哪些路徑實際存在。`docs-scope` 與 `changed-scope` 邏輯是此工作內的步驟，而不是獨立工作。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 與 `skills-python` 會快速失敗，不需等待較重的成品與平台矩陣工作。
3. `build-artifacts` 會與快速 Linux 路徑重疊，讓下游消費者能在共享建置準備好後立即開始。
4. 較重的平台與執行階段路徑會在之後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 與 `android`。

當同一個 PR 或 `main` ref 上有較新的推送到達時，GitHub 可能會將被取代的工作標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此它們仍會回報一般分片失敗，但不會在整個工作流程已被取代後繼續排隊。自動 CI 並行鍵有版本標記（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍工作無法無限期封鎖較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消正在進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動派發會略過變更範圍偵測，並讓 preflight 清單表現得像每個有範圍的區域都已變更。

- **CI 工作流程編輯**會驗證 Node CI 圖形與工作流程 lint，但不會單獨強制執行 Windows、Android 或 macOS 原生建置；這些平台路徑仍僅限於平台原始碼變更。
- **僅 CI 路由編輯、選定的低成本核心測試 fixture 編輯，以及狹窄的 Plugin 合約輔助/測試路由編輯**會使用快速的僅 Node 清單路徑：`preflight`、安全性，以及單一 `checks-fast-core` 工作。當變更僅限於該快速工作會直接執行的路由或輔助表面時，此路徑會略過建置成品、Node 22 相容性、頻道合約、完整核心分片、bundled-plugin 分片，以及額外的防護矩陣。
- **Windows Node 檢查**的範圍限於 Windows 專用處理程序/路徑包裝器、npm/pnpm/UI runner 輔助、套件管理器設定，以及執行該路徑的 CI 工作流程表面；不相關的原始碼、Plugin、install-smoke 與僅測試變更會留在 Linux Node 路徑上。

最慢的 Node 測試家族會被拆分或平衡，讓每個工作保持較小且不過度保留 runner：頻道合約以三個加權分片執行，小型核心單元路徑會配對，auto-reply 以四個平衡 worker 執行（reply 子樹拆成 agent-runner、dispatch 與 commands/state-routing 分片），而 agentic gateway/plugin 設定會分散到現有的僅原始碼 agentic Node 工作中，而不是等待已建置成品。廣泛的瀏覽器、QA、媒體與雜項 Plugin 測試會使用其專用 Vitest 設定，而不是共享的 Plugin catch-all。include-pattern 分片會使用 CI 分片名稱記錄時間項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個設定與過濾後的分片。`check-additional` 會將套件邊界編譯/canary 工作保持在一起，並將執行階段拓撲架構與 gateway watch 覆蓋分開；邊界防護分片會在一個工作內並行執行其小型獨立防護。Gateway watch、頻道測試與核心支援邊界分片會在 `dist/` 與 `dist-runtime/` 已建置後，於 `build-artifacts` 內並行執行。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其單元測試路徑仍會使用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每個 Android 相關推送上重複 debug APK 封裝工作。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（固定使用最新 Knip 版本的僅限生產 Knip 依賴檢查，並為 `dlx` 安裝停用 pnpm 的最低發行年齡）以及 `pnpm deadcode:unused-files`，後者會將 Knip 的生產未使用檔案發現結果與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未審查的未使用檔案或留下過時的允許清單項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的刻意動態 Plugin、產生檔、建置、live-test 與套件橋接表面。

## 手動派發

手動 CI 派發會執行與一般 CI 相同的工作圖形，但會強制開啟每個非 Android 範圍路徑：Linux Node 分片、bundled-plugin 分片、頻道合約、Node 22 相容性、`check`、`check-additional`、建置 smoke、文件檢查、Python Skills、Windows、macOS 與 Control UI i18n。獨立的手動 CI 派發只有在 `include_android=true` 時才會執行 Android；完整發行傘狀流程會透過傳遞 `include_android=true` 啟用 Android。Plugin 預發行靜態檢查、僅限發行版的 `agentic-plugins` 分片、完整擴充功能批次掃描，以及 Plugin 預發行 Docker 路徑都排除在 CI 之外。Docker 預發行套件只會在 `Full Release Validation` 以啟用 release-validation 閘門的方式派發獨立 `Plugin Prerelease` 工作流程時執行。

手動執行會使用唯一的並行群組，因此候選版本完整套件不會被同一 ref 上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入允許可信呼叫者針對分支、標籤或完整 commit SHA 執行該圖形，同時使用所選派發 ref 中的工作流程檔案。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| 執行器                           | 工作                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性工作與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速通訊協定/合約/內建檢查、分片頻道合約檢查、除 lint 以外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 代管的 Ubuntu，讓 Blacksmith 矩陣可以更早排入佇列 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低負載的 Plugin 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、內建 Plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 足夠敏感，以至於 8 vCPU 增加的成本高於節省的成本）；install-smoke Docker 建置（32-vCPU 佇列時間的成本高於節省的成本）                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` 是「發行前執行所有項目」的手動傘狀工作流程。它接受分支、標籤或完整提交 SHA，使用該目標派送手動 `CI` 工作流程，派送 `Plugin Prerelease` 以取得僅限發行的 Plugin/package/static/Docker 證明，並派送 `OpenClaw Release Checks` 以執行安裝 smoke、package acceptance、Docker 發行路徑套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 路徑。提供已發布套件規格時，它也可以執行發布後的 `NPM Telegram Beta E2E` 工作流程。

請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解
階段矩陣、確切的工作流程工作名稱、profile 差異、成品，以及
聚焦重新執行控制代碼。

`release_profile` 控制傳遞給發行檢查的 live/provider 廣度。
手動發行工作流程預設為 `stable`；只有在你
有意需要廣泛的 advisory provider/media 矩陣時，才使用 `full`。

- `minimum` 保留最快的 OpenAI/core 發行關鍵路徑。
- `stable` 加入穩定的 provider/backend 集合。
- `full` 執行廣泛的 advisory provider/media 矩陣。

傘狀工作流程會記錄已派送的子執行 ID，最終的 `Verify full validation` 工作會重新檢查目前子執行結論，並為每個子執行附加最慢工作表。如果子工作流程重新執行後轉為綠燈，只需重新執行父驗證器工作，即可重新整理傘狀結果與時間摘要。

若要復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。對發行候選版本使用 `all`，只重新執行一般完整 CI 子項時使用 `ci`，只重新執行 Plugin 預發行子項時使用 `plugin-prerelease`，重新執行每個發行子項時使用 `release-checks`，或在傘狀工作流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這讓修正聚焦問題後，失敗的發行方塊重新執行仍保持有界。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將選取的 ref 解析一次為 `release-package-under-test` tarball，然後將該成品同時傳遞給 live/E2E 發行路徑 Docker 工作流程和 package acceptance 分片。這讓發行方塊之間的套件位元組保持一致，並避免在多個子工作中重新封裝同一個候選版本。

`ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行
會取代較舊的傘狀工作流程。父監視器會在父項取消時取消任何它
已派送的子工作流程，因此較新的 main 驗證
不會卡在過期的兩小時 release-check 執行之後。發行分支/標籤
驗證和聚焦重新執行群組會保留 `cancel-in-progress: false`。

## Live 和 E2E 分片

發行 live/E2E 子項保留廣泛的原生 `pnpm test:live` 覆蓋範圍，但它會透過 `scripts/test-live-shard.mjs` 以命名分片執行，而不是單一序列工作：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider 篩選的 `native-live-src-gateway-profiles` 工作
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的 media audio/video 分片，以及 provider 篩選的 music 分片

這會保留相同的檔案覆蓋範圍，同時讓緩慢的 live provider 失敗更容易重新執行和診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live media 分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；media 工作只會在設定前驗證二進位檔。請將 Docker 支援的 live 套件保留在一般 Blacksmith 執行器上，容器工作並不適合啟動巢狀 Docker 測試。

Docker 支援的 live model/backend 分片會針對每個選取的提交使用獨立的共用 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。live 發行工作流程會建置並推送該映像一次，然後 Docker live model、provider 分片 Gateway、CLI backend、ACP bind 和 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片在 workflow job timeout 以下帶有明確的 script-level `timeout` 上限，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個 release-check 預算。如果這些分片各自獨立重建完整 source Docker 目標，表示發行執行設定錯誤，並會在重複映像建置上浪費實際時間。

## Package Acceptance

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證來源樹，而 package acceptance 會透過使用者安裝或更新後執行的同一套 Docker E2E harness 驗證單一 tarball。

### 工作

1. `resolve_package` 簽出 `workflow_ref`，解析一個套件候選項，寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，寫入 `.artifacts/docker-e2e-package/package-candidate.json`，將兩者都上傳為 `package-under-test` 成品，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 與設定檔。
2. `docker_acceptance` 以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備套件摘要 Docker 映像，並針對該套件執行選定的 Docker 路徑，而不是打包工作流程簽出的內容。當設定檔選取多個目標 `docker_lanes` 時，可重用工作流程會先準備一次套件與共用映像，然後將這些路徑展開為平行的目標 Docker 工作，並使用唯一成品。
3. `package_telegram` 可選擇呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，且在 Package Acceptance 已解析套件時安裝同一個 `package-under-test` 成品；獨立 Telegram 派送仍可安裝已發佈的 npm 規格。
4. 如果套件解析、Docker acceptance，或選用的 Telegram 路徑失敗，`summary` 會讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。這用於已發佈 beta/stable 的 acceptance。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整 commit SHA。解析器會擷取 OpenClaw 分支/標籤、驗證所選 commit 可從儲存庫分支歷史或發行標籤到達、在 detached worktree 中安裝相依套件，並用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 是選用，但外部共享的成品應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/測試框架程式碼。`package_ref` 是當 `source=ref` 時會被打包的來源 commit。這讓目前的測試框架可驗證較舊的受信任來源 commit，而不執行舊的工作流程邏輯。

### 套件設定檔

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` 加上 `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發行路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` 設定檔使用離線 plugin 涵蓋範圍，因此已發佈套件驗證不會受限於即時 ClawHub 可用性。選用的 Telegram 路徑會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發佈 npm 規格路徑供獨立派送使用。

發行檢查會以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 呼叫 Package Acceptance。發行路徑 Docker 區塊涵蓋重疊的套件/update/plugin 路徑；Package Acceptance 則保留對同一個已解析套件 tarball 的成品原生 bundled-channel 相容性、離線 plugin 與 Telegram 證明。跨 OS 發行檢查仍涵蓋 OS 特定的 onboarding、安裝程式與平台行為；套件/update 產品驗證應從 Package Acceptance 開始。Windows packaged 與 installer fresh 路徑也會驗證已安裝套件可以從原始的 Windows 絕對路徑匯入 browser-control 覆寫。OpenAI 跨 OS agent-turn 冒煙測試在已設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4-mini`，因此安裝與 Gateway 證明能保持快速且具確定性。

### 舊版相容性窗口

Package Acceptance 對已發佈套件有有限的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私人 QA 項目可能指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的假 git fixture 中修剪缺少的 `pnpm.patchedDependencies`，且可記錄缺少的持久化 `update.channel`；
- plugin 冒煙測試可讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可允許設定中繼資料遷移，同時仍要求安裝記錄與不重新安裝行為保持不變。

已發佈的 `2026.4.26` 套件也可能對已出貨的本機建置中繼資料戳記檔提出警告。之後的套件必須符合現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的 package acceptance 執行時，請從 `resolve_package` 摘要開始，以確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、路徑記錄、階段計時與重新執行指令。偏好重新執行失敗的套件設定檔或精確的 Docker 路徑，而不是重新執行完整發行驗證。

## 安裝冒煙測試

獨立的 `Install Smoke` 工作流程透過自己的 `preflight` 工作重用相同的範圍腳本。它將冒煙測試涵蓋範圍分成 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑** 會在 pull request 觸及 Docker/套件表面、bundled plugin 套件/manifest 變更，或 Docker 冒煙工作會測試到的核心 plugin/channel/gateway/Plugin SDK 表面時執行。僅來源的 bundled plugin 變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI 冒煙測試、執行容器 gateway-network e2e、驗證 bundled extension 建置參數，並在 240 秒彙總指令逾時下執行有界的 bundled-plugin Docker 設定檔（每個情境的 Docker 執行會另外設上限）。
- **完整路徑** 會保留 QR 套件安裝與安裝程式 Docker/update 涵蓋範圍，用於 nightly 排程執行、手動派送、workflow-call 發行檢查，以及真正觸及安裝程式/套件/Docker 表面的 pull request。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 冒煙映像，然後將 QR 套件安裝、根 Dockerfile/gateway 冒煙測試、安裝程式/update 冒煙測試，以及快速 bundled-plugin Docker E2E 作為獨立工作執行，讓安裝程式工作不會排在根映像冒煙測試後面等待。

`main` 推送（包括 merge commit）不會強制完整路徑；當變更範圍邏輯會在推送上要求完整涵蓋範圍時，工作流程會保留快速 Docker 冒煙測試，並將完整 install smoke 留給 nightly 或發行驗證。

較慢的 Bun 全域安裝 image-provider 冒煙測試由 `run_bun_global_install_smoke` 另行控管。它會在 nightly 排程和發行檢查工作流程中執行，手動 `Install Smoke` 派送也可選擇加入，但 pull request 和 `main` 推送不會執行。QR 與安裝程式 Docker 測試保留各自專注於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用的即時測試映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 一個裸 Node/Git runner，用於安裝程式/update/plugin 相依性路徑；
- 一個功能映像，會將同一個 tarball 安裝到 `/app`，用於一般功能路徑。

Docker 路徑定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行所選計畫。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 依路徑選取映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行路徑。

### 可調整項目

| 變數                                   | 預設值  | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般路徑的主集區 slot 數量。                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對供應商敏感的尾端集區 slot 數量。                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行即時路徑上限，避免供應商節流。                                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm 安裝路徑上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行多服務路徑上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 路徑啟動之間的錯開時間，用於避免 Docker daemon create 風暴；設為 `0` 表示不錯開。             |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個路徑的備援逾時（120 分鐘）；選定的即時/尾端路徑會使用更緊的上限。                        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定  | `1` 會列印排程器計畫而不執行路徑。                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定  | 以逗號分隔的精確路徑清單；略過清理冒煙測試，讓代理程式能重現單一失敗路徑。                   |

比其有效上限更重的路徑仍可從空集區啟動，然後單獨執行直到釋放容量。本機彙總會預先檢查 Docker、移除過時的 OpenClaw E2E 容器、發出作用中路徑狀態、持久化路徑計時以供最長優先排序，且預設在第一次失敗後停止排程新的集區路徑。

### 可重用的即時/E2E 工作流程

可重用的 live/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些套件、映像種類、live 映像、lane 和認證覆蓋範圍。`scripts/docker-e2e.mjs` 接著會把該計畫轉換成 GitHub 輸出和摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行中的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball 清單；在計畫需要套件安裝 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的 bare/functional GHCR Docker E2E 映像；並且重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或現有的套件 digest 映像，而不是重新建置。Docker 映像拉取會以每次嘗試 180 秒的有界逾時重試，讓卡住的 registry/cache 串流能快速重試，而不是消耗 CI 關鍵路徑的大部分時間。

### 發行路徑區塊

發行 Docker 覆蓋範圍會以較小的分塊工作執行，並搭配 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每個區塊只會拉取它需要的映像種類，並透過同一個加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

目前的發行 Docker 區塊是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` 到 `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`，以及 `bundled-channels-contracts`。彙總 `bundled-channels` 區塊仍可用於手動一次性重新執行，而 `plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總 Plugin/runtime 別名。`install-e2e` lane 別名仍是兩個 provider 安裝器 lane 的彙總手動重新執行別名。`bundled-channels` 區塊會執行拆分後的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是序列式全包的 `bundled-channel-deps` lane。

當完整 release-path 覆蓋範圍要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，並且只在 OpenWebUI-only dispatch 時保留獨立的 `openwebui` 區塊。Bundled-channel 更新 lane 會針對暫時性的 npm 網路失敗重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、時間、`summary.json`、`failures.json`、階段時間、排程器計畫 JSON、慢速 lane 表格，以及每個 lane 的重新執行指令。工作流程的 `docker_lanes` 輸入會針對已準備的映像執行所選 lane，而不是執行分塊工作，這會將失敗 lane 的偵錯範圍限制在一個目標 Docker 工作，並為該次執行準備、下載或重用套件成品；如果所選 lane 是 live Docker lane，目標工作會在本機為該次重新執行建置 live-test 映像。產生的每個 lane GitHub 重新執行指令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備的映像輸入，因此失敗的 lane 可以重用失敗執行中的確切套件和映像。

```bash
pnpm test:docker:rerun <run-id>      # 下載 Docker 成品並列印合併/每個 lane 的目標重新執行指令
pnpm test:docker:timings <summary>   # 慢速 lane 和階段關鍵路徑摘要
```

排程的 live/E2E 工作流程每天執行完整的 release-path Docker 套件。

## Plugin 預發行

`Plugin Prerelease` 是成本較高的產品/套件覆蓋範圍，因此它是一個獨立工作流程，由 `Full Release Validation` 或明確的操作員觸發。一般 pull request、`main` push，以及獨立的手動 CI dispatch 都會停用該套件。它會在八個 extension worker 之間平衡 bundled plugin 測試；這些 extension shard 工作一次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest worker 和較大的 Node heap，因此 import-heavy 的 Plugin 批次不會建立額外 CI 工作。僅限發行的 Docker 預發行路徑會以小群組批次執行目標 Docker lane，以避免為一到三分鐘的工作保留數十個 runner。

## QA Lab

QA Lab 在主要 smart-scoped 工作流程之外有專用 CI lane。

- `Parity gate` 工作流程會在相符的 PR 變更和手動 dispatch 時執行；它會建置私有 QA runtime，並比較模擬 GPT-5.5 和 Opus 4.6 agentic pack。
- `QA-Lab - All Lanes` 工作流程會在 `main` 上每晚執行，並在手動 dispatch 時執行；它會將模擬 parity gate、live Matrix lane，以及 live Telegram 和 Discord lane 展開為平行工作。Live 工作使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex lease。

發行檢查會搭配確定性的 mock provider 和 mock-qualified 模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram live transport lane，因此 channel contract 會與 live 模型延遲和一般 provider-plugin 啟動隔離。live transport Gateway 會停用記憶體搜尋，因為 QA parity 會另外覆蓋記憶體行為；provider 連線能力則由獨立的 live 模型、原生 provider 和 Docker provider 套件覆蓋。

Matrix 會針對排程和發行 gate 使用 `--profile fast`，且只有在 checkout 的 CLI 支援時才加入 `--fail-fast`。CLI 預設值和手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix 覆蓋範圍切分成 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 工作。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab lane；其 QA parity gate 會將候選 pack 和 baseline pack 作為平行 lane 工作執行，接著把兩者的成品下載到小型報告工作中，以進行最終 parity 比較。

除非變更實際觸及 QA runtime、model-pack parity，或 parity 工作流程擁有的 surface，否則不要把 PR landing path 放在 `Parity gate` 之後。對一般 channel、設定、文件或單元測試修正，將其視為選用訊號，並遵循 scoped CI/check 證據。

## CodeQL

`CodeQL` 工作流程刻意是狹窄的第一輪安全掃描器，而不是完整 repository 掃描。每日、手動和非草稿 pull request guard 執行會掃描 Actions 工作流程程式碼，以及最高風險的 JavaScript/TypeScript surface，並使用篩選為高/嚴重 `security-severity` 的高信心安全查詢。

pull request guard 保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下的變更啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 和 macOS CodeQL 不在 PR 預設值中。

### 安全類別

| 類別                                              | Surface                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、secrets、sandbox、Cron 和 Gateway baseline                                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | 核心 channel 實作 contract，加上 channel Plugin runtime、Gateway、Plugin SDK、secrets、audit touchpoint                                |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP parsing、network guard、web-fetch，以及 Plugin SDK SSRF policy surface                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP server、process execution helper、outbound delivery，以及 agent tool-execution gate                                                |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install、loader、manifest、registry、runtime-dependency staging、source-loading，以及 Plugin SDK package contract trust surface |

### 平台特定安全 shard

- `CodeQL Android Critical Security` — 排程的 Android 安全 shard。為 CodeQL 在 workflow sanity 接受的最小 Blacksmith Linux runner 上手動建置 Android app。上傳到 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全 shard。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中過濾掉依賴項建置結果，並上傳到 `/codeql-critical-security/macos` 底下。因為 macOS 建置即使乾淨也會主導 runtime，所以保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全 shard。它只會在較小的 Blacksmith Linux runner 上，針對狹窄的高價值 surface 執行 error-severity、非安全 JavaScript/TypeScript 品質查詢。它的 pull request guard 刻意比排程 profile 更小：非草稿 PR 只會針對 agent command/model/tool execution 和 reply dispatch code、config schema/migration/IO code、auth/secrets/sandbox/security code、核心 channel 和 bundled channel Plugin runtime、Gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、Plugin loader、Plugin SDK/package-contract，或 Plugin SDK reply runtime 變更，執行相符的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` shard。CodeQL 設定和品質工作流程變更會執行全部十二個 PR quality shard。

手動 dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄的 profile 是用來單獨執行一個 quality shard 的教學/迭代 hook。

| 類別                                                    | 表面                                                                                                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、密鑰、沙盒、Cron 和 Gateway 安全邊界程式碼                                                                                                                   |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化和 IO 合約                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 協定結構描述和伺服器方法合約                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道和內建通道 Plugin 實作合約                                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/供應商分派、自動回覆分派和佇列，以及 ACP 控制平面執行階段合約                                                                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器和工具橋接、程序監督協助工具，以及對外傳遞合約                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體 Plugin SDK 別名、記憶體執行階段啟用黏合層，以及記憶體 doctor 命令                                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞協助工具、診斷事件/記錄套件表面，以及工作階段 doctor CLI 合約                                               |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆分派、回覆承載/分塊/執行階段協助工具、通道回覆選項、傳遞佇列，以及工作階段/執行緒繫結協助工具                                                |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、供應商驗證與探索、供應商執行階段註冊、供應商預設值/目錄，以及網頁/搜尋/擷取/嵌入註冊表                                                           |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動程序、本機持久化、Gateway 控制流程，以及任務控制平面執行階段合約                                                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取/搜尋、媒體 IO、媒體理解、影像生成和媒體生成執行階段合約                                                                                              |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、註冊表、公開表面和 Plugin SDK 進入點合約                                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 原始碼和 Plugin 套件合約協助工具                                                                                                          |

品質與安全性保持分離，讓品質發現項目可以排程、量測、停用或擴展，而不會遮蔽安全性訊號。Swift、Python 和內建 Plugin 的 CodeQL 擴展，應只在窄範圍設定檔具備穩定執行階段和訊號後，作為具範圍或分片的後續工作加回。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非機器人 push CI 執行可以觸發它，也可以透過手動分派直接執行。當 `main` 已向前推進，或過去一小時內已建立另一個未略過的 Docs Agent 執行時，工作流程執行叫用會略過。執行時，它會檢閱從前一次未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於處理緩慢測試。它沒有純排程：`main` 上成功的非機器人 push CI 執行可以觸發它，但如果同一 UTC 日已有另一個工作流程執行叫用已執行或正在執行，則會略過。手動分派會繞過該每日活動閘門。此通道會建立完整套件分組的 Vitest 效能報告，讓 Codex 只進行保留覆蓋率的小型測試效能修正，而不是大範圍重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯的失敗，且代理之後的完整套件報告必須通過，才會提交任何內容。當 `main` 在機器人 push 落地前向前推進時，此通道會 rebase 已驗證的修補程式、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期修補程式會被略過。它使用 GitHub 託管的 Ubuntu，因此 Codex action 可以保持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是用於落地後重複項清理的手動維護者工作流程。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會驗證已落地 PR 已合併，且每個重複項都有共用的引用 issue 或重疊的已變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門和變更路由

本機變更通道邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求，比廣泛的 CI 平台範圍更嚴格：

- 核心生產程式碼變更會執行核心 prod 和核心 test 型別檢查，以及核心 lint/guards；
- 僅核心測試變更只會執行核心 test 型別檢查和核心 lint；
- 擴充生產程式碼變更會執行擴充 prod 和擴充 test 型別檢查，以及擴充 lint；
- 僅擴充測試變更會執行擴充 test 型別檢查和擴充 lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴展到擴充型別檢查，因為擴充依賴這些核心合約（Vitest 擴充掃描仍是明確的測試工作）；
- 僅發布中繼資料的版本遞增會執行目標版本/設定/根相依性檢查；
- 未知的根目錄/設定變更會 fail safe 到所有檢查通道。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，原始碼編輯優先使用明確對應，接著是同層測試和匯入圖相依項。共用群組房間傳遞設定是其中一個明確對應：群組可見回覆設定、來源回覆傳遞模式，或訊息工具系統提示的變更，會路由至核心回覆測試加上 Discord 和 Slack 傳遞迴歸測試，讓共用預設值變更在第一次 PR push 前失敗。只有當變更範圍大到涵蓋整個 harness，使便宜的對應集合不再是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從 repo root 執行 Testbox，並優先使用新預熱的 box 進行廣泛證明。在對已重用、已過期，或剛回報非預期大型同步的 box 花時間執行慢速閘門前，先在 box 內執行 `pnpm testbox:sanity`。

當必要的根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個受追蹤刪除時，sanity check 會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；停止該 box，改為預熱新的 box，而不是除錯產品測試失敗。對於刻意的大量刪除 PR，為該 sanity 執行設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 叫用。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該 guard，或針對異常大型本機 diff 使用較大的毫秒值。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
