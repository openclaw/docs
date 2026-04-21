---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想为 OpenClaw 添加一个兼容 OpenAI 的代理或自定义 LLM
    - 你需要了解提供商认证、目录和运行时钩子
sidebarTitle: Provider Plugins
summary: 为 OpenClaw 构建模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-04-21T08:24:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08494658def4a003a1e5752f68d9232bfbbbf76348cf6f319ea1a6855c2ae439
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# 构建提供商插件

本指南将带你构建一个提供商插件，为 OpenClaw 添加一个模型提供商（LLM）。完成后，你将拥有一个带有模型目录、API 密钥认证和动态模型解析的提供商。

<Info>
  如果你之前没有构建过任何 OpenClaw 插件，请先阅读 [入门指南](/zh-CN/plugins/building-plugins)，了解基本的软件包结构和清单设置。
</Info>

<Tip>
  提供商插件会将模型添加到 OpenClaw 的常规推理循环中。如果该模型必须通过一个原生智能体守护进程来运行，并由它负责线程、压缩或工具事件，请将该提供商与一个 [智能体 harness](/zh-CN/plugins/sdk-agent-harness) 搭配使用，而不是把守护进程协议细节放进核心中。
</Tip>

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="软件包和清单">
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
      "description": "Acme AI 模型提供商",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API 密钥",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API 密钥"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    清单声明了 `providerAuthEnvVars`，这样 OpenClaw 就可以在不加载你的插件运行时的情况下检测凭证。当某个提供商变体应复用另一个提供商 id 的认证时，添加 `providerAuthAliases`。`modelSupport` 是可选的，它允许 OpenClaw 在运行时钩子存在之前，就通过像 `acme-large` 这样的简写模型 id 自动加载你的提供商插件。如果你要在 ClawHub 上发布该提供商，那么 `package.json` 中的这些 `openclaw.compat` 和 `openclaw.build` 字段是必需的。

  </Step>

  <Step title="注册提供商">
    一个最小化的提供商需要 `id`、`label`、`auth` 和 `catalog`：

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI 模型提供商",
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
              label: "Acme AI API 密钥",
              hint: "来自你的 Acme AI 控制台的 API 密钥",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "输入你的 Acme AI API 密钥",
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

    这就是一个可工作的提供商。用户现在可以运行 `openclaw onboard --acme-ai-api-key <key>`，并选择 `acme-ai/acme-large` 作为他们的模型。

    如果上游提供商使用的控制令牌与 OpenClaw 不同，请添加一个小型的双向文本转换，而不是替换流路径：

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` 会在传输之前重写最终系统提示和文本消息内容。`output` 会在 OpenClaw 解析其自身控制标记或进行渠道投递之前，重写助手文本增量和最终文本。

    对于那些只注册一个带 API 密钥认证且附带单个目录支持运行时的文本提供商的内置提供商，优先使用更窄的 `defineSingleProviderPluginEntry(...)` 辅助函数：

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI 模型提供商",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API 密钥",
            hint: "来自你的 Acme AI 控制台的 API 密钥",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "输入你的 Acme AI API 密钥",
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

    如果你的认证流程在新手引导期间还需要修补 `models.providers.*`、别名以及智能体默认模型，请使用 `openclaw/plugin-sdk/provider-onboard` 中的预设辅助函数。最窄的辅助函数包括 `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)` 和 `createModelCatalogPresetAppliers(...)`。

    当某个提供商的原生端点在常规 `openai-completions` 传输上支持流式 usage 块时，优先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助函数，而不是硬编码提供商 id 检查。`supportsNativeStreamingUsageCompat(...)` 和 `applyProviderNativeStreamingUsageCompat(...)` 会根据端点能力映射检测支持情况，因此原生 Moonshot/DashScope 风格的端点即使插件使用的是自定义提供商 id，也仍然可以选择启用。

  </Step>

  <Step title="添加动态模型解析">
    如果你的提供商接受任意模型 id（比如代理或路由器），请添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... 上面的 id、label、auth、catalog

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

    如果解析需要进行网络调用，请使用 `prepareDynamicModel` 来进行异步预热——在它完成后，`resolveDynamicModel` 会再次运行。

  </Step>

  <Step title="添加运行时钩子（按需）">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。随着你的提供商需求增加，再逐步添加钩子。

    共享辅助构建器现在已经覆盖了最常见的重放/工具兼容性家族，因此插件通常不需要再逐个手动连接每个钩子：

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

    当前可用的重放家族：

    | 家族 | 会接入的内容 |
    | --- | --- |
    | `openai-compatible` | 面向兼容 OpenAI 的传输的共享 OpenAI 风格重放策略，包括工具调用 id 清理、assistant 优先顺序修复，以及传输所需的通用 Gemini 轮次校验 |
    | `anthropic-by-model` | 按 `modelId` 选择的 Claude 感知重放策略，因此基于 Anthropic 消息的传输只有在解析后的模型确实是 Claude id 时，才会获得 Claude 专用的思维块清理 |
    | `google-gemini` | 原生 Gemini 重放策略，加上 bootstrap 重放清理和带标签的推理输出模式 |
    | `passthrough-gemini` | 面向通过兼容 OpenAI 的代理传输运行的 Gemini 模型的 Gemini thought-signature 清理；不会启用原生 Gemini 重放校验或 bootstrap 重写 |
    | `hybrid-anthropic-openai` | 用于在一个插件中混合 Anthropic 消息和兼容 OpenAI 模型表面的提供商的混合策略；可选的仅 Claude 思维块丢弃仍然限定在 Anthropic 一侧 |

    真实的内置示例：

    - `google` 和 `google-gemini-cli`：`google-gemini`
    - `openrouter`、`kilocode`、`opencode` 和 `opencode-go`：`passthrough-gemini`
    - `amazon-bedrock` 和 `anthropic-vertex`：`anthropic-by-model`
    - `minimax`：`hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai` 和 `zai`：`openai-compatible`

    当前可用的流家族：

    | 家族 | 会接入的内容 |
    | --- | --- |
    | `google-thinking` | 在共享流路径上进行 Gemini thinking 负载规范化 |
    | `kilocode-thinking` | 在共享代理流路径上为 Kilo 推理提供包装器，并且会为 `kilo/auto` 和不支持的代理推理 id 跳过注入的 thinking |
    | `moonshot-thinking` | 根据配置和 `/think` 级别，对 Moonshot 二进制原生 thinking 负载进行映射 |
    | `minimax-fast-mode` | 在共享流路径上进行 MiniMax fast-mode 模型重写 |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses 包装器：归因头、`/fast`/`serviceTier`、文本详细程度、原生 Codex web 搜索、推理兼容负载整形，以及 Responses 上下文管理 |
    | `openrouter-thinking` | 面向代理路由的 OpenRouter 推理包装器，并集中处理不支持模型/`auto` 跳过 |
    | `tool-stream-default-on` | 面向像 Z.AI 这样希望默认启用工具流式传输、除非显式禁用的提供商的默认开启 `tool_stream` 包装器 |

    真实的内置示例：

    - `google` 和 `google-gemini-cli`：`google-thinking`
    - `kilocode`：`kilocode-thinking`
    - `moonshot`：`moonshot-thinking`
    - `minimax` 和 `minimax-portal`：`minimax-fast-mode`
    - `openai` 和 `openai-codex`：`openai-responses-defaults`
    - `openrouter`：`openrouter-thinking`
    - `zai`：`tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` 还导出了 replay family 枚举，以及这些家族所基于的共享辅助函数。常见的公共导出包括：

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - 共享 replay 构建器，例如 `buildOpenAICompatibleReplayPolicy(...)`、`buildAnthropicReplayPolicyForModel(...)`、`buildGoogleGeminiReplayPolicy(...)` 和 `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini replay 辅助函数，例如 `sanitizeGoogleGeminiReplayHistory(...)` 和 `resolveTaggedReasoningOutputMode()`
    - 端点/模型辅助函数，例如 `resolveProviderEndpoint(...)`、`normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)` 和 `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` 同时公开了 family 构建器，以及这些家族复用的公共包装器辅助函数。常见的公共导出包括：

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - 共享的 OpenAI/Codex 包装器，例如 `createOpenAIAttributionHeadersWrapper(...)`、`createOpenAIFastModeWrapper(...)`、`createOpenAIServiceTierWrapper(...)`、`createOpenAIResponsesContextManagementWrapper(...)` 和 `createCodexNativeWebSearchWrapper(...)`
    - 共享的代理/提供商包装器，例如 `createOpenRouterWrapper(...)`、`createToolStreamWrapper(...)` 和 `createMinimaxFastModeWrapper(...)`

    一些流辅助函数会有意保持为提供商本地。当前的内置示例：`@openclaw/anthropic-provider` 通过其公共 `api.ts` / `contract-api.ts` 接缝导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及更底层的 Anthropic 包装器构建器。这些辅助函数仍然保持 Anthropic 专属，因为它们还编码了 Claude OAuth beta 处理和 `context1m` 门控。

    其他内置提供商也会在行为无法在各家族之间清晰共享时，将传输专用包装器保留在本地。当前示例：内置 xAI 插件将原生 xAI Responses 整形保留在自己的 `wrapStreamFn` 中，包括 `/fast` 别名重写、默认 `tool_stream`、不支持的严格工具清理，以及 xAI 专属的推理负载移除。

    `openclaw/plugin-sdk/provider-tools` 当前公开了一个共享工具模式家族，以及共享的 schema/兼容性辅助函数：

    - `ProviderToolCompatFamily` 记录了当前的共享 family 清单。
    - `buildProviderToolCompatFamilyHooks("gemini")` 会为需要 Gemini 安全工具 schema 的提供商接入 Gemini schema 清理 + 诊断。
    - `normalizeGeminiToolSchemas(...)` 和 `inspectGeminiToolSchemas(...)` 是底层的公共 Gemini schema 辅助函数。
    - `resolveXaiModelCompatPatch()` 返回内置的 xAI compat patch：`toolSchemaProfile: "xai"`、不支持的 schema 关键字、原生 `web_search` 支持，以及 HTML 实体工具调用参数解码。
    - `applyXaiModelCompat(model)` 会在解析后的模型到达运行器之前，对其应用同一个 xAI compat patch。

    真实的内置示例：xAI 插件使用 `normalizeResolvedModel` 加上 `contributeResolvedModelCompat`，以便让这份兼容性元数据由提供商自己维护，而不是在核心中硬编码 xAI 规则。

    同样的软件包根模式也支撑着其他内置提供商：

    - `@openclaw/openai-provider`：`api.ts` 导出提供商构建器、默认模型辅助函数以及实时提供商构建器
    - `@openclaw/openrouter-provider`：`api.ts` 导出提供商构建器以及新手引导/配置辅助函数

    <Tabs>
      <Tab title="令牌交换">
        对于那些需要在每次推理调用之前进行令牌交换的提供商：

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
        对于那些需要自定义请求头或请求体修改的提供商：

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
        对于那些需要在通用 HTTP 或 WebSocket 传输上添加原生请求/会话头或元数据的提供商：

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
      <Tab title="用量和计费">
        对于那些暴露用量/计费数据的提供商：

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

    <Accordion title="所有可用的提供商钩子">
      OpenClaw 会按这个顺序调用钩子。大多数提供商只会用到 2–3 个：

      | # | 钩子 | 何时使用 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或默认 `baseUrl` |
      | 2 | `applyConfigDefaults` | 在配置实体化期间应用由提供商拥有的全局默认值 |
      | 3 | `normalizeModelId` | 在查找前清理旧版/预览版模型 id 别名 |
      | 4 | `normalizeTransport` | 在通用模型组装前清理 provider-family `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 针对配置提供商的原生流式 usage compat 重写 |
      | 7 | `resolveConfigApiKey` | 由提供商拥有的 env-marker 认证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或基于配置的合成认证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 让 env/config 认证优先于较低级别的合成已存储配置文件占位符 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 id |
      | 11 | `prepareDynamicModel` | 解析前异步获取元数据 |
      | 12 | `normalizeResolvedModel` | 在进入运行器之前进行传输重写 |

    运行时回退说明：

    - `normalizeConfig` 会先检查匹配的提供商，然后检查其他支持钩子的提供商插件，直到有一个实际更改了配置。
      如果没有任何提供商钩子重写受支持的 Google family 配置项，内置的 Google 配置规范化器仍会生效。
    - `resolveConfigApiKey` 在提供商暴露该钩子时会使用提供商钩子。内置的 `amazon-bedrock` 路径在这里也有一个内建的 AWS env-marker 解析器，尽管 Bedrock 运行时认证本身仍然使用 AWS SDK 默认链。
      | 13 | `contributeResolvedModelCompat` | 为通过其他兼容传输提供的厂商模型提供 compat 标志 |
      | 14 | `capabilities` | 旧版静态能力包；仅用于兼容性 |
      | 15 | `normalizeToolSchemas` | 在注册前进行由提供商拥有的工具 schema 清理 |
      | 16 | `inspectToolSchemas` | 由提供商拥有的工具 schema 诊断 |
      | 17 | `resolveReasoningOutputMode` | 带标签与原生推理输出契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义的 StreamFn 传输 |
      | 20 | `wrapStreamFn` | 常规流路径上的自定义头/请求体包装器 |
      | 21 | `resolveTransportTurnState` | 原生逐轮请求头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS 会话头/冷却时间 |
      | 23 | `formatApiKey` | 自定义运行时令牌形态 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 认证修复指引 |
      | 26 | `matchesContextOverflowError` | 由提供商拥有的溢出检测 |
      | 27 | `classifyFailoverReason` | 由提供商拥有的限流/过载分类 |
      | 28 | `isCacheTtlEligible` | 提示缓存 TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏过时的上游条目 |
      | 31 | `augmentModelCatalog` | 合成的前向兼容条目 |
      | 32 | `resolveThinkingProfile` | 模型专属 `/think` 选项集 |
      | 33 | `isBinaryThinking` | 二进制 thinking 开/关兼容性 |
      | 34 | `supportsXHighThinking` | `xhigh` 推理支持兼容性 |
      | 35 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略兼容性 |
      | 36 | `isModernModelRef` | 实时/smoke 模型匹配 |
      | 37 | `prepareRuntimeAuth` | 推理前进行令牌交换 |
      | 38 | `resolveUsageAuth` | 自定义用量凭证解析 |
      | 39 | `fetchUsageSnapshot` | 自定义用量端点 |
      | 40 | `createEmbeddingProvider` | 用于 memory/search 的提供商自有嵌入适配器 |
      | 41 | `buildReplayPolicy` | 自定义转录重放/压缩策略 |
      | 42 | `sanitizeReplayHistory` | 在通用清理之后进行提供商专属 replay 重写 |
      | 43 | `validateReplayTurns` | 在嵌入式运行器之前进行严格的 replay-turn 校验 |
      | 44 | `onModelSelected` | 选择模型后的回调（例如遥测） |

      提示调优说明：

      - `resolveSystemPromptContribution` 允许提供商为某个模型 family 注入具备缓存感知能力的系统提示指引。如果该行为属于某个单独的提供商/模型 family，并且应保留稳定/动态缓存拆分，优先使用它，而不是 `before_prompt_build`。

      如需详细说明和真实示例，请参阅 [内部机制：提供商运行时钩子](/zh-CN/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    <a id="step-5-add-extra-capabilities"></a>
    提供商插件除了文本推理之外，还可以注册语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取和 web 搜索：

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
        hint: "通过 Acme 的渲染后端抓取页面。",
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
          description: "通过 Acme Fetch 抓取页面。",
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

    OpenClaw 将这类插件归类为 **hybrid-capability** 插件。这是公司级插件（每个厂商一个插件）的推荐模式。参见 [内部机制：能力归属](/zh-CN/plugins/architecture#capability-ownership-model)。

    对于视频生成，优先使用上面展示的按模式区分的能力结构：`generate`、`imageToVideo` 和 `videoToVideo`。像 `maxInputImages`、`maxInputVideos` 和 `maxDurationSeconds` 这样的扁平聚合字段不足以清晰地声明变换模式支持或已禁用模式。

    音乐生成提供商也应遵循相同模式：`generate` 用于仅基于提示词的生成，`edit` 用于基于参考图像的生成。像 `maxInputImages`、`supportsLyrics` 和 `supportsFormat` 这样的扁平聚合字段不足以声明 edit 支持；显式的 `generate` / `edit` 块才是预期契约。

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

提供商插件的发布方式与其他外部代码插件相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

这里不要使用旧版的仅限 skill 的发布别名；插件包应使用 `clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 元数据
├── openclaw.plugin.json      # 带提供商认证元数据的清单
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # 用量端点（可选）
```

## 目录顺序参考

`catalog.order` 控制你的目录相对于内置提供商何时合并：

| 顺序 | 时机 | 使用场景 |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一轮 | 纯 API 密钥提供商 |
| `profile` | 在 simple 之后 | 受认证配置文件控制的提供商 |
| `paired`  | 在 profile 之后 | 合成多个相关条目 |
| `late`    | 最后一轮 | 覆盖现有提供商（冲突时胜出） |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 如果你的插件也提供一个渠道
- [SDK 概览](/zh-CN/plugins/sdk-runtime) — `api.runtime` 辅助函数（TTS、搜索、子智能体）
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整的子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture#provider-runtime-hooks) — 钩子细节和内置示例
