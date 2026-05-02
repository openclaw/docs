---
read_when:
    - 執行即時模型矩陣 / CLI 後端 / ACP / media-provider 冒煙測試
    - 偵錯即時測試憑證解析
    - 新增一個提供者專屬的即時測試
sidebarTitle: Live tests
summary: 即時（會觸及網路的）測試：模型矩陣、CLI 後端、ACP、媒體提供者、憑證
title: 測試：即時套件
x-i18n:
    generated_at: "2026-05-02T02:52:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce8bd75ee7837b48e6ba1d888d281ee053fc13bdcf0907baddeb78ebcbbef31c
    source_path: help/testing-live.md
    workflow: 16
---

快速入門、QA 執行器、單元/整合套件與 Docker 流程請參閱
[測試](/zh-TW/help/testing)。本頁涵蓋**即時**（會觸及網路）的測試
套件：模型矩陣、CLI 後端、ACP 與媒體提供者即時測試，以及
憑證處理。

## 即時：本機設定檔冒煙指令

在臨時即時檢查前先 source `~/.profile`，讓提供者金鑰與本機工具
路徑符合你的 shell：

```bash
source ~/.profile
```

安全媒體冒煙測試：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全語音通話就緒冒煙測試：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

除非同時提供 `--yes`，否則 `voicecall smoke` 是 dry run。只有在你刻意要撥出真正的通知電話時才使用 `--yes`。對 Twilio、Telnyx 與 Plivo 而言，成功的就緒檢查需要公開 Webhook URL；僅限本機的 loopback/private 後援會依設計遭拒。

## 即時：Android Node 能力掃描

- 測試：`src/gateway/android-node.capabilities.live.test.ts`
- 指令碼：`pnpm android:test:integration`
- 目標：叫用已連線 Android Node **目前宣告的每一個指令**，並斷言指令合約行為。
- 範圍：
  - 已預先處理條件/手動設定（此套件不會安裝/執行/配對 App）。
  - 針對選取的 Android Node 逐一驗證 Gateway `node.invoke` 指令。
- 必要預先設定：
  - Android App 已連線並配對到 Gateway。
  - App 保持在前景。
  - 已針對你預期會通過的能力授予權限/擷取同意。
- 選用目標覆寫：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 設定細節：[Android App](/zh-TW/platforms/android)

## 即時：模型冒煙測試（設定檔金鑰）

即時測試分成兩層，讓我們可以隔離失敗：

- 「直接模型」告訴我們提供者/模型是否能用給定金鑰回答。
- 「Gateway 冒煙測試」告訴我們完整 Gateway+代理管線是否能讓該模型運作（工作階段、歷史、工具、沙箱政策等）。

### 第 1 層：直接模型補全（無 Gateway）

- 測試：`src/agents/models.profiles.live.test.ts`
- 目標：
  - 列舉探索到的模型
  - 使用 `getApiKeyForModel` 選取你有憑證的模型
  - 對每個模型執行小型補全（以及需要時的目標式回歸）
- 如何啟用：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 設定 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，modern 的別名）才會實際執行此套件；否則它會略過，以讓 `pnpm test:live` 專注於 Gateway 冒煙測試
- 如何選取模型：
  - `OPENCLAW_LIVE_MODELS=modern` 執行 modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern allowlist 的別名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗號分隔 allowlist）
  - Modern/all 掃描預設使用精選的高訊號上限；若要進行完整 modern 掃描，請設定 `OPENCLAW_LIVE_MAX_MODELS=0`，或設定正數作為較小上限。
  - 完整掃描會使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作為整個直接模型測試逾時。預設：60 分鐘。
  - 直接模型探測預設以 20 路平行執行；設定 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 可覆寫。
- 如何選取提供者：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗號分隔 allowlist）
- 金鑰來源：
  - 預設：設定檔儲存區與 env 後援
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制僅使用**設定檔儲存區**
- 為什麼存在：
  - 將「提供者 API 壞了 / 金鑰無效」與「Gateway 代理管線壞了」分離
  - 包含小型、隔離的回歸（範例：OpenAI Responses/Codex Responses reasoning replay + tool-call 流程）

### 第 2 層：Gateway + 開發代理冒煙測試（「@openclaw」實際做的事）

- 測試：`src/gateway/gateway-models.profiles.live.test.ts`
- 目標：
  - 啟動進程內 Gateway
  - 建立/修補 `agent:dev:*` 工作階段（每次執行覆寫模型）
  - 逐一處理具備金鑰的模型並斷言：
    - 「有意義的」回應（無工具）
    - 真正的工具叫用可運作（讀取探測）
    - 選用額外工具探測（exec+read 探測）
    - OpenAI 回歸路徑（僅 tool-call → 後續回合）持續運作
- 探測細節（讓你能快速解釋失敗）：
  - `read` 探測：測試會在工作區寫入 nonce 檔案，並要求代理 `read` 它且回傳該 nonce。
  - `exec+read` 探測：測試要求代理以 `exec` 將 nonce 寫入暫存檔，然後 `read` 回來。
  - 圖像探測：測試附加產生的 PNG（cat + 隨機碼），並預期模型回傳 `cat <CODE>`。
  - 實作參考：`src/gateway/gateway-models.profiles.live.test.ts` 與 `src/gateway/live-image-probe.ts`。
- 如何啟用：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 如何選取模型：
  - 預設：modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern allowlist 的別名
  - 或設定 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗號清單）以縮小範圍
  - Modern/all Gateway 掃描預設使用精選的高訊號上限；若要進行完整 modern 掃描，請設定 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`，或設定正數作為較小上限。
- 如何選取提供者（避免「OpenRouter 全部」）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗號分隔 allowlist）
- 工具 + 圖像探測在此即時測試中一律開啟：
  - `read` 探測 + `exec+read` 探測（工具壓力）
  - 當模型宣告支援圖像輸入時，會執行圖像探測
  - 流程（高層次）：
    - 測試產生帶有「CAT」+ 隨機碼的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 透過 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 傳送
    - Gateway 將附件解析為 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 內嵌代理將多模態使用者訊息轉送給模型
    - 斷言：回覆包含 `cat` + 該代碼（OCR 容錯：允許小錯誤）

<Tip>
若要查看你機器上可測試的項目（以及精確的 `provider/model` ID），請執行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## 即時：CLI 後端冒煙測試（Claude、Codex、Gemini 或其他本機 CLI）

- 測試：`src/gateway/gateway-cli-backend.live.test.ts`
- 目標：使用本機 CLI 後端驗證 Gateway + 代理管線，而不觸及你的預設設定。
- 後端特定的冒煙測試預設值位於擁有該後端的 Plugin 的 `cli-backend.ts` 定義中。
- 啟用：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 預設值：
  - 預設提供者/模型：`claude-cli/claude-sonnet-4-6`
  - 指令/引數/圖像行為來自擁有該 CLI 後端的 Plugin 中繼資料。
- 覆寫（選用）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 傳送真實圖像附件（路徑會注入提示中）。Docker recipes 預設關閉此項，除非明確要求。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 以 CLI 引數形式傳遞圖像檔案路徑，而不是提示注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制設定 `IMAGE_ARG` 時圖像引數的傳遞方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 傳送第二回合並驗證續接流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 當選取的模型支援切換目標時，選擇加入 Claude Sonnet -> Opus 同工作階段連續性探測。Docker recipes 預設關閉此項，以提升彙總可靠性。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 選擇加入 MCP/tool loopback 探測。Docker recipes 預設關閉此項，除非明確要求。

範例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低成本 Gemini MCP 設定冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

這不會要求 Gemini 產生回應。它會寫入 OpenClaw 提供給 Gemini 的相同系統
設定，然後執行 `gemini --debug mcp list`，證明已儲存的 `transport: "streamable-http"` 伺服器會正規化為 Gemini 的 HTTP MCP
形狀，且可連線到本機 streamable-HTTP MCP 伺服器。

Docker recipe：

```bash
pnpm test:docker:live-cli-backend
```

單一提供者 Docker recipes：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注意事項：

- Docker 執行器位於 `scripts/test-live-cli-backend-docker.sh`。
- 它會以非 root `node` 使用者，在 repo Docker 映像內執行即時 CLI 後端冒煙測試。
- 它從擁有該後端的 Plugin 解析 CLI 冒煙測試中繼資料，然後將相符的 Linux CLI 套件（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安裝到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的快取可寫前綴（預設：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要透過含有 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json`，或來自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`，提供可攜式 Claude Code 訂閱 OAuth。它會先證明 Docker 中的直接 `claude -p` 可用，接著在不保留 Anthropic API-key env vars 的情況下執行兩個 Gateway CLI 後端回合。此訂閱 lane 預設停用 Claude MCP/tool 與圖像探測，因為 Claude 目前會將第三方 App 使用量導向額外用量計費，而不是一般訂閱方案限制。
- 即時 CLI 後端冒煙測試現在會對 Claude、Codex 與 Gemini 執行相同的端對端流程：文字回合、圖像分類回合，然後是透過 Gateway CLI 驗證的 MCP `cron` 工具呼叫。
- Claude 的預設冒煙測試也會將工作階段從 Sonnet 修補到 Opus，並驗證續接的工作階段仍記得較早的筆記。

## 即時：ACP 綁定冒煙測試（`/acp spawn ... --bind here`）

- 測試：`src/gateway/gateway-acp-bind.live.test.ts`
- 目標：使用即時 ACP agent 驗證真實的 ACP 對話繫結流程：
  - 傳送 `/acp spawn <agent> --bind here`
  - 就地繫結合成的訊息頻道對話
  - 在同一個對話上傳送一般後續訊息
  - 確認後續訊息落入已繫結的 ACP session transcript
- 啟用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 預設值：
  - Docker 中的 ACP agents：`claude,codex,gemini`
  - 直接執行 `pnpm test:live ...` 的 ACP agent：`claude`
  - 合成頻道：Slack DM 風格的對話內容
  - ACP backend：`acpx`
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
  - 這條測試線使用 gateway `chat.send` surface，並搭配僅限管理員的合成 originating-route 欄位，讓測試可以附加訊息頻道內容，而不必假裝對外遞送。
  - 當未設定 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 時，測試會使用內嵌 `acpx` plugin 針對所選 ACP harness agent 的內建 agent registry。
  - Bound-session cron MCP 建立預設採 best-effort，因為外部 ACP harnesses 可能在 bind/image proof 通過後取消 MCP 呼叫；設定 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可讓該 post-bind cron probe 變為嚴格模式。

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

- Docker runner 位於 `scripts/test-live-acp-bind-docker.sh`。
- 預設會依序對彙總的即時 CLI agents 執行 ACP bind smoke：`claude`、`codex`，接著 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 來縮小矩陣。
- 它會 source `~/.profile`，將對應的 CLI auth material 暫存到容器中，然後在缺少時安裝要求的即時 CLI（`@anthropic-ai/claude-code`、`@openai/codex`、透過 `https://app.factory.ai/cli` 的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP backend 本身是來自 `acpx` plugin 的 bundled embedded `acpx/runtime` package。
- Droid Docker variant 會暫存 `~/.factory` 作為設定、轉送 `FACTORY_API_KEY`，並要求該 API key，因為本機 Factory OAuth/keyring auth 無法攜入容器。它使用 ACPX 內建的 `droid exec --output-format acp` registry entry。
- OpenCode Docker variant 是嚴格的單一 agent regression lane。它會在 source `~/.profile` 後，從 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（預設 `opencode/kimi-k2.6`）寫入暫時的 `OPENCODE_CONFIG_CONTENT` default model，而 `pnpm test:docker:live-acp-bind:opencode` 需要 bound assistant transcript，而不是接受 generic post-bind skip。
- 直接的 `acpx` CLI 呼叫僅作為手動／因應路徑，用於比較 Gateway 外部的行為。Docker ACP bind smoke 會測試 OpenClaw 的 embedded `acpx` runtime backend。

## 即時：Codex app-server harness smoke

- 目標：透過一般 gateway `agent` method 驗證 Plugin 擁有的 Codex harness：
  - 載入 bundled `codex` Plugin
  - 選取 `OPENCLAW_AGENT_RUNTIME=codex`
  - 在強制使用 Codex harness 的情況下，將第一個 gateway agent turn 傳送至 `openai/gpt-5.5`
  - 將第二個 turn 傳送至同一個 OpenClaw session，並確認 app-server thread 可以恢復
  - 透過同一個 gateway command path 執行 `/codex status` 和 `/codex models`
  - 選擇性執行兩個經 Guardian review 的 escalated shell probes：一個應核准的 benign command，以及一個應拒絕、使 agent 回問的 fake-secret upload
- 測試：`src/gateway/gateway-codex-harness.live.test.ts`
- 啟用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 預設 model：`openai/gpt-5.5`
- 選用 image probe：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 選用 MCP/tool probe：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 選用 Guardian probe：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 此 smoke 會設定 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此損壞的 Codex harness 無法透過靜默 fallback 到 PI 而通過。
- Auth：來自本機 Codex subscription login 的 Codex app-server auth。Docker smokes 也可在適用時提供 `OPENAI_API_KEY` 給非 Codex probes，加上選用複製的 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

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

- Docker runner 位於 `scripts/test-live-codex-harness-docker.sh`。
- 它會 source 掛載的 `~/.profile`、傳遞 `OPENAI_API_KEY`、在存在時複製 Codex CLI auth files、將 `@openai/codex` 安裝到可寫入的 mounted npm prefix、暫存 source tree，然後只執行 Codex-harness live test。
- Docker 預設啟用 image、MCP/tool 和 Guardian probes。需要較窄 debug run 時，請設定 `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或 `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或 `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 也會匯出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，與 live test config 相同，因此 legacy aliases 或 PI fallback 無法隱藏 Codex harness regression。

### 建議的即時配方

狹窄且明確的 allowlists 最快，也最不容易不穩定：

- 單一 model，直接（無 gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 單一 model，gateway smoke：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多個 providers 的 tool calling：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 焦點（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke：
  - 如果本機 keys 存在於 shell profile：`source ~/.profile`
  - Gemini 3 dynamic default：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注意事項：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 風格的 agent endpoint）。
- `google-gemini-cli/...` 使用你機器上的本機 Gemini CLI（獨立 auth + tooling quirks）。
- Gemini API 與 Gemini CLI：
  - API：OpenClaw 透過 HTTP 呼叫 Google 的 hosted Gemini API（API key / profile auth）；這是大多數使用者所說的「Gemini」。
  - CLI：OpenClaw shell out 到本機 `gemini` binary；它有自己的 auth，且行為可能不同（streaming/tool support/version skew）。

## 即時：model matrix（涵蓋範圍）

沒有固定的「CI model list」（live 是 opt-in），但以下是建議在具備 keys 的開發機上定期涵蓋的 **recommended** models。

### 現代 smoke set（tool calling + image）

這是我們預期要保持可運作的「common models」執行：

- OpenAI（非 Codex）：`openai/gpt-5.5`
- OpenAI Codex OAuth：`openai-codex/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免較舊的 Gemini 2.x models）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

使用 tools + image 執行 gateway smoke：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基準：tool calling（Read + 選用 Exec）

每個 provider family 至少選一個：

- OpenAI：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

選用額外涵蓋範圍（建議具備）：

- xAI：`xai/grok-4.3`（或最新可用版本）
- Mistral：`mistral/`…（選擇一個你已啟用且支援「tools」的 model）
- Cerebras：`cerebras/`…（如果你有 access）
- LM Studio：`lmstudio/`…（本機；tool calling 取決於 API mode）

### Vision：image send（attachment → multimodal message）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中包含至少一個具 image 能力的 model（Claude/Gemini/OpenAI vision-capable variants 等），以執行 image probe。

### Aggregators / alternate gateways

如果你已啟用 keys，我們也支援透過以下項目測試：

- OpenRouter：`openrouter/...`（數百個 models；使用 `openclaw models scan` 尋找具 tool+image 能力的候選項）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（auth 透過 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

你可以納入 live matrix 的更多 providers（如果你有 creds/config）：

- 內建：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 透過 `models.providers`（custom endpoints）：`minimax`（cloud/API），以及任何 OpenAI/Anthropic-compatible proxy（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在 docs 中硬編碼「all models」。權威清單是你機器上 `discoverModels(...)` 回傳的內容，加上任何可用 keys。
</Tip>

## Credentials（切勿 commit）

Live tests 會以 CLI 相同的方式探索 credentials。實務影響：

- 如果 CLI 可用，live 測試應該能找到相同的金鑰。
- 如果 live 測試顯示「no creds」，請用你除錯 `openclaw models list` / 模型選擇的相同方式除錯。

- 每個 agent 的驗證 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（這就是 live 測試中「profile keys」的意思）
- Config：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 舊版狀態目錄：`~/.openclaw/credentials/`（存在時會複製到 staged live home，但不是主要的 profile-key 儲存區）
- 預設情況下，live 本機執行會將作用中的 config、每個 agent 的 `auth-profiles.json` 檔案、舊版 `credentials/`，以及支援的外部 CLI 驗證目錄複製到暫存測試 home；staged live home 會跳過 `workspace/` 和 `sandboxes/`，並移除 `agents.*.workspace` / `agentDir` 路徑覆寫，讓探測不會碰到你真實主機上的 workspace。

如果你想依賴環境金鑰（例如匯出在你的 `~/.profile` 中），請在 `source ~/.profile` 後執行本機測試，或使用下方的 Docker runner（它們可以將 `~/.profile` 掛載到容器中）。

## Deepgram live（音訊轉錄）

- 測試：`extensions/deepgram/audio.live.test.ts`
- 啟用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 測試：`extensions/byteplus/live.test.ts`
- 啟用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 選用模型覆寫：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- 測試：`extensions/comfy/comfy.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 範圍：
  - 演練 bundled comfy 圖像、影片和 `music_generate` 路徑
  - 除非已設定 `plugins.entries.comfy.config.<capability>`，否則會跳過各項 capability
  - 在變更 comfy workflow 提交、輪詢、下載或 Plugin 註冊後很有用

## 圖像生成 live

- 測試：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 範圍：
  - 列舉每個已註冊的圖像生成提供者 Plugin
  - 探測前，從你的登入 shell（`~/.profile`）載入缺少的提供者環境變數
  - 預設會優先使用 live/env API 金鑰，而不是已儲存的驗證 profile，因此 `auth-profiles.json` 中過時的測試金鑰不會遮蔽真實的 shell 認證
  - 跳過沒有可用 auth/profile/model 的提供者
  - 透過共用圖像生成 runtime 執行每個已設定的提供者：
    - `<provider>:generate`
    - 當提供者宣告支援 edit 時執行 `<provider>:edit`
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
- 選用驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制使用 profile-store auth，並忽略僅限 env 的覆寫

對於已出貨的 CLI 路徑，請在 provider/runtime live 測試通過後加入一個 `infer` smoke：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

這會涵蓋 CLI 參數解析、config/default-agent 解析、bundled Plugin 啟用、共用圖像生成 runtime，以及 live 提供者請求。Plugin 依賴項預期在 runtime 載入前已存在。

## 音樂生成 live

- 測試：`extensions/music-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 範圍：
  - 演練共用 bundled 音樂生成提供者路徑
  - 目前涵蓋 Google 和 MiniMax
  - 探測前，從你的登入 shell（`~/.profile`）載入提供者環境變數
  - 預設會優先使用 live/env API 金鑰，而不是已儲存的驗證 profile，因此 `auth-profiles.json` 中過時的測試金鑰不會遮蔽真實的 shell 認證
  - 跳過沒有可用 auth/profile/model 的提供者
  - 可用時執行兩種已宣告的 runtime 模式：
    - 使用僅含 prompt 的輸入執行 `generate`
    - 當提供者宣告 `capabilities.edit.enabled` 時執行 `edit`
  - 目前共用 lane 涵蓋範圍：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：獨立的 Comfy live 檔案，不屬於這個共用 sweep
- 選用縮小範圍：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 選用驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制使用 profile-store auth，並忽略僅限 env 的覆寫

## 影片生成 live

- 測試：`extensions/video-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 範圍：
  - 演練共用 bundled 影片生成提供者路徑
  - 預設使用 release-safe smoke 路徑：非 FAL 提供者、每個提供者一個 text-to-video 請求、一秒 lobster prompt，以及來自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每個提供者操作上限（預設為 `180000`）
  - 預設跳過 FAL，因為提供者端佇列延遲可能主導 release 時間；傳入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可明確執行
  - 探測前，從你的登入 shell（`~/.profile`）載入提供者環境變數
  - 預設會優先使用 live/env API 金鑰，而不是已儲存的驗證 profile，因此 `auth-profiles.json` 中過時的測試金鑰不會遮蔽真實的 shell 認證
  - 跳過沒有可用 auth/profile/model 的提供者
  - 預設只執行 `generate`
  - 設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 也會在可用時執行已宣告的 transform 模式：
    - 當提供者宣告 `capabilities.imageToVideo.enabled`，且所選提供者/模型在共用 sweep 中接受 buffer-backed 本機圖像輸入時，執行 `imageToVideo`
    - 當提供者宣告 `capabilities.videoToVideo.enabled`，且所選提供者/模型在共用 sweep 中接受 buffer-backed 本機影片輸入時，執行 `videoToVideo`
  - 目前共用 sweep 中已宣告但跳過的 `imageToVideo` 提供者：
    - `vydra`，因為 bundled `veo3` 只支援文字，而 bundled `kling` 需要遠端圖像 URL
  - 提供者特定的 Vydra 涵蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 該檔案會執行 `veo3` text-to-video，加上預設使用遠端圖像 URL fixture 的 `kling` lane
  - 目前 `videoToVideo` live 涵蓋範圍：
    - 只有當所選模型為 `runway/gen4_aleph` 時涵蓋 `runway`
  - 目前共用 sweep 中已宣告但跳過的 `videoToVideo` 提供者：
    - `alibaba`、`qwen`、`xai`，因為這些路徑目前需要遠端 `http(s)` / MP4 參考 URL
    - `google`，因為目前共用 Gemini/Veo lane 使用 buffer-backed 本機輸入，而共用 sweep 不接受該路徑
    - `openai`，因為目前共用 lane 缺少 org-specific video inpaint/remix 存取保證
- 選用縮小範圍：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 可在預設 sweep 中包含每個提供者，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 可降低每個提供者操作上限，以執行更積極的 smoke
- 選用驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可強制使用 profile-store auth，並忽略僅限 env 的覆寫

## Media live harness

- 命令：`pnpm test:live:media`
- 目的：
  - 透過單一 repo-native 進入點執行共用圖像、音樂和影片 live 套件
  - 從 `~/.profile` 自動載入缺少的提供者環境變數
  - 預設自動將每個套件縮小到目前有可用 auth 的提供者
  - 重用 `scripts/test-live.mjs`，因此 Heartbeat 和 quiet-mode 行為會保持一致
- 範例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相關

- [Testing](/zh-TW/help/testing) — unit、integration、QA 和 Docker 套件
