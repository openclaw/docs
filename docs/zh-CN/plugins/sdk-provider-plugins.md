---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想向 OpenClaw 添加 OpenAI 兼容代理或自定义 LLM
    - 你需要了解提供商凭证、目录和运行时钩子
sidebarTitle: Provider plugins
summary: 构建 OpenClaw 模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-05-02T20:50:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

本指南将演示如何构建一个 provider 插件，为 OpenClaw 添加一个模型提供商（LLM）。完成后，你将拥有一个带有模型目录、API key 认证和动态模型解析的 provider。

<Info>
  如果你之前没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础包结构和清单设置。
</Info>

<Tip>
  Provider 插件会把模型添加到 OpenClaw 的常规推理循环中。如果模型必须通过拥有线程、压缩或工具事件的原生智能体守护进程运行，请将 provider 与 [智能体运行框架](/zh-CN/plugins/sdk-agent-harness) 配套使用，而不是把守护进程协议细节放进核心中。
</Tip>

## 演练

<Steps>
  <Step title="Package and manifest">
    ### 步骤 1：包和清单

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

    清单声明 `providerAuthEnvVars`，这样 OpenClaw 就能在不加载你的插件运行时的情况下检测凭证。当某个 provider 变体应复用另一个 provider id 的认证时，添加 `providerAuthAliases`。`modelSupport` 是可选的，它让 OpenClaw 可以在运行时钩子存在之前，根据 `acme-large` 这类简写模型 id 自动加载你的 provider 插件。如果你在 ClawHub 上发布该 provider，则 `package.json` 中必须包含这些 `openclaw.compat` 和 `openclaw.build` 字段。

  </Step>

  <Step title="Register the provider">
    一个最小 provider 需要 `id`、`label`、`auth` 和 `catalog`：

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

    这就是一个可工作的 provider。用户现在可以运行
    `openclaw onboard --acme-ai-api-key <key>`，并选择
    `acme-ai/acme-large` 作为他们的模型。

    如果上游 provider 使用的控制 token 与 OpenClaw 不同，请添加一个小型双向文本转换，而不是替换流路径：

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

    `input` 会在传输前重写最终系统提示词和文本消息内容。`output` 会在 OpenClaw 解析自身控制标记或渠道投递之前，重写助手文本增量和最终文本。

    对于仅注册一个带 API-key 认证的文本 provider，并且只包含一个由目录支持的运行时的内置 provider，请优先使用更窄的
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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` 是当 OpenClaw 可以解析真实 provider 认证时使用的实时目录路径。它可以执行 provider 专属的发现逻辑。仅将 `buildStaticProvider` 用于在配置认证前可以安全展示的离线行；它不得需要凭证或发起网络请求。OpenClaw 的 `models list --all` 显示目前只会对内置 provider 插件执行静态目录，并使用空配置、空环境且不提供智能体/工作区路径。

    如果你的认证流程还需要在新手引导期间修补 `models.providers.*`、别名和智能体默认模型，请使用来自
    `openclaw/plugin-sdk/provider-onboard` 的预设辅助函数。范围最窄的辅助函数是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    当 provider 的原生端点支持在常规 `openai-completions` 传输上进行流式 usage 块时，请优先使用
    `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助函数，而不是硬编码 provider-id 检查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 会根据端点能力映射检测支持情况，因此即使插件使用自定义 provider id，原生 Moonshot/DashScope 风格端点仍然可以选择启用。

  </Step>

  <Step title="Add dynamic model resolution">
    如果你的 provider 接受任意模型 ID（例如代理或路由器），请添加 `resolveDynamicModel`：

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

    如果解析需要网络调用，请使用 `prepareDynamicModel` 进行异步预热 — 它完成后会再次运行 `resolveDynamicModel`。

  </Step>

  <Step title="Add runtime hooks (as needed)">
    大多数 provider 只需要 `catalog` + `resolveDynamicModel`。请随着你的 provider 需求逐步添加钩子。

    共享辅助构建器现在覆盖了最常见的重放/工具兼容系列，因此插件通常不需要逐个手动连接每个钩子：

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

    | 系列 | 它接入的内容 | 内置示例 |
    | --- | --- | --- |
    | `openai-compatible` | 用于 OpenAI 兼容传输的共享 OpenAI 风格重放策略，包括 tool-call-id 清理、assistant-first 排序修复，以及传输需要时的通用 Gemini-turn 校验 | `moonshot`、`ollama`、`xai`、`zai` |
    | `anthropic-by-model` | 按 `modelId` 选择的 Claude 感知重放策略，因此 Anthropic-message 传输只有在解析后的模型确实是 Claude id 时，才会获得 Claude 专属 thinking-block 清理 | `amazon-bedrock`、`anthropic-vertex` |
    | `google-gemini` | 原生 Gemini 重放策略，加上 bootstrap 重放清理和带标签的 reasoning-output 模式 | `google`、`google-gemini-cli` |
    | `passthrough-gemini` | 适用于通过 OpenAI 兼容代理传输运行的 Gemini 模型的 Gemini thought-signature 清理；不会启用原生 Gemini 重放校验或 bootstrap 重写 | `openrouter`、`kilocode`、`opencode`、`opencode-go` |
    | `hybrid-anthropic-openai` | 用于在一个插件中混合 Anthropic-message 和 OpenAI 兼容模型表面的 provider 的混合策略；可选的仅 Claude thinking-block 丢弃会限定在 Anthropic 侧 | `minimax` |

    今日可用的流系列：

    | 系列 | 接入内容 | 内置示例 |
    | --- | --- | --- |
    | `google-thinking` | 共享流路径上的 Gemini thinking 载荷规范化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo 推理包装器，`kilo/auto` 和不受支持的代理推理 ID 会跳过注入的 thinking | `kilocode` |
    | `moonshot-thinking` | 基于配置 + `/think` 等级的 Moonshot 二进制原生 thinking 载荷映射 | `moonshot` |
    | `minimax-fast-mode` | 共享流路径上的 MiniMax fast-mode 模型重写 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses 包装器：归因标头、`/fast`/`serviceTier`、文本详细程度、原生 Codex Web 搜索、推理兼容载荷塑形，以及 Responses 上下文管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | 面向代理路由的 OpenRouter 推理包装器，集中处理不受支持模型/`auto` 的跳过逻辑 | `openrouter` |
    | `tool-stream-default-on` | 面向 Z.AI 等提供商的默认开启 `tool_stream` 包装器，这些提供商希望在未显式禁用时启用工具流式传输 | `zai` |

    <Accordion title="支撑系列构建器的 SDK 接缝">
      每个系列构建器都由同一包导出的较低层公共 helper 组合而成；当提供商需要偏离通用模式时，你可以使用这些 helper：

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始 replay 构建器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。还导出 Gemini replay helper（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）和端点/模型 helper（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共享 OpenAI/Codex 包装器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 兼容包装器（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking 预填充清理（`createAnthropicThinkingPrefillPayloadWrapper`），以及共享代理/提供商包装器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、底层 Gemini schema helper（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`），以及 xAI 兼容 helper（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。内置 xAI 插件会结合这些 helper 使用 `normalizeResolvedModel` + `contributeResolvedModelCompat`，以确保 xAI 规则由提供商拥有。

      有些流 helper 会刻意保留在提供商本地。`@openclaw/anthropic-provider` 将 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及较低层 Anthropic 包装器构建器保留在它自己的公共 `api.ts` / `contract-api.ts` 接缝中，因为它们编码了 Claude OAuth beta 处理和 `context1m` 门控。xAI 插件同样将原生 xAI Responses 塑形保留在自己的 `wrapStreamFn` 中（`/fast` 别名、默认 `tool_stream`、不受支持 strict-tool 清理、xAI 特定的推理载荷移除）。

      同一包根模式也支撑 `@openclaw/openai-provider`（提供商构建器、默认模型 helper、实时提供商构建器）和 `@openclaw/openrouter-provider`（提供商构建器，以及新手引导/配置 helper）。
    </Accordion>

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
      <Tab title="自定义标头">
        对于需要自定义请求标头或请求体修改的提供商：

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
      <Tab title="用量与计费">
        对于暴露用量/计费数据的提供商：

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

    <Accordion title="所有可用提供商钩子">
      OpenClaw 会按此顺序调用钩子。大多数提供商只使用 2-3 个：
      OpenClaw 已不再调用的仅兼容提供商字段，例如 `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，不会列在这里。

      | # | 钩子 | 何时使用 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或基础 URL 默认值 |
      | 2 | `applyConfigDefaults` | 配置实体化期间由提供商拥有的全局默认值 |
      | 3 | `normalizeModelId` | 查找前清理旧版/预览模型 ID 别名 |
      | 4 | `normalizeTransport` | 通用模型组装前清理提供商系列 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 面向配置提供商的原生流式用量兼容重写 |
      | 7 | `resolveConfigApiKey` | 由提供商拥有的环境标记认证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或配置支撑的合成认证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将合成存储配置文件占位符置于 env/config 认证之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 解析前异步获取元数据 |
      | 12 | `normalizeResolvedModel` | runner 前的传输重写 |
      | 13 | `contributeResolvedModelCompat` | 位于另一兼容传输之后的供应商模型兼容标志 |
      | 14 | `normalizeToolSchemas` | 注册前由提供商拥有的工具 schema 清理 |
      | 15 | `inspectToolSchemas` | 由提供商拥有的工具 schema 诊断 |
      | 16 | `resolveReasoningOutputMode` | 标记式与原生推理输出契约 |
      | 17 | `prepareExtraParams` | 默认请求参数 |
      | 18 | `createStreamFn` | 完全自定义的 StreamFn 传输 |
      | 19 | `wrapStreamFn` | 常规流路径上的自定义标头/请求体包装器 |
      | 20 | `resolveTransportTurnState` | 原生每轮标头/元数据 |
      | 21 | `resolveWebSocketSessionPolicy` | 原生 WS 会话标头/冷却 |
      | 22 | `formatApiKey` | 自定义运行时令牌形态 |
      | 23 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 24 | `buildAuthDoctorHint` | 认证修复指引 |
      | 25 | `matchesContextOverflowError` | 由提供商拥有的溢出检测 |
      | 26 | `classifyFailoverReason` | 由提供商拥有的速率限制/过载分类 |
      | 27 | `isCacheTtlEligible` | prompt 缓存 TTL 门控 |
      | 28 | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | 29 | `augmentModelCatalog` | 合成的前向兼容行 |
      | 30 | `resolveThinkingProfile` | 模型特定的 `/think` 选项集 |
      | 31 | `isBinaryThinking` | 二进制 thinking 开/关兼容性 |
      | 32 | `supportsXHighThinking` | `xhigh` 推理支持兼容性 |
      | 33 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略兼容性 |
      | 34 | `isModernModelRef` | live/smoke 模型匹配 |
      | 35 | `prepareRuntimeAuth` | 推理前令牌交换 |
      | 36 | `resolveUsageAuth` | 自定义用量凭证解析 |
      | 37 | `fetchUsageSnapshot` | 自定义用量端点 |
      | 38 | `createEmbeddingProvider` | 由提供商拥有的 memory/search 嵌入适配器 |
      | 39 | `buildReplayPolicy` | 自定义转录 replay/压缩策略 |
      | 40 | `sanitizeReplayHistory` | 通用清理后的提供商特定 replay 重写 |
      | 41 | `validateReplayTurns` | 嵌入式 runner 前的严格 replay turn 校验 |
      | 42 | `onModelSelected` | 选择后的回调（例如遥测） |

      运行时回退说明：

      - `normalizeConfig` 会先检查匹配的提供商，然后检查其他具备钩子能力的提供商插件，直到某个插件实际更改配置。如果没有提供商钩子重写受支持的 Google 系列配置项，则仍会应用内置 Google 配置规范化器。
      - `resolveConfigApiKey` 会在提供商钩子暴露时使用它。内置 `amazon-bedrock` 路径这里也有内建 AWS 环境标记解析器，即便 Bedrock 运行时认证本身仍使用 AWS SDK 默认链。
      - `resolveSystemPromptContribution` 允许提供商为一个模型系列注入缓存感知的系统提示指引。当行为属于单个提供商/模型系列，并且应保留稳定/动态缓存拆分时，优先使用它，而不是 `before_prompt_build`。

      如需详细描述和真实示例，请参阅 [内部机制：提供商运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    ### 步骤 5：添加额外能力

    提供商插件可以在文本推理之外注册语音、实时转写、实时语音、媒体理解、图像生成、视频生成、Web 获取和 Web 搜索。OpenClaw 将其归类为 **hybrid-capability** 插件，这是公司插件（每个供应商一个插件）的推荐模式。参见 [内部机制：能力所有权](/zh-CN/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 内与你现有的 `api.registerProvider(...)` 调用一起注册每项能力。只选择你需要的标签页：

    <Tabs>
      <Tab title="Speech (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
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
        插件可共享受限的错误正文读取、JSON 错误解析以及
        请求 ID 后缀。
      </Tab>
      <Tab title="Realtime transcription">
        优先使用 `createRealtimeTranscriptionWebSocketSession(...)`——这个共享
        辅助函数会处理代理捕获、重连退避、关闭刷新、就绪
        握手、音频队列以及关闭事件诊断。你的插件
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

        通过 POST multipart 音频的批量 STT 提供商应使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。该辅助函数会规范化上传
        文件名，包括需要 M4A 风格文件名以兼容转录 API 的 AAC 上传。
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
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

        当传输协议可以检测到人类正在打断助手播放，并且提供商支持截断或
        清除当前音频响应时，实现 `handleBargeIn`。
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
      </Tab>
      <Tab title="Image and video generation">
        视频能力使用**感知模式**的形状：`generate`、
        `imageToVideo` 和 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 这样的扁平聚合字段
        不足以清晰声明转换模式支持或已禁用的模式。
        音乐生成也遵循相同模式，使用显式的 `generate` /
        `edit` 块。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
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
          search: async (req) => ({ content: [] }),
        });
        ```
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

不要在这里使用旧版仅 Skills 发布别名；插件包应使用
`clawhub package publish`。

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

`catalog.order` 控制你的目录相对于内置
提供商何时合并：

| 顺序      | 时间          | 使用场景                                      |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | 第一轮        | 普通 API key 提供商                           |
| `profile` | `simple` 之后 | 受身份验证配置文件控制的提供商                |
| `paired`  | `profile` 之后 | 合成多个相关条目                              |
| `late`    | 最后一轮      | 覆盖现有提供商（冲突时优先）                  |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins)——如果你的插件也提供渠道
- [SDK 运行时](/zh-CN/plugins/sdk-runtime)——`api.runtime` 辅助函数（TTS、搜索、子智能体）
- [SDK 概览](/zh-CN/plugins/sdk-overview)——完整子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)——钩子详情和内置示例

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [构建渠道插件](/zh-CN/plugins/sdk-channel-plugins)
