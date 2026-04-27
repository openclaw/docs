---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或软件包打包集
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载流水线、注册表、运行时钩子、HTTP 路由和参考表格
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-27T20:10:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2258835c881bf83d090898c0276f81b74d0a1ec471a85ab9d8f96125eb9cba6a
    source_path: plugins/architecture-internals.md
    workflow: 15
---

关于公开的能力模型、插件形态以及归属/执行契约，请参阅 [插件架构](/zh-CN/plugins/architecture)。本页是内部机制的参考文档：加载流水线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和模式表。

## 加载流水线

在启动时，OpenClaw 大致会执行以下流程：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 清单以及软件包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 `jiti`
7. 调用原生 `register(api)` 钩子，并将注册项收集到插件注册表中
8. 将注册表暴露给命令/运行时表面

<Note>
`activate` 是 `register` 的旧版别名——加载器会解析现有项（`def.register ?? def.activate`），并在同一时机调用。所有内置插件都使用 `register`；新插件优先使用 `register`。
</Note>

安全门禁会在运行时执行**之前**发生。当入口逃逸出插件根目录、路径对所有人可写，或对于非内置插件而言路径所有权看起来可疑时，候选项会被阻止。

### Manifest-first 行为

manifest 是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现已声明的渠道/Skills/配置模式或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 的标签/占位符
- 显示安装/目录元数据
- 在不加载插件运行时的情况下，保留轻量激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如钩子、工具、命令或提供商流程。

可选的 manifest `activation` 和 `setup` 块仍然保留在控制平面。它们是用于激活规划和设置发现的纯元数据描述符；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活消费者现在会使用 manifest 中的命令、渠道和提供商提示，在更广泛的注册表实体化之前缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置/插件解析会缩小到拥有所请求渠道 id 的插件
- 显式的提供商设置/运行时解析会缩小到拥有所请求提供商 id 的插件

激活规划器同时暴露仅包含 id 的 API 供现有调用方使用，以及供新诊断使用的 plan API。Plan 条目会报告为什么选中了某个插件，并将显式 `activation.*` 规划器提示与 manifest 所有权回退原因区分开来，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子。这种原因拆分就是兼容性边界：现有插件元数据仍可继续工作，而新代码可以检测宽泛提示或回退行为，而无需改变运行时加载语义。

设置发现现在会优先使用描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，在回退到 `setup-api` 之前先缩小候选插件范围，以兼容那些仍需要设置时运行时钩子的插件。提供商设置列表会使用 manifest `providerAuthChoices`、由描述符推导出的设置选项以及安装目录元数据，而无需加载提供商运行时。显式的 `setup.requiresRuntime: false` 是仅限描述符的截止点；如果省略 `requiresRuntime`，则会保留旧版 `setup-api` 回退以保持兼容性。如果发现多个插件声称拥有同一个规范化后的设置提供商或 CLI 后端 id，设置查找会拒绝这个模糊归属，而不是依赖发现顺序。当设置运行时确实执行时，注册表诊断会报告 `setup.providers` / `setup.cliBackends` 与由 `setup-api` 注册的提供商或 CLI 后端之间的漂移，但不会阻止旧版插件。

### 加载器会缓存什么

OpenClaw 会保留短生命周期的进程内缓存，用于：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可减少突发启动开销和重复命令开销。可以把它们安全地理解为短生命周期的性能缓存，而不是持久化存储。

Gateway 网关启动热路径应优先使用当前的 `PluginMetadataSnapshot`、派生的 `PluginLookUpTable`，或沿调用链传递的显式 manifest 注册表。配置验证、启动时自动启用和插件引导在可用时都会使用同一个快照。对于那些仍然会从持久化的已安装插件索引重建 manifest 元数据的调用方，OpenClaw 还会保留一个小型有界回退缓存，该缓存以已安装索引、请求形状、配置策略、运行时根目录以及 manifest/软件包文件签名为键。该缓存仅用于重复的已安装索引重建回退；它不是可变的运行时插件注册表。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 设置 `OPENCLAW_DISABLE_INSTALLED_PLUGIN_MANIFEST_REGISTRY_CACHE=1` 可仅禁用已安装索引的 manifest 注册表回退缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存时间窗口。

## 注册表模型

已加载的插件不会直接随意修改核心的全局状态。它们会注册到一个中央插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、源头、状态、诊断）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

然后，核心功能会从该注册表读取，而不是直接与插件模块通信。这样可以保持单向加载：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在审批结果确定后作出响应。

使用 `api.onConversationBindingResolved(...)` 可以在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 现在已存在此插件 + 会话的绑定。
        console.log(event.binding?.conversationId);
        return;
      }

      // 请求被拒绝；清理任何本地待处理状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求对应的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 和会话元数据

此回调仅用于通知。它不会改变谁被允许绑定会话，并且会在核心审批处理完成后运行。

## 提供商运行时钩子

提供商插件有三层：

- **Manifest 元数据**，用于低成本的运行时前查找：
  `setup.providers[].envVars`、已弃用的兼容字段 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时钩子**：`catalog`（旧版 `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，覆盖认证、模型解析、
  流包装、思考等级、重放策略和用量端点。完整列表见
  [钩子顺序与用法](#hook-order-and-usage)。

OpenClaw 仍然负责通用的智能体循环、故障转移、转录处理和工具策略。这些钩子是提供商特定行为的扩展表面，因此无需整套自定义推理传输也能实现扩展。

当提供商具有基于环境变量的凭证，并且你希望通用认证/状态/模型选择器路径在不加载插件运行时的情况下也能看到它们时，请使用 manifest `setup.providers[].envVars`。已弃用的 `providerAuthEnvVars` 在弃用窗口期间仍会由兼容适配器读取，而使用它的非内置插件会收到一条 manifest 诊断信息。当一个提供商 id 需要复用另一个提供商 id 的环境变量、认证配置文件、基于配置的认证以及 API 密钥新手引导选项时，请使用 manifest `providerAuthAliases`。当新手引导/认证选项 CLI 表面需要在不加载提供商运行时的情况下了解该提供商的 choice id、分组标签和简单单旗标认证接线时，请使用 manifest `providerAuthChoices`。将提供商运行时的 `envVars` 保留给面向运维者的提示，例如新手引导标签或 OAuth client-id/client-secret 设置变量。

当一个渠道具有基于环境变量的认证或设置，并且你希望通用 shell 环境变量回退、配置/状态检查或设置提示在不加载渠道运行时的情况下也能看到它们时，请使用 manifest `channelEnvVars`。

### 钩子顺序与用法

对于模型/提供商插件，OpenClaw 会大致按以下顺序调用钩子。
“何时使用”这一列是快速决策指南。

| #   | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 期间，将提供商配置发布到 `models.providers` 中 | 提供商拥有目录，或拥有基础 URL 默认值 |
| 2   | `applyConfigDefaults`             | 在配置实体化期间应用由提供商拥有的全局配置默认值 | 默认值依赖于认证模式、环境变量或提供商模型家族语义 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试常规的注册表/目录路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId`                | 在查找前规范化旧版或预览版 model-id 别名 | 提供商拥有在规范模型解析前进行别名清理的逻辑 |
| 4   | `normalizeTransport`              | 在通用模型组装前规范化提供商家族的 `api` / `baseUrl` | 提供商拥有同一传输家族中自定义提供商 id 的传输清理逻辑 |
| 5   | `normalizeConfig`                 | 在运行时/提供商解析前规范化 `models.providers.<id>` | 提供商需要应与插件共置的配置清理；内置的 Google 家族辅助逻辑也会为受支持的 Google 配置项提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式用量兼容性重写 | 提供商需要基于端点的原生流式用量元数据修正 |
| 7   | `resolveConfigApiKey`             | 在加载运行时认证前，为配置提供商解析环境变量标记认证 | 提供商拥有由其控制的环境变量标记 API 密钥解析；`amazon-bedrock` 也在这里具有内置的 AWS 环境变量标记解析器 |
| 8   | `resolveSyntheticAuth`            | 暴露 local/self-hosted 或基于配置的认证，而不持久化明文 | 提供商可以使用合成/local 凭证标记运行 |
| 9   | `resolveExternalAuthProfiles`     | 叠加由提供商拥有的外部认证配置文件；默认 `persistence` 为 `runtime-only`，适用于 CLI/应用拥有的凭证 | 提供商复用外部认证凭证，而不持久化复制的刷新令牌；请在 manifest 中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符降级到环境变量/基于配置的认证之后 | 提供商会存储合成占位配置文件，而这些配置文件不应获得更高优先级 |
| 11  | `resolveDynamicModel`             | 为本地注册表中尚不存在的由提供商拥有的模型 id 提供同步回退 | 提供商接受任意上游模型 id |
| 12  | `prepareDynamicModel`             | 先进行异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 id 之前需要网络元数据 |
| 13  | `normalizeResolvedModel`          | 在嵌入式运行器使用已解析模型之前进行最终重写 | 提供商需要传输重写，但仍使用核心传输 |
| 14  | `contributeResolvedModelCompat`   | 为位于其他兼容传输之后的厂商模型提供兼容性标志 | 提供商可以在代理传输上识别自己的模型，而无需接管该提供商 |
| 15  | `capabilities`                    | 由共享核心逻辑使用的提供商拥有的转录/工具元数据 | 提供商需要处理转录或提供商家族特有行为 |
| 16  | `normalizeToolSchemas`            | 在嵌入式运行器看到工具 schema 之前进行规范化 | 提供商需要进行传输家族级别的 schema 清理 |
| 17  | `inspectToolSchemas`              | 在规范化后暴露由提供商拥有的 schema 诊断信息 | 提供商希望给出关键字警告，而不需要让核心理解提供商特定规则 |
| 18  | `resolveReasoningOutputMode`      | 选择原生或带标签的推理输出契约 | 提供商需要带标签的推理/最终输出，而不是原生字段 |
| 19  | `prepareExtraParams`              | 在通用流选项包装器之前对请求参数进行规范化 | 提供商需要默认请求参数或按提供商进行参数清理 |
| 20  | `createStreamFn`                  | 使用自定义传输完全替换正常流路径 | 提供商需要自定义线协议，而不只是包装器 |
| 21  | `wrapStreamFn`                    | 在应用通用包装器后再对流进行包装 | 提供商需要请求头/请求体/模型兼容性包装，而无需自定义传输 |
| 22  | `resolveTransportTurnState`       | 附加原生的逐轮传输请求头或元数据 | 提供商希望通用传输发送提供商原生的轮次标识 |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 请求头或会话冷却策略 | 提供商希望通用 WS 传输调整会话请求头或回退策略 |
| 24  | `formatApiKey`                    | 认证配置文件格式化器：将已存储配置文件转换为运行时 `apiKey` 字符串 | 提供商存储额外认证元数据，并需要自定义运行时令牌格式 |
| 25  | `refreshOAuth`                    | 针对自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖 | 提供商不适用于共享的 `pi-ai` 刷新器 |
| 26  | `buildAuthDoctorHint`             | 当 OAuth 刷新失败时附加的修复提示 | 提供商需要在刷新失败后提供由其拥有的认证修复指导 |
| 27  | `matchesContextOverflowError`     | 由提供商拥有的上下文窗口溢出匹配器 | 提供商存在通用启发式无法捕获的原始溢出错误 |
| 28  | `classifyFailoverReason`          | 由提供商拥有的故障转移原因分类 | 提供商可以将原始 API/传输错误映射为速率限制、过载等类型 |
| 29  | `isCacheTtlEligible`              | 面向代理/回传提供商的提示缓存策略 | 提供商需要代理特定的缓存 TTL 门控 |
| 30  | `buildMissingAuthMessage`         | 替换通用的缺失认证恢复消息 | 提供商需要提供商特定的缺失认证恢复提示 |
| 31  | `suppressBuiltInModel`            | 过时上游模型抑制，并可选提供面向用户的错误提示 | 提供商需要隐藏过时的上游条目，或用厂商提示替换它们 |
| 32  | `augmentModelCatalog`             | 在发现后附加合成/最终目录条目 | 提供商需要在 `models list` 和选择器中提供合成的前向兼容条目 |
| 33  | `resolveThinkingProfile`          | 设置模型特定的 `/think` 等级、显示标签和默认值 | 提供商为选定模型公开自定义思考层级或二元标签 |
| 34  | `isBinaryThinking`                | 开/关推理切换兼容性钩子 | 提供商仅公开二元的思考开/关 |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性钩子 | 提供商希望仅在部分模型上启用 `xhigh` |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 等级兼容性钩子 | 提供商拥有某个模型家族的默认 `/think` 策略 |
| 37  | `isModernModelRef`                | 用于实时配置文件过滤和冒烟选择的现代模型匹配器 | 提供商拥有实时/冒烟首选模型匹配逻辑 |
| 38  | `prepareRuntimeAuth`              | 在推理前将已配置的凭证交换为实际运行时令牌/密钥 | 提供商需要令牌交换或短生命周期的请求凭证 |
| 39  | `resolveUsageAuth`                | 为 `/usage` 和相关状态表面解析用量/计费凭证 | 提供商需要自定义用量/配额令牌解析，或需要不同的用量凭证 |
| 40  | `fetchUsageSnapshot`              | 在认证解析后获取并规范化提供商特定的用量/配额快照 | 提供商需要提供商特定的用量端点或负载解析器 |
| 41  | `createEmbeddingProvider`         | 为记忆/搜索构建由提供商拥有的嵌入适配器 | Memory 嵌入行为应归属提供商插件 |
| 42  | `buildReplayPolicy`               | 返回一个重放策略，以控制该提供商的转录处理 | 提供商需要自定义转录策略（例如去除思考块） |
| 43  | `sanitizeReplayHistory`           | 在通用转录清理后重写重放历史 | 提供商需要超出共享压缩辅助工具能力范围的提供商特定重放重写 |
| 44  | `validateReplayTurns`             | 在嵌入式运行器之前，对重放轮次进行最终验证或重塑 | 提供商传输在通用净化后需要更严格的轮次验证 |
| 45  | `onModelSelected`                 | 在模型被选中后运行由提供商拥有的副作用 | 当模型变为活动状态时，提供商需要遥测或由提供商拥有的状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的提供商插件，然后继续尝试其他具备相应钩子能力的提供商插件，直到某个插件实际更改了模型 id 或传输/配置为止。这样可以让别名/兼容性提供商 shim 正常工作，而不要求调用方知道是哪个内置插件拥有该重写逻辑。如果没有任何提供商钩子重写受支持的 Google 家族配置项，内置的 Google 配置规范化器仍会应用那层兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那就是另一类扩展了。这些钩子适用于仍然运行在 OpenClaw 正常推理循环上的提供商行为。

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

内置提供商插件会组合使用上述钩子，以满足各个厂商在目录、认证、思考、重放和用量方面的需求。权威的钩子集合与各插件一同存放在 `extensions/` 下；本页主要说明这些形态，而不是镜像那份列表。

<AccordionGroup>
  <Accordion title="直通目录提供商">
    OpenRouter、Kilocode、Z.AI、xAI 注册 `catalog` 以及
    `resolveDynamicModel` / `prepareDynamicModel`，这样它们就能在 OpenClaw 的静态目录之前暴露上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和用量端点提供商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配对使用，以负责令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理家族">
    共享的命名家族（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）让提供商可以通过
    `buildReplayPolicy` 选择启用转录策略，而无需每个插件都重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录提供商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只注册 `catalog`，并复用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 特定的流辅助工具">
    Beta 请求头、`/fast` / `serviceTier` 以及 `context1m` 位于
    Anthropic 插件公开的 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分核心辅助工具。以 TTS 为例：

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

- `textToSpeech` 返回用于文件/语音便笺表面的常规核心 TTS 输出负载。
- 使用核心 `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区和采样率。插件必须为提供商执行重采样/编码。
- `listVoices` 对部分提供商是可选项。可将其用于厂商拥有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如区域设置、性别和个性标签，以便提供商感知的选择器使用。
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
- 对于厂商拥有的合成行为，使用语音提供商。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` 提供商 id。
- 首选的归属模型是面向公司：随着 OpenClaw 增加这些能力契约，一个厂商插件可以统一拥有文本、语音、图像和未来的媒体提供商。

对于图像/音频/视频理解，插件会注册一个类型化的媒体理解提供商，而不是通用的键值包：

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
- 增量扩展应保持类型化：新增可选方法、新增可选结果字段、新增可选能力。
- 视频生成已经遵循相同模式：
  - 核心拥有能力契约和运行时辅助工具
  - 厂商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件消费 `api.runtime.videoGeneration.*`

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

对于音频转录，插件既可以使用媒体理解运行时，也可以使用旧版 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // 可选：当无法可靠推断 MIME 时：
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享表面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当未产生转录输出时返回 `{ text: undefined }`（例如输入被跳过/不受支持）。
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

- `provider` 和 `model` 是每次运行的可选覆盖项，不是持久化的会话变更。
- OpenClaw 仅对受信任调用方认可这些覆盖字段。
- 对于插件拥有的回退运行，运维者必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制为特定的规范 `provider/model` 目标，或使用 `"*"` 明确允许任意目标。
- 不受信任的插件子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。
- 由插件创建的子智能体会话会带上创建插件 id 的标签。回退 `api.runtime.subagent.deleteSession(...)` 只能删除这些归属会话；删除任意会话仍需要管理员作用域的 Gateway 网关请求。

对于 Web 搜索，插件可以消费共享运行时辅助工具，而无需深入智能体工具接线：

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

插件也可以通过
`api.registerWebSearchProvider(...)` 注册 Web 搜索提供商。

说明：

- 将提供商选择、凭证解析和共享请求语义保留在核心中。
- 对于厂商特定的搜索传输，使用 Web 搜索提供商。
- `api.runtime.webSearch.*` 是需要搜索行为但不依赖智能体工具包装器的功能/渠道插件的首选共享表面。

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
- `auth`：必填。使用 `"gateway"` 表示需要常规 Gateway 网关认证，或使用 `"plugin"` 表示插件管理认证/Webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换其自身已有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并且会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 完全相同的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。仅在相同认证级别内保留 `exact`/`prefix` 的贯穿链。
- `auth: "plugin"` 路由**不会**自动获得运维者运行时作用域。它们用于插件管理的 Webhook/签名校验，而不是有特权的 Gateway 网关辅助调用。
- `auth: "gateway"` 路由运行在 Gateway 网关请求运行时作用域内，但该作用域刻意保持保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由的运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任的带身份 HTTP 模式（例如 `trusted-proxy`，或私有入口上的 `gateway.auth.mode = "none"`）仅会在显式存在该请求头时认可 `x-openclaw-scopes`
  - 如果这些带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实用规则：不要假设一个使用 gateway 认证的插件路由天然就是隐式管理员表面。如果你的路由需要仅管理员可用的行为，请要求带身份的认证模式，并记录显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写新插件时，请使用更窄的 SDK 子路径，而不是使用整体式的 `openclaw/plugin-sdk` 根 barrel。核心子路径如下：

| 子路径 | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语 |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口/构建辅助工具 |
| `openclaw/plugin-sdk/core`          | 通用共享辅助工具和总括契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

渠道插件应从一组窄接缝中进行选择——`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。审批行为应统一收敛到单一的 `approvalCapability` 契约，而不是分散混用到无关的插件字段中。请参阅 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于对应的聚焦 `*-runtime` 子路径下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。优先使用 `config-types`、
`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，而不是广义的 `config-runtime` 兼容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/config-runtime`
和 `openclaw/plugin-sdk/infra-runtime` 是面向旧版插件的已弃用兼容性 shim。
新代码应改为导入更窄的通用原语。
</Info>

仓库内部入口点（针对每个内置插件软件包根目录）：

- `index.js` — 内置插件入口
- `api.js` — 辅助工具/类型 barrel
- `runtime-api.js` — 仅运行时 barrel
- `setup-entry.js` — 设置插件入口

外部插件应只导入 `openclaw/plugin-sdk/*` 子路径。绝不要从核心或其他插件中导入另一个插件软件包的 `src/*`。由 facade 加载的入口点会优先使用当前活动的运行时配置快照；如果不存在，则回退到磁盘上已解析的配置文件。

诸如 `image-generation`、`media-understanding` 和 `speech` 这类能力专用子路径之所以存在，是因为内置插件当前会使用它们。它们并不自动等同于长期冻结的外部契约——在依赖这些路径之前，请查看相关的 SDK 参考页面。

## 消息工具 schema

对于反应、已读和投票等非消息原语，插件应拥有渠道特定的 `describeMessageTool(...)` schema 扩展。共享发送展示应使用通用 `MessagePresentation` 契约，而不是提供商原生的按钮、组件、块或卡片字段。关于该契约、回退规则、提供商映射以及插件作者检查清单，请参阅 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明自己可以渲染的内容：

- `presentation`，用于语义化展示块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`，用于置顶投递请求

核心会决定是原生渲染该展示，还是将其降级为文本。不要从通用消息工具中暴露提供商原生 UI 逃生口。面向旧版原生 schema 的已弃用 SDK 辅助工具仍会为现有第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。保持共享出站宿主通用，并通过消息适配器表面处理提供商规则：

- `messaging.inferTargetChatType({ to })` 决定规范化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心，一个输入是否应跳过目录搜索，直接进入类似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是当核心在规范化之后或目录未命中之后需要最终的提供商拥有解析时，插件侧的回退方案。
- `messaging.resolveOutboundSessionRoute(...)` 则在目标解析完成后负责提供商特定的会话路由构建。

推荐拆分方式：

- 对于应在搜索联系人/群组之前做出的类别判断，使用 `inferTargetChatType`。
- 对于“将其视为显式/原生目标 id”的检查，使用 `looksLikeId`。
- 对于提供商特定的规范化回退，使用 `resolveTarget`，而不是把它用于广泛的目录搜索。
- 将聊天 id、线程 id、JID、handle 和房间 id 之类的提供商原生 id 保留在 `target` 值或提供商特定参数中，而不是放进通用 SDK 字段里。

## 基于配置的目录

从配置派生目录条目的插件应将这部分逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

当一个渠道需要基于配置的联系人/群组时，请使用这一模式，例如：

- 基于 allowlist 的私信联系人
- 已配置的渠道/群组映射
- 账户作用域的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制数量应用
- 去重/规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型目录。

`catalog.run(...)` 返回的形状与 OpenClaw 写入
`models.providers` 的形状相同：

- `{ provider }`：一个提供商条目
- `{ providers }`：多个提供商条目

当插件拥有提供商特定的模型 id、基础 URL 默认值，或受认证门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：纯 API 密钥或环境变量驱动的提供商
- `profile`：当认证配置文件存在时出现的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

在键冲突时，后出现的提供商会胜出，因此插件可以有意覆盖具有相同提供商 id 的内置提供商条目。

兼容性说明：

- `discovery` 仍可作为旧版别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先实现
`plugin.config.inspectAccount(cfg, accountId)`，并与 `resolveAccount(...)` 配套提供。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假设凭证已经完全实体化，并且在缺少必需密钥时快速失败。
- 对于 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor/配置修复流程这类只读命令路径，不应为了描述配置而必须实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（以及对应的来源字段）就足以支持状态类命令。
- 当凭证通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样只读命令就能报告“已配置，但在此命令路径中不可用”，而不是崩溃，或错误地把账户报告为未配置。

## 软件包打包集

一个插件目录可以包含带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会成为一个插件。如果该打包集列出了多个扩展，则插件 id 会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须仍位于插件目录内。逃逸出软件包目录的条目会被拒绝。

安全说明：`openclaw plugins install` 会使用项目本地的 `npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本、运行时无开发依赖），并忽略继承的全局 npm 安装设置。请保持插件依赖树为“纯 JS/TS”，并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级、仅用于设置的模块。当 OpenClaw 需要为一个已禁用的渠道插件提供设置表面，或当一个渠道插件已启用但仍未配置时，它会加载 `setupEntry`，而不是完整的插件入口。这样当主插件入口还会接线工具、钩子或其他仅运行时代码时，就能让启动和设置更加轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可使渠道插件在 Gateway 网关的监听前启动阶段也选择同样的 `setupEntry` 路径，即使该渠道已经完成配置。

仅当 `setupEntry` 完全覆盖了 Gateway 网关开始监听之前必须存在的启动表面时，才应使用此项。实际而言，这意味着设置入口必须注册启动阶段所依赖的每一项渠道拥有能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听前就可用的 HTTP 路由
- 任何必须在同一时间窗口内存在的 Gateway 网关方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用这个标志。保持插件使用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅用于设置的契约表面辅助工具，以便核心在完整渠道运行时加载之前进行查询。当前的设置提升表面如下：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在**不加载完整插件入口**的情况下，将旧版单账户渠道配置提升到 `channels.<id>.accounts.*` 时，就会使用这层表面。Matrix 是当前的内置示例：当已存在命名账户时，它只会把认证/引导键移动到某个已命名的提升账户中，并且它可以保留一个已配置的非规范默认账户键，而不是总是创建 `accounts.default`。

这些设置补丁适配器让内置契约表面的发现保持惰性。导入时开销保持较轻；提升表面只会在首次使用时加载，而不是在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在插件特定的前缀下。核心管理员命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然是保留项，并且始终解析为 `operator.admin`，即使插件请求的是更窄的作用域。

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

渠道插件可以通过 `openclaw.channel` 宣告设置/发现元数据，并通过 `openclaw.install` 宣告安装提示。这样就能保持核心目录不携带数据。

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
      "blurb": "通过 Nextcloud Talk webhook 机器人提供 self-hosted 聊天。",
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

除了最小示例之外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富目录/状态表面的次级标签
- `docsLabel`：覆盖文档链接的文本
- `preferOver`：此目录项应优先于哪些更低优先级的插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面的文案控制
- `markdownCapable`：将渠道标记为支持 Markdown，以便做出出站格式化决策
- `exposure.configured`：当设为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：当设为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部/私有，用于文档导航表面
- `showConfigured` / `showInSetup`：出于兼容性仍接受的旧版别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道选择加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者让 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

生成的渠道目录项和提供商安装目录项会在原始 `openclaw.install` 块旁边暴露规范化后的安装源事实。这些规范化事实会标识 npm 规格是精确版本还是浮动选择器、是否存在预期的完整性元数据，以及本地源路径是否也可用。当目录/软件包身份已知时，规范化事实还会在解析出的 npm 包名偏离该身份时发出警告。它们还会在 `defaultChoice` 无效或指向不可用来源时发出警告，以及在存在 npm 完整性元数据但没有有效 npm 来源时发出警告。消费者应将 `installSource` 视为附加的可选字段，这样手工构造的条目和目录 shim 就不必强制合成它。
这让新手引导和诊断能够解释源平面状态，而无需导入插件运行时。

官方外部 npm 条目应优先使用精确的 `npmSpec` 加上
`expectedIntegrity`。仅写裸包名和 dist-tag 仍然可以兼容使用，但它们会暴露源平面警告，以便目录在不破坏现有插件的前提下逐步迁移到固定版本、带完整性校验的安装方式。当新手引导从本地目录路径安装时，它会尽可能记录一条带有 `source: "path"` 和工作区相对 `sourcePath` 的托管插件索引项。绝对的实际加载路径仍保留在 `plugins.load.paths` 中；安装记录会避免把本地工作站路径重复写入长期配置。这样可以让本地开发安装对源平面诊断可见，而无需增加第二个原始文件系统路径泄露表面。持久化的 `plugins/installs.json` 插件索引是安装来源的事实源，并且可以在不加载插件运行时模块的情况下刷新。即使插件 manifest 缺失或无效，它的 `installRecords` 映射仍然是持久的；它的 `plugins` 数组则是可重建的 manifest/缓存视图。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排能力，负责摄取、组装和压缩。通过
`api.registerContextEngine(id, factory)` 在你的插件中注册它们，然后通过
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不仅仅是添加 Memory 搜索或钩子时，请使用此方式。

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

如果你的引擎**不**拥有压缩算法，请仍然实现 `compact()`，并显式委托它：

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

## 添加新能力

当插件需要当前 API 无法容纳的行为时，不要通过私有内部访问绕过插件系统。应添加缺失的能力。

推荐顺序：

1. 定义核心契约
   决定哪些共享行为应由核心拥有：策略、回退、配置合并、
   生命周期、面向渠道的语义以及运行时辅助工具形状。
2. 添加类型化的插件注册/运行时表面
   用最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 接通核心 + 渠道/功能消费者
   渠道和功能插件应通过核心消费该新能力，
   而不是直接导入某个厂商实现。
4. 注册厂商实现
   然后由厂商插件将它们的后端注册到该能力上。
5. 添加契约覆盖
   添加测试，使归属关系和注册形状随着时间推移仍保持明确。

这就是 OpenClaw 保持鲜明立场、但不会被某个提供商世界观硬编码绑死的方式。具体的文件清单和完整示例，请参阅 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加一个新能力时，实现通常应同时触及以下这些表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器/运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道插件需要消费它时，`src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助工具
- `src/plugins/contracts/registry.ts` 中的归属/契约断言
- `docs/` 中的运维者/插件文档

如果这些表面中缺少某一项，通常说明该能力尚未完全集成。

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

// 面向功能/渠道插件的共享运行时辅助工具
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
- 功能/渠道插件消费运行时辅助工具
- 契约测试使归属关系保持明确

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) — 公开能力模型和形态
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
