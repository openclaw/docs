---
read_when:
    - 你需要一份依供應商逐一說明的模型設定參考資料
    - 您想要模型供應商的範例設定檔或 CLI 初始設定命令
sidebarTitle: Model providers
summary: 模型供應商概覽，包含範例設定 + CLI 流程
title: 模型提供者
x-i18n:
    generated_at: "2026-05-10T19:31:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 643ee88e7d0cf4f9fe148ae8e390a1d7bba4986c29dd4fda6074f048f58dd7bb
    source_path: concepts/model-providers.md
    workflow: 16
---

Reference for **LLM/model providers** (not chat channels like WhatsApp/Telegram). For model selection rules, see [Models](/zh-TW/concepts/models).

## Quick rules

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - Model refs use `provider/model` (example: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` acts as an allowlist when set.
    - CLI helpers: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` set provider-level defaults; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` override them per model.
    - Fallback rules, cooldown probes, and session-override persistence: [Model failover](/zh-TW/concepts/model-failover).

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` preserves an existing `agents.defaults.model.primary` when you add or reauth a provider. Provider plugins may still return a recommended default model in their auth config patch, but configure treats that as "make this model available" when a primary model already exists, not "replace the current primary model."

    To intentionally switch the default model, use `openclaw models set <provider/model>` or `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    OpenAI-family routes are prefix-specific:

    - `openai/<model>` uses the native Codex app-server harness for agent turns by default. This is the usual ChatGPT/Codex subscription setup.
    - `openai-codex/<model>` is legacy config that doctor rewrites to `openai/<model>`.
    - `openai/<model>` plus provider/model `agentRuntime.id: "pi"` uses PI for explicit API-key or compatibility routes.

    See [OpenAI](/zh-TW/providers/openai) and [Codex harness](/zh-TW/plugins/codex-harness). If the provider/runtime split is confusing, read [Agent runtimes](/zh-TW/concepts/agent-runtimes) first.

    Plugin auto-enable follows the same boundary: `openai/*` agent refs enable the Codex plugin for the default route, and explicit provider/model `agentRuntime.id: "codex"` or legacy `codex/<model>` refs also require it.

    GPT-5.5 is available through the native Codex app-server harness by default on `openai/gpt-5.5`, and through PI only when provider/model runtime policy explicitly selects `pi`.

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI runtimes use the same split: choose canonical model refs such as `anthropic/claude-*`, `google/gemini-*`, or `openai/gpt-*`, then set provider/model runtime policy to `claude-cli`, `google-gemini-cli`, or `codex-cli` when you want a local CLI backend.

    Legacy `claude-cli/*`, `google-gemini-cli/*`, and `codex-cli/*` refs migrate back to canonical provider refs with the runtime recorded separately.

  </Accordion>
</AccordionGroup>

## Plugin-owned provider behavior

Most provider-specific logic lives in provider plugins (`registerProvider(...)`) while OpenClaw keeps the generic inference loop. Plugins own onboarding, model catalogs, auth env-var mapping, transport/config normalization, tool-schema cleanup, failover classification, OAuth refresh, usage reporting, thinking/reasoning profiles, and more.

The full list of provider-SDK hooks and bundled-plugin examples lives in [Provider plugins](/zh-TW/plugins/sdk-provider-plugins). A provider that needs a totally custom request executor is a separate, deeper extension surface.

<Note>
Provider-owned runner behavior lives on explicit provider hooks such as replay policy, tool-schema normalization, stream wrapping, and transport/request helpers. The legacy `ProviderPlugin.capabilities` static bag is compatibility-only and is no longer read by shared runner logic.
</Note>

## API key rotation

<AccordionGroup>
  <Accordion title="Key sources and priority">
    Configure multiple keys via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (single live override, highest priority)
    - `<PROVIDER>_API_KEYS` (comma or semicolon list)
    - `<PROVIDER>_API_KEY` (primary key)
    - `<PROVIDER>_API_KEY_*` (numbered list, e.g. `<PROVIDER>_API_KEY_1`)

    For Google providers, `GOOGLE_API_KEY` is also included as fallback. Key selection order preserves priority and deduplicates values.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - Requests are retried with the next key only on rate-limit responses (for example `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, or periodic usage-limit messages).
    - Non-rate-limit failures fail immediately; no key rotation is attempted.
    - When all candidate keys fail, the final error is returned from the last attempt.

  </Accordion>
</AccordionGroup>

## Built-in providers (pi-ai catalog)

OpenClaw ships with the pi-ai catalog. These providers require **no** `models.providers` config; just set auth + pick a model.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optional rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (single override)
- Example models: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verify account/model availability with `openclaw models list --provider openai` if a specific install or API key behaves differently.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Default transport is `auto`; OpenClaw passes the transport choice to pi-ai.
- Override per model via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, or `"auto"`)
- OpenAI priority processing can be enabled via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` and `params.fastMode` map direct `openai/*` Responses requests to `service_tier=priority` on `api.openai.com`
- Use `params.serviceTier` when you want an explicit tier instead of the shared `/fast` toggle
- Hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`) apply only on native OpenAI traffic to `api.openai.com`, not generic OpenAI-compatible proxies
- Native OpenAI routes also keep Responses `store`, prompt-cache hints, and OpenAI reasoning-compat payload shaping; proxy routes do not
- `openai/gpt-5.3-codex-spark` is intentionally suppressed in OpenClaw because live OpenAI API requests reject it and the current Codex catalog does not expose it

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optional rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (single override)
- Example model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direct public Anthropic requests support the shared `/fast` toggle and `params.fastMode`, including API-key and OAuth-authenticated traffic sent to `api.anthropic.com`; OpenClaw maps that to Anthropic `service_tier` (`auto` vs `standard_only`)
- Preferred Claude CLI config keeps the model ref canonical and selects the CLI
  backend separately: `anthropic/claude-opus-4-7` with
  model-scoped `agentRuntime.id: "claude-cli"`. Legacy
  `claude-cli/claude-opus-4-7` refs still work for compatibility.

<Note>
Anthropic staff told us OpenClaw-style Claude CLI usage is allowed again, so OpenClaw treats Claude CLI reuse and `claude -p` usage as sanctioned for this integration unless Anthropic publishes a new policy. Anthropic setup-token remains available as a supported OpenClaw token path, but OpenClaw now prefers Claude CLI reuse and `claude -p` when available.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Legacy PI model ref: `openai-codex/gpt-5.5`
- Native Codex app-server harness ref: `openai/gpt-5.5`
- Native Codex app-server harness docs: [Codex harness](/zh-TW/plugins/codex-harness)
- Legacy model refs: `codex/gpt-*`
- Plugin boundary: `openai-codex/*` loads the OpenAI plugin; the native Codex app-server plugin is selected only by the Codex harness runtime or legacy `codex/*` refs.
- CLI: `openclaw onboard --auth-choice openai-codex` or `openclaw models auth login --provider openai-codex`
- Default transport is `auto` (WebSocket-first, SSE fallback)
- Override per PI model via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, or `"auto"`)
- `params.serviceTier` is also forwarded on native Codex Responses requests (`chatgpt.com/backend-api`)
- Hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`) are only attached on native Codex traffic to `chatgpt.com/backend-api`, not generic OpenAI-compatible proxies
- Shares the same `/fast` toggle and `params.fastMode` config as direct `openai/*`; OpenClaw maps that to `service_tier=priority`
- `openai-codex/gpt-5.5` uses the Codex catalog native `contextWindow = 400000` and default runtime `contextTokens = 272000`; override the runtime cap with `models.providers.openai-codex.models[].contextTokens`
- Policy note: OpenAI Codex OAuth is explicitly supported for external tools/workflows like OpenClaw.
- For the common subscription plus native Codex runtime route, sign in with `openai-codex` auth but configure `openai/gpt-5.5`; OpenAI agent turns select Codex by default.
- Use provider/model `agentRuntime.id: "pi"` only when you want a compatibility route through PI; otherwise keep `openai/gpt-5.5` on the default Codex harness.
- Older `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*`, and `openai-codex/gpt-5.3*` refs are suppressed because ChatGPT/Codex OAuth accounts reject them; use `openai-codex/gpt-5.5` or the native Codex runtime route instead.

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
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Other subscription-style hosted options

<CardGroup cols={3}>
  <Card title="GLM models" href="/zh-TW/providers/glm">
    Z.AI Coding Plan or general API endpoints.
  </Card>
  <Card title="MiniMax" href="/zh-TW/providers/minimax">
    MiniMax Coding Plan OAuth or API key access.
  </Card>
  <Card title="Qwen Cloud" href="/zh-TW/providers/qwen">
    Qwen Cloud provider surface plus Alibaba DashScope and Coding Plan endpoint mapping.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (or `OPENCODE_ZEN_API_KEY`)
- Zen runtime provider: `opencode`
- Go runtime provider: `opencode-go`
- Example models: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` or `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- 提供者：`google`
- 驗證：`GEMINI_API_KEY`
- 選用輪替：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 後援，以及 `OPENCLAW_LIVE_GEMINI_KEY`（單一覆寫）
- 範例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 相容性：使用 `google/gemini-3.1-flash-preview` 的舊版 OpenClaw 設定會正規化為 `google/gemini-3-flash-preview`
- 別名：接受 `google/gemini-3.1-pro`，並會正規化為 Google 即時 Gemini API ID：`google/gemini-3.1-pro-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`
- 思考：`/think adaptive` 使用 Google 動態思考。Gemini 3/3.1 會省略固定的 `thinkingLevel`；Gemini 2.5 會傳送 `thinkingBudget: -1`。
- 直接執行 Gemini 時，也接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或舊版 `cached_content`），用來轉送提供者原生的 `cachedContents/...` 控制代碼；Gemini 快取命中會以 OpenClaw `cacheRead` 呈現

### Google Vertex 與 Gemini CLI

- 提供者：`google-vertex`、`google-gemini-cli`
- 驗證：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程

<Warning>
OpenClaw 中的 Gemini CLI OAuth 是非官方整合。有些使用者回報使用第三方用戶端後遇到 Google 帳戶限制。請檢閱 Google 條款；若選擇繼續，請使用非關鍵帳戶。
</Warning>

Gemini CLI OAuth 隨內建的 `google` plugin 一起提供。

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

    預設模型：`google-gemini-cli/gemini-3-flash-preview`。你**不需要**將用戶端 ID 或密鑰貼到 `openclaw.json`。CLI 登入流程會將權杖儲存在 gateway 主機上的驗證設定檔中。

  </Step>
  <Step title="Set project (if needed)">
    如果登入後請求失敗，請在 gateway 主機上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini CLI JSON 回覆會從 `response` 剖析；用量會後援到 `stats`，並將 `stats.cached` 正規化為 OpenClaw `cacheRead`。

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
- 基底 URL：`https://api.kilo.ai/api/gateway/`
- 靜態後援目錄隨附 `kilocode/kilo/auto`；即時 `https://api.kilo.ai/api/gateway/models` 探索可進一步擴充執行階段目錄。
- `kilocode/kilo/auto` 背後的確切上游路由由 Kilo Gateway 擁有，而不是硬編碼在 OpenClaw 中。

請參閱 [/providers/kilocode](/zh-TW/providers/kilocode) 取得設定詳細資料。

### 其他內建提供者 plugin

| 供應商                | 識別碼                               | 驗證環境變數                                                     | 範例模型                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### 值得了解的特殊行為

<AccordionGroup>
  <Accordion title="OpenRouter">
    只在已驗證的 `openrouter.ai` 路由上套用其應用程式歸因標頭和 Anthropic `cache_control` 標記。DeepSeek、Moonshot 和 ZAI 參照符合由 OpenRouter 管理的提示快取之 cache-TTL 條件，但不會收到 Anthropic 快取標記。作為代理式 OpenAI 相容路徑，它會略過僅限原生 OpenAI 的塑形（`serviceTier`、Responses `store`、提示快取提示、OpenAI reasoning 相容性）。Gemini 後端的參照只保留代理 Gemini thought-signature 清理。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 後端的參照遵循相同的代理 Gemini 清理路徑；`kilocode/kilo/auto` 和其他不支援代理 reasoning 的參照會略過代理 reasoning 注入。
  </Accordion>
  <Accordion title="MiniMax">
    API 金鑰 onboarding 會寫入明確的純文字 M2.7 聊天模型定義；影像理解仍保留在 Plugin 擁有的 `MiniMax-VL-01` 媒體供應商上。
  </Accordion>
  <Accordion title="NVIDIA">
    模型識別碼使用 `nvidia/<vendor>/<model>` 命名空間（例如 `nvidia/nvidia/nemotron-...` 以及 `nvidia/moonshotai/kimi-k2.5`）；選擇器會保留字面上的 `<provider>/<model-id>` 組合，而傳送到 API 的標準鍵則維持單一前綴。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路徑。`grok-4.3` 是內建預設聊天模型。`/fast` 或 `params.fastMode: true` 會將 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 重寫為其 `*-fast` 變體。`tool_stream` 預設開啟；可透過 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 停用。
  </Accordion>
  <Accordion title="Cerebras">
    以內建的 `cerebras` 供應商 Plugin 發行。GLM 使用 `zai-glm-4.7`；OpenAI 相容的基礎 URL 為 `https://api.cerebras.ai/v1`。
  </Accordion>
</AccordionGroup>

## 透過 `models.providers` 使用供應商（自訂/基礎 URL）

使用 `models.providers`（或 `models.json`）新增**自訂**供應商或 OpenAI/Anthropic 相容代理。

下方許多內建供應商 Plugin 已經發布預設目錄。只有在你想覆寫預設基礎 URL、標頭或模型清單時，才使用明確的 `models.providers.<id>` 項目。

Gateway 模型能力檢查也會讀取明確的 `models.providers.<id>.models[]` 中繼資料。如果自訂或代理模型接受圖片，請在該模型上設定 `input: ["text", "image"]`，讓 WebChat 和來自節點的附件路徑將圖片作為原生模型輸入傳遞，而不是純文字媒體參照。

`agents.defaults.models["provider/model"]` 只控制代理的模型可見性、別名和個別模型中繼資料。它本身不會註冊新的執行階段模型。對於自訂供應商模型，也請加入 `models.providers.<provider>.models[]`，並至少包含相符的 `id`。

### Moonshot AI (Kimi)

Moonshot 以內建供應商 Plugin 發行。預設使用內建供應商，只有在需要覆寫基礎 URL 或模型中繼資料時，才加入明確的 `models.providers.moonshot` 項目：

- 供應商：`moonshot`
- 驗證：`MOONSHOT_API_KEY`
- 範例模型：`moonshot/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice moonshot-api-key` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 模型識別碼：

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
- 範例模型：`kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

舊版 `kimi/kimi-code` 和 `kimi/k2p5` 仍會作為相容性模型 id 被接受，並正規化為 Kimi 的穩定 API 模型 id。

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) 在中國提供 Doubao 和其他模型的存取。

- 提供者：`volcengine`（程式碼：`volcengine-plan`）
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

Onboarding 預設使用程式碼介面，但一般的 `volcengine/*` 目錄會同時註冊。

在 onboarding/configure 模型選擇器中，Volcengine 驗證選項會優先使用 `volcengine/*` 和 `volcengine-plan/*` 列。如果這些模型尚未載入，OpenClaw 會退回到未篩選的目錄，而不是顯示空的提供者範圍選擇器。

<Tabs>
  <Tab title="標準模型">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="程式碼模型 (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus（國際）

BytePlus ARK 為國際使用者提供與 Volcano Engine 相同模型的存取。

- 提供者：`byteplus`（程式碼：`byteplus-plan`）
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

Onboarding 預設使用程式碼介面，但一般的 `byteplus/*` 目錄會同時註冊。

在 onboarding/configure 模型選擇器中，BytePlus 驗證選項會優先使用 `byteplus/*` 和 `byteplus-plan/*` 列。如果這些模型尚未載入，OpenClaw 會退回到未篩選的目錄，而不是顯示空的提供者範圍選擇器。

<Tabs>
  <Tab title="標準模型">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="程式碼模型 (byteplus-plan)">
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

請參閱 [/providers/minimax](/zh-TW/providers/minimax) 以取得設定詳細資料、模型選項和設定片段。

<Note>
在 MiniMax 的 Anthropic 相容串流路徑上，除非你明確設定，否則 OpenClaw 預設會停用 thinking，且 `/fast on` 會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。
</Note>

Plugin 擁有的功能分割：

- 文字/聊天預設保留在 `minimax/MiniMax-M2.7`
- 圖像生成是 `minimax/image-01` 或 `minimax-portal/image-01`
- 圖像理解是在兩種 MiniMax 驗證路徑上皆由 Plugin 擁有的 `MiniMax-VL-01`
- Web 搜尋保留在提供者 id `minimax`

### LM Studio

LM Studio 作為使用原生 API 的內建提供者 Plugin 發行：

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

OpenClaw 使用 LM Studio 的原生 `/api/v1/models` 和 `/api/v1/models/load` 進行探索與自動載入，並預設使用 `/v1/chat/completions` 進行推論。如果你希望 LM Studio JIT 載入、TTL 和自動逐出自行管理模型生命週期，請設定 `models.providers.lmstudio.params.preload: false`。請參閱 [/providers/lmstudio](/zh-TW/providers/lmstudio) 以取得設定和疑難排解。

### Ollama

Ollama 作為內建提供者 Plugin 發行，並使用 Ollama 的原生 API：

- 提供者：`ollama`
- 驗證：不需要（本機伺服器）
- 範例模型：`ollama/llama3.3`
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

當你使用 `OLLAMA_API_KEY` 選擇加入時，Ollama 會在本機 `http://127.0.0.1:11434` 偵測到，且內建提供者 Plugin 會直接將 Ollama 加入 `openclaw onboard` 和模型選擇器。請參閱 [/providers/ollama](/zh-TW/providers/ollama) 以取得 onboarding、雲端/本機模式和自訂設定。

### vLLM

vLLM 作為供本機/自架 OpenAI 相容伺服器使用的內建提供者 Plugin 發行：

- 提供者：`vllm`
- 驗證：選用（取決於你的伺服器）
- 預設基底 URL：`http://127.0.0.1:8000/v1`

若要在本機選擇加入自動探索（如果你的伺服器不強制驗證，任何值都可以）：

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

請參閱 [/providers/vllm](/zh-TW/providers/vllm) 以取得詳細資料。

### SGLang

SGLang 作為供快速自架 OpenAI 相容伺服器使用的內建提供者 Plugin 發行：

- 提供者：`sglang`
- 驗證：選用（取決於你的伺服器）
- 預設基底 URL：`http://127.0.0.1:30000/v1`

若要在本機選擇加入自動探索（如果你的伺服器不強制驗證，任何值都可以）：

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

請參閱 [/providers/sglang](/zh-TW/providers/sglang) 以取得詳細資料。

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
    對於自訂提供者，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是選用的。省略時，OpenClaw 預設為：

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    建議：設定符合你的代理/模型限制的明確值。

  </Accordion>
  <Accordion title="代理路由塑形規則">
    - 對於非原生端點上的 `api: "openai-completions"`（任何非空 `baseUrl` 且其主機不是 `api.openai.com`），OpenClaw 會強制 `compat.supportsDeveloperRole: false`，以避免提供者因不支援的 `developer` 角色而出現 400 錯誤。
    - 代理式 OpenAI 相容路由也會略過僅限原生 OpenAI 的請求塑形：沒有 `service_tier`、沒有 Responses `store`、沒有 Completions `store`、沒有提示快取提示、沒有 OpenAI reasoning 相容承載塑形，也沒有隱藏的 OpenClaw attribution 標頭。
    - 對於需要供應商特定欄位的 OpenAI 相容 Completions 代理，請設定 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`），將額外 JSON 合併到傳出的請求主體。
    - 對於 vLLM chat-template 控制，請設定 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。當工作階段 thinking 層級關閉時，內建 vLLM Plugin 會針對 `vllm/nemotron-3-*` 自動傳送 `enable_thinking: false` 和 `force_nonempty_content: true`。
    - 對於較慢的本機模型或遠端 LAN/tailnet 主機，請設定 `models.providers.<id>.timeoutSeconds`。這會延長提供者模型 HTTP 請求處理，包括連線、標頭、主體串流，以及總體 guarded-fetch 中止，而不會增加整個代理程式執行階段逾時。
    - 模型提供者 HTTP 呼叫僅允許針對已設定提供者 `baseUrl` 主機名稱，在 `198.18.0.0/15` 和 `fc00::/7` 中使用 Surge、Clash 和 sing-box fake-IP DNS 回答。其他私有、loopback、link-local 和中繼資料目的地仍需要明確選擇加入 `models.providers.<id>.request.allowPrivateNetwork: true`。
    - 如果 `baseUrl` 為空/省略，OpenClaw 會保留預設 OpenAI 行為（解析為 `api.openai.com`）。
    - 為了安全，明確的 `compat.supportsDeveloperRole: true` 在非原生 `openai-completions` 端點上仍會被覆寫。
    - 對於非直連端點上的 `api: "anthropic-messages"`（任何不是標準 `anthropic` 的提供者，或自訂 `models.providers.anthropic.baseUrl` 且其主機不是公用 `api.anthropic.com` 端點），OpenClaw 會抑制隱含的 Anthropic beta 標頭，例如 `claude-code-20250219`、`interleaved-thinking-2025-05-14` 和 OAuth 標記，因此自訂 Anthropic 相容代理不會拒絕不支援的 beta 旗標。如果你的代理需要特定 beta 功能，請明確設定 `models.providers.<id>.headers["anthropic-beta"]`。

  </Accordion>
</AccordionGroup>

## CLI 範例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另請參閱：[設定](/zh-TW/gateway/configuration)，以取得完整設定範例。

## 相關

- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - 模型設定鍵
- [模型容錯移轉](/zh-TW/concepts/model-failover) - 備援鏈和重試行為
- [模型](/zh-TW/concepts/models) - 模型設定和別名
- [提供者](/zh-TW/providers) - 各提供者設定指南
