---
read_when:
    - 您需要一份按提供者分類的模型設定參考
    - 你需要模型提供者的範例設定或 CLI 入門命令
sidebarTitle: Model providers
summary: 模型供應商概觀，包含範例設定與 CLI 流程
title: 模型供應商
x-i18n:
    generated_at: "2026-05-02T02:48:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34e6a6b691b447a66a94f69a7b609f26c587eaa5bc55c5ed62460ce14cc288fd
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM/模型提供者的參考（不是像 WhatsApp/Telegram 這類聊天通道）。模型選擇規則請參閱 [模型](/zh-TW/concepts/models)。

## 快速規則

<AccordionGroup>
  <Accordion title="模型參照與 CLI 輔助工具">
    - 模型參照使用 `provider/model`（範例：`opencode/claude-opus-4-6`）。
    - 設定 `agents.defaults.models` 時，會作為允許清單。
    - CLI 輔助工具：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` 會設定提供者層級的預設值；`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` 會按模型覆寫這些值。
    - 後援規則、冷卻探測，以及工作階段覆寫持久化：[模型容錯移轉](/zh-TW/concepts/model-failover)。

  </Accordion>
  <Accordion title="新增提供者驗證不會變更你的主要模型">
    當你新增或重新驗證提供者時，`openclaw configure` 會保留現有的 `agents.defaults.model.primary`。提供者 Plugin 仍可能在其驗證設定修補中回傳建議的預設模型，但若主要模型已存在，configure 會將其視為「讓這個模型可用」，而不是「取代目前的主要模型」。

    若要有意切換預設模型，請使用 `openclaw models set <provider/model>` 或 `openclaw models auth login --provider <id> --set-default`。

  </Accordion>
  <Accordion title="OpenAI 提供者/執行階段分離">
    OpenAI 系列路由依前綴區分：

    - `openai/<model>` 加上 `agents.defaults.agentRuntime.id: "codex"` 會使用原生 Codex app-server harness。這是常見的 ChatGPT/Codex 訂閱設定。
    - `openai-codex/<model>` 會在 PI 中使用 Codex OAuth。
    - 沒有 Codex 執行階段覆寫的 `openai/<model>` 會在 PI 中使用直接的 OpenAI API 金鑰提供者。

    請參閱 [OpenAI](/zh-TW/providers/openai) 與 [Codex harness](/zh-TW/plugins/codex-harness)。如果提供者/執行階段分離讓人困惑，請先閱讀 [Agent 執行階段](/zh-TW/concepts/agent-runtimes)。

    Plugin 自動啟用遵循相同邊界：`openai-codex/<model>` 屬於 OpenAI Plugin，而 Codex Plugin 會由 `agentRuntime.id: "codex"` 或舊版 `codex/<model>` 參照啟用。

    設定 `agentRuntime.id: "codex"` 時，可透過原生 Codex app-server harness 使用 GPT-5.5；在 PI 中，Codex OAuth 可透過 `openai-codex/gpt-5.5` 使用；若你的帳號開放，直接 API 金鑰流量可在 PI 中透過 `openai/gpt-5.5` 使用。

  </Accordion>
  <Accordion title="CLI 執行階段">
    CLI 執行階段使用相同分離方式：選擇標準模型參照，例如 `anthropic/claude-*`、`google/gemini-*` 或 `openai/gpt-*`，接著在你需要本機 CLI 後端時，將 `agents.defaults.agentRuntime.id` 設為 `claude-cli`、`google-gemini-cli` 或 `codex-cli`。

    舊版 `claude-cli/*`、`google-gemini-cli/*` 與 `codex-cli/*` 參照會遷移回標準提供者參照，並將執行階段另外記錄。

  </Accordion>
</AccordionGroup>

## Plugin 擁有的提供者行為

大多數提供者特定邏輯都位於提供者 Plugin（`registerProvider(...)`）中，而 OpenClaw 保留通用推論迴圈。Plugin 擁有 onboarding、模型目錄、驗證環境變數對應、傳輸/設定正規化、工具 schema 清理、容錯移轉分類、OAuth 重新整理、用量回報、思考/推理設定檔等。

完整的 provider-SDK hook 清單與內建 Plugin 範例位於 [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins)。若提供者需要完全自訂的請求執行器，則屬於另一個更深入的擴充介面。

<Note>
提供者擁有的 runner 行為位於明確的提供者 hook，例如 replay policy、工具 schema 正規化、stream wrapping，以及傳輸/請求輔助工具。舊版 `ProviderPlugin.capabilities` 靜態容器僅供相容使用，共用 runner 邏輯已不再讀取它。
</Note>

## API 金鑰輪替

<AccordionGroup>
  <Accordion title="金鑰來源與優先順序">
    透過以下方式設定多個金鑰：

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一即時覆寫，最高優先順序）
    - `<PROVIDER>_API_KEYS`（逗號或分號清單）
    - `<PROVIDER>_API_KEY`（主要金鑰）
    - `<PROVIDER>_API_KEY_*`（編號清單，例如 `<PROVIDER>_API_KEY_1`）

    對於 Google 提供者，`GOOGLE_API_KEY` 也會納入作為後援。金鑰選擇順序會保留優先順序並移除重複值。

  </Accordion>
  <Accordion title="何時啟動輪替">
    - 只有在速率限制回應時，請求才會使用下一個金鑰重試（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`，或週期性用量限制訊息）。
    - 非速率限制失敗會立即失敗；不會嘗試金鑰輪替。
    - 當所有候選金鑰都失敗時，最終錯誤會回傳最後一次嘗試的錯誤。

  </Accordion>
</AccordionGroup>

## 內建提供者（pi-ai 目錄）

OpenClaw 隨附 pi‑ai 目錄。這些提供者不需要任何 `models.providers` 設定；只要設定驗證並挑選模型即可。

### OpenAI

- 提供者：`openai`
- 驗證：`OPENAI_API_KEY`
- 選用輪替：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，以及 `OPENCLAW_LIVE_OPENAI_KEY`（單一覆寫）
- 範例模型：`openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 如果特定安裝或 API 金鑰行為不同，請使用 `openclaw models list --provider openai` 驗證帳號/模型可用性。
- CLI：`openclaw onboard --auth-choice openai-api-key`
- 預設傳輸為 `auto`（WebSocket 優先，SSE 後援）
- 透過 `agents.defaults.models["openai/<model>"].params.transport` 按模型覆寫（`"sse"`、`"websocket"` 或 `"auto"`）
- OpenAI Responses WebSocket 預熱預設會透過 `params.openaiWsWarmup` 啟用（`true`/`false`）
- 可透過 `agents.defaults.models["openai/<model>"].params.serviceTier` 啟用 OpenAI 優先處理
- `/fast` 與 `params.fastMode` 會將直接 `openai/*` Responses 請求對應到 `api.openai.com` 上的 `service_tier=priority`
- 當你需要明確 tier，而不是共用的 `/fast` 切換時，請使用 `params.serviceTier`
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）只會套用於前往 `api.openai.com` 的原生 OpenAI 流量，不會套用於通用 OpenAI 相容代理
- 原生 OpenAI 路由也會保留 Responses `store`、提示快取提示，以及 OpenAI 推理相容 payload shaping；代理路由則不會
- `openai/gpt-5.3-codex-spark` 在 OpenClaw 中會被有意抑制，因為即時 OpenAI API 請求會拒絕它，而且目前 Codex 目錄沒有公開它

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- 提供者：`anthropic`
- 驗證：`ANTHROPIC_API_KEY`
- 選用輪替：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，以及 `OPENCLAW_LIVE_ANTHROPIC_KEY`（單一覆寫）
- 範例模型：`anthropic/claude-opus-4-6`
- CLI：`openclaw onboard --auth-choice apiKey`
- 直接的公開 Anthropic 請求支援共用 `/fast` 切換與 `params.fastMode`，包含傳送至 `api.anthropic.com` 的 API 金鑰與 OAuth 驗證流量；OpenClaw 會將其對應到 Anthropic `service_tier`（`auto` 與 `standard_only`）
- 偏好的 Claude CLI 設定會保持模型參照標準化，並另外選擇 CLI
  後端：`anthropic/claude-opus-4-7` 搭配
  `agents.defaults.agentRuntime.id: "claude-cli"`。舊版
  `claude-cli/claude-opus-4-7` 參照仍可相容使用。

<Note>
Anthropic 員工告訴我們，OpenClaw 風格的 Claude CLI 使用方式已再次允許，因此除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用與 `claude -p` 使用視為此整合的核准方式。Anthropic setup-token 仍可作為支援的 OpenClaw token 路徑，但 OpenClaw 現在會在可用時優先使用 Claude CLI 重用與 `claude -p`。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- 提供者：`openai-codex`
- 驗證：OAuth (ChatGPT)
- PI 模型參照：`openai-codex/gpt-5.5`
- 原生 Codex app-server harness 參照：`openai/gpt-5.5` 搭配 `agents.defaults.agentRuntime.id: "codex"`
- 原生 Codex app-server harness 文件：[Codex harness](/zh-TW/plugins/codex-harness)
- 舊版模型參照：`codex/gpt-*`
- Plugin 邊界：`openai-codex/*` 會載入 OpenAI Plugin；原生 Codex app-server Plugin 只會由 Codex harness 執行階段或舊版 `codex/*` 參照選取。
- CLI：`openclaw onboard --auth-choice openai-codex` 或 `openclaw models auth login --provider openai-codex`
- 預設傳輸為 `auto`（WebSocket 優先，SSE 後援）
- 透過 `agents.defaults.models["openai-codex/<model>"].params.transport` 按 PI 模型覆寫（`"sse"`、`"websocket"` 或 `"auto"`）
- `params.serviceTier` 也會在原生 Codex Responses 請求（`chatgpt.com/backend-api`）上轉送
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）只會附加於前往 `chatgpt.com/backend-api` 的原生 Codex 流量，不會附加於通用 OpenAI 相容代理
- 與直接 `openai/*` 共用相同的 `/fast` 切換與 `params.fastMode` 設定；OpenClaw 會將其對應到 `service_tier=priority`
- `openai-codex/gpt-5.5` 使用 Codex 目錄原生 `contextWindow = 400000` 與預設執行階段 `contextTokens = 272000`；可使用 `models.providers.openai-codex.models[].contextTokens` 覆寫執行階段上限
- 政策注意事項：OpenAI Codex OAuth 明確支援 OpenClaw 這類外部工具/工作流程。
- 對於常見的訂閱加原生 Codex 執行階段路由，請使用 `openai-codex` 驗證登入，但設定 `openai/gpt-5.5` 加上 `agents.defaults.agentRuntime.id: "codex"`。
- 只有在你想透過 PI 使用 Codex OAuth/訂閱路由時，才使用 `openai-codex/gpt-5.5`；當你的 API 金鑰設定與本機目錄公開公共 API 路由時，請使用沒有 Codex 執行階段覆寫的 `openai/gpt-5.5`。

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex", fallback: "none" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### 其他訂閱式託管選項

<CardGroup cols={3}>
  <Card title="GLM 模型" href="/zh-TW/providers/glm">
    Z.AI Coding Plan 或一般 API 端點。
  </Card>
  <Card title="MiniMax" href="/zh-TW/providers/minimax">
    MiniMax Coding Plan OAuth 或 API 金鑰存取。
  </Card>
  <Card title="Qwen Cloud" href="/zh-TW/providers/qwen">
    Qwen Cloud 提供者介面，加上 Alibaba DashScope 與 Coding Plan 端點對應。
  </Card>
</CardGroup>

### OpenCode

- 驗證：`OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- Zen 執行階段提供者：`opencode`
- Go 執行階段提供者：`opencode-go`
- 範例模型：`opencode/claude-opus-4-6`、`opencode-go/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API 金鑰）

- 提供者：`google`
- 驗證：`GEMINI_API_KEY`
- 選用輪替：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 後備，以及 `OPENCLAW_LIVE_GEMINI_KEY`（單一覆寫）
- 範例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 相容性：使用 `google/gemini-3.1-flash-preview` 的舊版 OpenClaw 設定會正規化為 `google/gemini-3-flash-preview`
- 別名：接受 `google/gemini-3.1-pro`，並正規化為 Google 的即時 Gemini API ID：`google/gemini-3.1-pro-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`
- 思考：`/think adaptive` 使用 Google 動態思考。Gemini 3/3.1 會省略固定的 `thinkingLevel`；Gemini 2.5 會傳送 `thinkingBudget: -1`。
- 直接執行 Gemini 時也接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或舊版 `cached_content`），用來轉送提供者原生的 `cachedContents/...` 控制代碼；Gemini 快取命中會以 OpenClaw `cacheRead` 顯示

### Google Vertex 和 Gemini CLI

- 提供者：`google-vertex`、`google-gemini-cli`
- 驗證：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程

<Warning>
OpenClaw 中的 Gemini CLI OAuth 是非官方整合。有些使用者回報使用第三方用戶端後遭遇 Google 帳戶限制。請檢閱 Google 條款；若選擇繼續，請使用非關鍵帳戶。
</Warning>

Gemini CLI OAuth 會作為內建 `google` plugin 的一部分隨附。

<Steps>
  <Step title="Install Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    預設模型：`google-gemini-cli/gemini-3-flash-preview`。你**不**需要將用戶端 ID 或密鑰貼到 `openclaw.json`。CLI 登入流程會將權杖儲存在 gateway 主機上的驗證設定檔中。

  </Step>
  <Step title="Set project (if needed)">
    如果登入後要求失敗，請在 gateway 主機上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini CLI JSON 回覆會從 `response` 解析；用量會後備至 `stats`，並將 `stats.cached` 正規化為 OpenClaw `cacheRead`。

### Z.AI (GLM)

- 提供者：`zai`
- 驗證：`ZAI_API_KEY`
- 範例模型：`zai/glm-5.1`
- CLI：`openclaw onboard --auth-choice zai-api-key`
  - 別名：`z.ai/*` 和 `z-ai/*` 會正規化為 `zai/*`
  - `zai-api-key` 會自動偵測相符的 Z.AI 端點；`zai-coding-global`、`zai-coding-cn`、`zai-global` 和 `zai-cn` 會強制使用特定介面

### Vercel AI Gateway

- 提供者：`vercel-ai-gateway`
- 驗證：`AI_GATEWAY_API_KEY`
- 範例模型：`vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- 提供者：`kilocode`
- 驗證：`KILOCODE_API_KEY`
- 範例模型：`kilocode/kilo/auto`
- CLI：`openclaw onboard --auth-choice kilocode-api-key`
- Base URL：`https://api.kilo.ai/api/gateway/`
- 靜態後備目錄隨附 `kilocode/kilo/auto`；即時 `https://api.kilo.ai/api/gateway/models` 探索可進一步擴充執行階段目錄。
- `kilocode/kilo/auto` 背後的確切上游路由由 Kilo Gateway 擁有，並非硬編碼在 OpenClaw 中。

請參閱 [/providers/kilocode](/zh-TW/providers/kilocode) 了解設定詳細資訊。

### 其他內建提供者 Plugin

| 提供者                  | 識別碼                           | 驗證環境變數                                                 | 範例模型                                      |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` 或 `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### 值得注意的特性

<AccordionGroup>
  <Accordion title="OpenRouter">
    只有在經過驗證的 `openrouter.ai` 路由上，才會套用其應用程式歸因標頭與 Anthropic `cache_control` 標記。DeepSeek、Moonshot 和 ZAI 參照符合 OpenRouter 管理的提示快取 TTL 條件，但不會收到 Anthropic 快取標記。作為代理風格的 OpenAI 相容路徑，它會略過僅限原生 OpenAI 的塑形處理（`serviceTier`、Responses `store`、提示快取提示、OpenAI 推理相容性）。以 Gemini 為後端的參照只保留代理 Gemini 思考簽章清理。
  </Accordion>
  <Accordion title="Kilo Gateway">
    以 Gemini 為後端的參照會沿用相同的代理 Gemini 清理路徑；`kilocode/kilo/auto` 和其他不支援代理推理的參照會略過代理推理注入。
  </Accordion>
  <Accordion title="MiniMax">
    API 金鑰入門設定會寫入明確的純文字 M2.7 聊天模型定義；影像理解仍留在 Plugin 擁有的 `MiniMax-VL-01` 媒體提供者上。
  </Accordion>
  <Accordion title="NVIDIA">
    模型 ID 使用 `nvidia/<vendor>/<model>` 命名空間（例如 `nvidia/nvidia/nemotron-...` 以及 `nvidia/moonshotai/kimi-k2.5`）；選擇器會保留字面上的 `<provider>/<model-id>` 組合，而傳送到 API 的標準鍵仍維持單一前綴。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路徑。`grok-4.3` 是內建預設聊天模型。`/fast` 或 `params.fastMode: true` 會將 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 重寫為其 `*-fast` 變體。`tool_stream` 預設啟用；可透過 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 停用。
  </Accordion>
  <Accordion title="Cerebras">
    以內建 `cerebras` 提供者 Plugin 的形式提供。GLM 使用 `zai-glm-4.7`；OpenAI 相容的基底 URL 為 `https://api.cerebras.ai/v1`。
  </Accordion>
</AccordionGroup>

## 透過 `models.providers` 設定提供者（自訂/基底 URL）

使用 `models.providers`（或 `models.json`）加入**自訂**提供者，或 OpenAI/Anthropic 相容代理。

下方許多內建提供者 Plugin 已發布預設目錄。只有在你想覆寫預設基底 URL、標頭或模型清單時，才使用明確的 `models.providers.<id>` 項目。

Gateway 模型能力檢查也會讀取明確的 `models.providers.<id>.models[]` 中繼資料。如果自訂或代理模型接受影像，請在該模型上設定 `input: ["text", "image"]`，讓 WebChat 和節點來源附件路徑將影像作為原生模型輸入傳遞，而不是純文字媒體參照。

### Moonshot AI (Kimi)

Moonshot 以內建提供者 Plugin 的形式提供。預設使用內建提供者；只有在需要覆寫基底 URL 或模型中繼資料時，才加入明確的 `models.providers.moonshot` 項目：

- 提供者：`moonshot`
- 驗證：`MOONSHOT_API_KEY`
- 範例模型：`moonshot/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice moonshot-api-key` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 模型 ID：

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi coding

Kimi Coding 使用 Moonshot AI 的 Anthropic 相容端點：

- 提供者：`kimi`
- 驗證：`KIMI_API_KEY`
- 範例模型：`kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Legacy `kimi/k2p5` 仍作為相容性模型 ID 被接受。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）在中國提供 Doubao 與其他模型的存取能力。

- 供應商：`volcengine`（編碼：`volcengine-plan`）
- 驗證：`VOLCANO_ENGINE_API_KEY`
- 範例模型：`volcengine-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

初始設定預設使用編碼介面，但一般的 `volcengine/*` 目錄也會同時註冊。

在初始設定/設定模型選擇器中，Volcengine 驗證選項會優先採用 `volcengine/*` 與 `volcengine-plan/*` 兩種列。如果這些模型尚未載入，OpenClaw 會改用未篩選的目錄，而不是顯示空的供應商範圍選擇器。

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127`（Kimi K2.5）
    - `volcengine/glm-4-7-251222`（GLM 4.7）
    - `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus（國際）

BytePlus ARK 為國際使用者提供與 Volcano Engine 相同模型的存取能力。

- 供應商：`byteplus`（編碼：`byteplus-plan`）
- 驗證：`BYTEPLUS_API_KEY`
- 範例模型：`byteplus-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

初始設定預設使用編碼介面，但一般的 `byteplus/*` 目錄也會同時註冊。

在初始設定/設定模型選擇器中，BytePlus 驗證選項會優先採用 `byteplus/*` 與 `byteplus-plan/*` 兩種列。如果這些模型尚未載入，OpenClaw 會改用未篩選的目錄，而不是顯示空的供應商範圍選擇器。

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228`（Seed 1.8）
    - `byteplus/kimi-k2-5-260127`（Kimi K2.5）
    - `byteplus/glm-4-7-251222`（GLM 4.7）

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic 透過 `synthetic` 供應商提供 Anthropic 相容模型：

- 供應商：`synthetic`
- 驗證：`SYNTHETIC_API_KEY`
- 範例模型：`synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI：`openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax 透過 `models.providers` 設定，因為它使用自訂端點：

- MiniMax OAuth（全球）：`--auth-choice minimax-global-oauth`
- MiniMax OAuth（中國）：`--auth-choice minimax-cn-oauth`
- MiniMax API 金鑰（全球）：`--auth-choice minimax-global-api`
- MiniMax API 金鑰（中國）：`--auth-choice minimax-cn-api`
- 驗證：`minimax` 使用 `MINIMAX_API_KEY`；`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`

請參閱 [/providers/minimax](/zh-TW/providers/minimax) 了解設定細節、模型選項與設定片段。

<Note>
在 MiniMax 的 Anthropic 相容串流路徑上，除非你明確設定，否則 OpenClaw 預設會停用 thinking，而且 `/fast on` 會將 `MiniMax-M2.7` 重寫為 `MiniMax-M2.7-highspeed`。
</Note>

Plugin 擁有的能力拆分：

- 文字/聊天預設值維持在 `minimax/MiniMax-M2.7`
- 圖片生成為 `minimax/image-01` 或 `minimax-portal/image-01`
- 圖片理解是在兩種 MiniMax 驗證路徑上皆由 Plugin 擁有的 `MiniMax-VL-01`
- 網頁搜尋維持使用供應商 ID `minimax`

### LM Studio

LM Studio 以內建供應商 Plugin 形式提供，並使用原生 API：

- 供應商：`lmstudio`
- 驗證：`LM_API_TOKEN`
- 預設推論基礎 URL：`http://localhost:1234/v1`

接著設定模型（替換為 `http://localhost:1234/api/v1/models` 傳回的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 的原生 `/api/v1/models` 與 `/api/v1/models/load` 進行探索與自動載入，並預設使用 `/v1/chat/completions` 進行推論。請參閱 [/providers/lmstudio](/zh-TW/providers/lmstudio) 了解設定與疑難排解。

### Ollama

Ollama 以內建供應商 Plugin 形式提供，並使用 Ollama 的原生 API：

- 供應商：`ollama`
- 驗證：不需要（本機伺服器）
- 範例模型：`ollama/llama3.3`
- 安裝：[https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

當你使用 `OLLAMA_API_KEY` 選擇加入時，Ollama 會在本機 `http://127.0.0.1:11434` 被偵測到，而內建供應商 Plugin 會將 Ollama 直接加入 `openclaw onboard` 與模型選擇器。請參閱 [/providers/ollama](/zh-TW/providers/ollama) 了解初始設定、雲端/本機模式與自訂設定。

### vLLM

vLLM 以內建供應商 Plugin 形式提供，適用於本機/自架的 OpenAI 相容伺服器：

- 供應商：`vllm`
- 驗證：選用（取決於你的伺服器）
- 預設基礎 URL：`http://127.0.0.1:8000/v1`

若要在本機選擇加入自動探索（如果你的伺服器不強制驗證，任何值都可用）：

```bash
export VLLM_API_KEY="vllm-local"
```

接著設定模型（替換為 `/v1/models` 傳回的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

請參閱 [/providers/vllm](/zh-TW/providers/vllm) 了解詳細資訊。

### SGLang

SGLang 以內建供應商 Plugin 形式提供，適用於快速自架的 OpenAI 相容伺服器：

- 供應商：`sglang`
- 驗證：選用（取決於你的伺服器）
- 預設基礎 URL：`http://127.0.0.1:30000/v1`

若要在本機選擇加入自動探索（如果你的伺服器不強制驗證，任何值都可用）：

```bash
export SGLANG_API_KEY="sglang-local"
```

接著設定模型（替換為 `/v1/models` 傳回的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

請參閱 [/providers/sglang](/zh-TW/providers/sglang) 了解詳細資訊。

### 本機代理（LM Studio、vLLM、LiteLLM 等）

範例（OpenAI 相容）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Default optional fields">
    對於自訂供應商，`reasoning`、`input`、`cost`、`contextWindow` 與 `maxTokens` 都是選用欄位。省略時，OpenClaw 會預設為：

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    建議：設定符合你的代理/模型限制的明確值。

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - 對於非原生端點上的 `api: "openai-completions"`（任何非空白 `baseUrl`，且其主機不是 `api.openai.com`），OpenClaw 會強制 `compat.supportsDeveloperRole: false`，以避免供應商因不支援的 `developer` 角色回傳 400 錯誤。
    - 代理式 OpenAI 相容路由也會略過僅限原生 OpenAI 的請求塑形：沒有 `service_tier`、沒有 Responses `store`、沒有 Completions `store`、沒有提示快取提示、沒有 OpenAI reasoning 相容承載塑形，也沒有隱藏的 OpenClaw 歸屬標頭。
    - 對於需要廠商特定欄位的 OpenAI 相容 Completions 代理，請設定 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`），將額外 JSON 合併到傳出的請求主體中。
    - 對於 vLLM 聊天模板控制，請設定 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。當工作階段 thinking 等級關閉時，內建 vLLM Plugin 會針對 `vllm/nemotron-3-*` 自動傳送 `enable_thinking: false` 與 `force_nonempty_content: true`。
    - 對於較慢的本機模型或遠端 LAN/tailnet 主機，請設定 `models.providers.<id>.timeoutSeconds`。這會延長供應商模型 HTTP 請求處理，包括連線、標頭、主體串流，以及總體受保護抓取中止時間，而不會增加整個 Agent 執行階段逾時。
    - 如果 `baseUrl` 為空白/省略，OpenClaw 會保留預設 OpenAI 行為（會解析為 `api.openai.com`）。
    - 為了安全，非原生 `openai-completions` 端點上的明確 `compat.supportsDeveloperRole: true` 仍會被覆寫。
    - 對於非直接端點上的 `api: "anthropic-messages"`（canonical `anthropic` 以外的任何供應商，或自訂 `models.providers.anthropic.baseUrl` 且其主機不是公開 `api.anthropic.com` 端點），OpenClaw 會抑制隱含的 Anthropic beta 標頭，例如 `claude-code-20250219`、`interleaved-thinking-2025-05-14` 與 OAuth 標記，因此自訂 Anthropic 相容代理不會拒絕不支援的 beta 旗標。如果你的代理需要特定 beta 功能，請明確設定 `models.providers.<id>.headers["anthropic-beta"]`。

  </Accordion>
</AccordionGroup>

## CLI 範例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另請參閱：[設定](/zh-TW/gateway/configuration) 取得完整設定範例。

## 相關

- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — 模型設定鍵
- [模型容錯移轉](/zh-TW/concepts/model-failover) — 後援鏈與重試行為
- [模型](/zh-TW/concepts/models) — 模型設定與別名
- [供應商](/zh-TW/providers) — 各供應商設定指南
