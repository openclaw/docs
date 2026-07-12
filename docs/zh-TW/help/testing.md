---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型／供應商錯誤新增迴歸測試
    - 偵錯閘道與代理程式行為
summary: 測試工具組：單元／端對端／即時測試套件、Docker 執行器，以及各項測試的涵蓋範圍
title: 測試
x-i18n:
    generated_at: "2026-07-11T21:24:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 測試套件（單元／整合、端對端、即時），以及 Docker
執行器。本頁說明各套件涵蓋的範圍、針對特定工作流程應執行的命令、即時測試如何探索憑證，以及如何為實際的供應商／模型錯誤新增迴歸測試。

<Note>
**QA 技術堆疊（qa-lab、qa-channel、即時傳輸通道）**另有獨立文件：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) - 架構、命令介面、情境編寫。
- [矩陣 QA](/zh-TW/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的參考資料。
- [成熟度評分卡](/zh-TW/maturity/scorecard) - 發行 QA 證據如何支援穩定性與 LTS 決策。
- [QA 頻道](/zh-TW/channels/qa-channel) - 由儲存庫支援的情境所使用的合成傳輸外掛。

本頁涵蓋一般測試套件及 Docker／Parallels 執行器。下方的 [QA 專用執行器](#qa-specific-runners) 列出具體的 `qa` 呼叫方式，並連回上述參考資料。
</Note>

## 快速開始

大多數情況：

- 完整閘門（預期在推送前執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足的機器上更快速地於本機執行完整套件：`pnpm test:max`
- 直接使用 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案時，也會路由至外掛／頻道路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 反覆處理單一失敗時，請優先執行針對性測試。
- 以 Docker 支援的 QA 站台：`pnpm qa:lab:up`
- 以 Linux 虛擬機器支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你修改測試或需要額外信心時：

- 資訊性 V8 覆蓋率報告：`pnpm test:coverage`
- 端對端測試套件：`pnpm test:e2e`

## 測試暫存目錄

針對由測試擁有的暫存目錄，請使用 `test/helpers/temp-dir.ts` 中的共用輔助工具，讓擁有權明確，並確保清理由測試生命週期管理：

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` 刻意不公開手動清理方法，因為 Vitest 會在每項測試後負責清理。較舊的低階輔助工具（`makeTempDir`、`cleanupTempDirs`、`createTempDirTracker`）仍供尚未遷移的測試使用；請避免新增這些工具的用法，也請避免新增直接呼叫 `fs.mkdtemp*` 的程式碼，除非測試明確要驗證原始暫存目錄行為。確實需要直接建立暫存目錄時，請加上可稽核的允許註解並說明原因：

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` 會報告新增差異行中直接建立暫存目錄及新增手動使用共用輔助工具的情況，但不會阻擋既有的清理方式。它使用與 `scripts/changed-lanes.mjs` 相同的測試路徑分類方式，並略過共用輔助工具本身的實作。`check:changed` 會針對已變更的測試路徑執行此報告，作為僅警告的 CI 訊號（GitHub 警告註解，而非失敗）。

## 即時與 Docker／Parallels 工作流程

偵錯實際供應商／模型時（需要真實憑證）：

- 即時測試套件（模型及閘道工具／圖片探查）：`pnpm test:live`
- 以靜默模式指定單一即時測試檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：分派 `OpenClaw Performance`，設定
  `live_openai_candidate=true` 以執行一次真實的 `openai/gpt-5.6-luna` 代理程式回合，或設定
  `deep_profile=true` 以產生 Kova CPU／堆積／追蹤成品。每日排程執行會透過獨立的成品取用發布工作，將模擬供應商、深度剖析及 GPT-5.6 Luna 通道報告發布至
  `openclaw/clawgrit-reports`；若發布者驗證缺失或無效，排程執行與
  `profile=release` 執行都會失敗。手動非發行分派會保留 GitHub 成品，並將報告發布視為建議性項目。模擬供應商報告也包含原始碼層級的閘道啟動、記憶體、外掛壓力、重複的假模型 hello 迴圈及命令列介面啟動數據。
- Docker 即時模型全面測試：`pnpm test:docker:live-models`
  - 每個選取的模型都會執行一個文字回合及一個小型類檔案讀取探查。中繼資料宣告支援 `image` 輸入的模型，也會執行一個小型圖片回合。隔離供應商失敗時，可設定 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探查。
  - CI 覆蓋範圍：每日的 `OpenClaw Scheduled Live And E2E Checks` 與手動的
    `OpenClaw Release Checks` 都會呼叫可重複使用的即時／端對端工作流程，並設定
    `include_live_suites: true`；其中包含依供應商分片的 Docker 即時模型矩陣工作。
  - 若要針對性重新執行 CI，請分派 `OpenClaw Live And E2E Checks (Reusable)`，並設定 `include_live_suites: true` 及 `live_models_only: true`。
  - 請將新的高訊號供應商密鑰加入 `scripts/ci-hydrate-live-auth.sh`、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`，以及其排程／發行呼叫端。
- 原生 Codex 綁定聊天冒煙測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex 應用程式伺服器路徑執行 Docker 即時通道，使用 `/codex bind` 綁定一則合成 Slack 私訊，操作 `/codex fast` 與
    `/codex permissions`，接著驗證純文字回覆及圖片附件會經由原生外掛綁定路由，而非 ACP。
- Codex 應用程式伺服器測試框架冒煙測試：`pnpm test:docker:live-codex-harness`
  - 透過外掛擁有的 Codex 應用程式伺服器測試框架執行閘道代理程式回合，驗證 `/codex status` 與 `/codex models`，並預設操作圖片、排程 MCP、子代理程式及 Guardian 探查。隔離其他失敗時，可設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用子代理程式探查。若要針對性檢查子代理程式，請停用其他探查：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則此命令會在子代理程式探查後結束。
- Codex 隨選安裝冒煙測試：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安裝已封裝的 OpenClaw tarball，執行 OpenAI API 金鑰初始設定，並驗證 Codex 外掛及 `@openai/codex` 相依套件已隨選下載至受管理的 npm 專案根目錄。
- 即時外掛工具相依套件冒煙測試：`pnpm test:docker:live-plugin-tool`
  - 封裝一個具有真實 `slugify` 相依套件的固定裝置外掛，透過 `npm-pack:` 安裝它，驗證受管理 npm 專案根目錄中的相依套件，接著要求即時 OpenAI 模型呼叫此外掛工具並傳回隱藏的 slug。
- Crestodian 救援命令冒煙測試：`pnpm test:live:crestodian-rescue-channel`
  - 訊息頻道救援命令介面的選用雙重保險檢查。操作 `/crestodian status`、將持久性模型變更加入佇列、回覆 `/crestodian yes`，並驗證稽核／設定寫入路徑。
- Crestodian 首次執行 Docker 冒煙測試：`pnpm test:docker:crestodian-first-run`
  - 從空白的 OpenClaw 狀態目錄開始，並先證明已封裝的
    `openclaw crestodian` 命令列介面會在無推論功能時採取封閉式失敗。接著透過已封裝的啟用模組測試並啟用假的 Claude。只有在此之後，模糊的已封裝命令列介面要求才會到達規劃器並解析為型別化設定，接著執行一次性的模型、代理程式、Discord 外掛及 SecretRef 操作。它會驗證設定及稽核項目。這是輔助性的閘門／操作證據，並非互動式初始設定或 Crestodian 代理程式／工具／核准證明。QA Lab 中也可透過
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 使用相同通道。
- Moonshot／Kimi 成本冒煙測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對 `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且助理逐字稿儲存標準化的 `usage.cost`。

<Tip>
如果只需要處理一個失敗案例，請優先使用下方所述的允許清單環境變數來縮小即時測試範圍。
</Tip>

## QA 專用執行器

需要 QA Lab 的真實度時，可搭配主要測試套件使用這些命令。

CI 會在專用工作流程中執行 QA Lab。代理式同等性測試內嵌於
`QA-Lab - All Lanes` 與發行驗證中，而非獨立的 PR 工作流程。
廣泛驗證應使用 `Full Release Validation`，並設定
`rerun_group=qa-parity`，或使用發行檢查的 QA 群組。穩定版／預設發行檢查會將完整的即時／Docker 浸泡測試置於 `run_release_soak=true` 之後；`full` 設定檔會強制啟用浸泡測試。`QA-Lab - All Lanes` 會在 `main` 上每晚執行，也可透過手動分派執行，並以平行工作方式執行模擬同等性通道、即時 Matrix 通道、由 Convex 管理的即時 Telegram 通道，以及由 Convex 管理的即時 Discord 通道。排程 QA 與發行檢查會明確傳入 Matrix `--profile fast`，而 Matrix 命令列介面及手動工作流程輸入仍預設為 `all`；手動分派可將 `all` 分片為 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 及 `e2ee-cli` 工作。`OpenClaw Release Checks` 會在核准發行前執行同等性測試、快速 Matrix 通道及 Telegram 通道，並為發行傳輸檢查使用
`mock-openai/gpt-5.6-luna`，以維持確定性並避免一般供應商外掛啟動。這些即時傳輸閘道會停用記憶體搜尋；記憶體行為仍由 QA 同等性測試套件涵蓋。

完整發行的即時媒體分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 與 `ffprobe`。Docker 即時模型／後端分片使用針對每個選取提交建置一次的共用
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔，接著設定 `OPENCLAW_SKIP_DOCKER_BUILD=1` 來提取該映像檔，而非在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由儲存庫支援的 QA 情境。
  - 針對所選情境集寫入頂層的 `qa-evidence.json`、`qa-suite-summary.json` 和
    `qa-suite-report.md` 成品，其中包括混合流程、Vitest 和 Playwright
    情境選項。
  - 由 `pnpm openclaw qa run --qa-profile <profile>` 分派時，會將所選分類設定檔的
    評分卡嵌入同一個 `qa-evidence.json`。`smoke-ci` 會寫入精簡證據
    （`evidenceMode: "slim"`，每個項目不含 `execution`）。`release`
    涵蓋精選的發布就緒範圍；需要完整評分卡成品時，`all` 會選取每個有效的
    成熟度類別，並以明確的 QA 設定檔證據工作流程分派為目標。
  - 預設會以隔離的閘道工作程序平行執行多個所選情境。`qa-channel`
    預設並行數為 4（上限為所選情境數）。使用 `--concurrency <count>`
    調整工作程序數量，或使用 `--concurrency 1` 執行舊版循序管線。
  - 任何情境失敗時會以非零狀態結束。若要產生成品而不使用失敗結束碼，
    請使用 `--allow-failures`。
  - 支援 `live-frontier`、`mock-openai` 和 `aimock` 提供者模式。
    `aimock` 會啟動本機由 AIMock 支援的提供者伺服器，在不取代可感知情境的
    `mock-openai` 管線下，提供實驗性固定資料與通訊協定模擬涵蓋範圍。
- `pnpm openclaw qa coverage --match <query>`
  - 搜尋情境 ID、標題、介面、涵蓋範圍 ID、文件參照、程式碼參照、外掛與
    提供者需求，然後輸出相符的套件目標。
  - 若知道所變更的行為或檔案路徑，但不知道最小情境，請在執行 QA Lab
    前使用此命令。這僅供參考——仍需依據所變更的行為選擇模擬、即時、
    Multipass、Matrix 或傳輸證明。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink 外掛全方位測試。
    安裝外部 Kitchen Sink 套件、驗證外掛 SDK 介面清單、探查 `/healthz`
    與 `/readyz`、記錄閘道 CPU/RSS 證據、執行一次即時 OpenAI 回合，
    並檢查對抗性診斷。需要即時 OpenAI 驗證資訊，例如 `OPENAI_API_KEY`。
    在已植入設定的 Testbox 工作階段中，若存在 `openclaw-testbox-env`
    輔助程式，便會自動載入 Testbox 即時驗證設定檔。
- `pnpm test:gateway:cpu-scenarios`
  - 執行閘道啟動基準測試及一小組模擬 QA Lab 情境
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/`
    下寫入合併的 CPU 觀察摘要。
  - 預設僅標記持續的 CPU 高負載觀察（`--cpu-core-warn`，預設 `0.9`；
    `--hot-wall-warn-ms`，預設 `30000`），因此短暫的啟動突增會記錄為指標，
    而不會看似持續數分鐘的閘道滿載迴歸問題。
  - 使用建置完成的 `dist` 成品執行；若簽出內容尚無最新的執行階段輸出，
    請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在可拋棄的 Multipass Linux 虛擬機器內執行相同的 QA 套件，並保留與
    `qa suite` 相同的情境選擇及提供者／模型旗標。
  - 即時執行會轉送適用於客體的 QA 驗證輸入：以環境變數提供的提供者金鑰、
    QA 即時提供者設定路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須位於儲存庫根目錄下，讓客體能透過掛載的工作區寫回。
  - 寫入一般 QA 報告與摘要，並將 Multipass 記錄寫入
    `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 啟動由 Docker 支援的 QA 網站，供操作人員進行 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前簽出內容建置 npm tarball，在 Docker 中全域安裝、執行非互動式
    OpenAI API 金鑰初始設定、預設設定 Telegram、驗證封裝的外掛執行階段
    可載入而無須在啟動時修復相依性、執行 doctor，並對模擬的 OpenAI
    端點執行一次本機代理程式回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`，以 Discord 執行相同的
    封裝安裝管線。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式執行階段上下文逐字記錄，執行確定性的已建置應用程式 Docker
    煙霧測試。驗證隱藏的 OpenClaw 執行階段上下文會以不顯示的自訂訊息持續
    存在，而不會洩漏至使用者可見回合；接著植入受影響且損壞的工作階段
    JSONL，並驗證 `openclaw doctor --fix` 會將其重寫至有效分支且建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 套件候選版本、執行已安裝套件的初始設定、
    透過已安裝的命令列介面設定 Telegram，然後重複使用即時 Telegram QA
    管線，並將該已安裝套件作為受測系統的閘道。
  - 包裝程式只會從簽出內容掛載 `qa-lab` 測試框架原始碼；已安裝套件自行
    管理 `dist`、`openclaw/plugin-sdk` 和內建外掛執行階段，因此此管線不會
    將目前簽出內容的外掛混入受測套件。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz`
    或 `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，
    而非從登錄檔安裝。
  - 預設使用 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`，在
    `qa-evidence.json` 中產生重複的 RTT 計時。覆寫
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 以調整執行。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` 接受以逗號分隔的 Telegram QA
    檢查 ID 清單以供取樣；未設定時，預設支援 RTT 的檢查為
    `telegram-mentioned-message-reply`。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram 環境變數憑證或
    Convex 憑證來源。若用於 CI／發布自動化，請設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密鑰。若 CI 中存在
    `OPENCLAW_QA_CONVEX_SITE_URL` 與 Convex 角色密鑰，Docker 包裝程式
    會自動選擇 Convex。
  - 包裝程式會在進行 Docker 建置／安裝工作之前，先於主機驗證 Telegram
    或 Convex 憑證環境變數。只有在刻意偵錯取得憑證前的設定時，才設定
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 僅針對此管線
    覆寫共用的 `OPENCLAW_QA_CREDENTIAL_ROLE`。選擇 Convex 憑證且未設定
    角色時，包裝程式在 CI 中使用 `ci`，在 CI 外使用 `maintainer`。
  - GitHub Actions 將此管線公開為手動維護者工作流程
    `NPM Telegram Beta E2E`。它不會在合併時執行。此工作流程使用
    `qa-live-shared` 環境和 Convex CI 憑證租用。
- GitHub Actions 也提供 `Package Acceptance`，用於針對單一候選套件進行
  額外執行的產品證明。它接受 Git 參照、已發布的 npm 規格、HTTPS tarball
  URL 加 SHA-256、受信任 URL 政策，或來自另一次執行的 tarball 成品
  （`source=ref|npm|url|trusted-url|artifact`）；會將標準化的
  `openclaw-current.tgz` 以 `package-under-test` 名稱上傳，然後以
  `smoke`、`package`、`product`、`full` 或 `custom` 管線設定檔執行現有的
  Docker E2E 排程器。設定 `telegram_mode=mock-openai` 或
  `live-frontier`，即可讓 Telegram QA 工作流程針對同一個
  `package-under-test` 成品執行。
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

- 企業／私人 tarball 鏡像使用明確的受信任來源政策：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` 會從受信任的工作流程參照讀取
`.github/package-trusted-sources.json`，且不接受 URL 憑證或透過工作流程輸入
繞過私人網路限制。若指定的政策宣告使用持有者驗證，請設定固定的
`OPENCLAW_TRUSTED_PACKAGE_TOKEN` 密鑰。

- 成品證明會從另一次 Actions 執行下載 tarball 成品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw 建置版本，以已設定 OpenAI 的
    狀態啟動閘道，然後透過編輯設定啟用內建頻道／外掛。
  - 驗證設定探索會讓未設定且可下載的外掛保持不存在；第一次已設定的 doctor
    修復會明確安裝每個缺少的可下載外掛，第二次重新啟動則不會執行隱藏的
    相依性修復。
  - 也會安裝已知的舊版 npm 基準版本，在執行
    `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的
    更新後 doctor 能清理舊版外掛相依性殘留，而不需要測試框架端的
    安裝後修復。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 客體間執行原生封裝安裝的更新煙霧測試。每個所選平台會先
    安裝要求的基準套件，接著在同一客體中執行已安裝的
    `openclaw update` 命令，並驗證已安裝版本、更新狀態、閘道就緒狀態，
    以及一次本機代理程式回合。
  - 反覆測試單一客體時，使用 `--platform macos`、`--platform windows`
    或 `--platform linux`。使用 `--json` 取得摘要成品路徑和各管線狀態。
  - OpenAI 管線預設使用 `openai/gpt-5.6-luna` 進行即時代理程式回合證明。
    傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL`，即可驗證其他 OpenAI 模型。
  - 使用主機逾時包裝長時間的本機執行，避免 Parallels 傳輸停滯耗盡剩餘的
    測試時段：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 此指令碼會將巢狀管線記錄寫入
    `/tmp/openclaw-parallels-npm-update.*`。在認定外層包裝程式停滯前，
    請檢查 `windows-update.log`、`macos-update.log` 或
    `linux-update.log`。
  - 在冷啟動客體上，Windows 更新可能會在更新後 doctor 和套件更新工作中
    花費 10 至 15 分鐘；只要巢狀 npm 偵錯記錄仍持續更新，便屬正常狀態。
  - 請勿讓此彙總包裝程式與個別的 Parallels macOS、Windows 或 Linux
    煙霧測試管線平行執行。它們共用虛擬機器狀態，可能在快照還原、
    套件供應或客體閘道狀態上發生衝突。
  - 更新後證明會執行一般內建外掛介面，因為語音、影像生成和媒體理解等
    能力門面會透過內建執行階段 API 載入，即使代理程式回合本身只檢查
    簡單的文字回應。

- `pnpm openclaw qa aimock`
  - 僅啟動本機 AIMock 提供者伺服器，以直接進行通訊協定冒煙測試。
- `pnpm openclaw qa matrix`
  - 對由 Docker 支援、可拋棄的 Tuwunel 主伺服器執行 Matrix 即時 QA 流程。僅限原始碼簽出環境——封裝安裝不包含 `qa-lab`。
  - 完整的命令列介面、設定檔／情境目錄、環境變數與成品配置：
    [Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自環境變數的驅動程式與受測系統機器人權杖，對真實私人群組執行 Telegram 即時 QA 流程。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 與
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群組 ID 必須是數字格式的
    Telegram 聊天 ID。
  - 支援使用 `--credential-source convex` 取得共用集區憑證。
    預設使用環境變數模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    以選用集區租約。
  - 預設涵蓋金絲雀測試、提及閘控、命令定址、`/status`、
    機器人對機器人的被提及回覆，以及核心原生命令回覆。
    `mock-openai` 的預設情境也涵蓋確定性的回覆鏈與
    Telegram 最終訊息串流迴歸。使用 `--list-scenarios`
    查看 `session_status` 等選用探測情境。
  - 任一情境失敗時，會以非零狀態碼結束。若要在保留成品的同時不產生失敗結束碼，
    請使用 `--allow-failures`。
  - 需要同一私人群組中的兩個不同機器人，且受測系統機器人必須公開
    Telegram 使用者名稱。
  - 為了穩定觀察機器人對機器人的互動，請在 `@BotFather` 中為兩個機器人啟用 Bot-to-Bot Communication Mode，
    並確保驅動機器人能觀察群組內的機器人流量。
  - 在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要與
    `qa-evidence.json`。包含回覆的情境會記錄從驅動程式傳送請求到觀察到受測系統回覆的 RTT。

`Mantis Telegram Live` 是此流程的 PR 證據包裝器。它會使用由 Convex 租用的
Telegram 憑證執行候選參照，在 Crabbox 桌面瀏覽器中呈現經遮蔽處理的
QA 報告／證據套件、錄製 MP4 證據、產生經動態裁剪的 GIF、上傳成品套件，並在設定
`pr_number` 時透過 Mantis GitHub App 發布行內 PR 證據。維護者可以從 Actions UI
透過 `Mantis Scenario`（`scenario_id: telegram-live`）啟動，或直接透過提取要求留言啟動：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用於 PR 視覺證據、具代理能力的原生 Telegram Desktop
變更前／後包裝器。可從 Actions UI 使用自由格式的 `instructions`、透過
`Mantis Scenario`（`scenario_id: telegram-desktop-proof`）啟動，或透過 PR 留言啟動：

```text
@openclaw-mantis telegram desktop proof
```

Mantis 代理會讀取 PR、判斷哪些 Telegram 可見行為能證明該變更、在基準與候選參照上執行
真實使用者的 Crabbox Telegram Desktop 證明流程、反覆調整直到原生 GIF 具備實用性、
寫入成對的 `motionPreview` 資訊清單，並在設定 `pr_number` 時透過 Mantis GitHub App
發布相同的雙欄 GIF 表格。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重複使用 Crabbox Linux 桌面、安裝原生 Telegram
    Desktop、使用租用的 Telegram 受測系統機器人權杖設定 OpenClaw、
    啟動閘道，並從可見的 VNC 桌面錄製螢幕截圖／MP4 證據。
  - 預設使用 `--credential-source convex`，因此工作流程只需要
    Convex 代理服務密鑰。若使用 `--credential-source env`，請提供與
    `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 變數。
  - Telegram Desktop 仍需要使用者登入／設定檔。機器人權杖
    僅用於設定 OpenClaw。請使用 `--telegram-profile-archive-env <name>`
    提供 base64 編碼的 `.tgz` 設定檔封存檔，或使用 `--keep-lease` 並透過
    VNC 手動登入一次。
  - 在輸出目錄下寫入 `mantis-telegram-desktop-builder-report.md`、
    `mantis-telegram-desktop-builder-summary.json`、
    `telegram-desktop-builder.png` 與 `telegram-desktop-builder.mp4`。

即時傳輸流程共用一份標準契約，避免新增傳輸方式時產生偏差；各流程的涵蓋矩陣位於
[QA 概覽——即時傳輸涵蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。
`qa-channel` 是廣泛的合成測試套件，不屬於該矩陣。

### 透過 Convex 共用 Telegram 憑證（v1）

為即時傳輸 QA 啟用 `--credential-source convex`（或
`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA 實驗室會從由 Convex 支援的集區取得
獨佔租約、在流程執行期間對該租約傳送心跳偵測，並於關閉時釋放租約。此節名稱早於
Discord、Slack 與 WhatsApp 支援；各類型共用相同的租約契約。

Convex 專案參考骨架：`qa/convex-credential-broker/`

必要環境變數：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色的一個密鑰：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`，用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI`，用於 `ci`
- 憑證角色選擇：
  - 命令列介面：`--credential-role maintainer|ci`
  - 環境變數預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，其他情況預設為 `maintainer`）

選用環境變數：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設為 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設為 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設為 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設為 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設為 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用的追蹤 ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許僅供本機開發使用的 local loopback `http://` Convex URL。

正常運作時，`OPENCLAW_QA_CONVEX_SITE_URL` 應使用 `https://`。

維護者管理命令（集區新增／移除／列出）明確要求
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供維護者使用的命令列介面輔助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor`，以檢查 Convex 網站 URL、代理服務密鑰、
端點前綴、HTTP 逾時，以及管理／清單的可連線性，且不會輸出密鑰值。
在指令碼與 CI 公用程式中使用 `--json` 取得機器可讀輸出。

預設端點契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）。
請求透過 `Authorization: Bearer <role secret>` 標頭進行驗證；
以下主體省略該標頭：

- `POST /acquire`
  - 請求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 已耗盡／可重試：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - 請求：`{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 成功：`{ status: "ok", index, data }`
- `POST /heartbeat`
  - 請求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空白的 `2xx`）
- `POST /release`
  - 請求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空白的 `2xx`）
- `POST /admin/add`（僅限維護者密鑰）
  - 請求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（僅限維護者密鑰）
  - 請求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 使用中租約防護：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅限維護者密鑰）
  - 請求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 類型的承載內容格式：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字格式的 Telegram 聊天 ID 字串。
- `admin/add` 會驗證 `kind: "telegram"` 的此格式，並拒絕格式錯誤的承載內容。

Telegram 真實使用者類型的承載內容格式：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 與 `telegramApiId` 必須是數字字串。
- `tdlibArchiveSha256` 與 `desktopTdataArchiveSha256` 必須是 SHA-256 十六進位字串。
- `kind: "telegram-user"` 保留給 Mantis Telegram Desktop 證明工作流程使用。一般 QA 實驗室流程不得取得此類型。

由代理服務驗證的多頻道承載內容：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 流程也能從集區租用憑證，但 Slack 承載內容驗證目前位於
Slack QA 執行器，而非代理服務。Slack 資料列請使用
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 將頻道新增至 QA

新頻道轉接器的架構與情境輔助函式名稱位於
[QA 概覽——新增頻道](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。
最低要求：在共用 `qa-lab` 主機接合面實作傳輸執行器、為共用情境新增
`adapterFactory`、在外掛資訊清單中宣告 `qaRunners`、掛載為
`openclaw qa <runner>`，並在 `qa/scenarios/` 下編寫情境。

## 測試套件（各自在哪裡執行）

可將這些套件視為「逐步提高真實程度」（同時也提高不穩定性／成本）。

### 單元／整合（預設）

- 命令：`pnpm test`
- 設定：未指定目標的執行會使用 `vitest.full-*.config.ts` 分片集合，並可能將
  多專案分片展開為各專案設定，以便平行排程
- 檔案：`src/**/*.test.ts`、`packages/**/*.test.ts` 與
  `test/**/*.test.ts` 下的核心／單元清單；UI 單元測試在專用的
  `unit-ui` 分片中執行
- 範圍：
  - 純單元測試
  - 程序內整合測試（閘道驗證、路由、工具、剖析、設定）
  - 已知錯誤的確定性迴歸測試
- 預期：
  - 在 CI 中執行
  - 不需要真實金鑰
  - 應快速且穩定
  - 解析器與公開介面載入器測試必須使用產生的小型外掛測試固定資料，
    證明廣泛的 `api.js` 與 `runtime-api.js` 後援行為，而非使用真實的
    內建外掛原始碼 API。真實外掛 API 載入應放在由外掛擁有的契約／整合套件中。

原生相依項目政策：

- 預設測試安裝會略過選用的原生 Discord opus 建置。Discord
  語音使用內建的 `libopus-wasm`，且 `@discordjs/opus` 在
  `allowBuilds` 中維持停用，因此本機測試與 Testbox 流程不會編譯原生
  附加元件。
- 請在 `libopus-wasm` 基準測試儲存庫中比較原生 opus 效能，而非在
  OpenClaw 的預設安裝／測試迴圈中進行。請勿在預設 `allowBuilds` 中將
  `@discordjs/opus` 設為 `true`；這會讓不相關的安裝／測試迴圈編譯原生程式碼。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - 未指定目標的 `pnpm test` 會執行十三個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-tooling`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而非單一龐大的原生根專案程序。這可降低高負載機器上的 RSS 峰值，並避免自動回覆／外掛工作導致不相關的測試套件資源不足。
    - `pnpm test --watch` 仍使用原生根目錄 `vitest.config.ts` 專案圖，因為多分片監看迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過限定範圍的執行通道處理明確的檔案／目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承擔完整根專案的啟動成本。
    - `pnpm test:changed` 預設會將變更的 git 路徑展開至成本較低的限定範圍執行通道：直接變更的測試、同層的 `*.test.ts` 檔案、明確的原始碼對應，以及本機匯入圖中的相依項目。設定／初始化／套件變更不會廣泛執行測試，除非明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的常規智慧型本機檢查關卡。它會將差異分類為核心、核心測試、擴充功能、擴充功能測試、應用程式、文件、發行中繼資料、即時 Docker 工具和工具，然後執行相符的型別檢查、程式碼檢查及防護命令。它不會執行 Vitest 測試；若需測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅含發行中繼資料版本遞增的變更會執行針對性的版本／設定／根相依套件檢查，並透過防護機制拒絕頂層版本欄位以外的套件變更。
    - 即時 Docker ACP 測試工具的編輯會執行重點檢查：即時 Docker 驗證指令碼的 shell 語法，以及即時 Docker 排程器的試執行。只有在差異僅限於 `scripts["test:docker:live-*"]` 時，才會納入 `package.json` 變更；相依套件、匯出、版本及其他套件介面的編輯仍會使用較廣泛的防護機制。
    - 來自代理程式、命令、外掛、自動回覆輔助程式、`plugin-sdk` 及類似純工具區域的低匯入量單元測試，會透過 `unit-fast` 執行通道執行，並略過 `test/setup-openclaw-runtime.ts`；具狀態／執行階段負載較高的檔案則保留在現有執行通道。
    - 部分選定的 `plugin-sdk` 和 `commands` 輔助原始碼檔案，也會將變更模式的執行對應至這些輕量執行通道中的明確同層測試，因此輔助程式的編輯不必重新執行該目錄完整且繁重的測試套件。
    - `auto-reply` 為頂層核心輔助程式、頂層 `reply.*` 整合測試及 `src/auto-reply/reply/**` 子樹提供專用分組。CI 會進一步將回覆子樹拆分為代理程式執行器、分派及命令／狀態路由分片，避免單一匯入負載較高的分組佔據完整的 Node 尾端執行時間。
    - 一般 PR／主分支 CI 會刻意略過內建外掛批次掃描及僅供發行使用的 `agentic-plugins` 分片。完整發行驗證會針對發行候選版本分派獨立的 `Plugin Prerelease` 子工作流程，以執行這些外掛負載較高的測試套件。

  </Accordion>

  <Accordion title="內嵌執行器涵蓋範圍">

    - 變更訊息工具探索輸入或壓縮執行階段
      情境時，請保留兩個層級的涵蓋範圍。
    - 為純路由和正規化
      邊界新增重點式輔助程式迴歸測試。
    - 維持內嵌執行器整合測試套件正常運作：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` 和
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - 這些測試套件會驗證限定範圍的識別碼和壓縮行為仍會
      流經實際的 `run.ts`／`compact.ts` 路徑；僅有輔助程式測試
      不足以取代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest 集區與隔離預設值">

    - 基礎 Vitest 設定預設使用 `threads`。
    - 共用 Vitest 設定會固定使用 `isolate: false`，並在根專案、端對端測試及即時設定中
      使用非隔離執行器。
    - 根目錄 UI 執行通道會保留其 `jsdom` 初始化與最佳化工具，但也會在
      共用的非隔離執行器上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest 設定繼承相同的
      `threads` + `isolate: false` 預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 的 Node 子程序
      加入 `--no-maglev`，以減少大型本機執行期間的 V8 編譯負擔。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與標準 V8
      行為比較。
    - `scripts/run-vitest.mjs` 會在明確的非監看 Vitest 執行
      連續 5 分鐘沒有任何標準輸出或標準錯誤輸出後終止程序。若要針對
      刻意保持靜默的調查停用監控程式，請設定
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`。

  </Accordion>

  <Accordion title="快速本機反覆開發">

    - `pnpm changed:lanes` 會顯示差異會觸發哪些架構執行通道。
    - 提交前掛鉤僅處理格式化。它會重新暫存已格式化的檔案，
      且不會執行程式碼檢查、型別檢查或測試。
    - 當需要智慧型本機檢查關卡時，請在交付或推送前明確執行
      `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過成本較低的限定範圍執行通道進行路由。僅當代理程式
      判定測試工具、設定、套件或合約編輯確實需要
      更廣泛的 Vitest 涵蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行為，只是工作程序上限較高。
    - 本機工作程序自動調整刻意採取保守策略，且當主機平均負載已偏高時
      會降低並行度，因此預設情況下，多個同時執行的
      Vitest 程序造成的影響較小。
    - 基礎 Vitest 設定會將專案／設定檔標記為
      `forceRerunTriggers`，確保測試接線變更時，變更模式的重新執行仍然正確。
    - 此設定會在支援的主機上保持啟用
      `OPENCLAW_VITEST_FS_MODULE_CACHE`；若要指定一個明確的快取位置以直接進行效能分析，
      請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能除錯">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入耗時報告及
      匯入細項輸出。
    - `pnpm test:perf:imports:changed` 會將相同的效能分析檢視範圍限定為
      自 `origin/main` 起變更的檔案。
    - 分片計時資料會寫入 `.artifacts/vitest-shard-timings.json`。
      完整設定執行會使用設定路徑作為鍵；包含模式的 CI
      分片會附加分片名稱，以便分別追蹤
      已篩選的分片。
    - 當某個高負載測試仍將大部分時間耗費在啟動匯入時，
      請將繁重的相依套件置於窄範圍的本機 `*.runtime.ts` 介面後方，並
      直接模擬該介面，而不是僅為了透過 `vi.mock(...)` 傳遞執行階段輔助程式
      而進行深層匯入。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對該
      已提交差異，比較經路由的 `test:changed` 與原生根專案路徑，
      並輸出實際經過時間及 macOS RSS 最大值。
    - `pnpm test:perf:changed:bench -- --worktree` 會將變更檔案清單透過
      `scripts/test-projects.mjs` 和根 Vitest 設定進行路由，
      對目前有未提交變更的工作樹進行效能基準測試。
    - `pnpm test:perf:profile:main` 會寫入 Vitest／Vite 啟動和轉換負擔的
      主執行緒 CPU 效能分析資料。
    - `pnpm test:perf:profile:runner` 會在停用檔案並行處理的情況下，
      寫入單元測試套件的執行器 CPU＋堆積效能分析資料。

  </Accordion>
</AccordionGroup>

### 穩定性（閘道）

- 命令：`pnpm test:stability:gateway`
- 設定：`test/vitest/vitest.gateway.config.ts`、`test/vitest/vitest.logging.config.ts` 和 `test/vitest/vitest.infra.config.ts`，各自強制使用一個工作程序
- 範圍：
  - 啟動真正的 local loopback 閘道，預設啟用診斷功能
  - 透過診斷事件路徑驅動合成的閘道訊息、記憶體及大型承載資料的反覆變動
  - 透過閘道 WS RPC 查詢 `diagnostics.stability`
  - 涵蓋診斷穩定性套件的持久化輔助程式
  - 斷言記錄器維持在界限內、合成 RSS 樣本保持低於壓力預算，且每個工作階段的佇列深度會排空並回到零
- 預期：
  - 可安全用於 CI，且不需金鑰
  - 用於追蹤穩定性迴歸問題的窄範圍執行通道，不能取代完整的閘道測試套件

### 端對端測試（儲存庫彙總）

- 命令：`pnpm test:e2e`
- 範圍：
  - 執行閘道煙霧端對端測試通道
  - 執行模擬的 Control UI 瀏覽器端對端測試通道
- 預期：
  - 可安全用於 CI，且不需金鑰
  - 需要安裝 Playwright Chromium

### 端對端測試（閘道煙霧測試）

- 命令：`pnpm test:e2e:gateway`
- 設定：`test/vitest/vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的內建外掛端對端測試
- 執行階段預設值：
  - 使用 Vitest `threads` 且設為 `isolate: false`，與儲存庫其餘部分一致。
  - 使用自適應工作程序（CI：最多 2 個；本機：預設 1 個）。
  - 預設以靜默模式執行，以降低主控台 I/O 負擔。
- 實用覆寫項目：
  - 使用 `OPENCLAW_E2E_WORKERS=<n>` 強制指定工作程序數量（上限為 16）。
  - 使用 `OPENCLAW_E2E_VERBOSE=1` 重新啟用詳細主控台輸出。
- 範圍：
  - 多執行個體閘道的端對端行為
  - WebSocket／HTTP 介面、節點配對，以及負載較高的網路作業
- 預期：
  - 在 CI 中執行（於管線中啟用時）
  - 不需要真實金鑰
  - 相較於單元測試涉及更多元件（可能較慢）

### 端對端測試（Control UI 模擬瀏覽器）

- 命令：`pnpm test:ui:e2e`
- 設定：`test/vitest/vitest.ui-e2e.config.ts`
- 檔案：`ui/src/**/*.e2e.test.ts`
- 範圍：
  - 啟動 Vite Control UI
  - 透過 Playwright 操作真實的 Chromium 頁面
  - 以確定性的瀏覽器內模擬物件取代閘道 WebSocket
- 預期：
  - 在 CI 中作為 `pnpm test:e2e` 的一部分執行
  - 不需要真實閘道、代理程式或供應商金鑰
  - 必須具備瀏覽器相依套件（`pnpm --dir ui exec playwright install chromium`）

### 端對端測試：OpenShell 後端煙霧測試

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 重複使用作用中的本機 OpenShell 閘道
  - 從暫時性的本機 Dockerfile 建立沙箱
  - 透過真實的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell 後端
  - 透過沙箱檔案系統橋接驗證以遠端為準的檔案系統行為
- 預期：
  - 僅供選擇性啟用；不屬於預設的 `pnpm test:e2e` 執行
  - 需要本機 `openshell` 命令列介面及可正常運作的 Docker 常駐程式
  - 需要作用中的本機 OpenShell 閘道及其設定來源
  - 使用隔離的 `HOME`／`XDG_CONFIG_HOME`，然後銷毀測試沙箱
- 實用覆寫項目：
  - 手動執行較廣泛的端對端測試套件時，使用 `OPENCLAW_E2E_OPENSHELL=1` 啟用此測試
  - 使用 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非預設的命令列介面二進位檔或包裝指令碼
  - 使用 `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`，向隔離測試提供已註冊的閘道設定
  - 使用 `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` 覆寫主機原則固定資料所使用的 Docker 閘道 IP

### 即時測試（真實供應商＋真實模型）

- 命令：`pnpm test:live`
- 設定：`test/vitest/vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的內建外掛即時測試
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「此供應商／模型使用真實憑證，在_今天_是否確實可用？」
  - 捕捉供應商格式變更、工具呼叫的特殊行為、驗證問題及速率限制行為
- 預期事項：
  - 設計上不保證在 CI 中穩定（真實網路、真實供應商政策、配額、服務中斷）
  - 會產生費用／消耗速率限制額度
  - 建議執行縮小範圍的子集，而非「全部」
- 即時執行會使用已匯出的 API 金鑰及預先設定的驗證設定檔。
- 即時執行預設仍會隔離 `HOME`，並將設定／驗證資料複製到暫存測試家目錄，使單元測試夾具無法修改真實的 `~/.openclaw`。
- 僅當你刻意需要即時測試使用真實家目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 預設使用較安靜的模式：保留 `[live] ...` 進度輸出，並將閘道啟動日誌／Bonjour 訊息靜音。若要恢復完整的啟動日誌，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依供應商而異）：以逗號／分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可透過 `OPENCLAW_LIVE_*_KEY` 針對即時執行覆寫；測試收到速率限制回應時會重試。
- 進度／心跳偵測輸出：
  - 即時測試套件會將進度行輸出至 stderr，因此即使 Vitest 主控台擷取處於安靜模式，耗時較長的供應商呼叫仍會顯示為執行中。
  - `test/vitest/vitest.live.config.ts` 會停用 Vitest 的主控台攔截，使供應商／閘道進度行能在即時執行期間立即串流輸出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整直接模型的心跳偵測。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整閘道／探測的心跳偵測。

## 我應該執行哪個測試套件？

使用此決策表：

- 編輯邏輯／測試：執行 `pnpm test`（若變更很多，也執行 `pnpm test:coverage`）
- 變更閘道網路／WS 協定／配對：另加執行 `pnpm test:e2e`
- 偵錯「我的機器人掛了」／特定供應商失敗／工具呼叫：執行縮小範圍的 `pnpm test:live`

## 即時（會連線至網路）測試

關於即時模型矩陣、命令列介面後端冒煙測試、ACP 冒煙測試、Codex app-server
測試框架，以及所有媒體供應商即時測試（Deepgram、BytePlus、ComfyUI、
影像、音樂、影片、媒體測試框架），以及即時執行的憑證處理：

- 請參閱[測試即時套件](/zh-TW/help/testing-live)。關於專用的更新與
  外掛驗證檢查清單，請參閱
  [測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

## Docker 執行器（選用的「可在 Linux 運作」檢查）

這些 Docker 執行器分為兩類：

- 即時模型執行器：`test:docker:live-models` 和 `test:docker:live-gateway` 僅在儲存庫 Docker 映像中執行各自對應的設定檔金鑰即時測試檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載本機設定目錄、工作區及選用的設定檔環境變數檔案。對應的本機進入點為 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時執行器會在需要時維持各自實用的上限：
  `test:docker:live-models` 預設使用經整理、受支援且訊號強的集合，而
  `test:docker:live-gateway` 預設設定 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在明確需要較小上限或較大掃描範圍時，才設定 `OPENCLAW_LIVE_MAX_MODELS`
  或閘道環境變數。
- `test:docker:all` 先透過 `test:docker:live-build` 建置一次即時 Docker 映像，再透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 封裝一次為 npm tarball，接著建置／重用兩個 `scripts/e2e/Dockerfile` 映像。基礎映像僅作為安裝／更新／外掛相依套件測試管道的 Node/Git 執行器；這些測試管道會掛載預先建置的 tarball。功能映像則將相同 tarball 安裝至 `/app`，供已建置應用程式的功能測試管道使用。Docker 測試管道定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行所選計畫。彙總執行使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序插槽，而資源上限可避免高負載即時、npm 安裝及多服務測試管道同時全部啟動。若單一測試管道的負載高於目前上限，排程器仍可在資源池為空時啟動它，之後讓它獨佔執行，直到資源再次可用。預設值為 10 個插槽、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`（及其他 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 覆寫值）。執行器預設會執行 Docker 預檢、移除過時的 OpenClaw E2E 容器、每 30 秒輸出狀態、將成功測試管道的耗時儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行時利用這些耗時資料優先啟動較長的測試管道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不建置或執行 Docker 的情況下輸出加權測試管道清單，或使用 `node scripts/test-docker-all.mjs --plan-json` 輸出所選測試管道、套件／映像需求及憑證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生的套件閘門，用來驗證「這個可安裝的 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url`、`source=trusted-url` 或 `source=artifact` 解析一個候選套件，將其上傳為 `package-under-test`，再針對該確切 tarball 執行可重用的 Docker E2E 測試管道，而非重新封裝所選參照。設定檔依涵蓋範圍排序為：`smoke`、`package`、`product` 和 `full`（另有用於明確測試管道清單的 `custom`）。關於套件／更新／外掛契約、已發布升級存續矩陣、發布預設值及失敗分流方式，請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。
- 建置與發布檢查會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。此防護會從 `dist/entry.js` 和 `dist/cli/run-main.js` 遍歷靜態建置圖，若命令分派前的啟動圖靜態匯入任何外部套件（Commander、提示使用者介面、undici、日誌記錄及類似會加重啟動負擔的相依套件都計入），便判定失敗；它也會將內建閘道執行區塊限制為 70 KB，並拒絕該區塊靜態匯入已知的冷路徑（`control-ui-assets`、`diagnostic-stability-bundle`、`onboard-helpers`、`process-respawn`、`restart-sentinel`、`server-close`、`server-reload-handlers`）。`scripts/release-check.ts` 另會使用 `--help`、`onboard --help`、`doctor --help`、`status --json --timeout 1`、`config schema` 和 `models list --provider openai` 對已封裝的命令列介面執行冒煙測試。
- Package Acceptance 的舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在此截止版本之前，測試框架只容許已發布套件的中繼資料缺口：省略私有 QA 清冊項目、缺少 `gateway install --wrapper`、由 tarball 衍生的 git 測試夾具中缺少修補檔案、缺少持久化的 `update.channel`、舊版外掛安裝記錄位置、缺少市集安裝記錄持久化，以及在 `plugins update` 期間遷移設定中繼資料。對於 `2026.4.25` 之後的套件，這些情況都會嚴格判定為失敗。
- 容器冒煙測試執行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 會啟動一個或多個真實容器，並驗證較高層級的整合路徑。
- 透過 `scripts/lib/openclaw-e2e-instance.sh` 安裝已封裝 OpenClaw tarball 的 Docker/Bash E2E 測試管道，會將 `npm install` 的執行時間限制為 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（預設 `600s`；設定為 `0` 可停用此包裝器以便偵錯）。

即時模型 Docker 執行器也只會繫結掛載所需的命令列介面驗證家目錄
（若執行範圍未縮小，則掛載所有支援的家目錄），接著在執行前將其複製到
容器家目錄，讓外部命令列介面 OAuth 能重新整理權杖，
且不會修改主機的驗證存放區：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 繫結冒煙測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並可透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid／OpenCode）
- 命令列介面後端冒煙測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 測試框架冒煙測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- 閘道 + 開發代理程式：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 和 `pnpm qa:observability:smoke` 是私有 QA 原始碼簽出測試管道。它們刻意不納入套件 Docker 發布測試管道，因為 npm tarball 省略 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- 新手設定精靈（TTY、完整架構建立）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手設定／頻道／代理程式冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball，預設透過環境變數參照的新手設定流程來設定 OpenAI 及 Telegram，接著執行 doctor，並執行一輪模擬的 OpenAI 代理程式。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可重用預先建置的 tarball；使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 可略過主機重新建置；或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換頻道。

- 發行版使用者流程煙霧測試：`pnpm test:docker:release-user-journey` 會在乾淨的 Docker 主目錄中全域安裝已封裝的 OpenClaw tarball、執行初始設定、設定模擬的 OpenAI 提供者、執行一次代理程式回合、安裝／解除安裝外部外掛、設定 ClickClack 以連線至本機測試固定項目、驗證傳出／傳入訊息、重新啟動閘道，並執行 doctor。
- 發行版型別化初始設定煙霧測試：`pnpm test:docker:release-typed-onboarding` 會安裝已封裝的 tarball、透過真實 TTY 操作 `openclaw onboard`、將 OpenAI 設定為環境變數參照提供者、驗證不會持久化原始金鑰，並執行一次模擬的代理程式回合。
- 發行版媒體／記憶煙霧測試：`pnpm test:docker:release-media-memory` 會安裝已封裝的 tarball，驗證對 PNG 附件的影像理解、與 OpenAI 相容的影像生成輸出、記憶搜尋回想，以及重新啟動閘道後仍可保留回想能力。
- 發行版升級使用者流程煙霧測試：`pnpm test:docker:release-upgrade-user-journey` 預設會安裝比候選 tarball 更舊且最新發佈的基準版本、在已發佈套件上設定提供者／外掛／ClickClack 狀態、升級至候選 tarball，然後重新執行核心代理程式／外掛／頻道流程。若不存在較舊的已發佈基準版本，則會重複使用候選版本。可使用 `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` 覆寫基準版本。
- 發行版外掛市集煙霧測試：`pnpm test:docker:release-plugin-marketplace` 會從本機測試固定項目市集安裝、更新已安裝的外掛、解除安裝該外掛，並驗證外掛命令列介面已消失，且安裝中繼資料已清除。
- Skill 安裝煙霧測試：`pnpm test:docker:skill-install` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball、在設定中停用已上傳封存檔的安裝、從搜尋結果解析目前線上 ClawHub skill 的 slug、使用 `openclaw skills install` 安裝，並驗證已安裝的 skill 以及 `.clawhub` 來源／鎖定中繼資料。
- 更新頻道切換煙霧測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball、從套件 `stable` 切換至 git `dev`、驗證持久化的頻道及外掛更新後作業，然後切換回套件 `stable` 並檢查更新狀態。
- 升級存續煙霧測試：`pnpm test:docker:upgrade-survivor` 會將已封裝的 OpenClaw tarball 安裝至髒污的舊使用者測試固定項目上，其中包含代理程式、頻道設定、外掛允許清單、過時的外掛相依性狀態，以及既有的工作區／工作階段檔案。它會在沒有即時提供者或頻道金鑰的情況下執行套件更新及非互動式 doctor，然後啟動 local loopback 閘道，並檢查設定／狀態是否保留，以及啟動／狀態時間預算。
- 已發佈版本升級存續煙霧測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`、植入貼近真實情況的既有使用者檔案、使用內建的命令配方設定該基準版本、驗證產生的設定、將該已發佈的安裝更新至候選 tarball、執行非互動式 doctor、寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 local loopback 閘道，並檢查已設定的意圖、狀態保留、啟動、`/healthz`、`/readyz` 及 RPC 狀態時間預算。可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準版本；可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 要求彙總排程器展開確切的本機基準版本，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`；也可使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開以問題為模型的測試固定項目，例如 `reported-issues`；其中已回報問題集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw 外掛安裝。套件驗收會將這些項目公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析如 `last-stable-4` 或 `all-since-2026.4.23` 等中繼基準版本權杖，而完整發行版驗證會將發行版浸泡測試套件閘門展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15`，並加入 `reported-issues`。
- 工作階段執行階段情境煙霧測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段情境逐字記錄的持久化，以及由 doctor 修復受影響的重複提示重寫分支。
- Bun 全域安裝煙霧測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會封裝目前的原始碼樹、在隔離的主目錄中使用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會傳回內建影像提供者，而不是停滯不動。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重複使用預先建置的 tarball、使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 略過主機建置，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝程式 Docker 煙霧測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、更新及直接 npm 容器之間共用同一個 npm 快取。更新煙霧測試預設會先以 npm `latest` 作為穩定基準版本，再升級至候選 tarball。可在本機使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用安裝煙霧測試工作流程的 `update_baseline_version` 輸入覆寫。非 root 安裝程式檢查會保留隔離的 npm 快取，避免 root 擁有的快取項目掩蓋使用者本機安裝行為。可設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`，以便在本機重新執行時重複使用 root／更新／直接 npm 快取。
- 安裝煙霧測試 CI 會使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 略過重複的直接 npm 全域更新；需要涵蓋直接 `npm install -g` 時，請在本機執行腳本且不要設定該環境變數。
- 代理程式刪除共用工作區命令列介面煙霧測試：`pnpm test:docker:agents-delete-shared-workspace`（腳本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置根目錄 Dockerfile 映像、在隔離的容器主目錄中植入兩個共用同一工作區的代理程式、執行 `agents delete --json`，並驗證有效的 JSON 以及保留工作區的行為。可使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重複使用安裝煙霧測試映像。
- 閘道網路與主機生命週期：`pnpm test:docker:gateway-network`（腳本：`scripts/e2e/gateway-network-docker.sh`）會保留雙容器 LAN WebSocket 驗證／健康狀態煙霧測試，然後使用 local loopback 管理 HTTP 證明準備隔離、保留控制權存取、恢復復原，以及在同一已準備容器中停止／啟動。重新啟動檢查必須在原始租約到期前完成，並驗證暫停狀態僅存在於處理程序本機，而持久化的閘道設定及容器身分仍會保留，最後輸出機器可讀的階段計時 JSON。
- 瀏覽器 CDP 快照煙霧測試：`pnpm test:docker:browser-cdp-snapshot`（腳本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置來源端對端測試映像及 Chromium 層、使用原始 CDP 啟動 Chromium、執行 `browser doctor --deep`，並驗證 CDP 角色快照涵蓋連結 URL、由游標提升的可點擊項目、iframe 參照及框架中繼資料。
- OpenAI Responses `web_search` 最小推理迴歸測試：`pnpm test:docker:openai-web-search-minimal`（腳本：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過閘道執行模擬的 OpenAI 伺服器、驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升至 `low`，然後強制提供者結構描述拒絕請求，並檢查原始詳細資料是否出現在閘道記錄中。
- MCP 頻道橋接（已植入資料的閘道 + stdio 橋接器 + 原始 Claude 通知框架煙霧測試）：`pnpm test:docker:mcp-channels`（腳本：`scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw 套件組 MCP 工具（真實 stdio MCP 伺服器 + 內嵌 OpenClaw 設定檔允許／拒絕煙霧測試）：`pnpm test:docker:agent-bundle-mcp-tools`（腳本：`scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- 排程／子代理程式 MCP 清理（真實閘道 + 在隔離排程及單次子代理程式執行後拆除 stdio MCP 子處理程序）：`pnpm test:docker:cron-mcp-cleanup`（腳本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 外掛（本機路徑、`file:`、具有提升相依性的 npm 登錄、格式錯誤的 npm 套件中繼資料、移動中的 git 參照、ClawHub 綜合測試套件、市集更新，以及 Claude 套件組啟用／檢查的安裝／更新煙霧測試）：`pnpm test:docker:plugins`（腳本：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可略過 ClawHub 區塊，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的綜合測試套件／執行階段配對。未設定 `OPENCLAW_CLAWHUB_URL`／`CLAWHUB_URL` 時，測試會使用封閉式本機 ClawHub 測試固定項目伺服器。
- 外掛更新未變更煙霧測試：`pnpm test:docker:plugin-update`（腳本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 外掛生命週期矩陣煙霧測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在空白容器中安裝已封裝的 OpenClaw tarball、安裝 npm 外掛、切換啟用／停用狀態、透過本機 npm 登錄升級及降級該外掛、刪除已安裝的程式碼，然後驗證即使程式碼缺失，解除安裝仍會移除過時狀態，並記錄每個生命週期階段的 RSS／CPU 指標。
- 設定重新載入中繼資料煙霧測試：`pnpm test:docker:config-reload`（腳本：`scripts/e2e/config-reload-source-docker.sh`）
- 外掛：`pnpm test:docker:plugins` 涵蓋本機路徑、`file:`、具有提升相依性的 npm 登錄、移動中的 git 參照、ClawHub 測試固定項目、市集更新，以及 Claude 套件組啟用／檢查的安裝／更新煙霧測試。`pnpm test:docker:plugin-update` 涵蓋已安裝外掛未變更時的更新行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋具有資源追蹤的 npm 外掛安裝、啟用、停用、升級、降級，以及程式碼缺失時的解除安裝。

若要手動預先建置並重複使用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定後，諸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 等測試套件專用映像覆寫仍具有優先權。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，若本機尚無該映像，腳本會將其拉取。QR 與安裝程式 Docker 測試會保留各自的 Dockerfile，因為它們驗證的是套件／安裝行為，而不是共用的已建置應用程式執行階段。

即時模型 Docker 執行器也會以唯讀方式繫結掛載目前的簽出內容，
並將其暫存至容器內的臨時工作目錄。這可讓
執行階段映像維持精簡，同時仍能針對完全相符的本機
來源／設定執行 Vitest。暫存步驟會略過大型僅限本機的快取及應用程式建置
輸出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及
應用程式本機的 `.build` 或 Gradle 輸出目錄，讓 Docker 即時執行不會
花費數分鐘複製機器特定的成品。它們也會設定
`OPENCLAW_SKIP_CHANNELS=1`，因此閘道即時探測不會在容器內啟動真實的
Telegram／Discord／其他頻道工作程式。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此需要從該 Docker 執行管道
縮小或排除閘道即時測試涵蓋範圍時，也請傳入
`OPENCLAW_LIVE_GATEWAY_*`。

`test:docker:openwebui` 是較高階的相容性冒煙測試：它會啟動已啟用 OpenAI 相容 HTTP 端點的 OpenClaw 閘道容器、啟動連線至該閘道且版本固定的 Open WebUI 容器、透過 Open WebUI 登入、驗證 `/api/models` 會公開 `openclaw/default`，接著透過 Open WebUI 的 `/api/chat/completions` 代理傳送真實的聊天請求。對於應在 Open WebUI 登入及模型探索後停止、不等待即時模型完成回應的發行路徑 CI 檢查，請設定 `OPENWEBUI_SMOKE_MODE=models`。第一次執行可能會明顯較慢，因為 Docker 可能需要拉取 Open WebUI 映像，且 Open WebUI 可能需要完成自身的冷啟動設定。此測試通道需要可用的即時模型金鑰，可透過程序環境、預先配置的驗證設定檔，或明確的 `OPENCLAW_PROFILE_FILE` 提供。成功執行時會輸出一小段 JSON 承載資料，例如 `{ "ok": true, "model": "openclaw/default", ... }`。

`test:docker:mcp-channels` 刻意設計為具確定性，不需要真實的 Telegram、Discord 或 iMessage 帳號。它會啟動一個已植入資料的閘道容器，再啟動第二個容器來衍生 `openclaw mcp serve`，接著透過真實的 stdio MCP 橋接器，驗證路由後的對話探索、逐字記錄讀取、附件中繼資料、即時事件佇列行為、對外傳送路由，以及 Claude 風格的頻道與權限通知。通知檢查會直接檢查原始 stdio MCP 框架，因此此冒煙測試驗證的是橋接器實際發出的內容，而不只是特定用戶端 SDK 碰巧公開的內容。

`test:docker:agent-bundle-mcp-tools` 具確定性，不需要即時模型金鑰。它會建置儲存庫 Docker 映像、在容器內啟動真實的 stdio MCP 探測伺服器、透過內嵌的 OpenClaw 套件組 MCP 執行階段具現化該伺服器、執行工具，接著驗證 `coding` 與 `messaging` 會保留 `bundle-mcp` 工具，而 `minimal` 與 `tools.deny: ["bundle-mcp"]` 會將其篩除。

`test:docker:cron-mcp-cleanup` 具確定性，不需要即時模型金鑰。它會啟動一個已植入資料且包含真實 stdio MCP 探測伺服器的閘道、執行一次隔離的排程回合與一次 `sessions_spawn` 單次子回合，接著驗證 MCP 子程序會在每次執行後結束。

手動 ACP 自然語言討論串冒煙測試（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 請保留此指令碼以供迴歸／偵錯工作流程使用。未來進行 ACP 討論串路由驗證時可能還會需要，因此請勿刪除。

實用的環境變數：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載至 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載至 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` 會在執行測試前掛載並載入
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` 載入的環境變數，並使用暫存設定／工作區目錄，且不掛載外部命令列介面驗證資料
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`，除非此次執行已使用 CI／受管理的繫結目錄）掛載至 `/home/node/.npm-global`，供 Docker 內快取命令列介面安裝項目
- `$HOME` 下的外部命令列介面驗證目錄／檔案會以唯讀方式掛載至 `/host-auth...`，接著在測試開始前複製到 `/home/node/...`
  - 預設目錄（此次執行未限定特定提供者時使用）：`.factory`、`.gemini`、`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 限定提供者的執行只會掛載根據 `OPENCLAW_LIVE_PROVIDERS`／`OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要目錄／檔案
  - 可使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗號分隔清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...`／`OPENCLAW_LIVE_MODELS=...` 可縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...`／`OPENCLAW_LIVE_PROVIDERS=...` 可在容器內篩選提供者
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 可在不需要重新建置的再次執行中重複使用現有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可確保憑證來自設定檔存放區（而非環境變數）
- `OPENCLAW_OPENWEBUI_MODEL=...` 可選擇閘道為 Open WebUI 冒煙測試公開的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 可覆寫 Open WebUI 冒煙測試所使用的隨機值檢查提示
- `OPENWEBUI_IMAGE=...` 可覆寫固定版本的 Open WebUI 映像標籤

## 文件健全性檢查

編輯文件後執行文件檢查：`pnpm check:docs`。
需要同時檢查頁面內標題時，請執行完整的 Mintlify 錨點驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI 安全）

以下是在不使用真實提供者的情況下執行的「真實管線」迴歸：

- 閘道工具呼叫（模擬 OpenAI、真實閘道與代理程式迴圈）：`src/gateway/gateway.test.ts`（案例：「透過閘道代理程式迴圈端對端執行一次模擬 OpenAI 工具呼叫」）
- 閘道精靈（WS `wizard.start`／`wizard.next`，寫入設定並強制驗證）：`src/gateway/gateway.test.ts`（案例：「透過 ws 執行精靈並寫入驗證權杖設定」）

## 代理程式可靠性評估（Skills）

我們已經有一些行為類似「代理程式可靠性評估」且對 CI 安全的測試：

- 透過真實閘道與代理程式迴圈執行模擬工具呼叫（`src/gateway/gateway.test.ts`）。
- 驗證工作階段接線與設定效果的端對端精靈流程（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **決策：**提示中列出 Skills 時，代理程式是否會選擇正確的 Skills（或避開無關的 Skills）？
- **合規性：**代理程式是否會在使用前讀取 `SKILL.md`，並遵循必要的步驟／引數？
- **工作流程契約：**可斷言工具順序、工作階段歷程延續及沙箱界線的多回合情境。

未來的評估應優先保持確定性：

- 使用模擬提供者的情境執行器，用於斷言工具呼叫及其順序、Skill 檔案讀取與工作階段接線。
- 一小組著重 Skills 的情境（使用與避用、閘門控管、提示注入）。
- 僅在 CI 安全的測試套件就緒後，才加入選用且受環境變數控管的即時評估。

## 契約測試（外掛與頻道形態）

契約測試會驗證每個已註冊的外掛與頻道是否符合其介面契約。這些測試會逐一處理所有探索到的外掛，並執行一組形態與行為斷言。預設的 `pnpm test` 單元測試通道刻意略過這些共用接合面與冒煙測試檔案；當你修改共用頻道或提供者介面時，請明確執行契約命令。

### 命令

- 所有契約：`pnpm test:contracts`
- 僅頻道契約：`pnpm test:contracts:channels`
- 僅提供者契約：`pnpm test:contracts:plugins`

### 頻道契約

位於 `src/channels/plugins/contracts/*.contract.test.ts`。目前的頂層類別：

- **頻道目錄** - 內建／登錄檔頻道目錄項目的中繼資料
- **外掛**（由登錄檔支援、已分片）- 基本外掛註冊形態
- **僅介面**（由登錄檔支援、已分片）- 對 `actions`、`setup`、`status`、`outbound`、`messaging`、`threading`、`directory` 與 `gateway` 進行個別介面形態檢查
- **工作階段繫結**（由登錄檔支援）- 工作階段繫結行為
- **對外承載資料** - 訊息承載資料結構與正規化
- **群組政策**（備援）- 各頻道的預設群組政策強制執行
- **討論串**（由登錄檔支援、已分片）- 討論串 ID 處理
- **目錄**（由登錄檔支援、已分片）- 目錄／名冊 API
- **登錄檔**與 **plugins-core.\*** - 頻道外掛登錄檔、載入器及設定寫入授權內部機制

這些套件所使用的傳入分派擷取與對外承載資料測試框架輔助工具，透過 `src/plugin-sdk/channel-contract-testing.ts` 在內部公開（不包含於 npm，且不是公開 SDK 子路徑）；此目錄中沒有獨立的 `inbound.contract.test.ts` 檔案。

### 提供者契約

位於 `src/plugins/contracts/*.contract.test.ts`。目前的類別包括：

- **形態** - 外掛資訊清單、API 與執行階段匯出形態
- **外掛註冊**（及平行執行）- 資訊清單註冊案例
- **套件資訊清單** - 套件資訊清單要求
- **載入器** - 外掛載入器設定／拆卸行為
- **登錄檔** - 外掛契約登錄檔內容與查詢
- **提供者** - 內建提供者之間的共用提供者行為，以及網路搜尋提供者
- **驗證選項** - 驗證選項中繼資料與設定行為
- **提供者目錄棄用** - 已棄用的提供者目錄中繼資料
- **精靈選項解析**、**精靈模型選擇器**、**精靈設定選項** - 提供者設定精靈契約
- **嵌入提供者**、**記憶嵌入提供者**、**網路擷取提供者**、**文字轉語音** - 特定能力的提供者契約
- **工作階段動作**、**工作階段附件**、**工作階段項目投影** - 外掛所擁有的工作階段狀態契約
- **排程回合** - 外掛排程回合中繼資料與時間戳記界限
- **主機掛鉤**、**執行內容生命週期**、**執行階段匯入副作用**、**執行階段接合面** - 外掛主機／執行階段生命週期與匯入邊界契約
- **擴充功能執行階段相依套件** - 擴充功能的執行階段相依套件配置位置

### 執行時機

- 變更外掛 SDK 匯出或子路徑後
- 新增或修改頻道或提供者外掛後
- 重構外掛註冊或探索後

契約測試會在 CI 中執行，不需要真實的 API 金鑰。

## 新增迴歸測試（指南）

修正即時環境中發現的提供者／模型問題時：

- 若可行，請新增 CI 安全的迴歸測試（模擬／虛設提供者，或擷取確切的請求形態轉換）
- 如果本質上只能在即時環境測試（速率限制、驗證政策），請讓即時測試保持精簡，並透過環境變數設為選用
- 優先針對能捕捉錯誤的最小層級：
  - 提供者請求轉換／重播錯誤 -> 直接模型測試
  - 閘道工作階段／歷程／工具管線錯誤 -> 閘道即時冒煙測試或 CI 安全的閘道模擬測試
- SecretRef 走訪防護：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從登錄檔中繼資料（`listSecretTargetRegistryEntries()`）為每個 SecretRef 類別衍生一個取樣目標，接著斷言包含走訪區段的 exec ID 會遭到拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增 `includeInPlan` SecretRef 目標系列，請更新該測試中的 `classifyTargetClass`。此測試會刻意在遇到未分類的目標 ID 時失敗，避免新類別被無聲略過。

## 相關內容

- [即時測試](/zh-TW/help/testing-live)
- [測試更新與外掛](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
