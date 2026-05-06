---
read_when:
    - 你需要一份按提供商划分的模型设置参考
    - 你想要模型提供商的配置示例或 CLI 新手引导命令
sidebarTitle: Model providers
summary: 模型提供商概览，包含示例配置 + CLI 流程
title: 模型提供商
x-i18n:
    generated_at: "2026-05-06T08:42:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM/模型提供商的参考（不是 WhatsApp/Telegram 这样的聊天渠道）。模型选择规则见 [Models](/zh-CN/concepts/models)。

## 快速规则

<AccordionGroup>
  <Accordion title="模型引用和 CLI 辅助命令">
    - 模型引用使用 `provider/model`（示例：`opencode/claude-opus-4-6`）。
    - 设置后，`agents.defaults.models` 会作为允许列表。
    - CLI 辅助命令：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` 设置提供商级默认值；`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` 会按模型覆盖它们。
    - 回退规则、冷却探测和会话覆盖持久化：[模型故障转移](/zh-CN/concepts/model-failover)。

  </Accordion>
  <Accordion title="添加提供商凭证不会更改你的主模型">
    添加或重新认证提供商时，`openclaw configure` 会保留现有的 `agents.defaults.model.primary`。提供商插件仍可能在其认证配置补丁中返回推荐的默认模型，但当主模型已存在时，configure 会将其视为“使此模型可用”，而不是“替换当前主模型”。

    要有意切换默认模型，请使用 `openclaw models set <provider/model>` 或 `openclaw models auth login --provider <id> --set-default`。

  </Accordion>
  <Accordion title="OpenAI provider/运行时拆分">
    OpenAI 系列路由按前缀区分：

    - `openai/<model>` 加上 `agents.defaults.agentRuntime.id: "codex"` 使用原生 Codex 应用服务器 harness。这是常见的 ChatGPT/Codex 订阅设置。
    - `openai-codex/<model>` 在 PI 中使用 Codex OAuth。
    - 没有 Codex 运行时覆盖的 `openai/<model>` 会在 PI 中使用直接的 OpenAI API 密钥提供商。

    见 [OpenAI](/zh-CN/providers/openai) 和 [Codex harness](/zh-CN/plugins/codex-harness)。如果提供商/运行时拆分让人困惑，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

    插件自动启用遵循同一边界：`openai-codex/<model>` 属于 OpenAI 插件，而 Codex 插件由 `agentRuntime.id: "codex"` 或旧版 `codex/<model>` 引用启用。

    设置 `agentRuntime.id: "codex"` 时，可以通过原生 Codex 应用服务器 harness 使用 GPT-5.5；在 PI 中，Codex OAuth 使用 `openai-codex/gpt-5.5`；当你的账户公开它时，直接 API 密钥流量在 PI 中使用 `openai/gpt-5.5`。

  </Accordion>
  <Accordion title="CLI 运行时">
    CLI 运行时使用相同的拆分：选择规范模型引用，例如 `anthropic/claude-*`、`google/gemini-*` 或 `openai/gpt-*`，然后当你需要本地 CLI 后端时，将 `agents.defaults.agentRuntime.id` 设置为 `claude-cli`、`google-gemini-cli` 或 `codex-cli`。

    旧版 `claude-cli/*`、`google-gemini-cli/*` 和 `codex-cli/*` 引用会迁移回规范提供商引用，并单独记录运行时。

  </Accordion>
</AccordionGroup>

## 插件拥有的提供商行为

大多数提供商特定逻辑位于提供商插件（`registerProvider(...)`）中，而 OpenClaw 保留通用推理循环。插件拥有新手引导、模型目录、认证环境变量映射、传输/配置规范化、工具 schema 清理、故障转移分类、OAuth 刷新、用量报告、思考/推理配置文件等。

提供商 SDK 钩子和内置插件示例的完整列表位于 [Provider plugins](/zh-CN/plugins/sdk-provider-plugins)。需要完全自定义请求执行器的提供商属于单独且更深层的扩展表面。

<Note>
提供商拥有的 runner 行为位于显式提供商钩子上，例如重放策略、工具 schema 规范化、流包装以及传输/请求辅助工具。旧版 `ProviderPlugin.capabilities` 静态包仅用于兼容性，共享 runner 逻辑不再读取它。
</Note>

## API 密钥轮换

<AccordionGroup>
  <Accordion title="密钥来源和优先级">
    通过以下方式配置多个密钥：

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个实时覆盖，最高优先级）
    - `<PROVIDER>_API_KEYS`（逗号或分号列表）
    - `<PROVIDER>_API_KEY`（主密钥）
    - `<PROVIDER>_API_KEY_*`（编号列表，例如 `<PROVIDER>_API_KEY_1`）

    对于 Google 提供商，`GOOGLE_API_KEY` 也会作为回退包含在内。密钥选择顺序会保留优先级并去重值。

  </Accordion>
  <Accordion title="轮换何时触发">
    - 请求仅在限速响应时使用下一个密钥重试（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 或周期性用量限制消息）。
    - 非限速失败会立即失败；不会尝试密钥轮换。
    - 当所有候选密钥都失败时，将返回最后一次尝试的最终错误。

  </Accordion>
</AccordionGroup>

## 内置提供商（pi-ai 目录）

OpenClaw 随附 pi-ai 目录。这些提供商**不**需要 `models.providers` 配置；只需设置认证并选择模型。

### OpenAI

- 提供商：`openai`
- 认证：`OPENAI_API_KEY`
- 可选轮换：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，以及 `OPENCLAW_LIVE_OPENAI_KEY`（单个覆盖）
- 示例模型：`openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 如果某个特定安装或 API 密钥表现不同，请用 `openclaw models list --provider openai` 验证账户/模型可用性。
- CLI：`openclaw onboard --auth-choice openai-api-key`
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 通过 `agents.defaults.models["openai/<model>"].params.transport` 按模型覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- OpenAI Responses WebSocket 预热默认通过 `params.openaiWsWarmup` 启用（`true`/`false`）
- 可以通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用 OpenAI 优先级处理
- `/fast` 和 `params.fastMode` 会将直接 `openai/*` Responses 请求映射到 `api.openai.com` 上的 `service_tier=priority`
- 当你想要显式层级而不是共享的 `/fast` 开关时，请使用 `params.serviceTier`
- 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）仅适用于发往 `api.openai.com` 的原生 OpenAI 流量，不适用于通用 OpenAI 兼容代理
- 原生 OpenAI 路由还会保留 Responses `store`、提示缓存提示和 OpenAI 推理兼容载荷塑形；代理路由不会
- `openai/gpt-5.3-codex-spark` 在 OpenClaw 中被有意抑制，因为实时 OpenAI API 请求会拒绝它，且当前 Codex 目录未公开它

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
- 直接公开 Anthropic 请求支持共享的 `/fast` 开关和 `params.fastMode`，包括发送到 `api.anthropic.com` 的 API 密钥和 OAuth 认证流量；OpenClaw 会将其映射到 Anthropic `service_tier`（`auto` 与 `standard_only`）
- 首选 Claude CLI 配置会保留规范模型引用，并单独选择 CLI
  后端：`anthropic/claude-opus-4-7` 搭配
  `agents.defaults.agentRuntime.id: "claude-cli"`。旧版
  `claude-cli/claude-opus-4-7` 引用仍可用于兼容性。

<Note>
Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法已再次被允许，因此除非 Anthropic 发布新策略，OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为此集成的受认可方式。Anthropic setup-token 仍可作为受支持的 OpenClaw 令牌路径使用，但现在 OpenClaw 在可用时优先使用 Claude CLI 复用和 `claude -p`。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- 提供商：`openai-codex`
- 认证：OAuth（ChatGPT）
- PI 模型引用：`openai-codex/gpt-5.5`
- 原生 Codex 应用服务器 harness 引用：`openai/gpt-5.5`，搭配 `agents.defaults.agentRuntime.id: "codex"`
- 原生 Codex 应用服务器 harness 文档：[Codex harness](/zh-CN/plugins/codex-harness)
- 旧版模型引用：`codex/gpt-*`
- 插件边界：`openai-codex/*` 加载 OpenAI 插件；原生 Codex 应用服务器插件仅由 Codex harness 运行时或旧版 `codex/*` 引用选择。
- CLI：`openclaw onboard --auth-choice openai-codex` 或 `openclaw models auth login --provider openai-codex`
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 通过 `agents.defaults.models["openai-codex/<model>"].params.transport` 按 PI 模型覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- `params.serviceTier` 也会在原生 Codex Responses 请求（`chatgpt.com/backend-api`）上转发
- 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）仅附加到发往 `chatgpt.com/backend-api` 的原生 Codex 流量，不适用于通用 OpenAI 兼容代理
- 与直接 `openai/*` 共享相同的 `/fast` 开关和 `params.fastMode` 配置；OpenClaw 会将其映射到 `service_tier=priority`
- `openai-codex/gpt-5.5` 使用 Codex 目录原生 `contextWindow = 400000` 和默认运行时 `contextTokens = 272000`；使用 `models.providers.openai-codex.models[].contextTokens` 覆盖运行时上限
- 策略说明：OpenAI Codex OAuth 明确支持 OpenClaw 这类外部工具/工作流。
- 对于常见的订阅加原生 Codex 运行时路线，请使用 `openai-codex` 认证登录，但配置 `openai/gpt-5.5` 加上 `agents.defaults.agentRuntime.id: "codex"`。
- 仅当你希望通过 PI 使用 Codex OAuth/订阅路线时，才使用 `openai-codex/gpt-5.5`；当你的 API 密钥设置和本地目录公开公共 API 路线时，使用不带 Codex 运行时覆盖的 `openai/gpt-5.5`。
- 较旧的 `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*` 和 `openai-codex/gpt-5.3*` 引用会被抑制，因为 ChatGPT/Codex OAuth 账户会拒绝它们；请改用 `openai-codex/gpt-5.5` 或原生 Codex 运行时路线。

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
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

### 其他订阅式托管选项

<CardGroup cols={3}>
  <Card title="GLM 模型" href="/zh-CN/providers/glm">
    Z.AI Coding Plan 或通用 API 端点。
  </Card>
  <Card title="MiniMax" href="/zh-CN/providers/minimax">
    MiniMax Coding Plan OAuth 或 API 密钥访问。
  </Card>
  <Card title="Qwen Cloud" href="/zh-CN/providers/qwen">
    Qwen Cloud 提供商表面，以及 Alibaba DashScope 和 Coding Plan 端点映射。
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

### Google Gemini（API 密钥）

- 提供商：`google`
- 凭证：`GEMINI_API_KEY`
- 可选轮换：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 后备，以及 `OPENCLAW_LIVE_GEMINI_KEY`（单一覆盖）
- 示例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 兼容性：使用 `google/gemini-3.1-flash-preview` 的旧版 OpenClaw 配置会规范化为 `google/gemini-3-flash-preview`
- 别名：`google/gemini-3.1-pro` 会被接受，并规范化为 Google 实时 Gemini API ID：`google/gemini-3.1-pro-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`
- 思考：`/think adaptive` 使用 Google 动态思考。Gemini 3/3.1 会省略固定的 `thinkingLevel`；Gemini 2.5 会发送 `thinkingBudget: -1`。
- 直接运行 Gemini 还接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或旧版 `cached_content`），用于转发提供商原生的 `cachedContents/...` 句柄；Gemini 缓存命中会显示为 OpenClaw `cacheRead`

### Google Vertex 和 Gemini CLI

- 提供商：`google-vertex`、`google-gemini-cli`
- 凭证：Vertex 使用 gcloud ADC；Gemini CLI 使用它的 OAuth 流程

<Warning>
OpenClaw 中的 Gemini CLI OAuth 是非官方集成。一些用户报告称，使用第三方客户端后遇到 Google 账号限制。如果你选择继续，请查看 Google 条款，并使用非关键账号。
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

    默认模型：`google-gemini-cli/gemini-3-flash-preview`。你**不**需要把客户端 ID 或密钥粘贴到 `openclaw.json`。CLI 登录流程会把令牌存储在 Gateway 网关主机上的凭证配置中。

  </Step>
  <Step title="设置项目（如需要）">
    如果登录后请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini CLI JSON 回复会从 `response` 解析；用量会回退到 `stats`，其中 `stats.cached` 会规范化为 OpenClaw `cacheRead`。

### Z.AI（GLM）

- 提供商：`zai`
- 凭证：`ZAI_API_KEY`
- 示例模型：`zai/glm-5.1`
- CLI：`openclaw onboard --auth-choice zai-api-key`
  - 别名：`z.ai/*` 和 `z-ai/*` 会规范化为 `zai/*`
  - `zai-api-key` 会自动检测匹配的 Z.AI 端点；`zai-coding-global`、`zai-coding-cn`、`zai-global` 和 `zai-cn` 会强制使用特定表面

### Vercel AI Gateway 网关

- 提供商：`vercel-ai-gateway`
- 凭证：`AI_GATEWAY_API_KEY`
- 示例模型：`vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway 网关

- 提供商：`kilocode`
- 凭证：`KILOCODE_API_KEY`
- 示例模型：`kilocode/kilo/auto`
- CLI：`openclaw onboard --auth-choice kilocode-api-key`
- 基础 URL：`https://api.kilo.ai/api/gateway/`
- 静态后备目录提供 `kilocode/kilo/auto`；实时 `https://api.kilo.ai/api/gateway/models` 发现可以进一步扩展运行时目录。
- `kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway 网关拥有，不在 OpenClaw 中硬编码。

设置详情请参阅 [/providers/kilocode](/zh-CN/providers/kilocode)。

### 其他内置提供商插件

| 提供商                  | 标识                             | 凭证环境变量                                                 | 示例模型                                      |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway 网关 | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway 网关       | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
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
| Vercel AI Gateway 网关  | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine（豆包）  | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### 值得了解的特殊之处

<AccordionGroup>
  <Accordion title="OpenRouter">
    仅在经过验证的 `openrouter.ai` 路由上应用其应用归因标头和 Anthropic `cache_control` 标记。DeepSeek、Moonshot 和 ZAI 引用符合 OpenRouter 管理的提示缓存的 cache-TTL 条件，但不会收到 Anthropic 缓存标记。作为代理式 OpenAI 兼容路径，它会跳过仅适用于原生 OpenAI 的调整（`serviceTier`、Responses `store`、提示缓存提示、OpenAI 推理兼容性）。由 Gemini 支持的引用仅保留代理 Gemini 思维签名清理。
  </Accordion>
  <Accordion title="Kilo Gateway">
    由 Gemini 支持的引用遵循相同的代理 Gemini 清理路径；`kilocode/kilo/auto` 和其他不支持代理推理的引用会跳过代理推理注入。
  </Accordion>
  <Accordion title="MiniMax">
    API key 新手引导会写入显式的纯文本 M2.7 聊天模型定义；图像理解仍由插件拥有的 `MiniMax-VL-01` 媒体提供商处理。
  </Accordion>
  <Accordion title="NVIDIA">
    模型 ID 使用 `nvidia/<vendor>/<model>` 命名空间（例如 `nvidia/nvidia/nemotron-...` 与 `nvidia/moonshotai/kimi-k2.5` 并列）；选择器会保留字面量 `<provider>/<model-id>` 组合，而发送到 API 的规范键仍保持单一前缀。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路径。`grok-4.3` 是内置的默认聊天模型。`/fast` 或 `params.fastMode: true` 会将 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 重写为其 `*-fast` 变体。`tool_stream` 默认开启；可通过 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 禁用。
  </Accordion>
  <Accordion title="Cerebras">
    作为内置的 `cerebras` 提供商插件交付。GLM 使用 `zai-glm-4.7`；OpenAI 兼容的 base URL 是 `https://api.cerebras.ai/v1`。
  </Accordion>
</AccordionGroup>

## 通过 `models.providers` 配置提供商（自定义/base URL）

使用 `models.providers`（或 `models.json`）添加**自定义**提供商或 OpenAI/Anthropic 兼容代理。

下面许多内置提供商插件已经发布默认目录。仅当你想覆盖默认 base URL、标头或模型列表时，才使用显式的 `models.providers.<id>` 条目。

Gateway 网关模型能力检查也会读取显式的 `models.providers.<id>.models[]` 元数据。如果自定义或代理模型接受图像，请在该模型上设置 `input: ["text", "image"]`，这样 WebChat 和节点来源的附件路径会把图像作为原生模型输入传递，而不是作为纯文本媒体引用。

### Moonshot AI（Kimi）

Moonshot 作为内置提供商插件交付。默认使用内置提供商；仅当你需要覆盖 base URL 或模型元数据时，才添加显式的 `models.providers.moonshot` 条目：

- 提供商：`moonshot`
- 凭证：`MOONSHOT_API_KEY`
- 示例模型：`moonshot/kimi-k2.6`
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

### Kimi 编码

Kimi Coding 使用 Moonshot AI 的 Anthropic 兼容端点：

- 提供商：`kimi`
- 凭证：`KIMI_API_KEY`
- 示例模型：`kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

旧版 `kimi/k2p5` 仍作为兼容模型 ID 被接受。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）提供对 Doubao 和中国其他模型的访问。

- 提供商：`volcengine`（编码：`volcengine-plan`）
- 认证：`VOLCANO_ENGINE_API_KEY`
- 示例模型：`volcengine-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

新手引导默认使用编码表面，但通用 `volcengine/*` 目录也会同时注册。

在新手引导/配置模型选择器中，Volcengine 认证选项会优先显示 `volcengine/*` 和 `volcengine-plan/*` 行。如果这些模型尚未加载，OpenClaw 会回退到未过滤的目录，而不是显示空的提供商范围选择器。

<Tabs>
  <Tab title="标准模型">
    - `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127`（Kimi K2.5）
    - `volcengine/glm-4-7-251222`（GLM 4.7）
    - `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）

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
- 认证：`BYTEPLUS_API_KEY`
- 示例模型：`byteplus-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

新手引导默认使用编码表面，但通用 `byteplus/*` 目录也会同时注册。

在新手引导/配置模型选择器中，BytePlus 认证选项会优先显示 `byteplus/*` 和 `byteplus-plan/*` 行。如果这些模型尚未加载，OpenClaw 会回退到未过滤的目录，而不是显示空的提供商范围选择器。

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
- 认证：`SYNTHETIC_API_KEY`
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
- 认证：`MINIMAX_API_KEY` 用于 `minimax`；`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY` 用于 `minimax-portal`

请参阅 [/providers/minimax](/zh-CN/providers/minimax) 了解设置详情、模型选项和配置片段。

<Note>
在 MiniMax 的 Anthropic 兼容流式传输路径上，OpenClaw 默认禁用 thinking，除非你显式设置它，并且 `/fast on` 会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
</Note>

插件拥有的能力拆分：

- 文本/聊天默认保留在 `minimax/MiniMax-M2.7`
- 图像生成是 `minimax/image-01` 或 `minimax-portal/image-01`
- 图像理解是在两个 MiniMax 认证路径上都由插件拥有的 `MiniMax-VL-01`
- Web 搜索保留在提供商 ID `minimax`

### LM Studio

LM Studio 作为内置提供商插件发布，使用原生 API：

- 提供商：`lmstudio`
- 认证：`LM_API_TOKEN`
- 默认推理基础 URL：`http://localhost:1234/v1`

然后设置模型（替换为 `http://localhost:1234/api/v1/models` 返回的某个 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 的原生 `/api/v1/models` 和 `/api/v1/models/load` 进行设备发现 + 自动加载，并默认使用 `/v1/chat/completions` 进行推理。如果你希望 LM Studio JIT 加载、TTL 和自动驱逐来拥有模型生命周期，请设置 `models.providers.lmstudio.params.preload: false`。请参阅 [/providers/lmstudio](/zh-CN/providers/lmstudio) 了解设置和故障排除。

### Ollama

Ollama 作为内置提供商插件发布，并使用 Ollama 的原生 API：

- 提供商：`ollama`
- 认证：无需（本地服务器）
- 示例模型：`ollama/llama3.3`
- 安装：[https://ollama.com/download](https://ollama.com/download)

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

当你通过 `OLLAMA_API_KEY` 选择启用时，Ollama 会在本地 `http://127.0.0.1:11434` 被检测到，并且内置提供商插件会将 Ollama 直接添加到 `openclaw onboard` 和模型选择器。请参阅 [/providers/ollama](/zh-CN/providers/ollama) 了解新手引导、云端/本地模式和自定义配置。

### vLLM

vLLM 作为本地/自托管 OpenAI 兼容服务器的内置提供商插件发布：

- 提供商：`vllm`
- 认证：可选（取决于你的服务器）
- 默认基础 URL：`http://127.0.0.1:8000/v1`

要在本地选择启用自动设备发现（如果你的服务器不强制认证，任意值都可用）：

```bash
export VLLM_API_KEY="vllm-local"
```

然后设置模型（替换为 `/v1/models` 返回的某个 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

请参阅 [/providers/vllm](/zh-CN/providers/vllm) 了解详情。

### SGLang

SGLang 作为快速自托管 OpenAI 兼容服务器的内置提供商插件发布：

- 提供商：`sglang`
- 认证：可选（取决于你的服务器）
- 默认基础 URL：`http://127.0.0.1:30000/v1`

要在本地选择启用自动设备发现（如果你的服务器不强制认证，任意值都可用）：

```bash
export SGLANG_API_KEY="sglang-local"
```

然后设置模型（替换为 `/v1/models` 返回的某个 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

请参阅 [/providers/sglang](/zh-CN/providers/sglang) 了解详情。

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

    建议：设置与你的代理/模型限制匹配的显式值。

  </Accordion>
  <Accordion title="代理路由整形规则">
    - 对非原生端点上的 `api: "openai-completions"`（任何非空 `baseUrl`，且其主机不是 `api.openai.com`），OpenClaw 会强制 `compat.supportsDeveloperRole: false`，以避免提供商因不支持 `developer` 角色而返回 400 错误。
    - 代理式 OpenAI 兼容路由也会跳过仅原生 OpenAI 使用的请求整形：没有 `service_tier`，没有 Responses `store`，没有 Completions `store`，没有提示词缓存提示，没有 OpenAI reasoning 兼容载荷整形，也没有隐藏的 OpenClaw 归因标头。
    - 对于需要厂商特定字段的 OpenAI 兼容 Completions 代理，请设置 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`），以将额外 JSON 合并到出站请求体中。
    - 对于 vLLM 聊天模板控制，请设置 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。当会话 thinking 级别关闭时，内置 vLLM 插件会自动为 `vllm/nemotron-3-*` 发送 `enable_thinking: false` 和 `force_nonempty_content: true`。
    - 对于较慢的本地模型或远程 LAN/tailnet 主机，请设置 `models.providers.<id>.timeoutSeconds`。这会延长提供商模型 HTTP 请求处理时间，包括连接、标头、正文流式传输，以及整体受保护 fetch 中止时间，而不会增加整个智能体运行时超时。
    - 模型提供商 HTTP 调用仅允许为已配置提供商 `baseUrl` 主机名使用 `198.18.0.0/15` 和 `fc00::/7` 中的 Surge、Clash 和 sing-box fake-IP DNS 答案。其他私有、loopback、链路本地和元数据目标仍需要显式选择启用 `models.providers.<id>.request.allowPrivateNetwork: true`。
    - 如果 `baseUrl` 为空/省略，OpenClaw 会保留默认 OpenAI 行为（解析到 `api.openai.com`）。
    - 为安全起见，在非原生 `openai-completions` 端点上，显式的 `compat.supportsDeveloperRole: true` 仍会被覆盖。
    - 对非直连端点上的 `api: "anthropic-messages"`（除规范 `anthropic` 之外的任何提供商，或自定义 `models.providers.anthropic.baseUrl` 且其主机不是公共 `api.anthropic.com` 端点），OpenClaw 会抑制隐式 Anthropic beta 标头，例如 `claude-code-20250219`、`interleaved-thinking-2025-05-14` 和 OAuth 标记，以便自定义 Anthropic 兼容代理不会拒绝不支持的 beta 标志。如果你的代理需要特定 beta 功能，请显式设置 `models.providers.<id>.headers["anthropic-beta"]`。

  </Accordion>
</AccordionGroup>

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另请参阅：[配置](/zh-CN/gateway/configuration) 了解完整配置示例。

## 相关内容

- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) - 模型配置键
- [模型故障转移](/zh-CN/concepts/model-failover) - 回退链和重试行为
- [Models](/zh-CN/concepts/models) - 模型配置和别名
- [提供商](/zh-CN/providers) - 每个提供商的设置指南
