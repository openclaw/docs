---
read_when:
    - 你正在构建一个新的模型 provider 插件
    - 你想为 OpenClaw 添加一个兼容 OpenAI 的代理或自定义 LLM
    - 你需要理解 provider 认证、目录和运行时 hooks
sidebarTitle: Provider Plugins
summary: 构建 OpenClaw 模型 provider 插件的分步指南
title: 构建 Provider 插件
x-i18n:
    generated_at: "2026-04-05T08:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e781e5fc436b2189b9f8cc63e7611f49df1fd2526604a0596a0631f49729b085
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# 构建 Provider 插件

本指南将带你构建一个为 OpenClaw 添加模型 provider（LLM）的 provider 插件。完成后，你将拥有一个具备模型目录、API key 认证和动态模型解析能力的 provider。

<Info>
  如果你此前从未构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/plugins/building-plugins)，了解基本的软件包结构和清单设置。
</Info>

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="软件包与清单">
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

    该清单声明了 `providerAuthEnvVars`，以便 OpenClaw 在不加载你的插件运行时的情况下检测凭证。`modelSupport` 是可选项，它允许 OpenClaw 在运行时 hooks 存在之前，就通过 `acme-large` 这样的简写模型 id 自动加载你的 provider 插件。如果你要将该 provider 发布到 ClawHub，那么 `package.json` 中的这些 `openclaw.compat` 和 `openclaw.build` 字段是必需的。

  </Step>

  <Step title="注册 provider">
    一个最小可用的 provider 需要 `id`、`label`、`auth` 和 `catalog`：

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

    这样就是一个可工作的 provider。用户现在可以运行
    `openclaw onboard --acme-ai-api-key <key>`，并选择
    `acme-ai/acme-large` 作为他们的模型。

    对于只注册一个文本 provider、使用 API key 认证并带有单个基于目录的运行时的内置 provider，优先使用更窄的
    `defineSingleProviderPluginEntry(...)` 辅助函数：

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

    如果你的认证流程还需要在新手引导期间补丁 `models.providers.*`、别名以及智能体默认模型，请使用来自
    `openclaw/plugin-sdk/provider-onboard` 的预设辅助函数。最窄的辅助函数包括
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    当某个 provider 的原生端点在普通 `openai-completions` 传输上支持流式 usage 块时，优先使用
    `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助函数，而不是硬编码 provider-id 检查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 会根据端点能力映射检测支持情况，因此即使插件使用的是自定义 provider id，原生 Moonshot/DashScope 风格端点也仍然可以选择启用。

  </Step>

  <Step title="添加动态模型解析">
    如果你的 provider 接受任意模型 ID（例如代理或路由器），请添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... 上文中的 id、label、auth、catalog

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

    如果解析需要网络调用，请使用 `prepareDynamicModel` 进行异步预热——在其完成后会再次运行 `resolveDynamicModel`。

  </Step>

  <Step title="按需添加运行时 hooks">
    大多数 provider 只需要 `catalog` + `resolveDynamicModel`。请根据你的 provider 需求逐步增加 hooks。

    共享辅助构建器现在已覆盖最常见的 replay/tool compat 系列，因此插件通常不需要再逐个手动接线每个 hook：

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

    当前可用的 replay 系列：

    | 系列 | 会接入的内容 |
    | --- | --- |
    | `openai-compatible` | 面向兼容 OpenAI 传输的共享 OpenAI 风格 replay 策略，包括 tool-call-id 清理、assistant-first 顺序修复，以及在传输需要时通用的 Gemini 回合校验 |
    | `anthropic-by-model` | 根据 `modelId` 选择的 Claude 感知 replay 策略，因此 Anthropic-message 传输只有在解析出的模型实际是 Claude id 时才会进行 Claude 专属的 thinking 块清理 |
    | `google-gemini` | 原生 Gemini replay 策略，加上 bootstrap replay 清理和带标签的 reasoning-output 模式 |
    | `passthrough-gemini` | 面向通过兼容 OpenAI 的代理传输运行的 Gemini 模型的 Gemini thought-signature 清理；不会启用原生 Gemini replay 校验或 bootstrap 重写 |
    | `hybrid-anthropic-openai` | 面向在同一插件中混合 Anthropic-message 和兼容 OpenAI 模型界面的 provider 的混合策略；可选的仅限 Claude 的 thinking 块丢弃会继续局限在 Anthropic 一侧 |

    真实内置示例：

    - `google` 和 `google-gemini-cli`：`google-gemini`
    - `openrouter`、`kilocode`、`opencode` 和 `opencode-go`：`passthrough-gemini`
    - `amazon-bedrock` 和 `anthropic-vertex`：`anthropic-by-model`
    - `minimax`：`hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai` 和 `zai`：`openai-compatible`

    当前可用的 stream 系列：

    | 系列 | 会接入的内容 |
    | --- | --- |
    | `google-thinking` | 共享流路径上的 Gemini thinking 负载规范化 |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo reasoning 包装器，其中 `kilo/auto` 和不受支持的代理 reasoning id 会跳过注入的 thinking |
    | `moonshot-thinking` | 基于配置 + `/think` 级别的 Moonshot 二进制 native-thinking 负载映射 |
    | `minimax-fast-mode` | 共享流路径上的 MiniMax fast-mode 模型重写 |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses 包装器：归属头、`/fast`/`serviceTier`、文本详细度、原生 Codex Web 搜索、reasoning compat 负载整形，以及 Responses 上下文管理 |
    | `openrouter-thinking` | 用于代理路由的 OpenRouter reasoning 包装器，并由中心统一处理不支持模型/`auto` 的跳过逻辑 |
    | `tool-stream-default-on` | 面向像 Z.AI 这类默认希望启用 tool streaming 的 provider 的默认开启 `tool_stream` 包装器，除非显式禁用 |

    真实内置示例：

    - `google` 和 `google-gemini-cli`：`google-thinking`
    - `kilocode`：`kilocode-thinking`
    - `moonshot`：`moonshot-thinking`
    - `minimax` 和 `minimax-portal`：`minimax-fast-mode`
    - `openai` 和 `openai-codex`：`openai-responses-defaults`
    - `openrouter`：`openrouter-thinking`
    - `zai`：`tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` 还导出了 replay-family 枚举，以及这些系列构建所复用的共享辅助函数。常见公共导出包括：

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - 共享 replay 构建器，例如 `buildOpenAICompatibleReplayPolicy(...)`、
      `buildAnthropicReplayPolicyForModel(...)`、
      `buildGoogleGeminiReplayPolicy(...)` 和
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini replay 辅助函数，例如 `sanitizeGoogleGeminiReplayHistory(...)`
      和 `resolveTaggedReasoningOutputMode()`
    - 端点/模型辅助函数，例如 `resolveProviderEndpoint(...)`、
      `normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)` 和
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` 同时公开了 family 构建器以及这些 family 复用的公共包装器辅助函数。常见公共导出包括：

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - 共享 OpenAI/Codex 包装器，例如
      `createOpenAIAttributionHeadersWrapper(...)`、
      `createOpenAIFastModeWrapper(...)`、
      `createOpenAIServiceTierWrapper(...)`、
      `createOpenAIResponsesContextManagementWrapper(...)` 和
      `createCodexNativeWebSearchWrapper(...)`
    - 共享代理/provider 包装器，例如 `createOpenRouterWrapper(...)`、
      `createToolStreamWrapper(...)` 和 `createMinimaxFastModeWrapper(...)`

    某些 stream 辅助函数会有意保持为 provider 本地。当前内置示例：`@openclaw/anthropic-provider` 通过其公共 `api.ts` /
    `contract-api.ts` 接缝导出 `wrapAnthropicProviderStream`、
    `resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及更底层的 Anthropic 包装器构建器。这些辅助函数之所以保持 Anthropic 专属，是因为它们还编码了 Claude OAuth beta 处理和 `context1m` 门控。

    其他内置 provider 也会在行为无法在 family 之间干净共享时，将传输专属包装器保留在本地。当前示例：内置 xAI 插件会在其自有 `wrapStreamFn` 中保留原生 xAI Responses 整形，包括 `/fast` 别名重写、默认 `tool_stream`、不支持的 strict-tool 清理，以及 xAI 专属 reasoning 负载移除。

    `openclaw/plugin-sdk/provider-tools` 当前公开了一个共享工具 schema 系列以及共享 schema/compat 辅助函数：

    - `ProviderToolCompatFamily` 记录了当前共享 family 清单。
    - `buildProviderToolCompatFamilyHooks("gemini")` 为需要 Gemini 安全工具 schema 的 provider 接入 Gemini schema 清理 + 诊断。
    - `normalizeGeminiToolSchemas(...)` 和 `inspectGeminiToolSchemas(...)`
      是底层公开的 Gemini schema 辅助函数。
    - `resolveXaiModelCompatPatch()` 返回内置 xAI compat 补丁：
      `toolSchemaProfile: "xai"`、不支持的 schema 关键字、原生
      `web_search` 支持，以及 HTML 实体 tool-call 参数解码。
    - `applyXaiModelCompat(model)` 会在模型进入 runner 之前，对已解析模型应用同一份 xAI compat 补丁。

    真实内置示例：xAI 插件使用 `normalizeResolvedModel` 加上
    `contributeResolvedModelCompat`，以让这些 compat 元数据继续由 provider 持有，而不是在 core 中硬编码 xAI 规则。

    相同的 package-root 模式也支撑着其他内置 provider：

    - `@openclaw/openai-provider`：`api.ts` 导出 provider 构建器、
      默认模型辅助函数和 realtime provider 构建器
    - `@openclaw/openrouter-provider`：`api.ts` 导出 provider 构建器，
      以及新手引导/配置辅助函数

    <Tabs>
      <Tab title="Token exchange">
        对于需要在每次推理调用前进行 token 交换的 provider：

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
        对于需要自定义请求头或请求体修改的 provider：

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
        对于需要在通用 HTTP 或 WebSocket 传输上附加原生请求/会话头或元数据的 provider：

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
      <Tab title="Usage and billing">
        对于暴露 usage/计费数据的 provider：

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

    <Accordion title="所有可用的 provider hooks">
      OpenClaw 会按以下顺序调用 hooks。大多数 provider 只会用到 2–3 个：

      | # | Hook | 使用时机 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或基础 URL 默认值 |
      | 2 | `applyConfigDefaults` | 在配置实体化期间应用 provider 自有的全局默认值 |
      | 3 | `normalizeModelId` | 在查找前清理旧版/预览模型 id 别名 |
      | 4 | `normalizeTransport` | 在通用模型组装前清理 provider-family 的 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 为配置 provider 应用原生流式 usage compat 重写 |
      | 7 | `resolveConfigApiKey` | provider 自有的 env-marker 认证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或基于配置的 synthetic 认证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将 synthetic 存储配置占位符排在 env/config 认证之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 在解析前进行异步元数据获取 |
      | 12 | `normalizeResolvedModel` | 在 runner 之前进行传输重写 |

    运行时回退说明：

    - `normalizeConfig` 会先检查已匹配 provider，然后再检查其他支持 hook 的 provider 插件，直到其中某个实际修改了配置。
      如果没有任何 provider hook 重写受支持的 Google-family 配置项，仍会应用内置 Google 配置规范化器。
    - `resolveConfigApiKey` 在有暴露 provider hook 时会使用该 hook。内置
      `amazon-bedrock` 路径此处也有一个内建的 AWS env-marker 解析器，
      即使 Bedrock 运行时认证本身仍使用 AWS SDK 默认链。
      | 13 | `contributeResolvedModelCompat` | 为通过另一种兼容传输暴露的厂商模型提供 compat 标志 |
      | 14 | `capabilities` | 旧版静态能力包；仅兼容用途 |
      | 15 | `normalizeToolSchemas` | 在注册前执行 provider 自有工具 schema 清理 |
      | 16 | `inspectToolSchemas` | provider 自有工具 schema 诊断 |
      | 17 | `resolveReasoningOutputMode` | 带标签与原生 reasoning-output 契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义的 StreamFn 传输 |
      | 20 | `wrapStreamFn` | 普通流路径上的自定义头/请求体包装器 |
      | 21 | `resolveTransportTurnState` | 原生逐回合头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS 会话头/冷却 |
      | 23 | `formatApiKey` | 自定义运行时 token 形式 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 认证修复指引 |
      | 26 | `matchesContextOverflowError` | provider 自有溢出检测 |
      | 27 | `classifyFailoverReason` | provider 自有的限流/过载分类 |
      | 28 | `isCacheTtlEligible` | prompt 缓存 TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏陈旧上游条目 |
      | 31 | `augmentModelCatalog` | synthetic 前向兼容条目 |
      | 32 | `isBinaryThinking` | 二元 thinking 开/关 |
      | 33 | `supportsXHighThinking` | `xhigh` reasoning 支持 |
      | 34 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略 |
      | 35 | `isModernModelRef` | live/smoke 模型匹配 |
      | 36 | `prepareRuntimeAuth` | 推理前的 token 交换 |
      | 37 | `resolveUsageAuth` | 自定义 usage 凭证解析 |
      | 38 | `fetchUsageSnapshot` | 自定义 usage 端点 |
      | 39 | `createEmbeddingProvider` | 用于 memory/search 的 provider 自有 embedding 适配器 |
      | 40 | `buildReplayPolicy` | 自定义 transcript replay/压缩策略 |
      | 41 | `sanitizeReplayHistory` | 通用清理后的 provider 专属 replay 重写 |
      | 42 | `validateReplayTurns` | 内嵌 runner 之前的严格 replay-turn 校验 |
      | 43 | `onModelSelected` | 选择后的回调（例如遥测） |

      有关详细说明和真实示例，请参见
      [Internals: Provider Runtime Hooks](/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    <a id="step-5-add-extra-capabilities"></a>
    一个 provider 插件除了文本推理外，还可以注册 speech、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取和网页搜索：

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
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
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

    OpenClaw 会将这类插件归类为**混合能力**插件。这是公司插件（每个厂商一个插件）的推荐模式。参见
    [Internals: Capability Ownership](/plugins/architecture#capability-ownership-model)。

  </Step>

  <Step title="测试">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // 从 index.ts 或专门文件中导出你的 provider 配置对象
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

Provider 插件的发布方式与任何其他外部代码插件相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

这里不要使用旧版的仅限 skill 的发布别名；插件软件包应使用
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

`catalog.order` 控制你的目录相对于内置 provider 的合并时机：

| 顺序      | 时机          | 用例                          |
| --------- | ------------- | ----------------------------- |
| `simple`  | 第一轮        | 普通 API key provider         |
| `profile` | 在 simple 之后 | 受认证配置控制的 provider     |
| `paired`  | 在 profile 之后 | 合成多个相关条目              |
| `late`    | 最后一轮      | 覆盖现有 provider（冲突时胜出） |

## 后续步骤

- [Channel Plugins](/plugins/sdk-channel-plugins) — 如果你的插件也提供渠道
- [Plugin Runtime](/plugins/sdk-runtime) — `api.runtime` 辅助函数（TTS、搜索、子智能体）
- [SDK Overview](/plugins/sdk-overview) — 完整子路径导入参考
- [Plugin Internals](/plugins/architecture#provider-runtime-hooks) — hook 细节和内置示例
