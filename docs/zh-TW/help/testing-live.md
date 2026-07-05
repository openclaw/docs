---
read_when:
    - 執行即時模型矩陣 / 命令列介面後端 / ACP / 媒體提供者冒煙測試
    - 偵錯即時測試認證解析
    - 新增提供者專屬即時測試
sidebarTitle: Live tests
summary: 連線（會觸及網路的）測試：模型矩陣、命令列介面後端、ACP、媒體提供者、憑證
title: 測試：即時測試套件
x-i18n:
    generated_at: "2026-07-05T11:26:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de398a9334b060c2f1e520487cbf945589fb39e57cc7804a27b8a19de96c47a4
    source_path: help/testing-live.md
    workflow: 16
---

如需快速開始、QA 執行器、單元/整合套件，以及 Docker 流程，請參閱
[測試](/zh-TW/help/testing)。本頁涵蓋**即時**（會觸及網路的）測試：
模型矩陣、命令列介面後端、ACP、媒體供應商，以及憑證處理。

## 即時：本機煙霧測試指令

在臨時即時檢查前，先在程序環境中匯出所需的供應商金鑰。

安全的媒體煙霧測試：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全的語音通話就緒煙霧測試：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

除非同時提供 `--yes`，否則 `voicecall smoke` 是空跑；只有在你打算撥打真實通話時才使用 `--yes`。對 Twilio、Telnyx 和 Plivo 而言，成功的就緒檢查需要公開的網路鉤子 URL；本機/私有回送 URL 會被拒絕，因為這些供應商無法連到它們。

## 即時：Android 節點能力掃描

- 測試：`src/gateway/android-node.capabilities.live.test.ts`
- 腳本：`pnpm android:test:integration`
- 目標：叫用已連線 Android 節點**目前宣告的每一個指令**，並斷言指令合約行為。
- 範圍：
  - 有前置條件的/手動設定（此套件不會安裝/執行/配對應用程式）。
  - 針對所選 Android 節點逐一驗證閘道 `node.invoke`。
- 必要前置設定：
  - Android 應用程式已連線並配對到閘道。
  - 應用程式保持在前景。
  - 已為你預期會通過的能力授予權限/擷取同意。
- 可選目標覆寫：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 設定詳細資料：[Android 應用程式](/zh-TW/platforms/android)

## 即時：模型煙霧測試（設定檔金鑰）

即時模型測試分成兩層，以便隔離失敗：

- 「直接模型」會告訴你該供應商/模型是否完全能用指定金鑰回答。
- 「閘道煙霧測試」會告訴你完整的閘道+代理管線是否能為該模型運作（工作階段、歷史記錄、工具、沙箱政策等）。

以下精選模型清單位於 `src/agents/live-model-filter.ts`，並且會隨時間變更；請將該處的陣列視為事實來源，而不是本頁。

MiniMax M3 使用 `minimax/MiniMax-M3` 作為其預設供應商/模型參照。

### 第 1 層：直接模型補全（無閘道）

- 測試：`src/agents/models.profiles.live.test.ts`
- 目標：
  - 列舉已發現的模型
  - 使用 `getApiKeyForModel` 選取你有憑證的模型
  - 對每個模型執行小型補全（並在需要時執行目標式迴歸測試）
- 如何啟用：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
  - 設定 `OPENCLAW_LIVE_MODELS=modern`、`small` 或 `all`（`modern` 的別名）以實際執行此套件；否則它會略過，因此單獨執行 `pnpm test:live` 仍會聚焦在閘道煙霧測試。
- 如何選取模型：
  - `OPENCLAW_LIVE_MODELS=modern` 會執行精選的高訊號優先清單（請參閱[即時：模型矩陣](#live-model-matrix-what-we-cover)）
  - `OPENCLAW_LIVE_MODELS=small` 會執行精選的小模型優先清單
  - `OPENCLAW_LIVE_MODELS=all` 是 `modern` 的別名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗號允許清單）
  - 本機 Ollama 小模型執行預設為 `http://127.0.0.1:11434`；只有 LAN、自訂或 Ollama Cloud 端點才設定 `OPENCLAW_LIVE_OLLAMA_BASE_URL`。
  - Modern/all 和 small 掃描預設以其精選清單長度作為上限；設定 `OPENCLAW_LIVE_MAX_MODELS=0` 可進行完整的已選設定檔掃描，或設定正數作為較小上限。
  - 完整掃描會使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作為整個直接模型測試逾時。預設：60 分鐘。
  - 直接模型探測預設以 20 路平行執行；設定 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 可覆寫。
- 如何選取供應商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗號允許清單）
- 金鑰來源：
  - 預設：設定檔儲存區與環境變數後援
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制只使用**設定檔儲存區**
- 此功能存在的原因：
  - 將「供應商 API 壞了 / 金鑰無效」與「閘道代理管線壞了」分開
  - 包含小型、隔離的迴歸測試（範例：OpenAI Responses/Codex Responses 推理重播 + 工具呼叫流程）

### 第 2 層：閘道 + 開發代理煙霧測試（「@openclaw」實際做的事）

- 測試：`src/gateway/gateway-models.profiles.live.test.ts`
- 目標：
  - 啟動程序內閘道
  - 建立/修補 `agent:dev:*` 工作階段（每次執行覆寫模型）
  - 逐一測試有金鑰的模型並斷言：
    - 「有意義的」回應（無工具）
    - 真實工具叫用可運作（讀取探測）
    - 可選的額外工具探測（執行+讀取探測）
    - OpenAI 迴歸路徑（僅工具呼叫 -> 後續回合）持續運作
- 探測詳細資料（方便你快速解釋失敗）：
  - `read` 探測：測試會在工作區寫入 nonce 檔案，並要求代理 `read` 它且回傳該 nonce。
  - `exec+read` 探測：測試會要求代理以 `exec` 將 nonce 寫入暫存檔，然後再 `read` 回來。
  - 圖片探測：測試會附加產生的 PNG（貓 + 隨機碼），並預期模型回傳 `cat <CODE>`。
  - 實作參照：`src/gateway/gateway-models.profiles.live.test.ts` 和 `test/helpers/live-image-probe.ts`。
- 如何啟用：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 如何選取模型：
  - 預設：精選的高訊號（`modern`）優先清單
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` 會透過完整閘道+代理管線執行精選的小模型清單
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 `modern` 的別名
  - 或設定 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗號清單）以縮小範圍
  - Modern/all 和 small 閘道掃描預設以其精選清單長度作為上限；設定 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可進行完整的已選掃描，或設定正數作為較小上限。
- 如何選取供應商（避免「OpenRouter 全部都跑」）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗號允許清單）
- 工具 + 圖片探測在此即時測試中一律開啟：
  - `read` 探測 + `exec+read` 探測（工具壓力）
  - 當模型宣告支援圖片輸入時執行圖片探測
  - 流程（高階）：
    - 測試產生一個帶有 "CAT" + 隨機碼的小型 PNG（`test/helpers/live-image-probe.ts`）
    - 透過 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 傳送
    - 閘道將附件解析成 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式代理將多模態使用者訊息轉發給模型
    - 斷言：回覆包含 `cat` + 該代碼（OCR 容忍度：允許輕微錯誤）

<Tip>
若要查看你的機器上可測試的項目（以及精確的 `provider/model` ID），請執行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 即時：命令列介面後端煙霧測試（Claude、Gemini 或其他本機命令列介面）

- 測試：`src/gateway/gateway-cli-backend.live.test.ts`
- 目標：使用本機命令列介面後端驗證閘道 + 代理管線，且不觸碰你的預設設定。
- 後端專屬煙霧測試預設值位於擁有該後端的外掛 `cli-backend.ts` 定義中。
- 啟用：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 預設值：
  - 預設供應商/模型：`claude-cli/claude-sonnet-4-6`
  - 指令/引數/圖片行為來自擁有該命令列介面後端的外掛中繼資料。
- 覆寫（可選）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 以傳送真實圖片附件（路徑會注入提示中）。Docker 配方中預設關閉。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 以將圖片檔案路徑作為命令列介面引數傳遞，而不是注入提示。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）以在設定 `IMAGE_ARG` 時控制圖片引數的傳遞方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 以傳送第二回合並驗證續接流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 以在所選模型支援切換目標時，選擇加入 Claude Sonnet -> Opus 同工作階段連續性探測。預設關閉，Docker 配方中也一樣。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 以選擇加入 MCP/工具回送探測。Docker 配方中預設關閉。

範例：

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低成本 Gemini MCP 設定煙霧測試：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

這不會要求 Gemini 產生回應。它會寫入 OpenClaw 提供給 Gemini 的相同系統設定，然後執行 `gemini --debug mcp list`，以證明已儲存的 `transport: "streamable-http"` 伺服器會正規化為 Gemini 的 HTTP MCP 形狀，並且可連線到本機 streamable-HTTP MCP 伺服器。

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
- 它會在 repo Docker 映像中，以非 root 的 `node` 使用者執行即時命令列介面後端煙霧測試。
- 它會從擁有該後端的外掛解析命令列介面煙霧測試中繼資料，然後將相符的 Linux 命令列介面套件（`@anthropic-ai/claude-code` 或 `@google/gemini-cli`）安裝到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的快取可寫前綴中（預設：`~/.cache/openclaw/docker-cli-tools`）。
- `codex-cli` 不再是內建的命令列介面後端；請改用 `openai/*` 搭配 Codex app-server runtime（請參閱[即時：Codex app-server harness 煙霧測試](#live-codex-app-server-harness-smoke)）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可攜的 Claude Code 訂閱 OAuth，可透過含有 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json`，或來自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它會先在 Docker 中證明直接 `claude -p` 可行，然後在不保留 Anthropic API 金鑰環境變數的情況下執行兩個閘道命令列介面後端回合。此訂閱通道預設停用 Claude MCP/工具與圖片探測，因為它會消耗已登入訂閱的使用額度，且 Anthropic 可以在沒有 OpenClaw 發版的情況下變更 Claude Agent SDK / `claude -p` 的計費與速率限制行為。
- Claude 和 Gemini 透過上述旗標支援相同探測集（文字回合、圖片分類、MCP `cron` 工具呼叫、模型切換連續性），但這些探測預設都不會執行；請依需要逐一旗標選擇加入。

## 即時：APNs HTTP/2 Proxy 可達性

- 測試：`src/infra/push-apns-http2.live.test.ts`
- 目標：透過本機 HTTP CONNECT Proxy 建立到 Apple 沙箱 APNs 端點的通道，傳送 APNs HTTP/2 驗證請求，並斷言 Apple 真實的 `403 InvalidProviderToken` 回應會經由該 Proxy 路徑回來。
- 啟用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 可選逾時：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 即時：ACP 綁定煙霧測試（`/acp spawn ... --bind here`）

- 測試：`src/gateway/gateway-acp-bind.live.test.ts`
- 目標：使用即時 ACP agent 驗證真實的 ACP conversation-bind 流程：
  - 傳送 `/acp spawn <agent> --bind here`
  - 就地繫結合成的訊息通道對話
  - 在同一個對話上傳送一般後續訊息
  - 驗證後續訊息會落在已繫結 ACP 工作階段的逐字稿中
- 啟用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 預設值：
  - Docker 中的 ACP agents：`claude,codex,gemini`
  - 直接執行 `pnpm test:live ...` 時的 ACP agent：`claude`
  - 合成通道：Slack DM 風格的對話情境
  - ACP 後端：`acpx`
- 覆寫：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1`（或 `on`/`true`/`yes`）以強制啟用圖片探測；任何其他值都會強制停用。除了 `opencode` 以外，預設會對每個 agent 執行。
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- 注意事項：
  - 此通道使用閘道 `chat.send` 介面，搭配僅限管理員使用的合成 originating-route 欄位，讓測試可以附加訊息通道情境，而不必假裝要向外部投遞。
  - 未設定 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 時，測試會使用內嵌 `acpx` 外掛的內建 agent 登錄，來選取 ACP 測試工具 agent。
  - 已繫結工作階段的排程 MCP 建立預設為盡力而為，因為外部 ACP 測試工具可能會在繫結/圖片證明通過後取消 MCP 呼叫；設定 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可讓該繫結後排程探測變為嚴格模式。

範例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-acp-bind
```

單一 agent Docker 配方：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 注意事項：

- Docker 執行器位於 `scripts/test-live-acp-bind-docker.sh`。
- 預設會依序對聚合即時命令列介面 agents 執行 ACP 繫結冒煙測試：`claude`、`codex`，然後是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 來縮小矩陣。
- 它會將相符的命令列介面驗證資料暫存到容器中，然後在缺少時安裝所要求的即時命令列介面（`@anthropic-ai/claude-code`、`@openai/codex`、透過 `https://app.factory.ai/cli` 的 Factory Droid、`@google/gemini-cli`，或 `opencode-ai`）。ACP 後端本身是來自官方 `acpx` 外掛的內嵌 `acpx/runtime` 套件。
- Droid Docker 變體會暫存 `~/.factory` 作為設定、轉送 `FACTORY_API_KEY`，並要求該 API 金鑰，因為本機 Factory OAuth/keyring 驗證無法攜入容器。它會使用 ACPX 內建的 `droid exec --output-format acp` 登錄項目。
- OpenCode Docker 變體是嚴格的單一 agent 迴歸通道。它會從 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` 寫入暫時的 `OPENCODE_CONFIG_CONTENT` 預設模型（預設為 `opencode/kimi-k2.6`）。
- 直接呼叫 `acpx` 命令列介面僅是用於在閘道之外比較行為的手動/ workaround 路徑。Docker ACP 繫結冒煙測試會演練 OpenClaw 內嵌的 `acpx` runtime 後端。

## 即時：Codex app-server 測試工具冒煙測試

- 目標：透過一般閘道
  `agent` 方法驗證外掛擁有的 Codex 測試工具：
  - 載入隨附的 `codex` 外掛
  - 選取 `openai/gpt-5.5`，它預設會將 OpenAI agent 回合透過 Codex 路由
  - 在選取 Codex 測試工具的情況下，將第一個閘道 agent 回合傳送至 `openai/gpt-5.5`
  - 將第二個回合傳送至同一個 OpenClaw 工作階段，並驗證 app-server
    執行緒可以恢復
  - 透過相同的閘道命令
    路徑執行 `/codex status` 和 `/codex models`
  - 可選擇執行兩個經 Guardian 審查的升級權限 shell 探測：一個應被核准的良性
    命令，以及一個應被
    拒絕、讓 agent 回問的假秘密上傳
- 測試：`src/gateway/gateway-codex-harness.live.test.ts`
- 啟用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 預設模型：`openai/gpt-5.5`
- 可選圖片探測：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可選 MCP/工具探測：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可選 Guardian 探測：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 冒煙測試會強制提供者/模型 `agentRuntime.id: "codex"`，因此壞掉的 Codex
  測試工具無法透過靜默退回 OpenClaw 而通過。
- 驗證：來自本機 Codex 訂閱登入的 Codex app-server 驗證。Docker
  冒煙測試在適用時也可以為非 Codex 探測提供 `OPENAI_API_KEY`，
  另可選擇複製 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

本機配方：

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-codex-harness
```

Docker 注意事項：

- Docker 執行器位於 `scripts/test-live-codex-harness-docker.sh`。
- 它會傳遞 `OPENAI_API_KEY`、在存在時複製 Codex 命令列介面驗證檔案、將
  `@openai/codex` 安裝到可寫入的掛載 npm
  前綴、暫存原始碼樹，然後只執行 Codex 測試工具即時測試。
- Docker 預設會啟用圖片、MCP/工具與 Guardian 探測。需要較窄的偵錯
  執行時，設定
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的明確 Codex runtime 設定，因此舊別名或 OpenClaw
  fallback 無法掩蓋 Codex 測試工具迴歸。

### 建議的即時配方

狹窄、明確的允許清單速度最快且最不容易不穩定：

- 單一模型，直接執行（不經閘道）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型模型直接設定檔：
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型模型閘道設定檔：
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API 冒煙測試：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 單一模型，閘道冒煙測試：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多個提供者的工具呼叫：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 直接冒煙測試：
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google 聚焦（Gemini API 金鑰 + Antigravity）：
  - Gemini（API 金鑰）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking 冒煙測試（來自私有 QA 命令列介面的 `qa manual` - 需要 `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` 和原始碼 checkout；請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation)）：
  - Gemini 3 動態預設值：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動態預算：`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注意事項：

- `google/...` 使用 Gemini API（API 金鑰）。
- `google-antigravity/...` 使用 Antigravity OAuth 橋接器（Cloud Code Assist 風格的 agent 端點）。
- `google-gemini-cli/...` 使用你機器上的本機 Gemini 命令列介面（獨立驗證 + 工具細節）。
- Gemini API 與 Gemini 命令列介面：
  - API：OpenClaw 透過 HTTP 呼叫 Google 託管的 Gemini API（API 金鑰 / 設定檔驗證）；這是多數使用者所說的「Gemini」。
  - 命令列介面：OpenClaw 會 shell out 到本機 `gemini` 二進位檔；它有自己的驗證，且行為可能不同（串流/工具支援/版本落差）。

## 即時：模型矩陣（涵蓋內容）

即時測試採用選擇啟用，因此沒有固定的「CI 模型清單」。`OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern`（以及它們的 `all` 別名）會執行 `src/agents/live-model-filter.ts` 中 `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` 的精選優先清單，優先順序如下：

| 提供者/模型                                  | 備註       |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3-flash-preview`               | Gemini API |
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
| `xai/grok-4.3`                                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

精選的**小型模型**清單（`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`），來自 `SMALL_LIVE_MODEL_PRIORITY`：

| 提供者/模型               |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

modern 清單注意事項：

- `codex` 和 `codex-cli` 供應商會排除在預設的現代掃描之外（它們涵蓋命令列介面後端/ACP 行為，已在上方分開測試）。`openai/gpt-5.5` 本身預設會透過 Codex app-server 測試框架路由；請參閱[實機：Codex app-server 測試框架冒煙測試](#live-codex-app-server-harness-smoke)。
- `fireworks`、`google`、`openrouter` 和 `xai` 在現代掃描中只會執行其明確精選的模型 ID（不會自動展開成「此供應商的每個模型」）。
- 在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中包含至少一個支援圖片的模型（Claude/Gemini/OpenAI 系列視覺變體等），以執行圖片探測。

在手動挑選的跨供應商組合上，使用工具 + 圖片執行閘道冒煙測試：

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

精選清單之外的可選額外覆蓋範圍（有更好，挑選一個你已啟用且支援「工具」的模型）：

- Mistral：`mistral/...`
- Cerebras：`cerebras/...`（如果你有存取權）
- LM Studio：`lmstudio/...`（本機；工具呼叫取決於 API 模式）

### 彙整器 / 替代閘道

如果你已啟用金鑰，也可以透過以下方式測試：

- OpenRouter：`openrouter/...`（數百個模型；使用 `openclaw models scan` 尋找支援工具 + 圖片的候選模型）
- OpenCode：`opencode/...` 用於 Zen，`opencode-go/...` 用於 Go（透過 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 驗證）

你可以納入實機矩陣的更多供應商（如果你有認證/設定）：

- 內建：`anthropic`、`cerebras`、`github-copilot`、`google`、`google-antigravity`、`google-gemini-cli`、`google-vertex`、`groq`、`mistral`、`openai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`zai`
- 透過 `models.providers`（自訂端點）：`minimax`（雲端/API），以及任何 OpenAI/Anthropic 相容代理（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文件中硬編碼「所有模型」。權威清單是 `discoverModels(...)` 在你的機器上傳回的內容，加上可用的金鑰。
</Tip>

## 認證（絕不提交）

實機測試會以與命令列介面相同的方式探索認證。實務影響：

- 如果命令列介面可用，實機測試應該會找到相同的金鑰。
- 如果實機測試顯示「沒有認證」，請用你除錯 `openclaw models list` / 模型選擇的同樣方式除錯。

- 個別代理的驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（這就是實機測試中「設定檔金鑰」的意思）
- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 舊版 OAuth 目錄：`~/.openclaw/credentials/`（存在時會複製到暫存的實機家目錄，但不是主要的設定檔金鑰儲存區）
- 本機實機執行會將作用中的設定（移除 `agents.*.workspace` / `agentDir` 覆寫）和每個代理的 `auth-profiles.json` 複製到暫時測試家目錄，而不是該代理目錄的其餘部分，因此 `workspace/` 和 `sandboxes/` 資料絕不會到達暫存家目錄；另會複製舊版 `credentials/` 目錄，以及支援的外部命令列介面驗證檔案/目錄（`.claude.json`、`.claude/.credentials.json`、`.claude/settings*.json`、`.claude/backups`、`.codex/auth.json`、`.codex/config.toml`、`.gemini`、`.minimax`）。

如果你想依賴環境金鑰，請在本機測試前匯出它們，或使用下方的
Docker 執行器並明確指定 `OPENCLAW_PROFILE_FILE`。

## Deepgram 實機（音訊轉錄）

- 測試：`extensions/deepgram/audio.live.test.ts`
- 啟用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 編碼計畫實機

- 測試：`extensions/byteplus/live.test.ts`
- 啟用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可選模型覆寫：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流程媒體實機

- 測試：`extensions/comfy/comfy.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 範圍：
  - 執行內建 comfy 圖片、影片和 `music_generate` 路徑
  - 除非已設定 `plugins.entries.comfy.config.<capability>`，否則略過各項能力
  - 適合在變更 comfy 工作流程提交、輪詢、下載或外掛註冊後使用

## 圖片生成實機

- 測試：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 測試框架：`pnpm test:live:media image`
- 範圍：
  - 列舉每個已註冊的圖片生成供應商外掛
  - 在探測前使用已匯出的供應商環境變數
  - 預設優先使用實機/環境 API 金鑰，而非已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 認證
  - 略過沒有可用驗證/設定檔/模型的供應商
  - 透過共用圖片生成執行階段執行每個已設定的供應商：
    - `<provider>:generate`
    - 供應商宣告支援編輯時執行 `<provider>:edit`
- 目前涵蓋的內建供應商：
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 可選縮小範圍：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 可選驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以強制使用設定檔儲存區驗證，並忽略僅環境變數的覆寫

對於已出貨的命令列介面路徑，請在供應商/執行階段實機測試通過後加上一個 `infer` 冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

這會涵蓋命令列介面引數解析、設定/預設代理解析、內建
外掛啟用、共用圖片生成執行階段，以及實機供應商
請求。外掛相依項預期在執行階段載入前已存在。

## 音樂生成實機

- 測試：`extensions/music-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media music`
- 範圍：
  - 執行共用內建音樂生成供應商路徑
  - 目前涵蓋 `fal`、`google`、`minimax` 和 `openrouter`
  - 在探測前使用已匯出的供應商環境變數
  - 預設優先使用實機/環境 API 金鑰，而非已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 認證
  - 略過沒有可用驗證/設定檔/模型的供應商
  - 可用時執行兩種已宣告的執行階段模式：
    - 使用僅提示輸入執行 `generate`
    - 供應商宣告 `capabilities.edit.enabled` 時執行 `edit`
  - `comfy` 有自己的獨立實機檔案，不屬於此共用掃描
- 可選縮小範圍：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 可選驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以強制使用設定檔儲存區驗證，並忽略僅環境變數的覆寫

## 影片生成實機

- 測試：`extensions/video-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media video`
- 範圍：
  - 跨 `alibaba`、`byteplus`、`deepinfra`、`fal`、`google`、`minimax`、`openai`、`openrouter`、`pixverse`、`qwen`、`runway`、`together`、`vydra`、`xai` 執行共用內建影片生成供應商路徑
  - 預設使用對發布安全的冒煙測試路徑：每個供應商一個文字轉影片請求、一秒鐘龍蝦提示，以及來自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每供應商操作上限（預設為 `180000`）
  - 預設略過 FAL，因為供應商端佇列延遲可能主導發布時間；傳入 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`（或清空略過清單）即可明確執行它
  - 在探測前使用已匯出的供應商環境變數
  - 預設優先使用實機/環境 API 金鑰，而非已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 認證
  - 略過沒有可用驗證/設定檔/模型的供應商
  - 預設只執行 `generate`
  - 設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 也會在可用時執行已宣告的轉換模式：
    - 當供應商宣告 `capabilities.imageToVideo.enabled`，且所選供應商/模型在共用掃描中接受以緩衝區支援的本機圖片輸入時，執行 `imageToVideo`
    - 當供應商宣告 `capabilities.videoToVideo.enabled`，且所選供應商/模型在共用掃描中接受以緩衝區支援的本機影片輸入時，執行 `videoToVideo`
  - 目前在共用掃描中已宣告但略過的 `imageToVideo` 供應商：
    - `vydra`（此通道不支援以緩衝區支援的本機圖片輸入）
  - 供應商專屬 Vydra 覆蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 該檔案會執行 `veo3` 文字轉影片，以及預設使用遠端圖片 URL 夾具的 `kling` 圖片轉影片通道（使用 `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` 覆寫）。
  - 目前的 `videoToVideo` 實機覆蓋範圍：
    - 僅在所選模型解析為 `gen4_aleph` 時涵蓋 `runway`
  - 目前在共用掃描中已宣告但略過的 `videoToVideo` 供應商：
    - `alibaba`、`google`、`openai`、`qwen`、`xai`，因為這些路徑目前需要遠端 `http(s)` 參照 URL，而不是以緩衝區支援的本機輸入
- 可選縮小範圍：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在預設掃描中包含每個供應商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 以降低每個供應商操作上限，進行激進的冒煙測試執行
- 可選驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以強制使用設定檔儲存區驗證，並忽略僅環境變數的覆寫

## 媒體實機測試框架

- 命令：`pnpm test:live:media`
- 進入點：`test/e2e/qa-lab/media/hosted-media-provider-live.ts`，它會針對每個所選套件執行 `pnpm test:live -- <suite-test-file>`，因此心跳偵測和安靜模式行為會與其他 `pnpm test:live` 執行保持一致。
- 用途：
  - 透過一個 repo 原生進入點執行共用圖片、音樂和影片實機套件
  - 從 `~/.profile` 自動載入缺少的供應商環境變數
  - 預設自動將每個套件縮小到目前具有可用驗證的供應商
- 旗標：
  - `--providers <csv>` 全域供應商篩選；`--image-providers` / `--music-providers` / `--video-providers` 將篩選限縮到單一套件
  - `--all-providers` 略過基於驗證的自動篩選
  - `--allow-empty` 在篩選後沒有可執行供應商時以 `0` 結束
  - `--quiet` / `--no-quiet` 傳遞給 `test:live`
- 範例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相關

- [測試](/zh-TW/help/testing) - 單元、整合、QA 和 Docker 套件
