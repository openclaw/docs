---
read_when:
    - 你需要一份按提供商分类的模型设置参考。
    - 你需要模型提供商的配置示例或 CLI 新手引导命令
sidebarTitle: Model providers
summary: 模型提供商概览，包含示例配置和 CLI 流程
title: 模型提供商
x-i18n:
    generated_at: "2026-07-12T14:24:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20477f9f6c8c616b4eca6653a29e0e8c9ffe5049ddfed91c585e9e22cdb669a2
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM/模型提供商参考（不包括 WhatsApp/Telegram 等聊天渠道）。有关模型选择规则，请参阅[模型](/zh-CN/concepts/models)。

## 快速规则

<AccordionGroup>
  <Accordion title="模型引用和 CLI 辅助命令">
    - 模型引用使用 `provider/model`（示例：`opencode/claude-opus-4-6`）。
    - 设置后，`agents.defaults.models` 将作为允许列表。
    - CLI 辅助命令：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` 设置提供商级默认值；`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` 按模型覆盖这些默认值。
    - 回退规则、冷却探测和会话覆盖持久化：[模型故障转移](/zh-CN/concepts/model-failover)。

  </Accordion>
  <Accordion title="添加提供商身份验证不会更改主模型">
    添加提供商或重新进行身份验证时，`openclaw configure` 会保留现有的 `agents.defaults.model.primary`。除非传入 `--set-default`，否则 `openclaw models auth login` 也会如此。提供商插件仍可在其身份验证配置补丁中返回建议的默认模型，但如果主模型已存在，OpenClaw 会将其视为“使此模型可用”，而不是“替换当前主模型”。

    要有意切换默认模型，请使用 `openclaw models set <provider/model>` 或 `openclaw models auth login --provider <id> --set-default`。

  </Accordion>
  <Accordion title="OpenAI 提供商/运行时拆分">
    OpenAI 模型引用与 Agent Runtimes 相互独立：

    - `openai/<model>` 选择规范的 OpenAI provider 和模型。仅此前缀绝不会选择 Codex。
    - 当未设置提供商/模型运行时策略或将其设为 `auto` 时，仅对于没有自行指定请求覆盖的、精确匹配官方 HTTPS Platform Responses 或 ChatGPT Responses 的路由，OpenAI 才可能隐式选择 Codex。
    - 自行配置的 Completions 适配器、自定义端点以及带有自行指定请求行为的路由仍使用 OpenClaw。官方明文 HTTP 端点会被拒绝。
    - 旧版 Codex 模型引用属于旧版配置，Doctor 会将其重写为 `openai/<model>`。
    - 提供商/模型的 `agentRuntime.id: "openclaw"` 会明确让原本符合条件的路由继续使用 OpenClaw。`agentRuntime.id: "codex"` 要求使用 Codex；当有效路由与 Codex 不兼容时，将以失败关闭方式处理。

    请参阅 [OpenAI 隐式 Agent runtime](/zh-CN/providers/openai#implicit-agent-runtime)和 [Codex harness](/zh-CN/plugins/codex-harness)。如果提供商/运行时拆分令你困惑，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

    插件自动启用遵循相同边界：与 Codex 隐式兼容的有效路由可以启用 Codex 插件，而明确设置提供商/模型 `agentRuntime.id: "codex"` 或使用旧版 `codex/<model>` 引用则要求启用该插件。仅 `openai/*` 前缀本身并不会启用它。

    全新的 OpenAI 设置使用特定于路由的 GPT-5.6 引用：API key 设置选择
    `openai/gpt-5.6`（直接 API 的无后缀 ID 会解析为 Sol），而
    ChatGPT/Codex OAuth 会为原生 Codex
    目录精确选择 `openai/gpt-5.6-sol`。添加或刷新 OpenAI 身份验证时，会保留现有的显式主模型，包括 `openai/gpt-5.5`。对于无权访问
    GPT-5.6 的账号，GPT-5.5 仍可通过任一运行时作为显式恢复选项使用。

  </Accordion>
  <Accordion title="CLI 运行时">
    CLI 运行时使用相同的拆分方式：选择 `anthropic/claude-*` 或 `google/gemini-*` 等规范模型引用，然后在需要本地 CLI 后端时，将提供商/模型运行时策略设置为 `claude-cli` 或 `google-gemini-cli`。

    旧版 `claude-cli/*` 和 `google-gemini-cli/*` 引用会迁移回规范提供商引用，并单独记录运行时。旧版 `codex-cli/*` 引用会迁移到 `openai/*` 并使用 Codex app-server 路由；OpenClaw 不再保留内置 Codex CLI 后端。

  </Accordion>
</AccordionGroup>

## 插件拥有的提供商行为

大多数提供商特定逻辑位于提供商插件（`registerProvider(...)`）中，而 OpenClaw 保留通用推理循环。插件负责新手引导、模型目录、身份验证环境变量映射、传输/配置规范化、工具架构清理、故障转移分类、OAuth 刷新、用量报告、思考/推理配置文件等。

提供商 SDK 钩子和内置插件示例的完整列表位于[提供商插件](/zh-CN/plugins/sdk-provider-plugins)中。需要完全自定义请求执行器的提供商属于另一种更深层的扩展接口。

<Note>
提供商拥有的运行器行为位于显式提供商钩子上，例如重放策略、工具架构规范化、流封装以及传输/请求辅助函数。旧版 `ProviderPlugin.capabilities` 静态包仅用于兼容，共享运行器逻辑已不再读取它。
</Note>

## API key 轮换

<AccordionGroup>
  <Accordion title="密钥来源和优先级">
    可通过以下方式配置多个密钥：

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个实时覆盖，优先级最高）
    - `<PROVIDER>_API_KEYS`（逗号或分号分隔的列表）
    - `<PROVIDER>_API_KEY`（主密钥）
    - `<PROVIDER>_API_KEY_*`（编号列表，例如 `<PROVIDER>_API_KEY_1`）

    对于 Google 提供商，`GOOGLE_API_KEY` 也会作为回退项包含在内。密钥选择顺序会保留优先级并对值进行去重。

  </Accordion>
  <Accordion title="何时触发轮换">
    - 仅当收到速率限制响应时，才会使用下一个密钥重试请求（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 或周期性用量限制消息）。
    - 非速率限制故障会立即失败；不会尝试密钥轮换。
    - 当所有候选密钥均失败时，将返回最后一次尝试产生的最终错误。

  </Accordion>
</AccordionGroup>

## 官方提供商插件

官方提供商插件会发布自己的模型目录行。这些提供商**不**需要 `models.providers` 模型条目；启用提供商插件、设置身份验证并选择模型即可。仅将 `models.providers` 用于显式自定义提供商或超时等细粒度请求设置。

### OpenAI

- 提供商：`openai`
- 身份验证：`OPENAI_API_KEY`
- 可选轮换：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，以及 `OPENCLAW_LIVE_OPENAI_KEY`（单个覆盖）
- 全新设置默认值：`openai/gpt-5.6`；在直接 API 上，无后缀 ID 会解析为 Sol。
- 示例模型：`openai/gpt-5.6`、`openai/gpt-5.6-terra`、`openai/gpt-5.6-luna`、`openai/gpt-5.5`
- 如果特定安装或 API key 的行为不同，请使用 `openclaw models list --provider openai` 验证账号/模型可用性。
- CLI：`openclaw onboard --auth-choice openai-api-key`
- 默认传输方式为 `auto`；OpenClaw 会将传输选择传递给共享模型运行时。
- 可通过 `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"` 或 `"auto"`）按模型覆盖
- 可通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用 OpenAI 优先处理
- `/fast` 和 `params.fastMode` 会将发往 `api.openai.com` 的直接 `openai/*` Responses 请求映射为 `service_tier=priority`
- 如果需要显式指定服务层级，而不是使用共享 `/fast` 开关，请使用 `params.serviceTier`
- 隐藏的 OpenClaw 归属标头（`originator`、`version`、`User-Agent`）仅适用于发往 `api.openai.com` 的原生 OpenAI 流量，不适用于通用 OpenAI 兼容代理
- 原生 OpenAI 路由还会保留 Responses `store`、提示词缓存提示和 OpenAI 推理兼容载荷塑形；代理路由不会
- `openai/gpt-5.3-codex-spark` 只能通过 ChatGPT/Codex OAuth 使用；直接 OpenAI API key 和 Azure API key 路由会拒绝它

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

如果 API 组织未开放 GPT-5.6，请显式设置
`openai/gpt-5.5`。常规新手引导和重新进行身份验证会保留
现有的显式主模型；`models auth login --set-default` 和
`models set` 是用于有意替换主模型的路径。

### Anthropic

- 提供商：`anthropic`
- 身份验证：`ANTHROPIC_API_KEY`
- 可选轮换：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，以及 `OPENCLAW_LIVE_ANTHROPIC_KEY`（单个覆盖）
- 示例模型：`anthropic/claude-opus-4-6`
- CLI：`openclaw onboard --auth-choice apiKey`
- 直接发送给 Anthropic 公共服务的请求支持共享 `/fast` 开关和 `params.fastMode`，包括发送到 `api.anthropic.com` 的 API key 和 OAuth 身份验证流量；OpenClaw 会将其映射到 Anthropic `service_tier`（`auto` 与 `standard_only`）
- 推荐的 Claude CLI 配置会保持模型引用的规范形式，并单独选择 CLI
  后端：`anthropic/claude-opus-4-8`，同时设置模型范围的
  `agentRuntime.id: "claude-cli"`。旧版
  `claude-cli/claude-opus-4-7` 引用仍可用于兼容。

<Note>
复用 Claude CLI（`claude -p`）是 OpenClaw 认可的集成路径。Anthropic setup-token 身份验证仍受支持，但在可用时，OpenClaw 优先复用 Claude CLI。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- 提供商：`openai`
- 身份验证：OAuth（ChatGPT）
- 全新原生 Codex app-server harness 引用：`openai/gpt-5.6-sol`
- 原生 Codex app-server harness 文档：[Codex harness](/zh-CN/plugins/codex-harness)
- 旧版模型引用：`codex/gpt-*`
- 插件边界：`openai/*` 加载 OpenAI 插件；显式运行时策略或提供商拥有的有效路由决定是否选择原生 Codex app-server 插件。
- CLI：`openclaw onboard --auth-choice openai` 或 `openclaw models auth login --provider openai`
- OpenClaw 内嵌的 ChatGPT Responses 传输方式默认为 `auto`（优先使用 WebSocket，回退到 SSE）。
- `agents.defaults.models["openai/<model>"].params.transport`、`params.serviceTier` 和 `params.fastMode` 是自行指定的内嵌请求设置。它们会让隐式运行时选择继续使用 OpenClaw；原生 Codex 自行管理其 app-server 传输方式和服务层级。
- 隐藏的 OpenClaw 归属标头（`originator`、`version`、`User-Agent`）仅会附加到发往 `chatgpt.com/backend-api` 的原生 Codex 流量，不适用于通用 OpenAI 兼容代理
- 共享 `/fast` 开关仍可用作运行时控制；它不同于自行指定的模型参数。
- 原生 Codex 目录可根据账号访问权限公开精确的 `openai/gpt-5.6-sol`、`openai/gpt-5.6-terra` 和 `openai/gpt-5.6-luna` 引用。它不会在客户端应用直接 API 的无后缀 `gpt-5.6` 别名。
- `openai/gpt-5.5` 使用 Codex 目录原生的 `contextWindow = 400000` 和默认运行时 `contextTokens = 272000`；可通过 `models.providers.openai.models[].contextTokens` 覆盖运行时上限
- 使用 `openai` 身份验证登录，并在全新订阅支持的设置中使用 `openai/gpt-5.6-sol`。如果该 Codex 工作区未开放 GPT-5.6，请显式选择 `openai/gpt-5.5`。
- 使用提供商/模型的 `agentRuntime.id: "openclaw"`，让原本符合条件的路由继续使用内置运行时。当未设置运行时或将其设为 `auto` 时，只有精确匹配官方 HTTPS Responses/ChatGPT 兼容路由且没有自行指定请求覆盖的路由，才可能隐式选择 Codex。
- 旧版 Codex GPT 引用属于旧版状态，而不是有效的提供商路由。新 Agent 配置应使用规范的 `openai/*` 引用，并运行 `openclaw doctor --fix` 迁移旧版 Codex 模型引用，而不会升级现有的显式 `openai/gpt-5.5` 选择。

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

### 其他订阅式托管选项

<CardGroup cols={3}>
  <Card title="MiniMax" href="/zh-CN/providers/minimax">
    MiniMax Coding Plan OAuth 或 API 密钥访问。
  </Card>
  <Card title="Qwen Cloud" href="/zh-CN/providers/qwen">
    Qwen Cloud 提供商接口，以及 Alibaba DashScope 和 Coding Plan 端点映射。
  </Card>
  <Card title="Z.AI (GLM)" href="/zh-CN/providers/zai">
    Z.AI Coding Plan 或通用 API 端点。
  </Card>
</CardGroup>

### OpenCode

- 身份验证：`OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- Zen 运行时提供商：`opencode`
- Go 运行时提供商：`opencode-go`
- 模型示例：`opencode/claude-opus-4-6`、`opencode-go/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API 密钥）

- 提供商：`google`
- 身份验证：`GEMINI_API_KEY`
- 可选轮换：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 回退，以及 `OPENCLAW_LIVE_GEMINI_KEY`（单一覆盖值）
- 模型示例：`google/gemini-3.1-pro-preview`、`google/gemini-3.5-flash`
- 兼容性：使用 `google/gemini-3.1-flash-preview` 的旧版 OpenClaw 配置会被规范化为 `google/gemini-3-flash-preview`
- 别名：接受 `google/gemini-3.1-pro`，并将其规范化为 Google 当前使用的 Gemini API ID：`google/gemini-3.1-pro-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`
- 思考：`/think adaptive` 使用 Google 动态思考。Gemini 3/3.1 不发送固定的 `thinkingLevel`；Gemini 2.5 发送 `thinkingBudget: -1`。
- 直接运行 Gemini 时，还可通过 `agents.defaults.models["google/<model>"].params.cachedContent`（或旧版 `cached_content`）转发提供商原生的 `cachedContents/...` 句柄；Gemini 缓存命中在 OpenClaw 中显示为 `cacheRead`

### Google Vertex 和 Gemini CLI

- 提供商：`google-vertex`、`google-gemini-cli`
- 身份验证：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程

<Warning>
OpenClaw 中的 Gemini CLI OAuth 是非官方集成。一些用户报告称，使用第三方客户端后其 Google 账号受到限制。如果你选择继续，请查看 Google 条款并使用非关键账号。
</Warning>

Gemini CLI OAuth 作为内置 `google` 插件的一部分提供。

<Steps>
  <Step title="安装 Gemini CLI">
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
  <Step title="启用插件">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="登录">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    默认模型：`google-gemini-cli/gemini-3-flash-preview`。你**无需**将客户端 ID 或密钥粘贴到 `openclaw.json` 中。CLI 登录流程会将令牌存储在 Gateway 网关主机的身份验证配置文件中。

  </Step>
  <Step title="设置项目（如有需要）">
    如果登录后请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini CLI 默认使用 `stream-json`。OpenClaw 读取智能体流式
消息，并将 `stats.cached` 规范化为 `cacheRead`；旧版
`--output-format json` 覆盖仍从 `response` 中读取回复文本。

### Z.AI (GLM)

- 提供商：`zai`
- 身份验证：`ZAI_API_KEY`
- 模型示例：`zai/glm-5.2`
- CLI：`openclaw onboard --auth-choice zai-api-key`
  - 模型引用使用规范的 `zai/*` 提供商 ID。
  - `zai-api-key` 会自动检测匹配的 Z.AI 端点；`zai-coding-global`、`zai-coding-cn`、`zai-global` 和 `zai-cn` 会强制使用特定接口

### Vercel AI Gateway 网关

- 提供商：`vercel-ai-gateway`
- 身份验证：`AI_GATEWAY_API_KEY`
- 模型示例：`vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice ai-gateway-api-key`

### 其他内置提供商插件

| 提供商                                  | ID                               | 身份验证环境变量                                     | 模型示例                                                   |
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
| [Ollama Cloud](/zh-CN/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth 或 `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                    |
| [Qwen OAuth](/zh-CN/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                             |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway 网关                  | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine（豆包）                  | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth 或 `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### 值得了解的特殊之处

<AccordionGroup>
  <Accordion title="OpenRouter">
    仅在经过验证的 `openrouter.ai` 路由上应用其应用归属标头和 Anthropic `cache_control` 标记。DeepSeek、Moonshot 和 ZAI 引用符合 OpenRouter 托管提示词缓存的缓存 TTL 条件，但不会接收 Anthropic 缓存标记。作为代理式 OpenAI 兼容路径，它会跳过仅适用于原生 OpenAI 的调整（`serviceTier`、Responses `store`、提示词缓存提示、OpenAI 推理兼容）。由 Gemini 支持的引用仅保留代理 Gemini 思维签名清理。
  </Accordion>
  <Accordion title="Kilo Gateway">
    由 Gemini 支持的引用遵循相同的代理 Gemini 清理路径；`kilocode/kilo/auto` 和其他不支持代理推理的引用会跳过代理推理注入。
  </Accordion>
  <Accordion title="MiniMax">
    API 密钥新手引导会写入显式的 M3 和 M2.7 聊天模型定义；图像理解仍使用插件拥有的 `MiniMax-VL-01` 媒体提供商。
  </Accordion>
  <Accordion title="NVIDIA">
    模型 ID 使用 `nvidia/<vendor>/<model>` 命名空间（例如 `nvidia/nvidia/nemotron-...` 与 `nvidia/moonshotai/kimi-k2.5`）；选择器会保留字面形式的 `<provider>/<model-id>` 组合，而发送到 API 的规范键仍仅包含单个前缀。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路径。推荐路径是 SuperGrok/X Premium OAuth；API 密钥仍可通过 `XAI_API_KEY` 或插件配置使用，并且 Grok `web_search` 会先复用同一身份验证配置文件，再回退到 API 密钥。在可用的情况下，可选择 Grok 4.5 用于聊天、编码和智能体工作；`grok-4.3` 仍是适用于各地区的内置默认模型。较旧的 `/fast` 和 `params.fastMode: true` 配置仍会通过 xAI 的 Grok 4.3 兼容性重定向进行解析，但新配置应直接选择当前模型。`tool_stream` 默认启用；可通过 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 禁用。
  </Accordion>
</AccordionGroup>

## 通过 `models.providers` 使用提供商（自定义/基础 URL）

使用 `models.providers`（或 `models.json`）添加**自定义**提供商或 OpenAI/Anthropic 兼容代理。

下面许多内置提供商插件已经发布默认目录。仅当你希望覆盖默认基础 URL、标头或模型列表时，才使用显式的 `models.providers.<id>` 条目。

Gateway 网关模型能力检查也会读取显式的 `models.providers.<id>.models[]` 元数据。如果自定义或代理模型接受图像，请在该模型上设置 `input: ["text", "image"]`，以便 WebChat 和源自节点的附件路径将图像作为原生模型输入传递，而不是仅含文本的媒体引用。

`agents.defaults.models["provider/model"]` 仅控制智能体的模型可见性、别名和每模型元数据。它本身不会注册新的运行时模型。对于自定义提供商模型，还需添加 `models.providers.<provider>.models[]`，并至少包含匹配的 `id`。

### Moonshot AI（Kimi）

在新手引导前安装 `@openclaw/moonshot-provider`。仅当需要覆盖基础 URL 或模型元数据时，才添加显式的 `models.providers.moonshot` 条目：

- 提供商：`moonshot`
- 身份验证：`MOONSHOT_API_KEY`
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

完整设置指南请参阅 [Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)。

### Kimi Coding

Kimi Coding 使用 Moonshot AI 的 Anthropic 兼容端点：

- 提供商：`kimi`
- 身份验证：`KIMI_API_KEY`
- 示例模型：`kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

旧版 `kimi/kimi-code` 和 `kimi/k2p5` 仍作为兼容模型 ID 被接受，并会规范化为 Kimi 的稳定 API 模型 ID。

### Volcano Engine（豆包）

Volcano Engine（火山引擎）在中国提供对豆包及其他模型的访问。

- 提供商：`volcengine`（编码：`volcengine-plan`）
- 身份验证：`VOLCANO_ENGINE_API_KEY`
- 示例模型：`volcengine-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

新手引导默认使用编码界面，但同时也会注册通用 `volcengine/*` 目录。

在新手引导/配置模型选择器中，Volcengine 身份验证选项会优先显示 `volcengine/*` 和 `volcengine-plan/*` 两类条目。如果这些模型尚未加载，OpenClaw 会回退到未筛选的目录，而不是显示空的提供商范围选择器。

<Tabs>
  <Tab title="标准模型">
    - `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127`（Kimi K2.5）
    - `volcengine/glm-4-7-251222`（GLM 4.7）
    - `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2）

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
- 身份验证：`BYTEPLUS_API_KEY`
- 示例模型：`byteplus-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

新手引导默认使用编码界面，但同时也会注册通用 `byteplus/*` 目录。

在新手引导/配置模型选择器中，BytePlus 身份验证选项会优先显示 `byteplus/*` 和 `byteplus-plan/*` 两类条目。如果这些模型尚未加载，OpenClaw 会回退到未筛选的目录，而不是显示空的提供商范围选择器。

<Tabs>
  <Tab title="标准模型">
    - `byteplus/seed-1-8-251228`（Seed 1.8）
    - `byteplus/kimi-k2-5-260127`（Kimi K2.5）
    - `byteplus/glm-4-7-251222`（GLM 4.7）

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
- 身份验证：`SYNTHETIC_API_KEY`
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
- MiniMax API 密钥（全球）：`--auth-choice minimax-global-api`
- MiniMax API 密钥（中国）：`--auth-choice minimax-cn-api`
- 身份验证：`minimax` 使用 `MINIMAX_API_KEY`；`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`

有关设置详情、模型选项和配置片段，请参阅 [/providers/minimax](/zh-CN/providers/minimax)。

<Note>
在 MiniMax 的 Anthropic 兼容流式传输路径上，除非你显式设置，否则 OpenClaw 默认会为 M2.x 系列禁用思考；MiniMax-M3（以及 M3.x）默认仍使用提供商的省略式/自适应思考路径。`/fast on` 会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
</Note>

插件拥有的能力划分：

- 文本/聊天默认仍使用 `minimax/MiniMax-M3`
- 图像生成使用 `minimax/image-01` 或 `minimax-portal/image-01`
- 两种 MiniMax 身份验证路径上的图像理解都使用插件拥有的 `MiniMax-VL-01`
- Web 搜索仍使用提供商 ID `minimax`

### LM Studio

LM Studio 作为内置提供商插件提供，并使用原生 API：

- 提供商：`lmstudio`
- 身份验证：`LM_API_TOKEN`
- 默认推理基础 URL：`http://localhost:1234/v1`

然后设置模型（替换为 `http://localhost:1234/api/v1/models` 返回的其中一个 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 的原生 `/api/v1/models` 和 `/api/v1/models/load` 进行设备发现 + 自动加载，默认使用 `/v1/chat/completions` 进行推理。如果你希望由 LM Studio JIT 加载、TTL 和自动驱逐来管理模型生命周期，请设置 `models.providers.lmstudio.params.preload: false`。有关设置和故障排除，请参阅 [/providers/lmstudio](/zh-CN/providers/lmstudio)。

### Ollama

Ollama 作为内置提供商插件提供，并使用 Ollama 的原生 API：

- 提供商：`ollama`
- 身份验证：无需（本地服务器）
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

当你使用 `OLLAMA_API_KEY` 选择启用时，系统会在本地 `http://127.0.0.1:11434` 检测 Ollama，并且内置提供商插件会将 Ollama 直接添加到 `openclaw onboard` 和模型选择器中。有关新手引导、云端/本地模式和自定义配置，请参阅 [/providers/ollama](/zh-CN/providers/ollama)。

### vLLM

vLLM 作为用于本地/自托管 OpenAI 兼容服务器的内置提供商插件提供：

- 提供商：`vllm`
- 身份验证：可选（取决于你的服务器）
- 默认基础 URL：`http://127.0.0.1:8000/v1`

要在本地选择启用自动发现（如果服务器不强制身份验证，任意值均可）：

```bash
export VLLM_API_KEY="vllm-local"
```

然后设置模型（替换为 `/v1/models` 返回的其中一个 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

有关详情，请参阅 [/providers/vllm](/zh-CN/providers/vllm)。

### SGLang

SGLang 作为用于高速自托管 OpenAI 兼容服务器的内置提供商插件提供：

- 提供商：`sglang`
- 身份验证：可选（取决于你的服务器）
- 默认基础 URL：`http://127.0.0.1:30000/v1`

要在本地选择启用自动发现（如果服务器不强制身份验证，任意值均可）：

```bash
export SGLANG_API_KEY="sglang-local"
```

然后设置模型（替换为 `/v1/models` 返回的其中一个 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

有关详情，请参阅 [/providers/sglang](/zh-CN/providers/sglang)。

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
    对于自定义提供商，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 均为可选字段。省略时，OpenClaw 使用以下默认值：

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    建议：设置与你的代理/模型限制相符的明确值。

  </Accordion>
  <Accordion title="代理路由整形规则">
    - 对于非原生端点上的 `api: "openai-completions"`（即任意非空 `baseUrl`，且其主机不是 `api.openai.com`），OpenClaw 会强制设置 `compat.supportsDeveloperRole: false`，以避免提供商因不支持 `developer` 角色而返回 400 错误。
    - 代理式 OpenAI 兼容路由也会跳过仅适用于原生 OpenAI 的请求整形：不发送 `service_tier`、Responses 的 `store`、Completions 的 `store`、提示词缓存提示、OpenAI 推理兼容载荷整形以及隐藏的 OpenClaw 归属标头。
    - 对于需要供应商特定字段的 OpenAI 兼容 Completions 代理，请设置 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`），将额外 JSON 合并到出站请求正文中。
    - 对于 vLLM 聊天模板控制，请设置 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。当会话思考级别关闭时，内置 vLLM 插件会自动为 `vllm/nemotron-3-*` 发送 `enable_thinking: false` 和 `force_nonempty_content: true`。
    - 对于速度较慢的本地模型或远程 LAN/tailnet 主机，请设置 `models.providers.<id>.timeoutSeconds`。这会延长提供商模型 HTTP 请求的处理时间，包括连接、标头、正文流式传输以及受保护 fetch 的总中止时限，但不会增加整个智能体运行时的超时时间。如果 `agents.defaults.timeoutSeconds` 或特定运行的超时时间更短，也需要提高该上限；提供商超时无法延长整个运行。
    - 模型提供商 HTTP 调用仅针对所配置的提供商 `baseUrl` 主机名，允许使用 Surge、Clash 和 sing-box 在 `198.18.0.0/15` 和 `fc00::/7` 范围内返回的 fake-IP DNS 结果。对于受保护的模型请求，自定义/本地提供商端点还会信任所配置的精确 `scheme://host:port` 来源，包括 loopback、LAN 和 tailnet 主机。这不是新的配置选项；你配置的 `baseUrl` 仅针对该来源扩展请求策略。fake-IP 主机名许可与精确来源信任是相互独立的机制。其他私有地址、loopback、链路本地地址、元数据目标以及不同端口仍需要显式选择启用 `models.providers.<id>.request.allowPrivateNetwork: true`。设置 `models.providers.<id>.request.allowPrivateNetwork: false` 可选择退出精确来源信任。
    - 如果 `baseUrl` 为空或被省略，OpenClaw 会保留默认的 OpenAI 行为（解析为 `api.openai.com`）。
    - 为确保安全，在非原生 `openai-completions` 端点上，显式设置的 `compat.supportsDeveloperRole: true` 仍会被覆盖。
    - 对于非直连端点上的 `api: "anthropic-messages"`（即除规范 `anthropic` 之外的任何提供商，或主机并非公共 `api.anthropic.com` 端点的自定义 `models.providers.anthropic.baseUrl`），OpenClaw 会抑制隐式 Anthropic beta 标头，例如 `claude-code-20250219`、`interleaved-thinking-2025-05-14` 和 OAuth 标记，从而避免自定义 Anthropic 兼容代理因不支持的 beta 标志而拒绝请求。如果你的代理需要特定 beta 功能，请显式设置 `models.providers.<id>.headers["anthropic-beta"]`。

  </Accordion>
</AccordionGroup>

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另请参阅：[配置](/zh-CN/gateway/configuration)，了解完整配置示例。

## 相关内容

- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) - 模型配置键
- [模型故障转移](/zh-CN/concepts/model-failover) - 回退链和重试行为
- [Models](/zh-CN/concepts/models) - 模型配置和别名
- [提供商](/zh-CN/providers) - 各提供商的设置指南
