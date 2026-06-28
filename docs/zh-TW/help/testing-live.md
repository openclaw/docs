---
read_when:
    - 執行即時模型矩陣 / 命令列介面後端 / ACP / 媒體提供者冒煙測試
    - 偵錯即時測試憑證解析
    - 新增供應商特定的即時測試
sidebarTitle: Live tests
summary: 即時（會觸及網路）測試：模型矩陣、命令列介面後端、ACP、媒體提供者、憑證
title: 測試：即時套件
x-i18n:
    generated_at: "2026-06-28T20:43:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

如需快速開始、QA 執行器、單元/整合套件與 Docker 流程，請參閱
[測試](/zh-TW/help/testing)。本頁涵蓋**即時**（會觸及網路）的測試
套件：模型矩陣、命令列介面後端、ACP，以及媒體提供者即時測試，另含
憑證處理。

## 即時：本機煙霧測試命令

在臨時即時檢查前，請在程序環境中匯出所需的提供者金鑰。

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

除非同時提供 `--yes`，否則 `voicecall smoke` 是乾跑。只有在你刻意想發出
真實通知通話時才使用 `--yes`。對 Twilio、Telnyx 和 Plivo 而言，成功的就緒檢查
需要公開的網路鉤子 URL；僅本機 loopback/私有備援會依設計遭到拒絕。

## 即時：Android 節點能力掃描

- 測試：`src/gateway/android-node.capabilities.live.test.ts`
- 指令碼：`pnpm android:test:integration`
- 目標：叫用已連線 Android 節點**目前宣告的每個命令**，並斷言命令合約行為。
- 範圍：
  - 需預先處理/手動設定（此套件不會安裝/執行/配對應用程式）。
  - 針對所選 Android 節點逐一驗證閘道 `node.invoke` 命令。
- 必要預先設定：
  - Android 應用程式已連線並配對到閘道。
  - 應用程式保持在前景。
  - 針對你預期會通過的能力，已授予權限/擷取同意。
- 選用目標覆寫：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 設定詳細資料：[Android 應用程式](/zh-TW/platforms/android)

## 即時：模型煙霧測試（設定檔金鑰）

即時測試分成兩層，讓我們可以隔離失敗：

- 「直接模型」告訴我們提供者/模型是否完全能用指定金鑰回答。
- 「閘道煙霧測試」告訴我們該模型的完整閘道+代理程式管線是否運作（工作階段、歷史記錄、工具、沙箱政策等）。

### 第 1 層：直接模型補全（無閘道）

- 測試：`src/agents/models.profiles.live.test.ts`
- 目標：
  - 列舉已探索到的模型
  - 使用 `getApiKeyForModel` 選取你有憑證的模型
  - 每個模型執行一次小型補全（並在需要時執行定向迴歸測試）
- 啟用方式：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 設定 `OPENCLAW_LIVE_MODELS=modern`、`small` 或 `all`（modern 的別名）才會實際執行此套件；否則會略過，以讓 `pnpm test:live` 專注於閘道煙霧測試
- 選取模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 執行現代允許清單（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 5.1、MiniMax M3、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=small` 執行受限小型模型允許清單（Qwen 8B/9B 本機相容路由、Ollama Gemma、OpenRouter Qwen/GLM，以及 Z.AI GLM）
  - `OPENCLAW_LIVE_MODELS=all` 是現代允許清單的別名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗號允許清單）
  - 本機 Ollama 小型模型執行預設為 `http://127.0.0.1:11434`；只有在使用 LAN、自訂或 Ollama Cloud 端點時才設定 `OPENCLAW_LIVE_OLLAMA_BASE_URL`。
  - modern/all 與 small 掃描預設使用其精選上限；若要進行完整所選設定檔掃描，請設定 `OPENCLAW_LIVE_MAX_MODELS=0`，或設定正數作為較小上限。
  - 完整掃描會使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作為整個直接模型測試逾時。預設：60 分鐘。
  - 直接模型探測預設以 20 路平行執行；設定 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 可覆寫。
- 選取提供者的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗號允許清單）
- 金鑰來源：
  - 預設：設定檔儲存區與環境備援
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制僅使用**設定檔儲存區**
- 存在原因：
  - 將「提供者 API 壞了 / 金鑰無效」與「閘道代理程式管線壞了」分離
  - 包含小型、隔離的迴歸測試（範例：OpenAI Responses/Codex Responses 推理重播 + 工具呼叫流程）

### 第 2 層：閘道 + 開發代理程式煙霧測試（「@openclaw」實際做的事）

- 測試：`src/gateway/gateway-models.profiles.live.test.ts`
- 目標：
  - 啟動程序內閘道
  - 建立/修補 `agent:dev:*` 工作階段（每次執行覆寫模型）
  - 逐一處理有金鑰的模型並斷言：
    - 「有意義」的回應（無工具）
    - 真實工具叫用可運作（讀取探測）
    - 選用額外工具探測（執行+讀取探測）
    - OpenAI 迴歸路徑（僅工具呼叫 → 後續回合）持續運作
- 探測詳細資料（讓你可以快速說明失敗）：
  - `read` 探測：測試會在工作區寫入 nonce 檔案，並要求代理程式 `read` 它且回傳該 nonce。
  - `exec+read` 探測：測試要求代理程式用 `exec` 將 nonce 寫入暫存檔，接著 `read` 回來。
  - 圖片探測：測試附加產生的 PNG（cat + 隨機碼），並預期模型回傳 `cat <CODE>`。
  - 實作參考：`src/gateway/gateway-models.profiles.live.test.ts` 與 `test/helpers/live-image-probe.ts`。
- 啟用方式：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 選取模型的方式：
  - 預設：現代允許清單（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M3、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` 透過完整閘道+代理程式管線執行相同受限小型模型允許清單
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是現代允許清單的別名
  - 或設定 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗號清單）以縮小範圍
  - modern/all 與 small 閘道掃描預設使用其精選上限；若要進行完整所選掃描，請設定 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`，或設定正數作為較小上限。
- 選取提供者的方式（避免「OpenRouter 全部」）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗號允許清單）
- 此即時測試一律啟用工具 + 圖片探測：
  - `read` 探測 + `exec+read` 探測（工具壓力）
  - 模型宣告支援圖片輸入時執行圖片探測
  - 流程（高層次）：
    - 測試產生含有「CAT」+ 隨機碼的小型 PNG（`test/helpers/live-image-probe.ts`）
    - 透過 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 傳送
    - 閘道將附件解析成 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式代理程式將多模態使用者訊息轉送給模型
    - 斷言：回覆包含 `cat` + 該代碼（OCR 容忍度：允許小錯誤）

<Tip>
若要查看你機器上可測試的項目（以及精確的 `provider/model` ID），請執行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 即時：命令列介面後端煙霧測試（Claude、Gemini 或其他本機命令列介面）

- 測試：`src/gateway/gateway-cli-backend.live.test.ts`
- 目標：使用本機命令列介面後端驗證閘道 + 代理程式管線，且不觸及你的預設設定。
- 後端專屬的煙霧測試預設值位於擁有它的擴充功能 `cli-backend.ts` 定義中。
- 啟用：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 預設：
  - 預設提供者/模型：`claude-cli/claude-sonnet-4-6`
  - 命令/引數/圖片行為來自擁有該命令列介面後端的外掛中繼資料。
- 覆寫（選用）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 傳送真實圖片附件（路徑會注入提示中）。Docker 配方預設關閉此項，除非明確要求。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 將圖片檔案路徑作為命令列介面引數傳入，而非注入提示。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制設定 `IMAGE_ARG` 時傳遞圖片引數的方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 傳送第二回合並驗證恢復流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 在所選模型支援切換目標時，選擇啟用 Claude Sonnet -> Opus 同工作階段連續性探測。Docker 配方預設關閉此項，以提高彙總可靠性。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 選擇啟用 MCP/工具迴路探測。Docker 配方預設關閉此項，除非明確要求。

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

這不會要求 Gemini 產生回應。它會寫入 OpenClaw 提供給 Gemini 的相同系統
設定，然後執行 `gemini --debug mcp list`，以證明已儲存的
`transport: "streamable-http"` 伺服器會正規化為 Gemini 的 HTTP MCP
形狀，且可以連線到本機 streamable-HTTP MCP 伺服器。

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
- 它會在 repo Docker 映像中，以非 root 的 `node` 使用者執行即時命令列介面後端煙霧測試。
- 它會從擁有者擴充功能解析命令列介面煙霧測試中繼資料，然後將相符的 Linux 命令列介面套件（`@anthropic-ai/claude-code` 或 `@google/gemini-cli`）安裝到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的已快取可寫入前綴（預設：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可攜式 Claude Code 訂閱 OAuth，可透過含有 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json`，或來自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`。它會先在 Docker 中證明直接 `claude -p`，接著在不保留 Anthropic API 金鑰環境變數的情況下執行兩個閘道命令列介面後端回合。此訂閱路線預設停用 Claude MCP/工具與圖片探測，因為它會消耗已登入訂閱的使用額度，且 Anthropic 可以在沒有 OpenClaw 發版的情況下變更 Claude Agent SDK / `claude -p` 計費與速率限制行為。
- 即時命令列介面後端煙霧測試現在會針對 Claude 和 Gemini 執行相同的端對端流程：文字回合、圖片分類回合，接著是透過閘道命令列介面驗證的 MCP `cron` 工具呼叫。
- Claude 的預設煙霧測試也會將工作階段從 Sonnet 修補到 Opus，並驗證恢復的工作階段仍記得先前的筆記。

## 即時：APNs HTTP/2 代理可達性

- 測試：`src/infra/push-apns-http2.live.test.ts`
- 目標：透過本機 HTTP CONNECT 代理通道連到 Apple 的沙箱 APNs 端點，傳送 APNs HTTP/2 驗證請求，並斷言 Apple 真實的 `403 InvalidProviderToken` 回應會透過代理路徑回來。
- 啟用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 選用逾時：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## 即時：ACP 綁定煙霧測試（`/acp spawn ... --bind here`）

- 測試：`src/gateway/gateway-acp-bind.live.test.ts`
- 目標：使用實際 ACP 代理驗證真實 ACP 對話綁定流程：
  - 傳送 `/acp spawn <agent> --bind here`
  - 就地綁定一個合成的訊息頻道對話
  - 在同一個對話上傳送一般後續訊息
  - 驗證後續訊息落入已綁定的 ACP 工作階段逐字稿
- 啟用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 預設值：
  - Docker 中的 ACP 代理：`claude,codex,gemini`
  - 直接執行 `pnpm test:live ...` 時的 ACP 代理：`claude`
  - 合成頻道：Slack DM 風格的對話情境
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
  - 此通道使用閘道 `chat.send` 介面，搭配僅限管理員使用的合成來源路由欄位，讓測試可以附加訊息頻道情境，而不必假裝向外部遞送。
  - 未設定 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 時，測試會使用內嵌 `acpx` 外掛的內建代理登錄，選取指定的 ACP harness 代理。
  - 已綁定工作階段的排程 MCP 建立預設為盡力而為，因為外部 ACP harness 可能在綁定/圖片證明通過後取消 MCP 呼叫；設定 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可讓綁定後的排程探測變為嚴格模式。

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

單一代理 Docker 配方：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 備註：

- Docker 執行器位於 `scripts/test-live-acp-bind-docker.sh`。
- 預設情況下，它會依序針對彙總的即時命令列介面代理執行 ACP 綁定冒煙測試：`claude`、`codex`，接著是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`，或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 來縮小矩陣。
- 它會將相符的命令列介面驗證資料暫置到容器中，然後在缺少時安裝要求的即時命令列介面（`@anthropic-ai/claude-code`、`@openai/codex`、透過 `https://app.factory.ai/cli` 的 Factory Droid、`@google/gemini-cli`，或 `opencode-ai`）。ACP 後端本身是官方 `acpx` 外掛中內嵌的 `acpx/runtime` 套件。
- Droid Docker 變體會暫置 `~/.factory` 以取得設定、轉送 `FACTORY_API_KEY`，並要求該 API 金鑰，因為本機 Factory OAuth/keyring 驗證無法攜入容器。它使用 ACPX 內建的 `droid exec --output-format acp` 登錄項目。
- OpenCode Docker 變體是嚴格的單一代理迴歸通道。它會從 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（預設 `opencode/kimi-k2.6`）寫入暫時的 `OPENCODE_CONFIG_CONTENT` 預設模型，而 `pnpm test:docker:live-acp-bind:opencode` 會要求已綁定的助理逐字稿，而不是接受一般的綁定後略過。
- 直接的 `acpx` 命令列介面呼叫只是在閘道外比較行為的手動/因應路徑。Docker ACP 綁定冒煙測試會測試 OpenClaw 的內嵌 `acpx` runtime 後端。

## 即時：Codex app-server harness 冒煙測試

- 目標：透過一般閘道
  `agent` 方法驗證外掛所擁有的 Codex harness：
  - 載入內建的 `codex` 外掛
  - 選取 `openai/gpt-5.5`，這會依預設將 OpenAI 代理回合路由到 Codex
  - 將第一個閘道代理回合傳送到 `openai/gpt-5.5`，並選取 Codex harness
  - 將第二個回合傳送到同一個 OpenClaw 工作階段，並驗證 app-server
    執行緒可以恢復
  - 透過同一個閘道命令路徑執行 `/codex status` 和 `/codex models`
  - 可選擇執行兩個經 Guardian 審核的提權 shell 探測：一個應核准的良性
    命令，以及一個應被拒絕、讓代理回問的假秘密上傳
- 測試：`src/gateway/gateway-codex-harness.live.test.ts`
- 啟用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 預設模型：`openai/gpt-5.5`
- 可選圖片探測：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可選 MCP/工具探測：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可選 Guardian 探測：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 此冒煙測試會強制 provider/model `agentRuntime.id: "codex"`，因此損壞的 Codex
  harness 無法透過靜默退回 OpenClaw 而通過。
- 驗證：來自本機 Codex 訂閱登入的 Codex app-server 驗證。Docker
  冒煙測試在適用時也可以提供 `OPENAI_API_KEY` 給非 Codex 探測，
  以及可選複製的 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

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

Docker 備註：

- Docker 執行器位於 `scripts/test-live-codex-harness-docker.sh`。
- 它會傳入 `OPENAI_API_KEY`、在存在時複製 Codex 命令列介面驗證檔案、將
  `@openai/codex` 安裝到可寫入的掛載 npm
  prefix、暫置原始碼樹，然後只執行 Codex-harness 即時測試。
- Docker 預設啟用圖片、MCP/工具與 Guardian 探測。需要較窄的偵錯
  執行時，設定 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的明確 Codex runtime 設定，因此舊別名或 OpenClaw
  後援無法掩蓋 Codex harness 迴歸。

### 建議的即時配方

狹窄、明確的允許清單最快且最不易不穩定：

- 單一模型，直接（無閘道）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型模型直接 profile：
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型模型閘道 profile：
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API 冒煙測試：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 單一模型，閘道冒煙測試：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多個 provider 的工具呼叫：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 直接冒煙測試：
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google 聚焦（Gemini API 金鑰 + Antigravity）：
  - Gemini（API 金鑰）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 自適應思考冒煙測試：
  - Gemini 3 動態預設：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動態預算：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

備註：

- `google/...` 使用 Gemini API（API 金鑰）。
- `google-antigravity/...` 使用 Antigravity OAuth 橋接（Cloud Code Assist 風格的代理端點）。
- `google-gemini-cli/...` 使用你機器上的本機 Gemini 命令列介面（獨立驗證 + 工具行為差異）。
- Gemini API 與 Gemini 命令列介面：
  - API：OpenClaw 透過 HTTP 呼叫 Google 託管的 Gemini API（API 金鑰 / profile 驗證）；這是多數使用者所說的「Gemini」。
  - 命令列介面：OpenClaw shell 到本機 `gemini` 二進位檔；它有自己的驗證，且行為可能不同（串流/工具支援/版本偏差）。

## 即時：模型矩陣（涵蓋範圍）

沒有固定的「CI 模型清單」（即時測試為選擇性啟用），但這些是建議在具備金鑰的開發機器上定期涵蓋的**建議**模型。

### 現代冒煙集合（工具呼叫 + 圖片）

這是我們預期維持正常運作的「常見模型」執行：

- OpenAI（非 Codex）：`openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免較舊的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-5.1`（一般 API）或 `zai/glm-5.2`（Coding Plan）
- MiniMax：`minimax/MiniMax-M3`

使用工具 + 圖片執行閘道冒煙測試：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基準：工具呼叫（Read + 可選 Exec）

每個 provider 家族至少挑選一個：

- OpenAI：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-5.1`（一般 API）或 `zai/glm-5.2`（Coding Plan）
- MiniMax：`minimax/MiniMax-M3`

可選的額外涵蓋範圍（有的話更好）：

- xAI：`xai/grok-4.3`（或最新可用版本）
- Mistral：`mistral/`…（挑選一個你已啟用且支援「工具」的模型）
- Cerebras：`cerebras/`…（如果你有存取權）
- LM Studio：`lmstudio/`…（本機；工具呼叫取決於 API 模式）

### 視覺：圖片傳送（附件 → 多模態訊息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中包含至少一個支援圖片的模型（Claude/Gemini/OpenAI 支援視覺的變體等），以測試圖片探測。

### Aggregators / 替代閘道

如果你已啟用金鑰，我們也支援透過以下方式測試：

- OpenRouter：`openrouter/...`（數百個模型；使用 `openclaw models scan` 尋找支援工具 + 圖片的候選模型）
- OpenCode：`opencode/...` 用於 Zen，`opencode-go/...` 用於 Go（透過 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 驗證）

你可以納入即時矩陣的更多 provider（如果你有憑證/設定）：

- 內建：`openai`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 透過 `models.providers`（自訂端點）：`minimax`（雲端/API），以及任何 OpenAI/Anthropic 相容代理（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文件中硬編碼「所有模型」。權威清單是你機器上 `discoverModels(...)` 傳回的內容，加上可用的金鑰。
</Tip>

## 認證資料（切勿提交）

即時測試會用和命令列介面相同的方式探索認證資料。實務上的影響：

- 如果命令列介面可運作，即時測試應該也能找到相同的金鑰。
- 如果即時測試顯示「沒有認證資料」，請用你除錯 `openclaw models list` / 模型選擇的相同方式除錯。

- 每代理認證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（這就是即時測試中「設定檔金鑰」的意思）
- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 舊版狀態目錄：`~/.openclaw/credentials/`（存在時會複製到暫存的即時測試家目錄，但不是主要的設定檔金鑰儲存區）
- 本機即時執行預設會將作用中的設定、每代理 `auth-profiles.json` 檔案、舊版 `credentials/`，以及支援的外部命令列介面認證目錄複製到暫存測試家目錄；暫存即時家目錄會略過 `workspace/` 和 `sandboxes/`，並移除 `agents.*.workspace` / `agentDir` 路徑覆寫，讓探測不會碰到你真實主機的工作區。

如果你想依賴環境金鑰，請在本機測試前匯出它們，或使用下方的
Docker 執行器並明確指定 `OPENCLAW_PROFILE_FILE`。

## Deepgram 即時測試（音訊轉錄）

- 測試：`extensions/deepgram/audio.live.test.ts`
- 啟用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 編碼計畫即時測試

- 測試：`extensions/byteplus/live.test.ts`
- 啟用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 選用模型覆寫：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流程媒體即時測試

- 測試：`extensions/comfy/comfy.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 範圍：
  - 測試 bundled comfy 的圖片、影片和 `music_generate` 路徑
  - 除非已設定 `plugins.entries.comfy.config.<capability>`，否則略過各項能力
  - 適合在變更 comfy 工作流程提交、輪詢、下載或外掛註冊後使用

## 圖片生成即時測試

- 測試：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 測試框架：`pnpm test:live:media image`
- 範圍：
  - 列舉每個已註冊的圖片生成提供者外掛
  - 在探測前使用已匯出的提供者環境變數
  - 預設會優先使用即時/環境 API 金鑰，再使用已儲存的認證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 認證資料
  - 略過沒有可用認證/設定檔/模型的提供者
  - 讓每個已設定的提供者通過共用圖片生成執行階段：
    - `<provider>:generate`
    - 當提供者宣告支援編輯時，執行 `<provider>:edit`
- 目前涵蓋的 bundled 提供者：
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
- 選用認證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於強制使用設定檔儲存區認證，並忽略僅環境變數的覆寫

對於已發布的命令列介面路徑，在提供者/執行階段即時測試通過後，
新增一個 `infer` 冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

這涵蓋命令列介面引數解析、設定/預設代理解析、bundled
外掛啟用、共用圖片生成執行階段，以及即時提供者
請求。外掛相依項應在執行階段載入前就已存在。

## 音樂生成即時測試

- 測試：`extensions/music-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media music`
- 範圍：
  - 測試共用 bundled 音樂生成提供者路徑
  - 目前涵蓋 Google 和 MiniMax
  - 在探測前使用已匯出的提供者環境變數
  - 預設會優先使用即時/環境 API 金鑰，再使用已儲存的認證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 認證資料
  - 略過沒有可用認證/設定檔/模型的提供者
  - 可用時執行兩種已宣告的執行階段模式：
    - 使用只有提示詞的輸入執行 `generate`
    - 當提供者宣告 `capabilities.edit.enabled` 時執行 `edit`
  - 目前共用通道涵蓋：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：獨立的 Comfy 即時測試檔案，不在這個共用掃描中
- 選用縮小範圍：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 選用認證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於強制使用設定檔儲存區認證，並忽略僅環境變數的覆寫

## 影片生成即時測試

- 測試：`extensions/video-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media video`
- 範圍：
  - 測試共用 bundled 影片生成提供者路徑
  - 預設採用發布安全的冒煙測試路徑：非 FAL 提供者、每個提供者一個文字轉影片請求、一秒鐘龍蝦提示詞，以及來自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每提供者操作上限（預設為 `180000`）
  - 預設略過 FAL，因為提供者端佇列延遲可能主導發布時間；傳入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可明確執行它
  - 在探測前使用已匯出的提供者環境變數
  - 預設會優先使用即時/環境 API 金鑰，再使用已儲存的認證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 認證資料
  - 略過沒有可用認證/設定檔/模型的提供者
  - 預設只執行 `generate`
  - 設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，即可在可用時也執行已宣告的轉換模式：
    - 當提供者宣告 `capabilities.imageToVideo.enabled`，且所選提供者/模型在共用掃描中接受以緩衝區支援的本機圖片輸入時，執行 `imageToVideo`
    - 當提供者宣告 `capabilities.videoToVideo.enabled`，且所選提供者/模型在共用掃描中接受以緩衝區支援的本機影片輸入時，執行 `videoToVideo`
  - 目前在共用掃描中已宣告但略過的 `imageToVideo` 提供者：
    - `vydra`，因為 bundled `veo3` 僅支援文字，而 bundled `kling` 需要遠端圖片 URL
  - 提供者專屬的 Vydra 涵蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 該檔案會執行 `veo3` 文字轉影片，以及預設使用遠端圖片 URL fixture 的 `kling` 通道
  - 目前 `videoToVideo` 即時測試涵蓋範圍：
    - 僅在所選模型為 `runway/gen4_aleph` 時涵蓋 `runway`
  - 目前在共用掃描中已宣告但略過的 `videoToVideo` 提供者：
    - `alibaba`、`qwen`、`xai`，因為這些路徑目前需要遠端 `http(s)` / MP4 參照 URL
    - `google`，因為目前共用 Gemini/Veo 通道使用本機緩衝區支援的輸入，而該路徑在共用掃描中不被接受
    - `openai`，因為目前共用通道缺少特定組織的影片編輯存取保證
- 選用縮小範圍：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 用於在預設掃描中包含每個提供者，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 用於在積極的冒煙測試執行中降低每個提供者的操作上限
- 選用認證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於強制使用設定檔儲存區認證，並忽略僅環境變數的覆寫

## 媒體即時測試框架

- 命令：`pnpm test:live:media`
- 目的：
  - 透過單一 repo 原生命令入口執行共用圖片、音樂和影片即時測試套件
  - 使用已匯出的提供者環境變數
  - 預設自動將各套件縮小到目前具有可用認證的提供者
  - 重用 `scripts/test-live.mjs`，因此心跳偵測和安靜模式行為會保持一致
- 範例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相關

- [測試](/zh-TW/help/testing) - 單元、整合、QA 和 Docker 套件
