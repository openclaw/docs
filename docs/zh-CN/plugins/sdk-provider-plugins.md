---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想向 OpenClaw 添加 OpenAI 兼容代理或自定义 LLM
    - 你需要理解提供商凭证、目录和运行时钩子
sidebarTitle: Provider plugins
summary: 为 OpenClaw 构建模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-07-06T10:51:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7318081368f79acd46d09b07c52341977d3d7b0f5c187e428c38db2241bbdf0a
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

构建一个提供商插件，用于向 OpenClaw 添加模型提供商（LLM）：模型
目录、API key 认证和动态模型解析。

<Info>
  刚接触 OpenClaw 插件？请先阅读[入门指南](/zh-CN/plugins/building-plugins)，
  了解软件包结构和清单设置。
</Info>

<Tip>
  提供商插件会把模型添加到 OpenClaw 的常规推理循环中。如果该
  模型必须通过原生智能体守护进程运行，并由其管理线程、压缩
  或工具事件，请将该提供商与[智能体适配运行框架](/zh-CN/plugins/sdk-agent-harness)配对，
  而不是把守护进程协议细节放进核心。
</Tip>

## 演练

<Steps>
  <Step title="Package and manifest">
    ### 步骤 1：软件包和清单

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

    `setup.providers[].envVars` 让 OpenClaw 无需加载你的插件运行时即可
    检测凭据。当某个提供商变体应复用另一个提供商 id 的认证时，请添加
    `providerAuthAliases`。`modelSupport` 是可选项，它允许 OpenClaw 在运行时
    钩子存在之前，根据 `acme-large` 这样的简写模型 id 自动加载你的提供商插件。
    `package.json` 中的 `openclaw.compat`
    和 `openclaw.build` 是发布到 ClawHub
    所必需的（`openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`
    是两个必填字段；省略 `minGatewayVersion` 时会回退到
    `openclaw.install.minHostVersion`）。

  </Step>

  <Step title="Register the provider">
    一个最小文本提供商需要 `id`、`label`、`auth` 和 `catalog`。
    `catalog` 是由提供商拥有的运行时/配置钩子；它可以调用实时
    厂商 API，并返回 `models.providers` 条目。

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

    `registerModelCatalogProvider` 是较新的控制平面目录表面，
    用于列表/帮助/选择器 UI，覆盖 `text`、`voice`、`image_generation`、
    `video_generation` 和 `music_generation` 行。请将厂商端点调用和响应映射保留在插件中；
    OpenClaw 负责共享的行形状、来源标签和帮助渲染。

    这就是一个可工作的提供商。用户现在可以运行
    `openclaw onboard --acme-ai-api-key <key>`，并选择
    `acme-ai/acme-large` 作为他们的模型。

    ### 实时模型发现

    如果你的提供商暴露 `/models` 风格的 API，请将提供商特定的
    端点和行投影保留在你的插件中，并使用
    `openclaw/plugin-sdk/provider-catalog-live-runtime` 处理共享的抓取
    生命周期。该辅助工具提供受保护的 HTTP 抓取、提供商认证标头、
    结构化 HTTP 错误、TTL 缓存和静态回退行为，而无需把
    提供商策略放进 OpenClaw 核心。

    当实时 API 只告诉你哪些由提供商拥有的静态目录行当前可用时，
    使用 `buildLiveModelProviderConfig`：

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

    当提供商 API 返回更丰富的元数据，并且插件需要自行将行投影为
    OpenClaw 模型定义时，使用 `getCachedLiveProviderModelRows`：

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

    `run` 应保持由认证把关，并在没有可用凭据时返回 `null`。
    保留离线 `staticRun` 或静态回退，使设置、文档、
    测试和选择器表面不依赖实时网络访问。使用适合模型列表新鲜度的 TTL，
    避免请求时文件系统轮询；仅当上游响应不是 OpenAI 兼容的
    `{ data: [{ id, object }] }` 形状时，才传入提供商特定的
    `readRows` / `readModelId`。

    如果上游提供商使用的控制标记与 OpenClaw 不同，请添加一个
    小型双向文本转换，而不是替换流路径：

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

    `input` 会在传输前重写最终系统提示和文本消息内容。
    `output` 会在 OpenClaw 解析自己的控制标记或渠道投递之前，
    重写助手文本增量和最终文本。

    对于只注册一个带 API key 认证以及单个目录支持运行时的文本提供商的
    内置提供商，优先使用范围更窄的
    `defineSingleProviderPluginEntry(...)` 辅助工具：

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

    `buildProvider` 是实时目录路径，在 OpenClaw 可以解析真实
    提供商凭证时使用。它可以执行提供商特定的发现。只有在配置凭证前
    可以安全展示的离线行中才使用 `buildStaticProvider`；它不得需要凭据或发起网络请求。
    OpenClaw 的 `models list --all` 显示目前只会以空配置、空环境变量且无
    智能体/工作区路径的方式执行内置提供商插件的静态目录。

    如果你的凭证流程还需要在新手引导期间修补 `models.providers.*`、别名以及
    智能体默认模型，请使用来自
    `openclaw/plugin-sdk/provider-onboard` 的预设辅助函数。范围最窄的辅助函数是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    当提供商的原生端点在常规 `openai-completions` 传输上支持流式 usage 块时，
    优先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助函数，
    而不是硬编码提供商 ID 检查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 会从端点能力映射中检测支持情况，
    因此即使插件使用自定义提供商 ID，原生 Moonshot/DashScope 风格端点仍会选择启用。

    上面的实时发现示例覆盖 `/models` 风格的提供商 API。请将该发现保留在
    `catalog.run` 中，并以可用凭证作为门控，同时保持
    `staticRun` 不访问网络，以便生成离线目录。

  </Step>

  <Step title="Add dynamic model resolution">
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

    如果解析需要网络调用，请使用 `prepareDynamicModel` 进行异步预热 -
    它完成后会再次运行 `resolveDynamicModel`。

  </Step>

  <Step title="Add runtime hooks (as needed)">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。请随着提供商需求逐步添加钩子。

    共享辅助构建器现在覆盖最常见的重放/工具兼容系列，
    因此插件通常不需要逐个手动接线每个钩子：

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
    | `openai-compatible` | 面向 OpenAI 兼容传输的共享 OpenAI 风格重放策略，包括工具调用 ID 清理、assistant 优先顺序修复，以及传输需要时的通用 Gemini 轮次验证 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 由 `modelId` 选择的 Claude 感知重放策略，因此 Anthropic 消息传输只有在解析出的模型确实是 Claude ID 时才获得 Claude 特定的 thinking 块清理 | `amazon-bedrock` |
    | `native-anthropic-by-model` | 与 `anthropic-by-model` 相同的按模型选择 Claude 策略，外加工具调用 ID 清理，以及面向必须保留供应商原生 ID 的传输的原生 Anthropic 工具使用 ID 保留 | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | 原生 Gemini 重放策略以及引导重放清理。共享系列让文本输出 Gemini CLI 保持标记式推理；直接的 `google` 提供商会将 `resolveReasoningOutputMode` 覆盖为 `native`，因为 Gemini API thinking 会作为原生 thought parts 到达。 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 面向通过 OpenAI 兼容代理传输运行的 Gemini 模型的 Gemini 思维签名清理；不会启用原生 Gemini 重放验证或引导重写 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 面向在一个插件中混合 Anthropic 消息和 OpenAI 兼容模型表面的提供商的混合策略；可选的仅 Claude thinking 块丢弃仍限定在 Anthropic 侧 | `minimax` |

    当前可用的流系列：

    | 系列 | 接入内容 | 内置示例 |
    | --- | --- | --- |
    | `google-thinking` | 共享流路径上的 Gemini thinking 负载规范化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo 推理包装器，其中 `kilo/auto` 和不受支持的代理推理 ID 会跳过注入的 thinking | `kilocode` |
    | `moonshot-thinking` | 从配置 + `/think` 级别映射 Moonshot 二进制原生 thinking 负载 | `moonshot` |
    | `minimax-fast-mode` | 共享流路径上的 MiniMax 快速模式模型重写 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共享原生 OpenAI/Codex Responses 包装器：归因标头、`/fast`/`serviceTier`、文本详细程度、原生 Codex Web 搜索、推理兼容负载整形，以及 Responses 上下文管理 | `openai` |
    | `openrouter-thinking` | 面向代理路由的 OpenRouter 推理包装器，其中不受支持模型/`auto` 跳过会集中处理 | `openrouter` |
    | `tool-stream-default-on` | 面向 Z.AI 这类希望默认启用工具流式传输、除非明确禁用的提供商的默认启用 `tool_stream` 包装器 | `zai` |

    <Accordion title="SDK seams powering the family builders">
      每个系列构建器都由同一包导出的较低层公共辅助函数组成，当某个提供商需要偏离常见模式时，你可以使用它们：

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重放构建器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。还导出 Gemini 重放辅助函数（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）以及端点/模型辅助函数（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共享 OpenAI/Codex 包装器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 兼容包装器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking 预填充清理（`createAnthropicThinkingPrefillPayloadWrapper`）、纯文本工具调用兼容（`createPlainTextToolCallCompatWrapper`），以及共享代理/提供商包装器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - 面向热提供商路径的轻量负载和事件包装器，包括 `createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)` 和 `setQwenChatTemplateThinking(...)`。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`，以及底层提供商 schema 辅助函数。

      对于 Gemini 系列提供商，请保持推理输出模式与
      传输对齐。直接的 Google Gemini API 提供商应使用 `native`
      推理输出，让 OpenClaw 消费原生 thought parts，而无需添加
      `<think>` / `<final>` prompt 指令。仅文本的 Gemini CLI 风格
      后端如果解析最终 JSON/文本响应，可以保留共享的
      `google-gemini` 标记式契约。

      有些流辅助函数有意保持在提供商本地。`@openclaw/anthropic-provider` 将 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及较低层的 Anthropic 包装器构建器保留在自己的公共 `api.ts` / `contract-api.ts` 接缝中，因为它们编码了 Claude OAuth beta 处理和 `context1m` 门控。xAI 插件同样将原生 xAI Responses 整形保留在自己的 `wrapStreamFn` 中（`/fast` 别名、默认 `tool_stream`、不受支持的严格工具清理、xAI 特定的推理负载移除）。

      同样的包根模式也支撑 `@openclaw/openai-provider`（提供商构建器、默认模型辅助函数、实时提供商构建器）和 `@openclaw/openrouter-provider`（提供商构建器以及新手引导/配置辅助函数）。
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
        对于需要在通用 HTTP 或 WebSocket 传输上附加原生请求/会话标头或元数据的提供商：

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

        `resolveUsageAuth` 有三种结果。当提供商拥有用量/计费凭证时，返回 `{ token, accountId? }`。只有在提供商已明确处理用量认证、但没有可用的用量令牌，并且 OpenClaw 必须跳过通用 API 密钥/OAuth 回退时，才返回 `{ handled: true }`。当提供商未处理该请求且 OpenClaw 应继续使用通用回退时，返回 `null` 或 `undefined`。

        在 `contracts.usageProviders` 中声明提供商 ID。当该清单契约和**两个**钩子都存在时，OpenClaw 会自动将该提供商纳入用量收集，而无需加载无关的提供商插件。不需要更新核心允许列表。
        `fetchUsageSnapshot` 返回共享的、提供商中立的结构：

        - `plan`：提供商报告的订阅或密钥标签
        - `windows`：以已用百分比表示的可重置配额窗口
        - `billing`：类型化的 `balance`、`spend` 或 `budget` 条目；`unit` 可以是 ISO 货币，也可以是提供商单位，例如 `credits`
        - `summary`：无法放入这些结构化字段的紧凑提供商特定上下文

        保持货币语义精确。除非上游契约如此说明，否则提供商积分不是 USD。只实现 `fetchUsageSnapshot` 的插件仍可供显式/合成调用方使用，但不会被自动发现，因为 OpenClaw 无法解析它的用量凭证。
      </Tab>
    </Tabs>

    <Accordion title="常见提供商钩子">
      对于模型/提供商插件，OpenClaw 大致按此顺序调用钩子。大多数提供商只使用 2-3 个。这不是完整的 `ProviderPlugin` 契约；请参阅 [内部机制：提供商运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)，获取完整且当前准确的钩子列表和回退说明。仅为兼容而保留、OpenClaw 不再调用的提供商字段不会在此列出，例如 `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`。

      | 钩子 | 使用时机 |
      | --- | --- |
      | `catalog` | 模型目录或基础 URL 默认值 |
      | `applyConfigDefaults` | 配置物化期间由提供商拥有的全局默认值 |
      | `normalizeModelId` | 查找前清理旧版/预览模型 ID 别名 |
      | `normalizeTransport` | 通用模型组装前清理提供商族的 `api` / `baseUrl` |
      | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | `applyNativeStreamingUsageCompat` | 面向配置提供商的原生流式用量兼容重写 |
      | `resolveConfigApiKey` | 提供商拥有的环境标记认证解析 |
      | `resolveSyntheticAuth` | 本地/自托管或配置支持的合成认证 |
      | `resolveExternalAuthProfiles` | 为 CLI/应用管理的凭证叠加提供商拥有的外部认证配置档案 |
      | `shouldDeferSyntheticProfileAuth` | 将合成的已存储配置档案占位符置于环境/配置认证之后 |
      | `resolveDynamicModel` | 接受任意上游模型 ID |
      | `prepareDynamicModel` | 解析前异步获取元数据 |
      | `normalizeResolvedModel` | 运行器前的传输重写 |
      | `normalizeToolSchemas` | 注册前由提供商拥有的工具 schema 清理 |
      | `inspectToolSchemas` | 提供商拥有的工具 schema 诊断 |
      | `resolveReasoningOutputMode` | 带标签与原生推理输出契约 |
      | `prepareExtraParams` | 默认请求参数 |
      | `createStreamFn` | 完全自定义的 StreamFn 传输 |
      | `wrapStreamFn` | 常规流路径上的自定义标头/正文包装器 |
      | `resolveTransportTurnState` | 原生逐轮标头/元数据 |
      | `resolveWebSocketSessionPolicy` | 原生 WS 会话标头/冷却时间 |
      | `formatApiKey` | 自定义运行时令牌结构 |
      | `refreshOAuth` | 自定义 OAuth 刷新 |
      | `buildAuthDoctorHint` | 认证修复指引 |
      | `matchesContextOverflowError` | 提供商拥有的溢出检测 |
      | `classifyFailoverReason` | 提供商拥有的速率限制/过载分类 |
      | `isCacheTtlEligible` | 提示缓存 TTL 门控 |
      | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | `augmentModelCatalog` | 合成前向兼容行（已弃用，请优先使用 `registerModelCatalogProvider`） |
      | `resolveThinkingProfile` | 模型特定的 `/think` 选项集 |
      | `isBinaryThinking` | 二元思考开/关兼容性（已弃用，请优先使用 `resolveThinkingProfile`） |
      | `supportsXHighThinking` | `xhigh` 推理支持兼容性（已弃用，请优先使用 `resolveThinkingProfile`） |
      | `resolveDefaultThinkingLevel` | 默认 `/think` 策略兼容性（已弃用，请优先使用 `resolveThinkingProfile`） |
      | `isModernModelRef` | 实时/冒烟模型匹配 |
      | `prepareRuntimeAuth` | 推理前的令牌交换 |
      | `resolveUsageAuth` | 自定义用量凭证解析 |
      | `fetchUsageSnapshot` | 自定义用量端点 |
      | `createEmbeddingProvider` | 提供商拥有的、用于记忆/搜索的嵌入适配器 |
      | `buildReplayPolicy` | 自定义转录回放/压缩策略 |
      | `sanitizeReplayHistory` | 通用清理后的提供商特定回放重写 |
      | `validateReplayTurns` | 嵌入式运行器前的严格回放轮次验证 |
      | `onModelSelected` | 选择后的回调（例如遥测） |

      运行时回退说明：

      - `normalizeConfig` 为每个提供商 ID 解析一个拥有方插件（先是内置提供商，然后是匹配的运行时插件），并且只调用该钩子；不会扫描其他提供商。Google 自己的 `normalizeConfig` 钩子会规范化 `google` / `google-vertex` / `google-antigravity` 配置条目；它不是单独的核心回退。
      - `resolveConfigApiKey` 在公开时使用提供商钩子。Amazon Bedrock 将 AWS 环境标记解析保留在其提供商插件中；配置为 `auth: "aws-sdk"` 时，运行时认证本身仍使用 AWS SDK 默认链。
      - `resolveThinkingProfile(ctx)` 接收已选择的 `provider`、`modelId`、可选的合并后 `reasoning` 目录提示，以及可选的合并后模型 `compat` 事实。仅使用 `compat` 选择该提供商的思考 UI/配置档案。
      - `resolveSystemPromptContribution` 允许提供商为某个模型族注入缓存感知的系统提示指引。当行为属于单个提供商/模型族并且应保留稳定/动态缓存拆分时，优先使用它，而不是旧版插件范围的 `before_prompt_build` 钩子。

    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    ### 步骤 5：添加额外能力

    提供商插件可以在文本推理之外注册嵌入、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 获取和 Web 搜索。OpenClaw 将其归类为**混合能力**插件，这是公司插件的推荐模式（每个厂商一个插件）。请参阅[内部机制：能力所有权](/zh-CN/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 中注册每项能力，并与你现有的 `api.registerProvider(...)` 调用放在一起。只选择你需要的标签页：

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

        对提供商 HTTP 失败使用 `assertOkOrThrowProviderError(...)`，这样插件就能共享受限的错误正文读取、JSON 错误解析和请求 ID 后缀。
      </Tab>
      <Tab title="实时转录">
        优先使用 `createRealtimeTranscriptionWebSocketSession(...)`；共享辅助函数会处理代理捕获、重连退避、关闭刷新、就绪握手、音频排队和关闭事件诊断。你的插件只需映射上游事件。

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

        批量 STT 提供商如果通过 POST 发送 multipart 音频，应使用
        来自 `openclaw/plugin-sdk/provider-http` 的
        `buildAudioTranscriptionFormData(...)`。该辅助函数会规范化上传
        文件名，包括需要 M4A 风格文件名以兼容转录 API 的 AAC 上传。
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
        客户端公开有效模式、传输协议、音频格式和功能标志。当传输协议能检测到
        用户正在打断助手播放，并且提供商支持截断或清除当前音频响应时，
        实现 `handleBargeIn`。
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

        本地或自托管媒体提供商如果有意不要求凭证，可以公开 `resolveAuth`
        并返回 `kind: "none"`。对于没有显式选择加入的提供商，OpenClaw
        仍会保留常规凭证门控。现有提供商可以继续读取 `req.apiKey`；
        新提供商应优先使用 `req.auth`。

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

        在 `contracts.embeddingProviders` 中声明相同 id。这是用于可复用向量生成的
        通用 embedding 契约，包括记忆搜索。`registerMemoryEmbeddingProvider(...)`
        是面向现有记忆专用适配器的已弃用兼容机制。
      </Tab>
      <Tab title="Image and video generation">
        图像和视频能力使用**模式感知**结构。图像提供商声明必需的
        `generate` 和 `edit` 能力块；视频提供商声明 `generate`、
        `imageToVideo` 和 `videoToVideo`。像 `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` 这样的扁平聚合字段，
        不足以清晰声明转换模式支持或已禁用的模式。音乐生成遵循相同的
        `generate` / `edit` 模式。

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

        两种提供商类型都必须包含 `capabilities`；`edit` 和视频转换块
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
        `getCredentialValue`、`setCredentialValue` 和 `createTool` 都是必需的。
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

提供商插件的发布方式与任何其他外部代码插件相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` 是用于发布技能文件夹的另一个命令，
不是插件包，请不要在这里使用它。

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

`catalog.order` 控制你的目录相对于内置提供商何时合并：

| 顺序      | 时机          | 使用场景                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一轮        | 普通 API key 提供商                             |
| `profile` | simple 之后   | 受凭证配置文件门控的提供商                      |
| `paired`  | profile 之后  | 合成多个相关条目                                |
| `late`    | 最后一轮      | 覆盖现有提供商（冲突时胜出）                    |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 如果你的插件也提供渠道
- [SDK Runtime](/zh-CN/plugins/sdk-runtime) - `api.runtime` 辅助函数（TTS、搜索、子智能体）
- [SDK 概览](/zh-CN/plugins/sdk-overview) - 完整子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture-internals#provider-runtime-hooks) - 钩子详情和内置示例

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [构建渠道插件](/zh-CN/plugins/sdk-channel-plugins)
