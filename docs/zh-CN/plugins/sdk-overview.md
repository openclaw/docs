---
read_when:
    - 你需要知道应从哪个 SDK 子路径导入
    - 你需要一份关于 OpenClawPluginApi 所有注册方法的参考文档
    - 你正在查找特定的 SDK 导出项
sidebarTitle: Plugin SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-07-12T14:41:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

插件 SDK 是插件与核心之间的类型化契约。本页提供关于**应导入什么**以及**可以注册什么**的参考。

<Note>
  本页面向在 OpenClaw 内部使用 `openclaw/plugin-sdk/*` 的插件作者。对于希望通过 Gateway 网关运行智能体的外部应用、脚本、仪表板、CI 作业和 IDE 扩展，请改用
  [面向外部应用的 Gateway 网关集成](/zh-CN/gateway/external-apps)。
</Note>

<Tip>
想找操作指南？请从[构建插件](/zh-CN/plugins/building-plugins)开始。渠道请参阅[渠道插件](/zh-CN/plugins/sdk-channel-plugins)，模型提供商请参阅[提供商插件](/zh-CN/plugins/sdk-provider-plugins)，本地 AI CLI 后端请参阅[CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)，原生智能体执行器请参阅[Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)，工具或生命周期钩子请参阅[插件钩子](/zh-CN/plugins/hooks)。
</Tip>

## 导入约定

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、自包含的模块。这样可以加快启动速度并避免循环依赖问题。对于渠道专用的入口和构建辅助函数，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留用于更广泛的统合接口，以及 `buildChannelConfigSchema` 等共享辅助函数。

对于渠道配置，请通过 `openclaw.plugin.json#channelConfigs` 发布渠道自有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享 Schema 基础类型和通用构建器。OpenClaw 的内置插件使用 `plugin-sdk/bundled-channel-config-schema` 保存继续保留的内置渠道 Schema。已弃用的兼容性导出仍保留在 `plugin-sdk/channel-config-schema-legacy` 中；这两个内置 Schema 子路径都不应作为新插件的范式。

<Warning>
  不要导入带有提供商或渠道品牌名称的便捷接口（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在自身的 `api.ts` / `runtime-api.ts` barrel 中组合通用 SDK 子路径；核心使用方应使用这些插件本地的 barrel，或者在需求确实跨渠道时添加一个范围明确的通用 SDK 契约。

少量内置插件辅助接口在有可追踪的所有者使用时仍会出现在生成的导出映射中。它们仅用于维护内置插件，不推荐作为新第三方插件的导入路径。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作为已弃用的兼容性门面保留，以支持可追踪的所有者使用。不要将这些导入路径复制到新插件中；请改用注入的运行时辅助函数和通用渠道 SDK 子路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域划分的精简子路径公开（插件入口、渠道、提供商、身份验证、运行时、能力、记忆以及为内置插件保留的辅助函数）。完整的分组链接目录请参阅[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；从公共子集中减去 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 所列的仓库本地测试/内部子路径后，会生成软件包导出。运行 `pnpm plugin-sdk:surface` 可审计公共导出数量。已存在足够长时间且未被内置扩展生产代码使用的已弃用公共子路径记录在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中；范围宽泛的已弃用重导出 barrel 记录在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中。

## 注册 API

`register(api)` 回调会接收一个包含以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                             | 注册内容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM）                                                                   |
| `api.registerWorkerProvider(...)`                | 云端工作节点生命周期租约                                                          |
| `api.registerModelCatalogProvider(...)`          | 用于文本和媒体生成的模型目录条目                                                  |
| `api.registerAgentHarness(...)`                  | [实验性](/zh-CN/plugins/sdk-agent-harness)原生智能体执行器（Codex、Copilot）             |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端                                                                 |
| `api.registerChannel(...)`                       | 消息渠道                                                                          |
| `api.registerEmbeddingProvider(...)`             | 可复用的向量嵌入提供商                                                            |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成                                                             |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录                                                                      |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音会话                                                                  |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析                                                                |
| `api.registerTranscriptSourceProvider(...)`      | 实时或导入的会议转录来源                                                          |
| `api.registerImageGenerationProvider(...)`       | 图像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                                                                          |
| `api.registerWebFetchProvider(...)`              | Web 获取 / 抓取提供商                                                             |
| `api.registerWebSearchProvider(...)`             | Web 搜索                                                                          |
| `api.registerCompactionProvider(...)`            | 可插拔的转录压缩后端                                                              |

工作节点提供商还必须在 `contracts.workerProviders` 中声明其 ID。核心会在调用 `provision(profile, operationId)` 之前持久化持久意图。提供商应在分配外部资源之前验证设置，并在永久拒绝配置文件时抛出 `WorkerProviderError`。当操作 ID 重复时，`provision` 必须接管同一租约。
核心会随租约持久化经过验证的配置文件设置，并将该快照提供给必须具备幂等性的 `destroy({ leaseId, profile })`，以及返回 `active`、`destroyed` 或 `unknown` 的 `inspect({ leaseId, profile })`。这样，即使 Gateway 网关重启或命名配置文件被移除，提供商仍能路由生命周期调用。SSH 端点的 `keyRef` 使用 `SecretRef`，绝不能内联密钥材料；还应包含来自可信配置输出的 `hostKey`，其格式必须恰好为 `algorithm base64`，不得包含主机名或注释。核心会固定 `hostKey`，绝不信任首次连接提供的密钥。生成动态 `keyRef` 的提供商可以实现 `resolveSshIdentity({ leaseId, profile, keyRef })`；如果存在，该解析器具有权威性，而未实现它的提供商则使用已配置的通用密钥解析器。
具有可续期租约的提供商还可以实现 `renew(leaseId)`。
遇到暂时性或无法确定的失败时，`inspect` 必须抛出异常；仅在权威确认资源不存在时返回 `unknown`。核心会将仍处于活动状态的本地记录标记为孤立记录；如果已有持久化的销毁请求，则将资源不存在视为拆除完成。

通过 `api.registerEmbeddingProvider(...)` 注册的嵌入提供商还必须列入插件清单的 `contracts.embeddingProviders`。这是用于生成可复用向量的通用嵌入接口。记忆搜索可以使用这一通用提供商接口。较旧的 `api.registerMemoryEmbeddingProvider(...)` 和 `contracts.memoryEmbeddingProviders` 接口属于已弃用的兼容机制，现有的记忆专用提供商正在从中迁移。

仍公开运行时 `batchEmbed(...)` 的记忆专用提供商会继续使用现有的逐文件批处理契约，除非其运行时显式设置 `sourceWideBatchEmbed: true`。选择启用此选项后，记忆宿主可以在宿主批次限制范围内，通过一次 `batchEmbed(...)` 调用提交来自多个已修改记忆文件和已启用来源的分块。上传 JSONL 请求文件的批处理适配器必须同时按照上传大小上限和请求数量上限拆分提供商作业。提供商必须按照与 `batch.chunks` 相同的顺序，为每个输入分块返回一个嵌入；如果提供商需要文件本地批次，或无法在更大的跨来源作业中保持输入顺序，请省略该标志。

### 工具和命令

对于工具名称固定的简单纯工具插件，请使用 [`defineToolPlugin`](/zh-CN/plugins/tool-plugins)。对于混合插件或完全动态的工具注册，请直接使用 `api.registerTool(...)`。

| 方法                                   | 注册内容                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | 智能体工具（必需，或设为 `{ optional: true }`）                                                                                          |
| `api.registerCommand(def)`             | 自定义命令（绕过 LLM）                                                                                                                   |
| `api.registerNodeHostCommand(command)` | 由 `openclaw node run` 处理的命令；可选的 `agentTool` 元数据可以在节点连接期间将其公开为智能体可见的工具                                 |

当智能体需要简短且由命令自身负责的路由提示时，插件命令可以设置 `agentPromptGuidance`。该文本应仅描述命令本身；不要向核心提示词构建器添加提供商或插件专用策略。

指导条目可以是应用于所有提示词接口的旧式字符串，也可以是结构化条目：

```ts
agentPromptGuidance: [
  "全局命令提示。",
  { text: "仅在 OpenClaw 主提示词中显示此内容。", surfaces: ["openclaw_main"] },
];
```

结构化 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已弃用别名。如果确实希望指导应用于所有接口，请省略 `surfaces`。不要传入空的 `surfaces` 数组；系统会拒绝该数组，以免意外丢失作用域后文本变成全局提示词。

原生 Codex 应用服务器的开发者指令比其他提示词接口更严格：只有显式限定到 `codex_app_server` 的指导才会提升到这个更高优先级的通道。为保持兼容性，旧式字符串指导和未限定作用域的结构化指导仍可用于非 Codex 提示词接口。

节点宿主命令在已连接的节点宿主上运行，而不是在 Gateway 网关
进程内部运行。如果存在 `agentTool`，节点会在成功连接 Gateway 网关后发布描述符；
仅当该节点保持连接，并且描述符的 `command` 位于节点获准的命令范围内时，
Gateway 网关才会将其暴露给智能体运行。设置 `agentTool.defaultPlatforms` 可将
非危险命令加入默认节点命令允许列表；否则需要显式配置
`gateway.nodes.allowCommands` 或节点调用策略。`agentTool.name`
必须符合提供商安全要求：以字母开头，仅使用字母、数字、下划线或连字符，
且长度不超过 64 个字符。由 MCP 支持的节点工具可以设置 `agentTool.mcp`
元数据，以便目录和工具搜索界面显示远程 MCP 服务器/工具身份，但执行仍通过
所公布的节点命令进行。

### 基础设施

| 方法                                            | 注册内容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | 事件钩子                                                     |
| `api.registerHttpRoute(params)`                 | Gateway 网关 HTTP 端点                                       |
| `api.registerGatewayMethod(name, handler)`      | Gateway 网关 RPC 方法                                        |
| `api.registerGatewayDiscoveryService(service)`  | 本地 Gateway 网关发现广播服务                                |
| `api.registerCli(registrar, opts?)`             | CLI 子命令                                                    |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的节点功能 CLI                             |
| `api.registerService(service)`                  | 后台服务                                                     |
| `api.registerInteractiveHandler(registration)`  | 交互处理器                                                   |
| `api.registerAgentToolResultMiddleware(...)`    | 运行时工具结果中间件                                         |
| `api.registerMemoryPromptSupplement(builder)`   | 增量式记忆相邻提示词部分                                     |
| `api.registerMemoryCorpusSupplement(adapter)`   | 增量式记忆搜索/读取语料库                                    |
| `api.registerHostedMediaResolver(resolver)`     | 浏览器式托管媒体 URL 的解析器                                |
| `api.registerTextTransforms(transforms)`        | 插件自有的提示词/消息兼容性文本重写                          |
| `api.registerConfigMigration(migrate)`          | 在插件运行时加载前执行的轻量配置迁移                         |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的导入器                                  |
| `api.registerAutoEnableProbe(probe)`            | 可自动启用此插件的配置探针                                   |
| `api.registerReload(registration)`              | 用于处理重新加载的重启/热重载/无操作配置前缀策略             |
| `api.registerNodeHostCommand(command)`          | 暴露给已配对节点的命令处理器                                 |
| `api.registerNodeInvokePolicy(policy)`          | 节点调用命令的允许列表/审批策略                              |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的发现项收集器                     |

记忆提示词补充构建器接收可选的 `agentId`、`agentSessionKey` 和
`sandboxed` 上下文。记忆语料库补充的 `search` 和 `get` 调用接收可选的
`agentId` 和 `sandboxed` 上下文。对于具有智能体自有存储的插件，应在每次调用时
解析相应存储，而不是在注册期间捕获一个全局路径。如果多智能体操作需要智能体 ID
但未提供，则应采用故障关闭策略，而不是任意选择一个智能体。

Telegram 交互处理器可返回 `{ submitText }`，在处理器成功后通过 Telegram 的
常规入站智能体路径路由文本。当入站策略跳过该文本或处理失败时，OpenClaw 会保留
回调按钮，以便用户在阻塞条件发生变化后重试。此结果字段仅适用于 Telegram；
其他渠道保留各自的交互结果契约。

### 工作流插件的宿主钩子

宿主钩子是供需要参与宿主生命周期，而非仅添加提供商、渠道或工具的插件使用的
SDK 接口。它们是通用契约；Plan Mode 可以使用它们，审批工作流、工作区策略门禁、
后台监控器、设置向导和 UI 配套插件也同样可以使用。

| 方法                                                                                 | 负责的契约                                                                                                                                                 |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 由插件拥有、兼容 JSON，并通过 Gateway 网关会话投影的会话状态                                                                                               |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 为一个会话注入下一次智能体轮次的持久化、恰好一次上下文                                                                                                     |
| `api.registerTrustedToolPolicy(...)`                                                 | 受清单限制、在插件工具策略之前运行的可信策略，可阻止或重写工具参数                                                                                          |
| `api.registerToolMetadata(...)`                                                      | 不更改工具实现的工具目录显示元数据                                                                                                                         |
| `api.registerCommand(...)`                                                           | 具有作用域的插件命令；命令结果可设置 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支持 `descriptionLocalizations`                         |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 面向会话、工具、运行、设置或标签页界面的 Control UI 贡献描述符                                                                                             |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重置/删除/重新加载路径上清理插件自有运行时资源的回调                                                                                                     |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用于工作流状态和监控器的脱敏事件订阅                                                                                                                       |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 在运行终止生命周期中清除的单次运行插件暂存状态                                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 插件自有调度器作业的清理元数据；不调度工作或创建任务记录                                                                                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 仅限内置插件、由宿主中介，将文件附件发送至当前活动的直接出站会话路由                                                                                       |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 仅限内置插件、由 Cron 支持的定时会话轮次，以及基于标签的清理                                                                                               |
| `api.session.controls.registerSessionAction(...)`                                    | 客户端可通过 Gateway 网关分派的类型化会话操作                                                                                                              |

`surface: "tab"` 描述符会向 Control UI 添加一个侧边栏标签页。已启用插件的标签页
描述符会通过 Gateway 网关 hello（`controlUiTabs`）公布给仪表板客户端，因此只有
插件启用时才会显示该标签页。内置插件可以为其标签页提供一流的仪表板视图；其他插件
可将 `path` 设置为插件 HTTP 路由（参见 `api.registerHttpRoute(...)`），供仪表板
在沙箱隔离的框架中呈现。`icon` 是仪表板图标名称提示，`group` 用于选择侧边栏
分区（`control` 或 `agent`），`order` 用于对插件标签页排序，而
`requiredScopes` 会向缺少这些操作员权限范围的连接隐藏该标签页：

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "日志簿",
  description: "以屏幕快照构建的时间线方式呈现你的一天。",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

新的插件代码请使用分组命名空间：

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

等效的扁平方法仍作为已弃用的兼容性别名供现有插件使用。不要添加直接调用
`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、
`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、
`api.registerAgentEventSubscription`、`api.emitAgentEvent`、
`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、
`api.registerSessionSchedulerJob`、`api.registerSessionAction`、
`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或
`api.unscheduleSessionTurnsByTag` 的新插件代码。

`scheduleSessionTurn(...)` 是 Gateway 网关 Cron 调度器针对会话作用域提供的
便捷封装。Cron 负责计时，并在轮次运行时创建后台任务记录；插件 SDK 仅约束目标
会话、插件自有命名和清理。如果工作本身需要持久化、多步骤的 Task Flow 状态，
请在定时轮次内使用 `api.runtime.tasks.managedFlows`。

这些契约有意拆分权限：

- 外部插件可以拥有会话扩展、UI 描述符、命令、工具元数据、下一轮注入和普通钩子。
- 可信工具策略在普通 `before_tool_call` 钩子之前运行，并受宿主信任。内置策略
  首先运行；已安装插件的策略需要显式启用，并将其本地 ID 加入
  `contracts.trustedToolPolicies`，随后按插件加载顺序运行。策略 ID 的作用域限定
  于注册该策略的插件。
- 保留命令仅限内置插件拥有。外部插件应使用自己的命令名称或别名。
- `allowPromptInjection=false` 会禁用修改提示词的钩子，包括
  `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、
  旧版 `before_agent_start` 中的提示词字段，以及
  `enqueueNextTurnInjection`。

非 Plan 使用方示例：

| 插件原型                     | 使用的钩子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 审批工作流                   | 会话扩展、命令继续执行、下一轮注入、UI 描述符                                                                                          |
| 预算/工作区策略门控          | 可信工具策略、工具元数据、会话投影                                                                                                     |
| 后台生命周期监控器           | 运行时生命周期清理、智能体事件订阅、会话调度器所有权/清理、Heartbeat 提示词贡献、UI 描述符                                               |
| 设置或新手引导向导           | 会话扩展、限定范围的命令、Control UI 描述符                                                                                            |

<Note>
  保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持为 `operator.admin`，即使插件尝试分配范围更窄的
  Gateway 网关方法权限范围。插件自有的方法应优先使用插件专用前缀。
</Note>

<Accordion title="何时使用工具结果中间件">
  当内置插件和已明确启用且具有匹配清单契约的已安装插件需要在工具执行后、
  运行时将结果反馈给模型前重写工具结果时，可以使用
  `api.registerAgentToolResultMiddleware(...)`。这是适用于 tokenjuice 等
  异步输出归约器的可信、与运行时无关的接入点。

插件必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，
例如 `["openclaw", "codex"]`。没有该契约或未明确启用的已安装插件无法
注册此中间件；对于不需要模型处理前工具结果时序的工作，请继续使用普通的
OpenClaw 插件钩子。旧的仅限嵌入式运行器的扩展工厂注册路径已移除。
</Accordion>

### Gateway 网关设备发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件通过 mDNS/Bonjour 等
本地设备发现传输协议广播活动的 Gateway 网关。启用本地设备发现后，
OpenClaw 会在 Gateway 网关启动期间调用该服务，传入当前 Gateway 网关端口和
非机密的 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的 `stop` 处理程序。

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway 网关设备发现插件不得将广播的 TXT 值视为机密或身份验证信息。
设备发现只是路由提示；信任仍由 Gateway 网关身份验证和 TLS 固定机制负责。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类命令元数据：

- `commands`：注册器拥有的显式命令名称
- `descriptors`：用于 CLI 帮助、路由和插件 CLI 延迟注册的解析时命令描述符
- `parentPath`：嵌套命令组的可选父命令路径，例如 `["nodes"]`

对于已配对节点功能，优先使用
`api.registerNodeCliFeature(registrar, opts?)`。它是
`api.registerCli(..., { parentPath: ["nodes"] })` 的轻量封装，并将
`openclaw nodes canvas` 等命令明确标识为插件自有的节点功能。

如果希望插件命令在常规根 CLI 路径中保持延迟加载，请提供覆盖该注册器所公开
每个顶层命令根的 `descriptors`。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "管理 Matrix 账户、验证、设备和个人资料状态",
        hasSubcommands: true,
      },
    ],
  },
);
```

嵌套命令接收解析后的父命令作为 `program`：

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "从已配对节点捕获或渲染画布内容",
        hasSubcommands: true,
      },
    ],
  },
);
```

仅在不需要延迟注册根 CLI 时单独使用 `commands`。该预加载兼容路径仍受支持，
但它不会为解析时延迟加载安装由描述符支持的占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有 `claude-cli` 或 `my-cli` 等
本地 AI CLI 后端的默认配置。

- 后端 `id` 会成为 `my-cli/gpt-5` 等模型引用中的提供商前缀。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先。运行 CLI 前，OpenClaw 会将
  `agents.defaults.cliBackends.<id>` 合并到插件默认配置之上。
- 当后端需要在合并后执行兼容性重写时（例如规范化旧标志结构），请使用
  `normalizeConfig`。
- 对于属于 CLI 方言的请求范围 argv 重写，请使用 `resolveExecutionArgs`，
  例如将 OpenClaw 思考级别映射到原生工作量标志。该钩子接收
  `ctx.executionMode`；对于临时 `/btw` 调用，请使用 `"side-question"`
  添加后端原生隔离标志。如果这些标志能够可靠地为其他情况下始终开启工具的
  CLI 禁用原生工具，还应声明 `sideQuestionToolMode: "disabled"`。
- 能够为特定运行禁用所有原生工具的后端可以声明
  `nativeToolMode: "selectable"`。受限调用会传入空的
  `ctx.toolAvailability.native` 元组以及精确的主机隔离 MCP 允许列表；
  `resolveExecutionArgs` 必须在最终的新运行或恢复运行 argv 中强制执行两者。
  如果后端无法做到，OpenClaw 将按关闭策略失败。

有关端到端编写指南，请参阅
[CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。

### 独占槽位

| 方法                                       | 注册内容                                                                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能有一个处于活动状态）。当主机能够提供模型/提供商/模式诊断信息时，生命周期回调会收到 `runtimeSettings`；对于较旧的严格引擎，将在不包含该键的情况下重试。 |
| `api.registerMemoryCapability(capability)` | 统一记忆能力                                                                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | 记忆提示词分区构建器                                                                                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆刷新计划解析器                                                                                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器                                                                                                                                                                                   |

### 已弃用的记忆嵌入适配器

| 方法                                           | 注册内容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的记忆嵌入适配器         |

- `registerMemoryCapability` 是首选的独占记忆插件 API。
- `registerMemoryCapability` 还可以公开 `publicArtifacts.listArtifacts(...)`，
  以便配套插件通过 `openclaw/plugin-sdk/memory-host-core` 使用导出的记忆工件，
  而无需访问特定记忆插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是兼容旧版的独占记忆插件 API。
- `MemoryFlushPlan.model` 可以将刷新轮次固定到精确的 `provider/model`
  引用，例如 `ollama/qwen3:8b`，而不继承活动的回退链。
- `registerMemoryEmbeddingProvider` 已弃用。新的嵌入提供商应使用
  `api.registerEmbeddingProvider(...)` 和 `contracts.embeddingProviders`。
- 在迁移窗口期间，现有的记忆专用提供商仍可继续工作，但插件检查会将
  非内置插件中的这种情况报告为兼容性债务。

### 事件和生命周期

| 方法                                         | 作用                 |
| -------------------------------------------- | -------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子   |
| `api.onConversationBindingResolved(handler)` | 对话绑定回调         |

有关示例、常用钩子名称和守卫语义，请参阅
[插件钩子](/zh-CN/plugins/hooks)。

### 钩子决策语义

`before_install` 是插件运行时生命周期钩子，而不是操作员安装策略接口。
当允许/阻止决策必须覆盖 CLI 和由 Gateway 网关支持的安装或更新路径时，
请使用 `security.installPolicy`。

- `before_tool_call`：返回 `{ block: true }` 后即终止。一旦任何处理程序设置此值，优先级更低的处理程序将被跳过。
- `before_tool_call`：返回 `{ block: false }` 视为未作决定（与省略 `block` 相同），而不是覆盖之前的决定。
- `before_install`：返回 `{ block: true }` 后即终止。一旦任何处理程序设置此值，优先级更低的处理程序将被跳过。
- `before_install`：返回 `{ block: false }` 视为未作决定（与省略 `block` 相同），而不是覆盖之前的决定。
- `reply_dispatch`：返回 `{ handled: true, ... }` 后即终止。一旦任何处理程序接管分发，优先级更低的处理程序和默认模型分发路径都将被跳过。
- `message_sending`：返回 `{ cancel: true }` 后即终止。一旦任何处理程序设置此值，优先级更低的处理程序将被跳过。
- `message_sending`：返回 `{ cancel: false }` 视为未作决定（与省略 `cancel` 相同），而不是覆盖之前的决定。
- `message_received`：需要对入站线程/话题进行路由时，请使用类型化的 `threadId` 字段。将 `metadata` 保留用于渠道特有的附加信息。
- `message_sending`：请优先使用类型化的 `replyToId` / `threadId` 路由字段，再回退到渠道特有的 `metadata`。
- `gateway_start`：对于 Gateway 网关所拥有的启动状态，请使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，而不要依赖内部 `gateway:startup` 钩子。此时 Cron 可能仍在加载。
- `cron_reconciled`：在启动或调度器重新加载后，重建完整的外部 cron 投影。它包含 `reason` 和实际生效的 `enabled` 状态（包括 `enabled: false`），而 `ctx.getCron?.()` 返回准确的已协调调度器。将 `ctx.abortSignal` 传入持久投影工作；当该调度器快照被取代或 Gateway 网关关闭时，它会中止。
- `cron_changed`：观察 Gateway 网关所拥有的 cron 生命周期变更。`scheduled` 和 `removed` 事件是提交后的协调提示，而不是有序的增量日志。当作业没有下一次唤醒时，已调度事件的 `event.nextRunAtMs` 不存在；已移除事件仍会携带已删除作业的快照。

外部唤醒调度器应对 `cron_changed` 事件进行防抖或合并，
然后从 `cron_reconciled` 最后捕获的调度器中重新读取完整的持久视图。
不要采用 `cron_changed` 上下文中的调度器：来自较旧调度器的
分离提示可能与之后的重新加载重叠。

对于在 Gateway 网关启动或调度器替换时加载的持久状态，请使用
`cron_reconciled` 作为完整快照触发器。仅重新热加载插件时不会重放该事件。
观察处理程序并行运行，而且即发即弃的分发可能相互重叠，因此消费者
不得依赖事件完成顺序。应始终以 OpenClaw 作为到期检查和执行的事实来源。

有关支持持久替换、重试/退避和干净关闭的单航班适配器，请参阅
[安全的外部 cron 投影](/zh-CN/plugins/hooks#safe-external-cron-projection)。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 ID                                                                                     |
| `api.name`               | `string`                  | 显示名称                                                                                    |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                            |
| `api.description`        | `string?`                 | 插件描述（可选）                                                                            |
| `api.source`             | `string`                  | 插件源路径                                                                                  |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                          |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为内存中活动的运行时快照）                                              |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件特定配置                                            |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助函数](/zh-CN/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | 作用域限定的日志记录器（`debug`、`info`、`warn`、`error`）                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是加载完整入口之前的轻量级启动/设置窗口                     |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                                  |

## 内部模块约定

在你的插件中，使用本地桶文件进行内部导入：

```text
my-plugin/
  api.ts            # 面向外部消费者的公共导出
  runtime-api.ts    # 仅供内部使用的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅用于设置的轻量级入口（可选）
```

<Warning>
  切勿在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。请通过 `./api.ts` 或
  `./runtime-api.ts` 进行内部导入。SDK 路径仅用作外部契约。
</Warning>

对于由 facade 加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及类似的公共入口文件），如果 OpenClaw
已在运行，则优先使用活动的运行时配置快照。如果运行时快照尚不存在，
则回退到磁盘上解析出的配置文件。打包的内置插件 facade 应通过 OpenClaw
的插件 facade 加载器加载；直接从 `dist/extensions/...` 导入会绕过
打包安装对插件自有代码所使用的清单和运行时 sidecar 检查。

当辅助函数被有意限定于特定提供商，并且尚不适合放入通用 SDK
子路径时，提供商插件可以公开范围较窄的插件本地契约桶文件。内置示例：

- **Anthropic**：用于 Claude beta 标头和 `service_tier`
  流辅助函数的公共 `api.ts` / `contract-api.ts` 接口。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、
  默认模型辅助函数和实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器，
  以及新手引导/配置辅助函数。

<Warning>
  扩展的生产代码也应避免从 `openclaw/plugin-sdk/<other-plugin>`
  导入。如果某个辅助函数确实是共享的，请将其提升到中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他
  面向能力的表面，而不是将两个插件耦合在一起。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="入口点" icon="door-open" href="/zh-CN/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="运行时辅助函数" icon="gears" href="/zh-CN/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="设置和配置" icon="sliders" href="/zh-CN/plugins/sdk-setup">
    打包、清单和配置 schema。
  </Card>
  <Card title="测试" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试实用工具和 lint 规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用的表面迁移。
  </Card>
  <Card title="插件内部机制" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入了解架构和能力模型。
  </Card>
</CardGroup>
