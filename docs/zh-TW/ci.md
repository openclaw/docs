---
read_when:
    - 你需要了解 CI 作業為什麼有執行或沒有執行
    - 你正在偵錯一個失敗的 GitHub Actions 檢查
    - 你正在協調發行驗證的執行或重新執行
    - 你正在變更 ClawSweeper 派送或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括項目與本機對應命令
title: 持續整合管線
x-i18n:
    generated_at: "2026-05-05T01:44:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 上執行。`preflight` 工作會分類差異，並在只有不相關區域變更時關閉昂貴的 lane。手動 `workflow_dispatch` 執行會刻意繞過智慧範圍界定，並展開完整圖形以用於發布候選版本與廣泛驗證。Android lane 透過 `include_android` 維持選擇加入。僅限發布的 Plugin 涵蓋範圍位於獨立的 [`Plugin 預發布`](#plugin-prerelease) workflow 中，且只會從 [`完整發布驗證`](#full-release-validation) 或明確的手動 dispatch 執行。

## Pipeline 概覽

| 工作                             | 用途                                                                                                      | 執行時機                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、已變更範圍、已變更擴充套件，並建置 CI manifest                                           | 一律在非草稿推送和 PR 上執行      |
| `security-scm-fast`              | 透過 `zizmor` 偵測私密金鑰並稽核 workflow                                                                 | 一律在非草稿推送和 PR 上執行      |
| `security-dependency-audit`      | 針對 npm advisories 執行不需相依性的生產 lockfile 稽核                                                    | 一律在非草稿推送和 PR 上執行      |
| `security-fast`                  | 快速安全工作的必要彙總                                                                                    | 一律在非草稿推送和 PR 上執行      |
| `check-dependencies`             | 生產 Knip 僅相依性 pass 加上未使用檔案 allowlist guard                                                    | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置成品檢查，以及可重用的下游成品                                            | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性 lane，例如 bundled/plugin-contract/protocol 檢查                                        | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片 channel contract 檢查，並提供穩定的彙總檢查結果                                                      | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，不含 channel、bundled、contract 和 extension lane                                     | Node 相關變更                      |
| `check`                          | 分片主本機 gate 等效項目：prod types、lint、guards、test types 和 strict smoke                            | Node 相關變更                      |
| `check-additional`               | 架構、分片 boundary/prompt drift、extension guards、package boundary，以及 gateway watch                   | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI smoke 測試與 startup-memory smoke                                                              | Node 相關變更                      |
| `checks`                         | 已建置成品 channel 測試的 verifier                                                                        | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke lane                                                                           | 針對發布的手動 CI dispatch         |
| `check-docs`                     | 文件格式、lint 和 broken-link 檢查                                                                        | 文件已變更                         |
| `skills-python`                  | Python-backed skills 的 Ruff + pytest                                                                     | Python-skill 相關變更              |
| `checks-windows`                 | Windows 特定 process/path 測試，以及共享 runtime import specifier 迴歸                                    | Windows 相關變更                   |
| `macos-node`                     | 使用共享已建置成品的 macOS TypeScript 測試 lane                                                           | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、建置與測試                                                                       | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android unit tests 加上一個 debug APK 建置                                                 | Android 相關變更                   |
| `test-performance-agent`         | 受信任活動後的每日 Codex slow-test 最佳化                                                                 | Main CI 成功或手動 dispatch        |
| `openclaw-performance`           | 每日/隨選 Kova runtime 效能報告，包含 mock-provider、deep-profile 和 GPT 5.4 live lane                    | 排程與手動 dispatch                |

## Fail-fast 順序

1. `preflight` 決定哪些 lane 實際存在。`docs-scope` 和 `changed-scope` 邏輯是此工作內的步驟，不是獨立工作。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 會快速失敗，而不等待較重的成品與平台矩陣工作。
3. `build-artifacts` 會與快速 Linux lane 重疊，讓下游消費者能在共享建置準備好後立即開始。
4. 較重的平台與 runtime lane 之後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

當較新的推送落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的工作標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則應將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此它們仍會回報一般分片失敗，但不會在整個 workflow 已被取代後繼續排隊。自動 CI concurrency key 已版本化為 (`CI-v7-*`)，因此 GitHub 端舊 queue group 中的殭屍項目無法無限期阻擋較新的 main 執行。手動 full-suite 執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit tests 涵蓋。手動 dispatch 會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個有範圍的區域都已變更。

- **CI workflow 編輯**會驗證 Node CI 圖形加上 workflow linting，但不會單獨強制 Windows、Android 或 macOS native builds；這些平台 lane 仍限於平台原始碼變更。
- **僅 CI 路由編輯、選定的廉價 core-test fixture 編輯，以及狹窄的 plugin contract helper/test-routing 編輯**會使用快速 Node-only manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` 任務。當變更僅限於該快速任務直接執行的路由或 helper 表面時，該路徑會略過 build artifacts、Node 22 compatibility、channel contracts、完整 core shards、bundled-plugin shards 和 additional guard matrices。
- **Windows Node 檢查**的範圍限於 Windows 特定的 process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該 lane 的 CI workflow 表面；不相關的原始碼、plugin、install-smoke 和僅測試變更會留在 Linux Node lane 上。

最慢的 Node 測試家族會被拆分或平衡，讓每個工作保持小型而不過度保留 runner：channel contracts 以三個加權分片執行，core unit fast/support lane 分開執行，core runtime infra 在 state 與 process/config 分片之間拆分，auto-reply 以平衡 worker 執行（reply subtree 拆成 agent-runner、dispatch 和 commands/state-routing 分片），而 agentic gateway/server config 則跨 chat/auth/model/http-plugin/runtime/startup lane 拆分，而不是等待已建置成品。廣泛的 browser、QA、media 和 miscellaneous plugin 測試使用其專用 Vitest config，而不是共享 plugin catch-all。Include-pattern 分片使用 CI 分片名稱記錄 timing entries，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 與 filtered shard。`check-additional` 將 package-boundary compile/canary 工作放在一起，並將 runtime topology architecture 與 gateway watch coverage 分離；boundary guard list 橫向切成四個 matrix shards，每個分片同時執行選定的獨立 guards 並列印各檢查 timing，包括 `pnpm prompt:snapshots:check`，因此 Codex runtime happy-path prompt drift 會被固定到造成它的 PR。Gateway watch、channel tests 和 core support-boundary shard 會在 `dist/` 和 `dist-runtime/` 已建置後，於 `build-artifacts` 內同時執行。

Android CI 會同時執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test lane 仍會使用 SMS/call-log BuildConfig flags 編譯該 flavor，同時避免在每次 Android 相關推送上執行重複的 debug APK packaging 工作。

`check-dependencies` 分片執行 `pnpm deadcode:dependencies`（固定到最新 Knip 版本的生產 Knip 僅相依性 pass，且為 `dlx` install 停用 pnpm 的 minimum release age）和 `pnpm deadcode:unused-files`，後者會將 Knip 的生產未使用檔案發現項目與 `scripts/deadcode-unused-files.allowlist.mjs` 比較。當 PR 新增未審核的未使用檔案或留下過時的 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的有意動態 plugin、generated、build、live-test 和 package bridge 表面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository activity 進入 ClawSweeper 的目標端橋接器。它不會 checkout 或執行不受信任的 pull request code。該 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payloads dispatch 到 `openclaw/clawsweeper`。

該 workflow 有四個 lane：

- `clawsweeper_item` 用於精確的 issue 和 pull request review requests；
- `clawsweeper_comment` 用於 issue comments 中明確的 ClawSweeper commands；
- `clawsweeper_commit_review` 用於 `main` pushes 上的 commit-level review requests；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub activity。

`github_activity` lane 只轉送正規化的 metadata：event type、action、actor、repository、item number、URL、title、state，以及存在時的 comments 或 reviews 短 excerpt。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，會將正規化 event 發布到 ClawSweeper agent 的 OpenClaw Gateway hook。

一般活動是觀察，不是預設交付。ClawSweeper agent 會在 prompt 中收到 Discord target，且只有在事件令人意外、可行動、有風險或具操作用途時，才應發布到 `#clawsweeper`。例行 open、edit、bot churn、duplicate webhook noise 和正常 review traffic 應產生 `NO_REPLY`。

在整個路徑中，請將 GitHub titles、comments、bodies、review text、branch names 和 commit messages 視為不受信任的資料。它們是 summarization 和 triage 的輸入，不是 workflow 或 agent runtime 的指令。

## 手動 dispatches

手動 CI 分派會執行與一般 CI 相同的工作圖，但會強制啟用所有非 Android 範圍的通道：Linux Node 分片、隨附 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI 分派只會在 `include_android=true` 時執行 Android；完整發布總控會透過傳入 `include_android=true` 啟用 Android。Plugin 預發布靜態檢查、僅發布用的 `agentic-plugins` 分片、完整 extension 批次掃描，以及 Plugin 預發布 Docker 通道會從 CI 中排除。Docker 預發布套件只會在 `Full Release Validation` 分派個別的 `Plugin Prerelease` 工作流程，且啟用發布驗證閘門時執行。

手動執行會使用唯一的並行群組，因此發布候選的完整套件不會被同一 ref 上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫者在使用所選分派 ref 的工作流程檔案時，針對分支、標籤或完整 commit SHA 執行該圖。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                           | 工作                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性工作與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速協定/合約/隨附檢查、分片通道合約檢查、除了 lint 之外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也會使用 GitHub 託管的 Ubuntu，因此 Blacksmith 矩陣可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低權重的 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`，以及 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、隨附 Plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 足夠敏感，以致 8 vCPU 花費比節省更多）；install-smoke Docker 建置（32-vCPU 佇列時間成本比節省更多）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本機對應指令

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

`OpenClaw Performance` 是產品/執行階段效能工作流程。它每天在 `main` 上執行，也可以手動分派：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動分派通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對發布標籤或另一個分支進行基準測試。已發布的報告路徑與最新指標會依測試的 ref 作為索引鍵，且每個 `index.md` 都會記錄測試的 ref/SHA、工作流程 ref/SHA、Kova ref、profile、通道授權模式、模型、重複次數，以及情境篩選器。

工作流程會從釘選的發布安裝 OCM，並從 `openclaw/Kova` 的釘選 `kova_ref` 輸入安裝 Kova，接著執行三個通道：

- `mock-provider`：Kova 診斷情境，針對使用確定性假 OpenAI 相容授權的本機建置執行階段。
- `mock-deep-profile`：針對啟動、Gateway，以及代理程式回合熱點的 CPU/heap/trace profiling。
- `live-gpt54`：真實 OpenAI `openai/gpt-5.4` 代理程式回合，當 `OPENAI_API_KEY` 無法使用時略過。

mock-provider 通道也會在 Kova 通過後執行 OpenClaw 原生原始碼探測：預設、hook 與 50-Plugin 啟動案例中的 Gateway 啟動計時與記憶體；重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈；以及針對已啟動 Gateway 的 CLI 啟動命令。原始碼探測 Markdown 摘要位於報告套件中的 `source/index.md`，原始 JSON 則在旁邊。

每個通道都會上傳 GitHub artifacts。設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、套件、`index.md`，以及原始碼探測 artifacts 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 底下。目前測試 ref 指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發布驗證

`Full Release Validation` 是用於「發布前執行所有項目」的手動總控工作流程。它接受分支、標籤或完整 commit SHA，使用該目標分派手動 `CI` 工作流程，分派 `Plugin Prerelease` 以取得僅發布用的 Plugin/套件/靜態/Docker 證明，並分派 `OpenClaw Release Checks` 以進行安裝煙霧測試、套件驗收、跨 OS 套件檢查、QA Lab parity、Matrix，以及 Telegram 通道。穩定/預設執行會將詳盡的 live/E2E 與 Docker 發布路徑覆蓋保留在 `run_release_soak=true` 後方；`release_profile=full` 會強制啟用該 soak 覆蓋，因此廣泛 advisory 驗證仍會保持廣泛。使用 `rerun_group=all` 與 `release_profile=full` 時，它也會針對來自發布檢查的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳入 `npm_telegram_package_spec` 可針對已發布的 npm 套件重新執行相同的 Telegram 套件通道。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、確切的工作流程工作名稱、profile 差異、artifacts，以及聚焦重新執行控制代碼。

`OpenClaw Release Publish` 是手動且會變更狀態的發布工作流程。在發布標籤存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.D` 或 `main` 分派它。它會驗證 `pnpm plugins:sync:check`，為所有可發布的 Plugin 套件分派 `Plugin NPM Release`，為相同的發布 SHA 分派 `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動分支上取得釘選 commit 證明，請使用輔助程式，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程分派 ref 必須是分支或標籤，不能是原始 commit SHA。輔助程式會在目標 SHA 推送一個臨時的 `release-ci/<sha>-...` 分支，從該釘選 ref 分派 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成時刪除臨時分支。如果任何子工作流程在不同 SHA 上執行，總控驗證器也會失敗。

`release_profile` 控制傳入發行檢查的即時/供應商涵蓋範圍。手動發行工作流程預設為 `stable`；只有在你刻意需要寬廣的 advisory 供應商/媒體矩陣時，才使用 `full`。`run_release_soak` 控制 stable/預設發行檢查是否執行完整的即時/E2E 與 Docker 發行路徑 soak；`full` 會強制啟用 soak。

- `minimum` 保留最快的 OpenAI/核心發行關鍵通道。
- `stable` 加入穩定的供應商/後端集合。
- `full` 執行寬廣的 advisory 供應商/媒體矩陣。

umbrella 會記錄已派發的子執行 ID，最終的 `Verify full validation` 工作會重新檢查目前子執行結論，並為每個子執行附加最慢工作表格。如果子工作流程重新執行後轉為綠燈，只需重新執行父驗證器工作，即可重新整理 umbrella 結果與時間摘要。

復原時，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。發行候選版本使用 `all`，只針對一般完整 CI 子流程使用 `ci`，只針對 Plugin prerelease 子流程使用 `plugin-prerelease`，針對每個發行子流程使用 `release-checks`，或在 umbrella 上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能讓失敗的發行機器在聚焦修正後只進行有限範圍的重新執行。若只有一個跨 OS 通道失敗，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 搭配使用，例如 `windows/packaged-upgrade`；長時間的跨 OS 命令會輸出 heartbeat 行，packaged-upgrade 摘要會包含各階段計時。QA release-check 通道屬於 advisory，因此只有 QA 失敗時會提出警告，但不會阻擋 release-check 驗證器。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將所選 ref 一次解析為 `release-package-under-test` tarball，然後把該成品傳給跨 OS 檢查和 Package Acceptance，並在執行 soak 涵蓋時傳給即時/E2E 發行路徑 Docker 工作流程。這能讓套件位元組在各發行機器之間保持一致，並避免在多個子工作中重複封裝同一個候選版本。

對於 `ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行，較新的 umbrella 會取代較舊的 umbrella。父監視器在父流程被取消時，會取消其已派發的任何子工作流程，因此較新的 main 驗證不會排在過時的兩小時 release-check 執行後面。發行分支/標籤驗證與聚焦重新執行群組會保持 `cancel-in-progress: false`。

## 即時與 E2E 分片

發行即時/E2E 子流程保留寬廣的原生 `pnpm test:live` 涵蓋範圍，但它會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是單一序列工作：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 依供應商篩選的 `native-live-src-gateway-profiles` 工作
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 拆分的媒體音訊/影片分片，以及依供應商篩選的音樂分片

這會保留相同的檔案涵蓋範圍，同時讓緩慢的即時供應商失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生即時媒體分片會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；媒體工作只會在設定前驗證二進位檔。請將 Docker 支援的即時套件保留在一般 Blacksmith runner 上執行，容器工作不適合啟動巢狀 Docker 測試。

Docker 支援的即時模型/後端分片會針對每個所選提交使用個別共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發行工作流程會建置並推送該映像一次，然後 Docker 即時模型、依供應商分片的 Gateway、CLI 後端、ACP bind 和 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片在指令碼層級帶有明確的 `timeout` 上限，低於工作流程工作逾時，讓卡住的容器或清理路徑能快速失敗，而不是耗完整個 release-check 預算。如果這些分片各自重新建置完整的來源 Docker 目標，代表發行執行設定錯誤，會把時間浪費在重複映像建置上。

## Package Acceptance

當問題是「這個可安裝的 OpenClaw 套件作為產品是否可用？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證來源樹，而 package acceptance 會透過使用者安裝或更新後會使用的同一套 Docker E2E harness，驗證單一 tarball。

### 工作

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選版本、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備 package-digest Docker 映像，並針對該套件執行所選 Docker 通道，而不是封裝工作流程 checkout。當某個 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件與共享映像一次，然後將這些通道扇出為平行的目標 Docker 工作，並使用唯一成品。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，並在 Package Acceptance 解析出套件時安裝相同的 `package-under-test` 成品；獨立 Telegram 派發仍可安裝已發布的 npm spec。
4. 若套件解析、Docker acceptance 或可選 Telegram 通道失敗，`summary` 會讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。請用於已發布的 prerelease/stable acceptance。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤、驗證所選提交可從儲存庫分支歷史或發行標籤到達、在 detached worktree 中安裝依賴項，並用 `scripts/package-openclaw-for-docker.mjs` 封裝。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 可選，但外部共享成品應提供。

請保持 `workflow_ref` 和 `package_ref` 分離。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是 `source=ref` 時會被封裝的來源提交。這讓目前的測試 harness 能驗證較舊的受信任來源提交，而不執行舊的工作流程邏輯。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 搭配 OpenWebUI 的完整 Docker 發行路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` profile 使用離線 Plugin 涵蓋，因此已發布套件驗證不會受限於 ClawHub 即時可用性。可選 Telegram 通道會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm spec 路徑供獨立派發使用。

如需專門的更新與 Plugin 測試政策，包括本機命令、Docker 通道、Package Acceptance 輸入、發行預設值與失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發行檢查會以 `source=artifact`、準備好的發行套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這會讓套件遷移、更新、過時 Plugin 依賴項清理、已設定 Plugin 安裝修復、離線 Plugin、Plugin 更新和 Telegram 證明都使用同一個已解析的套件 tarball。在 Full Release Validation 或 OpenClaw Release Checks 上設定 `package_acceptance_package_spec`，即可針對已出貨的 npm 套件而不是 SHA 建置成品執行同一個矩陣。跨 OS 發行檢查仍涵蓋 OS 特定 onboarding、安裝程式與平台行為；套件/更新產品驗證應從 Package Acceptance 開始。`published-upgrade-survivor` Docker 通道會在阻擋式發行路徑中，每次執行驗證一個已發布套件基準。在 Package Acceptance 中，已解析的 `package-under-test` tarball 永遠是候選版本，而 `published_upgrade_survivor_baseline` 會選取備援已發布基準，預設為 `openclaw@latest`；失敗通道重新執行命令會保留該基準。當 Full Release Validation 設定 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines=all-since-2026.4.23` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展涵蓋從 `2026.4.23` 到 `latest` 的每個穩定 npm 發行，以及 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、波浪號記錄路徑與過時 legacy Plugin 依賴項根目錄等議題形狀 fixture。個別的 `Update Migration` 工作流程會在問題是完整已發布更新清理，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker 通道搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本機彙總執行可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 spec、用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一通道，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 供情境矩陣使用。已發布通道會用內建的 `openclaw config set` 命令 recipe 設定基準、在 `summary.json` 中記錄 recipe 步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 以及 RPC 狀態。Windows packaged 和 installer fresh 通道也會驗證已安裝套件能從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 在有設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因此安裝與 Gateway 證明會停留在 GPT-5 測試模型，同時避免 GPT-4.x 預設值。

### Legacy 相容性窗口

Package Acceptance 對已發布套件有有限範圍的 legacy 相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中的已知私有 QA 項目可指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的假 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，並可記錄缺失的持久化 `update.channel`；
- Plugin smoke 可讀取 legacy 安裝記錄位置，或接受缺失的 marketplace 安裝記錄持久化；
- `plugin-update` 可允許設定中繼資料遷移，同時仍要求安裝記錄與不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可對已經出貨的本機建置中繼資料戳記檔案提出警告。較新的套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請先從 `resolve_package` 摘要開始，確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日誌、階段計時與重新執行命令。優先重新執行失敗的套件設定檔或精確的 Docker 通道，而不是重新執行完整 release 驗證。

## 安裝煙霧測試

獨立的 `Install Smoke` workflow 會透過自己的 `preflight` 作業重用相同的範圍指令碼。它會將煙霧測試覆蓋範圍拆分為 `run_fast_install_smoke` 與 `run_full_install_smoke`。

- **快速路徑** 會在 pull request 觸及 Docker/套件表面、內建 Plugin 套件/manifest 變更，或 Docker 煙霧測試作業會演練的核心 Plugin/通道/Gateway/Plugin SDK 表面時執行。只有原始碼的內建 Plugin 變更、僅測試編輯與僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI 煙霧測試、執行容器 gateway-network e2e、驗證內建擴充功能建置引數，並在 240 秒彙總命令逾時內執行有界的內建 Plugin Docker 設定檔（每個情境的 Docker 執行各自設上限）。
- **完整路徑** 會為每晚排程執行、手動派送、workflow-call release 檢查，以及真正觸及安裝程式/套件/Docker 表面的 pull request 保留 QR 套件安裝與安裝程式 Docker/更新覆蓋範圍。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 煙霧測試映像，接著將 QR 套件安裝、根 Dockerfile/Gateway 煙霧測試、安裝程式/更新煙霧測試，以及快速內建 Plugin Docker E2E 作為獨立作業執行，讓安裝程式工作不必等待根映像煙霧測試。

`main` 推送（包含合併提交）不會強制完整路徑；當變更範圍邏輯會在推送上要求完整覆蓋時，workflow 會保留快速 Docker 煙霧測試，並將完整安裝煙霧測試留給每晚或 release 驗證。

較慢的 Bun 全域安裝 image-provider 煙霧測試會由 `run_bun_global_install_smoke` 個別控管。它會在每晚排程與 release checks workflow 中執行，且手動 `Install Smoke` 派送可選擇加入，但 pull request 與 `main` 推送不會執行。QR 與安裝程式 Docker 測試會保留各自偏重安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共享的 live-test 映像，將 OpenClaw 封裝一次為 npm tarball，並建置兩個共享的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/更新/Plugin 相依通道的裸 Node/Git runner；
- 將同一個 tarball 安裝到 `/app` 中、供一般功能通道使用的功能映像。

Docker 通道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的計畫。排程器會透過 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 依通道選取映像，接著用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行通道。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般通道的主池槽位數。                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對提供者敏感的尾池槽位數。                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 同時執行的 live 通道上限，避免提供者節流。                                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 同時執行的 npm 安裝通道上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時執行的多服務通道上限。                                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | 通道啟動之間的錯開時間，以避免 Docker daemon 建立風暴；設為 `0` 則不錯開。                   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個通道的後備逾時（120 分鐘）；選定的 live/tail 通道使用更嚴格的上限。                      |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定  | `1` 會列印排程器計畫，而不執行通道。                                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定  | 逗號分隔的精確通道清單；略過清理煙霧測試，讓 agent 能重現單一失敗通道。                      |

比有效上限更重的通道仍可從空池啟動，接著會獨自執行直到釋放容量。本機彙總會預檢 Docker、移除過期的 OpenClaw E2E 容器、輸出作用中通道狀態、保存通道計時以供最長優先排序，並預設在首次失敗後停止排程新的池化通道。

### 可重用的 live/E2E workflow

可重用的 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、通道與憑證覆蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 封裝 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball 清單；在計畫需要已安裝套件的通道時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件摘要標記的裸/功能 GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或現有套件摘要映像，而不是重新建置。Docker 映像拉取會以每次嘗試 180 秒的有界逾時重試，讓卡住的 registry/cache stream 能快速重試，而不是消耗大部分 CI 關鍵路徑。

### Release 路徑分塊

Release Docker 覆蓋範圍會用較小的分塊作業搭配 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行，讓每個分塊只拉取所需的映像種類，並透過同一個加權排程器執行多個通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的 release Docker 分塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍然是彙總 Plugin/runtime 別名。`install-e2e` 通道別名仍然是兩個提供者安裝程式通道的彙總手動重新執行別名。

當完整 release-path 覆蓋要求 OpenWebUI 時，它會被併入 `plugins-runtime-services`，並只在僅 OpenWebUI 的派送中保留獨立的 `openwebui` 分塊。內建通道更新通道會針對暫時性 npm 網路失敗重試一次。

每個分塊都會上傳 `.artifacts/docker-tests/`，其中包含通道日誌、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢通道表，以及每個通道的重新執行命令。workflow 的 `docker_lanes` 輸入會針對已準備的映像執行選取的通道，而不是執行分塊作業，讓失敗通道偵錯限制在一個有針對性的 Docker 作業中，並為該執行準備、下載或重用套件成品；如果選取的通道是 live Docker 通道，目標作業會在本機建置 live-test 映像以供該次重新執行。產生的每通道 GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 與已準備的映像輸入，讓失敗通道能重用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E workflow 每天會執行完整 release-path Docker 套件。

## Plugin 預先發行

`Plugin Prerelease` 是成本更高的產品/套件覆蓋範圍，因此它是由 `Full Release Validation` 或明確操作員派送的獨立 workflow。一般 pull request、`main` 推送與獨立手動 CI 派送都會關閉該套件。它會在八個擴充功能 worker 之間平衡內建 Plugin 測試；這些擴充功能分片作業一次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest worker 與較大的 Node heap，讓大量匯入的 Plugin 批次不會建立額外 CI 作業。僅 release 的 Docker 預先發行路徑會將目標 Docker 通道分成小群組批次執行，避免為一到三分鐘的作業保留數十個 runner。

## QA Lab

QA Lab 在主要智慧範圍 workflow 之外有專用 CI 通道。Agentic parity 巢狀位於廣泛 QA 與 release harness 之下，不是獨立的 PR workflow。當 parity 應該搭配廣泛驗證執行時，請使用 `Full Release Validation` 並設定 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 會在 `main` 上每晚執行，也可手動派送；它會將 mock parity 通道、live Matrix 通道，以及 live Telegram 與 Discord 通道展開為平行作業。Live 作業使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex lease。

Release 檢查會使用決定性的 mock 提供者與 mock 限定模型（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport 通道，讓通道合約與 live 模型延遲及一般提供者 Plugin 啟動隔離。live transport Gateway 會停用記憶體搜尋，因為 QA parity 會另外涵蓋記憶體行為；提供者連線能力則由獨立的 live 模型、原生提供者與 Docker 提供者套件涵蓋。

Matrix 會在排程與 release gate 中使用 `--profile fast`，且只在簽出的 CLI 支援時加上 `--fail-fast`。CLI 預設值與手動 workflow 輸入仍為 `all`；手動 `matrix_profile=all` 派送一律會將完整 Matrix 覆蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在 release 核准前執行 release 關鍵的 QA Lab 通道；其 QA parity gate 會將候選與基準套件作為平行通道作業執行，接著將兩者成品下載到小型報告作業中，進行最終 parity 比較。

對一般 PR，請遵循範圍化 CI/檢查證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意是範圍狹窄的第一輪安全掃描器，而不是完整的儲存庫掃描。每日、手動，以及非草稿 pull request 的防護執行，會掃描 Actions 工作流程程式碼，加上最高風險的 JavaScript/TypeScript 表面，並使用高信心度的安全查詢，篩選至高/嚴重 `security-severity`。

pull request 防護保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下有變更時啟動，並執行與排程工作流程相同的高信心度安全矩陣。Android 和 macOS CodeQL 不包含在 PR 預設值中。

### 安全類別

| 類別                                          | 表面                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、祕密、沙箱、Cron 和 Gateway 基準                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | 核心頻道實作合約，加上頻道 Plugin runtime、Gateway、Plugin SDK、祕密、稽核接觸點              |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、web-fetch 和 Plugin SDK SSRF 政策表面                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、外送交付，以及代理工具執行閘門                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、載入器、manifest、registry、套件管理器安裝、來源載入，以及 Plugin SDK 套件合約信任表面 |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。在工作流程健全性接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android 應用程式。上傳到 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動的 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式，從上傳的 SARIF 中篩除相依項建置結果，並上傳到 `/codeql-critical-security/macos` 底下。因為即使乾淨時 macOS 建置也主導 runtime，所以保持在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在較小的 Blacksmith Linux runner 上，對範圍狹窄且高價值的表面執行錯誤嚴重度、非安全性的 JavaScript/TypeScript 品質查詢。它的 pull request 防護刻意比排程設定檔更小：非草稿 PR 只會在代理命令/模型/工具執行與回覆派送程式碼、config schema/migration/IO 程式碼、auth/祕密/沙箱/安全程式碼、核心頻道與隨附頻道 Plugin runtime、Gateway protocol/server-method、記憶體 runtime/SDK 銜接、MCP/程序/外送交付、provider runtime/模型目錄、session diagnostics/交付佇列、Plugin loader、Plugin SDK/套件合約，或 Plugin SDK 回覆 runtime 有變更時，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL config 與品質工作流程變更會執行全部十二個 PR 品質分片。

手動派送接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用於單獨執行一個品質分片的教學/迭代掛鉤。

| 類別                                                | 表面                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth、祕密、沙箱、Cron 和 Gateway 安全邊界程式碼                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config schema、migration、normalization 和 IO 合約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schema 和伺服器方法合約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心頻道與隨附頻道 Plugin 實作合約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/provider 派送、自動回覆派送與佇列，以及 ACP 控制平面 runtime 合約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督輔助工具，以及外送交付合約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體 runtime facade、記憶體 Plugin SDK alias、記憶體 runtime 啟用銜接，以及記憶體 doctor 命令                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、session 交付佇列、外送 session 綁定/交付輔助工具、診斷事件/記錄 bundle 表面，以及 session doctor CLI 合約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 入站回覆派送、回覆 payload/chunking/runtime 輔助工具、頻道回覆選項、交付佇列，以及 session/thread 綁定輔助工具             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄標準化、provider auth 與 discovery、provider runtime 註冊、provider defaults/catalogs，以及 web/search/fetch/embedding registry    |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、local persistence、Gateway 控制流程，以及任務控制平面 runtime 合約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、media IO、media understanding、image-generation，以及 media-generation runtime 合約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader、registry、public-surface，以及 Plugin SDK entrypoint 合約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 來源與 Plugin 套件合約輔助工具                                                                                      |

品質與安全保持分離，讓品質發現可以排程、量測、停用或擴展，而不會遮蔽安全訊號。Swift、Python 和隨附 Plugin 的 CodeQL 擴展，應該只在狹窄設定檔已有穩定 runtime 和訊號之後，再以有範圍或分片的後續工作加回來。

## 維護工作流程

### 文件代理

`Docs Agent` 工作流程是事件驅動的 Codex 維護通道，用於讓現有文件與近期落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動派送也可以直接執行它。當 `main` 已經前進，或最近一小時內已建立另一個非跳過的 Docs Agent 執行時，workflow-run 叫用會跳過。當它執行時，會檢閱從前一次非跳過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋上次文件檢查後累積的所有 main 變更。

### 測試效能代理

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護通道，用於慢速測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果另一個 workflow-run 叫用在該 UTC 日已經執行過或正在執行，則會跳過。手動派送會略過該每日活動閘門。此通道會建置完整套件分組的 Vitest 效能報告，讓 Codex 只進行小型、保留覆蓋率的測試效能修正，而不是大範圍重構，然後重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，而且代理後的完整套件報告必須通過，才會提交任何內容。當 `main` 在 bot push 落地前前進時，此通道會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期 patch 會被跳過。它使用 GitHub-hosted Ubuntu，因此 Codex action 可以保持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是供維護者使用的手動工作流程，用於落地後的重複項清理。它預設為 dry-run，且只會在 `apply=true` 時關閉明確列出的 PR。在修改 GitHub 之前，它會驗證已落地 PR 已合併，且每個重複項都有共同參照的 issue 或重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求，比廣泛的 CI 平台範圍更嚴格：

- 核心 production 變更會執行核心 prod 與核心 test typecheck，加上核心 lint/guard；
- 僅核心測試變更只會執行核心 test typecheck，加上核心 lint；
- extension production 變更會執行 extension prod 與 extension test typecheck，加上 extension lint；
- 僅 extension 測試變更會執行 extension test typecheck，加上 extension lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴展到 extension typecheck，因為 extension 依賴那些核心合約（Vitest extension sweep 保持為明確的測試工作）；
- 僅 release metadata 的版本升級會執行目標版本/config/root-dependency 檢查；
- 未知的 root/config 變更會 fail safe 到所有檢查通道。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，並且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，來源編輯優先使用明確對應，接著是同層測試與 import-graph 依賴項。共享群組房間交付 config 是其中一個明確對應：對群組可見回覆 config、來源回覆交付模式，或 message-tool system prompt 的變更，會透過核心回覆測試加上 Discord 和 Slack 交付回歸，因此共享預設值變更會在第一次 PR push 前失敗。只有當變更廣泛影響測試框架，使便宜的對應集合不足以作為可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

在儲存庫根目錄執行 Testbox，且對於大範圍驗證，偏好使用新的已預熱 box。若要在曾重複使用、已過期，或剛回報非預期大量同步的 box 上執行耗時檢查閘，請先在該 box 內執行 `pnpm testbox:sanity`。

當必要的根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤檔案遭刪除時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是提取請求的可信副本；請停止該 box 並改為預熱新的 box，而不是偵錯產品測試失敗。對於刻意大量刪除的提取請求，請在該次健全性檢查設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止停留在同步階段超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該防護；若本機差異異常龐大，則可使用較大的毫秒值。

Crabbox 是儲存庫擁有的遠端 box 包裝器，用於維護者的 Linux 驗證。當檢查對本機編輯迴圈而言過於廣泛、CI 等價性很重要，或驗證需要密鑰、Docker、套件檢查線、可重複使用的 box 或遠端日誌時，請使用它。一般的 OpenClaw 後端是 `blacksmith-testbox`；擁有的 AWS/Hetzner 容量則是在 Blacksmith 中斷、配額問題，或明確測試自有容量時的備援。

第一次執行前，請從儲存庫根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

若 Crabbox 二進位檔過舊且未宣告 `blacksmith-testbox`，儲存庫包裝器會拒絕使用。即使 `.crabbox.yaml` 有自有雲端預設值，也請明確傳入提供者。

變更檢查閘：

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

聚焦測試重跑：

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

閱讀最終的 JSON 摘要。有用的欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。由 Blacksmith 支援的一次性 Crabbox 執行應會自動停止 Testbox；若執行被中斷或清理狀態不明，請檢查仍在執行的 box，並只停止你建立的 box：

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要於同一個已水合 box 上執行多個命令時，才使用重複使用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

若損壞的層是 Crabbox，但 Blacksmith 本身可用，請使用直接 Blacksmith 作為狹窄備援：

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

只有在 Blacksmith 中斷、受配額限制、缺少所需環境，或自有容量明確是目標時，才升級到自有 Crabbox 容量：

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` 負責自有雲端檢查線的提供者、同步與 GitHub Actions 水合預設值。它會排除本機 `.git`，讓已水合的 Actions checkout 保留自己的遠端 Git 中繼資料，而不是同步維護者本機的遠端與物件儲存，並且會排除不應傳輸的本機執行期/建置成品。`.github/workflows/crabbox-hydrate.yml` 負責 checkout、Node/pnpm 設定、`origin/main` 擷取，以及自有雲端 `crabbox run --id <cbx_id>` 命令的非密鑰環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
