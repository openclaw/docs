---
read_when:
    - 你需要知道要从哪个 SDK 子路径导入
    - 你需要一份关于 OpenClawPluginApi 上所有注册方法的参考。
    - 你正在查找某个特定的 SDK 导出
sidebarTitle: Plugin SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-07-05T11:31:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00c9ba90e5bef8a08da3a32ee7178c59da7b494d856b22c70a786e2ae735d6f8
    source_path: plugins/sdk-overview.md
    workflow: 16
---

插件 SDK 是插件与核心之间的类型化契约。本页是关于**应导入什么**以及**可以注册什么**的参考。

<Note>
  本页面面向在 OpenClaw 内部使用 `openclaw/plugin-sdk/*` 的插件作者。对于想通过 Gateway 网关运行智能体的外部应用、脚本、仪表盘、CI 作业和 IDE 扩展，请改用
  [外部应用的 Gateway 网关集成](/zh-CN/gateway/external-apps)。
</Note>

<Tip>
想找操作指南？从 [Building plugins](/zh-CN/plugins/building-plugins) 开始。渠道请使用 [Channel plugins](/zh-CN/plugins/sdk-channel-plugins)，模型提供商请使用 [Provider plugins](/zh-CN/plugins/sdk-provider-plugins)，本地 AI CLI 后端请使用 [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)，原生智能体执行器请使用 [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)，工具或生命周期钩子请使用 [Plugin hooks](/zh-CN/plugins/hooks)。
</Tip>

## 导入约定

始终从具体子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、自包含的模块。这会保持启动快速，并防止循环依赖问题。对于渠道专用的入口/构建辅助函数，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 留给更宽泛的总括表面和共享辅助函数，例如 `buildChannelConfigSchema`。

对于渠道配置，请通过 `openclaw.plugin.json#channelConfigs` 发布渠道拥有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享 schema 原语和通用构建器。OpenClaw 的内置插件使用 `plugin-sdk/bundled-channel-config-schema` 来保留内置渠道 schema。已弃用的兼容性导出保留在 `plugin-sdk/channel-config-schema-legacy` 上；这两个内置 schema 子路径都不是新插件应遵循的模式。

<Warning>
  不要导入带有提供商或渠道品牌的便利接缝（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在自己的 `api.ts` /
  `runtime-api.ts` 桶文件内组合通用 SDK 子路径；核心消费者应使用这些插件本地桶文件，或在需求确实跨渠道时添加一个狭窄的通用 SDK 契约。

少量内置插件辅助接缝在存在已跟踪的所有者用法时，仍会出现在生成的导出映射中。它们仅用于内置插件维护，不推荐作为新的第三方插件导入路径。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作为已弃用的兼容性门面保留，用于已跟踪的所有者用法。不要将这些导入路径复制到新插件中；请改用注入的运行时辅助函数和通用渠道 SDK 子路径。
</Warning>

## 子路径参考

插件 SDK 作为一组按领域分组的狭窄子路径暴露（插件入口、渠道、提供商、凭证、运行时、能力、记忆，以及保留的内置插件辅助函数）。完整目录（已分组并带链接）见
[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。

编译器入口点清单位于
`scripts/lib/plugin-sdk-entrypoints.json`；包导出会在减去
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的仓库本地测试/内部子路径后，从公共子集生成。运行
`pnpm plugin-sdk:surface` 来审计公共导出数量。足够旧且未被内置扩展生产代码使用的已弃用公共子路径，会在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中跟踪；宽泛的已弃用再导出桶文件会在
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中跟踪。

## 注册 API

`register(api)` 回调会接收一个包含以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                             | 注册内容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM）                                                                  |
| `api.registerModelCatalogProvider(...)`          | 文本和媒体生成的模型目录行                                                       |
| `api.registerAgentHarness(...)`                  | [实验性](/zh-CN/plugins/sdk-agent-harness) 原生智能体执行器（Codex、Copilot）           |
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
| `api.registerWebSearchProvider(...)`             | Web 搜索                                                                          |
| `api.registerCompactionProvider(...)`            | 可插拔的转录压缩后端                                                              |

使用 `api.registerEmbeddingProvider(...)` 注册的嵌入提供商，也必须列在插件清单的 `contracts.embeddingProviders` 中。这是用于可复用向量生成的通用嵌入表面。记忆搜索可以消费这个通用提供商表面。较旧的 `api.registerMemoryEmbeddingProvider(...)` 和 `contracts.memoryEmbeddingProviders` 接缝是已弃用的兼容性接缝，用于现有记忆专用提供商迁移期间。

仍暴露运行时 `batchEmbed(...)` 的记忆专用提供商会继续使用现有的按文件批处理契约，除非其运行时显式设置 `sourceWideBatchEmbed: true`。这个选择加入项允许记忆主机在一次 `batchEmbed(...)` 调用中提交来自多个脏记忆文件和已启用来源的分块，直到达到主机批处理限制。上传 JSONL 请求文件的批处理适配器，必须在达到其上传大小上限以及请求数量上限之前拆分提供商作业。提供商必须按与 `batch.chunks` 相同的顺序，为每个输入分块返回一个嵌入；当提供商期望文件本地批次，或无法在更大的来源范围作业中保持输入顺序时，请省略该标志。

### 工具和命令

对于工具名称固定的简单纯工具插件，请使用 [`defineToolPlugin`](/zh-CN/plugins/tool-plugins)。对于混合插件或完全动态的工具注册，请直接使用 `api.registerTool(...)`。

| 方法                            | 注册内容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必需或 `{ optional: true }`）     |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                        |

当智能体需要一条简短的、由命令拥有的路由提示时，插件命令可以设置 `agentPromptGuidance`。请让该文本只描述命令本身；不要向核心提示构建器添加提供商或插件专用策略。

指引条目可以是旧版字符串，这类字符串会应用到每个提示表面；也可以是结构化条目：

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

结构化 `surfaces` 可以包含 `openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend` 或 `subagent`。`pi_main` 仍是 `openclaw_main` 的已弃用别名。对于有意面向全部表面的指引，请省略 `surfaces`。不要传入空的 `surfaces` 数组；它会被拒绝，避免意外丢失范围后变成全局提示文本。

原生 Codex app-server 开发者指令比其他提示表面更严格：只有显式限定到 `codex_app_server` 的指引才会被提升到那个更高优先级通道。出于兼容性，旧版字符串指引和未限定范围的结构化指引仍可用于非 Codex 提示表面。

### 基础设施

| 方法                                            | 注册内容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | 事件钩子                                                     |
| `api.registerHttpRoute(params)`                 | Gateway 网关 HTTP 端点                                       |
| `api.registerGatewayMethod(name, handler)`      | Gateway 网关 RPC 方法                                        |
| `api.registerGatewayDiscoveryService(service)`  | 本地 Gateway 网关发现通告器                                  |
| `api.registerCli(registrar, opts?)`             | CLI 子命令                                                   |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 下的节点功能 CLI                            |
| `api.registerService(service)`                  | 后台服务                                                     |
| `api.registerInteractiveHandler(registration)`  | 交互式处理器                                                 |
| `api.registerAgentToolResultMiddleware(...)`    | 运行时工具结果中间件                                         |
| `api.registerMemoryPromptSupplement(builder)`   | 增量式记忆相邻提示段                                         |
| `api.registerMemoryCorpusSupplement(adapter)`   | 增量式记忆搜索/读取语料库                                    |
| `api.registerHostedMediaResolver(resolver)`     | 浏览器风格托管媒体 URL 的解析器                              |
| `api.registerTextTransforms(transforms)`        | 插件拥有的提示/消息兼容性文本重写                            |
| `api.registerConfigMigration(migrate)`          | 在插件运行时加载前运行的轻量级配置迁移                       |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 的导入器                                  |
| `api.registerAutoEnableProbe(probe)`            | 可自动启用此插件的配置探测                                   |
| `api.registerReload(registration)`              | 用于重载处理的重启/热重载/无操作配置前缀策略                 |
| `api.registerNodeHostCommand(command)`          | 暴露给已配对节点的命令处理器                                 |
| `api.registerNodeInvokePolicy(policy)`          | 节点调用命令的允许列表/审批策略                              |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 的发现项收集器                     |

### 工作流插件的主机钩子

主机钩子是 SDK 接缝，适用于需要参与主机生命周期的插件，而不是只添加一个提供商、渠道或工具。它们是通用契约；计划模式可以使用它们，审批工作流、工作区策略门控、后台监控器、设置向导和 UI 配套插件也可以使用它们。

| 方法                                                                               | 它拥有的契约                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | 插件拥有的、兼容 JSON 的会话状态，通过 Gateway 网关会话投射                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 持久化的精确一次上下文，注入到一个会话的下一次智能体轮次中                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | 由插件清单门控的受信任预插件工具策略，可阻止或重写工具参数                                                                        |
| `api.registerToolMetadata(...)`                                                      | 工具目录显示元数据，不更改工具实现                                                                                     |
| `api.registerCommand(...)`                                                           | 作用域限定的插件命令；命令结果可以设置 `continueAgent: true` 或 `suppressReply: true`；Discord 原生命令支持 `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 用于会话、工具、运行或设置界面的 Control UI 贡献描述符                                                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 在重置/删除/重载路径上清理插件拥有的运行时资源的回调                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用于工作流状态和监控器的已净化事件订阅                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次运行的插件临时状态，会在终端运行生命周期中清除                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | 插件拥有的调度器任务的清理元数据；不调度工作，也不创建任务记录                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 仅限内置的、由主机中介的文件附件递送，发送到活动的直接出站会话路由                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 仅限内置的、由 Cron 支持的定时会话轮次，以及基于标签的清理                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | 客户端可通过 Gateway 网关分发的类型化会话操作                                                                                             |

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

等价的扁平方法仍作为已弃用的兼容别名提供给现有插件。不要添加调用 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的新插件代码。

`scheduleSessionTurn(...)` 是基于 Gateway 网关 Cron 调度器的会话作用域便捷封装。Cron 拥有定时，并在轮次运行时创建后台任务记录；插件 SDK 只约束目标会话、插件拥有的命名和清理。当工作本身需要持久的多步骤 Task Flow 状态时，请在定时轮次中使用 `api.runtime.tasks.managedFlows`。

这些契约有意拆分权限：

- 外部插件可以拥有会话扩展、UI 描述符、命令、工具元数据、下一轮注入和常规钩子。
- 受信任工具策略在普通 `before_tool_call` 钩子之前运行，并且受主机信任。内置策略先运行；已安装插件策略需要显式启用，并在 `contracts.trustedToolPolicies` 中列出其本地 ID，然后按插件加载顺序运行。策略 ID 的作用域限定为注册它的插件。
- 保留命令所有权仅限内置插件。外部插件应使用自己的命令名称或别名。
- `allowPromptInjection=false` 会禁用修改提示词的钩子，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、旧版 `before_agent_start` 的提示词字段，以及 `enqueueNextTurnInjection`。

非计划模式使用方示例：

| 插件原型             | 使用的钩子                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 审批工作流            | 会话扩展、命令继续、下一轮注入、UI 描述符                                                            |
| 预算/工作区策略门控 | 受信任工具策略、工具元数据、会话投射                                                                                 |
| 后台生命周期监控器 | 运行时生命周期清理、智能体事件订阅、会话调度器所有权/清理、心跳提示词贡献、UI 描述符 |
| 设置或新手引导向导   | 会话扩展、作用域限定命令、Control UI 描述符                                                                              |

<Note>
  保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终保持 `operator.admin`，即使插件尝试分配更窄的 Gateway 网关方法作用域也是如此。插件拥有的方法优先使用插件特定前缀。
</Note>

<Accordion title="When to use tool-result middleware">
  内置插件以及显式启用且具备匹配插件清单契约的已安装插件，在需要于执行后、运行时将工具结果反馈给模型前重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。这是用于 tokenjuice 等异步输出规约器的受信任、运行时中立接缝。

插件必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，例如 `["openclaw", "codex"]`。没有该契约或未显式启用的已安装插件不能注册此中间件；对于不需要模型前工具结果时序的工作，请继续使用普通 OpenClaw 插件钩子。旧的仅限嵌入式运行器的扩展工厂注册路径已移除。
</Accordion>

### Gateway 网关发现注册

`api.registerGatewayDiscoveryService(...)` 允许插件在本地发现传输协议（如 mDNS/Bonjour）上通告活动的 Gateway 网关。启用本地发现时，OpenClaw 会在 Gateway 网关启动期间调用该服务，传入当前 Gateway 网关端口和非机密 TXT 提示数据，并在 Gateway 网关关闭期间调用返回的 `stop` 处理器。

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

Gateway 网关发现插件不得将通告的 TXT 值视为机密或认证。设备发现只是路由提示；Gateway 网关认证和 TLS 固定仍然拥有信任。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类命令元数据：

- `commands`：注册器拥有的显式命令名称
- `descriptors`：解析时命令描述符，用于 CLI 帮助、路由和懒加载插件 CLI 注册
- `parentPath`：嵌套命令组的可选父命令路径，例如 `["nodes"]`

对于配对节点功能，优先使用 `api.registerNodeCliFeature(registrar, opts?)`。它是 `api.registerCli(..., { parentPath: ["nodes"] })` 的小型封装，并让 `openclaw nodes canvas` 等命令成为显式的插件拥有节点功能。

如果你希望插件命令在正常根 CLI 路径中保持懒加载，请提供覆盖该注册器暴露的每个顶级命令根的 `descriptors`。

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

只有在不需要懒加载根 CLI 注册时，才单独使用 `commands`。该急切兼容路径仍受支持，但它不会安装由描述符支持、用于解析时懒加载的占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有本地 AI CLI 后端（如 `claude-cli` 或 `my-cli`）的默认配置。

- 后端 `id` 会成为模型引用中的提供商前缀，例如 `my-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的形状。
- 用户配置仍然优先。OpenClaw 会先将 `agents.defaults.cliBackends.<id>` 合并到
  插件默认值之上，然后再运行 CLI。
- 当后端需要在合并后进行兼容性重写时，使用 `normalizeConfig`
  （例如规范化旧的标志形状）。
- 对于属于 CLI 方言的请求范围 argv 重写，使用 `resolveExecutionArgs`，
  例如将 OpenClaw 思考级别映射到原生 effort
  标志。该钩子会接收 `ctx.executionMode`；使用 `"side-question"` 为临时 `/btw`
  调用添加后端原生隔离标志。如果这些标志能可靠地为原本始终开启的 CLI 禁用原生工具，
  也请声明 `sideQuestionToolMode: "disabled"`。

有关端到端创作指南，请参阅
[CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。

### 独占插槽

| 方法                                       | 注册内容                                                                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只激活一个）。当宿主可以提供模型/提供商/模式诊断信息时，生命周期回调会接收 `runtimeSettings`；较旧的严格引擎会在没有该键的情况下重试。 |
| `api.registerMemoryCapability(capability)` | 统一记忆能力                                                                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | 记忆提示词区段构建器                                                                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆刷写计划解析器                                                                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器                                                                                                                                                                                 |

### 已弃用的记忆嵌入适配器

| 方法                                           | 注册内容                         |
| ---------------------------------------------- | -------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活跃插件的记忆嵌入适配器 |

- `registerMemoryCapability` 是首选的独占记忆插件 API。
- `registerMemoryCapability` 也可以公开 `publicArtifacts.listArtifacts(...)`，
  让配套插件通过 `openclaw/plugin-sdk/memory-host-core` 使用导出的记忆工件，
  而不必进入某个特定记忆插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是兼容旧版的独占记忆插件 API。
- `MemoryFlushPlan.model` 可以将刷写轮次固定到精确的 `provider/model`
  引用，例如 `ollama/qwen3:8b`，而不继承活跃的回退链。
- `registerMemoryEmbeddingProvider` 已弃用。新的嵌入提供商
  应使用 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`。
- 现有的记忆专用提供商会在迁移窗口期间继续工作，
  但插件检查会将其报告为非内置插件的兼容性债务。

### 事件和生命周期

| 方法                                         | 作用             |
| -------------------------------------------- | ---------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期钩子 |
| `api.onConversationBindingResolved(handler)` | 对话绑定回调     |

参阅 [插件钩子](/zh-CN/plugins/hooks)，了解示例、常见钩子名称和守卫
语义。

### 钩子决策语义

`before_install` 是插件运行时生命周期钩子，不是操作员安装
策略表面。当允许/阻止决策必须覆盖 CLI 和 Gateway 网关支撑的安装或更新路径时，
请使用 `security.installPolicy`。

- `before_tool_call`：返回 `{ block: true }` 是终止性的。一旦任何处理器设置它，较低优先级的处理器会被跳过。
- `before_tool_call`：返回 `{ block: false }` 会被视为没有决策（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性的。一旦任何处理器设置它，较低优先级的处理器会被跳过。
- `before_install`：返回 `{ block: false }` 会被视为没有决策（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性的。一旦任何处理器声明已分派，较低优先级的处理器和默认模型分派路径会被跳过。
- `message_sending`：返回 `{ cancel: true }` 是终止性的。一旦任何处理器设置它，较低优先级的处理器会被跳过。
- `message_sending`：返回 `{ cancel: false }` 会被视为没有决策（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当你需要入站线程/话题路由时，使用类型化的 `threadId` 字段。将 `metadata` 保留给渠道特定的额外信息。
- `message_sending`：先使用类型化的 `replyToId` / `threadId` 路由字段，再回退到渠道特定的 `metadata`。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 网关拥有的启动状态，而不是依赖内部 `gateway:startup` 钩子。
- `cron_changed`：观察 Gateway 网关拥有的 cron 生命周期变更。同步外部唤醒调度器时使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，并让 OpenClaw 作为到期检查和执行的事实来源。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                      |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 id                                                                                   |
| `api.name`               | `string`                  | 显示名称                                                                                  |
| `api.version`            | `string?`                 | 插件版本（可选）                                                                          |
| `api.description`        | `string?`                 | 插件描述（可选）                                                                          |
| `api.source`             | `string`                  | 插件源路径                                                                                |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                                                        |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活跃的内存中运行时快照）                                            |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件特定配置                                         |
| `api.runtime`            | `PluginRuntime`           | [运行时帮助器](/zh-CN/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是轻量级的完整入口前启动/设置窗口                         |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                                                |

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
  切勿在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。请通过 `./api.ts` 或
  `./runtime-api.ts` 路由内部导入。SDK 路径只属于外部契约。
</Warning>

通过 facade 加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及类似公共入口文件）在 OpenClaw 已经运行时，
优先使用活跃的运行时配置快照。如果运行时快照尚不存在，它们会回退到磁盘上解析出的配置文件。
打包后的内置插件 facade 应通过 OpenClaw 的插件 facade 加载器加载；
直接从 `dist/extensions/...` 导入会绕过打包安装用于插件拥有代码的清单
和运行时 sidecar 检查。

当帮助器有意为某个提供商专用、且尚不属于通用 SDK
子路径时，提供商插件可以公开一个狭窄的插件本地契约 barrel。内置示例：

- **Anthropic**：用于 Claude beta-header 和 `service_tier`
  流帮助器的公共 `api.ts` / `contract-api.ts` 边界。
- **`@openclaw/openai-provider`**：`api.ts` 导出提供商构建器、
  默认模型帮助器和实时提供商构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出提供商构建器
  以及新手引导/配置帮助器。

<Warning>
  扩展生产代码也应避免 `openclaw/plugin-sdk/<other-plugin>`
  导入。如果某个帮助器确实是共享的，请将其提升到中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或另一个
  面向能力的表面，而不是把两个插件耦合在一起。
</Warning>

## 相关

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
    从已弃用表面迁移。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入架构和能力模型。
  </Card>
</CardGroup>
