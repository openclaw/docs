---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或软件包包集
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载管线、注册表、运行时钩子、HTTP 路由和参考表
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-29T01:24:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c1167edfe84782c735fa8f22e25e14728c64289b63774a6c9730fecace7cc1a
    source_path: plugins/architecture-internals.md
    workflow: 16
---

对于公共能力模型、插件形态以及所有权/执行契约，请参阅 [插件架构](/zh-CN/plugins/architecture)。本页是内部机制的参考：加载流水线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和 schema 表。

## 加载流水线

启动时，OpenClaw 大致会执行以下操作：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle manifest 以及 package 元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 决定每个候选项是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；
   未构建的原生插件使用 jiti
7. 调用原生 `register(api)` 钩子，并将注册项收集到插件注册表中
8. 将注册表暴露给命令/运行时界面

<Note>
`activate` 是 `register` 的旧版别名 —— 加载器会解析存在的那个（`def.register ?? def.activate`），并在同一位置调用它。所有内置插件都使用 `register`；新插件优先使用 `register`。
</Note>

安全门禁发生在运行时执行**之前**。当入口逃逸出插件根目录、路径为全局可写，或非内置插件的路径所有权看起来可疑时，候选项会被阻止。

### Manifest 优先行为

manifest 是控制平面的事实来源。OpenClaw 用它来：

- 识别插件
- 发现声明的渠道/skills/配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/catalog 元数据
- 在不加载插件运行时的情况下，保留低成本的激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它注册实际行为，例如钩子、工具、命令或提供商流程。

可选的 manifest `activation` 和 `setup` 块保留在控制平面上。它们是用于激活规划和设置发现的纯元数据描述符；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。首批实时激活消费者现在会使用 manifest 命令、渠道和提供商提示，在更广泛的注册表物化之前缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置/插件解析会缩小到拥有所请求渠道 id 的插件
- 显式提供商设置/运行时解析会缩小到拥有所请求提供商 id 的插件
- Gateway 网关启动规划会使用 `activation.onStartup` 进行显式启动导入和启动选择退出；随着 OpenClaw 摆脱隐式启动导入，每个插件都应声明它，而没有静态能力元数据且没有 `activation.onStartup` 的插件，仍会使用已弃用的隐式启动 sidecar 回退来保持兼容性

激活规划器同时为现有调用方暴露仅 ids 的 API，并为新诊断暴露计划 API。计划条目会报告插件被选中的原因，将显式 `activation.*` 规划器提示与 manifest 所有权回退区分开来，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子。这种原因拆分就是兼容性边界：现有插件元数据会继续工作，而新代码可以在不改变运行时加载语义的情况下检测宽泛提示或回退行为。

设置发现现在优先使用描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，在回退到仍需要设置时运行时钩子的插件的 `setup-api` 之前缩小候选插件范围。提供商设置列表会使用 manifest `providerAuthChoices`、从描述符派生的设置选项以及安装 catalog 元数据，而不加载提供商运行时。显式 `setup.requiresRuntime: false` 是仅描述符的截止点；省略 `requiresRuntime` 会保留旧版 setup-api 回退以保持兼容性。如果多个已发现插件声明同一个规范化后的设置提供商或 CLI 后端 id，设置查找会拒绝这个有歧义的所有者，而不是依赖发现顺序。当设置运行时确实执行时，注册表诊断会报告 `setup.providers` / `setup.cliBackends` 与 setup-api 注册的提供商或 CLI 后端之间的漂移，但不会阻止旧版插件。

### 加载器缓存的内容

OpenClaw 会保留短期进程内缓存，用于：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可以降低突发启动和重复命令开销。可以把它们视为短生命周期的性能缓存，而不是持久化存储。

Gateway 网关启动热路径应优先使用当前的 `PluginMetadataSnapshot`、派生的 `PluginLookUpTable`，或通过调用链传入的显式 manifest 注册表。配置验证、启动自动启用和插件引导会在可用时使用同一个快照。对于仍从持久化已安装插件索引重建 manifest 元数据的调用方，OpenClaw 还会保留一个小型有界回退缓存，其键由已安装索引、请求形态、配置策略、运行时根目录以及 manifest/package 文件签名组成。该缓存只是重复已安装索引重建的回退；它不是可变的运行时插件注册表。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 设置 `OPENCLAW_DISABLE_INSTALLED_PLUGIN_MANIFEST_REGISTRY_CACHE=1` 可仅禁用已安装索引 manifest 注册表回退缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改随机的核心全局变量。它们会注册到中央插件注册表中。

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

然后核心功能会从该注册表读取，而不是直接与插件模块交互。这使加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数核心界面只需要一个集成点：“读取注册表”，而不是“为每个插件模块编写特殊情况”。

## 对话绑定回调

绑定对话的插件可以在审批被解析时作出响应。

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

回调 payload 字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求的已解析绑定
- `request`：原始请求摘要、detach 提示、发送方 id 和对话元数据

此回调仅用于通知。它不会更改谁可以绑定对话，并且会在核心审批处理完成后运行。

## 提供商运行时钩子

提供商插件有三层：

- 用于低成本预运行时查找的 **manifest 元数据**：
  `setup.providers[].envVars`、已弃用的兼容性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时钩子**：`catalog`（旧版 `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，涵盖身份验证、模型解析、流包装、thinking 级别、重放策略和使用量端点。完整列表见 [钩子顺序和用法](#hook-order-and-usage)。

OpenClaw 仍然拥有通用 Agent loop、故障转移、transcript 处理和工具策略。这些钩子是提供商特定行为的扩展界面，无需完整的自定义推理传输。

当提供商有基于环境的凭证，并且通用身份验证/Status/模型选择器路径应在不加载插件运行时的情况下看到它们时，请使用 manifest `setup.providers[].envVars`。已弃用的 `providerAuthEnvVars` 在弃用窗口期间仍会由兼容性适配器读取，使用它的非内置插件会收到 manifest 诊断。当一个提供商 id 应复用另一个提供商 id 的环境变量、auth profiles、配置支持的身份验证以及 API-key 新手引导选项时，请使用 manifest `providerAuthAliases`。当 onboarding/auth-choice CLI 界面应在不加载提供商运行时的情况下了解提供商的选项 id、分组标签以及简单的单标志身份验证接线时，请使用 manifest `providerAuthChoices`。将提供商运行时 `envVars` 保留给面向操作者的提示，例如新手引导标签或 OAuth client-id/client-secret 设置变量。

当渠道有环境驱动的身份验证或设置，并且通用 shell-env 回退、配置/Status 检查或设置提示应在不加载渠道运行时的情况下看到它们时，请使用 manifest `channelEnvVars`。

### 钩子顺序和用法

对于模型/提供商插件，OpenClaw 会按以下大致顺序调用钩子。
“When to use” 列是快速决策指南。

| #   | 钩子                              | 作用                                                                                                   | 使用时机                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 期间将提供商配置发布到 `models.providers`                                | 提供商拥有目录或基础 URL 默认值                                                                                                  |
| 2   | `applyConfigDefaults`             | 在配置物化期间应用由提供商拥有的全局配置默认值                                      | 默认值取决于凭证模式、环境或提供商模型系列语义                                                                         |
| --  | _(内置模型查找)_         | OpenClaw 会先尝试正常的注册表/目录路径                                                          | _(不是插件钩子)_                                                                                                                         |
| 3   | `normalizeModelId`                | 在查找前规范化旧版或预览版模型 ID 别名                                                     | 提供商在规范模型解析前负责别名清理                                                                                 |
| 4   | `normalizeTransport`              | 在通用模型组装前规范化提供商系列的 `api` / `baseUrl`                                      | 提供商负责同一传输系列中自定义提供商 ID 的传输清理                                                          |
| 5   | `normalizeConfig`                 | 在运行时/提供商解析前规范化 `models.providers.<id>`                                           | 提供商需要与插件同处的配置清理；内置 Google 系列辅助逻辑也会兜底支持的 Google 配置条目   |
| 6   | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式用量兼容性重写                                               | 提供商需要由端点驱动的原生流式用量元数据修复                                                                          |
| 7   | `resolveConfigApiKey`             | 在加载运行时凭证前解析配置提供商的环境标记凭证                                       | 提供商拥有由提供商负责的环境标记 API 密钥解析；`amazon-bedrock` 在这里也有内置 AWS 环境标记解析器                  |
| 8   | `resolveSyntheticAuth`            | 暴露本地/自托管或配置支持的凭证，而不持久化明文                                   | 提供商可以使用合成/本地凭据标记                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 覆盖由提供商拥有的外部凭证配置文件；对于 CLI/应用拥有的凭据，默认 `persistence` 是 `runtime-only` | 提供商复用外部凭证凭据，而不持久化复制的刷新令牌；在清单中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符排在环境/配置支持的凭证之后                                      | 提供商存储不应优先胜出的合成占位符配置文件                                                                 |
| 11  | `resolveDynamicModel`             | 为尚未进入本地注册表的提供商自有模型 ID 提供同步回退                                       | 提供商接受任意上游模型 ID                                                                                                 |
| 12  | `prepareDynamicModel`             | 异步预热，然后再次运行 `resolveDynamicModel`                                                           | 提供商在解析未知 ID 前需要网络元数据                                                                                  |
| 13  | `normalizeResolvedModel`          | 在嵌入式运行器使用已解析模型前进行最终重写                                               | 提供商需要传输重写，但仍使用核心传输                                                                             |
| 14  | `contributeResolvedModelCompat`   | 为位于另一种兼容传输后的供应商模型贡献兼容标志                                  | 提供商能识别代理传输上的自身模型，而无需接管该提供商                                                       |
| 15  | `capabilities`                    | 由提供商拥有、供共享核心逻辑使用的转录/工具元数据                                           | 提供商需要转录/提供商系列特殊处理                                                                                              |
| 16  | `normalizeToolSchemas`            | 在嵌入式运行器看到工具 schema 前对其进行规范化                                                    | 提供商需要传输系列 schema 清理                                                                                                |
| 17  | `inspectToolSchemas`              | 在规范化后暴露由提供商拥有的 schema 诊断信息                                                  | 提供商需要关键字警告，而不把提供商特定规则教给核心                                                                 |
| 18  | `resolveReasoningOutputMode`      | 选择原生或带标签的推理输出契约                                                              | 提供商需要带标签的推理/最终输出，而不是原生字段                                                                         |
| 19  | `prepareExtraParams`              | 在通用流选项包装器前进行请求参数规范化                                              | 提供商需要默认请求参数或按提供商清理参数                                                                           |
| 20  | `createStreamFn`                  | 用自定义传输完全替换正常流路径                                                   | 提供商需要自定义线路协议，而不仅是包装器                                                                                     |
| 21  | `wrapStreamFn`                    | 应用通用包装器后的流包装器                                                              | 提供商需要请求头/请求体/模型兼容包装器，而不是自定义传输                                                          |
| 22  | `resolveTransportTurnState`       | 附加原生的每轮传输请求头或元数据                                                           | 提供商希望通用传输发送提供商原生的轮次标识                                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 请求头或会话冷却策略                                                    | 提供商希望通用 WS 传输调整会话请求头或回退策略                                                               |
| 24  | `formatApiKey`                    | 凭证配置文件格式化器：已存储的配置文件会变成运行时 `apiKey` 字符串                                     | 提供商存储额外凭证元数据，并需要自定义运行时令牌形态                                                                    |
| 25  | `refreshOAuth`                    | 用于自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖                                  | 提供商不适配共享的 `pi-ai` 刷新器                                                                                           |
| 26  | `buildAuthDoctorHint`             | OAuth 刷新失败时追加的修复提示                                                                  | 提供商需要在刷新失败后提供由提供商拥有的凭证修复指导                                                                      |
| 27  | `matchesContextOverflowError`     | 由提供商拥有的上下文窗口溢出匹配器                                                                 | 提供商存在通用启发式规则会漏掉的原始溢出错误                                                                                |
| 28  | `classifyFailoverReason`          | 由提供商拥有的故障转移原因分类                                                                  | 提供商可以将原始 API/传输错误映射为速率限制/过载等                                                                          |
| 29  | `isCacheTtlEligible`              | 代理/回传提供商的提示缓存策略                                                               | 提供商需要代理特定的缓存 TTL 门控                                                                                                |
| 30  | `buildMissingAuthMessage`         | 替换通用缺失凭证恢复消息                                                      | 提供商需要提供商特定的缺失凭证恢复提示                                                                                 |
| 31  | `suppressBuiltInModel`            | 已弃用。运行时钩子不再调用；请使用清单 `modelCatalog.suppressions`                         | 用于隐藏陈旧上游行的历史钩子；将新的抑制数据保留在插件清单中                                              |
| 32  | `augmentModelCatalog`             | 在设备发现后追加的合成/最终目录行                                                          | 提供商需要 `models list` 和选择器中的合成前向兼容行                                                                     |
| 33  | `resolveThinkingProfile`          | 特定模型的 `/think` 级别集、显示标签和默认值                                                 | 提供商为选定模型暴露自定义思考层级或二元标签                                                                 |
| 34  | `isBinaryThinking`                | 开/关推理切换兼容性钩子                                                                     | 提供商只暴露二元思考开关                                                                                                  |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性钩子                                                                   | 提供商只想在一部分模型上启用 `xhigh`                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性钩子                                                                      | 提供商拥有某个模型系列的默认 `/think` 策略                                                                                      |
| 37  | `isModernModelRef`                | 用于实时配置文件过滤器和冒烟选择的现代模型匹配器                                              | 提供商负责实时/冒烟首选模型匹配                                                                                             |
| 38  | `prepareRuntimeAuth`              | 在推理前，将已配置凭证交换为实际的运行时令牌/密钥                       | 提供商需要令牌交换或短期请求凭证                                                                             |
| 39  | `resolveUsageAuth`                | 为 `/usage` 和相关 Status 界面解析用量/计费凭证                                     | 提供商需要自定义用量/配额令牌解析，或不同的用量凭证                                                               |
| 40  | `fetchUsageSnapshot`              | 在认证解析完成后，获取并规范化提供商特定的用量/配额快照                             | 提供商需要提供商特定的用量端点或载荷解析器                                                                           |
| 41  | `createEmbeddingProvider`         | 构建提供商拥有的嵌入适配器，用于记忆/搜索                                                     | 记忆嵌入行为归属提供商插件                                                                                    |
| 42  | `buildReplayPolicy`               | 返回控制提供商会话记录处理的重放策略                                        | 提供商需要自定义会话记录策略（例如剥离 thinking 块）                                                               |
| 43  | `sanitizeReplayHistory`           | 在通用会话记录清理后重写重放历史                                                        | 提供商需要超出共享压缩助手范围的提供商特定重放重写                                                             |
| 44  | `validateReplayTurns`             | 在嵌入式运行器之前进行最终的重放轮次验证或重塑                                           | 提供商传输协议在通用清理后需要更严格的轮次验证                                                                    |
| 45  | `onModelSelected`                 | 运行提供商拥有的选择后副作用                                                                 | 当某个模型变为活动状态时，提供商需要遥测或提供商拥有的状态                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配的提供商插件，然后继续遍历其他支持钩子的提供商插件，直到某个插件实际更改模型 ID 或传输协议/配置。这样可以让别名/兼容提供商 shim 继续工作，而无需调用方知道哪个内置插件负责该重写。如果没有提供商钩子重写受支持的 Google 系列配置项，内置的 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那属于另一类扩展。这些钩子适用于仍在 OpenClaw 正常推理循环上运行的提供商行为。

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

内置提供商插件会组合上面的钩子，以适配各厂商的目录、认证、思考、重放和用量需求。权威钩子集合与每个插件一起位于 `extensions/` 下；本页展示的是形态，而不是镜像完整列表。

<AccordionGroup>
  <Accordion title="直通目录提供商">
    OpenRouter、Kilocode、Z.AI、xAI 会注册 `catalog` 加上
    `resolveDynamicModel` / `prepareDynamicModel`，这样它们就能在 OpenClaw 的静态目录之前暴露上游
    模型 ID。
  </Accordion>
  <Accordion title="OAuth 和用量端点提供商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、小米、z.ai 会将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配对，用于拥有令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理系列">
    共享的命名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）允许提供商通过
    `buildReplayPolicy` 选择加入转录策略，而不是让每个插件重新实现清理。
  </Accordion>
  <Accordion title="仅目录提供商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只注册 `catalog`，并使用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 专用流式辅助函数">
    Beta 标头、`/fast` / `serviceTier` 和 `context1m` 位于
    Anthropic 插件的公共 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是通用
    SDK 中。
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

注意：

- `textToSpeech` 会返回用于文件/语音备注界面的正常核心 TTS 输出载荷。
- 使用核心 `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为提供商重新采样/编码。
- `listVoices` 对每个提供商都是可选的。将其用于厂商拥有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如语言区域、性别和个性标签，以供感知提供商的选择器使用。
- OpenAI 和 ElevenLabs 目前支持电话语音。Microsoft 不支持。

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

注意：

- 将 TTS 策略、回退和回复递送保留在核心中。
- 使用语音提供商处理厂商拥有的合成行为。
- 旧版 Microsoft `edge` 输入会规范化为 `microsoft` 提供商 ID。
- 首选所有权模型是面向公司的：随着 OpenClaw 添加这些能力契约，一个厂商插件可以拥有文本、语音、图像和未来媒体提供商。

对于图像/音频/视频理解，插件注册一个带类型的媒体理解提供商，而不是通用键/值包：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注意：

- 将编排、回退、配置和渠道接线保留在核心中。
- 将厂商行为保留在提供商插件中。
- 增量扩展应保持有类型：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已经遵循相同模式：
  - 核心拥有能力契约和运行时辅助函数
  - 厂商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件使用 `api.runtime.videoGeneration.*`

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

对于音频转录，插件可以使用媒体理解运行时或旧版 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享界面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当未生成转录输出时（例如跳过/不支持的输入），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍作为兼容性别名保留。

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

注意：

- `provider` 和 `model` 是每次运行的可选覆盖项，不是持久会话变更。
- OpenClaw 只为受信任的调用方遵循这些覆盖字段。
- 对于插件拥有的回退运行，操作员必须使用 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择加入。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制到特定规范 `provider/model` 目标，或使用 `"*"` 显式允许任意目标。
- 不受信任的插件子智能体运行仍可工作，但覆盖请求会被拒绝，而不是静默回退。
- 插件创建的子智能体会话会标记创建它的插件 ID。回退 `api.runtime.subagent.deleteSession(...)` 只能删除这些归属会话；任意会话删除仍需要具备管理员作用域的 Gateway 网关请求。

对于 Web 搜索，插件可以使用共享运行时辅助函数，而不是进入智能体工具接线：

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

注意：

- 将提供商选择、凭据解析和共享请求语义保留在核心中。
- 使用 Web 搜索提供商处理厂商专用搜索传输。
- `api.runtime.webSearch.*` 是需要搜索行为但不依赖智能体工具包装器的功能/渠道插件的首选共享界面。

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

插件可以使用 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

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
- `auth`：必填。使用 `"gateway"` 要求正常 Gateway 网关认证，或使用 `"plugin"` 进行插件管理的认证/webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一个插件替换它自己已有的路由注册。
- `handler`：当路由已处理请求时返回 `true`。

注意：

- `api.registerHttpHandler(...)` 已移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。请仅在同一认证级别上保留 `exact`/`prefix` 回退链。
- `auth: "plugin"` 路由**不会**自动获得操作员运行时作用域。它们用于插件管理的 webhook/签名验证，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由在 Gateway 网关请求运行时作用域内运行，但该作用域有意保持保守：
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 可信且携带身份的 HTTP 模式（例如私有入口上的 `trusted-proxy` 或 `gateway.auth.mode = "none"`）仅在显式存在该请求头时才会遵循 `x-openclaw-scopes`
  - 如果这些携带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实用规则：不要假定一个使用 Gateway 网关认证的插件路由就是隐式管理员界面。如果你的路由需要仅管理员可用的行为，请要求一种携带身份的认证模式，并记录显式的 `x-openclaw-scopes` 请求头约定。

## 插件 SDK 导入路径

编写新插件时，请使用较窄的 SDK 子路径，而不是整体式的 `openclaw/plugin-sdk` 根 barrel。核心子路径：

| 子路径                             | 用途                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语                     |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口/构建辅助工具                        |
| `openclaw/plugin-sdk/core`          | 通用共享辅助工具和总括合约       |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

渠道插件从一组较窄的接缝中选择，包括 `channel-setup`、`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、`channel-targets` 和 `channel-actions`。审批行为应统一到一个 `approvalCapability` 合约上，而不是混用不相关的插件字段。参见[渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于匹配且聚焦的 `*-runtime` 子路径下（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、`channel-activity-runtime` 等）。请优先使用 `config-types`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，而不是宽泛的 `config-runtime` 兼容 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/config-runtime` 和 `openclaw/plugin-sdk/infra-runtime` 是面向旧插件的已弃用兼容垫片。新代码应改为导入更窄的通用原语。
</Info>

仓库内部入口点（按内置插件包根目录）：

- `index.js` — 内置插件入口
- `api.js` — 辅助工具/类型 barrel
- `runtime-api.js` — 仅运行时 barrel
- `setup-entry.js` — 设置插件入口

外部插件应只导入 `openclaw/plugin-sdk/*` 子路径。绝不要从核心或另一个插件导入另一个插件包的 `src/*`。通过门面加载的入口点会优先使用有效的运行时配置快照（如果存在），然后回退到磁盘上已解析的配置文件。

诸如 `image-generation`、`media-understanding` 和 `speech` 这类特定能力子路径存在，是因为内置插件目前正在使用它们。它们并不会自动成为长期冻结的外部合约；依赖它们时请查看相关 SDK 参考页。

## 消息工具 schema

插件应拥有针对非消息原语（例如回应、已读和投票）的渠道特定 `describeMessageTool(...)` schema 贡献。共享发送呈现应使用通用 `MessagePresentation` 合约，而不是提供商原生的按钮、组件、块或卡片字段。有关合约、回退规则、提供商映射和插件作者清单，请参见[消息呈现](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明它们可以渲染的内容：

- `presentation` 用于语义呈现块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用于置顶递送请求

核心决定是以原生方式渲染该呈现，还是将其降级为文本。不要从通用消息工具暴露提供商原生 UI 逃生口。面向旧版原生 schema 的已弃用 SDK 辅助工具仍会为现有第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。保持共享出站宿主的通用性，并使用消息适配器界面处理提供商规则：

- `messaging.inferTargetChatType({ to })` 会在目录查找前决定规范化目标应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 会告诉核心某个输入是否应跳过目录搜索，直接进入类似 ID 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是插件回退路径，用于核心在规范化之后或目录未命中之后需要最终由提供商拥有的解析时。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后，负责提供商特定的会话路由构造。

推荐拆分：

- 对于应在搜索对等方/群组之前发生的类别决策，使用 `inferTargetChatType`。
- 对于“将此视为显式/原生目标 ID”的检查，使用 `looksLikeId`。
- 使用 `resolveTarget` 作为提供商特定的规范化回退，而不是用于宽泛的目录搜索。
- 将聊天 ID、话题 ID、JID、句柄和房间 ID 等提供商原生 ID 保留在 `target` 值或提供商特定参数中，不要放入通用 SDK 字段。

## 配置支持的目录

从配置派生目录条目的插件应将该逻辑保留在插件中，并复用 `openclaw/plugin-sdk/directory-runtime` 中的共享辅助工具。

当某个渠道需要配置支持的对等方/群组时，请使用这种方式，例如：

- 由允许列表驱动的私信对等方
- 已配置的渠道/群组映射
- 账号作用域的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制应用
- 去重/规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账号检查和 ID 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以使用 `registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回的形状与 OpenClaw 写入 `models.providers` 的形状相同：

- `{ provider }` 用于一个提供商条目
- `{ providers }` 用于多个提供商条目

当插件拥有提供商特定的模型 ID、基础 URL 默认值或受认证保护的模型元数据时，请使用 `catalog`。

`catalog.order` 控制某个插件的目录相对于 OpenClaw 内置隐式提供商合并的时机：

- `simple`：普通 API key 或环境变量驱动的提供商
- `profile`：存在认证配置文件时出现的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

发生键冲突时，后面的提供商胜出，因此插件可以有意用相同的提供商 ID 覆盖内置提供商条目。

兼容性：

- `discovery` 仍可作为旧版别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先在 `resolveAccount(...)` 旁实现 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭据已完全物化，并且在缺少必需密钥时快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`，以及 Doctor/配置修复流程，不应仅为描述配置就需要物化运行时凭据。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性账号状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭据来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（以及匹配的来源字段）就足以支持状态类命令。
- 当凭据通过 SecretRef 配置，但在当前命令路径中不可用时，使用 `configured_unavailable`。

这样只读命令就可以报告“已配置，但在此命令路径中不可用”，而不是崩溃或误报账号未配置。

## 包集合

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

每个条目都会成为一个插件。如果包列出了多个插件，插件 ID 会变为 `name/<fileBase>`。

如果你的插件导入 npm 依赖，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须留在插件目录内。逃出包目录的条目会被拒绝。

安全说明：`openclaw plugins install` 使用项目本地的 `npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本，运行时无开发依赖），并忽略继承的全局 npm 安装设置。保持插件依赖树“纯 JS/TS”，并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量的仅设置模块。当 OpenClaw 需要为已禁用的渠道插件提供设置界面，或某个渠道插件已启用但仍未配置时，它会加载 `setupEntry`，而不是完整插件入口。这样在你的主插件入口还会接入工具、钩子或其他仅运行时代码时，启动和设置会更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可以让渠道插件在 Gateway 网关的监听前启动阶段选择使用同一个 `setupEntry` 路径，即使该渠道已经配置完成。

仅当 `setupEntry` 完全覆盖 Gateway 网关开始监听前必须存在的启动界面时，才使用此项。实践中，这意味着设置入口必须注册启动所依赖的每个渠道自有能力，例如：

- 渠道注册本身
- Gateway 网关开始监听前必须可用的任何 HTTP 路由
- 在同一时间窗口内必须存在的任何 Gateway 网关方法、工具或服务

如果你的完整入口仍拥有任何必需的启动能力，请不要启用此标志。保持插件的默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道也可以发布仅设置的合约界面辅助工具，供核心在完整渠道运行时加载前查询。当前的设置提升界面为：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当 core 需要在不加载完整插件入口的情况下，将旧版单账号渠道配置提升到 `channels.<id>.accounts.*` 时，会使用这个表面。Matrix 是当前内置示例：当命名账号已经存在时，它只会把身份验证/启动键移动到命名提升账号中，并且可以保留已配置的非规范默认账号键，而不是总是创建 `accounts.default`。

这些设置补丁适配器会让内置契约表面发现保持惰性。导入时间保持轻量；提升表面只会在首次使用时加载，而不是在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们放在插件专用前缀下。Core 管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并且始终解析为 `operator.admin`，即使某个插件请求了更窄的范围。

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

渠道插件可以通过 `openclaw.channel` 声明设置/设备发现元数据，并通过 `openclaw.install` 声明安装提示。这会让 core 目录不包含数据。

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

除了最小示例之外，实用的 `openclaw.channel` 字段：

- `detailLabel`：用于更丰富的目录/Status 表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：此目录条目应优先于的较低优先级插件/渠道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面的文案控制
- `markdownCapable`：将渠道标记为支持 Markdown，用于出站格式化决策
- `exposure.configured`：设置为 `false` 时，从已配置渠道列表表面隐藏该渠道
- `exposure.setup`：设置为 `false` 时，从交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：将渠道标记为文档导航表面的内部/私有渠道
- `showConfigured` / `showInSetup`：为兼容性仍接受的旧版别名；优先使用 `exposure`
- `quickstartAllowFrom`：让渠道加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账号，也要求显式账号绑定
- `preferSessionLookupForAnnounceTarget`：解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。将 JSON 文件放在以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器还接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

生成的渠道目录条目和提供商安装目录条目会在原始 `openclaw.install` 块旁边公开规范化的安装来源事实。规范化事实会标识 npm spec 是精确版本还是浮动选择器、预期完整性元数据是否存在，以及本地来源路径是否也可用。当目录/包身份已知时，如果解析出的 npm 包名与该身份发生偏移，规范化事实会发出警告。它们还会在 `defaultChoice` 无效或指向不可用来源时发出警告，并在存在 npm 完整性元数据但没有有效 npm 来源时发出警告。消费者应将 `installSource` 视为一个附加的可选字段，这样手写条目和目录垫片就无需合成它。这让新手引导和诊断可以解释来源平面状态，而无需导入插件运行时。

官方外部 npm 条目应优先使用精确的 `npmSpec` 加 `expectedIntegrity`。裸包名和 dist-tag 仍然可用于兼容性，但它们会显示来源平面警告，以便目录可以逐步转向固定且经过完整性检查的安装，而不破坏现有插件。当新手引导从本地目录路径安装时，它会记录一个托管插件索引条目，其中包含 `source: "path"`，并在可能时包含相对于工作区的 `sourcePath`。绝对操作加载路径仍保留在 `plugins.load.paths` 中；安装记录避免将本地工作站路径重复写入长期配置。这让本地开发安装对来源平面诊断保持可见，同时不会增加第二个原始文件系统路径披露表面。持久化的 `plugins/installs.json` 插件索引是安装来源的事实来源，并且可以在不加载插件运行时模块的情况下刷新。即使插件清单缺失或无效，其 `installRecords` 映射也会持久保留；其 `plugins` 数组是可重建的清单/缓存视图。

## 上下文引擎插件

上下文引擎插件负责会话上下文的摄取、组装和压缩编排。使用 `api.registerContextEngine(id, factory)` 从你的插件注册它们，然后用 `plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文管线，而不只是添加记忆搜索或钩子时，请使用此方式。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

工厂 `ctx` 会公开可选的 `config`、`agentDir` 和 `workspaceDir` 值，用于构造时初始化。

如果你的引擎**不**拥有压缩算法，请保留 `compact()` 实现并显式委托它：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
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

当插件需要当前 API 无法容纳的行为时，不要通过私有深入访问绕过插件系统。请添加缺失的能力。

推荐顺序：

1. 定义 core 契约
   决定 core 应拥有哪些共享行为：策略、回退、配置合并、生命周期、面向渠道的语义，以及运行时辅助程序形状。
2. 添加类型化插件注册/运行时表面
   使用最小可用的类型化能力表面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 连接 core + 渠道/功能消费者
   渠道和功能插件应通过 core 使用新能力，而不是直接导入某个厂商实现。
4. 注册厂商实现
   然后由厂商插件针对该能力注册自己的后端。
5. 添加契约覆盖
   添加测试，确保所有权和注册形状随时间保持明确。

这就是 OpenClaw 保持有主见而不硬编码到某个提供商世界观中的方式。请参阅[能力扩展手册](/zh-CN/plugins/architecture)，了解具体的文件检查清单和完整示例。

### 能力检查清单

添加新能力时，通常应让实现同时触及这些表面：

- `src/<capability>/types.ts` 中的 core 契约类型
- `src/<capability>/runtime.ts` 中的 core runner/运行时辅助程序
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道插件需要使用它时，`src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助程序
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中的操作员/插件文档

如果其中某个表面缺失，通常表明该能力尚未完全集成。

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

这会让规则保持简单：

- core 拥有能力契约 + 编排
- 厂商插件拥有厂商实现
- 功能/渠道插件使用运行时辅助程序
- 契约测试让所有权保持明确

## 相关

- [插件架构](/zh-CN/plugins/architecture) — 公共能力模型和形状
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
