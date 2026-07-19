---
read_when:
    - 執行即時模型矩陣／命令列介面後端／ACP／媒體提供者的冒煙測試
    - 偵錯即時測試認證資訊解析
    - 新增供應商專屬的即時測試
sidebarTitle: Live tests
summary: 即時（涉及網路連線）測試：模型矩陣、命令列介面後端、ACP、媒體供應商、認證資訊
title: 測試：即時測試套件
x-i18n:
    generated_at: "2026-07-19T13:46:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b6330c4f17081429d48ff2a47b48b0a0133555c835a17cea5edf5d1f880d91e
    source_path: help/testing-live.md
    workflow: 16
---

若要瞭解快速入門、QA 執行器、單元／整合測試套件及 Docker 流程，請參閱
[測試](/zh-TW/help/testing)。本頁涵蓋**即時**（會存取網路的）測試：
模型矩陣、命令列介面後端、ACP、媒體供應商及認證資訊處理。

## 即時測試與你的實際閘道

即時測試套件及臨時冒煙測試絕不能干擾已在
處理實際流量的閘道（無論是你的或其他操作者的）：

- 使用你自己的閘道：使用程序內閘道（下方第 2 層），或以隔離的狀態目錄（`OPENCLAW_STATE_DIR=<scratch>`）及
  可用的連接埠啟動開發執行個體。當實際閘道正在使用預設閘道
  連接埠（18789）時，請勿繫結該連接埠。
- 請勿對非本工作階段所啟動的服務執行 `openclaw gateway stop`/`restart`（或 `launchctl`/`systemctl`/tmux
  的等效操作）——那是操作者的即時執行個體。請先取得明確核准。
- 需要逼真的資料嗎？將即時狀態／資料庫複製到你的開發狀態目錄，並針對
  該副本進行測試。就地遷移即時閘道的狀態也需要
  明確核准。

## 即時：本機冒煙測試命令

執行臨時即時檢查前，請先在程序環境中匯出所需的供應商金鑰。

安全的媒體冒煙測試：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw 即時冒煙測試。" \
  --output /tmp/openclaw-live-smoke.mp3
```

安全的語音通話就緒冒煙測試：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

除非也提供 `--yes`，否則 `voicecall smoke` 只會試執行；僅在你確實要撥打真實電話時
使用 `--yes`。對 Twilio、Telnyx 及 Plivo 而言，
成功的就緒檢查需要公開的網路鉤子 URL——本機／私人
回送 URL 會遭拒絕，因為這些供應商無法連線至此類 URL。

## 即時：Android 節點功能全面測試

- 測試：`src/gateway/android-node.capabilities.live.test.ts`
- 指令碼：`pnpm android:test:integration`
- 目標：叫用已連線 Android 節點**目前公告的每個命令**，並斷言命令契約行為。
- 範圍：
  - 需預先準備／手動設定（測試套件不會安裝、執行或配對應用程式）。
  - 逐一驗證所選 Android 節點的閘道 `node.invoke`。
- 必要的預先設定：
  - Android 應用程式已連線並配對至閘道。
  - 應用程式保持在前景。
  - 已針對預期通過的功能授予權限／擷取同意。
- 選用的目標覆寫：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整的 Android 設定詳情：[Android 應用程式](/zh-TW/platforms/android)

## 即時：模型冒煙測試（設定檔金鑰）

即時模型測試分為兩層，以便隔離失敗原因：

- 「直接模型」可確認供應商／模型使用指定金鑰時能否正常回應。
- 「閘道冒煙測試」可確認該模型的完整閘道與代理程式流水線是否正常運作（工作階段、歷程記錄、工具、沙箱原則等）。

下方精選模型清單位於 `src/agents/live-model-filter.ts`，
並會隨時間變更；請以該處的陣列為準，而非本頁。

MiniMax M3 使用 `minimax/MiniMax-M3` 作為其預設供應商／模型參照。

### 第 1 層：直接模型補全（無閘道）

- 測試：`src/agents/models.profiles.live.test.ts`
- 目標：
  - 列舉已探索到的模型
  - 使用 `getApiKeyForModel` 選取你擁有認證資訊的模型
  - 對每個模型執行小型補全（並在需要時執行針對性的迴歸測試）
- 啟用方式：
  - `pnpm test:live`（若直接叫用 Vitest，則使用 `OPENCLAW_LIVE_TEST=1`）
  - 設定 `OPENCLAW_LIVE_MODELS=modern`、`small` 或 `all`（`modern` 的別名）才會實際執行此測試套件；否則會略過，因此單獨使用 `pnpm test:live` 時仍會專注於閘道冒煙測試。
- 選取模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 會執行精選的高訊號優先清單（請參閱[即時：模型矩陣](#live-model-matrix-what-we-cover)）
  - `OPENCLAW_LIVE_MODELS=small` 會執行精選的小型模型優先清單
  - `OPENCLAW_LIVE_MODELS=all` 是 `modern` 的別名
  - 或使用 `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."`（逗號分隔的允許清單）
  - 本機 Ollama 小型模型執行預設使用 `http://127.0.0.1:11434`；僅針對區域網路、自訂或 Ollama Cloud 端點設定 `OPENCLAW_LIVE_OLLAMA_BASE_URL`。
  - 現代／全部及小型全面測試預設以其精選清單長度為上限；設定 `OPENCLAW_LIVE_MAX_MODELS=0` 可對所選設定檔執行完整全面測試，或設定正數以採用較小的上限。
  - 完整全面測試使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作為整個直接模型測試的逾時。預設值：60 分鐘。
  - 直接模型探測預設以 20 路平行方式執行；設定 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 可覆寫此值。
- 選取供應商的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗號分隔的允許清單）
- 金鑰來源：
  - 預設：設定檔儲存區及環境後援
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制僅使用**設定檔儲存區**
- 存在此測試的原因：
  - 將「供應商 API 故障／金鑰無效」與「閘道代理程式流水線故障」區分開來
  - 包含小型且隔離的迴歸測試（例如：OpenAI Responses／Codex Responses 推理重播與工具呼叫流程）

### 第 2 層：閘道與開發代理程式冒煙測試（「@openclaw」實際執行的內容）

- 測試：`src/gateway/gateway-models.profiles.live.test.ts`
- 目標：
  - 啟動程序內閘道
  - 建立／修補 `agent:dev:*` 工作階段（每次執行可覆寫模型）
  - 逐一測試具有金鑰的模型，並斷言：
    - 「有意義的」回應（不使用工具）
    - 實際工具叫用可正常運作（讀取探測）
    - 選用的額外工具探測（執行與讀取探測）
    - OpenAI 迴歸路徑（僅工具呼叫 -> 後續回應）持續正常運作
- 探測詳情（以便你迅速說明失敗原因）：
  - `read` 探測：測試會在工作區寫入一個隨機碼檔案，並要求代理程式使用 `read` 讀取該檔案，再回傳隨機碼。
  - `exec+read` 探測：測試會要求代理程式使用 `exec` 將隨機碼寫入暫存檔案，接著使用 `read` 將其讀回。
  - 圖片探測：測試會附加產生的 PNG（貓咪 + 隨機代碼），並預期模型傳回 `cat <CODE>`。
  - 實作參照：`src/gateway/gateway-models.profiles.live.test.ts` 及 `test/helpers/live-image-probe.ts`。
- 啟用方式：
  - `pnpm test:live`（若直接叫用 Vitest，則使用 `OPENCLAW_LIVE_TEST=1`）
- 選取模型的方式：
  - 預設：精選的高訊號（`modern`）優先清單
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` 會透過完整的閘道與代理程式流水線執行精選的小型模型清單
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 `modern` 的別名
  - 或設定 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗號分隔清單）以縮小範圍
  - 現代／全部及小型閘道全面測試預設以其精選清單長度為上限；設定 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可對所選項目執行完整全面測試，或設定正數以採用較小的上限。
- 選取供應商的方式（避免「所有項目都使用 OpenRouter」）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗號分隔的允許清單）
- 此即時測試一律啟用工具與圖片探測：
  - `read` 探測 + `exec+read` 探測（工具壓力測試）
  - 模型公告支援圖片輸入時，會執行圖片探測
  - 流程（概要）：
    - 測試會產生含有「CAT」+ 隨機代碼的小型 PNG（`test/helpers/live-image-probe.ts`）
    - 透過 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 傳送該圖片
    - 閘道將附件剖析為 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 內嵌代理程式將多模態使用者訊息轉送至模型
    - 斷言：回覆包含 `cat` + 該代碼（OCR 容錯：允許少量錯誤）

<Tip>
若要查看你的機器可測試哪些項目（以及確切的 `provider/model` ID），請執行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 即時：命令列介面後端冒煙測試（Claude、Gemini 或其他本機命令列介面）

- 測試：`src/gateway/gateway-cli-backend.live.test.ts`
- 目標：使用本機命令列介面後端驗證閘道與代理程式流水線，且不變更你的預設設定。
- 後端專屬的冒煙測試預設值與所屬外掛的 `cli-backend.ts` 定義放在一起。
- 啟用：
  - `pnpm test:live`（若直接叫用 Vitest，則使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 預設值：
  - 預設供應商／模型：`claude-cli/claude-sonnet-4-6`
  - 命令／引數／圖片行為來自所屬命令列介面後端外掛的中繼資料。
- 覆寫（選用）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`：傳送實際圖片附件（路徑會插入提示中）。Docker 配方預設為關閉。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`：將圖片檔案路徑作為命令列介面引數傳遞，而非插入提示。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）：設定 `IMAGE_ARG` 時，控制圖片引數的傳遞方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`：傳送第二輪訊息並驗證續接流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`：當所選模型支援切換目標時，選擇加入 Claude Sonnet -> Opus 同工作階段連續性探測。預設為關閉，Docker 配方亦同。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`：選擇加入 MCP／工具迴送探測。Docker 配方預設為關閉。

範例：

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低成本的 Gemini MCP 設定冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

此測試不會要求 Gemini 產生回應。它會寫入 OpenClaw 提供給 Gemini 的相同系統
設定，接著執行 `gemini --debug mcp list`，以證明已儲存的
`transport: "streamable-http"` 伺服器會正規化為 Gemini 的 HTTP MCP
格式，並可連線至本機可串流 HTTP MCP 伺服器。

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

單一供應商 Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

注意事項：

- Docker 執行器位於 `scripts/test-live-cli-backend-docker.sh`。
- 它會以非 root 的 `node` 使用者身分，在儲存庫 Docker 映像內執行即時命令列介面後端冒煙測試。
- 它會從所屬外掛解析命令列介面冒煙測試中繼資料，接著將相符的 Linux 命令列介面套件（`@anthropic-ai/claude-code` 或 `@google/gemini-cli`）安裝至 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 中已快取且可寫入的前綴（預設：`~/.cache/openclaw/docker-cli-tools`）。
- `codex-cli` 已不再是內建的命令列介面後端；請改用 `openai/*` 搭配 Codex app-server 執行階段（請參閱[即時：Codex app-server 測試框架冒煙測試](#live-codex-app-server-harness-smoke)）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要透過 `~/.claude/.credentials.json` 搭配 `claudeAiOauth.subscriptionType`，或使用來自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`，提供可攜式 Claude Code 訂閱 OAuth。它會先在 Docker 中驗證直接 `claude -p`，接著執行兩次閘道命令列介面後端回合，且不保留 Anthropic API 金鑰環境變數。此訂閱測試通道預設會停用 Claude MCP／工具與影像探測，因為這些探測會耗用已登入訂閱的使用限額，而且 Anthropic 可能在 OpenClaw 未發布新版本的情況下，變更 Claude Agent SDK／`claude -p` 的計費與速率限制行為。
- Claude 與 Gemini 可透過上述旗標支援相同的探測組合（文字回合、影像分類、MCP `cron` 工具呼叫、模型切換連續性），但這些探測預設都不會執行，請視需要透過個別旗標選擇啟用。

## 即時：APNs HTTP/2 Proxy 可連線性

- 測試：`src/infra/push-apns-http2.live.test.ts`
- 目標：透過本機 HTTP CONNECT Proxy 建立通往 Apple 沙箱 APNs 端點的通道、傳送 APNs HTTP/2 驗證要求，並確認 Apple 實際的 `403 InvalidProviderToken` 回應會經由 Proxy 路徑傳回。
- 啟用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 選用逾時：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 即時：ACP 繫結冒煙測試（`/acp spawn ... --bind here`）

- 測試：`src/gateway/gateway-acp-bind.live.test.ts`
- 目標：使用即時 ACP 代理程式驗證實際的 ACP 對話繫結流程：
  - 傳送 `/acp spawn <agent> --bind here`
  - 就地繫結合成的訊息頻道對話
  - 在同一對話中傳送一般後續訊息
  - 驗證後續訊息已寫入繫結的 ACP 工作階段逐字稿
- 啟用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 預設值：
  - Docker 中的 ACP 代理程式：`claude,codex,gemini`
  - 用於直接 `pnpm test:live ...` 的 ACP 代理程式：`claude`
  - 合成頻道：Slack 私訊形式的對話情境
  - ACP 後端：`acpx`
- 覆寫：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1`（或 `on`/`true`/`yes`）可強制啟用影像探測；任何其他值都會強制停用。除 `opencode` 外，所有代理程式預設都會執行。
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- 注意事項：
  - 此測試通道使用閘道 `chat.send` 介面與僅限管理員使用的合成來源路由欄位，讓測試能附加訊息頻道情境，而不必假裝向外部遞送訊息。
  - 未設定 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 時，測試會使用內嵌 `acpx` 外掛的內建代理程式登錄檔，取得所選 ACP 測試框架代理程式。
  - 繫結工作階段的排程 MCP 建立預設為盡力而為，因為外部 ACP 測試框架可能會在繫結／影像驗證通過後取消 MCP 呼叫；設定 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可將該繫結後排程探測設為嚴格模式。

範例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 操作方式：

```bash
pnpm test:docker:live-acp-bind
```

單一代理程式 Docker 操作方式：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 注意事項：

- Docker 執行器位於 `scripts/test-live-acp-bind-docker.sh`。
- 預設會依序針對彙總的即時命令列介面代理程式執行 ACP 繫結冒煙測試：`claude`、`codex`，接著是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 可縮小矩陣範圍。
- 它會將相符的命令列介面驗證材料暫存至容器，接著在缺少時安裝所要求的即時命令列介面（`@anthropic-ai/claude-code`、`@openai/codex`、透過 `https://app.factory.ai/cli` 安裝的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 後端本身是來自官方 `acpx` 外掛的內嵌 `acpx/runtime` 套件。
- Droid Docker 變體會暫存 `~/.factory` 以供設定使用、轉送 `FACTORY_API_KEY`，且必須提供該 API 金鑰，因為本機 Factory OAuth／鑰匙圈驗證無法移植至容器。它使用 ACPX 內建的 `droid exec --output-format acp` 登錄項目。
- OpenCode Docker 變體是嚴格的單一代理程式迴歸測試通道。它會使用 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（預設為 `opencode/kimi-k2.6`）寫入暫時的 `OPENCODE_CONFIG_CONTENT` 預設模型。
- 直接呼叫 `acpx` 命令列介面僅是手動／因應措施路徑，用於比較閘道外部的行為。Docker ACP 繫結冒煙測試會執行 OpenClaw 內嵌的 `acpx` 執行階段後端。

## 即時：Codex app-server 測試框架冒煙測試

- 目標：透過一般閘道
  `agent` 方法驗證外掛所擁有的 Codex 測試框架：
  - 載入內建的 `codex` 外掛
  - 透過 `/model <ref> --runtime codex` 選取 OpenAI 模型
  - 以要求的思考層級傳送第一個閘道代理程式回合
  - 向同一個 OpenClaw 工作階段傳送第二個回合，並驗證 app-server
    執行緒可以繼續
  - 透過相同的閘道命令
    路徑執行 `/codex status` 與 `/codex models`
  - 選擇性執行兩項經 Guardian 審查且提升權限的 Shell 探測：一項應獲核准的無害
    命令，以及一項應遭
    拒絕、使代理程式回頭詢問的假密鑰上傳
- 測試：`src/gateway/gateway-codex-harness.live.test.ts`
- 啟用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 測試框架基準模型：`openai/gpt-5.6-luna`
- 全新 OpenAI API 金鑰選取預設值：`openai/gpt-5.6`
- 預設思考：`low`
- 模型覆寫：`OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- 思考覆寫：`OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- 非預設模型的推理強度斷言：
  `OPENCLAW_LIVE_CODEX_HARNESS_EXPECTED_EFFORT=<level>`
- 矩陣覆寫：`OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- 驗證模式：`OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth`（預設）使用
  複製的 Codex 登入；`api-key` 透過 Codex app-server 使用 `OPENAI_API_KEY`。
- 選用影像探測：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 選用 MCP／工具探測：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 選用 Guardian 探測：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 選用的繼續壓力測試：`OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1` 會新增
  四個歷史回合，接著關閉並重新啟動閘道與 Codex app-server
  三次，同時要求維持相同的原生執行緒 ID 與對話
  歷史記錄。可使用
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_HISTORY_TURNS`（1-20）與
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_RESTARTS`（1-10）覆寫有界次數。
- 選用的扇出壓力測試：設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1`
  與 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT`（1-12）。測試框架會同時啟動
  所有子項、等待每個終止執行完成，並驗證每個
  唯一的子項回覆與原生執行緒身分。
- 選用的壓縮壓力測試：`OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1`
  會產生有界的原生工具輸出、要求觸發自動壓縮事件、
  驗證持久保存的壓縮次數與隱藏標記回想能力、重新啟動
  閘道和實體 Codex app-server，接著重複輸出與
  壓縮波次。可使用
  `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS`（1-8）與
  `OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES`（100000-1000000）調整有界工作量。
- 選用的迴圈轉送選擇停用探測：
  `OPENCLAW_LIVE_CODEX_HARNESS_DISABLE_LOOP_RELAY=1`
- 要求的思考偏好可能會對應至 Codex 為該模型公布的最接近推理強度。
  例如，Luna 會將 `minimal` 對應至 `low`。
- 已知的 Codex 目錄模型會自動衍生該確切的原生推理強度。
  未知的模型覆寫必須陳述預期對應的推理強度。
- 此冒煙測試會強制使用提供者／模型 `agentRuntime.id: "codex"`，避免損壞的 Codex
  測試框架透過靜默後援至 OpenClaw 而通過測試。
- 驗證：使用本機 Codex 訂閱登入的 Codex app-server 驗證，或在
  `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` 時使用 `OPENAI_API_KEY`。Docker 可
  複製 `~/.codex/auth.json` 與 `~/.codex/config.toml` 以執行訂閱測試。

本機操作方式：

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 操作方式：

```bash
pnpm test:docker:live-codex-harness
```

重新啟動與歷史記錄壓力測試：

```bash
OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
pnpm test:docker:live-codex-harness
```

扇出、大型輸出、壓縮與重新啟動壓力測試：

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT=8 \
  OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1 \
  pnpm test:docker:live-codex-harness
```

GPT-5.6 原生 Codex 矩陣：

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

全新 OpenAI API 金鑰預設值：

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

此驗證會讓 `OPENCLAW_LIVE_GATEWAY_MODELS` 保持未設定狀態、透過
全新的初始設定推論選取接縫解析模型、斷言 `openai/gpt-5.6`，接著
使用該解析出的模型執行實際的閘道回合。

GPT-5.6 內嵌 OpenClaw 矩陣：

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker 注意事項：

- Docker 執行器位於 `scripts/test-live-codex-harness-docker.sh`。
- 它會傳遞 `OPENAI_API_KEY`，在 Codex CLI 驗證檔案存在時複製這些檔案，將
  `@openai/codex` 安裝到可寫入且已掛載的 npm
  前綴中、暫存原始碼樹，然後只執行 Codex 測試框架的即時測試。
- Docker 預設會啟用映像、MCP／工具及 Guardian 探測。需要縮小偵錯
  執行範圍時，請設定 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的明確 Codex 執行階段設定，因此舊版別名或 OpenClaw
  備援機制無法掩蓋 Codex 測試框架的迴歸。
- 矩陣目標會在單一容器中依序執行。Docker 指令碼會依目標數量調整其
  預設 35 分鐘逾時；任何外層殼層或 CI 逾時都必須允許相同的總時間。標準 CI 會將每個 GPT-5.6 目標置於不同分片中。

### 建議的即時測試配方

範圍小且明確的允許清單最快，也最不容易出現不穩定情況：

- 單一模型，直接連線（不經閘道）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型模型直接連線設定檔：
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型模型閘道設定檔：
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API 冒煙測試：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 單一模型，閘道冒煙測試：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多個供應商的工具呼叫：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 直接連線冒煙測試：
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google 重點測試（Gemini API 金鑰 + Antigravity）：
  - Gemini（API 金鑰）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 自適應思考冒煙測試（來自私人 QA 命令列介面的 `qa manual`——需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` 和原始碼簽出；請參閱 [QA 概覽](/zh-TW/concepts/qa-e2e-automation)）：
  - Gemini 3 動態預設值：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動態預算：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注意事項：

- `google/...` 使用 Gemini API（API 金鑰）。
- `google-antigravity/...` 使用 Antigravity OAuth 橋接器（Cloud Code Assist 風格的代理程式端點）。
- `google-gemini-cli/...` 使用你電腦上的本機 Gemini CLI（有獨立的驗證方式與工具特性）。
- Gemini API 與 Gemini CLI：
  - API：OpenClaw 透過 HTTP 呼叫 Google 託管的 Gemini API（API 金鑰／設定檔驗證）；這是大多數使用者所指的「Gemini」。
  - CLI：OpenClaw 透過殼層呼叫本機 `gemini` 二進位檔；它有自己的驗證方式，且行為可能有所不同（串流／工具支援／版本落差）。

## 即時測試：模型矩陣（涵蓋範圍）

即時測試須選擇啟用，因此沒有固定的「CI 模型清單」。`OPENCLAW_LIVE_MODELS=modern`／`OPENCLAW_LIVE_GATEWAY_MODELS=modern`（以及其 `all` 別名）會依下列優先順序，執行 `src/agents/live-model-filter.ts` 中 `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` 所定義的精選優先清單：

| 供應商／模型                                  | 注意事項   |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k3`                            |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

精選的**小型模型**清單（`OPENCLAW_LIVE_MODELS=small`／`OPENCLAW_LIVE_GATEWAY_MODELS=small`）來自 `SMALL_LIVE_MODEL_PRIORITY`：

| 供應商／模型                  |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

現代模型清單的注意事項：

- `codex` 和 `codex-cli` 供應商不包含在預設的現代模型巡檢中（它們涵蓋 CLI 後端／ACP 行為，已於上方另行測試）。`openai/gpt-5.5` 本身預設會透過 Codex app-server 測試框架進行路由；請參閱[即時測試：Codex app-server 測試框架冒煙測試](#live-codex-app-server-harness-smoke)。
- `fireworks`、`google`、`openrouter` 和 `xai` 在現代模型巡檢中只會執行其明確精選的模型 ID（不會自動展開為「此供應商的每個模型」）。
- 在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少納入一個支援映像的模型（Claude／Gemini／OpenAI 系列視覺變體等），以執行映像探測。

針對手動挑選的跨供應商集合，透過閘道執行包含工具與映像的冒煙測試：

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

精選清單以外的選用額外涵蓋範圍（有則更佳，請挑選一個已啟用且支援「工具」的模型）：

- Mistral：`mistral/...`
- Cerebras：`cerebras/...`（若你有存取權）
- LM Studio：`lmstudio/...`（本機；工具呼叫取決於 API 模式）

### 彙整服務／替代閘道

若已啟用金鑰，也可以透過下列服務進行測試：

- OpenRouter：`openrouter/...`（數百個模型；使用 `openclaw models scan` 尋找支援工具與映像的候選模型）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（透過 `OPENCODE_API_KEY`／`OPENCODE_ZEN_API_KEY` 驗證）

可納入即時測試矩陣的更多供應商（若你有認證資訊／設定）：

- 內建：`anthropic`、`cerebras`、`github-copilot`、`google`、`google-antigravity`、`google-gemini-cli`、`google-vertex`、`groq`、`mistral`、`openai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`zai`
- 透過 `models.providers`（自訂端點）：`minimax`（雲端／API），以及任何與 OpenAI／Anthropic 相容的 Proxy（LM Studio、vLLM、LiteLLM 等）

<Tip>
請勿在文件中硬式編碼「所有模型」。權威清單是你電腦上 `discoverModels(...)` 所傳回的內容，再加上所有可用金鑰對應的模型。
</Tip>

## 認證資訊（切勿提交）

即時測試會以與命令列介面相同的方式探索認證資訊。實際影響如下：

- 如果命令列介面可正常運作，即時測試應能找到相同的金鑰。
- 如果即時測試顯示「無認證資訊」，請以偵錯 `openclaw models list`／模型選擇的相同方式進行偵錯。

- 個別代理程式的驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（這就是即時測試中「設定檔金鑰」的含義）
- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 舊版 OAuth 目錄：`~/.openclaw/credentials/`（存在時會複製到暫存的即時測試家目錄，但它不是主要的設定檔金鑰儲存區）
- 本機即時測試會將使用中的設定（移除 `agents.*.workspace`／`agentDir` 覆寫）以及每個代理程式的 `auth-profiles.json` 複製到暫存測試家目錄，而不會複製該代理程式目錄中的其餘內容，因此 `workspace/` 和 `sandboxes/` 資料永遠不會進入暫存家目錄；此外也會複製舊版 `credentials/` 目錄及支援的外部 CLI 驗證檔案／目錄（`.claude.json`、`.claude/.credentials.json`、`.claude/settings*.json`、`.claude/backups`、`.codex/auth.json`、`.codex/config.toml`、`.gemini`、`.minimax`）。

若要使用環境變數金鑰，請在本機測試前匯出，或使用下方的
Docker 執行器並明確指定 `OPENCLAW_PROFILE_FILE`。

## Deepgram 即時測試（音訊轉錄）

- 測試：`extensions/deepgram/audio.live.test.ts`
- 啟用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 程式設計方案即時測試

- 測試：`extensions/byteplus/live.test.ts`
- 啟用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 選用模型覆寫：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流程媒體即時測試

- 測試：`extensions/comfy/comfy.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 範圍：
  - 執行隨附的 comfy 映像、影片和 `music_generate` 路徑
  - 除非已設定 `plugins.entries.comfy.config.<capability>`，否則略過各項功能
  - 適用於變更 comfy 工作流程提交、輪詢、下載或外掛註冊之後

## 映像生成即時測試

- 測試：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 測試框架：`pnpm test:live:media image`
- 範圍：
  - 列舉所有已註冊的映像生成供應商外掛
  - 探測前先使用已匯出的供應商環境變數
  - 預設優先使用即時測試／環境變數 API 金鑰，而非已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真正的殼層認證資訊
  - 略過沒有可用驗證方式／設定檔／模型的供應商
  - 透過共用映像生成執行階段執行每個已設定的供應商：
    - `<provider>:generate`
    - 當供應商宣告支援編輯時執行 `<provider>:edit`
- 目前涵蓋的隨附供應商：
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 選用範圍縮減：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 選用驗證行為：
  - 使用 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 強制採用設定檔儲存區驗證，並忽略僅來自環境變數的覆寫

供已發布的命令列介面路徑使用時，請在供應商／執行階段即時測試
通過後，新增 `infer` 冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image \
  --prompt "最小化的扁平測試映像：白色背景上有一個藍色正方形，沒有文字。" \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

這涵蓋命令列介面引數剖析、設定／預設代理程式解析、隨附
外掛啟用、共用映像生成執行階段，以及即時供應商
要求。外掛相依套件應在載入執行階段前就已存在。

## 音樂生成即時測試

- 測試：`extensions/music-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media music`
- 範圍：
  - 測試共用的內建音樂生成供應商路徑
  - 目前涵蓋 `fal`、`google`、`minimax` 和 `openrouter`
  - 在探測前使用已匯出的供應商環境變數
  - 預設優先使用即時／環境 API 金鑰，而非已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真正的 shell 認證資訊
  - 略過沒有可用驗證／設定檔／模型的供應商
  - 在可用時執行兩種已宣告的執行階段模式：
    - `generate`，使用僅含提示詞的輸入
    - 供應商宣告 `capabilities.edit.enabled` 時執行 `edit`
  - `comfy` 有自己獨立的即時測試檔案，不屬於這個共用全面測試
- 選用的縮小範圍設定：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 選用的驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`，強制使用設定檔儲存區驗證並忽略僅限環境變數的覆寫

## 影片生成即時測試

- 測試：`extensions/video-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media video`
- 範圍：
  - 在 `alibaba`、`byteplus`、`deepinfra`、`fal`、`google`、`minimax`、`openai`、`openrouter`、`pixverse`、`qwen`、`runway`、`together`、`vydra`、`xai` 上測試共用的內建影片生成供應商路徑
  - 預設使用發布安全的冒煙測試路徑：每個供應商發出一個文字轉影片請求、使用一秒的龍蝦提示詞，以及採用 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 設定的各供應商操作上限（預設為 `180000`）
  - 預設略過 FAL，因為供應商端的佇列延遲可能主導發布時間；傳入 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`（或清除略過清單）即可明確執行
  - 在探測前使用已匯出的供應商環境變數
  - 預設優先使用即時／環境 API 金鑰，而非已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真正的 shell 認證資訊
  - 略過沒有可用驗證／設定檔／模型的供應商
  - 預設僅執行 `generate`
  - 設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，亦可在可用時執行已宣告的轉換模式：
    - 供應商宣告 `capabilities.imageToVideo.enabled`，且所選供應商／模型在共用全面測試中接受緩衝區支援的本機圖片輸入時，執行 `imageToVideo`
    - 供應商宣告 `capabilities.videoToVideo.enabled`，且所選供應商／模型在共用全面測試中接受緩衝區支援的本機影片輸入時，執行 `videoToVideo`
  - 共用全面測試中目前已宣告但略過的 `imageToVideo` 供應商：
    - `vydra`（此測試路徑不支援緩衝區支援的本機圖片輸入）
  - Vydra 供應商特定涵蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 該檔案會執行 `veo3` 文字轉影片，以及一個 `kling` 圖片轉影片測試路徑；後者預設使用遠端圖片 URL 測試資料（可用 `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` 覆寫）。
  - xAI 供應商特定涵蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - 經典案例會生成一張正方形的本機 PNG 作為第一影格、省略幾何設定、請求一秒的圖片轉影片短片、輪詢至完成，並驗證下載的緩衝區。
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - 1.5 案例會生成一張本機 PNG 作為第一影格、請求一秒的 1080P 圖片轉影片短片、輪詢至完成，並驗證下載的緩衝區。
  - 目前的 `videoToVideo` 即時測試涵蓋範圍：
    - 僅當所選模型解析為 `gen4_aleph` 時執行 `runway`
  - 共用全面測試中目前已宣告但略過的 `videoToVideo` 供應商：
    - `alibaba`、`google`、`openai`、`qwen`、`xai`，因為這些路徑目前需要遠端 `http(s)` 參照 URL，而非緩衝區支援的本機輸入
- 選用的縮小範圍設定：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`，在預設全面測試中納入所有供應商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`，降低各供應商的操作上限，以執行積極的冒煙測試
- 選用的驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`，強制使用設定檔儲存區驗證並忽略僅限環境變數的覆寫

## 媒體即時測試框架

- 命令：`pnpm test:live:media`
- 進入點：`test/e2e/qa-lab/media/hosted-media-provider-live.ts`，它會針對每個所選測試套件執行 `pnpm test:live -- <suite-test-file>`，使心跳偵測與安靜模式行為和其他 `pnpm test:live` 執行保持一致。
- 用途：
  - 透過單一儲存庫原生進入點執行共用的圖片、音樂與影片即時測試套件
  - 從 `~/.profile` 自動載入缺少的供應商環境變數
  - 預設會將各測試套件自動縮小至目前具有可用驗證的供應商
- 旗標：
  - `--providers <csv>` 是全域供應商篩選器；`--image-providers`／`--music-providers`／`--video-providers` 將篩選器範圍限制於單一測試套件
  - `--all-providers` 略過以驗證為基礎的自動篩選
  - 篩選後沒有可執行的供應商時，`--allow-empty` 會以 `0` 結束
  - `--quiet`／`--no-quiet` 會傳遞至 `test:live`
- 範例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相關內容

- [測試](/zh-TW/help/testing) - 單元、整合、QA 與 Docker 測試套件
