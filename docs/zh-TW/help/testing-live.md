---
read_when:
    - 執行即時模型矩陣／命令列介面後端／ACP／媒體供應商冒煙測試
    - 偵錯即時測試認證資訊解析
    - 新增供應商專用的即時測試
sidebarTitle: Live tests
summary: 即時（涉及網路連線）測試：模型矩陣、命令列介面後端、ACP、媒體提供者、認證資訊
title: 測試：即時測試套件
x-i18n:
    generated_at: "2026-07-12T14:32:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

如需快速入門、QA 執行器、單元／整合測試套件及 Docker 流程，請參閱
[測試](/zh-TW/help/testing)。本頁涵蓋**即時**（會連線至網路）測試：
模型矩陣、命令列介面後端、ACP、媒體提供者，以及認證資訊處理。

## 即時：本機冒煙測試命令

執行臨時即時檢查前，請先在程序環境中匯出所需的提供者金鑰。

安全的媒體冒煙測試：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw 即時冒煙測試。" \
  --output /tmp/openclaw-live-smoke.mp3
```

安全的語音通話就緒狀態冒煙測試：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

除非同時提供 `--yes`，否則 `voicecall smoke` 只會進行試執行；只有在
你確實要撥打真實電話時才使用 `--yes`。對 Twilio、Telnyx 和 Plivo 而言，
就緒狀態檢查若要成功，必須提供公開的網路鉤子 URL；系統會拒絕本機／私人
回送 URL，因為這些提供者無法連線至這類 URL。

## 即時：Android 節點功能全面測試

- 測試：`src/gateway/android-node.capabilities.live.test.ts`
- 指令碼：`pnpm android:test:integration`
- 目標：叫用已連線 Android 節點**目前公告的每個命令**，並對命令契約行為進行斷言。
- 範圍：
  - 預先準備／手動設定（此測試套件不會安裝、執行或配對應用程式）。
  - 對所選 Android 節點逐一執行命令的閘道 `node.invoke` 驗證。
- 必要的前置設定：
  - Android 應用程式已連線至閘道並完成配對。
  - 應用程式保持在前景。
  - 已針對你預期通過的功能授予權限／擷取同意。
- 選用的目標覆寫：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 設定詳細資料：[Android 應用程式](/zh-TW/platforms/android)

## 即時：模型冒煙測試（設定檔金鑰）

即時模型測試分成兩層，以便隔離失敗原因：

- 「直接模型」會告訴你，提供者／模型使用指定金鑰時是否完全能夠回應。
- 「閘道冒煙測試」會告訴你，該模型的完整閘道＋代理程式管線是否正常運作（工作階段、歷程記錄、工具、沙箱原則等）。

以下精選模型清單位於 `src/agents/live-model-filter.ts`，且會隨時間變更；
請將其中的陣列視為事實來源，而非本頁。

MiniMax M3 使用 `minimax/MiniMax-M3` 作為預設提供者／模型參照。

### 第 1 層：直接模型補全（無閘道）

- 測試：`src/agents/models.profiles.live.test.ts`
- 目標：
  - 列舉探索到的模型
  - 使用 `getApiKeyForModel` 選取你擁有認證資訊的模型
  - 對每個模型執行小型補全（並在需要時執行針對性的迴歸測試）
- 啟用方式：
  - `pnpm test:live`（若直接叫用 Vitest，則使用 `OPENCLAW_LIVE_TEST=1`）
  - 設定 `OPENCLAW_LIVE_MODELS=modern`、`small` 或 `all`（`modern` 的別名）才會實際執行此測試套件；否則會略過，因此單獨執行 `pnpm test:live` 時仍會聚焦於閘道冒煙測試。
- 選取模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 會執行精選的高訊號優先清單（請參閱[即時：模型矩陣](#live-model-matrix-what-we-cover)）
  - `OPENCLAW_LIVE_MODELS=small` 會執行精選的小型模型優先清單
  - `OPENCLAW_LIVE_MODELS=all` 是 `modern` 的別名
  - 或使用 `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."`（以逗號分隔的允許清單）
  - 本機 Ollama 小型模型執行預設使用 `http://127.0.0.1:11434`；只有 LAN、自訂或 Ollama Cloud 端點才需設定 `OPENCLAW_LIVE_OLLAMA_BASE_URL`。
  - Modern/all 和 small 全面測試預設以各自精選清單的長度作為上限；設定 `OPENCLAW_LIVE_MAX_MODELS=0` 可對所選設定檔進行完整全面測試，或設為正數以使用較小的上限。
  - 完整全面測試使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作為整個直接模型測試的逾時時間。預設值：60 分鐘。
  - 直接模型探測預設以 20 路並行執行；可設定 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 來覆寫。
- 選取提供者的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（以逗號分隔的允許清單）
- 金鑰來源：
  - 預設：設定檔儲存區及環境後援
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以強制**僅使用設定檔儲存區**
- 存在原因：
  - 將「提供者 API 損壞／金鑰無效」與「閘道代理程式管線損壞」區分開來
  - 包含小型、隔離的迴歸測試（例如：OpenAI Responses/Codex Responses 推理重播＋工具呼叫流程）

### 第 2 層：閘道＋開發代理程式冒煙測試（「@openclaw」實際執行的內容）

- 測試：`src/gateway/gateway-models.profiles.live.test.ts`
- 目標：
  - 啟動程序內閘道
  - 建立／修補 `agent:dev:*` 工作階段（每次執行覆寫模型）
  - 逐一處理具有金鑰的模型並斷言：
    - 「有意義的」回應（不使用工具）
    - 真實工具叫用可正常運作（讀取探測）
    - 選用的額外工具探測（執行＋讀取探測）
    - OpenAI 迴歸路徑（僅工具呼叫 -> 後續處理）持續正常運作
- 探測詳細資料（方便你快速說明失敗原因）：
  - `read` 探測：測試會在工作區中寫入包含隨機碼的檔案，並要求代理程式 `read` 該檔案，再回傳該隨機碼。
  - `exec+read` 探測：測試會要求代理程式透過 `exec` 將隨機碼寫入暫存檔，然後再 `read` 回來。
  - 圖片探測：測試會附加產生的 PNG（貓＋隨機代碼），並預期模型回傳 `cat <CODE>`。
  - 實作參照：`src/gateway/gateway-models.profiles.live.test.ts` 和 `test/helpers/live-image-probe.ts`。
- 啟用方式：
  - `pnpm test:live`（若直接叫用 Vitest，則使用 `OPENCLAW_LIVE_TEST=1`）
- 選取模型的方式：
  - 預設：精選的高訊號（`modern`）優先清單
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` 會透過完整閘道＋代理程式管線執行精選的小型模型清單
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 `modern` 的別名
  - 或設定 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗號分隔清單）以縮小範圍
  - Modern/all 和 small 閘道全面測試預設以各自精選清單的長度作為上限；設定 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可對所選項目進行完整全面測試，或設為正數以使用較小的上限。
- 選取提供者的方式（避免「所有項目都使用 OpenRouter」）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（以逗號分隔的允許清單）
- 此即時測試一律啟用工具＋圖片探測：
  - `read` 探測＋`exec+read` 探測（工具壓力測試）
  - 模型公告支援圖片輸入時，會執行圖片探測
  - 流程（概要）：
    - 測試會產生包含「CAT」＋隨機代碼的小型 PNG（`test/helpers/live-image-probe.ts`）
    - 透過 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 傳送
    - 閘道將附件剖析至 `images[]`（`src/gateway/server-methods/agent.ts`＋`src/gateway/chat-attachments.ts`）
    - 內嵌代理程式將多模態使用者訊息轉送給模型
    - 斷言：回覆包含 `cat`＋該代碼（OCR 容錯：允許少量錯誤）

<Tip>
若要查看你可在自己的機器上測試哪些項目（以及確切的 `provider/model` ID），請執行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 即時：命令列介面後端冒煙測試（Claude、Gemini 或其他本機命令列介面）

- 測試：`src/gateway/gateway-cli-backend.live.test.ts`
- 目標：使用本機命令列介面後端驗證閘道＋代理程式管線，而不變更你的預設設定。
- 後端特定的冒煙測試預設值位於所屬外掛的 `cli-backend.ts` 定義中。
- 啟用：
  - `pnpm test:live`（若直接叫用 Vitest，則使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 預設值：
  - 預設提供者／模型：`claude-cli/claude-sonnet-4-6`
  - 命令／引數／圖片行為來自所屬命令列介面後端外掛的中繼資料。
- 覆寫（選用）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 可傳送真實圖片附件（路徑會注入提示中）。Docker 配方預設停用。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 可將圖片檔案路徑作為命令列介面引數傳遞，而非注入提示。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）可控制設定 `IMAGE_ARG` 時傳遞圖片引數的方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 可傳送第二輪訊息並驗證續接流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 可選擇加入 Claude Sonnet -> Opus 同一工作階段連續性探測，但所選模型必須支援切換目標。預設停用，Docker 配方中亦然。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 可選擇加入 MCP／工具回送探測。Docker 配方預設停用。

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
設定，然後執行 `gemini --debug mcp list`，以證明已儲存的
`transport: "streamable-http"` 伺服器會正規化為 Gemini 的 HTTP MCP
格式，並且能連線至本機的可串流 HTTP MCP 伺服器。

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

單一提供者 Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

注意事項：

- Docker 執行器位於 `scripts/test-live-cli-backend-docker.sh`。
- 它會以非 root 的 `node` 使用者，在儲存庫 Docker 映像內執行即時命令列介面後端冒煙測試。
- 它會從所屬外掛解析命令列介面冒煙測試中繼資料，接著將相符的 Linux 命令列介面套件（`@anthropic-ai/claude-code` 或 `@google/gemini-cli`）安裝到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（預設：`~/.cache/openclaw/docker-cli-tools`）中的可快取寫入前綴。
- `codex-cli` 已不再是內建命令列介面後端；請改用 `openai/*` 搭配 Codex app-server 執行階段（請參閱[即時：Codex app-server 測試框架冒煙測試](#live-codex-app-server-harness-smoke)）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可攜式 Claude Code 訂閱 OAuth，可透過包含 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json`，或由 `claude setup-token` 取得的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它會先在 Docker 中驗證可直接執行 `claude -p`，接著在不保留 Anthropic API 金鑰環境變數的情況下，執行兩輪閘道命令列介面後端互動。此訂閱測試通道預設會停用 Claude MCP／工具與圖片探測，因為這些探測會消耗已登入訂閱的用量限制，而且 Anthropic 可能在 OpenClaw 未發布新版本的情況下，變更 Claude Agent SDK／`claude -p` 的計費與速率限制行為。
- Claude 和 Gemini 可透過上述旗標支援相同的探測集（文字互動、圖片分類、MCP `cron` 工具呼叫、模型切換連續性），但這些探測預設皆不會執行；請依需要透過各旗標選擇加入。

## 即時：APNs HTTP/2 Proxy 連線可達性

- 測試：`src/infra/push-apns-http2.live.test.ts`
- 目標：透過本機 HTTP CONNECT Proxy 建立通道至 Apple 的沙箱 APNs 端點，傳送 APNs HTTP/2 驗證要求，並斷言 Apple 的真實 `403 InvalidProviderToken` 回應會經由 Proxy 路徑傳回。
- 啟用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 選用逾時：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 即時：ACP 繫結冒煙測試（`/acp spawn ... --bind here`）

- 測試：`src/gateway/gateway-acp-bind.live.test.ts`
- 目標：使用即時 ACP 代理程式驗證真實的 ACP 對話綁定流程：
  - 傳送 `/acp spawn <agent> --bind here`
  - 就地綁定合成的訊息頻道對話
  - 在同一個對話中傳送一般的後續訊息
  - 驗證後續訊息已寫入綁定的 ACP 工作階段逐字稿
- 啟用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 預設值：
  - Docker 中的 ACP 代理程式：`claude,codex,gemini`
  - 直接執行 `pnpm test:live ...` 時的 ACP 代理程式：`claude`
  - 合成頻道：Slack 私訊樣式的對話情境
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
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1`（或 `on`/`true`/`yes`）可強制啟用圖片探測；任何其他值都會強制停用。除了 `opencode` 以外，預設會為每個代理程式執行。
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- 注意事項：
  - 此測試通道使用閘道 `chat.send` 介面及僅限管理員使用的合成來源路由欄位，讓測試可以附加訊息頻道情境，而不會假裝對外傳遞訊息。
  - 未設定 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 時，測試會使用內嵌 `acpx` 外掛的內建代理程式登錄，取得所選 ACP 測試框架代理程式。
  - 綁定工作階段的排程 MCP 建立作業預設採盡力而為，因為外部 ACP 測試框架可能會在綁定／圖片驗證通過後取消 MCP 呼叫；設定 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可讓該綁定後排程探測採嚴格模式。

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
- 預設會依序對彙總的即時命令列介面代理程式執行 ACP 綁定冒煙測試：`claude`、`codex`，接著是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 可縮小矩陣範圍。
- 它會將相符的命令列介面驗證資料暫存到容器中，接著在缺少時安裝要求的即時命令列介面（`@anthropic-ai/claude-code`、`@openai/codex`、透過 `https://app.factory.ai/cli` 安裝 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 後端本身是來自官方 `acpx` 外掛的內嵌 `acpx/runtime` 套件。
- Droid Docker 變體會暫存 `~/.factory` 的設定、轉送 `FACTORY_API_KEY`，並要求提供該 API 金鑰，因為本機 Factory OAuth／鑰匙圈驗證無法移植到容器中。它會使用 ACPX 內建的 `droid exec --output-format acp` 登錄項目。
- OpenCode Docker 變體是一個嚴格的單一代理程式迴歸測試通道。它會根據 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（預設為 `opencode/kimi-k2.6`）寫入暫時的 `OPENCODE_CONFIG_CONTENT` 預設模型。
- 直接呼叫 `acpx` 命令列介面只是在閘道以外比較行為的手動／因應措施路徑。Docker ACP 綁定冒煙測試會執行 OpenClaw 的內嵌 `acpx` 執行階段後端。

## 即時測試：Codex app-server 測試框架冒煙測試

- 目標：透過一般閘道 `agent` 方法驗證外掛所擁有的 Codex 測試框架：
  - 載入隨附的 `codex` 外掛
  - 透過 `/model <ref> --runtime codex` 選取 OpenAI 模型
  - 使用要求的思考層級傳送第一個閘道代理程式回合
  - 向同一個 OpenClaw 工作階段傳送第二個回合，並驗證 app-server 執行緒可以繼續
  - 透過同一條閘道命令路徑執行 `/codex status` 和 `/codex models`
  - 選擇性執行兩個經 Guardian 審查且提高權限的 shell 探測：一個應核准的良性命令，以及一個應拒絕的假機密上傳，讓代理程式回頭詢問
- 測試：`src/gateway/gateway-codex-harness.live.test.ts`
- 啟用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 測試框架基準模型：`openai/gpt-5.6-luna`
- 全新 OpenAI API 金鑰選取預設值：`openai/gpt-5.6`
- 預設思考層級：`low`
- 模型覆寫：`OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- 思考層級覆寫：`OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- 矩陣覆寫：`OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- 驗證模式：`OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth`（預設）使用複製的 Codex 登入資料；`api-key` 則透過 Codex app-server 使用 `OPENAI_API_KEY`。
- 選用的圖片探測：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 選用的 MCP／工具探測：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 選用的 Guardian 探測：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 此冒煙測試會強制設定提供者／模型的 `agentRuntime.id: "codex"`，因此損壞的 Codex 測試框架無法藉由靜默回復到 OpenClaw 而通過測試。
- 驗證：使用本機 Codex 訂閱登入的 Codex app-server 驗證，或在 `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` 時使用 `OPENAI_API_KEY`。Docker 可以複製 `~/.codex/auth.json` 和 `~/.codex/config.toml` 以進行訂閱執行。

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

此驗證會讓 `OPENCLAW_LIVE_GATEWAY_MODELS` 保持未設定狀態，透過全新初始設定的推論選取接合處解析模型、斷言結果為 `openai/gpt-5.6`，接著使用該解析出的模型執行真實的閘道回合。

GPT-5.6 內嵌 OpenClaw 矩陣：

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker 注意事項：

- Docker 執行器位於 `scripts/test-live-codex-harness-docker.sh`。
- 它會傳入 `OPENAI_API_KEY`、在存在時複製 Codex 命令列介面驗證檔案、將 `@openai/codex` 安裝至可寫入且已掛載的 npm 前置路徑、暫存原始碼樹，接著只執行 Codex 測試框架即時測試。
- Docker 預設會啟用圖片、MCP／工具和 Guardian 探測。如需範圍較窄的偵錯執行，請設定 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或 `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的明確 Codex 執行階段設定，因此舊版別名或 OpenClaw 回復機制無法掩蓋 Codex 測試框架迴歸。
- 矩陣目標會在單一容器中依序執行。Docker 指令碼會依目標數量調整預設的 35 分鐘逾時；任何外層 shell 或 CI 逾時都必須允許相同的總時間。標準 CI 會將每個 GPT-5.6 目標分別放在不同的分片中。

### 建議的即時測試操作方式

範圍窄且明確的允許清單速度最快，也最不容易不穩定：

- 單一模型，直接執行（不使用閘道）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型模型直接設定檔：
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型模型閘道設定檔：
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API 冒煙測試：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 單一模型，閘道冒煙測試：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多個提供者的工具呼叫：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 直接冒煙測試：
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google 重點測試（Gemini API 金鑰 + Antigravity）：
  - Gemini（API 金鑰）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 自適應思考冒煙測試（來自私人 QA 命令列介面的 `qa manual`——需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` 和原始碼簽出；請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation)）：
  - Gemini 3 動態預設值：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動態預算：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注意事項：

- `google/...` 使用 Gemini API（API 金鑰）。
- `google-antigravity/...` 使用 Antigravity OAuth 橋接器（Cloud Code Assist 樣式的代理程式端點）。
- `google-gemini-cli/...` 使用你電腦上的本機 Gemini 命令列介面（具有獨立的驗證方式和工具特性）。
- Gemini API 與 Gemini 命令列介面的差異：
  - API：OpenClaw 透過 HTTP 呼叫 Google 託管的 Gemini API（API 金鑰／設定檔驗證）；這是多數使用者所指的「Gemini」。
  - 命令列介面：OpenClaw 會透過 shell 呼叫本機 `gemini` 二進位檔；它有自己的驗證方式，且行為可能不同（串流／工具支援／版本差異）。

## 即時測試：模型矩陣（涵蓋範圍）

即時測試需選擇性啟用，因此沒有固定的「CI 模型清單」。`OPENCLAW_LIVE_MODELS=modern`／`OPENCLAW_LIVE_GATEWAY_MODELS=modern`（以及它們的 `all` 別名）會依照下列優先順序，執行 `src/agents/live-model-filter.ts` 中 `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` 的精選優先清單：

| 提供者／模型                                  | 備註       |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
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

從 `SMALL_LIVE_MODEL_PRIORITY` 取得的精選**小型模型**清單（`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`）：

| 提供者／模型                 |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

關於現代模型清單的備註：

- 預設的現代模型全面測試會排除 `codex` 和 `codex-cli` 提供者（它們涵蓋命令列介面後端／ACP 行為，已於上方另行測試）。`openai/gpt-5.5` 本身預設透過 Codex app-server 測試框架路由；請參閱[即時測試：Codex app-server 測試框架冒煙測試](#live-codex-app-server-harness-smoke)。
- `fireworks`、`google`、`openrouter` 和 `xai` 在現代模型全面測試中只會執行明確精選的模型 ID（不會自動展開為「此提供者的所有模型」）。
- 在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少加入一個支援圖片的模型（Claude／Gemini／OpenAI 系列視覺變體等），以執行圖片探測。

使用手動挑選的跨提供者模型組合，執行包含工具與圖片的閘道冒煙測試：

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

精選清單以外的選用額外涵蓋範圍（有更好；挑選一個你已啟用且支援「工具」的模型）：

- Mistral：`mistral/...`
- Cerebras：`cerebras/...`（若你有存取權）
- LM Studio：`lmstudio/...`（本機；工具呼叫取決於 API 模式）

### 聚合器／替代閘道

若你已啟用金鑰，也可以透過以下項目測試：

- OpenRouter：`openrouter/...`（數百個模型；使用 `openclaw models scan` 尋找支援工具與圖片的候選模型）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（透過 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 驗證）

你可以納入即時測試矩陣的其他提供者（若你有認證資訊／設定）：

- 內建：`anthropic`、`cerebras`、`github-copilot`、`google`、`google-antigravity`、`google-gemini-cli`、`google-vertex`、`groq`、`mistral`、`openai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`zai`
- 透過 `models.providers`（自訂端點）：`minimax`（雲端／API），以及任何與 OpenAI／Anthropic 相容的代理（LM Studio、vLLM、LiteLLM 等）

<Tip>
請勿在文件中硬編碼「所有模型」。權威清單是你機器上的 `discoverModels(...)` 傳回內容，加上目前可用的金鑰。
</Tip>

## 認證資訊（絕不可提交）

即時測試會以與命令列介面相同的方式探索認證資訊。實際影響如下：

- 如果命令列介面可運作，即時測試應能找到相同的金鑰。
- 如果即時測試顯示「沒有認證資訊」，請使用偵錯 `openclaw models list`／模型選擇時的相同方式進行偵錯。

- 各代理程式的驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（即時測試中的「設定檔金鑰」即指此項）
- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 舊版 OAuth 目錄：`~/.openclaw/credentials/`（若存在，會複製到暫存的即時測試主目錄，但它不是主要的設定檔金鑰儲存區）
- 本機即時測試會將有效設定（移除 `agents.*.workspace` / `agentDir` 覆寫）和每個代理程式的 `auth-profiles.json` 複製到臨時測試主目錄，而不會複製該代理程式目錄的其餘部分，因此 `workspace/` 和 `sandboxes/` 資料絕不會進入暫存主目錄；此外也會複製舊版 `credentials/` 目錄，以及支援的外部命令列介面驗證檔案／目錄（`.claude.json`、`.claude/.credentials.json`、`.claude/settings*.json`、`.claude/backups`、`.codex/auth.json`、`.codex/config.toml`、`.gemini`、`.minimax`）。

如果你想依賴環境變數金鑰，請在本機測試前匯出它們，或使用下方的
Docker 執行器，並明確設定 `OPENCLAW_PROFILE_FILE`。

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
  - 執行隨附的 comfy 圖片、影片和 `music_generate` 路徑
  - 除非已設定 `plugins.entries.comfy.config.<capability>`，否則會略過各項功能
  - 適合在變更 comfy 工作流程提交、輪詢、下載或外掛註冊後使用

## 圖片生成即時測試

- 測試：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 測試框架：`pnpm test:live:media image`
- 範圍：
  - 列舉每個已註冊的圖片生成提供者外掛
  - 探測前會使用已匯出的提供者環境變數
  - 預設會優先使用即時／環境變數 API 金鑰，而非已儲存的驗證設定檔，因此 `auth-profiles.json` 中過時的測試金鑰不會掩蓋真正的 shell 認證資訊
  - 略過沒有可用驗證／設定檔／模型的提供者
  - 透過共用圖片生成執行階段執行每個已設定的提供者：
    - `<provider>:generate`
    - 當提供者宣告支援編輯時執行 `<provider>:edit`
- 目前涵蓋的隨附提供者：
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 選用縮小範圍：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 選用驗證行為：
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`，以強制使用設定檔儲存區驗證並忽略僅限環境變數的覆寫

對於已發布的命令列介面路徑，請在提供者／執行階段即時測試通過後，加入一次 `infer` 冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "極簡扁平測試圖片：白色背景上有一個藍色正方形，沒有文字。" \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

這涵蓋命令列介面引數剖析、設定／預設代理程式解析、隨附
外掛啟用、共用圖片生成執行階段，以及即時提供者
請求。執行階段載入前應已備妥外掛相依套件。

## 音樂生成即時測試

- 測試：`extensions/music-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media music`
- 範圍：
  - 執行共用的隨附音樂生成提供者路徑
  - 目前涵蓋 `fal`、`google`、`minimax` 和 `openrouter`
  - 探測前會使用已匯出的提供者環境變數
  - 預設會優先使用即時／環境變數 API 金鑰，而非已儲存的驗證設定檔，因此 `auth-profiles.json` 中過時的測試金鑰不會掩蓋真正的 shell 認證資訊
  - 略過沒有可用驗證／設定檔／模型的提供者
  - 可用時執行兩種已宣告的執行階段模式：
    - 使用僅含提示詞的輸入執行 `generate`
    - 當提供者宣告 `capabilities.edit.enabled` 時執行 `edit`
  - `comfy` 有自己的獨立即時測試檔案，不屬於這項共用全面測試
- 選用縮小範圍：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 選用驗證行為：
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`，以強制使用設定檔儲存區驗證並忽略僅限環境變數的覆寫

## 影片生成即時測試

- 測試：`extensions/video-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media video`
- 範圍：
  - 透過 `alibaba`、`byteplus`、`deepinfra`、`fal`、`google`、`minimax`、`openai`、`openrouter`、`pixverse`、`qwen`、`runway`、`together`、`vydra`、`xai`，測試共用的內建影片生成提供者路徑
  - 預設使用適合發布的安全冒煙測試路徑：每個提供者各執行一次文字轉影片請求、使用一秒鐘的龍蝦提示詞，並套用 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 所設定的每個提供者操作上限（預設為 `180000`）
  - 預設跳過 FAL，因為提供者端的佇列延遲可能占用大部分發布時間；傳入 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`（或清空跳過清單）即可明確執行
  - 在探測前使用已匯出的提供者環境變數
  - 預設優先使用即時／環境中的 API 金鑰，而非已儲存的驗證設定檔，因此 `auth-profiles.json` 中過時的測試金鑰不會遮蔽實際的 shell 認證資訊
  - 跳過沒有可用驗證／設定檔／模型的提供者
  - 預設只執行 `generate`
  - 設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，即可在可用時一併執行已宣告的轉換模式：
    - 當提供者宣告 `capabilities.imageToVideo.enabled`，且所選提供者／模型在共用掃描中接受以緩衝區為基礎的本機圖片輸入時，執行 `imageToVideo`
    - 當提供者宣告 `capabilities.videoToVideo.enabled`，且所選提供者／模型在共用掃描中接受以緩衝區為基礎的本機影片輸入時，執行 `videoToVideo`
  - 共用掃描中目前已宣告但略過的 `imageToVideo` 提供者：
    - `vydra`（此測試途徑不支援以緩衝區為基礎的本機圖片輸入）
  - Vydra 提供者專屬涵蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 該檔案會執行 `veo3` 文字轉影片，以及預設使用遠端圖片 URL 測試資料的 `kling` 圖片轉影片測試途徑（可用 `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` 覆寫）。
  - xAI 提供者專屬涵蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - 經典案例會先生成一張正方形的本機 PNG 作為第一幀、省略幾何資訊、請求一秒鐘的圖片轉影片短片、輪詢至完成，並驗證下載的緩衝區。
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - 1.5 案例會生成一張本機 PNG 作為第一幀、請求一秒鐘的 1080P 圖片轉影片短片、輪詢至完成，並驗證下載的緩衝區。
  - 目前的 `videoToVideo` 即時測試涵蓋範圍：
    - 僅限所選模型解析為 `gen4_aleph` 時的 `runway`
  - 共用掃描中目前已宣告但略過的 `videoToVideo` 提供者：
    - `alibaba`、`google`、`openai`、`qwen`、`xai`，因為這些路徑目前需要遠端 `http(s)` 參照 URL，而非以緩衝區為基礎的本機輸入
- 選用的範圍縮減方式：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - 使用 `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`，在預設掃描中納入所有提供者，包括 FAL
  - 使用 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`，降低每個提供者的操作上限，以執行更積極的冒煙測試
- 選用的驗證行為：
  - 使用 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`，強制使用設定檔儲存區驗證，並忽略僅來自環境變數的覆寫

## 媒體即時測試框架

- 命令：`pnpm test:live:media`
- 進入點：`test/e2e/qa-lab/media/hosted-media-provider-live.ts`，它會針對每個所選測試套件執行 `pnpm test:live -- <suite-test-file>`，因此心跳偵測與安靜模式行為會和其他 `pnpm test:live` 執行保持一致。
- 用途：
  - 透過單一的儲存庫原生進入點執行共用的圖片、音樂與影片即時測試套件
  - 自動從 `~/.profile` 載入缺少的提供者環境變數
  - 預設自動將每個測試套件縮限至目前具有可用驗證的提供者
- 旗標：
  - `--providers <csv>` 全域提供者篩選器；`--image-providers`／`--music-providers`／`--video-providers` 將篩選器限定於單一測試套件
  - `--all-providers` 跳過以驗證為依據的自動篩選
  - `--allow-empty` 在篩選後沒有可執行的提供者時，以 `0` 結束
  - `--quiet`／`--no-quiet` 會傳遞至 `test:live`
- 範例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相關內容

- [測試](/zh-TW/help/testing) - 單元、整合、QA 與 Docker 測試套件
