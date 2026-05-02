---
read_when:
    - 你需要了解 CI 作業為什麼有執行或沒有執行
    - 您正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調發行驗證的執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括項目，以及本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-02T02:45:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7312e6367d24a5f61546fa84c3a281124d463821332ae11ac7bbbbab83cb8d4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送至 `main` 以及每個 pull request 上執行。`preflight` 作業會分類差異，並在只有無關區域變更時關閉昂貴的 lane。手動 `workflow_dispatch` 執行會刻意略過智慧範圍界定，並展開完整圖形，用於 release candidate 和廣泛驗證。Android lane 透過 `include_android` 維持選擇性啟用。僅限發行的 Plugin 覆蓋範圍位於獨立的 [`Plugin 預發行`](#plugin-prerelease) workflow 中，且只會從 [`完整發行驗證`](#full-release-validation) 或明確的手動 dispatch 執行。

## Pipeline 概覽

| 作業                              | 目的                                                                                      | 執行時機                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、已變更範圍、已變更 extensions，並建置 CI manifest      | 一律在非草稿推送與 PR 上執行 |
| `security-scm-fast`              | 透過 `zizmor` 偵測私密金鑰並稽核 workflow                                        | 一律在非草稿推送與 PR 上執行 |
| `security-dependency-audit`      | 針對 npm advisories 執行不需相依套件的正式環境 lockfile 稽核                             | 一律在非草稿推送與 PR 上執行 |
| `security-fast`                  | 快速安全作業的必要彙總                                                | 一律在非草稿推送與 PR 上執行 |
| `check-dependencies`             | 正式環境 Knip 僅相依套件檢查，加上未使用檔案 allowlist 防護                    | Node 相關變更              |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置 artifact 檢查，以及可重用的下游 artifact          | Node 相關變更              |
| `checks-fast-core`               | 快速 Linux 正確性 lane，例如 bundled/Plugin 合約/protocol 檢查                 | Node 相關變更              |
| `checks-fast-contracts-channels` | 分片的 channel 合約檢查，具備穩定的彙總檢查結果                         | Node 相關變更              |
| `checks-node-core-test`          | Core Node 測試分片，排除 channel、bundled、contract 和 extension lane             | Node 相關變更              |
| `check`                          | 分片的主要本機 gate 等價項：正式環境型別、lint、guard、測試型別和嚴格 smoke   | Node 相關變更              |
| `check-additional`               | 架構、邊界、extension surface guard、package boundary 和 gateway-watch 分片 | Node 相關變更              |
| `build-smoke`                    | 已建置 CLI smoke 測試和啟動記憶體 smoke                                               | Node 相關變更              |
| `checks`                         | 已建置 artifact channel 測試的驗證器                                                    | Node 相關變更              |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke lane                                                   | 發行用手動 CI dispatch    |
| `check-docs`                     | 文件格式化、lint 和 broken-link 檢查                                                | 文件已變更                       |
| `skills-python`                  | Python backed Skills 的 Ruff + pytest                                                       | Python Skill 相關變更      |
| `checks-windows`                 | Windows 專屬 process/path 測試，加上共用 runtime import specifier 迴歸測試         | Windows 相關變更           |
| `macos-node`                     | 使用共用已建置 artifact 的 macOS TypeScript 測試 lane                                  | macOS 相關變更             |
| `macos-swift`                    | macOS app 的 Swift lint、建置和測試                                               | macOS 相關變更             |
| `android`                        | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                 | Android 相關變更           |
| `test-performance-agent`         | 可信活動後的每日 Codex 慢速測試最佳化                                    | Main CI 成功或手動 dispatch |

## Fail-fast 順序

1. `preflight` 決定哪些 lane 會存在。`docs-scope` 和 `changed-scope` 邏輯是此作業內的步驟，不是獨立作業。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 會快速失敗，不等待較重的 artifact 和平台矩陣作業。
3. `build-artifacts` 會與快速 Linux lane 重疊執行，讓下游 consumer 在共用建置準備好後立即開始。
4. 較重的平台與 runtime lane 之後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

當同一個 PR 或 `main` ref 上有較新的推送落地時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此仍會回報一般分片失敗，但在整個 workflow 已被取代後不會再排隊。自動 CI concurrency key 已版本化（`CI-v7-*`），因此 GitHub 端舊 queue group 中的 zombie 不會無限期封鎖較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試覆蓋。手動 dispatch 會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI workflow 編輯**會驗證 Node CI 圖形與 workflow linting，但本身不會強制 Windows、Android 或 macOS native 建置；這些平台 lane 仍只針對平台原始碼變更啟用。
- **僅 CI 路由的編輯、選定的低成本 core-test fixture 編輯，以及範圍狹窄的 Plugin 合約 helper/test-routing 編輯**會使用快速的僅 Node manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` 工作。當變更僅限於該快速工作直接演練的 routing 或 helper surface 時，該路徑會略過 build artifact、Node 22 相容性、channel 合約、完整 core 分片、bundled-Plugin 分片，以及額外 guard 矩陣。
- **Windows Node 檢查**範圍限於 Windows 專屬 process/path wrapper、npm/pnpm/UI runner helper、package manager config，以及執行該 lane 的 CI workflow surface；無關原始碼、Plugin、install-smoke 和僅測試變更會留在 Linux Node lane 上。

最慢的 Node 測試家族會被拆分或平衡，讓每個作業保持小型且不過度保留 runner：channel 合約以三個加權分片執行，小型 core unit lane 成對執行，auto-reply 以四個平衡 worker 執行（reply subtree 拆成 agent-runner、dispatch 和 commands/state-routing 分片），而 agentic gateway/Plugin config 則分散到現有僅原始碼的 agentic Node 作業，而不是等待已建置 artifact。廣泛的瀏覽器、QA、媒體和雜項 Plugin 測試使用其專用 Vitest config，而不是共用 Plugin catch-all。Include-pattern 分片會使用 CI 分片名稱記錄 timing entry，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 和已過濾的分片。`check-additional` 會將 package-boundary compile/canary 工作放在一起，並將 runtime topology 架構與 gateway watch 覆蓋範圍分開；boundary guard 分片會在一個作業內同時執行其小型獨立 guard。Gateway watch、channel 測試和 core support-boundary 分片會在 `dist/` 與 `dist-runtime/` 已建置後，於 `build-artifacts` 內同時執行。

Android CI 會執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test lane 仍會使用 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每個 Android 相關推送上執行重複的 debug APK packaging 作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（固定在最新 Knip 版本的正式環境 Knip 僅相依套件檢查，並在 `dlx` 安裝時停用 pnpm 的最低發行年齡限制）和 `pnpm deadcode:unused-files`，後者會將 Knip 的正式環境未使用檔案發現結果與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的未使用檔案，或留下過時的 allowlist entry 時，未使用檔案 guard 會失敗，同時保留 Knip 無法靜態解析的刻意動態 Plugin、generated、build、live-test 和 package bridge surface。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository 活動到 ClawSweeper 的目標端橋接。它不會 check out 或執行不受信任的 pull request 程式碼。該 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload dispatch 到 `openclaw/clawsweeper`。

此 workflow 有四個 lane：

- `clawsweeper_item` 用於精確的 issue 和 pull request review 請求；
- `clawsweeper_comment` 用於 issue comment 中明確的 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit 層級 review 請求；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub 活動。

`github_activity` lane 只會轉送標準化後的中繼資料：event type、action、actor、repository、item number、URL、title、state，以及存在時的 comment 或 review 短摘錄。它刻意避免轉送完整 Webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，會將標準化事件張貼到 ClawSweeper agent 的 OpenClaw Gateway hook。

一般活動是觀察，不是預設投遞。ClawSweeper agent 會在 prompt 中收到 Discord 目標，且只有在事件令人意外、可採取行動、有風險或具營運用途時，才應張貼到 `#clawsweeper`。例行開啟、編輯、bot 擾動、重複 Webhook 雜訊和一般 review 流量都應產生 `NO_REPLY`。

在整條路徑中，將 GitHub title、comment、body、review text、branch name 和 commit message 視為不受信任的資料。它們是摘要與 triage 的輸入，不是 workflow 或 agent runtime 的指示。

## 手動 dispatch

手動 CI dispatch 會執行與一般 CI 相同的作業圖形，但會強制開啟每個非 Android scoped lane：Linux Node 分片、bundled-Plugin 分片、channel 合約、Node 22 相容性、`check`、`check-additional`、build smoke、docs checks、Python Skills、Windows、macOS 和 Control UI i18n。獨立的手動 CI dispatch 只有在 `include_android=true` 時才會執行 Android；完整發行傘狀流程會透過傳遞 `include_android=true` 啟用 Android。Plugin 預發行靜態檢查、僅限發行的 `agentic-plugins` 分片、完整 extension batch sweep，以及 Plugin 預發行 Docker lane 都排除在 CI 之外。Docker 預發行套件只會在 `完整發行驗證` 以已啟用 release-validation gate 的方式 dispatch 獨立 `Plugin 預發行` workflow 時執行。

手動執行使用唯一的 concurrency group，因此 release-candidate 完整套件不會被同一 ref 上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入讓受信任的 caller 能針對 branch、tag 或完整 commit SHA 執行該圖形，同時使用所選 dispatch ref 中的 workflow file。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                           | 作業                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性作業與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速通訊協定/合約/ bundled 檢查、分片的頻道合約檢查、除 lint 以外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith 矩陣可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低負載的 Plugin 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、bundled plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 足夠敏感，8 vCPU 反而比節省的時間更耗成本）；install-smoke Docker 建置（32-vCPU 佇列時間成本高於節省的時間）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本機等效項目

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

`Full Release Validation` 是「發行前執行所有項目」的手動傘狀工作流程。它接受分支、標籤或完整 commit SHA，使用該目標分派手動 `CI` 工作流程，分派 `Plugin Prerelease` 以提供僅限發行的 plugin/package/static/Docker 證明，並分派 `OpenClaw Release Checks` 以執行安裝冒煙、套件驗收、Docker 發行路徑套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram lanes。搭配 `rerun_group=all` 和 `release_profile=full` 時，它也會針對 release checks 產生的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳入 `npm_telegram_package_spec` 可針對已發布的 npm 套件重新執行同一個 Telegram package lane。

請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解
階段矩陣、精確的工作流程作業名稱、profile 差異、artifacts，以及
聚焦重新執行的控制項。

`release_profile` 控制傳入 release checks 的 live/provider 範圍。
手動發行工作流程預設為 `stable`；只有在你
刻意需要廣泛 advisory provider/media 矩陣時才使用 `full`。

- `minimum` 保留最快的 OpenAI/core 發行關鍵 lanes。
- `stable` 加入穩定 provider/backend 集合。
- `full` 執行廣泛 advisory provider/media 矩陣。

傘狀工作流程會記錄已分派的子執行 ID，而最後的 `Verify full validation` 作業會重新檢查目前的子執行結論，並為每個子執行附加最慢作業表格。如果子工作流程重新執行後變綠，只重新執行父 verifier 作業即可重新整理傘狀結果與時間摘要。

為了復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。對發行候選版本使用 `all`，只重新執行一般完整 CI 子項時使用 `ci`，只重新執行 plugin prerelease 子項時使用 `plugin-prerelease`，重新執行每個發行子項時使用 `release-checks`，或在傘狀工作流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會在聚焦修復後，讓失敗的發行執行盒重新執行範圍保持受限。

`OpenClaw Release Checks` 使用可信任的工作流程 ref，將選定 ref 解析一次為 `release-package-under-test` tarball，然後將該 artifact 傳給 live/E2E release-path Docker 工作流程和 package acceptance shard。這能讓套件位元組在各個發行盒之間保持一致，並避免在多個子作業中重新封裝同一個候選版本。

針對 `ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行
會取代較舊的傘狀工作流程。父監控器會在父執行被取消時，取消任何
已分派的子工作流程，因此較新的 main 驗證
不會卡在過期的兩小時 release-check 執行後面。發行分支/標籤
驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## Live 和 E2E 分片

發行 live/E2E 子項保留廣泛的原生 `pnpm test:live` 覆蓋範圍，但會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是使用單一序列作業：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` 作業
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的 media audio/video 分片和 provider-filtered music 分片

這會保留相同的檔案覆蓋範圍，同時讓緩慢的 live provider 失敗更容易重新執行與診斷。彙總 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live media 分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；media 作業只會在 setup 前驗證二進位檔。讓 Docker 支援的 live 套件維持在一般 Blacksmith 執行器上，容器作業不適合啟動巢狀 Docker 測試。

Docker 支援的 live model/backend 分片會針對每個選定 commit 使用獨立的共用 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。live release 工作流程會建置並推送該映像一次，然後 Docker live model、provider-sharded gateway、CLI backend、ACP bind 和 Codex harness 分片會搭配 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片帶有明確的 script-level `timeout` 上限，低於工作流程作業 timeout，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個 release-check 預算。如果這些分片各自重新建置完整 source Docker target，表示發行執行設定錯誤，會在重複映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件能否作為產品運作？」時，使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證原始碼樹，而套件驗收會透過使用者在安裝或更新後使用的同一套 Docker E2E harness 驗證單一 tarball。

### 作業

1. `resolve_package` 會簽出 `workflow_ref`、解析一個套件候選、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`，將兩者都上傳為 `package-under-test` 成品，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 和設定檔。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備 package-digest Docker 映像，並針對該套件執行所選 Docker lane，而不是打包工作流程簽出的內容。當設定檔選取多個目標 `docker_lanes` 時，可重用工作流程會先準備一次套件和共用映像，然後將這些 lane 展開為具有唯一成品的平行目標 Docker 作業。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，並且在 Package Acceptance 解析出套件時安裝相同的 `package-under-test` 成品；獨立 Telegram 派發仍可安裝已發布的 npm 規格。
4. 如果套件解析、Docker acceptance，或可選的 Telegram lane 失敗，`summary` 會使工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。用於已發布 beta/stable acceptance。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整 commit SHA。解析器會擷取 OpenClaw 分支/標籤、驗證所選 commit 可從儲存庫分支歷史或發行標籤抵達、在 detached worktree 中安裝相依套件，並用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 可選，但外部共享成品應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/測試框架程式碼。`package_ref` 是在 `source=ref` 時會被打包的來源 commit。這讓目前的測試框架能驗證較舊的受信任來源 commit，而不必執行舊的工作流程邏輯。

### 套件組設定檔

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發行路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` 設定檔使用離線 plugin 覆蓋率，因此已發布套件驗證不會受限於即時 ClawHub 可用性。可選的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm 規格路徑供獨立派發使用。

專屬的更新與 plugin 測試政策，包括本機命令、
Docker lane、Package Acceptance 輸入、發行預設值和失敗分流，
請參閱 [測試更新與 plugins](/zh-TW/help/testing-updates-plugins)。

發行檢查會以 `source=artifact`、準備好的發行套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這會讓套件遷移、更新、過期 plugin 相依清理、離線 plugin、plugin-update 和 Telegram 證明都使用同一個已解析套件 tarball。Cross-OS 發行檢查仍涵蓋作業系統特定的 onboarding、安裝程式和平台行為；套件/更新產品驗證應從 Package Acceptance 開始。`published-upgrade-survivor` Docker lane 每次執行會驗證一個已發布套件基準。在 Package Acceptance 中，已解析的 `package-under-test` tarball 一律是候選，而 `published_upgrade_survivor_baseline` 會選取備援已發布基準，預設為 `openclaw@latest`；失敗 lane 的重跑命令會保留該基準。設定 `published_upgrade_survivor_baselines=release-history` 可將 lane 擴展成去重後的歷史矩陣：最新六個穩定版本、`2026.4.23`，以及 `2026-03-15` 之前的最新穩定版本。設定 `published_upgrade_survivor_scenarios=reported-issues` 可將相同基準擴展到以 issue 形狀建立的 fixture，涵蓋 Feishu 設定、保留的 bootstrap/persona 檔案、tilde 記錄路徑，以及過期 legacy plugin 相依根目錄。獨立的 `Update Migration` 工作流程會在問題是完整已發布更新清理，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker lane 搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本機彙總執行可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件規格、用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 取得情境矩陣。已發布 lane 會用內建的 `openclaw config set` 命令配方設定基準、在 `summary.json` 中記錄配方步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 和 RPC 狀態。Windows packaged 和 installer fresh lane 也會驗證已安裝套件能從原始絕對 Windows 路徑匯入 browser-control 覆寫。OpenAI cross-OS agent-turn smoke 預設在設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.5`，讓安裝和 gateway 證明維持在偏好的 GPT-5 測試模型上。

### 舊版相容性時窗

Package Acceptance 對已發布套件有界定的舊版相容性時窗。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中的已知私有 QA 項目可指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可跳過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的假 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，並可記錄缺失的持久化 `update.channel`；
- plugin smoke 可讀取 legacy install-record 位置，或接受缺失的 marketplace install-record 持久化；
- `plugin-update` 可允許設定中繼資料遷移，同時仍要求安裝記錄和 no-reinstall 行為保持不變。

已發布的 `2026.4.26` 套件也可對已出貨的本機建置中繼資料 stamp 檔案發出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或跳過。

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

偵錯失敗的 package acceptance 執行時，請從 `resolve_package` 摘要開始，以確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時和重跑命令。請優先重跑失敗的套件設定檔或精確 Docker lane，而不是重跑完整發行驗證。

## 安裝 smoke

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用相同的範圍腳本。它會將 smoke 覆蓋率拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑** 會在 pull request 觸及 Docker/套件表面、隨附 plugin 套件/manifest 變更，或 Docker smoke 作業會演練的核心 plugin/channel/gateway/Plugin SDK 表面時執行。僅來源的隨附 plugin 變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI smoke、執行 container gateway-network e2e、驗證隨附 extension build arg，並在 240 秒彙總命令逾時內執行有界定的 bundled-plugin Docker 設定檔（每個情境的 Docker 執行另有上限）。
- **完整路徑** 會為每晚排程執行、手動派發、workflow-call 發行檢查，以及真正觸及 installer/package/Docker 表面的 pull request 保留 QR 套件安裝和 installer Docker/update 覆蓋率。在完整模式中，install-smoke 會準備或重用一個目標 SHA GHCR 根 Dockerfile smoke 映像，然後將 QR 套件安裝、根 Dockerfile/gateway smoke、installer/update smoke，以及快速 bundled-plugin Docker E2E 作為獨立作業執行，讓 installer 工作不必等待根映像 smoke。

`main` push（包括 merge commit）不會強制完整路徑；當變更範圍邏輯會在 push 上要求完整覆蓋率時，工作流程會保留快速 Docker smoke，並將完整 install smoke 留給每晚或發行驗證。

較慢的 Bun global install image-provider smoke 由 `run_bun_global_install_smoke` 另行控管。它會在每晚排程和發行檢查工作流程中執行，手動 `Install Smoke` 派發也可選擇加入，但 pull request 和 `main` push 不會執行。QR 和 installer Docker 測試保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於 installer/update/plugin-dependency lane 的裸 Node/Git runner；
- 會將相同 tarball 安裝到 `/app` 的功能映像，用於一般功能 lane。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行所選計畫。排程器會用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選取映像，然後用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值 | 用途                                                                                          |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | 一般 lane 的主 pool slot 數量。                                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | 對 provider 敏感的 tail-pool slot 數量。                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | 並行 live lane 上限，避免 provider 節流。                                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | 並行 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | lane 啟動之間的錯開時間，用於避免 Docker daemon create 風暴；設為 `0` 表示不錯開。            |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback timeout（120 分鐘）；選定的 live/tail lane 會使用更嚴格的上限。         |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定 | `1` 會列印排程器計畫，而不執行 lane。                                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定 | 以逗號分隔的精確 lane 清單；略過 cleanup smoke，讓 agent 能重現單一失敗 lane。               |

比有效上限更重的 lane 仍可從空 pool 啟動，然後單獨執行直到釋放容量。local aggregate 會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、輸出 active-lane 狀態、持久化 lane timing 以便 longest-first 排序，並且預設在第一次失敗後停止排程新的 pooled lane。

### 可重用的 live/E2E workflow

可重用的 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些 package、image kind、live image、lane 與 credential coverage。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub outputs 與 summaries。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載 current-run package artifact，或從 `package_artifact_run_id` 下載 package artifact；驗證 tarball inventory；在計畫需要 package-installed lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以 package digest 標記的 bare/functional GHCR Docker E2E images；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` inputs 或既有 package-digest images，而不是重新建置。Docker image pull 會以每次嘗試 180 秒的有界 timeout 重試，因此卡住的 registry/cache stream 會快速重試，而不是消耗大部分 CI critical path。

### Release-path chunks

Release Docker coverage 會以較小的 chunked jobs 執行，並使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個 chunk 只 pull 它需要的 image kind，並透過同一個加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的 release Docker chunks 是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍是 aggregate plugin/runtime aliases。`install-e2e` lane alias 仍是兩個 provider installer lanes 的 aggregate manual rerun alias。

當 full release-path coverage 要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，並且只在 OpenWebUI-only dispatches 時保留 standalone `openwebui` chunk。bundled-channel update lanes 會針對暫時性 npm network failures 重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane logs、timings、`summary.json`、`failures.json`、phase timings、scheduler plan JSON、slow-lane tables，以及每個 lane 的 rerun commands。workflow 的 `docker_lanes` input 會針對已準備好的 images 執行選定 lane，而不是執行 chunk jobs，這讓 failed-lane debugging 限制在單一目標 Docker job 內，並為該次執行準備、下載或重用 package artifact；如果選定 lane 是 live Docker lane，目標 job 會為該次 rerun 在本機建置 live-test image。產生的每個 lane GitHub rerun commands 會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 與 prepared image inputs，因此失敗 lane 可以重用失敗執行中的精確 package 與 images。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E workflow 會每日執行完整 release-path Docker suite。

## Plugin Prerelease

`Plugin Prerelease` 是成本較高的 product/package coverage，因此它是由 `Full Release Validation` 或明確 operator dispatch 的獨立 workflow。一般 pull requests、`main` pushes，以及 standalone manual CI dispatches 都會關閉該 suite。它會在八個 extension workers 之間平衡 bundled Plugin 測試；這些 extension shard jobs 一次最多執行兩個 Plugin config groups，每個 group 使用一個 Vitest worker 與較大的 Node heap，因此 import-heavy Plugin batches 不會建立額外 CI jobs。release-only Docker prerelease path 會以小 group 批次執行目標 Docker lanes，避免為一到三分鐘的 jobs 保留數十個 runners。

## QA Lab

QA Lab 在 main smart-scoped workflow 之外有專用 CI lanes。

- `Parity gate` workflow 會在相符的 PR changes 與 manual dispatch 時執行；它會建置 private QA runtime，並比較 mock GPT-5.5 與 Opus 4.6 agentic packs。
- `QA-Lab - All Lanes` workflow 會每晚在 `main` 上執行，也會在 manual dispatch 時執行；它會將 mock parity gate、live Matrix lane，以及 live Telegram 與 Discord lanes 作為 parallel jobs 展開。Live jobs 使用 `qa-live-shared` environment，而 Telegram/Discord 使用 Convex leases。

Release checks 會使用 deterministic mock provider 與 mock-qualified models（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport lanes，因此 channel contract 會與 live model latency 和一般 provider-Plugin startup 隔離。live transport Gateway 會停用 memory search，因為 QA parity 會分別涵蓋 memory behavior；provider connectivity 則由獨立的 live model、native provider 與 Docker provider suites 涵蓋。

Matrix 會對 scheduled 與 release gates 使用 `--profile fast`，並且只在 checked-out CLI 支援時加入 `--fail-fast`。CLI default 與 manual workflow input 仍是 `all`；manual `matrix_profile=all` dispatch 一律會將完整 Matrix coverage 分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` jobs。

`OpenClaw Release Checks` 也會在 release approval 前執行 release-critical QA Lab lanes；它的 QA parity gate 會將 candidate 與 baseline packs 作為 parallel lane jobs 執行，然後將兩個 artifacts 下載到小型 report job 中進行最終 parity comparison。

除非變更實際觸及 QA runtime、model-pack parity，或 parity workflow 擁有的 surface，否則不要把 PR landing path 放在 `Parity gate` 後面。對一般 channel、config、docs 或 unit-test fixes，請將其視為 optional signal，並遵循 scoped CI/check evidence。

## CodeQL

`CodeQL` workflow 刻意作為範圍狹窄的第一輪 security scanner，而不是完整 repository sweep。Daily、manual 與 non-draft pull request guard runs 會掃描 Actions workflow code，以及風險最高的 JavaScript/TypeScript surfaces，並使用 high-confidence security queries，過濾到 high/critical `security-severity`。

pull request guard 保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的變更啟動，並執行與 scheduled workflow 相同的 high-confidence security matrix。Android 與 macOS CodeQL 不包含在 PR defaults 中。

### Security categories

| 類別                                              | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、secrets、sandbox、cron 與 gateway baseline                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel implementation contracts，加上 channel Plugin runtime、Gateway、Plugin SDK、secrets、audit touchpoints                |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF、IP parsing、network guard、web-fetch 與 Plugin SDK SSRF policy surfaces                                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers、process execution helpers、outbound delivery 與 agent tool-execution gates                                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install、loader、manifest、registry、package-manager install、source-loading，以及 Plugin SDK package contract trust surfaces |

### Platform-specific security shards

- `CodeQL Android Critical Security` — scheduled Android security shard。會在 workflow sanity 接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android app。上傳到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard。會在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中過濾掉 dependency build results，並上傳到 `/codeql-critical-security/macos`。因為即使 clean，macOS build 也主導 runtime，所以保留在 daily defaults 之外。

### Critical Quality categories

`CodeQL Critical Quality` 是對應的 non-security shard。它只會在較小的 Blacksmith Linux runner 上，針對狹窄但高價值的 surfaces 執行 error-severity、non-security JavaScript/TypeScript quality queries。它的 pull request guard 刻意比 scheduled profile 更小：non-draft PRs 只會針對 agent command/model/tool execution 與 reply dispatch code、config schema/migration/IO code、auth/secrets/sandbox/security code、core channel 與 bundled channel Plugin runtime、Gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、Plugin loader、Plugin SDK/package-contract，或 Plugin SDK reply runtime changes，執行相符的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 與 `plugin-sdk-reply-runtime` shards。CodeQL config 與 quality workflow changes 會執行全部十二個 PR quality shards。

Manual dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

narrow profiles 是用來隔離執行單一 quality shard 的 teaching/iteration hooks。

| 類別                                                    | 範圍                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、密鑰、沙箱、Cron 與 Gateway 安全邊界程式碼                                                                                                                 |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化與 IO 合約                                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 協定結構描述與伺服器方法合約                                                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與內建通道 Plugin 實作合約                                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及對外傳遞合約                                                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體 Plugin SDK 別名、記憶體執行階段啟用銜接，以及記憶體 doctor 命令                                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞輔助工具、診斷事件/日誌套件介面，以及工作階段 doctor CLI 合約                                             |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆分派、回覆承載/分塊/執行階段輔助工具、通道回覆選項、傳遞佇列，以及工作階段/執行緒繫結輔助工具                                               |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值/目錄，以及網頁/搜尋/擷取/嵌入登錄                                                           |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、Gateway 控制流程，以及任務控制平面執行階段合約                                                                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取/搜尋、媒體 IO、媒體理解、圖片生成與媒體生成執行階段合約                                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公開介面與 Plugin SDK 進入點合約                                                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 原始碼與 Plugin 套件合約輔助工具                                                                                                        |

品質與安全性保持分離，讓品質發現可以排程、衡量、停用或擴充，而不會遮蔽安全訊號。Swift、Python 與內建 Plugin 的 CodeQL 擴充，應只在狹窄設定檔具備穩定執行階段與訊號後，作為有範圍或分片的後續工作加回。

## 維護工作流程

### 文件代理

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot 推送 CI 執行可以觸發它，手動分派也可以直接執行它。當 `main` 已經往前移動，或過去一小時內已建立另一個未略過的 Docs Agent 執行時，工作流程執行叫用會略過。執行時，它會檢視從上一個未略過 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件通過以來累積的所有 main 變更。

### 測試效能代理

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於處理緩慢測試。它沒有純排程：`main` 上成功的非 bot 推送 CI 執行可以觸發它，但如果當天 UTC 已有另一個工作流程執行叫用完成或正在執行，它會略過。手動分派會繞過該每日活動閘門。此路徑會建立完整測試套件分組 Vitest 效能報告，讓 Codex 只進行小型且保留覆蓋率的測試效能修正，而不是大型重構；接著重新執行完整測試套件報告，並拒絕會降低通過基準測試數量的變更。如果基準存在失敗測試，Codex 只能修正明顯失敗，且代理後的完整測試套件報告必須通過，才會提交任何內容。當 `main` 在 bot 推送落地前往前推進時，此路徑會 rebase 已驗證的修補、重新執行 `pnpm check:changed`，並重試推送；有衝突的過期修補會被略過。它使用 GitHub 託管的 Ubuntu，因此 Codex action 可以維持與文件代理相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是手動維護者工作流程，用於落地後的重複項清理。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。修改 GitHub 之前，它會驗證落地 PR 已合併，且每個重複 PR 都有共用的參照議題或重疊的變更區塊。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機變更路徑邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求比廣泛 CI 平台範圍更嚴格：

- 核心生產變更會執行核心生產與核心測試 typecheck，加上核心 lint/guard；
- 僅核心測試的變更只會執行核心測試 typecheck，加上核心 lint；
- 擴充生產變更會執行擴充生產與擴充測試 typecheck，加上擴充 lint；
- 僅擴充測試的變更會執行擴充測試 typecheck，加上擴充 lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴展到擴充 typecheck，因為擴充依賴那些核心合約（Vitest 擴充掃描仍保留為明確測試工作）；
- 僅發布中繼資料的版本升級會執行針對性的版本/設定/根依賴檢查；
- 未知的根/設定變更會安全失敗到所有檢查路徑。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，原始碼編輯優先使用明確對應，接著使用同層測試與匯入圖相依項。共用群組室傳遞設定是其中一項明確對應：對群組可見回覆設定、來源回覆傳遞模式，或訊息工具系統提示的變更，會透過核心回覆測試以及 Discord 和 Slack 傳遞回歸測試路由，因此共用預設值變更會在第一次 PR 推送前失敗。只有當變更涉及整個 harness，以至於便宜的對應集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從 repo 根目錄執行 Testbox，並優先為廣泛證明使用新的已預熱 box。在將緩慢閘門花費在重複使用、過期或剛回報異常大型同步的 box 之前，先在 box 內執行 `pnpm testbox:sanity`。

當必要根檔案如 `pnpm-lock.yaml` 消失，或 `git status --short` 顯示至少 200 個已追蹤刪除時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；請停止該 box 並預熱新的 box，而不是除錯產品測試失敗。對於刻意大量刪除的 PR，請為該健全性執行設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止停留在同步階段超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 叫用。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該 guard，或為異常大型本機差異使用較大的毫秒值。

Crabbox 是 repo 擁有的第二條遠端 box 路徑，用於 Blacksmith 不可用或偏好使用自有雲端容量時的 Linux 證明。預熱 box，透過專案工作流程補水，接著透過 Crabbox CLI 執行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 擁有提供者、同步與 GitHub Actions 補水預設值。它排除本機 `.git`，讓已補水的 Actions checkout 保留自己的遠端 Git 中繼資料，而不是同步維護者本機 remotes 與物件儲存，並且排除永遠不應傳輸的本機執行階段/建置產物。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` 擷取，以及後續 `crabbox run --id <cbx_id>` 命令會 source 的非密鑰環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
