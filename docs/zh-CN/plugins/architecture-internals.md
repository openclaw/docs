---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或软件包打包 bundles
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载流水线、注册表、运行时钩子、HTTP 路由和参考表格
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-28T01:41:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a32b52a2a817596d39a0281d4eeeb3820c8cecc1e7d2d93ab280fd967228bc3
    source_path: plugins/architecture-internals.md
    workflow: 15
---

关于公开的能力模型、插件形态以及所有权/执行契约，请参阅 [插件架构](/zh-CN/plugins/architecture)。本页是内部机制的参考：加载流水线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和模式表。

## 加载流水线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 清单以及软件包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 `jiti`
7. 调用原生 `register(api)` 钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令/运行时表面

<Note>
`activate` 是 `register` 的旧别名——加载器会解析存在的那个（`def.register ?? def.activate`），并在相同位置调用。所有内置插件都使用 `register`；新插件优先使用 `register`。
</Note>

安全门槛发生在运行时执行**之前**。当入口逃逸出插件根目录、路径对所有用户可写，或者对于非内置插件路径所有权看起来可疑时，候选项会被阻止。

### 清单优先行为

清单是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现声明的渠道/Skills/配置模式或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据
- 在不加载插件运行时的情况下，保留轻量激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如钩子、工具、命令或 provider 流程。

可选的清单 `activation` 和 `setup` 块仍保留在控制平面上。它们只是用于激活规划和设置发现的纯元数据描述符；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活使用方现在会使用清单中的命令、渠道和 provider 提示，在更广泛的注册表实体化之前缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置/插件解析会缩小到拥有所请求渠道 id 的插件
- 显式 provider 设置/运行时解析会缩小到拥有所请求 provider id 的插件

激活规划器同时暴露面向现有调用方的仅 id API，以及面向新诊断场景的 plan API。Plan 条目会报告为何选择某个插件，并将显式 `activation.*` 规划器提示与清单所有权回退区分开来，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子。这个原因拆分就是兼容性边界：现有插件元数据会继续工作，而新代码可以在不改变运行时加载语义的情况下检测宽泛提示或回退行为。

设置发现现在会优先使用描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，以便在回退到 `setup-api` 之前先缩小候选插件范围；后者用于仍然需要设置期运行时钩子的插件。Provider 设置列表会使用清单中的 `providerAuthChoices`、从描述符派生的设置选项以及安装目录元数据，而无需加载 provider 运行时。显式 `setup.requiresRuntime: false` 是仅描述符层面的截断；省略 `requiresRuntime` 则会保留旧版 `setup-api` 回退以保证兼容性。如果多个已发现插件声称拥有同一个规范化后的设置 provider 或 CLI backend id，设置查找会拒绝这个歧义所有者，而不是依赖发现顺序。当设置运行时确实执行时，注册表诊断会报告 `setup.providers` / `setup.cliBackends` 与由 `setup-api` 注册的 providers 或 CLI backends 之间的漂移，但不会阻止旧版插件。

### 加载器会缓存什么

OpenClaw 会在进程内保留短期缓存，用于：

- 发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存可减少突发启动和重复命令的开销。可以把它们视为短生命周期的性能缓存，而不是持久化存储。

Gateway 网关启动热路径应优先使用当前的 `PluginMetadataSnapshot`、派生的 `PluginLookUpTable`，或沿调用链显式传递的清单注册表。配置验证、启动自动启用和插件引导在可用时也会使用同一个快照。对于仍然从持久化已安装插件索引重建清单元数据的调用方，OpenClaw 还保留了一个小型有界回退缓存；它以已安装索引、请求形态、配置策略、运行时根目录以及清单/软件包文件签名为键。该缓存仅用于重复的已安装索引重建回退；它不是可变的运行时插件注册表。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 设置 `OPENCLAW_DISABLE_INSTALLED_PLUGIN_MANIFEST_REGISTRY_CACHE=1` 可仅禁用已安装索引的清单注册表回退缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改任意核心全局状态。它们会注册到一个中心化的插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、源头、状态、诊断）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- providers
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

然后，核心功能会从该注册表中读取，而不是直接与插件模块交互。这样可以保持单向加载：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对于可维护性很重要。它意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在审批结果确定时作出响应。

使用 `api.onConversationBindingResolved(...)` 可在绑定请求被批准或拒绝后接收回调：

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

      // 请求被拒绝；清除任何本地待处理状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：用于已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 以及会话元数据

这个回调仅用于通知。它不会改变谁被允许绑定会话，并且它会在核心审批处理完成后运行。

## Provider 运行时钩子

Provider 插件有三层：

- **清单元数据**，用于轻量的运行时前查找：
  `setup.providers[].envVars`、已弃用的兼容项 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置期钩子**：`catalog`（旧称 `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，覆盖认证、模型解析、
  流包装、思考级别、重放策略和用量端点。完整列表见
  [钩子顺序和用法](#hook-order-and-usage)。

OpenClaw 仍然拥有通用的 Agent loop、故障转移、转录处理和工具策略。这些钩子是 provider 特定行为的扩展表面，因此无需整个自定义推理传输层。

当 provider 具有基于环境变量的凭证，并且通用认证/状态/模型选择器路径需要在不加载插件运行时的情况下看到这些凭证时，请使用清单 `setup.providers[].envVars`。已弃用的 `providerAuthEnvVars` 在弃用窗口期间仍会由兼容适配器读取，并且使用它的非内置插件会收到一条清单诊断。当一个 provider id 应复用另一个 provider id 的环境变量、auth profiles、配置支持的认证以及 API 密钥新手引导选项时，请使用清单 `providerAuthAliases`。当新手引导/认证选项 CLI 表面需要在不加载 provider 运行时的情况下了解 provider 的选项 id、分组标签和简单的单 flag 认证接线时，请使用清单 `providerAuthChoices`。将 provider 运行时
`envVars` 保留用于面向运维者的提示，例如新手引导标签或 OAuth
client-id/client-secret 设置变量。

当渠道具有由环境变量驱动的认证或设置，并且通用 shell 环境变量回退、配置/状态检查或设置提示需要在不加载渠道运行时的情况下看到它们时，请使用清单 `channelEnvVars`。

### 钩子顺序和用法

对于模型/provider 插件，OpenClaw 大致按以下顺序调用钩子。
“何时使用”列是快速决策指南。

| #   | 钩子 | 作用 | 何时使用 |
| --- | --- | --- | --- |
| 1   | `catalog` | 在生成 `models.json` 期间，将 provider 配置发布到 `models.providers` 中 | provider 拥有目录或 base URL 默认值 |
| 2   | `applyConfigDefaults` | 在配置实体化期间，应用 provider 拥有的全局配置默认值 | 默认值取决于认证模式、环境变量或 provider 模型家族语义 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试常规注册表/目录路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId` | 在查找之前规范化旧版或预览版 model-id 别名 | provider 在规范模型解析前拥有别名清理逻辑 |
| 4   | `normalizeTransport` | 在通用模型组装前，规范化 provider 家族的 `api` / `baseUrl` | provider 在同一传输家族中为自定义 provider id 拥有传输清理逻辑 |
| 5   | `normalizeConfig` | 在运行时/provider 解析之前，规范化 `models.providers.<id>` | provider 需要应与插件一起存在的配置清理逻辑；内置的 Google 家族辅助逻辑也会为受支持的 Google 配置条目提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 对配置 providers 应用原生流式用量兼容性重写 | provider 需要由端点驱动的原生流式用量元数据修正 |
| 7   | `resolveConfigApiKey` | 在加载运行时认证之前，为配置 providers 解析环境变量标记认证 | provider 具有 provider 自有的环境变量标记 API 密钥解析逻辑；`amazon-bedrock` 在此也具有内置的 AWS 环境变量标记解析器 |
| 8   | `resolveSyntheticAuth` | 在不持久化明文的情况下，暴露本地/自托管或配置支持的认证 | provider 可使用合成/本地凭证标记运行 |
| 9   | `resolveExternalAuthProfiles` | 叠加 provider 自有的外部认证 profiles；CLI/应用自有凭证的默认 `persistence` 为 `runtime-only` | provider 复用外部认证凭证，而不持久化复制的刷新令牌；请在清单中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成 profile 占位符优先级降低到环境变量/配置支持认证之后 | provider 存储了不应获得更高优先级的合成占位 profile |
| 11  | `resolveDynamicModel` | 为本地注册表中尚不存在的 provider 自有模型 id 提供同步回退 | provider 接受任意上游模型 id |
| 12  | `prepareDynamicModel` | 先进行异步预热，然后再次运行 `resolveDynamicModel` | provider 在解析未知 id 之前需要网络元数据 |
| 13  | `normalizeResolvedModel` | 在嵌入式运行器使用已解析模型之前做最终重写 | provider 需要传输重写，但仍使用核心传输 |
| 14  | `contributeResolvedModelCompat` | 为位于另一兼容传输之后的供应商模型提供兼容标志 | provider 能在代理传输上识别自己的模型，而无需接管该 provider |
| 15  | `capabilities` | 由共享核心逻辑使用的 provider 自有转录/工具元数据 | provider 需要转录/provider 家族特性处理 |
| 16  | `normalizeToolSchemas` | 在嵌入式运行器看到工具模式之前对其进行规范化 | provider 需要传输家族级的模式清理 |
| 17  | `inspectToolSchemas` | 在规范化后暴露 provider 自有的模式诊断 | provider 希望提供关键字警告，而无需让核心了解 provider 特定规则 |
| 18  | `resolveReasoningOutputMode` | 选择原生或带标签的 reasoning-output 契约 | provider 需要带标签的 reasoning/final output，而不是原生字段 |
| 19  | `prepareExtraParams` | 在通用流选项包装器之前进行请求参数规范化 | provider 需要默认请求参数或按 provider 进行参数清理 |
| 20  | `createStreamFn` | 使用自定义传输完全替换常规流路径 | provider 需要自定义线路协议，而不仅仅是包装器 |
| 21  | `wrapStreamFn` | 在应用通用包装器后对流函数再做包装 | provider 需要请求头/请求体/模型兼容包装，而不是自定义传输 |
| 22  | `resolveTransportTurnState` | 附加原生的逐轮传输请求头或元数据 | provider 希望通用传输发送 provider 原生轮次标识 |
| 23  | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 请求头或会话冷却策略 | provider 希望通用 WS 传输调整会话请求头或回退策略 |
| 24  | `formatApiKey` | auth profile 格式化器：将已存储 profile 转为运行时 `apiKey` 字符串 | provider 存储额外认证元数据，并需要自定义运行时令牌形态 |
| 25  | `refreshOAuth` | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑 | provider 不适配共享的 `pi-ai` 刷新器 |
| 26  | `buildAuthDoctorHint` | 当 OAuth 刷新失败时附加修复提示 | provider 在刷新失败后需要 provider 自有的认证修复指引 |
| 27  | `matchesContextOverflowError` | provider 自有的上下文窗口溢出匹配器 | provider 存在通用启发式无法识别的原始溢出错误 |
| 28  | `classifyFailoverReason` | provider 自有的故障转移原因分类 | provider 可将原始 API/传输错误映射为速率限制、过载等 |
| 29  | `isCacheTtlEligible` | 面向代理/回程 providers 的提示缓存策略 | provider 需要代理特定的缓存 TTL 门控 |
| 30  | `buildMissingAuthMessage` | 替换通用的缺失认证恢复消息 | provider 需要 provider 特定的缺失认证恢复提示 |
| 31  | `suppressBuiltInModel` | 已弃用。运行时钩子不再调用；请改用清单 `modelCatalog.suppressions` | 这是用于隐藏过时上游条目的历史钩子；新的抑制数据应保留在插件清单中 |
| 32  | `augmentModelCatalog` | 在发现之后追加合成/最终目录条目 | provider 需要在 `models list` 和选择器中提供合成的前向兼容条目 |
| 33  | `resolveThinkingProfile` | 设置特定模型的 `/think` 级别、显示标签和默认值 | provider 为选定模型提供自定义思考阶梯或二元标签 |
| 34  | `isBinaryThinking` | 开/关式推理切换兼容钩子 | provider 仅暴露二元的思考开/关 |
| 35  | `supportsXHighThinking` | `xhigh` 推理支持兼容钩子 | provider 希望仅在部分模型上启用 `xhigh` |
| 36  | `resolveDefaultThinkingLevel` | 默认 `/think` 级别兼容钩子 | provider 为某个模型家族拥有默认 `/think` 策略 |
| 37  | `isModernModelRef` | 用于实时 profile 过滤和冒烟选择的现代模型匹配器 | provider 拥有实时/冒烟优选模型匹配逻辑 |
| 38  | `prepareRuntimeAuth` | 在推理前将已配置凭证交换为实际运行时令牌/密钥 | provider 需要令牌交换或短生命周期请求凭证 |
| 39  | `resolveUsageAuth` | 为 `/usage` 和相关状态表面解析用量/计费凭证 | provider 需要自定义的用量/配额令牌解析，或使用不同的用量凭证 |
| 40  | `fetchUsageSnapshot` | 在认证解析后获取并规范化 provider 特定的用量/配额快照 | provider 需要 provider 特定的用量端点或负载解析器 |
| 41  | `createEmbeddingProvider` | 为记忆/搜索构建 provider 自有的嵌入适配器 | 记忆嵌入行为应归属于 provider 插件 |
| 42  | `buildReplayPolicy` | 返回一个控制 provider 转录处理的重放策略 | provider 需要自定义转录策略（例如去除 thinking 块） |
| 43  | `sanitizeReplayHistory` | 在通用转录清理后重写重放历史 | provider 需要超出共享压缩辅助逻辑之外的 provider 特定重放重写 |
| 44  | `validateReplayTurns` | 在嵌入式运行器之前，对重放轮次进行最终验证或重塑 | provider 传输在通用净化之后需要更严格的轮次验证 |
| 45  | `onModelSelected` | 运行 provider 自有的选择后副作用 | 当某个模型变为活动状态时，provider 需要遥测或 provider 自有状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的 provider 插件，然后继续尝试其他具备相应钩子能力的 provider 插件，直到某个插件实际更改了模型 id 或传输/配置。这样可以让别名/兼容 provider shim 正常工作，而不要求调用方知道是哪个内置插件拥有该重写逻辑。如果没有 provider 钩子重写某个受支持的 Google 家族配置条目，内置的 Google 配置规范化器仍会应用该兼容性清理。

如果 provider 需要完全自定义的线路协议或自定义请求执行器，那就是另一类扩展。这些钩子适用于仍在 OpenClaw 常规推理循环上运行的 provider 行为。

### Provider 示例

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

内置 provider 插件会组合使用上述钩子，以适配各个供应商的目录、认证、思考、重放和用量需求。权威钩子集合与各插件一起存放在 `extensions/` 下；本页仅说明其形态，而不是镜像完整列表。

<AccordionGroup>
  <Accordion title="直通式目录 providers">
    OpenRouter、Kilocode、Z.AI、xAI 会注册 `catalog` 以及
    `resolveDynamicModel` / `prepareDynamicModel`，这样它们就可以在
    OpenClaw 的静态目录之前暴露上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和用量端点 providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 会将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配合使用，以接管令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放与转录清理家族">
    共享的命名家族（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）允许 providers 通过
    `buildReplayPolicy` 选择转录策略，而不是让每个插件各自重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录 providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 仅注册 `catalog`，并复用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 专用流辅助逻辑">
    Beta 请求头、`/fast` / `serviceTier` 以及 `context1m` 位于
    Anthropic 插件公开的 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是位于
    通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助方法

插件可以通过 `api.runtime` 访问选定的核心辅助方法。以 TTS 为例：

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

- `textToSpeech` 会返回适用于文件/语音便笺表面的常规核心 TTS 输出负载。
- 使用核心 `messages.tts` 配置和 provider 选择逻辑。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为各 provider 重新采样/编码。
- `listVoices` 对每个 provider 而言都是可选的。可将其用于供应商自有的语音选择器或设置流程。
- 语音列表可包含更丰富的元数据，例如区域设置、性别和 personality 标签，以支持 provider 感知的选择器。
- 目前 OpenAI 和 ElevenLabs 支持电话语音。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册语音 providers。

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
- 将 speech providers 用于供应商自有的合成行为。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 首选的所有权模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个供应商插件可以统一拥有文本、语音、图像以及未来的媒体 providers。

对于图像/音频/视频理解，插件会注册一个类型化的媒体理解 provider，而不是通用的键值包：

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
- 将供应商行为保留在 provider 插件中。
- 增量扩展应保持类型化：新增可选方法、新增可选结果字段、新增可选能力。
- 视频生成已经遵循同样的模式：
  - 核心拥有能力契约和运行时辅助方法
  - 供应商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件消费 `api.runtime.videoGeneration.*`

对于媒体理解运行时辅助方法，插件可以调用：

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
- 使用核心媒体理解音频配置（`tools.media.audio`）和 provider 回退顺序。
- 当未产生转录输出时返回 `{ text: undefined }`（例如输入被跳过/不受支持）。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留为兼容性别名。

插件还可以通过 `api.runtime.subagent` 启动后台 subagent 运行：

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

- `provider` 和 `model` 是每次运行的可选覆盖项，不是持久性的会话更改。
- OpenClaw 只会为受信任的调用方接受这些覆盖字段。
- 对于插件自有的回退运行，运维者必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制为特定的规范 `provider/model` 目标，或设置为 `"*"` 以显式允许任意目标。
- 不受信任插件的 subagent 运行仍可工作，但覆盖请求会被拒绝，而不会静默回退。
- 由插件创建的 subagent 会话会带上创建插件 id 的标签。回退 `api.runtime.subagent.deleteSession(...)` 只能删除这些自有会话；删除任意会话仍需要具有管理员作用域的 Gateway 网关请求。

对于 Web 搜索，插件可以消费共享运行时辅助方法，而不是深入到智能体工具接线中：

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
`api.registerWebSearchProvider(...)` 注册 Web 搜索 providers。

说明：

- 将 provider 选择、凭证解析和共享请求语义保留在核心中。
- 将 Web 搜索 providers 用于供应商特定的搜索传输。
- `api.runtime.webSearch.*` 是功能/渠道插件的首选共享表面，适用于需要搜索能力但不依赖智能体工具包装器的场景。

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

- `generate(...)`：使用已配置的图像生成 provider 链生成图像。
- `listProviders(...)`：列出可用的图像生成 providers 及其能力。

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
- `auth`：必填。使用 `"gateway"` 以要求常规 Gateway 网关认证，或使用 `"plugin"` 以启用插件管理的认证/Webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一个插件替换自己现有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，而且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。仅在相同认证级别内保留 `exact`/`prefix` 的贯穿链。
- `auth: "plugin"` 路由**不会**自动获得运维者运行时作用域。它们用于插件管理的 Webhook/签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域是有意保守的：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由的运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任的带身份 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在请求头显式存在时才会接受 `x-openclaw-scopes`
  - 如果这些带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实用规则：不要假设经 Gateway 网关认证的插件路由天然就是隐式管理员表面。如果你的路由需要仅管理员可用的行为，请要求使用带身份的认证模式，并记录显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写新插件时，请使用较窄的 SDK 子路径，而不是单体式的 `openclaw/plugin-sdk` 根 barrel。核心子路径如下：

| 子路径 | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语 |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口/构建辅助方法 |
| `openclaw/plugin-sdk/core`          | 通用共享辅助方法和 umbrella 契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 模式（`OpenClawSchema`） |

渠道插件可从一组窄接缝中选择——`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。审批行为应收敛到单一的
`approvalCapability` 契约，而不是混杂在无关的插件字段之间。
参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助方法位于对应的聚焦 `*-runtime` 子路径下
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

仓库内部入口点（按每个内置插件软件包根目录划分）：

- `index.js` —— 内置插件入口
- `api.js` —— 辅助方法/类型 barrel
- `runtime-api.js` —— 仅运行时 barrel
- `setup-entry.js` —— 设置插件入口

外部插件应只导入 `openclaw/plugin-sdk/*` 子路径。绝不要从核心或其他插件中导入另一个插件包的 `src/*`。由 facade 加载的入口点会在存在时优先使用当前活动的运行时配置快照，然后回退到磁盘上的已解析配置文件。

像 `image-generation`、`media-understanding` 和 `speech` 这样的能力专用子路径之所以存在，是因为内置插件目前正在使用它们。它们并不自动构成长期冻结的外部契约——在依赖这些路径时，请查看相关的 SDK 参考页面。

## 消息工具模式

对于表情反应、已读和投票等非消息原语，插件应拥有特定于渠道的 `describeMessageTool(...)` 模式贡献。共享发送呈现应使用通用的 `MessagePresentation` 契约，而不是 provider 原生的按钮、组件、块或卡片字段。
关于契约、回退规则、provider 映射和插件作者检查清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件会通过消息能力声明它们能渲染的内容：

- `presentation`：用于语义化呈现块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`：用于固定投递请求

核心决定是原生渲染该呈现，还是将其降级为文本。不要从通用消息工具中暴露 provider 原生 UI 逃生口。面向旧版原生模式的已弃用 SDK 辅助方法仍为现有第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有特定于渠道的目标语义。保持共享出站宿主的通用性，并使用消息适配器表面处理 provider 规则：

- `messaging.inferTargetChatType({ to })` 决定规范化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心某个输入是否应直接跳到类似 id 的解析，而不是目录搜索
- `messaging.targetResolver.resolveTarget(...)` 是插件的回退路径，用于核心在规范化之后或目录未命中之后需要最终的 provider 自有解析时使用
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后负责构建 provider 特定的会话路由

推荐划分：

- 对于应在搜索 peers/groups 之前发生的分类决策，使用 `inferTargetChatType`
- 对于“将其视为显式/原生目标 id”的判断，使用 `looksLikeId`
- 将 `resolveTarget` 用于 provider 特定的规范化回退，而不是广泛的目录搜索
- 将 chat id、thread id、JID、handle 和 room id 这类 provider 原生 id 保留在 `target` 值或 provider 特定参数中，而不是放在通用 SDK 字段里

## 配置支持的目录

从配置派生目录条目的插件应将该逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助方法。

当渠道需要配置支持的 peers/groups 时，请使用此方式，例如：

- 由 allowlist 驱动的私信 peers
- 已配置的渠道/群组映射
- 按账户作用域提供的静态目录回退

`directory-runtime` 中的共享辅助方法只处理通用操作：

- 查询过滤
- 限制应用
- 去重/规范化辅助方法
- 构建 `ChannelDirectoryEntry[]`

特定于渠道的账户检查和 id 规范化应保留在插件实现中。

## Provider 目录

Provider 插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入 `models.providers` 相同的形态：

- `{ provider }`：一个 provider 条目
- `{ providers }`：多个 provider 条目

当插件拥有 provider 特定的模型 id、base URL 默认值或受认证控制的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式 providers 的合并时机：

- `simple`：普通 API 密钥或环境变量驱动的 providers
- `profile`：存在 auth profiles 时出现的 providers
- `paired`：会合成多个相关 provider 条目的 providers
- `late`：最后一轮，在其他隐式 providers 之后

后合并的 provider 会在键冲突时胜出，因此插件可以有意用相同的 provider id 覆盖一个内置 provider 条目。

兼容性：

- `discovery` 仍可作为旧别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，优先实现
`plugin.config.inspectAccount(cfg, accountId)`，并同时保留 `resolveAccount(...)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假设凭证已完全实体化，并且在缺少必需密钥时快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor/配置修复流程，不应为了描述配置而必须实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你无需为了报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（以及匹配的来源字段）就足以支持状态类命令。
- 当凭证通过 SecretRef 配置但在当前命令路径中不可用时，使用 `configured_unavailable`。

这样，只读命令就能报告“已配置，但在此命令路径中不可用”，而不是崩溃或错误地将该账户报告为未配置。

## 软件包打包 bundles

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

每个条目都会成为一个插件。如果该打包列出多个扩展，插件 id 会变为 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保持在插件目录内部。任何逃逸出软件包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用项目本地的 `npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本、运行时无开发依赖），并忽略继承的全局 npm 安装设置。请保持插件依赖树为“纯 JS/TS”，并避免依赖需要 `postinstall` 构建的软件包。

可选项：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。当 OpenClaw 需要为已禁用的渠道插件提供设置表面，或者某个渠道插件已启用但仍未配置时，它会加载 `setupEntry`，而不是完整的插件入口。这样当你的主插件入口还会接入工具、钩子或其他仅运行时代码时，就能让启动和设置更轻量。

可选项：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让渠道插件在 Gateway 网关的监听前启动阶段也进入相同的 `setupEntry`
路径，即使该渠道已经完成配置。

仅当 `setupEntry` 完全覆盖 Gateway 网关开始监听之前必须存在的启动表面时，才应使用此项。实际上，这意味着设置入口必须注册启动所依赖的每一项渠道自有能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听前可用的 HTTP 路由
- 任何必须在同一时间窗口内存在的 Gateway 网关方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用此标志。保持插件使用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅设置的契约表面辅助方法，以便核心在完整渠道运行时加载前进行查询。当前的设置提升表面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧版单账户渠道配置提升到 `channels.<id>.accounts.*` 时，会使用该表面。Matrix 是当前的内置示例：当已存在命名账户时，它只会将认证/bootstrap 键移动到一个已命名的提升账户中，并且可以保留一个已配置但非规范的默认账户键，而不是总是创建 `accounts.default`。

这些 setup patch 适配器让内置契约表面发现保持惰性。导入时保持轻量；该提升表面只会在首次使用时加载，而不会在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在插件特定前缀下。核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍是保留项，并始终解析为 `operator.admin`，即使某个插件请求了更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 声明设置/发现元数据，并通过 `openclaw.install` 声明安装提示。这样可以让核心目录保持无数据。

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

除最小示例外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富目录/状态表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：此目录条目应优先于其显示的低优先级插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面文案控制
- `markdownCapable`：将该渠道标记为支持 Markdown，以用于出站格式化决策
- `exposure.configured`：设置为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设置为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部/私有，以用于文档导航表面
- `showConfigured` / `showInSetup`：仍接受的旧版兼容别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使仅存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

生成的渠道目录条目和 provider 安装目录条目会在原始 `openclaw.install` 块旁暴露规范化后的安装源事实。这些规范化事实会标识 npm spec 是否为精确版本还是浮动选择器、是否存在预期完整性元数据，以及本地源路径是否也可用。当目录/软件包身份已知时，如果解析出的 npm 软件包名称与该身份不一致，这些规范化事实会发出警告。它们还会在 `defaultChoice` 无效、指向不可用源，或存在 npm 完整性元数据但没有有效 npm 源时发出警告。使用方应将 `installSource` 视为附加的可选字段，这样手工构建的条目和目录 shim 就不必合成它。
这样一来，新手引导和诊断就可以在不导入插件运行时的情况下解释源平面状态。

官方外部 npm 条目应优先使用精确的 `npmSpec` 加 `expectedIntegrity`。裸软件包名称和 dist-tag 仍可出于兼容性继续使用，但它们会暴露源平面警告，以便目录逐步转向锁定版本且带完整性校验的安装方式，而不会破坏现有插件。当新手引导从本地目录路径安装时，它会记录一个托管插件索引条目，带有 `source: "path"`，并在可能时记录相对于工作区的 `sourcePath`。绝对操作加载路径仍保留在 `plugins.load.paths` 中；安装记录会避免将本地工作站路径重复写入长期配置。这使得本地开发安装对源平面诊断可见，同时不会增加第二个原始文件系统路径泄露表面。持久化的 `plugins/installs.json` 插件索引是安装源的事实来源，并且可以在不加载插件运行时模块的情况下刷新。其 `installRecords` 映射即使在插件清单缺失或无效时也能持久保留；其 `plugins` 数组则是可重建的清单/缓存视图。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排能力，包括摄取、组装和压缩。通过
`api.registerContextEngine(id, factory)` 从你的插件中注册它们，然后使用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不仅仅是添加记忆搜索或钩子时，请使用此方式。

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

如果你的引擎**并不**拥有压缩算法，请保持 `compact()` 已实现，并显式委托它：

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

当插件需要当前 API 无法适配的行为时，不要通过私有深入访问来绕过插件系统。应添加缺失的能力。

推荐顺序：

1. 定义核心契约  
   决定哪些共享行为应由核心拥有：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助方法形态。
2. 添加类型化的插件注册/运行时表面  
   用最小且有用的类型化能力表面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 接入核心 + 渠道/功能使用方  
   渠道和功能插件应通过核心消费新能力，
   而不是直接导入某个供应商实现。
4. 注册供应商实现  
   然后由供应商插件将其后端注册到该能力上。
5. 添加契约覆盖  
   添加测试，以便随着时间推移，所有权和注册形态仍保持明确。

这正是 OpenClaw 在保持明确主张的同时，不会被硬编码为某个 provider 世界观的方式。有关具体文件清单和完整示例，请参阅 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加一个新能力时，实现通常应同时涉及以下表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器/运行时辅助方法
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道插件需要消费它时，放在 `src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助方法
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中面向运维者/插件的文档

如果这些表面中有某个缺失，通常说明该能力尚未完全集成。

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

// 面向功能/渠道插件的共享运行时辅助方法
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
- 功能/渠道插件消费运行时辅助方法
- 契约测试让所有权保持明确

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) —— 公开的能力模型和形态
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
