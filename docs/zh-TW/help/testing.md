---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/供應商錯誤新增迴歸測試
    - 偵錯閘道 + agent 行為
summary: 測試套件：單元/e2e/live 套件、Docker runner，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-07-04T03:35:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 測試套件（單元/整合、e2e、實際連線）和一小組 Docker 執行器。這份文件是「我們如何測試」指南：

- 每個套件涵蓋什麼（以及刻意_不_涵蓋什麼）。
- 常見工作流程要執行哪些命令（本機、推送前、偵錯）。
- 實際連線測試如何探索憑證並選取模型/提供者。
- 如何為真實世界的模型/提供者問題新增迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、實際連線傳輸通道）**另有文件說明：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) - 架構、命令介面、情境撰寫。
- [矩陣 QA](/zh-TW/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的參考。
- [成熟度評分卡](/zh-TW/maturity/scorecard) - 發行 QA 證據如何支援穩定性與 LTS 決策。
- [QA channel](/zh-TW/channels/qa-channel) - 由儲存庫支援的情境使用的合成傳輸外掛。

本頁涵蓋一般測試套件和 Docker/Parallels 執行器的執行方式。下方的 QA 專用執行器區段（[QA 專用執行器](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上方參考資料。
</Note>

## 快速開始

大多數日子：

- 完整門檻（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足的機器上更快執行本機完整套件：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在反覆處理單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你碰到測試或想要額外信心時：

- 覆蓋率門檻：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

## 測試暫存目錄

測試擁有的暫存目錄請優先使用 `test/helpers/temp-dir.ts` 中的共享輔助工具。它們會明確化擁有權，並讓清理維持在同一個測試生命週期中：

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` 刻意不公開手動清理方法；Vitest 會在每個測試後擁有清理工作。既有的較低階輔助工具仍保留給尚未遷移的測試，但新的和已遷移的測試應使用自動清理追蹤器。避免新增手動 `makeTempDir`、`cleanupTempDirs` 或 `createTempDirTracker` 用法，也避免在測試中新增裸 `fs.mkdtemp*` 呼叫，除非某個案例明確是在驗證原始暫存目錄行為。當測試刻意需要裸暫存目錄時，請加入可稽核的允許註解並附上具體原因：

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

為了遷移可見性，`node scripts/report-test-temp-creations.mjs` 會在新增 diff 行中回報新的裸暫存目錄建立，以及新的手動共享輔助工具用法，而不會封鎖既有清理樣式。它的檔案範圍刻意遵循 `scripts/changed-lanes.mjs` 使用的同一套測試路徑分類，而不是維護另一個測試輔助檔名啟發式，同時會略過共享輔助工具實作本身。`check:changed` 會針對變更的測試路徑執行這份報告，作為僅警告的 CI 訊號；發現項目會是 GitHub 警告註解，而不是失敗。

偵錯真實提供者/模型時（需要真實憑證）：

- 實際連線套件（模型 + 閘道工具/圖片探測）：`pnpm test:live`
- 安靜地指定單一實際連線檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：分派 `OpenClaw Performance`，搭配 `live_openai_candidate=true` 進行真實 `openai/gpt-5.5` agent turn，或搭配 `deep_profile=true` 產生 Kova CPU/heap/trace 成品。每日排程執行會在設定 `CLAWGRIT_REPORTS_TOKEN` 時，將 mock-provider、deep-profile 和 GPT 5.5 通道成品發布到 `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的閘道啟動、記憶體、外掛壓力、重複假模型 hello-loop，以及命令列介面啟動數據。
- Docker 實際連線模型掃描：`pnpm test:docker:live-models`
  - 每個選定模型現在會執行一次文字 turn，加上一個小型類檔案讀取探測。中繼資料宣告支援 `image` 輸入的模型也會執行一次小型圖片 turn。隔離提供者失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動 `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的 live/E2E workflow，其中包含依提供者分片的獨立 Docker 實際連線模型矩陣 job。
  - 針對聚焦的 CI 重新執行，分派 `OpenClaw Live And E2E Checks (Reusable)`，搭配 `include_live_suites: true` 和 `live_models_only: true`。
  - 將新的高訊號提供者秘密新增到 `scripts/ci-hydrate-live-auth.sh`，以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其排程/發行呼叫端。
- 原生 Codex bound-chat smoke：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker 實際連線通道，使用 `/codex bind` 綁定合成 Slack DM，操作 `/codex fast` 和 `/codex permissions`，接著驗證純文字回覆和圖片附件會透過原生外掛綁定而非 ACP 路由。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 透過外掛擁有的 Codex app-server harness 執行閘道 agent turn，驗證 `/codex status` 和 `/codex models`，且預設會操作圖片、排程 MCP、sub-agent 和 Guardian 探測。隔離其他 Codex app-server 失敗時，可用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要做聚焦的 sub-agent 檢查，請停用其他探測：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在 sub-agent 探測後結束。
- Codex 隨需安裝 smoke：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安裝已封裝的 OpenClaw tarball，執行 OpenAI API key onboarding，並驗證 Codex 外掛與 `@openai/codex` 相依套件已依需求下載到受管理的 npm 專案根目錄。
- 實際連線外掛工具相依套件 smoke：`pnpm test:docker:live-plugin-tool`
  - 封裝一個帶有真實 `slugify` 相依套件的 fixture 外掛，透過 `npm-pack:` 安裝，驗證受管理 npm 專案根目錄下的相依套件，然後要求實際連線 OpenAI 模型呼叫外掛工具並回傳隱藏 slug。
- Crestodian 救援命令 smoke：`pnpm test:live:crestodian-rescue-channel`
  - 針對訊息 channel 救援命令介面的選用雙重保險檢查。它會操作 `/crestodian status`、佇列一個持久模型變更、回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在無設定容器中執行 Crestodian，`PATH` 上放置假的 Claude CLI，並驗證模糊 planner 後援會轉譯成已稽核的型別化設定寫入。
- Crestodian first-run Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw state dir 開始，驗證現代 onboard Crestodian 進入點，套用 setup/model/agent/Discord 外掛 + SecretRef 寫入、驗證設定，並驗證稽核項目。QA Lab 也透過 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 涵蓋相同的 Ring 0 setup 路徑。
- Moonshot/Kimi 成本 smoke：設定 `MOONSHOT_API_KEY` 後，執行 `openclaw models list --provider moonshot --json`，接著針對 `moonshot/kimi-k2.6` 執行隔離的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。驗證 JSON 回報 Moonshot/K2.6，且 assistant 逐字稿儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方說明的 allowlist 環境變數縮小實際連線測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 真實感時，這些命令會與主要測試套件並列：

CI 會在專用 workflow 中執行 QA Lab。Agentic parity 會巢狀位於 `QA-Lab - All Lanes` 和發行驗證之下，而不是獨立的 PR workflow。廣泛驗證應使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`，或使用 release-checks QA 群組。穩定/預設發行檢查會把詳盡的實際連線/Docker soak 保留在 `run_release_soak=true` 之後；`full` profile 會強制啟用 soak。`QA-Lab - All Lanes` 會在 `main` 上每晚執行，並可透過手動分派執行，其中 mock parity 通道、實際連線 Matrix 通道、Convex 管理的實際連線 Telegram 通道，以及 Convex 管理的實際連線 Discord 通道會作為平行 job 執行。排程 QA 和發行檢查會明確傳遞 Matrix `--profile fast`，而 Matrix 命令列介面與手動 workflow 輸入預設仍為 `all`；手動分派可以將 `all` 分片成 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` job。`OpenClaw Release Checks` 會在發行核准前執行 parity 加上快速 Matrix 與 Telegram 通道，並使用 `mock-openai/gpt-5.5` 進行發行傳輸檢查，讓它們維持決定性並避免一般提供者外掛啟動。這些實際連線傳輸閘道會停用記憶體搜尋；記憶體行為仍由 QA parity 套件涵蓋。

完整發行實際連線媒體分片會使用 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含 `ffmpeg` 和 `ffprobe`。Docker 實際連線模型/後端分片會使用每個選定 commit 只建置一次的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行以儲存庫為依據的 QA 情境。
  - 針對所選情境集寫入頂層 `qa-evidence.json`、`qa-suite-summary.json` 和
    `qa-suite-report.md` 成品，包括混合流程、Vitest 和 Playwright 情境選項。
  - 由 `pnpm openclaw qa run --qa-profile <profile>` 分派時，會在同一個
    `qa-evidence.json` 中嵌入所選分類設定檔評分卡。
    `smoke-ci` 會寫入精簡證據，設定 `evidenceMode: "slim"` 並省略
    每個項目的 `execution`。`release` 涵蓋精選的發布就緒切片；
    `all` 會選取每個作用中的成熟度類別，並供需要完整評分卡成品時，
    明確分派 QA Profile Evidence 工作流程使用。
  - 預設會使用隔離的閘道 worker 並行執行多個選取的情境。
    `qa-channel` 預設並行度為 4（受所選情境數量限制）。使用
    `--concurrency <count>` 調整 worker 數量，或用 `--concurrency 1`
    執行較舊的序列執行線。
  - 任一情境失敗時會以非零狀態結束。若你想取得成品但不讓結束碼失敗，
    請使用 `--allow-failures`。
  - 支援供應商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動本機 AIMock 支援的供應商伺服器，用於實驗性
    fixture 與協定 mock 覆蓋率，而不取代具情境感知的
    `mock-openai` 執行線。
- `pnpm openclaw qa coverage --match <query>`
  - 搜尋情境 ID、標題、介面、覆蓋率 ID、文件參照、程式碼參照、
    外掛和供應商需求，然後列印相符的套件目標。
  - 當你知道被觸及的行為或檔案路徑，但不知道最小情境時，請在 QA Lab
    執行前使用此命令。這僅供參考；仍需依據被變更的行為選擇 mock、
    live、Multipass、Matrix 或傳輸證明。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink 外掛測試套件。它會安裝外部
    Kitchen Sink 套件、驗證外掛 SDK 介面清單、探測 `/healthz` 和
    `/readyz`、記錄閘道 CPU/RSS 證據、執行一次即時 OpenAI 回合，並檢查
    對抗式診斷。需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在已補水的
    Testbox 工作階段中，若存在 `openclaw-testbox-env` 輔助程式，它會自動載入
    Testbox 即時驗證設定檔。
- `pnpm test:gateway:cpu-scenarios`
  - 執行閘道啟動基準測試，加上一組小型 mock QA Lab 情境套件
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`)，並在 `.artifacts/gateway-cpu-scenarios/`
    下寫入合併的 CPU 觀察摘要。
  - 預設只標記持續性的高 CPU 觀察結果（`--cpu-core-warn` 加上
    `--hot-wall-warn-ms`），因此短暫啟動尖峰會被記錄為指標，而不會看起來像
    持續數分鐘的閘道滿載迴歸。
  - 使用已建置的 `dist` 成品；若 checkout 中尚未有新鮮的執行階段輸出，請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 內執行相同的 QA 套件。
  - 保持與主機上的 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的供應商/模型選取旗標。
  - 即時執行會轉送適合 guest 的受支援 QA 驗證輸入：以環境變數為基礎的供應商金鑰、QA 即時供應商設定路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須維持在 repo root 下，讓 guest 可以透過掛載的工作區寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告與摘要，以及 Multipass 記錄。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA 站台，用於操作員風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在 Docker 中全域安裝，執行非互動式
    OpenAI API 金鑰 onboarding，預設設定 Telegram，驗證封裝的外掛執行階段可在沒有啟動相依性修復的情況下載入，執行 doctor，並針對 mock OpenAI 端點執行一次本機代理回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的封裝安裝執行線。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式執行階段 context transcript 執行可重現的已建置應用程式 Docker smoke。它會驗證隱藏的 OpenClaw 執行階段 context 會以非顯示自訂訊息持久化，而不是洩漏到可見的使用者回合中，接著植入受影響的損壞工作階段 JSONL，並驗證
    `openclaw doctor --fix` 會將其重寫到作用中分支並建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 套件候選版本，執行已安裝套件的 onboarding，透過已安裝的命令列介面設定 Telegram，然後以該已安裝套件作為 SUT 閘道重用即時 Telegram QA 執行線。
  - wrapper 只會從 checkout 掛載 `qa-lab` harness 原始碼；已安裝套件擁有
    `dist`、`openclaw/plugin-sdk` 和 bundled 外掛執行階段，因此執行線不會把目前 checkout 的外掛混入受測套件。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而不是從 registry 安裝。
  - 預設會以 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` 在
    `qa-evidence.json` 中發出重複 RTT 計時。覆寫
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 來調整 RTT 執行。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` 接受以逗號分隔的 Telegram QA 檢查 ID
    清單進行取樣；未設定時，預設具備 RTT 能力的檢查是
    `telegram-mentioned-message-reply`。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram 環境變數憑證或 Convex
    憑證來源。針對 CI/發布自動化，請設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密鑰。若 CI 中存在
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密鑰，Docker wrapper 會自動選取 Convex。
  - wrapper 會先在主機上驗證 Telegram 或 Convex 憑證環境變數，再進行 Docker
    建置/安裝工作。只有在刻意偵錯憑證前置設定時，才設定
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此執行線覆寫共用的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。選取 Convex 憑證且未設定角色時，wrapper 在 CI 中使用
    `ci`，在 CI 外使用 `maintainer`。
  - GitHub Actions 會將此執行線公開為手動 maintainer 工作流程
    `NPM Telegram Beta E2E`。它不會在 merge 時執行。該工作流程使用
    `qa-live-shared` 環境和 Convex CI 憑證租約。
- GitHub Actions 也公開 `Package Acceptance`，用於針對一個候選套件進行旁路產品證明。它接受受信任的 ref、已發布的 npm spec、HTTPS tarball URL 加 SHA-256，或另一個執行中的 tarball 成品，將正規化後的 `openclaw-current.tgz` 上傳為 `package-under-test`，然後以 smoke、package、product、full 或自訂執行線設定檔執行既有 Docker E2E 排程器。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對相同的 `package-under-test` 成品執行 Telegram QA 工作流程。
  - 最新 beta 產品證明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精確 tarball URL 證明需要 digest，並使用公開 URL 安全性政策：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 企業/私人 tarball mirror 使用明確的受信任來源政策：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` 會從受信任的工作流程 ref 讀取 `.github/package-trusted-sources.json`，且不接受 URL 憑證或 workflow-input 私有網路繞過。若指定的政策宣告 bearer auth，請設定固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret。

- 成品證明會從另一個 Actions 執行下載 tarball 成品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中打包並安裝目前的 OpenClaw 建置，啟動已設定 OpenAI 的閘道，然後透過設定編輯啟用 bundled channel/plugins。
  - 驗證 setup discovery 會讓未設定的可下載外掛保持不存在，第一次設定好的 doctor 修復會明確安裝每個缺少的可下載外掛，而第二次重新啟動不會執行隱藏相依性修復。
  - 也會安裝已知的較舊 npm baseline，在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的更新後 doctor 會清理舊版外掛相依性殘留，而不需要 harness 端 postinstall 修復。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生封裝安裝更新 smoke。每個選取的平台會先安裝要求的 baseline 套件，然後在同一個 guest 中執行已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、閘道就緒狀態，以及一次本機代理回合。
  - 迭代單一 guest 時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得摘要成品路徑和各執行線狀態。
  - OpenAI 執行線預設使用 `openai/gpt-5.5` 進行即時代理回合證明。若刻意驗證另一個 OpenAI 模型，請傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels 傳輸停滯耗盡剩餘測試時段：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 該 script 會在 `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀執行線記錄。
    在假設外層 wrapper 卡住前，請先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在 cold guest 上，Windows 更新可能會在更新後 doctor 和套件更新工作中花費 10 到 15 分鐘；只要巢狀 npm debug log 仍在前進，這仍屬健康狀態。
  - 請勿將此彙總 wrapper 與個別 Parallels macOS、Windows 或 Linux smoke 執行線並行執行。它們共用 VM 狀態，可能會在 snapshot 還原、套件服務或 guest 閘道狀態上發生衝突。
  - 更新後證明會執行一般 bundled 外掛介面，因為語音、圖片生成和媒體理解等 capability facade 是透過 bundled 執行階段 API 載入，即使代理回合本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接的協定 smoke
    測試。
- `pnpm openclaw qa matrix`
  - 針對一次性的 Docker-backed Tuwunel homeserver 執行 Matrix 即時 QA lane。僅限來源 checkout - packaged installs 不會隨附 `qa-lab`。
  - 完整命令列介面、profile/scenario catalog、env vars 與 artifact 版面配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自 env 的 driver 與 SUT bot tokens，針對真實私人群組執行 Telegram 即時 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 與 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群組 id 必須是數值 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共享 pooled credentials。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 來選用 pooled leases。
  - 預設涵蓋 canary、mention gating、command addressing、`/status`、bot-to-bot mentioned replies，以及 core native command replies。`mock-openai` 預設也涵蓋 deterministic reply-chain 與 Telegram final-message streaming regressions。使用 `--list-scenarios` 查看選用 probes，例如 `session_status`。
  - 任一 scenario 失敗時會以非零狀態結束。當你想要 artifacts 但不想要失敗 exit code 時，請使用 `--allow-failures`。
  - 需要同一個私人群組中有兩個不同的 bot，且 SUT bot 需公開 Telegram username。
  - 為了穩定觀察 bot-to-bot，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確認 driver bot 可以觀察 group bot traffic。
  - 會在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA report、summary 與 `qa-evidence.json`。回覆 scenarios 會包含從 driver send request 到觀察到 SUT reply 的 RTT。

`Mantis Telegram Live` 是此 lane 周圍的 PR-evidence wrapper。它會使用 Convex-leased Telegram credentials 執行候選 ref，在 Crabbox desktop browser 中呈現經遮蔽的 QA report/evidence bundle、錄製 MP4 evidence、產生 motion-trimmed GIF、上傳 artifact bundle，並在設定 `pr_number` 時透過 Mantis GitHub App 發布 inline PR evidence。維護者可以透過 Actions UI 中的 `Mantis Scenario`（`scenario_id:
telegram-live`）啟動，或直接從 pull request comment 啟動：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用於 PR visual proof 的 agentic native Telegram Desktop before/after wrapper。可從 Actions UI 以 freeform `instructions` 啟動，透過 `Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）啟動，或從 PR comment 啟動：

```text
@openclaw-mantis telegram desktop proof
```

Mantis agent 會讀取 PR、決定哪些 Telegram-visible behavior 可證明變更、在 baseline 與 candidate refs 上執行 real-user Crabbox Telegram Desktop proof lane、反覆執行直到 native GIFs 有用、寫入 paired `motionPreview` manifest，並在設定 `pr_number` 時透過 Mantis GitHub App 發布相同的 2-column GIF table。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重用 Crabbox Linux desktop、安裝 native Telegram Desktop、使用租用的 Telegram SUT bot token 設定 OpenClaw、啟動閘道，並從可見的 VNC desktop 錄製 screenshot/MP4 evidence。
  - 預設為 `--credential-source convex`，因此 workflows 只需要 Convex broker secret。若使用 `--credential-source env`，請使用與 `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 變數。
  - Telegram Desktop 仍需要 user login/profile。bot token 只會設定 OpenClaw。請對 base64 `.tgz` profile archive 使用 `--telegram-profile-archive-env <name>`，或使用 `--keep-lease` 並透過 VNC 手動登入一次。
  - 會在 output directory 下寫入 `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png` 與 `telegram-desktop-builder.mp4`。

即時 transport lanes 共用一個標準 contract，讓新的 transports 不會偏移；各 lane coverage matrix 位於 [QA overview → Live transport coverage](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的 synthetic suite，並非該 matrix 的一部分。

### 透過 Convex 共享 Telegram credentials（v1）

當為即時 transport QA 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex-backed pool 取得 exclusive lease，在 lane 執行期間對該 lease 進行 heartbeats，並在 shutdown 時釋放 lease。此 section 名稱早於 Discord、Slack 與 WhatsApp 支援；lease contract 會跨 kinds 共用。

參考 Convex project scaffold：

- `qa/convex-credential-broker/`

必要 env vars：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選 role 的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- Credential role selection：
  - 命令列介面：`--credential-role maintainer|ci`
  - Env default：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，否則為 `maintainer`）

選用 env vars：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許僅限本機開發使用的 loopback `http://` Convex URLs。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

維護者 admin commands（pool add/remove/list）明確需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

維護者的命令列介面 helpers：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

請在 live runs 前使用 `doctor` 檢查 Convex site URL、broker secrets、endpoint prefix、HTTP timeout 與 admin/list reachability，且不列印 secret values。在 scripts 與 CI utilities 中使用 `--json` 取得 machine-readable output。

預設 endpoint contract（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - Request：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Request：`{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Success：`{ status: "ok", index, data }`
- `POST /heartbeat`
  - Request：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - Request：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success：`{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（僅限 maintainer secret）
  - Request：`{ kind, actorId, payload, note?, status? }`
  - Success：`{ status: "ok", credential }`
- `POST /admin/remove`（僅限 maintainer secret）
  - Request：`{ credentialId, actorId }`
  - Success：`{ status: "ok", changed, credential }`
  - Active lease guard：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅限 maintainer secret）
  - Request：`{ kind?, status?, includePayload?, limit? }`
  - Success：`{ status: "ok", credentials, count }`

Telegram kind 的 payload shape：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是 numeric Telegram chat id string。
- `admin/add` 會為 `kind: "telegram"` 驗證此 shape，並拒絕 malformed payloads。

Telegram real-user kind 的 payload shape：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 與 `telegramApiId` 必須是 numeric strings。
- `tdlibArchiveSha256` 與 `desktopTdataArchiveSha256` 必須是 SHA-256 hex strings。
- `kind: "telegram-user"` 保留給 Mantis Telegram Desktop proof workflow。Generic QA Lab lanes 不得取得它。

Broker-validated multi-channel payloads：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes 也可以從 pool 租用，但 Slack payload validation 目前位於 Slack QA runner，而不是 broker。Slack rows 請使用
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 將 channel 加入 QA

新 channel adapters 的 architecture 與 scenario-helper names 位於 [QA overview → Adding a channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低門檻：在共享的 `qa-lab` host seam 上實作 transport runner、在外掛 manifest 中宣告 `qaRunners`、掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫 scenarios。

## Test suites（什麼在哪裡執行）

請將 suites 視為「越來越接近真實」（同時 flakiness/cost 也越來越高）：

### Unit / integration（預設）

- Command：`pnpm test`
- Config：untargeted runs 使用 `vitest.full-*.config.ts` shard set，並可能將 multi-project shards 展開為 per-project configs 以進行 parallel scheduling
- Files：core/unit inventories 位於 `src/**/*.test.ts`、`packages/**/*.test.ts` 與 `test/**/*.test.ts`；UI unit tests 會在專用的 `unit-ui` shard 中執行
- Scope：
  - 純 unit tests
  - In-process integration tests（gateway auth、routing、tooling、parsing、config）
  - 已知 bug 的 deterministic regressions
- Expectations：
  - 在 CI 中執行
  - 不需要真實 keys
  - 應該快速且穩定
  - Resolver 與 public-surface loader tests 必須使用產生的小型外掛 fixtures 證明廣泛的 `api.js` 與
    `runtime-api.js` fallback behavior，而不是
    真實 bundled plugin source APIs。真實外掛 API loads 屬於
    plugin-owned contract/integration suites。

Native dependency policy：

- 預設 test installs 會跳過 optional native Discord opus builds。Discord voice 使用 bundled `libopus-wasm`，且 `@discordjs/opus` 會在 `allowBuilds` 中保持停用，因此 local tests 與 Testbox lanes 不會編譯 native addon。
- 請在 `libopus-wasm` benchmark repo 中比較 native opus performance，而不是在預設 OpenClaw install/test loops 中。不要在預設 `allowBuilds` 中將 `@discordjs/opus` 設為 `true`；那會讓無關的 install/test loops 編譯 native code。

<AccordionGroup>
  <Accordion title="Projects、shards 與 scoped lanes">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這會降低高負載機器上的峰值 RSS，並避免 auto-reply/extension 工作使不相關的套件資源不足。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片監看迴圈並不實用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過 scoped lanes 路由明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免支付完整根專案啟動成本。
    - `pnpm test:changed` 預設會將已變更的 git 路徑展開成低成本的 scoped lanes：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖相依項。設定/啟動/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的常規智慧本機檢查關卡。它會將 diff 分類為 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然後執行相符的 typecheck、lint 與 guard 命令。它不會執行 Vitest 測試；若需要測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅 release metadata 的版本遞增會執行有目標的版本/設定/根相依性檢查，並有 guard 拒絕頂層 version 欄位以外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth scripts 的 shell 語法，以及 live Docker scheduler dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時，才會納入 `package.json` 變更；相依性、export、version 和其他 package-surface 編輯仍使用較廣的 guards。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純 utility 區域的 import-light unit tests 會路由至 `unit-fast` lane，該 lane 會略過 `test/setup-openclaw-runtime.ts`；具狀態/重 runtime 的檔案仍留在既有 lanes。
    - 選定的 `plugin-sdk` 和 `commands` helper source files 也會將 changed-mode 執行對應到這些 light lanes 中明確的同層測試，因此 helper 編輯可避免重新執行該目錄完整的重型套件。
    - `auto-reply` 對頂層 core helpers、頂層 `reply.*` integration tests，以及 `src/auto-reply/reply/**` 子樹有專用 buckets。CI 會進一步將 reply 子樹分割成 agent-runner、dispatch 和 commands/state-routing shards，因此單一 import-heavy bucket 不會獨佔完整的 Node 尾端。
    - 常規 PR/main CI 會刻意略過 extension batch sweep 和僅 release 使用的 `agentic-plugins` shard。Full Release Validation 會針對 release candidates 分派獨立的 `Plugin Prerelease` 子 workflow，以執行這些 plugin/extension-heavy 套件。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 當你變更 message-tool discovery inputs 或壓縮 runtime
      context 時，請保留兩個層級的覆蓋率。
    - 為純 routing 和 normalization
      boundaries 新增聚焦的 helper regression。
    - 保持 embedded runner integration suites 健康：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證 scoped ids 和壓縮行為仍透過真實
      `run.ts` / `compact.ts` 路徑流動；僅 helper 的測試
      不足以取代這些 integration paths。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Base Vitest config 預設為 `threads`。
    - 共享 Vitest config 固定 `isolate: false`，並在
      root projects、e2e 和 live configs 使用 non-isolated runner。
    - root UI lane 保留其 `jsdom` setup 和 optimizer，但也在
      共享 non-isolated runner 上執行。
    - 每個 `pnpm test` shard 都從共享 Vitest config 繼承相同的
      `threads` + `isolate: false` 預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest child Node
      processes 加上 `--no-maglev`，以降低大型本機執行期間的 V8 compile churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與 stock V8
      行為比較。
    - `scripts/run-vitest.mjs` 會在明確的非 watch Vitest 執行
      5 分鐘沒有 stdout 或 stderr 輸出後終止。設定
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` 可為刻意靜默的調查停用 watchdog。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構 lanes。
    - pre-commit hook 僅執行格式化。它會重新 stage 已格式化檔案，
      且不會執行 lint、typecheck 或測試。
    - 當你需要智慧本機檢查關卡時，請在 handoff 或 push 前明確執行
      `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本 scoped lanes 路由。只有當 agent
      判定 harness、config、package 或 contract 編輯確實需要更廣的
      Vitest 覆蓋率時，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行為，只是 worker cap 較高。
    - 本機 worker 自動縮放刻意保守，並會在主機 load average 已經很高時
      退讓，因此多個並行 Vitest 執行預設會造成較少損害。
    - Base Vitest config 會將 projects/config files 標記為
      `forceRerunTriggers`，因此 test wiring 變更時，changed-mode 重新執行仍保持正確。
    - config 會在支援的主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      如果你想要一個明確的 cache 位置供直接 profiling 使用，請設定
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 會啟用 Vitest import-duration reporting，加上
      import-breakdown output。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling view 限定在
      自 `origin/main` 以來變更的檔案。
    - Shard timing data 會寫入 `.artifacts/vitest-shard-timings.json`。
      Whole-config runs 使用 config path 作為 key；include-pattern CI
      shards 會附加 shard name，因此 filtered shards 可分開追蹤。
    - 當某個 hot test 仍將大部分時間花在 startup imports 時，
      請將重型相依性放在狹窄的本機 `*.runtime.ts` seam 後方，並
      直接 mock 該 seam，而不是 deep-importing runtime helpers 只為了將它們傳入
      `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對該已提交的
      diff，比較 routed `test:changed` 與原生 root-project path，
      並列印 wall time 加上 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和 root Vitest config 路由 changed file list，
      以 benchmark 目前 dirty tree。
    - `pnpm test:perf:profile:main` 會為 Vitest/Vite startup 和 transform overhead
      寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會為停用 file parallelism 的
      unit suite 寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（閘道）

- 命令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制為一個 worker
- 範圍：
  - 預設啟用 diagnostics，啟動真實的 loopback 閘道
  - 透過 diagnostic event path 驅動 synthetic gateway message、memory 和 large-payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 保持有界、synthetic RSS samples 低於 pressure budget，且 per-session queue depths 會 drain 回零
- 預期：
  - CI-safe 且不需要金鑰
  - 用於 stability-regression follow-up 的窄 lane，不是完整 Gateway suite 的替代品

### E2E（repo aggregate）

- 命令：`pnpm test:e2e`
- 範圍：
  - 執行 gateway smoke E2E lane
  - 執行 mocked Control UI browser E2E lane
- 預期：
  - CI-safe 且不需要金鑰
  - 需要已安裝 Playwright Chromium

### E2E（gateway smoke）

- 命令：`pnpm test:e2e:gateway`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled-plugin E2E tests
- Runtime 預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用 adaptive workers（CI：最多 2；本機：預設 1）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 用於強制 worker count（上限為 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用於重新啟用詳細 console output。
- 範圍：
  - Multi-instance gateway end-to-end behavior
  - WebSocket/HTTP surfaces、節點 pairing，以及較重的 networking
- 預期：
  - 在 CI 中執行（於 pipeline 啟用時）
  - 不需要真實金鑰
  - 比 unit tests 有更多 moving parts（可能較慢）

### E2E（Control UI mocked browser）

- 命令：`pnpm test:ui:e2e`
- 設定：`test/vitest/vitest.ui-e2e.config.ts`
- 檔案：`ui/src/**/*.e2e.test.ts`
- 範圍：
  - 啟動 Vite Control UI
  - 透過 Playwright 驅動真實 Chromium page
  - 以 deterministic in-browser mocks 取代 Gateway WebSocket
- 預期：
  - 作為 `pnpm test:e2e` 的一部分在 CI 中執行
  - 不需要真實 Gateway、agents 或 provider keys
  - Browser dependency 必須存在（`pnpm --dir ui exec playwright install chromium`）

### E2E：OpenShell backend smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 重複使用 active local OpenShell gateway
  - 從 temporary local Dockerfile 建立 sandbox
  - 透過真實 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證 remote-canonical filesystem behavior
- 預期：
  - 僅 opt-in；不是預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` 命令列介面加上可運作的 Docker daemon
  - 需要 active local OpenShell gateway 及其 config source
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀 test sandbox
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 用於手動執行較廣的 e2e suite 時啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用於指向非預設的命令列介面 binary 或 wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` 用於將 registered gateway config 暴露給隔離測試
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` 用於覆寫 host policy fixture 使用的 Docker gateway IP

### Live（真實 providers + 真實 models）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 底下的 bundled-plugin live tests
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  -「這個提供者/模型在 _今天_ 搭配真實憑證是否真的能運作？」
  - 捕捉提供者格式變更、工具呼叫特殊行為、驗證問題，以及速率限制行為
- 預期：
  - 設計上不保證 CI 穩定（真實網路、真實提供者政策、配額、中斷）
  - 會花錢 / 使用速率限制額度
  - 優先執行縮小範圍的子集，而不是「全部」
- Live runs 使用已匯出的 API 金鑰和 staged auth profiles。
- 預設情況下，live runs 仍會隔離 `HOME`，並將設定/驗證材料複製到暫時測試 home，讓單元測試 fixtures 無法修改你真正的 `~/.openclaw`。
- 只有在你有意需要 live tests 使用真正的 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 預設採用較安靜的模式：它保留 `[live] ...` 進度輸出，並靜音閘道 bootstrap logs/Bonjour chatter。若你想要恢復完整啟動 logs，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依提供者而定）：設定 `*_API_KEYS`，使用逗號/分號格式，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 做 per-live override；測試會在速率限制回應時重試。
- 進度/心跳偵測輸出：
  - Live suites 現在會將進度行送到 stderr，因此即使 Vitest console capture 很安靜，長時間提供者呼叫仍會明顯保持活動狀態。
  - `vitest.live.config.ts` 會停用 Vitest console interception，讓提供者/閘道進度行在 live runs 期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model 心跳偵測。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整閘道/probe 心跳偵測。

## 我該執行哪個套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你改了很多，也執行 `pnpm test:coverage`）
- 觸碰閘道 networking / WS protocol / pairing：加入 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 提供者特定失敗 / 工具呼叫：執行縮小範圍的 `pnpm test:live`

## Live（會觸碰網路的）測試

關於 live model matrix、命令列介面 backend smokes、ACP smokes、Codex app-server
harness，以及所有 media-provider live tests（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）- 加上 live runs 的憑證處理 - 請參閱
[Testing live suites](/zh-TW/help/testing-live)。關於專用的更新與
外掛驗證 checklist，請參閱
[Testing updates and plugins](/zh-TW/help/testing-updates-plugins)。

## Docker runners（選用的「在 Linux 中可運作」檢查）

這些 Docker runners 分成兩類：

- Live-model runners：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker image 內執行其對應的 profile-key live file（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載你的本機設定目錄、workspace，以及選用的 profile env file。對應的本機 entrypoints 是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live runners 會在需要時保留自己的實務上限：
  `test:docker:live-models` 預設使用 curated supported high-signal set，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。當你明確想要較小上限或較大掃描時，請設定 `OPENCLAW_LIVE_MAX_MODELS`
  或閘道 env vars。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置 live Docker image 一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包成 npm tarball 一次，然後建置/重用兩個 `scripts/e2e/Dockerfile` images。bare image 只是用於 install/update/plugin-dependency lanes 的 節點/Git runner；那些 lanes 會掛載預先建置的 tarball。functional image 會將同一個 tarball 安裝到 `/app`，用於 built-app functionality lanes。Docker lane definitions 位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner logic 位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的計畫。aggregate 使用加權本機 scheduler：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制 process slots，而 resource caps 會避免 heavy live、npm-install，以及 multi-service lanes 同時全部啟動。如果單一 lane 比作用中的 caps 更重，scheduler 仍可在 pool 為空時啟動它，然後讓它獨自執行，直到容量再次可用。預設為 10 slots、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker host 有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 預設會執行 Docker preflight、移除 stale OpenClaw E2E containers、每 30 秒列印狀態、將成功 lane timings 儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續 runs 使用那些 timings 先啟動較長的 lanes。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印 weighted lane manifest，而不建置或執行 Docker；或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lanes、package/image 需求與憑證的 CI plan。
- `Package Acceptance` 是 GitHub-native package gate，用於回答「這個可安裝 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個 candidate package，將其上傳為 `package-under-test`，然後針對那個確切 tarball 執行可重用的 Docker E2E lanes，而不是重新打包選取的 ref。Profiles 依廣度排序：`smoke`、`package`、`product` 和 `full`。關於 package/update/plugin contract、published-upgrade survivor matrix、release defaults 和 failure triage，請參閱 [Testing updates and plugins](/zh-TW/help/testing-updates-plugins)。
- Build 和 release checks 會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態 built graph，並在 pre-dispatch startup 於 command dispatch 前匯入 Commander、prompt UI、undici 或 logging 等 package dependencies 時失敗；它也會讓 bundled gateway run chunk 維持在預算內，並拒絕已知 cold gateway paths 的 static imports。Packaged 命令列介面 smoke 也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list command。
- Package Acceptance legacy compatibility 上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，harness 只容忍 shipped-package metadata gaps：省略 private QA inventory entries、缺少 `gateway install --wrapper`、tarball-derived git fixture 中缺少 patch files、缺少 persisted `update.channel`、legacy plugin install-record locations、缺少 marketplace install-record persistence，以及 `plugins update` 期間的 config metadata migration。對於 `2026.4.25` 之後的 packages，這些 paths 都是 strict failures。
- Container smoke runners：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 會啟動一個或多個真實 containers，並驗證較高層級的 integration paths。
- 透過 `scripts/lib/openclaw-e2e-instance.sh` 安裝 packed OpenClaw tarball 的 Docker/Bash E2E lanes 會將 `npm install` 限制在 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（預設 `600s`；設定 `0` 可停用 wrapper 以便偵錯）。

live-model Docker runners 也只會 bind-mount 需要的 命令列介面 auth homes（或在 run 未縮小範圍時掛載所有支援項目），然後在 run 前將它們複製到 container home，讓 external-CLI OAuth 能重新整理 tokens，而不會修改 host auth store：

- Direct models：`pnpm test:docker:live-models`（script：`scripts/test-live-models-docker.sh`）
- ACP bind smoke：`pnpm test:docker:live-acp-bind`（script：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 與 `pnpm test:docker:live-acp-bind:opencode` 提供 strict Droid/OpenCode coverage）
- 命令列介面 backend smoke：`pnpm test:docker:live-cli-backend`（script：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`（script：`scripts/test-live-codex-harness-docker.sh`）
- 閘道 + dev agent：`pnpm test:docker:live-gateway`（script：`scripts/test-live-gateway-models-docker.sh`）
- Observability smokes：`pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 和 `pnpm qa:observability:smoke` 是 private QA source-checkout lanes。它們刻意不屬於 package Docker release lanes，因為 npm tarball 省略 QA Lab。
- Open WebUI live smoke：`pnpm test:docker:openwebui`（script：`scripts/e2e/openwebui-docker.sh`）
- Onboarding wizard（TTY，完整 scaffolding）：`pnpm test:docker:onboard`（script：`scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/channel/agent smoke：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝 packed OpenClaw tarball，預設透過 env-ref onboarding 設定 OpenAI，加上 Telegram，執行 doctor，並執行一次 mocked OpenAI agent turn。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可重用預先建置的 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 可跳過 host rebuild，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換 channel。

- 發行使用者旅程冒煙測試：`pnpm test:docker:release-user-journey` 會在乾淨的 Docker home 中全域安裝打包好的 OpenClaw tarball、執行導入流程、設定模擬的 OpenAI 提供者、執行一次代理回合、安裝/解除安裝外部外掛、針對本機 fixture 設定 ClickClack、驗證傳出/傳入訊息、重新啟動閘道，並執行 doctor。
- 發行型別化導入冒煙測試：`pnpm test:docker:release-typed-onboarding` 會安裝打包好的 tarball，透過真實 TTY 驅動 `openclaw onboard`，將 OpenAI 設定為 env-ref 提供者，驗證不會保留原始金鑰，並執行模擬的代理回合。
- 發行媒體/記憶冒煙測試：`pnpm test:docker:release-media-memory` 會安裝打包好的 tarball，驗證從 PNG 附件進行影像理解、OpenAI 相容的影像生成輸出、記憶搜尋回想，以及回想在閘道重新啟動後仍保留。
- 發行升級使用者旅程冒煙測試：`pnpm test:docker:release-upgrade-user-journey` 預設會安裝比候選 tarball 舊的最新已發布基準版本，在已發布套件上設定提供者/外掛/ClickClack 狀態，升級到候選 tarball，然後重新執行核心代理/外掛/通道旅程。如果沒有較舊的已發布基準版本，則會重用候選版本。可用 `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` 覆寫基準版本。
- 發行外掛市集冒煙測試：`pnpm test:docker:release-plugin-marketplace` 會從本機 fixture 市集安裝、更新已安裝的外掛、解除安裝它，並驗證外掛命令列介面會隨安裝中繼資料修剪後消失。
- Skill 安裝冒煙測試：`pnpm test:docker:skill-install` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，在設定中停用上傳封存檔安裝，從搜尋解析目前即時 ClawHub skill slug，使用 `openclaw skills install` 安裝它，並驗證已安裝的 skill 以及 `.clawhub` 來源/鎖定中繼資料。
- 更新通道切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證保留的通道與外掛更新後運作，然後切回套件 `stable` 並檢查更新狀態。
- 升級存活冒煙測試：`pnpm test:docker:upgrade-survivor` 會將打包好的 OpenClaw tarball 安裝到含有代理、通道設定、外掛允許清單、過期外掛相依狀態，以及既有工作區/工作階段檔案的髒舊使用者 fixture 之上。它會在沒有即時提供者或通道金鑰的情況下執行套件更新與非互動式 doctor，然後啟動 loopback 閘道，並檢查設定/狀態保留以及啟動/狀態預算。
- 已發布升級存活冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`、植入逼真的既有使用者檔案、使用內建命令配方設定該基準版本、驗證產生的設定、將該已發布安裝更新到候選 tarball、執行非互動式 doctor、寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 loopback 閘道並檢查已設定的意圖、狀態保留、啟動、`/healthz`、`/readyz` 與 RPC 狀態預算。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫一個基準版本，要求彙總排程器使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確本機基準版本，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，並使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixture，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw 外掛安裝。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 與 `published_upgrade_survivor_scenarios`，解析 `last-stable-4` 或 `all-since-2026.4.23` 等中繼基準權杖，而 Full Release Validation 會將 release-soak 套件閘門展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- 工作階段執行階段情境冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段情境逐字稿持久化，以及 doctor 對受影響重複 prompt-rewrite 分支的修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前樹狀結構，在隔離 home 中使用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會傳回內建影像提供者而不是卡住。可用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 略過主機建置，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝程式 Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 與 direct-npm 容器之間共用一個 npm 快取。更新冒煙測試預設會先以 npm `latest` 作為穩定基準版本，再升級到候選 tarball。可在本機用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上用 Install Smoke 工作流程的 `update_baseline_version` 輸入覆寫。非 root 安裝程式檢查會保留隔離的 npm 快取，因此 root 擁有的快取項目不會掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重跑時重用 root/update/direct-npm 快取。
- Install Smoke CI 會用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 略過重複的 direct-npm 全域更新；需要直接 `npm install -g` 覆蓋時，請在本機不帶該環境變數執行腳本。
- 代理刪除共用工作區命令列介面冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（腳本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置根 Dockerfile 映像，在隔離容器 home 中植入兩個具有同一個工作區的代理，執行 `agents delete --json`，並驗證有效 JSON 與保留工作區行為。可用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- 閘道網路（兩個容器、WS 驗證 + 健康狀態）：`pnpm test:docker:gateway-network`（腳本：`scripts/e2e/gateway-network-docker.sh`）
- 瀏覽器 CDP 快照冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（腳本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置來源 E2E 映像加上一層 Chromium，使用原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP 角色快照涵蓋連結 URL、游標提升的可點擊項目、iframe 參照與 frame 中繼資料。
- OpenAI Responses web_search 最小推理回歸：`pnpm test:docker:openai-web-search-minimal`（腳本：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過閘道執行模擬的 OpenAI 伺服器，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升為 `low`，然後強制提供者結構描述拒絕，並檢查原始詳細資訊出現在閘道記錄中。
- MCP 通道橋接（已植入的閘道 + stdio 橋接 + 原始 Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（腳本：`scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw bundle MCP 工具（真實 stdio MCP 伺服器 + 內嵌 OpenClaw profile 允許/拒絕冒煙測試）：`pnpm test:docker:agent-bundle-mcp-tools`（腳本：`scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- 排程/subagent MCP 清理（真實閘道 + 在隔離排程與一次性 subagent 執行後拆除 stdio MCP 子程序）：`pnpm test:docker:cron-mcp-cleanup`（腳本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 外掛（針對本機路徑、`file:`、具提升相依性的 npm registry、格式錯誤的 npm 套件中繼資料、git moving refs、ClawHub kitchen-sink、市集更新，以及 Claude-bundle 啟用/檢查的安裝/更新冒煙測試）：`pnpm test:docker:plugins`（腳本：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可略過 ClawHub 區塊，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 與 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink 套件/執行階段配對。沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 時，測試會使用 hermetic 本機 ClawHub fixture 伺服器。
- 外掛未變更更新冒煙測試：`pnpm test:docker:plugin-update`（腳本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 外掛生命週期矩陣冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在空白容器中安裝打包好的 OpenClaw tarball、安裝 npm 外掛、切換啟用/停用、透過本機 npm registry 升級與降級它、刪除已安裝程式碼，然後驗證解除安裝仍會移除過期狀態，同時記錄每個生命週期階段的 RSS/CPU 指標。
- 設定重新載入中繼資料冒煙測試：`pnpm test:docker:config-reload`（腳本：`scripts/e2e/config-reload-source-docker.sh`）
- 外掛：`pnpm test:docker:plugins` 涵蓋本機路徑、`file:`、具提升相依性的 npm registry、git moving refs、ClawHub fixture、市集更新，以及 Claude-bundle 啟用/檢查的安裝/更新冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝外掛的未變更更新行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋受資源追蹤的 npm 外掛安裝、啟用、停用、升級、降級，以及缺少程式碼時的解除安裝。

若要手動預先建置並重用共用 functional 映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

已設定時，`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 等套件專屬映像覆寫仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，如果該映像尚未在本機，腳本會拉取它。QR 與安裝程式 Docker 測試會保留自己的 Dockerfile，因為它們驗證的是套件/安裝行為，而不是共用已建置應用程式執行階段。

即時模型 Docker runner 也會以唯讀方式 bind-mount 目前的 checkout，並
將其 stage 到容器內的暫時 workdir。這能讓 runtime
映像保持精簡，同時仍針對你確切的本機來源/設定執行 Vitest。
staging 步驟會略過大型的本機專用快取與應用程式建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及應用程式本機的 `.build` 或
Gradle 輸出目錄，因此 Docker 即時執行不會花數分鐘複製
機器專屬的成品。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此閘道即時 probe 不會在
容器內啟動真正的 Telegram/Discord 等通道 worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，所以當你需要縮小或排除該 Docker lane 的閘道
即時覆蓋範圍時，也請傳入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高層級的相容性 smoke：它會啟動一個
已啟用 OpenAI 相容 HTTP endpoint 的 OpenClaw 閘道容器，
再啟動一個固定版本的 Open WebUI 容器連到該閘道，透過
Open WebUI 登入，驗證 `/api/models` 會公開 `openclaw/default`，然後透過 Open WebUI 的 `/api/chat/completions` proxy 傳送一個
真正的聊天請求。
對於應在 Open WebUI 登入和模型探索後停止、而不等待即時模型
completion 的 release-path CI 檢查，請設定 `OPENWEBUI_SMOKE_MODE=models`。
第一次執行可能會明顯較慢，因為 Docker 可能需要拉取
Open WebUI 映像，而 Open WebUI 也可能需要完成自己的 cold-start 設定。
此 lane 預期有可用的即時模型 key。請透過處理程序
環境、staged auth profiles，或明確的 `OPENCLAW_PROFILE_FILE` 提供。
成功執行會印出一小段 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意保持決定性的，且不需要
真正的 Telegram、Discord 或 iMessage 帳號。它會啟動一個 seeded 閘道
容器，啟動第二個容器以 spawn `openclaw mcp serve`，然後
驗證 routed conversation discovery、transcript reads、attachment metadata、
live event queue behavior、outbound send routing，以及透過真正 stdio MCP bridge 的 Claude-style channel +
permission notifications。notification 檢查會直接檢查原始 stdio MCP frame，因此 smoke 驗證的是
bridge 實際 emit 的內容，而不只是特定 client SDK 剛好公開的內容。
`test:docker:agent-bundle-mcp-tools` 是決定性的，且不需要即時
模型 key。它會建置 repo Docker 映像，在容器內啟動真正的 stdio MCP probe server，
透過嵌入式 OpenClaw bundle
MCP runtime materialize 該 server，執行工具，然後驗證 `coding` 與 `messaging` 保留
`bundle-mcp` 工具，而 `minimal` 與 `tools.deny: ["bundle-mcp"]` 會將它們過濾掉。
`test:docker:cron-mcp-cleanup` 是決定性的，且不需要即時模型
key。它會以真正的 stdio MCP probe server 啟動 seeded 閘道，執行
隔離的排程 turn 與 `sessions_spawn` one-shot child turn，然後驗證
MCP child process 會在每次執行後退出。

手動 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 請保留此 script 供 regression/debug workflow 使用。ACP thread routing validation 可能會再次需要它，因此不要刪除。

實用環境變數：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）mount 到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）mount 到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` mount 並在執行測試前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用於僅驗證從 `OPENCLAW_PROFILE_FILE` source 的 env var，並使用暫時 config/workspace dirs，且不使用外部命令列介面 auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）mount 到 `/home/node/.npm-global`，供 Docker 內快取命令列介面 installs
- `$HOME` 底下的外部命令列介面 auth dirs/files 會以唯讀方式 mount 到 `/host-auth...` 底下，然後在測試開始前複製到 `/home/node/...`
  - 預設 dirs：`.minimax`
  - 預設 files：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - Narrowed provider runs 只會 mount 從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要 dirs/files
  - 可用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的逗號清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於在容器內篩選 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於在不需要重新建置的 rerun 中重用既有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保 creds 來自 profile store（而不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 Open WebUI smoke 中由閘道公開的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫固定的 Open WebUI image tag

## Docs sanity

文件編輯後執行 docs 檢查：`pnpm check:docs`。
當你也需要頁面內 heading 檢查時，請執行完整 Mintlify anchor validation：`pnpm docs:check-links:anchors`。

## 離線 regression（CI-safe）

這些是沒有真實 providers 的「real pipeline」regressions：

- 閘道工具呼叫（mock OpenAI，真實閘道 + agent loop）：`src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- 閘道 wizard（WS `wizard.start`/`wizard.next`，寫入 config + 強制 auth）：`src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent reliability evals（skills）

我們已經有幾個 CI-safe tests，行為類似「agent reliability evals」：

- 透過真實閘道 + agent loop 的 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與 config effects 的 end-to-end wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **Decisioning：** 當 prompt 中列出 skills 時，agent 是否會選擇正確的 skill（或避免不相關的 skill）？
- **Compliance：** agent 是否會在使用前讀取 `SKILL.md`，並遵循必要 steps/args？
- **Workflow contracts：** 斷言 tool order、session history carryover 與 sandbox boundaries 的 multi-turn scenarios。

未來 evals 應先保持決定性：

- 使用 mock providers 的 scenario runner，用於斷言 tool calls + order、skill file reads 與 session wiring。
- 一小組以 skill 為焦點的 scenarios（use vs avoid、gating、prompt injection）。
- Optional live evals（opt-in、env-gated）只在 CI-safe suite 就緒後再加入。

## Contract tests（外掛與通道 shape）

Contract tests 會驗證每個已註冊的外掛與通道都符合其
interface contract。它們會迭代所有 discovered plugins，並執行一組
shape 與 behavior assertions。預設的 `pnpm test` unit lane 會刻意
略過這些 shared seam 與 smoke files；當你觸及 shared channel 或 provider surfaces 時，
請明確執行 contract commands。

### 命令

- 所有 contracts：`pnpm test:contracts`
- 僅通道 contracts：`pnpm test:contracts:channels`
- 僅 provider contracts：`pnpm test:contracts:plugins`

### 通道 contracts

位於 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本外掛 shape（id、name、capabilities）
- **setup** - Setup wizard contract
- **session-binding** - Session binding behavior
- **outbound-payload** - Message payload structure
- **inbound** - Inbound message handling
- **actions** - Channel action handlers
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contracts

位於 `src/plugins/contracts/*.contract.test.ts`。

- **status** - Channel status probes
- **registry** - 外掛 registry shape

### Provider contracts

位於 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - 外掛 discovery
- **loader** - 外掛 loading
- **runtime** - Provider runtime
- **shape** - 外掛 shape/interface
- **wizard** - Setup wizard

### 執行時機

- 變更 plugin-sdk exports 或 subpaths 後
- 新增或修改通道或 provider 外掛後
- 重構外掛 registration 或 discovery 後

Contract tests 會在 CI 中執行，且不需要真正的 API keys。

## 新增 regressions（指引）

當你修復在 live 中發現的 provider/model issue 時：

- 盡可能新增 CI-safe regression（mock/stub provider，或捕捉確切的 request-shape transformation）
- 如果它本質上只能 live-only（rate limits、auth policies），請保持 live test 範圍狹窄，並透過 env vars opt-in
- 優先 targeting 能捕捉 bug 的最小 layer：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI-safe gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class derive 一個 sampled target，然後斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 新增新的 `includeInPlan` SecretRef target family，請更新該 test 中的 `classifyTargetClass`。此 test 會刻意在未分類的 target ids 上失敗，讓新 classes 不會被靜默略過。

## 相關

- [Testing live](/zh-TW/help/testing-live)
- [Testing updates and plugins](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
