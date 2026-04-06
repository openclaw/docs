---
read_when:
    - 你需要按提供商划分的模型设置参考
    - 你想查看模型提供商的示例配置或 CLI 新手引导命令
summary: 模型提供商概览，包含示例配置和 CLI 流程
title: 模型提供商
x-i18n:
    generated_at: "2026-04-06T12:44:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec33cbfeec86c3f79ea0ec38932eebb819eba5932024b73fcf3acbc41fbce203
    source_path: concepts/model-providers.md
    workflow: 15
---

# 模型提供商

本页介绍 **LLM/模型提供商**（不是像 WhatsApp/Telegram 这样的聊天渠道）。
关于模型选择规则，请参见 [/concepts/models](/zh-CN/concepts/models)。

## 快速规则

- 模型引用使用 `provider/model`（例如：`opencode/claude-opus-4-6`）。
- 如果你设置了 `agents.defaults.models`，它就会成为允许列表。
- CLI 辅助命令：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- 回退运行时规则、冷却探测和会话覆盖持久化
  记录于 [/concepts/model-failover](/zh-CN/concepts/model-failover)。
- `models.providers.*.models[].contextWindow` 是原生模型元数据；
  `models.providers.*.models[].contextTokens` 是实际运行时上限。
- 提供商插件可以通过 `registerProvider({ catalog })` 注入模型目录；
  OpenClaw 会在写入
  `models.json` 之前将该输出合并到 `models.providers` 中。
- 提供商清单可以声明 `providerAuthEnvVars`，这样通用的基于环境变量的
  凭证探测就不需要加载插件运行时。剩余的核心环境变量
  映射现在只用于非插件/核心提供商以及少数通用优先级
  场景，例如 Anthropic 以 API 密钥优先的新手引导。
- 提供商插件还可以通过以下方式拥有提供商运行时行为：
  `normalizeModelId`、`normalizeTransport`、`normalizeConfig`、
  `applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、
  `resolveSyntheticAuth`、`shouldDeferSyntheticProfileAuth`、
  `resolveDynamicModel`、`prepareDynamicModel`、
  `normalizeResolvedModel`、`contributeResolvedModelCompat`、
  `capabilities`、`normalizeToolSchemas`、
  `inspectToolSchemas`、`resolveReasoningOutputMode`、
  `prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、
  `resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、
  `createEmbeddingProvider`、`formatApiKey`、`refreshOAuth`、
  `buildAuthDoctorHint`、
  `matchesContextOverflowError`、`classifyFailoverReason`、
  `isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、
  `resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、
  `prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`，以及
  `onModelSelected`。
- 注意：提供商运行时 `capabilities` 是共享运行器元数据（提供商
  家族、转录/工具怪癖、传输/缓存提示）。它不同于
  [公开能力模型](/zh-CN/plugins/architecture#public-capability-model)，
  后者描述的是插件注册了什么能力（文本推理、语音等）。

## 插件拥有的提供商行为

提供商插件现在可以拥有大多数提供商特定逻辑，而 OpenClaw 保持
通用推理循环。

典型划分：

- `auth[].run` / `auth[].runNonInteractive`：提供商拥有 `openclaw onboard`、`openclaw models auth` 和无头设置的
  新手引导/登录流程
- `wizard.setup` / `wizard.modelPicker`：提供商拥有凭证选择标签、
  旧别名、新手引导允许列表提示，以及新手引导/模型选择器中的设置条目
- `catalog`：提供商会出现在 `models.providers` 中
- `normalizeModelId`：提供商在查找或规范化之前
  归一化旧版/预览模型 id
- `normalizeTransport`：提供商会在通用模型组装之前归一化传输族的 `api` / `baseUrl`；
  OpenClaw 会先检查匹配的提供商，
  然后检查其他具备 hook 能力的提供商插件，直到其中一个
  实际修改了传输
- `normalizeConfig`：提供商会在运行时使用前归一化 `models.providers.<id>` 配置；
  OpenClaw 会先检查匹配的提供商，
  然后检查其他具备 hook 能力的提供商插件，直到其中一个
  实际修改了配置。如果没有
  提供商 hook 重写配置，内置的 Google 家族辅助逻辑仍会
  归一化受支持的 Google 提供商条目。
- `applyNativeStreamingUsageCompat`：提供商为配置型提供商应用由端点驱动的原生流式使用量兼容性重写
- `resolveConfigApiKey`：提供商为配置型提供商解析环境变量标记凭证，
  无需强制加载完整运行时凭证。`amazon-bedrock` 在这里也有一个
  内置的 AWS 环境变量标记解析器，尽管 Bedrock 运行时凭证使用的是
  AWS SDK 默认链。
- `resolveSyntheticAuth`：提供商可以暴露本地/自托管或其他
  基于配置的凭证可用性，而不持久化明文密钥
- `shouldDeferSyntheticProfileAuth`：提供商可以将已存储的合成配置档占位符
  标记为低于环境变量/配置型凭证的优先级
- `resolveDynamicModel`：提供商接受本地
  静态目录中尚未存在的模型 id
- `prepareDynamicModel`：提供商在重试动态解析之前
  需要刷新元数据
- `normalizeResolvedModel`：提供商需要传输或 base URL 重写
- `contributeResolvedModelCompat`：即使其
  厂商模型是通过另一种兼容传输到达的，提供商也会为其贡献兼容标志
- `capabilities`：提供商发布转录/工具/提供商家族怪癖
- `normalizeToolSchemas`：提供商在内嵌
  运行器看到工具 schema 之前进行清理
- `inspectToolSchemas`：提供商在归一化后暴露传输特定的 schema 警告
- `resolveReasoningOutputMode`：提供商选择原生还是带标签的
  推理输出契约
- `prepareExtraParams`：提供商为每个模型的请求参数设置默认值或进行归一化
- `createStreamFn`：提供商用完全
  自定义的传输替换正常流式路径
- `wrapStreamFn`：提供商应用请求头/请求体/模型兼容包装器
- `resolveTransportTurnState`：提供商提供每轮原生传输的
  请求头或元数据
- `resolveWebSocketSessionPolicy`：提供商提供原生 WebSocket 会话
  请求头或会话冷却策略
- `createEmbeddingProvider`：当内存嵌入行为
  更适合归属于提供商插件而不是核心嵌入切换层时，由提供商负责
- `formatApiKey`：提供商将已存储的凭证配置档格式化为
  传输所需的运行时 `apiKey` 字符串
- `refreshOAuth`：当共享的 `pi-ai`
  刷新器不足时，由提供商负责 OAuth 刷新
- `buildAuthDoctorHint`：当 OAuth 刷新
  失败时，提供商追加修复指引
- `matchesContextOverflowError`：提供商识别提供商特定的
  上下文窗口溢出错误，而通用启发式无法识别这些错误
- `classifyFailoverReason`：提供商将提供商特定的原始传输/API
  错误映射为回退原因，例如速率限制或过载
- `isCacheTtlEligible`：提供商决定哪些上游模型 id 支持提示缓存 TTL
- `buildMissingAuthMessage`：提供商用提供商特定的恢复提示
  替换通用的凭证存储错误
- `suppressBuiltInModel`：提供商隐藏过时的上游条目，并且可以在
  直接解析失败时返回厂商拥有的错误
- `augmentModelCatalog`：提供商在
  发现和配置合并之后追加合成/最终目录条目
- `isBinaryThinking`：提供商拥有二元开/关思考 UX
- `supportsXHighThinking`：提供商让选定模型支持 `xhigh`
- `resolveDefaultThinkingLevel`：提供商拥有某个
  模型家族的默认 `/think` 策略
- `applyConfigDefaults`：提供商在配置具体化期间，根据凭证模式、
  环境变量或模型家族应用提供商特定的全局默认值
- `isModernModelRef`：提供商拥有实时/冒烟优选模型匹配
- `prepareRuntimeAuth`：提供商将已配置的凭证转换为短期
  运行时令牌
- `resolveUsageAuth`：提供商为 `/usage`
  及相关状态/报告界面解析用量/配额凭证
- `fetchUsageSnapshot`：提供商拥有用量端点的抓取/解析逻辑，
  而核心仍然拥有摘要外壳与格式化
- `onModelSelected`：提供商运行选择模型后的副作用，例如
  遥测或由提供商拥有的会话记账

当前内置示例：

- `anthropic`：Claude 4.6 向前兼容回退、凭证修复提示、用量
  端点抓取、缓存 TTL/提供商家族元数据，以及具备凭证感知能力的全局
  配置默认值
- `amazon-bedrock`：由提供商拥有的上下文溢出匹配，以及针对 Bedrock 特定的节流/未就绪错误的回退
  原因分类，另外还有共享的 `anthropic-by-model` 重放家族，用于
  Anthropic 流量上的仅 Claude 重放策略保护
- `anthropic-vertex`：针对 Anthropic-message
  流量的仅 Claude 重放策略保护
- `openrouter`：透传模型 id、请求包装器、提供商能力
  提示、代理 Gemini 流量上的 Gemini thought-signature 清理、
  通过 `openrouter-thinking` 流家族进行的代理推理注入、
  路由元数据转发，以及缓存 TTL 策略
- `github-copilot`：新手引导/设备登录、向前兼容模型回退、
  Claude-thinking 转录提示、运行时令牌交换，以及用量端点
  抓取
- `openai`：GPT-5.4 向前兼容回退、直接 OpenAI 传输
  归一化、兼容 Codex 的缺失凭证提示、Spark 抑制、合成
  OpenAI/Codex 目录条目、thinking/live-model 策略、用量令牌别名
  归一化（`input` / `output` 和 `prompt` / `completion` 家族）、共享的
  `openai-responses-defaults` 流家族，用于原生 OpenAI/Codex
  包装器、提供商家族元数据、为 `gpt-image-1` 注册的内置图像生成提供商，
  以及为 `sora-2` 注册的内置视频生成提供商
- `google` 和 `google-gemini-cli`：Gemini 3.1 向前兼容回退、
  原生 Gemini 重放校验、bootstrap 重放清理、带标签的
  推理输出模式、现代模型匹配、为 Gemini image-preview 模型注册的内置图像生成
  提供商，以及为 Veo 模型注册的内置
  视频生成提供商；Gemini CLI OAuth 还
  负责凭证配置档令牌格式化、用量令牌解析，以及面向用量界面的配额端点
  抓取
- `moonshot`：共享传输、由插件拥有的思考载荷归一化
- `kilocode`：共享传输、由插件拥有的请求头、推理载荷
  归一化、代理 Gemini thought-signature 清理，以及缓存 TTL
  策略
- `zai`：GLM-5 向前兼容回退、`tool_stream` 默认值、缓存 TTL
  策略、二元思考/live-model 策略，以及用量凭证 + 配额抓取；
  未知的 `glm-5*` id 会从内置的 `glm-4.7` 模板合成
- `xai`：原生 Responses 传输归一化、Grok 快速变体的 `/fast` 别名重写、
  默认 `tool_stream`、xAI 特定的工具 schema /
  推理载荷清理，以及为 `grok-imagine-video` 注册的内置视频生成
  提供商
- `mistral`：由插件拥有的能力元数据
- `opencode` 和 `opencode-go`：由插件拥有的能力元数据，加上
  代理 Gemini thought-signature 清理
- `alibaba`：用于直接 Wan 模型引用（例如
  `alibaba/wan2.6-t2v`）的由插件拥有的视频生成目录
- `byteplus`：由插件拥有的目录，加上为 Seedance 文生视频/图生视频模型注册的内置
  视频生成提供商
- `fal`：为托管第三方
  图像生成提供商注册的内置图像生成提供商，用于 FLUX 图像模型；以及为托管第三方视频模型注册的内置
  视频生成提供商
- `cloudflare-ai-gateway`、`huggingface`、`kimi`、`nvidia`、`qianfan`、
  `stepfun`、`synthetic`、`venice`、`vercel-ai-gateway` 和 `volcengine`：
  仅由插件拥有目录
- `qwen`：文本模型的由插件拥有目录，加上为其
  多模态界面注册的共享 media-understanding 和视频生成提供商；Qwen 视频生成使用
  标准 DashScope 视频端点，配合内置 Wan 模型，例如 `wan2.6-t2v` 和 `wan2.7-r2v`
- `runway`：为原生
  Runway 基于任务的模型（例如 `gen4.5`）注册的由插件拥有的视频生成提供商
- `minimax`：由插件拥有目录、为 Hailuo 视频模型注册的内置视频生成提供商、
  为 `image-01` 注册的内置图像生成提供商、混合 Anthropic/OpenAI 重放策略
  选择，以及用量凭证/快照逻辑
- `together`：由插件拥有目录，加上为 Wan 视频模型注册的内置视频生成
  提供商
- `xiaomi`：由插件拥有目录，加上用量凭证/快照逻辑

内置的 `openai` 插件现在同时拥有这两个提供商 id：`openai` 和
`openai-codex`。

以上涵盖了仍然适配 OpenClaw 正常传输的提供商。一个提供商
如果需要完全自定义的请求执行器，则属于另一个更深层的扩展接口。

## API 密钥轮换

- 支持为选定提供商进行通用提供商轮换。
- 通过以下方式配置多个密钥：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个实时覆盖，最高优先级）
  - `<PROVIDER>_API_KEYS`（逗号或分号分隔列表）
  - `<PROVIDER>_API_KEY`（主密钥）
  - `<PROVIDER>_API_KEY_*`（编号列表，例如 `<PROVIDER>_API_KEY_1`）
- 对于 Google 提供商，还会将 `GOOGLE_API_KEY` 作为回退包含在内。
- 密钥选择顺序会保留优先级并去重。
- 仅在速率限制响应时，请求才会使用下一个密钥重试（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many
concurrent requests`、`ThrottlingException`、`concurrency limit reached`、
  `workers_ai ... quota limit exceeded` 或周期性的用量上限消息）。
- 非速率限制失败会立即失败；不会尝试密钥轮换。
- 当所有候选密钥都失败时，将返回最后一次尝试的最终错误。

## 内置提供商（pi-ai 目录）

OpenClaw 附带 pi‑ai 目录。这些提供商**不需要**
`models.providers` 配置；只需设置凭证并选择模型即可。

### OpenAI

- 提供商：`openai`
- 凭证：`OPENAI_API_KEY`
- 可选轮换：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，以及 `OPENCLAW_LIVE_OPENAI_KEY`（单个覆盖）
- 示例模型：`openai/gpt-5.4`、`openai/gpt-5.4-pro`
- CLI：`openclaw onboard --auth-choice openai-api-key`
- 默认传输是 `auto`（WebSocket 优先，SSE 回退）
- 可通过 `agents.defaults.models["openai/<model>"].params.transport` 为每个模型覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- OpenAI Responses WebSocket 预热默认启用，通过 `params.openaiWsWarmup` 控制（`true`/`false`）
- 可以通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用 OpenAI 优先级处理
- `/fast` 和 `params.fastMode` 会将直接 `openai/*` Responses 请求映射为 `api.openai.com` 上的 `service_tier=priority`
- 如果你想使用显式 tier，而不是共享的 `/fast` 开关，请使用 `params.serviceTier`
- 隐藏的 OpenClaw 归因请求头（`originator`、`version`、
  `User-Agent`）仅应用于发送到 `api.openai.com` 的原生 OpenAI 流量，不会应用于
  通用 OpenAI 兼容代理
- 原生 OpenAI 路由还会保留 Responses `store`、提示缓存提示，以及
  OpenAI 推理兼容载荷整形；代理路由则不会
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
- 直连公共 Anthropic 请求支持共享 `/fast` 开关和 `params.fastMode`，包括发送到 `api.anthropic.com` 的 API 密钥和 OAuth 凭证流量；OpenClaw 会将其映射为 Anthropic `service_tier`（`auto` 与 `standard_only`）
- 计费说明：对于 OpenClaw 中的 Anthropic，实际上的区分是**API 密钥**或**带 Extra Usage 的 Claude 订阅**。Anthropic 于 **2026 年 4 月 4 日太平洋时间中午 12:00 / 英国夏令时晚上 8:00** 通知 OpenClaw 用户，**OpenClaw** 的 Claude 登录路径被视为第三方 harness 用法，因此需要**额外用量**，并与订阅分开计费。我们的本地复现还显示，OpenClaw 标识提示字符串不会在 Anthropic SDK + API 密钥路径上复现。
- Anthropic setup-token 现已再次作为旧版/手动 OpenClaw 路径可用。使用时请预期 Anthropic 已告知 OpenClaw 用户，此路径需要**额外用量**。

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
- 默认传输是 `auto`（WebSocket 优先，SSE 回退）
- 可通过 `agents.defaults.models["openai-codex/<model>"].params.transport` 为每个模型覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- `params.serviceTier` 也会在原生 Codex Responses 请求（`chatgpt.com/backend-api`）上传递
- 隐藏的 OpenClaw 归因请求头（`originator`、`version`、
  `User-Agent`）仅附加到发送到
  `chatgpt.com/backend-api` 的原生 Codex 流量，不会附加到通用 OpenAI 兼容代理
- 与直接 `openai/*` 共享相同的 `/fast` 开关和 `params.fastMode` 配置；OpenClaw 会将其映射为 `service_tier=priority`
- 当 Codex OAuth 目录公开 `openai-codex/gpt-5.3-codex-spark` 时，它仍然可用；取决于权限
- `openai-codex/gpt-5.4` 保留原生 `contextWindow = 1050000` 和默认运行时 `contextTokens = 272000`；可通过 `models.providers.openai-codex.models[].contextTokens` 覆盖运行时上限
- 策略说明：OpenAI Codex OAuth 明确支持用于 OpenClaw 之类的外部工具/工作流。

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
- [MiniMax](/zh-CN/providers/minimax)：MiniMax Coding Plan OAuth 或 API 密钥访问
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

### Google Gemini（API 密钥）

- 提供商：`google`
- 凭证：`GEMINI_API_KEY`
- 可选轮换：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 回退，以及 `OPENCLAW_LIVE_GEMINI_KEY`（单个覆盖）
- 示例模型：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 兼容性：使用 `google/gemini-3.1-flash-preview` 的旧版 OpenClaw 配置会被归一化为 `google/gemini-3-flash-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`
- 直连 Gemini 运行还接受 `agents.defaults.models["google/<model>"].params.cachedContent`
  （或旧版 `cached_content`），用于转发提供商原生的
  `cachedContents/...` 句柄；Gemini 缓存命中会以 OpenClaw `cacheRead` 形式呈现

### Google Vertex 和 Gemini CLI

- 提供商：`google-vertex`、`google-gemini-cli`
- 凭证：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程
- 注意：OpenClaw 中的 Gemini CLI OAuth 是非官方集成。一些用户报告在使用第三方客户端后遭到 Google 账号限制。若你选择继续，请先查看 Google 条款，并使用非关键账号。
- Gemini CLI OAuth 作为内置 `google` 插件的一部分提供。
  - 先安装 Gemini CLI：
    - `brew install gemini-cli`
    - 或 `npm install -g @google/gemini-cli`
  - 启用：`openclaw plugins enable google`
  - 登录：`openclaw models auth login --provider google-gemini-cli --set-default`
  - 默认模型：`google-gemini-cli/gemini-3.1-pro-preview`
  - 注意：你**不需要**把 client id 或 secret 粘贴到 `openclaw.json` 中。CLI 登录流程会将
    令牌存储在 Gateway 网关主机上的凭证配置档中。
  - 如果登录后请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  - Gemini CLI JSON 回复会从 `response` 解析；用量会回退到
    `stats`，其中 `stats.cached` 会被归一化为 OpenClaw `cacheRead`。

### Z.AI（GLM）

- 提供商：`zai`
- 凭证：`ZAI_API_KEY`
- 示例模型：`zai/glm-5`
- CLI：`openclaw onboard --auth-choice zai-api-key`
  - 别名：`z.ai/*` 和 `z-ai/*` 会归一化为 `zai/*`
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
- 静态回退目录附带 `kilocode/kilo/auto`；实时
  `https://api.kilo.ai/api/gateway/models` 发现可以进一步扩展运行时
  目录。
- `kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway
  决定，而不是在 OpenClaw 中硬编码。

设置详情请参见 [/providers/kilocode](/zh-CN/providers/kilocode)。

### 其他内置提供商插件

- OpenRouter：`openrouter`（`OPENROUTER_API_KEY`）
- 示例模型：`openrouter/auto`
- 只有当请求实际发送到 `openrouter.ai` 时，OpenClaw 才会应用 OpenRouter 文档中的应用归因请求头
- OpenRouter 特有的 Anthropic `cache_control` 标记同样只会应用到
  已验证的 OpenRouter 路由，而不是任意代理 URL
- OpenRouter 仍然走代理风格的 OpenAI 兼容路径，因此不会转发
  原生 OpenAI 专属的请求整形（`serviceTier`、Responses `store`、
  提示缓存提示、OpenAI 推理兼容载荷）
- 以 Gemini 为后端的 OpenRouter 引用仅保留代理 Gemini thought-signature 清理；
  原生 Gemini 重放校验和 bootstrap 重写仍然关闭
- Kilo Gateway：`kilocode`（`KILOCODE_API_KEY`）
- 示例模型：`kilocode/kilo/auto`
- 以 Gemini 为后端的 Kilo 引用保留相同的代理 Gemini thought-signature
  清理路径；`kilocode/kilo/auto` 和其他不支持代理推理的提示
  会跳过代理推理注入
- MiniMax：`minimax`（API 密钥）和 `minimax-portal`（OAuth）
- 凭证：`MINIMAX_API_KEY` 用于 `minimax`；`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY` 用于 `minimax-portal`
- 示例模型：`minimax/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7`
- MiniMax 新手引导/API 密钥设置会写入显式的 M2.7 模型定义，
  其中 `input: ["text", "image"]`；内置提供商目录会在
  该提供商配置具体化之前将聊天引用保持为纯文本
- Moonshot：`moonshot`（`MOONSHOT_API_KEY`）
- 示例模型：`moonshot/kimi-k2.5`
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
- BytePlus（国际版）：`byteplus`（`BYTEPLUS_API_KEY`）
- 示例模型：`byteplus-plan/ark-code-latest`
- xAI：`xai`（`XAI_API_KEY`）
  - 原生内置 xAI 请求使用 xAI Responses 路径
  - `/fast` 或 `params.fastMode: true` 会将 `grok-3`、`grok-3-mini`、
    `grok-4` 和 `grok-4-0709` 重写为对应的 `*-fast` 变体
  - `tool_stream` 默认开启；设置
    `agents.defaults.models["xai/<model>"].params.tool_stream` 为 `false` 可
    关闭它
- Mistral：`mistral`（`MISTRAL_API_KEY`）
- 示例模型：`mistral/mistral-large-latest`
- CLI：`openclaw onboard --auth-choice mistral-api-key`
- Groq：`groq`（`GROQ_API_KEY`）
- Cerebras：`cerebras`（`CEREBRAS_API_KEY`）
  - Cerebras 上的 GLM 模型使用 id `zai-glm-4.7` 和 `zai-glm-4.6`。
  - OpenAI 兼容 base URL：`https://api.cerebras.ai/v1`。
- GitHub Copilot：`github-copilot`（`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`）
- Hugging Face Inference 示例模型：`huggingface/deepseek-ai/DeepSeek-R1`；CLI：`openclaw onboard --auth-choice huggingface-api-key`。请参见 [Hugging Face（Inference）](/zh-CN/providers/huggingface)。

## 通过 `models.providers` 配置的提供商（自定义/base URL）

使用 `models.providers`（或 `models.json`）来添加**自定义**提供商或
OpenAI/Anthropic 兼容代理。

下方许多内置提供商插件已经发布了默认目录。
只有当你想覆盖默认 base URL、请求头或模型列表时，
才需要显式使用 `models.providers.<id>` 条目。

### Moonshot AI（Kimi）

Moonshot 作为内置提供商插件提供。默认应使用内置提供商，
只有在你需要覆盖 base URL 或模型元数据时，才添加显式的 `models.providers.moonshot` 条目：

- 提供商：`moonshot`
- 凭证：`MOONSHOT_API_KEY`
- 示例模型：`moonshot/kimi-k2.5`
- CLI：`openclaw onboard --auth-choice moonshot-api-key` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 模型 ID：

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
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

旧版 `kimi/k2p5` 仍然作为兼容模型 id 被接受。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）为中国用户提供对 Doubao 及其他模型的访问。

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

新手引导默认使用编码界面，但通用 `volcengine/*`
目录也会同时注册。

在新手引导/配置模型选择器中，Volcengine 凭证选择会优先显示
`volcengine/*` 和 `volcengine-plan/*` 两类条目。如果这些模型尚未加载，
OpenClaw 会回退到未过滤目录，而不是显示一个空的
提供商范围选择器。

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

新手引导默认使用编码界面，但通用 `byteplus/*`
目录也会同时注册。

在新手引导/配置模型选择器中，BytePlus 凭证选择会优先显示
`byteplus/*` 和 `byteplus-plan/*` 两类条目。如果这些模型尚未加载，
OpenClaw 会回退到未过滤目录，而不是显示一个空的
提供商范围选择器。

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
- MiniMax API 密钥（Global）：`--auth-choice minimax-global-api`
- MiniMax API 密钥（CN）：`--auth-choice minimax-cn-api`
- 凭证：`MINIMAX_API_KEY` 用于 `minimax`；`MINIMAX_OAUTH_TOKEN` 或
  `MINIMAX_API_KEY` 用于 `minimax-portal`

设置详情、模型选项和配置片段请参见 [/providers/minimax](/zh-CN/providers/minimax)。

在 MiniMax 的 Anthropic 兼容流式路径上，OpenClaw 默认禁用 thinking，
除非你显式设置它，并且 `/fast on` 会将
`MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

由插件拥有的能力划分：

- 文本/聊天默认保持在 `minimax/MiniMax-M2.7`
- 图像生成是 `minimax/image-01` 或 `minimax-portal/image-01`
- 图像理解是在两个 MiniMax 凭证路径上都由插件拥有的 `MiniMax-VL-01`
- Web 搜索仍然使用提供商 id `minimax`

### Ollama

Ollama 作为内置提供商插件提供，并使用 Ollama 的原生 API：

- 提供商：`ollama`
- 凭证：无需（本地服务器）
- 示例模型：`ollama/llama3.3`
- 安装：[https://ollama.com/download](https://ollama.com/download)

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

当你通过 `OLLAMA_API_KEY` 选择加入时，Ollama 会在本地 `http://127.0.0.1:11434` 被检测到，
并且内置提供商插件会将 Ollama 直接添加到
`openclaw onboard` 和模型选择器中。关于新手引导、云端/本地模式以及自定义配置，请参见 [/providers/ollama](/zh-CN/providers/ollama)。

### vLLM

vLLM 作为内置提供商插件提供，用于本地/自托管的 OpenAI 兼容
服务器：

- 提供商：`vllm`
- 凭证：可选（取决于你的服务器）
- 默认 base URL：`http://127.0.0.1:8000/v1`

若要在本地选择加入自动发现（如果你的服务器不强制凭证，任意值都可以）：

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

SGLang 作为内置提供商插件提供，用于高速自托管的
OpenAI 兼容服务器：

- 提供商：`sglang`
- 凭证：可选（取决于你的服务器）
- 默认 base URL：`http://127.0.0.1:30000/v1`

若要在本地选择加入自动发现（如果你的服务器不
强制凭证，任意值都可以）：

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
        apiKey: "LMSTUDIO_KEY",
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
- 对于非原生端点上的 `api: "openai-completions"`（任何主机不是 `api.openai.com` 的非空 `baseUrl`），OpenClaw 会强制 `compat.supportsDeveloperRole: false`，以避免提供商因不支持 `developer` 角色而返回 400 错误。
- 代理风格的 OpenAI 兼容路由也会跳过原生 OpenAI 专属的请求
  整形：没有 `service_tier`、没有 Responses `store`、没有提示缓存提示、没有
  OpenAI 推理兼容载荷整形，也没有隐藏的 OpenClaw 归因
  请求头。
- 如果 `baseUrl` 为空或省略，OpenClaw 会保留默认 OpenAI 行为（即解析到 `api.openai.com`）。
- 出于安全考虑，即使显式设置了 `compat.supportsDeveloperRole: true`，在非原生 `openai-completions` 端点上仍会被覆盖。

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
- [Providers](/zh-CN/providers) — 各提供商设置指南
