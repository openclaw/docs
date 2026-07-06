---
read_when:
    - 你需要知道要从哪个 SDK 子路径导入
    - 你想要一份 OpenClawPluginApi 上所有注册方法的参考
    - 你正在查找一个特定的 SDK 导出
sidebarTitle: Plugin SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-07-06T21:50:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2c03d5321285292bfcb2d241b158e59be1a43e5b75bf5ca92a57bf63d9a791f
    source_path: plugins/sdk-overview.md
    workflow: 16
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**要导入什么**以及**可以注册什么**的参考。

<Note>
  本页面面向在 OpenClaw 内部使用 `openclaw/plugin-sdk/*` 的插件作者。对于想通过 Gateway 网关运行智能体的外部应用、脚本、仪表板、CI 任务和 IDE 扩展，请改用
  [外部应用的 Gateway 网关集成](/zh-CN/gateway/external-apps)。
</Note>

<Tip>
想找操作指南？从[构建插件](/zh-CN/plugins/building-plugins)开始。渠道使用[渠道插件](/zh-CN/plugins/sdk-channel-plugins)，模型提供商使用[提供商插件](/zh-CN/plugins/sdk-provider-plugins)，本地 AI CLI 后端使用 [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)，原生智能体执行器使用 [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)，工具或生命周期钩子使用[插件钩子](/zh-CN/plugins/hooks)。
</Tip>

## 导入约定

始终从具体子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是小型、自包含的模块。这样可以保持启动速度，并防止循环依赖问题。对于渠道专用的入口/构建辅助工具，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 留给更宽泛的总括表面和共享辅助工具，例如 `buildChannelConfigSchema`。

对于渠道配置，请通过 `openclaw.plugin.json#channelConfigs` 发布渠道自有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享 schema 原语和通用构建器。OpenClaw 的内置插件使用 `plugin-sdk/bundled-channel-config-schema` 来保留内置渠道 schema。已弃用的兼容性导出仍保留在 `plugin-sdk/channel-config-schema-legacy`；这两个内置 schema 子路径都不是新插件应采用的模式。

<Warning>
  不要导入带提供商或渠道品牌的便利接口（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。内置插件会在自己的 `api.ts` / `runtime-api.ts` barrel 内组合通用 SDK 子路径；核心消费者应使用这些插件本地 barrel，或在需求确实跨渠道时添加一个窄的通用 SDK 契约。

当一小组内置插件辅助接口存在已跟踪的所有者使用时，它们仍会出现在生成的导出映射中。它们仅用于内置插件维护，不推荐作为新的第三方插件导入路径。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作为已弃用的兼容性 facade 保留，用于已跟踪的所有者使用。不要将这些导入路径复制到新插件中；请改用注入的运行时辅助工具和通用渠道 SDK 子路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域分组的窄子路径公开（插件入口、渠道、提供商、认证、运行时、能力、记忆，以及保留的内置插件辅助工具）。完整目录按组列出并带链接，见[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；包导出是在扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的仓库本地测试/内部子路径后，从公共子集生成的。运行 `pnpm plugin-sdk:surface` 来审计公共导出数量。足够旧且未被内置扩展生产代码使用的已弃用公共子路径在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中跟踪；宽泛的已弃用重导出 barrel 在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中跟踪。

## 注册 API

`register(api)` 回调会收到一个包含以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                             | 注册内容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM）                                                                  |
| `api.registerModelCatalogProvider(...)`          | 文本和媒体生成的模型目录行                                                       |
| `api.registerAgentHarness(...)`                  | [实验性](/zh-CN/plugins/sdk-agent-harness)原生智能体执行器（Codex、Copilot）           |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端                                                                |
| `api.registerChannel(...)`                       | 消息渠道                                                                          |
| `api.registerEmbeddingProvider(...)`             | 可复用的向量嵌入提供商                                                           |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成                                                            |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录                                                                      |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音会话                                                                  |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析                                                               |
| `api.registerTranscriptSourceProvider(...)`      | 实时或导入的会议转录来源                                                         |
| `api.registerImageGenerationProvider(...)`       | 图像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                                                                          |
| `api.registerWebFetchProvider(...)`              | Web 获取 / 抓取提供商                                                            |
| `api.registerWebSearchProvider(...)`             | Web 搜索                                                                          |
| `api.registerCompactionProvider(...)`            | 可插拔的转录压缩后端                                                             |

通过 `api.registerEmbeddingProvider(...)` 注册的嵌入提供商还必须列在插件清单的 `contracts.embeddingProviders` 中。这是用于可复用向量生成的通用嵌入表面。记忆搜索可以使用这个通用提供商表面。较旧的 `api.registerMemoryEmbeddingProvider(...)` 和 `contracts.memoryEmbeddingProviders` 接口是已弃用的兼容性保留，供现有记忆专用提供商迁移期间使用。

仍暴露运行时 `batchEmbed(...)` 的记忆专用提供商会继续使用现有的按文件批处理契约，除非它们的运行时显式设置 `sourceWideBatchEmbed: true`。这个选择加入项允许记忆宿主在一次 `batchEmbed(...)` 调用中提交来自多个脏记忆文件和已启用来源的块，直到达到宿主批处理限制。上传 JSONL 请求文件的批处理适配器还必须在达到上传大小上限以及请求数量上限前拆分提供商任务。提供商必须按与 `batch.chunks` 相同的顺序为每个输入块返回一个嵌入；当提供商期望文件本地批次或无法在更大的跨来源任务中保持输入顺序时，请省略该标志。

### 工具和命令

对于工具名称固定的简单纯工具插件，请使用 [`defineToolPlugin`](/zh-CN/plugins/tool-plugins)。对于混合插件或完全动态的工具注册，请直接使用 `api.registerTool(...)`。

| 方法                            | 注册内容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需或 `{ optional: true }`）     |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                        |

当智能体需要一条由命令拥有的简短路由提示时，插件命令可以设置 `agentPromptGuidance`。让这段文本只描述命令本身；不要向核心提示构建器添加提供商或插件专用策略。

指导条目可以是旧式字符串，适用于每个提示表面；也可以是结构化条目：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

结构化的 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已弃用别名。对于有意应用到所有表面的指导，请省略 `surfaces`。不要传入空的 `surfaces` 数组；它会被拒绝，以免意外丢失作用域后变成全局提示文本。

原生 Codex app-server 开发者指令比其他提示表面更严格：只有显式限定到 `codex_app_server` 的指导才会被提升到该更高优先级通道。为兼容性，旧式字符串指导和未限定作用域的结构化指导仍可用于非 Codex 提示表面。

### 基础设施

| 方法                                            | 注册内容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | 事件钩子                                                     |
| `api.registerHttpRoute(params)`                 | Gateway 网关 HTTP 端点                                       |
| `api.registerGatewayMethod(name, handler)`      | Gateway 网关 RPC 方法                                        |
| `api.registerGatewayDiscoveryService(service)`  | 本地 Gateway 网关设备发现公告器                              |
| `api.registerCli(registrar, opts?)`             | CLI 子命令                                                   |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的节点功能 CLI                            |
| `api.registerService(service)`                  | 后台服务                                                     |
| `api.registerInteractiveHandler(registration)`  | 交互式处理器                                                 |
| `api.registerAgentToolResultMiddleware(...)`    | 运行时工具结果中间件                                         |
| `api.registerMemoryPromptSupplement(builder)`   | 附加的记忆相邻提示部分                                       |
| `api.registerMemoryCorpusSupplement(adapter)`   | 附加的记忆搜索/读取语料库                                    |
| `api.registerHostedMediaResolver(resolver)`     | 浏览器风格托管媒体 URL 的解析器                              |
| `api.registerTextTransforms(transforms)`        | 插件拥有的提示/消息兼容性文本重写                            |
| `api.registerConfigMigration(migrate)`          | 插件运行时加载前运行的轻量配置迁移                           |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的导入器                                  |
| `api.registerAutoEnableProbe(probe)`            | 可自动启用此插件的配置探测                                   |
| `api.registerReload(registration)`              | 用于重载处理的重启/热重载/无操作配置前缀策略                 |
| `api.registerNodeHostCommand(command)`          | 暴露给已配对节点的命令处理器                                 |
| `api.registerNodeInvokePolicy(policy)`          | 节点调用命令的允许列表/审批策略                              |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的发现项收集器                     |

Telegram 交互式处理程序可以返回 `{ submitText }`，在处理程序成功后通过 Telegram 的常规入站智能体路径路由文本。当入站策略跳过文本或处理失败时，OpenClaw 会保留回调按钮，因此用户可以在阻塞条件变化后重试。此结果字段是 Telegram 专用的；其他渠道保留各自的交互式结果契约。

### 工作流插件的主机钩子

主机钩子是供需要参与主机生命周期的插件使用的 SDK 接缝，而不仅仅是添加一个提供商、渠道或工具。它们是通用契约；Plan Mode 可以使用它们，审批工作流、工作区策略门禁、后台监视器、设置向导和 UI 配套插件也可以使用。

| 方法                                                                                 | 它拥有的契约                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 插件拥有、与 JSON 兼容的会话状态，通过 Gateway 网关会话投影                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 持久的恰好一次上下文，注入到一个会话的下一次智能体轮次                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | 受清单门禁保护的可信预插件工具策略，可以阻止或重写工具参数                                                                        |
| `api.registerToolMetadata(...)`                                                      | 工具目录显示元数据，不更改工具实现                                                                                     |
| `api.registerCommand(...)`                                                           | 作用域化插件命令；命令结果可以设置 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支持 `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 面向会话、工具、运行、设置或标签页表面的 Control UI 贡献描述符                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重置、删除、重新加载路径上清理插件拥有的运行时资源的回调                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用于工作流状态和监视器的已清理事件订阅                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 按运行划分的插件临时状态，在终止运行生命周期中清除                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 插件拥有的调度器作业的清理元数据；不会调度工作或创建任务记录                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 仅内置的、由主机媒介的文件附件投递到活动的直接出站会话路由                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 仅内置的、由 Cron 支撑的定时会话轮次，以及基于标签的清理                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | 客户端可以通过 Gateway 网关分发的类型化会话动作                                                                                             |

`surface: "tab"` 描述符会向 Control UI 添加一个侧边栏标签页。活动插件的标签页描述符会在 Gateway 网关 hello（`controlUiTabs`）中通告给仪表板客户端，因此该标签页仅在插件启用时出现。内置插件可以为其标签页提供一等仪表板视图；其他插件可以将 `path` 设置为插件 HTTP 路由（参见 `api.registerHttpRoute(...)`），由仪表板在沙箱隔离框架中渲染。`icon` 是仪表板图标名称提示，`group` 选择侧边栏区段（`control` 或 `agent`），`order` 在插件标签页之间排序，`requiredScopes` 会对缺少这些操作员权限范围的连接隐藏标签页：

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

新插件代码使用分组命名空间：

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

等价的扁平方法仍作为面向现有插件的已弃用兼容别名提供。不要添加直接调用 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的新插件代码。

`scheduleSessionTurn(...)` 是基于 Gateway 网关 Cron 调度器的会话作用域便捷方法。Cron 拥有计时，并在轮次运行时创建后台任务记录；插件 SDK 只约束目标会话、插件拥有的命名和清理。当工作本身需要持久的多步骤 Task Flow 状态时，请在定时轮次内部使用 `api.runtime.tasks.managedFlows`。

这些契约有意拆分权限：

- 外部插件可以拥有会话扩展、UI 描述符、命令、工具元数据、下一轮次注入和常规钩子。
- 可信工具策略会在普通 `before_tool_call` 钩子之前运行，并受到主机信任。内置策略先运行；已安装插件策略需要显式启用，并且其本地 ID 必须出现在 `contracts.trustedToolPolicies` 中，然后按插件加载顺序运行。策略 ID 的作用域限定在注册它的插件内。
- 保留命令所有权仅限内置插件。外部插件应使用自己的命令名称或别名。
- `allowPromptInjection=false` 会禁用会修改提示的钩子，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、旧版 `before_agent_start` 中的提示字段，以及 `enqueueNextTurnInjection`。

非 Plan 使用方示例：

| 插件原型                     | 使用的钩子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 审批工作流                   | 会话扩展、命令继续、下一轮次注入、UI 描述符                                                            |
| 预算/工作区策略门禁          | 可信工具策略、工具元数据、会话投影                                                                                 |
| 后台生命周期监视器           | 运行时生命周期清理、智能体事件订阅、会话调度器所有权/清理、heartbeat 提示贡献、UI 描述符 |
| 设置或新手引导向导           | 会话扩展、作用域化命令、Control UI 描述符                                                                              |

<Note>
  保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终保持为 `operator.admin`，即使插件尝试分配更窄的 Gateway 网关方法作用域也是如此。插件拥有的方法优先使用插件专用前缀。
</Note>

<Accordion title="何时使用工具结果中间件">
  内置插件以及显式启用且具有匹配清单契约的已安装插件，在需要于工具执行后、运行时将结果回传给模型之前重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。这是面向诸如 tokenjuice 这类异步输出归约器的可信、运行时中立接缝。

插件必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，例如 `["openclaw", "codex"]`。没有该契约或未显式启用的已安装插件无法注册此中间件；不需要模型前工具结果时序的工作，应继续使用常规 OpenClaw 插件钩子。旧的仅嵌入式运行器扩展工厂注册路径已被移除。
</Accordion>

### Gateway 网关设备发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件在本地设备发现传输协议（例如 mDNS/Bonjour）上通告活动 Gateway 网关。当启用本地设备发现时，OpenClaw 会在 Gateway 网关启动期间调用该服务，传入当前 Gateway 网关端口和非机密 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的 `stop` 处理程序。

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

Gateway 网关设备发现插件不得将通告的 TXT 值视为机密或身份认证。设备发现只是路由提示；Gateway 网关认证和 TLS 固定仍然拥有信任。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类命令元数据：

- `commands`：注册器拥有的显式命令名称
- `descriptors`：解析时命令描述符，用于 CLI 帮助、路由和惰性插件 CLI 注册
- `parentPath`：嵌套命令组的可选父命令路径，例如 `["nodes"]`

对于配对节点功能，优先使用 `api.registerNodeCliFeature(registrar, opts?)`。它是 `api.registerCli(..., { parentPath: ["nodes"] })` 的一个小包装，并让诸如 `openclaw nodes canvas` 之类的命令成为显式的插件拥有节点功能。

如果你希望插件命令在常规根 CLI 路径中保持惰性加载，请提供覆盖该注册器暴露的每个顶级命令根的 `descriptors`。

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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

嵌套命令接收已解析的父命令作为 `program`：

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
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

仅在不需要延迟注册根 CLI 时，才单独使用 `commands`。
该预加载兼容路径仍受支持，但它不会安装由描述符支持、用于解析时延迟加载的占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 让插件拥有本地 AI CLI 后端的默认配置，例如 `claude-cli` 或 `my-cli`。

- 后端 `id` 会成为模型引用中的提供商前缀，例如 `my-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先。OpenClaw 会先将 `agents.defaults.cliBackends.<id>` 合并到插件默认值之上，然后再运行 CLI。
- 当后端需要在合并后执行兼容性重写时，使用 `normalizeConfig`（例如规范化旧的标志结构）。
- 对于属于 CLI 方言、按请求作用域改写 argv 的场景，使用 `resolveExecutionArgs`，例如将 OpenClaw 思考级别映射到原生 effort 标志。该钩子会接收 `ctx.executionMode`；使用 `"side-question"` 为临时 `/btw` 调用添加后端原生隔离标志。如果这些标志能可靠地为原本始终开启的 CLI 禁用原生工具，也请声明 `sideQuestionToolMode: "disabled"`。

有关端到端编写指南，请参阅
[CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。

### 独占槽位

| 方法                                       | 注册内容                                                                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能有一个处于活动状态）。当主机可以提供模型/提供商/模式诊断时，生命周期回调会收到 `runtimeSettings`；较旧的严格引擎会在不带该键的情况下重试。 |
| `api.registerMemoryCapability(capability)` | 统一记忆能力                                                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | 记忆提示词段构建器                                                                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆刷新计划解析器                                                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器                                                                                                                                                                         |

### 已弃用的记忆嵌入适配器

| 方法                                           | 注册内容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的记忆嵌入适配器 |

- `registerMemoryCapability` 是首选的独占记忆插件 API。
- `registerMemoryCapability` 也可以暴露 `publicArtifacts.listArtifacts(...)`，这样配套插件可以通过 `openclaw/plugin-sdk/memory-host-core` 使用导出的记忆工件，而不是访问某个特定记忆插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 是兼容旧版的独占记忆插件 API。
- `MemoryFlushPlan.model` 可以将刷新轮次固定到精确的 `provider/model` 引用，例如 `ollama/qwen3:8b`，而不继承活动的回退链。
- `registerMemoryEmbeddingProvider` 已弃用。新的嵌入提供商应使用 `api.registerEmbeddingProvider(...)` 和 `contracts.embeddingProviders`。
- 在迁移窗口期间，现有的记忆专用提供商会继续工作，但插件检查会将其报告为非内置插件的兼容性债务。

### 事件和生命周期

| 方法                                         | 作用           |
| -------------------------------------------- | -------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子 |
| `api.onConversationBindingResolved(handler)` | 对话绑定回调   |

参阅 [插件钩子](/zh-CN/plugins/hooks)，了解示例、常见钩子名称和守卫语义。

### 钩子决策语义

`before_install` 是插件运行时生命周期钩子，不是操作员安装策略表面。当允许/阻止决策必须覆盖 CLI 和由 Gateway 网关支持的安装或更新路径时，请使用 `security.installPolicy`。

- `before_tool_call`：返回 `{ block: true }` 是终止性决策。一旦任何处理程序设置它，优先级较低的处理程序会被跳过。
- `before_tool_call`：返回 `{ block: false }` 会被视为没有决策（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性决策。一旦任何处理程序设置它，优先级较低的处理程序会被跳过。
- `before_install`：返回 `{ block: false }` 会被视为没有决策（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性决策。一旦任何处理程序声明已分发，优先级较低的处理程序和默认模型分发路径会被跳过。
- `message_sending`：返回 `{ cancel: true }` 是终止性决策。一旦任何处理程序设置它，优先级较低的处理程序会被跳过。
- `message_sending`：返回 `{ cancel: false }` 会被视为没有决策（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当你需要入站线程/主题路由时，使用类型化的 `threadId` 字段。将 `metadata` 保留给特定渠道的额外信息。
- `message_sending`：在回退到特定渠道的 `metadata` 之前，先使用类型化的 `replyToId` / `threadId` 路由字段。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 网关拥有的启动状态，而不是依赖内部 `gateway:startup` 钩子。
- `cron_changed`：观察 Gateway 网关拥有的 cron 生命周期变化。在同步外部唤醒调度器时使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，并让 OpenClaw 作为到期检查和执行的事实来源。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 id                                                                                      |
| `api.name`               | `string`                  | 显示名称                                                                                     |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                             |
| `api.description`        | `string?`                 | 插件描述（可选）                                                                             |
| `api.source`             | `string`                  | 插件源路径                                                                                   |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                           |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活动内存运行时快照）                                                   |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专用配置                                            |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/zh-CN/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | 作用域化日志器（`debug`、`info`、`warn`、`error`）                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是轻量级的完整入口前启动/设置窗口                           |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                                   |

## 内部模块约定

在你的插件内，使用本地 barrel 文件进行内部导入：

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  切勿在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。内部导入应通过 `./api.ts` 或
  `./runtime-api.ts` 路由。SDK 路径仅是外部契约。
</Warning>

由 facade 加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts` 以及类似公共入口文件）在 OpenClaw 已运行时优先使用活动运行时配置快照。如果运行时快照尚不存在，它们会回退到磁盘上解析出的配置文件。打包后的内置插件 facade 应通过 OpenClaw 的插件 facade 加载器加载；直接从 `dist/extensions/...` 导入会绕过打包安装用于插件自有代码的清单和运行时 sidecar 检查。

当辅助工具有意提供商专用、且尚不适合放入通用 SDK 子路径时，提供商插件可以暴露一个狭窄的插件本地契约 barrel。内置示例：

- **Anthropic**：为 Claude beta-header 和 `service_tier` 流辅助工具提供公共 `api.ts` / `contract-api.ts` seam。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、默认模型辅助工具和实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器以及新手引导/配置辅助工具。

<Warning>
  扩展生产代码也应避免导入 `openclaw/plugin-sdk/<other-plugin>`。
  如果某个辅助工具确实共享，请将其提升到中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，
  或另一个面向能力的表面，而不是将两个插件耦合在一起。
</Warning>

## 相关

<CardGroup cols={2}>
  <Card title="入口点" icon="door-open" href="/zh-CN/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="运行时辅助工具" icon="gears" href="/zh-CN/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="设置和配置" icon="sliders" href="/zh-CN/plugins/sdk-setup">
    打包、清单和配置 schema。
  </Card>
  <Card title="测试" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试工具和 lint 规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用的接口面迁移。
  </Card>
  <Card title="插件内部机制" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深层架构和能力模型。
  </Card>
</CardGroup>
