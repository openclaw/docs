---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或软件包打包
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载流水线、注册表、运行时钩子、HTTP 路由和参考表格
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-28T02:18:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bca04941f21d711a259137faab57a430d40cf3ea74ab9b3bfdce11a3d28e00
    source_path: plugins/architecture-internals.md
    workflow: 15
---

有关公开能力模型、插件形状以及所有权/执行契约，请参阅 [插件架构](/zh-CN/plugins/architecture)。本页是内部机制的参考：加载流水线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和 schema 表格。

## 加载流水线

在启动时，OpenClaw 大致会这样做：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifest 和 package 元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 `jiti`
7. 调用原生 `register(api)` 钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令/运行时表面

<Note>
`activate` 是 `register` 的旧别名——加载器会解析现有项（`def.register ?? def.activate`），并在同一时机调用它。所有内置插件都使用 `register`；新插件优先使用 `register`。
</Note>

安全门禁发生在**运行时执行之前**。当入口逃逸出插件根目录、路径可被所有用户写入，或对于非内置插件而言路径所有权看起来可疑时，候选项会被阻止。

### Manifest 优先的行为

manifest 是控制平面的真实来源。OpenClaw 使用它来：

- 标识插件
- 发现声明的渠道/Skills/配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 补充 Control UI 标签/占位符
- 显示安装/目录元数据
- 在不加载插件运行时的情况下，保留低成本的激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如钩子、工具、命令或提供商流程。

可选的 manifest `activation` 和 `setup` 块保留在控制平面。它们是仅元数据的描述符，用于激活规划和设置发现；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。
最初的实时激活消费者现在会使用 manifest 中的命令、渠道和提供商提示，在更广泛的注册表物化之前缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置/插件解析会缩小到拥有所请求渠道 id 的插件
- 显式的提供商设置/运行时解析会缩小到拥有所请求提供商 id 的插件
- Gateway 网关启动规划使用 `activation.onStartup` 进行显式启动导入和启动退出选择；随着 OpenClaw 逐步摆脱隐式启动导入，每个插件都应声明它，而没有静态能力元数据且没有 `activation.onStartup` 的插件，出于兼容性仍会使用已弃用的隐式启动 sidecar 回退

激活规划器既为现有调用方暴露仅含 id 的 API，也为新的诊断暴露 plan API。计划条目会报告为什么选择了某个插件，将显式的 `activation.*` 规划器提示与 manifest 所有权回退（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子）区分开来。这种原因拆分就是兼容性边界：现有插件元数据继续有效，而新代码可以在不改变运行时加载语义的前提下检测宽泛提示或回退行为。

设置发现现在优先使用描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，以在回退到 `setup-api` 之前缩小候选插件范围；后者用于仍需要设置时运行时钩子的插件。提供商设置列表会使用 manifest `providerAuthChoices`、描述符派生的设置选项以及安装目录元数据，而无需加载提供商运行时。显式的 `setup.requiresRuntime: false` 是仅描述符的截止点；省略 `requiresRuntime` 则会保留旧版 `setup-api` 回退以实现兼容性。如果有多个已发现插件声明了同一个规范化后的设置提供商或 CLI 后端 id，设置查找会拒绝这个歧义所有者，而不是依赖发现顺序。当设置运行时确实执行时，注册表诊断会报告 `setup.providers` / `setup.cliBackends` 与由 `setup-api` 注册的提供商或 CLI 后端之间的漂移，但不会阻止旧版插件。

### 加载器会缓存什么

OpenClaw 会保留以下短生命周期的进程内缓存：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可减少突发启动和重复命令的开销。可以安全地将它们视为短生命周期的性能缓存，而不是持久化存储。

Gateway 网关启动热路径应优先使用当前的 `PluginMetadataSnapshot`、派生的 `PluginLookUpTable`，或通过调用链传递的显式 manifest 注册表。在可用时，配置验证、启动自动启用和插件引导都会使用同一个快照。对于仍然从持久化的已安装插件索引重建 manifest 元数据的调用方，OpenClaw 还会保留一个小型有界回退缓存，其键由已安装索引、请求形状、配置策略、运行时根目录以及 manifest/package 文件签名组成。该缓存只是针对重复的已安装索引重建的回退；它不是可变的运行时插件注册表。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 设置 `OPENCLAW_DISABLE_INSTALLED_PLUGIN_MANIFEST_REGISTRY_CACHE=1` 仅禁用已安装索引的 manifest 注册表回退缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接随意修改 core 全局状态。它们会注册到一个中央插件注册表中。

注册表会跟踪：

- 插件记录（标识、来源、源类型、状态、诊断）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

然后，core 功能会从该注册表中读取，而不是直接与插件模块交互。这使加载保持单向：

- 插件模块 -> 注册表注册
- core 运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数 core 表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在批准结果确定后作出响应。

使用 `api.onConversationBindingResolved(...)` 可在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 这个插件 + 会话现在已有一个绑定。
        console.log(event.binding?.conversationId);
        return;
      }

      // 请求被拒绝；清除任何本地待处理状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求的解析后绑定
- `request`：原始请求摘要、分离提示、发送者 id 和会话元数据

此回调仅用于通知。它不会改变谁被允许绑定会话，并且它会在 core 批准处理完成后运行。

## 提供商运行时钩子

提供商插件有三层：

- **Manifest 元数据**，用于低成本的运行时前查找：
  `setup.providers[].envVars`、已弃用的兼容项 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时钩子**：`catalog`（旧版为 `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，覆盖认证、模型解析、
  流包装、思考级别、重放策略和用量端点。完整列表见
  [钩子顺序和用法](#hook-order-and-usage)。

OpenClaw 仍然拥有通用的 Agent loop、故障转移、转录处理和工具策略。这些钩子是提供商特定行为的扩展表面，而无需实现一整套自定义推理传输。

当提供商具有基于环境变量的凭证，且通用认证/状态/模型选择器路径需要在不加载提供商运行时的情况下看到这些凭证时，请使用 manifest `setup.providers[].envVars`。已弃用的 `providerAuthEnvVars` 在弃用窗口期间仍会由兼容适配器读取，使用它的非内置插件会收到一条 manifest 诊断。当一个提供商 id 应复用另一个提供商 id 的环境变量、认证配置文件、基于配置的认证和 API 密钥新手引导选项时，请使用 manifest `providerAuthAliases`。当新手引导/认证选项 CLI 表面需要在不加载提供商运行时的情况下了解该提供商的 choice id、分组标签和简单的单标志认证接线时，请使用 manifest `providerAuthChoices`。保留提供商运行时
`envVars` 用于面向操作员的提示，例如新手引导标签或 OAuth
client-id/client-secret 设置变量。

当渠道具有由环境变量驱动的认证或设置，且通用 shell 环境变量回退、配置/状态检查或设置提示需要在不加载渠道运行时的情况下看到这些信息时，请使用 manifest `channelEnvVars`。

### 钩子顺序和用法

对于模型/提供商插件，OpenClaw 大致会按以下顺序调用钩子。
“何时使用”列是快速决策指南。

| #   | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 期间将提供商配置发布到 `models.providers` 中 | 提供商拥有目录或 base URL 默认值 |
| 2   | `applyConfigDefaults`             | 在配置物化期间应用提供商拥有的全局配置默认值 | 默认值依赖于认证模式、环境变量或提供商模型家族语义 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试正常的注册表/目录路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId`                | 在查找前规范化旧版或预览版 model-id 别名 | 提供商在规范模型解析前拥有别名清理逻辑 |
| 4   | `normalizeTransport`              | 在通用模型组装前规范化提供商家族的 `api` / `baseUrl` | 提供商在同一传输家族中对自定义提供商 id 拥有传输清理逻辑 |
| 5   | `normalizeConfig`                 | 在运行时/提供商解析前规范化 `models.providers.<id>` | 提供商需要与插件放在一起的配置清理；内置的 Google 家族辅助逻辑也会为受支持的 Google 配置条目提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式用量兼容性重写 | 提供商需要基于端点驱动的原生流式用量元数据修复 |
| 7   | `resolveConfigApiKey`             | 在加载运行时认证前，为配置提供商解析环境变量标记认证 | 提供商拥有自己的环境变量标记 API 密钥解析；`amazon-bedrock` 在这里也有一个内置的 AWS 环境变量标记解析器 |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的情况下暴露本地/自托管或基于配置的认证 | 提供商可以使用 synthetic/local 凭证标记运行 |
| 9   | `resolveExternalAuthProfiles`     | 叠加提供商拥有的外部认证配置文件；CLI/应用拥有的凭证默认 `persistence` 为 `runtime-only` | 提供商可在不持久化复制的刷新令牌的情况下复用外部认证凭证；请在 manifest 中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的 synthetic 配置文件占位符排在环境变量/基于配置的认证之后 | 提供商存储了 synthetic 占位配置文件，而这些配置文件不应具有更高优先级 |
| 11  | `resolveDynamicModel`             | 为本地注册表中尚不存在的提供商拥有模型 id 提供同步回退 | 提供商接受任意上游模型 id |
| 12  | `prepareDynamicModel`             | 先进行异步预热，然后再次运行 `resolveDynamicModel` | 提供商在解析未知 id 之前需要网络元数据 |
| 13  | `normalizeResolvedModel`          | 在嵌入式运行器使用已解析模型之前进行最终重写 | 提供商需要传输重写，但仍使用 core 传输 |
| 14  | `contributeResolvedModelCompat`   | 为位于另一兼容传输之后的厂商模型贡献兼容性标志 | 提供商可在代理传输上识别自己的模型，而无需接管该提供商 |
| 15  | `capabilities`                    | 由共享 core 逻辑使用的提供商拥有的转录/工具元数据 | 提供商需要转录/提供商家族特有行为支持 |
| 16  | `normalizeToolSchemas`            | 在嵌入式运行器看到之前规范化工具 schema | 提供商需要传输家族 schema 清理 |
| 17  | `inspectToolSchemas`              | 在规范化后暴露提供商拥有的 schema 诊断 | 提供商希望提供关键字警告，而不必让 core 学会提供商特定规则 |
| 18  | `resolveReasoningOutputMode`      | 选择原生或带标签的 reasoning-output 契约 | 提供商需要带标签的 reasoning/final output，而不是原生字段 |
| 19  | `prepareExtraParams`              | 在通用流选项包装器之前规范化请求参数 | 提供商需要默认请求参数或按提供商清理参数 |
| 20  | `createStreamFn`                  | 用自定义传输完全替换正常的流路径 | 提供商需要自定义线路协议，而不仅仅是包装器 |
| 21  | `wrapStreamFn`                    | 在应用通用包装器后进行流包装 | 提供商需要请求头/请求体/模型兼容性包装器，但不需要自定义传输 |
| 22  | `resolveTransportTurnState`       | 附加原生的逐轮传输头或元数据 | 提供商希望通用传输发送提供商原生的轮次标识 |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 头或会话冷却策略 | 提供商希望通用 WS 传输调整会话头或回退策略 |
| 24  | `formatApiKey`                    | 认证配置文件格式化器：已存储配置文件会变为运行时 `apiKey` 字符串 | 提供商存储了额外认证元数据，并需要自定义运行时令牌形状 |
| 25  | `refreshOAuth`                    | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑 | 提供商不适配共享的 `pi-ai` 刷新器 |
| 26  | `buildAuthDoctorHint`             | 当 OAuth 刷新失败时追加修复提示 | 提供商在刷新失败后需要提供商拥有的认证修复指引 |
| 27  | `matchesContextOverflowError`     | 提供商拥有的上下文窗口溢出匹配器 | 提供商有通用启发式无法识别的原始溢出错误 |
| 28  | `classifyFailoverReason`          | 提供商拥有的故障转移原因分类 | 提供商可以将原始 API/传输错误映射为速率限制/过载等 |
| 29  | `isCacheTtlEligible`              | 面向代理/回程提供商的提示缓存策略 | 提供商需要特定于代理的缓存 TTL 门禁 |
| 30  | `buildMissingAuthMessage`         | 替换通用缺失认证恢复消息 | 提供商需要提供商特定的缺失认证恢复提示 |
| 31  | `suppressBuiltInModel`            | 已弃用。运行时钩子不再被调用；请改用 manifest `modelCatalog.suppressions` | 这是用于隐藏过时上游条目的历史钩子；新的抑制数据应保留在插件 manifest 中 |
| 32  | `augmentModelCatalog`             | 在发现后追加 synthetic/final 目录条目 | 提供商需要在 `models list` 和选择器中提供 synthetic 的前向兼容条目 |
| 33  | `resolveThinkingProfile`          | 设置特定于模型的 `/think` 级别、显示标签和默认值 | 提供商为选定模型公开自定义思考阶梯或二元标签 |
| 34  | `isBinaryThinking`                | 开/关推理切换兼容性钩子 | 提供商只公开二元的思考开/关 |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性钩子 | 提供商希望仅在部分模型上启用 `xhigh` |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性钩子 | 提供商拥有某个模型家族的默认 `/think` 策略 |
| 37  | `isModernModelRef`                | 用于实时配置文件过滤和 smoke 选择的现代模型匹配器 | 提供商拥有 live/smoke 首选模型匹配逻辑 |
| 38  | `prepareRuntimeAuth`              | 在推理之前，将已配置的凭证交换为实际运行时令牌/密钥 | 提供商需要令牌交换或短生命周期的请求凭证 |
| 39  | `resolveUsageAuth`                | 为 `/usage` 和相关状态表面解析用量/计费凭证 | 提供商需要自定义用量/配额令牌解析，或使用不同的用量凭证 |
| 40  | `fetchUsageSnapshot`              | 在认证解析后获取并规范化提供商特定的用量/配额快照 | 提供商需要提供商特定的用量端点或负载解析器 |
| 41  | `createEmbeddingProvider`         | 为内存/搜索构建提供商拥有的嵌入适配器 | 内存嵌入行为应归属于提供商插件 |
| 42  | `buildReplayPolicy`               | 返回一个控制提供商转录处理方式的重放策略 | 提供商需要自定义转录策略（例如剥离 thinking 块） |
| 43  | `sanitizeReplayHistory`           | 在通用转录清理后重写重放历史 | 提供商需要超出共享压缩辅助工具范围的提供商特定重放重写 |
| 44  | `validateReplayTurns`             | 在嵌入式运行器之前对重放轮次进行最终验证或重塑 | 提供商传输在通用清理后需要更严格的轮次验证 |
| 45  | `onModelSelected`                 | 在模型被选中后运行提供商拥有的后置副作用 | 当模型变为活动状态时，提供商需要遥测或提供商拥有的状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的提供商插件，然后依次回退到其他具备相应钩子能力的提供商插件，直到有插件实际更改了模型 id 或传输/配置。这样可以让别名/兼容性提供商 shim 继续工作，而不要求调用方知道是哪个内置插件拥有这项重写逻辑。如果没有任何提供商钩子重写受支持的 Google 家族配置条目，内置的 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线路协议或自定义请求执行器，那就是另一类扩展。这些钩子适用于仍运行在 OpenClaw 正常推理循环上的提供商行为。

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

内置提供商插件会组合使用上述钩子，以适配各厂商在目录、认证、思考、重放和用量方面的需求。权威的钩子集合位于 `extensions/` 下各插件内部；本页旨在说明这些形状，而不是镜像完整列表。

<AccordionGroup>
  <Accordion title="透传目录提供商">
    OpenRouter、Kilocode、Z.AI、xAI 会注册 `catalog` 以及
    `resolveDynamicModel` / `prepareDynamicModel`，从而能够在 OpenClaw
    的静态目录之前暴露上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和用量端点提供商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 会将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配对使用，以控制令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理家族">
    共享的命名家族（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）让提供商能够通过
    `buildReplayPolicy` 选择转录策略，而不是让每个插件都重复实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录提供商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 仅注册 `catalog`，并复用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 专用流辅助工具">
    Beta 头、`/fast` / `serviceTier` 以及 `context1m` 位于
    Anthropic 插件的公共 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是放在
    通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分 core 辅助工具。以 TTS 为例：

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

- `textToSpeech` 会返回普通 core TTS 输出负载，用于文件/语音便笺表面。
- 使用 core `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为提供商重新采样/编码。
- `listVoices` 对每个提供商来说都是可选的。可将其用于厂商拥有的语音选择器或设置流程。
- 语音列表可包含更丰富的元数据，例如 locale、gender 和 personality 标签，以支持提供商感知的选择器。
- 当前 OpenAI 和 ElevenLabs 支持电话语音。Microsoft 不支持。

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

- 将 TTS 策略、回退和回复投递保留在 core 中。
- 语音提供商用于厂商拥有的语音合成行为。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` 提供商 id。
- 首选的所有权模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个厂商插件可以拥有文本、语音、图像以及未来的媒体提供商。

对于图像/音频/视频理解，插件应注册一个类型化的媒体理解提供商，而不是一个通用的键值包：

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

- 将编排、回退、配置和渠道接线保留在 core 中。
- 将厂商行为保留在提供商插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已经遵循相同模式：
  - core 拥有能力契约和运行时辅助工具
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
  // 当无法可靠推断 MIME 时可选：
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享表面。
- 使用 core 媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
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

- `provider` 和 `model` 是每次运行可选的覆盖项，不是持久性的会话变更。
- OpenClaw 只会为受信任调用方启用这些覆盖字段。
- 对于插件拥有的回退运行，操作员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制为特定的规范 `provider/model` 目标，或使用 `"*"` 以显式允许任意目标。
- 不受信任的插件子智能体运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。
- 由插件创建的子智能体会话会带有创建插件 id 标签。回退 `api.runtime.subagent.deleteSession(...)` 只能删除这些所属会话；删除任意会话仍然需要管理员作用域的 Gateway 网关请求。

对于 web 搜索，插件可以使用共享运行时辅助工具，而不是深入到智能体工具接线中：

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

- 将提供商选择、凭证解析和共享请求语义保留在 core 中。
- Web 搜索提供商用于厂商特定的搜索传输。
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
- `auth`：必填。使用 `"gateway"` 以要求普通 Gateway 网关认证，或使用 `"plugin"` 以启用插件管理的认证/webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一个插件替换它自己现有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。仅在相同认证级别下保留 `exact`/`prefix` 贯穿链。
- `auth: "plugin"` 路由**不会**自动获得操作员运行时作用域。它们用于插件管理的 webhook/签名验证，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域是有意保守的：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任的携带身份 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在请求头显式存在时才会接受 `x-openclaw-scopes`
  - 如果这些携带身份的插件路由请求缺少 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实用规则：不要假设一个使用 gateway 认证的插件路由就是隐式管理员表面。如果你的路由需要仅管理员可用的行为，请要求使用携带身份的认证模式，并记录显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写新插件时，请使用更窄的 SDK 子路径，而不是单体的 `openclaw/plugin-sdk` 根 barrel。Core 子路径包括：

| 子路径 | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语 |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口/构建辅助工具 |
| `openclaw/plugin-sdk/core`          | 通用共享辅助工具和 umbrella 契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

渠道插件可从一组更窄的接缝中选择——`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。批准行为应统一收敛到单一的
`approvalCapability` 契约，而不是分散混用在不相关的插件字段中。参见
[渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于匹配的聚焦 `*-runtime` 子路径下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。优先使用 `config-types`、
`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，
而不是宽泛的 `config-runtime` 兼容 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/config-runtime`
和 `openclaw/plugin-sdk/infra-runtime` 是面向旧插件的已弃用兼容 shim。
新代码应改为导入更窄的通用原语。
</Info>

仓库内部入口点（按每个内置插件 package 根目录）：

- `index.js` —— 内置插件入口
- `api.js` —— 辅助工具/类型 barrel
- `runtime-api.js` —— 仅运行时 barrel
- `setup-entry.js` —— 设置插件入口

外部插件只能导入 `openclaw/plugin-sdk/*` 子路径。绝不要从 core 或其他插件中导入另一个插件 package 的 `src/*`。通过 facade 加载的入口点会优先使用当前活动的运行时配置快照，如果不存在，则回退到磁盘上的已解析配置文件。

像 `image-generation`、`media-understanding` 和 `speech` 这样的能力专用子路径之所以存在，是因为内置插件目前正在使用它们。它们并不自动意味着长期冻结的外部契约——在依赖这些路径时，请查看相关的 SDK 参考页。

## 消息工具 schema

对于反应、已读和投票等非消息原语，插件应拥有渠道特定的 `describeMessageTool(...)` schema 贡献。共享发送呈现应使用通用 `MessagePresentation` 契约，而不是提供商原生的按钮、组件、块或卡片字段。有关契约、回退规则、提供商映射和插件作者清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明它们可以渲染的内容：

- `presentation`：用于语义呈现块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`：用于固定投递请求

Core 会决定是原生渲染该呈现，还是将其降级为文本。不要从通用消息工具中暴露提供商原生 UI 逃生口。为旧版原生 schema 提供的已弃用 SDK 辅助工具仍会导出以支持现有第三方插件，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。保持共享出站主机通用，并使用消息适配器表面来承载提供商规则：

- `messaging.inferTargetChatType({ to })` 决定规范化目标在目录查找之前应被视为 `direct`、`group` 还是 `channel`
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉 core 某个输入是否应跳过目录搜索，直接进入类似 id 的解析
- `messaging.targetResolver.resolveTarget(...)` 是在规范化之后或目录未命中之后，core 需要最终由提供商拥有的解析时所使用的插件回退
- `messaging.resolveOutboundSessionRoute(...)` 在目标被解析后拥有提供商特定的会话路由构造逻辑

推荐拆分：

- 对于应在搜索 peers/groups 之前发生的分类决策，使用 `inferTargetChatType`
- 对于“将其视为显式/原生目标 id”的检查，使用 `looksLikeId`
- 将 `resolveTarget` 用于提供商特定的规范化回退，而不是广泛的目录搜索
- 将 chat id、thread id、JID、handle 和 room id 这类提供商原生 id 保留在 `target` 值或提供商特定参数中，而不是放进通用 SDK 字段

## 基于配置的目录

如果插件从配置派生目录条目，应将该逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

适用于渠道需要基于配置的 peers/groups 的情况，例如：

- 由 allowlist 驱动的私信 peers
- 已配置的渠道/群组映射
- 账户作用域的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制项应用
- 去重/规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 相同的形状：

- `{ provider }`：一个提供商条目
- `{ providers }`：多个提供商条目

当插件拥有提供商特定的模型 id、base URL 默认值或受认证限制的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：普通 API 密钥或环境变量驱动的提供商
- `profile`：存在认证配置文件时出现的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

后出现的提供商会在键冲突时获胜，因此插件可以有意用相同提供商 id 覆盖内置提供商条目。

兼容性：

- `discovery` 仍可作为旧别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先实现
`plugin.config.inspectAccount(cfg, accountId)`，并同时实现 `resolveAccount(...)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证已被完全物化，并且在缺少所需 secret 时快速失败。
- 像 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 以及 doctor/配置修复流程这样的只读命令路径，不应只是为了描述配置就去物化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 为了报告只读可用性，你不需要返回原始令牌值。返回 `tokenStatus: "available"`（以及对应的来源字段）就足以支持类似状态命令。
- 当凭证通过 SecretRef 配置但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样可以让只读命令报告“已配置，但在此命令路径中不可用”，而不是崩溃或错误地将该账户报告为未配置。

## 软件包打包

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

每个条目都会变成一个插件。如果该 pack 列出多个 extensions，则插件 id 会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以确保 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保持在插件目录内部。逃逸出 package 目录的条目会被拒绝。

安全说明：`openclaw plugins install` 会使用项目本地的 `npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本、运行时无开发依赖），并忽略继承的全局 npm 安装设置。请保持插件依赖树为“纯 JS/TS”，并避免需要 `postinstall` 构建的 package。

可选：`openclaw.setupEntry` 可以指向一个轻量级、仅用于设置的模块。当 OpenClaw 需要为一个已禁用的渠道插件提供设置表面时，或者当某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`，而不是完整的插件入口。这样在主插件入口还会接线工具、钩子或其他仅运行时代码时，可以让启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让某个渠道插件在 Gateway 网关预监听启动阶段也选择相同的 `setupEntry` 路径，即使该渠道已经配置完成。

只有当 `setupEntry` 完全覆盖了 Gateway 网关开始监听之前必须存在的启动表面时，才使用此选项。实际上，这意味着设置入口必须注册启动所依赖的每一项渠道拥有能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听之前可用的 HTTP 路由
- 任何必须在同一时间窗口内存在的 Gateway 网关方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用此标志。保持插件使用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅设置阶段的契约表面辅助工具，供 core 在完整渠道运行时加载之前查询。当前的设置提升表面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当 core 需要在不加载完整插件入口的情况下，将旧版单账户渠道配置提升到 `channels.<id>.accounts.*` 时，就会使用这组表面。Matrix 是当前的内置示例：当命名账户已存在时，它只会将认证/引导键移动到一个已命名的提升账户中，并且它可以保留一个已配置的非规范默认账户键，而不是总是创建 `accounts.default`。

这些设置补丁适配器让内置契约表面发现保持惰性。导入时开销保持很轻；提升表面只会在首次使用时加载，而不会在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在插件特定的前缀下。Core 管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍然是保留的，并且始终解析为 `operator.admin`，即使某个插件请求了更窄的作用域。

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

渠道插件可以通过 `openclaw.channel` 公布设置/发现元数据，并通过 `openclaw.install` 公布安装提示。这样可以让 core 目录保持无数据。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

除了最小示例之外，其他有用的 `openclaw.channel` 字段包括：

- `detailLabel`：用于更丰富目录/状态表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：此目录条目应优先于的低优先级插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面文案控制
- `markdownCapable`：将渠道标记为支持 Markdown，以供出站格式决策使用
- `exposure.configured`：当设置为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：当设置为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：在文档导航表面中将该渠道标记为内部/私有
- `showConfigured` / `showInSetup`：出于兼容性仍接受的旧别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道选择加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧别名。

生成的渠道目录条目和提供商安装目录条目会在原始 `openclaw.install` 块旁边暴露规范化后的安装源信息。这些规范化信息用于标识 npm 规格是精确版本还是浮动选择器、是否存在预期的完整性元数据，以及本地源路径是否也可用。当目录/package 身份已知时，这些规范化信息会在解析出的 npm package 名称偏离该身份时发出警告。它们还会在 `defaultChoice` 无效或指向不可用源时发出警告，以及在存在 npm 完整性元数据但没有有效 npm 源时发出警告。使用方应将 `installSource` 视为附加的可选字段，这样手工构建的条目和目录 shim 就不必合成它。
这使得新手引导和诊断能够在不导入插件运行时的情况下解释源平面状态。

官方外部 npm 条目应优先使用精确的 `npmSpec` 加上 `expectedIntegrity`。裸 package 名称和 dist-tag 出于兼容性仍可使用，但它们会暴露源平面警告，以便目录能够逐步迁移到固定版本、带完整性校验的安装方式，而不会破坏现有插件。当新手引导从本地目录路径安装时，它会记录一个受管插件索引条目，其中 `source: "path"`，并尽可能使用相对于工作区的 `sourcePath`。绝对的实际加载路径保留在 `plugins.load.paths` 中；安装记录会避免将本地工作站路径重复写入长期配置。这样可使本地开发安装对源平面诊断保持可见，而无需增加第二个原始文件系统路径暴露表面。持久化的 `plugins/installs.json` 插件索引是安装源的真实来源，并且可以在不加载插件运行时模块的情况下刷新。它的 `installRecords` 映射即使在插件 manifest 缺失或无效时也是持久的；它的 `plugins` 数组则是可重建的 manifest/缓存视图。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排，负责摄取、组装和压缩。请在你的插件中通过
`api.registerContextEngine(id, factory)` 注册它们，然后使用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不仅仅是添加内存搜索或钩子时，请使用它。

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

如果你的引擎**不**拥有压缩算法，请保持实现 `compact()`，并显式委托：

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

当插件需要当前 API 无法覆盖的行为时，不要通过私有深入访问绕过插件系统。应当添加缺失的能力。

推荐顺序：

1. 定义 core 契约  
   决定哪些共享行为应由 core 拥有：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助工具形状。
2. 添加类型化的插件注册/运行时表面  
   以最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 连接 core + 渠道/功能使用方  
   渠道和功能插件应通过 core 使用这项新能力，
   而不是直接导入某个厂商实现。
4. 注册厂商实现  
   然后由厂商插件针对该能力注册其后端实现。
5. 添加契约覆盖  
   添加测试，使所有权和注册形状能够长期保持显式。

这就是 OpenClaw 在保持明确主张的同时，不会被硬编码为某个提供商世界观的方式。有关具体的文件清单和完整示例，请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力清单

当你添加一个新能力时，实现通常应同时触及以下表面：

- `src/<capability>/types.ts` 中的 core 契约类型
- `src/<capability>/runtime.ts` 中的 core 运行器/运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道插件需要使用它时，位于 `src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助工具
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中面向操作员/插件的文档

如果其中某个表面缺失，通常说明这项能力尚未完全集成。

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

// feature/channel 插件的共享运行时辅助工具
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契约测试模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

这样规则就保持简单：

- core 拥有能力契约 + 编排
- 厂商插件拥有厂商实现
- 功能/渠道插件使用运行时辅助工具
- 契约测试使所有权保持显式

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) —— 公开能力模型和形状
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
