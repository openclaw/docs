---
read_when:
    - 你需要了解為什麼某個 CI 作業有執行或沒有執行
    - 你正在偵錯失敗的 GitHub Actions 檢查
    - 您正在協調發布驗證的執行或重新執行
    - 您正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括項目與對應的本機命令
title: CI 管線
x-i18n:
    generated_at: "2026-05-06T09:04:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個拉取請求時執行。`preflight` 作業會分類差異，並在只有不相關區域變更時關閉昂貴的執行線。手動 `workflow_dispatch` 執行會刻意略過智慧範圍判定，並展開完整圖形，用於候選版本與廣泛驗證。Android 執行線透過 `include_android` 維持選擇加入。僅限發行的 Plugin 涵蓋範圍位於獨立的 [`Plugin 預發行`](#plugin-prerelease) 工作流程中，且只會從 [`完整發行驗證`](#full-release-validation) 或明確的手動派發執行。

## 管線概覽

| 作業                              | 目的                                                                                                   | 執行時機                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、已變更範圍、已變更 extensions，並建置 CI 資訊清單                   | 一律在非草稿推送與 PR 上執行 |
| `security-scm-fast`              | 透過 `zizmor` 進行私密金鑰偵測與工作流程稽核                                                     | 一律在非草稿推送與 PR 上執行 |
| `security-dependency-audit`      | 針對 npm 公告進行無相依套件的正式環境鎖定檔稽核                                          | 一律在非草稿推送與 PR 上執行 |
| `security-fast`                  | 快速安全作業的必要彙總                                                             | 一律在非草稿推送與 PR 上執行 |
| `check-dependencies`             | 正式環境 Knip 僅相依套件檢查，加上未使用檔案允許清單防護                                 | Node 相關變更              |
| `build-artifacts`                | 建置 `dist/`、Control UI、已建置產物檢查，以及可重用的下游產物                       | Node 相關變更              |
| `checks-fast-core`               | 快速 Linux 正確性執行線，例如 bundled/plugin-contract/protocol 檢查                              | Node 相關變更              |
| `checks-fast-contracts-channels` | 分片頻道合約檢查，並提供穩定的彙總檢查結果                                      | Node 相關變更              |
| `checks-node-core-test`          | Core Node 測試分片，不包含頻道、bundled、contract 與 extension 執行線                          | Node 相關變更              |
| `check`                          | 分片的主要本機閘門等價項：正式環境型別、lint、防護、測試型別與嚴格 smoke                | Node 相關變更              |
| `check-additional`               | 架構、分片邊界/提示漂移、extension 防護、套件邊界與 Gateway watch        | Node 相關變更              |
| `build-smoke`                    | 已建置 CLI smoke 測試與啟動記憶體 smoke                                                            | Node 相關變更              |
| `checks`                         | 已建置產物頻道測試的驗證器                                                                 | Node 相關變更              |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 執行線                                                                | 發行用手動 CI 派發    |
| `check-docs`                     | 文件格式、lint 與失效連結檢查                                                             | 文件已變更                       |
| `skills-python`                  | Python 支援的 Skills 的 Ruff + pytest                                                                    | Python Skill 相關變更      |
| `checks-windows`                 | Windows 特定處理程序/路徑測試，加上共用執行階段匯入規範器回歸檢查                      | Windows 相關變更           |
| `macos-node`                     | 使用共用已建置產物的 macOS TypeScript 測試執行線                                               | macOS 相關變更             |
| `macos-swift`                    | macOS app 的 Swift lint、建置與測試                                                            | macOS 相關變更             |
| `android`                        | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                              | Android 相關變更           |
| `test-performance-agent`         | 在受信任活動後每日進行 Codex 慢速測試最佳化                                                 | Main CI 成功或手動派發 |
| `openclaw-performance`           | 每日/隨選 Kova 執行階段效能報告，包含 mock-provider、deep-profile 與 GPT 5.4 live 執行線 | 排程與手動派發      |

## Fail-fast 順序

1. `preflight` 會決定哪些執行線實際存在。`docs-scope` 與 `changed-scope` 邏輯是此作業內的步驟，不是獨立作業。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 會快速失敗，不等待較重的產物與平台矩陣作業。
3. `build-artifacts` 會與快速 Linux 執行線重疊，因此下游消費者可在共用建置完成後立即開始。
4. 較重的平台與執行階段執行線之後會展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

當較新的推送落在同一個 PR 或 `main` ref 上時，GitHub 可能會將被取代的作業標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則將其視為 CI 噪音。彙總分片檢查使用 `!cancelled() && always()`，因此它們仍會回報正常的分片失敗，但在整個工作流程已被取代後不會繼續排隊。自動 CI 並行鍵已版本化（`CI-v7-*`），因此 GitHub 端舊佇列群組中的殭屍項目無法無限期封鎖較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動派發會略過變更範圍偵測，並讓 preflight 資訊清單的行為如同每個已設定範圍的區域都已變更。

- **CI 工作流程編輯**會驗證 Node CI 圖形與工作流程 linting，但本身不會強制 Windows、Android 或 macOS 原生建置；這些平台執行線仍只限於平台來源變更。
- **僅 CI 路由的編輯、選定的廉價 core-test fixture 編輯，以及狹窄的 Plugin contract 輔助程式/測試路由編輯**會使用快速 Node-only 資訊清單路徑：`preflight`、security，以及單一 `checks-fast-core` 工作。當變更僅限於該快速工作直接練習的路由或輔助介面時，該路徑會略過建置產物、Node 22 相容性、頻道合約、完整 core 分片、bundled-plugin 分片與額外防護矩陣。
- **Windows Node 檢查**僅限於 Windows 特定處理程序/路徑包裝器、npm/pnpm/UI runner 輔助程式、套件管理器設定，以及執行該執行線的 CI 工作流程介面；不相關的原始碼、Plugin、install-smoke 與僅測試變更會留在 Linux Node 執行線上。

最慢的 Node 測試家族會被拆分或平衡，讓每個作業保持小型且不過度保留 runner：頻道合約會以三個加權分片執行，core unit fast/support 執行線會分開執行，core runtime infra 會拆成 state 與 process/config 分片，auto-reply 會以平衡 worker 執行（reply 子樹拆成 agent-runner、dispatch 與 commands/state-routing 分片），而 agentic gateway/server 設定會拆成 chat/auth/model/http-plugin/runtime/startup 執行線，而不是等待已建置產物。廣泛的瀏覽器、QA、媒體與其他 Plugin 測試使用其專用 Vitest 設定，而不是共用的 Plugin catch-all。Include-pattern 分片會使用 CI 分片名稱記錄時間項目，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個設定與已篩選分片。`check-additional` 會將套件邊界編譯/canary 工作放在一起，並將執行階段拓撲架構與 Gateway watch 涵蓋範圍分開；邊界防護清單會分散到四個矩陣分片，每個分片會並行執行選定的獨立防護並列印每項檢查的時間，包括 `pnpm prompt:snapshots:check`，因此 Codex 執行階段 happy-path 提示漂移會固定到造成它的 PR。Gateway watch、頻道測試與 core support-boundary 分片會在 `dist/` 和 `dist-runtime/` 已建置後，在 `build-artifacts` 內並行執行。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其單元測試執行線仍會以 SMS/call-log BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送上重複進行 debug APK 封裝作業。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（固定到最新 Knip 版本的正式環境 Knip 僅相依套件檢查，且針對 `dlx` 安裝停用 pnpm 的最低發行年齡）和 `pnpm deadcode:unused-files`，後者會將 Knip 的正式環境未使用檔案發現結果與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增新的未審查未使用檔案，或留下過時允許清單項目時，未使用檔案防護會失敗，同時保留 Knip 無法靜態解析的刻意動態 Plugin、產生檔案、建置、live-test 與套件橋接介面。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw 儲存庫活動到 ClawSweeper 的目標端橋接。它不會簽出或執行不受信任的拉取請求程式碼。該工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App 權杖，然後將精簡的 `repository_dispatch` payload 派發到 `openclaw/clawsweeper`。

該工作流程有四條執行線：

- `clawsweeper_item` 用於精確的 issue 與拉取請求 review 請求；
- `clawsweeper_comment` 用於 issue 留言中的明確 ClawSweeper 命令；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit 層級 review 請求；
- `github_activity` 用於 ClawSweeper agent 可檢查的一般 GitHub 活動。

`github_activity` 執行線只會轉送正規化 metadata：事件類型、動作、actor、儲存庫、項目編號、URL、標題、狀態，以及在存在時提供留言或 review 的短摘錄。它刻意避免轉送完整 Webhook body。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，會將正規化事件發布到 ClawSweeper agent 的 OpenClaw Gateway hook。

一般活動是觀察，而不是預設交付。ClawSweeper agent 會在其提示中收到 Discord 目標，且只有在事件令人意外、可採取行動、有風險或具作業實用性時，才應發布到 `#clawsweeper`。例行開啟、編輯、bot 擾動、重複 Webhook 噪音與正常 review 流量應產生 `NO_REPLY`。

在整個路徑中，將 GitHub 標題、留言、內文、review 文字、分支名稱與 commit 訊息視為不受信任資料。它們是摘要與分流的輸入，不是工作流程或 agent 執行階段的指令。

## 手動派發

手動 CI dispatch 會執行與一般 CI 相同的 job graph，但強制啟用所有非 Android scoped lane：Linux Node shard、bundled-plugin shard、channel contract、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI dispatch 只會在 `include_android=true` 時執行 Android；完整 release umbrella 會透過傳遞 `include_android=true` 啟用 Android。Plugin prerelease 靜態檢查、僅限 release 的 `agentic-plugins` shard、完整 Plugin 批次掃描，以及 Plugin prerelease Docker lane 會排除在 CI 之外。Docker prerelease suite 只會在 `Full Release Validation` dispatch 獨立的 `Plugin Prerelease` workflow，且啟用 release-validation gate 時執行。

手動執行會使用唯一的 concurrency group，因此 release-candidate 完整 suite 不會被同一個 ref 上的其他 push 或 PR 執行取消。可選的 `target_ref` input 讓受信任的呼叫者能夠使用所選 dispatch ref 的 workflow file，針對 branch、tag 或完整 commit SHA 執行該 graph。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、快速 security job 與 aggregate（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 檢查、sharded channel contract 檢查、除 lint 外的 `check` shard、`check-additional` aggregate、Node test aggregate verifier、docs checks、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub-hosted Ubuntu，讓 Blacksmith matrix 可以更早排隊 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低負載的 Plugin shard、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`，以及 `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node test shard、bundled Plugin test shard、`check-additional` shard、`android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 敏感到 8 vCPU 反而成本高於節省）；install-smoke Docker build（32-vCPU 的排隊時間成本高於節省）                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會 fallback 到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會 fallback 到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` 是產品/執行階段效能 workflow。它每天在 `main` 上執行，也可以手動 dispatch：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動 dispatch 通常會 benchmark workflow ref。設定 `target_ref` 可使用目前的 workflow 實作來 benchmark release tag 或其他 branch。發布的 report path 與 latest pointer 會依據 tested ref 作為 key，且每個 `index.md` 都會記錄 tested ref/SHA、workflow ref/SHA、Kova ref、profile、lane auth mode、model、repeat count，以及 scenario filter。

此 workflow 會從 pinned release 安裝 OCM，並從 `openclaw/Kova` 的 pinned `kova_ref` input 安裝 Kova，然後執行三個 lane：

- `mock-provider`：使用具備決定性假 OpenAI 相容 auth 的本機 build runtime，執行 Kova diagnostic scenario。
- `mock-deep-profile`：針對 startup、Gateway 與 agent-turn 熱點進行 CPU/heap/trace profiling。
- `live-gpt54`：真實的 OpenAI `openai/gpt-5.4` agent turn；當 `OPENAI_API_KEY` 無法使用時會略過。

mock-provider lane 也會在 Kova pass 之後執行 OpenClaw-native source probe：針對 default、hook、50-Plugin startup case 的 Gateway boot timing 與 memory；重複的 mock-OpenAI `channel-chat-baseline` hello loop；以及針對已 boot Gateway 的 CLI startup command。source probe Markdown summary 位於 report bundle 中的 `source/index.md`，raw JSON 也在旁邊。

每個 lane 都會上傳 GitHub artifact。當 `CLAWGRIT_REPORTS_TOKEN` 已設定時，workflow 也會將 `report.json`、`report.md`、bundle、`index.md` 與 source-probe artifact commit 到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 底下。目前 tested-ref pointer 會寫入為 `openclaw-performance/<tested-ref>/latest-<lane>.json`。

## Full Release Validation

`Full Release Validation` 是「release 前執行所有項目」的手動 umbrella workflow。它接受 branch、tag 或完整 commit SHA，使用該 target dispatch 手動 `CI` workflow，為僅限 release 的 Plugin/package/static/Docker proof dispatch `Plugin Prerelease`，並為 install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix 與 Telegram lane dispatch `OpenClaw Release Checks`。Stable/default 執行會將詳盡的 live/E2E 與 Docker release-path coverage 保留在 `run_release_soak=true` 後面；`release_profile=full` 會強制啟用該 soak coverage，使 broad advisory validation 仍保持廣泛。搭配 `rerun_group=all` 與 `release_profile=full` 時，它也會針對 release checks 的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳遞 `npm_telegram_package_spec` 可針對已發布的 npm package 重新執行相同的 Telegram package lane。

請參閱 [完整 release validation](/zh-TW/reference/full-release-validation)，了解
stage matrix、精確的 workflow job 名稱、profile 差異、artifact，以及
聚焦 rerun handle。

`OpenClaw Release Publish` 是手動的變更型 release workflow。在 release tag 存在且
OpenClaw npm preflight 成功後，從 `release/YYYY.M.D` 或 `main` dispatch 它。它會驗證 `pnpm plugins:sync:check`，
為所有可發布的 Plugin package dispatch `Plugin NPM Release`，為相同的 release SHA dispatch
`Plugin ClawHub Release`，然後才會使用已儲存的 `preflight_run_id` dispatch
`OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的 branch 上取得 pinned commit proof，請使用 helper，而不是
`gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch ref 必須是 branch 或 tag，不能是 raw commit SHA。此
helper 會在 target SHA 推送臨時 `release-ci/<sha>-...` branch，
從該 pinned ref dispatch `Full Release Validation`，驗證每個 child
workflow 的 `headSha` 都符合 target，並在執行完成時刪除臨時 branch。如果任何 child workflow 在
不同的 SHA 上執行，umbrella verifier 也會失敗。

`release_profile` 控制傳遞給發布檢查的即時/提供者涵蓋範圍。手動發布工作流程預設為 `stable`；只有在你刻意想要廣泛的諮詢提供者/媒體矩陣時，才使用 `full`。`run_release_soak` 控制 stable/default 發布檢查是否執行完整的即時/E2E 與 Docker 發布路徑 soak；`full` 會強制啟用 soak。

- `minimum` 保留最快的 OpenAI/核心發布關鍵通道。
- `stable` 加入 stable 提供者/後端集合。
- `full` 執行廣泛的諮詢提供者/媒體矩陣。

總括流程會記錄已派送的子執行 ID，而最後的 `Verify full validation` 作業會重新檢查目前子執行結論，並為每個子執行附加最慢作業表格。如果子工作流程重新執行後轉為綠燈，只需重新執行父層驗證作業，以重新整理總括結果與時間摘要。

復原時，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。發布候選版本使用 `all`，只有一般完整 CI 子流程使用 `ci`，只有 Plugin 預發布子流程使用 `plugin-prerelease`，每個發布子流程使用 `release-checks`，或在總括流程上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會在針對性修復後，讓失敗的發布 box 重新執行範圍保持有界。對於單一失敗的跨 OS 通道，將 `rerun_group=cross-os` 與 `cross_os_suite_filter` 搭配使用，例如 `windows/packaged-upgrade`；長時間跨 OS 命令會輸出 Heartbeat 行，而 packaged-upgrade 摘要會包含每個階段的時間。QA 發布檢查通道屬於諮詢性質，因此只有 QA 失敗時會警告，但不會阻擋發布檢查驗證器。

`OpenClaw Release Checks` 會使用受信任的工作流程 ref，將所選 ref 解析一次成 `release-package-under-test` tarball，接著把該成品傳給跨 OS 檢查與套件驗收，並在執行 soak 涵蓋時傳給即時/E2E 發布路徑 Docker 工作流程。這讓套件位元組在各發布 box 之間保持一致，並避免在多個子作業中重新封裝同一個候選版本。

針對 `ref=main` 且 `rerun_group=all` 的重複 `Full Release Validation` 執行，會取代較舊的總括流程。父層監控器在父層被取消時，會取消它已派送的任何子工作流程，因此較新的 main 驗證不會卡在過時的兩小時發布檢查執行後面。發布分支/標籤驗證與針對性重新執行群組會維持 `cancel-in-progress: false`。

## 即時與 E2E 分片

發布即時/E2E 子流程保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但會透過 `scripts/test-live-shard.mjs` 以具名分片執行，而不是單一序列作業：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- 提供者篩選的 `native-live-src-gateway-profiles` 作業
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的媒體音訊/影片分片，以及提供者篩選的音樂分片

這會保留相同的檔案涵蓋範圍，同時讓緩慢的即時提供者失敗更容易重新執行與診斷。彙總的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名稱，仍可用於手動一次性重新執行。

原生即時媒體分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` 工作流程建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；媒體作業只會在設定前驗證二進位檔。將 Docker 支援的即時套件保留在一般 Blacksmith runner 上；容器作業不是啟動巢狀 Docker 測試的正確位置。

Docker 支援的即時模型/後端分片會針對每個所選 commit 使用獨立共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發布工作流程會先建置並推送該映像一次，然後 Docker 即時模型、提供者分片 Gateway、CLI 後端、ACP bind 與 Codex harness 分片會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker 分片會帶有明確低於工作流程作業 timeout 的 script 層級 `timeout` 上限，因此卡住的容器或清理路徑會快速失敗，而不是消耗整個發布檢查預算。如果這些分片各自重新建置完整 source Docker target，代表發布執行設定錯誤，會在重複映像建置上浪費實際時間。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否像產品一樣可用？」時，使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證 source tree，而套件驗收會透過使用者安裝或更新後實際執行的相同 Docker E2E harness，驗證單一 tarball。

### 作業

1. `resolve_package` 會 checkout `workflow_ref`，解析一個套件候選版本，寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，寫入 `.artifacts/docker-e2e-package/package-candidate.json`，將兩者上傳為 `package-under-test` 成品，並在 GitHub 步驟摘要中列印來源、工作流程 ref、套件 ref、版本、SHA-256 與 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用工作流程會下載該成品、驗證 tarball 清單、視需要準備 package-digest Docker 映像，並針對該套件執行所選 Docker 通道，而不是封裝工作流程 checkout。當某個 profile 選取多個目標 `docker_lanes` 時，可重用工作流程會先準備套件與共用映像一次，然後將那些通道展開為平行的目標 Docker 作業，並使用唯一成品。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，並在套件驗收已解析套件時安裝同一個 `package-under-test` 成品；獨立 Telegram 派送仍可安裝已發布的 npm spec。
4. 如果套件解析、Docker 驗收或可選的 Telegram 通道失敗，`summary` 會讓工作流程失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發布版本，例如 `openclaw@2026.4.27-beta.2`。將它用於已發布的預發布/stable 驗收。
- `source=ref` 會封裝受信任的 `package_ref` 分支、標籤或完整 commit SHA。解析器會擷取 OpenClaw 分支/標籤，驗證所選 commit 可從 repository 分支歷史或發布標籤到達，在 detached worktree 中安裝相依套件，並使用 `scripts/package-openclaw-for-docker.mjs` 封裝。
- `source=url` 會下載 HTTPS `.tgz`；`package_sha256` 為必填。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選填，但外部分享的成品應提供。

將 `workflow_ref` 和 `package_ref` 分開。`workflow_ref` 是執行測試的受信任工作流程/harness 程式碼。`package_ref` 是在 `source=ref` 時會被封裝的來源 commit。這讓目前的測試 harness 可以驗證較舊的受信任來源 commit，而不會執行舊的工作流程邏輯。

### 套件 Profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 含 OpenWebUI 的完整 Docker 發布路徑區塊
- `custom` — 精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

`package` profile 使用離線 Plugin 涵蓋，因此已發布套件驗證不會受即時 ClawHub 可用性影響。可選的 Telegram 通道會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm spec 路徑供獨立派送使用。

專用更新與 Plugin 測試政策，包括本機命令、Docker 通道、套件驗收輸入、發布預設值與失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發布檢查會以 `source=artifact`、準備好的發布套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` 和 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、過時 Plugin 相依清理、已設定 Plugin 安裝修復、離線 Plugin、Plugin 更新與 Telegram 證明，都落在同一個已解析套件 tarball 上。設定 Full Release Validation 或 OpenClaw Release Checks 上的 `package_acceptance_package_spec`，即可對已發佈的 npm 套件執行同一矩陣，而不是對 SHA 建置的成品執行。跨 OS 發布檢查仍涵蓋 OS 特定的 onboarding、安裝器與平台行為；套件/更新產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker 通道會在阻擋式發布路徑中，每次執行驗證一個已發布套件 baseline。在套件驗收中，已解析的 `package-under-test` tarball 永遠是候選版本，而 `published_upgrade_survivor_baseline` 會選取 fallback 已發布 baseline，預設為 `openclaw@latest`；失敗通道重新執行命令會保留該 baseline。啟用 `run_release_soak=true` 或 `release_profile=full` 的 Full Release Validation 會設定 `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` 與 `published_upgrade_survivor_scenarios=reported-issues`，以擴展到最新四個 stable npm 發布版本，加上釘選的 Plugin 相容性邊界發布版本，以及針對 Feishu 設定、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、波浪號記錄路徑與過時 legacy Plugin 相依根目錄的 issue 型 fixture。多 baseline published-upgrade survivor 選項會依 baseline 分片成不同的目標 Docker runner 作業。獨立的 `Update Migration` 工作流程在問題是完整的已發布更新清理，而非一般 Full Release CI 廣度時，會搭配 `all-since-2026.4.23` 和 `plugin-deps-cleanup` 使用 `update-migration` Docker 通道。本機彙總執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳遞精確套件 spec，透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 保留單一通道，例如 `openclaw@2026.4.15`，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 來執行情境矩陣。已發布通道會使用內建的 `openclaw config set` 命令配方設定 baseline，在 `summary.json` 中記錄配方步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 以及 RPC 狀態。Windows packaged 和 installer fresh 通道也會驗證已安裝套件能從原始絕對 Windows 路徑匯入 browser-control 覆寫。OpenAI 跨 OS agent-turn smoke 預設為已設定的 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4`，因此安裝與 Gateway 證明會維持在 GPT-5 測試模型上，同時避免 GPT-4.x 預設值。

### Legacy 相容性視窗

套件驗收對已發布套件設有有界的 legacy 相容性視窗。直到 `2026.4.25` 的套件，包括 `2026.4.25-beta.*`，可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA entries 可能指向 tarball 省略的檔案；
- 當套件未公開該 flag 時，`doctor-switch` 可略過 `gateway install --wrapper` 持久化子案例；
- `update-channel-switch` 可從 tarball 衍生的假 git fixture 中修剪缺漏的 `pnpm.patchedDependencies`，並可記錄缺漏的已持久化 `update.channel`；
- Plugin smokes 可讀取 legacy 安裝記錄位置，或接受缺漏的 marketplace 安裝記錄持久化；
- `plugin-update` 可允許設定 metadata 遷移，同時仍要求安裝記錄與不重新安裝行為保持不變。

已發佈的 `2026.4.26` 套件也可能會針對已經出貨的本機建置中繼資料戳記檔案發出警告。後續套件必須符合現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的套件驗收執行時，請先查看 `resolve_package` 摘要，以確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段時間，以及重新執行指令。請優先重新執行失敗的套件設定檔或精確的 Docker lanes，而不是重新執行完整發布驗證。

## 安裝冒煙測試

獨立的 `Install Smoke` 工作流程會透過自己的 `preflight` 作業重複使用相同的範圍指令碼。它會將冒煙測試覆蓋範圍拆分為 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會在 pull request 觸及 Docker/套件表面、隨附 Plugin 套件/manifest 變更，或 Docker 冒煙測試作業會演練的核心 Plugin/channel/Gateway/Plugin SDK 表面時執行。僅來源的隨附 Plugin 變更、僅測試編輯和僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI 冒煙測試、執行容器 gateway-network e2e、驗證隨附擴充套件建置參數，並在 240 秒彙總指令逾時內執行有界限的隨附 Plugin Docker 設定檔（每個情境的 Docker 執行會個別設有上限）。
- **完整路徑**保留 QR 套件安裝與安裝程式 Docker/update 覆蓋範圍，用於夜間排程執行、手動派送、workflow-call 發布檢查，以及真正觸及安裝程式/套件/Docker 表面的 pull request。在完整模式中，install-smoke 會準備或重複使用一個目標 SHA GHCR 根 Dockerfile 冒煙測試映像，然後將 QR 套件安裝、根 Dockerfile/Gateway 冒煙測試、安裝程式/update 冒煙測試，以及快速隨附 Plugin Docker E2E 作為獨立作業執行，讓安裝程式工作不必等待根映像冒煙測試。

`main` 推送（包含 merge commit）不會強制使用完整路徑；當變更範圍邏輯會在推送時要求完整覆蓋範圍，工作流程會保留快速 Docker 冒煙測試，並將完整安裝冒煙測試留給夜間或發布驗證。

較慢的 Bun 全域安裝 image-provider 冒煙測試會由 `run_bun_global_install_smoke` 另行 gating。它會在夜間排程和發布檢查工作流程中執行，手動 `Install Smoke` 派送也可以選擇加入，但 pull request 和 `main` 推送不會執行。QR 和安裝程式 Docker 測試保留各自聚焦於安裝的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共用 `scripts/e2e/Dockerfile` 映像：

- 用於安裝程式/update/plugin-dependency lanes 的裸 Node/Git runner；
- 將相同 tarball 安裝到 `/app`、用於一般功能 lanes 的功能映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的計畫。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選取映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lanes。

### 可調整項目

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lanes 的主池 slot 數量。                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對 provider 敏感的尾池 slot 數量。                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 providers 被 throttling。                                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm install lane 上限。                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，用於避免 Docker daemon create storms；設為 `0` 表示不錯開。           |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback 逾時（120 分鐘）；選取的 live/tail lanes 會使用更嚴格的上限。             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印排程器計畫而不執行 lanes。                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 逗號分隔的精確 lane 清單；略過清理冒煙測試，讓 agents 可以重現單一失敗 lane。                 |

比有效上限更重的 lane 仍可從空池啟動，然後單獨執行直到釋放容量。本機彙總會預檢 Docker、移除過期的 OpenClaw E2E 容器、輸出作用中 lane 狀態、保存 lane 時間以供 longest-first 排序，並且預設在第一次失敗後停止排程新的池化 lanes。

### 可重複使用的 live/E2E 工作流程

可重複使用的 live/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、lane 和 credential 覆蓋範圍。`scripts/docker-e2e.mjs` 接著會將該計畫轉換為 GitHub 輸出與摘要。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的套件成品，或從 `package_artifact_run_id` 下載套件成品；驗證 tarball inventory；當計畫需要 package-installed lanes 時，透過 Blacksmith 的 Docker layer cache 建置並推送以套件 digest 標記的 bare/functional GHCR Docker E2E 映像；並重複使用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 輸入或現有的 package-digest 映像，而不是重新建置。Docker 映像 pull 會以每次嘗試 180 秒的有界逾時重試，讓卡住的 registry/cache stream 能快速重試，而不是消耗大部分 CI 關鍵路徑。

### 發布路徑區塊

發布 Docker 覆蓋範圍會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊作業，因此每個區塊只會 pull 它需要的映像種類，並透過相同的加權排程器執行多個 lanes：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的發布 Docker 區塊為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是彙總 Plugin/runtime alias。`install-e2e` lane alias 仍是兩個 provider 安裝程式 lanes 的彙總手動重新執行 alias。

當完整 release-path 覆蓋範圍要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，並且只在僅 OpenWebUI 派送時保留獨立的 `openwebui` 區塊。隨附 channel update lanes 會針對暫時性 npm 網路失敗重試一次。

每個區塊都會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、時間、`summary.json`、`failures.json`、階段時間、排程器計畫 JSON、慢 lane 表格，以及每個 lane 的重新執行指令。工作流程 `docker_lanes` 輸入會對準備好的映像執行選取的 lanes，而不是區塊作業，這會將失敗 lane 偵錯限制在一個目標 Docker 作業，並為該次執行準備、下載或重複使用套件成品；如果選取的 lane 是 live Docker lane，目標作業會在本機為該次重新執行建置 live-test 映像。產生的每個 lane GitHub 重新執行指令會在存在這些值時包含 `package_artifact_run_id`、`package_artifact_name` 和已準備映像輸入，因此失敗 lane 可以重複使用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E 工作流程每天執行完整 release-path Docker 套件。

## Plugin 預發布

`Plugin Prerelease` 是成本較高的產品/套件覆蓋範圍，因此它是由 `Full Release Validation` 或明確 operator 派送的獨立工作流程。一般 pull request、`main` 推送和獨立手動 CI 派送都不會執行該套件。它會在八個擴充套件 worker 之間平衡隨附 Plugin 測試；這些擴充套件 shard 作業每次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest worker 和更大的 Node heap，因此 import-heavy 的 Plugin 批次不會產生額外 CI 作業。僅發布的 Docker 預發布路徑會以小群組批次處理目標 Docker lanes，避免為一到三分鐘的作業保留數十個 runner。

## QA Lab

QA Lab 在主要 smart-scoped 工作流程之外有專用 CI lanes。Agentic parity 巢狀置於廣泛 QA 與發布 harness 之下，而不是獨立的 PR 工作流程。當 parity 應隨廣泛驗證執行一起進行時，請使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` 工作流程會在 `main` 上夜間執行，也可手動派送；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lanes 展開為平行作業。Live 作業使用 `qa-live-shared` environment，而 Telegram/Discord 使用 Convex leases。

發布檢查會使用 deterministic mock provider 與 mock-qualified models（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram live transport lanes，因此 channel 合約會與 live model 延遲和一般 provider-plugin 啟動隔離。Live transport Gateway 會停用 memory search，因為 QA parity 會另行涵蓋 memory 行為；provider 連線能力則由獨立的 live model、native provider 和 Docker provider 套件涵蓋。

Matrix 會對排程與發布 gates 使用 `--profile fast`，只有在 checked-out CLI 支援時才加入 `--fail-fast`。CLI 預設值和手動工作流程輸入維持為 `all`；手動 `matrix_profile=all` 派送一律會將完整 Matrix 覆蓋範圍 shard 成 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。

`OpenClaw Release Checks` 也會在發布核准前執行 release-critical QA Lab lanes；其 QA parity gate 會將候選與 baseline packs 作為平行 lane 作業執行，然後將兩個成品下載到小型報告作業中，進行最終 parity 比較。

對於一般 PR，請遵循具範圍的 CI/檢查證據，而不是將 parity 視為必要狀態。

## CodeQL

`CodeQL` 工作流程刻意設計為狹窄的第一輪安全掃描器，而不是完整的儲存庫掃描。每日、手動，以及非草稿 pull request 防護執行會掃描 Actions 工作流程程式碼，加上最高風險的 JavaScript/TypeScript 表面，並使用高信心安全查詢，篩選為高/重大 `security-severity`。

pull request 防護保持輕量：只有 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下的變更才會啟動它，而且它會執行與排程工作流程相同的高信心安全矩陣。Android 和 macOS CodeQL 不列入 PR 預設值。

### 安全性類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、secrets、sandbox、Cron 和 Gateway 基準                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，加上通道 Plugin 執行階段、Gateway、Plugin SDK、secrets、稽核接觸點                                                |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 剖析、網路防護、web-fetch 和 Plugin SDK SSRF 政策表面                                                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行輔助工具、對外傳遞，以及 agent 工具執行閘門                                                                      |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、loader、manifest、registry、package-manager 安裝、source-loading，以及 Plugin SDK 套件合約信任表面                     |

### 平台特定安全性分片

- `CodeQL Android Critical Security` — 排程的 Android 安全性分片。在 workflow sanity 接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android app。上傳到 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動 macOS 安全性分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS app，從上傳的 SARIF 中過濾掉相依項建置結果，並上傳到 `/codeql-critical-security/macos` 底下。由於 macOS 建置即使在乾淨狀態下也主導執行時間，因此保留在每日預設值之外。

### 重大品質類別

`CodeQL Critical Quality` 是對應的非安全性分片。它只在較小的 Blacksmith Linux runner 上，對狹窄的高價值表面執行 error-severity、非安全性的 JavaScript/TypeScript 品質查詢。它的 pull request 防護刻意小於排程設定檔：非草稿 PR 只有在 agent command/model/tool execution 與 reply dispatch 程式碼、config schema/migration/IO 程式碼、auth/secrets/sandbox/security 程式碼、核心通道與隨附通道 Plugin 執行階段、Gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、Plugin loader、Plugin SDK/package-contract，或 Plugin SDK reply runtime 變更時，才會執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動 dispatch 接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用來單獨執行一個品質分片的教學/迭代 hook。

| 類別                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth、secrets、sandbox、Cron 和 Gateway 安全邊界程式碼                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | 設定 schema、migration、normalization 和 IO 合約                                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schema 和伺服器方法合約                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與隨附通道 Plugin 實作合約                                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、model/provider dispatch、自動回覆 dispatch 與佇列，以及 ACP control-plane 執行階段合約                                                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具 bridge、程序監督輔助工具，以及對外傳遞合約                                                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK、memory runtime facade、memory Plugin SDK alias、memory runtime activation glue，以及 memory doctor 命令                                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、session 傳遞佇列、對外 session 綁定/傳遞輔助工具、diagnostic event/log bundle 表面，以及 session doctor CLI 合約                                    |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆 dispatch、回覆 payload/chunking/runtime 輔助工具、通道回覆選項、傳遞佇列，以及 session/thread 綁定輔助工具                                   |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization、provider auth 與 discovery、provider runtime registration、provider defaults/catalogs，以及 web/search/fetch/embedding registry       |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap、本機持久化、Gateway control flow，以及任務 control-plane 執行階段合約                                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、media IO、media understanding、image-generation，以及 media-generation 執行階段合約                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Loader、registry、public-surface，以及 Plugin SDK entrypoint 合約                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 原始碼與 Plugin 套件合約輔助工具                                                                                                          |

品質與安全性保持分離，讓品質發現可以被排程、衡量、停用或擴充，而不會模糊安全性訊號。Swift、Python 和隨附 Plugin 的 CodeQL 擴充，只應在狹窄設定檔具備穩定執行時間與訊號後，作為具範圍或分片的後續工作加回來。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是事件驅動的 Codex 維護路徑，用於讓既有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動 dispatch 也可以直接執行它。當 `main` 已往前移動，或過去一小時內已建立另一個未略過的 Docs Agent 執行時，workflow-run 呼叫會略過。執行時，它會檢閱從前一個未略過 Docs Agent 來源 SHA 到目前 `main` 的 commit 範圍，因此每小時一次的執行可以涵蓋上一次文件處理後累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護路徑，用於處理慢速測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果當天 UTC 已有另一個 workflow-run 呼叫執行過或正在執行，它會略過。手動 dispatch 會繞過該每日活動閘門。此路徑會建置完整套件 grouped Vitest 效能報告，讓 Codex 只做小型且保留覆蓋率的測試效能修正，而不是大範圍重構，然後重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，且 after-agent 完整套件報告必須通過後才會 commit 任何內容。當 `main` 在 bot push 落地前前進，此路徑會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期 patch 會被略過。它使用 GitHub-hosted Ubuntu，讓 Codex action 能維持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是手動維護者工作流程，用於落地後的重複項清理。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在變更 GitHub 之前，它會驗證已落地 PR 已合併，並驗證每個重複項都有共用的 referenced issue 或重疊的 changed hunks。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查閘門與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求，比廣泛的 CI 平台範圍更嚴格：

- 核心 production 變更會執行核心 prod 與核心 test typecheck，加上核心 lint/guards；
- 只有核心 test 的變更只會執行核心 test typecheck，加上核心 lint；
- 擴充功能 production 變更會執行擴充功能 prod 與擴充功能 test typecheck，加上擴充功能 lint；
- 只有擴充功能 test 的變更會執行擴充功能 test typecheck，加上擴充功能 lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴展到擴充功能 typecheck，因為擴充功能依賴那些核心合約（Vitest 擴充功能掃描仍是明確的測試工作）；
- 只有 release metadata 的版本 bump 會執行具目標的 version/config/root-dependency 檢查；
- 未知 root/config 變更會 fail safe 到所有檢查路徑。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，並且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，來源編輯優先使用明確映射，然後是同層測試與 import-graph 相依項。共用 group-room 傳遞設定是明確映射之一：對群組可見回覆設定、來源回覆傳遞模式，或 message-tool system prompt 的變更，會透過核心回覆測試加上 Discord 和 Slack 傳遞回歸測試進行路由，讓共用預設值變更在第一次 PR push 前就失敗。只有當變更廣泛到涵蓋整個 harness，使便宜映射集合不再是可信 proxy 時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從 repo 根目錄執行 Testbox，並優先使用全新預熱的 box 來取得廣泛證明。在把緩慢閘門花在重複使用、已過期，或剛回報異常大量同步的 box 之前，請先在該 box 內執行 `pnpm testbox:sanity`。

當必要的根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤刪除時，完整性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；請停止該 box 並預熱一個全新的 box，而不是偵錯產品測試失敗。對於刻意的大量刪除 PR，請在該次完整性檢查執行時設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止停留在同步階段超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該保護機制，或針對異常龐大的本機差異使用較大的毫秒值。

Crabbox 是 repo 擁有的遠端 box 包裝器，用於維護者 Linux 證明。當檢查對本機編輯迴圈來說太廣泛、CI 對等性很重要，或證明需要密鑰、Docker、套件通道、可重用 box 或遠端日誌時使用它。一般的 OpenClaw 後端是 `blacksmith-testbox`；自有 AWS/Hetzner 容量則是在 Blacksmith 中斷、配額問題，或明確進行自有容量測試時的備援。

首次執行前，請從 repo 根目錄檢查包裝器：

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

如果 Crabbox 二進位檔過舊且未宣告 `blacksmith-testbox`，repo 包裝器會拒絕執行。即使 `.crabbox.yaml` 有自有雲端預設值，也請明確傳入 provider。

變更閘門：

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

閱讀最終 JSON 摘要。有用的欄位是 `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs` 和 `totalMs`。一次性的 Blacksmith 支援 Crabbox 執行應該會自動停止 Testbox；如果執行被中斷或清理狀態不明，請檢查即時 box，且只停止你建立的 box：

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

只有在你刻意需要在同一個已 hydrate 的 box 上執行多個命令時，才使用重用：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

如果壞掉的是 Crabbox 層，但 Blacksmith 本身可用，請使用直接 Blacksmith 作為窄範圍備援：

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

`.crabbox.yaml` 擁有自有雲端通道的 provider、同步與 GitHub Actions hydrate 預設值。它會排除本機 `.git`，因此已 hydrate 的 Actions checkout 會保留自己的遠端 Git 中繼資料，而不是同步維護者本機的 remotes 與 object stores；它也會排除絕不應傳輸的本機執行階段/建置產物。`.github/workflows/crabbox-hydrate.yml` 擁有 checkout、Node/pnpm 設定、`origin/main` fetch，以及自有雲端 `crabbox run --id <cbx_id>` 命令的非密鑰環境交接。

## 相關

- [安裝概覽](/zh-TW/install)
- [開發頻道](/zh-TW/install/development-channels)
