---
read_when:
    - 你需要一份按提供商划分的模型设置参考
    - 你需要模型提供商的配置示例或 CLI 新手引导命令
sidebarTitle: Model providers
summary: 模型提供商概览，包含示例配置 + CLI 流程
title: 模型提供商
x-i18n:
    generated_at: "2026-07-05T11:14:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27dc5802f622de2c36da44667d777c570693627202af8af5cde4276f3a7ec5d7
    source_path: concepts/model-providers.md
    workflow: 16
---

**LLM/模型提供商**参考（不是 WhatsApp/Telegram 这类聊天渠道）。关于模型选择规则，请参阅 [Models](/zh-CN/concepts/models)。

## 快速规则

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - 模型引用使用 `provider/model`（示例：`opencode/claude-opus-4-6`）。
    - 设置后，`agents.defaults.models` 会作为允许列表。
    - CLI 辅助命令：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` 设置提供商级默认值；`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` 按模型覆盖这些默认值。
    - 回退规则、冷却探测和会话覆盖持久化：[模型故障转移](/zh-CN/concepts/model-failover)。

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    添加或重新认证提供商时，`openclaw configure` 会保留现有的 `agents.defaults.model.primary`。除非传入 `--set-default`，否则 `openclaw models auth login` 也会这样做。提供商插件仍然可能在其认证配置补丁中返回推荐的默认模型，但当主模型已经存在时，OpenClaw 会将其视为“让此模型可用”，而不是“替换当前主模型”。

    如需有意切换默认模型，请使用 `openclaw models set <provider/model>` 或 `openclaw models auth login --provider <id> --set-default`。

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    OpenAI 系列路由按前缀区分：

    - `openai/<model>` 默认使用原生 Codex 应用服务器 Codex harness 处理 Agent 轮次。这是常见的 ChatGPT/Codex 订阅设置。
    - 旧版 Codex 模型引用属于旧版配置，Doctor 会将其重写为 `openai/<model>`。
    - `openai/<model>` 加提供商/模型 `agentRuntime.id: "openclaw"` 会使用 OpenClaw 的内置运行时，用于显式 API key 或兼容性路由。

    请参阅 [OpenAI](/zh-CN/providers/openai) 和 [Codex harness](/zh-CN/plugins/codex-harness)。如果提供商/运行时拆分令人困惑，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

    插件自动启用遵循同一边界：`openai/*` Agent 引用会为默认路由启用 Codex 插件，显式的提供商/模型 `agentRuntime.id: "codex"` 或旧版 `codex/<model>` 引用也需要该插件。

    GPT-5.5 默认可通过 `openai/gpt-5.5` 上的原生 Codex 应用服务器 Codex harness 使用；当提供商/模型运行时策略显式选择 `openclaw` 时，也可通过 OpenClaw 运行时使用。

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI 运行时使用相同拆分：选择规范模型引用，例如 `anthropic/claude-*` 或 `google/gemini-*`，然后在需要本地 CLI 后端时，将提供商/模型运行时策略设置为 `claude-cli` 或 `google-gemini-cli`。

    旧版 `claude-cli/*` 和 `google-gemini-cli/*` 引用会迁移回规范提供商引用，并单独记录运行时。旧版 `codex-cli/*` 引用会迁移到 `openai/*` 并使用 Codex 应用服务器路由；OpenClaw 不再保留内置的 Codex CLI 后端。

  </Accordion>
</AccordionGroup>

## 插件拥有的提供商行为

大多数提供商特定逻辑位于提供商插件（`registerProvider(...)`）中，而 OpenClaw 保留通用推理循环。插件拥有新手引导、模型目录、认证环境变量映射、传输/配置规范化、工具 schema 清理、故障转移分类、OAuth 刷新、用量报告、thinking/reasoning 配置等。

提供商 SDK 钩子和内置插件示例的完整列表位于 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。需要完全自定义请求执行器的提供商属于单独且更深层的扩展面。

<Note>
提供商拥有的 runner 行为位于显式提供商钩子上，例如重放策略、工具 schema 规范化、流包装以及传输/请求辅助工具。旧版 `ProviderPlugin.capabilities` 静态包仅用于兼容性，共享 runner 逻辑不再读取它。
</Note>

## API key 轮换

<AccordionGroup>
  <Accordion title="Key sources and priority">
    通过以下方式配置多个 key：

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个实时覆盖，最高优先级）
    - `<PROVIDER>_API_KEYS`（逗号或分号分隔列表）
    - `<PROVIDER>_API_KEY`（主 key）
    - `<PROVIDER>_API_KEY_*`（编号列表，例如 `<PROVIDER>_API_KEY_1`）

    对于 Google 提供商，`GOOGLE_API_KEY` 也会作为回退包含在内。key 选择顺序会保留优先级并对值去重。

  </Accordion>
  <Accordion title="When rotation kicks in">
    - 仅在限速响应时，才会使用下一个 key 重试请求（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 或周期性用量限制消息）。
    - 非限速失败会立即失败；不会尝试 key 轮换。
    - 当所有候选 key 都失败时，将返回最后一次尝试的最终错误。

  </Accordion>
</AccordionGroup>

## 官方提供商插件

官方提供商插件会发布自己的模型目录行。这些提供商**不需要** `models.providers` 模型条目；启用提供商插件、设置认证，然后选择模型即可。仅在显式自定义提供商或超时等窄范围请求设置中使用 `models.providers`。

### OpenAI

- 提供商：`openai`
- 认证：`OPENAI_API_KEY`
- 可选轮换：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，以及 `OPENCLAW_LIVE_OPENAI_KEY`（单个覆盖）
- 示例模型：`openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 如果特定安装或 API key 的行为不同，请使用 `openclaw models list --provider openai` 验证账号/模型可用性。
- CLI：`openclaw onboard --auth-choice openai-api-key`
- 默认传输为 `auto`；OpenClaw 会将传输选择传给共享模型运行时。
- 可通过 `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"` 或 `"auto"`）按模型覆盖
- 可通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用 OpenAI priority processing
- `/fast` 和 `params.fastMode` 会将直接 `openai/*` Responses 请求映射到 `api.openai.com` 上的 `service_tier=priority`
- 当你想要显式 tier 而不是共享 `/fast` 开关时，请使用 `params.serviceTier`
- 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）仅适用于发往 `api.openai.com` 的原生 OpenAI 流量，不适用于通用 OpenAI 兼容代理
- 原生 OpenAI 路由还会保留 Responses `store`、prompt-cache 提示和 OpenAI reasoning 兼容载荷成形；代理路由不会
- `openai/gpt-5.3-codex-spark` 仅可通过 ChatGPT/Codex OAuth 使用；直接 OpenAI API key 和 Azure API key 路由会拒绝它

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- 提供商：`anthropic`
- 认证：`ANTHROPIC_API_KEY`
- 可选轮换：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，以及 `OPENCLAW_LIVE_ANTHROPIC_KEY`（单个覆盖）
- 示例模型：`anthropic/claude-opus-4-6`
- CLI：`openclaw onboard --auth-choice apiKey`
- 直接公共 Anthropic 请求支持共享 `/fast` 开关和 `params.fastMode`，包括发送到 `api.anthropic.com` 的 API key 和 OAuth 认证流量；OpenClaw 会将其映射到 Anthropic `service_tier`（`auto` 与 `standard_only`）
- 首选 Claude CLI 配置会保持模型引用规范，并单独选择 CLI
  后端：`anthropic/claude-opus-4-8`，配合
  模型作用域的 `agentRuntime.id: "claude-cli"`。旧版
  `claude-cli/claude-opus-4-7` 引用仍可用于兼容性。

<Note>
Claude CLI 复用（`claude -p`）是获准的 OpenClaw 集成路径。Anthropic setup-token 认证仍受支持，但 OpenClaw 会在可用时优先使用 Claude CLI 复用。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- 提供商：`openai`
- 认证：OAuth（ChatGPT）
- 原生 Codex 应用服务器 Codex harness 引用：`openai/gpt-5.5`
- 原生 Codex 应用服务器 Codex harness 文档：[Codex harness](/zh-CN/plugins/codex-harness)
- 旧版模型引用：`codex/gpt-*`
- 插件边界：`openai/*` 加载 OpenAI 插件；原生 Codex 应用服务器插件由 Codex harness runtime 选择。
- CLI：`openclaw onboard --auth-choice openai` 或 `openclaw models auth login --provider openai`
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 通过 `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"` 或 `"auto"`）按 OpenAI Codex 模型覆盖
- `params.serviceTier` 也会在原生 Codex Responses 请求（`chatgpt.com/backend-api`）上传递
- 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）仅附加到发往 `chatgpt.com/backend-api` 的原生 Codex 流量，不适用于通用 OpenAI 兼容代理
- 与直接 `openai/*` 共享相同的 `/fast` 开关和 `params.fastMode` 配置；OpenClaw 会将其映射为 `service_tier=priority`
- `openai/gpt-5.5` 使用 Codex 目录原生 `contextWindow = 400000` 和默认运行时 `contextTokens = 272000`；使用 `models.providers.openai.models[].contextTokens` 覆盖运行时上限
- 使用 `openai` 认证登录并配置 `openai/gpt-5.5`，即可使用标准订阅加原生 Codex 运行时路由；OpenAI Agent 轮次默认选择 Codex。
- 仅当你想使用内置 OpenClaw 路由时，才使用提供商/模型 `agentRuntime.id: "openclaw"`；否则让 `openai/gpt-5.5` 保持在默认 Codex harness 上。
- 旧版 Codex GPT 引用是旧版状态，不是实时提供商路由。新 Agent 配置请在原生 Codex 运行时上使用 `openai/gpt-5.5`，并运行 `openclaw doctor --fix` 将旧版 Codex 模型引用迁移到规范 `openai/*` 引用。

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

### 其他订阅式托管选项

<CardGroup cols={3}>
  <Card title="MiniMax" href="/zh-CN/providers/minimax">
    MiniMax Coding Plan OAuth 或 API key 访问。
  </Card>
  <Card title="Qwen Cloud" href="/zh-CN/providers/qwen">
    Qwen Cloud 提供商表面，加 Alibaba DashScope 和 Coding Plan 端点映射。
  </Card>
  <Card title="Z.AI (GLM)" href="/zh-CN/providers/zai">
    Z.AI Coding Plan 或通用 API 端点。
  </Card>
</CardGroup>

### OpenCode

- 认证：`OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- Zen 运行时提供商：`opencode`
- Go 运行时提供商：`opencode-go`
- 示例模型：`opencode/claude-opus-4-6`、`opencode-go/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API key）

- 提供商：`google`
- 凭证：`GEMINI_API_KEY`
- 可选轮换：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 回退，以及 `OPENCLAW_LIVE_GEMINI_KEY`（单一覆盖）
- 示例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 兼容性：使用 `google/gemini-3.1-flash-preview` 的旧版 OpenClaw 配置会被规范化为 `google/gemini-3-flash-preview`
- 别名：接受 `google/gemini-3.1-pro`，并将其规范化为 Google 实时 Gemini API ID：`google/gemini-3.1-pro-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`
- 思考：`/think adaptive` 使用 Google 动态思考。Gemini 3/3.1 会省略固定的 `thinkingLevel`；Gemini 2.5 会发送 `thinkingBudget: -1`。
- 直接 Gemini 运行也接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或旧版 `cached_content`），用于转发提供商原生的 `cachedContents/...` 句柄；Gemini cache 命中会作为 OpenClaw `cacheRead` 呈现

### Google Vertex 和 Gemini CLI

- 提供商：`google-vertex`、`google-gemini-cli`
- 凭证：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程

<Warning>
OpenClaw 中的 Gemini CLI OAuth 是非官方集成。一些用户报告称，使用第三方客户端后遇到了 Google 账号限制。请查看 Google 条款；如果你选择继续，请使用非关键账号。
</Warning>

Gemini CLI OAuth 作为内置 `google` 插件的一部分交付。

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

    默认模型：`google-gemini-cli/gemini-3-flash-preview`。你**不**需要把客户端 ID 或密钥粘贴到 `openclaw.json` 中。CLI 登录流程会将令牌存储在 Gateway 网关主机上的凭证配置中。

  </Step>
  <Step title="Set project (if needed)">
    如果登录后请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini CLI 默认使用 `stream-json`。OpenClaw 会读取 assistant 流式消息，并将 `stats.cached` 规范化为 `cacheRead`；旧版 `--output-format json` 覆盖仍会从 `response` 读取回复文本。

### Z.AI (GLM)

- 提供商：`zai`
- 凭证：`ZAI_API_KEY`
- 示例模型：`zai/glm-5.2`
- CLI：`openclaw onboard --auth-choice zai-api-key`
  - 模型引用使用规范的 `zai/*` 提供商 ID。
  - `zai-api-key` 会自动检测匹配的 Z.AI 端点；`zai-coding-global`、`zai-coding-cn`、`zai-global` 和 `zai-cn` 会强制使用特定表面

### Vercel AI Gateway

- 提供商：`vercel-ai-gateway`
- 凭证：`AI_GATEWAY_API_KEY`
- 示例模型：`vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice ai-gateway-api-key`

### 其他内置提供商插件

| 提供商                                  | Id                               | 凭证环境变量                                         | 示例模型                                                   |
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
| [Ollama Cloud](/zh-CN/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth 或 `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                    |
| [Qwen OAuth](/zh-CN/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                             |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth 或 `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### 值得了解的特性

<AccordionGroup>
  <Accordion title="OpenRouter">
    仅在已验证的 `openrouter.ai` 路由上应用其应用归因标头和 Anthropic `cache_control` 标记。DeepSeek、Moonshot 和 ZAI 引用符合 OpenRouter 托管提示缓存的缓存 TTL 条件，但不会接收 Anthropic 缓存标记。作为代理式 OpenAI 兼容路径，它会跳过仅限原生 OpenAI 的整形（`serviceTier`、Responses `store`、提示缓存提示、OpenAI reasoning 兼容）。Gemini 支持的引用仅保留代理 Gemini 思维签名清理。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 支持的引用遵循相同的代理 Gemini 清理路径；`kilocode/kilo/auto` 和其他不支持代理推理的引用会跳过代理推理注入。
  </Accordion>
  <Accordion title="MiniMax">
    API key 新手引导会写入显式的 M3 和 M2.7 聊天模型定义；图像理解仍保留在插件拥有的 `MiniMax-VL-01` 媒体提供商上。
  </Accordion>
  <Accordion title="NVIDIA">
    模型 ID 使用 `nvidia/<vendor>/<model>` 命名空间（例如 `nvidia/nvidia/nemotron-...` 与 `nvidia/moonshotai/kimi-k2.5` 并列）；选择器会保留字面量 `<provider>/<model-id>` 组合，而发送给 API 的规范键仍保持单前缀。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路径。推荐路径是 SuperGrok/X Premium OAuth；API key 仍可通过 `XAI_API_KEY` 或插件配置使用，并且 Grok `web_search` 会在 API key 回退之前复用相同的凭证配置文件。`grok-4.3` 是内置默认聊天模型，`grok-build-0.1` 可用于构建/编码导向的工作。`/fast` 或 `params.fastMode: true` 会将 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 重写为它们的 `*-fast` 变体。`tool_stream` 默认开启；可通过 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 禁用。
  </Accordion>
</AccordionGroup>

## 通过 `models.providers` 配置提供商（自定义/base URL）

使用 `models.providers`（或 `models.json`）添加**自定义**提供商或 OpenAI/Anthropic 兼容代理。

下面许多内置提供商插件已经发布默认目录。仅当你想覆盖默认 base URL、标头或模型列表时，才使用显式的 `models.providers.<id>` 条目。

Gateway 网关模型能力检查也会读取显式的 `models.providers.<id>.models[]` 元数据。如果自定义或代理模型接受图像，请在该模型上设置 `input: ["text", "image"]`，这样 WebChat 和节点来源的附件路径会将图像作为原生模型输入传递，而不是作为仅文本媒体引用。

`agents.defaults.models["provider/model"]` 只控制智能体的模型可见性、别名和每模型元数据。它本身不会注册新的运行时模型。对于自定义提供商模型，还要添加 `models.providers.<provider>.models[]`，其中至少包含匹配的 `id`。

### Moonshot AI (Kimi)

安装 `@openclaw/moonshot-provider` 后再进行新手引导。仅当你需要覆盖基础 URL 或模型元数据时，才添加显式的 `models.providers.moonshot` 条目：

- 提供商：`moonshot`
- 凭证：`MOONSHOT_API_KEY`
- 示例模型：`moonshot/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice moonshot-api-key` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`

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

参阅 [Moonshot AI (Kimi + Kimi Coding)](/zh-CN/providers/moonshot) 获取完整设置指南。

### Kimi Coding

Kimi Coding 使用 Moonshot AI 的 Anthropic 兼容端点：

- 提供商：`kimi`
- 凭证：`KIMI_API_KEY`
- 示例模型：`kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

旧版 `kimi/kimi-code` 和 `kimi/k2p5` 仍会作为兼容性模型 ID 被接受，并规范化为 Kimi 的稳定 API 模型 ID。

### Volcano Engine (Doubao)

Volcano Engine（火山引擎）提供对 Doubao 和中国其他模型的访问。

- 提供商：`volcengine`（编码：`volcengine-plan`）
- 凭证：`VOLCANO_ENGINE_API_KEY`
- 示例模型：`volcengine-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

新手引导默认使用编码能力面，但通用 `volcengine/*` 目录也会同时注册。

在新手引导/配置模型选择器中，Volcengine 凭证选项会优先显示 `volcengine/*` 和 `volcengine-plan/*` 两类行。如果这些模型尚未加载，OpenClaw 会回退到未过滤的目录，而不是显示一个空的提供商范围选择器。

<Tabs>
  <Tab title="标准模型">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="编码模型（volcengine-plan）">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus（国际版）

BytePlus ARK 为国际用户提供对与 Volcano Engine 相同模型的访问。

- 提供商：`byteplus`（编码：`byteplus-plan`）
- 凭证：`BYTEPLUS_API_KEY`
- 示例模型：`byteplus-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

新手引导默认使用编码能力面，但通用 `byteplus/*` 目录也会同时注册。

在新手引导/配置模型选择器中，BytePlus 凭证选项会优先显示 `byteplus/*` 和 `byteplus-plan/*` 两类行。如果这些模型尚未加载，OpenClaw 会回退到未过滤的目录，而不是显示一个空的提供商范围选择器。

<Tabs>
  <Tab title="标准模型">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="编码模型（byteplus-plan）">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic 通过 `synthetic` 提供商提供 Anthropic 兼容模型：

- 提供商：`synthetic`
- 凭证：`SYNTHETIC_API_KEY`
- 示例模型：`synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax 通过 `models.providers` 配置，因为它使用自定义端点：

- MiniMax OAuth（全球）：`--auth-choice minimax-global-oauth`
- MiniMax OAuth（中国）：`--auth-choice minimax-cn-oauth`
- MiniMax API key（全球）：`--auth-choice minimax-global-api`
- MiniMax API key（中国）：`--auth-choice minimax-cn-api`
- 凭证：`minimax` 使用 `MINIMAX_API_KEY`；`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`

参阅 [/providers/minimax](/zh-CN/providers/minimax) 获取设置详情、模型选项和配置片段。

<Note>
在 MiniMax 的 Anthropic 兼容流式传输路径上，除非你显式设置，OpenClaw 会默认对 M2.x 系列禁用 thinking；MiniMax-M3（以及 M3.x）默认保留提供商省略/自适应 thinking 路径。`/fast on` 会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
</Note>

插件拥有的能力拆分：

- 文本/聊天默认保持在 `minimax/MiniMax-M3`
- 图像生成是 `minimax/image-01` 或 `minimax-portal/image-01`
- 图像理解是在两条 MiniMax 凭证路径上由插件拥有的 `MiniMax-VL-01`
- Web 搜索保持在提供商 ID `minimax`

### LM Studio

LM Studio 作为内置提供商插件发布，使用原生 API：

- 提供商：`lmstudio`
- 凭证：`LM_API_TOKEN`
- 默认推理基础 URL：`http://localhost:1234/v1`

然后设置一个模型（替换为 `http://localhost:1234/api/v1/models` 返回的 ID 之一）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 原生的 `/api/v1/models` 和 `/api/v1/models/load` 进行设备发现 + 自动加载，默认使用 `/v1/chat/completions` 进行推理。如果你希望由 LM Studio JIT 加载、TTL 和自动逐出拥有模型生命周期，请设置 `models.providers.lmstudio.params.preload: false`。参阅 [/providers/lmstudio](/zh-CN/providers/lmstudio) 获取设置和故障排查。

### Ollama

Ollama 作为内置提供商插件发布，并使用 Ollama 的原生 API：

- 提供商：`ollama`
- 凭证：无需（本地服务器）
- 示例模型：`ollama/llama3.3`
- 安装：[https://ollama.com/download](https://ollama.com/download)

```bash
# 安装 Ollama，然后拉取模型：
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

当你通过 `OLLAMA_API_KEY` 选择启用时，OpenClaw 会在本地 `http://127.0.0.1:11434` 检测 Ollama，内置提供商插件会将 Ollama 直接添加到 `openclaw onboard` 和模型选择器。参阅 [/providers/ollama](/zh-CN/providers/ollama) 获取新手引导、云/本地模式和自定义配置。

### vLLM

vLLM 作为内置提供商插件发布，用于本地/自托管的 OpenAI 兼容服务器：

- 提供商：`vllm`
- 凭证：可选（取决于你的服务器）
- 默认基础 URL：`http://127.0.0.1:8000/v1`

要在本地选择启用自动发现（如果你的服务器不强制凭证，任意值都可以）：

```bash
export VLLM_API_KEY="vllm-local"
```

然后设置一个模型（替换为 `/v1/models` 返回的 ID 之一）：

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

参阅 [/providers/vllm](/zh-CN/providers/vllm) 获取详情。

### SGLang

SGLang 作为内置提供商插件发布，用于快速自托管的 OpenAI 兼容服务器：

- 提供商：`sglang`
- 凭证：可选（取决于你的服务器）
- 默认基础 URL：`http://127.0.0.1:30000/v1`

要在本地选择启用自动发现（如果你的服务器不强制凭证，任意值都可以）：

```bash
export SGLANG_API_KEY="sglang-local"
```

然后设置一个模型（替换为 `/v1/models` 返回的 ID 之一）：

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

参阅 [/providers/sglang](/zh-CN/providers/sglang) 获取详情。

### 本地代理（LM Studio、vLLM、LiteLLM 等）

示例（OpenAI 兼容）：

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
  <Accordion title="默认可选字段">
    对于自定义提供商，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是可选的。省略时，OpenClaw 默认使用：

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    推荐：设置与你的代理/模型限制匹配的显式值。

  </Accordion>
  <Accordion title="代理路由整形规则">
    - 对于非原生端点上的 `api: "openai-completions"`（任何非空 `baseUrl`，且其主机不是 `api.openai.com`），OpenClaw 会强制设置 `compat.supportsDeveloperRole: false`，以避免提供商因不支持 `developer` 角色而返回 400 错误。
    - 代理风格的 OpenAI 兼容路由也会跳过仅限原生 OpenAI 的请求整形：没有 `service_tier`，没有 Responses `store`，没有 Completions `store`，没有 prompt-cache 提示，没有 OpenAI reasoning-compat 负载整形，也没有隐藏的 OpenClaw 归因标头。
    - 对于需要供应商特定字段的 OpenAI 兼容 Completions 代理，设置 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`），以便将额外 JSON 合并到出站请求正文中。
    - 对于 vLLM chat-template 控制，设置 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。内置 vLLM 插件会在会话思考级别关闭时，自动为 `vllm/nemotron-3-*` 发送 `enable_thinking: false` 和 `force_nonempty_content: true`。
    - 对于较慢的本地模型或远程 LAN/tailnet 主机，设置 `models.providers.<id>.timeoutSeconds`。这会延长提供商模型 HTTP 请求处理，包括连接、标头、正文流式传输和总 guarded-fetch 中止时间，而不会增加整个 agent 运行时超时。如果 `agents.defaults.timeoutSeconds` 或运行特定超时更低，也要提高该上限；提供商超时不能延长整个运行。
    - 模型提供商 HTTP 调用允许 Surge、Clash 和 sing-box 在 `198.18.0.0/15` 与 `fc00::/7` 中的 fake-IP DNS 响应，但仅限已配置提供商 `baseUrl` 主机名。自定义/本地提供商端点也会信任那个精确配置的 `scheme://host:port` 源，用于 guarded 模型请求，包括 loopback、LAN 和 tailnet 主机。这不是新的配置选项；你配置的 `baseUrl` 只会为该源扩展请求策略。Fake-IP 主机名允许规则与精确源信任是彼此独立的机制。其他私有、loopback、link-local、metadata 目标以及不同端口仍需要显式选择加入 `models.providers.<id>.request.allowPrivateNetwork: true`。设置 `models.providers.<id>.request.allowPrivateNetwork: false` 可退出精确源信任。
    - 如果 `baseUrl` 为空/省略，OpenClaw 会保留默认 OpenAI 行为（解析到 `api.openai.com`）。
    - 为了安全，在非原生 `openai-completions` 端点上，显式的 `compat.supportsDeveloperRole: true` 仍会被覆盖。
    - 对于非直接端点上的 `api: "anthropic-messages"`（除规范 `anthropic` 以外的任何提供商，或主机不是公开 `api.anthropic.com` 端点的自定义 `models.providers.anthropic.baseUrl`），OpenClaw 会抑制隐式 Anthropic beta 标头，例如 `claude-code-20250219`、`interleaved-thinking-2025-05-14` 和 OAuth 标记，因此自定义 Anthropic 兼容代理不会拒绝不支持的 beta 标志。如果你的代理需要特定 beta 功能，请显式设置 `models.providers.<id>.headers["anthropic-beta"]`。

  </Accordion>
</AccordionGroup>

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另请参阅：[配置](/zh-CN/gateway/configuration)，了解完整配置示例。

## 相关

- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) - 模型配置键
- [模型故障转移](/zh-CN/concepts/model-failover) - fallback 链和重试行为
- [Models](/zh-CN/concepts/models) - 模型配置和别名
- [Providers](/zh-CN/providers) - 各提供商设置指南
