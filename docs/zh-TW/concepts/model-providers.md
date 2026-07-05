---
read_when:
    - 你需要一份逐提供者的模型設定參考
    - 你想要模型提供者的範例設定檔或命令列介面初始設定命令
sidebarTitle: Model providers
summary: 模型提供者概覽，包含設定範例與命令列介面流程
title: 模型提供者
x-i18n:
    generated_at: "2026-07-05T11:15:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27dc5802f622de2c36da44667d777c570693627202af8af5cde4276f3a7ec5d7
    source_path: concepts/model-providers.md
    workflow: 16
---

**LLM/模型提供者**（不是 WhatsApp/Telegram 這類聊天頻道）的參考資料。模型選擇規則請參閱[模型](/zh-TW/concepts/models)。

## 快速規則

<AccordionGroup>
  <Accordion title="模型參照與命令列介面輔助工具">
    - 模型參照使用 `provider/model`（範例：`opencode/claude-opus-4-6`）。
    - 設定後，`agents.defaults.models` 會作為允許清單。
    - 命令列介面輔助工具：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` 會設定提供者層級預設值；`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` 會針對每個模型覆寫它們。
    - 備援規則、冷卻探測，以及工作階段覆寫持久化：[模型容錯移轉](/zh-TW/concepts/model-failover)。

  </Accordion>
  <Accordion title="新增提供者驗證不會變更你的主要模型">
    當你新增或重新驗證提供者時，`openclaw configure` 會保留現有的 `agents.defaults.model.primary`。除非你傳入 `--set-default`，否則 `openclaw models auth login` 也會這麼做。提供者外掛仍可能在其驗證設定修補中回傳建議的預設模型，但當主要模型已存在時，OpenClaw 會將其視為「讓這個模型可用」，而不是「取代目前的主要模型」。

    若要刻意切換預設模型，請使用 `openclaw models set <provider/model>` 或 `openclaw models auth login --provider <id> --set-default`。

  </Accordion>
  <Accordion title="OpenAI 提供者/執行階段拆分">
    OpenAI 系列路由依前綴區分：

    - `openai/<model>` 預設會使用原生 Codex app-server harness 執行代理回合。這是一般 ChatGPT/Codex 訂閱設定。
    - 舊版 Codex 模型參照是舊版設定，doctor 會將其重寫為 `openai/<model>`。
    - `openai/<model>` 加上提供者/模型 `agentRuntime.id: "openclaw"` 會使用 OpenClaw 的內建執行階段，用於明確的 API 金鑰或相容性路由。

    請參閱 [OpenAI](/zh-TW/providers/openai) 與 [Codex harness](/zh-TW/plugins/codex-harness)。如果提供者/執行階段拆分令人困惑，請先閱讀[代理執行階段](/zh-TW/concepts/agent-runtimes)。

    外掛自動啟用遵循相同邊界：`openai/*` 代理參照會為預設路由啟用 Codex 外掛，而明確的提供者/模型 `agentRuntime.id: "codex"` 或舊版 `codex/<model>` 參照也需要它。

    GPT-5.5 預設可透過 `openai/gpt-5.5` 上的原生 Codex app-server harness 使用；當提供者/模型執行階段政策明確選擇 `openclaw` 時，也可透過 OpenClaw 執行階段使用。

  </Accordion>
  <Accordion title="命令列介面執行階段">
    命令列介面執行階段使用相同拆分：選擇標準模型參照，例如 `anthropic/claude-*` 或 `google/gemini-*`，然後在你想要本機命令列介面後端時，將提供者/模型執行階段政策設定為 `claude-cli` 或 `google-gemini-cli`。

    舊版 `claude-cli/*` 與 `google-gemini-cli/*` 參照會遷移回標準提供者參照，並將執行階段分開記錄。舊版 `codex-cli/*` 參照會遷移到 `openai/*` 並使用 Codex app-server 路由；OpenClaw 不再保留內建的 Codex 命令列介面後端。

  </Accordion>
</AccordionGroup>

## 外掛擁有的提供者行為

大多數提供者特定邏輯都位於提供者外掛（`registerProvider(...)`）中，而 OpenClaw 保留通用推論迴圈。外掛擁有導入、模型目錄、驗證環境變數對應、傳輸/設定正規化、工具結構描述清理、容錯移轉分類、OAuth 重新整理、使用量回報、thinking/reasoning 設定檔等。

提供者 SDK hook 與內建外掛範例的完整清單位於[提供者外掛](/zh-TW/plugins/sdk-provider-plugins)。需要完全自訂請求執行器的提供者屬於另一個更深層的擴充介面。

<Note>
提供者擁有的 runner 行為位於明確的提供者 hook，例如重放政策、工具結構描述正規化、串流包裝，以及傳輸/請求輔助工具。舊版 `ProviderPlugin.capabilities` 靜態包僅供相容性使用，且不再由共用 runner 邏輯讀取。
</Note>

## API 金鑰輪換

<AccordionGroup>
  <Accordion title="金鑰來源與優先順序">
    透過以下方式設定多個金鑰：

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一即時覆寫，最高優先順序）
    - `<PROVIDER>_API_KEYS`（逗號或分號清單）
    - `<PROVIDER>_API_KEY`（主要金鑰）
    - `<PROVIDER>_API_KEY_*`（編號清單，例如 `<PROVIDER>_API_KEY_1`）

    對於 Google 提供者，`GOOGLE_API_KEY` 也會納入作為備援。金鑰選擇順序會保留優先順序並去除重複值。

  </Accordion>
  <Accordion title="輪換何時啟動">
    - 只有在速率限制回應時，請求才會使用下一個金鑰重試（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`，或週期性使用量限制訊息）。
    - 非速率限制失敗會立即失敗；不會嘗試金鑰輪換。
    - 當所有候選金鑰都失敗時，最終錯誤會由最後一次嘗試回傳。

  </Accordion>
</AccordionGroup>

## 官方提供者外掛

官方提供者外掛會發布自己的模型目錄列。這些提供者**不需要** `models.providers` 模型項目；啟用提供者外掛、設定驗證，然後選擇模型即可。只有在明確自訂提供者或逾時等狹窄請求設定時，才使用 `models.providers`。

### OpenAI

- 提供者：`openai`
- 驗證：`OPENAI_API_KEY`
- 選用輪換：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，加上 `OPENCLAW_LIVE_OPENAI_KEY`（單一覆寫）
- 範例模型：`openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 如果特定安裝或 API 金鑰表現不同，請使用 `openclaw models list --provider openai` 驗證帳戶/模型可用性。
- 命令列介面：`openclaw onboard --auth-choice openai-api-key`
- 預設傳輸為 `auto`；OpenClaw 會將傳輸選擇傳給共用模型執行階段。
- 透過 `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"` 或 `"auto"`）針對每個模型覆寫
- OpenAI 優先處理可透過 `agents.defaults.models["openai/<model>"].params.serviceTier` 啟用
- `/fast` 與 `params.fastMode` 會將直接 `openai/*` Responses 請求對應到 `api.openai.com` 上的 `service_tier=priority`
- 當你想要明確層級而不是共用 `/fast` 切換時，請使用 `params.serviceTier`
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）只會套用於送往 `api.openai.com` 的原生 OpenAI 流量，不會套用於通用 OpenAI 相容代理
- 原生 OpenAI 路由也會保留 Responses `store`、提示快取提示，以及 OpenAI reasoning 相容酬載塑形；代理路由則不會
- `openai/gpt-5.3-codex-spark` 只能透過 ChatGPT/Codex OAuth 使用；直接 OpenAI API 金鑰與 Azure API 金鑰路由會拒絕它

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- 提供者：`anthropic`
- 驗證：`ANTHROPIC_API_KEY`
- 選用輪換：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，加上 `OPENCLAW_LIVE_ANTHROPIC_KEY`（單一覆寫）
- 範例模型：`anthropic/claude-opus-4-6`
- 命令列介面：`openclaw onboard --auth-choice apiKey`
- 直接公開 Anthropic 請求支援共用 `/fast` 切換與 `params.fastMode`，包含傳送到 `api.anthropic.com` 的 API 金鑰與 OAuth 驗證流量；OpenClaw 會將其對應到 Anthropic `service_tier`（`auto` 與 `standard_only`）
- 偏好的 Claude CLI 設定會保持模型參照標準化，並分開選擇命令列介面
  後端：`anthropic/claude-opus-4-8` 搭配
  模型範圍的 `agentRuntime.id: "claude-cli"`。舊版
  `claude-cli/claude-opus-4-7` 參照仍可用於相容性。

<Note>
Claude CLI 重用（`claude -p`）是經核准的 OpenClaw 整合路徑。Anthropic setup-token 驗證仍受支援，但 OpenClaw 會在可用時偏好重用 Claude CLI。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- 提供者：`openai`
- 驗證：OAuth (ChatGPT)
- 原生 Codex app-server harness 參照：`openai/gpt-5.5`
- 原生 Codex app-server harness 文件：[Codex harness](/zh-TW/plugins/codex-harness)
- 舊版模型參照：`codex/gpt-*`
- 外掛邊界：`openai/*` 會載入 OpenAI 外掛；原生 Codex app-server 外掛由 Codex harness 執行階段選取。
- 命令列介面：`openclaw onboard --auth-choice openai` 或 `openclaw models auth login --provider openai`
- 預設傳輸為 `auto`（WebSocket 優先，SSE 備援）
- 透過 `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"` 或 `"auto"`）針對每個 OpenAI Codex 模型覆寫
- `params.serviceTier` 也會在原生 Codex Responses 請求（`chatgpt.com/backend-api`）上轉送
- 隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）只會附加於送往 `chatgpt.com/backend-api` 的原生 Codex 流量，不會附加於通用 OpenAI 相容代理
- 與直接 `openai/*` 共用相同的 `/fast` 切換與 `params.fastMode` 設定；OpenClaw 會將其對應到 `service_tier=priority`
- `openai/gpt-5.5` 使用 Codex 目錄原生 `contextWindow = 400000` 與預設執行階段 `contextTokens = 272000`；可使用 `models.providers.openai.models[].contextTokens` 覆寫執行階段上限
- 使用 `openai` 驗證登入，並為標準訂閱加原生 Codex 執行階段路由設定 `openai/gpt-5.5`；OpenAI 代理回合預設會選擇 Codex。
- 只有在你想要內建 OpenClaw 路由時，才使用提供者/模型 `agentRuntime.id: "openclaw"`；否則請讓 `openai/gpt-5.5` 維持在預設 Codex harness。
- 舊版 Codex GPT 參照是舊版狀態，不是即時提供者路由。新代理設定請在原生 Codex 執行階段上使用 `openai/gpt-5.5`，並執行 `openclaw doctor --fix` 將舊版 Codex 模型參照遷移到標準 `openai/*` 參照。

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
  <Card title="MiniMax" href="/zh-TW/providers/minimax">
    MiniMax Coding Plan OAuth 或 API 金鑰存取。
  </Card>
  <Card title="Qwen Cloud" href="/zh-TW/providers/qwen">
    Qwen Cloud 提供者介面，加上 Alibaba DashScope 與 Coding Plan 端點對應。
  </Card>
  <Card title="Z.AI (GLM)" href="/zh-TW/providers/zai">
    Z.AI Coding Plan 或一般 API 端點。
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
- 選用輪換：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 後援，以及 `OPENCLAW_LIVE_GEMINI_KEY`（單一覆寫）
- 範例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 相容性：使用 `google/gemini-3.1-flash-preview` 的舊版 OpenClaw 設定會正規化為 `google/gemini-3-flash-preview`
- 別名：`google/gemini-3.1-pro` 可接受，並會正規化為 Google 的即時 Gemini API ID：`google/gemini-3.1-pro-preview`
- 命令列介面：`openclaw onboard --auth-choice gemini-api-key`
- 思考：`/think adaptive` 使用 Google 動態思考。Gemini 3/3.1 會省略固定的 `thinkingLevel`；Gemini 2.5 會傳送 `thinkingBudget: -1`。
- 直接 Gemini 執行也接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或舊版 `cached_content`），以轉送提供者原生的 `cachedContents/...` 控制代碼；Gemini 快取命中會顯示為 OpenClaw `cacheRead`

### Google Vertex 和 Gemini 命令列介面

- 提供者：`google-vertex`、`google-gemini-cli`
- 驗證：Vertex 使用 gcloud ADC；Gemini 命令列介面使用其 OAuth 流程

<Warning>
OpenClaw 中的 Gemini 命令列介面 OAuth 是非官方整合。有些使用者回報在使用第三方用戶端後遇到 Google 帳戶限制。請檢閱 Google 條款；若選擇繼續，請使用非關鍵帳戶。
</Warning>

Gemini 命令列介面 OAuth 隨附於內建的 `google` 外掛。

<Steps>
  <Step title="安裝 Gemini 命令列介面">
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
  <Step title="啟用外掛">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="登入">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    預設模型：`google-gemini-cli/gemini-3-flash-preview`。你**不**需要將用戶端 ID 或祕密貼到 `openclaw.json`。命令列介面登入流程會將權杖儲存在閘道主機上的驗證設定檔中。

  </Step>
  <Step title="設定專案（如有需要）">
    如果登入後請求失敗，請在閘道主機上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini 命令列介面預設使用 `stream-json`。OpenClaw 會讀取助理串流
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

- 供應商：`vercel-ai-gateway`
- 驗證：`AI_GATEWAY_API_KEY`
- 範例模型：`vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- 命令列介面：`openclaw onboard --auth-choice ai-gateway-api-key`

### 其他隨附供應商外掛

| 供應商                                  | Id                               | 驗證環境變數                                         | 範例模型                                                   |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` 或 `OPENROUTER_API_KEY`            | `arcee/trinity-large-thinking`                             |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                     |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` 或 `CHUTES_OAUTH_TOKEN`             | `chutes/zai-org/GLM-4.7-TEE`                               |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                  |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                               |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                         |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                             |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/zh-TW/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth 或 `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                    |
| [Qwen OAuth](/zh-TW/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                             |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth 或 `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### 值得了解的特殊事項

<AccordionGroup>
  <Accordion title="OpenRouter">
    只在已驗證的 `openrouter.ai` 路由上套用其應用程式歸因標頭與 Anthropic `cache_control` 標記。DeepSeek、Moonshot 和 ZAI 參照可用於 OpenRouter 管理的提示快取 TTL，但不會收到 Anthropic 快取標記。作為代理風格的 OpenAI 相容路徑，它會略過僅限原生 OpenAI 的 shaping（`serviceTier`、Responses `store`、提示快取提示、OpenAI reasoning-compat）。Gemini 後端參照只保留代理 Gemini thought-signature 清理。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 後端參照遵循相同的代理 Gemini 清理路徑；`kilocode/kilo/auto` 和其他不支援代理推理的參照會略過代理推理注入。
  </Accordion>
  <Accordion title="MiniMax">
    API 金鑰 onboarding 會寫入明確的 M3 和 M2.7 聊天模型定義；影像理解仍留在外掛擁有的 `MiniMax-VL-01` 媒體供應商上。
  </Accordion>
  <Accordion title="NVIDIA">
    模型 ID 使用 `nvidia/<vendor>/<model>` 命名空間（例如 `nvidia/nvidia/nemotron-...` 與 `nvidia/moonshotai/kimi-k2.5` 並列）；選擇器會保留字面上的 `<provider>/<model-id>` 組合，而傳送到 API 的規範鍵仍維持單一前綴。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路徑。建議路徑是 SuperGrok/X Premium OAuth；API 金鑰仍可透過 `XAI_API_KEY` 或外掛設定運作，而 Grok `web_search` 會在 API 金鑰 fallback 前重用相同的驗證設定檔。`grok-4.3` 是隨附的預設聊天模型，`grok-build-0.1` 可選用於以建置/編碼為重點的工作。`/fast` 或 `params.fastMode: true` 會將 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 改寫為各自的 `*-fast` 變體。`tool_stream` 預設開啟；可透過 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 停用。
  </Accordion>
</AccordionGroup>

## 透過 `models.providers` 使用供應商（自訂/基礎 URL）

使用 `models.providers`（或 `models.json`）新增**自訂**供應商或 OpenAI/Anthropic 相容代理。

下列許多隨附供應商外掛已經發布預設 catalog。只有在你想覆寫預設基礎 URL、標頭或模型清單時，才使用明確的 `models.providers.<id>` 項目。

閘道模型能力檢查也會讀取明確的 `models.providers.<id>.models[]` metadata。如果自訂或代理模型接受影像，請在該模型上設定 `input: ["text", "image"]`，讓 WebChat 和節點來源附件路徑將影像作為原生模型輸入傳遞，而不是純文字媒體參照。

`agents.defaults.models["provider/model"]` 只控制代理的模型可見性、別名和每個模型的 metadata。它本身不會註冊新的執行階段模型。若是自訂供應商模型，也請加入 `models.providers.<provider>.models[]`，並至少包含相符的 `id`。

### Moonshot AI (Kimi)

安裝 `@openclaw/moonshot-provider` 後再進行 onboarding。只有在需要覆寫基底 URL 或模型中繼資料時，才加入明確的 `models.providers.moonshot` 項目：

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

完整設定指南請參閱 [Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)。

### Kimi Coding

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

舊版 `kimi/kimi-code` 與 `kimi/k2p5` 仍會作為相容性模型 ID 被接受，並正規化為 Kimi 的穩定 API 模型 ID。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）可在中國存取 Doubao 和其他模型。

- 提供者：`volcengine`（編碼：`volcengine-plan`）
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

Onboarding 預設使用編碼介面，但也會同時註冊一般的 `volcengine/*` 目錄。

在 onboarding/configure 模型選擇器中，Volcengine 驗證選項會優先顯示 `volcengine/*` 與 `volcengine-plan/*` 兩種列。如果這些模型尚未載入，OpenClaw 會退回未篩選的目錄，而不是顯示空的提供者範圍選擇器。

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127`（Kimi K2.5）
    - `volcengine/glm-4-7-251222`（GLM 4.7）
    - `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2）

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

BytePlus ARK 讓國際使用者可以存取與 Volcano Engine 相同的模型。

- 提供者：`byteplus`（編碼：`byteplus-plan`）
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

Onboarding 預設使用編碼介面，但也會同時註冊一般的 `byteplus/*` 目錄。

在 onboarding/configure 模型選擇器中，BytePlus 驗證選項會優先顯示 `byteplus/*` 與 `byteplus-plan/*` 兩種列。如果這些模型尚未載入，OpenClaw 會退回未篩選的目錄，而不是顯示空的提供者範圍選擇器。

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

Synthetic 在 `synthetic` 提供者後方提供 Anthropic 相容模型：

- 提供者：`synthetic`
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

設定細節、模型選項和設定片段請參閱 [/providers/minimax](/zh-TW/providers/minimax)。

<Note>
在 MiniMax 的 Anthropic 相容串流路徑上，除非你明確設定，否則 OpenClaw 預設會停用 M2.x 系列的思考；MiniMax-M3（以及 M3.x）預設維持提供者的省略/自適應思考路徑。`/fast on` 會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。
</Note>

外掛擁有的能力分拆：

- 文字/聊天預設維持使用 `minimax/MiniMax-M3`
- 圖像生成為 `minimax/image-01` 或 `minimax-portal/image-01`
- 圖像理解是在兩種 MiniMax 驗證路徑上都由外掛擁有的 `MiniMax-VL-01`
- 網頁搜尋維持使用提供者 ID `minimax`

### LM Studio

LM Studio 以 bundled 提供者外掛隨附，並使用原生 API：

- 提供者：`lmstudio`
- 驗證：`LM_API_TOKEN`
- 預設推論基底 URL：`http://localhost:1234/v1`

接著設定模型（替換為 `http://localhost:1234/api/v1/models` 回傳的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 的原生 `/api/v1/models` 與 `/api/v1/models/load` 進行探索與自動載入，並預設使用 `/v1/chat/completions` 進行推論。如果你想讓 LM Studio JIT 載入、TTL 和自動逐出負責模型生命週期，請設定 `models.providers.lmstudio.params.preload: false`。設定與疑難排解請參閱 [/providers/lmstudio](/zh-TW/providers/lmstudio)。

### Ollama

Ollama 以 bundled 提供者外掛隨附，並使用 Ollama 的原生 API：

- 提供者：`ollama`
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

當你使用 `OLLAMA_API_KEY` 選擇啟用時，OpenClaw 會在本機的 `http://127.0.0.1:11434` 偵測 Ollama，而 bundled 提供者外掛會將 Ollama 直接加入 `openclaw onboard` 與模型選擇器。onboarding、雲端/本機模式與自訂設定請參閱 [/providers/ollama](/zh-TW/providers/ollama)。

### vLLM

vLLM 以 bundled 提供者外掛隨附，適用於本機/自架 OpenAI 相容伺服器：

- 提供者：`vllm`
- 驗證：選用（取決於你的伺服器）
- 預設基底 URL：`http://127.0.0.1:8000/v1`

若要在本機選擇啟用自動探索（如果你的伺服器未強制驗證，任何值都可用）：

```bash
export VLLM_API_KEY="vllm-local"
```

接著設定模型（替換為 `/v1/models` 回傳的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細資訊請參閱 [/providers/vllm](/zh-TW/providers/vllm)。

### SGLang

SGLang 以 bundled 提供者外掛隨附，適用於快速自架 OpenAI 相容伺服器：

- 提供者：`sglang`
- 驗證：選用（取決於你的伺服器）
- 預設基底 URL：`http://127.0.0.1:30000/v1`

若要在本機選擇啟用自動探索（如果你的伺服器未強制驗證，任何值都可用）：

```bash
export SGLANG_API_KEY="sglang-local"
```

接著設定模型（替換為 `/v1/models` 回傳的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細資訊請參閱 [/providers/sglang](/zh-TW/providers/sglang)。

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
    對於自訂提供者，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是選用欄位。省略時，OpenClaw 預設為：

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    建議：設定符合你的代理/模型限制的明確值。

  </Accordion>
  <Accordion title="代理路由調整規則">
    - 對於非原生端點上的 `api: "openai-completions"`（任何非空且主機不是 `api.openai.com` 的 `baseUrl`），OpenClaw 會強制設定 `compat.supportsDeveloperRole: false`，以避免提供者因不支援 `developer` 角色而回傳 400 錯誤。
    - 代理式 OpenAI 相容路由也會略過僅適用於原生 OpenAI 的請求調整：沒有 `service_tier`、沒有 Responses `store`、沒有 Completions `store`、沒有提示快取提示、沒有 OpenAI reasoning 相容承載調整，也沒有隱藏的 OpenClaw 歸因標頭。
    - 對於需要廠商特定欄位的 OpenAI 相容 Completions 代理，請設定 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`），將額外 JSON 合併到送出的請求主體中。
    - 對於 vLLM 聊天範本控制，請設定 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。內建的 vLLM 外掛會在工作階段思考層級關閉時，針對 `vllm/nemotron-3-*` 自動傳送 `enable_thinking: false` 和 `force_nonempty_content: true`。
    - 對於緩慢的本機模型或遠端 LAN/tailnet 主機，請設定 `models.providers.<id>.timeoutSeconds`。這會延長提供者模型 HTTP 請求處理時間，包括連線、標頭、主體串流，以及整個受保護 fetch 的中止時間，而不會增加整個代理程式執行階段逾時。如果 `agents.defaults.timeoutSeconds` 或特定執行的逾時較低，也要提高該上限；提供者逾時無法延長整個執行。
    - 模型提供者 HTTP 呼叫只會針對已設定提供者 `baseUrl` 主機名稱，允許 Surge、Clash 和 sing-box 在 `198.18.0.0/15` 與 `fc00::/7` 中的 fake-IP DNS 回答。自訂/本機提供者端點也會信任該精確設定的 `scheme://host:port` 來源，用於受保護的模型請求，包括 loopback、LAN 和 tailnet 主機。這不是新的設定選項；你設定的 `baseUrl` 只會針對該來源延伸請求政策。fake-IP 主機名稱允許與精確來源信任是彼此獨立的機制。其他 private、loopback、link-local、metadata 目的地，以及不同連接埠，仍需要明確選擇啟用 `models.providers.<id>.request.allowPrivateNetwork: true`。設定 `models.providers.<id>.request.allowPrivateNetwork: false` 可選擇退出精確來源信任。
    - 如果 `baseUrl` 為空/省略，OpenClaw 會保留預設 OpenAI 行為（解析到 `api.openai.com`）。
    - 為了安全，在非原生 `openai-completions` 端點上，明確的 `compat.supportsDeveloperRole: true` 仍會被覆寫。
    - 對於非直連端點上的 `api: "anthropic-messages"`（任何非標準 `anthropic` 的提供者，或自訂 `models.providers.anthropic.baseUrl` 且其主機不是公開 `api.anthropic.com` 端點），OpenClaw 會抑制隱含的 Anthropic beta 標頭，例如 `claude-code-20250219`、`interleaved-thinking-2025-05-14` 和 OAuth 標記，因此自訂 Anthropic 相容代理不會因不支援的 beta 旗標而拒絕請求。如果你的代理需要特定 beta 功能，請明確設定 `models.providers.<id>.headers["anthropic-beta"]`。

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
- [模型容錯移轉](/zh-TW/concepts/model-failover) - 後備鏈與重試行為
- [模型](/zh-TW/concepts/models) - 模型設定與別名
- [提供者](/zh-TW/providers) - 各提供者設定指南
