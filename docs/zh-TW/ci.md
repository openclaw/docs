---
read_when:
    - 你需要了解 CI 作業為何執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調發布驗證的執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括，以及本機指令對應方式
title: CI 管線
x-i18n:
    generated_at: "2026-05-02T23:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 時執行。`preflight` 工作會分類差異，並在只有無關區域變更時關閉昂貴的執行線。手動 `workflow_dispatch` 執行會刻意略過智慧範圍判定，並展開完整圖形，用於發行候選版本與廣泛驗證。Android 執行線會透過 `include_android` 保持選擇性啟用。僅限發行版的 Plugin 涵蓋範圍位於獨立的 [`Plugin Prerelease`](#plugin-prerelease) 工作流程中，且只會從 [`Full Release Validation`](#full-release-validation) 或明確的手動派發執行。

## 管線概覽

| 工作                             | 用途                                                                                                                | 執行時機                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、變更範圍、變更的 extensions，並建置 CI manifest                                                    | 一律在非草稿推送與 PR 上執行      |
| `security-scm-fast`              | 透過 `zizmor` 偵測私密金鑰並稽核工作流程                                                                           | 一律在非草稿推送與 PR 上執行      |
| `security-dependency-audit`      | 對 npm advisories 執行不需依賴項目的 production lockfile 稽核                                                       | 一律在非草稿推送與 PR 上執行      |
| `security-fast`                  | 快速安全性工作的必要彙總                                                                                           | 一律在非草稿推送與 PR 上執行      |
| `check-dependencies`             | Production Knip 僅依賴項目檢查，加上未使用檔案 allowlist 保護                                                       | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、內建成品檢查，以及可重用的下游成品                                                       | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性執行線，例如 bundled、Plugin 合約、通訊協定檢查                                                   | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的通道合約檢查，並提供穩定的彙總檢查結果                                                                       | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，排除通道、bundled、合約與 extension 執行線                                                     | Node 相關變更                      |
| `check`                          | 分片的主要本機 gate 等效項目：prod types、lint、guards、test types，以及嚴格 smoke                                  | Node 相關變更                      |
| `check-additional`               | 架構、邊界、prompt snapshot drift、extension surface guards、package-boundary，以及 gateway-watch 分片              | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI smoke tests 與 startup-memory smoke                                                                      | Node 相關變更                      |
| `checks`                         | 已建置成品通道測試的驗證器                                                                                         | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 執行線                                                                                   | 發行用手動 CI 派發                 |
| `check-docs`                     | 文件格式、lint 與斷鏈檢查                                                                                          | 文件已變更                         |
| `skills-python`                  | Python-backed Skills 的 Ruff + pytest                                                                               | Python Skills 相關變更             |
| `checks-windows`                 | Windows 專用 process/path 測試，以及共享 runtime import specifier 回歸檢查                                          | Windows 相關變更                   |
| `macos-node`                     | 使用共享建置成品的 macOS TypeScript 測試執行線                                                                      | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、建置與測試                                                                                 | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                                           | Android 相關變更                   |
| `test-performance-agent`         | 受信任活動後的每日 Codex 慢速測試最佳化                                                                            | Main CI 成功或手動派發             |
| `openclaw-performance`           | 每日/隨選 Kova runtime 效能報告，包含 mock-provider、deep-profile 與 GPT 5.4 live 執行線                            | 排程與手動派發                     |

## Fail-fast 順序

1. `preflight` 會決定哪些執行線根本存在。`docs-scope` 與 `changed-scope` 邏輯是此工作內的步驟，不是獨立工作。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 與 `skills-python` 會快速失敗，不等待較重的成品與平台矩陣工作。
3. `build-artifacts` 會與快速 Linux 執行線重疊，讓下游消費者可在共享建置準備好後立即開始。
4. 較重的平台與 runtime 執行線隨後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 與 `android`。

當同一個 PR 或 `main` ref 上有較新的推送進來時，GitHub 可能會將被取代的工作標記為 `cancelled`。除非同一個 ref 的最新執行也失敗，否則應將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此仍會回報正常的分片失敗，但在整個工作流程已被取代後不會再排入佇列。自動 CI concurrency key 有版本標記（`CI-v7-*`），因此 GitHub 端舊佇列群組中的 zombie 不會無限期阻塞較新的 main 執行。手動 full-suite 執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動派發會略過 changed-scope 偵測，並讓 preflight manifest 的行為如同每個 scoped area 都已變更。

- **CI 工作流程編輯**會驗證 Node CI 圖形與工作流程 linting，但不會單獨強制 Windows、Android 或 macOS 原生建置；這些平台執行線仍限定於平台原始碼變更。
- **僅 CI 路由編輯、選定的廉價核心測試 fixture 編輯，以及狹窄的 Plugin 合約 helper/test-routing 編輯**會使用快速 Node-only manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` 任務。當變更僅限於該快速任務直接 exercised 的 routing 或 helper surface 時，該路徑會略過建置成品、Node 22 相容性、通道合約、完整 core 分片、bundled-Plugin 分片與額外 guard 矩陣。
- **Windows Node 檢查**限定於 Windows 專用 process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該執行線的 CI 工作流程 surface；無關的原始碼、Plugin、install-smoke 與僅測試變更會留在 Linux Node 執行線上。

最慢的 Node 測試系列會被拆分或平衡，讓每個工作維持小型而不過度保留 runner：通道合約以三個加權分片執行，小型 core unit 執行線成對配置，auto-reply 以四個平衡 worker 執行（reply subtree 會拆成 agent-runner、dispatch 與 commands/state-routing 分片），而 agentic gateway/Plugin config 會分散在既有的 source-only agentic Node 工作中，而不是等待建置成品。廣泛的 browser、QA、media 與 miscellaneous Plugin 測試會使用各自專用的 Vitest config，而不是共享 Plugin catch-all。Include-pattern 分片會使用 CI 分片名稱記錄 timing entries，因此 `.artifacts/vitest-shard-timings.json` 可區分整個 config 與 filtered shard。`check-additional` 會將 package-boundary compile/canary 工作放在一起，並將 runtime topology architecture 與 gateway watch coverage 分開；boundary guard 分片會在單一工作內並行執行其小型獨立 guards，包含 `pnpm prompt:snapshots:check`，因此 Codex runtime happy-path prompt drift 會被釘在造成它的 PR 上。Gateway watch、通道測試與 core support-boundary 分片會在 `dist/` 與 `dist-runtime/` 已建置完成後，於 `build-artifacts` 內並行執行。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test 執行線仍會使用 SMS/call-log BuildConfig flags 編譯該 flavor，同時避免在每次 Android 相關推送時重複執行 debug APK packaging 工作。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（production Knip 僅依賴項目檢查，釘選到最新 Knip 版本，並在 `dlx` install 時停用 pnpm 的 minimum release age）與 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file findings 與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未審查的未使用檔案或留下過時的 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的刻意 dynamic Plugin、generated、build、live-test 與 package bridge surfaces。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository activity 到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request code。該工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload 派發到 `openclaw/clawsweeper`。

該工作流程有四條執行線：

- `clawsweeper_item` 用於精確的 issue 與 pull request review requests；
- `clawsweeper_comment` 用於 issue comments 中明確的 ClawSweeper commands；
- `clawsweeper_commit_review` 用於 `main` pushes 上的 commit-level review requests；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub activity。

`github_activity` 執行線只會轉送正規化 metadata：event type、action、actor、repository、item number、URL、title、state，以及 comments 或 reviews 存在時的短 excerpt。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，會將正規化事件送到 ClawSweeper agent 的 OpenClaw Gateway hook。

一般活動是 observation，不是預設 delivery。ClawSweeper agent 會在其 prompt 中收到 Discord target，且只有當事件令人意外、可行動、有風險或具作業用途時，才應發佈到 `#clawsweeper`。例行開啟、編輯、bot churn、重複 webhook 雜訊與正常 review traffic 應產生 `NO_REPLY`。

在整條路徑中，請將 GitHub titles、comments、bodies、review text、branch names 與 commit messages 視為不受信任的資料。它們是 summarization 與 triage 的輸入，不是工作流程或 agent runtime 的指令。

## 手動派發

手動 CI dispatch 會執行與一般 CI 相同的工作圖，但會強制啟用每個非 Android 範圍的 lane：Linux Node 分片、bundled-plugin 分片、channel contract、Node 22 相容性、`check`、`check-additional`、build smoke、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI dispatch 只會在 `include_android=true` 時執行 Android；完整 release umbrella 會透過傳遞 `include_android=true` 啟用 Android。Plugin 預發布靜態檢查、僅限 release 的 `agentic-plugins` 分片、完整 extension 批次掃描，以及 Plugin 預發布 Docker lane 會從 CI 中排除。Docker 預發布套件只會在 `Full Release Validation` dispatch 已啟用 release-validation gate 的個別 `Plugin Prerelease` workflow 時執行。

手動執行會使用唯一的 concurrency group，因此 release candidate 的完整套件不會被同一 ref 上的另一個 push 或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫者針對分支、標籤或完整 commit SHA 執行該工作圖，同時使用所選 dispatch ref 中的 workflow 檔案。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                           | 工作                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性工作與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 檢查、分片 channel contract 檢查、除了 lint 以外的 `check` 分片、`check-additional` 分片與彙總、Node test aggregate verifier、文件檢查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith 矩陣可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低權重的 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node test 分片、bundled Plugin test 分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 足夠敏感，以至於 8 vCPU 的成本高於節省的成本）；install-smoke Docker 建置（32-vCPU 排隊時間成本高於節省的成本）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw 效能

`OpenClaw Performance` 是 product/runtime 效能 workflow。它每天在 `main` 上執行，也可以手動 dispatch：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

此 workflow 會從 pinned release 安裝 OCM，並從 pinned `kova_ref` 輸入安裝 Kova，然後執行三個 lane：

- `mock-provider`：針對 local-build runtime 執行 Kova diagnostic scenarios，並使用 deterministic fake OpenAI-compatible auth。
- `mock-deep-profile`：針對啟動、Gateway 和 agent-turn 熱點進行 CPU/heap/trace profiling。
- `live-gpt54`：真實的 OpenAI `openai/gpt-5.4` agent turn，當 `OPENAI_API_KEY` 不可用時略過。

mock-provider lane 也會在 Kova pass 後執行 OpenClaw 原生 source probe：default、hook 和 50-Plugin 啟動案例中的 Gateway boot timing 與記憶體；重複的 mock-OpenAI `channel-chat-baseline` hello loop；以及針對已啟動 Gateway 的 CLI 啟動命令。source probe Markdown 摘要位於 report bundle 的 `source/index.md`，原始 JSON 則在旁邊。

每個 lane 都會上傳 GitHub artifact。設定 `CLAWGRIT_REPORTS_TOKEN` 時，workflow 也會將 `report.json`、`report.md`、bundle、`index.md` 和 source-probe artifact commit 到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` 底下。目前的分支指標會寫入為 `openclaw-performance/<ref>/latest-<lane>.json`。

## 完整 Release Validation

`Full Release Validation` 是用於「release 前執行所有項目」的手動 umbrella workflow。它接受分支、標籤或完整 commit SHA，使用該 target dispatch 手動 `CI` workflow，dispatch `Plugin Prerelease` 以提供僅限 release 的 Plugin/package/static/Docker proof，並 dispatch `OpenClaw Release Checks` 以執行 install smoke、package acceptance、Docker release-path suite、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram lane。搭配 `rerun_group=all` 和 `release_profile=full` 時，它也會針對 release checks 產生的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳入 `npm_telegram_package_spec` 可針對已發布的 npm package 重新執行同一個 Telegram package lane。

請參閱[完整 release validation](/zh-TW/reference/full-release-validation)，了解 stage matrix、精確的 workflow job 名稱、profile 差異、artifact，以及聚焦 rerun handle。

`OpenClaw Release Publish` 是會變更狀態的手動 release workflow。在 release tag 存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.D` 或 `main` dispatch 它。它會驗證 `pnpm plugins:sync:check`，針對所有可發布的 Plugin package dispatch `Plugin NPM Release`，針對同一個 release SHA dispatch `Plugin ClawHub Release`，然後才用已儲存的 `preflight_run_id` dispatch `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得 pinned commit proof，請使用 helper，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref 必須是分支或標籤，不能是原始 commit SHA。helper 會在 target SHA 上推送暫時的 `release-ci/<sha>-...` 分支，從該 pinned ref dispatch `Full Release Validation`，驗證每個 child workflow 的 `headSha` 都符合 target，並在執行完成後刪除暫時分支。如果任何 child workflow 在不同的 SHA 上執行，umbrella verifier 也會失敗。

`release_profile` 會控制傳入 release checks 的 live/provider 廣度。手動 release workflow 預設為 `stable`；只有在你有意需要廣泛的 advisory provider/media matrix 時才使用 `full`。

- `minimum` 保留最快的 OpenAI/core release-critical lane。
- `stable` 加入 stable provider/backend set。
- `full` 執行廣泛的 advisory provider/media matrix。

umbrella 會記錄 dispatch 的 child run id，最終的 `Verify full validation` job 會重新檢查目前 child run 的 conclusion，並為每個 child run 附加最慢 job 表格。如果 child workflow 被重新執行並轉為綠燈，只需重新執行 parent verifier job，即可更新 umbrella result 與 timing summary。

若要復原，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。針對發布候選版本使用 `all`，只針對一般完整 CI 子工作使用 `ci`，只針對 Plugin 預發行子工作使用 `plugin-prerelease`，針對每個發布子工作使用 `release-checks`，或在 umbrella 上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會讓聚焦修正後重新執行失敗的發布 box 時保持範圍受限。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將所選 ref 解析一次成 `release-package-under-test` tarball，然後將該成品傳給 live/E2E 發布路徑 Docker 工作流程和套件驗收分片。這會讓發布 box 之間的套件位元組保持一致，並避免在多個子工作中重新打包同一個候選版本。

針對 `ref=main` 與 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的 umbrella。父監控器在父工作被取消時，會取消任何已分派的子工作流程，因此較新的 main 驗證不會卡在過期的兩小時 release-check 執行後面。發布分支/標籤驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## Live 與 E2E 分片

發布 live/E2E 子工作保留廣泛的原生 `pnpm test:live` 覆蓋範圍，但會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是單一序列工作：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 依 provider 篩選的 `native-live-src-gateway-profiles` 工作
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒體音訊/影片分片，以及依 provider 篩選的音樂分片

這會保持相同的檔案覆蓋範圍，同時讓緩慢的 live provider 失敗更容易重新執行和診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live 媒體分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 與 `ffprobe`；媒體工作只會在設定前驗證二進位檔。將 Docker 支援的 live 套件保留在一般 Blacksmith runner 上；容器工作不是啟動巢狀 Docker 測試的正確位置。

Docker 支援的 live 模型/後端分片會為每個所選 commit 使用個別共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。live 發布工作流程會建置並推送該映像一次，然後 Docker live 模型、provider 分片 Gateway、CLI 後端、ACP 綁定與 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片帶有明確的腳本層級 `timeout` 上限，低於工作流程工作逾時，因此卡住的容器或清理路徑會快速失敗，而不是消耗整個 release-check 預算。如果這些分片各自重新建置完整來源 Docker target，則發布執行設定錯誤，會在重複映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證來源樹，而套件驗收會透過使用者安裝或更新後會執行的相同 Docker E2E harness，驗證單一 tarball。

### 工作

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選版本、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 與 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 與 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball inventory、在需要時準備 package-digest Docker 映像，並針對該套件執行所選 Docker lane，而不是打包工作流程 checkout。當 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件與共用映像一次，然後將這些 lane 展開為平行的目標 Docker 工作，並使用唯一成品。
3. `package_telegram` 可選擇呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，並在 Package Acceptance 已解析套件時安裝相同的 `package-under-test` 成品；獨立 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker 驗收或選用 Telegram lane 失敗時讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest` 或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。將此用於已發布的預發行/穩定驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整 commit SHA。解析器會擷取 OpenClaw 分支/標籤，驗證所選 commit 可從儲存庫分支歷史或發布標籤到達，在 detached worktree 中安裝相依項，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 與 `artifact_name` 下載一個 `.tgz`；`package_sha256` 是選用，但應為外部共享成品提供。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是 `source=ref` 時會被打包的來源 commit。這讓目前的測試 harness 能驗證較舊的受信任來源 commit，而不執行舊的工作流程邏輯。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` profile 使用離線 Plugin 覆蓋範圍，因此已發布套件驗證不會受 live ClawHub 可用性限制。選用 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm spec 路徑供獨立 dispatch 使用。

如需專用的更新與 Plugin 測試政策，包括本機命令、Docker lane、Package Acceptance 輸入、發布預設值與失敗分診，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、已準備的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 與 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這會讓套件遷移、更新、過期 Plugin 相依項清理、已設定 Plugin 安裝修復、離線 Plugin、Plugin 更新與 Telegram 證明使用同一個已解析的套件 tarball。設定 Full Release Validation 或 OpenClaw Release Checks 上的 `package_acceptance_package_spec`，即可針對已發布 npm 套件而非 SHA 建置成品執行相同矩陣。跨 OS 發布檢查仍涵蓋 OS 專屬的 onboarding、安裝程式與平台行為；套件/更新產品驗證應從 Package Acceptance 開始。`published-upgrade-survivor` Docker lane 每次執行會驗證一個已發布套件基準線。在 Package Acceptance 中，已解析的 `package-under-test` tarball 一律是候選版本，而 `published_upgrade_survivor_baseline` 選取 fallback 已發布基準線，預設為 `openclaw@latest`；失敗 lane 重新執行命令會保留該基準線。設定 `published_upgrade_survivor_baselines=all-since-2026.4.23`，即可將 Full Release CI 擴展到從 `2026.4.23` 到 `latest` 的每個穩定 npm 發布；`release-history` 仍可用於以較舊日期前錨點進行手動更廣泛取樣。設定 `published_upgrade_survivor_scenarios=reported-issues`，即可將相同基準線擴展到針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、波浪號記錄路徑與過期舊版 Plugin 相依項根目錄的 issue 形狀 fixture。當問題是完整的已發布更新清理，而不是一般 Full Release CI 廣度時，個別的 `Update Migration` 工作流程會搭配 `all-since-2026.4.23` 與 `plugin-deps-cleanup` 使用 `update-migration` Docker lane。本機彙總執行可以透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 spec，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以執行情境矩陣。已發布 lane 會以內建的 `openclaw config set` 命令 recipe 設定基準線，在 `summary.json` 中記錄 recipe 步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 以及 RPC 狀態。Windows packaged 與 installer fresh lane 也會驗證已安裝套件可以從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 在設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因此安裝與 Gateway 證明會停留在 GPT-5 測試模型上，同時避免 GPT-4.x 預設值。

### 舊版相容性窗口

Package Acceptance 對已發布套件具有有界的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可能指向 tarball 省略的檔案；
- 當套件未公開該 flag 時，`doctor-switch` 可略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的 fake git fixture 修剪缺少的 `pnpm.patchedDependencies`，並可記錄缺少持久化的 `update.channel`；
- Plugin smoke 可讀取舊版 install-record 位置，或接受缺少 marketplace install-record 持久化；
- `plugin-update` 可允許 config metadata 遷移，同時仍要求 install record 與不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可針對已出貨的本機建置 metadata stamp 檔案發出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時，以及重新執行命令。請優先重新執行失敗的套件設定檔或精確的 Docker lane，而不是重新執行完整發行驗證。

## 安裝煙霧測試

獨立的 `Install Smoke` workflow 會透過自己的 `preflight` job 重用相同的範圍腳本。它將煙霧測試覆蓋範圍分成 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/套件表面、綑綁 Plugin 套件/manifest 變更，或 Docker 煙霧測試 job 會涵蓋的核心 Plugin/channel/gateway/Plugin SDK 表面的 pull request 執行。僅來源的綑綁 Plugin 變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI 煙霧測試、執行容器 gateway-network e2e、驗證綑綁 extension 建置參數，並在 240 秒彙總命令逾時內執行受限的綑綁 Plugin Docker 設定檔（每個情境的 Docker run 另行加上上限）。
- **完整路徑**會保留 QR 套件安裝和安裝程式 Docker/update 覆蓋範圍，供每晚排程執行、手動 dispatch、workflow-call 發行檢查，以及真正觸及安裝程式/套件/Docker 表面的 pull request 使用。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 煙霧測試映像，然後將 QR 套件安裝、根 Dockerfile/gateway 煙霧測試、安裝程式/update 煙霧測試，以及快速綑綁 Plugin Docker E2E 作為個別 job 執行，讓安裝程式工作不必排在根映像煙霧測試之後。

`main` push（包含 merge commit）不會強制使用完整路徑；當變更範圍邏輯會在 push 上要求完整覆蓋範圍時，workflow 會保留快速 Docker 煙霧測試，並將完整安裝煙霧測試留給每晚或發行驗證。

較慢的 Bun 全域安裝 image-provider 煙霧測試由 `run_bun_global_install_smoke` 另行控管。它會在每晚排程和 release checks workflow 中執行，且手動 `Install Smoke` dispatch 可以選擇加入，但 pull request 和 `main` push 不會執行。QR 和安裝程式 Docker 測試保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共享 live-test 映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共享的 `scripts/e2e/Dockerfile` 映像：

- 一個供安裝程式/update/Plugin 相依 lane 使用的裸 Node/Git runner；
- 一個功能映像，會將相同 tarball 安裝到 `/app`，供一般功能 lane 使用。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的計畫。scheduler 會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 依 lane 選擇映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主集區 slot 數量。                                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Provider 敏感 tail-pool slot 數量。                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider 節流。                                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行多服務 lane 上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，用於避免 Docker daemon create 風暴；設定 `0` 表示不錯開。           |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的備援逾時（120 分鐘）；選定的 live/tail lane 使用更嚴格的上限。                   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定  | `1` 會列印 scheduler 計畫而不執行 lane。                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定  | 以逗號分隔的精確 lane 清單；略過清理煙霧測試，讓 agent 能重現單一失敗 lane。                 |

比有效上限更重的 lane 仍可從空集區啟動，然後獨自執行直到釋放容量。本機彙總流程會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、輸出 active-lane 狀態、保存 lane 計時以便最長優先排序，且預設會在第一次失敗後停止排程新的 pooled lane。

### 可重用的 live/E2E workflow

可重用的 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、lane 和憑證覆蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換成 GitHub 輸出和摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball 清單；在計畫需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` input 或既有的套件 digest 映像，而不是重新建置。Docker 映像 pull 會使用受限的每次嘗試 180 秒逾時重試，讓卡住的 registry/cache stream 能快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發行路徑分塊

發行 Docker 覆蓋範圍會以較小的 chunked job 搭配 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行，讓每個 chunk 只 pull 它需要的映像種類，並透過相同的加權 scheduler 執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker chunk 為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總 Plugin/runtime alias。`install-e2e` lane alias 仍是兩個 provider 安裝程式 lane 的彙總手動重新執行 alias。

當完整 release-path 覆蓋範圍要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，並且只在 OpenWebUI-only dispatch 時保留獨立的 `openwebui` chunk。綑綁 channel update lane 會針對暫時性 npm 網路失敗重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、計時、`summary.json`、`failures.json`、階段計時、scheduler plan JSON、slow-lane 表格，以及每個 lane 的重新執行命令。workflow 的 `docker_lanes` input 會針對已準備的映像執行選取的 lane，而不是 chunk job，這會將失敗 lane 偵錯限制在一個目標 Docker job 中，並為該次執行準備、下載或重用套件成品；如果選取的 lane 是 live Docker lane，目標 job 會在本機為該次重新執行建置 live-test 映像。產生的每個 lane GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備的映像 input，因此失敗的 lane 可以重用失敗執行中的精確套件和映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E workflow 會每天執行完整的 release-path Docker suite。

## Plugin 預先發布

`Plugin Prerelease` 是成本較高的產品/套件覆蓋範圍，因此是由 `Full Release Validation` 或明確的操作人員 dispatch 的獨立 workflow。一般 pull request、`main` push，以及獨立的手動 CI dispatch 都會關閉該 suite。它會將綑綁 Plugin 測試平衡分配到八個 extension worker；這些 extension shard job 一次最多執行兩個 Plugin config group，每個 group 使用一個 Vitest worker 和較大的 Node heap，讓匯入量大的 Plugin 批次不會建立額外的 CI job。僅發行的 Docker 預先發布路徑會以小群組批次執行目標 Docker lane，以避免為一到三分鐘的 job 保留數十個 runner。

## QA Lab

QA Lab 在主要智慧範圍 workflow 之外有專用 CI lane。Agentic parity 巢狀於廣泛的 QA 和發行 harness 下，而不是獨立的 PR workflow。當 parity 應隨廣泛驗證執行一起進行時，請使用 `Full Release Validation` 並指定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 會每晚在 `main` 上執行，也可手動 dispatch；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lane 展開為平行 job。Live job 使用 `qa-live-shared` environment，而 Telegram/Discord 使用 Convex lease。

Release checks 會使用 deterministic mock provider 和 mock-qualified model（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram live transport lane，因此 channel contract 會與 live model latency 和一般 provider-plugin startup 隔離。live transport gateway 會停用 memory search，因為 QA parity 會另行涵蓋 memory 行為；provider 連線能力由獨立的 live model、native provider 和 Docker provider suite 涵蓋。

Matrix 會針對排程與發行 gate 使用 `--profile fast`，只有在 checked-out CLI 支援時才加入 `--fail-fast`。CLI 預設值和手動 workflow input 仍為 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix 覆蓋範圍分片成 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` job。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab lane；其 QA parity gate 會將 candidate 和 baseline pack 作為平行 lane job 執行，然後將兩個成品下載到小型 report job 中，進行最終 parity 比較。

對一般 PR，請遵循 scoped CI/check 證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意設計為範圍狹窄的第一輪安全掃描器，而不是完整的儲存庫掃描。每日、手動，以及非草稿拉取請求防護執行會掃描 Actions 工作流程程式碼，以及風險最高的 JavaScript/TypeScript 表面，並使用篩選到高/嚴重 `security-severity` 的高可信度安全查詢。

拉取請求防護維持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下的變更啟動，並執行與排程工作流程相同的高可信度安全矩陣。Android 與 macOS CodeQL 不列入 PR 預設值。

### 安全類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、秘密、沙箱、Cron 與 Gateway 基準                                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，加上通道 Plugin 執行階段、Gateway、Plugin SDK、秘密、稽核接觸點                                                   |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 剖析、網路防護、web-fetch，以及 Plugin SDK SSRF 政策表面                                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞，以及代理工具執行閘門                                                                        |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、載入器、清單、登錄、套件管理器安裝、來源載入，以及 Plugin SDK 套件合約信任表面                                         |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。會在工作流程健全性接受的最小 Blacksmith Linux 執行器上，手動建置 Android 應用程式以供 CodeQL 使用。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動的 macOS 安全分片。會在 Blacksmith macOS 上手動建置 macOS 應用程式以供 CodeQL 使用，從上傳的 SARIF 中篩除相依性建置結果，並上傳至 `/codeql-critical-security/macos`。由於 macOS 建置即使乾淨也主導執行時間，因此保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是相對應的非安全分片。它只會在較小的 Blacksmith Linux 執行器上，針對狹窄的高價值表面執行錯誤嚴重性、非安全的 JavaScript/TypeScript 品質查詢。它的拉取請求防護刻意小於排程設定檔：非草稿 PR 只會針對代理命令/模型/工具執行與回覆分派程式碼、設定結構描述/遷移/IO 程式碼、驗證/秘密/沙箱/安全程式碼、核心通道與內建通道 Plugin 執行階段、Gateway 協定/伺服器方法、記憶體執行階段/SDK 膠合層、MCP/程序/對外傳遞、提供者執行階段/模型目錄、工作階段診斷/傳遞佇列、Plugin 載入器、Plugin SDK/套件合約，或 Plugin SDK 回覆執行階段變更，執行相對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 與 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動分派接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

窄設定檔是用於單獨執行一個品質分片的教學/迭代掛鉤。

| 類別                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、秘密、沙箱、Cron 與 Gateway 安全邊界程式碼                                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化與 IO 合約                                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 協定結構描述與伺服器方法合約                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與內建通道 Plugin 實作合約                                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及對外傳遞合約                                                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段外觀、記憶體 Plugin SDK 別名、記憶體執行階段啟用膠合層，以及記憶體 doctor 命令                                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞輔助工具、診斷事件/記錄套件表面，以及工作階段 doctor CLI 合約                                               |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆分派、回覆承載/分塊/執行階段輔助工具、通道回覆選項、傳遞佇列，以及工作階段/執行緒繫結輔助工具                                                |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值/目錄，以及網頁/搜尋/擷取/嵌入登錄                                                            |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動程序、本機持久化、Gateway 控制流程，以及任務控制平面執行階段合約                                                                                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取/搜尋、媒體 IO、媒體理解、影像產生，以及媒體產生執行階段合約                                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公開表面，以及 Plugin SDK 進入點合約                                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 來源與 Plugin 套件合約輔助工具                                                                                                           |

品質與安全分開，讓品質發現可以在不遮蔽安全訊號的情況下排程、量測、停用或擴充。Swift、Python 與內建 Plugin 的 CodeQL 擴充，應只在窄設定檔具有穩定執行時間與訊號後，作為有範圍或分片的後續工作加回。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是事件驅動的 Codex 維護通道，用於讓現有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot 推送 CI 執行可以觸發它，也可以透過手動分派直接執行。當 `main` 已推進，或過去一小時內已建立另一個未略過的 Docs Agent 執行時，工作流程執行叫用會略過。執行時，它會審查從上一個未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護通道，用於慢速測試。它沒有純排程：`main` 上成功的非 bot 推送 CI 執行可以觸發它，但如果同一個 UTC 日已有另一個工作流程執行叫用已執行或正在執行，它會略過。手動分派會繞過該每日活動閘門。此通道會建立完整套件分組的 Vitest 效能報告，讓 Codex 只進行保留覆蓋率的小型測試效能修正，而不是大型重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，而代理之後的完整套件報告必須通過後才會提交任何內容。當 `main` 在 bot 推送落地前推進時，此通道會 rebase 已驗證的修補、重新執行 `pnpm check:changed`，並重試推送；有衝突的過期修補會略過。它使用 GitHub 託管的 Ubuntu，讓 Codex action 可以維持與文件代理相同的 drop-sudo 安全態勢。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是供維護者在落地後清理重複項目的手動工作流程。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 前，它會驗證落地 PR 已合併，且每個重複項目都有共享的參照議題或重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機變更通道邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門在架構邊界上比廣泛的 CI 平台範圍更嚴格：

- 核心生產變更會執行核心 prod 與核心 test 型別檢查，加上核心 lint/guard；
- 僅核心測試的變更只會執行核心 test 型別檢查，加上核心 lint；
- 擴充生產變更會執行擴充 prod 與擴充 test 型別檢查，加上擴充 lint；
- 僅擴充測試的變更會執行擴充 test 型別檢查，加上擴充 lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴展到擴充型別檢查，因為擴充依賴那些核心合約（Vitest 擴充掃描仍然是明確的測試工作）；
- 僅發布中繼資料的版本升級會執行目標版本/設定/根相依性檢查；
- 未知的根目錄/設定變更會安全失敗到所有檢查通道。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，來源編輯會優先使用明確映射，接著是同層測試與匯入圖相依項。共享群組房間傳遞設定是明確映射之一：對群組可見回覆設定、來源回覆傳遞模式，或訊息工具系統提示的變更，會透過核心回覆測試加上 Discord 與 Slack 傳遞回歸測試路由，讓共享預設值變更在第一次 PR 推送前就失敗。只有當變更足夠涵蓋整個測試框架，使便宜的映射集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從儲存庫根目錄執行 Testbox，且進行廣泛驗證時優先使用全新預熱的 box。在把耗時檢查關卡用於重複使用、已過期，或剛回報非預期大型同步的 box 之前，請先在該 box 內執行 `pnpm testbox:sanity`。

當必要的根目錄檔案如 `pnpm-lock.yaml` 消失，或 `git status --short` 顯示至少 200 個已追蹤刪除項目時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；請停止該 box 並改為預熱新的 box，而不是偵錯產品測試失敗。對於刻意大量刪除的 PR，請為該次健全性執行設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該保護；若本機差異異常龐大，則可使用較大的毫秒值。

當 Blacksmith 無法使用，或偏好使用自有雲端容量時，Crabbox 是儲存庫自有的第二條遠端 box Linux 驗證路徑。預熱一個 box，透過專案工作流程補齊其環境，接著透過 Crabbox CLI 執行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 管理提供者、同步與 GitHub Actions 環境補齊預設值。它會排除本機 `.git`，讓已補齊環境的 Actions checkout 保留自己的遠端 Git 中繼資料，而不是同步維護者本機的遠端與物件儲存；也會排除不應被傳輸的本機執行階段與建置成品。`.github/workflows/crabbox-hydrate.yml` 管理 checkout、Node/pnpm 設定、`origin/main` 擷取，以及後續 `crabbox run --id <cbx_id>` 命令會載入的非祕密環境交接。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
