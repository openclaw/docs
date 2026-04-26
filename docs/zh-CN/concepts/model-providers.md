---
read_when:
    - 你需要一份按提供商划分的模型设置参考文档
    - 你想要模型提供商的示例配置或 CLI 新手引导命令
summary: 模型提供商概览，附示例配置 + CLI 流程
title: 模型提供商
x-i18n:
    generated_at: "2026-04-26T03:01:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75d0e89c35d46b0c3ecd4a180ca25bb1cdf45cee8dd09d73657517927e7bc220
    source_path: concepts/model-providers.md
    workflow: 15
---

**LLM/模型提供商** 参考文档（不是像 WhatsApp/Telegram 这样的聊天渠道）。关于模型选择规则，请参见 [Models](/zh-CN/concepts/models)。

## 快速规则

- 模型引用使用 `provider/model`（示例：`opencode/claude-opus-4-6`）。
- 设置后，`agents.defaults.models` 会充当允许列表。
- CLI 助手：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- `models.providers.*.models[].contextWindow` 是原生模型元数据；`contextTokens` 是运行时生效的上限。
- 回退规则、冷却探测和会话覆盖持久化： [模型故障切换](/zh-CN/concepts/model-failover)。
- OpenAI 系列路由按前缀区分：`openai/<model>` 在 PI 中使用直接的 OpenAI API 密钥提供商，`openai-codex/<model>` 在 PI 中使用 Codex OAuth，而 `openai/<model>` 加上 `agents.defaults.embeddedHarness.runtime: "codex"` 则使用原生 Codex app-server harness。参见 [OpenAI](/zh-CN/providers/openai) 和 [Codex harness](/zh-CN/plugins/codex-harness)。如果提供商/运行时的划分让你感到困惑，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- 插件自动启用也遵循同样的边界：`openai-codex/<model>` 属于 OpenAI 插件，而 Codex 插件则由 `embeddedHarness.runtime: "codex"` 或旧版 `codex/<model>` 引用启用。
- CLI 运行时使用相同的划分：选择规范模型引用，例如 `anthropic/claude-*`、`google/gemini-*` 或 `openai/gpt-*`，然后在你想使用本地 CLI 后端时，将 `agents.defaults.embeddedHarness.runtime` 设置为 `claude-cli`、`google-gemini-cli` 或 `codex-cli`。旧版 `claude-cli/*`、`google-gemini-cli/*` 和 `codex-cli/*` 引用会迁移回规范提供商引用，并将运行时单独记录。
- GPT-5.5 可通过 `openai/gpt-5.5` 用于直接 API 密钥流量，在 PI 中通过 `openai-codex/gpt-5.5` 用于 Codex OAuth，以及在设置 `embeddedHarness.runtime: "codex"` 时使用原生 Codex app-server harness。

## 插件拥有的提供商行为

大多数提供商特定逻辑都位于提供商插件（`registerProvider(...)`）中，而 OpenClaw 保留通用推理循环。插件负责新手引导、模型目录、认证环境变量映射、传输/配置规范化、工具 schema 清理、故障切换分类、OAuth 刷新、用量报告、thinking/reasoning 配置等。

提供商 SDK 钩子的完整列表和内置插件示例位于 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。如果某个提供商需要完全自定义的请求执行器，那将属于另一种更深层的扩展接口。

<Note>
提供商运行时 `capabilities` 是共享的运行器元数据（提供商家族、转录/工具链特殊行为、传输/缓存提示）。它不同于[公共能力模型](/zh-CN/plugins/architecture#public-capability-model)，后者描述的是插件注册了什么（文本推理、语音等）。
</Note>

## API 密钥轮换

- 支持为选定提供商进行通用提供商轮换。
- 通过以下方式配置多个密钥：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个实时覆盖，最高优先级）
  - `<PROVIDER>_API_KEYS`（逗号或分号分隔列表）
  - `<PROVIDER>_API_KEY`（主密钥）
  - `<PROVIDER>_API_KEY_*`（编号列表，例如 `<PROVIDER>_API_KEY_1`）
- 对于 Google 提供商，`GOOGLE_API_KEY` 也会作为回退包含在内。
- 密钥选择顺序会保留优先级并去重。
- 仅当响应为速率限制时，请求才会使用下一个密钥重试（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`，或周期性用量限制消息）。
- 非速率限制失败会立即失败；不会尝试密钥轮换。
- 当所有候选密钥都失败时，返回最后一次尝试的最终错误。

## 内置提供商（pi-ai 目录）

OpenClaw 内置 pi-ai 目录。这些提供商**不需要** `models.providers` 配置；只需设置认证信息并选择一个模型。

### OpenAI

- 提供商：`openai`
- 认证：`OPENAI_API_KEY`
- 可选轮换：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，以及 `OPENCLAW_LIVE_OPENAI_KEY`（单个覆盖）
- 示例模型：`openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 如果特定安装或 API 密钥表现不同，可使用 `openclaw models list --provider openai` 验证账户/模型可用性。
- CLI：`openclaw onboard --auth-choice openai-api-key`
- 默认传输是 `auto`（优先 WebSocket，回退 SSE）
- 可通过 `agents.defaults.models["openai/<model>"].params.transport` 为每个模型覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- OpenAI Responses WebSocket 预热默认通过 `params.openaiWsWarmup` 启用（`true`/`false`）
- OpenAI 优先级处理可通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用
- `/fast` 和 `params.fastMode` 会将直接 `openai/*` Responses 请求映射为发送到 `api.openai.com` 的 `service_tier=priority`
- 当你想使用显式 tier，而不是共享的 `/fast` 切换时，请使用 `params.serviceTier`
- 隐藏的 OpenClaw 归属头（`originator`、`version`、`User-Agent`）仅适用于发往 `api.openai.com` 的原生 OpenAI 流量，不适用于通用 OpenAI 兼容代理
- 原生 OpenAI 路由还会保留 Responses `store`、提示缓存提示以及 OpenAI reasoning 兼容载荷整形；代理路由则不会
- `openai/gpt-5.3-codex-spark` 在 OpenClaw 中被有意屏蔽，因为实时 OpenAI API 请求会拒绝它，而当前 Codex 目录也未暴露它

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
- 直接公共 Anthropic 请求支持共享的 `/fast` 切换和 `params.fastMode`，包括发送到 `api.anthropic.com` 的 API 密钥和 OAuth 认证流量；OpenClaw 会将其映射为 Anthropic `service_tier`（`auto` 或 `standard_only`）
- Anthropic 说明：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此除非 Anthropic 发布新政策，否则 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为该集成允许的方式。
- Anthropic setup-token 仍然作为受支持的 OpenClaw token 路径可用，但 OpenClaw 现在会在可用时优先使用 Claude CLI 复用和 `claude -p`。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- 提供商：`openai-codex`
- 认证：OAuth（ChatGPT）
- PI 模型引用：`openai-codex/gpt-5.5`
- 原生 Codex app-server harness 引用：`openai/gpt-5.5`，并设置 `agents.defaults.embeddedHarness.runtime: "codex"`
- 原生 Codex app-server harness 文档： [Codex harness](/zh-CN/plugins/codex-harness)
- 旧版模型引用：`codex/gpt-*`
- 插件边界：`openai-codex/*` 会加载 OpenAI 插件；原生 Codex app-server 插件仅通过 Codex harness 运行时或旧版 `codex/*` 引用选择。
- CLI：`openclaw onboard --auth-choice openai-codex` 或 `openclaw models auth login --provider openai-codex`
- 默认传输是 `auto`（优先 WebSocket，回退 SSE）
- 可通过 `agents.defaults.models["openai-codex/<model>"].params.transport` 为每个 PI 模型覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- `params.serviceTier` 也会转发到原生 Codex Responses 请求（`chatgpt.com/backend-api`）
- 隐藏的 OpenClaw 归属头（`originator`、`version`、`User-Agent`）仅附加在发往 `chatgpt.com/backend-api` 的原生 Codex 流量上，不适用于通用 OpenAI 兼容代理
- 与直接 `openai/*` 共享相同的 `/fast` 切换和 `params.fastMode` 配置；OpenClaw 会将其映射为 `service_tier=priority`
- `openai-codex/gpt-5.5` 使用 Codex 目录原生的 `contextWindow = 400000` 和默认运行时 `contextTokens = 272000`；可通过 `models.providers.openai-codex.models[].contextTokens` 覆盖运行时上限
- 策略说明：OpenAI Codex OAuth 明确支持像 OpenClaw 这样的外部工具/工作流。
- 当你想使用 Codex OAuth/订阅路线时，使用 `openai-codex/gpt-5.5`；当你的 API 密钥设置和本地目录暴露公共 API 路线时，使用 `openai/gpt-5.5`。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
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

- [Qwen Cloud](/zh-CN/providers/qwen)：Qwen Cloud 提供商接口，以及 Alibaba DashScope 和 Coding Plan 端点映射
- [MiniMax](/zh-CN/providers/minimax)：MiniMax Coding Plan OAuth 或 API 密钥访问
- [GLM models](/zh-CN/providers/glm)：Z.AI Coding Plan 或通用 API 端点

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
- 认证：`GEMINI_API_KEY`
- 可选轮换：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 回退，以及 `OPENCLAW_LIVE_GEMINI_KEY`（单个覆盖）
- 示例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 兼容性：使用 `google/gemini-3.1-flash-preview` 的旧版 OpenClaw 配置会被规范化为 `google/gemini-3-flash-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`
- Thinking：`/think adaptive` 使用 Google 动态 thinking。Gemini 3/3.1 不包含固定的 `thinkingLevel`；Gemini 2.5 会发送 `thinkingBudget: -1`。
- 直接 Gemini 运行也接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或旧版 `cached_content`）以转发提供商原生的 `cachedContents/...` 句柄；Gemini 缓存命中会显示为 OpenClaw `cacheRead`

### Google Vertex 和 Gemini CLI

- 提供商：`google-vertex`、`google-gemini-cli`
- 认证：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程
- 注意：OpenClaw 中的 Gemini CLI OAuth 是非官方集成。一些用户报告在使用第三方客户端后遇到 Google 账号限制。如果你选择继续，请查看 Google 条款并使用非关键账号。
- Gemini CLI OAuth 作为内置 `google` 插件的一部分提供。
  - 先安装 Gemini CLI：
    - `brew install gemini-cli`
    - 或 `npm install -g @google/gemini-cli`
  - 启用：`openclaw plugins enable google`
  - 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
  - 默认模型：`google-gemini-cli/gemini-3-flash-preview`
  - 注意：你**不需要**将 client id 或 secret 粘贴到 `openclaw.json` 中。CLI 登录流程会将 token 存储在 Gateway 网关主机上的认证配置文件中。
  - 如果登录后请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  - Gemini CLI JSON 回复从 `response` 解析；用量会回退到 `stats`，其中 `stats.cached` 会被规范化为 OpenClaw `cacheRead`。

### Z.AI（GLM）

- 提供商：`zai`
- 认证：`ZAI_API_KEY`
- 示例模型：`zai/glm-5.1`
- CLI：`openclaw onboard --auth-choice zai-api-key`
  - 别名：`z.ai/*` 和 `z-ai/*` 会规范化为 `zai/*`
  - `zai-api-key` 会自动检测匹配的 Z.AI 端点；`zai-coding-global`、`zai-coding-cn`、`zai-global` 和 `zai-cn` 会强制使用特定接口

### Vercel AI Gateway

- 提供商：`vercel-ai-gateway`
- 认证：`AI_GATEWAY_API_KEY`
- 示例模型：`vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- 提供商：`kilocode`
- 认证：`KILOCODE_API_KEY`
- 示例模型：`kilocode/kilo/auto`
- CLI：`openclaw onboard --auth-choice kilocode-api-key`
- Base URL：`https://api.kilo.ai/api/gateway/`
- 静态回退目录内置 `kilocode/kilo/auto`；实时的 `https://api.kilo.ai/api/gateway/models` 发现机制可以进一步扩展运行时目录。
- `kilocode/kilo/auto` 背后的精确上游路由由 Kilo Gateway 网关负责，而不是在 OpenClaw 中硬编码。

设置详情请参见 [/providers/kilocode](/zh-CN/providers/kilocode)。

### 其他内置提供商插件

| 提供商 | Id | 认证环境变量 | 示例模型 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus（国际版） | `byteplus` / `byteplus-plan` | `BYTEPLUS_API_KEY` | `byteplus-plan/ark-code-latest` |
| Cerebras | `cerebras` | `CEREBRAS_API_KEY` | `cerebras/zai-glm-4.7` |
| Cloudflare AI Gateway | `cloudflare-ai-gateway` | `CLOUDFLARE_AI_GATEWAY_API_KEY` | — |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` | `deepseek/deepseek-v4-flash` |
| GitHub Copilot | `github-copilot` | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | — |
| Groq | `groq` | `GROQ_API_KEY` | — |
| Hugging Face Inference | `huggingface` | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN` | `huggingface/deepseek-ai/DeepSeek-R1` |
| Kilo Gateway 网关 | `kilocode` | `KILOCODE_API_KEY` | `kilocode/kilo/auto` |
| Kimi Coding | `kimi` | `KIMI_API_KEY` 或 `KIMICODE_API_KEY` | `kimi/kimi-code` |
| MiniMax | `minimax` / `minimax-portal` | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN` | `minimax/MiniMax-M2.7` |
| Mistral | `mistral` | `MISTRAL_API_KEY` | `mistral/mistral-large-latest` |
| Moonshot AI | `moonshot` | `MOONSHOT_API_KEY` | `moonshot/kimi-k2.6` |
| NVIDIA | `nvidia` | `NVIDIA_API_KEY` | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | `openrouter/auto` |
| Qianfan | `qianfan` | `QIANFAN_API_KEY` | `qianfan/deepseek-v3.2` |
| Qwen Cloud | `qwen` | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus` |
| StepFun | `stepfun` / `stepfun-plan` | `STEPFUN_API_KEY` | `stepfun/step-3.5-flash` |
| Together | `together` | `TOGETHER_API_KEY` | `together/moonshotai/Kimi-K2.5` |
| Venice | `venice` | `VENICE_API_KEY` | — |
| Vercel AI Gateway | `vercel-ai-gateway` | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine（Doubao） | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY` | `volcengine-plan/ark-code-latest` |
| xAI | `xai` | `XAI_API_KEY` | `xai/grok-4` |
| Xiaomi | `xiaomi` | `XIAOMI_API_KEY` | `xiaomi/mimo-v2-flash` |

值得了解的一些特殊行为：

- **OpenRouter** 仅在已验证的 `openrouter.ai` 路由上应用其应用归属头和 Anthropic `cache_control` 标记。DeepSeek、Moonshot 和 ZAI 引用可用于 OpenRouter 管理的提示缓存的缓存 TTL，但不会接收 Anthropic 缓存标记。作为代理式的 OpenAI 兼容路径，它会跳过仅限原生 OpenAI 的整形逻辑（`serviceTier`、Responses `store`、提示缓存提示、OpenAI reasoning 兼容处理）。基于 Gemini 的引用仅保留代理 Gemini 的 thought-signature 清理。
- **Kilo Gateway** 基于 Gemini 的引用遵循相同的代理 Gemini 清理路径；`kilocode/kilo/auto` 和其他不支持代理 reasoning 的引用会跳过代理 reasoning 注入。
- **MiniMax** API 密钥新手引导会写入显式的纯文本 M2.7 聊天模型定义；图像理解仍保留在由插件拥有的 `MiniMax-VL-01` 媒体提供商上。
- **xAI** 使用 xAI Responses 路径。`/fast` 或 `params.fastMode: true` 会将 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 重写为对应的 `*-fast` 变体。`tool_stream` 默认开启；可通过 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 禁用。
- **Cerebras** GLM 模型使用 `zai-glm-4.7` / `zai-glm-4.6`；OpenAI 兼容 Base URL 是 `https://api.cerebras.ai/v1`。

## 通过 `models.providers` 的提供商（自定义/Base URL）

使用 `models.providers`（或 `models.json`）添加**自定义**提供商或 OpenAI/Anthropic 兼容代理。

下面许多内置提供商插件已经发布了默认目录。
仅当你想覆盖默认的 Base URL、headers 或模型列表时，才使用显式的 `models.providers.<id>` 条目。

### Moonshot AI（Kimi）

Moonshot 作为内置提供商插件提供。默认情况下使用内置提供商，只有在你需要覆盖 Base URL 或模型元数据时，才添加显式的 `models.providers.moonshot` 条目：

- 提供商：`moonshot`
- 认证：`MOONSHOT_API_KEY`
- 示例模型：`moonshot/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice moonshot-api-key` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 模型 Id：

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

### Kimi Coding

Kimi Coding 使用 Moonshot AI 的 Anthropic 兼容端点：

- 提供商：`kimi`
- 认证：`KIMI_API_KEY`
- 示例模型：`kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

旧版 `kimi/k2p5` 仍然作为兼容模型 id 被接受。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）在中国提供对 Doubao 和其他模型的访问。

- 提供商：`volcengine`（编码场景：`volcengine-plan`）
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

新手引导默认使用编码接口，但通用的 `volcengine/*` 目录会同时注册。

在新手引导/配置模型选择器中，Volcengine 认证选项会优先显示 `volcengine/*` 和 `volcengine-plan/*` 两类条目。如果这些模型尚未加载，OpenClaw 会回退到未过滤的目录，而不是显示一个空的按提供商范围过滤的选择器。

可用模型：

- `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127`（Kimi K2.5）
- `volcengine/glm-4-7-251222`（GLM 4.7）
- `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）

编码模型（`volcengine-plan`）：

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus（国际版）

BytePlus ARK 为国际用户提供与 Volcano Engine 相同模型的访问能力。

- 提供商：`byteplus`（编码场景：`byteplus-plan`）
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

新手引导默认使用编码接口，但通用的 `byteplus/*` 目录会同时注册。

在新手引导/配置模型选择器中，BytePlus（国际版）认证选项会优先显示 `byteplus/*` 和 `byteplus-plan/*` 两类条目。如果这些模型尚未加载，OpenClaw 会回退到未过滤的目录，而不是显示一个空的按提供商范围过滤的选择器。

可用模型：

- `byteplus/seed-1-8-251228`（Seed 1.8）
- `byteplus/kimi-k2-5-260127`（Kimi K2.5）
- `byteplus/glm-4-7-251222`（GLM 4.7）

编码模型（`byteplus-plan`）：

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

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

- MiniMax OAuth（Global）：`--auth-choice minimax-global-oauth`
- MiniMax OAuth（CN）：`--auth-choice minimax-cn-oauth`
- MiniMax API 密钥（Global）：`--auth-choice minimax-global-api`
- MiniMax API 密钥（CN）：`--auth-choice minimax-cn-api`
- 认证：`minimax` 使用 `MINIMAX_API_KEY`；`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`

设置详情、模型选项和配置片段请参见 [/providers/minimax](/zh-CN/providers/minimax)。

在 MiniMax 的 Anthropic 兼容流式传输路径上，OpenClaw 默认禁用 thinking，除非你显式设置它；`/fast on` 会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

插件拥有的能力划分：

- 文本/聊天默认保持为 `minimax/MiniMax-M2.7`
- 图像生成使用 `minimax/image-01` 或 `minimax-portal/image-01`
- 图像理解在两种 MiniMax 认证路径上都使用由插件拥有的 `MiniMax-VL-01`
- Web 搜索保持使用提供商 id `minimax`

### LM Studio

LM Studio 作为内置提供商插件提供，并使用原生 API：

- 提供商：`lmstudio`
- 认证：`LM_API_TOKEN`
- 默认推理 Base URL：`http://localhost:1234/v1`

然后设置一个模型（替换为 `http://localhost:1234/api/v1/models` 返回的某个 id）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 原生的 `/api/v1/models` 和 `/api/v1/models/load` 进行发现 + 自动加载，默认使用 `/v1/chat/completions` 进行推理。设置和故障排除请参见 [/providers/lmstudio](/zh-CN/providers/lmstudio)。

### Ollama

Ollama 作为内置提供商插件提供，并使用 Ollama 的原生 API：

- 提供商：`ollama`
- 认证：无需（本地服务器）
- 示例模型：`ollama/llama3.3`
- 安装： [https://ollama.com/download](https://ollama.com/download)

```bash
# 安装 Ollama，然后拉取一个模型：
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

当你通过 `OLLAMA_API_KEY` 选择启用时，系统会在本地 `http://127.0.0.1:11434` 检测 Ollama，内置提供商插件还会将 Ollama 直接添加到 `openclaw onboard` 和模型选择器中。有关新手引导、云端/本地模式和自定义配置，请参见 [/providers/ollama](/zh-CN/providers/ollama)。

### vLLM

vLLM 作为内置提供商插件提供，适用于本地/自托管的 OpenAI 兼容服务器：

- 提供商：`vllm`
- 认证：可选（取决于你的服务器）
- 默认 Base URL：`http://127.0.0.1:8000/v1`

要在本地选择启用自动发现（如果你的服务器不强制认证，任意值都可以）：

```bash
export VLLM_API_KEY="vllm-local"
```

然后设置一个模型（替换为 `/v1/models` 返回的某个 id）：

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

详情请参见 [/providers/vllm](/zh-CN/providers/vllm)。

### SGLang

SGLang 作为内置提供商插件提供，适用于高速自托管的 OpenAI 兼容服务器：

- 提供商：`sglang`
- 认证：可选（取决于你的服务器）
- 默认 Base URL：`http://127.0.0.1:30000/v1`

要在本地选择启用自动发现（如果你的服务器不强制认证，任意值都可以）：

```bash
export SGLANG_API_KEY="sglang-local"
```

然后设置一个模型（替换为 `/v1/models` 返回的某个 id）：

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

详情请参见 [/providers/sglang](/zh-CN/providers/sglang)。

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

说明：

- 对于自定义提供商，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 都是可选的。
  省略时，OpenClaw 默认值为：
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 建议：设置与你的代理/模型限制匹配的显式值。
- 对于非原生端点上的 `api: "openai-completions"`（任何 host 不是 `api.openai.com` 的非空 `baseUrl`），OpenClaw 会强制 `compat.supportsDeveloperRole: false`，以避免提供商因不支持 `developer` 角色而返回 400 错误。
- 代理式 OpenAI 兼容路由也会跳过仅限原生 OpenAI 的请求整形：不使用 `service_tier`，不使用 Responses `store`，不使用 Completions `store`，不使用提示缓存提示，不进行 OpenAI reasoning 兼容载荷整形，也不添加隐藏的 OpenClaw 归属头。
- 对于需要供应商特定字段的 OpenAI 兼容 Completions 代理，可设置 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`），以将额外 JSON 合并到出站请求体中。
- 对于 vLLM chat-template 控制，可设置 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。当会话 thinking level 关闭时，OpenClaw 会自动为 `vllm/nemotron-3-*` 发送 `enable_thinking: false` 和 `force_nonempty_content: true`。
- 如果 `baseUrl` 为空/省略，OpenClaw 会保留默认 OpenAI 行为（即解析到 `api.openai.com`）。
- 出于安全考虑，即使显式设置了 `compat.supportsDeveloperRole: true`，在非原生 `openai-completions` 端点上仍会被覆盖。

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另请参见： [配置](/zh-CN/gateway/configuration) 了解完整配置示例。

## 相关内容

- [Models](/zh-CN/concepts/models) — 模型配置和别名
- [模型故障切换](/zh-CN/concepts/model-failover) — 回退链和重试行为
- [配置参考](/zh-CN/gateway/config-agents#agent-defaults) — 模型配置键
- [提供商](/zh-CN/providers) — 按提供商划分的设置指南
