---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或包集合
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载管线、注册表、运行时钩子、HTTP 路由和参考表
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-07-12T14:36:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

关于公开能力模型、插件形态以及所有权/执行契约，请参阅[插件架构](/zh-CN/plugins/architecture)。本页介绍内部机制：加载管线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和架构表。

## 加载管线

启动时，OpenClaw 大致执行以下操作：

1. 发现候选插件根目录
2. 读取原生或兼容的 bundle 清单和包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定是否启用每个候选项
6. 加载已启用的原生模块：构建后的内置模块使用原生加载器；第三方本地 TypeScript 源代码使用应急 Jiti 回退方案
7. 调用原生 `register(api)` 钩子，并将注册项收集到插件注册表中
8. 向命令/运行时界面公开注册表

<Note>
`activate` 是 `register` 的旧版别名——加载器会解析存在的那个（`def.register ?? def.activate`），并在同一阶段调用它。所有内置插件均使用 `register`；新插件应优先使用 `register`。
</Note>

安全门控在运行时执行**之前**运行。发现过程会在以下情况下阻止候选项：

- 其解析后的入口路径逃逸出插件根目录
- 其路径（或根目录）可被所有用户写入
- 对于非内置插件，路径所有者与当前 uid（或 root）不匹配

对于可被所有用户写入的内置目录，门控重新检查前会先尝试就地执行 `chmod` 修复（npm/全局安装可能会以 `0777` 权限交付包目录）；对于内置来源，则完全跳过所有权检查。

当插件 id 已知时，被阻止的候选项所发出的诊断中仍会包含该 id（包括从已被拒绝目录内的清单中解析出的 id），因此引用该 id 的配置会看到一个与路径安全警告关联的被阻止插件，而不是无关的“未知插件”错误。

### 清单优先行为

清单是控制面的事实来源。OpenClaw 使用它来：

- 识别插件
- 发现声明的渠道/Skills/配置架构或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 补充 Control UI 标签/占位符
- 显示安装/目录元数据
- 无需加载插件运行时即可保留轻量的激活和设置描述符

对于原生插件，运行时模块属于数据面部分。它负责注册钩子、工具、命令或提供商流程等实际行为。

可选的清单 `activation` 和 `setup` 块保留在控制面中。它们只是用于激活规划和设置发现的元数据描述符；不会取代运行时注册、`register(...)` 或 `setupEntry`。实时激活使用方会利用清单中的命令、渠道和提供商提示，在更广泛的注册表具体化之前缩小插件加载范围：

- CLI 加载范围缩小为拥有所请求主命令的插件
- 渠道设置/插件解析范围缩小为拥有所请求渠道 id 的插件
- 显式提供商设置/运行时解析范围缩小为拥有所请求提供商 id 的插件
- Gateway 网关启动规划使用 `activation.onStartup` 进行显式启动导入；没有启动元数据的插件仅通过范围更窄的激活触发器加载

激活规划器同时提供仅含 id 的 API 供现有调用方使用，以及用于诊断的计划 API。计划条目会报告选择插件的原因，并区分显式 `activation.*` 提示与清单所有权回退：

| 原因（来自 `activation.*` 提示）     | 原因（来自清单所有权）                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                              |
| `activation-capability-hint`         | —                                                                                              |
| `activation-channel-hint`            | `manifest-channel-owner`（`channels`）                                                         |
| `activation-command-hint`            | `manifest-command-alias`（`commandAliases`）                                                   |
| `activation-provider-hint`           | `manifest-provider-owner`（`providers`）、`manifest-setup-provider-owner`（`setup.providers`） |
| `activation-route-hint`              | —                                                                                              |
| —（钩子触发器没有提示变体）          | `manifest-hook-owner`（`hooks`）、`manifest-tool-contract`（`contracts.tools`）                |

这种原因拆分是兼容性边界：现有插件元数据继续正常工作，同时新代码可以检测宽泛提示或回退行为，而无需更改运行时加载语义。

请求时运行时预加载若请求宽泛的 `all` 作用域，仍会从配置、启动规划、已配置渠道、槽位和自动启用规则中派生显式的有效插件 id 集合（`src/plugins/effective-plugin-ids.ts` 中的 `resolveEffectivePluginIds`）。如果派生的集合为空，OpenClaw 会保持作用域为空，而不会将其扩展到所有可发现的插件。

设置发现优先使用描述符所拥有的 id（例如 `setup.providers` 和 `setup.cliBackends`）缩小候选插件范围，然后才会回退到 `setup-api`，供仍需要设置时运行时钩子的插件使用。提供商设置列表使用清单中的 `providerAuthChoices`、从描述符派生的设置选项和安装目录元数据，无需加载提供商运行时。显式的 `setup.requiresRuntime: false` 是仅使用描述符的截止条件；省略 `requiresRuntime` 时，为兼容性保留旧版 setup-api 回退。如果多个已发现插件声明拥有同一个规范化的设置提供商或 CLI 后端 id，设置查找会拒绝这个存在歧义的所有者，而不是依赖发现顺序。设置运行时实际执行时，注册表诊断会报告 `setup.providers` / `setup.cliBackends` 与 setup-api 实际注册的提供商或 CLI 后端之间的偏差，但不会阻止旧版插件。

### 插件缓存边界

OpenClaw 不会基于实际时间窗口缓存插件发现结果或直接清单注册表数据。安装、清单编辑和加载路径更改必须在下一次显式元数据读取或快照重建时可见。清单文件解析器维护一个有界的文件签名缓存，其键由打开的清单路径以及设备/inode、大小和 mtime/ctime 组成；该缓存仅用于避免重新解析未更改的字节，不得缓存发现、注册表、所有者或策略结果。

安全的元数据快速路径依赖显式对象所有权，而不是隐藏缓存。
Gateway 网关启动热路径应通过调用链传递当前的 `PluginMetadataSnapshot`、
派生的 `PluginLookUpTable`，或显式的清单注册表。配置验证、启动时自动启用、
插件引导和提供商选择可以复用这些对象，只要它们仍代表当前配置和插件清单。
设置查找仍会按需重建清单元数据，除非特定设置路径收到显式清单注册表；
应将其保留为冷路径回退，而不是添加隐藏的查找缓存。输入发生变化时，
应重建并替换快照，而不是修改快照或保留历史副本。应根据当前注册表/根目录，
重新计算活动插件注册表的视图以及内置渠道引导辅助函数。可以在单次调用中使用
短期映射来去重工作或防止重入；但它们绝不能演变为进程级元数据缓存。

对于插件加载，持久缓存层属于运行时加载。实际加载代码或已安装工件时，
它可以复用加载器状态，例如：

- `PluginLoaderCacheState` 和兼容的活动运行时注册表
- jiti/模块缓存，以及用于避免重复导入同一运行时表面的公共表面加载器缓存
- 已安装插件工件的文件系统缓存
- 用于路径规范化或重复项解析的短期单次调用映射

这些缓存属于数据平面的实现细节。除非调用方明确请求运行时加载，
否则它们绝不能用于回答“哪个插件拥有此提供商？”之类的控制平面问题。

不要为以下内容添加持久缓存或基于墙上时钟的缓存：

- 设备发现结果
- 直接清单注册表
- 根据已安装插件索引重建的清单注册表
- 提供商所有者查找、模型抑制、提供商策略或公共工件元数据
- 任何其他由清单派生的答案，只要清单、已安装索引或加载路径发生变化，
  该变化就应在下次读取元数据时可见

从持久化的已安装插件索引重建清单元数据的调用方会按需重建该注册表。
已安装索引是持久的源平面状态；它不是隐藏的进程内元数据缓存。

## 注册表模型

已加载的插件不会直接修改任意核心全局变量。它们会注册到中央插件注册表
（`src/plugins/registry-types.ts` 中的 `PluginRegistry`），该注册表跟踪插件记录
（身份、来源、源头、状态、诊断信息），以及各项能力对应的数组：工具、旧版钩子
和类型化钩子、渠道、提供商、Gateway 网关 RPC 处理程序、HTTP 路由、CLI 注册器、
后台服务、插件自有命令，以及数十种其他类型化提供商族（语音、嵌入、
图像/视频/音乐生成、Web 获取/搜索、Agent harness、会话操作等）。

随后，核心功能从该注册表读取信息，而不是直接与插件模块交互。
这使加载流程保持单向：

- 插件模块 -> 注册到注册表
- 核心运行时 -> 使用注册表

这种分离对可维护性很重要。这意味着大多数核心表面只需要一个集成点：
“读取注册表”，而不是“对每个插件模块进行特殊处理”。

## 对话绑定回调

绑定对话的插件可以在审批完成时作出响应。

使用 `api.onConversationBindingResolved(...)`，可在绑定请求获批或被拒后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 此插件与对话之间现在已存在绑定。
        console.log(event.binding?.conversationId);
        return;
      }

      // 请求已被拒绝；清除所有本地待处理状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调载荷字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已获批请求对应的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 ID 和对话元数据

此回调仅用于通知。它不会改变谁有权绑定对话，并且会在核心审批处理完成后运行。

## 提供商运行时钩子

提供商插件分为三层：

- 用于低成本运行时前查找的**清单元数据**：
  `setup.providers[].envVars`、已弃用的兼容项 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时钩子**：`catalog`（旧版 `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40+ 个可选钩子，涵盖身份验证、模型解析、
  流包装、思考级别、重放策略和用量端点。请参阅
  [钩子顺序和用法](#hook-order-and-usage)。

OpenClaw 仍负责通用 Agent loop、故障转移、记录文本处理和工具策略。
这些钩子为提供商特定行为提供扩展表面，无需实现一整套自定义推理传输。

当提供商具有基于环境变量的凭据，且通用身份验证、状态和模型选择器路径需要在不加载插件运行时的情况下获取这些凭据时，请使用清单中的 `setup.providers[].envVars`。在弃用期内，兼容性适配器仍会读取已弃用的 `providerAuthEnvVars`，使用它的非内置插件会收到清单诊断。若一个提供商 ID 应复用另一个提供商 ID 的环境变量、身份验证配置文件、配置支持的身份验证和 API 密钥新手引导选项，请使用清单中的 `providerAuthAliases`。若新手引导和身份验证选项的 CLI 界面需要在不加载提供商运行时的情况下获知提供商的选项 ID、分组标签和简单的单标志身份验证接线，请使用清单中的 `providerAuthChoices`。提供商运行时的 `envVars` 应保留用于面向操作员的提示，例如新手引导标签或 OAuth 客户端 ID/客户端密钥设置变量。

当渠道具有由环境变量驱动的身份验证或设置，且通用 shell 环境变量回退、配置/状态检查或设置提示需要在不加载渠道运行时的情况下获取这些信息时，请使用清单中的 `channelEnvVars`。

### 钩子顺序和用法

对于模型/提供商插件，OpenClaw 大致按以下顺序调用钩子。
“When to use”列是快速决策指南。
此处有意不列出 OpenClaw 已不再调用、仅用于兼容性的提供商字段，例如 `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`。

| 钩子                              | 作用                                                                                                   | 使用场景                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | 在生成 `models.json` 期间将提供商配置发布到 `models.providers`                                | 提供商拥有目录或基础 URL 默认值                                                                                                  |
| `applyConfigDefaults`             | 在配置具体化期间应用由提供商所有的全局配置默认值                                      | 默认值取决于身份验证模式、环境或提供商模型系列语义                                                                         |
| _（内置模型查找）_         | OpenClaw 首先尝试常规注册表/目录路径                                                          | _（不是插件钩子）_                                                                                                                         |
| `normalizeModelId`                | 在查找前规范化旧版或预览版模型 ID 别名                                                     | 提供商负责在解析规范模型前清理别名                                                                                 |
| `normalizeTransport`              | 在通用模型组装前规范化提供商系列的 `api` / `baseUrl`                                      | 提供商负责清理同一传输系列中自定义提供商 ID 的传输配置                                                          |
| `normalizeConfig`                 | 在运行时/提供商解析前规范化 `models.providers.<id>`                                           | 提供商需要将配置清理逻辑置于插件中；内置的 Google 系列辅助程序也会为受支持的 Google 配置条目提供后备处理   |
| `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式用量兼容性重写                                               | 提供商需要修复由端点驱动的原生流式用量元数据                                                                          |
| `resolveConfigApiKey`             | 在加载运行时身份验证前，为配置提供商解析环境标记身份验证                                       | 提供商公开各自的环境标记 API 密钥解析钩子                                                                                |
| `resolveSyntheticAuth`            | 公开本地/自托管或由配置支持的身份验证，而不持久化明文                                   | 提供商可以使用合成/本地凭据标记运行                                                                                 |
| `resolveExternalAuthProfiles`     | 叠加由提供商所有的外部身份验证配置文件；对于 CLI/应用所有的凭据，默认 `persistence` 为 `runtime-only` | 提供商复用外部身份验证凭据，而不持久化复制的刷新令牌；需在清单中声明 `contracts.externalAuthProviders` |
| `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符的优先级降至由环境/配置支持的身份验证之后                                      | 提供商存储不应获得优先权的合成占位符配置文件                                                                 |
| `resolveDynamicModel`             | 为本地注册表中尚不存在的提供商所有模型 ID 提供同步后备处理                                       | 提供商接受任意上游模型 ID                                                                                                 |
| `prepareDynamicModel`             | 异步预热，随后再次运行 `resolveDynamicModel`                                                           | 提供商在解析未知 ID 前需要网络元数据                                                                                  |
| `normalizeResolvedModel`          | 在嵌入式运行器使用已解析模型前执行最终重写                                               | 提供商需要重写传输配置，但仍使用核心传输                                                                             |
| `normalizeToolSchemas`            | 在嵌入式运行器接收工具架构前对其进行规范化                                                    | 提供商需要清理传输系列的架构                                                                                                |
| `inspectToolSchemas`              | 在规范化后公开由提供商所有的架构诊断信息                                                  | 提供商希望获得关键字警告，而不需要向核心加入特定于提供商的规则                                                                 |
| `resolveReasoningOutputMode`      | 选择原生或带标签的推理输出契约                                                              | 提供商需要带标签的推理/最终输出，而不是原生字段                                                                         |
| `prepareExtraParams`              | 在通用流选项封装器之前规范化请求参数                                              | 提供商需要默认请求参数或针对各提供商的参数清理                                                                           |
| `createStreamFn`                  | 使用自定义传输完全替换常规流路径                                                   | 提供商需要自定义线协议，而不仅是封装器                                                                                     |
| `wrapStreamFn`                    | 在应用通用封装器后使用流封装器                                                              | 提供商需要请求标头/正文/模型兼容性封装器，但不需要自定义传输                                                          |
| `resolveTransportTurnState`       | 附加原生的逐轮次传输标头或元数据                                                           | 提供商希望通用传输发送提供商原生的轮次标识                                                                       |
| `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 标头或会话冷却策略                                                    | 提供商希望通用 WS 传输调整会话标头或后备策略                                                               |
| `formatApiKey`                    | 身份验证配置文件格式化程序：将存储的配置文件转换为运行时 `apiKey` 字符串                                     | 提供商存储额外的身份验证元数据，并需要自定义运行时令牌格式                                                                    |
| `refreshOAuth`                    | 针对自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖                                  | 提供商不适用于共享的 OpenClaw 刷新器                                                                                          |
| `buildAuthDoctorHint`             | OAuth 刷新失败时追加的修复提示                                                                  | 提供商需要在刷新失败后提供由其所有的身份验证修复指导                                                                      |
| `matchesContextOverflowError`     | 由提供商所有的上下文窗口溢出匹配器                                                                 | 提供商存在通用启发式方法无法识别的原始溢出错误                                                                                |
| `classifyFailoverReason`          | 由提供商所有的故障转移原因分类                                                                  | 提供商可以将原始 API/传输错误映射到速率限制/过载等                                                                          |
| `isCacheTtlEligible`              | 代理/回程提供商的提示缓存策略                                                               | 提供商需要特定于代理的缓存 TTL 门控                                                                                                |
| `buildMissingAuthMessage`         | 替换通用的缺少身份验证恢复消息                                                      | 提供商需要特定于提供商的缺少身份验证恢复提示                                                                                 |
| `augmentModelCatalog`             | 在发现后追加合成/最终目录行（已弃用，见下文）                                  | 提供商需要在 `models list` 和选择器中显示用于前向兼容的合成行                                                                     |
| `resolveThinkingProfile`          | 特定于模型的 `/think` 级别集合、显示标签和默认值                                                 | 提供商为选定模型公开自定义思考级别阶梯或二元标签                                                                 |
| `isBinaryThinking`                | 开/关推理切换兼容性钩子                                                                     | 提供商仅公开二元思考开/关                                                                                                  |
| `supportsXHighThinking`           | `xhigh` 推理支持兼容性钩子                                                                   | 提供商仅希望在部分模型上启用 `xhigh`                                                                                             |
| `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性钩子                                                                      | 提供商拥有模型系列的默认 `/think` 策略                                                                                      |
| `isModernModelRef`                | 用于实时配置文件筛选和冒烟测试选择的现代模型匹配器                                              | 提供商拥有实时/冒烟测试首选模型匹配逻辑                                                                                             |
| `prepareRuntimeAuth`              | 在推理前将配置的凭据交换为实际运行时令牌/密钥                       | 提供商需要令牌交换或短期请求凭据                                                                             |
| `resolveUsageAuth`                | 为 `/usage` 和相关状态界面解析用量/账单凭据                                     | 提供商需要自定义用量/配额令牌解析或不同的用量凭据                                                               |
| `fetchUsageSnapshot`              | 在身份验证解析后获取并规范化特定于提供商的用量/配额快照                             | 提供商需要特定于提供商的用量端点或载荷解析器                                                                           |
| `createEmbeddingProvider`         | 为记忆/搜索构建由提供商所有的嵌入适配器                                                     | 记忆嵌入行为归提供商插件所有                                                                                    |
| `buildReplayPolicy`               | 返回控制提供商转录记录处理方式的重放策略                                        | 提供商需要自定义转录记录策略（例如移除思考块）                                                               |
| `sanitizeReplayHistory`           | 在通用转录记录清理后重写重放历史                                                        | 除共享压缩辅助函数外，提供商还需要提供商特定的重放重写                                                             |
| `validateReplayTurns`             | 在嵌入式运行器执行前，对重放轮次进行最终验证或重塑                                           | 通用清理后，提供商传输层需要更严格的轮次验证                                                                    |
| `onModelSelected`                 | 运行由提供商所有的选择后副作用                                                                 | 模型激活时，提供商需要遥测或由提供商所有的状态                                                                  |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配的提供商插件，然后依次尝试其他支持钩子的提供商插件，直到其中某个插件实际更改模型 ID 或传输方式/配置。这样，无需调用方知道由哪个内置插件负责重写，也能继续使用提供商别名/兼容性适配层。如果没有提供商钩子重写受支持的 Google 系列配置项，内置的 Google 配置规范化器仍会应用相应的兼容性清理。

如果提供商需要完全自定义的线路协议或自定义请求执行器，则属于另一类扩展。这些钩子适用于仍在 OpenClaw 常规推理循环中运行的提供商行为。

`resolveUsageAuth` 决定 OpenClaw 应调用 `fetchUsageSnapshot`，还是针对用量/状态界面回退到通用凭据解析。当提供商具有用量凭据时，返回 `{ token, accountId?, subscriptionType?, rateLimitTier? }`（可选的套餐元数据会传入 `fetchUsageSnapshot`）；当提供商自行负责的用量身份验证已处理请求，并且必须阻止通用 API 密钥/OAuth 回退时，返回 `{ handled: true }`；当提供商未处理用量身份验证时，返回 `null` 或 `undefined`。

在插件清单的 `providerUsageAuthEnvVars` 中声明组织或计费凭据。这样，通用发现和密钥清理界面便可识别这些凭据，而不会将其作为推理身份验证候选项。

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

内置提供商插件会组合上述钩子，以适配各厂商的目录、身份验证、思考、重放和用量需求。权威钩子集合位于 `extensions/` 下的各个插件中；本页旨在说明这些形态，而不是复刻完整列表。

<AccordionGroup>
  <Accordion title="透传目录提供商">
    OpenRouter、Kilocode、Z.AI、xAI 注册 `catalog` 以及
    `resolveDynamicModel` / `prepareDynamicModel`，从而能够在 OpenClaw
    静态目录之前呈现上游模型 ID。
  </Accordion>
  <Accordion title="OAuth 和用量端点提供商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配合使用，以自行处理令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理系列">
    共享的具名系列（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）允许提供商通过
    `buildReplayPolicy` 选择启用转录策略，而无需每个插件都重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录提供商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只注册 `catalog`，并使用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 专用流式传输辅助函数">
    Beta 标头、`/fast` / `serviceTier` 和 `context1m` 位于 Anthropic
    插件的公共 `api.ts` / `contract-api.ts` 接口中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助函数

插件可通过 `api.runtime` 访问部分核心辅助函数。对于 TTS：

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

- `textToSpeech` 为文件/语音消息界面返回常规的核心 TTS 输出载荷。
- 使用核心 `messages.tts` 配置和提供商选择。
- 返回 PCM 音频缓冲区和采样率。插件必须针对提供商进行重采样/编码。
- `listVoices` 对每个提供商而言都是可选的。可将其用于厂商自行负责的语音选择器或设置流程。
- 核心会将解析后的请求截止时间传递给提供商的 `listVoices` 钩子；提供商特定的超时设置可以覆盖该值。
- 语音列表可以包含更丰富的元数据，例如语言区域、性别和个性标签，供支持提供商感知的选择器使用。
- OpenAI 和 ElevenLabs 目前支持电话语音。Microsoft 不支持。

插件还可以通过 `api.registerSpeechProvider(...)` 注册语音提供商。

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
- 使用语音提供商实现厂商自行负责的合成行为。
- 旧版 Microsoft `edge` 输入会规范化为 `microsoft` 提供商 ID。
- 首选的所有权模型以公司为导向：随着 OpenClaw 增加这些能力契约，一个厂商插件可以负责文本、语音、图像及未来的媒体提供商。

对于图像/音频/视频理解，插件应注册一个类型化的媒体理解提供商，而不是通用键值集合：

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
- 增量扩展应保持类型化：新增可选方法、新增可选结果字段、新增可选能力。
- 视频生成已遵循相同模式：
  - 核心负责能力契约和运行时辅助函数
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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.6-sol",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
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

注意：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享接口。
- `extractStructuredWithModel(...)` 是面向插件的接口，用于执行有界的、由提供商自行负责且以图像为优先的提取。至少包含一个图像输入；文本输入属于补充上下文。产品插件负责自己的路由和模式，而 OpenClaw 负责提供商/运行时边界。
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 未生成转录输出时（例如输入被跳过或不受支持），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍作为兼容性别名保留。

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

注意：

- `provider` 和 `model` 是每次运行的可选覆盖项，而不是持久会话更改。
- OpenClaw 仅对可信调用方接受这些覆盖字段。
- 对于插件自行负责的回退运行，操作员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 明确选择启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将可信插件限制到特定的规范 `provider/model` 目标，或使用 `"*"` 明确允许任意目标。
- 不可信插件的子智能体运行仍可工作，但覆盖请求会被拒绝，而不是静默回退。
- 插件创建的子智能体会话会标记创建它的插件 ID。回退方法 `api.runtime.subagent.deleteSession(...)` 只能删除这些归属该插件的会话；删除任意会话仍需要具有管理员权限范围的 Gateway 网关请求。

对于 Web 搜索，插件可以使用共享运行时辅助函数，而无需深入智能体工具接线：

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

插件还可以通过 `api.registerWebSearchProvider(...)` 注册 Web 搜索提供商。

注意：

- 将提供商选择、凭据解析和共享请求语义保留在核心中。
- 使用 Web 搜索提供商实现厂商特定的搜索传输方式。
- 对于需要搜索行为但不应依赖智能体工具封装器的功能/渠道插件，`api.runtime.webSearch.*` 是首选共享接口。

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
- `auth`：必填，取值为 `"gateway"` 或 `"plugin"`。使用 `"gateway"` 要求正常的 Gateway 网关身份验证，使用 `"plugin"` 则由插件管理身份验证/webhook 验证。
- `match`：可选。取值为 `"exact"`（默认）或 `"prefix"`。
- `handleUpgrade`：可选，用于处理同一路由上的 WebSocket 升级请求。
- `replaceExisting`：可选。允许同一插件替换自己已注册的路由。
- `handler`：路由处理了请求时返回 `true`。

注意事项：

- `api.registerHttpHandler(...)` 已被移除，使用它会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 除非设置 `replaceExisting: true`，否则完全相同的 `path + match` 冲突会被拒绝；并且一个插件不能替换另一个插件的路由。
- 使用不同 `auth` 级别的重叠路由会被拒绝。`exact`/`prefix` 回退链只能使用同一身份验证级别。
- `auth: "plugin"` 路由**不会**自动获得操作员运行时权限范围。它们用于由插件管理的 webhook/签名验证，而非调用具备特权的 Gateway 网关辅助函数。
- `auth: "gateway"` 路由在 Gateway 网关请求运行时权限范围内运行。默认表面（`gatewayRuntimeScopeSurface: "write-default"`）有意采取保守策略：
  - 共享密钥 bearer 身份验证（`gateway.auth.mode = "token"` / `"password"`）以及任何非受信任代理身份验证方法仅获得一个 `operator.write` 权限范围，即使调用方发送了 `x-openclaw-scopes`
  - 未显式提供 `x-openclaw-scopes` 标头的 `trusted-proxy` 调用方也继续使用旧版仅限 `operator.write` 的表面
  - 发送了 `x-openclaw-scopes` 的 `trusted-proxy` 调用方则获得其中声明的权限范围
  - 路由可以选择启用 `gatewayRuntimeScopeSurface: "trusted-operator"`，以始终对携带身份信息的身份验证模式采用 `x-openclaw-scopes`（缺少该标头时回退到完整的 CLI 默认权限范围集）
- 实用规则：不要假定经过 Gateway 网关身份验证的插件路由隐式具备管理员权限。如果你的路由需要仅限管理员的行为，请选择启用 `trusted-operator` 权限范围表面、要求使用携带身份信息的身份验证模式，并记录明确的 `x-openclaw-scopes` 标头契约。
- 路由匹配和身份验证完成后，普通处理程序会参与 Gateway 网关根工作准入。处于准备或重启状态的 Gateway 网关会在调用处理程序之前返回 `503`。一个严格限定的例外是：清单授予权限的 `auth: "gateway"` 路由同时选择启用了路由专属的 `trusted-operator` 表面；该路由仍可访问，以免暂停控制分派陷入无法执行的状态，而同一插件的普通同级路由仍位于准入边界之后。WebSocket 的 `handleUpgrade` 所有权使用相同的原子准入边界；处理程序接受套接字后，该套接字后续的生命周期由插件负责，不受此边界跟踪。

## 插件 SDK 导入路径

编写新插件时，请使用精细的 SDK 子路径，而不是单体式 `openclaw/plugin-sdk` 根
barrel。核心子路径：

| 子路径                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语                                       |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口/构建辅助函数                              |
| `openclaw/plugin-sdk/core`          | 通用共享辅助函数和总括契约                         |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 架构（`OpenClawSchema`）    |

渠道插件可从一系列精细的接口中选用：`channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。审批行为应统一到一个
`approvalCapability` 契约中，而不是分散混用无关的插件字段。请参阅[渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助函数位于对应的专用 `*-runtime` 子路径下
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` 等）。应优先使用 `config-contracts`、
`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，
而不是宽泛的 `config-runtime` 兼容性 barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/channel-lifecycle`、
小型渠道辅助 facade、`openclaw/plugin-sdk/outbound-runtime`、
`openclaw/plugin-sdk/outbound-send-deps`、`openclaw/plugin-sdk/config-runtime`
和 `openclaw/plugin-sdk/infra-runtime` 是面向旧版插件的已弃用兼容性垫片。
新代码应改为导入更精细的通用原语。
</Info>

仓库内部入口点（按每个内置插件的软件包根目录划分）：

- `index.js` — 内置插件入口
- `api.js` — 辅助函数/类型统一导出文件
- `runtime-api.js` — 仅运行时统一导出文件
- `setup-entry.js` — 设置插件入口

外部插件应仅导入 `openclaw/plugin-sdk/*` 子路径。绝不要从核心或其他插件中导入另一个插件包的 `src/*`。
通过 facade 加载的入口点会优先使用当前运行时配置快照（如果存在），然后回退到磁盘上解析出的配置文件。

`image-generation`、`media-understanding` 和 `speech` 等能力特定子路径之所以存在，是因为目前内置插件正在使用它们。它们并不会自动成为长期冻结的外部契约——依赖这些子路径时，请查看相关的 SDK 参考页面。

## 消息工具架构

对于表情回应、读取和投票等非消息原语，插件应负责提供渠道特定的 `describeMessageTool(...)` 架构贡献。共享的发送呈现应使用通用的 `MessagePresentation` 契约，而不是提供商原生的按钮、组件、区块或卡片字段。
有关契约、回退规则、提供商映射和插件作者检查清单，请参阅[消息呈现](/zh-CN/plugins/message-presentation)。

支持发送功能的插件通过消息能力声明其可呈现的内容：

- `presentation` 用于语义化呈现区块（`text`、`context`、`divider`、`chart`、`table`、`buttons`、`select`）
- `delivery-pin` 用于置顶投递请求

核心决定是以原生方式呈现内容，还是将其降级为文本。
不要通过通用消息工具暴露提供商原生 UI 的绕过机制。
面向旧版原生架构的已弃用 SDK 辅助函数仍会导出，以供现有第三方插件使用，但新插件不应使用它们。

## 渠道目标解析

渠道插件应负责渠道特定的目标语义。保持共享出站主机的通用性，并通过消息适配器接口处理提供商规则：

- `messaging.inferTargetChatType({ to })` 决定在查询目录之前，应将规范化目标视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告知核心某项输入是否应跳过目录搜索，直接进入类 ID 解析。
- `messaging.targetResolver.reservedLiterals` 列出对该提供商而言表示渠道/会话引用的裸词。解析过程会先保留已配置的目录条目，再拒绝保留字面量；如果目录中未找到匹配项，则以关闭方式失败。
- `messaging.targetResolver.resolveTarget(...)` 是插件的回退机制，供核心在规范化后或目录未命中后需要执行最终的提供商自有解析时使用。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后，负责构建提供商特定的会话路由。

建议的职责划分：

- 对于应在搜索对等方/群组之前完成的类别判断，请使用 `inferTargetChatType`。
- 对于“将其视为显式/原生目标 ID”的检查，请使用 `looksLikeId`。
- 将 `resolveTarget` 用于提供商特定的规范化回退，而不是广泛的目录搜索。
- 将聊天 ID、话题 ID、JID、句柄和房间 ID 等提供商原生 ID 放在 `target` 值或提供商特定参数中，而不是通用 SDK 字段中。

## 配置支持的目录

从配置派生目录条目的插件应将该逻辑保留在插件中，并复用 `openclaw/plugin-sdk/directory-runtime` 中的共享辅助函数。

当渠道需要以下由配置支持的对等方/群组时，请使用此方式：

- 由允许列表驱动的私信对等方
- 已配置的渠道/群组映射
- 账户范围的静态目录回退

`directory-runtime` 中的共享辅助函数仅处理通用操作：

- 查询筛选
- 应用数量限制
- 去重/规范化辅助函数
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 ID 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以通过 `registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入 `models.providers` 相同的结构：

- `{ provider }`，表示一个提供商条目
- `{ providers }`，表示多个提供商条目

当插件拥有提供商特定的模型 ID、基础 URL 默认值或需要身份验证的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：普通的 API 密钥或环境变量驱动的提供商
- `profile`：存在身份验证配置文件时显示的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：在其他隐式提供商之后执行的最后一轮

发生键冲突时，后合并的提供商优先，因此插件可以有意使用相同的提供商 ID 覆盖内置提供商条目。

插件还可以通过 `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` 发布只读模型行。这是面向列表/帮助/选择器界面的后续路径，并支持 `text`、`voice`、`image_generation`、`video_generation` 和 `music_generation` 行。提供商插件仍负责实时端点调用、令牌交换和供应商响应映射；核心负责通用行结构、来源标签和媒体工具帮助的格式化。媒体生成提供商注册会根据 `defaultModel`、`models` 和 `capabilities` 自动合成静态目录行。

兼容性：

- `discovery` 仍可作为旧版别名使用，但会发出弃用警告
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog` 并发出警告
- `augmentModelCatalog` 已弃用；内置提供商应通过 `registerModelCatalogProvider` 发布补充行

## 只读渠道检查

如果你的插件注册了渠道，建议在 `resolveAccount(...)` 之外同时实现 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭据已完全具体化，并可在缺少必需密钥时快速失败。
- `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 等只读命令路径，以及 Doctor/配置修复流程，不应仅为描述配置就需要具体化运行时凭据。

建议的 `inspectAccount(...)` 行为：

- 仅返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关情况下包含凭据来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 无需仅为报告只读可用性而返回原始令牌值。对于状态类命令，返回 `tokenStatus: "available"`（以及对应的来源字段）即可。
- 当凭据通过 SecretRef 配置，但在当前命令路径中不可用时，使用 `configured_unavailable`。

这样，只读命令便可报告“已配置，但在此命令路径中不可用”，而不是崩溃或错误地将账户报告为未配置。

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

每个条目都会成为一个插件。如果包集合列出了多个扩展，插件 ID 将变为 `<manifestOrPackageName>/<fileBase>`（存在清单 ID 时优先使用；否则使用不含作用域的 `package.json` 名称）。

如果你的插件导入了 npm 依赖项，请在该目录中安装它们，以确保 `node_modules` 可用（`npm install` / `pnpm install`）。

安全防护：解析符号链接后，每个 `openclaw.extensions` 条目都必须位于插件目录内。任何逸出包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 使用项目本地的 `npm install --omit=dev --ignore-scripts` 安装插件依赖项（不运行生命周期脚本，运行时不安装开发依赖项），并忽略继承的全局 npm 安装设置。请确保插件依赖树为“纯 JS/TS”，并避免使用需要通过 `postinstall` 构建的软件包。

可选：`openclaw.setupEntry` 可以指向一个轻量的仅设置模块。当 OpenClaw 需要已禁用渠道插件的设置界面，或渠道插件已启用但仍未配置时，它会加载 `setupEntry`，而不是完整的插件入口。如果你的主插件入口还连接了工具、钩子或其他仅限运行时的代码，这可以减轻启动和设置负担。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可以让渠道插件在 Gateway 网关开始监听前的启动阶段使用相同的 `setupEntry` 路径，即使该渠道已经配置。

仅当 `setupEntry` 完全覆盖 Gateway 网关开始监听前必须存在的启动界面时，才使用此选项。实际上，这意味着设置入口必须注册启动所依赖的所有渠道自有能力，例如：

- 渠道注册本身
- Gateway 网关开始监听前必须可用的所有 HTTP 路由
- 在同一时间窗口内必须存在的所有 Gateway 网关方法、工具或服务

如果完整入口仍拥有任何必需的启动能力，请勿启用此标志。请让插件保持默认行为，并由 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅用于设置的契约界面辅助函数，供核心在加载完整渠道运行时之前查询。当前的设置提升界面为：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

核心需要将旧版单账户渠道配置提升至 `channels.<id>.accounts.*`，且不加载完整插件入口时，会使用此界面。Matrix 是当前的内置示例：当命名账户已存在时，它仅将身份验证/引导键移入一个命名的提升账户；它还可以保留已配置的非规范默认账户键，而不是始终创建 `accounts.default`。

这些设置补丁适配器使内置契约界面的发现保持惰性。导入过程仍然轻量；提升界面仅在首次使用时加载，而不会在模块导入时重新进入内置渠道启动流程。

当这些启动界面包含 Gateway RPC 方法时，请为它们使用插件专属前缀。核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍为保留命名空间，并且始终解析为 `operator.admin`，即使插件请求了更窄的权限范围。

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

渠道插件可以通过 `openclaw.channel` 公布设置/发现元数据，并通过 `openclaw.install` 公布安装提示。这样可使核心不包含目录数据。

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
      "blurb": "通过 Nextcloud Talk webhook 机器人提供自托管聊天。",
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

除最小示例外，其他有用的 `openclaw.channel` 字段包括：

- `detailLabel`：用于内容更丰富的目录/状态界面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：此目录条目应优先于的较低优先级插件/渠道 ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择界面的文案控制项
- `markdownCapable`：将渠道标记为支持 Markdown，以供出站格式决策使用
- `exposure.configured`：设为 `false` 时，在已配置渠道的列表界面中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：在文档导航界面中将该渠道标记为内部/私有渠道
- `showConfigured` / `showInSetup`：为兼容性仍接受的旧版别名；优先使用 `exposure`
- `quickstartAllowFrom`：让渠道选择加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使仅存在一个账户，也要求显式绑定账户
- `preferSessionLookupForAnnounceTarget`：解析公告目标时优先查询会话

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。将 JSON 文件放置在以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（使用逗号、分号或 `PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器还接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

生成的渠道目录条目和提供商安装目录条目会在原始 `openclaw.install` 块旁公开规范化的安装来源事实。这些规范化事实会标明 npm 规范是精确版本还是浮动选择器、是否存在预期的完整性元数据，以及本地来源路径是否也可用。当目录/软件包身份已知时，如果解析出的 npm 软件包名称偏离该身份，规范化事实会发出警告。当 `defaultChoice` 无效、指向不可用的来源，或者存在 npm 完整性元数据但没有有效的 npm 来源时，也会发出警告。使用方应将 `installSource` 视为附加的可选字段，以免手工构建的条目和目录兼容层必须合成该字段。这样，新手引导和诊断便可在不导入插件运行时的情况下说明来源平面状态。

官方外部 npm 条目应优先使用精确的 `npmSpec` 以及 `expectedIntegrity`。为兼容性，裸软件包名称和 dist-tag 仍然有效，但它们会显示来源平面警告，以便目录逐步转向固定版本、经过完整性检查的安装，同时不破坏现有插件。新手引导从本地目录路径安装时，会记录一个 `source: "path"` 的托管插件索引条目，并尽可能使用相对于工作区的 `sourcePath`。绝对的操作加载路径仍保留在 `plugins.load.paths` 中；安装记录会避免将本地工作站路径重复写入长期配置。这样，本地开发安装对来源平面诊断保持可见，同时不会增加第二个原始文件系统路径泄露界面。持久化的 `installed_plugin_index` SQLite 表是安装来源的事实来源，并且无需加载插件运行时模块即可刷新。即使插件清单缺失或无效，其 `installRecords` 映射也会持久保留；其 `plugins` 负载则是可重建的清单视图。

## 上下文引擎插件

上下文引擎插件负责会话上下文的摄取、组装和压缩编排。在你的插件中使用 `api.registerContextEngine(id, factory)` 注册它们，然后通过 `plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文管线，而不只是添加记忆搜索或钩子时，请使用此功能。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

工厂的 `ctx` 会公开可选的 `config`、`agentDir` 和 `workspaceDir` 值，用于构造时初始化。

当活动的 harness 具有持久后端线程时，`assemble()` 可以返回 `contextProjection`。对于旧版的逐轮投影，请省略它。当组装后的上下文应仅注入后端线程一次，并持续复用至 epoch 发生变化时，返回 `{ mode: "thread_bootstrap", epoch }`。当引擎的语义上下文发生变化后，例如在引擎自有的压缩过程之后，请更改 epoch。宿主可以在线程引导投影中保留工具调用元数据、输入形状和已脱敏的工具结果，使新建的后端线程无需复制包含原始机密信息的负载，也能保持工具连续性。

如果你的引擎**不**拥有压缩算法，请保留 `compact()` 的实现并显式委托它：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
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

当插件需要当前 API 无法满足的行为时，不要通过私有方式绕过插件系统直接访问内部实现。应添加缺失的能力。

推荐顺序：

1. **定义核心契约。** 确定核心应负责哪些共享行为：策略、回退、配置合并、生命周期、面向渠道的语义以及运行时辅助函数的形式。
2. **添加类型化的插件注册/运行时接口。** 使用最小且实用的类型化能力接口扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. **连接核心与渠道/功能使用方。** 渠道和功能插件应通过核心使用新能力，而不是直接导入供应商实现。
4. **注册供应商实现。** 然后由供应商插件针对该能力注册其后端。
5. **添加契约覆盖。** 添加测试，使所有权和注册形式随着时间推移始终保持明确。

OpenClaw 正是通过这种方式保持明确的设计主张，同时避免被硬编码为单一提供商的世界观。有关具体的文件检查清单和完整示例，请参阅[能力扩展手册](/zh-CN/plugins/adding-capabilities)。

### 能力检查清单

添加新能力时，实现通常应同时涉及以下接口：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器/运行时辅助函数
- `src/plugins/types.ts` 中的插件 API 注册接口
- `src/plugins/registry.ts` 中的插件注册表连接
- 当功能/渠道插件需要使用该能力时，`src/plugins/runtime/*` 中的插件运行时暴露接口
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助函数
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中的操作员/插件文档

如果缺少其中某个接口，通常表明该能力尚未完全集成。

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

// 供功能/渠道插件使用的共享运行时辅助函数
const clip = await api.runtime.videoGeneration.generate({
  prompt: "展示机器人走过实验室。",
  cfg,
});
```

契约测试模式（`src/plugins/contracts/registry.ts` 会暴露所有权查询，例如 `providerContractPluginIds`；测试断言插件的 `contracts.videoGenerationProviders` 列表与其实际注册的内容一致）：

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

这样可使规则保持简单：

- 核心负责能力契约和编排
- 供应商插件负责供应商实现
- 功能/渠道插件使用运行时辅助函数
- 契约测试使所有权保持明确

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) — 公共能力模型和形式
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
