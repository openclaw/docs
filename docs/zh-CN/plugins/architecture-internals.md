---
read_when:
    - 实现 provider 运行时钩子、渠道生命周期或包打包
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载流水线、注册表、运行时钩子、HTTP 路由和参考表格
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-27T12:53:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c491e72f14cd0cb5673343dd8374e7377f245ac6f0ca94eee954540fd0d7de6
    source_path: plugins/architecture-internals.md
    workflow: 15
---

关于公开的能力模型、插件形状以及归属 / 执行契约，请参见 [Plugin architecture](/zh-CN/plugins/architecture)。本页是内部机制的参考：加载流水线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和 schema 表格。

## 加载流水线

启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 的 manifest 和 package 元数据
3. 拒绝不安全的候选项
4. 标准化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选项是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 jiti
7. 调用原生 `register(api)` 钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令 / 运行时表面

<Note>
`activate` 是 `register` 的旧别名——加载器会解析存在的那个（`def.register ?? def.activate`），并在相同位置调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门控发生在**运行时执行之前**。当入口逃离插件根目录、路径可被所有用户写入，或对于非内置插件而言路径归属看起来可疑时，候选项会被阻止。

### manifest 优先行为

manifest 是控制平面的事实来源。OpenClaw 用它来：

- 标识插件
- 发现声明的渠道 / Skills / 配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签 / 占位符
- 显示安装 / 目录元数据
- 在不加载插件运行时的情况下保留轻量级激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如钩子、工具、命令或 provider 流程。

可选的 manifest `activation` 和 `setup` 块仍停留在控制平面。它们只是用于激活规划和设置发现的纯元数据描述符；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。首批真实激活使用方现在会利用 manifest 中的命令、渠道和 provider 提示，在更广泛的注册表物化之前缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置 / 插件解析会缩小到拥有所请求渠道 id 的插件
- 显式的 provider 设置 / 运行时解析会缩小到拥有所请求 provider id 的插件

激活规划器既暴露一个供现有调用方使用的仅 id API，也暴露一个供新诊断使用的计划 API。计划条目会报告插件为何被选中，并将显式 `activation.*` 规划器提示与 manifest 所有权回退区分开来，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子。这种原因拆分就是兼容性边界：现有插件元数据保持可用，而新代码可以检测宽泛提示或回退行为，而无需改变运行时加载语义。

设置发现现在会优先使用描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，以便在回退到 `setup-api` 之前先缩小候选插件范围；`setup-api` 仅用于仍需要设置阶段运行时钩子的插件。provider 设置列表会使用 manifest `providerAuthChoices`、从描述符导出的设置选项，以及安装目录元数据，而无需加载 provider 运行时。显式 `setup.requiresRuntime: false` 是一个仅描述符层面的截止点；省略 `requiresRuntime` 则会为兼容性保留旧版 `setup-api` 回退。如果发现多个插件声明了相同的标准化设置 provider 或 CLI 后端 id，设置查找会拒绝这个有歧义的归属者，而不是依赖发现顺序。当设置运行时确实执行时，注册表诊断会报告 `setup.providers` / `setup.cliBackends` 与通过 setup-api 注册的 provider 或 CLI 后端之间的漂移，但不会阻止旧版插件。

### 加载器缓存的内容

OpenClaw 会保留一些短生命周期的进程内缓存，用于：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可减少突发启动开销和重复命令开销。可以将它们视为短期的性能缓存，而不是持久化存储。

Gateway 网关热路径应优先使用当前 `PluginLookUpTable`，或通过调用链显式传递的 manifest 注册表。对于那些仍会从持久化的已安装插件索引重建 manifest 元数据的调用方，OpenClaw 还会保留一个小型有界回退缓存，其键包括已安装索引、请求形状、配置策略、运行时根目录以及 manifest / package 文件签名。该缓存只是重复进行已安装索引重建时的回退手段；它不是一个可变的运行时插件注册表。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 设置 `OPENCLAW_DISABLE_INSTALLED_PLUGIN_MANIFEST_REGISTRY_CACHE=1` 可仅禁用已安装索引 manifest 注册表回退缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改各种随机的 core 全局状态。它们会注册到一个中央插件注册表中。

注册表会跟踪：

- 插件记录（身份、来源、起源、状态、诊断）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- provider
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

然后 core 功能会从该注册表读取，而不是直接与插件模块交互。这样可以保持单向加载：

- 插件模块 -> 注册表注册
- core 运行时 -> 注册表消费

这种分离对于可维护性很重要。这意味着大多数 core 表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在审批结果确定后作出响应。

使用 `api.onConversationBindingResolved(...)` 可在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 此插件 + 会话现在已有一个绑定。
        console.log(event.binding?.conversationId);
        return;
      }

      // 该请求被拒绝；清理任何本地待处理状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调载荷字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求的已解析绑定
- `request`：原始请求摘要、detach 提示、发送方 id 和会话元数据

该回调仅用于通知。它不会改变谁被允许绑定会话，并且会在 core 审批处理完成后运行。

## provider 运行时钩子

provider 插件有三层：

- **manifest 元数据**，用于低成本的运行前查找：
  `setup.providers[].envVars`、已弃用的兼容字段 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时钩子**：`catalog`（旧称 `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，涵盖鉴权、模型解析、
  流包装、思考等级、重放策略和 usage 端点。完整列表见
  [Hook order and usage](#hook-order-and-usage)。

OpenClaw 仍然负责通用的 Agent loop、故障切换、转录处理和工具策略。这些钩子是在无需实现整套自定义推理传输层的情况下，扩展 provider 特定行为的表面。

当 provider 具有基于环境变量的凭证，并且需要让通用鉴权 / Status / 模型选择器路径在不加载 provider 运行时的情况下也能看到这些信息时，请使用 manifest `setup.providers[].envVars`。在弃用窗口内，已弃用的 `providerAuthEnvVars` 仍会被兼容适配器读取，而使用它的非内置插件会收到 manifest 诊断。当某个 provider id 需要复用另一个 provider id 的环境变量、auth profile、基于配置的鉴权以及 API key 新手引导选项时，请使用 manifest `providerAuthAliases`。当新手引导 / 鉴权选项 CLI 表面需要在不加载 provider 运行时的情况下知道该 provider 的选项 id、分组标签和简单的单标志鉴权接线时，请使用 manifest `providerAuthChoices`。请将 provider 运行时 `envVars` 保留给面向操作者的提示，例如新手引导标签或 OAuth client-id / client-secret 设置变量。

当某个渠道具有由环境变量驱动的鉴权或设置，并且需要让通用 shell 环境变量回退、配置 / 状态检查或设置提示在不加载渠道运行时的情况下也能看到这些信息时，请使用 manifest `channelEnvVars`。

### 钩子顺序与使用方式

对于模型 / provider 插件，OpenClaw 大致按以下顺序调用钩子。
“何时使用”这一列是快速决策指南。

| #   | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog` | 在生成 `models.json` 时将 provider 配置发布到 `models.providers` 中 | provider 拥有目录或 `baseUrl` 默认值 |
| 2   | `applyConfigDefaults` | 在配置物化期间应用 provider 拥有的全局配置默认值 | 默认值依赖于鉴权模式、环境变量或 provider 模型族语义 |
| --  | _(内置模型查找)_ | OpenClaw 会先尝试常规注册表 / 目录路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId` | 在查找前标准化旧版或预览版模型 id 别名 | provider 在规范模型解析前拥有别名清理逻辑 |
| 4   | `normalizeTransport` | 在通用模型组装前标准化 provider 族的 `api` / `baseUrl` | provider 在同一传输族内为自定义 provider id 提供传输清理逻辑 |
| 5   | `normalizeConfig` | 在运行时 / provider 解析前标准化 `models.providers.<id>` | provider 需要将配置清理逻辑放在插件内；内置的 Google 族辅助逻辑也会为受支持的 Google 配置条目提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 对配置 provider 应用原生流式 usage 兼容性重写 | provider 需要基于端点的原生流式 usage 元数据修复 |
| 7   | `resolveConfigApiKey` | 在运行时鉴权加载前，为配置 provider 解析环境标记鉴权 | provider 具有由 provider 自身拥有的环境标记 API key 解析逻辑；`amazon-bedrock` 在这里也有一个内置 AWS 环境标记解析器 |
| 8   | `resolveSyntheticAuth` | 在不持久化明文的情况下暴露本地 / 自托管或基于配置的鉴权 | provider 可以使用合成 / 本地凭证标记运行 |
| 9   | `resolveExternalAuthProfiles` | 覆盖 provider 拥有的外部 auth profile；对于 CLI / 应用拥有的凭证，默认 `persistence` 为 `runtime-only` | provider 复用外部鉴权凭证，而不持久化复制的刷新令牌；请在 manifest 中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成 profile 占位符优先级降到环境变量 / 配置支持的鉴权之后 | provider 存储的合成占位 profile 不应获得更高优先级 |
| 11  | `resolveDynamicModel` | 对本地注册表中尚不存在的 provider 拥有模型 id 执行同步回退解析 | provider 接受任意上游模型 id |
| 12  | `prepareDynamicModel` | 先执行异步预热，然后再次运行 `resolveDynamicModel` | provider 在解析未知 id 前需要网络元数据 |
| 13  | `normalizeResolvedModel` | 在嵌入式 runner 使用已解析模型前做最终重写 | provider 需要传输重写，但仍使用 core 传输 |
| 14  | `contributeResolvedModelCompat` | 为位于另一种兼容传输之后的厂商模型提供兼容标记 | provider 能在不接管 provider 本身的情况下识别代理传输中的自家模型 |
| 15  | `capabilities` | 由共享 core 逻辑使用的 provider 自有转录 / 工具元数据 | provider 需要处理转录 / provider 族怪癖 |
| 16  | `normalizeToolSchemas` | 在嵌入式 runner 看到工具 schema 之前对其进行标准化 | provider 需要传输族 schema 清理 |
| 17  | `inspectToolSchemas` | 在标准化之后暴露 provider 自有的 schema 诊断 | provider 想提供关键字警告，而不需要让 core 学习 provider 特定规则 |
| 18  | `resolveReasoningOutputMode` | 选择原生还是带标签的推理输出契约 | provider 需要使用带标签的推理 / 最终输出，而不是原生字段 |
| 19  | `prepareExtraParams` | 在通用流选项包装器之前做请求参数标准化 | provider 需要默认请求参数或每 provider 参数清理 |
| 20  | `createStreamFn` | 使用自定义传输完全替换常规流路径 | provider 需要自定义线协议，而不仅仅是包装器 |
| 21  | `wrapStreamFn` | 在应用通用包装器后再包装流函数 | provider 需要请求头 / 请求体 / 模型兼容包装器，但不需要自定义传输 |
| 22  | `resolveTransportTurnState` | 附加原生的每轮传输请求头或元数据 | provider 希望通用传输发送 provider 原生的轮次身份信息 |
| 23  | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 请求头或会话冷却策略 | provider 希望通用 WS 传输调整会话请求头或回退策略 |
| 24  | `formatApiKey` | auth profile 格式化器：已存储 profile 会变成运行时 `apiKey` 字符串 | provider 存储额外的鉴权元数据，并需要自定义的运行时令牌形状 |
| 25  | `refreshOAuth` | 针对自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖 | provider 不适配共享的 `pi-ai` 刷新器 |
| 26  | `buildAuthDoctorHint` | 当 OAuth 刷新失败时追加的修复提示 | provider 需要在刷新失败后提供 provider 自有的鉴权修复指引 |
| 27  | `matchesContextOverflowError` | provider 自有的上下文窗口溢出错误匹配器 | provider 存在通用启发式无法捕获的原始溢出错误 |
| 28  | `classifyFailoverReason` | provider 自有的故障切换原因分类 | provider 可以将原始 API / 传输错误映射为限流 / 过载等 |
| 29  | `isCacheTtlEligible` | 面向代理 / 回传 provider 的提示缓存策略 | provider 需要代理特定的缓存 TTL 门控 |
| 30  | `buildMissingAuthMessage` | 替代通用的缺失鉴权恢复消息 | provider 需要 provider 特定的缺失鉴权恢复提示 |
| 31  | `suppressBuiltInModel` | 过时上游模型抑制，并可选提供面向用户的错误提示 | provider 需要隐藏过时的上游条目，或用厂商提示替换它们 |
| 32  | `augmentModelCatalog` | 在发现之后附加合成 / 最终目录条目 | provider 需要在 `models list` 和选择器中提供合成的前向兼容条目 |
| 33  | `resolveThinkingProfile` | 特定模型的 `/think` 级别集合、显示标签和默认值 | provider 为选定模型暴露自定义思考阶梯或二元标签 |
| 34  | `isBinaryThinking` | 开 / 关推理切换兼容性钩子 | provider 只暴露二元的思考开 / 关 |
| 35  | `supportsXHighThinking` | `xhigh` 推理支持兼容性钩子 | provider 希望仅在部分模型上提供 `xhigh` |
| 36  | `resolveDefaultThinkingLevel` | 默认 `/think` 级别兼容性钩子 | provider 为某个模型族拥有默认 `/think` 策略 |
| 37  | `isModernModelRef` | 用于实时 profile 过滤和 smoke 选择的现代模型匹配器 | provider 拥有实时 / smoke 首选模型匹配逻辑 |
| 38  | `prepareRuntimeAuth` | 在推理前将已配置凭证交换为实际运行时令牌 / key | provider 需要令牌交换或短生命周期请求凭证 |
| 39  | `resolveUsageAuth` | 为 `/usage` 及相关 Status 表面解析 usage / 计费凭证 | provider 需要自定义 usage / 配额令牌解析，或使用不同的 usage 凭证 |
| 40  | `fetchUsageSnapshot` | 在鉴权解析后抓取并标准化 provider 特定的 usage / 配额快照 | provider 需要 provider 特定的 usage 端点或载荷解析器 |
| 41  | `createEmbeddingProvider` | 为内存 / 搜索构建 provider 拥有的 embedding 适配器 | Memory embedding 行为应归属于 provider 插件 |
| 42  | `buildReplayPolicy` | 返回一个重放策略，用于控制该 provider 的转录处理 | provider 需要自定义转录策略（例如移除 thinking 块） |
| 43  | `sanitizeReplayHistory` | 在通用转录清理之后重写重放历史 | provider 需要超出共享压缩辅助之外的 provider 特定重放重写 |
| 44  | `validateReplayTurns` | 在嵌入式 runner 之前对重放轮次做最终校验或重塑 | provider 传输在通用清理之后需要更严格的轮次校验 |
| 45  | `onModelSelected` | 在模型被选中后运行 provider 拥有的副作用 | provider 在模型变为活动状态时需要遥测或 provider 拥有的状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的 provider 插件，然后继续回退到其他具备对应钩子能力的 provider 插件，直到某个插件实际更改了模型 id 或传输 / 配置。这样可以让别名 / 兼容 provider shim 正常工作，而不要求调用方知道哪个内置插件拥有该重写逻辑。如果没有任何 provider 钩子重写某个受支持的 Google 族配置条目，内置的 Google 配置标准化器仍会执行该兼容性清理。

如果 provider 需要完全自定义的线协议或自定义请求执行器，那属于另一类扩展。这些钩子适用于仍运行在 OpenClaw 常规推理循环上的 provider 行为。

### provider 示例

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

内置 provider 插件会组合使用上述钩子，以适配各厂商在目录、鉴权、思考、重放和 usage 方面的需求。权威钩子集合位于 `extensions/` 下各插件自身；本页只说明其形状，而不是镜像那份列表。

<AccordionGroup>
  <Accordion title="透传目录 provider">
    OpenRouter、Kilocode、Z.AI、xAI 会注册 `catalog`，以及
    `resolveDynamicModel` / `prepareDynamicModel`，这样它们就可以在
    OpenClaw 静态目录之前暴露上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和 usage 端点 provider">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配对使用，以自行处理令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理族">
    共享的命名族（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）允许 provider 通过
    `buildReplayPolicy` 选择加入转录策略，而不必让每个插件都重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录 provider">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只注册 `catalog`，并复用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 专用流辅助">
    Beta 请求头、`/fast` / `serviceTier` 和 `context1m` 位于
    Anthropic 插件公开的 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），
    而不在通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助

插件可以通过 `api.runtime` 访问部分选定的 core 辅助。对于 TTS：

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

- `textToSpeech` 返回适用于文件 / 语音消息表面的常规 core TTS 输出载荷。
- 使用 core `messages.tts` 配置和 provider 选择逻辑。
- 返回 PCM 音频缓冲区和采样率。插件必须为 provider 自行重采样 / 编码。
- `listVoices` 对每个 provider 来说是可选的。将其用于厂商自有语音选择器或设置流程。
- 语音列表可包含更丰富的元数据，例如区域设置、性别和个性标签，供 provider 感知的选择器使用。
- 目前支持电话语音的是 OpenAI 和 ElevenLabs。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册语音 provider。

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
- 语音 provider 用于厂商自有的语音合成行为。
- 旧版 Microsoft `edge` 输入会被标准化为 `microsoft` provider id。
- 推荐的归属模型是面向公司的：随着 OpenClaw 增加这些能力契约，一个厂商插件可以同时拥有文本、语音、图像以及未来的媒体 provider。

对于图像 / 音频 / 视频理解，插件会注册一个类型化的媒体理解 provider，而不是通用的键 / 值包：

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
- 将厂商行为保留在 provider 插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已经遵循同样的模式：
  - core 拥有能力契约和运行时辅助
  - 厂商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能 / 渠道插件消费 `api.runtime.videoGeneration.*`

对于媒体理解运行时辅助，插件可以调用：

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

对于音频转录，插件可以使用媒体理解运行时，或使用较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // 当 MIME 无法可靠推断时可选：
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像 / 音频 / 视频理解的首选共享表面。
- 使用 core 媒体理解音频配置（`tools.media.audio`）和 provider 回退顺序。
- 当没有产生转录输出时返回 `{ text: undefined }`（例如输入被跳过 / 不受支持）。
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
- OpenClaw 只会为可信调用方接受这些覆盖字段。
- 对于插件拥有的回退运行，操作者必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将可信插件限制为特定的规范 `provider/model` 目标，或设置为 `"*"` 明确允许任意目标。
- 不可信插件的子智能体运行仍可工作，但覆盖请求会被拒绝，而不是静默回退。
- 由插件创建的子智能体会话会带上创建插件 id 的标记。回退 `api.runtime.subagent.deleteSession(...)` 只能删除这些归属会话；任意会话删除仍需要管理员作用域的 Gateway 网关请求。

对于 web 搜索，插件可以消费共享运行时辅助，而不是深入到智能体工具接线内部：

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
`api.registerWebSearchProvider(...)` 注册 web 搜索 provider。

说明：

- 将 provider 选择、凭证解析和共享请求语义保留在 core 中。
- web 搜索 provider 用于厂商特定的搜索传输。
- `api.runtime.webSearch.*` 是功能 / 渠道插件的首选共享表面，适用于那些需要搜索行为但又不想依赖智能体工具包装器的场景。

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
- `listProviders(...)`：列出可用的图像生成 provider 及其能力。

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
- `auth`：必填。使用 `"gateway"` 表示要求普通 Gateway 网关鉴权，或使用 `"plugin"` 表示由插件管理鉴权 / webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换它自己已存在的路由注册。
- `handler`：当路由处理了该请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 不同 `auth` 级别的重叠路由会被拒绝。仅在相同鉴权级别下保留 `exact` / `prefix` 的贯穿链。
- `auth: "plugin"` 路由**不会**自动获得操作者运行时作用域。它们用于由插件管理的 webhook / 签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域有意保持保守：
  - 共享密钥 bearer 鉴权（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 带受信身份的 HTTP 模式（例如 `trusted-proxy`，或私有入口上的 `gateway.auth.mode = "none"`）只有在显式存在该请求头时，才会遵循 `x-openclaw-scopes`
  - 如果这些带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实用规则：不要假设一个使用 gateway 鉴权的插件路由天然就是隐式管理员入口。如果你的路由需要仅管理员可用的行为，请要求使用带身份的鉴权模式，并记录显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写新插件时，请使用细粒度的 SDK 子路径，而不是单体式的 `openclaw/plugin-sdk` 根 barrel。core 子路径如下：

| 子路径 | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | 插件注册原语 |
| `openclaw/plugin-sdk/channel-core` | 渠道入口 / 构建辅助 |
| `openclaw/plugin-sdk/core` | 通用共享辅助和总契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

渠道插件可从一系列细粒度接缝中选择——`channel-setup`、`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、`channel-targets` 和 `channel-actions`。审批行为应统一归并到一个 `approvalCapability` 契约上，而不是分散在不相关的插件字段之间。参见 [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助位于对应的 `*-runtime` 子路径下
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用——它只是对旧插件的兼容 shim。新代码应改为导入更细粒度的通用原语。
</Info>

仓库内部入口点（按每个内置插件包根目录划分）：

- `index.js` —— 内置插件入口
- `api.js` —— 辅助 / 类型 barrel
- `runtime-api.js` —— 仅运行时 barrel
- `setup-entry.js` —— 设置插件入口

外部插件只能导入 `openclaw/plugin-sdk/*` 子路径。绝不要从 core 或另一个插件中导入其他插件包的 `src/*`。通过 facade 加载的入口点会优先使用当前活动的运行时配置快照；如果不存在，则回退到磁盘上已解析的配置文件。

像 `image-generation`、`media-understanding` 和 `speech` 这样的能力专用子路径之所以存在，是因为内置插件当前正在使用它们。它们并不自动构成长期冻结的外部契约——依赖它们时，请查看相应的 SDK 参考页面。

## 消息工具 schema

对于反应、已读、投票这类非消息原语，插件应拥有渠道特定的 `describeMessageTool(...)` schema 扩展。共享的发送呈现应使用通用 `MessagePresentation` 契约，而不是 provider 原生的 button、component、block 或 card 字段。有关该契约、回退规则、provider 映射以及插件作者检查清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明它们能渲染什么：

- `presentation`：用于语义化呈现块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`：用于固定投递请求

由 core 决定是原生渲染该呈现，还是降级为文本。不要从通用消息工具中暴露 provider 原生 UI 逃逸口。用于旧版原生 schema 的已弃用 SDK 辅助仍会为现有第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有渠道特定的目标语义。请保持共享出站宿主的通用性，并使用消息适配器表面来承载 provider 规则：

- `messaging.inferTargetChatType({ to })` 决定标准化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉 core 某个输入是否应跳过目录搜索，直接进入类似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是当 core 在标准化后或目录未命中后需要最终由 provider 拥有的解析时，插件侧的回退入口。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后负责构建 provider 特定的会话路由。

推荐拆分方式：

- 使用 `inferTargetChatType` 处理那些应在搜索联系人 / 群组之前进行的类别判断。
- 使用 `looksLikeId` 处理“将此视为显式 / 原生目标 id”的判断。
- 使用 `resolveTarget` 作为 provider 特定的标准化回退，而不是用于广泛的目录搜索。
- 将 chat id、thread id、JID、handle 和 room id 这类 provider 原生 id 保留在 `target` 值或 provider 特定参数中，而不是放进通用 SDK 字段。

## 基于配置的目录

如果插件是从配置推导目录条目，请将该逻辑保留在插件内部，并复用
`openclaw/plugin-sdk/directory-runtime` 中的共享辅助。

当某个渠道需要基于配置的联系人 / 群组时，可使用这一方式，例如：

- 基于 allowlist 的私信联系人
- 已配置的渠道 / 群组映射
- 按账号作用域划分的静态目录回退

`directory-runtime` 中的共享辅助只处理通用操作：

- 查询过滤
- 限制数量应用
- 去重 / 标准化辅助
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账号检查和 id 标准化应保留在插件实现中。

## provider 目录

provider 插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })`
为推理定义模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入 `models.providers` 中相同的形状：

- `{ provider }`：一个 provider 条目
- `{ providers }`：多个 provider 条目

当插件拥有 provider 特定的模型 id、`baseUrl` 默认值或受鉴权门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式 provider 的合并时机：

- `simple`：普通 API key 或环境变量驱动的 provider
- `profile`：当存在 auth profile 时出现的 provider
- `paired`：合成多个相关 provider 条目的 provider
- `late`：最后阶段，在其他隐式 provider 之后

在键冲突时，后出现的 provider 会胜出，因此插件可以有意覆盖具有相同 provider id 的内置 provider 条目。

兼容性：

- `discovery` 仍可作为旧别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先实现
`plugin.config.inspectAccount(cfg, accountId)`，并与 `resolveAccount(...)` 配套。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假设凭证已被完整物化，并且在缺少必需密钥时快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`，以及 doctor / 配置修复流程，不应为了描述配置而必须物化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账号状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源 / 状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（以及匹配的来源字段）对于状态类命令就足够了。
- 当凭证通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样只读命令就能报告“已配置，但在当前命令路径中不可用”，而不是崩溃或错误地把该账号报告为未配置。

## 包打包集合

插件目录可以包含一个带 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会变成一个插件。如果该包列出了多个扩展，则插件 id 会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接之后都必须仍位于插件目录内部。逃出包目录的条目会被拒绝。

安全说明：`openclaw plugins install` 会使用项目本地的 `npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本、运行时无开发依赖），并忽略继承的全局 npm 安装设置。请保持插件依赖树为“纯 JS / TS”，并避免需要 `postinstall` 构建的包。

可选项：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。当 OpenClaw 需要为一个已禁用的渠道插件提供设置表面，或者某个渠道插件已启用但尚未配置时，它会加载 `setupEntry` 而不是完整插件入口。这样当你的主插件入口还会接线工具、钩子或其他仅运行时代码时，就可以让启动和设置更轻量。

可选项：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让某个渠道插件在 Gateway 网关的 pre-listen 启动阶段也走同样的 `setupEntry` 路径，即使该渠道已经配置完成。

仅当 `setupEntry` 能完整覆盖 Gateway 网关开始监听前必须存在的启动表面时，才使用这个选项。实际上，这意味着 setup entry 必须注册启动所依赖的所有渠道拥有能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听前就可用的 HTTP 路由
- 任何在同一窗口内必须存在的 gateway 方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用这个标志。保持插件默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道也可以发布仅设置阶段的契约表面辅助，供 core 在完整渠道运行时加载前查询。当前的设置提升表面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core 会在需要将旧版单账号渠道配置提升到 `channels.<id>.accounts.*` 时使用该表面，而无需加载完整插件入口。Matrix 是当前的内置示例：当已存在命名账号时，它只会把鉴权 / 引导键移动到一个被提升的命名账号中，并且能够保留一个已配置但非规范的默认账号键，而不是总是创建 `accounts.default`。

这些设置补丁适配器让内置契约表面发现保持惰性。导入时保持轻量；提升表面只在首次使用时加载，而不会在模块导入期间重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在插件专用前缀下。Core 管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终保留，并且总是解析为 `operator.admin`，即使某个插件请求了更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 宣告设置 / 发现元数据，并通过 `openclaw.install` 宣告安装提示。这使得 core 目录保持无数据状态。

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

除最小示例外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富目录 / Status 表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：该目录条目应优先于的低优先级插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面的文案控制
- `markdownCapable`：将该渠道标记为支持 Markdown，以便进行出站格式决策
- `exposure.configured`：设为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式设置 / 配置选择器中隐藏该渠道
- `exposure.docs`：在文档导航表面中将该渠道标记为内部 / 私有
- `showConfigured` / `showInSetup`：为兼容性仍接受的旧别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账号，也要求显式账号绑定
- `preferSessionLookupForAnnounceTarget`：解析 announce 目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如某个 MPM 注册表导出）。将 JSON 文件放到以下任一路径：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（使用逗号 / 分号 / `PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧别名。

生成的渠道目录条目和 provider 安装目录条目会在原始 `openclaw.install` 块旁边暴露标准化后的安装来源事实。标准化事实会标识 npm spec 是精确版本还是浮动选择器、是否存在预期的完整性元数据，以及是否还可用本地源码路径。当目录 / 包身份已知时，如果解析出的 npm 包名与该身份发生漂移，标准化事实会发出警告。它们还会在 `defaultChoice` 无效、指向不可用来源，或存在 npm 完整性元数据但没有有效 npm 来源时发出警告。使用方应将 `installSource` 视为增量可选字段，这样手工构建的条目和目录 shim 就无需合成它。这样，新手引导和诊断就可以在不导入插件运行时的情况下解释来源平面状态。

官方外部 npm 条目应优先使用精确的 `npmSpec` 加上 `expectedIntegrity`。仅包名和 dist-tag 为兼容性仍然可用，但它们会暴露来源平面警告，以便目录在不破坏现有插件的前提下逐步转向固定版本、带完整性校验的安装。当新手引导从本地目录路径安装时，它会记录一个受管插件索引条目，包含 `source: "path"`，并尽可能记录相对于工作区的 `sourcePath`。绝对运行时加载路径仍保存在 `plugins.load.paths` 中；安装记录会避免将本地工作站路径重复写入长期配置。这让本地开发安装对来源平面诊断保持可见，同时不会增加第二个原始文件系统路径泄露表面。持久化的 `plugins/installs.json` 插件索引是安装来源的事实来源，并且可以在不加载插件运行时模块的情况下刷新。它的 `installRecords` 映射即使在插件 manifest 缺失或无效时也是持久的；它的 `plugins` 数组则是一个可重建的 manifest / 缓存视图。

## 上下文引擎插件

上下文引擎插件拥有会话上下文编排，负责摄取、组装和压缩。通过
`api.registerContextEngine(id, factory)` 在你的插件中注册它们，然后使用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文流水线，而不只是添加内存搜索或钩子时，请使用这个能力。

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

## 添加新能力

当插件需要当前 API 无法适配的行为时，不要通过私有深入访问来绕过插件系统。应添加缺失的能力。

推荐顺序：

1. 定义 core 契约  
   决定哪些共享行为应由 core 拥有：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助形状。
2. 添加类型化的插件注册 / 运行时表面  
   用最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 接线 core + 渠道 / 功能使用方  
   渠道和功能插件应通过 core 消费该新能力，而不是直接导入某个厂商实现。
4. 注册厂商实现  
   然后由厂商插件针对该能力注册它们的后端。
5. 添加契约覆盖  
   添加测试，以便随着时间推移，归属和注册形状仍保持明确。

这就是 OpenClaw 如何在保持明确立场的同时，不被某个 provider 的世界观硬编码。有关具体文件清单和完整示例，请参见 [Capability Cookbook](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加新能力时，实现通常应同时涉及以下表面：

- `src/<capability>/types.ts` 中的 core 契约类型
- `src/<capability>/runtime.ts` 中的 core runner / 运行时辅助
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- `src/plugins/runtime/*` 中的插件运行时暴露（当功能 / 渠道插件需要消费它时）
- `src/test-utils/plugin-registration.ts` 中的 capture / 测试辅助
- `src/plugins/contracts/registry.ts` 中的归属 / 契约断言
- `docs/` 中的操作者 / 插件文档

如果这些表面中缺少某一项，通常说明该能力尚未完全集成。

### 能力模板

最小模式：

```ts
// core 契约
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

// 面向功能 / 渠道插件的共享运行时辅助
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
- 功能 / 渠道插件消费运行时辅助
- 契约测试让归属保持明确

## 相关内容

- [Plugin architecture](/zh-CN/plugins/architecture) — 公开能力模型和形状
- [Plugin SDK subpaths](/zh-CN/plugins/sdk-subpaths)
- [Plugin Setup](/zh-CN/plugins/sdk-setup)
- [Building plugins](/zh-CN/plugins/building-plugins)
