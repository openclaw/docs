---
read_when:
    - 你需要知道应从哪个 SDK 子路径导入
    - 你需要一份 OpenClawPluginApi 所有注册方法的参考文档
    - 你正在查找特定的 SDK 导出项
sidebarTitle: Plugin SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-07-11T20:50:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**要导入什么**以及**可以注册什么**的参考。

<Note>
  本页面向在 OpenClaw 内部使用 `openclaw/plugin-sdk/*` 的插件作者。对于希望通过 Gateway 网关运行智能体的外部应用、脚本、仪表板、CI 作业和 IDE 扩展，请改用
  [外部应用的 Gateway 网关集成](/zh-CN/gateway/external-apps)。
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

每个子路径都是一个小型、自包含的模块。这可以保持快速启动，并防止循环依赖问题。对于渠道专用的入口和构建辅助函数，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给更广泛的总括接口以及 `buildChannelConfigSchema` 等共享辅助函数。

对于渠道配置，通过 `openclaw.plugin.json#channelConfigs` 发布渠道自有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享的 Schema 基础组件和通用构建器。OpenClaw 的内置插件使用 `plugin-sdk/bundled-channel-config-schema` 来保留内置渠道的 Schema。已弃用的兼容性导出仍保留在 `plugin-sdk/channel-config-schema-legacy` 中；这两个内置 Schema 子路径都不应作为新插件的参考模式。

<Warning>
  不要导入带有提供商或渠道品牌的便捷接口（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在其自身的 `api.ts` / `runtime-api.ts` 桶文件中组合通用 SDK 子路径；核心使用方应使用这些插件本地桶文件，或者在需求确实跨渠道时添加一个范围明确的通用 SDK 契约。

少量内置插件辅助接口在有明确所有者使用记录时，仍会出现在生成的导出映射中。它们仅用于维护内置插件，不建议作为新第三方插件的导入路径。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作为已弃用的兼容性门面保留，以支持有记录的所有者用法。不要在新插件中复制这些导入路径；请改用注入的运行时辅助函数和通用渠道 SDK 子路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域划分的范围明确的子路径公开，包括插件入口、渠道、提供商、身份验证、运行时、能力、记忆，以及为内置插件保留的辅助函数。有关经过分组并附有链接的完整目录，请参阅[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；从公共子集中排除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 所列的仓库本地测试和内部子路径后，会生成软件包导出。运行 `pnpm plugin-sdk:surface` 可审计公共导出数量。已弃用且存在时间足够长、同时未被内置扩展生产代码使用的公共子路径记录在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中；范围宽泛的已弃用再导出桶文件记录在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中。

## 注册 API

`register(api)` 回调接收一个包含以下方法的 `OpenClawPluginApi` 对象：

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
| `api.registerMediaUnderstandingProvider(...)`    | 图像、音频和视频分析                                                              |
| `api.registerTranscriptSourceProvider(...)`      | 实时或导入的会议转录来源                                                          |
| `api.registerImageGenerationProvider(...)`       | 图像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                                                                          |
| `api.registerWebFetchProvider(...)`              | Web 获取 / 抓取提供商                                                             |
| `api.registerWebSearchProvider(...)`             | Web 搜索                                                                          |
| `api.registerCompactionProvider(...)`            | 可插拔的转录压缩后端                                                              |

工作节点提供商还必须在 `contracts.workerProviders` 中声明其 ID。核心会在调用 `provision(profile, operationId)` 前持久化长期意图。提供商必须在分配外部资源前验证设置，并在配置永久被拒绝时抛出 `WorkerProviderError`。当操作 ID 重复时，`provision` 必须接管同一个租约。
核心会将经过验证的配置设置与租约一同持久化，并将该快照提供给必须具备幂等性的 `destroy({ leaseId, profile })`，以及返回 `active`、`destroyed` 或 `unknown` 的 `inspect({ leaseId, profile })`。这样，提供商便可在 Gateway 网关重启或命名配置被移除后继续路由生命周期调用。SSH 端点的 `keyRef` 使用 `SecretRef`，绝不能内联密钥材料；还必须包含来自可信配置输出的 `hostKey`，其格式必须严格为 `algorithm base64`，不得包含主机名或注释。核心会固定 `hostKey`，绝不信任首次连接时获得的密钥。生成动态 `keyRef` 的提供商可以实现 `resolveSshIdentity({ leaseId, profile, keyRef })`；如果存在，该解析器具有权威性，而未实现该解析器的提供商则使用已配置的通用密钥解析器。
具有可续期租约的提供商还可以实现 `renew(leaseId)`。
遇到暂时性或无法确定的故障时，`inspect` 必须抛出错误；只有在权威确认不存在时才返回 `unknown`。核心会将活跃的本地记录标记为孤立状态；如果已有持久化的销毁请求，则将该缺失视为拆除完成。

通过 `api.registerEmbeddingProvider(...)` 注册的嵌入提供商还必须列在插件清单的 `contracts.embeddingProviders` 中。这是用于生成可复用向量的通用嵌入接口。记忆搜索可以使用此通用提供商接口。较旧的 `api.registerMemoryEmbeddingProvider(...)` 和 `contracts.memoryEmbeddingProviders` 接口是已弃用的兼容性接口，仅在现有记忆专用提供商迁移期间保留。

仍公开运行时 `batchEmbed(...)` 的记忆专用提供商继续使用现有的逐文件批处理契约，除非其运行时显式设置 `sourceWideBatchEmbed: true`。启用后，记忆宿主可以在一次 `batchEmbed(...)` 调用中提交来自多个已修改记忆文件和已启用来源的分块，数量不超过宿主的批处理限制。上传 JSONL 请求文件的批处理适配器除了遵守请求数量上限，还必须在达到上传大小上限前拆分提供商作业。提供商必须按照与 `batch.chunks` 相同的顺序为每个输入分块返回一个嵌入。如果提供商要求批次仅包含单个文件，或者无法在较大的跨来源作业中保持输入顺序，请省略该标志。

### 工具和命令

对于工具名称固定的简单纯工具插件，请使用 [`defineToolPlugin`](/zh-CN/plugins/tool-plugins)。对于混合型插件或完全动态的工具注册，请直接使用 `api.registerTool(...)`。

| 方法                                   | 注册内容                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | 智能体工具（必需，或设为 `{ optional: true }`）                                                                                          |
| `api.registerCommand(def)`             | 自定义命令（绕过 LLM）                                                                                                                   |
| `api.registerNodeHostCommand(command)` | 由 `openclaw node run` 处理的命令；可选的 `agentTool` 元数据可在节点连接时将其公开为智能体可见的工具                                      |

当智能体需要一条简短且由命令自身拥有的路由提示时，插件命令可以设置 `agentPromptGuidance`。该文本应仅涉及命令本身；不要向核心提示词构建器添加提供商或插件专用策略。

指导条目可以是应用于每个提示词接口的旧式字符串，也可以是结构化条目：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

结构化的 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已弃用别名。如果有意让指导应用于所有接口，请省略 `surfaces`。不要传递空的 `surfaces` 数组；该数组会被拒绝，以免意外丢失作用域后变成全局提示词文本。

原生 Codex 应用服务器的开发者指令比其他提示词接口更严格：只有显式限定到 `codex_app_server` 的指导才会提升到该更高优先级通道。为保持兼容性，旧式字符串指导和未限定作用域的结构化指导仍可用于非 Codex 提示词接口。

节点主机命令在已连接的节点主机上运行，而不是在 Gateway 网关进程内运行。如果存在 `agentTool`，节点会在成功连接 Gateway 网关后发布描述符；仅当该节点保持连接，且描述符的 `command` 位于该节点已批准的命令范围内时，Gateway 网关才会将其提供给智能体运行。设置 `agentTool.defaultPlatforms` 可将非危险命令加入默认节点命令允许列表；否则需要显式配置 `gateway.nodes.allowCommands` 或节点调用策略。`agentTool.name` 必须符合提供商安全要求：以字母开头，仅使用字母、数字、下划线或连字符，并且不超过 64 个字符。由 MCP 支持的节点工具可以设置 `agentTool.mcp` 元数据，以便目录和工具搜索界面显示远程 MCP 服务器/工具身份，但执行仍通过已发布的节点命令进行。

### 基础设施

| 方法                                            | 注册内容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | 事件钩子                                                     |
| `api.registerHttpRoute(params)`                 | Gateway 网关 HTTP 端点                                       |
| `api.registerGatewayMethod(name, handler)`      | Gateway 网关 RPC 方法                                        |
| `api.registerGatewayDiscoveryService(service)`  | 本地 Gateway 网关设备发现广播器                              |
| `api.registerCli(registrar, opts?)`             | CLI 子命令                                                    |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的节点功能 CLI                            |
| `api.registerService(service)`                  | 后台服务                                                     |
| `api.registerInteractiveHandler(registration)`  | 交互处理程序                                                 |
| `api.registerAgentToolResultMiddleware(...)`    | 运行时工具结果中间件                                         |
| `api.registerMemoryPromptSupplement(builder)`   | 附加的记忆相关提示词部分                                     |
| `api.registerMemoryCorpusSupplement(adapter)`   | 附加的记忆搜索/读取语料库                                    |
| `api.registerHostedMediaResolver(resolver)`     | 用于浏览器式托管媒体 URL 的解析器                            |
| `api.registerTextTransforms(transforms)`        | 插件自有的提示词/消息兼容性文本重写                          |
| `api.registerConfigMigration(migrate)`          | 在插件运行时加载前执行的轻量级配置迁移                       |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的导入器                                  |
| `api.registerAutoEnableProbe(probe)`            | 可自动启用此插件的配置探测器                                 |
| `api.registerReload(registration)`              | 用于处理重新加载的重启/热加载/无操作配置前缀策略             |
| `api.registerNodeHostCommand(command)`          | 向已配对节点公开的命令处理程序                               |
| `api.registerNodeInvokePolicy(policy)`          | 节点调用命令的允许列表/审批策略                              |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的发现项收集器                     |

记忆提示词补充构建器会接收可选的 `agentId`、`agentSessionKey` 和 `sandboxed` 上下文。记忆语料库补充的 `search` 和 `get` 调用会接收可选的 `agentId` 和 `sandboxed` 上下文。拥有智能体存储的插件应在每次调用时解析对应存储，而不是在注册期间捕获单个全局路径。如果多智能体操作需要智能体 ID 但未提供，则应采用封闭式失败，而不是任意选择一个智能体。

Telegram 交互处理程序可以返回 `{ submitText }`，在处理程序成功后，通过 Telegram 的常规入站智能体路径路由文本。当入站策略跳过该文本或处理失败时，OpenClaw 会保留回调按钮，以便用户在阻塞条件发生变化后重试。此结果字段仅适用于 Telegram；其他渠道继续使用各自的交互结果契约。

### 工作流插件的主机钩子

主机钩子是 SDK 为需要参与主机生命周期，而不只是添加提供商、渠道或工具的插件提供的接入界面。它们是通用契约；Plan Mode 可以使用它们，审批工作流、工作区策略门控、后台监控器、设置向导和 UI 配套插件也同样可以使用。

| 方法                                                                                 | 所负责的契约                                                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 插件自有且兼容 JSON 的会话状态，通过 Gateway 网关会话进行投影                                                                                              |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 注入一个会话下一次智能体轮次的持久化、恰好一次上下文                                                                                                       |
| `api.registerTrustedToolPolicy(...)`                                                 | 由清单门控、在插件前执行的可信工具策略，可阻止或重写工具参数                                                                                                |
| `api.registerToolMetadata(...)`                                                      | 工具目录显示元数据，不更改工具实现                                                                                                                         |
| `api.registerCommand(...)`                                                           | 具有作用域的插件命令；命令结果可设置 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支持 `descriptionLocalizations`                         |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 用于会话、工具、运行、设置或标签页界面的 Control UI 贡献描述符                                                                                              |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重置/删除/重新加载路径中清理插件自有运行时资源的回调                                                                                                      |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用于工作流状态和监控器的净化事件订阅                                                                                                                       |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 按运行隔离的插件暂存状态，在运行进入终止生命周期时清除                                                                                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 插件自有调度器作业的清理元数据；不会调度工作或创建任务记录                                                                                                 |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 仅限内置插件，由主机中介将文件附件传送到当前直接出站会话路由                                                                                               |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 仅限内置插件，由 Cron 支持的定时会话轮次以及基于标签的清理                                                                                                  |
| `api.session.controls.registerSessionAction(...)`                                    | 客户端可通过 Gateway 网关分发的类型化会话操作                                                                                                              |

`surface: "tab"` 描述符会向 Control UI 添加侧边栏标签页。已启用插件的标签页描述符会在 Gateway 网关的 hello 消息（`controlUiTabs`）中发布给仪表板客户端，因此仅当插件启用时，该标签页才会显示。内置插件可以为其标签页提供一等的仪表板视图；其他插件可以将 `path` 设置为插件 HTTP 路由（参见 `api.registerHttpRoute(...)`），由仪表板在沙箱隔离的框架中渲染。`icon` 是仪表板图标名称提示，`group` 用于选择侧边栏分区（`control` 或 `agent`），`order` 用于在插件标签页之间排序，而 `requiredScopes` 会对缺少这些操作员权限范围的连接隐藏该标签页：

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

新的插件代码应使用分组命名空间：

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

等效的扁平方法仍作为现有插件的已弃用兼容别名提供。不要添加直接调用 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的新插件代码。

`scheduleSessionTurn(...)` 是基于 Gateway 网关 Cron 调度器、限定于会话作用域的便捷接口。Cron 负责计时，并在轮次运行时创建后台任务记录；插件 SDK 只约束目标会话、插件自有命名和清理。当定时轮次中的工作本身需要持久化的多步骤 Task Flow 状态时，请使用 `api.runtime.tasks.managedFlows`。

这些契约有意拆分权限：

- 外部插件可以拥有会话扩展、UI 描述符、命令、工具元数据、下一轮注入和常规钩子。
- 可信工具策略在普通 `before_tool_call` 钩子之前运行，并受到主机信任。内置策略最先运行；已安装插件的策略需要显式启用，并且其本地 ID 必须列在 `contracts.trustedToolPolicies` 中，随后按插件加载顺序运行。策略 ID 的作用域限定于注册该策略的插件。
- 保留命令的所有权仅限内置插件。外部插件应使用自己的命令名称或别名。
- `allowPromptInjection=false` 会禁用修改提示词的钩子，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、旧版 `before_agent_start` 中的提示词字段以及 `enqueueNextTurnInjection`。

非 Plan 使用方示例：

| 插件原型                     | 使用的钩子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 审批工作流                   | 会话扩展、命令继续执行、下一轮注入、UI 描述符                                                            |
| 预算/工作区策略门控          | 可信工具策略、工具元数据、会话投影                                                                                 |
| 后台生命周期监控器           | 运行时生命周期清理、智能体事件订阅、会话调度器所有权/清理、Heartbeat 提示词贡献、UI 描述符 |
| 设置或新手引导向导           | 会话扩展、限定范围的命令、Control UI 描述符                                                                              |

<Note>
  保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持为 `operator.admin`，即使插件尝试分配
  范围更窄的 Gateway 网关方法权限范围。插件拥有的方法应优先使用
  插件专用前缀。
</Note>

<Accordion title="何时使用工具结果中间件">
  当内置插件以及已明确启用且清单契约匹配的已安装插件
  需要在工具执行后、运行时将结果反馈给模型前重写工具结果时，可以使用
  `api.registerAgentToolResultMiddleware(...)`。这是面向 tokenjuice
  等异步输出归约器的可信、运行时中立接口。

插件必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，
例如 `["openclaw", "codex"]`。没有该契约或未明确启用的已安装插件
无法注册此中间件；对于不需要模型前工具结果处理时机的工作，
请继续使用常规 OpenClaw 插件钩子。旧的
仅限嵌入式运行器的扩展工厂注册路径已被移除。
</Accordion>

### Gateway 网关设备发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件在 mDNS/Bonjour
等本地设备发现传输协议上公布活动的 Gateway 网关。当本地设备发现已启用时，
OpenClaw 会在 Gateway 网关启动期间调用该服务，传入当前 Gateway 网关端口和
非机密 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的 `stop` 处理程序。

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

Gateway 网关设备发现插件不得将公布的 TXT 值视为机密信息或
身份验证凭据。设备发现仅提供路由提示；信任仍由 Gateway 网关身份验证和 TLS 固定
负责。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两种命令元数据：

- `commands`：注册器拥有的显式命令名称
- `descriptors`：用于 CLI 帮助、路由和插件 CLI 延迟注册的
  解析时命令描述符
- `parentPath`：嵌套命令组的可选父命令路径，例如
  `["nodes"]`

对于已配对节点功能，优先使用
`api.registerNodeCliFeature(registrar, opts?)`。它是
`api.registerCli(..., { parentPath: ["nodes"] })` 的小型封装，
可将 `openclaw nodes canvas` 等命令明确标识为插件拥有的节点功能。

如果你希望插件命令在常规根 CLI 路径中保持延迟加载，
请提供覆盖该注册器公开的每个顶层命令根的 `descriptors`。

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
        description: "管理 Matrix 账号、验证、设备和个人资料状态",
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

仅在不需要延迟注册根 CLI 时单独使用 `commands`。
该即时兼容路径仍受支持，但不会安装由描述符支持的占位符，
因此无法进行解析时延迟加载。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有 `claude-cli` 或
`my-cli` 等本地 AI CLI 后端的默认配置。

- 后端 `id` 会成为 `my-cli/gpt-5` 等模型引用中的提供商前缀。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先。运行 CLI 前，OpenClaw 会将
  `agents.defaults.cliBackends.<id>` 合并到插件默认配置之上。
- 当后端需要在合并后进行兼容性重写时，请使用 `normalizeConfig`
  （例如规范化旧版标志结构）。
- 对于属于 CLI 方言的请求范围 argv 重写，请使用 `resolveExecutionArgs`，
  例如将 OpenClaw 思考级别映射到原生工作强度标志。该钩子接收
  `ctx.executionMode`；对于临时 `/btw` 调用，请使用 `"side-question"`
  添加后端原生隔离标志。如果这些标志能可靠地为默认始终启用原生工具的 CLI
  禁用原生工具，也请声明 `sideQuestionToolMode: "disabled"`。
- 能够为特定运行禁用所有原生工具的后端可以声明
  `nativeToolMode: "selectable"`。受限调用会传入空的
  `ctx.toolAvailability.native` 元组以及精确的主机隔离 MCP 允许列表；
  `resolveExecutionArgs` 必须在最终的全新或恢复 argv 中同时强制执行两者。
  如果后端无法做到这一点，OpenClaw 会采用故障关闭策略。

有关端到端编写指南，请参阅
[CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。

### 独占槽位

| 方法                                       | 注册内容                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能有一个处于活动状态）。当宿主可以提供模型/提供商/模式诊断信息时，生命周期回调会接收 `runtimeSettings`；对于旧版严格引擎，会在不带该键的情况下重试。 |
| `api.registerMemoryCapability(capability)` | 统一记忆能力                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | 记忆提示词章节构建器                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆刷新计划解析器                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器                                                                                                                                                                             |

### 已弃用的记忆嵌入适配器

| 方法                                           | 注册内容                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的记忆嵌入适配器 |

- `registerMemoryCapability` 是首选的独占记忆插件 API。
- `registerMemoryCapability` 还可以公开 `publicArtifacts.listArtifacts(...)`，
  以便配套插件通过 `openclaw/plugin-sdk/memory-host-core`
  使用导出的记忆制品，而无需访问特定记忆插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是兼容旧版的独占记忆插件 API。
- `MemoryFlushPlan.model` 可以将刷新轮次固定到精确的 `provider/model`
  引用，例如 `ollama/qwen3:8b`，而不继承活动的回退链。
- `registerMemoryEmbeddingProvider` 已弃用。新的嵌入提供商
  应使用 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 现有的记忆专用提供商在迁移窗口期间仍可继续工作，
  但插件检查会将非内置插件中的这种情况报告为兼容性债务。

### 事件和生命周期

| 方法                                         | 作用                          |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子            |
| `api.onConversationBindingResolved(handler)` | 对话绑定回调                  |

有关示例、常见钩子名称和守卫语义，请参阅
[插件钩子](/zh-CN/plugins/hooks)。

### 钩子决策语义

`before_install` 是插件运行时生命周期钩子，而不是操作员安装
策略接口。当允许/阻止决策必须覆盖 CLI 和由 Gateway 网关支持的安装或更新路径时，
请使用 `security.installPolicy`。

- `before_tool_call`：返回 `{ block: true }` 即为终止决定。一旦任一处理程序设置该值，就会跳过优先级较低的处理程序。
- `before_tool_call`：返回 `{ block: false }` 会被视为未作决定（与省略 `block` 相同），而不是覆盖决定。
- `before_install`：返回 `{ block: true }` 即为终止决定。一旦任一处理程序设置该值，就会跳过优先级较低的处理程序。
- `before_install`：返回 `{ block: false }` 会被视为未作决定（与省略 `block` 相同），而不是覆盖决定。
- `reply_dispatch`：返回 `{ handled: true, ... }` 即为终止决定。一旦任一处理程序接管分派，就会跳过优先级较低的处理程序和默认模型分派路径。
- `message_sending`：返回 `{ cancel: true }` 即为终止决定。一旦任一处理程序设置该值，就会跳过优先级较低的处理程序。
- `message_sending`：返回 `{ cancel: false }` 会被视为未作决定（与省略 `cancel` 相同），而不是覆盖决定。
- `message_received`：需要进行入站线程/主题路由时，请使用类型化的 `threadId` 字段。`metadata` 应保留用于渠道特定的附加信息。
- `message_sending`：应先使用类型化的 `replyToId` / `threadId` 路由字段，再回退到渠道特定的 `metadata`。
- `gateway_start`：对于 Gateway 网关负责的启动状态，请使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，不要依赖内部 `gateway:startup` 钩子。此时 Cron 可能仍在加载。
- `cron_reconciled`：在启动或调度器重新加载后，重新构建完整的外部 Cron 投影。它包含 `reason` 和实际生效的 `enabled` 状态（包括 `enabled: false`），而 `ctx.getCron?.()` 返回完成协调后的确切调度器。请将 `ctx.abortSignal` 传入持久投影工作；当该调度器快照被取代或 Gateway 网关闭时，它会中止。
- `cron_changed`：观察由 Gateway 网关负责的 Cron 生命周期变更。`scheduled` 和 `removed` 事件是提交后的协调提示，而不是有序的增量日志。当任务没有下一次唤醒时间时，已调度事件中不会包含 `event.nextRunAtMs`；已移除事件仍会携带被删除任务的快照。

外部唤醒调度器应对 `cron_changed` 事件进行防抖或合并，
然后从 `cron_reconciled` 最后捕获的调度器中重新读取完整的持久视图。
不要采用 `cron_changed` 上下文中的调度器：来自旧调度器的游离提示
可能与后续的重新加载重叠。

对于在 Gateway 网关启动或调度器替换时加载的持久状态，请使用
`cron_reconciled` 作为完整快照触发器。仅重新热加载插件时不会重放该事件。
观察处理程序并行运行，且即发即弃的分派可能重叠，因此使用方不得依赖事件
完成顺序。到期检查和执行应始终以 OpenClaw 为事实来源。

有关支持持久替换、重试/退避和干净关闭的单次执行适配器，请参阅
[安全的外部 Cron 投影](/zh-CN/plugins/hooks#safe-external-cron-projection)。

### API 对象字段

| 字段                     | 类型                      | 说明                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 ID                                                                                     |
| `api.name`               | `string`                  | 显示名称                                                                                    |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                            |
| `api.description`        | `string?`                 | 插件说明（可选）                                                                            |
| `api.source`             | `string`                  | 插件源路径                                                                                  |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                          |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（如果可用，则为活跃的内存中运行时快照）                                        |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件特定配置                                            |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/zh-CN/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | 作用域限定的日志记录器（`debug`、`info`、`warn`、`error`）                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是加载完整入口之前的轻量级启动/设置窗口                     |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                                  |

## 内部模块约定

在你的插件中，使用本地桶文件进行内部导入：

```text
my-plugin/
  api.ts            # 面向外部使用方的公共导出
  runtime-api.ts    # 仅供内部使用的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅用于轻量级设置的入口（可选）
```

<Warning>
  切勿在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。内部导入应通过 `./api.ts` 或
  `./runtime-api.ts` 进行。SDK 路径仅作为外部契约。
</Warning>

通过门面加载的内置插件公共接口（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 和类似的公共入口文件）在 OpenClaw 已运行时，
优先使用活跃的运行时配置快照。如果尚无运行时快照，
则回退到磁盘上已解析的配置文件。
已打包内置插件的门面应通过 OpenClaw 的插件门面加载器加载；直接从
`dist/extensions/...` 导入会绕过已打包安装在处理插件自有代码时所使用的
清单和运行时伴随文件检查。

如果某个辅助工具被有意设计为提供商特定功能，且尚不适合放入通用 SDK
子路径，提供商插件可以公开一个范围有限的插件本地契约桶文件。内置示例：

- **Anthropic**：面向 Claude 测试版请求头和 `service_tier`
  流辅助工具的公共 `api.ts` / `contract-api.ts` 接口。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、
  默认模型辅助工具和实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器，
  以及新手引导/配置辅助工具。

<Warning>
  扩展的生产代码也应避免从 `openclaw/plugin-sdk/<other-plugin>`
  导入。如果某个辅助工具确实是共享的，请将其提升到中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他
  面向能力的接口，而不是将两个插件耦合在一起。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="入口点" icon="door-open" href="/zh-CN/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="运行时辅助工具" icon="gears" href="/zh-CN/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="设置和配置" icon="sliders" href="/zh-CN/plugins/sdk-setup">
    打包、清单和配置模式。
  </Card>
  <Card title="测试" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试实用工具和 lint 规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用的接口迁移。
  </Card>
  <Card title="插件内部机制" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入了解架构和能力模型。
  </Card>
</CardGroup>
