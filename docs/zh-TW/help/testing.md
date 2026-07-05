---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/供應商錯誤新增迴歸測試
    - 偵錯閘道與代理程式行為
summary: 測試套件：單元/e2e/即時套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-07-05T11:22:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d214989b949abec4c41701154e295d9da50a7e3bdae26e5e1835b78b2c0cf345
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 測試套件（單元/整合、e2e、即時）以及 Docker
執行器。本頁說明每個套件涵蓋的範圍、特定工作流程應執行的命令、即時測試如何探索憑證，以及如何為真實世界的供應商/模型錯誤新增
迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、即時傳輸通道）** 另有文件說明：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) - 架構、命令介面、情境撰寫。
- [Matrix QA](/zh-TW/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的參考資料。
- [成熟度計分卡](/zh-TW/maturity/scorecard) - 發行 QA 證據如何支援穩定性與 LTS 決策。
- [QA channel](/zh-TW/channels/qa-channel) - 由 repo 支援情境使用的合成傳輸外掛。

本頁涵蓋一般測試套件以及 Docker/Parallels 執行器。下方的 [QA 專用執行器](#qa-specific-runners) 列出具體的 `qa` 呼叫，並指回上述參考資料。
</Note>

## 快速開始

大多數時候：

- 完整關卡（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充裕機器上更快的本機全套件執行：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案也會路由外掛/通道路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 在迭代單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你修改測試或想要額外信心時：

- 覆蓋率關卡：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

## 測試暫存目錄

對於測試擁有的暫存
目錄，請使用 `test/helpers/temp-dir.ts` 中的共用輔助工具，讓所有權明確且清理保留在測試生命週期中：

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` 刻意不公開手動
清理方法 - Vitest 擁有每個測試後的清理。較舊的低階
輔助工具（`makeTempDir`、`cleanupTempDirs`、`createTempDirTracker`）仍然存在
供尚未遷移的測試使用；避免新增使用它們，也避免新增裸露的
`fs.mkdtemp*` 呼叫，除非測試明確在驗證原始暫存目錄
行為。當確實需要裸露暫存目錄時，請加入可稽核的允許
註解並附上原因：

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` 會在新增的 diff 行中回報新的裸露暫存目錄
建立，以及新的手動共用輔助工具使用情況，而不會
阻擋現有清理樣式。它遵循與 `scripts/changed-lanes.mjs` 相同的測試路徑分類，
並略過共用輔助工具實作
本身。`check:changed` 會針對變更的測試路徑執行此報告，作為
僅警告的 CI 訊號（GitHub 警告註解，而非失敗）。

## 即時與 Docker/Parallels 工作流程

偵錯真實供應商/模型時（需要真實憑證）：

- 即時套件（模型 + 閘道工具/圖片探測）：`pnpm test:live`
- 安靜地指定一個即時檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：分派 `OpenClaw Performance`，並使用
  `live_openai_candidate=true` 執行真實的 `openai/gpt-5.5` agent 回合，或使用
  `deep_profile=true` 產生 Kova CPU/heap/trace 成品。每日排程執行會在
  `CLAWGRIT_REPORTS_TOKEN` 已設定時，將 mock-provider、deep-profile 與 GPT 5.5 通道成品發布到
  `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的閘道啟動、記憶體、
  外掛壓力、重複 fake-model hello-loop，以及命令列介面啟動數據。
- Docker 即時模型掃描：`pnpm test:docker:live-models`
  - 每個選定模型會執行一個文字回合加上一個小型類檔案讀取探測。
    中繼資料宣告支援 `image` 輸入的模型也會執行一個微型圖片回合。
    隔離供應商失敗時，可使用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋率：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動
    `OpenClaw Release Checks` 都會呼叫可重用的即時/E2E 工作流程，並設定
    `include_live_suites: true`，其中包含依供應商分片的 Docker 即時模型矩陣作業。
  - 針對聚焦的 CI 重新執行，分派 `OpenClaw Live And E2E Checks (Reusable)`，
    並設定 `include_live_suites: true` 和 `live_models_only: true`。
  - 將新的高訊號供應商秘密新增到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    排程/發行呼叫者。
- 原生 Codex 綁定聊天煙霧測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker 即時通道，使用
    `/codex bind` 綁定合成 Slack DM，測試 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆和圖片附件
    透過原生外掛綁定路由，而不是 ACP。
- Codex app-server harness 煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過外掛擁有的 Codex app-server
    harness 執行閘道 agent 回合，驗證 `/codex status` 和 `/codex models`，並預設
    測試圖片、排程 MCP、子 agent，以及 Guardian 探測。隔離其他失敗時，可使用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用
    子 agent 探測。若要進行聚焦的子 agent 檢查，請停用
    其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，
    否則這會在子 agent 探測後結束。
- Codex 隨選安裝煙霧測試：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安裝封裝後的 OpenClaw tarball，執行 OpenAI API key
    onboarding，並驗證 Codex 外掛加上 `@openai/codex` 相依項目
    已按需下載到受管理的 npm 專案根目錄。
- 即時外掛工具相依項目煙霧測試：`pnpm test:docker:live-plugin-tool`
  - 封裝一個具有真實 `slugify` 相依項目的 fixture 外掛，透過
    `npm-pack:` 安裝它，驗證受管理 npm
    專案根目錄下的相依項目，接著要求即時 OpenAI 模型呼叫外掛工具並
    回傳隱藏 slug。
- Crestodian 救援命令煙霧測試：`pnpm test:live:crestodian-rescue-channel`
  - 針對訊息通道救援命令
    介面的選用多重保險檢查。測試 `/crestodian status`、佇列持久化模型
    變更、回覆 `/crestodian yes`，並驗證稽核/設定寫入
    路徑。
- Crestodian planner Docker 煙霧測試：`pnpm test:docker:crestodian-planner`
  - 在無設定容器中執行 Crestodian，並在
    `PATH` 上放置假的 Claude 命令列介面，驗證模糊 planner fallback 會轉換成
    已稽核的型別化設定寫入。
- Crestodian 首次執行 Docker 煙霧測試：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，驗證現代 onboard
    Crestodian 進入點，套用 setup/model/agent/Discord 外掛 +
    SecretRef 寫入、驗證設定，並驗證稽核項目。同一個
    Ring 0 setup 路徑也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆蓋。
- Moonshot/Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方描述的允許清單環境變數縮小即時測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 的真實性時，這些命令會位於主要測試套件旁。

CI 會在專用工作流程中執行 QA Lab。Agentic parity 內嵌於
`QA-Lab - All Lanes` 和發行驗證之下，而不是獨立的 PR 工作流程。
廣泛驗證應使用 `Full Release Validation`，搭配
`rerun_group=qa-parity` 或 release-checks QA 群組。穩定/預設發行
檢查會將詳盡的即時/Docker soak 保留在 `run_release_soak=true` 之後；`full` profile 會強制啟用 soak。`QA-Lab - All Lanes` 會在 `main` 每晚執行，並
從手動分派執行，其中 mock parity 通道、即時 Matrix 通道、
Convex 管理的即時 Telegram 通道，以及 Convex 管理的即時 Discord 通道會作為
平行作業。排程 QA 和發行檢查會明確傳遞 Matrix `--profile fast`，
而 Matrix 命令列介面和手動工作流程輸入的預設值仍為
`all`；手動分派可將 `all` 分片成 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。`OpenClaw Release Checks` 會在
發行核准前執行 parity 加上快速 Matrix 和 Telegram 通道，並使用
`mock-openai/gpt-5.5` 進行發行傳輸檢查，使其保持決定性
並避免一般供應商外掛啟動。這些即時傳輸閘道
會停用記憶體搜尋；記憶體行為仍由 QA parity 套件覆蓋。

完整發行即時媒體分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker 即時模型/後端分片使用共用的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，該映像會針對每個選定
commit 建置一次，接著使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在
每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由儲存庫支援的 QA 情境。
  - 為選取的情境集合寫入頂層 `qa-evidence.json`、`qa-suite-summary.json` 和
    `qa-suite-report.md` 成品，包括混合流程、Vitest 和 Playwright 情境選擇。
  - 由 `pnpm openclaw qa run --qa-profile <profile>` 派送時，會將選取的分類法設定檔
    計分卡嵌入同一個 `qa-evidence.json`。`smoke-ci` 會寫入精簡證據
    （`evidenceMode: "slim"`，沒有逐項 `execution`）。`release` 涵蓋精選的
    發行就緒度切片；`all` 會選取每個作用中的成熟度類別，並在需要完整計分卡成品時，
    目標指向明確的 QA Profile Evidence 工作流程派送。
  - 預設使用隔離的閘道工作程序平行執行多個選取的情境。`qa-channel` 預設並行數為 4
    （受選取情境數量限制）。使用 `--concurrency <count>` 調整工作程序數量，或使用
    `--concurrency 1` 走舊版序列通道。
  - 任何情境失敗時會以非零狀態結束。若要在不產生失敗結束碼的情況下取得成品，請使用
    `--allow-failures`。
  - 支援提供者模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動本機 AIMock 支援的提供者伺服器，用於實驗性 fixture 和協定模擬涵蓋，
    而不取代具備情境感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa coverage --match <query>`
  - 搜尋情境 ID、標題、表面、涵蓋 ID、文件參照、程式碼參照、外掛和提供者需求，
    然後列印相符的套件目標。
  - 當你知道受影響的行為或檔案路徑，但不知道最小情境時，請在 QA Lab 執行前使用此命令。
    這僅供參考 - 仍需依據正在變更的行為選擇 mock、live、Multipass、Matrix 或傳輸證明。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink 外掛考驗。
    安裝外部 Kitchen Sink 套件、驗證外掛 SDK 表面清單、探測 `/healthz` 和 `/readyz`、
    記錄閘道 CPU/RSS 證據、執行即時 OpenAI 回合，並檢查對抗式診斷。
    需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在已注水的 Testbox 工作階段中，
    當 `openclaw-testbox-env` 輔助程式存在時，會自動來源載入 Testbox 即時驗證設定檔。
- `pnpm test:gateway:cpu-scenarios`
  - 執行閘道啟動基準測試，加上一小組 mock QA Lab 情境套件
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/`
    下寫入合併的 CPU 觀察摘要。
  - 預設只標記持續的高 CPU 觀察（`--cpu-core-warn`，預設 `0.9`；
    `--hot-wall-warn-ms`，預設 `30000`），因此短暫的啟動尖峰會被記錄為指標，
    而不會看起來像持續數分鐘的閘道占滿 CPU 迴歸。
  - 針對已建置的 `dist` 成品執行；當 checkout 尚未有最新執行階段輸出時，請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 內執行相同的 QA 套件，保留與 `qa suite` 相同的情境選擇
    及提供者/模型旗標。
  - 即時執行會轉送對客體實用的 QA 驗證輸入：
    基於 env 的提供者金鑰、QA 即時提供者設定路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須保持在儲存庫根目錄下，讓客體能透過掛載的工作區寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告 + 摘要以及 Multipass 記錄。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA 站台，用於操作員風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在 Docker 中全域安裝，執行非互動式 OpenAI API 金鑰
    onboarding，預設設定 Telegram，驗證封裝的外掛執行階段可在沒有啟動相依修復的情況下載入，
    執行 doctor，並針對模擬的 OpenAI 端點執行一次本機代理回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的封裝安裝通道。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式執行階段內容逐字稿執行可重現的已建置應用程式 Docker smoke。
    驗證隱藏的 OpenClaw 執行階段內容會以非顯示自訂訊息持續存在，而不是洩漏到可見的使用者回合，
    然後植入受影響的破損工作階段 JSONL，並驗證 `openclaw doctor --fix` 會將其重寫到作用中分支並備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 套件候選版本、執行已安裝套件的 onboarding、透過已安裝的命令列介面
    設定 Telegram，然後使用該已安裝套件作為 SUT 閘道，重用即時 Telegram QA 通道。
  - 包裝器只會從 checkout 掛載 `qa-lab` 測試工具來源；
    已安裝套件擁有 `dist`、`openclaw/plugin-sdk` 和綁定的外掛執行階段，
    因此此通道不會將目前 checkout 的外掛混入受測套件。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而非從 registry 安裝。
  - 預設會以 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` 在 `qa-evidence.json` 中發出重複 RTT 時序。
    覆寫 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 可調整執行。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` 接受以逗號分隔的 Telegram QA 檢查 ID 清單進行取樣；
    未設定時，預設具備 RTT 能力的檢查為 `telegram-mentioned-message-reply`。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env 憑證或 Convex 憑證來源。
    對於 CI/發行自動化，設定 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密鑰。如果 CI 中存在
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密鑰，Docker 包裝器會自動選取 Convex。
  - 包裝器會在 Docker 建置/安裝工作前，先在主機上驗證 Telegram 或 Convex 憑證 env。
    只有在刻意偵錯憑證前設定時，才設定
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會為此通道覆寫共用的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。選取 Convex 憑證且未設定角色時，包裝器會在 CI 中使用 `ci`，
    在 CI 外使用 `maintainer`。
  - GitHub Actions 將此通道公開為手動維護者工作流程
    `NPM Telegram Beta E2E`。它不會在合併時執行。此工作流程使用
    `qa-live-shared` 環境和 Convex CI 憑證租約。
- GitHub Actions 也公開 `Package Acceptance`，用於針對一個候選套件進行旁路產品證明。
  它接受 Git 參照、已發布的 npm 規格、HTTPS tarball URL 加 SHA-256、受信任 URL 政策，
  或另一個執行的 tarball 成品（`source=ref|npm|url|trusted-url|artifact`），
  上傳標準化的 `openclaw-current.tgz` 作為 `package-under-test`，然後使用
  `smoke`、`package`、`product`、`full` 或 `custom` 通道設定檔執行既有 Docker E2E 排程器。
  設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對相同的
  `package-under-test` 成品執行 Telegram QA 工作流程。
  - 最新 beta 產品證明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精確 tarball URL 證明需要摘要，並使用公開 URL 安全政策：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 企業/私人 tarball 鏡像使用明確的受信任來源政策：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` 會從受信任工作流程參照讀取 `.github/package-trusted-sources.json`，且不接受 URL 憑證或工作流程輸入的私人網路繞過。如果具名政策宣告 bearer auth，請設定固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密鑰。

- 成品證明會從另一個 Actions 執行下載 tarball 成品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw 建置、啟動已設定 OpenAI 的閘道，
    然後透過設定編輯啟用綁定的頻道/外掛。
  - 驗證 setup discovery 會讓未設定的可下載外掛保持不存在，第一次設定的 doctor 修復會明確安裝每個缺少的
    可下載外掛，第二次重新啟動不會執行隱藏的相依修復。
  - 也會安裝已知較舊的 npm 基準版本，在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，
    並驗證候選版本的更新後 doctor 會清理舊版外掛相依殘留，而不需要測試工具端的 postinstall 修復。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels 客體執行原生封裝安裝更新 smoke。
    每個選取的平台會先安裝要求的基準套件，接著在同一個客體中執行已安裝的
    `openclaw update` 命令，並驗證已安裝版本、更新狀態、閘道就緒度和一次本機代理回合。
  - 迭代單一客體時使用 `--platform macos`、`--platform windows` 或 `--platform linux`。
    使用 `--json` 取得摘要成品路徑和逐通道狀態。
  - OpenAI 通道預設使用 `openai/gpt-5.5` 進行即時代理回合證明。
    傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL` 以驗證另一個 OpenAI 模型。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels 傳輸停滯耗盡剩餘測試時段：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 腳本會在 `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀通道記錄。
    在假設外層包裝器卡住前，請先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷客體上，Windows 更新可能會花 10 到 15 分鐘進行更新後 doctor 和套件更新工作；
    只要巢狀 npm 偵錯記錄仍在推進，這仍然是健康狀態。
  - 不要將此彙總包裝器與個別 Parallels macOS、Windows 或 Linux smoke 通道平行執行。
    它們共用 VM 狀態，可能在快照還原、套件服務或客體閘道狀態上互相衝突。
  - 更新後證明會執行一般綁定外掛表面，因為語音、影像生成和媒體理解等能力 facade
    會透過綁定執行階段 API 載入，即使代理回合本身只檢查簡單的文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接協定冒煙測試。
- `pnpm openclaw qa matrix`
  - 針對一次性 Docker 後端的 Tuwunel homeserver 執行 Matrix 即時 QA 通道。僅限原始碼 checkout - 打包安裝不會隨附 `qa-lab`。
  - 完整命令列介面、profile/scenario 目錄、env vars 與 artifact 版面配置：
    [Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用 env 中的 driver 與 SUT bot tokens，針對真實私人群組執行 Telegram 即時 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群組 id 必須是數字形式的 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共享的 pooled credentials。
    預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    以選擇使用 pooled leases。
  - 預設涵蓋 canary、mention gating、command addressing、`/status`、
    bot 對 bot 被提及回覆，以及核心原生命令回覆。
    `mock-openai` 預設也涵蓋確定性的 reply-chain 與
    Telegram final-message streaming 回歸。使用 `--list-scenarios`
    查看選用 probes，例如 `session_status`。
  - 任何 scenario 失敗時會以非零狀態退出。使用 `--allow-failures` 產生
    artifacts 而不使用失敗的 exit code。
  - 需要同一個私人群組中的兩個不同 bot，且 SUT bot 必須公開 Telegram username。
  - 為了穩定觀察 bot 對 bot，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 可以觀察群組 bot 流量。
  - 會在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要與 `qa-evidence.json`。回覆 scenarios 會包含從 driver send request 到觀察到 SUT reply 的 RTT。

`Mantis Telegram Live` 是此通道的 PR 證據 wrapper。它會使用 Convex 租用的 Telegram credentials 執行候選 ref，在 Crabbox desktop browser 中呈現已遮蔽的 QA report/evidence bundle，錄製 MP4 證據，產生 motion-trimmed GIF，上傳 artifact bundle，並在設定 `pr_number` 時透過 Mantis GitHub App 張貼行內 PR 證據。維護者可以透過 Actions UI 中的 `Mantis Scenario`
（`scenario_id: telegram-live`）啟動，或直接從 pull request comment 啟動：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用於 PR 視覺證明的 agentic 原生 Telegram Desktop before/after wrapper。透過 Actions UI 搭配自由格式的 `instructions` 啟動、透過 `Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）啟動，或從 PR comment 啟動：

```text
@openclaw-mantis telegram desktop proof
```

Mantis agent 會讀取 PR，決定哪些 Telegram 可見行為能證明變更，於 baseline 與候選 refs 上執行 real-user Crabbox Telegram Desktop proof 通道，反覆調整直到原生 GIFs 可用，寫入成對的 `motionPreview` manifest，並在設定 `pr_number` 時透過 Mantis GitHub App 張貼相同的 2 欄 GIF 表格。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重用 Crabbox Linux desktop，安裝原生 Telegram
    Desktop，使用租用的 Telegram SUT bot token 設定 OpenClaw，
    啟動閘道，並從可見的 VNC desktop 錄製 screenshot/MP4 證據。
  - 預設為 `--credential-source convex`，因此 workflows 只需要
    Convex broker secret。若要使用與 `pnpm openclaw qa telegram` 相同的
    `OPENCLAW_QA_TELEGRAM_*` 變數，請使用 `--credential-source env`。
  - Telegram Desktop 仍需要使用者登入/profile。bot token
    只會設定 OpenClaw。使用 `--telegram-profile-archive-env <name>`
    指定 base64 `.tgz` profile archive，或使用 `--keep-lease` 並透過 VNC 手動登入一次。
  - 會在 output directory 下寫入 `mantis-telegram-desktop-builder-report.md`、
    `mantis-telegram-desktop-builder-summary.json`、
    `telegram-desktop-builder.png` 和 `telegram-desktop-builder.mp4`。

即時 transport 通道共用一個標準 contract，避免新的 transports 漂移；各通道 coverage matrix 位於
[QA overview - Live transport coverage](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。
`qa-channel` 是廣泛的 synthetic suite，不屬於該 matrix。

### 透過 Convex 使用共享 Telegram credentials (v1)

當為即時 transport QA 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex-backed pool 取得專屬 lease，在通道執行期間對該 lease 進行心跳偵測，並在 shutdown 時釋放 lease。此 section 名稱早於 Discord、Slack 與 WhatsApp 支援；lease contract 由各種類共用。

參考 Convex project scaffold：`qa/convex-credential-broker/`

必要 env vars：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選 role 的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- Credential role selection：
  - 命令列介面：`--credential-role maintainer|ci`
  - Env 預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（CI 中預設為 `ci`，其他情況預設為 `maintainer`）

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

維護者的命令列介面 helpers：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時 runs 前使用 `doctor`，檢查 Convex site URL、broker secrets、
endpoint prefix、HTTP timeout 與 admin/list reachability，而不列印
secret values。使用 `--json` 在 scripts 與 CI utilities 中取得 machine-readable output。

預設 endpoint contract（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）。
Requests 使用 `Authorization: Bearer <role secret>` header 驗證；以下 bodies 省略該 header：

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
- `groupId` 必須是數字形式的 Telegram chat id string。
- `admin/add` 會驗證 `kind: "telegram"` 的這個 shape，並拒絕 malformed payloads。

Telegram real-user kind 的 payload shape：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 和 `telegramApiId` 必須是 numeric strings。
- `tdlibArchiveSha256` 和 `desktopTdataArchiveSha256` 必須是 SHA-256 hex strings。
- `kind: "telegram-user"` 保留給 Mantis Telegram Desktop proof workflow。Generic QA Lab lanes 不得取得它。

Broker-validated multi-channel payloads：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes 也可以從 pool 租用，但 Slack payload validation
目前位於 Slack QA runner，而非 broker。Slack rows 使用
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 將 channel 加入 QA

新 channel adapters 的 architecture 與 scenario-helper names 位於
[QA overview - Adding a channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。
最低標準：在共享的 `qa-lab` host seam 上實作 transport runner，
在外掛 manifest 中宣告 `qaRunners`，掛載為
`openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫 scenarios。

## Test suites（哪裡執行哪些內容）

可以把 suites 視為「逐漸提高真實性」（同時提高 flakiness/cost）。

### Unit / integration（預設）

- Command：`pnpm test`
- Config：未指定 target 的 runs 使用 `vitest.full-*.config.ts` shard set，並可能將 multi-project shards 展開為 per-project configs 以進行 parallel scheduling
- Files：`src/**/*.test.ts`、
  `packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit inventories；UI unit tests 在專用的
  `unit-ui` shard 中執行
- Scope：
  - Pure unit tests
  - In-process integration tests（gateway auth、routing、tooling、parsing、config）
  - 已知 bugs 的確定性 regressions
- Expectations：
  - 在 CI 中執行
  - 不需要真實 keys
  - 應快速且穩定
  - Resolver 與 public-surface loader tests 必須使用產生的 tiny plugin fixtures
    證明廣泛的 `api.js` 與
    `runtime-api.js` fallback behavior，
    而不是真實 bundled plugin source APIs。真實 plugin API 載入屬於
    plugin-owned contract/integration suites。

Native dependency policy：

- 預設 test installs 會跳過 optional native Discord opus builds。Discord
  voice 使用 bundled `libopus-wasm`，且 `@discordjs/opus` 保持在
  `allowBuilds` 中停用，讓本機 tests 與 Testbox lanes 不會編譯 native
  addon。
- 請在 `libopus-wasm` benchmark repo 中比較 native opus performance，而不是在預設 OpenClaw install/test loops 中比較。不要在預設 `allowBuilds` 中將 `@discordjs/opus` 設為
  `true`；那會讓不相關的 install/test loops 編譯 native code。

<AccordionGroup>
  <Accordion title="Projects、shards 與 scoped lanes">

    - 未指定目標的 `pnpm test` 會執行十三個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-tooling`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這能降低繁忙機器上的 RSS 峰值，並避免 auto-reply/外掛工作餓死不相關的套件。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片 watch 迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先將明確的檔案/目錄目標導向作用域化 lane，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免支付完整根專案啟動成本。
    - `pnpm test:changed` 預設會將已變更的 git 路徑展開為廉價的作用域化 lane：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖相依項。設定/設置/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的標準智慧本機檢查閘門。它會將 diff 分類為核心、核心測試、extensions、extension 測試、apps、文件、發布中繼資料、即時 Docker 工具，以及工具，然後執行相符的 typecheck、lint 和 guard 命令。它不會執行 Vitest 測試；若需要測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅發布中繼資料的版本 bump 會執行目標式版本/設定/根相依性檢查，並有一個 guard 會拒絕頂層版本欄位以外的 package 變更。
    - 即時 Docker ACP harness 編輯會執行聚焦檢查：即時 Docker auth 指令碼的 shell 語法，以及即時 Docker 排程器 dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時才會納入 `package.json` 變更；相依性、export、版本和其他 package 表面編輯仍使用較廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純工具區域的輕匯入單元測試會導向 `unit-fast` lane，該 lane 會略過 `test/setup-openclaw-runtime.ts`；具狀態/重 runtime 的檔案則保留在現有 lane。
    - 選定的 `plugin-sdk` 和 `commands` helper 來源檔案也會將 changed-mode 執行對應到那些輕量 lane 中的明確同層測試，因此 helper 編輯可避免重新執行該目錄的完整重型套件。
    - `auto-reply` 針對頂層核心 helpers、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹有專用 bucket。CI 進一步將 reply 子樹拆成 agent-runner、dispatch 和 commands/state-routing 分片，因此單一匯入繁重的 bucket 不會獨占完整的節點尾端。
    - 一般 PR/main CI 會刻意略過 bundled 外掛批次掃描和僅發布用的 `agentic-plugins` 分片。完整發布驗證會為候選發布版本分派獨立的 `Plugin Prerelease` 子工作流程，以執行那些外掛繁重的套件。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 當你變更 message-tool discovery 輸入或壓縮 runtime
      context 時，請保留兩個層級的覆蓋率。
    - 為純 routing 和 normalization
      邊界新增聚焦 helper 回歸測試。
    - 保持 embedded runner 整合套件健康：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證 scoped ids 和壓縮行為仍會流經
      真正的 `run.ts` / `compact.ts` 路徑；僅 helper 的測試
      無法充分取代那些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共用 Vitest 設定固定 `isolate: false`，並在根專案、e2e 和即時設定中使用
      非隔離 runner。
    - 根 UI lane 保留其 `jsdom` 設置與 optimizer，但也在
      共用非隔離 runner 上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest 設定繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子節點
      程序加入 `--no-maglev`，以降低大型本機執行期間的 V8 編譯抖動。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與原始 V8
      行為比較。
    - `scripts/run-vitest.mjs` 會在明確的非 watch Vitest 執行
      連續 5 分鐘沒有 stdout 或 stderr 輸出後終止。設定
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` 可為刻意靜默的調查停用 watchdog。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構 lane。
    - pre-commit hook 僅處理格式化。它會重新 stage 格式化後的檔案，
      不會執行 lint、typecheck 或測試。
    - 當你需要智慧本機檢查閘門時，請在 handoff 或 push 前明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會導向廉價的作用域化 lane。只有當 agent
      判定 harness、設定、package 或 contract 編輯真的需要
      更廣泛的 Vitest 覆蓋時，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的 routing
      行為，只是 worker 上限較高。
    - 本機 worker 自動縮放刻意保持保守，且當主機 load average 已經偏高時會退讓，
      因此多個並行
      Vitest 執行預設會造成較少傷害。
    - 基礎 Vitest 設定將 projects/config 檔案標記為
      `forceRerunTriggers`，因此當測試接線變更時，changed-mode 重新執行仍保持正確。
    - 設定會在
      支援的主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      可為直接 profiling 指定一個明確的快取位置。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入持續時間報告以及
      匯入 breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 視圖作用域化到
      自 `origin/main` 以來變更的檔案。
    - 分片計時資料會寫入 `.artifacts/vitest-shard-timings.json`。
      全設定執行使用設定路徑作為 key；include-pattern CI
      分片會附加分片名稱，因此可分別追蹤 filtered 分片。
    - 當某個熱門測試仍將大部分時間花在啟動匯入時，
      請將重型相依性放在狹窄本機 `*.runtime.ts` 邊界後，
      並直接 mock 該邊界，而不是 deep-import runtime helpers
      只為了將它們傳入 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會比較 routed
      `test:changed` 與該 committed diff 的原生根專案路徑，
      並印出 wall time 加上 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過將已變更檔案清單導向
      `scripts/test-projects.mjs` 和根 Vitest 設定，
      對目前 dirty tree 進行基準測試。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動與 transform overhead 寫入主執行緒 CPU profile。
    - `pnpm test:perf:profile:runner` 會為
      停用檔案平行處理的 unit suite 寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（閘道）

- 命令：`pnpm test:stability:gateway`
- 設定：`test/vitest/vitest.gateway.config.ts`、`test/vitest/vitest.logging.config.ts` 和 `test/vitest/vitest.infra.config.ts`，各自強制使用一個 worker
- 範圍：
  - 預設啟用 diagnostics，啟動真正的 loopback 閘道
  - 透過 diagnostic event path 驅動合成閘道訊息、記憶體和大型 payload 抖動
  - 透過閘道 WS RPC 查詢 `diagnostics.stability`
  - 覆蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 維持有界、合成 RSS samples 保持在壓力預算以下，且每個 session 的 queue depths 會耗盡回到零
- 預期：
  - CI-safe 且不需要金鑰
  - 供 stability-regression 後續追蹤使用的窄 lane，不能取代完整閘道套件

### E2E（repo aggregate）

- 命令：`pnpm test:e2e`
- 範圍：
  - 執行閘道 smoke E2E lane
  - 執行 mocked Control UI browser E2E lane
- 預期：
  - CI-safe 且不需要金鑰
  - 需要已安裝 Playwright Chromium

### E2E（閘道 smoke）

- 命令：`pnpm test:e2e:gateway`
- 設定：`test/vitest/vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled 外掛 E2E 測試
- Runtime 預設值：
  - 使用 Vitest `threads` 並搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用 adaptive workers（CI：最多 2，本機：預設 1）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制 worker 數量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用 verbose console output。
- 範圍：
  - 多實例閘道端對端行為
  - WebSocket/HTTP 表面、節點 pairing，以及較重的 networking
- 預期：
  - 在 CI 中執行（當 pipeline 啟用時）
  - 不需要真實金鑰
  - 比單元測試有更多 moving parts（可能較慢）

### E2E（Control UI mocked browser）

- 命令：`pnpm test:ui:e2e`
- 設定：`test/vitest/vitest.ui-e2e.config.ts`
- 檔案：`ui/src/**/*.e2e.test.ts`
- 範圍：
  - 啟動 Vite Control UI
  - 透過 Playwright 驅動真正的 Chromium page
  - 以 deterministic in-browser mocks 取代閘道 WebSocket
- 預期：
  - 作為 `pnpm test:e2e` 的一部分在 CI 中執行
  - 不需要真正的閘道、agents 或 provider 金鑰
  - 必須存在 browser 相依性（`pnpm --dir ui exec playwright install chromium`）

### E2E：OpenShell backend smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 重用作用中的本機 OpenShell 閘道
  - 從暫時本機 Dockerfile 建立 sandbox
  - 透過真實的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證 remote-canonical filesystem 行為
- 預期：
  - 僅 opt-in；不屬於預設 `pnpm test:e2e` 執行
  - 需要本機 `openshell` 命令列介面以及可運作的 Docker daemon
  - 需要作用中的本機 OpenShell 閘道及其設定來源
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 sandbox
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 可在手動執行較廣泛的 e2e suite 時啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非預設命令列介面 binary 或 wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` 可將已註冊的閘道設定暴露給隔離測試
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` 可覆寫 host policy fixture 使用的 Docker 閘道 IP

### Live（真實 providers + 真實 models）

- 命令：`pnpm test:live`
- 設定：`test/vitest/vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 底下的 bundled-plugin 即時測試
- 預設：由 `pnpm test:live` **啟用**（會設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個供應商/模型使用真實憑證，在_今天_真的能運作嗎？」
  - 捕捉供應商格式變更、工具呼叫特性、驗證問題，以及速率限制行為
- 預期：
  - 設計上並非 CI 穩定（真實網路、真實供應商政策、配額、中斷）
  - 會花錢 / 使用速率限制額度
  - 偏好執行縮小範圍的子集，而不是「全部」
- 即時執行會使用已匯出的 API 金鑰和已暫存的驗證設定檔。
- 預設情況下，即時執行仍會隔離 `HOME`，並將設定/驗證資料複製到暫時測試 home，讓單元測試 fixture 無法修改你真正的 `~/.openclaw`。
- 只有在你有意讓即時測試使用真正的 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 預設為較安靜的模式：它保留 `[live] ...` 進度輸出，並靜音閘道啟動日誌/Bonjour 雜訊。如果你想要恢復完整啟動日誌，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依供應商而定）：設定 `*_API_KEYS`，使用逗號/分號格式，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 為每個即時執行覆寫；測試會在收到速率限制回應時重試。
- 進度/心跳偵測輸出：
  - 即時套件會將進度行輸出到 stderr，因此即使 Vitest 主控台擷取很安靜，長時間的供應商呼叫仍會明顯顯示為作用中。
  - `test/vitest/vitest.live.config.ts` 會停用 Vitest 主控台攔截，讓供應商/閘道進度行在即時執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整直接模型心跳偵測。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整閘道/探測心跳偵測。

## 我該執行哪個套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更很多，另執行 `pnpm test:coverage`）
- 觸及閘道網路 / WS 協定 / 配對：加上 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 供應商特定失敗 / 工具呼叫：執行縮小範圍的 `pnpm test:live`

## 即時（會觸及網路）測試

對於即時模型矩陣、命令列介面後端 smoke、ACP smoke、Codex app-server
harness，以及所有媒體供應商即時測試（Deepgram、BytePlus、ComfyUI、
image、music、video、media harness）- 以及即時執行的憑證處理

- 請參閱[測試即時套件](/zh-TW/help/testing-live)。如需專用的更新與
  外掛驗證檢查清單，請參閱
  [測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

## Docker runner（選用的「在 Linux 中可運作」檢查）

這些 Docker runner 分成兩類：

- 即時模型 runner：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像內執行其相符的 profile-key 即時檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載你的本機設定目錄、工作區，以及選用的設定檔 env 檔。相符的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時 runner 會在需要時保留自己的實用上限：
  `test:docker:live-models` 預設為精選支援的高訊號集合，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。當你明確想要較小上限或較大掃描時，請設定 `OPENCLAW_LIVE_MAX_MODELS`
  或閘道 env vars。
- `test:docker:all` 會透過 `test:docker:live-build` 建置一次即時 Docker 映像，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包一次為 npm tarball，然後建置/重用兩個 `scripts/e2e/Dockerfile` 映像。裸映像只是用於安裝/更新/外掛相依性 lane 的節點/Git runner；這些 lane 會掛載預先建置的 tarball。功能映像會將同一個 tarball 安裝到 `/app`，用於已建置應用功能 lane。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的計畫。彙總會使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序 slot，而資源上限會避免繁重的即時、npm-install，以及多服務 lane 同時全部啟動。如果單一 lane 比作用中的上限更重，排程器仍可在 pool 為空時啟動它，然後讓它單獨執行，直到容量再次可用。預設為 10 個 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`（以及其他 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 覆寫）。runner 預設會執行 Docker 預檢、移除過時的 OpenClaw E2E 容器、每 30 秒列印狀態、將成功 lane 的計時儲存在 `.artifacts/docker-tests/lane-timings.json`，並使用這些計時在後續執行中優先啟動較長的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印加權 lane manifest，而不建置或執行 Docker；或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lane、套件/映像需求，以及憑證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生套件 gate，用於判斷「這個可安裝 tarball 作為產品能運作嗎？」它會從 `source=npm`、`source=ref`、`source=url`、`source=trusted-url` 或 `source=artifact` 解析一個候選套件，將其上傳為 `package-under-test`，然後針對那個確切 tarball 執行可重用的 Docker E2E lane，而不是重新打包選定 ref。設定檔依涵蓋範圍排序：`smoke`、`package`、`product` 和 `full`（加上用於明確 lane 清單的 `custom`）。請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)，了解套件/更新/外掛合約、已發布升級 survivor 矩陣、發行預設值，以及失敗分流。
- 建置與發行檢查會在 tsdown 之後執行 `scripts/check-cli-bootstrap-imports.mjs`。這個 guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態建置圖，如果該 pre-dispatch bootstrap graph 在命令分派之前靜態匯入任何外部套件（Commander、prompt UI、undici、logging，以及類似的啟動繁重相依項都算），就會失敗；它也會將 bundled 閘道執行 chunk 上限設為 70 KB，並拒絕該 chunk 靜態匯入已知 cold gateway paths（`control-ui-assets`、`diagnostic-stability-bundle`、`onboard-helpers`、`process-respawn`、`restart-sentinel`、`server-close`、`server-reload-handlers`）。`scripts/release-check.ts` 另會使用 `--help`、`onboard --help`、`doctor --help`、`status --json --timeout 1`、`config schema` 和 `models list --provider openai` 對已打包命令列介面做 smoke-test。
- Package Acceptance 舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，harness 只容忍已發布套件中繼資料缺口：省略私有 QA 清查項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔、缺少持久化的 `update.channel`、舊版外掛安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。對於 `2026.4.25` 之後的套件，這些路徑都是嚴格失敗。
- 容器 smoke runner：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 會啟動一個或多個真實容器，並驗證較高層級的整合路徑。
- 透過 `scripts/lib/openclaw-e2e-instance.sh` 安裝已打包 OpenClaw tarball 的 Docker/Bash E2E lane，會將 `npm install` 限制在 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（預設 `600s`；設定為 `0` 可在偵錯時停用 wrapper）。

即時模型 Docker runner 也只會 bind-mount 所需的命令列介面驗證 home
（如果執行未縮小範圍，則掛載所有支援的 home），然後在執行前將它們複製到
容器 home，讓外部命令列介面 OAuth 可以重新整理 token，
而不會修改主機驗證儲存區：

- 直接模型：`pnpm test:docker:live-models`（script：`scripts/test-live-models-docker.sh`）
- ACP bind smoke：`pnpm test:docker:live-acp-bind`（script：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 提供嚴格 Droid/OpenCode 覆蓋）
- 命令列介面後端 smoke：`pnpm test:docker:live-cli-backend`（script：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`（script：`scripts/test-live-codex-harness-docker.sh`）
- 閘道 + dev agent：`pnpm test:docker:live-gateway`（script：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性 smoke：`pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 和 `pnpm qa:observability:smoke` 是私有 QA source-checkout lane。它們刻意不屬於套件 Docker 發行 lane，因為 npm tarball 省略 QA Lab。
- Open WebUI 即時 smoke：`pnpm test:docker:openwebui`（script：`scripts/e2e/openwebui-docker.sh`）
- Onboarding wizard（TTY，完整 scaffolding）：`pnpm test:docker:onboard`（script：`scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/channel/agent smoke：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已打包的 OpenClaw tarball，預設透過 env-ref onboarding 設定 OpenAI 和 Telegram，執行 doctor，並執行一次模擬 OpenAI agent turn。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball、使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳過主機重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換頻道。

- 發布使用者旅程冒煙測試：`pnpm test:docker:release-user-journey` 會在乾淨的 Docker home 中全域安裝打包好的 OpenClaw tarball、執行 onboarding、設定模擬的 OpenAI provider、執行一個代理回合、安裝/解除安裝外部外掛、針對本機 fixture 設定 ClickClack、驗證傳出/傳入訊息、重新啟動閘道，並執行 doctor。
- 發布型別化 onboarding 冒煙測試：`pnpm test:docker:release-typed-onboarding` 會安裝打包好的 tarball，透過真實 TTY 驅動 `openclaw onboard`，將 OpenAI 設定為 env-ref provider，驗證不會持久保存原始金鑰，並執行模擬的代理回合。
- 發布媒體/記憶冒煙測試：`pnpm test:docker:release-media-memory` 會安裝打包好的 tarball，驗證從 PNG 附件進行影像理解、OpenAI 相容的影像生成輸出、記憶搜尋回想，以及回想在閘道重新啟動後仍保留。
- 發布升級使用者旅程冒煙測試：`pnpm test:docker:release-upgrade-user-journey` 預設會安裝比候選 tarball 舊的最新已發布基準版本，在已發布套件上設定 provider/外掛/ClickClack 狀態，升級到候選 tarball，接著重新執行核心代理/外掛/通道旅程。如果沒有較舊的已發布基準版本，則重用候選版本。使用 `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` 覆寫基準版本。
- 發布外掛市集冒煙測試：`pnpm test:docker:release-plugin-marketplace` 會從本機 fixture 市集安裝、更新已安裝外掛、解除安裝它，並驗證外掛命令列介面會隨安裝中繼資料修剪而消失。
- 技能安裝冒煙測試：`pnpm test:docker:skill-install` 會在 Docker 中全域安裝打包好的 OpenClaw tarball、在設定中停用上傳封存安裝、從搜尋解析目前即時 ClawHub skill slug、使用 `openclaw skills install` 安裝它，並驗證已安裝技能以及 `.clawhub` 來源/鎖定中繼資料。
- 更新通道切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久保存的通道和外掛更新後作業，接著切回套件 `stable` 並檢查更新狀態。
- 升級倖存者冒煙測試：`pnpm test:docker:upgrade-survivor` 會把打包好的 OpenClaw tarball 安裝到一個髒的舊使用者 fixture 上，該 fixture 含有代理、通道設定、外掛 allowlist、過時的外掛相依狀態，以及既有 workspace/session 檔案。它會在沒有即時 provider 或通道金鑰的情況下執行套件更新與非互動式 doctor，然後啟動 loopback 閘道，並檢查設定/狀態保留以及啟動/狀態預算。
- 已發布升級倖存者冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`、植入逼真的既有使用者檔案、用內建命令配方設定該基準版本、驗證產生的設定、將該已發布安裝更新到候選 tarball、執行非互動式 doctor、寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動 loopback 閘道，並檢查已設定 intents、狀態保留、啟動、`/healthz`、`/readyz` 和 RPC 狀態預算。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫一個基準版本，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 要求彙總排程器展開精確本機基準版本，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，並使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixture，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動外部 OpenClaw 外掛安裝修復。Package Acceptance 會公開這些為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析像 `last-stable-4` 或 `all-since-2026.4.23` 這類中繼基準 token，且 Full Release Validation 會將 release-soak 套件 gate 展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- Session runtime context 冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏 runtime context transcript 持久保存，以及 doctor 對受影響的重複 prompt-rewrite 分支進行修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前樹、在隔離 home 中以 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會回傳 bundled image providers 而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預建 tarball、使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過 host build，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker image 複製 `dist/`。
- Installer Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm cache。Update 冒煙測試預設使用 npm `latest` 作為 stable 基準版本，然後升級到候選 tarball。可在本機使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用 Install Smoke workflow 的 `update_baseline_version` input 覆寫。非 root installer 檢查會保留隔離的 npm cache，避免 root 擁有的 cache entry 掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重跑時重用 root/update/direct-npm cache。
- Install Smoke CI 會使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm 全域更新；需要直接 `npm install -g` 覆蓋時，請在本機執行該 script 且不要帶入該 env。
- 代理刪除共用 workspace 命令列介面冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（script：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置 root Dockerfile image，在隔離容器 home 中植入兩個代理與一個 workspace，執行 `agents delete --json`，並驗證有效 JSON 以及保留 workspace 的行為。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke image。
- 閘道網路（兩個容器，WS auth + health）：`pnpm test:docker:gateway-network`（script：`scripts/e2e/gateway-network-docker.sh`）
- 瀏覽器 CDP 快照冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（script：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置 source E2E image 加上一層 Chromium、以 raw CDP 啟動 Chromium、執行 `browser doctor --deep`，並驗證 CDP role snapshots 涵蓋 link URL、cursor-promoted clickables、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning 迴歸：`pnpm test:docker:openai-web-search-minimal`（script：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過閘道執行模擬 OpenAI server，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提高到 `low`，接著強制 provider schema reject，並檢查原始 detail 會出現在閘道 logs 中。
- MCP 通道橋接（已植入的閘道 + stdio bridge + raw Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（script：`scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw bundle MCP tools（真實 stdio MCP server + 內嵌 OpenClaw profile allow/deny 冒煙測試）：`pnpm test:docker:agent-bundle-mcp-tools`（script：`scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- 排程/subagent MCP 清理（真實閘道 + stdio MCP child 在隔離 cron 與 one-shot subagent 執行後 teardown）：`pnpm test:docker:cron-mcp-cleanup`（script：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 外掛（local path、`file:`、帶 hoisted dependencies 的 npm registry、malformed npm package metadata、git moving refs、ClawHub kitchen-sink、市集更新，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試）：`pnpm test:docker:plugins`（script：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳過 ClawHub 區塊，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設 kitchen-sink package/runtime 配對。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用 hermetic 本機 ClawHub fixture server。
- 外掛未變更更新冒煙測試：`pnpm test:docker:plugin-update`（script：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 外掛生命週期矩陣冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝打包好的 OpenClaw tarball、安裝 npm 外掛、切換啟用/停用、透過本機 npm registry 對其升級與降級、刪除已安裝程式碼，接著驗證解除安裝仍會移除過時狀態，同時記錄每個生命週期階段的 RSS/CPU metrics。
- 設定 reload metadata 冒煙測試：`pnpm test:docker:config-reload`（script：`scripts/e2e/config-reload-source-docker.sh`）
- 外掛：`pnpm test:docker:plugins` 涵蓋 local path、`file:`、帶 hoisted dependencies 的 npm registry、git moving refs、ClawHub fixtures、市集更新，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝外掛的 unchanged update 行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋資源追蹤的 npm 外掛安裝、啟用、停用、升級、降級，以及 missing-code 解除安裝。

若要手動預建並重用共用 functional image：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定時，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 這類 suite-specific image override 仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用 image 時，若本機尚不存在，script 會 pull 它。QR 和 installer Docker 測試保留自己的 Dockerfile，因為它們驗證的是 package/install 行為，而不是共用 built-app runtime。

live-model Docker runner 也會以唯讀方式 bind-mount 目前 checkout，
並將它 stage 到容器內的暫存 workdir。這會讓 runtime image 保持精簡，
同時仍能針對你的精確本機 source/config 執行 Vitest。
staging step 會跳過大型 local-only cache 和 app build
輸出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及
app-local `.build` 或 Gradle output 目錄，因此 Docker live run 不會
花數分鐘複製特定機器的 artifacts。它們也會設定
`OPENCLAW_SKIP_CHANNELS=1`，讓 gateway live probe 不會在容器內啟動真實
Telegram/Discord/等通道 worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要縮小或排除該 Docker lane 的 gateway
live coverage 時，也要傳入
`OPENCLAW_LIVE_GATEWAY_*`。

`test:docker:openwebui` 是較高層級的相容性冒煙測試：它會啟動一個已啟用 OpenAI 相容 HTTP endpoints 的
OpenClaw gateway 容器，
針對該閘道啟動 pinned Open WebUI 容器，透過
Open WebUI 登入，驗證 `/api/models` 暴露 `openclaw/default`，接著透過 Open WebUI 的 `/api/chat/completions` proxy 傳送真實 chat request。對於應該在 Open WebUI 登入和模型探索後停止、而不等待 live model
completion 的 release-path CI 檢查，請設定
`OPENWEBUI_SMOKE_MODE=models`。第一次執行可能明顯較慢，因為 Docker 可能需要
pull Open WebUI image，且 Open WebUI 可能需要完成自己的
cold-start setup。此 lane 需要可用的 live model key，可透過
process environment、staged auth profiles，或明確的
`OPENCLAW_PROFILE_FILE` 提供。成功執行會印出小型 JSON payload，例如
`{ "ok": true, "model": "openclaw/default", ... }`。

`test:docker:mcp-channels` 是刻意設計為決定性的測試，不需要
真實的 Telegram、Discord 或 iMessage 帳號。它會啟動一個已植入資料的 Gateway
容器，啟動第二個容器來產生 `openclaw mcp serve`，接著
驗證已路由的對話探索、逐字稿讀取、附件
中繼資料、即時事件佇列行為、對外傳送路由，以及透過真實 stdio MCP 橋接器傳送的 Claude 風格
頻道 + 權限通知。
通知檢查會直接檢查原始 stdio MCP frame，因此這個煙霧測試
驗證的是橋接器實際發出的內容，而不只是特定用戶端 SDK
剛好暴露的內容。

`test:docker:agent-bundle-mcp-tools` 是決定性的測試，不需要
即時模型金鑰。它會建置 repo Docker 映像、在容器內啟動真實的 stdio MCP
探測伺服器，透過
內嵌的 OpenClaw bundle MCP 執行階段具現化該伺服器、執行工具，然後驗證
`coding` 和 `messaging` 會保留 `bundle-mcp` 工具，而 `minimal` 和
`tools.deny: ["bundle-mcp"]` 會將它們過濾掉。

`test:docker:cron-mcp-cleanup` 是決定性的測試，不需要即時
模型金鑰。它會啟動一個已植入資料的 Gateway，並附帶真實的 stdio MCP 探測伺服器，
執行隔離的 cron 回合和一個 `sessions_spawn` 一次性子回合，然後
驗證 MCP 子程序會在每次執行後結束。

手動 ACP 白話執行緒煙霧測試（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此指令碼供迴歸/偵錯工作流程使用。ACP 執行緒路由驗證之後可能還會再次需要它，因此不要刪除。

實用環境變數：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` 會被掛載，並在執行測試前載入
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用於只驗證從 `OPENCLAW_PROFILE_FILE` 載入的環境變數，使用暫時的 config/workspace 目錄，且不掛載外部命令列介面 auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`，除非該次執行已使用 CI/受管理的 bind 目錄）掛載到 `/home/node/.npm-global`，供 Docker 內快取命令列介面安裝使用
- `$HOME` 底下的外部命令列介面 auth 目錄/檔案會以唯讀方式掛載到 `/host-auth...` 底下，然後在測試開始前複製到 `/home/node/...`
  - 預設目錄（當執行未縮小到特定提供者時使用）：`.factory`、`.gemini`、`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 已縮小的提供者執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要目錄/檔案
  - 可使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的逗號清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於在容器內篩選提供者
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於在不需要重新建置的重新執行中重用既有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保憑證來自 profile store（而不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 Gateway 為 Open WebUI 煙霧測試暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI 煙霧測試使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫釘選的 Open WebUI 映像標籤

## 文件健全性檢查

文件編輯後執行文件檢查：`pnpm check:docs`。
當你也需要頁內標題檢查時，執行完整的 Mintlify anchor 驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI 安全）

這些是不使用真實提供者的「真實管線」迴歸：

- Gateway 工具呼叫（mock OpenAI，真實 gateway + agent loop）：`src/gateway/gateway.test.ts`（案例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway 精靈（WS `wizard.start`/`wizard.next`，寫入 config + 強制 auth）：`src/gateway/gateway.test.ts`（案例："runs wizard over ws and writes auth token config"）

## Agent 可靠性評估（Skills）

我們已經有幾個 CI 安全測試，其行為類似「agent 可靠性評估」：

- 透過真實 gateway + agent loop 的 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 和 config 效果的端對端精靈流程（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請見 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當 prompt 中列出 skills 時，agent 是否會選擇正確的 skill（或避開無關的 skill）？
- **合規：** agent 是否會在使用前讀取 `SKILL.md`，並遵循必要步驟/args？
- **工作流程契約：** 斷言工具順序、session history carryover 和 sandbox 邊界的多回合情境。

未來的評估應先保持決定性：

- 使用 mock providers 的情境執行器，用於斷言工具呼叫 + 順序、skill 檔案讀取，以及 session wiring。
- 一小組聚焦 skill 的情境（使用 vs 避免、gating、prompt injection）。
- 選用即時評估（opt-in、env-gated）只在 CI 安全套件就位後再加入。

## 契約測試（外掛與頻道形狀）

契約測試會驗證每個已註冊的外掛和頻道都符合
其介面契約。它們會迭代所有已發現的外掛，並執行一組
形狀與行為斷言。預設的 `pnpm test` 單元 lane
會刻意略過這些共用 seam 和 smoke 檔案；當你觸及共用頻道或提供者 surface 時，
請明確執行契約
命令。

### 命令

- 所有契約：`pnpm test:contracts`
- 僅頻道契約：`pnpm test:contracts:channels`
- 僅提供者契約：`pnpm test:contracts:plugins`

### 頻道契約

位於 `src/channels/plugins/contracts/*.contract.test.ts`。目前
頂層分類：

- **channel-catalog** - bundled/registry 頻道 catalog entry 中繼資料
- **plugin**（registry-backed、sharded）- 基本外掛註冊形狀
- **surfaces-only**（registry-backed、sharded）- 對 `actions`、`setup`、`status`、`outbound`、`messaging`、`threading`、`directory` 和 `gateway` 進行 per-surface 形狀檢查
- **session-binding**（registry-backed）- session binding 行為
- **outbound-payload** - 訊息 payload 結構與正規化
- **group-policy**（fallback）- 每個頻道的預設 group policy enforcement
- **threading**（registry-backed、sharded）- thread id 處理
- **directory**（registry-backed、sharded）- directory/roster API
- **registry** 和 **plugins-core.\*** - 頻道外掛 registry、loader 和 config-write authorization 內部機制

這些套件使用的 inbound dispatch-capture 和 outbound-payload harness helper
會透過 `src/plugin-sdk/channel-contract-testing.ts` 在內部暴露
（npm-excluded，不是公開 SDK subpath）；此目錄中沒有獨立的
`inbound.contract.test.ts` 檔案。

### 提供者契約

位於 `src/plugins/contracts/*.contract.test.ts`。目前分類
包括：

- **shape** - 外掛 manifest、API 和 runtime export 形狀
- **plugin-registration**（+ parallel）- manifest 註冊案例
- **package-manifest** - package manifest 要求
- **loader** - 外掛 loader setup/teardown 行為
- **registry** - 外掛契約 registry 內容與查詢
- **providers** - 跨 bundled providers 的共用提供者行為，加上 web-search providers
- **auth-choice** - auth choice 中繼資料與 setup 行為
- **provider-catalog-deprecation** - 已棄用 provider catalog 中繼資料
- **wizard.choice-resolution**、**wizard.model-picker**、**wizard.setup-options** - 提供者 setup wizard 契約
- **embedding-provider**、**memory-embedding-provider**、**web-fetch-provider**、**tts** - capability-specific provider 契約
- **session-actions**、**session-attachments**、**session-entry-projection** - 外掛擁有的 session state 契約
- **scheduled-turns** - 外掛 scheduled turn 中繼資料與 timestamp bounds
- **host-hooks**、**run-context-lifecycle**、**runtime-import-side-effects**、**runtime-seams** - 外掛 host/runtime lifecycle 與 import-boundary 契約
- **extension-runtime-dependencies** - extensions 的 runtime dependency placement

### 何時執行

- 變更 plugin-sdk exports 或 subpaths 後
- 新增或修改頻道或提供者外掛後
- 重構外掛註冊或探索後

契約測試會在 CI 中執行，不需要真實 API 金鑰。

## 新增迴歸（指南）

當你修正在 live 中發現的提供者/模型問題時：

- 盡可能新增 CI 安全迴歸（mock/stub provider，或捕捉精確的 request-shape transformation）
- 如果本質上只能 live 測試（rate limits、auth policies），請讓 live test 保持窄範圍，並透過 env vars opt-in
- 優先鎖定能捕捉 bug 的最小層級：
  - provider request conversion/replay bug -> direct models test
  - gateway session/history/tool pipeline bug -> gateway live smoke 或 CI 安全 gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry 中繼資料（`listSecretTargetRegistryEntries()`）為每個 SecretRef class 推導一個 sampled target，然後斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增新的 `includeInPlan` SecretRef target family，請更新該測試中的 `classifyTargetClass`。此測試會刻意在未分類的 target ids 上失敗，讓新 class 無法被靜默略過。

## 相關

- [測試 live](/zh-TW/help/testing-live)
- [測試更新和外掛](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
