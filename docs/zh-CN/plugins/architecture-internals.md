---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或软件包打包集
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载管线、注册表、运行时钩子、HTTP 路由和参考表格
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-24T03:06:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 243ccb0cb5b55c4ba08ac387f5b19949391b3a4f1772f6d7ac889f3d8f548a47
    source_path: plugins/architecture-internals.md
    workflow: 15
---

关于公开能力模型、插件形态以及所有权 / 执行契约，请参阅 [插件架构](/zh-CN/plugins/architecture)。本页是内部机制的参考文档：加载管线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和 schema 表格。

## 加载管线

启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 清单以及包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 `jiti`
7. 调用原生 `register(api)` 钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令 / 运行时表面

<Note>
`activate` 是 `register` 的旧别名 —— 加载器会解析存在的那个（`def.register ?? def.activate`），并在同一时机调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门禁会在运行时执行**之前**发生。当入口逃逸出插件根目录、路径可被所有人写入，或者对于非内置插件来说路径所有权看起来可疑时，候选项会被阻止。

### Manifest 优先行为

manifest 是控制平面的事实来源。OpenClaw 用它来：

- 标识插件
- 发现已声明的渠道 / Skills / 配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签 / 占位符
- 显示安装 / catalog 元数据
- 在不加载插件运行时的情况下，保留低成本的激活与设置描述符

对于原生插件，运行时模块是数据平面部分。它负责注册实际行为，例如钩子、工具、命令或提供商流程。

可选的 manifest `activation` 和 `setup` 块仍然属于控制平面。它们只是用于激活规划和设置发现的纯元数据描述符；不会替代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活使用方现在会利用 manifest 的命令、渠道和提供商提示，在更广泛的注册表物化之前缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置 / 插件解析会缩小到拥有所请求渠道 id 的插件
- 显式提供商设置 / 运行时解析会缩小到拥有所请求提供商 id 的插件

设置发现现在优先使用描述符自有 id，例如 `setup.providers` 和 `setup.cliBackends`，以便在回退到 `setup-api` 之前先缩小候选插件范围；`setup-api` 仅用于那些仍需要设置期运行时钩子的插件。如果发现的多个插件声称拥有同一个规范化后的设置提供商或 CLI 后端 id，设置查找会拒绝这个存在歧义的所有者，而不是依赖发现顺序。

### 加载器会缓存什么

OpenClaw 会在进程内维护短期缓存，用于：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可以减少突发启动和重复命令的开销。可以把它们看作短生命周期的性能缓存，而不是持久化机制。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接随意修改核心全局状态。它们会注册到一个中心化的插件注册表中。

注册表会跟踪：

- 插件记录（标识、来源、源头、状态、诊断信息）
- 工具
- 旧式钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件自有命令

然后，核心功能会从这个注册表中读取，而不是直接与插件模块交互。这让加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性非常重要。它意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在审批完成时作出响应。

使用 `api.onConversationBindingResolved(...)` 可以在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 现在已为该插件 + 会话建立绑定。
        console.log(event.binding?.conversationId);
        return;
      }

      // 请求已被拒绝；清理任何本地挂起状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 和会话元数据

这个回调仅用于通知。它不会改变谁被允许绑定会话，并且会在核心审批处理完成后运行。

## 提供商运行时钩子

提供商插件有三层：

- **Manifest 元数据**，用于廉价的运行前查找：`providerAuthEnvVars`、`providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置期钩子**：`catalog`（旧版 `discovery`）以及 `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，涵盖凭证、模型解析、流包装、思考级别、重放策略和用量端点。完整列表见 [钩子顺序与用法](#hook-order-and-usage)。

OpenClaw 仍然负责通用智能体循环、故障切换、转录处理和工具策略。这些钩子是提供商特定行为的扩展表面，因此无需整套自定义推理传输也能实现相应能力。

当提供商具有基于环境变量的凭证，并且希望通用凭证 / 状态 / 模型选择器路径在不加载插件运行时的情况下也能看到这些信息时，请使用 manifest `providerAuthEnvVars`。当某个提供商 id 应复用另一个提供商 id 的环境变量、凭证配置文件、基于配置的凭证和 API 密钥新手引导选项时，请使用 manifest `providerAuthAliases`。当新手引导 / 凭证选择 CLI 表面需要在不加载提供商运行时的情况下了解该提供商的 choice id、分组标签和简单的单标志凭证接线方式时，请使用 manifest `providerAuthChoices`。请将提供商运行时 `envVars` 保留给面向操作员的提示，例如新手引导标签或 OAuth client-id / client-secret 设置变量。

当某个渠道具有由环境变量驱动的凭证或设置，并且希望通用 shell 环境变量回退、配置 / 状态检查或设置提示在不加载渠道运行时的情况下也能看到这些信息时，请使用 manifest `channelEnvVars`。

### 钩子顺序与用法

对于模型 / 提供商插件，OpenClaw 大致会按以下顺序调用钩子。
“何时使用”列是快速决策指南。

| #   | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 期间，将提供商配置发布到 `models.providers` 中 | 提供商拥有 catalog 或 base URL 默认值 |
| 2   | `applyConfigDefaults`             | 在配置物化期间应用提供商自有的全局配置默认值 | 默认值依赖于凭证模式、环境变量或提供商模型族语义 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试常规的注册表 / catalog 路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId`                | 在查找前规范化旧版或预览版 model-id 别名 | 提供商拥有在规范模型解析之前进行别名清理的逻辑 |
| 4   | `normalizeTransport`              | 在通用模型组装前规范化提供商族的 `api` / `baseUrl` | 提供商需要为同一传输族中的自定义提供商 id 执行传输清理 |
| 5   | `normalizeConfig`                 | 在运行时 / 提供商解析前规范化 `models.providers.<id>` | 提供商需要将配置清理逻辑放在插件中；内置的 Google 族辅助逻辑也会为受支持的 Google 配置项提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 将原生流式使用量兼容性重写应用到配置提供商 | 提供商需要基于端点驱动修复原生流式使用量元数据 |
| 7   | `resolveConfigApiKey`             | 在加载运行时凭证前，为配置提供商解析 env-marker 凭证 | 提供商拥有自己的 env-marker API 密钥解析逻辑；`amazon-bedrock` 在这里也有一个内置的 AWS env-marker 解析器 |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的情况下暴露本地 / 自托管或基于配置的凭证 | 提供商可以使用 synthetic / 本地凭证标记运行 |
| 9   | `resolveExternalAuthProfiles`     | 叠加提供商自有的外部凭证配置文件；CLI / app 自有凭证的默认 `persistence` 为 `runtime-only` | 提供商可复用外部凭证，而无需持久化复制的 refresh token；请在 manifest 中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的 synthetic 配置文件占位符降级到 env / 基于配置的凭证之后 | 提供商会存储 synthetic 占位配置文件，而这些配置文件不应获得更高优先级 |
| 11  | `resolveDynamicModel`             | 为尚未出现在本地注册表中的提供商自有模型 id 提供同步回退 | 提供商接受任意上游模型 id |
| 12  | `prepareDynamicModel`             | 异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 id 之前需要网络元数据 |
| 13  | `normalizeResolvedModel`          | 在嵌入式 runner 使用已解析模型之前进行最终重写 | 提供商需要进行传输重写，但仍然使用核心传输 |
| 14  | `contributeResolvedModelCompat`   | 为位于另一兼容传输之后的供应商模型提供兼容性标志 | 提供商可以在代理传输上识别自己的模型，而无需接管该提供商 |
| 15  | `capabilities`                    | 由共享核心逻辑使用的提供商自有转录 / 工具元数据 | 提供商需要处理转录或提供商族特有的差异 |
| 16  | `normalizeToolSchemas`            | 在嵌入式 runner 看到工具 schema 之前进行规范化 | 提供商需要进行传输族的 schema 清理 |
| 17  | `inspectToolSchemas`              | 在规范化后暴露提供商自有的 schema 诊断信息 | 提供商希望提供关键字警告，而无需让核心理解特定于提供商的规则 |
| 18  | `resolveReasoningOutputMode`      | 选择原生还是带标签的推理输出契约 | 提供商需要带标签的推理 / 最终输出，而不是原生字段 |
| 19  | `prepareExtraParams`              | 在通用流选项包装器之前进行请求参数规范化 | 提供商需要默认请求参数或按提供商进行参数清理 |
| 20  | `createStreamFn`                  | 使用自定义传输完全替换常规流路径 | 提供商需要自定义线协议，而不只是包装器 |
| 21  | `wrapStreamFn`                    | 在应用通用包装器之后再包装流函数 | 提供商需要请求头 / 请求体 / 模型兼容性包装器，但不需要自定义传输 |
| 22  | `resolveTransportTurnState`       | 附加原生的逐轮传输请求头或元数据 | 提供商希望通用传输发送提供商原生的轮次标识 |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 请求头或会话冷却策略 | 提供商希望通用 WS 传输调整会话请求头或回退策略 |
| 24  | `formatApiKey`                    | 凭证配置文件格式化器：已存储的配置文件会变成运行时 `apiKey` 字符串 | 提供商存储了额外凭证元数据，并需要自定义的运行时 token 形态 |
| 25  | `refreshOAuth`                    | 针对自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖 | 提供商不适用于共享的 `pi-ai` 刷新器 |
| 26  | `buildAuthDoctorHint`             | 当 OAuth 刷新失败时附加修复提示 | 提供商需要在刷新失败后提供其自有的凭证修复指引 |
| 27  | `matchesContextOverflowError`     | 提供商自有的上下文窗口溢出匹配器 | 提供商存在通用启发式无法捕获的原始溢出错误 |
| 28  | `classifyFailoverReason`          | 提供商自有的故障切换原因分类 | 提供商可以将原始 API / 传输错误映射为速率限制、过载等 |
| 29  | `isCacheTtlEligible`              | 面向代理 / 回传提供商的 prompt-cache 策略 | 提供商需要代理特定的缓存 TTL 门禁 |
| 30  | `buildMissingAuthMessage`         | 替换通用的缺失凭证恢复消息 | 提供商需要特定于提供商的缺失凭证恢复提示 |
| 31  | `suppressBuiltInModel`            | 抑制过时的上游模型，并可选替换为面向用户的错误提示 | 提供商需要隐藏过时的上游条目，或用供应商提示替换它们 |
| 32  | `augmentModelCatalog`             | 在发现后附加 synthetic / 最终 catalog 条目 | 提供商需要在 `models list` 和选择器中加入 synthetic 的前向兼容条目 |
| 33  | `resolveThinkingProfile`          | 设置模型特定的 `/think` 级别、显示标签和默认值 | 提供商为选定模型公开自定义的思考梯度或二元标签 |
| 34  | `isBinaryThinking`                | 开 / 关推理切换兼容性钩子 | 提供商只支持二元的思考开 / 关 |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性钩子 | 提供商希望仅在部分模型上支持 `xhigh` |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性钩子 | 提供商拥有某个模型族的默认 `/think` 策略 |
| 37  | `isModernModelRef`                | 用于实时配置文件过滤和 smoke 选择的现代模型匹配器 | 提供商拥有实时 / smoke 首选模型匹配逻辑 |
| 38  | `prepareRuntimeAuth`              | 在推理前立即将已配置的凭证交换为实际运行时 token / 密钥 | 提供商需要 token 交换或短期请求凭证 |
| 39  | `resolveUsageAuth`                | 为 `/usage` 及相关状态表面解析使用量 / 计费凭证 | 提供商需要自定义使用量 / 配额 token 解析，或需要不同的使用量凭证 |
| 40  | `fetchUsageSnapshot`              | 在凭证解析后获取并规范化特定于提供商的使用量 / 配额快照 | 提供商需要特定于提供商的使用量端点或负载解析器 |
| 41  | `createEmbeddingProvider`         | 为内存 / 搜索构建提供商自有的 embedding 适配器 | Memory embedding 行为应归属于提供商插件 |
| 42  | `buildReplayPolicy`               | 返回一个控制该提供商转录处理方式的重放策略 | 提供商需要自定义转录策略（例如去除 thinking 块） |
| 43  | `sanitizeReplayHistory`           | 在通用转录清理后重写重放历史 | 提供商需要共享压缩辅助逻辑之外的特定于提供商的重放重写 |
| 44  | `validateReplayTurns`             | 在嵌入式 runner 执行前，对重放轮次进行最终验证或重塑 | 提供商传输在通用清洗后需要更严格的轮次验证 |
| 45  | `onModelSelected`                 | 在模型被选中后运行提供商自有的副作用 | 当模型变为活动状态时，提供商需要遥测或提供商自有状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查已匹配的提供商插件，然后继续落到其他具备钩子能力的提供商插件，直到某个插件实际修改了模型 id 或传输 / 配置。这样可以让别名 / 兼容提供商 shim 正常工作，而不要求调用方知道哪个内置插件拥有该重写逻辑。如果没有任何提供商钩子重写受支持的 Google 族配置项，内置的 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那属于另一类扩展。这些钩子适用于仍运行在 OpenClaw 常规推理循环上的提供商行为。

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

内置提供商插件会组合使用上述钩子，以适配各个供应商在 catalog、凭证、思考、重放和使用量方面的需求。权威的钩子集合与各插件一起保存在 `extensions/` 下；本页用于说明其形态，而不是镜像列出完整清单。

<AccordionGroup>
  <Accordion title="透传 catalog 提供商">
    OpenRouter、Kilocode、Z.AI、xAI 会注册 `catalog`，以及 `resolveDynamicModel` / `prepareDynamicModel`，这样它们就能在 OpenClaw 的静态 catalog 之前暴露上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和使用量端点提供商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 会将 `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` + `fetchUsageSnapshot` 配对使用，以接管 token 交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理族">
    共享的命名族（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）让提供商可以通过 `buildReplayPolicy` 选择加入转录策略，而不是让每个插件各自重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅 catalog 提供商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine` 只注册 `catalog`，并复用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 专用流辅助工具">
    Beta 请求头、`/fast` / `serviceTier` 以及 `context1m` 位于 Anthropic 插件公开的 `api.ts` / `contract-api.ts` 接缝中（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是位于通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助工具

插件可以通过 `api.runtime` 访问选定的核心辅助工具。对于 TTS：

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

- `textToSpeech` 返回文件 / 语音笔记表面使用的常规核心 TTS 输出负载。
- 使用核心 `messages.tts` 配置和提供商选择逻辑。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为提供商自行重采样 / 编码。
- `listVoices` 对每个提供商来说都是可选的。可将其用于供应商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如语言区域、性别和个性标签，以支持提供商感知的选择器。
- 目前支持电话语音的有 OpenAI 和 ElevenLabs。Microsoft 不支持。

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
- 对供应商自有的合成行为使用语音提供商。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` 提供商 id。
- 首选的所有权模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个供应商插件可以同时拥有文本、语音、图像以及未来的媒体提供商。

对于图像 / 音频 / 视频理解，插件会注册一个类型化的媒体理解提供商，而不是通用的键值包：

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
- 将供应商行为保留在提供商插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已经遵循相同模式：
  - 核心拥有能力契约和运行时辅助工具
  - 供应商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能 / 渠道插件消费 `api.runtime.videoGeneration.*`

对于媒体理解运行时辅助工具，插件可以调用：

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
  // 当无法可靠推断 MIME 时可选：
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像 / 音频 / 视频理解的首选共享表面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当未产生转录输出时返回 `{ text: undefined }`（例如输入被跳过 / 不受支持）。
- `api.runtime.stt.transcribeAudioFile(...)` 仍然保留作为兼容性别名。

插件也可以通过 `api.runtime.subagent` 启动后台子智能体运行：

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

- `provider` 和 `model` 是每次运行的可选覆盖项，不是持久化的会话更改。
- OpenClaw 只会为受信任调用方应用这些覆盖字段。
- 对于插件自有的回退运行，操作员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 明确启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制为特定的规范 `provider/model` 目标，或设为 `"*"` 以明确允许任意目标。
- 非受信任插件的子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而不是深入智能体工具接线：

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
- 对供应商特定的搜索传输使用 Web 搜索提供商。
- `api.runtime.webSearch.*` 是功能 / 渠道插件在不依赖智能体工具包装器的情况下需要搜索行为时的首选共享表面。

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
- `auth`：必填。使用 `"gateway"` 以要求常规 Gateway 网关认证，或使用 `"plugin"` 进行插件管理的认证 / webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换自己已存在的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 除非设置了 `replaceExisting: true`，否则精确的 `path + match` 冲突会被拒绝，而且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。请仅在相同认证级别内保持 `exact` / `prefix` 贯穿链。
- `auth: "plugin"` 路由**不会**自动接收操作员运行时作用域。它们用于插件管理的 webhook / 签名验证，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域刻意保持保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes` 也是如此
  - 受信任的、携带身份的 HTTP 模式（例如 `trusted-proxy`，或私有入口上的 `gateway.auth.mode = "none"`）仅在显式存在该请求头时才会采纳 `x-openclaw-scopes`
  - 如果这些携带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实用规则：不要假设经过 Gateway 网关认证的插件路由就是隐式管理员表面。如果你的路由需要仅管理员可用的行为，请要求使用携带身份的认证模式，并记录显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写新插件时，请使用狭窄的 SDK 子路径，而不是单体式的 `openclaw/plugin-sdk` 根 barrel。核心子路径：

| 子路径 | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语 |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口 / 构建辅助工具 |
| `openclaw/plugin-sdk/core`          | 通用共享辅助工具和总括契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

渠道插件应从一组狭窄接缝中进行选择 —— `channel-setup`、`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、`channel-targets` 和 `channel-actions`。审批行为应统一到单一的 `approvalCapability` 契约上，而不是分散混用在不相关的插件字段中。参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于对应的 `*-runtime` 子路径下（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用 —— 它只是面向旧插件的兼容性 shim。新代码应改为导入更狭窄的通用原语。
</Info>

仓库内部入口点（按每个内置插件包根目录划分）：

- `index.js` —— 内置插件入口
- `api.js` —— 辅助工具 / 类型 barrel
- `runtime-api.js` —— 仅运行时 barrel
- `setup-entry.js` —— 设置插件入口

外部插件应只导入 `openclaw/plugin-sdk/*` 子路径。绝不要从核心或另一个插件中导入其他插件包的 `src/*`。
通过 facade 加载的入口点会优先使用当前活动的运行时配置快照；如果不存在，再回退到磁盘上的已解析配置文件。

像 `image-generation`、`media-understanding` 和 `speech` 这样的能力专用子路径之所以存在，是因为内置插件目前正在使用它们。它们并不自动构成长期冻结的外部契约 —— 在依赖它们时，请查阅对应的 SDK 参考页面。

## 消息工具 schema

对于 reaction、已读和投票这类非消息原语，插件应自行提供特定于渠道的 `describeMessageTool(...)` schema 贡献。共享发送呈现应使用通用的 `MessagePresentation` 契约，而不是提供商原生的按钮、组件、块或卡片字段。关于契约、回退规则、提供商映射以及插件作者检查清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明自己可以渲染的内容：

- `presentation`：用于语义化呈现块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`：用于置顶投递请求

核心决定是原生渲染该 presentation，还是将其降级为文本。不要从通用消息工具中暴露提供商原生 UI 逃生口。
面向旧原生 schema 的已弃用 SDK 辅助工具仍会为现有第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有特定于渠道的目标语义。保持共享出站宿主通用，并通过消息适配器表面处理提供商规则：

- `messaging.inferTargetChatType({ to })` 用于在目录查找前判断规范化目标应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 用于告知核心，某个输入是否应跳过目录搜索，直接进入类似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是插件的回退路径，当核心在规范化之后或目录未命中之后需要最终的提供商自有解析时使用。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后负责构建特定于提供商的会话路由。

推荐拆分方式：

- 对于应在搜索联系人 / 群组之前发生的类别判定，使用 `inferTargetChatType`。
- 对于“把这个视为显式 / 原生目标 id”的检查，使用 `looksLikeId`。
- 对于提供商特定的规范化回退，使用 `resolveTarget`，而不是用它做宽泛的目录搜索。
- 将 chat id、thread id、JID、handle 和 room id 这类提供商原生 id 保留在 `target` 值或提供商专用参数中，而不是放入通用 SDK 字段。

## 基于配置的目录

对于从配置派生目录项的插件，应将该逻辑保留在插件内部，并复用 `openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

适用于以下这类渠道需要基于配置的联系人 / 群组时：

- 基于 allowlist 的私信联系人
- 已配置的渠道 / 群组映射
- 按账号作用域的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制数量应用
- 去重 / 规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

特定于渠道的账号检查和 id 规范化应保留在插件实现中。

## 提供商 catalog

提供商插件可以通过 `registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型 catalog。

`catalog.run(...)` 返回的形态与 OpenClaw 写入 `models.providers` 的内容相同：

- `{ provider }`：单个提供商条目
- `{ providers }`：多个提供商条目

当插件拥有特定于提供商的模型 id、base URL 默认值或受凭证控制的模型元数据时，请使用 `catalog`。

`catalog.order` 用于控制插件的 catalog 相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：普通 API 密钥或环境变量驱动的提供商
- `profile`：当存在凭证配置文件时出现的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

在键冲突时，后出现的提供商会胜出，因此插件可以有意使用相同的提供商 id 覆盖某个内置提供商条目。

兼容性：

- `discovery` 仍然作为旧别名可用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先实现 `plugin.config.inspectAccount(cfg, accountId)`，并与 `resolveAccount(...)` 配套使用。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证已被完整物化，并且当缺少必需 secret 时可以快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 以及 doctor / config 修复流程，不应仅仅为了描述配置就去物化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账号状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源 / 状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 仅为了报告只读可用性，并不需要返回原始 token 值。返回 `tokenStatus: "available"`（以及对应的来源字段）就足以支持状态类命令。
- 当凭证通过 SecretRef 配置但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样，只读命令就可以报告“已配置，但在当前命令路径中不可用”，而不是崩溃或误报该账号未配置。

## 软件包打包集

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

每个条目都会变成一个插件。如果该打包集列出多个扩展，插件 id 会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须仍然位于插件目录内。逃逸出包目录的条目会被拒绝。

安全说明：`openclaw plugins install` 会使用 `npm install --omit=dev --ignore-scripts` 安装插件依赖（不运行生命周期脚本，运行时不安装开发依赖）。请保持插件依赖树为“纯 JS / TS”，并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。当 OpenClaw 需要为一个已禁用的渠道插件提供设置表面，或者当某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`，而不是完整插件入口。这样在主插件入口还会接线工具、钩子或其他仅运行时代码时，可以让启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可以让一个渠道插件在 Gateway 网关 pre-listen 启动阶段也选择使用相同的 `setupEntry` 路径，即使该渠道已经配置完成。

仅当 `setupEntry` 完整覆盖 Gateway 网关开始监听之前必须存在的启动表面时，才应使用此选项。实际而言，这意味着设置入口必须注册启动所依赖的每一项渠道自有能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听前可用的 HTTP 路由
- 任何必须在同一时间窗口内存在的 Gateway 网关方法、工具或服务

如果你的完整入口仍拥有任何必需的启动能力，就不要启用这个标志。请保持插件采用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅设置期的契约表面辅助工具，供核心在完整渠道运行时加载前查询。当前的设置提升表面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧版单账号渠道配置提升到 `channels.<id>.accounts.*` 时，就会使用这组表面。Matrix 是当前的内置示例：当已存在命名账号时，它只会把凭证 / bootstrap 键移动到某个已命名的提升账号中，并且它能够保留一个已配置的非规范 default-account 键，而不是总是创建 `accounts.default`。

这些设置补丁适配器让内置契约表面发现保持惰性。导入时开销保持很轻；提升表面只会在首次使用时加载，而不是在模块导入时重新进入内置渠道启动过程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保持在插件专用前缀下。核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍然是保留的，并且始终解析为 `operator.admin`，即使某个插件请求了更窄的作用域也是如此。

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

### 渠道 catalog 元数据

渠道插件可以通过 `openclaw.channel` 公布设置 / 发现元数据，并通过 `openclaw.install` 公布安装提示。这样可以让核心 catalog 保持无数据。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk（自托管）",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "通过 Nextcloud Talk webhook 机器人实现的自托管聊天。",
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

除了最小示例之外，还有一些有用的 `openclaw.channel` 字段：

- `detailLabel`：用于更丰富的 catalog / 状态表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：该 catalog 条目应优先于的较低优先级插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面文案控制
- `markdownCapable`：将该渠道标记为支持 Markdown，以供出站格式化决策使用
- `exposure.configured`：设置为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设置为 `false` 时，在交互式设置 / 配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部 / 私有，以供文档导航表面使用
- `showConfigured` / `showInSetup`：出于兼容性仍接受的旧别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道接入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账号，也要求显式账号绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先进行会话查找

OpenClaw 还可以合并**外部渠道 catalog**（例如 MPM 注册表导出）。将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号 / 分号 / `PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器还接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧别名。

## 上下文引擎插件

上下文引擎插件负责会话上下文编排，包括摄取、组装和压缩。通过 `api.registerContextEngine(id, factory)` 从你的插件中注册它们，然后通过 `plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文管线，而不仅仅是添加内存搜索或钩子时，请使用此机制。

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

当插件需要当前 API 无法容纳的行为时，不要通过私有深度访问绕过插件系统。请添加缺失的能力。

推荐顺序：

1. 定义核心契约  
   决定哪些共享行为应由核心拥有：策略、回退、配置合并、生命周期、面向渠道的语义，以及运行时辅助工具形态。
2. 添加类型化的插件注册 / 运行时表面  
   用最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 接入核心 + 渠道 / 功能使用方  
   渠道和功能插件应通过核心消费这个新能力，而不是直接导入某个供应商实现。
4. 注册供应商实现  
   然后由供应商插件针对该能力注册它们的后端实现。
5. 添加契约覆盖  
   添加测试，使所有权和注册形态在长期演进中保持明确。

这正是 OpenClaw 在保持鲜明立场的同时，不会被硬编码到某个提供商世界观中的方式。关于具体文件检查清单和完整示例，请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加一个新能力时，实现通常应同时涉及以下表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心 runner / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费它时，位于 `src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的所有权 / 契约断言
- `docs/` 中面向操作员 / 插件的文档

如果这些表面中有某一项缺失，通常就说明该能力尚未完全集成。

### 能力模板

最小模式：

```ts
// 核心契约
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// 插件 API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// 面向功能 / 渠道插件的共享运行时辅助工具
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
- 供应商插件拥有供应商实现
- 功能 / 渠道插件消费运行时辅助工具
- 契约测试让所有权保持明确

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) —— 公开能力模型和形态
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
