---
read_when:
    - 執行即時模型矩陣 / CLI 後端 / ACP / media-provider 煙霧測試
    - 偵錯即時測試認證資訊解析
    - 新增提供者專屬的即時測試
sidebarTitle: Live tests
summary: 真實（會觸及網路的）測試：模型矩陣、CLI 後端、ACP、媒體提供者、憑證
title: 測試：即時測試套件
x-i18n:
    generated_at: "2026-04-30T03:12:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

若要快速開始、QA 執行器、單元/整合套件與 Docker 流程，請參閱
[測試](/zh-TW/help/testing)。本頁涵蓋**即時**（會觸及網路的）測試
套件：模型矩陣、CLI 後端、ACP 與媒體提供者即時測試，以及
憑證處理。

## 即時：本機設定檔煙霧測試命令

在臨時即時檢查前先載入 `~/.profile`，讓提供者金鑰與本機工具
路徑符合你的 shell：

```bash
source ~/.profile
```

安全媒體煙霧測試：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全語音通話就緒煙霧測試：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

除非同時提供 `--yes`，否則 `voicecall smoke` 是 dry run。只有在你刻意要撥出真實通知電話時才使用 `--yes`。對 Twilio、Telnyx 與 Plivo 而言，成功的就緒檢查需要公開 Webhook URL；local-only loopback/私人備援會依設計被拒絕。

## 即時：Android Node 能力掃描

- 測試：`src/gateway/android-node.capabilities.live.test.ts`
- 指令碼：`pnpm android:test:integration`
- 目標：叫用已連線 Android Node **目前公告的每個命令**，並斷言命令合約行為。
- 範圍：
  - 已預先設定/手動設定（此套件不會安裝/執行/配對應用程式）。
  - 針對所選 Android Node 逐一驗證 Gateway `node.invoke` 命令。
- 必要預先設定：
  - Android 應用程式已連線並配對到 Gateway。
  - 應用程式保持在前景。
  - 針對你預期通過的能力，已授予權限/擷取同意。
- 可選目標覆寫：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 設定詳細資料：[Android 應用程式](/zh-TW/platforms/android)

## 即時：模型煙霧測試（設定檔金鑰）

即時測試分成兩層，讓我們可以隔離失敗：

- 「直接模型」告訴我們提供者/模型是否能用給定金鑰回應。
- 「Gateway 煙霧測試」告訴我們該模型的完整 gateway+agent 管線是否能運作（工作階段、歷程、工具、沙箱政策等）。

### 第 1 層：直接模型補全（無 Gateway）

- 測試：`src/agents/models.profiles.live.test.ts`
- 目標：
  - 列舉探索到的模型
  - 使用 `getApiKeyForModel` 選取你有憑證的模型
  - 每個模型執行一次小型補全（並在需要時執行目標式迴歸測試）
- 如何啟用：
  - `pnpm test:live`（或若直接叫用 Vitest，使用 `OPENCLAW_LIVE_TEST=1`）
- 設定 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，modern 的別名）才會實際執行此套件；否則它會略過，讓 `pnpm test:live` 專注於 Gateway 煙霧測試
- 如何選取模型：
  - `OPENCLAW_LIVE_MODELS=modern` 可執行現代允許清單（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是現代允許清單的別名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗號允許清單）
  - 現代/全部掃描預設採用精選的高訊號上限；設定 `OPENCLAW_LIVE_MAX_MODELS=0` 可進行完整現代掃描，或設定正數以使用較小上限。
  - 完整掃描會使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作為整個直接模型測試的逾時。預設：60 分鐘。
  - 直接模型探測預設以 20 路平行執行；設定 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 可覆寫。
- 如何選取提供者：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗號允許清單）
- 金鑰來源：
  - 預設：設定檔存放區與環境變數備援
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制僅使用**設定檔存放區**
- 存在原因：
  - 將「提供者 API 壞掉/金鑰無效」與「Gateway agent 管線壞掉」分離
  - 包含小型、隔離的迴歸測試（範例：OpenAI Responses/Codex Responses reasoning replay + tool-call 流程）

### 第 2 層：Gateway + 開發 agent 煙霧測試（「@openclaw」實際執行的內容）

- 測試：`src/gateway/gateway-models.profiles.live.test.ts`
- 目標：
  - 啟動一個行程內 Gateway
  - 建立/修補 `agent:dev:*` 工作階段（每次執行覆寫模型）
  - 迭代有金鑰的模型並斷言：
    - 「有意義」的回應（無工具）
    - 真實工具叫用可運作（讀取探測）
    - 可選的額外工具探測（執行+讀取探測）
    - OpenAI 迴歸路徑（僅 tool-call → 後續追問）持續運作
- 探測詳細資料（讓你可以快速解釋失敗）：
  - `read` 探測：測試會在工作區寫入 nonce 檔案，要求 agent `read` 它並回傳 nonce。
  - `exec+read` 探測：測試會要求 agent 使用 `exec` 將 nonce 寫入暫存檔，再 `read` 回來。
  - 影像探測：測試會附加產生的 PNG（cat + 隨機化代碼），並預期模型回傳 `cat <CODE>`。
  - 實作參考：`src/gateway/gateway-models.profiles.live.test.ts` 與 `src/gateway/live-image-probe.ts`。
- 如何啟用：
  - `pnpm test:live`（或若直接叫用 Vitest，使用 `OPENCLAW_LIVE_TEST=1`）
- 如何選取模型：
  - 預設：現代允許清單（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是現代允許清單的別名
  - 或設定 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗號清單）以縮小範圍
  - 現代/全部 Gateway 掃描預設採用精選的高訊號上限；設定 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可進行完整現代掃描，或設定正數以使用較小上限。
- 如何選取提供者（避免「OpenRouter 全部」）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗號允許清單）
- 此即時測試一律開啟工具 + 影像探測：
  - `read` 探測 + `exec+read` 探測（工具壓力測試）
  - 當模型公告支援影像輸入時，會執行影像探測
  - 流程（高階）：
    - 測試產生一個帶有「CAT」+ 隨機代碼的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 透過 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 傳送
    - Gateway 將附件剖析成 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agent 將多模態使用者訊息轉送給模型
    - 斷言：回覆包含 `cat` + 代碼（OCR 容忍度：允許小錯誤）

<Tip>
若要查看你的機器上可測試的項目（以及精確的 `provider/model` ID），請執行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 即時：CLI 後端煙霧測試（Claude、Codex、Gemini 或其他本機 CLI）

- 測試：`src/gateway/gateway-cli-backend.live.test.ts`
- 目標：使用本機 CLI 後端驗證 Gateway + agent 管線，而不觸及你的預設設定。
- 後端專屬煙霧測試預設值位於擁有它的 Plugin 的 `cli-backend.ts` 定義中。
- 啟用：
  - `pnpm test:live`（或若直接叫用 Vitest，使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 預設：
  - 預設提供者/模型：`claude-cli/claude-sonnet-4-6`
  - 命令/引數/影像行為來自擁有該 CLI 後端的 Plugin 中繼資料。
- 覆寫（可選）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 可傳送真實影像附件（路徑會注入提示中）。Docker 配方預設關閉此項，除非明確要求。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 可將影像檔案路徑作為 CLI 引數傳遞，而不是提示注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）可在設定 `IMAGE_ARG` 時控制影像引數的傳遞方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 可傳送第二輪並驗證續接流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 可在所選模型支援切換目標時，選擇加入 Claude Sonnet -> Opus 同工作階段連續性探測。Docker 配方為了整體可靠性預設關閉此項。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 可選擇加入 MCP/工具 loopback 探測。Docker 配方預設關閉此項，除非明確要求。

範例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低成本 Gemini MCP 設定煙霧測試：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

這不會要求 Gemini 產生回應。它會寫入 OpenClaw 提供給 Gemini 的相同系統
設定，然後執行 `gemini --debug mcp list`，以證明已儲存的
`transport: "streamable-http"` 伺服器會正規化成 Gemini 的 HTTP MCP
形狀，且可以連線到本機 streamable-HTTP MCP 伺服器。

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

單一提供者 Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注意事項：

- Docker 執行器位於 `scripts/test-live-cli-backend-docker.sh`。
- 它會在 repo Docker 映像中以非 root 的 `node` 使用者執行即時 CLI 後端煙霧測試。
- 它會從擁有者 Plugin 解析 CLI 煙霧測試中繼資料，然後將相符的 Linux CLI 套件（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安裝到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的快取可寫入前綴（預設：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要透過 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType`，或來自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`，提供可攜式 Claude Code 訂閱 OAuth。它會先在 Docker 中證明直接 `claude -p` 可用，然後在不保留 Anthropic API 金鑰環境變數的情況下執行兩輪 Gateway CLI 後端。此訂閱通道預設停用 Claude MCP/工具與影像探測，因為 Claude 目前會將第三方應用程式使用量導向額外使用量計費，而不是一般訂閱方案限制。
- 即時 CLI 後端煙霧測試現在會對 Claude、Codex 與 Gemini 執行相同的端對端流程：文字輪次、影像分類輪次，接著透過 Gateway CLI 驗證 MCP `cron` 工具呼叫。
- Claude 的預設煙霧測試也會將工作階段從 Sonnet 修補到 Opus，並驗證續接的工作階段仍記得先前的筆記。

## 即時：ACP 綁定煙霧測試（`/acp spawn ... --bind here`）

- 測試：`src/gateway/gateway-acp-bind.live.test.ts`
- 目標：使用即時 ACP 代理驗證真正的 ACP conversation-bind 流程：
  - 傳送 `/acp spawn <agent> --bind here`
  - 就地繫結一個合成的訊息通道對話
  - 在同一個對話上傳送一般後續訊息
  - 驗證該後續訊息進入已繫結的 ACP 工作階段轉錄
- 啟用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 預設值：
  - Docker 中的 ACP 代理：`claude,codex,gemini`
  - 直接執行 `pnpm test:live ...` 時的 ACP 代理：`claude`
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
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- 注意事項：
  - 此通道使用 gateway `chat.send` 介面，並帶有僅限管理員使用的合成 originating-route 欄位，讓測試可以附加訊息通道情境，而不必假裝向外部遞送。
  - 未設定 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 時，測試會針對選定的 ACP 測試代理使用內嵌 `acpx` plugin 的內建代理登錄。
  - 已繫結工作階段的 cron MCP 建立預設為盡力而為，因為外部 ACP 測試程式可能會在 bind/image 驗證通過後取消 MCP 呼叫；設定 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可讓該 bind 後 cron 探測變為嚴格。

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

Docker 注意事項：

- Docker 執行器位於 `scripts/test-live-acp-bind-docker.sh`。
- 預設情況下，它會依序針對聚合的即時 CLI 代理執行 ACP bind smoke：`claude`、`codex`，然後是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 來縮小矩陣。
- 它會載入 `~/.profile`，將相符的 CLI 驗證素材暫存到容器中，然後在缺少時安裝要求的即時 CLI（`@anthropic-ai/claude-code`、`@openai/codex`、透過 `https://app.factory.ai/cli` 的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 後端本身是來自 `acpx` plugin 的隨附內嵌 `acpx/runtime` 套件。
- Droid Docker 變體會暫存 `~/.factory` 以供設定使用、轉送 `FACTORY_API_KEY`，並要求該 API 金鑰，因為本機 Factory OAuth/keyring 驗證無法移植到容器中。它使用 ACPX 內建的 `droid exec --output-format acp` 登錄項目。
- OpenCode Docker 變體是一條嚴格的單一代理迴歸通道。它會在載入 `~/.profile` 後，從 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（預設 `opencode/kimi-k2.6`）寫入暫時的 `OPENCODE_CONFIG_CONTENT` 預設模型，而 `pnpm test:docker:live-acp-bind:opencode` 要求已繫結的助理轉錄，而不是接受一般 bind 後略過。
- 直接的 `acpx` CLI 呼叫僅是手動/權宜路徑，用於比較 Gateway 之外的行為。Docker ACP bind smoke 會測試 OpenClaw 的內嵌 `acpx` 執行階段後端。

## 即時：Codex app-server 測試程式 smoke

- 目標：透過一般 gateway
  `agent` 方法驗證 plugin 擁有的 Codex 測試程式：
  - 載入隨附的 `codex` plugin
  - 選取 `OPENCLAW_AGENT_RUNTIME=codex`
  - 在強制使用 Codex 測試程式的情況下，將第一個 gateway agent 回合傳送到 `openai/gpt-5.5`
  - 將第二個回合傳送到同一個 OpenClaw 工作階段，並驗證 app-server
    執行緒可以恢復
  - 透過同一個 gateway 命令路徑執行 `/codex status` 和 `/codex models`
  - 選擇性執行兩個經 Guardian 審查的升級 shell 探測：一個應核准的良性
    命令，以及一個應拒絕、讓代理回問的假秘密上傳
- 測試：`src/gateway/gateway-codex-harness.live.test.ts`
- 啟用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 預設模型：`openai/gpt-5.5`
- 選用影像探測：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 選用 MCP/tool 探測：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 選用 Guardian 探測：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 此 smoke 會設定 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此損壞的 Codex
  測試程式無法透過靜默退回到 PI 而通過。
- 驗證：來自本機 Codex 訂閱登入的 Codex app-server 驗證。Docker
  smoke 也可在適用時為非 Codex 探測提供 `OPENAI_API_KEY`，
  並選擇性複製 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

本機配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 注意事項：

- Docker 執行器位於 `scripts/test-live-codex-harness-docker.sh`。
- 它會載入掛載的 `~/.profile`、傳遞 `OPENAI_API_KEY`、在存在時複製 Codex CLI
  驗證檔案、將 `@openai/codex` 安裝到可寫入的掛載 npm
  前置目錄、暫存原始碼樹，然後只執行 Codex-harness 即時測試。
- Docker 預設啟用影像、MCP/tool 和 Guardian 探測。需要較窄的偵錯
  執行時，請設定
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 也會匯出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，與即時
  測試設定相符，因此舊別名或 PI fallback 無法隱藏 Codex 測試程式
  迴歸。

### 建議的即時配方

窄範圍、明確的允許清單最快且最不容易不穩定：

- 單一模型，直接（無 gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 單一模型，gateway smoke：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多個供應商的工具呼叫：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 重點（Gemini API 金鑰 + Antigravity）：
  - Gemini（API 金鑰）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke：
  - 如果本機金鑰位於 shell profile：`source ~/.profile`
  - Gemini 3 動態預設：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動態預算：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注意事項：

- `google/...` 使用 Gemini API（API 金鑰）。
- `google-antigravity/...` 使用 Antigravity OAuth 橋接器（Cloud Code Assist 風格的代理端點）。
- `google-gemini-cli/...` 使用你機器上的本機 Gemini CLI（獨立驗證與工具特性）。
- Gemini API 與 Gemini CLI：
  - API：OpenClaw 透過 HTTP 呼叫 Google 託管的 Gemini API（API 金鑰 / profile auth）；這是大多數使用者所說的「Gemini」。
  - CLI：OpenClaw shell out 到本機 `gemini` 二進位檔；它有自己的驗證，且行為可能不同（串流/tool 支援/版本落差）。

## 即時：模型矩陣（涵蓋範圍）

沒有固定的「CI 模型清單」（即時測試是選擇性啟用），但以下是在有金鑰的開發機上建議定期涵蓋的**建議**模型。

### 現代 smoke 集合（工具呼叫 + 影像）

這是我們預期持續正常運作的「常用模型」執行：

- OpenAI（非 Codex）：`openai/gpt-5.5`
- OpenAI Codex OAuth：`openai-codex/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免較舊的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

使用工具 + 影像執行 gateway smoke：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基準：工具呼叫（Read + 選用 Exec）

每個供應商家族至少選擇一個：

- OpenAI：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

選用的額外涵蓋範圍（有則更好）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（選擇一個你已啟用、具備「tools」能力的模型）
- Cerebras：`cerebras/`…（如果你有存取權）
- LM Studio：`lmstudio/`…（本機；工具呼叫取決於 API 模式）

### 視覺：影像傳送（附件 → 多模態訊息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中包含至少一個具影像能力的模型（Claude/Gemini/OpenAI 具視覺能力的變體等），以測試影像探測。

### 聚合器 / 替代 gateway

如果你已啟用金鑰，我們也支援透過以下項目測試：

- OpenRouter：`openrouter/...`（數百個模型；使用 `openclaw models scan` 尋找具備 tool+image 能力的候選項）
- OpenCode：`opencode/...` 用於 Zen，`opencode-go/...` 用於 Go（透過 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 驗證）

你可以納入即時矩陣的更多供應商（如果你有憑證/設定）：

- 內建：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 透過 `models.providers`（自訂端點）：`minimax`（雲端/API），以及任何 OpenAI/Anthropic 相容代理（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文件中硬編碼「所有模型」。權威清單是在你的機器上由 `discoverModels(...)` 回傳的內容，加上任何可用金鑰。
</Tip>

## 憑證（永不提交）

即時測試會用與 CLI 相同的方式探索憑證。實務影響：

- 如果 CLI 可正常運作，即時測試應該會找到相同的金鑰。
- 如果即時測試顯示「沒有憑證」，請用與偵錯 `openclaw models list` / 模型選擇相同的方式偵錯。

- 每個代理程式的驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（這就是即時測試中「設定檔金鑰」的意思）
- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 舊版狀態目錄：`~/.openclaw/credentials/`（存在時會複製到暫存即時測試主目錄，但不是主要的設定檔金鑰儲存區）
- 本機即時執行預設會將作用中的設定、每個代理程式的 `auth-profiles.json` 檔案、舊版 `credentials/`，以及支援的外部 CLI 驗證目錄複製到暫時測試主目錄；暫存即時測試主目錄會略過 `workspace/` 和 `sandboxes/`，並移除 `agents.*.workspace` / `agentDir` 路徑覆寫，讓探測不會碰到你真實主機上的工作區。

如果你想依賴環境金鑰（例如已在 `~/.profile` 中匯出），請在 `source ~/.profile` 之後執行本機測試，或使用下方的 Docker 執行器（它們可以將 `~/.profile` 掛載到容器中）。

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
  - 測試內建的 comfy 影像、影片和 `music_generate` 路徑
  - 除非已設定 `plugins.entries.comfy.config.<capability>`，否則會略過各項能力
  - 適合在變更 comfy 工作流程提交、輪詢、下載或 Plugin 註冊後使用

## 影像生成即時測試

- 測試：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 測試工具：`pnpm test:live:media image`
- 範圍：
  - 列舉每個已註冊的影像生成提供者 Plugin
  - 在探測前從你的登入 shell（`~/.profile`）載入缺少的提供者環境變數
  - 預設優先使用即時/環境 API 金鑰，而不是已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 憑證
  - 略過沒有可用驗證/設定檔/模型的提供者
  - 透過共用影像生成執行階段執行每個已設定的提供者：
    - `<provider>:generate`
    - 當提供者宣告支援編輯時執行 `<provider>:edit`
- 目前涵蓋的內建提供者：
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 會強制使用設定檔儲存區驗證，並忽略僅來自環境的覆寫

對於已發布的 CLI 路徑，請在提供者/執行階段即時測試通過後，加上一個 `infer` 煙霧測試：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

這涵蓋 CLI 引數解析、設定/預設代理程式解析、內建 Plugin 啟用、隨需內建執行階段依賴修復、共用影像生成執行階段，以及即時提供者請求。

## 音樂生成即時測試

- 測試：`extensions/music-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 測試工具：`pnpm test:live:media music`
- 範圍：
  - 測試共用的內建音樂生成提供者路徑
  - 目前涵蓋 Google 和 MiniMax
  - 在探測前從你的登入 shell（`~/.profile`）載入提供者環境變數
  - 預設優先使用即時/環境 API 金鑰，而不是已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 憑證
  - 略過沒有可用驗證/設定檔/模型的提供者
  - 可用時執行兩種宣告的執行階段模式：
    - 使用僅含提示詞的輸入執行 `generate`
    - 當提供者宣告 `capabilities.edit.enabled` 時執行 `edit`
  - 目前共用通道涵蓋範圍：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：獨立的 Comfy 即時測試檔案，不在此共用掃描中
- 選用縮小範圍：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 選用驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 會強制使用設定檔儲存區驗證，並忽略僅來自環境的覆寫

## 影片生成即時測試

- 測試：`extensions/video-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 測試工具：`pnpm test:live:media video`
- 範圍：
  - 測試共用的內建影片生成提供者路徑
  - 預設使用適合發行的煙霧測試路徑：非 FAL 提供者、每個提供者一個文字轉影片請求、一秒鐘的龍蝦提示詞，以及由 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 設定的每個提供者操作上限（預設為 `180000`）
  - 預設略過 FAL，因為提供者端佇列延遲可能主導發行時間；傳入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可明確執行
  - 在探測前從你的登入 shell（`~/.profile`）載入提供者環境變數
  - 預設優先使用即時/環境 API 金鑰，而不是已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 憑證
  - 略過沒有可用驗證/設定檔/模型的提供者
  - 預設只執行 `generate`
  - 設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 也會在可用時執行宣告的轉換模式：
    - 當提供者宣告 `capabilities.imageToVideo.enabled`，且所選提供者/模型在共用掃描中接受以緩衝區支援的本機影像輸入時，執行 `imageToVideo`
    - 當提供者宣告 `capabilities.videoToVideo.enabled`，且所選提供者/模型在共用掃描中接受以緩衝區支援的本機影片輸入時，執行 `videoToVideo`
  - 目前在共用掃描中宣告但略過的 `imageToVideo` 提供者：
    - `vydra`，因為內建的 `veo3` 僅支援文字，而內建的 `kling` 需要遠端影像 URL
  - Vydra 的提供者專屬涵蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 該檔案會執行 `veo3` 文字轉影片，以及預設使用遠端影像 URL fixture 的 `kling` 通道
  - 目前 `videoToVideo` 即時測試涵蓋範圍：
    - 僅在所選模型為 `runway/gen4_aleph` 時涵蓋 `runway`
  - 目前在共用掃描中宣告但略過的 `videoToVideo` 提供者：
    - `alibaba`、`qwen`、`xai`，因為這些路徑目前需要遠端 `http(s)` / MP4 參考 URL
    - `google`，因為目前共用 Gemini/Veo 通道使用以本機緩衝區支援的輸入，而該路徑不會在共用掃描中被接受
    - `openai`，因為目前共用通道缺少組織特定的影片修補/混音存取保證
- 選用縮小範圍：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 可在預設掃描中包含每個提供者，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 可降低每個提供者的操作上限，以進行更積極的煙霧測試
- 選用驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 會強制使用設定檔儲存區驗證，並忽略僅來自環境的覆寫

## 媒體即時測試工具

- 命令：`pnpm test:live:media`
- 目的：
  - 透過一個 repo 原生進入點執行共用的影像、音樂和影片即時測試套件
  - 從 `~/.profile` 自動載入缺少的提供者環境變數
  - 預設自動將每個測試套件縮小到目前具有可用驗證的提供者
  - 重用 `scripts/test-live.mjs`，因此 Heartbeat 和安靜模式行為會保持一致
- 範例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相關

- [測試](/zh-TW/help/testing) — 單元、整合、QA 和 Docker 測試套件
