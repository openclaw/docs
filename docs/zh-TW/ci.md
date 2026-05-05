---
read_when:
    - 你需要了解 CI 作業為什麼有執行或沒有執行
    - 你正在偵錯一個失敗的 GitHub Actions 檢查
    - 你正在協調一次版本發布驗證的執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發布總括項目，以及本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-05T06:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 上執行。`preflight` job 會分類 diff，並在只有不相關區域變更時關閉昂貴的 lanes。手動 `workflow_dispatch` 執行會刻意略過智慧範圍限定，並為候選發行版本與廣泛驗證展開完整 graph。Android lanes 透過 `include_android` 維持選擇加入。僅限發行的 Plugin 覆蓋範圍位於獨立的 [`Plugin Prerelease`](#plugin-prerelease) workflow，且只會從 [`Full Release Validation`](#full-release-validation) 或明確的手動 dispatch 執行。

## Pipeline 概覽

| Job                              | 用途                                                                                                      | 執行時機                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、已變更的 scopes、已變更的 extensions，並建置 CI manifest                                  | 一律在非 draft 的推送與 PR 上執行 |
| `security-scm-fast`              | 透過 `zizmor` 偵測私密金鑰並稽核 workflow                                                                 | 一律在非 draft 的推送與 PR 上執行 |
| `security-dependency-audit`      | 針對 npm advisories 執行不需相依套件的 production lockfile 稽核                                           | 一律在非 draft 的推送與 PR 上執行 |
| `security-fast`                  | 快速安全性 jobs 的必要彙總                                                                               | 一律在非 draft 的推送與 PR 上執行 |
| `check-dependencies`             | 僅 production Knip 相依套件檢查，加上未使用檔案 allowlist guard                                           | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置 artifact 檢查，以及可重用的下游 artifacts                               | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性 lanes，例如 bundled/Plugin 合約/協定檢查                                                | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的 channel 合約檢查，並提供穩定的彙總檢查結果                                                        | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試 shards，不含 channel、bundled、contract 與 extension lanes                                 | Node 相關變更                      |
| `check`                          | 分片的主要本機 gate 等效項目：production types、lint、guards、test types 與 strict smoke                  | Node 相關變更                      |
| `check-additional`               | 架構、分片邊界/prompt drift、extension guards、package boundary 與 Gateway watch                          | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI smoke tests 與啟動記憶體 smoke                                                                 | Node 相關變更                      |
| `checks`                         | 已建置 artifact channel tests 的驗證器                                                                    | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke lane                                                                           | 發行版本的手動 CI dispatch         |
| `check-docs`                     | 文件格式、lint 與 broken-link 檢查                                                                        | 文件已變更                         |
| `skills-python`                  | Python-backed Skills 的 Ruff + pytest                                                                     | Python Skills 相關變更             |
| `checks-windows`                 | Windows 專用 process/path tests，加上 shared runtime import specifier regressions                         | Windows 相關變更                   |
| `macos-node`                     | 使用 shared built artifacts 的 macOS TypeScript test lane                                                 | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、build 與 tests                                                                   | macOS 相關變更                     |
| `android`                        | 兩種 flavors 的 Android unit tests，加上一個 debug APK build                                             | Android 相關變更                   |
| `test-performance-agent`         | 受信任活動後的每日 Codex slow-test 最佳化                                                                 | Main CI 成功或手動 dispatch        |
| `openclaw-performance`           | 每日/隨選 Kova runtime 效能報告，包含 mock-provider、deep-profile 與 GPT 5.4 live lanes                   | 排程與手動 dispatch                |

## Fail-fast 順序

1. `preflight` 決定哪些 lanes 實際存在。`docs-scope` 與 `changed-scope` 邏輯是這個 job 內的 steps，不是獨立 jobs。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 與 `skills-python` 會快速失敗，不需等待較重的 artifact 與 platform matrix jobs。
3. `build-artifacts` 會與快速 Linux lanes 重疊，讓下游消費者能在 shared build 準備好後立即開始。
4. 較重的 platform 與 runtime lanes 之後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 與 `android`。

當同一個 PR 或 `main` ref 有較新的推送落地時，GitHub 可能會將被取代的 jobs 標記為 `cancelled`。除非同一個 ref 的最新執行也失敗，否則將其視為 CI 雜訊。Aggregate shard checks 使用 `!cancelled() && always()`，因此它們仍會回報一般 shard failures，但不會在整個 workflow 已被取代後繼續排隊。自動 CI concurrency key 已版本化（`CI-v7-*`），因此 GitHub 端舊 queue group 中的 zombie 無法無限期阻擋較新的 main runs。手動 full-suite runs 使用 `CI-manual-v1-*`，且不會取消進行中的 runs。

## 範圍與路由

Scope 邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit tests 覆蓋。手動 dispatch 會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI workflow 編輯**會驗證 Node CI graph 與 workflow linting，但本身不會強制 Windows、Android 或 macOS native builds；這些 platform lanes 仍限定於 platform source changes。
- **僅限 CI routing 的編輯、選定的便宜 core-test fixture 編輯，以及狹窄的 Plugin contract helper/test-routing 編輯**會使用快速 Node-only manifest path：`preflight`、security，以及單一 `checks-fast-core` task。當變更僅限於該快速 task 直接執行的 routing 或 helper surfaces 時，該 path 會略過 build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-Plugin shards 與 additional guard matrices。
- **Windows Node checks** 的範圍限定於 Windows 專用 process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該 lane 的 CI workflow surfaces；不相關的 source、Plugin、install-smoke 與 test-only changes 會留在 Linux Node lanes。

最慢的 Node test families 會被拆分或平衡，讓每個 job 維持小型且不過度保留 runners：channel contracts 會作為三個加權 shards 執行，core unit fast/support lanes 會分開執行，core runtime infra 會拆分為 state 與 process/config shards，auto-reply 會作為平衡 workers 執行（reply subtree 拆分為 agent-runner、dispatch 與 commands/state-routing shards），而 agentic gateway/server configs 會拆分到 chat/auth/model/http-Plugin/runtime/startup lanes，而不是等待 built artifacts。廣泛的 browser、QA、media 與 miscellaneous Plugin tests 使用其專用 Vitest configs，而不是 shared Plugin catch-all。Include-pattern shards 會使用 CI shard name 記錄 timing entries，因此 `.artifacts/vitest-shard-timings.json` 可區分整個 config 與 filtered shard。`check-additional` 會將 package-boundary compile/canary work 保持在一起，並將 runtime topology architecture 與 gateway watch coverage 分開；boundary guard list 會橫向分配到四個 matrix shards，每個 shard 都會同時執行選定的獨立 guards，並印出每項 check timing，包含 `pnpm prompt:snapshots:check`，因此 Codex runtime happy-path prompt drift 會被固定到造成它的 PR。Gateway watch、channel tests 與 core support-boundary shard 會在 `dist/` 與 `dist-runtime/` 已建置後，於 `build-artifacts` 內並行執行。

Android CI 會執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test lane 仍會使用 SMS/call-log BuildConfig flags 編譯該 flavor，同時避免在每次 Android 相關推送時執行重複的 debug APK packaging job。

`check-dependencies` shard 會執行 `pnpm deadcode:dependencies`（一個 production Knip dependency-only pass，固定到最新 Knip 版本，且為 `dlx` install 停用 pnpm 的 minimum release age）與 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file findings 與 `scripts/deadcode-unused-files.allowlist.mjs` 比較。當 PR 新增未經審查的 unused file，或留下過時的 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的刻意 dynamic Plugin、generated、build、live-test 與 package bridge surfaces。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository activity 到 ClawSweeper 的目標端 bridge。它不會 checkout 或執行不受信任的 pull request code。該 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payloads dispatch 到 `openclaw/clawsweeper`。

該 workflow 有四個 lanes：

- `clawsweeper_item` 用於精確 issue 與 pull request review requests；
- `clawsweeper_comment` 用於 issue comments 中的明確 ClawSweeper commands；
- `clawsweeper_commit_review` 用於 `main` pushes 上的 commit-level review requests；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub activity。

`github_activity` lane 只轉送標準化 metadata：event type、action、actor、repository、item number、URL、title、state，以及存在時的 comments 或 reviews 短摘錄。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的接收 workflow 是 `.github/workflows/github-activity.yml`，它會將標準化 event 發佈到 ClawSweeper agent 的 OpenClaw Gateway hook。

一般活動是 observation，而不是預設 delivery。ClawSweeper agent 會在其 prompt 中收到 Discord target，且只有在 event 令人意外、可行動、有風險或對營運有用時，才應發佈到 `#clawsweeper`。例行的開啟、編輯、bot churn、重複 webhook 雜訊與一般 review traffic 應產生 `NO_REPLY`。

在整個路徑中，將 GitHub titles、comments、bodies、review text、branch names 與 commit messages 視為不受信任的資料。它們是 summarization 與 triage 的輸入，不是 workflow 或 agent runtime 的指令。

## 手動 dispatches

手動 CI 派送會執行與一般 CI 相同的作業圖，但會強制啟用所有非 Android 範圍的路徑：Linux Node 分片、隨附 Plugin 分片、channel contract、Node 22 相容性、`check`、`check-additional`、建置 smoke、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI 派送只會在 `include_android=true` 時執行 Android；完整發布總控流程會透過傳入 `include_android=true` 啟用 Android。Plugin 預發布靜態檢查、僅發布用的 `agentic-plugins` 分片、完整 extension 批次掃描，以及 Plugin 預發布 Docker 路徑都不包含在 CI 中。Docker 預發布套件只會在 `Full Release Validation` 以啟用 release-validation gate 的方式派送獨立的 `Plugin Prerelease` workflow 時執行。

手動執行會使用唯一的並行群組，因此候選發布版本的完整套件不會被同一 ref 上的另一個 push 或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫者在使用所選派送 ref 的 workflow 檔案時，針對分支、標籤或完整 commit SHA 執行該圖。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | 作業                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性作業與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/隨附檢查、分片 channel contract 檢查、除 lint 外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith 矩陣可以更早排入佇列 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低負載的 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`，以及 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、隨附 Plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 夠敏感，8 vCPU 的成本高於節省的時間）；install-smoke Docker 建置（32-vCPU 的排隊時間成本高於節省的時間）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本機對應命令

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

`OpenClaw Performance` 是產品/執行階段效能 workflow。它每天在 `main` 上執行，也可以手動派送：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動派送通常會對 workflow ref 進行基準測試。設定 `target_ref` 可使用目前的 workflow 實作，對發布標籤或另一個分支進行基準測試。已發布的報告路徑與 latest 指標會以受測 ref 為 key，且每個 `index.md` 都會記錄受測 ref/SHA、workflow ref/SHA、Kova ref、profile、路徑驗證模式、模型、重複次數，以及 scenario 篩選器。

此 workflow 會從固定版本安裝 OCM，並從 `openclaw/Kova` 依固定的 `kova_ref` 輸入安裝 Kova，接著執行三個路徑：

- `mock-provider`：針對本機建置執行階段執行 Kova diagnostic scenario，並使用決定性的假 OpenAI 相容驗證。
- `mock-deep-profile`：針對啟動、Gateway 與 agent-turn 熱點進行 CPU/heap/trace profiling。
- `live-gpt54`：真實的 OpenAI `openai/gpt-5.4` agent turn，當 `OPENAI_API_KEY` 無法使用時會略過。

mock-provider 路徑也會在 Kova 通過後執行 OpenClaw 原生原始碼探測：在預設、hook 與 50-Plugin 啟動情境下的 Gateway 啟動時間與記憶體；重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈；以及針對已啟動 Gateway 的 CLI 啟動命令。原始碼探測的 Markdown 摘要位於報告 bundle 中的 `source/index.md`，原始 JSON 則在其旁邊。

每個路徑都會上傳 GitHub artifacts。當 `CLAWGRIT_REPORTS_TOKEN` 已設定時，此 workflow 也會將 `report.json`、`report.md`、bundle、`index.md` 與原始碼探測 artifacts commit 到 `openclaw/clawgrit-reports` 中的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。目前受測 ref 的指標會寫入 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發布驗證

`Full Release Validation` 是「發布前執行所有項目」的手動總控 workflow。它接受分支、標籤或完整 commit SHA，派送以該目標為對象的手動 `CI` workflow，派送 `Plugin Prerelease` 以取得僅發布用的 Plugin/package/static/Docker 證明，並派送 `OpenClaw Release Checks` 以執行安裝 smoke、package acceptance、跨 OS package 檢查、QA Lab parity、Matrix 與 Telegram 路徑。穩定/預設執行會將完整 live/E2E 與 Docker 發布路徑涵蓋範圍保留在 `run_release_soak=true` 之後；`release_profile=full` 會強制啟用該 soak 涵蓋範圍，讓廣泛 advisory 驗證維持廣泛。使用 `rerun_group=all` 與 `release_profile=full` 時，它也會針對來自 release checks 的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳入 `npm_telegram_package_spec` 可針對已發布的 npm package 重新執行相同的 Telegram package 路徑。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解
階段矩陣、確切的 workflow 作業名稱、profile 差異、artifacts，以及
聚焦重新執行的 handle。

`OpenClaw Release Publish` 是手動的變更發布 workflow。請在發布標籤已存在且
OpenClaw npm preflight 已成功後，從 `release/YYYY.M.D` 或 `main` 派送它。
它會驗證 `pnpm plugins:sync:check`，為所有可發布的 Plugin package 派送
`Plugin NPM Release`，為相同的發布 SHA 派送 `Plugin ClawHub Release`，
然後才使用已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得固定 commit 證明，請使用 helper，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow 派送 ref 必須是分支或標籤，不能是原始 commit SHA。此
helper 會在目標 SHA 推送臨時的 `release-ci/<sha>-...` 分支，
從該固定 ref 派送 `Full Release Validation`，驗證每個子
workflow 的 `headSha` 都符合目標，並在執行完成時刪除臨時分支。
如果任何子 workflow 在不同的 SHA 上執行，總控驗證器也會失敗。

`release_profile` 控制傳入發布檢查的即時/提供者涵蓋範圍。
手動發布工作流程預設為 `stable`；只有在你有意使用廣泛的諮詢性提供者/媒體矩陣時，才使用 `full`。`run_release_soak`
控制 stable/預設發布檢查是否執行完整的即時/E2E 與
Docker 發布路徑 soak；`full` 會強制啟用 soak。

- `minimum` 保留最快的 OpenAI/核心發布關鍵 lane。
- `stable` 加入穩定的提供者/後端集合。
- `full` 執行廣泛的諮詢性提供者/媒體矩陣。

總括工作流程會記錄已派發的子執行 ID，而最終的 `Verify full validation` 工作會重新檢查目前子執行結論，並為每個子執行附加最慢工作表。如果子工作流程重新執行後轉為綠燈，只要重新執行父驗證器工作，即可重新整理總括結果與時間摘要。

若要復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。發布候選版本使用 `all`，只有一般完整 CI 子項使用 `ci`，只有 Plugin 預發布子項使用 `plugin-prerelease`，每個發布子項使用 `release-checks`，或在總括工作流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會讓失敗的發布機器在專注修正後保持重新執行範圍有限。針對單一失敗的跨 OS lane，將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 搭配使用，例如 `windows/packaged-upgrade`；長時間跨 OS 命令會輸出 heartbeat 行，而 packaged-upgrade 摘要會包含每階段時間。QA 發布檢查 lane 屬於諮詢性質，因此僅 QA 失敗會警告，但不會阻擋發布檢查驗證器。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將選取的 ref 解析一次為 `release-package-under-test` tarball，然後將該成品傳給跨 OS 檢查與套件驗收，並在執行 soak 涵蓋範圍時傳給即時/E2E 發布路徑 Docker 工作流程。這能讓發布機器之間的套件位元組保持一致，並避免在多個子工作中重新打包同一個候選版本。

針對 `ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的總括工作流程。父監控器在父工作流程被取消時，會取消任何已派發的子工作流程，因此較新的 main 驗證不會卡在過期的兩小時發布檢查執行之後。發布分支/標籤驗證與聚焦重新執行群組會保留 `cancel-in-progress: false`。

## 即時與 E2E 分片

發布即時/E2E 子項會保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是單一序列工作：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 提供者篩選的 `native-live-src-gateway-profiles` 工作
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的媒體音訊/影片分片，以及提供者篩選的音樂分片

這會保留相同的檔案涵蓋範圍，同時讓緩慢的即時提供者失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生即時媒體分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；媒體工作只會在設定前驗證二進位檔。將 Docker 支援的即時套件保留在一般 Blacksmith runner 上，容器工作並不適合啟動巢狀 Docker 測試。

Docker 支援的即時模型/後端分片會針對每個選取的提交使用另一個共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發布工作流程會建置並推送該映像一次，然後 Docker 即時模型、提供者分片 Gateway、CLI 後端、ACP bind 與 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片會攜帶明確的指令碼層級 `timeout` 上限，且低於工作流程工作逾時，因此卡住的容器或清理路徑會快速失敗，而不是耗盡整個發布檢查預算。如果這些分片各自重新建置完整原始碼 Docker 目標，代表發布執行設定錯誤，會把時間浪費在重複映像建置上。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證原始碼樹，而套件驗收會透過使用者在安裝或更新後執行的相同 Docker E2E harness，驗證單一 tarball。

### 工作

1. `resolve_package` 會簽出 `workflow_ref`、解析一個套件候選版本、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 與 profile。
2. `docker_acceptance` 以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備套件摘要 Docker 映像，並針對該套件執行選取的 Docker lane，而不是打包工作流程簽出內容。當 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會準備一次套件與共用映像，然後將這些 lane 展開為平行目標 Docker 工作，且每個工作都有唯一成品。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，並在套件驗收已解析套件時安裝相同的 `package-under-test` 成品；獨立 Telegram 派發仍可安裝已發布的 npm 規格。
4. `summary` 會在套件解析、Docker 驗收或可選 Telegram lane 失敗時使工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。將此用於已發布的預發布/穩定版驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤、驗證選取的提交可從儲存庫分支歷史或發布標籤觸及、在 detached worktree 中安裝相依項，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；`package_sha256` 為必填。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選填，但外部共享成品應提供。

請將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是 `source=ref` 時會被打包的原始碼提交。這讓目前的測試 harness 能驗證較舊的受信任原始碼提交，而不需要執行舊的工作流程邏輯。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 確切的 `docker_lanes`；當 `suite_profile=custom` 時為必填

`package` profile 使用離線 Plugin 涵蓋範圍，因此已發布套件驗證不會受即時 ClawHub 可用性限制。可選的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm 規格路徑供獨立派發使用。

如需專用的更新與 Plugin 測試政策，包括本機命令、Docker lane、套件驗收輸入、發布預設值與失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、準備好的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、過期 Plugin 相依項清理、已設定 Plugin 安裝修復、離線 Plugin、Plugin 更新與 Telegram 證明，都使用同一個已解析套件 tarball。設定完整發布驗證或 OpenClaw 發布檢查上的 `package_acceptance_package_spec`，即可針對已出貨的 npm 套件而非 SHA 建置成品執行相同矩陣。跨 OS 發布檢查仍涵蓋 OS 特定的 onboarding、安裝程式與平台行為；套件/更新產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker lane 會在阻擋發布路徑中，於每次執行驗證一個已發布套件基準。在套件驗收中，已解析的 `package-under-test` tarball 一律是候選版本，而 `published_upgrade_survivor_baseline` 會選取備援的已發布基準，預設為 `openclaw@latest`；失敗 lane 重新執行命令會保留該基準。使用 `run_release_soak=true` 或 `release_profile=full` 的完整發布驗證會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展涵蓋四個最新穩定 npm 發布版，加上針對 Plugin 相容性邊界發布版與問題形狀 fixture 釘選的版本，涵蓋 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、波浪號記錄路徑，以及過期 legacy Plugin 相依項根目錄。多基準 published-upgrade survivor 選取會依基準分片為獨立的目標 Docker runner 工作。獨立的 `Update Migration` 工作流程會在問題是完整的已發布更新清理，而不是一般完整發布 CI 涵蓋範圍時，使用 `update-migration` Docker lane 搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本機彙總執行可以使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入確切套件規格，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 來使用情境矩陣。已發布 lane 會使用內建的 `openclaw config set` 命令 recipe 設定基準，將 recipe 步驟記錄到 `summary.json`，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 以及 RPC 狀態。Windows packaged 與 installer fresh lane 也會驗證已安裝套件可以從原始絕對 Windows 路徑匯入瀏覽器控制覆寫。OpenAI 跨 OS agent-turn smoke 在設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因此安裝與 Gateway 證明會維持在 GPT-5 測試模型上，同時避免 GPT-4.x 預設值。

### Legacy 相容性窗口

套件驗收對已發布套件有有限的 legacy 相容性窗口。直到 `2026.4.25` 的套件，包括 `2026.4.25-beta.*`，都可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從 tarball 衍生的 fake git fixture 中修剪缺少的 `pnpm.patchedDependencies`，並且可以記錄缺少的持久化 `update.channel`；
- Plugin smoke 可以讀取 legacy 安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可以允許設定中繼資料遷移，同時仍要求安裝記錄與 no-reinstall 行為保持不變。

已發布的 `2026.4.26` 套件也可能會對已出貨的本機建置中繼資料戳記檔案提出警告。後續套件必須符合現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，以確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道記錄、階段計時與重新執行命令。請優先重新執行失敗的套件設定檔或精確的 Docker 通道，而不是重新執行完整發布驗證。

## 安裝煙霧測試

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重用相同的範圍腳本。它會將煙霧測試覆蓋範圍拆分為 `run_fast_install_smoke` 與 `run_full_install_smoke`。

- **快速路徑**會在 Pull Request 觸及 Docker/套件表面、隨附 Plugin 套件/資訊清單變更，或 Docker 煙霧測試作業會涵蓋的核心 Plugin/通道/Gateway/Plugin SDK 表面時執行。僅來源的隨附 Plugin 變更、僅測試編輯與僅文件編輯不會保留 Docker worker。快速路徑會建置根 Dockerfile 映像一次、檢查 CLI、執行代理刪除共用工作區 CLI 煙霧測試、執行容器 Gateway 網路 E2E、驗證隨附擴充套件建置引數，並在 240 秒彙總命令逾時內執行有界限的隨附 Plugin Docker 設定檔（每個情境的 Docker 執行會分別設限）。
- **完整路徑**會為夜間排程執行、手動派送、工作流程呼叫發布檢查，以及真正觸及安裝程式/套件/Docker 表面的 Pull Request 保留 QR 套件安裝與安裝程式 Docker/更新覆蓋範圍。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 煙霧測試映像，然後以獨立作業執行 QR 套件安裝、根 Dockerfile/Gateway 煙霧測試、安裝程式/更新煙霧測試，以及快速隨附 Plugin Docker E2E，使安裝程式工作不必等待根映像煙霧測試完成。

`main` 推送（包含合併提交）不會強制使用完整路徑；當變更範圍邏輯會在推送時要求完整覆蓋範圍，工作流程會保留快速 Docker 煙霧測試，並將完整安裝煙霧測試留給夜間或發布驗證。

較慢的 Bun 全域安裝映像提供者煙霧測試會由 `run_bun_global_install_smoke` 另外控管。它會在夜間排程與發布檢查工作流程中執行，手動 `Install Smoke` 派送也可以選擇加入，但 Pull Request 與 `main` 推送不會執行。QR 與安裝程式 Docker 測試會保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用即時測試映像，將 OpenClaw 封裝一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/更新/Plugin 相依性通道的裸 Node/Git 執行器；
- 將相同 tarball 安裝到 `/app` 的功能映像，用於一般功能通道。

Docker 通道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，執行器只會執行選取的計畫。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個通道選取映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行通道。

### 可調整項目

| 變數                                   | 預設值 | 用途                                                                                          |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | 一般通道的主集區槽位數。                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | 提供者敏感尾端集區槽位數。                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | 並行即時通道上限，避免提供者限流。                                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | 並行 npm 安裝通道上限。                                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | 並行多服務通道上限。                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | 通道啟動之間的錯開時間，用來避免 Docker daemon 建立風暴；設為 `0` 表示不錯開。               |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每通道備援逾時（120 分鐘）；選取的即時/尾端通道會使用更嚴格的上限。                         |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定 | `1` 會列印排程器計畫而不執行通道。                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定 | 以逗號分隔的精確通道清單；略過清理煙霧測試，讓代理可以重現一個失敗通道。                    |

比有效上限更重的通道仍可從空集區啟動，然後獨自執行，直到釋放容量為止。本機彙總會預先檢查 Docker、移除過期的 OpenClaw E2E 容器、發出使用中通道狀態、保存通道計時以進行最長優先排序，並預設在第一次失敗後停止排程新的集區通道。

### 可重用的即時/E2E 工作流程

可重用的即時/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、即時映像、通道與憑證覆蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 封裝 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball 庫存；在計畫需要已安裝套件的通道時，透過 Blacksmith 的 Docker 層快取建置並推送以套件摘要標記的裸/功能 GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或既有套件摘要映像，而不是重新建置。Docker 映像拉取會以每次嘗試有界限的 180 秒逾時重試，因此卡住的 registry/cache 串流會快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發布路徑分塊

發布 Docker 覆蓋範圍會使用較小的分塊作業搭配 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行，因此每個分塊只會拉取所需的映像種類，並透過相同的加權排程器執行多個通道：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發布 Docker 分塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍為彙總 Plugin/執行階段別名。`install-e2e` 通道別名仍為兩個提供者安裝程式通道的彙總手動重新執行別名。

當完整發布路徑覆蓋範圍要求時，OpenWebUI 會併入 `plugins-runtime-services`，且僅對 OpenWebUI 專用派送保留獨立的 `openwebui` 分塊。隨附通道更新通道會針對暫時性 npm 網路失敗重試一次。

每個分塊都會上傳 `.artifacts/docker-tests/`，其中包含通道記錄、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢通道表格，以及每通道重新執行命令。工作流程 `docker_lanes` 輸入會針對已準備的映像執行選取的通道，而不是執行分塊作業，這會將失敗通道偵錯限制在一個目標 Docker 作業中，並為該次執行準備、下載或重用套件成品；如果選取的通道是即時 Docker 通道，目標作業會在本機為該次重新執行建置即時測試映像。產生的每通道 GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 與已準備映像輸入，因此失敗通道可以重用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的即時/E2E 工作流程會每天執行完整發布路徑 Docker 套件。

## Plugin 預發布

`Plugin Prerelease` 是成本較高的產品/套件覆蓋範圍，因此它是由 `Full Release Validation` 或明確操作員派送的獨立工作流程。一般 Pull Request、`main` 推送與獨立手動 CI 派送會關閉該套件。它會在八個擴充套件 worker 之間平衡隨附 Plugin 測試；這些擴充套件分片作業一次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest worker 與較大的 Node heap，讓匯入繁重的 Plugin 批次不會建立額外的 CI 作業。僅發布的 Docker 預發布路徑會以小群組批次處理目標 Docker 通道，避免為一到三分鐘的作業保留數十個 runner。

## QA 實驗室

QA 實驗室有專用的 CI 通道，位於主要智慧範圍工作流程之外。代理式同等性嵌套在廣泛 QA 與發布測試框架下，不是獨立的 PR 工作流程。當同等性應隨廣泛驗證執行一起進行時，請使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會每晚在 `main` 與手動派送時執行；它會將 mock 同等性通道、即時 Matrix 通道，以及即時 Telegram 與 Discord 通道扇出為平行作業。即時作業使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex 租約。

發布檢查會以確定性的 mock 提供者與 mock 限定模型（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram 即時傳輸通道，因此通道合約會與即時模型延遲和一般提供者 Plugin 啟動隔離。即時傳輸 Gateway 會停用記憶體搜尋，因為 QA 同等性會另外涵蓋記憶體行為；提供者連線能力則由獨立的即時模型、原生提供者與 Docker 提供者套件涵蓋。

Matrix 會在排程與發布門檻中使用 `--profile fast`，只有在簽出的 CLI 支援時才加入 `--fail-fast`。CLI 預設與手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 派送一律會將完整 Matrix 覆蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發布核准前執行發布關鍵 QA 實驗室通道；其 QA 同等性門檻會將候選與基準封裝作為平行通道作業執行，然後將兩個成品下載到小型報告作業中，以進行最終同等性比較。

對於一般 PR，請遵循範圍化的 CI/檢查證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意作為範圍狹窄的第一輪安全掃描器，而不是完整的儲存庫掃描。每日、手動與非草稿 pull request 防護執行會掃描 Actions workflow 程式碼，以及最高風險的 JavaScript/TypeScript 表面，並使用高信心安全查詢，篩選為高/重大 `security-severity`。

pull request 防護保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的變更啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 與 macOS CodeQL 不納入 PR 預設值。

### 安全分類

| 分類                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、祕密、沙箱、cron 與 gateway 基準                                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | 核心 channel 實作合約，加上 channel Plugin runtime、gateway、Plugin SDK、祕密、稽核接觸點                                          |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、web-fetch 與 Plugin SDK SSRF 政策表面                                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行 helper、對外傳遞與 agent 工具執行閘門                                                                          |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、loader、manifest、registry、package-manager 安裝、source-loading 與 Plugin SDK package 合約信任表面                   |

### 平台專屬安全 shard

- `CodeQL Android Critical Security` — 排程 Android 安全 shard。在 workflow sanity 接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android app。上傳到 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全 shard。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中篩除 dependency build 結果，並上傳到 `/codeql-critical-security/macos`。保留在每日預設值之外，因為即使乾淨，macOS build 仍主導 runtime。

### Critical Quality 分類

`CodeQL Critical Quality` 是對應的非安全 shard。它只會在較小的 Blacksmith Linux runner 上，對狹窄且高價值的表面執行 error-severity、非安全的 JavaScript/TypeScript 品質查詢。它的 pull request 防護刻意比排程 profile 更小：非草稿 PR 只會針對 agent command/model/tool execution 與 reply dispatch 程式碼、config schema/migration/IO 程式碼、auth/secrets/sandbox/security 程式碼、核心 channel 與 bundled channel Plugin runtime、gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、plugin loader、Plugin SDK/package-contract 或 Plugin SDK reply runtime 變更，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 與 `plugin-sdk-reply-runtime` shard。CodeQL config 與品質工作流程變更會執行全部十二個 PR 品質 shard。

手動 dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄 profile 是用來單獨執行一個品質 shard 的教學/迭代 hook。

| 分類                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、祕密、沙箱、cron 與 gateway 安全邊界程式碼                                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config schema、migration、normalization 與 IO 合約                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemas 與 server method 合約                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心 channel 與 bundled channel Plugin 實作合約                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution、model/provider dispatch、auto-reply dispatch 與 queues，以及 ACP control-plane runtime 合約                                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與 tool bridges、process supervision helpers，以及 outbound delivery 合約                                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK、memory runtime facades、memory Plugin SDK aliases、memory runtime activation glue 與 memory doctor commands                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals、session delivery queues、outbound session binding/delivery helpers、diagnostic event/log bundle surfaces 與 session doctor CLI 合約        |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch、reply payload/chunking/runtime helpers、channel reply options、delivery queues 與 session/thread binding helpers               |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization、provider auth 與 discovery、provider runtime registration、provider defaults/catalogs，以及 web/search/fetch/embedding registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap、local persistence、gateway control flows 與 task control-plane runtime 合約                                                                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、media IO、media understanding、image-generation 與 media-generation runtime 合約                                                           |
| `/codeql-critical-quality/plugin-boundary`              | Loader、registry、public-surface 與 Plugin SDK entrypoint 合約                                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發佈 package 端 Plugin SDK source 與 plugin package contract helpers                                                                                            |

品質與安全分開，以便品質發現可以被排程、衡量、停用或擴充，而不會模糊安全訊號。Swift、Python 與 bundled-plugin CodeQL 擴充，應只在狹窄 profile 具備穩定 runtime 與訊號後，作為範圍化或 sharded follow-up work 加回。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護路線，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI run 可以觸發它，手動 dispatch 也可以直接執行它。Workflow-run invocation 會在 `main` 已推進，或過去一小時內已建立另一個未跳過的 Docs Agent run 時跳過。執行時，它會審查從上一個未跳過的 Docs Agent source SHA 到目前 `main` 的 commit range，因此一次每小時執行可以涵蓋自上次文件 pass 以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護路線，用於處理慢速測試。它沒有純排程：`main` 上成功的非 bot push CI run 可以觸發它，但如果另一個 workflow-run invocation 在同一個 UTC 日已執行或正在執行，它會跳過。手動 dispatch 會繞過該每日活動閘門。這條路線會建立 full-suite grouped Vitest performance report，讓 Codex 只進行小型且保留覆蓋率的測試效能修正，而不是大範圍重構；接著重新執行 full-suite report，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，且 after-agent full-suite report 必須通過後才會 commit。當 `main` 在 bot push 落地前推進，這條路線會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期 patch 會被跳過。它使用 GitHub-hosted Ubuntu，讓 Codex action 可以保持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是手動 maintainer 工作流程，用於落地後的重複項清理。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 前，它會確認已落地 PR 已合併，且每個重複項都有共用的 referenced issue 或重疊的 changed hunks。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門在架構邊界上比廣泛的 CI 平台範圍更嚴格：

- 核心 production 變更會執行 core prod 與 core test typecheck，加上 core lint/guards；
- 僅核心測試變更只會執行 core test typecheck，加上 core lint；
- extension production 變更會執行 extension prod 與 extension test typecheck，加上 extension lint；
- 僅 extension 測試變更會執行 extension test typecheck，加上 extension lint；
- public Plugin SDK 或 plugin-contract 變更會擴展到 extension typecheck，因為 extensions 依賴那些核心合約（Vitest extension sweeps 仍是明確的測試工作）；
- 僅 release metadata 的 version bumps 會執行目標式 version/config/root-dependency 檢查；
- 未知的 root/config 變更會 fail safe 到所有檢查路線。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，source edits 優先使用明確 mappings，接著是 sibling tests 與 import-graph dependents。Shared group-room delivery config 是明確 mappings 之一：對 group visible-reply config、source reply delivery mode 或 message-tool system prompt 的變更，會透過 core reply tests 加上 Discord 與 Slack delivery regressions 路由，讓 shared default change 在第一次 PR push 前失敗。只有當變更廣及整個 harness，使便宜的 mapped set 不是可信 proxy 時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從儲存庫根目錄執行 Testbox，並優先使用新預熱的 box 進行廣泛證明。在對重複使用、過期，或剛回報異常大量同步的 box 花時間跑緩慢 gate 之前，請先在該 box 內執行 `pnpm testbox:sanity`。

當必要的根目錄檔案如 `pnpm-lock.yaml` 消失，或 `git status --short` 顯示至少 200 個已追蹤刪除項目時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；請停止該 box 並改為預熱新的 box，而不是除錯產品測試失敗。對於刻意大量刪除的 PR，請為該次健全性執行設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該防護，或針對異常大的本機 diff 使用更大的毫秒值。

Crabbox 是儲存庫擁有的遠端 box wrapper，用於維護者 Linux 證明。當檢查對本機編輯迴圈而言太廣泛、CI 對等性很重要，或證明需要密鑰、Docker、package lanes、可重複使用的 box，或遠端記錄時，請使用它。一般的 OpenClaw backend 是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是在 Blacksmith 中斷、配額問題，或明確要測試自有容量時的備援。

第一次執行前，請從儲存庫根目錄檢查 wrapper：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果 Crabbox 二進位檔過舊且未標示支援 `blacksmith-testbox`，儲存庫 wrapper 會拒絕執行。即使 `.crabbox.yaml` 有自有雲端預設值，也請明確傳入 provider。

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

閱讀最終 JSON 摘要。有用的欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。由 Blacksmith 支援的一次性 Crabbox 執行應會自動停止 Testbox；如果執行被中斷或清理狀態不明，請檢查即時 box，並只停止你建立的 box：

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要在同一個已完成 hydrate 的 box 上執行多個命令時，才使用重複使用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果壞掉的是 Crabbox 這一層，但 Blacksmith 本身可用，請使用直接 Blacksmith 作為狹窄備援：

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確以自有容量為目標時，才升級到自有 Crabbox 容量：

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` 擁有自有雲端 lanes 的 provider、sync 和 GitHub Actions hydrate 預設值。它會排除本機 `.git`，因此已 hydrate 的 Actions checkout 會保留自己的遠端 Git metadata，而不是同步維護者本機 remotes 和 object stores；它也會排除不應傳輸的本機 runtime/build artifacts。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` 擷取，以及自有雲端 `crabbox run --id <cbx_id>` 命令的非機密環境交接。

## 相關

- [安裝概觀](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
