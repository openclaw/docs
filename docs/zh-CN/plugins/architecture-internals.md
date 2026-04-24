---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或包打包功能
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载流水线、注册表、运行时钩子、HTTP 路由和参考表格
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-24T05:09:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01e258ab1666f7aff112fa3f897a40bf28dccaa8d06265fcf21e53479ee1ebda
    source_path: plugins/architecture-internals.md
    workflow: 15
---

关于公开能力模型、插件形态以及所有权/执行契约，请参见 [插件架构](/zh-CN/plugins/architecture)。本页是内部机制的参考：加载流水线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和架构表格。

## 加载流水线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容打包产物的清单和包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选项是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 `jiti`
7. 调用原生 `register(api)` 钩子，并将注册结果收集到插件注册表中
8. 将注册表暴露给命令/运行时表面

<Note>
`activate` 是 `register` 的旧别名——加载器会解析存在的那个（`def.register ?? def.activate`），并在相同时间点调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全检查会在运行时执行**之前**发生。当入口逃逸出插件根目录、路径对所有人可写，或对于非内置插件而言路径所有权看起来可疑时，候选项会被阻止。

### 清单优先行为

清单是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现声明的渠道/Skills/配置架构或打包能力
- 验证 `plugins.entries.<id>.config`
- 增强控制 UI 标签/占位符
- 显示安装/目录元数据
- 在不加载插件运行时的情况下保留轻量的激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如钩子、工具、命令或提供商流程。

可选的清单 `activation` 和 `setup` 块仍然留在控制平面。它们是用于激活规划和设置发现的纯元数据描述符；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。首批实时激活使用方现在会使用清单中的命令、渠道和提供商提示，在更广泛的注册表具体化之前缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置/插件解析会缩小到拥有所请求渠道 id 的插件
- 显式提供商设置/运行时解析会缩小到拥有所请求提供商 id 的插件

激活规划器同时暴露面向现有调用方的仅 id API，以及面向新诊断的规划 API。规划条目会报告某个插件为何被选中，并将显式 `activation.*` 规划器提示与清单所有权回退原因区分开来，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子。这种原因拆分就是兼容性边界：现有插件元数据仍然可以正常工作，而新代码可以检测宽泛提示或回退行为，而无需改变运行时加载语义。

设置发现现在会优先使用描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，在回退到 `setup-api` 之前先缩小候选插件范围；`setup-api` 用于那些仍然需要设置阶段运行时钩子的插件。如果发现的多个插件声明了同一个规范化设置提供商或 CLI 后端 id，设置查找会拒绝这个存在歧义的所有者，而不是依赖发现顺序。

### 加载器会缓存什么

OpenClaw 会在进程内维护一些短期缓存，用于：

- 发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存可以减少突发启动和重复命令的开销。你可以安全地将它们视为短生命周期的性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存时间窗口。

## 注册表模型

已加载的插件不会直接修改任意核心全局状态。它们会注册到一个中央插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、起源、状态、诊断）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

然后，核心功能会从这个注册表中读取，而不是直接与插件模块交互。这使得加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对于可维护性很重要。这意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在批准结果确定后作出响应。

使用 `api.onConversationBindingResolved(...)` 在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：用于已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 和会话元数据

这个回调仅用于通知。它不会改变谁被允许绑定会话，并且它会在核心批准处理完成后运行。

## 提供商运行时钩子

提供商插件有三层：

- 用于低成本运行时前查找的**清单元数据**：`providerAuthEnvVars`、`providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时钩子**：`catalog`（旧版 `discovery`）以及 `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，涵盖凭证、模型解析、流包装、思考级别、重放策略和用量端点。完整列表见下方的[钩子顺序和用法](#hook-order-and-usage)。

OpenClaw 仍然负责通用智能体循环、故障转移、转录处理和工具策略。这些钩子是提供商特定行为的扩展表面，无需实现完整的自定义推理传输。

当提供商具有基于环境变量的凭证，并且通用凭证/状态/模型选择器路径需要在不加载插件运行时的情况下看到这些凭证时，请使用清单中的 `providerAuthEnvVars`。当某个提供商 id 需要复用另一个提供商 id 的环境变量、凭证配置文件、基于配置的凭证和 API 密钥新手引导选择时，请使用清单中的 `providerAuthAliases`。当新手引导/凭证选择 CLI 表面需要在不加载提供商运行时的情况下知道该提供商的选择 id、分组标签和简单单标志凭证接线时，请使用清单中的 `providerAuthChoices`。把提供商运行时的 `envVars` 保留给面向运维人员的提示，例如新手引导标签或 OAuth `client-id`/`client-secret` 设置变量。

当某个渠道具有由环境变量驱动的凭证或设置，并且通用 shell 环境变量回退、配置/状态检查或设置提示需要在不加载渠道运行时的情况下看到这些内容时，请使用清单中的 `channelEnvVars`。

### 钩子顺序和用法

对于模型/提供商插件，OpenClaw 大致会按以下顺序调用这些钩子。
“何时使用”这一列是快速决策指南。

| #   | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 期间，将提供商配置发布到 `models.providers` 中 | 提供商拥有目录或基础 URL 默认值 |
| 2   | `applyConfigDefaults`             | 在配置具体化期间应用由提供商拥有的全局配置默认值 | 默认值依赖于凭证模式、环境变量或提供商模型族语义 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试常规注册表/目录路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId`                | 在查找之前规范化旧版或预览版 model-id 别名 | 提供商拥有在规范模型解析之前进行别名清理的逻辑 |
| 4   | `normalizeTransport`              | 在通用模型组装之前规范化提供商族的 `api` / `baseUrl` | 提供商拥有同一传输族中自定义提供商 id 的传输清理逻辑 |
| 5   | `normalizeConfig`                 | 在运行时/提供商解析之前规范化 `models.providers.<id>` | 提供商需要将配置清理逻辑保留在插件中；内置的 Google 系列辅助逻辑也会为受支持的 Google 配置条目提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式用量兼容性改写 | 提供商需要基于端点驱动的原生流式用量元数据修复 |
| 7   | `resolveConfigApiKey`             | 在加载运行时凭证之前，为配置提供商解析 env-marker 凭证 | 提供商拥有自己的 env-marker API 密钥解析逻辑；`amazon-bedrock` 在这里也有内置的 AWS env-marker 解析器 |
| 8   | `resolveSyntheticAuth`            | 暴露 local/self-hosted 或基于配置的凭证，而不持久化明文 | 提供商可以使用 synthetic/local 凭证标记运行 |
| 9   | `resolveExternalAuthProfiles`     | 叠加由提供商拥有的外部凭证配置文件；对于 CLI/应用拥有的凭证，默认 `persistence` 为 `runtime-only` | 提供商会复用外部凭证凭据，而不持久化复制的刷新令牌；请在清单中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的 synthetic 配置文件占位符降级到环境变量/基于配置的凭证之后 | 提供商会存储 synthetic 占位配置文件，而这些占位配置文件不应获得更高优先级 |
| 11  | `resolveDynamicModel`             | 为本地注册表中尚不存在的提供商模型 id 提供同步回退 | 提供商接受任意上游模型 id |
| 12  | `prepareDynamicModel`             | 先执行异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 id 之前需要网络元数据 |
| 13  | `normalizeResolvedModel`          | 在嵌入式运行器使用已解析模型之前执行最终改写 | 提供商需要进行传输改写，但仍使用核心传输 |
| 14  | `contributeResolvedModelCompat`   | 为位于另一兼容传输之后的厂商模型提供兼容性标志 | 提供商可以在代理传输上识别自己的模型，而无需接管该提供商 |
| 15  | `capabilities`                    | 由共享核心逻辑使用的提供商自有转录/工具元数据 | 提供商需要处理转录/提供商族特有行为 |
| 16  | `normalizeToolSchemas`            | 在嵌入式运行器看到工具架构之前规范化工具架构 | 提供商需要针对传输族清理架构 |
| 17  | `inspectToolSchemas`              | 在规范化之后暴露由提供商拥有的架构诊断 | 提供商希望提供关键字警告，而无需让核心理解提供商特定规则 |
| 18  | `resolveReasoningOutputMode`      | 选择原生或带标签的 reasoning-output 契约 | 提供商需要带标签的推理/最终输出，而不是原生字段 |
| 19  | `prepareExtraParams`              | 在通用流选项包装器之前规范化请求参数 | 提供商需要默认请求参数或按提供商清理参数 |
| 20  | `createStreamFn`                  | 用自定义传输完全替换常规流路径 | 提供商需要自定义线协议，而不只是包装器 |
| 21  | `wrapStreamFn`                    | 在应用通用包装器之后再对流进行包装 | 提供商需要请求头/请求体/模型兼容性包装器，而不是自定义传输 |
| 22  | `resolveTransportTurnState`       | 附加原生的逐轮传输请求头或元数据 | 提供商希望通用传输发送提供商原生的轮次标识 |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 请求头或会话冷却策略 | 提供商希望通用 WS 传输能够调整会话请求头或回退策略 |
| 24  | `formatApiKey`                    | 凭证配置文件格式化器：已存储配置文件会变为运行时 `apiKey` 字符串 | 提供商会存储额外凭证元数据，并需要自定义运行时令牌形态 |
| 25  | `refreshOAuth`                    | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑 | 提供商不适配共享的 `pi-ai` 刷新器 |
| 26  | `buildAuthDoctorHint`             | 当 OAuth 刷新失败时追加修复提示 | 提供商需要在刷新失败后提供由自己维护的凭证修复指导 |
| 27  | `matchesContextOverflowError`     | 由提供商维护的上下文窗口溢出匹配器 | 提供商存在通用启发式无法捕获的原始溢出错误 |
| 28  | `classifyFailoverReason`          | 由提供商维护的故障转移原因分类 | 提供商可以将原始 API/传输错误映射为速率限制、过载等 |
| 29  | `isCacheTtlEligible`              | 面向代理/回传提供商的提示缓存策略 | 提供商需要面向代理的缓存 TTL 控制 |
| 30  | `buildMissingAuthMessage`         | 替换通用的缺失凭证恢复消息 | 提供商需要提供商特定的缺失凭证恢复提示 |
| 31  | `suppressBuiltInModel`            | 过时上游模型抑制，以及可选的面向用户错误提示 | 提供商需要隐藏过时的上游条目，或用厂商提示替换它们 |
| 32  | `augmentModelCatalog`             | 在发现之后追加 synthetic/最终目录条目 | 提供商需要在 `models list` 和选择器中加入 synthetic 的前向兼容条目 |
| 33  | `resolveThinkingProfile`          | 设置特定模型的 `/think` 级别、显示标签和默认值 | 提供商为选定模型暴露自定义思考梯度或二元标签 |
| 34  | `isBinaryThinking`                | 开/关推理切换兼容性钩子 | 提供商只暴露二元的思考开/关 |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性钩子 | 提供商只希望在部分模型上启用 `xhigh` |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性钩子 | 提供商拥有某个模型族的默认 `/think` 策略 |
| 37  | `isModernModelRef`                | 用于实时配置文件筛选和冒烟选择的现代模型匹配器 | 提供商拥有实时/冒烟首选模型匹配逻辑 |
| 38  | `prepareRuntimeAuth`              | 在推理之前，将已配置凭证交换为实际运行时令牌/密钥 | 提供商需要令牌交换或短期请求凭证 |
| 39  | `resolveUsageAuth`                | 为 `/usage` 及相关状态表面解析用量/计费凭证 | 提供商需要自定义用量/配额令牌解析，或使用不同的用量凭证 |
| 40  | `fetchUsageSnapshot`              | 在凭证解析完成后，获取并规范化提供商特定的用量/配额快照 | 提供商需要提供商特定的用量端点或负载解析器 |
| 41  | `createEmbeddingProvider`         | 为内存/搜索构建由提供商拥有的嵌入适配器 | Memory 嵌入行为应归属于提供商插件 |
| 42  | `buildReplayPolicy`               | 返回一个重放策略，用于控制该提供商的转录处理 | 提供商需要自定义转录策略（例如剥离 thinking 块） |
| 43  | `sanitizeReplayHistory`           | 在通用转录清理之后重写重放历史 | 提供商需要超出共享压缩辅助函数之外的提供商特定重放改写 |
| 44  | `validateReplayTurns`             | 在嵌入式运行器之前，对重放轮次进行最终验证或重塑 | 在通用净化之后，提供商传输需要更严格的轮次验证 |
| 45  | `onModelSelected`                 | 在模型被选中后运行由提供商拥有的副作用 | 当模型变为活动状态时，提供商需要遥测或由提供商拥有的状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的提供商插件，然后再依次回退到其他支持这些钩子的提供商插件，直到有插件实际更改了模型 id 或传输/配置。这样可以让别名/兼容性提供商垫片继续工作，而不要求调用方知道哪个内置插件拥有该改写逻辑。如果没有任何提供商钩子改写受支持的 Google 系列配置条目，内置的 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那就是另一类扩展了。这些钩子适用于仍运行在 OpenClaw 常规推理循环上的提供商行为。

### 提供商示例

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 内置示例

内置提供商插件会组合使用上述钩子，以适配各个厂商在目录、凭证、思考、重放和用量方面的需求。权威的钩子集合与各个 `extensions/` 下的插件放在一起；本页展示的是这些形态，而不是镜像列出完整清单。

<AccordionGroup>
  <Accordion title="直通目录提供商">
    OpenRouter、Kilocode、Z.AI、xAI 注册 `catalog` 以及 `resolveDynamicModel` / `prepareDynamicModel`，这样它们就能在 OpenClaw 的静态目录之前暴露上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和用量端点提供商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 将 `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` + `fetchUsageSnapshot` 配合使用，以接管令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理族">
    共享的命名族（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）让提供商可以通过 `buildReplayPolicy` 选择转录策略，而不必让每个插件都重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录提供商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine` 只注册 `catalog`，并使用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 专用流辅助函数">
    Beta 请求头、`/fast` / `serviceTier` 和 `context1m` 位于 Anthropic 插件公开的 `api.ts` / `contract-api.ts` 接口中（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是放在通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助函数

插件可以通过 `api.runtime` 访问选定的核心辅助函数。对于 TTS：

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

说明：

- `textToSpeech` 返回普通核心 TTS 输出负载，用于文件/语音消息表面。
- 使用核心 `messages.tts` 配置和提供商选择逻辑。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为提供商自行重采样/编码。
- `listVoices` 对每个提供商来说是可选的。将其用于厂商自有语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如区域设置、性别和个性标签，供感知提供商的选择器使用。
- 目前 OpenAI 和 ElevenLabs 支持电话语音。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册语音提供商。

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

说明：

- 将 TTS 策略、回退和回复投递保留在核心中。
- 使用语音提供商来承载厂商自有的合成行为。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` 提供商 id。
- 推荐的所有权模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个厂商插件可以拥有文本、语音、图像以及未来的媒体提供商。

对于图像/音频/视频理解，插件会注册一个类型化的媒体理解提供商，而不是使用通用的键值包：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

说明：

- 将编排、回退、配置和渠道接线保留在核心中。
- 将厂商行为保留在提供商插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已经遵循同样的模式：
  - 核心拥有能力契约和运行时辅助函数
  - 厂商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件消费 `api.runtime.videoGeneration.*`

对于媒体理解运行时辅助函数，插件可以调用：

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

对于音频转录，插件既可以使用媒体理解运行时，也可以使用较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享表面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当未产生转录输出时（例如输入被跳过/不受支持），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留为兼容性别名。

插件还可以通过 `api.runtime.subagent` 启动后台子智能体运行：

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

说明：

- `provider` 和 `model` 是单次运行的可选覆盖项，不是持久性会话变更。
- OpenClaw 只会对受信任调用方尊重这些覆盖字段。
- 对于插件拥有的回退运行，运维人员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制到特定的规范 `provider/model` 目标，或设为 `"*"` 以显式允许任意目标。
- 不受信任的插件子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时辅助函数，而不是深入智能体工具接线：

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

插件也可以通过 `api.registerWebSearchProvider(...)` 注册 Web 搜索提供商。

说明：

- 将提供商选择、凭证解析和共享请求语义保留在核心中。
- 使用 Web 搜索提供商来承载厂商特定的搜索传输。
- `api.runtime.webSearch.*` 是功能/渠道插件在需要搜索行为但又不依赖智能体工具包装器时的首选共享表面。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`：使用已配置的图像生成提供商链生成图像。
- `listProviders(...)`：列出可用的图像生成提供商及其能力。

## Gateway 网关 HTTP 路由

插件可以通过 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

路由字段：

- `path`：Gateway 网关 HTTP 服务器下的路由路径。
- `auth`：必填。使用 `"gateway"` 以要求普通 Gateway 网关凭证，或使用 `"plugin"` 以启用插件管理的凭证/Webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换它自己已存在的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 除非设置 `replaceExisting: true`，否则精确的 `path + match` 冲突会被拒绝，并且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。仅在相同凭证级别上保留 `exact`/`prefix` 贯穿链。
- `auth: "plugin"` 路由**不会**自动获得运维人员运行时作用域。它们用于插件管理的 Webhook/签名验证，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域被有意设计得较为保守：
  - 共享密钥 Bearer 凭证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任的、携带身份的 HTTP 模式（例如 `trusted-proxy`，或私有入口上的 `gateway.auth.mode = "none"`）仅在显式提供该请求头时才会尊重 `x-openclaw-scopes`
  - 如果这些携带身份的插件路由请求中不存在 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实际规则：不要假设一个经过 gateway 凭证保护的插件路由天然就是隐式管理表面。如果你的路由需要仅管理员可用的行为，请要求使用携带身份的凭证模式，并记录显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写新插件时，请使用窄化的 SDK 子路径，而不是单体的 `openclaw/plugin-sdk` 根 barrel。核心子路径包括：

| 子路径 | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册基础能力 |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口/构建辅助函数 |
| `openclaw/plugin-sdk/core`          | 通用共享辅助函数和总括契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 架构（`OpenClawSchema`） |

渠道插件可以从一组窄化接口中选择——`channel-setup`、`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、`channel-targets` 和 `channel-actions`。批准行为应统一到单一的 `approvalCapability` 契约上，而不是分散在无关的插件字段之间。参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助函数位于匹配的 `*-runtime` 子路径下（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用——它是为旧插件保留的兼容性垫片。新代码应改为导入更窄化的通用基础能力。
</Info>

仓库内部入口点（每个内置插件包根目录）：

- `index.js` — 内置插件入口
- `api.js` — 辅助函数/类型 barrel
- `runtime-api.js` — 仅运行时 barrel
- `setup-entry.js` — 设置插件入口

外部插件应只导入 `openclaw/plugin-sdk/*` 子路径。绝不要从核心或另一个插件中导入其他插件包的 `src/*`。由 facade 加载的入口点在存在活动运行时配置快照时会优先使用它，否则回退到磁盘上的已解析配置文件。

像 `image-generation`、`media-understanding` 和 `speech` 这样的能力专用子路径之所以存在，是因为内置插件当前在使用它们。它们并不自动成为长期冻结的外部契约——在依赖它们时，请查阅相应的 SDK 参考页。

## 消息工具架构

对于反应、已读和投票这类非消息原语，插件应拥有各自渠道专用的 `describeMessageTool(...)` 架构贡献。共享发送展示应使用通用 `MessagePresentation` 契约，而不是提供商原生的按钮、组件、块或卡片字段。有关契约、回退规则、提供商映射和插件作者检查清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明它们可以渲染的内容：

- `presentation` 用于语义化展示块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用于固定投递请求

核心负责决定是原生渲染该展示，还是将其降级为文本。不要从通用消息工具中暴露提供商原生 UI 的逃逸接口。面向旧版原生架构的已弃用 SDK 辅助函数仍然会为现有第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道专用的目标语义。保持共享出站主机的通用性，并使用消息适配器表面来承载提供商规则：

- `messaging.inferTargetChatType({ to })` 决定规范化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心某个输入是否应直接跳到类似 id 的解析，而不是进行目录搜索
- `messaging.targetResolver.resolveTarget(...)` 是插件回退路径，当核心在规范化之后或目录未命中之后需要最终由提供商拥有的解析结果时使用
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后负责构建提供商专用的会话路由

推荐拆分方式：

- 对于应在搜索联系人/群组之前发生的分类决策，使用 `inferTargetChatType`
- 对于“将其视为显式/原生目标 id”的判断，使用 `looksLikeId`
- 将 `resolveTarget` 用于提供商专用的规范化回退，而不是广泛的目录搜索
- 将 chat id、thread id、JID、handle 和 room id 这类提供商原生 id 保留在 `target` 值或提供商专用参数中，而不是放进通用 SDK 字段中

## 基于配置的目录

对于从配置派生目录条目的插件，应将该逻辑保留在插件内，并复用 `openclaw/plugin-sdk/directory-runtime` 中的共享辅助函数。

当渠道需要基于配置的联系人/群组时，请使用这一方式，例如：

- 基于 allowlist 的私信联系人
- 已配置的渠道/群组映射
- 基于账号作用域的静态目录回退

`directory-runtime` 中的共享辅助函数只处理通用操作：

- 查询过滤
- 限制应用
- 去重/规范化辅助函数
- 构建 `ChannelDirectoryEntry[]`

渠道专用的账号检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以通过 `registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入 `models.providers` 相同的结构：

- `{ provider }` 表示一个提供商条目
- `{ providers }` 表示多个提供商条目

当插件拥有提供商专用模型 id、基础 URL 默认值或受凭证控制的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：普通 API 密钥或基于环境变量的提供商
- `profile`：存在凭证配置文件时出现的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

在键冲突时，后面的提供商会获胜，因此插件可以有意用相同提供商 id 覆盖内置提供商条目。

兼容性：

- `discovery` 仍然可作为旧别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，除了 `resolveAccount(...)` 之外，优先同时实现 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证已经完全具体化，并且在缺少必要密钥时快速失败。
- 像 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 以及 doctor/配置修复流程这样的只读命令路径，不应仅为了描述配置就必须具体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账号状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（以及对应的来源字段）就足以支持状态类命令。
- 当凭证通过 SecretRef 配置但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样只读命令就可以报告“已配置但在当前命令路径中不可用”，而不是崩溃或错误地将账号报告为未配置。

## 包打包功能

插件目录可以包含一个带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会变成一个插件。如果该打包列出了多个扩展，插件 id 会变为 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保持在插件目录内。逃逸出包目录的条目会被拒绝。

安全说明：`openclaw plugins install` 会使用 `npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本，运行时不安装开发依赖）。请保持插件依赖树为“纯 JS/TS”，并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级、仅用于设置的模块。当 OpenClaw 需要为已禁用的渠道插件提供设置表面时，或者当渠道插件已启用但尚未配置时，它会加载 `setupEntry` 而不是完整插件入口。这样在你的主插件入口还会接入工具、钩子或其他仅运行时代码时，可以让启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可以让渠道插件在 Gateway 网关的监听前启动阶段，即使渠道已经配置好，也选择同样的 `setupEntry` 路径。

仅当 `setupEntry` 完全覆盖 Gateway 网关开始监听之前必须存在的启动表面时，才应使用它。实际中，这意味着设置入口必须注册启动所依赖的每一项由渠道拥有的能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听之前可用的 HTTP 路由
- 在同一时间窗口内必须存在的任何 Gateway 网关方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用此标志。保持插件的默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅设置阶段使用的契约表面辅助函数，供核心在完整渠道运行时加载之前查询。当前的设置提升表面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧版单账号渠道配置提升到 `channels.<id>.accounts.*` 时，会使用这个表面。Matrix 是当前的内置示例：当命名账号已经存在时，它只会把凭证/引导键移动到一个已命名的提升账号中，并且它可以保留已配置的非规范默认账号键，而不是总是创建 `accounts.default`。

这些设置补丁适配器会让内置契约表面发现保持惰性。导入时间保持轻量；提升表面只会在首次使用时加载，而不是在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在插件专用前缀下。核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并且始终解析为 `operator.admin`，即使插件请求了更窄的作用域。

示例：

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### 渠道目录元数据

渠道插件可以通过 `openclaw.channel` 宣告设置/发现元数据，并通过 `openclaw.install` 宣告安装提示。这样可以让核心目录保持无数据状态。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk（self-hosted）",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "通过 Nextcloud Talk webhook 机器人实现自托管聊天。",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

除了最小示例外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富目录/状态表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：该目录条目应优先于的低优先级插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面文案控制
- `markdownCapable`：将该渠道标记为支持 Markdown，以用于出站格式决策
- `exposure.configured`：当设置为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：当设置为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部/私有，以用于文档导航表面
- `showConfigured` / `showInSetup`：为兼容性仍接受的旧别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账号，也要求显式账号绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。将 JSON 文件放在以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（使用逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧别名。

## 上下文引擎插件

上下文引擎插件负责会话上下文编排，包括摄取、组装和压缩。通过 `api.registerContextEngine(id, factory)` 从你的插件中注册它们，然后使用 `plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不只是添加内存搜索或钩子时，请使用这个方式。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

如果你的引擎**不**拥有压缩算法，请保持 `compact()` 已实现，并显式委托它：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 添加新的能力

当插件需要当前 API 无法适配的行为时，不要通过私有深入访问绕过插件系统。应添加缺失的能力。

推荐顺序：

1. 定义核心契约  
   确定哪些共享行为应由核心负责：策略、回退、配置合并、生命周期、面向渠道的语义以及运行时辅助函数形态。
2. 添加类型化的插件注册/运行时表面  
   使用最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 连接核心 + 渠道/功能使用方  
   渠道和功能插件应通过核心消费新能力，而不是直接导入某个厂商实现。
4. 注册厂商实现  
   然后由厂商插件针对该能力注册它们的后端。
5. 添加契约覆盖  
   添加测试，以便随着时间推移，所有权和注册形态仍然保持明确。

这就是 OpenClaw 在保持鲜明立场的同时，不会被硬编码到某个提供商世界观中的方式。有关具体文件清单和完整示例，请参见[能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加一个新能力时，通常实现应同时涉及这些表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器/运行时辅助函数
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道插件需要消费它时，位于 `src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助函数
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中的运维人员/插件文档

如果这些表面中缺少某一个，通常说明该能力尚未完全集成。

### 能力模板

最小模式：

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契约测试模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

这样规则就很简单：

- 核心拥有能力契约 + 编排
- 厂商插件拥有厂商实现
- 功能/渠道插件消费运行时辅助函数
- 契约测试使所有权保持明确

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) — 公开能力模型和形态
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
