---
read_when:
    - 執行即時模型矩陣 / 命令列介面後端 / ACP / media-provider 煙霧測試
    - 偵錯即時測試憑證解析
    - 新增供應商專屬即時測試
sidebarTitle: Live tests
summary: 實際（會觸及網路的）測試：模型矩陣、命令列介面後端、ACP、媒體提供者、憑證
title: 測試：即時測試套件
x-i18n:
    generated_at: "2026-06-27T19:24:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

如需快速開始、QA 執行器、單元/整合套件與 Docker 流程，請參閱
[測試](/zh-TW/help/testing)。本頁涵蓋**即時**（會觸碰網路的）測試
套件：模型矩陣、命令列介面後端、ACP 與媒體提供者即時測試，以及
憑證處理。

## 即時：本機冒煙命令

在進行臨時即時檢查前，請先在程序環境中匯出所需的提供者金鑰。

安全的媒體冒煙測試：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全的語音通話就緒冒煙測試：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

除非同時提供 `--yes`，否則 `voicecall smoke` 是試跑。只有在你刻意想要發出真正的通知通話時才使用 `--yes`。對 Twilio、Telnyx 與
Plivo 來說，成功的就緒檢查需要公開網路鉤子 URL；僅限本機的
loopback/私人備援會依設計被拒絕。

## 即時：Android 節點能力掃描

- 測試：`src/gateway/android-node.capabilities.live.test.ts`
- 指令碼：`pnpm android:test:integration`
- 目標：叫用已連線 Android 節點**目前公告的每個命令**，並斷言命令合約行為。
- 範圍：
  - 需預先準備/手動設定（此套件不會安裝/執行/配對應用程式）。
  - 針對所選 Android 節點逐一驗證閘道 `node.invoke` 命令。
- 必要預先設定：
  - Android 應用程式已連線並配對至閘道。
  - 應用程式維持在前景。
  - 已為你預期通過的能力授予權限/擷取同意。
- 選用目標覆寫：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 設定詳細資訊：[Android 應用程式](/zh-TW/platforms/android)

## 即時：模型冒煙測試（設定檔金鑰）

即時測試分成兩層，方便隔離失敗：

- 「直接模型」告訴我們提供者/模型能否用指定金鑰回應。
- 「閘道冒煙測試」告訴我們完整的閘道+代理程式管線是否可用於該模型（工作階段、歷史、工具、沙盒政策等）。

### 第 1 層：直接模型完成（無閘道）

- 測試：`src/agents/models.profiles.live.test.ts`
- 目標：
  - 列舉探索到的模型
  - 使用 `getApiKeyForModel` 選取你有憑證的模型
  - 每個模型執行一個小型完成（以及必要時的定向迴歸測試）
- 啟用方式：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 設定 `OPENCLAW_LIVE_MODELS=modern`、`small` 或 `all`（modern 的別名）才會實際執行此套件；否則會略過，以讓 `pnpm test:live` 專注於閘道冒煙測試
- 選取模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 會執行現代允許清單（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 5.1、MiniMax M3、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=small` 會執行受限的小型模型允許清單（Qwen 8B/9B 本機相容路由、Ollama Gemma、OpenRouter Qwen/GLM 與 Z.AI GLM）
  - `OPENCLAW_LIVE_MODELS=all` 是現代允許清單的別名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗號分隔允許清單）
  - 本機 Ollama 小型模型執行預設為 `http://127.0.0.1:11434`；只有 LAN、自訂或 Ollama Cloud 端點才設定 `OPENCLAW_LIVE_OLLAMA_BASE_URL`。
  - modern/all 與 small 掃描預設使用其精選上限；設定 `OPENCLAW_LIVE_MAX_MODELS=0` 以進行完整的所選設定檔掃描，或設定正數以使用較小上限。
  - 完整掃描會使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作為整個直接模型測試的逾時。預設：60 分鐘。
  - 直接模型探測預設以 20 路平行執行；設定 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 可覆寫。
- 選取提供者的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗號分隔允許清單）
- 金鑰來源：
  - 預設：設定檔儲存區與環境備援
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以強制只使用**設定檔儲存區**
- 存在原因：
  - 將「提供者 API 壞掉 / 金鑰無效」與「閘道代理程式管線壞掉」分開
  - 包含小型、隔離的迴歸測試（範例：OpenAI Responses/Codex Responses 推理重播 + 工具呼叫流程）

### 第 2 層：閘道 + 開發代理程式冒煙測試（「@openclaw」實際執行的內容）

- 測試：`src/gateway/gateway-models.profiles.live.test.ts`
- 目標：
  - 啟動程序內閘道
  - 建立/修補 `agent:dev:*` 工作階段（每次執行覆寫模型）
  - 逐一處理有金鑰的模型並斷言：
    - 「有意義的」回應（無工具）
    - 真正的工具叫用可運作（讀取探測）
    - 選用額外工具探測（執行+讀取探測）
    - OpenAI 迴歸路徑（僅工具呼叫 → 後續追問）持續運作
- 探測詳細資訊（方便你快速說明失敗）：
  - `read` 探測：測試會在工作區寫入 nonce 檔案，並要求代理程式 `read` 它再回顯 nonce。
  - `exec+read` 探測：測試要求代理程式用 `exec` 將 nonce 寫入暫存檔，再 `read` 回來。
  - 圖片探測：測試附加產生的 PNG（cat + 隨機程式碼），並預期模型回傳 `cat <CODE>`。
  - 實作參考：`src/gateway/gateway-models.profiles.live.test.ts` 與 `test/helpers/live-image-probe.ts`。
- 啟用方式：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 選取模型的方式：
  - 預設：現代允許清單（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M3、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` 會透過完整閘道+代理程式管線執行相同的受限小型模型允許清單
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是現代允許清單的別名
  - 或設定 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗號清單）來縮小範圍
  - modern/all 與 small 閘道掃描預設使用其精選上限；設定 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 以進行完整的所選掃描，或設定正數以使用較小上限。
- 選取提供者的方式（避免「OpenRouter 全部項目」）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗號分隔允許清單）
- 此即時測試一律啟用工具 + 圖片探測：
  - `read` 探測 + `exec+read` 探測（工具壓力測試）
  - 模型公告支援圖片輸入時會執行圖片探測
  - 流程（高層次）：
    - 測試產生帶有 "CAT" + 隨機代碼的小型 PNG（`test/helpers/live-image-probe.ts`）
    - 透過 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 傳送
    - 閘道將附件剖析成 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 內嵌代理程式將多模態使用者訊息轉送給模型
    - 斷言：回覆包含 `cat` + 該代碼（OCR 容錯：允許小錯誤）

<Tip>
若要查看你的機器可以測試什麼（以及精確的 `provider/model` ID），請執行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 即時：命令列介面後端冒煙測試（Claude、Gemini 或其他本機命令列介面）

- 測試：`src/gateway/gateway-cli-backend.live.test.ts`
- 目標：使用本機命令列介面後端驗證閘道 + 代理程式管線，而不觸碰你的預設設定。
- 後端專屬冒煙測試預設值位於擁有該後端的擴充功能 `cli-backend.ts` 定義。
- 啟用：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 預設值：
  - 預設提供者/模型：`claude-cli/claude-sonnet-4-6`
  - 命令/參數/圖片行為來自擁有該命令列介面後端外掛的中繼資料。
- 覆寫（選用）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 會傳送真正的圖片附件（路徑會注入提示中）。Docker 配方預設關閉此項，除非明確要求。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 會將圖片檔案路徑作為命令列介面參數傳遞，而不是注入提示。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用於控制設定 `IMAGE_ARG` 時圖片參數的傳遞方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 會傳送第二輪並驗證續接流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 會在所選模型支援切換目標時，選擇加入 Claude Sonnet -> Opus 同一工作階段連續性探測。Docker 配方基於整體可靠性預設關閉此項。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 會選擇加入 MCP/工具 loopback 探測。Docker 配方預設關閉此項，除非明確要求。

範例：

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

便宜的 Gemini MCP 設定冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

這不會要求 Gemini 產生回應。它會寫入 OpenClaw 提供給 Gemini 的相同系統
設定，然後執行 `gemini --debug mcp list`，以證明儲存的
`transport: "streamable-http"` 伺服器會正規化為 Gemini 的 HTTP MCP
形狀，並且能連線到本機 streamable-HTTP MCP 伺服器。

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
- 它會在 repo Docker 映像內，以非 root 的 `node` 使用者執行即時命令列介面後端冒煙測試。
- 它會從擁有該後端的擴充功能解析命令列介面冒煙測試中繼資料，然後將相符的 Linux 命令列介面套件（`@anthropic-ai/claude-code` 或 `@google/gemini-cli`）安裝到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的快取可寫前綴（預設：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可攜式 Claude Code 訂閱 OAuth，來源可以是含有 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json`，或來自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`。它會先證明 Docker 中的直接 `claude -p` 可用，然後在不保留 Anthropic API 金鑰環境變數的情況下，執行兩輪閘道命令列介面後端。此訂閱通道預設停用 Claude MCP/工具與圖片探測，因為 Claude 目前會透過額外用量計費路由第三方應用程式使用量，而不是使用一般訂閱方案限制。
- 即時命令列介面後端冒煙測試現在會對 Claude 與 Gemini 執行相同的端對端流程：文字輪次、圖片分類輪次，然後是透過閘道命令列介面驗證的 MCP `cron` 工具呼叫。
- Claude 的預設冒煙測試也會將工作階段從 Sonnet 修補為 Opus，並驗證續接的工作階段仍記得先前的筆記。

## 即時：APNs HTTP/2 Proxy 可達性

- 測試：`src/infra/push-apns-http2.live.test.ts`
- 目標：透過本機 HTTP CONNECT Proxy 通往 Apple 的沙盒 APNs 端點，傳送 APNs HTTP/2 驗證要求，並斷言 Apple 真實的 `403 InvalidProviderToken` 回應會透過 Proxy 路徑返回。
- 啟用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 選用逾時：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 即時：ACP 綁定冒煙測試（`/acp spawn ... --bind here`）

- 測試：`src/gateway/gateway-acp-bind.live.test.ts`
- 目標：使用即時 ACP agent 驗證真實的 ACP conversation-bind 流程：
  - 傳送 `/acp spawn <agent> --bind here`
  - 在原處繫結一個合成的 message-channel conversation
  - 在同一個 conversation 上傳送一般後續訊息
  - 驗證後續訊息落在已繫結的 ACP session transcript 中
- 啟用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 預設值：
  - Docker 中的 ACP agents：`claude,codex,gemini`
  - 直接執行 `pnpm test:live ...` 時的 ACP agent：`claude`
  - 合成頻道：Slack DM 樣式的 conversation context
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
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- 備註：
  - 此 lane 使用閘道 `chat.send` surface 搭配僅限管理員的合成 originating-route 欄位，讓測試可以附加 message-channel context，而不必假裝對外遞送。
  - 當 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 未設定時，測試會使用嵌入式 `acpx` 外掛內建的 agent registry，供所選 ACP harness agent 使用。
  - 已繫結 session 的排程 MCP 建立預設為 best-effort，因為外部 ACP harness 可能會在 bind/image proof 通過後取消 MCP 呼叫；設定 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可讓 bind 後的排程 probe 變成嚴格模式。

範例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker recipe：

```bash
pnpm test:docker:live-acp-bind
```

單一 agent Docker recipes：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 備註：

- Docker runner 位於 `scripts/test-live-acp-bind-docker.sh`。
- 預設會依序針對彙總的 live 命令列介面 agents 執行 ACP bind smoke：`claude`、`codex`，接著是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 來縮小 matrix。
- 它會將相符的命令列介面 auth material 暫存到容器中，接著在缺少時安裝要求的 live 命令列介面（`@anthropic-ai/claude-code`、`@openai/codex`、透過 `https://app.factory.ai/cli` 的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 後端本身是來自官方 `acpx` 外掛的嵌入式 `acpx/runtime` 套件。
- Droid Docker variant 會暫存 `~/.factory` 供設定使用、轉送 `FACTORY_API_KEY`，並且需要該 API key，因為本機 Factory OAuth/keyring auth 無法移植到容器中。它使用 ACPX 內建的 `droid exec --output-format acp` registry entry。
- OpenCode Docker variant 是嚴格的單一 agent regression lane。它會從 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（預設 `opencode/kimi-k2.6`）寫入暫時的 `OPENCODE_CONFIG_CONTENT` 預設模型，而 `pnpm test:docker:live-acp-bind:opencode` 需要已繫結的 assistant transcript，而不是接受通用的 bind 後 skip。
- 直接 `acpx` 命令列介面呼叫只是在閘道外比較行為的手動/ workaround 路徑。Docker ACP bind smoke 會測試 OpenClaw 的嵌入式 `acpx` runtime 後端。

## Live：Codex app-server harness smoke

- 目標：透過一般閘道
  `agent` method 驗證外掛擁有的 Codex harness：
  - 載入 bundled `codex` 外掛
  - 選取 `openai/gpt-5.5`，它預設會透過 Codex 路由 OpenAI agent turns
  - 在已選取 Codex harness 的情況下，將第一個閘道 agent turn 傳送至 `openai/gpt-5.5`
  - 將第二個 turn 傳送至同一個 OpenClaw session，並驗證 app-server
    thread 可以 resume
  - 透過同一個閘道 command path 執行 `/codex status` 和 `/codex models`
  - 可選擇執行兩個經 Guardian 審查的 escalated shell probes：一個應核准的良性
    command，以及一個應拒絕的假 secret upload，讓 agent 回問
- 測試：`src/gateway/gateway-codex-harness.live.test.ts`
- 啟用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 預設模型：`openai/gpt-5.5`
- 選用 image probe：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 選用 MCP/tool probe：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 選用 Guardian probe：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 此 smoke 會強制 provider/model `agentRuntime.id: "codex"`，讓破損的 Codex
  harness 無法透過靜默 fallback 到 OpenClaw 而通過。
- Auth：來自本機 Codex subscription login 的 Codex app-server auth。Docker
  smokes 在適用時也可以提供 `OPENAI_API_KEY` 供非 Codex probes 使用，
  以及選用複製的 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

本機 recipe：

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker recipe：

```bash
pnpm test:docker:live-codex-harness
```

Docker 備註：

- Docker runner 位於 `scripts/test-live-codex-harness-docker.sh`。
- 它會傳入 `OPENAI_API_KEY`、在存在時複製 Codex 命令列介面 auth files、將
  `@openai/codex` 安裝到可寫入掛載的 npm
  prefix、暫存 source tree，接著只執行 Codex-harness live test。
- Docker 預設會啟用 image、MCP/tool 和 Guardian probes。當你需要較窄的 debug
  run 時，請設定
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的明確 Codex runtime config，因此 legacy aliases 或 OpenClaw
  fallback 無法掩蓋 Codex harness regression。

### 建議的 live recipes

狹窄且明確的 allowlists 最快也最不容易 flaky：

- 單一模型，直接（無閘道）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小模型直接 profile：
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小模型閘道 profile：
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API smoke：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 單一模型，閘道 smoke：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多個 providers 的 tool calling：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 直接 smoke：
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google focus（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke：
  - Gemini 3 dynamic default：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

備註：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 樣式的 agent endpoint）。
- `google-gemini-cli/...` 使用你機器上的本機 Gemini 命令列介面（獨立 auth + tooling quirks）。
- Gemini API vs Gemini 命令列介面：
  - API：OpenClaw 透過 HTTP 呼叫 Google 託管的 Gemini API（API key / profile auth）；這是多數使用者所說的「Gemini」。
  - 命令列介面：OpenClaw shell out 到本機 `gemini` binary；它有自己的 auth，且行為可能不同（streaming/tool support/version skew）。

## Live：model matrix（涵蓋範圍）

沒有固定的「CI model list」（live 是 opt-in），但以下是建議在具備 keys 的 dev machine 上定期涵蓋的**建議**模型。

### Modern smoke set（tool calling + image）

這是我們預期保持可用的「common models」run：

- OpenAI（非 Codex）：`openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免較舊的 Gemini 2.x models）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-5.1`（general API）或 `zai/glm-5.2`（Coding Plan）
- MiniMax：`minimax/MiniMax-M3`

使用 tools + image 執行閘道 smoke：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline：tool calling（Read + optional Exec）

每個 provider family 至少選一個：

- OpenAI：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-5.1`（general API）或 `zai/glm-5.2`（Coding Plan）
- MiniMax：`minimax/MiniMax-M3`

選用的額外涵蓋範圍（有的話很好）：

- xAI：`xai/grok-4.3`（或 latest available）
- Mistral：`mistral/`…（選取一個你已啟用且支援 "tools" 的模型）
- Cerebras：`cerebras/`…（如果你有 access）
- LM Studio：`lmstudio/`…（local；tool calling 取決於 API mode）

### Vision：image send（attachment → multimodal message）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一個具備 image-capable 的模型（Claude/Gemini/OpenAI vision-capable variants 等），以測試 image probe。

### Aggregators / alternate gateways

如果你已啟用 keys，我們也支援透過以下項目測試：

- OpenRouter：`openrouter/...`（數百個模型；使用 `openclaw models scan` 尋找具備 tool+image 能力的 candidates）
- OpenCode：`opencode/...` 用於 Zen，`opencode-go/...` 用於 Go（透過 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 進行 auth）

更多可納入 live matrix 的 providers（如果你有 creds/config）：

- 內建：`openai`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 透過 `models.providers`（自訂端點）：`minimax`（雲端/API），以及任何 OpenAI/Anthropic 相容代理（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文件中硬編碼「所有模型」。權威清單是你的機器上 `discoverModels(...)` 回傳的內容，加上可用的任何金鑰。
</Tip>

## 憑證（永遠不要提交）

即時測試會用與命令列介面相同的方式探索憑證。實務影響：

- 如果命令列介面可用，即時測試也應該找到相同金鑰。
- 如果即時測試顯示「沒有憑證」，請用你除錯 `openclaw models list` / 模型選擇的相同方式除錯。

- 每個代理程式的驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（這就是即時測試中「設定檔金鑰」的意思）
- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 舊版狀態目錄：`~/.openclaw/credentials/`（存在時會複製到暫存的即時測試 home，但不是主要的設定檔金鑰儲存區）
- 本機即時執行預設會將作用中的設定、每個代理程式的 `auth-profiles.json` 檔案、舊版 `credentials/`，以及支援的外部命令列介面驗證目錄複製到暫存測試 home；暫存的即時 home 會略過 `workspace/` 和 `sandboxes/`，並移除 `agents.*.workspace` / `agentDir` 路徑覆寫，讓探測不會碰到你真實主機的工作區。

如果你想依賴環境金鑰，請在本機測試前匯出它們，或使用下方的
Docker 執行器並明確設定 `OPENCLAW_PROFILE_FILE`。

## Deepgram 即時（音訊轉錄）

- 測試：`extensions/deepgram/audio.live.test.ts`
- 啟用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 程式碼規劃即時測試

- 測試：`extensions/byteplus/live.test.ts`
- 啟用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 選用模型覆寫：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流程媒體即時測試

- 測試：`extensions/comfy/comfy.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 範圍：
  - 測試內建的 comfy 圖像、影片和 `music_generate` 路徑
  - 除非已設定 `plugins.entries.comfy.config.<capability>`，否則會略過每項能力
  - 適合在變更 comfy 工作流程提交、輪詢、下載或外掛註冊後使用

## 圖像生成即時測試

- 測試：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 測試框架：`pnpm test:live:media image`
- 範圍：
  - 列舉每個已註冊的圖像生成供應商外掛
  - 探測前先使用已匯出的供應商環境變數
  - 預設優先使用即時/環境 API 金鑰，再使用已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 憑證
  - 略過沒有可用驗證/設定檔/模型的供應商
  - 透過共用圖像生成執行階段執行每個已設定供應商：
    - `<provider>:generate`
    - 當供應商宣告支援編輯時執行 `<provider>:edit`
- 目前涵蓋的內建供應商：
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制使用設定檔儲存區驗證，並忽略僅限環境的覆寫

對於已發布的命令列介面路徑，請在供應商/執行階段即時測試通過後，加入一個 `infer` 冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

這會涵蓋命令列介面引數解析、設定/預設代理程式解析、內建
外掛啟用、共用圖像生成執行階段，以及即時供應商
請求。外掛相依項應在執行階段載入前就已存在。

## 音樂生成即時測試

- 測試：`extensions/music-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media music`
- 範圍：
  - 測試共用的內建音樂生成供應商路徑
  - 目前涵蓋 Google 和 MiniMax
  - 探測前先使用已匯出的供應商環境變數
  - 預設優先使用即時/環境 API 金鑰，再使用已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 憑證
  - 略過沒有可用驗證/設定檔/模型的供應商
  - 可用時執行兩種已宣告的執行階段模式：
    - 使用僅提示輸入的 `generate`
    - 當供應商宣告 `capabilities.edit.enabled` 時執行 `edit`
  - 目前共用路徑涵蓋範圍：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：獨立的 Comfy 即時檔案，不屬於這個共用掃描
- 選用縮小範圍：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 選用驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制使用設定檔儲存區驗證，並忽略僅限環境的覆寫

## 影片生成即時測試

- 測試：`extensions/video-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media video`
- 範圍：
  - 測試共用的內建影片生成供應商路徑
  - 預設使用發布安全的冒煙路徑：非 FAL 供應商、每個供應商一個文字轉影片請求、一秒龍蝦提示，以及來自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每個供應商操作上限（預設為 `180000`）
  - 預設略過 FAL，因為供應商端佇列延遲可能主導發布時間；傳入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可明確執行它
  - 探測前先使用已匯出的供應商環境變數
  - 預設優先使用即時/環境 API 金鑰，再使用已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 憑證
  - 略過沒有可用驗證/設定檔/模型的供應商
  - 預設只執行 `generate`
  - 設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 以同時執行可用的已宣告轉換模式：
    - 當供應商宣告 `capabilities.imageToVideo.enabled`，且選取的供應商/模型在共用掃描中接受以緩衝區支援的本機圖像輸入時，執行 `imageToVideo`
    - 當供應商宣告 `capabilities.videoToVideo.enabled`，且選取的供應商/模型在共用掃描中接受以緩衝區支援的本機影片輸入時，執行 `videoToVideo`
  - 目前在共用掃描中已宣告但略過的 `imageToVideo` 供應商：
    - `vydra`，因為內建 `veo3` 僅支援文字，而內建 `kling` 需要遠端圖像 URL
  - 供應商特定的 Vydra 涵蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 該檔案預設會執行 `veo3` 文字轉影片，以及使用遠端圖像 URL fixture 的 `kling` 路徑
  - 目前 `videoToVideo` 即時涵蓋範圍：
    - 僅在選取的模型為 `runway/gen4_aleph` 時執行 `runway`
  - 目前在共用掃描中已宣告但略過的 `videoToVideo` 供應商：
    - `alibaba`、`qwen`、`xai`，因為這些路徑目前需要遠端 `http(s)` / MP4 參考 URL
    - `google`，因為目前共用的 Gemini/Veo 路徑使用以本機緩衝區支援的輸入，而共用掃描不接受該路徑
    - `openai`，因為目前共用路徑缺少組織特定影片編輯存取保證
- 選用縮小範圍：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 可在預設掃描中包含每個供應商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 可降低每個供應商的操作上限，以進行更積極的冒煙測試
- 選用驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制使用設定檔儲存區驗證，並忽略僅限環境的覆寫

## 媒體即時測試框架

- 命令：`pnpm test:live:media`
- 目的：
  - 透過一個 repo 原生進入點執行共用的圖像、音樂和影片即時測試套件
  - 使用已匯出的供應商環境變數
  - 預設會自動將每個套件縮小到目前具有可用驗證的供應商
  - 重用 `scripts/test-live.mjs`，因此心跳偵測和安靜模式行為會保持一致
- 範例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相關

- [測試](/zh-TW/help/testing) - 單元、整合、QA 和 Docker 套件
