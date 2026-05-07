---
read_when:
    - 您需要了解 CI 作業為何有執行或未執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 你正在協調發行驗證的執行或重新執行
    - 你正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括項與本機命令對應項
title: CI 管線
x-i18n:
    generated_at: "2026-05-07T13:13:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個拉取請求時執行。`preflight` 作業會分類差異，並在只有不相關區域變更時關閉昂貴的檢查路徑。手動 `workflow_dispatch` 執行會刻意略過智慧範圍界定，並展開完整圖譜，用於發布候選版本與廣泛驗證。Android 路徑會透過 `include_android` 保持選擇性啟用。僅發布使用的 Plugin 覆蓋率位於獨立的 [`Plugin 預發布`](#plugin-prerelease) 工作流程中，且只會從 [`完整發布驗證`](#full-release-validation) 或明確的手動派送執行。

## 管線概覽

| 作業                             | 目的                                                                                                      | 執行時機                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、已變更範圍、已變更 extensions，並建置 CI manifest                                         | 一律在非草稿推送與 PR 上執行      |
| `security-scm-fast`              | 透過 `zizmor` 偵測私密金鑰並稽核工作流程                                                                  | 一律在非草稿推送與 PR 上執行      |
| `security-dependency-audit`      | 針對 npm advisories 進行無相依項的生產 lockfile 稽核                                                      | 一律在非草稿推送與 PR 上執行      |
| `security-fast`                  | 快速安全性作業的必要彙總                                                                                  | 一律在非草稿推送與 PR 上執行      |
| `check-dependencies`             | 生產 Knip 僅相依項檢查，加上未使用檔案 allowlist 防護                                                     | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置成品檢查，以及可重複使用的下游成品                                        | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性路徑，例如 bundled/plugin-contract/protocol 檢查                                         | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的 channel contract 檢查，並提供穩定的彙總檢查結果                                                    | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，排除 channel、bundled、contract 與 extension 路徑                                     | Node 相關變更                      |
| `check`                          | 分片的主要本機 gate 等效項：prod types、lint、guards、test types，以及 strict smoke                       | Node 相關變更                      |
| `check-additional`               | 架構、分片的 boundary/prompt drift、extension guards、package boundary，以及 gateway watch                 | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI 的 smoke tests 與 startup-memory smoke                                                         | Node 相關變更                      |
| `checks`                         | 已建置成品 channel tests 的驗證器                                                                         | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 路徑                                                                           | 發布用手動 CI 派送                 |
| `check-docs`                     | 文件格式化、lint 與損壞連結檢查                                                                          | 文件已變更                         |
| `skills-python`                  | Python 支援 Skills 的 Ruff + pytest                                                                       | Python Skill 相關變更              |
| `checks-windows`                 | Windows 專用 process/path 測試，加上共用 runtime import specifier regression                              | Windows 相關變更                   |
| `macos-node`                     | 使用共用已建置成品的 macOS TypeScript 測試路徑                                                           | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、build 與 tests                                                                   | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android unit tests，加上一個 debug APK build                                               | Android 相關變更                   |
| `test-performance-agent`         | 受信任活動後每日 Codex slow-test 最佳化                                                                  | Main CI 成功或手動派送             |
| `openclaw-performance`           | 每日/隨需 Kova runtime 效能報告，包含 mock-provider、deep-profile 與 GPT 5.4 live 路徑                    | 排程與手動派送                     |

## 失敗優先順序

1. `preflight` 會決定哪些路徑實際存在。`docs-scope` 與 `changed-scope` 邏輯是此作業內的步驟，不是獨立作業。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 與 `skills-python` 會快速失敗，而不等待較重的成品與平台矩陣作業。
3. `build-artifacts` 會與快速 Linux 路徑重疊執行，讓下游消費者能在共用建置準備好後立即開始。
4. 較重的平台與 runtime 路徑隨後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 與 `android`。

當同一個 PR 或 `main` ref 上有新的推送落地時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則應將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此它們仍會回報一般分片失敗，但不會在整個工作流程已被取代後繼續排隊。自動 CI concurrency key 已版本化（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍狀態無法無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消執行中的工作。

`ci-timings-summary` 作業會為每次非草稿 CI 執行上傳精簡的 `ci-timings-summary` 成品。它會記錄目前執行的 wall time、queue time、最慢作業與失敗作業，因此 CI 健康檢查不需要反覆抓取完整 Actions payload。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動派送會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個已界定範圍的區域都已變更。

- **CI 工作流程編輯**會驗證 Node CI 圖譜加上工作流程 linting，但不會單獨強制執行 Windows、Android 或 macOS 原生建置；這些平台路徑仍限定於平台原始碼變更。
- **CI 僅路由編輯、選定的廉價 core-test fixture 編輯，以及狹窄的 plugin contract helper/test-routing 編輯**會使用快速 Node-only manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` 工作。當變更僅限於快速工作直接覆蓋的路由或 helper 表面時，該路徑會略過 build artifacts、Node 22 compatibility、channel contracts、完整 core shards、bundled-plugin shards，以及額外的 guard matrices。
- **Windows Node checks**限定於 Windows 專用 process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該路徑的 CI workflow surfaces；不相關的 source、plugin、install-smoke 與 test-only 變更會留在 Linux Node 路徑上。

最慢的 Node 測試家族會被拆分或平衡，讓每個作業維持小型而不過度保留 runner：channel contracts 以三個加權 Blacksmith 支援的分片執行，並有標準 GitHub runner fallback；core unit fast/support 路徑分開執行；core runtime infra 分成 state、process/config、cron 與 shared shards；auto-reply 以平衡 worker 執行（reply 子樹拆成 agent-runner、dispatch 與 commands/state-routing shards）；agentic gateway/server configs 則拆分到 chat/auth/model/http-plugin/runtime/startup 路徑，而不是等待 built artifacts。廣泛的 browser、QA、media 與 miscellaneous plugin tests 使用其專用 Vitest configs，而非共用 plugin catch-all。Include-pattern shards 會使用 CI shard name 記錄 timing entries，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 與 filtered shard。`check-additional` 會把 package-boundary compile/canary work 放在一起，並將 runtime topology architecture 與 gateway watch coverage 分開；boundary guard list 會分散到四個 matrix shards，每個分片並行執行選定的獨立 guards，並列印每項檢查的 timings。昂貴的 Codex happy-path prompt snapshot drift check 會作為自己的 additional job 執行，且只在手動 CI 與影響 prompt 的變更中執行，因此一般不相關的 Node 變更不會卡在冷啟 prompt snapshot generation 後面，boundary shards 也能維持平衡，同時 prompt drift 仍會固定到造成它的 PR；相同旗標也會在 built-artifact core support-boundary shard 內略過 prompt snapshot Vitest generation。Gateway watch、channel tests 與 core support-boundary shard 會在 `dist/` 與 `dist-runtime/` 已建置完成後，於 `build-artifacts` 內並行執行。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test 路徑仍會使用 SMS/call-log BuildConfig flags 編譯該 flavor，同時避免在每個 Android 相關推送上執行重複的 debug APK packaging job。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（生產 Knip 僅相依項檢查，固定使用最新 Knip 版本，並在 `dlx` 安裝時停用 pnpm 的 minimum release age）以及 `pnpm deadcode:unused-files`，後者會將 Knip 的生產未使用檔案發現結果與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的未使用檔案，或留下過時的 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的刻意動態 plugin、generated、build、live-test 與 package bridge surfaces。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository activity 到 ClawSweeper 的目標端橋接。它不會 check out 或執行不受信任的 pull request code。此工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payload 派送到 `openclaw/clawsweeper`。

此工作流程有四個路徑：

- `clawsweeper_item` 用於精確的 issue 與 pull request review requests；
- `clawsweeper_comment` 用於 issue comments 中明確的 ClawSweeper commands；
- `clawsweeper_commit_review` 用於 `main` pushes 上的 commit-level review requests；
- `github_activity` 用於 ClawSweeper agent 可能檢查的一般 GitHub activity。

`github_activity` 路徑只會轉送正規化中繼資料：event type、action、actor、repository、item number、URL、title、state，以及存在時的 comments 或 reviews 簡短摘錄。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，它會將正規化事件發布到 ClawSweeper agent 的 OpenClaw Gateway hook。

一般活動是觀察，而非預設遞送。ClawSweeper agent 會在其 prompt 中收到 Discord 目標，且只有在事件令人意外、可採取行動、有風險或具有營運用途時，才應發布到 `#clawsweeper`。例行開啟、編輯、bot churn、重複 webhook noise 與一般 review traffic 應產生 `NO_REPLY`。

將整條路徑中的 GitHub 標題、留言、內文、審查文字、分支名稱和 commit 訊息視為不受信任的資料。它們是摘要與分流的輸入，不是 workflow 或 agent runtime 的指令。

## 手動 dispatch

手動 CI dispatch 會執行與一般 CI 相同的 job graph，但會強制啟用所有非 Android 範圍 lane：Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI dispatch 只有在 `include_android=true` 時執行 Android；完整 release umbrella 會透過傳入 `include_android=true` 啟用 Android。Plugin prerelease static checks、僅限 release 的 `agentic-plugins` shard、完整 extension batch sweep，以及 plugin prerelease Docker lanes 會從 CI 排除。Docker prerelease suite 只會在 `Full Release Validation` dispatch 另一個 `Plugin Prerelease` workflow，且啟用 release-validation gate 時執行。

手動執行使用唯一的 concurrency group，因此 release-candidate full suite 不會被同一 ref 上的另一個 push 或 PR run 取消。選用的 `target_ref` input 可讓受信任的 caller 使用所選 dispatch ref 的 workflow 檔案，針對 branch、tag 或完整 commit SHA 執行該 graph。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、快速 security jobs 與彙總 (`security-scm-fast`、`security-dependency-audit`、`security-fast`)、快速 protocol/contract/bundled checks、分 shard 的 channel contract checks、除 lint 外的 `check` shards、`check-additional` 彙總、Node test aggregate verifiers、docs checks、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub-hosted Ubuntu，讓 Blacksmith matrix 可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低負載的 extension shards、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                              |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node test shards、bundled Plugin test shards、`check-additional` shards、`android`                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 敏感到 8 vCPU 的成本高於節省的時間）；install-smoke Docker builds（32-vCPU 排隊時間成本高於節省的時間）                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會 fallback 到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會 fallback 到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                   |

canonical repo CI 保持 Blacksmith 作為預設 Runner 路徑。在 `preflight` 期間，`scripts/ci-runner-labels.mjs` 會檢查最近 queued 和 in-progress 的 Actions runs 是否有 queued Blacksmith jobs。如果特定 Blacksmith label 已有 queued jobs，後續會使用該精確 label 的 jobs 只會在該次 run fallback 到相符的 GitHub-hosted Runner（`ubuntu-24.04`、`windows-2025` 或 `macos-latest`）。同一 OS family 中的其他 Blacksmith sizes 會保留在其主要 labels 上。如果 API probe 失敗，則不套用 fallback。

## 本機等價命令

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

## OpenClaw Performance

`OpenClaw Performance` 是 product/runtime performance workflow。它每日在 `main` 上執行，也可手動 dispatch：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動 dispatch 通常 benchmark workflow ref。設定 `target_ref` 可使用目前的 workflow implementation benchmark release tag 或其他 branch。已發布的 report paths 和 latest pointers 會依 tested ref 建立 key，而且每個 `index.md` 都會記錄 tested ref/SHA、workflow ref/SHA、Kova ref、profile、lane auth mode、model、repeat count 和 scenario filters。

workflow 會從 pinned release 安裝 OCM，並從 `openclaw/Kova` 依 pinned `kova_ref` input 安裝 Kova，然後執行三個 lane：

- `mock-provider`：Kova diagnostic scenarios，針對 local-build runtime，並使用 deterministic fake OpenAI-compatible auth。
- `mock-deep-profile`：startup、Gateway 和 agent-turn hotspots 的 CPU/heap/trace profiling。
- `live-gpt54`：真實的 OpenAI `openai/gpt-5.4` agent turn；當 `OPENAI_API_KEY` 無法使用時略過。

mock-provider lane 也會在 Kova pass 之後執行 OpenClaw-native source probes：default、hook 和 50-Plugin startup cases 的 Gateway boot timing 與 memory；重複的 mock-OpenAI `channel-chat-baseline` hello loops；以及針對已啟動 Gateway 的 CLI startup commands。source probe Markdown 摘要位於 report bundle 中的 `source/index.md`，旁邊有 raw JSON。

每個 lane 都會上傳 GitHub artifacts。設定 `CLAWGRIT_REPORTS_TOKEN` 時，workflow 也會將 `report.json`、`report.md`、bundles、`index.md` 和 source-probe artifacts commit 到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 底下。目前 tested-ref pointer 會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## Full Release Validation

`Full Release Validation` 是「release 前執行所有項目」的手動 umbrella workflow。它接受 branch、tag 或完整 commit SHA，使用該 target dispatch 手動 `CI` workflow、dispatch `Plugin Prerelease` 以取得僅 release 使用的 plugin/package/static/Docker proof，並 dispatch `OpenClaw Release Checks` 以執行 install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix 和 Telegram lanes。Stable/default runs 會把 exhaustive live/E2E 和 Docker release-path coverage 保留在 `run_release_soak=true` 後方；`release_profile=full` 會強制開啟該 soak coverage，讓廣泛 advisory validation 仍保持廣泛。搭配 `rerun_group=all` 和 `release_profile=full` 時，它也會針對 release checks 的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳入 `npm_telegram_package_spec` 可針對已發布的 npm package 重新執行相同的 Telegram package lane。

請參閱 [完整 release validation](/zh-TW/reference/full-release-validation)，了解 stage matrix、精確 workflow job names、profile differences、artifacts，以及 focused rerun handles。

`OpenClaw Release Publish` 是手動 mutating release workflow。在 release tag 存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.D` 或 `main` dispatch 它。它會驗證 `pnpm plugins:sync:check`、為所有可發布的 Plugin packages dispatch `Plugin NPM Release`、為相同 release SHA dispatch `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` dispatch `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上提供釘選提交證明，請使用輔助工具，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref 必須是分支或標籤，不能是原始提交 SHA。此輔助工具會在目標 SHA 上推送一個暫時的 `release-ci/<sha>-...` 分支，從該釘選 ref dispatch `Full Release Validation`，驗證每個子工作流程的 `headSha` 都符合目標，並在執行完成時刪除暫時分支。總括驗證器也會在任何子工作流程於不同 SHA 執行時失敗。

`release_profile` 控制傳遞給發布檢查的 live/provider 涵蓋範圍。手動發布工作流程預設為 `stable`；只有在你有意執行廣泛的 advisory provider/media 矩陣時，才使用 `full`。`run_release_soak` 控制 stable/default 發布檢查是否執行完整的 live/E2E 與 Docker 發布路徑 soak；`full` 會強制啟用 soak。

- `minimum` 保留最快的 OpenAI/core 發布關鍵 lane。
- `stable` 加入穩定的 provider/backend 集合。
- `full` 執行廣泛的 advisory provider/media 矩陣。

總括流程會記錄已 dispatch 的子執行 ID，而最終的 `Verify full validation` job 會重新檢查目前的子執行結論，並為每個子執行附加最慢 job 表格。如果某個子工作流程重新執行後轉為綠燈，只需重新執行父層驗證器 job，即可重新整理總括結果與時間摘要。

若要復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。發布候選版請使用 `all`，只重跑一般完整 CI 子項請使用 `ci`，只重跑 Plugin prerelease 子項請使用 `plugin-prerelease`，重跑每個發布子項請使用 `release-checks`，或在總括流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會在聚焦修復後，讓失敗的發布 box 重新執行範圍保持受限。若是單一失敗的跨 OS lane，請將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 結合，例如 `windows/packaged-upgrade`；長時間的跨 OS 命令會輸出 Heartbeat 行，而 packaged-upgrade 摘要會包含各階段計時。QA 發布檢查 lane 屬於 advisory，因此只有 QA 失敗會警告，但不會阻擋 release-check 驗證器。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將所選 ref 解析一次成 `release-package-under-test` tarball，然後將該成品傳遞給跨 OS 檢查與 Package Acceptance；當執行 soak 涵蓋範圍時，也會傳給 live/E2E 發布路徑 Docker 工作流程。這能讓發布 box 之間的套件位元組保持一致，並避免在多個子 job 中重複打包同一候選版本。

`ref=main` 且 `rerun_group=all` 的重複 `Full Release Validation` 執行會取代較舊的總括流程。父層監視器會在父層被取消時，取消任何已 dispatch 的子工作流程，因此較新的 main 驗證不會被卡在過期的兩小時 release-check 執行後方。發布分支/標籤驗證與聚焦的重新執行群組會保持 `cancel-in-progress: false`。

## Live 與 E2E 分片

發布 live/E2E 子項保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但會透過 `scripts/test-live-shard.mjs` 以命名分片執行，而不是單一序列 job：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider 篩選的 `native-live-src-gateway-profiles` job
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的 media audio/video 分片，以及 provider 篩選的 music 分片

這能維持相同的檔案涵蓋範圍，同時讓緩慢的 live provider 失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱仍可用於手動一次性重新執行。

原生 live media 分片會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。此映像預先安裝 `ffmpeg` 與 `ffprobe`；media job 只會在設定前驗證二進位檔。請將 Docker 支援的 live 套件保持在一般 Blacksmith runner 上執行 — container job 不適合啟動巢狀 Docker 測試。

Docker 支援的 live model/backend 分片會針對每個選取的提交使用獨立共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。live 發布工作流程會建置並推送該映像一次，接著 Docker live model、provider 分片 Gateway、CLI backend、ACP bind 與 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片會帶有明確的 script-level `timeout` 上限，低於工作流程 job timeout，讓卡住的 container 或清理路徑快速失敗，而不是耗盡整個 release-check 預算。如果這些分片各自重新建置完整的 source Docker target，代表發布執行設定錯誤，會在重複映像建置上浪費實際時間。

## Package Acceptance

當問題是「這個可安裝的 OpenClaw 套件作為產品是否正常運作？」時，請使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證 source tree，而 package acceptance 會透過使用者在安裝或更新後使用的同一套 Docker E2E harness 驗證單一 tarball。

### Job

1. `resolve_package` 會 checkout `workflow_ref`，解析一個套件候選版本，寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，寫入 `.artifacts/docker-e2e-package/package-candidate.json`，將兩者上傳為 `package-under-test` 成品，並在 GitHub step summary 中列印來源、工作流程 ref、套件 ref、版本、SHA-256 與 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball inventory、在需要時準備 package-digest Docker 映像，並針對該套件執行選取的 Docker lane，而不是打包工作流程 checkout。當某個 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會準備套件與共享映像一次，然後將那些 lane 展開為具有唯一成品的平行目標 Docker job。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。它會在 `telegram_mode` 不是 `none` 時執行，並在 Package Acceptance 已解析套件時安裝同一個 `package-under-test` 成品；獨立 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker acceptance 或可選 Telegram lane 失敗時讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。請將它用於已發布 prerelease/stable 的驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整提交 SHA。解析器會擷取 OpenClaw 分支/標籤、驗證所選提交可從儲存庫分支歷史或發布標籤觸及、在 detached worktree 中安裝相依項，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；`package_sha256` 為必填。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 可選，但外部共享成品應提供。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是在 `source=ref` 時會被打包的來源提交。這可讓目前的測試 harness 驗證較舊的受信任來源提交，而不執行舊的工作流程邏輯。

### 套件 profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 確切的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` profile 使用離線 Plugin 涵蓋範圍，因此已發布套件驗證不會受 live ClawHub 可用性阻擋。可選 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，而已發布 npm spec 路徑會保留給獨立 dispatch。

如需專用的更新與 Plugin 測試政策，包括本機命令、Docker lane、Package Acceptance 輸入、發布預設值與失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、準備好的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 呼叫 Package Acceptance。這會將套件 migration、更新、過期 Plugin 相依項清理、已設定 Plugin 安裝修復、離線 Plugin、Plugin 更新與 Telegram 證明維持在同一個已解析套件 tarball 上。請在 Full Release Validation 或 OpenClaw Release Checks 上設定 `package_acceptance_package_spec`，以針對已出貨的 npm 套件執行相同矩陣，而不是 SHA 建置的成品。跨 OS 發布檢查仍會涵蓋 OS 特定的 onboarding、installer 與 platform 行為；套件/更新產品驗證應從 Package Acceptance 開始。`published-upgrade-survivor` Docker lane 會在阻擋發布路徑中，每次執行驗證一個已發布套件 baseline。在 Package Acceptance 中，已解析的 `package-under-test` tarball 永遠是候選版本，而 `published_upgrade_survivor_baseline` 會選取 fallback 已發布 baseline，預設為 `openclaw@latest`；失敗 lane 的重新執行命令會保留該 baseline。使用 `run_release_soak=true` 或 `release_profile=full` 的 Full Release Validation 會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 和 `published_upgrade_survivor_scenarios=reported-issues`，以擴展至最新四個 stable npm release，加上釘選的 Plugin 相容性邊界 release，以及對應 issue 形狀的 fixture，涵蓋 Feishu config、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、tilde log 路徑與過期 legacy Plugin 相依項 root。多 baseline 的 published-upgrade survivor 選擇會依 baseline 分片到獨立的目標 Docker runner job。獨立的 `Update Migration` 工作流程會在問題是完整的已發布更新清理，而非一般 Full Release CI 廣度時，使用 `update-migration` Docker lane 搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup`。本機彙總執行可以使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入確切的套件 spec，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保持單一 lane，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用情境矩陣。已發布 lane 會使用內建的 `openclaw config set` 命令 recipe 設定 baseline，在 `summary.json` 中記錄 recipe 步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 與 RPC 狀態。Windows packaged 與 installer fresh lane 也會驗證已安裝套件能從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 會在已設定時預設使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因此安裝與 Gateway 證明會維持在 GPT-5 測試模型上，同時避免 GPT-4.x 預設值。

### Legacy 相容性窗口

套件驗收對已發布的套件有界定的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可以指向 tarball 省略的檔案；
- 當套件未公開 `gateway install --wrapper` 旗標時，`doctor-switch` 可以略過其持久化子案例；
- `update-channel-switch` 可以從 tarball 衍生的假 git fixture 中修剪遺失的 `pnpm.patchedDependencies`，並可記錄遺失的已持久化 `update.channel`；
- Plugin 冒煙測試可以讀取舊版安裝記錄位置，或接受缺少 marketplace 安裝記錄持久化；
- `plugin-update` 可以允許設定 metadata 遷移，同時仍要求安裝記錄和不重新安裝行為保持不變。

已發布的 `2026.4.26` 套件也可以針對已出貨的本機建置 metadata stamp 檔案發出警告。後續套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，先從 `resolve_package` 摘要開始，確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker artifacts：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日誌、階段計時，以及重新執行命令。偏好重新執行失敗的套件 profile 或精確的 Docker lanes，而不是重新執行完整發行驗證。

## 安裝冒煙測試

獨立的 `Install Smoke` workflow 透過自己的 `preflight` job 重複使用相同的範圍 script。它將冒煙測試涵蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會針對觸及 Docker/套件表面、隨附 Plugin 套件/manifest 變更，或 Docker 冒煙 job 會涵蓋的核心 Plugin/channel/gateway/Plugin SDK 表面的 pull request 執行。僅原始碼的隨附 Plugin 變更、僅測試編輯和僅文件編輯不會保留 Docker workers。快速路徑會建置一次根 Dockerfile image、檢查 CLI、執行 agents delete shared-workspace CLI 冒煙測試、執行 container gateway-network e2e、驗證隨附 extension build arg，並在 240 秒彙總命令逾時內執行有界的隨附 Plugin Docker profile（每個情境的 Docker run 另有上限）。
- **完整路徑**保留 QR 套件安裝及 installer Docker/update 涵蓋範圍，用於 nightly 排程執行、手動 dispatch、workflow-call 發行檢查，以及真正觸及 installer/package/Docker 表面的 pull request。在完整模式下，install-smoke 會準備或重複使用一個 target-SHA GHCR 根 Dockerfile 冒煙 image，接著將 QR 套件安裝、根 Dockerfile/gateway 冒煙測試、installer/update 冒煙測試，以及快速隨附 Plugin Docker E2E 作為獨立 job 執行，讓 installer 工作不必等待根 image 冒煙測試。

`main` push（包括 merge commit）不會強制完整路徑；當 changed-scope 邏輯會在 push 上要求完整涵蓋範圍時，workflow 會保留快速 Docker 冒煙測試，並將完整安裝冒煙測試留給 nightly 或發行驗證。

較慢的 Bun 全域安裝 image-provider 冒煙測試由 `run_bun_global_install_smoke` 另行控管。它會在 nightly 排程和發行檢查 workflow 中執行，手動 `Install Smoke` dispatch 可以選擇加入它，但 pull request 和 `main` push 不會。QR 和 installer Docker 測試保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共享的 live-test image，將 OpenClaw 打包一次為 npm tarball，並建置兩個共享的 `scripts/e2e/Dockerfile` image：

- 用於 installer/update/plugin-dependency lanes 的裸 Node/Git runner；
- 將相同 tarball 安裝到 `/app` 的功能 image，用於一般功能 lanes。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只執行選定的 plan。scheduler 會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇 image，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lanes。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lanes 的主 pool slot 數量。                                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider 敏感 tail-pool slot 數量。                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 providers 進行節流。                                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，以避免 Docker daemon 建立風暴；設為 `0` 表示不錯開。                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback 逾時（120 分鐘）；選定的 live/tail lanes 會使用更嚴格的上限。           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印 scheduler plan，而不執行 lanes。                                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；略過清理冒煙測試，讓 agents 能重現單一失敗 lane。                |

比其有效上限更重的 lane 仍可從空 pool 啟動，接著會獨自執行直到釋放容量。本機彙總會 preflight Docker、移除過期的 OpenClaw E2E containers、輸出 active-lane 狀態、持久化 lane 計時以便 longest-first 排序，且預設在第一次失敗後停止排程新的 pooled lanes。

### 可重複使用的 live/E2E workflow

可重複使用的 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些套件、image kind、live image、lane 和 credential 涵蓋範圍。`scripts/docker-e2e.mjs` 接著會將該 plan 轉換成 GitHub outputs 和 summaries。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件 artifact，或從 `package_artifact_run_id` 下載套件 artifact；驗證 tarball inventory；當 plan 需要已安裝套件的 lanes 時，透過 Blacksmith 的 Docker layer cache 建置並推送以 package digest 標記的 bare/functional GHCR Docker E2E images；並重複使用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` inputs 或既有的 package-digest images，而不是重新建置。Docker image pull 會以有界的每次嘗試 180 秒逾時重試，讓卡住的 registry/cache stream 能快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發行路徑區塊

發行 Docker 涵蓋範圍會以較小的 chunked jobs 執行，搭配 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個 chunk 只 pull 其需要的 image kind，並透過相同的加權 scheduler 執行多個 lanes：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發行 Docker chunks 為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總 Plugin/runtime aliases。`install-e2e` lane alias 仍是兩個 provider installer lanes 的彙總手動重新執行 alias。

當完整 release-path 涵蓋範圍要求時，OpenWebUI 會併入 `plugins-runtime-services`，且只針對僅 OpenWebUI dispatch 保留獨立的 `openwebui` chunk。隨附 channel update lanes 會針對暫時性 npm 網路失敗重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane 日誌、計時、`summary.json`、`failures.json`、階段計時、scheduler plan JSON、slow-lane tables，以及每個 lane 的重新執行命令。workflow `docker_lanes` input 會針對已準備的 images 執行選定 lanes，而不是 chunk jobs，這會將失敗 lane 偵錯界定在一個目標 Docker job，並為該執行準備、下載或重複使用套件 artifact；如果選定 lane 是 live Docker lane，目標 job 會為該次重新執行在本機建置 live-test image。產生的每個 lane GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備 image inputs，因此失敗的 lane 可以重複使用失敗執行中的精確套件和 images。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E workflow 每天執行完整 release-path Docker suite。

## Plugin 預發行

`Plugin Prerelease` 是成本較高的產品/套件涵蓋範圍，因此它是由 `Full Release Validation` 或明確 operator dispatch 的獨立 workflow。一般 pull request、`main` push，以及獨立的手動 CI dispatch 會關閉該 suite。它會在八個 extension workers 之間平衡隨附 Plugin 測試；這些 extension shard jobs 一次最多執行兩個 Plugin config groups，每個 group 使用一個 Vitest worker 和較大的 Node heap，因此 import-heavy 的 Plugin batches 不會建立額外 CI jobs。僅發行的 Docker 預發行路徑會以小群組批次執行目標 Docker lanes，避免為一到三分鐘的 jobs 保留數十個 runners。

## QA 實驗室

QA 實驗室在主要 smart-scoped workflow 之外有專用的 CI lanes。Agentic parity 巢狀於廣泛 QA 和發行 harnesses 之下，而不是獨立的 PR workflow。當 parity 應隨著廣泛驗證執行時，使用 `Full Release Validation` 並搭配 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 每晚在 `main` 上執行，也可手動 dispatch；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lanes 展開為 parallel jobs。Live jobs 使用 `qa-live-shared` environment，Telegram/Discord 使用 Convex leases。

Release 檢查會使用確定性的 mock provider 與 mock-qualified models（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram live transport lanes，因此 channel contract 會與 live model 延遲及一般 provider-plugin 啟動隔離。live transport gateway 會停用 memory search，因為 QA parity 會另外涵蓋 memory 行為；provider 連線能力則由獨立的 live model、native provider 與 Docker provider suites 涵蓋。

Matrix 會在排程與 release gates 使用 `--profile fast`，且只在 checked-out CLI 支援時加入 `--fail-fast`。CLI 預設值與手動 workflow 輸入仍為 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix coverage 分片成 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` jobs。

`OpenClaw Release Checks` 也會在 release 核准前執行 release-critical QA Lab lanes；其 QA parity gate 會將 candidate 與 baseline packs 作為平行 lane jobs 執行，接著將兩個 artifacts 下載到小型 report job 中，用於最終 parity 比較。

對於一般 PR，請遵循 scoped CI/check 證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` workflow 刻意設計為狹窄的第一輪 security scanner，而不是完整的 repository sweep。每日、手動與非草稿 pull request guard runs 會掃描 Actions workflow code，以及風險最高的 JavaScript/TypeScript surfaces，並使用 high-confidence security queries，篩選至 high/critical `security-severity`。

pull request guard 維持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下有變更時啟動，並執行與 scheduled workflow 相同的 high-confidence security matrix。Android 與 macOS CodeQL 不包含在 PR defaults 中。

### Security categories

| 類別                                              | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、secrets、sandbox、Cron 與 Gateway baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel implementation contracts，加上 channel Plugin runtime、Gateway、Plugin SDK、secrets、audit touchpoints              |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF、IP parsing、network guard、web-fetch 與 Plugin SDK SSRF policy surfaces                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers、process execution helpers、outbound delivery 與 agent tool-execution gates                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install、loader、manifest、registry、package-manager install、source-loading 與 Plugin SDK package contract trust surfaces |

### Platform-specific security shards

- `CodeQL Android Critical Security` — 排程的 Android security shard。會在 workflow sanity 接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android app。上傳至 `/codeql-critical-security/android`。
- `CodeQL macOS Critical Security` — 每週/手動 macOS security shard。會在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中過濾 dependency build results，並上傳至 `/codeql-critical-security/macos`。由於即使 clean 時 macOS build 仍主導 runtime，因此保留在 daily defaults 之外。

### Critical Quality categories

`CodeQL Critical Quality` 是對應的非安全性 shard。它只會在較小的 Blacksmith Linux runner 上，針對狹窄的 high-value surfaces 執行 error-severity、非安全性的 JavaScript/TypeScript quality queries。其 pull request guard 刻意比 scheduled profile 更小：非草稿 PR 只會針對 agent command/model/tool execution 與 reply dispatch code、config schema/migration/IO code、auth/secrets/sandbox/security code、core channel 與 bundled channel Plugin runtime、Gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、Plugin loader、Plugin SDK/package-contract 或 Plugin SDK reply runtime 變更，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` shards。CodeQL config 與 quality workflow 變更會執行全部十二個 PR quality shards。

手動 dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄 profiles 是用來單獨執行一個 quality shard 的教學/迭代 hooks。

| 類別                                                    | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth、secrets、sandbox、Cron 與 Gateway security boundary code                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config schema、migration、normalization 與 IO contracts                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemas 與 server method contracts                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core channel 與 bundled channel Plugin implementation contracts                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution、model/provider dispatch、auto-reply dispatch 和 queues，以及 ACP control-plane runtime contracts                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers 與 tool bridges、process supervision helpers，以及 outbound delivery contracts                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK、memory runtime facades、memory Plugin SDK aliases、memory runtime activation glue，以及 memory doctor commands                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals、session delivery queues、outbound session binding/delivery helpers、diagnostic event/log bundle surfaces，以及 session doctor CLI contracts |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch、reply payload/chunking/runtime helpers、channel reply options、delivery queues，以及 session/thread binding helpers             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization、provider auth 與 discovery、provider runtime registration、provider defaults/catalogs，以及 web/search/fetch/embedding registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap、local persistence、Gateway control flows，以及 task control-plane runtime contracts                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search、media IO、media understanding、image-generation，以及 media-generation runtime contracts                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader、registry、public-surface 與 Plugin SDK entrypoint contracts                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Published package-side Plugin SDK source 與 Plugin package contract helpers                                                                                      |

Quality 與 security 分開，讓 quality findings 可以被排程、量測、停用或擴展，而不會模糊 security signal。Swift、Python 與 bundled-Plugin CodeQL expansion 應只在狹窄 profiles 具備穩定 runtime 與 signal 後，作為 scoped 或 sharded follow-up work 加回來。

## Maintenance workflows

### Docs Agent

`Docs Agent` workflow 是事件驅動的 Codex maintenance lane，用來讓既有文件與近期落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI run 可以觸發它，而手動 dispatch 可以直接執行它。Workflow-run invocations 會在 `main` 已經前進，或過去一小時內已建立另一個未 skipped 的 Docs Agent run 時略過。當它執行時，會檢閱從前一個未 skipped Docs Agent source SHA 到目前 `main` 的 commit range，因此每小時一次的 run 可以涵蓋自上次 docs pass 以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` workflow 是事件驅動的 Codex maintenance lane，用於 slow tests。它沒有純排程：`main` 上成功的非 bot push CI run 可以觸發它，但如果當天 UTC 已有另一個 workflow-run invocation 已執行或正在執行，它會略過。手動 dispatch 會略過該 daily activity gate。此 lane 會建置 full-suite grouped Vitest performance report，讓 Codex 只進行小型且保留 coverage 的 test performance fixes，而不是 broad refactors，接著重新執行 full-suite report，並拒絕會降低 passing baseline test count 的變更。如果 baseline 有 failing tests，Codex 只能修正明顯 failures，且 after-agent full-suite report 必須通過後才會 commit。當 `main` 在 bot push 落地前前進時，此 lane 會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的 stale patches 會被略過。它使用 GitHub-hosted Ubuntu，讓 Codex action 能維持與 docs agent 相同的 drop-sudo safety posture。

### Duplicate PRs After Merge

`Duplicate PRs After Merge` workflow 是手動 maintainer workflow，用於 post-land duplicate cleanup。它預設為 dry-run，且只會在 `apply=true` 時關閉明確列出的 PR。在 mutating GitHub 前，它會驗證 landed PR 已 merged，且每個 duplicate 都有 shared referenced issue 或 overlapping changed hunks。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates and changed routing

Local changed-lane logic 位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該 local check gate 對 architecture boundaries 的要求比 broad CI platform scope 更嚴格：

- 核心生產程式碼變更會執行核心生產與核心測試型別檢查，以及核心 lint/防護檢查；
- 僅核心測試變更只會執行核心測試型別檢查，以及核心 lint；
- Plugin 生產程式碼變更會執行 Plugin 生產與 Plugin 測試型別檢查，以及 Plugin lint；
- 僅 Plugin 測試變更會執行 Plugin 測試型別檢查，以及 Plugin lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴展到 Plugin 型別檢查，因為 Plugin 依賴這些核心合約（Vitest Plugin 掃描仍是明確的測試工作）；
- 僅發布中繼資料版本更新會執行針對性的版本/config/root-dependency 檢查；
- 未知的 root/config 變更會保守地落到所有檢查通道。

本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，原始碼編輯優先使用明確對應，接著是同層測試與匯入圖相依項。共享群組房間傳遞設定是其中一個明確對應：對群組可見回覆設定、來源回覆傳遞模式或 message-tool 系統提示的變更，會透過核心回覆測試加上 Discord 與 Slack 傳遞迴歸測試，因此共享預設變更會在第一個 PR 推送前失敗。只有當變更涵蓋整個測試框架，以致便宜的對應集合不是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從 repo 根目錄執行 Testbox，並優先使用新預熱的 box 進行廣泛證明。在對已重用、過期或剛回報非預期大型同步的 box 花時間執行慢速 gate 前，先在 box 內執行 `pnpm testbox:sanity`。

當必要根檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個受追蹤刪除時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；停止該 box 並預熱新的 box，而不是除錯產品測試失敗。對於刻意的大量刪除 PR，請在該次健全性執行設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該防護，或針對異常大型的本機差異使用較大的毫秒值。

Crabbox 是 repo 擁有的遠端 box wrapper，用於維護者 Linux 證明。當檢查對本機編輯迴圈而言太廣、CI 一致性很重要，或證明需要 secrets、Docker、package 通道、可重用 box 或遠端記錄時使用它。一般 OpenClaw 後端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量是 Blacksmith 中斷、配額問題或明確自有容量測試的後備。

第一次執行前，請從 repo 根目錄檢查 wrapper：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper 會拒絕不宣告 `blacksmith-testbox` 的過期 Crabbox binary。即使 `.crabbox.yaml` 有自有雲預設值，也請明確傳入 provider。

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

閱讀最終 JSON 摘要。有用欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。一次性的 Blacksmith 支援 Crabbox 執行應會自動停止 Testbox；如果執行遭中斷或清理情況不明，請檢查 live box 並只停止你建立的 box：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要在同一個已 hydrate 的 box 上執行多個命令時，才使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果 Crabbox 是損壞層但 Blacksmith 本身可用，請使用直接 Blacksmith 作為狹窄後備：

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

如果 `blacksmith testbox list --all` 和 `blacksmith testbox status` 可用，但新的 warmup 在幾分鐘後仍停留於 `queued`，且沒有 IP 或 Actions run URL，請將其視為 Blacksmith provider、佇列、帳務或組織限制壓力。停止你建立的 queued id，避免啟動更多 Testbox，並將證明移至下方的自有 Crabbox 容量路徑，同時請人檢查 Blacksmith 儀表板、帳務和組織限制。

只有在 Blacksmith 停機、受配額限制、缺少所需環境，或明確以自有容量為目標時，才升級到自有 Crabbox 容量：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

在 AWS 壓力下，除非任務真的需要 48xlarge 級 CPU，否則避免使用 `class=beast`。`beast` 請求從 192 vCPU 起跳，是最容易觸發區域 EC2 Spot 或 On-Demand Standard 配額的方法。repo 擁有的 `.crabbox.yaml` 預設為 `standard`、多個容量區域，以及 `capacity.hints: true`，因此 brokered AWS 租約會列印選定的 region/market、配額壓力、Spot 後備與高壓 class 警告。較重的廣泛檢查使用 `fast`，只有在 standard/fast 不夠時才使用 `large`，而 `beast` 僅用於例外的 CPU-bound 通道，例如 full-suite 或 all-plugin Docker 矩陣、明確的 release/blocker 驗證，或高核心效能剖析。不要將 `beast` 用於 `pnpm check:changed`、聚焦測試、僅文件工作、一般 lint/型別檢查、小型 E2E 重現，或 Blacksmith 中斷分流。容量診斷請使用 `--market on-demand`，避免 Spot market 波動混入訊號。

`.crabbox.yaml` 擁有自有雲通道的 provider、sync 與 GitHub Actions hydration 預設值。它會排除本機 `.git`，因此已 hydrate 的 Actions checkout 會保留自己的遠端 Git 中繼資料，而不是同步維護者本機 remotes 和 object stores；它也會排除不應被傳輸的本機 runtime/build artifacts。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` fetch，以及自有雲 `crabbox run --id <cbx_id>` 命令的非 secret 環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
