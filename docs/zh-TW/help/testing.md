---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/提供者錯誤新增迴歸測試
    - 偵錯閘道與代理程式行為
summary: 測試工具包：單元/端對端/即時測試套件、Docker 執行器，以及各項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-07-02T07:56:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 測試套件（單元/整合、e2e、實際連線），以及一小組 Docker 執行器。這份文件是「我們如何測試」指南：

- 每個套件涵蓋的內容（以及刻意_不_涵蓋的內容）。
- 常見工作流程（本機、推送前、偵錯）要執行哪些命令。
- 實際連線測試如何探索憑證並選取模型/供應商。
- 如何為真實世界的模型/供應商問題新增回歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、實際傳輸通道）**另有文件說明：

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) - 架構、命令介面、情境撰寫。
- [矩陣 QA](/zh-TW/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的參考資料。
- [成熟度計分卡](/zh-TW/maturity/scorecard) - 發行 QA 證據如何支援穩定性與 LTS 決策。
- [QA 頻道](/zh-TW/channels/qa-channel) - 由儲存庫支援的情境所使用的合成傳輸外掛。

本頁涵蓋一般測試套件與 Docker/Parallels 執行器的執行方式。下方的 QA 專用執行器章節（[QA 專用執行器](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上方參考資料。
</Note>

## 快速開始

大多數時候：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足機器上較快的本機完整套件執行：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由擴充套件/頻道路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在反覆處理單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你修改測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

## 測試暫存目錄

測試擁有的暫存目錄請優先使用 `test/helpers/temp-dir.ts` 中的共用輔助工具。它們會明確標示所有權，並將清理保持在同一個測試生命週期中：

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` 刻意不公開手動清理方法；Vitest 會在每個測試後負責清理。尚未遷移的測試仍可使用既有的較低階輔助工具，但新的與已遷移的測試應使用自動清理追蹤器。避免新增手動 `makeTempDir`、`cleanupTempDirs` 或 `createTempDirTracker` 用法，也避免在測試中新增裸露的 `fs.mkdtemp*` 呼叫，除非某個案例明確在驗證原始暫存目錄行為。當測試刻意需要裸露暫存目錄時，請加入可稽核的允許註解，並附上具體理由：

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

為了遷移可見性，`node scripts/report-test-temp-creations.mjs` 會回報新增差異行中新的裸露暫存目錄建立，以及新的手動共用輔助工具用法，而不會封鎖既有清理風格。它的檔案範圍刻意遵循 `scripts/changed-lanes.mjs` 使用的相同測試路徑分類，而不是維護另一套測試輔助檔名啟發式，同時略過共用輔助工具實作本身。`check:changed` 會對已變更的測試路徑執行此報告，作為僅警告的 CI 訊號；發現項目是 GitHub 警告註解，不是失敗。

偵錯真實供應商/模型時（需要真實憑證）：

- 實際連線套件（模型 + 閘道工具/影像探測）：`pnpm test:live`
- 靜默指定一個實際連線檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：派送 `OpenClaw Performance`，使用 `live_openai_candidate=true` 執行真實 `openai/gpt-5.5` agent 回合，或使用 `deep_profile=true` 產生 Kova CPU/heap/trace 成品。當設定 `CLAWGRIT_REPORTS_TOKEN` 時，每日排程執行會將 mock-provider、deep-profile 與 GPT 5.5 通道成品發布到 `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的閘道開機、記憶體、外掛壓力、重複假模型 hello-loop，以及命令列介面啟動數字。
- Docker 實際連線模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型現在會執行一個文字回合，加上一個小型類檔案讀取探測。中繼資料標示支援 `image` 輸入的模型也會執行一個微型影像回合。隔離供應商失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋範圍：每日 `OpenClaw Scheduled Live And E2E Checks` 與手動 `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的實際連線/E2E 工作流程，其中包含依供應商分片的個別 Docker 實際連線模型矩陣作業。
  - 若要聚焦重新執行 CI，請以 `include_live_suites: true` 與 `live_models_only: true` 派送 `OpenClaw Live And E2E Checks (Reusable)`。
  - 將新的高訊號供應商 secret 加到 `scripts/ci-hydrate-live-auth.sh`，以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其排程/發行呼叫端。
- 原生 Codex 綁定聊天煙霧測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker 實際連線通道，使用 `/codex bind` 綁定合成 Slack DM，演練 `/codex fast` 與 `/codex permissions`，接著驗證純文字回覆與影像附件會透過原生外掛綁定路由，而不是 ACP。
- Codex app-server harness 煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過外掛擁有的 Codex app-server harness 執行閘道 agent 回合，驗證 `/codex status` 與 `/codex models`，並預設演練影像、排程 MCP、子 agent 與 Guardian 探測。隔離其他 Codex app-server 失敗時，可用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用子 agent 探測。若要聚焦檢查子 agent，請停用其他探測：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在子 agent 探測後退出。
- Codex 隨選安裝煙霧測試：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安裝封裝後的 OpenClaw tarball，執行 OpenAI API 金鑰 onboarding，並驗證 Codex 外掛加上 `@openai/codex` 依賴項已按需下載到受管理的 npm 專案根目錄。
- 實際連線外掛工具依賴項煙霧測試：`pnpm test:docker:live-plugin-tool`
  - 封裝一個含有真實 `slugify` 依賴項的 fixture 外掛，透過 `npm-pack:` 安裝，驗證受管理 npm 專案根目錄下的依賴項，接著要求實際連線 OpenAI 模型呼叫外掛工具並回傳隱藏 slug。
- Crestodian rescue 命令煙霧測試：`pnpm test:live:crestodian-rescue-channel`
  - 訊息頻道 rescue 命令介面的選擇加入式雙重保險檢查。它會演練 `/crestodian status`、佇列持久模型變更、回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker 煙霧測試：`pnpm test:docker:crestodian-planner`
  - 在無設定容器中執行 Crestodian，並在 `PATH` 上提供假的 Claude CLI，驗證模糊 planner fallback 會轉譯為已稽核的型別化設定寫入。
- Crestodian 首次執行 Docker 煙霧測試：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄啟動，驗證現代 onboard Crestodian 進入點，套用 setup/model/agent/Discord 外掛 + SecretRef 寫入、驗證設定，並驗證稽核項目。相同的 Ring 0 設定路徑也由 QA Lab 中的 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 涵蓋。
- Moonshot/Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行 `openclaw models list --provider moonshot --json`，接著針對 `moonshot/kimi-k2.6` 執行隔離的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方說明的 allowlist 環境變數縮小實際連線測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA Lab 的真實感時，這些命令會與主要測試套件並列：

CI 會在專用工作流程中執行 QA Lab。Agentic parity 巢狀位於 `QA-Lab - All Lanes` 與發行驗證底下，而不是獨立的 PR 工作流程。廣泛驗證應使用 `Full Release Validation` 搭配 `rerun_group=qa-parity`，或使用 release-checks QA 群組。穩定/預設發行檢查會將完整實際連線/Docker soak 保留在 `run_release_soak=true` 後方；`full` profile 會強制開啟 soak。`QA-Lab - All Lanes` 會在 `main` 上每晚執行，並可由手動派送啟動，將 mock parity 通道、實際連線 Matrix 通道、Convex 管理的實際連線 Telegram 通道，以及 Convex 管理的實際連線 Discord 通道作為平行作業執行。排程 QA 與發行檢查會明確傳遞 Matrix `--profile fast`，而 Matrix 命令列介面與手動工作流程輸入預設仍為 `all`；手動派送可將 `all` 分片為 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 作業。`OpenClaw Release Checks` 會在發行核准前執行 parity 加上快速 Matrix 與 Telegram 通道，並對發行傳輸檢查使用 `mock-openai/gpt-5.5`，使其保持確定性並避免一般供應商外掛啟動。這些實際傳輸閘道會停用記憶體搜尋；記憶體行為仍由 QA parity 套件涵蓋。

完整發行的實際連線媒體分片使用 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含 `ffmpeg` 與 `ffprobe`。Docker 實際連線模型/後端分片使用共用的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，該映像會針對每個選取的 commit 建置一次，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由 repo 支援的 QA 情境。
  - 針對選取的情境集合寫入頂層 `qa-evidence.json`、`qa-suite-summary.json` 和
    `qa-suite-report.md` 成品，包含混合流程、Vitest 和 Playwright 情境選項。
  - 由 `pnpm openclaw qa run --qa-profile <profile>` 分派時，會在同一個
    `qa-evidence.json` 中嵌入選取的分類設定檔評分卡。`smoke-ci` 會寫入精簡證據，
    其設定 `evidenceMode: "slim"` 並省略每個項目的 `execution`。`release`
    涵蓋精選的發布就緒切片；`all` 會選取每個啟用中的成熟度類別，供需要完整評分卡成品時明確分派
    QA Profile Evidence 工作流程使用。
  - 預設以隔離的閘道 worker 平行執行多個選取情境。`qa-channel` 預設並行數為 4
    （受選取情境數量限制）。使用 `--concurrency <count>` 調整 worker 數量，或使用
    `--concurrency 1` 走舊版序列通道。
  - 任何情境失敗時會以非零狀態結束。當你想要產生成品但不想要失敗結束碼時，使用
    `--allow-failures`。
  - 支援提供者模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock`
    會啟動本機 AIMock 支援的提供者伺服器，用於實驗性 fixture 和協定模擬覆蓋範圍，而不取代具情境感知的
    `mock-openai` 通道。
- `pnpm openclaw qa coverage --match <query>`
  - 搜尋情境 ID、標題、介面、覆蓋範圍 ID、文件參照、程式碼參照、外掛和提供者需求，然後列印符合的套件目標。
  - 當你知道被觸及的行為或檔案路徑，但不知道最小情境時，請在 QA Lab 執行前使用此指令。它僅供建議；仍需依據正在變更的行為選擇模擬、即時、Multipass、Matrix 或傳輸證據。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink 外掛 gauntlet。它會安裝外部 Kitchen Sink 套件、驗證外掛 SDK 介面清單、探測 `/healthz` 和 `/readyz`、記錄閘道 CPU/RSS 證據、執行一次即時 OpenAI 回合，並檢查對抗式診斷。需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在已補水的 Testbox 工作階段中，當 `openclaw-testbox-env` helper 存在時，它會自動載入 Testbox 即時驗證設定檔。
- `pnpm test:gateway:cpu-scenarios`
  - 執行閘道啟動 bench 加上一小組模擬 QA Lab 情境包（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/` 下寫入合併的 CPU 觀測摘要。
  - 預設只標記持續高 CPU 觀測（`--cpu-core-warn` 加上 `--hot-wall-warn-ms`），因此短暫的啟動突增會記錄為指標，而不會看起來像持續數分鐘的閘道佔滿迴歸。
  - 使用已建置的 `dist` 成品；當 checkout 尚未有新鮮的執行階段輸出時，請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 內執行同一個 QA 套件。
  - 保持與主機上 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的提供者/模型選取旗標。
  - 即時執行會轉送對 guest 實用的受支援 QA 驗證輸入：以 env 為基礎的提供者金鑰、QA 即時提供者設定路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須留在 repo 根目錄下，讓 guest 可透過掛載的工作區寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告與摘要，以及 Multipass 記錄。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA 網站，用於操作員風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball、在 Docker 中全域安裝、執行非互動式 OpenAI API 金鑰入門設定、預設設定 Telegram、驗證封裝的外掛執行階段可載入且不需要啟動依賴修復、執行 doctor，並針對模擬的 OpenAI 端點執行一次本機 agent 回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行同一條封裝安裝通道。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式執行階段上下文逐字稿執行確定性的已建置應用程式 Docker smoke。它會驗證隱藏的 OpenClaw 執行階段上下文會作為非顯示自訂訊息持久化，而不是洩漏到可見的使用者回合中，接著植入受影響的破損工作階段 JSONL，並驗證 `openclaw doctor --fix` 會將其重寫到作用中分支且建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 套件候選版本、執行已安裝套件的入門設定、透過已安裝的命令列介面設定 Telegram，然後重用即時 Telegram QA 通道，並以該已安裝套件作為 SUT 閘道。
  - wrapper 只會從 checkout 掛載 `qa-lab` harness 來源；已安裝套件擁有 `dist`、`openclaw/plugin-sdk` 和 bundled 外掛執行階段，因此該通道不會把目前 checkout 的外掛混入受測套件。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而不是從 registry 安裝。
  - 預設使用 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` 在 `qa-evidence.json` 中發出重複 RTT 時序。覆寫 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 以調整 RTT 執行。`OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` 接受以逗號分隔的 Telegram QA 檢查 ID 清單進行取樣；未設定時，預設具 RTT 能力的檢查為 `telegram-mentioned-message-reply`。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env 憑證或 Convex 憑證來源。對於 CI/發布自動化，請設定 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，加上 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色 secret。如果 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色 secret，Docker wrapper 會自動選取 Convex。
  - wrapper 會在 Docker build/install 工作前，先在主機上驗證 Telegram 或 Convex 憑證 env。只有在刻意除錯憑證前設定時，才設定 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此通道覆寫共用的 `OPENCLAW_QA_CREDENTIAL_ROLE`。選取 Convex 憑證且未設定角色時，wrapper 在 CI 中使用 `ci`，在 CI 外使用 `maintainer`。
  - GitHub Actions 將此通道公開為手動 maintainer 工作流程 `NPM Telegram Beta E2E`。它不會在 merge 時執行。該工作流程使用 `qa-live-shared` 環境和 Convex CI 憑證租約。
- GitHub Actions 也公開 `Package Acceptance`，用於針對一個候選套件進行 side-run 產品證據。它接受受信任 ref、已發布 npm spec、HTTPS tarball URL 加 SHA-256，或來自另一個 run 的 tarball 成品，將正規化的 `openclaw-current.tgz` 作為 `package-under-test` 上傳，然後使用 smoke、package、product、full 或自訂通道設定檔執行現有 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對同一個 `package-under-test` 成品執行 Telegram QA 工作流程。
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

- 企業/私人 tarball mirror 使用明確的受信任來源政策：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` 會從受信任工作流程 ref 讀取 `.github/package-trusted-sources.json`，且不接受 URL 憑證或工作流程輸入的私人網路繞過。如果指定的政策宣告 bearer 驗證，請設定固定的 `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret。

- 成品證據會從另一個 Actions run 下載 tarball 成品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw build、以已設定 OpenAI 的狀態啟動閘道，然後透過設定編輯啟用 bundled channel/plugins。
  - 驗證 setup discovery 會讓未設定的可下載外掛保持不存在、第一次設定後的 doctor repair 會明確安裝每個缺少的可下載外掛，且第二次重新啟動不會執行隱藏的依賴修復。
  - 也會安裝已知較舊的 npm baseline、在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的更新後 doctor 會清理 legacy 外掛依賴殘留，而不需要 harness 端 postinstall repair。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生封裝安裝更新 smoke。每個選取的平台會先安裝指定的 baseline 套件，接著在同一個 guest 中執行已安裝的 `openclaw update` 指令，並驗證已安裝版本、更新狀態、閘道就緒狀態，以及一次本機 agent 回合。
  - 在迭代單一 guest 時使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得摘要成品路徑和每個通道狀態。
  - OpenAI 通道預設使用 `openai/gpt-5.5` 進行即時 agent 回合證據。刻意驗證另一個 OpenAI 模型時，傳入 `--model <provider/model>` 或設定 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels 傳輸停滯耗盡剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 腳本會將巢狀通道記錄寫入 `/tmp/openclaw-parallels-npm-update.*` 下。先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`，再假設外層 wrapper 已卡住。
  - Windows update 在冷 guest 上可能花 10 到 15 分鐘進行更新後 doctor 和套件更新工作；只要巢狀 npm debug log 仍在前進，這仍是健康狀態。
  - 不要將此彙總 wrapper 與個別 Parallels macOS、Windows 或 Linux smoke 通道平行執行。它們共用 VM 狀態，可能在快照還原、套件服務或 guest 閘道狀態上發生衝突。
  - 更新後證據會執行一般 bundled 外掛介面，因為語音、影像生成和媒體理解等 capability facade 會透過 bundled 執行階段 API 載入，即使 agent 回合本身只檢查簡單的文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock 提供者伺服器，用於直接通訊協定冒煙測試。
- `pnpm openclaw qa matrix`
  - 針對一次性的 Docker 支援 Tuwunel homeserver 執行 Matrix 即時 QA 路線。僅限來源 checkout - 封裝安裝不會隨附 `qa-lab`。
  - 完整命令列介面、profile/scenario 目錄、環境變數與成品配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自環境變數的 driver 與 SUT bot token，針對真實私人群組執行 Telegram 即時 QA 路線。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用集區憑證。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選擇加入集區租用。
  - 預設涵蓋 canary、mention gating、command addressing、`/status`、bot-to-bot mentioned replies，以及核心原生命令回覆。`mock-openai` 預設也涵蓋確定性的 reply-chain 與 Telegram final-message streaming 迴歸。使用 `--list-scenarios` 查看可選探針，例如 `session_status`。
  - 任何 scenario 失敗時會以非零狀態結束。當你想要成品但不想要失敗的結束碼時，請使用 `--allow-failures`。
  - 需要同一個私人群組中的兩個不同 bot，且 SUT bot 必須公開 Telegram 使用者名稱。
  - 若要穩定觀察 bot-to-bot，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 能觀察群組 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要與 `qa-evidence.json`。回覆 scenarios 會包含從 driver 傳送請求到觀察到 SUT 回覆的 RTT。

`Mantis Telegram Live` 是此路線周圍的 PR 證據包裝器。它使用 Convex 租用的 Telegram 憑證執行候選 ref，在 Crabbox 桌面瀏覽器中渲染已遮蔽的 QA 報告/證據套件、錄製 MP4 證據、產生動作裁剪後的 GIF、上傳成品套件，並在設定 `pr_number` 時透過 Mantis GitHub App 發佈行內 PR 證據。維護者可以透過 `Mantis Scenario`（`scenario_id:
telegram-live`）從 Actions UI 啟動它，或直接從 pull request 留言啟動：

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用於 PR 視覺證明的代理式原生 Telegram Desktop 前後對照包裝器。可使用自由格式 `instructions` 從 Actions UI 啟動、透過 `Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）啟動，或從 PR 留言啟動：

```text
@openclaw-mantis telegram desktop proof
```

Mantis agent 會讀取 PR、判斷哪些 Telegram 可見行為能證明變更，在 baseline 與候選 ref 上執行真實使用者 Crabbox Telegram Desktop 證明路線，反覆迭代直到原生 GIF 有用為止，寫入成對的 `motionPreview` manifest，並在設定 `pr_number` 時透過 Mantis GitHub App 發佈相同的雙欄 GIF 表格。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重用 Crabbox Linux 桌面、安裝原生 Telegram Desktop、使用租用的 Telegram SUT bot token 設定 OpenClaw、啟動閘道，並從可見的 VNC 桌面錄製截圖/MP4 證據。
  - 預設為 `--credential-source convex`，因此 workflows 只需要 Convex broker secret。若要使用與 `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 變數，請使用 `--credential-source env`。
  - Telegram Desktop 仍需要使用者登入/profile。bot token 只用於設定 OpenClaw。使用 `--telegram-profile-archive-env <name>` 指定 base64 `.tgz` profile archive，或使用 `--keep-lease` 並透過 VNC 手動登入一次。
  - 在輸出目錄下寫入 `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png` 和 `telegram-desktop-builder.mp4`。

即時 transport 路線共用一個標準合約，讓新的 transports 不會偏移；各路線涵蓋矩陣位於 [QA overview → 即時 transport 涵蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的合成套件，並不屬於該矩陣。

### 透過 Convex 共用 Telegram 憑證 (v1)

為即時 transport QA 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 支援的集區取得獨佔租用，在路線執行期間對該租用送出心跳偵測，並在關閉時釋放租用。此章節名稱早於 Discord、Slack 與 WhatsApp 支援；租用合約會跨種類共用。

參考 Convex 專案 scaffold：

- `qa/convex-credential-broker/`

必要環境變數：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- 憑證角色選擇：
  - 命令列介面：`--credential-role maintainer|ci`
  - Env 預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（CI 中預設為 `ci`，否則為 `maintainer`）

可選環境變數：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可選 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許 local-only 開發使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

維護者管理命令（pool add/remove/list）明確需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

維護者命令列介面 helper：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor` 檢查 Convex site URL、broker secrets、endpoint prefix、HTTP timeout 與 admin/list 可達性，且不列印 secret 值。使用 `--json` 取得 scripts 與 CI utilities 可讀取的機器可讀輸出。

預設 endpoint 合約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Success: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success: `{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（僅限 maintainer secret）
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove`（僅限 maintainer secret）
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅限 maintainer secret）
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Telegram kind 的 payload 形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字 Telegram chat id 字串。
- `admin/add` 會驗證 `kind: "telegram"` 的此形狀，並拒絕格式錯誤的 payload。

Telegram real-user kind 的 payload 形狀：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 和 `telegramApiId` 必須是數字字串。
- `tdlibArchiveSha256` 和 `desktopTdataArchiveSha256` 必須是 SHA-256 hex 字串。
- `kind: "telegram-user"` 保留給 Mantis Telegram Desktop proof workflow。通用 QA Lab 路線不得取得它。

Broker 驗證的 multi-channel payload：

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 路線也可以從集區租用，但 Slack payload 驗證目前位於 Slack QA runner，而不是 broker。Slack rows 使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 將 channel 新增至 QA

新 channel adapters 的架構與 scenario-helper 名稱位於 [QA overview → 新增 channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低門檻：在共用的 `qa-lab` host seam 上實作 transport runner、在外掛 manifest 中宣告 `qaRunners`、掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫 scenarios。

## 測試套件（何處執行何者）

將套件視為「逐步提高真實度」（也逐步提高不穩定性/成本）：

### Unit / integration（預設）

- Command: `pnpm test`
- Config: 未指定目標的執行會使用 `vitest.full-*.config.ts` shard set，並可能將 multi-project shards 展開為 per-project configs 以進行平行排程
- Files: `src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit inventories；UI unit tests 會在專用的 `unit-ui` shard 中執行
- Scope:
  - 純 unit tests
  - In-process integration tests（gateway auth、routing、tooling、parsing、config）
  - 已知 bug 的確定性迴歸
- Expectations:
  - 在 CI 中執行
  - 不需要真實 keys
  - 應快速且穩定
  - Resolver 與 public-surface loader tests 必須使用產生的小型 plugin fixtures 證明廣泛的 `api.js` 與 `runtime-api.js` fallback 行為，而不是使用真實 bundled plugin source APIs。真實 plugin API 載入屬於 plugin-owned contract/integration suites。

原生相依性政策：

- 預設測試安裝會略過可選的原生 Discord opus builds。Discord voice 使用 bundled `libopus-wasm`，且 `@discordjs/opus` 在 `allowBuilds` 中保持停用，讓本機 tests 與 Testbox lanes 不會編譯原生 addon。
- 請在 `libopus-wasm` benchmark repo 比較原生 opus 效能，而不是在預設 OpenClaw install/test loops 中比較。不要在預設 `allowBuilds` 中將 `@discordjs/opus` 設為 `true`；那會讓無關的 install/test loops 編譯原生程式碼。

<AccordionGroup>
  <Accordion title="Projects、shards 與 scoped lanes">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這會降低負載機器上的 RSS 峰值，並避免 auto-reply/extension 工作讓無關的套件挨餓。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片監看迴圈並不實用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過範圍化通道路由明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免支付完整根專案啟動成本。
    - `pnpm test:changed` 預設會將已變更的 git 路徑展開為低成本的範圍化通道：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖相依項。設定/安裝/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的標準智慧本機檢查閘門。它會將 diff 分類為 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然後執行相符的 typecheck、lint 和 guard 命令。它不會執行 Vitest 測試；測試證明請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅有發布中繼資料的版本 bump 會執行定向 version/config/root-dependency 檢查，並以 guard 拒絕頂層 version 欄位以外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth 指令碼的 shell 語法，以及 live Docker scheduler dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時，才會包含 `package.json` 變更；dependency、export、version 和其他 package surface 編輯仍會使用較廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純工具區域的輕匯入單元測試，會路由到 `unit-fast` 通道，該通道會跳過 `test/setup-openclaw-runtime.ts`；具狀態/重 runtime 的檔案會保留在現有通道上。
    - 選定的 `plugin-sdk` 和 `commands` helper 來源檔，也會將 changed-mode 執行對應到這些輕量通道中的明確同層測試，因此 helper 編輯可避免重新執行該目錄的完整重型套件。
    - `auto-reply` 針對頂層 core helpers、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹有專用 bucket。CI 會進一步將 reply 子樹拆成 agent-runner、dispatch 和 commands/state-routing 分片，讓單一匯入密集的 bucket 不會掌握完整的 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension 批次掃描和僅限發布的 `agentic-plugins` 分片。完整發布驗證會針對發布候選版，派送獨立的 `Plugin Prerelease` 子工作流程來執行這些 plugin/extension 重型套件。

  </Accordion>

  <Accordion title="嵌入式執行器覆蓋範圍">

    - 變更訊息工具探索輸入或壓縮 runtime
      context 時，請保留兩個層級的覆蓋範圍。
    - 為純路由與正規化邊界加入聚焦 helper regression。
    - 保持嵌入式執行器整合套件健康：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` 和
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證範圍化 id 和壓縮行為仍會流經
      真正的 `run.ts` / `compact.ts` 路徑；僅有 helper 的測試
      無法充分替代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool 與隔離預設值">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共享 Vitest 設定會固定 `isolate: false`，並在根專案、e2e 和 live 設定中使用
      非隔離執行器。
    - 根 UI 通道保留其 `jsdom` 設定和 optimizer，但也在
      共享的非隔離執行器上執行。
    - 每個 `pnpm test` 分片都會從共享 Vitest 設定繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序加入 `--no-maglev`，以降低大型本機執行期間的 V8 編譯 churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與原版 V8
      行為比較。
    - `scripts/run-vitest.mjs` 會在明確的非 watch Vitest 執行
      連續 5 分鐘沒有 stdout 或 stderr 輸出後終止。設定
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` 可在
      有意靜默的調查中停用 watchdog。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構通道。
    - pre-commit hook 只做格式化。它會重新 stage 格式化後的檔案，
      不會執行 lint、typecheck 或測試。
    - 需要智慧本機檢查閘門時，請在 handoff 或 push 前明確執行
      `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本的範圍化通道路由。只有當 agent
      判斷 harness、config、package 或 contract 編輯確實需要更廣泛的
      Vitest 覆蓋範圍時，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行為，只是 worker 上限較高。
    - 本機 worker 自動縮放刻意保守，並會在主機 load average 已經很高時
      退讓，因此多個並行
      Vitest 執行預設造成的影響較小。
    - 基礎 Vitest 設定會將 projects/config files 標記為
      `forceRerunTriggers`，因此當測試 wiring 變更時，changed-mode 重新執行仍會保持正確。
    - 此設定會在支援的主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      若你想為直接 profiling 使用一個明確的快取位置，請設定
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能除錯">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入耗時報告，加上
      匯入 breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 視圖範圍化到
      自 `origin/main` 以來變更的檔案。
    - 分片 timing 資料會寫入 `.artifacts/vitest-shard-timings.json`。
      整個設定執行會使用設定路徑作為 key；include-pattern CI
      分片會附加分片名稱，使過濾後的分片可被分開追蹤。
    - 當某個熱門測試仍將大部分時間花在啟動匯入上時，
      請將重型相依項保留在窄範圍本機 `*.runtime.ts` seam 後方，並
      直接 mock 該 seam，而不是 deep-import runtime helpers 只為了
      將它們傳給 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會將路由後的
      `test:changed` 與該已提交 diff 的原生根專案路徑比較，
      並列印 wall time 和 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest 設定路由已變更檔案清單，
      以 benchmark 目前的 dirty tree。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動和 transform overhead 寫入主執行緒 CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行化的情況下，
      為單元套件寫入 runner CPU+heap profile。

  </Accordion>
</AccordionGroup>

### 穩定性（閘道）

- 命令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 預設啟用 diagnostics，啟動真正的 loopback 閘道
  - 透過 diagnostic event 路徑驅動合成的閘道訊息、記憶體和大型 payload churn
  - 透過閘道 WS RPC 查詢 `diagnostics.stability`
  - 覆蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 保持有界、合成 RSS 樣本維持在壓力預算以下，且每個 session 的 queue depths 會排空回到零
- 預期：
  - CI 安全且不需要 key
  - 用於 stability-regression follow-up 的窄通道，不是完整閘道套件的替代品

### E2E（repo aggregate）

- 命令：`pnpm test:e2e`
- 範圍：
  - 執行閘道 smoke E2E 通道
  - 執行 mocked Control UI browser E2E 通道
- 預期：
  - CI 安全且不需要 key
  - 需要安裝 Playwright Chromium

### E2E（閘道 smoke）

- 命令：`pnpm test:e2e:gateway`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 底下的 bundled-plugin E2E 測試
- Runtime 預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用自適應 workers（CI：最多 2 個，本機：預設 1 個）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 用於強制 worker 數量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用於重新啟用 verbose console output。
- 範圍：
  - 多實例閘道端對端行為
  - WebSocket/HTTP surfaces、節點配對，以及較重的網路處理
- 預期：
  - 在 CI 中執行（於 pipeline 啟用時）
  - 不需要真實 key
  - 比單元測試有更多 moving parts（可能較慢）

### E2E（Control UI mocked browser）

- 命令：`pnpm test:ui:e2e`
- 設定：`test/vitest/vitest.ui-e2e.config.ts`
- 檔案：`ui/src/**/*.e2e.test.ts`
- 範圍：
  - 啟動 Vite Control UI
  - 透過 Playwright 驅動真正的 Chromium 頁面
  - 使用 deterministic in-browser mocks 取代閘道 WebSocket
- 預期：
  - 作為 `pnpm test:e2e` 的一部分在 CI 中執行
  - 不需要真正的閘道、agents 或 provider keys
  - 必須有 browser dependency（`pnpm --dir ui exec playwright install chromium`）

### E2E：OpenShell backend smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 重用作用中的本機 OpenShell 閘道
  - 從暫時本機 Dockerfile 建立 sandbox
  - 透過真正的 `sandbox ssh-config` + SSH exec 操作 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證 remote-canonical filesystem 行為
- 預期：
  - 僅 opt-in；不屬於預設 `pnpm test:e2e` 執行
  - 需要本機 `openshell` 命令列介面加上可用的 Docker daemon
  - 需要作用中的本機 OpenShell 閘道及其設定來源
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，接著銷毀測試 sandbox
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 用於在手動執行較廣泛 e2e 套件時啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用於指向非預設命令列介面 binary 或 wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` 用於向隔離測試公開已註冊的閘道設定
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` 用於覆寫 host policy fixture 使用的 Docker gateway IP

### Live（真實 providers + 真實 models）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled-plugin live 測試
- 預設：由 `pnpm test:live` **啟用**（會設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  -「這個供應商/模型在 _今天_ 搭配真實憑證真的能運作嗎？」
  - 捕捉供應商格式變更、工具呼叫差異、驗證問題，以及速率限制行為
- 預期：
  - 設計上並非 CI 穩定（真實網路、真實供應商政策、配額、服務中斷）
  - 會花錢 / 使用速率限制額度
  - 優先執行縮小範圍的子集，而不是「全部」
- Live 執行會使用已匯出的 API 金鑰和預備好的驗證設定檔。
- 預設情況下，live 執行仍會隔離 `HOME`，並將設定/驗證資料複製到暫時測試 home，讓單元 fixture 無法修改你真正的 `~/.openclaw`。
- 只有在你刻意需要 live 測試使用真正的 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 預設為較安靜的模式：它保留 `[live] ...` 進度輸出，並靜音閘道啟動記錄/Bonjour 雜訊。若你想恢復完整啟動記錄，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依供應商而定）：使用逗號/分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 進行個別 live 覆寫；測試會在遇到速率限制回應時重試。
- 進度/心跳偵測輸出：
  - Live suite 現在會將進度行輸出到 stderr，因此即使 Vitest 主控台擷取很安靜，長時間供應商呼叫仍會明顯顯示為活動中。
  - `vitest.live.config.ts` 會停用 Vitest 主控台攔截，因此供應商/閘道進度行會在 live 執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model 心跳偵測。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整閘道/probe 心跳偵測。

## 我應該執行哪個 suite？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更很多，也執行 `pnpm test:coverage`）
- 觸及閘道網路 / WS 協定 / 配對：加上 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 供應商特定失敗 / 工具呼叫：執行縮小範圍的 `pnpm test:live`

## Live（會碰網路的）測試

關於 live 模型矩陣、命令列介面後端 smoke、ACP smoke、Codex app-server
harness，以及所有媒體供應商 live 測試（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）- 加上 live 執行的憑證處理 - 請參閱
[測試 live suite](/zh-TW/help/testing-live)。關於專用的更新與
外掛驗證檢查清單，請參閱
[測試更新與外掛](/zh-TW/help/testing-updates-plugins)。

## Docker runner（選用的「可在 Linux 運作」檢查）

這些 Docker runner 分成兩類：

- Live-model runner：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像內執行各自相符的 profile-key live 檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載你的本機設定目錄、工作區，以及選用的設定檔環境檔。相符的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live runner 會在需要時保留自己的實用上限：
  `test:docker:live-models` 預設為精選且支援的高訊號集合，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。當你明確想要較小上限或較大掃描時，請設定 `OPENCLAW_LIVE_MAX_MODELS`
  或閘道環境變數。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置 live Docker 映像一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包成 npm tarball 一次，然後建置/重用兩個 `scripts/e2e/Dockerfile` 映像。裸映像只是不含 Node/Git 的 runner，用於 install/update/plugin-dependency lane；這些 lane 會掛載預先建置的 tarball。功能映像會將同一個 tarball 安裝到 `/app`，用於 built-app functionality lane。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的計畫。彙總會使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序 slot，而資源上限會避免繁重的 live、npm-install 和 multi-service lane 同時全部啟動。如果單一 lane 比作用中的上限更重，排程器在 pool 為空時仍可啟動它，然後讓它單獨執行，直到再次有容量可用。預設值為 10 個 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker host 有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 預設會執行 Docker preflight、移除過期的 OpenClaw E2E container、每 30 秒列印狀態、將成功 lane 計時儲存在 `.artifacts/docker-tests/lane-timings.json`，並使用這些計時在後續執行中優先啟動較長的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不建置或執行 Docker 的情況下列印加權 lane manifest，或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lane、package/image 需求與憑證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生的套件 gate，用來檢查「這個可安裝的 tarball 是否能像產品一樣運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析出一個候選套件，將它上傳為 `package-under-test`，然後針對那個確切的 tarball 執行可重用的 Docker E2E lane，而不是重新打包選定的 ref。設定檔依涵蓋範圍排序：`smoke`、`package`、`product` 和 `full`。請參閱[測試更新與外掛](/zh-TW/help/testing-updates-plugins)，了解套件/更新/外掛合約、published-upgrade survivor 矩陣、發行預設值，以及失敗分流。
- 建置與發行檢查會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。這個 guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態建置圖，並在命令分派前的 pre-dispatch startup 匯入 Commander、prompt UI、undici 或 logging 等套件相依性時失敗；它也會讓 bundled gateway run chunk 維持在預算內，並拒絕已知 cold gateway 路徑的靜態匯入。打包後的命令列介面 smoke 也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list 命令。
- Package Acceptance legacy compatibility 的上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點以前，harness 只容忍已發布套件的中繼資料缺口：省略私有 QA inventory 項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少持久化的 `update.channel`、legacy 外掛 install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的 config metadata migration。對於 `2026.4.25` 之後的套件，這些路徑都是嚴格失敗。
- Container smoke runner：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`，以及 `test:docker:config-reload` 會啟動一個或多個真實 container，並驗證較高層級的整合路徑。
- 透過 `scripts/lib/openclaw-e2e-instance.sh` 安裝已打包 OpenClaw tarball 的 Docker/Bash E2E lane，會將 `npm install` 限制在 `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（預設 `600s`；設定為 `0` 可停用 wrapper 以便偵錯）。

Live-model Docker runner 也只會 bind-mount 所需的命令列介面驗證 home（或在執行未縮小範圍時掛載所有支援的 home），然後在執行前將它們複製到 container home，讓 external-CLI OAuth 可以重新整理 token，而不會修改 host 驗證儲存區：

- Direct models：`pnpm test:docker:live-models`（script：`scripts/test-live-models-docker.sh`）
- ACP bind smoke：`pnpm test:docker:live-acp-bind`（script：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 提供嚴格的 Droid/OpenCode 涵蓋）
- 命令列介面後端 smoke：`pnpm test:docker:live-cli-backend`（script：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`（script：`scripts/test-live-codex-harness-docker.sh`）
- 閘道 + dev agent：`pnpm test:docker:live-gateway`（script：`scripts/test-live-gateway-models-docker.sh`）
- Observability smoke：`pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 和 `pnpm qa:observability:smoke` 是私有 QA source-checkout lane。它們刻意不屬於套件 Docker 發行 lane，因為 npm tarball 省略 QA Lab。
- Open WebUI live smoke：`pnpm test:docker:openwebui`（script：`scripts/e2e/openwebui-docker.sh`）
- Onboarding wizard（TTY，完整 scaffolding）：`pnpm test:docker:onboard`（script：`scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/channel/agent smoke：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已打包的 OpenClaw tarball，透過 env-ref onboarding 設定 OpenAI，並預設設定 Telegram，執行 doctor，並執行一次 mock 的 OpenAI agent turn。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 略過 host 重新建置，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換 channel。

- 發行使用者旅程冒煙測試：`pnpm test:docker:release-user-journey` 會在乾淨的 Docker home 中全域安裝打包好的 OpenClaw tarball、執行 onboarding、設定模擬的 OpenAI provider、執行一次 agent turn、安裝/解除安裝外部外掛、針對本機 fixture 設定 ClickClack、驗證出站/入站訊息、重新啟動閘道，並執行 doctor。
- 發行 typed onboarding 冒煙測試：`pnpm test:docker:release-typed-onboarding` 會安裝打包好的 tarball，透過真實 TTY 驅動 `openclaw onboard`，將 OpenAI 設定為 env-ref provider，驗證不會持久保存原始 key，並執行一次模擬的 agent turn。
- 發行媒體/記憶冒煙測試：`pnpm test:docker:release-media-memory` 會安裝打包好的 tarball，驗證從 PNG 附件進行影像理解、OpenAI 相容的影像生成輸出、記憶搜尋召回，以及召回在閘道重新啟動後仍能保留。
- 發行升級使用者旅程冒煙測試：`pnpm test:docker:release-upgrade-user-journey` 預設會安裝比候選 tarball 舊的最新已發布 baseline，在已發布套件上設定 provider/外掛/ClickClack 狀態，升級到候選 tarball，然後重新執行核心 agent/外掛/channel 旅程。如果沒有較舊的已發布 baseline，則重用候選版本。可用 `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` 覆寫 baseline。
- 發行外掛市集冒煙測試：`pnpm test:docker:release-plugin-marketplace` 會從本機 fixture marketplace 安裝、更新已安裝的外掛、解除安裝它，並驗證外掛命令列介面會隨著安裝 metadata 被修剪而消失。
- Skill 安裝冒煙測試：`pnpm test:docker:skill-install` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，在 config 中停用已上傳 archive 安裝，從搜尋解析目前 live ClawHub skill slug，使用 `openclaw skills install` 安裝它，並驗證已安裝的 skill 以及 `.clawhub` origin/lock metadata。
- 更新 channel 切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，從 package `stable` 切換到 git `dev`，驗證持久保存的 channel 和外掛在更新後可運作，然後切回 package `stable` 並檢查更新狀態。
- 升級存活者冒煙測試：`pnpm test:docker:upgrade-survivor` 會把打包好的 OpenClaw tarball 安裝到帶有 agent、channel config、外掛 allowlist、過期外掛 dependency state，以及既有 workspace/session 檔案的髒 old-user fixture 上。它會在沒有 live provider 或 channel key 的情況下執行 package update 與非互動式 doctor，然後啟動 loopback 閘道，並檢查 config/state 保留以及啟動/status budgets。
- 已發布升級存活者冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`，植入逼真的既有使用者檔案，使用內建 command recipe 設定該 baseline，驗證產生的 config，將該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 loopback 閘道，並檢查已設定 intents、state 保留、啟動、`/healthz`、`/readyz` 和 RPC status budgets。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一 baseline，要求 aggregate scheduler 以 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確本機 baseline，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，並以 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue-shaped fixtures，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw 外掛安裝。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析像 `last-stable-4` 或 `all-since-2026.4.23` 這類 meta baseline tokens，而 Full Release Validation 會將 release-soak package gate 展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- Session runtime context 冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏 runtime context transcript 持久保存，以及 doctor 對受影響的重複 prompt-rewrite branches 進行修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前 tree，在隔離 home 中使用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會回傳 bundled image providers，而不是卡住。可用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball、用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過 host build，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker image 複製 `dist/`。
- Installer Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm containers 之間共用一個 npm cache。Update smoke 預設以 npm `latest` 作為 stable baseline，然後升級到候選 tarball。本機可用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用 Install Smoke workflow 的 `update_baseline_version` input 覆寫。Non-root installer checks 會保留隔離的 npm cache，避免 root-owned cache entries 掩蓋 user-local install 行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重跑時重用 root/update/direct-npm cache。
- Install Smoke CI 會用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm global update；需要 direct `npm install -g` coverage 時，請在本機不帶該 env 執行 script。
- Agents 刪除 shared workspace 命令列介面冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（script：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置 root Dockerfile image，在隔離 container home 中植入兩個共用一個 workspace 的 agent，執行 `agents delete --json`，並驗證有效 JSON 以及 retained workspace 行為。可用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke image。
- 閘道網路（兩個 containers，WS auth + health）：`pnpm test:docker:gateway-network`（script：`scripts/e2e/gateway-network-docker.sh`）
- Browser CDP snapshot 冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（script：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置 source E2E image 加上一層 Chromium，使用 raw CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role snapshots 涵蓋 link URL、cursor-promoted clickables、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning regression：`pnpm test:docker:openai-web-search-minimal`（script：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過閘道執行模擬的 OpenAI server，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升到 `low`，然後強制 provider schema reject，並檢查 raw detail 會出現在閘道 logs 中。
- MCP channel bridge（已植入的閘道 + stdio bridge + raw Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（script：`scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw bundle MCP tools（真實 stdio MCP server + embedded OpenClaw profile allow/deny 冒煙測試）：`pnpm test:docker:agent-bundle-mcp-tools`（script：`scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- 排程/subagent MCP cleanup（真實閘道 + isolated cron 和 one-shot subagent runs 後的 stdio MCP child teardown）：`pnpm test:docker:cron-mcp-cleanup`（script：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 外掛（local path、`file:`、含 hoisted dependencies 的 npm registry、malformed npm package metadata、git moving refs、ClawHub kitchen-sink、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試）：`pnpm test:docker:plugins`（script：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳過 ClawHub block，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink package/runtime pair。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用 hermetic 本機 ClawHub fixture server。
- 外掛更新 unchanged 冒煙測試：`pnpm test:docker:plugin-update`（script：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 外掛 lifecycle matrix 冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在 bare container 中安裝打包好的 OpenClaw tarball、安裝 npm 外掛、切換 enable/disable、透過本機 npm registry 升級和降級它、刪除已安裝的 code，然後驗證 uninstall 仍會移除 stale state，同時記錄每個 lifecycle phase 的 RSS/CPU metrics。
- Config reload metadata 冒煙測試：`pnpm test:docker:config-reload`（script：`scripts/e2e/config-reload-source-docker.sh`）
- 外掛：`pnpm test:docker:plugins` 涵蓋 local path、`file:`、含 hoisted dependencies 的 npm registry、git moving refs、ClawHub fixtures、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試。`pnpm test:docker:plugin-update` 涵蓋 installed plugins 的 unchanged update 行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋 resource-tracked npm 外掛 install、enable、disable、upgrade、downgrade，以及 missing-code uninstall。

若要手動預先建置並重用 shared functional image：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

已設定時，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 這類 suite-specific image overrides 仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向 remote shared image 時，如果 scripts 發現它尚未存在於本機，會將其 pull 下來。QR 和 installer Docker tests 會保留自己的 Dockerfiles，因為它們驗證的是 package/install 行為，而不是 shared built-app runtime。

即時模型 Docker 執行器也會以唯讀方式 bind-mount 目前的 checkout，並
將它暫存到容器內的臨時工作目錄。這能讓執行階段
映像維持精簡，同時仍針對你精確的本機來源/設定執行 Vitest。
暫存步驟會略過大型的本機限定快取與應用程式建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及應用程式本機的 `.build` 或
Gradle 輸出目錄，因此 Docker 即時執行不會花費數分鐘複製
機器特定的成品。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此閘道即時探測不會在
容器內啟動真實的 Telegram/Discord/等通道 worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要縮小或排除該 Docker lane 中的閘道
即時涵蓋範圍時，也請傳入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高層級的相容性煙霧測試：它會啟動一個
已啟用 OpenAI 相容 HTTP 端點的 OpenClaw 閘道容器，
啟動一個固定版本的 Open WebUI 容器並連到該閘道，透過
Open WebUI 登入，驗證 `/api/models` 會公開 `openclaw/default`，然後透過 Open WebUI 的 `/api/chat/completions` 代理傳送
真實聊天請求。
對於應在 Open WebUI 登入與模型探索後即停止、
不等待即時模型完成的發行路徑 CI 檢查，請設定 `OPENWEBUI_SMOKE_MODE=models`。
第一次執行可能明顯較慢，因為 Docker 可能需要拉取
Open WebUI 映像，而 Open WebUI 也可能需要完成自己的冷啟動設定。
此 lane 需要可用的即時模型金鑰。請透過程序
環境、已暫存的驗證設定檔，或明確的 `OPENCLAW_PROFILE_FILE` 提供。
成功執行會列印小型 JSON 酬載，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意保持決定性的，且不需要
真實的 Telegram、Discord 或 iMessage 帳號。它會啟動一個已植入資料的閘道
容器，啟動第二個容器來 spawn `openclaw mcp serve`，然後
驗證已路由對話探索、逐字稿讀取、附件 metadata、
即時事件佇列行為、對外傳送路由，以及透過真實 stdio MCP 橋接器傳遞的 Claude 風格通道 +
權限通知。通知檢查會直接檢查原始 stdio MCP frame，因此煙霧測試會驗證
橋接器實際發出的內容，而不只是特定 client SDK 剛好公開的內容。
`test:docker:agent-bundle-mcp-tools` 是決定性的，且不需要即時
模型金鑰。它會建置 repo Docker 映像，在容器內啟動真實 stdio MCP 探測伺服器，
透過內嵌的 OpenClaw bundle
MCP 執行階段具現化該伺服器，執行工具，然後驗證 `coding` 和 `messaging` 會保留
`bundle-mcp` 工具，而 `minimal` 與 `tools.deny: ["bundle-mcp"]` 會將其篩除。
`test:docker:cron-mcp-cleanup` 是決定性的，且不需要即時模型
金鑰。它會啟動一個已植入資料、並具備真實 stdio MCP 探測伺服器的閘道，執行
隔離的排程 turn 與一個 `sessions_spawn` 一次性子 turn，然後驗證
MCP 子程序會在每次執行後結束。

手動 ACP 白話 thread 煙霧測試（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 請保留此 script 供迴歸/除錯工作流程使用。ACP thread 路由驗證日後可能再次需要它，因此不要刪除。

實用環境變數：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` 會先掛載並 source，然後再執行測試
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` source 的環境變數，使用臨時設定/工作區目錄，且不掛載外部命令列介面驗證
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，供 Docker 內快取命令列介面安裝
- `$HOME` 下的外部命令列介面驗證目錄/檔案會以唯讀方式掛載到 `/host-auth...` 下，然後在測試開始前複製到 `/home/node/...`
  - 預設目錄：`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮小範圍的提供者執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要目錄/檔案
  - 可使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或逗號清單如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於篩選容器內提供者
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 可在不需要重新建置的重跑中重用既有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保認證來自 profile store（而非 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇閘道為 Open WebUI 煙霧測試公開的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI 煙霧測試使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫固定的 Open WebUI 映像 tag

## 文件健全性

文件編輯後請執行文件檢查：`pnpm check:docs`。
當你也需要頁內 heading 檢查時，請執行完整 Mintlify anchor 驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI 安全）

這些是不使用真實提供者的「真實 pipeline」迴歸：

- 閘道工具呼叫（mock OpenAI，真實閘道 + agent loop）：`src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- 閘道 wizard（WS `wizard.start`/`wizard.next`，寫入設定 + 強制驗證）：`src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent 可靠性評估（Skills）

我們已經有一些 CI 安全測試，其行為類似「agent 可靠性評估」：

- 透過真實閘道 + agent loop 進行 mock 工具呼叫（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與設定效果的端對端 wizard flow（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **決策：**當 prompt 中列出 Skills 時，agent 是否會選擇正確的 skill（或避開不相關的 skill）？
- **合規：**agent 是否會在使用前讀取 `SKILL.md`，並遵循必要步驟/args？
- **工作流程合約：**多 turn 情境，用於斷言工具順序、session history carryover 與 sandbox 邊界。

未來評估應先保持決定性：

- 使用 mock 提供者的情境 runner，用於斷言工具呼叫 + 順序、skill 檔案讀取，以及 session wiring。
- 一小組聚焦於 skill 的情境（使用 vs 避免、gate、prompt injection）。
- 選用即時評估（opt-in、env-gated）僅在 CI 安全套件到位後再加入。

## 合約測試（外掛與通道 shape）

合約測試會驗證每個已註冊的外掛與通道是否符合其
介面合約。它們會逐一處理所有已探索的外掛，並執行一組
shape 與行為斷言。預設的 `pnpm test` unit lane 會刻意
略過這些共享接縫與煙霧測試檔；當你觸碰共享通道或提供者 surface 時，
請明確執行合約命令。

### 命令

- 所有合約：`pnpm test:contracts`
- 僅通道合約：`pnpm test:contracts:channels`
- 僅提供者合約：`pnpm test:contracts:plugins`

### 通道合約

位於 `src/channels/plugins/contracts/*.contract.test.ts`：

- **外掛** - 基本外掛 shape（id、name、capabilities）
- **設定** - 設定 wizard 合約
- **session-binding** - Session binding 行為
- **outbound-payload** - 訊息酬載結構
- **inbound** - 傳入訊息處理
- **actions** - 通道 action handlers
- **threading** - Thread ID 處理
- **directory** - Directory/roster API
- **group-policy** - 群組政策強制執行

### 提供者狀態合約

位於 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 通道狀態探測
- **registry** - 外掛 registry shape

### 提供者合約

位於 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 驗證 flow 合約
- **auth-choice** - 驗證 choice/selection
- **catalog** - 模型 catalog API
- **discovery** - 外掛探索
- **loader** - 外掛載入
- **runtime** - 提供者執行階段
- **shape** - 外掛 shape/interface
- **wizard** - 設定 wizard

### 何時執行

- 變更 plugin-sdk exports 或 subpaths 後
- 新增或修改通道或提供者外掛後
- 重構外掛註冊或探索後

合約測試會在 CI 中執行，且不需要真實 API 金鑰。

## 新增迴歸（指引）

當你修復在即時環境中發現的提供者/模型問題時：

- 盡可能新增 CI 安全迴歸（mock/stub 提供者，或擷取精確的 request-shape 轉換）
- 如果它本質上只能即時測試（rate limits、auth policies），請保持即時測試範圍狹窄，並透過 env vars opt-in
- 偏好鎖定能抓到 bug 的最小層級：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI-safe gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class 推導一個抽樣 target，然後斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增新的 `includeInPlan` SecretRef target family，請更新該測試中的 `classifyTargetClass`。該測試會刻意在未分類 target ids 上失敗，因此新的 class 無法被靜默跳過。

## 相關

- [測試即時環境](/zh-TW/help/testing-live)
- [測試更新與外掛](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
