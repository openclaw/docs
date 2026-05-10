---
read_when:
    - 你需要了解 CI 作業為何執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調一次發行驗證執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發布總括，以及本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-10T19:24:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 上執行。`preflight` job 會分類 diff，並在只有不相關區域變更時關閉昂貴的 lane。手動 `workflow_dispatch` 執行會刻意繞過智慧範圍判定，並展開完整 graph，用於 release candidate 和廣泛驗證。Android lane 透過 `include_android` 維持 opt-in。僅限發行的 Plugin 覆蓋範圍位於獨立的 [`Plugin 預發行`](#plugin-prerelease) workflow，且只會從 [`完整發行驗證`](#full-release-validation) 或明確的手動 dispatch 執行。

## Pipeline 概覽

| Job                              | 用途                                                                                                   | 執行時機                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、變更範圍、變更的 extensions，並建置 CI manifest                   | 一律在非草稿 push 和 PR 上執行 |
| `security-scm-fast`              | 透過 `zizmor` 進行私鑰偵測和 workflow 稽核                                                     | 一律在非草稿 push 和 PR 上執行 |
| `security-dependency-audit`      | 對 npm advisory 進行不需相依套件的 production lockfile 稽核                                          | 一律在非草稿 push 和 PR 上執行 |
| `security-fast`                  | 快速安全性 job 的必要彙總結果                                                             | 一律在非草稿 push 和 PR 上執行 |
| `check-dependencies`             | Production Knip dependency-only pass 加上未使用檔案 allowlist guard                                 | Node 相關變更              |
| `build-artifacts`                | 建置 `dist/`、Control UI、built-artifact 檢查，以及可重用的下游 artifacts                       | Node 相關變更              |
| `checks-fast-core`               | 快速 Linux 正確性 lane，例如 bundled/plugin-contract/protocol 檢查                              | Node 相關變更              |
| `checks-fast-contracts-channels` | 分 shard 的 channel contract 檢查，並提供穩定的彙總檢查結果                                      | Node 相關變更              |
| `checks-node-core-test`          | Core Node 測試 shard，排除 channel、bundled、contract 和 extension lane                          | Node 相關變更              |
| `check`                          | 分 shard 的主要本機 gate 等價項目：prod types、lint、guard、test types 和 strict smoke                | Node 相關變更              |
| `check-additional`               | 架構、分 shard 的 boundary/prompt drift、extension guard、package boundary 和 gateway watch        | Node 相關變更              |
| `build-smoke`                    | Built-CLI smoke 測試和 startup-memory smoke                                                            | Node 相關變更              |
| `checks`                         | built-artifact channel 測試的 verifier                                                                 | Node 相關變更              |
| `checks-node-compat-node22`      | Node 22 相容性建置和 smoke lane                                                                | 發行用手動 CI dispatch    |
| `check-docs`                     | 文件格式化、lint 和 broken-link 檢查                                                             | 文件變更                       |
| `skills-python`                  | Python-backed skills 的 Ruff + pytest                                                                    | Python skill 相關變更      |
| `checks-windows`                 | Windows 特定 process/path 測試，以及共用 runtime import specifier regression                      | Windows 相關變更           |
| `macos-node`                     | 使用共用 built artifacts 的 macOS TypeScript 測試 lane                                               | macOS 相關變更             |
| `macos-swift`                    | macOS app 的 Swift lint、建置和測試                                                            | macOS 相關變更             |
| `android`                        | 兩種 flavor 的 Android unit test，加上一個 debug APK 建置                                              | Android 相關變更           |
| `test-performance-agent`         | 信任活動後每日 Codex slow-test 最佳化                                                 | Main CI 成功或手動 dispatch |
| `openclaw-performance`           | 每日/隨選 Kova runtime performance report，包含 mock-provider、deep-profile 和 GPT 5.4 live lane | 排程和手動 dispatch      |

## Fail-fast 順序

1. `preflight` 決定哪些 lane 實際存在。`docs-scope` 和 `changed-scope` 邏輯是這個 job 內的 step，不是獨立 job。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 會快速失敗，不等待較重的 artifact 和平台 matrix job。
3. `build-artifacts` 會與快速 Linux lane 重疊，讓下游 consumer 可在共用 build 準備好後立即開始。
4. 較重的平台和 runtime lane 接著展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

當較新的 push 落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的 job 標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則請將其視為 CI 雜訊。彙總 shard 檢查使用 `!cancelled() && always()`，因此仍會回報正常的 shard 失敗，但不會在整個 workflow 已被取代後繼續排隊。自動 CI concurrency key 有版本標記（`CI-v7-*`），因此 GitHub 端舊 queue group 中的 zombie 不會無限期阻擋較新的 main 執行。手動 full-suite 執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

`ci-timings-summary` job 會為每次非草稿 CI 執行上傳精簡的 `ci-timings-summary` artifact。它會記錄目前執行的 wall time、queue time、最慢 job 和失敗 job，因此 CI 健康檢查不需要反覆擷取完整 Actions payload。

## 範圍和路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的 unit test 覆蓋。手動 dispatch 會跳過 changed-scope 偵測，並讓 preflight manifest 表現得像是每個 scoped area 都已變更。

- **CI workflow 編輯**會驗證 Node CI graph 加上 workflow linting，但不會單獨強制 Windows、Android 或 macOS native build；這些平台 lane 仍會限定在平台原始碼變更。
- **僅限 CI 路由的編輯、選定的便宜 core-test fixture 編輯，以及狹窄的 plugin contract helper/test-routing 編輯**會使用快速 Node-only manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` task。當變更僅限於該快速 task 直接執行的 routing 或 helper surface 時，該路徑會跳過 build artifacts、Node 22 compatibility、channel contracts、完整 core shards、bundled-plugin shards 和 additional guard matrices。
- **Windows Node 檢查**限定於 Windows 特定 process/path wrapper、npm/pnpm/UI runner helper、package manager config，以及執行該 lane 的 CI workflow surface；不相關的 source、plugin、install-smoke 和 test-only 變更會留在 Linux Node lane 上。

最慢的 Node 測試 family 會被拆分或平衡，讓每個 job 保持小型且不過度預留 runner：channel contracts 會作為三個加權 Blacksmith-backed shard 執行，並使用標準 GitHub runner fallback；core unit fast/support lane 分開執行；core runtime infra 會拆分為 state、process/config、cron 和 shared shard；auto-reply 會作為平衡 worker 執行（reply subtree 拆分為 agent-runner、dispatch 和 commands/state-routing shard）；agentic gateway/server config 會拆分到 chat/auth/model/http-plugin/runtime/startup lane，而不是等待 built artifacts。廣泛的 browser、QA、media 和 miscellaneous plugin 測試會使用它們專用的 Vitest config，而不是共用 plugin catch-all。Include-pattern shard 會使用 CI shard name 記錄 timing entry，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 和 filtered shard。`check-additional` 會把 package-boundary compile/canary work 放在一起，並將 runtime topology architecture 與 gateway watch coverage 分開；boundary guard list 會分散到四個 matrix shard，每個 shard 都會同時執行選定的獨立 guard，並印出每項檢查的 timing。昂貴的 Codex happy-path prompt snapshot drift 檢查會作為自己的 additional job 執行，僅用於手動 CI 和會影響 prompt 的變更，因此一般不相關的 Node 變更不會卡在冷啟動 prompt snapshot generation 後面，boundary shard 也會保持平衡，同時 prompt drift 仍會釘選到造成它的 PR；同一個 flag 也會在 built-artifact core support-boundary shard 內跳過 prompt snapshot Vitest generation。Gateway watch、channel 測試和 core support-boundary shard 會在 `dist/` 和 `dist-runtime/` 已建置完成後，在 `build-artifacts` 內同時執行。

Android CI 會執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；它的 unit-test lane 仍會使用 SMS/call-log BuildConfig flag 編譯該 flavor，同時避免在每次 Android 相關 push 上重複執行 debug APK packaging job。

`check-dependencies` shard 會執行 `pnpm deadcode:dependencies`（production Knip dependency-only pass，釘選到最新 Knip 版本，且為 `dlx` install 停用 pnpm 的 minimum release age）和 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file findings 與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的未使用檔案，或留下過時的 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的 intentional dynamic plugin、generated、build、live-test 和 package bridge surface。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository activity 到 ClawSweeper 的 target-side bridge。它不會 checkout 或執行不受信任的 pull request code。該 workflow 會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload dispatch 到 `openclaw/clawsweeper`。

該 workflow 有四個 lane：

- `clawsweeper_item` 用於精確的 issue 和 pull request review request；
- `clawsweeper_comment` 用於 issue comment 中明確的 ClawSweeper command；
- `clawsweeper_commit_review` 用於 `main` push 上的 commit-level review request；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub activity。

`github_activity` lane 只會轉送標準化 metadata：event type、action、actor、repository、item number、URL、title、state，以及存在時的 comment 或 review 短摘錄。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的 receiving workflow 是 `.github/workflows/github-activity.yml`，會將標準化 event 發送到 ClawSweeper agent 的 OpenClaw Gateway hook。

一般活動是 observation，而不是預設 delivery。ClawSweeper agent 會在 prompt 中收到 Discord target，並且只有在事件令人意外、可採取行動、有風險或對營運有用時，才應該發到 `#clawsweeper`。例行 open、edit、bot churn、重複 webhook noise 和一般 review traffic 應該產生 `NO_REPLY`。

在整個路徑中，將 GitHub 標題、留言、正文、審查文字、分支名稱和提交訊息都視為不受信任的資料。它們是摘要與分流的輸入，不是 workflow 或 agent runtime 的指令。

## 手動派送

手動 CI 派送會執行與一般 CI 相同的工作圖，但會強制開啟每個非 Android 範圍 lane：Linux Node 分片、bundled-plugin 分片、channel contract、Node 22 相容性、`check`、`check-additional`、建置 smoke、文件檢查、Python skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI 派送只會在 `include_android=true` 時執行 Android；完整發行總括流程會透過傳入 `include_android=true` 啟用 Android。Plugin 預發行靜態檢查、僅限發行的 `agentic-plugins` 分片、完整 extension 批次掃描，以及 Plugin 預發行 Docker lane 會從 CI 中排除。Docker 預發行套件只會在 `Full Release Validation` 以啟用 release-validation 閘門的方式派送獨立的 `Plugin Prerelease` workflow 時執行。

手動執行會使用唯一的 concurrency group，因此 release-candidate 完整套件不會被同一 ref 上的其他 push 或 PR 執行取消。選用的 `target_ref` 輸入讓受信任的呼叫者可以使用所選派送 ref 的 workflow 檔案，針對分支、tag 或完整 commit SHA 執行該工作圖。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | 工作                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、快速安全性工作與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 檢查、分片 channel contract 檢查、除 lint 外的 `check` 分片、`check-additional` 彙總、Node 測試彙總驗證器、文件檢查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub-hosted Ubuntu，讓 Blacksmith 矩陣可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低負載的 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`，以及 `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke、Linux Node 測試分片、bundled Plugin 測試分片、`check-additional` 分片、`android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`、`check-lint`（對 CPU 足夠敏感，8 vCPU 反而成本高於節省）；install-smoke Docker 建置（32 vCPU 的排隊時間成本高於節省）                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

Canonical repo CI 會將 Blacksmith 保持為預設 runner 路徑。在 `preflight` 期間，`scripts/ci-runner-labels.mjs` 會檢查最近排隊中與進行中的 Actions 執行，找出排隊中的 Blacksmith 工作。如果特定 Blacksmith 標籤已有排隊工作，會使用該確切標籤的下游工作只在該次執行中退回對應的 GitHub-hosted runner（`ubuntu-24.04`、`windows-2025` 或 `macos-latest`）。同一 OS family 中的其他 Blacksmith 規格會維持使用其主要標籤。如果 API 探測失敗，則不套用 fallback。

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

`OpenClaw Performance` 是產品/runtime 效能 workflow。它每天在 `main` 上執行，也可以手動派送：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動派送通常會對 workflow ref 進行基準測試。設定 `target_ref` 可用目前的 workflow 實作對 release tag 或其他分支進行基準測試。發布的報告路徑與 latest 指標會依測試的 ref 建立索引，且每個 `index.md` 都會記錄測試的 ref/SHA、workflow ref/SHA、Kova ref、profile、lane auth mode、model、重複次數，以及 scenario filter。

workflow 會從固定版本安裝 OCM，並從 `openclaw/Kova` 的固定 `kova_ref` 輸入安裝 Kova，接著執行三個 lane：

- `mock-provider`：Kova diagnostic scenario，針對具備 deterministic fake OpenAI-compatible auth 的本機建置 runtime。
- `mock-deep-profile`：針對啟動、Gateway 與 agent-turn 熱點的 CPU/heap/trace profiling。
- `live-gpt54`：真實 OpenAI `openai/gpt-5.4` agent turn，當 `OPENAI_API_KEY` 無法使用時會略過。

mock-provider lane 也會在 Kova 通過後執行 OpenClaw-native source probe：default、hook 和 50-Plugin 啟動案例下的 Gateway 開機時間與記憶體；重複的 mock-OpenAI `channel-chat-baseline` hello loop；以及針對已啟動 Gateway 的 CLI 啟動命令。source probe Markdown 摘要位於報告 bundle 的 `source/index.md`，旁邊有原始 JSON。

每個 lane 都會上傳 GitHub artifact。設定 `CLAWGRIT_REPORTS_TOKEN` 時，workflow 也會將 `report.json`、`report.md`、bundle、`index.md` 與 source-probe artifact 提交到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 下。目前 tested-ref 指標會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## 完整發行驗證

`Full Release Validation` 是用於「發行前執行所有項目」的手動總括 workflow。它接受分支、tag 或完整 commit SHA，並以該目標派送手動 `CI` workflow、派送 `Plugin Prerelease` 以取得僅限發行的 Plugin/package/static/Docker 證明，並派送 `OpenClaw Release Checks` 以執行 install smoke、package acceptance、跨 OS package 檢查、QA Lab parity、Matrix 與 Telegram lane。穩定/default 執行會把完整 live/E2E 與 Docker release-path 覆蓋保留在 `run_release_soak=true` 後方；`release_profile=full` 會強制啟用該 soak 覆蓋，讓廣泛 advisory 驗證仍保持廣泛。搭配 `rerun_group=all` 與 `release_profile=full` 時，它也會對 release checks 的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳入 `npm_telegram_package_spec` 可針對已發布的 npm package 重新執行相同的 Telegram package lane。

請參閱[完整發行驗證](/zh-TW/reference/full-release-validation)，了解
stage 矩陣、精確 workflow 工作名稱、profile 差異、artifact，以及
聚焦 rerun handle。

`OpenClaw Release Publish` 是手動的變更型發行 workflow。在 release tag 已存在且
OpenClaw npm preflight 已成功後，從 `release/YYYY.M.D` 或 `main` 派送它。它會驗證 `pnpm plugins:sync:check`、
為所有可發布的 Plugin package 派送 `Plugin NPM Release`，為相同 release SHA 派送
`Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 派送
`OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得釘選 commit 證明，請使用輔助工具，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs 必須是分支或標籤，不能是原始 commit SHA。此輔助工具會在目標 SHA 推送一個暫時的 `release-ci/<sha>-...` 分支，從該釘選 ref dispatch `Full Release Validation`，驗證每個子 workflow 的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。若任何子 workflow 在不同 SHA 上執行，總括驗證器也會失敗。

`release_profile` 控制傳入發布檢查的 live/provider 廣度。手動發布 workflows 預設為 `stable`；只有在你有意要執行廣泛的 advisory provider/media 矩陣時才使用 `full`。`run_release_soak` 控制 stable/default 發布檢查是否執行完整的 live/E2E 與 Docker 發布路徑 soak；`full` 會強制啟用 soak。

- `minimum` 保留最快的 OpenAI/核心發布關鍵線路。
- `stable` 加入穩定的 provider/backend 集合。
- `full` 執行廣泛的 advisory provider/media 矩陣。

總括 workflow 會記錄 dispatch 出去的子執行 ID，而最後的 `Verify full validation` job 會重新檢查目前子執行的結論，並為每個子執行附加最慢 job 表格。如果重新執行某個子 workflow 且轉為通過，只需重新執行父驗證器 job，即可重新整理總括結果與時間摘要。

在復原時，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。發布候選版請使用 `all`，只重跑一般 full CI 子項請使用 `ci`，只重跑 Plugin prerelease 子項請使用 `plugin-prerelease`，重跑每個發布子項請使用 `release-checks`，或在總括 workflow 上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能在聚焦修復後，讓失敗的發布 box 重新執行範圍保持受限。若是一個失敗的 cross-OS 線路，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 組合使用，例如 `windows/packaged-upgrade`；長時間的 cross-OS 命令會輸出 Heartbeat 行，而 packaged-upgrade 摘要包含各階段耗時。QA 發布檢查線路屬於 advisory，因此僅 QA 失敗會警告，但不會阻擋 release-check 驗證器。

`OpenClaw Release Checks` 會使用受信任的 workflow ref，將選定 ref 一次解析為 `release-package-under-test` tarball，然後將該 artifact 傳給 cross-OS 檢查與套件驗收，並在執行 soak 覆蓋時傳給 live/E2E 發布路徑 Docker workflow。這能讓套件位元組在不同發布 box 之間保持一致，並避免在多個子 job 中重複打包相同候選版。

針對 `ref=main` 且 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的總括 workflow。當父 workflow 被取消時，父監控器會取消它已 dispatch 的任何子 workflow，因此較新的 main 驗證不會卡在過期的兩小時 release-check 執行後面。發布分支/標籤驗證與聚焦的 rerun 群組會保留 `cancel-in-progress: false`。

## Live 與 E2E 分片

發布 live/E2E 子項保留廣泛的原生 `pnpm test:live` 覆蓋，但會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是使用單一序列 job：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的 media audio/video 分片與 provider-filtered music 分片

這會保留相同的檔案覆蓋，同時讓緩慢的 live provider 失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live media 分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` workflow 建置。該映像預先安裝 `ffmpeg` 與 `ffprobe`；media jobs 只會在 setup 前驗證二進位檔。請將 Docker 支援的 live suites 保持在一般 Blacksmith runners 上執行；container jobs 不適合啟動巢狀 Docker 測試。

Docker 支援的 live model/backend 分片會針對每個選定 commit 使用獨立共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。live 發布 workflow 會建置並推送該映像一次，然後 Docker live model、provider-sharded Gateway、CLI backend、ACP bind 與 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片帶有明確的 script-level `timeout` 上限，低於 workflow job timeout，因此卡住的 container 或 cleanup 路徑會快速失敗，而不是耗盡整個 release-check 預算。若這些分片各自重新建置完整 source Docker target，表示發布執行設定錯誤，會把時間浪費在重複映像建置上。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證 source tree，而套件驗收會透過使用者在安裝或更新後操作的相同 Docker E2E harness，驗證單一 tarball。

### Jobs

1. `resolve_package` 會 checkout `workflow_ref`，解析一個套件候選版，寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，寫入 `.artifacts/docker-e2e-package/package-candidate.json`，將兩者都上傳為 `package-under-test` artifact，並在 GitHub step summary 中列印來源、workflow ref、package ref、版本、SHA-256 與 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 與 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用 workflow 會下載該 artifact，驗證 tarball inventory，視需要準備 package-digest Docker images，並針對該套件執行選定的 Docker 線路，而不是打包 workflow checkout。當一個 profile 選取多個目標 `docker_lanes` 時，可重用 workflow 會準備套件與共用映像一次，然後將這些線路展開為並行的目標 Docker jobs，且各自使用唯一 artifact。
3. `package_telegram` 可選擇呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行；若套件驗收已解析出一個 artifact，則安裝相同的 `package-under-test` artifact；獨立 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker 驗收或可選 Telegram 線路失敗時讓 workflow 失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或像 `openclaw@2026.4.27-beta.2` 這樣的精確 OpenClaw 發布版本。請用於已發布 prerelease/stable 驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整 commit SHA。resolver 會 fetch OpenClaw 分支/標籤，驗證選定 commit 可從 repository 分支歷史或發布標籤到達，在 detached worktree 中安裝 deps，並以 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 與 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為可選，但對外共享的 artifacts 應提供。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任 workflow/harness code。`package_ref` 是當 `source=ref` 時會被打包的 source commit。這讓目前的測試 harness 可以驗證較舊的受信任 source commits，而不執行舊的 workflow 邏輯。

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 發布路徑 chunks
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` profile 使用離線 Plugin 覆蓋，因此已發布套件驗證不會受 live ClawHub 可用性限制。可選 Telegram 線路會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` artifact，而已發布 npm spec 路徑會保留給獨立 dispatch。

如需專用的更新與 Plugin 測試政策，包括本機命令、Docker 線路、套件驗收輸入、發布預設值與失敗分流，請參閱 [測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、已準備的發布套件 artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` 與 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、live ClawHub skill install、過期 Plugin dependency cleanup、configured-plugin install repair、offline Plugin、plugin-update 與 Telegram proof 使用同一個已解析套件 tarball。在 Full Release Validation 或 OpenClaw Release Checks 上設定 `package_acceptance_package_spec`，即可針對已出貨的 npm 套件執行相同矩陣，而不是使用 SHA-built artifact。Cross-OS 發布檢查仍涵蓋作業系統特定的 onboarding、installer 與 platform behavior；package/update 產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker 線路會在 blocking release path 中每次執行驗證一個已發布套件 baseline。在套件驗收中，已解析的 `package-under-test` tarball 永遠是候選版，而 `published_upgrade_survivor_baseline` 會選取 fallback published baseline，預設為 `openclaw@latest`；failed-lane 重新執行命令會保留該 baseline。Full Release Validation 搭配 `run_release_soak=true` 或 `release_profile=full` 時，會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 與 `published_upgrade_survivor_scenarios=reported-issues`，擴展到最新四個 stable npm releases，加上釘選的 Plugin 相容性邊界 releases，以及針對 Feishu config、保留的 bootstrap/persona files、configured OpenClaw Plugin installs、tilde log paths 與 stale legacy Plugin dependency roots 的 issue-shaped fixtures。多 baseline published-upgrade survivor 選取會按 baseline 分片到個別的目標 Docker runner jobs。獨立的 `Update Migration` workflow 會在問題是完整的已發布更新清理，而不是一般 Full Release CI 廣度時，使用 `update-migration` Docker 線路搭配 `all-since-2026.4.23` 與 `plugin-deps-cleanup`。本機彙總執行可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入精確套件 specs，以 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一線路，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用 scenario 矩陣。published 線路會用內建的 `openclaw config set` command recipe 設定 baseline，在 `summary.json` 中記錄 recipe steps，並在 Gateway start 後探測 `/healthz`、`/readyz` 與 RPC status。Windows packaged 與 installer fresh 線路也會驗證已安裝套件可從原始絕對 Windows path 匯入 browser-control override。OpenAI cross-OS agent-turn smoke 在有設定時預設為 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則為 `openai/gpt-5.4`，因此 install 與 Gateway proof 會維持使用 GPT-5 test model，同時避免 GPT-4.x 預設值。

### 舊版相容性視窗

套件驗收對已發布套件設有有限的舊版相容性視窗。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向 tarball 省略的檔案；
- 當套件未公開該旗標時，`doctor-switch` 可以略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可以從 tarball 衍生的假 git fixture 中修剪缺漏的 `pnpm.patchedDependencies`，並可以記錄缺漏的已持久化 `update.channel`；
- Plugin 煙霧測試可以讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可以允許設定 metadata 遷移，同時仍要求安裝記錄和不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可以針對已經出貨的本機建置 metadata stamp 檔案發出警告。之後的套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請從 `resolve_package` 摘要開始，以確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker artifact：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時和重新執行命令。優先重新執行失敗的套件 profile 或精確的 Docker lane，而不是重新執行完整發布驗證。

## 安裝煙霧測試

獨立的 `Install Smoke` workflow 透過自己的 `preflight` job 重用相同的 scope script。它將煙霧測試涵蓋範圍分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會在 pull request 觸及 Docker/套件表面、內建 Plugin 套件/manifest 變更，或 Docker 煙霧測試 job 會演練的核心 Plugin/channel/Gateway/Plugin SDK 表面時執行。僅限來源的內建 Plugin 變更、僅測試編輯和僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI 煙霧測試、執行容器 gateway-network e2e、驗證內建 extension build arg，並在 240 秒彙總命令 timeout 內執行有界的內建 Plugin Docker profile（每個情境的 Docker 執行會分別設上限）。
- **完整路徑**保留 QR 套件安裝與 installer Docker/update 涵蓋範圍，用於 nightly 排程執行、手動 dispatch、workflow-call 發布檢查，以及真正觸及 installer/package/Docker 表面的 pull request。在完整模式中，install-smoke 會準備或重用一個目標 SHA 的 GHCR 根 Dockerfile 煙霧映像，然後將 QR 套件安裝、根 Dockerfile/Gateway 煙霧測試、installer/update 煙霧測試，以及快速內建 Plugin Docker E2E 作為獨立 job 執行，讓 installer 工作不必等在根映像煙霧測試後面。

`main` push（包括 merge commit）不會強制完整路徑；當變更範圍邏輯會在 push 上要求完整涵蓋範圍時，workflow 會保留快速 Docker 煙霧測試，並將完整安裝煙霧測試留給 nightly 或發布驗證。

緩慢的 Bun 全域安裝 image-provider 煙霧測試會由 `run_bun_global_install_smoke` 另行控管。它會在 nightly 排程和發布檢查 workflow 中執行，且手動 `Install Smoke` dispatch 可以選擇加入，但 pull request 和 `main` push 不會執行。QR 和 installer Docker 測試保留各自專注於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像，將 OpenClaw 封裝一次為 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於 installer/update/plugin-dependency lane 的裸 Node/Git runner；
- 將相同 tarball 安裝到 `/app`、用於一般功能 lane 的功能映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的 plan。scheduler 會用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的主 pool slot 數。                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider-sensitive tail-pool slot 數。                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider throttle。                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm install lane 上限。                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，用於避免 Docker daemon create 風暴；設為 `0` 表示不錯開。            |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback timeout（120 分鐘）；選定的 live/tail lane 使用更嚴格的上限。           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印 scheduler plan，而不執行 lane。                                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；略過清理煙霧測試，讓 agent 能重現單一失敗 lane。                  |

比有效上限更重的 lane 仍可從空 pool 啟動，然後會獨自執行直到釋放容量。本機彙總會預檢 Docker、移除過期的 OpenClaw E2E 容器、輸出 active-lane 狀態、持久化 lane 計時以供 longest-first 排序，並預設在第一次失敗後停止排程新的 pooled lane。

### 可重用 live/E2E workflow

可重用 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、lane 和 credential 涵蓋範圍。`scripts/docker-e2e.mjs` 接著會將該 plan 轉換成 GitHub outputs 和摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 封裝 OpenClaw、下載目前執行的套件 artifact，或從 `package_artifact_run_id` 下載套件 artifact；驗證 tarball inventory；在 plan 需要已安裝套件的 lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的 bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` input 或既有的套件 digest 映像，而不是重新建置。Docker 映像 pull 會以有界的每次嘗試 180 秒 timeout 重試，因此卡住的 registry/cache stream 會快速重試，而不是耗掉大部分 CI 關鍵路徑。

### 發布路徑 chunk

發布 Docker 涵蓋範圍會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的 chunked job，讓每個 chunk 只 pull 所需的映像種類，並透過相同的 weighted scheduler 執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發布 Docker chunk 為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 保持為彙總 Plugin/runtime alias。`install-e2e` lane alias 保持為兩個 provider installer lane 的彙總手動重新執行 alias。

當完整 release-path 涵蓋範圍要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，且只在 OpenWebUI-only dispatch 時保留獨立的 `openwebui` chunk。內建 channel update lane 會針對暫時性 npm 網路失敗重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、計時、`summary.json`、`failures.json`、階段計時、scheduler plan JSON、slow-lane 表格，以及每個 lane 的重新執行命令。workflow 的 `docker_lanes` input 會對已準備的映像執行選定 lane，而不是執行 chunk job，這讓失敗 lane 偵錯被限制在一個目標 Docker job 內，並為該次執行準備、下載或重用套件 artifact；如果選定 lane 是 live Docker lane，目標 job 會在本機為該次重新執行建置 live-test 映像。產生的每個 lane GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備的映像 input，因此失敗 lane 可以重用失敗執行中的確切套件和映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E workflow 會每日執行完整 release-path Docker suite。

## Plugin 預發布

`Plugin Prerelease` 是成本更高的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確 operator dispatch 的獨立 workflow。一般 pull request、`main` push 和獨立手動 CI dispatch 會保持該 suite 關閉。它會在八個 extension worker 之間平衡內建 Plugin 測試；這些 extension shard job 會一次最多執行兩個 Plugin config group，每個 group 使用一個 Vitest worker 和較大的 Node heap，讓 import-heavy Plugin batch 不會建立額外 CI job。僅發布的 Docker 預發布路徑會以小群組批次執行目標 Docker lane，以避免為一到三分鐘的 job 保留數十個 runner。

## QA Lab

QA Lab 在主要 smart-scoped workflow 之外有專用 CI lane。Agentic parity 巢狀位於廣泛 QA 和發布 harness 之下，而不是獨立的 PR workflow。當 parity 應該搭配廣泛驗證執行時，請使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 每晚在 `main` 上執行，也可手動 dispatch；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lane 展開為並行 job。Live job 使用 `qa-live-shared` environment，而 Telegram/Discord 使用 Convex lease。

發行檢查會使用確定性的模擬提供者與模擬限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram 即時傳輸通道，因此通道合約會與即時模型延遲及一般提供者 Plugin 啟動隔離。即時傳輸 Gateway 會停用記憶搜尋，因為 QA 對等已另外涵蓋記憶行為；提供者連線能力則由獨立的即時模型、原生提供者與 Docker 提供者套件涵蓋。

Matrix 會在排程與發行閘門中使用 `--profile fast`，且只有在簽出的 CLI 支援時才加入 `--fail-fast`。CLI 預設值與手動工作流程輸入仍維持 `all`；手動 `matrix_profile=all` 派送一律會將完整 Matrix 涵蓋範圍分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 工作。

`OpenClaw Release Checks` 也會在發行核准前執行發行關鍵的 QA Lab 通道；其 QA 對等閘門會將候選與基準套件作為平行通道工作執行，接著把兩者的成品下載到一個小型報告工作中，以進行最終對等比較。

對於一般 PR，請遵循有範圍的 CI/檢查證據，而不是把對等視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意作為範圍狹窄的第一輪安全掃描器，而不是完整儲存庫掃描。每日、手動與非草稿 pull request 防護執行會掃描 Actions 工作流程程式碼，以及風險最高的 JavaScript/TypeScript 表面，並使用高信心安全查詢，篩選高/關鍵 `security-severity`。

pull request 防護保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下有變更時啟動，且會執行與排程工作流程相同的高信心安全矩陣。Android 與 macOS CodeQL 不包含在 PR 預設值中。

### 安全類別

| 類別                                          | 表面                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 驗證、秘密、沙箱、cron 與 Gateway 基準                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，加上通道 Plugin 執行階段、Gateway、Plugin SDK、秘密、稽核接觸點              |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、網頁擷取與 Plugin SDK SSRF 政策表面                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行協助工具、對外傳遞，以及代理工具執行閘門                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、載入器、資訊清單、登錄、套件管理器安裝、來源載入，以及 Plugin SDK 套件合約信任表面 |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。為 CodeQL 手動建置 Android 應用程式，使用工作流程健全性接受的最小 Blacksmith Linux 執行器。上傳到 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式，從上傳的 SARIF 中篩除相依性建置結果，並上傳到 `/codeql-critical-security/macos` 底下。由於即使乾淨時 macOS 建置也主導執行時間，因此保留在每日預設值之外。

### 關鍵品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在較小的 Blacksmith Linux 執行器上，針對狹窄且高價值的表面執行錯誤嚴重性、非安全 JavaScript/TypeScript 品質查詢。其 pull request 防護刻意比排程設定檔更小：非草稿 PR 只會針對代理指令/模型/工具執行與回覆派送程式碼、設定結構描述/遷移/IO 程式碼、驗證/秘密/沙箱/安全程式碼、核心通道與內建通道 Plugin 執行階段、Gateway 協定/伺服器方法、記憶執行階段/SDK 黏合作業、MCP/程序/對外傳遞、提供者執行階段/模型目錄、工作階段診斷/傳遞佇列、Plugin 載入器、Plugin SDK/套件合約，或 Plugin SDK 回覆執行階段變更，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動派送接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用於獨立執行單一品質分片的教學/反覆操作掛鉤。

| 類別                                                | 表面                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 驗證、秘密、沙箱、cron 與 Gateway 安全邊界程式碼                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化與 IO 合約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway 協定結構描述與伺服器方法合約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與內建通道 Plugin 實作合約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | 指令執行、模型/提供者派送、自動回覆派送與佇列，以及 ACP 控制平面執行階段合約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接器、程序監督協助工具，以及對外傳遞合約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶主機 SDK、記憶執行階段門面、記憶 Plugin SDK 別名、記憶執行階段啟用黏合作業，以及記憶 doctor 指令                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞協助工具、診斷事件/記錄組合包表面，以及工作階段 doctor CLI 合約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆派送、回覆承載/分塊/執行階段協助工具、通道回覆選項、傳遞佇列，以及工作階段/執行緒繫結協助工具             |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、提供者驗證與探索、提供者執行階段註冊、提供者預設值/目錄，以及網頁/搜尋/擷取/嵌入登錄    |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、Gateway 控制流程，以及任務控制平面執行階段合約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心網頁擷取/搜尋、媒體 IO、媒體理解、影像生成，以及媒體生成執行階段合約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、登錄、公開表面與 Plugin SDK 進入點合約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 來源與 Plugin 套件合約協助工具                                                                                      |

品質與安全保持分離，讓品質發現可以在不模糊安全訊號的情況下排程、測量、停用或擴充。Swift、Python 與內建 Plugin CodeQL 擴充，應只在狹窄設定檔具備穩定執行時間與訊號後，作為有範圍或分片的後續工作加回。

## 維護工作流程

### 文件代理

`Docs Agent` 工作流程是事件驅動的 Codex 維護通道，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非機器人推送 CI 執行可以觸發它，手動派送也可以直接執行它。當 `main` 已向前推進，或在過去一小時內已有另一個未略過的 Docs Agent 執行被建立時，工作流程執行觸發會略過。執行時，它會檢視從前一個未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件通過以來累積的所有 main 變更。

### 測試效能代理

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護通道，用於處理緩慢測試。它沒有純排程：`main` 上成功的非機器人推送 CI 執行可以觸發它，但如果同一 UTC 日已經有另一個工作流程執行觸發已執行或正在執行，它會略過。手動派送會繞過該每日活動閘門。此通道會建立完整套件分組 Vitest 效能報告，讓 Codex 只進行保留涵蓋率的小型測試效能修正，而不是廣泛重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，且代理後的完整套件報告必須通過，才能提交任何內容。當機器人推送落地前 `main` 向前推進時，此通道會重定基底已驗證的修補、重新執行 `pnpm check:changed`，並重試推送；衝突的過期修補會被略過。它使用 GitHub 託管的 Ubuntu，讓 Codex 動作能維持與文件代理相同的放棄 sudo 安全姿態。

### 合併後重複的 PR

`Duplicate PRs After Merge` 工作流程是用於落地後重複項清理的手動維護者工作流程。它預設為試跑，且只有在 `apply=true` 時才會關閉明確列出的 PR。在修改 GitHub 前，它會驗證已落地的 PR 已合併，且每個重複項都有共用參照議題或重疊的變更區塊。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機變更通道邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求，比廣泛 CI 平台範圍更嚴格：

- core production 變更會執行 core prod 與 core test typecheck，再加上 core lint/guards；
- core test-only 變更只會執行 core test typecheck，再加上 core lint；
- extension production 變更會執行 extension prod 與 extension test typecheck，再加上 extension lint；
- extension test-only 變更會執行 extension test typecheck，再加上 extension lint；
- public Plugin SDK 或 plugin-contract 變更會擴大到 extension typecheck，因為 extensions 依賴這些 core contracts（Vitest extension sweeps 仍維持明確的測試工作）；
- 僅 release metadata 的版本升級會執行目標式 version/config/root-dependency 檢查；
- 未知的 root/config 變更會以安全失敗方式進入所有 check lanes。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更省成本：直接測試編輯會執行自身，source 編輯會優先使用明確 mappings，接著是 sibling tests 與 import-graph dependents。共享 group-room delivery config 是其中一個明確 mappings：對 group visible-reply config、source reply delivery mode，或 message-tool system prompt 的變更，會透過 core reply tests 加上 Discord 與 Slack delivery regressions 路由，因此共享預設值變更會在第一次 PR push 之前失敗。只有在變更的範圍廣到整個 harness，導致低成本 mapped set 不是可信 proxy 時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從 repo root 執行 Testbox，且進行廣泛 proof 時偏好使用全新 warmed box。若要在 reused、expired，或剛回報異常大量 sync 的 box 上花時間跑慢速 gate，請先在 box 內執行 `pnpm testbox:sanity`。

當必要 root files（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個 tracked deletions 時，sanity check 會快速失敗。這通常表示遠端 sync 狀態不是 PR 的可信副本；請停止該 box，並 warm 一個新的，而不是除錯產品測試失敗。若是刻意的大量刪除 PR，請為該 sanity run 設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止在 sync 階段停留超過五分鐘且沒有 post-sync output 的本機 Blacksmith CLI invocation。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該 guard，或針對異常大量的本機 diff 使用較大的毫秒值。

Crabbox 是 repo 擁有的 remote-box wrapper，用於 maintainer Linux proof。當檢查對本機編輯 loop 來說範圍太廣、需要 CI parity，或 proof 需要 secrets、Docker、package lanes、可重用 boxes，或遠端 logs 時使用它。一般 OpenClaw backend 是 `blacksmith-testbox`；擁有的 AWS/Hetzner capacity 則是 Blacksmith outage、quota issues，或明確 owned-capacity testing 的 fallback。

第一次執行前，請從 repo root 檢查 wrapper：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

若 Crabbox binary 過舊且未宣告 `blacksmith-testbox`，repo wrapper 會拒絕執行。即使 `.crabbox.yaml` 有 owned-cloud defaults，也請明確傳入 provider。

Changed gate：

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

Focused test rerun：

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

Full suite：

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

閱讀最終 JSON summary。有用的欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 與 `totalMs`。一次性的 Blacksmith-backed Crabbox runs 應自動停止 Testbox；若 run 被中斷或 cleanup 不明確，請檢查 live boxes，且只停止你建立的 boxes：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要於同一個 hydrated box 上執行多個 commands 時，才使用 reuse：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

若 Crabbox 是故障層但 Blacksmith 本身可用，請使用 direct Blacksmith 作為狹窄 fallback：

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

若 `blacksmith testbox list --all` 與 `blacksmith testbox status` 可用，但新的 warmups 在幾分鐘後仍停在 `queued`，且沒有 IP 或 Actions run URL，請將其視為 Blacksmith provider、queue、billing，或 org-limit 壓力。停止你建立的 queued ids，避免啟動更多 Testboxes，並將 proof 移到下方 owned Crabbox capacity path，同時讓人檢查 Blacksmith dashboard、billing 與 org limits。

只有在 Blacksmith down、quota-limited、缺少所需環境，或 owned capacity 明確是目標時，才升級到 owned Crabbox capacity：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務確實需要 48xlarge-class CPU，否則避免使用 `class=beast`。`beast` request 從 192 vCPUs 開始，是最容易觸發 regional EC2 Spot 或 On-Demand Standard quota 的方式。repo 擁有的 `.crabbox.yaml` 預設為 `standard`、多個 capacity regions 與 `capacity.hints: true`，因此 brokered AWS leases 會列印所選 region/market、quota pressure、Spot fallback，以及 high-pressure class warnings。較重的 broad checks 請使用 `fast`；只有在 standard/fast 不足時才使用 `large`；`beast` 只用於例外的 CPU-bound lanes，例如 full-suite 或 all-plugin Docker matrices、明確的 release/blocker validation，或 high-core performance profiling。不要將 `beast` 用於 `pnpm check:changed`、focused tests、docs-only work、一般 lint/typecheck、小型 E2E repros，或 Blacksmith outage triage。進行 capacity diagnosis 時使用 `--market on-demand`，避免將 Spot market churn 混入 signal。

`.crabbox.yaml` 擁有 owned-cloud lanes 的 provider、sync 與 GitHub Actions hydration defaults。它會排除本機 `.git`，因此 hydrated Actions checkout 會保留自身的 remote Git metadata，而不是 sync maintainer-local remotes 與 object stores；它也會排除不應轉移的本機 runtime/build artifacts。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm setup、`origin/main` fetch，以及 owned-cloud `crabbox run --id <cbx_id>` commands 的 non-secret environment handoff。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發頻道](/zh-TW/install/development-channels)
