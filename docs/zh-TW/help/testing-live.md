---
read_when:
    - 執行即時模型矩陣 / CLI 後端 / ACP / 媒體提供者冒煙測試
    - 偵錯即時測試憑證解析
    - 新增提供者特定的即時測試
sidebarTitle: Live tests
summary: 實際（會觸及網路的）測試：模型矩陣、CLI 後端、ACP、媒體提供者、憑證
title: 測試：即時測試套件
x-i18n:
    generated_at: "2026-05-04T18:23:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

如需快速開始、QA 執行器、單元／整合測試套件與 Docker 流程，請參閱
[測試](/zh-TW/help/testing)。本頁涵蓋 **live**（會觸及網路）的測試
套件：模型矩陣、CLI 後端、ACP 與媒體提供者 live 測試，以及
憑證處理。

## Live：本機設定檔煙霧測試指令

在臨時 live 檢查前先 source `~/.profile`，讓提供者金鑰與本機工具
路徑和你的 shell 一致：

```bash
source ~/.profile
```

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

`voicecall smoke` 是 dry run，除非同時提供 `--yes`。只有在你刻意想撥出真實通知電話時，才使用 `--yes`。對 Twilio、Telnyx 與 Plivo 而言，成功的就緒檢查需要公開 Webhook URL；依設計會拒絕僅限本機的
loopback／私有備援。

## Live：Android Node 能力掃描

- 測試：`src/gateway/android-node.capabilities.live.test.ts`
- 指令碼：`pnpm android:test:integration`
- 目標：呼叫已連線 Android Node **目前宣告的每個指令**，並斷言指令合約行為。
- 範圍：
  - 預先條件／手動設定（此套件不會安裝／執行／配對 App）。
  - 針對選定 Android Node 逐一驗證 Gateway `node.invoke` 指令。
- 必要的預先設定：
  - Android App 已連線並配對至 Gateway。
  - App 保持在前景。
  - 已授予你預期會通過的能力所需權限／擷取同意。
- 選用目標覆寫：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 設定詳細資訊：[Android App](/zh-TW/platforms/android)

## Live：模型煙霧測試（設定檔金鑰）

Live 測試分成兩層，讓我們可以隔離失敗：

- 「直接模型」告訴我們提供者／模型是否能用指定金鑰回應。
- 「Gateway 煙霧測試」告訴我們該模型的完整 Gateway+代理管線是否能運作（工作階段、歷史、工具、沙箱政策等）。

### 第 1 層：直接模型補全（無 Gateway）

- 測試：`src/agents/models.profiles.live.test.ts`
- 目標：
  - 列舉已探索到的模型
  - 使用 `getApiKeyForModel` 選擇你有憑證的模型
  - 對每個模型執行小型補全（以及需要時的目標式回歸測試）
- 啟用方式：
  - `pnpm test:live`（或在直接呼叫 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 設定 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，modern 的別名）才會實際執行此套件；否則會略過，以讓 `pnpm test:live` 專注於 Gateway 煙霧測試
- 選擇模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 執行 modern 允許清單（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern 允許清單的別名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗號允許清單）
  - Modern/all 掃描預設使用精選的高訊號上限；設定 `OPENCLAW_LIVE_MAX_MODELS=0` 進行完整 modern 掃描，或設定正數作為較小上限。
  - 完整掃描會使用 `OPENCLAW_LIVE_TEST_TIMEOUT_MS` 作為整個直接模型測試逾時。預設值：60 分鐘。
  - 直接模型探測預設以 20 路平行執行；設定 `OPENCLAW_LIVE_MODEL_CONCURRENCY` 以覆寫。
- 選擇提供者的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗號允許清單）
- 金鑰來源：
  - 預設：設定檔儲存區與環境變數備援
  - 設定 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 以強制僅使用 **設定檔儲存區**
- 存在原因：
  - 將「提供者 API 故障／金鑰無效」與「Gateway 代理管線故障」分離
  - 包含小型、隔離的回歸測試（範例：OpenAI Responses/Codex Responses 推理重播 + 工具呼叫流程）

### 第 2 層：Gateway + 開發代理煙霧測試（「@openclaw」實際做的事）

- 測試：`src/gateway/gateway-models.profiles.live.test.ts`
- 目標：
  - 啟動程序內 Gateway
  - 建立／修補 `agent:dev:*` 工作階段（每次執行覆寫模型）
  - 迭代有金鑰的模型並斷言：
    - 「有意義的」回應（無工具）
    - 真實工具呼叫可運作（讀取探測）
    - 選用額外工具探測（執行+讀取探測）
    - OpenAI 回歸路徑（僅工具呼叫 → 後續回合）持續可運作
- 探測詳細資訊（讓你能快速解釋失敗）：
  - `read` 探測：測試會在工作區寫入 nonce 檔案，並要求代理 `read` 它且回傳 nonce。
  - `exec+read` 探測：測試會要求代理用 `exec` 將 nonce 寫入暫存檔，然後再 `read` 回來。
  - 圖片探測：測試附加產生的 PNG（貓 + 隨機碼），並預期模型回傳 `cat <CODE>`。
  - 實作參考：`src/gateway/gateway-models.profiles.live.test.ts` 與 `src/gateway/live-image-probe.ts`。
- 啟用方式：
  - `pnpm test:live`（或在直接呼叫 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
- 選擇模型的方式：
  - 預設：modern 允許清單（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern 允許清單的別名
  - 或設定 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗號清單）以縮小範圍
  - Modern/all Gateway 掃描預設使用精選的高訊號上限；設定 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 進行完整 modern 掃描，或設定正數作為較小上限。
- 選擇提供者的方式（避免「OpenRouter 全部」）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗號允許清單）
- 此 live 測試中的工具 + 圖片探測一律啟用：
  - `read` 探測 + `exec+read` 探測（工具壓力測試）
  - 當模型宣告支援圖片輸入時執行圖片探測
  - 流程（高階）：
    - 測試會產生帶有「CAT」+ 隨機碼的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 透過 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 傳送
    - Gateway 將附件解析成 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式代理將多模態使用者訊息轉送給模型
    - 斷言：回覆包含 `cat` + 該代碼（OCR 容錯：允許輕微錯誤）

<Tip>
若要查看你的機器可測試什麼（以及精確的 `provider/model` ids），請執行：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live：CLI 後端煙霧測試（Claude、Codex、Gemini 或其他本機 CLI）

- 測試：`src/gateway/gateway-cli-backend.live.test.ts`
- 目標：使用本機 CLI 後端驗證 Gateway + 代理管線，且不觸及你的預設設定。
- 後端專屬煙霧測試預設值位於所屬 Plugin 的 `cli-backend.ts` 定義。
- 啟用：
  - `pnpm test:live`（或在直接呼叫 Vitest 時使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 預設值：
  - 預設提供者／模型：`claude-cli/claude-sonnet-4-6`
  - 指令／參數／圖片行為來自所屬 CLI 後端 Plugin 中繼資料。
- 覆寫（選用）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 以傳送真實圖片附件（路徑會注入提示詞）。Docker 配方預設會關閉此項，除非明確要求。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 以將圖片檔案路徑作為 CLI 參數傳遞，而非注入提示詞。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）以在設定 `IMAGE_ARG` 時控制圖片參數的傳遞方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 以傳送第二回合並驗證恢復流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` 以在所選模型支援切換目標時，選擇加入 Claude Sonnet -> Opus 同工作階段連續性探測。Docker 配方為了整體可靠性，預設會關閉此項。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` 以選擇加入 MCP／工具 loopback 探測。Docker 配方預設會關閉此項，除非明確要求。

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

這不會要求 Gemini 產生回應。它會寫入 OpenClaw 提供給 Gemini 的同一組系統
設定，然後執行 `gemini --debug mcp list`，以證明已儲存的
`transport: "streamable-http"` 伺服器會正規化為 Gemini 的 HTTP MCP
形狀，並可連線到本機 streamable-HTTP MCP 伺服器。

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

注意：

- Docker 執行器位於 `scripts/test-live-cli-backend-docker.sh`。
- 它會以非 root `node` 使用者，在 repo Docker 映像中執行 live CLI 後端煙霧測試。
- 它會從所屬 Plugin 解析 CLI 煙霧測試中繼資料，然後將相符的 Linux CLI 套件（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安裝到 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 的可寫快取前綴（預設：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可攜式 Claude Code 訂閱 OAuth，來源可為帶有 `claudeAiOauth.subscriptionType` 的 `~/.claude/.credentials.json`，或來自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN`。它會先在 Docker 中證明直接 `claude -p` 可運作，接著在不保留 Anthropic API 金鑰環境變數的情況下執行兩個 Gateway CLI 後端回合。此訂閱路線預設會停用 Claude MCP／工具與圖片探測，因為 Claude 目前會將第三方 App 用量導向額外用量計費，而非一般訂閱方案限制。
- live CLI 後端煙霧測試現在會對 Claude、Codex 與 Gemini 執行相同的端到端流程：文字回合、圖片分類回合，然後是透過 Gateway CLI 驗證的 MCP `cron` 工具呼叫。
- Claude 的預設煙霧測試也會將工作階段從 Sonnet 修補為 Opus，並驗證恢復的工作階段仍記得先前的筆記。

## Live：APNs HTTP/2 proxy 可達性

- 測試：`src/infra/push-apns-http2.live.test.ts`
- 目標：透過本機 HTTP CONNECT proxy 通道連到 Apple 的沙箱 APNs 端點，送出 APNs HTTP/2 驗證請求，並斷言 Apple 的真實 `403 InvalidProviderToken` 回應會透過 proxy 路徑傳回。
- 啟用：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 選用逾時：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live：ACP 繫結煙霧測試（`/acp spawn ... --bind here`）

- 測試：`src/gateway/gateway-acp-bind.live.test.ts`
- 目標：使用即時 ACP 代理驗證真正的 ACP 對話綁定流程：
  - 傳送 `/acp spawn <agent> --bind here`
  - 就地綁定合成的訊息通道對話
  - 在同一個對話中傳送一般後續訊息
  - 確認後續訊息進入已綁定 ACP 工作階段的記錄
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
  - 此通道使用 Gateway `chat.send` 介面，並搭配僅限管理員的合成來源路由欄位，讓測試可以附加訊息通道情境，而不假裝進行外部投遞。
  - 未設定 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 時，測試會使用內嵌 `acpx` Plugin 的內建代理登錄，來選取 ACP 測試框架代理。
  - 已綁定工作階段的 Cron MCP 建立預設採最佳努力方式，因為外部 ACP 測試框架可能在綁定／圖片驗證通過後取消 MCP 呼叫；設定 `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` 可讓該綁定後 Cron 探測變成嚴格模式。

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
- 預設會依序對彙總的即時 CLI 代理執行 ACP 綁定煙霧測試：`claude`、`codex`，然後是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` 來縮小矩陣。
- 它會載入 `~/.profile`，將相符的 CLI 驗證資料暫存到容器中，然後在缺少時安裝要求的即時 CLI（`@anthropic-ai/claude-code`、`@openai/codex`、透過 `https://app.factory.ai/cli` 的 Factory Droid、`@google/gemini-cli` 或 `opencode-ai`）。ACP 後端本身是官方 `acpx` Plugin 中內嵌的 `acpx/runtime` 套件。
- Droid Docker 變體會暫存 `~/.factory` 作為設定，轉送 `FACTORY_API_KEY`，並要求該 API 金鑰，因為本機 Factory OAuth／鑰匙圈驗證無法攜入容器。它使用 ACPX 內建的 `droid exec --output-format acp` 登錄項目。
- OpenCode Docker 變體是嚴格的單一代理回歸通道。它會在載入 `~/.profile` 後，從 `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（預設 `opencode/kimi-k2.6`）寫入暫時的 `OPENCODE_CONFIG_CONTENT` 預設模型，且 `pnpm test:docker:live-acp-bind:opencode` 會要求已綁定的助理記錄，而不是接受一般的綁定後略過。
- 直接 `acpx` CLI 呼叫僅是用於在 Gateway 外比較行為的手動／權宜路徑。Docker ACP 綁定煙霧測試會測試 OpenClaw 內嵌的 `acpx` 執行階段後端。

## 即時：Codex 應用伺服器測試框架煙霧測試

- 目標：透過一般 Gateway
  `agent` 方法驗證 Plugin 擁有的 Codex 測試框架：
  - 載入內建 `codex` Plugin
  - 選取 `OPENCLAW_AGENT_RUNTIME=codex`
  - 在強制使用 Codex 測試框架的情況下，向 `openai/gpt-5.5` 傳送第一個 Gateway 代理回合
  - 向同一個 OpenClaw 工作階段傳送第二個回合，並確認應用伺服器
    執行緒可恢復
  - 透過相同的 Gateway 命令
    路徑執行 `/codex status` 和 `/codex models`
  - 選擇性執行兩個經 Guardian 審核的提升權限 shell 探測：一個應核准的良性
    命令，以及一個應拒絕的假秘密上傳，讓代理回問
- 測試：`src/gateway/gateway-codex-harness.live.test.ts`
- 啟用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 預設模型：`openai/gpt-5.5`
- 選用圖片探測：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 選用 MCP／工具探測：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 選用 Guardian 探測：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 煙霧測試使用 `agentRuntime.id: "codex"`，因此壞掉的 Codex 測試框架無法
  透過靜默退回 PI 而通過。
- 驗證：來自本機 Codex 訂閱登入的 Codex 應用伺服器驗證。Docker
  煙霧測試也可以在適用時為非 Codex 探測提供 `OPENAI_API_KEY`，
  並可選擇性複製 `~/.codex/auth.json` 和 `~/.codex/config.toml`。

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
  前綴、暫存原始碼樹，然後只執行 Codex 測試框架即時測試。
- Docker 預設啟用圖片、MCP／工具和 Guardian 探測。當你需要較窄的除錯
  執行時，請設定
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 使用相同的明確 Codex 執行階段設定，因此舊版別名或 PI
  退回無法隱藏 Codex 測試框架回歸。

### 建議的即時配方

狹窄且明確的允許清單最快且最不容易不穩：

- 單一模型，直接（無 Gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 單一模型，Gateway 煙霧測試：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多個供應商的工具呼叫：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 焦點（Gemini API 金鑰 + Antigravity）：
  - Gemini（API 金鑰）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 自適應思考煙霧測試：
  - 如果本機金鑰位於 shell 設定檔：`source ~/.profile`
  - Gemini 3 動態預設：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動態預算：`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注意事項：

- `google/...` 使用 Gemini API（API 金鑰）。
- `google-antigravity/...` 使用 Antigravity OAuth 橋接器（Cloud Code Assist 風格代理端點）。
- `google-gemini-cli/...` 使用你機器上的本機 Gemini CLI（獨立驗證 + 工具行為差異）。
- Gemini API 與 Gemini CLI：
  - API：OpenClaw 透過 HTTP 呼叫 Google 託管的 Gemini API（API 金鑰／設定檔驗證）；這是大多數使用者所指的「Gemini」。
  - CLI：OpenClaw 會 shell 到本機 `gemini` 二進位檔；它有自己的驗證方式，且可能表現不同（串流／工具支援／版本偏差）。

## 即時：模型矩陣（涵蓋範圍）

沒有固定的「CI 模型清單」（即時測試需選擇加入），但以下是建議在有金鑰的開發機上定期涵蓋的**建議**模型。

### 現代煙霧測試集合（工具呼叫 + 圖片）

這是我們預期要持續可用的「常用模型」執行：

- OpenAI（非 Codex）：`openai/gpt-5.5`
- OpenAI Codex OAuth：`openai-codex/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免較舊的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- DeepSeek：`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

使用工具 + 圖片執行 Gateway 煙霧測試：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基準：工具呼叫（Read + 選用 Exec）

每個供應商家族至少挑選一個：

- OpenAI：`openai/gpt-5.5`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- DeepSeek：`deepseek/deepseek-v4-flash`
- Z.AI（GLM）：`zai/glm-5.1`
- MiniMax：`minimax/MiniMax-M2.7`

選用的額外涵蓋（建議具備）：

- xAI：`xai/grok-4.3`（或最新可用版本）
- Mistral：`mistral/`…（挑選一個你已啟用且支援「tools」的模型）
- Cerebras：`cerebras/`…（如果你有存取權）
- LM Studio：`lmstudio/`…（本機；工具呼叫取決於 API 模式）

### 視覺：圖片傳送（附件 → 多模態訊息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一個支援圖片的模型（Claude／Gemini／支援視覺的 OpenAI 變體等），以測試圖片探測。

### 聚合器／替代閘道

如果你已啟用金鑰，我們也支援透過以下方式測試：

- OpenRouter：`openrouter/...`（數百個模型；使用 `openclaw models scan` 尋找支援工具 + 圖片的候選項）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（透過 `OPENCODE_API_KEY`／`OPENCODE_ZEN_API_KEY` 驗證）

你可以納入即時矩陣的更多供應商（如果你有憑證／設定）：

- 內建：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 透過 `models.providers`（自訂端點）：`minimax`（雲端／API），以及任何 OpenAI／Anthropic 相容 Proxy（LM Studio、vLLM、LiteLLM 等）

<Tip>
不要在文件中硬編碼「所有模型」。權威清單是你機器上 `discoverModels(...)` 回傳的內容，加上可用的金鑰。
</Tip>

## 憑證（絕不提交）

即時測試會以與 CLI 相同的方式探索憑證。實務影響：

- 如果 CLI 可用，live 測試應該會找到相同的金鑰。
- 如果 live 測試顯示「no creds」，請用你偵錯 `openclaw models list` / 模型選擇的相同方式偵錯。

- 每個代理的驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（這就是 live 測試中「profile keys」的意思）
- 設定：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 舊版狀態目錄：`~/.openclaw/credentials/`（存在時會複製到暫存的 live home，但不是主要的 profile-key 儲存區）
- local live 執行預設會將作用中的設定、每個代理的 `auth-profiles.json` 檔案、舊版 `credentials/`，以及支援的外部 CLI 驗證目錄複製到暫存測試 home；暫存的 live home 會略過 `workspace/` 和 `sandboxes/`，並移除 `agents.*.workspace` / `agentDir` 路徑覆寫，讓探測不會碰到你真實主機上的工作區。

如果你想依賴環境金鑰（例如匯出在你的 `~/.profile` 中），請在 `source ~/.profile` 之後執行 local 測試，或使用下方 Docker runner（它們可以將 `~/.profile` 掛載到容器中）。

## Deepgram live（音訊轉錄）

- 測試：`extensions/deepgram/audio.live.test.ts`
- 啟用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus 程式碼規劃 live

- 測試：`extensions/byteplus/live.test.ts`
- 啟用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可選模型覆寫：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- 測試：`extensions/comfy/comfy.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 範圍：
  - 測試隨附的 comfy 圖片、影片與 `music_generate` 路徑
  - 除非已設定 `plugins.entries.comfy.config.<capability>`，否則略過各項能力
  - 適合在變更 comfy workflow 提交、輪詢、下載或 Plugin 註冊之後使用

## 圖像生成 live

- 測試：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 範圍：
  - 列舉每個已註冊的圖像生成 provider Plugin
  - 探測前從你的登入 shell（`~/.profile`）載入缺少的 provider 環境變數
  - 預設優先使用 live/env API 金鑰，而不是已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真正的 shell 認證
  - 略過沒有可用 auth/profile/model 的 provider
  - 透過共享的圖像生成 runtime 執行每個已設定的 provider：
    - `<provider>:generate`
    - 當 provider 宣告支援編輯時執行 `<provider>:edit`
- 目前涵蓋的隨附 provider：
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 會強制使用設定檔儲存區驗證，並忽略僅 env 的覆寫

對於已發布的 CLI 路徑，請在 provider/runtime live 測試通過後加入一個 `infer` smoke：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

這會涵蓋 CLI 引數解析、設定/default-agent 解析、隨附 Plugin 啟用、共享圖像生成 runtime，以及 live provider 請求。Plugin 依賴項預期會在 runtime 載入前存在。

## 音樂生成 live

- 測試：`extensions/music-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 範圍：
  - 測試共享的隨附音樂生成 provider 路徑
  - 目前涵蓋 Google 和 MiniMax
  - 探測前從你的登入 shell（`~/.profile`）載入 provider 環境變數
  - 預設優先使用 live/env API 金鑰，而不是已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真正的 shell 認證
  - 略過沒有可用 auth/profile/model 的 provider
  - 可用時執行兩種已宣告的 runtime 模式：
    - 使用僅 prompt 輸入執行 `generate`
    - 當 provider 宣告 `capabilities.edit.enabled` 時執行 `edit`
  - 目前共享 lane 涵蓋範圍：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：獨立的 Comfy live 檔案，不在此共享 sweep 中
- 可選縮小範圍：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 可選驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 會強制使用設定檔儲存區驗證，並忽略僅 env 的覆寫

## 影片生成 live

- 測試：`extensions/video-generation-providers.live.test.ts`
- 啟用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 範圍：
  - 測試共享的隨附影片生成 provider 路徑
  - 預設使用 release-safe smoke 路徑：非 FAL provider、每個 provider 一個 text-to-video 請求、一秒 lobster prompt，以及來自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每個 provider 作業上限（預設為 `180000`）
  - 預設略過 FAL，因為 provider 端佇列延遲可能主導發布時間；傳入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可明確執行它
  - 探測前從你的登入 shell（`~/.profile`）載入 provider 環境變數
  - 預設優先使用 live/env API 金鑰，而不是已儲存的驗證設定檔，因此 `auth-profiles.json` 中過期的測試金鑰不會遮蔽真正的 shell 認證
  - 略過沒有可用 auth/profile/model 的 provider
  - 預設只執行 `generate`
  - 設定 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 也會在可用時執行已宣告的轉換模式：
    - 當 provider 宣告 `capabilities.imageToVideo.enabled`，且所選 provider/model 在共享 sweep 中接受 buffer-backed local 圖像輸入時執行 `imageToVideo`
    - 當 provider 宣告 `capabilities.videoToVideo.enabled`，且所選 provider/model 在共享 sweep 中接受 buffer-backed local 影片輸入時執行 `videoToVideo`
  - 目前在共享 sweep 中已宣告但略過的 `imageToVideo` provider：
    - `vydra`，因為隨附的 `veo3` 只支援文字，而隨附的 `kling` 需要遠端圖像 URL
  - Provider 專屬的 Vydra 涵蓋範圍：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 該檔案預設會執行 `veo3` text-to-video，以及使用遠端圖像 URL fixture 的 `kling` lane
  - 目前 `videoToVideo` live 涵蓋範圍：
    - 只有在所選模型為 `runway/gen4_aleph` 時才涵蓋 `runway`
  - 目前在共享 sweep 中已宣告但略過的 `videoToVideo` provider：
    - `alibaba`、`qwen`、`xai`，因為這些路徑目前需要遠端 `http(s)` / MP4 參考 URL
    - `google`，因為目前的共享 Gemini/Veo lane 使用 local buffer-backed 輸入，而共享 sweep 不接受該路徑
    - `openai`，因為目前的共享 lane 缺少 org-specific 影片 inpaint/remix 存取保證
- 可選縮小範圍：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 會在預設 sweep 中包含每個 provider，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 可為積極的 smoke 執行縮短每個 provider 的作業上限
- 可選驗證行為：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 會強制使用設定檔儲存區驗證，並忽略僅 env 的覆寫

## Media live harness

- 命令：`pnpm test:live:media`
- 目的：
  - 透過單一 repo-native 入口點執行共享的圖像、音樂與影片 live suite
  - 自動從 `~/.profile` 載入缺少的 provider 環境變數
  - 預設自動將每個 suite 縮小到目前具有可用驗證的 provider
  - 重複使用 `scripts/test-live.mjs`，因此 Heartbeat 和 quiet-mode 行為會保持一致
- 範例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 相關

- [測試](/zh-TW/help/testing) — unit、integration、QA 和 Docker suite
