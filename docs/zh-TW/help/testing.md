---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型／供應商錯誤新增迴歸測試
    - 偵錯閘道與代理程式行為
summary: 測試工具組：單元／端對端／即時測試套件、Docker 執行器，以及各項測試的涵蓋範圍
title: 測試
x-i18n:
    generated_at: "2026-07-19T13:51:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20e0aa22bf16561334f83342abffabb387ed0b41b901773939123ecfbc0ae330
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三套 Vitest 測試套件（單元／整合、端對端、即時），另有 Docker
執行器。本頁說明每套測試涵蓋的範圍、特定工作流程應執行的命令、
即時測試如何探索認證資訊，以及如何為實際的供應商／模型錯誤新增
迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、即時傳輸通道）**另有獨立文件：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) - 架構、命令介面、情境撰寫及 Matrix 設定檔。
- [成熟度評分表](/zh-TW/maturity/scorecard) - 發行版 QA 證據如何支援穩定性與 LTS 決策。
- [QA 頻道](/zh-TW/channels/qa-channel) - 由儲存庫支援的情境所使用的合成傳輸外掛。

本頁涵蓋一般測試套件及 Docker／Parallels 執行器。下方的 [QA 專用執行器](#qa-specific-runners)列出具體的 `qa` 呼叫方式，並連回上述參考資料。
</Note>

## 快速開始

大多數時候：

- 完整閘門（預期在推送前執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足的機器上更快速地執行本機完整測試套件：`pnpm test:max`
- 直接執行 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案也會路由外掛／頻道路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 反覆處理單一失敗時，請優先執行針對性測試。
- 以 Docker 為基礎的 QA 站台：`pnpm qa:lab:up`
- 以 Linux VM 為基礎的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

修改測試或需要更高信心時：

- 僅供參考的 V8 覆蓋率報告：`pnpm test:coverage`
- 端對端測試套件：`pnpm test:e2e`

## 測試暫存目錄

測試所擁有的暫存目錄請使用 `test/helpers/temp-dir.ts` 中的共用輔助工具，
以明確表示擁有權，並讓清理作業留在測試生命週期內：

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("使用暫存工作區", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // 使用工作區
});
```

`useAutoCleanupTempDirTracker(afterEach)` 刻意不提供手動清理方法，
因為 Vitest 會在每項測試後負責清理。較舊的底層輔助工具
（`makeTempDir`、`cleanupTempDirs`、`createTempDirTracker`）仍然存在，
供尚未遷移的測試使用；請避免新增這些工具的使用方式，也不要新增裸露的
`fs.mkdtemp*` 呼叫，除非測試明確用於驗證原始暫存目錄
行為。確實需要裸露暫存目錄時，請加入可稽核的允許註解並說明原因：

```ts
// openclaw-temp-dir: allow 驗證原始 fs 清理行為
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` 會回報新增差異行中建立的裸露暫存目錄，
以及新增的共用輔助工具手動使用方式，而不會阻擋現有的清理風格。
它遵循與 `scripts/changed-lanes.mjs` 相同的測試路徑分類，
並略過共用輔助工具本身的實作。`check:changed` 會針對變更的測試路徑
執行此報告，作為僅警告的 CI 訊號（GitHub 警告註解，而非失敗）。

## 即時與 Docker／Parallels 工作流程

偵錯實際供應商／模型時（需要真實認證資訊）：

- 即時測試套件（模型 + 閘道工具／影像探查）：`pnpm test:live`
- 以安靜模式指定單一即時測試檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：分派 `OpenClaw Performance`，並搭配
  `live_openai_candidate=true` 進行真實的 `openai/gpt-5.6-luna` 代理程式回合，或搭配
  `deep_profile=true` 產生 Kova CPU／堆積／追蹤成品。每日排程執行會
  從獨立的成品取用發布工作，將模擬供應商、深度剖析及 GPT-5.6 Luna 通道報告
  發布至 `openclaw/clawgrit-reports`；
  發布者驗證資訊遺失或無效會使排程及
  `profile=release` 執行失敗。手動非發行分派會保留 GitHub 成品，
  並將報告發布視為建議性作業。模擬供應商報告也包含
  原始碼層級的閘道啟動、記憶體、外掛壓力、重複的
  假模型 hello 迴圈及命令列介面啟動數據。
- Docker 即時模型全面測試：`pnpm test:docker:live-models`
  - 每個選定模型都會執行一個文字回合，外加一項小型的檔案讀取式探查。
    中繼資料宣告支援 `image` 輸入的模型，也會執行一個微型影像回合。
    隔離供應商失敗時，可使用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探查。
  - CI 涵蓋範圍：每日的 `OpenClaw Scheduled Live And E2E Checks` 與手動的
    `OpenClaw Release Checks` 都會使用
    `include_live_suites: true` 呼叫可重複使用的即時／端對端工作流程，其中包含
    依供應商分片的 Docker 即時模型矩陣工作。
  - 若要集中重新執行 CI，請分派 `OpenClaw Live And E2E Checks (Reusable)`，
    並搭配 `include_live_suites: true` 和 `live_models_only: true`。
  - 將新的高訊號供應商密鑰加入 `scripts/ci-hydrate-live-auth.sh`、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其
    排程／發行呼叫端。
- 原生 Codex 綁定聊天煙霧測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker 即時通道，使用
    `/codex bind` 綁定合成 Slack 私訊，演練 `/codex fast` 和
    `/codex permissions`，然後驗證純文字回覆與影像附件
    會透過原生外掛綁定路由，而非 ACP。
- Codex app-server 測試框架煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過外掛所擁有的 Codex app-server
    測試框架執行閘道代理程式回合、驗證 `/codex status` 和 `/codex models`，
    並預設演練影像、排程 MCP、子代理程式及 Guardian 探查。隔離其他失敗時，
    可使用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用
    子代理程式探查。若要集中檢查子代理程式，請停用
    其他探查：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，
    否則此程序會在子代理程式探查後結束。
- Codex 隨選安裝煙霧測試：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安裝封裝的 OpenClaw tarball、執行 OpenAI API 金鑰
    初始設定，並驗證 Codex 外掛及 `@openai/codex` 相依套件
    已按需下載至受管理的 npm 專案根目錄。
- Codex npm 外掛即時套件煙霧測試：`pnpm test:docker:live-codex-npm-plugin`
  - 將候選 OpenClaw 套件與確切的 Codex 外掛安裝至 Docker，
    接著使用真實的 OpenAI 金鑰進行命令列介面預先檢查及同工作階段回合。
  - 其零次重試、中等思考的後續回合必須傳送進度、持續完成隨機化工作區讀取
    及精確成品寫入，然後傳送完成訊息。僅有進度的終止回合會使該通道失敗。
- 即時外掛工具相依套件煙霧測試：`pnpm test:docker:live-plugin-tool`
  - 封裝含有真實 `slugify` 相依套件的測試固定裝置外掛，透過
    `npm-pack:` 安裝、驗證受管理 npm
    專案根目錄下的相依套件，然後要求即時 OpenAI 模型呼叫外掛工具並
    傳回隱藏的 slug。
- OpenClaw 救援命令煙霧測試：`pnpm test:live:system-agent-rescue-channel`
  - 針對訊息頻道救援命令介面的選用雙重保險檢查。
    演練 `/openclaw status`、將持續性模型
    變更加入佇列、回覆 `/openclaw yes`，並驗證稽核／設定寫入
    路徑。
- OpenClaw 首次執行 Docker 煙霧測試：`pnpm test:docker:system-agent-first-run`
  - 從空白的 OpenClaw 狀態目錄開始，並先證明封裝的
    `openclaw setup` 命令列介面在沒有推論的情況下會以封閉方式失敗。接著
    透過封裝的啟用模組測試並啟用假的 Claude。
    只有在此之後，模糊的封裝命令列介面要求才會送達規劃器並
    解析為具型別的設定，接著執行單次模型、代理程式、Discord 設定
    及 SecretRef 操作。它會驗證設定及稽核項目。這是
    輔助性的閘門／操作證據，而不是互動式初始設定，也不是
    OpenClaw 代理程式／工具／核准證據。同一通道可透過
    `pnpm openclaw qa suite --scenario system-agent-ring-zero-setup` 在 QA Lab 中使用。
- Moonshot／Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對 `moonshot/kimi-k2.6`
  執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且助理逐字稿儲存正規化的 `usage.cost`。

<Tip>
只需要處理一個失敗案例時，請優先透過下述允許清單環境變數縮小即時測試範圍。
</Tip>

## QA 專用執行器

需要 QA Lab 真實度時，這些命令可與主要測試套件搭配使用。

CI 會在專用工作流程中執行 QA Lab。代理式同等性測試內嵌於
`QA-Lab - All Lanes` 及發行驗證之下，而不是獨立的 PR 工作流程。
廣泛驗證應使用 `Full Release Validation` 搭配
`rerun_group=qa-parity`，或使用發行檢查的 QA 群組。穩定版／預設發行
檢查會將完整的即時／Docker 長時間測試置於 `run_release_soak=true` 後方；
`full` 設定檔則會強制啟用長時間測試。`QA-Lab - All Lanes` 每晚於 `main` 執行，
也會透過手動分派，以模擬同等性通道、即時 Matrix 通道、
由 Convex 管理的即時 Telegram 通道，以及由 Convex 管理的即時 Discord 通道作為
平行工作執行。排程 QA 與發行檢查會透過共用即時配接器
執行 Matrix 發行設定檔。Matrix 命令列介面與手動工作流程輸入的
預設值仍為 `all`；手動 `all` 分派會展開傳輸、媒體及
E2EE 設定檔，而集中分派可選擇 `fast`、`release` 或
`transport`。`OpenClaw Release Checks` 會在核准發行前執行同等性測試、
可重複使用的 Matrix 即時配接器設定檔及 Telegram 通道。發行
傳輸檢查使用 `mock-openai/gpt-5.6-luna`，以維持確定性並
避免一般供應商外掛啟動。這些即時傳輸閘道
會停用記憶體搜尋；記憶體行為仍由 QA 同等性測試套件涵蓋。

完整發行的即時媒體分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker 即時模型／後端分片使用共用的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔；該映像檔會針對每個選定的
提交建置一次，之後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 提取，而不是在
每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由儲存庫支援的 QA 情境。
  - 為所選情境集寫入頂層 `qa-evidence.json`、`qa-suite-summary.json` 和
    `qa-suite-report.md` 成品，包括
    混合流程、Vitest 和 Playwright 情境選項。
  - 由 `pnpm openclaw qa run --qa-profile <profile>` 分派時，會將
    所選分類設定檔的評分卡嵌入同一個 `qa-evidence.json`。
    `smoke-ci` 會寫入精簡證據（`evidenceMode: "slim"`，沒有逐項
    `execution`）。`release` 涵蓋精選的發布就緒範圍；`all`
    會選取所有作用中的成熟度類別，並在需要完整評分卡成品時，
    以明確的 QA Profile Evidence 工作流程分派為目標。
  - 預設使用隔離的閘道工作程序，平行執行多個所選情境。
    `qa-channel` 預設並行數為 4（上限為
    所選情境數量）。使用 `--concurrency <count>` 調整工作程序
    數量，或使用 `--concurrency 1` 採用較舊的序列執行管道。
  - 任何情境失敗時會以非零狀態結束。若要產生成品但不使用失敗結束碼，
    請使用 `--allow-failures`。
  - 支援提供者模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動由本機 AIMock 支援的提供者伺服器，
    用於實驗性固定資料和通訊協定模擬涵蓋範圍，而不取代具情境感知能力的
    `mock-openai` 執行管道。
- `pnpm openclaw qa coverage --match <query>`
  - 搜尋情境 ID、標題、介面、涵蓋範圍 ID、文件參照、程式碼
    參照、外掛和提供者需求，然後列印相符的測試套件
    目標。
  - 當你知道受影響的行為或檔案路徑，但不知道最小情境時，
    請在執行 QA Lab 前使用此功能。這僅供建議——仍須根據
    變更中的行為選擇模擬、即時、Multipass、Matrix 或傳輸證明。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink 外掛的嚴格測試。
    安裝外部 Kitchen Sink 套件、驗證外掛 SDK
    介面清單、探測 `/healthz` 和 `/readyz`、記錄閘道
    CPU/RSS 證據、執行一次即時 OpenAI 回合，並檢查對抗性
    診斷。需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在
    已注入設定的 Testbox 工作階段中，若有 `openclaw-testbox-env` 輔助程式，
    便會自動載入 Testbox 即時驗證設定檔。
- `pnpm test:gateway:cpu-scenarios`
  - 執行閘道啟動基準測試及一小組模擬 QA Lab 情境
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/` 下寫入合併的 CPU 觀測
    摘要。
  - 預設僅標記持續的高 CPU 觀測結果（`--cpu-core-warn`，
    預設為 `0.9`；`--hot-wall-warn-ms`，預設為 `30000`），因此短暫的啟動
    峰值會記錄為指標，而不會看起來像持續數分鐘的
    閘道滿載迴歸問題。
  - 針對已建置的 `dist` 成品執行；若簽出內容中
    尚無最新的執行階段輸出，請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在可拋棄的 Multipass Linux VM 中執行相同的 QA 測試套件，
    並使用與 `qa suite` 相同的情境選擇和提供者／模型旗標。
  - 即時執行會轉送適用於客體的 QA 驗證輸入：
    以環境變數為基礎的提供者金鑰、QA 即時提供者設定路徑，以及
    存在時的 `CODEX_HOME`。
  - 輸出目錄必須位於儲存庫根目錄下，讓客體可透過
    掛載的工作區寫回。
  - 寫入一般 QA 報告和摘要，以及 `.artifacts/qa-e2e/...` 下的
    Multipass 記錄。
- `pnpm qa:lab:up`
  - 啟動由 Docker 支援的 QA 網站，供操作人員執行 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前的簽出內容建置 npm tarball、在 Docker 中全域安裝、
    執行非互動式 OpenAI API 金鑰引導設定、預設設定
    Telegram、驗證封裝的外掛執行階段可載入且不需
    啟動相依性修復、執行 doctor，並針對模擬的 OpenAI 端點
    執行一次本機代理程式回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`，以 Discord 執行相同的封裝安裝
    執行管道。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式執行階段內容逐字稿，執行確定性的已建置應用程式 Docker 煙霧測試。
    驗證隱藏的 OpenClaw 執行階段內容會以不顯示的
    自訂訊息形式保留，而不會洩漏至使用者可見的回合；接著植入受影響的
    損壞工作階段 JSONL，並驗證 `openclaw doctor --fix` 會將其
    重寫至作用中分支並建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 套件候選版本、執行已安裝套件的
    引導設定、透過已安裝的命令列介面設定 Telegram，接著重複使用
    即時 Telegram QA 執行管道，並將該已安裝套件作為受測系統
    閘道。
  - 包裝器僅掛載簽出內容中的 `qa-lab` 測試框架原始碼；
    已安裝套件擁有 `dist`、`openclaw/plugin-sdk` 和內建
    外掛執行階段，因此此執行管道不會將目前簽出內容的外掛混入
    受測套件。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而非
    從登錄檔安裝。
  - 預設使用 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`，在 `qa-evidence.json` 中
    輸出重複的 RTT 計時。覆寫
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 以調整執行。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` 會選取要取樣的 Telegram QA 情境；
    支援的 RTT 目標為 `channel-canary`。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram 環境認證資訊或 Convex 認證資訊來源。
    對於 CI／發布自動化，請設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`、
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密鑰。若 CI 中存在
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密鑰，
    Docker 包裝器會自動選取 Convex。
  - 包裝器會在 Docker 建置／安裝工作之前，於主機上驗證
    Telegram 或 Convex 認證資訊環境變數。僅在刻意偵錯
    認證資訊設定前的流程時設定
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 僅針對此執行管道覆寫
    共用的 `OPENCLAW_QA_CREDENTIAL_ROLE`。選取 Convex
    認證資訊且未設定角色時，包裝器在 CI 中使用 `ci`，
    在 CI 外使用 `maintainer`。
  - GitHub Actions 將此執行管道公開為手動維護者工作流程
    `NPM Telegram Beta E2E`。合併時不會執行。此工作流程使用
    `qa-live-shared` 環境和 Convex CI 認證資訊租約。
- GitHub Actions 也公開 `Package Acceptance`，用於針對單一候選套件執行旁路產品證明。
  它接受 Git 參照、已發布的 npm 規格、
  HTTPS tarball URL 加 SHA-256、受信任 URL 原則，或來自另一次執行的
  tarball 成品（`source=ref|npm|url|trusted-url|artifact`），將正規化後的
  `openclaw-current.tgz` 上傳為 `package-under-test`，接著使用 `smoke`、`package`、`product`、`full`
  或 `custom` 執行管道設定檔來執行現有的 Docker E2E 排程器。
  設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對相同的
  `package-under-test` 成品執行 Telegram QA 工作流程。
  - 最新 Beta 產品證明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精確的 tarball URL 證明需要摘要，並使用公開 URL 安全原則：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 企業／私人 tarball 鏡像使用明確的受信任來源原則：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` 會從受信任的工作流程參照讀取 `.github/package-trusted-sources.json`，且不接受 URL 認證資訊或透過工作流程輸入略過私人網路限制。若指定原則宣告了 Bearer 驗證，請設定固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密鑰。

- 成品證明會從另一次 Actions 執行下載 tarball 成品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw 建置、使用已設定的
    OpenAI 啟動閘道，接著透過設定編輯啟用內建頻道／外掛。
  - 驗證設定探索會讓未設定的可下載外掛
    保持不存在、第一次設定後的 doctor 修復會明確安裝每個缺少的
    可下載外掛，且第二次重新啟動不會執行
    隱藏的相依性修復。
  - 也會安裝已知的舊版 npm 基準、在執行
    `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證
    候選版本的更新後 doctor 會清除舊版外掛相依性殘留物，
    而不需測試框架端的 postinstall 修復。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels 客體執行原生封裝安裝更新煙霧測試。
    每個所選平台會先安裝要求的基準套件，
    接著在同一個客體中執行已安裝的 `openclaw update` 命令，
    並驗證已安裝版本、更新狀態、閘道就緒狀態，以及
    一次本機代理程式回合。
  - 迭代單一客體時，請使用 `--platform macos`、`--platform windows` 或 `--platform linux`。
    使用 `--json` 取得摘要成品
    路徑和各執行管道狀態。
  - OpenAI 執行管道預設使用 `openai/gpt-5.6-luna` 進行即時代理程式回合證明。
    傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL`，即可驗證另一個 OpenAI 模型。
  - 請以主機逾時包裝長時間的本機執行，避免 Parallels 傳輸停滯
    耗盡剩餘的測試時段：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 指令碼會在
    `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀執行管道記錄。在認定外層
    包裝器當機前，請檢查 `windows-update.log`、
    `macos-update.log` 或 `linux-update.log`。
  - 在冷啟動客體上，Windows 更新可能會花費 10 到 15 分鐘執行更新後 doctor 和
    套件更新工作；只要巢狀 npm 偵錯記錄仍持續更新，
    就仍屬正常。
  - 請勿將此彙總包裝器與個別的 Parallels
    macOS、Windows 或 Linux 煙霧測試執行管道平行執行。它們共用 VM 狀態，可能會在
    快照還原、套件提供或客體閘道狀態方面發生衝突。
  - 更新後證明會執行一般內建外掛介面，因為
    語音、影像生成和媒體理解等能力外觀介面
    會透過內建執行階段 API 載入，即使代理程式回合本身
    只檢查簡單的文字回應。

- `pnpm openclaw qa aimock`
  - 僅啟動本機 AIMock 提供者伺服器，以進行直接通訊協定冒煙
    測試。
- `pnpm openclaw qa matrix`
  - 針對由可拋棄式 Docker 支援的 Tuwunel
    主伺服器執行 Matrix 即時 QA 工作線。僅適用於原始碼簽出——封裝安裝不提供
    `qa-lab`。
  - 完整命令列介面、設定檔／情境目錄、環境變數與成品配置：
    [Matrix 冒煙測試工作線](/zh-TW/concepts/qa-e2e-automation#matrix-smoke-lanes)。
- `pnpm openclaw qa telegram`
  - 使用環境變數中的驅動程式與受測系統機器人權杖，針對真實私人群組
    執行 Telegram 即時 QA 工作線。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群組 ID 必須是數字格式的
    Telegram 聊天 ID。
  - 支援透過 `--credential-source convex` 使用共用集區認證資訊。
    預設使用環境變數模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    以選擇使用集區租約。
  - 預設涵蓋金絲雀測試、提及閘控、命令定址、`/status`、
    機器人對機器人的提及回覆，以及核心原生命令回覆。
    `mock-openai` 預設還涵蓋確定性回覆鏈與
    Telegram 最終訊息串流迴歸。使用 `--list-scenarios`
    執行選用探查，例如 `session_status`。
  - 任何情境失敗時會以非零狀態結束。使用 `--allow-failures`
    產生成品而不傳回失敗結束碼。
  - 需要同一私人群組中的兩個不同機器人，且受測系統機器人須公開
    Telegram 使用者名稱。
  - 為了穩定觀察機器人對機器人的互動，請在 `@BotFather`
    中為兩個機器人啟用 Bot-to-Bot Communication Mode，並確保驅動程式機器人能觀察
    群組中的機器人流量。
  - 在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要及
    `qa-evidence.json`。包含回覆的情境會記錄從驅動程式傳送
    要求到觀察到受測系統回覆的 RTT。

`Mantis Telegram Live` 是此工作線的 PR 證據包裝器。它會使用由 Convex 租用的
Telegram 認證資訊執行候選參照，在 Crabbox 桌面瀏覽器中呈現經遮蔽處理的
QA 報告／證據套件、錄製 MP4 證據、產生移除靜止畫面的 GIF、上傳成品套件，
並在設定 `pr_number` 時，透過 Mantis GitHub App 發布行內 PR 證據。
維護者可以從 Actions UI 透過 `Mantis Scenario`
（`scenario_id: telegram-live`）啟動，或直接從 PR 留言啟動：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
```

`Mantis Telegram Desktop Proof` 是用於 PR 視覺證明的代理式原生 Telegram Desktop
前後對照包裝器。可以從 Actions UI 使用自由格式的 `instructions` 啟動、
透過 `Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）啟動，或從 PR 留言啟動：

```text
@openclaw-mantis telegram desktop proof
```

Mantis 代理會讀取 PR、判斷哪些 Telegram 可見行為能證明變更、在基準與候選參照上
執行真實使用者 Crabbox Telegram Desktop 證明工作線、反覆調整直到原生 GIF
具備實用價值、寫入成對的 `motionPreview` 資訊清單，並在設定
`pr_number` 時，透過 Mantis GitHub App 發布相同的雙欄 GIF 表格。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重複使用 Crabbox Linux 桌面、安裝原生 Telegram
    Desktop、使用租用的 Telegram 受測系統機器人權杖設定 OpenClaw、
    啟動閘道，並從可見的 VNC 桌面錄製螢幕截圖／MP4 證據。
  - 預設為 `--credential-source convex`，因此工作流程只需要
    Convex 代理程式密鑰。使用 `--credential-source env` 時，請使用與
    `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 變數。
  - Telegram Desktop 仍需要使用者登入／設定檔。機器人權杖
    僅用於設定 OpenClaw。可使用 `--telegram-profile-archive-env <name>`
    提供 base64 `.tgz` 設定檔封存，或使用 `--keep-lease`，
    並透過 VNC 手動登入一次。
  - 在輸出目錄下寫入 `mantis-telegram-desktop-builder-report.md`、
    `mantis-telegram-desktop-builder-summary.json`、
    `telegram-desktop-builder.png` 和 `telegram-desktop-builder.mp4`。

即時傳輸工作線共用一份標準合約，以避免新傳輸發生偏差；各工作線的涵蓋矩陣位於
[QA 概觀——即時傳輸涵蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。
`qa-channel` 是廣泛的合成測試套件，不屬於該矩陣。

### 透過 Convex 共用 Telegram 認證資訊（v1）

為即時傳輸 QA 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）
時，QA 實驗室會從 Convex 支援的集區取得獨占租約，在工作線執行期間持續對該租約
進行心跳偵測，並於關閉時釋出租約。此章節名稱早於 Discord、Slack 和
WhatsApp 支援；各種類共用相同的租約合約。

Convex 專案參考骨架：`qa/convex-credential-broker/`

必要環境變數：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色的一個密鑰：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- 認證資訊角色選擇：
  - 命令列介面：`--credential-role maintainer|ci`
  - 環境變數預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，其他情況則為 `maintainer`）

選用環境變數：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設為 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設為 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設為 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設為 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設為 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用追蹤 ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許在僅限本機的開發環境中使用迴路 `http://` Convex URL。

正常運作時，`OPENCLAW_QA_CONVEX_SITE_URL` 應使用 `https://`。

維護者管理命令（新增／移除／列出集區）明確需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

維護者命令列介面輔助工具：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor` 檢查 Convex 網站 URL、代理程式密鑰、
端點前綴、HTTP 逾時及管理／列表可達性，而不列印密鑰值。在指令碼與 CI
公用程式中使用 `--json` 取得機器可讀輸出。

預設端點合約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）。
要求使用 `Authorization: Bearer <role secret>` 標頭進行驗證；
以下本文省略該標頭：

- `POST /acquire`
  - 要求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 已耗盡／可重試：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - 要求：`{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 成功：`{ status: "ok", index, data }`
- `POST /heartbeat`
  - 要求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空白的 `2xx`）
- `POST /release`
  - 要求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空白的 `2xx`）
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

Telegram 種類的酬載格式：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字格式的 Telegram 聊天 ID 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此格式，並拒絕格式錯誤的酬載。

Telegram 真實使用者種類的酬載格式：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 和 `telegramApiId` 必須是數字字串。
- `tdlibArchiveSha256` 和 `desktopTdataArchiveSha256` 必須是 SHA-256 十六進位字串。
- `kind: "telegram-user"` 保留供 Mantis Telegram Desktop 證明工作流程使用。一般 QA 實驗室工作線不得取得它。

由代理程式驗證的多頻道酬載：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 工作線也可以從集區租用，但目前 Slack 酬載驗證位於 Slack QA 執行器，
而非代理程式中。Slack 資料列請使用
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 將頻道加入 QA

新頻道介面卡的架構與情境輔助工具名稱位於
[QA 概觀——新增頻道](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。
最低要求：在共用 `qa-lab` 主機接縫上實作傳輸執行器、
為共用情境新增 `adapterFactory`、在外掛資訊清單中宣告 `qaRunners`、
掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫情境。

## 測試套件（各自在何處執行）

可將這些套件視為「真實程度逐步提高」（不穩定性／成本也隨之增加）。

### 單元／整合（預設）

- 命令：`pnpm test`
- 設定：未指定目標的執行會使用 `vitest.full-*.config.ts` 分片集，
  並可能將多專案分片展開為各專案設定，以進行平行
  排程
- 檔案：核心／單元清單位於 `src/**/*.test.ts`、
  `packages/**/*.test.ts` 和 `test/**/*.test.ts` 下；UI 單元測試在專用的
  `unit-ui` 分片中執行
- 範圍：
  - 純單元測試
  - 程序內整合測試（閘道驗證、路由、工具、剖析、設定）
  - 已知錯誤的確定性迴歸測試
- 預期：
  - 在 CI 中執行
  - 不需要真實金鑰
  - 應快速且穩定
  - 解析器與公開介面載入器測試必須使用產生的小型外掛固定裝置，
    證明廣泛的 `api.js` 和 `runtime-api.js` 後援行為，
    而非使用真實的內建外掛原始碼 API。真實外掛 API 載入應放在
    外掛自有的合約／整合測試套件中。

原生相依套件政策：

- 預設測試安裝會略過選用的原生 Discord opus 建置。Discord
  語音使用內建的 `libopus-wasm`，且 `@discordjs/opus` 在
  `allowBuilds` 中維持停用，使本機測試和 Testbox 工作線不會編譯原生
  附加元件。
- 請在 `libopus-wasm` 基準測試存放庫中比較原生 opus 效能，
  而非在預設 OpenClaw 安裝／測試迴圈中進行。請勿在預設的
  `allowBuilds` 中將 `@discordjs/opus` 設為
  `true`；這會導致不相關的安裝／測試迴圈編譯原生程式碼。

<AccordionGroup>
  <Accordion title="專案、分片與限定範圍的工作線">

    - 未指定目標的 `pnpm test` 會執行十三個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-tooling`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而非單一龐大的原生根專案程序。這可降低高負載機器上的 RSS 峰值，並避免自動回覆／外掛工作使不相關的測試套件資源不足。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片監看迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過限定範圍的執行區通道處理明確的檔案／目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免承擔完整根專案的啟動成本。
    - `pnpm test:changed` 預設會將有變更的 git 路徑展開至低成本的限定範圍執行區通道：直接測試編輯、同層的 `*.test.ts` 檔案、明確的來源對應，以及本機匯入圖中的相依項目。設定／設置／套件編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是一般狹窄範圍工作的智慧型本機檢查關卡。它會將差異分類為核心、核心測試、擴充功能、擴充功能測試、應用程式、文件、發布中繼資料、即時 Docker 工具和工具，然後執行相符的型別檢查、程式碼檢查及防護命令。它不會執行 Vitest 測試；如需測試佐證，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅含發布中繼資料的版本更新會執行針對性的版本／設定／根相依套件檢查，並透過防護機制拒絕頂層版本欄位以外的套件變更。
    - 即時 Docker ACP 測試框架的編輯會執行聚焦檢查：檢查即時 Docker 驗證指令碼的 shell 語法，以及執行即時 Docker 排程器的試執行。只有當差異僅限於 `scripts["test:docker:live-*"]` 時，才會納入 `package.json` 變更；相依套件、匯出、版本及其他套件表面編輯仍使用較廣泛的防護機制。
    - 來自代理程式、命令、外掛、自動回覆輔助程式、`plugin-sdk` 及類似純工具區域的輕量匯入單元測試，會透過 `unit-fast` 執行區通道執行，並略過 `test/setup-openclaw-runtime.ts`；具狀態／執行階段負載較高的檔案則維持使用現有執行區通道。
    - 部分選定的 `plugin-sdk` 和 `commands` 輔助程式原始檔，也會將變更模式執行對應至這些輕量執行區通道中的明確同層測試，因此輔助程式編輯可避免重新執行該目錄的完整高負載測試套件。
    - `auto-reply` 為頂層核心輔助程式、頂層 `reply.*` 整合測試及 `src/auto-reply/reply/**` 子樹設有專用分組。CI 還會將回覆子樹進一步拆分為代理程式執行器、分派及命令／狀態路由分片，避免單一匯入負載較高的分組包辦完整的 Node 尾端工作。
    - 一般 PR／main CI 會刻意略過隨附外掛批次掃描及僅供發布使用的 `agentic-plugins` 分片。完整發布驗證會針對發布候選版本分派獨立的 `Plugin Prerelease` 子工作流程，以執行這些外掛負載較高的測試套件。

  </Accordion>

  <Accordion title="內嵌執行器涵蓋範圍">

    - 變更訊息工具探索輸入或壓縮執行階段
      情境時，請維持這兩個層級的涵蓋範圍。
    - 針對純路由與正規化
      邊界新增聚焦的輔助程式迴歸測試。
    - 維持內嵌執行器整合測試套件的正常運作：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` 和
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - 這些測試套件會驗證限定範圍的 ID 與壓縮行為仍會流經
      真正的 `run.ts`／`compact.ts` 路徑；僅有輔助程式測試
      無法充分取代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest 集區與隔離預設值">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共用 Vitest 設定會固定 `isolate: false`，並在根專案、端對端測試及即時設定中
      使用非隔離執行器。
    - 根 UI 執行區通道會保留其 `jsdom` 設置與最佳化工具，但也會在
      共用的非隔離執行器上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest 設定繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序新增 `--no-maglev`，以減少大型本機執行期間的 V8 編譯額外負擔。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與原始 V8
      行為比較。
    - `scripts/run-vitest.mjs` 會在明確的非監看 Vitest 執行
      連續 5 分鐘沒有 stdout 或 stderr 輸出後將其終止。若要進行刻意保持靜默的調查，
      請設定 `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` 以停用監控程式。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示差異觸發了哪些架構執行區通道。
    - 提交前掛鉤僅執行格式化。它會重新暫存已格式化的檔案，
      不會執行程式碼檢查、型別檢查或測試。
    - 當你需要智慧型本機檢查關卡時，請在交接或推送前明確執行
      `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本的限定範圍執行區通道執行。只有在代理程式
      判定測試框架、設定、套件或合約編輯確實需要
      更廣泛的 Vitest 涵蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 會維持相同的路由
      行為，只是工作程式上限較高。
    - 本機工作程式的自動調整刻意採取保守策略，且會在主機平均負載
      已經偏高時降低規模，因此預設可減少多個並行
      Vitest 執行所造成的影響。
    - 基礎 Vitest 設定會將專案／設定檔標記為
      `forceRerunTriggers`，以便在測試
      接線變更時維持變更模式重新執行的正確性。
    - 此設定會在支援的主機上維持啟用
      `OPENCLAW_VITEST_FS_MODULE_CACHE`；如需一個明確的快取位置以直接進行效能分析，
      請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能偵錯">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入持續時間報告及
      匯入細目輸出。
    - `pnpm test:perf:imports:changed` 會將相同的效能分析檢視範圍限定為
      自 `origin/main` 起變更的檔案。
    - 分片計時資料會寫入 `.artifacts/vitest-shard-timings.json`。
      完整設定執行會使用設定路徑作為索引鍵；包含模式的 CI
      分片則會附加分片名稱，以便個別追蹤篩選後的分片。
    - 若某個高負載測試的大部分時間仍花在啟動匯入上，
      請將高負載相依套件置於狹窄的本機 `*.runtime.ts` 接合層之後，
      並直接模擬該接合層，而不要僅為了透過 `vi.mock(...)`
      傳遞執行階段輔助程式而深層匯入它們。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對該已提交差異，比較路由後的
      `test:changed` 與原生根專案路徑，並輸出實際經過時間及 macOS RSS 最大值。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest 設定路由已變更檔案清單，
      以對目前的未提交工作樹進行基準測試。
    - `pnpm test:perf:profile:main` 會為
      Vitest／Vite 啟動及轉換額外負擔寫入主執行緒 CPU 設定檔。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行處理的情況下，
      為單元測試套件寫入執行器 CPU + 堆積設定檔。

  </Accordion>
</AccordionGroup>

### 穩定性（閘道）

- 命令：`pnpm test:stability:gateway`
- 設定：`test/vitest/vitest.gateway.config.ts`、`test/vitest/vitest.logging.config.ts` 和 `test/vitest/vitest.infra.config.ts`，每個都強制使用一個工作程式
- 範圍：
  - 啟動真實的迴路閘道，並預設啟用診斷
  - 透過診斷事件路徑驅動合成的閘道訊息、記憶體及大型承載資料變動
  - 透過閘道 WS RPC 查詢 `diagnostics.stability`
  - 涵蓋診斷穩定性套組的持久化輔助程式
  - 斷言記錄器維持在界限內、合成 RSS 樣本保持低於壓力預算，且每個工作階段的佇列深度會降回零
- 預期：
  - 可安全用於 CI，且不需要金鑰
  - 用於穩定性迴歸後續處理的狹窄執行區通道，不能取代完整的閘道測試套件

### 端對端測試（儲存庫彙總）

- 命令：`pnpm test:e2e`
- 範圍：
  - 執行閘道冒煙端對端測試執行區通道
  - 執行模擬的 Control UI 瀏覽器端對端測試執行區通道
- 預期：
  - 可安全用於 CI，且不需要金鑰
  - 必須已安裝 Playwright Chromium

### 端對端測試（閘道冒煙測試）

- 命令：`pnpm test:e2e:gateway`
- 設定：`test/vitest/vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的隨附外掛端對端測試
- 執行階段預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與儲存庫其餘部分一致。
  - 使用自適應工作程式（CI：最多 2 個，本機：預設 1 個）。
  - 預設以靜默模式執行，以降低主控台 I/O 額外負擔。
- 實用的覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制指定工作程式數量（上限為 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用詳細主控台輸出。
- 範圍：
  - 多執行個體閘道的端對端行為
  - WebSocket／HTTP 表面、節點配對及負載較高的網路作業
- 預期：
  - 在 CI 中執行（當流水線中已啟用時）
  - 不需要真實金鑰
  - 比單元測試有更多運作元件（可能較慢）

### 端對端測試（Control UI 模擬瀏覽器）

- 命令：`pnpm test:ui:e2e`
- 設定：`test/vitest/vitest.ui-e2e.config.ts`
- 檔案：`ui/src/**/*.e2e.test.ts`
- 範圍：
  - 啟動 Vite Control UI
  - 透過 Playwright 驅動真實的 Chromium 頁面
  - 以具確定性的瀏覽器內模擬取代閘道 WebSocket
- 預期：
  - 在 CI 中作為 `pnpm test:e2e` 的一部分執行
  - 不需要真實的閘道、代理程式或供應商金鑰
  - 瀏覽器相依套件必須存在（`pnpm --dir ui exec playwright install chromium`）

### 端對端測試：OpenShell 後端冒煙測試

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 重複使用作用中的本機 OpenShell 閘道
  - 從暫時的本機 Dockerfile 建立沙箱
  - 透過真實的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell 後端
  - 透過沙箱檔案系統橋接器驗證遠端標準檔案系統行為
- 預期：
  - 僅能選擇加入；不屬於預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` 命令列介面及可正常運作的 Docker 常駐程式
  - 需要作用中的本機 OpenShell 閘道及其設定來源
  - 使用隔離的 `HOME`／`XDG_CONFIG_HOME`，然後銷毀測試沙箱
- 實用的覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 可在手動執行更廣泛的端對端測試套件時啟用此測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非預設的命令列介面二進位檔或包裝指令碼
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` 可將已註冊的閘道設定提供給隔離測試
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` 可覆寫主機原則測試資料所使用的 Docker 閘道 IP

### 即時測試（真實供應商 + 真實模型）

- 命令：`pnpm test:live`
- 設定：`test/vitest/vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的隨附外掛即時測試
- 預設值：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「此供應商／模型使用真實認證資訊，_目前_確實能運作嗎？」
  - 偵測供應商格式變更、工具呼叫的特殊行為、驗證問題及速率限制行為
- 預期：
  - 設計上不保證在 CI 中穩定（真實網路、真實供應商政策、配額及服務中斷）
  - 會產生費用／耗用速率限制額度
  - 優先執行範圍縮小的子集，而非「全部」
- 即時執行會使用已匯出的 API 金鑰和已暫存的驗證設定檔。
- 依預設，即時執行仍會隔離 `HOME`，並將設定／驗證資料複製到暫存測試主目錄，避免單元測試夾具變更你實際的 `~/.openclaw`。
- 只有在刻意需要即時測試使用你的實際主目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 預設採用較安靜的模式：保留 `[live] ...` 進度輸出，並將閘道啟動日誌／Bonjour 訊息靜音。如需恢復完整的啟動日誌，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依供應商而異）：使用逗號／分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可透過 `OPENCLAW_LIVE_*_KEY` 針對個別即時執行覆寫；測試遇到速率限制回應時會重試。
- 進度／心跳偵測輸出：
  - 即時測試套件會將進度行輸出至 stderr，因此即使 Vitest 主控台擷取未顯示訊息，也能看出耗時的供應商呼叫仍在進行。
  - `test/vitest/vitest.live.config.ts` 會停用 Vitest 主控台攔截，讓供應商／閘道進度行在即時執行期間立即串流顯示。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整直接模型的心跳偵測。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整閘道／探查的心跳偵測。

## 我應該執行哪個測試套件？

請使用此決策表：

- 編輯邏輯／測試：執行 `pnpm test`（若變更範圍很大，也執行 `pnpm test:coverage`）
- 觸及閘道網路／WS 通訊協定／配對：加上 `pnpm test:e2e`
- 偵錯「我的機器人無法運作」／特定供應商失敗／工具呼叫：執行範圍縮小的 `pnpm test:live`

## 即時（會存取網路的）測試

關於即時模型矩陣、命令列介面後端冒煙測試、ACP 冒煙測試、Codex app-server
測試框架，以及所有媒體供應商即時測試（Deepgram、BytePlus、ComfyUI、
圖片、音樂、影片、媒體測試框架），還有即時執行的認證資訊處理方式，

- 請參閱[測試即時套件](/zh-TW/help/testing-live)。如需專用的更新和
  外掛驗證檢查清單，請參閱
  [測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

## Docker 執行器（選用的「可在 Linux 中運作」檢查）

這些 Docker 執行器分為兩類：

- 即時模型執行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在儲存庫 Docker 映像檔（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`）內執行各自相符的設定檔金鑰即時檔案，並掛載你的本機設定目錄、工作區和選用的設定檔環境變數檔案。相符的本機進入點為 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時執行器會在需要時保留各自實用的上限：
  `test:docker:live-models` 預設使用精選且支援的高訊號集合，而
  `test:docker:live-gateway` 預設使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在明確需要較小上限或較大掃描範圍時，才設定 `OPENCLAW_LIVE_MAX_MODELS`
  或閘道環境變數。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置一次即時 Docker 映像檔，再透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 封裝一次為 npm tarball，接著建置／重複使用兩個 `scripts/e2e/Dockerfile` 映像檔。基本映像檔僅作為安裝／更新／外掛相依項目測試通道的 Node/Git 執行器；這些測試通道會掛載預先建置的 tarball。功能映像檔會將相同的 tarball 安裝至 `/app`，供已建置應用程式的功能測試通道使用。Docker 測試通道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行所選計畫。彙總執行器使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制處理程序插槽，而資源上限可防止繁重的即時、npm 安裝和多服務測試通道同時全部啟動。如果單一測試通道的負載超過目前上限，排程器仍可在資源池為空時啟動它，之後讓它單獨執行，直到再次有可用容量。預設值為 10 個插槽、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`（以及其他 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 覆寫值）。執行器預設會執行 Docker 前置檢查、移除過時的 OpenClaw E2E 容器、每 30 秒輸出一次狀態、將成功測試通道的計時資料儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行時根據這些計時資料優先啟動耗時較長的測試通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不建置或執行 Docker 的情況下輸出加權測試通道資訊清單；使用 `node scripts/test-docker-all.mjs --plan-json` 可輸出所選測試通道、套件／映像檔需求和認證資訊的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生套件檢查關卡，用來確認「這個可安裝的 tarball 能否作為產品正常運作？」它會從 `source=npm`、`source=ref`、`source=url`、`source=trusted-url` 或 `source=artifact` 解析出一個候選套件，將其上傳為 `package-under-test`，再針對該確切 tarball 執行可重複使用的 Docker E2E 測試通道，而非重新封裝所選參照。設定檔依涵蓋範圍排序：`smoke`、`package`、`product` 和 `full`（另有 `custom` 可用於明確的測試通道清單）。關於套件／更新／外掛合約、已發布升級存續矩陣、發布預設值和失敗分類處理，請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。
- 建置和發布檢查會在 tsdown 之後執行 `scripts/check-cli-bootstrap-imports.mjs`。此防護會從 `dist/entry.js` 和 `dist/cli/run-main.js` 開始遍歷靜態建置圖；如果該分派前啟動圖在命令分派前靜態匯入任何外部套件（Commander、提示 UI、undici、記錄功能和類似的啟動繁重相依套件均包含在內），檢查就會失敗；它也會將隨附的閘道執行區塊限制為 70 KB，並拒絕該區塊靜態匯入已知的冷門閘道路徑（`control-ui-assets`、`diagnostic-stability-bundle`、`onboard-helpers`、`process-respawn`、`restart-sentinel`、`server-close`、`server-reload-handlers`）。`scripts/release-check.ts` 會另外使用 `--help`、`onboard --help`、`doctor --help`、`status --json --timeout 1`、`config schema` 和 `models list --provider openai`，對已封裝的命令列介面進行冒煙測試。
- Package Acceptance 的舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。截至該界線，測試框架僅容許已發布套件的中繼資料缺漏：省略私有 QA 資訊清單項目、缺少 `gateway install --wrapper`、由 tarball 衍生的 git 測試夾具缺少修補檔案、缺少已持久化的 `update.channel`、舊版外掛安裝記錄位置、缺少市集安裝記錄持久化，以及在 `plugins update` 期間進行設定中繼資料遷移。對於 `2026.4.25` 之後的套件，這些情況都會視為嚴格失敗。
- 容器冒煙測試執行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 會啟動一或多個真實容器，並驗證較高層級的整合路徑。
- 透過 `scripts/lib/openclaw-e2e-instance.sh` 安裝已封裝 OpenClaw tarball 的 Docker/Bash E2E 測試通道，會將 `npm install` 上限設為 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（預設為 `600s`；設定 `0` 可停用包裝器以進行偵錯）。

即時模型 Docker 執行器也只會繫結掛載所需的命令列介面驗證主目錄
（若執行範圍未縮小，則掛載所有支援的主目錄），接著在執行前將它們複製到
容器主目錄，讓外部命令列介面的 OAuth 能重新整理權杖，
而不會變更主機的驗證儲存區：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 繫結冒煙測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid/OpenCode）
- 命令列介面後端冒煙測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 測試框架冒煙測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- 閘道 + 開發代理程式：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 和 `pnpm qa:observability:smoke` 是私有 QA 原始碼簽出測試通道。它們刻意不納入套件 Docker 發布測試通道，因為 npm tarball 會省略 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- 新手設定精靈（TTY，完整基礎架構建立）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手設定／頻道／代理程式冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball，預設透過環境變數參照新手設定來設定 OpenAI 和 Telegram、執行 doctor，並執行一次模擬的 OpenAI 代理程式回合。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可重複使用預先建置的 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 可略過主機重新建置，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換頻道。

- 發布使用者流程冒煙測試：`pnpm test:docker:release-user-journey` 會在乾淨的 Docker 主目錄中全域安裝已封裝的 OpenClaw tarball、執行初始設定、設定模擬的 OpenAI 提供者、執行一次代理程式回合、安裝／解除安裝外部外掛、使用本機固定測試資料設定 ClickClack、驗證傳出／傳入訊息、重新啟動閘道，並執行 doctor。
- 發布型別化初始設定冒煙測試：`pnpm test:docker:release-typed-onboarding` 會安裝已封裝的 tarball、透過真實 TTY 操作 `openclaw onboard`、將 OpenAI 設定為環境變數參照提供者、驗證不會保存原始金鑰，並執行一次模擬的代理程式回合。
- 發布媒體／記憶冒煙測試：`pnpm test:docker:release-media-memory` 會安裝已封裝的 tarball、驗證對 PNG 附件的圖片理解、OpenAI 相容的圖片生成輸出、記憶搜尋回想能力，以及重新啟動閘道後仍能保留回想能力。
- 發布升級使用者流程冒煙測試：`pnpm test:docker:release-upgrade-user-journey` 預設會安裝比候選 tarball 更舊且最新發布的基準版本、在已發布套件上設定提供者／外掛／ClickClack 狀態、升級至候選 tarball，然後重新執行核心代理程式／外掛／頻道流程。若不存在較舊的已發布基準版本，則重複使用候選版本。可使用 `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` 覆寫基準版本。
- 發布外掛市集冒煙測試：`pnpm test:docker:release-plugin-marketplace` 會從本機固定測試市集安裝、更新已安裝的外掛、解除安裝該外掛，並驗證外掛命令列介面會消失且安裝中繼資料已清除。
- Skill 安裝冒煙測試：`pnpm test:docker:skill-install` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball、在設定中停用上傳封存檔安裝、從搜尋結果解析目前線上的 ClawHub skill slug、使用 `openclaw skills install` 安裝，並驗證已安裝的 skill 及 `.clawhub` 來源／鎖定中繼資料。
- 更新頻道切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball、從套件 `stable` 切換至 git `dev`、驗證持久保存的頻道及外掛更新後作業，然後切回套件 `stable` 並檢查更新狀態。
- 升級存續冒煙測試：`pnpm test:docker:upgrade-survivor` 會在包含代理程式、頻道設定、外掛允許清單、過時外掛相依性狀態，以及既有工作區／工作階段檔案的髒舊使用者固定測試資料上，安裝已封裝的 OpenClaw tarball。它會在沒有即時提供者或頻道金鑰的情況下執行套件更新及非互動式 doctor，然後啟動迴路閘道，並檢查設定／狀態保留情形及啟動／狀態時間預算。
- 已發布版本升級存續冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`、植入擬真的既有使用者檔案、使用內建命令配方設定該基準版本、驗證產生的設定、將該已發布安裝更新至候選 tarball、執行非互動式 doctor、寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動迴路閘道，並檢查已設定的意圖、狀態保留情形、啟動、`/healthz`、`/readyz` 及 RPC 狀態時間預算。可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準版本；可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 要求彙總排程器展開精確的本機基準版本，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`；也可使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開問題型固定測試資料，例如 `reported-issues`；已回報問題集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw 外掛安裝。套件驗收會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 及 `published_upgrade_survivor_scenarios`，解析 `last-stable-4` 或 `all-since-2026.4.23` 等中繼基準版本權杖，而完整發布驗證會將發布浸泡套件閘門展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- 工作階段執行階段內容冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段內容的對話記錄持久保存，以及 doctor 對受影響之重複提示重寫分支的修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會封裝目前的程式碼樹、在隔離的主目錄中使用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會傳回內建圖片提供者，而不是無限等待。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重複使用預先建置的 tarball、使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 略過主機建置，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝程式 Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會讓其 root、更新及直接 npm 容器共用一個 npm 快取。更新冒煙測試預設會先使用 npm `latest` 作為穩定基準版本，再升級至候選 tarball。在本機可使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用 Install Smoke 工作流程的 `update_baseline_version` 輸入覆寫。非 root 安裝程式檢查會維持隔離的 npm 快取，避免 root 擁有的快取項目掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重新執行時重複使用 root／更新／直接 npm 快取。
- Install Smoke CI 會使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 略過重複的直接 npm 全域更新；需要直接 `npm install -g` 涵蓋範圍時，請在本機執行指令碼且不要設定該環境變數。
- 代理程式刪除共用工作區的命令列介面冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置根目錄 Dockerfile 映像、在隔離的容器主目錄中植入兩個共用同一工作區的代理程式、執行 `agents delete --json`，並驗證有效的 JSON 及工作區保留行為。可使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重複使用 install-smoke 映像。
- 閘道網路與主機生命週期：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）會保留雙容器 LAN WebSocket 驗證／健康狀態冒煙測試，接著使用迴路 Admin HTTP 證明準備隔離、保留控制權存取、繼續執行復原，以及同一容器內已準備的停止／啟動。重新啟動檢查必須在原始租約到期前完成；它會驗證暫停狀態僅存在於處理程序本機，而持久保存的閘道設定及容器身分仍會保留，並輸出機器可讀的階段計時 JSON。
- 瀏覽器 CDP 快照冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置來源 E2E 映像及 Chromium 層、使用原始 CDP 啟動 Chromium、執行 `browser doctor --deep`，並驗證 CDP 角色快照涵蓋連結 URL、由游標提升的可點擊項目、iframe 參照及框架中繼資料。
- OpenAI Responses web_search 最小推理迴歸測試：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過閘道執行模擬的 OpenAI 伺服器、驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提高至 `low`，然後強制提供者結構描述拒絕請求，並檢查原始詳細資料是否出現在閘道日誌中。
- MCP 頻道橋接器（預先植入的閘道 + stdio 橋接器 + 原始 Claude 通知框架冒煙測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw 套件 MCP 工具（真實 stdio MCP 伺服器 + 內嵌 OpenClaw 設定檔允許／拒絕冒煙測試）：`pnpm test:docker:agent-bundle-mcp-tools`（指令碼：`scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- 排程／子代理程式 MCP 清理（真實閘道 + 隔離排程及單次子代理程式執行後的 stdio MCP 子處理程序拆除）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 外掛（本機路徑、`file:`、具有提升相依性的 npm 登錄、格式錯誤的 npm 套件中繼資料、git 移動參照、ClawHub 全功能測試套件、市集更新，以及 Claude 套件啟用／檢查的安裝／更新冒煙測試）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可略過 ClawHub 區塊，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 及 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的全功能測試套件／執行階段組合。若未設定 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用封閉式本機 ClawHub 固定測試伺服器。
- 外掛更新無變更冒煙測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 外掛生命週期矩陣冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在空白容器中安裝已封裝的 OpenClaw tarball、安裝 npm 外掛、切換啟用／停用狀態、透過本機 npm 登錄升級及降級該外掛、刪除已安裝的程式碼，然後驗證解除安裝仍會移除過時狀態，同時記錄各生命週期階段的 RSS／CPU 指標。
- 設定重新載入中繼資料冒煙測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- 外掛：`pnpm test:docker:plugins` 涵蓋本機路徑、`file:`、具有提升相依性的 npm 登錄、git 移動參照、ClawHub 固定測試資料、市集更新，以及 Claude 套件啟用／檢查的安裝／更新冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝外掛的無變更更新行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋具資源追蹤的 npm 外掛安裝、啟用、停用、升級、降級，以及程式碼遺失時的解除安裝。

若要手動預先建置並重複使用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

特定套件的映像覆寫（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）在設定後仍會優先採用。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，若本機尚無該映像，指令碼會將其拉取下來。QR 與安裝程式的 Docker 測試會保留各自的 Dockerfile，因為它們驗證的是套件／安裝行為，而非共用的已建置應用程式執行環境。

即時模型 Docker 執行器也會以唯讀方式繫結掛載目前的簽出內容，
並將其暫存至容器內的臨時工作目錄。這能讓執行環境映像保持精簡，
同時仍可針對你的確切本機原始碼／設定執行 Vitest。
暫存步驟會略過大型的僅供本機使用快取與應用程式建置輸出，
例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及
應用程式本機的 `.build` 或 Gradle 輸出目錄，讓 Docker 即時執行不會
耗費數分鐘複製特定於機器的成品。它們也會設定
`OPENCLAW_SKIP_CHANNELS=1`，因此閘道即時探測不會在容器內啟動真實的
Telegram／Discord／其他頻道工作程序。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要縮小或排除該 Docker
執行路徑中的閘道即時涵蓋範圍時，也請傳入
`OPENCLAW_LIVE_GATEWAY_*`。

`test:docker:openwebui` 是較高層級的相容性冒煙測試：它會啟動一個
已啟用 OpenAI 相容 HTTP 端點的 OpenClaw 閘道容器，
再針對該閘道啟動固定版本的 Open WebUI 容器、透過
Open WebUI 登入、確認 `/api/models` 有公開 `openclaw/default`，然後透過
Open WebUI 的 `/api/chat/completions` 代理傳送真實的聊天要求。若發行路徑的 CI 檢查應在
Open WebUI 登入與模型探索完成後停止，而不等待即時模型
完成回應，請設定 `OPENWEBUI_SMOKE_MODE=models`。第一次執行可能會明顯較慢，因為 Docker 可能需要
拉取 Open WebUI 映像，而 Open WebUI 也可能需要完成其自身的
冷啟動設定。此執行路徑需要可用的即時模型金鑰，該金鑰可透過
程序環境、已暫存的驗證設定檔，或明確的
`OPENCLAW_PROFILE_FILE` 提供。成功執行時會輸出一小段 JSON 承載資料，例如
`{ "ok": true, "model": "openclaw/default", ... }`。

`test:docker:mcp-channels` 採刻意設計的確定性行為，且不需要
真實的 Telegram、Discord 或 iMessage 帳號。它會啟動已植入種子資料的閘道
容器，再啟動第二個容器來衍生 `openclaw mcp serve`，接著
透過真實的 stdio MCP 橋接器，驗證經路由的對話探索、逐字稿讀取、附件
中繼資料、即時事件佇列行為、對外傳送路由，以及 Claude 風格的
頻道與權限通知。通知檢查會直接檢視原始 stdio MCP 訊框，
因此該冒煙測試驗證的是橋接器實際發出的內容，而不只是特定用戶端 SDK
恰好公開的內容。

`test:docker:agent-bundle-mcp-tools` 是確定性的，不需要即時模型金鑰。它會建置儲存庫的 Docker 映像，在容器內啟動真正的 stdio MCP 探測伺服器，透過內嵌 OpenClaw 套件的 MCP 執行環境具現化該伺服器、執行工具，然後驗證 `coding` 和 `messaging` 會保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 會將其篩除。

`test:docker:cron-mcp-cleanup` 是確定性的，不需要即時模型金鑰。它會啟動已植入種子資料的閘道及真正的 stdio MCP 探測伺服器，執行隔離的排程回合和一個 `sessions_spawn` 單次子回合，然後驗證 MCP 子行程會在每次執行後結束。

手動 ACP 自然語言討論串煙霧測試（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 請保留此指令碼以供迴歸／偵錯工作流程使用。ACP 討論串路由驗證可能還會需要它，因此請勿刪除。

實用環境變數：

- `OPENCLAW_CONFIG_DIR=...`（預設值：`~/.openclaw`）掛載至 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設值：`~/.openclaw/workspace`）掛載至 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` 會在執行測試前掛載並載入
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用於驗證只載入來自 `OPENCLAW_PROFILE_FILE` 的環境變數，並使用暫存設定／工作區目錄且不掛載外部命令列介面驗證
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設值：`~/.cache/openclaw/docker-cli-tools`，除非該次執行已使用 CI／受管理的繫結目錄）掛載至 `/home/node/.npm-global`，供 Docker 內快取命令列介面安裝項目
- `$HOME` 下的外部命令列介面驗證目錄／檔案會以唯讀方式掛載至 `/host-auth...`，接著在測試開始前複製到 `/home/node/...`
  - 預設目錄（未將執行範圍縮限至特定提供者時使用）：`.factory`、`.gemini`、`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮限提供者的執行只會掛載根據 `OPENCLAW_LIVE_PROVIDERS`／`OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要目錄／檔案
  - 可使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗號分隔清單手動覆寫
- 使用 `OPENCLAW_LIVE_GATEWAY_MODELS=...`／`OPENCLAW_LIVE_MODELS=...` 縮限執行範圍
- 使用 `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...`／`OPENCLAW_LIVE_PROVIDERS=...` 在容器內篩選提供者
- 使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，在不需要重新建置的再次執行中重複使用現有 `openclaw:local-live` 映像
- 使用 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`，確保認證資訊來自設定檔儲存區（而非環境變數）
- 使用 `OPENCLAW_OPENWEBUI_MODEL=...` 選擇閘道為 Open WebUI 煙霧測試公開的模型
- 使用 `OPENCLAW_OPENWEBUI_PROMPT=...` 覆寫 Open WebUI 煙霧測試使用的隨機數檢查提示詞
- 使用 `OPENWEBUI_IMAGE=...` 覆寫固定的 Open WebUI 映像標籤

## 文件健全性檢查

編輯文件後執行文件檢查：`pnpm check:docs`。
需要同時檢查頁面內標題時，請執行完整的 Mintlify 錨點驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（適用於 CI）

以下是不使用真實提供者的「真實流水線」迴歸測試：

- 閘道工具呼叫（模擬 OpenAI、真實閘道與代理程式迴圈）：`src/gateway/gateway.test.ts`（案例：“透過閘道代理程式迴圈端對端執行模擬 OpenAI 工具呼叫”）
- 閘道精靈（WS `wizard.start`/`wizard.next`，寫入設定並強制執行驗證）：`src/gateway/gateway.test.ts`（案例：“透過 ws 執行精靈並寫入驗證權杖設定”）

## 代理程式可靠性評估（Skills）

目前已有幾項適用於 CI、運作方式類似「代理程式可靠性評估」的測試：

- 透過真實閘道與代理程式迴圈進行模擬工具呼叫（`src/gateway/gateway.test.ts`）。
- 驗證工作階段接線與設定效果的端對端精靈流程（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **決策：**當提示詞中列出 Skills 時，代理程式是否會選擇正確的 Skill（或避開不相關的 Skill）？
- **遵循性：**代理程式是否會在使用前讀取 `SKILL.md`，並遵循必要的步驟／引數？
- **工作流程合約：**可斷言工具順序、工作階段歷程延續及沙箱邊界的多回合情境。

未來的評估應優先保持確定性：

- 使用模擬提供者的情境執行器，用於斷言工具呼叫與順序、Skill 檔案讀取及工作階段接線。
- 一小套以 Skill 為重點的情境（使用與避免、閘控、提示詞注入）。
- 僅在適用於 CI 的套件就緒後，才加入選用且由環境變數控制的即時評估。

## 合約測試（外掛與頻道形態）

合約測試會驗證每個已註冊的外掛與頻道都符合其介面合約。它們會逐一處理所有探索到的外掛，並執行一套形態與行為斷言。預設的 `pnpm test` 單元測試路徑會刻意略過這些共用接縫與煙霧測試檔案；異動共用頻道或提供者介面時，請明確執行合約命令。

### 命令

- 所有合約：`pnpm test:contracts`
- 僅頻道合約：`pnpm test:contracts:channels`
- 僅提供者合約：`pnpm test:contracts:plugins`

### 頻道合約

位於 `src/channels/plugins/contracts/*.contract.test.ts`。目前的頂層類別：

- **channel-catalog** - 內建／登錄檔頻道目錄項目中繼資料
- **plugin**（以登錄檔為基礎、分片）- 基本外掛註冊形態
- **surfaces-only**（以登錄檔為基礎、分片）- 針對 `actions`、`setup`、`status`、`outbound`、`messaging`、`threading`、`directory` 及 `gateway` 的各介面形態檢查
- **session-binding**（以登錄檔為基礎）- 工作階段繫結行為
- **outbound-payload** - 訊息承載資料結構與正規化
- **group-policy**（備援）- 各頻道的預設群組原則強制執行
- **threading**（以登錄檔為基礎、分片）- 討論串 ID 處理
- **directory**（以登錄檔為基礎、分片）- 目錄／名冊 API
- **registry** 和 **plugins-core.\*** - 頻道外掛登錄檔、載入器及設定寫入授權內部機制

這些套件使用的傳入分派擷取與傳出承載資料測試框架輔助程式，會透過 `src/plugin-sdk/channel-contract-testing.ts` 在內部公開（已從 npm 排除，並非公開 SDK 子路徑）；此目錄中沒有獨立的 `inbound.contract.test.ts` 檔案。

### 提供者合約

位於 `src/plugins/contracts/*.contract.test.ts`。目前的類別包括：

- **shape** - 外掛資訊清單、API 與執行環境匯出形態
- **plugin-registration**（及平行版本）- 資訊清單註冊案例
- **package-manifest** - 套件資訊清單要求
- **loader** - 外掛載入器設定／拆卸行為
- **registry** - 外掛合約登錄檔內容與查詢
- **providers** - 內建提供者之間的共用提供者行為，以及網頁搜尋提供者
- **auth-choice** - 驗證選項中繼資料與設定行為
- **provider-catalog-deprecation** - 已淘汰的提供者目錄中繼資料
- **wizard.choice-resolution**、**wizard.model-picker**、**wizard.setup-options** - 提供者設定精靈合約
- **embedding-provider**、**memory-embedding-provider**、**web-fetch-provider**、**tts** - 特定功能的提供者合約
- **session-actions**、**session-attachments**、**session-entry-projection** - 外掛擁有的工作階段狀態合約
- **scheduled-turns** - 外掛排程回合中繼資料與時間戳記界限
- **host-hooks**、**run-context-lifecycle**、**runtime-import-side-effects**、**runtime-seams** - 外掛主機／執行環境生命週期與匯入邊界合約
- **extension-runtime-dependencies** - 擴充功能的執行環境相依套件放置位置

### 執行時機

- 變更 plugin-sdk 匯出項目或子路徑之後
- 新增或修改頻道或提供者外掛之後
- 重構外掛註冊或探索機制之後

合約測試會在 CI 中執行，且不需要真實 API 金鑰。

## 新增迴歸測試（指南）

修正在即時環境中發現的提供者／模型問題時：

- 如有可能，新增適用於 CI 的迴歸測試（模擬／虛設提供者，或擷取確切的請求形態轉換）
- 若問題本質上只能在即時環境中測試（速率限制、驗證原則），請保持即時測試範圍狹窄，並透過環境變數選擇啟用
- 優先鎖定能捕捉錯誤的最小層級：
  - 提供者請求轉換／重播錯誤 -> 直接模型測試
  - 閘道工作階段／歷程／工具流水線錯誤 -> 閘道即時煙霧測試或適用於 CI 的閘道模擬測試
- SecretRef 路徑穿越防護：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會根據登錄檔中繼資料（`listSecretTargetRegistryEntries()`），為每個 SecretRef 類別衍生一個抽樣目標，接著斷言包含路徑穿越區段的執行 ID 會遭拒絕。
  - 如果在 `src/secrets/target-registry-data.ts` 中新增 `includeInPlan` SecretRef 目標系列，請更新該測試中的 `classifyTargetClass`。此測試會刻意在遇到未分類的目標 ID 時失敗，避免系統無聲略過新類別。

## 相關內容

- [即時測試](/zh-TW/help/testing-live)
- [測試更新與外掛](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
