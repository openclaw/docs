---
read_when:
    - 你需要一份按提供商分别说明的模型设置参考文档
    - 你想要模型提供商的示例配置或 CLI 新手引导命令
summary: 模型提供商概览，包含示例配置和 CLI 流程
title: 模型提供商
x-i18n:
    generated_at: "2026-04-21T08:24:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6732ab672757579c09395583a0f7d110348c909d4e4ab1d2accad68ad054c636
    source_path: concepts/model-providers.md
    workflow: 15
---

# 模型提供商

本页介绍的是 **LLM/模型提供商**（而不是像 WhatsApp/Telegram 这样的聊天渠道）。
关于模型选择规则，请参见 [/concepts/models](/zh-CN/concepts/models)。

## 快速规则

- 模型引用使用 `provider/model` 格式（示例：`opencode/claude-opus-4-6`）。
- 如果你设置了 `agents.defaults.models`，它就会成为允许列表。
- CLI 助手：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- 回退运行时规则、冷却探测和会话覆盖持久化记录在 [/concepts/model-failover](/zh-CN/concepts/model-failover)。
- `models.providers.*.models[].contextWindow` 是原生模型元数据；`models.providers.*.models[].contextTokens` 是运行时生效的上限。
- 提供商插件可以通过 `registerProvider({ catalog })` 注入模型目录；OpenClaw 会在写入 `models.json` 之前将该输出合并到 `models.providers` 中。
- 提供商清单可以声明 `providerAuthEnvVars` 和 `providerAuthAliases`，这样基于通用环境变量的凭证探测和提供商变体就不需要加载插件运行时。当前核心中的其余环境变量映射现在只用于非插件/核心提供商，以及少数通用优先级场景，例如 Anthropic 以 API key 优先的新手引导。
- 提供商插件还可以通过 `normalizeModelId`、`normalizeTransport`、`normalizeConfig`、`applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、`resolveSyntheticAuth`、`shouldDeferSyntheticProfileAuth`、`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`contributeResolvedModelCompat`、`capabilities`、`normalizeToolSchemas`、`inspectToolSchemas`、`resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、`resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、`createEmbeddingProvider`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`matchesContextOverflowError`、`classifyFailoverReason`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`resolveThinkingProfile`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot` 和 `onModelSelected` 来拥有提供商运行时行为。
- 注意：提供商运行时 `capabilities` 是共享运行器元数据（提供商家族、转录/工具行为特性、传输/缓存提示）。它不同于[公开 capability 模型](/zh-CN/plugins/architecture#public-capability-model)，后者描述的是插件注册了什么能力（文本推理、语音等）。
- 内置的 `codex` 提供商与内置 Codex 智能体 harness 配对使用。当你需要 Codex 自有登录、模型发现、原生线程恢复和 app-server 执行时，请使用 `codex/gpt-*`。普通的 `openai/gpt-*` 引用仍然会使用 OpenAI 提供商和标准 OpenClaw 提供商传输。仅使用 Codex 的部署可以通过设置 `agents.defaults.embeddedHarness.fallback: "none"` 来禁用自动 PI 回退；参见 [Codex Harness](/zh-CN/plugins/codex-harness)。

## 插件自有的提供商行为

提供商插件现在可以拥有大部分提供商特定逻辑，而 OpenClaw 则保留通用推理循环。

典型划分如下：

- `auth[].run` / `auth[].runNonInteractive`：提供商拥有 `openclaw onboard`、`openclaw models auth` 和无头设置的引导/登录流程
- `wizard.setup` / `wizard.modelPicker`：提供商拥有凭证选择标签、旧版别名、新手引导允许列表提示，以及新手引导/模型选择器中的设置项
- `catalog`：提供商显示在 `models.providers` 中
- `normalizeModelId`：提供商在查找或规范化之前标准化旧版/预览模型 ID
- `normalizeTransport`：提供商在通用模型组装之前标准化传输家族 `api` / `baseUrl`；OpenClaw 会先检查匹配的提供商，然后再检查其他支持该 hook 的提供商插件，直到其中一个实际更改了传输
- `normalizeConfig`：提供商在运行时使用前标准化 `models.providers.<id>` 配置；OpenClaw 会先检查匹配的提供商，然后再检查其他支持该 hook 的提供商插件，直到其中一个实际更改了配置。如果没有提供商 hook 重写配置，内置的 Google 家族助手仍会标准化受支持的 Google 提供商条目。
- `applyNativeStreamingUsageCompat`：提供商对配置提供商应用由端点驱动的原生流式用量兼容性重写
- `resolveConfigApiKey`：提供商为配置提供商解析环境变量标记凭证，而不强制加载完整运行时凭证。`amazon-bedrock` 这里也有一个内置的 AWS 环境变量标记解析器，尽管 Bedrock 运行时凭证使用的是 AWS SDK 默认链。
- `resolveSyntheticAuth`：提供商可以在不持久化明文密钥的情况下公开本地/自托管或其他基于配置的凭证可用性
- `shouldDeferSyntheticProfileAuth`：提供商可以将已存储的合成配置占位凭证标记为低于环境变量/配置支持凭证的优先级
- `resolveDynamicModel`：提供商接受尚未出现在本地静态目录中的模型 ID
- `prepareDynamicModel`：提供商在重试动态解析之前需要刷新元数据
- `normalizeResolvedModel`：提供商需要重写传输或基础 URL
- `contributeResolvedModelCompat`：即使其供应商模型通过另一个兼容传输到达，提供商也会为其贡献兼容性标志
- `capabilities`：提供商发布转录/工具/提供商家族行为特性
- `normalizeToolSchemas`：提供商在内置运行器看到工具 schema 之前对其进行清理
- `inspectToolSchemas`：提供商在标准化之后暴露传输特定的 schema 警告
- `resolveReasoningOutputMode`：提供商选择原生或带标签的推理输出契约
- `prepareExtraParams`：提供商为每个模型的请求参数设置默认值或进行标准化
- `createStreamFn`：提供商用完全自定义的传输替换正常的流路径
- `wrapStreamFn`：提供商应用请求头/请求体/模型兼容性包装器
- `resolveTransportTurnState`：提供商提供逐轮原生传输头或元数据
- `resolveWebSocketSessionPolicy`：提供商提供原生 WebSocket 会话头或会话冷却策略
- `createEmbeddingProvider`：当内存嵌入行为应属于提供商插件而不是核心嵌入切换板时，由提供商拥有该行为
- `formatApiKey`：提供商将已存储的凭证配置格式化为传输所期望的运行时 `apiKey` 字符串
- `refreshOAuth`：当共享的 `pi-ai` 刷新器不足时，由提供商拥有 OAuth 刷新
- `buildAuthDoctorHint`：当 OAuth 刷新失败时，提供商追加修复指导
- `matchesContextOverflowError`：提供商识别通用启发式规则会漏掉的、提供商特定的上下文窗口溢出错误
- `classifyFailoverReason`：提供商将提供商特定的原始传输/API 错误映射为回退原因，例如速率限制或过载
- `isCacheTtlEligible`：提供商决定哪些上游模型 ID 支持提示词缓存 TTL
- `buildMissingAuthMessage`：提供商用提供商特定的恢复提示替换通用凭证存储错误
- `suppressBuiltInModel`：提供商隐藏过时的上游条目，并可在直接解析失败时返回供应商自有错误
- `augmentModelCatalog`：提供商在发现和配置合并之后追加合成/最终目录条目
- `resolveThinkingProfile`：提供商拥有所选模型的精确 `/think` 级别集合、可选显示标签和默认级别
- `isBinaryThinking`：用于二元开/关思考 UX 的兼容性 hook
- `supportsXHighThinking`：用于选定 `xhigh` 模型的兼容性 hook
- `resolveDefaultThinkingLevel`：用于默认 `/think` 策略的兼容性 hook
- `applyConfigDefaults`：提供商在基于凭证模式、环境变量或模型家族进行配置具体化时应用提供商特定的全局默认值
- `isModernModelRef`：提供商拥有实时/冒烟测试首选模型匹配逻辑
- `prepareRuntimeAuth`：提供商将已配置的凭证转换为短期有效的运行时令牌
- `resolveUsageAuth`：提供商为 `/usage` 以及相关状态/报告界面解析用量/配额凭证
- `fetchUsageSnapshot`：提供商拥有用量端点的抓取/解析逻辑，而核心仍拥有摘要外壳和格式化
- `onModelSelected`：提供商在模型被选中后运行副作用，例如遥测或提供商自有的会话记账

当前内置示例：

- `anthropic`：Claude 4.6 前向兼容回退、凭证修复提示、用量端点抓取、缓存 TTL/提供商家族元数据，以及具备凭证感知能力的全局配置默认值
- `amazon-bedrock`：由提供商自有的上下文溢出匹配，以及针对 Bedrock 特有节流/未就绪错误的回退原因分类，外加共享的 `anthropic-by-model` 重放家族，用于 Anthropic 流量上仅限 Claude 的重放策略保护
- `anthropic-vertex`：针对 Anthropic 消息流量的仅限 Claude 的重放策略保护
- `openrouter`：直通模型 ID、请求包装器、提供商 capability 提示、代理 Gemini 流量上的 Gemini thought-signature 清理、通过 `openrouter-thinking` 流家族进行代理推理注入、路由元数据转发，以及缓存 TTL 策略
- `github-copilot`：新手引导/设备登录、前向兼容模型回退、Claude thinking 转录提示、运行时令牌交换，以及用量端点抓取
- `openai`：GPT-5.4 前向兼容回退、直接 OpenAI 传输标准化、具备 Codex 感知能力的缺失凭证提示、Spark 抑制、合成 OpenAI/Codex 目录条目、thinking/实时模型策略、用量令牌别名标准化（`input` / `output` 和 `prompt` / `completion` 家族）、共享的 `openai-responses-defaults` 流家族（用于原生 OpenAI/Codex 包装器）、提供商家族元数据、为 `gpt-image-1` 内置的图像生成提供商注册，以及为 `sora-2` 内置的视频生成提供商注册
- `google` 和 `google-gemini-cli`：Gemini 3.1 前向兼容回退、原生 Gemini 重放校验、引导重放清理、带标签的推理输出模式、现代模型匹配、为 Gemini image-preview 模型内置的图像生成提供商注册，以及为 Veo 模型内置的视频生成提供商注册；此外，Gemini CLI OAuth 还拥有凭证配置令牌格式化、用量令牌解析，以及面向用量界面的配额端点抓取
- `moonshot`：共享传输、插件自有的 thinking 负载标准化
- `kilocode`：共享传输、插件自有的请求头、推理负载标准化、代理 Gemini thought-signature 清理，以及缓存 TTL 策略
- `zai`：GLM-5 前向兼容回退、`tool_stream` 默认值、缓存 TTL 策略、二元 thinking/实时模型策略，以及用量凭证 + 配额抓取；未知的 `glm-5*` ID 会基于内置的 `glm-4.7` 模板合成
- `xai`：原生 Responses 传输标准化、针对 Grok 快速变体的 `/fast` 别名重写、默认 `tool_stream`、xAI 特有的工具 schema / 推理负载清理，以及为 `grok-imagine-video` 内置的视频生成提供商注册
- `mistral`：插件自有的 capability 元数据
- `opencode` 和 `opencode-go`：插件自有的 capability 元数据，以及代理 Gemini thought-signature 清理
- `alibaba`：针对直接 Wan 模型引用（如 `alibaba/wan2.6-t2v`）的插件自有视频生成目录
- `byteplus`：插件自有目录，以及为 Seedance 文生视频/图生视频模型内置的视频生成提供商注册
- `fal`：为托管第三方图像生成 FLUX 图像模型内置的图像生成提供商注册，以及为托管第三方视频模型内置的视频生成提供商注册
- `cloudflare-ai-gateway`、`huggingface`、`kimi`、`nvidia`、`qianfan`、`stepfun`、`synthetic`、`venice`、`vercel-ai-gateway` 和 `volcengine`：仅有插件自有目录
- `qwen`：文本模型的插件自有目录，以及其多模态界面的共享媒体理解和视频生成提供商注册；Qwen 视频生成使用标准 DashScope 视频端点，并配套内置 Wan 模型，如 `wan2.6-t2v` 和 `wan2.7-r2v`
- `runway`：为原生 Runway 基于任务的模型（如 `gen4.5`）提供插件自有的视频生成提供商注册
- `minimax`：插件自有目录、为 Hailuo 视频模型内置的视频生成提供商注册、为 `image-01` 内置的图像生成提供商注册、Anthropic/OpenAI 混合重放策略选择，以及用量凭证/快照逻辑
- `together`：插件自有目录，以及为 Wan 视频模型内置的视频生成提供商注册
- `xiaomi`：插件自有目录，以及用量凭证/快照逻辑

内置的 `openai` 插件现在同时拥有两个提供商 ID：`openai` 和 `openai-codex`。

以上涵盖了仍适配 OpenClaw 常规传输的提供商。若某个提供商需要完全自定义的请求执行器，那就是另一类、更深层的扩展接口。

## API key 轮换

- 支持为选定提供商进行通用提供商轮换。
- 通过以下方式配置多个 key：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个实时覆盖，最高优先级）
  - `<PROVIDER>_API_KEYS`（逗号或分号分隔列表）
  - `<PROVIDER>_API_KEY`（主 key）
  - `<PROVIDER>_API_KEY_*`（编号列表，例如 `<PROVIDER>_API_KEY_1`）
- 对于 Google 提供商，还会将 `GOOGLE_API_KEY` 作为回退项包含在内。
- key 选择顺序会保留优先级并去重数值。
- 仅在收到速率限制响应时，才会使用下一个 key 重试请求（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`，或周期性的用量限制消息）。
- 非速率限制失败会立即失败；不会尝试 key 轮换。
- 当所有候选 key 都失败时，返回最后一次尝试的最终错误。

## 内置提供商（pi-ai 目录）

OpenClaw 内置了 pi‑ai 目录。这些提供商**不需要**
`models.providers` 配置；只需设置凭证并选择模型。

### OpenAI

- 提供商：`openai`
- 凭证：`OPENAI_API_KEY`
- 可选轮换：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，以及 `OPENCLAW_LIVE_OPENAI_KEY`（单个覆盖）
- 示例模型：`openai/gpt-5.4`、`openai/gpt-5.4-pro`
- CLI：`openclaw onboard --auth-choice openai-api-key`
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 可通过 `agents.defaults.models["openai/<model>"].params.transport` 为每个模型覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- OpenAI Responses WebSocket 预热默认通过 `params.openaiWsWarmup` 启用（`true`/`false`）
- 可通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用 OpenAI 优先级处理
- `/fast` 和 `params.fastMode` 会将直接 `openai/*` Responses 请求映射到 `api.openai.com` 上的 `service_tier=priority`
- 当你希望使用显式层级而不是共享的 `/fast` 开关时，请使用 `params.serviceTier`
- 隐藏的 OpenClaw 归因请求头（`originator`、`version`、`User-Agent`）只适用于发往 `api.openai.com` 的原生 OpenAI 流量，不适用于通用 OpenAI 兼容代理
- 原生 OpenAI 路由还会保留 Responses `store`、提示词缓存提示，以及 OpenAI 推理兼容负载整形；代理路由则不会
- `openai/gpt-5.3-codex-spark` 在 OpenClaw 中被有意抑制，因为实时 OpenAI API 会拒绝它；Spark 被视为仅限 Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- 提供商：`anthropic`
- 凭证：`ANTHROPIC_API_KEY`
- 可选轮换：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，以及 `OPENCLAW_LIVE_ANTHROPIC_KEY`（单个覆盖）
- 示例模型：`anthropic/claude-opus-4-6`
- CLI：`openclaw onboard --auth-choice apiKey`
- 直接公共 Anthropic 请求支持共享的 `/fast` 开关和 `params.fastMode`，包括发送到 `api.anthropic.com` 的 API key 和 OAuth 凭证流量；OpenClaw 会将其映射到 Anthropic `service_tier`（`auto` 与 `standard_only`）
- Anthropic 说明：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此除非 Anthropic 发布新政策，否则 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为该集成已获许可。
- Anthropic setup-token 仍可作为受支持的 OpenClaw 令牌路径使用，但 OpenClaw 现在在可用时更倾向于 Claude CLI 复用和 `claude -p`。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code（Codex）

- 提供商：`openai-codex`
- 凭证：OAuth（ChatGPT）
- 示例模型：`openai-codex/gpt-5.4`
- CLI：`openclaw onboard --auth-choice openai-codex` 或 `openclaw models auth login --provider openai-codex`
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 可通过 `agents.defaults.models["openai-codex/<model>"].params.transport` 为每个模型覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- `params.serviceTier` 也会在原生 Codex Responses 请求（`chatgpt.com/backend-api`）上传递
- 隐藏的 OpenClaw 归因请求头（`originator`、`version`、`User-Agent`）仅附加到发往 `chatgpt.com/backend-api` 的原生 Codex 流量，不适用于通用 OpenAI 兼容代理
- 与直接 `openai/*` 共用相同的 `/fast` 开关和 `params.fastMode` 配置；OpenClaw 会将其映射为 `service_tier=priority`
- 当 Codex OAuth 目录暴露 `openai-codex/gpt-5.3-codex-spark` 时，该模型仍可用；是否可用取决于 entitlement
- `openai-codex/gpt-5.4` 保持原生 `contextWindow = 1050000` 和默认运行时 `contextTokens = 272000`；可通过 `models.providers.openai-codex.models[].contextTokens` 覆盖运行时上限
- 策略说明：OpenAI Codex OAuth 明确支持像 OpenClaw 这样的外部工具/工作流。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### 其他订阅式托管选项

- [Qwen Cloud](/zh-CN/providers/qwen)：Qwen Cloud 提供商界面，以及 Alibaba DashScope 和 Coding Plan 端点映射
- [MiniMax](/zh-CN/providers/minimax)：MiniMax Coding Plan OAuth 或 API key 访问
- [GLM Models](/zh-CN/providers/glm)：Z.AI Coding Plan 或通用 API 端点

### OpenCode

- 凭证：`OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- Zen 运行时提供商：`opencode`
- Go 运行时提供商：`opencode-go`
- 示例模型：`opencode/claude-opus-4-6`、`opencode-go/kimi-k2.5`
- CLI：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API key）

- 提供商：`google`
- 凭证：`GEMINI_API_KEY`
- 可选轮换：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 回退项，以及 `OPENCLAW_LIVE_GEMINI_KEY`（单个覆盖）
- 示例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 兼容性：使用 `google/gemini-3.1-flash-preview` 的旧版 OpenClaw 配置会被标准化为 `google/gemini-3-flash-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`
- 直接 Gemini 运行也接受 `agents.defaults.models["google/<model>"].params.cachedContent`
  （或旧版 `cached_content`），以转发提供商原生的
  `cachedContents/...` 句柄；Gemini 缓存命中会显示为 OpenClaw `cacheRead`

### Google Vertex 和 Gemini CLI

- 提供商：`google-vertex`、`google-gemini-cli`
- 凭证：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程
- 注意：OpenClaw 中的 Gemini CLI OAuth 是非官方集成。一些用户报告称，在使用第三方客户端后遭遇了 Google 账号限制。如果你选择继续，请先查看 Google 条款，并使用非关键账号。
- Gemini CLI OAuth 作为内置 `google` 插件的一部分提供。
  - 先安装 Gemini CLI：
    - `brew install gemini-cli`
    - 或 `npm install -g @google/gemini-cli`
  - 启用：`openclaw plugins enable google`
  - 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
  - 默认模型：`google-gemini-cli/gemini-3-flash-preview`
  - 注意：你**不需要**将 client id 或 secret 粘贴到 `openclaw.json` 中。CLI 登录流程会将令牌存储在 Gateway 网关主机上的凭证配置中。
  - 如果登录后请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  - Gemini CLI JSON 回复会从 `response` 解析；用量会回退到
    `stats`，其中 `stats.cached` 会被标准化为 OpenClaw `cacheRead`。

### Z.AI（GLM）

- 提供商：`zai`
- 凭证：`ZAI_API_KEY`
- 示例模型：`zai/glm-5.1`
- CLI：`openclaw onboard --auth-choice zai-api-key`
  - 别名：`z.ai/*` 和 `z-ai/*` 会被标准化为 `zai/*`
  - `zai-api-key` 会自动检测匹配的 Z.AI 端点；`zai-coding-global`、`zai-coding-cn`、`zai-global` 和 `zai-cn` 会强制使用特定界面

### Vercel AI Gateway

- 提供商：`vercel-ai-gateway`
- 凭证：`AI_GATEWAY_API_KEY`
- 示例模型：`vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI：`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- 提供商：`kilocode`
- 凭证：`KILOCODE_API_KEY`
- 示例模型：`kilocode/kilo/auto`
- CLI：`openclaw onboard --auth-choice kilocode-api-key`
- Base URL：`https://api.kilo.ai/api/gateway/`
- 静态回退目录内置 `kilocode/kilo/auto`；实时
  `https://api.kilo.ai/api/gateway/models` 发现可以进一步扩展运行时
  目录。
- `kilocode/kilo/auto` 背后的精确上游路由由 Kilo Gateway 自行管理，
  并非在 OpenClaw 中硬编码。

设置详情请参见 [/providers/kilocode](/zh-CN/providers/kilocode)。

### 其他内置提供商插件

- OpenRouter：`openrouter`（`OPENROUTER_API_KEY`）
- 示例模型：`openrouter/auto`
- OpenClaw 仅在请求实际发往 `openrouter.ai` 时才会应用 OpenRouter 文档中说明的应用归因请求头
- OpenRouter 特有的 Anthropic `cache_control` 标记同样只会作用于经过验证的 OpenRouter 路由，而不是任意代理 URL
- OpenRouter 仍走代理风格的 OpenAI 兼容路径，因此仅适用于原生 OpenAI 的请求整形（`serviceTier`、Responses `store`、提示词缓存提示、OpenAI 推理兼容负载）不会被转发
- 基于 Gemini 的 OpenRouter 引用只保留代理 Gemini thought-signature 清理；原生 Gemini 重放校验和引导重写保持关闭
- Kilo Gateway：`kilocode`（`KILOCODE_API_KEY`）
- 示例模型：`kilocode/kilo/auto`
- 基于 Gemini 的 Kilo 引用保留相同的代理 Gemini thought-signature
  清理路径；`kilocode/kilo/auto` 以及其他不支持代理推理的提示会跳过代理推理注入
- MiniMax：`minimax`（API key）和 `minimax-portal`（OAuth）
- 凭证：`minimax` 使用 `MINIMAX_API_KEY`；`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`
- 示例模型：`minimax/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7`
- MiniMax 新手引导/API key 设置会写入显式的 M2.7 模型定义，并带有
  `input: ["text", "image"]`；内置提供商目录会在该提供商配置具体化之前，将聊天引用保持为仅文本
- Moonshot：`moonshot`（`MOONSHOT_API_KEY`）
- 示例模型：`moonshot/kimi-k2.6`
- Kimi Coding：`kimi`（`KIMI_API_KEY` 或 `KIMICODE_API_KEY`）
- 示例模型：`kimi/kimi-code`
- Qianfan：`qianfan`（`QIANFAN_API_KEY`）
- 示例模型：`qianfan/deepseek-v3.2`
- Qwen Cloud：`qwen`（`QWEN_API_KEY`、`MODELSTUDIO_API_KEY` 或 `DASHSCOPE_API_KEY`）
- 示例模型：`qwen/qwen3.5-plus`
- NVIDIA：`nvidia`（`NVIDIA_API_KEY`）
- 示例模型：`nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun：`stepfun` / `stepfun-plan`（`STEPFUN_API_KEY`）
- 示例模型：`stepfun/step-3.5-flash`、`stepfun-plan/step-3.5-flash-2603`
- Together：`together`（`TOGETHER_API_KEY`）
- 示例模型：`together/moonshotai/Kimi-K2.5`
- Venice：`venice`（`VENICE_API_KEY`）
- Xiaomi：`xiaomi`（`XIAOMI_API_KEY`）
- 示例模型：`xiaomi/mimo-v2-flash`
- Vercel AI Gateway：`vercel-ai-gateway`（`AI_GATEWAY_API_KEY`）
- Hugging Face Inference：`huggingface`（`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`）
- Cloudflare AI Gateway：`cloudflare-ai-gateway`（`CLOUDFLARE_AI_GATEWAY_API_KEY`）
- Volcengine：`volcengine`（`VOLCANO_ENGINE_API_KEY`）
- 示例模型：`volcengine-plan/ark-code-latest`
- BytePlus：`byteplus`（`BYTEPLUS_API_KEY`）
- 示例模型：`byteplus-plan/ark-code-latest`
- xAI：`xai`（`XAI_API_KEY`）
  - 原生内置 xAI 请求使用 xAI Responses 路径
  - `/fast` 或 `params.fastMode: true` 会将 `grok-3`、`grok-3-mini`、
    `grok-4` 和 `grok-4-0709` 重写为其 `*-fast` 变体
  - `tool_stream` 默认开启；设置
    `agents.defaults.models["xai/<model>"].params.tool_stream` 为 `false` 可
    关闭
- Mistral：`mistral`（`MISTRAL_API_KEY`）
- 示例模型：`mistral/mistral-large-latest`
- CLI：`openclaw onboard --auth-choice mistral-api-key`
- Groq：`groq`（`GROQ_API_KEY`）
- Cerebras：`cerebras`（`CEREBRAS_API_KEY`）
  - Cerebras 上的 GLM 模型使用 ID `zai-glm-4.7` 和 `zai-glm-4.6`。
  - OpenAI 兼容 Base URL：`https://api.cerebras.ai/v1`。
- GitHub Copilot：`github-copilot`（`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`）
- Hugging Face Inference 示例模型：`huggingface/deepseek-ai/DeepSeek-R1`；CLI：`openclaw onboard --auth-choice huggingface-api-key`。参见 [Hugging Face（Inference）](/zh-CN/providers/huggingface)。

## 通过 `models.providers` 使用提供商（自定义/Base URL）

使用 `models.providers`（或 `models.json`）添加**自定义**提供商或
OpenAI/Anthropic 兼容代理。

下方许多内置提供商插件已经发布了默认目录。
只有在你想覆盖默认 Base URL、请求头或模型列表时，才需要显式使用
`models.providers.<id>` 条目。

### Moonshot AI（Kimi）

Moonshot 作为内置提供商插件提供。默认使用内置提供商，只有在你
需要覆盖 Base URL 或模型元数据时，才添加显式的 `models.providers.moonshot`
条目：

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

### Kimi Coding

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

旧版 `kimi/k2p5` 仍然作为兼容模型 ID 被接受。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）在中国提供对 Doubao 和其他模型的访问。

- 提供商：`volcengine`（coding：`volcengine-plan`）
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

新手引导默认使用 coding 界面，但通用 `volcengine/*`
目录会同时注册。

在新手引导/配置模型选择器中，Volcengine 凭证选项会优先显示
`volcengine/*` 和 `volcengine-plan/*` 条目。如果这些模型尚未加载，
OpenClaw 会回退到未筛选目录，而不是显示一个空的提供商范围选择器。

可用模型：

- `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127`（Kimi K2.5）
- `volcengine/glm-4-7-251222`（GLM 4.7）
- `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）

Coding 模型（`volcengine-plan`）：

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus（国际版）

BytePlus ARK 为国际用户提供与 Volcano Engine 相同模型的访问。

- 提供商：`byteplus`（coding：`byteplus-plan`）
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

新手引导默认使用 coding 界面，但通用 `byteplus/*`
目录会同时注册。

在新手引导/配置模型选择器中，BytePlus（国际版）凭证选项会优先显示
`byteplus/*` 和 `byteplus-plan/*` 条目。如果这些模型尚未加载，
OpenClaw 会回退到未筛选目录，而不是显示一个空的提供商范围选择器。

可用模型：

- `byteplus/seed-1-8-251228`（Seed 1.8）
- `byteplus/kimi-k2-5-260127`（Kimi K2.5）
- `byteplus/glm-4-7-251222`（GLM 4.7）

Coding 模型（`byteplus-plan`）：

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

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

- MiniMax OAuth（Global）：`--auth-choice minimax-global-oauth`
- MiniMax OAuth（CN）：`--auth-choice minimax-cn-oauth`
- MiniMax API key（Global）：`--auth-choice minimax-global-api`
- MiniMax API key（CN）：`--auth-choice minimax-cn-api`
- 凭证：`minimax` 使用 `MINIMAX_API_KEY`；`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或
  `MINIMAX_API_KEY`

设置详情、模型选项和配置片段请参见 [/providers/minimax](/zh-CN/providers/minimax)。

在 MiniMax 的 Anthropic 兼容流式路径上，OpenClaw 默认禁用 thinking，
除非你显式设置它，并且 `/fast on` 会将
`MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

插件自有 capability 划分：

- 文本/聊天默认保持在 `minimax/MiniMax-M2.7`
- 图像生成使用 `minimax/image-01` 或 `minimax-portal/image-01`
- 图像理解在两种 MiniMax 凭证路径上都使用插件自有的 `MiniMax-VL-01`
- Web 搜索保持使用提供商 ID `minimax`

### LM Studio

LM Studio 作为内置提供商插件提供，并使用原生 API：

- 提供商：`lmstudio`
- 凭证：`LM_API_TOKEN`
- 默认推理 Base URL：`http://localhost:1234/v1`

然后设置一个模型（请替换为 `http://localhost:1234/api/v1/models` 返回的某个 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 原生的 `/api/v1/models` 和 `/api/v1/models/load`
进行发现 + 自动加载，并默认使用 `/v1/chat/completions` 进行推理。
设置和故障排除请参见 [/providers/lmstudio](/zh-CN/providers/lmstudio)。

### Ollama

Ollama 作为内置提供商插件提供，并使用 Ollama 的原生 API：

- 提供商：`ollama`
- 凭证：不需要（本地服务器）
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

当你通过 `OLLAMA_API_KEY` 选择启用时，系统会在本地 `http://127.0.0.1:11434` 检测 Ollama，
并且内置提供商插件会将 Ollama 直接添加到
`openclaw onboard` 和模型选择器中。有关新手引导、云端/本地模式和自定义配置，请参见 [/providers/ollama](/zh-CN/providers/ollama)。

### vLLM

vLLM 作为内置提供商插件提供，适用于本地/自托管的 OpenAI 兼容
服务器：

- 提供商：`vllm`
- 凭证：可选（取决于你的服务器）
- 默认 Base URL：`http://127.0.0.1:8000/v1`

要在本地选择启用自动发现（如果你的服务器不强制凭证，任意值都可以）：

```bash
export VLLM_API_KEY="vllm-local"
```

然后设置一个模型（请替换为 `/v1/models` 返回的某个 ID）：

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

详情请参见 [/providers/vllm](/zh-CN/providers/vllm)。

### SGLang

SGLang 作为内置提供商插件提供，适用于快速自托管的
OpenAI 兼容服务器：

- 提供商：`sglang`
- 凭证：可选（取决于你的服务器）
- 默认 Base URL：`http://127.0.0.1:30000/v1`

要在本地选择启用自动发现（如果你的服务器不强制
凭证，任意值都可以）：

```bash
export SGLANG_API_KEY="sglang-local"
```

然后设置一个模型（请替换为 `/v1/models` 返回的某个 ID）：

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

- 对于自定义提供商，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 都是可选项。
  如果省略，OpenClaw 默认使用：
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 建议：设置与你的代理/模型限制相匹配的显式值。
- 对于非原生端点上的 `api: "openai-completions"`（任何 host 不是 `api.openai.com` 的非空 `baseUrl`），OpenClaw 会强制设置 `compat.supportsDeveloperRole: false`，以避免提供商因不支持 `developer` 角色而返回 400 错误。
- 代理风格的 OpenAI 兼容路由也会跳过仅适用于原生 OpenAI 的请求
  整形：没有 `service_tier`、没有 Responses `store`、没有提示词缓存提示、没有
  OpenAI 推理兼容负载整形，也没有隐藏的 OpenClaw 归因请求头。
- 如果 `baseUrl` 为空/省略，OpenClaw 会保留默认的 OpenAI 行为（即解析到 `api.openai.com`）。
- 为了安全起见，即使显式设置了 `compat.supportsDeveloperRole: true`，在非原生 `openai-completions` 端点上仍会被覆盖。

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另请参见：[/gateway/configuration](/zh-CN/gateway/configuration) 了解完整配置示例。

## 相关内容

- [Models](/zh-CN/concepts/models) — 模型配置和别名
- [Model Failover](/zh-CN/concepts/model-failover) — 回退链和重试行为
- [Configuration Reference](/zh-CN/gateway/configuration-reference#agent-defaults) — 模型配置键
- [Providers](/zh-CN/providers) — 按提供商分别说明的设置指南
