---
read_when:
    - 執行即時模型矩陣 / CLI 後端 / ACP / media-provider 冒煙測試
    - 偵錯即時測試憑證解析
    - 新增提供者專屬的即時測試
sidebarTitle: Live tests
summary: 即時（會觸及網路的）測試：模型矩陣、CLI 後端、ACP、媒體提供者、憑證
title: 測試：即時套件
x-i18n:
    generated_at: "2026-05-02T20:49:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

若要查看快速入門、QA 執行器、單元/整合套件，以及 Docker 流程，請參閱
[測試](/zh-TW/help/testing)。本頁涵蓋 **live**（會觸及網路）的測試
套件：模型矩陣、CLI 後端、ACP，以及媒體供應商 live 測試，另含
憑證處理。

## Live：本機設定檔冒煙命令

在臨時 live 檢查前先 source `~/.profile`，讓供應商金鑰與本機工具
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

除非同時存在 `--yes`，否則 `voicecall smoke` 是 dry run。只有在你有意放出真實通知通話時才使用 `--yes`。對於 Twilio、Telnyx 和 Plivo，成功的就緒檢查需要公開 Webhook URL；依設計會拒絕僅限本機的 loopback/私人 fallback。

## Live：Android 節點功能掃描

- 測試：`src/gateway/android-node.capabilities.live.test.ts`
- 指令碼：`pnpm android:test:integration`
- 目標：叫用已連線 Android 節點**目前宣告的每一個命令**，並斷言命令合約行為。
- 範圍：
  - 具備前置條件/手動設定（此套件不會安裝/執行/配對 App）。
  - 針對所選 Android 節點逐一命令進行 gateway `node.invoke` 驗證。
- 必要前置設定：
  - Android App 已連線並配對到 gateway。
  - App 保持在前景。
  - 已授予你預期會通過的功能所需權限/擷取同意。
- 選用目標覆寫：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 設定詳細資訊：[Android App](/zh-TW/platforms/android)

## Live：模型冒煙測試（設定檔金鑰）

Live 測試分成兩層，讓我們能隔離失敗：

- 「直接模型」告訴我們指定金鑰下，供應商/模型是否完全能回答。
- 「Gateway 冒煙測試」告訴我們完整 gateway+agent 管線是否能讓該模型運作（工作階段、歷史、工具、沙盒政策等）。

### 第 1 層：直接模型完成（無 gateway）

- 測試：`src/agents/models.profiles.live.test.ts`
- 目標：
  - 列舉已探索到的模型
  - 使用 `getApiKeyForModel` 選取你有憑證的模型
  - 每個模型執行一次小型 completion（並在需要時執行目標式回歸測試）
- 啟用方式：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 設定 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，modern 的別名）才會實際執行此套件；否則它會略過，以讓 `pnpm test:live` 聚焦於 gateway 冒煙測試
- 選取模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 執行 modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern allowlist 的別名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗號 allowlist）
  - Modern/all 掃描預設使用經策展的高訊號上限；設定 `OPENCLAW_LIVE_MAX_MODELS=0` 可進行完整 modern 掃描，或設定正數以使用較小上限。
  - 完整掃描會使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作為整個直接模型測試逾時。預設：60 分鐘。
  - 直接模型探測預設以 20 路平行執行；設定 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 可覆寫。
- 選取供應商的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗號 allowlist）
- 金鑰來源：
  - 預設：設定檔儲存區與環境 fallback
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 強制只使用**設定檔儲存區**
- 存在原因：
  - 將「供應商 API 壞了 / 金鑰無效」與「gateway agent 管線壞了」分開
  - 包含小型、隔離的回歸測試（範例：OpenAI Responses/Codex Responses 推理重播 + 工具呼叫流程）

### 第 2 層：Gateway + 開發 agent 冒煙測試（"@openclaw" 實際做的事）

- 測試：`src/gateway/gateway-models.profiles.live.test.ts`
- 目標：
  - 啟動程序內 gateway
  - 建立/修補 `agent:dev:*` 工作階段（每次執行覆寫模型）
  - 逐一檢查具有金鑰的模型並斷言：
    - 「有意義」回應（無工具）
    - 真實工具叫用可運作（讀取探測）
    - 選用額外工具探測（執行+讀取探測）
    - OpenAI 回歸路徑（僅工具呼叫 → follow-up）維持可用
- 探測詳細資訊（讓你能快速解釋失敗）：
  - `read` 探測：測試在 workspace 中寫入 nonce 檔案，並要求 agent `read` 它且回顯 nonce。
  - `exec+read` 探測：測試要求 agent `exec` 將 nonce 寫入暫存檔，再 `read` 回來。
  - image 探測：測試附加產生的 PNG（cat + 隨機程式碼），並預期模型回傳 `cat <CODE>`。
  - 實作參考：`src/gateway/gateway-models.profiles.live.test.ts` 與 `src/gateway/live-image-probe.ts`。
- 啟用方式：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 選取模型的方式：
  - 預設：modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern allowlist 的別名
  - 或設定 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗號清單）以縮小範圍
  - Modern/all gateway 掃描預設使用經策展的高訊號上限；設定 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可進行完整 modern 掃描，或設定正數以使用較小上限。
- 選取供應商的方式（避免「OpenRouter 全部」）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗號 allowlist）
- 此 live 測試一律開啟工具 + image 探測：
  - `read` 探測 + `exec+read` 探測（工具壓力）
  - 模型宣告支援 image input 時會執行 image 探測
  - 流程（高階）：
    - 測試產生含有「CAT」+ 隨機程式碼的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 透過 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 傳送
    - Gateway 將附件解析到 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 內嵌 agent 將多模態使用者訊息轉送給模型
    - 斷言：回覆包含 `cat` + 該程式碼（OCR 容忍度：允許小錯誤）

<Tip>
若要查看你的機器可以測試什麼（以及精確的 `provider/model` id），請執行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live：CLI 後端冒煙測試（Claude、Codex、Gemini 或其他本機 CLI）

- 測試：`src/gateway/gateway-cli-backend.live.test.ts`
- 目標：使用本機 CLI 後端驗證 Gateway + agent 管線，而不碰你的預設 config。
- 後端專屬冒煙預設值位於擁有者 Plugin 的 `cli-backend.ts` 定義中。
- 啟用：
  - `pnpm test:live`（或在直接叫用 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 預設：
  - 預設供應商/模型：`claude-cli/claude-sonnet-4-6`
  - 命令/args/image 行為來自擁有者 CLI 後端 Plugin metadata。
- 覆寫（選用）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 傳送真實 image attachment（路徑會注入 prompt）。Docker recipe 預設關閉此項，除非明確要求。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 將 image 檔案路徑作為 CLI args 傳入，而不是注入 prompt。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制設定 `IMAGE_ARG` 時 image args 的傳遞方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 傳送第二輪並驗證 resume 流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 在所選模型支援 switch target 時，選擇加入 Claude Sonnet -> Opus 同工作階段連續性探測。Docker recipe 預設為了彙總可靠性關閉此項。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 選擇加入 MCP/tool loopback 探測。Docker recipe 預設關閉此項，除非明確要求。

範例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

廉價 Gemini MCP config 冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

這不會要求 Gemini 產生回應。它會寫入 OpenClaw 提供給 Gemini 的相同系統
設定，接著執行 `gemini --debug mcp list`，證明已儲存的 `transport: "streamable-http"` 伺服器會正規化為 Gemini 的 HTTP MCP
形狀，並可連線到本機 streamable-HTTP MCP 伺服器。

Docker recipe：

```bash
pnpm test:docker:live-cli-backend
```

單一供應商 Docker recipe：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

備註：

- Docker 執行器位於 `scripts/test-live-cli-backend-docker.sh`。
- 它會以非 root `node` 使用者，在 repo Docker image 中執行 live CLI-backend 冒煙測試。
- 它會從擁有者 Plugin 解析 CLI 冒煙 metadata，接著將相符的 Linux CLI package（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安裝到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的快取可寫入 prefix（預設：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可攜式 Claude Code 訂閱 OAuth，可透過含有 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json` 或來自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`。它會先在 Docker 中證明直接 `claude -p` 可用，接著在不保留 Anthropic API-key env vars 的情況下執行兩輪 Gateway CLI-backend。此訂閱 lane 預設停用 Claude MCP/tool 與 image 探測，因為 Claude 目前會將第三方 App 使用量導向額外用量計費，而不是一般訂閱方案限制。
- live CLI-backend 冒煙測試現在會對 Claude、Codex 和 Gemini 執行相同的端對端流程：文字輪次、image 分類輪次，接著是透過 gateway CLI 驗證的 MCP `cron` 工具呼叫。
- Claude 的預設冒煙測試也會將工作階段從 Sonnet 修補為 Opus，並驗證續接的工作階段仍記得先前的備註。

## Live：ACP bind 冒煙測試（`/acp spawn ... --bind here`）

- 測試：`src/gateway/gateway-acp-bind.live.test.ts`
- 目標：使用即時 ACP agent 驗證真實的 ACP 對話綁定流程：
  - 傳送 `/acp spawn <agent> --bind here`
  - 就地綁定合成的訊息通道對話
  - 在同一個對話上傳送一般後續訊息
  - 驗證後續訊息會落入已綁定的 ACP 工作階段轉錄稿
- 啟用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 預設值：
  - Docker 中的 ACP agents：`claude,codex,gemini`
  - 直接執行 `pnpm test:live ...` 時的 ACP agent：`claude`
  - 合成通道：Slack DM 樣式的對話情境
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
  - 此 lane 使用 Gateway `chat.send` 介面，並搭配僅限管理員使用的合成 originating-route 欄位，讓測試可以附加訊息通道情境，而不必假裝對外遞送。
  - 未設定 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 時，測試會使用內嵌 `acpx` Plugin 內建的 agent 登錄表，來選取 ACP harness agent。
  - 已綁定工作階段的 Cron MCP 建立預設為 best-effort，因為外部 ACP harness 可能會在綁定/影像證明通過後取消 MCP 呼叫；設定 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可讓該綁定後 Cron 探測變為嚴格模式。

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

Docker 備註：

- Docker 執行器位於 `scripts/test-live-acp-bind-docker.sh`。
- 預設會依序針對聚合的即時 CLI agents 執行 ACP 綁定 smoke：`claude`、`codex`，接著是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 來縮小矩陣。
- 它會載入 `~/.profile`，將相符的 CLI 驗證材料暫存到容器中，接著在缺少時安裝所要求的即時 CLI（`@anthropic-ai/claude-code`、`@openai/codex`、透過 `https://app.factory.ai/cli` 的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 後端本身是來自官方 `acpx` Plugin 的內嵌 `acpx/runtime` 套件。
- Droid Docker 變體會暫存 `~/.factory` 以取得設定，轉送 `FACTORY_API_KEY`，且需要該 API key，因為本機 Factory OAuth/keyring 驗證無法移植到容器中。它使用 ACPX 內建的 `droid exec --output-format acp` 登錄項目。
- OpenCode Docker 變體是嚴格的單一 agent 回歸 lane。它會在載入 `~/.profile` 後，從 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` 寫入暫時的 `OPENCODE_CONFIG_CONTENT` 預設模型（預設為 `opencode/kimi-k2.6`），且 `pnpm test:docker:live-acp-bind:opencode` 需要已綁定的 assistant 轉錄稿，而不是接受一般的綁定後略過。
- 直接 `acpx` CLI 呼叫僅是手動/因應途徑，用於比較 Gateway 之外的行為。Docker ACP 綁定 smoke 會測試 OpenClaw 內嵌的 `acpx` runtime 後端。

## 即時：Codex app-server harness smoke

- 目標：透過一般 Gateway
  `agent` 方法驗證由 Plugin 擁有的 Codex harness：
  - 載入隨附的 `codex` Plugin
  - 選取 `OPENCLAW_AGENT_RUNTIME=codex`
  - 在強制使用 Codex harness 的情況下，將第一個 Gateway agent turn 傳送至 `openai/gpt-5.5`
  - 將第二個 turn 傳送至同一個 OpenClaw 工作階段，並驗證 app-server
    thread 可以繼續
  - 透過相同 Gateway 命令路徑執行 `/codex status` 和 `/codex models`
  - 可選擇執行兩個經 Guardian 審查的提升權限 shell 探測：一個應被核准的無害
    命令，以及一個應被拒絕、讓 agent 回問的假秘密上傳
- 測試：`src/gateway/gateway-codex-harness.live.test.ts`
- 啟用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 預設模型：`openai/gpt-5.5`
- 選用影像探測：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 選用 MCP/tool 探測：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 選用 Guardian 探測：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 此 smoke 會設定 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此損壞的 Codex
  harness 無法透過悄悄 fallback 到 PI 而通過。
- 驗證：來自本機 Codex 訂閱登入的 Codex app-server 驗證。Docker
  smokes 在適用時也可為非 Codex 探測提供 `OPENAI_API_KEY`，
  以及選用複製的 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

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

Docker 備註：

- Docker 執行器位於 `scripts/test-live-codex-harness-docker.sh`。
- 它會載入已掛載的 `~/.profile`，傳遞 `OPENAI_API_KEY`，在存在時複製 Codex CLI
  驗證檔案，將 `@openai/codex` 安裝到可寫入的已掛載 npm
  prefix，暫存原始碼樹，然後只執行 Codex-harness 即時測試。
- Docker 預設會啟用影像、MCP/tool 和 Guardian 探測。需要較窄的偵錯
  執行時，請設定
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 也會匯出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，與即時
  測試設定相符，因此舊版別名或 PI fallback 無法隱藏 Codex harness
  回歸。

### 建議的即時配方

狹窄、明確的允許清單最快且最不易出現不穩定：

- 單一模型，直接執行（無 Gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 單一模型，Gateway smoke：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多個 provider 的 tool calling：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 重點測試（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke：
  - 如果本機 key 位於 shell profile：`source ~/.profile`
  - Gemini 3 動態預設值：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動態預算：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

備註：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth 橋接（Cloud Code Assist 樣式的 agent endpoint）。
- `google-gemini-cli/...` 使用你機器上的本機 Gemini CLI（獨立驗證 + tooling 行為差異）。
- Gemini API 與 Gemini CLI：
  - API：OpenClaw 透過 HTTP 呼叫 Google 的託管 Gemini API（API key / profile auth）；這是多數使用者所指的「Gemini」。
  - CLI：OpenClaw shell out 到本機 `gemini` 二進位檔；它有自己的驗證，且可能有不同的行為（streaming/tool support/version skew）。

## 即時：模型矩陣（涵蓋範圍）

沒有固定的「CI 模型清單」（即時測試需選擇加入），但以下是在具備 key 的開發機器上建議定期涵蓋的**建議**模型。

### 現代 smoke 集合（tool calling + image）

這是我們預期持續可用的「常見模型」執行項目：

- OpenAI（非 Codex）：`openai/gpt-5.5`
- OpenAI Codex OAuth：`openai-codex/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免較舊的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

使用 tools + image 執行 Gateway smoke：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基準：tool calling（Read + 選用 Exec）

每個 provider family 至少選一個：

- OpenAI：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

選用額外涵蓋範圍（有會更好）：

- xAI：`xai/grok-4.3`（或最新可用版本）
- Mistral：`mistral/`…（選取一個你已啟用、支援「tools」的模型）
- Cerebras：`cerebras/`…（如果你有存取權）
- LM Studio：`lmstudio/`…（本機；tool calling 取決於 API 模式）

### 視覺：影像傳送（attachment → multimodal message）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一個支援影像的模型（Claude/Gemini/OpenAI vision-capable 變體等），以測試影像探測。

### Aggregators / 替代 Gateway

如果你已啟用 key，我們也支援透過以下項目測試：

- OpenRouter：`openrouter/...`（數百個模型；使用 `openclaw models scan` 找出支援 tool+image 的候選模型）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（透過 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 驗證）

你可以納入即時矩陣的更多 provider（如果你有 creds/config）：

- 內建：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 透過 `models.providers`（自訂 endpoints）：`minimax`（cloud/API），以及任何 OpenAI/Anthropic-compatible proxy（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文件中硬編碼「所有模型」。權威清單是你機器上 `discoverModels(...)` 回傳的內容，加上可用的 key。
</Tip>

## 憑證（絕不可 commit）

即時測試會以與 CLI 相同的方式探索憑證。實際影響：

- 如果 CLI 可以運作，live 測試應該會找到相同的金鑰。
- 如果 live 測試顯示「no creds」，請用你偵錯 `openclaw models list` / 模型選擇的相同方式偵錯。

- 每個代理的驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（這就是 live 測試中「profile keys」的意思）
- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 舊版狀態目錄：`~/.openclaw/credentials/`（存在時會複製到暫存的 live home，但不是主要的 profile-key 儲存區）
- 本機 live 執行預設會將作用中的設定、每個代理的 `auth-profiles.json` 檔案、舊版 `credentials/`，以及受支援的外部 CLI 驗證目錄複製到暫存測試 home；暫存 live home 會略過 `workspace/` 和 `sandboxes/`，且會移除 `agents.*.workspace` / `agentDir` 路徑覆寫，讓探測不會碰到你真正主機上的工作區。

如果你想依賴環境金鑰（例如匯出在你的 `~/.profile` 中），請在 `source ~/.profile` 後執行本機測試，或使用下方 Docker 執行器（它們可以將 `~/.profile` 掛載到容器中）。

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
  - 測試隨附的 comfy 圖片、影片和 `music_generate` 路徑
  - 除非已設定 `plugins.entries.comfy.config.<capability>`，否則略過每項能力
  - 適合在變更 comfy workflow 提交、輪詢、下載或 Plugin 註冊後使用

## 圖片生成 live

- 測試：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- 測試框架：`pnpm test:live:media image`
- 範圍：
  - 列舉每個已註冊的圖片生成提供者 Plugin
  - 在探測前從你的登入 shell（`~/.profile`）載入缺少的提供者環境變數
  - 預設優先使用 live/env API 金鑰，而不是已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 憑證
  - 略過沒有可用驗證/設定檔/模型的提供者
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 會強制使用 profile-store 驗證並忽略僅 env 的覆寫

針對已發布的 CLI 路徑，請在提供者/執行階段 live
測試通過後加入 `infer` smoke：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

這會涵蓋 CLI 參數解析、設定/預設代理解析、隨附
Plugin 啟用、共用圖片生成執行階段，以及 live 提供者
請求。Plugin 相依項目預期會在執行階段載入前存在。

## 音樂生成 live

- 測試：`extensions/music-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media music`
- 範圍：
  - 測試共用的隨附音樂生成提供者路徑
  - 目前涵蓋 Google 和 MiniMax
  - 在探測前從你的登入 shell（`~/.profile`）載入提供者環境變數
  - 預設優先使用 live/env API 金鑰，而不是已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 憑證
  - 略過沒有可用驗證/設定檔/模型的提供者
  - 可用時執行兩種宣告的執行階段模式：
    - 使用僅 prompt 輸入的 `generate`
    - 當提供者宣告 `capabilities.edit.enabled` 時執行 `edit`
  - 目前共用 lane 涵蓋：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：獨立的 Comfy live 檔案，不在此共用掃描中
- 選用縮小範圍：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 選用驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 會強制使用 profile-store 驗證並忽略僅 env 的覆寫

## 影片生成 live

- 測試：`extensions/video-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 測試框架：`pnpm test:live:media video`
- 範圍：
  - 測試共用的隨附影片生成提供者路徑
  - 預設使用發布安全的 smoke 路徑：非 FAL 提供者、每個提供者一個文字轉影片請求、一秒的龍蝦 prompt，以及來自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每提供者操作上限（預設為 `180000`）
  - 預設略過 FAL，因為提供者端佇列延遲可能主導發布時間；傳入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可明確執行它
  - 在探測前從你的登入 shell（`~/.profile`）載入提供者環境變數
  - 預設優先使用 live/env API 金鑰，而不是已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真實的 shell 憑證
  - 略過沒有可用驗證/設定檔/模型的提供者
  - 預設只執行 `generate`
  - 設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 以在可用時也執行宣告的 transform 模式：
    - 當提供者宣告 `capabilities.imageToVideo.enabled`，且選定的提供者/模型在共用掃描中接受以 buffer-backed 本機圖片作為輸入時執行 `imageToVideo`
    - 當提供者宣告 `capabilities.videoToVideo.enabled`，且選定的提供者/模型在共用掃描中接受以 buffer-backed 本機影片作為輸入時執行 `videoToVideo`
  - 目前在共用掃描中已宣告但略過的 `imageToVideo` 提供者：
    - `vydra`，因為隨附的 `veo3` 僅支援文字，而隨附的 `kling` 需要遠端圖片 URL
  - 提供者專屬 Vydra 涵蓋：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 該檔案會執行 `veo3` 文字轉影片，以及預設使用遠端圖片 URL fixture 的 `kling` lane
  - 目前 `videoToVideo` live 涵蓋：
    - 只有在選定模型為 `runway/gen4_aleph` 時才涵蓋 `runway`
  - 目前在共用掃描中已宣告但略過的 `videoToVideo` 提供者：
    - `alibaba`、`qwen`、`xai`，因為這些路徑目前需要遠端 `http(s)` / MP4 參考 URL
    - `google`，因為目前共用的 Gemini/Veo lane 使用本機 buffer-backed 輸入，而共用掃描不接受該路徑
    - `openai`，因為目前的共用 lane 缺少組織專屬影片 inpaint/remix 存取保證
- 選用縮小範圍：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在預設掃描中包含每個提供者，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 以降低每個提供者操作上限，用於更激進的 smoke 執行
- 選用驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 會強制使用 profile-store 驗證並忽略僅 env 的覆寫

## Media live 測試框架

- 命令：`pnpm test:live:media`
- 目的：
  - 透過一個 repo-native 進入點執行共用圖片、音樂和影片 live 套件
  - 從 `~/.profile` 自動載入缺少的提供者環境變數
  - 預設自動將每個套件縮小到目前具有可用驗證的提供者
  - 重用 `scripts/test-live.mjs`，因此 Heartbeat 和 quiet-mode 行為保持一致
- 範例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相關

- [測試](/zh-TW/help/testing) — 單元、整合、QA 和 Docker 套件
