---
read_when:
    - 你需要一份依供應商分類的模型設定參考資料
    - 你想查看模型供應商的設定範例或命令列介面引導設定命令
sidebarTitle: Model providers
summary: 模型供應商概覽，包含設定範例與命令列介面流程
title: 模型供應商
x-i18n:
    generated_at: "2026-07-12T14:25:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20477f9f6c8c616b4eca6653a29e0e8c9ffe5049ddfed91c585e9e22cdb669a2
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM／模型提供者的參考資料（不包含 WhatsApp／Telegram 等聊天頻道）。關於模型選擇規則，請參閱[模型](/zh-TW/concepts/models)。

## 快速規則

<AccordionGroup>
  <Accordion title="模型參照與命令列介面輔助工具">
    - 模型參照使用 `provider/model`（範例：`opencode/claude-opus-4-6`）。
    - 設定後，`agents.defaults.models` 會作為允許清單。
    - 命令列介面輔助工具：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow`／`contextTokens`／`maxTokens` 設定提供者層級的預設值；`models.providers.*.models[].contextWindow`／`contextTokens`／`maxTokens` 則針對個別模型覆寫這些值。
    - 備援規則、冷卻探測及工作階段覆寫的持久化：[模型容錯移轉](/zh-TW/concepts/model-failover)。

  </Accordion>
  <Accordion title="新增提供者驗證不會變更主要模型">
    新增提供者或重新驗證提供者時，`openclaw configure` 會保留現有的 `agents.defaults.model.primary`。除非傳入 `--set-default`，否則 `openclaw models auth login` 也會如此。提供者外掛仍可在其驗證設定修補中傳回建議的預設模型，但若主要模型已存在，OpenClaw 會將其視為「讓此模型可供使用」，而不是「取代目前的主要模型」。

    若要刻意切換預設模型，請使用 `openclaw models set <provider/model>` 或 `openclaw models auth login --provider <id> --set-default`。

  </Accordion>
  <Accordion title="OpenAI 提供者／執行階段的區分">
    OpenAI 模型參照與代理程式執行階段彼此分離：

    - `openai/<model>` 會選取標準 OpenAI 提供者與模型。僅有此前綴絕不會選取 Codex。
    - 當未設定提供者／模型執行階段原則或設為 `auto` 時，只有在路由完全符合官方 HTTPS Platform Responses 或 ChatGPT Responses，且沒有自行指定的請求覆寫時，OpenAI 才可能隱式選取 Codex。
    - 自行建立的 Completions 轉接器、自訂端點，以及具有自行指定請求行為的路由，會繼續使用 OpenClaw。官方的明文 HTTP 端點會遭到拒絕。
    - 舊版 Codex 模型參照屬於舊版設定，doctor 會將其改寫為 `openai/<model>`。
    - 提供者／模型的 `agentRuntime.id: "openclaw"` 會明確讓原本符合資格的路由繼續使用 OpenClaw。`agentRuntime.id: "codex"` 則要求使用 Codex；如果有效路由與 Codex 不相容，就會採取封閉式失敗。

    請參閱 [OpenAI 隱式代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)與 [Codex 控制框架](/zh-TW/plugins/codex-harness)。如果提供者／執行階段的區分令人困惑，請先閱讀[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

    外掛自動啟用也遵循相同界線：隱式與 Codex 相容的有效路由可以啟用 Codex 外掛，而明確的提供者／模型 `agentRuntime.id: "codex"` 或舊版 `codex/<model>` 參照則要求啟用該外掛。僅有 `openai/*` 前綴並不會啟用。

    全新的 OpenAI 設定會使用特定路由的 GPT-5.6 參照：API 金鑰設定會選取
    `openai/gpt-5.6`（在直接 API 上，未加修飾的直接 API ID 會解析為 Sol），而
    ChatGPT／Codex OAuth 會為原生 Codex
    目錄選取精確的 `openai/gpt-5.6-sol`。新增或重新整理 OpenAI 驗證時，會
    保留現有的明確主要模型，包括 `openai/gpt-5.5`。對於無法存取
    GPT-5.6 的帳戶，GPT-5.5 仍可透過任一執行階段作為明確的復原選項。

  </Accordion>
  <Accordion title="命令列介面執行階段">
    命令列介面執行階段使用相同的區分方式：選擇標準模型參照，例如 `anthropic/claude-*` 或 `google/gemini-*`，接著在需要本機命令列介面後端時，將提供者／模型執行階段原則設為 `claude-cli` 或 `google-gemini-cli`。

    舊版 `claude-cli/*` 和 `google-gemini-cli/*` 參照會遷移回標準提供者參照，並分開記錄執行階段。舊版 `codex-cli/*` 參照會遷移至 `openai/*`，並使用 Codex app-server 路由；OpenClaw 不再保留內建的 Codex 命令列介面後端。

  </Accordion>
</AccordionGroup>

## 外掛擁有的提供者行為

大多數提供者特定邏輯都位於提供者外掛（`registerProvider(...)`）中，而 OpenClaw 保留通用推論迴圈。外掛負責新手引導、模型目錄、驗證環境變數對應、傳輸／設定正規化、工具結構描述清理、容錯移轉分類、OAuth 重新整理、用量報告、思考／推理設定檔等功能。

提供者 SDK 鉤子與內建外掛範例的完整清單，請參閱[提供者外掛](/zh-TW/plugins/sdk-provider-plugins)。需要完全自訂請求執行器的提供者，則屬於另一個更深層的擴充介面。

<Note>
提供者擁有的執行器行為位於明確的提供者鉤子上，例如重播原則、工具結構描述正規化、串流包裝，以及傳輸／請求輔助工具。舊版 `ProviderPlugin.capabilities` 靜態集合僅供相容性使用，共用執行器邏輯已不再讀取它。
</Note>

## API 金鑰輪替

<AccordionGroup>
  <Accordion title="金鑰來源與優先順序">
    可透過下列方式設定多把金鑰：

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一即時覆寫，優先順序最高）
    - `<PROVIDER>_API_KEYS`（以逗號或分號分隔的清單）
    - `<PROVIDER>_API_KEY`（主要金鑰）
    - `<PROVIDER>_API_KEY_*`（編號清單，例如 `<PROVIDER>_API_KEY_1`）

    對於 Google 提供者，還會將 `GOOGLE_API_KEY` 納入備援。金鑰選取順序會維持優先順序並移除重複值。

  </Accordion>
  <Accordion title="何時啟動輪替">
    - 只有遇到速率限制回應時，才會使用下一把金鑰重試請求（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`，或週期性用量限制訊息）。
    - 非速率限制的失敗會立即失敗；不會嘗試輪替金鑰。
    - 當所有候選金鑰都失敗時，會傳回最後一次嘗試的最終錯誤。

  </Accordion>
</AccordionGroup>

## 官方提供者外掛

官方提供者外掛會發布自己的模型目錄資料列。這些提供者**不需要**任何 `models.providers` 模型項目；只要啟用提供者外掛、設定驗證並選取模型即可。僅針對明確的自訂提供者，或逾時等範圍有限的請求設定，才使用 `models.providers`。

### OpenAI

- 提供者：`openai`
- 驗證：`OPENAI_API_KEY`
- 選用輪替：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，以及 `OPENCLAW_LIVE_OPENAI_KEY`（單一覆寫）
- 全新設定預設值：`openai/gpt-5.6`；在直接 API 上，未加修飾的 ID 會解析為 Sol。
- 模型範例：`openai/gpt-5.6`、`openai/gpt-5.6-terra`、`openai/gpt-5.6-luna`、`openai/gpt-5.5`
- 如果特定安裝或 API 金鑰的行為不同，請使用 `openclaw models list --provider openai` 驗證帳戶／模型可用性。
- 命令列介面：`openclaw onboard --auth-choice openai-api-key`
- 預設傳輸方式為 `auto`；OpenClaw 會將傳輸方式選擇傳遞給共用模型執行階段。
- 可透過 `agents.defaults.models["openai/<model>"].params.transport` 針對個別模型覆寫（`"sse"`、`"websocket"` 或 `"auto"`）
- 可透過 `agents.defaults.models["openai/<model>"].params.serviceTier` 啟用 OpenAI 優先處理
- `/fast` 和 `params.fastMode` 會將直接的 `openai/*` Responses 請求對應至 `api.openai.com` 上的 `service_tier=priority`
- 若要使用明確的層級，而不是共用的 `/fast` 切換功能，請使用 `params.serviceTier`
- 隱藏的 OpenClaw 歸屬標頭（`originator`、`version`、`User-Agent`）僅套用於傳送至 `api.openai.com` 的原生 OpenAI 流量，不適用於通用的 OpenAI 相容代理伺服器
- 原生 OpenAI 路由也會保留 Responses `store`、提示快取提示，以及 OpenAI 推理相容承載資料塑形；代理路由則不會
- `openai/gpt-5.3-codex-spark` 只能透過 ChatGPT／Codex OAuth 使用；直接 OpenAI API 金鑰和 Azure API 金鑰路由會拒絕它

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

如果 API 組織未提供 GPT-5.6，請明確設定
`openai/gpt-5.5`。一般的新手引導和重新驗證會保留
現有的明確主要模型；`models auth login --set-default` 和
`models set` 是刻意取代模型的途徑。

### Anthropic

- 提供者：`anthropic`
- 驗證：`ANTHROPIC_API_KEY`
- 選用輪替：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，以及 `OPENCLAW_LIVE_ANTHROPIC_KEY`（單一覆寫）
- 模型範例：`anthropic/claude-opus-4-6`
- 命令列介面：`openclaw onboard --auth-choice apiKey`
- 直接的公用 Anthropic 請求支援共用的 `/fast` 切換功能和 `params.fastMode`，包括傳送至 `api.anthropic.com`、使用 API 金鑰與 OAuth 驗證的流量；OpenClaw 會將其對應至 Anthropic `service_tier`（`auto` 與 `standard_only`）
- 建議的 Claude 命令列介面設定會維持標準模型參照，並分開選取命令列介面
  後端：使用 `anthropic/claude-opus-4-8` 搭配
  模型範圍的 `agentRuntime.id: "claude-cli"`。舊版
  `claude-cli/claude-opus-4-7` 參照仍可供相容性使用。

<Note>
重複使用 Claude 命令列介面（`claude -p`）是 OpenClaw 核准的整合途徑。Anthropic 設定權杖驗證仍受支援，但 OpenClaw 會在可用時優先重複使用 Claude 命令列介面。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT／Codex OAuth

- 提供者：`openai`
- 驗證：OAuth（ChatGPT）
- 全新原生 Codex app-server 控制框架參照：`openai/gpt-5.6-sol`
- 原生 Codex app-server 控制框架文件：[Codex 控制框架](/zh-TW/plugins/codex-harness)
- 舊版模型參照：`codex/gpt-*`
- 外掛界線：`openai/*` 會載入 OpenAI 外掛；明確的執行階段原則或提供者擁有的有效路由，會決定是否選取原生 Codex app-server 外掛。
- 命令列介面：`openclaw onboard --auth-choice openai` 或 `openclaw models auth login --provider openai`
- OpenClaw 內嵌的 ChatGPT Responses 傳輸方式預設為 `auto`（優先使用 WebSocket，SSE 作為備援）。
- `agents.defaults.models["openai/<model>"].params.transport`、`params.serviceTier` 和 `params.fastMode` 是自行指定的內嵌請求設定。這些設定會讓隱式執行階段選擇維持在 OpenClaw；原生 Codex 則自行管理其 app-server 傳輸方式與服務層級。
- 隱藏的 OpenClaw 歸屬標頭（`originator`、`version`、`User-Agent`）只會附加至傳送到 `chatgpt.com/backend-api` 的原生 Codex 流量，不適用於通用的 OpenAI 相容代理伺服器
- 共用的 `/fast` 切換功能仍可作為執行階段控制使用；它與自行指定的模型參數不同。
- 原生 Codex 目錄可依帳戶存取權限提供精確的 `openai/gpt-5.6-sol`、`openai/gpt-5.6-terra` 和 `openai/gpt-5.6-luna` 參照。它不會在用戶端套用直接 API 的未加修飾 `gpt-5.6` 別名。
- `openai/gpt-5.5` 使用 Codex 目錄原生的 `contextWindow = 400000`，以及預設執行階段 `contextTokens = 272000`；可使用 `models.providers.openai.models[].contextTokens` 覆寫執行階段上限
- 使用 `openai` 驗證登入，並在全新的訂閱支援設定中使用 `openai/gpt-5.6-sol`。如果該 Codex 工作區未提供 GPT-5.6，請明確選取 `openai/gpt-5.5`。
- 使用提供者／模型 `agentRuntime.id: "openclaw"`，讓原本符合資格的路由繼續使用內建執行階段。當未設定執行階段或設為 `auto` 時，只有完全符合官方 HTTPS Responses／ChatGPT 相容路由，且沒有自行指定的請求覆寫時，才可能隱式選取 Codex。
- 舊版 Codex GPT 參照屬於舊版狀態，而非有效的提供者路由。新的代理程式設定請使用標準 `openai/*` 參照，並執行 `openclaw doctor --fix` 來遷移舊版 Codex 模型參照，且不會升級現有的明確 `openai/gpt-5.5` 選擇。

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
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

### 其他訂閱型代管選項

<CardGroup cols={3}>
  <Card title="MiniMax" href="/zh-TW/providers/minimax">
    MiniMax Coding Plan OAuth 或 API 金鑰存取。
  </Card>
  <Card title="Qwen Cloud" href="/zh-TW/providers/qwen">
    Qwen Cloud 供應商介面，以及 Alibaba DashScope 與 Coding Plan 端點對應。
  </Card>
  <Card title="Z.AI (GLM)" href="/zh-TW/providers/zai">
    Z.AI Coding Plan 或一般 API 端點。
  </Card>
</CardGroup>

### OpenCode

- 驗證：`OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- Zen 執行階段供應商：`opencode`
- Go 執行階段供應商：`opencode-go`
- 範例模型：`opencode/claude-opus-4-6`、`opencode-go/kimi-k2.6`
- 命令列介面：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API 金鑰）

- 供應商：`google`
- 驗證：`GEMINI_API_KEY`
- 選用的輪替設定：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、備援的 `GOOGLE_API_KEY`，以及 `OPENCLAW_LIVE_GEMINI_KEY`（單一覆寫）
- 範例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3.5-flash`
- 相容性：使用 `google/gemini-3.1-flash-preview` 的舊版 OpenClaw 設定會正規化為 `google/gemini-3-flash-preview`
- 別名：接受 `google/gemini-3.1-pro`，並將其正規化為 Google 現行的 Gemini API ID：`google/gemini-3.1-pro-preview`
- 命令列介面：`openclaw onboard --auth-choice gemini-api-key`
- 思考：`/think adaptive` 使用 Google 動態思考。Gemini 3/3.1 省略固定的 `thinkingLevel`；Gemini 2.5 傳送 `thinkingBudget: -1`。
- 直接執行 Gemini 時，也接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或舊版的 `cached_content`），以轉送供應商原生的 `cachedContents/...` 控制代碼；Gemini 快取命中會顯示為 OpenClaw 的 `cacheRead`

### Google Vertex 與 Gemini CLI

- 供應商：`google-vertex`、`google-gemini-cli`
- 驗證：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程

<Warning>
OpenClaw 中的 Gemini CLI OAuth 是非官方整合。部分使用者回報，在使用第三方用戶端後，Google 帳戶受到限制。請檢閱 Google 條款；如果你選擇繼續，請使用非關鍵帳戶。
</Warning>

Gemini CLI OAuth 隨內建的 `google` 外掛一同提供。

<Steps>
  <Step title="安裝 Gemini CLI">
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

    預設模型：`google-gemini-cli/gemini-3-flash-preview`。你**不需要**將用戶端 ID 或密鑰貼入 `openclaw.json`。命令列介面登入流程會將權杖儲存在閘道主機上的驗證設定檔中。

  </Step>
  <Step title="設定專案（如有需要）">
    如果登入後請求失敗，請在閘道主機上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini CLI 預設使用 `stream-json`。OpenClaw 會讀取助理串流
訊息，並將 `stats.cached` 正規化為 `cacheRead`；舊版的
`--output-format json` 覆寫仍會從 `response` 讀取回覆文字。

### Z.AI (GLM)

- 供應商：`zai`
- 驗證：`ZAI_API_KEY`
- 範例模型：`zai/glm-5.2`
- 命令列介面：`openclaw onboard --auth-choice zai-api-key`
  - 模型參照使用標準的 `zai/*` 供應商 ID。
  - `zai-api-key` 會自動偵測相符的 Z.AI 端點；`zai-coding-global`、`zai-coding-cn`、`zai-global` 與 `zai-cn` 會強制使用特定介面

### Vercel AI Gateway

- 供應商：`vercel-ai-gateway`
- 驗證：`AI_GATEWAY_API_KEY`
- 範例模型：`vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- 命令列介面：`openclaw onboard --auth-choice ai-gateway-api-key`

### 其他內建供應商外掛

| 供應商                                  | ID                               | 驗證環境變數                                         | 範例模型                                                   |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` 或 `OPENROUTER_API_KEY`            | `arcee/trinity-large-thinking`                             |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                     |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` 或 `CHUTES_OAUTH_TOKEN`             | `chutes/zai-org/GLM-4.7-TEE`                               |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                            |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                  |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                               |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                               |
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

#### 值得注意的特殊行為

<AccordionGroup>
  <Accordion title="OpenRouter">
    僅在已驗證的 `openrouter.ai` 路由上套用其應用程式歸屬標頭與 Anthropic `cache_control` 標記。DeepSeek、Moonshot 與 ZAI 參照符合 OpenRouter 管理的提示詞快取 TTL 資格，但不會收到 Anthropic 快取標記。由於這是代理型的 OpenAI 相容路徑，因此會略過僅適用於原生 OpenAI 的調整（`serviceTier`、Responses `store`、提示詞快取提示、OpenAI 推理相容性）。Gemini 後端參照僅保留代理 Gemini 的思考簽章清理。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 後端參照遵循相同的代理 Gemini 清理路徑；`kilocode/kilo/auto` 與其他不支援代理推理的參照會略過代理推理注入。
  </Accordion>
  <Accordion title="MiniMax">
    API 金鑰引導設定會寫入明確的 M3 與 M2.7 聊天模型定義；圖片理解仍使用外掛所擁有的 `MiniMax-VL-01` 媒體提供者。
  </Accordion>
  <Accordion title="NVIDIA">
    模型 ID 使用 `nvidia/<vendor>/<model>` 命名空間（例如 `nvidia/nvidia/nemotron-...` 與 `nvidia/moonshotai/kimi-k2.5`）；選擇器會保留字面上的 `<provider>/<model-id>` 組合，而傳送至 API 的標準鍵仍只有單一前綴。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路徑。建議使用 SuperGrok/X Premium OAuth；API 金鑰仍可透過 `XAI_API_KEY` 或外掛設定運作，而 Grok `web_search` 會先重複使用相同的驗證設定檔，再回退至 API 金鑰。若可用，Grok 4.5 可供聊天、程式設計與代理式工作選用；`grok-4.3` 仍是區域安全的內建預設值。舊版 `/fast` 與 `params.fastMode: true` 設定仍會透過 xAI 的 Grok 4.3 相容性重新導向解析，但新設定應直接選擇目前的模型。`tool_stream` 預設開啟；可透過 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 停用。
  </Accordion>
</AccordionGroup>

## 透過 `models.providers` 使用提供者（自訂／基礎 URL）

使用 `models.providers`（或 `models.json`）新增**自訂**提供者或 OpenAI/Anthropic 相容代理。

下列許多內建提供者外掛已發布預設目錄。只有在你想覆寫預設基礎 URL、標頭或模型清單時，才使用明確的 `models.providers.<id>` 項目。

閘道模型功能檢查也會讀取明確的 `models.providers.<id>.models[]` 中繼資料。如果自訂或代理模型接受圖片，請在該模型上設定 `input: ["text", "image"]`，讓 WebChat 與來源為節點的附件路徑將圖片作為原生模型輸入傳遞，而不是純文字媒體參照。

`agents.defaults.models["provider/model"]` 只控制代理程式的模型可見性、別名及個別模型中繼資料。它本身不會註冊新的執行階段模型。對於自訂提供者模型，還需新增 `models.providers.<provider>.models[]`，其中至少包含相符的 `id`。

### Moonshot AI（Kimi）

開始引導設定前，請安裝 `@openclaw/moonshot-provider`。只有需要覆寫基礎 URL 或模型中繼資料時，才新增明確的 `models.providers.moonshot` 項目：

- 提供者：`moonshot`
- 驗證：`MOONSHOT_API_KEY`
- 模型範例：`moonshot/kimi-k2.6`
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
- 模型範例：`kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

舊版 `kimi/kimi-code` 與 `kimi/k2p5` 仍可作為相容模型 ID 使用，並會正規化為 Kimi 的穩定 API 模型 ID。

### Volcano Engine（豆包）

Volcano Engine（火山引擎）為中國使用者提供豆包及其他模型的存取能力。

- 提供者：`volcengine`（程式設計：`volcengine-plan`）
- 驗證：`VOLCANO_ENGINE_API_KEY`
- 模型範例：`volcengine-plan/ark-code-latest`
- 命令列介面：`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

引導設定預設使用程式設計介面，但同時也會註冊通用 `volcengine/*` 目錄。

在引導設定／配置的模型選擇器中，Volcengine 驗證選項會優先顯示 `volcengine/*` 與 `volcengine-plan/*` 兩類項目。如果尚未載入這些模型，OpenClaw 會回退至未篩選的目錄，而不會顯示空白的提供者範圍選擇器。

<Tabs>
  <Tab title="標準模型">
    - `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127`（Kimi K2.5）
    - `volcengine/glm-4-7-251222`（GLM 4.7）
    - `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2）

  </Tab>
  <Tab title="程式設計模型（volcengine-plan）">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus（國際版）

BytePlus ARK 為國際使用者提供與 Volcano Engine 相同的模型。

- 提供者：`byteplus`（程式設計：`byteplus-plan`）
- 驗證：`BYTEPLUS_API_KEY`
- 模型範例：`byteplus-plan/ark-code-latest`
- 命令列介面：`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

引導設定預設使用程式設計介面，但同時也會註冊通用 `byteplus/*` 目錄。

在引導設定／配置的模型選擇器中，BytePlus 驗證選項會優先顯示 `byteplus/*` 與 `byteplus-plan/*` 兩類項目。如果尚未載入這些模型，OpenClaw 會回退至未篩選的目錄，而不會顯示空白的提供者範圍選擇器。

<Tabs>
  <Tab title="標準模型">
    - `byteplus/seed-1-8-251228`（Seed 1.8）
    - `byteplus/kimi-k2-5-260127`（Kimi K2.5）
    - `byteplus/glm-4-7-251222`（GLM 4.7）

  </Tab>
  <Tab title="程式設計模型（byteplus-plan）">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic 透過 `synthetic` 提供者提供 Anthropic 相容模型：

- 提供者：`synthetic`
- 驗證：`SYNTHETIC_API_KEY`
- 模型範例：`synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax 使用自訂端點，因此透過 `models.providers` 設定：

- MiniMax OAuth（全球）：`--auth-choice minimax-global-oauth`
- MiniMax OAuth（中國）：`--auth-choice minimax-cn-oauth`
- MiniMax API 金鑰（全球）：`--auth-choice minimax-global-api`
- MiniMax API 金鑰（中國）：`--auth-choice minimax-cn-api`
- 驗證：`minimax` 使用 `MINIMAX_API_KEY`；`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`

設定詳細資料、模型選項及設定片段請參閱 [/providers/minimax](/zh-TW/providers/minimax)。

<Note>
在 MiniMax 的 Anthropic 相容串流路徑上，除非你明確設定，否則 OpenClaw 預設會對 M2.x 系列停用思考；MiniMax-M3（及 M3.x）預設仍使用提供者的省略／自適應思考路徑。`/fast on` 會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。
</Note>

外掛擁有的功能分工：

- 文字／聊天預設仍使用 `minimax/MiniMax-M3`
- 圖片生成使用 `minimax/image-01` 或 `minimax-portal/image-01`
- 兩種 MiniMax 驗證路徑上的圖片理解皆使用外掛所擁有的 `MiniMax-VL-01`
- 網頁搜尋仍使用提供者 ID `minimax`

### LM Studio

LM Studio 以使用原生 API 的內建提供者外掛形式提供：

- 提供者：`lmstudio`
- 驗證：`LM_API_TOKEN`
- 預設推論基礎 URL：`http://localhost:1234/v1`

接著設定模型（請替換為 `http://localhost:1234/api/v1/models` 傳回的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 原生的 `/api/v1/models` 與 `/api/v1/models/load` 進行探索與自動載入，預設則使用 `/v1/chat/completions` 進行推論。如果你希望由 LM Studio 的 JIT 載入、TTL 與自動逐出功能管理模型生命週期，請設定 `models.providers.lmstudio.params.preload: false`。設定與疑難排解請參閱 [/providers/lmstudio](/zh-TW/providers/lmstudio)。

### Ollama

Ollama 以內建提供者外掛形式提供，並使用 Ollama 的原生 API：

- 提供者：`ollama`
- 驗證：不需要（本機伺服器）
- 模型範例：`ollama/llama3.3`
- 安裝：[https://ollama.com/download](https://ollama.com/download)

```bash
# 安裝 Ollama，然後拉取模型：
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

當你透過 `OLLAMA_API_KEY` 選擇啟用時，系統會在本機的 `http://127.0.0.1:11434` 偵測 Ollama，而內建提供者外掛會直接將 Ollama 加入 `openclaw onboard` 與模型選擇器。關於引導設定、雲端／本機模式及自訂設定，請參閱 [/providers/ollama](/zh-TW/providers/ollama)。

### vLLM

vLLM 以內建提供者外掛形式提供，適用於本機／自行託管的 OpenAI 相容伺服器：

- 提供者：`vllm`
- 驗證：選用（取決於你的伺服器）
- 預設基礎 URL：`http://127.0.0.1:8000/v1`

若要選擇在本機啟用自動探索（如果你的伺服器不強制驗證，任何值皆可）：

```bash
export VLLM_API_KEY="vllm-local"
```

接著設定模型（請替換為 `/v1/models` 傳回的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細資料請參閱 [/providers/vllm](/zh-TW/providers/vllm)。

### SGLang

SGLang 以內建提供者外掛形式提供，適用於快速、自行託管的 OpenAI 相容伺服器：

- 提供者：`sglang`
- 驗證：選用（取決於你的伺服器）
- 預設基礎 URL：`http://127.0.0.1:30000/v1`

若要選擇在本機啟用自動探索（如果你的伺服器不強制驗證，任何值皆可）：

```bash
export SGLANG_API_KEY="sglang-local"
```

接著設定模型（請替換為 `/v1/models` 傳回的其中一個 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細資料請參閱 [/providers/sglang](/zh-TW/providers/sglang)。

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
  <Accordion title="預設選用欄位">
    對於自訂供應商，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 為選用欄位。省略時，OpenClaw 預設為：

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    建議：設定符合你的代理伺服器／模型限制的明確值。

  </Accordion>
  <Accordion title="代理路由塑形規則">
    - 對於非原生端點上的 `api: "openai-completions"`（任何非空白且主機不是 `api.openai.com` 的 `baseUrl`），OpenClaw 會強制設定 `compat.supportsDeveloperRole: false`，以避免供應商因不支援的 `developer` 角色而回傳 400 錯誤。
    - 代理式 OpenAI 相容路由也會略過僅供原生 OpenAI 使用的請求塑形：不傳送 `service_tier`、Responses 的 `store`、Completions 的 `store`、提示詞快取提示、OpenAI 推理相容酬載塑形，以及隱藏的 OpenClaw 歸屬標頭。
    - 對於需要供應商特定欄位的 OpenAI 相容 Completions 代理，請設定 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`），將額外的 JSON 合併至傳出請求本文。
    - 對於 vLLM 聊天範本控制項，請設定 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。當工作階段的思考層級關閉時，內建的 vLLM 外掛會自動為 `vllm/nemotron-3-*` 傳送 `enable_thinking: false` 和 `force_nonempty_content: true`。
    - 對於速度較慢的本機模型或遠端 LAN／tailnet 主機，請設定 `models.providers.<id>.timeoutSeconds`。這會延長供應商模型 HTTP 請求的處理時間，包括連線、標頭、本文串流，以及受防護擷取的總中止時間，但不會增加整個代理程式的執行逾時。若 `agents.defaults.timeoutSeconds` 或特定執行的逾時較低，也請提高該上限；供應商逾時無法延長整個執行時間。
    - 模型供應商 HTTP 呼叫僅針對已設定之供應商 `baseUrl` 的主機名稱，允許 Surge、Clash 和 sing-box 在 `198.18.0.0/15` 與 `fc00::/7` 範圍內的假 IP DNS 回應。自訂／本機供應商端點也會信任所設定的確切 `scheme://host:port` 來源，以用於受防護的模型請求，包括回送、LAN 和 tailnet 主機。這不是新的設定選項；你設定的 `baseUrl` 只會針對該來源擴充請求政策。假 IP 主機名稱允許機制與確切來源信任機制彼此獨立。其他私有、回送、連結本機、後設資料目的地及不同連接埠，仍需明確選擇啟用 `models.providers.<id>.request.allowPrivateNetwork: true`。設定 `models.providers.<id>.request.allowPrivateNetwork: false` 可選擇退出確切來源信任。
    - 若 `baseUrl` 為空白／省略，OpenClaw 會保留預設的 OpenAI 行為（其解析結果為 `api.openai.com`）。
    - 為了安全起見，在非原生 `openai-completions` 端點上，明確設定的 `compat.supportsDeveloperRole: true` 仍會被覆寫。
    - 對於非直接端點上的 `api: "anthropic-messages"`（正規 `anthropic` 以外的任何供應商，或主機不是公開 `api.anthropic.com` 端點的自訂 `models.providers.anthropic.baseUrl`），OpenClaw 會抑制隱含的 Anthropic Beta 標頭，例如 `claude-code-20250219`、`interleaved-thinking-2025-05-14` 和 OAuth 標記，避免自訂 Anthropic 相容代理因不支援的 Beta 旗標而拒絕請求。如果你的代理需要特定的 Beta 功能，請明確設定 `models.providers.<id>.headers["anthropic-beta"]`。

  </Accordion>
</AccordionGroup>

## 命令列介面範例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另請參閱：[設定](/zh-TW/gateway/configuration)，以取得完整的設定範例。

## 相關內容

- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - 模型設定鍵
- [模型容錯移轉](/zh-TW/concepts/model-failover) - 備援鏈與重試行為
- [模型](/zh-TW/concepts/models) - 模型設定與別名
- [供應商](/zh-TW/providers) - 各供應商的設定指南
