---
read_when:
    - 你正在构建新的模型提供商插件
    - 你想要向 OpenClaw 添加一个 OpenAI 兼容代理或自定义 LLM
    - 你需要了解提供商凭证、目录和运行时钩子
sidebarTitle: Provider plugins
summary: 构建 OpenClaw 模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-07-05T11:33:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 936227cf6e8d93c1a56ddf7e3e5f8613c1f430029a456d5acfdaa000ea7cdc94
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

构建一个提供商插件，为 OpenClaw 添加模型提供商（LLM）：模型目录、API-key 凭证，以及动态模型解析。

<Info>
  刚开始使用 OpenClaw 插件？请先阅读[入门指南](/zh-CN/plugins/building-plugins)，了解包结构和清单设置。
</Info>

<Tip>
  提供商插件会把模型添加到 OpenClaw 的常规推理循环中。如果模型必须通过拥有线程、压缩或工具事件的原生智能体守护进程运行，请将该提供商与 [agent harness](/zh-CN/plugins/sdk-agent-harness) 配对，而不是把守护进程协议细节放进核心。
</Tip>

## 演练

<Steps>
  <Step title="Package and manifest">
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

    `setup.providers[].envVars` 让 OpenClaw 无需加载你的插件运行时即可检测凭证。当某个提供商变体应复用另一个提供商 id 的凭证时，请添加 `providerAuthAliases`。`modelSupport` 是可选项，可让 OpenClaw 在运行时钩子存在之前，从 `acme-large` 这样的简写模型 id 自动加载你的提供商插件。`package.json` 中的 `openclaw.compat` 和 `openclaw.build` 是 ClawHub 发布所必需的（`openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion` 是两个必填字段；省略 `minGatewayVersion` 时会回退到 `openclaw.install.minHostVersion`）。

  </Step>

  <Step title="Register the provider">
    一个最小文本提供商需要 `id`、`label`、`auth` 和 `catalog`。`catalog` 是由提供商拥有的运行时/配置钩子；它可以调用实时厂商 API，并返回 `models.providers` 条目。

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

    `registerModelCatalogProvider` 是较新的控制平面目录表面，用于列表/帮助/选择器 UI，覆盖 `text`、`voice`、`image_generation`、`video_generation` 和 `music_generation` 行。请将厂商端点调用和响应映射保留在插件中；OpenClaw 负责共享行结构、来源标签和帮助渲染。

    这就是一个可工作的提供商。用户现在可以运行 `openclaw onboard --acme-ai-api-key <key>`，并选择 `acme-ai/acme-large` 作为他们的模型。

    ### 实时模型发现

    如果你的提供商公开了 `/models` 风格的 API，请将提供商专属端点和行投影保留在你的插件中，并使用 `openclaw/plugin-sdk/provider-catalog-live-runtime` 处理共享抓取生命周期。该辅助工具提供受保护的 HTTP 抓取、提供商凭证标头、结构化 HTTP 错误、TTL 缓存和静态回退行为，而无需把提供商策略放进 OpenClaw 核心。

    当实时 API 只告诉你当前有哪些由提供商拥有的静态目录行可用时，请使用 `buildLiveModelProviderConfig`：

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

    当提供商 API 返回更丰富的元数据，并且插件需要自行将行投影为 OpenClaw 模型定义时，请使用 `getCachedLiveProviderModelRows`：

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

    `run` 应保持凭证门控，并在没有可用凭证时返回 `null`。保留离线 `staticRun` 或静态回退，使设置、文档、测试和选择器表面不依赖实时网络访问。使用适合模型列表新鲜度的 TTL，避免请求时文件系统轮询，并且仅在上游响应不是 OpenAI 兼容的 `{ data: [{ id, object }] }` 结构时，才传入提供商专属的 `readRows` / `readModelId`。

    如果上游提供商使用的控制令牌与 OpenClaw 不同，请添加一个小型双向文本转换，而不是替换流路径：

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

    `input` 会在传输前重写最终系统提示和文本消息内容。`output` 会在 OpenClaw 解析自身控制标记或渠道投递前，重写助手文本增量和最终文本。

    对于只注册一个带 API-key 凭证、并带有单个目录支撑运行时的文本提供商的内置提供商，请优先使用更窄的 `defineSingleProviderPluginEntry(...)` 辅助工具：

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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` 是 OpenClaw 能够解析真实提供商凭证时使用的实时目录路径。它可以执行提供商特定的设备发现。仅将 `buildStaticProvider` 用于在配置凭证前可以安全显示的离线行；它不得需要凭据或发起网络请求。OpenClaw 的 `models list --all` 显示目前只会对内置提供商插件执行静态目录，并使用空配置、空环境变量，且不提供智能体/工作区路径。

    如果你的凭证流程还需要在新手引导期间修补 `models.providers.*`、别名以及智能体默认模型，请使用 `openclaw/plugin-sdk/provider-onboard` 中的预设辅助函数。范围最窄的辅助函数是 `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)` 和 `createModelCatalogPresetAppliers(...)`。

    当某个提供商的原生端点在普通 `openai-completions` 传输上支持流式使用量块时，优先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助函数，而不是硬编码提供商 ID 检查。`supportsNativeStreamingUsageCompat(...)` 和 `applyProviderNativeStreamingUsageCompat(...)` 会从端点能力映射中检测支持情况，因此即使插件使用自定义提供商 ID，原生 Moonshot/DashScope 风格端点仍会选择启用。

    上面的实时设备发现示例覆盖 `/models` 风格的提供商 API。将该设备发现保留在 `catalog.run` 内，并以可用凭证作为门控，同时保持 `staticRun` 不发起网络请求，以便生成离线目录。

  </Step>

  <Step title="Add dynamic model resolution">
    如果你的提供商接受任意模型 ID（例如代理或路由器），请添加 `resolveDynamicModel`：

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

    如果解析需要网络调用，请使用 `prepareDynamicModel` 进行异步预热，`resolveDynamicModel` 会在它完成后再次运行。

  </Step>

  <Step title="Add runtime hooks (as needed)">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。请随着提供商需求逐步添加钩子。

    共享辅助构建器现在覆盖了最常见的重放/工具兼容系列，因此插件通常不需要逐个手动接线每个钩子：

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

    | 系列 | 接入内容 | 内置示例 |
    | --- | --- | --- |
    | `openai-compatible` | 面向 OpenAI 兼容传输的共享 OpenAI 风格重放策略，包括工具调用 ID 清理、assistant 优先排序修复，以及传输需要时的通用 Gemini 轮次验证 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 按 `modelId` 选择的 Claude 感知重放策略，因此 Anthropic 消息传输只有在解析后的模型确实是 Claude ID 时，才会获得 Claude 特定的思考块清理 | `amazon-bedrock` |
    | `native-anthropic-by-model` | 与 `anthropic-by-model` 相同的按模型选择 Claude 策略，外加工具调用 ID 清理，以及必须保留供应商原生 ID 的传输所需的原生 Anthropic 工具使用 ID 保留 | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | 原生 Gemini 重放策略加引导重放清理。共享系列会让文本输出 Gemini CLI 保持标记化推理；直接的 `google` 提供商会将 `resolveReasoningOutputMode` 覆盖为 `native`，因为 Gemini API 思考以原生 thought parts 形式到达。 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 针对通过 OpenAI 兼容代理传输运行的 Gemini 模型进行 Gemini thought-signature 清理；不会启用原生 Gemini 重放验证或引导重写 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 面向在一个插件中混合 Anthropic 消息和 OpenAI 兼容模型表面的提供商的混合策略；可选的仅 Claude 思考块丢弃会限定在 Anthropic 侧 | `minimax` |

    当前可用的流系列：

    | 系列 | 接入内容 | 内置示例 |
    | --- | --- | --- |
    | `google-thinking` | 共享流路径上的 Gemini 思考载荷规范化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo 推理包装器，`kilo/auto` 和不支持的代理推理 ID 会跳过注入的思考 | `kilocode` |
    | `moonshot-thinking` | 从配置 + `/think` 级别映射 Moonshot 二进制原生思考载荷 | `moonshot` |
    | `minimax-fast-mode` | 共享流路径上的 MiniMax 快速模式模型重写 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共享原生 OpenAI/Codex Responses 包装器：归因标头、`/fast`/`serviceTier`、文本详略、原生 Codex Web 搜索、推理兼容载荷塑形，以及 Responses 上下文管理 | `openai` |
    | `openrouter-thinking` | 面向代理路由的 OpenRouter 推理包装器，不支持模型/`auto` 跳过会集中处理 | `openrouter` |
    | `tool-stream-default-on` | 面向 Z.AI 等提供商的默认开启 `tool_stream` 包装器，这些提供商希望除非显式禁用，否则启用工具流式传输 | `zai` |

    <Accordion title="SDK seams powering the family builders">
      每个系列构建器都由同一包中导出的较低级别公共辅助函数组成；当提供商需要偏离通用模式时，你可以使用这些辅助函数：

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重放构建器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。还会导出 Gemini 重放辅助函数（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和端点/模型辅助函数（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共享 OpenAI/Codex 包装器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 兼容包装器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages 思考预填清理（`createAnthropicThinkingPrefillPayloadWrapper`）、纯文本工具调用兼容（`createPlainTextToolCallCompatWrapper`），以及共享代理/提供商包装器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - 面向热提供商路径的轻量载荷和事件包装器，包括 `createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)` 和 `setQwenChatTemplateThinking(...)`。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`，以及底层提供商 schema 辅助函数。

      对于 Gemini 系列提供商，请保持推理输出模式与传输对齐。直接 Google Gemini API 提供商应使用 `native` 推理输出，使 OpenClaw 能消费原生 thought parts，而无需添加 `<think>` / `<final>` 提示指令。只解析最终 JSON/文本响应的纯文本 Gemini CLI 风格后端可以保留共享的 `google-gemini` 标记化契约。

      一些流辅助函数有意保持在提供商本地。`@openclaw/anthropic-provider` 会把 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及较低级别的 Anthropic 包装器构建器保留在自己的公共 `api.ts` / `contract-api.ts` 接缝中，因为它们编码了 Claude OAuth beta 处理和 `context1m` 门控。xAI 插件同样会在自己的 `wrapStreamFn` 中保留原生 xAI Responses 塑形（`/fast` 别名、默认 `tool_stream`、不支持的 strict-tool 清理、xAI 特定的推理载荷移除）。

      同样的包根模式也支持 `@openclaw/openai-provider`（提供商构建器、默认模型辅助函数、实时提供商构建器）和 `@openclaw/openrouter-provider`（提供商构建器以及新手引导/配置辅助函数）。
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        对于每次推理调用前都需要令牌交换的提供商：

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
      <Tab title="Custom headers">
        对于需要自定义请求标头或正文修改的提供商：

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
      <Tab title="Native transport identity">
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
      <Tab title="使用和计费">
        对于公开使用量/计费数据的提供商：

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` 有三种结果。当提供商有使用量/计费凭据时，返回 `{ token, accountId? }`。仅当提供商已明确处理使用量认证，但没有可用的使用量 token，且 OpenClaw 必须跳过通用 API key/OAuth 回退时，才返回 `{ handled: true }`。当提供商未处理该请求，且 OpenClaw 应继续使用通用回退时，返回 `null` 或 `undefined`。
      </Tab>
    </Tabs>

    <Accordion title="常见提供商钩子">
      对于模型/提供商插件，OpenClaw 大致按以下顺序调用钩子。
      大多数提供商只使用 2-3 个。这不是完整的 `ProviderPlugin`
      契约 - 请参阅 [内部机制：提供商运行时
      钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)，了解完整且当前准确的钩子列表和回退说明。
      此处未列出 OpenClaw 不再调用的仅兼容提供商字段，例如
      `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`。

      | 钩子 | 何时使用 |
      | --- | --- |
      | `catalog` | 模型目录或基础 URL 默认值 |
      | `applyConfigDefaults` | 配置具象化期间由提供商拥有的全局默认值 |
      | `normalizeModelId` | 查找前清理旧版/预览版模型 ID 别名 |
      | `normalizeTransport` | 通用模型组装前清理提供商系列的 `api` / `baseUrl` |
      | `normalizeConfig` | 标准化 `models.providers.<id>` 配置 |
      | `applyNativeStreamingUsageCompat` | 为配置提供商重写原生流式使用量兼容逻辑 |
      | `resolveConfigApiKey` | 由提供商拥有的环境标记认证解析 |
      | `resolveSyntheticAuth` | 本地/自托管或配置支持的合成认证 |
      | `resolveExternalAuthProfiles` | 为 CLI/应用管理的凭据叠加提供商拥有的外部认证配置文件 |
      | `shouldDeferSyntheticProfileAuth` | 将合成的已存储配置文件占位符降级到 env/config 认证之后 |
      | `resolveDynamicModel` | 接受任意上游模型 ID |
      | `prepareDynamicModel` | 解析前异步获取元数据 |
      | `normalizeResolvedModel` | runner 前的传输重写 |
      | `normalizeToolSchemas` | 注册前由提供商拥有的工具 schema 清理 |
      | `inspectToolSchemas` | 由提供商拥有的工具 schema 诊断 |
      | `resolveReasoningOutputMode` | 标记式与原生 reasoning 输出契约 |
      | `prepareExtraParams` | 默认请求参数 |
      | `createStreamFn` | 完全自定义的 StreamFn 传输 |
      | `wrapStreamFn` | 正常流路径上的自定义 header/body 包装器 |
      | `resolveTransportTurnState` | 原生按轮次 header/metadata |
      | `resolveWebSocketSessionPolicy` | 原生 WS 会话 header/冷却时间 |
      | `formatApiKey` | 自定义运行时 token 形态 |
      | `refreshOAuth` | 自定义 OAuth 刷新 |
      | `buildAuthDoctorHint` | 认证修复指引 |
      | `matchesContextOverflowError` | 由提供商拥有的溢出检测 |
      | `classifyFailoverReason` | 由提供商拥有的限速/过载分类 |
      | `isCacheTtlEligible` | prompt 缓存 TTL 门控 |
      | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | `augmentModelCatalog` | 合成的前向兼容行（已弃用 - 优先使用 `registerModelCatalogProvider`） |
      | `resolveThinkingProfile` | 模型特定的 `/think` 选项集 |
      | `isBinaryThinking` | 二元 thinking 开/关兼容性（已弃用 - 优先使用 `resolveThinkingProfile`） |
      | `supportsXHighThinking` | `xhigh` reasoning 支持兼容性（已弃用 - 优先使用 `resolveThinkingProfile`） |
      | `resolveDefaultThinkingLevel` | 默认 `/think` 策略兼容性（已弃用 - 优先使用 `resolveThinkingProfile`） |
      | `isModernModelRef` | 实时/冒烟模型匹配 |
      | `prepareRuntimeAuth` | 推理前 token 交换 |
      | `resolveUsageAuth` | 自定义使用量凭据解析 |
      | `fetchUsageSnapshot` | 自定义使用量端点 |
      | `createEmbeddingProvider` | 由提供商拥有、用于记忆/搜索的 embedding 适配器 |
      | `buildReplayPolicy` | 自定义 transcript 重放/压缩策略 |
      | `sanitizeReplayHistory` | 通用清理后的提供商特定重放重写 |
      | `validateReplayTurns` | 嵌入式 runner 前的严格重放轮次校验 |
      | `onModelSelected` | 选择后的回调（例如遥测） |

      运行时回退说明：

      - `normalizeConfig` 针对每个提供商 ID 解析一个拥有者插件（先内置提供商，然后匹配的运行时插件），并且只调用该钩子 - 不会跨其他提供商扫描。Google 自己的 `normalizeConfig` 钩子负责标准化 `google` / `google-vertex` / `google-antigravity` 配置条目；它不是单独的核心回退。
      - `resolveConfigApiKey` 在公开时使用提供商钩子。Amazon Bedrock 将 AWS 环境标记解析保留在其提供商插件中；当配置为 `auth: "aws-sdk"` 时，运行时认证本身仍使用 AWS SDK 默认链。
      - `resolveThinkingProfile(ctx)` 接收已选择的 `provider`、`modelId`、可选的合并后 `reasoning` 目录提示，以及可选的合并后模型 `compat` 事实。仅使用 `compat` 来选择提供商的 thinking UI/profile。
      - `resolveSystemPromptContribution` 允许提供商为某个模型系列注入缓存感知的系统 prompt 指引。当行为属于一个提供商/模型系列，并且应保留稳定/动态缓存拆分时，优先使用它，而不是旧版的插件级 `before_prompt_build` 钩子。

    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    ### 步骤 5：添加额外能力

    提供商插件可以在文本推理之外，注册 embedding、语音、实时转录、
    实时语音、媒体理解、图像生成、视频生成、
    Web 获取和 Web 搜索。OpenClaw 将其归类为
    **混合能力** 插件 - 这是公司插件的推荐模式
    （每个供应商一个插件）。请参阅
    [内部机制：能力所有权](/zh-CN/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 中与你现有的
    `api.registerProvider(...)` 调用一起注册每项能力。只选择你需要的标签页：

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

        对提供商 HTTP 失败使用 `assertOkOrThrowProviderError(...)`，这样
        插件可以共享受限的错误正文读取、JSON 错误解析和
        request-id 后缀。
      </Tab>
      <Tab title="实时转录">
        优先使用 `createRealtimeTranscriptionWebSocketSession(...)` - 共享
        helper 会处理代理捕获、重连退避、关闭刷新、就绪
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

        POST multipart 音频的批量 STT 提供商应使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。该 helper 会标准化上传
        文件名，包括需要 M4A 风格文件名以兼容
        转录 API 的 AAC 上传。
      </Tab>
      <Tab title="实时语音">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
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

        声明 `capabilities`，以便 `talk.catalog` 可以向浏览器和原生 Talk
        客户端暴露有效模式、传输协议、音频格式和功能标志。当某个传输协议可以检测到
        人类正在打断助手播放，且提供商支持截断或清除当前音频响应时，实现 `handleBargeIn`。
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

        有意不要求凭证的本地或自托管媒体提供商可以暴露 `resolveAuth` 并返回
        `kind: "none"`。对于未显式选择加入的提供商，OpenClaw 仍会保留常规凭证门禁。
        现有提供商可以继续读取 `req.apiKey`；新提供商应优先使用 `req.auth`。

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

        在 `contracts.embeddingProviders` 中声明相同的 ID。这是可复用向量生成的
        通用嵌入契约，包括记忆搜索。`registerMemoryEmbeddingProvider(...)` 是面向现有记忆专用适配器的
        已弃用兼容性接口。
      </Tab>
      <Tab title="Image and video generation">
        图像和视频能力使用一种**模式感知**结构。图像提供商声明必需的 `generate` 和
        `edit` 能力块；视频提供商声明 `generate`、`imageToVideo` 和
        `videoToVideo`。像 `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` 这样的扁平聚合字段不足以清晰表示
        转换模式支持或已禁用模式。音乐生成也遵循相同的 `generate` / `edit` 模式。

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
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        两种提供商类型都必须提供 `capabilities`；`edit` 和视频转换块
        （`imageToVideo`、`videoToVideo`）始终需要显式的 `enabled` 标志。
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

        两种提供商类型共享相同的凭证接线结构：
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue` 和 `createTool` 都是
        必需项。
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ### 步骤 6：测试

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

提供商插件的发布方式与其他任何外部代码插件相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` 是用于发布技能文件夹的另一个命令，
不是插件包；不要在这里使用它。

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

| 顺序      | 时机          | 使用场景                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一轮        | 普通 API key 提供商                             |
| `profile` | 在 simple 之后 | 受凭证配置文件门禁控制的提供商                  |
| `paired`  | 在 profile 之后 | 合成多个相关条目                                |
| `late`    | 最后一轮      | 覆盖现有提供商（冲突时胜出）                    |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 如果你的插件也提供渠道
- [SDK 运行时](/zh-CN/plugins/sdk-runtime) - `api.runtime` 辅助函数（TTS、搜索、子智能体）
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture-internals#provider-runtime-hooks) - 钩子详情和内置示例

## 相关

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [构建渠道插件](/zh-CN/plugins/sdk-channel-plugins)
