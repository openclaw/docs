---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想为 OpenClaw 添加一个兼容 OpenAI 的代理或自定义 LLM
    - 你需要了解提供商认证、目录和运行时 hooks
sidebarTitle: Provider Plugins
summary: 在 OpenClaw 中构建模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-04-06T12:45:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e7402742c87cb31265db1d98b34ca17ba57ad1c61952fa8c7da834306986f5
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# 构建提供商插件

本指南将带你构建一个提供商插件，为 OpenClaw 添加一个模型提供商
（LLM）。完成后，你将拥有一个具备模型目录、
API 密钥认证和动态模型解析能力的提供商。

<Info>
  如果你之前从未构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins) 了解基本包
  结构和清单设置。
</Info>

## 操作演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    清单声明了 `providerAuthEnvVars`，这样 OpenClaw 就可以在不加载你的插件运行时的情况下检测
    凭证。`modelSupport` 是可选的，
    它让 OpenClaw 能够在运行时 hooks 存在之前，从像
    `acme-large` 这样的简写模型 id 自动加载你的提供商插件。如果你在
    ClawHub 上发布该提供商，那么 `package.json` 中的
    `openclaw.compat` 和 `openclaw.build` 字段
    是必需的。

  </Step>

  <Step title="注册提供商">
    一个最小可用的提供商需要 `id`、`label`、`auth` 和 `catalog`：

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    这样就是一个可工作的提供商。用户现在可以
    `openclaw onboard --acme-ai-api-key <key>` 并选择
    `acme-ai/acme-large` 作为他们的模型。

    对于只注册一个文本提供商、使用 API 密钥
    认证且只有单个基于目录的运行时的内置提供商，优先使用更窄的
    `defineSingleProviderPluginEntry(...)` 帮助器：

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    如果你的认证流程在新手引导期间还需要修补 `models.providers.*`、别名以及
    智能体默认模型，请使用
    `openclaw/plugin-sdk/provider-onboard` 中的 preset 帮助器。最窄的帮助器是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    当某个提供商的原生端点在普通
    `openai-completions` 传输上支持分块流式传输 usage blocks 时，优先使用
    `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录帮助器，而不是硬编码
    provider-id 检查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 会从端点 capability 映射中检测支持情况，因此即使插件使用自定义 provider id，原生 Moonshot/DashScope 风格的端点仍可选择启用。

  </Step>

  <Step title="添加动态模型解析">
    如果你的提供商接受任意模型 ID（例如代理或路由器），
    请添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    如果解析需要网络调用，请使用 `prepareDynamicModel` 进行异步
    预热 —— 完成后会再次运行 `resolveDynamicModel`。

  </Step>

  <Step title="按需添加运行时 hooks">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。随着你的提供商需求增加，
    再逐步添加 hooks。

    共享帮助器构建器现在已经覆盖最常见的 replay/tool-compat
    系列，因此插件通常不需要手动逐个接线每个 hook：

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    当前可用的 replay families：

    | Family | 它会接入什么 |
    | --- | --- |
    | `openai-compatible` | 面向 OpenAI 兼容传输的共享 OpenAI 风格 replay 策略，包括 tool-call-id 清理、assistant-first 顺序修复，以及在传输需要时启用通用 Gemini turn 验证 |
    | `anthropic-by-model` | 按 `modelId` 选择的 Claude 感知 replay 策略，因此 Anthropic-message 传输仅在解析后的模型实际是 Claude id 时才会获得 Claude 特定的 thinking-block 清理 |
    | `google-gemini` | 原生 Gemini replay 策略，加上 bootstrap replay 清理和带标签的 reasoning-output 模式 |
    | `passthrough-gemini` | 针对通过 OpenAI 兼容代理传输运行的 Gemini 模型的 Gemini thought-signature 清理；不会启用原生 Gemini replay 验证或 bootstrap 重写 |
    | `hybrid-anthropic-openai` | 适用于在一个插件中混合 Anthropic-message 和 OpenAI 兼容模型面的提供商的混合策略；可选的仅 Claude thinking-block 丢弃仍然限定在 Anthropic 一侧 |

    真实的内置示例：

    - `google` 和 `google-gemini-cli`：`google-gemini`
    - `openrouter`、`kilocode`、`opencode` 和 `opencode-go`：`passthrough-gemini`
    - `amazon-bedrock` 和 `anthropic-vertex`：`anthropic-by-model`
    - `minimax`：`hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai` 和 `zai`：`openai-compatible`

    当前可用的 stream families：

    | Family | 它会接入什么 |
    | --- | --- |
    | `google-thinking` | 共享流路径上的 Gemini thinking 负载规范化 |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo reasoning 包装器，其中 `kilo/auto` 和不受支持的代理 reasoning id 会跳过注入的 thinking |
    | `moonshot-thinking` | 根据配置 + `/think` 级别进行 Moonshot 二进制原生 thinking 负载映射 |
    | `minimax-fast-mode` | 共享流路径上的 MiniMax fast-mode 模型重写 |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses 包装器：归因头、`/fast`/`serviceTier`、文本详细程度、原生 Codex web search、reasoning-compat 负载整形，以及 Responses 上下文管理 |
    | `openrouter-thinking` | 面向代理路由的 OpenRouter reasoning 包装器，并由中心统一处理不支持的模型/`auto` 跳过 |
    | `tool-stream-default-on` | 对于像 Z.AI 这类希望默认启用工具流式传输的提供商，在未显式禁用时默认开启 `tool_stream` 的包装器 |

    真实的内置示例：

    - `google` 和 `google-gemini-cli`：`google-thinking`
    - `kilocode`：`kilocode-thinking`
    - `moonshot`：`moonshot-thinking`
    - `minimax` 和 `minimax-portal`：`minimax-fast-mode`
    - `openai` 和 `openai-codex`：`openai-responses-defaults`
    - `openrouter`：`openrouter-thinking`
    - `zai`：`tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` 还会导出 replay-family
    枚举，以及这些 family 所构建于其上的共享帮助器。常见公开导出包括：

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - 共享 replay 构建器，例如 `buildOpenAICompatibleReplayPolicy(...)`、
      `buildAnthropicReplayPolicyForModel(...)`、
      `buildGoogleGeminiReplayPolicy(...)` 和
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini replay 帮助器，例如 `sanitizeGoogleGeminiReplayHistory(...)`
      和 `resolveTaggedReasoningOutputMode()`
    - 端点/模型帮助器，例如 `resolveProviderEndpoint(...)`、
      `normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)` 和
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` 同时公开 family 构建器以及这些 family 复用的公共包装器帮助器。常见公开导出
    包括：

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - 共享 OpenAI/Codex 包装器，例如
      `createOpenAIAttributionHeadersWrapper(...)`、
      `createOpenAIFastModeWrapper(...)`、
      `createOpenAIServiceTierWrapper(...)`、
      `createOpenAIResponsesContextManagementWrapper(...)` 和
      `createCodexNativeWebSearchWrapper(...)`
    - 共享代理/提供商包装器，例如 `createOpenRouterWrapper(...)`、
      `createToolStreamWrapper(...)` 和 `createMinimaxFastModeWrapper(...)`

    一些 stream 帮助器会有意保持为 provider-local。当前内置
    示例：`@openclaw/anthropic-provider` 从其公共 `api.ts` /
    `contract-api.ts` 接缝导出
    `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及更底层的 Anthropic 包装器构建器。
    这些帮助器仍保持 Anthropic 特定，因为
    它们还编码了 Claude OAuth beta 处理和 `context1m` gating。

    其他内置提供商也会在行为无法跨 family 清晰共享时，将
    transport-specific 包装器保留在本地。当前示例：内置 xAI 插件将原生 xAI Responses 整形保留在其自己的
    `wrapStreamFn` 中，包括 `/fast` 别名重写、默认 `tool_stream`、
    不支持的 strict-tool 清理，以及 xAI 特有的 reasoning-payload
    移除。

    `openclaw/plugin-sdk/provider-tools` 当前公开一个共享
    tool-schema family 以及共享 schema/compat 帮助器：

    - `ProviderToolCompatFamily` 记录了当前共享 family 清单。
    - `buildProviderToolCompatFamilyHooks("gemini")` 会为需要 Gemini 安全工具 schema 的提供商接入 Gemini schema
      清理 + 诊断。
    - `normalizeGeminiToolSchemas(...)` 和 `inspectGeminiToolSchemas(...)`
      是底层的公共 Gemini schema 帮助器。
    - `resolveXaiModelCompatPatch()` 返回内置 xAI compat patch：
      `toolSchemaProfile: "xai"`、不支持的 schema 关键字、原生
      `web_search` 支持，以及 HTML 实体 tool-call 参数解码。
    - `applyXaiModelCompat(model)` 会在解析后的模型进入 runner 之前，对其应用同样的 xAI compat patch。

    真实的内置示例：xAI 插件使用 `normalizeResolvedModel` 加上
    `contributeResolvedModelCompat`，使 compat 元数据归提供商所有，而不是在 core 中硬编码 xAI 规则。

    同样的 package-root 模式也支持其他内置提供商：

    - `@openclaw/openai-provider`：`api.ts` 导出提供商构建器、
      默认模型帮助器和实时提供商构建器
    - `@openclaw/openrouter-provider`：`api.ts` 导出提供商构建器
      以及 onboarding/配置帮助器

    <Tabs>
      <Tab title="令牌交换">
        对于需要在每次推理调用前执行令牌交换的提供商：

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="自定义请求头">
        对于需要自定义请求头或请求体修改的提供商：

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="原生传输身份">
        对于在通用 HTTP 或 WebSocket 传输上需要原生请求/会话头或元数据的提供商：

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Usage 和计费">
        对于暴露 usage/计费数据的提供商：

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="所有可用的提供商 hooks">
      OpenClaw 会按以下顺序调用 hooks。大多数提供商只会使用 2-3 个：

      | # | Hook | 何时使用 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或默认 `baseUrl` |
      | 2 | `applyConfigDefaults` | 配置物化期间由提供商拥有的全局默认值 |
      | 3 | `normalizeModelId` | 查找前对旧版/预览模型 id 别名进行清理 |
      | 4 | `normalizeTransport` | 通用模型组装前，对 provider-family 的 `api` / `baseUrl` 进行清理 |
      | 5 | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 对配置提供商执行原生流式 usage compat 重写 |
      | 7 | `resolveConfigApiKey` | 由提供商拥有的环境标记认证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或基于配置的 synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将 synthetic 存储配置文件占位符降级到 env/config auth 之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 解析前异步获取元数据 |
      | 12 | `normalizeResolvedModel` | runner 之前的传输重写 |

      运行时回退说明：

      - `normalizeConfig` 会先检查匹配的提供商，然后检查其他
        具备 hook 能力的提供商插件，直到其中某个插件实际更改配置。
        如果没有任何提供商 hook 重写受支持的 Google-family 配置条目，
        内置 Google 配置规范化仍会应用。
      - `resolveConfigApiKey` 会在公开时使用提供商 hook。内置
        `amazon-bedrock` 路径在这里也有内建的 AWS 环境标记解析器，
        尽管 Bedrock 运行时认证本身仍使用 AWS SDK 默认
        链。
      | 13 | `contributeResolvedModelCompat` | 为另一个兼容传输背后的厂商模型提供 compat 标志 |
      | 14 | `capabilities` | 旧版静态 capability 包；仅为兼容性保留 |
      | 15 | `normalizeToolSchemas` | 注册前由提供商拥有的工具 schema 清理 |
      | 16 | `inspectToolSchemas` | 由提供商拥有的工具 schema 诊断 |
      | 17 | `resolveReasoningOutputMode` | 带标签与原生 reasoning-output 契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义的 `StreamFn` 传输 |
      | 20 | `wrapStreamFn` | 普通流路径上的自定义头/请求体包装器 |
      | 21 | `resolveTransportTurnState` | 原生逐轮请求头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS 会话头/冷却时间 |
      | 23 | `formatApiKey` | 自定义运行时令牌形态 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 认证修复指导 |
      | 26 | `matchesContextOverflowError` | 由提供商拥有的溢出检测 |
      | 27 | `classifyFailoverReason` | 由提供商拥有的限流/过载分类 |
      | 28 | `isCacheTtlEligible` | 提示缓存 TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏过时的上游行 |
      | 31 | `augmentModelCatalog` | synthetic 前向兼容行 |
      | 32 | `isBinaryThinking` | 二进制 thinking 开/关 |
      | 33 | `supportsXHighThinking` | `xhigh` reasoning 支持 |
      | 34 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略 |
      | 35 | `isModernModelRef` | 实时/smoke 模型匹配 |
      | 36 | `prepareRuntimeAuth` | 推理前令牌交换 |
      | 37 | `resolveUsageAuth` | 自定义 usage 凭证解析 |
      | 38 | `fetchUsageSnapshot` | 自定义 usage 端点 |
      | 39 | `createEmbeddingProvider` | 用于内存/搜索的由提供商拥有的嵌入适配器 |
      | 40 | `buildReplayPolicy` | 自定义转录 replay/压缩策略 |
      | 41 | `sanitizeReplayHistory` | 通用清理之后的 provider-specific replay 重写 |
      | 42 | `validateReplayTurns` | 嵌入 runner 之前的严格 replay-turn 验证 |
      | 43 | `onModelSelected` | 选择后的回调（例如遥测） |

      提示词调优说明：

      - `resolveSystemPromptContribution` 允许提供商为某个模型 family 注入缓存感知的
        system-prompt 指导。对于属于某个提供商/模型
        family 且应保留稳定/动态缓存拆分的行为，
        优先使用它，而不是
        `before_prompt_build`。

      关于详细说明和真实示例，请参见
      [内部机制：提供商运行时 hooks](/zh-CN/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    <a id="step-5-add-extra-capabilities"></a>
    提供商插件除了文本推理之外，还可以注册语音、实时转录、实时
    语音、媒体理解、图像生成、视频生成、网页抓取
    和网页搜索：

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Realtime Voice",
        isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
        createBridge: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          setMediaTimestamp: () => {},
          submitToolResult: () => {},
          acknowledgeMark: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Fetch pages through Acme's rendering backend.",
        envVars: ["ACME_FETCH_API_KEY"],
        placeholder: "acme-...",
        signupUrl: "https://acme.example.com/fetch",
        credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
        getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
        setCredentialValue: (fetchConfigTarget, value) => {
          const acme = (fetchConfigTarget.acme ??= {});
          acme.apiKey = value;
        },
        createTool: () => ({
          description: "Fetch a page through Acme Fetch.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    OpenClaw 会将其归类为**混合能力**插件。这是
    公司级插件（每个厂商一个插件）的推荐模式。参见
    [内部机制：能力归属](/zh-CN/plugins/architecture#capability-ownership-model)。

    对于视频生成，优先使用上面展示的感知模式 capability 结构：
    `generate`、`imageToVideo` 和 `videoToVideo`。较旧的扁平字段，如
    `maxInputImages`、`maxInputVideos` 和 `maxDurationSeconds` 仍可作为聚合回退上限使用，
    但它们无法同样清晰地描述每种模式的限制或
    被禁用的转换模式。

  </Step>

  <Step title="测试">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## 发布到 ClawHub

提供商插件的发布方式与任何其他外部代码插件相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

这里不要使用旧版仅 Skills 的发布别名；插件包应使用
`clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 元数据
├── openclaw.plugin.json      # 带有 providerAuthEnvVars 的清单
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # Usage 端点（可选）
```

## 目录顺序参考

`catalog.order` 控制你的目录相对于内置
提供商何时合并：

| Order     | 时机 | 使用场景 |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一轮 | 纯 API 密钥提供商 |
| `profile` | 在 simple 之后 | 受 auth profiles 控制的提供商 |
| `paired`  | 在 profile 之后 | 合成多个相关条目 |
| `late`    | 最后一轮 | 覆盖现有提供商（冲突时胜出） |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 如果你的插件还提供一个渠道
- [插件运行时](/zh-CN/plugins/sdk-runtime) — `api.runtime` 帮助器（TTS、搜索、subagent）
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture#provider-runtime-hooks) — hook 细节和内置示例
