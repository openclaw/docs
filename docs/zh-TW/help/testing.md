---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型／供應商錯誤新增迴歸測試
    - 除錯閘道與代理程式行為
summary: 測試套件：單元/e2e/live 套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-07-06T21:50:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7ecac8598f07ecc41f150e0112d6e9d5eb9941494dd66df308dc1ec0a5fc364a
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 套件（單元/整合、端對端、實機）以及 Docker
執行器。本頁說明每個套件涵蓋的範圍、特定工作流程應執行哪個指令、實機測試如何探索憑證，以及如何為真實世界的供應商/模型錯誤新增迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、實機傳輸通道）**另有文件說明：

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) - 架構、指令介面、情境撰寫。
- [矩陣 QA](/zh-TW/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的參考資料。
- [成熟度評分卡](/zh-TW/maturity/scorecard) - 發行 QA 證據如何支援穩定性與 LTS 決策。
- [QA 頻道](/zh-TW/channels/qa-channel) - 由儲存庫支援情境使用的合成傳輸外掛。

本頁涵蓋一般測試套件與 Docker/Parallels 執行器。下方的 [QA 專用執行器](#qa-specific-runners) 列出具體的 `qa` 呼叫，並回指上方參考資料。
</Note>

## 快速開始

大多數時候：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足機器上較快的本機完整套件執行：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案也會路由外掛/頻道路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 迭代單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你觸及測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- 端對端套件：`pnpm test:e2e`

## 測試暫存目錄

針對測試擁有的暫存目錄，請使用 `test/helpers/temp-dir.ts` 中的共用輔助工具，
讓所有權明確，且清理維持在測試生命週期內：

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` 有意不公開手動清理方法 -
Vitest 會在每個測試之後擁有清理流程。較舊的低階輔助工具
（`makeTempDir`、`cleanupTempDirs`、`createTempDirTracker`）仍然存在，
供尚未遷移的測試使用；避免新增使用它們，也避免新增裸露的
`fs.mkdtemp*` 呼叫，除非測試明確是在驗證原始暫存目錄行為。當確實需要裸露暫存目錄時，
請加入可稽核的允許註解並附上原因：

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` 會回報新增差異行中的新裸露暫存目錄建立，
以及新的手動共用輔助工具用法，而不會阻擋既有清理風格。它遵循與
`scripts/changed-lanes.mjs` 相同的測試路徑分類，並略過共用輔助工具實作本身。
`check:changed` 會針對變更的測試路徑執行此報告，作為僅警告的 CI 訊號
（GitHub 警告註解，不是失敗）。

## 實機與 Docker/Parallels 工作流程

偵錯真實供應商/模型時（需要真實憑證）：

- 實機套件（模型 + 閘道工具/影像探測）：`pnpm test:live`
- 安靜地指定一個實機檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：派送 `OpenClaw Performance`，設定
  `live_openai_candidate=true` 以進行真實 `openai/gpt-5.5` agent 回合，或設定
  `deep_profile=true` 以取得 Kova CPU/heap/trace 成品。每日排程執行會在
  `CLAWGRIT_REPORTS_TOKEN` 已設定時，將 mock-provider、deep-profile 與 GPT 5.5
  通道成品發布到 `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的
  閘道啟動、記憶體、外掛壓力、重複 fake-model hello-loop，以及命令列介面啟動數字。
- Docker 實機模型掃描：`pnpm test:docker:live-models`
  - 每個選取模型都會執行一個文字回合，加上一個小型類檔案讀取探測。
    中繼資料宣告支援 `image` 輸入的模型，也會執行一個小型影像回合。
    隔離供應商失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋：每日 `OpenClaw Scheduled Live And E2E Checks` 與手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true`
    呼叫可重用的實機/端對端工作流程，其中包含依供應商分片的 Docker 實機模型矩陣作業。
  - 若要聚焦 CI 重新執行，請派送 `OpenClaw Live And E2E Checks (Reusable)`，
    並設定 `include_live_suites: true` 與 `live_models_only: true`。
  - 將新的高訊號供應商 secret 加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的
    排程/發行呼叫端。
- 原生 Codex bound-chat 煙霧測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker 實機通道，使用 `/codex bind`
    綁定合成 Slack DM，操作 `/codex fast` 與 `/codex permissions`，
    接著驗證一般回覆與影像附件會透過原生外掛繫結路由，而非 ACP。
- Codex app-server harness 煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過外掛擁有的 Codex app-server harness 執行閘道 agent 回合，
    驗證 `/codex status` 與 `/codex models`，且預設操作影像、排程 MCP、
    sub-agent 與 Guardian 探測。隔離其他失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。
    若要聚焦 sub-agent 檢查，請停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在
    sub-agent 探測後結束。
- Codex 隨選安裝煙霧測試：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安裝打包後的 OpenClaw tarball，執行 OpenAI API-key
    onboard，並驗證 Codex 外掛與 `@openai/codex` 相依項已按需下載到受管理的 npm
    專案根目錄。
- 實機外掛工具相依項煙霧測試：`pnpm test:docker:live-plugin-tool`
  - 打包一個含有真實 `slugify` 相依項的 fixture 外掛，透過 `npm-pack:`
    安裝它，驗證受管理 npm 專案根目錄下的相依項，接著要求實機 OpenAI 模型呼叫外掛工具並
    回傳隱藏 slug。
- Crestodian rescue 指令煙霧測試：`pnpm test:live:crestodian-rescue-channel`
  - 針對訊息頻道 rescue 指令介面的選用雙重保險檢查。操作
    `/crestodian status`、排入持久模型變更、回覆 `/crestodian yes`，
    並驗證稽核/設定寫入路徑。
- Crestodian planner Docker 煙霧測試：`pnpm test:docker:crestodian-planner`
  - 在無設定容器中執行 Crestodian，並在 `PATH` 上提供假的 Claude 命令列介面，
    驗證模糊 planner fallback 會轉譯成已稽核的 typed config 寫入。
- Crestodian first-run Docker 煙霧測試：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，驗證現代 onboard Crestodian 進入點，
    套用 setup/model/agent/Discord 外掛 + SecretRef 寫入，驗證設定，
    並驗證稽核項目。相同的 Ring 0 setup 路徑也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆蓋。
- Moonshot/Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方描述的 allowlist 環境變數縮小實機測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 真實感時，這些指令會放在主要測試套件旁邊。

CI 會在專用工作流程中執行 QA Lab。Agentic parity 巢狀位於
`QA-Lab - All Lanes` 與發行驗證之下，而不是獨立的 PR 工作流程。
廣泛驗證應使用 `Full Release Validation`，並設定
`rerun_group=qa-parity` 或 release-checks QA 群組。Stable/default 發行檢查會將詳盡的
實機/Docker soak 保留在 `run_release_soak=true` 之後；`full` profile 會強制啟用 soak。
`QA-Lab - All Lanes` 每晚在 `main` 執行，也可從手動派送執行，並將 mock parity 通道、
實機 Matrix 通道、Convex 管理的實機 Telegram 通道，以及 Convex 管理的實機 Discord 通道作為
平行作業。排程 QA 與發行檢查會明確傳遞 Matrix `--profile fast`，
而 Matrix 命令列介面與手動工作流程輸入的預設值仍為 `all`；手動派送可將
`all` 分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli`
作業。`OpenClaw Release Checks` 會在發行核准前執行 parity 加上快速 Matrix 與 Telegram
通道，並使用 `mock-openai/gpt-5.5` 進行發行傳輸檢查，讓它們保持決定性並避開一般的
供應商外掛啟動。這些實機傳輸閘道會停用記憶體搜尋；記憶體行為仍由 QA parity
套件覆蓋。

完整發行實機媒體分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 與 `ffprobe`。Docker 實機模型/後端分片使用每個選取 commit
只建置一次的共用 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，接著以
`OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由儲存庫支援的 QA 情境。
  - 針對所選情境集合寫入最上層的 `qa-evidence.json`、`qa-suite-summary.json` 和
    `qa-suite-report.md` 成品，包括混合流程、Vitest 和 Playwright 情境選項。
  - 由 `pnpm openclaw qa run --qa-profile <profile>` 分派時，會在同一個 `qa-evidence.json` 中嵌入
    所選分類設定檔的記分卡。`smoke-ci` 會寫入精簡證據（`evidenceMode: "slim"`，沒有逐項
    `execution`）。`release` 涵蓋精選的發布就緒切片；`all`
    會選取每個作用中的成熟度類別，並在需要完整記分卡成品時，針對明確的 QA Profile
    Evidence 工作流程分派。
  - 預設會使用隔離的
    閘道 worker 平行執行多個所選情境。`qa-channel` 預設並行數為 4（受限於
    所選情境數量）。使用 `--concurrency <count>` 調整 worker
    數量，或使用 `--concurrency 1` 進入較舊的序列通道。
  - 任何情境失敗時會以非零狀態結束。使用 `--allow-failures` 取得
    不帶失敗結束碼的成品。
  - 支援提供者模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動以本機 AIMock 為後端的提供者伺服器，用於實驗性
    fixture 和協定模擬覆蓋範圍，而不會取代具情境感知的
    `mock-openai` 通道。
- `pnpm openclaw qa coverage --match <query>`
  - 搜尋情境 ID、標題、表面、覆蓋範圍 ID、文件參照、程式碼
    參照、外掛和提供者需求，然後列印相符的套件
    目標。
  - 當你知道受影響的行為或檔案
    路徑，但不知道最小情境時，請在 QA Lab 執行前使用這個指令。僅供建議 - 仍需依據正在
    變更的行為選擇 mock、live、Multipass、Matrix 或傳輸證據。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink 外掛
    挑戰套件。安裝外部 Kitchen Sink 套件，驗證外掛 SDK
    表面清單，探測 `/healthz` 和 `/readyz`，記錄閘道
    CPU/RSS 證據，執行一次即時 OpenAI 回合，並檢查對抗式
    診斷。需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在
    已注水的 Testbox 工作階段中，若存在 `openclaw-testbox-env` helper，會自動載入 Testbox 即時驗證
    設定檔。
- `pnpm test:gateway:cpu-scenarios`
  - 執行閘道啟動基準測試，加上一小組 mock QA Lab 情境包
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/` 下寫入合併的 CPU 觀察
    摘要。
  - 預設只標記持續高 CPU 觀察（`--cpu-core-warn`，
    預設 `0.9`；`--hot-wall-warn-ms`，預設 `30000`），因此短暫啟動
    突增會記錄為指標，而不會看起來像持續數分鐘的
    閘道滿載迴歸。
  - 針對已建置的 `dist` 成品執行；當 checkout
    尚未有新鮮的執行階段輸出時，請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在可拋棄的 Multipass Linux VM 內執行相同 QA 套件，並保留
    與 `qa suite` 相同的情境選擇和提供者/模型旗標。
  - 即時執行會轉送對 guest 實用的 QA 驗證輸入：
    基於環境變數的提供者金鑰、QA 即時提供者設定路徑，以及
    存在時的 `CODEX_HOME`。
  - 輸出目錄必須保持在儲存庫根目錄下，guest 才能透過掛載的工作區
    寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告與摘要，以及 Multipass 記錄。
- `pnpm qa:lab:up`
  - 啟動以 Docker 為後端的 QA 站台，用於操作員風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在
    Docker 中全域安裝，執行非互動式 OpenAI API 金鑰 onboarding，預設設定
    Telegram，驗證封裝的外掛執行階段能在無啟動相依性修復下載入，
    執行 doctor，並針對模擬的 OpenAI 端點執行一次本機 agent 回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的封裝安裝
    通道。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式執行階段上下文
    transcript 執行決定性的已建置應用 Docker smoke。驗證隱藏的 OpenClaw 執行階段上下文會以
    非顯示自訂訊息持續存在，而不是洩漏到可見的使用者
    回合中，接著植入受影響的損壞工作階段 JSONL，並驗證
    `openclaw doctor --fix` 會將其重寫到作用中分支並保留備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 套件候選版本，執行已安裝套件
    onboarding，透過已安裝的命令列介面設定 Telegram，然後重用
    即時 Telegram QA 通道，並以該已安裝套件作為 SUT
    閘道。
  - wrapper 只會從 checkout 掛載 `qa-lab` harness 原始碼；
    已安裝套件擁有 `dist`、`openclaw/plugin-sdk` 和 bundled
    外掛執行階段，因此此通道不會把目前 checkout 的外掛混入
    受測套件。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而不是
    從 registry 安裝。
  - 預設會在 `qa-evidence.json` 中以
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` 發出重複 RTT 計時。覆寫
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 可調整執行。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` 接受以逗號分隔的
    Telegram QA 檢查 ID 清單進行取樣；未設定時，預設支援 RTT 的
    檢查為 `telegram-mentioned-message-reply`。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram 環境變數憑證或 Convex 憑證來源。針對 CI/發布自動化，設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色祕密。若
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色祕密存在於
    CI，Docker wrapper 會自動選擇 Convex。
  - wrapper 會在 Docker 建置/安裝工作前，在主機上驗證 Telegram 或 Convex 憑證環境變數。只有在
    刻意偵錯前置憑證設定時，才設定
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此通道覆寫
    共用的 `OPENCLAW_QA_CREDENTIAL_ROLE`。選擇 Convex
    憑證且未設定角色時，wrapper 會在 CI 中使用 `ci`，
    在 CI 外使用 `maintainer`。
  - GitHub Actions 將此通道公開為手動維護者工作流程
    `NPM Telegram Beta E2E`。它不會在合併時執行。此工作流程使用
    `qa-live-shared` 環境和 Convex CI 憑證租約。
- GitHub Actions 也公開 `Package Acceptance`，用於針對一個候選套件執行旁路產品證據。
  它接受 Git ref、已發布的 npm spec、
  HTTPS tarball URL 加上 SHA-256、可信 URL 政策，或來自另一個執行的 tarball 成品
  （`source=ref|npm|url|trusted-url|artifact`），上傳
  正規化的 `openclaw-current.tgz` 作為 `package-under-test`，然後使用 `smoke`、`package`、`product`、`full`
  或 `custom` 通道設定檔執行既有的 Docker E2E 排程器。設定 `telegram_mode=mock-openai` 或
  `live-frontier`，即可針對相同的
  `package-under-test` 成品執行 Telegram QA 工作流程。
  - 最新 beta 產品證據：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精確 tarball URL 證據需要 digest，並使用公開 URL 安全政策：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 企業/私人 tarball mirror 使用明確的可信來源政策：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` 會從可信工作流程 ref 讀取 `.github/package-trusted-sources.json`，且不接受 URL 憑證或 workflow-input 私有網路繞過。若具名政策宣告 bearer 驗證，請設定固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret。

- 成品證據會從另一個 Actions 執行下載 tarball 成品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw 建置，啟動已設定 OpenAI 的
    閘道，然後透過設定編輯啟用 bundled channel/plugins。
  - 驗證 setup discovery 會讓未設定的可下載外掛
    保持缺席，第一次設定後的 doctor 修復會明確安裝每個缺少的
    可下載外掛，第二次重啟則不會執行
    隱藏相依性修復。
  - 也會安裝已知較舊的 npm baseline，在
    執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證
    候選版本的更新後 doctor 會清除 legacy 外掛相依性殘留物，
    且不需要 harness 端 postinstall 修復。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生封裝安裝更新 smoke。
    每個所選平台會先安裝請求的 baseline 套件，
    然後在同一個 guest 中執行已安裝的 `openclaw update` 命令，並
    驗證已安裝版本、更新狀態、閘道就緒狀態，以及
    一次本機 agent 回合。
  - 在針對單一 guest 反覆調整時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。
    使用 `--json` 取得摘要成品
    路徑和逐通道狀態。
  - OpenAI 通道預設使用 `openai/gpt-5.5` 作為即時 agent 回合證據。
    傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL`，以驗證另一個 OpenAI 模型。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels 傳輸停滯
    消耗剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 此腳本會在
    `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀通道記錄。在假設外層
    wrapper 卡住前，請先檢查 `windows-update.log`、
    `macos-update.log` 或 `linux-update.log`。
  - Windows 更新在冷 guest 上可能會花 10 到 15 分鐘處理更新後 doctor 和
    套件更新工作；只要巢狀 npm debug log 持續前進，這仍然是健康狀態。
  - 不要將這個聚合 wrapper 與個別 Parallels
    macOS、Windows 或 Linux smoke 通道平行執行。它們共用 VM 狀態，可能在
    snapshot 還原、套件服務或 guest 閘道狀態上
    發生衝突。
  - 更新後證據會執行一般 bundled 外掛表面，因為
    speech、image generation 和 media
    understanding 等 capability facade 會透過 bundled runtime API 載入，即使 agent
    回合本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接的協定冒煙
    測試。
- `pnpm openclaw qa matrix`
  - 針對一次性的 Docker 支援 Tuwunel homeserver 執行 Matrix 即時 QA lane。
    僅限原始碼 checkout - 封裝安裝不會隨附
    `qa-lab`。
  - 完整命令列介面、profile/scenario catalog、env vars 與成品版面配置：
    [Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用 env 中的 driver 與 SUT bot token，針對真實私人群組執行 Telegram
    即時 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 與
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字形式的
    Telegram chat id。
  - 支援 `--credential-source convex` 以使用共享的 pooled credentials。
    預設使用 env mode，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    以選擇使用 pooled leases。
  - 預設涵蓋 canary、mention gating、command addressing、`/status`、
    bot-to-bot mentioned replies，以及 core native command replies。
    `mock-openai` 預設也涵蓋確定性的 reply-chain 與
    Telegram final-message streaming regressions。使用 `--list-scenarios`
    查看選用 probe，例如 `session_status`。
  - 任何 scenario 失敗時會以非零狀態結束。使用 `--allow-failures`
    可在沒有失敗 exit code 的情況下產生成品。
  - 需要同一個私人群組中的兩個不同 bot，且 SUT bot 必須公開 Telegram
    username。
  - 為了穩定觀察 bot-to-bot，請在 `@BotFather` 中為兩個 bot 啟用
    Bot-to-Bot Communication Mode，並確保 driver bot 可以觀察群組 bot 流量。
  - 會在 `.artifacts/qa-e2e/...` 底下寫入 Telegram QA report、summary
    與 `qa-evidence.json`。回覆類 scenarios 會包含從 driver send request
    到觀察到 SUT reply 的 RTT。

`Mantis Telegram Live` 是此 lane 的 PR-evidence 包裝器。它會使用 Convex-leased
Telegram credentials 執行 candidate ref，在 Crabbox desktop browser 中呈現已遮蔽的
QA report/evidence bundle，錄製 MP4 evidence，產生 motion-trimmed GIF，上傳
artifact bundle，並在設定 `pr_number` 時透過 Mantis GitHub App 發布 inline PR
evidence。維護者可以從 Actions UI 透過 `Mantis Scenario`（`scenario_id:
telegram-live`）啟動，或直接從 pull request comment 啟動：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用於 PR visual proof 的 agentic native Telegram Desktop
before/after 包裝器。可從 Actions UI 使用自由格式 `instructions`、透過
`Mantis Scenario`（`scenario_id:
telegram-desktop-proof`），或從 PR comment 啟動：

```text
@openclaw-mantis telegram desktop proof
```

Mantis agent 會讀取 PR，判斷哪些 Telegram-visible 行為可證明變更，對 baseline 與
candidate refs 執行 real-user Crabbox Telegram Desktop proof lane，反覆調整直到 native GIFs
可用，寫入成對的 `motionPreview` manifest，並在設定 `pr_number` 時透過
Mantis GitHub App 發布相同的 2 欄 GIF table。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重用 Crabbox Linux desktop，安裝 native Telegram
    Desktop，使用租用的 Telegram SUT bot token 設定 OpenClaw，
    啟動閘道，並從可見的 VNC desktop 錄製 screenshot/MP4 evidence。
  - 預設為 `--credential-source convex`，因此 workflows 只需要 Convex
    broker secret。使用 `--credential-source env` 時，需搭配與
    `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 變數。
  - Telegram Desktop 仍需要使用者 login/profile。bot token
    只會設定 OpenClaw。針對 base64 `.tgz` profile archive，使用
    `--telegram-profile-archive-env <name>`；或使用 `--keep-lease` 並透過
    VNC 手動登入一次。
  - 會在 output directory 底下寫入 `mantis-telegram-desktop-builder-report.md`、
    `mantis-telegram-desktop-builder-summary.json`、
    `telegram-desktop-builder.png` 與 `telegram-desktop-builder.mp4`。

即時 transport lanes 共用一個標準 contract，讓新的 transports 不會漂移；每個 lane 的 coverage matrix 位於
[QA overview - Live transport coverage](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。
`qa-channel` 是廣泛的 synthetic suite，不屬於該 matrix。

### 透過 Convex 共享 Telegram credentials (v1)

當即時 transport QA 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）
時，QA lab 會從 Convex-backed pool 取得 exclusive lease，在 lane 執行期間對該 lease 進行心跳偵測，
並在 shutdown 時釋放 lease。此 section name 早於 Discord、Slack 與
WhatsApp 支援；lease contract 會跨 kinds 共享。

參考 Convex project scaffold：`qa/convex-credential-broker/`

必要 env vars：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- selected role 的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- Credential role selection：
  - 命令列介面：`--credential-role maintainer|ci`
  - Env default：`OPENCLAW_QA_CREDENTIAL_ROLE`（CI 中預設為 `ci`，否則為 `maintainer`）

選用 env vars：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許 local-only development 使用 loopback `http://` Convex URLs。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

Maintainer admin commands（pool add/remove/list）特別需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

維護者用的命令列介面 helpers：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在 live runs 前使用 `doctor` 檢查 Convex site URL、broker secrets、
endpoint prefix、HTTP timeout，以及 admin/list reachability，且不列印
secret values。在 scripts 與 CI utilities 中使用 `--json` 取得 machine-readable output。

預設 endpoint contract（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）。
Requests 會使用 `Authorization: Bearer <role secret>` header 進行驗證；
下方 bodies 省略該 header：

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
- `POST /admin/add`（僅 maintainer secret）
  - Request：`{ kind, actorId, payload, note?, status? }`
  - Success：`{ status: "ok", credential }`
- `POST /admin/remove`（僅 maintainer secret）
  - Request：`{ credentialId, actorId }`
  - Success：`{ status: "ok", changed, credential }`
  - Active lease guard：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅 maintainer secret）
  - Request：`{ kind?, status?, includePayload?, limit? }`
  - Success：`{ status: "ok", credentials, count }`

Telegram kind 的 payload shape：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字形式的 Telegram chat id string。
- `admin/add` 會針對 `kind: "telegram"` 驗證此 shape，並拒絕 malformed payloads。

Telegram real-user kind 的 payload shape：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 與 `telegramApiId` 必須是 numeric strings。
- `tdlibArchiveSha256` 與 `desktopTdataArchiveSha256` 必須是 SHA-256 hex strings。
- `kind: "telegram-user"` 保留給 Mantis Telegram Desktop proof workflow。Generic QA Lab lanes 不得取得它。

Broker-validated multi-channel payloads：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes 也可以從 pool 租用，但 Slack payload validation
目前位於 Slack QA runner，而不是 broker。Slack rows 請使用
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 將 channel 加入 QA

新 channel adapters 的 architecture 與 scenario-helper names 位於
[QA overview - Adding a channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。
最低門檻：在 shared `qa-lab` host
seam 上實作 transport runner，為 shared scenarios 新增 `adapterFactory`，在
外掛 manifest 中宣告 `qaRunners`，掛載為 `openclaw qa <runner>`，並在
`qa/scenarios/` 底下撰寫 scenarios。

## Test suites（什麼在哪裡執行）

請把 suites 想成「逐步提高真實度」（也逐步提高 flakiness/cost）。

### Unit / integration（預設）

- Command：`pnpm test`
- Config：untargeted runs 使用 `vitest.full-*.config.ts` shard set，並且可能
  將 multi-project shards 展開為 per-project configs 以進行 parallel
  scheduling
- Files：位於 `src/**/*.test.ts`、`packages/**/*.test.ts` 與
  `test/**/*.test.ts` 底下的 core/unit inventories；UI unit tests 在專用的
  `unit-ui` shard 中執行
- Scope：
  - Pure unit tests
  - In-process integration tests（gateway auth、routing、tooling、parsing、config）
  - 已知 bugs 的 deterministic regressions
- Expectations：
  - 在 CI 中執行
  - 不需要真實 keys
  - 應快速且穩定
  - Resolver 與 public-surface loader tests 必須使用產生的 tiny plugin fixtures
    證明廣泛的 `api.js` 與
    `runtime-api.js` fallback behavior，
    而不是使用真實 bundled plugin source APIs。真實 plugin API loads 屬於
    plugin-owned contract/integration suites。

Native dependency policy：

- Default test installs 會略過選用的 native Discord opus builds。Discord
  voice 使用 bundled `libopus-wasm`，且 `@discordjs/opus` 會在
  `allowBuilds` 中保持停用，因此 local tests 與 Testbox lanes 不會編譯 native
  addon。
- 請在 `libopus-wasm` benchmark repo 中比較 native opus performance，而不是
  在預設 OpenClaw install/test loops 中比較。不要在預設 `allowBuilds` 中將
  `@discordjs/opus` 設為 `true`；那會讓不相關的 install/test
  loops 編譯 native code。

<AccordionGroup>
  <Accordion title="Projects、shards 與 scoped lanes">

    - 未指定目標的 `pnpm test` 會執行十三個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-tooling`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這會降低負載機器上的峰值 RSS，並避免 auto-reply/外掛工作讓不相關的套件餓死。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片 watch 迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先將明確的檔案/目錄目標路由到範圍化 lane，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免付出完整根專案啟動成本。
    - `pnpm test:changed` 預設會將變更的 git 路徑展開成低成本的範圍化 lane：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖依賴項。設定/安裝/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的標準智慧本機檢查門檻。它會將 diff 分類為 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然後執行對應的 typecheck、lint 與 guard 命令。它不會執行 Vitest 測試；如需測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅 release metadata 的版本升級會執行目標式 version/config/root-dependency 檢查，並包含一個 guard，拒絕頂層 version 欄位以外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth scripts 的 shell 語法，以及 live Docker scheduler dry-run。只有在 diff 限定於 `scripts["test:docker:live-*"]` 時才會包含 `package.json` 變更；dependency、export、version 和其他 package-surface 編輯仍使用更廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 以及類似純工具區域的輕量匯入單元測試，會路由到 `unit-fast` lane，該 lane 會略過 `test/setup-openclaw-runtime.ts`；有狀態/重度 runtime 檔案則留在既有 lane。
    - 選定的 `plugin-sdk` 和 `commands` helper source files 也會將 changed-mode 執行對應到這些輕量 lane 中明確的同層測試，因此 helper 編輯可避免為該目錄重新執行完整重型套件。
    - `auto-reply` 針對頂層 core helpers、頂層 `reply.*` integration tests，以及 `src/auto-reply/reply/**` 子樹有專用 bucket。CI 進一步將 reply 子樹拆成 agent-runner、dispatch，以及 commands/state-routing 分片，避免單一匯入繁重的 bucket 擁有完整的 節點 tail。
    - 一般 PR/main CI 會有意略過 bundled 外掛批次 sweep 和僅 release 使用的 `agentic-plugins` 分片。Full Release Validation 會為 release candidates 派送獨立的 `Plugin Prerelease` 子工作流程，以執行這些外掛繁重套件。

  </Accordion>

  <Accordion title="嵌入式 runner 覆蓋範圍">

    - 當你變更 message-tool discovery inputs 或壓縮 runtime
      context 時，請保留兩個層級的覆蓋範圍。
    - 為純 routing 和 normalization
      boundaries 新增聚焦的 helper regression。
    - 保持嵌入式 runner integration suites 健康：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證 scoped ids 和壓縮行為仍會流經真正的
      `run.ts` / `compact.ts` 路徑；僅 helper 的測試
      無法充分取代這些 integration paths。

  </Accordion>

  <Accordion title="Vitest pool 和 isolation 預設值">

    - 基礎 Vitest config 預設為 `threads`。
    - 共用 Vitest config 固定 `isolate: false`，並在
      root projects、e2e 和 live configs 中使用
      non-isolated runner。
    - root UI lane 保留其 `jsdom` setup 和 optimizer，但也在
      共用 non-isolated runner 上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest config 繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 節點
      程序加入 `--no-maglev`，以降低大型本機執行期間的 V8 編譯 churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與標準 V8
      行為比較。
    - `scripts/run-vitest.mjs` 會在明確的非 watch Vitest 執行
      連續 5 分鐘沒有 stdout 或 stderr 輸出後終止。設定
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` 可停用 watchdog，以進行
      有意靜默的調查。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構 lane。
    - pre-commit hook 只做格式化。它會重新 stage 格式化後的檔案，
      並且不執行 lint、typecheck 或測試。
    - 在交付或 push 前，當你需要智慧本機檢查門檻時，
      請明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本範圍化 lane 路由。只有在 agent
      判定 harness、config、package 或 contract 編輯確實需要
      更廣泛的 Vitest 覆蓋範圍時，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的 routing
      行為，只是 worker 上限較高。
    - 本機 worker auto-scaling 有意保持保守，並會在 host load average 已偏高時
      退避，因此多個並行
      Vitest 執行預設造成的影響較小。
    - 基礎 Vitest config 會將 projects/config files 標記為
      `forceRerunTriggers`，因此 test
      wiring 變更時，changed-mode reruns 仍保持正確。
    - config 會在支援的 hosts 上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      可為直接 profiling 指定一個明確的 cache 位置。

  </Accordion>

  <Accordion title="效能偵錯">

    - `pnpm test:perf:imports` 會啟用 Vitest import-duration reporting，加上
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling view 限定到
      自 `origin/main` 以來變更的檔案。
    - Shard timing data 會寫入 `.artifacts/vitest-shard-timings.json`。
      Whole-config runs 使用 config path 作為 key；include-pattern CI
      shards 會附加 shard name，以便可分別追蹤 filtered shards。
    - 當某個 hot test 仍將大部分時間花在 startup imports 時，
      請將重型 dependencies 放在窄範圍本機 `*.runtime.ts` seam 後方，並
      直接 mock 該 seam，而不是 deep-importing runtime helpers
      只為了將它們傳入 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會比較 routed
      `test:changed` 與該已提交 diff 的原生 root-project path，
      並列印 wall time 加上 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過將 changed file list 路由到
      `scripts/test-projects.mjs` 和 root Vitest config，
      對目前 dirty tree 進行 benchmark。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite startup 和 transform overhead 寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用 file parallelism 的情況下，
      為 unit suite 寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（閘道）

- 命令：`pnpm test:stability:gateway`
- 設定：`test/vitest/vitest.gateway.config.ts`、`test/vitest/vitest.logging.config.ts` 和 `test/vitest/vitest.infra.config.ts`，每個都強制為一個 worker
- 範圍：
  - 啟動一個真正的 loopback 閘道，預設啟用 diagnostics
  - 透過 diagnostic event path 驅動合成的 gateway message、memory 和 large-payload churn
  - 透過閘道 WS RPC 查詢 `diagnostics.stability`
  - 涵蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 保持 bounded、合成 RSS samples 保持在 pressure budget 以下，且 per-session queue depths 會 drain 回零
- 期望：
  - CI-safe 且 keyless
  - 穩定性 regression follow-up 的窄 lane，不是完整閘道套件的替代品

### E2E（repo 彙總）

- 命令：`pnpm test:e2e`
- 範圍：
  - 執行 gateway smoke E2E lane
  - 執行 mocked Control UI browser E2E lane
- 期望：
  - CI-safe 且 keyless
  - 需要已安裝 Playwright Chromium

### E2E（gateway smoke）

- 命令：`pnpm test:e2e:gateway`
- 設定：`test/vitest/vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled-plugin E2E tests
- Runtime 預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用 adaptive workers（CI：最多 2，本機：預設 1）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 用於強制 worker count（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用於重新啟用 verbose console output。
- 範圍：
  - Multi-instance gateway end-to-end behavior
  - WebSocket/HTTP surfaces、節點 pairing，以及較重的 networking
- 期望：
  - 在 CI 中執行（當 pipeline 啟用時）
  - 不需要真實金鑰
  - 比 unit tests 有更多 moving parts（可能較慢）

### E2E（Control UI mocked browser）

- 命令：`pnpm test:ui:e2e`
- 設定：`test/vitest/vitest.ui-e2e.config.ts`
- 檔案：`ui/src/**/*.e2e.test.ts`
- 範圍：
  - 啟動 Vite Control UI
  - 透過 Playwright 驅動真正的 Chromium page
  - 以 deterministic in-browser mocks 取代閘道 WebSocket
- 期望：
  - 作為 `pnpm test:e2e` 的一部分在 CI 中執行
  - 不需要真實閘道、agents 或 provider keys
  - 必須存在 browser dependency（`pnpm --dir ui exec playwright install chromium`）

### E2E：OpenShell backend smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 重用 active local OpenShell gateway
  - 從 temporary local Dockerfile 建立 sandbox
  - 透過真正的 `sandbox ssh-config` + SSH exec 練習 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證 remote-canonical filesystem behavior
- 期望：
  - 僅 opt-in；不是預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` 命令列介面以及可運作的 Docker daemon
  - 需要 active local OpenShell gateway 及其 config source
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀 test sandbox
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 用於在手動執行更廣泛 e2e suite 時啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用於指向非預設命令列介面 binary 或 wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` 用於將 registered gateway config 暴露給 isolated test
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` 用於覆寫 host policy fixture 使用的 Docker gateway IP

### Live（真實 providers + 真實 models）

- 命令：`pnpm test:live`
- 設定：`test/vitest/vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled-plugin 實機測試
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個提供者/模型 _今天_ 是否真的能用真實憑證運作？」
  - 捕捉提供者格式變更、工具呼叫怪癖、驗證問題，以及速率限制行為
- 預期：
  - 設計上並非 CI 穩定（真實網路、真實提供者政策、配額、中斷）
  - 會花錢 / 使用速率限制
  - 偏好執行縮小範圍的子集，而不是「全部」
- 實機執行會使用已匯出的 API 金鑰和已暫存的驗證設定檔。
- 預設情況下，實機執行仍會隔離 `HOME`，並將設定/驗證材料複製到暫時測試家目錄，因此單元 fixture 無法變更你真正的 `~/.openclaw`。
- 只有在你有意需要實機測試使用真正的家目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 預設為較安靜的模式：它保留 `[live] ...` 進度輸出，並靜音閘道啟動記錄/Bonjour 雜訊。如果你想恢復完整啟動記錄，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依提供者而定）：以逗號/分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 進行單次實機覆寫；測試會在速率限制回應時重試。
- 進度/心跳偵測輸出：
  - 實機套件會將進度列輸出到 stderr，因此即使 Vitest 主控台擷取很安靜，長時間提供者呼叫仍會明顯處於作用中。
  - `test/vitest/vitest.live.config.ts` 會停用 Vitest 主控台攔截，因此提供者/閘道進度列會在實機執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整直接模型心跳偵測。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整閘道/探測心跳偵測。

## 我應該執行哪個套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更很多，另執行 `pnpm test:coverage`）
- 觸及閘道網路 / WS 協定 / 配對：加上 `pnpm test:e2e`
- 除錯「我的 bot 掛了」/ 提供者特定失敗 / 工具呼叫：執行縮小範圍的 `pnpm test:live`

## 實機（觸及網路）測試

如需實機模型矩陣、命令列介面後端 smoke、ACP smoke、Codex app-server
harness，以及所有媒體提供者實機測試（Deepgram、BytePlus、ComfyUI、
image、music、video、media harness）加上實機執行的憑證處理

- 請參閱[測試實機套件](/zh-TW/help/testing-live)。如需專用更新與
  外掛驗證檢查清單，請參閱
  [測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

## Docker runner（選用的「可在 Linux 運作」檢查）

這些 Docker runner 分成兩類：

- 實機模型 runner：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像內執行相符的 profile-key 實機檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載你的本機設定目錄、工作區，以及選用的設定檔 env 檔案。相符的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 實機 runner 會在需要時保留自己的實用上限：
  `test:docker:live-models` 預設為策展過的受支援高訊號集合，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。當你明確想要較小上限或較大掃描時，請設定 `OPENCLAW_LIVE_MAX_MODELS`
  或閘道環境變數。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置一次實機 Docker 映像，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包一次為 npm tarball，接著建置/重用兩個 `scripts/e2e/Dockerfile` 映像。裸映像只是用於安裝/更新/外掛相依性 lane 的 節點/Git runner；這些 lane 會掛載預建的 tarball。功能映像會將相同 tarball 安裝到 `/app`，用於已建置應用程式功能 lane。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行所選計畫。彙總使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序 slot，而資源上限會避免繁重實機、npm-install，以及多服務 lane 同時全部啟動。如果單一 lane 比作用中上限更重，排程器仍可在池為空時啟動它，然後讓它獨自執行，直到容量再次可用。預設為 10 個 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`（以及其他 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 覆寫）。runner 預設會執行 Docker preflight、移除陳舊的 OpenClaw E2E 容器、每 30 秒列印狀態、將成功 lane 的時序儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行時使用這些時序優先啟動較長的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不建置或執行 Docker 的情況下列印加權 lane manifest，或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lane、套件/映像需求，以及憑證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生套件 gate，用來確認「這個可安裝 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url`、`source=trusted-url` 或 `source=artifact` 解析一個候選套件，將其上傳為 `package-under-test`，然後針對該精確 tarball 執行可重用的 Docker E2E lane，而不是重新打包所選 ref。設定檔按廣度排序：`smoke`、`package`、`product` 和 `full`（另有 `custom` 用於明確 lane 清單）。如需套件/更新/外掛合約、已發布升級 survivor 矩陣、發行預設值，以及失敗分流，請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。
- 建置與發行檢查會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。此 guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態已建置圖形，並在該預派發 bootstrap 圖形於命令派發前靜態匯入任何外部套件（Commander、prompt UI、undici、logging，以及類似啟動繁重相依性都算）時失敗；它也會將 bundled 閘道執行 chunk 限制為 70 KB，並拒絕該 chunk 對已知冷閘道路徑（`control-ui-assets`、`diagnostic-stability-bundle`、`onboard-helpers`、`process-respawn`、`restart-sentinel`、`server-close`、`server-reload-handlers`）的靜態匯入。`scripts/release-check.ts` 會另外使用 `--help`、`onboard --help`、`doctor --help`、`status --json --timeout 1`、`config schema`，以及 `models list --provider openai` 對打包後的命令列介面進行 smoke 測試。
- Package Acceptance 舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點以前，harness 只容忍已出貨套件的中繼資料缺口：省略 private QA inventory 項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少持久化的 `update.channel`、舊版外掛安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。`2026.4.25` 之後的套件，這些路徑都是嚴格失敗。
- 容器 smoke runner：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`，以及 `test:docker:config-reload` 會啟動一個或多個真實容器，並驗證較高層級的整合路徑。
- 透過 `scripts/lib/openclaw-e2e-instance.sh` 安裝打包後 OpenClaw tarball 的 Docker/Bash E2E lane，會將 `npm install` 限制在 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（預設 `600s`；設定 `0` 可停用 wrapper 以進行除錯）。

實機模型 Docker runner 也只會 bind-mount 所需的命令列介面驗證家目錄
（或在執行未縮小範圍時掛載所有受支援者），然後在執行前將它們複製到
容器家目錄，讓外部命令列介面 OAuth 可以重新整理 token，
而不會變更主機驗證儲存區：

- 直接模型：`pnpm test:docker:live-models`（script：`scripts/test-live-models-docker.sh`）
- ACP bind smoke：`pnpm test:docker:live-acp-bind`（script：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 提供嚴格的 Droid/OpenCode 覆蓋）
- 命令列介面後端 smoke：`pnpm test:docker:live-cli-backend`（script：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`（script：`scripts/test-live-codex-harness-docker.sh`）
- 閘道 + dev agent：`pnpm test:docker:live-gateway`（script：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性 smoke：`pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 和 `pnpm qa:observability:smoke` 是 private QA source-checkout lane。它們刻意不屬於套件 Docker 發行 lane，因為 npm tarball 會省略 QA Lab。
- Open WebUI 實機 smoke：`pnpm test:docker:openwebui`（script：`scripts/e2e/openwebui-docker.sh`）
- onboarding wizard（TTY，完整 scaffold）：`pnpm test:docker:onboard`（script：`scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/channel/agent smoke：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝打包後的 OpenClaw tarball，透過 env-ref onboarding 設定 OpenAI，並預設設定 Telegram，執行 doctor，並執行一次模擬 OpenAI agent turn。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預建 tarball、使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 略過主機重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換 channel。

- 發行使用者旅程煙霧測試：`pnpm test:docker:release-user-journey` 會在乾淨的 Docker home 中全域安裝封裝後的 OpenClaw tarball、執行 onboarding、設定模擬的 OpenAI provider、執行一次 agent turn、安裝/解除安裝外部外掛、針對本機 fixture 設定 ClickClack、驗證對外/對內訊息、重新啟動閘道，並執行 doctor。
- 發行 typed onboarding 煙霧測試：`pnpm test:docker:release-typed-onboarding` 會安裝封裝後的 tarball，透過真實 TTY 驅動 `openclaw onboard`，將 OpenAI 設定為 env-ref provider，驗證不會保存原始 key，並執行一次模擬的 agent turn。
- 發行媒體/記憶煙霧測試：`pnpm test:docker:release-media-memory` 會安裝封裝後的 tarball，驗證從 PNG 附件進行影像理解、OpenAI 相容的影像生成輸出、記憶搜尋回想，以及回想在閘道重新啟動後仍能存續。
- 發行升級使用者旅程煙霧測試：`pnpm test:docker:release-upgrade-user-journey` 預設會安裝比候選 tarball 舊的最新已發布基準版本，在已發布套件上設定 provider/外掛/ClickClack 狀態，升級到候選 tarball，然後重新執行核心 agent/外掛/channel 旅程。如果沒有較舊的已發布基準版本，會重用候選版本。使用 `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` 覆寫基準版本。
- 發行外掛 marketplace 煙霧測試：`pnpm test:docker:release-plugin-marketplace` 會從本機 fixture marketplace 安裝、更新已安裝的外掛、解除安裝它，並驗證外掛命令列介面會消失且安裝 metadata 已被修剪。
- Skills 安裝煙霧測試：`pnpm test:docker:skill-install` 會在 Docker 中全域安裝封裝後的 OpenClaw tarball，在 config 中停用上傳 archive 安裝，從搜尋解析目前 live ClawHub skill slug，使用 `openclaw skills install` 安裝它，並驗證已安裝的 skill 與 `.clawhub` origin/lock metadata。
- 更新 channel 切換煙霧測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝封裝後的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久化的 channel 和外掛在更新後可運作，然後切回套件 `stable` 並檢查更新狀態。
- 升級存續者煙霧測試：`pnpm test:docker:upgrade-survivor` 會把封裝後的 OpenClaw tarball 安裝到一個髒的舊使用者 fixture 上，該 fixture 含有 agents、channel config、外掛 allowlists、陳舊的外掛依賴狀態，以及既有 workspace/session 檔案。它會在沒有 live provider 或 channel keys 的情況下執行套件更新和非互動式 doctor，然後啟動 loopback 閘道，並檢查 config/state 保留情況以及 startup/status budgets。
- 已發布升級存續者煙霧測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`，植入逼真的既有使用者檔案，用內建命令 recipe 設定該基準版本，驗證產生的 config，將該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 loopback 閘道，並檢查已設定 intents、state 保留情況、startup、`/healthz`、`/readyz` 和 RPC status budgets。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準版本，要求 aggregate scheduler 使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確的本機基準版本，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，並使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixtures，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw 外掛安裝。Package Acceptance 會將它們公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析 meta baseline tokens，例如 `last-stable-4` 或 `all-since-2026.4.23`，而 Full Release Validation 會將 release-soak package gate 展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- Session runtime context 煙霧測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏 runtime context transcript 持久化，以及 doctor 對受影響 duplicated prompt-rewrite branches 的修復。
- Bun 全域安裝煙霧測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會封裝目前 tree，在隔離 home 中使用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會回傳 bundled image providers，而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過 host build，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker image 複製 `dist/`。
- Installer Docker 煙霧測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm containers 之間共用同一個 npm cache。Update smoke 預設使用 npm `latest` 作為 stable baseline，然後升級到候選 tarball。在本機使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用 Install Smoke workflow 的 `update_baseline_version` input 覆寫。Non-root installer checks 會保留隔離的 npm cache，因此 root-owned cache entries 不會掩蓋 user-local install behavior。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重新執行之間重用 root/update/direct-npm cache。
- Install Smoke CI 會使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm global update；需要 direct `npm install -g` 覆蓋率時，請在本機執行 script 且不要設定該 env。
- Agents 刪除 shared workspace 命令列介面煙霧測試：`pnpm test:docker:agents-delete-shared-workspace`（script：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置 root Dockerfile image，在隔離的 container home 中植入兩個 agents 和一個 workspace，執行 `agents delete --json`，並驗證有效 JSON 與保留 workspace behavior。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke image。
- 閘道 networking（兩個 containers、WS auth + health）：`pnpm test:docker:gateway-network`（script：`scripts/e2e/gateway-network-docker.sh`）
- Browser CDP snapshot 煙霧測試：`pnpm test:docker:browser-cdp-snapshot`（script：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置 source E2E image 加上一層 Chromium，使用 raw CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role snapshots 涵蓋 link URLs、cursor-promoted clickables、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning regression：`pnpm test:docker:openai-web-search-minimal`（script：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過閘道執行模擬的 OpenAI server，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升到 `low`，然後強制 provider schema reject，並檢查 raw detail 會出現在閘道 logs 中。
- MCP channel bridge（seeded 閘道 + stdio bridge + raw Claude notification-frame smoke）：`pnpm test:docker:mcp-channels`（script：`scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw bundle MCP tools（real stdio MCP server + embedded OpenClaw profile allow/deny smoke）：`pnpm test:docker:agent-bundle-mcp-tools`（script：`scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- 排程/subagent MCP cleanup（real 閘道 + stdio MCP child teardown after isolated cron and one-shot subagent runs）：`pnpm test:docker:cron-mcp-cleanup`（script：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 外掛（local path、`file:`、含 hoisted dependencies 的 npm registry、malformed npm package metadata、git moving refs、ClawHub kitchen-sink、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update smoke）：`pnpm test:docker:plugins`（script：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳過 ClawHub block，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink package/runtime pair。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用 hermetic local ClawHub fixture server。
- 外掛 update unchanged 煙霧測試：`pnpm test:docker:plugin-update`（script：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 外掛 lifecycle matrix 煙霧測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在 bare container 中安裝封裝後的 OpenClaw tarball，安裝 npm 外掛，切換 enable/disable，透過本機 npm registry 升級和降級它，刪除已安裝的 code，然後驗證 uninstall 仍會移除 stale state，同時為每個 lifecycle phase 記錄 RSS/CPU metrics。
- Config reload metadata 煙霧測試：`pnpm test:docker:config-reload`（script：`scripts/e2e/config-reload-source-docker.sh`）
- 外掛：`pnpm test:docker:plugins` 涵蓋 local path、`file:`、含 hoisted dependencies 的 npm registry、git moving refs、ClawHub fixtures、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update smoke。`pnpm test:docker:plugin-update` 涵蓋已安裝外掛的 unchanged update behavior。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋 resource-tracked npm 外掛 install、enable、disable、upgrade、downgrade，以及 missing-code uninstall。

若要手動預先建置並重用共用 functional image：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

當設定了 suite-specific image overrides，例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`，它們仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向 remote shared image 時，如果它尚未存在於本機，scripts 會 pull 它。QR 和 installer Docker tests 保留自己的 Dockerfiles，因為它們驗證的是 package/install behavior，而不是共用的 built-app runtime。

live-model Docker runners 也會以唯讀方式 bind-mount 目前 checkout，
並將它 stage 到 container 內的 temporary workdir。這會讓
runtime image 保持精簡，同時仍針對你的精確本機
source/config 執行 Vitest。staging step 會跳過大型 local-only caches 和 app build
outputs，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及
app-local `.build` 或 Gradle output directories，因此 Docker live runs 不會
花數分鐘複製 machine-specific artifacts。它們也會設定
`OPENCLAW_SKIP_CHANNELS=1`，因此 gateway live probes 不會在 container 內啟動真實的
Telegram/Discord/等 channel workers。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要從該 Docker lane
縮小或排除 gateway live coverage 時，也請傳入
`OPENCLAW_LIVE_GATEWAY_*`。

`test:docker:openwebui` 是較高層級的相容性煙霧測試：它會啟動一個
已啟用 OpenAI-compatible HTTP endpoints 的 OpenClaw gateway container，
啟動一個 pinned Open WebUI container 並讓它連到該閘道，透過
Open WebUI 登入，驗證 `/api/models` 會公開 `openclaw/default`，然後透過 Open WebUI 的
`/api/chat/completions` proxy 傳送真實 chat request。針對 release-path CI checks，
設定 `OPENWEBUI_SMOKE_MODE=models` 可在 Open WebUI sign-in 和 model discovery 後停止，
而不等待 live model completion。第一次執行可能會明顯較慢，因為 Docker 可能需要
pull Open WebUI image，且 Open WebUI 可能需要完成自己的
cold-start setup。此 lane 預期有可用的 live model key，透過
process environment、staged auth profiles，或明確的
`OPENCLAW_PROFILE_FILE` 提供。成功執行會列印一小段 JSON payload，例如
`{ "ok": true, "model": "openclaw/default", ... }`。

`test:docker:mcp-channels` 是刻意設計為決定性的，不需要真正的 Telegram、Discord 或 iMessage 帳號。它會啟動一個已植入種子的閘道容器，啟動第二個容器來產生 `openclaw mcp serve`，接著透過真實的 stdio MCP 橋接驗證已路由的對話探索、逐字稿讀取、附件中繼資料、即時事件佇列行為、外寄傳送路由，以及 Claude 風格的頻道 + 權限通知。通知檢查會直接檢視原始 stdio MCP 框架，因此這個煙霧測試驗證的是橋接實際發出的內容，而不只是某個特定用戶端 SDK 剛好公開的內容。

`test:docker:agent-bundle-mcp-tools` 是決定性的，不需要即時模型金鑰。它會建置儲存庫 Docker 映像、在容器內啟動真正的 stdio MCP 探測伺服器、透過內嵌的 OpenClaw bundle MCP 執行階段實體化該伺服器、執行工具，接著驗證 `coding` 和 `messaging` 會保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 會將它們過濾掉。

`test:docker:cron-mcp-cleanup` 是決定性的，不需要即時模型金鑰。它會啟動已植入種子的閘道與真正的 stdio MCP 探測伺服器，執行隔離的排程回合與 `sessions_spawn` 一次性子回合，接著驗證 MCP 子程序會在每次執行後退出。

手動 ACP 白話執行緒煙霧測試（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此指令碼供迴歸/偵錯工作流程使用。ACP 執行緒路由驗證未來可能還會再次需要它，因此不要刪除。

實用環境變數：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` 已掛載，並在執行測試前載入
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` 載入的環境變數，使用暫時設定/工作區目錄，且不掛載外部命令列介面驗證
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`，除非該次執行已使用 CI/受管理的繫結目錄）掛載到 `/home/node/.npm-global`，用於 Docker 內快取命令列介面安裝
- `$HOME` 下的外部命令列介面驗證目錄/檔案會以唯讀方式掛載在 `/host-auth...` 下，接著在測試開始前複製到 `/home/node/...`
  - 預設目錄（當執行未限縮到特定供應商時使用）：`.factory`、`.gemini`、`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 限縮供應商執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要目錄/檔案
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的逗號清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於限縮執行
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於在容器內篩選供應商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於在不需要重新建置的重新執行中重用現有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保憑證來自設定檔儲存區（而非 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇閘道為 Open WebUI 煙霧測試公開的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI 煙霧測試使用的一次性檢查提示
- `OPENWEBUI_IMAGE=...` 用於覆寫已釘選的 Open WebUI 映像標籤

## 文件健全性檢查

文件編輯後執行文件檢查：`pnpm check:docs`。
當你也需要頁內標題檢查時，執行完整的 Mintlify 錨點驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI 安全）

這些是不使用真正供應商的「真實管線」迴歸：

- 閘道工具呼叫（模擬 OpenAI，真實閘道 + 代理程式迴圈）：`src/gateway/gateway.test.ts`（案例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- 閘道精靈（WS `wizard.start`/`wizard.next`，寫入設定 + 強制驗證）：`src/gateway/gateway.test.ts`（案例："runs wizard over ws and writes auth token config"）

## 代理程式可靠性評估（Skills）

我們已經有一些 CI 安全測試，其行為類似「代理程式可靠性評估」：

- 透過真實閘道 + 代理程式迴圈進行模擬工具呼叫（`src/gateway/gateway.test.ts`）。
- 端到端精靈流程，用於驗證工作階段接線與設定效果（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當提示中列出 Skills 時，代理程式是否會選擇正確的 Skill（或避開不相關的 Skill）？
- **合規：** 代理程式是否會在使用前讀取 `SKILL.md`，並遵循必要步驟/參數？
- **工作流程合約：** 多回合情境，用於斷言工具順序、工作階段歷史延續，以及沙盒邊界。

未來評估應優先保持決定性：

- 使用模擬供應商的情境執行器，用於斷言工具呼叫 + 順序、Skill 檔案讀取，以及工作階段接線。
- 一組小型的 Skill 導向情境（使用與避免、門檻、提示注入）。
- 選用即時評估（選擇加入、以環境變數控管）只應在 CI 安全套件就位後加入。

## 合約測試（外掛與頻道形狀）

合約測試會驗證每個已註冊外掛和頻道都符合其介面合約。它們會逐一處理所有探索到的外掛，並執行一套形狀與行為斷言。預設的 `pnpm test` 單元測試通道會刻意略過這些共享銜接點與煙霧測試檔案；當你觸及共享頻道或供應商表面時，請明確執行合約命令。

### 命令

- 所有合約：`pnpm test:contracts`
- 僅頻道合約：`pnpm test:contracts:channels`
- 僅供應商合約：`pnpm test:contracts:plugins`

### 頻道合約

位於 `src/channels/plugins/contracts/*.contract.test.ts`。目前頂層類別：

- **channel-catalog** - bundled/registry 頻道目錄項目中繼資料
- **plugin**（registry-backed、sharded）- 基本外掛註冊形狀
- **surfaces-only**（registry-backed、sharded）- `actions`、`setup`、`status`、`outbound`、`messaging`、`threading`、`directory` 和 `gateway` 的逐表面形狀檢查
- **session-binding**（registry-backed）- 工作階段繫結行為
- **outbound-payload** - 訊息承載結構與正規化
- **group-policy**（fallback）- 每個頻道的預設群組政策強制執行
- **threading**（registry-backed、sharded）- 執行緒 id 處理
- **directory**（registry-backed、sharded）- 目錄/名冊 API
- **registry** 和 **plugins-core.\*** - 頻道外掛 registry、載入器，以及設定寫入授權內部機制

這些套件使用的入站 dispatch-capture 與 outbound-payload 測試輔助工具，會透過 `src/plugin-sdk/channel-contract-testing.ts` 在內部公開（npm 排除，不是公開 SDK 子路徑）；此目錄中沒有獨立的 `inbound.contract.test.ts` 檔案。

### 供應商合約

位於 `src/plugins/contracts/*.contract.test.ts`。目前類別包括：

- **shape** - 外掛 manifest、API 和執行階段匯出形狀
- **plugin-registration**（+ parallel）- manifest 註冊案例
- **package-manifest** - 套件 manifest 要求
- **loader** - 外掛載入器設定/拆除行為
- **registry** - 外掛合約 registry 內容與查詢
- **providers** - 跨 bundled 供應商的共享供應商行為，以及 web-search 供應商
- **auth-choice** - 驗證選項中繼資料與設定行為
- **provider-catalog-deprecation** - 已淘汰供應商目錄中繼資料
- **wizard.choice-resolution**、**wizard.model-picker**、**wizard.setup-options** - 供應商設定精靈合約
- **embedding-provider**、**memory-embedding-provider**、**web-fetch-provider**、**tts** - 能力特定供應商合約
- **session-actions**、**session-attachments**、**session-entry-projection** - 外掛擁有的工作階段狀態合約
- **scheduled-turns** - 外掛排程回合中繼資料與時間戳界限
- **host-hooks**、**run-context-lifecycle**、**runtime-import-side-effects**、**runtime-seams** - 外掛主機/執行階段生命週期與匯入邊界合約
- **extension-runtime-dependencies** - extensions 的執行階段相依性放置

### 何時執行

- 變更 plugin-sdk 匯出或子路徑後
- 新增或修改頻道或供應商外掛後
- 重構外掛註冊或探索後

合約測試會在 CI 中執行，且不需要真正的 API 金鑰。

## 新增迴歸（指引）

當你修正在即時環境中發現的供應商/模型問題時：

- 盡可能新增 CI 安全迴歸（模擬/Stub 供應商，或擷取精確的請求形狀轉換）
- 如果本質上只能即時測試（速率限制、驗證政策），請讓即時測試保持限縮，並透過環境變數選擇加入
- 優先鎖定能抓到錯誤的最小層：
  - 供應商請求轉換/重放錯誤 -> 直接模型測試
  - 閘道工作階段/歷史/工具管線錯誤 -> 閘道即時煙霧測試或 CI 安全閘道模擬測試
- SecretRef 遍歷護欄：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry 中繼資料（`listSecretTargetRegistryEntries()`）為每個 SecretRef 類別衍生一個抽樣目標，接著斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增新的 `includeInPlan` SecretRef 目標家族，請更新該測試中的 `classifyTargetClass`。此測試會刻意在未分類目標 id 上失敗，因此新類別不能被靜默略過。

## 相關

- [即時測試](/zh-TW/help/testing-live)
- [測試更新和外掛](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
