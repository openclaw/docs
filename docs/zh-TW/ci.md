---
read_when:
    - 您需要了解為什麼 CI 作業有執行或未執行
    - 你正在偵錯一項失敗的 GitHub Actions 檢查
    - 你正在協調一次發布驗證的執行或重新執行
    - 您正在變更 ClawSweeper 分派或 GitHub 活動轉送
summary: CI 作業圖、範圍閘門、發行總括項目與本機命令對應项
title: CI 管線
x-i18n:
    generated_at: "2026-05-02T22:17:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI 會在每次推送到 `main` 以及每個 pull request 時執行。`preflight` 工作會分類差異，並在只有不相關區域變更時關閉昂貴的路徑。手動 `workflow_dispatch` 執行會刻意略過智慧範圍界定，並展開完整圖表以供候選版本與廣泛驗證使用。Android 路徑透過 `include_android` 維持選擇性啟用。僅限發布的 Plugin 涵蓋範圍位於獨立的 [`Plugin 預發布`](#plugin-prerelease) 工作流程中，且只會從 [`完整發布驗證`](#full-release-validation) 或明確的手動派發執行。

## 管線概覽

| 工作                             | 目的                                                                                                                | 執行時機                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、變更範圍、變更的 extensions，並建置 CI manifest                                                    | 非草稿推送與 PR 一律執行          |
| `security-scm-fast`              | 透過 `zizmor` 進行私鑰偵測與工作流程稽核                                                                           | 非草稿推送與 PR 一律執行          |
| `security-dependency-audit`      | 針對 npm advisories 進行不需相依套件的 production lockfile 稽核                                                    | 非草稿推送與 PR 一律執行          |
| `security-fast`                  | 快速安全工作所需的彙總結果                                                                                         | 非草稿推送與 PR 一律執行          |
| `check-dependencies`             | 僅 production Knip 相依套件檢查，加上未使用檔案 allowlist guard                                                     | Node 相關變更                      |
| `build-artifacts`                | 建置 `dist/`、Control UI、built-artifact 檢查，以及可重複使用的下游 artifacts                                      | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性路徑，例如 bundled/plugin-contract/protocol 檢查                                                  | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的 channel contract 檢查，並提供穩定的彙總檢查結果                                                             | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，不包含 channel、bundled、contract 與 extension 路徑                                            | Node 相關變更                      |
| `check`                          | 分片的主要本機 gate 等效項：prod types、lint、guards、test types，以及 strict smoke                                | Node 相關變更                      |
| `check-additional`               | Architecture、boundary、prompt snapshot drift、extension-surface guards、package-boundary，以及 gateway-watch 分片 | Node 相關變更                      |
| `build-smoke`                    | Built-CLI smoke 測試與 startup-memory smoke                                                                         | Node 相關變更                      |
| `checks`                         | built-artifact channel 測試的驗證器                                                                                | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置與 smoke 路徑                                                                                    | 發布用手動 CI 派發                 |
| `check-docs`                     | 文件格式、lint 與 broken-link 檢查                                                                                 | 文件已變更                         |
| `skills-python`                  | Python 支援的 Skills 的 Ruff + pytest                                                                              | Python-skill 相關變更              |
| `checks-windows`                 | Windows 專屬 process/path 測試，加上共用 runtime import specifier 回歸                                             | Windows 相關變更                   |
| `macos-node`                     | 使用共用 built artifacts 的 macOS TypeScript 測試路徑                                                              | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、建置與測試                                                                                | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android unit tests，加上一個 debug APK 建置                                                         | Android 相關變更                   |
| `test-performance-agent`         | 可信活動後每日 Codex 慢速測試最佳化                                                                                | Main CI 成功或手動派發             |
| `openclaw-performance`           | 每日/隨選 Kova runtime 效能報告，包含 mock-provider、deep-profile 與 GPT 5.4 live 路徑                             | 排程與手動派發                     |

## 快速失敗順序

1. `preflight` 決定哪些路徑實際存在。`docs-scope` 與 `changed-scope` 邏輯是此工作內的步驟，不是獨立工作。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 與 `skills-python` 會快速失敗，不等待較重的 artifact 與平台矩陣工作。
3. `build-artifacts` 會與快速 Linux 路徑重疊，讓下游消費者可在共用建置就緒後立即開始。
4. 較重的平台與 runtime 路徑隨後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 與 `android`。

當同一個 PR 或 `main` ref 有較新的推送落地時，GitHub 可能會將被取代的工作標記為 `cancelled`。除非相同 ref 的最新執行也失敗，否則請將其視為 CI 噪音。彙總分片檢查使用 `!cancelled() && always()`，因此仍會回報正常的分片失敗，但在整個工作流程已被取代後不會繼續排隊。自動 CI concurrency key 已版本化為 (`CI-v7-*`)，因此 GitHub 端舊 queue group 中的 zombie 不會無限期阻擋新的 main 執行。手動 full-suite 執行使用 `CI-manual-v1-*`，且不會取消正在執行的工作。

## 範圍與路由

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。手動派發會略過 changed-scope 偵測，並讓 preflight manifest 表現得像每個 scoped area 都已變更。

- **CI 工作流程編輯**會驗證 Node CI 圖表與工作流程 linting，但本身不會強制 Windows、Android 或 macOS native builds；這些平台路徑仍限於平台來源變更。
- **僅 CI 路由編輯、選定的低成本 core-test fixture 編輯，以及窄範圍 Plugin contract helper/test-routing 編輯**會使用快速 Node-only manifest 路徑：`preflight`、security，以及單一 `checks-fast-core` 任務。當變更限於該快速任務直接涵蓋的 routing 或 helper surfaces 時，此路徑會略過 build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards 與 additional guard matrices。
- **Windows Node 檢查**限於 Windows 專屬 process/path wrappers、npm/pnpm/UI runner helpers、package manager config，以及執行該路徑的 CI 工作流程 surfaces；不相關的 source、Plugin、install-smoke 與 test-only 變更會留在 Linux Node 路徑。

最慢的 Node 測試家族會被拆分或平衡，讓每個工作維持小型且不過度保留 runners：channel contracts 以三個加權分片執行，小型 core unit 路徑會配對，auto-reply 以四個平衡 worker 執行（並將 reply 子樹拆成 agent-runner、dispatch 與 commands/state-routing 分片），而 agentic gateway/plugin configs 會分散到既有的 source-only agentic Node 工作中，而不是等待 built artifacts。廣泛的 browser、QA、media 與其他 Plugin 測試使用其專用的 Vitest configs，而不是共用的 Plugin catch-all。Include-pattern 分片會使用 CI 分片名稱記錄 timing entries，因此 `.artifacts/vitest-shard-timings.json` 可以區分整個 config 與已過濾分片。`check-additional` 會將 package-boundary compile/canary 工作放在一起，並將 runtime topology architecture 與 gateway watch coverage 分開；boundary guard 分片會在單一工作內並行執行其小型獨立 guards，包括 `pnpm prompt:snapshots:check`，使 Codex happy-path prompt drift 固定在造成它的 PR 上。Gateway watch、channel tests 與 core support-boundary 分片會在 `dist/` 與 `dist-runtime/` 已建置後，於 `build-artifacts` 內並行執行。

Android CI 會同時執行 `testPlayDebugUnitTest` 與 `testThirdPartyDebugUnitTest`，接著建置 Play debug APK。third-party flavor 沒有獨立的 source set 或 manifest；其 unit-test 路徑仍會以 SMS/call-log BuildConfig flags 編譯該 flavor，同時避免在每次 Android 相關推送時重複執行 debug APK packaging 工作。

`check-dependencies` 分片會執行 `pnpm deadcode:dependencies`（僅 production Knip 相依套件檢查，固定使用最新 Knip 版本，並在 `dlx` 安裝時停用 pnpm 的 minimum release age）與 `pnpm deadcode:unused-files`，後者會將 Knip 的 production unused-file findings 與 `scripts/deadcode-unused-files.allowlist.mjs` 比較。當 PR 新增未經審查的未使用檔案，或留下過時的 allowlist entry 時，unused-file guard 會失敗，同時保留 Knip 無法靜態解析的刻意 dynamic Plugin、generated、build、live-test 與 package bridge surfaces。

## ClawSweeper 活動轉送

`.github/workflows/clawsweeper-dispatch.yml` 是從 OpenClaw repository activity 到 ClawSweeper 的目標端橋接。它不會 checkout 或執行不受信任的 pull request code。此工作流程會從 `CLAWSWEEPER_APP_PRIVATE_KEY` 建立 GitHub App token，然後將精簡的 `repository_dispatch` payloads 派發至 `openclaw/clawsweeper`。

此工作流程有四個路徑：

- `clawsweeper_item` 用於精確的 issue 與 pull request review requests；
- `clawsweeper_comment` 用於 issue comments 中明確的 ClawSweeper commands；
- `clawsweeper_commit_review` 用於 `main` 推送上的 commit-level review requests；
- `github_activity` 用於 ClawSweeper agent 可檢查的一般 GitHub activity。

`github_activity` 路徑只會轉送正規化 metadata：event type、action、actor、repository、item number、URL、title、state，以及存在時 comments 或 reviews 的短摘錄。它刻意避免轉送完整 webhook body。`openclaw/clawsweeper` 中的接收工作流程是 `.github/workflows/github-activity.yml`，會將正規化事件發布到 ClawSweeper agent 的 OpenClaw Gateway hook。

一般活動是觀察，而非預設遞送。ClawSweeper agent 會在其 prompt 中收到 Discord 目標，且只有當事件令人意外、可行動、有風險或具營運用途時，才應發布到 `#clawsweeper`。例行開啟、編輯、bot churn、重複 webhook 噪音，以及正常 review traffic 應產生 `NO_REPLY`。

在整條路徑中，請將 GitHub titles、comments、bodies、review text、branch names 與 commit messages 視為不受信任的資料。它們是 summarization 與 triage 的輸入，不是工作流程或 agent runtime 的指令。

## 手動派發

手動 CI 分派會執行與一般 CI 相同的作業圖，但會強制啟用每個非 Android 範圍的 lane：Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI 分派只會在 `include_android=true` 時執行 Android；完整發布 umbrella 會透過傳入 `include_android=true` 啟用 Android。Plugin 預發布靜態檢查、僅發布用的 `agentic-plugins` shard、完整 extension 批次掃描，以及 Plugin 預發布 Docker lane 會從 CI 中排除。Docker 預發布套件只會在 `Full Release Validation` 以已啟用發布驗證 gate 的方式分派獨立的 `Plugin Prerelease` workflow 時執行。

手動執行會使用唯一的並行群組，因此發布候選完整套件不會被同一 ref 上的另一個 push 或 PR 執行取消。選用的 `target_ref` 輸入可讓受信任的呼叫者使用所選分派 ref 的 workflow 檔案，針對分支、標籤或完整 commit SHA 執行該圖。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 執行器

| 執行器                           | 作業                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性作業與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 檢查、分片 channel contract 檢查、除 lint 以外的 `check` shard、`check-additional` shard 與彙總、Node 測試彙總驗證器、文件檢查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith matrix 能更早排入佇列 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低權重的 extension shard、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`，以及 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試 shard、bundled Plugin 測試 shard、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（對 CPU 足夠敏感，8 vCPU 的成本高於節省的時間）；install-smoke Docker 建置（32-vCPU 佇列時間成本高於節省的時間）                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` 是產品/執行階段效能 workflow。它每天在 `main` 上執行，也可以手動分派：

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

該 workflow 會從已釘選的發布安裝 OCM，並從已釘選的 `kova_ref` 輸入安裝 Kova，接著執行三個 lane：

- `mock-provider`：Kova 診斷情境，針對本機建置的執行階段，並使用具決定性的假 OpenAI 相容驗證。
- `mock-deep-profile`：啟動、Gateway，以及 agent-turn 熱點的 CPU/heap/trace profiling。
- `live-gpt54`：真實的 OpenAI `openai/gpt-5.4` agent turn，當 `OPENAI_API_KEY` 不可用時略過。

mock-provider lane 也會在 Kova 通過後執行 OpenClaw 原生 source probe：預設、hook 與 50-Plugin 啟動案例中的 Gateway 開機時序與記憶體；重複的 mock-OpenAI `channel-chat-baseline` hello loop；以及針對已啟動 Gateway 的 CLI 啟動命令。source probe Markdown 摘要位於報告 bundle 的 `source/index.md`，旁邊附有原始 JSON。

每個 lane 都會上傳 GitHub artifact。設定 `CLAWGRIT_REPORTS_TOKEN` 時，該 workflow 也會將 `report.json`、`report.md`、bundle、`index.md`，以及 source-probe artifact commit 到 `openclaw/clawgrit-reports` 的 `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` 底下。目前分支指標會寫入 `openclaw-performance/<ref>/latest-<lane>.json`。

## 完整發布驗證

`Full Release Validation` 是「發布前執行所有項目」的手動 umbrella workflow。它接受分支、標籤或完整 commit SHA，使用該目標分派手動 `CI` workflow，為僅發布用 Plugin/package/static/Docker 證明分派 `Plugin Prerelease`，並為 install smoke、package acceptance、Docker release-path 套件、live/E2E、OpenWebUI、QA Lab parity、Matrix，以及 Telegram lane 分派 `OpenClaw Release Checks`。搭配 `rerun_group=all` 與 `release_profile=full` 時，它也會針對 release checks 的 `release-package-under-test` artifact 執行 `NPM Telegram Beta E2E`。發布後，傳入 `npm_telegram_package_spec` 以針對已發布的 npm package 重新執行相同的 Telegram package lane。

請參閱[完整發布驗證](/zh-TW/reference/full-release-validation)，了解階段 matrix、精確的 workflow 作業名稱、profile 差異、artifact，以及聚焦重新執行 handle。

`OpenClaw Release Publish` 是手動的變更式發布 workflow。請在發布標籤存在且 OpenClaw npm preflight 成功後，從 `release/YYYY.M.D` 或 `main` 分派它。它會驗證 `pnpm plugins:sync:check`，為所有可發布的 Plugin package 分派 `Plugin NPM Release`，為相同發布 SHA 分派 `Plugin ClawHub Release`，然後才使用已儲存的 `preflight_run_id` 分派 `OpenClaw NPM Release`。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

若要在快速變動的分支上取得釘選 commit 證明，請使用 helper，而不是 `gh workflow run ... --ref main -f ref=<sha>`：

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow 分派 ref 必須是分支或標籤，不能是原始 commit SHA。該 helper 會在目標 SHA 推送臨時 `release-ci/<sha>-...` 分支，從該已釘選 ref 分派 `Full Release Validation`，驗證每個子 workflow 的 `headSha` 都符合目標，並在執行完成時刪除臨時分支。如果任何子 workflow 在不同 SHA 執行，umbrella 驗證器也會失敗。

`release_profile` 控制傳入 release checks 的 live/provider 廣度。手動發布 workflow 預設為 `stable`；只有在你刻意想要廣泛的 advisory provider/media matrix 時，才使用 `full`。

- `minimum` 保留最快的 OpenAI/core 發布關鍵 lane。
- `stable` 加入穩定的 provider/backend 集合。
- `full` 執行廣泛的 advisory provider/media matrix。

umbrella 會記錄已分派的子執行 ID，而最終的 `Verify full validation` 作業會重新檢查目前子執行結論，並為每個子執行附加最慢作業表。如果子 workflow 重新執行後轉為綠燈，只需重新執行 parent verifier 作業，即可重新整理 umbrella 結果與時序摘要。

為了復原，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。針對發行候選版使用 `all`，只針對一般完整 CI 子項使用 `ci`，只針對 Plugin 預發行子項使用 `plugin-prerelease`，針對每個發行子項使用 `release-checks`，或在 umbrella 上使用更窄的群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這會讓失敗的發行 box 在聚焦修正後，重新執行的範圍保持有界。

`OpenClaw Release Checks` 使用受信任的 workflow ref，將選取的 ref 解析一次成 `release-package-under-test` tarball，然後把該成品傳給即時/E2E 發行路徑 Docker workflow 和套件驗收 shard。這可讓發行 box 之間的套件位元組保持一致，並避免在多個子 job 中重新打包同一個候選版。

針對 `ref=main` 和 `rerun_group=all` 的重複 `Full Release Validation` 執行
會取代較舊的 umbrella。父監控器會在父項被取消時，取消任何它
已經分派的子 workflow，因此較新的 main 驗證不會卡在過時的兩小時 release-check 執行後面。發行分支/標籤
驗證和聚焦重新執行群組會保持 `cancel-in-progress: false`。

## 即時和 E2E shards

發行即時/E2E 子項保留廣泛的原生 `pnpm test:live` 覆蓋範圍，但它會透過 `scripts/test-live-shard.mjs` 以命名 shards 執行，而不是一個序列 job：

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider 篩選的 `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割的媒體音訊/影片 shards，以及 provider 篩選的音樂 shards

這會維持相同的檔案覆蓋範圍，同時讓緩慢的即時 provider 失敗更容易重新執行和診斷。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` shard 名稱仍可用於手動一次性重新執行。

原生即時媒體 shards 會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` workflow 建置。該映像預先安裝 `ffmpeg` 和 `ffprobe`；媒體 job 只會在設定前驗證二進位檔。請讓 Docker 支援的即時套件在一般 Blacksmith runners 上執行 — container jobs 不適合啟動巢狀 Docker 測試。

Docker 支援的即時模型/backend shards 會針對每個選取的 commit 使用獨立的共用 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發行 workflow 會建置並推送該映像一次，然後 Docker 即時模型、provider 分 shard 的 Gateway、CLI backend、ACP bind 和 Codex harness shards 會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。Gateway Docker shards 具備明確的 script 層級 `timeout` 上限，低於 workflow job timeout，因此卡住的 container 或清理路徑會快速失敗，而不是耗完整個 release-check 預算。如果這些 shards 各自重新建置完整來源 Docker target，表示發行執行設定錯誤，且會把壁鐘時間浪費在重複映像建置上。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證來源樹，而套件驗收會透過使用者安裝或更新後使用的同一套 Docker E2E harness 驗證單一 tarball。

### Jobs

1. `resolve_package` 會 checkout `workflow_ref`、解析一個套件候選、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`、將兩者上傳為 `package-under-test` 成品，並在 GitHub step summary 中印出來源、workflow ref、package ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 會以 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 呼叫 `openclaw-live-and-e2e-checks-reusable.yml`。可重用 workflow 會下載該成品、驗證 tarball 清單、在需要時準備 package-digest Docker 映像，並針對該套件執行選取的 Docker lanes，而不是打包 workflow checkout。當 profile 選取多個目標 `docker_lanes` 時，可重用 workflow 會準備套件和共用映像一次，然後將這些 lanes 展開成具備唯一成品的平行目標 Docker jobs。
3. `package_telegram` 可選擇性呼叫 `NPM Telegram Beta E2E`。當 `telegram_mode` 不是 `none` 時會執行，且在套件驗收解析出套件時安裝同一個 `package-under-test` 成品；獨立的 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker 驗收或選用 Telegram lane 失敗時讓 workflow 失敗。

### 候選來源

- `source=npm` 只接受 `openclaw@alpha`、`openclaw@beta`、`openclaw@latest`，或確切的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。用於已發布的預發行/穩定版驗收。
- `source=ref` 會打包受信任的 `package_ref` 分支、標籤或完整 commit SHA。resolver 會抓取 OpenClaw 分支/標籤、驗證選取的 commit 可從儲存庫分支歷史或發行標籤到達、在 detached worktree 中安裝 deps，並使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url` 會下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact` 會從 `artifact_run_id` 和 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選用，但外部共享成品應提供。

保持 `workflow_ref` 和 `package_ref` 分離。`workflow_ref` 是執行測試的受信任 workflow/harness 程式碼。`package_ref` 是 `source=ref` 時會被打包的來源 commit。這讓目前的測試 harness 可以驗證較舊的受信任來源 commit，而不需執行舊的 workflow 邏輯。

### 套件 profiles

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — 包含 OpenWebUI 的完整 Docker 發行路徑 chunks
- `custom` — 確切的 `docker_lanes`；當 `suite_profile=custom` 時為必要

`package` profile 使用離線 Plugin 覆蓋範圍，因此已發布套件驗證不會受限於即時 ClawHub 可用性。選用 Telegram lane 會在 `NPM Telegram Beta E2E` 中重用 `package-under-test` 成品，並保留已發布 npm spec 路徑給獨立 dispatch。

如需專用的更新與 Plugin 測試政策，包括本機命令、
Docker lanes、套件驗收輸入、發行預設值和失敗分流，
請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

發行檢查會以 `source=artifact`、準備好的發行套件成品、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues` 和 `telegram_mode=mock-openai` 呼叫套件驗收。這會讓套件遷移、更新、過期 Plugin 相依性清理、已設定 Plugin 安裝修復、離線 Plugin、Plugin 更新和 Telegram 證明都位於同一個已解析的套件 tarball 上。在 Full Release Validation 或 OpenClaw Release Checks 上設定 `package_acceptance_package_spec`，即可針對已出貨的 npm 套件執行相同矩陣，而不是針對 SHA 建置的成品。跨 OS 發行檢查仍涵蓋 OS 特定的 onboarding、安裝程式和平台行為；套件/更新產品驗證應從套件驗收開始。`published-upgrade-survivor` Docker lane 每次執行會驗證一個已發布套件基準。在套件驗收中，已解析的 `package-under-test` tarball 永遠是候選，而 `published_upgrade_survivor_baseline` 會選取 fallback 已發布基準，預設為 `openclaw@latest`；失敗 lane 重新執行命令會保留該基準。設定 `published_upgrade_survivor_baselines=all-since-2026.4.23` 可將 Full Release CI 擴展到從 `2026.4.23` 到 `latest` 的每個穩定 npm 發行版；`release-history` 仍可用於以較舊的日期前錨點進行手動更廣泛抽樣。設定 `published_upgrade_survivor_scenarios=reported-issues` 可把相同基準擴展到問題形狀的 fixtures，涵蓋 Feishu config、保留的 bootstrap/persona 檔案、已設定的 OpenClaw Plugin 安裝、tilde log 路徑，以及過時 legacy Plugin 相依性 roots。獨立的 `Update Migration` workflow 會在問題是完整的已發布更新清理，而不是一般 Full Release CI 廣度時，使用含有 `all-since-2026.4.23` 和 `plugin-deps-cleanup` 的 `update-migration` Docker lane。本機聚合執行可透過 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 傳入確切套件 specs，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`（例如 `openclaw@2026.4.15`）保留單一 lane，或設定 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 以使用情境矩陣。已發布 lane 會以內建的 `openclaw config set` 命令 recipe 設定基準，在 `summary.json` 中記錄 recipe 步驟，並在 Gateway 啟動後探測 `/healthz`、`/readyz` 和 RPC 狀態。Windows packaged 和 installer fresh lanes 也會驗證已安裝套件能從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 在設定時預設為 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則為 `openai/gpt-5.4`，因此安裝與 Gateway 證明會保持在 GPT-5 測試模型上，同時避免 GPT-4.x 預設值。

### Legacy 相容性窗口

套件驗收針對已發布套件有有界的 legacy 相容性窗口。到 `2026.4.25` 為止的套件（包括 `2026.4.25-beta.*`）可使用相容性路徑：

- `dist/postinstall-inventory.json` 中已知的私有 QA 項目可能指向 tarball 省略的檔案；
- 當套件未公開 `gateway install --wrapper` 旗標時，`doctor-switch` 可略過該 persistence 子案例；
- `update-channel-switch` 可從 tarball 衍生的 fake git fixture 中修剪遺失的 `pnpm.patchedDependencies`，且可記錄遺失的已持久化 `update.channel`；
- Plugin smokes 可讀取 legacy 安裝記錄位置，或接受遺失的 marketplace 安裝記錄 persistence；
- `plugin-update` 可允許 config metadata 遷移，同時仍要求安裝記錄和 no-reinstall 行為保持不變。

已發布的 `2026.4.26` 套件也可能針對已出貨的本機建置 metadata stamp 檔案發出警告。後續套件必須滿足現代合約；相同條件會失敗，而不是警告或略過。

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

偵錯失敗的 package acceptance 執行時，請從 `resolve_package` 摘要開始，確認套件來源、版本和 SHA-256。接著檢查 `docker_acceptance` 子執行及其 Docker 成品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 記錄、階段計時，以及重新執行命令。請優先重新執行失敗的套件設定檔或精確的 Docker lane，而不是重新執行完整的 release validation。

## 安裝煙霧測試

獨立的 `Install Smoke` workflow 會透過自己的 `preflight` job 重複使用相同的範圍腳本。它會將 smoke coverage 分成 `run_fast_install_smoke` 和 `run_full_install_smoke`。

- **快速路徑**會在 pull request 觸及 Docker/package surface、內建 Plugin 套件/manifest 變更，或 Docker smoke job 會執行的 core plugin/channel/gateway/Plugin SDK surface 時執行。僅來源碼的內建 Plugin 變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI smoke、執行 container gateway-network e2e、驗證內建 extension build arg，並在 240 秒彙總命令逾時內執行有界的 bundled-plugin Docker 設定檔（每個情境的 Docker 執行會另外設上限）。
- **完整路徑**會保留 QR package install 和 installer Docker/update coverage，用於 nightly 排程執行、手動 dispatch、workflow-call release check，以及真正觸及 installer/package/Docker surface 的 pull request。在完整模式中，install-smoke 會準備或重複使用一個 target-SHA GHCR 根 Dockerfile smoke 映像，接著將 QR package install、根 Dockerfile/gateway smoke、installer/update smoke，以及快速 bundled-plugin Docker E2E 作為個別 job 執行，讓 installer 工作不必等在根映像 smoke 後面。

`main` push（包含 merge commit）不會強制使用完整路徑；當 changed-scope 邏輯會在 push 上要求完整 coverage 時，workflow 會保留快速 Docker smoke，並將完整 install smoke 留給 nightly 或 release validation。

緩慢的 Bun global install image-provider smoke 會由 `run_bun_global_install_smoke` 另外控管。它會在 nightly schedule 和 release checks workflow 中執行，手動 `Install Smoke` dispatch 也可以選擇加入，但 pull request 和 `main` push 不會執行。QR 和 installer Docker 測試會保留各自以安裝為重點的 Dockerfile。

## 本機 Docker E2E

`pnpm test:docker:all` 會預先建置一個共用 live-test 映像，將 OpenClaw 打包一次成 npm tarball，並建置兩個共用的 `scripts/e2e/Dockerfile` 映像：

- 用於 installer/update/plugin-dependency lane 的純 Node/Git runner；
- 將同一個 tarball 安裝到 `/app`、用於一般功能 lane 的功能性映像。

Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選取的 plan。scheduler 會透過 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選取映像，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane。

### 可調參數

| 變數                                   | 預設值  | 用途                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 一般 lane 的 main-pool slot 數量。                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | 對 provider 敏感的 tail-pool slot 數量。                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | 並行 live lane 上限，避免 provider throttling。                                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 並行 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 並行 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | lane 啟動之間的錯開時間，用於避免 Docker daemon create storm；設為 `0` 則不錯開。             |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | 每個 lane 的 fallback 逾時（120 分鐘）；選取的 live/tail lane 會使用更嚴格的上限。            |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` 會列印 scheduler plan 而不執行 lane。                                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | 以逗號分隔的精確 lane 清單；略過 cleanup smoke，讓 agent 能重現單一失敗 lane。                |

比有效上限更重的 lane 仍可從空 pool 啟動，然後單獨執行直到釋放容量。本機彙總會預先檢查 Docker、移除過期的 OpenClaw E2E container、輸出 active-lane 狀態、保存 lane timing 以進行 longest-first 排序，並預設在第一次失敗後停止排程新的 pooled lane。

### 可重用的 live/E2E workflow

可重用的 live/E2E workflow 會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪個套件、映像種類、live 映像、lane，以及 credential coverage。`scripts/docker-e2e.mjs` 接著會將該 plan 轉換成 GitHub output 和 summary。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的 package artifact，或從 `package_artifact_run_id` 下載 package artifact；驗證 tarball inventory；在 plan 需要 package-installed lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送帶有 package digest 標籤的 bare/functional GHCR Docker E2E 映像；並重複使用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` input 或現有 package-digest 映像，而不是重新建置。Docker 映像拉取會以有界的 180 秒單次嘗試逾時重試，讓卡住的 registry/cache stream 能快速重試，而不是耗掉大部分 CI critical path。

### Release path chunk

Release Docker coverage 會執行較小的 chunked job，並使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，讓每個 chunk 只拉取所需的映像種類，並透過同一個 weighted scheduler 執行多個 lane：

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

目前的 release Docker chunk 是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`，以及從 `plugins-runtime-install-a` 到 `plugins-runtime-install-h`。`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍然是 aggregate plugin/runtime alias。`install-e2e` lane alias 仍然是兩個 provider installer lane 的 aggregate manual rerun alias。

當 full release-path coverage 要求時，OpenWebUI 會併入 `plugins-runtime-services`，並只在 OpenWebUI-only dispatch 時保留獨立的 `openwebui` chunk。Bundled-channel update lane 會針對暫時性 npm 網路失敗重試一次。

每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane 記錄、timing、`summary.json`、`failures.json`、phase timing、scheduler plan JSON、slow-lane 表格，以及每個 lane 的重新執行命令。workflow 的 `docker_lanes` input 會針對準備好的映像執行選取的 lane，而不是執行 chunk job，這會把 failed-lane 偵錯限制在一個目標 Docker job，並為該次執行準備、下載或重複使用 package artifact；如果選取的 lane 是 live Docker lane，目標 job 會在本機為該次重新執行建置 live-test 映像。產生的每個 lane GitHub 重新執行命令會在存在時包含 `package_artifact_run_id`、`package_artifact_name` 和準備好的映像 input，因此失敗的 lane 可以重複使用失敗執行中的精確套件與映像。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

排程的 live/E2E workflow 每天執行完整的 release-path Docker suite。

## Plugin 預發行

`Plugin Prerelease` 是成本更高的 product/package coverage，因此它是由 `Full Release Validation` 或明確 operator dispatch 的獨立 workflow。一般 pull request、`main` push 和獨立的手動 CI dispatch 會保持關閉該 suite。它會在八個 extension worker 之間平衡內建 Plugin 測試；這些 extension shard job 會一次最多執行兩個 Plugin config group，每個 group 使用一個 Vitest worker 和較大的 Node heap，讓 import-heavy 的 Plugin 批次不會建立額外 CI job。僅 release 的 Docker prerelease path 會將目標 Docker lane 以小批次執行，避免為一到三分鐘的 job 保留數十個 runner。

## QA Lab

QA Lab 在主要 smart-scoped workflow 之外有專用 CI lane。Agentic parity 巢狀位於廣泛的 QA 和 release harness 之下，而不是獨立的 PR workflow。當 parity 應隨廣泛 validation run 一起執行時，請使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`。

- `QA-Lab - All Lanes` workflow 會在 `main` 上 nightly 執行並可手動 dispatch；它會將 mock parity lane、live Matrix lane，以及 live Telegram 和 Discord lane 展開為平行 job。Live job 使用 `qa-live-shared` environment，而 Telegram/Discord 使用 Convex lease。

Release checks 會使用 deterministic mock provider 和 mock-qualified model（`mock-openai/gpt-5.5` 與 `mock-openai/gpt-5.5-alt`）執行 Matrix 和 Telegram live transport lane，讓 channel contract 與 live model latency 和一般 provider-plugin startup 隔離。live transport gateway 會停用 memory search，因為 QA parity 會另外涵蓋 memory 行為；provider connectivity 由獨立的 live model、native provider 和 Docker provider suite 涵蓋。

Matrix 對 scheduled 和 release gate 使用 `--profile fast`，並只在 checked-out CLI 支援時加入 `--fail-fast`。CLI 預設值和手動 workflow input 仍為 `all`；手動 `matrix_profile=all` dispatch 一律會將完整 Matrix coverage shard 成 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` job。

`OpenClaw Release Checks` 也會在 release approval 前執行 release-critical QA Lab lane；它的 QA parity gate 會將 candidate 和 baseline pack 作為平行 lane job 執行，接著將兩者的 artifact 下載到一個小型 report job 中，供最終 parity comparison 使用。

對一般 PR，請依循 scoped CI/check evidence，而不是將 parity 視為必要 status。

## CodeQL

`CodeQL` 工作流程刻意設計為範圍狹窄的第一輪安全掃描器，而不是完整的儲存庫掃描。每日、手動，以及非草稿 pull request 防護執行會掃描 Actions 工作流程程式碼，加上最高風險的 JavaScript/TypeScript 表面，並使用高信心安全查詢，篩選高/重大 `security-severity`。

pull request 防護保持輕量：它只會在 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 底下有變更時啟動，並執行與排程工作流程相同的高信心安全矩陣。Android 與 macOS CodeQL 不包含在 PR 預設值中。

### 安全類別

| 類別                                              | 表面                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 身分驗證、機密、沙箱、Cron，以及 Gateway 基準                                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | 核心通道實作合約，加上通道 Plugin 執行階段、Gateway、Plugin SDK、機密、稽核接觸點                                                   |
| `/codeql-security-high/network-ssrf-boundary`     | 核心 SSRF、IP 解析、網路防護、web-fetch，以及 Plugin SDK SSRF 政策表面                                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP 伺服器、程序執行協助程式、對外傳遞，以及代理工具執行門檻                                                                        |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin 安裝、載入器、manifest、registry、套件管理器安裝、原始碼載入，以及 Plugin SDK 套件合約信任表面                               |

### 平台特定安全分片

- `CodeQL Android Critical Security` — 排程的 Android 安全分片。在工作流程健全性接受的最小 Blacksmith Linux runner 上，為 CodeQL 手動建置 Android 應用程式。上傳到 `/codeql-critical-security/android` 底下。
- `CodeQL macOS Critical Security` — 每週/手動的 macOS 安全分片。在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式，從上傳的 SARIF 中篩除相依性建置結果，並上傳到 `/codeql-critical-security/macos` 底下。保留在每日預設值之外，因為即使乾淨時，macOS 建置也主導執行時間。

### 重大品質類別

`CodeQL Critical Quality` 是對應的非安全分片。它只在較小的 Blacksmith Linux runner 上，對狹窄的高價值表面執行錯誤嚴重性、非安全的 JavaScript/TypeScript 品質查詢。它的 pull request 防護刻意比排程設定檔更小：非草稿 PR 只會針對代理命令/模型/工具執行與回覆分派程式碼、設定結構描述/遷移/IO 程式碼、身分驗證/機密/沙箱/安全程式碼、核心通道與內建通道 Plugin 執行階段、Gateway protocol/server-method、記憶體執行階段/SDK 黏合程式碼、MCP/程序/對外傳遞、供應商執行階段/模型目錄、工作階段診斷/傳遞佇列、Plugin 載入器、Plugin SDK/套件合約，或 Plugin SDK 回覆執行階段變更，執行對應的 `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` 和 `plugin-sdk-reply-runtime` 分片。CodeQL 設定與品質工作流程變更會執行全部十二個 PR 品質分片。

手動分派接受：

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狹窄設定檔是用來單獨執行一個品質分片的教學/迭代掛鉤。

| 類別                                                    | 表面                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 身分驗證、機密、沙箱、Cron，以及 Gateway 安全邊界程式碼                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | 設定結構描述、遷移、正規化，以及 IO 合約                                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol 結構描述與 server method 合約                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | 核心通道與內建通道 Plugin 實作合約                                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | 命令執行、模型/供應商分派、自動回覆分派與佇列，以及 ACP 控制平面執行階段合約                                                                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP 伺服器與工具橋接、程序監督協助程式，以及對外傳遞合約                                                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | 記憶體主機 SDK、記憶體執行階段 facade、記憶體 Plugin SDK 別名、記憶體執行階段啟用黏合程式碼，以及記憶體 doctor 命令                                             |
| `/codeql-critical-quality/session-diagnostics-boundary` | 回覆佇列內部、工作階段傳遞佇列、對外工作階段繫結/傳遞協助程式、診斷事件/記錄套件表面，以及工作階段 doctor CLI 合約                                              |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK 傳入回覆分派、回覆 payload/分塊/執行階段協助程式、通道回覆選項、傳遞佇列，以及工作階段/執行緒繫結協助程式                                            |
| `/codeql-critical-quality/provider-runtime-boundary`    | 模型目錄正規化、供應商身分驗證與探索、供應商執行階段註冊、供應商預設值/目錄，以及 web/search/fetch/embedding registry                                          |
| `/codeql-critical-quality/ui-control-plane`             | 控制 UI 啟動、本機持久化、Gateway 控制流程，以及任務控制平面執行階段合約                                                                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | 核心 web fetch/search、媒體 IO、媒體理解、影像產生，以及媒體產生執行階段合約                                                                                      |
| `/codeql-critical-quality/plugin-boundary`              | 載入器、registry、公開表面，以及 Plugin SDK 進入點合約                                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 已發布套件端 Plugin SDK 原始碼與 Plugin 套件合約協助程式                                                                                                         |

品質與安全保持分離，這樣品質發現就能在不遮蔽安全訊號的情況下排程、測量、停用或擴充。Swift、Python 與內建 Plugin CodeQL 擴充，只有在狹窄設定檔已有穩定執行時間與訊號之後，才應以限定範圍或分片的後續工作加入回來。

## 維護工作流程

### Docs Agent

`Docs Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於讓現有文件與最近落地的變更保持一致。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，手動分派也可以直接執行它。當 `main` 已經前進，或過去一小時內已建立另一個未略過的 Docs Agent 執行時，workflow-run 呼叫會略過。執行時，它會審查從前一個未略過的 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

### Test Performance Agent

`Test Performance Agent` 工作流程是一條事件驅動的 Codex 維護通道，用於慢速測試。它沒有純排程：`main` 上成功的非 bot push CI 執行可以觸發它，但如果另一個 workflow-run 呼叫在該 UTC 日已經執行或正在執行，它會略過。手動分派會繞過該每日活動門檻。此通道會建置完整套件分組的 Vitest 效能報告，讓 Codex 只做保留涵蓋率的小型測試效能修正，而不是廣泛重構，接著重新執行完整套件報告，並拒絕會降低通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正明顯失敗，而且代理之後的完整套件報告必須通過，才會提交任何內容。當 `main` 在 bot push 落地前前進時，此通道會 rebase 已驗證的 patch、重新執行 `pnpm check:changed`，並重試 push；有衝突的過期 patch 會被略過。它使用 GitHub-hosted Ubuntu，讓 Codex action 能維持與 docs agent 相同的 drop-sudo 安全姿態。

### 合併後的重複 PR

`Duplicate PRs After Merge` 工作流程是供維護者用於落地後清理重複項目的手動工作流程。它預設為 dry-run，且只有在 `apply=true` 時才會關閉明確列出的 PR。在修改 GitHub 之前，它會驗證已落地 PR 已合併，且每個重複項目都有共用的引用 issue 或重疊的已變更 hunk。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 本機檢查門檻與變更路由

本機 changed-lane 邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查門檻在架構邊界方面比廣泛的 CI 平台範圍更嚴格：

- 核心正式環境變更會執行核心 prod 與核心測試 typecheck，加上核心 lint/guard；
- 只有核心測試的變更只會執行核心測試 typecheck，加上核心 lint；
- extension 正式環境變更會執行 extension prod 與 extension 測試 typecheck，加上 extension lint；
- 只有 extension 測試的變更會執行 extension 測試 typecheck，加上 extension lint；
- 公開 Plugin SDK 或 Plugin 合約變更會擴展到 extension typecheck，因為 extension 依賴那些核心合約（Vitest extension 掃描仍是明確的測試工作）；
- 只有 release metadata 的版本 bump 會執行目標式版本/設定/root-dependency 檢查；
- 未知的根目錄/設定變更會以失敗安全方式進入所有檢查通道。

本機 changed-test 路由位於 `scripts/test-projects.test-support.mjs`，且刻意比 `check:changed` 更便宜：直接測試編輯會執行自身，原始碼編輯優先使用明確對應，接著才是同層測試與匯入圖依賴項。共用 group-room 傳遞設定是明確對應之一：對群組可見回覆設定、來源回覆傳遞模式，或 message-tool 系統提示的變更，會路由通過核心回覆測試，加上 Discord 與 Slack 傳遞迴歸測試，讓共用預設變更在第一次 PR push 前就失敗。只有在變更足夠涵蓋整個 harness，使廉價對應集合不再是可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

## Testbox 驗證

從存放庫根目錄執行 Testbox，並在需要廣泛驗證時優先使用全新預熱的 box。在把緩慢的 gate 花在重複使用、過期，或剛回報異常大型同步的 box 之前，請先在 box 內執行 `pnpm testbox:sanity`。

當必要的根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤檔案遭刪除時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本；請停止該 box，並改為預熱新的 box，而不是除錯產品測試失敗。對於刻意大量刪除的 PR，請在該次健全性執行中設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

`pnpm testbox:run` 也會終止在同步階段停留超過五分鐘且沒有同步後輸出的本機 Blacksmith CLI 呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該防護，或針對異常大型的本機 diff 使用較大的毫秒值。

當 Blacksmith 無法使用，或偏好使用自有雲端容量時，Crabbox 是此存放庫擁有的第二條 Linux 驗證遠端 box 路徑。預熱一個 box，透過專案工作流程 hydrate 它，然後透過 Crabbox CLI 執行命令：

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` 負責 provider、同步與 GitHub Actions hydrate 預設值。它會排除本機 `.git`，讓已 hydrate 的 Actions checkout 保留自己的遠端 Git 中繼資料，而不是同步維護者本機的 remote 與 object store；也會排除不應被傳輸的本機執行階段/建置成品。`.github/workflows/crabbox-hydrate.yml` 負責 checkout、Node/pnpm 設定、`origin/main` fetch，以及後續 `crabbox run --id <cbx_id>` 命令會 source 的非機密環境交接。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [開發通道](/zh-TW/install/development-channels)
