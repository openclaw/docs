---
read_when:
    - 你需要一份依提供者劃分的模型設定參考
    - 你想要模型提供者的範例設定或命令列介面入門命令
sidebarTitle: Model providers
summary: 模型供應商概覽，包含範例設定與命令列介面流程
title: 模型供應商
x-i18n:
    generated_at: "2026-07-04T03:35:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM/模型提供者（不是 WhatsApp/Telegram 這類聊天頻道）的參考。模型選擇規則請參閱[模型](/zh-TW/concepts/models)。

## 快速規則

<AccordionGroup>
  <Accordion title="模型參照與命令列介面輔助工具">
    - 模型參照使用 `provider/model`（範例：`opencode/claude-opus-4-6`）。
    - 設定 `agents.defaults.models` 時，會作為允許清單。
    - 命令列介面輔助工具：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` 會設定提供者層級的預設值；`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` 會針對每個模型覆寫這些值。
    - 備援規則、冷卻探測，以及工作階段覆寫持久化：[模型容錯移轉](/zh-TW/concepts/model-failover)。

  </Accordion>
  <Accordion title="新增提供者驗證不會變更你的主要模型">
    當你新增或重新驗證提供者時，`openclaw configure` 會保留既有的 `agents.defaults.model.primary`。除非你傳入 `--set-default`，否則 `openclaw models auth login` 也會採取相同行為。提供者外掛仍可能在其驗證設定修補中傳回建議的預設模型，但當主要模型已經存在時，OpenClaw 會將其視為「讓此模型可用」，而不是「取代目前的主要模型」。

    若要刻意切換預設模型，請使用 `openclaw models set <provider/model>` 或 `openclaw models auth login --provider <id> --set-default`。

  </Accordion>
  <Accordion title="OpenAI 提供者/執行階段分離">
    OpenAI 系列路由依前綴區分：

    - `openai/<model>` 預設會使用原生 Codex app-server harness 進行代理回合。這是常見的 ChatGPT/Codex 訂閱設定。
    - 舊版 Codex 模型參照是 doctor 會重寫為 `openai/<model>` 的舊版設定。
    - `openai/<model>` 加上提供者/模型 `agentRuntime.id: "openclaw"`，會使用 OpenClaw 內建執行階段來處理明確的 API 金鑰或相容性路由。

    請參閱 [OpenAI](/zh-TW/providers/openai) 和 [Codex harness](/zh-TW/plugins/codex-harness)。如果提供者/執行階段分離讓你困惑，請先閱讀[代理執行階段](/zh-TW/concepts/agent-runtimes)。

    外掛自動啟用遵循相同邊界：`openai/*` 代理參照會針對預設路由啟用 Codex 外掛，而明確的提供者/模型 `agentRuntime.id: "codex"` 或舊版 `codex/<model>` 參照也需要它。

    GPT-5.5 預設可透過 `openai/gpt-5.5` 上的原生 Codex app-server harness 使用；當提供者/模型執行階段政策明確選擇 `openclaw` 時，也可透過 OpenClaw 執行階段使用。

  </Accordion>
  <Accordion title="命令列介面執行階段">
    命令列介面執行階段使用相同分離方式：選擇標準模型參照，例如 `anthropic/claude-*` 或 `google/gemini-*`，然後在你需要本機命令列介面後端時，將提供者/模型執行階段政策設為 `claude-cli` 或 `google-gemini-cli`。

    舊版 `claude-cli/*` 和 `google-gemini-cli/*` 參照會遷移回標準提供者參照，並將執行階段另行記錄。舊版 `codex-cli/*` 參照會遷移到 `openai/*`，並使用 Codex app-server 路由；OpenClaw 不再保留內建的 Codex 命令列介面後端。

  </Accordion>
</AccordionGroup>

## 外掛擁有的提供者行為

大多數提供者特定邏輯位於提供者外掛（`registerProvider(...)`）中，而 OpenClaw 保留通用推論迴圈。外掛負責上線導引、模型目錄、驗證環境變數對應、傳輸/設定正規化、工具結構描述清理、容錯移轉分類、OAuth 重新整理、用量回報、思考/推理設定檔等。

提供者 SDK hook 與內建外掛範例的完整清單位於[提供者外掛](/zh-TW/plugins/sdk-provider-plugins)。需要完全自訂請求執行器的提供者，屬於另一個更深入的擴充介面。

<Note>
提供者擁有的執行器行為位於明確的提供者 hook，例如重放政策、工具結構描述正規化、串流包裝，以及傳輸/請求輔助工具。舊版 `ProviderPlugin.capabilities` 靜態資料袋僅供相容性使用，且共用執行器邏輯已不再讀取它。
</Note>

## API 金鑰輪替

<AccordionGroup>
  <Accordion title="金鑰來源與優先順序">
    透過下列方式設定多個金鑰：

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一即時覆寫，最高優先順序）
    - `<PROVIDER>_API_KEYS`（以逗號或分號分隔的清單）
    - `<PROVIDER>_API_KEY`（主要金鑰）
    - `<PROVIDER>_API_KEY_*`（編號清單，例如 `<PROVIDER>_API_KEY_1`）

    對於 Google 提供者，也會將 `GOOGLE_API_KEY` 納入作為備援。金鑰選擇順序會保留優先順序並去除重複值。

  </Accordion>
  <Accordion title="輪替何時啟動">
    - 只有在速率限制回應時，請求才會使用下一個金鑰重試（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`，或週期性用量限制訊息）。
    - 非速率限制失敗會立即失敗；不會嘗試金鑰輪替。
    - 當所有候選金鑰都失敗時，會傳回最後一次嘗試的最終錯誤。

  </Accordion>
</AccordionGroup>

## 官方提供者外掛

官方提供者外掛會發布自己的模型目錄列。這些提供者不需要任何 `models.providers` 模型項目；啟用提供者外掛、設定驗證，然後選擇模型即可。只有在明確自訂提供者或逾時等窄範圍請求設定時，才使用 `models.providers`。

### OpenAI

- 提供者：`openai`
- 驗證：`OPENAI_API_KEY`
- 選用輪替：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，加上 `OPENCLAW_LIVE_OPENAI_KEY`（單一覆寫）
- 範例模型：`openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 如果特定安裝或 API 金鑰行為不同，請使用 `openclaw models list --provider openai` 驗證帳戶/模型可用性。
- 命令列介面：`openclaw onboard --auth-choice openai-api-key`
- 預設傳輸為 `auto`；OpenClaw 會將傳輸選擇傳遞給共用模型執行階段。
- 透過 `agents.defaults.models["openai/<model>"].params.transport` 針對每個模型覆寫（`"sse"`、`"websocket"` 或 `"auto"`）
- 可透過 `agents.defaults.models["openai/<model>"].params.serviceTier` 啟用 OpenAI 優先處理
- `/fast` 和 `params.fastMode` 會將直接的 `openai/*` Responses 請求對應到 `api.openai.com` 上的 `service_tier=priority`
- 當你需要明確層級而不是共用 `/fast` 切換時，請使用 `params.serviceTier`
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）僅套用於前往 `api.openai.com` 的原生 OpenAI 流量，不套用於通用 OpenAI 相容代理
- 原生 OpenAI 路由也會保留 Responses `store`、提示快取提示，以及 OpenAI 推理相容酬載塑形；代理路由則不會
- 當你登入的帳戶公開 `openai/gpt-5.3-codex-spark` 時，可透過 ChatGPT/Codex OAuth 訂閱驗證使用它；OpenClaw 仍會抑制此模型的直接 OpenAI API 金鑰與 Azure API 金鑰路由，因為那些傳輸會拒絕它

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- 提供者：`anthropic`
- 驗證：`ANTHROPIC_API_KEY`
- 選用輪替：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，加上 `OPENCLAW_LIVE_ANTHROPIC_KEY`（單一覆寫）
- 範例模型：`anthropic/claude-opus-4-6`
- 命令列介面：`openclaw onboard --auth-choice apiKey`
- 直接的公開 Anthropic 請求支援共用 `/fast` 切換和 `params.fastMode`，包括傳送到 `api.anthropic.com` 的 API 金鑰與 OAuth 驗證流量；OpenClaw 會將其對應到 Anthropic `service_tier`（`auto` 與 `standard_only`）
- 偏好的 Claude 命令列介面設定會讓模型參照保持標準，並另行選擇命令列介面
  後端：`anthropic/claude-opus-4-8` 搭配
  模型範圍的 `agentRuntime.id: "claude-cli"`。舊版
  `claude-cli/claude-opus-4-7` 參照仍可用於相容性。

<Note>
Anthropic 員工告訴我們，OpenClaw 風格的 Claude 命令列介面使用方式再次被允許，因此除非 Anthropic 發布新政策，否則 OpenClaw 會將此整合中的 Claude 命令列介面重用和 `claude -p` 使用視為已獲准。Anthropic setup-token 仍可作為受支援的 OpenClaw token 路徑使用，但 OpenClaw 現在會在可用時優先使用 Claude 命令列介面重用和 `claude -p`。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- 提供者：`openai`
- 驗證：OAuth（ChatGPT）
- 舊版 OpenAI Codex 模型參照：`openai/gpt-5.5`
- 原生 Codex app-server harness 參照：`openai/gpt-5.5`
- 原生 Codex app-server harness 文件：[Codex harness](/zh-TW/plugins/codex-harness)
- 舊版模型參照：`codex/gpt-*`
- 外掛邊界：`openai/*` 會載入 OpenAI 外掛；原生 Codex app-server 外掛由 Codex harness 執行階段選取。
- 命令列介面：`openclaw onboard --auth-choice openai` 或 `openclaw models auth login --provider openai`
- 預設傳輸為 `auto`（WebSocket 優先，SSE 備援）
- 透過 `agents.defaults.models["openai/<model>"].params.transport` 針對每個 OpenAI Codex 模型覆寫（`"sse"`、`"websocket"` 或 `"auto"`）
- `params.serviceTier` 也會在原生 Codex Responses 請求（`chatgpt.com/backend-api`）上轉送
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）只會附加到前往 `chatgpt.com/backend-api` 的原生 Codex 流量，不會附加到通用 OpenAI 相容代理
- 與直接 `openai/*` 共用相同的 `/fast` 切換和 `params.fastMode` 設定；OpenClaw 會將其對應到 `service_tier=priority`
- `openai/gpt-5.5` 使用 Codex 目錄原生 `contextWindow = 400000` 和預設執行階段 `contextTokens = 272000`；可使用 `models.providers.openai.models[].contextTokens` 覆寫執行階段上限
- 政策備註：OpenAI Codex OAuth 明確支援 OpenClaw 這類外部工具/工作流程。
- 對於常見的訂閱加原生 Codex 執行階段路由，請使用 `openai` 驗證登入並設定 `openai/gpt-5.5`；OpenAI 代理回合預設會選取 Codex。
- 只有在你需要內建 OpenClaw 路由時，才使用提供者/模型 `agentRuntime.id: "openclaw"`；否則請讓 `openai/gpt-5.5` 保持在預設 Codex harness 上。
- 舊版 Codex GPT 參照是舊版狀態，不是即時提供者路由。新的代理設定請在原生 Codex 執行階段上使用 `openai/gpt-5.5`，並執行 `openclaw doctor --fix` 將舊的舊版 Codex 模型參照遷移到標準 `openai/*` 參照。

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### 其他訂閱式託管選項

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/zh-TW/providers/zai">
    Z.AI Coding Plan 或一般 API 端點。
  </Card>
  <Card title="MiniMax" href="/zh-TW/providers/minimax">
    MiniMax Coding Plan OAuth 或 API 金鑰存取。
  </Card>
  <Card title="Qwen Cloud" href="/zh-TW/providers/qwen">
    Qwen Cloud 提供者介面，加上 Alibaba DashScope 和 Coding Plan 端點對應。
  </Card>
</CardGroup>

### OpenCode

- 驗證：`OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- Zen 執行階段提供者：`opencode`
- Go 執行階段提供者：`opencode-go`
- 範例模型：`opencode/claude-opus-4-6`、`opencode-go/kimi-k2.6`
- 命令列介面：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API 金鑰）

- 提供者：`google`
- 驗證：`GEMINI_API_KEY`
- 選用輪替：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 後援，以及 `OPENCLAW_LIVE_GEMINI_KEY`（單一覆寫）
- 範例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 相容性：使用 `google/gemini-3.1-flash-preview` 的舊版 OpenClaw 設定會正規化為 `google/gemini-3-flash-preview`
- 別名：接受 `google/gemini-3.1-pro`，並正規化為 Google 的即時 Gemini API ID：`google/gemini-3.1-pro-preview`
- 命令列介面：`openclaw onboard --auth-choice gemini-api-key`
- 思考：`/think adaptive` 會使用 Google 動態思考。Gemini 3/3.1 會省略固定的 `thinkingLevel`；Gemini 2.5 會傳送 `thinkingBudget: -1`。
- 直接執行 Gemini 也接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或舊版 `cached_content`），以轉送提供者原生的 `cachedContents/...` 控制代碼；Gemini 快取命中會顯示為 OpenClaw `cacheRead`

### Google Vertex 和 Gemini CLI

- 提供者：`google-vertex`、`google-gemini-cli`
- 驗證：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程

<Warning>
OpenClaw 中的 Gemini CLI OAuth 是非官方整合。有些使用者回報在使用第三方用戶端後遇到 Google 帳戶限制。請檢閱 Google 條款；若你選擇繼續，請使用非關鍵帳戶。
</Warning>

Gemini CLI OAuth 會作為內建 `google` 外掛的一部分提供。

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

    預設模型：`google-gemini-cli/gemini-3-flash-preview`。你**不**需要將用戶端 ID 或密鑰貼到 `openclaw.json`。命令列介面登入流程會將權杖儲存在閘道主機上的驗證設定檔中。

  </Step>
  <Step title="Set project (if needed)">
    如果登入後請求失敗，請在閘道主機上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini CLI 預設使用 `stream-json`。OpenClaw 會讀取助理串流
訊息，並將 `stats.cached` 正規化為 `cacheRead`；舊版
`--output-format json` 覆寫仍會從 `response` 讀取回覆文字。

### Z.AI (GLM)

- 提供者：`zai`
- 驗證：`ZAI_API_KEY`
- 範例模型：`zai/glm-5.2`
- 命令列介面：`openclaw onboard --auth-choice zai-api-key`
  - 模型參照使用標準 `zai/*` 提供者 ID。
  - `zai-api-key` 會自動偵測相符的 Z.AI 端點；`zai-coding-global`、`zai-coding-cn`、`zai-global` 和 `zai-cn` 會強制使用特定介面

### Vercel AI Gateway

- 提供者：`vercel-ai-gateway`
- 驗證：`AI_GATEWAY_API_KEY`
- 範例模型：`vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- 命令列介面：`openclaw onboard --auth-choice ai-gateway-api-key`

### 其他內建提供者外掛

| 提供者                                  | ID                               | 驗證環境變數                                         | 範例模型                                                   |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/zh-TW/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth 或 `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| [Qwen OAuth](/zh-TW/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth 或 `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### 值得了解的特性

<AccordionGroup>
  <Accordion title="OpenRouter">
    只會在已驗證的 `openrouter.ai` 路由上套用其應用程式歸因標頭和 Anthropic `cache_control` 標記。DeepSeek、Moonshot 和 ZAI 參照符合 OpenRouter 管理的提示快取 TTL 條件，但不會收到 Anthropic 快取標記。作為代理風格的 OpenAI 相容路徑，它會略過僅限原生 OpenAI 的塑形（`serviceTier`、Responses `store`、提示快取提示、OpenAI 推理相容）。Gemini 後端的參照只保留代理 Gemini 思考簽章清理。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 後端的參照會遵循相同的代理 Gemini 清理路徑；`kilocode/kilo/auto` 和其他不支援代理推理的參照會略過代理推理注入。
  </Accordion>
  <Accordion title="MiniMax">
    API 金鑰上線會寫入明確的 M3 和 M2.7 聊天模型定義；影像理解仍保留在外掛擁有的 `MiniMax-VL-01` 媒體提供者上。
  </Accordion>
  <Accordion title="NVIDIA">
    模型 ID 使用 `nvidia/<vendor>/<model>` 命名空間（例如 `nvidia/nvidia/nemotron-...` 與 `nvidia/moonshotai/kimi-k2.5` 並列）；選擇器會保留字面上的 `<provider>/<model-id>` 組合，而傳送到 API 的標準金鑰則維持單一前綴。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路徑。建議路徑是 SuperGrok/X Premium OAuth；API 金鑰仍可透過 `XAI_API_KEY` 或外掛設定運作，而 Grok `web_search` 會在 API 金鑰後援前重用相同的驗證設定檔。`grok-4.3` 是內建的預設聊天模型，而 `grok-build-0.1` 可供建置／編碼導向工作選用。`/fast` 或 `params.fastMode: true` 會將 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 改寫為其 `*-fast` 變體。`tool_stream` 預設開啟；可透過 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 停用。
  </Accordion>
</AccordionGroup>

## 透過 `models.providers` 使用提供者（自訂／基底 URL）

使用 `models.providers`（或 `models.json`）新增**自訂**提供者或 OpenAI/Anthropic 相容代理。

以下許多隨附的提供者外掛已經發布預設目錄。只有在你想覆寫預設基礎 URL、標頭或模型清單時，才使用明確的 `models.providers.<id>` 項目。

閘道模型能力檢查也會讀取明確的 `models.providers.<id>.models[]` 中繼資料。如果自訂或代理模型接受圖片，請在該模型上設定 `input: ["text", "image"]`，讓 WebChat 和節點來源的附件路徑將圖片作為原生模型輸入傳遞，而不是純文字媒體參照。

`agents.defaults.models["provider/model"]` 只控制代理程式的模型可見性、別名和個別模型中繼資料。它本身不會註冊新的執行階段模型。若是自訂提供者模型，也請新增 `models.providers.<provider>.models[]`，其中至少要有相符的 `id`。

### Moonshot AI (Kimi)

請先安裝 `@openclaw/moonshot-provider` 再進行 onboarding。只有在需要覆寫基礎 URL 或模型中繼資料時，才新增明確的 `models.providers.moonshot` 項目：

- 提供者：`moonshot`
- 驗證：`MOONSHOT_API_KEY`
- 範例模型：`moonshot/kimi-k2.6`
- 命令列介面：`openclaw onboard --auth-choice moonshot-api-key` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 模型 ID：

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

### Kimi 程式碼撰寫

Kimi Coding 使用 Moonshot AI 的 Anthropic 相容端點：

- 提供者：`kimi`
- 驗證：`KIMI_API_KEY`
- 範例模型：`kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

舊版 `kimi/kimi-code` 和 `kimi/k2p5` 仍會作為相容性模型 ID 被接受，並正規化為 Kimi 穩定 API 模型 ID。

### Volcano Engine (Doubao)

Volcano Engine（火山引擎）可在中國存取 Doubao 和其他模型。

- 提供者：`volcengine`（程式碼撰寫：`volcengine-plan`）
- 驗證：`VOLCANO_ENGINE_API_KEY`
- 範例模型：`volcengine-plan/ark-code-latest`
- 命令列介面：`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

入門設定預設使用編碼介面，但同時也會註冊一般的 `volcengine/*` 目錄。

在入門設定/設定模型選擇器中，Volcengine 驗證選項會優先使用 `volcengine/*` 和 `volcengine-plan/*` 列。如果這些模型尚未載入，OpenClaw 會改用未篩選的目錄，而不是顯示空的供應商範圍選擇器。

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

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

BytePlus ARK 為國際使用者提供與 Volcano Engine 相同模型的存取權。

- 供應商：`byteplus`（編碼：`byteplus-plan`）
- 驗證：`BYTEPLUS_API_KEY`
- 範例模型：`byteplus-plan/ark-code-latest`
- 命令列介面：`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

入門設定預設使用編碼介面，但同時也會註冊一般的 `byteplus/*` 目錄。

在入門設定/設定模型選擇器中，BytePlus 驗證選項會優先使用 `byteplus/*` 和 `byteplus-plan/*` 列。如果這些模型尚未載入，OpenClaw 會改用未篩選的目錄，而不是顯示空的供應商範圍選擇器。

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

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
- 命令列介面：`openclaw onboard --auth-choice synthetic-api-key`

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

請參閱 [/providers/minimax](/zh-TW/providers/minimax)，了解設定詳細資料、模型選項和設定片段。

<Note>
在 MiniMax 的 Anthropic 相容串流路徑上，除非你明確設定，否則 OpenClaw 會對 M2.x 系列預設停用思考；MiniMax-M3（以及 M3.x）預設維持供應商的省略/自適應思考路徑。`/fast on` 會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。
</Note>

外掛擁有的能力拆分：

- 文字/聊天預設維持在 `minimax/MiniMax-M3`
- 圖像生成為 `minimax/image-01` 或 `minimax-portal/image-01`
- 圖像理解是在兩條 MiniMax 驗證路徑上都由外掛擁有的 `MiniMax-VL-01`
- 網頁搜尋維持使用供應商 ID `minimax`

### LM Studio

LM Studio 以使用原生 API 的內建供應商外掛形式提供：

- 供應商：`lmstudio`
- 驗證：`LM_API_TOKEN`
- 預設推論基底 URL：`http://localhost:1234/v1`

接著設定模型（替換為 `http://localhost:1234/api/v1/models` 傳回的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 的原生 `/api/v1/models` 和 `/api/v1/models/load` 進行探索與自動載入，並預設使用 `/v1/chat/completions` 進行推論。如果你想讓 LM Studio JIT 載入、TTL 和自動逐出負責模型生命週期，請設定 `models.providers.lmstudio.params.preload: false`。請參閱 [/providers/lmstudio](/zh-TW/providers/lmstudio) 了解設定與疑難排解。

### Ollama

Ollama 以內建供應商外掛形式提供，並使用 Ollama 的原生 API：

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

當你使用 `OLLAMA_API_KEY` 選擇啟用時，OpenClaw 會在本機 `http://127.0.0.1:11434` 偵測 Ollama，而內建供應商外掛會將 Ollama 直接加入 `openclaw onboard` 和模型選擇器。請參閱 [/providers/ollama](/zh-TW/providers/ollama) 了解入門設定、雲端/本機模式和自訂設定。

### vLLM

vLLM 以內建供應商外掛形式提供，用於本機/自行託管的 OpenAI 相容伺服器：

- 供應商：`vllm`
- 驗證：選用（取決於你的伺服器）
- 預設基底 URL：`http://127.0.0.1:8000/v1`

若要選擇在本機啟用自動探索（如果你的伺服器未強制驗證，任何值都可以）：

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

請參閱 [/providers/vllm](/zh-TW/providers/vllm) 了解詳細資料。

### SGLang

SGLang 以內建供應商外掛形式提供，用於快速自行託管的 OpenAI 相容伺服器：

- 供應商：`sglang`
- 驗證：選用（取決於你的伺服器）
- 預設基底 URL：`http://127.0.0.1:30000/v1`

若要選擇在本機啟用自動探索（如果你的伺服器未強制驗證，任何值都可以）：

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

請參閱 [/providers/sglang](/zh-TW/providers/sglang) 了解詳細資料。

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
    對於自訂供應商，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 都是選用欄位。省略時，OpenClaw 預設為：

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    建議：設定符合你的代理/模型限制的明確值。

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - 對於非原生端點（任何非空的 `baseUrl`，且其主機不是 `api.openai.com`）上的 `api: "openai-completions"`，OpenClaw 會強制 `compat.supportsDeveloperRole: false`，以避免供應商因不支援的 `developer` 角色而發生 400 錯誤。
    - 代理樣式的 OpenAI 相容路由也會略過僅限原生 OpenAI 的請求塑形：沒有 `service_tier`、沒有 Responses `store`、沒有 Completions `store`、沒有提示快取提示、沒有 OpenAI 推理相容酬載塑形，也沒有隱藏的 OpenClaw 歸因標頭。
    - 對於需要供應商特定欄位的 OpenAI 相容 Completions 代理，請設定 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`），將額外 JSON 合併到傳出的請求本文中。
    - 對於 vLLM 聊天範本控制，請設定 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。當工作階段思考層級關閉時，內建 vLLM 外掛會自動為 `vllm/nemotron-3-*` 傳送 `enable_thinking: false` 和 `force_nonempty_content: true`。
    - 對於緩慢的本機模型或遠端 LAN/tailnet 主機，請設定 `models.providers.<id>.timeoutSeconds`。這會延長供應商模型 HTTP 請求處理時間，包括連線、標頭、本文串流以及總受保護擷取中止時間，但不會增加整個代理執行階段逾時。如果 `agents.defaults.timeoutSeconds` 或執行專用逾時較低，也請提高該上限；供應商逾時無法延長整個執行。
    - 模型供應商 HTTP 呼叫只會針對已設定供應商 `baseUrl` 主機名稱，允許 `198.18.0.0/15` 和 `fc00::/7` 中的 Surge、Clash 和 sing-box 假 IP DNS 回答。自訂/本機供應商端點也會信任該精確設定的 `scheme://host:port` 來源，用於受保護的模型請求，包括 loopback、LAN 和 tailnet 主機。這不是新的設定選項；你設定的 `baseUrl` 只會針對該來源延伸請求政策。假 IP 主機名稱允許與精確來源信任是獨立機制。其他私有、loopback、link-local、中繼資料目的地，以及不同連接埠仍需要明確選擇啟用 `models.providers.<id>.request.allowPrivateNetwork: true`。設定 `models.providers.<id>.request.allowPrivateNetwork: false` 可退出精確來源信任。
    - 如果 `baseUrl` 為空/省略，OpenClaw 會保留預設 OpenAI 行為（會解析至 `api.openai.com`）。
    - 為了安全起見，在非原生 `openai-completions` 端點上，明確的 `compat.supportsDeveloperRole: true` 仍會被覆寫。
    - 對於非直接端點（任何不是標準 `anthropic` 的供應商，或自訂 `models.providers.anthropic.baseUrl` 且其主機不是公開 `api.anthropic.com` 端點）上的 `api: "anthropic-messages"`，OpenClaw 會抑制隱含的 Anthropic beta 標頭，例如 `claude-code-20250219`、`interleaved-thinking-2025-05-14` 和 OAuth 標記，因此自訂 Anthropic 相容代理不會拒絕不支援的 beta 旗標。如果你的代理需要特定 beta 功能，請明確設定 `models.providers.<id>.headers["anthropic-beta"]`。

  </Accordion>
</AccordionGroup>

## 命令列介面範例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另請參閱：[設定](/zh-TW/gateway/configuration)，取得完整設定範例。

## 相關

- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - 模型設定鍵
- [模型容錯移轉](/zh-TW/concepts/model-failover) - 後援鏈與重試行為
- [模型](/zh-TW/concepts/models) - 模型設定與別名
- [供應商](/zh-TW/providers) - 各供應商設定指南
