---
read_when:
    - 你需要知道要从哪个 SDK 子路径导入
    - 你需要一份 OpenClawPluginApi 上所有注册方法的参考。
    - 你正在查找一个特定的 SDK 导出
sidebarTitle: Plugin SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-07-05T20:18:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aead8f60f1faf47f8a9bbdc6a889f5f3df7a264c6941119ece26bd26a55d25bf
    source_path: plugins/sdk-overview.md
    workflow: 16
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**要导入什么**以及**可以注册什么**的参考。

<Note>
  本页适用于在 OpenClaw 内部使用 `openclaw/plugin-sdk/*` 的插件作者。对于想要通过 Gateway 网关运行智能体的外部应用、脚本、仪表盘、CI 作业和 IDE 扩展，请改用
  [外部应用的 Gateway 网关集成](/zh-CN/gateway/external-apps)。
</Note>

<Tip>
想找操作指南？从[构建插件](/zh-CN/plugins/building-plugins)开始。渠道请使用[渠道插件](/zh-CN/plugins/sdk-channel-plugins)，模型提供商请使用[提供商插件](/zh-CN/plugins/sdk-provider-plugins)，本地 AI CLI 后端请使用 [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)，原生智能体执行器请使用 [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)，工具或生命周期钩子请使用[插件钩子](/zh-CN/plugins/hooks)。
</Tip>

## 导入约定

始终从具体子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、自包含的模块。这能保持启动快速，并避免循环依赖问题。对于渠道专用的入口/构建辅助工具，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 留给更宽泛的总括表面，以及 `buildChannelConfigSchema` 等共享辅助工具。

对于渠道配置，通过 `openclaw.plugin.json#channelConfigs` 发布渠道拥有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享 schema 原语和通用构建器。OpenClaw 的内置插件使用 `plugin-sdk/bundled-channel-config-schema` 来保留内置渠道 schema。已弃用的兼容性导出保留在 `plugin-sdk/channel-config-schema-legacy`；这两个内置 schema 子路径都不是新插件应采用的模式。

<Warning>
  不要导入带提供商或渠道品牌的便捷接缝（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在自己的 `api.ts` /
  `runtime-api.ts` 桶文件内组合通用 SDK 子路径；核心消费者应使用这些插件本地桶文件，或者在需求确实跨渠道时添加一个窄的通用 SDK 契约。

当一小部分内置插件辅助接缝已有跟踪的所有者用法时，它们仍会出现在生成的导出映射中。它们仅用于内置插件维护，不推荐作为新的第三方插件导入路径。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作为已弃用的兼容性门面保留，用于跟踪的所有者用法。不要把这些导入路径复制到新插件中；请改用注入的运行时辅助工具和通用渠道 SDK 子路径。
</Warning>

## 子路径参考

插件 SDK 以一组按领域分组的窄子路径暴露（插件入口、渠道、提供商、凭证、运行时、能力、记忆，以及保留的内置插件辅助工具）。完整目录（已分组并附链接）请参见[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；包导出会从公共子集生成，并扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的仓库本地测试/内部子路径。运行 `pnpm plugin-sdk:surface` 以审计公共导出数量。足够旧且未被内置扩展生产代码使用的已弃用公共子路径会在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中跟踪；宽泛的已弃用再导出桶文件会在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中跟踪。

## 注册 API

`register(api)` 回调会收到一个 `OpenClawPluginApi` 对象，其中包含这些方法：

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
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析                                                                |
| `api.registerTranscriptSourceProvider(...)`      | 实时或导入的会议转录来源                                                          |
| `api.registerImageGenerationProvider(...)`       | 图像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                                                                          |
| `api.registerWebFetchProvider(...)`              | Web 获取 / 抓取提供商                                                            |
| `api.registerWebSearchProvider(...)`             | Web 搜索                                                                         |
| `api.registerCompactionProvider(...)`            | 可插拔的转录压缩后端                                                              |

使用 `api.registerEmbeddingProvider(...)` 注册的嵌入提供商也必须列在插件清单的 `contracts.embeddingProviders` 中。这是用于可复用向量生成的通用嵌入表面。记忆搜索可以使用这个通用提供商表面。较旧的 `api.registerMemoryEmbeddingProvider(...)` 和 `contracts.memoryEmbeddingProviders` 接缝是在现有记忆专用提供商迁移期间保留的已弃用兼容性。

仍然暴露运行时 `batchEmbed(...)` 的记忆专用提供商会保留在现有的按文件批处理契约上，除非其运行时显式设置 `sourceWideBatchEmbed: true`。该选择启用项允许记忆宿主在一次 `batchEmbed(...)` 调用中提交来自多个脏记忆文件和已启用来源的分块，最多达到宿主批处理限制。上传 JSONL 请求文件的批处理适配器必须在达到上传大小上限以及请求数量上限之前拆分提供商作业。提供商必须按与 `batch.chunks` 相同的顺序为每个输入分块返回一个嵌入；当提供商预期按文件本地批处理，或无法在更大的跨来源作业中保留输入顺序时，请省略该标志。

### 工具和命令

对于具有固定工具名称的简单纯工具插件，请使用 [`defineToolPlugin`](/zh-CN/plugins/tool-plugins)。对于混合插件或完全动态的工具注册，请直接使用 `api.registerTool(...)`。

| 方法                           | 注册内容                                      |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需，或 `{ optional: true }`）   |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                        |

当智能体需要简短、由命令拥有的路由提示时，插件命令可以设置 `agentPromptGuidance`。让该文本围绕命令本身；不要向核心提示构建器添加提供商或插件专用策略。

引导条目可以是旧版字符串，此时会应用到每个提示表面；也可以是结构化条目：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

结构化 `surfaces` 可以包括 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已弃用别名。对于有意应用到所有表面的引导，请省略 `surfaces`。不要传入空的 `surfaces` 数组；它会被拒绝，以免意外丢失作用域后变成全局提示文本。

原生 Codex app-server 开发者指令比其他提示表面更严格：只有显式限定到 `codex_app_server` 的引导才会被提升到那个更高优先级通道。为保持兼容性，旧版字符串引导和未限定作用域的结构化引导仍可用于非 Codex 提示表面。

### 基础设施

| 方法                                            | 注册内容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | 事件钩子                                                     |
| `api.registerHttpRoute(params)`                 | Gateway 网关 HTTP 端点                                      |
| `api.registerGatewayMethod(name, handler)`      | Gateway 网关 RPC 方法                                       |
| `api.registerGatewayDiscoveryService(service)`  | 本地 Gateway 网关设备发现公告器                             |
| `api.registerCli(registrar, opts?)`             | CLI 子命令                                                   |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的节点功能 CLI                           |
| `api.registerService(service)`                  | 后台服务                                                     |
| `api.registerInteractiveHandler(registration)`  | 交互式处理器                                                 |
| `api.registerAgentToolResultMiddleware(...)`    | 运行时工具结果中间件                                         |
| `api.registerMemoryPromptSupplement(builder)`   | 增量的记忆相邻提示章节                                       |
| `api.registerMemoryCorpusSupplement(adapter)`   | 增量的记忆搜索/读取语料库                                    |
| `api.registerHostedMediaResolver(resolver)`     | 浏览器风格托管媒体 URL 的解析器                             |
| `api.registerTextTransforms(transforms)`        | 插件拥有的提示/消息兼容性文本重写                            |
| `api.registerConfigMigration(migrate)`          | 插件运行时加载前运行的轻量配置迁移                           |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的导入器                                  |
| `api.registerAutoEnableProbe(probe)`            | 可以自动启用此插件的配置探测                                 |
| `api.registerReload(registration)`              | 用于重载处理的重启/热重载/无操作配置前缀策略                 |
| `api.registerNodeHostCommand(command)`          | 暴露给已配对节点的命令处理器                                 |
| `api.registerNodeInvokePolicy(policy)`          | 节点调用命令的允许列表/审批策略                              |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的发现项收集器                     |

### 工作流插件的宿主钩子

Host hooks 是 Plugin SDK 的接缝，适用于需要参与主机生命周期的插件，而不只是添加提供商、渠道或工具。它们是通用契约；Plan Mode 可以使用它们，审批工作流、工作区策略门禁、后台监控器、设置向导和 UI 配套插件也可以使用。

| 方法                                                                                 | 它拥有的契约                                                                                                                                              |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 插件拥有的、JSON 兼容的会话状态，通过 Gateway 网关会话投射                                                                                                 |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 持久化的 exactly-once 上下文，注入到某个会话的下一次 Agent 轮次中                                                                                           |
| `api.registerTrustedToolPolicy(...)`                                                 | 受清单门控的可信预插件工具策略，可阻止或重写工具参数                                                                                                       |
| `api.registerToolMetadata(...)`                                                      | 工具目录显示元数据，不改变工具实现                                                                                                                         |
| `api.registerCommand(...)`                                                           | 有作用域的插件命令；命令结果可设置 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支持 `descriptionLocalizations`                         |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 面向会话、工具、运行、设置或标签页表面的 Control UI 贡献描述符                                                                                             |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重置/删除/重新加载路径中清理插件拥有的运行时资源的回调                                                                                                   |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 面向工作流状态和监控器的已净化事件订阅                                                                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次运行的插件临时状态，会在终止运行生命周期中清除                                                                                                         |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 插件拥有的调度器任务的清理元数据；不会调度工作或创建任务记录                                                                                               |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 仅内置插件可用的、由主机介导的文件附件投递，发送到活动的直接出站会话路由                                                                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 仅内置插件可用的、由 Cron 支持的定时会话轮次，以及基于标签的清理                                                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | 客户端可通过 Gateway 网关分发的类型化会话动作                                                                                                             |

`surface: "tab"` 描述符会向 Control UI 添加一个侧边栏标签页。活动插件的标签页描述符会在 Gateway 网关 hello（`controlUiTabs`）中公布给仪表盘客户端，因此标签页只会在插件启用时出现。内置插件可以为其标签页提供一等仪表盘视图；其他插件可以将 `path` 设置为插件 HTTP 路由（见 `api.registerHttpRoute(...)`），仪表盘会在沙箱隔离框架中渲染该路由。`icon` 是仪表盘图标名称提示，`group` 选择侧边栏分区（`control` 或 `agent`），`order` 对插件标签页排序，`requiredScopes` 会对缺少这些操作员权限范围的连接隐藏标签页：

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

新插件代码请使用分组命名空间：

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

等价的扁平方法仍作为已弃用的兼容别名提供给现有插件。不要添加直接调用 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的新插件代码。

`scheduleSessionTurn(...)` 是 Gateway 网关 Cron 调度器之上的会话作用域便捷接口。Cron 拥有计时，并在轮次运行时创建后台任务记录；Plugin SDK 只约束目标会话、插件拥有的命名和清理。当工作本身需要持久的多步骤 Task Flow 状态时，请在定时轮次中使用 `api.runtime.tasks.managedFlows`。

这些契约有意拆分权限：

- 外部插件可以拥有会话扩展、UI 描述符、命令、工具元数据、下一轮次注入和普通钩子。
- 可信工具策略在普通 `before_tool_call` 钩子之前运行，并受到主机信任。内置策略先运行；已安装插件策略需要显式启用，并且其本地 ID 必须位于 `contracts.trustedToolPolicies` 中，随后按插件加载顺序运行。策略 ID 的作用域限定在注册插件内。
- 保留命令所有权仅限内置插件。外部插件应使用自己的命令名或别名。
- `allowPromptInjection=false` 会禁用会改变提示词的钩子，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、旧版 `before_agent_start` 中的提示词字段，以及 `enqueueNextTurnInjection`。

非 Plan 消费方示例：

| 插件原型                     | 使用的钩子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 审批工作流                   | 会话扩展、命令续接、下一轮次注入、UI 描述符                                                                                            |
| 预算/工作区策略门禁          | 可信工具策略、工具元数据、会话投射                                                                                                     |
| 后台生命周期监控器           | 运行时生命周期清理、Agent 事件订阅、会话调度器所有权/清理、心跳提示词贡献、UI 描述符                                                    |
| 设置或新手引导向导           | 会话扩展、有作用域的命令、Control UI 描述符                                                                                            |

<Note>
  保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持 `operator.admin`，即使插件尝试分配更窄的 gateway 方法作用域也是如此。插件拥有的方法应优先使用插件专属前缀。
</Note>

<Accordion title="何时使用工具结果中间件">
  当内置插件和具有匹配清单契约且已显式启用的已安装插件需要在执行后、运行时将工具结果反馈给模型前重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。这是面向异步输出归约器（如 tokenjuice）的可信、运行时中立接缝。

插件必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，例如 `["openclaw", "codex"]`。没有该契约或未显式启用的已安装插件无法注册此中间件；对于不需要模型前工具结果时序的工作，请继续使用普通 OpenClaw 插件钩子。旧的仅嵌入式 runner 的扩展工厂注册路径已移除。
</Accordion>

### Gateway 网关设备发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件在 mDNS/Bonjour 等本地设备发现传输协议上公布活动的 Gateway 网关。当本地设备发现启用时，OpenClaw 会在 Gateway 网关启动期间调用该服务，传入当前 Gateway 网关端口和非机密 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的 `stop` 处理程序。

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

Gateway 网关设备发现插件不得将公布的 TXT 值视为机密或身份验证。设备发现是路由提示；Gateway 网关身份验证和 TLS 固定仍然拥有信任。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类命令元数据：

- `commands`：注册器拥有的显式命令名
- `descriptors`：解析阶段命令描述符，用于 CLI 帮助、路由和懒加载插件 CLI 注册
- `parentPath`：嵌套命令组的可选父命令路径，例如 `["nodes"]`

对于成对节点功能，优先使用 `api.registerNodeCliFeature(registrar, opts?)`。它是 `api.registerCli(..., { parentPath: ["nodes"] })` 之上的一个小包装，并使 `openclaw nodes canvas` 等命令成为显式插件拥有的节点功能。

如果你希望插件命令在普通根 CLI 路径中保持懒加载，请提供覆盖该注册器暴露的每个顶层命令根的 `descriptors`。

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

嵌套命令会以 `program` 接收已解析的父命令：

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

仅在不需要延迟根 CLI 注册时，才单独使用 `commands`。
该即时兼容路径仍受支持，但它不会安装由描述符支撑的占位符来进行解析时延迟加载。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有本地 AI CLI 后端（例如 `claude-cli` 或 `my-cli`）的默认配置。

- 后端 `id` 会成为模型引用中的提供商前缀，例如 `my-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先。OpenClaw 会先将 `agents.defaults.cliBackends.<id>` 合并到插件默认值之上，然后再运行 CLI。
- 当后端需要在合并后进行兼容性重写时，请使用 `normalizeConfig`（例如规范化旧的 flag 结构）。
- 对于属于 CLI 方言的请求级 argv 重写，请使用 `resolveExecutionArgs`，例如将 OpenClaw 思考级别映射到原生 effort flag。该钩子会收到 `ctx.executionMode`；使用 `"side-question"` 为临时 `/btw` 调用添加后端原生隔离 flag。如果这些 flag 能可靠地为原本始终启用的 CLI 禁用原生工具，也请声明 `sideQuestionToolMode: "disabled"`。

如需端到端编写指南，请参阅
[CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。

### 独占槽位

| 方法                                       | 注册内容                                                                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只能激活一个）。当宿主可以提供模型/提供商/模式诊断信息时，生命周期回调会收到 `runtimeSettings`；较旧的严格引擎会在不带该键的情况下重试。 |
| `api.registerMemoryCapability(capability)` | 统一记忆能力                                                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | 记忆提示词区段构建器                                                                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆 flush 计划解析器                                                                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器                                                                                                                                                                         |

### 已弃用的记忆嵌入适配器

| 方法                                           | 注册内容                             |
| ---------------------------------------------- | ------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活动插件的记忆嵌入适配器 |

- `registerMemoryCapability` 是首选的独占记忆插件 API。
- `registerMemoryCapability` 也可以暴露 `publicArtifacts.listArtifacts(...)`，以便配套插件通过 `openclaw/plugin-sdk/memory-host-core` 使用导出的记忆产物，而不是深入某个特定记忆插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 是兼容旧版的独占记忆插件 API。
- `MemoryFlushPlan.model` 可以将 flush 轮次固定到精确的 `provider/model` 引用，例如 `ollama/qwen3:8b`，而不继承活动的 fallback 链。
- `registerMemoryEmbeddingProvider` 已弃用。新的嵌入提供商应使用 `api.registerEmbeddingProvider(...)` 和 `contracts.embeddingProviders`。
- 在迁移窗口期间，现有记忆专用提供商会继续工作，但插件检查会将其报告为非内置插件的兼容性债务。

### 事件和生命周期

| 方法                                         | 作用                 |
| -------------------------------------------- | -------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子   |
| `api.onConversationBindingResolved(handler)` | 对话绑定回调         |

有关示例、常见钩子名称和保护语义，请参阅 [插件钩子](/zh-CN/plugins/hooks)。

### 钩子决策语义

`before_install` 是插件运行时生命周期钩子，而不是操作员安装策略表面。当允许/阻止决策必须覆盖 CLI 和由 Gateway 网关支撑的安装或更新路径时，请使用 `security.installPolicy`。

- `before_tool_call`：返回 `{ block: true }` 是终止性的。一旦任何处理程序设置它，较低优先级的处理程序会被跳过。
- `before_tool_call`：返回 `{ block: false }` 会被视为没有决策（等同于省略 `block`），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性的。一旦任何处理程序设置它，较低优先级的处理程序会被跳过。
- `before_install`：返回 `{ block: false }` 会被视为没有决策（等同于省略 `block`），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性的。一旦任何处理程序声明已分发，较低优先级的处理程序和默认模型分发路径会被跳过。
- `message_sending`：返回 `{ cancel: true }` 是终止性的。一旦任何处理程序设置它，较低优先级的处理程序会被跳过。
- `message_sending`：返回 `{ cancel: false }` 会被视为没有决策（等同于省略 `cancel`），而不是覆盖。
- `message_received`：当你需要入站线程/话题路由时，请使用类型化的 `threadId` 字段。将 `metadata` 保留给渠道特定的额外信息。
- `message_sending`：在回退到渠道特定的 `metadata` 之前，请先使用类型化的 `replyToId` / `threadId` 路由字段。
- `gateway_start`：请使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 网关拥有的启动状态，而不是依赖内部 `gateway:startup` 钩子。
- `cron_changed`：观察 Gateway 网关拥有的 cron 生命周期变更。同步外部唤醒调度器时，请使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，并让 OpenClaw 作为到期检查和执行的事实来源。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                           |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 id                                                                                        |
| `api.name`               | `string`                  | 显示名称                                                                                       |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                               |
| `api.description`        | `string?`                 | 插件描述（可选）                                                                               |
| `api.source`             | `string`                  | 插件源路径                                                                                     |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                             |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活动的内存中运行时快照）                                                 |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专用配置                                              |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/zh-CN/plugins/sdk-runtime)                                                         |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`）                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是轻量级的完整入口前启动/设置窗口                              |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                                     |

## 内部模块约定

在你的插件中，对内部导入使用本地 barrel 文件：

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  切勿在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>` 导入你自己的插件。请通过 `./api.ts` 或 `./runtime-api.ts` 路由内部导入。SDK 路径仅是外部契约。
</Warning>

通过 facade 加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）会在 OpenClaw 已运行时优先使用活动运行时配置快照。如果尚无运行时快照，它们会回退到磁盘上解析到的配置文件。打包后的内置插件 facade 应通过 OpenClaw 的插件 facade 加载器加载；直接从 `dist/extensions/...` 导入会绕过打包安装用于插件拥有代码的清单和运行时 sidecar 检查。

当辅助工具有意限定为提供商专用，并且尚不属于通用 SDK 子路径时，提供商插件可以暴露一个窄的插件本地契约 barrel。内置示例：

- **Anthropic**：面向 Claude beta-header 和 `service_tier` 流辅助工具的公共 `api.ts` / `contract-api.ts` 接缝。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、默认模型辅助工具和实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器以及新手引导/配置辅助工具。

<Warning>
  扩展生产代码也应避免 `openclaw/plugin-sdk/<other-plugin>` 导入。如果某个辅助工具确实是共享的，请将其提升到中立的 SDK 子路径，例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或另一个以能力为导向的表面，而不是将两个插件耦合在一起。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/zh-CN/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/zh-CN/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="Setup and config" icon="sliders" href="/zh-CN/plugins/sdk-setup">
    打包、清单和配置 schema。
  </Card>
  <Card title="Testing" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试实用工具和 lint 规则。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用的表面迁移。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入架构和能力模型。
  </Card>
</CardGroup>
