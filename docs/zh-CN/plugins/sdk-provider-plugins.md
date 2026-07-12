---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想要向 OpenClaw 添加兼容 OpenAI 的代理或自定义大语言模型
    - 你需要了解提供商身份验证、目录和运行时钩子
sidebarTitle: Provider plugins
summary: 为 OpenClaw 构建模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-07-11T20:48:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

构建一个提供商插件，为 OpenClaw 添加模型提供商（LLM）：模型目录、API 密钥身份验证和动态模型解析。

<Info>
  初次接触 OpenClaw 插件？请先阅读[入门指南](/zh-CN/plugins/building-plugins)，了解包结构和清单设置。
</Info>

<Tip>
  提供商插件会将模型添加到 OpenClaw 的常规推理循环中。如果模型必须通过原生智能体守护进程运行，且该守护进程负责线程、压缩或工具事件，请将提供商与 [Agent harness](/zh-CN/plugins/sdk-agent-harness) 配合使用，而不要将守护进程协议的细节放入核心。
</Tip>

## 操作演示

<Steps>
  <Step title="包和清单">
    ### 第 1 步：包和清单

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
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
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

    `setup.providers[].envVars` 让 OpenClaw 无需加载插件运行时即可检测凭据。当某个提供商变体需要复用另一个提供商 ID 的身份验证时，请添加 `providerAuthAliases`。`modelSupport` 是可选项，它允许 OpenClaw 在运行时钩子存在之前，根据 `acme-large` 这类简写模型 ID 自动加载你的提供商插件。ClawHub 发布要求 `package.json` 中包含 `openclaw.compat` 和 `openclaw.build`（两个必填字段为 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`；省略 `minGatewayVersion` 时，将回退到 `openclaw.install.minHostVersion`）。

  </Step>

  <Step title="注册提供商">
    最小的文本提供商需要 `id`、`label`、`auth` 和 `catalog`。`catalog` 是由提供商负责的运行时/配置钩子；它可以调用实时供应商 API，并返回 `models.providers` 条目。

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

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` 是较新的控制平面目录接口，用于列表、帮助和选择器 UI，涵盖 `text`、`voice`、`image_generation`、`video_generation` 和 `music_generation` 行。请将供应商端点调用和响应映射保留在插件中；OpenClaw 负责共享的行结构、来源标签和帮助内容渲染。

    至此，一个可用的提供商已经完成。用户现在可以运行 `openclaw onboard --acme-ai-api-key <key>`，并选择 `acme-ai/acme-large` 作为模型。

    ### 实时模型发现

    如果你的提供商公开了 `/models` 风格的 API，请将提供商特定的端点和行映射保留在插件中，并使用 `openclaw/plugin-sdk/provider-catalog-live-runtime` 处理共享的获取生命周期。该辅助工具提供受保护的 HTTP 获取、提供商身份验证请求头、结构化 HTTP 错误、TTL 缓存和静态回退行为，无需将提供商策略放入 OpenClaw 核心。

    当实时 API 仅告知你当前有哪些由提供商负责的静态目录行可用时，请使用 `buildLiveModelProviderConfig`：

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
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
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    当提供商 API 返回更丰富的元数据，且插件需要自行将行映射为 OpenClaw 模型定义时，请使用 `getCachedLiveProviderModelRows`：

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` 应始终由身份验证控制，并在没有可用凭据时返回 `null`。请保留离线 `staticRun` 或静态回退，以便设置、文档、测试和选择器界面不依赖实时网络访问。请根据模型列表的新鲜度要求采用合适的 TTL，避免在请求处理期间轮询文件系统，并且仅当上游响应并非 OpenAI 兼容的 `{ data: [{ id, object }] }` 结构时，才传入提供商特定的 `readRows` / `readModelId`。

    如果上游提供商使用的控制令牌与 OpenClaw 不同，请添加一个小型双向文本转换，而不是替换流式传输路径：

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

    `input` 会在传输前重写最终系统提示词和文本消息内容。`output` 会在 OpenClaw 解析自身控制标记或向渠道投递之前，重写助手文本增量和最终文本。

    对于仅注册一个文本提供商，采用 API 密钥身份验证且只有单个目录支持运行时的内置提供商，优先使用范围更窄的 `defineSingleProviderPluginEntry(...)` 辅助工具：

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
            hint: "来自你的 Acme AI 控制面板的 API 密钥",
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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` 是 OpenClaw 能够解析真实提供商身份验证信息时使用的实时目录路径。
    它可以执行提供商特定的发现。仅将 `buildStaticProvider` 用于配置身份验证之前
    可安全显示的离线条目；它不得要求凭据或发出网络请求。
    OpenClaw 的 `models list --all` 显示目前仅对内置提供商插件执行静态目录，
    并使用空配置、空环境变量且不提供智能体/工作区路径。

    如果你的身份验证流程还需要在新手引导期间修补 `models.providers.*`、别名和
    智能体默认模型，请使用 `openclaw/plugin-sdk/provider-onboard` 中的预设辅助函数。
    范围最小的辅助函数是 `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    当提供商的原生端点在常规 `openai-completions` 传输上支持流式用量块时，
    应优先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助函数，
    而不是硬编码提供商 ID 检查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 会根据端点能力映射检测支持情况，
    因此即使插件使用自定义提供商 ID，原生 Moonshot/DashScope 风格的端点仍可选择启用。

    上述实时发现示例涵盖 `/models` 风格的提供商 API。请将该发现逻辑保留在
    `catalog.run` 内，并以可用的身份验证信息作为门控条件，同时确保 `staticRun`
    不访问网络，以便生成离线目录。

  </Step>

  <Step title="添加动态模型解析">
    如果你的提供商接受任意模型 ID（例如代理或路由器），
    请添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... 上文的 id、label、auth、catalog

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

    如果解析需要网络调用，请使用 `prepareDynamicModel` 进行异步预热；
    完成后会再次运行 `resolveDynamicModel`。

  </Step>

  <Step title="添加运行时钩子（按需）">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。请根据提供商的需求
    逐步添加钩子。

    共享辅助构建器现在涵盖最常见的重放/工具兼容系列，因此插件通常不需要
    逐个手动连接每个钩子：

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

    当前可用的重放系列：

    | 系列 | 接入的功能 | 内置示例 |
    | --- | --- | --- |
    | `openai-compatible` | 用于 OpenAI 兼容传输的共享 OpenAI 风格重放策略，包括工具调用 ID 清理、助手消息优先顺序修复，以及传输需要时的通用 Gemini 轮次验证 | `moonshot`、`ollama`、`xai`、`zai` |
    | `anthropic-by-model` | 根据 `modelId` 选择的 Claude 感知重放策略，因此只有在解析出的模型实际为 Claude ID 时，Anthropic 消息传输才会获得 Claude 特定的思考块清理 | `amazon-bedrock` |
    | `native-anthropic-by-model` | 与 `anthropic-by-model` 相同的按模型选择 Claude 策略，另外为必须保留供应商原生 ID 的传输提供工具调用 ID 清理和原生 Anthropic 工具使用 ID 保留 | `anthropic-vertex`、`clawrouter` |
    | `google-gemini` | 原生 Gemini 重放策略及引导重放清理。共享系列使文本输出型 Gemini CLI 使用带标签的推理；直接 `google` 提供商将 `resolveReasoningOutputMode` 覆盖为 `native`，因为 Gemini API 的思考内容以原生思维部分到达。 | `google`、`google-gemini-cli` |
    | `passthrough-gemini` | 对通过 OpenAI 兼容代理传输运行的 Gemini 模型执行 Gemini 思维签名清理；不会启用原生 Gemini 重放验证或引导重写 | `openrouter`、`kilocode`、`opencode`、`opencode-go` |
    | `hybrid-anthropic-openai` | 适用于在一个插件中混合 Anthropic 消息和 OpenAI 兼容模型表面的提供商的混合策略；可选的仅限 Claude 的思考块丢弃仍限定在 Anthropic 一侧 | `minimax` |

    当前可用的流系列：

    | 系列 | 接入的功能 | 内置示例 |
    | --- | --- | --- |
    | `google-thinking` | 在共享流路径上规范化 Gemini 思考载荷 | `google`、`google-gemini-cli` |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo 推理包装器；`kilo/auto` 和不受支持的代理推理 ID 会跳过注入思考内容 | `kilocode` |
    | `moonshot-thinking` | 根据配置和 `/think` 级别映射 Moonshot 二进制原生思考载荷 | `moonshot` |
    | `minimax-fast-mode` | 在共享流路径上重写 MiniMax 快速模式模型 | `minimax`、`minimax-portal` |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses 包装器：归属标头、`/fast`/`serviceTier`、文本详细程度、原生 Codex Web 搜索、推理兼容载荷塑形和 Responses 上下文管理 | `openai` |
    | `openrouter-thinking` | 用于代理路由的 OpenRouter 推理包装器，集中处理不支持的模型和 `auto` 跳过逻辑 | `openrouter` |
    | `tool-stream-default-on` | 默认启用的 `tool_stream` 包装器，适用于 Z.AI 等除非显式禁用否则希望使用工具流式传输的提供商 | `zai` |

    <Accordion title="支撑系列构建器的 SDK 接口">
      每个系列构建器都由同一软件包导出的较低层级公共辅助函数组成。当提供商需要偏离通用模式时，你可以使用这些函数：

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)` 以及原始重放构建器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。还导出 Gemini 重放辅助函数（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和端点/模型辅助函数（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共享 OpenAI/Codex 包装器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 兼容包装器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages 思考预填充清理（`createAnthropicThinkingPrefillPayloadWrapper`）、纯文本工具调用兼容包装器（`createPlainTextToolCallCompatWrapper`）和共享代理/提供商包装器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - 用于提供商热路径的轻量级载荷和事件包装器，包括 `createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)` 和 `setQwenChatTemplateThinking(...)`。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` 以及底层提供商模式辅助函数。

      对于 Gemini 系列提供商，请确保推理输出模式与传输保持一致。
      直接使用 Google Gemini API 的提供商应采用 `native` 推理输出，
      以便 OpenClaw 使用原生思维部分，而无需添加 `<think>` / `<final>`
      提示指令。解析最终 JSON/文本响应的纯文本 Gemini CLI 风格后端
      可以继续使用共享的 `google-gemini` 带标签契约。

      一些流辅助函数有意保留在提供商本地。`@openclaw/anthropic-provider` 将
      `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
      `resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及较低层级的
      Anthropic 包装器构建器保留在其公共 `api.ts` / `contract-api.ts` 接口中，
      因为它们编码了 Claude OAuth 测试版处理和 `context1m` 门控。xAI 插件同样
      在自己的 `wrapStreamFn` 中保留原生 xAI Responses 塑形（`/fast` 别名、
      默认 `tool_stream`、不受支持的严格工具清理、xAI 特定的推理载荷移除）。

      相同的软件包根目录模式也支持 `@openclaw/openai-provider`（提供商构建器、
      默认模型辅助函数、实时提供商构建器）和 `@openclaw/openrouter-provider`
      （提供商构建器以及新手引导/配置辅助函数）。
    </Accordion>

    <Tabs>
      <Tab title="令牌交换">
        对于需要在每次推理调用前交换令牌的提供商：

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
      <Tab title="自定义标头">
        对于需要自定义请求标头或修改请求体的提供商：

        ```typescript
        // wrapStreamFn 返回一个从 ctx.streamFn 派生的 StreamFn
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
        对于需要在通用 HTTP 或 WebSocket 传输上使用原生请求/会话标头或元数据的提供商：

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
        对于公开用量/计费数据的提供商：

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` 有三种结果。当提供商拥有用量/计费凭据时，返回
        `{ token, accountId?, subscriptionType?, rateLimitTier? }`（可选字段会将解析后的配置文件中的
        非机密套餐元数据传递给 `fetchUsageSnapshot`）。仅当提供商已明确处理用量
        身份验证、但没有可用的用量令牌，并且 OpenClaw 必须跳过通用
        API 密钥/OAuth 回退时，才返回 `{ handled: true }`。当提供商未处理
        该请求，并且 OpenClaw 应继续使用通用回退时，返回 `null` 或 `undefined`。

        在 `contracts.usageProviders` 中声明提供商 ID。当该清单
        合约和**两个**钩子均存在时，OpenClaw 会自动将
        该提供商纳入用量收集，而无需加载无关的提供商
        插件。不需要更新核心允许列表。
        `fetchUsageSnapshot` 返回共享的、与提供商无关的结构：

        - `plan`：提供商报告的订阅或密钥标签
        - `windows`：以已用百分比表示的可重置配额窗口
        - `billing`：类型化的 `balance`、`spend` 或 `budget` 条目；`unit` 可以是
          ISO 货币，也可以是 `credits` 等提供商单位
        - `summary`：无法放入上述结构化字段的简洁提供商特定上下文

        必须精确保留货币语义。除非上游合约如此规定，否则提供商积分并不等同于美元。
        仅实现 `fetchUsageSnapshot` 的插件仍可供显式/合成调用方使用，但
        不会被自动发现，因为 OpenClaw 无法解析其用量凭据。
      </Tab>
    </Tabs>

    <Accordion title="常用提供商钩子">
      对于模型/提供商插件，OpenClaw 大致按以下顺序调用钩子。
      大多数提供商只使用其中 2-3 个。这并非完整的 `ProviderPlugin`
      合约——有关完整且当前准确的钩子列表和回退说明，请参阅[内部机制：提供商运行时
      钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
      此处未列出 OpenClaw 已不再调用的仅兼容性提供商字段，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`。

      | 钩子 | 使用场景 |
      | --- | --- |
      | `catalog` | 模型目录或基础 URL 默认值 |
      | `applyConfigDefaults` | 配置具体化期间由提供商拥有的全局默认值 |
      | `normalizeModelId` | 查找前清理旧版/预览版模型 ID 别名 |
      | `normalizeTransport` | 通用模型组装前清理提供商系列的 `api` / `baseUrl` |
      | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | `applyNativeStreamingUsageCompat` | 对配置提供商进行原生流式用量兼容性重写 |
      | `resolveConfigApiKey` | 解析由提供商拥有的环境变量标记身份验证 |
      | `resolveSyntheticAuth` | 本地/自托管或基于配置的合成身份验证 |
      | `resolveExternalAuthProfiles` | 为 CLI/应用管理的凭据叠加由提供商拥有的外部身份验证配置文件 |
      | `shouldDeferSyntheticProfileAuth` | 将合成的已存储配置文件占位符置于环境变量/配置身份验证之后 |
      | `resolveDynamicModel` | 接受任意上游模型 ID |
      | `prepareDynamicModel` | 解析前异步获取元数据 |
      | `normalizeResolvedModel` | 运行器执行前重写传输协议 |
      | `normalizeToolSchemas` | 注册前清理由提供商拥有的工具架构 |
      | `inspectToolSchemas` | 由提供商拥有的工具架构诊断 |
      | `resolveReasoningOutputMode` | 带标签与原生推理输出合约 |
      | `prepareExtraParams` | 默认请求参数 |
      | `createStreamFn` | 完全自定义的 StreamFn 传输协议 |
      | `wrapStreamFn` | 正常流式路径上的自定义标头/正文包装器 |
      | `resolveTransportTurnState` | 原生的每轮标头/元数据 |
      | `resolveWebSocketSessionPolicy` | 原生 WS 会话标头/冷却时间 |
      | `formatApiKey` | 自定义运行时令牌结构 |
      | `refreshOAuth` | 自定义 OAuth 刷新 |
      | `buildAuthDoctorHint` | 身份验证修复指导 |
      | `matchesContextOverflowError` | 由提供商拥有的溢出检测 |
      | `classifyFailoverReason` | 由提供商拥有的速率限制/过载分类 |
      | `isCacheTtlEligible` | 提示词缓存 TTL 门控 |
      | `buildMissingAuthMessage` | 自定义缺失身份验证提示 |
      | `augmentModelCatalog` | 合成的前向兼容行（已弃用——优先使用 `registerModelCatalogProvider`） |
      | `resolveThinkingProfile` | 模型特定的 `/think` 选项集 |
      | `isBinaryThinking` | 二元思考开/关兼容性（已弃用——优先使用 `resolveThinkingProfile`） |
      | `supportsXHighThinking` | `xhigh` 推理支持兼容性（已弃用——优先使用 `resolveThinkingProfile`） |
      | `resolveDefaultThinkingLevel` | 默认 `/think` 策略兼容性（已弃用——优先使用 `resolveThinkingProfile`） |
      | `isModernModelRef` | 实时/冒烟模型匹配 |
      | `prepareRuntimeAuth` | 推理前交换令牌 |
      | `resolveUsageAuth` | 自定义用量凭据解析 |
      | `fetchUsageSnapshot` | 自定义用量端点 |
      | `createEmbeddingProvider` | 由提供商拥有的记忆/搜索嵌入适配器 |
      | `buildReplayPolicy` | 自定义记录重放/压缩策略 |
      | `sanitizeReplayHistory` | 通用清理后的提供商特定重放重写 |
      | `validateReplayTurns` | 嵌入式运行器执行前的严格重放轮次验证 |
      | `onModelSelected` | 选择后回调（例如遥测） |

      运行时回退说明：

      - `normalizeConfig` 会为每个提供商 ID 解析一个所属插件（先处理内置提供商，再处理匹配的运行时插件），并且只调用该钩子——不会扫描其他提供商。Google 自身的 `normalizeConfig` 钩子负责规范化 `google` / `google-vertex` / `google-antigravity` 配置条目；这不是单独的核心回退。
      - 当提供商公开 `resolveConfigApiKey` 钩子时，会使用该钩子。Amazon Bedrock 将 AWS 环境变量标记解析保留在其提供商插件中；当配置为 `auth: "aws-sdk"` 时，运行时身份验证本身仍使用 AWS SDK 默认链。
      - `resolveThinkingProfile(ctx)` 接收所选的 `provider`、`modelId`、可选的合并 `reasoning` 目录提示，以及可选的合并模型 `compat` 事实。仅使用 `compat` 选择提供商的思考界面/配置文件。
      - `resolveSystemPromptContribution` 允许提供商为某个模型系列注入可感知缓存的系统提示词指导。当行为属于单个提供商/模型系列，并且应保留稳定/动态缓存拆分时，优先使用它，而不是旧版插件级 `before_prompt_build` 钩子。

    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    ### 第 5 步：添加额外能力

    除文本推理外，提供商插件还可以注册嵌入、语音、实时转录、
    实时语音、媒体理解、图像生成、视频生成、
    Web 获取和 Web 搜索。OpenClaw 将其归类为
    **混合能力**插件——这是公司插件的推荐模式
    （每个供应商一个插件）。请参阅
    [内部机制：能力所有权](/zh-CN/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 内，将每项能力与现有的
    `api.registerProvider(...)` 调用一起注册。只选择你需要的选项卡：

    <Tabs>
      <Tab title="语音（TTS）">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          defaultTimeoutMs: 120_000,
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        对提供商 HTTP 故障使用 `assertOkOrThrowProviderError(...)`，这样
        插件就能共享有上限的错误正文读取、JSON 错误解析和
        请求 ID 后缀。
      </Tab>
      <Tab title="实时转录">
        优先使用 `createRealtimeTranscriptionWebSocketSession(...)`——这个共享
        辅助函数会处理代理捕获、重连退避、关闭刷新、就绪
        握手、音频排队和关闭事件诊断。你的插件
        只需映射上游事件。

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        批量 STT 提供商通过 POST 提交 multipart 音频时，应使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。该辅助函数会规范化上传
        文件名，包括为需要使用 M4A 风格文件名才能兼容转录 API 的 AAC
        上传内容进行处理。
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        声明 `capabilities`，以便 `talk.catalog` 向浏览器和原生 Talk
        客户端公开有效的模式、传输协议、音频格式和功能标志。
        当传输协议能够检测到用户正在打断助手的音频播放，并且提供商支持
        截断或清除当前音频响应时，请实现 `handleBargeIn`。
        对于同步提交，`submitToolResult` 可以返回 `void`；对于提供商桥接层
        可以公开的异步完成边界，则可以返回 `Promise<void>`。Gateway 网关
        中继会话会等待该 promise，然后才确认最终结果或清除关联的运行；
        提交失败时应拒绝该 promise。
        当提供商无法遵循 `options.suppressResponse` 时，请设置
        `supportsToolResultSuppression: false`。这样，OpenClaw 就不会对
        内部强制咨询和取消结果使用响应抑制，并且会拒绝直接提交的抑制结果
        请求，而不是静默启动响应。
        `createRealtimeVoiceBridgeSession` 的使用方也可以从 `onToolCall`
        返回 promise；同步抛出的异常和 promise 拒绝都会路由到会话的
        `onError` 回调。
        仅当提供商 VAD 通过调用 `onClearAudio("barge-in")` 确认发生打断时，
        才设置 `handlesInputAudioBargeIn`。未提供该标志的提供商会使用
        OpenClaw 的本地输入音频后备检测。
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        对于有意不要求凭据的本地或自行托管媒体提供商，可以公开
        `resolveAuth` 并返回 `kind: "none"`。
        对于未明确选择启用此行为的提供商，OpenClaw 仍会保留常规的身份验证
        门控。现有提供商可以继续读取 `req.apiKey`；新提供商应优先使用
        `req.auth`。

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Embeddings">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        在 `contracts.embeddingProviders` 中声明相同的 ID。这是用于可复用
        向量生成的通用嵌入契约，包括记忆搜索。
        `registerMemoryEmbeddingProvider(...)` 是为现有记忆专用适配器保留的
        已弃用兼容接口。
      </Tab>
      <Tab title="Image and video generation">
        图像和视频能力使用**模式感知**结构。图像提供商需声明必需的
        `generate` 和 `edit` 能力块；视频提供商需声明 `generate`、
        `imageToVideo` 和 `videoToVideo`。仅使用 `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` 等扁平聚合字段，无法清晰地
        声明转换模式支持或已禁用的模式。音乐生成遵循相同的 `generate` /
        `edit` 模式。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        两种提供商类型都必须声明 `capabilities`；`edit` 和视频转换块
        （`imageToVideo`、`videoToVideo`）始终需要显式的 `enabled` 标志。

        当已列出模型的静态模式或能力与提供商默认值不同时，请使用
        `catalogByModel`。此元数据无需调用提供商代码，即可确保
        `video_generate action=list` 和模型目录准确无误。请求时的能力查找
        和强制执行仍应由 `resolveModelCapabilities` 和 `generateVideo`
        负责；如有可能，请让两个路径复用同一个能力常量。
      </Tab>
      <Tab title="Web fetch and search">
        ```typescript
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
          hint: "Search the web through Acme's search backend.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        两种提供商类型使用相同的凭据接线结构：
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue` 和 `createTool` 均为
        必填项。
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ### 第 6 步：测试

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

`clawhub skill publish <path>` 是用于发布 Skills 文件夹的另一条命令，
并非用于发布插件包——请勿在此处使用。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## 目录顺序参考

`catalog.order` 控制你的目录相对于内置提供商的合并时机：

| 顺序      | 执行时机       | 用例                                         |
| --------- | -------------- | -------------------------------------------- |
| `simple`  | 第一轮         | 仅使用 API 密钥的提供商                      |
| `profile` | `simple` 之后  | 受身份验证配置文件限制的提供商               |
| `paired`  | `profile` 之后 | 合成多个相关条目                             |
| `late`    | 最后一轮       | 覆盖现有提供商（发生冲突时优先）             |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 如果你的插件还提供渠道
- [SDK 运行时](/zh-CN/plugins/sdk-runtime) - `api.runtime` 辅助工具（TTS、搜索、子智能体）
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整的子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture-internals#provider-runtime-hooks) - 钩子详情和内置示例

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [构建渠道插件](/zh-CN/plugins/sdk-channel-plugins)
