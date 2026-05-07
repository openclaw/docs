---
read_when:
    - 你需要了解 CI 作業為什麼有執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調發行驗證的執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發布總括作業，以及本機指令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-07T01:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 時執行。`preflight` job 會分類 diff，並在只有不相關區域變更時關閉昂貴的 lanes。手動 `workflow_dispatch` 執行會刻意略過智慧範圍界定，並為 release candidates 和廣泛驗證展開完整圖形。Android lanes 仍透過 `include_android` 維持 opt-in。僅限 release 的 Plugin 覆蓋位於獨立的 [`Plugin Prerelease`](#plugin-prerelease) workflow，且只會從 [`Full Release Validation`](#full-release-validation) 或明確的手動 dispatch 執行。

## Pipeline 概覽

| Job                              | 用途                                                                                                   | 執行時機                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測 docs-only 變更、changed scopes、changed extensions，並建置 CI manifest                   | 一律在非 draft 的推送與 PR 上執行 |
| `security-scm-fast`              | 透過 `zizmor` 進行私密金鑰偵測與 workflow 稽核                                                     | 一律在非 draft 的推送與 PR 上執行 |
| `security-dependency-audit`      | 針對 npm advisories 進行不需相依項的 production lockfile 稽核                                          | 一律在非 draft 的推送與 PR 上執行 |
| `security-fast`                  | 快速安全性 jobs 的必要彙總                                                             | 一律在非 draft 的推送與 PR 上執行 |
| `check-dependencies`             | Production Knip dependency-only pass，加上 unused-file allowlist guard                                 | Node 相關變更              |
| `build-artifacts`                | 建置 `dist/`、Control UI、built-artifact checks，以及可重複使用的下游 artifacts                       | Node 相關變更              |
| `checks-fast-core`               | 快速 Linux 正確性 lanes，例如 bundled/plugin-contract/protocol checks                              | Node 相關變更              |
| `checks-fast-contracts-channels` | Sharded channel contract checks，並提供穩定的 aggregate check result                                      | Node 相關變更              |
| `checks-node-core-test`          | Core Node test shards，不含 channel、bundled、contract 與 extension lanes                          | Node 相關變更              |
| `check`                          | Sharded main local gate 等效項：prod types、lint、guards、test types，以及 strict smoke                | Node 相關變更              |
| `check-additional`               | Architecture、sharded boundary/prompt drift、extension guards、package boundary，以及 gateway watch        | Node 相關變更              |
| `build-smoke`                    | Built-CLI smoke tests 與 startup-memory smoke                                                            | Node 相關變更              |
| `checks`                         | Built-artifact channel tests 的 verifier                                                                 | Node 相關變更              |
| `checks-node-compat-node22`      | Node 22 compatibility build 與 smoke lane                                                                | Release 的手動 CI dispatch    |
| `check-docs`                     | Docs formatting、lint 與 broken-link checks                                                             | Docs 已變更                       |
| `skills-python`                  | Python-backed Skills 的 Ruff + pytest                                                                    | Python-skill 相關變更      |
| `checks-windows`                 | Windows-specific process/path tests，加上 shared runtime import specifier regressions                      | Windows 相關變更           |
| `macos-node`                     | 使用 shared built artifacts 的 macOS TypeScript test lane                                               | macOS 相關變更             |
| `macos-swift`                    | macOS app 的 Swift lint、build 與 tests                                                            | macOS 相關變更             |
| `android`                        | 兩種 flavors 的 Android unit tests，加上一個 debug APK build                                              | Android 相關變更           |
| `test-performance-agent`         | 受信任活動後的每日 Codex slow-test optimization                                                 | Main CI 成功或手動 dispatch |
| `openclaw-performance`           | 每日/隨選 Kova runtime performance reports，包含 mock-provider、deep-profile 與 GPT 5.4 live lanes | 排程與手動 dispatch      |

## Fail-fast 順序

1. `preflight` 決定哪些 lanes 實際存在。`docs-scope` 與 `changed-scope` 邏輯是此 job 內的 steps，而不是獨立 jobs。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 與 `skills-python` 會快速失敗，不需等待較重的 artifact 與 platform matrix jobs。
3. `build-artifacts` 會與快速 Linux lanes 重疊，因此下游 consumers 可在 shared build 就緒後立即開始。
4. 較重的 platform 與 runtime lanes 之後會展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 與 `android`。

當較新的推送落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的 jobs 標記為 `cancelled`。除非同一 ref 的最新 run 也失敗，否則將其視為 CI 雜訊。Aggregate shard checks 使用 `!cancelled() && always()`，因此仍會回報正常的 shard 失敗，但在整個 workflow 已被取代後不再排隊。自動 CI concurrency key 已版本化（`CI-v7-*`），因此 GitHub 端舊 queue group 中的 zombie 不會無限期阻擋較新的 main runs。手動 full-suite runs 使用 `CI-manual-v1-*`，且不會取消進行中的 runs。

`ci-timings-summary` job 會為每個非 draft CI run 上傳精簡的 `ci-timings-summary` artifact。它記錄目前 run 的 wall time、queue time、slowest jobs 與 failed jobs，因此 CI health checks 不需要反覆擷取完整的 Actions payload。

## 範圍與路由

Scope logic 位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit tests 覆蓋。Manual dispatch 會略過 changed-scope detection，並讓 preflight manifest 表現得像是每個 scoped area 都已變更。

- **CI workflow edits** 會驗證 Node CI graph 加上 workflow linting，但不會自行強制 Windows、Android 或 macOS native builds；那些 platform lanes 仍限定在 platform source changes。
- **CI routing-only edits、selected cheap core-test fixture edits，以及 narrow plugin contract helper/test-routing edits** 使用快速 Node-only manifest path：`preflight`、security，以及單一 `checks-fast-core` task。當變更僅限於 fast task 直接執行的 routing 或 helper surfaces 時，該路徑會略過 build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards 與 additional guard matrices。
- **Windows Node checks** 會限定在 Windows-specific process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該 lane 的 CI workflow surfaces；不相關的 source、Plugin、install-smoke 與 test-only changes 會留在 Linux Node lanes。

最慢的 Node test families 會被拆分或平衡，讓每個 job 保持小型且不過度保留 runners：channel contracts 以三個 weighted shards 執行，core unit fast/support lanes 分開執行，core runtime infra 拆成 state、process/config、Cron 與 shared shards，auto-reply 以 balanced workers 執行（reply subtree 拆成 agent-runner、dispatch 與 commands/state-routing shards），而 agentic gateway/server configs 會拆成 chat/auth/model/http-plugin/runtime/startup lanes，而不是等待 built artifacts。廣泛的 browser、QA、media 與 miscellaneous plugin tests 使用其專用 Vitest configs，而不是 shared plugin catch-all。Include-pattern shards 會使用 CI shard name 記錄 timing entries，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 與 filtered shard。`check-additional` 將 package-boundary compile/canary 工作保持在一起，並將 runtime topology architecture 與 gateway watch coverage 分開；boundary guard list 會條帶化到四個 matrix shards，每個 shard 會並行執行選定的 independent guards，並印出 per-check timings。昂貴的 Codex happy-path prompt snapshot drift check 僅針對手動 CI 與會影響 prompt 的變更執行，因此一般不相關的 Node changes 不會在 cold prompt snapshot generation 後等待，同時 prompt drift 仍會固定到造成它的 PR；相同 flag 會略過 built-artifact core support-boundary shard 內的 prompt snapshot Vitest generation。Gateway watch、channel tests 與 core support-boundary shard 會在 `dist/` 與 `dist-runtime/` 已建置完成後，於 `build-artifacts` 內並行執行。

Android CI 會執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，接著建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test lane 仍會使用 SMS/call-log BuildConfig flags 編譯該 flavor，同時避免在每次 Android-relevant push 上重複執行 debug APK packaging job。

`check-dependencies` shard 會執行 `pnpm deadcode:dependencies`（production Knip dependency-only pass，固定使用最新 Knip 版本，並針對 `dlx` install 停用 pnpm 的 minimum release age）以及 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file findings 與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的 unused file 或留下 stale allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的 intentional dynamic plugin、generated、build、live-test 與 package bridge surfaces。

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository activity 到 ClawSweeper 的 target-side bridge。它不會 checkout 或執行不受信任的 pull request code。此 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payloads dispatch 到 `openclaw/clawsweeper`。

此 workflow 有四個 lanes：

- `clawsweeper_item` 用於精確的 issue 與 pull request review requests；
- `clawsweeper_comment` 用於 issue comments 中明確的 ClawSweeper commands；
- `clawsweeper_commit_review` 用於 `main` pushes 上的 commit-level review requests；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub activity。

`github_activity` lane 只會轉送 normalized metadata：event type、action、actor、repository、item number、URL、title、state，以及存在時 comments 或 reviews 的 short excerpts。它刻意避免轉送完整的 webhook body。`openclaw/clawsweeper` 中的 receiving workflow 是 `.github/workflows/github-activity.yml`，會將 normalized event 發布到 ClawSweeper agent 的 OpenClaw Gateway hook。

General activity 是 observation，而不是 delivery-by-default。ClawSweeper agent 會在其 prompt 中收到 Discord target，且只有在 event 令人意外、可採取行動、有風險或對營運有用時，才應發布到 `#clawsweeper`。Routine opens、edits、bot churn、duplicate webhook noise 與 normal review traffic 應產生 `NO_REPLY`。

將 GitHub 標題、留言、內文、審查文字、分支名稱和提交訊息，在整個路徑中都視為不受信任的資料。它們是摘要與分流的輸入，不是工作流程或代理執行階段的指令。

## 手動派送

手動 CI 派送會執行與一般 CI 相同的作業圖，但會強制啟用每個非 Android 範圍的 lane：Linux Node 分片、內建 Plugin 分片、通道合約、Node 22 相容性、`check`、`check-additional`、建置煙霧測試、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI 派送只有在 `include_android=true` 時才會執行 Android；完整發行傘狀流程會透過傳入 `include_android=true` 啟用 Android。Plugin 預發行靜態檢查、僅發行使用的 `agentic-plugins` 分片、完整 extension 批次掃描，以及 Plugin 預發行 Docker lane 都會從 CI 中排除。Docker 預發行套件只會在 `Full Release Validation` 以啟用發行驗證 gate 的狀態派送獨立的 `Plugin Prerelease` 工作流程時執行。

手動執行使用唯一的並行群組，因此候選發行的完整套件不會被同一 ref 上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫者使用所選派送 ref 的工作流程檔案，對分支、標籤或完整提交 SHA 執行該作業圖。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                           | 作業                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、快速安全性作業與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速協定/合約/內建檢查、分片通道合約檢查、除了 lint 以外的 `check` 分片、`check-additional` 彙總、Node 測試彙總驗證器、文件檢查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith 矩陣可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低負載的 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、內建 Plugin 測試分片、`check-additional` 分片、`android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 足夠敏感，8 vCPU 的成本高於節省）；install-smoke Docker 建置（32-vCPU 的排隊時間成本高於節省）                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

標準儲存庫 CI 會將 Blacksmith 保持為預設執行器路徑。在 `preflight` 期間，`scripts/ci-runner-labels.mjs` 會檢查近期已排隊和進行中的 Actions 執行中是否有已排隊的 Blacksmith 作業。如果某個特定 Blacksmith 標籤已有已排隊作業，會使用該精確標籤的下游作業只在該次執行中退回對應的 GitHub 託管執行器（`ubuntu-24.04`、`windows-2025` 或 `macos-latest`）。同一 OS 系列中的其他 Blacksmith 規格會留在其主要標籤上。如果 API 探測失敗，則不套用退回。

## 本機對應項

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

手動派送通常會對工作流程 ref 進行基準測試。設定 `target_ref` 可使用目前的工作流程實作，對發行標籤或其他分支進行基準測試。已發布的報告路徑和 latest 指標會依測試 ref 建立鍵值，每個 `index.md` 都會記錄測試 ref/SHA、工作流程 ref/SHA、Kova ref、profile、lane 驗證模式、模型、重複次數和情境篩選器。

此工作流程會從固定的發行版本安裝 OCM，並從 `openclaw/Kova` 的固定 `kova_ref` 輸入安裝 Kova，然後執行三個 lane：

- `mock-provider`：使用具決定性的假 OpenAI 相容驗證，針對本機建置執行階段執行 Kova 診斷情境。
- `mock-deep-profile`：針對啟動、Gateway 和代理回合熱點進行 CPU/heap/trace profiling。
- `live-gpt54`：真正的 OpenAI `openai/gpt-5.4` 代理回合，在 `OPENAI_API_KEY` 無法使用時略過。

mock-provider lane 也會在 Kova pass 後執行 OpenClaw 原生來源探測：預設、hook 和 50-Plugin 啟動案例中的 Gateway 啟動時間與記憶體；重複的 mock-OpenAI `channel-chat-baseline` hello 迴圈；以及針對已啟動 Gateway 的 CLI 啟動命令。來源探測 Markdown 摘要位於報告套件中的 `source/index.md`，旁邊附有原始 JSON。

每個 lane 都會上傳 GitHub 成品。設定 `CLAWGRIT_REPORTS_TOKEN` 時，工作流程也會將 `report.json`、`report.md`、套件、`index.md` 和來源探測成品提交到 `openclaw/clawgrit-reports`，路徑為 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`。目前測試 ref 指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發行驗證

`Full Release Validation` 是「發行前執行全部項目」的手動傘狀工作流程。它接受分支、標籤或完整提交 SHA，使用該目標派送手動 `CI` 工作流程，派送 `Plugin Prerelease` 以取得僅發行使用的 Plugin/套件/靜態/Docker 證明，並派送 `OpenClaw Release Checks` 以執行安裝煙霧測試、套件接受測試、跨 OS 套件檢查、QA Lab parity、Matrix 和 Telegram lane。穩定/預設執行會將完整的 live/E2E 和 Docker 發行路徑涵蓋保留在 `run_release_soak=true` 後方；`release_profile=full` 會強制開啟該 soak 涵蓋，讓廣泛的 advisory 驗證保持廣泛。使用 `rerun_group=all` 和 `release_profile=full` 時，它也會針對來自 release checks 的 `release-package-under-test` 成品執行 `NPM Telegram Beta E2E`。發布後，傳入 `npm_telegram_package_spec` 可針對已發布的 npm 套件重新執行相同的 Telegram 套件 lane。

請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解階段矩陣、精確的工作流程作業名稱、profile 差異、成品，以及聚焦重新執行 handle。

`OpenClaw Release Publish` 是會變更狀態的手動發行工作流程。在發行標籤存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.D` 或 `main` 派送它。它會驗證 `pnpm plugins:sync:check`，為所有可發布的 Plugin 套件派送 `Plugin NPM Release`，為相同發行 SHA 派送 `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 派送 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得固定提交的證明，請使用輔助工具，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub 工作流程派送 ref 必須是分支或標籤，不能是原始提交 SHA。該輔助工具會在目標 SHA 推送一個暫時的 `release-ci/<sha>-...` 分支，從該固定 ref 派送 `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。傘狀驗證器也會在任何子工作流程於不同 SHA 執行時失敗。

`release_profile` 控制傳入發行檢查的即時/provider 涵蓋範圍。手動發行工作流程預設為 `stable`；只有在你有意使用廣泛的諮詢性 provider/media 矩陣時才使用 `full`。`run_release_soak` 控制 stable/預設發行檢查是否執行完整的即時/E2E 與 Docker 發行路徑 soak；`full` 會強制啟用 soak。

- `minimum` 保留最快的 OpenAI/核心發行關鍵 lanes。
- `stable` 加入穩定的 provider/backend 集合。
- `full` 執行廣泛的諮詢性 provider/media 矩陣。

傘狀流程會記錄已派送的子執行 ID，最後的 `Verify full validation` job 會重新檢查目前子執行的結論，並為每個子執行附加最慢 job 表格。如果子工作流程重新執行後轉為綠燈，只需重新執行父層驗證器 job，以重新整理傘狀結果與時間摘要。

復原時，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。發行候選版本使用 `all`，只針對一般完整 CI 子項使用 `ci`，只針對 Plugin 預發行子項使用 `plugin-prerelease`，針對每個發行子項使用 `release-checks`，或在傘狀流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能讓失敗的發行 box 在聚焦修復後，以受限範圍重新執行。若只有一個跨 OS lane 失敗，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合，例如 `windows/packaged-upgrade`；長時間跨 OS 指令會輸出 Heartbeat 行，而 packaged-upgrade 摘要會包含各階段時間。QA 發行檢查 lanes 是諮詢性的，因此只有 QA 失敗會警告，但不會阻擋發行檢查驗證器。

`OpenClaw Release Checks` 使用受信任的工作流程 ref，將所選 ref 解析一次成 `release-package-under-test` tarball，然後將該成品傳給跨 OS 檢查與 Package Acceptance，以及在執行 soak 覆蓋時傳給即時/E2E 發行路徑 Docker 工作流程。這能讓發行 box 之間的套件位元組保持一致，並避免在多個子 job 中重新封裝同一個候選版本。

針對 `ref=main` 且 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的傘狀流程。父層監控器會在父層被取消時，取消它已經派送的任何子工作流程，因此較新的 main 驗證不會卡在過期的兩小時發行檢查執行之後。發行分支/標籤驗證與聚焦重新執行群組會維持 `cancel-in-progress: false`。

## 即時與 E2E shards

發行即時/E2E 子項保留廣泛的原生 `pnpm test:live` 覆蓋，但會透過 `scripts/test-live-shard.mjs` 以具名 shards 執行，而不是單一序列 job：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 依 provider 篩選的 `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的 media audio/video shards，以及依 provider 篩選的 music shards

這會保留相同的檔案覆蓋，同時讓緩慢的即時 provider 失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` shard 名稱仍可用於手動一次性重新執行。

原生即時 media shards 會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；media jobs 只會在設定前驗證二進位檔。請將 Docker 支援的即時套件保留在一般 Blacksmith runners 上，container jobs 並不適合啟動巢狀 Docker 測試。

Docker 支援的即時模型/backend shards 會為每個所選提交使用獨立的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發行工作流程會建置並推送該映像一次，然後 Docker 即時模型、依 provider 分片的 Gateway、CLI backend、ACP bind 與 Codex harness shards 會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker shards 會帶有明確的 script-level `timeout` 上限，且低於工作流程 job timeout，因此卡住的 container 或清理路徑會快速失敗，而不是耗盡整個發行檢查預算。如果這些 shards 各自重新建置完整來源 Docker 目標，代表該發行執行設定錯誤，並會把牆鐘時間浪費在重複映像建置上。

## Package Acceptance

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證原始碼樹，而 package acceptance 會透過使用者在安裝或更新後執行的相同 Docker E2E harness，驗證單一 tarball。

### Jobs

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者作為 `package-under-test` 成品上傳，並在 GitHub step summary 中列印來源、工作流程 ref、套件 ref、版本、SHA-256 與 profile。
2. `docker_acceptance` 會呼叫 `openclaw-live-and-e2e-checks-reusable.yml`，並帶上 `ref=workflow_ref` 與 `package_artifact_name=package-under-test`。可重用工作流程會下載該成品、驗證 tarball 清單、在需要時準備 package-digest Docker 映像，並針對該套件執行所選 Docker lanes，而不是封裝工作流程 checkout。當 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件與共享映像一次，然後將這些 lanes 展開為平行的目標 Docker jobs，並使用唯一成品。
3. `package_telegram` 可選擇呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，且在 Package Acceptance 解析出套件時安裝同一個 `package-under-test` 成品；獨立 Telegram 派送仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker acceptance 或選用 Telegram lane 失敗時讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。請將此用於已發布的預發行/穩定 acceptance。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會 fetch OpenClaw 分支/標籤，驗證所選提交可從 repository 分支歷史或發行標籤到達，在 detached worktree 中安裝 deps，並使用 `scripts/package-openclaw-for-docker.mjs` 封裝。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 與 `artifact_name` 下載一個 `.tgz`；`package_sha256` 可選，但應為外部共享成品提供。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是在 `source=ref` 時會被封裝的來源提交。這讓目前的測試 harness 能驗證較舊的受信任來源提交，而不必執行舊的工作流程邏輯。

### 套件 profiles

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 搭配 OpenWebUI 的完整 Docker 發行路徑 chunks
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` profile 使用離線 Plugin 覆蓋，因此已發布套件驗證不會受限於即時 ClawHub 可用性。選用的 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm spec 路徑供獨立派送使用。

關於專用更新與 Plugin 測試政策，包括本機指令、Docker lanes、Package Acceptance 輸入、發行預設值與失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發行檢查會以 `source=artifact`、準備好的發行套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` 與 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這會讓套件遷移、更新、過期 Plugin dependency 清理、已設定 Plugin 安裝修復、離線 Plugin、Plugin 更新與 Telegram 證明都使用同一個已解析套件 tarball。在 Full Release Validation 或 OpenClaw Release Checks 上設定 `package_acceptance_package_spec`，即可針對已出貨的 npm 套件執行同一個矩陣，而不是針對 SHA 建置的成品。跨 OS 發行檢查仍會涵蓋 OS 專屬 onboarding、installer 與平台行為；套件/更新產品驗證應從 Package Acceptance 開始。`published-upgrade-survivor` Docker lane 會在阻擋性發行路徑中，每次執行驗證一個已發布套件基準。在 Package Acceptance 中，已解析的 `package-under-test` tarball 永遠是候選版本，而 `published_upgrade_survivor_baseline` 會選擇 fallback 已發布基準，預設為 `openclaw@latest`；失敗 lane 的重新執行指令會保留該基準。當 Full Release Validation 設定 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 與 `published_upgrade_survivor_scenarios=reported-issues`，以擴展到四個最新穩定 npm 發行版，加上固定的 Plugin 相容性邊界發行版，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、tilde log 路徑與過期舊 Plugin dependency roots 的 issue-shaped fixtures。多基準 published-upgrade survivor 選項會依基準分片成不同的目標 Docker runner jobs。獨立的 `Update Migration` 工作流程會在問題是完整已發布更新清理，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker lane 搭配 `all-since-2026.4.23` 與 `plugin-deps-cleanup`。本機彙總執行可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 specs，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 供情境矩陣使用。已發布 lane 會使用內建的 `openclaw config set` 指令 recipe 設定基準，在 `summary.json` 中記錄 recipe steps，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 與 RPC 狀態。Windows packaged 與 installer fresh lanes 也會驗證已安裝套件能從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 會在設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因此安裝與 Gateway 證明會停留在 GPT-5 測試模型上，同時避免 GPT-4.x 預設值。

### 舊版相容性視窗

Package Acceptance 對已發布的套件設有有限的舊版相容性視窗。直到 `2026.4.25` 的套件（包括 `2026.4.25-beta.*`）可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可能指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可能略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可能從 tarball 衍生的假 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，並可能記錄缺失的持久化 `update.channel`；
- Plugin 煙霧測試可能讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可能允許設定中繼資料遷移，同時仍要求安裝記錄和不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可能針對已隨套件出貨的本機建置中繼資料戳記檔案發出警告。後續套件必須符合現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，以確認套件來源、版本與 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時與重新執行指令。優先重新執行失敗的套件設定檔或精確 Docker lane，而不是重新執行完整發行驗證。

## 安裝煙霧測試

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` job 重用相同的範圍腳本。它會將煙霧測試涵蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/套件介面、內建 Plugin 套件/manifest 變更，或 Docker 煙霧測試 job 會測試的核心 Plugin/通道/Gateway/Plugin SDK 介面的 pull request 執行。僅限原始碼的內建 Plugin 變更、僅測試編輯與僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI 煙霧測試、執行容器 gateway-network e2e、驗證內建擴充功能建置引數，並在 240 秒彙總指令逾時內執行有界的內建 Plugin Docker 設定檔（每個情境的 Docker 執行另有上限）。
- **完整路徑**會保留 QR 套件安裝與安裝程式 Docker/更新涵蓋範圍，用於夜間排程執行、手動派送、workflow-call 發行檢查，以及確實觸及安裝程式/套件/Docker 介面的 pull request。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 煙霧測試映像，接著將 QR 套件安裝、根 Dockerfile/Gateway 煙霧測試、安裝程式/更新煙霧測試，以及快速內建 Plugin Docker E2E 作為獨立 job 執行，讓安裝程式工作不必等待根映像煙霧測試。

`main` push（包括 merge commit）不會強制完整路徑；當變更範圍邏輯會在 push 上要求完整涵蓋範圍時，工作流程會保留快速 Docker 煙霧測試，並將完整安裝煙霧測試留給夜間或發行驗證。

較慢的 Bun 全域安裝 image-provider 煙霧測試會由 `run_bun_global_install_smoke` 另行控管。它會在夜間排程與發行檢查工作流程中執行，且手動 `Install Smoke` 派送可以選擇加入，但 pull request 與 `main` push 不會執行。QR 和安裝程式 Docker 測試會保留各自聚焦安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像、將 OpenClaw 打包一次成 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/更新/Plugin 相依性 lane 的裸 Node/Git runner；
- 將相同 tarball 安裝到 `/app`、用於一般功能 lane 的功能性映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的計畫。排程器會透過 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 依 lane 選取映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主集區 slot 數量。                                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Provider 敏感尾端集區 slot 數量。                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，讓 provider 不會節流。                                                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行多服務 lane 上限。                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，用於避免 Docker daemon 建立風暴；設為 `0` 則不錯開。                |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的後備逾時（120 分鐘）；選取的 live/tail lane 會使用更嚴格的上限。                 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫，而不執行 lane。                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；會略過清理煙霧測試，讓 agent 能重現單一失敗 lane。              |

比其有效上限更重的 lane 仍可從空集區啟動，然後獨自執行直到釋放容量。本機彙總流程會預先檢查 Docker、移除過時的 OpenClaw E2E 容器、輸出啟用中的 lane 狀態、持久化 lane 計時以供最長優先排序，並預設在第一次失敗後停止排程新的集區 lane。

### 可重用的 live/E2E 工作流程

可重用的 live/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像類型、live 映像、lane 與憑證涵蓋範圍。接著 `scripts/docker-e2e.mjs` 會將該計畫轉換成 GitHub output 與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball inventory；當計畫需要已安裝套件的 lane 時，會透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` input 或現有套件 digest 映像，而不是重新建置。Docker 映像 pull 會以有界的每次嘗試 180 秒逾時重試，因此卡住的 registry/cache stream 會快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發行路徑區塊

發行 Docker 涵蓋範圍會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊 job，因此每個區塊只會 pull 所需的映像類型，並透過相同的加權排程器執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker 區塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍保留為彙總 Plugin/runtime 別名。`install-e2e` lane 別名仍是兩個 provider 安裝程式 lane 的彙總手動重新執行別名。

當完整發行路徑涵蓋範圍要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，並且只在 OpenWebUI-only 派送時保留獨立的 `openwebui` 區塊。內建通道更新 lane 會針對暫時性 npm 網路失敗重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、計時、`summary.json`、`failures.json`、階段計時、排程器計畫 JSON、慢速 lane 表格，以及每個 lane 的重新執行指令。工作流程 `docker_lanes` input 會針對準備好的映像執行選取的 lane，而不是執行區塊 job，這會將失敗 lane 的偵錯限制在一個目標 Docker job 中，並為該執行準備、下載或重用套件成品；如果選取的 lane 是 live Docker lane，目標 job 會在本機為該次重新執行建置 live-test 映像。產生的每個 lane GitHub 重新執行指令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和準備好的映像 input，因此失敗的 lane 可重用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E 工作流程會每日執行完整發行路徑 Docker 套件組。

## Plugin 預發行

`Plugin Prerelease` 是更昂貴的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確操作員派送的獨立工作流程。一般 pull request、`main` push 與獨立手動 CI 派送都會關閉該套件組。它會在八個 extension worker 之間平衡內建 Plugin 測試；這些 extension shard job 一次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest worker 和較大的 Node heap，讓匯入量大的 Plugin 批次不會建立額外 CI job。僅限發行的 Docker 預發行路徑會以小群組批次執行目標 Docker lane，以避免為一到三分鐘的 job 保留數十個 runner。

## QA 實驗室

QA 實驗室在主要智慧範圍工作流程之外有專用 CI lane。Agentic 同等性巢狀位於廣泛 QA 與發行 harness 之下，而不是獨立 PR 工作流程。當同等性應隨廣泛驗證執行一起進行時，請使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會每晚在 `main` 上執行，也會在手動派送時執行；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lane 分散為平行 job。Live job 使用 `qa-live-shared` 環境，而 Telegram/Discord 使用 Convex lease。

發布檢查會使用確定性的模擬提供者與模擬限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram 即時傳輸通道，讓通道合約與即時模型延遲和一般提供者 Plugin 啟動隔離。即時傳輸 Gateway 會停用記憶搜尋，因為 QA 同等性會另外涵蓋記憶行為；提供者連線能力則由獨立的即時模型、原生提供者和 Docker 提供者套件涵蓋。

Matrix 會在排程與發布閘道使用 `--profile fast`，且只在簽出的 CLI 支援時加入 `--fail-fast`。CLI 預設值與手動工作流程輸入仍為 `all`；手動 `matrix_profile=all` 分派一律會將完整 Matrix 覆蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發布核准前執行發布關鍵的 QA Lab 通道；其 QA 同等性閘道會將候選套件與基準套件作為平行通道作業執行，接著將兩者成品下載到小型報告作業中，以進行最終同等性比較。

對於一般 PR，請遵循限定範圍的 CI/檢查證據，而不是將同等性視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意作為範圍狹窄的第一輪安全掃描器，而不是完整儲存庫掃描。每日、手動和非草稿拉取請求防護執行會掃描 Actions 工作流程程式碼，以及風險最高的 JavaScript/TypeScript 表面，使用高信心安全查詢並篩選為高/重大 `security-severity`。

拉取請求防護保持輕量：它只會針對 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的變更啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 和 macOS CodeQL 不包含在 PR 預設值中。

### 安全分類

| 分類                                              | 表面                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、密鑰、沙箱、cron 和 gateway 基準                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，加上通道 Plugin 執行階段、gateway、Plugin SDK、密鑰和稽核接觸點              |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 剖析、網路防護、網頁擷取和 Plugin SDK SSRF 政策表面                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞和代理工具執行閘道                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、載入器、資訊清單、登錄、套件管理器安裝、來源載入和 Plugin SDK 套件合約信任表面 |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。為 CodeQL 在工作流程健全性接受的最小 Blacksmith Linux 執行器上手動建置 Android 應用程式。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式，從上傳的 SARIF 中濾除相依性建置結果，並上傳至 `/codeql-critical-security/macos`。保留在每日預設值之外，因為 macOS 建置即使乾淨也會主導執行時間。

### 重大品質分類

`CodeQL Critical Quality` 是對應的非安全分片。它只會在較小的 Blacksmith Linux 執行器上，針對狹窄高價值表面執行錯誤嚴重性、非安全 JavaScript/TypeScript 品質查詢。它的拉取請求防護刻意小於排程設定檔：非草稿 PR 只會針對代理命令/模型/工具執行與回覆分派程式碼、設定結構描述/遷移/IO 程式碼、驗證/密鑰/沙箱/安全程式碼、核心通道與內建通道 Plugin 執行階段、Gateway 通訊協定/伺服器方法、記憶執行階段/SDK 黏合、MCP/程序/對外傳遞、提供者執行階段/模型目錄、工作階段診斷/傳遞佇列、Plugin 載入器、Plugin SDK/套件合約，或 Plugin SDK 回覆執行階段變更，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動分派接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用於單獨執行一個品質分片的教學/迭代掛鉤。

| 分類                                                    | 表面                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、密鑰、沙箱、cron 和 gateway 安全邊界程式碼                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化和 IO 合約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 通訊協定結構描述和伺服器方法合約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道和內建通道 Plugin 實作合約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/提供者分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接器、程序監督輔助工具和對外傳遞合約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶主機 SDK、記憶執行階段 facade、記憶 Plugin SDK 別名、記憶執行階段啟用黏合和記憶 doctor 命令                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞輔助工具、診斷事件/記錄組合表面和工作階段 doctor CLI 合約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆分派、回覆承載/chunking/執行階段輔助工具、通道回覆選項、傳遞佇列和工作階段/執行緒繫結輔助工具             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值/目錄，以及 web/search/fetch/embedding 登錄    |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、gateway 控制流程和工作控制平面執行階段合約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁 fetch/search、媒體 IO、媒體理解、影像生成和媒體生成執行階段合約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公開表面和 Plugin SDK 進入點合約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 來源和 Plugin 套件合約輔助工具                                                                                      |

品質與安全分開，讓品質發現可以被排程、衡量、停用或擴展，而不會遮蔽安全訊號。Swift、Python 和內建 Plugin CodeQL 擴展應只在狹窄設定檔具備穩定執行時間和訊號後，作為限定範圍或分片化的後續工作加回。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於讓現有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot 推送 CI 執行可以觸發它，手動分派也可以直接執行它。當 `main` 已往前移動，或上一小時內已建立另一個未略過的 Docs Agent 執行時，工作流程執行叫用會略過。當它執行時，會審閱從上一個未略過 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次執行可以涵蓋自上次文件通過以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於慢速測試。它沒有純排程：`main` 上成功的非 bot 推送 CI 執行可以觸發它，但如果同一 UTC 日已有另一個工作流程執行叫用已執行或正在執行，它會略過。手動分派會繞過該每日活動閘道。此通道會建置完整套件分組 Vitest 效能報告，讓 Codex 只進行保留覆蓋率的小型測試效能修正，而不是大範圍重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，且代理後完整套件報告必須通過，才會提交任何內容。當 `main` 在 bot 推送落地前前進時，此通道會 rebase 已驗證的修補、重新執行 `pnpm check:changed`，並重試推送；有衝突的過時修補會被略過。它使用 GitHub 託管的 Ubuntu，讓 Codex action 可以維持與 docs agent 相同的 drop-sudo 安全姿態。

### Duplicate PRs After Merge

`Duplicate PRs After Merge` 工作流程是供維護者在落地後清理重複項目的手動工作流程。它預設為 dry-run，且只會在 `apply=true` 時關閉明確列出的 PR。在變更 GitHub 之前，它會驗證落地 PR 已合併，且每個重複項目都有共用的引用 issue 或重疊的變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘道與變更路由

本機變更通道邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘道對架構邊界的要求比廣泛 CI 平台範圍更嚴格：

- 核心生產變更會執行核心生產與核心測試型別檢查，以及核心 lint/guard；
- 僅核心測試變更只會執行核心測試型別檢查與核心 lint；
- Plugin 生產變更會執行 Plugin 生產與 Plugin 測試型別檢查，以及 Plugin lint；
- 僅 Plugin 測試變更會執行 Plugin 測試型別檢查與 Plugin lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴展到 Plugin 型別檢查，因為 Plugin 依賴那些核心合約（Vitest Plugin 掃描仍是明確的測試工作）；
- 僅發行中繼資料的版本提升會執行目標式版本、設定、根依賴檢查；
- 未知的根目錄/設定變更會保守地落到所有檢查通道。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，來源編輯優先使用明確映射，接著是同層測試與匯入圖依賴項。共享群組聊天室投遞設定是明確映射之一：對群組可見回覆設定、來源回覆投遞模式或訊息工具系統提示的變更，會路由到核心回覆測試，加上 Discord 與 Slack 投遞迴歸測試，讓共享預設變更在第一次 PR 推送前就失敗。只有當變更涵蓋整個測試框架，使便宜的映射集合無法作為可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從儲存庫根目錄執行 Testbox，並優先使用新的已預熱機器來取得廣泛證明。在重複使用、已過期，或剛回報非預期大型同步的機器上花時間執行慢速閘道前，先在該機器內執行 `pnpm testbox:sanity`。

當必要根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤刪除項目時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；請停止該機器並預熱新的機器，而不是除錯產品測試失敗。對於刻意的大量刪除 PR，請為該次健全性執行設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該 guard，或針對異常大型的本機差異使用更大的毫秒值。

Crabbox 是儲存庫擁有的遠端機器包裝器，用於維護者 Linux 證明。當檢查對本機編輯迴圈來說過於廣泛、CI 同等性很重要，或證明需要密鑰、Docker、套件通道、可重複使用的機器或遠端記錄時，請使用它。一般 OpenClaw 後端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是 Blacksmith 中斷、配額問題或明確自有容量測試時的備援。

第一次執行前，請從儲存庫根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果 Crabbox 二進位檔過舊且未宣告 `blacksmith-testbox`，儲存庫包裝器會拒絕執行。即使 `.crabbox.yaml` 有自有雲端預設值，也請明確傳入提供者。

變更閘道：

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

閱讀最終 JSON 摘要。有用的欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。一次性的 Blacksmith 支援 Crabbox 執行應該會自動停止 Testbox；如果執行遭中斷或清理狀態不明，請檢查即時機器，並只停止你建立的機器：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要於同一個已 hydrate 的機器上執行多個命令時，才使用重複使用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是故障層，但 Blacksmith 本身可運作，請使用直接 Blacksmith 作為狹窄備援：

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可運作，但新的預熱在幾分鐘後仍停留於 `queued`，且沒有 IP 或 Actions 執行 URL，請將其視為 Blacksmith 提供者、佇列、計費或組織限制壓力。停止你建立的已佇列 ID，避免啟動更多 Testbox，並在有人檢查 Blacksmith 儀表板、計費與組織限制時，將證明移到下方的自有 Crabbox 容量路徑。

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確以自有容量為目標時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務真的需要 48xlarge 級 CPU，否則避免使用 `class=beast`。`beast` 請求從 192 個 vCPU 起跳，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額的方式。儲存庫擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域與 `capacity.hints: true`，因此經代理的 AWS 租用會印出選定的區域/市場、配額壓力、Spot 備援與高壓力類別警告。較重的廣泛檢查使用 `fast`，只有在 standard/fast 不足時才使用 `large`，而 `beast` 僅用於例外的 CPU 密集通道，例如完整套件或全 Plugin Docker 矩陣、明確的發行/阻斷驗證，或高核心效能分析。不要將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint/型別檢查、小型 E2E 重現，或 Blacksmith 中斷分診。容量診斷請使用 `--market on-demand`，避免將 Spot 市場波動混入訊號。

`.crabbox.yaml` 擁有自有雲端通道的提供者、同步與 GitHub Actions hydrate 預設值。它排除本機 `.git`，讓已 hydrate 的 Actions checkout 保有自己的遠端 Git 中繼資料，而不是同步維護者本機遠端與物件儲存，並排除永遠不應傳輸的本機執行階段/建置成品。`.github/workflows/crabbox-hydrate.yml` 擁有自有雲端 `crabbox run --id <cbx_id>` 命令的 checkout、Node/pnpm 設定、`origin/main` 擷取與非密鑰環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
