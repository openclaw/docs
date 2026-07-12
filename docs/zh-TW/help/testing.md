---
read_when:
    - 在本機或 CI 中執行測試
    - 新增模型／供應商錯誤的迴歸測試
    - 偵錯閘道與代理程式行為
summary: 測試工具組：單元／端對端／即時測試套件、Docker 執行器，以及各項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-07-12T14:33:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三套 Vitest 測試套件（單元／整合、端對端、即時），以及 Docker
執行器。本頁說明每套測試涵蓋的範圍、特定工作流程應執行的命令、即時測試如何探索認證資訊，以及如何為真實環境中的供應商／模型錯誤新增
迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、即時傳輸通道）**另有獨立文件：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) - 架構、命令介面、情境編寫。
- [Matrix QA](/zh-TW/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的參考資料。
- [成熟度計分卡](/zh-TW/maturity/scorecard) - 發行版 QA 證據如何支援穩定性與 LTS 決策。
- [QA 頻道](/zh-TW/channels/qa-channel) - 由儲存庫支援的情境所使用的合成傳輸外掛。

本頁涵蓋一般測試套件與 Docker／Parallels 執行器。下方的 [QA 專用執行器](#qa-specific-runners) 列出具體的 `qa` 呼叫方式，並連回上述參考資料。
</Note>

## 快速開始

大多數日常情況：

- 完整閘門（推送前應執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充裕的機器上較快地於本機執行完整套件：`pnpm test:max`
- 直接執行 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案也會正確路由外掛／頻道路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 反覆處理單一失敗時，優先執行目標明確的測試。
- 由 Docker 支援的 QA 站台：`pnpm qa:lab:up`
- 由 Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

修改測試或需要更多信心時：

- 僅供參考的 V8 覆蓋率報告：`pnpm test:coverage`
- 端對端測試套件：`pnpm test:e2e`

## 測試暫存目錄

對於測試所擁有的暫存目錄，請使用 `test/helpers/temp-dir.ts` 中的共用輔助工具，
如此所有權會明確標示，且清理作業會維持在測試生命週期內：

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("使用暫存工作區", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // 使用工作區
});
```

`useAutoCleanupTempDirTracker(afterEach)` 刻意不提供手動清理
方法，因為 Vitest 會在每項測試後負責清理。較舊的低階
輔助工具（`makeTempDir`、`cleanupTempDirs`、`createTempDirTracker`）仍然存在，
供尚未遷移的測試使用；請避免新增其用法，也不要新增直接
呼叫 `fs.mkdtemp*` 的程式碼，除非測試明確要驗證原始暫存目錄
行為。若確實需要直接建立暫存目錄，請新增可稽核的允許
註解並說明原因：

```ts
// openclaw-temp-dir: allow 驗證原始 fs 清理行為
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` 會報告新增差異行中直接建立暫存目錄
和新增手動使用共用輔助工具的情況，
但不會封鎖既有的清理方式。其使用與 `scripts/changed-lanes.mjs`
相同的測試路徑分類，並略過共用輔助工具本身的實作。
對於已變更的測試路徑，`check:changed` 會執行此報告，作為
僅警告的 CI 訊號（GitHub 警告註解，而非失敗）。

## 即時與 Docker／Parallels 工作流程

偵錯真實供應商／模型時（需要真實認證資訊）：

- 即時測試套件（模型 + 閘道工具／影像探查）：`pnpm test:live`
- 安靜地指定單一即時測試檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：分派 `OpenClaw Performance`，並設定
  `live_openai_candidate=true` 以執行真實的 `openai/gpt-5.6-luna` 代理程式回合，或設定
  `deep_profile=true` 以產生 Kova CPU／堆積／追蹤成品。每日排程執行會透過獨立的成品消費發布工作，將模擬供應商、深度剖析與 GPT-5.6 Luna 通道報告發布至
  `openclaw/clawgrit-reports`；
  發布者驗證缺失或無效時，排程執行及
  `profile=release` 執行都會失敗。手動的非發行分派會保留 GitHub 成品，
  並將報告發布視為建議性作業。模擬供應商報告還包含
  來源層級的閘道啟動、記憶體、外掛壓力、重複的
  假模型 hello 迴圈，以及命令列介面啟動數據。
- Docker 即時模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型都會執行一個文字回合，以及一個小型的檔案讀取式探查。
    中繼資料宣告支援 `image` 輸入的模型，也會執行一個微型影像回合。
    在隔離供應商失敗時，可透過 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探查。
  - CI 覆蓋範圍：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手動的
    `OpenClaw Release Checks` 都會使用
    `include_live_suites: true` 呼叫可重複使用的即時／端對端工作流程，其中包括依供應商分片的 Docker 即時模型矩陣工作。
  - 若要針對性地重新執行 CI，請分派 `OpenClaw Live And E2E Checks (Reusable)`，
    並設定 `include_live_suites: true` 和 `live_models_only: true`。
  - 將新的高訊號供應商祕密新增至 `scripts/ci-hydrate-live-auth.sh`、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`，以及其
    排程／發行呼叫端。
- 原生 Codex 綁定聊天煙霧測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker 即時通道，使用 `/codex bind`
    綁定合成的 Slack 私訊，測試 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆與影像附件會透過原生外掛綁定路由，而非 ACP。
- Codex app-server 測試框架煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過外掛所擁有的 Codex app-server
    測試框架執行閘道代理程式回合、驗證 `/codex status` 和 `/codex models`，並預設
    測試影像、排程 MCP、子代理程式與 Guardian 探查。在隔離其他失敗時，可透過
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用
    子代理程式探查。若要執行針對性的子代理程式檢查，請停用
    其他探查：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，
    否則會在子代理程式探查後結束。
- Codex 隨需安裝煙霧測試：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安裝已封裝的 OpenClaw tarball、執行 OpenAI API 金鑰
    入門設定，並驗證 Codex 外掛與 `@openai/codex` 相依套件
    已隨需下載至受管理的 npm 專案根目錄。
- 即時外掛工具相依套件煙霧測試：`pnpm test:docker:live-plugin-tool`
  - 封裝一個具有真實 `slugify` 相依套件的固定測試外掛、透過
    `npm-pack:` 安裝、驗證受管理 npm 專案根目錄下的相依套件，
    然後要求即時 OpenAI 模型呼叫外掛工具並傳回隱藏的 slug。
- Crestodian 救援命令煙霧測試：`pnpm test:live:crestodian-rescue-channel`
  - 選用的雙重保險檢查，用於訊息頻道救援命令
    介面。測試 `/crestodian status`、將持續性模型
    變更排入佇列、回覆 `/crestodian yes`，並驗證稽核／設定寫入
    路徑。
- Crestodian 首次執行 Docker 煙霧測試：`pnpm test:docker:crestodian-first-run`
  - 從空白的 OpenClaw 狀態目錄開始，並先證明封裝的
    `openclaw crestodian` 命令列介面會在沒有推論時以封閉方式失敗。接著
    透過封裝的啟用模組測試並啟用假的 Claude。
    只有在此之後，模糊的封裝命令列介面請求才會到達規劃器並
    解析為具型別的設定，接著執行一次性的模型、代理程式、Discord 外掛
    與 SecretRef 作業。它會驗證設定與稽核項目。這是
    輔助性的閘門／作業證據，不是互動式入門設定，也不是
    Crestodian 代理程式／工具／核准證明。相同通道也會透過
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 公開於 QA Lab。
- Moonshot／Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對 `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且
  助理逐字稿儲存正規化的 `usage.cost`。

<Tip>
若只需要處理單一失敗案例，請優先透過下述允許清單環境變數縮小即時測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA Lab 的真實度時，這些命令可搭配主要測試套件使用。

CI 會在專用工作流程中執行 QA Lab。代理式同等性測試包含在
`QA-Lab - All Lanes` 和發行驗證中，而非獨立的 PR 工作流程。
廣泛驗證應使用 `Full Release Validation`，並設定
`rerun_group=qa-parity`，或使用發行檢查的 QA 群組。穩定版／預設發行
檢查會將詳盡的即時／Docker 壓力測試保留在 `run_release_soak=true` 後方；
`full` 設定檔則會強制啟用壓力測試。`QA-Lab - All Lanes` 每晚在 `main` 上執行，
也可手動分派，將模擬同等性通道、即時 Matrix 通道、
由 Convex 管理的即時 Telegram 通道，以及由 Convex 管理的即時 Discord 通道作為
平行工作執行。排程 QA 與發行檢查會明確向 Matrix 傳遞 `--profile fast`，
而 Matrix 命令列介面與手動工作流程輸入的預設值仍為
`all`；手動分派可將 `all` 分片成 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 工作。`OpenClaw Release Checks` 會在發行核准前執行
同等性測試，以及快速 Matrix 與 Telegram 通道，並對發行傳輸檢查使用
`mock-openai/gpt-5.6-luna`，以維持確定性並避開一般的供應商外掛啟動流程。這些即時傳輸閘道
會停用記憶體搜尋；記憶體行為仍由 QA 同等性測試套件涵蓋。

完整發行版的即時媒體分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker 即時模型／後端分片使用共用的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，針對每個選取的
提交僅建置一次，之後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 提取該映像，而非在每個分片中重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由儲存庫支援的 QA 情境。
  - 針對所選情境集寫入頂層 `qa-evidence.json`、`qa-suite-summary.json` 和
    `qa-suite-report.md` 成品，包括混合流程、Vitest 和 Playwright
    情境選項。
  - 透過 `pnpm openclaw qa run --qa-profile <profile>` 分派時，會將
    所選分類設定檔的評分卡嵌入同一個 `qa-evidence.json`。
    `smoke-ci` 會寫入精簡證據（`evidenceMode: "slim"`，沒有各項目的
    `execution`）。`release` 涵蓋精選的發行就緒範圍；`all`
    會選取每個作用中的成熟度類別，並在需要完整評分卡成品時，以明確的 QA Profile
    Evidence 工作流程分派為目標。
  - 預設使用隔離的閘道工作程序，平行執行多個所選情境。`qa-channel`
    的預設並行數為 4（受所選情境數量限制）。使用 `--concurrency <count>`
    調整工作程序數量，或使用 `--concurrency 1` 執行較舊的循序作業線。
  - 任一情境失敗時會以非零狀態結束。若要產生成品但不回傳失敗結束碼，請使用
    `--allow-failures`。
  - 支援供應商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動由本機 AIMock 支援的供應商伺服器，以進行實驗性的
    固定資料與協定模擬涵蓋，而不取代可感知情境的
    `mock-openai` 作業線。
- `pnpm openclaw qa coverage --match <query>`
  - 搜尋情境 ID、標題、介面、涵蓋範圍 ID、文件參照、程式碼
    參照、外掛和供應商需求，然後列印相符的套件
    目標。
  - 如果你知道受影響的行為或檔案路徑，但不知道最小的情境，請在執行 QA Lab
    前使用此命令。這僅供建議用途——仍須根據所變更的行為，選擇模擬、
    即時、Multipass、Matrix 或傳輸層證明。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink 外掛的完整考驗。
    安裝外部 Kitchen Sink 套件、驗證外掛 SDK
    介面清單、探查 `/healthz` 和 `/readyz`、記錄閘道
    CPU/RSS 證據、執行一次即時 OpenAI 回合，並檢查對抗性
    診斷。需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在
    已預載的 Testbox 工作階段中，若存在 `openclaw-testbox-env`
    輔助工具，會自動載入 Testbox 即時驗證
    設定檔。
- `pnpm test:gateway:cpu-scenarios`
  - 執行閘道啟動基準測試以及一小組模擬 QA Lab 情境套件
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並將合併的 CPU 觀察
    摘要寫入 `.artifacts/gateway-cpu-scenarios/`。
  - 預設僅標記持續的高 CPU 觀察（`--cpu-core-warn`，
    預設值 `0.9`；`--hot-wall-warn-ms`，預設值 `30000`），因此短暫的啟動
    高峰會記錄為指標，而不會看起來像持續數分鐘的
    閘道滿載迴歸。
  - 針對已建置的 `dist` 成品執行；如果目前簽出尚無最新的執行階段輸出，
    請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在可拋棄的 Multipass Linux VM 中執行相同的 QA 套件，並保留與
    `qa suite` 相同的情境選擇及供應商/模型旗標。
  - 即時執行會轉送可供客體使用的 QA 驗證輸入：
    以環境變數為基礎的供應商金鑰、QA 即時供應商設定路徑，以及
    存在時的 `CODEX_HOME`。
  - 輸出目錄必須位於儲存庫根目錄下，客體才能透過掛載的工作區
    寫回。
  - 將一般 QA 報告與摘要，以及 Multipass 記錄寫入
    `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 啟動由 Docker 支援的 QA 網站，以進行操作人員形式的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前簽出建置 npm tarball，在 Docker 中全域安裝，
    執行非互動式 OpenAI API 金鑰導入，預設設定
    Telegram，驗證封裝的外掛執行階段可載入而不需
    修復啟動相依性，執行 doctor，並針對模擬的 OpenAI 端點
    執行一次本機代理程式回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`，透過 Discord 執行相同的封裝安裝
    作業線。
- `pnpm test:docker:session-runtime-context`
  - 針對內嵌執行階段情境逐字記錄，執行可重現的已建置應用程式 Docker 煙霧測試。
    驗證隱藏的 OpenClaw 執行階段情境會持續儲存為
    不顯示的自訂訊息，而不會洩漏至可見的使用者
    回合，接著植入受影響且損壞的工作階段 JSONL，並驗證
    `openclaw doctor --fix` 會在建立備份後，將其改寫至作用中的分支。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 候選套件，執行已安裝套件的
    導入流程，透過已安裝的命令列介面設定 Telegram，然後重複使用
    即時 Telegram QA 作業線，並以該已安裝套件作為受測系統
    閘道。
  - 包裝器只會從簽出掛載 `qa-lab` 測試工具原始碼；
    已安裝套件擁有 `dist`、`openclaw/plugin-sdk` 和隨附的
    外掛執行階段，因此此作業線不會將目前簽出的外掛混入
    受測套件。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而非
    從登錄檔安裝。
  - 預設透過 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`，在
    `qa-evidence.json` 中輸出重複的 RTT 計時。覆寫
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 以調整執行。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` 接受以逗號分隔的
    Telegram QA 檢查 ID 清單作為取樣對象；若未設定，預設支援 RTT 的
    檢查是 `telegram-mentioned-message-reply`。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram 環境認證資訊或 Convex 認證資訊來源。
    對於 CI/發行自動化，請設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色祕密。如果 CI 中存在
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色祕密，
    Docker 包裝器會自動選取 Convex。
  - 包裝器會在 Docker 建置/安裝工作前，於主機上驗證 Telegram 或 Convex
    認證資訊環境變數。只有在刻意偵錯認證資訊設定前的流程時，才設定
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此作業線覆寫
    共用的 `OPENCLAW_QA_CREDENTIAL_ROLE`。選取 Convex
    認證資訊且未設定角色時，包裝器在 CI 中使用 `ci`，
    在 CI 外使用 `maintainer`。
  - GitHub Actions 將此作業線公開為手動維護者工作流程
    `NPM Telegram Beta E2E`。它不會在合併時執行。此工作流程使用
    `qa-live-shared` 環境和 Convex CI 認證資訊租約。
- GitHub Actions 也提供 `Package Acceptance`，用於針對單一候選套件執行額外的產品證明。
  它接受 Git 參照、已發布的 npm 規格、
  HTTPS tarball URL 加 SHA-256、受信任 URL 政策，或來自其他執行的 tarball 成品
  （`source=ref|npm|url|trusted-url|artifact`），上傳標準化的
  `openclaw-current.tgz` 作為 `package-under-test`，然後使用 `smoke`、`package`、
  `product`、`full` 或 `custom` 作業線設定檔執行現有的 Docker E2E 排程器。
  設定 `telegram_mode=mock-openai` 或
  `live-frontier`，即可針對相同的
  `package-under-test` 成品執行 Telegram QA 工作流程。
  - 最新 beta 產品證明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精確的 tarball URL 證明需要摘要，並使用公開 URL 安全政策：

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

`source=trusted-url` 會從受信任的工作流程參照讀取 `.github/package-trusted-sources.json`，且不接受 URL 認證資訊或透過工作流程輸入繞過私人網路限制。如果指定的政策宣告使用持有人驗證，請設定固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 祕密。

- 成品證明會從另一個 Actions 執行下載 tarball 成品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw 建置版本，以已設定的 OpenAI
    啟動閘道，然後透過設定編輯啟用隨附的頻道/外掛。
  - 驗證設定探索會讓未設定且可下載的外掛
    保持不存在、首次設定後的 doctor 修復會明確安裝每個缺少的
    可下載外掛，且第二次重新啟動不會執行
    隱藏的相依性修復。
  - 也會安裝已知的較舊 npm 基準版本，在執行
    `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證
    候選版本更新後的 doctor 會清除舊版外掛相依性殘留，
    而不需測試工具端的安裝後修復。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels 客體執行原生封裝安裝更新煙霧測試。
    每個選取的平台會先安裝所要求的基準套件，
    然後在同一客體中執行已安裝的 `openclaw update` 命令，並
    驗證已安裝版本、更新狀態、閘道就緒狀態，以及
    一次本機代理程式回合。
  - 針對單一客體反覆測試時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。
    使用 `--json` 取得摘要成品
    路徑和各作業線狀態。
  - OpenAI 作業線預設使用 `openai/gpt-5.6-luna` 進行即時代理程式回合證明。
    傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL`，即可驗證另一個 OpenAI 模型。
  - 為長時間的本機執行加上主機逾時，以免 Parallels 傳輸停滯
    耗盡剩餘的測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 此指令碼會將巢狀作業線記錄寫入
    `/tmp/openclaw-parallels-npm-update.*`。在假設外層
    包裝器已停滯前，請檢查 `windows-update.log`、
    `macos-update.log` 或 `linux-update.log`。
  - 在冷啟動客體上，Windows 更新可能會花費 10 到 15 分鐘執行更新後的 doctor 和
    套件更新工作；只要巢狀 npm 偵錯記錄仍持續推進，
    就仍屬正常。
  - 請勿將此彙總包裝器與個別 Parallels
    macOS、Windows 或 Linux 煙霧測試作業線平行執行。它們共用 VM 狀態，可能會在
    快照還原、套件提供服務或客體閘道狀態上
    發生衝突。
  - 更新後的證明會執行一般的隨附外掛介面，因為
    語音、影像生成和媒體
    理解等功能外觀介面，即使代理程式
    回合本身只檢查簡單的文字回應，也會透過隨附的執行階段 API 載入。

- `pnpm openclaw qa aimock`
  - 僅啟動本機 AIMock 提供者伺服器，以進行直接通訊協定冒煙測試。
- `pnpm openclaw qa matrix`
  - 針對由 Docker 支援、可拋棄的 Tuwunel 家伺服器執行 Matrix 即時 QA 執行通道。僅限原始碼簽出環境——封裝安裝不會隨附 `qa-lab`。
  - 完整的命令列介面、設定檔／情境目錄、環境變數及成品配置：
    [Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用環境變數中的驅動程式與 SUT 機器人權杖，針對真實私人群組執行 Telegram 即時 QA 執行通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 及
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群組 ID 必須是數字格式的
    Telegram 聊天 ID。
  - 支援使用 `--credential-source convex` 取得共用集區認證資訊。
    預設使用環境變數模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    以選用集區租約。
  - 預設涵蓋金絲雀測試、提及閘控、命令定址、`/status`、
    機器人之間的提及回覆，以及核心原生命令回覆。
    `mock-openai` 預設值也涵蓋確定性的回覆鏈與
    Telegram 最終訊息串流迴歸。使用 `--list-scenarios`
    查看 `session_status` 等選用探查。
  - 任何情境失敗時，會以非零狀態碼結束。若要產生成品但不使用失敗結束碼，
    請使用 `--allow-failures`。
  - 需要同一私人群組中的兩個不同機器人，且 SUT 機器人必須公開
    Telegram 使用者名稱。
  - 為了穩定觀察機器人之間的互動，請在 `@BotFather` 中為兩個機器人啟用 Bot-to-Bot Communication Mode，並確保驅動程式機器人可以觀察群組中的機器人流量。
  - 會在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要及 `qa-evidence.json`。包含回覆的情境會記錄從驅動程式傳送要求到觀察到 SUT 回覆的 RTT。

`Mantis Telegram Live` 是此執行通道的 PR 證據包裝器。它會使用透過 Convex 租用的 Telegram 認證資訊執行候選參照，在 Crabbox 桌面瀏覽器中呈現經遮蔽處理的 QA 報告／證據套件、錄製 MP4 證據、產生裁除靜止片段的 GIF、上傳成品套件，並在設定 `pr_number` 時透過 Mantis GitHub App 發布行內 PR 證據。維護者可以從 Actions UI 透過 `Mantis Scenario`
（`scenario_id: telegram-live`）啟動，或直接透過提取要求留言啟動：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用於 PR 視覺證據、具代理能力的原生 Telegram Desktop 前後對照包裝器。你可以從 Actions UI 使用自由格式的 `instructions`、透過 `Mantis Scenario`（`scenario_id:
telegram-desktop-proof`），或透過 PR 留言啟動：

```text
@openclaw-mantis telegram desktop proof
```

Mantis 代理程式會讀取 PR、判斷哪種 Telegram 可見行為能證明此變更、在基準與候選參照上執行真實使用者 Crabbox Telegram Desktop 證據執行通道、反覆調整直到原生 GIF 可用、寫入成對的 `motionPreview` 資訊清單，並在設定 `pr_number` 時透過 Mantis GitHub App 發布相同的雙欄 GIF 表格。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重複使用 Crabbox Linux 桌面、安裝原生 Telegram Desktop、使用租用的 Telegram SUT 機器人權杖設定 OpenClaw、啟動閘道，並從可見的 VNC 桌面錄製螢幕截圖／MP4 證據。
  - 預設使用 `--credential-source convex`，因此工作流程只需要 Convex 代理程式密鑰。若使用 `--credential-source env`，請採用與 `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 變數。
  - Telegram Desktop 仍需要使用者登入／設定檔。機器人權杖只會設定 OpenClaw。可使用 `--telegram-profile-archive-env <name>` 指定 base64 `.tgz` 設定檔封存檔，或使用 `--keep-lease`，再透過 VNC 手動登入一次。
  - 會在輸出目錄下寫入 `mantis-telegram-desktop-builder-report.md`、
    `mantis-telegram-desktop-builder-summary.json`、
    `telegram-desktop-builder.png` 及 `telegram-desktop-builder.mp4`。

即時傳輸執行通道共用一套標準契約，避免新增傳輸方式時產生偏離；各執行通道的涵蓋矩陣位於
[QA 概觀——即時傳輸涵蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。
`qa-channel` 是廣泛的合成測試套件，不屬於該矩陣。

### 透過 Convex 共用 Telegram 認證資訊（v1）

為即時傳輸 QA 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA 實驗室會從 Convex 支援的集區取得獨占租約、在執行通道運作期間對該租約執行心跳偵測，並在關閉時釋放租約。此章節名稱早於 Discord、Slack 與 WhatsApp 支援；各類型共用相同的租約契約。

Convex 專案參考骨架：`qa/convex-credential-broker/`

必要環境變數：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色需要一個密鑰：
  - `maintainer` 使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 使用 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認證資訊角色選擇：
  - 命令列介面：`--credential-role maintainer|ci`
  - 環境變數預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，其他情況預設為 `maintainer`）

選用環境變數：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用追蹤 ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許僅供本機開發使用的回送 `http://` Convex URL。

正常運作時，`OPENCLAW_QA_CONVEX_SITE_URL` 應使用 `https://`。

維護者管理命令（集區新增／移除／列出）明確要求
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供維護者使用的命令列介面輔助工具：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor`，可在不列印密鑰值的情況下檢查 Convex 網站 URL、代理程式密鑰、端點前綴、HTTP 逾時，以及管理／列出功能的可達性。在指令碼與 CI 公用程式中使用 `--json` 取得機器可讀的輸出。

預設端點契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）。
要求使用 `Authorization: Bearer <role secret>` 標頭進行驗證；
以下主體省略該標頭：

- `POST /acquire`
  - 要求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗盡／可重試：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - 要求：`{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 成功：`{ status: "ok", index, data }`
- `POST /heartbeat`
  - 要求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空白 `2xx`）
- `POST /release`
  - 要求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空白 `2xx`）
- `POST /admin/add`（僅限維護者密鑰）
  - 要求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（僅限維護者密鑰）
  - 要求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 有效租約防護：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅限維護者密鑰）
  - 要求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 類型的承載資料格式：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字格式的 Telegram 聊天 ID 字串。
- `admin/add` 會驗證 `kind: "telegram"` 的此格式，並拒絕格式錯誤的承載資料。

Telegram 真實使用者類型的承載資料格式：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 及 `telegramApiId` 必須是數字字串。
- `tdlibArchiveSha256` 及 `desktopTdataArchiveSha256` 必須是 SHA-256 十六進位字串。
- `kind: "telegram-user"` 保留供 Mantis Telegram Desktop 證據工作流程使用。一般 QA 實驗室執行通道不得取得此類型。

由代理程式驗證的多頻道承載資料：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 執行通道也可以從集區租用，但 Slack 承載資料驗證目前位於 Slack QA 執行器，而非代理程式中。Slack 資料列請使用
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 將頻道新增至 QA

新頻道介面卡的架構與情境輔助工具名稱位於
[QA 概觀——新增頻道](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。
最低要求：在共用 `qa-lab` 主機接縫上實作傳輸執行器、為共用情境新增 `adapterFactory`、在外掛資訊清單中宣告 `qaRunners`、掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫情境。

## 測試套件（各自在哪裡執行）

可以將這些套件視為“真實程度逐步提高”（不穩定性／成本也會隨之提高）。

### 單元／整合（預設）

- 命令：`pnpm test`
- 設定：未指定目標的執行使用 `vitest.full-*.config.ts` 分片集合，並可能將多專案分片展開為各專案設定，以便平行排程
- 檔案：`src/**/*.test.ts`、`packages/**/*.test.ts` 及 `test/**/*.test.ts` 下的核心／單元測試清單；UI 單元測試在專用的 `unit-ui` 分片中執行
- 範圍：
  - 純單元測試
  - 程序內整合測試（閘道驗證、路由、工具、剖析、設定）
  - 已知錯誤的確定性迴歸測試
- 預期：
  - 在 CI 中執行
  - 不需要真實金鑰
  - 應快速且穩定
  - 解析器與公開介面載入器測試必須使用產生的小型外掛測試資料，證明廣泛的 `api.js` 與 `runtime-api.js` 備援行為，而非使用真實的內建外掛來源 API。真實外掛 API 載入應置於外掛自有的契約／整合套件中。

原生相依套件政策：

- 預設測試安裝會略過選用的原生 Discord opus 建置。Discord 語音使用內建的 `libopus-wasm`，而 `@discordjs/opus` 在 `allowBuilds` 中維持停用，因此本機測試與 Testbox 執行通道不會編譯原生附加元件。
- 請在 `libopus-wasm` 基準測試儲存庫中比較原生 opus 效能，而非在預設 OpenClaw 安裝／測試迴圈中進行。不要在預設 `allowBuilds` 中將 `@discordjs/opus` 設為 `true`；這會導致無關的安裝／測試迴圈編譯原生程式碼。

<AccordionGroup>
  <Accordion title="專案、分片及限定範圍的執行通道">

    - 未指定目標的 `pnpm test` 會執行十三個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-tooling`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是執行單一龐大的原生根專案程序。這可降低高負載機器上的 RSS 峰值，並避免 auto-reply／外掛工作耗盡資源，導致不相關的測試套件無法執行。
    - `pnpm test --watch` 仍會使用原生根目錄 `vitest.config.ts` 的專案圖，因為多分片監看迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會優先透過範圍限定的通道處理明確的檔案／目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承擔完整根專案的啟動成本。
    - `pnpm test:changed` 預設會將變更的 git 路徑展開到低成本的範圍限定通道：直接變更的測試、同層的 `*.test.ts` 檔案、明確的原始碼對應，以及本機匯入圖中的相依項目。設定／初始化／套件變更不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是針對小範圍工作的常規智慧型本機檢查關卡。它會將差異分類為核心、核心測試、擴充套件、擴充套件測試、應用程式、文件、發行中繼資料、即時 Docker 工具及一般工具，然後執行相符的型別檢查、lint 和防護命令。它不會執行 Vitest 測試；若需要測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅涉及發行中繼資料的版本升級會執行針對性的版本／設定／根相依套件檢查，並透過防護機制拒絕頂層版本欄位以外的套件變更。
    - 即時 Docker ACP 測試工具的編輯會執行聚焦檢查：檢查即時 Docker 驗證指令碼的 shell 語法，並對即時 Docker 排程器執行試跑。只有在差異僅限於 `scripts["test:docker:live-*"]` 時才會包含 `package.json` 變更；相依套件、匯出、版本及其他套件介面的編輯仍使用較廣泛的防護機制。
    - 來自代理程式、命令、外掛、auto-reply 輔助程式、`plugin-sdk` 及類似純工具區域、匯入負擔較低的單元測試，會透過 `unit-fast` 通道執行並略過 `test/setup-openclaw-runtime.ts`；具有狀態或執行階段負擔較高的檔案則維持使用既有通道。
    - 選定的 `plugin-sdk` 和 `commands` 輔助原始碼檔案也會在變更模式執行時，對應至這些輕量通道中的明確同層測試，因此編輯輔助程式時，不必重新執行該目錄完整且負擔較高的測試套件。
    - `auto-reply` 針對頂層核心輔助程式、頂層 `reply.*` 整合測試及 `src/auto-reply/reply/**` 子樹提供專用分組。CI 會進一步將 reply 子樹拆分為 agent-runner、dispatch 及 commands/state-routing 分片，避免單一匯入負擔較高的分組占用完整的 Node 尾端執行時間。
    - 一般 PR／main CI 會刻意略過隨附外掛批次全面測試及僅供發行使用的 `agentic-plugins` 分片。完整發行驗證會針對發行候選版本，分派獨立的 `Plugin Prerelease` 子工作流程來執行這些外掛密集型測試套件。

  </Accordion>

  <Accordion title="內嵌執行器涵蓋範圍">

    - 變更訊息工具探索輸入或壓縮執行階段
      情境時，請維持兩個層級的涵蓋範圍。
    - 針對純路由及正規化
      邊界新增聚焦的迴歸測試。
    - 維持內嵌執行器整合測試套件正常運作：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - 這些測試套件會驗證範圍限定的 ID 和壓縮行為仍會流經
      實際的 `run.ts`／`compact.ts` 路徑；僅有輔助程式測試
      並不足以取代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest 集區與隔離預設值">

    - 基礎 Vitest 設定預設使用 `threads`。
    - 共用 Vitest 設定固定使用 `isolate: false`，並在根專案、端對端及即時設定中使用
      非隔離執行器。
    - 根 UI 通道會保留其 `jsdom` 初始化及最佳化工具，但也會在
      共用的非隔離執行器上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest 設定繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 的 Node 子
      程序加入 `--no-maglev`，以減少大型本機執行期間的 V8 編譯反覆作業。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與原始 V8
      行為進行比較。
    - `scripts/run-vitest.mjs` 會在明確的非監看 Vitest 執行
      連續 5 分鐘沒有 stdout 或 stderr 輸出後將其終止。若要在
      刻意無輸出的調查中停用監視器，請設定
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示差異觸發哪些架構通道。
    - pre-commit 掛鉤僅執行格式化。它會重新暫存已格式化的檔案，
      而不會執行 lint、型別檢查或測試。
    - 當你需要智慧型本機檢查關卡時，請在交付或推送前
      明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本的範圍限定通道進行路由。只有在代理程式
      判定測試工具、設定、套件或合約編輯確實需要
      更廣泛的 Vitest 涵蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 維持相同的路由
      行為，只是使用更高的工作程序上限。
    - 本機工作程序自動調整刻意採取保守策略，且當主機平均負載已經偏高時會降低規模，
      因此預設情況下，多個並行 Vitest 執行造成的影響較小。
    - 基礎 Vitest 設定會將專案／設定檔標示為
      `forceRerunTriggers`，確保測試
      配線變更時，變更模式的重新執行仍然正確。
    - 此設定會在支援的主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      若要為直接效能分析指定一個明確的快取位置，請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能偵錯">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入耗時報告及
      匯入細目輸出。
    - `pnpm test:perf:imports:changed` 會將相同的效能分析檢視範圍限定為
      自 `origin/main` 以來變更的檔案。
    - 分片計時資料會寫入 `.artifacts/vitest-shard-timings.json`。
      完整設定執行會使用設定路徑作為鍵；包含模式的 CI
      分片會附加分片名稱，以便個別追蹤經過篩選的分片。
    - 當某個高負載測試仍將大部分時間耗費在啟動匯入上時，
      請將高負載相依套件置於範圍狹窄的本機 `*.runtime.ts` 介面後方，並
      直接模擬該介面，而不是為了將執行階段輔助程式傳入 `vi.mock(...)`
      而進行深層匯入。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對該筆
      已提交的差異，比較經路由的 `test:changed` 與原生根專案路徑，
      並輸出實際經過時間及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 及根 Vitest 設定路由變更檔案清單，
      對目前有未提交變更的工作樹進行效能評測。
    - `pnpm test:perf:profile:main` 會寫入 Vitest／Vite 啟動及轉換額外負擔的
      主執行緒 CPU 效能分析。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行處理的情況下，為
      單元測試套件寫入執行器 CPU + 堆積效能分析。

  </Accordion>
</AccordionGroup>

### 穩定性（閘道）

- 命令：`pnpm test:stability:gateway`
- 設定：`test/vitest/vitest.gateway.config.ts`、`test/vitest/vitest.logging.config.ts` 和 `test/vitest/vitest.infra.config.ts`，每個都強制使用一個工作程序
- 範圍：
  - 啟動實際的回送閘道，且預設啟用診斷功能
  - 透過診斷事件路徑產生合成的閘道訊息、記憶體及大型酬載反覆負載
  - 透過閘道 WS RPC 查詢 `diagnostics.stability`
  - 涵蓋診斷穩定性套件的持久化輔助程式
  - 斷言記錄器維持在界限內、合成 RSS 樣本保持低於壓力預算，且各工作階段的佇列深度會回降至零
- 預期：
  - 可安全用於 CI，且不需要金鑰
  - 用於追蹤穩定性迴歸的狹窄通道，不能取代完整的閘道測試套件

### 端對端（儲存庫彙總）

- 命令：`pnpm test:e2e`
- 範圍：
  - 執行閘道冒煙端對端通道
  - 執行使用模擬資料的 Control UI 瀏覽器端對端通道
- 預期：
  - 可安全用於 CI，且不需要金鑰
  - 必須已安裝 Playwright Chromium

### 端對端（閘道冒煙測試）

- 命令：`pnpm test:e2e:gateway`
- 設定：`test/vitest/vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的隨附外掛端對端測試
- 執行階段預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與儲存庫的其餘部分一致。
  - 使用自適應工作程序（CI：最多 2 個；本機：預設 1 個）。
  - 預設以靜默模式執行，以降低主控台 I/O 額外負擔。
- 實用覆寫項目：
  - 使用 `OPENCLAW_E2E_WORKERS=<n>` 強制指定工作程序數量（上限為 16）。
  - 使用 `OPENCLAW_E2E_VERBOSE=1` 重新啟用詳細主控台輸出。
- 範圍：
  - 多執行個體閘道的端對端行為
  - WebSocket／HTTP 介面、節點配對及較高負載的網路作業
- 預期：
  - 在 CI 中執行（於管線中啟用時）
  - 不需要真實金鑰
  - 比單元測試涉及更多可變環節（可能較慢）

### 端對端（使用模擬資料的 Control UI 瀏覽器）

- 命令：`pnpm test:ui:e2e`
- 設定：`test/vitest/vitest.ui-e2e.config.ts`
- 檔案：`ui/src/**/*.e2e.test.ts`
- 範圍：
  - 啟動 Vite Control UI
  - 透過 Playwright 驅動實際的 Chromium 頁面
  - 以瀏覽器內的確定性模擬取代閘道 WebSocket
- 預期：
  - 在 CI 中作為 `pnpm test:e2e` 的一部分執行
  - 不需要真實閘道、代理程式或供應商金鑰
  - 必須具備瀏覽器相依套件（`pnpm --dir ui exec playwright install chromium`）

### 端對端：OpenShell 後端冒煙測試

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 重複使用運作中的本機 OpenShell 閘道
  - 從暫時的本機 Dockerfile 建立沙箱
  - 透過實際的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell 後端
  - 透過沙箱檔案系統橋接器驗證遠端標準檔案系統行為
- 預期：
  - 僅限選擇性啟用；不屬於預設的 `pnpm test:e2e` 執行
  - 需要本機 `openshell` 命令列介面及正常運作的 Docker 常駐程式
  - 需要運作中的本機 OpenShell 閘道及其設定來源
  - 使用隔離的 `HOME`／`XDG_CONFIG_HOME`，然後銷毀測試沙箱
- 實用覆寫項目：
  - 手動執行較廣泛的端對端測試套件時，使用 `OPENCLAW_E2E_OPENSHELL=1` 啟用此測試
  - 使用 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非預設的命令列介面二進位檔或包裝指令碼
  - 使用 `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`，向隔離測試公開已註冊的閘道設定
  - 使用 `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` 覆寫主機原則固定裝置所使用的 Docker 閘道 IP

### 即時測試（真實供應商 + 真實模型）

- 命令：`pnpm test:live`
- 設定：`test/vitest/vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的內建外掛即時測試
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - “這個提供者／模型使用真實認證資訊，在_今天_確實能運作嗎？”
  - 捕捉提供者格式變更、工具呼叫的特殊行為、驗證問題與速率限制行為
- 預期：
  - 設計上不保證在 CI 中穩定（真實網路、真實提供者政策、配額、中斷）
  - 會產生費用／使用速率限制額度
  - 優先執行縮小範圍的子集，而非“全部”
- 即時執行會使用已匯出的 API 金鑰與預備的驗證設定檔。
- 即時執行預設仍會隔離 `HOME`，並將設定／驗證資料複製到暫存測試主目錄，讓單元測試固定資料無法修改你真正的 `~/.openclaw`。
- 只有在你刻意需要即時測試使用真正的主目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 預設使用較安靜的模式：保留 `[live] ...` 進度輸出，並將閘道啟動日誌／Bonjour 訊息靜音。如果要恢復完整啟動日誌，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依提供者而異）：以逗號／分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可透過 `OPENCLAW_LIVE_*_KEY` 針對即時測試覆寫；測試遇到速率限制回應時會重試。
- 進度／心跳偵測輸出：
  - 即時測試套件會將進度行輸出到 stderr，因此即使 Vitest 主控台擷取處於安靜模式，耗時的提供者呼叫仍會明確顯示為執行中。
  - `test/vitest/vitest.live.config.ts` 會停用 Vitest 主控台攔截，讓提供者／閘道進度行在即時執行期間立即串流輸出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整直接模型的心跳偵測。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整閘道／探測的心跳偵測。

## 我應該執行哪個測試套件？

使用此決策表：

- 編輯邏輯／測試：執行 `pnpm test`（若變更很多，也執行 `pnpm test:coverage`）
- 變更閘道網路／WS 通訊協定／配對：加上 `pnpm test:e2e`
- 偵錯“我的機器人掛了”／提供者特定失敗／工具呼叫：執行縮小範圍的 `pnpm test:live`

## 即時（會存取網路的）測試

關於即時模型矩陣、命令列介面後端冒煙測試、ACP 冒煙測試、Codex app-server
測試框架，以及所有媒體提供者即時測試（Deepgram、BytePlus、ComfyUI、
影像、音樂、影片、媒體測試框架），以及即時執行的認證資訊處理

- 請參閱[測試即時測試套件](/zh-TW/help/testing-live)。如需專用的更新與
  外掛驗證檢查清單，請參閱
  [測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

## Docker 執行器（選用的“可在 Linux 運作”檢查）

這些 Docker 執行器分成兩類：

- 即時模型執行器：`test:docker:live-models` 與 `test:docker:live-gateway` 只會在存放庫 Docker 映像中執行各自對應的設定檔金鑰即時檔案（`src/agents/models.profiles.live.test.ts` 與 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載你的本機設定目錄、工作區，以及選用的設定檔環境變數檔案。對應的本機進入點為 `test:live:models-profiles` 與 `test:live:gateway-profiles`。
- Docker 即時執行器會在需要時保留各自的實際上限：
  `test:docker:live-models` 預設使用精選、受支援且高訊號的集合，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確需要更小的上限或更大範圍的掃描時，才設定 `OPENCLAW_LIVE_MAX_MODELS`
  或閘道環境變數。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置即時 Docker 映像一次，使用 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 封裝成 npm tarball 一次，接著建置／重複使用兩個 `scripts/e2e/Dockerfile` 映像。基礎映像只作為安裝／更新／外掛相依性測試通道的 Node/Git 執行器；這些測試通道會掛載預先建置的 tarball。功能映像會將相同 tarball 安裝到 `/app`，用於已建置應用程式的功能測試通道。Docker 測試通道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的計畫。彙總執行採用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制處理程序插槽，而資源上限會避免高負載即時、npm 安裝及多服務測試通道同時全部啟動。如果單一測試通道的負載高於目前上限，排程器在資源池為空時仍可啟動該通道，之後讓它單獨執行，直到再次有可用容量。預設為 10 個插槽、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`（以及其他 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 覆寫值）。執行器預設會執行 Docker 前置檢查、移除過期的 OpenClaw E2E 容器、每 30 秒列印狀態、將成功測試通道的耗時儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行時使用這些耗時資料優先啟動較長的測試通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印加權測試通道資訊清單，而不建置或執行 Docker；或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選測試通道、套件／映像需求與認證資訊的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生套件關卡，用來確認“這個可安裝的 tarball 能否作為產品運作？”。它會從 `source=npm`、`source=ref`、`source=url`、`source=trusted-url` 或 `source=artifact` 解析出一個候選套件，將其上傳為 `package-under-test`，接著針對該確切 tarball 執行可重複使用的 Docker E2E 測試通道，而不是重新封裝選取的參照。設定檔依涵蓋範圍排序：`smoke`、`package`、`product` 和 `full`（另有可明確指定測試通道清單的 `custom`）。如需套件／更新／外掛契約、已發布升級存續者矩陣、發布預設值與失敗分流方式，請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。
- 建置與發布檢查會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。此防護會從 `dist/entry.js` 與 `dist/cli/run-main.js` 走訪靜態建置圖，若命令分派前的啟動圖靜態匯入任何外部套件（Commander、提示 UI、undici、日誌記錄及類似會使啟動負擔加重的相依套件均計入）便會失敗；它也會將內含的閘道執行區塊上限設為 70 KB，並拒絕該區塊靜態匯入已知的冷門閘道路徑（`control-ui-assets`、`diagnostic-stability-bundle`、`onboard-helpers`、`process-respawn`、`restart-sentinel`、`server-close`、`server-reload-handlers`）。`scripts/release-check.ts` 會另外使用 `--help`、`onboard --help`、`doctor --help`、`status --json --timeout 1`、`config schema` 與 `models list --provider openai`，對已封裝的命令列介面進行冒煙測試。
- Package Acceptance 的舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在此截止版本以前，測試框架只容許已發布套件的中繼資料缺漏：省略私有 QA 清單項目、缺少 `gateway install --wrapper`、從 tarball 衍生的 git 固定資料中缺少修補檔案、缺少持久化的 `update.channel`、舊版外掛安裝記錄位置、缺少市集安裝記錄持久化，以及在 `plugins update` 期間進行設定中繼資料移轉。對於 `2026.4.25` 之後的套件，這些路徑都會嚴格判定為失敗。
- 容器冒煙測試執行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 會啟動一個或多個真實容器，並驗證較高層級的整合路徑。
- 透過 `scripts/lib/openclaw-e2e-instance.sh` 安裝已封裝 OpenClaw tarball 的 Docker/Bash E2E 測試通道，會將 `npm install` 的時間上限設為 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（預設 `600s`；設為 `0` 可停用包裝器以便偵錯）。

即時模型 Docker 執行器也只會繫結掛載所需的命令列介面驗證主目錄
（若執行範圍未縮小，則掛載所有受支援的主目錄），接著在執行前將其複製到
容器主目錄，讓外部命令列介面 OAuth 能重新整理權杖，
且不會修改主機的驗證儲存區：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 繫結冒煙測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 與 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 提供嚴格的 Droid/OpenCode 涵蓋）
- 命令列介面後端冒煙測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 測試框架冒煙測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- 閘道 + 開發代理程式：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 與 `pnpm qa:observability:smoke` 是私有 QA 原始碼簽出測試通道。它們刻意不屬於套件 Docker 發布測試通道，因為 npm tarball 會省略 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- 初始設定精靈（TTY、完整架構建立）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 初始設定／頻道／代理程式冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball，透過環境變數參照初始設定來設定 OpenAI，預設也設定 Telegram，接著執行 doctor，並執行一輪模擬的 OpenAI 代理程式互動。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可重複使用預先建置的 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 可略過主機重新建置，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換頻道。

- 發布使用者旅程冒煙測試：`pnpm test:docker:release-user-journey` 會在乾淨的 Docker 家目錄中全域安裝已封裝的 OpenClaw tarball、執行初始設定、設定模擬的 OpenAI 提供者、執行一次代理程式回合、安裝／解除安裝外部外掛、使用本機測試資料設定 ClickClack、驗證傳出／傳入訊息、重新啟動閘道，並執行 doctor。
- 發布型別化初始設定冒煙測試：`pnpm test:docker:release-typed-onboarding` 會安裝已封裝的 tarball、透過真實 TTY 操作 `openclaw onboard`、將 OpenAI 設定為環境變數參照提供者、驗證不會持久保存原始金鑰，並執行一次模擬的代理程式回合。
- 發布媒體／記憶冒煙測試：`pnpm test:docker:release-media-memory` 會安裝已封裝的 tarball、驗證對 PNG 附件的圖片理解、OpenAI 相容的圖片生成輸出、記憶搜尋回想，以及重新啟動閘道後仍能保留回想能力。
- 發布升級使用者旅程冒煙測試：`pnpm test:docker:release-upgrade-user-journey` 預設會安裝早於候選 tarball 的最新已發布基準版本、在已發布套件上設定提供者／外掛／ClickClack 狀態、升級至候選 tarball，然後重新執行核心代理程式／外掛／頻道旅程。如果沒有更舊的已發布基準版本，則會重複使用候選版本。可使用 `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` 覆寫基準版本。
- 發布外掛市集冒煙測試：`pnpm test:docker:release-plugin-marketplace` 會從本機測試市集安裝、更新已安裝的外掛、解除安裝該外掛，並驗證外掛命令列介面會消失且安裝中繼資料已清除。
- Skill 安裝冒煙測試：`pnpm test:docker:skill-install` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball、在設定中停用上傳封存檔安裝、從搜尋結果解析目前線上的 ClawHub Skill slug、使用 `openclaw skills install` 安裝，並驗證已安裝的 Skill 及 `.clawhub` 來源／鎖定中繼資料。
- 更新頻道切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball、從套件 `stable` 切換至 git `dev`、驗證持久保存的頻道及外掛更新後作業，然後切回套件 `stable` 並檢查更新狀態。
- 升級存續冒煙測試：`pnpm test:docker:upgrade-survivor` 會在包含代理程式、頻道設定、外掛允許清單、過時外掛相依性狀態，以及現有工作區／工作階段檔案的非乾淨舊使用者測試資料上安裝已封裝的 OpenClaw tarball。它會在沒有線上提供者或頻道金鑰的情況下執行套件更新及非互動式 doctor，接著啟動迴路閘道，並檢查設定／狀態是否保留，以及啟動／狀態時間預算。
- 已發布版本升級存續冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`、植入符合實際情況的現有使用者檔案、使用內建命令配方設定該基準版本、驗證產生的設定、將該已發布安裝更新至候選 tarball、執行非互動式 doctor、寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動迴路閘道，並檢查已設定的意圖、狀態保留、啟動、`/healthz`、`/readyz` 及 RPC 狀態時間預算。可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準版本；可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 要求彙總排程器展開確切的本機基準版本，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`；也可使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開問題型測試資料，例如 `reported-issues`；已回報問題集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw 外掛安裝。套件驗收會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`、解析如 `last-stable-4` 或 `all-since-2026.4.23` 的中繼基準版本權杖，而完整發布驗證會將發布浸泡套件閘門展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- 工作階段執行階段內容冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段內容的逐字記錄持久性，以及 doctor 對受影響之重複提示重寫分支的修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會封裝目前的原始碼樹、在隔離的家目錄中使用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會傳回隨附的圖片提供者，而不會停滯。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重複使用預先建置的 tarball、使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 略過主機建置，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝程式 Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、更新及直接 npm 容器間共用一個 npm 快取。更新冒煙測試預設會先使用 npm `latest` 作為穩定基準版本，再升級至候選 tarball。在本機可使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用 Install Smoke 工作流程的 `update_baseline_version` 輸入覆寫。非 root 安裝程式檢查會維持隔離的 npm 快取，避免 root 擁有的快取項目掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重新執行時重複使用 root／更新／直接 npm 快取。
- Install Smoke CI 會使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 略過重複的直接 npm 全域更新；需要直接 `npm install -g` 涵蓋範圍時，請在本機執行指令碼且不要設定該環境變數。
- 代理程式刪除共用工作區命令列介面冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置根目錄 Dockerfile 映像、在隔離的容器家目錄中植入共用一個工作區的兩個代理程式、執行 `agents delete --json`，並驗證有效的 JSON 及工作區保留行為。可使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重複使用 install-smoke 映像。
- 閘道網路與主機生命週期：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）會保留雙容器 LAN WebSocket 驗證／健康狀態冒煙測試，接著使用迴路 Admin HTTP 證明準備柵欄、保留的控制存取、繼續執行復原，以及同容器內已準備的停止／啟動。重新啟動檢查必須在原始租約到期前完成，並驗證暫停狀態僅存在於處理程序本機，而持久保存的閘道設定和容器識別資訊仍會保留，且輸出機器可讀的階段計時 JSON。
- 瀏覽器 CDP 快照冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置原始碼 E2E 映像及 Chromium 層、使用原始 CDP 啟動 Chromium、執行 `browser doctor --deep`，並驗證 CDP 角色快照涵蓋連結 URL、由游標提升的可點擊項目、iframe 參照及影格中繼資料。
- OpenAI Responses web_search 最小推理迴歸測試：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過閘道執行模擬的 OpenAI 伺服器、驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提高至 `low`，接著強制提供者結構描述拒絕，並檢查原始詳細資訊是否出現在閘道記錄中。
- MCP 頻道橋接（已植入資料的閘道 + stdio 橋接器 + 原始 Claude 通知影格冒煙測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw 套件 MCP 工具（真實 stdio MCP 伺服器 + 內嵌 OpenClaw 設定檔允許／拒絕冒煙測試）：`pnpm test:docker:agent-bundle-mcp-tools`（指令碼：`scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- 排程／子代理程式 MCP 清理（在隔離的排程及單次子代理程式執行後，清除真實閘道 + stdio MCP 子處理程序）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 外掛（本機路徑、`file:`、含提升相依性的 npm 登錄、格式錯誤的 npm 套件中繼資料、git 移動參照、ClawHub 綜合測試、 市集更新，以及 Claude 套件啟用／檢查的安裝／更新冒煙測試）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可略過 ClawHub 區塊，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的綜合測試套件／執行階段組合。若未設定 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用封閉式本機 ClawHub 測試伺服器。
- 外掛更新未變更冒煙測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 外掛生命週期矩陣冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在空白容器中安裝已封裝的 OpenClaw tarball、安裝 npm 外掛、切換啟用／停用狀態、透過本機 npm 登錄進行升級與降級、刪除已安裝的程式碼，接著驗證解除安裝仍會移除過時狀態，同時記錄每個生命週期階段的 RSS／CPU 指標。
- 設定重新載入中繼資料冒煙測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- 外掛：`pnpm test:docker:plugins` 涵蓋本機路徑、`file:`、含提升相依性的 npm 登錄、git 移動參照、ClawHub 測試資料、市集更新，以及 Claude 套件啟用／檢查的安裝／更新冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝外掛的未變更更新行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋具資源追蹤的 npm 外掛安裝、啟用、停用、升級、降級，以及程式碼遺失時的解除安裝。

若要手動預先建置並重複使用共用功能映像檔：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定時，`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 等測試套件專用的映像覆寫仍具有優先權。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，若本機尚無該映像，指令碼會將其拉取下來。QR 碼與安裝程式的 Docker 測試會保留各自的 Dockerfile，因為它們驗證的是套件／安裝行為，而非共用的已建置應用程式執行環境。

即時模型 Docker 執行器也會以唯讀方式繫結掛載目前的簽出內容，
並將其暫存至容器內的臨時工作目錄。這可讓
執行環境映像保持精簡，同時仍針對你確切的本機
原始碼／設定執行 Vitest。暫存步驟會略過大型的僅限本機快取與應用程式建置
輸出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及
應用程式本機的 `.build` 或 Gradle 輸出目錄，因此 Docker 即時執行不會
花費數分鐘複製特定於機器的成品。它們也會設定
`OPENCLAW_SKIP_CHANNELS=1`，讓閘道即時探測不會在容器內啟動真正的
Telegram／Discord／其他頻道工作程序。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要縮小或排除該 Docker
測試通道中的閘道即時涵蓋範圍時，也請傳入
`OPENCLAW_LIVE_GATEWAY_*`。

`test:docker:openwebui` 是較高階的相容性冒煙測試：它會啟動已啟用 OpenAI 相容 HTTP 端點的
OpenClaw 閘道容器，啟動一個連線至該閘道且版本固定的 Open WebUI 容器，透過
Open WebUI 登入、驗證 `/api/models` 會公開 `openclaw/default`，接著透過
Open WebUI 的 `/api/chat/completions` 代理傳送實際聊天請求。對於應在
Open WebUI 登入並探索模型後停止、無須等待即時模型完成回應的發行流程 CI 檢查，請設定
`OPENWEBUI_SMOKE_MODE=models`。第一次執行可能明顯較慢，因為 Docker 可能需要
提取 Open WebUI 映像，而 Open WebUI 可能需要完成其本身的
冷啟動設定。此測試通道需要可用的即時模型金鑰，該金鑰可透過
程序環境、預先準備的驗證設定檔，或明確的
`OPENCLAW_PROFILE_FILE` 提供。成功執行時會輸出類似以下內容的小型 JSON 承載資料：
`{ "ok": true, "model": "openclaw/default", ... }`。

`test:docker:mcp-channels` 經過刻意設計以確保結果具確定性，且不需要
真實的 Telegram、Discord 或 iMessage 帳號。它會啟動一個已植入資料的閘道
容器，再啟動第二個容器以衍生 `openclaw mcp serve`，接著
驗證路由後的對話探索、對話記錄讀取、附件
中繼資料、即時事件佇列行為、傳出訊息路由，以及透過實際 stdio MCP 橋接器傳送的 Claude 風格
頻道與權限通知。
通知檢查會直接檢查原始 stdio MCP 訊框，因此此冒煙測試
驗證的是橋接器實際發出的內容，而不只是特定用戶端 SDK
碰巧呈現的內容。

`test:docker:agent-bundle-mcp-tools` 具確定性，且不需要
即時模型金鑰。它會建置儲存庫 Docker 映像、在容器內啟動真實的 stdio MCP
探查伺服器、透過內嵌的 OpenClaw 套件組合 MCP 執行階段將該伺服器具現化、執行工具，接著驗證
`coding` 與 `messaging` 會保留 `bundle-mcp` 工具，而 `minimal` 和
`tools.deny: ["bundle-mcp"]` 則會將其篩除。

`test:docker:cron-mcp-cleanup` 具確定性，且不需要即時
模型金鑰。它會啟動一個具有真實 stdio MCP 探查伺服器且已植入資料的閘道，
執行隔離的排程回合和一次性的 `sessions_spawn` 子回合，接著
驗證 MCP 子程序會在每次執行後結束。

手動 ACP 自然語言討論串冒煙測試（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 請保留此指令碼供迴歸／偵錯工作流程使用。ACP 討論串路由驗證可能再次需要它，因此請勿刪除。

實用的環境變數：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載至 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載至 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` 在執行測試前掛載並載入
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`，僅驗證從 `OPENCLAW_PROFILE_FILE` 載入的環境變數，並使用暫存設定／工作區目錄，且不掛載外部命令列介面驗證資料
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`，除非執行作業已使用 CI／受管理的繫結目錄）掛載至 `/home/node/.npm-global`，供 Docker 內的命令列介面安裝項目使用快取
- `$HOME` 下的外部命令列介面驗證目錄／檔案會以唯讀方式掛載至 `/host-auth...`，接著在測試開始前複製至 `/home/node/...`
  - 預設目錄（當執行作業未限定為特定提供者時使用）：`.factory`、`.gemini`、`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 限定提供者的執行作業只會掛載根據 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要目錄／檔案
  - 可使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗號分隔清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`，用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`，用於篩選容器內的提供者
- `OPENCLAW_SKIP_DOCKER_BUILD=1`，對於不需要重新建置的重複執行，重複使用現有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`，確保認證資訊來自設定檔儲存區（而非環境變數）
- `OPENCLAW_OPENWEBUI_MODEL=...`，選擇閘道要為 Open WebUI 冒煙測試公開的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...`，覆寫 Open WebUI 冒煙測試所使用的隨機碼檢查提示詞
- `OPENWEBUI_IMAGE=...`，覆寫已固定版本的 Open WebUI 映像標籤

## 文件健全性檢查

編輯文件後執行文件檢查：`pnpm check:docs`。
當你也需要檢查頁內標題時，請執行完整的 Mintlify 錨點驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI 安全）

以下是不使用真實提供者的「實際管線」迴歸測試：

- 閘道工具呼叫（模擬 OpenAI、使用真實閘道與代理程式迴圈）：`src/gateway/gateway.test.ts`（案例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- 閘道精靈（WS `wizard.start`/`wizard.next`，寫入設定並強制執行驗證）：`src/gateway/gateway.test.ts`（案例："runs wizard over ws and writes auth token config"）

## 代理程式可靠性評估（Skills）

我們已有一些具備 CI 安全性且行為類似「代理程式可靠性評估」的測試：

- 透過真實閘道與代理程式迴圈進行模擬工具呼叫（`src/gateway/gateway.test.ts`）。
- 驗證工作階段連接和設定效果的端對端精靈流程（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的部分（請參閱 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當提示詞中列出 Skills 時，代理程式是否會選擇正確的 Skill（或避免選擇不相關的 Skill）？
- **遵循性：** 代理程式是否會在使用前讀取 `SKILL.md`，並遵循必要的步驟／引數？
- **工作流程契約：** 可斷言工具順序、工作階段歷程延續，以及沙箱邊界的多回合情境。

未來的評估應優先維持確定性：

- 使用模擬提供者的情境執行器，用於驗證工具呼叫及其順序、Skill 檔案讀取與工作階段連接。
- 一組以 Skill 為重點的小型情境套件（使用與避免使用、門控、提示注入）。
- 僅在 CI 安全套件就緒後，才執行選用的即時評估（需主動啟用並由環境變數控管）。

## 契約測試（外掛與頻道結構）

契約測試會驗證每個已註冊的外掛與頻道是否符合其介面契約。這些測試會逐一檢查所有探索到的外掛，並執行一組結構與行為斷言。預設的 `pnpm test` 單元測試通道會刻意略過這些共用接合面與冒煙測試檔案；當你變更共用頻道或提供者介面時，請明確執行契約測試命令。

### 命令

- 所有契約：`pnpm test:contracts`
- 僅頻道契約：`pnpm test:contracts:channels`
- 僅提供者契約：`pnpm test:contracts:plugins`

### 頻道契約

位於 `src/channels/plugins/contracts/*.contract.test.ts`。目前的頂層類別：

- **channel-catalog** - 內建／登錄檔頻道目錄項目的中繼資料
- **plugin**（由登錄檔支援、分片執行）- 基本外掛註冊結構
- **surfaces-only**（由登錄檔支援、分片執行）- 針對 `actions`、`setup`、`status`、`outbound`、`messaging`、`threading`、`directory` 與 `gateway` 的各介面結構檢查
- **session-binding**（由登錄檔支援）- 工作階段繫結行為
- **outbound-payload** - 訊息承載資料的結構與正規化
- **group-policy**（備援）- 各頻道的預設群組政策強制執行
- **threading**（由登錄檔支援、分片執行）- 討論串 ID 處理
- **directory**（由登錄檔支援、分片執行）- 目錄／名冊 API
- **registry** 與 **plugins-core.\*** - 頻道外掛登錄檔、載入器及設定寫入授權的內部機制

這些套件使用的入站分派擷取與出站承載資料測試框架輔助工具，會透過 `src/plugin-sdk/channel-contract-testing.ts` 在內部提供（不包含於 npm 套件中，且不是公開的 SDK 子路徑）；此目錄中沒有獨立的 `inbound.contract.test.ts` 檔案。

### 提供者契約

位於 `src/plugins/contracts/*.contract.test.ts`。目前的類別包括：

- **shape** - 外掛資訊清單、API 與執行階段匯出的結構
- **plugin-registration**（及其平行版本）- 資訊清單註冊案例
- **package-manifest** - 套件資訊清單要求
- **loader** - 外掛載入器的設定／清理行為
- **registry** - 外掛契約登錄檔的內容與查詢
- **providers** - 所有內建提供者及網頁搜尋提供者之間的共用提供者行為
- **auth-choice** - 驗證方式選項的中繼資料與設定行為
- **provider-catalog-deprecation** - 已棄用的提供者目錄中繼資料
- **wizard.choice-resolution**、**wizard.model-picker**、**wizard.setup-options** - 提供者設定精靈契約
- **embedding-provider**、**memory-embedding-provider**、**web-fetch-provider**、**tts** - 特定能力的提供者契約
- **session-actions**、**session-attachments**、**session-entry-projection** - 由外掛擁有的工作階段狀態契約
- **scheduled-turns** - 外掛排程回合的中繼資料與時間戳記範圍
- **host-hooks**、**run-context-lifecycle**、**runtime-import-side-effects**、**runtime-seams** - 外掛主機／執行階段生命週期與匯入邊界契約
- **extension-runtime-dependencies** - 擴充功能的執行階段相依套件配置位置

### 執行時機

- 變更 plugin-sdk 匯出或子路徑之後
- 新增或修改頻道或提供者外掛之後
- 重構外掛註冊或探索機制之後

契約測試會在 CI 中執行，且不需要真實的 API 金鑰。

## 新增迴歸測試（指引）

當你修正在即時環境中發現的提供者／模型問題時：

- 如有可能，請新增 CI 安全的迴歸測試（模擬／樁件提供者，或擷取確切的請求結構轉換）
- 如果問題本質上只能在即時環境中測試（速率限制、驗證政策），請將即時測試維持在最小範圍，並透過環境變數設為選用
- 優先針對能捕捉該錯誤的最小層級：
  - 提供者請求轉換／重播錯誤 -> 直接模型測試
  - 閘道工作階段／歷程／工具管線錯誤 -> 閘道即時冒煙測試或 CI 安全的閘道模擬測試
- SecretRef 走訪防護：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從登錄檔中繼資料（`listSecretTargetRegistryEntries()`）為每個 SecretRef 類別衍生一個抽樣目標，接著斷言包含走訪區段的 exec ID 會遭到拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增 `includeInPlan` SecretRef 目標系列，請更新該測試中的 `classifyTargetClass`。此測試會刻意在遇到未分類的目標 ID 時失敗，確保新的類別不會在沒有提示的情況下遭到略過。

## 相關內容

- [測試即時功能](/zh-TW/help/testing-live)
- [測試更新與外掛](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
