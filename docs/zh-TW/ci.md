---
read_when:
    - 您需要了解某個 CI 作業為什麼有執行或沒有執行。
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 您正在協調一次發布驗證執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉發
summary: CI 作業圖、範圍閘門、發行總括流程與本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-04T07:03:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 上執行。`preflight` 工作會分類差異，並在只有不相關區域變更時關閉昂貴的 lane。手動 `workflow_dispatch` 執行會刻意略過智慧範圍限定，並為候選發行版本與廣泛驗證展開完整圖形。Android lane 透過 `include_android` 保持選擇性啟用。僅限發行的 Plugin 覆蓋位於獨立的 [`Plugin 預先發行`](#plugin-prerelease) 工作流程中，且只會從 [`完整發行驗證`](#full-release-validation) 或明確的手動觸發執行。

## 管線概覽

| 工作                             | 目的                                                                                                      | 執行時機                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、已變更範圍、已變更 extension，並建置 CI manifest                                         | 一律在非草稿推送與 PR 上執行       |
| `security-scm-fast`              | 透過 `zizmor` 進行私鑰偵測與工作流程稽核                                                                 | 一律在非草稿推送與 PR 上執行       |
| `security-dependency-audit`      | 針對 npm advisories 執行不需相依套件的 production lockfile 稽核                                           | 一律在非草稿推送與 PR 上執行       |
| `security-fast`                  | 快速安全性工作的必要彙總                                                                                  | 一律在非草稿推送與 PR 上執行       |
| `check-dependencies`             | Production Knip 僅相依套件檢查，加上未使用檔案允許清單防護                                               | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置成品檢查，以及可重用的下游成品                                           | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性 lane，例如 bundled/plugin-contract/protocol 檢查                                        | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的 channel contract 檢查，並提供穩定的彙總檢查結果                                                   | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，不包含 channel、bundled、contract 與 extension lane                                  | Node 相關變更                      |
| `check`                          | 分片的主要本機 gate 等價項：prod types、lint、guards、test types，以及嚴格 smoke                         | Node 相關變更                      |
| `check-additional`               | 架構、分片的 boundary/prompt drift、extension guards、package boundary，以及 gateway watch                | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI smoke 測試與 startup-memory smoke                                                             | Node 相關變更                      |
| `checks`                         | 已建置成品 channel 測試的驗證器                                                                          | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke lane                                                                          | 發行用手動 CI 觸發                 |
| `check-docs`                     | 文件格式、lint 與 broken-link 檢查                                                                       | 文件已變更                         |
| `skills-python`                  | Python 支援的 skills 的 Ruff + pytest                                                                    | Python skill 相關變更              |
| `checks-windows`                 | Windows 特定 process/path 測試，加上共用 runtime import specifier regression                             | Windows 相關變更                   |
| `macos-node`                     | 使用共用已建置成品的 macOS TypeScript 測試 lane                                                          | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、build 與測試                                                                    | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android unit tests，加上一個 debug APK build                                              | Android 相關變更                   |
| `test-performance-agent`         | 受信任活動後每日 Codex 慢速測試最佳化                                                                    | Main CI 成功或手動觸發             |
| `openclaw-performance`           | 每日/隨需 Kova runtime 效能報告，包含 mock-provider、deep-profile 與 GPT 5.4 live lane                   | 排程與手動觸發                     |

## 快速失敗順序

1. `preflight` 決定哪些 lane 實際存在。`docs-scope` 與 `changed-scope` 邏輯是此工作內的步驟，不是獨立工作。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 與 `skills-python` 會快速失敗，而不等待較重的成品與平台矩陣工作。
3. `build-artifacts` 會與快速 Linux lane 重疊，讓下游消費者能在共用 build 準備好後立即開始。
4. 較重的平台與 runtime lane 會在之後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 與 `android`。

當較新的推送落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的工作標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此仍會回報正常的分片失敗，但不會在整個工作流程已被取代後繼續排隊。自動 CI 並行鍵已版本化（`CI-v7-*`），所以 GitHub 端舊佇列群組中的僵屍工作不會無限期阻塞較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit tests 覆蓋。手動觸發會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI 工作流程編輯**會驗證 Node CI 圖形與工作流程 linting，但本身不會強制 Windows、Android 或 macOS native builds；這些平台 lane 仍限定於平台原始碼變更。
- **CI 僅路由編輯、選定的廉價 core-test fixture 編輯，以及狹窄的 plugin contract helper/test-routing 編輯**會使用快速的僅 Node manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` 工作。當變更限於快速工作直接測試的 routing 或 helper surface 時，該路徑會略過 build artifacts、Node 22 compatibility、channel contracts、完整 core shards、bundled-plugin shards，以及 additional guard matrices。
- **Windows Node 檢查**限定於 Windows 特定 process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該 lane 的 CI workflow surfaces；不相關的 source、plugin、install-smoke 與 test-only 變更仍留在 Linux Node lane。

最慢的 Node 測試家族會被拆分或平衡，讓每個工作保持小型且不過度預留 runner：channel contracts 以三個加權分片執行，core unit fast/support lane 分開執行，core runtime infra 分拆為 state 與 process/config shard，auto-reply 以平衡 worker 執行（reply subtree 分拆為 agent-runner、dispatch 與 commands/state-routing shard），agentic gateway/server configs 則分拆到 chat/auth/model/http-plugin/runtime/startup lane，而不是等待 built artifacts。廣泛的 browser、QA、media 與 miscellaneous plugin 測試使用其專用 Vitest configs，而不是共用的 plugin catch-all。Include-pattern shards 會使用 CI shard name 記錄 timing entries，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 與 filtered shard。`check-additional` 將 package-boundary compile/canary 工作放在一起，並將 runtime topology architecture 與 gateway watch coverage 分開；boundary guard list 會橫向分散到四個 matrix shard，每個 shard 會並行執行選定的獨立 guards，並列印每個檢查的 timing，包括 `pnpm prompt:snapshots:check`，因此 Codex runtime happy-path prompt drift 會被釘選到造成它的 PR。Gateway watch、channel tests 與 core support-boundary shard 會在 `dist/` 與 `dist-runtime/` 已建置完成後，在 `build-artifacts` 內並行執行。

Android CI 會執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，接著建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test lane 仍會使用 SMS/call-log BuildConfig flags 編譯該 flavor，同時避免在每個 Android 相關推送上執行重複的 debug APK packaging 工作。

`check-dependencies` shard 會執行 `pnpm deadcode:dependencies`（production Knip 僅相依套件檢查，釘選到最新 Knip 版本，且為 `dlx` 安裝停用 pnpm 的 minimum release age）與 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file findings 與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未審查的未使用檔案，或留下過時的 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的刻意 dynamic plugin、generated、build、live-test 與 package bridge surfaces。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository activity 到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request code。此 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，接著將精簡的 `repository_dispatch` payloads dispatch 到 `openclaw/clawsweeper`。

此 workflow 有四個 lane：

- `clawsweeper_item` 用於精確的 issue 與 pull request review requests；
- `clawsweeper_comment` 用於 issue comments 中的明確 ClawSweeper commands；
- `clawsweeper_commit_review` 用於 `main` pushes 上的 commit-level review requests；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub activity。

`github_activity` lane 只會轉送正規化 metadata：event type、action、actor、repository、item number、URL、title、state，以及存在時的 comments 或 reviews 短摘錄。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，會將正規化 event 發布到 OpenClaw Gateway hook，供 ClawSweeper agent 使用。

一般 activity 是觀察，而非預設投遞。ClawSweeper agent 會在其 prompt 中收到 Discord target，且只有在事件令人意外、可行、有風險或對營運有用時，才應發布到 `#clawsweeper`。例行 opens、edits、bot churn、duplicate webhook noise 與一般 review traffic 應產生 `NO_REPLY`。

在整個路徑中，請將 GitHub titles、comments、bodies、review text、branch names 與 commit messages 視為不受信任的資料。它們是 summarization 與 triage 的輸入，不是 workflow 或 agent runtime 的指令。

## 手動觸發

手動 CI 派送會執行與一般 CI 相同的工作圖，但會強制啟用每個非 Android 範圍的通道：Linux Node 分片、 bundled-Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置 smoke、文件檢查、Python Skills、Windows、macOS，以及 Control UI i18n。獨立手動 CI 派送只會在 `include_android=true` 時執行 Android；完整發行總控流程會透過傳遞 `include_android=true` 啟用 Android。Plugin 預發行靜態檢查、僅限發行的 `agentic-plugins` 分片、完整擴充功能批次掃描，以及 Plugin 預發行 Docker 通道會排除在 CI 之外。Docker 預發行套件只會在 `Full Release Validation` 派送已啟用發行驗證 gate 的獨立 `Plugin Prerelease` 工作流程時執行。

手動執行會使用唯一的並行群組，因此發行候選完整套件不會被同一個 ref 上的其他 push 或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫端針對分支、標籤或完整 commit SHA 執行該圖，同時使用所選派送 ref 的工作流程檔案。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                           | 工作                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性工作與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速協定/合約/bundled 檢查、分片通道合約檢查、除 lint 外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith 矩陣可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低權重的擴充功能分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、bundled Plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 足夠敏感，8 vCPU 的成本高於節省的時間）；install-smoke Docker 建置（32-vCPU 排隊時間的成本高於節省的時間）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本機對等項目

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

`OpenClaw Performance` 是產品/執行階段效能工作流程。它每天在 `main` 上執行，也可以手動派送：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動派送通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對發行標籤或其他分支進行基準測試。已發布的報告路徑與最新指標會依受測 ref 建立索引，而每個 `index.md` 都會記錄受測 ref/SHA、工作流程 ref/SHA、Kova ref、設定檔、通道驗證模式、模型、重複次數，以及情境篩選器。

工作流程會從釘選的發行版本安裝 OCM，並從 `openclaw/Kova` 的釘選 `kova_ref` 輸入安裝 Kova，接著執行三個通道：

- `mock-provider`：使用確定性的假 OpenAI 相容驗證，針對本機建置執行階段執行 Kova 診斷情境。
- `mock-deep-profile`：針對啟動、Gateway 和 agent-turn 熱點進行 CPU/heap/trace profiling。
- `live-gpt54`：真實的 OpenAI `openai/gpt-5.4` agent turn，當 `OPENAI_API_KEY` 無法使用時會跳過。

mock-provider 通道也會在 Kova pass 之後執行 OpenClaw 原生原始碼探針：預設、hook 和 50-Plugin 啟動案例中的 Gateway 啟動時間與記憶體；重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈；以及針對已啟動 Gateway 的 CLI 啟動命令。原始碼探針 Markdown 摘要位於報告 bundle 的 `source/index.md`，旁邊附有原始 JSON。

每個通道都會上傳 GitHub artifacts。設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、bundles、`index.md` 和原始碼探針 artifacts 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 底下。目前受測 ref 指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發行驗證

`Full Release Validation` 是用於「發行前執行所有項目」的手動總控工作流程。它接受分支、標籤或完整 commit SHA，使用該目標派送手動 `CI` 工作流程，派送 `Plugin Prerelease` 以取得僅限發行的 Plugin/package/static/Docker 證明，並派送 `OpenClaw Release Checks` 以執行 install smoke、package acceptance、Docker release-path 套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。使用 `rerun_group=all` 和 `release_profile=full` 時，它也會針對 release checks 的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳遞 `npm_telegram_package_spec` 可針對已發布的 npm package 重新執行相同的 Telegram package 通道。

請參閱 [完整發行驗證](/zh-TW/reference/full-release-validation)，了解
階段矩陣、精確的工作流程工作名稱、設定檔差異、artifacts，以及
聚焦重新執行控制代碼。

`OpenClaw Release Publish` 是會進行變更的手動發行工作流程。在發行標籤存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.D` 或 `main` 派送它。它會驗證 `pnpm plugins:sync:check`，針對所有可發布的 Plugin packages 派送 `Plugin NPM Release`，針對相同發行 SHA 派送 `Plugin ClawHub Release`，然後才會使用已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速移動的分支上取得釘選 commit 證明，請使用 helper，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程派送 ref 必須是分支或標籤，不能是原始 commit SHA。此
helper 會在目標 SHA 推送暫時的 `release-ci/<sha>-...` 分支，
從該釘選 ref 派送 `Full Release Validation`，驗證每個子
工作流程的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。如果任何子工作流程在
不同的 SHA 上執行，總控驗證器也會失敗。

`release_profile` 控制傳遞給 release 檢查的 live/提供者涵蓋範圍。手動 release workflow 預設為 `stable`；只有在你刻意想要廣泛的 advisory 提供者/媒體矩陣時，才使用 `full`。

- `minimum` 保留最快的 OpenAI/核心 release 關鍵 lane。
- `stable` 加入穩定的提供者/後端集合。
- `full` 執行廣泛的 advisory 提供者/媒體矩陣。

umbrella 會記錄已派發的子執行 ID，而最後的 `Verify full validation` job 會重新檢查目前子執行的結論，並為每個子執行附加最慢 job 表格。如果某個子 workflow 重新執行後轉綠，只需重新執行父層 verifier job，就能刷新 umbrella 結果與時間摘要。

針對復原，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。release candidate 使用 `all`，只要一般完整 CI 子項使用 `ci`，只要 Plugin prerelease 子項使用 `plugin-prerelease`，每個 release 子項使用 `release-checks`，或在 umbrella 上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能讓失敗的 release box 在聚焦修正後，重新執行的範圍保持有界。

`OpenClaw Release Checks` 使用受信任的 workflow ref，將選定 ref 解析一次為 `release-package-under-test` tarball，然後把該 artifact 傳給 live/E2E release-path Docker workflow 與 package acceptance shard。這能讓 package 位元組在各個 release box 之間保持一致，並避免在多個子 job 中重新打包同一個候選項。

`ref=main` 與 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的 umbrella。當父層被取消時，父層 monitor 會取消任何它已派發的子 workflow，因此較新的 main validation 不會卡在過時的兩小時 release-check 執行後面。Release branch/tag validation 與聚焦 rerun group 會保留 `cancel-in-progress: false`。

## Live 與 E2E 分片

release live/E2E 子項保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但它會透過 `scripts/test-live-shard.mjs` 以命名分片執行，而不是一個序列 job：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 提供者篩選的 `native-live-src-gateway-profiles` job
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的媒體音訊/影片分片與提供者篩選的音樂分片

這會保留相同的檔案涵蓋範圍，同時讓緩慢的 live 提供者失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live 媒體分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` workflow 建置。該映像預先安裝 `ffmpeg` 與 `ffprobe`；媒體 job 只會在設定前驗證這些 binary。讓 Docker 支援的 live suite 保持在一般 Blacksmith runner 上執行；container job 不是啟動巢狀 Docker 測試的正確位置。

Docker 支援的 live model/後端分片會針對每個選定 commit 使用獨立共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。live release workflow 會建置並推送該映像一次，然後 Docker live model、提供者分片的 Gateway、CLI 後端、ACP bind 與 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片在 script 層級帶有明確的 `timeout` 上限，低於 workflow job timeout，因此卡住的 container 或 cleanup path 會快速失敗，而不是耗盡整個 release-check 預算。如果這些分片各自重新建置完整 source Docker target，表示 release 執行設定錯誤，會把 wall clock 浪費在重複的映像建置上。

## Package Acceptance

當問題是「這個可安裝的 OpenClaw package 是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證 source tree，而 package acceptance 會透過使用者在安裝或更新後會執行的同一套 Docker E2E harness，驗證單一 tarball。

### Job

1. `resolve_package` 會 checkout `workflow_ref`、解析一個 package 候選項、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者上傳為 `package-under-test` artifact，並在 GitHub step summary 中列印來源、workflow ref、package ref、版本、SHA-256 與 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 與 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用 workflow 會下載該 artifact、驗證 tarball inventory、在需要時準備 package-digest Docker 映像，並針對該 package 執行選定的 Docker lane，而不是打包 workflow checkout。當某個 profile 選取多個目標 `docker_lanes` 時，可重用 workflow 會準備 package 與共用映像一次，然後將這些 lane 展開成平行的目標 Docker job，並使用唯一 artifact。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，而且在 Package Acceptance 解析出一個 package 時會安裝相同的 `package-under-test` artifact；獨立 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在 package 解析、Docker acceptance 或可選的 Telegram lane 失敗時，讓 workflow 失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw release 版本，例如 `openclaw@2026.4.27-beta.2`。將此用於已發布 prerelease/stable acceptance。
- `source=ref` 會打包受信任的 `package_ref` branch、tag 或完整 commit SHA。resolver 會擷取 OpenClaw branch/tag，驗證選定 commit 可從 repository branch history 或 release tag 抵達，在 detached worktree 中安裝 deps，並用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 與 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選填，但對外部分享的 artifact 應提供。

保持 `workflow_ref` 與 `package_ref` 分離。`workflow_ref` 是執行測試的受信任 workflow/harness code。`package_ref` 是當 `source=ref` 時會被打包的 source commit。這讓目前的 test harness 能驗證較舊的受信任 source commit，而不執行舊的 workflow logic。

### Suite profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker release-path chunk
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` profile 使用離線 Plugin 涵蓋範圍，因此已發布 package validation 不會受制於 live ClawHub 可用性。可選的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` artifact，而已發布 npm spec path 則保留給獨立 dispatch。

若要了解專用的更新與 Plugin 測試政策，包括本機指令、Docker lane、Package Acceptance 輸入、release 預設值與失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

Release 檢查會以 `source=artifact`、準備好的 release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 與 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這讓 package migration、update、過時 Plugin dependency cleanup、已設定 Plugin install repair、離線 Plugin、plugin-update 與 Telegram proof 都在同一個已解析 package tarball 上執行。在 Full Release Validation 或 OpenClaw Release Checks 上設定 `package_acceptance_package_spec`，即可針對已出貨的 npm package 執行相同矩陣，而不是針對以 SHA 建置的 artifact。Cross-OS release 檢查仍涵蓋 OS 特定的 onboarding、installer 與 platform 行為；package/update product validation 應從 Package Acceptance 開始。`published-upgrade-survivor` Docker lane 每次執行會驗證一個已發布 package baseline。在 Package Acceptance 中，解析出的 `package-under-test` tarball 永遠是候選項，而 `published_upgrade_survivor_baseline` 會選取 fallback 已發布 baseline，預設為 `openclaw@latest`；失敗 lane 的重新執行指令會保留該 baseline。設定 `published_upgrade_survivor_baselines=all-since-2026.4.23`，可將 Full Release CI 擴展到從 `2026.4.23` 到 `latest` 的每個 stable npm release；`release-history` 仍可用於手動進行更廣泛取樣，並使用較舊的 pre-date anchor。設定 `published_upgrade_survivor_scenarios=reported-issues`，可將相同 baseline 擴展到 issue 形狀的 fixture，涵蓋 Feishu config、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、tilde log path 與過時 legacy Plugin dependency root。獨立的 `Update Migration` workflow 會在問題是徹底的已發布 update cleanup，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker lane，搭配 `all-since-2026.4.23` 與 `plugin-deps-cleanup`。本機彙總執行可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確 package spec、用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 來執行情境矩陣。已發布 lane 會用烘焙好的 `openclaw config set` 指令配方設定 baseline、在 `summary.json` 記錄配方步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 與 RPC status。Windows packaged 與 installer fresh lane 也會驗證已安裝 package 能從原始絕對 Windows path 匯入 browser-control override。OpenAI cross-OS agent-turn smoke 在有設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因此 install 與 Gateway proof 會維持在 GPT-5 測試 model 上，同時避免 GPT-4.x 預設值。

### Legacy compatibility window

Package Acceptance 對已發布 package 有有界的 legacy-compatibility window。到 `2026.4.25` 為止的 package，包括 `2026.4.25-beta.*`，可使用 compatibility path：

- `dist/postinstall-inventory.json` 中已知的 private QA entry 可能指向 tarball 省略的檔案；
- 當 package 未公開 `gateway install --wrapper` flag 時，`doctor-switch` 可略過 `gateway install --wrapper` persistence subcase；
- `update-channel-switch` 可從 tarball 衍生的假 git fixture 中移除缺失的 `pnpm.patchedDependencies`，並可記錄缺失的已保存 `update.channel`；
- Plugin smoke 可讀取 legacy install-record 位置，或接受缺失的 marketplace install-record persistence；
- `plugin-update` 可允許 config metadata migration，同時仍要求 install record 與 no-reinstall 行為保持不變。

已發布的 `2026.4.26` package 也可能對已出貨的本機建置 metadata stamp 檔案發出警告。之後的 package 必須滿足現代 contract；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道記錄、階段計時，以及重新執行命令。請優先重新執行失敗的套件設定檔或精確的 Docker 通道，而不是重新執行完整發行驗證。

## 安裝煙霧測試

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用相同的範圍指令碼。它會將煙霧測試涵蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會在 pull request 觸及 Docker/套件介面、內建 Plugin 套件/manifest 變更，或 Docker 煙霧測試作業會涵蓋的核心 Plugin/通道/Gateway/Plugin SDK 介面時執行。僅來源的內建 Plugin 變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置根 Dockerfile 映像一次、檢查 CLI、執行 agents delete shared-workspace CLI 煙霧測試、執行容器 gateway-network e2e、驗證內建擴充功能建置參數，並在 240 秒彙總命令逾時內執行有界的內建 Plugin Docker 設定檔（每個情境的 Docker 執行會個別設上限）。
- **完整路徑**會保留 QR 套件安裝與安裝程式 Docker/更新涵蓋範圍，用於每夜排程執行、手動派送、workflow-call 發行檢查，以及真正觸及安裝程式/套件/Docker 介面的 pull request。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 煙霧測試映像，然後將 QR 套件安裝、根 Dockerfile/Gateway 煙霧測試、安裝程式/更新煙霧測試，以及快速內建 Plugin Docker E2E 作為獨立作業執行，讓安裝程式工作不會被根映像煙霧測試阻塞。

`main` 推送（包括合併提交）不會強制使用完整路徑；當變更範圍邏輯會在推送時要求完整涵蓋範圍，工作流程會保留快速 Docker 煙霧測試，並將完整安裝煙霧測試留給每夜或發行驗證。

較慢的 Bun 全域安裝 image-provider 煙霧測試會由 `run_bun_global_install_smoke` 另行控管。它會在每夜排程和發行檢查工作流程中執行，且手動 `Install Smoke` 派送可以選擇加入，但 pull request 和 `main` 推送不會執行。QR 與安裝程式 Docker 測試會保留各自專注於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/更新/Plugin 相依性通道的純 Node/Git runner；
- 將相同 tarball 安裝到 `/app`，用於一般功能通道的功能性映像。

Docker 通道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的計畫。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個通道選取映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行通道。

### 可調整項目

| 變數                                   | 預設值 | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般通道的主集區 slot 數量。                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對提供者敏感的尾端集區 slot 數量。                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行即時通道上限，避免提供者進行限流。                                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm 安裝通道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行多服務通道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道啟動之間的錯開時間，以避免 Docker daemon 建立風暴；設為 `0` 表示不錯開。                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個通道的備援逾時（120 分鐘）；選定的即時/尾端通道會使用更嚴格的上限。                      |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫而不執行通道。                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確通道清單；會略過清理煙霧測試，讓 agent 可以重現一個失敗通道。               |

比其有效上限更重的通道仍可從空集區啟動，然後獨自執行直到釋放容量。本機彙總會預檢 Docker、移除過期的 OpenClaw E2E 容器、輸出作用中通道狀態、保留通道計時以供最長優先排序，並預設在第一次失敗後停止排程新的集區通道。

### 可重用的即時/E2E 工作流程

可重用的即時/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些套件、映像種類、即時映像、通道和憑證涵蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換成 GitHub 輸出和摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball 清單；當計畫需要已安裝套件的通道時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件摘要標記的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或既有的套件摘要映像，而不是重新建置。Docker 映像拉取會以每次嘗試 180 秒的有界逾時重試，讓卡住的 registry/cache 串流能快速重試，而不是消耗 CI 關鍵路徑的大部分時間。

### 發行路徑區塊

發行 Docker 涵蓋範圍會使用較小的分塊作業搭配 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行，讓每個區塊只拉取所需的映像種類，並透過相同的加權排程器執行多個通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker 區塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總 Plugin/runtime 別名。`install-e2e` 通道別名仍是兩個提供者安裝程式通道的彙總手動重新執行別名。

當完整 release-path 涵蓋範圍要求時，OpenWebUI 會併入 `plugins-runtime-services`，而只在 OpenWebUI-only 派送時保留獨立的 `openwebui` 區塊。內建通道更新通道會針對暫時性 npm 網路失敗重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含通道記錄、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢通道表格，以及每通道重新執行命令。工作流程的 `docker_lanes` 輸入會針對已準備的映像執行所選通道，而不是執行區塊作業，這會將失敗通道偵錯限制在一個目標 Docker 作業中，並為該次執行準備、下載或重用套件成品；如果所選通道是即時 Docker 通道，目標作業會在本機為該次重新執行建置 live-test 映像。產生的每通道 GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備映像輸入，因此失敗通道可以重用失敗執行中的精確套件和映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的即時/E2E 工作流程會每日執行完整 release-path Docker 套件。

## Plugin 預先發行

`Plugin Prerelease` 是成本較高的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確操作者派送的獨立工作流程。一般 pull request、`main` 推送，以及獨立的手動 CI 派送會停用該套件。它會在八個擴充功能 worker 之間平衡內建 Plugin 測試；這些擴充功能分片作業會一次最多執行兩個 Plugin 設定群組，每組使用一個 Vitest worker 和更大的 Node heap，讓匯入繁重的 Plugin 批次不會建立額外的 CI 作業。僅限發行的 Docker 預先發行路徑會以小群組批次執行目標 Docker 通道，避免為一到三分鐘的作業保留數十個 runner。

## QA Lab

QA Lab 在主要智慧範圍工作流程之外有專用 CI 通道。Agentic parity 巢狀於廣泛的 QA 和發行測試框架之下，不是獨立的 PR 工作流程。當 parity 應該隨廣泛驗證執行一起跑時，請使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會每晚在 `main` 上執行，也會在手動派送時執行；它會將 mock parity 通道、即時 Matrix 通道，以及即時 Telegram 和 Discord 通道展開為平行作業。即時作業使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex lease。

發行檢查會使用決定性的 mock provider 和 mock-qualified 模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram 即時傳輸通道，讓通道合約與即時模型延遲和一般 provider-plugin 啟動隔離。即時傳輸 Gateway 會停用記憶體搜尋，因為 QA parity 會另外涵蓋記憶體行為；提供者連線能力則由獨立的即時模型、原生提供者，以及 Docker 提供者套件涵蓋。

Matrix 會在排程和發行 gate 中使用 `--profile fast`，且只在已 checkout 的 CLI 支援時加入 `--fail-fast`。CLI 預設值和手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 派送一律會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab 通道；其 QA parity gate 會將候選與基準套件作為平行通道作業執行，然後將兩者的成品下載到一個小型報告作業中，供最終 parity 比較使用。

對於一般 PR，請依循有範圍的 CI/檢查證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意設計為範圍狹窄的第一輪安全掃描器，而不是完整的儲存庫掃描。每日、手動與非草稿 pull request 防護執行會掃描 Actions 工作流程程式碼，以及風險最高的 JavaScript/TypeScript 表面，並使用高信心度的安全查詢，篩選為高/嚴重 `security-severity`。

pull request 防護維持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下有變更時啟動，並執行與排程工作流程相同的高信心度安全矩陣。Android 和 macOS CodeQL 不納入 PR 預設值。

### 安全類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、祕密、沙箱、Cron 與 Gateway 基準                                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | 核心頻道實作合約，加上頻道 Plugin 執行階段、Gateway、Plugin SDK、祕密與稽核接觸點                                                   |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 剖析、網路防護、網頁擷取與 Plugin SDK SSRF 政策表面                                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞，以及代理工具執行閘門                                                                         |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、載入器、manifest、registry、套件管理器安裝、來源載入，以及 Plugin SDK 套件合約信任表面                                  |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。為 CodeQL 在工作流程健全性接受的最小 Blacksmith Linux runner 上手動建置 Android app。上傳至 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中篩除相依性建置結果，並上傳至 `/codeql-critical-security/macos` 底下。由於 macOS 建置即使乾淨也會主導執行時間，因此保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在較小的 Blacksmith Linux runner 上，針對範圍狹窄但高價值的表面執行錯誤嚴重性、非安全的 JavaScript/TypeScript 品質查詢。它的 pull request 防護刻意比排程設定檔更小：非草稿 PR 只會針對代理命令/模型/工具執行與回覆分派程式碼、設定 schema/遷移/IO 程式碼、驗證/祕密/沙箱/安全程式碼、核心頻道與 bundled 頻道 Plugin 執行階段、Gateway protocol/server-method、記憶體執行階段/SDK 黏合、MCP/程序/對外傳遞、提供者執行階段/模型 catalog、工作階段診斷/傳遞佇列、Plugin 載入器、Plugin SDK/套件合約，或 Plugin SDK 回覆執行階段變更，執行相符的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 與 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動 dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用於單獨執行一個品質分片的教學/迭代掛鉤。

| 類別                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、祕密、沙箱、Cron 與 Gateway 安全邊界程式碼                                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定 schema、遷移、正規化與 IO 合約                                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 協定 schema 與伺服器方法合約                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心頻道與 bundled 頻道 Plugin 實作合約                                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及對外傳遞合約                                                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體 Plugin SDK 別名、記憶體執行階段啟用黏合，以及記憶體 doctor 命令                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞輔助工具、診斷事件/記錄 bundle 表面，以及工作階段 doctor CLI 合約                                           |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆分派、回覆 payload/分塊/執行階段輔助工具、頻道回覆選項、傳遞佇列，以及工作階段/thread 繫結輔助工具                                           |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型 catalog 正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值/catalog，以及 web/search/fetch/embedding registry                                        |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI bootstrap、本機持久化、Gateway 控制流程，以及任務控制平面執行階段合約                                                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取/搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、registry、公用表面，以及 Plugin SDK 進入點合約                                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 來源與 Plugin 套件合約輔助工具                                                                                                           |

品質與安全分開，以便品質發現可以被排程、衡量、停用或擴充，而不會遮蔽安全訊號。Swift、Python 與 bundled-Plugin CodeQL 擴充應只在狹窄設定檔具備穩定執行時間與訊號後，作為範圍化或分片化的後續工作加回來。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於讓現有文件與最近 landed 的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動 dispatch 也可以直接執行它。當 `main` 已經往前移動，或上一小時內已建立另一個未略過的 Docs Agent 執行時，workflow-run 叫用會略過。執行時，它會檢閱從前一個未略過的 Docs Agent 來源 SHA 到目前 `main` 的 commit 範圍，因此每小時一次的執行可以涵蓋自上次文件通過後累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護路徑，用於處理緩慢測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果另一個 workflow-run 叫用已在該 UTC 日執行或正在執行，它會略過。手動 dispatch 會繞過該每日活動閘門。這條路徑會建置完整套件分組 Vitest 效能報告，讓 Codex 只進行小型且保留覆蓋率的測試效能修正，而不是大範圍重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，且代理後的完整套件報告必須通過，才會提交任何內容。當 `main` 在 bot push landed 前前進時，這條路徑會 rebase 已驗證的 patch，重新執行 `pnpm check:changed`，並重試 push；有衝突的過期 patch 會被略過。它使用 GitHub-hosted Ubuntu，讓 Codex action 可以維持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是手動 maintainer 工作流程，用於 landed 後的重複項清理。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會確認 landed PR 已合併，並確認每個重複項都有共用的 referenced issue 或重疊的 changed hunks。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門在架構邊界上比廣泛的 CI 平台範圍更嚴格：

- 核心生產變更會執行核心 prod 與核心 test 型別檢查，加上核心 lint/防護；
- 僅核心測試變更只會執行核心 test 型別檢查，加上核心 lint；
- extension 生產變更會執行 extension prod 與 extension test 型別檢查，加上 extension lint；
- 僅 extension 測試變更會執行 extension test 型別檢查，加上 extension lint；
- 公用 Plugin SDK 或 Plugin 合約變更會擴展到 extension 型別檢查，因為 extension 依賴那些核心合約（Vitest extension 掃描仍是明確的測試工作）；
- 僅 release metadata 的版本 bump 會執行目標式版本/設定/root-dependency 檢查；
- 未知 root/設定變更會 fail safe 到所有檢查路徑。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 便宜：直接測試編輯會執行自身，來源編輯優先使用明確映射，接著是 sibling tests 與 import-graph dependents。共用群組聊天室傳遞設定是明確映射之一：對群組可見回覆設定、來源回覆傳遞模式或 message-tool 系統提示的變更，會路由到核心回覆測試，加上 Discord 與 Slack 傳遞迴歸，讓共用預設值變更在第一個 PR push 前失敗。只有當變更廣泛到測試框架層級，以至於便宜的映射集合不是可信 proxy 時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從 repo 根目錄執行 Testbox，並且在需要廣泛驗證證據時，優先使用全新預熱的 box。在將緩慢的 gate 花在重複使用、已過期，或剛回報異常大量同步的 box 之前，先在該 box 內執行 `pnpm testbox:sanity`。

當必要的根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤檔案遭刪除時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是該 PR 的可信副本；請停止該 box 並改為預熱新的 box，而不是除錯產品測試失敗。對於有意的大量刪除 PR，請在該次健全性執行中設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止停留在同步階段超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該保護，或針對異常龐大的本機 diff 使用更大的毫秒值。

Crabbox 是 repo 擁有的遠端 box 包裝器，用於維護者 Linux 驗證。當檢查對本機編輯迴圈而言過於廣泛、CI parity 很重要，或驗證需要 secrets、Docker、package lanes、可重用 box 或遠端日誌時使用它。一般 OpenClaw 後端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是 Blacksmith 中斷、配額問題，或明確要測試自有容量時的備援。

第一次執行前，請從 repo 根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果 Crabbox binary 過舊且未宣告 `blacksmith-testbox`，repo 包裝器會拒絕它。即使 `.crabbox.yaml` 具有自有雲端預設值，也請明確傳入 provider。

變更 gate：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

聚焦測試重新執行：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

完整套件：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

閱讀最終 JSON 摘要。有用欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。一次性的 Blacksmith 後端 Crabbox 執行應該會自動停止 Testbox；如果執行被中斷或清理狀態不明，請檢查即時 box，並只停止你建立的 box：

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

只有在你有意需要在同一個已 hydrate 的 box 上執行多個命令時，才使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是損壞的層，但 Blacksmith 本身可運作，請使用直接 Blacksmith 作為狹窄備援：

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或自有容量明確是目標時，才升級到自有 Crabbox 容量：

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` 擁有自有雲端 lanes 的 provider、sync 和 GitHub Actions hydration 預設值。它會排除本機 `.git`，讓已 hydrate 的 Actions checkout 保留自己的遠端 Git metadata，而不是同步維護者本機的 remotes 與 object stores；它也會排除不應傳輸的本機 runtime/build artifacts。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` fetch，以及自有雲端 `crabbox run --id <cbx_id>` 命令的非 secret 環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
